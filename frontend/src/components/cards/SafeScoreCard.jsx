import { useEffect, useRef, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { ShieldCheck, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { riskHex, riskLabel } from '../../lib/utils';

function computeScore(p) {
  // Backend adalah sumber kebenaran. Skor sudah dihitung deterministik di
  // sana (services/scoring.py) — kartu hanya menampilkannya, tidak
  // menghitung ulang, supaya angka di gauge sama dengan laporan.
  if (typeof p?.safeScore === 'number') return p.safeScore;

  // Cadangan lama untuk data yang belum lewat backend (mis. mode Battle
  // yang state-nya belum tentu punya safeScore).
  if (!p?.radarData) return 50;
  if (p.isOcean) return 0;
  const { flood = 0, soil = 0, seismic = 0, air = 0 } = p.radarData;
  const elevationRisk = (p.elevasi ?? 50) < 10 ? 70 : 25;
  const avgRisk = (flood + soil + seismic + air + elevationRisk) / 5;
  return Math.max(0, Math.min(100, Math.round(100 - avgRisk)));
}

function useCountUp(end, duration = 1500) {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef();
  useEffect(() => {
    let startTime = null;
    const animate = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * end));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [end, duration]);
  return current;
}

// SVG arc gauge
function ArcGauge({ score, hex, size = 140 }) {
  const strokeW = 8;
  const r = (size - strokeW) / 2;
  const cx = size / 2;
  const cy = size / 2;

  // Arc spans 240 degrees (from 150deg to 390deg)
  const startAngle = 150;
  const totalArc = 240;
  const endAngle = startAngle + (totalArc * score) / 100;

  const polarToCartesian = (angle) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const describeArc = (start, end) => {
    const s = polarToCartesian(start);
    const e = polarToCartesian(end);
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  };

  const bgPath = describeArc(startAngle, startAngle + totalArc);
  const fgPath = score > 0 ? describeArc(startAngle, endAngle) : '';

  // Tick marks
  const ticks = [0, 25, 50, 75, 100];
  const tickMarks = ticks.map((val) => {
    const angle = startAngle + (totalArc * val) / 100;
    const inner = polarToCartesian(angle);
    const outerR = r + 6;
    const rad = ((angle - 90) * Math.PI) / 180;
    const outer = { x: cx + outerR * Math.cos(rad), y: cy + outerR * Math.sin(rad) };
    return { val, x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-lg">
      <defs>
        <filter id="glow-arc">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="arc-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={hex} stopOpacity="0.6" />
          <stop offset="100%" stopColor={hex} stopOpacity="1" />
        </linearGradient>
      </defs>

      {/* Background arc */}
      <path
        d={bgPath}
        fill="none"
        stroke="rgba(255,210,170,0.06)"
        strokeWidth={strokeW}
        strokeLinecap="round"
      />

      {/* Tick marks */}
      {tickMarks.map((t) => (
        <line
          key={t.val}
          x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
          stroke="rgba(255,210,170,0.15)"
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
  const score = useMemo(() => computeScore(property), [property]);
  const animatedScore = useCountUp(score, 1500);
  const hex = riskHex(score);
  const label = riskLabel(score);
  const firedConfetti = useRef(false);

  const TrendIcon = score >= 70 ? TrendingUp : score >= 40 ? Minus : TrendingDown;

  useEffect(() => {
    if (animatedScore >= 80 && animatedScore === score && !firedConfetti.current) {
      firedConfetti.current = true;
      confetti({
        particleCount: 80, spread: 70,
        origin: { y: 0.4, x: 0.15 },
        colors: ['#10b981', '#d4956a', '#f0e4cc'],
        scalar: 0.7,
      });
    }
  }, [animatedScore, score]);

  return (
    <div className="bezel-outer">
    <motion.div
      whileHover={{ y: -1 }}
      className="bezel-inner relative overflow-hidden p-5"
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

      <div className="relative flex items-center gap-4">
        {/* Arc gauge */}
        <div className="relative shrink-0">
          <ArcGauge score={score} hex={hex} size={120} />
          {/* Score text centered in gauge */}
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingTop: '8px' }}>
            <span className="data-num text-[32px] leading-none text-text-primary font-bold">
              {animatedScore}
            </span>
            <span className="data-num text-[10px] text-text-muted mt-0.5">/100</span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <ShieldCheck className="h-3.5 w-3.5" style={{ color: hex }} />
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: hex }}>
              S.A.F.E Score
            </span>
          </div>

          <div className="flex items-center gap-2 mb-2">
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
          </div>

          {/* Mini risk breakdown */}
          <div className="space-y-1.5">
            <MiniBar label="Seismic" value={property?.radarData?.seismic ?? 0} />
            <MiniBar label="Flood" value={property?.radarData?.flood ?? 0} />
            <MiniBar label="Soil" value={property?.radarData?.soil ?? 0} />
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
      <span className="text-[8px] font-semibold tracking-wider text-text-muted uppercase w-12 shrink-0">{label}</span>
      <div className="flex-1 h-1 rounded-full bg-white/6 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: hex }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, value)}%` }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        />
      </div>
      <span className="data-num text-[8px] w-5 text-right" style={{ color: hex }}>{value}</span>
    </div>
  );
}
