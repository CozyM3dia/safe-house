"""Basis data geologi dan seismotektonik Indonesia.

Ditranskripsi dari frontend/src/services/engine.js. Nilai tidak boleh diubah
tanpa alasan geologis — uji paritas di scripts/check_engine_parity.py
membandingkan keluaran modul ini dengan versi JavaScript.

Cakupan: Sumatra, Jawa, Bali, NTB, NTT, Kalimantan, Sulawesi, Maluku, Papua.
"""

# --- Sesar aktif ---------------------------------------------------------

ACTIVE_FAULTS = [
    # Sumatra — segmen Sesar Sumatra Besar
    {"name": "Sesar Aceh (NAD)", "coords": (5.550, 95.320)},
    {"name": "Sesar Seulimeum (Aceh)", "coords": (5.420, 95.680)},
    {"name": "Sesar Tripa (Aceh Barat)", "coords": (3.800, 96.500)},
    {"name": "Sesar Renun (Sumut)", "coords": (2.700, 98.500)},
    {"name": "Sesar Toru (Sumut)", "coords": (1.600, 99.000)},
    {"name": "Sesar Angkola (Tapanuli)", "coords": (1.200, 99.300)},
    {"name": "Sesar Barumun (Sumut)", "coords": (1.000, 99.800)},
    {"name": "Sesar Sumpur (Sumbar)", "coords": (-0.400, 100.400)},
    {"name": "Sesar Sianok (Bukittinggi)", "coords": (-0.300, 100.370)},
    {"name": "Sesar Suliti (Sumbar)", "coords": (-1.100, 101.100)},
    {"name": "Sesar Dikit (Kerinci)", "coords": (-1.800, 101.300)},
    {"name": "Sesar Ketaun (Bengkulu)", "coords": (-3.300, 102.100)},
    {"name": "Sesar Musi (Bengkulu)", "coords": (-3.700, 102.800)},
    {"name": "Sesar Kumering (Sumsel)", "coords": (-4.400, 103.800)},
    {"name": "Semangko Timur (Lampung)", "coords": (-5.480, 104.720)},
    {"name": "Semangko Barat (Lampung)", "coords": (-5.500, 104.650)},
    {"name": "Sesar Tarahan (Bandar Lampung)", "coords": (-5.510, 105.320)},
    # Jawa
    {"name": "Sesar Cimandiri (Jabar)", "coords": (-6.800, 106.700)},
    {"name": "Sesar Lembang (Bandung)", "coords": (-6.780, 107.600)},
    {"name": "Sesar Baribis-Kendeng (Jabar-Jateng)", "coords": (-6.900, 108.500)},
    {"name": "Sesar Opak (Yogyakarta)", "coords": (-7.870, 110.400)},
    {"name": "Sesar Grindulu (Pacitan)", "coords": (-8.200, 111.100)},
    {"name": "Sesar Pasuruan (Jatim)", "coords": (-7.650, 112.900)},
    {"name": "Sesar Kendeng (Jatim)", "coords": (-7.300, 112.000)},
    {"name": "Sesar Lasem (Jateng)", "coords": (-6.700, 111.400)},
    # Bali & Nusa Tenggara
    {"name": "Sesar Seririt (Bali Utara)", "coords": (-8.200, 114.900)},
    {"name": "Flores Back-Arc Thrust", "coords": (-8.200, 121.500)},
    {"name": "Sesar Busur Belakang Flores", "coords": (-8.100, 122.400)},
    # Sulawesi
    {"name": "Sesar Palu-Koro (Sulteng)", "coords": (-0.900, 119.850)},
    {"name": "Sesar Matano (Sulsel)", "coords": (-2.500, 121.400)},
    {"name": "Sesar Lawanopo (Sultra)", "coords": (-3.500, 122.000)},
    {"name": "Sesar Walanae (Sulsel)", "coords": (-3.800, 120.200)},
    {"name": "Sesar Gorontalo (Gorontalo)", "coords": (0.500, 123.000)},
    {"name": "Sesar Minahasa (Sulut)", "coords": (1.300, 124.800)},
    # Kalimantan
    {"name": "Sesar Meratus (Kalsel)", "coords": (-3.200, 115.800)},
    {"name": "Sesar Mangkalihat (Kaltim)", "coords": (1.000, 118.000)},
    {"name": "Sesar Tarakan (Kaltara)", "coords": (3.300, 117.600)},
    {"name": "Sesar Adang (Kaltim)", "coords": (0.200, 117.500)},
    # Maluku
    {"name": "Sesar Sorong-Kawa (Maluku)", "coords": (-3.300, 128.200)},
    {"name": "Sesar Sula (Maluku Utara)", "coords": (-1.800, 125.500)},
    {"name": "Sesar Ambon (Maluku)", "coords": (-3.700, 128.200)},
    # Papua
    {"name": "Sesar Sorong (Papua Barat)", "coords": (-0.870, 131.300)},
    {"name": "Sesar Ransiki (Papua Barat)", "coords": (-1.500, 134.200)},
    {"name": "Sesar Yapen (Papua)", "coords": (-1.800, 136.200)},
    {"name": "Sesar Mamberamo (Papua)", "coords": (-3.000, 138.500)},
    {"name": "Sesar Jayapura (Papua)", "coords": (-2.530, 140.700)},
]

