"""Koneksi MongoDB.

Database sengaja bersifat opsional. Kalau MongoDB tidak tersambung, audit
tetap dihitung dan dikembalikan ke pengguna — hanya tidak tersimpan. Saat
demo di depan juri, database mati tidak boleh membuat aplikasi tampak rusak.
"""

import logging
import os

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

log = logging.getLogger(__name__)

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


async def connect() -> None:
    """Sambungkan ke MongoDB. Kegagalan dicatat, tidak dilempar."""
    global _client, _db

    uri = os.getenv("MONGO_URL")
    if not uri:
        log.warning("MONGO_URL tidak diset — audit tidak akan tersimpan")
        return

    try:
        _client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000)
        await _client.admin.command("ping")
        _db = _client[os.getenv("MONGO_DB", "safe_house")]
        await _ensure_indexes()
        log.info("MongoDB tersambung")
    except Exception as exc:  # noqa: BLE001 — kegagalan koneksi tidak boleh fatal
        _client = None
        _db = None
        log.warning("MongoDB tidak tersambung: %s — audit tidak akan tersimpan", exc)


async def disconnect() -> None:
    global _client, _db
    if _client is not None:
        _client.close()
    _client = None
    _db = None


async def _ensure_indexes() -> None:
    if _db is None:
        return
    await _db.shared_reports.create_index("slug", unique=True)
    await _db.audits.create_index([("lat", 1), ("lon", 1)])


def get_db() -> AsyncIOMotorDatabase | None:
    """Handle database, atau None kalau tidak tersambung.

    Pemanggil wajib menangani None — jangan berasumsi database ada.
    """
    return _db


def is_connected() -> bool:
    return _db is not None
