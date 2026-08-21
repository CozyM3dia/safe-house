import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  CircleAlert,
  Loader2,
  MoveRight,
  ShieldCheck,
} from 'lucide-react';

import { getValidation } from '../services/api';
import { useT } from '../hooks/useTranslation';

/**
 * Halaman validasi historis — /validasi.
 *
 * Konsep visual: berkas bukti forensik. Fakta lapangan dan hitungan engine
 * disandingkan seperti dua kolom keterangan saksi; nomor arsip raksasa dan
 * kontur topografi menegaskan bahwa ini dokumen teknis, bukan marketing.
 * Semua angka datang dari backend (GET /api/validasi); halaman murni penyaji.
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
    <div className="rpt acd-grain document-scroll relative min-h-[100dvh] bg-bg text-text-primary">
      {/* Kontur topografi: latar yang menyiratkan pembacaan lahan. */}
      <TopoContours />

      <header className="sticky top-0 z-20 border-b backdrop-blur-md" style={{ borderColor: 'var(--rpt-line)', background: 'color-mix(in srgb, hsl(var(--safe-bg)) 82%, transparent)' }}>
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

      <main className="relative mx-auto w-full max-w-4xl px-4 pb-16 pt-10 sm:px-5 sm:pt-14">
        {/* ── Pembuka berkas ── */}
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div className="flex items-center gap-2">
            <span className="rpt-tick h-px w-6" />
            <p className="rpt-eyebrow">{t('validasi.eyebrow')}</p>
          </div>
          <h1 className="mt-4 max-w-2xl font-display text-[2.35rem] leading-[1.06] tracking-tight sm:text-5xl">
            {t('validasi.titleLine1')}{' '}
            <em className="italic text-accent">{t('validasi.titleEm')}</em>
            {t('validasi.titleLine2')}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-text-secondary">
            {t('validasi.subtitle')}
          </p>
        </motion.div>

        {state.status === 'loading' && (
          <div className="mt-14 flex items-center justify-center gap-2 text-sm text-text-muted" role="status" aria-live="polite">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('validasi.computing')}
          </div>
        )}

        {state.status === 'error' && (
          <div className="mt-14 flex flex-col items-center gap-2 text-center">
            <CircleAlert className="h-6 w-6 text-risk-moderate" />
            <p className="text-sm text-text-muted">{t('validasi.failed')}</p>
          </div>
        )}

        {state.status === 'ready' && state.data && (
          <>
            {/* ── Panel rekap: instrumen, bukan banner ── */}
            <RekapPanel data={state.data} />

            <div className="mt-12 space-y-6">
              {state.data.events.map((event, idx) => (
                <EventCard key={event.id} event={event} index={idx} />
              ))}
            </div>

            <footer className="mt-12 border-t pt-5" style={{ borderColor: 'var(--rpt-line)' }}>
              <p className="max-w-2xl text-[11px] leading-relaxed text-text-muted">
                {state.data.engine_note}
              </p>
              <div className="mt-8 rounded-none p-6 text-center rpt-surface">
                <h2 className="font-display text-xl">{t('validasi.ctaTitle')}</h2>
                <p className="mx-auto mt-1 mb-4 max-w-md text-sm text-text-secondary">
                  {t('validasi.ctaDesc')}
                </p>
                <Link
                  to="/app"
                  className="btn-press inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-bg transition-transform hover:-translate-y-px"
                >
                  {t('report.startAudit')} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </footer>
          </>
        )}
      </main>
    </div>
  );
}

/* ── Panel rekap ─────────────────────────────────────────────────────── */

