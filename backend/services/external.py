"""Pengambilan data dari sumber luar.

Semua sumber dipanggil paralel dengan timeout sendiri-sendiri. Satu sumber
gagal tidak menggagalkan audit — field-nya dikosongkan dan namanya masuk
daftar `failed`, supaya frontend bisa jujur soal data yang hilang.

Sumber:
- Nominatim OSM      reverse geocoding
- Open-Meteo         elevasi, suhu, kelembapan
- Open-Meteo AQ      PM2.5, AQI Eropa
- USGS               gempa historis dalam radius 100 km
- InaRISK BNPB       bahaya banjir dan longsor
- BNPB InaRISK / PuSGeN 2024 geometri sesar resmi
- Overpass           objek lingkungan sekitar (sungai, TPA, jalan)

Tidak ada satu pun yang membutuhkan kunci API.
"""

import asyncio
import logging
import os
import re
from typing import Any, Optional

import httpx

from services.geotech import haversine as _haversine_km

log = logging.getLogger(__name__)

# Timeout adaptif untuk deployment cloud (misal Emergent / container).
TIMEOUT_S = float(os.getenv("EXTERNAL_TIMEOUT_SECONDS", "3.5"))
INARISK_TIMEOUT_S = float(os.getenv("INARISK_TIMEOUT_SECONDS", "3.5"))
FAULT_GEOMETRY_TIMEOUT_S = float(os.getenv("FAULT_GEOMETRY_TIMEOUT_SECONDS", "3.5"))

NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse"
OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
OPEN_METEO_AQ_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"
USGS_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query"
OVERPASS_URLS = [
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
    "https://overpass-api.de/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
]
INARISK_BASE = "https://gis.bnpb.go.id/server/rest/services/inarisk"
OFFICIAL_FAULT_GEOMETRY_URL = (
    "https://gis.bnpb.go.id/server/rest/services/inarisk/"
    "Faults_new/MapServer/1/query"
)
OFFICIAL_FAULT_GEOMETRY_PARAMS = {
    "where": "1=1",
    "outFields": "FID,Name,Segment,Mmax,Region,Type,Sliprate_m,Length_km",
    "returnGeometry": "true",
    "f": "geojson",
}

_shared_external_clients: dict[asyncio.AbstractEventLoop, httpx.AsyncClient] = {}
_cached_fault_geometry: Optional[dict] = None

# Header standar agar server ArcGIS / OSM tidak memblokir IP cloud
DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 (SAFE-House-Audit/1.0)",
    "Accept": "application/json, text/plain, */*",
}


def _get_shared_client() -> httpx.AsyncClient:
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop is not None:
        client = _shared_external_clients.get(loop)
        if client is None or client.is_closed:
            client = httpx.AsyncClient(
                timeout=TIMEOUT_S,
                limits=httpx.Limits(max_keepalive_connections=20, max_connections=50, keepalive_expiry=60.0),
                headers=DEFAULT_HEADERS,
            )
            _shared_external_clients[loop] = client
        return client

    return httpx.AsyncClient(
        timeout=TIMEOUT_S,
        limits=httpx.Limits(max_keepalive_connections=20, max_connections=50, keepalive_expiry=60.0),
        headers=DEFAULT_HEADERS,
    )

# Public BNPB raster layers. Keep the source names stable because they are
# persisted in `sources_failed` and shown in the data-coverage manifest.
INARISK_LAYERS = {
    "flood": "layer_bahaya_banjir_30",
    "landslide": "layer_bahaya_tanah_longsor_30",
    "tsunami": "layer_bahaya_tsunami_30",
    "liquefaction": "layer_bahaya_likuefaksi_30",
    "volcanic": "layer_bahaya_letusan_gunungapi_30",
    "coastal": "layer_bahaya_gelombang_ekstrim_dan_abrasi_30",
}

HEADERS = {"User-Agent": "SAFE-House-Audit/1.0 (https://safehouse.web.id; contact@safehouse.id)"}


async def _reverse_geocode(client: httpx.AsyncClient, lat: float, lon: float) -> dict:
    r = await client.get(
        NOMINATIM_URL,
        params={"lat": lat, "lon": lon, "format": "json"},
        headers=HEADERS,
    )
    r.raise_for_status()
    return r.json()


async def _weather(client: httpx.AsyncClient, lat: float, lon: float) -> dict:
    r = await client.get(
        OPEN_METEO_URL,
        params={
            "latitude": lat,
            "longitude": lon,
            "current": "relative_humidity_2m,temperature_2m,precipitation,rain,showers",
            "hourly": "soil_moisture_0_to_1cm,soil_moisture_1_to_3cm",
            "daily": "precipitation_sum,precipitation_hours",
            "forecast_days": 1,
            "past_hours": 24,
            "timezone": "auto",
        },
    )
    r.raise_for_status()
    return r.json()


