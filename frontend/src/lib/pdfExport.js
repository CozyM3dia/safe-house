import { jsPDF } from 'jspdf';
import { adaptAuditResult } from '../services/auditAdapter.js';

// ── Color tokens ──────────────────────────────────────────────
const C = {
  bg: [15, 11, 8],
  bgCard: [22, 17, 12],
  accent: [212, 149, 106],
  textPri: [240, 228, 204],
  textSec: [196, 168, 126],
  textMuted: [125, 98, 69],
  safe: [16, 185, 129],
  moderate: [245, 158, 11],
  danger: [239, 68, 68],
  blue: [59, 130, 246],
  violet: [168, 85, 247],
  white: [255, 255, 255],
};

function riskHex(score) {
  if (score >= 70) return C.safe;
  if (score >= 40) return C.moderate;
  return C.danger;
}

function riskLabel(score) {
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
 * The dashboard now stores AuditResult (snake_case), while the legacy PDF
 * renderer uses a compact camelCase view. Normalize at this boundary so the
 * renderer cannot silently recalculate a different score or lose provenance.
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
    normalized?.aiReport?.reportLoading !== true &&
    normalized?.aiReport?.aiError !== true
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

// ── Helpers ───────────────────────────────────────────────────
function setColor(pdf, rgb, alpha) {
  pdf.setTextColor(rgb[0], rgb[1], rgb[2]);
}

function drawRoundedRect(pdf, x, y, w, h, r, fillColor) {
  pdf.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
  pdf.roundedRect(x, y, w, h, r, r, 'F');
}

function drawBar(pdf, x, y, w, h, val, maxVal, barColor, bgColor) {
  drawRoundedRect(pdf, x, y, w, h, 1.5, bgColor);
  const filled = (clampRiskScore(val) / maxVal) * w;
  if (filled > 0) {
    pdf.setFillColor(barColor[0], barColor[1], barColor[2]);
    pdf.roundedRect(x, y, Math.max(filled, 3), h, 1.5, 1.5, 'F');
  }
}

// ── Page: Cover ───────────────────────────────────────────────
function drawCoverPage(pdf, property, score, lang) {
  const W = pdf.internal.pageSize.getWidth();
  const H = pdf.internal.pageSize.getHeight();

  // Full dark background
  pdf.setFillColor(...C.bg);
  pdf.rect(0, 0, W, H, 'F');

  // Concentric circular seismic wave graphics in background
  pdf.setDrawColor(32, 24, 18);
  pdf.setLineWidth(0.15);
  const cx = W / 2;
  const cy = 135;
  for (let r = 40; r <= 160; r += 16) {
    pdf.circle(cx, cy, r, 'S');
  }

  // Accent line at top
  pdf.setFillColor(...C.accent);
  pdf.rect(0, 0, W, 3, 'F');

  // Official Document Badge
  drawRoundedRect(pdf, W / 2 - 25, 16, 50, 6, 1, [30, 18, 12]);
  pdf.setFontSize(6.5);
  pdf.setFont('helvetica', 'bold');
  setColor(pdf, C.accent);
  pdf.text(lang === 'en' ? 'OFFICIAL RISK AUDIT' : 'LAPORAN AUDIT RESMI', W / 2, 20.2, { align: 'center' });

  // Logo text
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  setColor(pdf, C.accent);
  pdf.text('S.A.F.E HOUSE', W / 2, 40, { align: 'center' });

  pdf.setFontSize(7);
  setColor(pdf, C.textMuted);
  pdf.text('GEOPHYSICS CORE', W / 2, 47, { align: 'center' });

  // Separator
  pdf.setDrawColor(...C.accent);
  pdf.setLineWidth(0.3);
  pdf.line(W / 2 - 25, 54, W / 2 + 25, 54);

  // Title
  pdf.setFontSize(28);
  setColor(pdf, C.textPri);
  pdf.text(lang === 'en' ? 'Property Risk' : 'Audit Risiko', W / 2, 80, { align: 'center' });
  pdf.setFontSize(28);
  setColor(pdf, C.accent);
  pdf.text(lang === 'en' ? 'Audit Report' : 'Properti', W / 2, 92, { align: 'center' });

  // Score circle
  const radius = 28;

  // Outer ring bg
  pdf.setDrawColor(40, 30, 22);
  pdf.setLineWidth(5);
  pdf.circle(cx, cy, radius, 'S');

  // Score ring
  const scoreColor = riskHex(score);
  pdf.setDrawColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  pdf.setLineWidth(5);
  // Draw arc approximation — full circle for simplicity, color indicates risk
  pdf.circle(cx, cy, radius, 'S');

  // Score number
  pdf.setFontSize(36);
  pdf.setFont('helvetica', 'bold');
  setColor(pdf, C.textPri);
  pdf.text(String(score), cx, cy + 4, { align: 'center' });

  // Label
  pdf.setFontSize(9);
  setColor(pdf, scoreColor);
  pdf.text(riskLabel(score), cx, cy + 14, { align: 'center' });

  // S.A.F.E Score label
  pdf.setFontSize(7);
  setColor(pdf, C.textMuted);
  pdf.text('S.A.F.E SCORE', cx, cy - radius - 8, { align: 'center' });

  // Address
  const addr = property.address || 'Unknown Location';
  pdf.setFontSize(10);
  setColor(pdf, C.textSec);
  const addrLines = pdf.splitTextToSize(addr, W - 50);
  pdf.text(addrLines, cx, 185, { align: 'center' });

  // Coordinates
  pdf.setFontSize(8);
  pdf.setFont('courier', 'normal');
  setColor(pdf, C.textMuted);
  pdf.text(
    `${property.coords.lat.toFixed(6)}, ${property.coords.lon.toFixed(6)}`,
    cx, 200, { align: 'center' }
  );

  // Date
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  setColor(pdf, C.textMuted);
  pdf.text(new Date().toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }), cx, 210, { align: 'center' });

  // Footer
  pdf.setFontSize(7);
  setColor(pdf, C.textMuted);
  pdf.text('Generated by S.A.F.E House — Geophysics Property Risk Analysis Platform', cx, H - 18, { align: 'center' });
  pdf.text('Data: InaRISK BNPB | USGS | Open-Meteo | Google Gemini AI', cx, H - 12, { align: 'center' });

  // Bottom accent line
  pdf.setFillColor(...C.accent);
  pdf.rect(0, H - 3, W, 3, 'F');
}

