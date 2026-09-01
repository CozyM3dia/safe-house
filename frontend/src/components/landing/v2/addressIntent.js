/**
 * Membaca niat pengguna dari satu kolom teks di hero: koordinat mentah,
 * tautan Google Maps, lokasi contoh, atau alamat bebas. Hanya koordinat dan
 * lokasi contoh yang bisa langsung dijembatani ke `/app?lat=&lon=`; alamat
 * bebas diarahkan ke /app agar titiknya dipilih di peta (tidak ada geocoder
 * di URL, dan hero tidak boleh berpura-pura menebak).
 */

export const HERO_PRESETS = [
  { name: 'Pahoman, Bandar Lampung', short: 'Pahoman', lat: -5.4292, lon: 105.261 },
  { name: 'Monas, Jakarta', short: 'Monas', lat: -6.17539, lon: 106.82715 },
  { name: 'Gedung Sate, Bandung', short: 'Gedung Sate', lat: -6.90248, lon: 107.61867 },
  { name: 'Malioboro, Yogyakarta', short: 'Malioboro', lat: -7.79259, lon: 110.36584 },
];

const NUM = '(-?\\d{1,3}(?:\\.\\d+)?)';

export function parseCoord(raw) {
  const text = String(raw ?? '').trim();
  if (!text) return null;

  const at = text.match(new RegExp(`@${NUM},${NUM}`));
  if (at) return { lat: parseFloat(at[1]), lon: parseFloat(at[2]) };

  const bang = text.match(new RegExp(`!3d${NUM}!4d${NUM}`));
  if (bang) return { lat: parseFloat(bang[1]), lon: parseFloat(bang[2]) };

  const pair = text.match(new RegExp(`^${NUM}\\s*[,;\\s]\\s*${NUM}$`));
  if (pair) return { lat: parseFloat(pair[1]), lon: parseFloat(pair[2]) };

  return null;
}

export function resolveIntent(raw) {
  const text = String(raw ?? '').trim();
  if (!text) return { kind: 'idle' };

  const coord = parseCoord(text);
  if (coord) {
    const inRange = Math.abs(coord.lat) <= 90 && Math.abs(coord.lon) <= 180;
    return inRange ? { kind: 'coord', ...coord } : { kind: 'invalid' };
  }

  const needle = text.toLowerCase();
  const preset = HERO_PRESETS.find(
    (p) => p.name.toLowerCase().includes(needle) || p.short.toLowerCase() === needle
  );
  if (preset && needle.length >= 3) return { kind: 'preset', preset, lat: preset.lat, lon: preset.lon };

  return { kind: 'address', text };
}

export function intentToPath(intent) {
  if (intent.kind === 'coord' || intent.kind === 'preset') {
    return `/app?lat=${intent.lat.toFixed(5)}&lon=${intent.lon.toFixed(5)}`;
  }
  return '/app';
}
