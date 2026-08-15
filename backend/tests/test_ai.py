import json
import os
import unittest
from unittest.mock import patch

import httpx

from models import AuditResult, GeotechProfile, NearestFeature
from services import ai


def sample_audit(**overrides) -> AuditResult:
    geotech = GeotechProfile(
        fs=1.18,
        status="AMAN",
        vs30=450,
        site_class="SC",
        pga=0.25,
        fa=1.2,
        pga_surface=0.3,
        risk_score=35,
        t0_resonance=0.27,
        nearest_city="Bandar Lampung",
        elevation_m=96,
        elevation_assumed=False,
        nearest_fault=NearestFeature(name="Sesar Tarahan", distance_km=11.2),
        nearest_volcano=NearestFeature(name="Gunung Pesawaran", distance_km=28.0),
        nearest_megathrust=NearestFeature(name="Sunda Megathrust", distance_km=180.0),
        nearest_coast=NearestFeature(name="Teluk Lampung", distance_km=8.0),
    )
    values = {
        "lat": -5.397,
        "lon": 105.266,
        "address": "Bandar Lampung",
        "elevation": 96,
        "safe_score": 72,
        "risk_level": "safe",
        "geotech": geotech,
        "hazard": {"flood": {"status": "RENDAH"}, "landslide": {"status": "RENDAH"}},
        "environment": {"aqi": 34, "pm25": 10},
        "seismic": {"recent_count": 1, "history": [{"magnitude": 4.8}] * 8},
        "nearby": [f"poi-{index}" for index in range(8)],
        "narrative": {"legacy": True},
        "sources_failed": [],
    }
    values.update(overrides)
    return AuditResult(**values)


def gemini_response(payload: dict) -> httpx.Response:
    return httpx.Response(
        200,
        json={
            "candidates": [
                {"content": {"parts": [{"text": json.dumps(payload)}]}}
            ]
        },
    )


class GroundingTests(unittest.TestCase):
    def test_compact_audit_removes_ai_output_and_bounds_lists(self):
        compact = ai.compact_audit(sample_audit())
        self.assertNotIn("narrative", compact)
        self.assertEqual(5, len(compact["nearby"]))
        self.assertEqual(5, len(compact["seismic"]["history"]))

    def test_available_citations_exclude_failed_source_families(self):
        audit = sample_audit(
            sources_failed=["flood", "landslide", "weather", "air_quality"]
        )
        titles = [citation.title for citation in ai.available_citations(audit)]
        self.assertIn("S.A.F.E House deterministic geotechnical engine", titles)
        self.assertNotIn("InaRISK BNPB", titles)
        self.assertNotIn("Open-Meteo", titles)
        self.assertIn("USGS Earthquake Catalog", titles)


class GeminiContractTests(unittest.IsolatedAsyncioTestCase):
    async def test_narrative_is_validated_and_sources_are_allowlisted(self):
        raw = {
            "geo_stability_explanation": "Vs30 dan FS dijelaskan dari audit.",
            "seismic_explanation": "PGA dan jarak sesar dijelaskan dari audit.",
            "flood_env_explanation": "Bahaya banjir dan AQI dijelaskan dari audit.",
            "micro_analysis": "Konteks sekitar dibatasi pada objek yang tersedia.",
            "detailed_report": "## Ringkasan Eksekutif\nSkor 72/100 berada pada band AMAN.",
            "sources": ["InaRISK BNPB", "Sumber yang dibuat-buat"],
            "data_limitations": ["Verifikasi lapangan tetap diperlukan."],
            "generated_by": "untrusted model value",
            "street_view_used": True,
        }

        def handler(request: httpx.Request) -> httpx.Response:
            self.assertEqual("test-key", request.headers["x-goog-api-key"])
            body = json.loads(request.content)
            self.assertIn("systemInstruction", body)
            self.assertEqual(
                "application/json",
                body["generationConfig"]["responseMimeType"],
            )
            return gemini_response(raw)

        client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
        with patch.dict(
            os.environ,
            {"GEMINI_API_KEY": "test-key", "GEMINI_MODEL": "test-model"},
        ):
            result = await ai.generate_narrative(sample_audit(), client=client)
        await client.aclose()

        self.assertFalse(result.street_view_used)
        self.assertEqual("Gemini (test-model)", result.generated_by)
        self.assertIn("450", result.geo_stability_explanation)
        self.assertTrue(result.detailed_report.startswith("## Ringkasan Data Terverifikasi"))
        self.assertNotIn("Sumber yang dibuat-buat", result.sources)
        self.assertIn("InaRISK BNPB", result.sources)
        self.assertTrue(any("desk study" in item for item in result.data_limitations))

    async def test_chat_citations_are_filtered_to_the_current_audit(self):
        raw = {
            "answer": "Skor 72/100 berada pada band aman, dengan catatan desk study.",
            "citation_titles": ["InaRISK BNPB", "Sumber palsu"],
            "follow_ups": ["Apa arti FS?", "Apa arti Vs30?", "Apa langkah berikutnya?"],
        }

        async with httpx.AsyncClient(
            transport=httpx.MockTransport(lambda _: gemini_response(raw))
        ) as client:
            with patch.dict(os.environ, {"GEMINI_API_KEY": "test-key"}):
                result = await ai.answer_chat(
                    message="Apakah lokasi ini aman?",
                    history=[],
                    audit=sample_audit(),
                    comparison=None,
                    mode="audit",
                    lang="id",
                    client=client,
                )

        self.assertEqual(["InaRISK BNPB"], [item.title for item in result.citations])
        self.assertEqual(3, len(result.follow_ups))

    async def test_missing_key_fails_without_contacting_upstream(self):
        with patch.dict(os.environ, {"GEMINI_API_KEY": ""}):
            with self.assertRaises(ai.AIServiceError) as raised:
                await ai.generate_narrative(sample_audit())
        self.assertEqual(503, raised.exception.status_code)


if __name__ == "__main__":
    unittest.main()
