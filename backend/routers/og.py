"""Router OG — HTML ber-meta + PNG kartu untuk crawler share (WA/X/Discord/TG/LI/FB).

Crawler tidak mengeksekusi JS, jadi SPA tidak pernah bisa menyuntik meta.
Semua endpoint sengaja hidup di bawah prefix /api/* karena itulah satu-satunya
path yang di-proxy ke backend di host Emergent; Vercel rewrite (frontend)
menunjuk ke sini lewat /api/og/laporan/{slug}.

Endpoint ini TIDAK menaikkan counter views (beda dengan /api/share/{slug}) —
hit crawler bukan sinyal minat. Query read-only, tanpa INSERT/UPDATE.
"""

import asyncio
import html as _html
import logging

from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse, Response

import db
from services.og_image import DEFAULT_TITLE, render_card
from services.site_url import backend_public_origin, public_site_origin

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api/og", tags=["og"])

# Sentinel: slug memang tidak ada di DB (beda dengan DB mati).
_MISSING = object()

_BAND_LABEL = {
    "safe": "AMAN",
    "moderate": "SEDANG",
    "danger": "RISIKO TINGGI",
    "insufficient_data": "DATA TERBATAS",
    "not_applicable": "TIDAK APPLICABLE",
}


async def _muat_audit(slug: str):
    """Return dict audit, `_MISSING` bila slug tak dikenal, atau None bila DB mati/error.

    Query read-only ke shared_reports + audits — tidak ada efek samping.
    """
    pool = db.get_pool()
    if pool is None:
        return None
    try:
        share = await pool.fetchrow(
            "SELECT audit_id FROM shared_reports WHERE slug = $1", slug
        )
        if share is None:
            return _MISSING
        audit = await pool.fetchrow(
            "SELECT data FROM audits WHERE id = $1", share["audit_id"]
        )
        if audit is None:
            return _MISSING
        return dict(audit["data"])
    except Exception as exc:  # noqa: BLE001 — crawler tetap harus dapat HTML
        log.warning("Gagal memuat audit untuk OG slug=%s: %s", slug, exc)
        return None


def _judul(data: dict | None) -> str:
    if not data:
        return "S.A.F.E House — Audit Risiko Geoteknik Properti"
    alamat = (data.get("address") or "Lokasi").split(",")[0].strip()
    skor = data.get("safe_score")
    return f"S.A.F.E Score {skor} — {alamat}" if skor is not None else f"Audit Risiko — {alamat}"


def _deskripsi(data: dict | None) -> str:
    if not data:
        return (
            "Kelas situs Vs30, PGA desain, FS likuefaksi, dan bahaya banjir "
            "dari satu koordinat — parameter SNI 1726:2019 siap-PBG dalam dua menit."
        )
    band = _BAND_LABEL.get(data.get("risk_level"), "DATA TERBATAS")
    geo = data.get("geotech") or {}
    if data.get("safe_score") is not None:
        bagian = [f"S.A.F.E Score {data.get('safe_score')} ({band})"]
    else:
        bagian = [f"Status: {band}"]
    if geo.get("site_class"):
        bagian.append(f"kelas situs {geo['site_class']}")
    if geo.get("pga") is not None:
        bagian.append(f"PGA {geo['pga']}g")
    if geo.get("fs") is not None:
        bagian.append(f"FS likuefaksi {geo['fs']}")
    return " · ".join(bagian) + " — audit SNI 1726:2019 oleh S.A.F.E House"


def _base_api(request: Request) -> str:
    """Host yang melayani endpoint ini. Env menang (proxy kadang menulis ulang
    Host); tanpa env, host request dipakai — backend dan gambar selalu satu
    origin sehingga og:image selalu fetchable di host mana pun HTML disajikan."""
    return backend_public_origin(request)


def _base_site(request: Request) -> str:
    """Domain kanonik halaman share. PUBLIC_SITE_URL menang bila valid;
    host mati (safehouse.web.id NXDOMAIN) diabaikan — lihat site_url."""
    return public_site_origin(request)


def _html_meta(*, judul: str, deskripsi: str, slug: str, base_api: str, base_site: str) -> str:
    esc = _html.escape
    slug_aman = esc(slug, quote=True)
    gambar = f"{base_api}/api/og/img/{slug_aman}.png"
    url_halaman = f"{base_site}/laporan/{slug_aman}"
    return f"""<!doctype html>
<html lang="id"><head>
<meta charset="utf-8">
<title>{esc(judul)}</title>
<meta name="description" content="{esc(deskripsi)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="S.A.F.E House">
<meta property="og:title" content="{esc(judul)}">
<meta property="og:description" content="{esc(deskripsi)}">
<meta property="og:image" content="{gambar}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="{url_halaman}">
<meta property="og:locale" content="id_ID">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{esc(judul)}">
<meta name="twitter:description" content="{esc(deskripsi)}">
<meta name="twitter:image" content="{gambar}">
<meta http-equiv="refresh" content="0;url={url_halaman}">
</head><body>
<noscript><p>{esc(judul)} — {esc(deskripsi)}</p></noscript>
<p>Menuju laporan… <a href="{url_halaman}">{url_halaman}</a></p>
</body></html>"""


