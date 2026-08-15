import { useMap } from 'react-leaflet';
import { ZoomIn, ZoomOut, Crosshair } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '../../lib/constants';

function ControlBtn({ children, onClick, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="btn-press flex h-10 w-10 items-center justify-center text-text-secondary transition-colors hover:bg-white/8 hover:text-accent focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent first:rounded-t-2xl last:rounded-b-2xl"
    >
      {children}
    </button>
  );
}

function ControlsInner() {
  const map = useMap();
  const propertyA = useAppStore((s) => s.propertyA);

  const recenter = () => {
    if (propertyA?.lat != null) {
      map.flyTo([propertyA.lat, propertyA.lon], 15, { duration: 0.8 });
    } else {
      map.flyTo(DEFAULT_CENTER, DEFAULT_ZOOM, { duration: 0.8 });
    }
  };

  return (
    <div
      className="glass pointer-events-auto absolute bottom-5 right-4 z-[15] flex flex-col overflow-hidden rounded-2xl"
      role="group"
      aria-label="Kontrol peta"
    >
      <ControlBtn onClick={() => map.zoomIn()} title="Perbesar peta">
        <ZoomIn className="h-4 w-4" />
      </ControlBtn>
      <div className="h-px bg-white/8" />
      <ControlBtn onClick={() => map.zoomOut()} title="Perkecil peta">
        <ZoomOut className="h-4 w-4" />
      </ControlBtn>
      <div className="h-px bg-white/8" />
      <ControlBtn onClick={recenter} title="Kembali ke lokasi">
        <Crosshair className="h-4 w-4" />
      </ControlBtn>
    </div>
  );
}

export function MapControls() {
  return <ControlsInner />;
}
