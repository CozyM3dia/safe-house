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

// Beberapa katalog raster BNPB yang paling baru kadang menerima permintaan
// metadata tetapi tidak pernah menyelesaikan exportImage. Tetap pertahankan
// URL kanonis untuk provenance, lalu gunakan katalog ImageServer BNPB yang
// responsif sebagai jalur render online utama.
const SERVICE = (name) => `${INARISK_BASE}/${name}/ImageServer`;

// Sumber = ImageServer publik tanpa token. Kandidat pertama dipilih dari
// katalog resmi BNPB yang teruji responsif; serviceUrl tetap menjadi URL
// kanonis untuk provenance dan kandidat cadangan bila service utama pulih.
export const INARISK_HAZARDS = [
  {
    key: 'flood',
    label: 'Banjir',
    labelKey: 'panel.hazard.flood',
    descriptionKey: 'panel.hazard.floodDescription',
    icon: '🌊',
    serviceUrl: SERVICE('INDEKS_BAHAYA_BANJIR'),
    serviceCandidates: [
      { url: SERVICE('layer_bahaya_banjir'), source: 'official' },
    ],
    attribution: ATTRIBUTION,
    legend: HAZARD_LEGEND,
  },
  {
    key: 'landslide',
    label: 'Longsor',
    labelKey: 'panel.hazard.landslide',
    descriptionKey: 'panel.hazard.landslideDescription',
    icon: '🏔️',
    serviceUrl: SERVICE('INDEKS_BAHAYA_TANAHLONGSOR'),
    serviceCandidates: [
      { url: SERVICE('layer_bahaya_tanah_longsor'), source: 'official' },
    ],
    attribution: ATTRIBUTION,
    legend: HAZARD_LEGEND,
  },
  {
    key: 'earthquake',
    label: 'Gempa',
    labelKey: 'panel.hazard.earthquake',
    descriptionKey: 'panel.hazard.earthquakeDescription',
    icon: '🌋',
    serviceUrl: SERVICE('INDEKS_BAHAYA_GEMPABUMI'),
    serviceCandidates: [
      { url: SERVICE('layer_bahaya_gempabumi'), source: 'official' },
      { url: SERVICE('IDX_H_EQ_GLOBAL'), source: 'fallback' },
    ],
    fallbackDescriptionKey: 'panel.hazard.earthquakeFallbackDescription',
    fallbackLegendKey: 'panel.hazard.earthquakeFallbackLegend',
    attribution: ATTRIBUTION,
    legend: HAZARD_LEGEND,
  },
];

// This is the single source of truth for overlays exposed by the current UI.
// Keep legacy backend hazard fields out of this list: they are report data,
// not browser-rendered map layers.
export const INARISK_OVERLAY_KEYS = INARISK_HAZARDS.map(({ key }) => key);
export const MAP_OVERLAY_KEYS = [...INARISK_OVERLAY_KEYS, 'faults'];

const R = 6378137; // semi-major axis (EPSG:3857/EPSG:3395)
const HALF = Math.PI * R; // 20037508.342789244
const POLAR_RADIUS = 6356752.314245179;
const ECCENTRICITY = Math.sqrt(1 - (POLAR_RADIUS ** 2) / (R ** 2));

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

// lon/lat (deg) → meter EPSG:3395 (World Mercator), which is the native
// spatial reference of the public BNPB InaRISK ImageServer rasters.
function project3395(lon, lat) {
  const lonRad = (lon * Math.PI) / 180;
  const latRad = (lat * Math.PI) / 180;
  const sinLat = Math.sin(latRad);
  const conformal = Math.tan(Math.PI / 4 + latRad / 2)
    * ((1 - ECCENTRICITY * sinLat) / (1 + ECCENTRICITY * sinLat)) ** (ECCENTRICITY / 2);
  return { x: R * lonRad, y: R * Math.log(conformal) };
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

// {x,y,z} → "xmin,ymin,xmax,ymax" in the BNPB raster CRS (EPSG:3395).
export function tileToBbox3395({ x, y, z }) {
  const nw = tileNW(x, y, z);
  const se = tileNW(x + 1, y + 1, z);
  const pnw = project3395(nw.lon, nw.lat);
  const pse = project3395(se.lon, se.lat);
  const clampX = (value) => Math.max(-HALF, Math.min(HALF, value));
  const xmin = clampX(pnw.x);
  const xmax = clampX(pse.x);
  const ymin = pse.y;
  const ymax = pnw.y;
  return `${xmin},${ymin},${xmax},${ymax}`;
}

// ArcGIS ImageServer exportImage: BNPB rasters use EPSG:3395; PNG32 keeps
// nodata transparent so the display-only overlay does not cover the basemap.
export function buildExportUrl(serviceUrl, bbox) {
  const params = new URLSearchParams({
    bboxSR: '3395',
    imageSR: '3395',
    size: '256,256',
    format: 'png32',
    f: 'image',
  });
  return `${serviceUrl}/exportImage?bbox=${bbox}&${params.toString()}`;
}

// ── Color ramp indeks bahaya (0..1) ───────────────────────────────
// InaRISK ImageServer merender indeks sebagai grayscale (0=hitam, 1=putih).
// Recolor client-side jadi traffic-light biar magnitudo jelas:
// hijau = rendah, kuning = sedang, merah = tinggi (hue 120°→0°).
// Ramp yang sama dipakai raster (LUT) dan legenda peta.
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

// Indeks bahaya 0..1 → hijau (rendah) → kuning (sedang) → merah (tinggi).
export function indexToRainbow(t) {
  return hslToRgb(120 * (1 - clamp01(t)), 0.9, 0.45);
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
  { t: 0, label: 'Rendah', translationKey: 'panel.low' },
  { t: 0.5, label: 'Sedang', translationKey: 'panel.moderate' },
  { t: 1, label: 'Tinggi', translationKey: 'panel.high' },
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
