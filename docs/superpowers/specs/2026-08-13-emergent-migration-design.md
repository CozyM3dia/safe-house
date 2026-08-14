# S.A.F.E House — Migrasi ke Stack Emergent

**Tanggal:** 13 Agustus 2026
**Status:** disetujui, siap dieksekusi
**Konteks:** Builder Fest Indonesia — submit 25 Agustus 2026, 23:59 WIB

---

## 1. Tujuan

Memindahkan S.A.F.E House ke stack native Emergent (React + FastAPI + MongoDB)
supaya bisa di-`Pull from GitHub`, di-deploy dari Emergent, dan disubmit ke
kontes — tanpa menulis ulang logika geoteknik dari nol.

Yang **bukan** tujuan: menambah fitur baru, mendesain ulang UI, atau
menyempurnakan lapis AI. Semua itu setelah app berhasil ter-deploy.

## 2. Kendala yang membentuk desain

| Kendala | Konsekuensi |
|---|---|
| Backend native Emergent = FastAPI (Python), bukan Express | Backend ditulis ulang dalam Python |
| Credit Emergent mahal (deploy 50/bulan dari jatah 100) | Bangun di Claude Code, Emergent dipakai untuk integrasi + deploy |
| Deadline 12 hari, tim 3 orang | Batas modul harus jelas supaya bisa paralel tanpa konflik |
| Kunci API pernah bocor di repo | Tidak ada kunci di frontend. Semua panggilan berbayar lewat backend |
| Upvote adalah gerbang ke penjurian | Halaman hasil publik yang bisa dibagikan wajib ada sebelum submit |

## 3. Arsitektur

```
Frontend (React + Vite)        Backend (FastAPI)              MongoDB
──────────────────────         ─────────────────              ───────
peta, panel, kartu        ←→   POST /api/audit                audits
gauge, radar, PDF              perhitungan FS, PGA, Vs30      shared_reports
state UI (Zustand)             panggil API eksternal
i18n                           simpan hasil
```

Frontend murni penyaji. Semua perhitungan dan semua panggilan keluar ada di
backend. Frontend tidak pernah memegang kunci apa pun.

### Kenapa engine pindah ke backend

1. Kunci API tidak pernah sampai ke browser
2. `Safe_House_Core.py` sudah menyediakan ~60% logika dalam Python
3. Kedalaman pemakaian platform dinilai 15% di rubrik kontes

### Sumber kebenaran per bagian

Dua versi engine sudah ada dan keduanya tidak lengkap. Aturan penggabungan:

| Bagian | Ambil dari | Alasan |
|---|---|---|
| Lookup PGA regional | `engine.js` `getRegionalPga` | 50+ kota se-Indonesia; versi Python masih hardcode Lampung |
| Konstanta sesar/gunung/megathrust | `engine.js` (`ACTIVE_FAULTS`, `VOLCANOES`, `MEGATHRUST`, `COASTLINE`) | daftarnya lebih panjang |
| Struktur async & panggilan API | `Safe_House_Core.py` | sudah `aiohttp`, tinggal disesuaikan |
| Rumus FS likuefaksi | keduanya identik | ambil mana saja, verifikasi hasilnya sama |
| Skor risiko dari FS | `engine.js` `calcLiquefaction` | versi Python belum punya `riskScore` |

**Wajib:** setelah port, jalankan kedua versi pada koordinat yang sama dan
pastikan `fs`, `vs30`, `pga` cocok sampai 2 desimal. Kalau tidak cocok,
port-nya salah.

## 4. Data model (MongoDB)

Dua koleksi. Tidak lebih sampai ada kebutuhan nyata.

### `audits`

```
_id             ObjectId
lat             float
lon             float
address         string
elevation       float           meter di atas permukaan laut
safe_score      int             0–100
risk_level      string          "safe" | "moderate" | "danger"
geotech         object          hasil engine — lihat di bawah
hazard          object          data InaRISK
environment     object          AQI, PM2.5, suhu permukaan
seismic         object          gempa terdekat dari USGS
nearby          array[string]   objek dari Overpass
narrative       object | null   laporan AI, null sampai tahap 6
created_at      datetime
```

`geotech` berisi keluaran engine apa adanya:

