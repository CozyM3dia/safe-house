import { useEffect, useState } from 'react';
import { GeoJSON, Pane } from 'react-leaflet';
import { useAppStore } from '../../store/useAppStore';
import {
  FAULT_OVERLAY_PANE_NAME,
  FAULT_OVERLAY_PANE_Z_INDEX,
  FAULT_OVERLAY_STYLE,
  FAULT_TRACE_SEGMENTS,
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

function buildFallbackFaultGeoJSON() {
  return {
    type: 'FeatureCollection',
    features: FAULT_TRACE_SEGMENTS.map((segment) => ({
      type: 'Feature',
      properties: {
        Name: segment.label,
        Segment: segment.names.slice(0, 3).join(', ') + (segment.names.length > 3 ? '…' : ''),
        Region: 'Indonesia',
      },
      geometry: {
        type: 'LineString',
        coordinates: segment.points.map(([lat, lon]) => [lon, lat]),
      },
    })),
  };
}

export function FaultOverlay() {
  const enabled = useAppStore((s) => s.overlays.faults);
  const [geometry, setGeometry] = useState(() => buildFallbackFaultGeoJSON());

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
      .then((data) => {
        setGeometry(data);
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        // Keep the local fallback geometry active so fault lines never disappear
        console.warn('PuSGeN official geometry service offline, using national reference corridor fallback', error);
      });

    return () => controller.abort();
  }, [enabled]);

  if (!enabled) return null;

  return (
    <Pane name={FAULT_OVERLAY_PANE_NAME} style={{ zIndex: FAULT_OVERLAY_PANE_Z_INDEX }}>
      {geometry && (
        <GeoJSON
          key={geometry.features?.length || 'faults'}
          data={geometry}
          style={FAULT_OVERLAY_STYLE}
          onEachFeature={bindOfficialFaultTooltip}
        />
      )}
    </Pane>
  );
}
