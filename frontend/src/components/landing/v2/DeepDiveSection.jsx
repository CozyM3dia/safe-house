import { useLpInView } from '../../../hooks/useLpMotion';
import { ProductWindow } from './atoms';

/**
 * Deep-dive selang-seling, ritme alternating Figma.
 * Setiap blok: satu kemampuan + state app ASLI yang relevan.
 * Arah gambar selang-seling (kiri/kanan); di mobile gambar dulu.
 *
 * Animasi lokal (CSS di bawah, tidak menyentuh landing-v2.css):
 * - Bullet reveal berurutan per li (300/380/460ms).
 * - Garis kecil di depan li tumbuh scaleX 0→1 mengikuti delay li.
 * - "Guided zoom" pada screenshot jendela produk (1.05 → 1).
 */

/* Gaya lokal section ini — scoped via kelas .lp-dd-*, aman dikolokasi. */
const DEEPDIVE_STYLES = `
  /* Garis bukti kecil: tumbuh dari kiri saat li masuk */
  .lp .lp-dd-line {
    transform: scaleX(0);
    transform-origin: left center;
    transition: transform var(--lp-d-reveal) var(--lp-ease);
    transition-delay: var(--lp-delay, 0ms);
  }
  .lp li.lp-in .lp-dd-line {
    transform: scaleX(1);
  }

  /* Guided zoom pada screenshot jendela produk */
  .lp .lp-dd-zoom img {
    transform: scale(1.05);
    transform-origin: center;
    transition: transform 2200ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .lp .lp-dd-zoom.lp-in img {
    transform: scale(1);
  }

  /* Reduced motion: garis & zoom langsung final, tanpa gerak */
  @media (prefers-reduced-motion: reduce) {
    .lp .lp-dd-line,
    .lp li.lp-in .lp-dd-line {
      transform: none !important;
      transition: none !important;
    }
    .lp .lp-dd-zoom img,
    .lp .lp-dd-zoom.lp-in img {
      transform: none !important;
      transition: none !important;
    }
  }
`;

export default function DeepDiveSection({ t }) {
  const { rootRef, inView } = useLpInView({ threshold: 0.18 });

  const blocks = [
    { key: 'Seismic', img: '/landing/deep-seismic.jpg', flip: false },
    { key: 'Liquefaction', img: '/landing/deep-liquefaction.jpg', flip: true },
  ];

  return (
    <section id="deep-dive" ref={rootRef} className="lp-section" aria-labelledby="deep-title">
      <style>{DEEPDIVE_STYLES}</style>
      <div className="lp-container flex flex-col gap-[clamp(4rem,8vw,7rem)]">
        <h2 id="deep-title" className="sr-only">{t('deepTitle')}</h2>

        {blocks.map((b, i) => (
          <div
            key={b.key}
            className={`grid items-center gap-8 md:grid-cols-2 md:gap-14 ${b.flip ? 'md:[&>*:first-child]:order-2' : ''}`}
          >
            {/* Teks */}
            <div>
              <span className={`lp-eyebrow ${inView ? 'lp-in' : 'lp-reveal'}`} style={{ '--lp-delay': `${i * 80}ms` }}>
                {t(`deep${b.key}Eyebrow`)}
              </span>
              <h3
                className={`lp-serif mt-4 text-balance text-[clamp(1.6rem,3.2vw,2.4rem)] leading-[1.12] text-[color:var(--lp-mocha)] ${inView ? 'lp-in' : 'lp-reveal'}`}
                style={{ '--lp-delay': `${100 + i * 80}ms` }}
              >
                {t(`deep${b.key}Title`)}
              </h3>
              <p
                className={`mt-4 max-w-[52ch] text-[0.98rem] leading-[1.8] text-[color:var(--lp-umber)]/88 ${inView ? 'lp-in' : 'lp-reveal'}`}
                style={{ '--lp-delay': `${200 + i * 80}ms` }}
              >
                {t(`deep${b.key}Desc`)}
              </p>
              {/* Daftar bukti kecil — reveal berurutan per li */}
              <ul className="mt-6 flex flex-col gap-2.5">
                {[1, 2, 3].map((n) => (
                  <li
                    key={n}
                    className={`flex items-start gap-3 text-[0.9rem] leading-snug text-[color:var(--lp-clay)] ${inView ? 'lp-in' : 'lp-reveal'}`}
                    style={{ '--lp-delay': `${300 + (n - 1) * 80}ms` }}
                  >
                    <span className="lp-dd-line mt-[7px] h-1 w-4 shrink-0 bg-[color:var(--lp-sand)]" aria-hidden="true" />
                    <span>
                      <strong className="font-semibold text-[color:var(--lp-chestnut)]">
                        {t(`deep${b.key}Point${n}Label`)}
                      </strong>{' '}
                      {t(`deep${b.key}Point${n}Text`)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Gambar, jendela produk, masuk dengan kedalaman + guided zoom */}
            <div
              className={`lp-dd-zoom ${inView ? 'lp-in' : 'lp-reveal lp-reveal--window'}`}
              style={{ '--lp-delay': `${180 + i * 80}ms` }}
            >
              <ProductWindow title={t(`deep${b.key}WindowTitle`)}>
                <img
                  src={b.img}
                  width={1280}
                  height={800}
                  alt={t(`deep${b.key}ImgAlt`)}
                  loading="lazy"
                  decoding="async"
                  className="block h-auto w-full"
                />
              </ProductWindow>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
