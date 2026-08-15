import test from 'node:test';
import assert from 'node:assert/strict';
import { getLeafletTileLayerOptions } from '../src/lib/mapLayerOptions.js';

test('omits subdomains when a tile provider does not define them', () => {
  const options = getLeafletTileLayerOptions({
    url: 'https://tiles.example.com/{z}/{x}/{y}.png',
    attribution: 'Example Tiles',
    maxZoom: 20,
  });

  assert.equal(options.url, 'https://tiles.example.com/{z}/{x}/{y}.png');
  assert.equal(options.maxZoom, 20);
  assert.equal(Object.hasOwn(options, 'subdomains'), false);
});

test('preserves subdomains for providers that use them', () => {
  const options = getLeafletTileLayerOptions({
    url: 'https://{s}.tiles.example.com/{z}/{x}/{y}.png',
    attribution: 'Example Tiles',
    maxZoom: 20,
    subdomains: 'abcd',
  });

  assert.equal(options.subdomains, 'abcd');
});
