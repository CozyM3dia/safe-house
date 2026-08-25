import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../src/', import.meta.url);

async function source(relativePath) {
  return readFile(new URL(relativePath, root), 'utf8');
}

test('product routes are wired and unknown paths do not silent-redirect to landing', async () => {
  const app = await source('App.jsx');

  assert.match(app, /path="\/validasi"/);
  assert.match(app, /path="\/bandingkan"/);
  assert.match(app, /path="\/pbg"/);
  assert.match(app, /path="\/pbg-checklist"/);
  assert.match(app, /NotFoundPage/);
  assert.doesNotMatch(app, /path="\*" element=\{<Navigate to="\/"/);
});

test('landing nav advertises validasi, bandingkan, and pbg', async () => {
  const landing = await source('pages/LandingPage.jsx');

  assert.match(landing, /to: '\/validasi'/);
  assert.match(landing, /to: '\/bandingkan'/);
  assert.match(landing, /to: '\/pbg'/);
});

test('index.html does not hardcode the dead safehouse.web.id origin', async () => {
  const html = await readFile(new URL('../index.html', root), 'utf8');

  assert.doesNotMatch(html, /safehouse\.web\.id/);
  assert.match(html, /__PUBLIC_SITE_URL__/);
  assert.match(html, /\/api\/og\/default\.png/);
});
