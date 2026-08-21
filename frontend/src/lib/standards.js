/**
 * S.A.F.E House — Building Codes & Regulatory Standards Registry
 * Resolves Indonesian SNI, PUPR, SIMBG, and international disaster engineering standards to official document URLs.
 */

export const STANDARDS_REGISTRY = {
  'SNI 1726:2019': {
    code: 'SNI 1726:2019',
    title: 'Tata cara perencanaan ketahanan gempa untuk struktur bangunan gedung dan nongedung',
    publisher: 'BSN (Badan Standardisasi Nasional)',
    url: 'https://sispk.bsn.go.id/SNI/Detail/12713',
    badge: 'BSN SISPK',
    category: 'Seismik & Struktur',
  },
  'SNI 1726:2012': {
    code: 'SNI 1726:2012',
    title: 'Tata cara perencanaan ketahanan gempa untuk struktur bangunan gedung dan non gedung',
    publisher: 'BSN',
    url: 'https://sispk.bsn.go.id/SNI/Detail/9406',
    badge: 'BSN SISPK',
    category: 'Seismik',
  },
  'SNI 8460:2017': {
    code: 'SNI 8460:2017',
    title: 'Persyaratan perancangan geoteknik',
    publisher: 'BSN (Badan Standardisasi Nasional)',
    url: 'https://sispk.bsn.go.id/SNI/Detail/11425',
    badge: 'BSN SISPK',
    category: 'Geoteknik & Pondasi',
  },
  'SNI 2847:2019': {
    code: 'SNI 2847:2019',
    title: 'Persyaratan beton struktural untuk bangunan gedung dan penjelasan',
    publisher: 'BSN (Badan Standardisasi Nasional)',
    url: 'https://sispk.bsn.go.id/SNI/Detail/12714',
    badge: 'BSN SISPK',
    category: 'Struktur Beton',
  },
  'SNI 1727:2020': {
    code: 'SNI 1727:2020',
    title: 'Beban desain minimum dan kriteria terkait untuk bangunan gedung dan struktur lain',
    publisher: 'BSN',
    url: 'https://sispk.bsn.go.id/SNI/Detail/13259',
    badge: 'BSN SISPK',
    category: 'Beban Bangunan',
  },
  'SNI 1729:2020': {
    code: 'SNI 1729:2020',
    title: 'Spesifikasi untuk bangunan gedung baja struktural',
    publisher: 'BSN',
    url: 'https://sispk.bsn.go.id/SNI/Detail/13260',
    badge: 'BSN SISPK',
    category: 'Struktur Baja',
  },
  'PBG/SLF': {
    code: 'PBG / SLF',
    title: 'Sistem Informasi Manajemen Bangunan Gedung (PBG & SLF)',
    publisher: 'Kementerian PUPR',
    url: 'https://simbg.pu.go.id/',
    badge: 'SIMBG PUPR',
    category: 'Perizinan Bangunan',
  },
  'PP 16/2021': {
    code: 'PP No. 16 Tahun 2021',
    title: 'Peraturan Pemerintah No. 16 Tahun 2021 tentang Bangunan Gedung',
    publisher: 'JDIH Peraturan BPK / PUPR',
    url: 'https://peraturan.bpk.go.id/Details/161848/pp-no-16-tahun-2021',
    badge: 'JDIH BPK',
    category: 'Regulasi',
  },
  'PUSGEN 2024': {
    code: 'PuSGeN 2024',
    title: 'Peta Sumber dan Bahaya Gempa Indonesia (Pusat Studi Gempa Nasional)',
    publisher: 'Pusat Studi Gempa Nasional (PUPR)',
    url: 'https://pusgen.pu.go.id/',
    badge: 'PuSGeN',
    category: 'Seismologi',
  },
  'INARISK': {
    code: 'InaRISK BNPB',
    title: 'Portal Kajian Risiko Bencana Indonesia',
    publisher: 'BNPB',
    url: 'https://inarisk.bnpb.go.id/',
    badge: 'InaRISK',
    category: 'Kebencanaan',
  },
  'BMKG': {
    code: 'BMKG',
    title: 'Badan Meteorologi, Klimatologi, dan Geofisika',
    publisher: 'BMKG',
    url: 'https://www.bmkg.go.id/',
    badge: 'BMKG',
    category: 'Cuaca & Gempa',
  },
  'USGS': {
    code: 'USGS Earthquake Hazards',
    title: 'USGS Earthquake Hazards Program',
    publisher: 'US Geological Survey',
    url: 'https://earthquake.usgs.gov/',
    badge: 'USGS',
    category: 'Seismik Global',
  },
};

/**
 * Resolves standard code name (e.g., "SNI 1726:2019", "PBG/SLF", "Permen PUPR") to document metadata & URL.
 */
