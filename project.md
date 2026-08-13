# S.A.F.E House - Project Requirements & Features

## 📌 1. Project Overview
**S.A.F.E House** (Spatial Analyst for Flood and Environment) adalah platform intelijen geospasial yang berfokus pada analisis mendalam terhadap risiko hidrologi (banjir), stabilitas tanah, dan dampak lingkungan hidup di sekitar properti.

## 🚀 2. Core Modules (Fitur Utama)

### A. S.A.F.E Audit (Environment & Flood Analysis)
*   **Flood Risk Intelligence:** Integrasi data InaRISK BNPB untuk analisis probabilitas banjir bandang, genangan, dan longsor.
*   **Geotechnical & Soil Stability:** Estimasi $Vs30$, klasifikasi tanah (SNI 1726:2019), dan risiko likuefaksi saat kondisi tanah jenuh air.
*   **Environmental Health Check:** Deteksi polusi udara (AQI), suhu permukaan tanah, dan risiko polutan air lindi (leachate) dari TPA terdekat.
*   **Topographic Awareness:** Analisis elevasi (mdpl) untuk memetakan jalur aliran air alami di sekitar properti.

### B. S.A.F.E Battle (Comparative Mode)
*   **Spatial Comparison:** Membandingkan dua properti berdasarkan skor ketahanan banjir dan kualitas lingkungan.
*   **Investment Verdict:** AI memberikan rekomendasi berbasis data lingkungan mana yang lebih berkelanjutan (sustainable) untuk hunian jangka panjang.

## ⚙️ 3. Operational Features
*   **Data Export:** Laporan mendalam format PDF/Word.
*   **Interactive Maps:** Tampilan satelit dengan layer risiko yang bisa dinyala-matikan.
*   **Failsafe Brain:** Sistem AI multi-model (Gemini, OpenRouter, Ollama) untuk menjamin audit tetap berjalan di kondisi apapun.

## 📡 4. Data Sources
*   **InaRISK & Open-Meteo:** Fokus utama pada Flood & Weather data.
*   **USGS & Overpass API:** Data seismik dan objek lingkungan (Landfill/TPA).
*   **Google Gemini 2.5 Flash:** Visual Audit via Street View.
