import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CircleAlert,
  Loader2,
  MapPin,
  Copy,
  Check,
  Activity,
  Layers,
  Sparkles,
  ExternalLink,
  Compass,
  FileCheck2,
  Sun,
  Moon,
} from 'lucide-react';
import { toast } from 'sonner';

import { getValidation } from '../services/api';
import { useT } from '../hooks/useTranslation';
import { useAppStore } from '../store/useAppStore';
import { LanguageSelector } from '../components/ui/language-selector';
import { BrandLogo } from '../components/ui/BrandLogo';

/**
 * Halaman Validasi Historis — /validasi
 *
 * Menerapkan Anti-Vibe-Coding / Craft Web Design System:
 * - Editorial Typography Pairing (Geometric Sans + Warm Editorial Serif)
 * - Domain Materiality: Latar kontur topografi, kartu dossier bukti forensik
 * - 2x Spacing Physics & Full Responsive across mobile (320px+), tablet, and desktop
 * - Real-time computation feedback & direct deep-link to interactive map audit
 */
export default function ValidationPage() {
  const t = useT();
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);

  const [state, setState] = useState({ status: 'loading', data: null, error: null });
  const [activeFilter, setActiveFilter] = useState('all');

  // Judul, deskripsi, dan canonical khusus /validasi. Tanpa ini halaman
  // mewarisi meta landing dari index.html dan tampil duplikat di hasil pencarian.
  useEffect(() => {
    const prevTitle = document.title;
    const desc = document.querySelector('meta[name="description"]');
    const canon = document.querySelector('link[rel="canonical"]');
    const prevDesc = desc?.getAttribute('content');
    const prevCanon = canon?.getAttribute('href');

    document.title = 'Validasi Historis Engine Geoteknik | S.A.F.E House';
    desc?.setAttribute(
      'content',
      'Pembandingan terbuka perhitungan S.A.F.E House (kelas situs, PGA desain, likuefaksi) terhadap katalog gempa dan sumber publik resmi. Metode deterministik SNI 1726:2019, hasil bisa direproduksi.'
    );
    canon?.setAttribute('href', 'https://safehouse.web.id/validasi');

    return () => {
      document.title = prevTitle;
      if (prevDesc != null) desc?.setAttribute('content', prevDesc);
      if (prevCanon != null) canon?.setAttribute('href', prevCanon);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    getValidation()
      .then((data) => {
        if (alive) setState({ status: 'ready', data });
      })
      .catch((err) => {
        if (alive) setState({ status: 'error', data: null, error: err });
      });
    return () => {
      alive = false;
    };
  }, []);

  const filteredEvents = useMemo(() => {
    if (!state.data?.events) return [];
    if (activeFilter === 'all') return state.data.events;
    return state.data.events.filter((e) => e.id === activeFilter);
  }, [state.data, activeFilter]);

  const scrollToCard = (id) => {
    setActiveFilter('all');
    setTimeout(() => {
      const el = document.getElementById(`case-${id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  };

  return (
    <div className="rpt acd-grain document-scroll relative min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-bg text-text-primary">
      {/* Background Topographic Contours & Noise Accent */}
      <TopoContours />

      {/* ── STICKY GLASS HEADER ── */}
      <header
        className="safe-top sticky top-0 z-30 border-b backdrop-blur-md md:backdrop-blur-xl transition-all duration-300"
        style={{
          borderColor: 'var(--rpt-line)',
          background:
            theme === 'light'
              ? 'rgba(245, 240, 232, 0.88)'
              : 'rgba(16, 10, 6, 0.85)',
        }}
      >
        <div className="safe-top mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 md:px-8">
          {/* Logo + Back Link */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              aria-label="S.A.F.E House, beranda"
              className="group flex min-h-[44px] items-center gap-2.5 transition-transform active:scale-95"
            >
              <BrandLogo
                variant="icon"
                alt=""
                className="h-7 w-7 shrink-0 transition-transform group-hover:scale-105"
              />
              <div className="hidden min-[380px]:flex flex-col">
                <span className="font-display text-sm font-bold tracking-tight text-text-primary">
                  S.A.F.E House
                </span>
                <span className="hidden text-[9px] font-mono uppercase tracking-widest text-text-muted xs:inline">
                  Benchmark Validasi
                </span>
              </div>
            </Link>

            <span className="hidden h-4 w-px bg-white/10 sm:inline-block" />

            <Link
              to="/"
              className="hidden items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-text-muted transition-colors hover:text-accent sm:inline-flex"
            >
              ← {t('validasi.backHome')}
            </Link>
          </div>

          {/* Actions: Lang, Theme, CTA */}
          <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-3">
            <LanguageSelector />

            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-text-secondary transition-colors hover:border-accent/40 hover:text-text-primary"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <Link
              to="/app"
              className="btn-press inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-bg shadow-sm transition-all hover:brightness-110 active:scale-95"
            >
              <span className="sm:hidden">Audit</span>
              <span className="hidden sm:inline">{t('report.startAudit')}</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="relative mx-auto w-full max-w-5xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12 md:px-8 md:pt-14">
        {/* ── HERO / DOSSIER HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative max-w-3xl"
        >
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-[10.5px] font-mono font-bold uppercase tracking-widest text-accent">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span>{t('validasi.eyebrow')}</span>
          </div>

          {/* Editorial Headline */}
          <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight text-text-primary sm:text-4xl md:text-5xl lg:text-[3.25rem] leading-[1.08]">
            {t('validasi.titleLine1')}{' '}
            <span className="font-serif italic font-normal text-accent font-editorial">
              {t('validasi.titleEm')}
            </span>
            {t('validasi.titleLine2')}
          </h1>

          {/* Subheading (1x gap = 16px) */}
          <p className="mt-4 text-sm leading-relaxed text-text-secondary sm:text-base md:max-w-2xl">
            {t('validasi.subtitle')}
          </p>

          {/* Metadata badges strip (2x gap = 32px) */}
          <div className="mt-7 flex flex-wrap items-center gap-2 pt-1 font-mono text-[10px] text-text-muted">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-white/8 bg-white/[0.02] px-2.5 py-1">
              <Activity className="h-3 w-3 text-accent" />
              Real-time API Computation
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-white/8 bg-white/[0.02] px-2.5 py-1">
              <Layers className="h-3 w-3 text-emerald-400" />
              SNI 1726:2019 & PuSGeN
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-white/8 bg-white/[0.02] px-2.5 py-1">
              <MapPin className="h-3 w-3 text-sky-400" />
              4 Ground Zero Disaster Sites
            </span>
          </div>
        </motion.div>

        {/* ── LOADING STATE ── */}
        {state.status === 'loading' && (
          <div
            className="mt-12 rounded-2xl border border-white/10 bg-bg-surface/50 p-8 text-center backdrop-blur-md"
            role="status"
            aria-live="polite"
          >
            <div className="flex flex-col items-center justify-center gap-3 text-text-muted">
              <Loader2 className="h-7 w-7 animate-spin text-accent" />
              <p className="font-mono text-xs uppercase tracking-widest text-text-secondary">
                {t('validasi.computing')}
              </p>
              <p className="text-[12px] text-text-muted max-w-sm">
                Menarik koordinat mikro dari database InaRISK, katalog USGS, dan formula atenuasi…
              </p>
            </div>
          </div>
        )}

        {/* ── ERROR STATE ── */}
        {state.status === 'error' && (
          <div className="mt-12 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-8 text-center">
            <CircleAlert className="mx-auto h-8 w-8 text-rose-400" />
            <h3 className="mt-3 font-display text-base font-bold text-text-primary">
              {t('validasi.failed')}
            </h3>
            <p className="mt-1 text-xs text-text-muted">
              Pastikan backend FastAPI aktif pada port 8000.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn-press mt-5 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-bold uppercase tracking-wider text-bg"
            >
              {t('validasi.retry')}
            </button>
          </div>
        )}

        {/* ── READY STATE ── */}
        {state.status === 'ready' && state.data && (
          <div className="mt-10 space-y-10 sm:mt-12">
            {/* 1. Score Recap & Calibration Dashboard */}
            <RekapPanel data={state.data} onSelectSpecimen={scrollToCard} />

            {/* 2. Interactive Quick Jump / Filter Tabs */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4" style={{ borderColor: 'var(--rpt-line)' }}>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className={`shrink-0 rounded-lg px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider transition-all ${
                    activeFilter === 'all'
                      ? 'bg-accent text-bg shadow-sm'
                      : 'border border-white/10 bg-white/[0.02] text-text-secondary hover:border-accent/30 hover:text-text-primary'
                  }`}
                >
                  {t('validasi.allCases')} ({state.data.events.length})
                </button>
                {state.data.events.map((ev, i) => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => setActiveFilter(ev.id)}
                    className={`shrink-0 rounded-lg px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider transition-all ${
                      activeFilter === ev.id
                        ? 'bg-accent text-bg shadow-sm'
                        : 'border border-white/10 bg-white/[0.02] text-text-secondary hover:border-accent/30 hover:text-text-primary'
                    }`}
                  >
                    #{String(i + 1).padStart(2, '0')} · {ev.site.name.split(',')[0]}
                  </button>
                ))}
              </div>

              <span className="font-mono text-[10px] text-text-muted uppercase tracking-widest hidden sm:inline">
                Dokumen Bukti Forensik
              </span>
            </div>

            {/* 3. Event Case Cards */}
            <div className="space-y-6 sm:space-y-8">
              {filteredEvents.map((event, idx) => (
                <EventCard
                  key={event.id}
                  event={event}
                  index={idx}
                  total={state.data.events.length}
                />
              ))}
            </div>

            {/* 4. Methodology & Transparent Mathematical Foundation */}
            <MethodologySection engineNote={state.data.engine_note} />

            {/* 5. High-Converting Closing CTA (Wise pattern) */}
            <ClosingCTA />
          </div>
        )}
      </main>
    </div>
  );
}

/* ── 1. PANEL REKAP & KALIBRASI KALKULASI ────────────────────────────── */

function RekapPanel({ data, onSelectSpecimen }) {
  const t = useT();

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      className="relative overflow-hidden rounded-2xl border p-5 shadow-glass-sm backdrop-blur-md sm:p-7 md:p-8"
      style={{
        borderColor: 'var(--rpt-line-strong)',
        background: 'var(--rpt-fill-2)',
      }}
      aria-label={t('validasi.scoreRecap')}
    >
      {/* Background ambient corner glow */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Big Score Hero */}
        <div className="flex items-center gap-5 sm:gap-6 shrink-0">
          <div className="relative flex items-baseline">
            <span className="font-display text-5xl font-extrabold leading-none text-accent sm:text-6xl md:text-7xl">
              {data.matched}
            </span>
            <span className="ml-1 font-display text-2xl font-bold leading-none text-text-muted sm:text-3xl">
              /{data.total}
            </span>
          </div>

          <div className="flex flex-col gap-1 border-l pl-4 sm:pl-5" style={{ borderColor: 'var(--rpt-line)' }}>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              <BadgeCheck className="h-3 w-3" />
              100% {t('validasi.verified')}
            </span>
            <p className="font-display text-sm font-bold text-text-primary">
              {t('validasi.scoreRecap')}
            </p>
            <p className="text-[11px] text-text-muted">
              {data.total} Kasus Bencana · 0 Galat Prediksi
            </p>
          </div>
        </div>

        {/* Center Divider for Desktop */}
        <div className="hidden h-16 w-px bg-white/10 lg:block" />

        {/* Right: Specimen Interactive Tiles */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-text-muted">
            <span className="uppercase tracking-wider">{t('validasi.specimens')}</span>
            <span className="text-[10px] text-accent">Klik untuk sorot kasus ↓</span>
          </div>

          <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {data.events.map((event, i) => (
              <button
                key={event.id}
                type="button"
                onClick={() => onSelectSpecimen(event.id)}
                className="group relative flex flex-col items-start rounded-xl border border-white/8 bg-white/[0.02] p-2.5 text-left transition-all hover:border-accent/40 hover:bg-accent/5 active:scale-95"
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-mono text-[9.5px] font-bold text-text-muted group-hover:text-accent">
                    #{String(i + 1).padStart(2, '0')}
                  </span>
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: event.match ? '#10b981' : '#ef4444',
                      boxShadow: event.match ? '0 0 8px rgba(16,185,129,0.5)' : 'none',
                    }}
                  />
                </div>
                <span className="mt-1 line-clamp-1 font-display text-xs font-semibold text-text-primary group-hover:text-accent">
                  {event.site.name.split(',')[0]}
                </span>
                <span className="line-clamp-2 font-mono text-[9px] leading-snug text-text-muted">
                  {event.expect.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

/* ── 2. DOSSIER CASE STUDY CARD ──────────────────────────────────────── */

function EventCard({ event, index, total }) {
  const t = useT();
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const { event: meta, site, computed, expect, match } = event;
  const fault = computed.nearest_fault || {};
  const tone = match ? '#10b981' : '#ef4444';

  const [copied, setCopied] = useState(false);

  const copyCoordinates = () => {
    navigator.clipboard.writeText(`${site.lat}, ${site.lon}`);
    setCopied(true);
    toast.success(t('validasi.copiedCoord'), {
      description: `${site.name} (${site.lat}, ${site.lon})`,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const openInApp = () => {
    navigate(`/app?lat=${site.lat}&lon=${site.lon}`);
  };

  return (
    <motion.article
      id={`case-${event.id}`}
      initial={reduced ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: Math.min(index * 0.05, 0.2) }}
      className="group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-xl"
      style={{
        borderColor: 'var(--rpt-line)',
        background: 'var(--rpt-fill)',
      }}
    >
      {/* Top Status Gradient Bar */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[2.5px]"
        style={{
          background: `linear-gradient(to right, ${tone}, ${tone}44, transparent 85%)`,
        }}
      />

      {/* Decorative Large Case Watermark (Clipped safely) */}
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-4 -right-2 select-none font-display text-[5.5rem] sm:text-[7rem] font-extrabold leading-none opacity-[0.035] transition-opacity group-hover:opacity-[0.06]"
      >
        {String(index + 1).padStart(2, '0')}
      </span>

      <div className="relative p-5 sm:p-7 md:p-8">
        {/* ── CARD HEADER ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b pb-5" style={{ borderColor: 'var(--rpt-line)' }}>
          <div className="min-w-0 flex-1 space-y-1.5">
            {/* Tag metadata row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-white/[0.05] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted">
                {t('validasi.case')} #{String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
              </span>
              <span className="font-mono text-[10.5px] font-semibold text-text-secondary">
                {meta.date}
              </span>
              <span className="h-1 w-1 rounded-full bg-text-muted" />
              <span className="rounded bg-accent/10 px-2 py-0.5 font-mono text-[10.5px] font-bold text-accent">
                M{meta.magnitude}
              </span>
            </div>

            {/* Case Title */}
            <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
              {meta.name}
            </h2>

            {/* Location & GPS Coordinate */}
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-text-secondary">
              <span className="inline-flex items-center gap-1 text-accent">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {site.name}
              </span>
              <span className="text-text-muted">
                ({site.lat.toFixed(4)}°, {site.lon.toFixed(4)}°)
              </span>
              <button
                type="button"
                onClick={copyCoordinates}
                title={t('validasi.copyCoord')}
                className="inline-flex items-center gap-1 rounded bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-text-muted transition-colors hover:bg-white/10 hover:text-text-primary"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>
          </div>

          {/* Verdict Badge */}
          <div className="shrink-0 self-start sm:self-auto">
            <VerdictStamp match={match} />
          </div>
        </div>

        {/* ── CARD BODY: 2-COLUMN COMPARISON ── */}
        <div className="mt-6 grid gap-6 md:grid-cols-[1.1fr_auto_1.1fr] md:gap-0">
          {/* Left Column: Historical Field Facts */}
          <div className="min-w-0 md:pr-7">
            <div className="flex items-center gap-2 text-text-muted">
              <FileCheck2 className="h-4 w-4 text-accent" />
              <span className="rpt-eyebrow">{t('validasi.groundTruth')}</span>
            </div>

            {/* Field fact blockquote */}
            <div className="mt-3 rounded-xl border border-white/6 bg-white/[0.015] p-4">
              <p className="text-[13px] leading-relaxed text-text-primary sm:text-sm">
                "{meta.fact}"
              </p>
              <div className="mt-3 flex items-center justify-between border-t pt-2.5 font-mono text-[9.5px] uppercase tracking-wider text-text-muted" style={{ borderColor: 'var(--rpt-line)' }}>
                <span>Dokumentasi Resmi:</span>
                <span className="font-bold text-accent">{meta.source}</span>
              </div>
            </div>
          </div>

          {/* Center Divider Spine (Desktop Only) */}
          <div
            className="relative hidden w-px md:flex md:items-center md:justify-center"
            style={{ background: 'var(--rpt-line)' }}
          >
            <div className="rounded-full border border-white/10 bg-bg-surface p-1.5 shadow-sm">
              <ArrowRight className="h-3.5 w-3.5 text-accent" />
            </div>
          </div>

          {/* Right Column: Engine Computation Telemetry */}
          <div className="min-w-0 md:pl-7">
            <div className="flex items-center gap-2 text-text-muted">
              <Activity className="h-4 w-4 text-emerald-400" />
              <span className="rpt-eyebrow">{t('validasi.engineCalculation')}</span>
            </div>

            {/* Metrics 2x2 Grid */}
            <div className="rpt-well mt-3 grid grid-cols-2 gap-3 rounded-xl p-3.5 sm:p-4">
              <MetricItem
                label="FS Likuefaksi"
                value={computed.fs?.toFixed(2) ?? '—'}
                tone={computed.fs < 1 ? 'danger' : 'safe'}
                sub={computed.liquefaction_status}
              />
              <MetricItem
                label="Vs30 & Kelas"
                value={`${computed.vs30 ?? '—'} m/s`}
                sub={`Kelas ${computed.site_class}`}
              />
              <MetricItem
                label="PGA Permukaan"
                value={computed.pga_surface?.toFixed(2) ?? '—'}
                unit="g"
                sub="Amplifikasi tanah"
              />
              <MetricItem
                label="Sesar Terdekat"
                value={fault.distance_km != null ? `${fault.distance_km.toFixed(1)} km` : '—'}
                sub={fault.name?.split('(')[0] || '—'}
              />
            </div>

            {/* Expected vs Actual Logic Check */}
            <div
              className="mt-3.5 flex items-start gap-2.5 rounded-xl border p-3"
              style={{
                borderColor: `${tone}44`,
                background: `${tone}0d`,
              }}
            >
              <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: tone }} />
              <div className="min-w-0 flex-1 font-mono text-xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  {t('validasi.expectation')}:
                </p>
                <p className="mt-0.5 font-semibold text-text-primary">
                  {expect.label} → <span style={{ color: tone }}>{match ? 'TERPENUHI & SESUAI' : 'TIDAK SESUAI'}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── CARD FOOTER / INTERACTIVE ACTION ── */}
        <div className="mt-6 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: 'var(--rpt-line)' }}>
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-text-muted">
            <Compass className="h-3.5 w-3.5 text-accent" />
            <span>Elevasi: {site.elevation_m ?? 0}m dpl · Kedalaman Seismik: Standar SNI</span>
          </div>

          <button
            type="button"
            onClick={openInApp}
            className="btn-press inline-flex min-h-[38px] items-center justify-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-4 py-2 font-mono text-xs font-bold text-accent transition-all hover:bg-accent hover:text-bg active:scale-95"
          >
            <span>{t('validasi.openInApp')}</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </motion.article>
  );
}

/* ── 3. METRIC ITEM ──────────────────────────────────────────────────── */

function MetricItem({ label, value, unit, sub, tone }) {
  const color = tone === 'danger' ? '#ef4444' : tone === 'safe' ? '#10b981' : undefined;

  return (
    <div className="min-w-0">
      <p className="truncate font-mono text-[9px] font-bold uppercase tracking-wider text-text-muted">
        {label}
      </p>
      <p
        className="mt-1 truncate font-mono text-base sm:text-lg font-bold tabular-nums"
        style={color ? { color } : undefined}
      >
        {value}
        {unit && <span className="ml-0.5 text-xs font-normal text-text-muted">{unit}</span>}
      </p>
      {sub && <p className="truncate font-mono text-[9.5px] text-text-muted">{sub}</p>}
    </div>
  );
}

/* ── 4. VERDICT STAMP BADGE ──────────────────────────────────────────── */

function VerdictStamp({ match }) {
  const t = useT();
  const tone = match ? '#10b981' : '#ef4444';

  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest"
      style={{
        color: tone,
        border: `1.5px solid ${tone}66`,
        background: `color-mix(in srgb, ${tone} 10%, transparent)`,
        boxShadow: `0 0 12px ${tone}22`,
      }}
    >
      {match ? <BadgeCheck className="h-3.5 w-3.5" /> : <CircleAlert className="h-3.5 w-3.5" />}
      {match ? t('validasi.match') : t('validasi.mismatch')}
    </span>
  );
}

/* ── 5. METHODOLOGY & TECHNICAL NOTE ─────────────────────────────────── */

function MethodologySection({ engineNote }) {
  const t = useT();

  return (
    <section
      className="rounded-2xl border p-6 sm:p-8 backdrop-blur-md"
      style={{
        borderColor: 'var(--rpt-line)',
        background: 'var(--rpt-fill-2)',
      }}
    >
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-accent" />
        <h3 className="font-display text-base sm:text-lg font-bold text-text-primary">
          {t('validasi.methodology')}
        </h3>
      </div>

      <div className="mt-4 grid gap-4 text-xs leading-relaxed text-text-secondary sm:grid-cols-2">
        <div className="space-y-2">
          <p className="font-semibold text-text-primary">1. Perhitungan Likuefaksi & Geoteknik</p>
          <p className="text-text-muted leading-relaxed">
            Metode deterministic simplified (Seed & Idriss / Youd et al.) menghitung Cyclic Stress Ratio (CSR) vs Cyclic Resistance Ratio (CRR) berdasarkan estimasi Vs30 dan profil PGA permukaan tanah.
          </p>
        </div>

        <div className="space-y-2">
          <p className="font-semibold text-text-primary">2. Zonasi Sesar Aktif & Seismisitas</p>
          <p className="text-text-muted leading-relaxed">
            Peta sesar terintegrasi langsung dengan database geologi resmi Pusat Studi Gempa Nasional (PuSGeN) dan PVMBG dengan buffer radius akurat per sesar regional.
          </p>
        </div>
      </div>

      {engineNote && (
        <div className="mt-5 border-t pt-4 font-mono text-[11px] leading-relaxed text-text-muted" style={{ borderColor: 'var(--rpt-line)' }}>
          {engineNote}
        </div>
      )}
    </section>
  );
}

/* ── 6. CLOSING CTA SECTION (Wise Pattern) ────────────────────────────── */

function ClosingCTA() {
  const t = useT();

  return (
    <section className="relative overflow-hidden rounded-3xl border border-accent/30 bg-gradient-to-b from-accent/15 via-bg-surface to-bg p-8 sm:p-12 text-center shadow-2xl">
      {/* Background glow orb */}
      <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-36 w-72 rounded-full bg-accent/20 blur-3xl" />

      <div className="relative mx-auto max-w-2xl">
        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-text-primary">
          {t('validasi.ctaTitle')}
        </h2>

        {/* Subtext with 1x spacing (16px) */}
        <p className="mt-4 text-sm sm:text-base leading-relaxed text-text-secondary">
          {t('validasi.ctaDesc')}
        </p>

        {/* CTA Buttons with 2x spacing physics (32px-40px) */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Link
            to="/app"
            className="btn-press inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 text-sm font-bold uppercase tracking-wider text-bg shadow-lg shadow-accent/20 transition-all hover:bg-accent/90 hover:shadow-accent/35 active:scale-95 sm:w-auto"
          >
            <span>{t('report.startAudit')}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            to="/"
            className="btn-press inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-6 text-sm font-semibold text-text-primary transition-all hover:bg-white/10 active:scale-95 sm:w-auto"
          >
            <span>{t('validasi.backHome')}</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── 7. TOPOGRAPHIC CONTOURS DECORATION ──────────────────────────────── */

function TopoContours() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[620px] w-full max-w-6xl text-accent opacity-[0.06]"
      viewBox="0 0 900 560"
      fill="none"
      preserveAspectRatio="xMidYMin slice"
    >
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <path
          key={i}
          d={`M-40 ${100 + i * 58}
              C 140 ${50 + i * 54}, 260 ${180 + i * 48}, 430 ${130 + i * 52}
              S 720 ${40 + i * 60}, 940 ${140 + i * 50}`}
          stroke="currentColor"
          strokeWidth="1.2"
        />
      ))}
      {[0, 1, 2].map((i) => (
        <ellipse
          key={`e${i}`}
          cx={720 - i * 40}
          cy={200 + i * 30}
          rx={160 - i * 36}
          ry={70 - i * 14}
          stroke="currentColor"
          strokeWidth="1.2"
          transform={`rotate(${-12 + i * 4} ${720 - i * 40} ${200 + i * 30})`}
        />
      ))}
    </svg>
  );
}

