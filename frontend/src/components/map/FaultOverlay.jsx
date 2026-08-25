import { useEffect, useMemo, useRef, useState, Fragment } from 'react';
import L from 'leaflet';
import { GeoJSON, Pane, useMap, useMapEvents } from 'react-leaflet';
import { useAppStore } from '../../store/useAppStore';
import {
  FAULT_OVERLAY_PANE_NAME,
  FAULT_OVERLAY_PANE_Z_INDEX,
  FAULT_TRACE_SEGMENTS,
  casingStyle,
  buildFaultQueryUrl,
  fallbackCoreStyle,
  haloStyle,
  officialCoreStyle,
} from '../../lib/faultOverlay';

const HTML_ESCAPE = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => HTML_ESCAPE[character]);
}

/** Cache modul — toggle layer tidak memicu query ArcGIS ulang. */
let officialCache = null;

function buildFallbackFaultGeoJSON() {
  return {
    type: 'FeatureCollection',
    features: FAULT_TRACE_SEGMENTS.map((segment) => ({
      type: 'Feature',
      properties: {
        Name: segment.label,
        Segment: segment.names.slice(0, 3).join(', ') + (segment.names.length > 3 ? '…' : ''),
        Region: 'Indonesia',
        __official: false,
      },
      geometry: {
        type: 'LineString',
        coordinates: segment.points.map(([lat, lon]) => [lon, lat]),
      },
    })),
  };
}

/** Pengamat zoom — bobot garis berubah per bucket, tanpa remount layer. */
function ZoomWatcher({ onZoom }) {
  useMapEvents({ zoomend: (event) => onZoom(event.target.getZoom()) });
  return null;
}

function faultTooltipHtml(feature, lang, isOfficial) {
  const properties = feature?.properties ?? {};
  const name = properties.Name
    || properties.Segment
    || (lang === 'en' ? 'Active fault' : 'Sesar aktif');

  const rows = [
    properties.Mmax != null && { label: lang === 'en' ? 'Mmax' : 'Maks', value: `${Number(properties.Mmax).toFixed(1)} Mw` },
    properties.Sliprate_m != null && { label: lang === 'en' ? 'Slip rate' : 'Laju slip', value: `${Number(properties.Sliprate_m).toFixed(1)} mm/yr` },
    properties.Length_km != null && { label: lang === 'en' ? 'Length' : 'Panjang', value: `${Number(properties.Length_km).toFixed(0)} km` },
    properties.Type && { label: lang === 'en' ? 'Type' : 'Tipe', value: String(properties.Type) },
    properties.Region && { label: lang === 'en' ? 'Region' : 'Wilayah', value: String(properties.Region) },
  ].filter(Boolean);

  const tag = isOfficial
    ? 'PUSGEN 2024 · ' + (lang === 'en' ? 'ACTIVE FAULT' : 'SESAR AKTIF')
    : lang === 'en' ? 'LOCAL REFERENCE · NOT OFFICIAL GEOMETRY' : 'REFERENSI LOKAL · BUKAN GEOMETRI RESMI';

  const rowsHtml = rows.length
    ? `<div class="ftt-rows">${rows.map((row) => `
        <div class="ftt-row">
          <dt>${escapeHtml(row.label)}</dt>
          <dd>${escapeHtml(row.value)}</dd>
        </div>`).join('')}</div>`
    : '';

  return `
    <div class="ftt ${isOfficial ? '' : 'ftt-fallback'}">
      <span class="ftt-corner ftt-tl" aria-hidden="true"></span>
      <span class="ftt-corner ftt-tr" aria-hidden="true"></span>
      <span class="ftt-corner ftt-bl" aria-hidden="true"></span>
      <span class="ftt-corner ftt-br" aria-hidden="true"></span>
      <p class="ftt-tag">${escapeHtml(tag)}</p>
      <h4 class="ftt-name">${escapeHtml(name)}</h4>
      ${rowsHtml}
    </div>`;
}

function bindFaultTooltip(feature, layer, lang) {
  const isOfficial = feature?.properties?.__official !== false;
  // Sentuh: sticky tooltip "menempel" saat pan dan mouseover tanpa
  // mouseout membekukan hover — konfigurasi pointer dan sentuh dipisah.
  layer.bindTooltip(faultTooltipHtml(feature, lang, isOfficial), {
    className: 'fault-tooltip',
    direction: 'top',
    sticky: !L.Browser.touch,
    keepInView: true,
    opacity: 1,
  });
}

