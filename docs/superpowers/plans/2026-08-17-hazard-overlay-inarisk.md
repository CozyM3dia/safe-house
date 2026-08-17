# Overlay Bahaya Nasional (InaRISK) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render 3 overlay raster bahaya nasional (banjir, longsor, gempabumi) dari InaRISK BNPB di peta audit, display-only, dengan toggle + legenda.

**Architecture:** Custom `L.TileLayer` subclass yang membangun URL ArcGIS dynamic-export per-tile (bbox EPSG:3857). Dikendalikan store `overlays` yang sudah ada. Config hazard terpusat di `lib/hazardOverlay.js` (dipakai overlay, panel, legenda). Zero dependency baru; image di-load lewat `<img>` sehingga bebas CORS.

**Tech Stack:** React 19, react-leaflet 5, Leaflet 1.9, Zustand, node:test.

## Global Constraints

- **Zero dependency baru** — tidak menambah paket npm apa pun.
- **Display-only** — TIDAK mengubah score, FS likuefaksi, Vs30, PGA, kelas situs/bahaya. Tidak menyentuh file `backend/`.
- **Reuse store keys** — `overlays.flood`, `overlays.landslide`, `overlays.earthquake` + `overlayOpacities[key]` + aksi `toggleOverlay(key)`. Jangan tambah state overlay baru.
- **Copy Bahasa Indonesia**, istilah SNI baku ("likuefaksi").
- **Atribusi wajib** — setiap layer mencantumkan `Sumber bahaya: InaRISK BNPB`.
- **Default OFF** — semua overlay hazard mati saat load.
- Service URL verbatim:
  - flood → `https://gis.bnpb.go.id/server/rest/services/inarisk/layer_bahaya_banjir/MapServer`
  - landslide → `https://gis.bnpb.go.id/server/rest/services/inarisk/layer_bahaya_tanah_longsor/MapServer`
  - earthquake → `https://gis.bnpb.go.id/server/rest/services/inarisk/layer_bahaya_gempabumi/MapServer`

---

## File Structure

| File | Tanggung jawab | Aksi |
|------|----------------|------|
| `frontend/src/lib/hazardOverlay.js` | Config `INARISK_HAZARDS` + pure fn tile→bbox3857 + builder URL + factory layer | Create |
| `frontend/test_hazard_overlay.test.mjs` | Unit test config + math + URL | Create |
| `frontend/src/components/map/NationwideOverlays.jsx` | Mount/unmount custom layer per key aktif | Modify (ganti `return null`) |
| `frontend/src/components/map/DisasterLayersPanel.jsx` | 3 toggle hazard + counter "N aktif" | Modify |
| `frontend/src/components/map/MapLegend.jsx` | Blok legenda landslide + earthquake | Modify |

---

### Task 1: Lib hazardOverlay — config, math bbox, URL builder

**Files:**
- Create: `frontend/src/lib/hazardOverlay.js`
- Test: `frontend/test_hazard_overlay.test.mjs`

**Interfaces:**
- Produces:
  - `INARISK_HAZARDS: Array<{ key:'flood'|'landslide'|'earthquake', label:string, icon:string, serviceUrl:string, attribution:string, legend:Array<{level:string,hex:string}> }>`
  - `tileToBbox3857({x:number,y:number,z:number}): string` → `"xmin,ymin,xmax,ymax"` (meter EPSG:3857)
  - `buildExportUrl(serviceUrl:string, bbox:string): string`

- [ ] **Step 1: Write failing test**

Create `frontend/test_hazard_overlay.test.mjs`:

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  INARISK_HAZARDS,
  tileToBbox3857,
  buildExportUrl,
} from './src/lib/hazardOverlay.js';

test('config covers exactly banjir, longsor, gempa with official services', () => {
  assert.equal(INARISK_HAZARDS.length, 3);
  const byKey = Object.fromEntries(INARISK_HAZARDS.map((h) => [h.key, h]));
  assert.ok(byKey.flood && byKey.landslide && byKey.earthquake);
  assert.match(byKey.flood.serviceUrl, /inarisk\/layer_bahaya_banjir\/MapServer$/);
  assert.match(byKey.landslide.serviceUrl, /inarisk\/layer_bahaya_tanah_longsor\/MapServer$/);
  assert.match(byKey.earthquake.serviceUrl, /inarisk\/layer_bahaya_gempabumi\/MapServer$/);
  for (const h of INARISK_HAZARDS) {
    assert.match(h.attribution, /InaRISK BNPB/);
    assert.ok(h.legend.length >= 3); // Rendah/Sedang/Tinggi
    assert.ok(h.label && h.icon);
  }
});

