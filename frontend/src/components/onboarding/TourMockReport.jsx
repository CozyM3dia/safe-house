import { motion } from 'framer-motion';
import { FlaskConical, Sparkles, FileText } from 'lucide-react';

import { useT } from '../../hooks/useTranslation';
import { SafeScoreCard } from '../cards/SafeScoreCard';
import { MetricsGrid } from '../cards/MetricsGrid';
import { AnalysisDeck } from '../cards/AnalysisDeck';

/**
 * Contoh hasil audit untuk tur onboarding.
 *
 * Pengguna baru melihat panel kiri kosong — langkah tur "Dashboard
 * Geoteknik" jadi menjanjikan sesuatu yang tidak terlihat. Selama tur
 * menyorot panel, state mock ini menggantikan EmptyState memakai kartu
 * yang sama dengan hasil sungguhan, lalu kembali ke tampilan awal saat
 * tur pindah langkah atau selesai.
 *
 * Angka memakai profil contoh Bandung dekat Sesar Lembang. Skor sengaja
 * di bawah 80 supaya SafeScoreCard tidak melempar confetti di tengah tur.
 */
export const TOUR_MOCK_PROPERTY = {
  address: 'Jl. Asia Afrika No. 8, Bandung',
  lat: -6.918,
  lon: 107.619,
  elevation: 768,
  safe_score: 62,
  audit_status: 'valid',
  geotech: {
    vs30: 327,
    pga: 0.34,
    pga_surface: 0.41,
    fs: 1.35,
    site_class: 'D',
    fa: 1.36,
    elevation_m: 768,
    nearest_fault: { name: 'Sesar Lembang', distance_km: 8.4 },
  },
  hazard: {
    radar: { seismic: 58, flood: 22, soil: 41, landslide: 30, subsidence: 35 },
  },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { delayChildren: 0.08, staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 22, stiffness: 200 } },
};

export function TourMockReport() {
  const t = useT();

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="relative flex min-w-0 flex-col gap-3 p-4 pb-6"
      aria-hidden="true"
      inert
    >
      <motion.div variants={item} className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-md border border-accent/25 bg-accent/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-accent">
          <FlaskConical className="h-3 w-3" />
          {t('tour.mockBadge')}
        </span>
      </motion.div>

      <motion.div variants={item}>
        <SafeScoreCard property={TOUR_MOCK_PROPERTY} />
      </motion.div>

      <motion.div variants={item}>
        <MetricsGrid property={TOUR_MOCK_PROPERTY} />
      </motion.div>

      <motion.div variants={item}>
        <AnalysisDeck property={TOUR_MOCK_PROPERTY} />
      </motion.div>

      {/* Aksi laporan — target spotlight langkah "Laporan AI & PDF SNI".
          Mock statis (inert), hanya menampilkan bentuk tombol aslinya. */}
      <motion.div variants={item} className="flex flex-col gap-2" data-tour="panel-report-actions">
        <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-accent/25 bg-accent/10 px-3 py-2.5 text-xs font-semibold text-accent">
          <Sparkles className="h-4 w-4" />
          {t('panel.viewReport')}
        </div>
        <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-accent/25 bg-white/[0.04] px-3 py-2.5 text-xs font-semibold text-accent">
          <FileText className="h-4 w-4" />
          {t('tour.mockPdfButton')}
        </div>
      </motion.div>
    </motion.div>
  );
}
