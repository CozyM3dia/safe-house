# S.A.F.E House — Rencana Kemenangan

**Kontes:** Building Indonesia by Emergent
**Deadline submit:** 25 Agustus 2026, 23:59 WIB · **hari ini:** 14 Agustus · **sisa ~11 hari**
**Dokumen ini** menyatukan seluruh riset kompetitor + strategi jadi satu rencana operasional. Rujukan detail per kompetitor ada di `docs/ui-research/`.

---

## 0. TESIS KEMENANGAN (satu paragraf)

> SafeHouse menang bukan karena app paling keren, tapi karena satu-satunya
> yang menyelesaikan masalah nyata yang belum terpecahkan: data risiko
> bencana Indonesia tersebar di lima portal pemerintah dan hanya bisa dibaca
> ahli. SafeHouse menyatukannya jadi parameter SNI 1726:2019 siap-PBG dalam
> dua menit, dengan fisika deterministik yang tak bisa dikloning AI, dan
> dibuktikan oleh konsultan perizinan nyata di Lampung.

Tiga pilar tesis ini menyentuh 3 kriteria terberat sekaligus:
Business Impact (30%), Problem Solving (20%), dan potensi skala.

---

## 1. RUBRIK & DI MANA KITA MENANG/KALAH

| Kriteria | Bobot | Posisi kita | Aksi |
|---|---|---|---|
| Business Impact + Skala | **30%** | ⚠️ lemah — belum ada bukti bisnis nyata | Rekrut 1 konsultan, kumpulkan before/after |
| Upvotes | 20% | 🟡 potensi kuat — jaringan SEG + share loop | Submit cepat, sebar link |
| Problem Solving | 20% | 🟢 kuat — masalah tajam, moat fisika | Nyatakan eksplisit, tonjolkan determinisme |
| Use of Emergent | 15% | 🟢 kuat — backend dalam, multi-API | Dokumentasikan di deskripsi |
| UI/UX | 15% | 🟡 sedang — data bagus, hierarki lemah | Hero score + plain-language + kurangi flashy |

**Fokus energi:** 30% Business Impact (paling lemah, paling berat) +
15% UI/UX (perbaikan termurah). Upvotes/Problem Solving/Emergent sudah kuat,
tinggal dieksekusi & didokumentasikan.

---

## 2. KEADAAN SEKARANG (per 15 Agu)

**Sudah jadi & terverifikasi:**
- Backend FastAPI + engine geoteknik Python (paritas 10/10 dgn engine.js)
- `POST /api/audit` E2E HTTP 200 (Bandar Lampung skor 65, Sesar Tarahan 10.97km)
- Integrasi InaRISK/Open-Meteo/USGS/Overpass, gagal-sebagian aman
- Halaman share publik `/laporan/:slug` (mesin upvote)
- Landing B2B konsultan PBG
- Kartu native + SEO (meta, JSON-LD, robots, sitemap)
- Repo `CozyM3dia/safe-house` public, bersih dari API key
- ✅ **Deploy Emergent NEMBUS & LIVE** (15 Agu) — blocker infra GCS beres.
  App ter-deploy. URL: _(diisi)_. Re-deploy manual tiap ada improvement.

**Blocker aktif:** tidak ada. Fokus geser ke improvement.

**Belum dikonfirmasi:**
- LeftPanel visual populate — cek langsung di build ter-deploy sekarang

**Lapis AI:** ditunda, tinggal colok kunci (tahap 6)

---

## 3. RENCANA PER-RUBRIK

### 3A. Business Impact (30%) — PRIORITAS TERTINGGI

Prinsip (First Street, FEMA): risiko → rupiah + bukti bisnis NYATA.

**Aksi:**
1. Rekrut 1 konsultan perizinan/PBG nyata. Jalur: dosen Teknik Sipil UNILA,
   alumni HMTG/SEG di konsultan, kontraktor Bandar Lampung. Target: 3 hari.
