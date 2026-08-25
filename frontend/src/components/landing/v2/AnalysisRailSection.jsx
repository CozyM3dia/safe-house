import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useLpInView } from '../../../hooks/useLpMotion';
import { SectionHeader } from './atoms';
import { useSpotlight } from './motion';

/* Aset 3D dimuat lazy: chunk three.js hanya diunduh saat section masuk viewport */
const RailScene3D = lazy(() => import('./RailScene3D'));

/**
 * Rail lapisan analisis, adaptasi carousel channel Fernand.
 * - embla: drag sentuh + tombol prev/next (keyboard accessible, >=44px).
 * - Auto-advance pelan yang berhenti saat hover/fokus/interaksi pengguna
 *   dan mati total pada prefers-reduced-motion (gerak terus-menerus yang
 *   tak bisa dijeda itu tidak bisa diakses).
 * - Konten kartu: terminologi persis dari produk (COPY dict).
 *
 * Personalitas per kartu: tiap lapisan punya hue semantik sendiri
 * (satu keluarga dengan chip bahaya di BentoSection) + vignette
 * instrumen SVG yang hidup + readout mono ala kertas kerja.
 * Angka pada readout memakai sampel kanonik Bandar Lampung
 * (PGA 0,42 g · elevasi 91 mdpl · FS 2,00) dari COPY dict.
 */
