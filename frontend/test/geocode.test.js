import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPhotonParams } from '../src/lib/geocode.js';

test('uses a Photon-supported language value for location search', () => {
  assert.deepEqual(buildPhotonParams('  Jakarta  '), {
    q: 'Jakarta',
    limit: 12,
    lang: 'default',
  });
});
