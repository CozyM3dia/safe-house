import unittest

from services.geotech import nearest_geometry_fault


class OfficialFaultGeometryTests(unittest.TestCase):
    def test_nearest_fault_uses_polyline_not_feature_centroid(self):
        geometry = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {"Name": "Sesar Uji", "Segment": "Segmen A"},
                    "geometry": {
                        "type": "LineString",
                        "coordinates": [[100.0, 0.0], [101.0, 0.0]],
                    },
                }
            ],
        }

        result = nearest_geometry_fault(0.1, 100.5, geometry)

        self.assertEqual("Sesar Uji", result["name"])
        self.assertAlmostEqual(11.12, result["distance_km"], delta=0.2)


if __name__ == "__main__":
    unittest.main()
