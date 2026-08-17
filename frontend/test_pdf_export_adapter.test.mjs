import test from 'node:test';
import assert from 'node:assert/strict';

import { adaptAuditResult } from './src/services/auditAdapter.js';
import { canExportPdf, createAuditPdf, getPdfAuditEvidence, getPdfScore } from './src/lib/pdfExport.js';

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

test('PDF accepts the current backend audit contract and exposes truthful AI evidence', () => {
  const backendAudit = {
    lat: -6.2,
    lon: 106.8,
    address: 'Jalan Contoh, Jakarta',
    safe_score: 64,
    risk_level: 'moderate',
    audit_status: 'valid',
    confidence: 58,
    score_version: 'buildability-v3-best-available',
    geotech: {
      elevation_m: 8,
      vs30: 180,
      site_class: 'SD',
      fs: 1.4,
      pga: 0.28,
      pga_surface: 0.35,
      fa: 1.25,
      nearest_fault: { name: 'Sesar Contoh', distance_km: 14 },
      nearest_volcano: { name: 'Gunung Contoh', distance_km: 42 },
      nearest_megathrust: { name: 'Megathrust Selatan Jawa', distance_km: 120 },
      nearest_coast: { name: 'Pantai Utara', distance_km: 18 },
    },
    hazard: {
      radar: { flood: 75, soil: 60, seismic: 50, landslide: 25, subsidence: 40 },
      flood_label: 'TINGGI',
      landslide_label: 'RENDAH',
      subsidence_label: 'SEDANG',
      tsunami: 'RENDAH',
    },
    environment: { aqi: 45, pm25: 12 },
    data_quality: {
      mode: 'best_available',
      coverage_status: 'complete_with_estimates',
      score_axes: ['flood', 'soil', 'seismic', 'landslide', 'subsidence'],
      fields: {
        location: { status: 'reference', confidence: 80, source: 'configured_land_geojson' },
        flood: { status: 'official', confidence: 85, source: 'InaRISK BNPB — banjir' },
        soil: { status: 'model', confidence: 35, source: 'screening_proxy_from_elevation' },
        tsunami: { status: 'model', confidence: 25, source: 'coast_distance_elevation_screening_proxy' },
      },
      estimated_fields: ['soil', 'tsunami'],
      critical_missing: [],
      optional_missing: ['tsunami_map'],
      not_scored: ['tsunami'],
    },
    narrative: {
      geo_stability_explanation: 'Penjelasan geoteknik.',
      seismic_explanation: 'Penjelasan seismik.',
      flood_env_explanation: 'Banjir tinggi karena data InaRISK.',
      micro_analysis: 'Analisis mikro lokasi.',
      detailed_report: '# Audit AI\n\nLaporan lengkap berbasis audit lokasi.',
      sources: ['InaRISK BNPB', 'USGS', 'Open-Meteo'],
      data_limitations: ['Sebagian field masih model screening.'],
      generated_by: 'gemini-3.1-flash-lite',
      metadata: {
        model: 'gemini-3.1-flash-lite',
        delivery_mode: 'live',
        prompt_version: 'audit-grounded-v4',
        generated_at: '2026-08-17T00:00:00Z',
      },
    },
    sources_failed: [],
  };

  assert.equal(getPdfScore(backendAudit), 64);
  assert.equal(canExportPdf(backendAudit), true);
  assert.equal(canExportPdf({ ...backendAudit, audit_status: 'provisional' }), true);

  const evidence = getPdfAuditEvidence(backendAudit);
  assert.equal(evidence.status, 'valid');
  assert.equal(evidence.confidence, 58);
  assert.equal(evidence.officialCount, 1);
  assert.equal(evidence.estimatedCount, 2);
  assert.deepEqual(evidence.notScored, ['tsunami']);
  assert.match(evidence.aiModel, /gemini-3.1-flash-lite/);

  const pdf = createAuditPdf(backendAudit, 'id');
  assert.equal(pdf.getNumberOfPages(), 4);
  assert.ok(pdf.output('arraybuffer').byteLength > 1000);
});
