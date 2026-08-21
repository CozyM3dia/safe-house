import { jsPDF } from 'jspdf';
import { adaptAuditResult } from '../services/auditAdapter.js';
import { ensureLogo, drawLogo } from './brandLogo.js';
import { generateProceduralNarrative } from './proceduralNarrative.js';

/**
 * Laporan audit S.A.F.E House (PDF).
 *
 * Dokumen ini dilampirkan ke berkas perizinan dan difotokopi, jadi halaman
 * isinya dicetak di atas "kertas" hangat, bukan latar gelap seperti aplikasi:
 * halaman gelap penuh menghabiskan toner, membentuk banding, dan hilang
 * terbaca begitu difotokopi. Warna merek tetap hadir lewat pita sampul gelap
 * dan aksen mocha pada garis, label, dan angka.
 *
 * Semua angka berasal dari AuditResult backend. Modul ini hanya menata;
 * tidak ada satu pun nilai yang dihitung ulang di sini.
 */

// ── Token warna ───────────────────────────────────────────────
const C = {
  // Kertas
  paper: [251, 247, 241],
  paperAlt: [244, 238, 229],
  panel: [247, 242, 234],
  // Tinta
  ink: [36, 26, 18],
  inkBody: [74, 58, 44],
  inkMuted: [138, 117, 99],
  rule: [226, 214, 198],
  ruleSoft: [237, 229, 217],
  // Merek
  accent: [178, 107, 52],
  accentSoft: [242, 228, 213],
  band: [23, 17, 12],
  bandInk: [240, 228, 204],
  // Semantik
  safe: [30, 122, 84],
  moderate: [180, 116, 26],
  danger: [192, 57, 43],
  info: [43, 90, 138],
  violet: [110, 74, 140],
  white: [255, 255, 255],
};

const PAGE = { W: 210, H: 297, M: 16 };
const CONTENT_W = PAGE.W - PAGE.M * 2;
const BODY_TOP = 32;
const BODY_BOTTOM = PAGE.H - 22;

function riskHex(score) {
  if (score >= 70) return C.safe;
  if (score >= 40) return C.moderate;
  return C.danger;
}

function riskLabel(score, lang = 'id') {
  if (lang === 'en') {
    if (score >= 70) return 'SAFE';
    if (score >= 40) return 'MODERATE';
    return 'CAUTION';
  }
  if (score >= 70) return 'AMAN';
  if (score >= 40) return 'SEDANG';
  return 'WASPADA';
}

function clampRiskScore(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.min(100, Math.round(numeric))) : 0;
}

/**
 * Keep PDF generation on the same contract as the live audit API.
 *
 * The dashboard stores AuditResult (snake_case), while this renderer uses a
 * compact camelCase view. Normalize at this boundary so the renderer cannot
 * silently recalculate a different score or lose provenance.
 */
export function normalizePdfProperty(property) {
  if (!property) return null;

  const alreadyCompact = property.coords && property.radarData && property.compressedPayload;
  const normalized = alreadyCompact ? { ...property } : adaptAuditResult(property);

  // A live frontend audit may already have the camelCase AI report attached
  // while the rest of the object is still the backend AuditResult shape.
  if (property.aiReport?.detailedReport) normalized.aiReport = property.aiReport;
  if (property.narrative?.detailed_report && !normalized.aiReport?.detailedReport) {
    normalized.aiReport = adaptAuditResult({ ...property, aiReport: property.narrative }).aiReport;
  }
  if (property.narrative?.detailedReport && !normalized.aiReport?.detailedReport) {
    normalized.aiReport = property.narrative;
  }

  if (!normalized.aiReport?.detailedReport && Number.isFinite(normalized.safeScore)) {
    normalized.aiReport = generateProceduralNarrative(property);
  }

  return normalized;
}

function computeScore(p) {
  if (!Number.isFinite(p?.safeScore)) {
    throw new Error('PDF hanya dapat dibuat dari audit dengan skor backend yang valid.');
  }
  return clampRiskScore(p.safeScore);
}

export function getPdfScore(property) {
  return computeScore(normalizePdfProperty(property));
}

export function canExportPdf(property) {
  const normalized = normalizePdfProperty(property);
  return Boolean(
    (normalized?.auditStatus === 'valid' || normalized?.auditStatus === 'provisional') &&
    Number.isFinite(normalized?.safeScore) &&
    normalized?.aiReport?.detailedReport?.trim() &&
    normalized?.aiReport?.reportLoading !== true
  );
}

export function canExportSniReport(property) {
  const normalized = normalizePdfProperty(property);
  return Boolean(
    (normalized?.auditStatus === 'valid' || normalized?.auditStatus === 'provisional') &&
    Number.isFinite(normalized?.safeScore)
  );
}

const PDF_EVIDENCE_LABELS = {
  location: 'Lokasi',
  elevation: 'Elevasi',
  soil: 'Tanah / Vs30',
  seismic: 'PGA',
  fault_reference: 'Referensi sesar',
  flood: 'Banjir',
  landslide: 'Longsor',
  subsidence: 'Subsiden',
  weather: 'Cuaca',
  soil_moisture: 'Kelembapan tanah',
  air_quality: 'Kualitas udara',
  earthquake_history: 'Riwayat gempa',
  nearby: 'Objek sekitar',
  tsunami: 'Tsunami',
  tsunami_map: 'Peta tsunami InaRISK',
  liquefaction_map: 'Peta likuefaksi InaRISK',
  volcanic_map: 'Peta letusan gunungapi InaRISK',
  coastal_map: 'Peta abrasi/gelombang InaRISK',
};

function uniqueStrings(values) {
  return [...new Set((Array.isArray(values) ? values : []).filter(Boolean).map(String))];
}

/**
 * Summarize only fields already present in AuditResult. These are derived
 * indicators for transparency, not new official hazard measurements.
 */
export function getPdfAuditEvidence(property) {
  const normalized = normalizePdfProperty(property) || {};
  const quality = normalized.dataQuality || {};
  const fields = quality.fields || {};
  const entries = Object.entries(fields).map(([key, item]) => ({
    key,
    label: PDF_EVIDENCE_LABELS[key] || key,
    status: item?.status || 'unavailable',
    confidence: Number.isFinite(Number(item?.confidence)) ? Number(item.confidence) : 0,
    source: item?.source || 'sumber tidak tersedia',
  }));
  const count = (status) => entries.filter((entry) => entry.status === status).length;
  const ai = normalized.aiReport || {};

  return {
    status: normalized.auditStatus || 'insufficient_data',
    confidence: Number.isFinite(Number(normalized.confidence)) ? Number(normalized.confidence) : 0,
    scoreVersion: normalized.scoreVersion || 'unknown',
    mode: quality.mode || 'unknown',
    coverageStatus: quality.coverage_status || 'unknown',
    entries,
    officialCount: count('official'),
    estimatedCount: count('model'),
    referenceCount: count('reference') + count('open_data'),
    unavailableCount: count('unavailable'),
    failedSources: uniqueStrings(normalized.sourcesFailed),
    criticalMissing: uniqueStrings(quality.critical_missing),
    optionalMissing: uniqueStrings(quality.optional_missing),
    notScored: uniqueStrings(quality.not_scored),
    scoreAxes: uniqueStrings(quality.score_axes),
    aiModel: ai.aiModel || ai.generatedBy || 'Audit deterministik',
    aiDeliveryMode: ai.deliveryMode || 'unknown',
    aiSources: uniqueStrings(ai.sources),
    aiLimitations: uniqueStrings(ai.dataLimitations),
  };
}

// ── Primitif gambar ───────────────────────────────────────────

function ink(pdf, rgb) {
  pdf.setTextColor(rgb[0], rgb[1], rgb[2]);
}

function fill(pdf, rgb) {
  pdf.setFillColor(rgb[0], rgb[1], rgb[2]);
}

function stroke(pdf, rgb, width = 0.25) {
  pdf.setDrawColor(rgb[0], rgb[1], rgb[2]);
  pdf.setLineWidth(width);
}

function box(pdf, x, y, w, h, { fillColor, borderColor, radius = 2, borderWidth = 0.25 } = {}) {
  if (fillColor) {
    fill(pdf, fillColor);
    pdf.roundedRect(x, y, w, h, radius, radius, 'F');
  }
  if (borderColor) {
    stroke(pdf, borderColor, borderWidth);
    pdf.roundedRect(x, y, w, h, radius, radius, 'S');
  }
}

function hairline(pdf, x, y, w, color = C.rule, width = 0.25) {
  stroke(pdf, color, width);
  pdf.line(x, y, x + w, y);
}

/** Label kecil berspasi lebar — penanda bagian, bukan judul. */
function eyebrow(pdf, text, x, y, { color = C.inkMuted, size = 6.6, align = 'left' } = {}) {
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(size);
  pdf.setCharSpace(0.5);
  ink(pdf, color);
  pdf.text(String(text).toUpperCase(), x, y, { align });
  pdf.setCharSpace(0);
}

/** Busur proporsional — pengganti lingkaran penuh yang dulu selalu utuh. */
function arc(pdf, cx, cy, r, startDeg, sweepDeg, color, width) {
  if (sweepDeg <= 0) return;
  stroke(pdf, color, width);
  pdf.setLineCap('round');
  const steps = Math.max(2, Math.ceil(Math.abs(sweepDeg) / 3));
  const toRad = (deg) => (deg * Math.PI) / 180;
  let prevX = cx + r * Math.cos(toRad(startDeg));
  let prevY = cy + r * Math.sin(toRad(startDeg));
  for (let i = 1; i <= steps; i += 1) {
    const deg = startDeg + (sweepDeg * i) / steps;
    const x = cx + r * Math.cos(toRad(deg));
    const y = cy + r * Math.sin(toRad(deg));
    pdf.line(prevX, prevY, x, y);
    prevX = x;
    prevY = y;
  }
  pdf.setLineCap('butt');
}

