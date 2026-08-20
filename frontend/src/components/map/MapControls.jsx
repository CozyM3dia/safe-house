import { useMap } from 'react-leaflet';
import { ZoomIn, ZoomOut, Crosshair } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useT } from '../../hooks/useTranslation';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '../../lib/constants';

function ControlBtn({ children, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex min-h-[44px] min-w-[44px] items-center justify-center text-text-secondary transition-colors hover:bg-white/8 hover:text-accent sm:min-h-9 sm:min-w-9 first:rounded-t-xl last:rounded-b-xl"
    >
      {children}
    </button>
  );
}

function ControlsInner() {
  const map = useMap();
  const t = useT();
  const propertyA = useAppStore((s) => s.propertyA);

  const recenter = () => {
    if (propertyA?.lat != null) {
      map.flyTo([propertyA.lat, propertyA.lon], 15);
    } else {
      map.flyTo(DEFAULT_CENTER, DEFAULT_ZOOM);
    }
  };

  return (
    <div data-testid="map-controls" className="glass pointer-events-auto absolute bottom-6 right-4 z-[15] flex flex-col overflow-hidden rounded-xl max-[639px]:bottom-[calc(6rem+env(safe-area-inset-bottom))] max-[639px]:right-3">
      <ControlBtn onClick={() => map.zoomIn()} label={t('map.zoomIn')}>
        <ZoomIn className="h-4 w-4" />
      </ControlBtn>
      <div className="h-px bg-white/8" />
      <ControlBtn onClick={() => map.zoomOut()} label={t('map.zoomOut')}>
        <ZoomOut className="h-4 w-4" />
      </ControlBtn>
      <div className="h-px bg-white/8" />
      <ControlBtn onClick={recenter} label={t('map.recenter')}>
        <Crosshair className="h-4 w-4" />
      </ControlBtn>
    </div>
  );
}

export function MapControls() {
  return <ControlsInner />;
}
