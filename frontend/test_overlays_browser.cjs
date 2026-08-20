const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');

const baseUrl = process.env.SAFEHOUSE_BASE_URL || 'http://localhost:5173';
const hazardKeys = ['flood', 'landslide', 'earthquake'];

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForOverlaySettled(page, key) {
  await page.waitForFunction(
    (overlayKey) => {
      const status = window.useAppStore.getState().overlayStatuses[overlayKey];
      return status === 'ready' || status === 'error';
    },
    { timeout: 15000 },
    key
  );
}

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const layerRequests = [];
  const pageErrors = [];
  const layerStatuses = {};
  const layerSources = {};
  const layerResponseStatuses = {};
  const layerRequestFailures = [];

  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('ImageServer') || url.includes('MapServer') || url.includes('basemaps') || url.includes('arcgisonline')) {
      layerRequests.push(url);
    }
  });
  page.on('response', (response) => {
    const url = response.url();
    const match = url.match(/inarisk\/([^/]+)\/ImageServer\//i);
    if (match) layerResponseStatuses[match[1]] = response.status();
  });
  page.on('requestfailed', (request) => {
    if (request.url().includes('ImageServer')) {
      layerRequestFailures.push({ url: request.url(), error: request.failure()?.errorText });
    }
  });

  try {
    await page.goto(`${baseUrl}/app`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('.leaflet-container');
    await page.waitForFunction(() => Boolean(window.useAppStore?.getState));
    await page.click('button[aria-label="Tampilan Peta"]');
    await page.waitForSelector('[data-testid="overlay-toggle-flood"]');

    const toggles = await page.evaluate(() => ({
      hazard: [...document.querySelectorAll('[data-testid^="overlay-toggle-"]')].map((button) => button.dataset.testid),
      base: [...document.querySelectorAll('button[aria-pressed]')].map((button) => button.getAttribute('aria-label')),
    }));
    assert.deepEqual(toggles.hazard.sort(), [
      'overlay-toggle-earthquake',
      'overlay-toggle-faults',
      'overlay-toggle-flood',
      'overlay-toggle-landslide',
    ]);
    assert.ok(toggles.base.some((label) => label.includes('Satelit')), JSON.stringify(toggles));

    for (const key of hazardKeys) {
      const requestCountBefore = layerRequests.length;
      await page.click(`[data-testid="overlay-toggle-${key}"]`);
      await page.waitForFunction((overlayKey) => window.useAppStore.getState().overlays[overlayKey] === true, {}, key);
      await waitForOverlaySettled(page, key);
      const status = await page.evaluate((overlayKey) => window.useAppStore.getState().overlayStatuses[overlayKey], key);
      layerStatuses[key] = status;
      layerSources[key] = await page.evaluate((overlayKey) => window.useAppStore.getState().overlaySources[overlayKey], key);
      assert.equal(status, 'ready', `${key} did not render a tile; status=${status}`);
      const hazardPane = await page.$eval('.inarisk-overlay', (layer) => ({
        className: layer.parentElement?.className,
        zIndex: getComputedStyle(layer.parentElement).zIndex,
      }));
      assert.match(String(hazardPane.className), /leaflet-hazardOverlay-pane/);
      assert.equal(hazardPane.zIndex, '350');
      assert.equal(layerSources[key], 'official', `${key} should use the responsive official BNPB raster`);
      assert.ok(layerRequests.length > requestCountBefore, `${key} did not request a remote raster tile`);
      const requestedUrls = layerRequests.slice(requestCountBefore).join('\n');
      assert.match(requestedUrls, /ImageServer/);
      const servicePattern = {
        flood: /layer_bahaya_banjir/i,
        landslide: /layer_bahaya_tanah_longsor/i,
        earthquake: /layer_bahaya_gempabumi/i,
      }[key];
      assert.match(requestedUrls, servicePattern);

      await page.click(`[data-testid="overlay-toggle-${key}"]`);
      await page.waitForFunction((overlayKey) => (
        window.useAppStore.getState().overlays[overlayKey] === false
        && window.useAppStore.getState().overlayStatuses[overlayKey] === 'idle'
      ), {}, key);
    }

    await page.click('[data-testid="overlay-toggle-faults"]');
    await page.waitForFunction(() => window.useAppStore.getState().overlays.faults === true);
    await page.waitForSelector('.leaflet-faultReference-pane canvas', { timeout: 15000 });
    await page.waitForFunction(() => window.useAppStore.getState().faultLayerSource !== 'loading', { timeout: 15000 });
    await page.click('[data-testid="overlay-toggle-faults"]');
    await page.waitForFunction(() => window.useAppStore.getState().overlays.faults === false);

    const satelliteButton = await page.$('button[aria-label="Gunakan peta dasar: Satelit"]');
    assert.ok(satelliteButton, 'satellite basemap control is missing');
    await satelliteButton.click();
    await page.waitForFunction(() => window.useAppStore.getState().baseMapStyle === 'satellite');
    assert.ok(layerRequests.some((url) => url.includes('server.arcgisonline.com/ArcGIS/rest/services/World_Imagery')));

    await page.evaluate(() => window.useAppStore.getState().setLang('en'));
    await page.waitForFunction(() => document.body.innerText.includes('HAZARD LAYERS'));
    await page.evaluate(() => {
      const store = window.useAppStore.getState();
      store.toggleOverlay('flood');
      store.toggleOverlay('landslide');
      store.toggleOverlay('faults');
    });
    await waitForOverlaySettled(page, 'flood');
    await waitForOverlaySettled(page, 'landslide');
    await page.waitForFunction(() => window.useAppStore.getState().faultLayerSource !== 'loading', { timeout: 15000 });
    await wait(250);
    const fallbackSource = await page.evaluate(() => window.useAppStore.getState().overlaySources.landslide);
    assert.equal(fallbackSource, 'official');
    const faultLegendCount = await page.$$eval('[data-testid="fault-layer-legend"]', (legends) => legends.length);
    assert.equal(faultLegendCount, 1, 'fault legend should render exactly once inside the layer panel');
    const panelText = await page.$eval('[data-testid="overlay-toggle-flood"]', (button) => {
      let panel = button;
      while (panel && !String(panel.className).includes('w-[min(18rem,calc(100vw-1rem))]')) panel = panel.parentElement;
      return panel?.innerText || '';
    });
    assert.doesNotMatch(panelText, /Layer bahaya|Layer referensi|Banjir|Longsor|Gempa|Sesar aktif|Sumber|Geometri resmi|Legenda aktif/);
    assert.match(panelText, /Hazard layers|Reference layers|Flood|Active faults|Map Legend/);
    assert.match(panelText, /National landslide hazard map/);

    assert.deepEqual(layerRequestFailures, [], `map layer request failures: ${JSON.stringify(layerRequestFailures)}`);
    assert.deepEqual(pageErrors, [], `page errors: ${pageErrors.join('; ')}`);
    console.log(JSON.stringify({
      baseUrl,
      layers: 'flood, landslide, earthquake, faults passed (remote)',
      basemaps: 'street and satellite passed',
      englishPanel: 'passed',
      layerStatuses,
      layerSources,
      layerResponseStatuses,
      layerRequestFailures: layerRequestFailures.slice(0, 5),
      sampleLayerUrls: layerRequests.filter((url) => url.includes('ImageServer')).slice(0, 3),
      requestCount: layerRequests.length,
    }, null, 2));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
