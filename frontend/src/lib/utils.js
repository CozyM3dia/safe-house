import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tailwind class composition helper.
 * Merges conditional classNames and dedupes conflicting Tailwind utilities.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Display the platform-appropriate modifier for command shortcuts.
 * The app is frequently used on Windows, where showing a Mac glyph is
 * needlessly confusing, but the same UI still reads correctly on macOS.
 */
export function getModifierShortcut(key = 'K') {
  const platform = typeof navigator !== 'undefined'
    ? (navigator.userAgentData?.platform || navigator.platform || '')
    : '';
  return /Mac|iPhone|iPad|iPod/i.test(platform) ? `⌘${key}` : `Ctrl ${key}`;
}

/**
 * Risk level → color token mapping.
 */
export function riskColor(score) {
  if (score >= 70) return 'safe';
  if (score >= 40) return 'moderate';
  return 'danger';
}

/**
 * Risk level → hex color (for inline styles & charts).
 */
export function riskHex(score) {
  if (score >= 70) return '#10b981';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
}

/**
 * Risk level → label.
 */
// Band skor titik (Indonesia, baku SNI): makin tinggi makin aman.
export function riskLabel(score, lang = 'id') {
  if (lang === 'en') {
    if (score >= 70) return 'SAFE';
    if (score >= 40) return 'MODERATE';
    return 'CAUTION';
  }
  if (score >= 70) return 'AMAN';
  if (score >= 40) return 'SEDANG';
  return 'WASPADA';
}

/**
 * Warna risiko semantik. Satu-satunya sumber kebenaran — sebelumnya triad
 * ini diduplikasi lima kali di seluruh komponen laporan dan mulai saling
 * menyimpang (BattleReport memakai rgba mentah, PbgChecklistCard punya
 * konstantanya sendiri).
 */
export const TONE_HEX = {
  danger: '#ef4444',
  moderate: '#f59e0b',
  safe: '#10b981',
};

/** Isian zona untuk rel ukur (Meter) — flat, bukan gradien. */
export const ZONE_BG = {
  danger: 'rgba(239, 68, 68, 0.26)',
  moderate: 'rgba(245, 158, 11, 0.24)',
  safe: 'rgba(16, 185, 129, 0.24)',
  neutral: 'rgba(212, 149, 106, 0.14)',
};

/**
 * Tone faktor aman likuefaksi mengacu praktik screening:
 * FS < 1,0 potensi likuefaksi; 1,0-1,4 waspada (margin desain konservatif);
 * >= 1,4 aman secara teori.
 */
export function fsTone(fs) {
  if (!Number.isFinite(fs)) return null;
  if (fs < 1) return 'danger';
  if (fs < 1.4) return 'moderate';
  return 'safe';
}

/** Tone nilai intensitas dengan ambang naik (PGA, AQI, dsb). */
export function thresholdTone(value, moderateAt, dangerAt) {
  if (!Number.isFinite(value)) return null;
  if (value >= dangerAt) return 'danger';
  if (value >= moderateAt) return 'moderate';
  return null;
}

/**
 * Tone dari kata band bahaya ("RENDAH", "SEDANG", "TINGGI") pada label
 * berbahasa Indonesia maupun Inggris. Null berarti tidak dikenali.
 */
export function bandTone(band) {
  const s = String(band ?? '').toUpperCase();
  if (/TIDAK ADA|RENDAH|LOW|AMAN/.test(s)) return 'safe';
  if (/SEDANG|MODERATE|WASPADA|MEDIUM/.test(s)) return 'moderate';
  if (/TINGGI|RAWAN|HIGH/.test(s)) return 'danger';
  return null;
}

/**
 * Convert latitude/longitude to a shareable URL.
 */
export function locationToUrl(lat, lng) {
  const url = new URL(window.location.href);
  url.searchParams.set('lat', lat.toFixed(6));
  url.searchParams.set('lng', lng.toFixed(6));
  return url.toString();
}

