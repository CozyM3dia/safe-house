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

// Sumber = ImageServer INDEKS_BAHAYA_* (publik, tanpa token, cepat ~100-300ms).
// Catatan: MapServer/export pada layer_bahaya_* butuh token (error 499), jadi
// dipakai ImageServer/exportImage yang terbuka.
export const INARISK_HAZARDS = [
  {
    key: 'flood',
    label: 'Banjir',
    icon: '🌊',
    serviceUrl: `${INARISK_BASE}/INDEKS_BAHAYA_BANJIR/ImageServer`,
    attribution: ATTRIBUTION,
    legend: HAZARD_LEGEND,
  },
  {
    key: 'landslide',
    label: 'Longsor',
    icon: '🏔️',
    serviceUrl: `${INARISK_BASE}/INDEKS_BAHAYA_TANAHLONGSOR/ImageServer`,
    attribution: ATTRIBUTION,
    legend: HAZARD_LEGEND,
  },
  {
    key: 'earthquake',
    label: 'Gempa',
    icon: '🌋',
    serviceUrl: `${INARISK_BASE}/INDEKS_BAHAYA_GEMPABUMI/ImageServer`,
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

// ArcGIS ImageServer exportImage: PNG32 memberi transparansi via nodata.
export function buildExportUrl(serviceUrl, bbox) {
  const params = new URLSearchParams({
    bboxSR: '3857',
    imageSR: '3857',
    size: '256,256',
    format: 'png32',
    f: 'image',
  });
  return `${serviceUrl}/exportImage?bbox=${bbox}&${params.toString()}`;
}

// ── Rainbow color ramp untuk indeks bahaya (0..1) ─────────────────
// InaRISK ImageServer merender indeks sebagai grayscale (0=hitam, 1=putih).
// Recolor client-side jadi rainbow biar magnitudo jelas: biru = rendah,
// merah = tinggi. Ramp yang sama dipakai raster (LUT) dan legenda peta.
function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

// HSL (h 0..360, s/l 0..1) → [r,g,b] 0..255.
export function hslToRgb(h, s, l) {
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [f(0), f(8), f(4)].map((x) => Math.round(x * 255));
}

// Indeks bahaya 0..1 → warna rainbow (hue 240° biru → 0° merah).
export function indexToRainbow(t) {
  return hslToRgb(240 * (1 - clamp01(t)), 0.85, 0.5);
}

// LUT 256 entri (nilai grayscale 0..255 → [r,g,b]) untuk recolor tile cepat.
export function buildRainbowLut() {
  const lut = new Uint8ClampedArray(256 * 3);
  for (let i = 0; i < 256; i += 1) {
    const [r, g, b] = indexToRainbow(i / 255);
    lut[i * 3] = r;
    lut[i * 3 + 1] = g;
    lut[i * 3 + 2] = b;
  }
  return lut;
}

// Stop legenda (t, label) — sinkron dengan warna raster.
export const HAZARD_RAMP_STOPS = [
  { t: 0, label: 'Rendah' },
  { t: 0.5, label: 'Sedang' },
  { t: 1, label: 'Tinggi' },
];

// CSS linear-gradient dari ramp untuk bar legenda.
export function rainbowGradientCss(steps = 8) {
  const parts = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const [r, g, b] = indexToRainbow(t);
    parts.push(`rgb(${r},${g},${b}) ${Math.round(t * 100)}%`);
  }
  return `linear-gradient(to right, ${parts.join(', ')})`;
}
