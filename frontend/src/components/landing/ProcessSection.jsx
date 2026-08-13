import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function ProcessSection({ t }) {
  const [apiLogs, setApiLogs] = useState([]);
  const [terminalOpacity, setTerminalOpacity] = useState(1);

  // Infinite simulation loop with smooth fade transitions to avoid "blep" flashing
  useEffect(() => {
    const logs = [
      { label: 'InaRISK BNPB', detail: 'Radius Query 200m', time: '280ms', status: 'SUCCESS' },
      { label: 'PVMBG Volcanoes', detail: 'Sesar & KRB Maps', time: '140ms', status: 'SUCCESS' },
      { label: 'BMKG / USGS Cat.', detail: 'Seismicity 1970-2026', time: '390ms', status: 'SUCCESS' },
      { label: 'Open-Meteo', detail: 'Precipitation 30-yr Hist.', time: '110ms', status: 'SUCCESS' },
    ];

    let currentIndex = 0;
    let interval;

    const runSimulation = () => {
      setTerminalOpacity(1);
      setApiLogs([]);
      currentIndex = 0;
      
      interval = setInterval(() => {
        if (currentIndex < logs.length) {
          const currentLog = logs[currentIndex];
          setApiLogs(prev => [...prev, currentLog]);
          currentIndex++;
        } else {
          clearInterval(interval);
          
          // Wait 3.5 seconds with logs fully visible
          setTimeout(() => {
            // Trigger fade out
            setTerminalOpacity(0);
            
            // Wait 500ms for fade out transition, then restart
            setTimeout(() => {
              runSimulation();
            }, 500);
          }, 3500);
        }
      }, 1200);
    };

    runSimulation();
    return () => {
      clearInterval(interval);
    };
  }, []);

  // Alternating animation variants
  const slideLeft = {
    hidden: { opacity: 0, x: -60 },
    visible: { 
      opacity: 1, 
      x: 0, 
      transition: { duration: 0.8, ease: [0.25, 1, 0.5, 1] } 
    }
  };

  const slideRight = {
    hidden: { opacity: 0, x: 60 },
    visible: { 
      opacity: 1, 
      x: 0, 
      transition: { duration: 0.8, ease: [0.25, 1, 0.5, 1] } 
    }
  };

  return (
    <section className="relative w-full py-28 px-6 md:px-12 lg:px-20 bg-muted/10 border-t border-border overflow-hidden select-none landing-grid-decor">
      
      {/* Subtle floating coordinate markers in background */}
      <div className="absolute left-[5%] top-[10%] text-[9px] font-mono text-accent/15 select-none pointer-events-none">
        GRID REF: 107.6152°E / 6.7820°S
      </div>
      <div className="absolute right-[5%] bottom-[15%] text-[9px] font-mono text-accent/15 select-none pointer-events-none">
        DATALOGGER CHANNEL A & B STATUS: NOMINAL
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header Block */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="flex flex-col mb-20 max-w-2xl"
        >
          <span className="text-[10px] md:text-xs font-bold tracking-[0.2em] text-accent uppercase font-body mb-4 block">
            {t('processTitleLabel', 'CARA KERJA')}
          </span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-foreground font-light leading-[1.05] tracking-tight">
            {t('processHeading', 'Proses Audit dalam 3 Langkah')}
          </h2>
        </motion.div>

        {/* Chronological Vertical Grid */}
        <div className="flex flex-col gap-28">
          
          {/* STEP 1: Pilih Titik Properti */}
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center justify-between">
            {/* Left Column: Explainer */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={slideLeft}
              className="w-full lg:w-[45%] flex flex-col"
            >
              <span className="text-[11px] font-mono text-accent/60 uppercase tracking-widest mb-2 font-bold">TAHAP 01 / LOKASI</span>
              <h3 className="font-display text-3xl md:text-4xl text-foreground font-medium leading-snug">
                {t('processStep1Title', '1. Pilih Titik Properti')}
              </h3>
              <p className="mt-4 text-xs md:text-sm text-muted-foreground leading-relaxed font-body font-normal">
                {t('processStep1Desc', 'Klik koordinat mana saja pada peta Leaflet interaktif Indonesia, masukkan koordinat GPS secara manual, atau tempelkan tautan Google Maps.')}
              </p>
              
              {/* Timeline dot step connection */}
              <div className="mt-8 flex items-center gap-3">
                <span className="h-6 w-6 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-[10px] font-bold text-accent">01</span>
                <div className="h-[1px] w-24 bg-border/60" />
                <span className="text-[10px] text-muted-foreground tracking-wider uppercase font-mono">SELEKSI TITIK</span>
              </div>
            </motion.div>

            {/* Right Column: Visual Real Map screenshot with pin */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={slideRight}
              className="w-full lg:w-[50%] h-[280px] bg-background rounded-2xl border border-border/85 relative overflow-hidden group shadow-[0_4px_30px_rgba(0,0,0,0.4)]"
            >
              <img 
                src="/app_step1_map.png" 
                alt="Peta Leaflet S.A.F.E House" 
                className="w-full h-full object-cover object-center opacity-80 group-hover:opacity-100 transition-all duration-500 scale-[1.01] group-hover:scale-105"
              />
              <div className="absolute inset-0 border border-white/5 rounded-2xl pointer-events-none" />
              <div className="absolute top-3 left-3 bg-[#0a0705]/95 border border-accent/20 rounded px-2.5 py-1 text-[8px] font-mono tracking-wider text-accent backdrop-blur-sm">
                MAP VIEW: S.A.F.E POINT SELECTION
              </div>
            </motion.div>
          </div>

          {/* STEP 2: Penarikan Data Geospasial */}
          <div className="flex flex-col lg:flex-row-reverse gap-12 lg:gap-20 items-center justify-between">
            {/* Left Column: Explainer */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={slideRight}
              className="w-full lg:w-[45%] flex flex-col"
            >
              <span className="text-[11px] font-mono text-accent/60 uppercase tracking-widest mb-2 font-bold">TAHAP 02 / PULL</span>
              <h3 className="font-display text-3xl md:text-4xl text-foreground font-medium leading-snug">
                {t('processStep2Title', '2. Penarikan Data Geospasial')}
              </h3>
              <p className="mt-4 text-xs md:text-sm text-muted-foreground leading-relaxed font-body font-normal">
                {t('processStep2Desc', 'Dalam 3 detik, sistem kami menarik data spasial mikro dari server InaRISK BNPB, Open-Meteo, PVMBG, BMKG, dan data gempa USGS.')}
              </p>
              
              {/* Timeline dot step connection */}
              <div className="mt-8 flex items-center gap-3">
                <span className="h-6 w-6 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-[10px] font-bold text-accent">02</span>
                <div className="h-[1px] w-24 bg-border/60" />
                <span className="text-[10px] text-muted-foreground tracking-wider uppercase font-mono">INJEKSI DATA API</span>
              </div>
            </motion.div>

            {/* Right Column: Visual Mock API Logs with smooth crossfade */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={slideLeft}
              className="w-full lg:w-[50%] h-[280px] bg-[#0c0806]/95 rounded-2xl border border-border/85 p-5 relative overflow-hidden flex flex-col justify-between font-mono shadow-[0_4px_30px_rgba(0,0,0,0.4)]"
            >
              <div className="flex justify-between items-center text-[8px] text-muted-foreground/80 tracking-wider">
                <span>ASYNC DATA GATHERING PIPELINE</span>
                <span className="text-green-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  LISTENING
                </span>
              </div>

              {/* Stream list container with animated opacity */}
              <motion.div 
                animate={{ opacity: terminalOpacity }}
                transition={{ duration: 0.4 }}
                className="flex-1 my-3 flex flex-col gap-2 overflow-y-auto scrollbar-none justify-center"
              >
                {apiLogs.length === 0 ? (
                  <div className="text-[9px] text-muted-foreground/40 text-center py-4">
                    Menghubungkan ke API Geospasial...
                  </div>
                ) : (
                  apiLogs.map((log, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center justify-between text-[9px] border border-border/30 rounded p-1.5 bg-muted/10"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-accent">❯</span>
                        <span className="font-semibold text-foreground">{log.label}</span>
                        <span className="text-muted-foreground/75 text-[8px]">({log.detail})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[8px] text-muted-foreground/60 font-mono">{log.time}</span>
                        <span className="px-1.5 py-0.5 rounded bg-green-950/40 text-green-400 border border-green-500/20 text-[7px] font-bold">
                          {log.status}
                        </span>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>

              {/* Animated scanline bar overlay */}
              <div 
                className="absolute top-0 inset-x-0 h-0.5 bg-accent/40 shadow-[0_0_8px_rgba(212,149,106,0.6)]"
                style={{
                  animation: 'seismic-scan 2.5s infinite linear'
                }}
              />

              <div className="flex justify-between items-end text-[7px] text-muted-foreground/50 border-t border-border/20 pt-2">
                <span>TOTAL CALLS: 4 API ENDPOINTS</span>
                <span>AGGREGATE: 0.92 SEC</span>
              </div>
            </motion.div>
          </div>

          {/* STEP 3: Laporan AI */}
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center justify-between">
            {/* Left Column: Explainer */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={slideLeft}
              className="w-full lg:w-[45%] flex flex-col"
            >
              <span className="text-[11px] font-mono text-accent/60 uppercase tracking-widest mb-2 font-bold">TAHAP 03 / DIAGNOSTIC</span>
              <h3 className="font-display text-3xl md:text-4xl text-foreground font-medium leading-snug">
                {t('processStep3Title', '3. Laporan Audit & AI Recommendations')}
              </h3>
              <p className="mt-4 text-xs md:text-sm text-muted-foreground leading-relaxed font-body font-normal">
                {t('processStep3Desc', 'AI memproses gambar Google Street View untuk memeriksa drainase mikro dan retakan dinding, lalu menghasilkan laporan komprehensif berstandar SNI.')}
              </p>
              
              {/* Timeline dot step connection */}
              <div className="mt-8 flex items-center gap-3">
                <span className="h-6 w-6 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-[10px] font-bold text-accent">03</span>
                <div className="h-[1px] w-24 bg-border/60" />
                <span className="text-[10px] text-muted-foreground tracking-wider uppercase font-mono">LAPORAN GEOLOGI</span>
              </div>
            </motion.div>

            {/* Right Column: Visual Real RAG detailed report sheet screenshot */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={slideRight}
              className="w-full lg:w-[50%] h-[280px] bg-[#0a0705] rounded-2xl border border-border/85 relative overflow-hidden flex items-start justify-center p-4 group shadow-[0_4px_30px_rgba(0,0,0,0.4)]"
            >
              <div className="w-full h-full overflow-y-auto scrollbar-none rounded-lg border border-border/50 bg-[#0f0b08]">
                <img 
                  src="/app_step3_report.png" 
                  alt="AI Diagnostic Geological Report" 
                  className="w-full h-auto object-cover object-top opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:translate-y-[-10%]"
                />
              </div>
              <div className="absolute inset-0 border border-white/5 rounded-2xl pointer-events-none" />
              <div className="absolute top-3 left-3 bg-[#0a0705]/95 border border-accent/20 rounded px-2.5 py-1 text-[8px] font-mono tracking-wider text-accent backdrop-blur-sm">
                SNI COMPLIANT RAG REPORT DRAWER
              </div>
            </motion.div>
          </div>

        </div>

      </div>

      <style>{`
        @keyframes seismic-scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}</style>
    </section>
  );
}
