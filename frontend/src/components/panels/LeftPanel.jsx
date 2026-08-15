import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { MapPin, Sparkles, FileText, Loader2, Swords, ChevronRight, Zap, Download, Share2 } from 'lucide-react';

import { useAppStore } from '../../store/useAppStore';
import { createShare } from '../../services/api';
import { adaptAuditResult } from '../../services/auditAdapter';
import { exportPrintReadyPdf } from '../../lib/pdfExport';
import { useT } from '../../hooks/useTranslation';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { SafeScoreCard } from '../cards/SafeScoreCard';
import { MetricsGrid } from '../cards/MetricsGrid';
import { RadarCard } from '../cards/RadarCard';
import { SeismicWaveform } from '../cards/SeismicWaveform';
import { GaussianCard } from '../cards/GaussianCard';
import { AddressCard } from '../cards/AddressCard';
import { BattleCard } from '../cards/BattleCard';

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
  const open = useAppStore((s) => s.leftPanelOpen);
  const propertyA = useAppStore((s) => s.propertyA);
  const propertyB = useAppStore((s) => s.propertyB);
  const loading = useAppStore((s) => s.loading);
  const mode = useAppStore((s) => s.mode);
  const setAuditDrawer = useAppStore((s) => s.setAuditDrawer);
  const setChatExpanded = useAppStore((s) => s.setChatExpanded);
  const runBattleReportAction = useAppStore((s) => s.runBattleReportAction);
  const battleReportContent = useAppStore((s) => s.battleReportContent);
  const battleReportLoading = useAppStore((s) => s.battleReportLoading);

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: -440, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -440, opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 220 }}
          data-tour="left-panel"
          className="glass fixed left-4 top-[72px] bottom-4 z-20 flex w-[380px] flex-col overflow-hidden rounded-2xl"
        >
          <div className="flex-1 overflow-y-auto scrollbar-none">
            <AnimatePresence mode="wait">
              {!propertyA && !loading && (
                <motion.div key="empty" initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}>
                  <EmptyState />
                </motion.div>
              )}
              {loading && (
                <motion.div key="skeleton" initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}>
                  <SkeletonState />
                </motion.div>
              )}
              {propertyA && !loading && mode === 'audit' && (
                <motion.div key="populated" initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}>
                  <PopulatedState
                    propertyA={propertyA}
                    onOpenDrawer={() => setAuditDrawer(true)}
                    onOpenChat={() => setChatExpanded(true)}
                  />
                </motion.div>
              )}
              {propertyA && !loading && mode === 'battle' && (
                <motion.div key="battle" initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}>
                  <BattleState
                    propertyA={propertyA}
                    propertyB={propertyB}
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
    <div className="flex items-center gap-2 mt-1 mb-0.5">
      {Icon && <Icon className="h-2.5 w-2.5 text-accent/40" />}
      <span className="text-[8px] font-bold uppercase tracking-[0.25em] text-text-muted/60">
        {children}
      </span>
      <div className="flex-1 h-px bg-gradient-to-r from-white/6 to-transparent" />
    </div>
  );
}

// ── Shimmer skeleton ────────────────────────────────────────────
function Shimmer({ className }) {
  return (
    <div className={`shimmer rounded-xl ${className}`} />
  );
}

// ── States ──────────────────────────────────────────────────────

function EmptyState() {
  const t = useT();
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex h-full flex-col items-center justify-center px-6 py-8 text-center"
    >
      <motion.div variants={item} className="relative mb-5">
        <div className="absolute inset-0 rounded-full bg-accent/15 blur-2xl" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-accent/30 bg-accent/10">
          <MapPin className="h-9 w-9 text-accent" strokeWidth={1.5} />
        </div>
      </motion.div>

      <motion.div variants={item}>
        <Badge variant="accent" className="mb-3">
          <Sparkles className="h-2.5 w-2.5" />
          {t('empty.badge')}
        </Badge>
      </motion.div>

      <motion.h2
        variants={item}
        className="mb-2 font-display text-lg font-semibold text-text-primary"
      >
        {t('empty.title')}
      </motion.h2>
      <motion.p
        variants={item}
        className="max-w-[260px] text-xs leading-relaxed text-text-muted mb-6"
      >
        {t('empty.description')}{' '}
        <kbd className="rounded bg-white/8 px-1 py-0.5 font-mono text-[10px]">
          Ctrl+K
        </kbd>{' '}
        {t('empty.descriptionEnd')}
      </motion.p>

      <motion.div variants={item} className="grid w-full grid-cols-2 gap-2">
        <FeaturePill icon="📍" label={t('empty.vs30')} />
        <FeaturePill icon="🌊" label={t('empty.flood')} />
        <FeaturePill icon="🌋" label={t('empty.fault')} />
        <FeaturePill icon="🤖" label={t('empty.ai')} />
      </motion.div>
    </motion.div>
  );
}

