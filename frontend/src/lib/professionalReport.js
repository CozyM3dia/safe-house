import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  riskLabel, formatNum, reportNumber, siteClassDescription,
  executiveSummary, liquefactionParagraph, conclusionRecommendations,
} from './reportTemplates.js';

// ── Palet "Modern Scientific" (dokumen putih formal) ────────────────
// Slate untuk struktur & teks, teal sbg satu aksen, semaphore utk risiko.
const INK = [28, 37, 51];       // slate-900 — teks utama
const MUTED = [100, 116, 139];  // slate-500 — teks sekunder
const FAINT = [148, 163, 184];  // slate-400 — label kecil
const HAIR = [226, 232, 240];   // slate-200 — garis rambut
const STRUCT = [51, 65, 85];    // slate-700 — kop/kepala tabel
const ACCENT = [13, 148, 136];  // teal-600 — penanda seksi
const PANEL = [248, 250, 252];  // slate-50 — panel/isian tabel
const SAFE = [5, 150, 105];
const MOD = [217, 119, 6];
const DANGER = [220, 38, 38];

const PAGE = { w: 210, h: 297, m: 20 };
const CONTENT_W = PAGE.w - PAGE.m * 2;
const PT2MM = 0.352778;

function riskRGB(score) {
  if (score >= 70) return SAFE;
  if (score >= 40) return MOD;
  return DANGER;
}

// Versi terang (untuk isian panel skor) — campur warna risiko dgn putih.
function tint(rgb, amt = 0.9) {
  return rgb.map((c) => Math.round(c + (255 - c) * amt));
}

function slugify(s) {
  return String(s || 'lokasi').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
}

function lineH(sizePt, factor = 1.28) {
  return sizePt * PT2MM * factor;
}

// ── Kop + footer halaman isi ────────────────────────────────────────
function decoratePage(doc, ctx) {
  doc.setFont('helvetica', 'bold').setFontSize(7.5).setTextColor(...STRUCT);
  doc.text('S.A.F.E HOUSE', PAGE.m, 12);
  doc.setFont('helvetica', 'normal').setTextColor(...MUTED);
  doc.text('Laporan Audit Risiko Geoteknik & Lingkungan', PAGE.m + 26, 12);
  doc.text(ctx.reportNo, PAGE.w - PAGE.m, 12, { align: 'right' });
  doc.setDrawColor(...HAIR).setLineWidth(0.3);
  doc.line(PAGE.m, 14.5, PAGE.w - PAGE.m, 14.5);

  doc.line(PAGE.m, PAGE.h - 13, PAGE.w - PAGE.m, PAGE.h - 13);
  doc.setFontSize(6.5).setTextColor(...FAINT);
  doc.text('Desk study — bukan pengganti penyelidikan tanah lapangan.', PAGE.m, PAGE.h - 9);
  doc.text(`Hal. ${ctx.page} · ${ctx.dateStr}`, PAGE.w - PAGE.m, PAGE.h - 9, { align: 'right' });
}

// Judul seksi: penanda nomor (kotak teal) + judul + garis rambut penuh.
function sectionTitle(doc, num, title, y) {
  if (num) {
    doc.setFillColor(...ACCENT).roundedRect(PAGE.m, y - 4, 6.5, 6.5, 1, 1, 'F');
    doc.setFont('helvetica', 'bold').setFontSize(8).setTextColor(255, 255, 255);
    doc.text(String(num), PAGE.m + 3.25, y + 0.6, { align: 'center' });
  }
  doc.setFont('helvetica', 'bold').setFontSize(11.5).setTextColor(...INK);
  doc.text(title, PAGE.m + (num ? 10 : 0), y + 0.5);
  doc.setDrawColor(...HAIR).setLineWidth(0.3);
  doc.line(PAGE.m, y + 5, PAGE.w - PAGE.m, y + 5);
  return y + 11;
}

