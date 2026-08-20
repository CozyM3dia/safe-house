import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { MapPin, Sparkles, FileText, Loader2, GitCompareArrows, ChevronRight, Zap, Share2, Download, Crosshair, Mountain, Waves, Activity, ArrowUpRight, X } from 'lucide-react';

import { useAppStore } from '../../store/useAppStore';
import { createShare } from '../../services/api';
import { canExportPdf, exportPrintReadyPdf } from '../../lib/pdfExport';
import { exportProfessionalReport } from '../../lib/professionalReport';
import { useT } from '../../hooks/useTranslation';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { SafeScoreCard } from '../cards/SafeScoreCard';
import { MetricsGrid } from '../cards/MetricsGrid';
import { RadarCard } from '../cards/RadarCard';
import { SeismicWaveform } from '../cards/SeismicWaveform';
import { GaussianCard } from '../cards/GaussianCard';
import { AddressCard } from '../cards/AddressCard';
import { VerdictCard } from '../cards/VerdictCard';
import { CompareSetup } from '../cards/CompareSetup';

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
            <AnimatePresence mode="wait">
              {!propertyA && !loading && mode === 'audit' && (
                <motion.div key="empty" initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}>
                  <EmptyState />
                </motion.div>
              )}
              {loading && mode === 'audit' && (
                <motion.div key="skeleton" initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}>
                  <SkeletonState />
                </motion.div>
              )}
              {propertyA && !loading && mode === 'audit' && (
                <motion.div key="populated" initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}>
                  <PopulatedState
                    propertyA={propertyA}
                    onOpenDrawer={() => setAuditDrawer(true)}
                  />
                </motion.div>
              )}
              {mode === 'battle' && (
                <motion.div key="battle" initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}>
                  <CompareState
                    propertyA={propertyA}
                    propertyB={propertyB}
                    loading={loading}
                    onOpenDrawer={() => setAuditDrawer(true)}
                    onGenerateReport={() => runBattleReportAction()}
                    battleReportContent={battleReportContent}
                    battleReportLoading={battleReportLoading}
                  />
                </motion.div>
              )}
            </AnimatePresence>
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

// Lokasi contoh: satu klik langsung menghasilkan audit sungguhan. Layar
// kosong sebelumnya hanya memberi instruksi lalu menunggu; pengguna baru
// harus menebak titik mana di peta yang layak dicoba.
const SAMPLE_SITES = [
  { label: 'Bandar Lampung', subId: 'Pesisir, tanah lunak', subEn: 'Coastal, soft soil', lat: -5.4292, lon: 105.261 },
  { label: 'Jakarta Pusat', subId: 'Cekungan aluvial', subEn: 'Alluvial basin', lat: -6.2088, lon: 106.8456 },
  { label: 'Bandung', subId: 'Dekat Sesar Lembang', subEn: 'Near Lembang Fault', lat: -6.9175, lon: 107.6191 },
];

const CAPABILITIES = [
  { icon: Mountain, labelKey: 'empty.capabilityVs30', descKey: 'empty.capabilityVs30Desc' },
  { icon: Waves, labelKey: 'empty.capabilityLiquefaction', descKey: 'empty.capabilityLiquefactionDesc' },
  { icon: Activity, labelKey: 'empty.capabilityFault', descKey: 'empty.capabilityFaultDesc' },
  { icon: Sparkles, labelKey: 'empty.capabilityAi', descKey: 'empty.capabilityAiDesc' },
];