function FeaturePill({ icon, label }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2 text-[11px] text-text-secondary hover:border-white/14 hover:bg-white/[0.04] transition-colors">
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function SkeletonState() {
  const t = useT();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-3 p-4"
    >
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-1">
        <Shimmer className="h-3 w-24" />
        <Shimmer className="h-5 w-16 rounded-full" />
      </div>

      {/* Score card skeleton */}
      <Shimmer className="h-36 w-full" />

      {/* Metrics grid skeleton */}
      <div className="grid grid-cols-2 gap-2">
        <Shimmer className="h-[72px]" />
        <Shimmer className="h-[72px]" />
        <Shimmer className="h-[72px]" />
        <Shimmer className="h-[72px]" />
      </div>

      {/* Radar skeleton */}
      <Shimmer className="h-56 w-full" />

      {/* Waveform skeleton */}
      <Shimmer className="h-32 w-full" />

      {/* Address skeleton */}
      <Shimmer className="h-24 w-full" />

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

function PopulatedState({ propertyA, onOpenDrawer, onOpenChat }) {
  const t = useT();
  const lang = useAppStore((s) => s.lang);
  const aiLoading = useAppStore((s) => s.aiLoading);
  const [exporting, setExporting] = useState(false);

  const [sharing, setSharing] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    const id = toast.loading(lang === 'en' ? 'Building PDF…' : 'Menyusun PDF…');
    try {
      // pdfExport masih memakai bentuk lama; adapter dipakai hanya di sini
      // sampai generator PDF ditulis ulang untuk membaca AuditResult.
      await exportPrintReadyPdf(adaptAuditResult(propertyA), lang);
      toast.success(lang === 'en' ? 'PDF downloaded' : 'PDF terunduh', { id });
    } catch (e) {
      console.error('PDF export failed', e);
      toast.error(lang === 'en' ? 'PDF export failed' : 'Gagal membuat PDF', { id });
    } finally {
      setExporting(false);
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
      className="flex flex-col gap-3 p-4 pb-6"
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
        <SectionLabel>Technical Metrics</SectionLabel>
        <MetricsGrid property={propertyA} />
      </motion.div>

      {/* Analysis section */}
      <motion.div variants={item}>
        <SectionLabel>Risk Analysis</SectionLabel>
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
        <SectionLabel>Location</SectionLabel>
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

      {/* Action Buttons */}
      <motion.div variants={item} className="grid grid-cols-5 gap-2">
        <Button
          onClick={handleExport}
          variant="default"
          size="lg"
          className="col-span-3 group text-xs py-2 px-3 flex items-center justify-center gap-1.5"
          disabled={exporting}
        >
          {exporting ? (
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5 shrink-0" />
          )}
          <span className="truncate">
            {exporting
              ? (lang === 'en' ? 'Building…' : 'Menyusun…')
              : (lang === 'en' ? 'Download PDF' : 'Unduh PDF')}
          </span>
        </Button>
        <Button
          onClick={handleShare}
          disabled={sharing}
          variant="accent"
          size="lg"
          className="col-span-2 group text-xs py-2 px-3 border border-accent/20 flex items-center justify-center gap-1.5 hover:bg-accent/20 transition-all"
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

function BattleState({ propertyA, propertyB, onOpenDrawer, onGenerateReport, battleReportContent, battleReportLoading }) {
  const t = useT();
  const hasBothSites = propertyA && propertyB;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-3 p-4 pb-6"
    >
      <motion.div variants={item} className="flex items-center justify-between">
        <Badge variant="danger" className="mb-1">
          <Swords className="h-2.5 w-2.5" />
          {t('panel.battleMode')}
        </Badge>
        <h2 className="font-display text-sm font-semibold text-text-primary">
          {t('panel.headToHead')}
        </h2>
      </motion.div>

      <motion.div variants={item}>
        <BattleCard propertyA={propertyA} propertyB={propertyB} />
      </motion.div>

      <motion.div variants={item}>
        <SectionLabel>Comparison</SectionLabel>
        <RadarCard propertyA={propertyA} propertyB={propertyB} />
      </motion.div>

      {hasBothSites && (
        <motion.div variants={item} className="flex flex-col gap-2">
          {!battleReportContent && (
            <Button
              onClick={onGenerateReport}
              variant="default"
              size="lg"
              className="w-full"
              disabled={battleReportLoading}
            >
              {battleReportLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('panel.battleReportLoading')}
                </>
              ) : (
                <>
                  <Swords className="h-4 w-4" />
                  {t('panel.generateBattleReport')}
                </>
              )}
            </Button>
          )}
          {battleReportContent && (
            <Button
              onClick={onOpenDrawer}
              variant="default"
              size="lg"
              className="w-full group"
            >
              <FileText className="h-4 w-4" />
              {t('panel.viewBattleReport')}
              <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </Button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
