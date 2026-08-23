import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from 'remotion';
import { C, F, DATA, MAP_PX } from '../data';
import { Vignette, useFade } from '../lib/ui';
import AppTopBar from './appdemo/TopBar';
import { SeismicSignatureCard, PgaDistributionCard } from './appdemo/InstrumentCards';
import { SiteLocationCard, PanelActions } from './appdemo/SiteLocationCard';
import MapPois from './appdemo/MapPois';
import { SiteMarker, DataChips, ToastNotification, ChatFab } from './appdemo/MapOverlays';

const QUERY = '-5.3971, 105.2668';

export const S3AuditFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = useFade(14, 252, 18);

  // map framing: site point lands at screen (1150, 610); slow push-in
  const z = interpolate(frame, [0, 270], [1.28, 1.42]);
  const mapX = 1150 - MAP_PX.bandarLampung.x * z;
  const mapY = 610 - MAP_PX.bandarLampung.y * z;

  const typed = Math.round(
    interpolate(frame, [26, 76], [0, QUERY.length], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );
  const caretOn = Math.floor(frame / 8) % 2 === 0;
  const pressed = frame >= 80 && frame <= 100;

  // left panel chrome entrance
  const panelIn = interpolate(frame, [2, 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ opacity: fade, backgroundColor: C.bg }}>
      {/* light basemap */}
      <Img
        src={require('../../public/img/bl-map-light.png')}
        style={{
          position: 'absolute',
          left: mapX,
          top: mapY,
          width: 2048 * z,
          height: 1280 * z,
          opacity: interpolate(frame, [0, 20], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      />
      {/* warm blend layer so the light map sits inside the mocha film */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(15,11,8,0.55) 0%, rgba(15,11,8,0.12) 22%, rgba(15,11,8,0.10) 72%, rgba(15,11,8,0.55) 100%)',
        }}
      />

      <MapPois frame={frame} />

      {/* app chrome */}
      <AppTopBar query={QUERY.slice(0, typed)} caretOn={caretOn} pressed={pressed} />

      {/* left instrument panel */}
      <div
        style={{
          position: 'absolute',
          left: 40,
          top: 108,
          width: 484,
          display: 'flex',
          flexDirection: 'column',
          gap: 13,
          opacity: panelIn,
          transform: `translateX(${(1 - panelIn) * -46}px)`,
        }}
      >
        <SeismicSignatureCard frame={frame} />
        <PgaDistributionCard frame={frame} />
        <SiteLocationCard frame={frame} />
        <PanelActions frame={frame} />
      </div>

      {/* map overlays */}
      <SiteMarker frame={frame} />
      <DataChips frame={frame} />

      {/* live readout */}
      <div
        style={{
          position: 'absolute',
          left: 556,
          bottom: 152,
          fontFamily: F.mono,
          fontSize: 22,
          color: 'rgba(240,228,204,0.75)',
          letterSpacing: '0.12em',
          background: 'rgba(18,12,7,0.65)',
          padding: '8px 16px',
          borderRadius: 8,
          opacity: interpolate(frame, [90, 104], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        LAT {DATA.bandarLampung.lat} · LON {DATA.bandarLampung.lon}
      </div>
      <div
        style={{
          position: 'absolute',
          right: 28,
          bottom: 34,
          fontFamily: F.mono,
          fontSize: 17,
          color: 'rgba(40,30,20,0.75)',
          letterSpacing: '0.08em',
        }}
      >
        © CARTO, © OSM
      </div>

      <ToastNotification frame={frame} />
      <ChatFab frame={frame} />

      <Vignette />
    </AbsoluteFill>
  );
};
