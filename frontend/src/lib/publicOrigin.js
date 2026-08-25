/**
 * Asal publik untuk canonical / OG.
 * safehouse.web.id masih NXDOMAIN — jangan dijadikan default.
 */
const UNRESOLVED_HOSTS = new Set(['safehouse.web.id', 'www.safehouse.web.id']);
const DEFAULT_PUBLIC_ORIGIN = 'https://safehouse-pull.emergent.host';

function normalize(value) {
  return String(value || '').trim().replace(/\/+$/, '');
}

function hostOf(origin) {
  try {
    return new URL(origin.includes('://') ? origin : `https://${origin}`).hostname.toLowerCase();
  } catch {
    return '';
  }
}

export function getPublicSiteUrl() {
  const env = normalize(import.meta.env.VITE_PUBLIC_SITE_URL);
  if (env && !UNRESOLVED_HOSTS.has(hostOf(env))) return env;
  if (typeof window !== 'undefined' && window.location?.origin) {
    const live = normalize(window.location.origin);
    if (live && !UNRESOLVED_HOSTS.has(hostOf(live))) return live;
  }
  return DEFAULT_PUBLIC_ORIGIN;
}

export function laporanUrl(slug) {
  return `${getPublicSiteUrl()}/laporan/${encodeURIComponent(slug)}`;
}

export function ogImageUrl(slug) {
  const origin = getPublicSiteUrl();
  return slug
    ? `${origin}/api/og/img/${encodeURIComponent(slug)}.png`
    : `${origin}/api/og/default.png`;
}
