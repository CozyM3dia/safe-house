# S.A.F.E House: Indonesian Geology Knowledge Base
## 1. Active Fault Segments (Fokus: Lampung/Sumatera)
Data ini digunakan untuk menghitung jarak (Proximity) lokasi properti ke jalur sesar aktif.

| Segment Name | Latitude (Start) | Longitude (Start) | Latitude (End) | Longitude (End) | Characteristics |
|--------------|------------------|-------------------|----------------|-----------------|-----------------|
| Semangko Timur (Lampung) | -5.480 | 104.720 | -5.150 | 104.450 | Dextral Strike-Slip, High Activity |
| Semangko Barat (Lampung) | -5.500 | 104.650 | -5.200 | 104.380 | Dextral Strike-Slip, High Activity |
| Sesar Tarahan (Bandar Lampung) | -5.510 | 105.320 | -5.400 | 105.280 | Local fault, impacting coastal areas |

## 2. Lithology & CRR References (Kekuatan Tanah)
Digunakan oleh AI untuk memvalidasi nilai CRR (Cyclic Resistance Ratio).

*   **Aluvium (Qa/Qak):** Endapan sungai/pantai. CRR Sangat Rendah (0.10 - 0.15). Sangat rentan likuefaksi.
*   **Formasi Lampung (Qti):** Tuf, breksi. CRR Menengah (0.25 - 0.35). Moderat.
*   **Batuan Beku/Granit (Pzg):** CRR Tinggi (>0.60). Sangat aman dari likuefaksi.

## 3. SNI 1726:2019 Standards
*   **Kelas Situs SE (Tanah Lunak):** Vs30 < 175 m/s. Amplifikasi gempa tinggi.
*   **Kelas Situs SD (Tanah Sedang):** Vs30 175 - 350 m/s.
*   **Kelas Situs SC (Tanah Keras):** Vs30 350 - 750 m/s.

## 4. Assessment Rules (Reasoning Logic)
1. Jika Jarak Sesar < 10km -> Status: **CAUTION**.
2. Jika Jarak Sesar < 2km -> Status: **DANGER (High Hazard Zone)**.
3. Jika FS Likuefaksi < 1.0 DAN Jarak Sesar < 10km -> **CRITICAL**.