// ── Page: Risk Dashboard ──────────────────────────────────────
function drawDashboardPage(pdf, property, score, lang) {
  const W = pdf.internal.pageSize.getWidth();
  const H = pdf.internal.pageSize.getHeight();
  const M = 18; // margin

  // Background
  pdf.setFillColor(...C.bg);
  pdf.rect(0, 0, W, H, 'F');

  // Header
  drawPageHeader(pdf, W, lang === 'en' ? 'Risk Analysis Dashboard' : 'Dashboard Analisis Risiko');

  let y = 36;

  // ── Radar Data Bars ─────────────────────────────────────────
  const radar = property.radarData || {};
  const bars = [
    { label: lang === 'en' ? 'Flood Risk' : 'Risiko Banjir', val: clampRiskScore(radar.flood), icon: '🌊', color: C.blue },
    { label: lang === 'en' ? 'Soil / Liquefaction' : 'Likuefaksi Tanah', val: clampRiskScore(radar.soil), icon: '🧱', color: C.moderate },
    { label: lang === 'en' ? 'Seismic Risk' : 'Risiko Seismik', val: clampRiskScore(radar.seismic), icon: '🌋', color: C.danger },
    { label: lang === 'en' ? 'Landslide Risk' : 'Risiko Longsor', val: clampRiskScore(radar.landslide), icon: '🏔️', color: C.violet },
    { label: lang === 'en' ? 'Land Subsidence' : 'Penurunan Lahan', val: clampRiskScore(radar.subsidence), icon: '🧭', color: C.accent },
  ];

  // Section title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  setColor(pdf, C.textPri);
  pdf.text(lang === 'en' ? 'Risk Breakdown' : 'Rincian Risiko', M, y);
  y += 10;

  bars.forEach((b) => {
    // Label + value
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    setColor(pdf, C.textSec);
    pdf.text(`${b.label}`, M, y);

    pdf.setFont('helvetica', 'bold');
    setColor(pdf, C.textPri);
    pdf.text(`${b.val}/100`, W - M, y, { align: 'right' });

    y += 4;

    // Bar
    drawBar(pdf, M, y, W - M * 2, 5, b.val, 100, b.color, [35, 28, 20]);

    // Risk label
    const riskLbl = b.val >= 70 ? 'HIGH' : b.val >= 40 ? 'MED' : 'LOW';
    const riskClr = b.val >= 70 ? C.danger : b.val >= 40 ? C.moderate : C.safe;
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'bold');
    setColor(pdf, riskClr);
    const barEnd = M + (b.val / 100) * (W - M * 2);
    if (b.val > 15) {
      pdf.text(riskLbl, Math.min(barEnd - 2, W - M - 10), y + 3.5, { align: 'right' });
    }

    y += 12;
  });

  y += 5;

  // ── Technical Data Grid (Expanded to 10 parameters) ─────────────────
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  setColor(pdf, C.textPri);
  pdf.text(lang === 'en' ? 'Technical Parameters' : 'Parameter Teknis', M, y);
  y += 8;

  // Extract detailed variables from compressedPayload
  const p = property.compressedPayload ?? {};
  const volcano = p.seismotectonic?.nearest_volcano?.name ?? '-';
  const volcanoDist = p.seismotectonic?.nearest_volcano?.dist_km ?? '-';
  const coastDist = p.tsunami_analysis?.dist_to_coast_km ?? '-';
  const tsunamiRisk = p.tsunami_analysis?.risk_level ?? '-';
  const aqi = p.env_extras?.aqi ?? '-';
  const pm25 = p.env_extras?.pm25 ?? '-';
  const floodLevel = radar.flood >= 70 ? (lang === 'en' ? 'HIGH' : 'TINGGI') : radar.flood >= 40 ? (lang === 'en' ? 'MEDIUM' : 'SEDANG') : (lang === 'en' ? 'LOW' : 'RENDAH');
  const landslideLevel = radar.landslide >= 70 ? (lang === 'en' ? 'HIGH' : 'TINGGI') : radar.landslide >= 40 ? (lang === 'en' ? 'MEDIUM' : 'SEDANG') : (lang === 'en' ? 'LOW' : 'RENDAH');

  const metrics = [
    [lang === 'en' ? 'Elevation' : 'Elevasi', `${property.elevasi ?? '-'} mdpl`],
    ['Vs30', `${property.vs30 ?? '-'} m/s (${property.siteClass ?? '-'})`],
    ['PGA Base', `${property.seismic?.pgaBase ?? '-'}g`],
    ['PGA Surface', `${property.seismic?.pgaSurface?.toFixed(3) ?? '-'}g`],
    [lang === 'en' ? 'Nearest Fault' : 'Sesar Terdekat', `${property.seismic?.faultName ?? '-'} (${property.seismic?.faultDist ?? '-'} km)`],
    [lang === 'en' ? 'Volcano Proximity' : 'Gunung Api Terdekat', `${volcano} (${volcanoDist} km)`],
    [lang === 'en' ? 'Tsunami Risk' : 'Risiko Tsunami', `${tsunamiRisk} (${coastDist} km)`],
    [lang === 'en' ? 'Flood Risk (InaRISK)' : 'Risiko Banjir (InaRISK)', `${floodLevel} (${radar.flood ?? 0}/100)`],
    [lang === 'en' ? 'Landslide Risk' : 'Risiko Longsor', `${landslideLevel} (${radar.landslide ?? 0}/100)`],
    [lang === 'en' ? 'Air Quality (AQI)' : 'Kualitas Udara (AQI)', `${aqi} (PM2.5: ${pm25})`],
  ];

  const colW = (W - M * 2) / 2;
  metrics.forEach((row, i) => {
    const col = i % 2;
    const rowY = y + Math.floor(i / 2) * 13;
    const x = M + col * colW;

    // Card background
    drawRoundedRect(pdf, x, rowY - 3, colW - 4, 11, 2.5, C.bgCard);

    // Label
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    setColor(pdf, C.textMuted);
    pdf.text(row[0], x + 4, rowY + 0.5);

    // Value
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    setColor(pdf, C.textPri);
    pdf.text(row[1], x + 4, rowY + 6.5);
  });

  y += Math.ceil(metrics.length / 2) * 13 + 5;

  // ── Seismotectonic & Historical Context ──────────────────────────
  const seismotectonic = p.seismotectonic || {};
  const historical = p.historical_earthquakes || [];
  const megaVal = seismotectonic.megathrust ? `${seismotectonic.megathrust.name} (${seismotectonic.megathrust.dist_km} km)` : '-';

  // Draw Context Card
  drawRoundedRect(pdf, M, y, W - M * 2, 24, 3, C.bgCard);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  setColor(pdf, C.accent);
  pdf.text(lang === 'en' ? 'Seismotectonic & Geological Context' : 'Konteks Seismotektonik & Geologi', M + 5, y + 5);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  setColor(pdf, C.textSec);
  pdf.text(lang === 'en' ? `Megathrust Zone: ${megaVal}` : `Zona Megathrust: ${megaVal}`, M + 5, y + 11);
  pdf.text(lang === 'en' ? `Soil Class Amplification: ${property.siteClass} (${p.liquefaction_analysis?.amplification_fa ?? '1.0'}x)` : `Amplifikasi Kelas Situs: ${property.siteClass} (${p.liquefaction_analysis?.amplification_fa ?? '1.0'}x)`, M + 5, y + 17);

  // Historical EQ right column
  let eqText = lang === 'en' ? 'No recent major earthquakes (>M4.5) within 100km.' : 'Tidak ada gempa signifikan (>M4.5) dalam 100km.';
  if (historical && historical.length > 0) {
    const eq = historical[0];
    eqText = `M${eq.magnitude} - ${eq.place} (${eq.date ? eq.date.split(',')[0] : ''})`;
  }
  pdf.setFont('helvetica', 'normal');
  pdf.text(lang === 'en' ? 'USGS Historical Catalog:' : 'Riwayat Gempa Terakhir (USGS):', M + colW + 2, y + 11);
  pdf.setFont('helvetica', 'italic');
  setColor(pdf, C.textMuted);
  pdf.text(eqText, M + colW + 2, y + 17);

  y += 30;

  // ── Disclaimer ──────────────────────────────────────────────
  drawRoundedRect(pdf, M, y, W - M * 2, 14, 3, [40, 35, 25]);
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(7);
  setColor(pdf, C.moderate);
  const disclaimer = lang === 'en'
    ? 'DISCLAIMER: This report is AI-generated based on publicly available data. Not a substitute for professional geotechnical assessment.'
    : 'DISCLAIMER: Laporan ini dihasilkan AI berdasarkan data publik. Bukan pengganti survei geoteknik profesional.';
  const discLines = pdf.splitTextToSize(disclaimer, W - M * 2 - 8);
  pdf.text(discLines, M + 4, y + 5);

  drawPageFooter(pdf, W, H, 2);
}

// ── Page: AI Report Visualizations & Rendering ────────────────────────────────
function ensureSpace(pdf, heightNeeded, y, pageNum, W, H, maxY, setPageNum, headerTitle) {
  if (y + heightNeeded > maxY) {
    drawPageFooter(pdf, W, H, pageNum);
    const newPageNum = pageNum + 1;
    setPageNum(newPageNum);
    pdf.addPage();
    pdf.setFillColor(...C.bg);
    pdf.rect(0, 0, W, H, 'F');
    drawPageHeader(pdf, W, headerTitle);
    return 36;
  }
  return y;
}

