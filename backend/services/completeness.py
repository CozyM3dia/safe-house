"""Best-available coverage helpers for locations with incomplete map layers.

The application has two honest modes:

* ``strict`` refuses to score when a critical official layer is missing.
* ``best_available`` fills the display and screening score with explicitly
  labelled model proxies. These values are never presented as official
  hazard-map observations and keep a low confidence score.

This module deliberately does not turn a missing map pixel into "low risk".
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any, Optional


def audit_data_mode() -> str:
    value = os.getenv("AUDIT_DATA_MODE", "best_available").strip().lower()
    return value if value in {"strict", "best_available"} else "best_available"


def _clamp(value: float, low: int = 0, high: int = 100) -> int:
    return max(low, min(high, int(round(value))))


def _band(risk: int) -> str:
    if risk >= 70:
        return "TINGGI"
    if risk >= 40:
        return "SEDANG"
    return "RENDAH"


def _precipitation_mm(weather: Optional[dict[str, Any]]) -> Optional[float]:
    if not weather:
        return None

    current = weather.get("current") or {}
    daily = weather.get("daily") or {}
    candidates: list[float] = []
    for key in ("precipitation", "rain", "showers"):
        value = current.get(key)
        if isinstance(value, (int, float)):
            candidates.append(float(value))
    daily_sum = daily.get("precipitation_sum")
    if isinstance(daily_sum, list) and daily_sum:
        value = daily_sum[0]
        if isinstance(value, (int, float)):
            candidates.append(float(value))
    return max(candidates) if candidates else None


def _flood_proxy(elevation_m: Optional[float], coast_distance_km: Optional[float], precip_mm: Optional[float]) -> int:
    elevation = 0.0 if elevation_m is None else elevation_m
    risk = 55.0
    if elevation <= 5:
        risk += 20
    elif elevation <= 15:
        risk += 10
    elif elevation <= 50:
        risk += 0
    else:
        risk -= min(20, (elevation - 50) / 20)

    if coast_distance_km is not None:
        if coast_distance_km <= 1:
            risk += 15
        elif coast_distance_km <= 5:
            risk += 8

    if precip_mm is not None:
        if precip_mm >= 50:
            risk += 15
        elif precip_mm >= 20:
            risk += 8
    return _clamp(risk)


def _landslide_proxy(elevation_m: Optional[float], precip_mm: Optional[float]) -> int:
    elevation = 0.0 if elevation_m is None else elevation_m
    risk = 25.0
    # Elevation is only a terrain-exposure proxy; without slope geometry this
    # must remain low-confidence and must not be described as a landslide map.
    if elevation >= 500:
        risk += 30
    elif elevation >= 150:
        risk += 18
    elif elevation >= 50:
        risk += 8
    if precip_mm is not None:
        if precip_mm >= 50:
            risk += 20
        elif precip_mm >= 20:
            risk += 10
    return _clamp(risk)


def subsidence_proxy(elevation_m: Optional[float], coast_distance_km: Optional[float]) -> dict[str, Any]:
    elevation = 0.0 if elevation_m is None else elevation_m
    risk = 20.0
    if elevation <= 2:
        risk += 35
    elif elevation <= 10:
        risk += 20
    elif elevation <= 50:
        risk += 8
    if coast_distance_km is not None and coast_distance_km <= 5:
        risk += 10
    risk = _clamp(risk)
    return {
        "risk": risk,
        "label": f"{_band(risk)} — ESTIMASI DATARAN RENDAH (BUKAN PETA SUBSIDENSI)",
        "status": "model",
        "source": "lowland_coastal_screening_proxy",
        "confidence": 10,
        "used_fallback": True,
    }


def _official_hazard(class_value: Optional[int], name: str) -> Optional[dict[str, Any]]:
    mapping = {1: ("RENDAH", 25), 2: ("SEDANG", 60), 3: ("TINGGI", 85)}
    if class_value not in mapping:
        return None
    label, risk = mapping[class_value]
    return {
        "risk": risk,
        "label": label,
        "status": "official",
        "source": f"InaRISK BNPB — {name}",
        "confidence": 85,
        "used_fallback": False,
    }


def _official_continuous_hazard(value: Any, name: str) -> Optional[dict[str, Any]]:
    """Map an InaRISK continuous index (0..1) to a display risk (0..100)."""

    if not isinstance(value, (int, float)) or not 0 <= float(value) <= 1:
        return None
    risk = _clamp(float(value) * 100)
    return {
        "risk": risk,
        "label": _band(risk),
        "status": "official",
        "source": f"InaRISK BNPB — {name}",
        "confidence": 85,
        "used_fallback": False,
        "raw_value": round(float(value), 6),
        "value_scale": "0_to_1_index",
    }


EXTENDED_HAZARD_NAMES = {
    "tsunami": "tsunami",
    "liquefaction": "likuefaksi",
    "volcanic": "letusan gunungapi",
    "coastal": "gelombang ekstrem dan abrasi",
}


def build_extended_hazard_quality(
    *, raw: dict[str, Any], failed: list[str]
) -> dict[str, dict[str, Any]]:
    """Build provenance for official InaRISK layers outside the score axes.

    These layers are useful evidence for the report, but their presence does
    not silently change the buildability weighting. A missing pixel and a
    failed request both remain unavailable rather than becoming low risk.
    """

    quality: dict[str, dict[str, Any]] = {}
    for key, display_name in EXTENDED_HAZARD_NAMES.items():
        class_value = raw.get(key)
        item = (
            _official_continuous_hazard(class_value, display_name)
            if isinstance(class_value, float) and 0 <= class_value <= 1
            else _official_hazard(class_value, display_name)
        )
        if item is None:
            reason = (
                "InaRISK tidak dapat dihubungi"
                if key in failed
                else f"InaRISK tidak memiliki piksel {display_name} pada titik ini"
            )
            item = _unavailable(display_name, reason)
        item["mapped"] = item["status"] == "official"
        item["used_fallback"] = False
        quality[key] = item

    return quality


def _unavailable(name: str, reason: str) -> dict[str, Any]:
    return {
        "risk": 50,
        "label": f"DATA TIDAK TERSEDIA — {name.upper()}",
        "status": "unavailable",
        "source": reason,
        "confidence": 0,
        "used_fallback": False,
    }


def _fallback(name: str, risk: int, source: str, confidence: int) -> dict[str, Any]:
    return {
        "risk": risk,
        "label": f"{_band(risk)} — ESTIMASI PROVISI (BUKAN PETA {name.upper()})",
        "status": "model",
        "source": source,
        "confidence": confidence,
        "used_fallback": True,
    }


def build_best_available_hazards(
    *,
    flood_class: Optional[int],
    landslide_class: Optional[int],
    flood_available: bool,
    landslide_available: bool,
    elevation_m: Optional[float],
    coast_distance_km: Optional[float],
    weather: Optional[dict[str, Any]],
    mode: Optional[str] = None,
) -> dict[str, dict[str, Any]]:
    """Return provenance-rich hazard values for the selected data mode."""

    selected_mode = mode or audit_data_mode()
    precipitation = _precipitation_mm(weather)

    flood = _official_hazard(flood_class, "banjir")
    if flood is None:
        if selected_mode == "best_available":
            flood = _fallback(
                "BANJIR",
                _flood_proxy(elevation_m, coast_distance_km, precipitation),
                "elevation_coast_precipitation_screening_proxy",
                20,
            )
        else:
            flood = _unavailable(
                "banjir",
                "InaRISK tidak memiliki piksel pada titik ini atau sumber gagal",
            )
    flood["mapped"] = flood_class is not None and flood_available

    landslide = _official_hazard(landslide_class, "longsor")
    if landslide is None:
        if selected_mode == "best_available":
            landslide = _fallback(
                "LONGSOR",
                _landslide_proxy(elevation_m, precipitation),
                "elevation_precipitation_terrain_screening_proxy",
                15,
            )
        else:
            landslide = _unavailable(
                "longsor",
                "InaRISK tidak memiliki piksel pada titik ini atau sumber gagal",
            )
    landslide["mapped"] = landslide_class is not None and landslide_available

    return {"flood": flood, "landslide": landslide}


def _field(status: str, source: str, confidence: int, value: Any = None) -> dict[str, Any]:
    result = {
        "status": status,
        "source": source,
        "confidence": _clamp(confidence),
        "as_of": datetime.now(timezone.utc).isoformat(),
    }
    if value is not None:
        result["value"] = value
    return result


def build_field_quality(
    *,
    raw: dict[str, Any],
    failed: list[str],
    hazard_quality: dict[str, dict[str, Any]],
    geotech: dict[str, Any],
    location_source: str,
    elevation: Optional[float],
    subsidence_quality: Optional[dict[str, Any]] = None,
    extended_quality: Optional[dict[str, dict[str, Any]]] = None,
) -> dict[str, Any]:
    """Build a complete field-by-field coverage manifest for the response."""

    weather_available = "weather" not in failed and raw.get("weather") is not None
    air_available = "air_quality" not in failed and raw.get("air_quality") is not None
    earthquakes_available = "earthquakes" not in failed and raw.get("earthquakes") is not None
    nearby_available = "nearby" not in failed and raw.get("nearby") is not None
    soil_values = ((raw.get("weather") or {}).get("hourly") or {}).get("soil_moisture_0_to_1cm") or []
    soil_moisture_available = any(isinstance(value, (int, float)) for value in soil_values)
    geotech_provenance = geotech.get("provenance", {})
    extended = extended_quality or build_extended_hazard_quality(raw=raw, failed=failed)

    fields = {
        "location": _field("reference", location_source, 80),
        "elevation": _field(
            "model" if elevation is not None else "unavailable",
            "Open-Meteo 90m DEM" if elevation is not None else "Open-Meteo elevation unavailable",
            60 if elevation is not None else 0,
            elevation,
        ),
        "soil": _field("model", geotech_provenance.get("vs30", "screening_proxy_from_elevation"), 35),
        "seismic": _field("model", geotech_provenance.get("pga", "regional_nearest_city_lookup"), 35),
        "fault_reference": _field("reference", geotech_provenance.get("faults_volcanoes_coast", "static_reference_points"), 25),
        "flood": _field(
            hazard_quality["flood"]["status"],
            hazard_quality["flood"]["source"],
            hazard_quality["flood"]["confidence"],
            hazard_quality["flood"].get("risk"),
        ),
        "landslide": _field(
            hazard_quality["landslide"]["status"],
            hazard_quality["landslide"]["source"],
            hazard_quality["landslide"]["confidence"],
            hazard_quality["landslide"].get("risk"),
        ),
        "subsidence": _field(
            (subsidence_quality or {}).get("status", "unavailable"),
            (subsidence_quality or {}).get("source", "no approved subsidence layer"),
            (subsidence_quality or {}).get("confidence", 0),
            (subsidence_quality or {}).get("risk"),
        ),
        "weather": _field("model" if weather_available else "unavailable", "Open-Meteo weather model", 55 if weather_available else 0),
        "soil_moisture": _field("model" if soil_moisture_available else "unavailable", "Open-Meteo soil-moisture model", 35 if soil_moisture_available else 0),
        "air_quality": _field("model" if air_available else "unavailable", "Open-Meteo Air Quality model", 50 if air_available else 0),
        "earthquake_history": _field("reference" if earthquakes_available else "unavailable", "USGS earthquake catalog", 85 if earthquakes_available else 0),
        "nearby": _field("open_data" if nearby_available else "unavailable", "OpenStreetMap Overpass", 60 if nearby_available else 0),
        "tsunami": _field("model", "coast_distance_elevation_screening_proxy", 25),
    }

    for key in EXTENDED_HAZARD_NAMES:
        item = extended[key]
        fields[f"{key}_map"] = _field(
            item["status"],
            item["source"],
            item["confidence"],
            item.get("risk"),
        )

    unavailable = [name for name, item in fields.items() if item["status"] == "unavailable"]
    estimated = [name for name, item in fields.items() if item["status"] == "model"]
    return {
        "fields": fields,
        "coverage_status": "complete_with_estimates" if not unavailable else "partial_with_gaps",
        "estimated_fields": estimated,
        "unavailable_fields": unavailable,
    }
