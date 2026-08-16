import axios from 'axios';

// Legacy engine kept only for migration fixtures. Secrets and provider calls
// belong in the backend; never read VITE_* API keys in browser code.
const GEMINI_API_KEY = '';
const OPENROUTER_API_KEY = '';
export const MAPS_API_KEY = '';

const GEMINI_MODEL = 'gemini-3.1-flash-lite';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// ═══════════════════════════════════════════════════════════════════
// COMPREHENSIVE INDONESIA GEOLOGICAL DATABASE
// Coverage: Sumatra, Java, Bali, NTB, NTT, Kalimantan, Sulawesi,
//           Maluku, Papua — all major tectonic features
// ═══════════════════════════════════════════════════════════════════

export const ACTIVE_FAULTS = [
    // ── SUMATRA (Great Sumatran Fault segments) ──
    { name: "Sesar Aceh (NAD)", coords: [5.550, 95.320] },
    { name: "Sesar Seulimeum (Aceh)", coords: [5.420, 95.680] },
    { name: "Sesar Tripa (Aceh Barat)", coords: [3.800, 96.500] },
    { name: "Sesar Renun (Sumut)", coords: [2.700, 98.500] },
    { name: "Sesar Toru (Sumut)", coords: [1.600, 99.000] },
    { name: "Sesar Angkola (Tapanuli)", coords: [1.200, 99.300] },
    { name: "Sesar Barumun (Sumut)", coords: [1.000, 99.800] },
    { name: "Sesar Sumpur (Sumbar)", coords: [-0.400, 100.400] },
    { name: "Sesar Sianok (Bukittinggi)", coords: [-0.300, 100.370] },
    { name: "Sesar Suliti (Sumbar)", coords: [-1.100, 101.100] },
    { name: "Sesar Dikit (Kerinci)", coords: [-1.800, 101.300] },
    { name: "Sesar Ketaun (Bengkulu)", coords: [-3.300, 102.100] },
    { name: "Sesar Musi (Bengkulu)", coords: [-3.700, 102.800] },
    { name: "Sesar Kumering (Sumsel)", coords: [-4.400, 103.800] },
    { name: "Semangko Timur (Lampung)", coords: [-5.480, 104.720] },
    { name: "Semangko Barat (Lampung)", coords: [-5.500, 104.650] },
    { name: "Sesar Tarahan (Bandar Lampung)", coords: [-5.510, 105.320] },

    // ── JAVA ──
    { name: "Sesar Cimandiri (Jabar)", coords: [-6.800, 106.700] },
    { name: "Sesar Lembang (Bandung)", coords: [-6.780, 107.600] },
    { name: "Sesar Baribis-Kendeng (Jabar-Jateng)", coords: [-6.900, 108.500] },
    { name: "Sesar Opak (Yogyakarta)", coords: [-7.870, 110.400] },
    { name: "Sesar Grindulu (Pacitan)", coords: [-8.200, 111.100] },
    { name: "Sesar Pasuruan (Jatim)", coords: [-7.650, 112.900] },
    { name: "Sesar Kendeng (Jatim)", coords: [-7.300, 112.000] },
    { name: "Sesar Lasem (Jateng)", coords: [-6.700, 111.400] },

    // ── BALI & NUSA TENGGARA ──
    { name: "Sesar Seririt (Bali Utara)", coords: [-8.200, 114.900] },
    { name: "Flores Back-Arc Thrust", coords: [-8.200, 121.500] },
    { name: "Sesar Busur Belakang Flores", coords: [-8.100, 122.400] },

    // ── SULAWESI ──
    { name: "Sesar Palu-Koro (Sulteng)", coords: [-0.900, 119.850] },
    { name: "Sesar Matano (Sulsel)", coords: [-2.500, 121.400] },
    { name: "Sesar Lawanopo (Sultra)", coords: [-3.500, 122.000] },
    { name: "Sesar Walanae (Sulsel)", coords: [-3.800, 120.200] },
    { name: "Sesar Gorontalo (Gorontalo)", coords: [0.500, 123.000] },
    { name: "Sesar Minahasa (Sulut)", coords: [1.300, 124.800] },

    // ── KALIMANTAN ──
    { name: "Sesar Meratus (Kalsel)", coords: [-3.200, 115.800] },
    { name: "Sesar Mangkalihat (Kaltim)", coords: [1.000, 118.000] },
    { name: "Sesar Tarakan (Kaltara)", coords: [3.300, 117.600] },
    { name: "Sesar Adang (Kaltim)", coords: [0.200, 117.500] },

    // ── MALUKU ──
    { name: "Sesar Sorong-Kawa (Maluku)", coords: [-3.300, 128.200] },
    { name: "Sesar Sula (Maluku Utara)", coords: [-1.800, 125.500] },
    { name: "Sesar Ambon (Maluku)", coords: [-3.700, 128.200] },

    // ── PAPUA ──
    { name: "Sesar Sorong (Papua Barat)", coords: [-0.870, 131.300] },
    { name: "Sesar Ransiki (Papua Barat)", coords: [-1.500, 134.200] },
    { name: "Sesar Yapen (Papua)", coords: [-1.800, 136.200] },
    { name: "Sesar Mamberamo (Papua)", coords: [-3.000, 138.500] },
    { name: "Sesar Jayapura (Papua)", coords: [-2.530, 140.700] },
];

export const VOLCANOES = [
    // ── SUMATRA ──
    { name: "G. Sinabung", coords: [3.170, 98.392] },
    { name: "G. Sibayak", coords: [3.230, 98.520] },
    { name: "G. Toba (Supervolcano)", coords: [2.600, 98.830] },
    { name: "G. Marapi", coords: [-0.381, 100.474] },
    { name: "G. Talang", coords: [-0.979, 100.681] },
    { name: "G. Kerinci", coords: [-1.697, 101.264] },
    { name: "G. Dempo", coords: [-4.030, 103.130] },
    { name: "G. Krakatau", coords: [-6.102, 105.423] },
    { name: "G. Rajabasa", coords: [-5.780, 105.630] },
    { name: "G. Tanggamus", coords: [-5.420, 104.720] },

    // ── JAVA ──
    { name: "G. Salak", coords: [-6.720, 106.730] },
    { name: "G. Gede-Pangrango", coords: [-6.780, 106.980] },
    { name: "G. Tangkuban Parahu", coords: [-6.770, 107.600] },
    { name: "G. Papandayan", coords: [-7.320, 107.730] },
    { name: "G. Galunggung", coords: [-7.250, 108.060] },
    { name: "G. Ciremai", coords: [-6.890, 108.400] },
    { name: "G. Slamet", coords: [-7.240, 109.210] },
    { name: "G. Dieng", coords: [-7.210, 109.920] },
    { name: "G. Sundoro", coords: [-7.300, 109.990] },
    { name: "G. Sumbing", coords: [-7.384, 110.070] },
    { name: "G. Merapi (Yogya)", coords: [-7.541, 110.446] },
    { name: "G. Merbabu", coords: [-7.455, 110.440] },
    { name: "G. Lawu", coords: [-7.625, 111.192] },
    { name: "G. Kelud", coords: [-7.930, 112.310] },
    { name: "G. Arjuno-Welirang", coords: [-7.725, 112.580] },
    { name: "G. Bromo-Tengger", coords: [-7.942, 112.950] },
    { name: "G. Semeru", coords: [-8.108, 112.922] },
    { name: "G. Ijen", coords: [-8.058, 114.242] },
    { name: "G. Raung", coords: [-8.125, 114.042] },

    // ── BALI & NUSA TENGGARA ──
    { name: "G. Agung (Bali)", coords: [-8.343, 115.508] },
    { name: "G. Batur (Bali)", coords: [-8.242, 115.375] },
    { name: "G. Rinjani (Lombok)", coords: [-8.420, 116.460] },
    { name: "G. Tambora (Sumbawa)", coords: [-8.250, 118.000] },
    { name: "G. Sangeang Api (NTB)", coords: [-8.200, 119.070] },
    { name: "G. Kelimutu (Flores)", coords: [-8.770, 121.820] },

    // ── SULAWESI ──
    { name: "G. Lokon-Empung (Sulut)", coords: [1.358, 124.792] },
    { name: "G. Soputan (Sulut)", coords: [1.112, 124.737] },
    { name: "G. Karangetang (Sangihe)", coords: [2.781, 125.407] },

    // ── MALUKU ──
    { name: "G. Gamalama (Ternate)", coords: [0.800, 127.325] },
    { name: "G. Banda Api (Banda)", coords: [-4.525, 129.871] },

    // ── PAPUA ──
    { name: "G. Gamkonora (Halmahera)", coords: [1.380, 127.530] },
];

export const MEGATHRUST = [
    { name: "Sunda Megathrust (Sumatra)", coords: [-3.500, 99.000] },
    { name: "Sunda Megathrust (Selat Sunda)", coords: [-6.500, 104.500] },
    { name: "Java Megathrust (Jabar)", coords: [-8.500, 107.000] },
    { name: "Java Megathrust (Jateng)", coords: [-9.000, 110.000] },
    { name: "Java Megathrust (Jatim)", coords: [-9.200, 113.000] },
    { name: "Timor Trough", coords: [-9.500, 124.000] },
    { name: "Banda Arc Megathrust", coords: [-6.500, 130.000] },
    { name: "North Sulawesi Megathrust", coords: [2.000, 124.000] },
    { name: "Philippine Sea Plate (Maluku)", coords: [0.000, 127.000] },
    { name: "Papua-New Guinea Trench", coords: [-4.000, 143.000] },
];

