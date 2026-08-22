"""Router audit — jalur utama aplikasi.

Satu koordinat masuk, satu laporan risiko lengkap keluar.
"""

import asyncio
import logging
import os
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, HTTPException

import db
from data.constants import INDONESIA_BOUNDS
from models import AuditRequest, AuditResult
from services import completeness, external, scoring
from services import pbg_checklist as pbg
from services import ai as ai_service
from services.geotech import geotech_profile
from services.location import LocationClassification, classify_location

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["audit"])

# Cache keputusan penolakan per titik (~110 m grid) supaya percobaan ulang di
# laut / luar negeri yang sama ditolak instan tanpa panggilan jaringan lagi.
_REJECTED_CACHE: dict[tuple[float, float], tuple[str, str]] = {}
_REJECTED_CACHE_MAX = 1024

# Cache hasil audit sukses per titik (~110 m grid). Engine-nya deterministik,
# jadi koordinat yang sama dalam jangka pendek tidak perlu mengulang 11+
# panggilan sumber luar. Data volatil (cuaca/AQI live) hanya menyentuh field
# lingkungan; TTL membatasi usia staleness-nya.
_AUDIT_CACHE: dict[tuple[float, float], tuple[float, dict]] = {}
_AUDIT_CACHE_MAX = 512
_AUDIT_CACHE_TTL_S = float(os.getenv("AUDIT_CACHE_TTL_SECONDS", "600"))


def _within_indonesia(lat: float, lon: float) -> bool:
    b = INDONESIA_BOUNDS
    return b["lat_min"] <= lat <= b["lat_max"] and b["lon_min"] <= lon <= b["lon_max"]


def _cache_key(lat: float, lon: float) -> tuple[float, float]:
    return (round(lat, 3), round(lon, 3))


def _remember_rejection(key: tuple[float, float], location: LocationClassification) -> None:
    if len(_REJECTED_CACHE) >= _REJECTED_CACHE_MAX:
        _REJECTED_CACHE.pop(next(iter(_REJECTED_CACHE)))
    _REJECTED_CACHE[key] = (location.status, location.reason)


def _audit_cache_get(key: tuple[float, float]) -> Optional[dict]:
    entry = _AUDIT_CACHE.get(key)
    if entry is None:
        return None
    stored_at, payload = entry
    if time.monotonic() - stored_at > _AUDIT_CACHE_TTL_S:
        _AUDIT_CACHE.pop(key, None)
        return None
    return payload


def _audit_cache_store(key: tuple[float, float], payload: dict) -> None:
    if len(_AUDIT_CACHE) >= _AUDIT_CACHE_MAX:
        _AUDIT_CACHE.pop(next(iter(_AUDIT_CACHE)))
    _AUDIT_CACHE[key] = (time.monotonic(), payload)


def _spawn_prefetch(result: AuditResult) -> None:
    """Hangatkan cache naratif AI di latar belakang.

    Saat pengguna membuka panel AI beberapa detik kemudian, naratif sudah
    tersimpan di ai_narratives dan permintaannya dijawab <100 ms. Kegagalan
    prefetch tidak berdampak apa pun ke respons audit.
    """

    async def _warm() -> None:
        await ai_service.prefetch_narrative(result, lang="id")

    db.track_write_task(asyncio.create_task(_warm()))


def _raise_for_location(location: LocationClassification) -> None:
    if location.status == "out_of_scope":
        raise HTTPException(status_code=422, detail=location.reason)
    if location.status == "not_buildable":
        raise HTTPException(
            status_code=422,
            detail="Lokasi tidak dapat diaudit sebagai lahan bangunan: " + location.reason,
        )
    if location.status == "insufficient_data":
        raise HTTPException(status_code=503, detail=location.reason)


