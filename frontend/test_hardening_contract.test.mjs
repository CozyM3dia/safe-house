import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('map legend is owned by the layer panel instead of a floating app overlay', () => {
  const app = read('frontend/src/App.jsx');
  const panel = read('frontend/src/components/map/DisasterLayersPanel.jsx');

  assert.doesNotMatch(app, /<MapLegend\s*\/>/);
  assert.match(panel, /MapLegend/);
});

test('mobile topbar and interactive controls expose a responsive accessibility contract', () => {
  const topbar = read('frontend/src/components/panels/TopBar.jsx');
  const mapControls = read('frontend/src/components/map/MapControls.jsx');
  const layers = read('frontend/src/components/map/DisasterLayersPanel.jsx');
  const chatbot = read('frontend/src/components/panels/ChatbotFab.jsx');
  const commandPalette = read('frontend/src/components/command/CommandPalette.jsx');
  const addressCard = read('frontend/src/components/cards/AddressCard.jsx');
  const dialog = read('frontend/src/components/ui/dialog.jsx');

  assert.match(topbar, /data-testid=["']topbar["']/);
  assert.match(topbar, /min-w-0/);
  assert.match(topbar, /aria-label=/);
  assert.match(topbar, /sm:hidden/);
  assert.match(mapControls, /aria-label=\{title\}/);
  assert.match(mapControls, /min-h-\[44px\]/);
  assert.match(layers, /aria-label=/);
  assert.match(chatbot, /aria-label=/);
  assert.match(commandPalette, /t\('cmd\.clear'\)/);
  assert.match(addressCard, /aria-label=/);
  assert.match(dialog, /size-11/);
});

test('audit drawer keeps an independently clickable close affordance above the chatbot', () => {
  const drawer = read('frontend/src/components/panels/AuditDrawer.jsx');

  assert.match(drawer, /Drawer\.Description/);
  assert.match(drawer, /data-testid=["']audit-drawer-close["']/);
  assert.match(drawer, /z-\[45\]/);
});

test('startup and deployment contracts use the canonical FastAPI and SPA routes', () => {
  const startAll = read('start_all.bat');
  const dockerfile = read('Dockerfile');
  const legacyEngine = read('frontend/src/services/engine.js');
  const vercel = JSON.parse(read('frontend/vercel.json'));

  assert.match(startAll, /port 8000/i);
  assert.doesNotMatch(startAll, /port 3001/i);
  assert.doesNotMatch(startAll, /freellmapi/i);
  assert.match(dockerfile, /FROM python:3\.12/i);
  assert.match(dockerfile, /EXPOSE 8000/i);
  assert.doesNotMatch(dockerfile, /3001|npm.*server\.js/i);
  assert.doesNotMatch(legacyEngine, /localhost:3001|freellmapi/i);
  assert.ok(vercel.rewrites?.some((rewrite) => rewrite.destination === '/index.html'));
});

test('manual proxy diagnostics require an environment token instead of tracking a bearer credential', () => {
  const proxyTest = read('backend/test_freellmapi_proxy.js');

  assert.match(proxyTest, /process\.env\.FREELLMAPI_TOKEN/);
  assert.doesNotMatch(proxyTest, /Bearer\s+freellmapi-[A-Za-z0-9_-]+/i);
});

test('user-facing copy uses the canonical likuefaksi spelling and avoids internal jargon', () => {
  const userFacingFiles = [
    'frontend/src/pages/LandingPage.jsx',
    'frontend/src/components/landing/AboutSection.jsx',
    'frontend/src/components/landing/ProcessSection.jsx',
    'frontend/src/components/landing/FAQSection.jsx',
    'frontend/src/components/landing/DisclaimerSection.jsx',
    'frontend/src/components/panels/ChatbotFab.jsx',
    'frontend/src/components/panels/AuditDrawer.jsx',
    'frontend/src/pages/SharedReport.jsx',
    'frontend/src/components/command/CommandPalette.jsx',
    'frontend/src/lib/aiPrompts.js',
    'frontend/src/lib/knowledgeBase.js',
    'frontend/src/lib/pdfExport.js',
  ];
  const source = userFacingFiles.map(read).join('\n');

  assert.doesNotMatch(source, /likuifaksi/i);
  assert.doesNotMatch(source, /RAG GEO-DIAGNOSTIC/i);
  assert.doesNotMatch(source, /DATALOGGER/i);
  assert.doesNotMatch(source, /audit kognitif/i);
});
