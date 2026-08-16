# SAFE House Accuracy Data Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add higher-value official hazard observations and make every new field traceable without presenting unavailable proxy data as authoritative.

**Architecture:** Keep the deterministic audit engine as the source of the score. Extend the existing external-data fan-out with public InaRISK raster observations for tsunami, liquefaction, volcanic eruption, and coastal abrasion; expose those observations as separate hazard evidence and coverage fields. Preserve the current best-available/strict contract, and fix the route so the validated land/water classification is actually propagated into scoring.

**Tech Stack:** Python 3.12, FastAPI, httpx, Pydantic response models, unittest, React 19, Vite.

**Spec:** `docs/GEO-DATA-CONTRACT.md` and the existing data contract in `backend/services/completeness.py`.

## Global Constraints

- AI may explain audit output but may not calculate or mutate risk values.
- Missing layers must remain `unavailable` or explicitly `model`; missing data must never become `RENDAH` silently.
- `AUDIT_DATA_MODE=best_available` remains backward-compatible; `strict` must refuse a final score when critical layers are unavailable.
- Public sources are called with independent timeouts and partial failure must not erase other fields.
- Do not add credentials or commit `.env` files.
- New InaRISK observations are evidence fields first; tsunami and volcanic observations are not added to the buildability score without a validated weighting model.

---

### Task 1: Lock down the new external-data contract with tests

**Files:**
- Modify: `backend/tests/test_external.py`
- Modify: `backend/tests/test_audit_route.py`
- Modify: `backend/tests/test_completeness.py`

**Interfaces:**
- `external.fetch_all()` must return `tsunami`, `liquefaction`, `volcanic`, and `coastal` keys alongside existing keys.
- `POST /api/audit` must expose mapped evidence under `hazard` and coverage under `data_quality.fields`.
- `classify_location(...).is_water` must be used by the route when constructing the hazard payload.

- [x] **Step 1: Add failing tests for the four InaRISK keys and route exposure.**

```python
def test_fetch_contract_includes_extended_hazards():
    # Use a mocked client in the existing external-data tests and assert the
    # task names are stable even when a layer returns None.
    self.assertEqual(
        {"flood", "landslide", "tsunami", "liquefaction", "volcanic", "coastal"},
        set(hazard_names),
    )
```

Add an audit integration fixture containing all four class values and assert the response contains `hazard.tsunami_map`, `hazard.liquefaction_map`, `hazard.volcanic_map`, and `hazard.coastal_map` with `data_status == "official"`. Add an ocean fixture assertion that the response is rejected before any score is created and that the route no longer hardcodes `is_water=False`.

- [x] **Step 2: Run the focused tests and confirm they fail for the missing contract.**

Run: `python -m unittest backend.tests.test_external backend.tests.test_audit_route backend.tests.test_completeness -v`

Expected: FAIL because the extended keys and route fields do not exist yet.

---

### Task 2: Add resilient InaRISK multi-hazard retrieval

**Files:**
- Modify: `backend/services/external.py:110-230`
- Test: `backend/tests/test_external.py`

**Interfaces:**
- Reuse `_inarisk_layer(client, layer, lat, lon) -> Optional[int]`.
- Add `INARISK_LAYERS = {"flood": ..., "landslide": ..., "tsunami": ..., "liquefaction": ..., "volcanic": ..., "coastal": ...}`.
- `fetch_all()` returns one result per mapping key and preserves each failed source name.

- [x] **Step 1: Add a table-driven mocked identify test.**

Mock `httpx.AsyncClient.get` so each layer returns an ArcGIS identify payload with `Stretch.Pixel Value == "3.000000"`. Assert the helper returns integer `3`, and assert one malformed/no-data response returns `None` without raising.

- [x] **Step 2: Implement the mapping and fan-out.**

Use these public MapServer names, verified against the BNPB ArcGIS directory:

```python
INARISK_LAYERS = {
    "flood": "layer_bahaya_banjir_30",
    "landslide": "layer_bahaya_tanah_longsor_30",
    "tsunami": "layer_bahaya_tsunami_30",
    "liquefaction": "layer_bahaya_likuefaksi_30",
    "volcanic": "layer_bahaya_letusan_gunungapi_30",
    "coastal": "layer_bahaya_gelombang_ekstrim_dan_abrasi_30",
}
```

Construct one task per mapping entry. Keep the existing `INARISK_TIMEOUT_S`, `return_exceptions=True`, and failed-source semantics.

- [x] **Step 3: Run the focused external tests.**

Run: `python -m unittest backend.tests.test_external -v`

Expected: PASS.

---

### Task 3: Represent extended hazards and correct land/water propagation