test('tileToBbox3857 maps the world tile (0,0,0) to full web-mercator extent', () => {
  const bbox = tileToBbox3857({ x: 0, y: 0, z: 0 }).split(',').map(Number);
  const R = 20037508.342789244; // half web-mercator span
  const [xmin, ymin, xmax, ymax] = bbox;
  assert.ok(Math.abs(xmin - -R) < 1);
  assert.ok(Math.abs(xmax - R) < 1);
  assert.ok(Math.abs(ymax - R) < 1);
  assert.ok(Math.abs(ymin - -R) < 1);
});

test('tileToBbox3857 keeps ordering xmin<xmax and ymin<ymax for an inner tile', () => {
  const [xmin, ymin, xmax, ymax] = tileToBbox3857({ x: 27, y: 33, z: 6 }).split(',').map(Number);
  assert.ok(xmin < xmax);
  assert.ok(ymin < ymax);
});

test('buildExportUrl requests transparent png in 3857', () => {
  const url = buildExportUrl('https://svc/MapServer', '1,2,3,4');
  assert.match(url, /\/export\?/);
  assert.match(url, /bbox=1,2,3,4/);
  assert.match(url, /bboxSR=3857/);
  assert.match(url, /imageSR=3857/);
  assert.match(url, /transparent=true/);
  assert.match(url, /f=image/);
});
```

- [ ] **Step 2: Run test, verify fail**

Run: `cd frontend && node --test test_hazard_overlay.test.mjs`
Expected: FAIL — `Cannot find module './src/lib/hazardOverlay.js'`

- [ ] **Step 3: Implement lib**

Create `frontend/src/lib/hazardOverlay.js`:

```javascript
// Overlay bahaya nasional dari InaRISK BNPB. Display-only: layer ini hanya
// konteks visual regional dan TIDAK memengaruhi skor/FS/Vs30/PGA audit.
const INARISK_BASE = 'https://gis.bnpb.go.id/server/rest/services/inarisk';

// Skema indeks bahaya InaRISK: Rendah (hijau) → Sedang (kuning) → Tinggi (merah).
const HAZARD_LEGEND = [
  { level: 'Rendah', hex: '#22c55e' },
  { level: 'Sedang', hex: '#eab308' },
  { level: 'Tinggi', hex: '#ef4444' },
];

const ATTRIBUTION = 'Sumber bahaya: InaRISK BNPB';

export const INARISK_HAZARDS = [
  {
    key: 'flood',
    label: 'Banjir',
    icon: '🌊',
    serviceUrl: `${INARISK_BASE}/layer_bahaya_banjir/MapServer`,
    attribution: ATTRIBUTION,
    legend: HAZARD_LEGEND,
  },
  {
    key: 'landslide',
    label: 'Longsor',
    icon: '🏔️',
    serviceUrl: `${INARISK_BASE}/layer_bahaya_tanah_longsor/MapServer`,
    attribution: ATTRIBUTION,
    legend: HAZARD_LEGEND,
  },
  {
    key: 'earthquake',
    label: 'Gempa',
    icon: '🌋',
    serviceUrl: `${INARISK_BASE}/layer_bahaya_gempabumi/MapServer`,
    attribution: ATTRIBUTION,
    legend: HAZARD_LEGEND,
  },
];

const R = 6378137; // radius bola web-mercator (EPSG:3857)
const HALF = Math.PI * R; // 20037508.342789244

// Sudut tile XYZ → lon/lat (deg) sudut barat-laut tile.
function tileNW(x, y, z) {
  const n = 2 ** z;
  const lon = (x / n) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
  return { lon, lat: (latRad * 180) / Math.PI };
}

// lon/lat (deg) → meter EPSG:3857.
function project(lon, lat) {
  const x = (lon * Math.PI * R) / 180;
  const latRad = (lat * Math.PI) / 180;
  const y = R * Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  return { x, y };
}

// {x,y,z} → "xmin,ymin,xmax,ymax" dalam meter 3857 (dibulatkan ke ±HALF di tepi).
export function tileToBbox3857({ x, y, z }) {
  const nw = tileNW(x, y, z);
  const se = tileNW(x + 1, y + 1, z);
  const pnw = project(nw.lon, nw.lat);
  const pse = project(se.lon, se.lat);
  const clamp = (v) => Math.max(-HALF, Math.min(HALF, v));
  const xmin = clamp(pnw.x);
  const xmax = clamp(pse.x);
  const ymin = clamp(pse.y);
  const ymax = clamp(pnw.y);
  return `${xmin},${ymin},${xmax},${ymax}`;
}

