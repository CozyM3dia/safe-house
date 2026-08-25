import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, AlertTriangle } from 'lucide-react';

import { getSharedReport } from '../services/api';
import SniReport, { ReportSkeleton } from '../components/report/SniReport';
import { useT } from '../hooks/useTranslation';
import { getPublicSiteUrl, ogImageUrl } from '../lib/publicOrigin';

/**
 * Halaman audit publik — /laporan/:slug.
 *
 * Read-only. Menampilkan satu hasil audit yang dibagikan lewat tautan, dan
 * mengajak pengunjung membuat audit sendiri. Halaman ini adalah mesin upvote
 * kontes: hasil yang layak dibagikan menarik akun yang ikut memberi suara.
 *
 * Isinya kini memakai SniReport — komponen yang sama dengan drawer aplikasi
 * — sehingga laporan bersama tidak lagi menjadi versi "dasbor" yang berbeda
 * bahasa visualnya dari laporan lengkap.
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
          const alamat = data.address.split(',')[0];
          const judul =
            data.safe_score != null
              ? `S.A.F.E Score ${data.safe_score} — ${alamat}`
              : `${t('report.locationAudit')} ${alamat} — S.A.F.E House`;
          document.title = judul;
          const origin = getPublicSiteUrl();
          const pageUrl = `${origin}/laporan/${slug}`;
          // Pre-viewer yang menjalankan JS (Discord kadang) membaca meta ini;
          // crawler murni harus memukul /api/og/laporan/{slug} (Emergent
          // hanya mem-proxy /api/*; rewrite crawler Vercel tidak berlaku di sini).
          for (const [sel, content] of [
            ['meta[property="og:title"]', judul],
            ['meta[name="twitter:title"]', judul],
            ['link[rel="canonical"]', pageUrl],
            ['meta[property="og:url"]', pageUrl],
            ['meta[property="og:image"]', ogImageUrl(slug)],
            ['meta[name="twitter:image"]', ogImageUrl(slug)],
            [
              'meta[property="og:description"]',
              data.safe_score != null
                ? `S.A.F.E Score ${data.safe_score}/100 · audit SNI 1726:2019 dari satu koordinat — S.A.F.E House`
                : undefined,
            ],
          ]) {
            if (!content) continue;
            const attr = sel.startsWith('link') ? 'href' : 'content';
            document.querySelector(sel)?.setAttribute(attr, content);
          }
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
    <div className="report-page min-h-[100dvh] bg-bg text-text-primary">
      <header className="border-b border-[rgba(255,210,170,0.07)]">
        <div className="safe-top mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 pb-3 sm:px-5 sm:pb-4 lg:max-w-5xl">
          {/* Tautan ini setinggi barisnya saja (20px) — di bawah ambang target
              sentuh, padahal ia satu-satunya jalan kembali ke beranda. */}
          <Link to="/" className="flex min-h-[44px] items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-accent" />
            <span className="font-display text-sm font-bold tracking-tight">S.A.F.E House</span>
          </Link>
          <Link
            to="/app"
            className="btn-press inline-flex min-h-[44px] shrink-0 items-center rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-bg"
          >
            {t('report.createAudit')}
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl min-w-0 px-4 py-8 sm:px-5 sm:py-10 lg:max-w-5xl">
        {state.status === 'loading' && (
          <div className="py-4">
            <ReportSkeleton label={t('report.loading')} />
          </div>
        )}

        {state.status === 'error' && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <AlertTriangle className="mb-3 h-8 w-8 text-risk-moderate" />
            <h1 className="mb-1 font-display text-lg font-semibold">
              {/penyimpanan|DATABASE_URL|storage/i.test(state.error || '')
                ? t('report.storageDown')
                : t('report.notFound')}
            </h1>
            <p className="mb-6 max-w-sm text-sm text-text-muted">
              {/penyimpanan|DATABASE_URL|storage/i.test(state.error || '')
                ? t('report.storageDownDetail')
                : state.error}
            </p>
            <Link
              to="/app"
              className="btn-press inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg"
            >
              {t('report.createOwn')} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {state.status === 'ready' && state.data && (
          <div className="flex flex-col gap-8">
            <SniReport property={state.data} />

            {/* Upvote-loop CTA */}
            <div className="rounded-2xl border border-accent/20 bg-accent/5 p-6 text-center sm:p-8">
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

            <p className="pb-4 text-center text-[11px] leading-relaxed text-text-muted">
              {t('report.disclaimer')} InaRISK BNPB, USGS, Open-Meteo, PuSGeN.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
