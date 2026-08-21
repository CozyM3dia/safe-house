import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  CircleAlert,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

import { getValidation } from '../services/api';
import { useT } from '../hooks/useTranslation';

/**
 * Halaman validasi historis — /validasi.
 *
 * Engine yang sama dengan audit biasa menghitung ulang parameter di titik
 * kejadian bencana terdokumentasi, lalu dicocokkan dengan fakta lapangan.
 * Semua angka datang dari backend (GET /api/validasi); halaman ini murni
 * penyaji. Kegagalan satu kejadian ditampilkan apa adanya.
 */
export default function ValidationPage() {
  const t = useT();
  const [state, setState] = useState({ status: 'loading', data: null, error: null });

  useEffect(() => {
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ status: 'loading', data: null, error: null });
    getValidation()
      .then((data) => {
        if (alive) setState({ status: 'ready', data });
      })
      .catch(() => {
        if (alive) setState({ status: 'error', data: null });
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="report-page document-scroll min-h-[100dvh] bg-bg text-text-primary">
      <header className="sticky top-0 z-20 border-b border-[rgba(255,210,170,0.07)] bg-bg/85 backdrop-blur-md">
        <div className="safe-top mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <Link to="/" className="flex min-h-[44px] items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-accent" />
            <span className="font-display text-sm font-bold tracking-tight">S.A.F.E House</span>
          </Link>
          <Link
            to="/app"
            className="btn-press inline-flex min-h-[36px] shrink-0 items-center rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-bg"
          >
            {t('report.createAudit')}
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 pb-16 pt-8 sm:px-5">
        {/* --- Pembuka editorial --- */}
        <p className="rpt-eyebrow">{t('validasi.eyebrow')}</p>
        <h1 className="mt-2 font-display text-3xl leading-tight sm:text-[2.6rem]">
          {t('validasi.title')}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-secondary">
          {t('validasi.subtitle')}
        </p>

        {state.status === 'loading' && (
          <div className="mt-12 flex items-center justify-center gap-2 text-sm text-text-muted" role="status" aria-live="polite">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('validasi.computing')}
          </div>
        )}

        {state.status === 'error' && (
          <div className="mt-12 flex flex-col items-center gap-2 text-center">
            <CircleAlert className="h-6 w-6 text-risk-moderate" />
            <p className="text-sm text-text-muted">{t('validasi.failed')}</p>
          </div>
        )}

        {state.status === 'ready' && state.data && (
          <>
            {/* --- Rekap skor kecocokan --- */}
            <div
              className="mt-8 flex items-center gap-4 rounded-2xl border p-5"
              style={{ borderColor: 'var(--rpt-line-strong)', background: 'rgba(22,14,8,0.45)' }}
            >
              <span className="font-display text-5xl leading-none text-accent">
                {state.data.matched}
                <span className="text-2xl text-text-muted">/{state.data.total}</span>
              </span>
              <p className="text-[13px] leading-relaxed text-text-secondary">
                {t('validasi.scoreLine')}
              </p>
            </div>

            <div className="mt-10 space-y-5">
              {state.data.events.map((event, idx) => (
                <EventCard key={event.id} event={event} index={idx} />
              ))}
            </div>

            <p className="mt-10 border-t pt-5 text-[11px] leading-relaxed text-text-muted" style={{ borderColor: 'var(--rpt-line)' }}>
              {state.data.engine_note}
            </p>

            <div className="mt-8 rounded-2xl border border-accent/20 bg-accent/5 p-5 text-center">
              <h2 className="mb-1 font-display text-base font-semibold">{t('validasi.ctaTitle')}</h2>
              <p className="mx-auto mb-4 max-w-md text-sm text-text-secondary">{t('validasi.ctaDesc')}</p>
              <Link
                to="/app"
                className="btn-press inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-bg"
              >
                {t('report.startAudit')} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function EventCard({ event, index }) {
  const t = useT();
  const { event: meta, site, computed, expect, match } = event;
  const fault = computed.nearest_fault || {};

  return (
    <article
      className="overflow-hidden rounded-2xl border"
      style={{
        borderColor: match ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.35)',
        background: 'rgba(22,14,8,0.45)',
      }}
    >
      {/* Pita nomor + verdict */}
      <div className="flex items-center justify-between gap-3 border-b px-5 py-3" style={{ borderColor: 'var(--rpt-line)' }}>
        <span className="font-data text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
          {String(index + 1).padStart(2, '0')} · {meta.date}
        </span>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-data text-[9.5px] font-bold uppercase tracking-[0.14em]"
          style={{
            color: match ? '#10b981' : '#ef4444',
            background: match ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${match ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          }}
        >
          {match ? <BadgeCheck className="h-3 w-3" /> : <CircleAlert className="h-3 w-3" />}
          {match ? t('validasi.match') : t('validasi.mismatch')}
        </span>
      </div>

      <div className="grid gap-5 p-5 sm:grid-cols-[1fr_auto_1fr] sm:gap-0">
        {/* Fakta lapangan */}
        <div className="min-w-0 sm:pr-5">
          <p className="rpt-eyebrow">{t('validasi.fieldFact')}</p>
          <h3 className="mt-1.5 font-display text-lg leading-snug">
            {meta.name} · M{meta.magnitude}
          </h3>
          <p className="mt-1 font-data text-[10.5px] text-accent">{site.name}</p>
          <p className="mt-2 text-[12px] leading-relaxed text-text-secondary">{meta.fact}</p>
          <p className="mt-2 font-data text-[9.5px] uppercase tracking-[0.14em] text-text-muted">
            {meta.source}
          </p>
        </div>

        {/* Pembatas vertikal */}
        <div className="hidden w-px sm:block" style={{ background: 'var(--rpt-line)' }} />

        {/* Hitungan engine live */}
        <div className="min-w-0 sm:pl-5">
          <p className="rpt-eyebrow">{t('validasi.engineNow')}</p>
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
            <Metric label="FS likuefaksi" value={computed.fs?.toFixed(2) ?? '—'} tone={computed.fs < 1 ? 'danger' : 'safe'} sub={computed.liquefaction_status} />
            <Metric label="Vs30" value={computed.vs30 ?? '—'} unit="m/s" sub={`${t('validasi.class')} ${computed.site_class}`} />
            <Metric label="PGA permukaan" value={computed.pga_surface?.toFixed(2) ?? '—'} unit="g" />
            <Metric label={t('validasi.nearestFault')} value={fault.distance_km != null ? fault.distance_km.toFixed(1) : '—'} unit="km" sub={fault.name} />
          </dl>

          {/* Ekspektasi vs hasil */}
          <div className="mt-3 rounded-lg border px-3 py-2" style={{ borderColor: 'var(--rpt-line-strong)' }}>
            <p className="font-data text-[9.5px] uppercase tracking-[0.14em] text-text-muted">
              {t('validasi.expectation')}
            </p>
            <p className="mt-0.5 text-[12px] font-semibold text-text-primary">{expect.label}</p>
          </div>
        </div>
      </div>
    </article>
  );
}

function Metric({ label, value, unit, sub, tone }) {
  const color = tone === 'danger' ? '#ef4444' : tone === 'safe' ? '#10b981' : undefined;
  return (
    <div className="min-w-0">
      <dt className="text-[9px] font-bold uppercase tracking-[0.15em] text-text-muted">{label}</dt>
      <dd className="data-num mt-0.5 truncate text-base font-semibold" style={color ? { color } : undefined}>
        {value}
        {unit && <span className="ml-0.5 text-[10px] font-normal text-text-muted">{unit}</span>}
      </dd>
      {sub && <dd className="truncate font-data text-[9.5px] text-text-muted">{sub}</dd>}
    </div>
  );
}