def _storage_down_html(*, slug: str, request: Request) -> str:
    """HTML jujur saat DB mati — jangan menyamar sebagai laporan sukses."""
    esc = _html.escape
    slug_aman = esc(slug, quote=True)
    base_site = _base_site(request)
    url_halaman = f"{base_site}/laporan/{slug_aman}"
    judul = "Laporan tidak tersedia — penyimpanan mati"
    deskripsi = (
        "S.A.F.E House tidak dapat memuat laporan publik karena database "
        "tidak tersambung. Audit di /app tetap dihitung; tautan /laporan "
        "membutuhkan DATABASE_URL (PostgreSQL/Supabase) di server."
    )
    return f"""<!doctype html>
<html lang="id"><head>
<meta charset="utf-8">
<title>{esc(judul)}</title>
<meta name="description" content="{esc(deskripsi)}">
<meta name="robots" content="noindex">
<meta property="og:type" content="website">
<meta property="og:site_name" content="S.A.F.E House">
<meta property="og:title" content="{esc(judul)}">
<meta property="og:description" content="{esc(deskripsi)}">
<meta property="og:url" content="{url_halaman}">
<meta property="og:locale" content="id_ID">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="{esc(judul)}">
<meta name="twitter:description" content="{esc(deskripsi)}">
</head><body>
<h1>{esc(judul)}</h1>
<p>{esc(deskripsi)}</p>
<p>Halaman laporan: <a href="{url_halaman}">{url_halaman}</a></p>
</body></html>"""


@router.get("/laporan/{slug}", response_class=HTMLResponse)
async def og_laporan(slug: str, request: Request):
    data = await _muat_audit(slug)
    if data is None:
        # DB mati / error: 503, bukan kartu generik 200 yang seolah laporan ada.
        return HTMLResponse(
            _storage_down_html(slug=slug, request=request),
            status_code=503,
            headers={"Cache-Control": "no-store"},
        )
    if data is _MISSING:
        # Slug tak dikenal: 404 semantik, tapi crawler mayoritas tetap
        # membaca body — beri meta default tanpa angka palsu.
        return HTMLResponse(
            _html_meta(
                judul=_judul(None),
                deskripsi=_deskripsi(None),
                slug=slug,
                base_api=_base_api(request),
                base_site=_base_site(request),
            ),
            status_code=404,
            headers={"Cache-Control": "public, max-age=60"},
        )
    judul = _judul(data)
    deskripsi = _deskripsi(data)
    return HTMLResponse(
        _html_meta(
            judul=judul,
            deskripsi=deskripsi,
            slug=slug,
            base_api=_base_api(request),
            base_site=_base_site(request),
        ),
        headers={"Cache-Control": "public, max-age=300"},
    )


# Cache PNG in-memory: slug -> bytes. Audit immutable sehingga slug cukup
# sebagai kunci. Tanpa eviksi sengaja — jumlah laporan aktif kecil selama
# kontes; ganti ke TTL bila tumbuh.
_CACHE_PNG: dict[str, bytes] = {}
_KUNCI_DEFAULT = "__default__"


def _kartu_default() -> bytes:
    if _KUNCI_DEFAULT not in _CACHE_PNG:
        _CACHE_PNG[_KUNCI_DEFAULT] = render_card(
            title=DEFAULT_TITLE, score=None, band_key="insufficient_data"
        )
    return _CACHE_PNG[_KUNCI_DEFAULT]


@router.get("/img/{slug}.png")
async def og_img(slug: str):
    if slug not in _CACHE_PNG:
        data = await _muat_audit(slug)
        if data is None or data is _MISSING or not isinstance(data, dict):
            _CACHE_PNG[slug] = _kartu_default()
        else:
            judul = (data.get("address") or "Lokasi").split(",")[0].strip()
            _CACHE_PNG[slug] = await asyncio.to_thread(
                render_card,
                title=judul,
                score=data.get("safe_score"),
                band_key=data.get("risk_level") or "insufficient_data",
            )
    return Response(
        _CACHE_PNG[slug],
        media_type="image/png",
        headers={"Cache-Control": "public, max-age=86400"},
    )


@router.get("/default.png")
async def og_default():
    """Kartu generik untuk meta statis index.html (landing, /app)."""
    return Response(
        _kartu_default(),
        media_type="image/png",
        headers={"Cache-Control": "public, max-age=86400"},
    )


@router.get("/{slug}", response_class=HTMLResponse)
async def og_slug_alias(slug: str, request: Request):
    """Alias /api/og/{slug} → /api/og/laporan/{slug}.

    Smoke test dan beberapa crawler mengetik /api/og/:slug; path kanonik
    tetap /api/og/laporan/{slug}, /api/og/img/{slug}.png, /api/og/default.png.
    Didaftarkan terakhir supaya tidak menelan /img dan /default.png.
    """
    if slug in {"laporan", "img", "default.png"}:
        return HTMLResponse("Not Found", status_code=404)
    return await og_laporan(slug, request)