export default function AnalysisRailSection({ t }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
    dragFree: true,
  });
  const { rootRef, inView } = useLpInView({ threshold: 0.25 });
  const [selected, setSelected] = useState(0);
  const [snapCount, setSnapCount] = useState(0);
  const pausedRef = useRef(false);
  const reducedRef = useRef(false);
  const spotA = useSpotlight();
  const spotB = useSpotlight();
  const spotC = useSpotlight();
  const spotD = useSpotlight();
  const spotE = useSpotlight();
  const spots = [spotA, spotB, spotC, spotD, spotE];

  const layers = [
    { key: 'Seismic', hue: 'seismic', tag: 'PuSGeN · USGS' },
    { key: 'Flood', hue: 'flood', tag: 'InaRISK BNPB · Open-Meteo' },
    { key: 'Liquefaction', hue: 'liquefaction', tag: 'Seed & Idriss · Vs30' },
    { key: 'Volcanic', hue: 'volcanic', tag: 'PVMBG KRB' },
    { key: 'Terrain', hue: 'terrain', tag: 'OpenStreetMap · SRTM' },
  ];

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return undefined;
    // Defer setState ke microtask: embla baru selesai inisialisasi di sini,
    // dan react-hooks melarang setState sinkron di badan effect.
    let alive = true;
    const id = setTimeout(() => {
      if (!alive) return;
      setSnapCount(emblaApi.scrollSnapList().length);
      onSelect();
    }, 0);
    emblaApi.on('select', onSelect);
    return () => {
      alive = false;
      clearTimeout(id);
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    reducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Auto-advance pelan: 4.2s, hanya saat rail terlihat & tidak dijeda.
  useEffect(() => {
    if (!emblaApi || !inView) return undefined;
    const id = setInterval(() => {
      if (reducedRef.current || pausedRef.current) return;
      emblaApi.scrollNext();
    }, 4200);
    return () => clearInterval(id);
  }, [emblaApi, inView]);

  const pause = () => {
    pausedRef.current = true;
  };
  const resume = () => {
    pausedRef.current = false;
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      emblaApi?.scrollPrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      emblaApi?.scrollNext();
    }
  };

  return (
    <section id="lapisan" ref={rootRef} className="lp-section" aria-labelledby="lapisan-title">
      <div className="lp-container">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeader
            eyebrow={t('railEyebrow')}
            title={t('railTitle')} titleId="lapisan-title"
            lead={t('railLead')}
          />
          {/* Kontrol eksplisit */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => emblaApi?.scrollPrev()}
              aria-label={t('railPrev')}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--lp-line)] bg-[color:var(--lp-paper)] text-[color:var(--lp-umber)] transition-all hover:border-[color:var(--lp-taupe)] hover:bg-[color:var(--lp-well)]"
            >
              <ArrowLeft size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => emblaApi?.scrollNext()}
              aria-label={t('railNext')}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--lp-line)] bg-[color:var(--lp-paper)] text-[color:var(--lp-umber)] transition-all hover:border-[color:var(--lp-taupe)] hover:bg-[color:var(--lp-well)]"
            >
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={emblaRef}
        className="lp-rail-viewport mt-10 cursor-grab active:cursor-grabbing"
        onMouseEnter={pause}
        onMouseLeave={resume}
        onFocusCapture={pause}
        onBlurCapture={resume}
        onKeyDown={onKeyDown}
        tabIndex={-1}
      >
        <div className="lp-rail-container px-[max(1.25rem,calc((100vw-1200px)/2+1.25rem))]">
          {layers.map((layer, i) => (
            <article
              key={layer.key}
              ref={spots[i].ref}
              onMouseMove={spots[i].onMouseMove}
              data-hue={layer.hue}
              className={`lp-rail-slide lp-rail-card lp-card lp-card-spot flex w-[min(84vw,320px)] flex-col p-6 transition-all duration-500 md:w-[320px] ${
                inView ? 'lp-in' : 'lp-reveal'
              }`}
              style={{ '--lp-delay': `${i * 80}ms` }}
            >
              <div className="flex items-center justify-between">
                <span className="lp-rail-num lp-num text-[11px]">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="rounded-full bg-[color:var(--lp-well)] px-2.5 py-1 font-[Azeret_Mono,ui-monospace,monospace] text-[9px] uppercase tracking-[0.14em] text-[color:var(--lp-clay)]">
                  {layer.tag}
                </span>
              </div>

              <div className="lp-rail-vign mt-4" aria-hidden="true">
                <LayerVignette hue={layer.hue} />
                {inView && (
                  <div className="lp-rail-scene">
                    <Suspense fallback={null}>
                      <RailScene3D variant={layer.hue} />
                    </Suspense>
                  </div>
                )}
                <span className="lp-rail-demo-badge lp-mono">
                  {t('railDemoBadge')}
                </span>
              </div>

              <DemoSteps
                steps={t(`rail${layer.key}Steps`)}
                hue={layer.hue}
                active={inView}
              />

              <h3 className="lp-serif mt-5 text-[1.45rem] leading-tight text-[color:var(--lp-mocha)]">
                {t(`rail${layer.key}Title`)}
              </h3>
              <p className="mt-2.5 text-[0.9rem] leading-relaxed text-[color:var(--lp-clay)]">
                {t(`rail${layer.key}Desc`)}
              </p>

              <div className="lp-rail-readout">
                <span className="lp-mono text-[9px] uppercase tracking-[0.14em] text-[color:var(--lp-taupe)]">
                  {t(`rail${layer.key}ReadLabel`)}
                </span>
                <span className="lp-rail-readval lp-num text-[12px]">
                  {t(`rail${layer.key}ReadValue`)}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Dots, indikator posisi, klik untuk lompat */}
      <div className="mt-6 flex items-center justify-center gap-2">
        {Array.from({ length: snapCount }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => emblaApi?.scrollTo(i)}
            aria-label={`${t('railGoTo')} ${i + 1}`}
            aria-current={selected === i}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              selected === i
                ? 'w-6 bg-[color:var(--lp-chestnut)]'
                : 'w-2.5 bg-[color:var(--lp-sand)] hover:bg-[color:var(--lp-taupe)]'
            }`}
          />
        ))}
      </div>
    </section>
  );
}

/* ── Narasi demo 3 langkah: chip menyala berurutan, loop pelan ─────────────
   Ini yang membuat orang paham: sumber → proses → hasil, satu baris. */
function DemoSteps({ steps, hue, active }) {
  const reduceRef = useRef(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    reduceRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    if (!active) return undefined;
    const reduce = reduceRef.current;
    const id = setInterval(() => {
      setStep((s) => (s + 1) % (steps.length + 1)); // +1 = jeda sejenak di akhir
    }, reduce ? 0 : 1700);
    if (reduce) setStep(steps.length - 1); // statis: semua langkah menyala
    return () => clearInterval(id);
  }, [active, steps.length]);

  return (
    <ol className="lp-rail-demo mt-4" data-hue={hue}>
      {steps.map((s, i) => (
        <li
          key={s}
          className={`lp-rail-demo-step ${i <= step ? 'lp-rail-demo-step--on' : ''}`}
        >
          <span className="lp-rail-demo-dot" aria-hidden="true" />
          {s}
        </li>
      ))}
    </ol>
  );
}

/* ── Vignette instrumen per lapisan (dekoratif, aria-hidden di induk) ────── */
function LayerVignette({ hue }) {
  if (hue === 'seismic') {
    return (
      <svg viewBox="0 0 280 92" preserveAspectRatio="xMidYMid meet">
        {[40, 80, 120, 160, 200, 240].map((x) => (
          <line key={x} x1={x} y1="14" x2={x} y2="78" stroke="var(--hue)" strokeOpacity="0.1" strokeWidth="1" />
        ))}
        <line x1="0" y1="46" x2="280" y2="46" stroke="var(--hue)" strokeOpacity="0.25" strokeWidth="1" strokeDasharray="2 4" />
        <path
          className="lp-anim-trace"
          pathLength="100"
          d="M0 46 H36 L44 34 L52 58 L60 22 L68 66 L76 38 L84 54 L92 46 H120 L126 40 L132 52 L138 46 H280"
          fill="none"
          stroke="var(--hue)"
          strokeWidth="1.6"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (hue === 'flood') {
    return (
      <svg viewBox="0 0 280 92" preserveAspectRatio="xMidYMid meet">
        <path d="M0 30 Q70 22 140 30 T280 30" fill="none" stroke="var(--hue)" strokeOpacity="0.18" strokeWidth="1" />
        <path d="M0 46 Q70 38 140 46 T280 46" fill="none" stroke="var(--hue)" strokeOpacity="0.28" strokeWidth="1" />
        <g className="lp-anim-water">
          <path d="M0 66 Q70 58 140 66 T280 66 V92 H0 Z" fill="var(--hue)" fillOpacity="0.16" />
          <path d="M0 66 Q70 58 140 66 T280 66" fill="none" stroke="var(--hue)" strokeWidth="1.5" />
        </g>
        <line x1="196" y1="42" x2="196" y2="64" stroke="var(--hue)" strokeOpacity="0.5" strokeWidth="1" strokeDasharray="2 3" />
        <circle cx="196" cy="38" r="3.2" fill="none" stroke="var(--hue)" strokeWidth="1.5" />
        <circle cx="196" cy="38" r="1.4" fill="var(--hue)" />
      </svg>
    );
  }
  if (hue === 'liquefaction') {
    return (
      <svg viewBox="0 0 280 92" preserveAspectRatio="xMidYMid meet">
        <rect x="0" y="8" width="280" height="20" fill="var(--hue)" fillOpacity="0.1" />
        <rect x="0" y="28" width="280" height="18" fill="var(--hue)" fillOpacity="0.2" />
        <rect x="0" y="46" width="280" height="16" fill="var(--hue)" fillOpacity="0.1" />
        <rect x="0" y="62" width="280" height="22" fill="var(--hue)" fillOpacity="0.24" />
        {[28, 46, 62].map((y) => (
          <line key={y} x1="0" y1={y} x2="280" y2={y} stroke="var(--hue)" strokeOpacity="0.3" strokeWidth="1" />
        ))}
        <g className="lp-anim-marker">
          <line x1="176" y1="8" x2="176" y2="84" stroke="var(--hue)" strokeWidth="1.5" strokeDasharray="3 3" />
          <circle cx="176" cy="46" r="3.2" fill="var(--hue)" />
        </g>
      </svg>
    );
  }
  if (hue === 'volcanic') {
    return (
      <svg viewBox="0 0 280 92" preserveAspectRatio="xMidYMid meet">
        <g fill="none" stroke="var(--hue)">
          <circle className="lp-anim-ring" cx="84" cy="46" r="16" strokeWidth="1.4" />
          <circle className="lp-anim-ring" cx="84" cy="46" r="30" strokeWidth="1.2" style={{ animationDelay: '1.05s' }} />
          <circle className="lp-anim-ring" cx="84" cy="46" r="44" strokeWidth="1" style={{ animationDelay: '2.1s' }} />
        </g>
        <path d="M72 54 L84 34 L96 54 Z" fill="var(--hue)" fillOpacity="0.85" />
        <line x1="92" y1="42" x2="194" y2="30" stroke="var(--hue)" strokeOpacity="0.5" strokeWidth="1" strokeDasharray="2 4" />
        <circle cx="200" cy="29" r="4" fill="none" stroke="var(--hue)" strokeWidth="1.5" />
        <circle cx="200" cy="29" r="1.6" fill="var(--hue)" />
      </svg>
    );
  }
  /* terrain */
  return (
    <svg viewBox="0 0 280 92" preserveAspectRatio="xMidYMid meet">
      <g fill="none" stroke="var(--hue)" strokeLinecap="round">
        <path className="lp-anim-contour" d="M-10 70 C40 40 90 78 140 58 S240 30 290 52" strokeWidth="1.2" strokeOpacity="0.22" />
        <path className="lp-anim-contour" d="M-10 54 C40 26 90 62 140 44 S240 18 290 38" strokeWidth="1.2" strokeOpacity="0.4" style={{ animationDelay: '-4s' }} />
        <path className="lp-anim-contour" d="M-10 38 C40 14 90 46 140 30 S240 8 290 24" strokeWidth="1.2" strokeOpacity="0.55" style={{ animationDelay: '-8s' }} />
      </g>
      <circle cx="150" cy="36" r="3" fill="var(--hue)" />
      <circle cx="150" cy="36" r="6.5" fill="none" stroke="var(--hue)" strokeOpacity="0.4" strokeWidth="1" />
    </svg>
  );
}
