import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Droplets,
  Flame,
  Link2,
  Mountain,
  ShieldCheck,
  Waves,
} from 'lucide-react';
import { useLpNavigate } from '../../../hooks/useLpNavigate';
import { useLpInView } from '../../../hooks/useLpMotion';
import { SectionHeader } from './atoms';
import { EASE } from './motion';
import MockMap from './MockMap';

/**
 * BentoSection, "Di dalam app": pola BridgeMind.
 * Headline tegas + bento grid berisi VIGNETTE UI mini yang hidup
 * (bukan daftar fitur), tiap kartu caption satu kalimat.
 *
 * Vignette:
 * 1. Peta Leaflet asli (tile Stadia) dengan radar sonar aktif + HUD telemetri.
 * 2. Input koordinat dengan typing loop + status sukses.
 * 3. Dokumen laporan mini teranimasi dengan scanline laser & progress SNI.
 * 4. Pipeline 4 chip yang menyala berurutan, loop.
 * 5. Lima sensor bahaya dengan radar spotlight & status analitik live.
 */

const EASE_CSS = 'cubic-bezier(0.22, 1, 0.36, 1)';

export default function BentoSection({ t }) {
  const navigate = useLpNavigate();
  const { rootRef, inView } = useLpInView({ threshold: 0.12 });

  const goApp = () => navigate('/app');
  const cell = (i) => ({
    className: `lp-reveal ${inView ? 'lp-in' : ''}`,
    style: { '--lp-delay': `${120 + i * 90}ms` },
  });

  return (
    <section id="bento" ref={rootRef} className="lp-section" aria-labelledby="bento-title">
      <div className="lp-container">
        <SectionHeader
          eyebrow={t('bentoEyebrow')}
          title={t('bentoTitle')}
          titleId="bento-title"
          lead={t('bentoLead')}
        />

        <div className="mt-10 grid gap-4 md:grid-cols-3 md:gap-5">
          {/* ── 1. Peta Full Animated (span 2) ── */}
          <BentoCell
            t={t}
            {...cell(0)}
            className="md:col-span-2"
            title={t('bentoMapTitle')}
            text={t('bentoMapText')}
          >
            <AnimatedBentoMap />
          </BentoCell>

          {/* ── 2. Input koordinat ── */}
          <BentoCell
            t={t}
            {...cell(1)}
            title={t('bentoInputTitle')}
            text={t('bentoInputText')}
          >
            <TypingInput />
          </BentoCell>

          {/* ── 3. Laporan Full Animated ── */}
          <BentoCell
            t={t}
            {...cell(2)}
            title={t('bentoReportTitle')}
            text={t('bentoReportText')}
          >
            <MiniReport />
          </BentoCell>

          {/* ── 4. Pipeline ── */}
          <BentoCell
            t={t}
            {...cell(3)}
            title={t('bentoPipelineTitle')}
            text={t('bentoPipelineText')}
          >
            <PipelineLoop />
          </BentoCell>

          {/* ── 5. Lima bahaya Full Animated ── */}
          <BentoCell
            t={t}
            {...cell(4)}
            title={t('bentoLayersTitle')}
            text={t('bentoLayersText')}
          >
            <HazardChips t={t} inView={inView} />
          </BentoCell>
        </div>

        {/* CTA kecil */}
        <div {...cell(5)} className="mt-8 flex justify-center">
          <button type="button" onClick={goApp} className="lp-btn lp-btn--ghost btn-shine">
            {t('bentoCta')}
            <ArrowUpRight size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ── Kerangka kartu: vignette di atas, caption di bawah ─────────────────── */
function BentoCell({ t, title, text, children, className = '', style, ...rest }) {
  return (
    <motion.article
      {...rest}
      className={`lp-card lp-card-spot relative flex flex-col overflow-hidden rounded-2xl p-5 ${className}`}
      style={{ ...style, transitionDelay: 'var(--lp-delay, 0ms)' }}
    >
      <div className="flex flex-1 items-center">{children}</div>
      <p className="mt-5 text-[0.92rem] leading-relaxed text-[color:var(--lp-clay)]">
        <strong className="font-semibold text-[color:var(--lp-mocha)]">{title}</strong>{' '}
        {text}
      </p>
    </motion.article>
  );
}

/* ── Vignette 2: input koordinat dengan typing loop ─────────────────────── */
function TypingInput() {
  const reduce = useReducedMotion();
  const [text, setText] = useState('');
  const [ok, setOk] = useState(false);
  const FULL = 'Jalan Diponegoro, Pahoman, Bandar Lampung';

  useEffect(() => {
    const timers = [];
    if (reduce) {
      timers.push(setTimeout(() => {
        setText(FULL);
        setOk(true);
      }, 0));
      return () => timers.forEach(clearTimeout);
    }
    let i = 0;
    let dir = 1;
    let stopped = false;
    const tick = () => {
      if (stopped) return;
      i += dir;
      if (i >= FULL.length) {
        i = FULL.length;
        setText(FULL);
        setOk(true);
        dir = 0;
        timers.push(setTimeout(() => {
          setOk(false);
          dir = -1;
          tick();
        }, 2600));
        return;
      }
      if (i <= 0) {
        i = 0;
        dir = 1;
        setText('');
        timers.push(setTimeout(tick, 700));
        return;
      }
      setText(FULL.slice(0, i));
      timers.push(setTimeout(tick, dir > 0 ? 65 : 28));
    };
    timers.push(setTimeout(tick, 500));
    return () => {
      stopped = true;
      timers.forEach(clearTimeout);
    };
  }, [reduce]);

  return (
    <div className="w-full rounded-xl border border-white/[0.08] bg-[#1a1512] p-3 shadow-inner">
      <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#141210] px-3 py-2.5">
        <Link2 size={13} className="shrink-0 text-[#8b7355]" aria-hidden="true" />
        <span className="lp-num min-w-0 flex-1 truncate text-left text-[12px] text-[#e8d9c0]">
          {text}
          <span className="ml-0.5 inline-block h-3.5 w-[1.5px] translate-y-[2px] animate-pulse bg-[#d4956a]" aria-hidden="true" />
        </span>
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-all duration-500 ${
            ok ? 'bg-[#d4956a] text-[#241a12]' : 'bg-white/[0.07] text-transparent'
          }`}
          aria-hidden="true"
        >
          <ArrowRight size={12} />
        </span>
      </div>
      <div className={`mt-2.5 flex items-center gap-1.5 overflow-hidden px-1 transition-all duration-500 ${ok ? 'max-h-6 opacity-100' : 'max-h-0 opacity-0'}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-[#9db48a]" />
        <span className="text-[10px] text-[#9db48a]">Audit dimulai</span>
      </div>
    </div>
  );
}

/* ── Vignette 1: Peta Full Animated dengan Sonar Radar & Telemetri HUD ──── */
function AnimatedBentoMap() {
  return (
    <div className="relative isolate h-56 w-full overflow-hidden rounded-xl border border-white/[0.08] sm:h-64">
      {/* Map layer */}
      <div className="absolute inset-0 overflow-hidden rounded-xl">
        <MockMap lat={-5.4292} lon={105.261} zoom={15} />
      </div>

      {/* Sonar Radar Wave animation radiating from center pin */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-[#d4956a]"
            initial={{ width: 12, height: 12, opacity: 0.85 }}
            animate={{ width: 240, height: 240, opacity: 0 }}
            transition={{
              duration: 3.2,
              repeat: Infinity,
              delay: i * 1.05,
              ease: 'easeOut',
            }}
          />
        ))}
        {/* Rotating scanning radar sweep beam */}
        <motion.div
          className="absolute h-52 w-52 rounded-full opacity-25"
          style={{
            background: 'conic-gradient(from 0deg, transparent 65%, rgba(212,149,106,0.7) 100%)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Vignette Overlay */}
      <div
        className="pointer-events-none absolute inset-0 rounded-xl"
        style={{ background: 'radial-gradient(circle at 50% 45%, transparent 45%, rgba(18,16,13,0.55))' }}
        aria-hidden="true"
      />

      {/* Top Left HUD: Live radar status */}
      <div className="pointer-events-none absolute top-3 left-3 z-10 flex items-center gap-2 rounded-full border border-[#d4956a]/35 bg-[#161311]/90 px-3 py-1 text-[9px] text-[#f5ebd9] backdrop-blur-md shadow-lg">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#d4956a] opacity-80" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#d4956a]" />
        </span>
        <span className="lp-mono font-bold tracking-wider text-[#d4956a]">SPATIAL RADAR AKTIF</span>
      </div>

      {/* Top Right HUD: Coordinates & Zone */}
      <div className="pointer-events-none absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-full border border-white/10 bg-[#161311]/90 px-2.5 py-1 text-[8.5px] text-[#c9ab88] backdrop-blur-md shadow-lg">
        <span className="lp-mono">BANDAR LAMPUNG · ZONA 4</span>
      </div>

      {/* Bottom Right HUD: Real-time Geotechnical telemetry */}
      <div className="pointer-events-none absolute bottom-3 right-3 z-10 flex items-center gap-2 rounded-lg border border-white/10 bg-[#161311]/90 px-3 py-1.5 text-[9px] text-[#e8d9c0] backdrop-blur-md shadow-lg">
        <span className="lp-mono text-[8px] text-[#7d6b57]">ELEV:</span>
        <span className="font-semibold text-[#f0e4cc]">94 m MDPL</span>
        <span className="h-2 w-px bg-white/20" />
        <span className="text-[#9db48a] font-medium">✓ STABIL</span>
      </div>
    </div>
  );
}

/* ── Vignette 3: dokumen laporan mini Full Animated ─────────────────────── */
function MiniReport() {
  const reduce = useReducedMotion();
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const interval = setInterval(() => {
      setCycle((c) => c + 1);
    }, 4500);
    return () => clearInterval(interval);
  }, [reduce]);

  const rows = [
    { key: 'VS30', val: '450 m/s', target: 72, sub: 'SC, Tanah Keras' },
    { key: 'PGA', val: '0.42 g', target: 58, sub: 'Akselerasi Gempa' },
    { key: 'FS', val: '2.00', target: 84, sub: 'Likuefaksi Aman' },
  ];

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-[#f4efe6] p-4 text-[#241f1a] shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
      {/* Sweeping laser scanline animation */}
      <motion.div
        key={`scan-${cycle}`}
        className="pointer-events-none absolute inset-x-0 h-8 bg-gradient-to-b from-transparent via-[#b45309]/15 to-transparent"
        initial={{ top: '-20%' }}
        animate={{ top: '120%' }}
        transition={{ duration: 2.4, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1.5 }}
      />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#d8cdb8] pb-2">
        <div>
          <p className="lp-mono text-[7.5px] uppercase tracking-[0.16em] text-[#8b7355]">
            Laporan Audit S.A.F.E
          </p>
          <p className="text-[10px] font-semibold text-[#241f1a]">Pahoman, Bandar Lampung</p>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-[#9db48a]/50 bg-[#9db48a]/15 px-2 py-0.5 text-[8px] font-bold text-[#4d6b38]">
          <ShieldCheck size={10} />
          <span>SIAP PBG</span>
        </div>
      </div>

      {/* Big Score Section */}
      <div className="mt-2.5 flex items-end justify-between">
        <div>
          <span className="lp-serif text-[1.8rem] leading-none text-[#b45309]">
            65
          </span>
          <span className="ml-1 text-[9px] text-[#8b7355]">/ 100</span>
        </div>
        <motion.span
          key={`badge-${cycle}`}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="rounded-full border border-[#b45309]/30 bg-[#b45309]/10 px-2.5 py-0.5 text-[8.5px] font-bold text-[#b45309]"
        >
          SEDANG
        </motion.span>
      </div>

      {/* Progress Bars */}
      <div className="mt-2.5 space-y-2 pt-1">
        {rows.map((r, i) => (
          <div key={r.key} className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between text-[8px]">
              <span className="lp-mono font-semibold text-[#8b7355]">{r.key}</span>
              <span className="text-[7.5px] text-[#8b7a69]">{r.sub}</span>
              <span className="lp-num font-bold text-[#241f1a]">{r.val}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#d8cdb8]">
              <motion.div
                key={`bar-${r.key}-${cycle}`}
                className="h-full rounded-full bg-gradient-to-r from-[#b08954] to-[#b45309]"
                initial={{ width: 0 }}
                animate={{ width: `${r.target}%` }}
                transition={{ duration: 1.2, ease: EASE, delay: i * 0.15 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Vignette 4: pipeline 4 chip menyala berurutan, loop ────────────────── */
/* Readout log mini untuk PipelineLoop (bilingual mengikuti COPY dict tidak
   diperlukan: string teknis pendek, konsisten dengan label langkah di atas). */
const PIPELINE_LOG = [
  'PuSGeN · InaRISK · Open-Meteo — diambil',
  'Vs30 · PGA desain · FS Seed & Idriss — dihitung',
  'Skor S.A.F.E 0–100 disusun',
  'Laporan SNI siap lampir',
];

function PipelineLoop() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reduce) {
      const id = setTimeout(() => setActive(4), 0);
      return () => clearTimeout(id);
    }
    const id = setInterval(() => {
      setActive((a) => (a >= 5 ? 0 : a + 1));
    }, 900);
    return () => clearInterval(id);
  }, [reduce]);

  const steps = ['Tarik data', 'Hitung', 'Skor', 'Laporan'];
  return (
    <div className="flex w-full flex-col items-center gap-4 py-2">
      <div className="flex items-center gap-1.5">
        {steps.map((s, i) => {
          const on = active > i;
          const current = active === i + 1;
          return (
            <div key={s} className="flex items-center gap-1.5">
              <span
                className={`rounded-md px-2 py-1 text-[9.5px] transition-all duration-500 ${
                  on
                    ? 'bg-[#241d17] text-[#e8d9c0]'
                    : current
                      ? 'bg-[#d4956a]/15 text-[#d4956a]'
                      : 'bg-white/[0.05] text-[#7d6b57]'
                }`}
              >
                {s}
              </span>
              {i < steps.length - 1 && (
                <span className={`h-px w-3 transition-colors duration-500 ${on ? 'bg-[#d4956a]' : 'bg-white/10'}`} />
              )}
            </div>
          );
        })}
      </div>
      <div className="h-1 w-4/5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-[#d4956a] transition-all duration-700"
          style={{ width: `${Math.min(active, 4) * 25}%`, transitionTimingFunction: EASE_CSS }}
        />
      </div>
      {/* Readout mono: log mini yang mengikuti langkah pipeline, mengisi kartu
          yang tadinya kosong (audit visual 25 Aug) — pola lp-mono, tanpa HUD. */}
      <p className="lp-mono min-h-[2.4em] text-center text-[9px] leading-relaxed text-[#8d7a64] transition-opacity duration-500">
        {PIPELINE_LOG[Math.min(active, PIPELINE_LOG.length - 1)]}
      </p>
    </div>
  );
}

/* ── Vignette 5: lima sensor bahaya Full Animated dengan Radar Spotlight ─── */
function HazardChips({ t, inView }) {
  const reduce = useReducedMotion();
  const [activeIdx, setActiveIdx] = useState(0);

  const chips = [
    { key: 'Seismic', name: 'Gempa', icon: Activity, color: '#e0a35c', metric: '0.42g PGA' },
    { key: 'Liquefaction', name: 'Likuefaksi', icon: Waves, color: '#9db48a', metric: 'FS 2.00 Aman' },
    { key: 'Flood', name: 'Banjir', icon: Droplets, color: '#7a9cbe', metric: 'Zona Rendah' },
    { key: 'Landslide', name: 'Longsor', icon: Mountain, color: '#b98a6e', metric: 'Kemiringan 8°' },
    { key: 'Volcanic', name: 'Vulkanik', icon: Flame, color: '#e07a5f', metric: 'Zona 1 Stabil' },
  ];

  useEffect(() => {
    if (reduce) return;
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % chips.length);
    }, 1600);
    return () => clearInterval(interval);
  }, [chips.length, reduce]);

  return (
    <div className="flex w-full flex-col gap-2 py-1">
      {/* Telemetry Status bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-1.5 text-[8px]">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[#9db48a]" />
          </span>
          <span className="lp-mono uppercase tracking-wider text-[#a08c74]">MULTI-HAZARD SENSOR</span>
        </div>
        <span className="lp-mono font-bold text-[#9db48a]">5/5 TERVERIFIKASI</span>
      </div>

      {/* Grid of 5 Hazard Chips with live spotlight */}
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {chips.map((c, i) => {
          const isActive = activeIdx === i;
          const Icon = c.icon;
          return (
            <motion.div
              key={c.key}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={inView ? { opacity: 1, scale: 1 } : undefined}
              transition={{ duration: 0.35, ease: EASE, delay: i * 0.06 }}
              onMouseEnter={() => setActiveIdx(i)}
              className={`relative flex cursor-pointer flex-col rounded-xl border p-2 transition-all duration-300 ${
                isActive
                  ? 'border-[#d4956a] bg-[#241d17] shadow-[0_0_15px_rgba(212,149,106,0.2)]'
                  : 'border-white/[0.07] bg-[#161311]/80 hover:border-white/20'
              } ${i === 4 ? 'col-span-2 sm:col-span-1' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div
                    className="flex h-5 w-5 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor: `${c.color}20`,
                      color: c.color,
                    }}
                  >
                    <Icon size={11} />
                  </div>
                  <span className="text-[9.5px] font-semibold text-[#f0e4cc]">
                    {t(`mockLayer${c.key}`) || c.name}
                  </span>
                </div>
                {isActive && (
                  <motion.span
                    layoutId="hazard-ping"
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                )}
              </div>
              <p className="mt-1 text-[8px] font-medium" style={{ color: isActive ? c.color : '#8b7a69' }}>
                {c.metric}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
