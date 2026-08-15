import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Activity } from 'lucide-react';

import { Card, CardHeader } from '../ui/card';

// Generate Response Spectrum data according to SNI 1726:2019 standards based on PGA
function generateSpectrum(pga) {
  const data = [];
  const sds = 2.5 * pga; // Short-period design spectral acceleration
  const sd1 = 1.5 * pga; // 1-second period design spectral acceleration
  const t0 = 0.2 * (sd1 / sds); // Transition period (0.12s)
  const ts = sd1 / sds;         // Transition period (0.6s)

  for (let t = 0; t <= 3.0; t += 0.1) {
    let sa = 0;
    if (t < t0) {
      sa = sds * (0.4 + 0.6 * (t / t0));
    } else if (t <= ts) {
      sa = sds; // resonance plateau
    } else {
      sa = sd1 / t; // decay zone
    }
    data.push({
      t: Number(t.toFixed(2)),
      sa: Number(sa.toFixed(3)),
    });
  }
  return data;
}

export function GaussianCard({ property }) {
  const g = property?.geotech || {};
  const pga = g.pga_surface ?? g.pga ?? 0.35;
  const sds = 2.5 * pga;

  const data = useMemo(() => generateSpectrum(pga), [pga]);

  // Color code based on PGA
  const gradColor = pga >= 0.6 ? '#ef4444' : pga >= 0.3 ? '#f59e0b' : '#10b981';

  return (
    <Card className="border border-white/8 bg-white/[0.01]">
      <CardHeader className="pb-1.5">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-accent/10 border border-accent/25 text-accent">
            <Activity className="h-3 w-3" />
          </div>
          <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-text-muted">
            SPEKTRUM RESPONS GEMPA (SNI 1726)
          </span>
        </div>
        
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-lg font-mono font-extrabold text-text-primary tracking-tight">
            {pga.toFixed(2)}g
          </span>
          <span className="text-[8px] font-semibold text-text-muted uppercase tracking-wider">
            PGA Permukaan (Sa Peak: {sds.toFixed(2)}g)
          </span>
        </div>
      </CardHeader>

      {/* Clean, Simple Chart */}
      <div className="h-20 w-full px-1.5 pb-2">
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={0}
          minHeight={0}
          initialDimension={{ width: 320, height: 80 }}
        >
          <AreaChart data={data} margin={{ top: 2, right: 2, left: -32, bottom: -5 }}>
            <defs>
              <linearGradient id="simple-spectrum-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={gradColor} stopOpacity={0.25} />
                <stop offset="100%" stopColor={gradColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              stroke="rgba(255,255,255,0.02)" 
              strokeDasharray="2 4"
            />
            <XAxis 
              dataKey="t" 
              fontSize={6.5}
              fontFamily="'Geist Mono', monospace"
              stroke="rgba(255,255,255,0.12)"
              tickFormatter={(v) => `${v}s`}
              tickCount={7}
            />
            <YAxis 
              fontSize={6.5}
              fontFamily="'Geist Mono', monospace"
              stroke="rgba(255,255,255,0.12)"
              tickFormatter={(v) => `${v}g`}
            />
            <Area
              type="monotone"
              dataKey="sa"
              stroke={gradColor}
              strokeWidth={1.2}
              fill="url(#simple-spectrum-grad)"
              animationDuration={300}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
