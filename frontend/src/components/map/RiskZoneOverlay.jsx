import { useMemo } from 'react';
import { Circle, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { useAppStore } from '../../store/useAppStore';

// ── Offset a lat/lon by meters in a bearing direction ─────────────
function offsetCoord(lat, lon, bearingDeg, distMeters) {
  const R = 6378137;
  const d = distMeters / R;
  const b = (bearingDeg * Math.PI) / 180;
  const lat1 = (lat * Math.PI) / 180;
  const lon1 = (lon * Math.PI) / 180;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(b)
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(b) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
    );
  return [(lat2 * 180) / Math.PI, (lon2 * 180) / Math.PI];
}

// ── Risk colour based on 0–100 score ──────────────────────────────
function riskClr(val) {
  if (val >= 70) return { hex: '#ef4444', label: 'HIGH', border: 'rgba(239,68,68,0.5)' };
  if (val >= 40) return { hex: '#f59e0b', label: 'MED',  border: 'rgba(245,158,11,0.45)' };
  return              { hex: '#10b981', label: 'LOW',  border: 'rgba(16,185,129,0.35)' };
}

function overallRisk(radar) {
  const max = Math.max(
    radar.flood ?? 0, radar.seismic ?? 0,
    radar.soil  ?? 0, radar.landslide ?? 0, radar.air ?? 0
  );
  return riskClr(max);
}

// ── Floating info-flag DivIcon ────────────────────────────────────
function buildInfoFlag(icon, label, value) {
  const rc = riskClr(value);
  const bar = Math.max(4, Math.min(100, value));
  return L.divIcon({
    className: '',
    iconSize: [130, 52],
    iconAnchor: [65, 26],
    html: `
      <div style="
        background:rgba(15,11,8,0.90);
        backdrop-filter:blur(16px);
        border:1px solid ${rc.border};
        border-radius:10px;
        padding:6px 10px;
        font-family:'Inter','Plus Jakarta Sans',sans-serif;
        min-width:120px;
        box-shadow:0 4px 20px rgba(0,0,0,0.5);
        pointer-events:none;
      ">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:4px;">
          <div style="display:flex;align-items:center;gap:5px;">
            <span style="font-size:13px;line-height:1;">${icon}</span>
            <span style="font-size:9px;font-weight:600;color:#c4a87e;letter-spacing:0.04em;">${label}</span>
          </div>
          <div style="display:flex;align-items:center;gap:4px;">
            <span style="font-size:13px;font-weight:800;color:${rc.hex};font-family:'Geist Mono',monospace;">${value}</span>
            <span style="font-size:7px;font-weight:700;color:${rc.hex};letter-spacing:0.1em;opacity:0.8;">${rc.label}</span>
          </div>
        </div>
        <div style="height:3px;background:rgba(255,255,255,0.07);border-radius:2px;overflow:hidden;">
          <div style="height:100%;width:${bar}%;background:${rc.hex};border-radius:2px;"></div>
        </div>
      </div>
    `,
  });
}

// ── Hazard distance label ─────────────────────────────────────────
function buildDistLabel(name, distKm, color) {
  const display = distKm < 1 ? `${Math.round(distKm * 1000)}m` : `${distKm.toFixed(1)}km`;
  return L.divIcon({
    className: '',
    iconSize: [170, 32],
    iconAnchor: [85, 16],
    html: `
      <div style="
        background:rgba(15,11,8,0.87);
        backdrop-filter:blur(12px);
        border:1px solid ${color}50;
        border-radius:8px;
        padding:4px 10px;
        font-family:'Inter',sans-serif;
        text-align:center;
        white-space:nowrap;
        box-shadow:0 2px 12px rgba(0,0,0,0.35);
        pointer-events:none;
      ">
        <span style="font-size:8px;font-weight:600;color:${color};letter-spacing:0.05em;">${name}</span>
        <span style="font-size:9px;font-weight:800;color:#f0e4cc;margin-left:6px;font-family:'Geist Mono',monospace;">${display}</span>
      </div>
    `,
  });
}

// ── Ring distance label ───────────────────────────────────────────
function buildRingLabel(text) {
  return L.divIcon({
    className: '',
    iconSize: [60, 16],
    iconAnchor: [30, 8],
    html: `<div style="font-size:7px;font-weight:600;color:rgba(212,149,106,0.4);font-family:'Geist Mono',monospace;text-align:center;letter-spacing:0.12em;pointer-events:none;">${text}</div>`,
  });
}

