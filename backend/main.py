"""S.A.F.E House — API backend.

Semua perhitungan dan semua panggilan ke layanan luar terjadi di sini.
Frontend tidak pernah memegang kunci API apa pun.
"""

import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import db
from models import HealthResult
from routers import audit

load_dotenv()

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s  %(levelname)-8s %(name)s  %(message)s",
)


@asynccontextmanager
async def lifespan(_: FastAPI):
    await db.connect()
    yield
    await db.disconnect()


app = FastAPI(
    title="S.A.F.E House API",
    description="Audit risiko geospasial properti Indonesia",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS dibatasi ke origin frontend, tidak pernah "*" — response membawa
# hasil audit yang bisa memuat alamat pengguna.
_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/api/health", response_model=HealthResult)
async def health() -> HealthResult:
    return HealthResult(
        status="ok",
        database="connected" if db.is_connected() else "unavailable",
    )


app.include_router(audit.router)

# Router geo, share, dan ai menyusul pada tahap 4 dan 6.
# Lihat docs/superpowers/specs/2026-08-13-emergent-migration-design.md bagian 5.
