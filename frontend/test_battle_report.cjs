const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');

const APP_URL = process.env.SAFE_HOUSE_APP_URL || 'http://localhost:5173/app';

async function run() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();

  await page.setRequestInterception(true);
  page.on('request', (request) => {
    if (!request.url().endsWith('/api/battle-report')) {
      request.continue().catch(() => {});
      return;
    }

    const corsHeaders = {
      'Access-Control-Allow-Origin': 'http://localhost:5173',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'content-type',
      'Access-Control-Allow-Methods': 'GET, POST',
    };

    if (request.method() === 'OPTIONS') {
      request.respond({ status: 200, headers: corsHeaders, body: 'OK' }).catch(() => {});
      return;
    }

    request.respond({
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        report: '# LAPORAN BATTLE S.A.F.E HOUSE\n\n## Perbandingan Data Terverifikasi',
        generated_by: 'test',
        metadata: {
          model: 'test',
          delivery_mode: 'live',
          prompt_version: 'test',
          generated_at: new Date().toISOString(),
        },
      }),
    }).catch(() => {});
  });

  try {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction(() => Boolean(window.useAppStore), { timeout: 10000 });

    await page.evaluate(() => {
      window.useAppStore.setState({
        propertyA: {
          id: 'audit-a',
          address: 'Lokasi A',
          safe_score: 65,
          hazard: { radar: { flood: 20, soil: 20, seismic: 20, landslide: 20, subsidence: 20 } },
        },
        propertyB: {
          id: 'audit-b',
          address: 'Lokasi B',
          safe_score: 78,
          hazard: { radar: { flood: 15, soil: 15, seismic: 15, landslide: 15, subsidence: 15 } },
        },
        mode: 'battle',
        leftPanelOpen: true,
        loading: false,
        battleReportContent: null,
        battleReportLoading: false,
        auditDrawerOpen: false,
      });
    });

    await page.evaluate(async () => {
      await window.useAppStore.getState().runBattleReportAction();
    });
    await page.waitForFunction(
      () => window.useAppStore.getState().auditDrawerOpen === true
        && Boolean(window.useAppStore.getState().battleReportContent),
      { timeout: 10000 }
    );

    const state = await page.evaluate(() => ({
      report: window.useAppStore.getState().battleReportContent,
      placeholder: document.body.innerText.includes('akan hadir setelah lapis AI'),
    }));
    assert.match(state.report, /Perbandingan Data Terverifikasi/);
    assert.equal(state.placeholder, false);
    console.log('PASS: Battle button generates and opens the comparison report');
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  console.error(`FAIL: ${error.message}`);
  process.exitCode = 1;
});