function pdfShortText(value, maxLength = 74) {
  const text = String(value ?? '—').replace(/\s+/g, ' ').trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function evidenceStatusLabel(status, lang) {
  const labels = lang === 'en'
    ? { official: 'OFFICIAL', model: 'MODEL', reference: 'REFERENCE', open_data: 'OPEN DATA', unavailable: 'UNAVAILABLE' }
    : { official: 'RESMI', model: 'MODEL', reference: 'REFERENSI', open_data: 'OPEN DATA', unavailable: 'BELUM TERSEDIA' };
  return labels[status] || String(status || '—').toUpperCase();
}

function evidenceStatusColor(status) {
  if (status === 'official') return C.safe;
  if (status === 'model') return C.moderate;
  if (status === 'unavailable') return C.textMuted;
  return C.blue;
}

/** Page: Audit evidence and provenance */
function drawAuditEvidencePage(pdf, property, lang) {
  const W = pdf.internal.pageSize.getWidth();
  const H = pdf.internal.pageSize.getHeight();
  const M = 18;
  const evidence = getPdfAuditEvidence(property);
  const isEn = lang === 'en';

  pdf.addPage();
  pdf.setFillColor(...C.bg);
  pdf.rect(0, 0, W, H, 'F');
  drawPageHeader(pdf, W, isEn ? 'AI Audit Evidence' : 'Dasar Audit AI');

  let y = 36;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  setColor(pdf, C.textPri);
  pdf.text(isEn ? 'Audit evidence & data quality' : 'Bukti audit & kualitas data', M, y);
  y += 6;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  setColor(pdf, C.textSec);
  pdf.text(
    isEn
      ? 'The deterministic audit is the source of truth; AI explains it and cannot change the score.'
      : 'Audit deterministik adalah sumber angka; AI hanya menjelaskan dan tidak dapat mengubah skor.',
    M,
    y,
  );
  y += 10;

  const cards = [
    ['STATUS', evidence.status.toUpperCase(), evidence.status === 'valid' ? C.safe : C.moderate],
    ['CONFIDENCE', `${evidence.confidence}%`, C.accent],
    [isEn ? 'SCORE VERSION' : 'VERSI SKOR', pdfShortText(evidence.scoreVersion, 25), C.blue],
    [isEn ? 'DATA MODE' : 'MODE DATA', pdfShortText(evidence.mode, 25), C.violet],
  ];
  const cardW = (W - M * 2 - 9) / 4;
  cards.forEach(([label, value, color], index) => {
    const x = M + index * (cardW + 3);
    drawRoundedRect(pdf, x, y, cardW, 21, 2.5, C.bgCard);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6);
    setColor(pdf, C.textMuted);
    pdf.text(label, x + 4, y + 6);
    pdf.setFontSize(value.length > 19 ? 6.5 : 9);
    setColor(pdf, color);
    pdf.text(value, x + 4, y + 15);
  });
  y += 29;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  setColor(pdf, C.textPri);
  pdf.text(isEn ? 'Field provenance' : 'Provenance setiap field', M, y);
  y += 7;

  const entries = evidence.entries.slice(0, 18);
  if (entries.length === 0) {
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(8);
    setColor(pdf, C.textMuted);
    pdf.text(isEn ? 'No field-level provenance is available.' : 'Provenance per field belum tersedia.', M, y);
    y += 10;
  } else {
    entries.forEach((entry, index) => {
      const rowH = 8.5;
      const rowBg = index % 2 === 0 ? C.bgCard : C.bg;
      pdf.setFillColor(...rowBg);
      pdf.rect(M, y - 4, W - M * 2, rowH, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.2);
      setColor(pdf, C.textPri);
      pdf.text(pdfShortText(entry.label, 22), M + 3, y + 1);

      const statusColor = evidenceStatusColor(entry.status);
      pdf.setFontSize(6.2);
      setColor(pdf, statusColor);
      pdf.text(evidenceStatusLabel(entry.status, lang), M + 43, y + 1);

      pdf.setFont('helvetica', 'normal');
      setColor(pdf, C.textSec);
      pdf.text(`${entry.confidence}%`, M + 77, y + 1);
      pdf.text(pdfShortText(entry.source, 72), M + 91, y + 1);
      y += rowH;
    });
    if (evidence.entries.length > entries.length) {
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(6.5);
      setColor(pdf, C.textMuted);
      pdf.text(`+ ${evidence.entries.length - entries.length} field lainnya`, M, y + 2);
      y += 6;
    }
  }

  y += 6;
  const colW = (W - M * 2 - 6) / 2;
  drawRoundedRect(pdf, M, y, colW, 37, 2.5, C.bgCard);
  drawRoundedRect(pdf, M + colW + 6, y, colW, 37, 2.5, C.bgCard);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  setColor(pdf, C.accent);
  pdf.text(isEn ? 'Derived screening indicators' : 'Indikator turunan screening', M + 4, y + 7);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  setColor(pdf, C.textSec);
  const derivedLines = [
    `${isEn ? 'Official fields' : 'Field resmi'}: ${evidence.officialCount}`,
    `${isEn ? 'Model/proxy fields' : 'Field model/proxy'}: ${evidence.estimatedCount}`,
    `${isEn ? 'Reference/open data' : 'Referensi/open data'}: ${evidence.referenceCount}`,
    `${isEn ? 'Unavailable fields' : 'Field belum tersedia'}: ${evidence.unavailableCount}`,
    `${isEn ? 'Scored axes' : 'Sumbu yang dinilai'}: ${evidence.scoreAxes.length || '—'}`,
  ];
  derivedLines.forEach((line, index) => pdf.text(pdfShortText(line, 48), M + 4, y + 14 + index * 4.5));

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  setColor(pdf, C.accent);
  pdf.text(isEn ? 'AI delivery & limits' : 'Delivery AI & batasan', M + colW + 10, y + 7);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  setColor(pdf, C.textSec);
  const aiLines = [
    `Model: ${pdfShortText(evidence.aiModel, 38)}`,
    `Delivery: ${String(evidence.aiDeliveryMode).toUpperCase()}`,
    `${isEn ? 'Sources' : 'Sumber'}: ${pdfShortText(evidence.aiSources.join(', ') || '—', 38)}`,
    `${isEn ? 'Not scored' : 'Tidak dinilai'}: ${pdfShortText(evidence.notScored.join(', ') || '—', 38)}`,
    `${isEn ? 'Missing' : 'Belum tersedia'}: ${pdfShortText([...evidence.criticalMissing, ...evidence.optionalMissing].join(', ') || '—', 38)}`,
  ];
  aiLines.forEach((line, index) => pdf.text(line, M + colW + 10, y + 14 + index * 4.5));

  y += 45;
  drawRoundedRect(pdf, M, y, W - M * 2, 19, 2.5, [40, 35, 25]);
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(7);
  setColor(pdf, C.moderate);
  const caveat = isEn
    ? 'Model/proxy fields are screening indicators, not official hazard-map observations. A field survey remains necessary for final engineering or permitting decisions.'
    : 'Field model/proxy adalah indikator screening, bukan observasi peta bahaya resmi. Survei lapangan tetap diperlukan untuk keputusan teknik atau perizinan akhir.';
  pdf.text(pdf.splitTextToSize(caveat, W - M * 2 - 8), M + 4, y + 7);

  drawPageFooter(pdf, W, H, 3);
}

