import test from 'node:test';
import assert from 'node:assert/strict';
import { isCompactViewport } from '../src/lib/responsive.js';

test('treats phone-sized viewports as compact', () => {
  assert.equal(isCompactViewport(390), true);
  assert.equal(isCompactViewport(767), true);
  assert.equal(isCompactViewport(768), false);
  assert.equal(isCompactViewport(1280), false);
});
