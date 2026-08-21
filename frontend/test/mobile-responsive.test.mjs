import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import puppeteer from 'puppeteer';

const port = Number(process.env.MOBILE_TEST_PORT || 4175);
const baseUrl = process.env.MOBILE_TEST_URL || `http://127.0.0.1:${port}`;
const startedServer = !process.env.MOBILE_TEST_URL;
let server;

const viewports = {
  phone: { width: 390, height: 844, isMobile: true },
  phoneNarrow: { width: 320, height: 568, isMobile: true },
  phone360: { width: 360, height: 800, isMobile: true },
  phone375: { width: 375, height: 812, isMobile: true },
  phone412: { width: 412, height: 915, isMobile: true },
  phone430: { width: 430, height: 932, isMobile: true },
  phoneLandscape: { width: 844, height: 390, isMobile: true },
  tablet: { width: 768, height: 1024, isMobile: true },
  desktopSmall: { width: 1024, height: 768, isMobile: false },
  desktopWide: { width: 1366, height: 768, isMobile: false },
  desktop: { width: 1440, height: 900, isMobile: false },
};

const auditFixture = {
  id: 'responsive-fixture',
  address: 'Jalan Geoteknik Panjang Sekali Nomor 123, Kecamatan Sukarame, Kota Bandar Lampung, Provinsi Lampung, Indonesia',
  lat: -5.3971,
  lon: 105.2668,
  elevation: 48,
  safe_score: 71,
  audit_status: 'valid',
  geotech: {
    vs30: 278,
    site_class: 'SD',
    fs: 1.34,
    pga_surface: 0.31,
    pga: 0.31,
    fa: 1.12,
    status: 'Aman',
    nearest_fault: { name: 'Sesar Sumatra', distance_km: 18.4 },
  },
  hazard: {
    flood_label: 'Risiko Sedang',
    flood_known: true,
    tsunami: 'Rendah',
  },
  data_quality: {
    coverage_status: 'complete_with_estimates',
    mode: 'best_available',
    fields: {
      location: { status: 'official' },
      soil: { status: 'model' },
      seismic: { status: 'official' },
      flood: { status: 'reference' },
    },
    estimated_fields: ['soil'],
  },
  sources_failed: [],
  aiReport: {
    reportLoading: false,
    detailedReport: '# Ringkasan Audit\n\n' +
      'Alamat dengan nama yang panjang harus tetap membungkus dengan aman.\n\n' +
      '| Parameter | Nilai | Sumber | Catatan |\n| --- | --- | --- | --- |\n' +
      '| Vs30 | 278 m/s | Model | SD |\n| PGA | 0.31 g | PuSGeN | Terukur |',
  },
};

async function waitForServer(url) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Vite is still starting.
    }
    await delay(250);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function visibleBounds(page, selectors) {
  return page.evaluate((items) => {
    const visible = (element) => {
      if (!element) return false;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    const result = {};
    for (const selector of items) {
      const element = document.querySelector(selector);
      if (!visible(element)) continue;
      const rect = element.getBoundingClientRect();
      result[selector] = {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
      };
    }
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
      surfaces: result,
    };
  }, selectors);
}

async function assertResponsive(page, label, selectors = []) {
  const snapshot = await visibleBounds(page, selectors);
  assert.ok(
    snapshot.scrollWidth <= snapshot.width + 1,
    `${label}: document overflow ${snapshot.scrollWidth}px > ${snapshot.width}px`,
  );
  for (const [selector, rect] of Object.entries(snapshot.surfaces)) {
    assert.ok(rect.left >= -1, `${label}: ${selector} is clipped on the left`);
    assert.ok(rect.right <= snapshot.width + 1, `${label}: ${selector} is clipped on the right`);
    assert.ok(rect.top >= -1, `${label}: ${selector} is clipped on top`);
    assert.ok(rect.bottom <= snapshot.height + 1, `${label}: ${selector} is clipped on bottom`);
  }
  return snapshot;
}

