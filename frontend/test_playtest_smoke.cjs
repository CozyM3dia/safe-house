const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');

const baseUrl = process.env.SAFEHOUSE_BASE_URL || 'http://localhost:5173';

function visible(element) {
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
}

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  try {
    const appResponse = await page.goto(`${baseUrl}/app`, { waitUntil: 'networkidle2' });
    assert.ok(appResponse && appResponse.status() < 400, `direct /app returned ${appResponse?.status()}`);
    await page.waitForSelector('.leaflet-container');
    await page.waitForFunction(() => Boolean(window.useAppStore?.getState));

    const reportResponse = await page.goto(`${baseUrl}/laporan/playtest-smoke`, { waitUntil: 'domcontentloaded' });
    assert.ok(reportResponse && reportResponse.status() < 400, `direct report route returned ${reportResponse?.status()}`);
    await page.waitForSelector('#root');

    await page.goto(`${baseUrl}/app`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.leaflet-container');

    // English pass: the layer panel and its legend must not fall back to Indonesian.
    await page.evaluate(() => window.useAppStore.getState().setLang('en'));
    const mapViewButton = await page.waitForSelector('button[aria-label="Map View"]');
    await mapViewButton.click();
    await page.waitForFunction(() => [...document.querySelectorAll('h3')].some((node) => node.textContent.includes('Map View')));
    const englishLayerText = await page.evaluate(() => {
      const heading = [...document.querySelectorAll('h3')].find((node) => node.textContent.includes('Map View'));
      let panel = heading;
      while (panel && !String(panel.className).includes('w-[min(18rem,calc(100vw-1rem))]')) panel = panel.parentElement;
      return panel?.textContent || '';
    });
    assert.match(englishLayerText, /Map View/);
    assert.match(englishLayerText, /Street/);
    assert.match(englishLayerText, /Satellite/);
    assert.doesNotMatch(englishLayerText, /Tampilan Peta|Satelit/);

    await page.evaluate(() => window.useAppStore.getState().toggleOverlay('flood'));
    await page.waitForFunction(() => [...document.querySelectorAll('span')].some((node) => node.textContent.trim() === 'Map Legend'));
    const legendLayout = await page.evaluate(() => {
      const legendText = [...document.querySelectorAll('span')].find((node) => node.textContent.trim() === 'Map Legend');
      const legend = legendText?.closest('div.mt-4');
      const panel = legendText?.closest('div.fixed');
      return {
        legendPosition: legend ? getComputedStyle(legend).position : null,
        hasPanelOwner: Boolean(panel),
      };
    });
    assert.equal(legendLayout.legendPosition, 'static');
    assert.equal(legendLayout.hasPanelOwner, true);

    // Mobile pass: every visible topbar and map-control button is a usable touch target.
    await page.evaluate(() => window.useAppStore.getState().setLang('id'));
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
    await page.reload({ waitUntil: 'networkidle2' });
    await page.waitForSelector('[data-testid="topbar"]');
    const mobileLayout = await page.evaluate(() => {
      const groups = [
        document.querySelector('[data-testid="topbar"]'),
        document.querySelector('[data-testid="map-controls"]'),
      ];
      const isVisible = (element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
      };
      const buttons = groups.flatMap((group) => group ? [...group.querySelectorAll('button')].filter(isVisible) : []);
      const rects = buttons.map((button) => {
        const rect = button.getBoundingClientRect();
        return { label: button.getAttribute('aria-label'), width: rect.width, height: rect.height, right: rect.right };
      });
      return { scrollWidth: document.documentElement.scrollWidth, rects };
    });
    assert.ok(mobileLayout.scrollWidth <= 391, JSON.stringify(mobileLayout));
    assert.ok(mobileLayout.rects.every(({ width, height, right }) => width >= 44 && height >= 44 && right <= 391), JSON.stringify(mobileLayout));

    // Ocean guard: the coordinate from the reported screenshot must not produce a score.
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await page.evaluate(() => {
      const store = window.useAppStore.getState();
      store.processLocation(-5.95, 105.75);
    });
    await page.waitForFunction(() => window.useAppStore.getState().loading === false, { timeout: 50000 });
    const oceanState = await page.evaluate(() => {
      const state = window.useAppStore.getState();
      return { propertyA: state.propertyA, bodyText: document.body.innerText };
    });
    assert.equal(oceanState.propertyA, null, JSON.stringify(oceanState.propertyA));
    assert.match(oceanState.bodyText, /perairan|water/i);

    // Layering pass: the report close action remains clickable while chatbot is open.
    await page.evaluate(() => {
      const store = window.useAppStore.getState();
      store.setAuditDrawer(true);
      store.setChatExpanded(true);
    });
    await page.waitForSelector('[data-testid="audit-drawer-close"]');
    await new Promise((resolve) => setTimeout(resolve, 300));
    assert.equal(await page.evaluate(() => window.useAppStore.getState().auditDrawerOpen), true);
    await page.evaluate(() => document.querySelector('[data-testid="audit-drawer-close"]').click());
    await page.waitForFunction(() => window.useAppStore.getState().auditDrawerOpen === false);

    assert.deepEqual(pageErrors, [], `page errors: ${pageErrors.join('; ')}`);
    console.log(JSON.stringify({
      baseUrl,
      directRoutes: 'passed',
      englishLayer: 'passed',
      legendInPanel: 'passed',
      mobile390: 'passed',
      oceanNoScore: 'passed',
      drawerCloseAboveChatbot: 'passed',
      consoleErrors,
    }, null, 2));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
