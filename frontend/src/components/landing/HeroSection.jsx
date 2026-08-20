import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ContainerScroll } from '../ui/container-scroll-animation';

export default function HeroSection({ t }) {
  const navigate = useNavigate();

  // titleComponent definition to be passed to the scroll container
  const titleComponent = (
    <div className="mx-auto mb-10 flex w-full max-w-4xl flex-col items-center px-4 text-center max-[639px]:mb-6">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="mb-5 sm:mb-8"
      >
        <img 
          src="/safe_house_logo.png" 
          alt="S.A.F.E House Logo" 
          className="h-20 object-contain drop-shadow-[0_0_20px_rgba(212,149,106,0.25)] sm:h-32 md:h-40 lg:h-48"
        />
      </motion.div>

      {/* 1. Badge */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="mb-4 inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-background/60 px-3 py-1.5 text-[10px] text-muted-foreground backdrop-blur-md transition-colors hover:border-accent/30 sm:mb-6 sm:px-4 sm:text-xs"
      >
        <span>{t('heroBadge', 'Desk study geoteknik — InaRISK BNPB · USGS · PuSGeN')}</span>
      </motion.div>

      {/* 2. Headline - Made larger (text-5xl md:text-6xl lg:text-7xl+) for stronger visual weight */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-4xl font-display text-[clamp(2.35rem,11.5vw,3.2rem)] leading-[1.02] tracking-tight text-foreground text-balance sm:text-6xl lg:text-[5.2rem]"
      >
        {t('heroTitlePrefix', 'Parameter Teknis PBG, ')}
        <span className="font-display italic text-accent pr-1">
          {t('heroTitleItalic', 'Otomatis')}
        </span>
      </motion.h1>

      {/* 3. Subheadline */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="mt-4 max-w-[660px] text-xs leading-relaxed text-muted-foreground text-balance font-body sm:mt-5 sm:text-base"
      >
        {t('heroSub', 'Kelas situs SNI 1726:2019, PGA desain, FS likuefaksi, dan bahaya banjir — dari satu titik koordinat, dalam dua menit. Untuk konsultan perizinan, developer, dan konsultan geoteknik.')}
      </motion.p>

      {/* 4. CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="mt-6 flex items-center justify-center gap-3 sm:gap-4"
      >
        <button
          type="button"
          onClick={() => navigate('/app')}
          className="min-h-[44px] rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow/10 transition-all btn-press hover:bg-primary/90 active:scale-[0.97] sm:px-6"
        >
          {t('heroCTA', 'Coba Gratis')}
        </button>
        <button
          type="button"
          onClick={() => navigate('/app')}
          aria-label={t('heroPlay', 'Lihat demo S.A.F.E House')}
          className="flex h-11 w-11 items-center justify-center rounded-full border-0 bg-background/80 backdrop-blur-md shadow-[0_2px_12px_rgba(0,0,0,0.25)] hover:bg-background transition-all active:scale-[0.95]"
        >
          <svg className="h-3.5 w-3.5 fill-foreground text-foreground translate-x-0.5" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      </motion.div>
    </div>
  );

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden pt-20 select-none sm:pt-24">
      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-20 pointer-events-none"
        style={{ filter: 'grayscale(30%) contrast(110%)' }}
      >
        <source
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260319_015952_e1deeb12-8fb7-4071-a42a-60779fc64ab6.mp4"
          type="video/mp4"
        />
      </video>

      {/* Grid overlay for texture */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background:
            'radial-gradient(ellipse at 50% 30%, transparent 20%, hsl(var(--background)) 85%), repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(212, 149, 106, 0.02) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(212, 149, 106, 0.02) 40px)',
        }}
      />

      {/* Parallax Container Scroll Visual */}
      <div className="relative z-10 w-full h-full">
        <ContainerScroll titleComponent={titleComponent}>
          {/* Browser Frame wrapping the Real App Screenshot */}
          <div className="h-full w-full bg-background flex flex-col text-[10px] md:text-[11px] font-body select-none">
            {/* Browser top tab bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background/50 shrink-0">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/30" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/30" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/30" />
              </div>
            <div className="flex w-36 items-center justify-center gap-1.5 rounded border border-border bg-secondary/50 px-3 py-1 text-[9px] tracking-wide text-muted-foreground font-mono sm:w-72 sm:text-[10px]">
                <span className="text-accent/60">✦</span>
                <span className="opacity-60">safehouse.web.id/app</span>
              </div>
              <div className="w-12" /> {/* spacer */}
            </div>
            
            {/* Real app preview image */}
            <div className="flex-1 overflow-hidden relative bg-[#0f0b08]">
              <img 
                src="/app_audited_preview.png" 
                alt="S.A.F.E House Geological Audit Dashboard" 
                className="w-full h-full object-cover object-top opacity-95 hover:opacity-100 transition-opacity duration-300"
              />
            </div>
          </div>
        </ContainerScroll>
      </div>

    </div>
  );
}
