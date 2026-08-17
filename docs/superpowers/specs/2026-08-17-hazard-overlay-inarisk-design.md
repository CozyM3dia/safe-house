# Spec — Overlay Bahaya Nasional (InaRISK BNPB)

**Tanggal:** 2026-08-17
**Status:** Disetujui (design), siap plan
**Skala:** Fitur display-only, ~4 file frontend, zero dependency baru

## 1. Tujuan

Tambah overlay peta bahaya nasional Indonesia (banjir, longsor, gempabumi) di
peta audit (`/app`), bersumber dari data resmi BNPB InaRISK. Overlay memberi
konteks visual regional yang menguatkan kredibilitas skor audit per-koordinat.

Menggantikan defect kredibilitas lama: `NationwideOverlays.jsx` sebelumnya
me-render gradient/point palsu yang "tampak seperti peta hazard resmi" tanpa
data otoritatif, sehingga sengaja di-disable (`return null`). Spec ini
menggantinya dengan raster resmi BNPB.

## 2. Batasan non-negosiasi (aturan CLAUDE.md)

- **Display-only.** Overlay TIDAK PERNAH mengubah score, FS likuefaksi, Vs30,
  PGA, kelas situs, kelas bahaya. Engine (`backend/services/geotech.py`) tidak
  disentuh. Overlay ≠ angka audit.
- **Sumber resmi + atribusi.** Setiap layer mencantumkan "Sumber bahaya:
  InaRISK BNPB". Tidak boleh ada visual buatan yang menyerupai data resmi.
- **Copy Bahasa Indonesia.** Istilah SNI baku ("likuefaksi").
- **Kunci API:** tidak ada. InaRISK publik, tanpa kunci.

## 3. Scope

**Termasuk:** 3 layer raster — Banjir, Longsor (gerakan tanah), Gempabumi.

**TIDAK termasuk (YAGNI):** likuefaksi, tsunami, cuaca, RTRW, ZNT, tutupan
lahan, populasi (key-nya ada di store tapi di luar scope ini); opacity slider
UI; time-series; self-host/reproject tile via QGIS.

## 4. Kondisi codebase saat ini (sudah ada — REUSE, jangan bangun ulang)

- `store/useAppStore.js` — `overlays {flood, landslide, earthquake, ...}` +
  `overlayOpacities {...}` (default 0.65) + aksi `toggleOverlay(key)` /
  `setOverlayOpacity(key,val)`. **Reuse key `flood`, `landslide`, `earthquake`.**
- `components/map/FaultOverlay.jsx` — pola konsumsi InaRISK (vector GeoJSON via
  browser `fetch`). **Membuktikan CORS `gis.bnpb.go.id` jalan di browser.**
  Hazard = raster, jadi pola render beda (lihat §6), tapi host sama.
- `components/map/DisasterLayersPanel.jsx` — punya base-map picker + tombol
  toggle `faults` + legenda inline. **Tombol faults = template gaya UI.**
- `components/map/MapLegend.jsx` — blok legenda `flood` sudah ada.
- `components/map/MapArea.jsx` — sudah mount `<NationwideOverlays/>` +
  `<FaultOverlay/>`.

**Yang belum ada:** `NationwideOverlays.jsx` masih `return null` → raster hazard
belum di-render; belum ada toggle banjir/longsor/gempa di panel; belum ada blok
legenda landslide + earthquake.

## 5. Sumber data (terverifikasi live, HTTP 200)

ArcGIS REST MapServer, `singleFusedMapCache:false` (dynamic export), wkid 3395:

| Store key   | Service URL |
|-------------|-------------|
| `flood`     | `https://gis.bnpb.go.id/server/rest/services/inarisk/layer_bahaya_banjir/MapServer` |
| `landslide` | `https://gis.bnpb.go.id/server/rest/services/inarisk/layer_bahaya_tanah_longsor/MapServer` |
| `earthquake`| `https://gis.bnpb.go.id/server/rest/services/inarisk/layer_bahaya_gempabumi/MapServer` |

Index bahaya dirender server hijau→kuning→merah (Rendah/Sedang/Tinggi).

## 6. Pendekatan teknis — zero-dep custom tile layer

react-leaflet tidak punya komponen raster-export ArcGIS. Faults pakai
`<GeoJSON>` (vector) — tidak berlaku untuk raster. Pilihan yang diambil:
**custom Leaflet TileLayer, tanpa dependency baru** (bukan esri-leaflet).

Alasan: image di-load lewat `<img>` → tidak kena CORS sama sekali; tanpa
menambah surface dependency menjelang deadline; ~40 baris.

