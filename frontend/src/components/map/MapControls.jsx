import { useMap } from 'react-leaflet';
import { ZoomIn, ZoomOut, Crosshair } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useT } from '../../hooks/useTranslation';
import { cn } from '../../lib/utils';
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
  const chatExpanded = useAppStore((s) => s.chatExpanded);
  const chatDockDismissed = useAppStore((s) => s.chatDockDismissed);
  const leftPanelOpen = useAppStore((s) => s.leftPanelOpen);
  const mapLayersOpen = useAppStore((s) => s.mapLayersOpen);

  const recenter = () => {
    if (propertyA?.lat != null) {
      map.flyTo([propertyA.lat, propertyA.lon], 15);
    } else {
      map.flyTo(DEFAULT_CENTER, DEFAULT_ZOOM);
    }
  };

  // Panel chat memenuhi sisi kanan (desktop) atau seluruh layar (ponsel) —
  // kontrol zoom di belakangnya tak tersentuh, jadi sembunyikan saja.
  if (chatExpanded) return null;

  // Dok AI (lebar) menutupi ~11rem dari bawah; peluncur FAB hanya ~5.5rem.
  // Panel kiri di ponsel adalah bottom sheet yang menutupi sudut kanan-bawah.
  const dockVisible = !mapLayersOpen && !chatDockDismissed;
  const fabVisible = !mapLayersOpen && chatDockDismissed;
  const sheetCoversMobile = leftPanelOpen;

  return (
    <div
      data-testid="map-controls"
      className={cn(
        'glass pointer-events-auto absolute right-4 z-[15] flex flex-col overflow-hidden rounded-xl max-[639px]:right-3',
        sheetCoversMobile && 'max-[639px]:hidden',
        // Posisi dasar: tidak ada chatbot di peta (layer panel terbuka).
        'bottom-[calc(6rem+env(safe-area-inset-bottom))] sm:bottom-6',
        dockVisible && 'sm:bottom-[12rem]',
        dockVisible && !sheetCoversMobile && 'max-[639px]:bottom-[calc(11.75rem+env(safe-area-inset-bottom))]',
        fabVisible && 'sm:bottom-[7rem]',
        fabVisible && !sheetCoversMobile && 'max-[639px]:bottom-[calc(6.5rem+env(safe-area-inset-bottom))]'
      )}
    >
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
