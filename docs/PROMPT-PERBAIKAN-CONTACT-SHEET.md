# Prompt Perbaikan Contact Sheet + Data Sampel Kanonik

Hasil audit contact sheet v1: arah visual lolos, tapi ada bug akurasi/legal +
inkonsistensi data antar-layar. Dokumen ini berisi:
- **Bagian A** — data sampel kanonik (kunci sekali, pakai di SEMUA mockup + build)
- **Bagian B** — prompt siap-tempel ke ChatGPT untuk regenerate yang benar

---

## A. DATA SAMPEL KANONIK (jangan diubah lagi)

### Band skor (titik) — makin tinggi makin AMAN
- **70–100 = AMAN** (hijau `#10b981`)
- **40–69 = SEDANG** (amber `#f59e0b`) — "layak dengan catatan"
- **0–39 = WASPADA / RISIKO TINGGI** (merah `#ef4444`)

### Legenda zona peta (beda dari skor — ini tingkat risiko wilayah)
- **Tingkat Risiko: Rendah / Sedang / Tinggi** (Tinggi = merah). Label eksplisit
  "Tingkat Risiko" biar tidak tertukar dengan skor titik.

### 5 bahaya tetap (taksonomi kunci — sama di radar, PDF, battle)
Gempa · Likuefaksi · Banjir · Longsor · Penurunan Lahan

### Lokasi A — Bandar Lampung (contoh utama)
- Koordinat: -5.3971, 105.2668 · Elevasi 93 m
- **S.A.F.E Score: 65 — SEDANG — "layak dengan catatan"**
- Sub-skor (0–100, makin tinggi makin aman):
  Gempa 45 · Likuefaksi 60 · Banjir 55 · Longsor 80 · Penurunan Lahan 85
- Parameter teknis:
  - PGA desain: **0.32 g**
  - Kelas Situs: **SD** · Vs30: **285 m/s** (konsisten: SD = 175–350)
  - FS Likuefaksi: **1.15** (>1 tapi tipis → "waspada", bukan aman penuh)
  - Jarak sesar aktif: **11.8 km** (Sesar Semangko)
  - Curah hujan: **182 mm/bln**
  - Banjir: **SEDANG**

### Lokasi B — Natar (pembanding Battle Mode, LEBIH AMAN di 5 dari 5)
- **S.A.F.E Score: 78 — AMAN**
- PGA: **0.19 g** · Vs30: **586 m/s** (kelas situs SC) · FS Likuefaksi: **1.85**
  · Jarak sesar: **32.4 km** · Banjir: **RENDAH**
- Battle: **"Lokasi B unggul pada 5 dari 5 parameter."**

> Catatan self-consistency: skor SEDANG (65) cocok dgn PGA tinggi (0.32g) +
> FS likuefaksi tipis (1.15). FS TIDAK boleh <1 di lokasi ber-skor SEDANG
> (kalau FS<1 = gagal likuefaksi = skornya harus WASPADA).

### Sumber data (tulis konsisten)
BMKG · PuSGeN · InaRISK BNPB · USGS · BIG · Open-Meteo

### Atribusi peta (WAJIB benar — legal)
- Analysis (Stadia Alidade Smooth): "© Stadia Maps, © OpenMapTiles, © OSM"
- Street (CARTO Positron): "© CARTO, © OSM"
- Satellite (Esri): "© Esri, Maxar, Earthstar"
- **JANGAN tulis "Mapbox"** — tidak dipakai.

---

## B. PROMPT REGENERATE (tempel ke ChatGPT, lampirkan contact sheet v1)

```
Ini contact sheet UI mockup app "S.A.F.E House" (aplikasi audit risiko lahan
geoteknik, Indonesia). Arah visualnya SUDAH BENAR dan HARUS dipertahankan:
warm-dark Mocha (#0f0b08), aksen tembaga #d4956a, panel kaca, enclosure
double-bezel, serif display + angka monospace, logo S.A.F.E House di tiap
layar, nada instrumen presisi yang kredibel (bukan flashy, bukan SaaS generik).
Palet aman #10b981, sedang #f59e0b, bahaya #ef4444.

Regenerate contact sheet yang sama (layar sama, gaya sama, brand sama), TAPI
perbaiki hal berikut:

1. ATRIBUSI PETA: ganti "Mapbox / OpenStreetMap" jadi "© Stadia Maps, ©
   OpenMapTiles, © OpenStreetMap". Jangan ada kata "Mapbox".

2. BAHASA: semua label Bahasa Indonesia. Ganti "Lime-Axis Hazard Radar" jadi
   "Radar Bahaya". Tidak ada jargon Inggris nyelip.

3. SATUKAN DATA — pakai angka kanonik ini di SEMUA layar untuk Bandar Lampung:
   Skor 65 SEDANG "layak dengan catatan"; PGA 0.32 g; Kelas Situs SD; Vs30
   285 m/s; FS Likuefaksi 1.15; Jarak Sesar 11.8 km; Curah hujan 182 mm/bln;
   Banjir SEDANG. Koordinat -5.3971, 105.2668, Elevasi 93 m.

4. BATTLE MODE: Lokasi A = Bandar Lampung (angka di atas). Lokasi B = Natar,
   Skor 78 AMAN; PGA 0.19 g; Vs30 586 m/s; FS Likuefaksi 1.85; Jarak Sesar
   32.4 km; Banjir RENDAH. Teks kesimpulan: "Lokasi B unggul pada 5 dari 5
   parameter" (bukan 4 dari 5). Highlight Lokasi B sebagai LEBIH AMAN.

5. 5 BAHAYA TETAP di radar DAN di laporan PDF, sama persis: Gempa, Likuefaksi,
   Banjir, Longsor, Penurunan Lahan. (Hapus "Lingkungan" — samakan jadi
   "Penurunan Lahan".)

6. SKALA SKOR SEragam: makin tinggi makin aman. Band: 70–100 AMAN hijau,
   40–69 SEDANG amber, 0–39 WASPADA merah. Sub-skor per bahaya juga 0–100
   makin tinggi makin aman.

7. LEGENDA PETA: beri label "Tingkat Risiko" pada legenda Rendah/Sedang/Tinggi
   supaya tidak tertukar dengan skor titik.

8. KONTRAS: naikkan sedikit keterbacaan angka monospace kecil dan timestamp
   (jangan terlalu redup di latar gelap).

9. Pertahankan: sumber data terlihat (BMKG, PuSGeN, InaRISK, USGS, BIG,
   Open-Meteo), disclaimer desk-study, hero score dominan, dan logo di tiap
   layar.

Jaga semua layar dalam satu contact sheet, konsisten satu sama lain.
```
