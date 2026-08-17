# Laporan SNI Profesional (PDF) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tombol "Laporan SNI" yang mengunduh laporan audit geoteknik & lingkungan format profesional (A4 putih, multi-halaman) sebagai PDF, terpisah dari PDF dashboard existing.

**Architecture:** Client-side jsPDF + jspdf-autotable. Logika prosa deterministik + format dipisah ke `reportTemplates.js` (pure, unit-testable). Renderer `professionalReport.js` menyusun jsPDF dari RAW `property` backend (kontrak `AuditResult`/`GeotechProfile`). Angka tidak dihitung ulang.

**Tech Stack:** React 19, jsPDF 4.2, jspdf-autotable (baru), node:test.

## Global Constraints

- **Angka dari backend `property`** (`property.geotech.*`, `property.safe_score`, `property.hazard`). TIDAK dihitung ulang. Tidak menyentuh `backend/`.
- **Prosa deterministik** (template by ambang), BUKAN AI.
- **Client-side** jsPDF, no backend.
- **Bahasa Indonesia**, istilah SNI baku ("likuefaksi").
- **Penampik menonjol**: desk study data publik, BUKAN pengganti penyelidikan tanah lapangan / dokumen PBG bersertifikat.
- PDF dashboard existing (`exportPrintReadyPdf`) & `canExportPdf` tidak diubah.
- Field null → tampil "—" (tidak mengarang).
- Ambang: skor ≥70 AMAN, 40–69 SEDANG, <40 WASPADA. FS<1,0 rawan likuefaksi. Sesar <5km / pantai <10km → catatan khusus.

## File Structure

| File | Tanggung jawab | Aksi |
|------|----------------|------|
| `frontend/src/lib/reportTemplates.js` | Pure fn: prosa deterministik + format + no. laporan | Create |
| `frontend/test_report_templates.test.mjs` | Unit test pure fn | Create |
| `frontend/src/lib/professionalReport.js` | `exportProfessionalReport(property, lang)` render jsPDF | Create |
| `frontend/src/components/panels/LeftPanel.jsx` | Tombol "Laporan SNI" | Modify |
| `frontend/package.json` | Dep `jspdf-autotable` | Modify (via npm install) |

---

### Task 1: reportTemplates.js — pure prosa + format

**Files:**
- Create: `frontend/src/lib/reportTemplates.js`
- Test: `frontend/test_report_templates.test.mjs`

**Interfaces:**
- Produces:
  - `riskLabel(score:number) → 'AMAN'|'SEDANG'|'WASPADA'`
  - `formatNum(v, unit='', digits=2) → string` ("—" bila null/NaN)
  - `reportNumber(property, date=new Date()) → 'SAFE/YYYY/MM/NNNN'`
  - `siteClassDescription(sc) → string`
  - `executiveSummary(property) → { headline:string, findings:string[], recommendation:string }`
  - `liquefactionParagraph(fs, status) → string`
  - `conclusionRecommendations(property) → string[]`

- [ ] **Step 1: Write failing test**

Create `frontend/test_report_templates.test.mjs`:

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  riskLabel, formatNum, reportNumber, siteClassDescription,
  executiveSummary, liquefactionParagraph, conclusionRecommendations,
} from './src/lib/reportTemplates.js';

test('riskLabel thresholds', () => {
  assert.equal(riskLabel(85), 'AMAN');
  assert.equal(riskLabel(55), 'SEDANG');
  assert.equal(riskLabel(20), 'WASPADA');
});

test('formatNum handles null, NaN, unit, digits', () => {
  assert.equal(formatNum(null), '—');
  assert.equal(formatNum(undefined), '—');
  assert.equal(formatNum('abc'), '—');
  assert.equal(formatNum(0.291, 'g', 2), '0.29 g');
  assert.equal(formatNum(240, 'm/s', 0), '240 m/s');
});

test('reportNumber format SAFE/YYYY/MM/NNNN', () => {
  const d = new Date('2026-08-17T00:00:00Z');
  const withId = reportNumber({ id: 'abc123def456' }, d);
  assert.match(withId, /^SAFE\/2026\/08\/[0-9A-F]{4}$/);
  const noId = reportNumber({ lat: -6.2, lon: 106.8 }, d);
  assert.match(noId, /^SAFE\/2026\/08\/\d{4}$/);
});

test('siteClassDescription covers SA..SE and unknown', () => {
  assert.match(siteClassDescription('SA'), /Batuan keras/);
  assert.match(siteClassDescription('SE'), /Tanah lunak/);
  assert.equal(siteClassDescription('ZZ'), '—');
});

