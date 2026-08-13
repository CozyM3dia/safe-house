import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mountain, Activity, Droplets, Waves } from 'lucide-react';
import { siteClass } from '../../lib/formatters';

const metrics = (p) => [
  {
    label: 'Vs30',
    value: p?.vs30 ?? 0,
    suffix: ' m/s',
    decimals: 0,
    sub: siteClass(p?.vs30),
    icon: Mountain,
    color: '#d4956a',
    // Normalize to 0-100 for indicator (180-760 range)
    indicator: Math.min(100, Math.max(0, ((p?.vs30 ?? 250) - 100) / 6)),
  },
  {
    label: 'PGA',
    value: p?.seismic?.pgaBase ?? 0,
    suffix: 'g',
    decimals: 2,
    sub: (p?.seismic?.pgaBase ?? 0) >= 0.5 ? 'High shaking' : 'Peak accel.',
    icon: Activity,
    color: '#f59e0b',
    indicator: Math.min(100, (p?.seismic?.pgaBase ?? 0) * 100),
  },
  {
    label: 'Liq. FS',
    value: p?.radarData
      ? Math.max(0, (100 - (p.radarData.soil || 0)) / 100)
      : 0,
    suffix: '',
    decimals: 2,
    sub: p?.radarData?.soil > 60 ? 'High risk' : 'Stable',
    icon: Waves,
    color: p?.radarData?.soil > 60 ? '#ef4444' : '#10b981',
    indicator: p?.radarData ? Math.max(0, 100 - (p.radarData.soil || 0)) : 50,
  },
  {
    label: 'Elevation',
    value: p?.elevasi ?? 0,
    suffix: ' m',
    decimals: 0,
    sub: (p?.elevasi ?? 99) < 10 ? 'Flood prone' : 'Standard',
    icon: Droplets,
    color: (p?.elevasi ?? 99) < 10 ? '#ef4444' : '#a78bfa',
    indicator: Math.min(100, ((p?.elevasi ?? 0) / 200) * 100),
  },
];

function useCountUp(end, duration = 1200, decimals = 0) {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef();
  useEffect(() => {
    let startTime = null;
    const animate = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const factor = Math.pow(10, decimals);
      setCurrent(Math.round(eased * end * factor) / factor);
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [end, duration, decimals]);
  return current;
}

function MetricTile({ m, delay = 0 }) {
  const animated = useCountUp(m.value, 1200, m.decimals);

  return (
    <motion.div
      whileHover={{ y: -2, transition: { type: 'spring', stiffness: 300 } }}
      className="group relative overflow-hidden rounded-xl border border-white/8 bg-white/[0.02] p-3 transition-colors hover:border-white/14 hover:bg-white/[0.04]"
    >
      {/* Hover glow */}
      <div
        className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-30"
        style={{ background: m.color }}
      />

      <div className="relative">
        <div className="flex items-center gap-1.5">
          <m.icon className="h-3 w-3" style={{ color: m.color }} />
          <span
            className="text-[9px] font-semibold tracking-[0.18em] uppercase"
            style={{ color: m.color }}
          >
            {m.label}
          </span>
        </div>

        <div className="mt-1.5 flex items-baseline">
          <span className="data-num text-xl text-text-primary font-semibold">
            {m.decimals > 0 ? animated.toFixed(m.decimals) : animated}
          </span>
          <span className="data-num text-[10px] text-text-muted ml-0.5">
            {m.suffix}
          </span>
        </div>

        <p className="mt-0.5 truncate text-[10px] text-text-muted">{m.sub}</p>

        {/* Mini indicator bar */}
        <div className="mt-2 h-0.5 rounded-full bg-white/6 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: m.color }}
            initial={{ width: 0 }}
            animate={{ width: `${m.indicator}%` }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: delay * 0.05 }}
          />
        </div>
      </div>
    </motion.div>
  );
}

export function MetricsGrid({ property }) {
  const data = metrics(property);
  return (
    <div className="grid grid-cols-2 gap-2">
      {data.map((m, i) => (
        <MetricTile key={m.label} m={m} delay={i} />
      ))}
    </div>
  );
}
