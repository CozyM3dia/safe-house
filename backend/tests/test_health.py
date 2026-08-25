"""Health harus jujur: proses hidup ≠ penyimpanan hidup."""

import unittest
from unittest.mock import patch

import httpx

from main import app


class HealthRouteTests(unittest.IsolatedAsyncioTestCase):
    async def _get(self):
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            return await client.get("/api/health")

    async def test_connected_reports_ok(self):
        with patch("main.db.is_connected", return_value=True):
            response = await self._get()

        self.assertEqual(200, response.status_code)
        body = response.json()
        self.assertEqual("ok", body["status"])
        self.assertEqual("connected", body["database"])

    async def test_unavailable_is_degraded_not_ok(self):
        with patch("main.db.is_connected", return_value=False):
            response = await self._get()

        self.assertEqual(200, response.status_code)
        body = response.json()
        self.assertEqual("degraded", body["status"])
        self.assertEqual("unavailable", body["database"])
        self.assertNotEqual("ok", body["status"])


if __name__ == "__main__":
    unittest.main()
