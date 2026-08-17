"""Server-side AI endpoints.

The browser sends audit data, never an API key or a free-form system prompt.
"""

from __future__ import annotations

import os
import time
import uuid
from collections import defaultdict, deque

from fastapi import APIRouter, HTTPException, Request
from pydantic import ValidationError

import db
from models import (
    AIMetadata,
    AuditResult,
    BattleReportRequest,
    BattleReportResult,
    ChatRequest,
    ChatResult,
    NarrativeRequest,
    NarrativeResult,
)
from services import ai

router = APIRouter(prefix="/api", tags=["ai"])

# In-memory rate limiter — sufficient for competition.
# Distributed deployment would require Redis or a shared limiter.
_requests_by_client: dict[str, deque[float]] = defaultdict(deque)
_RATE_LIMIT = int(os.getenv("AI_RATE_LIMIT_PER_MINUTE", "15"))
_RATE_WINDOW_SECONDS = 60.0
_TRUST_PROXY_HEADERS = os.getenv("TRUST_PROXY_HEADERS", "false").lower() == "true"


def _client_key(request: Request) -> str:
    if _TRUST_PROXY_HEADERS:
        forwarded = request.headers.get("x-forwarded-for", "").split(",", 1)[0].strip()
        if forwarded:
            return forwarded
    return request.client.host if request.client else "unknown"


def _enforce_rate_limit(request: Request) -> None:
    now = time.monotonic()
    bucket = _requests_by_client[_client_key(request)]
    while bucket and now - bucket[0] >= _RATE_WINDOW_SECONDS:
        bucket.popleft()
    if len(bucket) >= _RATE_LIMIT:
        raise HTTPException(
            status_code=429,
            detail="Terlalu banyak permintaan AI. Coba lagi dalam satu menit.",
        )
    bucket.append(now)


def _raise_public_error(exc: ai.AIServiceError) -> None:
    raise HTTPException(status_code=exc.status_code, detail=exc.public_message) from exc


async def _load_trusted_audit(candidate: AuditResult | None, *, required: bool = False) -> AuditResult | None:
    """Never treat a client-posted score as authoritative AI context.

    Chat can remain useful without an audit, but when an ID is supplied it is
    reloaded from the database. Inline narrative is intentionally restricted
    to persisted audits so a caller cannot manufacture a score and obtain an
    official-sounding explanation.
    """

    if candidate is None:
        if required:
            raise HTTPException(status_code=422, detail="Audit harus tersimpan sebelum AI dipanggil")
        return None
    if not candidate.id:
        if required:
            raise HTTPException(status_code=422, detail="Audit harus tersimpan sebelum AI dipanggil")
        return None

    pool = db.get_pool()
    if pool is None:
        raise HTTPException(status_code=503, detail="Penyimpanan audit tidak tersedia")
    try:
        uid = uuid.UUID(candidate.id)
    except (ValueError, TypeError) as exc:
        raise HTTPException(status_code=422, detail="ID audit tidak valid") from exc

    row = await pool.fetchrow("SELECT id, data FROM audits WHERE id = $1", uid)
    if row is None:
        raise HTTPException(status_code=404, detail="Audit tidak ditemukan")

    data = dict(row["data"])
    data["id"] = str(row["id"])
    data["persisted"] = True
    return AuditResult.model_validate(data)


@router.get("/ai/status")
async def ai_status() -> dict:
    """Health-like endpoint for AI layer. Never returns the key."""
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    key_configured = bool(api_key)

    cache_available = db.get_pool() is not None and ai.CACHE_ENABLED

    chain = ai.model_chain()
    return {
        "status": "ready" if key_configured else "unconfigured",
        "provider": "gemini",
        "primary_model": chain[0] if chain else os.getenv("GEMINI_MODEL", ai.PRIMARY_MODEL),
        "fallback_model": chain[1] if len(chain) > 1 else os.getenv("GEMINI_FALLBACK_MODEL", ai.FALLBACK_MODEL),
        "model_chain": chain,
        "api_key_configured": key_configured,
        "cache_enabled": ai.CACHE_ENABLED,
        "cache_available": cache_available,
        "prompt_version": ai.PROMPT_VERSION,
    }


