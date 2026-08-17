import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "../../store/useAppStore";
import { useT } from "../../hooks/useTranslation";
import { Info, Map, Droplets, GitBranch } from "lucide-react";
import { rainbowGradientCss, HAZARD_RAMP_STOPS } from "../../lib/hazardOverlay";

// Bar legenda — warnanya identik dengan raster (ramp yang sama).
const RAINBOW_CSS = rainbowGradientCss(12);

export function MapLegend() {
  const t = useT();
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
          className="mt-4 flex flex-col gap-3 border-t border-white/8 pt-3 font-body select-none"
        >
          {/* Header */}
          <div className="flex items-center gap-1.5 border-b border-white/6 pb-2">
            <Info size={12} className="text-accent" />
            <span className="text-[9px] font-bold tracking-wider uppercase text-text-muted">
              {t('panel.mapLegend')}
            </span>
          </div>

          {/* Hazard rainbow legends — warna sinkron dengan raster InaRISK */}
          {[
            { show: showFloodLegend, icon: <Droplets size={10} className="text-cyan-400" />, name: 'Bahaya Banjir' },
            { show: showLandslideLegend, icon: <span className="text-[11px] leading-none">🏔️</span>, name: 'Bahaya Longsor' },
            { show: showEarthquakeLegend, icon: <span className="text-[11px] leading-none">🌋</span>, name: 'Bahaya Gempa' },
          ].filter((h) => h.show).map((h) => (
            <div key={h.name} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1">
                {h.icon}
                <span className="text-[10px] font-bold text-text-primary">{h.name}</span>
              </div>
              <div
                className="h-2.5 w-full rounded border border-white/10"
                style={{ background: RAINBOW_CSS }}
              />
              <div className="flex justify-between text-[8px] font-bold text-text-secondary">
                {HAZARD_RAMP_STOPS.map((s) => (
                  <span key={s.label}>{s.label}</span>
                ))}
              </div>
            </div>
          ))}

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
                <span className="text-[10px] font-bold text-text-primary">{t('panel.landCover')}</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <div className="flex items-center gap-1.5 rounded bg-white/[0.02] border border-white/5 px-2 py-1">
                  <div className="w-2.5 h-2.5 rounded bg-slate-400 border border-slate-500/20 shrink-0" />
                  <span className="text-[8px] font-bold text-text-secondary truncate">{t('panel.urban')}</span>
                </div>
                <div className="flex items-center gap-1.5 rounded bg-white/[0.02] border border-white/5 px-2 py-1">
                  <div className="w-2.5 h-2.5 rounded bg-green-500 border border-green-600/20 shrink-0" />
                  <span className="text-[8px] font-bold text-text-secondary truncate">{t('panel.forest')}</span>
                </div>
                <div className="flex items-center gap-1.5 rounded bg-white/[0.02] border border-white/5 px-2 py-1">
                  <div className="w-2.5 h-2.5 rounded bg-yellow-600 border border-yellow-700/20 shrink-0" />
                  <span className="text-[8px] font-bold text-text-secondary truncate">{t('panel.farming')}</span>
                </div>
                <div className="flex items-center gap-1.5 rounded bg-white/[0.02] border border-white/5 px-2 py-1">
                  <div className="w-2.5 h-2.5 rounded bg-sky-500 border border-sky-600/20 shrink-0" />
                  <span className="text-[8px] font-bold text-text-secondary truncate">{t('panel.water')}</span>
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