async function assertTouchTarget(page, selector, label) {
  const size = await page.$eval(selector, (element) => {
    const rect = element.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  });
  assert.ok(size.width >= 40 && size.height >= 40, `${label}: touch target is ${size.width}x${size.height}`);
}

async function assertInternalBounds(page, label, selectors) {
  const results = await page.evaluate((items) => items.map((selector) => {
    const element = document.querySelector(selector);
    if (!element) return { selector, missing: true };
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return {
      selector,
      visible: style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0,
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
      left: rect.left,
      right: rect.right,
    };
  }), selectors);

  for (const item of results) {
    if (item.missing || !item.visible) continue;
    assert.ok(item.scrollWidth <= item.clientWidth + 1, `${label}: ${item.selector} has internal horizontal overflow (${item.scrollWidth} > ${item.clientWidth})`);
    assert.ok(item.left >= -1 && item.right <= (await page.evaluate(() => window.innerWidth)) + 1, `${label}: ${item.selector} extends beyond the viewport`);
  }
}

async function assertVisibleTouchTargets(page, rootSelector, label) {
  const targets = await page.$eval(rootSelector, (root) => [...root.querySelectorAll('button, [role="button"]')]
    .filter((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    })
    .map((element) => {
      const rect = element.getBoundingClientRect();
      return { label: element.getAttribute('aria-label') || element.textContent?.trim().slice(0, 30), width: rect.width, height: rect.height };
    }));
  for (const target of targets) {
    assert.ok(target.width >= 40 && target.height >= 40, `${label}: ${target.label || 'control'} is ${target.width}x${target.height}`);
  }
}

async function assertBasemapVisible(page, label) {
  await page.waitForFunction(() => [...document.querySelectorAll('.offline-basemap .leaflet-tile, .safe-map-tiles .leaflet-tile')].some((tile) => {
    const style = getComputedStyle(tile);
    const rect = tile.getBoundingClientRect();
    return style.visibility !== 'hidden' && style.display !== 'none' && rect.right > 0 && rect.bottom > 0 && rect.left < innerWidth && rect.top < innerHeight;
  }), { timeout: 5000 });
  const result = await page.evaluate(() => {
    const tiles = [...document.querySelectorAll('.offline-basemap .leaflet-tile, .safe-map-tiles .leaflet-tile')];
    const visible = tiles.filter((tile) => {
      const style = getComputedStyle(tile);
      const rect = tile.getBoundingClientRect();
      return style.visibility !== 'hidden' && style.display !== 'none' && rect.right > 0 && rect.bottom > 0 && rect.left < innerWidth && rect.top < innerHeight;
    });
    return { total: tiles.length, visible: visible.length };
  });
  assert.ok(result.total > 0 && result.visible > 0, `${label}: offline basemap tiles are not visible`);
}

async function assertNotOverlapping(page, firstSelector, secondSelector, label) {
  const overlap = await page.evaluate(([firstSelectorArg, secondSelectorArg]) => {
    const first = document.querySelector(firstSelectorArg);
    const second = document.querySelector(secondSelectorArg);
    if (!first || !second) return false;
    const a = first.getBoundingClientRect();
    const b = second.getBoundingClientRect();
    return a.right > b.left && a.left < b.right && a.bottom > b.top && a.top < b.bottom;
  }, [firstSelector, secondSelector]);
  assert.equal(overlap, false, `${label}: surfaces overlap`);
}

async function setStore(page, patch) {
  await page.evaluate((next) => {
    window.useAppStore.setState(next);
  }, patch);
  await delay(750);
}

