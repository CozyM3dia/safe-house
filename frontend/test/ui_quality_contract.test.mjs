import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../src/', import.meta.url);

async function source(relativePath) {
  return readFile(new URL(relativePath, root), 'utf8');
}

test('chatbot header and loading indicator use restrained product motion and color', async () => {
  const chatbot = await source('components/panels/ChatbotFab.jsx');

  assert.doesNotMatch(chatbot, /bg-clip-text/);
  assert.doesNotMatch(chatbot, /animate-bounce/);
});

test('report priority cards avoid thick side-stripe accents', async () => {
  const drawer = await source('components/panels/AuditDrawer.jsx');
  const styles = await source('index.css');

  assert.doesNotMatch(drawer, /border-l-4/);
  assert.doesNotMatch(styles, /border-left:\s*3px/);
});

test('user-facing fallback is localized and announced as an error', async () => {
  const fallback = await source('components/feedback/ErrorFallback.jsx');

  assert.match(fallback, /role="alert"/);
  assert.match(fallback, /Terjadi kesalahan/);
  assert.doesNotMatch(fallback, /Something broke|Reload App/);
});

test('production UI does not use pure-black utility surfaces', async () => {
  const files = [
    'components/feedback/ErrorFallback.jsx',
    'components/landing/CTASection.jsx',
    'components/map/AuditConfirmDialog.jsx',
    'components/map/MapCursor.jsx',
    'components/panels/AuditDrawer.jsx',
    'components/panels/ChatbotFab.jsx',
    'components/ui/dialog.jsx',
    'components/ui/gallery4.jsx',
  ];

  const contents = await Promise.all(files.map(source));
  assert.ok(contents.every((content) => !/\bbg-black(?:\/|\b)/.test(content)));
});

test('dashboard section labels stay bilingual through the translation catalog', async () => {
  const leftPanel = await source('components/panels/LeftPanel.jsx');
  const translations = await source('lib/i18n.js');

  assert.doesNotMatch(leftPanel, />Technical Metrics<|>Risk Analysis<|>Location<|>Comparison</);
  assert.match(translations, /'panel\.technicalMetrics'/);
  assert.match(translations, /'panel\.riskAnalysis'/);
  assert.match(translations, /'panel\.comparison'/);
});

test('dashboard cards do not leak hardcoded English labels in Indonesian mode', async () => {
  const address = await source('components/cards/AddressCard.jsx');
  const metrics = await source('components/cards/MetricsGrid.jsx');
  const score = await source('components/cards/SafeScoreCard.jsx');

  assert.doesNotMatch(address, />Site Location<|>Copied<|>Copy</);
  assert.doesNotMatch(metrics, /High shaking|Peak accel\.|High risk|Flood prone|Standard/);
  assert.doesNotMatch(score, />\s*Provisional\s*<|>\s*Seismic\s*<|>\s*Flood\s*<|>\s*Landslide\s*<|>\s*Subsidence\s*</);
});
