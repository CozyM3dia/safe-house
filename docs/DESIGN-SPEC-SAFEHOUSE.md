# S.A.F.E House — Design Spec Lengkap (untuk Remake UI/UX + Ilustrasi)

**Tujuan dokumen:** satu sumber lengkap seluruh fitur + arah visual SafeHouse.
Dipakai untuk dua hal:
1. Generate ilustrasi di ChatGPT image generation (lihat Bagian 7 — prompt siap-tempel)
2. Meremake seluruh UI/UX (lihat Bagian 6 — prinsip + do/don't)

**Catatan scope:** app sudah LIVE. Remake sebaiknya dibuat sebagai lapisan
visual baru yang di-preview dulu, bukan langsung ganti yang live. Jangan ubah
logika: skor, engine, API, data. Ini murni kulit (UI/UX).

**WAJIB dipertahankan (brand identity):** logo S.A.F.E House dan brand design
yang ada TETAP dipakai. Remake memperbarui tata letak, hierarki, dan poles
visual — BUKAN mengganti identitas merek. Logo, nama, palet Mocha (Bagian 2),
dan motif khas (glass hangat + double-bezel + serif/mono) adalah jangkar
merek yang tidak diubah. Semua prompt ilustrasi & instruksi remake harus
menyisakan logo SafeHouse dan tetap dalam sistem warna ini.

---

## 1. IDENTITAS PRODUK

**Nama:** S.A.F.E House (Spatial Analyst for Flood and Environment)
**Skor akhir:** S.A.F.E Score — Secure, Assured, Firm, Engineered.

**Satu kalimat:** SafeHouse mengubah satu titik koordinat jadi skor bahaya +
parameter geoteknik SNI siap-PBG, menyatukan data pemerintah yang tersebar.

**Untuk siapa:** konsultan perizinan/PBG, developer properti, konsultan
geoteknik di Indonesia.

**Nada merek:** instrumen presisi yang bisa dipercaya. Seperti alat ukur
geoteknik, bukan aplikasi konsumen yang genit. Tenang, teknis, otoritatif,
hangat. BUKAN "command center" gamer-y, BUKAN dashboard SaaS generik.

---

## 2. SISTEM VISUAL ("Mocha Geological Intelligence")

### Palet warna (hex pasti — pakai ini di prompt gambar & CSS)

| Peran | Nilai | Catatan |
|---|---|---|
| Latar utama | `#0f0b08` | warm near-black, cokelat gelap |
| Permukaan | `rgba(22,14,8,0.88)` | panel kaca |
| Elevated | `#1a1208` | kartu terangkat |
| Teks utama | `#f0e4cc` | krem hangat |
| Teks sekunder | `#c4a87e` | cokelat pasir |
| Teks redup | `#7d6245` | cokelat |
| Aksen (copper) | `#d4956a` | tembaga — warna tanda tangan |
| Aksen hover | `#b87a52` | tembaga gelap |
| Aman (safe) | `#10b981` | emerald |
| Sedang (moderate) | `#f59e0b` | amber |
| Bahaya (danger) | `#ef4444` | merah |

Glow lembut: copper `rgba(212,149,106,0.35)`, safe hijau, danger merah.

### Tipografi
- **Display/judul:** Instrument Serif (elegan, ada italic)
- **Teks/UI:** Inter (400–800)
- **Angka/data/mono:** Geist Mono (angka teknis, koordinat, parameter)

Pasangan serif display + mono data = kesan "jurnal ilmiah presisi".

### Material & tekstur
- **Glass panel:** frosted, `blur(24px)`, latar cokelat gelap transparan,
  border tipis hangat `rgba(255,210,170,0.10)`
- **Double-bezel (Doppelrand):** kartu berbingkai ganda seperti enclosure
  hardware mesin — bezel luar + inner gelap dengan inset highlight. Ini
  motif khas SafeHouse, pertahankan.
- **Grain halus** boleh, tipis. Hindari gradient norak & shadow berat.

### Motion
- Halus, fungsional. Kinetic press pada tombol. Loading beam.
- Hormati `prefers-reduced-motion`.
- KURANGI: simulasi gempa gimmicky, glow berlebihan (temuan riset: audiens
  PBG mau kredibel, bukan flashy).

---

## 3. STRUKTUR APLIKASI (dua area besar)

### A. Landing Page (B2B, publik)
Sekuens section:
1. **Hero** — proposisi + peta/ilustrasi + CTA "Mulai Audit"
2. **About** — masalah: data risiko tersebar, hanya terbaca ahli
3. **Process** — 3 langkah: pilih titik → mesin hitung → skor + parameter
4. **FAQ** — pertanyaan konsultan
5. **CTA** — ajakan coba
6. **Disclaimer** — desk study, bukan pengganti sondir/penyelidikan tanah
- **Language selector** ID/EN
- **Onboarding tour** untuk pengguna baru

### B. App Utama (peta + analisis)
Layout: peta full-canvas + panel + kontrol mengapung.

---

## 4. FITUR-FITUR (spec per-komponen)

### 4.1 Peta (inti)
- **MapArea** — kanvas Leaflet full-screen. Basemap:
  - Analysis: Stadia Alidade Smooth (rencana, muted) — DEFAULT tetap CARTO
    sampai terverifikasi
  - Street: CARTO Positron
  - Satellite: Esri World Imagery
- **MapControls** — selektor basemap segmented (Analysis/Street/Satellite),
  ikon + label, badge basemap aktif
- **MapMarker** — pin properti + scan ring (animasi pulse saat audit)
- **MapLegend** — legend klasifikasi bahaya (istilah selaras BNPB/ESDM)
- **NationwideOverlays / RiskZoneOverlay** — overlay hazard nasional
- **DisasterLayersPanel** — toggle lapisan bencana (banjir, sesar, longsor,
  gempa, gunung)
- **Interaksi (dari riset Rupabumi):** klik/tap titik → audit. Idealnya
  tambah klik-kanan / long-press → menu "Audit lokasi ini". Readout
  koordinat + elevasi live di pojok.

### 4.2 Pencarian
- **AddressCard** — input "Temukan lokasi" (Nominatim geocoding), riwayat
  pencarian, fly-to animasi ke titik.
- **CommandPalette** (Cmd/Ctrl-K) — pencarian cepat + aksi.

### 4.3 Panel Hasil — **LeftPanel**
Kontainer hasil audit. Isi kartu-kartu (urut hierarki, INI KUNCI UI/UX):

1. **SafeScoreCard** — **HERO SCORE**. Satu angka S.A.F.E Score besar,
   dominan, berkode warna (safe/moderate/danger) + rating kualitatif
   ("65 — SEDANG / layak dengan catatan"). Ini yang pertama & terbesar
   dilihat. (Pelajaran Walk Score + FEMA.)
2. **RadarCard** — radar per-bahaya (banjir, likuefaksi, gempa, longsor,
   lingkungan), skala 0–100 seragam. Skor pendukung, bukan pesaing hero.
3. **GaussianCard** — kurva distribusi/gauge, konteks statistik skor.
4. **MetricsGrid** — parameter teknis padat: FS likuefaksi, kelas situs
   Vs30, PGA desain (PuSGeN), jarak sesar/gunung/megathrust, curah hujan.
   Tiap parameter idealnya diberi **"artinya apa"** plain-language (pelajaran
   First Street).
5. **SeismicWaveform** — visualisasi gelombang seismik lokasi.
- **Sumber data + disclaimer terlihat** (kredibilitas): InaRISK, USGS, dsb.
- **EmptyState** sebelum audit; **Skeleton** saat loading.

### 4.4 AuditDrawer
Drawer detail audit — rincian lengkap semua parameter + sumber, bisa
di-scroll, jalur ke ekspor PDF.

### 4.5 Ekspor & Berbagi
- **Ekspor PDF** — laporan siap-lampir (struktur berlapis ala ClimateCheck:
  ringkasan → per-bahaya → parameter → mitigasi → disclaimer).
- **Halaman berbagi publik** `/laporan/:slug` — hasil audit publik, mesin
  upvote & corong. Harus tampil rapi saat di-share (OG image, ringkasan skor).

### 4.6 Fitur AI (ChatbotFab) — direncanakan, tahap 6
- **ChatbotFab** — tombol mengapung asisten AI di app.
- **Kemampuan yang dituju:**
  - Jelaskan hasil audit dalam bahasa awam ("kenapa skor 65?")
  - Tanya-jawab lokasi ("aman buat rumah 2 lantai?")
  - Rekomendasi mitigasi/tipe fondasi berdasar parameter
  - Ringkasan naratif laporan otomatis
- **Nada AI:** penasihat teknis yang jujur — sebut ketidakpastian, rujuk
  sumber, jangan mengklaim pengganti ahli bersertifikat.
- **Visual:** panel chat glass, avatar copper halus, jawaban terstruktur
  (poin + angka), bukan blok teks panjang.

### 4.7 Battle Mode (BattleCard) — di-stub
- Bandingkan dua lokasi berdampingan (head-to-head): skor, parameter, siapa
  lebih aman. Berguna untuk developer memilih antar-lahan.
- Visual: dua kolom cermin, pemenang di-highlight.

### 4.8 Feedback & Sistem
- **LoadingBeam** — indikator proses audit.
- **ErrorFallback** — kegagalan anggun (gagal-sebagian: tandai data yang
  tak tersedia sebagai "TIDAK DIKETAHUI", jangan palsukan "aman").
- **Language selector** ID/EN, **OnboardingTour**, **TopBar**.

---

## 5. DATA & LOGIKA (JANGAN diubah saat remake — konteks saja)

- Engine geoteknik deterministik: Seed & Idriss (FS likuefaksi), Vs30 kelas
  situs, PGA desain, jarak 47 sesar / 41 gunung / 10 megathrust, banjir
  InaRISK, longsor, cuaca Open-Meteo, gempa USGS.
- Acuan **SNI 1726:2019**. Ini moat: fisika nyata, bukan tebakan AI.
- Skor komposit S.A.F.E + sub-skor per bahaya.
- Gagal-sebagian aman: sumber down → ditandai jujur.

---

## 6. PRINSIP REMAKE UI/UX (do / don't) — dari riset kompetitor

**DO:**
- **Hierarki skor:** satu HERO score dominan, sisanya pendukung. (Walk Score)
- **Angka + rating kualitatif** berdampingan. (FEMA NRI)
- **"Artinya apa" plain-language** tiap parameter teknis. (First Street)
- **Sumber data + disclaimer terlihat** = kredibilitas. (First Street/FEMA)
- **Peta-first**, panel beri ruang napas, interaksi ringan. (Rupabumi)
- **Skala 0–100 seragam** semua bahaya. (ClimateCheck)
- Nada **data-first kredibel** (FEMA/First Street).

**DON'T:**
- Jangan bikin semua kartu berteriak sama keras (masalah UI sekarang).
- Jangan flashy/gamer-y: kurangi glow berlebih, simulasi gimmicky.
- Jangan dashboard SaaS generik atau UI "AI-generated" yang dekoratif.
- Jangan sembunyikan angka teknis — tapi beri lapis awam di atasnya.
- Jangan hilangkan motif khas: double-bezel, glass hangat, serif+mono.

**Uji akhir:** apakah seorang konsultan PBG akan percaya angka ini cukup
untuk dilampirkan ke dokumen izin? Kalau tampilannya bikin ragu, terlalu
flashy.

---

## 7. PROMPT ILUSTRASI (siap tempel ke ChatGPT image gen)

### 7.0 Preamble gaya (tempel di SETIAP prompt)
> Style: premium warm-dark "geological intelligence" interface. Palette:
> deep warm near-black background #0f0b08, cream text #f0e4cc, copper accent
> #d4956a, emerald #10b981 for safe, amber #f59e0b for moderate, red #ef4444
> for danger. Frosted glass panels with thin warm borders, double-bezel
> machined-hardware card enclosures, subtle grain, soft copper glow. Serif
> display type feel (Instrument Serif) paired with technical monospace
> numbers (Geist Mono). Mood: precise, trustworthy scientific instrument,
> calm and authoritative, NOT flashy, NOT generic SaaS, NOT gamer HUD.
> Indonesian geotechnical context. Clean, minimal, high craft.

### 7.1 Hero landing
> A hero illustration for a geotechnical risk web app. A dark warm-toned map
> of an Indonesian city seen from above, one glowing copper location pin with
> concentric scan rings, a floating glass panel showing a large "S.A.F.E
> Score" number and a small radar chart of hazards. Precise, instrument-like.
> [+ preamble 7.0]

### 7.2 Panel hasil (hero score + hierarki)
> A UI panel showing analysis results: a large dominant safety score number
> with a colored ring (emerald), below it a smaller hazard radar chart and a
> dense grid of technical parameters in monospace (liquefaction factor of
> safety, Vs30 site class, design PGA, fault distance). Clear visual
> hierarchy, one big number leads. [+ preamble 7.0]

### 7.3 Peta + kontrol
> A full-screen muted map canvas with a floating segmented basemap selector
> (Analysis / Street / Satellite), a live coordinate + elevation readout in a
> corner, a legend of hazard classes, one property pin with pulse rings.
> Map dominant, controls minimal and quiet. [+ preamble 7.0]

### 7.4 Asisten AI (ChatbotFab)
> A floating glass chat panel of an AI geotechnical advisor. Structured
> answer with bullet points and numbers explaining why a location scored 65,
> a subtle copper AI avatar, honest tone with a source citation line. Not a
> long text blob. [+ preamble 7.0]

### 7.5 Battle mode
> Two mirrored columns comparing two land plots head-to-head: each with a
> safety score, key parameters, one side highlighted as safer. Balanced,
> decision-making tool feel. [+ preamble 7.0]

### 7.6 Laporan PDF / share
> A clean layered risk report page: summary score at top, per-hazard
> breakdown, technical parameters table, mitigation tips, visible data
> sources and a desk-study disclaimer. Print-ready, credible, official feel.
> [+ preamble 7.0]

### 7.7 Ikon / motif (opsional)
> A set of minimal line icons in copper on dark: flood wave, ground
> liquefaction, seismic fault, landslide slope, volcano, foundation. Thin,
> technical, consistent stroke. [+ preamble 7.0]

**Tips pakai di ChatGPT:** minta rasio sesuai kebutuhan (16:9 hero, 4:5
panel, 1:1 ikon). Kalau hasil terlalu ramai/flashy, tambah "quieter, less
glow, more whitespace, more credible" ke prompt.

---

## 8. CHECKLIST REMAKE (jangan sampai regres)

- [ ] Semua fitur Bagian 4 tetap ada (jangan ada yang hilang saat redesign)
- [ ] Hero score hierarki diterapkan (perbaikan UI/UX terpenting)
- [ ] Motif khas dipertahankan: glass hangat, double-bezel, serif+mono
- [ ] Sumber data + disclaimer tetap terlihat
- [ ] Logika/skor/engine/API TIDAK berubah
- [ ] Bilingual ID/EN tetap jalan
- [ ] `prefers-reduced-motion` dihormati
- [ ] Preview dulu sebelum ganti build yang live
- [ ] Attribution peta (CARTO/Esri/Stadia/OSM) benar

---

## RUJUKAN
- `docs/ui-research/*.md` — analisis kompetitor (dasar prinsip Bagian 6)
- `docs/RENCANA-KEMENANGAN.md` — strategi kontes
- `frontend/src/index.css` + tailwind config — token visual sumber
