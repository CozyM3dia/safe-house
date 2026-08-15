"""Server-side AI endpoints.

The browser sends audit data, never an API key or a free-form system prompt.
"""

from __future__ import annotations

import os
import time
from collections import defaultdict, deque
from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, HTTPException, Request
from pydantic import ValidationError

import db
from models import (
    AIMetadata,
    AuditResult,
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


def _client_key(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "").split(",", 1)[0].strip()
    return forwarded or (request.client.host if request.client else "unknown")


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


@router.get("/ai/status")
async def ai_status() -> dict:
    """Health-like endpoint for AI layer. Never returns the key."""
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    key_configured = bool(api_key)

    database = db.get_db()
    cache_available = database is not None and ai.CACHE_ENABLED

    return {
        "status": "ready" if key_configured else "unconfigured",
        "provider": "gemini",
        "primary_model": os.getenv("GEMINI_MODEL", ai.PRIMARY_MODEL),
        "fallback_model": os.getenv("GEMINI_FALLBACK_MODEL", ai.FALLBACK_MODEL),
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
    try:
        return await ai.generate_narrative(payload.audit, payload.lang)
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

    database = db.get_db()
    if database is None:
        raise HTTPException(status_code=503, detail="Penyimpanan tidak tersedia")

    try:
        oid = ObjectId(audit_id)
    except (InvalidId, TypeError) as exc:
        raise HTTPException(status_code=422, detail="ID audit tidak valid") from exc

    document = await database.audits.find_one({"_id": oid})
    if document is None:
        raise HTTPException(status_code=404, detail="Audit tidak ditemukan")

    if document.get("narrative") and not force:
        try:
            return NarrativeResult.model_validate(document["narrative"])
        except ValidationError:
            pass

    document["id"] = str(document.pop("_id"))
    document["persisted"] = True
    audit = AuditResult.model_validate(document)

    try:
        result = await ai.generate_narrative(audit, lang)
    except ai.AIServiceError as exc:
        _raise_public_error(exc)

    await database.audits.update_one(
        {"_id": oid},
        {"$set": {"narrative": result.model_dump()}},
    )
    return result


@router.post("/chat", response_model=ChatResult)
async def chat(payload: ChatRequest, request: Request) -> ChatResult:
    _enforce_rate_limit(request)
    try:
        return await ai.answer_chat(
            message=payload.message,
            history=payload.history,
            audit=payload.audit,
            comparison=payload.comparison,
            mode=payload.mode,
            lang=payload.lang,
        )
    except ai.AIServiceError as exc:
        _raise_public_error(exc)
