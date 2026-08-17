import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { useAppStore } from '../../store/useAppStore';
import { useT } from '../../hooks/useTranslation';
import { INARISK_HAZARDS } from '../../lib/hazardOverlay';
import { createInariskLayer } from '../../lib/inariskLayer';

/**
 * Overlay bahaya nasional InaRISK BNPB (banjir, longsor, gempa).
 * Display-only: raster resmi sebagai konteks regional. TIDAK memengaruhi
 * skor/FS/Vs30/PGA audit. Default semua OFF; gagal-muat diam-diam.
 */
function HazardLayer({ cfg }) {
  const map = useMap();
  const t = useT();
  const enabled = useAppStore((s) => s.overlays[cfg.key]);
  const opacity = useAppStore((s) => s.overlayOpacities[cfg.key] ?? 0.65);
  const setOverlayStatus = useAppStore((s) => s.setOverlayStatus);
  const setOverlaySource = useAppStore((s) => s.setOverlaySource);

  useEffect(() => {
    if (!enabled) {
      setOverlayStatus(cfg.key, 'idle');
      return undefined;
    }

    let alive = true;
    setOverlayStatus(cfg.key, 'loading');
    setOverlaySource(cfg.key, cfg.serviceCandidates?.[0]?.source || 'official');
    const layer = createInariskLayer(
      { ...cfg, attribution: t('panel.hazardAttribution') },
      opacity,
      (status, meta) => {
        if (!alive) return;
        setOverlayStatus(cfg.key, status);
        setOverlaySource(cfg.key, meta?.source || 'official');
      }
    );
    layer.addTo(map);
    return () => {
      alive = false;
      map.removeLayer(layer);
      setOverlayStatus(cfg.key, 'idle');
      setOverlaySource(cfg.key, 'official');
    };
  }, [map, cfg, enabled, opacity, setOverlayStatus, setOverlaySource, t]);

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
