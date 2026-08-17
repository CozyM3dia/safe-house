/**
 * S.A.F.E House — Geohazard & Civil Engineering Knowledge Base (Indonesian context)
 * Used as the document corpus for the Client-Side RAG (Retrieval-Augmented Generation) system.
 */

export const KNOWLEDGE_BASE = [
  {
    id: "sni_seismic_code",
    title: "SNI 1726:2019 dan SNI 2847:2019 — Standar Desain Seismik & Struktur Beton Indonesia",
    category: "Geoteknik & Regulasi",
    tags: ["SNI", "seismik", "beton", "kelas situs", "Vs30", "pondasi", "gempa"],
    content: `Standar Nasional Indonesia untuk perencanaan ketahanan gempa diatur dalam SNI 1726:2019 (Tata Cara Perencanaan Ketahanan Gempa untuk Struktur Bangunan Gedung dan Nongedung). Keamanan fondasi ditentukan oleh klasifikasi Kelas Situs berdasarkan nilai kecepatan rambat gelombang geser rata-rata pada kedalaman 30 meter teratas (Vs30):
- Kelas Situs SA (Batuan Keras): Vs30 > 1500 m/s. Amplifikasi gempa sangat rendah.
- Kelas Situs SB (Batuan): Vs30 antara 750 hingga 1500 m/s. Aman, tidak ada amplifikasi signifikan.
- Kelas Situs SC (Tanah Keras, Sangat Padat dan Batuan Lunak): Vs30 antara 360 hingga 750 m/s. Pondasi dangkal seperti Foot Plate (Cakar Ayam) atau Batu Kali aman digunakan untuk bangunan hingga 3 lantai.
- Kelas Situs SD (Tanah Sedang): Vs30 antara 180 hingga 360 m/s. Amplifikasi gelombang gempa sedang. Struktur beton wajib menggunakan detail penulangan daktail parsial/penuh sesuai SNI 2847:2019.
- Kelas Situs SE (Tanah Lunak): Vs30 < 180 m/s. Terdiri dari aluvial tebal, lempung lunak, atau rawa. Mengalami amplifikasi gempa ekstrem (Fa dapat meningkat 1.7 hingga 2.4 kali lipat). Pondasi dangkal sangat berbahaya karena risiko penurunan (settlement) tidak merata. Wajib menggunakan pondasi dalam (Bored Pile atau Tiang Pancang) yang menembus hingga tanah keras di bawahnya.
- Kelas Situs SF (Tanah Khusus/Sangat Lunak): Memerlukan analisis perambatan gelombang spesifik situs oleh ahli geoteknik berlisensi.`
  },
  {
    id: "liquefaction_mitigation",
    title: "Rekayasa Mitigasi Likuefaksi & Stabilisasi Tanah (Soil Improvement)",
    category: "Geoteknik & Pondasi",
    tags: ["likuefaksi", "stabilisasi tanah", "pondasi dalam", "bored pile", "cakar ayam", "rekayasa tanah"],
    content: `Likuefaksi (liquefaction) adalah fenomena hilangnya kekuatan geser tanah pasir jenuh air akibat beban siklik dinamis seperti gempa bumi, menyebabkan tanah berperilaku seperti cairan. Likuefaksi umumnya terjadi pada tanah berbutir halus-sedang (pasir halus/lanau), dengan muka air tanah dangkal (< 5-10 meter), dan guncangan gempa dengan PGA > 0.15g. Indikator keamanan likuefaksi dinyatakan dalam Safety Factor (FS):
- FS < 1.0: Rawan Kritis (Likuefaksi pasti terjadi, struktur akan amblas atau miring).
- FS 1.0 - 1.2: Rawan Menengah (Perlu mitigasi dan penguatan tanah).
- FS > 1.2: Aman dari risiko likuefaksi.

Mitigasi Rekayasa Sipil untuk Likuefaksi:
1. Deep Cement Mixing (DCM): Penyuntikan bubur semen ke dalam tanah pasir menggunakan bor auger untuk membentuk kolom tanah-semen (soil-cement columns) yang kaku, mencegah pergeseran lateral. Biaya: Rp 900.000 - Rp 1.600.000 per meter kubik tanah yang diperkuat.
2. Vibroflotation / Soil Compaction: Pemadatan tanah pasir longgar menggunakan alat getar (vibroflot) dikombinasikan dengan penyemprotan air bertekanan tinggi untuk merapatkan butiran tanah. Biaya: Rp 450.000 - Rp 800.000 per meter kubik.
3. Stone Columns (Kolom Batu): Pembuatan lubang vertikal yang diisi dengan agregat batu pecah yang dipadatkan. Berfungsi meningkatkan kekuatan geser tanah sekaligus sebagai jalur drainase cepat untuk mereduksi tekanan air pori yang naik akibat gempa. Biaya: Rp 1.200.000 - Rp 2.000.000 per meter lari.
4. Desain Pondasi Mat/Raft Foundation: Pondasi pelat beton tebal yang menutupi seluruh area bangunan untuk menyebarkan beban secara merata dan mencegah kemiringan lokal bangunan saat likuefaksi parsial terjadi.`
  },
  {
    id: "flood_subsidence_coastal",
    title: "Penanggulangan Risiko Banjir & Penurunan Tanah (Land Subsidence) Wilayah Pesisir",
    category: "Banjir & Lingkungan",
    tags: ["banjir", "subsidence", "jakarta", "semarang", "rob", "drainase", "fondasi"],
    content: `Penurunan tanah (land subsidence) dan banjir rob merupakan ancaman kritis di pesisir utara Jawa (Pantura), seperti Jakarta Utara, Semarang, Demak, dan Pekalongan. Jakarta Utara mencatat penurunan rata-rata 7.5 - 17 cm per tahun akibat ekstraksi air tanah dalam secara masif dan beban bangunan. Hal ini memperparah banjir rob karena ketinggian daratan kini berada di bawah permukaan air laut pasang.

Langkah Mitigasi & Adaptasi Struktur Properti:
1. Peninggian Lantai Dasar Properti (Plinth Height): Lantai dasar bangunan wajib ditinggikan minimal 1.5 hingga 2.0 meter di atas level jalan raya setempat untuk mengantisipasi akumulasi kenaikan banjir rob dalam 15-20 tahun ke depan. Biaya peninggian untuk rumah tinggal berkisar antara Rp 35.000.000 hingga Rp 90.000.000.
2. Pemasangan Backwater Valve: Katup searah pada pipa pembuangan air kotor bangunan ke selokan kota. Katup ini menutup otomatis saat air selokan meluap, mencegah air banjir/rob mengalir balik ke dalam toilet dan kamar mandi rumah. Biaya: Rp 800.000 - Rp 2.500.000 per titik pipa.
3. Sistem Mini-Polder & Pompa Sump (Sump Pump): Pembuatan tanggul penahan air di sekeliling batas properti yang dilengkapi sumur tampung (sump pit) dan pompa otomatis untuk membuang air hujan yang terjebak di dalam pekarangan. Pompa submersible kapasitas 150-300 L/menit membutuhkan biaya Rp 3.000.000 - Rp 8.000.000 per unit.
4. Penggunaan Material Tahan Korosi Air Asin: Di daerah banjir rob, beton pondasi wajib menggunakan semen tipe khusus (Type V atau semen tahan sulfat) dengan nilai selimut beton minimal 50 mm untuk melindungi tulangan baja dari korosi klorida air laut.`
  },
  {
    id: "active_faults_volcanoes",
    title: "Jarak Sempadan Sesar Aktif & Zona Bahaya Gunung Api (KRB) Indonesia",
    category: "Sesar & Gunung Api",
    tags: ["sesar aktif", "lembang", "opak", "sempadan", "gunung api", "evakuasi", "KRB"],
    content: `Sesar Aktif (Active Fault Line) adalah patahan kerak bumi yang memiliki aktivitas pergeseran dalam kurun waktu 10.000 tahun terakhir dan berpotensi memicu gempa bumi dangkal yang merusak. Kementerian PU Pera menetapkan aturan zona sempadan sesar aktif (setback distance) demi keselamatan:
- Zona Sempadan Utama (0 - 10 meter dari garis sesar): Dilarang keras mendirikan bangunan permanen apa pun. Area ini hanya diperbolehkan untuk ruang terbuka hijau, jalan raya tanpa struktur atas, atau lahan parkir. Pergeseran permukaan saat gempa dapat langsung merobek fondasi bangunan.
- Zona Penyangga (10 - 20 meter dari garis sesar): Diperbolehkan untuk bangunan ringan non-hunian dengan material kayu, baja ringan, atau bambu terstruktur yang fleksibel terhadap regangan lateral tanah.
- Jarak Aman Hunian (> 20 meter): Diperbolehkan mendirikan bangunan hunian tahan gempa dengan desain struktur kaku dan pondasi terikat (tie beam/sloof kuat).

Zona Kawasan Rawan Bencana (KRB) Gunung Api (Badan Geologi):
- KRB III (Radius < 5 km): Sangat berbahaya. Rawan aliran awan panas (wedhus gembel), lahar hujan, aliran lava, dan lontaran batu pijar. Tidak boleh dihuni secara permanen.
- KRB II (Radius 5 - 15 km): Rawan hujan abu lebat, awan panas sekunder, dan aliran lahar dingin di sepanjang lembah sungai. Bangunan wajib memiliki atap dengan kemiringan tajam (> 35 derajat) agar abu vulkanik basah yang sangat berat tidak menumpuk dan merubuhkan atap.
- KRB I (Radius > 15 km): Relatif aman dari ancaman primer, namun rawan hujan abu vulkanik halus tertiup angin dan banjir lahar dingin sekunder.`
  },
  {
    id: "zoning_property_valuation",
    title: "Zonasi Tata Ruang ATR/BPN (RTRW) & Zona Nilai Tanah (ZNT) Terhadap Risiko Properti",
    category: "Hukum & Investasi",
    tags: ["RTRW", "zoning", "tata ruang", "ZNT", "nilai tanah", "investasi", "asuransi"],
    content: `Rencana Tata Ruang Wilayah (RTRW) dari Kementerian ATR/BPN membagi lahan menjadi dua fungsi utama: Kawasan Lindung (daerah tangkapan air, sempadan sungai, zona rawan longsor/gempa) dan Kawasan Budidaya (pemukiman, komersial, industri). 
- Membeli tanah di Zona Merah Bencana (misal: tepat di jalur sesar Lembang, zona bahaya likuefaksi Palu, atau zona rawan longsor tinggi) akan mengakibatkan penolakan pengajuan Persetujuan Bangunan Gedung (PBG, pengganti IMB). Bangunan tanpa PBG ilegal dan dapat dibongkar paksa.
- Zona Nilai Tanah (ZNT) yang dirilis ATR/BPN mencerminkan harga pasar tanah rata-rata. Tanah yang berada di zona risiko geologis tinggi (banjir tahunan, sesar aktif < 5 km, atau likuefaksi) mengalami depresiasi nilai aset sebesar 20% hingga 45%. Properti di daerah rawan likuefaksi umumnya ditolak oleh bank BUMN/swasta untuk agunan pinjaman atau pengajuan Kredit Pemilikan Rumah (KPR).
- Premi Asuransi Kebakaran dan Gempa Bumi (FLEXAS & Earthquake) melonjak drastis hingga 3-5 kali lipat tarif standar di area rawan bencana. Biaya premi asuransi gempa berkisar antara 0.1% hingga 0.25% dari nilai total bangunan per tahun untuk wilayah zona gempa tinggi.`
  }
];
