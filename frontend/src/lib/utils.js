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
export function riskLabel(score) {
  if (score >= 70) return 'SAFE';
  if (score >= 40) return 'MODERATE';
  return 'DANGER';
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
