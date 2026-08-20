// Tile sources — gratis, tanpa kunci, dan boleh dipakai komersial.
// Google Maps XYZ dihapus: pemakaian tanpa kunci resmi melanggar ketentuan
// layanan Google. Lihat spec bagian 6.
export const MAP_TILES = {
  terrain: {
    // Esri's topographic atlas gives the map landform, relief, boundaries,
    // and place labels without introducing another API key or changing the
    // underlying hazard data contract.
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri — Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, IGN, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), swisstopo, GSI and the GIS User Community',
    maxZoom: 19,
  },
  street: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    maxZoom: 20,
    subdomains: 'abcd',
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
