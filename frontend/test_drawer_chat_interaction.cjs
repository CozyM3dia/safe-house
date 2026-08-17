const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');

const APP_URL = process.env.SAFE_HOUSE_APP_URL || 'http://localhost:5173/app';

async function run() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();

  try {
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForFunction(() => Boolean(window.useAppStore), { timeout: 10000 });

    await page.evaluate(() => {
      window.useAppStore.setState({
        propertyA: {
          address: 'Jl. Uji Interaksi, Indonesia',
          lat: -6.2,
          lon: 106.8,
          aiReport: { reportLoading: false },
        },
        mode: 'audit',
        chatExpanded: false,
        auditDrawerOpen: true,
      });
    });

    await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
    const chatbotInput = await page.waitForSelector('[data-tour="chatbot-fab"] input', { timeout: 10000 });
    await chatbotInput.click();

    const result = await page.evaluate(() => ({
      bodyPointerEvents: getComputedStyle(document.body).pointerEvents,
      chatExpanded: window.useAppStore.getState().chatExpanded,
      expandedChatInput: Boolean(document.querySelector('textarea')),
    }));

    assert.notEqual(result.bodyPointerEvents, 'none', 'the modal drawer must not disable pointer events on the page');
    assert.equal(result.chatExpanded, true, 'focusing the chatbot should expand it while the report is open');
    assert.equal(result.expandedChatInput, true, 'the expanded chatbot input should be rendered after interaction');

    await page.click('textarea');
    await page.keyboard.type('apakah lokasi ini aman?');
    assert.equal(
      await page.$eval('textarea', (element) => element.value),
      'apakah lokasi ini aman?',
      'the expanded chatbot input should accept text while the report is open'
    );

    console.log('PASS: chatbot remains interactive while the full report drawer is open');
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  console.error(`FAIL: ${error.message}`);
  process.exitCode = 1;
});
