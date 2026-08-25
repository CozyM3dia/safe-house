import { motion, useReducedMotion } from 'framer-motion';
import { Activity, ArrowUpRight, FileText, Map as MapIcon, Mountain, Radar } from 'lucide-react';

import { useAppStore } from '../../store/useAppStore';
import { useT } from '../../hooks/useTranslation';

// ── Konsep v5: sesederhana mungkin ─────────────────────────────────
// Satu lokasi = satu baris: skor berwarna band · nama · panah. Tanpa
// waveform, spine, strip statistik, atau ornamen lain — semua angka
// teknis memang pekerjaan audit, bukan daftar. Gerak: stagger masuk
// saat scroll + satu efek hover (latar + panah). Instan saat
// prefers-reduced-motion. Skor = pratinjau skenario, dijelaskan footnote.

const SITES = [
  {
    id: 'bl',
    label: 'Bandar Lampung',
    subId: 'Pesisir, tanah lunak',
    subEn: 'Coastal, soft soil',
    lat: -5.4292,
    lon: 105.261,
    score: 65,
    band: 'moderate',
  },
  {
    id: 'jkt',
    label: 'Jakarta Pusat',
    subId: 'Cekungan aluvial',
    subEn: 'Alluvial basin',
    lat: -6.2088,
    lon: 106.8456,
    score: 55,
    band: 'moderate',
  },
  {
    id: 'bdg',
    label: 'Bandung',
    subId: 'Dekat Sesar Lembang',
    subEn: 'Near Lembang Fault',
    lat: -6.9175,
    lon: 107.6191,
    score: 76,
    band: 'high',
  },
];

const REPORT_ITEMS = [
  { icon: MapIcon, labelKey: 'empty.reportMap' },
  { icon: Radar, labelKey: 'empty.reportRadar' },
  { icon: Mountain, labelKey: 'empty.reportFoundation' },
  { icon: FileText, labelKey: 'empty.reportPdf' },
];

const BAND_TEXT = {
  moderate: 'text-risk-moderate',
  high: 'text-risk-danger',
};

function SectionHeader({ title, tone = 'accent' }) {
  const reduce = useReducedMotion();
  const lineClass =
    tone === 'safe' ? 'from-risk-safe/25 to-transparent' : 'from-accent/25 to-transparent';
  return (
    <h3 className="mb-1 flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-text-secondary">
      {title}
      <motion.span
        aria-hidden="true"
        className={`h-px flex-1 origin-left bg-gradient-to-r ${lineClass}`}
        initial={reduce ? false : { scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, amount: 0.8 }}
        transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
      />
    </h3>
  );
}

export function SampleLocationChannels() {
  const t = useT();
  const lang = useAppStore((s) => s.lang);
  const processLocation = useAppStore((s) => s.processLocation);
  const reduce = useReducedMotion();
  const isEn = lang === 'en';

  return (
    <section className="mt-7">
      <SectionHeader title={t('empty.sampleLocations')} />
      <div className="border-t border-white/[0.06]">
        {SITES.map((site, i) => (
          <motion.button
            key={site.id}
            type="button"
            onClick={() => processLocation(site.lat, site.lon)}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ delay: 0.06 + i * 0.08, duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            className="group flex w-full items-center gap-3 border-b border-white/[0.06] py-3 text-left transition-colors duration-150 hover:bg-accent/[0.04] focus-visible:bg-accent/[0.04] focus-visible:outline-none"
          >
            {/* Skor skenario: satu angka berwarna band, cukup sebagai sinyal */}
            <span
              className={`w-14 shrink-0 font-mono text-[11px] font-bold leading-none tracking-[0.04em] tabular-nums ${BAND_TEXT[site.band]}`}
            >
              {site.score}
              <span className="ml-1 text-[8px] font-bold tracking-[0.12em]">
                {site.band === 'high' ? t('empty.bandHigh') : t('empty.bandModerate')}
              </span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold leading-snug text-text-primary transition-colors duration-150 group-hover:text-accent">
                {site.label}
              </span>
              <span className="block truncate text-[10.5px] leading-snug text-text-secondary">
                {isEn ? site.subEn : site.subId}
              </span>
            </span>
            <ArrowUpRight
              className="h-4 w-4 shrink-0 text-text-muted transition-all duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
              aria-hidden="true"
            />
          </motion.button>
        ))}
      </div>
      <p className="cf-note mt-2">{t('empty.scenarioNote')}</p>
    </section>
  );
}

export function CapabilityPipeline() {
  const t = useT();
  const reduce = useReducedMotion();

  return (
    <section className="mt-7">
      <SectionHeader title={t('empty.reportIncludes')} tone="safe" />
      <ul className="mt-2.5 flex flex-wrap gap-1.5">
        {REPORT_ITEMS.map(({ icon: Icon, labelKey }, i) => (
          <motion.li
            key={labelKey}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ delay: 0.1 + i * 0.07, duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
            className="cf-chip"
          >
            <Icon className="h-3 w-3 text-accent/70" aria-hidden="true" />
            {t(labelKey)}
          </motion.li>
        ))}
      </ul>
      <p className="cf-note mt-2.5">
        <Activity className="mr-1 inline h-3 w-3 text-risk-safe" aria-hidden="true" />
        {t('empty.duration')}
      </p>
    </section>
  );
}
