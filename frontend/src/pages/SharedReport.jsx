import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, ShieldCheck, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';

import { getSharedReport } from '../services/api';
import { SafeScoreCard } from '../components/cards/SafeScoreCard';
import { RadarCard } from '../components/cards/RadarCard';
import { AddressCard } from '../components/cards/AddressCard';
import { useT } from '../hooks/useTranslation';

/**
 * Halaman audit publik — /laporan/:slug.
 *
 * Read-only. Menampilkan satu hasil audit yang dibagikan lewat tautan, dan
 * mengajak pengunjung membuat audit sendiri. Halaman ini adalah mesin upvote
 * kontes: hasil yang layak dibagikan menarik akun yang ikut memberi suara.
 */
export default function SharedReport() {
  const { slug } = useParams();
  const t = useT();
  const [state, setState] = useState({ status: 'loading', data: null, error: null });

  useEffect(() => {
    let alive = true;
    // Reset the async view when the route slug changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ status: 'loading', data: null, error: null });
    getSharedReport(slug)
      .then((data) => {
        if (!alive) return;
        // Judul dinamis untuk berbagi sosial dan tab peramban.
        if (data?.address) {
          document.title = `${t('report.locationAudit')} ${data.address.split(',')[0]} — S.A.F.E House`;
        }
        setState({ status: 'ready', data, error: null });
      })
      .catch((err) => {
        if (!alive) return;
        setState({ status: 'error', data: null, error: err.message });
      });
    return () => {
      alive = false;
    };
  }, [slug, t]);

  return (
    <div className="min-h-screen bg-bg text-text-primary">
      <header className="border-b border-[rgba(255,210,170,0.07)]">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-accent" />
            <span className="font-display text-sm font-bold tracking-tight">S.A.F.E House</span>
          </Link>
          <Link
            to="/app"
            className="btn-press inline-flex min-h-[44px] items-center rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-bg"
          >
            {t('report.createAudit')}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8">
        {state.status === 'loading' && (
          <div className="flex flex-col items-center justify-center py-24 text-text-muted">
            <Loader2 className="mb-3 h-6 w-6 animate-spin text-accent" />
            <p className="text-sm">{t('report.loading')}</p>
          </div>
        )}

        {state.status === 'error' && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <AlertTriangle className="mb-3 h-8 w-8 text-risk-moderate" />
            <h1 className="mb-1 font-display text-lg font-semibold">{t('report.notFound')}</h1>
            <p className="mb-6 max-w-sm text-sm text-text-muted">{state.error}</p>
            <Link
              to="/app"
              className="btn-press inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg"
            >
              {t('report.createOwn')} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {state.status === 'ready' && state.data && (
          <ReportBody property={state.data} />
        )}
      </main>
    </div>
  );
}

function ReportBody({ property }) {
  const t = useT();
  const g = property.geotech || {};
  const h = property.hazard || {};
  const fault = g.nearest_fault || {};

  return (
    <div className="flex flex-col gap-5">
      {/* Location header */}
      <div className="flex items-start gap-2">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
        <div>
          <h1 className="font-display text-lg font-semibold leading-tight">
            {t('report.locationAudit')}
          </h1>
          <p className="text-sm text-text-secondary">{property.address}</p>
          <p className="mt-0.5 font-data text-xs text-text-muted">
            {property.lat.toFixed(5)}, {property.lon.toFixed(5)}
          </p>
        </div>
      </div>

      <SafeScoreCard property={property} />

      <div>
        <SectionLabel>{t('report.riskAnalysis')}</SectionLabel>
        <RadarCard propertyA={property} />
      </div>

      {/* Key technical figures */}
      <div>
        <SectionLabel>{t('report.geotechSummary')}</SectionLabel>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Stat label={t('report.liquefactionFs')} value={g.fs} sub={g.status} />
          <Stat label={t('report.siteClass')} value={g.site_class} sub={g.vs30 ? `${g.vs30} m/s` : '—'} />
          <Stat label={t('report.designPga')} value={g.pga} sub={`Fa ${g.fa ?? '—'}`} />
          <Stat
            label={t('report.nearestFault')}
            value={fault.distance_km != null ? `${fault.distance_km} km` : '—'}
            sub={fault.name}
          />
          <Stat
            label={t('report.flood')}
            value={h.flood_label?.split(' ')[0] || '—'}
          />
          <Stat
            label={t('report.tsunami')}
            value={h.tsunami || '—'}
          />
        </div>
      </div>

      <div>
        <SectionLabel>{t('report.location')}</SectionLabel>
        <AddressCard property={property} />
      </div>

      {/* Honest note when data was missing */}
      {property.sources_failed?.length > 0 && (
        <p className="rounded-lg border border-[rgba(255,210,170,0.1)] bg-[rgba(255,210,170,0.03)] px-3 py-2 text-xs text-text-muted">
          {t('report.sourcesUnavailable')}
          ({property.sources_failed.join(', ')}). Angka terkait ditandai sebagai
          {' '}{t('report.unknownNotSafe')}
        </p>
      )}

      {property.audit_status && property.audit_status !== 'valid' && (
        <p className="rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-xs text-amber-300">
          Audit {property.audit_status}.
          {' '}{t('report.notFinal')}
        </p>
      )}

      {/* Upvote-loop CTA */}
      <div className="mt-2 rounded-2xl border border-accent/20 bg-accent/5 p-5 text-center">
        <h2 className="mb-1 font-display text-base font-semibold">
          {t('report.checkYourProperty')}
        </h2>
        <p className="mx-auto mb-4 max-w-md text-sm text-text-secondary">
          {t('report.ctaDescription')}
        </p>
        <Link
          to="/app"
          className="btn-press inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-bg"
        >
          {t('report.startAudit')} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <p className="pb-8 pt-2 text-center text-[11px] text-text-muted">
        {t('report.disclaimer')} InaRISK BNPB, USGS, Open-Meteo, PuSGeN.
      </p>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div className="mb-1.5 mt-1 flex items-center gap-2">
      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-muted">
        {children}
      </span>
      <div className="h-px flex-1 bg-gradient-to-r from-white/6 to-transparent" />
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-lg border border-[rgba(255,210,170,0.08)] bg-[rgba(22,14,8,0.6)] p-3">
      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-text-muted">{label}</p>
      <p className="mt-1 font-data text-lg font-semibold text-text-primary">{value ?? '—'}</p>
      {sub && <p className="truncate font-data text-[10px] text-text-muted">{sub}</p>}
    </div>
  );
}
