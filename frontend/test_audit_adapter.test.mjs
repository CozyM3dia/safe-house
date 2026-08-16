import test from 'node:test';
import assert from 'node:assert/strict';

import { adaptAuditResult } from './src/services/auditAdapter.js';

test('adapter preserves official extended hazard map provenance', () => {
  const result = adaptAuditResult({
    lat: -5.397,
    lon: 105.266,
    address: 'Bandar Lampung, Indonesia',
    elevation: 102,
    safe_score: 64,
    risk_level: 'moderate',
    audit_status: 'provisional',
    confidence: 58,
    geotech: {
      vs30: 280,
      site_class: 'SD',
      nearest_fault: { name: 'Sesar Tarahan', distance_km: 12 },
    },
    hazard: {
      radar: { flood: 25, soil: 40, seismic: 60, landslide: 25, subsidence: 50, air: 20 },
      tsunami_map: {
        risk: 85,
        label: 'TINGGI',
        data_status: 'official',
        source: 'InaRISK BNPB — tsunami',
        confidence: 85,
      },
    },
  });

  assert.equal(result.compressedPayload.hazard_maps.tsunami.data_status, 'official');
  assert.equal(result.compressedPayload.hazard_maps.tsunami.source, 'InaRISK BNPB — tsunami');
  assert.equal(result.compressedPayload.hazard_maps.liquefaction, null);
});
