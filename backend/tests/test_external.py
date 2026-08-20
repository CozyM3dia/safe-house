"""Regression tests for external-data heuristics."""
import unittest

from services import external


def _geocode(lat="0.0", lon="0.0"):
    # Matched coords equal the query -> no ocean-offset trigger.
    return {"lat": lat, "lon": lon, "address": {}, "type": None, "category": None}


class WaterDetectionTests(unittest.TestCase):
    def test_selatan_is_not_water(self):
        # "selat" must not match inside "Selatan" (a very common direction),
        # and "teluk" / "laut" in street or district names on land must not be flagged as water.
        for addr, road, sub in [
            ("DPRD Provinsi Jawa Tengah, Semarang Selatan, Kota Semarang, Indonesia", "Jalan Pahlawan", "Semarang Selatan"),
            ("Natar, Lampung Selatan, Lampung, Indonesia", "Jalan Lintas Sumatera", "Natar"),
            ("Jalan Sudirman, Jakarta Selatan, DKI Jakarta, Indonesia", "Jalan Sudirman", "Kebayoran Baru"),
            ("Jalan Teluk Bone, Kota Karang, Teluk Betung Timur, Bandar Lampung, Indonesia", "Jalan Teluk Bone", "Teluk Betung Timur"),
            ("Jalan Laut Jawa, Harapan Baru, Bekasi Utara, Kota Bekasi, Jawa Barat, Indonesia", "Jalan Laut Jawa", "Bekasi Utara"),
        ]:
            geocode_data = _geocode()
            geocode_data["address"] = {"road": road, "suburb": sub}
            self.assertFalse(
                external.is_water_body(0.0, 0.0, addr, 11.0, geocode_data),
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


class InariskLayerContractTests(unittest.TestCase):
    def test_extended_layers_use_public_inarisk_mapservers(self):
        self.assertEqual(
            {
                "flood": "layer_bahaya_banjir_30",
                "landslide": "layer_bahaya_tanah_longsor_30",
                "tsunami": "layer_bahaya_tsunami_30",
                "liquefaction": "layer_bahaya_likuefaksi_30",
                "volcanic": "layer_bahaya_letusan_gunungapi_30",
                "coastal": "layer_bahaya_gelombang_ekstrim_dan_abrasi_30",
            },
            external.INARISK_LAYERS,
        )


if __name__ == "__main__":
    unittest.main()
