/**
 * Reference fault points used by the legacy seismic proximity model.
 *
 * These are intentionally presented as screening corridors in the map. They
 * are not an official fault-geometry layer and must not look like one.
 */
export const ACTIVE_FAULTS = [
  { name: 'Sesar Aceh (NAD)', coords: [5.55, 95.32] },
  { name: 'Sesar Seulimeum (Aceh)', coords: [5.42, 95.68] },
  { name: 'Sesar Tripa (Aceh Barat)', coords: [3.8, 96.5] },
  { name: 'Sesar Renun (Sumut)', coords: [2.7, 98.5] },
  { name: 'Sesar Toru (Sumut)', coords: [1.6, 99.0] },
  { name: 'Sesar Angkola (Tapanuli)', coords: [1.2, 99.3] },
  { name: 'Sesar Barumun (Sumut)', coords: [1.0, 99.8] },
  { name: 'Sesar Sumpur (Sumbar)', coords: [-0.4, 100.4] },
  { name: 'Sesar Sianok (Bukittinggi)', coords: [-0.3, 100.37] },
  { name: 'Sesar Suliti (Sumbar)', coords: [-1.1, 101.1] },
  { name: 'Sesar Dikit (Kerinci)', coords: [-1.8, 101.3] },
  { name: 'Sesar Ketaun (Bengkulu)', coords: [-3.3, 102.1] },
  { name: 'Sesar Musi (Bengkulu)', coords: [-3.7, 102.8] },
  { name: 'Sesar Kumering (Sumsel)', coords: [-4.4, 103.8] },
  { name: 'Semangko Timur (Lampung)', coords: [-5.48, 104.72] },
  { name: 'Semangko Barat (Lampung)', coords: [-5.5, 104.65] },
  { name: 'Sesar Tarahan (Bandar Lampung)', coords: [-5.51, 105.32] },
  { name: 'Sesar Cimandiri (Jabar)', coords: [-6.8, 106.7] },
  { name: 'Sesar Lembang (Bandung)', coords: [-6.78, 107.6] },
  { name: 'Sesar Baribis-Kendeng (Jabar-Jateng)', coords: [-6.9, 108.5] },
  { name: 'Sesar Opak (Yogyakarta)', coords: [-7.87, 110.4] },
  { name: 'Sesar Grindulu (Pacitan)', coords: [-8.2, 111.1] },
  { name: 'Sesar Pasuruan (Jatim)', coords: [-7.65, 112.9] },
  { name: 'Sesar Kendeng (Jatim)', coords: [-7.3, 112.0] },
  { name: 'Sesar Lasem (Jateng)', coords: [-6.7, 111.4] },
  { name: 'Sesar Seririt (Bali Utara)', coords: [-8.2, 114.9] },
  { name: 'Flores Back-Arc Thrust', coords: [-8.2, 121.5] },
  { name: 'Sesar Busur Belakang Flores', coords: [-8.1, 122.4] },
  { name: 'Sesar Palu-Koro (Sulteng)', coords: [-0.9, 119.85] },
  { name: 'Sesar Matano (Sulsel)', coords: [-2.5, 121.4] },
  { name: 'Sesar Lawanopo (Sultra)', coords: [-3.5, 122.0] },
  { name: 'Sesar Walanae (Sulsel)', coords: [-3.8, 120.2] },
  { name: 'Sesar Gorontalo (Gorontalo)', coords: [0.5, 123.0] },
  { name: 'Sesar Minahasa (Sulut)', coords: [1.3, 124.8] },
  { name: 'Sesar Meratus (Kalsel)', coords: [-3.2, 115.8] },
  { name: 'Sesar Mangkalihat (Kaltim)', coords: [1.0, 118.0] },
  { name: 'Sesar Tarakan (Kaltara)', coords: [3.3, 117.6] },
  { name: 'Sesar Adang (Kaltim)', coords: [0.2, 117.5] },
  { name: 'Sesar Sorong-Kawa (Maluku)', coords: [-3.3, 128.2] },
  { name: 'Sesar Sula (Maluku Utara)', coords: [-1.8, 125.5] },
  { name: 'Sesar Ambon (Maluku)', coords: [-3.7, 128.2] },
  { name: 'Sesar Sorong (Papua Barat)', coords: [-0.87, 131.3] },
  { name: 'Sesar Ransiki (Papua Barat)', coords: [-1.5, 134.2] },
  { name: 'Sesar Yapen (Papua)', coords: [-1.8, 136.2] },
  { name: 'Sesar Mamberamo (Papua)', coords: [-3.0, 138.5] },
  { name: 'Sesar Jayapura (Papua)', coords: [-2.53, 140.7] },
];

const pointByName = new Map(ACTIVE_FAULTS.map((fault) => [fault.name, fault]));