/**
 * Gauge skor: busur 270° dibuka di bawah, terisi sebanding nilainya.
 * Versi lama menggambar lingkaran penuh dua kali sehingga cincinnya selalu
 * terlihat 100% berapa pun skornya — pembacaan yang menyesatkan.
 */
function scoreGauge(pdf, cx, cy, r, score, lang) {
  const start = 135;
  const total = 270;
  const color = riskHex(score);

  arc(pdf, cx, cy, r, start, total, C.rule, 3.4);
  arc(pdf, cx, cy, r, start, (total * clampRiskScore(score)) / 100, color, 3.4);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(34);
  ink(pdf, C.ink);
  pdf.text(String(score), cx, cy + 4, { align: 'center' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  ink(pdf, C.inkMuted);
  pdf.text('/100', cx, cy + 10.5, { align: 'center' });

  eyebrow(pdf, riskLabel(score, lang), cx, cy + r - 1, { color, size: 7.4, align: 'center' });
}

/** Batang skala 0–100 dengan tiga zona dan penanda posisi. */
function bandScale(pdf, x, y, w, score, lang) {
  const h = 4;
  const zones = [
    { width: 0.4, color: C.danger, label: lang === 'en' ? 'Caution' : 'Waspada', range: '0-39' },
    { width: 0.3, color: C.moderate, label: lang === 'en' ? 'Moderate' : 'Sedang', range: '40-69' },
    { width: 0.3, color: C.safe, label: lang === 'en' ? 'Safe' : 'Aman', range: '70-100' },
  ];

  let cursor = x;
  zones.forEach((zone) => {
    const zw = w * zone.width;
    fill(pdf, zone.color);
    pdf.rect(cursor, y, zw, h, 'F');
    cursor += zw;
  });

  // Penanda
  const markerX = x + (w * clampRiskScore(score)) / 100;
  fill(pdf, C.ink);
  pdf.triangle(markerX, y - 1.2, markerX - 1.8, y - 4.2, markerX + 1.8, y - 4.2, 'F');
  fill(pdf, C.paper);
  pdf.rect(markerX - 0.35, y, 0.7, h, 'F');

  cursor = x;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6);
  zones.forEach((zone) => {
    const zw = w * zone.width;
    ink(pdf, C.inkMuted);
    pdf.text(`${zone.range}  ${zone.label}`, cursor + zw / 2, y + h + 4, { align: 'center' });
    cursor += zw;
  });
}

/** Kartu angka kunci: label kecil, nilai besar, satu baris arti. */
function kpiTile(pdf, x, y, w, h, { label, value, unit, note, color = C.ink }) {
  box(pdf, x, y, w, h, { fillColor: C.panel, borderColor: C.ruleSoft, radius: 2 });
  fill(pdf, color);
  pdf.rect(x, y + 1.5, 1.4, h - 3, 'F');

  eyebrow(pdf, label, x + 5, y + 6);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(15);
  ink(pdf, color);
  const valueText = String(value);
  pdf.text(valueText, x + 5, y + 15);

  if (unit) {
    const valueWidth = pdf.getTextWidth(valueText);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    ink(pdf, C.inkMuted);
    pdf.text(unit, x + 5 + valueWidth + 1.5, y + 15);
  }

  if (note) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.8);
    ink(pdf, C.inkBody);
    pdf.text(pdf.splitTextToSize(String(note), w - 10).slice(0, 2), x + 5, y + 20.5);
  }
}

/** Baris meter horizontal untuk sumbu risiko. */
function meterRow(pdf, x, y, w, { label, value, color, hint }) {
  const barW = w * 0.52;
  const barX = x + w - barW;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.4);
  ink(pdf, C.inkBody);
  pdf.text(label, x, y + 2.6);

  if (hint) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.2);
    ink(pdf, C.inkMuted);
    pdf.text(hint, x, y + 6.4);
  }

  fill(pdf, C.paperAlt);
  pdf.roundedRect(barX, y, barW - 14, 3.6, 1.8, 1.8, 'F');

  const filled = ((barW - 14) * clampRiskScore(value)) / 100;
  if (filled > 0.8) {
    fill(pdf, color);
    pdf.roundedRect(barX, y, filled, 3.6, 1.8, 1.8, 'F');
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.4);
  ink(pdf, color);
  pdf.text(String(clampRiskScore(value)), x + w, y + 3.2, { align: 'right' });
}

/**
 * Tabel dua kolom label/nilai dengan zebra halus.
 * Menerima `flow` supaya barisnya bisa menyeberang halaman alih-alih
 * tercetak menembus kaki halaman.
 */
function definitionTable(pdf, flow, x, w, rows, { rowH = 8.2, labelW = 0.42 } = {}) {
  rows.forEach(([label, value], index) => {
    flow.need(rowH + 2);
    const rowY = flow.y;
    if (index % 2 === 0) {
      fill(pdf, C.panel);
      pdf.rect(x, rowY, w, rowH, 'F');
    }
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.6);
    ink(pdf, C.inkMuted);
    pdf.text(String(label), x + 3, rowY + rowH / 2 + 1);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    ink(pdf, C.ink);
    const valueText = pdf.splitTextToSize(String(value), w - w * labelW - 6)[0] || '-';
    pdf.text(valueText, x + w - 3, rowY + rowH / 2 + 1, { align: 'right' });
    flow.y = rowY + rowH;
  });
  hairline(pdf, x, flow.y, w, C.ruleSoft);
}

/** Kotak catatan bernada (netral / peringatan). */
function callout(pdf, x, y, w, text, { tone = 'neutral', title } = {}) {
  const toneColor = tone === 'warn' ? C.moderate : tone === 'danger' ? C.danger : C.accent;
  const toneFill = tone === 'neutral' ? C.accentSoft : C.panel;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.4);
  const lines = pdf.splitTextToSize(text, w - 12);
  const h = (title ? 6 : 0) + lines.length * 3.9 + 7;

  box(pdf, x, y, w, h, { fillColor: toneFill, borderColor: C.ruleSoft, radius: 2 });
  fill(pdf, toneColor);
  pdf.rect(x, y + 1.5, 1.4, h - 3, 'F');

  let cursor = y + 5.6;
  if (title) {
    eyebrow(pdf, title, x + 6, cursor, { color: toneColor });
    cursor += 5.4;
  }
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.4);
  ink(pdf, C.inkBody);
  pdf.text(lines, x + 6, cursor);
  return y + h;
}

// ── Kerangka halaman ──────────────────────────────────────────

function paintPage(pdf) {
  fill(pdf, C.paper);
  pdf.rect(0, 0, PAGE.W, PAGE.H, 'F');
}

function pageHeader(pdf, title) {
  const logoH = drawLogo(pdf, PAGE.M + 11, 11, 22, 'light');
  if (logoH === null) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    ink(pdf, C.accent);
    pdf.text('S.A.F.E House', PAGE.M, 16);
  }
  eyebrow(pdf, title, PAGE.W - PAGE.M, 16, { align: 'right' });
  hairline(pdf, PAGE.M, 21, CONTENT_W, C.rule);
}

/** Halaman baru berkerangka lengkap; mengembalikan posisi y awal isi. */
function newContentPage(pdf, title) {
  pdf.addPage();
  paintPage(pdf);
  pageHeader(pdf, title);
  return BODY_TOP;
}

/**
 * Nomor halaman ditempel di akhir supaya totalnya benar. Versi lama menulis
 * "Page 2" secara manual di tiap fungsi dan gampang meleset begitu isi
 * laporan tumbuh menjadi beberapa halaman.
 */
function stampFooters(pdf, lang, docRef) {
  const total = pdf.getNumberOfPages();
  const isEn = lang === 'en';
  for (let page = 2; page <= total; page += 1) {
    pdf.setPage(page);
    hairline(pdf, PAGE.M, PAGE.H - 16, CONTENT_W, C.ruleSoft);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.6);
    ink(pdf, C.inkMuted);
    pdf.text(
      `S.A.F.E House  ${docRef ? `·  ${docRef}` : ''}`.trim(),
      PAGE.M,
      PAGE.H - 11,
    );
    pdf.text(
      isEn ? `Page ${page} of ${total}` : `Halaman ${page} dari ${total}`,
      PAGE.W - PAGE.M,
      PAGE.H - 11,
      { align: 'right' },
    );
  }
}

// ── Turunan deterministik untuk bahasa manusia ────────────────

const RISK_AXES = [
  { key: 'flood', id: 'Banjir', en: 'Flood', color: C.info },
  { key: 'soil', id: 'Likuefaksi tanah', en: 'Soil liquefaction', color: C.moderate },
  { key: 'seismic', id: 'Guncangan gempa', en: 'Seismic shaking', color: C.danger },
  { key: 'landslide', id: 'Longsor', en: 'Landslide', color: C.violet },
  { key: 'subsidence', id: 'Penurunan lahan', en: 'Land subsidence', color: C.accent },
];

