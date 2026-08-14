/**
 * Adapter: AuditResult (backend) → bentuk lama engine.js.
 *
 * Kartu dashboard sudah membaca AuditResult langsung. Adapter ini sekarang
 * dipakai HANYA oleh generator PDF (lib/pdfExport.js), yang masih terikat
 * bentuk lama. Hapus setelah pdfExport ditulis ulang untuk membaca
 * AuditResult.
 */

/** @param {object} r AuditResult dari POST /api/audit */
export function adaptAuditResult(r) {
  const g = r.geotech || {};
  const h = r.hazard || {};
  const env = r.environment || {};
  const radar = h.radar || {};

  return {
    id: r.id || null,
    coords: { lat: r.lat, lon: r.lon },
    address: r.address,
    elevasi: r.elevation ?? g.elevation_m ?? 0,
    isOcean: h.is_water || false,

    vs30: g.vs30,
    siteClass: g.site_class,

    seismic: {
      faultName: g.nearest_fault?.name,
      faultDist: g.nearest_fault?.distance_km,
      pgaBase: g.pga,
      pgaSurface: g.pga_surface,
    },

    // Sumbu radar 0–100 (makin tinggi makin buruk) — nama field sama
    // dengan yang lama supaya RadarCard tidak berubah.
    radarData: {
      flood: radar.flood ?? 0,
      soil: radar.soil ?? 0,
      air: radar.air ?? 0,
      seismic: radar.seismic ?? 0,
      landslide: radar.landslide ?? 0,
    },

    safeScore: r.safe_score,
    riskLevel: r.risk_level,

    // Padanan compressedPayload lama — dipakai kartu detail dan, nanti,
    // lapis AI. Field mengikuti penamaan lama supaya konsumen tak berubah.
    compressedPayload: {
      address: r.address,
      coordinates: { lat: r.lat, lon: r.lon },
      nearby_env: r.nearby || [],
      elevasi: `${r.elevation ?? 0}m`,
      reference_pga_city: g.nearest_city,
      liquefaction_analysis: {
        fs_score: g.fs,
        status: g.status,
        vs30_est: h.is_water ? 'N/A' : `${g.vs30} m/s`,
        site_class: g.site_class,
        pga_design_base: g.pga,
        amplification_fa: g.fa,
        pga_surface: g.pga_surface,
      },
      seismotectonic: {
        nearest_fault: {
          name: g.nearest_fault?.name,
          dist_km: g.nearest_fault?.distance_km,
        },
        nearest_volcano: {
          name: g.nearest_volcano?.name,
          dist_km: g.nearest_volcano?.distance_km,
        },
        megathrust: {
          name: g.nearest_megathrust?.name,
          dist_km: g.nearest_megathrust?.distance_km,
        },
      },
      tsunami_analysis: {
        risk_level: h.tsunami,
        dist_to_coast_km: g.nearest_coast?.distance_km,
        nearest_coast: g.nearest_coast?.name,
      },
      flood_hazard: h.flood_label,
      landslide_hazard: h.landslide_label,
      env_extras: {
        aqi: env.aqi,
        pm25: env.pm25 != null ? `${env.pm25} µg/m³` : null,
        temperature: env.temperature_c != null ? `${env.temperature_c}°C` : null,
        humidity: env.humidity_pct != null ? `${env.humidity_pct}%` : null,
      },
      historical_earthquakes: r.seismic?.history?.length ? r.seismic.history : null,
    },

    // Penanda sumber yang gagal — frontend bisa memberi label jujur
    // ketika sebuah data tidak tersedia, bukan menampilkan angka kosong.
    sourcesFailed: r.sources_failed || [],
    hazardKnown: {
      flood: h.flood_known !== false,
      landslide: h.landslide_known !== false,
    },
  };
}