```
fs              float     Factor of Safety likuefaksi
status          string    "RAWAN" jika fs < 1.0, selain itu "AMAN"
vs30            int       m/s
site_class      string    SC | SD | SE
pga             float     PGA desain regional
fa              float     faktor amplifikasi situs
pga_surface     float     pga * fa
risk_score      int       0–100
nearest_city    string    kota acuan PGA
nearest_fault   object    { name, distance_km }
nearest_volcano object    { name, distance_km }
```

### `shared_reports`

```
_id         ObjectId
slug        string      URL pendek, unik, diindeks
audit_id    ObjectId    referensi ke audits
views       int
created_at  datetime
```

Koleksi kedua ini yang menopang loop upvote kontes — tiap hasil audit punya
halaman publik yang bisa dibagikan.

## 5. Kontrak API

Disepakati di depan supaya frontend dan backend bisa dikerjakan paralel.

| Method | Path | Fungsi |
|---|---|---|
| GET | `/api/health` | cek hidup |
| POST | `/api/geocode` | alamat atau teks bebas → koordinat |
| GET | `/api/reverse-geocode?lat=&lon=` | koordinat → alamat |
| POST | `/api/audit` | **inti** — koordinat → audit lengkap, simpan, kembalikan |
| GET | `/api/audit/{id}` | ambil audit tersimpan |
| POST | `/api/share` | buat slug publik untuk sebuah audit |
| GET | `/api/share/{slug}` | ambil audit publik lewat slug |
| POST | `/api/narrative/{id}` | **tahap 6** — hasilkan laporan AI |
| POST | `/api/chat` | **tahap 6** — chatbot |

### `POST /api/audit`

Request:
```json
{ "lat": -5.43, "lon": 105.262, "lang": "id" }
```

Response: satu dokumen `audits` utuh, tanpa `narrative` (null sampai tahap 6).

Perilaku wajib:
- Sumber eksternal dipanggil **paralel**, bukan berurutan
- Tiap sumber punya timeout sendiri (8 detik) dan boleh gagal sendiri-sendiri
- Satu sumber gagal tidak menggagalkan audit — field-nya `null`, sisanya jalan
- Response menyertakan `sources_failed: []` supaya UI bisa jujur soal data yang hilang

Ini penting: InaRISK dan Overpass sering lambat. Audit yang gagal total karena
satu API mati akan terlihat buruk saat demo di depan juri.

## 6. Sumber data eksternal

| Sumber | Dipakai untuk | Kunci? |
|---|---|---|
| InaRISK BNPB | risiko banjir, longsor, bandang — radius 200 m | tidak |
| Open-Meteo | elevasi, suhu, AQI, PM2.5 | tidak |
| USGS | gempa historis terdekat | tidak |
| Overpass API | sungai, TPA, jalan, fasilitas sekitar | tidak |
| Nominatim OSM | geocoding & reverse geocoding | tidak |
| Google Gemini | laporan naratif, Street View vision | **ya — tahap 6** |

Tahap 1–5 tidak butuh satu pun kunci API. Audit sudah mengeluarkan angka penuh
tanpa AI.

### Tile peta

`DESIGN_SYSTEM.md` menyebut Carto Positron, `constants.js` memakai Google Maps
XYZ tanpa kunci resmi — yang di luar ketentuan layanan Google.

**Keputusan:** Carto Positron untuk mode jalan, Esri World Imagery untuk mode
satelit. Keduanya gratis, tanpa kunci, dan boleh dipakai. Google Maps tile
dihapus.

## 7. Struktur direktori

Mengikuti konvensi yang dikenali Emergent saat `Pull from GitHub`:

```
frontend/          React + Vite (dipertahankan, dimigrasi bertahap)
  src/
    components/    cards, map, panels, ui — struktur lama dipertahankan
    services/      api.js — pemanggil backend, menggantikan engine.js
    store/         Zustand
    lib/           i18n, formatters, konstanta UI
backend/           FastAPI — menggantikan Express
  main.py          app, CORS, router
  models.py        skema Pydantic
  db.py            koneksi MongoDB
  routers/
    audit.py
    geo.py
    share.py
    ai.py          kosong sampai tahap 6
  services/
    geotech.py     haversine, PGA, Vs30, FS likuefaksi — murni, tanpa I/O
    external.py    InaRISK, Open-Meteo, USGS, Overpass, Nominatim
    scoring.py     komposisi S.A.F.E Score
  data/
    constants.py   sesar, gunung, megathrust, garis pantai, PGA per kota
```