export const COASTLINE = [
    // SUMATRA
    { name: "Pesisir Aceh Barat", coords: [4.200, 96.100] },
    { name: "Pesisir Padang", coords: [-1.000, 100.300] },
    { name: "Pesisir Bengkulu", coords: [-3.800, 102.200] },
    { name: "Teluk Lampung", coords: [-5.450, 105.280] },
    { name: "Pesisir Kalianda", coords: [-5.750, 105.580] },
    // JAVA
    { name: "Pesisir Utara Jakarta (Pantura)", coords: [-6.090, 106.850] },
    { name: "Pesisir Semarang", coords: [-6.950, 110.380] },
    { name: "Pesisir Utara Surabaya", coords: [-7.200, 112.750] },
    { name: "Pesisir Selatan Yogya (Parangtritis)", coords: [-8.020, 110.330] },
    { name: "Pesisir Selatan Pacitan", coords: [-8.200, 111.100] },
    { name: "Pesisir Selatan Malang", coords: [-8.400, 112.700] },
    // BALI & NTT
    { name: "Pesisir Bali Selatan", coords: [-8.780, 115.100] },
    { name: "Pesisir Kupang (NTT)", coords: [-10.170, 123.580] },
    // KALIMANTAN
    { name: "Pesisir Balikpapan", coords: [-1.250, 116.850] },
    { name: "Pesisir Pontianak", coords: [-0.020, 109.330] },
    { name: "Pesisir Banjarmasin", coords: [-3.330, 114.590] },
    // SULAWESI
    { name: "Pesisir Makassar", coords: [-5.130, 119.410] },
    { name: "Pesisir Palu", coords: [-0.870, 119.830] },
    { name: "Pesisir Manado", coords: [1.490, 124.850] },
    // MALUKU & PAPUA
    { name: "Pesisir Ambon", coords: [-3.690, 128.170] },
    { name: "Pesisir Jayapura", coords: [-2.530, 140.720] },
    { name: "Pesisir Sorong", coords: [-0.870, 131.260] },
];

const REGIONAL_PGA = {
    // ── SUMATRA ──
    "Banda Aceh": 0.50, "Medan": 0.30, "Padang": 0.55,
    "Pekanbaru": 0.20, "Jambi": 0.25, "Palembang": 0.22,
    "Bengkulu": 0.50, "Bandar Lampung": 0.42,
    "Lampung Selatan (Kalianda)": 0.48, "Lampung Barat (Liwa)": 0.55,
    "Pesawaran": 0.40, "Metro": 0.35, "Bukittinggi": 0.52,
    // ── JAVA ──
    "Jakarta": 0.30, "Jakarta Utara": 0.28, "Bogor": 0.35,
    "Bandung": 0.45, "Cirebon": 0.25, "Semarang": 0.28,
    "Yogyakarta": 0.42, "Solo": 0.30, "Surabaya": 0.25,
    "Malang": 0.35, "Banyuwangi": 0.35, "Tasikmalaya": 0.40,
    "Cilacap": 0.38, "Pacitan": 0.42, "Blitar": 0.38,
    // ── BALI & NUSA TENGGARA ──
    "Denpasar": 0.38, "Lombok/Mataram": 0.48, "Kupang": 0.45,
    "Labuan Bajo": 0.40, "Ende": 0.42,
    // ── KALIMANTAN ──
    "Pontianak": 0.08, "Balikpapan": 0.12, "Samarinda": 0.10,
    "Banjarmasin": 0.12, "Palangkaraya": 0.08, "Tarakan": 0.18,
    "Ibu Kota Nusantara (IKN)": 0.10,
    // ── SULAWESI ──
    "Makassar": 0.30, "Palu": 0.65, "Manado": 0.50,
    "Gorontalo": 0.45, "Kendari": 0.35, "Mamuju": 0.50,
    // ── MALUKU ──
    "Ambon": 0.55, "Ternate": 0.60, "Tual": 0.45,
    // ── PAPUA ──
    "Jayapura": 0.50, "Sorong": 0.42, "Manokwari": 0.45,
    "Merauke": 0.20, "Nabire": 0.48, "Wamena": 0.45,
    // DEFAULT
    "Default": 0.35
};

// ═══════════════════════════════════════════════════════════════════
// INDONESIA REGIONAL RISK PROFILES (for AI deep knowledge context)
// ═══════════════════════════════════════════════════════════════════

const INDONESIA_RISK_KNOWLEDGE = `
COMPREHENSIVE INDONESIA GEOHAZARD KNOWLEDGE BASE — USE THIS AS YOUR EXPERT DOMAIN CONTEXT:

### TECTONIC SETTING
Indonesia sits at the junction of 3 major tectonic plates (Indo-Australian, Eurasian, Pacific) and 1 minor plate (Philippine Sea). This makes it the most seismically active country on Earth. The Sunda Arc subduction zone runs 5,600km from Myanmar to Timor. The country experiences ~6,000 earthquakes per year (M>3).

### REGIONAL RISK PROFILES:

**SUMATRA**
- Great Sumatran Fault (GSF): 1,900km right-lateral strike-slip fault running the entire island. Segmented into 19 segments.
- Western coast faces direct Sunda Megathrust subduction (M8-9 capable). 2004 Aceh tsunami (M9.1) killed 230,000+.
- Padang: Extreme risk — GSF + Megathrust + soft alluvial soil. Mentawai segment gap (overdue M8.5+).
- Medan: Moderate seismic but near Toba supervolcano caldera.
- Bengkulu: High seismic + tsunami risk. 2007 M8.4 earthquake.
- Lampung: Active Semangko fault + proximity to Krakatau. Sunda Strait tsunami 2018.
- Soil: Western coast is predominantly alluvial (soft, SE-SD class). Highland areas have volcanic soil (better bearing capacity).
- Key historical: 2009 Padang M7.6 (1,115 dead), 2010 Mentawai tsunami, 2018 Palu-Donggala M7.5.

**JAVA**
- Northern coastal plain (Pantura): Extreme subsidence (Jakarta sinking 7.5-17cm/year), clay/alluvial soil, flooding.
- Jakarta: Land subsidence + sea level rise + extreme flooding. North Jakarta could be submerged by 2050. Groundwater extraction is primary cause.
- Bandung Basin: Sesar Lembang is a major concern — capable of M6.5-7.0, densely populated area on soft lacustrine soil.
- Yogyakarta: Sesar Opak produced 2006 M6.3 earthquake (5,700+ dead). Active zone.
- Southern coast: Java Megathrust subduction zone. Tsunami risk for Cilacap, Pacitan, Malang Selatan.
- Merapi volcano: Most active volcano in Indonesia, VEI 4 capable. Pyroclastic flows reach 15km. 2010 eruption killed 353.
- Semeru: 2021 eruption (VEI 3) killed 51. Lahars remain active threat.
- East Java: Kelud volcano (VEI 4 history), Lumpur Sidoarjo (mud volcano, man-made disaster since 2006).
- Soil types: North coast alluvial clay (very soft), southern limestone karst (harder), volcanic deposits near mountains.

**BALI & NUSA TENGGARA**
- Bali: G. Agung (last major eruption 1963, VEI 5, 1,100 dead). Active monitoring.
- Lombok: 2018 earthquake sequence (M6.4, M6.9, M7.0) — 564 dead, 400,000+ displaced. Flores Back-Arc Thrust.
- NTT/Flores: High seismic activity, tsunami risk. 1992 Flores earthquake-tsunami killed 2,500.
- Sumbawa: G. Tambora (1815 eruption VEI 7 — largest in recorded history, "Year Without Summer").

**KALIMANTAN**
- Generally LOW seismic risk (stable Sunda Shield continental crust).
- BUT: Peat fires (extreme air quality degradation, AQI 500+ during fire season).
- Coastal subsidence in Banjarmasin (delta city, sinking).
- Flash flooding from deforestation (palm oil plantations disrupting watershed).
- IKN (new capital): Relatively safe seismically (PGA 0.10g) but soft deltaic soil near coast.
- Eastern Kalimantan: Sesar Mangkalihat and Sesar Adang — moderate seismic potential.

**SULAWESI**
- Palu-Koro Fault: One of the fastest-moving faults in the world (42mm/year). 2018 M7.5 Palu earthquake caused devastating liquefaction in Balaroa & Petobo neighborhoods — entire neighborhoods swallowed by soil. Tsunami in Palu Bay (amplified by bay geometry).
- North Sulawesi: Active subduction (Minahasa Trench). Manado at risk.
- South Sulawesi: Sesar Walanae. Makassar built on alluvial deposits.
- 2021 Mamuju M6.2 earthquake — significant damage.

**MALUKU**
- Extremely high seismic activity — junction of 3 microplates.
- Ambon: Frequent M5-7 earthquakes. 2019 M6.5.
- Ternate: G. Gamalama volcano + seismic risk.
- Banda Sea: One of the most seismically active zones globally.

**PAPUA**
- Northern coast: Active plate boundary (Pacific Plate collision).
- Jayapura: High seismic risk, poor infrastructure increases vulnerability.
- Highlands: Wamena area — moderate seismic, landslide prone.
- Southern lowlands (Merauke): Low seismic but extreme flooding.
- 2004 Nabire M7.1 earthquake.

### INDONESIA-SPECIFIC BUILDING CODES (SNI):
- SNI 1726:2019 — Seismic design requirements
- SNI 2847:2019 — Structural concrete requirements
- SNI 1727:2020 — Minimum design loads
- For SE class soil (Vs30 < 180m/s): Mandatory deep foundation (bored pile/driven pile)
- For SD class soil near active faults (<30km): Ductile detailing required, minimum 1.5x safety factor
- Tsunami evacuation zone: Must be within 500m of shelter for <10m elevation coastal areas

### COMMON INDONESIA CONSTRUCTION ISSUES:
- Many informal buildings (non-engineered) — don't follow SNI codes
- Soft-story collapse: Common in shophouses (ruko) with open ground floor
- Unreinforced masonry (URM): Extremely vulnerable to earthquakes
- Corrosion: Coastal areas need marine-grade concrete (minimum f'c 35MPa, cover 50mm)
- Land subsidence: Avoid deep wells/groundwater pumping in sinking areas
`;

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

const haversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dlat = (lat2 - lat1) * Math.PI / 180;
    const dlon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dlat/2)**2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dlon/2)**2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
};

const getNearestPoint = (lat, lon, pointsList) => {
    let minDist = Infinity;
    let nearestName = "N/A";
    pointsList.forEach(p => {
        const dist = haversine(lat, lon, p.coords[0], p.coords[1]);
        if (dist < minDist) {
            minDist = dist;
            nearestName = p.name;
        }
    });
    return { name: nearestName, dist: minDist };
};

const getTopNNearest = (lat, lon, pointsList, n = 3) => {
    return pointsList
        .map(p => ({ name: p.name, dist: haversine(lat, lon, p.coords[0], p.coords[1]) }))
        .sort((a, b) => a.dist - b.dist)
        .slice(0, n);
};

const calculateVs30 = (elevasi) => {
    if (elevasi < 15) return 160;
    if (elevasi < 50) return 280;
    if (elevasi < 150) return 450;
    return 760;
};

const getSiteAmplification = (siteClass, pga) => {
    const faTable = {
        "SA": { 0.25: 0.8, 0.5: 0.8, 1.0: 0.8 },
        "SB": { 0.25: 0.9, 0.5: 0.9, 1.0: 0.9 },
        "SC": { 0.25: 1.3, 0.5: 1.2, 1.0: 1.2 },
        "SD": { 0.25: 1.6, 0.5: 1.4, 1.0: 1.2 },
        "SE": { 0.25: 2.4, 0.5: 1.7, 1.0: 1.2 }
    };
    const pgaRef = pga <= 0.25 ? 0.25 : (pga <= 0.5 ? 0.5 : 1.0);
    return faTable[siteClass]?.[pgaRef] || 1.2;
};

// Smart PGA lookup — finds the nearest city match from REGIONAL_PGA
const getRegionalPga = (lat, lon) => {
    const cityCoords = {
        // Sumatra
        "Banda Aceh": [5.548, 95.323], "Medan": [3.595, 98.672], "Padang": [-0.947, 100.417],
        "Pekanbaru": [0.507, 101.449], "Jambi": [-1.609, 103.607], "Palembang": [-2.990, 104.756],
        "Bengkulu": [-3.800, 102.265], "Bandar Lampung": [-5.430, 105.262],
        "Bukittinggi": [-0.307, 100.369],
        // Java
        "Jakarta": [-6.208, 106.846], "Jakarta Utara": [-6.121, 106.845], "Bogor": [-6.597, 106.806],
        "Bandung": [-6.917, 107.619], "Cirebon": [-6.706, 108.557], "Semarang": [-6.966, 110.420],
        "Yogyakarta": [-7.797, 110.369], "Solo": [-7.576, 110.824], "Surabaya": [-7.250, 112.750],
        "Malang": [-7.977, 112.634], "Banyuwangi": [-8.219, 114.369], "Tasikmalaya": [-7.327, 108.220],
        "Cilacap": [-7.727, 109.015], "Pacitan": [-8.196, 111.098], "Blitar": [-8.098, 112.161],
        // Bali & NTT
        "Denpasar": [-8.650, 115.219], "Lombok/Mataram": [-8.585, 116.105], "Kupang": [-10.178, 123.607],
        "Labuan Bajo": [-8.488, 119.889], "Ende": [-8.849, 121.660],
        // Kalimantan
        "Pontianak": [-0.023, 109.343], "Balikpapan": [-1.267, 116.831], "Samarinda": [-0.496, 117.151],
        "Banjarmasin": [-3.317, 114.590], "Palangkaraya": [-2.213, 113.911], "Tarakan": [3.300, 117.633],
        "Ibu Kota Nusantara (IKN)": [-1.281, 116.344],
        // Sulawesi
        "Makassar": [-5.135, 119.424], "Palu": [-0.899, 119.856], "Manado": [1.474, 124.842],
        "Gorontalo": [0.541, 123.059], "Kendari": [-3.972, 122.515], "Mamuju": [-2.680, 118.890],
        // Maluku
        "Ambon": [-3.695, 128.178], "Ternate": [0.785, 127.383], "Tual": [-5.638, 132.739],
        // Papua
        "Jayapura": [-2.534, 140.718], "Sorong": [-0.873, 131.255], "Manokwari": [-0.862, 134.082],
        "Merauke": [-8.493, 140.402], "Nabire": [-3.363, 135.497], "Wamena": [-4.100, 138.950],
    };

    let nearestCity = "Default";
    let minDist = Infinity;
    for (const [city, coords] of Object.entries(cityCoords)) {
        const dist = haversine(lat, lon, coords[0], coords[1]);
        if (dist < minDist) {
            minDist = dist;
            nearestCity = city;
        }
    }
    return { pga: REGIONAL_PGA[nearestCity] || REGIONAL_PGA["Default"], city: nearestCity, dist: minDist };
};

const calcLiquefaction = (lat, lon, elevasi) => {
    const vs30 = calculateVs30(elevasi);
    const siteClass = vs30 < 180 ? "SE" : (vs30 < 360 ? "SD" : (vs30 >= 760 ? "SB" : "SC"));

    const regional = getRegionalPga(lat, lon);
    const pga = regional.pga;

    const fa = getSiteAmplification(siteClass, pga);
    const pgaSurface = pga * fa;

    let crr = vs30 < 180 ? 0.12 : (vs30 < 360 ? 0.28 : 0.65);
    const stressRatio = vs30 < 180 ? 1.3 : 1.1;
    const csr = 0.65 * stressRatio * pgaSurface * 0.9;

    let fs = csr > 0 ? parseFloat((crr / csr).toFixed(2)) : 10.0;

    let riskScore = 0;
    if (fs < 0.5) riskScore = 95;
    else if (fs < 1.0) riskScore = 80;
    else if (fs < 1.2) riskScore = 50;
    else riskScore = 10;

    return { fs, vs30, siteClass, pga, riskScore, fa, pgaSurface, nearestCity: regional.city };
};

// ═══════════════════════════════════════════════════════════════════
// GOOGLE STREET VIEW AI VISION INTEGRATION
// ═══════════════════════════════════════════════════════════════════

const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    const chunks = [];
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        chunks.push(String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize)));
    }
    return btoa(chunks.join(''));
};

// Street View Analysis using backend proxy and Gemini Multimodal API
export const runStreetViewAnalysis = async (lat, lon, address = '') => {
    const USE_BACKEND = import.meta.env.VITE_USE_BACKEND === 'true';
    if (!USE_BACKEND) {
        console.log("[S.A.F.E] Street View analysis bypassed in frontend-only mode.");
        return null;
    }
    const backendBase = import.meta.env.PROD ? '' : 'http://localhost:3001';
    try {
        // 1. Check if Street View is available at this location
        const checkRes = await axios.get(`${backendBase}/api/streetview/check?lat=${lat}&lon=${lon}`);
        if (!checkRes.data?.available) {
            console.log("[S.A.F.E] Street View is not available at this location.");
            return null;
        }

        // 2. Fetch images for 4 headings (North, East, South, West) to get a full 360 view
        const headings = [0, 90, 180, 270];
        const imagesParts = [];

        for (const heading of headings) {
            try {
                const imgRes = await axios.get(`${backendBase}/api/streetview/image?lat=${lat}&lon=${lon}&heading=${heading}`);
                if (imgRes.data?.base64) {
                    imagesParts.push({
                        inlineData: {
                            mimeType: imgRes.data.mimeType || 'image/jpeg',
                            data: imgRes.data.base64
                        }
                    });
                }
            } catch (errImg) {
                console.warn(`[S.A.F.E] Failed to fetch Street View image for heading ${heading}:`, errImg.message);
            }
        }

        if (imagesParts.length === 0) {
            return null;
        }

        // 3. Construct Gemini prompt for micro-environment analysis
        const prompt = `You are a Geophysics & Civil Engineering Inspector analyzing 360-degree Street View panoramas for property audit.
Address/Location: ${address}
Coordinates: ${lat}, ${lon}

Examine the provided street view images and write a detailed, professional micro-environmental analysis (120-150 words).
Focus on:
1. Road Width & Access: Is it wide enough for fire trucks/emergency vehicles?
2. Building Density & Construction Quality: Are nearby buildings robust, masonry, or informal?
3. Infrastructure & Utilities: Overhead cables condition, drainage gutters cleanliness and depth.
4. Topography & Greenery: Slope, signs of erosion, land support, trees/vegetation.

Write the output in Indonesian. Keep it concise, professional, and clear for a home buyer. Do not mention "image 1", "image 2" or "the prompt" in your analysis. Present it as a unified visual analysis report.`;

        // 4. Call Gemini proxy with the images and prompt
        const payload = {
            model: GEMINI_MODEL,
            contents: [{
                role: "user",
                parts: [
                    { text: prompt },
                    ...imagesParts
                ]
            }],
            generationConfig: {
                maxOutputTokens: 500,
                temperature: 0.4
            }
        };

        const response = await axios.post(`${backendBase}/api/ai/gemini`, payload, { timeout: 30000 });
        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        return text?.trim() || null;

    } catch (e) {
        console.warn("[S.A.F.E] Street View analysis failed:", e.message || e);
        return null;
    }
};

// ═══════════════════════════════════════════════════════════════════
// POI & DATA FETCHING
// ═══════════════════════════════════════════════════════════════════

