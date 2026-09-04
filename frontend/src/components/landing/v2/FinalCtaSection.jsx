import { useEffect, useMemo, useRef, useState } from 'react';
import { useLpNavigate } from '../../../hooks/useLpNavigate';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  FileCheck2,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { useLpInView } from '../../../hooks/useLpMotion';
import { EASE } from './motion';

/**
 * FinalCtaSection — world-class animated finale.
 * "Cukup satu alamat properti, parameter SNI siap lampir."
 *
 * Lapisan gerak (semua transform/opacity, GPU-friendly):
 * 1. Latar: parallax scroll (Ken Burns halus) + aurora copper drift +
 *    kontur topografi berdenyut + debu melayang + vignette sinematik.
 * 2. Masuk: koreografi stagger — badge → headline masked per-kata →
 *    sub blur → console spring → chips pop → trust fade.
 * 3. Interaksi: console 3D-tilt + spotlight kursor + border-beam saat
 *    fokus, tombol magnetik + shine sweep, placeholder mengetik bergilir,
 *    chip melayang saat hover.
 *
 * Kontrak: copy, preset, parse koordinat, navigasi, id/aria tidak berubah.
 * Reduced-motion & ponsel: semua gerak jadi statis yang tetap cantik.
 */

const PRESETS = [
  { name: 'Pahoman, Bandar Lampung', lat: -5.4292, lon: 105.261 },
  { name: 'Monas, Jakarta', lat: -6.17539, lon: 106.82715 },
  { name: 'Gedung Sate, Bandung', lat: -6.90248, lon: 107.61867 },
  { name: 'Malioboro, Jogja', lat: -7.79259, lon: 110.36584 },
];

const DUST = [
  { left: '8%', top: '30%', size: 3, delay: '0s', dur: '9s' },
  { left: '16%', top: '64%', size: 2, delay: '1.4s', dur: '11s' },
  { left: '27%', top: '22%', size: 2, delay: '0.7s', dur: '10s' },
  { left: '72%', top: '26%', size: 3, delay: '2s', dur: '12s' },
  { left: '84%', top: '58%', size: 2, delay: '0.4s', dur: '9.5s' },
  { left: '91%', top: '34%', size: 3, delay: '1.1s', dur: '10.5s' },
  { left: '62%', top: '72%', size: 2, delay: '2.4s', dur: '11.5s' },
  { left: '40%', top: '78%', size: 2, delay: '1.8s', dur: '10s' },
];

