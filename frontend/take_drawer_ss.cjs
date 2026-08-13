const puppeteer = require('puppeteer');
const { exec } = require('child_process');

(async () => {
  console.log('Starting dev server...');
  const server = exec('npm run dev');
  
  // Wait for server to start
  await new Promise(r => setTimeout(r, 4000));
  
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ 
    headless: "new",
    defaultViewport: { width: 1440, height: 900 }
  });
  const page = await browser.newPage();
  
  console.log('Navigating to http://localhost:5173/app');
  await page.goto('http://localhost:5173/app', { waitUntil: 'networkidle0' });
  
  console.log('Injecting mock data and opening drawer...');
  await page.evaluate(async () => {
    const store = window.useAppStore.getState();
    // Simulate a successful audit for "Jakarta"
    store.processLocation(-6.2088, 106.8456);
  });
  
  console.log('Waiting for AI report generation (10s)...');
  await new Promise(r => setTimeout(r, 10000));
  
  // Open the drawer
  await page.evaluate(() => {
    window.useAppStore.getState().setAuditDrawer(true);
  });
  
  console.log('Waiting for drawer animation...');
  await new Promise(r => setTimeout(r, 1500));
  
  console.log('Taking screenshot of the drawer...');
  // The drawer content is inside [vaul-drawer] or `.glass-strong`
  const drawerSelector = '.glass-strong';
  await page.waitForSelector(drawerSelector);
  const drawerElement = await page.$(drawerSelector);
  
  if (drawerElement) {
    await drawerElement.screenshot({ path: 'public/app_step3_report.png' });
    console.log('Saved to public/app_step3_report.png');
  } else {
    console.log('Drawer not found! Taking full page screenshot instead.');
    await page.screenshot({ path: 'public/app_step3_report.png' });
  }

  console.log('Closing...');
  await browser.close();
  server.kill();
  process.exit(0);
})();