# --- Gunung api ----------------------------------------------------------

VOLCANOES = [
    # Sumatra
    {"name": "G. Sinabung", "coords": (3.170, 98.392)},
    {"name": "G. Sibayak", "coords": (3.230, 98.520)},
    {"name": "G. Toba (Supervolcano)", "coords": (2.600, 98.830)},
    {"name": "G. Marapi", "coords": (-0.381, 100.474)},
    {"name": "G. Talang", "coords": (-0.979, 100.681)},
    {"name": "G. Kerinci", "coords": (-1.697, 101.264)},
    {"name": "G. Dempo", "coords": (-4.030, 103.130)},
    {"name": "G. Krakatau", "coords": (-6.102, 105.423)},
    {"name": "G. Rajabasa", "coords": (-5.780, 105.630)},
    {"name": "G. Tanggamus", "coords": (-5.420, 104.720)},
    # Jawa
    {"name": "G. Salak", "coords": (-6.720, 106.730)},
    {"name": "G. Gede-Pangrango", "coords": (-6.780, 106.980)},
    {"name": "G. Tangkuban Parahu", "coords": (-6.770, 107.600)},
    {"name": "G. Papandayan", "coords": (-7.320, 107.730)},
    {"name": "G. Galunggung", "coords": (-7.250, 108.060)},
    {"name": "G. Ciremai", "coords": (-6.890, 108.400)},
    {"name": "G. Slamet", "coords": (-7.240, 109.210)},
    {"name": "G. Dieng", "coords": (-7.210, 109.920)},
    {"name": "G. Sundoro", "coords": (-7.300, 109.990)},
    {"name": "G. Sumbing", "coords": (-7.384, 110.070)},
    {"name": "G. Merapi (Yogya)", "coords": (-7.541, 110.446)},
    {"name": "G. Merbabu", "coords": (-7.455, 110.440)},
    {"name": "G. Lawu", "coords": (-7.625, 111.192)},
    {"name": "G. Kelud", "coords": (-7.930, 112.310)},
    {"name": "G. Arjuno-Welirang", "coords": (-7.725, 112.580)},
    {"name": "G. Bromo-Tengger", "coords": (-7.942, 112.950)},
    {"name": "G. Semeru", "coords": (-8.108, 112.922)},
    {"name": "G. Ijen", "coords": (-8.058, 114.242)},
    {"name": "G. Raung", "coords": (-8.125, 114.042)},
    # Bali & Nusa Tenggara
    {"name": "G. Agung (Bali)", "coords": (-8.343, 115.508)},
    {"name": "G. Batur (Bali)", "coords": (-8.242, 115.375)},
    {"name": "G. Rinjani (Lombok)", "coords": (-8.420, 116.460)},
    {"name": "G. Tambora (Sumbawa)", "coords": (-8.250, 118.000)},
    {"name": "G. Sangeang Api (NTB)", "coords": (-8.200, 119.070)},
    {"name": "G. Kelimutu (Flores)", "coords": (-8.770, 121.820)},
    # Sulawesi
    {"name": "G. Lokon-Empung (Sulut)", "coords": (1.358, 124.792)},
    {"name": "G. Soputan (Sulut)", "coords": (1.112, 124.737)},
    {"name": "G. Karangetang (Sangihe)", "coords": (2.781, 125.407)},
    # Maluku
    {"name": "G. Gamalama (Ternate)", "coords": (0.800, 127.325)},
    {"name": "G. Banda Api (Banda)", "coords": (-4.525, 129.871)},
    # Papua / Halmahera
    {"name": "G. Gamkonora (Halmahera)", "coords": (1.380, 127.530)},
]

