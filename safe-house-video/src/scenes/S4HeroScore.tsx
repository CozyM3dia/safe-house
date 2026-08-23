import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { C, F, DATA } from '../data';
import { Kicker, Panel, Pill, SceneBg, Vignette, popSpring, useFade } from '../lib/ui';

const BandGauge: React.FC<{ frame: number }> = ({ frame }) => {
  const p = interpolate(frame, [46, 96], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const eased = 1 - Math.pow(1 - p, 3);
  const pct = eased * 65;
  return (
    <div style={{ marginTop: 44 }}>
      <div style={{ display: 'flex', height: 18, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ width: '39%', background: `${C.danger}55`, borderRight: `2px solid ${C.bg}` }} />
        <div style={{ width: '30%', background: `${C.warn}55`, borderRight: `2px solid ${C.bg}` }} />
        <div style={{ width: '31%', background: `${C.safe}55` }} />
      </div>
      {/* needle */}
      <div
        style={{
          position: 'relative',
          transform: `translateX(${pct / 100 * 1024 - 12}px)`,
          transition: 'none',
        }}
      >
        <svg width={24} height={26} viewBox="0 0 24 26">
          <path d="M12 26 L2 10 L22 10 Z" fill={C.text} />
        </svg>
      </div>
      <div style={{ position: 'relative', width: 1024 }}>
        <span style={{ position: 'absolute', left: 0, fontFamily: F.mono, fontSize: 21, color: C.danger }}>
          39 — WASPADA
        </span>
        <span style={{ position: 'absolute', left: '42%', fontFamily: F.mono, fontSize: 21, color: C.warn }}>
          69 — SEDANG
        </span>
        <span style={{ position: 'absolute', right: 0, fontFamily: F.mono, fontSize: 21, color: C.safe }}>
          AMAN
        </span>
      </div>
    </div>
  );
};

export const S4HeroScore: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = useFade(14, 222, 18);

  // count-up
  const count = Math.round(
    interpolate(frame, [16, 62], [0, DATA.bandarLampung.score], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );
  const badgePop = popSpring(frame, 30, 58);
  const captionIn = interpolate(frame, [66, 84], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <SceneBg />

      <div style={{ position: 'absolute', left: 0, right: 0, top: 120, textAlign: 'center' }}>
        <Kicker color={C.textMuted}>Hasil Audit · Desk Study</Kicker>
        <div style={{ marginTop: 20, fontFamily: F.body, fontSize: 30, color: C.textSecondary }}>
          {DATA.bandarLampung.name} · {DATA.bandarLampung.lat}, {DATA.bandarLampung.lon}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '54%',
          transform: 'translate(-50%, -50%)',
          width: 1120,
        }}
      >
        <Panel glow={`rgba(245,158,11,0.12)`}>
          <div style={{ alignItems: 'center' }}>
            {/* hero score row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 44 }}>
              <span
                style={{
                  fontFamily: F.mono,
                  fontWeight: 600,
                  fontSize: 250,
                  lineHeight: 1,
                  color: C.warn,
                  textShadow: `0 0 80px rgba(245,158,11,0.35)`,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {count}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 18 }}>
                <div style={{ opacity: badgePop, transform: `scale(${0.7 + badgePop * 0.3})` }}>
                  <Pill filled color={C.warn}>
                    {DATA.bandarLampung.rating}
                  </Pill>
                </div>
                <div
                  style={{
                    fontFamily: F.display,
                    fontStyle: 'italic',
                    fontSize: 46,
                    color: C.textSecondary,
                    opacity: captionIn,
                  }}
                >
                  “{DATA.bandarLampung.caption}”
                </div>
              </div>
            </div>

            <BandGauge frame={frame} />
          </div>
        </Panel>
      </div>

      <Vignette />
    </AbsoluteFill>
  );
};
