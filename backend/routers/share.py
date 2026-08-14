"""Router share — halaman audit publik.

Tiap audit bisa dibagikan lewat tautan pendek. Halaman publiknya menopang
loop upvote kontes: orang membuka hasil, terkejut, membagikannya, dan yang
membuka butuh akun untuk ikut menilai.

Tautan hanya memberi akses baca ke satu hasil audit — tidak ke akun,
tidak ke editor.
"""

import logging
import secrets

from bson import ObjectId
from bson.errors import InvalidId
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
    database = db.get_db()
    if database is None:
        raise HTTPException(status_code=503, detail="Penyimpanan tidak tersedia")

    try:
        audit_oid = ObjectId(req.audit_id)
    except (InvalidId, TypeError) as exc:
        raise HTTPException(status_code=422, detail="ID audit tidak valid") from exc

    audit = await database.audits.find_one({"_id": audit_oid})
    if audit is None:
        raise HTTPException(status_code=404, detail="Audit tidak ditemukan")

    # Satu audit satu slug — kalau sudah pernah dibagikan, pakai yang lama.
    existing = await database.shared_reports.find_one({"audit_id": audit_oid})
    if existing is not None:
        return ShareResult(slug=existing["slug"], url_path=f"/laporan/{existing['slug']}")

    # Tabrakan slug sangat kecil kemungkinannya, tapi tetap dijaga.
    for _ in range(5):
        slug = _new_slug()
        if await database.shared_reports.find_one({"slug": slug}) is None:
            break
    else:
        raise HTTPException(status_code=500, detail="Gagal membuat tautan, coba lagi")

    await database.shared_reports.insert_one(
        {"slug": slug, "audit_id": audit_oid, "views": 0}
    )
    return ShareResult(slug=slug, url_path=f"/laporan/{slug}")


@router.get("/{slug}", response_model=AuditResult)
async def get_shared(slug: str) -> AuditResult:
    database = db.get_db()
    if database is None:
        raise HTTPException(status_code=503, detail="Penyimpanan tidak tersedia")

    share = await database.shared_reports.find_one({"slug": slug})
    if share is None:
        raise HTTPException(status_code=404, detail="Tautan tidak ditemukan")

    audit = await database.audits.find_one({"_id": share["audit_id"]})
    if audit is None:
        raise HTTPException(status_code=404, detail="Audit sudah tidak tersedia")

    # Hitung tampilan sebagai sinyal minat, tidak menghalangi respons.
    await database.shared_reports.update_one(
        {"_id": share["_id"]}, {"$inc": {"views": 1}}
    )

    audit["id"] = str(audit.pop("_id"))
    audit["persisted"] = True
    return AuditResult(**audit)
