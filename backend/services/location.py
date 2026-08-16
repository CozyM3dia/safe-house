"""Fail-closed location classification for audit requests.

The old bounding box was only a coarse request guard: it included open water
and several neighbouring countries. This module adds a land/country decision
after reverse geocoding and supports an optional authoritative GeoJSON land
mask through ``INDONESIA_LAND_GEOJSON``.

The GeoJSON file is intentionally configuration-driven. A deployment must
provide a versioned land mask from its approved geospatial source; when it is
not configured, the Nominatim land-feature check is used as a conservative
fallback and the result is marked with its provenance.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any, Literal, Optional

from services.geotech import haversine

LocationStatus = Literal["valid_land", "not_buildable", "out_of_scope", "insufficient_data"]


@dataclass(frozen=True)
class LocationClassification:
    status: LocationStatus
    reason: str
    country_code: Optional[str]
    geocode_offset_km: Optional[float]
    is_water: bool
    boundary_source: str


_WATER_TYPES = {"sea", "ocean", "bay", "strait", "water"}
_WATER_WORDS = {"ocean", "sea", "laut", "selat", "strait", "bay", "teluk", "samudra"}
_LAND_ADDRESS_KEYS = {
    "amenity",
    "building",
    "city",
    "city_district",
    "county",
    "house_number",
    "industrial",
    "island",
    "landuse",
    "municipality",
    "neighbourhood",
    "postcode",
    "railway",
    "road",
    "shop",
    "suburb",
    "town",
    "village",
}


def _ring_contains(lat: float, lon: float, ring: list[list[float]]) -> bool:
    """Ray-casting point-in-ring using GeoJSON [lon, lat] coordinates."""

    inside = False
    if len(ring) < 3:
        return False

    j = len(ring) - 1
    for i, current in enumerate(ring):
        try:
            xi, yi = float(current[0]), float(current[1])
            xj, yj = float(ring[j][0]), float(ring[j][1])
        except (IndexError, TypeError, ValueError):
            j = i
            continue

        intersects = ((yi > lat) != (yj > lat)) and (
            lon < (xj - xi) * (lat - yi) / ((yj - yi) or 1e-12) + xi
        )
        if intersects:
            inside = not inside
        j = i

    return inside


def _geometry_contains(lat: float, lon: float, geometry: Optional[dict[str, Any]]) -> bool:
    if not geometry:
        return False
    kind = geometry.get("type")
    coordinates = geometry.get("coordinates")
    if kind == "Polygon":
        if not coordinates or not _ring_contains(lat, lon, coordinates[0]):
            return False
        return not any(_ring_contains(lat, lon, hole) for hole in coordinates[1:])
    if kind == "MultiPolygon":
        return any(
            _geometry_contains(lat, lon, {"type": "Polygon", "coordinates": polygon})
            for polygon in (coordinates or [])
        )
    return False


def point_in_geojson(lat: float, lon: float, payload: dict[str, Any]) -> bool:
    """Return whether a point is inside a Polygon/MultiPolygon GeoJSON mask."""

    kind = payload.get("type")
    if kind == "FeatureCollection":
        return any(point_in_geojson(lat, lon, feature) for feature in payload.get("features", []))
    if kind == "Feature":
        return _geometry_contains(lat, lon, payload.get("geometry"))
    return _geometry_contains(lat, lon, payload)


@lru_cache(maxsize=1)
def _configured_land_mask() -> Optional[dict[str, Any]]:
    path_value = os.getenv("INDONESIA_LAND_GEOJSON", "").strip()
    if not path_value:
        return None
    path = Path(path_value)
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        raise RuntimeError(f"INDONESIA_LAND_GEOJSON tidak dapat dibaca: {path}") from exc


def _water_signal(address: dict[str, Any], geocode: dict[str, Any], label: str) -> bool:
    if geocode.get("type") in _WATER_TYPES:
        return True
    if geocode.get("category") == "natural" and geocode.get("type") == "water":
        return True
    if any(address.get(key) for key in ("ocean", "sea", "water")):
        return True
    lowered = label.lower()
    return any(word in lowered.split() for word in _WATER_WORDS)


def _has_land_feature(address: dict[str, Any]) -> bool:
    return any(address.get(key) for key in _LAND_ADDRESS_KEYS)


def classify_location(
    lat: float,
    lon: float,
    geocode: Optional[dict[str, Any]],
    elevation_m: Optional[float],
    *,
    land_mask: Optional[dict[str, Any]] = None,
) -> LocationClassification:
    """Classify a reverse-geocoded point and fail closed when uncertain."""

    if geocode is None:
        if elevation_m is not None and elevation_m <= 0:
            return LocationClassification(
                "not_buildable", "Koordinat berada di perairan", None, None, True, "elevation_only"
            )
        return LocationClassification(
            "insufficient_data", "Batas daratan tidak dapat diverifikasi", None, None, False, "unverified"
        )

    address = geocode.get("address", {}) or {}
    country_code = str(address.get("country_code") or "").lower() or None
    if country_code != "id":
        return LocationClassification(
            "out_of_scope",
            "Lokasi berada di luar Indonesia",
            country_code,
            None,
            False,
            "nominatim_country_code",
        )

    matched_lat = matched_lon = None
    try:
        matched_lat = float(geocode["lat"])
        matched_lon = float(geocode["lon"])
    except (KeyError, TypeError, ValueError):
        pass

    offset_km = (
        haversine(lat, lon, matched_lat, matched_lon)
        if matched_lat is not None and matched_lon is not None
        else None
    )
    label = str(geocode.get("display_name") or "")

    configured_mask = land_mask if land_mask is not None else _configured_land_mask()
    if configured_mask is not None and not point_in_geojson(lat, lon, configured_mask):
        return LocationClassification(
            "not_buildable",
            "Koordinat tidak berada pada polygon daratan Indonesia",
            country_code,
            offset_km,
            True,
            "configured_land_geojson",
        )

    if _water_signal(address, geocode, label):
        return LocationClassification(
            "not_buildable", "Koordinat berada di perairan", country_code, offset_km, True,
            "nominatim_water_feature",
        )

    has_land_feature = _has_land_feature(address)
    if offset_km is None:
        return LocationClassification(
            "insufficient_data", "Posisi daratan tidak dapat dicocokkan", country_code, None, False,
            "nominatim_unverified",
        )

    # Nominatim returns a province/administrative centroid for open water.
    # A distant administrative-only match is therefore treated as water, not
    # as a valid property site. This conservative threshold avoids the old
    # Java Sea false negative while still allowing ordinary street matches.
    if offset_km > 5 and not has_land_feature:
        return LocationClassification(
            "not_buildable", "Geocoder hanya menemukan wilayah administratif yang jauh; lokasi kemungkinan perairan",
            country_code, offset_km, True, "nominatim_admin_fallback",
        )

    return LocationClassification(
        "valid_land", "Lokasi daratan Indonesia terverifikasi", country_code, offset_km, False,
        "configured_land_geojson" if configured_mask is not None else "nominatim_land_feature",
    )
