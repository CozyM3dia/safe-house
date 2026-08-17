import axios from 'axios';

const apiBase = process.env.SAFEHOUSE_API_URL || 'http://localhost:8000';
const freeLlmApiToken = process.env.FREELLMAPI_TOKEN;

async function testFastApi() {
    console.log(`--- TEST 1: S.A.F.E House FastAPI (${apiBase}) ---`);
    try {
        const response = await axios.get(`${apiBase}/api/health`, { timeout: 5000 });
        console.log("FastAPI health response:", response.data);
    } catch (e) {
        console.log("FastAPI health request failed:");
        if (e.response) {
            console.log("Status:", e.response.status);
            console.log("Data:", JSON.stringify(e.response.data));
        } else {
            console.log("Error:", e.message);
        }
    }

    console.log("\n--- TEST 2: Optional FreeLLMAPI diagnostic ---");
    if (!freeLlmApiToken) {
        console.log("Skipped: set FREELLMAPI_TOKEN in the shell to run the optional legacy diagnostic.");
        return;
    }

    console.log("Skipped by default: the canonical app path uses FastAPI on port 8000.");
    console.log("The supplied token is kept in memory only and is never printed.");
}

testFastApi();
