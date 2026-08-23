import { interpolate } from 'remotion';
import { C, F } from '../../data';

const copyIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect x="9" y="9" width="11" height="11" rx="2" stroke={C.textMuted} strokeWidth="2" />
    <path d="M5 15V6a2 2 0 0 1 2-2h9" stroke={C.textMuted} strokeWidth="2" />
  </svg>
);

const targetIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="8" stroke={C.copper} strokeWidth="2" />
    <circle cx="12" cy="12" r="3" stroke={C.copper} strokeWidth="2" />
  </svg>
);

const boxes: Array<{ label: string; value: string }> = [
  { label: 'LAT', value: '-5.3971' },
  { label: 'LON', value: '105.2668' },
  { label: 'ELEV', value: '93 m' },
];

export function SiteLocationCard({ frame }: { frame: number }) {
  const t0 = interpolate(frame, [0, 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const tAddr = interpolate(frame, [10, 24], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const tf = interpolate(frame, [42, 52], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        opacity: t0,
        transform: `translateY(${(1 - t0) * 14}px)`,
        fontFamily: F.body,
      }}
    >
      <div
        style={{
          fontFamily: F.mono,
          fontSize: 14,
          letterSpacing: '0.25em',
          color: C.textMuted,
          marginBottom: 10,
        }}
      >
        LOCATION
      </div>
      <div
        style={{
          background: 'rgba(22,14,8,0.94)',
          border: '1px solid rgba(255,210,170,0.22)',
          borderRadius: 14,
          padding: '16px 18px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              fontFamily: F.mono,
              fontSize: 15,
              letterSpacing: '0.2em',
              color: C.textSecondary,
            }}
          >
            SITE LOCATION
          </div>
          {copyIcon}
        </div>
        <div
          style={{
            fontSize: 19,
            color: C.text,
            lineHeight: 1.45,
            marginTop: 8,
            opacity: tAddr,
          }}
        >
          Bandar Lampung,
          <br />
          Lampung, Indonesia
        </div>
        <div
          style={{
            marginTop: 14,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
          }}
        >
          {boxes.map((b, i) => {
            const ti = interpolate(frame, [20 + i * 6, 28 + i * 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            return (
              <div
                key={b.label}
                style={{
                  background: 'rgba(15,11,8,0.85)',
                  border: `1px solid ${C.line}`,
                  borderRadius: 10,
                  padding: '10px 12px',
                  opacity: ti,
                  transform: `translateY(${(1 - ti) * 8}px)`,
                }}
              >
                <div
                  style={{
                    fontFamily: F.mono,
                    fontSize: 11,
                    letterSpacing: '0.15em',
                    color: C.textMuted,
                  }}
                >
                  {b.label}
                </div>
                <div
                  style={{
                    fontFamily: F.mono,
                    fontWeight: 600,
                    fontSize: 20,
                    color: C.text,
                  }}
                >
                  {b.value}
                </div>
              </div>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            border: `1px solid ${C.line}`,
            borderRadius: 10,
            padding: '10px 12px',
            opacity: tf,
            transform: `translateY(${(1 - tf) * 8}px)`,
          }}
        >
          {targetIcon}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 17, color: C.text }}>
              Sesar Semangko
            </div>
            <div style={{ fontSize: 14, color: C.textMuted }}>
              11.8 km dari lokasi
            </div>
          </div>
          <div
            style={{
              border: `1px solid ${C.warn}`,
              color: C.warn,
              fontFamily: F.mono,
              fontSize: 12,
              padding: '3px 8px',
              borderRadius: 6,
            }}
          >
            MOD
          </div>
        </div>
      </div>
    </div>
  );
}

export function PanelActions({ frame }: { frame: number }) {
  const tb = interpolate(frame, [56, 70], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        marginTop: 14,
        display: 'flex',
        gap: 12,
        opacity: tb,
        transform: `translateY(${(1 - tb) * 16}px)`,
        fontFamily: F.body,
      }}
    >
      <div
        style={{
          flex: 1.4,
          background: C.copper,
          color: '#241509',
          borderRadius: 12,
          padding: '14px 18px',
          fontWeight: 600,
          fontSize: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="5" y="3" width="14" height="18" rx="2" stroke="#241509" strokeWidth="2" />
          <path d="M9 8h6M9 12h6M9 16h4" stroke="#241509" strokeWidth="2" strokeLinecap="round" />
        </svg>
        Lihat Laporan Audit AI
        <span>›</span>
      </div>
      <div
        style={{
          flex: 1,
          background: 'transparent',
          border: `1px solid ${C.lineStrong}`,
          color: C.copper,
          borderRadius: 12,
          padding: '14px 18px',
          fontWeight: 600,
          fontSize: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 16l.9 2.1L22 19l-2.1.9L19 22l-.9-2.1L16 19l2.1-.9L19 16z"
            stroke={C.copper}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
        Tanya AI
      </div>
    </div>
  );
}
