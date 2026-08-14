# Strategi Memaksimalkan Nilai — Building Indonesia by Emergent

**Tanggal:** 14 Agustus 2026 · **Deadline submit: 25 Agustus 2026, 23:59 WIB**
**Dokumen induk** — sintesis semua riset kompetitor (rupabumi, First Street, FEMA NRI, ClimateCheck, Walk Score, lanskap Indonesia) terhadap rubrik kontes.

---

## Rubrik (bobot)

| Kriteria | Bobot | Yang dinilai |
|---|---|---|
| Business Impact + Potensi Skala | **30%** | Dampak nyata & terbukti pada bisnis nyata + jalan melayani banyak user |
| Upvotes | 20% | Validasi publik (juga GERBANG ke penjurian: 200 teratas) |
| Problem Solving | 20% | Ketajaman definisi masalah + seberapa baik app menyelesaikannya |
| Use of Emergent | 15% | Kedalaman & craft pemakaian platform |
| UI/UX | 15% | Kejelasan, usability, finish dari sudut user nyata |

Fokus 45% gabungan = Business Impact + Problem Solving. Itu prioritas.

---

## 1. Business Impact (30%) — terberat

**Prinsip (dari First Street & FEMA):** ubah risiko → **rupiah/keputusan**,
dan **buktikan dengan bisnis nyata**, bukan hipotetis.

Tindakan:
- [ ] **Rekrut 1 konsultan perizinan/PBG nyata** (target: dosen Teknik Sipil
  UNILA, alumni HMTG/SEG, kontraktor Bandar Lampung). Minta pakai app untuk
  1 lokasi nyata.
- [ ] **Catat bukti before/after:** waktu desk study manual (buka InaRISK +
  BMKG + ESDM + Google Earth) vs waktu dengan SafeHouse. Foto keduanya.
- [ ] **Kutipan asli** dari konsultan (1 kalimat, apa adanya).
- [ ] **Framing finansial:** "sondir gagal terhindar = Rp X", "dokumen PBG
  ditolak = minggu + biaya". Angka konkret.
- [ ] **Potensi skala:** engine sama melayani developer + konsultan geoteknik.
  Sebut pasar: ribuan konsultan perizinan, asuransi parametrik bencana 2026.

Kalau dalam 3 hari tak dapat konsultan → beralih ke agen properti, ulangi
tabel bukti. Bukti nyata persona sekunder > hipotetis persona utama.

## 2. Problem Solving (20%)

**Prinsip (dari lanskap Indonesia):** tidak ada pesaing langsung. Nyatakan
eksplisit.

Tindakan:
- [ ] **Definisikan masalah tajam:** "Data risiko Indonesia terfragmentasi di
  5 portal pemerintah, dan hanya bisa dibaca ahli. Konsultan PBG buang 30-60
  menit per proyek merakit parameter SNI manual."
- [ ] **Tonjolkan moat teknis:** engine fisika deterministik (Seed & Idriss,
  SNI 1726:2019) — TIDAK bisa dikloning AI dalam sehari. Ini pembeda dari
  mayoritas 200 finalis yang bakal bikin CRUD app.
- [ ] **Transparansi metodologi** (dari First Street/FEMA): cantumkan rumus,
  sumber, disclaimer desk-study. Bagi user teknis, kejujuran = kepercayaan.

## 3. Upvotes (20%) — GERBANG, bukan sekadar kriteria

Cuma 200 teratas dinilai. Upvote akumulasi selama live.

Tindakan:
- [ ] **SUBMIT CEPAT.** Begitu deploy nembus, submit — jangan tunggu rapi.
  Update otomatis kebaca.
- [ ] **Jaringan organisasi:** SEG Student Chapter UNILA + HMTG/IAGI/SEG
  chapter kampus lain. Distribusi terorganisir.
- [ ] **Loop share dalam produk:** halaman /laporan/[slug] publik. Orang audit
  → hasil mengagetkan → share ke grup WA → yang buka butuh akun buat upvote.
  Produk jadi mesin upvote. (Sudah dibangun.)
- [ ] Jangan bot/beli vote — diskualifikasi.

## 4. Use of Emergent (15%)

**Prinsip:** entry rata-rata = 1 form + 1 tabel. Lo lebih dalam.

Tindakan:
- [ ] **Dokumentasikan** di deskripsi submisi: orkestrasi multi-API async,
  perhitungan geoteknik, generate PDF, halaman share. Jangan cuma dilakukan —
  tulis.
- [ ] Deploy = wajib (submisi = app Emergent ter-deploy).

## 5. UI/UX (15%)

**Prinsip (dari Walk Score + FEMA + First Street):** hierarki, bukan tambah
data. SafeHouse punya data bagus — masalahnya semua kartu berteriak sama keras.

Perbaikan prioritas (murah, dampak besar):
- [ ] **Satu hero score** (Walk Score) — S.A.F.E Score besar, dominan,
  berwarna. Sub-skor jadi pendukung.
- [ ] **Angka + rating kualitatif** (FEMA) — "65 — MODERATE / layak dengan
  catatan".
- [ ] **"What this means" plain-language** (First Street) — tiap parameter
  teknis diberi satu kalimat awam.
- [ ] **Sumber data + disclaimer terlihat** (First Street/FEMA) — kredibilitas.
- [ ] **Turunkan flashy** — kurangi glow berlebih, simulasi gempa gimmicky.
  Audiens PBG mau kredibel, bukan keren.
- [ ] **Interaksi ringan** (Rupabumi) — pertimbangkan panel on-demand +
  readout koordinat/elevasi live. Opsional kalau waktu cukup.

Nada visual target: **data-first kredibel (FEMA/First Street)**, bukan
command-center gamer-y.

---

## Prioritas dengan sisa waktu (~11 hari)

**Kritis (harus):**
1. Deploy nembus di Emergent → SUBMIT
2. Rekrut 1 konsultan nyata + kumpulkan bukti impact (30% rubrik)
3. Perbaikan UI hierarki skor (hero + rating + plain-language) — murah, 15%
4. Sebar link upvote lewat jaringan (gerbang 200)

**Penting (kalau waktu):**
5. Deskripsi submisi tulis kedalaman Emergent + framing finansial
6. Interaksi ringan ala Rupabumi

**Jangan (buang waktu):**
- Full UI rebuild
- Battle mode, fitur AI kompleks
- Proyeksi iklim jangka panjang

---

## Satu kalimat untuk juri

> "Data risiko bencana Indonesia tersebar di lima portal pemerintah dan hanya
> bisa dibaca ahli. SafeHouse menyatukannya jadi parameter SNI 1726:2019 siap
> PBG dalam dua menit — dengan fisika deterministik yang tak bisa dikloning
> AI, dan sudah dipakai konsultan perizinan nyata di Lampung."

Ini menyentuh Business Impact (hemat waktu terbukti), Problem Solving (masalah
tajam + moat), dan skala (parameter SNI = pasar konsultan nasional) sekaligus.
