"""Regression tests for external-data heuristics."""
import unittest

from services import external


def _geocode(lat="0.0", lon="0.0"):
    # Matched coords equal the query -> no ocean-offset trigger.
    return {"lat": lat, "lon": lon, "address": {}, "type": None, "category": None}


class WaterDetectionTests(unittest.TestCase):
    def test_selatan_is_not_water(self):
        # "selat" must not match inside "Selatan" (a very common direction).
        for addr in [
            "DPRD Provinsi Jawa Tengah, Semarang Selatan, Kota Semarang, Indonesia",
            "Natar, Lampung Selatan, Lampung, Indonesia",
            "Jalan Sudirman, Jakarta Selatan, DKI Jakarta, Indonesia",
        ]:
            self.assertFalse(
                external.is_water_body(0.0, 0.0, addr, 11.0, _geocode()),
                f"false water for: {addr}",
            )

    def test_real_water_still_detected(self):
        for addr in [
            "Selat Sunda, Lampung, Indonesia",
            "Teluk Lampung, Indonesia",
            "Samudra Hindia",
            "Laut Jawa",
        ]:
            self.assertTrue(
                external.is_water_body(0.0, 0.0, addr, 0.0, _geocode()),
                f"missed water for: {addr}",
            )

    def test_ocean_offset_still_flags(self):
        # Zero elevation + geocode far from the queried point => open water.
        far = {"lat": "-6.0", "lon": "110.0", "address": {}, "type": None}
        self.assertTrue(external.is_water_body(-7.0, 111.0, "Somewhere", 0.0, far))


if __name__ == "__main__":
    unittest.main()