function verdictSentence(score, lang) {
  const isEn = lang === 'en';
  if (score >= 70) {
    return isEn
      ? 'Screening finds no dominant hazard at this point. Standard foundation design should suffice, subject to a soil investigation.'
      : 'Screening tidak menemukan bahaya dominan di titik ini. Desain pondasi standar umumnya memadai, dengan catatan tetap dilakukan penyelidikan tanah.';
  }
  if (score >= 40) {
    return isEn
      ? 'One or more hazards need attention. Plan a soil investigation and size the foundation against the parameters listed below.'
      : 'Ada satu atau lebih bahaya yang perlu ditangani. Rencanakan penyelidikan tanah dan sesuaikan pondasi terhadap parameter di bawah ini.';
  }
  return isEn
    ? 'Hazard levels at this point are high. Do not finalise the design before a site-specific geotechnical investigation.'
    : 'Tingkat bahaya di titik ini tinggi. Jangan finalkan desain sebelum ada penyelidikan geoteknik spesifik lokasi.';
}

function topRiskDrivers(radar, lang) {
  return RISK_AXES
    .map((axis) => ({ ...axis, value: clampRiskScore(radar?.[axis.key]) }))
    .filter((axis) => axis.value >= 40)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)
    .map((axis) => ({ label: lang === 'en' ? axis.en : axis.id, value: axis.value, color: axis.color }));
}

function nextSteps(property, score, lang) {
  const isEn = lang === 'en';
  const fs = property?.compressedPayload?.liquefaction_analysis?.fs_score;
  const steps = [];

  steps.push(
    isEn
      ? 'Commission a soil investigation (SPT/CPT) at the exact building footprint.'
      : 'Lakukan penyelidikan tanah (SPT/CPT) tepat di tapak bangunan.',
  );

  if (Number.isFinite(fs) && fs < 1.25) {
    steps.push(
      isEn
        ? `Liquefaction FS is ${fs.toFixed(2)}. Evaluate ground improvement or a deep foundation.`
        : `FS likuefaksi ${fs.toFixed(2)}. Evaluasi perbaikan tanah atau pondasi dalam.`,
    );
  }

  if (Number.isFinite(property?.seismic?.pgaSurface)) {
    steps.push(
      isEn
        ? `Use surface PGA ${property.seismic.pgaSurface.toFixed(3)}g and site class ${property.siteClass ?? '-'} as the SNI 1726:2019 design basis.`
        : `Pakai PGA permukaan ${property.seismic.pgaSurface.toFixed(3)}g dan kelas situs ${property.siteClass ?? '-'} sebagai dasar desain SNI 1726:2019.`,
    );
  }

  if (score < 40) {
    steps.push(
      isEn
        ? 'Compare against an alternative site before committing to the purchase.'
        : 'Bandingkan dengan lokasi alternatif sebelum memutuskan pembelian.',
    );
  }

  return steps.slice(0, 4);
}

function documentRef(property) {
  const lat = property?.coords?.lat ?? 0;
  const lon = property?.coords?.lon ?? 0;
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  return `SH-${stamp}-${Math.abs(Math.round(lat * 1000))}${Math.abs(Math.round(lon * 1000))}`;
}

function formatDate(lang) {
  return new Date().toLocaleString(lang === 'en' ? 'en-GB' : 'id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── Halaman 1: Sampul ─────────────────────────────────────────

function drawCoverPage(pdf, property, score, lang, docRef) {
  const isEn = lang === 'en';
  paintPage(pdf);

  // Pita merek gelap — cukup untuk menegaskan identitas tanpa membanjiri
  // halaman dengan tinta.
  const bandH = 54;
  fill(pdf, C.band);
  pdf.rect(0, 0, PAGE.W, bandH, 'F');
  fill(pdf, C.accent);
  pdf.rect(0, bandH, PAGE.W, 1.2, 'F');

  const logoH = drawLogo(pdf, PAGE.M + 22, 16, 44, 'dark');
  if (logoH === null) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    ink(pdf, C.bandInk);
    pdf.text('S.A.F.E HOUSE', PAGE.M, 28);
  }

  eyebrow(pdf, isEn ? 'Property risk audit' : 'Audit risiko properti', PAGE.W - PAGE.M, 24, {
    color: C.accent,
    align: 'right',
    size: 7,
  });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.4);
  ink(pdf, [150, 128, 104]);
  pdf.text(docRef, PAGE.W - PAGE.M, 30, { align: 'right' });
  pdf.text(formatDate(lang), PAGE.W - PAGE.M, 35.5, { align: 'right' });

  // ── Judul ──
  let y = bandH + 26;
  eyebrow(pdf, isEn ? 'Screening report' : 'Laporan screening', PAGE.M, y, { color: C.accent });
  y += 12;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(30);
  ink(pdf, C.ink);
  pdf.text(isEn ? 'Property Risk' : 'Audit Risiko', PAGE.M, y);
  y += 12.5;
  ink(pdf, C.accent);
  pdf.text(isEn ? 'Audit' : 'Properti', PAGE.M, y);

  // ── Alamat ──
  y += 16;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  ink(pdf, C.inkBody);
  const addressLines = pdf.splitTextToSize(property.address || (isEn ? 'Unknown location' : 'Lokasi tidak diketahui'), CONTENT_W * 0.58);
  pdf.text(addressLines.slice(0, 3), PAGE.M, y);
  y += addressLines.slice(0, 3).length * 5.6 + 2;

  pdf.setFont('courier', 'normal');
  pdf.setFontSize(8.5);
  ink(pdf, C.inkMuted);
  pdf.text(
    `${property.coords.lat.toFixed(6)}, ${property.coords.lon.toFixed(6)}`,
    PAGE.M,
    y,
  );

  // ── Gauge di kolom kanan ──
  scoreGauge(pdf, PAGE.W - PAGE.M - 32, bandH + 58, 28, score, lang);
  eyebrow(pdf, 'S.A.F.E Score', PAGE.W - PAGE.M - 32, bandH + 20, { align: 'center' });

  // ── Bahaya utama: isi yang dulu berupa ruang kosong di tengah sampul ──
  y = 158;
  hairline(pdf, PAGE.M, y - 10, CONTENT_W, C.rule);
  const drivers = topRiskDrivers(property.radarData || {}, lang);
  eyebrow(pdf, isEn ? 'Leading hazards' : 'Bahaya utama', PAGE.M, y);
  y += 7;

  if (drivers.length === 0) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    ink(pdf, C.inkBody);
    pdf.text(
      isEn
        ? 'No hazard axis exceeds the moderate threshold (40 of 100).'
        : 'Tidak ada sumbu bahaya yang melewati ambang sedang (40 dari 100).',
      PAGE.M,
      y + 2,
    );
    y += 10;
  } else {
    drivers.forEach((driver, index) => {
      meterRow(pdf, PAGE.M, y + index * 11, CONTENT_W, {
        label: driver.label,
        value: driver.value,
        color: driver.color,
      });
    });
    y += drivers.length * 11 + 2;
  }

  // ── Strip metadata ──
  y += 16;
  hairline(pdf, PAGE.M, y - 8, CONTENT_W, C.rule);
  const meta = [
    [isEn ? 'Audit status' : 'Status audit', String(property.auditStatus || '-').toUpperCase()],
    [isEn ? 'Site class' : 'Kelas situs', String(property.siteClass || '-')],
    [isEn ? 'Score version' : 'Versi skor', String(property.scoreVersion || '-')],
    [isEn ? 'Reference' : 'Acuan', 'SNI 1726:2019'],
  ];
  const colW = CONTENT_W / meta.length;
  meta.forEach(([label, value], index) => {
    const x = PAGE.M + index * colW;
    if (index > 0) {
      stroke(pdf, C.ruleSoft, 0.25);
      pdf.line(x - 3, y - 4, x - 3, y + 12);
    }
    eyebrow(pdf, label, x, y);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.6);
    ink(pdf, C.ink);
    // Strip sampul hanya punya satu baris per kolom; nilai panjang seperti
    // versi skor dipangkas di sini dan tampil utuh di halaman Dasar data.
    pdf.text(pdf.splitTextToSize(shortText(value, 24), colW - 6)[0] || '-', x, y + 7.5);
  });

  // ── Kaki sampul ──
  hairline(pdf, PAGE.M, PAGE.H - 26, CONTENT_W, C.rule);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.8);
  ink(pdf, C.inkMuted);
  pdf.text(
    isEn
      ? 'Data-based preliminary screening. Not a substitute for a site-specific geotechnical investigation.'
      : 'Screening awal berbasis data. Bukan pengganti penyelidikan geoteknik spesifik lokasi.',
    PAGE.M,
    PAGE.H - 20,
  );
  pdf.text('InaRISK BNPB  ·  PuSGeN 2024  ·  USGS  ·  Open-Meteo', PAGE.M, PAGE.H - 15.5);

  fill(pdf, C.accent);
  pdf.rect(0, PAGE.H - 3, PAGE.W, 3, 'F');
}

// ── Halaman 2: Ringkasan ──────────────────────────────────────

