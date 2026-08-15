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
from services import external, scoring
from services.geotech import geotech_profile

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
    current_air = (air or {}).get("current", {}) or {}

    return {
        "temperature_c": current_weather.get("temperature_2m"),
        "humidity_pct": current_weather.get("relative_humidity_2m"),
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
    is_water = external.is_water_body(
        req.lat, req.lon, address, elevation or 0.0, raw.get("geocode")
    )

    geotech = geotech_profile(req.lat, req.lon, elevation)

    # Perairan bukan lahan yang bisa dinilai kelayakannya — tandai eksplisit
    # daripada mengembalikan skor yang menyesatkan.
    if is_water:
        geotech["fs"] = 0.0
        geotech["status"] = "RAWAN"
        geotech["site_class"] = "SE"
        geotech["risk_score"] = 100
        address = f"{address} (Kawasan Perairan)"

    hazard = scoring.build_hazard(
        flood_class=raw.get("flood"),
        landslide_class=raw.get("landslide"),
        flood_available="flood" not in failed,
        landslide_available="landslide" not in failed,
        is_water=is_water,
    )
    environment = _extract_environment(raw.get("weather"), raw.get("air_quality"), is_water)
    seismic = _extract_seismic(raw.get("earthquakes"))

    radar = scoring.build_radar(
        hazard=hazard,
        soil_risk=geotech["risk_score"],
        fault_distance_km=geotech["nearest_fault"]["distance_km"],
        aqi=environment["aqi"],
        is_water=is_water,
    )
    score = scoring.safe_score(radar)

    hazard["tsunami"] = scoring.tsunami_risk(
        geotech["nearest_coast"]["distance_km"], elevation or 0.0
    )
    hazard["radar"] = radar
    hazard["is_water"] = is_water

    result = AuditResult(
        lat=req.lat,
        lon=req.lon,
        address=address,
        elevation=elevation,
        safe_score=score,
        risk_level=scoring.risk_level(score),
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