// Paragraf; kembalikan Y baru dgn leading benar.
function paragraph(doc, text, y, opts = {}) {
  const size = opts.size || 9.5;
  doc.setFont('helvetica', opts.bold ? 'bold' : 'normal').setFontSize(size).setTextColor(...(opts.color || INK));
  const lines = doc.splitTextToSize(text, opts.width || CONTENT_W);
  const lh = lineH(size);
  lines.forEach((ln, i) => doc.text(ln, PAGE.m + (opts.indent || 0), y + i * lh));
  return y + lines.length * lh + (opts.gap ?? 2.5);
}

// Butir berpeluru: bulatan aksen + teks menggantung rata.
function bullet(doc, text, y, opts = {}) {
  const size = opts.size || 9.5;
  const x = PAGE.m;
  doc.setFillColor(...(opts.dot || ACCENT)).circle(x + 1, y - 1.1, 0.7, 'F');
  doc.setFont('helvetica', 'normal').setFontSize(size).setTextColor(...INK);
  const lines = doc.splitTextToSize(text, CONTENT_W - 5);
  const lh = lineH(size);
  lines.forEach((ln, i) => doc.text(ln, x + 5, y + i * lh));
  return y + lines.length * lh + 2;
}

function ensureSpace(doc, y, need, ctx) {
  if (y + need > PAGE.h - 20) {
    doc.addPage();
    ctx.page += 1;
    decoratePage(doc, ctx);
    return 24;
  }
  return y;
}

// Tabel bergaya "thin lines": kepala slate lembut, baris garis rambut.
function reportTable(doc, y, opts) {
  autoTable(doc, {
    startY: y,
    margin: { left: PAGE.m, right: PAGE.m },
    head: opts.head,
    body: opts.body,
    theme: 'plain',
    headStyles: {
      fillColor: PANEL, textColor: STRUCT, fontStyle: 'bold', fontSize: 8.5,
      lineWidth: { bottom: 0.4 }, lineColor: STRUCT, cellPadding: { top: 2.2, bottom: 2.2, left: 3, right: 3 },
    },
    bodyStyles: {
      textColor: INK, fontSize: 8.8, lineWidth: { bottom: 0.2 }, lineColor: HAIR,
      cellPadding: { top: 2, bottom: 2, left: 3, right: 3 },
    },
    columnStyles: opts.columnStyles || {},
    styles: { font: 'helvetica', overflow: 'linebreak' },
  });
  return doc.lastAutoTable.finalY;
}

