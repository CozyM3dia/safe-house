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