async def _preflight_gate(lat: float, lon: float) -> tuple[dict, Optional[float], LocationClassification]:
    """Tolak cepat koordinat perairan / luar Indonesia sebelum audit penuh.

    Hanya satu panggilan geocode + elevasi; sumber audit lain tidak disentuh.
    `insufficient_data` sengaja tidak di-cache karena bisa jadi geocoder yang
    sedang gagal, bukan lokasinya yang bermasalah. Klasifikasi gerbang
    dikembalikan agar tidak dihitung ulang setelah fetch (item ray-casting).
    """
    key = _cache_key(lat, lon)
    cached = _REJECTED_CACHE.get(key)
    if cached is not None:
        status, reason = cached
        code = 503 if status == "insufficient_data" else 422
        raise HTTPException(status_code=code, detail=reason)

    geocode, elevation, _failed = await external.preflight_location(lat, lon)
    location = classify_location(lat, lon, geocode, elevation)
    if location.status != "valid_land":
        if location.status != "insufficient_data":
            _remember_rejection(key, location)
        _raise_for_location(location)
    return geocode, elevation, location


def _extract_elevation(weather: Optional[dict]) -> Optional[float]:
    if not weather:
        return None
    elevation = weather.get("elevation")
    return None if elevation is None else float(elevation)


def _extract_address(geocode: Optional[dict]) -> str:
    if not geocode:
        return "Lokasi tidak terdeteksi"
    return geocode.get("display_name") or "Lokasi tidak terdeteksi"


def _extract_environment(
    weather: Optional[dict], air: Optional[dict], is_water: bool
) -> dict[str, Any]:
    current_weather = (weather or {}).get("current", {}) or {}
    daily_weather = (weather or {}).get("daily", {}) or {}
    hourly_weather = (weather or {}).get("hourly", {}) or {}
    current_air = (air or {}).get("current", {}) or {}

    soil_moisture = hourly_weather.get("soil_moisture_0_to_1cm") or []
    # Some global model cells return null for future soil-moisture hours. Use
    # the latest available numeric window rather than treating those trailing
    # nulls as if the whole field were unavailable.
    soil_moisture_values = [
        value for value in soil_moisture
        if isinstance(value, (int, float))
    ][-24:]

    return {
        "temperature_c": current_weather.get("temperature_2m"),
        "humidity_pct": current_weather.get("relative_humidity_2m"),
        "precipitation_mm": current_weather.get("precipitation"),
        "precipitation_24h_mm": (
            daily_weather.get("precipitation_sum", [None])[0]
            if daily_weather.get("precipitation_sum")
            else None
        ),
        "soil_moisture_surface": (
            round(sum(soil_moisture_values) / len(soil_moisture_values), 4)
            if soil_moisture_values
            else None
        ),
        "aqi": 0 if is_water else current_air.get("european_aqi"),
        "pm25": 0 if is_water else current_air.get("pm2_5"),
    }


def _extract_seismic(earthquakes: Optional[dict]) -> dict[str, Any]:
    features = (earthquakes or {}).get("features") or []

    history = []
    for feature in features:
        props = feature.get("properties") or {}
        magnitude = props.get("mag")
        if magnitude is None:
            continue
        timestamp = props.get("time")
        history.append(
            {
                "magnitude": magnitude,
                "place": props.get("place"),
                "occurred_at": (
                    datetime.fromtimestamp(timestamp / 1000, tz=timezone.utc).isoformat()
                    if timestamp
                    else None
                ),
            }
        )

    return {"recent_count": len(history), "history": history}


