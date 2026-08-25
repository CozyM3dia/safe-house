import { ArrowRight } from 'lucide-react';
import { useLpNavigate } from '../../../hooks/useLpNavigate';
import { useLpInView } from '../../../hooks/useLpMotion';

/**
 * Band metodologi, adaptasi "testimonial moment" Figma, TANPA testimoni
 * fiktif: pernyataan determinisme + tautan ke halaman /validasi yang nyata
 * (validasi terhadap sumber publik). Band kompak (~414px) sebagai napas.
 */
export default function MethodologyBand({ t }) {
  const { rootRef, inView } = useLpInView({ threshold: 0.3 });
  const navigate = useLpNavigate();

  return (
    <section id="metodologi" ref={rootRef} className="lp-band" aria-labelledby="metodologi-title">
      <div className="lp-container flex flex-col items-center gap-7 py-[clamp(3.5rem,7vw,5.5rem)] text-center">
        <span className={`lp-eyebrow ${inView ? 'lp-in' : 'lp-reveal'}`}>{t('methodEyebrow')}</span>

        <blockquote
          className={`lp-card-spot relative max-w-[46ch] overflow-hidden rounded-2xl p-8 md:p-10 ${inView ? 'lp-in' : 'lp-reveal'}`}
          style={{ '--lp-delay': '100ms' }}
        >
          <span className="lp-border-beam" aria-hidden="true" />
          <p
            id="metodologi-title"
            className="lp-serif text-balance text-[clamp(1.6rem,3.4vw,2.5rem)] leading-[1.18] text-[color:var(--lp-mocha)]"
          >
            {t('methodQuote')}
          </p>
        </blockquote>

        <p
          className={`max-w-[62ch] text-[0.95rem] leading-relaxed text-[color:var(--lp-clay)] ${inView ? 'lp-in' : 'lp-reveal'}`}
          style={{ '--lp-delay': '200ms' }}
        >
          {t('methodSupport')}
        </p>

        <button
          type="button"
          onClick={() => navigate('/validasi')}
          className={`lp-btn lp-btn--ghost ${inView ? 'lp-in' : 'lp-reveal'}`}
          style={{ '--lp-delay': '300ms' }}
        >
          {t('methodCta')}
          <ArrowRight size={15} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
