import L from 'leaflet';
import { Marker } from 'react-leaflet';
import { useAppStore } from '../../store/useAppStore';
import { riskHex } from '../../lib/utils';

function computeScore(property) {
  if (!property?.radarData) return 50;
  if (property.isOcean) return 0; // Lautan tidak bisa dibangun, skor otomatis 0
  const r = property.radarData;
  const avg = (r.flood + r.soil + r.seismic + r.landslide) / 4;
  return Math.round(Math.max(0, Math.min(100, 100 - avg)));
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

export function MapMarker() {
  const propertyA = useAppStore((s) => s.propertyA);
  const propertyB = useAppStore((s) => s.propertyB);

  return (
    <>
      {propertyA?.coords && (
        <Marker
          key={`A-${propertyA.coords.lat}`}
          position={[propertyA.coords.lat, propertyA.coords.lon]}
          icon={buildIcon(riskHex(computeScore(propertyA)), 'A')}
        />
      )}
      {propertyB?.coords && (
        <Marker
          key={`B-${propertyB.coords.lat}`}
          position={[propertyB.coords.lat, propertyB.coords.lon]}
          icon={buildIcon(riskHex(computeScore(propertyB)), 'B')}
        />
      )}
    </>
  );
}
