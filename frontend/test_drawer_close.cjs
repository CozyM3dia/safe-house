const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');

const baseUrl = process.env.SAFEHOUSE_BASE_URL || 'http://127.0.0.1:5173';

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
    await page.goto(`${baseUrl}/app`, { waitUntil: 'networkidle0' });

    await page.evaluate(() => {
      const store = window.useAppStore?.getState?.();
      if (!store) throw new Error('useAppStore is not exposed on window');
      store.setAuditDrawer?.(true);
      store.setChatExpanded?.(true);
    });

    await page.waitForSelector('[data-testid="audit-drawer-close"]');
    await page.click('[data-testid="audit-drawer-close"]');

    const closed = await page.evaluate(() => {
      const store = window.useAppStore?.getState?.();
      return store?.auditDrawerOpen === false;
    });

    assert.equal(closed, true, 'audit drawer close button should win over the chatbot layer');
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
