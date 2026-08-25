import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Sparkles, FileText, Loader2, GitCompareArrows, ChevronRight, Zap, Crosshair, ArrowUpRight, X } from 'lucide-react';

import { useAppStore } from '../../store/useAppStore';
import { canExportSniReport } from '../../lib/pdfExport';
import { exportProfessionalReport } from '../../lib/professionalReport';
import { useT } from '../../hooks/useTranslation';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { SafeScoreCard } from '../cards/SafeScoreCard';
import { MetricsGrid } from '../cards/MetricsGrid';
import { AnalysisDeck } from '../cards/AnalysisDeck';
import { RadarCard } from '../cards/RadarCard';
import { AddressCard } from '../cards/AddressCard';
import { VerdictCard } from '../cards/VerdictCard';
import { CompareSetup } from '../cards/CompareSetup';
import { TourMockReport } from '../onboarding/TourMockReport';
import { CapabilityPipeline, SampleLocationChannels } from './SiteChannelDeck';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { delayChildren: 0.1, staggerChildren: 0.07 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1, y: 0,
    transition: { type: 'spring', damping: 22, stiffness: 200 },
  },
};

export function LeftPanel() {
  const t = useT();
  const open = useAppStore((s) => s.leftPanelOpen);
  const propertyA = useAppStore((s) => s.propertyA);
  const propertyB = useAppStore((s) => s.propertyB);
  const loading = useAppStore((s) => s.loading);
  const mode = useAppStore((s) => s.mode);
  const setAuditDrawer = useAppStore((s) => s.setAuditDrawer);
  const runBattleReportAction = useAppStore((s) => s.runBattleReportAction);
  const battleReportContent = useAppStore((s) => s.battleReportContent);
  const battleReportLoading = useAppStore((s) => s.battleReportLoading);
  const toggleLeftPanel = useAppStore((s) => s.toggleLeftPanel);
  const tourMockPanel = useAppStore((s) => s.tourMockPanel);

  // Satu nama tampilan menggantikan empat kondisi bersebelahan.
  const view =
    mode === 'battle' ? 'battle'
    : loading ? 'skeleton'
    : propertyA ? 'populated'
    : tourMockPanel ? 'mock'
    : 'empty';

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: -440, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -440, opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 220 }}
          data-tour="left-panel"
          className="glass audit-panel fixed left-2 top-[72px] bottom-4 z-20 flex w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-2xl sm:left-4 sm:w-[380px] sm:max-w-none max-[639px]:left-0 max-[639px]:right-0 max-[639px]:top-auto max-[639px]:bottom-0 max-[639px]:h-[min(66dvh,560px)] max-[639px]:max-h-[calc(100dvh-5rem)] max-[639px]:w-full max-[639px]:max-w-none max-[639px]:rounded-b-none max-[639px]:rounded-t-3xl max-[639px]:border-x-0"
        >
          <div className="relative flex shrink-0 items-center justify-center pb-1 pt-2 sm:hidden">
            <span className="h-1.5 w-12 rounded-full bg-white/20" aria-hidden="true" />
            <button
              type="button"
              onClick={toggleLeftPanel}
              aria-label={t('accessibility.togglePanel')}
              className="absolute right-2 top-1 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-white/8 hover:text-text-primary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-none">
            {/* Dulu keempat tampilan dibungkus `AnimatePresence mode="wait"`.
                Anak yang keluar memakai variants bertahap tanpa varian `exit`,
                sehingga exit-nya tidak pernah dianggap selesai — dan karena
                mode "wait" menahan anak baru sampai itu terjadi, panel membeku
                di EmptyState begitu pengguna pindah ke mode bandingkan.
                Remount lewat `key` cukup: animasi masuk tetap ada, tanpa
                gerbang exit yang bisa menggantung. */}
            <motion.div
              key={view}
              data-panel-view={view}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
            >
              {view === 'battle' ? (
                <CompareState
                  propertyA={propertyA}
                  propertyB={propertyB}
                  loading={loading}
                  onOpenDrawer={() => setAuditDrawer(true)}
                  onGenerateReport={() => runBattleReportAction()}
                  battleReportContent={battleReportContent}
                  battleReportLoading={battleReportLoading}
                />
              ) : view === 'skeleton' ? (
                <SkeletonState />
              ) : view === 'populated' ? (
                <PopulatedState propertyA={propertyA} onOpenDrawer={() => setAuditDrawer(true)} />
              ) : view === 'mock' ? (
                <TourMockReport />
              ) : (
                <EmptyState />
              )}
            </motion.div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