function drawSummaryPage(pdf, property, score, lang) {
  const isEn = lang === 'en';
  const title = isEn ? 'Summary' : 'Ringkasan';
  newContentPage(pdf, title);
  const flow = createFlow(pdf, title);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(17);
  ink(pdf, C.ink);
  pdf.text(isEn ? 'What you need to know' : 'Yang perlu Anda ketahui', PAGE.M, flow.y);
  flow.y += 8;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.4);
  ink(pdf, C.inkBody);
  const verdictLines = pdf.splitTextToSize(verdictSentence(score, lang), CONTENT_W);
  pdf.text(verdictLines, PAGE.M, flow.y);
  flow.y += verdictLines.length * 5 + 8;

  let y = flow.y;

  // ── Skala band ──
  box(pdf, PAGE.M, y, CONTENT_W, 34, { fillColor: C.panel, borderColor: C.ruleSoft });
  eyebrow(pdf, isEn ? 'Score band' : 'Posisi skor', PAGE.M + 6, y + 7);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  ink(pdf, riskHex(score));
  pdf.text(`${score} · ${riskLabel(score, lang)}`, PAGE.W - PAGE.M - 6, y + 7.4, { align: 'right' });
  bandScale(pdf, PAGE.M + 6, y + 17, CONTENT_W - 12, score, lang);
  y += 42;

  // ── Angka kunci ──
  eyebrow(pdf, isEn ? 'Key figures' : 'Angka kunci', PAGE.M, y);
  y += 5;

  const payload = property.compressedPayload ?? {};
  const fs = payload.liquefaction_analysis?.fs_score;
  const radar = property.radarData || {};
  const floodValue = clampRiskScore(radar.flood);

  const tiles = [
    {
      label: 'Vs30',
      value: property.vs30 ?? '-',
      unit: 'm/s',
      note: isEn
        ? `Site class ${property.siteClass ?? '-'} under SNI 1726:2019.`
        : `Kelas situs ${property.siteClass ?? '-'} menurut SNI 1726:2019.`,
      color: C.accent,
    },
    {
      label: isEn ? 'Surface PGA' : 'PGA permukaan',
      value: Number.isFinite(property.seismic?.pgaSurface) ? property.seismic.pgaSurface.toFixed(3) : '-',
      unit: 'g',
      note: isEn
        ? 'Design ground acceleration after site amplification.'
        : 'Percepatan tanah desain setelah amplifikasi situs.',
      color: C.danger,
    },
    {
      label: isEn ? 'Liquefaction FS' : 'FS likuefaksi',
      value: Number.isFinite(fs) ? fs.toFixed(2) : '-',
      unit: '',
      note: Number.isFinite(fs)
        ? fs < 1
          ? isEn ? 'Below 1.00 - liquefaction is plausible.' : 'Di bawah 1,00 - likuefaksi mungkin terjadi.'
          : isEn ? 'At or above 1.00 - no liquefaction indicated.' : 'Di atas 1,00 - tidak ada indikasi likuefaksi.'
        : isEn ? 'Not computed for this point.' : 'Belum dihitung untuk titik ini.',
      color: Number.isFinite(fs) && fs < 1 ? C.danger : C.safe,
    },
    {
      label: isEn ? 'Flood hazard' : 'Bahaya banjir',
      value: floodValue,
      unit: '/100',
      note: isEn ? 'InaRISK BNPB national hazard index.' : 'Indeks bahaya nasional InaRISK BNPB.',
      color: floodValue >= 70 ? C.danger : floodValue >= 40 ? C.moderate : C.safe,
    },
  ];

  const tileW = (CONTENT_W - 6) / 2;
  tiles.forEach((tile, index) => {
    const x = PAGE.M + (index % 2) * (tileW + 6);
    const ty = y + Math.floor(index / 2) * 32;
    kpiTile(pdf, x, ty, tileW, 28, tile);
  });
  y += 70;

  flow.y = y;

  // ── Langkah berikutnya ──
  flow.need(14);
  eyebrow(pdf, isEn ? 'Next steps' : 'Langkah berikutnya', PAGE.M, flow.y);
  flow.y += 7;

  nextSteps(property, score, lang).forEach((step, index) => {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.6);
    const lines = pdf.splitTextToSize(step, CONTENT_W - 12);
    flow.need(lines.length * 4.6 + 6);

    fill(pdf, C.accentSoft);
    pdf.circle(PAGE.M + 3, flow.y + 1.4, 2.7, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.6);
    ink(pdf, C.accent);
    pdf.text(String(index + 1), PAGE.M + 3, flow.y + 2.5, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.6);
    ink(pdf, C.inkBody);
    pdf.text(lines, PAGE.M + 9, flow.y + 2.6);
    flow.y += lines.length * 4.6 + 4.6;
  });

  flow.y += 6;
  flow.need(28);
  callout(
    pdf,
    PAGE.M,
    flow.y,
    CONTENT_W,
    isEn
      ? 'The S.A.F.E Score summarises hazard exposure at one coordinate. It does not measure soil bearing capacity, building condition, or legal status, and it never replaces a site-specific investigation.'
      : 'S.A.F.E Score merangkum paparan bahaya pada satu koordinat. Skor ini tidak mengukur daya dukung tanah, kondisi bangunan, atau status legalitas, dan tidak menggantikan penyelidikan spesifik lokasi.',
    { title: isEn ? 'What the score does not cover' : 'Yang tidak dicakup skor' },
  );
}

// ── Halaman 3: Rincian teknis ─────────────────────────────────

function drawDetailPage(pdf, property, lang) {
  const isEn = lang === 'en';
  const title = isEn ? 'Technical detail' : 'Rincian teknis';
  newContentPage(pdf, title);
  const flow = createFlow(pdf, title);
  let y = flow.y;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(17);
  ink(pdf, C.ink);
  pdf.text(isEn ? 'Hazard breakdown' : 'Rincian bahaya', PAGE.M, y);
  y += 6;

  // Arah skala sumbu bahaya berlawanan dengan S.A.F.E Score; tanpa keterangan
  // ini pembaca menyangka angka besar selalu berarti baik.
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.4);
  ink(pdf, C.inkMuted);
  pdf.text(
    isEn
      ? 'On this scale 0 means low hazard and 100 means high hazard - the opposite direction to the S.A.F.E Score.'
      : 'Pada skala ini 0 berarti bahaya rendah dan 100 berarti bahaya tinggi - arahnya kebalikan dari S.A.F.E Score.',
    PAGE.M,
    y + 4,
  );
  y += 14;

  const radar = property.radarData || {};
  RISK_AXES.forEach((axis, index) => {
    meterRow(pdf, PAGE.M, y + index * 12.5, CONTENT_W, {
      label: lang === 'en' ? axis.en : axis.id,
      value: radar[axis.key],
      color: axis.color,
    });
  });
  y += RISK_AXES.length * 12.5 + 6;

  // ── Parameter ──
  hairline(pdf, PAGE.M, y, CONTENT_W, C.rule);
  y += 8;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  ink(pdf, C.ink);
  pdf.text(isEn ? 'Parameters' : 'Parameter', PAGE.M, y);
  y += 5;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.4);
  ink(pdf, C.inkMuted);
  const readingNote = pdf.splitTextToSize(
    isEn
      ? 'Vs30 sets the site class, which amplifies bedrock PGA into the surface PGA used for design. A liquefaction FS below 1.00 means the saturated layer can lose strength during shaking.'
      : 'Vs30 menentukan kelas situs, yang mengamplifikasi PGA batuan dasar menjadi PGA permukaan untuk desain. FS likuefaksi di bawah 1,00 berarti lapisan jenuh air bisa kehilangan kekuatan saat guncangan.',
    CONTENT_W,
  );
  pdf.text(readingNote, PAGE.M, y + 3.4);
  y += readingNote.length * 3.8 + 6;

  const payload = property.compressedPayload ?? {};
  const seismotectonic = payload.seismotectonic || {};
  const tsunami = payload.tsunami_analysis || {};
  const env = payload.env_extras || {};
  const fs = payload.liquefaction_analysis?.fs_score;

  const rows = [
    [isEn ? 'Elevation' : 'Elevasi', `${property.elevasi ?? '-'} mdpl`],
    ['Vs30', `${property.vs30 ?? '-'} m/s  (${property.siteClass ?? '-'})`],
    [isEn ? 'Bedrock PGA' : 'PGA batuan dasar', `${property.seismic?.pgaBase ?? '-'} g`],
    [isEn ? 'Surface PGA' : 'PGA permukaan', `${property.seismic?.pgaSurface?.toFixed(3) ?? '-'} g`],
    [
      isEn ? 'Site amplification (Fa)' : 'Amplifikasi situs (Fa)',
      `${payload.liquefaction_analysis?.amplification_fa ?? '-'} x`,
    ],
    [isEn ? 'Liquefaction FS' : 'FS likuefaksi', Number.isFinite(fs) ? fs.toFixed(2) : '-'],
    [
      isEn ? 'Nearest active fault' : 'Sesar aktif terdekat',
      `${property.seismic?.faultName ?? '-'}  (${property.seismic?.faultDist ?? '-'} km)`,
    ],
    [
      isEn ? 'Megathrust zone' : 'Zona megathrust',
      seismotectonic.megathrust
        ? `${seismotectonic.megathrust.name} (${seismotectonic.megathrust.dist_km} km)`
        : '-',
    ],
    [
      isEn ? 'Nearest volcano' : 'Gunung api terdekat',
      seismotectonic.nearest_volcano
        ? `${seismotectonic.nearest_volcano.name} (${seismotectonic.nearest_volcano.dist_km} km)`
        : '-',
    ],
    [
      isEn ? 'Tsunami exposure' : 'Paparan tsunami',
      `${tsunami.risk_level ?? '-'}  (${tsunami.dist_to_coast_km ?? '-'} km ${isEn ? 'to coast' : 'ke pantai'})`,
    ],
    [isEn ? 'Air quality (AQI)' : 'Kualitas udara (AQI)', `${env.aqi ?? '-'}  (PM2.5 ${env.pm25 ?? '-'})`],
  ];

  flow.y = y;
  definitionTable(pdf, flow, PAGE.M, CONTENT_W, rows);
  flow.y += 8;

  // ── Riwayat gempa ──
  const historical = payload.historical_earthquakes || [];
  const historyText = historical.length
    ? historical
        .slice(0, 3)
        .map((eq) => `M${eq.magnitude} · ${eq.place}${eq.date ? ` (${String(eq.date).split(',')[0]})` : ''}`)
        .join('   ')
    : isEn
      ? 'No M4.5+ event recorded within 100 km in the USGS catalogue.'
      : 'Tidak ada gempa M4,5+ tercatat dalam radius 100 km pada katalog USGS.';

  flow.need(28);
  callout(pdf, PAGE.M, flow.y, CONTENT_W, historyText, {
    title: isEn ? 'Recent seismicity (USGS)' : 'Kegempaan terkini (USGS)',
  });
}

