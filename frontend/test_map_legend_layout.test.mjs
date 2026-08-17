import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const panelSource = readFileSync(
  new URL('./src/components/map/DisasterLayersPanel.jsx', import.meta.url),
  'utf8'
);
const legendSource = readFileSync(
  new URL('./src/components/map/MapLegend.jsx', import.meta.url),
  'utf8'
);
const appSource = readFileSync(
  new URL('./src/App.jsx', import.meta.url),
  'utf8'
);

test('fault legend lives with map layer controls instead of covering audit data', () => {
  assert.doesNotMatch(panelSource, /data-testid=["']fault-layer-legend["']/);
  assert.match(legendSource, /data-testid=["']fault-layer-legend["']/);
  assert.match(legendSource, /panel\.faultSource/);
  assert.doesNotMatch(panelSource, /bukan geometri resmi/);
  assert.match(panelSource, /leftPanelOpen/);
  assert.match(panelSource, /innerWidth < 900/);
  assert.doesNotMatch(appSource, /<MapLegend\s*\/>/);
});
