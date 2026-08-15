// Basemap configuration.
// CARTO remains the production-safe default. Stadia is opt-in until its
// domain authentication and deployed tile delivery have been verified.
const STADIA_MAPS_ENABLED = import.meta.env.VITE_STADIA_MAPS_ENABLED === 'true';
const STADIA_MAPS_API_KEY = import.meta.env.VITE_STADIA_MAPS_API_KEY?.trim();
const STADIA_AUTH_SUFFIX = STADIA_MAPS_API_KEY
  ? '?api_key=' + encodeURIComponent(STADIA_MAPS_API_KEY)
  : '';

export const MAP_TILES = {
  analysis: {
    id: 'analysis',
    label: 'Analisis',
    provider: 'Stadia Maps',
    tone: 'analysis',
    url:
      'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png' +
      STADIA_AUTH_SUFFIX,
    attribution:
      '&copy; <a href="https://stadiamaps.com/" target="_blank" rel="noreferrer">Stadia Maps</a> ' +
      '&copy; <a href="https://openmaptiles.org/" target="_blank" rel="noreferrer">OpenMapTiles</a> ' +
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
    maxZoom: 20,
    enabled: STADIA_MAPS_ENABLED,
    fallback: 'street',
  },
  street: {
    id: 'street',
    label: 'Jalan',
    provider: 'CARTO',
    tone: 'street',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    maxZoom: 20,
    subdomains: 'abcd',
    enabled: true,
  },
  satellite: {
    id: 'satellite',
    label: 'Satelit',
    provider: 'Esri',
    tone: 'satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics',
    maxZoom: 19,
    enabled: true,
  },
};

export const DEFAULT_CENTER = [-6.2088, 106.8456]; // Jakarta
export const DEFAULT_ZOOM = 12;

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
  { keys: ['B'], action: 'Toggle battle mode' },
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