2. Minta pakai app untuk 1 lokasi proyek nyata.
3. Catat bukti:
   - Waktu SEBELUM (buka InaRISK+BMKG+ESDM+Earth manual) vs SESUDAH (app)
   - Jumlah proyek/bulan → kalikan penghematan
   - Screenshot 5 portal berdampingan 1 laporan SafeHouse
   - 1 kutipan asli konsultan
4. Framing finansial: "sondir gagal terhindar = Rp X", "PBG ditolak = minggu +
   biaya hangus".
5. Narasi skala: engine sama untuk developer + konsultan geoteknik +
   underwriting asuransi parametrik bencana (regulasi 2026).

**Fallback:** kalau 3 hari tak dapat konsultan → agen properti, ulangi tabel
bukti. Bukti nyata > hipotetis.

### 3B. Problem Solving (20%)

Prinsip (lanskap Indonesia): tidak ada pesaing langsung.

**Aksi:**
1. Definisi masalah tajam di submisi: "5 portal terpisah, hanya untuk ahli,
   30-60 menit per proyek."
2. Tonjolkan moat: engine fisika deterministik (Seed & Idriss, SNI) — tak bisa
   dikloning AI. Beda dari mayoritas 200 finalis (CRUD app).
3. Transparansi metodologi: rumus, sumber, disclaimer desk-study terlihat.

### 3C. Upvotes (20%) — GERBANG 200

**Aksi:**
1. ✅ Deploy live → SUBMIT SEKARANG. Jangan tunggu rapi.
2. Sebar via jaringan SEG UNILA + HMTG/IAGI/SEG kampus lain.
3. Loop share: /laporan/[slug] publik → hasil mengagetkan → share WA → upvote.
4. Jangan bot/beli vote.

### 3D. Use of Emergent (15%)

**Aksi:**
1. Tulis di deskripsi submisi: orkestrasi multi-API async, perhitungan
   geoteknik, generate PDF, halaman share. Dokumentasikan kedalaman.
2. Deploy = wajib (submisi = app Emergent ter-deploy).

### 3E. UI/UX (15%) — perbaikan termurah

Prinsip (Walk Score, FEMA, First Street): hierarki, bukan tambah data.

**Aksi (urut dampak):**
1. **Satu hero score** — S.A.F.E Score besar dominan berwarna, sub-skor
   pendukung.
2. **Angka + rating kualitatif** — "65 — MODERATE / layak dengan catatan".
3. **"What this means"** plain-language tiap parameter (FS, PGA, kelas situs).
4. **Sumber data + disclaimer terlihat** — kredibilitas.
5. **Turunkan flashy** — kurangi glow/gimmick gempa. Kredibel > keren.
6. (Opsional) interaksi ringan ala Rupabumi: panel on-demand + koordinat live.

Nada target: **data-first kredibel (FEMA/First Street)**, bukan command-center.

---

## 4. SINTESIS KOMPETITOR (apa yang dicuri dari siapa)

| Sumber | Curi | Untuk rubrik |
|---|---|---|
| First Street | Framing "physics-based deterministic", bahasa finansial, "The Standard" | Business Impact, Problem Solving |
| FEMA NRI | Skor komposit+per-bahaya, angka+rating, nada data-first pemerintah, exposure rupiah | UI/UX, Business Impact |
| ClimateCheck | Skala 1-100 seragam, laporan PDF berlapis, tips mitigasi | UI/UX |
| Walk Score | Satu hero score kalahkan dinding angka | UI/UX |
| Rupabumi | Interaksi peta-first, analisis kontekstual, koordinat live | UI/UX |
| Lanskap ID | Celah = lapisan workflow di atas portal terfragmentasi | Problem Solving |

---

## 5. TIMELINE KE 25 AGUSTUS

