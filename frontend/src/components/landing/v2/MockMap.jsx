import { lazy, Suspense, useState } from 'react';
import { prefersLiteMedia } from '../../../lib/responsive';

const MockMapLive = lazy(() => import('./MockMapLive'));

function MockMapPoster({ lat, lon }) {
  return (
    <div
      className="lp-mock-map lp-mock-map-poster absolute inset-0"
      role="img"
      aria-label={`Peta audit ${lat.toFixed(3)}, ${lon.toFixed(3)}`}
    >
      <span className="lp-mock-pin" aria-hidden="true">
        <span className="lp-mock-pin-halo" />
        <span className="lp-mock-pin-core" />
      </span>
    </div>
  );
}

/**
 * Gerbang peta mockup. Ponsel / Save-Data / reduced-motion memakai poster
 * CSS (tanpa Leaflet, tanpa tile). Desktop mengunduh chunk Leaflet hanya
 * saat komponen ini dipasang.
 */
export default function MockMap(props) {
  const [lite] = useState(() => prefersLiteMedia());
  if (lite) return <MockMapPoster lat={props.lat} lon={props.lon} />;
  return (
    <Suspense fallback={<MockMapPoster lat={props.lat} lon={props.lon} />}>
      <MockMapLive {...props} />
    </Suspense>
  );
}
