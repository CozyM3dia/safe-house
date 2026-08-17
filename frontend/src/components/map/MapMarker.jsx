import L from 'leaflet';
import { Marker, Polyline } from 'react-leaflet';
import { useAppStore } from '../../store/useAppStore';
import { riskHex } from '../../lib/utils';

function computeScore(property) {
  // Skor backend adalah sumber kebenaran.
  if (typeof property?.safe_score === 'number') return property.safe_score;
  return null;
}

function buildIcon(color = '#d4956a', label = '') {
  const html = `
    <div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
      <span style="
        position:absolute;inset:0;border-radius:50%;
        background:${color};opacity:0.22;
        animation:safe-ping 2s ease-out infinite;
      "></span>
      <span style="
        position:absolute;inset:5px;border-radius:50%;
        background:${color};
        box-shadow:0 0 12px ${color}90, 0 2px 6px rgba(0,0,0,0.25);
        border:2.5px solid rgba(255,255,255,0.95);
        display:flex;align-items:center;justify-content:center;
        font-size:10px;font-weight:700;color:#fff;
        font-family:'Geist Mono',monospace;letter-spacing:0;
      ">${label}</span>
    </div>
    <style>
      @keyframes safe-ping {
        0%{transform:scale(0.85);opacity:0.5}
        80%,100%{transform:scale(2.2);opacity:0}
      }
    </style>
  `;
  return L.divIcon({
    html,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

function buildPendingIcon() {
  const html = `
    <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
      <span style="position:absolute;inset:0;border-radius:50%;border:2px dashed #d4956a;animation:safe-spin 8s linear infinite;opacity:0.85;"></span>
      <span style="position:absolute;inset:4px;border-radius:50%;background:rgba(212,149,106,0.25);animation:safe-ping 1.5s ease-out infinite;"></span>
      <span style="position:absolute;width:10px;height:10px;border-radius:50%;background:#d4956a;box-shadow:0 0 12px #d4956a;"></span>
    </div>
    <style>
      @keyframes safe-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      @keyframes safe-ping { 0%{transform:scale(0.85);opacity:0.6} 80%,100%{transform:scale(2.2);opacity:0} }
    </style>
  `;
  return L.divIcon({
    html,
    className: '',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

export function MapMarker() {
  const propertyA = useAppStore((s) => s.propertyA);
  const propertyB = useAppStore((s) => s.propertyB);
  const pendingAudit = useAppStore((s) => s.pendingAudit);

  const hasBothBattlePins =
    propertyA?.lat != null &&
    propertyA?.lon != null &&
    propertyB?.lat != null &&
    propertyB?.lon != null;

  return (
    <>
      {/* ── Pending Audit Target Preview Pin ── */}
      {pendingAudit?.lat != null && pendingAudit?.lng != null && (
        <Marker
          key={`pending-${pendingAudit.lat}-${pendingAudit.lng}`}
          position={[pendingAudit.lat, pendingAudit.lng]}
          icon={buildPendingIcon()}
          interactive={false}
        />
      )}

      {/* ── Battle Mode connecting dashed line ── */}
      {hasBothBattlePins && (
        <Polyline
          positions={[
            [propertyA.lat, propertyA.lon],
            [propertyB.lat, propertyB.lon],
          ]}
          pathOptions={{
            color: '#d4956a',
            weight: 2,
            opacity: 0.75,
            dashArray: '6, 8',
          }}
        />
      )}

      {/* ── Pin A ── */}
      {propertyA?.lat != null && (
        <Marker
          key={`A-${propertyA.lat}`}
          position={[propertyA.lat, propertyA.lon]}
          icon={buildIcon(
            Number.isFinite(computeScore(propertyA)) ? riskHex(computeScore(propertyA)) : '#6b7280',
            'A'
          )}
        />
      )}

      {/* ── Pin B ── */}
      {propertyB?.lat != null && (
        <Marker
          key={`B-${propertyB.lat}`}
          position={[propertyB.lat, propertyB.lon]}
          icon={buildIcon(
            Number.isFinite(computeScore(propertyB)) ? riskHex(computeScore(propertyB)) : '#6b7280',
            'B'
          )}
        />
      )}
    </>
  );
}
