import { useLpNavigate } from '../../../hooks/useLpNavigate';
import { ArrowUpRight } from 'lucide-react';
import { LandingLogoIcon } from './atoms';
import { useLpInView } from '../../../hooks/useLpMotion';

/**
 * Footer, treatment gelap compact ala Figma (satu-satunya area gelap
 * selain jendela produk). Hanya link yang benar-benar ada: /app,
 * /validasi, anchor section, email kontak. Tanpa daftar link alternatif
 * produk pihak lain (dilarang brief) dan tanpa klaim palsu.
 */
export default function LandingFooter({ t }) {
  const navigate = useLpNavigate();
  const { rootRef, inView } = useLpInView({ threshold: 0.2 });

  const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  const cols = [
    {
      title: t('footerColProduct'),
      links: [
        { label: t('footerStart'), action: () => navigate('/app') },
        { label: t('navShowcase'), action: () => go('showcase') },
        { label: t('footerSampleReport'), action: () => go('laporan-contoh') },
        { label: t('navFaq'), action: () => go('faq') },
      ],
    },
    {
      title: t('footerColEvidence'),
      links: [
        { label: t('footerValidation'), action: () => navigate('/validasi') },
        { label: t('navSources'), action: () => go('misi') },
        { label: t('footerPipeline'), action: () => go('pipeline') },
      ],
    },
  ];

  return (
    <footer ref={rootRef} className="lp-footer relative" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">{t('footerColProduct')}</h2>

      <div className="lp-container py-14 md:py-16">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
          {/* Brand + deskripsi */}
          <div>
            <div className="flex items-center gap-3">
              <LandingLogoIcon className="h-7 w-auto" />
              <span className="text-[0.95rem] font-bold tracking-tight text-[#f0e4cc]">
                S.A.F.E House
              </span>
            </div>
            <p className="mt-4 max-w-[42ch] text-[0.85rem] leading-relaxed text-[rgba(250,247,241,0.55)]">
              {t('footerDesc')}
            </p>
            <a
              href="mailto:halo@safehouse.web.id"
              className="group mt-4 inline-flex min-h-[44px] items-center gap-1.5 text-[0.85rem] font-medium"
            >
              <span className="relative">
                halo@safehouse.web.id
                {/* Underline scaleX origin-left saat hover/focus */}
                <span
                  aria-hidden="true"
                  className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-current transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100 group-focus-within:scale-x-100"
                />
              </span>
              <ArrowUpRight size={13} aria-hidden="true" />
            </a>
          </div>

          {/* Kolom link — reveal berurutan 90ms saat footer masuk viewport */}
          {cols.map((col, ci) => (
            <nav
              key={col.title}
              aria-label={col.title}
              className={inView ? 'lp-in' : 'lp-reveal'}
              style={{ '--lp-delay': `${120 + ci * 90}ms` }}
            >
              <p className="lp-mono text-[9px] text-[rgba(250,247,241,0.4)]">{col.title}</p>
              <ul className="mt-4 flex flex-col gap-1">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <button
                      type="button"
                      onClick={l.action}
                      className="min-h-[40px] w-full rounded-lg px-0 py-1 text-left text-[0.88rem] transition-colors"
                    >
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Bar bawah */}
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-[rgba(250,247,241,0.08)] pt-6 sm:flex-row sm:items-center">
          <p className="text-[0.78rem] text-[rgba(250,247,241,0.4)]">
            © 2026 S.A.F.E House · {t('footerContest')}
          </p>
          <p className="lp-mono max-w-[52ch] text-[8.5px] leading-relaxed text-[rgba(250,247,241,0.35)]">
            {t('footerDisclaimer')}
          </p>
        </div>
      </div>
    </footer>
  );
}