/**
 * Lintasan hit — geometri sama, stroke transparan 20px: target sentuh
 * memadai tanpa mengubah visual. Hover/kelas is-hover diteruskan ke
 * lintasan inti yang seurut (iterasi data identik).
 */
function bindHitLayer(feature, layer, lang, getCoreLayer) {
  bindFaultTooltip(feature, layer, lang);

  if (L.Browser.touch) return;

  layer.on('mouseover', () => {
    getCoreLayer()?.getElement()?.classList.add('is-hover');
  });
  layer.on('mouseout', () => {
    getCoreLayer()?.getElement()?.classList.remove('is-hover');
  });
}

export function FaultOverlay() {
  const enabled = useAppStore((s) => s.overlays.faults);
  const lang = useAppStore((s) => s.lang);
  const theme = useAppStore((s) => s.theme);
  // Opasitas dari panel layer — dipetakan ke penekanan inti, bukan
  // diterapkan mentah (default 0.34 store dituning untuk gaya lama).
  const storeOpacity = useAppStore((s) => s.overlayOpacities.faults ?? 0.34);
  const setFaultLayerSource = useAppStore((s) => s.setFaultLayerSource);

  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());
  const [geometry, setGeometry] = useState(null);
  const haloRef = useRef(null);
  const casingRef = useRef(null);
  const coreRef = useRef(null);
  const hitRef = useRef(null);
  // Pasangan lintasan core↔hit: iterasi data identik dan seurut, jadi
  // indeks menyapu. Dibuat ulang saat geometri berganti (remount Fragment).
  const pairing = useMemo(() => ({ core: [], hitCount: 0 }), [geometry]);

  // Satu renderer SVG bersama untuk ketiga lintasan: satu akar SVG,
  // urutan gambar = urutan tambah (halo → casing → core), tanpa akar
  // yatim yang menumpuk di pane saat toggle.
  const faultRenderer = useMemo(() => L.svg({ padding: 0.5 }), [map]);

  const isOfficialSource = Boolean(officialCache);
  const coreStyleFn = useMemo(() => (
    isOfficialSource ? officialCoreStyle : fallbackCoreStyle
  ), [isOfficialSource]);

  // Muat geometri: cache modul → instan; ArcGIS dipaginasi sampai habis.
  useEffect(() => {
    if (!enabled) return undefined;

    if (officialCache) {
      setGeometry((current) => current ?? officialCache);
      setFaultLayerSource('official');
      return undefined;
    }

    const controller = new AbortController();
    setFaultLayerSource('loading');

    (async () => {
      try {
        let offset = 0;
        let features = [];
        let exceeded = true;
        let pages = 0;
        let truncated = false;
        while (exceeded && pages < 10) {
          const response = await fetch(buildFaultQueryUrl(offset), {
            signal: controller.signal,
            headers: { Accept: 'application/geo+json' },
          });
          if (!response.ok) throw new Error(`Official fault service returned ${response.status}`);
          const payload = await response.json();
          if (payload?.type !== 'FeatureCollection' || !Array.isArray(payload.features)) {
            throw new Error('Official fault service returned invalid GeoJSON');
          }
          if (!payload.features.length) break;
          // Guard duplikasi: server yang mengabaikan resultOffset mengembalikan
          // halaman identik — berhenti, jangan menumpuk fitur ganda. Bandingkan
          // id hanya bila ada; tanpa id, undefined === undefined salah picu.
          if (
            pages > 0
            && payload.features[0]?.id != null
            && features.some((f) => f.id === payload.features[0].id)
          ) break;
          features = features.concat(payload.features);
          exceeded = payload.exceededTransferLimit === true
            || payload.properties?.exceededTransferLimit === true;
          offset += payload.features.length;
          pages += 1;
        }
        if (exceeded && pages >= 10) {
          // Cakupan terpotong tidak boleh di-cache sebagai "resmi utuh".
          truncated = true;
        }
        if (truncated || !features.length) {
          throw new Error('Official fault service returned truncated or empty coverage');
        }

        officialCache = { type: 'FeatureCollection', features };
        setGeometry(officialCache);
        setFaultLayerSource('official');
      } catch (error) {
        if (error.name === 'AbortError') return;
        // Koridor referensi lokal tetap aktif — garis sesar tidak pernah hilang.
        setGeometry((current) => current ?? buildFallbackFaultGeoJSON());
        setFaultLayerSource('fallback');
        console.warn('PuSGeN official geometry service offline, using national reference corridor fallback', error);
      }
    })();

    return () => controller.abort();
  }, [enabled, setFaultLayerSource]);

  // Restyle imperatif — zoom, opasitas, dan tema berganti tanpa remount.
  // Penekanan dihitung terhadap basis opasitas tiap lintasan sehingga
  // default store (0.34) tetap terbaca penuh, dan 1.0 = maksimum.
  useEffect(() => {
    const emphasis = 0.55 + 0.45 * storeOpacity;
    const restyle = (ref, styleFn) => {
      const group = ref.current;
      if (!group) return;
      group.eachLayer((layer) => {
        const style = styleFn(zoom, layer.feature?.properties);
        if (style.opacity != null && style.weight > 0) {
          style.opacity = Math.min(1, style.opacity * emphasis);
        }
        layer.setStyle(style);
      });
    };
    // Halo: alpha sudah tertanam di warna var — biarkan tanpa penekanan.
    const haloGroup = haloRef.current;
    haloGroup?.eachLayer((layer) => layer.setStyle(haloStyle(zoom)));
    restyle(casingRef, () => casingStyle(zoom));
    restyle(coreRef, (z, properties) => (
      properties?.__official === false
        ? fallbackCoreStyle(z)
        : coreStyleFn(z, properties?.Sliprate_m)
    ));
  }, [zoom, storeOpacity, theme, geometry, coreStyleFn, enabled]);

  // Ganti bahasa: perbarui isi tooltip yang terikat pada lintasan hit —
  // tanpa remount.
  useEffect(() => {
    const group = hitRef.current;
    if (!group) return;
    group.eachLayer((layer) => {
      const feature = layer.feature;
      if (!feature) return;
      layer.setTooltipContent(
        faultTooltipHtml(feature, lang, feature.properties?.__official !== false)
      );
    });
  }, [lang, geometry]);

  // Renderer bersama mati bersama komponen — tanpa ini tiap unmount
  // menyisakan satu akar <svg> kosong di pane yang persisten.
  useEffect(() => () => {
    map.removeLayer(faultRenderer);
  }, [map, faultRenderer]);

  if (!enabled) {
    return (
      <Pane name={FAULT_OVERLAY_PANE_NAME} style={{ zIndex: FAULT_OVERLAY_PANE_Z_INDEX }} />
    );
  }

  return (
    <Pane
      name={FAULT_OVERLAY_PANE_NAME}
      style={{ zIndex: FAULT_OVERLAY_PANE_Z_INDEX }}
      className="fault-pane"
    >
      <ZoomWatcher onZoom={(nextZoom) => setZoom(nextZoom)} />
      {geometry && (
        // react-leaflet GeoJSON mengabaikan perubahan prop `data` — identitas
        // sumber (fallback → resmi) masuk key supaya layer benar dibangun ulang
        // tepat sekali saat geometri resmi tiba.
        <Fragment key={geometry === officialCache ? 'official' : 'fallback'}>
          {/* Lintasan 1 — halo: ambient, paling bawah, non-interaktif */}
          <GeoJSON
            ref={haloRef}
            data={geometry}
            interactive={false}
            renderer={faultRenderer}
            style={() => haloStyle(zoom)}
          />
          {/* Lintasan 2 — casing: pemisah terhadap raster & jalan tile */}
          <GeoJSON
            ref={casingRef}
            data={geometry}
            interactive={false}
            renderer={faultRenderer}
            style={() => casingStyle(zoom)}
          />
          {/* Lintasan 3 — core: visual, non-interaktif (tap diserahkan ke
              lintasan hit yang jauh lebih lebar) */}
          <GeoJSON
            ref={coreRef}
            data={geometry}
            interactive={false}
            renderer={faultRenderer}
            style={(feature) => (
              feature?.properties?.__official === false
                ? fallbackCoreStyle(zoom)
                : coreStyleFn(zoom, feature?.properties?.Sliprate_m)
            )}
            onEachFeature={(feature, layer) => pairing.core.push(layer)}
          />
          {/* Lintasan 4 — hit: transparan 20px, membawa tooltip + hover */}
          <GeoJSON
            ref={hitRef}
            data={geometry}
            renderer={faultRenderer}
            style={() => ({ weight: 20, opacity: 0 })}
            onEachFeature={(feature, layer) => {
              const index = pairing.hitCount;
              pairing.hitCount += 1;
              bindHitLayer(feature, layer, lang, () => pairing.core[index]);
            }}
          />
        </Fragment>
      )}
    </Pane>
  );
}
