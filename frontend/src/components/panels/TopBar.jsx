import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Activity, GitCompareArrows, PanelLeftClose, PanelLeftOpen, MoreHorizontal, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useT } from '../../hooks/useTranslation';
import { Badge } from '../ui/badge';
import { LanguageSelector } from '../ui/language-selector';
import { ThemeToggle } from '../ui/theme-toggle';
import { BrandLogo } from '../ui/BrandLogo';
import { cn, getModifierShortcut } from '../../lib/utils';

export function TopBar() {
  const t = useT();
  const setCmdPalette = useAppStore((s) => s.setCmdPalette);
  const lang = useAppStore((s) => s.lang);
  const mode = useAppStore((s) => s.mode);
  const setMode = useAppStore((s) => s.setMode);
  const propertyA = useAppStore((s) => s.propertyA);
  const aiLoading = useAppStore((s) => s.aiLoading);
  const loading = useAppStore((s) => s.loading);
  const leftPanelOpen = useAppStore((s) => s.leftPanelOpen);
  const toggleLeftPanel = useAppStore((s) => s.toggleLeftPanel);
  const shortcutLabel = getModifierShortcut();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    const handleEscape = (event) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [mobileMenuOpen]);

  // Tanpa lokasi terpilih tidak ada status yang layak dilaporkan; badge
  // "Siap" hanya mengisi ruang tanpa memberi informasi baru.
  const status =
    loading ? { label: t('status.analyzing'), variant: 'moderate' }
    : aiLoading ? { label: t('status.aiProcessing'), variant: 'accent' }
    : propertyA ? { label: t('status.active'), variant: 'safe' }
    : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      data-testid="topbar"
      className="safe-inset-x fixed top-2 z-10 flex h-14 min-w-0 items-center justify-between gap-1 rounded-2xl border border-white/10 bg-bg/90 px-1.5 shadow-[0_12px_36px_rgba(15,11,8,0.22)] backdrop-blur-xl sm:inset-x-4 sm:top-3 sm:gap-4 sm:px-4"
    >
      {/* Left: Logo + descriptor + panel toggle */}
      <div className="flex min-w-0 shrink-0 items-center gap-1 sm:gap-3">
        <button
          type="button"
          onClick={toggleLeftPanel}
          title={t('accessibility.togglePanel')}
          aria-label={t('accessibility.togglePanel')}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-white/8 hover:text-accent sm:h-8 sm:min-h-0 sm:w-8 sm:min-w-0"
        >
          {leftPanelOpen
            ? <PanelLeftClose className="h-4 w-4" />
            : <PanelLeftOpen className="h-4 w-4" />}
        </button>

        <div className="flex min-w-0 items-center gap-2.5">
          {/* Di 320px, wordmark render selebar 94px sementara klaster kiri dan
              kanan sama-sama `shrink-0`: totalnya 342px di dalam 302px, dan
              tombol "Buka opsi tampilan" terdorong 39px keluar layar — tak
              bisa disentuh sama sekali. Lambang perisai mengembalikan ~62px,
              cukup untuk memuat semua kontrol sekaligus memberi kolom cari
              ruang untuk menampilkan labelnya. */}
          <BrandLogo
            variant="icon"
            alt="S.A.F.E House"
            className="h-7 w-7 shrink-0 object-contain sm:hidden"
          />
          <BrandLogo
            variant="full"
            alt="S.A.F.E House"
            className="hidden h-7 w-auto max-w-[120px] object-contain sm:block sm:h-8 sm:max-w-none"
          />
          <div className="hidden xl:flex flex-col justify-center border-l border-white/10 pl-2.5 leading-none">
            <span className="text-[11px] font-medium tracking-tight text-text-secondary">
              {lang === 'en' ? 'AI Geotechnical & Risk Platform' : 'Platform Audit Geoteknik & Risiko Bencana'}
            </span>
            <span className="mt-1 text-[10px] font-mono uppercase tracking-widest text-text-muted">
              SNI 1726 · PuSGeN 2024 · InaRISK
            </span>
          </div>
        </div>
      </div>

      {/* Center: Search trigger */}
      <button
        type="button"
        data-tour="topbar-search"
        onClick={() => setCmdPalette(true)}
        aria-label={t('accessibility.search')}
        aria-keyshortcuts={shortcutLabel.startsWith('⌘') ? 'Meta+K' : 'Control+K'}
        className="group flex min-h-[44px] min-w-[44px] max-w-[28rem] flex-1 items-center gap-2 rounded-xl border border-white/10 bg-bg-surface/75 px-2.5 py-2 text-left transition-all hover:border-accent/35 hover:bg-white/[0.06] sm:min-h-0 sm:min-w-0 sm:gap-2.5 sm:px-3.5"
      >
        <Search className="h-3.5 w-3.5 text-accent/75" />
        <span className="flex-1 truncate text-xs text-text-secondary">
          {/* Di 320px kolom cari menyusut sampai label "Cari" terpotong jadi
              "C…", yang tak memberi tahu apa pun. Di bawah 360px ikon kaca
              pembesar berdiri sendiri — sudah cukup dikenal. */}
          <span className="hidden min-[360px]:inline sm:hidden">{t('search.shortPlaceholder')}</span>
          <span className="hidden sm:inline">{t('search.placeholder')}</span>
        </span>
        <kbd className="hidden sm:inline-flex items-center gap-1 rounded-md border border-white/12 bg-white/6 px-1.5 py-0.5 font-mono text-[10px] text-text-secondary">
          {shortcutLabel}
        </kbd>
      </button>

      {/* Right: Lang + Mode toggle + Status */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <div className="max-xl:hidden">
          <LanguageSelector />
        </div>
        <ThemeToggle className="shrink-0 max-xl:hidden" />

        {/* Segmented mode control */}
        <div data-tour="topbar-mode" className="flex items-center rounded-lg border border-white/8 bg-white/[0.03] p-0.5">
          <button
            type="button"
            onClick={() => setMode('audit')}
            title={t('mode.audit')}
            aria-label={t('mode.audit')}
            className={cn(
              'flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded px-2 text-[11px] font-semibold uppercase tracking-wider transition-all xl:h-7 xl:min-h-0 xl:min-w-0 xl:px-2.5',
              mode === 'audit'
                ? 'bg-white/10 text-accent shadow-sm border border-white/12'
                : 'text-text-muted hover:text-text-secondary'
            )}
          >
            <Activity className="h-3 w-3" />
            <span className="hidden min-[1100px]:inline">{t('mode.audit')}</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('battle')}
            title={t('mode.battle')}
            aria-label={t('mode.battle')}
            className={cn(
              'flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded px-2 text-[11px] font-semibold uppercase tracking-wider transition-all xl:h-7 xl:min-h-0 xl:min-w-0 xl:px-2.5',
              mode === 'battle'
                ? 'bg-white/10 text-accent shadow-sm border border-white/12'
                : 'text-text-muted hover:text-text-secondary'
            )}
          >
            <GitCompareArrows className="h-3 w-3" />
            <span className="hidden min-[1100px]:inline">{t('mode.battle')}</span>
          </button>
        </div>

        {status && (
          <Badge data-tour="topbar-status" variant={status.variant} aria-label={status.label} className="hidden min-h-8 px-2 xl:flex xl:px-2.5" aria-live="polite">
            <span className={cn(
              'pulse-dot mr-0 sm:mr-1',
              status.variant === 'safe' ? 'text-risk-safe'
              : status.variant === 'moderate' ? 'text-risk-moderate'
              : 'text-accent'
            )} />
            <span className="hidden sm:inline">{status.label}</span>
          </Badge>
        )}

        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-label={lang === 'en' ? 'Open display options' : 'Buka opsi tampilan'}
          aria-expanded={mobileMenuOpen}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-white/8 hover:text-text-primary xl:hidden"
        >
          {mobileMenuOpen ? <X className="h-4 w-4" /> : <MoreHorizontal className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            className="absolute right-1 top-[calc(100%+0.5rem)] z-20 flex w-[min(17rem,calc(100vw-1.5rem))] flex-col gap-3 rounded-2xl border border-white/10 bg-bg-elevated/95 p-3 shadow-glass-lg backdrop-blur-xl xl:hidden"
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/8 pb-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted">
                {lang === 'en' ? 'Display' : 'Tampilan'}
              </span>
              {status && (
                <Badge variant={status.variant} aria-label={status.label} className="min-h-7 px-2" aria-live="polite">
                  <span className={cn('pulse-dot mr-1', status.variant === 'safe' ? 'text-risk-safe' : status.variant === 'moderate' ? 'text-risk-moderate' : 'text-accent')} />
                  {status.label}
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between gap-3">
              <LanguageSelector />
              <ThemeToggle className="shrink-0" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
