const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900'],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

    page.on('response', res => {
        if (res.url().includes('generativelanguage') || res.url().includes('openrouter')) {
            console.log(`API ${res.status()}: gemini call`);
        }
    });

    console.log('1. Navigate...');
    await page.goto('http://localhost:5173/app', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // Property A
    console.log('2. Property A: Bandung');
    await page.keyboard.down('Control'); await page.keyboard.press('KeyK'); await page.keyboard.up('Control');
    await new Promise(r => setTimeout(r, 1000));
    await page.keyboard.type('Bandung', { delay: 50 });
    await new Promise(r => setTimeout(r, 3000));
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 20000));

    // Switch to battle
    console.log('3. Switch to battle mode');
    await page.evaluate(() => {
        const btns = document.querySelectorAll('button');
        for (const b of btns) { if (b.textContent.includes('Battle')) { b.click(); return; } }
    });
    await new Promise(r => setTimeout(r, 2000));

    // Property B
    console.log('4. Property B: Jakarta');
    await page.keyboard.down('Control'); await page.keyboard.press('KeyK'); await page.keyboard.up('Control');
    await new Promise(r => setTimeout(r, 1000));
    await page.keyboard.type('Jakarta', { delay: 50 });
    await new Promise(r => setTimeout(r, 3000));
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 25000));

    // Find and click the CORRECT generate battle report button
    console.log('5. Looking for "Buat Laporan Perbandingan AI" button...');
    const clickResult = await page.evaluate(() => {
        const btns = document.querySelectorAll('button');
        const allBtnTexts = [];
        for (const b of btns) {
            const t = b.textContent.trim();
            if (t.length > 3) allBtnTexts.push(`"${t.substring(0, 50)}" disabled=${b.disabled}`);
            if (t.includes('Perbandingan') || t.includes('Generate AI Battle')) {
                b.click();
                return { clicked: true, text: t };
            }
        }
        return { clicked: false, availableButtons: allBtnTexts };
    });
    console.log('   Result:', JSON.stringify(clickResult, null, 2));

    if (!clickResult.clicked) {
        console.log('❌ Could not find generate battle report button');
        await browser.close();
        return;
    }

    // Wait for battle report generation (2s delay + AI call)
    console.log('6. Waiting for battle report generation...');
    for (let i = 5; i <= 45; i += 5) {
        await new Promise(r => setTimeout(r, 5000));
        
        const state = await page.evaluate(() => {
            const btns = document.querySelectorAll('button');
            let viewBtn = null;
            for (const b of btns) {
                const t = b.textContent.trim();
                if (t.includes('Lihat Laporan Battle') || t.includes('View Battle Report')) {
                    viewBtn = { text: t, disabled: b.disabled };
                    break;
                }
            }
            // Check if still loading
            let loading = false;
            for (const b of btns) {
                if (b.textContent.includes('Membuat') || b.textContent.includes('Generating')) {
                    loading = true;
                }
            }
            return { viewBtn, loading };
        });
        
        console.log(`   [${i}s]: ${JSON.stringify(state)}`);
        
        if (state.viewBtn) {
            console.log('\n✅ Battle report generated! "View" button appeared.');
            
            // Click view button to open drawer
            await page.evaluate(() => {
                const btns = document.querySelectorAll('button');
                for (const b of btns) {
                    if (b.textContent.includes('Lihat Laporan Battle') || b.textContent.includes('View Battle Report')) {
                        b.click(); break;
                    }
                }
            });
            await new Promise(r => setTimeout(r, 3000));
            
            // Check drawer content
            const drawer = await page.evaluate(() => {
                const dialog = document.querySelector('[role="dialog"]');
                if (!dialog) return { found: false };
                const text = dialog.textContent || '';
                const headings = Array.from(dialog.querySelectorAll('h1, h2, h3')).map(h => h.textContent.trim()).filter(t => t.length > 2);
                const hasTable = dialog.querySelector('table') !== null;
                return { found: true, headings: headings.slice(0, 8), hasTable, preview: text.substring(100, 400) };
            });
            console.log('Drawer content:', JSON.stringify(drawer, null, 2));
            break;
        }
    }

    await new Promise(r => setTimeout(r, 3000));
    await browser.close();
    console.log('\nTest complete.');
})();
