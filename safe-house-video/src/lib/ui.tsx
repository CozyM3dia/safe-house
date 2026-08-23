import React from 'react';
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame } from 'remotion';
import { C, F } from '../data';

// ---------------------------------------------------------------- helpers

/** Fade in (and optionally out) around a scene's local timeline. */
export const useFade = (inDur = 12, outStart?: number, outDur = 12) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, inDur], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const out =
    outStart === undefined
      ? 1
      : interpolate(frame, [outStart, outStart + outDur], [1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
  return opacity * out;
};

export const easeIn = (frame: number, start: number, dur = 14, distance = 36) => {
  const t = interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  return { t, y: (1 - t) * distance };
};

export const popSpring = (frame: number, fps: number, delay = 0, config?: { damping?: number; stiffness?: number }) =>
  spring({
    frame: frame - delay,
    fps,
    config: { damping: 14, stiffness: 130, mass: 0.7, ...config },
    durationInFrames: 40,
  });

// ---------------------------------------------------------------- layout

export const SceneBg: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ backgroundColor: C.bg }}>
    {/* warm radial depth */}
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'radial-gradient(1200px 800px at 50% 38%, rgba(212,149,106,0.07), transparent 70%), radial-gradient(1600px 1000px at 50% 110%, rgba(30,20,10,0.9), transparent)',
      }}
    />
    {children}
  </AbsoluteFill>
);

export const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      pointerEvents: 'none',
      background: 'radial-gradient(1400px 900px at 50% 50%, transparent 55%, rgba(8,5,3,0.55) 100%)',
    }}
  />
);

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export const Grain: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: 'none', opacity: 0.05, backgroundImage: GRAIN }} />
);

/** Signature double-bezel glass enclosure. */
export const Panel: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  glow?: string;
}> = ({ children, style, glow }) => (
  <div
    style={{
      borderRadius: 22,
      border: `1px solid ${C.lineStrong}`,
      background: C.surface,
      backdropFilter: 'blur(24px)',
      boxShadow: glow ? `0 0 60px ${glow}, 0 24px 80px rgba(0,0,0,0.5)` : '0 24px 80px rgba(0,0,0,0.45)',
      padding: 14,
      ...style,
    }}
  >
    <div
      style={{
        borderRadius: 12,
        border: `1px solid ${C.line}`,
        boxShadow: 'inset 0 1px 0 rgba(255,210,170,0.08)',
        background: 'rgba(26,18,8,0.72)',
        height: '100%',
        padding: 34,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {children}
    </div>
  </div>
);

// ---------------------------------------------------------------- type

export const Kicker: React.FC<{ children: React.ReactNode; color?: string; style?: React.CSSProperties }> = ({
  children,
  color = C.copper,
  style,
}) => (
  <div
    style={{
      fontFamily: F.mono,
      fontSize: 26,
      letterSpacing: '0.32em',
      color,
      textTransform: 'uppercase',
      fontWeight: 500,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Headline: React.FC<{
  children: React.ReactNode;
  size?: number;
  align?: 'left' | 'center';
  style?: React.CSSProperties;
}> = ({ children, size = 104, align = 'left', style }) => (
  <h1
    style={{
      fontFamily: F.display,
      fontSize: size,
      lineHeight: 1.08,
      color: C.text,
      margin: 0,
      fontWeight: 400,
      textAlign: align,
      letterSpacing: '-0.01em',
      ...style,
    }}
  >
    {children}
  </h1>
);

export const Accent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <em style={{ fontStyle: 'italic', color: C.copper }}>{children}</em>
);

/** Small status pill used across UI moments. */
export const Pill: React.FC<{
  children: React.ReactNode;
  color?: string;
  filled?: boolean;
  style?: React.CSSProperties;
}> = ({ children, color = C.warn, filled, style }) => (
  <span
    style={{
      fontFamily: F.mono,
      fontSize: 22,
      fontWeight: 600,
      letterSpacing: '0.18em',
      padding: '10px 22px',
      borderRadius: 999,
      whiteSpace: 'nowrap',
      ...(filled
        ? { background: color, color: '#120c06' }
        : { border: `1px solid ${color}`, color }),
      ...style,
    }}
  >
    {children}
  </span>
);