// ── Sampul ──────────────────────────────────────────────────────────
function renderCover(doc, property, ctx, score) {
  const rc = riskRGB(score);
  // Pita atas
  doc.setFillColor(...STRUCT).rect(0, 0, PAGE.w, 4, 'F');

  // Wordmark
  doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(...STRUCT);
  doc.text('S.A.F.E HOUSE', PAGE.m, 30);
  doc.setFont('helvetica', 'normal').setFontSize(7.5).setTextColor(...MUTED);
  doc.text('Spatial Analyst for Flood & Environment', PAGE.m, 34.5);

  // Judul
  doc.setFont('helvetica', 'bold').setFontSize(23).setTextColor(...INK);
  const title = doc.splitTextToSize('Laporan Audit Risiko Geoteknik & Lingkungan', CONTENT_W);
  title.forEach((ln, i) => doc.text(ln, PAGE.m, 62 + i * lineH(23)));
  doc.setFont('helvetica', 'normal').setFontSize(11).setTextColor(...ACCENT);
  doc.text('Desk Study Berbasis Data Publik Terverifikasi', PAGE.m, 62 + title.length * lineH(23) + 5);

  // Panel skor
  const panelY = 108, panelH = 34;
  doc.setFillColor(...tint(rc, 0.92)).roundedRect(PAGE.m, panelY, CONTENT_W, panelH, 2.5, 2.5, 'F');
  doc.setDrawColor(...rc).setLineWidth(0.5).roundedRect(PAGE.m, panelY, CONTENT_W, panelH, 2.5, 2.5, 'S');
  doc.setFont('helvetica', 'bold').setFontSize(7.5).setTextColor(...MUTED);
  doc.text('SKOR KESELAMATAN S.A.F.E', PAGE.m + 8, panelY + 10);
  // angka + suffix pada baseline sama
  const baseline = panelY + 26;
  doc.setFont('helvetica', 'bold').setFontSize(34).setTextColor(...rc);
  doc.text(String(score), PAGE.m + 8, baseline);
  const numW = doc.getTextWidth(String(score));
  doc.setFontSize(13).setTextColor(...MUTED);
  doc.text('/100', PAGE.m + 8 + numW + 2, baseline);
  // label risiko (chip kanan)
  const label = riskLabel(score);
  doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(...rc);
  doc.text(label, PAGE.w - PAGE.m - 8, baseline, { align: 'right' });
  doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...MUTED);

  // Metadata (label kiri / nilai kanan, garis rambut antar baris)
  let my = panelY + panelH + 16;
  const meta = [
    ['Lokasi', property.address || '—'],
    ['Koordinat', `${formatNum(property.lat, '', 5)}, ${formatNum(property.lon, '', 5)}`],
    ['Nomor Laporan', ctx.reportNo],
    ['Tanggal Terbit', ctx.dateStr],
    ['Status Audit', String(property.audit_status || 'valid')],
  ];
  meta.forEach(([k, v]) => {
    doc.setFont('helvetica', 'bold').setFontSize(8).setTextColor(...FAINT);
    doc.text(k.toUpperCase(), PAGE.m, my);
    doc.setFont('helvetica', 'normal').setFontSize(9.5).setTextColor(...INK);
    const vLines = doc.splitTextToSize(v, CONTENT_W - 48);
    vLines.forEach((ln, i) => doc.text(ln, PAGE.m + 48, my + i * lineH(9.5)));
    const rowH = Math.max(lineH(9.5) * vLines.length, 6) + 3;
    doc.setDrawColor(...HAIR).setLineWidth(0.2);
    doc.line(PAGE.m, my + rowH - 3, PAGE.w - PAGE.m, my + rowH - 3);
    my += rowH + 1.5;
  });

  // Kaki sampul
  doc.setDrawColor(...STRUCT).setLineWidth(0.3);
  doc.line(PAGE.m, PAGE.h - 24, PAGE.w - PAGE.m, PAGE.h - 24);
  doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...MUTED);
  doc.text('Disiapkan oleh S.A.F.E House', PAGE.m, PAGE.h - 18);
  doc.setTextColor(...FAINT).setFontSize(7);
  doc.text('Audit risiko geoteknik & lingkungan properti Indonesia', PAGE.m, PAGE.h - 13.5);
}

