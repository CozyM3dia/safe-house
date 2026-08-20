import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, ChevronRight, GitBranch } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useT } from '../../hooks/useTranslation';
import { cn } from '../../lib/utils';
import { MapLegend } from './MapLegend';
import { INARISK_HAZARDS } from '../../lib/hazardOverlay';

export function DisasterLayersPanel() {
  const t = useT();
  const [collapsed, setCollapsed] = useState(true);
  const [leftPanelWasAutoClosed, setLeftPanelWasAutoClosed] = useState(false);
  const {
    baseMapStyle,
    setBaseMapStyle,
    overlays,
    overlayStatuses,
    overlaySources,
    faultLayerSource,
    toggleOverlay,
    chatExpanded,
    setChatExpanded,
    leftPanelOpen,
    toggleLeftPanel,
  } = useAppStore();

  return (
    <div className="pointer-events-auto fixed right-2 top-20 z-[25] flex items-start gap-2 sm:right-4">
      {/* Retractable Container */}
      <AnimatePresence initial={false}>
        {!collapsed && !chatExpanded && (
          <motion.div
            initial={{ opacity: 0, x: 24, scale: 0.97, filter: 'blur(4px)' }}
            animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: 24, scale: 0.97, filter: 'blur(4px)' }}
            transition={{ type: 'spring', damping: 30, stiffness: 200, mass: 1 }}
            className="flex w-[min(18rem,calc(100vw-1rem))] flex-col rounded-2xl border border-white/8 bg-bg-surface/90 p-4 shadow-glass-lg backdrop-blur-xl"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/8 mb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-accent" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                    {t('panel.mapView')}
                  </h3>
                  <p className="mt-0.5 text-[10px] text-text-muted">{t('panel.mapLayerControls')}</p>
                </div>
              </div>
              {(() => {
                const activeCount =
                  (overlays.faults ? 1 : 0) +
                  INARISK_HAZARDS.filter((h) => overlays[h.key]).length;
                return activeCount > 0 ? (
                  <span className="rounded-md border border-accent/30 bg-accent/10 px-1.5 py-1 text-[9px] font-bold uppercase tracking-wider text-accent">
                    {activeCount} {t('status.active')}
                  </span>
                ) : null;
              })()}
            </div>

            {/* Base Map Style Picker */}
            <div className="flex rounded-lg bg-white/[0.03] p-0.5 border border-white/6">
              {[
                { id: 'street', label: t('panel.street') },
                { id: 'satellite', label: t('panel.satellite') },
              ].map((style) => {
                const isActive = baseMapStyle === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    aria-pressed={isActive}
                    aria-label={`${t('panel.useBasemap')}: ${style.label}`}
                    title={`${t('panel.useBasemap')}: ${style.label}`}
                    onClick={() => setBaseMapStyle(style.id)}
                    className={cn(
                      "flex min-h-[44px] flex-1 items-center justify-center rounded-md py-1.5 text-center text-[10px] font-bold transition-all",
                      isActive
                        ? "bg-accent/15 text-accent shadow-sm border border-accent/20"
                        : "text-text-muted hover:text-text-primary border border-transparent"
                    )}
                  >
                    {style.label}
                  </button>
                );
              })}
            </div>

            {/* Nationwide hazard rasters */}
            <div className="mt-4 border-t border-white/8 pt-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted">
                  {t('panel.hazardLayers')}
                </span>
                <span className="text-[10px] font-mono text-text-muted">{t('panel.hazardSource')}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {INARISK_HAZARDS.map((h) => {
                  const active = overlays[h.key];
                  const status = overlayStatuses[h.key] || 'idle';
                  const source = overlaySources[h.key] || 'official';
                  const isFallback = source === 'fallback';
                  const statusLabel = status === 'loading'
                    ? t('panel.layerLoading')
                    : status === 'error'
                      ? t('panel.layerUnavailable')
                      : isFallback && active
                        ? t('panel.layerFallback')
                        : active
                          ? t('panel.layerOn')
                          : t('panel.layerOff');
                  const label = t(h.labelKey);
                  const description = isFallback && h.fallbackDescriptionKey
                    ? t(h.fallbackDescriptionKey)
                    : t(h.descriptionKey);
                  return (
                    <button
                      key={h.key}
                      type="button"
                      data-testid={`overlay-toggle-${h.key}`}
                      aria-pressed={active}
                      aria-busy={active && status === 'loading'}
                      aria-label={`${t('panel.toggleLayer')}: ${label}`}
                      title={`${t('panel.toggleLayer')}: ${label}`}
                      onClick={() => toggleOverlay(h.key)}
                      className={cn(
                        'flex min-h-[44px] w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors',
                        active
                          ? 'border-accent/45 bg-accent/10'
                          : 'border-white/6 bg-white/[0.02] hover:border-white/14 hover:bg-white/[0.04]'
                      )}
                    >
                      <span className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-lg border text-sm',
                        active
                          ? 'border-accent/35 bg-accent/12'
                          : 'border-white/8 bg-white/[0.03]'
                      )}>
                        {h.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[10px] font-bold text-text-primary">{label}</span>
                        <span className="mt-0.5 block text-[10px] leading-relaxed text-text-muted">
                          {description}
                        </span>
                      </span>
                      <span
                        data-testid={`overlay-status-${h.key}`}
                        className={cn(
                          'rounded-md border px-1.5 py-0.5 text-[9px] font-bold tracking-wider',
                          status === 'error'
                            ? 'border-risk-danger/35 text-risk-danger'
                            : isFallback && active
                              ? 'border-risk-moderate/35 text-risk-moderate'
                              : active ? 'border-accent/35 text-accent' : 'border-white/8 text-text-muted'
                        )}
                      >
                        {statusLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reference geohazard layers */}
            <div className="mt-4 border-t border-white/8 pt-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted">
                  {t('panel.referenceLayers')}
                </span>
                <span className="text-[10px] font-mono text-text-muted">{t('panel.referenceSource')}</span>
              </div>
              <button
                type="button"
                data-testid="overlay-toggle-faults"
                aria-pressed={overlays.faults}
                aria-label={`${t('panel.toggleLayer')}: ${t('panel.faults')}`}
                title={`${t('panel.toggleLayer')}: ${t('panel.faults')}`}
                onClick={() => toggleOverlay('faults')}
                className={cn(
                  'flex min-h-[44px] w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors',
                  overlays.faults
                    ? 'border-[#b86f63]/45 bg-[#b86f63]/10'
                    : 'border-white/6 bg-white/[0.02] hover:border-white/14 hover:bg-white/[0.04]'
                )}
              >
                <span
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-lg border',
                    overlays.faults
                      ? 'border-[#b86f63]/35 bg-[#b86f63]/12 text-[#d28a7b]'
                      : 'border-white/8 bg-white/[0.03] text-text-muted'
                  )}
                >
                  <GitBranch className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-bold text-text-primary">{t('panel.faults')}</span>
                  <span className="mt-0.5 block text-[10px] leading-relaxed text-text-muted">
                    {!overlays.faults
                      ? t('panel.faultsDescription')
                      : faultLayerSource === 'loading'
                      ? t('panel.faultsLoadingDescription')
                      : faultLayerSource === 'official'
                        ? t('panel.faultsDescription')
                        : t('panel.faultsFallbackDescription')}
                  </span>
                </span>
                <span
                  data-testid="overlay-status-faults"
                  className={cn(
                    'rounded-md border px-1.5 py-0.5 text-[9px] font-bold tracking-wider',
                    overlays.faults
                      ? 'border-[#b86f63]/35 text-[#d28a7b]'
                      : 'border-white/8 text-text-muted'
                  )}
                >
                  {overlays.faults
                    ? faultLayerSource === 'loading'
                      ? t('panel.layerLoading')
                      : t('panel.layerOn')
                    : t('panel.layerOff')}
                </span>
              </button>
            </div>

            <MapLegend />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            const nextCollapsed = !collapsed;
            setCollapsed(nextCollapsed);
            if (!nextCollapsed) {
              setChatExpanded(false);
              if (typeof window !== 'undefined' && window.innerWidth < 900 && leftPanelOpen) {
                toggleLeftPanel();
                setLeftPanelWasAutoClosed(true);
              }
            } else if (leftPanelWasAutoClosed && !leftPanelOpen) {
              toggleLeftPanel();
              setLeftPanelWasAutoClosed(false);
            }
          }}
          className={cn(
            "flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl border bg-bg-surface/90 backdrop-blur-xl shadow-glass-lg transition-all",
            collapsed
              ? "border-white/8 text-text-secondary hover:text-accent hover:border-accent/40"
              : "border-accent/40 text-accent"
          )}
          data-tour="map-layers-trigger"
          title={collapsed ? t('panel.mapView') : t('panel.closeMapPanel')}
          aria-label={collapsed ? t('panel.mapView') : t('panel.closeMapPanel')}
        >
          {collapsed ? <Layers className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
