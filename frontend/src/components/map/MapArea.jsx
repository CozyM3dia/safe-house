import { useEffect, useRef } from 'react';
import { MapContainer, Pane, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppStore } from '../../store/useAppStore';
import {
  MAP_TILES,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  INDONESIA_MAP_BOUNDS,
  STADIA_MAPS_ENABLED,
} from '../../lib/constants';
import { MapMarker } from './MapMarker';
import { MapControls } from './MapControls';
import { RiskZoneOverlay } from './RiskZoneOverlay';
import { NationwideOverlays } from './NationwideOverlays';
import { FaultOverlay } from './FaultOverlay';
import { MapCursor } from './MapCursor';
import { AuditConfirmDialog } from './AuditConfirmDialog';
import { CompareMapBanner } from './CompareMapBanner';
import { subscribeToViewport } from '../../lib/responsive';

function MapInteractionLayer() {
  const loading = useAppStore((s) => s.loading);
  const setPendingAudit = useAppStore((s) => s.setPendingAudit);
  const mode = useAppStore((s) => s.mode);
  const selectingBattlePin = useAppStore((s) => s.selectingBattlePin);

  useMapEvents({
    click(e) {
      if (loading) return;
      const isBattlePin = mode === 'battle' && selectingBattlePin;
      // Prompt confirmation before executing audit
      setPendingAudit({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        isBattlePin,
      });
    },
  });
  return null;
}

function MapFlyToProperty() {
  const map = useMap();
  const propertyA = useAppStore((s) => s.propertyA);
  const propertyB = useAppStore((s) => s.propertyB);
  const last = useRef(null);

  useEffect(() => {
    const target = propertyB || propertyA;
    if (target?.lat == null || target?.lon == null) return;
    const key = `${target.lat},${target.lon}`;
    if (last.current === key) return;
    last.current = key;
    map.flyTo([target.lat, target.lon], 15, {
      duration: 1.2,
      easeLinearity: 0.3,
    });
  }, [propertyA, propertyB, map]);

  return null;
}

function MapViewportSync() {
  const map = useMap();

  useEffect(() => {
    const invalidate = () => {
      window.requestAnimationFrame(() => map.invalidateSize({ animate: false, pan: false }));
    };
    const unsubscribe = subscribeToViewport(invalidate);
    const container = map.getContainer();
    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(invalidate)
      : null;
    observer?.observe(container);
    invalidate();

    return () => {
      unsubscribe();
      observer?.disconnect();
    };
  }, [map]);

  return null;
}

export function MapArea() {
  const baseMapStyle = useAppStore((s) => s.baseMapStyle);
  const requestedTile = MAP_TILES[baseMapStyle] || MAP_TILES.street;
  const stadiaUnavailable = requestedTile.requiresApiKey && !STADIA_MAPS_ENABLED;
  const activeTile = stadiaUnavailable ? MAP_TILES.street : requestedTile;
  const activeStyle = stadiaUnavailable ? 'street' : baseMapStyle;

  return (
    <div
      className="safe-map absolute inset-0 z-0"
      data-basemap-style={activeStyle}
      data-tour="map-area"
    >
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        minZoom={5}
        maxZoom={19}
        maxBounds={INDONESIA_MAP_BOUNDS}
        maxBoundsViscosity={1}
        worldCopyJump={false}
        zoomControl={false}
        attributionControl={true}
        className="!h-full !w-full safe-map-crosshair"
        preferCanvas
      >
        <Pane name="basemap" style={{ zIndex: 200 }}>
          <TileLayer
            url={activeTile.url}
            attribution={activeTile.attribution}
            maxZoom={activeTile.maxZoom}
            subdomains={activeTile.subdomains || 'abc'}
            className="safe-map-tiles"
          />
        </Pane>

        <Pane name="hazardOverlay" style={{ zIndex: 350, pointerEvents: 'none' }} />

        <NationwideOverlays />
        <FaultOverlay />
        <RiskZoneOverlay />
        <MapMarker />
        <MapInteractionLayer />
        <MapFlyToProperty />
        <MapViewportSync />
        <MapControls />
        <MapCursor />
      </MapContainer>

      {/* Penanda mode bandingkan + instruksi slot tujuan */}
      <CompareMapBanner />

      {/* Audit Click Confirmation Dialog */}
      <AuditConfirmDialog />

      {/* Light edge treatment keeps the map legible beneath the floating chrome. */}
      <div className="safe-map-edge pointer-events-none absolute inset-0 z-[5]" />
    </div>
  );
}