@router.post("/audit", response_model=AuditResult)
async def create_audit(req: AuditRequest) -> AuditResult:
    if not _within_indonesia(req.lat, req.lon):
        raise HTTPException(
            status_code=422,
            detail="Lokasi di luar cakupan data Indonesia",
        )

    # Audit koordinat yang sama dalam jendela TTL dijawab instan dari memori —
    # skor, geoteknik, dan kelas bahaya deterministik, jadi hasilnya identik.
    key = _cache_key(req.lat, req.lon)
    cached_payload = _audit_cache_get(key)
    if cached_payload is not None:
        return AuditResult.model_validate(cached_payload)

    # Gerbang tolak-cepat: laut / luar negeri ditolak di sini, sebelum
    # seluruh sumber data dipanggil. Geocode-nya dipakai ulang agar
    # Nominatim tidak dihubungi dua kali untuk audit yang valid.
    prefetched_geocode, preflight_elevation, gate_location = await _preflight_gate(
        req.lat, req.lon
    )

    raw, failed = await external.fetch_all(
        req.lat,
        req.lon,
        prefetched={"geocode": prefetched_geocode},
    )

    # Semua sumber mati berarti tidak ada dasar untuk menilai apa pun.
    if len(failed) == len(raw):
        raise HTTPException(
            status_code=503,
            detail="Semua sumber data sedang tidak dapat dihubungi. Coba lagi beberapa saat lagi.",
        )

    weather_elevation = _extract_elevation(raw.get("weather"))
    # Elevasi preflight tidak dibuang: kalau cuaca gagal membawa elevasi,
    # nilai gerbang tetap terpakai sehingga audit tidak kehilangan sumbu tanah.
    elevation = weather_elevation if weather_elevation is not None else preflight_elevation
    address = _extract_address(raw.get("geocode"))

    # Klasifikasi gerbang sudah memakai geocode yang sama; hitung ulang hanya
    # saat elevasi terbaik berubah (mis. preflight gagal lalu cuaca berhasil).
    if elevation == preflight_elevation:
        location = gate_location
    else:
        location = classify_location(req.lat, req.lon, raw.get("geocode"), elevation)

    _raise_for_location(location)

    is_water = location.is_water

    official_fault_geometry_available = bool(
        (raw.get("official_fault_geometry") or {}).get("features")
    )
    geotech = geotech_profile(
        req.lat,
        req.lon,
        elevation,
        raw.get("official_fault_geometry") if official_fault_geometry_available else None,
    )

    hazard = scoring.build_hazard(
        flood_class=raw.get("flood"),
        landslide_class=raw.get("landslide"),
        flood_available="flood" not in failed,
        landslide_available="landslide" not in failed,
        is_water=is_water,
    )
    hazard_quality = completeness.build_best_available_hazards(
        flood_class=raw.get("flood"),
        landslide_class=raw.get("landslide"),
        flood_available="flood" not in failed,
        landslide_available="landslide" not in failed,
        elevation_m=elevation,
        coast_distance_km=geotech["nearest_coast"]["distance_km"],
        weather=raw.get("weather"),
    )
    extended_hazard_quality = completeness.build_extended_hazard_quality(
        raw=raw,
        failed=failed,
    )

    for name in ("flood", "landslide"):
        quality = hazard_quality[name]
        hazard[f"{name}_label"] = quality["label"]
        hazard[f"{name}_risk"] = quality["risk"]
        # `known` means that a usable numeric value exists. `mapped` keeps
        # the important distinction between InaRISK and a model fallback.
        hazard[f"{name}_known"] = quality["status"] in {"official", "model"}
        hazard[f"{name}_mapped"] = quality["mapped"]
        hazard[f"{name}_data_status"] = quality["status"]
        hazard[f"{name}_source"] = quality["source"]
        hazard[f"{name}_estimated"] = quality["used_fallback"]

    for name, quality in extended_hazard_quality.items():
        hazard[f"{name}_map"] = {
            "risk": quality["risk"],
            "label": quality["label"],
            "source": quality["source"],
            "confidence": quality["confidence"],
            "data_status": quality["status"],
            "mapped": quality["mapped"],
            "estimated": quality["used_fallback"],
        }

    mode = completeness.audit_data_mode()
    subsidence_quality = (
        completeness.subsidence_proxy(
            elevation,
            geotech["nearest_coast"]["distance_km"],
        )
        if mode == "best_available"
        else {
            "risk": 50,
            "label": "DATA TIDAK TERSEDIA — LAYER SUBSIDENSI",
            "status": "unavailable",
            "source": "no approved subsidence layer",
            "confidence": 0,
            "used_fallback": False,
        }
    )
    hazard["subsidence_label"] = subsidence_quality["label"]
    hazard["subsidence_known"] = subsidence_quality["status"] != "unavailable"
    hazard["subsidence_data_status"] = subsidence_quality["status"]
    hazard["subsidence_source"] = subsidence_quality["source"]
    hazard["subsidence_estimated"] = subsidence_quality["used_fallback"]
    environment = _extract_environment(raw.get("weather"), raw.get("air_quality"), is_water)
    seismic = _extract_seismic(raw.get("earthquakes"))

    radar = scoring.build_radar(
        hazard=hazard,
        soil_risk=geotech["risk_score"],
        fault_distance_km=geotech["nearest_fault"]["distance_km"],
        aqi=environment["aqi"],
        is_water=is_water,
        subsidence_risk=(
            subsidence_quality["risk"]
            if subsidence_quality["status"] != "unavailable"
            else None
        ),
    )
    known_axes = {"soil", "seismic"}
    if elevation is None:
        known_axes.discard("soil")
    if geotech["nearest_fault"]["distance_km"] is None:
        known_axes.discard("seismic")
    if hazard_quality["flood"]["status"] in {"official", "model"}:
        known_axes.add("flood")
    if hazard_quality["landslide"]["status"] in {"official", "model"}:
        known_axes.add("landslide")
    if subsidence_quality["status"] != "unavailable":
        known_axes.add("subsidence")

    critical_missing: list[str] = []
    if hazard_quality["flood"]["status"] == "unavailable":
        critical_missing.append("flood")
    if hazard_quality["landslide"]["status"] == "unavailable":
        critical_missing.append("landslide")
    if elevation is None:
        critical_missing.append("elevation")
    if geotech["nearest_fault"]["distance_km"] is None:
        critical_missing.append("seismic_reference")

    optional_missing: list[str] = ["official_vs30_grid", "official_pga_grid"]
    if not official_fault_geometry_available:
        optional_missing.append("official_fault_geometry")
    optional_missing.extend(name for name in ("earthquakes", "nearby", "weather", "air_quality") if name in failed)
    if subsidence_quality["status"] == "unavailable":
        optional_missing.append("subsidence")
    optional_missing.extend(
        f"{name}_map"
        for name, quality in extended_hazard_quality.items()
        if quality["status"] == "unavailable"
    )

    if mode == "strict":
        # These are explicit contract requirements, not guesses based on the
        # presence of a number. Providers can remove these requirements only
        # when they add the corresponding authoritative layers.
        strict_requirements = (
            "indonesia_land_geojson",
            "official_vs30_grid",
            "official_pga_grid",
            "official_fault_geometry",
            "official_coastline_geometry",
            "versioned_subsidence_layer",
            "versioned_tsunami_inundation",
        )
        critical_missing.extend(
            name
            for name in strict_requirements
            if name not in critical_missing
            and not (name == "official_fault_geometry" and official_fault_geometry_available)
        )
        if location.boundary_source == "configured_land_geojson":
            critical_missing.remove("indonesia_land_geojson")

    score = scoring.safe_score(radar, known_axes) if known_axes else None
    if mode == "strict" and critical_missing:
        score = None
    audit_status = "insufficient_data" if score is None else "provisional"
    if not optional_missing and not critical_missing and mode == "strict":
        audit_status = "valid"

    field_quality = completeness.build_field_quality(
        raw=raw,
        failed=failed,
        hazard_quality=hazard_quality,
        geotech=geotech,
        location_source=location.boundary_source,
        elevation=elevation,
        subsidence_quality=subsidence_quality,
        extended_quality=extended_hazard_quality,
    )
    scored_quality = [
        field_quality["fields"][name]["confidence"]
        for name in ("flood", "landslide", "soil", "seismic", "subsidence")
        if name in known_axes
    ]
    base_confidence = round(sum(scored_quality) / len(scored_quality)) if scored_quality else 0
    confidence = base_confidence

    hazard["tsunami"] = scoring.tsunami_risk(
        geotech["nearest_coast"]["distance_km"], elevation or 0.0
    )
    hazard["tsunami_scored"] = False
    hazard["radar"] = radar
    hazard["is_water"] = is_water
    environment["air_risk"] = radar["air"]

    pbg_checklist = pbg.build_pbg_checklist(
        geotech=geotech,
        flood_class=raw.get("flood"),
        flood_known=hazard_quality["flood"]["status"] in {"official", "model"},
        landslide_class=raw.get("landslide"),
        landslide_known=hazard_quality["landslide"]["status"] in {"official", "model"},
        subsidence_risk=(
            subsidence_quality["risk"]
            if subsidence_quality["status"] != "unavailable"
            else None
        ),
        tsunami_band=hazard["tsunami"],
    )

    data_quality = {
        "status": audit_status,
        "mode": mode,
        "confidence": confidence,
        "base_confidence": base_confidence,
        "critical_missing": critical_missing,
        "optional_missing": optional_missing,
        **field_quality,
        "boundary_source": location.boundary_source,
        "geotech_provenance": geotech.get("provenance", {}),
        "extended_hazards": extended_hazard_quality,
        "score_axes": sorted(known_axes),
        "not_scored": [
            "air_quality",
            "tsunami",
            "tsunami_map",
            "liquefaction_map",
            "volcanic_map",
            "coastal_map",
        ] + (["subsidence"] if "subsidence" not in known_axes else []),
    }

    result = AuditResult(
        lat=req.lat,
        lon=req.lon,
        address=address,
        elevation=elevation,
        safe_score=score,
        risk_level=scoring.risk_level(score),
        audit_status=audit_status,
        confidence=confidence,
        score_version="buildability-v3-best-available",
        data_quality=data_quality,
        geotech=geotech,
        hazard=hazard,
        environment=environment,
        seismic=seismic,
        nearby=raw.get("nearby") or [],
        sources_failed=failed,
        pbg_checklist=pbg_checklist,
        created_at=datetime.now(timezone.utc),
    )

    # ID dibuat aplikasi sehingga respons tidak perlu menunggu INSERT; tulis
    # DB berjalan di belakang. Frontend tetap menerima id + persisted seperti
    # sebelumnya (narrative/{id} akan fallback ke audit inline bila baris
    # belum terlanjur tersimpan).
    result.id = str(uuid.uuid4())
    # Satu serialisasi dipakai bersama oleh persist DB dan cache memori.
    payload = result.model_dump(mode="json")
    pool = db.get_pool()
    if pool is not None:
        # INSERT di-await inline: runtime serverless (Vercel) membatalkan task
        # latar belakang setelah respons kembali, sehingga pola fire-and-forget
        # membuat baris tidak pernah tersimpan. Biayanya satu round-trip
        # pooler (~30-80 ms) — jauh lebih murah daripada kehilangan audit.
        document = {k: v for k, v in payload.items() if k not in ("id", "persisted")}
        try:
            await pool.execute(
                "INSERT INTO audits (id, lat, lon, data) VALUES ($1, $2, $3, $4)",
                uuid.UUID(result.id),
                result.lat,
                result.lon,
                document,
            )
            result.persisted = True
        except Exception as exc:  # noqa: BLE001 — gagal simpan tidak boleh menggagalkan audit
            log.warning("Audit tidak tersimpan: %s", exc)

    _audit_cache_store(key, payload)

    if pool is not None and result.persisted:
        _spawn_prefetch(result)
    return result


@router.get("/audit/{audit_id}", response_model=AuditResult)
async def get_audit(audit_id: str) -> AuditResult:
    pool = db.get_pool()
    if pool is None:
        raise HTTPException(status_code=503, detail="Penyimpanan tidak tersedia")

    try:
        uid = uuid.UUID(audit_id)
    except (ValueError, TypeError) as exc:
        raise HTTPException(status_code=422, detail="ID audit tidak valid") from exc

    row = await pool.fetchrow("SELECT id, data FROM audits WHERE id = $1", uid)
    if row is None:
        raise HTTPException(status_code=404, detail="Audit tidak ditemukan")

    data = dict(row["data"])
    data["id"] = str(row["id"])
    data["persisted"] = True
    return AuditResult(**data)
