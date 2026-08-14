# Analisis — Lanskap Kompetitor Indonesia

**Tanggal:** 14 Agustus 2026
**Relevansi:** siapa yang sudah ada di pasar Indonesia, dan di mana celah SafeHouse. Ini yang paling menentukan diferensiasi untuk kontes.

---

## Pemain yang ada

| Pemain | Apa | Sifat |
|---|---|---|
| **InaRISK Personal** (BNPB) | app resmi cek risiko lokasi (banjir, longsor, dll) | Portal pemerintah, data mentah, per-wilayah |
| **BMKG Info** | notifikasi gempa + peta zona seismik | Peringatan dini, bukan analisis lokasi |
| **Geoportal ESDM / Portal MBG** (vsi.esdm.go.id/portalmbg) | peta KRB Likuefaksi, data geologi | Peta teknis, untuk ahli |
| **Rupabumi** | peta navigasi + info lokasi (kependudukan, banjir) | Konsumen-kasual, dangkal |

## Temuan kunci — CELAH SafeHouse

Semua pemain di atas punya masalah yang sama:

1. **Terfragmentasi.** InaRISK (banjir), BMKG (gempa), ESDM (geologi/
   likuefaksi) = tiga portal terpisah. Tidak ada yang menyatukan.
2. **Data mentah, bukan workflow.** Menampilkan peta/angka, tapi tidak
   mengubahnya jadi parameter siap-pakai untuk sebuah pekerjaan (mis. PBG).
3. **Untuk ahli atau untuk awam — bukan untuk workflow bisnis.** Portal
   pemerintah terlalu teknis; Rupabumi terlalu dangkal. Tidak ada yang
   melayani konsultan perizinan yang butuh parameter SNI cepat.
4. **Tidak ada perhitungan turunan.** Mereka menampilkan data. Tidak ada
   yang menghitung FS likuefaksi, kelas situs Vs30, PGA desain dari
   koordinat.

**Inilah posisi SafeHouse:** bukan portal data lain, tapi **lapisan
workflow di atas data pemerintah** — menyatukan InaRISK + BMKG/PuSGeN + ESDM,
lalu menghitung parameter SNI 1726:2019 yang benar-benar dibutuhkan untuk
PBG. Tidak ada pesaing langsung di ceruk ini.

## Implikasi untuk kontes

- **Problem Solving (20%):** ketiadaan pesaing langsung = masalah nyata yang
  belum terpecahkan. Nyatakan ini eksplisit ke juri.
- **Business Impact (30%):** "menggantikan 30-60 menit buka lima portal
  jadi 2 menit" — hemat waktu yang bisa dibuktikan karena portal-portal itu
  memang ada dan memang terpisah.
- **Use of Emergent / kedalaman:** engine yang menghitung (bukan sekadar
  menampilkan) adalah kedalaman teknis yang tidak dimiliki portal-portal ini.

## Yang bisa ditiru dari mereka

- **InaRISK/ESDM:** kredibilitas sumber — cantumkan logo/atribusi data resmi.
  Meminjam otoritas mereka.
- **Legend & klasifikasi bahaya lokal** — pakai istilah yang sama dengan
  BNPB/ESDM supaya konsultan langsung kenal.

## Yang membedakan SafeHouse (jangan hilang)

- Penyatuan multi-sumber dalam satu audit
- Perhitungan turunan (FS, Vs30, PGA) — bukan cuma tampil data
- Output workflow-oriented (parameter siap lampir PBG)
- Konteks lokal (Sesar Semangko Lampung, dll)
