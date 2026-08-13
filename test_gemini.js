const axios = require('axios');

const GEMINI_API_KEY = "REDACTED_GEMINI_KEY";

async function testGemini() {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${GEMINI_API_KEY}`;
        const response = await axios.post(url, {
            contents: [{ role: "user", parts: [{ text: "Hello, test." }] }],
            generationConfig: {
                responseMimeType: "application/json",
                maxOutputTokens: 2048,
                temperature: 0.4,
            }
        }, { timeout: 30000 });
        console.log("SUCCESS");
        console.log(response.data.candidates[0].content.parts[0].text);
    } catch (e) {
        console.error("ERROR");
        if (e.response) {
            console.error(e.response.status);
            console.error(JSON.stringify(e.response.data, null, 2));
        } else {
            console.error(e.message);
        }
    }
}

testGemini();
