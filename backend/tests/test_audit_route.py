"""FastAPI integration tests for audit boundary and score contract."""
import unittest
import os
from unittest.mock import AsyncMock, patch

import httpx

from main import app


def _land_geocode():
    return {
        "lat": "-5.3969553",
        "lon": "105.2660235",
        "type": "residential",
        "category": "place",
        "display_name": "Gang Teratai, Bandar Lampung, Indonesia",
        "address": {
            "road": "Gang Teratai",
            "city": "Bandar Lampung",
            "country": "Indonesia",
            "country_code": "id",
        },
    }


def _raw_data(*, geocode=None, flood=1, landslide=1):
    return {
        "geocode": geocode if geocode is not None else _land_geocode(),
        "weather": {"elevation": 102, "current": {"temperature_2m": 30}},
        "air_quality": {"current": {"european_aqi": 34, "pm2_5": 10}},
        "earthquakes": {"features": []},
        "flood": flood,
        "landslide": landslide,
        "nearby": [],
    }


class AuditRouteIntegrationTests(unittest.IsolatedAsyncioTestCase):
    async def _post(self, lat, lon, raw):
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            with patch("routers.audit.external.fetch_all", new=AsyncMock(return_value=(raw, []))), patch(
                "routers.audit.db.get_pool", return_value=None
            ):
                return await client.post("/api/audit", json={"lat": lat, "lon": lon})

    async def test_ocean_coordinate_is_rejected_by_api(self):
        ocean = {
            **_land_geocode(),
            "lat": "-7.3032412",
            "lon": "110.0044145",
            "type": "administrative",
            "category": None,
            "address": {"state": "Jawa Tengah", "country": "Indonesia", "country_code": "id"},
        }
        response = await self._post(-6.0, 110.5, _raw_data(geocode=ocean))
        self.assertEqual(422, response.status_code)
        self.assertIn("perairan", response.json()["detail"].lower())

    async def test_foreign_coordinate_is_rejected_by_api(self):
        singapore = {
            **_land_geocode(),
            "lat": "1.2998137",
            "lon": "103.7998400",
            "address": {"amenity": "school", "country": "Singapore", "country_code": "sg"},
        }
        response = await self._post(1.30, 103.80, _raw_data(geocode=singapore))
        self.assertEqual(422, response.status_code)
        self.assertIn("luar indonesia", response.json()["detail"].lower())

    async def test_unmapped_hazards_receive_a_transparent_provisional_score(self):
        response = await self._post(-5.397, 105.266, _raw_data(flood=None, landslide=None))
        self.assertEqual(200, response.status_code)
        payload = response.json()
        self.assertIsInstance(payload["safe_score"], int)
        self.assertEqual("provisional", payload["audit_status"])
        self.assertEqual("model", payload["data_quality"]["fields"]["flood"]["status"])
        self.assertIn("BUKAN PETA BANJIR", payload["hazard"]["flood_label"])

    async def test_valid_land_audit_is_explicitly_provisional_without_official_layers(self):
        response = await self._post(-5.397, 105.266, _raw_data())
        self.assertEqual(200, response.status_code)
        payload = response.json()
        self.assertIsInstance(payload["safe_score"], int)
        self.assertEqual("provisional", payload["audit_status"])
        self.assertIn("official_vs30_grid", payload["data_quality"]["optional_missing"])

    async def test_strict_mode_still_blocks_unmapped_critical_layers(self):
        with patch.dict(os.environ, {"AUDIT_DATA_MODE": "strict"}):
            response = await self._post(-5.397, 105.266, _raw_data(flood=None, landslide=None))
        self.assertEqual(200, response.status_code)
        payload = response.json()
        self.assertIsNone(payload["safe_score"])
        self.assertEqual("insufficient_data", payload["audit_status"])


if __name__ == "__main__":
    unittest.main()
