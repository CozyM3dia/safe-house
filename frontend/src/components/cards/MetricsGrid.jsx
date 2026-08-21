import { motion } from 'framer-motion';
import { Mountain, Activity, Droplets, Waves } from 'lucide-react';
import { siteClass } from '../../lib/formatters';
import { useT } from '../../hooks/useTranslation';
import { useCountUp } from '../../hooks/useCountUp';

// Membaca AuditResult langsung: geotech + hazard.radar + elevation.
const metrics = (p, t) => {
  const g = p?.geotech || {};
  const soil = p?.hazard?.radar?.soil ?? 0;
  const vs30 = g.vs30 ?? 0;
  const pga = g.pga ?? 0;
  const elevation = p?.elevation ?? g.elevation_m ?? 0;
  const fs = g.fs ?? 0;

  return [
    {
      label: t('card.vs30'),
      value: vs30,
      suffix: ' m/s',
      decimals: 0,
      sub: siteClass(vs30),
      icon: Mountain,
      color: '#d4956a',
      // Normalisasi ke 0-100 untuk indikator (rentang 180-760)
      indicator: Math.min(100, Math.max(0, ((vs30 || 250) - 100) / 6)),
    },
    {
      label: t('card.pga'),
      value: pga,
      suffix: 'g',
      decimals: 2,
      sub: pga >= 0.5 ? t('card.highShaking') : t('card.peakAccel'),
      icon: Activity,
      color: '#f59e0b',
      indicator: Math.min(100, pga * 100),
    },
    {
      label: t('card.liqFs'),
      // FS likuefaksi langsung dari engine, bukan diturunkan dari skor.
      value: fs,
      suffix: '',
      decimals: 2,
      sub: soil > 60 ? t('card.highRisk') : t('card.stable'),
      icon: Waves,
      color: soil > 60 ? '#ef4444' : '#10b981',
      indicator: Math.max(0, 100 - soil),
    },
    {
      label: t('card.elevation2'),
      value: elevation,
      suffix: ' m',
      decimals: 0,
      sub: elevation < 10 ? t('card.lowFlood') : t('card.standard'),
      icon: Droplets,
      color: elevation < 10 ? '#ef4444' : '#d4956a',
      indicator: Math.min(100, (elevation / 200) * 100),
    },
  ];
};

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
          <span className="data-num text-[11px] text-text-muted ml-0.5">
            {m.suffix}
          </span>
        </div>

        <p className="mt-0.5 truncate text-[11px] text-text-muted">{m.sub}</p>

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
  const t = useT();
  const data = metrics(property, t);
  return (
    <div className="grid grid-cols-2 gap-2">
      {data.map((m, i) => (
        <MetricTile key={m.label} m={m} delay={i} />
      ))}
    </div>
  );
}
