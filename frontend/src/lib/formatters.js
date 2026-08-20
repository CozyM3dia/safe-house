/**
 * Format numbers for data display.
 */

export function formatNumber(n, decimals = 0) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return Number(n).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatVs30(vs30) {
  if (!vs30) return '—';
  return `${formatNumber(vs30)} m/s`;
}

export function formatPga(pga) {
  if (pga === null || pga === undefined) return '—';
  return `${Number(pga).toFixed(2)}g`;
}

export function formatElevation(m) {
  if (!m && m !== 0) return '—';
  return `${formatNumber(m)} m`;
}

export function formatCoord(deg) {
  if (deg === null || deg === undefined) return '—';
  return Number(deg).toFixed(4);
}

export function formatDistance(km) {
  if (!km && km !== 0) return '—';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${Number(km).toFixed(1)} km`;
}

export function truncate(str, n = 40) {
  if (!str) return '';
  if (str.length <= n) return str;
  return str.slice(0, n - 1) + '…';
}

// Nama kelas situs SNI 1726:2019 dalam Bahasa Indonesia. Kode kelasnya
// (SE/SD/SC/SB) baku dan tidak diterjemahkan.
export function siteClass(vs30) {
  if (!vs30) return '—';
  if (vs30 < 180) return 'SE (Tanah Lunak)';
  if (vs30 < 360) return 'SD (Tanah Sedang)';
  if (vs30 < 760) return 'SC (Tanah Keras)';
  return 'SB (Batuan)';
}
