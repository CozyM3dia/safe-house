/**
 * Deterministic Procedural Narrative Generator.
 *
 * Produces structured 7-section institutional audit markdown reports and
 * technical summaries from verified geotechnical, seismic, and environmental
 * parameters when AI services are loading, offline, or unavailable.
 */

export function generateProceduralNarrative(property, lang = 'id') {
  const isEn = lang === 'en';
  const g = property?.geotech || {};
  const h = property?.hazard || {};
  const env = property?.environment || {};
  const radar = h?.radar || property?.radarData || {};

  const score = Number.isFinite(Number(property?.safe_score ?? property?.safeScore))
    ? Math.max(0, Math.min(100, Math.round(Number(property?.safe_score ?? property?.safeScore))))
    : 50;
  const riskLevel = property?.risk_level || (score >= 70 ? 'safe' : score >= 40 ? 'moderate' : 'danger');
  const auditStatus = property?.audit_status || property?.auditStatus || 'valid';
  const confidence = Number.isFinite(Number(property?.confidence)) ? Number(property.confidence) : 60;

  const address = property?.address || (isEn ? 'Selected Site Location' : 'Lokasi Terpilih');
  const elevation = property?.elevation ?? g?.elevation_m ?? property?.elevasi ?? 0;
  const elevationNum = typeof elevation === 'string' ? parseFloat(elevation) : Number(elevation) || 0;

  const vs30 = g.vs30 ?? property?.vs30 ?? 250;
  const siteClass = g.site_class ?? property?.siteClass ?? 'SD';
  const fs = Number.isFinite(Number(g.fs)) ? Number(g.fs) : 1.2;
  const fsStatus = g.status || (fs >= 1.0 ? (isEn ? 'SAFE' : 'AMAN') : (isEn ? 'HIGH RISK' : 'BERISIKO'));

  const pga = Number.isFinite(Number(g.pga ?? property?.seismic?.pgaBase))
    ? Number(g.pga ?? property?.seismic?.pgaBase)
    : 0.25;
  const pgaSurface = Number.isFinite(Number(g.pga_surface ?? property?.seismic?.pgaSurface))
    ? Number(g.pga_surface ?? property?.seismic?.pgaSurface)
    : Number((pga * 1.2).toFixed(3));
  const fa = Number.isFinite(Number(g.fa))
    ? Number(g.fa)
    : Number((pgaSurface / (pga || 1)).toFixed(2));

  const faultName = g.nearest_fault?.name ?? property?.seismic?.faultName ?? (isEn ? 'Nearest Active Fault' : 'Sesar Terdekat');
  const faultDist = g.nearest_fault?.distance_km ?? property?.seismic?.faultDist;
  const faultDistStr = Number.isFinite(Number(faultDist))
    ? `${Number(faultDist).toFixed(1)} km`
    : (isEn ? 'unavailable' : 'tidak tersedia');

  const volcanoName = g.nearest_volcano?.name;
  const volcanoDist = g.nearest_volcano?.distance_km;
  const megathrustName = g.nearest_megathrust?.name;
  const megathrustDist = g.nearest_megathrust?.distance_km;

  const flood = h.flood_label || (radar.flood > 60 ? (isEn ? 'HIGH' : 'TINGGI') : radar.flood > 30 ? (isEn ? 'MODERATE' : 'SEDANG') : (isEn ? 'LOW' : 'RENDAH'));
  const landslide = h.landslide_label || (radar.landslide > 60 ? (isEn ? 'HIGH' : 'TINGGI') : radar.landslide > 30 ? (isEn ? 'MODERATE' : 'SEDANG') : (isEn ? 'LOW' : 'RENDAH'));
  const subsidence = h.subsidence_label || (radar.subsidence > 60 ? (isEn ? 'HIGH' : 'TINGGI') : (isEn ? 'LOW' : 'RENDAH'));
  const tsunami = h.tsunami || (isEn ? 'LOW' : 'RENDAH');
  const aqi = env.aqi ?? radar.air ?? (isEn ? 'N/A' : 'Tidak tersedia');

  const nearby = Array.isArray(property?.nearby) && property.nearby.length > 0
    ? property.nearby.slice(0, 5).join(', ')
    : (isEn ? 'Surrounding public roads and residential area' : 'Jalan lingkungan dan area pemukiman sekitar');

  // Explanations
  const geoStabilityExplanation = isEn
    ? `The audit estimates Vs30 at ${vs30} m/s (site class ${siteClass}) and liquefaction FS at ${fs.toFixed(2)}, with status ${fsStatus}.`
    : `Audit mengestimasi Vs30 ${vs30} m/s (kelas situs ${siteClass}) dan FS likuefaksi ${fs.toFixed(2)}, dengan status ${fsStatus}.`;

  const seismicExplanation = isEn
    ? `Base PGA is ${pga.toFixed(3)}g and surface PGA is ${pgaSurface.toFixed(3)}g. Nearest mapped fault is ${faultName} at ${faultDistStr}.`
    : `PGA dasar ${pga.toFixed(3)}g dan PGA permukaan ${pgaSurface.toFixed(3)}g. Sesar terpetakan terdekat adalah ${faultName} pada jarak ${faultDistStr}.`;

  const floodEnvExplanation = isEn
    ? `InaRISK area levels: flood ${flood}, landslide ${landslide}. Elevation is ${elevationNum.toFixed(1)} m and AQI is ${aqi}.`
    : `Tingkat bahaya wilayah InaRISK: banjir ${flood}, longsor ${landslide}. Elevasi ${elevationNum.toFixed(1)} m dan AQI ${aqi}.`;

  const microAnalysis = isEn
    ? `Nearby spatial context from OpenStreetMap: ${nearby}. Site access, utilities, and emergency logistics should be verified during planning.`
    : `Konteks spasial OpenStreetMap di sekitar tapak mencakup: ${nearby}. Aksesibilitas, utilitas umum, dan jalur evakuasi perlu diverifikasi.`;

  // 7 Structured Markdown sections
  let detailedReport = '';
  if (isEn) {
    detailedReport = [
      `## Executive Summary & Site Characterization\n\nThe site evaluated at **${address}** obtained an overall **S.A.F.E Score of ${score}/100** (${riskLevel.toUpperCase()}). This audit is categorized as **${auditStatus}** with a data confidence index of **${confidence}%**. The terrain sits at an elevation of ${elevationNum.toFixed(1)} m above sea level. Development on this parcel requires appropriate geotechnical consideration and compliance with national building standards.`,
      `## Geotechnical Conditions & Soil Stability\n\n- **Estimated Vs30:** ${vs30} m/s (SNI 1726 Site Class: **${siteClass}**)\n- **Liquefaction Factor of Safety (FS):** **${fs.toFixed(2)}** (Evaluation: ${fsStatus})\n- **Soil Consistency & Bearing:** Shear wave velocity indicates ${siteClass}-class subsoil profile. Under cyclic seismic loading, liquefaction susceptibility is evaluated as ${fsStatus}. A standard geotechnical boring/CPT investigation is recommended prior to foundation construction.`,
      `## Seismic Hazard & Active-Fault Dynamics\n\n- **Peak Ground Acceleration (PGA):** Base rock PGA is **${pga.toFixed(3)}g**, surface amplified PGA is **${pgaSurface.toFixed(3)}g** (Site coefficient Fa: ${fa}).\n- **Nearest Active Fault:** **${faultName}** located approximately **${faultDistStr}** from the site.`
      + (volcanoName ? `\n- **Volcanic Context:** Nearest active volcano is ${volcanoName} (${volcanoDist ? volcanoDist.toFixed(1) + ' km' : 'nearby'}).` : '')
      + (megathrustName ? `\n- **Megathrust Zone:** ${megathrustName} (${megathrustDist ? megathrustDist.toFixed(1) + ' km' : 'regional'}).` : '')
      + `\n- **Structural Requirement:** Structural frames must be engineered for seismic resistance in accordance with SNI 1726:2019.`,
      `## Hydrometeorological & Environmental Hazards\n\n- **InaRISK BNPB Flood Hazard:** **${flood}**\n- **InaRISK BNPB Landslide Hazard:** **${landslide}**\n- **Ground Subsidence Exposure:** **${subsidence}**\n- **Elevation & Coastal Exposure:** Elevation is ${elevationNum.toFixed(1)} m. Tsunami hazard level: ${tsunami}.\n- **Air Quality Index (AQI):** ${aqi}`,
      `## Spatial Context & Micro-Environment\n\nAnalysis of nearby spatial features indicates surrounding infrastructure includes: ${nearby}. Site accessibility for emergency response and municipal utilities must be factored into development plans.`,
      `## Mitigation & Structural Design Recommendations\n\n**1. Comprehensive Geotechnical Soil Investigation (Borehole & CPT)**\n- Action: Conduct at least 1-2 soil boring tests with SPT and continuous CPT.\n- Rationale: Determine actual soil bearing capacity and depth of hard stratum.\n- Estimated cost: IDR 5,000,000 – 15,000,000\n- Priority: High\n\n**2. Earthquake-Resistant Structural Design (SNI 1726:2019)**\n- Action: Apply moment-resisting frame system (SRPM) with ductile detailing.\n- Rationale: Absorb seismic energy from surface ground acceleration (PGA = ${pgaSurface.toFixed(3)}g).\n- Estimated cost: 5% – 12% of structural budget\n- Priority: High\n\n**3. Site Drainage & Flood Mitigation**\n- Action: Elevate ground floor level (+50cm above road crown) and ensure adequate drainage slope.\n- Rationale: Prevent localized flash flood ponding.\n- Estimated cost: IDR 3,000,000 – 10,000,000\n- Priority: Medium`,
      `## Building Codes & Standards\n\n- **SNI 1726:2019:** Earthquake Resistance Design Standards for Buildings.\n- **SNI 8460:2017:** Geotechnical Design Requirements and Liquefaction Evaluation.\n- **SNI 2847:2019:** Structural Concrete Requirements for Buildings.\n- **PBG (Persetujuan Bangunan Gedung):** Mandatory regulatory building approval according to PP No. 16/2021.`
    ].join('\n\n');
  } else {
    detailedReport = [
      `## Ringkasan Eksekutif & Karakteristik Tapak\n\nLokasi audit pada **${address}** memperoleh nilai keseluruhan **S.A.F.E Score ${score}/100** (${riskLevel.toUpperCase()}). Status kelayakan audit adalah **${auditStatus}** dengan tingkat keyakinan data **${confidence}%**. Ketinggian morfologi tapak berada pada elevasi ${elevationNum.toFixed(1)} meter di atas permukaan laut (mdpl). Pembangunan pada lokasi ini memerlukan penyesuaian rekayasa fondasi serta kepatuhan penuh terhadap standar keselamatan bangunan nasional.`,
      `## Kondisi Geoteknik & Stabilitas Tanah\n\n- **Estimasi Vs30:** ${vs30} m/s (Kelas Situs SNI 1726: **${siteClass}**)\n- **Faktor Keamanan Likuefaksi (FS):** **${fs.toFixed(2)}** (Status: ${fsStatus})\n- **Karakteristik & Daya Dukung Tanah:** Nilai kecepatan gelombang geser mengindikasikan profil perlapisan tanah kelas ${siteClass}. Di bawah beban siklik gempa bumi, kerentanan likuefaksi dievaluasi berstatus ${fsStatus}. Diperlukan pengujian geoteknik langsung (sondir/boring) sebelum pemasangan fondasi permanen.`,
      `## Bahaya Seismik & Dinamika Sesar Aktif\n\n- **Percepatan Tanah Puncak (PGA):** PGA batuan dasar sebesar **${pga.toFixed(3)}g**, dan PGA amplifikasi permukaan sebesar **${pgaSurface.toFixed(3)}g** (Faktor amplifikasi tanah Fa: ${fa}).\n- **Sesar Aktif Terdekat:** **${faultName}** berjarak sekitar **${faultDistStr}** dari lokasi properti (Katalog Sesar Aktif PuSGeN 2024).`
      + (volcanoName ? `\n- **Konteks Gunungapi:** Gunungapi aktif terdekat adalah ${volcanoName} (${volcanoDist ? volcanoDist.toFixed(1) + ' km' : 'terdekat'}).` : '')
      + (megathrustName ? `\n- **Zona Megathrust:** ${megathrustName} (${megathrustDist ? megathrustDist.toFixed(1) + ' km' : 'regional'}).` : '')
      + `\n- **Kepatuhan Struktur:** Struktur rangka bangunan wajib dirancang tahan beban lateral gempa sesuai standar SNI 1726:2019.`,
      `## Bahaya Hidrometeorologi & Lingkungan\n\n- **Bahaya Banjir InaRISK BNPB:** **${flood}**\n- **Bahaya Longsor InaRISK BNPB:** **${landslide}**\n- **Potensi Penurunan Tanah (Subsiden):** **${subsidence}**\n- **Elevasi & Paparan Pesisir:** Elevasi tapak ${elevationNum.toFixed(1)} mdpl. Tingkat risiko tsunami: ${tsunami}.\n- **Indeks Kualitas Udara (AQI):** ${aqi}`,
      `## Konteks Spasial & Mikro-Lingkungan\n\nAnalisis data spasial OpenStreetMap di sekitar titik menunjukkan konteks infrastruktur lingkungan: ${nearby}. Aksesibilitas jalan untuk mobilisasi armada konstruksi, jalur evakuasi bencana, dan ketersediaan utilitas umum perlu diperhitungkan secara matang.`,
      `## Rekomendasi Mitigasi & Desain Struktur\n\n**1. Penyelidikan Geoteknik & Uji Tanah Lapangan (Soil Investigation / CPT / Boring)**\n- Tindakan: Lakukan uji sondir (CPT) hingga kedalaman tanah keras dan pemboran inti (core drilling).\n- Alasan: Memvalidasi daya dukung izin tanah (qa), profil N-SPT aktual, dan elevasi lapisan tanah keras pendukung fondasi.\n- Estimasi biaya: Rp 5.000.000 – Rp 15.000.000\n- Prioritas: Tinggi\n\n**2. Desain Struktur Bangunan Tahan Gempa (SNI 1726:2019)**\n- Tindakan: Terapkan sistem rangka pemikul momen (SRPM) dengan penulangan daktail penuh dan pengikatan sloof/tie-beam.\n- Alasan: Mengantisipasi gaya gempa lateral akibat amplifikasi spektrum percepatan permukaan tanah (PGA = ${pgaSurface.toFixed(3)}g).\n- Estimasi biaya: 5% – 12% dari total anggaran konstruksi struktur\n- Prioritas: Tinggi\n\n**3. Rekayasa Elevasi Peil Banjir & Drainase Resapan**\n- Tindakan: Tinggikan elevasi lantai utama (plinth) minimal +50 cm dari muka jalan tertinggi dan buat saluran drainase tertutup bergradien lancar.\n- Alasan: Mencegah risiko genangan air hujan ekstrem dan limpasan permukaan.\n- Estimasi biaya: Rp 3.000.000 – Rp 10.000.000\n- Prioritas: Menengah`,
      `## Regulasi & Standar Bangunan (SNI)\n\n- **SNI 1726:2019:** Tata Cara Perencanaan Ketahanan Gempa untuk Struktur Bangunan Gedung dan Non Gedung.\n- **SNI 8460:2017:** Persyaratan Perancangan Geoteknik & Evaluasi Potensi Likuefaksi.\n- **SNI 2847:2019:** Persyaratan Beton Struktural untuk Bangunan Gedung.\n- **PBG (Persetujuan Bangunan Gedung):** Kewajiban perizinan konstruksi sesuai PP No. 16/2021.`
    ].join('\n\n');
  }

  return {
    geoStabilityExplanation,
    seismicExplanation,
    floodEnvExplanation,
    microAnalysis,
    detailedReport,
    sources: ['InaRISK BNPB', 'PuSGeN 2024', 'BMKG', 'Badan Informasi Geospasial (BIG)', 'OpenStreetMap'],
    dataLimitations: [
      isEn
        ? 'Preliminary desk study screening. Not a substitute for certified on-site geotechnical soil investigation.'
        : 'Hasil merupakan penapisan desk study awal. Bukan pengganti uji geoteknik langsung di lokasi.'
    ],
    generatedBy: isEn ? 'S.A.F.E House deterministic engine' : 'S.A.F.E House mesin deterministik',
    reportLoading: false,
    deliveryMode: 'fallback',
    aiModel: 'deterministic-engine',
    cacheAgeSeconds: null,
  };
}
