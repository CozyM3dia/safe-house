import { C, F } from '../../data';

const sidebarIcon = (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <line x1={3} y1={6} x2={21} y2={6} stroke={C.textSecondary} strokeWidth={2} strokeLinecap="round" />
    <line x1={3} y1={12} x2={21} y2={12} stroke={C.textSecondary} strokeWidth={2} strokeLinecap="round" />
    <line x1={3} y1={18} x2={21} y2={18} stroke={C.textSecondary} strokeWidth={2} strokeLinecap="round" />
    <line x1={7.5} y1={4} x2={7.5} y2={20} stroke={C.copper} strokeWidth={2} strokeLinecap="round" />
  </svg>
);

const magnifierIcon = (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <circle cx={10.5} cy={10.5} r={6.5} stroke={C.copper} strokeWidth={2} />
    <line x1={15.5} y1={15.5} x2={20} y2={20} stroke={C.copper} strokeWidth={2} strokeLinecap="round" />
  </svg>
);

const boltIcon = (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="#241509">
    <path d="M13 2 L4 14 H11 L9.5 22 L20 9 H12.5 Z" />
  </svg>
);

const globeIcon = (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <circle cx={12} cy={12} r={9} stroke={C.textSecondary} strokeWidth={1.8} />
    <ellipse cx={12} cy={12} rx={4} ry={9} stroke={C.textSecondary} strokeWidth={1.8} />
    <line x1={3} y1={12} x2={21} y2={12} stroke={C.textSecondary} strokeWidth={1.8} />
  </svg>
);

export default function AppTopBar({ query, caretOn, pressed }: { query: string; caretOn: boolean; pressed: boolean }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 84,
        background: '#161009',
        borderBottom: `1px solid ${C.lineStrong}`,
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        padding: '0 28px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {sidebarIcon}
        <img src={require('../../../public/safe_icon_dark.png')} style={{ height: 38 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontFamily: F.body, fontWeight: 700, fontSize: 20, color: C.text }}>S.A.F.E House</span>
          <span style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: '0.25em', color: C.textMuted }}>
            GEOPHYSICS CORE v3.0
          </span>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          maxWidth: 860,
          background: 'rgba(12,9,6,0.92)',
          border: `1px solid ${C.lineStrong}`,
          borderRadius: 12,
          padding: '13px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        {magnifierIcon}
        <span style={{ fontFamily: F.mono, fontSize: 21, color: query ? C.text : C.textMuted }}>
          {query || 'Cari lokasi atau jalankan perintah...'}
          {caretOn ? <span style={{ color: C.copper }}>|</span> : null}
        </span>
        <span
          style={{
            marginLeft: 'auto',
            border: `1px solid ${C.line}`,
            borderRadius: 6,
            padding: '3px 10px',
            fontFamily: F.mono,
            fontSize: 16,
            color: C.textMuted,
          }}
        >
          ⌘K
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginLeft: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {globeIcon}
          <span style={{ fontFamily: F.body, fontSize: 17, color: C.textSecondary }}>ID Indonesia</span>
          <span style={{ color: C.textMuted, fontSize: 14 }}>▾</span>
        </div>

        <button
          style={{
            background: C.copper,
            color: '#241509',
            fontFamily: F.mono,
            fontWeight: 700,
            fontSize: 17,
            letterSpacing: '0.08em',
            padding: '10px 20px',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            border: 'none',
            transform: pressed ? 'scale(0.97)' : 'scale(1)',
            boxShadow: pressed ? '0 0 34px rgba(212,149,106,0.85)' : 'none',
            cursor: 'pointer',
          }}
        >
          {boltIcon}
          AUDIT
        </button>

        <button
          style={{
            background: 'transparent',
            border: `1px solid ${C.lineStrong}`,
            color: C.textSecondary,
            fontFamily: F.mono,
            fontSize: 17,
            padding: '10px 18px',
            borderRadius: 10,
            cursor: 'pointer',
          }}
        >
          BATTLE
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            border: `1px solid ${C.line}`,
            borderRadius: 999,
            padding: '8px 16px',
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: 999, background: C.warn }} />
          <span style={{ fontFamily: F.mono, fontSize: 14, letterSpacing: '0.15em', color: C.warn }}>
            AI MEMPROSES
          </span>
        </div>
      </div>
    </div>
  );
}
