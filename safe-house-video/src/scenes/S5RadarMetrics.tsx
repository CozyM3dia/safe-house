import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { C, F, DATA } from '../data';
import { Kicker, Panel, SceneBg, Vignette, easeIn, useFade } from '../lib/ui';

const W = 600;
const H = 520;
const CX = 300;
const CY = 278;
const R = 152;
const N = 5;

const pt = (i: number, r: number) => {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / N;
  return { x: CX + Math.cos(a) * r, y: CY + Math.sin(a) * r };
};

const RadarChart: React.FC<{ frame: number }> = ({ frame }) => {
  const values = DATA.bandarLampung.subScores.map((s) => s.value);
  const grow = interpolate(frame, [18, 58], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const easedGrow = 1 - Math.pow(1 - grow, 3);
  const polyPoints = values
    .map((v, i) => {
      const p = pt(i, (v / 100) * R * easedGrow);
      return `${p.x},${p.y}`;
    })
    .join(' ');

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      {/* grid rings */}
      {[0.25, 0.5, 0.75, 1].map((g) => (
        <polygon
          key={g}
          points={[...Array(N)].map((_, i) => { const p = pt(i, R * g); return `${p.x},${p.y}`; }).join(' ')}
          fill="none"
          stroke={C.line}
          strokeWidth={1.4}
        />
      ))}
      {/* axes */}
      {[...Array(N)].map((_, i) => {
        const p = pt(i, R);
        return <line key={i} x1={CX} y1={CY} x2={p.x} y2={p.y} stroke={C.line} strokeWidth={1.4} />;
      })}
      {/* value polygon */}
      <polygon points={polyPoints} fill="rgba(212,149,106,0.22)" stroke={C.copper} strokeWidth={2.5} />
      {/* vertex dots */}
      {values.map((v, i) => {
        const dotPop = interpolate(frame, [46 + i * 5, 56 + i * 5], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        if (!dotPop) return null;
        const p = pt(i, (v / 100) * R * easedGrow);
        return (
          <g key={i} opacity={dotPop}>
            <circle cx={p.x} cy={p.y} r={7} fill={C.copper} stroke="#241509" strokeWidth={2.5} />
            <text
              x={p.x}
              y={p.y - 16}
              textAnchor="middle"
              fontFamily={F.mono}
              fontSize={24}
              fontWeight={600}
              fill={C.text}
            >
              {v}
            </text>
          </g>
        );
      })}
      {/* axis labels */}
      {DATA.bandarLampung.subScores.map((s, i) => {
        const p = pt(i, R + 38);
        const anchor = p.x > CX + 30 ? 'start' : p.x < CX - 30 ? 'end' : 'middle';
        const words = s.label.split(' ');
        const twoLines = words.length > 1;
        return (
          <text
            key={s.label}
            x={p.x}
            y={twoLines ? p.y - 6 : p.y}
            textAnchor={anchor}
            fontFamily={F.mono}
            fontSize={18}
            letterSpacing="0.12em"
            fill={C.textSecondary}
          >
            {twoLines ? (
              <>
                <tspan x={p.x} dy={0}>{words[0]}</tspan>
                <tspan x={p.x} dy={24}>{words.slice(1).join(' ')}</tspan>
              </>
            ) : (
              s.label
            )}
          </text>
        );
      })}
    </svg>
  );
};

export const S5RadarMetrics: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = useFade(14, 250, 20);

  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <SceneBg />

      {/* left — radar panel */}
      <div style={{ position: 'absolute', left: 120, top: 190 }}>
        <Panel style={{ width: 700, height: 720 }}>
          <div style={{ textAlign: 'center' }}>
            <Kicker color={C.textMuted} style={{ fontSize: 22 }}>
              Radar Bahaya · Skala 0–100
            </Kicker>
            <div style={{ fontFamily: F.body, fontSize: 20, color: C.textMuted, marginTop: 8 }}>
              Makin tinggi makin aman
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <RadarChart frame={frame} />
          </div>
        </Panel>
      </div>

      {/* right — PBG-ready parameters */}
      <div style={{ position: 'absolute', left: 900, top: 160, width: 880 }}>
        <div style={{ opacity: easeIn(frame, 8, 16).t, transform: `translateY(${easeIn(frame, 8, 16).y}px)` }}>
          <Kicker>Parameter Siap-PBG · SNI 1726:2019</Kicker>
        </div>

        <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 26 }}>
          {DATA.bandarLampung.metrics.map((m, i) => {
            const enter = easeIn(frame, 34 + i * 13, 15, 34);
            return (
              <div
                key={m.label}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 26,
                  borderBottom: `1px solid ${C.line}`,
                  paddingBottom: 22,
                  opacity: enter.t,
                  transform: `translateY(${enter.y}px)`,
                }}
              >
                <span style={{ fontFamily: F.mono, fontSize: 24, letterSpacing: '0.14em', color: C.textMuted, width: 300 }}>
                  {m.label}
                </span>
                <span style={{ fontFamily: F.mono, fontSize: 52, fontWeight: 600, color: C.text, whiteSpace: 'nowrap' }}>
                  {m.value}
                  {m.unit ? (
                    <span style={{ fontSize: 28, color: C.textSecondary, marginLeft: 8 }}>{m.unit}</span>
                  ) : null}
                </span>
                <span
                  style={{
                    fontFamily: F.body,
                    fontSize: 23,
                    color: C.textMuted,
                    marginLeft: 'auto',
                    textAlign: 'right',
                    maxWidth: 280,
                  }}
                >
                  {m.note}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <Vignette />
    </AbsoluteFill>
  );
};
