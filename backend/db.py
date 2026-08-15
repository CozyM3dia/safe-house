"""Koneksi Supabase / PostgreSQL (asyncpg).

Database sengaja bersifat opsional. Kalau DATABASE_URL tidak diset atau koneksi
gagal, audit tetap dihitung dan dikembalikan ke pengguna — hanya tidak
tersimpan. Saat demo di depan juri, database mati tidak boleh membuat aplikasi
tampak rusak.
"""

import json
import logging
import os
from pathlib import Path

import asyncpg

log = logging.getLogger(__name__)

_pool: asyncpg.Pool | None = None

_SCHEMA_PATH = Path(__file__).with_name("schema.sql")


async def _init_conn(conn: asyncpg.Connection) -> None:
    """Auto-encode/decode JSON & JSONB kolom sebagai dict Python."""
    await conn.set_type_codec(
        "jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
    )
    await conn.set_type_codec(
        "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
    )


async def connect() -> None:
    """Sambungkan ke Postgres. Kegagalan dicatat, tidak dilempar."""
    global _pool

    dsn = os.getenv("DATABASE_URL")
    if not dsn:
        log.warning("DATABASE_URL tidak diset — audit tidak akan tersimpan")
        return

    try:
        # statement_cache_size=0 wajib untuk Supabase transaction pooler
        # (pgbouncer, port 6543) yang tidak mendukung prepared statements.
        _pool = await asyncpg.create_pool(
            dsn,
            min_size=1,
            max_size=5,
            statement_cache_size=0,
            command_timeout=15,
            init=_init_conn,
        )
        async with _pool.acquire() as conn:
            await conn.execute("SELECT 1")
        await _ensure_schema()
        log.info("PostgreSQL (Supabase) tersambung")
    except Exception as exc:  # noqa: BLE001 — kegagalan koneksi tidak boleh fatal
        _pool = None
        log.warning(
            "PostgreSQL tidak tersambung: %s — audit tidak akan tersimpan", exc
        )


async def disconnect() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
    _pool = None


async def _ensure_schema() -> None:
    """Jalankan DDL idempoten. Aman kalau tabel sudah ada."""
    if _pool is None:
        return
    try:
        ddl = _SCHEMA_PATH.read_text(encoding="utf-8")
    except OSError as exc:
        log.warning("Tidak dapat membaca schema.sql: %s", exc)
        return
    async with _pool.acquire() as conn:
        await conn.execute(ddl)


def get_pool() -> asyncpg.Pool | None:
    """Handle pool, atau None kalau tidak tersambung.

    Pemanggil wajib menangani None — jangan berasumsi database ada.
    """
    return _pool


def is_connected() -> bool:
    return _pool is not None
