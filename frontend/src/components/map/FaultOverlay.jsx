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

function bindOfficialFaultTooltip(feature, layer, lang) {
  const properties = feature?.properties ?? {};
  const name = properties.Name || properties.Segment || (lang === 'en' ? 'Active fault' : 'Sesar aktif');
  const metadata = [
    properties.Segment ? `${lang === 'en' ? 'Segment' : 'Segmen'}: ${properties.Segment}` : null,
    properties.Region ? `${lang === 'en' ? 'Region' : 'Wilayah'}: ${properties.Region}` : null,
    properties.Length_km != null ? `${lang === 'en' ? 'Length' : 'Panjang'}: ${properties.Length_km} km` : null,
  ].filter(Boolean).join(' · ');

  layer.bindTooltip(
    `<strong>${escapeHtml(name)}</strong><br /><span>${escapeHtml(metadata || `${lang === 'en' ? 'Geometry' : 'Geometri'} ${OFFICIAL_FAULT_SOURCE.dataset}`)}</span>`,
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
  const lang = useAppStore((s) => s.lang);
  const setFaultLayerSource = useAppStore((s) => s.setFaultLayerSource);
  const [geometry, setGeometry] = useState(() => buildFallbackFaultGeoJSON());
  const [geometryRevision, setGeometryRevision] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setFaultLayerSource('fallback');
      return undefined;
    }

    const controller = new AbortController();
    setFaultLayerSource('loading');
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
        setGeometryRevision((revision) => revision + 1);
        setFaultLayerSource('official');
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        // Keep the local fallback geometry active so fault lines never disappear
        setGeometry(buildFallbackFaultGeoJSON());
        setGeometryRevision((revision) => revision + 1);
        setFaultLayerSource('fallback');
        console.warn('PuSGeN official geometry service offline, using national reference corridor fallback', error);
      });

    return () => {
      controller.abort();
    };
  }, [enabled, setFaultLayerSource]);

  if (!enabled) return null;

  return (
    <Pane name={FAULT_OVERLAY_PANE_NAME} style={{ zIndex: FAULT_OVERLAY_PANE_Z_INDEX }}>
      {geometry && (
        <GeoJSON
          key={`faults-${geometryRevision}`}
          data={geometry}
          style={FAULT_OVERLAY_STYLE}
          onEachFeature={(feature, layer) => bindOfficialFaultTooltip(feature, layer, lang)}
        />
      )}
    </Pane>
  );
}
