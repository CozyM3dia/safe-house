import puppeteer from 'puppeteer';
import { promises as fs } from 'fs';
import path from 'path';

(async () => {
  console.log("Starting browser automation...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Set premium high-res viewport
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    
    console.log("Navigating to http://localhost:5173/app...");
    await page.goto('http://localhost:5173/app', { waitUntil: 'networkidle2' });
    
    // Wait for the Leaflet map container to be visible
    console.log("Waiting for Leaflet map...");
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    
    // Wait 3 seconds for map tiles to load fully
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Open Search / Command Palette
    console.log("Opening Command Palette...");
    await page.click('[data-tour="topbar-search"]');
    
    // Wait for search input
    console.log("Waiting for search input...");
    await page.waitForSelector('input[placeholder*="Cari lokasi"]', { timeout: 5000 });
    
    // Type Lembang, Bandung to query active fault zone
    console.log("Searching for Lembang, Bandung...");
    await page.type('input[placeholder*="Cari lokasi"]', 'Lembang, Bandung');
    
    // Wait for Nominatim geocoding results to populate
    console.log("Waiting for search results...");
    await page.waitForSelector('div[role="option"]', { timeout: 12000 });
    
    // Click the first geocoding result
    console.log("Selecting Bandung / Lembang result...");
    const firstOption = await page.$('div[role="option"]');
    await firstOption.click();
    
    // Wait for geological fetching and AI report rendering (loading beams and text analysis)
    console.log("Waiting for geological calculations and AI RAG analysis to complete (12s)...");
    await new Promise(resolve => setTimeout(resolve, 12000));
    
    // Open the drawer by clicking the "View Report" button (col-span-3) in the Left Panel
    console.log("Opening Audit Drawer by clicking the Left Panel 'View Report' button...");
    await page.waitForSelector('aside[data-tour="left-panel"] button.col-span-3:not([disabled])', { timeout: 8000 });
    await page.click('aside[data-tour="left-panel"] button.col-span-3:not([disabled])');
    
    // Wait for the report container to render in the drawer
    console.log("Waiting for report content inside the drawer...");
    await page.waitForSelector('div.mx-auto.max-w-3xl', { timeout: 8000 });
    
    // Capture 1: AI Report Crop (MX-AUTO container inside drawer) - Step 3
    console.log("Taking screenshot: AI Report Sheet (Step 3)...");
    const reportCard = await page.$('div.mx-auto.max-w-3xl');
    if (reportCard) {
      await reportCard.screenshot({ path: 'public/app_step3_report.png' });
    } else {
      console.warn("AI Report container (.mx-auto.max-w-3xl) not found!");
    }
    
    // Hide the drawer to expose the Leaflet Map and LeftPanel stats
    console.log("Hiding only the Drawer elements...");
    await page.evaluate(() => {
      const drawerPortal = document.querySelector('div[role="dialog"]');
      const drawerOverlay = document.querySelector('div.fixed.inset-0.z-30');
      const drawerContent = document.querySelector('div.glass-strong.fixed.bottom-0');
      if (drawerPortal) drawerPortal.style.display = 'none';
      if (drawerOverlay) drawerOverlay.style.display = 'none';
      if (drawerContent) drawerContent.style.display = 'none';
    });
    
    // Wait a brief moment for layout reflow
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Capture 2: Audited Active State (Full page preview with Left Panel visible, drawer closed)
    console.log("Taking screenshot: Full App Audited Dashboard (Drawer Closed)...");
    await page.screenshot({ path: 'public/app_audited_preview.png' });
    
    // Hide LeftPanel and other elements to get a completely clean map
    console.log("Hiding other UI panels for clean map capture...");
    await page.evaluate(() => {
      // Hide Topbar
      const topBar = document.querySelector('div.fixed.left-0.right-0.top-0');
      if (topBar) topBar.style.display = 'none';
      
      // Hide Chatbot Fab
      const chatbotFab = document.querySelector('div[data-tour="chatbot-fab"]');
      if (chatbotFab) chatbotFab.style.display = 'none';
      
      // Hide Toaster statuses
      const toaster = document.querySelector('div[role="status"]');
      if (toaster) toaster.style.display = 'none';
      
      // Hide LeftPanel
      const leftPanel = document.querySelector('aside[data-tour="left-panel"]');
      if (leftPanel) leftPanel.style.display = 'none';
    });
    
    // Capture 3: Clean Map with Lembang Active Fault Pin - Step 1
    console.log("Taking screenshot: Clean Map (Step 1)...");
    const mapArea = await page.$('div[data-tour="map-area"]');
    if (mapArea) {
      await mapArea.screenshot({ path: 'public/app_step1_map.png' });
    }
    
    // Unhide LeftPanel to screenshot it separately - Step 2
    console.log("Unhiding LeftPanel...");
    await page.evaluate(() => {
      const leftPanel = document.querySelector('aside[data-tour="left-panel"]');
      if (leftPanel) leftPanel.style.display = 'flex';
    });
    
    // Capture 4: Left Panel only
    console.log("Taking screenshot: Left Panel Risk Score Card (Step 2)...");
    const leftPanel = await page.$('aside[data-tour="left-panel"]');
    if (leftPanel) {
      await leftPanel.screenshot({ path: 'public/app_step2_leftpanel.png' });
    }
    
    console.log("All screenshots captured successfully!");
  } catch (error) {
    console.error("Automation error occurred:", error);
  } finally {
    await browser.close();
    console.log("Browser closed.");
  }
})();
