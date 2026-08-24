"""FastAPI integration tests untuk endpoint OG crawler (/og/laporan, /og/img)."""

import unittest
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import httpx

from main import app

_SLUG = "ab12cd34"

_AUDIT_DATA = {
    "address": "Gang Teratai, Bandar Lampung, Indonesia",
    "safe_score": 72,
    "risk_level": "moderate",
    "geotech": {"site_class": "SD", "pga": 0.42, "fs": 1.8},
}


def _pool_dengan_audit(data=None):
    """Pool mock: slug ketemu, audit mengembalikan `data`."""
    pool = MagicMock()
    pool.fetchrow = AsyncMock(
        side_effect=[{"audit_id": uuid.uuid4()}, {"data": data if data is not None else _AUDIT_DATA}]
    )
    return pool


class OgLaporanRouteTests(unittest.IsolatedAsyncioTestCase):
    async def _get(self, slug=_SLUG):
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            return await client.get(f"/og/laporan/{slug}")

    async def test_slug_valid_menghasilkan_meta_lengkap(self):
        pool = _pool_dengan_audit()
        with patch("routers.og.db.get_pool", return_value=pool):
            response = await self._get()

        self.assertEqual(200, response.status_code)
        body = response.text
        self.assertIn('property="og:title"', body)
        self.assertIn("Gang Teratai", body)
        self.assertIn(f"/og/img/{_SLUG}.png", body)
        self.assertRegex(body, r'property="og:image" content="https?://[^"]+"')
        self.assertIn('name="twitter:card" content="summary_large_image"', body)
        self.assertIn(f'http-equiv="refresh" content="0;url=', body)
        self.assertIn(f"/laporan/{_SLUG}", body)

    async def test_slug_tak_kenal_404_dengan_meta_default(self):
        pool = MagicMock()
        pool.fetchrow = AsyncMock(return_value=None)  # slug tidak ada di shared_reports
        with patch("routers.og.db.get_pool", return_value=pool):
            response = await self._get("slugngaco")

        self.assertEqual(404, response.status_code)
        body = response.text
        self.assertIn("S.A.F.E House", body)
        self.assertIn('property="og:title"', body)
        # Tidak ada angka skor palsu untuk slug yang tidak ada.
        self.assertNotIn("S.A.F.E Score", body)

    async def test_pool_none_200_kartu_default(self):
        with patch("routers.og.db.get_pool", return_value=None):
            response = await self._get()

        self.assertEqual(200, response.status_code)
        self.assertIn("S.A.F.E House", response.text)
        self.assertNotIn("S.A.F.E Score", response.text)

    async def test_karakter_berbahaya_ter_escape(self):
        data = {
            **_AUDIT_DATA,
            "address": '<script>alert("x")</script> & friends, Kota',
        }
        pool = _pool_dengan_audit(data)
        with patch("routers.og.db.get_pool", return_value=pool):
            response = await self._get()

        self.assertEqual(200, response.status_code)
        self.assertNotIn("<script>alert", response.text)
        self.assertIn("&lt;script&gt;", response.text)

    async def test_db_error_diperlakukan_sebagai_default(self):
        pool = MagicMock()
        pool.fetchrow = AsyncMock(side_effect=RuntimeError("koneksi putus"))
        with patch("routers.og.db.get_pool", return_value=pool):
            response = await self._get()

        self.assertEqual(200, response.status_code)
        self.assertIn("S.A.F.E House", response.text)


class OgImgRouteTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        from routers import og

        og._CACHE_PNG.clear()

    async def _get_img(self, slug=_SLUG):
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            return await client.get(f"/og/img/{slug}.png")

    async def test_slug_valid_png_dan_cache_hidup(self):
        pool = _pool_dengan_audit()
        with patch("routers.og.db.get_pool", return_value=pool):
            first = await self._get_img()
            # Panggilan kedua harus dilayani cache — pool.mock habis terpakai
            # pada panggilan pertama; jika query diulang, side_effect StopIteration.
            second = await self._get_img()

        self.assertEqual(200, first.status_code)
        self.assertEqual("image/png", first.headers["content-type"])
        self.assertTrue(first.content.startswith(b"\x89PNG"))
        self.assertEqual(first.content, second.content)

    async def test_slug_tak_kenal_tetap_png_default(self):
        pool = MagicMock()
        pool.fetchrow = AsyncMock(return_value=None)
        with patch("routers.og.db.get_pool", return_value=pool):
            response = await self._get_img("slugngaco")

        self.assertEqual(200, response.status_code)
        self.assertEqual("image/png", response.headers["content-type"])
        self.assertTrue(response.content.startswith(b"\x89PNG"))

    async def test_audit_tanpa_skor_png_tetap_tergenerate(self):
        data = {**_AUDIT_DATA, "safe_score": None, "risk_level": "insufficient_data"}
        pool = _pool_dengan_audit(data)
        with patch("routers.og.db.get_pool", return_value=pool):
            response = await self._get_img()

        self.assertEqual(200, response.status_code)
        self.assertTrue(response.content.startswith(b"\x89PNG"))


if __name__ == "__main__":
    unittest.main()
