# S.A.F.E House: Project Brief & Competition Strategy
**Competition:** Vibe Coding 2026  
**Lead Developer:** Sibgha Alfirdausi Rambe (President of SEG Student Chapter UNILA 2026)  
**Project Status:** MVP Core v2.6 Stable  
**Timeline:** ~19 Days to Final Submission

---

## 1. KONTEKS KOMPETISI (The Vibe Coding Challenge)
S.A.F.E House dikembangkan sebagai entri utama dalam **Vibe Coding 2026**. Proyek ini bertujuan untuk membuktikan bahwa AI (Gemini 3.1) dapat dikombinasikan dengan data geospasial pemerintah untuk menyelesaikan masalah nyata di Indonesia: **Ketidakpastian keamanan properti di jalur Ring of Fire.**

### Problem Statement:
1. **Asimetri Informasi:** Pembeli rumah sering tidak tahu bahwa calon hunian mereka berdiri di atas jalur sesar aktif atau zona likuefaksi.
2. **Data Terfragmentasi:** Data BNPB (InaRISK), data cuaca, dan data geologi berada di platform terpisah yang sulit dipahami orang awam.
3. **Keterbatasan AI Standar:** AI umum sering berhalusinasi saat ditanya soal koordinat spesifik. S.A.F.E House mengatasi ini dengan *Coordinate-Aware Intelligence*.

---

## 2. FILOSOFI BRANDING: S.A.F.E SCORE
Kita bergeser dari sekadar "Vibe Check" menjadi **S.A.F.E Score**, sebuah standar audit properti yang saintifik:
* **S (Secure):** Proteksi dari banjir dan polusi udara (AQI).
* **A (Assured):** Validasi data real-time via API InaRISK & Open-Meteo.
* **F (Firm):** Stabilitas tanah melalui analisis *Factor of Safety* (FS) Likuefaksi.
* **E (Engineered):** Rekomendasi teknis/fondasi berbasis ilmu Geofisika.

---

## 3. CORE ENGINE & GEOPHYSICS LOGIC (V2.6)
Proyek ini memiliki "otak" geoteknik yang tidak dimiliki aplikasi properti biasa:

### A. Liquefaction Factor of Safety (FS) Engine
Implementasi rumus Seed & Idriss secara asinkron:
- **CSR (Cyclic Stress Ratio):** Dihitung berdasarkan nilai $a_{max}$ (PGA) regional.
- **CRR (Cyclic Resistance Ratio):** Dihitung melalui inferensi elevasi dan litologi.
- **Output:** AI memberikan status "RAWAN" jika $FS < 1.0$.



### B. Geophysics Knowledge Injection
- **Vs30 Inference:** Prediksi klasifikasi situs tanah berdasarkan data elevasi.
- **Regional Fault Awareness:** Deteksi otomatis kedekatan dengan Sesar Semangko, Palu-Koro, dan Lembang.
- **Air Quality Integration:** Penarikan data real-time PM2.5 dan AQI untuk aspek kesehatan lingkungan.

---

## 4. PERJALANAN PENGEMBANGAN (The Development Journey)
- **Phase 1 (The Crisis):** Menghadapi Error 429 *Resource Exhausted* dan transisi API Tier 1.
- **Phase 2 (The Breakthrough):** Berhasil menembus API InaRISK dengan *Radius Query 200m* untuk akurasi mikro.
- **Phase 3 (The Intelligence):** Migrasi ke Gemini 3.1 Flash-Lite dan penyuntikan rumus matematis likuefaksi.
- **Phase 4 (Current):** Stabilisasi Core Engine v2.6.

---

## 5. STRATEGI MENUJU FINAL (Antigravity Planning)

### Fase 1: Data Enrichment (RAG Integration)
Menghubungkan AI dengan "Wikipedia Geologi Indonesia". AI tidak hanya membaca angka, tapi mensitasi Peta Geologi Regional Indonesia untuk menentukan formasi batuan di bawah properti.

### Fase 2: Visualisasi (Streamlit Dashboard)
Membangun UI yang memukau juri:
- **Map View:** Visualisasi pin lokasi.
- **Gauge Meter:** Visualisasi S.A.F.E Score secara dinamis.
- **Technical Cards:** Ringkasan FS Likuefaksi, PGA, dan AQI.

### Fase 3: Local Wisdom (Lampung Focus)
Sebagai mahasiswa UNILA, kita akan memberikan demonstrasi khusus pada **Sesar Semangko Segmen Lampung**, menunjukkan bahwa aplikasi ini sangat akurat untuk konteks lokal namun *scalable* secara nasional.

---
**Motto Kompetisi:** *"Because a home is not just a building; it's a calculated safety for the future."*