/**
 * Alamat Nominatim yang dipangkas untuk ruang sempit.
 *
 * Alamat penuh ("Sukolilo, Pati, Jawa Tengah, 59171, Indonesia") selalu
 * terpotong di kolom sempit, dan dua lokasi berdekatan jadi terlihat identik
 * karena yang tersisa cuma awalannya. Dua segmen pertama sudah cukup untuk
 * membedakan, dan bagian yang paling spesifik justru yang dipertahankan.
 */
export function shortAddress(address, segments = 2) {
  if (typeof address !== 'string' || !address.trim()) return '';
  const parts = address
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    // Kode pos tak membedakan apa pun secara visual.
    .filter((p) => !/^\d{4,6}$/.test(p));
  if (parts.length === 0) return address;
  return parts.slice(0, segments).join(', ');
}

/**
 * Label pembeda untuk dua lokasi yang dibandingkan.
 *
 * Dua titik di desa yang sama menghasilkan alamat Nominatim yang identik
 * ("Kondang Wetan, Kalikondang" vs "Kondang Wetan, Kalikondang"), sehingga
 * kartu perbandingan jadi mustahil dibaca. Saat itu terjadi, koordinat yang
 * dipakai sebagai pembeda — bukan alamatnya, karena justru alamat itulah yang
 * sama.
 */
export function comparisonLabels(propertyA, propertyB) {
  const shortA = shortAddress(propertyA?.address);
  const shortB = shortAddress(propertyB?.address);

  if (!shortA || !shortB || shortA !== shortB) {
    return [shortA, shortB];
  }

  const coord = (p) =>
    typeof p?.lat === 'number' && typeof p?.lon === 'number'
      ? `${p.lat.toFixed(3)}, ${p.lon.toFixed(3)}`
      : '';

  const coordA = coord(propertyA);
  const coordB = coord(propertyB);

  // Tanpa koordinat pun, label tetap dikembalikan apa adanya daripada kosong.
  if (!coordA || !coordB) return [shortA, shortB];

  return [`${shortA} · ${coordA}`, `${shortB} · ${coordB}`];
}

/**
 * Apakah animasi hitung-naik harus dilewati dan nilai akhirnya langsung dipakai.
 *
 * requestAnimationFrame tidak berjalan pada tab latar belakang, crawler, atau
 * layanan screenshot. Tanpa penjagaan ini angka membeku di 0 — dan pada
 * laporan risiko yang bisa dibagikan publik, "0/100" adalah pembacaan yang
 * menyesatkan, bukan sekadar animasi yang belum selesai. Preferensi
 * prefers-reduced-motion juga dihormati di sini.
 */
export function shouldSkipCountUp() {
  if (typeof document === 'undefined') return true;
  if (document.hidden) return true;
  return Boolean(
    typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Pisahkan band bahaya dari penanda provenance-nya.
 *
 * Backend menandai nilai turunan dengan sufiks panjang
 * ("RENDAH — ESTIMASI PROVISI (BUKAN PETA BANJIR)"). Penandanya penting,
 * tapi di chip selebar 120px seluruh kalimat itu terpotong dan justru
 * bandnya yang hilang. Di sini band tetap utuh dan penandanya jadi flag
 * ringkas yang bisa ditampilkan sebagai "est.".
 */
export function hazardBand(label) {
  const text = String(label ?? '').trim();
  if (!text) return { band: '', provisional: false };
  // Hanya em dash yang dikenali sebelumnya. Begitu sumbernya memakai en dash
  // atau tanda hubung biasa — hal yang lumrah saat label ditulis ulang atau
  // lewat sistem yang menormalkan tanda baca — pemisahannya gagal diam-diam
  // dan seluruh kalimat kembali membanjiri kolom yang cuma muat satu kata.
  // Tanda hubung biasa hanya dihitung bila diapit spasi, supaya kata majemuk
  // seperti "Sedang-Tinggi" tidak ikut terpotong.
  const [band] = text.split(/\s*[—–]\s*|\s+-\s+/);
  return {
    band: band.trim() || text,
    provisional: /ESTIMASI|PROVISI/i.test(text),
  };
}
