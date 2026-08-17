import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "../../store/useAppStore";
import { cn } from "../../lib/utils";
import { Info, Map, Droplets, GitBranch } from "lucide-react";

export function MapLegend() {
  const overlays = useAppStore((s) => s.overlays);

  const showFloodLegend = overlays.flood;
  const showLandslideLegend = overlays.landslide;
  const showEarthquakeLegend = overlays.earthquake;
  const showLandCoverLegend = overlays.landcover;
  const showFaultLegend = overlays.faults;
  const anyActive =
    showFloodLegend || showLandslideLegend || showEarthquakeLegend ||
    showLandCoverLegend || showFaultLegend;

  return (
    <AnimatePresence>
      {anyActive && (
        <motion.div
          initial={{ opacity: 0, y: 15, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 15, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className={cn(
            "fixed left-4 bottom-24 z-[20] pointer-events-auto",
            "w-56 rounded-2xl border border-white/8 bg-bg-surface/90 backdrop-blur-xl p-4 shadow-glass-lg",
            "flex flex-col gap-3 font-body select-none"
          )}
        >
          {/* Header */}
          <div className="flex items-center gap-1.5 border-b border-white/6 pb-2">
            <Info size={12} className="text-accent" />
            <span className="text-[9px] font-bold tracking-wider uppercase text-text-muted">
              Legenda Peta
            </span>
          </div>

          {/* Flood Legend */}
          {showFloodLegend && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1">
                <Droplets size={10} className="text-cyan-400" />
                <span className="text-[10px] font-bold text-text-primary">Risiko Banjir</span>
              </div>
              <div className="grid grid-cols-3 gap-1 pt-1">
                <div className="flex flex-col items-center gap-1 rounded bg-white/[0.02] border border-white/5 py-1">
                  <div className="w-2 h-2 rounded bg-green-500" />
                  <span className="text-[8px] font-bold text-text-secondary">Rendah</span>
                </div>
                <div className="flex flex-col items-center gap-1 rounded bg-white/[0.02] border border-white/5 py-1">
                  <div className="w-2 h-2 rounded bg-yellow-500" />
                  <span className="text-[8px] font-bold text-text-secondary">Sedang</span>
                </div>
                <div className="flex flex-col items-center gap-1 rounded bg-white/[0.02] border border-white/5 py-1">
                  <div className="w-2 h-2 rounded bg-red-500" />
                  <span className="text-[8px] font-bold text-text-secondary">Tinggi</span>
                </div>
              </div>
            </div>
          )}

          {showLandslideLegend && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1">
                <span className="text-[11px] leading-none">🏔️</span>
                <span className="text-[10px] font-bold text-text-primary">Bahaya Longsor</span>
              </div>
              <div className="grid grid-cols-3 gap-1 pt-1">
                {[['Rendah','bg-green-500'],['Sedang','bg-yellow-500'],['Tinggi','bg-red-500']].map(([label,clr]) => (
                  <div key={label} className="flex flex-col items-center gap-1 rounded bg-white/[0.02] border border-white/5 py-1">
                    <div className={cn('w-2 h-2 rounded', clr)} />
                    <span className="text-[8px] font-bold text-text-secondary">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showEarthquakeLegend && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1">
                <span className="text-[11px] leading-none">🌋</span>
                <span className="text-[10px] font-bold text-text-primary">Bahaya Gempa</span>
              </div>
              <div className="grid grid-cols-3 gap-1 pt-1">
                {[['Rendah','bg-green-500'],['Sedang','bg-yellow-500'],['Tinggi','bg-red-500']].map(([label,clr]) => (
                  <div key={label} className="flex flex-col items-center gap-1 rounded bg-white/[0.02] border border-white/5 py-1">
                    <div className={cn('w-2 h-2 rounded', clr)} />
                    <span className="text-[8px] font-bold text-text-secondary">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Divider if both active */}
          {showFloodLegend && showLandCoverLegend && (
            <div className="h-px bg-white/6" />
          )}

          {(showFaultLegend && (showFloodLegend || showLandCoverLegend)) && (
            <div className="h-px bg-white/6" />
          )}

          {/* Fault reference legend */}
          {showFaultLegend && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1">
                <GitBranch size={10} className="text-[#d28a7b]" />
                <span className="text-[10px] font-bold text-text-primary">Referensi sesar aktif</span>
              </div>
              <div className="flex items-center gap-2 rounded bg-white/[0.02] border border-white/5 px-2 py-1.5">
                <span className="w-7 border-t-2 border-[#b86f63]" />
                <span className="text-[8px] leading-relaxed text-text-secondary">
                  Sumber: PuSGeN 2024 melalui InaRISK BNPB
                </span>
              </div>
            </div>
          )}

          {/* Land Cover Legend */}
          {showLandCoverLegend && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1">
                <Map size={10} className="text-green-400" />
                <span className="text-[10px] font-bold text-text-primary">Tutupan Lahan</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <div className="flex items-center gap-1.5 rounded bg-white/[0.02] border border-white/5 px-2 py-1">
                  <div className="w-2.5 h-2.5 rounded bg-slate-400 border border-slate-500/20 shrink-0" />
                  <span className="text-[8px] font-bold text-text-secondary truncate">Urban</span>
                </div>
                <div className="flex items-center gap-1.5 rounded bg-white/[0.02] border border-white/5 px-2 py-1">
                  <div className="w-2.5 h-2.5 rounded bg-green-500 border border-green-600/20 shrink-0" />
                  <span className="text-[8px] font-bold text-text-secondary truncate">Hutan</span>
                </div>
                <div className="flex items-center gap-1.5 rounded bg-white/[0.02] border border-white/5 px-2 py-1">
                  <div className="w-2.5 h-2.5 rounded bg-yellow-600 border border-yellow-700/20 shrink-0" />
                  <span className="text-[8px] font-bold text-text-secondary truncate">Tani</span>
                </div>
                <div className="flex items-center gap-1.5 rounded bg-white/[0.02] border border-white/5 px-2 py-1">
                  <div className="w-2.5 h-2.5 rounded bg-sky-500 border border-sky-600/20 shrink-0" />
                  <span className="text-[8px] font-bold text-text-secondary truncate">Air</span>
                </div>
              </div>
            </div>
          )}

          {/* Atribusi sumber hazard */}
          {(showFloodLegend || showLandslideLegend || showEarthquakeLegend) && (
            <p className="text-[7px] leading-relaxed text-text-muted">Sumber: InaRISK BNPB</p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
