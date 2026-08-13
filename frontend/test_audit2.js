import { fetchGeospatialData, generateSiteAuditReport } from './src/services/engine.js';

async function test() {
    try {
        const data = await fetchGeospatialData(-6.290046212074113, 106.87191009521486);
        console.log("Calling generateSiteAuditReport...");
        await generateSiteAuditReport(data, 'id');
        console.log("DONE");
    } catch(e) {
        console.error("Outer Error", e.message);
    }
}

test();