export function buildExportUrl(serviceUrl, bbox) {
  const params = new URLSearchParams({
    bbox,
    bboxSR: '3857',
    imageSR: '3857',
    size: '256,256',
    dpi: '96',
    format: 'png32',
    transparent: 'true',
    f: 'image',
  });
  return `${serviceUrl}/export?${params.toString()}`;
}
```

- [ ] **Step 4: Run test, verify pass**

Run: `cd frontend && node --test test_hazard_overlay.test.mjs`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/hazardOverlay.js frontend/test_hazard_overlay.test.mjs
git commit -m "feat: config + geo math overlay bahaya InaRISK (banjir/longsor/gempa)"
```

---

### Task 2: Custom Leaflet layer factory + render di NationwideOverlays

**Files:**
- Modify: `frontend/src/lib/hazardOverlay.js` (tambah `createInariskLayer`)
- Modify: `frontend/src/components/map/NationwideOverlays.jsx` (ganti `return null`)

**Interfaces:**
- Consumes: `INARISK_HAZARDS`, `tileToBbox3857`, `buildExportUrl` (Task 1); store `overlays`, `overlayOpacities`; react-leaflet `useMap`.
- Produces: `createInariskLayer(cfg, opacity): L.TileLayer` — instance layer siap `map.addLayer`.

> Catatan: `createInariskLayer` butuh `L` runtime (Leaflet), jadi tidak diunit-test; ia hanya merangkai fn murni Task 1 yang sudah teruji. Verifikasi lewat build + manual (Task 5).

- [ ] **Step 1: Tambah factory ke lib**

Tambahkan di akhir `frontend/src/lib/hazardOverlay.js`:

```javascript
import L from 'leaflet';

// L.TileLayer yang membangun URL dynamic-export ArcGIS per tile.
const InariskTileLayer = L.TileLayer.extend({
  initialize(cfg, options) {
    this._cfg = cfg;
    L.TileLayer.prototype.initialize.call(this, '', options);
  },
  getTileUrl(coords) {
    const bbox = tileToBbox3857({ x: coords.x, y: coords.y, z: coords.z });
    return buildExportUrl(this._cfg.serviceUrl, bbox);
  },
});

export function createInariskLayer(cfg, opacity) {
  return new InariskTileLayer(cfg, {
    opacity,
    attribution: cfg.attribution,
    crossOrigin: false,
    zIndex: 350, // di bawah faults (pane z 430) & marker
    className: `inarisk-overlay inarisk-${cfg.key}`,
  });
}
```

- [ ] **Step 2: Render di NationwideOverlays**

Ganti seluruh isi `frontend/src/components/map/NationwideOverlays.jsx`:

```javascript
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { useAppStore } from '../../store/useAppStore';
import { INARISK_HAZARDS, createInariskLayer } from '../../lib/hazardOverlay';

/**
 * Overlay bahaya nasional InaRISK BNPB (banjir, longsor, gempa).
 * Display-only: raster resmi sebagai konteks regional. TIDAK memengaruhi
 * skor/FS/Vs30/PGA audit. Default semua OFF; gagal-muat diam-diam.
 */
function HazardLayer({ cfg }) {
  const map = useMap();
  const enabled = useAppStore((s) => s.overlays[cfg.key]);
  const opacity = useAppStore((s) => s.overlayOpacities[cfg.key] ?? 0.65);

  useEffect(() => {
    if (!enabled) return undefined;
    const layer = createInariskLayer(cfg, opacity);
    layer.addTo(map);
    return () => {
      map.removeLayer(layer);
    };
  }, [map, cfg, enabled, opacity]);

  return null;
}

export function NationwideOverlays() {
  return (
    <>
      {INARISK_HAZARDS.map((cfg) => (
        <HazardLayer key={cfg.key} cfg={cfg} />
      ))}
    </>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `cd frontend && npm run build`
Expected: build sukses, tanpa error import.

- [ ] **Step 4: Verify unit test lib masih pass**

Run: `cd frontend && node --test test_hazard_overlay.test.mjs`
Expected: PASS (import `leaflet` di lib tidak memecah test — hanya `createInariskLayer` yang pakai L; jika runner gagal resolve `leaflet`, pindahkan `import L` tetap di top — Vite/node resolve dari node_modules). Jika node --test gagal resolve `leaflet`, jalankan dari `frontend/` agar `node_modules` terjangkau.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/hazardOverlay.js frontend/src/components/map/NationwideOverlays.jsx
git commit -m "feat: render overlay raster InaRISK via custom Leaflet tile layer"
```

---

### Task 3: Toggle UI 3 hazard + counter di DisasterLayersPanel

