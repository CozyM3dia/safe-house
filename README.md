# S.A.F.E House

**Spatial Analyst for Flood and Environment** — audit risiko geospasial untuk properti di Indonesia.

Satu koordinat masuk, satu laporan keluar: risiko banjir, potensi likuefaksi, stabilitas tanah, kedekatan sesar aktif, dan kualitas lingkungan — ditarik dari data pemerintah dan dihitung dengan rumus geoteknik standar, bukan tebakan AI.

---

## Kenapa ada

Data risiko bencana Indonesia tersebar di portal yang terpisah — InaRISK BNPB, BMKG, USGS, peta geologi regional — dan sebagian besar hanya bisa dibaca orang yang paham geofisika. Akibatnya orang membeli, membangun, atau mengurus izin di atas lahan yang risikonya tidak pernah mereka lihat.

S.A.F.E House menyatukan sumber-sumber itu jadi satu audit yang bisa dibaca dalam hitungan menit.

## Yang dihitung

| Aspek | Metode |
|---|---|
| Likuefaksi | Factor of Safety (FS) — Seed & Idriss, CSR vs CRR |
| Klasifikasi situs tanah | Inferensi Vs30, SNI 1726:2019 |
| Risiko banjir & longsor | InaRISK BNPB, radius query 200 m |
| Kegempaan | USGS, deteksi kedekatan sesar (Semangko, Palu-Koro, Lembang) |
| Lingkungan | AQI/PM2.5 (Open-Meteo), deteksi TPA terdekat (Overpass API) |
| Topografi | Analisis elevasi untuk jalur aliran air alami |

Skor akhir dirangkum sebagai **S.A.F.E Score**: **S**ecure, **A**ssured, **F**irm, **E**ngineered.

---

## Struktur

```
frontend/         React 19 + Vite + Tailwind + Leaflet + Zustand
backend/          Express API proxy — menjaga API key tetap di server
knowledge/        Basis pengetahuan geologi Indonesia untuk RAG
motion-graphics/  Aset motion untuk video demo
```

Backend ada supaya API key (Gemini, Google Maps, OpenRouter) tidak pernah sampai ke browser. Frontend tidak boleh memanggil layanan berbayar secara langsung.

---

## Menjalankan secara lokal

**Prasyarat:** Node.js 20+

```bash
git clone https://github.com/CozyM3dia/safe-house.git
cd safe-house
```

Backend:

```bash
cd backend && npm install && cp .env.example .env
```

Isi `backend/.env` dengan kunci milikmu sendiri, lalu:

```bash
npm run dev
```

Frontend, di terminal terpisah:

```bash
cd frontend && npm install && cp .env.example .env && npm run dev
```

Frontend jalan di `http://localhost:5173`, backend di `http://localhost:3001`.

### Variabel lingkungan

`backend/.env` — `GEMINI_API_KEY`, `OPENROUTER_API_KEY`, `MAPS_API_KEY`, `PORT`
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

InaRISK BNPB · Open-Meteo · USGS · Overpass API · Google Gemini

## Lisensi

Belum ditentukan. Sampai ada keputusan, seluruh hak dipegang penulis dan repo bersifat privat.