**Files:**
- Modify: `backend/services/completeness.py:120-290`
- Modify: `backend/routers/audit.py:120-290`
- Modify: `backend/tests/test_audit_route.py`
- Modify: `backend/tests/test_completeness.py`

**Interfaces:**
- Add a reusable `_layer_quality(class_value, available, name)` helper returning `official`, `unavailable`, `risk`, `label`, `source`, `confidence`, and `used_fallback=False` for mapped layers.
- Keep `build_best_available_hazards()` backward-compatible and add `build_extended_hazard_quality(raw, failed)` for the four non-score layers.

- [x] **Step 1: Add failing quality tests.**

Assert a mapped class `3` becomes `status="official"`, `confidence=85`, and a failed source becomes `status="unavailable"`, `confidence=0`. Assert that `build_field_quality()` includes `tsunami_map`, `liquefaction_map`, `volcanic_map`, and `coastal_map`.

- [x] **Step 2: Implement provenance-rich quality objects.**

Use the existing 1/2/3 mapping (`RENDAH`/25, `SEDANG`/60, `TINGGI`/85) for displayed hazard evidence, but do not add tsunami or volcanic values to `BUILDABILITY_WEIGHTS`. Add the source name `InaRISK BNPB — <hazard>` and preserve `as_of` timestamps through the existing field-quality builder.

- [x] **Step 3: Integrate in the route.**

Replace `is_water = False` with `is_water = location.is_water`. Build the extended hazard quality after `hazard_quality`, expose these fields:

```python
hazard["tsunami_map"] = extended["tsunami"]
hazard["liquefaction_map"] = extended["liquefaction"]
hazard["volcanic_map"] = extended["volcanic"]
hazard["coastal_map"] = extended["coastal"]
```

Add the failed extended-source names to `optional_missing`; keep the current score axes unchanged except for the existing deterministic geotechnical calculation. Add `extended_hazards` to `data_quality` so the AI and UI can distinguish these observations from proxies.

- [x] **Step 4: Run the focused route and completeness tests.**

Run: `python -m unittest backend.tests.test_completeness backend.tests.test_audit_route -v`

Expected: PASS, including strict-mode behavior and ocean rejection.

---

### Task 4: Surface the new coverage to the report UI

**Files:**
- Modify: `frontend/src/components/panels/AuditDrawer.jsx:1015-1090`
- Modify: `frontend/src/services/auditAdapter.js:75-145`
- Test: `frontend/test_map_bounds.test.mjs` or a new `frontend/test_audit_adapter.test.mjs`

**Interfaces:**
- `adaptAuditResult()` keeps the new raw hazard evidence in `compressedPayload` without changing existing PDF compatibility fields.
- `DataCoverageSummary` labels the four new data fields and renders `RESMI`, `MODEL`, or `BELUM TERSEDIA` using the existing status styles.

- [x] **Step 1: Add the adapter assertion.**

Pass an AuditResult containing `hazard.tsunami_map` and assert the adapted payload exposes it as `hazard_maps.tsunami` with its status, label, source, and risk.

- [x] **Step 2: Implement the UI labels and adapter mapping.**

Add labels for `tsunami_map`, `liquefaction_map`, `volcanic_map`, and `coastal_map`. Keep the evidence visible in the data coverage section, not in the buildability score radar.

- [x] **Step 3: Run frontend tests and build.**

Run: `node --test frontend/test_map_bounds.test.mjs frontend/test_audit_adapter.test.mjs` and `npm --prefix frontend run build`.

Expected: PASS and a successful production build.

---

### Task 5: Document operational data quality and verify the full stack

**Files:**
- Modify: `docs/GEO-DATA-CONTRACT.md`
- Modify: `README.md`
- Modify: `backend/.env.example`

- [x] **Step 1: Document the new public layers and their limits.**

State that InaRISK layer observations are official source observations but their spatial resolution, update date, and missing pixels still affect confidence. State that Vs30, design PGA, fault geometry, DEMNAS, groundwater, InSAR subsidence, building vulnerability, and flood depth remain future configured inputs rather than being invented by this patch.

- [x] **Step 2: Add explicit `AUDIT_DATA_MODE` configuration guidance.**

Document `best_available` for screening and `strict` for a workflow that must not issue a score when critical layers are missing. Do not change secrets or commit `.env`.

- [x] **Step 3: Run the complete validation suite.**

Run: `python -m unittest discover -s backend/tests -p 'test_*.py' -v`, `node --test frontend/test_pdf_export_adapter.test.mjs frontend/test_map_bounds.test.mjs frontend/test_audit_adapter.test.mjs`, `npm --prefix frontend run build`, and `git diff --check`.

Expected: all tests pass, build succeeds, and no whitespace errors are reported.
