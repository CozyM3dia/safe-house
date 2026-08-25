import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useLpInView } from '../../../hooks/useLpMotion';
import { SectionHeader, ProductWindow } from './atoms';
import { EASE, CountUp } from './motion';

/**
 * Sample report, adaptasi section pricing/detail Figma jadi pratinjau
 * laporan teknis. Tab: Ringkasan / Parameter / Bukti Spasial / Sumber.
 * Data = skenario kanonik Bandar Lampung (satu dataset untuk seluruh
 * halaman). Label peran data eksplisit: ditarik / dihitung / AI / lapangan.
 */
export default function SampleReportSection({ t }) {
  const { rootRef, inView } = useLpInView({ threshold: 0.18 });
  const [tab, setTab] = useState(0);
  const reduce = useReducedMotion();

  const tabs = ['summary', 'params', 'spatial', 'method'];

  return (
    <section id="laporan-contoh" ref={rootRef} className="lp-section" aria-labelledby="report-title">
      <div className="lp-container">
        <SectionHeader
          eyebrow={t('reportEyebrow')}
          title={t('reportTitle')} titleId="report-title"
          lead={t('reportLead')}
        />

        {/* Tab */}
        <div
          className={`mt-9 flex flex-wrap gap-2 ${inView ? 'lp-in' : 'lp-reveal'}`}
          role="tablist"
          aria-label={t('reportTablistLabel')}
          style={{ '--lp-delay': '120ms' }}
        >
          {tabs.map((tb, i) => (
            <button
              key={tb}
              type="button"
              role="tab"
              id={`report-tab-${tb}`}
              aria-selected={tab === i}
              aria-controls={`report-panel-${tb}`}
              onClick={() => setTab(i)}
              className={`min-h-[44px] rounded-full px-5 text-[0.85rem] font-semibold transition-all duration-300 ${
                tab === i
                  ? 'bg-[color:var(--lp-mocha)] text-[color:var(--lp-paper)] shadow-[0_10px_24px_rgba(36,31,26,0.2)]'
                  : 'border border-[color:var(--lp-line)] bg-[color:var(--lp-paper)] text-[color:var(--lp-clay)] hover:border-[color:var(--lp-taupe)] hover:text-[color:var(--lp-mocha)]'
              }`}
            >
              {t(`reportTab${tb.charAt(0).toUpperCase()}${tb.slice(1)}`)}
            </button>
          ))}
        </div>

        {/* Panel dokumen */}
        <div className={`mt-6 ${inView ? 'lp-in' : 'lp-reveal'}`} style={{ '--lp-delay': '200ms' }}>
          <ProductWindow title={t('reportWindowTitle')}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={tab}
                role="tabpanel"
                id={`report-panel-${tabs[tab]}`}
                aria-labelledby={`report-tab-${tabs[tab]}`}
                initial={reduce ? false : { opacity: 0, y: 14, filter: 'blur(4px)' }}
                animate={reduce ? undefined : { opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, filter: 'blur(4px)' }}
                transition={{ duration: 0.35, ease: EASE }}
                className="bg-[color:var(--lp-doc-bg)] p-6 text-[color:var(--lp-umber)] md:p-9"
              >
                {tab === 0 ? <ReportSummary t={t} /> : null}
                {tab === 1 ? <ReportParams t={t} /> : null}
                {tab === 2 ? <ReportSpatial t={t} /> : null}
                {tab === 3 ? <ReportMethod t={t} /> : null}
              </motion.div>
            </AnimatePresence>
          </ProductWindow>
        </div>

        {/* Pemisah peran data */}
        <div className="mx-auto mt-6 grid max-w-4xl gap-3 text-[0.8rem] sm:grid-cols-4">
          {['Pulled', 'Computed', 'Ai', 'Field'].map((r, i) => (
            <div
              key={r}
              className={`rounded-xl border border-dashed border-[color:var(--lp-line)] px-4 py-3 ${inView ? 'lp-in' : 'lp-reveal'}`}
              style={{ '--lp-delay': `${280 + i * 80}ms` }}
            >
              <p className="lp-mono text-[8.5px] text-[color:var(--lp-taupe)]">{t(`reportRole${r}`)}</p>
              <p className="mt-1.5 leading-snug text-[color:var(--lp-clay)]">{t(`reportRole${r}Desc`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Panel: Ringkasan ─────────────────────────────────────────────────────── */
function ReportSummary({ t }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[color:var(--lp-line-soft)] pb-5">
        <div>
          <p className="lp-mono text-[8.5px] text-[color:var(--lp-taupe)]">{t('reportSummaryIdLabel')}</p>
          <h3 className="lp-serif mt-1.5 text-[1.5rem] leading-tight text-[color:var(--lp-mocha)]">
            {t('reportSummaryLocation')}
          </h3>
          <p className="lp-num mt-1 text-[11px] text-[color:var(--lp-clay)]">{t('reportSummaryCoord')}</p>
        </div>
        <div className="text-right">
          <p className="text-[2.6rem] leading-none text-[color:var(--lp-mocha)]">
            <CountUp to={65} duration={1.4} className="lp-num" />
          </p>
          <p className="lp-mono mt-1 text-[9px] text-[color:var(--lp-band-moderate)]">{t('reportSummaryBand')}</p>
        </div>
      </div>
      
      <p className="text-[0.95rem] leading-[1.8] text-[color:var(--lp-umber)]/90">{t('reportSummaryText')}</p>
      
      <ul className="grid gap-2.5 sm:grid-cols-2">
        {[1, 2, 3, 4].map((n) => (
          <li key={n} className="flex items-start gap-3 text-[0.88rem] leading-snug text-[color:var(--lp-clay)]">
            <span className="mt-[7px] h-1 w-4 shrink-0 bg-[color:var(--lp-sand)]" aria-hidden="true" />
            <span>{t(`reportSummaryPoint${n}`)}</span>
          </li>
        ))}
      </ul>

      {/* ── S.A.F.E AI Expert Narrative Card ── */}
      <div className="mt-6 rounded-2xl border border-[color:var(--lp-copper)]/30 bg-[#1e1915] p-5 text-[#f5ebd9] shadow-lg">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[color:var(--lp-copper)]/20 text-[color:var(--lp-copper)]">
            ✨
          </span>
          <div>
            <span className="lp-mono text-[9px] font-bold tracking-widest text-[color:var(--lp-copper)]">
              {t('reportAiBadge')}
            </span>
            <h4 className="text-[0.95rem] font-semibold text-[#f5ebd9]">
              {t('reportAiTitle')}
            </h4>
          </div>
        </div>

        <p className="mt-3 text-[0.88rem] leading-relaxed text-[#d4c5b3]">
          {t('reportAiNarrative')}
        </p>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
          {[1, 2, 3].map((num) => (
            <div key={num} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
              <p className="text-[0.8rem] leading-snug text-[#e8dac6]">
                {t(`reportAiPoint${num}`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Panel: Parameter teknis ─────────────────────────────────────────────── */
function ReportParams({ t }) {
  const reduce = useReducedMotion();
  const rows = [
    { label: 'Vs30', value: t('reportParamVs30Value'), cls: t('reportParamVs30Class'), note: t('reportParamVs30Note') },
    { label: t('reportParamPgaLabel'), value: t('reportParamPgaValue'), cls: '', note: t('reportParamPgaNote') },
    { label: 'FS likuefaksi', value: t('reportParamFsValue'), cls: '', note: t('reportParamFsNote') },
    { label: t('reportParamFloodLabel'), value: t('reportParamFloodValue'), cls: '', note: t('reportParamFloodNote') },
  ];
  // Baris reveal berurutan tiap kali tab dibuka; reduced-motion = tr biasa.
  const RowTag = reduce ? 'tr' : motion.tr;
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[color:var(--lp-line)]">
              {['Parameter', 'Nilai', 'Keterangan'].map((h) => (
                <th key={h} className="lp-mono pb-3 pr-4 text-[8.5px] font-medium text-[color:var(--lp-taupe)]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <RowTag
                key={r.label}
                {...(reduce
                  ? {}
                  : {
                      initial: { opacity: 0, y: 10 },
                      animate: { opacity: 1, y: 0 },
                      transition: { duration: 0.45, ease: EASE, delay: i * 0.09 },
                    })}
                className="border-b border-[color:var(--lp-line-soft)] last:border-0"
              >
                <td className="py-3.5 pr-4 text-[0.9rem] font-semibold text-[color:var(--lp-mocha)]">
                  {r.label}
                  {r.cls ? (
                    <span className="lp-num ml-2 rounded bg-[color:var(--lp-well)] px-1.5 py-0.5 text-[10px] text-[color:var(--lp-chestnut)]">
                      {r.cls}
                    </span>
                  ) : null}
                </td>
                <td className="lp-num py-3.5 pr-4 text-[0.95rem] text-[color:var(--lp-chestnut)]">{r.value}</td>
                <td className="py-3.5 text-[0.82rem] leading-snug text-[color:var(--lp-clay)]">{r.note}</td>
              </RowTag>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-[0.78rem] leading-relaxed text-[color:var(--lp-taupe)]">{t('reportParamsFootnote')}</p>
    </div>
  );
}

/* ── Panel: Bukti spasial ────────────────────────────────────────────────── */
function ReportSpatial({ t }) {
  return (
    <div className="grid gap-5 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <img
        src="/landing/report-spatial.jpg"
        width={1170}
        height={810}
        alt={t('reportSpatialImgAlt')}
        loading="lazy"
        decoding="async"
        className="w-full rounded-lg border border-[color:var(--lp-line-soft)]"
      />
      <ul className="flex flex-col justify-center gap-4">
        {[1, 2, 3].map((n) => (
          <li key={n} className="border-l-2 border-[color:var(--lp-sand)] pl-4">
            <p className="lp-mono text-[8.5px] text-[color:var(--lp-taupe)]">{t(`reportSpatial${n}Tag`)}</p>
            <p className="mt-1 text-[0.9rem] leading-snug text-[color:var(--lp-umber)]">{t(`reportSpatial${n}Text`)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Panel: Sumber & metodologi ──────────────────────────────────────────── */
function ReportMethod({ t }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <p className="lp-mono text-[8.5px] text-[color:var(--lp-taupe)]">{t('reportMethodPulledLabel')}</p>
        <ul className="mt-3 flex flex-col gap-2 text-[0.88rem] text-[color:var(--lp-umber)]/90">
          {[1, 2, 3, 4].map((n) => (
            <li key={n} className="flex items-start gap-2.5">
              <span className="mt-[8px] h-1 w-1 shrink-0 rounded-full bg-[color:var(--lp-chestnut)]" aria-hidden="true" />
              {t(`reportMethodSource${n}`)}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="lp-mono text-[8.5px] text-[color:var(--lp-taupe)]">{t('reportMethodLimitsLabel')}</p>
        <ul className="mt-3 flex flex-col gap-2 text-[0.88rem] text-[color:var(--lp-umber)]/90">
          {[1, 2, 3].map((n) => (
            <li key={n} className="flex items-start gap-2.5">
              <span className="mt-[8px] h-1 w-1 shrink-0 rounded-full bg-[color:var(--lp-copper-deep)]" aria-hidden="true" />
              {t(`reportMethodLimit${n}`)}
            </li>
          ))}
        </ul>
      </div>
      <p className="text-[0.8rem] leading-relaxed text-[color:var(--lp-taupe)] md:col-span-2">{t('reportMethodFootnote')}</p>
    </div>
  );
}
