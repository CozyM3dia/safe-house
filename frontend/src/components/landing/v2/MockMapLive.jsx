import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useReducedMotion } from 'framer-motion';

/**
 * MockMap: peta Leaflet dengan tile Stadia Alidade Smooth Dark
 * (key VITE_STADIA_MAPS_API_KEY, sama dengan /app).
 *
 * Mode interaktif (mockup hero):
 * - Drag/pan aktif di perangkat dengan mouse (hover:hover); di touch
 *   tetap statis supaya scroll halaman tidak terganggu.
 * - Klik/tap peta -> onMapClick(lat, lon) (pin dipindah + audit demo).
 * - flyTo saat koordinat target berubah (pindah titik audit).
 * - Pin audit: core copper + halo pulse.
 *
 * Fallback: tanpa API key memakai Esri World Street Map.
 */

const STADIA_KEY = String(import.meta.env?.VITE_STADIA_MAPS_API_KEY || '').trim();

const TILE = STADIA_KEY
  ? {
      url: `https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?api_key=${encodeURIComponent(STADIA_KEY)}`,
      attribution:
        '&copy; <a href="https://stadiamaps.com/" target="_blank" rel="noopener noreferrer">Stadia Maps</a> &copy; <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener noreferrer">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
      maxZoom: 20,
    }
  : {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      attribution:
        'Tiles &copy; Esri &mdash; Source: Esri, HERE, Garmin, (c) OpenStreetMap contributors',
      maxZoom: 19,
    };

const PIN_ICON = L.divIcon({
  className: 'lp-mock-pin',
  html: '<span class="lp-mock-pin-halo"></span><span class="lp-mock-pin-core"></span>',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

export default function MockMap({ lat, lon, zoom = 15.5, interactive = false, onMapClick }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const clickRef = useRef(onMapClick);
  const reduce = useReducedMotion();

  /* Selalu simpan callback terbaru tanpa re-bind event. */
  useEffect(() => {
    clickRef.current = onMapClick;
  }, [onMapClick]);

  /* Init sekali. */
  useEffect(() => {
    const el = elRef.current;
    if (!el) return undefined;

    const canDrag = interactive && window.matchMedia && window.matchMedia('(hover: hover)').matches;

    const map = L.map(el, {
      center: [lat, lon],
      zoom,
      zoomControl: false,
      attributionControl: true,
      dragging: canDrag,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      boxZoom: false,
      keyboard: false,
      tap: false,
      zoomSnap: 0.25,
    });

    L.tileLayer(TILE.url, {
      attribution: TILE.attribution,
      maxZoom: TILE.maxZoom,
      subdomains: 'abcd',
    }).addTo(map);

    const marker = L.marker([lat, lon], { icon: PIN_ICON, interactive: false, keyboard: false }).addTo(map);
    markerRef.current = marker;
    mapRef.current = map;

    if (interactive) {
      map.on('click', (e) => {
        if (clickRef.current) clickRef.current(e.latlng.lat, e.latlng.lng);
      });
    }

    const raf = requestAnimationFrame(() => map.invalidateSize());
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Pin mengikuti titik aktif. */
  useEffect(() => {
    if (markerRef.current) markerRef.current.setLatLng([lat, lon]);
  }, [lat, lon]);

  /* Terbang ke titik aktif saat berubah. */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo([lat, lon], zoom, { duration: reduce ? 0 : 1.5, easeLinearity: 0.25 });
  }, [lat, lon, zoom, reduce]);

  return <div ref={elRef} className="lp-mock-map absolute inset-0" aria-label="Peta audit" role="img" />;
}
