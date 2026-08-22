import { useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { ShieldCheck, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { riskHex, riskLabel } from '../../lib/utils';
import { useT } from '../../hooks/useTranslation';
import { useAppStore } from '../../store/useAppStore';
import { useCountUp } from '../../hooks/useCountUp';

function computeScore(p) {
  // Backend adalah sumber kebenaran. Skor sudah dihitung deterministik di
  // services/scoring.py — kartu hanya menampilkannya, tidak menghitung
  // ulang, supaya angka di gauge sama dengan laporan.
  if (typeof p?.safe_score === 'number') return p.safe_score;
  return null;
}

// SVG arc gauge
function ArcGauge({ score, hex, size = 120 }) {
  const strokeW = 7;
  const cx = size / 2;
  const cy = size / 2;
  // Radius with margin for stroke width and glow filter
  const r = (size - strokeW) / 2 - 8;

  // Arc spans 240 degrees (from -120deg / 8 o'clock to +120deg / 4 o'clock, opening at bottom)
  const startAngle = -120;
  const totalArc = 240;
  const endAngle = startAngle + (totalArc * Math.min(100, Math.max(0, score))) / 100;

  // 0 deg is top (12 o'clock), 90 deg is 3 o'clock, clockwise
  const polarToCartesian = (angle) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: cx + r * Math.sin(rad),
      y: cy - r * Math.cos(rad),
    };
  };

  const describeArc = (start, end) => {
    const s = polarToCartesian(start);
    const e = polarToCartesian(end);
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
  };

  const bgPath = describeArc(startAngle, startAngle + totalArc);
  const fgPath = score > 0 ? describeArc(startAngle, endAngle) : '';

  // Tick marks
  const ticks = [0, 25, 50, 75, 100];
  const tickMarks = ticks.map((val) => {
    const angle = startAngle + (totalArc * val) / 100;
    const rad = (angle * Math.PI) / 180;
    const innerR = r + 4;
    const outerR = r + 8;
    return {
      val,
      x1: cx + innerR * Math.sin(rad),
      y1: cy - innerR * Math.cos(rad),
      x2: cx + outerR * Math.sin(rad),
      y2: cy - outerR * Math.cos(rad),
    };
  });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full overflow-visible drop-shadow-lg">
      <defs>
        <filter id="glow-arc" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="arc-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={hex} stopOpacity="0.6" />
          <stop offset="100%" stopColor={hex} stopOpacity="1" />
        </linearGradient>
      </defs>

      {/* Background arc */}
      <path
        d={bgPath}
        fill="none"
        stroke="rgba(255,210,170,0.08)"
        strokeWidth={strokeW}
        strokeLinecap="round"
      />

      {/* Tick marks */}
      {tickMarks.map((t) => (
        <line
          key={t.val}
          x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
          stroke="rgba(255,210,170,0.18)"
          strokeWidth={1}
        />
      ))}

      {/* Foreground arc — animated */}
      {fgPath && (
        <motion.path
          d={fgPath}
          fill="none"
          stroke="url(#arc-grad)"
          strokeWidth={strokeW}
          strokeLinecap="round"
          filter="url(#glow-arc)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
        />
      )}
    </svg>
  );
}

export function SafeScoreCard({ property }) {
  const t = useT();
  const lang = useAppStore((s) => s.lang);
  const rawScore = useMemo(() => computeScore(property), [property]);
  const hasScore = Number.isFinite(rawScore);
  const score = hasScore ? rawScore : 0;
  const animatedScore = useCountUp(score, 1500);
  const hex = riskHex(score);
  const label = hasScore ? riskLabel(score, lang) : t('card.insufficientData');
  const isProvisional = property?.audit_status === 'provisional';
  const firedConfetti = useRef(false);

  const TrendIcon = score >= 70 ? TrendingUp : score >= 40 ? Minus : TrendingDown;

  useEffect(() => {
    if (property?.audit_status === 'valid' && animatedScore >= 80 && animatedScore === score && !firedConfetti.current) {
      firedConfetti.current = true;
      confetti({
        particleCount: 80, spread: 70,
        origin: { y: 0.4, x: 0.15 },
        colors: ['#10b981', '#d4956a', '#f0e4cc'],
        scalar: 0.7,
      });
    }
  }, [animatedScore, score, property?.audit_status]);

  return (
    <div className="bezel-outer">
    <motion.div
      whileHover={{ y: -1 }}
      className="bezel-inner relative overflow-hidden p-4 sm:p-5"
    >
      {/* Ambient glow */}
      <div
        className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-20 blur-3xl"
        style={{ background: hex }}
      />
      <div
        className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full opacity-10 blur-3xl"
        style={{ background: hex }}
      />

      <div className="relative flex items-center gap-3 sm:gap-4">
        {/* Arc gauge */}
        {/* Di 320px gauge 120px menyisakan 110px untuk rincian bahaya —
            kurang 18px dari lebar minimum satu baris MiniBar, sehingga
            barisnya melimpah keluar kartu. Gauge-nya yang mengecil. */}
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center sm:h-[120px] sm:w-[120px]">
          <ArcGauge score={score} hex={hex} size={120} />
          {/* Score text centered in gauge */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-1">
            <span className="data-num text-[26px] font-bold leading-none text-text-primary sm:text-[30px]">
              {hasScore ? animatedScore : 'N/A'}
            </span>
            <span className="data-num mt-1 text-[11px] text-text-muted">{hasScore ? '/100' : ''}</span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" style={{ color: hex }} />
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: hex }}>
              {t('card.safeScore')}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <span
              className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{
                color: hex,
                background: `${hex}18`,
                border: `1px solid ${hex}30`,
              }}
            >
              <TrendIcon className="h-3 w-3" />
              {label}
            </span>
            {isProvisional && (
              <span className="rounded-md border border-amber-400/25 bg-amber-400/8 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-300">
                {t('card.provisional')}
              </span>
            )}
          </div>

          {/* Mini risk breakdown */}
          <div className="space-y-1.5">
            <MiniBar label={t('axis.seismic')} value={property?.hazard?.radar?.seismic ?? 0} />
            <MiniBar label={t('axis.flood')} value={property?.hazard?.radar?.flood ?? 0} />
            <MiniBar label={t('axis.soil')} value={property?.hazard?.radar?.soil ?? 0} />
            <MiniBar label={t('axis.landslide')} value={property?.hazard?.radar?.landslide ?? 0} />
            <MiniBar label={t('axis.subsidence')} value={property?.hazard?.radar?.subsidence ?? 50} />
          </div>
        </div>
      </div>
    </motion.div>
    </div>
  );
}

function MiniBar({ label, value }) {
  const hex = value >= 70 ? '#ef4444' : value >= 40 ? '#f59e0b' : '#10b981';
  return (
    <div className="flex items-center gap-2">
      <span className="w-[76px] shrink-0 truncate text-[9px] font-semibold uppercase tracking-wider text-text-muted sm:w-[68px]">{label}</span>
      <div className="flex-1 h-1 rounded-full bg-white/6 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: hex }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, value)}%` }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        />
      </div>
      <span className="data-num w-6 text-right font-mono text-[8px] tabular-nums sm:w-5" style={{ color: hex }}>{value}</span>
    </div>
  );
}
