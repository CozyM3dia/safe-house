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

test('map area integrates custom geospatial cursor and audit confirmation dialog', () => {
  assert.match(mapAreaSource, /<MapCursor\s*\/>/);
  assert.match(mapAreaSource, /<AuditConfirmDialog\s*\/>/);
  assert.match(mapAreaSource, /setPendingAudit/);
});

test('map cursor implements high-visibility HUD reticle and coordinate readout', () => {
  assert.match(mapCursorSource, /safe-map-crosshair/);
  assert.match(mapCursorSource, /animate-\[spin_12s_linear_infinite\]/);
  assert.match(mapCursorSource, /containerPointToLatLng/);
  assert.match(mapCursorSource, /pointer-events-none/);
});

test('audit confirmation dialog asks user before running audit with coordinates preview', () => {
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
