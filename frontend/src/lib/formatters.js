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

// Kode kelas SNI tetap baku; the descriptive label follows the active UI
// language when a caller provides it.
export function siteClass(vs30, lang = 'id') {
  if (!vs30) return '—';
  const labels = lang === 'en'
    ? { soft: 'Soft Soil', medium: 'Medium Soil', hard: 'Stiff Soil', rock: 'Rock' }
    : { soft: 'Tanah Lunak', medium: 'Tanah Sedang', hard: 'Tanah Keras', rock: 'Batuan' };
  if (vs30 < 180) return `SE (${labels.soft})`;
  if (vs30 < 360) return `SD (${labels.medium})`;
  if (vs30 < 760) return `SC (${labels.hard})`;
  return `SB (${labels.rock})`;
}
