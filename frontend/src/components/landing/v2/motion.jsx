/* eslint-disable react-refresh/only-export-components */
import { useEffect, useRef } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useInView,
  useReducedMotion,
} from 'framer-motion';

/**
 * Primitif animasi world-class untuk landing v2.
 * Porting dari katalog React Bits / Aceternity / Magic UI (lihat
 * animation-patterns-catalog.md) ke framer-motion murni.
 *
 * Aturan umum:
 * - Satu easing: [0.22, 1, 0.36, 1] (easeOutQuint).
 * - Reduced motion: setiap primitif punya fallback (instan / opacity saja).
 * - Mobile (hover:none): magnet & spotlight nonaktif otomatis.
 * - Aksesibilitas: teks asli disimpan via aria-label; span hasil split
 *   aria-hidden.
 */

export const EASE = [0.22, 1, 0.36, 1];

/* ── 1. MaskedWords: H1 hero, reveal per kata dari balik garis ──────────── */
export function MaskedWords({ text, className = '', delay = 0, stagger = 0.08 }) {
  const reduce = useReducedMotion();
  const words = String(text).split(' ');
  if (reduce) return <span className={className}>{text}</span>;
  return (
    <span className={className} aria-label={text} role="text">
      {words.map((w, i) => (
        <span
          key={`${w}-${i}`}
          aria-hidden="true"
          className="inline-block overflow-hidden align-bottom pb-[0.12em] -mb-[0.12em]"
        >
          <motion.span
            className="inline-block will-change-transform"
            initial={{ y: '110%' }}
            animate={{ y: '0%' }}
            transition={{ duration: 0.9, ease: EASE, delay: delay + i * stagger }}
          >
            {w}
            {i < words.length - 1 ? '\u00A0' : ''}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/* ── 2. BlurWords: sub-hero, fokus lembut ke tajam (dimatikan di touch) ─── */
export function BlurWords({ text, className = '', delay = 0, stagger = 0.1 }) {
  const reduce = useReducedMotion();
  const touch =
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(hover: none)').matches
      : false;

  if (reduce || touch) return <span className={className}>{text}</span>;
  const words = String(text).split(' ');
  return (
    <span className={className} aria-label={text} role="text">
      {words.map((w, i) => (
        <motion.span
          key={`${w}-${i}`}
          aria-hidden="true"
          className="inline-block will-change-[transform,filter,opacity]"
          initial={{ opacity: 0, filter: 'blur(10px)', y: 8 }}
          animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut', delay: delay + i * stagger }}
        >
          {w}
          {i < words.length - 1 ? '\u00A0' : ''}
        </motion.span>
      ))}
    </span>
  );
}

/* ── 3. SplitChars: h2 section, karakter naik saat masuk viewport ───────── */
export function SplitChars({ text, className = '', as: Tag = 'span', stagger = 0.024 }) {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const chars = String(text).split('');

  if (reduce) return <Tag className={className}>{text}</Tag>;
  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {chars.map((c, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          className="inline-block will-change-transform"
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 1.1, ease: [0.165, 0.84, 0.44, 1], delay: i * stagger }}
        >
          {c === ' ' ? '\u00A0' : c}
        </motion.span>
      ))}
    </Tag>
  );
}

/* ── 9. CountUp: angka statistik naik saat terlihat (nol re-render) ─────── */
export function CountUp({ to, duration = 1.6, suffix = '', decimals = 0, className = '' }) {
  const ref = useRef(null);
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 100 / duration, damping: 20 + 40 / duration });
  const inView = useInView(ref, { once: true, margin: '0px' });
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!inView) return undefined;
    const fmt = new Intl.NumberFormat('id-ID', { maximumFractionDigits: decimals });
    if (reduce) {
      if (ref.current) ref.current.textContent = fmt.format(to) + suffix;
      return undefined;
    }
    const unsub = spring.on('change', (v) => {
      if (ref.current) ref.current.textContent = fmt.format(v) + suffix;
    });
    mv.set(to);
    return unsub;
  }, [inView, to, decimals, suffix, reduce, mv, spring]);

  return (
    <span ref={ref} className={className}>
      0{suffix}
    </span>
  );
}

/* ── 6. MagneticButton: CTA utama tertarik kursor (desktop saja) ────────── */
export function MagneticButton({ children, className = '', strength = 2, radius = 100, onClick, type = 'button' }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 150, damping: 15, mass: 0.1 });
  const sy = useSpring(y, { stiffness: 150, damping: 15, mass: 0.1 });
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const touch = window.matchMedia && window.matchMedia('(hover: none)').matches;
    if (reduce || touch) return undefined;

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      if (Math.abs(dx) <= r.width / 2 + radius && Math.abs(dy) <= r.height / 2 + radius) {
        x.set(dx / strength);
        y.set(dy / strength);
      } else {
        x.set(0);
        y.set(0);
      }
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, [reduce, strength, radius, x, y]);

  return (
    <motion.button
      ref={ref}
      type={type}
      onClick={onClick}
      className={className}
      style={{ x: sx, y: sy }}
      whileTap={{ scale: 0.97 }}
    >
      {children}
    </motion.button>
  );
}

/* ── 7. useSpotlight: koordinat kursor ke CSS var (tanpa re-render) ─────── */
export function useSpotlight() {
  const ref = useRef(null);
  const reduce = useReducedMotion();

  const onMouseMove = (e) => {
    const el = ref.current;
    if (!el || reduce) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  };

  return { ref, onMouseMove };
}