// ── Halaman 4: Dasar data ─────────────────────────────────────

function evidenceStatusLabel(status, lang) {
  const labels = lang === 'en'
    ? { official: 'OFFICIAL', model: 'MODEL', reference: 'REFERENCE', open_data: 'OPEN DATA', unavailable: 'UNAVAILABLE' }
    : { official: 'RESMI', model: 'MODEL', reference: 'REFERENSI', open_data: 'OPEN DATA', unavailable: 'BELUM TERSEDIA' };
  return labels[status] || String(status || '-').toUpperCase();
}

function evidenceStatusColor(status) {
  if (status === 'official') return C.safe;
  if (status === 'model') return C.moderate;
  if (status === 'unavailable') return C.inkMuted;
  return C.info;
}

function shortText(value, maxLength = 74) {
  const text = String(value ?? '-').replace(/\s+/g, ' ').trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function drawEvidencePage(pdf, property, lang) {
  const isEn = lang === 'en';
  const evidence = getPdfAuditEvidence(property);
  const title = isEn ? 'Data basis' : 'Dasar data';
  newContentPage(pdf, title);
  const flow = createFlow(pdf, title);
  let y = flow.y;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(17);
  ink(pdf, C.ink);
  pdf.text(isEn ? 'Where the numbers come from' : 'Dari mana angkanya berasal', PAGE.M, y);
  y += 7;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.2);
  ink(pdf, C.inkBody);
  pdf.text(
    pdf.splitTextToSize(
      isEn
        ? 'Every field below is traced to its source. The deterministic engine produces the score; the written report only explains it and cannot change any value.'
        : 'Setiap field di bawah ini dilacak sampai ke sumbernya. Mesin deterministik yang menghasilkan skor; laporan naratif hanya menjelaskan dan tidak dapat mengubah nilai apa pun.',
      CONTENT_W,
    ),
    PAGE.M,
    y + 4,
  );
  y += 13;

  // Peringatan ini dulu berupa kotak di akhir halaman dan selalu terdorong
  // sendirian ke halaman berikutnya. Sebagai catatan ringkas di kepala
  // halaman, isinya justru terbaca sebelum tabelnya.
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.4);
  ink(pdf, C.moderate);
  const caveat = pdf.splitTextToSize(
    isEn
      ? 'Model and proxy fields are screening indicators, not official hazard-map observations. A field survey remains necessary for final engineering or permitting decisions.'
      : 'Field model dan proxy adalah indikator screening, bukan observasi peta bahaya resmi. Survei lapangan tetap diperlukan untuk keputusan teknik atau perizinan akhir.',
    CONTENT_W - 6,
  );
  fill(pdf, C.moderate);
  pdf.rect(PAGE.M, y - 2.6, 1.2, caveat.length * 3.9 + 1.4, 'F');
  pdf.text(caveat, PAGE.M + 4, y);
  y += caveat.length * 3.9 + 7;

  // ── Ringkasan cakupan ──
  const summary = [
    [isEn ? 'Official' : 'Resmi', evidence.officialCount, C.safe],
    [isEn ? 'Model / proxy' : 'Model / proxy', evidence.estimatedCount, C.moderate],
    [isEn ? 'Reference' : 'Referensi', evidence.referenceCount, C.info],
    [isEn ? 'Unavailable' : 'Belum tersedia', evidence.unavailableCount, C.inkMuted],
  ];
  const cardW = (CONTENT_W - 9) / 4;
  summary.forEach(([label, value, color], index) => {
    const x = PAGE.M + index * (cardW + 3);
    box(pdf, x, y, cardW, 17, { fillColor: C.panel, borderColor: C.ruleSoft });
    fill(pdf, color);
    pdf.rect(x, y + 1.5, 1.4, 14, 'F');
    eyebrow(pdf, label, x + 5, y + 6.4);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    ink(pdf, color);
    pdf.text(String(value), x + 5, y + 14);
  });
  y += 24;

  flow.y = y;

  // ── Metadata audit ──
  // Blok pendek ini sengaja mendahului tabel provenance yang panjang: kalau
  // urutannya dibalik, sisa satu-dua baris metadata terdorong ke halaman
  // berikutnya dan menghasilkan halaman nyaris kosong.
  const metaRows = [
    [isEn ? 'Audit status' : 'Status audit', String(evidence.status).toUpperCase()],
    [isEn ? 'Score version' : 'Versi skor', shortText(evidence.scoreVersion, 34)],
    [isEn ? 'Data mode' : 'Mode data', shortText(evidence.mode, 34)],
    [isEn ? 'Scored axes' : 'Sumbu yang dinilai', String(evidence.scoreAxes.length || '-')],
    [
      isEn ? 'Not scored' : 'Tidak dinilai',
      shortText(evidence.notScored.join(', ') || '-', 44),
    ],
    [
      isEn ? 'Missing fields' : 'Field belum tersedia',
      shortText([...evidence.criticalMissing, ...evidence.optionalMissing].join(', ') || '-', 44),
    ],
    [isEn ? 'Narrative engine' : 'Mesin naratif', shortText(evidence.aiModel, 34)],
  ];
  flow.need(14);
  eyebrow(pdf, isEn ? 'Audit metadata' : 'Metadata audit', PAGE.M, flow.y);
  flow.y += 5;
  definitionTable(pdf, flow, PAGE.M, CONTENT_W, metaRows, { rowH: 6.9 });
  flow.y += 8;

  // ── Tabel provenance ──
  const colField = PAGE.M + 2;
  const colStatus = PAGE.M + 46;
  const colSource = PAGE.M + 82;
  // Tinggi baris menyesuaikan sisa halaman: kalau tabelnya hanya meleset
  // satu-dua baris, memampatkannya sedikit jauh lebih terbaca daripada
  // membuang sisanya ke halaman yang nyaris kosong.
  const rowCount = evidence.entries.length || 1;
  let rowH = 6.6;

  const drawTableHead = (withTitle) => {
    if (withTitle) {
      eyebrow(pdf, isEn ? 'Field provenance' : 'Provenance per field', PAGE.M, flow.y);
      flow.y += 5;
    }
    fill(pdf, C.paperAlt);
    pdf.rect(PAGE.M, flow.y, CONTENT_W, 6.5, 'F');
    eyebrow(pdf, 'Field', colField, flow.y + 4.3, { size: 6 });
    eyebrow(pdf, 'Status', colStatus, flow.y + 4.3, { size: 6 });
    eyebrow(pdf, isEn ? 'Source' : 'Sumber', colSource, flow.y + 4.3, { size: 6 });
    flow.y += 6.5;
  };

  flow.need(24);
  drawTableHead(true);
  rowH = Math.max(5.6, Math.min(6.6, (BODY_BOTTOM - flow.y - 0.8) / rowCount));

  const entries = evidence.entries;
  if (entries.length === 0) {
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(8);
    ink(pdf, C.inkMuted);
    pdf.text(
      isEn ? 'No field-level provenance is available.' : 'Provenance per field belum tersedia.',
      colField,
      flow.y + 5,
    );
    return;
  }

  entries.forEach((entry, index) => {
    const pagesBefore = pdf.getNumberOfPages();
    flow.need(rowH);
    // Tabel yang menyeberang halaman tanpa kepala kolom jadi tak terbaca.
    if (pdf.getNumberOfPages() !== pagesBefore) drawTableHead(false);

    const rowY = flow.y;
    if (index % 2 === 1) {
      fill(pdf, C.panel);
      pdf.rect(PAGE.M, rowY, CONTENT_W, rowH, 'F');
    }
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.4);
    ink(pdf, C.ink);
    const baseline = rowY + rowH / 2 + 1.4;
    pdf.text(shortText(entry.label, 24), colField, baseline);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.2);
    ink(pdf, evidenceStatusColor(entry.status));
    pdf.text(evidenceStatusLabel(entry.status, lang), colStatus, baseline);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    ink(pdf, C.inkBody);
    pdf.text(shortText(entry.source, 62), colSource, baseline);
    flow.y = rowY + rowH;
  });
  hairline(pdf, PAGE.M, flow.y, CONTENT_W, C.rule);
}

// ── Visual sisipan dalam laporan naratif ──────────────────────