const getNearbyPois = async (lat, lon) => {
    // Simplified query — fewer node types, tighter radius, faster response
    const query = `[out:json][timeout:4];(node(around:150,${lat},${lon})["waterway"];way(around:150,${lat},${lon})["waterway"];node(around:150,${lat},${lon})["highway"];);out tags 4;`;
    try {
        const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
        const res = await axios.get(url, {timeout: 4500});
        const features = [];
        if (res.data && res.data.elements) {
            res.data.elements.forEach(el => {
                const tags = el.tags || {};
                const name = tags.name || tags.waterway || tags.amenity || tags.highway;
                if (name) features.push(name);
            });
        }
        return [...new Set(features)].slice(0, 5);
    } catch(e) {
        console.warn("Overpass failed", e);
        return [];
    }
};

export const extractCoords = async (input) => {
    const rawMatch = input.match(/^(-?\d+\.\d+)[\s,]+(-?\d+\.\d+)$/);
    if (rawMatch) return { lat: parseFloat(rawMatch[1]), lon: parseFloat(rawMatch[2]) };

    const regexList = [/@(-?\d+\.\d+),(-?\d+\.\d+)/, /ll=(-?\d+\.\d+),(-?\d+\.\d+)/, /q=(-?\d+\.\d+),(-?\d+\.\d+)/];
    for (let r of regexList) {
        const match = input.match(r);
        if (match) return { lat: parseFloat(match[1]), lon: parseFloat(match[2]) };
    }

    if (input.includes('goo.gl') || input.includes('maps.app.goo.gl')) {
        try {
            const res = await axios.get(`https://api.allorigins.win/get?url=${encodeURIComponent(input)}`);
            const contents = res.data.contents;
            const redirectMatch = contents.match(/URL='([^']+)'/i) || contents.match(/window\.location\.replace\('([^']+)'\)/);
            if (redirectMatch) {
                for (let r of regexList) {
                    const match = redirectMatch[1].match(r);
                    if (match) return { lat: parseFloat(match[1]), lon: parseFloat(match[2]) };
                }
            }
        } catch(e) {
            console.warn("Could not extract via proxy", e);
        }
    }

    return null;
};

// ═══════════════════════════════════════════════════════════════════
// MAIN DATA FETCH — Enhanced with nationwide coverage
// ═══════════════════════════════════════════════════════════════════

const T = (ms) => ({ timeout: ms }); // shorthand for axios timeout

export const fetchGeospatialData = async (lat, lon) => {
    try {
        const bnpbBase = 'https://gis.bnpb.go.id/server/rest/services/inarisk';
        const bnpbParams = `geometry=${lon},${lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&distance=500&units=esriSRUnit_Meter&f=json&outFields=KLAS_BAHA`;

        const [geoRes, meteoRes, aqiRes, usgsRes, floodRes, landslideRes, nearby] = await Promise.all([
            axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, T(4000)).catch(() => ({data: {display_name: "Unknown Location"}})),
            axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=relative_humidity_2m,temperature_2m`, T(4000)).catch(() => ({data: {current: {relative_humidity_2m: 70, temperature_2m: 30}, elevation: 0}})),
            axios.get(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm2_5,european_aqi`, T(4000)).catch(() => ({data: {current: {pm2_5: 15, european_aqi: 20}}})),
            axios.get(`https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=${lat}&longitude=${lon}&maxradiuskm=100&minmagnitude=4.5&limit=1&orderby=time`, T(4000)).catch(() => ({data: {features: []}})),
            axios.get(`${bnpbBase}/layer_bahaya_banjir_30/MapServer/0/query?${bnpbParams}`, T(4000)).catch(() => ({data: {features: []}})),
            axios.get(`${bnpbBase}/layer_bahaya_tanah_longsor_30/MapServer/0/query?${bnpbParams}`, T(4000)).catch(() => ({data: {features: []}})),
            getNearbyPois(lat, lon)
        ]);

        const address = geoRes.data.display_name || "Unknown Location";
        const elevasi = meteoRes.data.elevation || 0;

        const addrObj = geoRes.data.address || {};

        let distanceToFeature = 0;
        if (geoRes.data.lat && geoRes.data.lon) {
            distanceToFeature = haversine(lat, lon, parseFloat(geoRes.data.lat), parseFloat(geoRes.data.lon));
        }

        const isOcean = !!(
            addrObj.ocean || 
            addrObj.sea || 
            addrObj.water || 
            geoRes.data.type === 'sea' || 
            geoRes.data.type === 'ocean' || 
            (geoRes.data.category === 'natural' && geoRes.data.type === 'water') ||
            /\b(ocean|sea|laot|laut|selat|strait|bay|teluk)\b/i.test(address) ||
            (address === "Unknown Location" && elevasi <= 0) ||
            geoRes.data.error ||
            (elevasi <= 0 && distanceToFeature > 0.4)
        );

        const liq = calcLiquefaction(lat, lon, elevasi);
        const fault = getNearestPoint(lat, lon, ACTIVE_FAULTS);
        const nearFaults = getTopNNearest(lat, lon, ACTIVE_FAULTS, 3);
        const volcano = getNearestPoint(lat, lon, VOLCANOES);
        const nearVolcanoes = getTopNNearest(lat, lon, VOLCANOES, 2);
        const mega = getNearestPoint(lat, lon, MEGATHRUST);
        const coast = getNearestPoint(lat, lon, COASTLINE);

        let tsunamiRisk = "RENDAH";
        if (isOcean) {
            tsunamiRisk = "EKSTREM (LAUTAN)";
        } else {
            if (coast.dist < 5 && elevasi < 20) tsunamiRisk = "MODERAT";
            if (coast.dist < 3 && elevasi < 15) tsunamiRisk = "MODERAT-TINGGI";
            if (coast.dist < 1 && elevasi < 7) tsunamiRisk = "TINGGI";
        }

        let floodHazard = "RENDAH/TIDAK TERDETEKSI";
        let floodRiskVal = 10;
        if (isOcean) {
            floodHazard = "SANGAT TINGGI (PERAIRAN)";
            floodRiskVal = 100;
        } else if (floodRes.data.features && floodRes.data.features.length > 0) {
            floodHazard = "TINGGI";
            floodRiskVal = 85;
        }

        let landslideHazard = "RENDAH";
        let landslideRiskVal = 10;
        if (isOcean) {
            landslideHazard = "TIDAK ADA (PERAIRAN)";
            landslideRiskVal = 0;
        } else if (landslideRes.data.features && landslideRes.data.features.length > 0) {
            landslideHazard = "TINGGI/RAWAN";
            landslideRiskVal = 80;
        }

        if (isOcean) {
            liq.fs = 0.0;
            liq.riskScore = 100;
            liq.siteClass = "WATER";
            liq.status = "RAWAN EKSTREM (LAUTAN)";
        }

        // Multiple historical earthquakes for richer context
        const historicalEqs = (usgsRes.data.features || []).map(f => ({
            magnitude: f.properties?.mag,
            place: f.properties?.place,
            date: f.properties?.time ? new Date(f.properties.time).toLocaleString() : null,
            depth: f.properties?.depth
        })).filter(e => e.magnitude);

        const compressedPayload = {
            address: isOcean ? `${address} (Kawasan Perairan / Lautan)` : address,
            coordinates: { lat, lon },
            nearby_env: nearby,
            elevasi: `${elevasi}m`,
            reference_pga_city: liq.nearestCity,
            liquefaction_analysis: {
                fs_score: liq.fs,
                status: liq.status,
                vs30_est: isOcean ? "N/A" : `${liq.vs30} m/s`,
                site_class: liq.siteClass,
                pga_design_base: liq.pga,
                amplification_fa: liq.fa,
                pga_surface: parseFloat(liq.pgaSurface.toFixed(3))
            },
            seismotectonic: {
                nearest_fault: { name: fault.name, dist_km: fault.dist },
                other_nearby_faults: nearFaults.slice(1).map(f => `${f.name} (${f.dist}km)`),
                nearest_volcano: { name: volcano.name, dist_km: volcano.dist },
                other_nearby_volcanoes: nearVolcanoes.slice(1).map(v => `${v.name} (${v.dist}km)`),
                megathrust: { name: mega.name, dist_km: mega.dist }
            },
            tsunami_analysis: { risk_level: tsunamiRisk, dist_to_coast_km: coast.dist, nearest_coast: coast.name },
            flood_hazard: floodHazard,
            landslide_hazard: landslideHazard,
            env_extras: {
                aqi: isOcean ? 0 : aqiRes.data.current?.european_aqi,
                pm25: isOcean ? "0 µg/m³" : `${aqiRes.data.current?.pm2_5} µg/m³`,
                temperature: `${meteoRes.data.current?.temperature_2m}°C`,
                humidity: `${meteoRes.data.current?.relative_humidity_2m}%`
            },
            historical_earthquakes: historicalEqs.length > 0 ? historicalEqs : null
        };

        let seismicRisk = 20;
        if (isOcean) {
            seismicRisk = 100;
        } else {
            if (fault.dist < 5) seismicRisk = 95;
            else if (fault.dist < 10) seismicRisk = 90;
            else if (fault.dist < 20) seismicRisk = 70;
            else if (fault.dist < 30) seismicRisk = 60;
            else if (fault.dist < 50) seismicRisk = 40;
        }

        let aqiRisk = isOcean ? 0 : (aqiRes.data.current?.european_aqi || 20);

        return {
            coords: { lat, lon },
            address: isOcean ? `${address} (Kawasan Perairan / Lautan)` : address,
            elevasi,
            isOcean,
            vs30: liq.vs30,
            siteClass: liq.siteClass,
            seismic: {
                faultName: fault.name,
                faultDist: fault.dist,
                pgaBase: liq.pga,
                pgaSurface: liq.pgaSurface
            },
            radarData: {
                flood: floodRiskVal,
                soil: liq.riskScore,
                air: aqiRisk,
                seismic: seismicRisk,
                landslide: landslideRiskVal
            },
            compressedPayload
        };
    } catch(e) {
        console.error("Data fetch error", e);
        throw e;
    }
};

