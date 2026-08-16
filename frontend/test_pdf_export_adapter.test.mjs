import test from 'node:test';
import assert from 'node:assert/strict';

import { adaptAuditResult } from './src/services/auditAdapter.js';
import { canExportPdf, getPdfScore } from './src/lib/pdfExport.js';

test('preserves the generated AI report for PDF export', () => {
  const aiReport = {
    generatedBy: 'gemini-3.1-flash-lite',
    detailedReport: 'Ringkasan audit AI untuk dimasukkan ke PDF.',
  };

  const adapted = adaptAuditResult({
    lat: -6.2,
    lon: 106.8,
    address: 'Jakarta',
    aiReport,
    geotech: {},
    hazard: { radar: { air: 114 } },
    environment: {},
    sources_failed: [],
  });

  assert.deepEqual(adapted.aiReport, aiReport);
  assert.equal(adapted.radarData.air, 100);
});

test('PDF uses the backend score instead of recomputing a legacy formula', () => {
  const adapted = adaptAuditResult({
    lat: -6.2,
    lon: 106.8,
    address: 'Jakarta',
    safe_score: 73,
    audit_status: 'valid',
    narrative: { detailedReport: 'AI report' },
    geotech: {},
    hazard: { radar: { flood: 90, soil: 90, seismic: 90, landslide: 90, subsidence: 90 } },
    environment: {},
    sources_failed: [],
  });

  assert.equal(getPdfScore(adapted), 73);
  assert.equal(canExportPdf(adapted), true);
});

test('PDF refuses incomplete AI or non-buildable audits', () => {
  const incomplete = adaptAuditResult({
    lat: -6.2,
    lon: 106.8,
    address: 'Jakarta',
    safe_score: null,
    audit_status: 'insufficient_data',
    geotech: {},
    hazard: {},
    environment: {},
  });

  assert.equal(canExportPdf(incomplete), false);
});