// ── Section divider ────────────────────────────────────────────
function SectionLabel({ children, icon: Icon }) {
  return (
    <div className="mt-1 mb-1 flex items-center gap-2">
      {Icon && <Icon className="h-3 w-3 text-accent/65" />}
      <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-text-secondary">
        {children}
      </span>
      <div className="h-px flex-1 bg-gradient-to-r from-accent/25 to-transparent" />
    </div>
  );
}

// ── States ──────────────────────────────────────────────────────

const DATA_SOURCES = ['InaRISK BNPB', 'PuSGeN 2024', 'SNI 1726:2019', 'USGS'];
// Versi pendek untuk strip kalibrasi di ponsel (lantai tipografi 11px).
const DATA_SOURCES_SHORT = ['InaRISK', 'PuSGeN', 'SNI 1726', 'USGS'];

// Jejak seismogram: tenang → burst → peluruhan → tenang. Digambar sekali
// saat panel muncul sehingga terbaca sebagai pembacaan alat, bukan ornamen.
const SEISMOGRAM_PATH =
  'M0 36 H38 l6-4 5 9 6-7 5 5 6-3 H78 l4-14 4 27 4-34 5 41 4-30 4 22 4-16 4 11 4-7 4 5 ' +
  'H130 l6-5 5 8 6-6 5 4 H170 l4-9 4 15 4-12 4 7 H206 l6-3 5 5 6-4 H262 l5-6 4 9 5-5 H340';

// Kontur topografi statis (dua ring tertutup + satu terbuka) sebagai lapisan
// kedalaman di belakang konten. Statis sengaja: latar bergerak di belakang
// teks panel audit mengganggu pembacaan angka.
const CONTOUR_PATHS = [
  'M-20 210 C40 150 90 190 150 150 C210 110 260 150 330 120 C390 95 430 120 480 100',
  'M-20 250 C50 190 100 230 160 190 C220 150 270 190 335 160 C395 135 435 160 490 140',
  'M-20 290 C60 235 110 270 175 235 C235 200 285 235 345 205 C400 182 440 205 500 185',
];

