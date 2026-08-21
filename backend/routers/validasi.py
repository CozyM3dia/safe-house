"""Router validasi historis — engine diuji terhadap kejadian nyata.

Setiap entri adalah kejadian bencana terdokumentasi. Engine yang sama dengan
``/api/audit`` (services.geotech, tanpa lapis AI) menghitung ulang parameter
di titik kejadian saat halaman dibuka, lalu dicocokkan dengan fakta lapangan.
Pencocokan jujur: kalau tidak cocok, ``match`` bernilai false — halaman ini
bukan iklan, tapi bukti.

Elevasi per situs adalah perkiraan topografi yang terdokumentasi (SRTM),
ditulis eksplisit karena Vs30 proksi diturunkan dari elevasi.
"""

import logging

from fastapi import APIRouter

from services.geotech import geotech_profile
from services.scoring import tsunami_risk

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["validasi"])

# Fakta kejadian dirangkum dari sumber publik: USGS (magnitudo/mekanisme),
# BNPB (dampak), PVMBG & kajian likuefaksi Palu 2018.
_EVENTS: list[dict] = [
    {
        "id": "palu-balaroa-2018",
        "event": {
            "name": "Gempa Palu-Donggala",
            "date": "2018-09-28",
            "magnitude": 7.4,
            "fact": (
                "Likuefaksi aliran menghancurkan Perumahan Balaroa; sekitar "
                "1.700 rumah hilang. Screening likuefaksi wajib menandai "
                "titik ini RAWAN."
            ),
            "source": "BNPB / kajian likuefaksi Palu 2018",
        },
        "site": {"name": "Balaroa, Palu, Sulawesi Tengah", "lat": -0.8925, "lon": 119.8620, "elevation_m": 20.0},
        "expect": {"check": "fs_below", "value": 1.0, "label": "FS likuefaksi < 1,0"},
    },
    {
        "id": "palu-petobo-2018",
        "event": {
            "name": "Gempa Palu-Donggala",
            "date": "2018-09-28",
            "magnitude": 7.4,
            "fact": (
                "Permukiman Petobo tersapu aliran lumpur; korban jiwa "
                "terbanyak dari seluruh zona likuefaksi Palu."
            ),
            "source": "BNPB / PVMBG",
        },
        "site": {"name": "Petobo, Palu, Sulawesi Tengah", "lat": -0.9483, "lon": 119.9231, "elevation_m": 10.0},
        "expect": {"check": "fs_below", "value": 1.0, "label": "FS likuefaksi < 1,0"},
    },
    {
        "id": "yogya-bantul-2006",
        "event": {
            "name": "Gempa Yogyakarta",
            "date": "2006-05-27",
            "magnitude": 6.3,
            "fact": (
                "Kerusakan terparah di Bantul, dekat Sesar Opak; lebih dari "
                "5.700 jiwa meninggal. Titik ini harus terbaca dekat sesar."
            ),
            "source": "BMKG / USGS / BNPB",
        },
        "site": {"name": "Bantul, Yogyakarta", "lat": -7.8900, "lon": 110.3500, "elevation_m": 20.0},
        "expect": {"check": "fault_below_km", "value": 10.0, "label": "Jarak Sesar Opak < 10 km"},
    },
    {
        "id": "lombok-kayangan-2018",
        "event": {
            "name": "Gempa Lombok Utara",
            "date": "2018-08-05",
            "magnitude": 6.9,
            "fact": (
                "Guncangan merusak berat di Kayangan, Lombok Utara; "
                "ratusan bangunan runtuh dalam satu gempa utama."
            ),
            "source": "USGS / BNPB",
        },
        "site": {"name": "Kayangan, Lombok Utara", "lat": -8.3550, "lon": 116.4500, "elevation_m": 25.0},
        "expect": {
            "check": "pga_surface_above",
            "value": 0.45,
            "label": "PGA permukaan > 0,45g",
        },
    },
    {
        "id": "padang-2009",
        "event": {
            "name": "Gempa Padang",
            "date": "2009-09-30",
            "magnitude": 7.6,
            "fact": (
                "Gempa intraslab M7,6 merusak ribuan bangunan di Padang; "
                "PGA desain regional kota ini termasuk tertinggi di Indonesia."
            ),
            "source": "USGS / PuSGeN",
        },
        "site": {"name": "Padang, Sumatra Barat", "lat": -0.9470, "lon": 100.4170, "elevation_m": 5.0},
        "expect": {"check": "pga_above", "value": 0.5, "label": "PGA desain > 0,50g"},
    },
]


def _evaluate(expect: dict, geotech: dict) -> bool:
    check = expect["check"]
    value = expect["value"]
    if check == "fs_below":
        return geotech.get("fs") is not None and geotech["fs"] < value
    if check == "fault_below_km":
        distance = (geotech.get("nearest_fault") or {}).get("distance_km")
        return distance is not None and distance < value
    if check == "pga_surface_above":
        return geotech.get("pga_surface") is not None and geotech["pga_surface"] > value
    if check == "pga_above":
        return geotech.get("pga") is not None and geotech["pga"] > value
    log.warning("Jenis pemeriksaan validasi tidak dikenal: %s", check)
    return False


@router.get("/validasi")
async def get_validation() -> dict:
    """Hitung ulang parameter engine di tiap titik kejadian historis."""
    results = []
    for entry in _EVENTS:
        site = entry["site"]
        geotech = geotech_profile(site["lat"], site["lon"], site["elevation_m"])
        coast = (geotech.get("nearest_coast") or {}).get("distance_km")
        results.append(
            {
                "id": entry["id"],
                "event": entry["event"],
                "site": {**site, "display_name": site["name"]},
                "computed": {
                    "fs": geotech.get("fs"),
                    "liquefaction_status": geotech.get("status"),
                    "vs30": geotech.get("vs30"),
                    "site_class": geotech.get("site_class"),
                    "pga": geotech.get("pga"),
                    "pga_surface": geotech.get("pga_surface"),
                    "nearest_fault": geotech.get("nearest_fault"),
                    "tsunami_risk": tsunami_risk(coast, site["elevation_m"]),
                },
                "expect": entry["expect"],
                "match": _evaluate(entry["expect"], geotech),
            }
        )

    matched = sum(1 for r in results if r["match"])
    return {
        "total": len(results),
        "matched": matched,
        "engine_note": (
            "Parameter dihitung ulang oleh engine deterministik yang sama "
            "dengan audit biasa (Vs30 proksi dari elevasi, PGA regional "
            "PuSGeN, CSR/CRR Seed-Idriss). Elevasi situs memakai perkiraan "
            "topografi terdokumentasi."
        ),
        "events": results,
    }
