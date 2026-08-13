// Google Maps XYZ URLs
export const MAP_TILES = {
  street: {
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps',
    maxZoom: 20,
  },
  satellite: {
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', // y = Hybrid (Satellite + Labels)
    attribution: '&copy; Google Maps',
    maxZoom: 20,
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
