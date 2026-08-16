"""Komposisi S.A.F.E Score dari data mentah.

Skor dihitung deterministik, bukan oleh AI. Angka yang sama untuk koordinat
yang sama, selamanya — itu syarat kalau laporan ini dipakai sebagai dasar
keputusan teknis. AI hanya menarasikan skor, tidak pernah menentukannya.
"""

from typing import Any, Optional

from data.constants import RISK_DOMAIN

# Bobot komponen *buildability* saja. AQI adalah indikator lingkungan yang
# berubah-ubah, bukan risiko fondasi, sehingga sengaja tidak masuk skor ini.
BUILDABILITY_WEIGHTS = {
    "flood": 0.25,
    "soil": 0.25,
    "seismic": 0.20,
    "landslide": 0.15,
    "subsidence": 0.15,
}

# Alias untuk konsumen lama; safe_score hanya memakai domain canonical di atas.
WEIGHTS = BUILDABILITY_WEIGHTS


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
        # Tidak ada piksel bahaya bukan berarti risiko rendah. Nilai netral ini
        # hanya untuk visualisasi; caller wajib menandai hasil sebagai
        # insufficient_data dan tidak boleh menerbitkan skor resmi.
        return "TIDAK TERPETAKAN", 50, False

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
    subsidence_risk: Optional[int] = None,
) -> dict[str, int]:
    """Canonical buildability axes plus a separate non-scored AQI axis."""
    return {
        "flood": hazard["flood_risk"],
        "soil": 100 if is_water else soil_risk,
        "seismic": 100 if is_water else seismic_risk(fault_distance_km),
        "landslide": hazard["landslide_risk"],
        # No official subsidence layer is wired yet. 50 is neutral for a
        # provisional chart and is excluded when score axes are supplied.
        "subsidence": 100 if is_water else (50 if subsidence_risk is None else max(0, min(100, int(subsidence_risk)))),
        # Kept for backwards-compatible payloads; safe_score ignores it.
        "air": 0 if is_water else max(0, min(100, int(aqi if aqi is not None else 20))),
    }


def safe_score(
    radar: dict[str, int], known_axes: Optional[set[str]] = None
) -> Optional[int]:
    """Buildability score 0–100, normalized over known canonical axes.

    ``known_axes`` is explicit so an unmapped layer cannot silently become a
    low-risk value. A caller with no usable axis receives ``None``.
    """
    axes = known_axes if known_axes is not None else set(BUILDABILITY_WEIGHTS)
    axes = {
        key for key in axes
        if key in BUILDABILITY_WEIGHTS and isinstance(radar.get(key), (int, float))
    }
    if not axes:
        return None

    total_weight = sum(BUILDABILITY_WEIGHTS[key] for key in axes)
    total_risk = sum(radar[key] * BUILDABILITY_WEIGHTS[key] for key in axes)
    normalized_risk = total_risk / total_weight
    return max(0, min(100, round(100 - normalized_risk)))


def risk_level(score: Optional[int]) -> str:
    """Label domain risiko untuk sebuah skor."""
    if score is None:
        return "insufficient_data"
    for level, bounds in RISK_DOMAIN.items():
        if bounds["min"] <= score <= bounds["max"]:
            return level
    return "danger"
