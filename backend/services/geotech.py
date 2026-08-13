"""Perhitungan geoteknik — murni, tanpa I/O.

Tidak ada panggilan jaringan dan tidak ada akses database di modul ini.
Angka masuk, angka keluar. Itu membuatnya bisa diuji langsung dan
dibandingkan baris per baris dengan frontend/src/services/engine.js.

Sumber kebenaran adalah engine.js, bukan Safe_House_Core.py — versi
JavaScript punya lookup PGA 50+ kota se-Indonesia, sedangkan versi Python
lama masih hardcode wilayah Lampung.

Referensi:
- Seed & Idriss (1971) untuk CSR/CRR likuefaksi
- SNI 1726:2019 untuk klasifikasi situs dan faktor amplifikasi
"""

import math
from typing import Optional

from data.constants import (
    ACTIVE_FAULTS,
    CITY_COORDS,
    COASTLINE,
    MEGATHRUST,
    REGIONAL_PGA,
    VOLCANOES,
)

# Tabel faktor amplifikasi situs Fa (SNI 1726:2019).
# Baris = kelas situs, kolom = PGA acuan.
_FA_TABLE = {
    "SA": {0.25: 0.8, 0.5: 0.8, 1.0: 0.8},
    "SB": {0.25: 0.9, 0.5: 0.9, 1.0: 0.9},
    "SC": {0.25: 1.3, 0.5: 1.2, 1.0: 1.2},
    "SD": {0.25: 1.6, 0.5: 1.4, 1.0: 1.2},
    "SE": {0.25: 2.4, 0.5: 1.7, 1.0: 1.2},
}

EARTH_RADIUS_KM = 6371


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Jarak lingkaran besar antara dua koordinat, dalam kilometer."""
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(EARTH_RADIUS_KM * c, 2)


def nearest_point(lat: float, lon: float, points: list[dict]) -> dict:
    """Titik terdekat dari sebuah daftar bertanda koordinat.

    Mengembalikan {"name": str, "distance_km": float}. Daftar kosong
    menghasilkan nama "N/A" dan jarak None.
    """
    if not points:
        return {"name": "N/A", "distance_km": None}

    best = min(
        points,
        key=lambda p: haversine(lat, lon, p["coords"][0], p["coords"][1]),
    )
    return {
        "name": best["name"],
        "distance_km": haversine(lat, lon, best["coords"][0], best["coords"][1]),
    }


def top_nearest(lat: float, lon: float, points: list[dict], n: int = 3) -> list[dict]:
    """N titik terdekat, terurut dari yang paling dekat."""
    scored = [
        {
            "name": p["name"],
            "distance_km": haversine(lat, lon, p["coords"][0], p["coords"][1]),
        }
        for p in points
    ]
    return sorted(scored, key=lambda x: x["distance_km"])[:n]


def site_amplification(site_class: str, pga: float) -> float:
    """Faktor amplifikasi situs Fa untuk kelas situs dan PGA tertentu."""
    if pga <= 0.25:
        pga_ref = 0.25
    elif pga <= 0.5:
        pga_ref = 0.5
    else:
        pga_ref = 1.0
    return _FA_TABLE.get(site_class, _FA_TABLE["SD"]).get(pga_ref, 1.2)


def regional_pga(lat: float, lon: float) -> dict:
    """PGA desain dari kota acuan terdekat.

    Mengembalikan {"pga": float, "city": str, "distance_km": float}.
    """
    nearest_city = "Default"
    min_dist = float("inf")

    for city, coords in CITY_COORDS.items():
        dist = haversine(lat, lon, coords[0], coords[1])
        if dist < min_dist:
            min_dist = dist
            nearest_city = city

    return {
        "pga": REGIONAL_PGA.get(nearest_city, REGIONAL_PGA["Default"]),
        "city": nearest_city,
        "distance_km": None if min_dist == float("inf") else min_dist,
    }


def estimate_vs30(elevation_m: float) -> int:
    """Estimasi Vs30 (m/s) dari elevasi.

    Inferensi kasar: dataran rendah cenderung aluvial dan lunak, dataran
    tinggi cenderung batuan vulkanik yang lebih padat. Bukan pengganti
    pengukuran lapangan — hanya untuk penyaringan awal.
    """
    if elevation_m < 15:
        return 160
    if elevation_m < 50:
        return 280
    if elevation_m < 150:
        return 450
    return 760


def classify_site(vs30: int) -> str:
    """Kelas situs SNI 1726:2019 dari nilai Vs30."""
    if vs30 < 180:
        return "SE"
    if vs30 < 360:
        return "SD"
    return "SC"


def liquefaction(lat: float, lon: float, elevation_m: float) -> dict:
    """Factor of Safety likuefaksi menurut pendekatan Seed & Idriss.

    CSR dihitung dari PGA permukaan (PGA desain dikali faktor amplifikasi).
    CRR diinferensi dari Vs30. FS < 1.0 berarti berpotensi likuefaksi.
    """
    vs30 = estimate_vs30(elevation_m)
    site_class = classify_site(vs30)

    regional = regional_pga(lat, lon)
    pga = regional["pga"]

    fa = site_amplification(site_class, pga)
    pga_surface = pga * fa

    # CRR dari kekakuan tanah. Tanah lunak jauh lebih rentan.
    if vs30 < 180:
        crr = 0.12
    elif vs30 < 360:
        crr = 0.28
    else:
        crr = 0.65

    # Rasio tegangan vertikal total terhadap efektif, didekati dari Vs30.
    stress_ratio = 1.3 if vs30 < 180 else 1.1
    rd = 0.9  # faktor reduksi tegangan pada kedalaman dangkal

    csr = 0.65 * stress_ratio * pga_surface * rd
    fs = round(crr / csr, 2) if csr > 0 else 10.0

    if fs < 0.5:
        risk_score = 95
    elif fs < 1.0:
        risk_score = 80
    elif fs < 1.2:
        risk_score = 50
    else:
        risk_score = 10

    # Periode resonansi tanah — dipakai untuk peringatan resonansi bangunan.
    h_est = 30 if vs30 < 200 else 15
    t0 = round((4 * h_est) / vs30, 2)

    return {
        "fs": fs,
        "status": "RAWAN" if fs < 1.0 else "AMAN",
        "vs30": vs30,
        "site_class": site_class,
        "pga": pga,
        "fa": fa,
        "pga_surface": round(pga_surface, 3),
        "risk_score": risk_score,
        "t0_resonance": t0,
        "nearest_city": regional["city"],
    }


def geotech_profile(lat: float, lon: float, elevation_m: Optional[float]) -> dict:
    """Profil geoteknik lengkap untuk satu koordinat.

    Elevasi None diperlakukan sebagai 0 meter — asumsi paling konservatif,
    karena dataran terendah menghasilkan Vs30 terendah dan FS terburuk.
    """
    elevation = 0.0 if elevation_m is None else float(elevation_m)

    profile = liquefaction(lat, lon, elevation)
    profile["elevation_m"] = elevation
    profile["nearest_fault"] = nearest_point(lat, lon, ACTIVE_FAULTS)
    profile["nearest_volcano"] = nearest_point(lat, lon, VOLCANOES)
    profile["nearest_megathrust"] = nearest_point(lat, lon, MEGATHRUST)
    profile["nearest_coast"] = nearest_point(lat, lon, COASTLINE)
    profile["elevation_assumed"] = elevation_m is None

    return profile
