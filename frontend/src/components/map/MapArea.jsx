import { useCallback, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { toast } from 'sonner';
import 'leaflet/dist/leaflet.css';
import { useAppStore } from '../../store/useAppStore';
import { MAP_TILES, DEFAULT_CENTER, DEFAULT_ZOOM } from '../../lib/constants';
import { MapMarker } from './MapMarker';
import { MapControls } from './MapControls';
import { RiskZoneOverlay } from './RiskZoneOverlay';
import { NationwideOverlays } from './NationwideOverlays';

function MapInteractionLayer() {
  const processLocation = useAppStore((s) => s.processLocation);
  const loading = useAppStore((s) => s.loading);
  const mode = useAppStore((s) => s.mode);
  const selectingBattlePin = useAppStore((s) => s.selectingBattlePin);

  useMapEvents({
    click(e) {
      if (loading) return;
      const isBattlePin = mode === 'battle' && selectingBattlePin;
      processLocation(e.latlng.lat, e.latlng.lng, isBattlePin);
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
    const key = target.lat + ',' + target.lon;
    if (last.current === key) return;
    last.current = key;
    map.flyTo([target.lat, target.lon], 15, {
      duration: 1.2,
      easeLinearity: 0.3,
    });
  }, [propertyA, propertyB, map]);

  return null;
}

function BasemapLayer() {
  const baseMapStyle = useAppStore((s) => s.baseMapStyle);
  const setBaseMapStyle = useAppStore((s) => s.setBaseMapStyle);
  const lang = useAppStore((s) => s.lang);
  const tileErrors = useRef(0);
  const fallbackTriggered = useRef(false);

  const preferredTile = MAP_TILES[baseMapStyle] || MAP_TILES.street;
  const activeTile = preferredTile.enabled === false ? MAP_TILES.street : preferredTile;

  useEffect(() => {
    tileErrors.current = 0;
    fallbackTriggered.current = false;

    if (preferredTile.enabled === false && baseMapStyle !== 'street') {
      setBaseMapStyle('street');
    }
  }, [baseMapStyle, preferredTile.enabled, setBaseMapStyle]);

  const handleTileError = useCallback(() => {
    if (activeTile.id !== 'analysis' || fallbackTriggered.current) return;

    tileErrors.current += 1;
    if (tileErrors.current < 3) return;

    fallbackTriggered.current = true;
    console.warn('Stadia Maps tile delivery failed; falling back to CARTO.');
    setBaseMapStyle('street');
    toast.warning(
      lang === 'en'
        ? 'Analysis basemap is unavailable. Switched safely to CARTO.'
        : 'Peta analisis tidak tersedia. Otomatis kembali ke CARTO.'
    );
  }, [activeTile.id, lang, setBaseMapStyle]);

  return (
    <TileLayer
      key={activeTile.id}
      url={activeTile.url}
      attribution={activeTile.attribution}
      maxZoom={activeTile.maxZoom}
      subdomains={activeTile.subdomains}
      keepBuffer={4}
      updateWhenIdle
      eventHandlers={{ tileerror: handleTileError }}
    />
  );
}

function MapProviderBadge() {
  const baseMapStyle = useAppStore((s) => s.baseMapStyle);
  const preferredTile = MAP_TILES[baseMapStyle] || MAP_TILES.street;
  const activeTile = preferredTile.enabled === false ? MAP_TILES.street : preferredTile;

  return (
    <div className="pointer-events-none absolute bottom-5 right-16 z-[15] hidden items-center gap-2 rounded-xl border border-white/10 bg-bg-surface/88 px-3 py-2 shadow-glass backdrop-blur-xl sm:flex">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-accent/40" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
      </span>
      <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-text-primary">
        {activeTile.label}
      </span>
      <span className="text-[9px] font-mono text-text-muted">· {activeTile.provider}</span>
    </div>
  );
}

export function MapArea() {
  const baseMapStyle = useAppStore((s) => s.baseMapStyle);
  const preferredTile = MAP_TILES[baseMapStyle] || MAP_TILES.street;
  const activeTile = preferredTile.enabled === false ? MAP_TILES.street : preferredTile;

  return (
    <div
      className={'absolute inset-0 z-0 map-theme-' + activeTile.tone}
      data-tour="map-area"
      data-basemap-provider={activeTile.provider}
    >
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        minZoom={4}
        maxZoom={19}
        zoomControl={false}
        attributionControl
        className="safe-map !h-full !w-full"
        preferCanvas
      >
        <BasemapLayer />
        <NationwideOverlays />
        <RiskZoneOverlay />
        <MapMarker />
        <MapInteractionLayer />
        <MapFlyToProperty />
        <MapControls />
      </MapContainer>

      <MapProviderBadge />

      {/* Subtle top gradient so TopBar reads cleanly */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-20 bg-gradient-to-b from-bg/50 to-transparent" />
    </div>
  );
}
