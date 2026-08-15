# CLAUDE.md — S.A.F.E House

Panduan untuk sesi Claude Code baru. **Mulai dari sini.**

## Baca dulu (urut)
1. `docs/STATE-HANDOFF.md` — snapshot state lengkap, blocker, next steps
2. `docs/RENCANA-KEMENANGAN.md` — strategi kontes + timeline (deadline 25 Agu 2026)
3. `docs/DESIGN-SPEC-SAFEHOUSE.md` — spec UI/fitur
4. `docs/PROMPT-PERBAIKAN-CONTACT-SHEET.md` — data sampel kanonik

Docs root lain (`HANDOFF.md`, `project.md`, `design.md`, dll) = **STALE**,
sisa pra-migrasi. Jangan dijadikan acuan.

## Produk
Audit risiko geoteknik properti Indonesia. Satu koordinat → parameter SNI
1726:2019 siap-PBG (Vs30, PGA, FS likuefaksi, banjir). Untuk konsultan PBG,
developer, konsultan geoteknik. Kontes Building Indonesia by Emergent.

## Stack
- Frontend: React 19 + Vite + Leaflet + Zustand (`frontend/`)
- Backend: FastAPI + Supabase/PostgreSQL via `asyncpg` (`backend/`)
  - DB opsional: tanpa `DATABASE_URL` audit tetap dihitung, hanya tidak
    tersimpan. Tabel dibuat otomatis saat start (`backend/schema.sql`)
  - AuditResult disimpan utuh sebagai kolom JSONB; id = UUID
- Engine kebenaran: `backend/services/geotech.py` (BUKAN Safe_House_Core.py)
- Lapis AI: `backend/services/ai.py` — Google Gemini, server-side only.
  Primary `gemini-3.7-flash`, fallback `gemini-3.1-flash-lite`, lalu cache.
  AI hanya menjelaskan hasil audit, tidak pernah menghitung angka.
- API: `POST /api/audit`, `/api/narrative`, `/api/narrative/{id}`,
  `/api/chat`, `GET /api/ai/status`, `/laporan/{slug}`
- Frontend murni penyaji; semua hitung + kunci API di backend

## Aturan kerja
- `main` terkunci → wajib PR (branch → PR → squash merge)
- JANGAN taruh kunci API di frontend. Gemini + DATABASE_URL = backend only,
  tidak boleh prefix `VITE_`, tidak boleh commit `.env`
- Bahasa UI + copy = **Indonesia**. Istilah baku SNI = "likuefaksi" (bukan
  "likuifaksi")
- Engine/skor/API = jangan diubah tanpa alasan; itu moat (fisika deterministik)
- AI = lapisan penjelas saja. Jangan biarkan model mengubah score, FS, Vs30,
  PGA, kelas situs, kelas bahaya. Ringkasan teknis kritis dibuat backend.
- UI: pertahankan brand + logo + palet Mocha. Prioritas = hierarki hero-score.
  Kredibel, bukan flashy. Lihat `docs/ui-research/`

## Blocker aktif (per 15 Agu)
- `frontend/vercel.json` rewrite SPA belum ada → `/app` & `/laporan` 404 di staging
- Tombol "Coba Gratis" tak navigasi ke `/app`
- Kunci API lama belum di-rotate (lihat STATE-HANDOFF § keamanan)
- Lapis AI + migrasi DB Supabase ada di branch `agent/ai-grounded-audit`
  (PR #10), belum merge ke `main`

## Setup env (backend/.env — salin dari `.env.example`)
- `GEMINI_API_KEY` — wajib untuk lapis AI (server-side)
- `DATABASE_URL` — Supabase Transaction pooler (port 6543); kosongkan untuk
  jalan tanpa penyimpanan

## Perintah
```bash
cd frontend && npm install && npm run build
cd backend && ./.venv/Scripts/python.exe -m uvicorn main:app --port 8000
# tes backend:
PYTHONPATH=backend python -m unittest discover -s backend/tests -v
```