// ── Bangun dokumen (dipisah dari save agar bisa diinspeksi) ─────────
export function buildReportDoc(property, lang = 'id') {
  if (!property || !Number.isFinite(property.safe_score)) {
    throw new Error('Laporan hanya dapat dibuat dari audit dengan skor backend yang valid.');
  }
  const g = property.geotech || {};
  const date = new Date();
  const dateStr = date.toLocaleDateString(lang === 'en' ? 'en-US' : 'id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  const reportNo = reportNumber(property, date);
  const score = property.safe_score ?? 0;
  const ctx = { reportNo, dateStr, page: 1 };

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  doc.setLineHeightFactor(1.15);

  renderCover(doc, property, ctx, score);

  // ── Halaman isi ──
  doc.addPage();
  ctx.page = 2;
  decoratePage(doc, ctx);
  let y = 26;

  // Ringkasan Eksekutif (lead, tanpa nomor)
  const es = executiveSummary(property);
  y = sectionTitle(doc, null, 'Ringkasan Eksekutif', y);
  y = paragraph(doc, es.headline, y, { bold: true, size: 10.5, gap: 3.5 });
  es.findings.forEach((f) => { y = bullet(doc, f, y); });
  y += 1.5;
  // kotak rekomendasi ringkas
  {
    const recLines = doc.splitTextToSize(es.recommendation, CONTENT_W - 10);
    const boxH = recLines.length * lineH(9.5) + 9;
    doc.setFillColor(...tint(ACCENT, 0.93)).roundedRect(PAGE.m, y, CONTENT_W, boxH, 2, 2, 'F');
    doc.setFont('helvetica', 'bold').setFontSize(7.5).setTextColor(...ACCENT);
    doc.text('REKOMENDASI RINGKAS', PAGE.m + 5, y + 6);
    doc.setFont('helvetica', 'normal').setFontSize(9.5).setTextColor(...INK);
    recLines.forEach((ln, i) => doc.text(ln, PAGE.m + 5, y + 11 + i * lineH(9.5)));
    y += boxH + 6;
  }

  // 1. Informasi Lokasi
  y = ensureSpace(doc, y, 55, ctx);
  y = sectionTitle(doc, 1, 'Informasi Lokasi', y);
  y = reportTable(doc, y, {
    body: [
      ['Alamat', property.address || '—'],
      ['Lintang (Lat)', formatNum(property.lat, '', 5)],
      ['Bujur (Lon)', formatNum(property.lon, '', 5)],
      ['Elevasi', `${formatNum(property.elevation ?? g.elevation_m, 'm', 0)}${g.elevation_assumed ? ' (diasumsikan)' : ''}`],
      ['Kota terdekat', g.nearest_city || '—'],
    ],
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 46, textColor: MUTED }, 1: { cellWidth: CONTENT_W - 46 } },
  }) + 8;

  // 2. Metodologi
  y = ensureSpace(doc, y, 45, ctx);
  y = sectionTitle(doc, 2, 'Metodologi & Dasar Acuan', y);
  y = paragraph(doc, 'Laporan ini disusun sebagai desk study menggunakan data geospasial publik terverifikasi. Analisis kegempaan mengacu pada SNI 1726:2019 (Tata cara perencanaan ketahanan gempa untuk struktur bangunan gedung dan non-gedung); potensi likuefaksi mengacu pada SNI 8460:2017 (Persyaratan perancangan geoteknik). Sumber data meliputi USGS, InaRISK BNPB, dan PuSGeN 2024.', y);
  y = paragraph(doc, 'Batasan: parameter bersifat regional (resolusi peta nasional) dan tidak menggantikan pengujian tanah lapangan (sondir/boring). Nilai yang tidak tersedia ditampilkan sebagai "—".', y, { color: MUTED, size: 8.5, gap: 4 });

  // 3. Parameter Seismik
  y = ensureSpace(doc, y, 65, ctx);
  y = sectionTitle(doc, 3, 'Parameter Seismik (SNI 1726:2019)', y);
  y = reportTable(doc, y, {
    head: [['Parameter', 'Nilai', 'Keterangan']],
    body: [
      ['Vs30', formatNum(g.vs30, 'm/s', 0), 'Kecepatan gelombang geser 30 m teratas'],
      ['Kelas Situs', g.site_class || '—', siteClassDescription(g.site_class)],
      ['PGA batuan dasar', formatNum(g.pga, 'g', 3), 'Percepatan puncak batuan dasar'],
      ['Koefisien situs Fa', formatNum(g.fa, '', 2), 'Amplifikasi situs'],
      ['PGA permukaan', formatNum(g.pga_surface, 'g', 3), 'PGA di permukaan tanah'],
      ['T0 resonansi', formatNum(g.t0_resonance, 's', 2), 'Perioda alami tanah'],
    ],
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 44 }, 1: { cellWidth: 30, halign: 'right' } },
  }) + 8;

  // 4. Likuefaksi
  y = ensureSpace(doc, y, 40, ctx);
  y = sectionTitle(doc, 4, 'Potensi Likuefaksi', y);
  y = paragraph(doc, liquefactionParagraph(g.fs, g.status), y, { gap: 4 });

  // 5. Banjir & Lingkungan
  y = ensureSpace(doc, y, 32, ctx);
  y = sectionTitle(doc, 5, 'Bahaya Banjir & Lingkungan', y);
  {
    const floodVal = property.hazard?.flood ?? property.hazard?.banjir ?? property.environment?.flood;
    const floodText = (floodVal === null || floodVal === undefined)
      ? 'Tidak terdapat data indeks bahaya banjir pada titik ini menurut InaRISK BNPB (umumnya berarti lokasi berada di luar zona rawan banjir yang dipetakan).'
      : `Indeks bahaya banjir (InaRISK BNPB): ${formatNum(floodVal, '', 2)}. Semakin tinggi indeks (mendekati 1,0) semakin besar potensi bahaya banjir.`;
    y = paragraph(doc, floodText, y, { gap: 4 });
  }

  // 6. Seismotektonik
  y = ensureSpace(doc, y, 55, ctx);
  y = sectionTitle(doc, 6, 'Seismotektonik', y);
  y = reportTable(doc, y, {
    head: [['Fitur', 'Nama', 'Jarak']],
    body: [
      ['Sesar aktif', g.nearest_fault?.name || '—', formatNum(g.nearest_fault?.distance_km, 'km', 1)],
      ['Gunungapi', g.nearest_volcano?.name || '—', formatNum(g.nearest_volcano?.distance_km, 'km', 1)],
      ['Megathrust', g.nearest_megathrust?.name || '—', formatNum(g.nearest_megathrust?.distance_km, 'km', 1)],
      ['Garis pantai', g.nearest_coast?.name || '—', formatNum(g.nearest_coast?.distance_km, 'km', 1)],
    ],
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 42 }, 2: { cellWidth: 28, halign: 'right' } },
  }) + 8;

  // 7. Kesimpulan & Rekomendasi
  y = ensureSpace(doc, y, 45, ctx);
  y = sectionTitle(doc, 7, 'Kesimpulan & Rekomendasi', y);
  conclusionRecommendations(property).forEach((r) => {
    y = ensureSpace(doc, y, 16, ctx);
    y = bullet(doc, r, y);
  });
  y += 3;

  // 8. Sumber Data
  y = ensureSpace(doc, y, 42, ctx);
  y = sectionTitle(doc, 8, 'Sumber Data', y);
  {
    const prov = g.provenance || {};
    const body = Object.keys(prov).length
      ? Object.entries(prov).map(([k, v]) => [k, String(v)])
      : [['—', 'Provenance tidak tersedia']];
    y = reportTable(doc, y, {
      head: [['Parameter', 'Sumber']],
      body,
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 56 } },
    }) + 5;
    if ((property.sources_failed || []).length) {
      y = paragraph(doc, `Sumber tidak tersedia saat audit: ${property.sources_failed.join(', ')}.`, y, { color: DANGER, size: 8.5 });
    }
  }
  y += 4;

  // Penampik
  y = ensureSpace(doc, y, 46, ctx);
  const discText = 'Laporan ini merupakan desk study berbasis data publik beresolusi regional dan BUKAN pengganti penyelidikan tanah lapangan (sondir/boring). Laporan ini BUKAN dokumen resmi Persetujuan Bangunan Gedung (PBG) tanpa verifikasi oleh ahli geoteknik bersertifikat (SKA). S.A.F.E House tidak bertanggung jawab atas keputusan konstruksi yang diambil tanpa pengujian lapangan dan tinjauan ahli.';
  const discLines = doc.splitTextToSize(discText, CONTENT_W - 12);
  const boxH = discLines.length * lineH(8) + 12;
  doc.setFillColor(...tint(DANGER, 0.95)).roundedRect(PAGE.m, y, CONTENT_W, boxH, 2, 2, 'F');
  doc.setDrawColor(...DANGER).setLineWidth(0.3).roundedRect(PAGE.m, y, CONTENT_W, boxH, 2, 2, 'S');
  doc.setFont('helvetica', 'bold').setFontSize(7.5).setTextColor(...DANGER);
  doc.text('PENAMPIK / DISCLAIMER', PAGE.m + 6, y + 6.5);
  doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...INK);
  discLines.forEach((ln, i) => doc.text(ln, PAGE.m + 6, y + 11.5 + i * lineH(8)));

  return doc;
}

export async function exportProfessionalReport(property, lang = 'id') {
  const doc = buildReportDoc(property, lang);
  doc.save(`Laporan-SAFE-${slugify(property.address)}.pdf`);
}