test('executiveSummary picks label + fs branch', () => {
  const p = { safe_score: 82, geotech: { site_class: 'SC', pga_surface: 0.29, fs: 1.4 } };
  const s = executiveSummary(p);
  assert.match(s.headline, /82\/100/);
  assert.match(s.headline, /AMAN/);
  assert.ok(s.findings.some((f) => /SC/.test(f)));
  assert.ok(s.findings.some((f) => /≥1,0|relatif aman|1\.40/.test(f)));
  assert.match(s.recommendation, /penyelidikan tanah/);
});

test('liquefactionParagraph branches on FS', () => {
  assert.match(liquefactionParagraph(0.8, 'RAWAN'), /di bawah 1,0|mitigasi/);
  assert.match(liquefactionParagraph(1.5, 'AMAN'), /relatif aman/);
  assert.match(liquefactionParagraph(null), /tidak tersedia/);
});

test('conclusionRecommendations always mandates field investigation + liquefaction when FS<1', () => {
  const p = { safe_score: 35, geotech: { site_class: 'SE', fs: 0.7, nearest_fault: { name: 'Lembang', distance_km: 3 }, nearest_coast: { distance_km: 40 } } };
  const rec = conclusionRecommendations(p);
  assert.ok(rec.some((r) => /penyelidikan tanah lapangan/.test(r)));
  assert.ok(rec.some((r) => /likuefaksi/.test(r)));
  assert.ok(rec.some((r) => /sesar aktif/.test(r)));
});
```

- [ ] **Step 2: Run test, verify fail**

Run: `cd frontend && node --test test_report_templates.test.mjs`
Expected: FAIL — `Cannot find module './src/lib/reportTemplates.js'`

- [ ] **Step 3: Implement**

Create `frontend/src/lib/reportTemplates.js`:

```javascript
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
```

- [ ] **Step 4: Run test, verify pass**

Run: `cd frontend && node --test test_report_templates.test.mjs`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/reportTemplates.js frontend/test_report_templates.test.mjs
git commit -m "feat: template prosa deterministik + format laporan SNI"
```

---

### Task 2: professionalReport.js — renderer jsPDF + dep

**Files:**
- Modify: `frontend/package.json` (add `jspdf-autotable`)
- Create: `frontend/src/lib/professionalReport.js`

**Interfaces:**
- Consumes: `reportTemplates.js` (Task 1); jsPDF; jspdf-autotable; `canExportPdf`/`normalizePdfProperty` dari `./pdfExport` tidak wajib (report baca raw property).
- Produces: `exportProfessionalReport(property, lang='id'): Promise<void>` — trigger unduh `Laporan-SAFE-<slug>.pdf`.

> Renderer pakai jsPDF (butuh DOM/browser) → diverifikasi lewat build + manual (Task 4), bukan unit test.

- [ ] **Step 1: Install dep**

Run: `cd frontend && npm install jspdf-autotable`
Expected: `package.json` + lockfile ter-update, exit 0.

- [ ] **Step 2: Implement renderer**

Create `frontend/src/lib/professionalReport.js`:

```javascript
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  riskLabel, formatNum, reportNumber, siteClassDescription,
  executiveSummary, liquefactionParagraph, conclusionRecommendations,
} from './reportTemplates';

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
  const dateStr = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
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

  // total halaman di footer semua halaman isi (opsional: sudah ada per-halaman)
  doc.save(`Laporan-SAFE-${slugify(property.address)}.pdf`);
}
```

- [ ] **Step 3: Verify build**

Run: `cd frontend && npm run build`
Expected: build sukses (import jspdf-autotable resolve).

- [ ] **Step 4: Verify Task 1 test masih pass**

Run: `cd frontend && node --test test_report_templates.test.mjs`
Expected: PASS (7).

- [ ] **Step 5: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/src/lib/professionalReport.js
git commit -m "feat: renderer PDF laporan SNI profesional (jsPDF + autotable)"
```

---

### Task 3: Tombol "Laporan SNI" di LeftPanel

**Files:**
- Modify: `frontend/src/components/panels/LeftPanel.jsx`

**Interfaces:**
- Consumes: `exportProfessionalReport` (Task 2); `canExportPdf` (existing di `../../lib/pdfExport`); store `lang`.

- [ ] **Step 1: Import**

Di `LeftPanel.jsx`, tambah pada import dari pdfExport dan lucide, serta report:

```javascript
import { canExportPdf, exportPrintReadyPdf } from '../../lib/pdfExport';
import { exportProfessionalReport } from '../../lib/professionalReport';
```
(baris `canExportPdf, exportPrintReadyPdf` sudah ada — cukup tambah baris `exportProfessionalReport`.)

Pastikan `FileText` ada di import lucide-react (sudah ada di file).

- [ ] **Step 2: Handler + state**

Di `PopulatedState`, setelah `const [pdfLoading, setPdfLoading] = useState(false);` tambah:

```javascript
  const [reportLoading, setReportLoading] = useState(false);

  const handleDownloadReport = async () => {
    if (!canExportPdf(propertyA)) {
      toast.warning(
        lang === 'en'
          ? 'Report is locked because this audit has insufficient evidence.'
          : 'Laporan dikunci karena bukti audit belum cukup.'
      );
      return;
    }
    setReportLoading(true);
    const toastId = toast.loading(lang === 'en' ? 'Preparing SNI report…' : 'Menyiapkan Laporan SNI…');
    try {
      await exportProfessionalReport(propertyA, lang);
      toast.success(lang === 'en' ? 'SNI report downloaded.' : 'Laporan SNI berhasil diunduh.', { id: toastId });
    } catch (error) {
      console.error('SNI report failed', error);
      toast.error(error.message || (lang === 'en' ? 'Report failed.' : 'Laporan gagal.'), { id: toastId });
    } finally {
      setReportLoading(false);
    }
  };
