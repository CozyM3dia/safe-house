import { motion } from 'framer-motion';
import { Search, Activity, Swords, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useT } from '../../hooks/useTranslation';
import { Badge } from '../ui/badge';
import { LanguageSelector } from '../ui/language-selector';
import { cn } from '../../lib/utils';

export function TopBar() {
  const t = useT();
  const setCmdPalette = useAppStore((s) => s.setCmdPalette);
  const mode = useAppStore((s) => s.mode);
  const setMode = useAppStore((s) => s.setMode);
  const propertyA = useAppStore((s) => s.propertyA);
  const aiLoading = useAppStore((s) => s.aiLoading);
  const loading = useAppStore((s) => s.loading);
  const leftPanelOpen = useAppStore((s) => s.leftPanelOpen);
  const toggleLeftPanel = useAppStore((s) => s.toggleLeftPanel);

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
      className="fixed left-0 right-0 top-0 z-10 flex h-14 items-center justify-between gap-4 border-b border-white/8 bg-bg/80 px-4 backdrop-blur-xl"
    >
      {/* Left: Logo + panel toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleLeftPanel}
          title="Toggle panel (L)"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-white/8 hover:text-accent transition-colors"
        >
          {leftPanelOpen
            ? <PanelLeftClose className="h-4 w-4" />
            : <PanelLeftOpen className="h-4 w-4" />}
        </button>

        <div className="flex items-center">
          <img
            src="/safe_house_logo.png"
            alt="S.A.F.E House"
            className="h-24 w-auto object-contain -my-6"
          />
        </div>
      </div>

      {/* Center: Search trigger */}
      <button
        data-tour="topbar-search"
        onClick={() => setCmdPalette(true)}
        className="group flex max-w-md flex-1 items-center gap-2.5 rounded-lg border border-white/8 bg-white/[0.03] px-3.5 py-2 text-left transition-all hover:border-white/16 hover:bg-white/[0.06]"
      >
        <Search className="h-3.5 w-3.5 text-text-muted" />
        <span className="flex-1 truncate text-xs text-text-muted">
          {t('search.placeholder')}
        </span>
        <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-white/12 bg-white/6 px-1.5 py-0.5 font-mono text-[10px] text-text-muted">
          ⌘K
        </kbd>
      </button>

      {/* Right: Lang + Mode toggle + Status */}
      <div className="flex items-center gap-2">
        <LanguageSelector />

        {/* Segmented mode control */}
        <div data-tour="topbar-mode" className="flex items-center rounded-lg border border-white/8 bg-white/[0.03] p-0.5">
          <button
            onClick={() => setMode('audit')}
            className={cn(
              'flex h-7 items-center gap-1.5 rounded px-2.5 text-[11px] font-semibold uppercase tracking-wider transition-all',
              mode === 'audit'
                ? 'bg-white/10 text-accent shadow-sm border border-white/12'
                : 'text-text-muted hover:text-text-secondary'
            )}
          >
            <Activity className="h-3 w-3" />
            {t('mode.audit')}
          </button>
          <button
            onClick={() => setMode('battle')}
            className={cn(
              'flex h-7 items-center gap-1.5 rounded px-2.5 text-[11px] font-semibold uppercase tracking-wider transition-all',
              mode === 'battle'
                ? 'bg-white/10 text-accent shadow-sm border border-white/12'
                : 'text-text-muted hover:text-text-secondary'
            )}
          >
            <Swords className="h-3 w-3" />
            {t('mode.battle')}
          </button>
        </div>

        <Badge data-tour="topbar-status" variant={status.variant}>
          <span className={cn(
            'pulse-dot mr-1',
            status.variant === 'safe' ? 'text-risk-safe'
            : status.variant === 'moderate' ? 'text-risk-moderate'
            : 'text-accent'
          )} />
          {status.label}
        </Badge>
      </div>
    </motion.div>
  );
}
