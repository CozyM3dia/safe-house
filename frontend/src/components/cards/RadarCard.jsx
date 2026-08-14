import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Radar as RadarIcon } from 'lucide-react';

import { Card, CardHeader, CardTitle } from '../ui/card';

export function RadarCard({ propertyA, propertyB }) {
  if (!propertyA?.hazard?.radar) return null;

  // Membaca hazard.radar dari AuditResult langsung.
  const buildData = (p) => {
    const r = p?.hazard?.radar || {};
    const elevation = p?.elevation ?? p?.geotech?.elevation_m ?? 50;
    return {
      flood: r.flood ?? 0,
      soil: r.soil ?? 0,
      air: r.air ?? 0,
      seismic: r.seismic ?? 0,
      elevation: elevation < 10 ? 80 : 20,
    };
  };

  const a = buildData(propertyA);
  const b = propertyB ? buildData(propertyB) : null;

  const data = [
    { axis: 'Flood', A: a.flood, B: b?.flood ?? 0 },
    { axis: 'Soil', A: a.soil, B: b?.soil ?? 0 },
    { axis: 'Air', A: a.air, B: b?.air ?? 0 },
    { axis: 'Seismic', A: a.seismic, B: b?.seismic ?? 0 },
    { axis: 'Elevation', A: a.elevation, B: b?.elevation ?? 0 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <RadarIcon className="h-3 w-3 text-accent" />
          Risk Radar (5-axis)
        </CardTitle>
        <span className="text-[9px] font-mono text-text-muted">0-100 scale</span>
      </CardHeader>

      <div className="h-52 w-full -ml-2 -mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="72%">
            <PolarGrid
              stroke="rgba(255,210,170,0.10)"
              strokeDasharray="2 2"
            />
            <PolarAngleAxis
              dataKey="axis"
              tick={{
                fill: '#c4a87e',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.05em',
              }}
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(26, 17, 10, 0.96)',
                border: '1px solid rgba(255,210,170,0.14)',
                borderRadius: '8px',
                backdropFilter: 'blur(12px)',
                fontSize: '11px',
                color: '#f0e4cc',
              }}
              cursor={{ stroke: 'rgba(255,210,170,0.12)', strokeWidth: 1 }}
            />
            <Radar
              name="Site A"
              dataKey="A"
              stroke="#d4956a"
              strokeWidth={2}
              fill="#d4956a"
              fillOpacity={0.18}
              animationDuration={1200}
            />
            {b && (
              <Radar
                name="Site B"
                dataKey="B"
                stroke="#ef4444"
                strokeWidth={2}
                fill="#ef4444"
                fillOpacity={0.18}
                animationDuration={1400}
              />
            )}
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {b && (
        <div className="mt-1 flex justify-center gap-4 text-[10px]">
          <span className="flex items-center gap-1.5 text-accent">
            <span className="h-2 w-2 rounded-full" style={{ background: '#d4956a' }} /> Site A
          </span>
          <span className="flex items-center gap-1.5 text-risk-danger">
            <span className="h-2 w-2 rounded-full bg-risk-danger" /> Site B
          </span>
        </div>
      )}
    </Card>
  );
}
