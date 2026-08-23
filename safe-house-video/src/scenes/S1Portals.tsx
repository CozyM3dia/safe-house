import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { C, F, DATA } from '../data';
import { Accent, Headline, Kicker, Panel, SceneBg, Vignette, easeIn, useFade } from '../lib/ui';

// scattered-but-aligned chip positions (safe area aware)
const CHIP_POS = [
  { x: 150, y: 210, rot: -2.5 },
  { x: 1180, y: 170, rot: 1.8 },
  { x: 240, y: 700, rot: 1.6 },
  { x: 1340, y: 800, rot: -2 },
  { x: 710, y: 130, rot: -1.2 },
];

export const S1Portals: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = useFade(14, 224, 16);
  const headIn = easeIn(frame, 6, 18, 26);
  const head2In = easeIn(frame, 60, 18, 26);
  const timerIn = easeIn(frame, 104, 18, 22);

  // timer counts 00:00 -> 45:00 between frames 110..200
  const minutes = Math.round(interpolate(frame, [112, 196], [0, 45], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const mm = String(minutes).padStart(2, '0');

  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <SceneBg />

      {/* portal chips */}
      {DATA.portals.map((portal, i) => {
        const pos = CHIP_POS[i];
        const enter = easeIn(frame, 20 + i * 9, 16, 40);
        return (
          <div
            key={portal.name}
            style={{
              position: 'absolute',
              left: pos.x,
              top: pos.y,
              opacity: enter.t,
              transform: `translateY(${enter.y}px) rotate(${pos.rot}deg)`,
            }}
          >
            <Panel style={{ width: 380 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: C.textMuted,
                    boxShadow: `0 0 12px ${C.textMuted}`,
                  }}
                />
                <div>
                  <div style={{ fontFamily: F.mono, fontSize: 27, color: C.text, fontWeight: 500 }}>
                    {portal.name}
                  </div>
                  <div style={{ fontFamily: F.body, fontSize: 21, color: C.textMuted, marginTop: 4 }}>
                    {portal.org}
                  </div>
                </div>
              </div>
            </Panel>
          </div>
        );
      })}

      {/* copy */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 330, textAlign: 'center' }}>
        <div style={{ opacity: headIn.t, transform: `translateY(${headIn.y}px)` }}>
          <Headline align="center" size={96}>
            Lima portal. <Accent>Data terpisah.</Accent>
          </Headline>
        </div>
        <div
          style={{
            marginTop: 30,
            fontFamily: F.body,
            fontSize: 34,
            color: C.textSecondary,
            opacity: head2In.t,
            transform: `translateY(${head2In.y}px)`,
          }}
        >
          Hanya terbaca oleh ahli.
        </div>

        {/* elapsed-time instrument */}
        <div
          style={{
            marginTop: 64,
            display: 'flex',
            justifyContent: 'center',
            opacity: timerIn.t,
            transform: `translateY(${timerIn.y}px)`,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'baseline',
              gap: 20,
              border: `1px solid ${C.lineStrong}`,
              borderRadius: 16,
              background: 'rgba(22,14,8,0.85)',
              padding: '22px 44px',
            }}
          >
            <Kicker color={C.textMuted} style={{ fontSize: 23 }}>
              Satu lokasi · desk study manual
            </Kicker>
            <span style={{ fontFamily: F.mono, fontSize: 58, fontWeight: 600, color: C.danger }}>
              {mm}:00
            </span>
          </div>
        </div>
      </div>

      <Vignette />
    </AbsoluteFill>
  );
};
