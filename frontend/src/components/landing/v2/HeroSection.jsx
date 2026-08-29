import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
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
        className="mt-8 flex items-center justify-center w-full"
      >
        <div className="group relative inline-flex items-center justify-center">
          {/* Ambient Warm Glow Aura */}
          <div
            className="pointer-events-none absolute -inset-1.5 rounded-full bg-gradient-to-r from-[#f0b68c]/35 via-[#d4956a]/55 to-[#b87442]/35 blur-xl opacity-60 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100 group-hover:blur-2xl"
            aria-hidden="true"
          />

          <button
            type="button"
            onClick={goApp}
            className="relative flex items-center justify-center gap-3 rounded-full bg-[linear-gradient(180deg,#f6c19a_0%,#d4956a_52%,#b87342_100%)] px-7 py-3.5 sm:px-8 sm:py-4 text-[15px] sm:text-[16px] font-bold tracking-tight text-[#1c130b] shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_12px_28px_-6px_rgba(212,149,106,0.5),0_4px_12px_rgba(0,0,0,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_18px_36px_-6px_rgba(212,149,106,0.65),0_6px_16px_rgba(0,0,0,0.4)] hover:brightness-[1.03] active:translate-y-0 active:scale-[0.98] overflow-hidden cursor-pointer"
          >
            {/* Shimmer sweep effect */}
            <span
              className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-1000 ease-in-out group-hover:translate-x-full"
              aria-hidden="true"
            />

            <span className="relative z-10">{t('heroCTA')}</span>
            <span
              className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[#1c130b]/12 transition-all duration-300 group-hover:bg-[#1c130b]/20 group-hover:translate-x-0.5"
              aria-hidden="true"
            >
              <ArrowRight size={14} strokeWidth={2.5} className="text-[#1c130b]" />
            </span>
          </button>
        </div>
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






