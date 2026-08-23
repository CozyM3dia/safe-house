import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C, F, DATA } from '../data';
import { Accent, Headline, Kicker, SceneBg, Vignette, easeIn, useFade } from '../lib/ui';

const METHODS = [
  { name: 'Seed & Idriss', use: 'FS Likuefaksi' },
  { name: 'PuSGeN 2017', use: 'PGA Desain' },
  { name: 'SNI 1726:2019', use: 'Kelas Situs & Spektra' },
];

export const S7Trust: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = useFade(14, 162, 18);

  const headIn = easeIn(frame, 6, 18, 26);
  const chipsIn = METHODS.map((_, i) => easeIn(frame, 40 + i * 10, 15, 26));
  const sourcesIn = easeIn(frame, 82, 16, 22);
  const disclaimerIn = easeIn(frame, 108, 16, 18);

  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <SceneBg />

      <div style={{ position: 'absolute', left: 0, right: 0, top: 210, textAlign: 'center' }}>
        <div style={{ opacity: headIn.t, transform: `translateY(${headIn.y}px)` }}>
          <Kicker color={C.textMuted} style={{ marginBottom: 30 }}>
            Metodologi
          </Kicker>
          <Headline align="center" size={92}>
            Fisika yang bisa <Accent>dipertanggungjawabkan.</Accent>
          </Headline>
        </div>
      </div>

      {/* method chips */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 500,
          display: 'flex',
          justifyContent: 'center',
          gap: 36,
        }}
      >
        {METHODS.map((m, i) => (
          <div
            key={m.name}
            style={{
              border: `1px solid ${C.lineStrong}`,
              background: C.surface,
              borderRadius: 18,
              padding: '28px 44px',
              textAlign: 'center',
              opacity: chipsIn[i].t,
              transform: `translateY(${chipsIn[i].y}px)`,
            }}
          >
            <div style={{ fontFamily: F.display, fontSize: 42, color: C.copper }}>{m.name}</div>
            <div style={{ fontFamily: F.mono, fontSize: 22, letterSpacing: '0.14em', color: C.textSecondary, marginTop: 10 }}>
              {m.use.toUpperCase()}
            </div>
          </div>
        ))}
      </div>

      {/* data sources */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 730,
          textAlign: 'center',
          opacity: sourcesIn.t,
          transform: `translateY(${sourcesIn.y}px)`,
        }}
      >
        <div style={{ fontFamily: F.mono, fontSize: 22, letterSpacing: '0.3em', color: C.textMuted }}>
          SUMBER DATA
        </div>
        <div
          style={{
            marginTop: 20,
            fontFamily: F.mono,
            fontSize: 30,
            color: C.textSecondary,
            letterSpacing: '0.06em',
          }}
        >
          {DATA.sources.join('  ·  ')}
        </div>
      </div>

      {/* disclaimer */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 920,
          textAlign: 'center',
          opacity: disclaimerIn.t * 0.85,
        }}
      >
        <span style={{ fontFamily: F.body, fontSize: 24, color: C.textMuted }}>
          Desk study awal — bukan pengganti penyelidikan tanah lapangan.
        </span>
      </div>

      <Vignette />
    </AbsoluteFill>
  );
};
