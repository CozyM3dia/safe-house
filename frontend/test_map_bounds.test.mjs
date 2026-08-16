import test from 'node:test';
import assert from 'node:assert/strict';

import { DEFAULT_CENTER, DEFAULT_ZOOM, INDONESIA_MAP_BOUNDS } from './src/lib/constants.js';

test('map viewport is constrained to Indonesia', () => {
  assert.deepEqual(INDONESIA_MAP_BOUNDS, [[-11.5, 94.5], [6.5, 141.5]]);
  assert.deepEqual(DEFAULT_CENTER, [-2.5, 118]);
  assert.equal(DEFAULT_ZOOM, 5);
});