async def _air_quality(client: httpx.AsyncClient, lat: float, lon: float) -> dict:
    r = await client.get(
        OPEN_METEO_AQ_URL,
        params={"latitude": lat, "longitude": lon, "current": "pm2_5,european_aqi"},
    )
    r.raise_for_status()
    return r.json()


async def _earthquakes(client: httpx.AsyncClient, lat: float, lon: float) -> dict:
    r = await client.get(
        USGS_URL,
        params={
            "format": "geojson",
            "latitude": lat,
            "longitude": lon,
            "maxradiuskm": 100,
            "minmagnitude": 4.5,
            "limit": 5,
            "orderby": "time",
        },
    )
    r.raise_for_status()
    return r.json()


async def _inarisk_layer(
    client: httpx.AsyncClient,
    layer: str,
    lat: float,
    lon: float,
    *,
    as_class: bool = True,
) -> Optional[float | int]:
    """Kelas bahaya InaRISK pada satu titik.

    Layer InaRISK adalah raster, bukan feature layer. Operasi /query dengan
    outFields hanya mengembalikan galat 400 terbungkus HTTP 200 — terlihat
    berhasil, padahal tidak ada data. Yang benar adalah /identify, yang
    mengembalikan nilai piksel.

    Mengembalikan kelas 1/2/3 untuk layer kelas, nilai indeks mentah untuk
    layer kontinu, atau None kalau titik tidak berada di area bahaya yang
    dipetakan.
    """
    half_span = 0.01  # ~1 km, cukup untuk mengunci satu piksel

    r = await client.get(
        f"{INARISK_BASE}/{layer}/MapServer/identify",
        params={
            "geometry": f"{lon},{lat}",
            "geometryType": "esriGeometryPoint",
            "sr": 4326,
            "layers": "all",
            "tolerance": 2,
            "mapExtent": (
                f"{lon - half_span},{lat - half_span},"
                f"{lon + half_span},{lat + half_span}"
            ),
            "imageDisplay": "400,400,96",
            "returnGeometry": "false",
            "f": "json",
        },
        timeout=INARISK_TIMEOUT_S,
    )
    r.raise_for_status()
    payload = r.json()

    if "error" in payload:
        raise RuntimeError(f"InaRISK menolak permintaan: {payload['error']}")

    results = payload.get("results") or []
    if not results:
        return None

    raw = results[0].get("attributes", {}).get("Stretch.Pixel Value")
    if raw in (None, "NoData", ""):
        return None

    try:
        # Nilai piksel kadang datang sebagai desimal ("2.000000").
        value = float(raw)
        return int(round(value)) if as_class else value
    except (TypeError, ValueError):
        log.warning("Nilai piksel InaRISK tidak dikenali: %r", raw)
        return None


async def _official_fault_geometry(client: httpx.AsyncClient) -> dict:
    """Fetch the versioned PuSGeN 2024 official fault polylines with memory caching."""
    global _cached_fault_geometry
    if _cached_fault_geometry is not None:
        return _cached_fault_geometry

    r = await client.get(
        OFFICIAL_FAULT_GEOMETRY_URL,
        params=OFFICIAL_FAULT_GEOMETRY_PARAMS,
        timeout=FAULT_GEOMETRY_TIMEOUT_S,
    )
    r.raise_for_status()
    payload = r.json()
    if payload.get("type") != "FeatureCollection" or not isinstance(payload.get("features"), list):
        raise RuntimeError("Geometri sesar resmi bukan GeoJSON FeatureCollection")
    _cached_fault_geometry = payload
    return payload


async def _nearby_pois(client: httpx.AsyncClient, lat: float, lon: float) -> list[str]:
    """Objek lingkungan sekitar: sungai, TPA, jalan, fasilitas umum.

    TPA dicari dalam radius 2 km karena lindi dan bau berdampak jauh lebih
    luas daripada objek lain.
    """
    query = f"""
    [out:json];
    (
      node(around:200,{lat},{lon})["waterway"];
      way(around:200,{lat},{lon})["waterway"];
      node(around:2000,{lat},{lon})["landuse"="landfill"];
      way(around:2000,{lat},{lon})["landuse"="landfill"];
      node(around:200,{lat},{lon})["amenity"];
      way(around:200,{lat},{lon})["highway"];
    );
    out body 5;
    """
    last_exc: Optional[Exception] = None
    for url in OVERPASS_URLS:
        try:
            r = await client.post(url, data={"data": query}, headers=HEADERS, timeout=TIMEOUT_S)
            if r.status_code == 200:
                names: list[str] = []
                for element in r.json().get("elements", []):
                    tags = element.get("tags", {})
                    name = (
                        tags.get("name")
                        or tags.get("waterway")
                        or tags.get("amenity")
                        or tags.get("highway")
                    )
                    if name:
                        names.append(name)

                # dict.fromkeys mempertahankan urutan sekaligus membuang duplikat
                return list(dict.fromkeys(names))[:5]
        except Exception as exc:
            last_exc = exc
            continue

    if last_exc is not None:
        log.info("Overpass POI lookup dilewati (timeout/busy): %s", last_exc)
        return []
    return []


