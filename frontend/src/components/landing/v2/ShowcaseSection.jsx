import { useLpInView } from '../../../hooks/useLpMotion';
import { SectionHeader, ProductWindow } from './atoms';

/**
 * Showcase utama, section produk dominan ala Figma.
 * Screenshot hasil audit ASLI (Bandar Lampung 65 SEDANG) + callout
 * anotasi di LUAR screenshot (garis penunjuk dari sisi kiri/kanan)
 * sehingga bukti tetap tak tersentuh dan tetap terbaca.
 *
 * Animasi lokal (CSS di bawah, tidak menyentuh landing-v2.css):
 * - Callout stagger berurutan atas→bawah (420/560/700/840ms).
 * - "Guided zoom": screenshot scale 1.06 → 1 saat masuk viewport.
 * - Dot callout berdenyut halus (reduced-motion dimatikan).
 */

/* Gaya lokal section ini — scoped via kelas .lp-show-*, aman dikolokasi. */
const SHOWCASE_STYLES = `
  /* Guided zoom pada screenshot: hidup saat section masuk viewport */
  .lp .lp-show-zoom img {
    transform: scale(1.06);
    transform-origin: center;
    transition: transform 2200ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .lp .lp-show-zoom.lp-in img {
    transform: scale(1);
  }

  /* Denyut halus dot callout */
  @keyframes lp-dot-pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.45); opacity: 0.65; }
  }
  .lp .lp-callout-dot {
    animation: lp-dot-pulse 2.6s cubic-bezier(0.32, 0.72, 0, 1) infinite;
  }

  /* Reduced motion: zoom & pulse dimatikan total */
  @media (prefers-reduced-motion: reduce) {
    .lp .lp-show-zoom img,
    .lp .lp-show-zoom.lp-in img {
      transform: none !important;
      transition: none !important;
    }
    .lp .lp-callout-dot {
      animation: none !important;
    }
  }
`;

export default function ShowcaseSection({ t }) {
  const { rootRef, inView } = useLpInView({ threshold: 0.15 });

  const callouts = [
    { key: 'Score', side: 'left', top: '18%', delay: 420 },
    { key: 'Vs30', side: 'right', top: '34%', delay: 560 },
    { key: 'Flood', side: 'right', top: '58%', delay: 700 },
    { key: 'Sources', side: 'left', top: '76%', delay: 840 },
  ];

  return (
    <section id="showcase" ref={rootRef} className="lp-section" aria-labelledby="showcase-title">
      <style>{SHOWCASE_STYLES}</style>
      <div className="lp-container">
        <SectionHeader
          align="center"
          eyebrow={t('showcaseEyebrow')}
          title={t('showcaseTitle')} titleId="showcase-title"
          lead={t('showcaseLead')}
        />

        <div className="relative mx-auto mt-12 max-w-5xl">
          {/* Callout kiri */}
          <div className="pointer-events-none absolute -left-2 top-0 hidden h-full w-56 -translate-x-full lg:block" aria-hidden="true">
            {callouts
              .filter((c) => c.side === 'left')
              .map((c) => (
                <div
                  key={c.key}
                  className={`absolute right-8 flex w-44 items-center gap-3 ${inView ? 'lp-in' : 'lp-reveal'}`}
                  style={{ top: c.top, '--lp-delay': `${c.delay}ms` }}
                >
                  <div className="flex-1 text-right">
                    <p className="lp-mono text-[9px] text-[color:var(--lp-taupe)]">{t(`callout${c.key}Tag`)}</p>
                    <p className="mt-1 text-[0.82rem] font-semibold leading-snug text-[color:var(--lp-chestnut)]">
                      {t(`callout${c.key}Title`)}
                    </p>
                  </div>
                  <span className="h-px w-8 bg-[color:var(--lp-taupe)]" />
                  <span className="lp-callout-dot h-1.5 w-1.5 rounded-full bg-[color:var(--lp-copper)]" />
                </div>
              ))}
          </div>

          {/* Callout kanan */}
          <div className="pointer-events-none absolute -right-2 top-0 hidden h-full w-56 translate-x-full lg:block" aria-hidden="true">
            {callouts
              .filter((c) => c.side === 'right')
              .map((c) => (
                <div
                  key={c.key}
                  className={`absolute left-8 flex w-44 items-center gap-3 ${inView ? 'lp-in' : 'lp-reveal'}`}
                  style={{ top: c.top, '--lp-delay': `${c.delay}ms` }}
                >
                  <span className="lp-callout-dot h-1.5 w-1.5 rounded-full bg-[color:var(--lp-copper)]" />
                  <span className="h-px w-8 bg-[color:var(--lp-taupe)]" />
                  <div className="flex-1">
                    <p className="lp-mono text-[9px] text-[color:var(--lp-taupe)]">{t(`callout${c.key}Tag`)}</p>
                    <p className="mt-1 text-[0.82rem] font-semibold leading-snug text-[color:var(--lp-chestnut)]">
                      {t(`callout${c.key}Title`)}
                    </p>
                  </div>
                </div>
              ))}
          </div>

          {/* Jendela produk, screenshot ASLI, tak diwarnai + guided zoom */}
          <div className={`lp-show-zoom ${inView ? 'lp-in' : 'lp-reveal lp-reveal--window'}`}>
            <ProductWindow title={t('showcaseWindowTitle')}>
              <img
                src="/landing/showcase-result.jpg"
                width={1600}
                height={900}
                alt={t('showcaseImgAlt')}
                loading="lazy"
                decoding="async"
                className="block h-auto w-full"
              />
            </ProductWindow>
          </div>

          {/* Legenda bukti */}
          <figcaption
            className={`lp-mono mx-auto mt-5 flex max-w-3xl flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-center text-[9.5px] text-[color:var(--lp-taupe)] ${inView ? 'lp-in' : 'lp-reveal'}`}
            style={{ '--lp-delay': '700ms' }}
          >
            <span>{t('showcaseCaptionScenario')}</span>
            <span aria-hidden="true">·</span>
            <span>{t('showcaseCaptionValues')}</span>
          </figcaption>
        </div>
      </div>
    </section>
  );
}
