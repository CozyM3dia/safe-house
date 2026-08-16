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
    bboxSR: '3857',
    imageSR: '3857',
    size: '256,256',
    dpi: '96',
    format: 'png32',
    transparent: 'true',
    f: 'image',
  });
  return `${serviceUrl}/export?bbox=${bbox}&${params.toString()}`;
}