function RekapPanel({ data }) {
  const t = useT();
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      className="rpt-surface mt-10 flex flex-col gap-5 rounded-none px-6 py-6 sm:flex-row sm:items-center sm:gap-8"
      aria-label={t('validasi.scoreRecap')}
    >
      <div className="flex items-baseline gap-1.5">
        <span className="font-display text-[4.2rem] leading-none text-accent">
          {data.matched}
        </span>
        <span className="font-display text-3xl leading-none text-text-muted">
          /{data.total}
        </span>
      </div>

      <div className="hidden self-stretch w-px sm:block" style={{ background: 'var(--rpt-line)' }} />

      <div className="min-w-0 flex-1">
        <p className="rpt-eyebrow">{t('validasi.scoreRecap')}</p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-text-secondary">
          {t('validasi.scoreLine')}
        </p>
        {/* Satu sel spesimen per kejadian — terisi bila cocok dengan fakta. */}
        <div className="mt-3 flex items-center gap-1.5">
          {data.events.map((event) => (
            <span
              key={event.id}
              title={`${event.site.name} — ${event.match ? t('validasi.match') : t('validasi.mismatch')}`}
              className="h-2.5 w-8 rounded-[2px]"
              style={{
                background: event.match ? 'rgba(16,185,129,0.75)' : 'rgba(239,68,68,0.75)',
              }}
            />
          ))}
          <span className="ml-2 font-data text-[9px] uppercase tracking-[0.18em] text-text-muted">
            {t('validasi.specimens')}
          </span>
        </div>
      </div>
    </motion.section>
  );
}

/* ── Kartu kejadian: dua kolom keterangan ────────────────────────────── */

