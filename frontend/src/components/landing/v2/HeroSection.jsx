import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, MapPin } from 'lucide-react';
import { useLpNavigate } from '../../../hooks/useLpNavigate';
import { useLpParallax } from '../../../hooks/useLpMotion';
import { BlurWords, MaskedWords } from './motion';
import AppMockup from './AppMockup';

const seq = (delay) => ({ style: { '--seq-delay': `${delay}ms` } });

const PROOFS = [
  { key: 'heroProof1', delay: 0 },
  { key: 'heroProof2', delay: 90 },
  { key: 'heroProof3', delay: 180 },
];

export default function HeroSection({ t }) {
  const navigate = useLpNavigate();
  const bgRef = useLpParallax(0.04);
  const reduce = useReducedMotion();
  const [on, setOn] = useState(false);

  const tiltRef = useRef(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 120, damping: 18, mass: 0.4 });
  const sry = useSpring(ry, { stiffness: 120, damping: 18, mass: 0.4 });
  const tilt = useTransform(
    [srx, sry],
    ([x, y]) => `perspective(1400px) rotateX(${x}deg) rotateY(${y}deg)`
  );

  useEffect(() => {
    const id = setTimeout(() => setOn(true), 30);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const el = tiltRef.current;
    if (!el || reduce) return undefined;
    const touch = window.matchMedia && window.matchMedia('(hover: none)').matches;
    if (touch) return undefined;
    const MAX = 2.4;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      ry.set(px * MAX * 2);
      rx.set(-py * MAX * 2);
    };
    const onLeave = () => {
      rx.set(0);
      ry.set(0);
    };
    el.addEventListener('mousemove', onMove, { passive: true });
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [reduce, rx, ry]);

  const cls = (name) => `lp-hero-seq ${name} ${on ? 'lp-seq-in' : ''}`;
  const goApp = () => navigate('/app');
  const goDemo = () => navigate('/app?lat=-5.42920&lon=105.26100');

  return (
    <section className="relative isolate overflow-hidden pt-[124px] pb-6 md:pt-[140px]" aria-labelledby="hero-title">
      {/* ── Latar: Lanskap Hero Redesign dengan fade-in halus & mask gradient ── */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <motion.div
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 h-full w-full"
        >
          <img
            src="/landing/hero-redesign.jpg"
            alt=""
            className="h-full w-full object-cover object-top opacity-80"
            style={{
              maskImage:
                'linear-gradient(180deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.9) 25%, rgba(0,0,0,0.5) 55%, rgba(0,0,0,0) 85%)',
              WebkitMaskImage:
                'linear-gradient(180deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.9) 25%, rgba(0,0,0,0.5) 55%, rgba(0,0,0,0) 85%)',
            }}
          />
        </motion.div>
        {/* Atmospheric ambient top shading for navbar and soft fade */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#12100d]/60 via-transparent to-[#12100d]" />
        <div className="lp-aurora lp-aurora-a opacity-20" />
        <div className="lp-grain absolute inset-0" />
      </div>

      <div className="lp-container flex flex-col items-center text-center">
        {/* H1: Tipografi berwibawa, besar, elegan tanpa badge */}
        <h1
          id="hero-title"
          className="lp-serif max-w-[22ch] text-balance text-[clamp(3.4rem,7.8vw,6.4rem)] leading-[1.02] tracking-[-0.025em] text-[color:var(--lp-mocha)] md:max-w-[26ch]"
          style={{
            backgroundImage:
              'linear-gradient(to bottom, var(--lp-mocha) 55%, color-mix(in srgb, var(--lp-mocha) 55%, transparent))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          <span style={{ WebkitTextFillColor: 'initial' }}>
            <MaskedWords text={t('heroTitlePrefix')} delay={0.16} />
          </span>{' '}
          <em style={{ WebkitTextFillColor: 'initial' }}>
            <MaskedWords text={t('heroTitleItalic')} delay={0.44} />
          </em>
        </h1>

        {/* Sub */}
        <p className={`lp-sub ${cls('lp-sub')} mt-6 max-w-[56ch] text-[1rem] leading-relaxed text-[color:var(--lp-umber)]/85 md:text-[1.06rem]`}>
          <BlurWords text={t('heroSub')} delay={0.72} stagger={0.035} />
        </p>

        {/* CTA */}
        <div {...seq(400)} className={`lp-ctas ${cls('lp-ctas')} mt-8 flex flex-col items-center gap-3 sm:flex-row`}>
          <button
            type="button"
            onClick={goApp}
            className="lp-btn lp-btn--copper btn-shine w-full sm:w-auto transition-transform hover:scale-[1.01] active:scale-[0.99]"
          >
            {t('heroCTA')}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
          <button type="button" onClick={goDemo} className="lp-btn lp-btn--ghost w-full sm:w-auto">
            <MapPin size={16} aria-hidden="true" />
            {t('heroDemoCta')}
          </button>
        </div>

        {/* Proof chips */}
        <div {...seq(520)} className={`mt-6 flex flex-wrap items-center justify-center gap-2.5 ${cls('lp-proof')}`}>
          {PROOFS.map(({ key, delay }) => (
            <motion.span
              key={key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.85 + delay / 1000 }}
              className="inline-flex items-center gap-2 rounded-full border border-[color:var(--lp-line)] bg-[color:var(--lp-paper)] px-3.5 py-1.5 text-[11px] font-medium text-[color:var(--lp-chestnut)]"
            >
              {t(key)}
            </motion.span>
          ))}
        </div>
      </div>

      {/* ── Product shot: glow ala template + mockup interaktif ───────────── */}
      <div {...seq(600)} className={`lp-hero-window ${cls('lp-hero-window')} relative mx-auto mt-16 w-full max-w-5xl px-4 md:mt-20`}>
        {/* Glow besar di belakang shot (CSS, bernapas pelan) */}
        <div className="pointer-events-none absolute left-1/2 top-[-24%] z-0 w-[92%] -translate-x-1/2" aria-hidden="true">
          <motion.div
            className="mx-auto h-[340px] w-full rounded-[50%]"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(212,149,106,0.30) 0%, rgba(212,149,106,0.10) 38%, transparent 68%)',
              filter: 'blur(38px)',
            }}
            animate={reduce ? undefined : { scale: [1, 1.08, 1], opacity: [0.75, 1, 0.75] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <motion.div ref={tiltRef} style={{ transform: tilt }} className="relative z-10 will-change-transform">
          <AppMockup t={t} />
        </motion.div>

        <figcaption className="lp-mono relative z-10 mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center text-[9px] text-[color:var(--lp-taupe)]">
          <span>{t('heroCaptionRoute')}</span>
          <span aria-hidden="true">·</span>
          <span>{t('heroCaptionData')}</span>
        </figcaption>
      </div>

      <div className="pointer-events-none relative mt-4 h-24 bg-[linear-gradient(180deg,transparent,var(--lp-canvas))]" aria-hidden="true" />
    </section>
  );
}
