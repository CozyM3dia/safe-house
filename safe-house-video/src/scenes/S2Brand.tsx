import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../data';
import { Accent, Headline, SceneBg, Vignette, easeIn, popSpring, useFade } from '../lib/ui';

export const S2Brand: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useFade(10, 134, 16);

  const iconPop = popSpring(frame, fps, 4);
  const ringSweep = interpolate(frame, [10, 55], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const wordIn = easeIn(frame, 22, 18, 22);
  const lineIn = easeIn(frame, 52, 20, 26);
  const line2In = easeIn(frame, 70, 20, 26);

  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <SceneBg />
      {/* copper halo behind mark */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 300,
          width: 700,
          height: 700,
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(closest-side, rgba(212,149,106,${0.16 * ringSweep}), transparent)`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 170,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            position: 'relative',
            transform: `scale(${0.6 + 0.4 * iconPop})`,
            opacity: iconPop,
          }}
        >
          {/* rotating sweep ring */}
          <svg width={300} height={300} viewBox="0 0 300 300" style={{ position: 'absolute', left: -50, top: -55 }}>
            <circle
              cx={150}
              cy={150}
              r={128}
              fill="none"
              stroke={C.copper}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeDasharray={`${ringSweep * 550} 900`}
              opacity={0.8}
              transform="rotate(-90 150 150)"
            />
          </svg>
          <Img src={require('../../public/safe_icon_dark.png')} style={{ width: 200, height: 189 }} />
        </div>

        <div style={{ opacity: wordIn.t, transform: `translateY(${wordIn.y}px)`, marginTop: 40 }}>
          <Img src={require('../../public/safe_house_logo_dark.png')} style={{ width: 620, height: 185 }} />
        </div>

        <div style={{ marginTop: 66, textAlign: 'center' }}>
          <div style={{ opacity: lineIn.t, transform: `translateY(${lineIn.y}px)` }}>
            <Headline align="center" size={92}>
              Satu koordinat.
            </Headline>
          </div>
          <div style={{ opacity: line2In.t, transform: `translateY(${line2In.y}px)`, marginTop: 10 }}>
            <Headline align="center" size={92}>
              <Accent>Satu audit.</Accent>
            </Headline>
          </div>
        </div>
      </div>

      <Vignette />
    </AbsoluteFill>
  );
};
