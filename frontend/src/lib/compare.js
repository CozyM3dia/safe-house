/**
 * Perbandingan dua AuditResult — murni deterministik.
 *
 * Seluruh angka di sini dibaca langsung dari AuditResult dan dibandingkan di
 * frontend. Lapis AI TIDAK PERNAH menyentuh nilai-nilai ini; AI hanya menulis
 * narasi laporan. Aturan ini ada di CLAUDE.md dan tidak boleh dilanggar.
 *
 * Bentuk bidang mengikuti backend/models.py (snake_case).
 */

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/**
 * Definisi baris perbandingan.
 *
 * - `read`    : ambil nilai numerik pembanding, atau null bila tak diketahui
 * - `display` : teks yang ditampilkan untuk nilai tersebut
 * - `note`    : keterangan pendek di bawah nilai (kelas situs, status, label)
 * - `higherIsBetter` : arah "lebih baik"
 * - `tolerance`      : selisih di bawah ini dianggap setara (≈)
 */
export const COMPARE_ROWS = [
  {
    key: 'score',
    label: 'Skor SAFE',
    higherIsBetter: true,
    tolerance: 3,
    read: (p) => num(p?.safe_score),
    display: (v) => (v === null ? '—' : String(v)),
    note: () => null,
    unit: '',
  },
  {
    key: 'vs30',
    label: 'Vs30',
    higherIsBetter: true,
    tolerance: 15,
    read: (p) => num(p?.geotech?.vs30),
    display: (v) => (v === null ? '—' : `${v}`),
    note: (p) => p?.geotech?.site_class ?? null,
    unit: 'm/s',
  },
  {
    key: 'pga',
    label: 'PGA permukaan',
    higherIsBetter: false,
    tolerance: 0.02,
    read: (p) => num(p?.geotech?.pga_surface),
    display: (v) => (v === null ? '—' : v.toFixed(3)),
    note: () => null,
    unit: 'g',
  },
  {
    key: 'fs',
    label: 'FS likuefaksi',
    higherIsBetter: true,
    tolerance: 0.15,
    read: (p) => num(p?.geotech?.fs),
    display: (v) => (v === null ? '—' : v.toFixed(2)),
    note: (p) => p?.geotech?.status ?? null,
    unit: '',
  },
  {
    key: 'fault',
    label: 'Jarak sesar',
    higherIsBetter: true,
    tolerance: 2,
    read: (p) => num(p?.geotech?.nearest_fault?.distance_km),
    display: (v) => (v === null ? '—' : v.toFixed(1)),
    note: (p) => p?.geotech?.nearest_fault?.name ?? null,
    unit: 'km',
  },
  {
    key: 'flood',
    label: 'Bahaya banjir',
    higherIsBetter: false,
    tolerance: 10,
    // InaRISK bisa gagal dihubungi. `flood_known === false` berarti "server
    // tidak menjawab", bukan "tidak ada bahaya" — dua hal yang sangat berbeda
    // dan pernah tertukar di versi lama (lihat backend/services/scoring.py).
    read: (p) =>
      p?.hazard?.flood_known === false ? null : num(p?.hazard?.flood_risk),
    display: (v) => (v === null ? '—' : String(v)),
    note: (p) => (p?.hazard?.flood_known === false ? null : p?.hazard?.flood_label ?? null),
    unit: '',
  },
];

/**
 * Bandingkan satu baris. Mengembalikan pemenang baris atau penanda tak
 * diketahui / setara.
 */
function compareRow(row, a, b) {
  const aValue = row.read(a);
  const bValue = row.read(b);
  const known = aValue !== null && bValue !== null;

  let better = null; // 'A' | 'B' | 'equal' | null (tak diketahui)
  let delta = null;

  if (known) {
    delta = aValue - bValue;
    if (Math.abs(delta) < row.tolerance) {
      better = 'equal';
    } else {
      const aWins = row.higherIsBetter ? delta > 0 : delta < 0;
      better = aWins ? 'A' : 'B';
    }
  }

  return {
    key: row.key,
    label: row.label,
    unit: row.unit,
    aValue,
    bValue,
    aDisplay: row.display(aValue),
    bDisplay: row.display(bValue),
    aNote: aValue === null ? null : row.note(a),
    bNote: bValue === null ? null : row.note(b),
    known,
    better,
    delta,
    tolerance: row.tolerance,
  };
}

/**
 * Kalimat alasan berbahasa awam, disusun dari dua selisih terbesar.
 *
 * Selisih dinormalkan terhadap toleransi masing-masing parameter supaya
 * "PGA beda 0.05 g" dan "Vs30 beda 90 m/s" bisa dibandingkan besarannya.
 */
function buildReason(rows, winner) {
  const drivers = rows
    .filter((r) => r.key !== 'score' && r.known && r.better !== 'equal')
    .map((r) => ({ ...r, weight: Math.abs(r.delta) / r.tolerance }))
    .sort((x, y) => y.weight - x.weight)
    .slice(0, 2);

  if (drivers.length === 0) return null;

  const nameOf = (side) => `Lokasi ${side}`;
  // Label dipakai apa adanya: Vs30, PGA, dan FS adalah akronim baku SNI —
  // menurunkannya jadi huruf kecil justru merusak istilah.
  const phrase = (r) => `${r.label} (${r.aDisplay} vs ${r.bDisplay}${r.unit ? ` ${r.unit}` : ''})`;

  const aligned = drivers.filter((r) => r.better === winner);
  const opposed = drivers.filter((r) => r.better !== winner);

  if (winner && aligned.length > 0 && opposed.length > 0) {
    return `${nameOf(winner)} unggul pada ${aligned.map(phrase).join(' dan ')}, meski ${nameOf(opposed[0].better)} lebih baik pada ${phrase(opposed[0])}.`;
  }
  if (winner && aligned.length > 0) {
    return `${nameOf(winner)} unggul terutama pada ${aligned.map(phrase).join(' dan ')}.`;
  }
  // Skor setara atau tak ada pemenang: sebutkan saja perbedaan terbesar.
  return `Perbedaan terbesar ada pada ${drivers.map(phrase).join(' dan ')}.`;
}

/**
 * @returns {{
 *   rows: object[],
 *   winner: 'A'|'B'|null,
 *   status: 'winner'|'tie'|'insufficient',
 *   scoreA: number|null,
 *   scoreB: number|null,
 *   scoreDelta: number|null,
 *   reason: string|null,
 *   unknownLabels: string[],
 * }}
 */
export function compareAudits(propertyA, propertyB) {
  const rows = COMPARE_ROWS.map((row) => compareRow(row, propertyA, propertyB));
  const scoreRow = rows.find((r) => r.key === 'score');

  const scoreA = scoreRow.aValue;
  const scoreB = scoreRow.bValue;

  // safe_score adalah Optional[int] di backend. Tanpa skor di salah satu sisi,
  // menebak pemenang berarti mengarang — tabel parameter tetap ditampilkan
  // sebagai rujukan, tapi verdict-nya jujur bilang data tidak cukup.
  let status = 'insufficient';
  let winner = null;

  if (scoreRow.known) {
    if (scoreRow.better === 'equal') {
      status = 'tie';
    } else {
      status = 'winner';
      winner = scoreRow.better;
    }
  }

  return {
    rows,
    winner,
    status,
    scoreA,
    scoreB,
    scoreDelta: scoreRow.delta,
    reason: buildReason(rows, winner),
    unknownLabels: rows.filter((r) => !r.known).map((r) => r.label),
  };
}