**Files:**
- Modify: `frontend/src/components/map/DisasterLayersPanel.jsx`

**Interfaces:**
- Consumes: `INARISK_HAZARDS` (Task 1); store `overlays`, `toggleOverlay`.

- [ ] **Step 1: Import config + hitung counter**

Di `DisasterLayersPanel.jsx`, tambah import:

```javascript
import { INARISK_HAZARDS } from '../../lib/hazardOverlay';
```

Ganti badge "1 aktif" (baris ~44-48, blok `{overlays.faults && (...)}`) agar menghitung semua overlay aktif:

```javascript
{(() => {
  const activeCount =
    (overlays.faults ? 1 : 0) +
    INARISK_HAZARDS.filter((h) => overlays[h.key]).length;
  return activeCount > 0 ? (
    <span className="rounded-md border border-accent/30 bg-accent/10 px-1.5 py-1 text-[8px] font-bold uppercase tracking-wider text-accent">
      {activeCount} aktif
    </span>
  ) : null;
})()}
```

- [ ] **Step 2: Tambah section "Layer bahaya"**

Sisipkan sebelum blok `{/* Reference geohazard layers */}` (baris ~76), section baru:

```jsx
{/* Nationwide hazard rasters */}
<div className="mt-4 border-t border-white/8 pt-3">
  <div className="mb-2 flex items-center justify-between">
    <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-text-muted">
      Layer bahaya
    </span>
    <span className="text-[8px] font-mono text-text-muted">InaRISK BNPB</span>
  </div>
  <div className="flex flex-col gap-1.5">
    {INARISK_HAZARDS.map((h) => {
      const active = overlays[h.key];
      return (
        <button
          key={h.key}
          type="button"
          aria-pressed={active}
          onClick={() => toggleOverlay(h.key)}
          className={cn(
            'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors',
            active
              ? 'border-accent/45 bg-accent/10'
              : 'border-white/6 bg-white/[0.02] hover:border-white/14 hover:bg-white/[0.04]'
          )}
        >
          <span className={cn(
            'flex h-7 w-7 items-center justify-center rounded-lg border text-sm',
            active
              ? 'border-accent/35 bg-accent/12'
              : 'border-white/8 bg-white/[0.03]'
          )}>
            {h.icon}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-bold text-text-primary">{h.label}</span>
            <span className="mt-0.5 block text-[8px] leading-relaxed text-text-muted">
              Peta bahaya {h.label.toLowerCase()} nasional
            </span>
          </span>
          <span className={cn(
            'rounded-md border px-1.5 py-0.5 text-[8px] font-bold tracking-wider',
            active ? 'border-accent/35 text-accent' : 'border-white/8 text-text-muted'
          )}>
            {active ? 'ON' : 'OFF'}
          </span>
        </button>
      );
    })}
  </div>
</div>
```

- [ ] **Step 3: Verify build + lint**

Run: `cd frontend && npm run build`
Expected: sukses, tanpa unused var / error JSX.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/map/DisasterLayersPanel.jsx
git commit -m "feat: toggle 3 layer bahaya InaRISK + counter overlay aktif"
```

---

### Task 4: Legenda landslide + earthquake di MapLegend

**Files:**
- Modify: `frontend/src/components/map/MapLegend.jsx`

**Interfaces:**
- Consumes: store `overlays`.

- [ ] **Step 1: Perluas kondisi aktif**

Di `MapLegend.jsx`, tambah dua flag setelah `showFloodLegend`:

```javascript
const showLandslideLegend = overlays.landslide;
const showEarthquakeLegend = overlays.earthquake;
```

Ubah `anyActive`:

```javascript
const anyActive =
  showFloodLegend || showLandslideLegend || showEarthquakeLegend ||
  showLandCoverLegend || showFaultLegend;
```

- [ ] **Step 2: Tambah blok legenda (setelah blok flood)**

Sisipkan setelah blok `{showFloodLegend && (...)}`:

```jsx
{showLandslideLegend && (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-center gap-1">
      <span className="text-[11px] leading-none">🏔️</span>
      <span className="text-[10px] font-bold text-text-primary">Bahaya Longsor</span>
    </div>
    <div className="grid grid-cols-3 gap-1 pt-1">
      {[['Rendah','bg-green-500'],['Sedang','bg-yellow-500'],['Tinggi','bg-red-500']].map(([label,clr]) => (
        <div key={label} className="flex flex-col items-center gap-1 rounded bg-white/[0.02] border border-white/5 py-1">
          <div className={cn('w-2 h-2 rounded', clr)} />
          <span className="text-[8px] font-bold text-text-secondary">{label}</span>
        </div>
      ))}
    </div>
  </div>
)}

