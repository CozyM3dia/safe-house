import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../lib/utils';

export function DisasterLayersPanel() {
  const [collapsed, setCollapsed] = useState(true);
  const {
    baseMapStyle,
    setBaseMapStyle,
    chatExpanded,
    setChatExpanded,
  } = useAppStore();

  // Auto-collapse when chatbot is opened
  useEffect(() => {
    if (chatExpanded) setCollapsed(true);
  }, [chatExpanded]);

  return (
    <div className="fixed right-4 top-20 z-[25] flex items-start gap-2 pointer-events-auto">
      {/* Retractable Container */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: 24, scale: 0.97, filter: 'blur(4px)' }}
            animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: 24, scale: 0.97, filter: 'blur(4px)' }}
            transition={{ type: 'spring', damping: 30, stiffness: 200, mass: 1 }}
            className="w-72 rounded-2xl border border-white/8 bg-bg-surface/90 backdrop-blur-xl p-4 shadow-glass-lg flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center gap-2 pb-2.5 border-b border-white/8 mb-2.5">
              <Layers className="h-4 w-4 text-accent" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                Tampilan Peta
              </h3>
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
