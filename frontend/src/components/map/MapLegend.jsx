import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "../../store/useAppStore";
import { useT } from "../../hooks/useTranslation";
import { Info, GitBranch } from "lucide-react";
import { INARISK_HAZARDS, rainbowGradientCss, HAZARD_RAMP_STOPS } from "../../lib/hazardOverlay";

// Bar legenda — warnanya identik dengan raster (ramp yang sama).
const RAINBOW_CSS = rainbowGradientCss(12);

export function MapLegend() {
  const t = useT();
  const overlays = useAppStore((s) => s.overlays);
  const overlaySources = useAppStore((s) => s.overlaySources);
  const faultLayerSource = useAppStore((s) => s.faultLayerSource);
  const activeHazards = INARISK_HAZARDS.filter((hazard) => overlays[hazard.key]);
  const showFaultLegend = overlays.faults;
  const anyActive = activeHazards.length > 0 || showFaultLegend;
  const faultLegendKey = faultLayerSource === 'official'
    ? 'panel.faultLegendDescription'
    : 'panel.faultFallbackLegendDescription';

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
          {activeHazards.map((hazard) => (
            <div key={hazard.key} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1">
                <span className="text-[11px] leading-none">{hazard.icon}</span>
                <span className="text-[10px] font-bold text-text-primary">{t(hazard.labelKey)}</span>
              </div>
              <div
                className="h-2.5 w-full rounded border border-white/10"
                style={{ background: RAINBOW_CSS }}
              />
              <div className="flex justify-between text-[8px] font-bold text-text-secondary">
                {HAZARD_RAMP_STOPS.map((stop) => (
                  <span key={stop.label}>{t(stop.translationKey)}</span>
                ))}
              </div>
              {overlaySources[hazard.key] === 'fallback' && hazard.fallbackLegendKey && (
                <p className="text-[8px] leading-relaxed text-risk-moderate">
                  {t(hazard.fallbackLegendKey)}
                </p>
              )}
            </div>
          ))}

          {/* Divider if both active */}
          {(showFaultLegend && activeHazards.length > 0) && (
            <div className="h-px bg-white/6" />
          )}

          {/* Fault reference legend */}
          {showFaultLegend && (
            <div data-testid="fault-layer-legend" className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1">
                <GitBranch size={10} className="text-[#d28a7b]" />
                <span className="text-[10px] font-bold text-text-primary">{t('panel.faultLegend')}</span>
              </div>
              <div className="flex items-center gap-2 rounded bg-white/[0.02] border border-white/5 px-2 py-1.5">
                <span
                  className={`w-7 border-t-2 border-[#b86f63] ${faultLayerSource === 'official' ? '' : 'border-dashed'}`}
                />
                <span className="text-[8px] leading-relaxed text-text-secondary">
                  {t(faultLegendKey)}
                </span>
              </div>
              <p className="text-[8px] leading-relaxed text-text-muted">{t('panel.faultSource')}</p>
            </div>
          )}

          {/* Atribusi sumber hazard */}
          {activeHazards.length > 0 && (
            <p className="text-[7px] leading-relaxed text-text-muted">{t('panel.hazardAttribution')}</p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
