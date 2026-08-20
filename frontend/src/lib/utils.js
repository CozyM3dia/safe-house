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
