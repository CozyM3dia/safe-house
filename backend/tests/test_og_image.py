"""Test renderer kartu OG — murni fungsi, tanpa DB."""

import io
import unittest

from PIL import Image

from services.og_image import DEFAULT_TITLE, render_card


class RenderCardTest(unittest.TestCase):
    def test_menghasilkan_png_1200x630(self):
        png = render_card(title="Kec. Rajabasa, Bandar Lampung", score=65, band_key="moderate")
        self.assertTrue(png.startswith(b"\x89PNG"))
        img = Image.open(io.BytesIO(png))
        self.assertEqual(img.size, (1200, 630))

    def test_skor_none_tidak_crash(self):
        png = render_card(title="Lokasi tanpa skor", score=None, band_key="insufficient_data")
        self.assertTrue(png.startswith(b"\x89PNG"))

    def test_alamat_panjang_dipangkas(self):
        png = render_card(title="Jl. " + "Sangat Panjang " * 40, score=78, band_key="safe")
        img = Image.open(io.BytesIO(png))
        self.assertEqual(img.size, (1200, 630))

    def test_band_tidak_dikenal_pakai_default(self):
        png = render_card(title=DEFAULT_TITLE, score=None, band_key="apa_gitu")
        self.assertTrue(png.startswith(b"\x89PNG"))


if __name__ == "__main__":
    unittest.main()
