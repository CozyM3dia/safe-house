import { motion } from 'framer-motion';
import { useState } from 'react';

export default function AboutSection({ t }) {
  const [seismicTrigger, setSeismicTrigger] = useState(false);

  // Animation variants
  const sectionReveal = {
    hidden: { opacity: 0, y: 40 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: [0.25, 1, 0.5, 1] }
    }
  };

  const cardReveal = (delay = 0) => ({
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, delay, ease: [0.25, 1, 0.5, 1] }
    }
  });

  return (
    <section className="relative w-full py-28 px-6 md:px-12 lg:px-20 bg-background border-t border-border overflow-hidden select-none landing-grid-decor">
      
      {/* Rotating Geological Compass Dial in the background */}
      <div className="absolute right-[-100px] bottom-[-100px] md:right-[-50px] md:bottom-[-50px] w-96 h-96 opacity-[0.03] pointer-events-none animate-slow-rotate z-0">
        <svg className="w-full h-full text-accent" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.5">
          <circle cx="50" cy="50" r="45" />
          <circle cx="50" cy="50" r="35" strokeDasharray="2,2" />
          <circle cx="50" cy="50" r="25" />
          <circle cx="50" cy="50" r="15" />
          <line x1="50" y1="5" x2="50" y2="95" />
          <line x1="5" y1="50" x2="95" y2="50" />
          <line x1="18.18" y1="18.18" x2="81.82" y2="81.82" />
          <line x1="18.18" y1="81.82" x2="81.82" y2="18.18" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 lg:gap-24 items-start relative z-10">
        
        {/* Left Side: Editorial Typography & Copy */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={sectionReveal}
          className="w-full lg:w-[42%] lg:sticky lg:top-28 flex flex-col pr-0 lg:pr-6"
        >
          {/* Section label */}
          <span className="text-[10px] md:text-xs font-bold tracking-[0.2em] text-accent uppercase font-body mb-4 block">
            {t('aboutTitleLabel', 'TENTANG S.A.F.E HOUSE')}
          </span>
          
          {/* Main Heading */}
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-foreground font-light leading-[1.05] tracking-tight">
            {t('aboutHeading', 'Membangun dengan Kepastian, Bukan Spekulasi')}
          </h2>

          {/* Body Narrative */}
          <p className="mt-6 text-sm md:text-base text-muted-foreground leading-relaxed font-body font-normal max-w-[55ch]">
            {t('aboutText', 'S.A.F.E House menyatukan data InaRISK BNPB, USGS, dan parameter PuSGeN menjadi satu desk study geoteknik. Untuk konsultan perizinan, developer, dan konsultan geoteknik yang harus menyiapkan parameter SNI 1726:2019 sebelum PBG — tanpa membuka lima portal pemerintah satu per satu.')}
          </p>

          {/* New Custom Geological strata image */}
          <div className="mt-8 rounded-xl border border-accent/20 overflow-hidden relative aspect-[16/10] w-full bg-[#0c0806] group shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <img 
              src="/geological_hazard.png" 
              alt="Geological Strata Model" 
              className="w-full h-full object-cover opacity-75 group-hover:opacity-95 transition-all duration-700 scale-[1.01] group-hover:scale-105"
            />
            {/* laser scanner beam */}
            <div className="absolute top-0 inset-x-0 h-0.5 bg-accent/40 shadow-[0_0_12px_rgba(212,149,106,0.7)] animate-scanning" />
            <div className="absolute top-3 left-3 bg-[#0a0705]/95 border border-accent/20 rounded px-2.5 py-1 text-[8px] font-mono tracking-wider text-accent backdrop-blur-sm">
              RAG GEO-DIAGNOSTIC VISUALIZATION
            </div>
          </div>
        </motion.div>

        {/* Right Side: Asymmetric Hazard Grid */}
        <div className="w-full lg:w-[58%] flex flex-col gap-6">
          
          {/* 1. SEISMIK - Saturated Large Feature Card */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={cardReveal(0.1)}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.3 }}
            onClick={() => setSeismicTrigger(!seismicTrigger)}
            className="group relative rounded-2xl border border-accent/20 bg-muted/30 p-6 md:p-8 cursor-pointer overflow-hidden transition-colors hover:border-accent/40 z-10"
          >
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-radial-gradient from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center relative z-10">
              <div className="flex-1 max-w-[340px]">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
                  <h3 className="text-lg font-bold text-foreground font-body">
                    {t('aboutFactorSeismic', 'Risiko Seismik')}
                  </h3>
                </div>
                <p className="mt-3 text-xs md:text-sm text-muted-foreground leading-relaxed font-body">
                  {t('aboutFactorSeismicDesc', 'Menganalisis kedekatan dengan sesar/patahan aktif regional, Peak Ground Acceleration (PGA) PuSGeN, dan potensi megathrust.')}
                </p>
              </div>

              {/* Seismograph interactive SVG visualizer */}
              <div className="w-full md:w-56 h-28 bg-background/50 rounded-lg border border-border/80 relative overflow-hidden flex flex-col justify-end p-2 shrink-0">
                <div className="absolute top-2 left-2 text-[8px] font-mono text-muted-foreground/75 tracking-wider uppercase">
                  PGA SENSOR INPUT: {seismicTrigger ? 'ACTIVE DETECT' : 'SIMULATION'}
                </div>
                <div className="absolute top-2 right-2 text-[8px] font-mono text-accent font-semibold">
                  {seismicTrigger ? '0.78g max' : '0.12g normal'}
                </div>

                <svg className="w-full h-16 opacity-85" viewBox="0 0 200 60" preserveAspectRatio="none">
                  <path
                    d={
                      seismicTrigger
                        ? "M0,30 L30,30 L40,10 L48,50 L56,5 L64,55 L72,20 L80,45 L88,30 L110,30 L120,5 L128,55 L136,15 L144,45 L152,30 L200,30"
                        : "M0,30 L30,30 L35,28 L40,32 L45,27 L50,33 L55,29 L60,31 L65,30 L100,30 L105,25 L110,35 L115,20 L120,40 L125,28 L130,32 L135,30 L200,30"
                    }
                    fill="none"
                    stroke={seismicTrigger ? "rgb(239, 68, 68)" : "hsl(var(--accent))"}
                    strokeWidth="1.5"
                    className="transition-all duration-500"
                  />
                  <line x1="0" y1="15" x2="200" y2="15" stroke="rgba(255,210,170,0.05)" strokeDasharray="3,3" />
                  <line x1="0" y1="45" x2="200" y2="45" stroke="rgba(255,210,170,0.05)" strokeDasharray="3,3" />
                </svg>
                <div className="text-[7px] font-mono text-muted-foreground/50 text-right mt-1">
                  TAP TO TRIGGER EARTHQUAKE SIMULATION
                </div>
              </div>
            </div>
          </motion.div>

          {/* Staggered Row 2: Flood & Volcanic (asymmetric split) */}
          <div className="flex flex-col md:flex-row gap-6">
            
            {/* 2. BANJIR - Asymmetric 58% width card */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={cardReveal(0.2)}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.3 }}
              className="group relative rounded-2xl border border-border/80 bg-background p-6 md:p-7 flex-1 md:flex-[1.2] cursor-pointer overflow-hidden transition-colors hover:border-accent/30 z-10"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-radial-gradient from-accent/5 to-transparent rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
              
              <div className="flex flex-col justify-between h-full relative z-10">
                <div>
                  <h3 className="text-base font-bold text-foreground font-body flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent/60" />
                    {t('aboutFactorFlood', 'Risiko Banjir')}
                  </h3>
                  <p className="mt-3 text-xs text-muted-foreground leading-relaxed font-body">
                    {t('aboutFactorFloodDesc', 'Mengukur ketinggian mdpl (meter di atas permukaan laut), jarak ke sungai/garis pantai, curah hujan harian, dan topografi aliran.')}
                  </p>
                </div>

                {/* Elevation/River contour custom visualization */}
                <div className="mt-6 w-full h-20 bg-muted/20 rounded-lg border border-border/60 overflow-hidden relative flex items-end">
                  <div className="absolute top-2 left-2 text-[7px] font-mono text-muted-foreground/80 tracking-wider">
                    ELEVATION PROFILE & RUNOFF
                  </div>
                  <div className="absolute top-2 right-2 text-[7px] font-mono text-foreground font-semibold">
                    12.5 mdpl (Lowland)
                  </div>
                  
                  <svg className="w-full h-14" viewBox="0 0 150 40" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.02" />
                      </linearGradient>
                      <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0.05" />
                      </linearGradient>
                    </defs>
                    <path d="M0,35 Q30,22 75,32 T150,28 L150,40 L0,40 Z" fill="url(#waterGrad)" />
                    <path d="M0,28 Q45,35 90,15 T150,38 L150,40 L0,40 Z" fill="url(#groundGrad)" stroke="hsl(var(--accent))" strokeWidth="1" />
                    <circle cx="90" cy="15" r="2.5" fill="rgb(59, 130, 246)" className="animate-pulse" />
                  </svg>
                </div>
              </div>
            </motion.div>

            {/* 3. VULKANIK - Asymmetric 42% width card */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={cardReveal(0.3)}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.3 }}
              className="group relative rounded-2xl border border-border/80 bg-background p-6 md:p-7 flex-1 md:flex-[0.8] cursor-pointer overflow-hidden transition-colors hover:border-accent/30 z-10"
            >
              <div className="flex flex-col justify-between h-full relative z-10">
                <div>
                  <h3 className="text-base font-bold text-foreground font-body flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent/60" />
                    {t('aboutFactorVolcanic', 'Risiko Vulkanik')}
                  </h3>
                  <p className="mt-3 text-xs text-muted-foreground leading-relaxed font-body">
                    {t('aboutFactorVolcanicDesc', 'Mendeteksi letak gunung api aktif terdekat dan mencocokkan koordinat dengan Kawasan Rawan Bencana (KRB) vulkanis.')}
                  </p>
                </div>

                {/* Concentric PVMBG risk circles visualizer */}
                <div className="mt-6 w-full h-20 bg-muted/20 rounded-lg border border-border/60 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute top-2 left-2 text-[7px] font-mono text-muted-foreground/80 tracking-wider">
                    KRB VOLCANIC RADAR
                  </div>
                  
                  <div className="w-14 h-14 rounded-full border border-accent/10 flex items-center justify-center relative">
                    <div className="w-10 h-10 rounded-full border border-accent/20 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full border border-red-500/30 bg-red-950/20 flex items-center justify-center animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      </div>
                    </div>
                    <span className="absolute -top-3 text-[6px] font-mono text-muted-foreground/50">KRB III</span>
                    <span className="absolute -bottom-3 text-[6px] font-mono text-muted-foreground/50">KRB I</span>
                  </div>

                  <div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/5 to-transparent pointer-events-none"
                    style={{
                      transform: 'skewX(-20deg) translateX(-100%)',
                      animation: 'shimmer 3s infinite linear'
                    }}
                  />
                </div>
              </div>
            </motion.div>

          </div>

          {/* 4. GEOTEKNIK - Tactile Layered Soil Card */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={cardReveal(0.4)}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.3 }}
            className="group relative rounded-2xl border border-border/80 bg-background p-6 md:p-8 cursor-pointer overflow-hidden transition-colors hover:border-accent/30 z-10"
          >
            <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center relative z-10">
              <div className="flex-1 max-w-[340px]">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-accent/60" />
                  <h3 className="text-base font-bold text-foreground font-body">
                    {t('aboutFactorGeotech', 'Risiko Geoteknik')}
                  </h3>
                </div>
                <p className="mt-3 text-xs md:text-sm text-muted-foreground leading-relaxed font-body">
                  {t('aboutFactorGeotechDesc', 'Mengestimasi kelas situs tanah Vs30, menghitung Factor of Safety (FS) likuifaksi tanah secara asinkron, dan mengevaluasi kemiringan lereng.')}
                </p>
              </div>

              {/* Layered Soil Visualizer */}
              <div className="w-full md:w-56 h-28 bg-muted/20 rounded-lg border border-border/60 overflow-hidden relative flex flex-col justify-between shrink-0 p-2.5 font-mono text-[8px]">
                <div className="flex justify-between items-center text-muted-foreground/80 border-b border-border/30 pb-1">
                  <span>SOIL STRATA MODEL</span>
                  <span className="text-accent">Vs30: 380m/s</span>
                </div>
                
                <div className="flex-1 flex flex-col gap-1 mt-1.5">
                  <div className="flex-1 rounded bg-[#3b2a1a]/30 border border-[#d4956a]/15 flex items-center justify-between px-2 text-muted-foreground text-[7px] relative overflow-hidden">
                    <span>Strata I: Lanau Pasiran</span>
                    <span>0 - 3.5m</span>
                    <div className="absolute inset-0 pointer-events-none bg-repeating-linear-gradient opacity-10"
                      style={{
                        backgroundImage: 'repeating-linear-gradient(45deg, currentColor, currentColor 2px, transparent 2px, transparent 6px)',
                        color: 'hsl(var(--accent))'
                      }}
                    />
                  </div>
                  
                  <div className="flex-1 rounded bg-[#2e2014]/40 border border-[#d4956a]/10 flex items-center justify-between px-2 text-muted-foreground text-[7px] relative overflow-hidden">
                    <span>Strata II: Pasir Halus</span>
                    <span>3.5 - 12m</span>
                    <div className="absolute inset-0 pointer-events-none bg-repeating-linear-gradient opacity-10"
                      style={{
                        backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
                        backgroundSize: '4px 4px',
                        color: 'hsl(var(--accent))'
                      }}
                    />
                  </div>

                  <div className="flex-1 rounded bg-[#1e140d]/65 border border-border/60 flex items-center justify-between px-2 text-muted-foreground text-[7px] relative">
                    <span>Strata III: Lempung Keras</span>
                    <span>&gt; 12m</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[7px] text-muted-foreground/60 pt-1 border-t border-border/20 mt-1">
                  <span>FS LIQUEFACTION:</span>
                  <span className="text-green-400 font-bold">1.42 (SAFE)</span>
                </div>
              </div>
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
}
