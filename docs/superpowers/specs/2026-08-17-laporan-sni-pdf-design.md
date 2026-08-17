# Spec — Laporan SNI Profesional (PDF)

**Tanggal:** 2026-08-17
**Status:** Disetujui (design), siap plan
**Skala:** Fitur baru frontend, client-side PDF, ~4 file + 1 dep

## 1. Tujuan

Fitur ekspor **Laporan Audit Risiko Geoteknik & Lingkungan** format dokumen
profesional (putih, A4, multi-halaman) yang biasa dipakai konsultan/PBG —
terpisah dari PDF dashboard gelap yang sudah ada. Bisa diunduh sebagai PDF.

## 2. Batasan non-negosiasi

- **Angka dari backend audit** (`property`), via adapter existing. TIDAK
  dihitung ulang di report (moat: engine deterministik satu-satunya sumber
  skor/FS/Vs30/PGA).
- **Prosa deterministik** — kalimat dipilih berdasar ambang risiko, BUKAN AI.
  Tanpa halusinasi, selalu konsisten, aman untuk dokumen legal/PBG.
- **Client-side** (jsPDF) — tanpa backend, Vercel-safe. Teks selectable.
- **Bahasa Indonesia**, istilah SNI baku ("likuefaksi").
- **Penampik menonjol** — desk study berbasis data publik, BUKAN pengganti
  penyelidikan tanah lapangan (SNI 8460) / dokumen PBG bersertifikat.
- Tidak menyentuh `backend/`. PDF dashboard existing (`exportPrintReadyPdf`)
  tidak diubah.

## 3. Sumber data (kontrak `AuditResult` / `GeotechProfile`)

Tersedia di `property` (backend audit):
- Lokasi: `lat`, `lon`, `address`, `elevation`, `geotech.elevation_m`,
  `geotech.elevation_assumed`, `geotech.nearest_city`
- Skor: `safe_score`, `risk_level`, `audit_status`, `confidence`,
  `score_version`
- Seismik SNI 1726: `geotech.vs30`, `geotech.site_class` (SA–SE),
  `geotech.pga`, `geotech.fa`, `geotech.pga_surface`, `geotech.t0_resonance`
- Likuefaksi: `geotech.fs`, `geotech.status` (RAWAN/AMAN)
- Seismotektonik (NearestFeature name + distance_km): `geotech.nearest_fault`,
  `geotech.nearest_volcano`, `geotech.nearest_megathrust`,
  `geotech.nearest_coast`
- Bahaya/lingkungan: `hazard` (dict, mis. banjir InaRISK), `environment` (dict)
- Provenance: `geotech.provenance` (parameter → sumber)
- `sources_failed` — sumber yang gagal (untuk kejujuran data)

Adapter `normalizePdfProperty` (di `pdfExport.js`) sudah menormalkan bentuk
backend → camelCase; report memakai jalur yang sama agar tidak menghitung
ulang. Jika field tidak ada, report menampilkan "—" (tidak mengarang).

## 4. Arsitektur & file

| File | Tanggung jawab | Aksi |
|------|----------------|------|
| `frontend/src/lib/reportTemplates.js` | Pure fn: pemilih prosa deterministik (by ambang), formatter angka, nomor laporan, deskripsi kelas situs. Tanpa jsPDF/DOM → unit-testable. | Create |
| `frontend/src/lib/professionalReport.js` | `exportProfessionalReport(property, lang)` — render jsPDF A4 (sampul, section, tabel autotable, kop/footer). | Create |
| `frontend/test_report_templates.test.mjs` | Unit test pure fn. | Create |
| `frontend/src/components/panels/LeftPanel.jsx` | Tombol "Laporan SNI" di grid aksi PopulatedState (baris `Full PDF + share`). | Modify |
| `frontend/package.json` | Dep `jspdf-autotable`. | Modify |

`reportTemplates.js` dipisah dari `professionalReport.js` supaya logika
pemilihan prosa + format bisa dites tanpa jsPDF.

## 5. Struktur laporan (A4 210×297mm, margin 18mm)

Kop tiap halaman (kecuali sampul): garis + "S.A.F.E House — Laporan Audit
Risiko Geoteknik & Lingkungan" kiri, No. laporan kanan.
Footer tiap halaman: "Desk Study · Halaman X/Y · dibuat {tanggal}" + disclaimer
ringkas satu baris.

1. **Sampul** — logo (opsional/teks brand), judul besar "LAPORAN AUDIT RISIKO
   GEOTEKNIK & LINGKUNGAN", subjudul "(Desk Study Berbasis Data Publik)",
   blok: Lokasi (alamat), Koordinat, No. Laporan `SAFE/YYYY/MM/NNNN`
   (dari id audit atau hash koordinat+tanggal), Tanggal, "Disiapkan oleh:
   S.A.F.E House". Badge status audit (valid/provisional) + confidence.
2. **Ringkasan Eksekutif** — Skor SAFE (0–100) + label (AMAN/SEDANG/WASPADA),
   kelas situs + arti, 2–3 kalimat temuan kritis (template by risk_level +
   fs + banjir), rekomendasi ringkas.
