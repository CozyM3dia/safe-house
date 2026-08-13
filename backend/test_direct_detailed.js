import axios from 'axios';

const GEMINI_API_KEY = "AIzaSyApnAAlkThvaKFtitIO5nPKa4-JaaCeNEc";
const model = "gemini-3.1-flash-lite";

const compressedPayload = {
    address: "Bandar Lampung, Lampung, Indonesia",
    coordinates: { lat: -5.43, lon: 105.26 },
    nearby_env: ["highway", "residential"],
    elevasi: "15m",
    reference_pga_city: "Bandar Lampung",
    liquefaction_analysis: {
        fs_score: 0.85,
        status: "RAWAN",
        vs30_est: "160 m/s",
        site_class: "SE",
        pga_design_base: 0.42,
        amplification_fa: 2.4,
        pga_surface: 1.008
    },
    seismotectonic: {
        nearest_fault: { name: "Sesar Tarahan (Bandar Lampung)", dist_km: 11.1 },
        other_nearby_faults: ["Semangko Timur (Lampung) (12km)"],
        nearest_volcano: { name: "G. Krakatau", dist_km: 80.5 },
        megathrust: { name: "Sunda Megathrust (Selat Sunda)", dist_km: 145 }
    },
    tsunami_analysis: { risk_level: "RENDAH", dist_to_coast_km: 8.5, nearest_coast: "Teluk Lampung" },
    flood_hazard: "RENDAH/TIDAK TERDETEKSI",
    landslide_hazard: "RENDAH",
    env_extras: {
        aqi: 45,
        pm25: "11.2 µg/m³",
        temperature: "31.5°C",
        humidity: "72%"
    }
};

const sysPrompt = `You are S.A.F.E AI, a senior Geophysics & Property Risk Consultant specializing in Indonesian geology (SNI 1726:2019, SNI 2847:2019). You write thorough, human-readable, layperson-friendly property risk audit reports.

Tulis SEMUA output dalam Bahasa Indonesia yang mudah dipahami orang awam. Setiap istilah teknis WAJIB dijelaskan artinya dalam tanda kurung atau kalimat berikutnya.

# HASIL AUDIT RISIKO PROPERTI S.A.F.E HOUSE

### RINGKASAN EKSEKUTIF
Tulis 4-5 kalimat untuk calon pembeli awam. Apa gambaran risiko keseluruhan properti ini? Apakah layak dibeli? Perkirakan S.A.F.E Score (0-100, makin tinggi makin aman). Sebutkan bencana historis nyata yang pernah terjadi di area ini.

---

### REFERENSI DATA & DISCLAIMER
- Sumber data: BNPB InaRISK, USGS Earthquake Hazards Program, BMKG via Open-Meteo, SNI 1726:2019, SNI 2847:2019
- DISCLAIMER: Laporan S.A.F.E AI ini dibuat berdasarkan data publik yang tersedia. Laporan ini BUKAN pengganti survei geoteknik profesional langsung di lapangan. Selalu konsultasikan dengan ahli geoteknik bersertifikat sebelum mengambil keputusan pembelian final.`;

async function test() {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
        console.log("Calling direct Gemini...");
        const response = await axios.post(url, {
            contents: [{ role: "user", parts: [{ text: sysPrompt + "\n\n" + JSON.stringify(compressedPayload) }] }],
            generationConfig: {
                maxOutputTokens: 1500,
                temperature: 0.45
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

test();
