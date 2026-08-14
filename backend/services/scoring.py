"""Komposisi S.A.F.E Score dari data mentah.

Skor dihitung deterministik, bukan oleh AI. Angka yang sama untuk koordinat
yang sama, selamanya — itu syarat kalau laporan ini dipakai sebagai dasar
keputusan teknis. AI hanya menarasikan skor, tidak pernah menentukannya.
"""

from typing import Any, Optional

from data.constants import RISK_DOMAIN

# Bobot komponen risiko. Likuefaksi dan banjir paling berat karena keduanya
# menentukan kelayakan fondasi dan kerugian berulang — dua hal yang paling
# mahal untuk diperbaiki setelah bangunan berdiri.
WEIGHTS = {
    "flood": 0.25,
    "soil": 0.25,
    "seismic": 0.20,
    "landslide": 0.15,
    "air": 0.15,
}


def seismic_risk(fault_distance_km: Optional[float]) -> int:
    """Risiko kegempaan dari jarak ke sesar aktif terdekat."""
    if fault_distance_km is None:
        return 20
    if fault_distance_km < 5:
        return 95
    if fault_distance_km < 10:
        return 90
    if fault_distance_km < 20:
        return 70
    if fault_distance_km < 30:
        return 60
    if fault_distance_km < 50:
        return 40
    return 20


def tsunami_risk(coast_distance_km: Optional[float], elevation_m: float) -> str:
    """Tingkat risiko tsunami dari jarak pantai dan elevasi."""
    if coast_distance_km is None:
        return "RENDAH"
    if coast_distance_km < 1 and elevation_m < 7:
        return "TINGGI"
    if coast_distance_km < 3 and elevation_m < 15:
        return "MODERAT-TINGGI"
    if coast_distance_km < 5 and elevation_m < 20:
        return "MODERAT"
    return "RENDAH"


# Kelas bahaya InaRISK dipetakan ke label dan nilai risiko 0–100.
# Kelas None berarti titik tidak berada di area bahaya yang dipetakan.
_HAZARD_CLASS = {
    1: ("RENDAH", 25),
    2: ("SEDANG", 60),
    3: ("TINGGI", 85),
}

# Dipakai saat InaRISK tidak dapat dihubungi. Nilai 30 sengaja tidak nol —
# "tidak diketahui" tidak boleh diperlakukan sebagai "aman", karena itu
# menghasilkan skor yang terlalu percaya diri pada data yang tidak ada.
_UNKNOWN_RISK = 30


def _hazard_view(
    hazard_class: Optional[int], available: bool, water_label: Optional[str] = None
) -> tuple[str, int, bool]:
    """(label, nilai risiko, diketahui) untuk satu jenis bahaya."""
    if water_label is not None:
        return water_label, 100 if "TINGGI" in water_label else 0, True
    if not available:
        return "TIDAK DIKETAHUI (SUMBER TIDAK TERJANGKAU)", _UNKNOWN_RISK, False
    if hazard_class is None:
        return "TIDAK TERPETAKAN", 10, True

    label, risk = _HAZARD_CLASS.get(hazard_class, ("TIDAK DIKENALI", _UNKNOWN_RISK))
    return label, risk, True


def build_hazard(
    flood_class: Optional[int],
    landslide_class: Optional[int],
    flood_available: bool,
    landslide_available: bool,
    is_water: bool,
) -> dict[str, Any]:
    """Ringkasan bahaya banjir dan longsor beserta nilai risikonya.

    `*_available` menandakan apakah InaRISK berhasil dihubungi. Ini terpisah
    dari kelas bahaya karena "server tidak menjawab" dan "tidak ada bahaya"
    adalah dua hal yang sangat berbeda, dan pernah tertukar di versi lama.
    """
    flood_label, flood_risk, flood_known = _hazard_view(
        flood_class,
        flood_available,
        "SANGAT TINGGI (PERAIRAN)" if is_water else None,
    )
    landslide_label, landslide_risk, landslide_known = _hazard_view(
        landslide_class,
        landslide_available,
        "TIDAK ADA (PERAIRAN)" if is_water else None,
    )

    return {
        "flood_label": flood_label,
        "flood_risk": flood_risk,
        "flood_class": flood_class,
        "flood_known": flood_known,
        "landslide_label": landslide_label,
        "landslide_risk": landslide_risk,
        "landslide_class": landslide_class,
        "landslide_known": landslide_known,
    }


def build_radar(
    hazard: dict[str, Any],
    soil_risk: int,
    fault_distance_km: Optional[float],
    aqi: Optional[float],
    is_water: bool,
) -> dict[str, int]:
    """Lima sumbu radar risiko, masing-masing 0–100 (makin tinggi makin buruk)."""
    return {
        "flood": hazard["flood_risk"],
        "soil": 100 if is_water else soil_risk,
        "seismic": 100 if is_water else seismic_risk(fault_distance_km),
        "landslide": hazard["landslide_risk"],
        "air": 0 if is_water else int(aqi if aqi is not None else 20),
    }


def safe_score(radar: dict[str, int]) -> int:
    """S.A.F.E Score 0–100. Makin tinggi makin aman — kebalikan sumbu radar."""
    total_risk = sum(radar[key] * WEIGHTS[key] for key in WEIGHTS)
    return max(0, min(100, round(100 - total_risk)))


def risk_level(score: int) -> str:
    """Label domain risiko untuk sebuah skor."""
    for level, bounds in RISK_DOMAIN.items():
        if bounds["min"] <= score <= bounds["max"]:
            return level
    return "danger"
