import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  riskLabel, formatNum, reportNumber, siteClassDescription,
  executiveSummary, liquefactionParagraph, conclusionRecommendations,
} from './reportTemplates.js';

// ── Palet dokumen putih formal ──────────────────────────────────
const INK = [31, 27, 24];       // teks utama
const MUTED = [110, 96, 80];    // teks sekunder
const ACCENT = [150, 90, 55];   // aksen mocha gelap (untuk cetak)
const LINE = [210, 200, 188];
const SAFE = [21, 128, 61];
const MOD = [180, 120, 20];
const DANGER = [190, 40, 40];

const PAGE = { w: 210, h: 297, m: 18 };
const CONTENT_W = PAGE.w - PAGE.m * 2;

function riskRGB(score) {
  if (score >= 70) return SAFE;
  if (score >= 40) return MOD;
  return DANGER;
}

function slugify(s) {
  return String(s || 'lokasi').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
}

// Header + footer untuk halaman isi (bukan sampul).
function decoratePage(doc, reportNo, pageNo, dateStr) {
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  // kop
  doc.line(PAGE.m, 14, PAGE.w - PAGE.m, 14);
  doc.setFont('helvetica', 'bold').setFontSize(7).setTextColor(...MUTED);
  doc.text('S.A.F.E House — Laporan Audit Risiko Geoteknik & Lingkungan', PAGE.m, 11);
  doc.setFont('helvetica', 'normal');
  doc.text(reportNo, PAGE.w - PAGE.m, 11, { align: 'right' });
  // footer
  doc.line(PAGE.m, PAGE.h - 14, PAGE.w - PAGE.m, PAGE.h - 14);
  doc.setFontSize(6.5).setTextColor(...MUTED);
  doc.text('Desk study berbasis data publik — bukan pengganti penyelidikan tanah lapangan.', PAGE.m, PAGE.h - 10);
  doc.text(`Halaman ${pageNo} · dibuat ${dateStr}`, PAGE.w - PAGE.m, PAGE.h - 10, { align: 'right' });
}

// Judul section, kembalikan Y setelahnya.
function sectionTitle(doc, num, title, y) {
  doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(...ACCENT);
  doc.text(`${num}. ${title}`, PAGE.m, y);
  doc.setDrawColor(...ACCENT).setLineWidth(0.4);
  doc.line(PAGE.m, y + 1.5, PAGE.m + 6, y + 1.5);
  return y + 7;
}

// Paragraf wrap, kembalikan Y baru.
function paragraph(doc, text, y, opts = {}) {
  const size = opts.size || 9;
  doc.setFont('helvetica', opts.bold ? 'bold' : 'normal').setFontSize(size).setTextColor(...(opts.color || INK));
  const lines = doc.splitTextToSize(text, CONTENT_W);
  doc.text(lines, PAGE.m, y);
  return y + lines.length * (size * 0.42) + 2.5;
}

// Cek ruang; bila kurang, halaman baru + dekorasi. Kembalikan Y.
function ensureSpace(doc, y, need, ctx) {
  if (y + need > PAGE.h - 20) {
    doc.addPage();
    ctx.page += 1;
    decoratePage(doc, ctx.reportNo, ctx.page, ctx.dateStr);
    return 22;
  }
  return y;
}