function drawSoilVisualInPdf(pdf, property, y, lang, pageNum, W, H, maxY, setPageNum) {
  const M = 18;
  const vs30 = property?.vs30 ?? 180;
  const siteClass = property?.siteClass ?? 'SD';
  const fs = property?.compressedPayload?.liquefaction_analysis?.fs_score ?? 1.2;
  const isEn = lang === 'en';

  const titleText = isEn ? 'GEOTECHNICAL VISUALIZATION' : 'VISUALISASI GEOTEKNIK';
  y = ensureSpace(pdf, 42, y, pageNum, W, H, maxY, setPageNum, titleText);

  // Outer Box
  pdf.setFillColor(...C.bgCard);
  pdf.roundedRect(M, y, W - M * 2, 36, 3, 3, 'F');
  pdf.setDrawColor(40, 30, 22);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(M, y, W - M * 2, 36, 3, 3, 'S');

  // Subtitle / Vs30 Label
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  setColor(pdf, C.textPri);
  pdf.text(isEn ? 'SOIL CLASS STIFFNESS (Vs30)' : 'KEKERASAN TANAH (Vs30)', M + 5, y + 6);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  setColor(pdf, C.accent);
  pdf.text(`${vs30} m/s (${isEn ? 'Class' : 'Kelas'} ${siteClass})`, W - M - 5, y + 6, { align: 'right' });

  // Draw Vs30 classes boxes
  const classes = [
    { name: 'SE', label: isEn ? 'Soft' : 'Lunak', range: '<180', color: C.danger },
    { name: 'SD', label: isEn ? 'Medium' : 'Sedang', range: '180-360', color: C.moderate },
    { name: 'SC', label: isEn ? 'Hard' : 'Keras', range: '360-760', color: C.safe },
    { name: 'SB/SA', label: isEn ? 'Rock' : 'Batuan', range: '>760', color: [6, 182, 212] }
  ];

  let activeIdx = 0;
  if (vs30 >= 760) activeIdx = 3;
  else if (vs30 >= 360) activeIdx = 2;
  else if (vs30 >= 180) activeIdx = 1;

  const boxW = (W - M * 2 - 20) / 4;
  classes.forEach((c, idx) => {
    const boxX = M + 4 + idx * (boxW + 4);
    const boxY = y + 9;
    const isActive = idx === activeIdx;

    if (isActive) {
      // Highlighted box
      pdf.setFillColor(30, 22, 16);
      pdf.roundedRect(boxX, boxY, boxW, 11, 2, 2, 'F');
      pdf.setDrawColor(C.accent[0], C.accent[1], C.accent[2]);
      pdf.setLineWidth(0.4);
      pdf.roundedRect(boxX, boxY, boxW, 11, 2, 2, 'S');
    } else {
      // Dull box
      pdf.setFillColor(25, 20, 15);
      pdf.roundedRect(boxX, boxY, boxW, 11, 2, 2, 'F');
      pdf.setDrawColor(40, 30, 22);
      pdf.setLineWidth(0.2);
      pdf.roundedRect(boxX, boxY, boxW, 11, 2, 2, 'S');
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    const textClr = isActive ? C.accent : c.color;
    pdf.setTextColor(textClr[0], textClr[1], textClr[2]);
    pdf.text(c.name, boxX + boxW / 2, boxY + 4.2, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(5.5);
    setColor(pdf, C.textSec);
    pdf.text(c.label, boxX + boxW / 2, boxY + 7.2, { align: 'center' });

    pdf.setFont('courier', 'normal');
    pdf.setFontSize(5);
    setColor(pdf, C.textMuted);
    pdf.text(c.range, boxX + boxW / 2, boxY + 10.2, { align: 'center' });
  });

  // Draw Liquefaction FS bar
  const fsY = y + 24.5;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  setColor(pdf, C.textPri);
  pdf.text(isEn ? 'LIQUEFACTION FACTOR OF SAFETY (FS)' : 'FAKTOR KEAMANAN LIKUIFAKSI (FS)', M + 5, fsY);

  const fsText = `FS = ${fs.toFixed(2)} (${fs < 1.0 ? (isEn ? 'CRITICAL' : 'RAWAN') : (isEn ? 'SAFE' : 'AMAN')})`;
  const fsClr = fs < 1.0 ? C.danger : C.safe;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(fsClr[0], fsClr[1], fsClr[2]);
  pdf.text(fsText, W - M - 5, fsY, { align: 'right' });

  // FS Bar graph
  const barX = M + 5;
  const barY = y + 26.5;
  const barW = W - M * 2 - 10;
  const barH = 3;

  // Draw background bar with red and green halves
  pdf.setFillColor(30, 22, 16);
  pdf.roundedRect(barX, barY, barW, barH, 1, 1, 'F');
  
  // Left half (red/orange)
  pdf.setFillColor(C.danger[0], C.danger[1], C.danger[2]);
  pdf.rect(barX, barY, barW / 2, barH, 'F');
  
  // Right half (green)
  pdf.setFillColor(C.safe[0], C.safe[1], C.safe[2]);
  pdf.rect(barX + barW / 2, barY, barW / 2, barH, 'F');

  // Draw marker at current FS position
  const markerPos = Math.max(0, Math.min(1, fs / 2)) * barW;
  pdf.setFillColor(255, 255, 255);
  pdf.rect(barX + markerPos - 0.5, barY - 1, 1, barH + 2, 'F');

  // Labels below FS bar
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5.5);
  setColor(pdf, C.textMuted);
  pdf.text('0.0 (Unsafe)', barX, barY + 6.2);
  pdf.text('1.0 (Critical)', barX + barW / 2, barY + 6.2, { align: 'center' });
  pdf.text('2.0+ (Safe)', barX + barW, barY + 6.2, { align: 'right' });

  return y + 42;
}

function drawSeismicVisualInPdf(pdf, property, y, lang, pageNum, W, H, maxY, setPageNum) {
  const M = 18;
  const pga = property?.seismic?.pgaSurface ?? 0.35;
  const faultName = property?.seismic?.faultName ?? 'N/A';
  const faultDist = property?.seismic?.faultDist ?? 999;
  const isEn = lang === 'en';

  const titleText = isEn ? 'SEISMIC HAZARD VISUALIZATION' : 'VISUALISASI BAHAYA GEMPA';
  y = ensureSpace(pdf, 42, y, pageNum, W, H, maxY, setPageNum, titleText);

  // Outer Box
  pdf.setFillColor(...C.bgCard);
  pdf.roundedRect(M, y, W - M * 2, 36, 3, 3, 'F');
  pdf.setDrawColor(40, 30, 22);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(M, y, W - M * 2, 36, 3, 3, 'S');

  // PGA Label
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  setColor(pdf, C.textPri);
  pdf.text(isEn ? 'PEAK GROUND ACCELERATION (PGA SURFACE)' : 'PERCEPATAN TANAH MAKSIMUM (PGA SURFACE)', M + 5, y + 6);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  setColor(pdf, C.accent);
  pdf.text(`${pga.toFixed(3)}g`, W - M - 5, y + 6, { align: 'right' });

  // PGA intensity bar
  const barX = M + 5;
  const barY = y + 9;
  const barW = W - M * 2 - 10;
  const barH = 3;

  const blockW = barW / 3;
  pdf.setFillColor(C.safe[0], C.safe[1], C.safe[2]);
  pdf.rect(barX, barY, blockW, barH, 'F');
  pdf.setFillColor(C.moderate[0], C.moderate[1], C.moderate[2]);
  pdf.rect(barX + blockW, barY, blockW, barH, 'F');
  pdf.setFillColor(C.danger[0], C.danger[1], C.danger[2]);
  pdf.rect(barX + blockW * 2, barY, blockW, barH, 'F');

  // Draw marker at current PGA position (PGA goes from 0.0 to 1.0)
  const markerPos = Math.max(0, Math.min(1, pga / 1.0)) * barW;
  pdf.setFillColor(255, 255, 255);
  pdf.rect(barX + markerPos - 0.5, barY - 1, 1, barH + 2, 'F');

  // Labels below PGA bar
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5.5);
  setColor(pdf, C.textMuted);
  pdf.text('0.1g (Low)', barX, barY + 6.2);
  pdf.text('0.4g (Moderate)', barX + barW / 2, barY + 6.2, { align: 'center' });
  pdf.text('0.8g+ (High)', barX + barW, barY + 6.2, { align: 'right' });

  // Fault Proximity Line Diagram
  const faultY = y + 24.5;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  setColor(pdf, C.textPri);
  pdf.text(isEn ? `FAULT PROXIMITY (${faultName})` : `KEDEKATAN SESAR AKTIF (${faultName})`, M + 5, faultY);

  const faultClr = faultDist < 10 ? C.danger : faultDist < 30 ? C.moderate : C.safe;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(faultClr[0], faultClr[1], faultClr[2]);
  pdf.text(`${faultDist.toFixed(1)} km`, W - M - 5, faultY, { align: 'right' });

  // Draw line diagram
  const lineX = M + 15;
  const lineW = W - M * 2 - 30;
  const lineY = y + 28.5;

  // Draw FAULT line label
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.5);
  pdf.setTextColor(C.danger[0], C.danger[1], C.danger[2]);
  pdf.text(isEn ? 'FAULT' : 'SESAR', M + 5, lineY + 1);

  // Draw line segment
  pdf.setDrawColor(80, 60, 45);
  pdf.setLineWidth(0.5);
  pdf.line(lineX, lineY, lineX + lineW, lineY);

  // Proximity zones on line
  pdf.setFillColor(C.danger[0], C.danger[1], C.danger[2]);
  pdf.circle(lineX, lineY, 1, 'F');
  
  // House marker position (faultDist goes from 0 to 50 km)
  const housePos = Math.max(0, Math.min(1, faultDist / 50)) * lineW;
  
  // Draw marker circle
  pdf.setFillColor(C.accent[0], C.accent[1], C.accent[2]);
  pdf.circle(lineX + housePos, lineY, 1.8, 'F');
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.3);
  pdf.circle(lineX + housePos, lineY, 1.8, 'S');

  // Draw SAFE label on right
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.5);
  setColor(pdf, C.textMuted);
  pdf.text(isEn ? 'SAFE' : 'AMAN', lineX + lineW + 2, lineY + 1);

  // Labels below Fault diagram
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5.5);
  setColor(pdf, C.textMuted);
  pdf.text(isEn ? 'Unsafe (<10km)' : 'Bahaya (<10km)', lineX, lineY + 5.2);
  pdf.text(isEn ? 'Warning (10-30km)' : 'Waspada (10-30km)', lineX + lineW * 0.4, lineY + 5.2, { align: 'center' });
  pdf.text(isEn ? 'Safe (>50km)' : 'Aman (>50km)', lineX + lineW, lineY + 5.2, { align: 'right' });

  return y + 42;
}