function buildTrace(id, label, names) {
  return {
    id,
    label,
    names,
    points: names.map((name) => pointByName.get(name).coords),
  };
}

/** Approximate screening corridors, deliberately not official fault geometry. */
export const FAULT_TRACE_SEGMENTS = [
  buildTrace('sumatra', 'Koridor referensi Sesar Sumatra', [
    'Sesar Aceh (NAD)', 'Sesar Seulimeum (Aceh)', 'Sesar Tripa (Aceh Barat)',
    'Sesar Renun (Sumut)', 'Sesar Toru (Sumut)', 'Sesar Angkola (Tapanuli)',
    'Sesar Barumun (Sumut)', 'Sesar Sumpur (Sumbar)', 'Sesar Sianok (Bukittinggi)',
    'Sesar Suliti (Sumbar)', 'Sesar Dikit (Kerinci)', 'Sesar Ketaun (Bengkulu)',
    'Sesar Musi (Bengkulu)', 'Sesar Kumering (Sumsel)', 'Semangko Timur (Lampung)',
    'Semangko Barat (Lampung)', 'Sesar Tarahan (Bandar Lampung)',
  ]),
  buildTrace('java-west', 'Referensi sesar Jawa Barat', [
    'Sesar Cimandiri (Jabar)', 'Sesar Lembang (Bandung)',
  ]),
  buildTrace('java-north', 'Referensi koridor Baribis-Kendeng', [
    'Sesar Baribis-Kendeng (Jabar-Jateng)', 'Sesar Lasem (Jateng)',
  ]),
  buildTrace('java-south', 'Referensi sesar selatan Jawa', [
    'Sesar Opak (Yogyakarta)', 'Sesar Grindulu (Pacitan)',
  ]),
  buildTrace('java-east', 'Referensi sesar Jawa Timur', [
    'Sesar Kendeng (Jatim)', 'Sesar Pasuruan (Jatim)',
  ]),
  buildTrace('bali-flores', 'Referensi busur belakang Bali-Flores', [
    'Sesar Seririt (Bali Utara)', 'Flores Back-Arc Thrust', 'Sesar Busur Belakang Flores',
  ]),
  buildTrace('sulawesi-central', 'Referensi sesar Sulawesi tengah', [
    'Sesar Palu-Koro (Sulteng)', 'Sesar Matano (Sulsel)', 'Sesar Lawanopo (Sultra)',
  ]),
  buildTrace('sulawesi-north', 'Referensi sesar Sulawesi utara', [
    'Sesar Walanae (Sulsel)', 'Sesar Gorontalo (Gorontalo)', 'Sesar Minahasa (Sulut)',
  ]),
  buildTrace('kalimantan', 'Referensi sesar Kalimantan', [
    'Sesar Meratus (Kalsel)', 'Sesar Adang (Kaltim)', 'Sesar Mangkalihat (Kaltim)',
    'Sesar Tarakan (Kaltara)',
  ]),
  buildTrace('maluku', 'Referensi sesar Maluku', [
    'Sesar Sorong-Kawa (Maluku)', 'Sesar Sula (Maluku Utara)', 'Sesar Ambon (Maluku)',
  ]),
  buildTrace('papua', 'Referensi sesar Papua', [
    'Sesar Sorong (Papua Barat)', 'Sesar Ransiki (Papua Barat)', 'Sesar Yapen (Papua)',
    'Sesar Mamberamo (Papua)', 'Sesar Jayapura (Papua)',
  ]),
];

export const FAULT_OVERLAY_STYLE = {
  color: '#b86f63',
  weight: 3,
  opacity: 0.72,
  dashArray: null,
  lineCap: 'round',
  lineJoin: 'round',
};

// Keep the reference traces above hazard polygons, while leaving markers and
// the HTML control surfaces readable and interactive.
export const FAULT_OVERLAY_PANE_NAME = 'faultReference';
export const FAULT_OVERLAY_PANE_Z_INDEX = 430;

export const OFFICIAL_FAULT_SOURCE = {
  provider: 'BNPB InaRISK',
  dataset: 'Pusgen_2024_Shallow_Crustal_v6',
  serviceUrl: 'https://gis.bnpb.go.id/server/rest/services/inarisk/Faults_new/MapServer/1',
};

export const OFFICIAL_FAULT_GEOJSON_URL = `${OFFICIAL_FAULT_SOURCE.serviceUrl}/query?where=1%3D1&outFields=FID%2CName%2CSegment%2CMmax%2CRegion%2CType%2CSliprate_m%2CLength_km&returnGeometry=true&f=geojson`;

export function getFaultTraceSegments() {
  return FAULT_TRACE_SEGMENTS;
}
