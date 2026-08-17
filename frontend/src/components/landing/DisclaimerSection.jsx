import { motion } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';

export default function DisclaimerSection({ t }) {
  const sources = [
    { name: 'InaRISK BNPB', role: t('sourceInaRole', 'Bencana Mikro & Kerentanan Spasial'), desc: t('sourceInaDesc', 'Badan Nasional Penanggulangan Bencana') },
    { name: 'PVMBG', role: t('sourcePvmRole', 'Sesar Aktif & Kawasan Vulkanik (KRB)'), desc: t('sourcePvmDesc', 'Pusat Vulkanologi dan Mitigasi Bencana Geologi') },
    { name: 'BMKG', role: t('sourceBmkgRole', 'Katalis Seismik & Peak Ground Acceleration'), desc: t('sourceBmkgDesc', 'Badan Meteorologi Klimatologi dan Geofisika') },
    { name: 'USGS Catalog', role: t('sourceUsgsRole', 'Historis Kekuatan Gempa Bumi regional'), desc: t('sourceUsgsDesc', 'United States Geological Survey') },
  ];

  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: [0.25, 1, 0.5, 1] }
    }
  };

  return (
    <section className="relative w-full py-24 px-6 md:px-12 lg:px-20 bg-background border-t border-border overflow-hidden select-none landing-grid-decor">
      
      {/* Background rotating lines for tectonic compass */}
      <div className="absolute left-[-80px] top-[-80px] w-80 h-80 opacity-[0.02] pointer-events-none animate-slow-rotate z-0">
        <svg className="w-full h-full text-accent" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.5">
          <circle cx="50" cy="50" r="40" />
          <line x1="50" y1="0" x2="50" y2="100" />
          <line x1="0" y1="50" x2="100" y2="50" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 items-start relative z-10">
        
        {/* Left Side: Data Partners & Transparency Seals */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
          className="w-full lg:w-[45%] flex flex-col"
        >
          <span className="text-[10px] md:text-xs font-bold tracking-[0.2em] text-accent uppercase font-body mb-4 block">
            {t('disclaimerTitleLabel', 'TRANSPARANSI DATA')}
          </span>
          <h2 className="font-display text-3xl md:text-4xl text-foreground font-light leading-snug">
            {t('disclaimerHeading', 'Sumber Data Geospasial Nasional & Global')}
          </h2>
          <p className="mt-4 text-xs md:text-sm text-muted-foreground leading-relaxed font-body">
            {t('disclaimerIntro', 'S.A.F.E House memetakan koordinat mikro Anda secara langsung ke basis data spasial resmi yang dikelola pemerintah Indonesia dan lembaga kegempaan global.')}
          </p>

          {/* List of Data partners - asymmetric visual tags with staggered entrance */}
          <div className="mt-8 flex flex-col gap-3">
            {sources.map((src, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-muted/10 hover:border-accent/20 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-xs font-bold font-mono group-hover:scale-105 transition-transform">
                    {src.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-foreground">{src.name}</span>
                    <span className="text-[9px] text-muted-foreground/80 font-body">{src.desc}</span>
                  </div>
                </div>
                <span className="text-[8px] font-mono bg-secondary/80 text-muted-foreground border border-border px-2 py-0.5 rounded-full">
                  {src.role}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right Side: Legal Disclaimer & Geotechnical Warning Callout */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
          className="w-full lg:w-[55%] lg:mt-10"
        >
          <div 
            className="rounded-2xl border border-accent/30 p-6 md:p-8 flex flex-col justify-between shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
            style={{
              background: 'linear-gradient(135deg, rgba(212, 149, 106, 0.04) 0%, rgba(212, 149, 106, 0.01) 100%)',
            }}
          >
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/25 text-accent shrink-0">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-foreground font-body uppercase tracking-wider">
                  {t('disclaimerProfessional', 'DISCLAIMER PROFESIONAL')}
                </h4>
                <p className="mt-3.5 text-xs md:text-sm text-muted-foreground leading-relaxed font-body">
                  {t('disclaimerText', 'Analisis kami menggunakan data publik dari BNPB InaRISK, BMKG, PVMBG, USGS, dan OpenStreetMap. Laporan diagnostik awal berbasis AI ini TIDAK menggantikan uji tanah laboratorium atau survei geoteknik profesional langsung di lapangan. Konsultasikan dengan ahli struktur berlisensi sebelum mengambil keputusan finansial final.')}
                </p>
              </div>
            </div>

            {/* Quick check indicators showing what we DO and do NOT do */}
            <div className="mt-8 pt-8 border-t border-border/50 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-[9px] font-mono text-accent uppercase tracking-wider font-semibold">{t('disclaimerSupports', 'MENDUKUNG DIAGNOSIS')}</span>
                <ul className="text-[10px] text-muted-foreground/95 flex flex-col gap-1.5 font-body">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400/80 animate-pulse" />
                    {t('disclaimerSupport1', 'Pencocokan zona KRB vulkanik')}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400/80" />
                    {t('disclaimerSupport2', 'Deteksi sesar aktif < 20 km')}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400/80" />
                    {t('disclaimerSupport3', 'PGA & Factor of Safety likuefaksi')}
                  </li>
                </ul>
              </div>
              
              <div className="flex flex-col gap-2">
                <span className="text-[9px] font-mono text-muted-foreground/60 uppercase tracking-wider font-semibold">{t('disclaimerDoesNotReplace', 'TIDAK MENGGANTIKAN')}</span>
                <ul className="text-[10px] text-muted-foreground/75 flex flex-col gap-1.5 font-body">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400/80" />
                    {t('disclaimerLimit1', 'Uji penetrasi tanah (SPT/CPT)')}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400/80" />
                    {t('disclaimerLimit2', 'Sertifikasi Laik Fungsi (SLF)')}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400/80" />
                    {t('disclaimerLimit3', 'Desain fondasi sipil rinci')}
                  </li>
                </ul>
              </div>
            </div>

          </div>
        </motion.div>

      </div>
    </section>
  );
}
