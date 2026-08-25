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
from routers import ai, audit, og, share, validasi

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
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
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
    # Proses API bisa hidup tanpa DB (audit tetap dihitung). Jangan klaim
    # "ok" kalau penyimpanan — syarat /laporan dan share — sedang mati.
    connected = db.is_connected()
    return HealthResult(
        status="ok" if connected else "degraded",
        database="connected" if connected else "unavailable",
    )


app.include_router(audit.router)
app.include_router(share.router)
app.include_router(ai.router)
app.include_router(validasi.router)
app.include_router(og.router)

# Router geo menyusul bila pencarian alamat dipindahkan sepenuhnya ke backend.
