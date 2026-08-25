import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useLpInView } from '../../../hooks/useLpMotion';
import { SectionHeader } from './atoms';

/**
 * Pipeline audit, momen motion penjelas TERKUAT (mandat brief).
 * Alur: koordinat → penarikan sumber → hitung deterministik →
 * penjelasan AI → laporan. SVG/CSS ringan; sekali jalan saat masuk
 * viewport; state akhir selalu terbaca (reduced-motion = diagram statis
 * lengkap tanpa animasi, via CSS media query + flag di sini).
 *
 * Koreografi v2:
 * - Angka tiap node "pop" spring (stiffness 300 / damping 20) 0.8 → 1
 *   tepat saat tahapnya menyala.
 * - Garis progress SVG digambar PER SEGMEN (4 segmen antara 5 node),
 *   tiap segmen stroke-dashoffset 0.5s ease-out saat step-nya aktif.
 * - Deskripsi tiap tahap fade-in 300ms setelah node-nya aktif.
 */

// Pusat 5 kolom grid dinormalisasi ke viewBox 1000: 10/30/50/70/90%.
const NODE_X = [100, 300, 500, 700, 900];
const SEGMENT_LEN = NODE_X[1] - NODE_X[0];

export default function PipelineSection({ t }) {
  const { rootRef, inView } = useLpInView({ threshold: 0.35 });
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const timersRef = useRef([]);

  const steps = ['input', 'fetch', 'compute', 'ai', 'report'];

  // Koreografi: tiap tahap menyala berurutan lalu tetap (bukan loop).
  useEffect(() => {
    if (!inView) return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      // Semua tahap langsung aktif & terbaca (deferred: larangan setState sinkron di effect).
      const id = setTimeout(() => setStep(steps.length), 0);
      return () => clearTimeout(id);
    }
    steps.forEach((_, i) => {
      timersRef.current.push(setTimeout(() => setStep(i + 1), 500 + i * 850));
    });
    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  return (
    <section id="pipeline" ref={rootRef} className="lp-section" aria-labelledby="pipeline-title">
      <div className="lp-container">
        <SectionHeader
          align="center"
          eyebrow={t('pipelineEyebrow')}
          title={t('pipelineTitle')} titleId="pipeline-title"
          lead={t('pipelineLead')}
        />

        <div className="relative mx-auto mt-12 max-w-4xl">
          {/* Garis alur SVG: 4 segmen antar node, digambar bergantian */}
          <svg
            className="pointer-events-none absolute inset-x-0 top-7 hidden h-2 w-full md:block"
            viewBox="0 0 1000 8"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {[0, 1, 2, 3].map((seg) => {
              const x1 = NODE_X[seg];
              const x2 = NODE_X[seg + 1];
              // Segmen ke-seg menghubungkan node seg → seg+1; ia "aktif"
              // bersamaan dengan node tujuannya menyala (step >= seg+1).
              const drawn = step >= seg + 1;
              return (
                <g key={seg}>
                  {/* Rel dasar putus-putus */}
                  <line x1={x1} y1="4" x2={x2} y2="4" className="lp-flow-line" />
                  {/* Progress tembaga: digambar 0.5s ease-out per segmen */}
                  <line
                    x1={x1}
                    y1="4"
                    x2={x2}
                    y2="4"
                    stroke="var(--lp-copper-deep)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeDasharray={SEGMENT_LEN}
                    strokeDashoffset={drawn ? 0 : SEGMENT_LEN}
                    style={{ transition: 'stroke-dashoffset 0.5s cubic-bezier(0.22, 1, 0.36, 1)' }}
                  />
                </g>
              );
            })}
          </svg>

          {/* Lima tahap */}
          <ol className="grid gap-8 md:grid-cols-5 md:gap-3">
            {steps.map((s, i) => {
              const active = step > i;
              return (
                <li
                  key={s}
                  className={`flex flex-col items-center text-center ${inView ? 'lp-in' : 'lp-reveal'}`}
                  style={{ '--lp-delay': `${i * 110}ms` }}
                >
                  {/* Node */}
                  <span
                    className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-full border bg-[color:var(--lp-paper)] transition-all duration-700 ${
                      active
                        ? 'border-[color:var(--lp-copper-deep)] text-[color:var(--lp-copper-deep)] shadow-[0_0_0_5px_rgba(212,149,106,0.14)]'
                        : 'border-[color:var(--lp-line)] text-[color:var(--lp-taupe)]'
                    }`}
                  >
                    {/* Pop angka: spring framer, hanya di jalur beranimasi */}
                    <motion.span
                      className="inline-block font-[Azeret_Mono,ui-monospace,monospace] text-[13px]"
                      initial={reduce ? false : { scale: 0.8 }}
                      animate={{ scale: active || reduce ? 1 : 0.8 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </motion.span>
                  </span>

                  <h3
                    className={`mt-4 text-[0.95rem] font-bold tracking-tight transition-colors duration-700 ${
                      active ? 'text-[color:var(--lp-mocha)]' : 'text-[color:var(--lp-taupe)]'
                    }`}
                  >
                    {t(`pipeline${s.charAt(0).toUpperCase()}${s.slice(1)}Title`)}
                  </h3>

                  {/* Deskripsi: fade-in 300ms setelah node-nya menyala */}
                  <p
                    className={`mt-1.5 max-w-[24ch] text-[0.8rem] leading-relaxed text-[color:var(--lp-clay)] transition-all duration-300 ease-out ${
                      active ? 'translate-y-0 opacity-100 delay-300' : 'translate-y-1 opacity-0'
                    }`}
                  >
                    {t(`pipeline${s.charAt(0).toUpperCase()}${s.slice(1)}Desc`)}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Catatan kejujuran */}
        <p
          className={`mx-auto mt-12 max-w-[64ch] text-center text-[0.85rem] leading-relaxed text-[color:var(--lp-clay)] ${inView ? 'lp-in' : 'lp-reveal'}`}
          style={{ '--lp-delay': '600ms' }}
        >
          {t('pipelineNote')}
        </p>
      </div>
    </section>
  );
}
