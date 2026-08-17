const puppeteer = require('puppeteer');
const { exec } = require('child_process');

(async () => {
  const baseUrl = process.env.SAFEHOUSE_BASE_URL || 'http://localhost:5173';
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: "new",
    ignoreHTTPSErrors: true,
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  
  // Capture logs
  page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  page.on('requestfailed', request => {
    const url = request.url();
    if (url.includes('MapServer') || url.includes('ImageServer') || url.includes('geoserver')) {
      console.log('BROWSER REQUEST FAILED:', url, request.failure().errorText);
    }
  });
  page.on('requestfinished', async (request) => {
    const url = request.url();
    if (url.includes('MapServer') || url.includes('ImageServer') || url.includes('geoserver')) {
      const response = request.response();
      const status = response ? response.status() : 'UNKNOWN';
      console.log(`BROWSER REQUEST SUCCESS: ${url} (Status: ${status})`);
    }
  });

  try {
    console.log(`Navigating to ${baseUrl}/app`);
    await page.goto(`${baseUrl}/app`, { waitUntil: 'networkidle2' });
    
    console.log('Waiting for button...');
    const button = await page.waitForSelector('button[aria-label="Map View"], button[aria-label="Tampilan Peta"]', { timeout: 10000 });
    
    console.log('Opening Overlay Panel...');
    await button.click();
    await new Promise(r => setTimeout(r, 1000));
    
    const toggleButtons = await page.$$('button[title="Tampilkan"]');
    console.log(`Found ${toggleButtons.length} overlay toggle buttons.`);
    if (toggleButtons.length > 0) {
      // Toggle Flood
      console.log('Toggling Flood Overlay...');
      await toggleButtons[0].click();
      await new Promise(r => setTimeout(r, 1500));
      
      // Toggle ZNT
      if (toggleButtons.length > 8) {
        console.log('Toggling ZNT (Cadastral WMS) Overlay...');
        await toggleButtons[8].click();
        await new Promise(r => setTimeout(r, 1500));
      }
      
      // Toggle Landcover
      if (toggleButtons.length > 9) {
        console.log('Toggling Landcover (KLHK ArcGIS) Overlay...');
        await toggleButtons[9].click();
        await new Promise(r => setTimeout(r, 1500));
      }
      
      // Toggle Population
      if (toggleButtons.length > 10) {
        console.log('Toggling Population (InaRISK ImageServer) Overlay...');
        await toggleButtons[10].click();
        await new Promise(r => setTimeout(r, 1500));
      }
    } else {
      console.log('No toggle buttons found with title "Tampilkan"');
    }
    
    console.log('Waiting 10 seconds for all tiles to fully load...');
    await new Promise(r => setTimeout(r, 10000));
  } catch (err) {
    console.log('Test execution failed:', err.message);
  } finally {
    console.log('Closing browser...');
    await browser.close();
    process.exit(0);
  }
})();
