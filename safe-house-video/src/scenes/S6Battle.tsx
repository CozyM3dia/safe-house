import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from 'remotion';
import { C, F, DATA, MAP_PX } from '../data';
import { Kicker, Panel, Pill, Vignette, easeIn, popSpring, useFade } from '../lib/ui';

const BarRow: React.FC<{ label: string; value: number; color: string; frame: number; delay: number }> = ({
  label,
  value,
  color,
  frame,
  delay,
}) => {
  const p = interpolate(frame, [delay, delay + 16], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <span
        style={{
          fontFamily: F.mono,
          fontSize: 18,
          letterSpacing: '0.06em',
          color: C.textMuted,
          width: 200,
        }}
      >
        {label}
      </span>
      <div style={{ flex: 1, height: 12, borderRadius: 7, background: C.line, overflow: 'hidden' }}>
        <div
          style={{
            width: `${p * value}%`,
            height: '100%',
            borderRadius: 7,
            background: color,
            boxShadow: `0 0 12px ${color}66`,
          }}
        />
      </div>
      <span style={{ fontFamily: F.mono, fontSize: 22, fontWeight: 600, color: C.text, width: 44, textAlign: 'right' }}>
        {Math.round(p * value)}
      </span>
    </div>
  );
};

export const S6Battle: React.FC = () => {
  const frame = useCurrentFrame();
  const fps = 30;
  const fade = useFade(14, 190, 20);

  const z = 1.5;
  const midX = (MAP_PX.bandarLampung.x + MAP_PX.natar.x) / 2;
  const midY = (MAP_PX.bandarLampung.y + MAP_PX.natar.y) / 2;
  const mapX = 960 - midX * z;
  const mapY = 540 - midY * z;

  const headerIn = easeIn(frame, 4, 15, 24);
  const panelA = popSpring(frame, fps, 14);
  const panelB = popSpring(frame, fps, 24);
  const verdictIn = easeIn(frame, 118, 16, 30);
  const checkPop = popSpring(frame, fps, 126);

  const locA = DATA.bandarLampung;
  const locB = { ...DATA.natar };

  return (
    <AbsoluteFill style={{ opacity: fade, backgroundColor: C.bg }}>
      <Img
        src={require('../../public/img/bl-map.png')}
        style={{
          position: 'absolute',
          left: mapX,
          top: mapY,
          width: 2048 * z,
          height: 1280 * z,
          opacity: 0.28,
        }}
      />
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${C.bg}cc, transparent 30%, transparent 70%, ${C.bg}dd)` }} />

      {/* header */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 96,
          textAlign: 'center',
          opacity: headerIn.t,
          transform: `translateY(${headerIn.y}px)`,
        }}
      >
        <Kicker>Mode Bandingkan</Kicker>
        <h1 style={{ fontFamily: F.display, fontSize: 64, fontWeight: 400, color: C.text, margin: '14px 0 0' }}>
          Dua lokasi. <em style={{ color: C.copper }}>Satu keputusan.</em>
        </h1>
      </div>

      {/* panels */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 280,
          display: 'flex',
          justifyContent: 'center',
          gap: 60,
        }}
      >
        {/* Lokasi A */}
        <div style={{ opacity: panelA, transform: `scale(${0.86 + panelA * 0.14})` }}>
          <Panel style={{ width: 720 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: F.mono, fontSize: 21, letterSpacing: '0.2em', color: C.textMuted }}>
                  LOKASI A
                </div>
                <div style={{ fontFamily: F.display, fontSize: 44, color: C.text, marginTop: 4 }}>
                  {locA.name}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
                <span style={{ fontFamily: F.mono, fontSize: 74, fontWeight: 600, color: C.warn }}>{locA.score}</span>
                <Pill color={C.warn}>{locA.rating}</Pill>
              </div>
            </div>
            <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 13 }}>
              {locA.subScores.map((s, i) => (
                <BarRow key={s.label} label={s.label} value={s.value} color={C.warn} frame={frame} delay={52 + i * 9} />
              ))}
            </div>
          </Panel>
        </div>

        {/* Lokasi B */}
        <div style={{ opacity: panelB, transform: `scale(${0.86 + panelB * 0.14})` }}>
          <Panel style={{ width: 720 }} glow="rgba(16,185,129,0.14)">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: F.mono, fontSize: 21, letterSpacing: '0.2em', color: C.textMuted }}>
                  LOKASI B
                </div>
                <div style={{ fontFamily: F.display, fontSize: 44, color: C.text, marginTop: 4 }}>{locB.name}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
                <span style={{ fontFamily: F.mono, fontSize: 74, fontWeight: 600, color: C.safe }}>{locB.score}</span>
                <Pill filled color={C.safe}>
                  {locB.rating}
                </Pill>
              </div>
            </div>
            <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 13 }}>
              {locB.subScores.map((s, i) => (
                <BarRow key={s.label} label={s.label} value={s.value} color={C.safe} frame={frame} delay={62 + i * 9} />
              ))}
            </div>
          </Panel>
        </div>
      </div>

      {/* verdict */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 892,
          display: 'flex',
          justifyContent: 'center',
          opacity: verdictIn.t,
          transform: `translateY(${verdictIn.y}px)`,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 20,
            border: `1px solid rgba(16,185,129,0.5)`,
            background: 'rgba(16,185,129,0.10)',
            borderRadius: 999,
            padding: '18px 40px',
          }}
        >
          <svg width={34} height={34} viewBox="0 0 34 34" style={{ opacity: checkPop }}>
            <circle cx={17} cy={17} r={15} fill="none" stroke={C.safe} strokeWidth={2.5} />
            <path d="M10 17 L15 22 L24 12" fill="none" stroke={C.safe} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontFamily: F.body, fontSize: 31, color: C.text, fontWeight: 600 }}>
            Lokasi B unggul pada 5 dari 5 parameter.
          </span>
        </div>
      </div>

      <Vignette />
    </AbsoluteFill>
  );
};
