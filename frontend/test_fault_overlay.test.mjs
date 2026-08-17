import test from 'node:test';
import assert from 'node:assert/strict';

import {
  FAULT_OVERLAY_STYLE,
  FAULT_TRACE_SEGMENTS,
  OFFICIAL_FAULT_GEOJSON_URL,
  OFFICIAL_FAULT_SOURCE,
  getFaultTraceSegments,
} from './src/lib/faultOverlay.js';

test('fault overlay covers Indonesian reference corridors without overpowering the map', () => {
  assert.ok(FAULT_TRACE_SEGMENTS.length >= 8);
  assert.ok(FAULT_TRACE_SEGMENTS.some((segment) => segment.id === 'sumatra'));
  assert.ok(FAULT_TRACE_SEGMENTS.some((segment) => segment.id === 'papua'));

  for (const segment of FAULT_TRACE_SEGMENTS) {
    assert.ok(segment.points.length >= 2);
    for (const [lat, lon] of segment.points) {
      assert.ok(lat >= -11.5 && lat <= 6.5);
      assert.ok(lon >= 94.5 && lon <= 141.5);
    }
  }

  assert.equal(FAULT_OVERLAY_STYLE.weight, 3);
  assert.equal(FAULT_OVERLAY_STYLE.opacity, 0.85);
  assert.equal(FAULT_OVERLAY_STYLE.dashArray, '6, 6');
  assert.equal(getFaultTraceSegments(), FAULT_TRACE_SEGMENTS);
});

test('official fault source points to the published PuSGeN 2024 geometry service', () => {
  assert.equal(OFFICIAL_FAULT_SOURCE.provider, 'BNPB InaRISK');
  assert.equal(OFFICIAL_FAULT_SOURCE.dataset, 'Pusgen_2024_Shallow_Crustal_v6');
  assert.match(OFFICIAL_FAULT_GEOJSON_URL, /Faults_new\/MapServer\/1\/query/);
  assert.match(OFFICIAL_FAULT_GEOJSON_URL, /f=geojson/);
  assert.match(OFFICIAL_FAULT_GEOJSON_URL, /returnGeometry=true/);
});
