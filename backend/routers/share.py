"""Router share — halaman audit publik.

Tiap audit bisa dibagikan lewat tautan pendek. Halaman publiknya menopang
loop upvote kontes: orang membuka hasil, terkejut, membagikannya, dan yang
membuka butuh akun untuk ikut menilai.

Tautan hanya memberi akses baca ke satu hasil audit — tidak ke akun,
tidak ke editor.
"""

import logging
import secrets
import uuid

from fastapi import APIRouter, HTTPException

import db
from models import AuditResult, ShareRequest, ShareResult

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api/share", tags=["share"])

# Alfabet slug tanpa karakter yang mudah tertukar (0/O, 1/l/I).
_SLUG_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz"
_SLUG_LENGTH = 8


def _new_slug() -> str:
    return "".join(secrets.choice(_SLUG_ALPHABET) for _ in range(_SLUG_LENGTH))


@router.post("", response_model=ShareResult)
async def create_share(req: ShareRequest) -> ShareResult:
    pool = db.get_pool()
    if pool is None:
        raise HTTPException(
            status_code=503,
            detail=(
                "Penyimpanan tidak tersedia. Tautan /laporan membutuhkan "
                "DATABASE_URL (PostgreSQL/Supabase transaction pooler) di server."
            ),
        )

    try:
        audit_uid = uuid.UUID(req.audit_id)
    except (ValueError, TypeError) as exc:
        raise HTTPException(status_code=422, detail="ID audit tidak valid") from exc

    audit = await pool.fetchrow("SELECT id FROM audits WHERE id = $1", audit_uid)
    if audit is None:
        raise HTTPException(status_code=404, detail="Audit tidak ditemukan")

    # Satu audit satu slug — kalau sudah pernah dibagikan, pakai yang lama.
    existing = await pool.fetchrow(
        "SELECT slug FROM shared_reports WHERE audit_id = $1", audit_uid
    )
    if existing is not None:
        return ShareResult(slug=existing["slug"], url_path=f"/laporan/{existing['slug']}")

    # Tabrakan slug sangat kecil kemungkinannya, tapi tetap dijaga.
    for _ in range(5):
        slug = _new_slug()
        dup = await pool.fetchrow("SELECT 1 FROM shared_reports WHERE slug = $1", slug)
        if dup is None:
            break
    else:
        raise HTTPException(status_code=500, detail="Gagal membuat tautan, coba lagi")

    await pool.execute(
        "INSERT INTO shared_reports (slug, audit_id) VALUES ($1, $2)", slug, audit_uid
    )
    return ShareResult(slug=slug, url_path=f"/laporan/{slug}")


@router.get("/{slug}", response_model=AuditResult)
async def get_shared(slug: str) -> AuditResult:
    pool = db.get_pool()
    if pool is None:
        raise HTTPException(
            status_code=503,
            detail=(
                "Penyimpanan tidak tersedia. Tautan /laporan membutuhkan "
                "DATABASE_URL (PostgreSQL/Supabase transaction pooler) di server."
            ),
        )

    share = await pool.fetchrow(
        "SELECT id, audit_id FROM shared_reports WHERE slug = $1", slug
    )
    if share is None:
        raise HTTPException(status_code=404, detail="Tautan tidak ditemukan")

    audit = await pool.fetchrow(
        "SELECT id, data FROM audits WHERE id = $1", share["audit_id"]
    )
    if audit is None:
        raise HTTPException(status_code=404, detail="Audit sudah tidak tersedia")

    # Hitung tampilan sebagai sinyal minat, tidak menghalangi respons.
    await pool.execute(
        "UPDATE shared_reports SET views = views + 1 WHERE id = $1", share["id"]
    )

    data = dict(audit["data"])
    data["id"] = str(audit["id"])
    data["persisted"] = True
    return AuditResult(**data)
