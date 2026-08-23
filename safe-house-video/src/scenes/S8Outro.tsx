import React from 'react';
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, F } from '../data';
import { Accent, Headline, SceneBg, Vignette, easeIn, popSpring, useFade } from '../lib/ui';

export const S8Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // hold, then fade everything to black at the very end
  const fade = useFade(12, 158, 22);

  const markPop = popSpring(frame, fps, 2);
  const tagIn = easeIn(frame, 26, 20, 26);
  const tag2In = easeIn(frame, 46, 20, 26);
  const ctaIn = easeIn(frame, 84, 18, 24);

  return (
    <AbsoluteFill style={{ opacity: fade, backgroundColor: C.bg }}>
      <SceneBg />

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 250,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div style={{ opacity: markPop, transform: `scale(${0.7 + markPop * 0.3})` }}>
          <Img src={require('../../public/safe_icon_dark.png')} style={{ width: 150, height: 142 }} />
        </div>

        <div style={{ marginTop: 70, textAlign: 'center' }}>
          <div style={{ opacity: tagIn.t, transform: `translateY(${tagIn.y}px)` }}>
            <Headline align="center" size={96}>
              Parameter geoteknik siap-PBG,
            </Headline>
          </div>
          <div style={{ opacity: tag2In.t, transform: `translateY(${tag2In.y}px)`, marginTop: 8 }}>
            <Headline align="center" size={96}>
              <Accent>dari satu koordinat.</Accent>
            </Headline>
          </div>
        </div>

        <div
          style={{
            marginTop: 96,
            opacity: ctaIn.t,
            transform: `translateY(${ctaIn.y}px)`,
            border: `1px solid ${C.lineStrong}`,
            borderRadius: 999,
            background: C.surface,
            padding: '20px 48px',
          }}
        >
          <span style={{ fontFamily: F.mono, fontSize: 25, letterSpacing: '0.18em', color: C.copper }}>
            S.A.F.E HOUSE · DIBANGUN BERSAMA EMERGENT · BUILDING INDONESIA 2026
          </span>
        </div>
      </div>

      <Vignette />
    </AbsoluteFill>
  );
};
