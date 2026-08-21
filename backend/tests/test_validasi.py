"""Tests for the historical validation endpoint and PBG checklist."""
import unittest

from fastapi.testclient import TestClient

from main import app
from services.pbg_checklist import build_pbg_checklist


def _geotech(**overrides):
    base = {
        "fs": 0.56,
        "status": "RAWAN",
        "vs30": 280,
        "site_class": "SD",
        "pga": 0.65,
        "fa": 1.2,
        "pga_surface": 0.78,
        "risk_score": 80,
        "t0_resonance": 0.6,
        "nearest_city": "Palu",
        "elevation_m": 20.0,
        "elevation_assumed": False,
        "nearest_fault": {"name": "Sesar Palu-Koro (Sulteng)", "distance_km": 1.57},
        "nearest_volcano": {"name": "N/A", "distance_km": None},
        "nearest_megathrust": {"name": "N/A", "distance_km": None},
        "nearest_coast": {"name": "N/A", "distance_km": None},
        "provenance": {},
    }
    base.update(overrides)
    return base


class ValidationEndpointTests(unittest.TestCase):
    def test_all_curated_events_match_their_facts(self):
        client = TestClient(app)
        response = client.get("/api/validasi")

        self.assertEqual(200, response.status_code)
        payload = response.json()
        self.assertGreaterEqual(payload["total"], 5)
        # Setiap kejadian terkurasi harus cocok dengan fakta lapangan.
        # Kalau engine berubah dan salah satu gagal, tes ini yang membunyikan
        # alarm — jangan diam-diam turunkan ekspektasinya.
        self.assertEqual(
            payload["total"],
            payload["matched"],
            f"Kejadian tidak cocok: {[e['id'] for e in payload['events'] if not e['match']]}",
        )
        for event in payload["events"]:
            self.assertIn(event["expect"]["check"], {
                "fs_below", "fault_below_km", "pga_surface_above", "pga_above",
            })
            computed = event["computed"]
            for key in ("fs", "vs30", "site_class", "pga_surface", "nearest_fault"):
                self.assertIn(key, computed)

    def test_palu_balaroa_is_flagged_liquefaction_prone(self):
        client = TestClient(app)
        payload = client.get("/api/validasi").json()
        balaroa = next(e for e in payload["events"] if e["id"] == "palu-balaroa-2018")
        self.assertEqual("RAWAN", balaroa["computed"]["liquefaction_status"])
        self.assertLess(balaroa["computed"]["fs"], 1.0)


class PbgChecklistTests(unittest.TestCase):
    def test_high_risk_site_produces_full_wajib_set(self):
        items = build_pbg_checklist(
            geotech=_geotech(),
            flood_class=3,
            flood_known=True,
            landslide_class=3,
            landslide_known=True,
            subsidence_risk=70,
            tsunami_band="MODERAT-TINGGI",
        )
        ids = {item["id"] for item in items}
        priorities = {item["id"]: item["priority"] for item in items}

        self.assertIn("soil_investigation", ids)
        self.assertEqual("wajib", priorities["soil_investigation"])
        self.assertIn("seismic_design_spectrum", ids)
        self.assertIn("ductile_detailing", ids)  # SD + pga_surface 0.78
        self.assertEqual("wajib", priorities["liquefaction_study"])  # fs 0.56
        self.assertEqual("wajib", priorities["fault_zone_review"])  # 1.57 km
        self.assertEqual("wajib", priorities["flood_proofing"])
        self.assertEqual("wajib", priorities["slope_stability"])
        self.assertIn("subsidence_monitoring", ids)
        self.assertIn("tsunami_readiness", ids)

    def test_safe_site_stays_minimal(self):
        items = build_pbg_checklist(
            geotech=_geotech(
                fs=1.8, status="AMAN", site_class="SC", pga=0.10,
                pga_surface=0.09,
                nearest_fault={"name": "X", "distance_km": 120.0},
            ),
            flood_class=None,
            flood_known=True,
            landslide_class=1,
            landslide_known=True,
            subsidence_risk=20,
            tsunami_band="RENDAH",
        )
        ids = [item["id"] for item in items]
        priorities = {item["id"]: item["priority"] for item in items}

        self.assertEqual(["soil_investigation", "seismic_design_spectrum"], ids)
        self.assertNotIn("ductile_detailing", ids)

    def test_unknown_hazard_data_does_not_invent_requirements(self):
        items = build_pbg_checklist(
            geotech=_geotech(fs=1.2),
            flood_class=None,
            flood_known=False,
            landslide_class=None,
            landslide_known=False,
            subsidence_risk=None,
            tsunami_band="RENDAH",
        )
        ids = {item["id"] for item in items}
        self.assertNotIn("flood_proofing", ids)
        self.assertNotIn("slope_stability", ids)
        # fs 1.2 berada di zona abu-abu -> disarankan, bukan wajib.
        liquefaction = next(i for i in items if i["id"] == "liquefaction_study")
        self.assertEqual("disarankan", liquefaction["priority"])


if __name__ == "__main__":
    unittest.main()
