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

test('chatbot follows the Agent Dock and Chat Panel interaction contract', async () => {
  const chatbot = await source('components/panels/ChatbotFab.jsx');

  assert.match(chatbot, /data-chat-dock-state=/);
  assert.match(chatbot, /role="tablist"/);
  assert.match(chatbot, /data-chat-tab="audit"/);
  assert.match(chatbot, /data-chat-tab="sources"/);
  assert.match(chatbot, /clearConversation/);
  assert.match(chatbot, /dockState === 'idle' \? modeLabel : dockStatus/);
});

test('Agent Dock uses the SafeHouse mark with spacious contextual composition', async () => {
  const chatbot = await source('components/panels/ChatbotFab.jsx');

  assert.match(chatbot, /src="\/safe-icon\.png"/);
  assert.match(chatbot, /sm:w-\[440px\]/);
  assert.match(chatbot, /Tanyakan arti sinyal lokasi ini…/);
  assert.doesNotMatch(chatbot, /Ask about this audit|Tanya tentang audit ini/);
});

test('mobile Agent Dock keeps the SafeHouse mark visible beside the audit panel', async () => {
  const chatbot = await source('components/panels/ChatbotFab.jsx');

  assert.match(chatbot, /data-chat-dock-mark="safehouse"/);
  assert.match(chatbot, /max-\[639px\]:justify-center/);
});

test('async content surfaces use reusable layout-shaped shimmer skeletons', async () => {
  const skeleton = await source('components/ui/skeleton.jsx');
  const files = await Promise.all([
    source('App.jsx'),
    source('components/panels/LeftPanel.jsx'),
    source('components/panels/AuditDrawer.jsx'),
    source('components/panels/ChatbotFab.jsx'),
    source('components/command/CommandPalette.jsx'),
    source('components/map/DisasterLayersPanel.jsx'),
    source('components/cards/CompareSetup.jsx'),
    source('pages/SharedReport.jsx'),
  ]);

  assert.match(skeleton, /cn\(['"]shimmer/);
  assert.match(skeleton, /function SkeletonText/);
  assert.match(skeleton, /function SkeletonRows/);
  assert.ok(files.every((content) => /Skeleton/.test(content)));
  assert.match(files[2], /battleReportLoading/);
  assert.match(files[4], /SkeletonRows/);
  assert.match(files[7], /ReportSkeleton/);
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

test('light and dark themes select their matching Alidade basemaps', async () => {
  const store = await source('store/useAppStore.js');

  assert.match(store, /theme === 'light' \? 'alidade' : 'alidade-dark'/);
  assert.match(store, /baseMapStyle: baseMapStyleForTheme\(nextTheme\)/);
  assert.match(store, /baseMapStyle: baseMapStyleForTheme\(theme\)/);
});