export function resolveStandardDoc(rawCode) {
  if (!rawCode || typeof rawCode !== 'string') {
    return {
      code: rawCode || 'Standar Teknis',
      title: 'Standar & Regulasi Konstruksi',
      publisher: 'Dokumen Resmi',
      url: 'https://sispk.bsn.go.id/',
      badge: 'Dokumen',
    };
  }

  const clean = rawCode.trim();
  const upper = clean.toUpperCase();

  // 1. Direct key match in registry
  if (STANDARDS_REGISTRY[clean] || STANDARDS_REGISTRY[upper]) {
    return STANDARDS_REGISTRY[clean] || STANDARDS_REGISTRY[upper];
  }

  // 2. Pattern matches for known standards
  if (upper.includes('1726') && (upper.includes('2019') || !upper.includes('2012'))) {
    return STANDARDS_REGISTRY['SNI 1726:2019'];
  }
  if (upper.includes('1726') && upper.includes('2012')) {
    return STANDARDS_REGISTRY['SNI 1726:2012'];
  }
  if (upper.includes('8460')) {
    return STANDARDS_REGISTRY['SNI 8460:2017'];
  }
  if (upper.includes('2847')) {
    return STANDARDS_REGISTRY['SNI 2847:2019'];
  }
  if (upper.includes('1727')) {
    return STANDARDS_REGISTRY['SNI 1727:2020'];
  }
  if (upper.includes('1729')) {
    return STANDARDS_REGISTRY['SNI 1729:2020'];
  }
  if (upper.includes('PBG') || upper.includes('SLF') || upper.includes('SIMBG')) {
    return STANDARDS_REGISTRY['PBG/SLF'];
  }
  if (upper.includes('PP 16') || upper.includes('PP NO. 16') || upper.includes('PP16')) {
    return STANDARDS_REGISTRY['PP 16/2021'];
  }
  if (upper.includes('PUSGEN')) {
    return STANDARDS_REGISTRY['PUSGEN 2024'];
  }
  if (upper.includes('INARISK') || upper.includes('BNPB')) {
    return STANDARDS_REGISTRY['INARISK'];
  }
  if (upper.includes('BMKG')) {
    return STANDARDS_REGISTRY['BMKG'];
  }
  if (upper.includes('USGS')) {
    return STANDARDS_REGISTRY['USGS'];
  }

  // 3. Fallback for any other SNI code
  if (upper.startsWith('SNI')) {
    return {
      code: clean,
      title: `Standar Nasional Indonesia (${clean})`,
      publisher: 'Badan Standardisasi Nasional (BSN)',
      url: `https://sispk.bsn.go.id/SNI/Cari?kategori=sni&kata_kunci=${encodeURIComponent(clean)}`,
      badge: 'BSN SISPK',
    };
  }

  // 4. Fallback for PUPR / Permen
  if (upper.includes('PUPR') || upper.includes('PERMEN')) {
    return {
      code: clean,
      title: `Regulasi Kementerian PUPR (${clean})`,
      publisher: 'JDIH Kementerian PUPR',
      url: 'https://jdih.pu.go.id/',
      badge: 'JDIH PUPR',
    };
  }

  // 5. Generic fallback
  return {
    code: clean,
    title: `Dokumen Standar & Regulasi ${clean}`,
    publisher: 'Dokumen Resmi',
    url: `https://www.google.com/search?q=${encodeURIComponent(clean + ' standar regulasi dokumen resmi')}`,
    badge: 'Dokumen',
  };
}

/**
 * Parses markdown building codes section into structured objects with resolved URLs.
 */
export function parseBuildingCodes(content) {
  if (!content) return [];
  const items = [];
  const lines = content.split('\n');

  for (const line of lines) {
    let lineTrim = line.trim();
    if (!lineTrim) continue;

    // Ignore markdown headings
    if (lineTrim.startsWith('#')) continue;

    // Remove leading list markers (- , * , 1. , 1) , etc.)
    lineTrim = lineTrim.replace(/^(?:[-*•]|\d+[.)])\s*/, '').trim();
    if (!lineTrim) continue;

    let code;
    let description;

    // Case 1: **Title**: Description or **Title** - Description or **Title** Description
    const boldMatch = lineTrim.match(/^\*\*(.*?)\*\*\s*(.*)/);
    if (boldMatch) {
      code = boldMatch[1].trim();
      description = boldMatch[2].trim();
    } else {
      // Case 2: Code: Description or Code - Description
      const splitMatch = lineTrim.match(/^([^:\-–]+)[:\-–]\s*(.*)/);
      if (splitMatch && splitMatch[1].length < 40) {
        code = splitMatch[1].replace(/\*\*/g, '').trim();
        description = splitMatch[2].trim();
      } else {
        code = lineTrim.replace(/\*\*/g, '').trim();
        description = '';
      }
    }

    // Clean up description if any leading/trailing colons or dashes remained
    // Em dash (U+2014) sebelumnya lolos dari daftar pemisah, jadi deskripsi
    // standar tampil sebagai "— Tata cara perencanaan…" di kartu.
    description = description.replace(/^[:\-–—\s]+/, '').trim();

    if (code) {
      const docMeta = resolveStandardDoc(code);
      items.push({
        code,
        description,
        url: docMeta.url,
        badge: docMeta.badge,
        publisher: docMeta.publisher,
        fullTitle: docMeta.title,
      });
    }
  }

  return items;
}
