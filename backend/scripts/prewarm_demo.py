"""Pre-warm the demo: persist canonical audits + generate & store their AI
narratives, then create public share slugs.

Why: at demo time the two canonical locations are opened via /laporan/{slug}.
The narrative is served straight from the stored JSONB (audits.data.narrative)
— no Gemini call, so the demo is immune to Gemini being rate-limited or down.
Generating the narrative once (here) also warms the ai_narratives cache.

Run (needs DATABASE_URL + a working GEMINI_API_KEY in backend/.env):
    cd backend && ./.venv/Scripts/python.exe scripts/prewarm_demo.py

Idempotent: rows tagged with `demo_tag` are replaced on each run.
Canonical numbers: docs/PROMPT-PERBAIKAN-CONTACT-SHEET.md.
"""

import asyncio
import os
import secrets
import sys

_BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, _BACKEND)

from dotenv import load_dotenv

load_dotenv(os.path.join(_BACKEND, ".env"))

import db  # noqa: E402
from models import AuditResult, GeotechProfile, NearestFeature  # noqa: E402
from services import ai  # noqa: E402

_SLUG_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz"


def _slug() -> str:
    return "".join(secrets.choice(_SLUG_ALPHABET) for _ in range(8))


def bandar_lampung() -> tuple[AuditResult, str]:
    geo = GeotechProfile(
        fs=1.15, status="AMAN", vs30=285, site_class="SD",
        pga=0.27, fa=1.19, pga_surface=0.32, risk_score=40,
        t0_resonance=0.34, nearest_city="Bandar Lampung",
        elevation_m=93, elevation_assumed=False,
        nearest_fault=NearestFeature(name="Sesar Semangko", distance_km=11.8),
        nearest_volcano=NearestFeature(name="Gunung Rajabasa", distance_km=45.0),
        nearest_megathrust=NearestFeature(name="Sunda Megathrust", distance_km=175.0),
        nearest_coast=NearestFeature(name="Teluk Lampung", distance_km=8.0),
    )
    audit = AuditResult(
        lat=-5.3971, lon=105.2668, address="Bandar Lampung, Lampung",
        elevation=93, safe_score=65, risk_level="moderate", geotech=geo,
        hazard={"flood_label": "Sedang", "landslide_label": "Rendah"},
        environment={"aqi": 42, "pm25": 14},
        seismic={"recent_count": 2, "history": [{"magnitude": 4.6}, {"magnitude": 4.9}]},
        nearby=["Sekolah", "Puskesmas", "Pasar"],
        sources_failed=[],
    )
    return audit, "bandar-lampung-canonical"


def natar() -> tuple[AuditResult, str]:
    geo = GeotechProfile(
        fs=1.85, status="AMAN", vs30=586, site_class="SC",
        pga=0.17, fa=1.12, pga_surface=0.19, risk_score=22,
        t0_resonance=0.19, nearest_city="Natar",
        elevation_m=110, elevation_assumed=False,
        nearest_fault=NearestFeature(name="Sesar Semangko", distance_km=32.4),
        nearest_volcano=NearestFeature(name="Gunung Rajabasa", distance_km=55.0),
        nearest_megathrust=NearestFeature(name="Sunda Megathrust", distance_km=190.0),
        nearest_coast=NearestFeature(name="Selat Sunda", distance_km=35.0),
    )
    audit = AuditResult(
        lat=-5.3113, lon=105.1755, address="Natar, Lampung Selatan",
        elevation=110, safe_score=78, risk_level="safe", geotech=geo,
        hazard={"flood_label": "Rendah", "landslide_label": "Rendah"},
        environment={"aqi": 30, "pm25": 9},
        seismic={"recent_count": 1, "history": [{"magnitude": 4.3}]},
        nearby=["Sekolah", "Kantor Desa"],
        sources_failed=[],
    )
    return audit, "natar-canonical"


async def _prewarm_one(pool, audit: AuditResult, tag: str) -> None:
    # Replace any prior demo row with this tag (idempotent re-runs).
    old = await pool.fetch("SELECT id FROM audits WHERE data->>'demo_tag' = $1", tag)
    for r in old:
        await pool.execute("DELETE FROM shared_reports WHERE audit_id = $1", r["id"])
        await pool.execute("DELETE FROM audits WHERE id = $1", r["id"])

    doc = audit.model_dump(mode="json", exclude={"id", "persisted"})
    doc["demo_tag"] = tag
    row = await pool.fetchrow(
        "INSERT INTO audits (lat, lon, data) VALUES ($1, $2, $3) RETURNING id",
        audit.lat, audit.lon, doc,
    )
    aid = row["id"]
    audit.id = str(aid)
    audit.persisted = True

    try:
        result = await ai.generate_narrative(audit, "id", db_module=db)
    except ai.AIServiceError as exc:
        print(f"  [FAIL] {audit.address}: AI error {exc.status_code} — {exc.public_message}")
        print("         (audit row saved, but no stored narrative — retry when Gemini quota is back)")
        return

    store = audit.model_dump(mode="json", exclude={"id", "persisted"})
    store["demo_tag"] = tag
    store["narrative"] = result.model_dump(mode="json")
    await pool.execute("UPDATE audits SET data = $2 WHERE id = $1", aid, store)

    slug = _slug()
    await pool.execute(
        "INSERT INTO shared_reports (slug, audit_id) VALUES ($1, $2)", slug, aid
    )
    print(f"  [OK]   {audit.address}: score={audit.safe_score} "
          f"delivery={result.metadata.delivery_mode} model={result.metadata.model}")
    print(f"         id={aid}  slug={slug}  ->  /laporan/{slug}")


async def main() -> None:
    await db.connect()
    pool = db.get_pool()
    if pool is None:
        print("DATABASE_URL not set / DB unreachable — cannot pre-warm.")
        return
    print("Pre-warming canonical demo locations...")
    for factory in (bandar_lampung, natar):
        audit, tag = factory()
        await _prewarm_one(pool, audit, tag)
    await db.disconnect()
    print("Done.")


if __name__ == "__main__":
    asyncio.run(main())
