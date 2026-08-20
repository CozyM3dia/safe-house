/**
 * Lightweight i18n — Indonesian + English only.
 * Usage: t('key') returns translated string based on current language.
 */

const translations = {
  // ─── TopBar ─────────────────────────────────────────────────────
  'search.placeholder': {
    id: 'Cari lokasi atau jalankan perintah…',
    en: 'Search location or run command…',
  },
  'search.shortPlaceholder': { id: 'Cari', en: 'Search' },
  'mode.audit': { id: 'Audit', en: 'Audit' },
  // Nama internal mode tetap 'battle' (kontrak store & API); hanya label yang
  // dilihat pengguna yang memakai istilah "Bandingkan".
  'mode.battle': { id: 'Bandingkan', en: 'Compare' },
  'status.ready': { id: 'Siap', en: 'Ready' },
  'status.active': { id: 'Aktif', en: 'Active' },
  'status.analyzing': { id: 'Menganalisis', en: 'Analyzing' },
  'status.aiProcessing': { id: 'AI Memproses', en: 'AI Processing' },

  // ─── Accessibility / Map Controls ─────────────────────────────
  'accessibility.togglePanel': { id: 'Buka atau tutup panel audit', en: 'Toggle audit panel' },
  'accessibility.search': { id: 'Cari lokasi atau jalankan perintah', en: 'Search location or run a command' },
  'accessibility.close': { id: 'Tutup', en: 'Close' },
  'panel.mapView': { id: 'Tampilan Peta', en: 'Map View' },
  'panel.mapLayerControls': { id: 'Kontrol layer referensi', en: 'Reference layer controls' },
  'panel.closeMapPanel': { id: 'Tutup panel peta', en: 'Close map panel' },
  'panel.street': { id: 'Biasa', en: 'Street' },
  'panel.satellite': { id: 'Satelit', en: 'Satellite' },
  'panel.useBasemap': { id: 'Gunakan peta dasar', en: 'Use basemap' },
  'panel.hazardLayers': { id: 'Layer bahaya', en: 'Hazard layers' },
  'panel.referenceLayers': { id: 'Layer referensi', en: 'Reference layers' },
  'panel.hazardSource': { id: 'InaRISK BNPB', en: 'InaRISK BNPB' },
  'panel.referenceSource': { id: 'PuSGeN 2024', en: 'PuSGeN 2024' },
  'panel.hazardAttribution': { id: 'Sumber bahaya: InaRISK BNPB', en: 'Hazard data: InaRISK BNPB' },
  'panel.hazard.flood': { id: 'Banjir', en: 'Flood' },
  'panel.hazard.landslide': { id: 'Longsor', en: 'Landslide' },
  'panel.hazard.earthquake': { id: 'Gempa', en: 'Earthquake' },
  'panel.hazard.floodDescription': { id: 'Peta bahaya banjir nasional', en: 'National flood hazard map' },
  'panel.hazard.landslideDescription': { id: 'Peta bahaya longsor nasional', en: 'National landslide hazard map' },
  'panel.hazard.earthquakeDescription': { id: 'Peta bahaya gempa nasional', en: 'National earthquake hazard map' },
  'panel.hazard.landslideFallbackDescription': {
    id: 'Raster risiko longsor resmi dipakai sebagai fallback sementara',
    en: 'Official landslide-risk raster used as a responsive fallback',
  },
  'panel.hazard.earthquakeFallbackDescription': {
    id: 'Raster bahaya gempa resmi 2015 dipakai sebagai fallback sementara',
    en: 'Official 2015 earthquake-hazard raster used as a responsive fallback',
  },
  'panel.hazard.landslideFallbackLegend': {
    id: 'Legenda berasal dari raster risiko longsor resmi (fallback).',
    en: 'Legend uses the official landslide-risk fallback raster.',
  },
  'panel.hazard.earthquakeFallbackLegend': {
    id: 'Legenda berasal dari raster bahaya gempa resmi 2015 (fallback).',
    en: 'Legend uses the official 2015 earthquake-hazard fallback raster.',
  },
  'panel.layerOn': { id: 'AKTIF', en: 'ON' },
  'panel.layerOff': { id: 'MATI', en: 'OFF' },
  'panel.layerLoading': { id: 'MEMUAT', en: 'LOADING' },
  'panel.layerUnavailable': { id: 'TIDAK TERSEDIA', en: 'UNAVAILABLE' },
  'panel.layerFallback': { id: 'FALLBACK', en: 'FALLBACK' },
  'panel.toggleLayer': { id: 'Aktifkan layer', en: 'Toggle layer' },
  'panel.faults': { id: 'Sesar aktif', en: 'Active faults' },
  'panel.faultsDescription': { id: 'Geometri resmi PuSGeN 2024', en: 'Official PuSGeN 2024 geometry' },
  'panel.faultsFallbackDescription': { id: 'Koridor referensi lokal; sumber resmi tidak tersedia', en: 'Local reference corridors; official source unavailable' },
  'panel.faultsLoadingDescription': { id: 'Memuat geometri resmi PuSGeN 2024', en: 'Loading official PuSGeN 2024 geometry' },
  'panel.faultLegend': { id: 'Referensi sesar aktif', en: 'Active fault reference' },
  'panel.faultLegendDescription': { id: 'Garis solid menunjukkan geometri sesar resmi.', en: 'Solid lines show official fault geometry.' },
  'panel.faultFallbackLegendDescription': { id: 'Koridor putus-putus adalah referensi lokal, bukan geometri resmi.', en: 'Dashed corridors are a local reference, not official geometry.' },
  'panel.faultSource': { id: 'Sumber: PuSGeN 2024 melalui InaRISK BNPB', en: 'Source: PuSGeN 2024 via InaRISK BNPB' },
  'map.zoomIn': { id: 'Perbesar peta', en: 'Zoom in' },
  'map.zoomOut': { id: 'Perkecil peta', en: 'Zoom out' },
  'map.recenter': { id: 'Pusatkan kembali peta', en: 'Recenter map' },
  'panel.mapLegend': { id: 'Legenda Peta', en: 'Map Legend' },
  'panel.floodRisk': { id: 'Risiko Banjir', en: 'Flood Risk' },
  'panel.landCover': { id: 'Tutupan Lahan', en: 'Land Cover' },
  'panel.low': { id: 'Rendah', en: 'Low' },
  'panel.moderate': { id: 'Sedang', en: 'Moderate' },
  'panel.high': { id: 'Tinggi', en: 'High' },
  'panel.urban': { id: 'Perkotaan', en: 'Urban' },
  'panel.forest': { id: 'Hutan', en: 'Forest' },
  'panel.farming': { id: 'Pertanian', en: 'Farming' },
  'panel.water': { id: 'Air', en: 'Water' },

  // ─── Left Panel — Empty State ───────────────────────────────────
  'empty.badge': { id: 'Siap Audit', en: 'Ready to Audit' },
  'empty.title': { id: 'Pilih lokasi target', en: 'Select a target' },
  'empty.description': {
    id: 'Klik di mana saja pada peta atau tekan',
    en: 'Click anywhere on the map or press',
  },
  'empty.descriptionEnd': {
    id: 'untuk menjalankan analisis geofisika S.A.F.E.',
    en: 'to deploy S.A.F.E geophysics analysis.',
  },
  'empty.vs30': { id: 'Vs30 + PGA', en: 'Vs30 + PGA' },
  'empty.flood': { id: 'Intel Banjir', en: 'Flood Intel' },
  'empty.fault': { id: 'Jarak patahan', en: 'Fault distance' },
  'empty.ai': { id: 'Audit AI', en: 'AI Audit' },
  'empty.vs30desc': {
    id: 'Kelas situs & PGA desain SNI 1726:2019',
    en: 'SNI 1726:2019 site class & design PGA',
  },
  'empty.flooddesc': {
    id: 'Bahaya banjir nasional dari InaRISK BNPB',
    en: 'National flood hazard from InaRISK BNPB',
  },
  'empty.faultdesc': {
    id: 'Sesar aktif terdekat (PuSGeN 2024)',
    en: 'Nearest active fault (PuSGeN 2024)',
  },
  'empty.aidesc': {
    id: 'Ringkasan risiko & rekomendasi berbasis AI',
    en: 'AI-grounded risk summary & recommendations',
  },

  // ─── Left Panel — Populated State ──────────────────────────────
  'panel.siteAnalysis': { id: 'Analisis Situs', en: 'Site Analysis' },
  'panel.riskDashboard': { id: 'Dashboard Risiko', en: 'Risk Dashboard' },
  'panel.technicalMetrics': { id: 'Metrik Teknis', en: 'Technical Metrics' },
  'panel.riskAnalysis': { id: 'Analisis Risiko', en: 'Risk Analysis' },
  'panel.location': { id: 'Lokasi', en: 'Location' },
  'panel.comparison': { id: 'Perbandingan', en: 'Comparison' },
  'panel.viewReport': {
    id: 'Lihat Laporan Audit AI',
    en: 'View Full AI Audit Report',
  },
  'panel.reportLoading': {
    id: 'Laporan AI Memuat…',
    en: 'AI Report Loading…',
  },
  'panel.battleMode': { id: 'Mode Bandingkan', en: 'Compare Mode' },
  'panel.headToHead': { id: 'Lokasi A vs Lokasi B', en: 'Site A vs Site B' },
  'panel.riskProfile': {
    id: 'Profil Risiko',
    en: 'Risk Profile',
  },
  'panel.paramComparison': {
    id: 'Perbandingan Parameter',
    en: 'Parameter Comparison',
  },
  'panel.generateBattleReport': {
    id: 'Buat Laporan Perbandingan',
    en: 'Generate Comparison Report',
  },
  'panel.viewBattleReport': {
    id: 'Lihat Laporan Perbandingan',
    en: 'View Comparison Report',
  },
  'panel.battleReportLoading': {
    id: 'Membuat laporan…',
    en: 'Generating report…',
  },

  // ─── Cards ──────────────────────────────────────────────────────
  'card.safeScore': { id: 'Skor S.A.F.E', en: 'S.A.F.E Score' },
  'card.vs30': { id: 'Vs30', en: 'Vs30' },
  'card.pga': { id: 'PGA', en: 'PGA' },
  'card.liquefactionFs': { id: 'FS Likuefaksi', en: 'Liquefaction FS' },
  'card.riskRadar': { id: 'Radar Risiko (5-axis)', en: 'Risk Radar (5-axis)' },
  'card.seismic': { id: 'Tanda Tangan Seismik', en: 'Seismic Signature' },
  'card.probability': {
    id: 'Distribusi Probabilitas',
    en: 'Probability Distribution',
  },
  'card.siteCoords': { id: 'Koordinat Situs', en: 'Site Coordinates' },
  'card.fault': { id: 'Patahan', en: 'Fault' },
  'card.elevation': { id: 'Elevasi', en: 'Elevation' },
  'card.peakAccel': { id: 'Akselerasi puncak', en: 'Peak acceleration' },
  'card.highRisk': { id: 'Risiko tinggi', en: 'High risk' },
  'card.stable': { id: 'Stabil', en: 'Stable' },
  'card.lowFlood': { id: 'Rendah, rawan banjir', en: 'Low, flood prone' },
  'card.standard': { id: 'Standar', en: 'Standard' },
  'card.highShaking': { id: 'Guncangan tinggi', en: 'High shaking' },
  'card.elevation2': { id: 'Elevasi', en: 'Elevation' },
  'card.liqFs': { id: 'FS Likuefaksi', en: 'Liq. FS' },
  'card.insufficientData': { id: 'Data tidak cukup', en: 'Insufficient data' },
  'card.provisional': { id: 'Sementara', en: 'Provisional' },
  'axis.seismic': { id: 'Seismik', en: 'Seismic' },
  'axis.flood': { id: 'Banjir', en: 'Flood' },
  'axis.soil': { id: 'Tanah', en: 'Soil' },
  'axis.landslide': { id: 'Longsor', en: 'Landslide' },
  'axis.subsidence': { id: 'Penurunan', en: 'Subsidence' },
  'card.siteLocation': { id: 'Lokasi Situs', en: 'Site Location' },
  'card.coordinatesCopied': { id: 'Koordinat disalin', en: 'Coordinates copied' },
  'card.copyCoordinates': { id: 'Salin koordinat', en: 'Copy coordinates' },
  'card.copied': { id: 'Tersalin', en: 'Copied' },
  'card.copy': { id: 'Salin', en: 'Copy' },
  'card.addressUnavailable': { id: 'Alamat tidak tersedia', en: 'Address unavailable' },
  'card.latitude': { id: 'Lintang', en: 'Latitude' },
  'card.longitude': { id: 'Bujur', en: 'Longitude' },
  'card.fromLocation': { id: 'dari lokasi', en: 'from location' },
  'card.near': { id: 'DEKAT', en: 'NEAR' },
  'card.moderate': { id: 'SEDANG', en: 'MOD' },
  'card.far': { id: 'JAUH', en: 'FAR' },

  // ─── Kartu Bandingkan ───────────────────────────────────────────
  'battle.setup': { id: 'Siapkan Perbandingan', en: 'Set Up Comparison' },
  'battle.selectB': {
    id: 'Pilih lokasi kedua di peta untuk membandingkan dengan',
    en: 'Select a second location on the map to compare against',
  },
  'battle.clickMap': {
    id: 'Klik peta untuk Lokasi B…',
    en: 'Click map for Site B…',
  },
  'battle.selectTarget': { id: 'Pilih Lokasi B di peta', en: 'Select Site B on map' },
  'battle.verdict': { id: 'Rekomendasi', en: 'Recommendation' },

  // ─── Chatbot ────────────────────────────────────────────────────
  'chat.placeholder': { id: 'Tanya S.A.F.E AI…', en: 'Ask S.A.F.E AI…' },
  'chat.greeting': {
    id: 'Halo! Saya',
    en: 'Hello! I am',
  },
  'chat.greetingEnd': {
    id: '. Tanya saya apa saja tentang lokasi yang sedang diaudit.',
    en: '. Ask me anything about the location being audited.',
  },
  'chat.suggestions': { id: 'Saran', en: 'Suggestions' },
  'chat.thinking': { id: 'Berpikir…', en: 'Thinking…' },
  'chat.open': { id: 'Buka chatbot', en: 'Open chatbot' },
  'chat.minimize': { id: 'Minimalkan chatbot', en: 'Minimize chatbot' },
  'chat.send': { id: 'Kirim pesan', en: 'Send message' },
  'chat.sources': { id: 'Sumber Data', en: 'Data Sources' },
  'chat.followUps': { id: 'Pertanyaan Lanjutan', en: 'Follow-up Questions' },

  // ─── Shared Report ─────────────────────────────────────────────
  'report.createAudit': { id: 'Buat Audit', en: 'Create Audit' },
  'report.loading': { id: 'Memuat laporan…', en: 'Loading report…' },
  'report.notFound': { id: 'Laporan tidak ditemukan', en: 'Report not found' },
  'report.createOwn': { id: 'Buat audit sendiri', en: 'Create your own audit' },
  'report.locationAudit': { id: 'Audit Risiko Lokasi', en: 'Location Risk Audit' },
  'report.riskAnalysis': { id: 'Analisis Risiko', en: 'Risk Analysis' },
  'report.geotechSummary': { id: 'Ringkasan Geoteknik', en: 'Geotechnical Summary' },
  'report.liquefactionFs': { id: 'FS Likuefaksi', en: 'Liquefaction FS' },
  'report.siteClass': { id: 'Kelas Situs', en: 'Site Class' },
  'report.designPga': { id: 'PGA Desain', en: 'Design PGA' },
  'report.nearestFault': { id: 'Sesar Terdekat', en: 'Nearest Fault' },
  'report.flood': { id: 'Banjir', en: 'Flood' },
  'report.tsunami': { id: 'Tsunami', en: 'Tsunami' },
  'report.location': { id: 'Lokasi', en: 'Location' },
  'report.sourcesUnavailable': { id: 'Sebagian sumber data tidak tersedia saat audit ini dibuat', en: 'Some data sources were unavailable when this audit was created' },
  'report.unknownNotSafe': { id: 'Angka terkait ditandai sebagai tidak diketahui, bukan aman.', en: 'Related values are marked unknown, not safe.' },
  'report.notFinal': { id: 'Hasil ini belum merupakan penilaian engineering final.', en: 'This is not a final engineering assessment.' },
  'report.checkYourProperty': { id: 'Cek risiko properti Anda sendiri', en: 'Check your own property risk' },
  'report.ctaDescription': { id: 'Banjir, likuefaksi, stabilitas tanah, dan kegempaan — dari satu titik koordinat, dalam dua menit. Gratis.', en: 'Flood, liquefaction, soil stability, and seismic risk — from one coordinate in two minutes. Free.' },
  'report.startAudit': { id: 'Mulai Audit', en: 'Start Audit' },
  'report.disclaimer': { id: 'Audit ini adalah penyaringan awal (desk study), bukan pengganti uji tanah lapangan. Sumber:', en: 'This audit is an initial desk study, not a replacement for field soil testing. Sources:' },

  // ─── Audit Drawer ──────────────────────────────────────────────
  'drawer.title': { id: 'Laporan Audit S.A.F.E', en: 'S.A.F.E Audit Report' },
  'drawer.copyLink': { id: 'Salin Link', en: 'Copy Link' },
  'drawer.close': { id: 'Tutup laporan audit', en: 'Close audit report' },
  'drawer.copied': { id: 'Tersalin!', en: 'Copied!' },
  'drawer.battleTitle': {
    id: 'Laporan Perbandingan S.A.F.E',
    en: 'S.A.F.E Comparison Report',
  },
  'drawer.microAnalysis': {
    id: 'Analisis Mikro Lingkungan',
    en: 'Micro Environment Analysis',
  },
  'drawer.disclaimer': {
    id: 'Analisis dihasilkan AI. Konsultasikan dengan insinyur geoteknik berlisensi untuk penilaian akhir.',
    en: 'AI-generated analysis. Consult a licensed geotechnical engineer for final assessment.',
  },
  'drawer.geotechnical': { id: 'Geoteknik', en: 'Geotechnical' },
  'drawer.seismicLabel': { id: 'Seismik', en: 'Seismic' },
  'drawer.environment': { id: 'Lingkungan', en: 'Environment' },
  'drawer.reportLoading': {
    id: 'Laporan AI masih dimuat atau tidak tersedia.',
    en: 'AI report is still loading or unavailable.',
  },

  // ─── Command Palette ───────────────────────────────────────────
  'cmd.searchPlaceholder': {
    id: 'Cari lokasi, alamat, atau koordinat…',
    en: 'Search location, address, or coordinates…',
  },
  'cmd.favorites': { id: 'Favorit', en: 'Favorites' },
  'cmd.recent': { id: 'Terakhir dikunjungi', en: 'Recent' },
  'cmd.results': { id: 'Hasil pencarian', en: 'Search results' },
  'cmd.noResults': { id: 'Tidak ada hasil untuk', en: 'No results for' },
  'cmd.startTyping': {
    id: 'Mulai ketik untuk mencari lokasi di Indonesia…',
    en: 'Start typing to search locations in Indonesia…',
  },
  'cmd.navigate': { id: 'Navigasi', en: 'Navigate' },
  'cmd.select': { id: 'Pilih', en: 'Select' },
  'cmd.close': { id: 'Tutup', en: 'Close' },
  'cmd.label': { id: 'Cari lokasi', en: 'Search locations' },
  'cmd.clear': { id: 'Hapus pencarian lokasi', en: 'Clear location search' },
  'cmd.actions': { id: 'Aksi', en: 'Actions' },
  'cmd.restartTour': { id: 'Mulai Ulang Tur Onboarding', en: 'Restart onboarding tour' },

  // ─── Loading / Skeleton ─────────────────────────────────────────
  'loading.fetching': {
    id: 'Mengambil data geofisika…',
    en: 'Fetching geophysical data…',
  },

  // ─── Onboarding Tour ────────────────────────────────────────────
  'tour.welcome.title': {
    id: 'Pusat Komando Geoteknik S.A.F.E House',
    en: 'S.A.F.E House Geotechnical Command Center',
  },
  'tour.welcome.desc': {
    id: 'Selamat datang! S.A.F.E House mengintegrasikan data resmi BNPB InaRISK, sesar PuSGeN 2024, standar SNI 1726/8460, dan AI ter-grounding untuk menganalisis risiko lahan di seluruh Indonesia.',
    en: 'Welcome! S.A.F.E House integrates official BNPB InaRISK data, PuSGeN 2024 faults, SNI 1726/8460 standards, and grounded AI to analyze land safety across Indonesia.',
  },
  'tour.cursor.title': {
    id: 'Kursor Presisi & Konfirmasi Audit',
    en: 'Precision Reticle & Audit Confirmation',
  },
  'tour.cursor.desc': {
    id: 'Jelajahi peta dengan kursor hitam presisi tinggi dan pembaca koordinat real-time. Klik titik mana pun untuk membuka dialog konfirmasi audit yang aman.',
    en: 'Explore the map with high-precision black crosshairs and live coordinate readouts. Click any point to open a safe location audit confirmation dialog.',
  },
  'tour.search.title': {
    id: 'Pencarian Lokasi Cerdas (⌘K / Ctrl+K)',
    en: 'Smart Location Search (⌘K / Ctrl+K)',
  },
  'tour.search.desc': {
    id: 'Tekan ⌘K atau klik bilah pencarian untuk mencari alamat, nama jalan, kecamatan, atau koordinat langsung di seluruh Indonesia.',
    en: 'Press ⌘K or click search to look up addresses, streets, districts, or precise coordinates anywhere in Indonesia.',
  },
  'tour.mode.title': {
    id: 'Mode Audit vs Battle',
    en: 'Audit vs Battle Mode',
  },
  'tour.mode.desc': {
    id: 'Pilih Mode Audit untuk evaluasi komprehensif satu lokasi, atau Mode Battle untuk membandingkan 2 properti secara head-to-head.',
    en: 'Choose Audit Mode for comprehensive single-site evaluation, or Battle Mode to compare 2 candidate properties head-to-head.',
  },
  'tour.panel.title': {
    id: 'Dashboard Geoteknik & Laporan SNI (PDF)',
    en: 'Geotechnical Dashboard & SNI PDF Report',
  },
  'tour.panel.desc': {
    id: 'Panel ini menampilkan Skor S.A.F.E (0–100), Vs30, PGA, Kelas Situs (SA–SF), radar risiko, serta tombol ekspor Laporan SNI Profesional (PDF).',
    en: 'This panel displays S.A.F.E Score (0–100), Vs30, PGA, Site Class (SA–SF), risk radar, and the Professional SNI Report (PDF) export button.',
  },
  'tour.layers.title': {
    id: 'Layer Kebencanaan & Sesar Aktif',
    en: 'Hazard Layers & Active Faults',
  },
  'tour.layers.desc': {
    id: 'Buka panel layer untuk mengaktifkan overlay bahaya InaRISK (Banjir, Longsor, Gempa) dan jalur Sesar Aktif PuSGeN 2024 bergaris putus-putus.',
    en: 'Open layer controls to toggle official InaRISK hazard overlays (Flood, Landslide, Seismic) and PuSGeN 2024 dashed active fault lines.',
  },
  'tour.chatbot.title': {
    id: 'Konsultan S.A.F.E AI Chatbot',
    en: 'S.A.F.E AI Geotechnical Consultant',
  },
  'tour.chatbot.desc': {
    id: 'Tanyakan rekomendasi pondasi, mitigasi tanah lunak, dan aturan SNI langsung kepada AI yang memiliki konteks audit lokasi secara utuh.',
    en: 'Ask foundation recommendations, soft soil mitigation, and SNI building codes directly to an AI consultant with full audit context.',
  },
  'tour.finish.title': {
    id: 'Siap Memulai Audit',
    en: 'Ready to Audit',
  },
  'tour.finish.desc': {
    id: 'Klik titik mana saja di peta atau gunakan bilah pencarian untuk menjalankan audit kelayakan tanah dan mitigasi bencana pertama Anda!',
    en: 'Click any location on the map or search an address to run your first geotechnical land safety and hazard audit!',
  },
  'tour.stepOf': { id: 'dari', en: 'of' },
  'tour.getStarted': { id: 'Mulai Sekarang', en: 'Get Started' },
  'tour.skip': { id: 'Lewati', en: 'Skip' },
  'tour.back': { id: 'Kembali', en: 'Back' },
  'tour.next': { id: 'Lanjut', en: 'Next' },
  'tour.restart': {
    id: 'Mulai Ulang Tur Onboarding',
    en: 'Restart Onboarding Tour',
  },

  // ─── Toast Messages ─────────────────────────────────────────────
  'toast.aiLoading': {
    id: 'Menghasilkan laporan audit AI…',
    en: 'Generating AI audit report…',
  },
  'toast.aiReady': { id: 'Laporan audit AI siap', en: 'AI audit report ready' },
  'toast.aiFailed': {
    id: 'Laporan AI gagal — menggunakan data offline',
    en: 'AI report failed — using offline data',
  },
  'toast.shareCopied': {
    id: 'Link berbagi disalin ke clipboard',
    en: 'Share link copied to clipboard',
  },
  'toast.shareFailed': { id: 'Gagal menyalin link', en: 'Failed to copy link' },
};

/**
 * Get a translation function bound to the given language.
 * Falls back to Indonesian if key is missing.
 */
export function createT(lang = 'id') {
  return function t(key) {
    const entry = translations[key];
    if (!entry) return key;
    return entry[lang] ?? entry.id ?? key;
  };
}
