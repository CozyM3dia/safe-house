import { interpolate } from 'remotion';
import { F } from '../../data';

interface Poi {
  x: number;
  y: number;
  color: string;
  label?: string;
}

const pois: Poi[] = [
  { x: 640, y: 180, color: '#d4956a' },
  { x: 880, y: 150, color: '#c084fc', label: 'Pelita' },
  { x: 1180, y: 170, color: '#7dd3fc' },
  { x: 1520, y: 210, color: '#f472b6', label: 'Tanjungkarang' },
  { x: 1800, y: 300, color: '#d4956a' },
  { x: 700, y: 400, color: '#7dd3fc', label: 'Sukarame' },
  { x: 990, y: 430, color: '#f472b6' },
  { x: 1420, y: 460, color: '#d4956a' },
  { x: 1750, y: 560, color: '#c084fc' },
  { x: 660, y: 640, color: '#f472b6', label: 'Kedaton' },
  { x: 1000, y: 800, color: '#7dd3fc' },
  { x: 1380, y: 850, color: '#d4956a', label: 'Rajabasa' },
  { x: 1700, y: 900, color: '#f472b6' },
  { x: 1560, y: 700, color: '#7dd3fc', label: 'Telukbetung' },
];

export default function MapPois({ frame }: { frame: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {pois.map((poi, i) => {
        const opacity = interpolate(
          frame,
          [20 + i * 4, 30 + i * 4],
          [0, 1],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
        );
        return (
          <div
            key={`${poi.x}-${poi.y}`}
            style={{
              position: 'absolute',
              left: poi.x,
              top: poi.y,
              opacity,
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: -6,
                top: -6,
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: poi.color,
                opacity: 0.18,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: -5,
                top: -5,
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: poi.color,
                boxShadow: '0 0 0 2px rgba(255,255,255,0.35)',
              }}
            />
            {poi.label ? (
              <div
                style={{
                  position: 'absolute',
                  left: 12,
                  top: -11,
                  background: 'rgba(20,14,9,0.78)',
                  fontFamily: F.body,
                  fontSize: 13,
                  color: '#e8dcc4',
                  padding: '2px 8px',
                  borderRadius: 6,
                  whiteSpace: 'nowrap',
                }}
              >
                {poi.label}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
