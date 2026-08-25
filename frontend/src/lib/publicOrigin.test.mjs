import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('publicOrigin rejects the unresolved web.id host in source', async () => {
  const source = await readFile(new URL('./publicOrigin.js', import.meta.url), 'utf8');

  assert.match(source, /safehouse-pull\.emergent\.host/);
  assert.match(source, /safehouse\.web\.id/);
  assert.match(source, /UNRESOLVED_HOSTS/);
});
