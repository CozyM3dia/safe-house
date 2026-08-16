import test from 'node:test';
import assert from 'node:assert/strict';

import {
  INARISK_HAZARDS,
  tileToBbox3857,
  buildExportUrl,
} from './src/lib/hazardOverlay.js';

test('config covers exactly banjir, longsor, gempa with official services', () => {
  assert.equal(INARISK_HAZARDS.length, 3);
  const byKey = Object.fromEntries(INARISK_HAZARDS.map((h) => [h.key, h]));
  assert.ok(byKey.flood && byKey.landslide && byKey.earthquake);
  assert.match(byKey.flood.serviceUrl, /inarisk\/layer_bahaya_banjir\/MapServer$/);
  assert.match(byKey.landslide.serviceUrl, /inarisk\/layer_bahaya_tanah_longsor\/MapServer$/);
  assert.match(byKey.earthquake.serviceUrl, /inarisk\/layer_bahaya_gempabumi\/MapServer$/);
  for (const h of INARISK_HAZARDS) {
    assert.match(h.attribution, /InaRISK BNPB/);
    assert.ok(h.legend.length >= 3); // Rendah/Sedang/Tinggi
    assert.ok(h.label && h.icon);
  }
});

test('tileToBbox3857 maps the world tile (0,0,0) to full web-mercator extent', () => {
  const bbox = tileToBbox3857({ x: 0, y: 0, z: 0 }).split(',').map(Number);
  const R = 20037508.342789244; // half web-mercator span
  const [xmin, ymin, xmax, ymax] = bbox;
  assert.ok(Math.abs(xmin - -R) < 1);
  assert.ok(Math.abs(xmax - R) < 1);
  assert.ok(Math.abs(ymax - R) < 1);
  assert.ok(Math.abs(ymin - -R) < 1);
});

test('tileToBbox3857 keeps ordering xmin<xmax and ymin<ymax for an inner tile', () => {
  const [xmin, ymin, xmax, ymax] = tileToBbox3857({ x: 27, y: 33, z: 6 }).split(',').map(Number);
  assert.ok(xmin < xmax);
  assert.ok(ymin < ymax);
});

test('buildExportUrl requests transparent png in 3857', () => {
  const url = buildExportUrl('https://svc/MapServer', '1,2,3,4');
  assert.match(url, /\/export\?/);
  assert.match(url, /bbox=1,2,3,4/);
  assert.match(url, /bboxSR=3857/);
  assert.match(url, /imageSR=3857/);
  assert.match(url, /transparent=true/);
  assert.match(url, /f=image/);
});
