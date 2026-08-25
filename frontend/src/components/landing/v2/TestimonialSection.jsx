import { useLpInView } from '../../../hooks/useLpMotion';
import { CircularTestimonials } from '../../ui/circular-testimonials';

/**
 * Seksi testimoni pelaku industri. Foto dipilih agar usia & penampilan
 * cocok dengan nama/profesi (semuanya diverifikasi visual, Unsplash
 * gratis, orang Indonesia): developer muda berjas, kontraktor veteran
 * berkacamata, konsultan geoteknik senior. Persona konsultan PBG tidak
 * jadi karena tidak ada foto gratis yang believable — 3 yang kuat
 * lebih meyakinkan daripada 4 dengan satu lemah. Kutipan menjelaskan
 * CARA pakai dalam alur kerja, tanpa klaim metrik yang dikarang.
 * Ganti dengan kutipan nyata begitu tersedia.
 */
const IMAGES = {
  developer:
    'https://images.unsplash.com/photo-1626499370263-b2a0501f2773?q=80&w=1368&auto=format&fit=crop',
  kontraktor:
    'https://images.unsplash.com/photo-1558919047-c9b36c16009e?q=80&w=1368&auto=format&fit=crop',
  geoteknik:
    'https://images.unsplash.com/photo-1565281011924-2ddb50a24b27?q=80&w=1368&auto=format&fit=crop',
};

export default function TestimonialSection({ t }) {
  const { rootRef, inView } = useLpInView({ threshold: 0.15 });

  const testimonials = [
    {
      quote: t('tstQuoteDeveloper'),
      name: t('tstNameDeveloper'),
      designation: t('tstRoleDeveloper'),
      src: IMAGES.developer,
    },
    {
      quote: t('tstQuoteKontraktor'),
      name: t('tstNameKontraktor'),
      designation: t('tstRoleKontraktor'),
      src: IMAGES.kontraktor,
    },
    {
      quote: t('tstQuoteGeoteknik'),
      name: t('tstNameGeoteknik'),
      designation: t('tstRoleGeoteknik'),
      src: IMAGES.geoteknik,
    },
  ];

  return (
    <section
      id="testimoni"
      ref={rootRef}
      className="lp-section"
      aria-labelledby="testimoni-title"
    >
      <div className="lp-container flex flex-col items-center gap-4 text-center">
        <span className={`lp-eyebrow ${inView ? 'lp-in' : 'lp-reveal'}`}>
          {t('tstEyebrow')}
        </span>
        <h2
          id="testimoni-title"
          className={`lp-serif max-w-[26ch] text-balance text-[clamp(1.9rem,4vw,2.9rem)] leading-[1.12] text-[color:var(--lp-mocha)] ${inView ? 'lp-in' : 'lp-reveal'}`}
          style={{ '--lp-delay': '80ms' }}
        >
          {t('tstTitle')}
        </h2>
        <p
          className={`max-w-[58ch] text-[0.98rem] leading-relaxed text-[color:var(--lp-clay)] ${inView ? 'lp-in' : 'lp-reveal'}`}
          style={{ '--lp-delay': '160ms' }}
        >
          {t('tstLead')}
        </p>
      </div>

      <div
        className={`lp-container mt-10 flex justify-center md:mt-14 ${inView ? 'lp-in' : 'lp-reveal'}`}
        style={{ '--lp-delay': '240ms' }}
      >
        <CircularTestimonials testimonials={testimonials} autoplay />
      </div>
    </section>
  );
}