/** Strip skala kelas situs SNI 1726:2019 dengan penanda posisi Vs30. */
function drawSiteClassStrip(pdf, property, flow, lang) {
  const isEn = lang === 'en';
  const vs30 = Number(property?.vs30);
  if (!Number.isFinite(vs30)) return;

  flow.need(34);
  const y = flow.y;
  const w = CONTENT_W;

  box(pdf, PAGE.M, y, w, 30, { fillColor: C.panel, borderColor: C.ruleSoft });
  eyebrow(pdf, isEn ? 'Site class scale (SNI 1726:2019)' : 'Skala kelas situs (SNI 1726:2019)', PAGE.M + 5, y + 6);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  ink(pdf, C.accent);
  pdf.text(`${vs30} m/s · ${property.siteClass ?? '-'}`, PAGE.W - PAGE.M - 5, y + 6.4, { align: 'right' });

  const classes = [
    { name: 'SE', label: isEn ? 'Soft' : 'Lunak', range: '<180', color: C.danger },
    { name: 'SD', label: isEn ? 'Medium' : 'Sedang', range: '180-360', color: C.moderate },
    { name: 'SC', label: isEn ? 'Dense' : 'Keras', range: '360-760', color: C.safe },
    { name: 'SB/SA', label: isEn ? 'Rock' : 'Batuan', range: '>760', color: C.info },
  ];
  let activeIdx = 0;
  if (vs30 >= 760) activeIdx = 3;
  else if (vs30 >= 360) activeIdx = 2;
  else if (vs30 >= 180) activeIdx = 1;

  const cellW = (w - 10 - 9) / 4;
  classes.forEach((cls, index) => {
    const x = PAGE.M + 5 + index * (cellW + 3);
    const active = index === activeIdx;
    box(pdf, x, y + 11, cellW, 14, {
      fillColor: active ? C.white : C.paperAlt,
      borderColor: active ? cls.color : C.ruleSoft,
      borderWidth: active ? 0.6 : 0.2,
    });
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    ink(pdf, active ? cls.color : C.inkMuted);
    pdf.text(cls.name, x + cellW / 2, y + 16, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6);
    ink(pdf, C.inkMuted);
    pdf.text(`${cls.label}  ${cls.range}`, x + cellW / 2, y + 21.5, { align: 'center' });
  });

  flow.y = y + 36;
}

/** Skala FS likuefaksi: ambang 1,00 ditandai eksplisit. */
function drawLiquefactionStrip(pdf, property, flow, lang) {
  const isEn = lang === 'en';
  const fs = Number(property?.compressedPayload?.liquefaction_analysis?.fs_score);
  if (!Number.isFinite(fs)) return;

  flow.need(30);
  const y = flow.y;
  const w = CONTENT_W;

  box(pdf, PAGE.M, y, w, 26, { fillColor: C.panel, borderColor: C.ruleSoft });
  eyebrow(pdf, isEn ? 'Liquefaction factor of safety' : 'Faktor keamanan likuefaksi', PAGE.M + 5, y + 6);

  const safeSide = fs >= 1;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  ink(pdf, safeSide ? C.safe : C.danger);
  pdf.text(
    `FS ${fs.toFixed(2)} · ${safeSide ? (isEn ? 'ABOVE THRESHOLD' : 'DI ATAS AMBANG') : (isEn ? 'BELOW THRESHOLD' : 'DI BAWAH AMBANG')}`,
    PAGE.W - PAGE.M - 5,
    y + 6.4,
    { align: 'right' },
  );

  const barX = PAGE.M + 5;
  const barY = y + 13;
  const barW = w - 10;
  const barH = 3.4;

  fill(pdf, C.danger);
  pdf.rect(barX, barY, barW / 2, barH, 'F');
  fill(pdf, C.safe);
  pdf.rect(barX + barW / 2, barY, barW / 2, barH, 'F');

  // Ambang FS = 1,00 berada tepat di tengah skala 0-2.
  fill(pdf, C.ink);
  pdf.rect(barX + barW / 2 - 0.25, barY - 1.6, 0.5, barH + 3.2, 'F');

  // Dijaga tetap di dalam batang: FS >= 2 kalau tidak akan menaruh penanda
  // menggantung di luar skala.
  const markerX = barX + Math.max(0.012, Math.min(0.988, fs / 2)) * barW;
  fill(pdf, C.ink);
  pdf.triangle(markerX, barY - 1.4, markerX - 1.7, barY - 4.4, markerX + 1.7, barY - 4.4, 'F');

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6);
  ink(pdf, C.inkMuted);
  pdf.text('0.00', barX, barY + 7);
  pdf.text(isEn ? '1.00  threshold' : '1,00  ambang', barX + barW / 2, barY + 7, { align: 'center' });
  pdf.text('2.00+', barX + barW, barY + 7, { align: 'right' });

  flow.y = y + 32;
}

/** Skala PGA permukaan dengan konteks sesar terdekat. */
function drawSeismicStrip(pdf, property, flow, lang) {
  const isEn = lang === 'en';
  const pga = Number(property?.seismic?.pgaSurface);
  if (!Number.isFinite(pga)) return;

  flow.need(30);
  const y = flow.y;
  const w = CONTENT_W;

  box(pdf, PAGE.M, y, w, 26, { fillColor: C.panel, borderColor: C.ruleSoft });
  eyebrow(pdf, isEn ? 'Design ground acceleration' : 'Percepatan tanah desain', PAGE.M + 5, y + 6);

  const pgaColor = pga >= 0.5 ? C.danger : pga >= 0.3 ? C.moderate : C.safe;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  ink(pdf, pgaColor);
  pdf.text(`${pga.toFixed(3)} g`, PAGE.W - PAGE.M - 5, y + 6.4, { align: 'right' });

  const barX = PAGE.M + 5;
  const barY = y + 13;
  const barW = w - 10;

  fill(pdf, C.paperAlt);
  pdf.roundedRect(barX, barY, barW, 3.4, 1.7, 1.7, 'F');
  const filled = Math.max(0, Math.min(1, pga / 0.8)) * barW;
  if (filled > 1) {
    fill(pdf, pgaColor);
    pdf.roundedRect(barX, barY, filled, 3.4, 1.7, 1.7, 'F');
  }

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6);
  ink(pdf, C.inkMuted);
  pdf.text('0.0 g', barX, barY + 7);
  pdf.text(
    `${property.seismic?.faultName ?? '-'}  ·  ${property.seismic?.faultDist ?? '-'} km`,
    barX + barW / 2,
    barY + 7,
    { align: 'center' },
  );
  pdf.text('0.8 g', barX + barW, barY + 7, { align: 'right' });

  flow.y = y + 32;
}

// ── Laporan naratif ───────────────────────────────────────────

function createFlow(pdf, title) {
  const flow = {
    y: BODY_TOP,
    title,
    need(height) {
      if (this.y + height > BODY_BOTTOM) {
        this.y = newContentPage(pdf, this.title);
      }
      return this.y;
    },
  };
  return flow;
}

function cleanInline(text) {
  return String(text)
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/→/g, '->');
}

function parseBlocks(report) {
  const blocks = [];
  let table = null;
  report.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('|')) {
      if (!table) table = [];
      table.push(trimmed);
      return;
    }
    if (table) {
      blocks.push({ type: 'table', rows: table });
      table = null;
    }
    blocks.push({ type: 'line', text: trimmed });
  });
  if (table) blocks.push({ type: 'table', rows: table });
  return blocks;
}

function renderTable(pdf, rows, flow) {
  const parsed = rows
    .map((row) =>
      row
        .split('|')
        .map((cell) => cell.trim())
        .filter((_, index, arr) => index > 0 && index < arr.length - 1),
    )
    .filter(
      (row) =>
        row.length > 0 &&
        !row.every((cell) => cell.split('').every((ch) => ch === '-' || ch === ':' || ch === ' ')),
    );

  if (parsed.length === 0) return;
  const cols = parsed[0].length;
  if (cols === 0) return;

  const colW = CONTENT_W / cols;

  parsed.forEach((row, rowIndex) => {
    const isHeader = rowIndex === 0;
    const cellLines = row.map((cell) =>
      pdf.splitTextToSize(cleanInline(cell), colW - 5).slice(0, 4),
    );
    const rowH = Math.max(7, Math.max(...cellLines.map((l) => l.length)) * 4 + 3.4);

    flow.need(rowH + 2);
    const y = flow.y;

    fill(pdf, isHeader ? C.band : rowIndex % 2 === 0 ? C.panel : C.paper);
    pdf.rect(PAGE.M, y, CONTENT_W, rowH, 'F');

    stroke(pdf, C.rule, 0.2);
    pdf.rect(PAGE.M, y, CONTENT_W, rowH, 'S');

    row.forEach((_, colIndex) => {
      const cellX = PAGE.M + colIndex * colW;
      if (colIndex > 0) {
        stroke(pdf, isHeader ? [60, 46, 34] : C.ruleSoft, 0.2);
        pdf.line(cellX, y, cellX, y + rowH);
      }
      pdf.setFont('helvetica', isHeader ? 'bold' : 'normal');
      pdf.setFontSize(isHeader ? 7.4 : 7.6);
      ink(pdf, isHeader ? C.bandInk : C.inkBody);
      pdf.text(cellLines[colIndex], cellX + 2.5, y + 4.8);
    });

    flow.y = y + rowH;
  });
  flow.y += 5;
}

function detectSection(headingText) {
  const text = headingText.toLowerCase();
  if (/geoteknik|geotechnical|tanah|soil|likuefaksi|liquefaction/.test(text)) return 'soil';
  if (/gempa|seismic|tektonik|earthquake|sesar|fault/.test(text)) return 'seismic';
  if (/banjir|flood|lingkungan|environment/.test(text)) return 'environment';
  return null;
}

