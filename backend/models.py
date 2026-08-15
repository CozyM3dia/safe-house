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


class NarrativeRequest(BaseModel):
    """Audit inline untuk instalasi yang berjalan tanpa MongoDB."""

    audit: AuditResult
    lang: Literal["id", "en"] = "id"


class AIMetadata(BaseModel):
    """Server-side metadata — not requested from the model."""

    model: str
    delivery_mode: Literal["live", "fallback", "cached"]
    prompt_version: str
    generated_at: datetime
    cache_age_seconds: Optional[int] = None


class NarrativeResult(BaseModel):
    """Laporan AI terstruktur; seluruh angka tetap berasal dari AuditResult."""

    geo_stability_explanation: str = Field(..., min_length=1, max_length=1200)
    seismic_explanation: str = Field(..., min_length=1, max_length=1200)
    flood_env_explanation: str = Field(..., min_length=1, max_length=1200)
    micro_analysis: str = Field(..., min_length=1, max_length=1600)
    detailed_report: str = Field(..., min_length=1, max_length=9000)
    sources: list[str] = Field(default_factory=list, max_length=8)
    data_limitations: list[str] = Field(default_factory=list, max_length=8)
    generated_by: str = Field(..., min_length=1, max_length=100)
    street_view_used: bool = False
    metadata: Optional[AIMetadata] = None


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    history: list[ChatMessage] = Field(default_factory=list, max_length=10)
    audit: Optional[AuditResult] = None
    comparison: Optional[AuditResult] = None
    mode: Literal["audit", "battle"] = "audit"
    lang: Literal["id", "en"] = "id"


class ChatCitation(BaseModel):
    title: str
    category: str


class ChatResult(BaseModel):
    answer: str = Field(..., min_length=1, max_length=5000)
    citations: list[ChatCitation] = Field(default_factory=list, max_length=8)
    follow_ups: list[str] = Field(default_factory=list, max_length=3)
