"""Regression tests for fail-closed location validation."""
import unittest

from services.location import classify_location, point_in_geojson


def geocode(**overrides):
    payload = {
        "lat": "-5.397",
        "lon": "105.266",
        "type": "residential",
        "category": "place",
        "address": {
            "road": "Gang Teratai",
            "city": "Bandar Lampung",
            "country": "Indonesia",
            "country_code": "id",
        },
    }
    payload.update(overrides)
    return payload


class LocationValidationTests(unittest.TestCase):
    def test_java_sea_admin_fallback_is_not_buildable(self):
        result = classify_location(
            -6.0,
            110.5,
            geocode(
                lat="-7.3032412",
                lon="110.0044145",
                type="administrative",
                category=None,
                address={
                    "state": "Jawa Tengah",
                    "country": "Indonesia",
                    "country_code": "id",
                },
            ),
            elevation_m=13,
        )

        self.assertEqual("not_buildable", result.status)
        self.assertTrue(result.is_water)

    def test_foreign_country_inside_old_bbox_is_out_of_scope(self):
        result = classify_location(
            1.30,
            103.80,
            geocode(
                lat="1.2998137",
                lon="103.7998400",
                address={
                    "amenity": "New Town Primary School",
                    "country": "Singapore",
                    "country_code": "sg",
                },
            ),
            elevation_m=14,
        )

        self.assertEqual("out_of_scope", result.status)

    def test_land_feature_is_valid(self):
        result = classify_location(-5.397, 105.266, geocode(), elevation_m=102)
        self.assertEqual("valid_land", result.status)
        self.assertFalse(result.is_water)

    def test_geojson_land_mask_rejects_point_outside_polygon(self):
        mask = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[[100, -6], [101, -6], [101, -5], [100, -5], [100, -6]]],
                    },
                }
            ],
        }

        self.assertTrue(point_in_geojson(-5.5, 100.5, mask))
        self.assertFalse(point_in_geojson(-5.5, 102.0, mask))


if __name__ == "__main__":
    unittest.main()