async def fetch_all(lat: float, lon: float) -> tuple[dict[str, Any], list[str]]:
    """Ambil semua sumber luar secara paralel dengan connection pooling.

    Mengembalikan (hasil, daftar_sumber_gagal). Nilai untuk sumber yang gagal
    adalah None — pemanggil wajib memeriksanya.
    """
    client = _get_shared_client()
    tasks = {
        "geocode": _reverse_geocode(client, lat, lon),
        "weather": _weather(client, lat, lon),
        "air_quality": _air_quality(client, lat, lon),
        "earthquakes": _earthquakes(client, lat, lon),
        "official_fault_geometry": _official_fault_geometry(client),
        "nearby": _nearby_pois(client, lat, lon),
    }
    tasks.update(
        {
            name: _inarisk_layer(
                client,
                layer,
                lat,
                lon,
                as_class=name in {"flood", "landslide"},
            )
            for name, layer in INARISK_LAYERS.items()
        }
    )

    settled = await asyncio.gather(*tasks.values(), return_exceptions=True)

    results: dict[str, Any] = {}
    failed: list[str] = []

    for name, outcome in zip(tasks.keys(), settled):
        if isinstance(outcome, BaseException):
            log.warning("Sumber '%s' gagal: %s", name, outcome)
            results[name] = None
            failed.append(name)
        else:
            results[name] = outcome

    return results, failed


def is_water_body(
    lat: float,
    lon: float,
    address: str,
    elevation: float,
    geocode: Optional[dict],
) -> bool:
    """Deteksi apakah koordinat jatuh di perairan.

    Audit di tengah laut harus ditandai, bukan diberi skor seolah lahan
    layak bangun. Deteksi bertumpuk karena tidak ada satu sinyal pun yang
    dapat diandalkan sendirian.
    """
    if geocode is None:
        # Tanpa geocoding, elevasi nol atau negatif satu-satunya petunjuk.
        return elevation <= 0

    # Sinyal terkuat, dan yang paling sering terlewat: Nominatim tidak
    # mengenal titik di laut lepas, jadi ia mengembalikan wilayah administratif
    # terdekat yang bisa berjarak ratusan kilometer. Elevasi nol ditambah
    # hasil geocoding yang jauh berarti titiknya di air.
    try:
        matched_lat = float(geocode["lat"])
        matched_lon = float(geocode["lon"])
        offset_km = _haversine_km(lat, lon, matched_lat, matched_lon)
        if elevation <= 0 and offset_km > 0.4:
            return True
    except (KeyError, TypeError, ValueError):
        pass

    addr = geocode.get("address", {}) or {}
    place_type = str(geocode.get("type") or "").lower()
    category = str(geocode.get("category") or "").lower()

    if addr.get("ocean") or addr.get("sea") or addr.get("water"):
        return True
    if place_type in ("sea", "ocean"):
        return True
    if category == "natural" and place_type in ("water", "bay", "strait", "coastline"):
        return True
    if category == "waterway":
        return True
    if geocode.get("error"):
        return True

    # Jika ada fitur jalan, bangunan, toko, fasilitas daratan, ini pasti daratan
    if any(addr.get(k) for k in ("road", "building", "house_number", "amenity", "shop", "industrial", "landuse")):
        return False

    # Cocokkan sebagai kata utuh, bukan substring: "selat" TIDAK boleh cocok
    # dengan "Selatan", dan "teluk" di nama jalan/wilayah daratan tidak boleh
    # dianggap perairan jika ada bukti daratan.
    water_words = (
        "ocean", "sea", "laut", "selat", "strait", "bay", "samudra", "teluk",
    )
    lowered = address.lower()
    has_water_word = any(re.search(rf"\b{re.escape(w)}\b", lowered) for w in water_words)

    if has_water_word:
        is_admin_or_place = any(addr.get(k) for k in ("suburb", "neighbourhood", "village", "town", "city", "county", "state"))
        if is_admin_or_place and elevation > 0:
            return False
        if category == "place" and place_type in ("neighbourhood", "suburb", "village", "town", "city", "quarter", "hamlet"):
            return False
        if elevation <= 0 or category in ("natural", "waterway"):
            return True

    return address == "Lokasi tidak terdeteksi" and elevation <= 0
