import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';

import HeroSection from '../components/landing/HeroSection';
import AboutSection from '../components/landing/AboutSection';
import ProcessSection from '../components/landing/ProcessSection';
import DisclaimerSection from '../components/landing/DisclaimerSection';
import FAQSection from '../components/landing/FAQSection';
import CTASection from '../components/landing/CTASection';
import { LanguageSelector } from '../components/ui/language-selector';

const COPY = {
  id: {
    heroNavBtn: 'Coba Gratis',
    heroBadge: 'Desk study geoteknik — InaRISK BNPB · USGS · PuSGeN',
    heroTitlePrefix: 'Parameter Teknis PBG, ',
    heroTitleItalic: 'Otomatis',
    heroSub: 'Kelas situs SNI 1726:2019, PGA desain, FS likuefaksi, dan bahaya banjir — dari satu titik koordinat, dalam dua menit. Untuk konsultan perizinan, developer, dan konsultan geoteknik.',
    heroCTA: 'Coba Gratis',
    demoLoc: 'Bandar Lampung',
    demoRisk: 'Risiko Sedang',

    aboutTitleLabel: 'TENTANG S.A.F.E HOUSE',
    aboutHeading: 'Parameter Teknis, Bukan Tebakan',
    aboutText: 'S.A.F.E House menyatukan data InaRISK BNPB, USGS, dan parameter PuSGeN menjadi satu desk study geoteknik. Untuk konsultan perizinan, developer, dan konsultan geoteknik yang harus menyiapkan parameter SNI 1726:2019 sebelum PBG — tanpa membuka lima portal pemerintah satu per satu.',
    
    aboutFactorSeismic: 'Risiko Seismik',
    aboutFactorSeismicDesc: 'Menganalisis kedekatan dengan sesar/patahan aktif regional, Peak Ground Acceleration (PGA) PuSGeN, dan potensi megathrust.',
    aboutFactorFlood: 'Risiko Banjir',
    aboutFactorFloodDesc: 'Mengukur ketinggian mdpl (meter di atas permukaan laut), jarak ke sungai/garis pantai, curah hujan harian, dan topografi aliran.',
    aboutFactorVolcanic: 'Risiko Vulkanik',
    aboutFactorVolcanicDesc: 'Mendeteksi letak gunung api aktif terdekat dan mencocokkan koordinat dengan Kawasan Rawan Bencana (KRB) vulkanis PVMBG.',
    aboutFactorGeotech: 'Risiko Geoteknik',
    aboutFactorGeotechDesc: 'Mengestimasi kelas situs tanah Vs30, menghitung Factor of Safety (FS) likuefaksi tanah secara asinkron, dan mengevaluasi kemiringan lereng.',

    processTitleLabel: 'CARA KERJA',
    processHeading: 'Proses Audit dalam 3 Langkah',
    processStep1Title: '1. Pilih Titik Properti',
    processStep1Desc: 'Klik koordinat mana saja pada peta Leaflet interaktif Indonesia, masukkan koordinat GPS secara manual, atau tempelkan tautan Google Maps.',
    processStep2Title: '2. Penarikan Data Geospasial',
    processStep2Desc: 'Sistem menarik data spasial secara paralel dari InaRISK BNPB, Open-Meteo, gempa USGS, dan objek lingkungan OpenStreetMap — dengan parameter PGA mengacu PuSGeN.',
    processStep3Title: '3. Laporan Parameter SNI',
    processStep3Desc: 'Sistem menghitung kelas situs Vs30, FS likuefaksi, PGA desain, dan bahaya banjir, lalu menyusun laporan siap lampir dengan sumber data tercantum — mengacu SNI 1726:2019.',

    disclaimerTitleLabel: 'TRANSPARANSI DATA',
    disclaimerHeading: 'Sumber Data & Disclaimer Hukum',
    disclaimerText: 'Analisis kami menggunakan data publik dari BNPB InaRISK, BMKG, PVMBG, USGS, dan OpenStreetMap. Laporan diagnostik awal berbasis AI ini TIDAK menggantikan uji tanah laboratorium atau survei geoteknik profesional langsung di lapangan. Konsultasikan dengan ahli struktur berlisensi sebelum mengambil keputusan finansial final.',
    disclaimerIntro: 'S.A.F.E House memetakan koordinat mikro Anda secara langsung ke basis data spasial resmi yang dikelola pemerintah Indonesia dan lembaga kegempaan global.',
    disclaimerProfessional: 'DISCLAIMER PROFESIONAL',
    disclaimerSupports: 'MENDUKUNG DIAGNOSIS',
    disclaimerDoesNotReplace: 'TIDAK MENGGANTIKAN',
    disclaimerSupport1: 'Pencocokan zona KRB vulkanik',
    disclaimerSupport2: 'Deteksi sesar aktif < 20 km',
    disclaimerSupport3: 'PGA & Factor of Safety likuefaksi',
    disclaimerLimit1: 'Uji penetrasi tanah (SPT/CPT)',
    disclaimerLimit2: 'Sertifikasi Laik Fungsi (SLF)',
    disclaimerLimit3: 'Desain fondasi sipil rinci',
    sourceInaRole: 'Bencana Mikro & Kerentanan Spasial',
    sourceInaDesc: 'Badan Nasional Penanggulangan Bencana',
    sourcePvmRole: 'Sesar Aktif & Kawasan Vulkanik (KRB)',
    sourcePvmDesc: 'Pusat Vulkanologi dan Mitigasi Bencana Geologi',
    sourceBmkgRole: 'Katalis Seismik & Peak Ground Acceleration',
    sourceBmkgDesc: 'Badan Meteorologi Klimatologi dan Geofisika',
    sourceUsgsRole: 'Historis Kekuatan Gempa Bumi regional',
    sourceUsgsDesc: 'United States Geological Survey',

    faqHeading: 'Pertanyaan yang Sering Diajukan',
    faqSub: 'Temukan jawaban cepat seputar audit geologi, data spasial, dan batasan analisis risiko S.A.F.E House.',
    faqQ1: 'Apa itu S.A.F.E House?',
    faqA1: 'S.A.F.E House (Seismic Analysis for Foundation Evaluation) adalah platform audit geospasial berbasis AI untuk menganalisis risiko kebencanaan properti secara cepat dan akurat di Indonesia.',
    faqQ2: 'Dari mana asal data kerawanan bencana di sistem ini?',
    faqA2: 'Kami menarik data mikro geospasial secara real-time dari institusi resmi Indonesia dan dunia, termasuk data InaRISK BNPB (banjir/kebencanaan), PVMBG (zonasi sesar aktif & KRB gunung api), BMKG (PGA & parameter seismik), serta katalog gempa USGS.',
    faqQ3: 'Apakah laporan audit AI ini 100% akurat?',
    faqA3: 'Analisis awal ini merupakan penaksiran cepat berbasis data spasial publik. Hasil analisis ini tidak menggantikan uji tanah laboratorium (sondir/SPT) atau survei langsung insinyur geoteknik di lapangan.',
    faqQ4: 'Bagaimana cara kerja simulasi PGA dan gempa di peta?',
    faqA4: 'Pengguna dapat memilih titik koordinat apa saja di Indonesia. Sistem akan menghitung percepatan tanah (PGA) berdasarkan model redaman gempa, memperkirakan respon seismik lokal (Vs30), dan menganalisis potensi likuefaksi asinkron secara langsung.',
    faqQ5: 'Apakah riwayat pencarian lokasi saya aman?',
    faqA5: 'Ya. Semua koordinat dan histori pencarian properti disimpan secara lokal di dalam local storage peramban Anda. Kami tidak menyimpan histori pencarian Anda di server kami untuk menjamin kerahasiaan kepemilikan aset properti Anda.',

    aboutMapLabel: 'PETA RISIKO BERBASIS DATA TERBUKA',
    aboutLocalPrompt: 'PILIH TITIK UNTUK MELIHAT RISIKO LOKAL',
    processDataReady: 'SUMBER DATA GEOSPASIAL · TERSEDIA',
    processStageLocation: 'TAHAP 01 / LOKASI',
    processStagePull: 'TAHAP 02 / PENARIKAN DATA',
    processStageDiagnostic: 'TAHAP 03 / DIAGNOSTIK',
    processSelection: 'SELEKSI TITIK',
    processInjection: 'INJEKSI DATA API',
    processReport: 'LAPORAN GEOLOGI',
    processMapView: 'TAMPILAN PEMILIHAN TITIK S.A.F.E',
    processPipeline: 'PIPELINE PENGUMPULAN DATA ASINKRON',
    processListening: 'MENDENGARKAN',
    processConnecting: 'Menghubungkan ke API geospasial…',
    processTotalCalls: 'TOTAL PANGGILAN: 4 ENDPOINT API',
    processAggregate: 'AGREGAT: 0,92 DETIK',
    processReportDrawer: 'PANEL LAPORAN BERBASIS SNI',

    ctaHeading: 'Siapkan parameter PBG\ntanpa buka lima portal.',
    ctaSub: 'Satu koordinat, parameter SNI 1726:2019 dan bahaya banjir siap lampir dalam dua menit.',
    ctaBtn: 'Coba Audit Gratis',
  },
  en: {
    heroNavBtn: 'Start Analysis',
    heroBadge: 'Now with InaRISK BNPB 2026 data ✨',
    heroTitlePrefix: 'Geological Risk Analysis Made ',
    heroTitleItalic: 'Calculated',
    heroSub: 'Instantly evaluate active faults, liquefaction potential, flood hazards, and geotechnical stability in Indonesia powered by AI.',
    heroCTA: 'Analyze Now',
    demoLoc: 'Cibubur, Jakarta',
    demoRisk: 'Medium Risk',

    aboutTitleLabel: 'ABOUT S.A.F.E HOUSE',
    aboutHeading: 'Build with Certainty, Not Speculation',
    aboutText: 'S.A.F.E House (Seismic Analysis for Foundation Evaluation) combines national spatial data with an AI-assisted explanation layer to provide rapid, transparent risk summaries before you build, buy, or rent property.',
    
    aboutFactorSeismic: 'Seismic Risk',
    aboutFactorSeismicDesc: 'Analyzes proximity to regional active faults, PuSGeN Peak Ground Acceleration (PGA), and megathrust potentials.',
    aboutFactorFlood: 'Flood Risk',
    aboutFactorFloodDesc: 'Measures elevation above sea level, distance to rivers or coastlines, daily precipitation, and flow topography.',
    aboutFactorVolcanic: 'Volcanic Risk',
    aboutFactorVolcanicDesc: 'Detects closest active volcanoes and cross-references coordinates with PVMBG volcanic hazard zones (KRB).',
    aboutFactorGeotech: 'Geotechnical Risk',
    aboutFactorGeotechDesc: 'Estimates Vs30 soil class, calculates liquefaction Factor of Safety (FS) asynchronously, and evaluates slope grade.',

    processTitleLabel: 'HOW IT WORKS',
    processHeading: 'Audit Process in 3 Steps',
    processStep1Title: '1. Select Property Spot',
    processStep1Desc: 'Click anywhere on the interactive Leaflet map of Indonesia, type in GPS coordinates manually, or paste a Google Maps link.',
    processStep2Title: '2. Geospatial Data Fetching',
    processStep2Desc: 'In 3 seconds, our system fetches micro-spatial data from InaRISK BNPB, Open-Meteo, PVMBG, BMKG, and USGS earthquake catalogs.',
    processStep3Title: '3. Geotechnical Audit & AI Report',
    processStep3Desc: 'The AI explains location-specific risk evidence and writes a comprehensive SNI-compliant report.',

    disclaimerTitleLabel: 'DATA TRANSPARENCY',
    disclaimerHeading: 'Data Sources & Legal Disclaimer',
    disclaimerText: 'Our analysis uses public data from BNPB InaRISK, BMKG, PVMBG, USGS, and OpenStreetMap. This preliminary diagnostic AI report does NOT replace laboratory soil testing or professional on-site geotechnical surveys. Consult a licensed structural engineer before making final financial decisions.',
    disclaimerIntro: 'S.A.F.E House maps your micro-coordinate directly to official spatial databases maintained by Indonesian government agencies and global seismological institutions.',
    disclaimerProfessional: 'PROFESSIONAL DISCLAIMER',
    disclaimerSupports: 'SUPPORTS SCREENING',
    disclaimerDoesNotReplace: 'DOES NOT REPLACE',
    disclaimerSupport1: 'Volcanic hazard-zone matching',
    disclaimerSupport2: 'Active-fault detection within 20 km',
    disclaimerSupport3: 'PGA & liquefaction Factor of Safety',
    disclaimerLimit1: 'Soil penetration testing (SPT/CPT)',
    disclaimerLimit2: 'Occupancy certification (SLF)',
    disclaimerLimit3: 'Detailed civil foundation design',
    sourceInaRole: 'Micro Hazards & Spatial Vulnerability',
    sourceInaDesc: 'National Disaster Management Agency',
    sourcePvmRole: 'Active Faults & Volcanic Zones (KRB)',
    sourcePvmDesc: 'Center for Volcanology and Geological Hazard Mitigation',
    sourceBmkgRole: 'Seismic Catalyst & Peak Ground Acceleration',
    sourceBmkgDesc: 'Agency for Meteorology, Climatology and Geophysics',
    sourceUsgsRole: 'Regional Earthquake Magnitude History',
    sourceUsgsDesc: 'United States Geological Survey',

    faqHeading: 'Frequently Asked Questions',
    faqSub: 'Find quick answers about geological audits, spatial data, and the limits of S.A.F.E House risk assessments.',
    faqQ1: 'What is S.A.F.E House?',
    faqA1: 'S.A.F.E House (Seismic Analysis for Foundation Evaluation) is an AI-powered geospatial audit platform that instantly analyzes property natural hazard risks in Indonesia.',
    faqQ2: 'Where does the hazard data come from?',
    faqA2: 'We pull real-time micro-geospatial data from official agencies including InaRISK BNPB (flood and general hazards), PVMBG (active faults & volcanic hazard zones), BMKG (PGA & seismic parameters), and the USGS earthquake catalog.',
    faqQ3: 'Is the AI audit report 100% accurate?',
    faqA3: 'This preliminary diagnostic is a rapid assessment based on public geospatial databases and location-specific AI checks. It does not replace physical soil testing (sonding/SPT) or direct professional geotechnical surveys.',
    faqQ4: 'How do the PGA and earthquake simulations work?',
    faqA4: 'You can choose any coordinate in Indonesia. The system calculates ground acceleration (PGA) based on attenuation models, estimates local site class response (Vs30), and runs an asynchronous soil liquefaction analysis.',
    faqQ5: 'Is my property location history secure?',
    faqA5: 'Yes. All audited coordinates and search histories are stored locally in your browser\'s local storage. We do not store your private asset searches on our servers to ensure full confidentiality.',

    aboutMapLabel: 'OPEN-DATA RISK MAP',
    aboutLocalPrompt: 'SELECT A POINT TO VIEW LOCAL RISK',
    processDataReady: 'GEOSPATIAL DATA SOURCES · AVAILABLE',
    processStageLocation: 'STAGE 01 / LOCATION',
    processStagePull: 'STAGE 02 / DATA FETCH',
    processStageDiagnostic: 'STAGE 03 / DIAGNOSTICS',
    processSelection: 'POINT SELECTION',
    processInjection: 'API DATA INJECTION',
    processReport: 'GEOLOGICAL REPORT',
    processMapView: 'S.A.F.E POINT SELECTION VIEW',
    processPipeline: 'ASYNC DATA GATHERING PIPELINE',
    processListening: 'LISTENING',
    processConnecting: 'Connecting to geospatial APIs…',
    processTotalCalls: 'TOTAL CALLS: 4 API ENDPOINTS',
    processAggregate: 'AGGREGATE: 0.92 SEC',
    processReportDrawer: 'SNI-COMPLIANT REPORT DRAWER',

    ctaHeading: 'Don\'t buy property\nwith your eyes closed.',
    ctaSub: 'Evaluate geological risk and protect your property investment before it is too late.',
    ctaBtn: 'Start Your Property Audit',
  },
};

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [hoveredLink, setHoveredLink] = useState(null);
  const navigate = useNavigate();
  const lang = useAppStore((s) => s.lang);
  const dict = COPY[lang] || COPY.id;

  const t = useCallback((key, fallback) => dict[key] ?? fallback ?? key, [dict]);

  useEffect(() => {
    document.title = "S.A.F.E House · Audit Risiko Geologi & Geoteknik Properti Indonesia";
    
    // Dynamic SEO Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = "Audit kerentanan geologis properti instan di Indonesia. Analisis sesar aktif, bahaya banjir, letusan gunung api, dan likuefaksi tanah berbasis data spasial InaRISK BNPB.";

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);

    document.documentElement.classList.add('landing-scroll');
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.documentElement.classList.remove('landing-scroll');
    };
  }, []);

  return (
    <div className="landing min-h-screen w-screen flex flex-col bg-background text-foreground overflow-x-hidden relative select-none">
      {/* Navbar */}
      <motion.header 
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500 ${
          isScrolled 
            ? 'py-3 bg-bg/90 backdrop-blur-md border-b border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]' 
            : 'py-5 bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 flex items-center justify-between transition-all duration-500">
          {/* Left: Logo + Descriptor */}
          <motion.div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => navigate('/')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <div className="relative">
              <img 
                src="/safe_house_logo.png" 
                alt="S.A.F.E House" 
                className="h-20 md:h-24 w-auto object-contain -my-5 md:-my-6 transition-all duration-300 group-hover:brightness-110 group-hover:drop-shadow-[0_0_8px_rgba(212,149,106,0.5)]" 
              />
            </div>
            <div className="hidden sm:flex flex-col justify-center border-l border-white/10 pl-3 leading-tight">
              <span className="text-[12px] font-semibold tracking-wide text-text-primary">
                S.A.F.E House
              </span>
              <span className="text-[10px] text-text-muted font-mono tracking-wider">
                {lang === 'en' ? 'AI Geotechnical & Risk Platform' : 'Platform Audit Geoteknik & Risiko Bencana'}
              </span>
            </div>
          </motion.div>

          {/* Center: Nav links (Hidden on mobile) */}
          <div 
            className="hidden md:flex items-center gap-1 px-1 py-1 rounded-xl border border-white/5 bg-white/[0.01] backdrop-blur-md relative"
            onMouseLeave={() => setHoveredLink(null)}
          >
            {[
              { label: 'About', target: 'about' },
              { label: 'Workflow', target: 'process' },
              { label: 'Disclaimer', target: 'disclaimer' },
              { label: 'FAQ', target: 'faq' },
            ].map((link) => (
              <span 
                key={link.target}
                className="relative text-[10px] uppercase tracking-[0.15em] font-mono font-bold px-3.5 py-1.5 rounded-lg text-text-secondary hover:text-text-primary cursor-pointer transition-colors duration-300 z-10 select-none" 
                onMouseEnter={() => setHoveredLink(link.target)}
                onClick={() => document.getElementById(link.target)?.scrollIntoView({ behavior: 'smooth' })}
              >
                {hoveredLink === link.target && (
                  <motion.span
                    layoutId="nav-hover-pill"
                    className="absolute inset-0 bg-white/5 rounded-lg -z-10"
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                )}
                {link.label}
              </span>
            ))}
          </div>

          {/* Right: CTA + Lang toggle */}
          <div className="flex items-center gap-3">
            <LanguageSelector />
            
            <motion.button
              onClick={() => navigate('/app')}
              whileHover="hover"
              whileTap={{ scale: 0.97 }}
              className="group relative overflow-hidden rounded-lg px-4 py-1.5 text-[10px] md:text-xs font-bold tracking-wider uppercase bg-accent text-bg hover:bg-accent/90 transition-all font-body active:scale-[0.97] btn-press shadow-[0_0_15px_rgba(212,149,106,0.15)] flex items-center gap-1 border border-accent/25 hover:shadow-[0_0_20px_rgba(212,149,106,0.3)] duration-300"
            >
              <span>{t('heroNavBtn', 'Mulai Analisis')}</span>
              <motion.span
                variants={{
                  hover: { x: 2, y: -2 }
                }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="flex items-center"
              >
                <ArrowUpRight size={13} className="text-bg" />
              </motion.span>
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <HeroSection t={t} />

      {/* About Section */}
      <div id="about">
        <AboutSection t={t} />
      </div>

      {/* Process Section */}
      <div id="process">
        <ProcessSection t={t} />
      </div>

      {/* Disclaimer Section */}
      <div id="disclaimer">
        <DisclaimerSection t={t} />
      </div>

      {/* FAQ Section */}
      <div id="faq">
        <FAQSection t={t} />
      </div>

      {/* Footer / CTA Section */}
      <CTASection t={t} />
    </div>
  );
}
