import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, ChevronRight, GitBranch, Info } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../lib/utils';
import { INARISK_HAZARDS } from '../../lib/hazardOverlay';

export function DisasterLayersPanel() {
  const [collapsed, setCollapsed] = useState(true);
  const [leftPanelWasAutoClosed, setLeftPanelWasAutoClosed] = useState(false);
  const {
    baseMapStyle,
    setBaseMapStyle,
    overlays,
    toggleOverlay,
    chatExpanded,
    setChatExpanded,
    leftPanelOpen,
    toggleLeftPanel,
  } = useAppStore();

  return (
    <div className="fixed right-4 top-20 z-[25] flex items-start gap-2 pointer-events-auto">
      {/* Retractable Container */}
      <AnimatePresence initial={false}>
        {!collapsed && !chatExpanded && (
          <motion.div
            initial={{ opacity: 0, x: 24, scale: 0.97, filter: 'blur(4px)' }}
            animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: 24, scale: 0.97, filter: 'blur(4px)' }}
            transition={{ type: 'spring', damping: 30, stiffness: 200, mass: 1 }}
            className="w-72 rounded-2xl border border-white/8 bg-bg-surface/90 backdrop-blur-xl p-4 shadow-glass-lg flex flex-col"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/8 mb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-accent" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                    Tampilan Peta
                  </h3>
                  <p className="mt-0.5 text-[8px] text-text-muted">Kontrol layer referensi</p>
                </div>
              </div>
              {(() => {
                const activeCount =
                  (overlays.faults ? 1 : 0) +
                  INARISK_HAZARDS.filter((h) => overlays[h.key]).length;
                return activeCount > 0 ? (
                  <span className="rounded-md border border-accent/30 bg-accent/10 px-1.5 py-1 text-[8px] font-bold uppercase tracking-wider text-accent">
                    {activeCount} aktif
                  </span>
                ) : null;
              })()}
            </div>

            {/* Base Map Style Picker */}
            <div className="flex rounded-lg bg-white/[0.03] p-0.5 border border-white/6">
              {[
                { id: 'street', label: 'Biasa' },
                { id: 'satellite', label: 'Satelit' },
              ].map((style) => {
                const isActive = baseMapStyle === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setBaseMapStyle(style.id)}
                    className={cn(
                      "flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all text-center",
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
                <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-text-muted">
                  Layer bahaya
                </span>
                <span className="text-[8px] font-mono text-text-muted">InaRISK BNPB</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {INARISK_HAZARDS.map((h) => {
                  const active = overlays[h.key];
                  return (
                    <button
                      key={h.key}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleOverlay(h.key)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors',
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
                        <span className="block text-[10px] font-bold text-text-primary">{h.label}</span>
                        <span className="mt-0.5 block text-[8px] leading-relaxed text-text-muted">
                          Peta bahaya {h.label.toLowerCase()} nasional
                        </span>
                      </span>
                      <span className={cn(
                        'rounded-md border px-1.5 py-0.5 text-[8px] font-bold tracking-wider',
                        active ? 'border-accent/35 text-accent' : 'border-white/8 text-text-muted'
                      )}>
                        {active ? 'ON' : 'OFF'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reference geohazard layers */}
            <div className="mt-4 border-t border-white/8 pt-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-text-muted">
                  Layer referensi
                </span>
                <span className="text-[8px] font-mono text-text-muted">PUSGEN 2024</span>
              </div>
              <button
                type="button"
                aria-pressed={overlays.faults}
                onClick={() => toggleOverlay('faults')}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors',
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
                    <span className="block text-[10px] font-bold text-text-primary">Sesar aktif</span>
                    <span className="mt-0.5 block text-[8px] leading-relaxed text-text-muted">
                    Geometri resmi PuSGeN 2024
                  </span>
                </span>
                <span className={cn(
                  'rounded-md border px-1.5 py-0.5 text-[8px] font-bold tracking-wider',
                  overlays.faults
                    ? 'border-[#b86f63]/35 text-[#d28a7b]'
                    : 'border-white/8 text-text-muted'
                )}>
                  {overlays.faults ? 'ON' : 'OFF'}
                </span>
              </button>

              {overlays.faults && (
                <div
                  data-testid="fault-layer-legend"
                  className="mt-3 rounded-xl border border-[#b86f63]/25 bg-[#b86f63]/[0.06] p-3"
                >
                  <div className="flex items-start gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-[#b86f63]/25 bg-[#b86f63]/10 text-[#d28a7b]">
                      <Info className="h-3 w-3" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#d28a7b]">
                        Legenda aktif
                      </p>
                      <p className="mt-1 text-[9px] leading-relaxed text-text-secondary">
                        Garis solid menunjukkan geometri sesar resmi.
                      </p>
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-white/6 bg-black/10 px-2.5 py-2">
                    <span className="mt-1.5 w-8 shrink-0 border-t-2 border-[#b86f63]" aria-hidden="true" />
                    <span className="text-[8px] leading-relaxed text-text-muted">
                      Sumber: PuSGeN 2024 melalui InaRISK BNPB
                    </span>
                  </div>
                </div>
              )}
            </div>
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
            "flex h-10 w-10 items-center justify-center rounded-2xl border bg-bg-surface/90 backdrop-blur-xl shadow-glass-lg transition-all",
            collapsed
              ? "border-white/8 text-text-secondary hover:text-accent hover:border-accent/40"
              : "border-accent/40 text-accent"
          )}
          title={collapsed ? 'Tampilan Peta' : 'Tutup Panel'}
        >
          {collapsed ? <Layers className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
