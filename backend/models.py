"""Skema Pydantic — kontrak antara backend dan frontend.

Bentuk di sini harus cocok dengan bagian 5 dokumen desain
(docs/superpowers/specs/2026-08-13-emergent-migration-design.md). Frontend
dibangun terhadap bentuk ini, jadi perubahan di sini adalah perubahan yang
merusak dan harus dibicarakan dulu.
"""

from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


class Coordinates(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)


class AuditRequest(Coordinates):
    lang: Literal["id", "en"] = "id"


class NearestFeature(BaseModel):
    name: str
    distance_km: Optional[float] = None


class GeotechProfile(BaseModel):
    """Keluaran services.geotech — murni hasil hitungan, tanpa data eksternal."""

    fs: float
    status: Literal["RAWAN", "AMAN"]
    vs30: int
    site_class: Literal["SC", "SD", "SE"]
    pga: float
    fa: float
    pga_surface: float
    risk_score: int
    t0_resonance: float
    nearest_city: str
    elevation_m: float
    elevation_assumed: bool
    nearest_fault: NearestFeature
    nearest_volcano: NearestFeature
    nearest_megathrust: NearestFeature
    nearest_coast: NearestFeature


class AuditResult(BaseModel):
    id: Optional[str] = None
    lat: float
    lon: float
    address: str
    elevation: Optional[float] = None
    safe_score: int = Field(..., ge=0, le=100)
    risk_level: Literal["safe", "moderate", "danger"]
    geotech: GeotechProfile

    # Diisi pada tahap 3 — data eksternal.
    hazard: Optional[dict[str, Any]] = None
    environment: Optional[dict[str, Any]] = None
    seismic: Optional[dict[str, Any]] = None
    nearby: list[str] = Field(default_factory=list)

    # Diisi pada tahap 6 — lapis AI.
    narrative: Optional[dict[str, Any]] = None

    # Sumber yang gagal dipanggil. Frontend memakainya untuk jujur soal
    # data yang hilang, bukan diam-diam menampilkan angka kosong.
    sources_failed: list[str] = Field(default_factory=list)

    created_at: Optional[datetime] = None
    persisted: bool = False


class ShareRequest(BaseModel):
    audit_id: str


class ShareResult(BaseModel):
    slug: str
    url_path: str


class HealthResult(BaseModel):
    status: Literal["ok"]
    database: Literal["connected", "unavailable"]
