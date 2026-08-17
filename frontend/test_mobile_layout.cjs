const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');

const baseUrl = process.env.SAFEHOUSE_BASE_URL || 'http://127.0.0.1:5173';

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
    await page.goto(`${baseUrl}/app`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('[data-testid="topbar"]');

    const result = await page.evaluate(() => {
      const topbar = document.querySelector('[data-testid="topbar"]');
      const rect = topbar.getBoundingClientRect();
      const overflowing = [...topbar.querySelectorAll('*')]
        .filter((element) => getComputedStyle(element).display !== 'none')
        .map((element) => ({
          tag: element.tagName,
          right: element.getBoundingClientRect().right,
          left: element.getBoundingClientRect().left,
        }))
        .filter(({ right, left }) => right > window.innerWidth + 1 || left < -1);

      return {
        viewportWidth: window.innerWidth,
        right: rect.right,
        scrollWidth: document.documentElement.scrollWidth,
        overflowing,
      };
    });

    assert.ok(result.right <= result.viewportWidth + 1, JSON.stringify(result));
    assert.ok(result.scrollWidth <= result.viewportWidth + 1, JSON.stringify(result));
    assert.deepEqual(result.overflowing, [], JSON.stringify(result));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
