const puppeteer = require('puppeteer');
const { exec } = require('child_process');

(async () => {
  console.log('Starting preview server...');
  const server = exec('npm run preview');
  
  // Wait for server to start
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  // Capture logs
  page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  page.on('requestfailed', request => console.log('BROWSER REQUEST FAILED:', request.url(), request.failure().errorText));

  console.log('Navigating to http://localhost:4173/');
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2' });
  
  console.log('Waiting 5 seconds...');
  await new Promise(r => setTimeout(r, 5000));
  
  console.log('Closing...');
  await browser.close();
  server.kill();
  process.exit(0);
})();