function drawReportPages(pdf, property, lang) {
  const isEn = lang === 'en';
  const title = isEn ? 'Full report' : 'Laporan lengkap';
  newContentPage(pdf, title);
  const flow = createFlow(pdf, title);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(17);
  ink(pdf, C.ink);
  pdf.text(isEn ? 'Full assessment' : 'Penilaian lengkap', PAGE.M, flow.y);
  flow.y += 12;

  const report = property.aiReport?.detailedReport || '';
  if (!report.trim()) {
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(9);
    ink(pdf, C.inkMuted);
    pdf.text(isEn ? 'The narrative report is not available.' : 'Laporan naratif belum tersedia.', PAGE.M, flow.y);
    return;
  }

  const drawn = { soil: false, seismic: false, environment: false };
  let section = null;

  const flushSectionVisual = () => {
    if (!property?.coords || !section || drawn[section]) return;
    if (section === 'soil') {
      drawSiteClassStrip(pdf, property, flow, lang);
      drawLiquefactionStrip(pdf, property, flow, lang);
    } else if (section === 'seismic') {
      drawSeismicStrip(pdf, property, flow, lang);
    }
    drawn[section] = true;
  };

  parseBlocks(report).forEach((block) => {
    if (block.type === 'table') {
      renderTable(pdf, block.rows, flow);
      return;
    }

    // Penanda inline dibersihkan sebelum pencocokan pola: "**1. Judul**"
    // jatuh ke paragraf biasa kalau bintangnya masih menempel di awal baris.
    const line = cleanInline(block.text).trim();
    if (!line) {
      flow.y += 3;
      return;
    }

    if (/^#{1,3}\s/.test(line)) flushSectionVisual();

    if (line.startsWith('# ')) {
      section = null;
      flow.need(18);
      flow.y += 5;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13.5);
      ink(pdf, C.ink);
      pdf.text(cleanInline(line.replace(/^#+\s*/, '')), PAGE.M, flow.y);
      flow.y += 3;
      hairline(pdf, PAGE.M, flow.y, CONTENT_W, C.accent, 0.5);
      flow.y += 8;
      return;
    }

    if (line.startsWith('## ')) {
      const heading = line.replace(/^#+\s*/, '');
      // Laporan yang dihasilkan backend memakai `##` untuk bagian utama;
      // membatasi deteksi ke `###` membuat strip visualnya tidak pernah muncul.
      section = detectSection(heading);
      flow.need(15);
      flow.y += 4;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      ink(pdf, C.accent);
      pdf.text(cleanInline(heading), PAGE.M, flow.y);
      flow.y += 7;
      return;
    }

    if (line.startsWith('### ')) {
      const heading = line.replace(/^#+\s*/, '');
      section = detectSection(heading);
      flow.need(13);
      flow.y += 3;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9.5);
      ink(pdf, C.ink);
      pdf.text(cleanInline(heading), PAGE.M, flow.y);
      flow.y += 6;
      return;
    }

    if (line.startsWith('>')) {
      flow.need(16);
      flow.y = callout(pdf, PAGE.M, flow.y, CONTENT_W, cleanInline(line.replace(/^>\s*/, '')));
      flow.y += 5;
      return;
    }

    // Daftar bernomor menandai langkah mitigasi berurutan; dulu jatuh ke
    // paragraf biasa sehingga urutannya hilang secara visual.
    const ordered = line.match(/^(\d+)\.\s+(.*)$/);
    if (ordered) {
      const text = cleanInline(ordered[2]);
      const wrapped = pdf.splitTextToSize(text, CONTENT_W - 10);
      flow.need(wrapped.length * 4.8 + 6);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      ink(pdf, C.accent);
      pdf.text(`${ordered[1]}.`, PAGE.M, flow.y);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      ink(pdf, C.ink);
      pdf.text(wrapped, PAGE.M + 6, flow.y);
      flow.y += wrapped.length * 4.8 + 2.4;
      return;
    }

    if (/^[-*]\s/.test(line)) {
      const text = cleanInline(line.replace(/^[-*]\s*/, ''));
      const wrapped = pdf.splitTextToSize(text, CONTENT_W - 8);
      wrapped.forEach((wrappedLine, index) => {
        flow.need(6);
        if (index === 0) {
          fill(pdf, C.accent);
          pdf.circle(PAGE.M + 1.6, flow.y - 1.1, 0.7, 'F');
        }
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.6);
        ink(pdf, C.inkBody);
        pdf.text(wrappedLine, PAGE.M + 5.5, flow.y);
        flow.y += 4.6;
      });
      flow.y += 1.4;
      return;
    }

    const wrapped = pdf.splitTextToSize(cleanInline(line), CONTENT_W);
    wrapped.forEach((wrappedLine) => {
      flow.need(6);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.8);
      ink(pdf, C.inkBody);
      pdf.text(wrappedLine, PAGE.M, flow.y);
      flow.y += 4.8;
    });
    flow.y += 2.2;
  });

  flushSectionVisual();
}

// ── Ekspor utama ──────────────────────────────────────────────

/** Build the exact PDF document used by the browser download action. */
export function createAuditPdf(property, lang = 'id') {
  if (!canExportPdf(property)) {
    throw new Error('PDF belum tersedia: audit harus valid/provisional dengan laporan yang selesai.');
  }

  const normalized = normalizePdfProperty(property);
  const score = computeScore(normalized);
  const docRef = documentRef(normalized);
  const pdf = new jsPDF('p', 'mm', 'a4');

  drawCoverPage(pdf, normalized, score, lang, docRef);
  drawSummaryPage(pdf, normalized, score, lang);
  drawDetailPage(pdf, normalized, lang);
  drawEvidencePage(pdf, normalized, lang);
  drawReportPages(pdf, normalized, lang);

  stampFooters(pdf, lang, docRef);
  return pdf;
}

export async function exportPrintReadyPdf(property, lang = 'id') {
  await Promise.all([ensureLogo('dark'), ensureLogo('light')]);
  const pdf = createAuditPdf(property, lang);
  const normalized = normalizePdfProperty(property);

  const addr = (normalized.address || 'location').split(',')[0].replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
  pdf.save(`SAFE_Audit_${addr}.pdf`);
}

// ── Laporan perbandingan ──────────────────────────────────────

function drawCompareCoverPage(pdf, propA, propB, scoreA, scoreB, lang, docRef) {
  const isEn = lang === 'en';
  paintPage(pdf);

  const bandH = 54;
  fill(pdf, C.band);
  pdf.rect(0, 0, PAGE.W, bandH, 'F');
  fill(pdf, C.accent);
  pdf.rect(0, bandH, PAGE.W, 1.2, 'F');

  if (drawLogo(pdf, PAGE.M + 22, 16, 44, 'dark') === null) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    ink(pdf, C.bandInk);
    pdf.text('S.A.F.E HOUSE', PAGE.M, 28);
  }

  eyebrow(pdf, isEn ? 'Site comparison' : 'Perbandingan lokasi', PAGE.W - PAGE.M, 24, {
    color: C.accent,
    align: 'right',
    size: 7,
  });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.4);
  ink(pdf, [150, 128, 104]);
  pdf.text(docRef, PAGE.W - PAGE.M, 30, { align: 'right' });
  pdf.text(formatDate(lang), PAGE.W - PAGE.M, 35.5, { align: 'right' });

  let y = bandH + 26;
  eyebrow(pdf, isEn ? 'Comparison report' : 'Laporan perbandingan', PAGE.M, y, { color: C.accent });
  y += 12;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(30);
  ink(pdf, C.ink);
  pdf.text(isEn ? 'Site A vs Site B' : 'Lokasi A vs Lokasi B', PAGE.M, y);

  // ── Dua gauge ──
  const cy = 152;
  const cxA = PAGE.M + CONTENT_W * 0.24;
  const cxB = PAGE.M + CONTENT_W * 0.76;

  scoreGauge(pdf, cxA, cy, 26, scoreA, lang);
  scoreGauge(pdf, cxB, cy, 26, scoreB, lang);
  eyebrow(pdf, isEn ? 'Site A' : 'Lokasi A', cxA, cy - 34, { align: 'center' });
  eyebrow(pdf, isEn ? 'Site B' : 'Lokasi B', cxB, cy - 34, { align: 'center' });

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  ink(pdf, C.inkMuted);
  pdf.text('vs', PAGE.W / 2, cy + 3, { align: 'center' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.4);
  ink(pdf, C.inkBody);
  pdf.text(pdf.splitTextToSize(propA.address || 'Location A', CONTENT_W * 0.4).slice(0, 3), cxA, cy + 38, {
    align: 'center',
  });
  pdf.text(pdf.splitTextToSize(propB.address || 'Location B', CONTENT_W * 0.4).slice(0, 3), cxB, cy + 38, {
    align: 'center',
  });

  // ── Putusan ──
  y = 214;
  hairline(pdf, PAGE.M, y - 10, CONTENT_W, C.rule);
  const delta = Math.abs(scoreA - scoreB);
  const verdict =
    delta === 0
      ? isEn ? 'Both sites score the same' : 'Kedua lokasi berskor sama'
      : isEn
        ? `Site ${scoreA > scoreB ? 'A' : 'B'} scores ${delta} points higher`
        : `Lokasi ${scoreA > scoreB ? 'A' : 'B'} unggul ${delta} poin`;

  eyebrow(pdf, isEn ? 'Verdict' : 'Putusan', PAGE.M, y);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(15);
  ink(pdf, delta === 0 ? C.inkBody : C.safe);
  pdf.text(verdict, PAGE.M, y + 10);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.4);
  ink(pdf, C.inkBody);
  pdf.text(
    pdf.splitTextToSize(
      isEn
        ? 'A higher S.A.F.E Score means fewer dominant hazards. Both sites still require their own soil investigation.'
        : 'S.A.F.E Score lebih tinggi berarti bahaya dominannya lebih sedikit. Kedua lokasi tetap memerlukan penyelidikan tanah masing-masing.',
      CONTENT_W,
    ),
    PAGE.M,
    y + 18,
  );

  hairline(pdf, PAGE.M, PAGE.H - 26, CONTENT_W, C.rule);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.8);
  ink(pdf, C.inkMuted);
  pdf.text(
    isEn
      ? 'Data-based preliminary screening. Not a substitute for a site-specific geotechnical investigation.'
      : 'Screening awal berbasis data. Bukan pengganti penyelidikan geoteknik spesifik lokasi.',
    PAGE.M,
    PAGE.H - 20,
  );

  fill(pdf, C.accent);
  pdf.rect(0, PAGE.H - 3, PAGE.W, 3, 'F');
}

