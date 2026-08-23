import React from 'react';
import { interpolate } from 'remotion';
import { C, F } from '../../data';

const cardStyle: React.CSSProperties = {
  background: 'rgba(22,14,8,0.94)',
  border: '1px solid rgba(255,210,170,0.22)',
  borderRadius: 14,
  padding: '16px 18px',
  width: '100%',
};

const fract = (n: number) => n - Math.floor(n);
const noiseAt = (i: number) => fract(Math.sin(i * 12.9898) * 43758.5453) * 2 - 1;

export function SeismicSignatureCard({ frame }: { frame: number }) {
  const enter = interpolate(frame, [0, 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const progress = interpolate(frame, [10, 70], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const footerOpacity = interpolate(frame, [60, 72], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const points: string[] = [];
  for (let i = 0; i <= 200; i++) {
    const x = i * 2;
    const envelope =
      Math.exp(-Math.pow((i - 70) / 55, 2)) * 0.9 +
      Math.exp(-Math.pow((i - 150) / 40, 2)) * 0.45;
    const y = 55 - noiseAt(i) * 38 * envelope;
    points.push(`${x},${y}`);
  }

  const visibleCount = Math.floor(progress * 201);
  const visiblePoints = points.slice(0, Math.max(visibleCount, 0)).join(' ');

  return (
    <div
      style={{
        ...cardStyle,
        opacity: enter,
        transform: `translateY(${(1 - enter) * 14}px)`,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M2 6 Q4 3 6 6 T10 6 T14 6 T18 6 T22 6"
              stroke={C.copper}
              strokeWidth={2}
              fill="none"
            />
            <path
              d="M2 12 Q4 9 6 12 T10 12 T14 12 T18 12 T22 12"
              stroke={C.copper}
              strokeWidth={2}
              fill="none"
            />
            <path
              d="M2 18 Q4 15 6 18 T10 18 T14 18 T18 18 T22 18"
              stroke={C.copper}
              strokeWidth={2}
              fill="none"
            />
          </svg>
          <span
            style={{
              fontFamily: F.mono,
              fontSize: 15,
              letterSpacing: '0.2em',
              color: C.textSecondary,
            }}
          >
            SEISMIC SIGNATURE
          </span>
        </div>
        <span
          style={{
            fontFamily: F.mono,
            fontWeight: 600,
            fontSize: 20,
            color: C.copper,
          }}
        >
          PGA 0.32 g
        </span>
      </div>

      <svg
        width="100%"
        height={110}
        viewBox="0 0 400 110"
        preserveAspectRatio="none"
        style={{ marginTop: 10 }}
      >
        <line x1={0} y1={55} x2={400} y2={55} stroke={C.line} strokeWidth={1} />
        <polyline
          points={visiblePoints}
          stroke={C.copper}
          strokeWidth={2}
          fill="none"
        />
      </svg>

      <div
        style={{
          fontFamily: F.body,
          fontSize: 15,
          color: C.textMuted,
          marginTop: 8,
          opacity: footerOpacity,
        }}
      >
        Fault: Sesar Semangko · 11.8 km
      </div>
    </div>
  );
}

export function PgaDistributionCard({ frame }: { frame: number }) {
  const enter = interpolate(frame, [12, 22], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const p = interpolate(frame, [30, 75], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const areaOpacity = interpolate(frame, [60, 85], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const thumbLeft = interpolate(frame, [70, 95], [8, 32], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const curvePoints: string[] = [];
  for (let i = 0; i <= 100; i++) {
    const x = i * 4;
    const y = 112 - 94 * Math.exp(-Math.pow((x - 200) / 58, 2));
    curvePoints.push(`${x},${y}`);
  }

  const curvePath = `M ${curvePoints.join(' L ')}`;
  const areaPath = `M 0,112 L ${curvePoints.join(' L ')} L 400,112 Z`;

  return (
    <div
      style={{
        ...cardStyle,
        opacity: enter,
        transform: `translateY(${(1 - enter) * 14}px)`,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M2 20 C7 20 8 4 12 4 C16 4 17 20 22 20"
              stroke={C.copper}
              strokeWidth={2}
              fill="none"
            />
          </svg>
          <span
            style={{
              fontFamily: F.mono,
              fontSize: 15,
              letterSpacing: '0.2em',
              color: C.textSecondary,
            }}
          >
            PGA DISTRIBUTION
          </span>
        </div>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 10 }}
        >
          <span
            style={{
              border: `1px solid ${C.warn}`,
              color: C.warn,
              fontFamily: F.mono,
              fontSize: 12,
              letterSpacing: '0.1em',
              padding: '3px 8px',
              borderRadius: 999,
            }}
          >
            MODERATE
          </span>
          <span
            style={{
              fontFamily: F.mono,
              fontWeight: 700,
              fontSize: 26,
              color: C.text,
            }}
          >
            0.32 g
          </span>
        </div>
      </div>

      <svg
        width="100%"
        height={130}
        viewBox="0 0 400 130"
        preserveAspectRatio="none"
        style={{ marginTop: 10 }}
      >
        <defs>
          <linearGradient id="pgaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(212,149,106,0.35)" />
            <stop offset="100%" stopColor="rgba(212,149,106,0)" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#pgaGrad)" opacity={areaOpacity} />
        <path
          d={curvePath}
          pathLength={1}
          strokeDasharray="1"
          strokeDashoffset={1 - p}
          stroke={C.copper}
          strokeWidth={2.5}
          fill="none"
        />
        <line
          x1={128}
          y1={30}
          x2={128}
          y2={112}
          stroke={C.warn}
          strokeWidth={1.5}
          strokeDasharray="4 4"
          opacity={areaOpacity}
        />
      </svg>

      <div
        style={{
          position: 'relative',
          marginTop: 12,
          height: 8,
          borderRadius: 6,
          background:
            'linear-gradient(90deg, rgba(16,185,129,0.5), rgba(245,158,11,0.65) 45%, rgba(239,68,68,0.45))',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: `${thumbLeft}%`,
            top: -4,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: '#f0e4cc',
            border: '3px solid #241509',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 6,
        }}
      >
        <span style={{ fontFamily: F.mono, fontSize: 12, color: C.safe }}>
          0.1g SAFE
        </span>
        <span style={{ fontFamily: F.mono, fontSize: 12, color: C.warn }}>
          0.5g MOD
        </span>
        <span style={{ fontFamily: F.mono, fontSize: 12, color: C.danger }}>
          1.0g CRIT
        </span>
      </div>
    </div>
  );
}