@router.post("/narrative", response_model=NarrativeResult)
async def create_inline_narrative(
    payload: NarrativeRequest,
    request: Request,
) -> NarrativeResult:
    """Generate a narrative even when MongoDB is intentionally unavailable."""

    _enforce_rate_limit(request)
    audit = await _load_trusted_audit(payload.audit, required=True)
    try:
        return await ai.generate_narrative(audit, payload.lang)
    except ai.AIServiceError as exc:
        _raise_public_error(exc)


@router.post("/narrative/{audit_id}", response_model=NarrativeResult)
async def create_saved_narrative(
    audit_id: str,
    request: Request,
    lang: str = "id",
    force: bool = False,
) -> NarrativeResult:
    """Generate and cache a narrative for a persisted audit."""

    _enforce_rate_limit(request)
    if lang not in {"id", "en"}:
        raise HTTPException(status_code=422, detail="Bahasa tidak didukung")

    pool = db.get_pool()
    if pool is None:
        raise HTTPException(status_code=503, detail="Penyimpanan tidak tersedia")

    try:
        uid = uuid.UUID(audit_id)
    except (ValueError, TypeError) as exc:
        raise HTTPException(status_code=422, detail="ID audit tidak valid") from exc

    row = await pool.fetchrow("SELECT id, data FROM audits WHERE id = $1", uid)
    if row is None:
        raise HTTPException(status_code=404, detail="Audit tidak ditemukan")

    data = dict(row["data"])
    if data.get("narrative") and not force:
        try:
            return NarrativeResult.model_validate(data["narrative"])
        except ValidationError:
            pass

    data["id"] = str(row["id"])
    data["persisted"] = True
    audit = AuditResult.model_validate(data)

    try:
        result = await ai.generate_narrative(audit, lang)
    except ai.AIServiceError as exc:
        _raise_public_error(exc)

    # Simpan narrative ke dalam kolom JSONB audit (tanpa id/persisted).
    store = audit.model_dump(mode="json", exclude={"id", "persisted"})
    store["narrative"] = result.model_dump(mode="json")
    await pool.execute("UPDATE audits SET data = $2 WHERE id = $1", uid, store)
    return result


@router.post("/battle-report", response_model=BattleReportResult)
async def create_battle_report(
    payload: BattleReportRequest,
    request: Request,
) -> BattleReportResult:
    """Generate a grounded comparison from two persisted audits."""

    _enforce_rate_limit(request)
    audit_a = await _load_trusted_audit(payload.audit_a, required=True)
    audit_b = await _load_trusted_audit(payload.audit_b, required=True)
    if audit_a is None or audit_b is None:
        raise HTTPException(status_code=422, detail="Dua audit harus tersedia")
    if audit_a.id and audit_a.id == audit_b.id:
        raise HTTPException(status_code=422, detail="Lokasi A dan B harus berbeda")

    try:
        return await ai.generate_battle_report(audit_a, audit_b, payload.lang)
    except ai.AIServiceError as exc:
        _raise_public_error(exc)


@router.post("/chat", response_model=ChatResult)
async def chat(payload: ChatRequest, request: Request) -> ChatResult:
    _enforce_rate_limit(request)
    audit = await _load_trusted_audit(payload.audit)
    comparison = await _load_trusted_audit(payload.comparison)
    try:
        return await ai.answer_chat(
            message=payload.message,
            history=payload.history,
            audit=audit,
            comparison=comparison,
            mode=payload.mode,
            lang=payload.lang,
        )
    except ai.AIServiceError as exc:
        _raise_public_error(exc)
