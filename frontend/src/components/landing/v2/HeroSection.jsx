import { motion } from 'framer-motion';
import { ArrowRight, MapPin } from 'lucide-react';
import { useLpNavigate } from '../../../hooks/useLpNavigate';
import { ContainerScroll } from '../../ui/container-scroll-animation';
import AppMockup from './AppMockup';

const PROOFS = [
  { key: 'heroProof1', delay: 0 },
  { key: 'heroProof2', delay: 90 },
  { key: 'heroProof3', delay: 180 },
];

export default function HeroSection({ t }) {
  const navigate = useLpNavigate();
  const goApp = () => navigate('/app');
  const goDemo = () => navigate('/app?lat=-5.42920&lon=105.26100');

  const titleComponent = (
    <div className="mx-auto mb-10 flex w-full max-w-4xl flex-col items-center px-4 text-center sm:mb-14">
      {/* 1. H1: Tipografi Fraunces Serif besar & berwibawa sesuai Vercel */}
      <motion.h1
        id="hero-title"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="lp-serif max-w-[22ch] text-balance text-center text-[clamp(2.8rem,7.2vw,5.6rem)] leading-[1.03] tracking-[-0.025em] text-[color:var(--lp-mocha)] md:max-w-[26ch]"
      >
        <span>{t('heroTitlePrefix')}</span>{' '}
        <em className="italic text-[color:var(--lp-chestnut)]">
          {t('heroTitleItalic')}
        </em>
      </motion.h1>

      {/* 2. Subheadline */}
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.85, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="mt-6 max-w-[56ch] text-center text-xs leading-relaxed text-[color:var(--lp-umber)]/85 text-balance font-body sm:text-base md:text-[1.06rem]"
      >
        {t('heroSub')}
      </motion.p>

      {/* 3. CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.85, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto"
      >
        <button
          type="button"
          onClick={goApp}
          className="lp-btn lp-btn--copper btn-shine min-h-[46px] w-full sm:w-auto transition-transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
        >
          <span>{t('heroCTA')}</span>
          <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={goDemo}
          className="lp-btn lp-btn--ghost min-h-[46px] w-full sm:w-auto flex items-center justify-center gap-2"
        >
          <MapPin size={16} aria-hidden="true" />
          <span>{t('heroDemoCta')}</span>
        </button>
      </motion.div>

      {/* 4. Proof chips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.85, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="mt-7 flex flex-wrap items-center justify-center gap-2.5"
      >
        {PROOFS.map(({ key }) => (
          <span
            key={key}
            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--lp-line)] bg-[color:var(--lp-paper)] px-3.5 py-1.5 text-[11px] font-medium text-[color:var(--lp-chestnut)]"
          >
            {t(key)}
          </span>
        ))}
      </motion.div>
    </div>
  );

  return (
    <section className="relative w-full overflow-hidden pt-16 sm:pt-20 select-none isolate" aria-labelledby="hero-title">
      {/* ── 1. Opaque Backdrop Layer (Warna Cokelat Hangat / Rich Mocha-Brown) ── */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[#201812]"
        style={{
          maskImage: 'linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 80%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 80%, rgba(0,0,0,0) 100%)',
        }}
        aria-hidden="true"
      >
        {/* Video Animasi Latar dengan Tint Cokelat Hangat & Sepia */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-35"
          style={{
            filter: 'sepia(45%) saturate(135%) brightness(78%) contrast(115%)',
          }}
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260319_015952_e1deeb12-8fb7-4071-a42a-60779fc64ab6.mp4"
            type="video/mp4"
          />
        </video>

        {/* Lapisan Warm Copper-Brown Ambient Wash */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 90% 70% at 50% 28%, rgba(212, 149, 106, 0.18) 0%, rgba(100, 68, 44, 0.32) 48%, rgba(32, 24, 18, 0.82) 85%)',
          }}
        />

        {/* Grid Texture Warm Copper */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(212, 149, 106, 0.035) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(212, 149, 106, 0.035) 40px)',
          }}
        />
      </div>

      {/* ── 2. Parallax 3D Scroll Container dengan Card Demo Interaktif ── */}
      <div className="relative z-10 w-full h-full pb-16 sm:pb-24">
        <ContainerScroll titleComponent={titleComponent}>
          <AppMockup t={t} />
        </ContainerScroll>
      </div>
    </section>
  );
}