### 6.1 URL export per-tile

```
{serviceUrl}/export?bbox={xmin},{ymin},{xmax},{ymax}
  &bboxSR=3857&imageSR=3857&size=256,256&dpi=96
  &format=png32&transparent=true&f=image
```

Server reproject 3395→3857 via `imageSR`.

### 6.2 Layer

`L.TileLayer` subclass override `getTileUrl(coords)`:
- Hitung bounds tile dari `coords` (Leaflet `_tileCoordsToNwSe` / hitung
  latlng NW & SE dari `coords.x/y/z`).
- Proyeksi ke meter 3857: `L.CRS.EPSG3857.project(latlng)`.
- Susun `bbox = xmin(W),ymin(S),xmax(E),ymax(N)`.
- Opsi layer: `opacity` (dari `overlayOpacities[key]`), `attribution:
  'Sumber bahaya: InaRISK BNPB'`, `pane` overlay default (z < faults 430 →
  raster di bawah garis sesar & marker).

Fungsi hitung-bbox = **pure function**, diekspor untuk unit test.

### 6.3 Komponen React

`NationwideOverlays.jsx`:
- `useMap()` + baca `overlays` & `overlayOpacities` dari store.
- Untuk tiap key aktif (`flood`/`landslide`/`earthquake`): `useEffect`
  add custom layer ke map; cleanup remove. Deps `[enabled, opacity]`.
- Beberapa hazard aktif = stack (PNG transparan).
- Service down / tile error → `<img>` gagal diam-diam; audit tidak terpengaruh.

## 7. Perubahan UI

### 7.1 `DisasterLayersPanel.jsx`
- Section baru "Layer bahaya" (di atas/bawah "Layer referensi").
- 3 tombol toggle (Banjir 🌊, Longsor 🏔️, Gempa 🌋) — **salin gaya tombol
  faults** (border aktif, badge ON/OFF, ikon).
- Badge "N aktif" di header: hitung SEMUA overlay aktif (kini hanya faults).

### 7.2 `MapLegend.jsx`
- Tambah blok legenda `landslide` + `earthquake` (skema Rendah/Sedang/Tinggi
  hijau-kuning-merah, mirror blok `flood` yang sudah ada).
- Divider antar blok aktif.

### 7.3 `constants.js`
- `INARISK_HAZARDS`: array config `{ key, label, serviceUrl, icon,
  legendColors, attribution }` untuk 3 hazard. Dipakai overlay + panel + legend
  (satu sumber kebenaran).

## 8. Arsitektur & isolasi

| Unit | Tugas | Depend |
|------|-------|--------|
| `lib/hazardOverlay.js` | Config `INARISK_HAZARDS` + pure fn bbox + factory `createInariskLayer(cfg,opacity)` | Leaflet CRS |
| `NationwideOverlays.jsx` | Mount/unmount layer per key aktif | store, hazardOverlay, useMap |
| `DisasterLayersPanel.jsx` | Toggle UI | store |
| `MapLegend.jsx` | Legenda | store |

`lib/hazardOverlay.js` bisa dites tanpa React/DOM (bbox fn pure).

## 9. Testing

- **Unit** (`frontend/test_hazard_overlay.test.mjs`, ala
  `test_fault_overlay.test.mjs`): bbox fn — tile coords → bbox 3857 benar;
  URL export terbentuk benar; config 3 hazard lengkap.
- **Manual:** toggle tiap layer → raster muncul di atas Indonesia; multi-layer
  stack; matikan → hilang; klik audit tetap jalan (engine tak terpengaruh);
  atribusi muncul; `npm run build` pass.

## 10. Risiko & mitigasi

| Risiko | Mitigasi |
|--------|----------|
| Service BNPB down | Tile `<img>` gagal diam; audit jalan; default semua OFF |
| Export lambat saat zoom-out nasional | On-demand (default OFF), user toggle sadar |
| wkid 3395 ≠ 3857 Leaflet | `imageSR=3857` param, server reproject |
| Overlay dikira angka audit | Legenda + atribusi eksplisit "peta bahaya regional", display-only |

## 11. Kriteria sukses

- [ ] 3 toggle hazard berfungsi, raster resmi muncul di peta
- [ ] Atribusi InaRISK BNPB tampil
- [ ] Legenda per layer aktif
- [ ] Engine/score/FS/Vs30/PGA tidak berubah (grep diff backend = kosong)
- [ ] `npm run build` pass, unit test bbox pass
- [ ] Zero dependency baru
