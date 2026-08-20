// Tile sources — gratis, tanpa kunci, dan boleh dipakai komersial.
// Google Maps XYZ dihapus: pemakaian tanpa kunci resmi melanggar ketentuan
// layanan Google. Lihat spec bagian 6.
const STADIA_API_KEY = String(import.meta.env?.VITE_STADIA_MAPS_API_KEY || '').trim();
const STADIA_KEY_SUFFIX = STADIA_API_KEY
  ? `?api_key=${encodeURIComponent(STADIA_API_KEY)}`
  : '';
const STADIA_ATTRIBUTION = '&copy; <a href="https://stadiamaps.com/" target="_blank" rel="noopener noreferrer">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank" rel="noopener noreferrer">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>';

export const STADIA_MAPS_ENABLED = Boolean(STADIA_API_KEY);

const stadiaRasterUrl = (style) =>
  `https://tiles.stadiamaps.com/tiles/${style}/{z}/{x}/{y}{r}.png${STADIA_KEY_SUFFIX}`;

export const MAP_TILES = {
  alidade: {
    url: stadiaRasterUrl('alidade_smooth'),
    attribution: STADIA_ATTRIBUTION,
    maxZoom: 20,
    requiresApiKey: true,
  },
  'alidade-dark': {
    url: stadiaRasterUrl('alidade_smooth_dark'),
    attribution: STADIA_ATTRIBUTION,
    maxZoom: 20,
    requiresApiKey: true,
  },
  terrain: {
    // Esri's topographic atlas gives the map landform, relief, boundaries,
    // and place labels without introducing another API key or changing the
    // underlying hazard data contract.
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri — Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, IGN, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), swisstopo, GSI and the GIS User Community',
    maxZoom: 19,
  },
  street: {
    // Muted street atlas: pale land use, soft green areas, blue water,
    // and readable roads/places closer to the requested visual reference.
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri — Esri, HERE, Garmin, (c) OpenStreetMap contributors, and the GIS user community',
    maxZoom: 19,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics',
    maxZoom: 19,
  },
};

// Viewport guard: the Leaflet map cannot be panned outside the Indonesian
// bounding region. Coordinate validation remains server-side as the source of
// truth, so this is a UX lock rather than a security boundary.
export const INDONESIA_MAP_BOUNDS = [[-11.5, 94.5], [6.5, 141.5]];
export const DEFAULT_CENTER = [-2.5, 118]; // Indonesia
export const DEFAULT_ZOOM = 5;

export const RISK_DOMAIN = {
  safe: { min: 70, max: 100, label: 'SAFE', hex: '#10b981' },
  moderate: { min: 40, max: 69, label: 'MODERATE', hex: '#f59e0b' },
  danger: { min: 0, max: 39, label: 'DANGER', hex: '#ef4444' },
};

export const KEYBOARD_SHORTCUTS = [
  { keys: ['⌘', 'K'], action: 'Open command palette' },
  { keys: ['/'], action: 'Focus search' },
  { keys: ['?'], action: 'Show keyboard shortcuts' },
  { keys: ['Esc'], action: 'Close drawer / panel' },
  { keys: ['C'], action: 'Focus chatbot' },
  { keys: ['L'], action: 'Toggle left panel' },
  { keys: ['B'], action: 'Toggle mode bandingkan' },
];

export const SUGGESTED_PROMPTS_ID = [
  'Apa risiko utama lokasi ini?',
  'Rekomendasi pondasi apa untuk tanah ini?',
  'Berapa estimasi biaya mitigasi?',
  'Apakah lokasi ini layak untuk investasi?',
  'Bagaimana kesiapsiagaan gempa di sini?',
  'Apa saja SNI yang berlaku untuk bangunan di sini?',
];

export const SUGGESTED_PROMPTS_EN = [
  'What are the main risks here?',
  'What foundation do you recommend?',
  'Estimate the mitigation costs?',
  'Is this a good location to invest?',
  'How to prepare for earthquakes here?',
  'Which building codes apply here?',
];

// Legacy export — defaults to Indonesian
export const SUGGESTED_PROMPTS = SUGGESTED_PROMPTS_ID;
