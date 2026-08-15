export function buildPhotonParams(query) {
  return {
    q: query.trim(),
    limit: 12,
    // Photon supports default, de, en, and fr; Indonesian is not accepted.
    lang: 'default',
  };
}
