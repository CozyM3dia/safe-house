# Analisis — FEMA National Risk Index (NRI)

**URL:** https://hazards.fema.gov/nri/ · metodologi: fema.gov
**Tanggal:** 14 Agustus 2026
**Relevansi:** referensi otoritas pemerintah — peta + skor risiko multi-bahaya. Paling dekat dengan "tool data engineering yang dipercaya".

---

## Apa itu

Indeks risiko bencana alam resmi pemerintah AS (FEMA). Skor risiko per
wilayah (county/census tract) untuk **18 jenis bahaya** — termasuk gempa,
banjir, longsor, tsunami, aktivitas vulkanik. Diakses lewat RAPT (peta
interaktif + data).

## Metodologi skor — layak ditiru konsepnya

**Rumus:** `Risk = Expected Annual Loss × Social Vulnerability ÷ Community Resilience`

- **Skor 0–100** = peringkat persentil dibanding komunitas lain (relatif,
  bukan absolut)
- **Rating kualitatif** "Very Low" → "Very High" mendampingi angka
- **Skor komposit** (semua bahaya) + **skor per-bahaya** terpisah
- **Exposure** dinyatakan dalam dolar (bangunan, populasi, pertanian)

## Yang SafeHouse curi

| Pola | Penerapan |
|---|---|
| **Skor komposit + skor per-bahaya terpisah** | S.A.F.E Score (komposit) + skor per bahaya (banjir/likuefaksi/gempa). SafeHouse sudah punya radar — pertegas hierarkinya |
| **Angka + rating kualitatif berdampingan** | "65 — MODERATE" lebih terbaca daripada angka telanjang. SafeHouse sudah pakai band warna; perkuat labelnya |
| **Skor relatif/persentil** | Opsional: "lebih aman dari X% lokasi di Lampung" — konteks yang bermakna |
| **Exposure dalam rupiah** | Bingkai dampak ke nilai finansial (bangunan berisiko), bukan skor abstrak |
| **Aura pemerintah/otoritas** | Tampilan bersih, data-first, sitasi metodologi. Kredibilitas untuk audiens teknis |

## UI/UX

Pola RAPT = peta canvas + panel indikator/gauge + tabel data. Bahasa visual
GIS/enterprise yang dikenal insinyur. Bersih, tidak flashy, data padat tapi
terbaca. **Ini nada visual yang cocok untuk audiens PBG SafeHouse** — jauh
lebih tepat daripada estetika "command center" yang gamer-y.

## Rubrik kontes

- **UI/UX (15%):** hierarki skor komposit+per-bahaya, angka+rating, nada
  data-first kredibel
- **Business Impact (30%):** exposure dalam rupiah, framing kerugian
- **Problem Solving (20%):** metodologi transparan mendampingi tiap skor

## Catatan

Skala FEMA = per-county (kasar). SafeHouse per-koordinat (lebih presisi) —
itu keunggulan, jangan ditiru mundur ke resolusi wilayah.