function drawEnvironmentVisualInPdf(pdf, property, y, lang, pageNum, W, H, maxY, setPageNum) {
  const M = 18;
  const elevasi = property?.elevasi ?? 0;
  const aqi = property?.compressedPayload?.env_extras?.aqi ?? 20;
  const isEn = lang === 'en';

  const titleText = isEn ? 'FLOOD & ENVIRONMENTAL VISUALIZATION' : 'VISUALISASI BANJIR & LINGKUNGAN';
  y = ensureSpace(pdf, 42, y, pageNum, W, H, maxY, setPageNum, titleText);

  // Outer Box
  pdf.setFillColor(...C.bgCard);
  pdf.roundedRect(M, y, W - M * 2, 36, 3, 3, 'F');
  pdf.setDrawColor(40, 30, 22);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(M, y, W - M * 2, 36, 3, 3, 'S');

  // Elevation Label
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  setColor(pdf, C.textPri);
  pdf.text(isEn ? 'ELEVATION VS SEA LEVEL / ROB FLOOD' : 'KETINGGIAN VS LEVEL BANJIR ROB', M + 5, y + 6);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  setColor(pdf, C.accent);
  pdf.text(`${elevasi} mdpl`, W - M - 5, y + 6, { align: 'right' });

  // Elevation steps diagram
  const stepY = y + 8;
  const stepW = (W - M * 2 - 16) / 4;
  const stepH = 8;

  // Sea (Blue block)
  pdf.setFillColor(C.blue[0], C.blue[1], C.blue[2]);
  pdf.rect(M + 4, stepY + stepH - 2, stepW, 2, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5);
  pdf.setTextColor(255, 255, 255);
  pdf.text(isEn ? 'SEA' : 'LAUT', M + 4 + stepW / 2, stepY + stepH - 0.2, { align: 'center' });

  // Coastal Flat 0-10m
  pdf.setFillColor(35, 28, 20);
  pdf.rect(M + 4 + stepW + 2, stepY + stepH - 4, stepW, 4, 'F');
  setColor(pdf, C.textMuted);
  pdf.text('0-10m', M + 4 + stepW + 2 + stepW / 2, stepY + stepH - 1, { align: 'center' });

  // Hills 10-50m
  pdf.setFillColor(35, 28, 20);
  pdf.rect(M + 4 + stepW * 2 + 4, stepY + stepH - 6, stepW, 6, 'F');
  setColor(pdf, C.textMuted);
  pdf.text('10-50m', M + 4 + stepW * 2 + 4 + stepW / 2, stepY + stepH - 2, { align: 'center' });

  // Highlands >50m
  pdf.setFillColor(35, 28, 20);
  pdf.rect(M + 4 + stepW * 3 + 6, stepY + stepH - 8, stepW, 8, 'F');
  setColor(pdf, C.textMuted);
  pdf.text('>50m', M + 4 + stepW * 3 + 6 + stepW / 2, stepY + stepH - 3, { align: 'center' });

  // House marker at correct elevation index
  const activeIdx = elevasi < 10 ? 1 : elevasi < 50 ? 2 : 3;
  const houseX = M + 4 + activeIdx * (stepW + 2) + stepW / 2;
  const houseY = stepY + stepH - (activeIdx === 1 ? 4 : activeIdx === 2 ? 6 : 8);

  pdf.setFillColor(C.accent[0], C.accent[1], C.accent[2]);
  pdf.triangle(houseX, houseY - 2.5, houseX - 2.5, houseY - 0.5, houseX + 2.5, houseY - 0.5, 'F');
  pdf.rect(houseX - 1.8, houseY - 0.5, 3.6, 2, 'F');

  // Labels below steps
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5);
  setColor(pdf, C.textMuted);
  pdf.text(isEn ? 'Tidal Flood Risk' : 'Rawan Banjir Rob', M + 4 + stepW + 2 + stepW / 2, stepY + stepH + 3.5, { align: 'center' });
  pdf.text(isEn ? 'Local Flood Potential' : 'Potensi Banjir Lokal', M + 4 + stepW * 2 + 4 + stepW / 2, stepY + stepH + 3.5, { align: 'center' });
  pdf.text(isEn ? 'Safe Zone' : 'Zona Aman Banjir', M + 4 + stepW * 3 + 6 + stepW / 2, stepY + stepH + 3.5, { align: 'center' });


  // Air Quality (AQI) Label
  const aqiY = y + 24.5;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  setColor(pdf, C.textPri);
  pdf.text(isEn ? 'AIR QUALITY INDEX (EUROPEAN AQI)' : 'INDEKS KUALITAS UDARA (EUROPEAN AQI)', M + 5, aqiY);

  const aqiClr = aqi >= 100 ? C.danger : aqi >= 50 ? C.moderate : C.safe;
  const aqiText = `AQI = ${aqi} (${aqi >= 100 ? (isEn ? 'VERY POOR' : 'SANGAT BURUK') : aqi >= 50 ? (isEn ? 'MODERATE' : 'SEDANG') : (isEn ? 'HEALTHY' : 'SEHAT')})`;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(aqiClr[0], aqiClr[1], aqiClr[2]);
  pdf.text(aqiText, W - M - 5, aqiY, { align: 'right' });

  // AQI Bar graph
  const aqiBarX = M + 5;
  const aqiBarY = y + 26.5;
  const aqiBarW = W - M * 2 - 10;
  const aqiBarH = 3;

  const aqiBlockW = aqiBarW / 3;
  pdf.setFillColor(C.safe[0], C.safe[1], C.safe[2]);
  pdf.rect(aqiBarX, aqiBarY, aqiBlockW, aqiBarH, 'F');
  pdf.setFillColor(C.moderate[0], C.moderate[1], C.moderate[2]);
  pdf.rect(aqiBarX + aqiBlockW, aqiBarY, aqiBlockW, aqiBarH, 'F');
  pdf.setFillColor(C.danger[0], C.danger[1], C.danger[2]);
  pdf.rect(aqiBarX + aqiBlockW * 2, aqiBarY, aqiBlockW, aqiBarH, 'F');

  // Draw marker at current AQI position (AQI goes from 0 to 150)
  const aqiMarkerPos = Math.max(0, Math.min(1, aqi / 150)) * aqiBarW;
  pdf.setFillColor(255, 255, 255);
  pdf.rect(aqiBarX + aqiMarkerPos - 0.5, aqiBarY - 1, 1, aqiBarH + 2, 'F');

  // Labels below AQI bar
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5.5);
  setColor(pdf, C.textMuted);
  pdf.text(isEn ? '0 (Healthy)' : '0 (Sehat)', aqiBarX, aqiBarY + 6.2);
  pdf.text(isEn ? '50 (Moderate)' : '50 (Sedang)', aqiBarX + aqiBarW / 2, aqiBarY + 6.2, { align: 'center' });
  pdf.text(isEn ? '100+ (Poor)' : '100+ (Buruk)', aqiBarX + aqiBarW, aqiBarY + 6.2, { align: 'right' });

  return y + 42;
}

