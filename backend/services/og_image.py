"""Renderer kartu OG 1200x630 untuk pratinjau share /laporan.

Murni fungsi sinkron (dipanggil via asyncio.to_thread dari router).
Palet mengikuti brand Mocha frontend; jangan perkenalkan warna baru.
"""

import sys
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ASSETS = Path(__file__).resolve().parent.parent / "assets"
LOGO_PATH = ASSETS / "logo-full.png"
FONT_DIR = ASSETS / "fonts"

UKURAN = (1200, 630)

# Palet Mocha (sumber: Toaster di App.jsx + styles frontend)
BG = (26, 17, 10)
TEKS_UTAMA = (240, 228, 204)
TEKS_REDUP = (168, 148, 122)
AKSEN = (224, 122, 95)
CHIP_TEKS = (26, 17, 10)

# Band risiko: warna solid + label singkat (ejaan baku: likuefaksi dsb. di HTML, bukan di sini)
BAND = {
    "safe": ((108, 166, 115), "AMAN"),
    "moderate": ((224, 164, 80), "SEDANG"),
    "danger": ((214, 92, 92), "RISIKO TINGGI"),
    "insufficient_data": ((140, 130, 120), "DATA TERBATAS"),
    "not_applicable": ((140, 130, 120), "N/A"),
}
DEFAULT_TITLE = "Audit Risiko Geoteknik Properti"


def _font(nama: str, ukuran: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONT_DIR / nama), ukuran)


def _pas(d: ImageDraw.ImageDraw, teks: str, font, maks_lebar: int) -> str:
    """Pangkas teks dengan elipsis sampai muat di maks_lebar."""
    if d.textlength(teks, font=font) <= maks_lebar:
        return teks
    while teks and d.textlength(teks + "…", font=font) > maks_lebar:
        teks = teks[:-1]
    return teks + "…"


def render_card(*, title: str, score: int | None, band_key: str) -> bytes:
    """Render kartu share. Selalu mengembalikan PNG utuh — tidak pernah raise."""
    try:
        return _render(title=title, score=score, band_key=band_key)
    except Exception:  # noqa: BLE001 — share image tidak boleh pecah
        return _render_fallback()


def _render(*, title: str, score: int | None, band_key: str) -> bytes:
    img = Image.new("RGB", UKURAN, BG)
    d = ImageDraw.Draw(img)

    f_brand = _font("DejaVuSans-Bold.ttf", 44)
    f_title = _font("DejaVuSans-Bold.ttf", 58)
    f_score = _font("DejaVuSans-Bold.ttf", 190)
    f_label = _font("DejaVuSans.ttf", 40)
    f_small = _font("DejaVuSans.ttf", 30)

    # Logo kiri-atas (jika ada asetnya; absen = skip, bukan gagal).
    # Aset logo sudah memuat wordmark — teks brand hanya digambar saat logo absen.
    if LOGO_PATH.exists():
        logo = Image.open(LOGO_PATH).convert("RGBA")
        skala = 72 / logo.height
        logo = logo.resize((int(logo.width * skala), 72))
        img.paste(logo, (64, 56), logo)
    else:
        d.text((64, 60), "S.A.F.E House", font=f_brand, fill=TEKS_UTAMA)

    # Garis aksen
    d.rectangle([64, 170, 220, 176], fill=AKSEN)

    # Lokasi (kolom kanan disisakan untuk skor; tanpa skor = lebar penuh)
    maks_judul = 760 if score is not None else 1072
    d.text((64, 210), _pas(d, title or DEFAULT_TITLE, f_title, maks_judul), font=f_title, fill=TEKS_UTAMA)

    # Skor besar kanan + chip band
    warna_band, label_band = BAND.get(band_key, BAND["insufficient_data"])
    if score is not None:
        teks_skor = str(score)
        w = d.textlength(teks_skor, font=f_score)
        d.text((1136 - w, 230), teks_skor, font=f_score, fill=warna_band)
        d.text((1136 - d.textlength("/100", font=f_label), 430), "/100", font=f_label, fill=TEKS_REDUP)

    # Chip band kiri-bawah
    pad_x, tinggi_chip = 28, 64
    w_chip = int(d.textlength(label_band, font=f_label)) + pad_x * 2
    y_chip = 460
    d.rounded_rectangle([64, y_chip, 64 + w_chip, y_chip + tinggi_chip], radius=14, fill=warna_band)
    d.text((64 + pad_x, y_chip + 10), label_band, font=f_label, fill=CHIP_TEKS)

    # Footer
    d.text(
        (64, 556),
        "Parameter SNI 1726:2019 siap-PBG dari satu koordinat",
        font=f_small,
        fill=TEKS_REDUP,
    )

    buf = BytesIO()
    img.save(buf, "PNG")
    return buf.getvalue()


def _render_fallback() -> bytes:
    img = Image.new("RGB", UKURAN, BG)
    d = ImageDraw.Draw(img)
    try:
        d.text((64, 270), "S.A.F.E House", font=_font("DejaVuSans-Bold.ttf", 84), fill=TEKS_UTAMA)
    except Exception:  # noqa: BLE001 — bahkan font hilang pun tetap PNG solid
        pass
    buf = BytesIO()
    img.save(buf, "PNG")
    return buf.getvalue()


if __name__ == "__main__":
    # Generator kartu default statis:
    #   PYTHONPATH=backend python -m services.og_image frontend/public/og-default.png
    target = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("og-default.png")
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(render_card(title=DEFAULT_TITLE, score=None, band_key="insufficient_data"))
    print(f"ditulis: {target}")