// ── Per-property overlay ──────────────────────────────────────────
function PropertyOverlay({ property, prefix }) {
  const { lat, lon } = property.coords;
  const radar   = property.radarData;
  const payload = property.compressedPayload;

  const overall = useMemo(() => overallRisk(radar), [
    radar.flood, radar.seismic, radar.soil, radar.landslide, radar.air,
  ]);

  // Four main risk flags placed at compass offsets
  const flags = useMemo(() => [
    { bearing: 30,  icon: '🌊', label: 'FLOOD',   value: radar.flood   ?? 0 },
    { bearing: 150, icon: '🌋', label: 'SEISMIC',  value: radar.seismic ?? 0 },
    { bearing: 210, icon: '🧱', label: 'SOIL',     value: radar.soil    ?? 0 },
    { bearing: 330, icon: '🌬️', label: 'AQI',      value: radar.air     ?? 0 },
  ], [radar.flood, radar.seismic, radar.soil, radar.air]);

  const fault   = payload?.seismotectonic?.nearest_fault;
  const volcano = payload?.seismotectonic?.nearest_volcano;
  const tsunami = payload?.tsunami_analysis;

  // Hazard connector lines (short indicator, not to real coordinates)
  const hazardLines = useMemo(() => {
    const lines = [];
    if (fault?.name   && (fault.dist_km   ?? 999) < 100)
      lines.push({ bearing: 45,  color: '#ef4444', name: `⚡ ${fault.name}`,          dist: fault.dist_km });
    if (volcano?.name && (volcano.dist_km ?? 999) < 100)
      lines.push({ bearing: 135, color: '#f97316', name: `🌋 ${volcano.name}`,        dist: volcano.dist_km });
    if (tsunami?.risk_level !== 'RENDAH' && (tsunami?.dist_to_coast_km ?? 999) < 20)
      lines.push({ bearing: 270, color: '#06b6d4', name: `🌊 ${tsunami.nearest_coast}`, dist: tsunami.dist_to_coast_km });
    return lines.map((l) => ({
      ...l,
      points: [[lat, lon], offsetCoord(lat, lon, l.bearing, 480)],
    }));
  }, [lat, lon, fault?.name, fault?.dist_km, volcano?.name, volcano?.dist_km, tsunami?.risk_level, tsunami?.dist_to_coast_km, tsunami?.nearest_coast]);

  // Optional landslide flag
  const showLandslide = (radar.landslide ?? 0) >= 25;
  const landslidePos  = useMemo(() => offsetCoord(lat, lon, 90, 320), [lat, lon]);

  return (
    <>
      {/* ── Outer scan ring 500 m ── */}
      <Circle
        center={[lat, lon]}
        radius={500}
        pathOptions={{
          color: 'rgba(212,149,106,0.18)',
          weight: 1,
          fillOpacity: 0,
          dashArray: '6 8',
          className: 'map-scan-ring'
        }}
      />
      <Marker
        position={offsetCoord(lat, lon, 0, 500)}
        icon={buildRingLabel('500m')}
        interactive={false}
      />

      {/* ── Inner risk zone 200 m ── */}
      <Circle
        center={[lat, lon]}
        radius={200}
        pathOptions={{
          color: overall.hex,
          weight: 1.5,
          opacity: 0.45,
          fillColor: overall.hex,
          fillOpacity: 0.08,
          className: 'map-pulse-ring'
        }}
      />
      <Marker
        position={offsetCoord(lat, lon, 0, 200)}
        icon={buildRingLabel('200m')}
        interactive={false}
      />

      {/* ── Core glow 60 m ── */}
      <Circle
        center={[lat, lon]}
        radius={60}
        pathOptions={{
          color: overall.hex,
          weight: 0,
          fillColor: overall.hex,
          fillOpacity: 0.15,
        }}
      />

      {/* ── Hazard connector lines ── */}
      {hazardLines.map((h, i) => (
        <Polyline
          key={`${prefix}line-${i}`}
          positions={h.points}
          pathOptions={{ color: h.color, weight: 1.5, opacity: 0.5, dashArray: '4 6' }}
        />
      ))}

      {/* ── Hazard distance labels ── */}
      {hazardLines.map((h, i) => (
        <Marker
          key={`${prefix}hlabel-${i}`}
          position={h.points[1]}
          icon={buildDistLabel(h.name, h.dist, h.color)}
          interactive={false}
        />
      ))}

      {/* ── Four main risk flags ── */}
      {flags.map((f) => (
        <Marker
          key={`${prefix}flag-${f.label}`}
          position={offsetCoord(lat, lon, f.bearing, 320)}
          icon={buildInfoFlag(f.icon, f.label, f.value)}
          interactive={false}
        />
      ))}

      {/* ── Landslide flag (conditional, has unique key) ── */}
      {showLandslide && (
        <Marker
          key={`${prefix}flag-LANDSLIDE`}
          position={landslidePos}
          icon={buildInfoFlag('🏔️', 'LANDSLIDE', radar.landslide)}
          interactive={false}
        />
      )}
    </>
  );
}

// ── Guard wrapper so we never render with bad data ─────────────────
function SafePropertyOverlay({ property, prefix }) {
  if (!property?.coords || !property?.radarData || !property?.compressedPayload) return null;
  return <PropertyOverlay property={property} prefix={prefix} />;
}

export function RiskZoneOverlay() {
  const propertyA = useAppStore((s) => s.propertyA);
  const propertyB = useAppStore((s) => s.propertyB);

  return (
    <>
      <SafePropertyOverlay property={propertyA} prefix="A-" />
      <SafePropertyOverlay property={propertyB} prefix="B-" />
    </>
  );
}
