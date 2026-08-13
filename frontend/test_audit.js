import { fetchGeospatialData } from './src/services/engine.js';
import axios from 'axios';

const GEMINI_API_KEY = "AIzaSyApnAAlkThvaKFtitIO5nPKa4-JaaCeNEc";

async function test() {
    const data = await fetchGeospatialData(-6.290046212074113, 106.87191009521486);
    const userPrompt = JSON.stringify(data.compressedPayload);
    
    const sysPrompt = `Anda adalah S.A.F.E (Spatial Analyst for Flood and Environment) AI, sebuah sistem auditor geospasial tingkat lanjut.
    Tugas Anda adalah membaca data geospasial (format JSON padat) dan menghasilkan laporan audit lokasi profesional dalam bahasa Indonesia.`;
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${GEMINI_API_KEY}`;
    console.log("Calling Gemini API...");
    const response = await axios.post(url, {
        contents: [{ role: "user", parts: [{ text: sysPrompt + "\n\n" + userPrompt }] }],
        generationConfig: {
            responseMimeType: "application/json",
            maxOutputTokens: 2048,
            temperature: 0.4,
        }
    }, { timeout: 30000 });
    
    console.log("API returned HTTP", response.status);
    let jsonStr = response.data.candidates[0].content.parts[0].text;
    console.log("Raw output length:", jsonStr.length);
    console.log("FULL JSON:", jsonStr);
}

test().catch(e => {
    console.error("FATAL ERROR:");
    if (e.response && e.response.data) {
        console.error(e.response.status);
        console.error(JSON.stringify(e.response.data, null, 2));
    } else {
        console.error(e);
    }
});