function drawCompareDetailPage(pdf, propA, propB, lang) {
  const isEn = lang === 'en';
  let y = newContentPage(pdf, isEn ? 'Side by side' : 'Berdampingan');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(17);
  ink(pdf, C.ink);
  pdf.text(isEn ? 'Hazard, side by side' : 'Bahaya, berdampingan', PAGE.M, y);
  y += 6;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.4);
  ink(pdf, C.inkMuted);
  pdf.text(
    isEn ? '0 = low hazard, 100 = high hazard.' : '0 = bahaya rendah, 100 = bahaya tinggi.',
    PAGE.M,
    y + 4,
  );
  y += 14;

  const colW = (CONTENT_W - 8) / 2;
  eyebrow(pdf, isEn ? 'Site A' : 'Lokasi A', PAGE.M, y);
  eyebrow(pdf, isEn ? 'Site B' : 'Lokasi B', PAGE.M + colW + 8, y);
  y += 6;

  const radarA = propA.radarData || {};
  const radarB = propB.radarData || {};

  RISK_AXES.forEach((axis, index) => {
    const rowY = y + index * 12.5;
    const label = lang === 'en' ? axis.en : axis.id;
    meterRow(pdf, PAGE.M, rowY, colW, { label, value: radarA[axis.key], color: axis.color });
    meterRow(pdf, PAGE.M + colW + 8, rowY, colW, { label, value: radarB[axis.key], color: axis.color });
  });
  y += RISK_AXES.length * 12.5 + 8;

  hairline(pdf, PAGE.M, y, CONTENT_W, C.rule);
  y += 8;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  ink(pdf, C.ink);
  pdf.text(isEn ? 'Parameters' : 'Parameter', PAGE.M, y);
  y += 6;

  const fsOf = (p) => {
    const value = Number(p?.compressedPayload?.liquefaction_analysis?.fs_score);
    return Number.isFinite(value) ? value.toFixed(2) : '-';
  };

  const rows = [
    [isEn ? 'Elevation' : 'Elevasi', `${propA.elevasi ?? '-'} mdpl`, `${propB.elevasi ?? '-'} mdpl`],
    ['Vs30', `${propA.vs30 ?? '-'} m/s (${propA.siteClass ?? '-'})`, `${propB.vs30 ?? '-'} m/s (${propB.siteClass ?? '-'})`],
    [isEn ? 'Surface PGA' : 'PGA permukaan', `${propA.seismic?.pgaSurface?.toFixed(3) ?? '-'} g`, `${propB.seismic?.pgaSurface?.toFixed(3) ?? '-'} g`],
    [isEn ? 'Liquefaction FS' : 'FS likuefaksi', fsOf(propA), fsOf(propB)],
    [
      isEn ? 'Nearest fault' : 'Sesar terdekat',
      `${propA.seismic?.faultName ?? '-'} (${propA.seismic?.faultDist ?? '-'} km)`,
      `${propB.seismic?.faultName ?? '-'} (${propB.seismic?.faultDist ?? '-'} km)`,
    ],
    [
      isEn ? 'Tsunami exposure' : 'Paparan tsunami',
      `${propA.compressedPayload?.tsunami_analysis?.risk_level ?? '-'} (${propA.compressedPayload?.tsunami_analysis?.dist_to_coast_km ?? '-'} km)`,
      `${propB.compressedPayload?.tsunami_analysis?.risk_level ?? '-'} (${propB.compressedPayload?.tsunami_analysis?.dist_to_coast_km ?? '-'} km)`,
    ],
    [
      isEn ? 'Air quality (AQI)' : 'Kualitas udara (AQI)',
      `${propA.compressedPayload?.env_extras?.aqi ?? '-'}`,
      `${propB.compressedPayload?.env_extras?.aqi ?? '-'}`,
    ],
  ];

  const labelW = CONTENT_W * 0.3;
  const valueW = (CONTENT_W - labelW) / 2;

  fill(pdf, C.paperAlt);
  pdf.rect(PAGE.M, y, CONTENT_W, 6.5, 'F');
  eyebrow(pdf, isEn ? 'Parameter' : 'Parameter', PAGE.M + 3, y + 4.3, { size: 6 });
  eyebrow(pdf, isEn ? 'Site A' : 'Lokasi A', PAGE.M + labelW + valueW - 3, y + 4.3, { size: 6, align: 'right' });
  eyebrow(pdf, isEn ? 'Site B' : 'Lokasi B', PAGE.M + CONTENT_W - 3, y + 4.3, { size: 6, align: 'right' });
  y += 6.5;

  rows.forEach(([label, valueA, valueB], index) => {
    const rowH = 8.4;
    if (index % 2 === 1) {
      fill(pdf, C.panel);
      pdf.rect(PAGE.M, y, CONTENT_W, rowH, 'F');
    }
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.6);
    ink(pdf, C.inkMuted);
    pdf.text(pdf.splitTextToSize(String(label), labelW - 6)[0], PAGE.M + 3, y + 5.4);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.8);
    ink(pdf, C.ink);
    pdf.text(pdf.splitTextToSize(String(valueA), valueW - 6)[0] || '-', PAGE.M + labelW + valueW - 3, y + 5.4, {
      align: 'right',
    });
    pdf.text(pdf.splitTextToSize(String(valueB), valueW - 6)[0] || '-', PAGE.M + CONTENT_W - 3, y + 5.4, {
      align: 'right',
    });
    y += rowH;
  });
  hairline(pdf, PAGE.M, y, CONTENT_W, C.rule);
}

/** Build the comparison document without saving it — testable entry point. */
export function createComparePdf(propA, propB, battleReport, lang = 'id') {
  const normalizedA = normalizePdfProperty(propA);
  const normalizedB = normalizePdfProperty(propB);
  const usable = (p) =>
    p && (p.auditStatus === 'valid' || p.auditStatus === 'provisional') && Number.isFinite(p.safeScore);

  if (!usable(normalizedA) || !usable(normalizedB) || !battleReport?.trim()) {
    throw new Error('PDF perbandingan belum tersedia: kedua audit dan laporannya harus selesai.');
  }

  const scoreA = computeScore(normalizedA);
  const scoreB = computeScore(normalizedB);
  const docRef = documentRef(normalizedA);
  const pdf = new jsPDF('p', 'mm', 'a4');

  drawCompareCoverPage(pdf, normalizedA, normalizedB, scoreA, scoreB, lang, docRef);
  drawCompareDetailPage(pdf, normalizedA, normalizedB, lang);
  drawReportPages(pdf, { aiReport: { detailedReport: battleReport } }, lang);

  stampFooters(pdf, lang, docRef);

  const nameOf = (p, fallback) =>
    (p.address || fallback).split(',')[0].replace(/[^a-zA-Z0-9]/g, '_').slice(0, 18);

  return { pdf, filename: `SAFE_Compare_${nameOf(normalizedA, 'A')}_vs_${nameOf(normalizedB, 'B')}.pdf` };
}

export async function exportBattlePdf(propA, propB, battleReport, lang = 'id') {
  await Promise.all([ensureLogo('dark'), ensureLogo('light')]);
  const { pdf, filename } = createComparePdf(propA, propB, battleReport, lang);
  pdf.save(filename);
}

/**
 * Legacy export — still used by the html2canvas fallback.
 */
export async function exportElementToPdf(element, filename = 'SAFE_Audit_Report.pdf') {
  if (!element) return;

  // Reduce scale for tall elements to avoid canvas memory crash.
  // Chrome's max canvas area is ~16M px²; a 794px-wide A4 at scale 2
  // hits that limit at ~10 000px element height.
  const elementHeight = element.scrollHeight || element.offsetHeight || 1000;
  const scale = elementHeight > 5000 ? 1 : elementHeight > 2500 ? 1.5 : 2;

  try {
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(element, {
      backgroundColor: '#0f0b08',
      scale,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    let position = 0;
    let remainingHeight = pdfHeight;
    const pageHeight = pdf.internal.pageSize.getHeight();

    while (remainingHeight > 0) {
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
      remainingHeight -= pageHeight;
      if (remainingHeight > 0) {
        pdf.addPage();
        position -= pageHeight;
      }
    }

    pdf.save(filename);
  } catch (err) {
    console.error('[S.A.F.E] html2canvas export failed:', err);
    throw new Error('PDF export gagal — coba gunakan tombol Export utama.', { cause: err });
  }
}
