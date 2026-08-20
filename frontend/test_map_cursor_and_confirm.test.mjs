import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const mapAreaSource = readFileSync(
  new URL('./src/components/map/MapArea.jsx', import.meta.url),
  'utf8'
);
const mapCursorSource = readFileSync(
  new URL('./src/components/map/MapCursor.jsx', import.meta.url),
  'utf8'
);
const dialogSource = readFileSync(
  new URL('./src/components/map/AuditConfirmDialog.jsx', import.meta.url),
  'utf8'
);
const storeSource = readFileSync(
  new URL('./src/store/useAppStore.js', import.meta.url),
  'utf8'
);
const markerSource = readFileSync(
  new URL('./src/components/map/MapMarker.jsx', import.meta.url),
  'utf8'
);

const cssSource = readFileSync(
  new URL('./src/index.css', import.meta.url),
  'utf8'
);
const tourSource = readFileSync(
  new URL('./src/components/onboarding/OnboardingTour.jsx', import.meta.url),
  'utf8'
);
const i18nSource = readFileSync(
  new URL('./src/lib/i18n.js', import.meta.url),
  'utf8'
);

test('map area integrates custom geospatial cursor and audit confirmation dialog', () => {
  assert.match(mapAreaSource, /<MapCursor\s*\/>/);
  assert.match(mapAreaSource, /<AuditConfirmDialog\s*\/>/);
  assert.match(mapAreaSource, /setPendingAudit/);
});

test('map cursor implements high-visibility HUD reticle and coordinate readout', () => {
  assert.match(mapCursorSource, /safe-map-crosshair/);
  assert.match(mapCursorSource, /border-bg\/80/);
  assert.match(mapCursorSource, /containerPointToLatLng/);
  assert.match(mapCursorSource, /pointer-events-none/);
  assert.match(cssSource, /data:image\/svg\+xml/);
  assert.match(cssSource, /fill='%230f0b08'/);
});

test('audit confirmation dialog asks user before running audit with coordinates preview and portal', () => {
  assert.match(dialogSource, /createPortal/);
  assert.match(dialogSource, /Apakah Anda yakin ingin mengaudit lokasi ini\?/);
  assert.match(dialogSource, /Are you sure you want to audit this location\?/);
  assert.match(dialogSource, /pendingAudit\.lat\.toFixed/);
  assert.match(dialogSource, /confirmPendingAudit/);
  assert.match(dialogSource, /cancelPendingAudit/);
});

test('store provides pendingAudit state management and location execution lifecycle', () => {
  assert.match(storeSource, /pendingAudit:\s*null/);
  assert.match(storeSource, /setPendingAudit:/);
  assert.match(storeSource, /confirmPendingAudit:/);
  assert.match(storeSource, /cancelPendingAudit:/);
});

test('map marker displays pending target reticle and dashed connecting line', () => {
  assert.match(markerSource, /pendingAudit/);
  assert.match(markerSource, /buildPendingIcon/);
  assert.match(markerSource, /dashArray:\s*['"]6,\s*8['"]/);
});

test('onboarding tour provides comprehensive guidance covering cursor, SNI report, and layers', () => {
  assert.match(tourSource, /tour\.cursor\.title/);
  assert.match(tourSource, /tour\.layers\.title/);
  assert.match(tourSource, /map-layers-trigger/);
  assert.match(i18nSource, /tour\.cursor\.title/);
  assert.match(i18nSource, /tour\.layers\.title/);
  assert.match(i18nSource, /SNI 1726\/8460/);
});
