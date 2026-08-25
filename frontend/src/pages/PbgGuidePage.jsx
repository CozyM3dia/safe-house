import { Link } from 'react-router-dom';
import { ArrowRight, FileCheck2, ShieldCheck } from 'lucide-react';

import { useT } from '../hooks/useTranslation';

const ITEM_IDS = [
  'soil_investigation',
  'seismic_design_spectrum',
  'ductile_detailing',
  'liquefaction_study',
  'fault_zone_review',
  'flood_proofing',
  'slope_stability',
  'subsidence_monitoring',
  'tsunami_readiness',
];

/**
 * Halaman panduan PBG — /pbg dan /pbg-checklist.
 * Checklist aktual tetap dihasilkan per-audit di laporan; halaman ini
 * menjelaskan isi daftar itu tanpa mengarang angka lokasi.
 */
export default function PbgGuidePage() {
  const t = useT();

  return (
    <div className="rpt document-scroll min-h-[100dvh] bg-bg text-text-primary">
      <header className="border-b border-[rgba(255,210,170,0.07)]">
        <div className="safe-top mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 pb-3 sm:px-5">
          <Link to="/" className="flex min-h-[44px] items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-accent" />
            <span className="font-display text-sm font-bold tracking-tight">S.A.F.E House</span>
          </Link>
          <Link
            to="/app"
            className="btn-press inline-flex min-h-[44px] items-center rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-bg"
          >
            {t('report.startAudit')}
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-5">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
          PP 16/2021 · SNI 1726:2019
        </p>
        <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          {t('pbg.pageTitle')}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text-secondary">
          {t('pbg.pageLead')}
        </p>

        <ul className="mt-8 flex flex-col gap-3">
          {ITEM_IDS.map((id) => (
            <li
              key={id}
              className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"
            >
              <div className="flex items-start gap-3">
                <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <div>
                  <h2 className="text-sm font-semibold">{t(`pbg.item.${id}.title`)}</h2>
                  <p className="mt-1 text-xs leading-relaxed text-text-muted">
                    {t(`pbg.item.${id}.detail`).replace(/\{[^}]+\}/g, '…')}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-xs leading-relaxed text-text-muted">{t('pbg.note')}</p>

        <Link
          to="/app"
          className="btn-press mt-8 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-bg"
        >
          {t('pbg.runAuditCta')} <ArrowRight className="h-4 w-4" />
        </Link>
      </main>
    </div>
  );
}
