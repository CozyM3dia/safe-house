import { motion } from 'framer-motion';
import { Search, Activity, GitCompareArrows, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useT } from '../../hooks/useTranslation';
import { Badge } from '../ui/badge';
import { LanguageSelector } from '../ui/language-selector';
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

  const status =
    loading ? { label: t('status.analyzing'), variant: 'moderate' }
    : aiLoading ? { label: t('status.aiProcessing'), variant: 'accent' }
    : propertyA ? { label: t('status.active'), variant: 'safe' }
    : { label: t('status.ready'), variant: 'safe' };

  return (
    <motion.div
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      data-testid="topbar"
      className="fixed inset-x-2 top-2 z-10 flex h-14 min-w-0 items-center justify-between gap-2 rounded-2xl border border-white/10 bg-bg/90 px-2 shadow-[0_12px_36px_rgba(15,11,8,0.22)] backdrop-blur-xl sm:inset-x-4 sm:top-3 sm:gap-4 sm:px-4"
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
          <img
            src="/safe_house_logo.png"
            alt="S.A.F.E House"
            className="h-8 w-20 object-cover object-center sm:h-9 sm:w-36"
          />
          <div className="hidden lg:flex flex-col justify-center border-l border-white/10 pl-2.5 leading-none">
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
          <span className="sm:hidden">{t('search.shortPlaceholder')}</span>
          <span className="hidden sm:inline">{t('search.placeholder')}</span>
        </span>
        <kbd className="hidden sm:inline-flex items-center gap-1 rounded-md border border-white/12 bg-white/6 px-1.5 py-0.5 font-mono text-[10px] text-text-secondary">
          {shortcutLabel}
        </kbd>
      </button>

      {/* Right: Lang + Mode toggle + Status */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <LanguageSelector />

        {/* Segmented mode control */}
        <div data-tour="topbar-mode" className="flex items-center rounded-lg border border-white/8 bg-white/[0.03] p-0.5">
          <button
            type="button"
            onClick={() => setMode('audit')}
            title={t('mode.audit')}
            aria-label={t('mode.audit')}
            className={cn(
              'flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded px-2 text-[11px] font-semibold uppercase tracking-wider transition-all sm:h-7 sm:min-h-0 sm:min-w-0 sm:px-2.5',
              mode === 'audit'
                ? 'bg-white/10 text-accent shadow-sm border border-white/12'
                : 'text-text-muted hover:text-text-secondary'
            )}
          >
            <Activity className="h-3 w-3" />
            <span className="hidden sm:inline">{t('mode.audit')}</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('battle')}
            title={t('mode.battle')}
            aria-label={t('mode.battle')}
            className={cn(
              'flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded px-2 text-[11px] font-semibold uppercase tracking-wider transition-all sm:h-7 sm:min-h-0 sm:min-w-0 sm:px-2.5',
              mode === 'battle'
                ? 'bg-white/10 text-accent shadow-sm border border-white/12'
                : 'text-text-muted hover:text-text-secondary'
            )}
          >
            <GitCompareArrows className="h-3 w-3" />
            <span className="hidden sm:inline">{t('mode.battle')}</span>
          </button>
        </div>

        <Badge data-tour="topbar-status" variant={status.variant} aria-label={status.label} className="min-h-8 px-2 sm:px-2.5" aria-live="polite">
          <span className={cn(
            'pulse-dot mr-0 sm:mr-1',
            status.variant === 'safe' ? 'text-risk-safe'
            : status.variant === 'moderate' ? 'text-risk-moderate'
            : 'text-accent'
          )} />
          <span className="hidden sm:inline">{status.label}</span>
        </Badge>
      </div>
    </motion.div>
  );
}