{showEarthquakeLegend && (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-center gap-1">
      <span className="text-[11px] leading-none">🌋</span>
      <span className="text-[10px] font-bold text-text-primary">Bahaya Gempa</span>
    </div>
    <div className="grid grid-cols-3 gap-1 pt-1">
      {[['Rendah','bg-green-500'],['Sedang','bg-yellow-500'],['Tinggi','bg-red-500']].map(([label,clr]) => (
        <div key={label} className="flex flex-col items-center gap-1 rounded bg-white/[0.02] border border-white/5 py-1">
          <div className={cn('w-2 h-2 rounded', clr)} />
          <span className="text-[8px] font-bold text-text-secondary">{label}</span>
        </div>
      ))}
    </div>
  </div>
)}

{/* Atribusi sumber hazard */}
{(showFloodLegend || showLandslideLegend || showEarthquakeLegend) && (
  <p className="text-[7px] leading-relaxed text-text-muted">Sumber: InaRISK BNPB</p>
)}
```

- [ ] **Step 3: Verify build**

Run: `cd frontend && npm run build`
Expected: sukses.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/map/MapLegend.jsx
git commit -m "feat: legenda + atribusi overlay bahaya longsor & gempa"
```

---

### Task 5: Verifikasi terintegrasi (manual + guard engine)

**Files:** none (verifikasi).

- [ ] **Step 1: Guard — engine tidak tersentuh**

Run: `cd "C:/Kuliah/Vibe Coding/S.A.F.E House" && git diff --name-only main...HEAD -- backend/`
Expected: OUTPUT KOSONG (tidak ada file backend berubah di branch).

- [ ] **Step 2: Full build + semua unit test frontend**

Run: `cd frontend && npm run build && node --test test_hazard_overlay.test.mjs test_fault_overlay.test.mjs`
Expected: build sukses; semua test PASS.

- [ ] **Step 3: Manual di preview**

Jalankan dev server (`preview_start name` sesuai `.claude/launch.json`, atau `npm run dev`), lalu di Browser pane:
1. Buka panel "Tampilan Peta" (tombol Layers kanan-atas).
2. Toggle **Banjir** ON → raster hijau/kuning/merah muncul di atas Indonesia; badge "1 aktif"; legenda banjir + "Sumber: InaRISK BNPB" muncul (kiri-bawah).
3. Toggle **Longsor** + **Gempa** ON → tiga raster stack transparan; badge "3 aktif".
4. Klik satu titik di darat → audit tetap jalan (skor muncul), overlay tidak mengganggu.
5. Toggle semua OFF → raster hilang; legenda hilang.
6. Cek `read_console_messages` → tidak ada error JS (image 404 tile di laut wajar, diabaikan).

- [ ] **Step 4: Screenshot bukti**

`computer {action:"screenshot"}` dengan 3 layer aktif → lampirkan ke user.

- [ ] **Step 5: Commit catatan verifikasi (opsional) + siap PR**

Tidak ada perubahan kode. Branch siap dibuka PR ke `main` (squash).

---

## Self-Review

**Spec coverage:**
- §5 sumber data → Task 1 (`INARISK_HAZARDS`, URL verbatim) ✓
- §6 custom tile layer / bbox 3857 → Task 1 (math) + Task 2 (factory+render) ✓
- §7.1 panel toggle + counter → Task 3 ✓
- §7.2 legenda landslide+earthquake → Task 4 ✓
- §7.3 constants config → Task 1 (`INARISK_HAZARDS` di `lib/hazardOverlay.js`, bukan `constants.js` — konsolidasi dengan math/factory dalam satu unit; keputusan sadar, lebih kohesif) ✓
- §2/§9 engine tak tersentuh + atribusi + default OFF → Task 5 guard, Task 2 default, Task 4 atribusi ✓
- §9 unit test bbox → Task 1 ✓

**Placeholder scan:** tidak ada TBD/TODO; semua step berisi kode nyata. ✓

**Type consistency:** `INARISK_HAZARDS` item shape (`key/label/icon/serviceUrl/attribution/legend`) konsisten Task 1↔3↔4; `tileToBbox3857({x,y,z})→string`, `buildExportUrl(serviceUrl,bbox)→string`, `createInariskLayer(cfg,opacity)→L.TileLayer` konsisten Task 1↔2. ✓

**Catatan deviasi spec:** config ditaruh di `lib/hazardOverlay.js` (bukan `constants.js` seperti §7.3) agar config+math+factory satu unit kohesif. Fungsional setara.
