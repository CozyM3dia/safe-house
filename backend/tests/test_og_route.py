"""FastAPI integration tests untuk endpoint OG crawler (/api/og/*)."""

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
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            return await client.get(f"/api/og/laporan/{slug}")

    async def test_slug_valid_menghasilkan_meta_lengkap(self):
        pool = _pool_dengan_audit()
        with patch("routers.og.db.get_pool", return_value=pool):
            response = await self._get()

        self.assertEqual(200, response.status_code)
        body = response.text
        self.assertIn('property="og:title"', body)
        self.assertIn("Gang Teratai", body)
        # og:image absolut, satu origin dengan host yang melayani HTML.
        self.assertIn(f'property="og:image" content="http://testserver/api/og/img/{_SLUG}.png"', body)
        self.assertIn('name="twitter:card" content="summary_large_image"', body)
        self.assertIn('http-equiv="refresh" content="0;url=', body)
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

    async def test_pool_none_503_jujur_bukan_kartu_sukses(self):
        with patch("routers.og.db.get_pool", return_value=None):
            response = await self._get()

        self.assertEqual(503, response.status_code)
        self.assertIn("penyimpanan mati", response.text.lower())
        self.assertIn("DATABASE_URL", response.text)
        self.assertNotIn("S.A.F.E Score", response.text)
        self.assertIn("noindex", response.text)

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

    async def test_db_error_503_jujur(self):
        pool = MagicMock()
        pool.fetchrow = AsyncMock(side_effect=RuntimeError("koneksi putus"))
        with patch("routers.og.db.get_pool", return_value=pool):
            response = await self._get()

        self.assertEqual(503, response.status_code)
        self.assertIn("penyimpanan mati", response.text.lower())
        self.assertNotIn("S.A.F.E Score", response.text)

    async def test_public_site_url_mengoverride_og_url(self):
        pool = _pool_dengan_audit()
        with patch("routers.og.db.get_pool", return_value=pool), patch.dict(
            "os.environ",
            {"PUBLIC_SITE_URL": "https://safehouse-pull.emergent.host/"},
            clear=False,
        ):
            response = await self._get()

        self.assertIn(
            'property="og:url" content="https://safehouse-pull.emergent.host/laporan/',
            response.text,
        )
        # og:image tetap mengikuti host backend (yang melayani gambar).
        self.assertIn(f"/api/og/img/{_SLUG}.png", response.text)

    async def test_dead_web_id_tidak_dipakai_sebagai_og_url(self):
        pool = _pool_dengan_audit()
        with patch("routers.og.db.get_pool", return_value=pool), patch.dict(
            "os.environ",
            {"PUBLIC_SITE_URL": "https://safehouse.web.id/", "PUBLIC_SITE_ALLOW_UNRESOLVED": ""},
            clear=False,
        ):
            response = await self._get()

        self.assertNotIn("safehouse.web.id", response.text)
        self.assertIn('property="og:url" content="http://testserver/laporan/', response.text)

    async def test_alias_api_og_slug(self):
        pool = _pool_dengan_audit()
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            with patch("routers.og.db.get_pool", return_value=pool):
                response = await client.get(f"/api/og/{_SLUG}")

        self.assertEqual(200, response.status_code)
        self.assertIn("Gang Teratai", response.text)


class OgImgRouteTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        from routers import og

        og._CACHE_PNG.clear()

    async def _get_img(self, path):
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            return await client.get(path)

    async def test_slug_valid_png_dan_cache_hidup(self):
        pool = _pool_dengan_audit()
        with patch("routers.og.db.get_pool", return_value=pool):
            first = await self._get_img(f"/api/og/img/{_SLUG}.png")
            # Panggilan kedua harus dilayani cache — pool.mock habis terpakai
            # pada panggilan pertama; jika query diulang, side_effect StopIteration.
            second = await self._get_img(f"/api/og/img/{_SLUG}.png")

        self.assertEqual(200, first.status_code)
        self.assertEqual("image/png", first.headers["content-type"])
        self.assertTrue(first.content.startswith(b"\x89PNG"))
        self.assertEqual(first.content, second.content)

    async def test_slug_tak_kenal_tetap_png_default(self):
        pool = MagicMock()
        pool.fetchrow = AsyncMock(return_value=None)
        with patch("routers.og.db.get_pool", return_value=pool):
            response = await self._get_img("/api/og/img/slugngaco.png")

        self.assertEqual(200, response.status_code)
        self.assertEqual("image/png", response.headers["content-type"])
        self.assertTrue(response.content.startswith(b"\x89PNG"))

    async def test_audit_tanpa_skor_png_tetap_tergenerate(self):
        data = {**_AUDIT_DATA, "safe_score": None, "risk_level": "insufficient_data"}
        pool = _pool_dengan_audit(data)
        with patch("routers.og.db.get_pool", return_value=pool):
            response = await self._get_img(f"/api/og/img/{_SLUG}.png")

        self.assertEqual(200, response.status_code)
        self.assertTrue(response.content.startswith(b"\x89PNG"))

    async def test_default_png_tanpa_db(self):
        with patch("routers.og.db.get_pool", return_value=None):
            response = await self._get_img("/api/og/default.png")

        self.assertEqual(200, response.status_code)
        self.assertEqual("image/png", response.headers["content-type"])
        self.assertTrue(response.content.startswith(b"\x89PNG"))


if __name__ == "__main__":
    unittest.main()
