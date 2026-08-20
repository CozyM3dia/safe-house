import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function CTASection({ t }) {
  const navigate = useNavigate();

  const handleCTAClick = () => {
    navigate('/app');
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: [0.25, 1, 0.5, 1] }
    }
  };

  return (
    <footer className="relative w-full bg-[#0a0705] border-t border-border overflow-hidden select-none landing-grid-decor">
      
      {/* Decorative Vector Compass behind CTA */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] opacity-[0.015] pointer-events-none animate-slow-rotate z-0">
        <svg className="w-full h-full text-accent" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.3">
          <circle cx="50" cy="50" r="45" />
          <circle cx="50" cy="50" r="30" />
          <line x1="50" y1="0" x2="50" y2="100" />
          <line x1="0" y1="50" x2="100" y2="50" />
        </svg>
      </div>

      {/* CTA Area */}
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={fadeUp}
        className="max-w-7xl mx-auto py-24 px-6 md:px-12 lg:px-20 text-center relative z-10 flex flex-col items-center"
      >
        {/* Decorative Badge */}
        <span className="text-[10px] md:text-xs font-mono font-bold tracking-[0.25em] text-accent uppercase mb-6 block">
          SECURE YOUR FUTURE
        </span>

        {/* Headline */}
        <h2 className="font-display text-5xl md:text-7xl lg:text-8xl text-foreground font-light leading-[0.95] tracking-tighter max-w-4xl text-balance whitespace-pre-line">
          {t('ctaHeading', "Don't buy property\nwith your eyes closed.")}
        </h2>

        {/* Subhead */}
        <p className="mt-6 text-sm md:text-base text-muted-foreground max-w-lg leading-relaxed font-body text-balance">
          {t('ctaSub', 'Cek risiko geologis dan lindungi investasi properti Anda sebelum terlambat.')}
        </p>

        {/* Large Premium Button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleCTAClick}
          className="mt-10 rounded-full px-8 py-4 text-sm md:text-base font-bold font-body uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/95 transition-all btn-press shadow-glow/20 border border-transparent cta-glow relative z-10"
        >
          {t('ctaBtn', 'Mulai Audit Properti Kamu')}
        </motion.button>
      </motion.div>

      {/* SaaS Footer Navigation & Details */}
      <div className="border-t border-border/60 bg-bg/40 relative z-10">
        <div className="max-w-7xl mx-auto pt-16 pb-12 px-6 md:px-12 lg:px-20 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 relative z-10">
          
          {/* Brand Col */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
            <div className="flex items-center gap-1.5 mb-2">
              <img 
                src="/safe_house_logo.png" 
                alt="S.A.F.E House" 
                className="h-16 md:h-20 object-contain -my-4 md:-my-5 drop-shadow-[0_0_8px_rgba(212,149,106,0.3)] origin-left" 
              />
            </div>
            <p className="text-[11px] text-muted-foreground/80 leading-relaxed font-body max-w-[25ch]">
              Standardisasi audit geologi properti terintegrasi berbasis koordinat geospasial mikro di Indonesia.
            </p>
            <span className="text-[10px] font-mono text-accent/80 tracking-wider flex items-center gap-1.5 justify-start">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              5°21'53"S 105°14'34"E
            </span>
          </div>

          {/* Quick Links Col */}
          <div className="flex flex-col gap-3 font-body">
            <span className="text-[10px] font-bold tracking-wider text-foreground uppercase">Platform</span>
            <span onClick={() => navigate('/app')} className="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Start Audit</span>
            <span onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })} className="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Hazard Pillars</span>
            <span onClick={() => document.getElementById('process')?.scrollIntoView({ behavior: 'smooth' })} className="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Workflow</span>
          </div>

          {/* Data Sources Col */}
          <div className="flex flex-col gap-3 font-body">
            <span className="text-[10px] font-bold tracking-wider text-foreground uppercase">Geophysical Data</span>
            <a href="https://inarisk.bnpb.go.id" target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-foreground transition-colors">InaRISK BNPB</a>
            <a href="https://vsi.esdm.go.id" target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-foreground transition-colors">PVMBG ESDM</a>
            <a href="https://www.bmkg.go.id" target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-foreground transition-colors">BMKG Indonesia</a>
          </div>

          {/* Development / Academic Col */}
          <div className="flex flex-col gap-3 font-body">
            <span className="text-[10px] font-bold tracking-wider text-foreground uppercase">Organisasi</span>
            <span className="text-xs text-muted-foreground">SEG Student Chapter UNILA</span>
            <span className="text-xs text-muted-foreground">Teknik Geofisika, Univ. Lampung</span>
            <span className="text-xs text-muted-foreground font-mono text-accent/70">S.A.F.E House</span>
          </div>

        </div>

        {/* Legal & Copyright Row */}
        <div className="max-w-7xl mx-auto py-8 px-6 md:px-12 lg:px-20 border-t border-border/20 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-muted-foreground/60 font-body relative z-10">
          <div>
            © 2026 S.A.F.E House. Dikembangkan untuk Vibe Coding 2026.
          </div>
          <div className="flex gap-6">
            <span>Syarat Ketentuan</span>
            <span>Kebijakan Privasi</span>
            <span className="text-accent/80 font-mono">Sibgha Alfirdausi Rambe</span>
          </div>
        </div>
      </div>

    </footer>
  );
}
