import { motion } from 'framer-motion';
import { Waves } from 'lucide-react';

import { Card, CardHeader, CardTitle } from '../ui/card';
import { riskHex } from '../../lib/utils';

/**
 * Generate a pseudo-realistic seismograph waveform.
 * Amplitude scales with PGA.
 */
function generateWave(pga = 0.3, length = 160) {
  const amp = 28 * Math.min(1, pga * 2);
  const baseline = 36;
  const data = [];
  for (let i = 0; i < length; i++) {
    const t = i / length;
    // Mix of sine waves + decay envelope + noise
    const envelope = Math.exp(-((t - 0.4) ** 2) / 0.04);
    const wave =
      Math.sin(t * 60 * pga * 4) * 0.7 +
      Math.sin(t * 130) * 0.3 +
      (Math.random() - 0.5) * 0.4;
    data.push(baseline + amp * wave * envelope);
  }
  return data;
}

function buildPath(points) {
  return points
    .map((y, i) => `${i === 0 ? 'M' : 'L'} ${i * 2.5} ${y.toFixed(2)}`)
    .join(' ');
}

export function SeismicWaveform({ property }) {
  if (!property) return null;
  const pga = property?.seismic?.pgaBase ?? 0.3;
  const color = pga > 0.5 ? '#ef4444' : pga > 0.3 ? '#f59e0b' : '#10b981';
  const wave = generateWave(pga);
  const path = buildPath(wave);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <Waves className="h-3 w-3" style={{ color }} />
          Seismic Signature
        </CardTitle>
        <span className="text-[10px] font-mono" style={{ color }}>
          PGA {pga.toFixed(2)}g
        </span>
      </CardHeader>

      <div className="relative h-20 w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${wave.length * 2.5} 72`}
          preserveAspectRatio="none"
          className="h-full w-full"
        >
          {/* Center axis */}
          <line
            x1="0"
            y1="36"
            x2={wave.length * 2.5}
            y2="36"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
            strokeDasharray="2 4"
          />

          {/* Glow underneath */}
          <motion.path
            d={path}
            stroke={color}
            strokeWidth="3"
            fill="none"
            opacity="0.25"
            filter="blur(3px)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.6, ease: 'easeInOut' }}
          />
          {/* Sharp waveform */}
          <motion.path
            d={path}
            stroke={color}
            strokeWidth="1.4"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.6, ease: 'easeInOut' }}
          />
        </svg>

        {/* Live sweep cursor */}
        <motion.div
          className="absolute top-0 h-full w-px"
          style={{ background: `linear-gradient(to bottom, transparent, ${color}, transparent)` }}
          animate={{ left: ['0%', '100%'] }}
          transition={{
            duration: 3.2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-[9px] font-mono tracking-wider text-text-muted">
        <span>Fault: {property?.seismic?.faultName ?? '—'}</span>
        <span>{property?.seismic?.faultDist != null ? `${Number(property.seismic.faultDist).toFixed(0)} km` : ''}</span>
      </div>
    </Card>
  );
}