function EmptyState() {
  const t = useT();
  const lang = useAppStore((s) => s.lang);
  const toggleLeftPanel = useAppStore((s) => s.toggleLeftPanel);
  const processLocation = useAppStore((s) => s.processLocation);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="relative isolate flex flex-col overflow-hidden px-5 pb-6 pt-6 sm:px-6 sm:pt-7"
    >
      <div className="audit-grid pointer-events-none absolute inset-0 -z-10 opacity-40" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-16 -top-20 -z-10 h-52 w-52 rounded-full border border-accent/10" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-8 -top-12 -z-10 h-36 w-36 rounded-full border border-accent/10" aria-hidden="true" />

      <motion.div variants={item}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.24em] text-accent">
              <span className="pulse-dot text-accent" />
              {t('empty.badge')}
            </span>
            <h2 className="mt-3 max-w-[14ch] font-sans text-[26px] font-semibold leading-[1.04] tracking-[-0.035em] text-text-primary">
              {t('empty.title')}
            </h2>
            <p className="mt-3 max-w-[32ch] text-[13px] leading-6 text-text-secondary">
              {t('empty.briefing')}
            </p>
          </div>
          <div className="hidden shrink-0 pt-1 sm:block" aria-hidden="true">
            <svg viewBox="0 0 92 56" className="h-14 w-[92px] text-accent/75" fill="none">
              <path d="M2 37h15l5-12 6 23 8-42 7 30 7-13 9 14h31" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 47h88" stroke="currentColor" strokeOpacity=".25" strokeDasharray="2 5" />
              <circle cx="43" cy="6" r="2.5" fill="currentColor" />
            </svg>
            <span className="block text-right font-mono text-[9px] tracking-[0.18em] text-text-muted">FIELD SIGNAL</span>
          </div>
        </div>
      </motion.div>

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
      </motion.div>

      <motion.div variants={item} className="mt-5 grid grid-cols-3 gap-2 border-y border-white/[0.08] py-3">
        {[
          ['01', t('empty.stepSelect'), lang === 'en' ? 'location' : 'lokasi'],
          ['02', t('empty.stepRead'), t('empty.evidence')],
          ['03', t('empty.stepDecide'), t('empty.decision')],
        ].map(([number, label, detail]) => (
          <div key={number} className="min-w-0 border-l border-accent/25 pl-2.5 first:border-l-0 first:pl-0">
            <span className="font-mono text-[9px] text-accent/80">{number}</span>
            <p className="mt-1 text-[10px] font-semibold text-text-primary">{label}</p>
            <p className="text-[10px] text-text-muted">{detail}</p>
          </div>
        ))}
      </motion.div>

      {/* Lokasi contoh */}
      <motion.div variants={item} className="mt-6">
        <h3 className="mb-2.5 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.22em] text-text-secondary">
          <span className="h-1.5 w-1.5 rounded-full bg-accent/70" />
          {t('empty.sampleLocations')}
        </h3>
        <div className="flex flex-col border-t border-white/[0.08]">
          {SAMPLE_SITES.map((site) => (
            <button
              key={site.label}
              type="button"
              onClick={() => processLocation(site.lat, site.lon)}
              className="group flex min-h-[58px] items-center gap-3 border-b border-white/[0.08] py-2.5 text-left transition-colors hover:bg-white/[0.035]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.035] transition-colors group-hover:border-accent/35 group-hover:bg-accent/10">
                <MapPin className="h-3.5 w-3.5 text-text-secondary transition-colors group-hover:text-accent" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] font-semibold text-text-primary transition-colors group-hover:text-accent">
                  {site.label}
                </span>
                <span className="mt-0.5 block text-[10px] text-text-secondary">{lang === 'en' ? site.subEn : site.subId}</span>
              </span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-text-muted transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
            </button>
          ))}
        </div>
      </motion.div>

      {/* Apa yang dihasilkan satu audit. Dulu empat kartu seragam berikon
          emoji, padahal seluruh aplikasi memakai ikon lucide. */}
      <motion.div variants={item} className="mt-6">
        <h3 className="mb-3 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.22em] text-text-secondary">
          <span className="h-1.5 w-1.5 rounded-full bg-risk-safe/80" />
          {t('empty.whatYouGet')}
        </h3>
        <ul className="flex flex-col gap-2.5">
          {CAPABILITIES.map(({ icon: Icon, labelKey, descKey }) => (
            <li key={labelKey} className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.03]">
                <Icon className="h-3.5 w-3.5 text-accent/75" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-text-primary">{t(labelKey)}</p>
                <p className="mt-0.5 text-[10px] leading-snug text-text-secondary">{t(descKey)}</p>
              </div>
            </li>
          ))}
        </ul>
      </motion.div>

      <motion.p variants={item} className="mt-6 border-t border-white/[0.08] pt-4 text-[10px] leading-relaxed text-text-muted">
        {t('empty.disclaimer')}
      </motion.p>
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

      {/* Radar skeleton */}
      <Skeleton className="h-56 w-full rounded-2xl" />

      {/* Waveform skeleton */}
      <Skeleton className="h-32 w-full rounded-2xl" />

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
  const [sharing, setSharing] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const hasAiReport = Boolean(
    propertyA?.aiReport?.detailedReport || propertyA?.narrative?.detailed_report
  );

  const handleDownloadReport = async () => {
    if (!canExportPdf(propertyA)) {
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

  const handleDownloadPdf = async () => {
    if (aiLoading || !hasAiReport) {
      toast.info(
        lang === 'en'
          ? 'The full PDF will be available after the AI audit finishes.'
          : 'PDF full tersedia setelah audit AI selesai dibuat.'
      );
      return;
    }
    if (!canExportPdf(propertyA)) {
      toast.warning(
        lang === 'en'
          ? 'PDF is locked because this audit has insufficient evidence or is not buildable.'
          : 'PDF dikunci karena bukti audit belum cukup atau lokasi tidak layak dinilai.'
      );
      return;
    }

    setPdfLoading(true);
    const toastId = toast.loading(lang === 'en' ? 'Preparing full audit PDF…' : 'Menyiapkan PDF audit full…');
    try {
      await exportPrintReadyPdf(propertyA, lang);
      toast.success(
        lang === 'en' ? 'Full AI audit PDF downloaded.' : 'PDF full audit AI berhasil diunduh.',
        { id: toastId }
      );
    } catch (error) {
      console.error('PDF export failed', error);
      toast.error(
        error.message || (lang === 'en' ? 'PDF export failed.' : 'Ekspor PDF gagal.'),
        { id: toastId }
      );
    } finally {
      setPdfLoading(false);
    }
  };

  const handleShare = async () => {
    // Tautan publik butuh audit yang tersimpan. Tanpa database, audit tidak
    // punya id — beri tahu jujur alih-alih gagal diam-diam.
    if (!propertyA.id) {
      toast.info(
        lang === 'en'
          ? 'Sharing needs the database — available once deployed.'
          : 'Berbagi butuh database — tersedia setelah aplikasi ter-deploy.'
      );
      return;
    }
    setSharing(true);
    const id = toast.loading(lang === 'en' ? 'Creating link…' : 'Membuat tautan…');
    try {
      const { url_path } = await createShare(propertyA.id);
      const url = `${window.location.origin}${url_path}`;
      await navigator.clipboard.writeText(url).catch(() => {});
      toast.success(lang === 'en' ? 'Link copied' : 'Tautan disalin', { id });
    } catch (e) {
      console.error('Share failed', e);
      toast.error(e.message || (lang === 'en' ? 'Share failed' : 'Gagal berbagi'), { id });
    } finally {
      setSharing(false);
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

      {/* Analysis section */}
      <motion.div variants={item}>
        <SectionLabel>{t('panel.riskAnalysis')}</SectionLabel>
        <RadarCard propertyA={propertyA} />
      </motion.div>

      <motion.div variants={item}>
        <SeismicWaveform property={propertyA} />
      </motion.div>

      <motion.div variants={item}>
        <GaussianCard property={propertyA} />
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
            {aiLoading
              ? (lang === 'en' ? 'Generating AI report…' : 'Menyusun laporan AI…')
              : (lang === 'en' ? 'View Full AI Report' : 'Lihat Laporan Lengkap AI')}
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

      {/* Full PDF + share actions */}
      <motion.div variants={item} className="grid grid-cols-2 gap-2 max-[359px]:grid-cols-1">
        <Button
          onClick={handleDownloadPdf}
          disabled={pdfLoading}
          variant="secondary"
          size="lg"
          className="group text-xs py-2 px-3 border border-white/12 flex items-center justify-center gap-1.5 hover:border-accent/40 hover:text-accent transition-all"
          title={lang === 'en' ? 'Download the complete AI-grounded audit PDF' : 'Unduh PDF lengkap dengan audit AI ter-grounding'}
        >
          {pdfLoading ? (
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-accent" />
          ) : (
            <Download className="h-3.5 w-3.5 shrink-0 text-accent" />
          )}
          <span>{lang === 'en' ? 'Full PDF' : 'Unduh Full PDF'}</span>
        </Button>
        <Button
          onClick={handleShare}
          disabled={sharing}
          variant="accent"
          size="lg"
          className="group text-xs py-2 px-3 border border-accent/20 flex items-center justify-center gap-1.5 hover:bg-accent/20 transition-all"
        >
          {sharing ? (
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-accent" />
          ) : (
            <Share2 className="h-3.5 w-3.5 shrink-0 text-accent" />
          )}
          <span>{lang === 'en' ? 'Share' : 'Bagikan'}</span>
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
      <motion.div variants={item} className="flex items-center justify-between gap-2 pr-11 sm:pr-0">
        <Badge variant="accent" className="mb-1">
          <GitCompareArrows className="h-2.5 w-2.5" />
          {t('panel.battleMode')}
        </Badge>
        <h2 className="truncate font-display text-sm font-semibold text-text-primary">
          {t('panel.headToHead')}
        </h2>
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
