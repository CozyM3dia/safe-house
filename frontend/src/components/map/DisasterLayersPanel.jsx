import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Eye, EyeOff, Info, Droplets, Flame, Activity, Waves, CloudRain, Shield, TrendingUp, Map, Globe, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../lib/utils';

const OVERLAY_ITEMS = [
  {
    key: 'flood',
    label: 'Bahaya Banjir',
    desc: 'WMS Bahaya Banjir BNPB InaRISK',
    color: '#06b6d4', // Cyan
    icon: Droplets,
    source: 'BNPB InaRISK WMS'
  },
  {
    key: 'landslide',
    label: 'Tanah Longsor',
    desc: 'Bahaya Gerakan Tanah & Longsor',
    color: '#f97316', // Orange
    icon: Activity,
    source: 'BNPB InaRISK WMS'
  },
  {
    key: 'fire',
    label: 'Kebakaran Hutan (Karhutla)',
    desc: 'Kawasan Rawan Karhutla Nasional',
    color: '#ef4444', // Red
    icon: Flame,
    source: 'BNPB InaRISK WMS'
  },
  {
    key: 'earthquake',
    label: 'Gempa Bumi / Sesar',
    desc: 'Zona Kerentanan Seismik PGA',
    color: '#a855f7', // Purple
    icon: Shield,
    source: 'BNPB InaRISK WMS'
  },
  {
    key: 'tsunami',
    label: 'Tsunami & Megathrust',
    desc: 'Lempeng Aktif & Rawan Tsunami',
    color: '#3b82f6', // Blue
    icon: Waves,
    source: 'BNPB InaRISK WMS'
  },
  {
    key: 'volcano',
    label: 'Kawasan Rawan Letusan',
    desc: 'Bahaya Erupsi & Lahar Gunung Api',
    color: '#f43f5e', // Rose
    icon: Activity,
    source: 'BNPB InaRISK WMS'
  },
  {
    key: 'weather',
    label: 'Cuaca Ekstrem',
    desc: 'Curah Hujan Tinggi BMKG/InaRISK',
    color: '#10b981', // Emerald
    icon: CloudRain,
    source: 'BMKG WMS'
  },
  {
    key: 'rtrw',
    label: 'Tata Ruang (RTRW)',
    desc: 'Rencana Tata Ruang Wilayah ATR/BPN',
    color: '#c4a87e', // Muted gold
    icon: Map,
    source: 'ATR/BPN (Client Cache)'
  },
  {
    key: 'znt',
    label: 'Zona Nilai Tanah (ZNT)',
    desc: 'Nilai Pasar & Agunan Properti',
    color: '#f59e0b', // Amber
    icon: TrendingUp,
    source: 'ATR/BPN (Client Cache)'
  },
  {
    key: 'landcover',
    label: 'Tutupan Lahan',
    desc: 'Tutupan Vegetasi & Bangunan BIG',
    color: '#22c55e', // Green
    icon: Globe,
    source: 'BIG (Client Cache)'
  },
  {
    key: 'population',
    label: 'Kepadatan Penduduk',
    desc: 'Populasi per km² & Kerentanan',
    color: '#dc2626', // Deep Red
    icon: Users,
    source: 'BPS (Client Cache)'
  }
];

export function DisasterLayersPanel() {
  const [collapsed, setCollapsed] = useState(true);
  const {
    overlays,
    overlayOpacities,
    toggleOverlay,
    setOverlayOpacity,
    baseMapStyle,
    setBaseMapStyle,
    chatExpanded,
    setChatExpanded,
  } = useAppStore();

  const activeCount = Object.values(overlays).filter(Boolean).length;

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
            className="w-80 rounded-2xl border border-white/8 bg-bg-surface/90 backdrop-blur-xl p-4 shadow-glass-lg max-h-[70vh] overflow-y-auto scrollbar-none flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-white/8 mb-2.5">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-accent" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                  Overlay Risiko Spasial
                </h3>
              </div>
              {activeCount > 0 && (
                <span className="rounded-full bg-accent/15 border border-accent/30 px-1.5 py-0.5 text-[9px] font-mono text-accent">
                  {activeCount} AKTIF
                </span>
              )}
            </div>

            {/* Base Map Style Picker */}
            <div className="flex rounded-lg bg-white/[0.03] p-0.5 border border-white/6 mb-3">
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
                      "flex-1 py-1 text-[9px] font-bold rounded-md transition-all text-center",
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

            {/* List */}
            <motion.div className="space-y-2.5" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}>
              {OVERLAY_ITEMS.map((item) => {
                const isEnabled = overlays[item.key];
                const opacity = overlayOpacities[item.key] ?? 0.65;
                const IconComponent = item.icon;

                return (
                  <motion.div
                    key={item.key}
                    variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                    className={cn(
                      "group rounded-xl border p-2.5 transition-all",
                      isEnabled
                        ? "border-accent/35 bg-accent/[0.03]"
                        : "border-white/4 bg-white/[0.01] hover:border-white/8 hover:bg-white/[0.02]"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      {/* Left: Info */}
                      <div className="flex items-start gap-2 min-w-0">
                        <div
                          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-colors"
                          style={{
                            backgroundColor: isEnabled ? `${item.color}15` : 'rgba(255,255,255,0.03)',
                            borderColor: isEnabled ? `${item.color}35` : 'rgba(255,255,255,0.08)'
                          }}
                        >
                          <IconComponent
                            className="h-3.5 w-3.5"
                            style={{ color: isEnabled ? item.color : '#8f8882' }}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-text-primary leading-tight">
                            {item.label}
                          </p>
                          <span className="text-[8px] text-text-muted leading-tight block truncate mt-0.5">
                            {item.desc}
                          </span>
                        </div>
                      </div>

                      {/* Right: Toggle */}
                      <button
                        type="button"
                        onClick={() => toggleOverlay(item.key)}
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-lg transition-colors border",
                          isEnabled
                            ? "bg-accent/25 border-accent text-accent shadow-glow"
                            : "bg-white/[0.03] border-white/6 text-text-muted hover:text-text-primary hover:bg-white/8"
                        )}
                        title={isEnabled ? 'Sembunyikan' : 'Tampilkan'}
                      >
                        {isEnabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </button>
                    </div>

                    {/* Opacity Slider - Show only when enabled */}
                    {isEnabled && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2.5 pt-2 border-t border-white/4 flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between text-[8px] font-mono text-text-muted">
                          <span>OPASITAS: {Math.round(opacity * 100)}%</span>
                          <span>{item.source}</span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="1.0"
                          step="0.05"
                          value={opacity}
                          onChange={(e) => setOverlayOpacity(item.key, parseFloat(e.target.value))}
                          className="h-1 w-full rounded-lg appearance-none bg-white/10 accent-accent cursor-pointer"
                        />
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button — relative so the badge can be positioned */}
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
          title={collapsed ? 'Buka Overlay Risiko' : 'Tutup Panel'}
        >
          {collapsed ? <Layers className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        {collapsed && activeCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[8px] font-bold text-bg shadow-glow pointer-events-none">
            {activeCount}
          </span>
        )}
      </div>
    </div>
  );
}