export async function exportProfessionalReport(property, lang = 'id') {
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

  // ── SAMPUL ──
  doc.setFillColor(250, 247, 243).rect(0, 0, PAGE.w, PAGE.h, 'F');
  doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(...ACCENT);
  doc.text('S.A.F.E HOUSE', PAGE.m, 40);
  doc.setDrawColor(...ACCENT).setLineWidth(0.5).line(PAGE.m, 44, PAGE.m + 30, 44);

  doc.setFontSize(24).setTextColor(...INK);
  doc.text(doc.splitTextToSize('LAPORAN AUDIT RISIKO GEOTEKNIK & LINGKUNGAN', CONTENT_W), PAGE.m, 70);
  doc.setFont('helvetica', 'normal').setFontSize(11).setTextColor(...MUTED);
  doc.text('(Desk Study Berbasis Data Publik)', PAGE.m, 90);

  // blok info sampul
  const infoY = 120;
  const rows = [
    ['Lokasi', property.address || '—'],
    ['Koordinat', `${formatNum(property.lat, '', 5)}, ${formatNum(property.lon, '', 5)}`],
    ['No. Laporan', reportNo],
    ['Tanggal', dateStr],
    ['Status Audit', `${property.audit_status || 'valid'} (confidence ${property.confidence ?? 0}%)`],
  ];
  autoTable(doc, {
    startY: infoY,
    margin: { left: PAGE.m, right: PAGE.m },
    body: rows,
    theme: 'plain',
    styles: { font: 'helvetica', fontSize: 10, textColor: INK, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40, textColor: MUTED }, 1: { cellWidth: CONTENT_W - 40 } },
  });

  // skor besar di sampul
  const rc = riskRGB(score);
  doc.setFont('helvetica', 'bold').setFontSize(40).setTextColor(...rc);
  doc.text(`${score}`, PAGE.m, 215);
  doc.setFontSize(12).setTextColor(...MUTED);
  doc.text(`/100 — ${riskLabel(score)}`, PAGE.m + 26, 215);

  doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...MUTED);
  doc.text('Disiapkan oleh S.A.F.E House · Audit risiko geoteknik properti Indonesia', PAGE.m, PAGE.h - 20);

  // ── HALAMAN ISI ──
  doc.addPage();
  ctx.page = 2;
  decoratePage(doc, reportNo, ctx.page, dateStr);
  let y = 24;

  // Ringkasan Eksekutif
  const es = executiveSummary(property);
  y = sectionTitle(doc, 'A', 'Ringkasan Eksekutif', y);
  y = paragraph(doc, es.headline, y, { bold: true });
  es.findings.forEach((f) => { y = paragraph(doc, `• ${f}`, y); });
  y = paragraph(doc, `Rekomendasi: ${es.recommendation}`, y, { color: ACCENT });
  y += 3;

  // 1. Informasi Lokasi
  y = ensureSpace(doc, y, 50, ctx);
  y = sectionTitle(doc, '1', 'Informasi Lokasi', y);
  autoTable(doc, {
    startY: y, margin: { left: PAGE.m, right: PAGE.m },
    body: [
      ['Alamat', property.address || '—'],
      ['Lintang (Lat)', formatNum(property.lat, '', 5)],
      ['Bujur (Lon)', formatNum(property.lon, '', 5)],
      ['Elevasi', `${formatNum(property.elevation ?? g.elevation_m, 'm', 0)}${g.elevation_assumed ? ' (diasumsikan)' : ''}`],
      ['Kota terdekat', g.nearest_city || '—'],
    ],
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 9, textColor: INK, cellPadding: 1.8, lineColor: LINE },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45, textColor: MUTED } },
  });
  y = doc.lastAutoTable.finalY + 6;

  // 2. Metodologi
  y = ensureSpace(doc, y, 40, ctx);
  y = sectionTitle(doc, '2', 'Metodologi & Dasar Acuan', y);
  y = paragraph(doc, 'Laporan ini disusun sebagai desk study menggunakan data geospasial publik terverifikasi. Analisis kegempaan mengacu pada SNI 1726:2019 (Tata cara perencanaan ketahanan gempa untuk struktur bangunan gedung dan non-gedung), sedangkan potensi likuefaksi mengacu pada SNI 8460:2017 (Persyaratan perancangan geoteknik). Sumber data meliputi USGS (topografi/seismik), InaRISK BNPB (bahaya banjir/longsor/gempa), dan PuSGeN 2024 (geometri sesar aktif).', y);
  y = paragraph(doc, 'Batasan: parameter bersifat regional (resolusi peta nasional) dan tidak menggantikan pengujian tanah lapangan (sondir/boring). Nilai yang tidak tersedia ditampilkan sebagai "—".', y, { color: MUTED, size: 8 });
  y += 3;

  // 3. Parameter Seismik
  y = ensureSpace(doc, y, 60, ctx);
  y = sectionTitle(doc, '3', 'Parameter Seismik (SNI 1726:2019)', y);
  autoTable(doc, {
    startY: y, margin: { left: PAGE.m, right: PAGE.m },
    head: [['Parameter', 'Nilai', 'Keterangan']],
    body: [
      ['Vs30', formatNum(g.vs30, 'm/s', 0), 'Kecepatan gelombang geser 30 m teratas'],
      ['Kelas Situs', g.site_class || '—', siteClassDescription(g.site_class)],
      ['PGA batuan dasar', formatNum(g.pga, 'g', 3), 'Percepatan puncak batuan dasar'],
      ['Koefisien situs Fa', formatNum(g.fa, '', 2), 'Amplifikasi situs'],
      ['PGA permukaan', formatNum(g.pga_surface, 'g', 3), 'PGA di permukaan tanah'],
      ['T0 resonansi', formatNum(g.t0_resonance, 's', 2), 'Perioda alami tanah'],
    ],
    theme: 'striped',
    headStyles: { fillColor: ACCENT, textColor: [255, 255, 255], fontSize: 9 },
    styles: { font: 'helvetica', fontSize: 8.5, textColor: INK, cellPadding: 1.8, lineColor: LINE },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 42 }, 1: { cellWidth: 30 } },
  });
  y = doc.lastAutoTable.finalY + 6;

  // 4. Likuefaksi
  y = ensureSpace(doc, y, 40, ctx);
  y = sectionTitle(doc, '4', 'Potensi Likuefaksi', y);
  y = paragraph(doc, liquefactionParagraph(g.fs, g.status), y);
  y += 3;

  // 5. Banjir & Lingkungan
  y = ensureSpace(doc, y, 30, ctx);
  y = sectionTitle(doc, '5', 'Bahaya Banjir & Lingkungan', y);
  {
    const floodVal = property.hazard?.flood ?? property.hazard?.banjir ?? property.environment?.flood;
    const floodText = (floodVal === null || floodVal === undefined)
      ? 'Tidak terdapat data indeks bahaya banjir pada titik ini menurut InaRISK BNPB (umumnya berarti lokasi berada di luar zona rawan banjir yang dipetakan).'
      : `Indeks bahaya banjir (InaRISK BNPB): ${formatNum(floodVal, '', 2)}. Semakin tinggi indeks (mendekati 1,0) semakin besar potensi bahaya banjir.`;
    y = paragraph(doc, floodText, y);
  }
  y += 3;

  // 6. Seismotektonik
  y = ensureSpace(doc, y, 55, ctx);
  y = sectionTitle(doc, '6', 'Seismotektonik', y);
  autoTable(doc, {
    startY: y, margin: { left: PAGE.m, right: PAGE.m },
    head: [['Fitur', 'Nama', 'Jarak']],
    body: [
      ['Sesar aktif', g.nearest_fault?.name || '—', formatNum(g.nearest_fault?.distance_km, 'km', 1)],
      ['Gunungapi', g.nearest_volcano?.name || '—', formatNum(g.nearest_volcano?.distance_km, 'km', 1)],
      ['Megathrust', g.nearest_megathrust?.name || '—', formatNum(g.nearest_megathrust?.distance_km, 'km', 1)],
      ['Garis pantai', g.nearest_coast?.name || '—', formatNum(g.nearest_coast?.distance_km, 'km', 1)],
    ],
    theme: 'striped',
    headStyles: { fillColor: ACCENT, textColor: [255, 255, 255], fontSize: 9 },
    styles: { font: 'helvetica', fontSize: 8.5, textColor: INK, cellPadding: 1.8, lineColor: LINE },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 }, 2: { cellWidth: 28 } },
  });
  y = doc.lastAutoTable.finalY + 6;

  // 7. Kesimpulan & Rekomendasi
  y = ensureSpace(doc, y, 50, ctx);
  y = sectionTitle(doc, '7', 'Kesimpulan & Rekomendasi', y);
  conclusionRecommendations(property).forEach((r) => {
    y = ensureSpace(doc, y, 14, ctx);
    y = paragraph(doc, `• ${r}`, y);
  });
  y += 3;

  // 8. Sumber Data
  y = ensureSpace(doc, y, 40, ctx);
  y = sectionTitle(doc, '8', 'Sumber Data', y);
  {
    const prov = g.provenance || {};
    const body = Object.keys(prov).length
      ? Object.entries(prov).map(([k, v]) => [k, String(v)])
      : [['—', 'Provenance tidak tersedia']];
    autoTable(doc, {
      startY: y, margin: { left: PAGE.m, right: PAGE.m },
      head: [['Parameter', 'Sumber']],
      body,
      theme: 'grid',
      headStyles: { fillColor: MUTED, textColor: [255, 255, 255], fontSize: 8.5 },
      styles: { font: 'helvetica', fontSize: 8, textColor: INK, cellPadding: 1.5, lineColor: LINE },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 } },
    });
    y = doc.lastAutoTable.finalY + 4;
    if ((property.sources_failed || []).length) {
      y = paragraph(doc, `Sumber tidak tersedia saat audit: ${property.sources_failed.join(', ')}.`, y, { color: DANGER, size: 8 });
    }
  }
  y += 3;

  // Penampik
  y = ensureSpace(doc, y, 42, ctx);
  doc.setDrawColor(...DANGER).setLineWidth(0.5);
  doc.setFillColor(252, 245, 243);
  const discLines = doc.splitTextToSize(
    'PENAMPIK (DISCLAIMER): Laporan ini merupakan desk study berbasis data publik beresolusi regional dan BUKAN pengganti penyelidikan tanah lapangan (sondir/boring). Laporan ini BUKAN dokumen resmi Persetujuan Bangunan Gedung (PBG) tanpa verifikasi oleh ahli geoteknik bersertifikat (SKA). S.A.F.E House tidak bertanggung jawab atas keputusan konstruksi yang diambil tanpa pengujian lapangan dan tinjauan ahli.',
    CONTENT_W - 8
  );
  const boxH = discLines.length * 3.8 + 8;
  doc.rect(PAGE.m, y, CONTENT_W, boxH, 'FD');
  doc.setFont('helvetica', 'normal').setFontSize(7.5).setTextColor(...INK);
  doc.text(discLines, PAGE.m + 4, y + 5);

  doc.save(`Laporan-SAFE-${slugify(property.address)}.pdf`);
}