# --- Zona megathrust -----------------------------------------------------

MEGATHRUST = [
    {"name": "Sunda Megathrust (Sumatra)", "coords": (-3.500, 99.000)},
    {"name": "Sunda Megathrust (Selat Sunda)", "coords": (-6.500, 104.500)},
    {"name": "Java Megathrust (Jabar)", "coords": (-8.500, 107.000)},
    {"name": "Java Megathrust (Jateng)", "coords": (-9.000, 110.000)},
    {"name": "Java Megathrust (Jatim)", "coords": (-9.200, 113.000)},
    {"name": "Timor Trough", "coords": (-9.500, 124.000)},
    {"name": "Banda Arc Megathrust", "coords": (-6.500, 130.000)},
    {"name": "North Sulawesi Megathrust", "coords": (2.000, 124.000)},
    {"name": "Philippine Sea Plate (Maluku)", "coords": (0.000, 127.000)},
    {"name": "Papua-New Guinea Trench", "coords": (-4.000, 143.000)},
]

# --- Garis pantai acuan --------------------------------------------------

COASTLINE = [
    {"name": "Pesisir Aceh Barat", "coords": (4.200, 96.100)},
    {"name": "Pesisir Padang", "coords": (-1.000, 100.300)},
    {"name": "Pesisir Bengkulu", "coords": (-3.800, 102.200)},
    {"name": "Teluk Lampung", "coords": (-5.450, 105.280)},
    {"name": "Pesisir Kalianda", "coords": (-5.750, 105.580)},
    {"name": "Pesisir Utara Jakarta (Pantura)", "coords": (-6.090, 106.850)},
    {"name": "Pesisir Semarang", "coords": (-6.950, 110.380)},
    {"name": "Pesisir Utara Surabaya", "coords": (-7.200, 112.750)},
    {"name": "Pesisir Selatan Yogya (Parangtritis)", "coords": (-8.020, 110.330)},
    {"name": "Pesisir Selatan Pacitan", "coords": (-8.200, 111.100)},
    {"name": "Pesisir Selatan Malang", "coords": (-8.400, 112.700)},
    {"name": "Pesisir Bali Selatan", "coords": (-8.780, 115.100)},
    {"name": "Pesisir Kupang (NTT)", "coords": (-10.170, 123.580)},
    {"name": "Pesisir Balikpapan", "coords": (-1.250, 116.850)},
    {"name": "Pesisir Pontianak", "coords": (-0.020, 109.330)},
    {"name": "Pesisir Banjarmasin", "coords": (-3.330, 114.590)},
    {"name": "Pesisir Makassar", "coords": (-5.130, 119.410)},
    {"name": "Pesisir Palu", "coords": (-0.870, 119.830)},
    {"name": "Pesisir Manado", "coords": (1.490, 124.850)},
    {"name": "Pesisir Ambon", "coords": (-3.690, 128.170)},
    {"name": "Pesisir Jayapura", "coords": (-2.530, 140.720)},
    {"name": "Pesisir Sorong", "coords": (-0.870, 131.260)},
]

# --- PGA desain per kota (PuSGeN) ----------------------------------------
# Nilai dalam g. Dipakai sebagai a_max regional untuk perhitungan CSR.

REGIONAL_PGA = {
    # Sumatra
    "Banda Aceh": 0.50, "Medan": 0.30, "Padang": 0.55,
    "Pekanbaru": 0.20, "Jambi": 0.25, "Palembang": 0.22,
    "Bengkulu": 0.50, "Bandar Lampung": 0.42,
    "Lampung Selatan (Kalianda)": 0.48, "Lampung Barat (Liwa)": 0.55,
    "Pesawaran": 0.40, "Metro": 0.35, "Bukittinggi": 0.52,
    # Jawa
    "Jakarta": 0.30, "Jakarta Utara": 0.28, "Bogor": 0.35,
    "Bandung": 0.45, "Cirebon": 0.25, "Semarang": 0.28,
    "Yogyakarta": 0.42, "Solo": 0.30, "Surabaya": 0.25,
    "Malang": 0.35, "Banyuwangi": 0.35, "Tasikmalaya": 0.40,
    "Cilacap": 0.38, "Pacitan": 0.42, "Blitar": 0.38,
    # Bali & Nusa Tenggara
    "Denpasar": 0.38, "Lombok/Mataram": 0.48, "Kupang": 0.45,
    "Labuan Bajo": 0.40, "Ende": 0.42,
    # Kalimantan
    "Pontianak": 0.08, "Balikpapan": 0.12, "Samarinda": 0.10,
    "Banjarmasin": 0.12, "Palangkaraya": 0.08, "Tarakan": 0.18,
    "Ibu Kota Nusantara (IKN)": 0.10,
    # Sulawesi
    "Makassar": 0.30, "Palu": 0.65, "Manado": 0.50,
    "Gorontalo": 0.45, "Kendari": 0.35, "Mamuju": 0.50,
    # Maluku
    "Ambon": 0.55, "Ternate": 0.60, "Tual": 0.45,
    # Papua
    "Jayapura": 0.50, "Sorong": 0.42, "Manokwari": 0.45,
    "Merauke": 0.20, "Nabire": 0.48, "Wamena": 0.45,
    # Cadangan
    "Default": 0.35,
}

