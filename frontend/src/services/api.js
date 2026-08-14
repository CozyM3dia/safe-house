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
export async function runAudit(lat, lon, lang = 'id') {
  try {
    const { data } = await client.post('/api/audit', { lat, lon, lang });
    return data;
  } catch (err) {
    throw new Error(toReadableError(err));
  }
}

/** Ambil audit tersimpan berdasarkan id. */
export async function getAudit(id) {
  try {
    const { data } = await client.get(`/api/audit/${id}`);
    return data;
  } catch (err) {
    throw new Error(toReadableError(err));
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
    throw new Error(toReadableError(err));
  }
}

/** Ambil audit publik lewat slug. Dipakai halaman /laporan/:slug. */
export async function getSharedReport(slug) {
  try {
    const { data } = await client.get(`/api/share/${slug}`);
    return data;
  } catch (err) {
    throw new Error(toReadableError(err));
  }
}
