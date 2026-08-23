import React from 'react';
import { interpolate, spring } from 'remotion';
import { C, F } from '../../data';

const FPS = 30;

const layerStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
};

const centered = (size: number): React.CSSProperties => ({
  position: 'absolute',
  left: 1150,
  top: 610,
  width: size,
  height: size,
  marginLeft: -size / 2,
  marginTop: -size / 2,
  borderRadius: '50%',
});

function ScanRing({ frame, start }: { frame: number; start: number }) {
  const p = interpolate(frame, [start, start + 55], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (p <= 0 || p >= 1) return null;
  const size = 30 + p * 230 * 2;
  return (
    <div
      style={{
        ...centered(size),
        border: `2px solid ${C.copper}`,
        opacity: 0.85 * (1 - p),
      }}
    />
  );
}

export function SiteMarker({ frame }: { frame: number }) {
  const s = spring({
    frame: frame - 84,
    fps: FPS,
    config: { damping: 12, stiffness: 160 },
    durationInFrames: 40,
  });
  return (
    <div style={layerStyle}>
      <div
        style={{
          position: 'absolute',
          left: 1150,
          top: 610,
          transform: `translate(-50%, -50%) scale(${0.5 + 0.5 * s}) translateY(${(1 - s) * -120}px)`,
          opacity: s,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: '#10b981',
            border: '3px solid #f0e4cc',
            boxShadow: '0 6px 18px rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: F.body,
            fontWeight: 800,
            fontSize: 26,
            color: '#0b2b1f',
          }}
        >
          A
        </div>
      </div>
      <div
        style={{
          ...centered(170),
          border: '2px dashed rgba(212,149,106,0.7)',
          transform: `rotate(${frame * 0.4}deg)`,
        }}
      />
      {[96, 134].map((start) => (
        <ScanRing key={start} frame={frame} start={start} />
      ))}
    </div>
  );
}

interface ChipSpec {
  left: number;
  top: number;
  label: string;
  value: string;
  tag: string;
  tagColor: string;
}

const chips: ChipSpec[] = [
  { left: 1230, top: 486, label: 'PGA', value: '0.32 g', tag: 'SEDANG', tagColor: C.warn },
  { left: 980, top: 668, label: 'FS LIKUEFAKSI', value: '1.15', tag: 'TIPIS', tagColor: C.warn },
  { left: 1250, top: 700, label: 'SESAR SEMANGKO', value: '11.8 KM', tag: 'DEKAT', tagColor: C.danger },
];

export function DataChips({ frame }: { frame: number }) {
  return (
    <div style={layerStyle}>
      {chips.map((chip, i) => {
        const t = interpolate(frame, [110 + i * 8, 120 + i * 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        return (
          <div
            key={chip.label}
            style={{
              position: 'absolute',
              left: chip.left,
              top: chip.top,
              background: 'rgba(18,12,7,0.92)',
              border: `1px solid ${C.lineStrong}`,
              borderRadius: 10,
              padding: '8px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              opacity: t,
              transform: `translateY(${(1 - t) * 10}px)`,
            }}
          >
            <span
              style={{
                fontFamily: F.mono,
                fontSize: 12,
                letterSpacing: '0.12em',
                color: C.textMuted,
                textTransform: 'uppercase',
              }}
            >
              {chip.label}
            </span>
            <span
              style={{
                fontFamily: F.mono,
                fontWeight: 700,
                fontSize: 20,
                color: C.text,
              }}
            >
              {chip.value}
            </span>
            <span
              style={{
                fontFamily: F.mono,
                fontSize: 12,
                padding: '2px 8px',
                borderRadius: 6,
                border: `1px solid ${chip.tagColor}`,
                color: chip.tagColor,
              }}
            >
              {chip.tag}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function ToastNotification({ frame }: { frame: number }) {
  const t = interpolate(frame, [150, 166], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 88,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          background: 'rgba(18,12,7,0.95)',
          border: `1px solid ${C.lineStrong}`,
          borderRadius: 999,
          padding: '14px 26px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          opacity: t,
          transform: `translateY(${(1 - t) * 20}px)`,
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke={C.safe} strokeWidth="2" />
          <path d="M8 12.5l2.5 2.5L16 9.5" stroke={C.safe} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
        <span style={{ fontFamily: F.body, fontSize: 18, color: C.text }}>
          Ringkasan siap — laporan lengkap sedang dibuat...
        </span>
      </div>
    </div>
  );
}

export function ChatFab({ frame }: { frame: number }) {
  const t = interpolate(frame, [130, 146], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div style={layerStyle}>
      <div
        style={{
          position: 'absolute',
          right: 60,
          bottom: 78,
          background: 'rgba(18,12,7,0.95)',
          border: `1px solid ${C.lineStrong}`,
          borderRadius: 999,
          padding: '12px 16px 12px 22px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          opacity: t,
          transform: `translateY(${(1 - t) * 16}px)`,
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M12 3c0 4-2 8-9 9 7 1 9 5 9 9 0-4 2-8 9-9-7-1-9-5-9-9z" stroke={C.copper} strokeWidth="2" strokeLinejoin="round" fill="none" />
        </svg>
        <span style={{ fontFamily: F.body, fontSize: 17, color: C.textSecondary }}>
          Berapa skor S.A.F.E properti ini?
        </span>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: C.copper,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 19V5M5 12l7-7 7 7" stroke="#241509" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </div>
      </div>
    </div>
  );
}
