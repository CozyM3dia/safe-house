import { useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useLpNavigate } from '../../../hooks/useLpNavigate';
import { EASE, MaskedWords } from './motion';
import { HERO_PRESETS, intentToPath, resolveIntent } from './addressIntent';
import { prefersHeroVideo } from '../../../lib/responsive';
import '../../../styles/landing-hero.css';

const AppMockup = lazy(() => import('./AppMockup'));

/**
 * Hero "Meja Ukur": teks + kolom alamat di kiri, kartu demo interaktif di
 * kanan. Foreground adalah pelat instrumen yang bisa langsung dioperasikan;
 * janji "cukup dari alamat" dibuktikan lewat kolom alamat dengan readout
 * status, bukan lewat tombol pil.
 *
 * Latar (video sepia + wash + grid) dan isi kartu demo (AppMockup) tidak
 * disentuh. Di bawah lg keduanya bertumpuk: teks dulu, kartu di bawahnya.
 */

function Crosshair({ className = '' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="6.5" />
      <path d="M12 2v3.5M12 18.5V22M2 12h3.5M18.5 12H22" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

function useIsDesktop() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return desktop;
}

/* Kartu demo: bingkai gelap ganda, miring ke arah pembaca lalu mendatar
   seiring scroll. Di layar kecil tidak dimiringkan. */
function DemoFrame({ sectionRef, reduce, children }) {
  const desktop = useIsDesktop();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const tilt = desktop && !reduce;
  const rotateY = useTransform(scrollYProgress, [0, 0.55], [tilt ? -11 : 0, 0]);
  const rotateX = useTransform(scrollYProgress, [0, 0.55], [tilt ? 4 : 0, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [0, tilt ? -48 : 0]);

  return (
    <motion.div
      className="relative w-full min-w-0 lg:col-span-7"
      style={{ perspective: 1500 }}
      initial={reduce ? false : { opacity: 0, x: 36 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 1.1, delay: 0.35, ease: EASE }}
    >
      <motion.div
        style={{
          rotateY,
          rotateX,
          y,
          transformStyle: 'preserve-3d',
          boxShadow:
            '0 0 #0000004d, 0 12px 32px #0000005a, 0 40px 60px #0000004f, 0 80px 80px #00000033',
        }}
        className="relative z-20 w-full rounded-[22px] border border-white/10 bg-[#140e08]/90 p-1.5 backdrop-blur-xl sm:p-2.5 md:rounded-[30px] md:border-2 md:border-white/15 md:p-3.5"
      >
        <div className="h-full w-full overflow-hidden rounded-[18px] bg-[#0c0805] md:rounded-[24px]">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function HeroSection({ t }) {
  const navigate = useLpNavigate();
  const reduce = useReducedMotion();
  const sectionRef = useRef(null);
  const inputRef = useRef(null);
  const [value, setValue] = useState('');
  const [playVideo] = useState(() => prefersHeroVideo());
  const intent = useMemo(() => resolveIntent(value), [value]);

  const rise = (delay) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.9, delay, ease: EASE },
        };

  const onSubmit = (e) => {
    e.preventDefault();
    navigate(intentToPath(intent));
  };

  const pickPreset = (preset) => {
    setValue(preset.name);
    inputRef.current?.focus();
  };

  const proofs = [t('heroProof1'), t('heroProof2'), t('heroProof3')];

  const readout = (() => {
    switch (intent.kind) {
      case 'coord':
        return (
          <>
            {t('heroReadoutCoord')}
            <b>
              {intent.lat.toFixed(5)}, {intent.lon.toFixed(5)}
            </b>
          </>
        );
      case 'preset':
        return (
          <>
            {t('heroReadoutPreset')}
            <b>{intent.preset.name}</b>
          </>
        );
      case 'invalid':
        return t('heroReadoutInvalid');
      case 'address':
        return t('heroReadoutAddress');
      default:
        return t('heroReadoutIdle');
    }
  })();

  return (
    <section
      ref={sectionRef}
      className="relative isolate flex w-full overflow-hidden pt-24 pb-16 sm:pt-28 sm:pb-24 lg:min-h-[100dvh] lg:items-center lg:pt-[68px] lg:pb-0"
      aria-labelledby="hero-title"
    >
      {/* ── 1. Opaque Backdrop Layer (Warna Cokelat Hangat / Rich Mocha-Brown) ── */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[#201812]"
        style={{
          maskImage: 'linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 80%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 80%, rgba(0,0,0,0) 100%)',
        }}
        aria-hidden="true"
      >
        {playVideo ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
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
        ) : null}

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

      {/* ── 2. Konten: teks kiri, kartu demo kanan ── */}
      <div className="relative z-10 mx-auto grid w-full max-w-[1360px] gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:items-center lg:gap-10 lg:px-10 lg:py-16 xl:gap-14">
        <div className="w-full min-w-0 text-left lg:col-span-5">
          {/* Baris judul ala title block gambar teknik */}
          <motion.div className="flex min-w-0 items-center gap-4" {...rise(0)}>
            <span className="lp-hero-meta inline-flex min-w-0 shrink items-center gap-2.5 truncate">
              <i className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#d4956a]" aria-hidden="true" />
              {t('heroKicker')}
            </span>
            <motion.span
              className="lp-hero-rule min-w-6 flex-1"
              initial={reduce ? false : { scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.2, delay: 0.1, ease: EASE }}
              aria-hidden="true"
            />
          </motion.div>

          <h1
            id="hero-title"
            className="lp-hero-h1 mt-7 text-[clamp(2.5rem,5.6vw,4.4rem)] lg:mt-8"
          >
            <MaskedWords text={t('heroTitlePrefix')} delay={0.12} stagger={0.07} />{' '}
            <em className="block">
              <MaskedWords text={t('heroTitleItalic')} delay={0.34} stagger={0.07} />
            </em>
          </h1>

          <motion.p
            className="lp-hero-sub mt-6 max-w-[40ch] text-[0.95rem] leading-[1.6] sm:text-base lg:text-[1.02rem]"
            {...rise(0.4)}
          >
            {t('heroSub')}
          </motion.p>

          {/* Kolom alamat: instrumen utama */}
          <motion.form
            className="lp-hero-field mt-8 flex items-center gap-2 p-2 pl-4 sm:pl-5 lg:mt-9"
            onSubmit={onSubmit}
            noValidate
            {...rise(0.52)}
          >
            <label htmlFor="hero-address" className="sr-only">
              {t('heroFieldLabel')}
            </label>
            <Crosshair className="lp-hero-glyph" />
            <input
              ref={inputRef}
              id="hero-address"
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={t('heroFieldPlaceholder')}
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="go"
              className="lp-hero-input h-12 min-w-0 flex-1 pl-2 sm:h-14"
            />
            <button
              type="submit"
              className="lp-hero-key inline-flex h-12 shrink-0 items-center gap-2.5 px-3.5 text-[15px] sm:h-14 sm:px-5"
            >
              <span className="hidden sm:inline">{t('heroFieldSubmit')}</span>
              <span className="lp-hero-kbd hidden xl:inline" aria-hidden="true">
                {t('heroFieldHint')} &#x21B5;
              </span>
              <ArrowRight size={17} strokeWidth={2.5} className="sm:hidden" aria-hidden="true" />
            </button>
            <span className="lp-hero-ticks" aria-hidden="true" />
          </motion.form>

          {/* Readout status + lokasi contoh */}
          <motion.div
            className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-1"
            {...rise(0.66)}
          >
            <p className="lp-hero-readout" data-kind={intent.kind} aria-live="polite">
              <i aria-hidden="true" />
              {readout}
            </p>
            <p className="flex flex-wrap items-center gap-x-3.5 gap-y-1">
              <span className="lp-hero-meta">{t('heroExamplesLabel')}</span>
              {HERO_PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  className="lp-hero-ex"
                  onClick={() => pickPreset(p)}
                >
                  {p.short}
                </button>
              ))}
            </p>
          </motion.div>

          {/* Proof points, baris penutup title block */}
          <motion.ul
            className="lp-hero-meta mt-8 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-[#f0e4cc]/10 pt-4"
            {...rise(0.78)}
          >
            {proofs.map((p, i) => (
              <li key={p} className="inline-flex items-center gap-3">
                {i > 0 && (
                  <span className="h-px w-3 bg-[#c9ab88]/40" aria-hidden="true" />
                )}
                {p}
              </li>
            ))}
          </motion.ul>
        </div>

        <DemoFrame sectionRef={sectionRef} reduce={reduce}>
          <Suspense fallback={<div className="min-h-[430px] w-full bg-[#0c0805]" aria-hidden="true" />}>
            <AppMockup t={t} />
          </Suspense>
        </DemoFrame>
      </div>
    </section>
  );
}
