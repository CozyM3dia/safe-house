# S.A.F.E House — State Handoff (snapshot lengkap)

**Update:** 15 Agustus 2026 · **Untuk:** cold-start sesi/proyek baru.
Baca ini + `docs/RENCANA-KEMENANGAN.md` dulu sebelum kerja apa pun.

---

## TL;DR

SafeHouse = audit risiko geoteknik properti Indonesia. Satu koordinat →
parameter SNI 1726:2019 siap-PBG (kelas situs Vs30, PGA desain, FS likuefaksi,
bahaya banjir/longsor/gempa). Engine fisika deterministik (moat). Untuk kontes
**Building Indonesia by Emergent**, submit **25 Agu 2026 23:59 WIB**.

Migrasi ke stack Emergent (React + FastAPI + MongoDB) SUDAH selesai & MERGED.
Deploy LIVE. Fokus sekarang: perbaiki blocker deploy staging, poles UI, submit,
kumpulkan bukti bisnis nyata.

---

## DEPLOY & URL (status)

| Env | URL | Status |
|---|---|---|
| Emergent (prod) | https://safehouse-pull.emergent.host | LIVE; proxy `/api/*` → backend, sisanya SPA |
| Vercel staging | https://safe-house-staging.vercel.app | mati (DEPLOYMENT_NOT_FOUND per 25 Agu) |
| Domain rencana | safehouse.web.id | **DNS belum aktif** (NXDOMAIN per 25 Agu) |

### 🔴 BLOCKER STAGING (dari audit 15 Agu) — WAJIB fix
1. **`/app` → 404.** Route React Router valid (`App.jsx:128`) tapi **tidak ada
   `frontend/vercel.json`** → Vercel tak rewrite SPA. `/laporan/:slug` (share/
   upvote) ikut mati. **Fix:** tambah `vercel.json`:
   ```json
   { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
   ```
2. **Tombol "Coba Gratis" tidak navigasi** ke `/app`. Perbaiki onClick →
   `navigate('/app')`.
3. **Overclaim AI.** Situs sebut "audit kognitif / diagnostik berbasis AI /
   laporan AI" — tapi lapis AI (ChatbotFab) BELUM dibangun (tahap 6). Turunkan
   klaim atau bangun AI-nya.
