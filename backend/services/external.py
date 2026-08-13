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
- Overpass           objek lingkungan sekitar (sungai, TPA, jalan)

Tidak ada satu pun yang membutuhkan kunci API.
"""

import asyncio
import logging
from typing import Any, Optional

import httpx

from services.geotech import haversine as _haversine_km

log = logging.getLogger(__name__)

# Timeout dasar untuk sumber yang responsif.
TIMEOUT_S = 8.0

# InaRISK jauh lebih lambat daripada sumber lain. Layer longsor menjawab di
# bawah dua detik, tetapi layer banjir kerap memakan 40–60 detik dan sering
# tidak menjawab sama sekali. Batas 25 detik adalah kompromi: cukup lama
# untuk menangkap jawaban yang lambat, cukup pendek supaya audit tidak
# tergantung terlalu lama. Kegagalan ditandai jujur, tidak dianggap "aman".
INARISK_TIMEOUT_S = 25.0

NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse"
OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
OPEN_METEO_AQ_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"
USGS_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query"
OVERPASS_URL = "https://overpass-api.de/api/interpreter"
INARISK_BASE = "https://gis.bnpb.go.id/server/rest/services/inarisk"

# Nominatim mewajibkan User-Agent yang mengidentifikasi aplikasi.
HEADERS = {"User-Agent": "SAFE-House/1.0 (audit risiko geospasial Indonesia)"}


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
            "current": "relative_humidity_2m,temperature_2m",
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
    client: httpx.AsyncClient, layer: str, lat: float, lon: float
) -> Optional[int]:
    """Kelas bahaya InaRISK pada satu titik.

    Layer InaRISK adalah raster, bukan feature layer. Operasi /query dengan
    outFields hanya mengembalikan galat 400 terbungkus HTTP 200 — terlihat
    berhasil, padahal tidak ada data. Yang benar adalah /identify, yang
    mengembalikan nilai piksel.

    Mengembalikan 1 (rendah), 2 (sedang), 3 (tinggi), atau None kalau titik
    tidak berada di area bahaya yang dipetakan.
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
        return int(round(float(raw)))
    except (TypeError, ValueError):
        log.warning("Nilai piksel InaRISK tidak dikenali: %r", raw)
        return None


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
    # Overpass menolak badan mentah dengan 406 — query harus dikirim
    # sebagai form field bernama "data".
    r = await client.post(OVERPASS_URL, data={"data": query}, headers=HEADERS)
    r.raise_for_status()

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


async def fetch_all(lat: float, lon: float) -> tuple[dict[str, Any], list[str]]:
    """Ambil semua sumber luar secara paralel.

    Mengembalikan (hasil, daftar_sumber_gagal). Nilai untuk sumber yang gagal
    adalah None — pemanggil wajib memeriksanya.
    """
    async with httpx.AsyncClient(timeout=TIMEOUT_S, follow_redirects=True) as client:
        tasks = {
            "geocode": _reverse_geocode(client, lat, lon),
            "weather": _weather(client, lat, lon),
            "air_quality": _air_quality(client, lat, lon),
            "earthquakes": _earthquakes(client, lat, lon),
            "flood": _inarisk_layer(client, "layer_bahaya_banjir_30", lat, lon),
            "landslide": _inarisk_layer(
                client, "layer_bahaya_tanah_longsor_30", lat, lon
            ),
            "nearby": _nearby_pois(client, lat, lon),
        }

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
    place_type = geocode.get("type")
    category = geocode.get("category")

    if addr.get("ocean") or addr.get("sea") or addr.get("water"):
        return True
    if place_type in ("sea", "ocean"):
        return True
    if category == "natural" and place_type == "water":
        return True
    if geocode.get("error"):
        return True

    water_words = (
        "ocean", "sea", "laut", "selat", "strait", "bay", "teluk", "samudra",
    )
    lowered = address.lower()
    if any(f" {w}" in f" {lowered}" for w in water_words):
        return True

    return address == "Lokasi tidak terdeteksi" and elevation <= 0
