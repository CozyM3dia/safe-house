import { useEffect, useState } from 'react';
import { GeoJSON, Pane } from 'react-leaflet';
import { toast } from 'sonner';
import { useAppStore } from '../../store/useAppStore';
import {
  FAULT_OVERLAY_PANE_NAME,
  FAULT_OVERLAY_PANE_Z_INDEX,
  FAULT_OVERLAY_STYLE,
  OFFICIAL_FAULT_GEOJSON_URL,
  OFFICIAL_FAULT_SOURCE,
} from '../../lib/faultOverlay';

const HTML_ESCAPE = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => HTML_ESCAPE[character]);
}

function bindOfficialFaultTooltip(feature, layer) {
  const properties = feature?.properties ?? {};
  const name = properties.Name || properties.Segment || 'Sesar aktif';
  const metadata = [
    properties.Segment ? `Segmen: ${properties.Segment}` : null,
    properties.Region ? `Wilayah: ${properties.Region}` : null,
    properties.Length_km != null ? `Panjang: ${properties.Length_km} km` : null,
  ].filter(Boolean).join(' · ');

  layer.bindTooltip(
    `<strong>${escapeHtml(name)}</strong><br /><span>${escapeHtml(metadata || `Geometri ${OFFICIAL_FAULT_SOURCE.dataset}`)}</span>`,
    {
      className: 'fault-overlay-tooltip',
      direction: 'top',
      sticky: true,
      opacity: 0.94,
    }
  );
}

export function FaultOverlay() {
  const enabled = useAppStore((s) => s.overlays.faults);
  const [officialGeometry, setOfficialGeometry] = useState(null);

  useEffect(() => {
    if (!enabled) return undefined;

    const controller = new AbortController();
    fetch(OFFICIAL_FAULT_GEOJSON_URL, {
      signal: controller.signal,
      headers: { Accept: 'application/geo+json' },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Official fault service returned ${response.status}`);
        const payload = await response.json();
        if (payload?.type !== 'FeatureCollection' || !Array.isArray(payload.features)) {
          throw new Error('Official fault service returned invalid GeoJSON');
        }
        return payload;
      })
      .then(setOfficialGeometry)
      .catch((error) => {
        if (error.name === 'AbortError') return;
        console.error('Official fault geometry unavailable', error);
        toast.error('Geometri resmi sesar tidak dapat dimuat', {
          description: 'Overlay tidak menampilkan garis perkiraan.',
        });
      });

    return () => controller.abort();
  }, [enabled]);

  if (!enabled) return null;

  return (
    <Pane name={FAULT_OVERLAY_PANE_NAME} style={{ zIndex: FAULT_OVERLAY_PANE_Z_INDEX }}>
      {officialGeometry && (
        <GeoJSON
          key={OFFICIAL_FAULT_SOURCE.dataset}
          data={officialGeometry}
          style={FAULT_OVERLAY_STYLE}
          onEachFeature={bindOfficialFaultTooltip}
        />
      )}
    </Pane>
  );
}