3. **1. Informasi Lokasi** — tabel: Alamat, Lat, Lon, Elevasi (+"(diasumsikan)"
   jika `elevation_assumed`), Kota terdekat, Status audit, Confidence.
4. **2. Metodologi & Dasar Acuan** — paragraf: desk study, acuan SNI 1726:2019
   (ketahanan gempa), SNI 8460:2017 (geoteknik/likuefaksi); sumber USGS,
   InaRISK BNPB, PuSGeN 2024; batasan (resolusi regional, bukan uji lapangan).
5. **3. Parameter Seismik (SNI 1726:2019)** — tabel autotable: Vs30 (m/s),
   Kelas Situs (SA–SE + deskripsi tanah), PGA batuan dasar (g), Fa, PGA
   permukaan (g), T0 resonansi (s). Interpretasi template by site_class/pga.
6. **4. Potensi Likuefaksi** — FS + status (RAWAN/AMAN), paragraf interpretasi
   + mitigasi (template: FS<1.0 → paragraf mitigasi; FS≥1.0 → aman relatif).
7. **5. Bahaya Banjir & Lingkungan** — nilai indeks banjir (dari `hazard`),
   interpretasi. Jika nodata → nyatakan "tidak ada data bahaya banjir di titik
   ini (InaRISK)" — jujur, tidak mengarang.
8. **6. Seismotektonik** — tabel jarak (km): sesar aktif, gunungapi,
   megathrust, garis pantai (proxy tsunami) + nama. Interpretasi kedekatan.
9. **7. Kesimpulan & Rekomendasi** — template by risk_level: rekomendasi
   sistem pondasi (indikatif), wajib penyelidikan tanah lanjutan (sondir/boring
   SNI 8460), mitigasi spesifik (likuefaksi/banjir/gempa bila relevan).
10. **8. Sumber Data (Provenance)** — tabel: parameter → sumber (dari
    `provenance`) + daftar `sources_failed` bila ada.
11. **Penampik (Disclaimer)** — blok kotak menonjol: desk study data publik
    resolusi regional; BUKAN pengganti penyelidikan tanah lapangan; BUKAN
    dokumen resmi PBG tanpa verifikasi ahli geoteknik bersertifikat (SKA);
    S.A.F.E House tidak bertanggung jawab atas keputusan konstruksi tanpa uji
    lapangan.

## 6. Pemilih prosa deterministik (contoh kontrak)

`reportTemplates.js` mengekspor pure fn:
- `reportNumber(property, date) → "SAFE/2026/08/NNNN"`
- `siteClassDescription(siteClass) → string` (SA "Batuan keras" … SE "Tanah
  lunak")
- `executiveSummary(p) → { headline, findings, recommendation }` (pilih by
  `safe_score`, `risk_level`, `geotech.fs`, banjir)
- `liquefactionParagraph(fs, status) → string`
- `conclusionRecommendations(p) → string[]` (array paragraf, by risk_level +
  fs + kedekatan sesar/pantai)
- `formatNum(v, unit, digits)` → "0.29 g" / "—" bila null

Ambang (contoh): skor ≥70 AMAN, 40–69 SEDANG, <40 WASPADA. FS<1.0 rawan
likuefaksi. Sesar <5km / pantai <10km → catatan khusus.

## 7. UI

`LeftPanel.jsx` PopulatedState — grid aksi sekarang 2 kolom (Full PDF, Share).
Ubah jadi: baris 1 tombol "Laporan SNI" (full width, aksen, ikon FileText),
baris 2 grid 2 kolom (Full PDF, Share). Handler `handleDownloadReport`:
- guard `canExportPdf(propertyA)` (existing) — sama seperti Full PDF
- toast loading → `exportProfessionalReport(propertyA, lang)` → success/fail
- disabled saat proses

## 8. Testing

- **Unit** (`test_report_templates.test.mjs`): pemilih prosa (skor/FS/risk →
  headline & rekomendasi benar), `reportNumber` format, `siteClassDescription`
  semua kelas, `formatNum` handle null → "—", tidak ada NaN.
- **Manual**: audit satu titik → klik "Laporan SNI" → PDF terunduh; cek 11
  section, tabel terformat, disclaimer menonjol, multi-halaman, kop/footer +
  no. halaman, teks selectable, Bahasa Indonesia.

## 9. Risiko & mitigasi

| Risiko | Mitigasi |
|--------|----------|
| Field audit null (mis. hazard banjir nodata) | `formatNum` → "—"; teks jujur "tidak ada data" |
| Report dianggap dokumen PBG resmi | Penampik menonjol + "desk study" di judul/kop/footer |
| jsPDF layout meluber multi-halaman | autotable auto page-break; cek Y-cursor tiap section, `addPage` bila perlu |
| Dep baru | jspdf-autotable = companion standar jsPDF, kecil |

## 10. Kriteria sukses

- [ ] Tombol "Laporan SNI" muncul, generate PDF dari audit valid
- [ ] 11 section + tabel + disclaimer + kop/footer + no. halaman
- [ ] Angka cocok dashboard (via adapter, tak dihitung ulang)
- [ ] Prosa deterministik (no AI), Bahasa Indonesia baku
- [ ] Unit test pure fn pass; `npm run build` pass
- [ ] PDF dashboard existing tidak berubah; backend tidak disentuh
