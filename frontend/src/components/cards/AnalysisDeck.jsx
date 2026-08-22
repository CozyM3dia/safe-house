import { useId, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Activity, Radar as RadarIcon, Waves } from 'lucide-react';

import { Card } from '../ui/card';
import { useT } from '../../hooks/useTranslation';
import { useAppStore } from '../../store/useAppStore';
import { RadarPlot } from './RadarCard';
import { SeismicPlot } from './SeismicPlot';
import { SpectrumPlot } from './SpectrumPlot';
import { computeSpectrum, peakHazard, seismicTone } from './analysis-data';
import './analysis-deck.css';

/**
 * Tiga grafik analisis dalam satu instrumen.
 *
 * Dulu radar, seismogram, dan spektrum masing-masing kartu penuh: tiga
 * bingkai, tiga judul, tiga baris kaki "FIG. NN", dua belas tanda register
 * sudut — dan PGA tercetak tiga kali (di metrik teknis, di kepala
 * seismogram, dan di baris pembacaan spektrum). Panelnya jadi setinggi
 * ~1900px untuk isi yang muat di sepertiganya.
 *
 * Sekarang bingkainya digambar sekali dan kanalnya bertukar di dalamnya.
 * Tiap kanal membawa satu baris keterangan berisi fakta yang hanya ada di
 * kanal itu, jadi tidak ada angka yang tampil dua kali.
 */
export function AnalysisDeck({ property }) {
  const t = useT();
  const lang = useAppStore((s) => s.lang);
  const isEn = lang === 'en';
  const reduceMotion = useReducedMotion();
  const pillId = useId();

  const pga = Number(property?.geotech?.pga_surface ?? property?.geotech?.pga);
  const hasPga = Number.isFinite(pga);
  const hasRadar = Boolean(property?.hazard?.radar);

  const channels = useMemo(
    () =>
      [
        hasRadar && { key: 'radar', label: t('deck.radar'), short: t('deck.radarShort'), icon: RadarIcon },
        hasPga && { key: 'shaking', label: t('deck.shaking'), short: t('deck.shakingShort'), icon: Waves },
        hasPga && { key: 'spectrum', label: t('deck.spectrum'), short: t('deck.spectrumShort'), icon: Activity },
      ].filter(Boolean),
    [hasRadar, hasPga, t],
  );

  const [activeKey, setActiveKey] = useState(channels[0]?.key);
  const tabRefs = useRef({});

  if (!channels.length) return null;

  // Audit berikutnya bisa saja tidak punya kanal yang sedang dibuka; kanal
  // aktif diturunkan, bukan disinkronkan lewat efek.
  const active = channels.find((c) => c.key === activeKey) ?? channels[0];
  const tone = hasPga ? seismicTone(pga) : 'safe';
  const g = property?.geotech || {};

  const onTabKeyDown = (event) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const index = channels.findIndex((c) => c.key === active.key);
    const next = channels[(index + step + channels.length) % channels.length];
    setActiveKey(next.key);
    tabRefs.current[next.key]?.focus();
  };

  // Nilai kepala kartu: satu angka yang paling menjelaskan kanal aktif.
  const headline = (() => {
    if (active.key === 'radar') {
      const peak = peakHazard(property, isEn);
      return { label: t('deck.peakHazard'), value: String(peak.value), unit: '', note: peak.name, tone: 'accent' };
    }
    if (active.key === 'shaking') {
      return {
        label: t('deck.surfacePga'),
        value: pga.toFixed(2),
        unit: 'g',
        note: tone === 'danger' ? t('deck.high') : tone === 'moderate' ? t('deck.medium') : t('deck.low'),
        tone: 'status',
      };
    }
    const { sds } = computeSpectrum(pga);
    return { label: 'SDS', value: sds.toFixed(2), unit: 'g', note: 'SNI 1726:2019', tone: 'status' };
  })();

  const meta = (() => {
    if (active.key === 'radar') {
      return [t('deck.radarMeta')];
    }
    if (active.key === 'shaking') {
      const fault = g.nearest_fault;
      const dist = Number(fault?.distance_km);
      return [
        fault?.name
          ? `${t('card.faultPrefix')} ${fault.name}${Number.isFinite(dist) ? ` · ${Math.round(dist)} km` : ''}`
          : null,
        t('deck.shakingMeta'),
      ].filter(Boolean);
    }
    const { sd1 } = computeSpectrum(pga);
    return [
      `SD1 ${sd1.toFixed(2)} g`,
      g.site_class != null ? `${t('deck.siteClass')} ${g.site_class}` : null,
      g.fa != null ? `Fa ${g.fa}` : null,
    ].filter(Boolean);
  })();

  return (
    <Card className="instr" data-status={tone} data-testid="analysis-deck">
      <div
        role="tablist"
        aria-label={t('panel.riskAnalysis')}
        className="instr-tabs"
        onKeyDown={onTabKeyDown}
      >
        {channels.map((channel) => {
          const selected = channel.key === active.key;
          const Icon = channel.icon;
          return (
            <button
              key={channel.key}
              ref={(node) => {
                tabRefs.current[channel.key] = node;
              }}
              type="button"
              role="tab"
              id={`${pillId}-tab-${channel.key}`}
              aria-selected={selected}
              aria-controls={`${pillId}-panel-${channel.key}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveKey(channel.key)}
              className="instr-tab"
            >
              {selected && (
                <motion.span
                  layoutId={reduceMotion ? undefined : `${pillId}-pill`}
                  className="instr-tab-pill"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  aria-hidden
                />
              )}
              <Icon className="instr-tab-icon h-3 w-3" strokeWidth={2.25} aria-hidden />
              <span className="instr-tab-label">{channel.short}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-text-secondary">
            {active.label}
          </h3>
          <p className="instr-eyebrow mt-1 truncate">{headline.label}</p>
        </div>
        <div className="shrink-0 text-right">
          <div className="instr-value text-[34px] leading-none" data-tone={headline.tone}>
            {headline.value}
            {headline.unit && <span className="instr-value-unit ml-0.5">{headline.unit}</span>}
          </div>
          <div className="instr-eyebrow mt-1.5 truncate">{headline.note}</div>
        </div>
      </div>

      <div
        className="instr-plot"
        role="tabpanel"
        id={`${pillId}-panel-${active.key}`}
        aria-labelledby={`${pillId}-tab-${active.key}`}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active.key}
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.32, 0.72, 0, 1] }}
          >
            {active.key === 'radar' && <RadarPlot propertyA={property} />}
            {active.key === 'shaking' && <SeismicPlot property={property} />}
            {active.key === 'spectrum' && <SpectrumPlot property={property} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <p className="instr-meta">{meta.join(' · ')}</p>
    </Card>
  );
}
