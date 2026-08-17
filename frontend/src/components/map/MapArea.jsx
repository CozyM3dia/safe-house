import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppStore } from '../../store/useAppStore';
import {
  MAP_TILES,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  INDONESIA_MAP_BOUNDS,
} from '../../lib/constants';
import { MapMarker } from './MapMarker';
import { MapControls } from './MapControls';
import { RiskZoneOverlay } from './RiskZoneOverlay';
import { NationwideOverlays } from './NationwideOverlays';
import { FaultOverlay } from './FaultOverlay';
import { MapCursor } from './MapCursor';
import { AuditConfirmDialog } from './AuditConfirmDialog';

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

export function MapArea() {
  const baseMapStyle = useAppStore((s) => s.baseMapStyle);
  const activeTile = MAP_TILES[baseMapStyle] || MAP_TILES.street;

  return (
    <div className="absolute inset-0 z-0" data-tour="map-area">
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
        <TileLayer
          url={activeTile.url}
          attribution={activeTile.attribution}
          maxZoom={activeTile.maxZoom}
          subdomains={activeTile.subdomains || 'abc'}
        />

        <NationwideOverlays />
        <FaultOverlay />
        <RiskZoneOverlay />
        <MapMarker />
        <MapInteractionLayer />
        <MapFlyToProperty />
        <MapControls />
        <MapCursor />
      </MapContainer>

      {/* Audit Click Confirmation Dialog */}
      <AuditConfirmDialog />

      {/* Subtle top gradient so TopBar reads cleanly */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-20 bg-gradient-to-b from-bg/50 to-transparent" />
    </div>
  );
}