```

- [ ] **Step 3: Tombol UI**

Di `PopulatedState` return, tepat SEBELUM blok `{/* Full PDF + share actions */}`, sisipkan tombol full-width:

```jsx
      {/* Professional SNI report */}
      <motion.div variants={item}>
        <Button
          onClick={handleDownloadReport}
          disabled={reportLoading}
          variant="secondary"
          size="lg"
          className="w-full group text-xs py-2.5 flex items-center justify-center gap-2 border border-accent/25 hover:border-accent/50 hover:text-accent transition-all"
          title={lang === 'en' ? 'Download the professional SNI-format report PDF' : 'Unduh laporan format SNI profesional (PDF)'}
        >
          {reportLoading ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-accent" />
          ) : (
            <FileText className="h-4 w-4 shrink-0 text-accent" />
          )}
          <span className="font-semibold">{lang === 'en' ? 'SNI Report (PDF)' : 'Laporan SNI (PDF)'}</span>
        </Button>
      </motion.div>
```

- [ ] **Step 4: Verify build**

Run: `cd frontend && npm run build`
Expected: sukses, tanpa error/unused.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/panels/LeftPanel.jsx
git commit -m "feat: tombol Laporan SNI (PDF) di panel audit"
```

---

### Task 4: Verifikasi terintegrasi (manual)

**Files:** none.

- [ ] **Step 1: Guard engine tak tersentuh**

Run: `cd "C:/Kuliah/Vibe Coding/S.A.F.E House" && git diff --name-only main...HEAD -- backend/`
Expected: KOSONG.

- [ ] **Step 2: Build + semua unit test**

Run: `cd frontend && npm run build && node --test test_report_templates.test.mjs`
Expected: build sukses; 7/7 pass.

- [ ] **Step 3: Manual generate**

Pastikan backend jalan (`:8000`) + dev server. Di Browser pane:
1. Klik satu titik darat di peta → tunggu audit selesai (panel terisi).
2. Klik tombol **"Laporan SNI (PDF)"**.
3. Konfirmasi file `Laporan-SAFE-*.pdf` terunduh.
4. Buka PDF: cek sampul (judul, no. laporan, skor), Ringkasan Eksekutif, section 1–8, tabel parameter seismik + seismotektonik, penampik menonjol, kop + footer + no. halaman, teks selectable, Bahasa Indonesia.
5. Cek angka di PDF == angka di dashboard (Vs30, PGA permukaan, FS, skor).
6. `read_console_messages` → tidak ada error saat generate.

- [ ] **Step 4: Commit catatan (opsional) + siap PR**

Tidak ada perubahan kode. Branch siap PR → main (squash).

---

## Self-Review

**Spec coverage:**
- §4 file structure → Task 1 (templates+test), Task 2 (renderer+dep), Task 3 (button) ✓
- §5 struktur 11 bagian → Task 2 (sampul, ringkasan, 1–8, penampik) ✓
- §6 pure fn kontrak → Task 1 (semua fn + test) ✓
- §7 UI tombol → Task 3 ✓
- §2 guards (angka backend, prosa deterministik, penampik, no backend, "—" null) → Task 1/2 + Task 4 guard ✓
- §8 testing → Task 1 unit + Task 4 manual ✓

**Placeholder scan:** tidak ada TBD/TODO; semua step kode nyata. ✓

**Type consistency:** fn dari Task 1 (`riskLabel/formatNum/reportNumber/siteClassDescription/executiveSummary/liquefactionParagraph/conclusionRecommendations`) dipakai konsisten di Task 2. `exportProfessionalReport(property, lang)` dipakai Task 3. Field backend (`property.geotech.*`, `property.safe_score`, `property.hazard`, `property.sources_failed`) sesuai `models.py`. ✓

**Catatan:** field banjir dibaca defensif (`hazard.flood ?? hazard.banjir ?? environment.flood`) karena bentuk `hazard` dict belum baku di `models.py`; null → teks jujur. Implementer verifikasi bentuk `hazard` aktual saat manual test; sesuaikan key bila perlu.