// ═══════════════════════════════════════════════════════════════════
// AI CALL FUNCTIONS
// ═══════════════════════════════════════════════════════════════════



export const callAIRobust = async (sysPrompt, userPrompt, responseMimeType = null, maxOutputTokens = 2048, temperature = 0.4, signal = null) => {
    const USE_BACKEND = import.meta.env.VITE_USE_BACKEND === 'true';
    const backendBase = import.meta.env.PROD ? '' : 'http://localhost:3001';

    // Helper functions for each stage to avoid code duplication
    const tryBackendGemini = async () => {
        const payload = {
            model: GEMINI_MODEL,
            contents: [{ role: "user", parts: [{ text: sysPrompt + "\n\n" + userPrompt }] }],
            generationConfig: { maxOutputTokens, temperature }
        };
        if (responseMimeType) {
            payload.generationConfig.responseMimeType = responseMimeType;
        }
        const response = await axios.post(`${backendBase}/api/ai/gemini`, payload, { timeout: 30000, signal });
        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
        throw new Error("Empty response from backend Gemini proxy");
    };

    const tryFreeLLMAPI = async () => {
        const adjustedSysPrompt = responseMimeType === 'application/json' 
            ? `${sysPrompt}\n\nIMPORTANT: Respond ONLY with a valid JSON object. Do not include markdown code blocks, backticks, or any conversational text. Return raw JSON.`
            : sysPrompt;
        
        const payload = {
            model: "auto",
            messages: [
                { role: "system", content: adjustedSysPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: temperature
        };
        if (responseMimeType === 'application/json') {
            payload.response_format = { type: "json_object" };
        }
        
        const response = await axios.post(`${backendBase}/api/ai/freellmapi`, payload, { timeout: 30000, signal });
        const text = response.data?.choices?.[0]?.message?.content;
        if (text) return text;
        throw new Error("Empty response from FreeLLMAPI proxy");
    };

    const tryBackendOpenRouter = async () => {
        const adjustedSysPrompt = responseMimeType === 'application/json' 
            ? `${sysPrompt}\n\nIMPORTANT: Respond ONLY with a valid JSON object. Do not include markdown code blocks, backticks, or any conversational text. Return raw JSON.`
            : sysPrompt;
        
        const response = await axios.post(`${backendBase}/api/ai/openrouter`, {
            model: "google/gemma-2-9b-it:free",
            messages: [
                { role: "system", content: adjustedSysPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: temperature
        }, { timeout: 30000, signal });
        const text = response.data.choices[0].message.content;
        if (text) return text;
        throw new Error("Empty response from backend OpenRouter proxy");
    };

    const tryDirectGemini = async () => {
        const payload = {
            contents: [{ role: "user", parts: [{ text: sysPrompt + "\n\n" + userPrompt }] }],
            generationConfig: { maxOutputTokens, temperature }
        };
        if (responseMimeType) {
            payload.generationConfig.responseMimeType = responseMimeType;
        }
        const response = await axios.post(GEMINI_URL, payload, { timeout: 30000, signal });
        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
        throw new Error("Empty response from direct Gemini");
    };

    const tryDirectOpenRouter = async () => {
        const adjustedSysPrompt = responseMimeType === 'application/json' 
            ? `${sysPrompt}\n\nIMPORTANT: Respond ONLY with a valid JSON object. Do not include markdown code blocks, backticks, or any conversational text. Return raw JSON.`
            : sysPrompt;
        
        const orRes = await axios.post(OPENROUTER_URL, {
            model: "google/gemma-2-9b-it:free",
            messages: [
                { role: "system", content: adjustedSysPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: temperature
        }, {
            headers: { 'Authorization': `Bearer ${OPENROUTER_API_KEY}` },
            timeout: 30000, signal
        });
        const text = orRes.data.choices[0].message.content;
        if (text) return text;
        throw new Error("Empty response from direct OpenRouter");
    };

    const tryLocalOllama = async () => {
        const ollamaRes = await axios.post("http://localhost:11434/api/chat", {
            model: "gemma",
            messages: [
                { role: "system", content: sysPrompt },
                { role: "user", content: userPrompt }
            ],
            stream: false
        }, { timeout: 30000, signal });
        const text = ollamaRes.data.message.content;
        if (text) return text;
        throw new Error("Empty response from local Ollama");
    };

    // Helper: retry once after delay if we hit a rate limit (429)
    const withRateLimitRetry = async (fn, retryDelay = 3000) => {
        try {
            return await fn();
        } catch (e) {
            if (axios.isCancel(e) || e.name === 'CanceledError' || signal?.aborted) throw e;
            const status = e.response?.status;
            if (status === 429 || status === 503) {
                console.warn(`Rate limited (${status}), retrying in ${retryDelay}ms...`);
                await new Promise(r => setTimeout(r, retryDelay));
                if (signal?.aborted) throw new Error('canceled');
                return await fn();
            }
            throw e;
        }
    };

    // Execution sequence based on USE_BACKEND flag
    if (USE_BACKEND) {
        // Mode A: Try backend first, then fallback to direct client-side
        try {
            return await withRateLimitRetry(tryBackendGemini);
        } catch (e) {
            if (axios.isCancel(e) || e.name === 'CanceledError' || signal?.aborted) throw e;
            console.warn("Backend Gemini failed, trying FreeLLMAPI...", e.message || e);
        }

        try {
            return await tryFreeLLMAPI();
        } catch (e) {
            if (axios.isCancel(e) || e.name === 'CanceledError' || signal?.aborted) throw e;
            console.warn("FreeLLMAPI failed, trying backend OpenRouter...", e.message || e);
        }

        try {
            return await tryBackendOpenRouter();
        } catch (e) {
            if (axios.isCancel(e) || e.name === 'CanceledError' || signal?.aborted) throw e;
            console.warn("Backend OpenRouter failed, trying direct Gemini...", e.message || e);
        }
    }

    // Direct browser client-side flow (Primary if USE_BACKEND=false, or fallback if backend failed)
    try {
        return await withRateLimitRetry(tryDirectGemini);
    } catch (e) {
        if (axios.isCancel(e) || e.name === 'CanceledError' || signal?.aborted) throw e;
        console.warn("Direct Gemini failed, trying direct OpenRouter...", e.message || e);
    }

    try {
        return await tryDirectOpenRouter();
    } catch (e) {
        if (axios.isCancel(e) || e.name === 'CanceledError' || signal?.aborted) throw e;
        console.warn("Direct OpenRouter failed, trying local Ollama...", e.message || e);
    }

    try {
        return await tryLocalOllama();
    } catch (e) {
        if (axios.isCancel(e) || e.name === 'CanceledError' || signal?.aborted) throw e;
        console.error("All AI Models failed to respond.", e.message || e);
        throw new Error("All AI models failed");
    }
};

export const callAI = async (sysPrompt, userPrompt, useOpenRouter = false, signal = null) => {
    return callAIRobust(sysPrompt, userPrompt, null, 4096, 0.5, signal);
};

// ═══════════════════════════════════════════════════════════════════
// CALL 1 — FAST summary cards (no knowledge base, tiny output ~350 tok)
// Returns: { geoStabilityExplanation, seismicExplanation,
//            floodEnvExplanation, microAnalysis, streetViewUsed }
// ═══════════════════════════════════════════════════════════════════

export const generateSummaryCards = async (propertyData, lang = 'id', signal = null) => {
    const isEnglish = lang === 'en';
    const d = propertyData.compressedPayload ?? propertyData;

    // Slim payload — only the fields AI needs for summary cards (saves input tokens)
    const slimPayload = {
        address: d.address ?? propertyData.address,
        coords: d.coordinates ?? propertyData.coordinates,
        vs30: d.liquefaction_analysis?.vs30_est,
        site_class: d.liquefaction_analysis?.site_class,
        liquefaction_fs: d.liquefaction_analysis?.fs_score,
        liquefaction_risk: d.liquefaction_analysis?.status,
        pga: d.liquefaction_analysis?.pga_surface,
        nearest_fault: d.seismotectonic?.nearest_fault,
        elevation_m: d.elevasi,
        flood_risk: d.flood_hazard,
        aqi: d.env_extras?.aqi,
        tsunami_risk: d.tsunami_analysis?.risk_level,
    };

    const sysPrompt = isEnglish
        ? `You are S.A.F.E AI, a geophysics risk consultant for Indonesia. Given geospatial data, return a JSON object with EXACTLY these fields (English, concise):
- "geoStabilityExplanation": 1-2 sentences on Vs30/site-class/liquefaction
- "seismicExplanation": 1-2 sentences on PGA/nearest fault name & distance
- "floodEnvExplanation": 1-2 sentences on flood risk/AQI/elevation
- "microAnalysis": 50-60 word paragraph on micro-environment (urban density, drainage, road access). Start with "(Preliminary Analysis — Street View scan in progress...)"
- "streetViewUsed": false
Respond ONLY with valid JSON. No markdown blocks.`
        : `Anda adalah S.A.F.E AI, konsultan risiko geofisika untuk Indonesia. Berikan objek JSON dengan TEPAT 4 field berikut (Bahasa Indonesia, ringkas):
- "geoStabilityExplanation": 1-2 kalimat tentang Vs30/kelas situs/likuifaksi
- "seismicExplanation": 1-2 kalimat tentang PGA/nama sesar terdekat & jaraknya
- "floodEnvExplanation": 1-2 kalimat tentang risiko banjir/AQI/elevasi
- "microAnalysis": paragraf 50-60 kata tentang mikro lingkungan (kepadatan urban, drainase, akses jalan). Mulai dengan "(Analisis Awal — Pemindaian Street View sedang berjalan...)"
- "streetViewUsed": false
Balas HANYA dengan JSON valid. Tanpa markdown blocks.`;

    try {
        // 1500 tokens needed for JSON response (was 600 — caused MAX_TOKENS truncation)
        const text = await callAIRobust(sysPrompt, JSON.stringify(slimPayload), 'application/json', 1500, 0.3, signal);
        const start = text.indexOf('{'); const end = text.lastIndexOf('}');
        const result = JSON.parse(start !== -1 ? text.substring(start, end + 1) : text);
        result.streetViewUsed = false;
        return result;
    } catch (e) {
        if (axios.isCancel(e) || e.name === 'CanceledError' || signal?.aborted) throw e;
        const isOffline = e.code === 'ERR_NETWORK' || e.message?.includes('Network Error') || !navigator.onLine;
        
        // Procedural / Rule-based Fallback (Always Ready)
        const vsText = slimPayload.vs30 ? `Vs30 ${Math.round(slimPayload.vs30)}m/s (${slimPayload.site_class})` : 'Data tanah terbatas';
        const liqText = slimPayload.liquefaction_fs ? `FS ${slimPayload.liquefaction_fs.toFixed(2)} (${slimPayload.liquefaction_risk})` : '';
        const faultText = slimPayload.nearest_fault ? `Sesar terdekat adalah ${slimPayload.nearest_fault.name} berjarak ${(slimPayload.nearest_fault.distance/1000).toFixed(1)}km.` : '';
        
        return {
            aiError: true, offline: isOffline,
            geoStabilityExplanation: isEnglish 
                ? `Site analysis shows ${vsText}. Liquefaction risk is estimated at ${liqText}.`
                : `Analisis situs menunjukkan ${vsText}. Potensi likuifaksi diestimasi pada ${liqText}.`,
            seismicExplanation: isEnglish
                ? `Regional PGA is ${slimPayload.pga}g. ${faultText}`
                : `Nilai PGA regional adalah ${slimPayload.pga}g. ${faultText}`,
            floodEnvExplanation: isEnglish
                ? `Elevation is ${slimPayload.elevation_m}m. Flood risk is ${slimPayload.flood_risk}. AQI is ${slimPayload.aqi}.`
                : `Elevasi lokasi ${slimPayload.elevation_m}m dpl. Risiko banjir ${slimPayload.flood_risk}. Kualitas udara (AQI) ${slimPayload.aqi}.`,
            microAnalysis: isEnglish
                ? "(Offline Mode) AI analysis unavailable. Relying on rule-based geospatial inference."
                : "(Mode Luring) Analisis AI awan tidak tersedia. Menggunakan inferensi geospasial berbasis aturan lokal.",
            streetViewUsed: false,
        };
    }
};


// ═══════════════════════════════════════════════════════════════════
// CALL 2 — BACKGROUND detailed report (full knowledge base, markdown)
// Returns: string (markdown) — runs after summary cards are shown
// ═══════════════════════════════════════════════════════════════════

export const generateDetailedReport = async (propertyData, lang = 'id', signal = null) => {
    const isEnglish = lang === 'en';
    const langInstruction = isEnglish
        ? 'Write ALL output in English. Explain every technical term in simple language immediately after using it.'
        : 'Tulis SEMUA output dalam Bahasa Indonesia yang mudah dipahami orang awam. Setiap istilah teknis WAJIB dijelaskan artinya dalam tanda kurung atau kalimat berikutnya.';

    const reportSectionsID = [
        '### RINGKASAN EKSEKUTIF',
        'Tulis 4-5 kalimat untuk calon pembeli awam. Apa gambaran risiko keseluruhan properti ini? Apakah layak dibeli? Perkirakan S.A.F.E Score (0-100, makin tinggi makin aman). Sebutkan bencana historis nyata yang pernah terjadi di area ini.',
        '',
        '---',
        '',
        '### ANALISIS GEOTEKNIK (Kondisi Tanah)',
        'Jelaskan kondisi tanah dengan bahasa yang mudah dipahami:',
        '- Nilai Vs30: tanah ini sekeras batu, padat, atau selunak lumpur? Apa artinya untuk fondasi bangunan?',
        '- Risiko likuifaksi (tanah yang "meleleh" saat gempa): nilai FS-nya berapa dan artinya apa? Jika FS < 1.0 jelaskan bahaya konkretnya.',
        '- Jenis fondasi yang dibutuhkan â€” dangkal atau perlu tiang pancang? Estimasi biaya tambahan fondasi dalam jika diperlukan.',
        '- Perbandingan kondisi tanah ini dengan wilayah sekitarnya.',
        '',
        '---',
        '',
        '### BAHAYA GEMPA BUMI & TEKTONIK',
        'Jelaskan risiko gempa dalam bahasa awam:',
        '- Nama sesar (patahan) aktif terdekat. Berapa jarak dari properti ini? Bandingkan dengan jarak yang familiar (mis. "sejauh Jakarta-Bandung").',
        '- Nilai PGA (Percepatan Tanah Puncak) â€” ini setara guncangan seberapa kuat? Apakah bisa dirasakan? Apakah merusak bangunan biasa?',
        '- Riwayat gempa historis di wilayah ini â€” sebutkan contoh konkret dengan tahun dan dampaknya.',
        '- Apakah ada zona megathrust di dekat sini? Apa kaitannya dengan risiko tsunami?',
        '',
        '---',
        '',
        '### RISIKO BANJIR & KUALITAS LINGKUNGAN',
        'Jelaskan kondisi banjir dan lingkungan hidup:',
        '- Level risiko banjir dari data BNPB InaRISK â€” artinya apa secara praktis? (contoh: potensi genangan setinggi berapa saat hujan lebat?)',
        '- Ketinggian lokasi di atas permukaan laut dan dampaknya terhadap risiko banjir atau banjir rob',
        '- AQI (Indeks Kualitas Udara): angkanya berapa dan artinya apa untuk kesehatan pernapasan jangka panjang?',
        '- Risiko tsunami: berapa jarak ke pantai terdekat? Apa artinya untuk tingkat risiko?',
        '- Kondisi drainase dan topografi yang mempengaruhi risiko banjir lokal',
        '',
        '---',
        '',
        '### ANALISIS MIKRO-LINGKUNGAN',
        'Berdasarkan alamat dan kawasan ini:',
        '- Karakter kawasan: permukiman padat, campuran komersial, atau industri?',
        '- Kualitas akses jalan dan jalur evakuasi darurat yang tersedia',
        '- Kedekatan dengan rumah sakit, pemadam kebakaran, dan pos BPBD',
        '- Kualitas infrastruktur dasar: air bersih, listrik, sanitasi',
        '- Faktor lingkungan sosial yang relevan untuk keamanan dan kenyamanan',
        '',
        '---',
        '',
        '### PERSYARATAN BANGUNAN (SNI & Regulasi)',
        'Apa yang wajib dipenuhi bangunan di lokasi ini:',
        '- SNI 1726:2019 (Desain Gempa): zona seismik dan beban desain yang berlaku untuk lokasi ini',
        '- SNI 2847:2019 (Beton Bertulang): persyaratan khusus untuk kelas situs tanah ini',
        '- Jika ada risiko likuifaksi (FS < 1.0): sistem fondasi yang diwajibkan dan estimasi biaya tambahan',
        '- Perizinan yang perlu dicek sebelum membeli atau membangun (IMB, KRK, dll.)',
        '',
        '---',
        '',
        '### REKOMENDASI MITIGASI RISIKO',
        'Berikan 5-7 langkah konkret dengan format:',
        '',
        '**[Nomor]. [Nama Tindakan]**',
        '- Apa yang harus dilakukan: [penjelasan detail]',
        '- Mengapa penting: [dampak jika diabaikan]',
        '- Estimasi biaya: Rp [X - Y juta]',
        '- Prioritas: WAJIB (sebelum ditempati) / DISARANKAN (dalam 1 tahun) / JANGKA PANJANG (3-5 tahun)',
        '',
        '---',
        '',
        '### PERSPEKTIF INVESTASI',
        '- Apakah harga properti mencerminkan level risikonya? Apakah ada premium risiko yang seharusnya didiskon?',
        '- Berapa estimasi biaya mitigasi total yang perlu diperhitungkan dalam negosiasi harga?',
        '- Bagaimana prospek nilai jual kembali properti di zona risiko ini dalam 5-10 tahun ke depan?',
        '- Adakah program pemerintah (BPBD, BNPB, KPR bersubsidi) yang bisa membantu?',
        '',
        '---',
        '',
        '### REFERENSI DATA & DISCLAIMER',
        '- Sumber data: BNPB InaRISK, USGS Earthquake Hazards Program, BMKG via Open-Meteo, SNI 1726:2019, SNI 2847:2019',
        '- DISCLAIMER: Laporan S.A.F.E AI ini dibuat berdasarkan data publik yang tersedia. Laporan ini BUKAN pengganti survei geoteknik profesional langsung di lapangan. Selalu konsultasikan dengan ahli geoteknik bersertifikat sebelum mengambil keputusan pembelian final.'
    ].join('\n');

    const reportSectionsEN = [
        '### EXECUTIVE SUMMARY',
        'Write 4-5 sentences for a layperson buyer. Overall risk picture? Safe to buy? Estimated S.A.F.E Score (0-100, higher = safer)? Mention historical disasters that have affected this area.',
        '',
        '---',
        '',
        '### GEOTECHNICAL ANALYSIS (Soil Conditions)',
        'Explain soil quality in plain English:',
        '- Vs30: is this ground like hard rock, firm soil, or soft clay? What does it mean for building strength?',
        '- Liquefaction risk (soil behaving like liquid during an earthquake): what is the FS score? If FS < 1.0 explain the concrete danger.',
        '- Foundation type needed and extra cost estimate if deep piles are required.',
        '- How does this compare to conditions elsewhere in the region?',
        '',
        '---',
        '',
        '### EARTHQUAKE & TECTONIC HAZARD',
        '- Name the nearest active fault and its distance (compare to a relatable distance).',
        '- PGA value: what level of shaking? Can it be felt? Will it damage buildings?',
        '- Historical earthquakes in this region â€” specific examples with years and impacts.',
        '- Megathrust zone and tsunami risk connection.',
        '',
        '---',
        '',
        '### FLOOD & ENVIRONMENTAL RISK',
        '- Flood risk level from BNPB InaRISK â€” practical implications.',
        '- Elevation and flood/tidal flooding exposure.',
        '- AQI level and long-term health impacts.',
        '- Tsunami risk and distance to coast.',
        '- Local drainage and topography.',
        '',
        '---',
        '',
        '### MICRO-ENVIRONMENT ANALYSIS',
        '- Neighborhood character (residential, commercial, mixed).',
        '- Road access and emergency evacuation routes.',
        '- Proximity to hospitals, fire stations, emergency services.',
        '- Infrastructure quality (water, electricity, sanitation).',
        '- Social environment factors relevant to safety.',
        '',
        '---',
        '',
        '### BUILDING CODE REQUIREMENTS (SNI & Regulations)',
        '- SNI 1726:2019: seismic zone and design loads for this location.',
        '- SNI 2847:2019: special requirements for this soil class.',
        '- If liquefaction risk: required foundation system and cost implications.',
        '- Permits to verify before buying or building.',
        '',
        '---',
        '',
        '### MITIGATION RECOMMENDATIONS',
        'Provide 5-7 concrete numbered steps:',
        '',
        '**[Number]. [Action Name]**',
        '- What to do: [detailed explanation]',
        '- Why it matters: [consequences of ignoring it]',
        '- Estimated cost: IDR [X - Y million]',
        '- Priority: REQUIRED (before move-in) / RECOMMENDED (within 1 year) / LONG-TERM (3-5 years)',
        '',
        '---',
        '',
        '### INVESTMENT PERSPECTIVE',
        '- Does the price reflect the hazard level? Should there be a risk discount?',
        '- Total mitigation cost estimate to factor into price negotiation.',
        '- Resale value prospects in this risk zone over 5-10 years.',
        '- Any government assistance programs available?',
        '',
        '---',
        '',
        '### REFERENCES & DISCLAIMER',
        '- Data sources: BNPB InaRISK, USGS Earthquake Hazards Program, BMKG via Open-Meteo, SNI 1726:2019, SNI 2847:2019',
        '- DISCLAIMER: This S.A.F.E AI report is based on publicly available data. It is NOT a replacement for on-site professional geotechnical survey. Always consult a certified geotechnical engineer before making a final purchase decision.'
    ].join('\n');

    const reportTemplate = isEnglish ? reportSectionsEN : reportSectionsID;
    const title = isEnglish ? 'S.A.F.E HOUSE PROPERTY RISK AUDIT REPORT' : 'HASIL AUDIT RISIKO PROPERTI S.A.F.E HOUSE';

    const sysPrompt = `You are S.A.F.E AI, a senior Geophysics & Property Risk Consultant specializing in Indonesian geology (SNI 1726:2019, SNI 2847:2019). You write thorough, human-readable, layperson-friendly property risk audit reports.

${langInstruction}

DOMAIN KNOWLEDGE (reference where relevant):
${INDONESIA_RISK_KNOWLEDGE}

TECHNICAL INTERPRETATION:
- Vs30 < 180 = SE class (very soft, extreme amplification, high liquefaction risk)
- Vs30 180-360 = SD class (stiff soil, moderate risk)
- Vs30 > 360 = SC/SB class (dense soil/rock, lower risk)
- FS < 1.0 = liquefaction LIKELY â€” deep pile foundations required (extra Rp 50-200 juta)
- FS 1.0-1.5 = liquefaction possible
- PGA < 0.2g = low seismic hazard; 0.2-0.4g = moderate; > 0.4g = high hazard
- AQI < 50 = Good; 50-100 = Moderate; 100-150 = Unhealthy for sensitive groups

INSTRUCTIONS:
- Be THOROUGH â€” this helps people make a safe, informed property decision
- Use simple, empathetic language â€” the reader may be buying their first home
- Every technical term MUST be explained in plain language immediately
- Give SPECIFIC cost estimates in Rupiah
- Aim for around 550-600 words of high-density, concise yet thorough risk assessment
- Fill in ALL sections completely — do not leave any section brief
- Plain markdown only — NO emoji, NO box-drawing, NO code blocks

# ${title}

${reportTemplate}`;

    try {
        const text = await callAIRobust(sysPrompt, JSON.stringify(propertyData.compressedPayload), null, 1500, 0.45, signal);
        return text?.trim() ?? null;
    } catch (e) {
        if (axios.isCancel(e) || e.name === 'CanceledError' || signal?.aborted) throw e;
        console.warn('[S.A.F.E] Detailed report failed:', e.message);
        
        const d = propertyData.compressedPayload ?? propertyData;
        const fallbackText = lang === 'en' 
            ? `## S.A.F.E AI Detailed Report Unavailable\n\nThe AI service encountered an error while generating the full report (${e.message}). However, you can rely on the summary cards above for the core risk assessment.`
            : `## Laporan Lengkap S.A.F.E AI Tidak Tersedia\n\nLayanan AI mengalami kendala saat menghasilkan laporan lengkap (${e.message}). Namun, Anda tetap dapat mengandalkan kartu ringkasan di atas untuk penilaian risiko utama.`;
        return fallbackText;
    }
};

// ═══════════════════════════════════════════════════════════════════
// LEGACY COMBINED — kept for battle report fallback compatibility
// ═══════════════════════════════════════════════════════════════════

export const generateSiteAuditReport = async (propertyData, lang = 'id', signal = null) => {
    const isEnglish = lang === 'en';
    const streetViewContext = isEnglish
        ? `\n\nMICRO ENVIRONMENT: Use your knowledge of Indonesian geography, the address provided, elevation data, and the nearby_env features to write an intelligent micro-environmental inference. Include typical characteristics of this type of area in Indonesia (urban density, drainage quality, road access conditions). A real Street View visual scan will be appended after this report is shown to the user.`
        : `\n\nMICRO ENVIRONMENT: Gunakan pengetahuan Anda tentang geografi Indonesia, alamat yang diberikan, data elevasi, dan fitur nearby_env untuk menulis inferensi mikro-lingkungan yang cerdas. Sertakan karakteristik umum area jenis ini di Indonesia (kepadatan urban, kualitas drainase, kondisi akses jalan). Pemindaian Street View visual nyata akan ditambahkan setelah laporan ini ditampilkan kepada pengguna.`;

    const langInstruction = isEnglish
        ? 'IMPORTANT: Write ALL output in English. Use Indonesian place names and technical terms (e.g., sesar, likuifaksi) where standard, but all explanations, headers, and narrative must be in English.'
        : 'IMPORTANT: Tulis SEMUA output dalam Bahasa Indonesia. Gunakan istilah teknis (Vs30, PGA, FS) dengan penjelasan sederhana.';

    const sysPrompt = `You are S.A.F.E AI, a senior Geophysics & Property Risk Consultant specializing in Indonesian geology (SNI 1726:2019, SNI 2847:2019).

${langInstruction}

DOMAIN CONTEXT (use selectively — only reference what's relevant to THIS location):
${INDONESIA_RISK_KNOWLEDGE}

EVALUATION CRITERIA:
- Vs30: SE<180=soft/extreme amplification, SD 180-360=stiff, SC>360=dense/rock
- FS<1.0 = liquefaction risk, recommend deep foundations
- Cross-reference with regional profiles (Bandung=Lembang, Yogya=Opak, Jakarta Utara=subsidence, Palu=liquefaction)
- Flood: check nearby_env for waterways, elevation for coastal/rob risk
- AQI: note Kalimantan haze season Jun-Oct if relevant
${streetViewContext}

Return JSON with these fields (${isEnglish ? 'English' : 'Bahasa Indonesia'}):
- "geoStabilityExplanation": 1-2 sentences on Vs30/liquefaction/site class
- "seismicExplanation": 1-2 sentences on PGA/fault distance/fault name
- "floodEnvExplanation": 1-2 sentences on flood/tsunami/AQI
- "microAnalysis": 100-150 word paragraph on micro-environment (building density, drainage, road access, topography). ${isEnglish ? 'Start with "(Preliminary Analysis -- Street View scan in progress...)"' : 'Start with "(Analisis Awal -- Pemindaian Street View sedang berjalan...)"'}
- "streetViewUsed": false
- "detailedReport": Concise markdown report (~600 words max)

IMPORTANT: Do NOT use emoji or special unicode characters (like box-drawing lines) in the output. Use only plain ASCII text for headings and separators. Use markdown --- for horizontal rules.

Respond ONLY with valid JSON. Do not include markdown blocks like \`\`\`json.`;

    const userPrompt = JSON.stringify(propertyData.compressedPayload);

    try {
        const text = await callAIRobust(sysPrompt, userPrompt, 'application/json', 4096, 0.4, signal);
        let jsonStr = text;
        
        // Extract JSON robustly
        const startIdx = jsonStr.indexOf('{');
        const endIdx = jsonStr.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
            jsonStr = jsonStr.substring(startIdx, endIdx + 1);
        } else {
            jsonStr = jsonStr.replace(/```json/g, "").replace(/```/g, "").trim();
        }

        let result = JSON.parse(jsonStr);
        result.streetViewUsed = false;
        return result;
    } catch(e) {
        if (axios.isCancel(e) || e.name === 'CanceledError' || (signal && signal.aborted)) throw e;

        // Detect network offline
        const _offline = e.code === 'ERR_NETWORK' || e.message?.includes('Network Error') || !navigator.onLine;
        
        // Procedural Fallback Detailed Report
        const d = propertyData.compressedPayload ?? propertyData;
        const fallbackReport = isEnglish 
        ? `# S.A.F.E AUDIT REPORT (OFFLINE MODE)\n\n### GEOTECHNICAL\n- **Vs30**: ${d.liquefaction_analysis?.vs30_est} m/s (${d.liquefaction_analysis?.site_class})\n- **Liquefaction FS**: ${d.liquefaction_analysis?.fs_score}\n\n### SEISMIC\n- **PGA**: ${d.liquefaction_analysis?.pga_surface}g\n- **Nearest Fault**: ${d.seismotectonic?.nearest_fault?.name} (${(d.seismotectonic?.nearest_fault?.distance/1000).toFixed(1)} km)\n\n### ENVIRONMENT\n- **Elevation**: ${d.elevasi}m\n- **Flood Risk**: ${d.flood_hazard}\n- **AQI**: ${d.env_extras?.aqi}\n\n*Note: This is a rule-based fallback report because external AI APIs are unreachable.*`
        : `# LAPORAN AUDIT S.A.F.E (MODE LURING)\n\n### GEOTEKNIK (TANAH)\n- **Vs30 (Kekerasan Tanah)**: ${d.liquefaction_analysis?.vs30_est} m/s (Kelas ${d.liquefaction_analysis?.site_class})\n- **Likuifaksi FS**: ${d.liquefaction_analysis?.fs_score} (${d.liquefaction_analysis?.status})\n\n### SEISMIK (GEMPA)\n- **PGA Permukaan**: ${d.liquefaction_analysis?.pga_surface}g\n- **Sesar Terdekat**: ${d.seismotectonic?.nearest_fault?.name} berjarak ${(d.seismotectonic?.nearest_fault?.distance/1000).toFixed(1)} km\n\n### LINGKUNGAN & BANJIR\n- **Elevasi**: ${d.elevasi} mdpl\n- **Risiko Banjir**: ${d.flood_hazard}\n- **Kualitas Udara (AQI)**: ${d.env_extras?.aqi}\n\n*Catatan: Ini adalah laporan prosedural darurat (rule-based) karena koneksi ke server AI terputus atau batas kuota habis.*`;

        return {
            aiError: true, offline: _offline,
            geoStabilityExplanation: "Gagal terhubung ke AI. Menggunakan mode luring.",
            seismicExplanation: "Gagal terhubung ke AI. Menggunakan mode luring.",
            floodEnvExplanation: "Gagal terhubung ke AI. Menggunakan mode luring.",
            microAnalysis: null, streetViewUsed: false,
            detailedReport: fallbackReport
        };
    }
};

// ═══════════════════════════════════════════════════════════════════
// BATTLE REPORT — Enhanced with Indonesia context
// ═══════════════════════════════════════════════════════════════════

export const generateBattleReport = async (propA, propB, lang = 'id') => {
    const isEnglish = lang === 'en';
    const langNote = isEnglish
        ? 'Output as raw markdown. Language: concise, layperson-friendly, in English. Use Indonesian place names and technical terms where standard.'
        : 'Output as raw markdown. Language: concise, layperson-friendly, Bahasa Indonesia mixed with English technical terms.';

    const template = isEnglish ? `
# S.A.F.E HOUSE BATTLE REPORT

Introductory greeting...

### THE VERDICT
Clear, decisive verdict. Which property is safer and WHY. Reference specific regional hazards. Mention any critical shared risks.

### HEAD-TO-HEAD COMPARISON
Markdown table comparing: Vs30, Elevation, Liquefaction FS, PGA Surface, Fault Distance, Flood Risk, Tsunami Risk. Use simple terms.

### ENVIRONMENTAL CONTRAST
Compare distance to faults (NAME the faults), flooding risks, and regional hazard history in 2-3 sentences.

### MITIGATION COST ANALYSIS
Estimate and compare structural mitigation costs in simple terms with Rp ranges. Which property will cost more to make safe?

### FINAL RECOMMENDATION
Practical advice for the buyer -- which property to choose and what to prepare budget-wise.

Conclude with disclaimer.` : `

### HEAD-TO-HEAD COMPARISON
Markdown table comparing: Vs30, Elevasi, Likuifaksi FS, PGA Surface, Jarak Patahan, Risiko Banjir, Risiko Tsunami. Use simple words (e.g. "Tanah Lunak" not "Site Class SE").

### ENVIRONMENTAL CONTRAST
Compare distance to faults (NAME the faults), flooding risks, and regional hazard history in 2-3 sentences.

### ANALISIS BIAYA MITIGASI
Estimate and compare structural mitigation costs in simple terms with Rp ranges. Which property will cost more to make safe?

### REKOMENDASI FINAL
Practical advice for the buyer -- which property to choose and what to prepare budget-wise.

Conclude with disclaimer.`;

    const sysPrompt = `You are S.A.F.E AI, a senior Geophysics & Property Risk Consultant for Indonesia.

${INDONESIA_RISK_KNOWLEDGE}

Task: Generate a concise "PROPERTY BATTLE" report comparing two Indonesian properties. Add expert regional context beyond raw numbers. Keep it under 800 words.

${langNote}

IMPORTANT: Do NOT use emoji or special unicode characters. Use plain ASCII only. Use markdown --- for horizontal rules.

Structure:
${template}`;

    // Compact JSON to reduce input tokens
    const userPrompt = `PROPERTY A:\n${JSON.stringify(propA.compressedPayload)}\n\nPROPERTY B:\n${JSON.stringify(propB.compressedPayload)}`;

    try {
        // Small delay to avoid Gemini rate limits if property B's AI calls just finished
        await new Promise(r => setTimeout(r, 2000));
        const text = await callAIRobust(sysPrompt, userPrompt, null, 2048, 0.4);
        return text;
    } catch(e) {
        console.error("Battle Report AI Failed, generating data-driven fallback:", e);
        
        // Generate a proper data-driven fallback battle report
        const dA = propA.compressedPayload ?? propA;
        const dB = propB.compressedPayload ?? propB;
        const addrA = dA.address ?? propA.address ?? 'Properti A';
        const addrB = dB.address ?? propB.address ?? 'Properti B';
        const vs30A = dA.liquefaction_analysis?.vs30_est ?? '-';
        const vs30B = dB.liquefaction_analysis?.vs30_est ?? '-';
        const fsA = dA.liquefaction_analysis?.fs_score ?? '-';
        const fsB = dB.liquefaction_analysis?.fs_score ?? '-';
        const pgaA = dA.liquefaction_analysis?.pga_surface ?? '-';
        const pgaB = dB.liquefaction_analysis?.pga_surface ?? '-';
        const elevA = dA.elevasi ?? '-';
        const elevB = dB.elevasi ?? '-';
        const floodA = dA.flood_hazard ?? '-';
        const floodB = dB.flood_hazard ?? '-';
        const faultA = dA.seismotectonic?.nearest_fault;
        const faultB = dB.seismotectonic?.nearest_fault;
        const faultDistA = faultA ? `${(faultA.distance/1000).toFixed(1)} km` : '-';
        const faultDistB = faultB ? `${(faultB.distance/1000).toFixed(1)} km` : '-';
        
        if (isEnglish) {
            return `# S.A.F.E HOUSE BATTLE REPORT (Data-Based)

### THE VERDICT
Based on the geospatial data, a direct comparison of the two properties is presented below. Please consult with a certified geotechnical engineer for a final risk assessment.

### HEAD-TO-HEAD COMPARISON

| Metric | ${addrA.substring(0, 30)} | ${addrB.substring(0, 30)} |
|--------|-----------|-----------|
| Vs30 (m/s) | ${vs30A} | ${vs30B} |
| Elevation (m) | ${elevA} | ${elevB} |
| Liquefaction FS | ${fsA} | ${fsB} |
| PGA Surface (g) | ${pgaA} | ${pgaB} |
| Nearest Fault | ${faultA?.name ?? '-'} (${faultDistA}) | ${faultB?.name ?? '-'} (${faultDistB}) |
| Flood Risk | ${floodA} | ${floodB} |

---

### NOTE
This report was generated from raw geospatial data because the AI analysis service was temporarily unavailable. For a full AI-generated narrative analysis, please try again later.

---
*DISCLAIMER: This data-based report uses publicly available geospatial data and is NOT a substitute for professional geotechnical assessment.*`;
        } else {
            return `# LAPORAN BATTLE S.A.F.E HOUSE (Berbasis Data)

### VERDIK
Berdasarkan data geospasial, perbandingan langsung kedua properti disajikan di bawah ini. Konsultasikan dengan insinyur geoteknik bersertifikat untuk penilaian risiko final.

### PERBANDINGAN HEAD-TO-HEAD

| Metrik | ${addrA.substring(0, 30)} | ${addrB.substring(0, 30)} |
|--------|-----------|-----------|
| Vs30 (m/s) | ${vs30A} | ${vs30B} |
| Elevasi (m) | ${elevA} | ${elevB} |
| Likuifaksi FS | ${fsA} | ${fsB} |
| PGA Permukaan (g) | ${pgaA} | ${pgaB} |
| Sesar Terdekat | ${faultA?.name ?? '-'} (${faultDistA}) | ${faultB?.name ?? '-'} (${faultDistB}) |
| Risiko Banjir | ${floodA} | ${floodB} |

---

### CATATAN
Laporan ini dibuat dari data geospasial mentah karena layanan analisis AI sedang tidak tersedia sementara. Untuk analisis naratif AI lengkap, silakan coba lagi nanti.

---
*DISCLAIMER: Laporan berbasis data ini menggunakan data geospasial publik dan BUKAN pengganti penilaian geoteknik profesional.*`;
        }
    }
};
