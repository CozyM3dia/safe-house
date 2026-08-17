// Prosa deterministik + format untuk Laporan SNI. Pure — tanpa jsPDF/DOM.
// Angka masuk sebagai primitif; pemilihan kalimat berdasar ambang risiko.

export function riskLabel(score) {
  const s = Number(score);
  if (s >= 70) return 'AMAN';
  if (s >= 40) return 'SEDANG';
  return 'WASPADA';
}

export function formatNum(v, unit = '', digits = 2) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return '—';
  const n = Number(v);
  const s = n.toFixed(digits);
  return unit ? `${s} ${unit}` : s;
}

export function reportNumber(property, date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  let seq;
  if (property?.id) {
    seq = String(property.id).replace(/[^a-fA-F0-9]/g, '').slice(-4).toUpperCase().padStart(4, '0');
  } else {
    const h = Math.abs(Math.round((property?.lat ?? 0) * 1000 + (property?.lon ?? 0) * 1000)) % 10000;
    seq = String(h).padStart(4, '0');
  }
  return `SAFE/${yyyy}/${mm}/${seq}`;
}

export function siteClassDescription(sc) {
  const map = {
    SA: 'Batuan keras (Vs30 > 1500 m/s)',
    SB: 'Batuan (Vs30 750–1500 m/s)',
    SC: 'Tanah keras / batuan lunak (Vs30 350–750 m/s)',
    SD: 'Tanah sedang (Vs30 175–350 m/s)',
    SE: 'Tanah lunak (Vs30 < 175 m/s)',
  };
  return map[sc] || '—';
}

export function executiveSummary(property) {
  const score = property?.safe_score ?? 0;
  const label = riskLabel(score);
  const g = property?.geotech || {};
  const findings = [
    `Kelas situs seismik ${g.site_class || '—'} (${siteClassDescription(g.site_class)}), dengan PGA permukaan ${formatNum(g.pga_surface, 'g', 2)}.`,
  ];
  if (g.fs !== null && g.fs !== undefined) {
    findings.push(
      g.fs < 1.0
        ? `Faktor keamanan likuefaksi FS = ${formatNum(g.fs, '', 2)} (<1,0) menandakan potensi likuefaksi yang perlu diwaspadai.`
        : `Faktor keamanan likuefaksi FS = ${formatNum(g.fs, '', 2)} (≥1,0) relatif aman terhadap likuefaksi.`
    );
  }
  const recommendation =
    score >= 70
      ? 'Lokasi relatif layak; tetap disarankan penyelidikan tanah lapangan untuk desain final.'
      : score >= 40
      ? 'Lokasi memerlukan perhatian mitigasi; penyelidikan tanah lapangan wajib sebelum konstruksi.'
      : 'Lokasi berisiko tinggi; kaji ulang kelayakan dan lakukan penyelidikan geoteknik menyeluruh.';
  const headline = `Berdasarkan audit desk study, lokasi memperoleh Skor S.A.F.E ${score}/100 dengan klasifikasi ${label}.`;
  return { headline, findings, recommendation };
}

export function liquefactionParagraph(fs, status) {
  if (fs === null || fs === undefined) {
    return 'Data faktor keamanan likuefaksi tidak tersedia untuk lokasi ini.';
  }
  if (fs < 1.0 || status === 'RAWAN') {
    return `Faktor keamanan likuefaksi FS = ${formatNum(fs, '', 2)} berada di bawah 1,0 (status ${status || 'RAWAN'}), menandakan potensi likuefaksi pada kondisi gempa desain. Diperlukan mitigasi seperti perbaikan tanah (soil improvement), pondasi dalam, atau kajian geoteknik lanjutan sesuai SNI 8460:2017.`;
  }
  return `Faktor keamanan likuefaksi FS = ${formatNum(fs, '', 2)} (status ${status || 'AMAN'}) menunjukkan lokasi relatif aman terhadap likuefaksi pada kondisi gempa desain. Verifikasi tetap disarankan melalui uji tanah lapangan.`;
}

export function conclusionRecommendations(property) {
  const g = property?.geotech || {};
  const out = [];
  if (g.site_class === 'SE' || g.site_class === 'SD') {
    out.push('Kondisi tanah tergolong lunak–sedang; pertimbangkan pondasi dalam (tiang pancang/bor) dan hindari pondasi dangkal tanpa perbaikan tanah.');
  } else {
    out.push('Kondisi tanah tergolong keras–sedang; pondasi dangkal dapat dipertimbangkan dengan verifikasi daya dukung melalui uji lapangan.');
  }
  if (g.fs !== null && g.fs !== undefined && g.fs < 1.0) {
    out.push('Terdapat potensi likuefaksi (FS<1,0); wajib mitigasi likuefaksi dan penyelidikan tanah detail sesuai SNI 8460:2017.');
  }
  const faultDist = g.nearest_fault?.distance_km;
  if (faultDist !== null && faultDist !== undefined && faultDist < 5) {
    out.push(`Lokasi berdekatan dengan sesar aktif ${g.nearest_fault?.name || ''} (~${formatNum(faultDist, 'km', 1)}); terapkan detailing struktur tahan gempa sesuai SNI 1726:2019.`);
  }
  const coastDist = g.nearest_coast?.distance_km;
  if (coastDist !== null && coastDist !== undefined && coastDist < 10) {
    out.push(`Lokasi dekat garis pantai (~${formatNum(coastDist, 'km', 1)}); pertimbangkan potensi bahaya tsunami dan rob dalam perencanaan.`);
  }
  out.push('Laporan ini adalah desk study; keputusan konstruksi wajib didasarkan pada penyelidikan tanah lapangan (sondir/boring) oleh ahli geoteknik bersertifikat.');
  return out;
}
