const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');

const baseUrl = process.env.SAFEHOUSE_BASE_URL || 'http://localhost:5173';

(async () => {
  console.log(`[Playthrough] Starting full playthrough on ${baseUrl}...`);
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const pageErrors = [];
  page.on('pageerror', (error) => {
    console.error('[Page Error]:', error.message);
    pageErrors.push(error.message);
  });

  try {
    // 1. Landing Page
    console.log('[Playthrough] 1. Visiting Landing Page...');
    const landingRes = await page.goto(baseUrl, { waitUntil: 'networkidle2' });
    assert.ok(landingRes && landingRes.status() < 400, 'Landing page returned 200');
    await page.waitForSelector('text/S.A.F.E');

    // 2. Navigate to /app
    console.log('[Playthrough] 2. Navigating to /app...');
    await page.goto(`${baseUrl}/app`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.leaflet-container');
    await page.waitForFunction(() => Boolean(window.useAppStore?.getState));

    // 3. Custom Map Cursor verification
    console.log('[Playthrough] 3. Testing Map Cursor...');
    const hasCrosshairClass = await page.evaluate(() => {
      const el = document.querySelector('.leaflet-container');
      return el && el.classList.contains('safe-map-crosshair');
    });
    assert.ok(hasCrosshairClass, 'Map container has safe-map-crosshair class');

    // 4. Map Click & Confirmation Prompt Flow
    console.log('[Playthrough] 4. Testing Map Click & Confirmation Dialog...');
    // Click on map center
    const mapRect = await page.evaluate(() => {
      const el = document.querySelector('.leaflet-container');
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2 + 100, y: r.top + r.height / 2 };
    });
    await page.mouse.click(mapRect.x, mapRect.y);

    // Wait for confirmation dialog
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    const dialogText = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      return dialog ? dialog.textContent : '';
    });
    console.log('[Playthrough] Dialog appeared:', dialogText.slice(0, 100));
    assert.match(dialogText, /Apakah Anda yakin ingin mengaudit lokasi ini\?|Confirm Location Audit/);

    // Test Cancel button
    console.log('[Playthrough] 4a. Testing Cancel button...');
    const cancelBtn = await page.evaluate(() => {
      const btns = [...document.querySelectorAll('[role="dialog"] button')];
      const b = btns.find((btn) => btn.textContent.includes('Batal') || btn.textContent.includes('Cancel'));
      if (b) { b.click(); return true; }
      return false;
    });
    assert.ok(cancelBtn, 'Found and clicked Cancel button');
    await page.waitForFunction(() => !document.querySelector('[role="dialog"]'), { timeout: 3000 });
    console.log('[Playthrough] Dialog closed successfully.');

    // Click again on land (Bandung) and Confirm Audit
    console.log('[Playthrough] 4b. Testing Confirm Audit button for Bandung...');
    await page.evaluate(() => {
      window.useAppStore.getState().setPendingAudit({
        lat: -6.9175,
        lng: 107.6191,
        isBattlePin: false,
      });
    });
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    // Click Confirm Audit button
    await page.evaluate(() => {
      const btns = [...document.querySelectorAll('[role="dialog"] button')];
      const confirm = btns.find((btn) => btn.textContent.includes('Audit Lokasi') || btn.textContent.includes('Audit This Location'));
      if (confirm) confirm.click();
    });

    console.log('[Playthrough] 4c. Waiting for Audit calculation to complete...');
    await page.waitForFunction(
      () => {
        const state = window.useAppStore.getState();
        return state.loading === false && state.propertyA !== null;
      },
      { timeout: 45000 }
    );

    const propertyA = await page.evaluate(() => window.useAppStore.getState().propertyA);
    assert.ok(propertyA, 'Property A is loaded');
    assert.ok(typeof propertyA.safe_score === 'number', 'Safe score is computed');
    console.log(`[Playthrough] Property A loaded: Score ${propertyA.safe_score}/100, Address: ${propertyA.address}`);

    // 5. Test Laporan SNI PDF Button
    console.log('[Playthrough] 5. Verifying Laporan SNI PDF export button...');
    await new Promise((r) => setTimeout(r, 1200));
    const pdfBtnFound = await page.evaluate(() => {
      const btns = [...document.querySelectorAll('button')];
      return btns.some((b) => b.textContent.includes('Laporan SNI') || b.textContent.includes('SNI Report'));
    });
    assert.ok(pdfBtnFound, 'Laporan SNI (PDF) button exists in LeftPanel');

    // 6. Test Battle Mode Transition
    console.log('[Playthrough] 6. Testing Battle Mode...');
    await page.evaluate(() => window.useAppStore.getState().setMode('battle'));
    const mode = await page.evaluate(() => window.useAppStore.getState().mode);
    assert.equal(mode, 'battle', 'Switched to battle mode');

    // Trigger Property B (Jakarta)
    console.log('[Playthrough] 6a. Selecting Property B (Jakarta)...');
    await page.evaluate(() => {
      window.useAppStore.getState().setPendingAudit({
        lat: -6.2088,
        lng: 106.8456,
        isBattlePin: true,
      });
    });
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    const battleDialogText = await page.evaluate(() => document.querySelector('[role="dialog"]')?.textContent || '');
    assert.match(battleDialogText, /Lokasi B|Site B/);

    // Confirm Property B
    await page.evaluate(() => {
      const btns = [...document.querySelectorAll('[role="dialog"] button')];
      const confirm = btns.find((btn) => btn.textContent.includes('Audit Lokasi') || btn.textContent.includes('Audit This Location'));
      if (confirm) confirm.click();
    });

    await page.waitForFunction(
      () => {
        const state = window.useAppStore.getState();
        return state.loading === false && state.propertyB !== null;
      },
      { timeout: 45000 }
    );
    const propertyB = await page.evaluate(() => window.useAppStore.getState().propertyB);
    assert.ok(propertyB, 'Property B loaded');
    console.log(`[Playthrough] Property B loaded: Score ${propertyB.safe_score}/100`);

    // 7. Layers Panel and Dashed Fault Lines
    console.log('[Playthrough] 7. Testing Disaster Layers Panel...');
    const layerBtn = await page.waitForSelector('button[aria-label="Tampilan Peta"], button[aria-label="Map View"]');
    await layerBtn.click();
    await new Promise((r) => setTimeout(r, 600));
    await page.evaluate(() => window.useAppStore.getState().toggleOverlay('faults'));
    const faultActive = await page.evaluate(() => window.useAppStore.getState().overlays.faults);
    assert.equal(faultActive, true, 'Fault overlay toggled active');

    assert.equal(pageErrors.length, 0, `Unhandled errors: ${pageErrors.join(', ')}`);
    console.log('[Playthrough] ✅ FULL PLAYTHROUGH PASSED FLAWLESSLY!');
  } finally {
    await browser.close();
  }
})().catch((err) => {
  console.error('[Playthrough FAILED]:', err);
  process.exit(1);
});