async function goto(page, path, viewport) {
  await page.setViewport(viewport);
  await page.goto(`${baseUrl}${path}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelector('#root')?.children.length > 0);
  await delay(1400);
}

async function run() {
  if (startedServer) {
    server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port)], {
      cwd: process.cwd(),
      stdio: 'ignore',
    });
  }
  await waitForServer(`${baseUrl}/`);

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  const browserErrors = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    // Berkas ini menguji tata letak responsif, dan pemeriksaan di bawah ada
    // untuk menangkap galat aplikasi. Dua jenis pesan berikut bukan itu:
    // keduanya catatan lapis jaringan milik browser yang tidak bisa dibungkam
    // dari sisi kode, dan keduanya hanya mencerminkan apakah backend kebetulan
    // berjalan di origin yang diizinkan.
    //
    //   - "Failed to load resource: …" — suite ini sendiri sengaja membuka
    //     /laporan/missing-responsive-report supaya API menjawab 404.
    //   - "blocked by CORS policy" — vite yang dijalankan suite memakai origin
    //     127.0.0.1:4175, yang tidak ada di daftar CORS backend. Daftar itu
    //     sengaja sempit karena respons audit memuat alamat pengguna, jadi
    //     yang menyesuaikan adalah tes, bukan batas keamanannya.
    //
    // `pageerror` dan console.error dari aplikasi tetap dicatat.
    const text = message.text();
    const isNetworkNotice =
      text.startsWith('Failed to load resource:') ||
      (text.startsWith('Access to XMLHttpRequest at') && text.includes('blocked by CORS policy'));
    if (isNetworkNotice) return;
    browserErrors.push(`console: ${text}`);
  });

  try {
    await goto(page, '/', viewports.phone);
    await page.waitForFunction(() => document.querySelector('header')?.getBoundingClientRect().top >= -1);
    await assertResponsive(page, 'landing 390', ['header', 'h1']);
    await assertTouchTarget(page, 'header button[aria-label="Open navigation"]', 'landing mobile navigation');
    await page.click('header button[aria-label="Open navigation"]');
    await page.waitForSelector('header button[aria-label="Close navigation"]');
    await assertResponsive(page, 'landing mobile menu', ['header']);

    for (const [label, viewport] of Object.entries({
      phoneNarrow: viewports.phoneNarrow,
      phone360: viewports.phone360,
      phone375: viewports.phone375,
      phone: viewports.phone,
      phone412: viewports.phone412,
      phone430: viewports.phone430,
    })) {
      await goto(page, '/', viewport);
      await page.waitForFunction(() => document.querySelector('header')?.getBoundingClientRect().top >= -1);
      await assertResponsive(page, `landing ${label}`, ['header', 'h1']);
      await goto(page, '/app', viewport);
      await page.waitForSelector('[data-testid="topbar"]');
      await assertResponsive(page, `app ${label}`, ['[data-testid="topbar"]', '[data-testid="map-controls"]', '[data-tour="chatbot-fab"]']);
    }

    await goto(page, '/app', viewports.phone);
    await page.waitForSelector('[data-testid="topbar"]');
    await assertResponsive(page, 'app closed panel', ['[data-testid="topbar"]', '[data-testid="map-controls"]', '[data-tour="chatbot-fab"]', '[data-tour="map-layers-trigger"]']);
    await assertInternalBounds(page, 'app closed panel', ['[data-testid="topbar"]', '[data-testid="map-controls"]']);
    await assertVisibleTouchTargets(page, '[data-testid="topbar"]', 'mobile topbar');
    await assertBasemapVisible(page, 'mobile app');
    await assertTouchTarget(page, '[data-tour="topbar-search"]', 'mobile search');
    await assertTouchTarget(page, '[data-tour="topbar-mode"] button', 'mobile mode');

    await page.click('[data-tour="map-layers-trigger"]');
    await page.waitForSelector('[data-testid="overlay-toggle-flood"]');
    await assertResponsive(page, 'mobile layer sheet', ['[data-testid="overlay-toggle-flood"]', '[data-tour="map-layers-trigger"]']);
    await delay(450);
    await assertInternalBounds(page, 'mobile layer sheet', ['[data-testid="disaster-layers-panel"]']);
    await assertVisibleTouchTargets(page, '[data-testid="disaster-layers-panel"]', 'mobile layer sheet');
    await assertNotOverlapping(page, '[data-testid="disaster-layers-panel"]', '[data-tour="chatbot-fab"]', 'mobile layer sheet/chatbot');
    await page.click('[data-tour="map-layers-trigger"]');

    await setStore(page, { leftPanelOpen: true, mode: 'audit', loading: true, pendingAudit: null, chatExpanded: false });
    await page.waitForSelector('[data-tour="left-panel"]');
    await assertResponsive(page, 'mobile loading panel', ['[data-tour="left-panel"]']);
    await assertInternalBounds(page, 'mobile loading panel', ['[data-tour="left-panel"]']);
    await assertVisibleTouchTargets(page, '[data-tour="left-panel"]', 'mobile loading panel');
    await assertTouchTarget(page, '[data-tour="left-panel"] button', 'mobile panel control');

    await setStore(page, { loading: false, propertyA: null, pendingAudit: { lat: -5.3971, lng: 105.2668 } });
    await page.waitForSelector('[role="dialog"]');
    await assertResponsive(page, 'mobile audit confirmation', ['[role="dialog"]']);
    await assertInternalBounds(page, 'mobile audit confirmation', ['[role="dialog"]']);
    await assertVisibleTouchTargets(page, '[role="dialog"]', 'mobile audit confirmation');
    await assertTouchTarget(page, '[role="dialog"] button[aria-label="Batal"]', 'audit cancel');
    await page.click('[role="dialog"] button[aria-label="Batal"]');

    await setStore(page, { propertyA: auditFixture, loading: false, leftPanelOpen: true, mode: 'audit' });
    await delay(250);
    await assertResponsive(page, 'mobile populated panel', ['[data-tour="left-panel"]']);
    await assertInternalBounds(page, 'mobile populated panel', ['[data-tour="left-panel"]']);

    await setStore(page, { leftPanelOpen: false, chatExpanded: false });
    await page.waitForSelector('[data-tour="chatbot-fab"]');
    await assertResponsive(page, 'chatbot collapsed', ['[data-tour="chatbot-fab"]']);
    await page.click('[data-tour="chatbot-fab"] button[aria-label="Buka chatbot"]');
    await page.waitForSelector('[data-testid="chatbot-expanded"]');
    await delay(450);
    await assertResponsive(page, 'chatbot expanded', ['[data-testid="chatbot-expanded"]']);
    await assertInternalBounds(page, 'chatbot expanded', ['[data-testid="chatbot-expanded"]']);
    await assertVisibleTouchTargets(page, '[data-testid="chatbot-expanded"]', 'chatbot expanded');
    await assertTouchTarget(page, '[data-testid="chatbot-expanded"] textarea', 'chat composer');
    await page.setViewport({ width: 390, height: 500, isMobile: true });
    await delay(450);
    await assertResponsive(page, 'chatbot keyboard-height viewport', ['[data-testid="chatbot-expanded"]']);
    await page.setViewport(viewports.phone);
    await delay(450);
    await setStore(page, { chatExpanded: false, mode: 'battle', leftPanelOpen: true, pendingAudit: null });
    await assertResponsive(page, 'compare setup', ['[data-tour="left-panel"]', '[data-tour="topbar-mode"]']);

    await setStore(page, { mode: 'audit', propertyA: auditFixture, leftPanelOpen: false, auditDrawerOpen: true, chatExpanded: false });
    await page.waitForSelector('[data-testid="audit-drawer"]');
    await assertResponsive(page, 'audit drawer long report', ['[data-testid="audit-drawer"]', '[data-testid="audit-drawer-close"]']);
    await assertInternalBounds(page, 'audit drawer long report', ['[data-testid="audit-drawer"]']);
    assert.ok(await page.$('.table-scroll'), 'audit drawer should wrap wide Markdown tables in a scroll container');
    await assertTouchTarget(page, '[data-testid="audit-drawer-close"]', 'audit drawer close');
    await page.click('[data-testid="audit-drawer-close"]');
    await page.waitForSelector('[data-testid="audit-drawer"]', { hidden: true });
    await delay(350);

    await page.click('[data-tour="topbar-search"]');
    await page.waitForSelector('[cmdk-input]');
    await assertResponsive(page, 'command palette', ['[cmdk-root]']);
    await assertInternalBounds(page, 'command palette', ['[cmdk-root]']);
    await assertVisibleTouchTargets(page, '[cmdk-root]', 'command palette');
    await page.keyboard.press('Escape');

    await setStore(page, { onboardingActive: true, onboardingStep: 0 });
    await page.waitForSelector('[data-testid="onboarding-tooltip"]');
    await delay(450);
    await assertResponsive(page, 'onboarding', ['[data-testid="onboarding-tooltip"]']);
    await assertInternalBounds(page, 'onboarding', ['[data-testid="onboarding-tooltip"]']);
    await assertVisibleTouchTargets(page, '[data-testid="onboarding-tooltip"]', 'onboarding');
    await page.keyboard.press('Escape');
    await setStore(page, { onboardingActive: false });

    await goto(page, '/laporan/missing-responsive-report', viewports.phoneLandscape);
    await delay(700);
    await assertResponsive(page, 'shared report landscape', ['header']);
    const reportGeometry = await page.$eval('main', (element) => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right, scrollHeight: document.documentElement.scrollHeight };
    });
    assert.ok(reportGeometry.left >= -1 && reportGeometry.right <= viewports.phoneLandscape.width + 1, 'shared report main has horizontal overflow');
    assert.ok(reportGeometry.scrollHeight > viewports.phoneLandscape.height, 'shared report should remain vertically scrollable');

    await goto(page, '/validasi', viewports.phoneNarrow);
    await assertResponsive(page, 'validation narrow phone 320', ['header', 'h1']);

    await goto(page, '/validasi', viewports.phone);
    await assertResponsive(page, 'validation phone 390', ['header', 'h1']);

    await goto(page, '/validasi', viewports.tablet);
    await assertResponsive(page, 'validation tablet 768', ['header', 'h1']);

    await goto(page, '/validasi', viewports.desktop);
    await assertResponsive(page, 'validation desktop 1440', ['header', 'h1']);

    await goto(page, '/', viewports.desktop);
    await page.waitForFunction(() => document.querySelector('header')?.getBoundingClientRect().top >= -1);
    await assertResponsive(page, 'landing desktop', ['header', 'h1']);
    await goto(page, '/app', viewports.tablet);
    await assertResponsive(page, 'app tablet', ['[data-testid="topbar"]', '[data-testid="map-controls"]']);

    await setStore(page, { lang: 'en', theme: 'light', leftPanelOpen: false });
    await assertResponsive(page, 'app English light theme', ['[data-testid="topbar"]', '[data-tour="chatbot-fab"]']);
    await setStore(page, { lang: 'id', theme: 'dark' });

    for (const [label, viewport] of Object.entries({
      desktopSmall: viewports.desktopSmall,
      desktopWide: viewports.desktopWide,
      desktop: viewports.desktop,
    })) {
      await goto(page, '/', viewport);
      await page.waitForFunction(() => document.querySelector('header')?.getBoundingClientRect().top >= -1);
      await assertResponsive(page, `landing ${label}`, ['header', 'h1']);
      await goto(page, '/app', viewport);
      await page.waitForSelector('[data-testid="topbar"]');
      await assertResponsive(page, `app ${label}`, ['[data-testid="topbar"]', '[data-testid="map-controls"]']);
    }

    assert.deepEqual(browserErrors, [], `uncaught browser errors: ${browserErrors.join('; ')}`);
    console.log(`Responsive browser checks passed at ${Object.keys(viewports).length} representative viewport presets.`);
  } finally {
    await browser.close();
    if (server) server.kill();
  }
}

run().catch((error) => {
  console.error(error.stack || error);
  if (server) server.kill();
  process.exitCode = 1;
});
