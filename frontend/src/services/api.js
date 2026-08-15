/**
 * Klien backend S.A.F.E House.
 *
 * Satu-satunya jalur dari frontend ke FastAPI. Menggantikan panggilan API
 * langsung di engine.js — frontend tidak lagi memegang kunci apa pun, dan
 * semua perhitungan terjadi di backend.
 *
 * Kontrak respons didefinisikan di backend/models.py (AuditResult). Bentuk
 * itu tidak boleh diasumsikan di sini tanpa memeriksa spec bagian 5.
 */

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 40000, // audit menunggu InaRISK yang bisa lambat — lihat spec
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Pesan galat yang bisa dibaca orang awam, dalam Bahasa Indonesia.
 * Backend sudah mengirim `detail` berbahasa Indonesia untuk galat yang
 * diketahui; sisanya diberi pesan cadangan.
 */
function toReadableError(err) {
  if (err.code === 'ECONNABORTED') {
    return 'Permintaan terlalu lama. Coba lagi beberapa saat lagi.';
  }
  const detail = err.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (!err.response) {
    return 'Tidak dapat menghubungi server. Periksa koneksi Anda.';
  }
  return 'Terjadi kesalahan pada server. Coba lagi.';
}

export async function checkHealth() {
  const { data } = await client.get('/api/health');
  return data;
}

/**
 * Jalankan audit untuk satu koordinat.
 * Mengembalikan AuditResult utuh (tanpa narrative sampai lapis AI aktif).
 */
export async function runAudit(lat, lon, lang = 'id', signal = undefined) {
  try {
    const { data } = await client.post('/api/audit', { lat, lon, lang }, { signal });
    return data;
  } catch (err) {
    throw new Error(toReadableError(err), { cause: err });
  }
}

function adaptNarrative(data) {
  const meta = data.metadata;
  return {
    geoStabilityExplanation: data.geo_stability_explanation,
    seismicExplanation: data.seismic_explanation,
    floodEnvExplanation: data.flood_env_explanation,
    microAnalysis: data.micro_analysis,
    detailedReport: data.detailed_report,
    sources: data.sources || [],
    dataLimitations: data.data_limitations || [],
    generatedBy: data.generated_by,
    streetViewUsed: data.street_view_used === true,
    reportLoading: false,
    deliveryMode: meta?.delivery_mode || 'live',
    aiModel: meta?.model || '',
    cacheAgeSeconds: meta?.cache_age_seconds ?? null,
  };
}

export async function checkAIStatus() {
  const { data } = await client.get('/api/ai/status');
  return data;
}

/**
 * Generate an AI explanation without allowing the model to alter audit scores.
 * Persisted audits use the cacheable ID endpoint; local/demo audits send the
 * validated AuditResult inline so MongoDB remains optional.
 */
export async function generateNarrative(audit, lang = 'id', signal = undefined) {
  try {
    const response = audit.id
      ? await client.post(
          `/api/narrative/${audit.id}`,
          undefined,
          { params: { lang }, signal }
        )
      : await client.post('/api/narrative', { audit, lang }, { signal });
    return adaptNarrative(response.data);
  } catch (err) {
    throw new Error(toReadableError(err), { cause: err });
  }
}

/** Ask S.A.F.E AI about the current deterministic audit. */
export async function chatWithAudit({
  message,
  history = [],
  audit = null,
  comparison = null,
  mode = 'audit',
  lang = 'id',
  signal = undefined,
}) {
  try {
    const { data } = await client.post(
      '/api/chat',
      {
        message,
        history: history.slice(-10).map(({ role, content }) => ({ role, content })),
        audit,
        comparison,
        mode,
        lang,
      },
      { signal }
    );
    return {
      answer: data.answer,
      citations: data.citations || [],
      followUps: data.follow_ups || [],
    };
  } catch (err) {
    throw new Error(toReadableError(err), { cause: err });
  }
}

/** Ambil audit tersimpan berdasarkan id. */
export async function getAudit(id) {
  try {
    const { data } = await client.get(`/api/audit/${id}`);
    return data;
  } catch (err) {
    throw new Error(toReadableError(err), { cause: err });
  }
}

/**
 * Buat tautan publik untuk sebuah audit.
 * Mengembalikan { slug, url_path }. Perlu audit yang tersimpan (id).
 */
export async function createShare(auditId) {
  try {
    const { data } = await client.post('/api/share', { audit_id: auditId });
    return data;
  } catch (err) {
    throw new Error(toReadableError(err), { cause: err });
  }
}

/** Ambil audit publik lewat slug. Dipakai halaman /laporan/:slug. */
export async function getSharedReport(slug) {
  try {
    const { data } = await client.get(`/api/share/${slug}`);
    return data;
  } catch (err) {
    throw new Error(toReadableError(err), { cause: err });
  }
}
