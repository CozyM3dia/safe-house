const puppeteer = require('puppeteer');
const { exec } = require('child_process');

(async () => {
  console.log('Starting preview server...');
  const server = exec('npm run preview');
  
  // Wait for server to start
  await new Promise(r => setTimeout(r, 3000));
  
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: "new",
    ignoreHTTPSErrors: true
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
    console.log('Navigating to http://localhost:4173/app');
    await page.goto('http://localhost:4173/app', { waitUntil: 'networkidle2' });
    
    console.log('Waiting for button...');
    await page.waitForSelector('button[title="Buka Overlay Risiko"]', { timeout: 10000 });
    
    console.log('Opening Overlay Panel...');
    await page.click('button[title="Buka Overlay Risiko"]');
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
    server.kill();
    process.exit(0);
  }
})();
