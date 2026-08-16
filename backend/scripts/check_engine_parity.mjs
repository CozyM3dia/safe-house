/**
 * Uji paritas — sisi JavaScript.
 *
 * Fungsi murni di bawah disalin apa adanya dari
 * frontend/src/services/engine.js (baris 179–411). Disalin, bukan diimpor,
 * karena engine.js memuat `axios` dan `import.meta.env` di tingkat modul
 * sehingga tidak bisa dijalankan langsung oleh Node.
 *
 * Pakai:
 *   cd backend
 *   python scripts/check_engine_parity.py > /tmp/py.txt
 *   node scripts/check_engine_parity.mjs > /tmp/js.txt
 *   diff /tmp/py.txt /tmp/js.txt
 *
 * Pemeriksaan sekali jalan untuk migrasi. Begitu engine.js dihapus,
 * kedua skrip ini ikut dihapus.
 */

const REGIONAL_PGA = {
    "Banda Aceh": 0.50, "Medan": 0.30, "Padang": 0.55,
    "Pekanbaru": 0.20, "Jambi": 0.25, "Palembang": 0.22,
    "Bengkulu": 0.50, "Bandar Lampung": 0.42,
    "Lampung Selatan (Kalianda)": 0.48, "Lampung Barat (Liwa)": 0.55,
    "Pesawaran": 0.40, "Metro": 0.35, "Bukittinggi": 0.52,
    "Jakarta": 0.30, "Jakarta Utara": 0.28, "Bogor": 0.35,
    "Bandung": 0.45, "Cirebon": 0.25, "Semarang": 0.28,
    "Yogyakarta": 0.42, "Solo": 0.30, "Surabaya": 0.25,
    "Malang": 0.35, "Banyuwangi": 0.35, "Tasikmalaya": 0.40,
    "Cilacap": 0.38, "Pacitan": 0.42, "Blitar": 0.38,
    "Denpasar": 0.38, "Lombok/Mataram": 0.48, "Kupang": 0.45,
    "Labuan Bajo": 0.40, "Ende": 0.42,
    "Pontianak": 0.08, "Balikpapan": 0.12, "Samarinda": 0.10,
    "Banjarmasin": 0.12, "Palangkaraya": 0.08, "Tarakan": 0.18,
    "Ibu Kota Nusantara (IKN)": 0.10,
    "Makassar": 0.30, "Palu": 0.65, "Manado": 0.50,
    "Gorontalo": 0.45, "Kendari": 0.35, "Mamuju": 0.50,
    "Ambon": 0.55, "Ternate": 0.60, "Tual": 0.45,
    "Jayapura": 0.50, "Sorong": 0.42, "Manokwari": 0.45,
    "Merauke": 0.20, "Nabire": 0.48, "Wamena": 0.45,
    "Default": 0.35,
};

const cityCoords = {
    "Banda Aceh": [5.548, 95.323], "Medan": [3.595, 98.672], "Padang": [-0.947, 100.417],
    "Pekanbaru": [0.507, 101.449], "Jambi": [-1.609, 103.607], "Palembang": [-2.990, 104.756],
    "Bengkulu": [-3.800, 102.265], "Bandar Lampung": [-5.430, 105.262],
    "Bukittinggi": [-0.307, 100.369],
    "Jakarta": [-6.208, 106.846], "Jakarta Utara": [-6.121, 106.845], "Bogor": [-6.597, 106.806],
    "Bandung": [-6.917, 107.619], "Cirebon": [-6.706, 108.557], "Semarang": [-6.966, 110.420],
    "Yogyakarta": [-7.797, 110.369], "Solo": [-7.576, 110.824], "Surabaya": [-7.250, 112.750],
    "Malang": [-7.977, 112.634], "Banyuwangi": [-8.219, 114.369], "Tasikmalaya": [-7.327, 108.220],
    "Cilacap": [-7.727, 109.015], "Pacitan": [-8.196, 111.098], "Blitar": [-8.098, 112.161],
    "Denpasar": [-8.650, 115.219], "Lombok/Mataram": [-8.585, 116.105], "Kupang": [-10.178, 123.607],
    "Labuan Bajo": [-8.488, 119.889], "Ende": [-8.849, 121.660],
    "Pontianak": [-0.023, 109.343], "Balikpapan": [-1.267, 116.831], "Samarinda": [-0.496, 117.151],
    "Banjarmasin": [-3.317, 114.590], "Palangkaraya": [-2.213, 113.911], "Tarakan": [3.300, 117.633],
    "Ibu Kota Nusantara (IKN)": [-1.281, 116.344],
    "Makassar": [-5.135, 119.424], "Palu": [-0.899, 119.856], "Manado": [1.474, 124.842],
    "Gorontalo": [0.541, 123.059], "Kendari": [-3.972, 122.515], "Mamuju": [-2.680, 118.890],
    "Ambon": [-3.695, 128.178], "Ternate": [0.785, 127.383], "Tual": [-5.638, 132.739],
    "Jayapura": [-2.534, 140.718], "Sorong": [-0.873, 131.255], "Manokwari": [-0.862, 134.082],
    "Merauke": [-8.493, 140.402], "Nabire": [-3.363, 135.497], "Wamena": [-4.100, 138.950],
};

const haversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dlat = (lat2 - lat1) * Math.PI / 180;
    const dlon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dlat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dlon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
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

const getRegionalPga = (lat, lon) => {
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

const calculateVs30 = (elevasi) => {
    if (elevasi < 15) return 160;
    if (elevasi < 50) return 280;
    if (elevasi < 150) return 450;
    return 760;
};

const calcLiquefaction = (lat, lon, elevasi) => {
    const vs30 = calculateVs30(elevasi);
    const siteClass = vs30 < 180 ? "SE" : (vs30 < 360 ? "SD" : (vs30 >= 760 ? "SB" : "SC"));

    const regional = getRegionalPga(lat, lon);
    const pga = regional.pga;

    const fa = getSiteAmplification(siteClass, pga);
    const pgaSurface = pga * fa;

    const crr = vs30 < 180 ? 0.12 : (vs30 < 360 ? 0.28 : 0.65);
    const stressRatio = vs30 < 180 ? 1.3 : 1.1;
    const csr = 0.65 * stressRatio * pgaSurface * 0.9;

    const fs = csr > 0 ? parseFloat((crr / csr).toFixed(2)) : 10.0;

    let riskScore = 0;
    if (fs < 0.5) riskScore = 95;
    else if (fs < 1.0) riskScore = 80;
    else if (fs < 1.2) riskScore = 50;
    else riskScore = 10;

    return { fs, vs30, siteClass, pga, riskScore, fa, pgaSurface, nearestCity: regional.city };
};

// Harus sama persis dengan CASES di check_engine_parity.py
const CASES = [
    ["Bandar Lampung", -5.430, 105.262, 10],
    ["Jakarta Utara", -6.121, 106.845, 2],
    ["Padang", -0.947, 100.417, 8],
    ["Palu", -0.899, 119.856, 20],
    ["Denpasar", -8.650, 115.219, 40],
    ["Bandung", -6.917, 107.619, 768],
    ["Pontianak", -0.023, 109.343, 3],
    ["Yogyakarta", -7.797, 110.369, 113],
    ["Ambon", -3.695, 128.178, 25],
    ["Wamena", -4.100, 138.950, 1550],
];

// Python mencetak float bernilai bulat dengan ".0" di belakang (2.0),
// JavaScript membuangnya (2). Padankan ke gaya Python supaya diff hanya
// menyorot selisih nilai yang sebenarnya.
const num = (v) => (Number.isInteger(v) ? `${v}.0` : String(v));

const pad = (v, width) => String(v).padEnd(width);

for (const [label, lat, lon, elevation] of CASES) {
    const r = calcLiquefaction(lat, lon, elevation);
    // pgaSurface dibulatkan ke 3 desimal hanya untuk pembandingan —
    // csr memakai nilai penuh di kedua sisi, jadi fs tidak terpengaruh.
    const pgaSurface = parseFloat(r.pgaSurface.toFixed(3));
    console.log(
        `${pad(label, 20)} ` +
        `fs=${pad(num(r.fs), 7)} ` +
        `vs30=${pad(r.vs30, 5)} ` +
        `site=${pad(r.siteClass, 3)} ` +
        `pga=${pad(num(r.pga), 6)} ` +
        `fa=${pad(num(r.fa), 5)} ` +
        `pga_surface=${pad(num(pgaSurface), 7)} ` +
        `risk=${pad(r.riskScore, 4)} ` +
        `city=${r.nearestCity}`
    );
}
