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
- Backend: FastAPI + MongoDB/motor (`backend/`)
- Engine kebenaran: `backend/services/geotech.py` (BUKAN Safe_House_Core.py)
- API: `POST /api/audit`, `/laporan/{slug}`
- Frontend murni penyaji; semua hitung + kunci API di backend

## Aturan kerja
- `main` terkunci → wajib PR (branch → PR → squash merge)
- JANGAN taruh kunci API di frontend
- Bahasa UI + copy = **Indonesia**. Istilah baku SNI = "likuefaksi" (bukan
  "likuifaksi")
- Engine/skor/API = jangan diubah tanpa alasan; itu moat (fisika deterministik)
- UI: pertahankan brand + logo + palet Mocha. Prioritas = hierarki hero-score.
  Kredibel, bukan flashy. Lihat `docs/ui-research/`
- Jangan klaim fitur AI yang belum dibangun (lapis AI masih ditunda)

## Blocker aktif (per 15 Agu)
- `frontend/vercel.json` rewrite SPA belum ada → `/app` & `/laporan` 404 di staging
- Tombol "Coba Gratis" tak navigasi ke `/app`
- Kunci API lama belum di-rotate (lihat STATE-HANDOFF § keamanan)

## Perintah
```bash
cd frontend && npm install && npm run build
cd backend && ./.venv/Scripts/python.exe -m uvicorn main:app --port 8000
```
