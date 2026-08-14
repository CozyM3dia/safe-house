"""Uji paritas — sisi Python.

Menjalankan services.geotech pada sepuluh koordinat acuan dan mencetak
hasilnya dalam format yang bisa dibandingkan langsung dengan keluaran
scripts/check_engine_parity.mjs (sisi JavaScript).

Pakai:
    cd backend
    python scripts/check_engine_parity.py > /tmp/py.txt
    node scripts/check_engine_parity.mjs > /tmp/js.txt
    diff /tmp/py.txt /tmp/js.txt

Tidak ada keluaran dari diff berarti port-nya benar. Ini pemeriksaan sekali
jalan untuk migrasi — begitu engine.js dihapus, skrip ini ikut dihapus.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from services.geotech import liquefaction  # noqa: E402

# Koordinat acuan: lima kota dengan profil risiko berbeda tajam, lima acak.
# Elevasi dipilih untuk menyentuh keempat ambang Vs30 (15, 50, 150 m).
CASES = [
    ("Bandar Lampung", -5.430, 105.262, 10),
    ("Jakarta Utara", -6.121, 106.845, 2),
    ("Padang", -0.947, 100.417, 8),
    ("Palu", -0.899, 119.856, 20),
    ("Denpasar", -8.650, 115.219, 40),
    ("Bandung", -6.917, 107.619, 768),
    ("Pontianak", -0.023, 109.343, 3),
    ("Yogyakarta", -7.797, 110.369, 113),
    ("Ambon", -3.695, 128.178, 25),
    ("Wamena", -4.100, 138.950, 1550),
]


def main() -> None:
    for label, lat, lon, elevation in CASES:
        r = liquefaction(lat, lon, elevation)
        print(
            f"{label:20} "
            f"fs={r['fs']:<7} "
            f"vs30={r['vs30']:<5} "
            f"site={r['site_class']:<3} "
            f"pga={r['pga']:<6} "
            f"fa={r['fa']:<5} "
            f"pga_surface={r['pga_surface']:<7} "
            f"risk={r['risk_score']:<4} "
            f"city={r['nearest_city']}"
        )


if __name__ == "__main__":
    main()
