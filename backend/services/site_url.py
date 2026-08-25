"""Asal publik untuk canonical / OG / sitemap.

safehouse.web.id tercatat NXDOMAIN (docs/STATE-HANDOFF.md, 25 Agu 2026).
Jangan memakainya sebagai default. PUBLIC_SITE_URL menang hanya jika
isinya bukan host mati itu, kecuali operator men-set
PUBLIC_SITE_ALLOW_UNRESOLVED=1 setelah DNS benar-benar hidup.
"""

from __future__ import annotations

import os
from urllib.parse import urlparse

from fastapi import Request

# Host rencana yang belum punya DNS. Jangan dijadikan og:url default.
UNRESOLVED_PUBLIC_HOSTS = frozenset({"safehouse.web.id", "www.safehouse.web.id"})

# Host produksi Emergent yang terbukti LIVE.
DEFAULT_PUBLIC_ORIGIN = "https://safehouse-pull.emergent.host"


def _normalize_origin(value: str) -> str:
    return value.strip().rstrip("/")


def _host_of(origin: str) -> str:
    parsed = urlparse(origin if "://" in origin else f"https://{origin}")
    return (parsed.hostname or "").lower()


def is_unresolved_public_host(origin: str) -> bool:
    return _host_of(origin) in UNRESOLVED_PUBLIC_HOSTS


def _allow_unresolved() -> bool:
    return os.getenv("PUBLIC_SITE_ALLOW_UNRESOLVED", "").strip().lower() in {
        "1",
        "true",
        "yes",
    }


def configured_public_origin() -> str | None:
    """PUBLIC_SITE_URL jika valid; None jika kosong atau host mati."""
    env = _normalize_origin(os.getenv("PUBLIC_SITE_URL", ""))
    if not env:
        return None
    if is_unresolved_public_host(env) and not _allow_unresolved():
        return None
    return env


def request_origin(request: Request) -> str:
    return _normalize_origin(str(request.base_url))


def public_site_origin(request: Request) -> str:
    """Domain kanonik halaman manusia (/laporan, landing)."""
    return configured_public_origin() or request_origin(request)


def backend_public_origin(request: Request) -> str:
    """Origin yang melayani /api/* (gambar OG harus fetchable dari sini)."""
    env = _normalize_origin(os.getenv("BACKEND_PUBLIC_URL", ""))
    if env:
        if is_unresolved_public_host(env) and not _allow_unresolved():
            return request_origin(request)
        return env
    return request_origin(request)