# Koordinat kota acuan untuk pencarian PGA terdekat.
# Kunci harus ada di REGIONAL_PGA, kecuali "Default".
CITY_COORDS = {
    # Sumatra
    "Banda Aceh": (5.548, 95.323), "Medan": (3.595, 98.672),
    "Padang": (-0.947, 100.417), "Pekanbaru": (0.507, 101.449),
    "Jambi": (-1.609, 103.607), "Palembang": (-2.990, 104.756),
    "Bengkulu": (-3.800, 102.265), "Bandar Lampung": (-5.430, 105.262),
    "Bukittinggi": (-0.307, 100.369),
    # Jawa
    "Jakarta": (-6.208, 106.846), "Jakarta Utara": (-6.121, 106.845),
    "Bogor": (-6.597, 106.806), "Bandung": (-6.917, 107.619),
    "Cirebon": (-6.706, 108.557), "Semarang": (-6.966, 110.420),
    "Yogyakarta": (-7.797, 110.369), "Solo": (-7.576, 110.824),
    "Surabaya": (-7.250, 112.750), "Malang": (-7.977, 112.634),
    "Banyuwangi": (-8.219, 114.369), "Tasikmalaya": (-7.327, 108.220),
    "Cilacap": (-7.727, 109.015), "Pacitan": (-8.196, 111.098),
    "Blitar": (-8.098, 112.161),
    # Bali & Nusa Tenggara
    "Denpasar": (-8.650, 115.219), "Lombok/Mataram": (-8.585, 116.105),
    "Kupang": (-10.178, 123.607), "Labuan Bajo": (-8.488, 119.889),
    "Ende": (-8.849, 121.660),
    # Kalimantan
    "Pontianak": (-0.023, 109.343), "Balikpapan": (-1.267, 116.831),
    "Samarinda": (-0.496, 117.151), "Banjarmasin": (-3.317, 114.590),
    "Palangkaraya": (-2.213, 113.911), "Tarakan": (3.300, 117.633),
    "Ibu Kota Nusantara (IKN)": (-1.281, 116.344),
    # Sulawesi
    "Makassar": (-5.135, 119.424), "Palu": (-0.899, 119.856),
    "Manado": (1.474, 124.842), "Gorontalo": (0.541, 123.059),
    "Kendari": (-3.972, 122.515), "Mamuju": (-2.680, 118.890),
    # Maluku
    "Ambon": (-3.695, 128.178), "Ternate": (0.785, 127.383),
    "Tual": (-5.638, 132.739),
    # Papua
    "Jayapura": (-2.534, 140.718), "Sorong": (-0.873, 131.255),
    "Manokwari": (-0.862, 134.082), "Merauke": (-8.493, 140.402),
    "Nabire": (-3.363, 135.497), "Wamena": (-4.100, 138.950),
}

# --- Ambang skor risiko --------------------------------------------------

RISK_DOMAIN = {
    "safe": {"min": 70, "max": 100, "label": "SAFE", "hex": "#10b981"},
    "moderate": {"min": 40, "max": 69, "label": "MODERATE", "hex": "#f59e0b"},
    "danger": {"min": 0, "max": 39, "label": "DANGER", "hex": "#ef4444"},
}

# Kotak batas wilayah Indonesia, dipakai untuk menolak koordinat di luar cakupan.
INDONESIA_BOUNDS = {
    "lat_min": -11.5, "lat_max": 6.5,
    "lon_min": 94.5, "lon_max": 141.5,
}