4. **Jargon gimmick** ("TAP TO TRIGGER EARTHQUAKE SIMULATION", "DATALOGGER
   CHANNEL", "RAG GEO-DIAGNOSTIC") — lawan arah B2B kredibel. Ganti nada.
5. **Ejaan:** situs pakai "likuifaksi"; standar SNI = **"likuefaksi"**. Samakan.

---

## ARSITEKTUR & STACK

- **Frontend:** React 19 + Vite + Leaflet + Zustand. `frontend/`
- **Backend:** FastAPI + MongoDB (motor). `backend/`
- **Engine geoteknik:** `backend/services/geotech.py` (SUMBER KEBENARAN, port
  dari engine.js; BUKAN Safe_House_Core.py yang hardcode Lampung). Paritas
  10/10 vs engine.js (`backend/scripts/check_engine_parity.*`).
- **Data:** `backend/data/constants.py` — 47 sesar, 41 gunung, 10 megathrust,
  PGA 50+ kota.
- **API:** `backend/routers/audit.py` (`POST /api/audit`), `share.py`
  (`/laporan/{slug}`). Services: `external.py` (InaRISK/Open-Meteo/USGS/
  Overpass/Nominatim paralel, gagal-sebagian aman), `scoring.py`.
- Frontend murni penyaji: semua hitung + panggilan API di backend, TIDAK ada
  kunci di frontend. MongoDB opsional (mati = audit jalan, tak tersimpan).

## SUDAH JADI & TERVERIFIKASI

- Engine + `POST /api/audit` E2E HTTP 200 (Bandar Lampung skor 65, Sesar
  Tarahan 10.97km)
- Kartu native baca AuditResult langsung (SafeScoreCard, RadarCard,
  GaussianCard, MetricsGrid, SeismicWaveform, dll — 40+ komponen)
- Halaman share publik `/laporan/:slug`
- Landing B2B konsultan PBG + SEO (meta, JSON-LD, robots, sitemap)
- Repo `CozyM3dia/safe-house` public, bersih dari API key
- Deploy Emergent live

## DITUNDA / BELUM

- **Lapis AI** (ChatbotFab, tahap 6) — tinggal colok kunci, BELUM dibangun
- **Battle mode** — di-stub
- Auth, EN penuh, DEMNAS 8m (peningkatan Vs30)
- **⚠️ LeftPanel populate** — perlu konfirmasi di build live (dugaan artefak HMR)

---

## KEPUTUSAN KUNCI (jangan re-litigasi)

- **Bahasa: Indonesia** untuk UI + copy. Description submisi final pakai versi
  Inggris pilihan A (hook "The ground you build on hides risks you can't see")
  — karena juri kemungkinan tim Emergent global (BELUM terkonfirmasi siapa
  jurinya; asumsi).
- **Stadia Maps** (basemap Alidade Smooth + Alidade Smooth Dark) — implemented
  as an optional Leaflet basemap. `VITE_STADIA_MAPS_API_KEY` is required and
  must be domain-restricted for Preview/production. SAFE House defaults to the
  dark variant when configured and falls back to Street when the key is absent.
- **JANGAN full-rebuild UI.** Remake = poles terarah, pertahankan brand + logo
  + palet Mocha. Prioritas UI = hierarki hero-score.
- **Riset kompetitor** → `docs/ui-research/`. Pelajaran: satu hero-score
  dominan, angka+rating, plain-language, sumber terlihat, kredibel bukan flashy.

## DATA SAMPEL KANONIK

`docs/PROMPT-PERBAIKAN-CONTACT-SHEET.md` — satu set angka konsisten (Bandar
Lampung 65 SEDANG, Natar 78 AMAN), 5 bahaya tetap (Gempa/Likuefaksi/Banjir/
Longsor/Penurunan Lahan), band skor, atribusi peta benar. Pakai di UI + mockup.

## ⚠️ KEAMANAN — BELUM BERES

Kunci Gemini/OpenRouter/Maps pernah hardcoded di riwayat git repo LAMA + tersalin
ke repo baru. **User HARUS rotate ketiga kunci** (belum dilakukan per catatan
terakhir). Cek ulang sebelum publikasi lebih luas.

---

## PETA DOKUMEN (canonical vs stale)

**CANONICAL (pakai ini):**
- `docs/STATE-HANDOFF.md` ← ini
- `docs/RENCANA-KEMENANGAN.md` — strategi kontes + timeline + risk
- `docs/DESIGN-SPEC-SAFEHOUSE.md` — spec UI/fitur + prompt ilustrasi
- `docs/PROMPT-PERBAIKAN-CONTACT-SHEET.md` — data kanonik + fix prompt
- `docs/ui-research/*.md` — analisis kompetitor
- `docs/positioning-b2b-seo.md` — positioning
- `docs/superpowers/specs/2026-08-13-emergent-migration-design.md` — arsitektur

**STALE (jangan dijadikan acuan — sisa pra-migrasi):**
- root: `HANDOFF.md`, `LANDING_PAGE_HANDOFF.md`, `project.md`, `design.md`,
  `implementation_plan.md`, `SafeHouse Briefing.md`, `PROJECT_REQUIREMENTS.md`

---

## NEXT STEPS (prioritas)

1. **🔴 Fix staging:** `vercel.json` rewrite + tombol "Coba Gratis" → `/app`.
   Tanpa ini produk unreachable.
2. **SUBMIT** ke Emergent (deploy live = gerbang upvote kebuka).
3. **Luruskan klaim AI** + buang jargon gimmick + ejaan "likuefaksi".
4. **UI hierarki hero-score** (SafeScoreCard + LeftPanel) pakai data kanonik.
5. **Bukti bisnis nyata** — 1 konsultan PBG Lampung (Business Impact 30%).
6. Sebar upvote (jaringan SEG/HMTG). Basemap Stadia (opsional, setelah #4).

## PERINTAH BERGUNA

Build frontend:
```bash
cd frontend && npm install && npm run build
```
Backend lokal (venv sudah ada di `backend/.venv`):
```bash
cd backend && ./.venv/Scripts/python.exe -m uvicorn main:app --port 8000
```
Alur git: `main` terkunci, wajib PR. Branch kerja → PR → squash merge.