function EventCard({ event, index }) {
  const t = useT();
  const reduced = useReducedMotion();
  const { event: meta, site, computed, expect, match } = event;
  const fault = computed.nearest_fault || {};
  const tone = match ? '#10b981' : '#ef4444';

  return (
    <motion.article
      initial={reduced ? false : { opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: Math.min(index * 0.06, 0.24) }}
      className="group relative overflow-hidden rounded-none border rpt-surface transition-colors"
      style={{ borderColor: 'var(--rpt-line)' }}
    >
      {/* Indeks arsip raksasa — garis tepi saja, seperti stensil berkas. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-5 right-3 select-none font-display text-[6.5rem] leading-none opacity-90 sm:text-[8rem]"
        style={{ WebkitTextStroke: '1px var(--rpt-line-strong)', color: 'transparent' }}
      >
        {String(index + 1).padStart(2, '0')}
      </span>

      {/* Garis status atas: hijau/merah sesuai verdict, memudar ke kanan. */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: `linear-gradient(to right, ${tone}99, transparent 70%)` }}
      />

      <div className="relative p-5 sm:p-6">
        {/* Kepala kartu */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pr-14 sm:pr-24">
          <div className="min-w-0">
            <p className="font-data text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
              {meta.date} · M{meta.magnitude}
            </p>
            <h3 className="mt-1 truncate font-display text-xl leading-snug">{meta.name}</h3>
            <p className="mt-0.5 font-data text-[10.5px] text-accent">{site.name}</p>
          </div>
          <VerdictStamp match={match} />
        </div>

        {/* Dua kolom keterangan */}
        <div className="mt-5 grid gap-5 sm:grid-cols-[1fr_auto_1fr] sm:gap-0">
          <div className="min-w-0 sm:pr-6">
            <ColumnLabel>{t('validasi.fieldFact')}</ColumnLabel>
            <p className="mt-2.5 text-[12.5px] leading-relaxed text-text-secondary">
              {meta.fact}
            </p>
            <p className="mt-3 inline-block border-t pt-1.5 font-data text-[9px] uppercase tracking-[0.16em] text-text-muted" style={{ borderColor: 'var(--rpt-line)' }}>
              {meta.source}
            </p>
          </div>

          <div className="relative hidden w-px sm:block" style={{ background: 'var(--rpt-line)' }}>
            <MoveRight aria-hidden className="absolute -left-[7px] top-0 h-3.5 w-3.5 rotate-45 text-text-muted opacity-60" />
          </div>

          <div className="min-w-0 sm:pl-6">
            <ColumnLabel>{t('validasi.engineNow')}</ColumnLabel>
            <dl className="rpt-well mt-2.5 grid grid-cols-2 gap-x-4 gap-y-3 rounded-md p-3.5">
              <Metric
                label="FS likuefaksi"
                value={computed.fs?.toFixed(2) ?? '—'}
                tone={computed.fs < 1 ? 'danger' : 'safe'}
                sub={computed.liquefaction_status}
              />
              <Metric
                label="Vs30"
                value={computed.vs30 ?? '—'}
                unit="m/s"
                sub={`${t('validasi.class')} ${computed.site_class}`}
              />
              <Metric
                label="PGA permukaan"
                value={computed.pga_surface?.toFixed(2) ?? '—'}
                unit="g"
              />
              <Metric
                label={t('validasi.nearestFault')}
                value={fault.distance_km != null ? fault.distance_km.toFixed(1) : '—'}
                unit="km"
                sub={fault.name}
              />
            </dl>

            <div className="mt-3 flex items-start gap-2.5 border-l-2 py-1 pl-3" style={{ borderColor: `${tone}66` }}>
              <div>
                <p className="font-data text-[9px] uppercase tracking-[0.16em] text-text-muted">
                  {t('validasi.expectation')}
                </p>
                <p className="mt-0.5 text-[12.5px] font-semibold text-text-primary">
                  {expect.label}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function ColumnLabel({ children }) {
  return (
    <p className="flex items-center gap-2">
      <span className="rpt-tick inline-block h-2.5 w-[3px]" />
      <span className="rpt-eyebrow">{children}</span>
    </p>
  );
}

function VerdictStamp({ match }) {
  const t = useT();
  const tone = match ? '#10b981' : '#ef4444';
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-sm px-2.5 py-1.5 font-data text-[9.5px] font-bold uppercase tracking-[0.16em]"
      style={{
        color: tone,
        border: `1px solid ${tone}59`,
        boxShadow: `inset 0 0 0 3px color-mix(in srgb, ${tone} 7%, transparent)`,
        background: `color-mix(in srgb, ${tone} 8%, transparent)`,
      }}
    >
      {match ? <BadgeCheck className="h-3 w-3" /> : <CircleAlert className="h-3 w-3" />}
      {match ? t('validasi.match') : t('validasi.mismatch')}
    </span>
  );
}

function Metric({ label, value, unit, sub, tone }) {
  const color = tone === 'danger' ? '#ef4444' : tone === 'safe' ? '#10b981' : undefined;
  return (
    <div className="min-w-0">
      <dt className="truncate text-[8.5px] font-bold uppercase tracking-[0.15em] text-text-muted">
        {label}
      </dt>
      <dd
        className="data-num mt-0.5 truncate font-data text-lg font-semibold tabular-nums"
        style={color ? { color } : undefined}
      >
        {value}
        {unit && <span className="ml-0.5 text-[10px] font-normal text-text-muted">{unit}</span>}
      </dd>
      {sub && <dd className="truncate font-data text-[9.5px] text-text-muted">{sub}</dd>}
    </div>
  );
}

/* ── Dekorasi: kontur topografi ──────────────────────────────────────── */

function TopoContours() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[560px] w-full max-w-5xl text-accent opacity-[0.07]"
      viewBox="0 0 900 560"
      fill="none"
      preserveAspectRatio="xMidYMin slice"
    >
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <path
          key={i}
          d={`M-40 ${120 + i * 62}
              C 140 ${60 + i * 58}, 260 ${190 + i * 52}, 430 ${140 + i * 56}
              S 720 ${50 + i * 64}, 940 ${150 + i * 54}`}
          stroke="currentColor"
          strokeWidth="1"
        />
      ))}
      {[0, 1, 2].map((i) => (
        <ellipse
          key={`e${i}`}
          cx={700 - i * 36}
          cy={210 + i * 26}
          rx={150 - i * 34}
          ry={64 - i * 13}
          stroke="currentColor"
          strokeWidth="1"
          transform={`rotate(${-14 + i * 4} ${700 - i * 36} ${210 + i * 26})`}
        />
      ))}
    </svg>
  );
}