function drawReportPages(pdf, property, lang, firstPageNum = 4) {
  const W = pdf.internal.pageSize.getWidth();
  const H = pdf.internal.pageSize.getHeight();
  const M = 18;
  const maxY = H - 22;
  let pageNum = firstPageNum;

  pdf.addPage();
  pdf.setFillColor(...C.bg);
  pdf.rect(0, 0, W, H, 'F');
  drawPageHeader(pdf, W, lang === 'en' ? 'AI Audit Report' : 'Laporan Audit AI');

  let y = 36;

  // Track geohazard section visualization states
  let soilDrawn = false;
  let seismicDrawn = false;
  let envDrawn = false;
  let currentSection = null;

  // Get the report text
  const report = property.aiReport?.detailedReport || '';
  if (!report) {
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(10);
    setColor(pdf, C.textMuted);
    pdf.text(lang === 'en' ? 'AI report not yet generated.' : 'Laporan AI belum dibuat.', M, y);
    drawPageFooter(pdf, W, H, pageNum);
    return;
  }

  // Pre-parse table lines
  const rawLines = report.split('\n');
  const blocks = [];
  let currentTable = null;

  rawLines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('|')) {
      if (!currentTable) {
        currentTable = [];
      }
      currentTable.push(trimmed);
    } else {
      if (currentTable) {
        blocks.push({ type: 'table', rows: currentTable });
        currentTable = null;
      }
      blocks.push({ type: 'line', text: line });
    }
  });
  if (currentTable) {
    blocks.push({ type: 'table', rows: currentTable });
  }

  blocks.forEach((block) => {
    // Check if we need a new page
    if (y > maxY) {
      drawPageFooter(pdf, W, H, pageNum);
      pageNum++;
      pdf.addPage();
      pdf.setFillColor(...C.bg);
      pdf.rect(0, 0, W, H, 'F');
      drawPageHeader(pdf, W, lang === 'en' ? 'AI Audit Report (cont.)' : 'Laporan Audit AI (lanj.)');
      y = 36;
    }

    if (block.type === 'table') {
      const rowsData = block.rows.map(row => 
        row.split('|')
           .map(cell => cell.trim())
           .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
      );
      
      const cleanRows = rowsData.filter(row => 
        row.length > 0 && 
        !row.every(cell => cell.split('').every(ch => ch === '-' || ch === ':' || ch === ' ' || ch === '|'))
      );
      
      if (cleanRows.length === 0) return;
      
      const numCols = cleanRows[0].length;
      if (numCols === 0) return;
      
      const tableW = W - M * 2;
      const colW = tableW / numCols;
      
      cleanRows.forEach((row, rowIndex) => {
        const rowH = 7;
        if (y + rowH > maxY) {
          drawPageFooter(pdf, W, H, pageNum);
          pageNum++;
          pdf.addPage();
          pdf.setFillColor(...C.bg);
          pdf.rect(0, 0, W, H, 'F');
          drawPageHeader(pdf, W, lang === 'en' ? 'AI Audit Report (cont.)' : 'Laporan Audit AI (lanj.)');
          y = 36;
        }
        
        const isHeader = rowIndex === 0;
        const rowBg = isHeader ? [30, 22, 16] : (rowIndex % 2 === 0 ? C.bgCard : C.bg);
        pdf.setFillColor(rowBg[0], rowBg[1], rowBg[2]);
        pdf.rect(M, y - 4, tableW, rowH, 'F');
        
        pdf.setDrawColor(45, 35, 25);
        pdf.setLineWidth(0.2);
        pdf.rect(M, y - 4, tableW, rowH, 'S');
        
        row.forEach((cell, colIndex) => {
          const cellX = M + colIndex * colW;
          pdf.line(cellX, y - 4, cellX, y - 4 + rowH);
          
          pdf.setFont('helvetica', isHeader ? 'bold' : 'normal');
          pdf.setFontSize(isHeader ? 8 : 7.5);
          setColor(pdf, isHeader ? C.accent : C.textPri);
          
          // Clean markdown formatting inside table cells
          const cleanCell = cell.replace(/\*\*(.*?)\*\*/g, '$1');
          const cellText = pdf.splitTextToSize(cleanCell, colW - 4);
          pdf.text(cellText[0] || '', cellX + 2, y + 0.5);
        });
        
        y += rowH;
      });
      y += 4;
      return;
    }

    // Normal line processing
    const line = block.text;
    const trimmed = line.trim();
    if (!trimmed) {
      y += 4;
      return;
    }

    // Heading transition and detection
    if (trimmed.startsWith('# ') || trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
      // Draw previous geohazard section visual if we are moving to a new section/heading
      if (property?.coords) {
        if (currentSection === 'geotechnical' && !soilDrawn) {
          y = drawSoilVisualInPdf(pdf, property, y, lang, pageNum, W, H, maxY, (p) => { pageNum = p; });
          soilDrawn = true;
        } else if (currentSection === 'seismic' && !seismicDrawn) {
          y = drawSeismicVisualInPdf(pdf, property, y, lang, pageNum, W, H, maxY, (p) => { pageNum = p; });
          seismicDrawn = true;
        } else if (currentSection === 'environment' && !envDrawn) {
          y = drawEnvironmentVisualInPdf(pdf, property, y, lang, pageNum, W, H, maxY, (p) => { pageNum = p; });
          envDrawn = true;
        }
      }
    }

    if (trimmed.startsWith('# ')) {
      currentSection = null;
      y += 4;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      setColor(pdf, C.textPri);
      pdf.text(trimmed.replace(/^#+\s*/, ''), M, y);
      y += 3;
      // Underline
      pdf.setDrawColor(...C.accent);
      pdf.setLineWidth(0.4);
      pdf.line(M, y, W - M, y);
      y += 7;
    } else if (trimmed.startsWith('## ')) {
      currentSection = null;
      y += 3;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      setColor(pdf, C.accent);
      pdf.text(trimmed.replace(/^#+\s*/, ''), M, y);
      y += 7;
    } else if (trimmed.startsWith('### ')) {
      const headingText = trimmed.replace(/^###\s*/, '').toLowerCase();
      if (headingText.includes('geoteknik') || headingText.includes('geotechnical') || headingText.includes('tanah') || headingText.includes('soil')) {
        currentSection = 'geotechnical';
      } else if (headingText.includes('gempa') || headingText.includes('seismic') || headingText.includes('tektonik') || headingText.includes('earthquake')) {
        currentSection = 'seismic';
      } else if (headingText.includes('banjir') || headingText.includes('flood') || headingText.includes('lingkungan') || headingText.includes('environmental')) {
        currentSection = 'environment';
      } else {
        currentSection = null;
      }

      y += 2;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      setColor(pdf, [224, 168, 122]); // lighter accent
      pdf.text(trimmed.replace(/^#+\s*/, ''), M, y);
      y += 6;
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      // Bullet
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      setColor(pdf, C.textSec);

      const bulletText = trimmed.replace(/^[-*]\s*/, '');
      const clean = bulletText.replace(/\*\*(.*?)\*\*/g, '$1');
      const wrapped = pdf.splitTextToSize(clean, W - M * 2 - 10);

      wrapped.forEach((wLine, wi) => {
        if (y > maxY) {
          drawPageFooter(pdf, W, H, pageNum);
          pageNum++;
          pdf.addPage();
          pdf.setFillColor(...C.bg);
          pdf.rect(0, 0, W, H, 'F');
          drawPageHeader(pdf, W, lang === 'en' ? 'AI Audit Report (cont.)' : 'Laporan Audit AI (lanj.)');
          y = 36;
        }
        if (wi === 0) {
          pdf.setFillColor(C.accent[0], C.accent[1], C.accent[2]);
          pdf.circle(M + 3.5, y - 1.2, 0.8, 'F');
        }
        setColor(pdf, C.textSec);
        pdf.text(wLine, M + 8, y);
        y += 4.5;
      });
    } else if (trimmed.startsWith('>')) {
      // Blockquote
      drawRoundedRect(pdf, M, y - 3, W - M * 2, 10, 2, [35, 28, 20]);
      pdf.setFillColor(...C.accent);
      pdf.rect(M, y - 3, 2, 10, 'F');
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(8);
      setColor(pdf, [154, 124, 90]);
      pdf.text(trimmed.replace(/^>\s*/, ''), M + 6, y + 3);
      y += 12;
    } else {
      // Regular paragraph
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      setColor(pdf, C.textSec);

      const clean = trimmed.replace(/\*\*(.*?)\*\*/g, '$1');
      const wrapped = pdf.splitTextToSize(clean, W - M * 2);

      wrapped.forEach((wLine) => {
        if (y > maxY) {
          drawPageFooter(pdf, W, H, pageNum);
          pageNum++;
          pdf.addPage();
          pdf.setFillColor(...C.bg);
          pdf.rect(0, 0, W, H, 'F');
          drawPageHeader(pdf, W, lang === 'en' ? 'AI Audit Report (cont.)' : 'Laporan Audit AI (lanj.)');
          y = 36;
        }
        pdf.text(wLine, M, y);
        y += 4.5;
      });
      y += 2;
    }
  });

  // Draw any remaining unsaved geohazard visual after the blocks loop ends
  if (property?.coords) {
    if (currentSection === 'geotechnical' && !soilDrawn) {
      y = drawSoilVisualInPdf(pdf, property, y, lang, pageNum, W, H, maxY, (p) => { pageNum = p; });
      soilDrawn = true;
    } else if (currentSection === 'seismic' && !seismicDrawn) {
      y = drawSeismicVisualInPdf(pdf, property, y, lang, pageNum, W, H, maxY, (p) => { pageNum = p; });
      seismicDrawn = true;
    } else if (currentSection === 'environment' && !envDrawn) {
      y = drawEnvironmentVisualInPdf(pdf, property, y, lang, pageNum, W, H, maxY, (p) => { pageNum = p; });
      envDrawn = true;
    }
  }

  drawPageFooter(pdf, W, H, pageNum);
}

// ── Shared Header/Footer ──────────────────────────────────────
function drawPageHeader(pdf, W, title) {
  pdf.setFillColor(...C.accent);
  pdf.rect(0, 0, W, 2, 'F');

  // Left: logo text
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  setColor(pdf, C.accent);
  pdf.text('S.A.F.E House', 18, 14);

  // Right: page title
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  setColor(pdf, C.textMuted);
  pdf.text(title, W - 18, 14, { align: 'right' });

  // Separator
  pdf.setDrawColor(40, 30, 22);
  pdf.setLineWidth(0.3);
  pdf.line(18, 19, W - 18, 19);
}

function drawPageFooter(pdf, W, H, pageNum) {
  pdf.setDrawColor(40, 30, 22);
  pdf.setLineWidth(0.3);
  pdf.line(18, H - 14, W - 18, H - 14);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  setColor(pdf, C.textMuted);
  pdf.text('S.A.F.E House — Geophysics Property Risk Analysis', 18, H - 8);
  pdf.text(`Page ${pageNum}`, W - 18, H - 8, { align: 'right' });
}

// ── Main Export Function ──────────────────────────────────────
/** Build the exact PDF document used by the browser download action. */
export function createAuditPdf(property, lang = 'id') {
  if (!canExportPdf(property)) {
    throw new Error('PDF belum tersedia: audit harus valid/provisional dengan laporan AI yang selesai.');
  }

  const normalized = normalizePdfProperty(property);
  const score = computeScore(normalized);
  const pdf = new jsPDF('p', 'mm', 'a4');

  // Page 1: Cover
  drawCoverPage(pdf, normalized, score, lang);

  // Page 2: Dashboard
  pdf.addPage();
  drawDashboardPage(pdf, normalized, score, lang);

  // Page 3: explicit provenance and AI delivery evidence
  drawAuditEvidencePage(pdf, normalized, lang);

  // Page 4+: AI Report
  drawReportPages(pdf, normalized, lang, 4);

  return pdf;
}

export async function exportPrintReadyPdf(property, lang = 'id') {
  const pdf = createAuditPdf(property, lang);
  const normalized = normalizePdfProperty(property);

  // Save
  const addr = (normalized.address || 'location').split(',')[0].replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
  pdf.save(`SAFE_Report_${addr}.pdf`);
}

// ── Page: Battle Cover ───────────────────────────────────────────────
function drawBattleCoverPage(pdf, propA, propB, scoreA, scoreB, lang) {
  const W = pdf.internal.pageSize.getWidth();
  const H = pdf.internal.pageSize.getHeight();

  pdf.setFillColor(...C.bg);
  pdf.rect(0, 0, W, H, 'F');
  pdf.setFillColor(...C.accent);
  pdf.rect(0, 0, W, 3, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  setColor(pdf, C.accent);
  pdf.text('S.A.F.E HOUSE', W / 2, 40, { align: 'center' });

  pdf.setFontSize(7);
  setColor(pdf, C.textMuted);
  pdf.text('GEOPHYSICS BATTLE MODE', W / 2, 47, { align: 'center' });

  pdf.setDrawColor(...C.accent);
  pdf.setLineWidth(0.3);
  pdf.line(W / 2 - 25, 54, W / 2 + 25, 54);

  pdf.setFontSize(28);
  setColor(pdf, C.textPri);
  pdf.text(lang === 'en' ? 'Property Risk' : 'Risiko Properti', W / 2, 80, { align: 'center' });
  pdf.setFontSize(28);
  setColor(pdf, C.accent);
  pdf.text('BATTLE REPORT', W / 2, 92, { align: 'center' });

  const radius = 24;
  const cy = 145;
  const cxA = W / 4 + 5;
  const cxB = (3 * W) / 4 - 5;

  // VS text
  pdf.setFontSize(20);
  setColor(pdf, C.textMuted);
  pdf.text('VS', W / 2, cy + 4, { align: 'center' });

  // Prop A Circle
  pdf.setDrawColor(40, 30, 22);
  pdf.setLineWidth(4);
  pdf.circle(cxA, cy, radius, 'S');
  const scColorA = riskHex(scoreA);
  pdf.setDrawColor(scColorA[0], scColorA[1], scColorA[2]);
  pdf.circle(cxA, cy, radius, 'S');

  pdf.setFontSize(30);
  pdf.setFont('helvetica', 'bold');
  setColor(pdf, C.textPri);
  pdf.text(String(scoreA), cxA, cy + 4, { align: 'center' });

  pdf.setFontSize(8);
  setColor(pdf, scColorA);
  pdf.text(riskLabel(scoreA), cxA, cy + 12, { align: 'center' });

  // Prop B Circle
  pdf.setDrawColor(40, 30, 22);
  pdf.setLineWidth(4);
  pdf.circle(cxB, cy, radius, 'S');
  const scColorB = riskHex(scoreB);
  pdf.setDrawColor(scColorB[0], scColorB[1], scColorB[2]);
  pdf.circle(cxB, cy, radius, 'S');

  pdf.setFontSize(30);
  pdf.setFont('helvetica', 'bold');
  setColor(pdf, C.textPri);
  pdf.text(String(scoreB), cxB, cy + 4, { align: 'center' });

  pdf.setFontSize(8);
  setColor(pdf, scColorB);
  pdf.text(riskLabel(scoreB), cxB, cy + 12, { align: 'center' });

  // Addresses
  pdf.setFontSize(8);
  setColor(pdf, C.textSec);
  const addrA = propA.address || 'Location A';
  const linesA = pdf.splitTextToSize(addrA, (W / 2) - 20);
  pdf.text(linesA, cxA, cy + 35, { align: 'center' });

  const addrB = propB.address || 'Location B';
  const linesB = pdf.splitTextToSize(addrB, (W / 2) - 20);
  pdf.text(linesB, cxB, cy + 35, { align: 'center' });

  // Winner text
  let winnerText = 'TIE - BOTH EQUAL';
  if (scoreA > scoreB) winnerText = 'LOCATION A IS SAFER';
  if (scoreB > scoreA) winnerText = 'LOCATION B IS SAFER';
  
  pdf.setFontSize(14);
  setColor(pdf, C.safe);
  pdf.text(winnerText, W / 2, 230, { align: 'center' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  setColor(pdf, C.textMuted);
  pdf.text(new Date().toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }), W / 2, 245, { align: 'center' });

  pdf.setFontSize(7);
  pdf.text('Generated by S.A.F.E House — Geophysics Property Risk Analysis', W / 2, H - 18, { align: 'center' });
  
  pdf.setFillColor(...C.accent);
  pdf.rect(0, H - 3, W, 3, 'F');
}

// ── Page: Battle Dashboard ──────────────────────────────────────
function drawBattleDashboardPage(pdf, propA, propB, scoreA, scoreB, lang) {
  const W = pdf.internal.pageSize.getWidth();
  const H = pdf.internal.pageSize.getHeight();
  const M = 18;

  pdf.setFillColor(...C.bg);
  pdf.rect(0, 0, W, H, 'F');
  drawPageHeader(pdf, W, lang === 'en' ? 'Battle Dashboard' : 'Dashboard Battle');

  let y = 36;
  const colW = (W - M * 2 - 10) / 2;

  // Header Titles
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  setColor(pdf, C.textPri);
  pdf.text('Location A', M, y);
  pdf.text('Location B', M + colW + 10, y);
  y += 8;

  const radarA = propA.radarData || {};
  const radarB = propB.radarData || {};

  const metricsInfo = [
    { key: 'flood', label: lang === 'en' ? 'Flood Risk' : 'Risiko Banjir', color: C.blue },
    { key: 'soil', label: lang === 'en' ? 'Soil / Liq.' : 'Likuefaksi', color: C.moderate },
    { key: 'seismic', label: lang === 'en' ? 'Seismic' : 'Seismik', color: C.danger },
    { key: 'landslide', label: lang === 'en' ? 'Landslide' : 'Longsor', color: C.violet },
    { key: 'subsidence', label: lang === 'en' ? 'Land Subsidence' : 'Penurunan Lahan', color: C.accent },
  ];

  metricsInfo.forEach((m) => {
    // Label A
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    setColor(pdf, C.textSec);
    pdf.text(m.label, M, y);

    const valA = radarA[m.key] || 0;
    pdf.setFont('helvetica', 'bold');
    setColor(pdf, C.textPri);
    pdf.text(`${valA}/100`, M + colW, y, { align: 'right' });
    drawBar(pdf, M, y + 2, colW, 4, valA, 100, m.color, [35, 28, 20]);

    // Label B
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    setColor(pdf, C.textSec);
    pdf.text(m.label, M + colW + 10, y);

    const valB = radarB[m.key] || 0;
    pdf.setFont('helvetica', 'bold');
    setColor(pdf, C.textPri);
    pdf.text(`${valB}/100`, M + colW * 2 + 10, y, { align: 'right' });
    drawBar(pdf, M + colW + 10, y + 2, colW, 4, valB, 100, m.color, [35, 28, 20]);

    y += 12;
  });

  y += 6;

  // Technical Parameters Grid
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  setColor(pdf, C.textPri);
  pdf.text(lang === 'en' ? 'Technical Comparison' : 'Perbandingan Teknis', M, y);
  y += 8;

  const techRows = [
    [lang === 'en' ? 'Elevation' : 'Elevasi', `${propA.elevasi ?? '-'} mdpl`, `${propB.elevasi ?? '-'} mdpl`],
    ['Vs30', `${propA.vs30 ?? '-'} m/s (${propA.siteClass ?? '-'})`, `${propB.vs30 ?? '-'} m/s (${propB.siteClass ?? '-'})`],
    ['PGA Base', `${propA.seismic?.pgaBase ?? '-'}g`, `${propB.seismic?.pgaBase ?? '-'}g`],
    ['PGA Surface', `${propA.seismic?.pgaSurface?.toFixed(3) ?? '-'}g`, `${propB.seismic?.pgaSurface?.toFixed(3) ?? '-'}g`],
    [lang === 'en' ? 'Nearest Fault' : 'Sesar Terdekat', `${propA.seismic?.faultName ?? '-'} (${propA.seismic?.faultDist ?? '-'} km)`, `${propB.seismic?.faultName ?? '-'} (${propB.seismic?.faultDist ?? '-'} km)`],
    [lang === 'en' ? 'Liquefaction FS' : 'FS Likuifaksi', propA.compressedPayload?.liquefaction_analysis?.fs_score?.toFixed(2) ?? '-', propB.compressedPayload?.liquefaction_analysis?.fs_score?.toFixed(2) ?? '-'],
    [lang === 'en' ? 'Tsunami Risk' : 'Risiko Tsunami', `${propA.compressedPayload?.tsunami_analysis?.risk_level ?? '-'} (${propA.compressedPayload?.tsunami_analysis?.dist_to_coast_km ?? '-'} km)`, `${propB.compressedPayload?.tsunami_analysis?.risk_level ?? '-'} (${propB.compressedPayload?.tsunami_analysis?.dist_to_coast_km ?? '-'} km)`],
    [lang === 'en' ? 'Air Quality (AQI)' : 'Kualitas Udara (AQI)', `${propA.compressedPayload?.env_extras?.aqi ?? '-'} (PM2.5: ${propA.compressedPayload?.env_extras?.pm25 ?? '-'})`, `${propB.compressedPayload?.env_extras?.aqi ?? '-'} (PM2.5: ${propB.compressedPayload?.env_extras?.pm25 ?? '-'})`],
  ];

  techRows.forEach((row, i) => {
    const rowY = y + i * 13;
    drawRoundedRect(pdf, M, rowY - 3, W - M * 2, 11, 2.5, C.bgCard);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    setColor(pdf, C.textMuted);
    pdf.text(row[0], M + 4, rowY + 4);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    
    // Value A
    setColor(pdf, C.textPri);
    pdf.text(row[1], M + colW, rowY + 4, { align: 'right' });

    // Value B
    setColor(pdf, C.textPri);
    pdf.text(row[2], M + colW * 2 + 6, rowY + 4, { align: 'right' });
  });

  drawPageFooter(pdf, W, H, 2);
}

// ── Battle Export Function ──────────────────────────────────────
export async function exportBattlePdf(propA, propB, battleReport, lang = 'id') {
  if (
    !propA || !propB ||
    propA.auditStatus !== 'valid' || propB.auditStatus !== 'valid' ||
    !Number.isFinite(propA.safeScore) || !Number.isFinite(propB.safeScore) ||
    !battleReport?.trim()
  ) {
    throw new Error('PDF battle belum tersedia: kedua audit dan laporan AI harus selesai.');
  }

  const scoreA = computeScore(propA);
  const scoreB = computeScore(propB);
  const pdf = new jsPDF('p', 'mm', 'a4');

  // Page 1: Battle Cover
  drawBattleCoverPage(pdf, propA, propB, scoreA, scoreB, lang);

  // Page 2: Dashboard
  pdf.addPage();
  drawBattleDashboardPage(pdf, propA, propB, scoreA, scoreB, lang);

  // Page 3+: AI Report
  const dummyProp = { aiReport: { detailedReport: battleReport } };
  drawReportPages(pdf, dummyProp, lang);

  const pdfName = `SAFE_Battle_${Date.now()}.pdf`;
  pdf.save(pdfName);
}

/**
 * Legacy export — still used by html2canvas fallback.
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

    const imgData = canvas.toDataURL('image/jpeg', 0.92); // JPEG smaller than PNG
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
    throw new Error('PDF export gagal — coba gunakan tombol Export utama.');
  }
}
