import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import indonesia from '../data/indonesia.json';
import { C, F } from '../data';
import { Accent, Headline, Kicker, SceneBg, Vignette, easeIn, useFade } from '../lib/ui';

// lon/lat -> indonesia.json projection space (94..141.5, -11.5..7 -> 1600x760)
const proj = (lon: number, lat: number) => ({
  x: ((lon - 94) / 47.5) * 1600,
  y: ((7 - lat) / 18.5) * 760,
});

const CITIES = [
  { name: 'BANDA ACEH', lon: 95.3, lat: 5.55, delay: 30 },
  { name: 'PADANG', lon: 100.35, lat: -0.95, delay: 44 },
  { name: 'JAKARTA', lon: 106.85, lat: -6.2, delay: 58 },
  { name: 'YOGYAKARTA', lon: 110.4, lat: -7.8, delay: 72 },
  { name: 'PALU', lon: 119.9, lat: -0.9, delay: 86 },
  { name: 'MATARAM', lon: 116.1, lat: -8.58, delay: 100 },
];

export const S0Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = useFade(14, 226, 14);
  const mapIn = easeIn(frame, 8, 26, 24);
  const headIn = easeIn(frame, 26, 20, 30);
  const subIn = easeIn(frame, 78, 20, 24);

  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <SceneBg />

      {/* Indonesia silhouette */}
      <svg
        viewBox="0 0 1600 760"
        style={{
          position: 'absolute',
          right: -60,
          top: 90,
          width: 1180,
          height: 560,
          opacity: mapIn.t * 0.9,
          transform: `translateY(${mapIn.y}px)`,
        }}
      >
        <g>
          {indonesia.paths.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="rgba(196, 168, 126, 0.10)"
              stroke="rgba(212, 149, 106, 0.45)"
              strokeWidth={1.4}
            />
          ))}
        </g>
        {CITIES.map((city) => {
          const p = proj(city.lon, city.lat);
          const pulse = (frame - city.delay) / 60;
          const ringR = pulse < 0 ? 0 : (pulse % 1) * 26 + 5;
          const ringO = pulse < 0 ? 0 : 0.7 * (1 - (pulse % 1));
          const dotIn = interpolate(frame, [city.delay, city.delay + 12], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          return (
            <g key={city.name} transform={`translate(${p.x} ${p.y})`} opacity={dotIn}>
              <circle r={ringR} fill="none" stroke={C.danger} strokeWidth={2} opacity={ringO} />
              <circle r={6.5} fill={C.danger} opacity={0.95} />
              <text
                x={16}
                y={6}
                fill={C.textSecondary}
                fontFamily={F.mono}
                fontSize={21}
                letterSpacing="0.14em"
                opacity={0.9}
              >
                {city.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Copy */}
      <div style={{ position: 'absolute', left: 140, top: 300, width: 760 }}>
        <div style={{ opacity: headIn.t, transform: `translateY(${headIn.y}px)` }}>
          <Kicker style={{ marginBottom: 34 }}>Indonesia · Cincin Api</Kicker>
          <Headline>
            Sebelum bangunan
            <br />
            berdiri, <Accent>tanahnya</Accent>
            <br />
            harus dijawab dulu.
          </Headline>
        </div>
        <div
          style={{
            marginTop: 44,
            fontFamily: F.body,
            fontSize: 30,
            color: C.textSecondary,
            lineHeight: 1.5,
            opacity: subIn.t,
            transform: `translateY(${subIn.y}px)`,
            maxWidth: 620,
          }}
        >
          Gempa, likuefaksi, banjir, longsor — setiap titik koordinat menyimpan
          jawaban geotekniknya sendiri.
        </div>
      </div>

      <Vignette />
    </AbsoluteFill>
  );
};