function EmptyState() {
  const t = useT();
  const toggleLeftPanel = useAppStore((s) => s.toggleLeftPanel);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="relative isolate flex flex-col overflow-hidden px-5 pb-7 pt-5 sm:px-6"
    >
      {/* Lapisan kedalaman: kontur topografi + grid audit + pendar hangat. */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="audit-grid absolute inset-0 opacity-[0.22]" />
        <svg
          viewBox="0 0 480 340"
          preserveAspectRatio="xMidYMax slice"
          className="absolute inset-x-0 bottom-0 h-[62%] w-full text-accent"
          fill="none"
        >
          {CONTOUR_PATHS.map((d, i) => (
            <path
              key={d}
              d={d}
              stroke="currentColor"
              strokeOpacity={0.2 - i * 0.045}
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
        <div className="absolute -top-24 left-1/2 h-64 w-[130%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(212,149,106,0.14),transparent_65%)]" />
      </div>

      {/* ── Seismogram hero ── */}
      <motion.div variants={item} className="-mx-5 mb-1 sm:-mx-6" aria-hidden="true">
        <svg viewBox="0 0 340 72" className="h-16 w-full" fill="none" preserveAspectRatio="none">
          <defs>
            <linearGradient id="seismo-fade" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
              <stop offset="18%" stopColor="currentColor" stopOpacity="0.85" />
              <stop offset="82%" stopColor="currentColor" stopOpacity="0.85" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <g className="text-accent">
            <line
              x1="0"
              y1="36"
              x2="340"
              y2="36"
              stroke="currentColor"
              strokeOpacity="0.16"
              strokeWidth="0.6"
              strokeDasharray="1 6"
            />
            <path
              d={SEISMOGRAM_PATH}
              className="seismic-trace"
              stroke="url(#seismo-fade)"
              strokeWidth="1.35"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        </svg>
      </motion.div>

      {/* ── Strip kalibrasi sumber data ──
          Lantai tipografi ponsel (index.css, max-width 639px) memaksa teks
          kecil naik ke 11px, sehingga nama sumber versi penuh tak muat di
          layar sempit. Di ponsel pakai nama pendek; sm: ke atas nama penuh. */}
      <motion.div variants={item} className="mb-4 flex items-center gap-2" aria-hidden="true">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-risk-safe shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
        <span className="panel-meta truncate font-mono text-[8px] font-medium uppercase tracking-[0.12em]">
          <span className="sm:hidden">{DATA_SOURCES_SHORT.join(' · ')}</span>
          <span className="hidden sm:inline">{DATA_SOURCES.join(' · ')}</span>
        </span>
      </motion.div>

      {/* ── Judul ── */}
      <motion.div variants={item}>
        <h2 className="max-w-[13ch] font-sans text-[30px] font-semibold leading-[0.98] tracking-[-0.045em] text-text-primary">
          {t('empty.title')}
        </h2>
        <p className="mt-3 max-w-[34ch] text-[13px] leading-[1.65] text-text-secondary">
          {t('empty.briefing')}
        </p>
      </motion.div>

      {/* ── Aksi utama + alur ── */}
      <motion.div variants={item} className="mt-5">
        <Button
          size="lg"
          variant="accent"
          onClick={toggleLeftPanel}
          className="group h-12 w-full justify-between rounded-xl px-3.5 text-[13px]"
        >
          <span className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 transition-transform group-hover:scale-105">
              <Crosshair className="h-4 w-4" />
            </span>
            {t('empty.selectOnMap')}
          </span>
          <ArrowUpRight className="h-4 w-4 text-accent/80 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Button>

        <div className="panel-meta mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-text-muted">
          <span className="text-text-secondary">{t('empty.flowSelect')}</span>
          <ChevronRight className="h-3 w-3 text-accent/50" />
          <span className="text-text-secondary">{t('empty.flowRead')}</span>
          <ChevronRight className="h-3 w-3 text-accent/50" />
          <span className="text-text-secondary">{t('empty.flowDecide')}</span>
          {/* Ponsel: durasi jadi baris sendiri agar baseline chip alur tak
              berantakan saat wrap (kritik subagent #3). */}
          <span className="ml-auto normal-case tracking-normal max-[639px]:ml-0 max-[639px]:basis-full max-[639px]:text-right">
            {t('empty.duration')}
          </span>
        </div>
      </motion.div>

      {/* ── Lokasi contoh: kanal instrumen (SiteChannelDeck) ── */}
      <motion.div variants={item} className="mt-7">
        <SampleLocationChannels />
      </motion.div>

      {/* ── Apa yang dihasilkan satu audit: pipeline vertikal ── */}
      <motion.div variants={item} className="mt-7">
        <CapabilityPipeline />
      </motion.div>
    </motion.div>
  );
}

function SkeletonState() {
  const t = useT();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-3 p-4"
      role="status"
      aria-busy="true"
    >
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-1">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>

      {/* Score card skeleton */}
      <Skeleton className="h-36 w-full rounded-2xl" />

      {/* Metrics grid skeleton */}
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-[72px] rounded-xl" />
        <Skeleton className="h-[72px] rounded-xl" />
        <Skeleton className="h-[72px] rounded-xl" />
        <Skeleton className="h-[72px] rounded-xl" />
      </div>

      {/* Analysis deck skeleton */}
      <Skeleton className="h-64 w-full rounded-2xl" />

      {/* Address skeleton */}
      <Skeleton className="h-24 w-full rounded-2xl" />

      {/* Loading indicator */}
      <div className="mt-1 flex items-center justify-center gap-2">
        <div className="relative flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-accent" />
          <div className="absolute h-6 w-6 rounded-full border border-accent/20 animate-ping" />
        </div>
        <span className="text-[11px] text-text-muted font-medium">{t('loading.fetching')}</span>
      </div>
    </motion.div>
  );
}

function PopulatedState({ propertyA, onOpenDrawer }) {
  const t = useT();
  const lang = useAppStore((s) => s.lang);
  const aiLoading = useAppStore((s) => s.aiLoading);
  const [reportLoading, setReportLoading] = useState(false);

  const handleDownloadReport = async () => {
    if (!canExportSniReport(propertyA)) {
      toast.warning(
        lang === 'en'
          ? 'Report is locked because this audit has insufficient evidence.'
          : 'Laporan dikunci karena bukti audit belum cukup.'
      );
      return;
    }
    setReportLoading(true);
    const toastId = toast.loading(lang === 'en' ? 'Preparing SNI report…' : 'Menyiapkan Laporan SNI…');
    try {
      await exportProfessionalReport(propertyA, lang);
      toast.success(lang === 'en' ? 'SNI report downloaded.' : 'Laporan SNI berhasil diunduh.', { id: toastId });
    } catch (error) {
      console.error('SNI report failed', error);
      toast.error(error.message || (lang === 'en' ? 'Report failed.' : 'Laporan gagal.'), { id: toastId });
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex min-w-0 flex-col gap-3 p-4 pb-6 max-[639px]:px-4 max-[639px]:pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
    >
      {/* Panel header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <Badge variant="accent" className="mb-1">
            <Zap className="h-2.5 w-2.5" />
            {t('panel.siteAnalysis')}
          </Badge>
          <h2 className="font-display text-sm font-semibold text-text-primary">
            {t('panel.riskDashboard')}
          </h2>
        </div>
      </motion.div>

      {/* Score */}
      <motion.div variants={item}>
        <SafeScoreCard property={propertyA} />
      </motion.div>

      {/* Metrics section */}
      <motion.div variants={item}>
        <SectionLabel>{t('panel.technicalMetrics')}</SectionLabel>
        <MetricsGrid property={propertyA} />
      </motion.div>

      {/* Analysis section — tiga grafik dalam satu instrumen berkanal */}
      <motion.div variants={item}>
        <SectionLabel>{t('panel.riskAnalysis')}</SectionLabel>
        <AnalysisDeck property={propertyA} />
      </motion.div>

      {/* Location section */}
      <motion.div variants={item}>
        <SectionLabel>{t('panel.location')}</SectionLabel>
        <AddressCard property={propertyA} />
      </motion.div>

      {/* AI Report — opens the full narrative drawer */}
      <motion.div variants={item}>
        <Button
          onClick={onOpenDrawer}
          variant="accent"
          size="lg"
          className="w-full group text-xs py-2.5 flex items-center justify-center gap-2 border border-accent/25 hover:bg-accent/20 transition-all"
        >
          {aiLoading ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-accent" />
          ) : (
            <Sparkles className="h-4 w-4 shrink-0 text-accent" />
          )}
          <span className="font-semibold">
            {aiLoading ? t('panel.reportLoading') : t('panel.viewReport')}
          </span>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60 group-hover:translate-x-0.5 transition-transform" />
        </Button>
      </motion.div>

      {/* Professional SNI report */}
      <motion.div variants={item}>
        <Button
          onClick={handleDownloadReport}
          disabled={reportLoading}
          variant="secondary"
          size="lg"
          className="w-full group text-xs py-2.5 flex items-center justify-center gap-2 border border-accent/25 hover:border-accent/50 hover:text-accent transition-all"
          title={lang === 'en' ? 'Download the professional SNI-format report PDF' : 'Unduh laporan format SNI profesional (PDF)'}
        >
          {reportLoading ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-accent" />
          ) : (
            <FileText className="h-4 w-4 shrink-0 text-accent" />
          )}
          <span className="font-semibold">{lang === 'en' ? 'SNI Report (PDF)' : 'Laporan SNI (PDF)'}</span>
        </Button>
      </motion.div>
    </motion.div>
  );
}

function CompareState({ propertyA, propertyB, loading, onOpenDrawer, onGenerateReport, battleReportContent, battleReportLoading }) {
  const t = useT();
  const hasBothSites = Boolean(propertyA && propertyB);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-3 p-4 pb-6"
    >
      {/* Di bawah `sm` panel selebar layar, sehingga judul kanan bertabrakan
          dengan tombol layer peta yang melayang di pojok kanan atas. */}
      <motion.div variants={item} className="pr-11 sm:pr-0">
        <span className="inline-flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-accent">
          <GitCompareArrows className="h-3 w-3" />
          {t('panel.battleMode')}
        </span>
        <h2 className="mt-1.5 font-sans text-[19px] font-semibold leading-[1.15] tracking-[-0.02em] text-text-primary">
          {t('panel.headToHead')}
        </h2>
        <p className="mt-1 text-[11.5px] leading-snug text-text-secondary">
          {t('panel.compareIntro')}
        </p>
      </motion.div>

      {/* Penyiapan tiga langkah — juga menampung tombol laporan di langkah 3. */}
      <motion.div variants={item}>
        <CompareSetup
          propertyA={propertyA}
          propertyB={propertyB}
          loading={loading}
          onGenerateReport={onGenerateReport}
          onOpenReport={onOpenDrawer}
          reportContent={battleReportContent}
          reportLoading={battleReportLoading}
        />
      </motion.div>

      {hasBothSites && (
        <motion.div variants={item}>
          <VerdictCard propertyA={propertyA} propertyB={propertyB} />
        </motion.div>
      )}

      {propertyA && (
        <motion.div variants={item}>
          <SectionLabel>{t('panel.riskProfile')}</SectionLabel>
          <RadarCard propertyA={propertyA} propertyB={propertyB} />
        </motion.div>
      )}
    </motion.div>
  );
}
