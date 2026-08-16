# S.A.F.E House

**Spatial Analyst for Flood and Environment** — audit risiko geospasial untuk properti di Indonesia.

Satu koordinat masuk, satu laporan keluar: risiko banjir, potensi likuefaksi, stabilitas tanah, kedekatan sesar aktif, dan kualitas lingkungan — ditarik dari data pemerintah dan dihitung dengan rumus geoteknik standar, bukan tebakan AI.

---

## Kenapa ada

Data risiko bencana Indonesia tersebar di portal yang terpisah — InaRISK BNPB, USGS, Open-Meteo, OpenStreetMap, dan referensi geologi regional — dan sebagian besar hanya bisa dibaca orang yang paham geofisika. Akibatnya orang membeli, membangun, atau mengurus izin di atas lahan yang risikonya tidak pernah mereka lihat.

S.A.F.E House menyatukan sumber-sumber itu jadi satu audit yang bisa dibaca dalam hitungan menit.

## Yang dihitung

| Aspek | Metode |
|---|---|
| Likuefaksi | Factor of Safety (FS) — Seed & Idriss, CSR vs CRR |
| Klasifikasi situs tanah | Inferensi Vs30, SNI 1726:2019 |
| Risiko banjir & longsor | InaRISK BNPB, raster identify per titik |
| Tsunami, likuefaksi, vulkanik, abrasi | Layer bahaya InaRISK BNPB, ditampilkan dengan provenance |
| Kegempaan | USGS, deteksi kedekatan sesar (Semangko, Palu-Koro, Lembang) |
| Lingkungan | AQI/PM2.5 (Open-Meteo), deteksi TPA terdekat (Overpass API) |
| Topografi | Analisis elevasi untuk jalur aliran air alami |

Skor akhir dirangkum sebagai **S.A.F.E Score**: **S**ecure, **A**ssured, **F**irm, **E**ngineered.

---

## Struktur

```
frontend/         React 19 + Vite + Tailwind + Leaflet + Zustand
backend/          FastAPI — audit deterministik, penyimpanan, dan lapis AI
knowledge/        Referensi geologi prototipe (bukan sumber skor produksi)
motion-graphics/  Aset motion untuk video demo
```

Backend ada supaya perhitungan dan API key Gemini tidak pernah sampai ke browser. Gemini hanya menarasikan `AuditResult`; model tidak menghitung atau mengubah S.A.F.E Score, FS, Vs30, PGA, maupun kelas bahaya.

---

## Menjalankan secara lokal

**Prasyarat:** Node.js 20+ dan Python 3.12+

```bash
git clone https://github.com/CozyM3dia/safe-house.git
cd safe-house
```

Backend:

```bash
cd backend
python -m venv .venv
# Linux/macOS: source .venv/bin/activate
# Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Isi `backend/.env` dengan kunci milikmu sendiri, lalu:

```bash
uvicorn main:app --reload --port 8000
```

Frontend, di terminal terpisah:

```bash
cd frontend && npm install && cp .env.example .env && npm run dev
```

Frontend jalan di `http://localhost:5173`, backend di `http://localhost:8000`.

### Variabel lingkungan

`backend/.env` — `GEMINI_API_KEY`, `GEMINI_MODEL`, `MONGO_URL`, `CORS_ORIGINS`
`frontend/.env` — `VITE_API_URL`

Setiap orang memakai kunci masing-masing. **Jangan pernah commit file `.env`** — hanya `.env.example` yang masuk repo. Lihat [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Kerja bertiga

Baca [CONTRIBUTING.md](CONTRIBUTING.md) sebelum push pertama. Ringkasnya: `main` terkunci, semua perubahan lewat branch + Pull Request.

## Dokumen

| File | Isi |
|---|---|
| [project.md](project.md) | Requirement & daftar fitur |
| [SafeHouse Briefing.md](SafeHouse%20Briefing.md) | Konteks kompetisi, filosofi S.A.F.E Score, engine geoteknik |
| [design.md](design.md) | Arah desain |
| [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) | Token warna, tipografi, komponen |

## Sumber data

InaRISK BNPB · USGS earthquake context · Open-Meteo · OpenStreetMap/Nominatim/Overpass · Google Gemini (penjelasan saja)

### Akurasi dan mode data

Audit membedakan observasi layer resmi, referensi open data, dan proxy model.
`AUDIT_DATA_MODE=best_available` cocok untuk screening awal dan tetap memberi
label `provisional` bila layer penting belum tersedia. Untuk workflow PBG,
konstruksi, atau keputusan investasi, gunakan `AUDIT_DATA_MODE=strict` agar
skor tidak diterbitkan ketika input kritis hilang. Nilai Vs30, PGA desain,
geometri sesar, DEMNAS, muka air tanah, subsidence InSAR, dan kerentanan
bangunan tetap membutuhkan input resmi/penyelidikan tersendiri.

## Lisensi

Belum ditentukan. Sampai ada keputusan, seluruh hak dipegang penulis meskipun repositori dapat diakses publik.