| Hari | Fokus |
|---|---|
| **15 Agu** | ✅ Deploy NEMBUS & LIVE. → **SUBMIT SEKARANG** (walau belum rapi). Mulai kontak konsultan. Cek LeftPanel di build live |
| **16-17 Agu** | Perbaikan UI hierarki skor (hero score + rating + plain-language). Re-deploy |
| **18-19 Agu** | Konsultan pakai app, kumpulkan bukti before/after. Poles UI. Basemap Stadia (opsional) |
| **20-21 Agu** | Tulis deskripsi submisi (narasi + kedalaman Emergent + bukti). Sebar upvote gelombang 1 |
| **22-23 Agu** | Sebar upvote gelombang 2 (jaringan kampus). Perbaikan dari feedback. Re-deploy |
| **24 Agu** | Cek status Submitted + email konfirmasi. Buffer masalah |
| **25 Agu** | Pastikan submit final sebelum 23:59 WIB. JANGAN mepet |

**Aturan emas:** deploy sudah live → **SUBMIT SEKARANG**. Deadline 25 = batas
akhir upvote, bukan target submit. Makin lama live, makin banyak upvote.
Tiap improvement → re-deploy manual, submisi kebaca versi terbaru otomatis.

---

## 6. RISK REGISTER

| Risiko | Dampak | Mitigasi |
|---|---|---|
| ~~Deploy Emergent macet~~ | ~~Tak bisa submit~~ | ✅ RESOLVED 15 Agu — deploy live |
| Re-deploy improvement gagal/regres | Versi live rusak | Test build lokal dulu; deploy dari branch stabil; simpan commit terakhir yang live |
| Tak dapat konsultan nyata | Business Impact lemah | Fallback agen properti; minimal 1 user nyata apa pun |
| InaRISK banjir sering down | Data banjir kosong | Sudah ditandai jujur "TIDAK DIKETAHUI"; longsor jalan |
| LeftPanel tak populate | UI rusak saat demo | Cek segera saat deploy; kemungkinan artefak HMR |
| Credit Emergent habis | Deploy/iterasi terhenti | Standard $20; hemat credit, iterasi di Claude Code |
| Submit mepet deadline | Gagal total | Submit 17 Agu, bukan 25 |

---

## 7. PITCH SUBMISI (draft narasi)

**Judul:** SafeHouse — Parameter Geoteknik PBG dari Satu Koordinat

**Deskripsi (untuk halaman submisi):**
> Indonesia mencatat rekor gempa merusak tertinggi sepanjang sejarah, dan
> asuransi parametrik bencana mulai berlaku 2026. Tapi tidak ada cara cepat
> untuk tahu apa yang ada di bawah satu titik koordinat — data BNPB, BMKG,
> USGS, dan peta geologi tersebar di lima portal terpisah, hanya terbaca ahli.
>
> SafeHouse menyatukannya jadi satu audit dalam dua menit, dengan fisika yang
> benar: Factor of Safety likuefaksi (Seed & Idriss), kelas situs Vs30, PGA
> desain PuSGeN, dan bahaya banjir InaRISK — semua mengacu SNI 1726:2019.
>
> Dibangun untuk konsultan perizinan yang harus meloloskan PBG. Engine yang
> sama melayani developer, konsultan geoteknik, dan — ke depan — underwriting
> asuransi parametrik. Sudah dipakai [nama konsultan] di Lampung: desk study
> yang biasanya 45 menit jadi 2 menit.
>
> Dibangun di Emergent: orkestrasi multi-API asinkron, perhitungan geoteknik
> deterministik, generate laporan PDF, dan halaman audit publik.

---

## 8. KEPUTUSAN YANG DIBUTUHKAN DARI TIM

- [x] ~~Deploy nembus~~ — ✅ LIVE 15 Agu. Langkah berikut: SUBMIT.
- [ ] Isi URL deploy live ke dokumen ini + submisi.
- [ ] Siapa kontak konsultan PBG pertama? (target 3 hari)
- [ ] Prioritas improvement: hierarki skor dulu (rekomendasi), lalu basemap Stadia.
- [ ] Pembagian tugas tim bertiga: siapa konsultan, siapa UI, siapa upvote?

---

## RUJUKAN

- `docs/ui-research/00-strategi-maksimalkan-nilai.md` — strategi ringkas
- `docs/ui-research/*.md` — analisis per kompetitor
- `docs/positioning-b2b-seo.md` — positioning & SEO
- `docs/superpowers/specs/2026-08-13-emergent-migration-design.md` — arsitektur
