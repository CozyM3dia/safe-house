"""Regression tests for normalized 0–100 risk axes."""
import unittest

from services.scoring import build_hazard, build_radar, safe_score


class RadarBoundsTests(unittest.TestCase):
    def test_air_risk_caps_raw_aqi_at_one_hundred(self):
        radar = build_radar(
            hazard={"flood_risk": 10, "landslide_risk": 10},
            soil_risk=10,
            fault_distance_km=21.3,
            aqi=114,
            is_water=False,
        )

        self.assertEqual(100, radar["air"])
        self.assertLessEqual(max(radar.values()), 100)

    def test_buildability_score_does_not_use_air_quality(self):
        base = {
            "flood": 10,
            "soil": 20,
            "seismic": 30,
            "landslide": 40,
            "subsidence": 50,
        }
        with_clean_air = {**base, "air": 0}
        with_bad_air = {**base, "air": 100}

        self.assertEqual(safe_score(with_clean_air), safe_score(with_bad_air))

    def test_unmapped_hazard_is_unknown_not_low_risk(self):
        hazard = build_hazard(
            flood_class=None,
            landslide_class=None,
            flood_available=True,
            landslide_available=True,
            is_water=False,
        )

        self.assertFalse(hazard["flood_known"])
        self.assertFalse(hazard["landslide_known"])
        self.assertGreaterEqual(hazard["flood_risk"], 40)
        self.assertGreaterEqual(hazard["landslide_risk"], 40)


if __name__ == "__main__":
    unittest.main()
