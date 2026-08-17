import asyncio
import time
from services import external

cities = {
    "Balam (Bandar Lampung)": (-5.4297, 105.2625),
    "Jakarta": (-6.2088, 106.8456),
    "Bandung": (-6.9175, 107.6191),
    "Surabaya": (-7.2575, 112.7521),
    "Medan": (3.5952, 98.6722),
}

async def benchmark_all():
    print("=== BENCHMARK KECEPATAN AUDIT KOTA-KOTA INDONESIA ===")
    for name, (lat, lon) in cities.items():
        t0 = time.time()
        res, failed = await external.fetch_all(lat, lon)
        t1 = time.time()
        addr = (res.get("geocode") or {}).get("display_name", "Lokasi terdeteksi")[:45]
        print(f"-> {name:<25}: {t1 - t0:.2f}s | {addr}...")

if __name__ == "__main__":
    asyncio.run(benchmark_all())
