export const C = {
  bg: '#0f0b08',
  surface: 'rgba(22, 14, 8, 0.88)',
  elevated: '#1a1208',
  text: '#f0e4cc',
  textSecondary: '#c4a87e',
  textMuted: '#7d6245',
  copper: '#d4956a',
  copperDeep: '#b87a52',
  safe: '#10b981',
  warn: '#f59e0b',
  danger: '#ef4444',
  line: 'rgba(255, 210, 170, 0.10)',
  lineStrong: 'rgba(255, 210, 170, 0.22)',
  glowCopper: 'rgba(212, 149, 106, 0.35)',
} as const;

export const F = {
  display: '"Instrument Serif", serif',
  body: '"Inter", sans-serif',
  mono: '"Azeret Mono", monospace',
} as const;

// Canonical sample data — docs/PROMPT-PERBAIKAN-CONTACT-SHEET.md (do not alter)
export const DATA = {
  bandarLampung: {
    name: 'Bandar Lampung',
    lat: '-5.3971',
    lon: '105.2668',
    score: 65,
    rating: 'SEDANG',
    caption: 'layak dengan catatan',
    subScores: [
      { label: 'GEMPA', value: 45 },
      { label: 'LIKUEFAKSI', value: 60 },
      { label: 'BANJIR', value: 55 },
      { label: 'LONGSOR', value: 80 },
      { label: 'PENURUNAN LAHAN', value: 85 },
    ],
    metrics: [
      { label: 'PGA DESAIN', value: '0.32', unit: 'g', note: 'Percepatan tanah rencana · PuSGeN' },
      { label: 'KELAS SITUS', value: 'SD', unit: 'Vs30 285 m/s', note: 'SNI 1726:2019' },
      { label: 'FS LIKUEFAKSI', value: '1.15', unit: '', note: '> 1, namun tipis — waspada' },
      { label: 'JARAK SESAR', value: '11.8', unit: 'km', note: 'Sesar aktif terdekat' },
      { label: 'BANJIR', value: 'SEDANG', unit: '', note: 'Curah hujan 182 mm/bln' },
    ],
  },
  natar: {
    name: 'Natar',
    score: 78,
    rating: 'AMAN',
    caption: 'risiko rendah',
    pga: '0.19 g',
    vs30: '586 m/s · SC',
    fs: '1.85',
    fault: '32.4 km',
    flood: 'RENDAH',
    subScores: [
      { label: 'GEMPA', value: 72 },
      { label: 'LIKUEFAKSI', value: 88 },
      { label: 'BANJIR', value: 82 },
      { label: 'LONGSOR', value: 90 },
      { label: 'PENURUNAN LAHAN', value: 92 },
    ],
  },
  sources: ['BMKG', 'PuSGeN', 'InaRISK BNPB', 'USGS', 'BIG', 'Open-Meteo'],
  portals: [
    { name: 'InaRISK', org: 'BNPB' },
    { name: 'BMKG', org: 'Meteorologi & Gempa' },
    { name: 'PuSGeN', org: 'ESDM' },
    { name: 'USGS', org: 'Katalog Gempa Global' },
    { name: 'Rupabumi', org: 'BIG' },
  ],
} as const;

// Pixel positions inside public/img/bl-map.png (2048x1280, z13 tiles 6487..6494 x 4216..4220)
export const MAP_PX = {
  bandarLampung: { x: 1160, y: 768 },
  natar: { x: 666, y: 307 },
} as const;
