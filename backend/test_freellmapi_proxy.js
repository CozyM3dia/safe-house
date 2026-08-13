import axios from 'axios';

async function testFreeLLMAPI() {
    console.log("--- TEST 1: Direct FreeLLMAPI (Port 3003) ---");
    try {
        const response = await axios.post("http://localhost:3003/v1/chat/completions", {
            model: "auto",
            messages: [{ role: "user", content: "Test ping" }]
        }, {
            headers: {
                "Authorization": "Bearer freellmapi-2bf0f2187036654ce98cc273fb82cfcb426d0b23374dbc0c",
                "Content-Type": "application/json"
            },
            timeout: 5000
        });
        console.log("Direct Response Success:", response.data);
    } catch (e) {
        console.log("Direct Response (Expected error because keys are not added yet):");
        if (e.response) {
            console.log("Status:", e.response.status);
            console.log("Data:", JSON.stringify(e.response.data));
        } else {
            console.log("Error:", e.message);
        }
    }

    console.log("\n--- TEST 2: S.A.F.E House Backend Proxy (Port 3001) ---");
    try {
        const response = await axios.post("http://localhost:3001/api/ai/freellmapi", {
            model: "auto",
            messages: [{ role: "user", content: "Test ping" }]
        }, {
            timeout: 5000
        });
        console.log("Proxy Response Success:", response.data);
    } catch (e) {
        console.log("Proxy Response (Expected error because keys are not added yet):");
        if (e.response) {
            console.log("Status:", e.response.status);
            console.log("Data:", JSON.stringify(e.response.data));
        } else {
            console.log("Error:", e.message);
        }
    }
}

testFreeLLMAPI();
