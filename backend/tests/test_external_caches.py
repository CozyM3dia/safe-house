"""Cache negatif geometri sesar PuSGeN: gagal baru tidak boleh dibayar ulang
oleh setiap audit dalam jendela TTL."""
import time
import unittest

import httpx

from services import external


def _valid_fault_collection() -> dict:
    return {"type": "FeatureCollection", "features": []}


class FaultGeometryNegativeCacheTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        external._cached_fault_geometry = None
        external._fault_geometry_failed_at = 0.0

    async def _client(self, handler):
        return httpx.AsyncClient(transport=httpx.MockTransport(handler))

    async def test_failed_fetch_is_not_retried_within_ttl(self):
        calls = {"count": 0}

        def handler(request: httpx.Request) -> httpx.Response:
            calls["count"] += 1
            return httpx.Response(500, json={"error": "down"})

        client = await self._client(handler)
        try:
            # Pertama: menjangkau jaringan dan gagal karena HTTP 500.
            with self.assertRaises(httpx.HTTPStatusError):
                await external._official_fault_geometry(client)
            # Kedua: gagal cepat dari cache negatif tanpa jaringan.
            with self.assertRaises(RuntimeError):
                await external._official_fault_geometry(client)
        finally:
            await client.aclose()

        # Satu kali jaringan; percobaan kedua gagal cepat dari cache negatif.
        self.assertEqual(1, calls["count"])
        self.assertGreater(external._fault_geometry_failed_at, 0.0)

    async def test_retry_allowed_after_ttl_expires(self):
        external._fault_geometry_failed_at = time.monotonic() - (
            external._FAULT_GEOMETRY_NEGATIVE_TTL_S + 1
        )
        calls = {"count": 0}

        def handler(request: httpx.Request) -> httpx.Response:
            calls["count"] += 1
            return httpx.Response(200, json=_valid_fault_collection())

        client = await self._client(handler)
        try:
            payload = await external._official_fault_geometry(client)
            again = await external._official_fault_geometry(client)
        finally:
            await client.aclose()

        self.assertEqual(_valid_fault_collection(), payload)
        self.assertIs(payload, again)
        self.assertEqual(1, calls["count"])

    async def test_invalid_payload_also_enters_negative_cache(self):
        calls = {"count": 0}

        def handler(request: httpx.Request) -> httpx.Response:
            calls["count"] += 1
            return httpx.Response(200, json={"type": "Point", "coordinates": [0, 0]})

        client = await self._client(handler)
        try:
            with self.assertRaises(RuntimeError):
                await external._official_fault_geometry(client)
            with self.assertRaises(RuntimeError):
                await external._official_fault_geometry(client)
        finally:
            await client.aclose()

        self.assertEqual(1, calls["count"])


if __name__ == "__main__":
    unittest.main()