`geotech.py` sengaja dibuat murni — tanpa panggilan jaringan, tanpa akses
database. Fungsi masuk angka, keluar angka. Itu membuatnya bisa diuji langsung
dan dibandingkan dengan `engine.js` baris per baris.

## 8. Tahapan

| Tahap | Di mana | Isi | Selesai jika |
|---|---|---|---|
| 1 | Claude Code | Scaffold FastAPI + Mongo, design token Mocha, app shell | `/api/health` menjawab, `/app` tampil |
| 2 | Claude Code | Port engine ke `geotech.py` + `constants.py` | hasil cocok dengan `engine.js` sampai 2 desimal |
| 3 | Claude Code | `external.py` + `POST /api/audit` | audit koordinat Bandar Lampung mengembalikan data penuh |
| 4 | Claude Code | Peta, panel, gauge, radar, drawer, PDF | audit bisa dijalankan dari UI dari awal sampai PDF |
| 5 | **Emergent** | Pull from GitHub, perbaiki yang pecah, deploy | app hidup di URL Emergent |
| 6 | **Emergent** | Lapis AI + halaman share publik | laporan naratif keluar, link share bisa dibagikan |
| 7 | — | **Submit**, kejar upvote, terus poles | status "Submitted" + email konfirmasi |

Submit begitu tahap 5 selesai kalau perlu — app yang jalan lebih berharga
daripada app yang lengkap tapi tidak pernah tersubmit. Perbaikan setelah submit
otomatis terpantul ke entri.

## 9. Pembagian kerja bertiga

Batasnya dipilih supaya tiga orang jarang menyentuh file yang sama.

| Orang | Wilayah | File utama |
|---|---|---|
| A | Engine & backend | `backend/services/`, `backend/data/` |
| B | API & data | `backend/routers/`, `backend/models.py`, `db.py` |
| C | Frontend | `frontend/src/` |

Kontrak API di bagian 5 adalah perjanjian antara B dan C. Selama response
sesuai kontrak, keduanya bisa jalan tanpa saling menunggu — C memakai data
tiruan sampai backend siap.

Semua lewat Pull Request. `main` terkunci.

## 10. Penanganan kesalahan

| Kasus | Perilaku |
|---|---|
| Satu sumber eksternal timeout | field-nya `null`, masuk `sources_failed`, audit tetap jalan |
| Semua sumber gagal | HTTP 503, pesan Indonesia yang bisa dibaca orang awam |
| Koordinat di luar Indonesia | HTTP 422, "Lokasi di luar cakupan data Indonesia" |
| Geocoding tidak menemukan alamat | koordinat tetap dipakai, `address` = "Lokasi tidak terdeteksi" |
| MongoDB tidak tersambung | audit tetap dihitung dan dikembalikan, hanya tidak tersimpan |

Kasus terakhir disengaja: saat demo di depan juri, database mati tidak boleh
membuat app tampak rusak.

## 11. Pengujian

Tidak ada suite besar — waktunya tidak ada. Yang wajib:

1. **Uji paritas engine.** Sepuluh koordinat (Bandar Lampung, Jakarta, Padang,
   Palu, Denpasar, dan lima acak). Jalankan `geotech.py` dan `engine.js`,
   bandingkan `fs`, `vs30`, `pga`, `site_class`. Harus sama.
2. **Uji ketahanan audit.** Matikan tiap sumber eksternal satu per satu,
   pastikan audit tetap mengembalikan hasil.
3. **Uji jalur utama secara manual.** Buka `/app`, klik peta, audit selesai,
   PDF terunduh.

Selain itu, tidak perlu.

## 12. Keamanan

- Tidak ada kunci di `frontend/`. Selamanya.
- Tidak ada kunci di source code mana pun — hanya `backend/.env`
- `.env.example` berisi nama variabel, tanpa nilai
- Kunci lama yang pernah masuk repo **harus dirotasi** sebelum dipakai lagi
- CORS dibatasi ke origin frontend, bukan `*`

## 13. Yang sengaja tidak dikerjakan

Dicatat supaya tidak diam-diam masuk lagi:

- Mode Battle (perbandingan dua properti) — tidak dinilai rubrik
- Failsafe multi-model AI (Gemini + OpenRouter + Ollama) — satu model cukup
- Onboarding tour
- Animasi landing page
- Autentikasi pengguna
- Dukungan bahasa Inggris penuh — struktur disiapkan, terjemahan belakangan

Kalau ada waktu tersisa setelah tahap 7, baru dipertimbangkan lagi.
