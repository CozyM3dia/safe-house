"""Router audit — jalur utama aplikasi.

Satu koordinat masuk, satu laporan risiko lengkap keluar.
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, HTTPException

import db
from data.constants import INDONESIA_BOUNDS
from models import AuditRequest, AuditResult
from services import completeness, external, scoring
from services.geotech import geotech_profile
from services.location import classify_location

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["audit"])


def _within_indonesia(lat: float, lon: float) -> bool:
    b = INDONESIA_BOUNDS
    return b["lat_min"] <= lat <= b["lat_max"] and b["lon_min"] <= lon <= b["lon_max"]


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

    raw, failed = await external.fetch_all(req.lat, req.lon)

    # Semua sumber mati berarti tidak ada dasar untuk menilai apa pun.
    if len(failed) == len(raw):
        raise HTTPException(
            status_code=503,
            detail="Semua sumber data sedang tidak dapat dihubungi. Coba lagi beberapa saat lagi.",
        )

    elevation = _extract_elevation(raw.get("weather"))
    address = _extract_address(raw.get("geocode"))
    location = classify_location(req.lat, req.lon, raw.get("geocode"), elevation)

    if location.status == "out_of_scope":
        raise HTTPException(status_code=422, detail=location.reason)
    if location.status == "not_buildable":
        raise HTTPException(
            status_code=422,
            detail="Lokasi tidak dapat diaudit sebagai lahan bangunan: " + location.reason,
        )
    if location.status == "insufficient_data":
        raise HTTPException(status_code=503, detail=location.reason)

    is_water = location.is_water

    geotech = geotech_profile(req.lat, req.lon, elevation)

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

    optional_missing: list[str] = [
        "official_vs30_grid",
        "official_pga_grid",
        "official_fault_geometry",
    ]
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
        critical_missing.extend(
            name
            for name in (
                "indonesia_land_geojson",
                "official_vs30_grid",
                "official_pga_grid",
                "official_fault_geometry",
                "official_coastline_geometry",
                "versioned_subsidence_layer",
                "versioned_tsunami_inundation",
            )
            if name not in critical_missing
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
    confidence = round(sum(scored_quality) / len(scored_quality)) if scored_quality else 0

    hazard["tsunami"] = scoring.tsunami_risk(
        geotech["nearest_coast"]["distance_km"], elevation or 0.0
    )
    hazard["tsunami_scored"] = False
    hazard["radar"] = radar
    hazard["is_water"] = is_water
    environment["air_risk"] = radar["air"]

    data_quality = {
        "status": audit_status,
        "mode": mode,
        "confidence": confidence,
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
        created_at=datetime.now(timezone.utc),
    )

    pool = db.get_pool()
    if pool is not None:
        try:
            document = result.model_dump(mode="json", exclude={"id", "persisted"})
            row = await pool.fetchrow(
                "INSERT INTO audits (lat, lon, data) VALUES ($1, $2, $3) RETURNING id",
                result.lat,
                result.lon,
                document,
            )
            result.id = str(row["id"])
            result.persisted = True
        except Exception as exc:  # noqa: BLE001 — gagal simpan tidak boleh menggagalkan audit
            log.warning("Audit tidak tersimpan: %s", exc)

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
