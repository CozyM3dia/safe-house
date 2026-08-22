/**
 * Angka bersama untuk instrumen analisis.
 *
 * Dipisahkan dari komponennya karena AnalysisDeck perlu membaca nilai yang
 * sama dengan yang digambar plot (bahaya tertinggi, nada guncangan, SDS/SD1)
 * untuk baris kepala dan keterangannya — tanpa menghitungnya dua kali.
 *
 * Ini turunan tampilan dari hasil audit, bukan mesin kebenaran: semua angka
 * dasarnya tetap datang dari backend.
 */

export const RADAR_AXES = [
  { key: 'flood', id: 'BANJIR', en: 'FLOOD' },
  { key: 'soil', id: 'TANAH', en: 'SOIL' },
  { key: 'seismic', id: 'SEISMIK', en: 'SEISMIC' },
  { key: 'landslide', id: 'LONGSOR', en: 'LANDSLIDE' },
  { key: 'subsidence', id: 'PENURUNAN', en: 'SUBSIDENCE' },
];

export const clampRadarValue = (v) => Math.min(100, Math.max(0, Number(v) || 0));

export function buildRadarData(property) {
  const r = property?.hazard?.radar || {};
  return {
    flood: r.flood ?? 0,
    soil: r.soil ?? 0,
    seismic: r.seismic ?? 0,
    landslide: r.landslide ?? 0,
    subsidence: r.subsidence ?? 50,
  };
}

/** Sumbu bernilai tertinggi — dipakai sebagai angka kepala kanal radar. */
export function peakHazard(property, isEn) {
  const data = buildRadarData(property);
  let top = RADAR_AXES[0];
  let topVal = clampRadarValue(data[top.key]);
  RADAR_AXES.forEach((ax) => {
    const v = clampRadarValue(data[ax.key]);
    if (v > topVal) {
      top = ax;
      topVal = v;
    }
  });
  return { name: isEn ? top.en : top.id, value: Math.round(topVal) };
}

/** Ambang guncangan yang mewarnai seluruh instrumen. */
export function seismicTone(pga) {
  return pga >= 0.5 ? 'danger' : pga >= 0.3 ? 'moderate' : 'safe';
}

/** Spektrum respons desain SNI 1726:2019 dari PGA permukaan. */
export function computeSpectrum(pga) {
  const sds = 2.5 * pga;
  const sd1 = 1.5 * pga;
  const ratio = sds > 0 ? sd1 / sds : 0;
  const t0 = 0.2 * ratio;
  const ts = ratio;
  const points = [];
  for (let i = 0; i <= 60; i += 1) {
    const t = i * 0.05;
    let sa;
    if (t < t0) {
      sa = sds * (0.4 + 0.6 * (t / t0));
    } else if (t <= ts) {
      sa = sds;
    } else {
      sa = sd1 / t;
    }
    if (!Number.isFinite(sa)) sa = 0;
    points.push([Number(t.toFixed(2)), sa]);
  }
  return { sds, sd1, t0, ts, points };
}
