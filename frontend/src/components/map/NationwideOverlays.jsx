import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { useAppStore } from '../../store/useAppStore';
import { INARISK_HAZARDS } from '../../lib/hazardOverlay';
import { createInariskLayer } from '../../lib/inariskLayer';

/**
 * Overlay bahaya nasional InaRISK BNPB (banjir, longsor, gempa).
 * Display-only: raster resmi sebagai konteks regional. TIDAK memengaruhi
 * skor/FS/Vs30/PGA audit. Default semua OFF; gagal-muat diam-diam.
 */
function HazardLayer({ cfg }) {
  const map = useMap();
  const enabled = useAppStore((s) => s.overlays[cfg.key]);
  const opacity = useAppStore((s) => s.overlayOpacities[cfg.key] ?? 0.65);

  useEffect(() => {
    if (!enabled) return undefined;
    const layer = createInariskLayer(cfg, opacity);
    layer.addTo(map);
    return () => {
      map.removeLayer(layer);
    };
  }, [map, cfg, enabled, opacity]);

  return null;
}

export function NationwideOverlays() {
  return (
    <>
      {INARISK_HAZARDS.map((cfg) => (
        <HazardLayer key={cfg.key} cfg={cfg} />
      ))}
    </>
  );
}
