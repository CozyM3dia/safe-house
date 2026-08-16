import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const panelSource = readFileSync(
  new URL('./src/components/map/DisasterLayersPanel.jsx', import.meta.url),
  'utf8'
);
const appSource = readFileSync(
  new URL('./src/App.jsx', import.meta.url),
  'utf8'
);

test('fault legend lives with map layer controls instead of covering audit data', () => {
  assert.match(panelSource, /data-testid=["']fault-layer-legend["']/);
  assert.match(panelSource, /Sumber: PuSGeN 2024 melalui InaRISK BNPB/);
  assert.doesNotMatch(panelSource, /bukan geometri resmi/);
  assert.match(panelSource, /leftPanelOpen/);
  assert.match(panelSource, /innerWidth < 900/);
  assert.doesNotMatch(appSource, /<MapLegend\s*\/>/);
});
