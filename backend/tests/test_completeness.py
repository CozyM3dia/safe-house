"""Tests for the best-available, provenance-aware audit coverage."""

import unittest

from services.completeness import build_best_available_hazards, build_field_quality


class CompletenessTests(unittest.TestCase):
    def test_missing_hazard_layers_receive_explicit_model_fallbacks(self):
        hazards = build_best_available_hazards(
            flood_class=None,
            landslide_class=None,
            flood_available=True,
            landslide_available=True,
            elevation_m=4,
            coast_distance_km=2,
            weather={
                "current": {"precipitation": 12},
                "daily": {"precipitation_sum": [48]},
            },
            mode="best_available",
        )

        self.assertEqual("model", hazards["flood"]["status"])
        self.assertEqual("model", hazards["landslide"]["status"])
        self.assertIsInstance(hazards["flood"]["risk"], int)
        self.assertIsInstance(hazards["landslide"]["risk"], int)
        self.assertIn("BUKAN PETA BANJIR", hazards["flood"]["label"])
        self.assertIn("BUKAN PETA LONGSOR", hazards["landslide"]["label"])
        self.assertTrue(hazards["flood"]["used_fallback"])

    def test_strict_mode_keeps_missing_layers_unavailable(self):
        hazards = build_best_available_hazards(
            flood_class=None,
            landslide_class=None,
            flood_available=True,
            landslide_available=True,
            elevation_m=4,
            coast_distance_km=2,
            weather={},
            mode="strict",
        )

        self.assertEqual("unavailable", hazards["flood"]["status"])
        self.assertEqual("unavailable", hazards["landslide"]["status"])
        self.assertFalse(hazards["flood"]["used_fallback"])

    def test_field_quality_contains_status_source_and_confidence(self):
        quality = build_field_quality(
            raw={"weather": {"elevation": 120}, "air_quality": None},
            failed=["air_quality"],
            hazard_quality={
                "flood": {"status": "model", "source": "proxy", "confidence": 20},
                "landslide": {"status": "model", "source": "proxy", "confidence": 15},
                "subsidence": {"status": "model", "source": "proxy", "confidence": 10},
            },
            geotech={"provenance": {"vs30": "screening_proxy_from_elevation"}},
            location_source="nominatim_land_feature",
            elevation=120,
        )

        self.assertIn("fields", quality)
        self.assertEqual("model", quality["fields"]["flood"]["status"])
        self.assertEqual("unavailable", quality["fields"]["air_quality"]["status"])
        self.assertIn("source", quality["fields"]["soil"])
        self.assertIn("confidence", quality["fields"]["soil"])


if __name__ == "__main__":
    unittest.main()