/* Kata naik dari balik masker — hanya jalan saat section masuk viewport. */
function MaskedLine({ text, base = 0, step = 0.055, active, className = '' }) {
  const reduce = useReducedMotion();
  const words = String(text).split(' ');
  if (reduce || !active) {
    return <span className={className}>{text}</span>;
  }
  return (
    <span className={className} aria-label={text} role="text">
      {words.map((w, i) => (
        <span
          key={`${w}-${i}`}
          aria-hidden="true"
          className="lp-cta-mask"
        >
          <motion.span
            className="lp-cta-mask-in"
            initial={{ y: '115%', rotate: 4 }}
            animate={{ y: '0%', rotate: 0 }}
            transition={{ duration: 1, ease: EASE, delay: base + i * step }}
          >
            {w}
            {i < words.length - 1 ? '\u00A0' : ''}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

function Corner({ pos, active, delay }) {
  return (
    <motion.span
      className="lp-cta-corner"
      data-pos={pos}
      aria-hidden="true"
      initial={{ opacity: 0, scale: 0.6 }}
      animate={active ? { opacity: 1, scale: 1 } : undefined}
      transition={{ duration: 0.9, delay, ease: EASE }}
    >
      <i />
    </motion.span>
  );
}

export default function FinalCtaSection({ t }) {
  const { rootRef, inView } = useLpInView({ threshold: 0.2 });
  const reduce = useReducedMotion();
  const navigate = useLpNavigate();
  const sectionRef = useRef(null);
  const formRef = useRef(null);
  const btnRef = useRef(null);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);
  const [phIndex, setPhIndex] = useState(0);

  const placeholders = useMemo(
    () => [
      t('ctaPlaceholderShort'),
      '-5,4292 · 105,2610',
      'Tempel tautan Google Maps…',
    ],
    [t],
  );

  /* Rotasi placeholder mengetik — berhenti saat fokus/mengetik/reduced. */
  useEffect(() => {
    if (reduce || focused || value) return undefined;
    const id = setInterval(() => setPhIndex((i) => (i + 1) % placeholders.length), 3200);
    return () => clearInterval(id);
  }, [reduce, focused, value, placeholders.length]);

  /* Parallax latar mengikuti scroll section. */
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ['-9%', '9%']);
  const bgScaleT = useTransform(scrollYProgress, [0, 1], [1.1, 1.18]);
  const contentY = useTransform(scrollYProgress, [0, 1], [34, -34]);
  const glowOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.4, 1, 0.4]);

  /* Tilt 3D console (desktop + no-reduced saja). */
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 160, damping: 18, mass: 0.4 });
  const sry = useSpring(ry, { stiffness: 160, damping: 18, mass: 0.4 });

  /* Magnet tombol submit. */
  const bx = useMotionValue(0);
  const by = useMotionValue(0);
  const sbx = useSpring(bx, { stiffness: 220, damping: 14, mass: 0.25 });
  const sby = useSpring(by, { stiffness: 220, damping: 14, mass: 0.25 });

  const finePointer =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const interactive = !reduce && finePointer;

  const onTilt = (e) => {
    if (!interactive || !formRef.current) return;
    const r = formRef.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    rx.set(-py * 5);
    ry.set(px * 7);
    formRef.current.style.setProperty('--mx', `${e.clientX - r.left}px`);
    formRef.current.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  const resetTilt = () => {
    rx.set(0);
    ry.set(0);
    bx.set(0);
    by.set(0);
  };

  const onBtnMove = (e) => {
    if (!interactive || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    bx.set((e.clientX - (r.left + r.width / 2)) * 0.18);
    by.set((e.clientY - (r.top + r.height / 2)) * 0.28);
  };

  const parseCoord = (raw) => {
    const text = raw.trim();
    if (!text) return null;
    const at = text.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (at) return { lat: parseFloat(at[1]), lon: parseFloat(at[2]) };
    const bang = text.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
    if (bang) return { lat: parseFloat(bang[1]), lon: parseFloat(bang[2]) };
    const pair = text.match(/^(-?\d{1,2}(?:\.\d+)?)[,\s]+(-?\d{1,3}(?:\.\d+)?)$/);
    if (pair) return { lat: parseFloat(pair[1]), lon: parseFloat(pair[2]) };
    return null;
  };

  const submit = (raw) => {
    const text = raw.trim();
    if (!text) {
      navigate('/app');
      return;
    }
    const coord = parseCoord(text);
    if (coord && Math.abs(coord.lat) <= 90 && Math.abs(coord.lon) <= 180) {
      setError('');
      navigate(`/app?lat=${coord.lat.toFixed(5)}&lon=${coord.lon.toFixed(5)}`);
      return;
    }
    const foundPreset = PRESETS.find((p) => p.name.toLowerCase().includes(text.toLowerCase()));
    if (foundPreset) {
      setError('');
      navigate(`/app?lat=${foundPreset.lat.toFixed(5)}&lon=${foundPreset.lon.toFixed(5)}`);
      return;
    }
    setError('');
    navigate('/app?lat=-5.42920&lon=105.26100');
  };

  const onSubmit = (e) => {
    e.preventDefault();
    submit(value);
  };

  const handlePresetClick = (preset) => {
    setValue(preset.name);
    navigate(`/app?lat=${preset.lat.toFixed(5)}&lon=${preset.lon.toFixed(5)}`);
  };

  const container = reduce
    ? {}
    : {
        initial: 'hidden',
        animate: inView ? 'show' : 'hidden',
        variants: { hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } } },
      };

  const item = reduce
    ? {}
    : {
        variants: {
          hidden: { opacity: 0, y: 28, filter: 'blur(10px)' },
          show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.95, ease: EASE } },
        },
      };

  const pop = reduce
    ? {}
    : {
        variants: {
          hidden: { opacity: 0, y: 16, scale: 0.92 },
          show: (i = 0) => ({
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { duration: 0.7, ease: EASE, delay: 0.55 + i * 0.08 },
          }),
        },
      };

  return (
    <section
      id="mulai"
      ref={(el) => {
        rootRef.current = el;
        sectionRef.current = el;
      }}
      className="lp-cta relative isolate overflow-hidden pt-20 pb-28 md:pt-28 md:pb-36"
      aria-labelledby="cta-title"
    >
      {/* ── 1. Latar sinematik ── */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <motion.div
          className="lp-cta-bg"
          style={reduce ? undefined : { y: bgY, scale: bgScaleT }}
          initial={reduce ? false : { opacity: 0, scale: 1.06 }}
          animate={inView ? { opacity: 1, scale: 1 } : undefined}
          transition={{ duration: 1.6, ease: EASE }}
        >
          <img
            src="/landing/footer-redesign.jpg"
            width={1920}
            height={900}
            alt=""
            loading="lazy"
            decoding="async"
            className="lp-cta-img"
          />
        </motion.div>

        {/* Kontur topografi berdenyut */}
        <svg className="lp-cta-contour" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice">
          <g fill="none" strokeWidth="1">
            <path d="M-40 120C140 70 260 170 430 140S720 60 900 100 1120 150 1260 110" className="lp-cta-line l1" />
            <path d="M-40 210C150 165 280 250 450 220S740 150 920 190 1120 235 1260 200" className="lp-cta-line l2" />
            <path d="M-40 300C160 260 300 340 470 310S760 245 940 285 1130 325 1260 295" className="lp-cta-line l3" />
            <path d="M-40 395C170 355 320 430 490 400S780 340 960 380 1140 420 1260 390" className="lp-cta-line l2" />
            <path d="M-40 490C180 450 330 520 500 495S790 435 970 475 1150 515 1260 485" className="lp-cta-line l1" />
          </g>
        </svg>

        {/* Aurora copper */}
        <div className="lp-cta-aurora a" />
        <div className="lp-cta-aurora b" />
        <motion.div className="lp-cta-glow" style={reduce ? undefined : { opacity: glowOpacity }} />

        {/* Debu melayang */}
        {!reduce &&
          DUST.map((d, i) => (
            <span
              key={i}
              className="lp-cta-dust"
              style={{
                left: d.left,
                top: d.top,
                width: d.size,
                height: d.size,
                animationDelay: d.delay,
                animationDuration: d.dur,
              }}
            />
          ))}

        {/* Gradien pelindung */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#12100d] via-[#12100d]/50 to-[#12100d]" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#12100d] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#12100d] to-transparent" />
      </div>

      {/* ── 2. Konten terkoreografi ── */}
      <motion.div
        className="lp-container relative z-10 flex flex-col items-center text-center"
        style={reduce ? undefined : { y: contentY }}
        {...container}
      >
        {/* Headline 2-baris */}
        <h2
          id="cta-title"
          className="lp-cta-title mt-6 max-w-[22ch] text-balance font-sans text-[clamp(2.3rem,5.2vw,4rem)] font-bold leading-[1.06] tracking-[-0.025em] text-[#faf7f1]"
        >
          <span className="block drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
            <MaskedLine text="Cukup satu alamat properti," base={0.25} active={inView} />
          </span>
          <span className="lp-serif lp-cta-italic block font-normal italic drop-shadow-[0_4px_24px_rgba(212,149,106,0.35)]">
            <MaskedLine text="parameter SNI siap lampir." base={0.55} active={inView} />
          </span>
        </h2>

        {/* Subtitle */}
        <motion.p
          className="lp-cta-sub mt-5 max-w-[56ch] text-[1.05rem] leading-relaxed text-[#dcd1c0]/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
          {...item}
        >
          {t('ctaSub')}
        </motion.p>

        {/* ── Console pencarian ── */}
        <motion.div className="lp-cta-console mt-9 w-full max-w-2xl px-2" {...item}>
          <motion.div
            ref={formRef}
            onMouseMove={onTilt}
            onMouseLeave={resetTilt}
            style={interactive ? { rotateX: srx, rotateY: sry, transformPerspective: 900 } : undefined}
            className="lp-cta-tilt"
            initial={reduce ? false : { opacity: 0, y: 34, scale: 0.97 }}
            animate={inView ? { opacity: 1, y: 0, scale: 1 } : undefined}
            transition={{ duration: 1.1, delay: 0.5, ease: EASE }}
          >
            <Corner pos="tl" active={inView} delay={0.9} />
            <Corner pos="tr" active={inView} delay={0.95} />
            <Corner pos="bl" active={inView} delay={1} />
            <Corner pos="br" active={inView} delay={1.05} />

            <form
              onSubmit={onSubmit}
              className={`lp-cta-form group relative flex flex-col items-center gap-2 rounded-2xl border p-2 backdrop-blur-2xl transition-all duration-300 sm:flex-row${
                focused ? ' is-focus' : ''
              }`}
              noValidate
            >
              <span className="lp-cta-beam" aria-hidden="true" />
              <span className="lp-cta-scan" aria-hidden="true" />
              <label htmlFor="cta-address-input" className="sr-only">
                {t('ctaInputLabel')}
              </label>
              <div className="flex w-full flex-1 items-center gap-3 px-3 py-1.5">
                <span className="lp-cta-pin" aria-hidden="true">
                  <MapPin size={18} />
                  <span className="lp-cta-pin-ring" />
                </span>
                <input
                  id="cta-address-input"
                  type="text"
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value);
                    setError('');
                  }}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder={placeholders[phIndex]}
                  autoComplete="off"
                  spellCheck={false}
                  enterKeyHint="go"
                  className="lp-cta-input w-full bg-transparent text-[0.95rem] focus:outline-none"
                />
                {/* Placeholder mengetik bergilir */}
                <AnimatePresence mode="wait">
                  {!reduce && !value && !focused && (
                    <motion.span
                      key={phIndex}
                      className="lp-cta-typing"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.45, ease: EASE }}
                    >
                      {placeholders[phIndex]}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <motion.button
                ref={btnRef}
                type="submit"
                onMouseMove={onBtnMove}
                onMouseLeave={resetTilt}
                style={interactive ? { x: sbx, y: sby } : undefined}
                whileHover={reduce ? undefined : { scale: 1.03 }}
                whileTap={reduce ? undefined : { scale: 0.96 }}
                className="lp-cta-submit btn-shine flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl px-6 text-[0.92rem] font-bold sm:w-auto"
              >
                <span>{t('ctaSubmit')}</span>
                <ArrowRight size={16} aria-hidden="true" className="lp-cta-arrow" />
                <kbd className="lp-cta-kbd hidden xl:inline" aria-hidden="true">
                  Enter &#x21B5;
                </kbd>
              </motion.button>
            </form>
          </motion.div>

          {error ? (
            <p role="alert" className="mt-2 text-center text-[0.82rem] font-medium text-rose-400">
              {error}
            </p>
          ) : null}

          {/* Chips preset */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <motion.span className="mr-1 text-[11.5px] font-medium text-[#a89582]" custom={0} {...pop}>
              Coba cepat:
            </motion.span>
            {PRESETS.map((p, i) => (
              <motion.button
                key={p.name}
                type="button"
                custom={i + 1}
                {...pop}
                whileHover={reduce ? undefined : { y: -3, scale: 1.04 }}
                whileTap={reduce ? undefined : { scale: 0.93 }}
                onClick={() => handlePresetClick(p)}
                className="lp-cta-chip inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium transition-colors duration-200 active:scale-95"
              >
                <Compass size={11} aria-hidden="true" className="lp-cta-chip-icon" />
                <span>{p.name}</span>
              </motion.button>
            ))}
          </div>

          {/* Trust badges */}
          <motion.div
            className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11.5px] font-medium"
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={inView ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.9, delay: 1.05, ease: EASE }}
          >
            {[
              { icon: ShieldCheck, label: '5 Sumber Data Resmi Pemerintah' },
              { icon: CheckCircle2, label: 'Gratis · Tanpa Perlu Akun' },
              { icon: FileCheck2, label: 'Format Siap Lampiran PBG' },
            ].map(({ icon: Icon, label }, i) => (
              <motion.span
                key={label}
                className="lp-cta-trust inline-flex items-center gap-1.5"
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={inView ? { opacity: 1, y: 0 } : undefined}
                transition={{ duration: 0.7, delay: 1.1 + i * 0.12, ease: EASE }}
              >
                <motion.span
                  initial={reduce ? false : { scale: 0 }}
                  animate={inView ? { scale: 1 } : undefined}
                  transition={{ type: 'spring', stiffness: 320, damping: 16, delay: 1.15 + i * 0.12 }}
                  className="lp-cta-trust-icon"
                >
                  <Icon size={14} aria-hidden="true" />
                </motion.span>
                {label}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
