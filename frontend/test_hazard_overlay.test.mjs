import test from 'node:test';
import assert from 'node:assert/strict';

import {
  INARISK_HAZARDS,
  tileToBbox3857,
  buildExportUrl,
  indexToRainbow,
  buildRainbowLut,
  rainbowGradientCss,
  HAZARD_RAMP_STOPS,
} from './src/lib/hazardOverlay.js';

const dominant = ([r, g, b]) => (r >= g && r >= b ? 'r' : g >= r && g >= b ? 'g' : 'b');

test('config covers exactly banjir, longsor, gempa with official services', () => {
  assert.equal(INARISK_HAZARDS.length, 3);
  const byKey = Object.fromEntries(INARISK_HAZARDS.map((h) => [h.key, h]));
  assert.ok(byKey.flood && byKey.landslide && byKey.earthquake);
  assert.match(byKey.flood.serviceUrl, /inarisk\/INDEKS_BAHAYA_BANJIR\/ImageServer$/);
  assert.match(byKey.landslide.serviceUrl, /inarisk\/INDEKS_BAHAYA_TANAHLONGSOR\/ImageServer$/);
  assert.match(byKey.earthquake.serviceUrl, /inarisk\/INDEKS_BAHAYA_GEMPABUMI\/ImageServer$/);
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

test('buildExportUrl requests a png32 image export in 3857 via exportImage', () => {
  const url = buildExportUrl('https://svc/ImageServer', '1,2,3,4');
  assert.match(url, /\/exportImage\?/);
  assert.match(url, /bbox=1,2,3,4/);
  assert.match(url, /bboxSR=3857/);
  assert.match(url, /imageSR=3857/);
  assert.match(url, /format=png32/);
  assert.match(url, /f=image/);
});

test('indexToRainbow ramps green (low) → yellow (mid) → red (high)', () => {
  assert.equal(dominant(indexToRainbow(0)), 'g'); // rendah = hijau
  const [r, g, b] = indexToRainbow(0.5); // sedang = kuning (r & g tinggi, b rendah)
  assert.ok(r > 150 && g > 150 && b < 100);
  assert.equal(dominant(indexToRainbow(1)), 'r'); // tinggi = merah
  // clamp di luar rentang
  assert.deepEqual(indexToRainbow(-1), indexToRainbow(0));
  assert.deepEqual(indexToRainbow(2), indexToRainbow(1));
});

test('buildRainbowLut is a 256-entry RGB table matching the ramp ends', () => {
  const lut = buildRainbowLut();
  assert.equal(lut.length, 256 * 3);
  assert.deepEqual([lut[0], lut[1], lut[2]], indexToRainbow(0)); // biru
  assert.deepEqual([lut[765], lut[766], lut[767]], indexToRainbow(1)); // merah
});

test('rainbowGradientCss produces a left→right css gradient; stops sync with raster', () => {
  const css = rainbowGradientCss(4);
  assert.match(css, /^linear-gradient\(to right,/);
  assert.match(css, /rgb\(\d+,\d+,\d+\) 0%/);
  assert.match(css, /rgb\(\d+,\d+,\d+\) 100%/);
  assert.equal(HAZARD_RAMP_STOPS.length, 3);
  assert.deepEqual(HAZARD_RAMP_STOPS.map((s) => s.label), ['Rendah', 'Sedang', 'Tinggi']);
});
