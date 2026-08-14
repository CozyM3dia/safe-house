# Analisis UI — Rupabumi

**URL:** https://rupabumi.com/
**Tanggal:** 14 Agustus 2026
**Konteks:** riset referensi UI SafeHouse (peta + skor analitik) untuk audiens B2B konsultan PBG.

---

## Apa itu Rupabumi

Aplikasi peta navigasi + data lokasi Indonesia. Produk utama: peta dengan
info lokasi (kependudukan BPS + risiko banjir/peta banjir BNPB). Ada tool
sampingan terpisah: pengecek ranking bisnis di Google Maps (grid-based),
atlas sejarah "Atlas Hindia Belanda", newsroom.

Model: konsumen-kasual, dangkal (kependudukan + banjir saja), berbahasa
Indonesia lugas.

## Interaksi inti

Klik-kanan / tap-tahan sebuah titik di peta → menu kontekstual
"Informasi/analisis lokasi" → tampil data kependudukan + risiko banjir.
Analisis muncul di atas peta, bukan lewat panel yang selalu nempel.

Search "Temukan tempat" di atas. Readout koordinat + elevasi live saat
kursor bergerak ("0 / 0.0m").

---

## Yang layak ditiru

| # | Pola | Kenapa berharga untuk SafeHouse |
|---|---|---|
| 1 | **Analisis kontekstual di atas peta** (klik-kanan/tap-tahan → analisis) | SafeHouse sekarang panel 380px selalu nempel. Rupabumi bikin peta bersih dulu, analisis muncul saat diminta — lebih lega, terasa native seperti Google Maps |
| 2 | **Peta-first, chrome tipis** | Peta dominan, nav atas tipis. Panel besar tidak menutupi peta terus-terusan |
| 3 | **Grammar interaksi ala Google Maps** | Search + tap + klik-kanan. Zero learning curve karena meniru pola yang sudah dikenal semua orang |
| 4 | **Readout koordinat + elevasi live** | Murah, tapi memberi kesan instrumen presisi — cocok dengan vibe B2B/engineering |
| 5 | **Bahasa Indonesia lugas + data otoritas lokal** (BPS, BNPB) | Kredibilitas sumber lokal, angle yang sama dengan SafeHouse |

## Yang JANGAN ditiru

- **Nada konsumen-kasual.** Audiens SafeHouse = konsultan perizinan teknis.
  Ambil pola interaksinya, pertahankan framing profesional.
- **Kedangkalan data.** Rupabumi cuma kependudukan + banjir. Kekuatan
  SafeHouse justru kedalaman: FS likuefaksi, PGA, kelas situs SNI, laporan
  siap-lampir. Jangan turunkan itu.
- **Banyak tool tercerai.** Kontes menghargai satu workflow yang tajam,
  bukan banyak fitur.

## Satu curian utama

**Peta-first + trigger analisis kontekstual di titik** (klik-kanan/tap-tahan
→ analisis), menggantikan panel 380px yang selalu nempel. Panel penuh-parameter
muncul saat konsultan benar-benar butuh, bukan berteriak terus. Ditambah
readout koordinat+elevasi live untuk kesan presisi.

## Implikasi ke SafeHouse

- Pertimbangkan panel on-demand (muncul setelah titik dipilih), bukan panel
  permanen — beri peta ruang bernapas
- Tambah context menu / long-press sebagai jalur trigger audit selain klik biasa
- Tambah readout koordinat + elevasi live di pojok peta
