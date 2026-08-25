import { memo, useCallback, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { BadgeCheck } from 'lucide-react';
import { EASE } from './motion';
import { useLpInView } from '../../../hooks/useLpMotion';

/**
 * Misi — "Register & Stamp", koreografi satu arah + siklus sorotan.
 *
 * Timeline masuk viewport (sekali jalan; SEMUA langkah nol durasi saat
 * prefers-reduced-motion):
 *   0.10s  baris register ber-stagger; garis pemimpin menggambar diri
 *   0.00s  lembar dokumen diletakkan (spring cepat, settle ~0.8s)
 *   0.40s  nilai parameter naik dari balik mask
 *   0.45s  tab meluncur turun
 *   1.45s  cap menghentak masuk — beat utama, TUNGGU semua tenang dulu
 *   1.52s  dokumen terguncang + terhimpit 0.3% seketika saat cap mendarat
 *   1.90s  sorotan "diarmed" — baris & isian mulai menyala, siklus jalan
 *
 * Siklus sorotan 3.2s: pause terpisah untuk hover (hanya perangkat
 * hover) dan fokus keyboard; klik manual me-reset interval via `epoch`.
 */

const SOURCES = [
  { id: 'pusgen', num: '01', name: 'PuSGeN', tagKey: 'missionSrcTagPusgen', mxKey: 'missionSrcMxPusgen' },
  { id: 'usgs', num: '02', name: 'USGS', tagKey: 'missionSrcTagUsgs', mxKey: 'missionSrcMxUsgs' },
  { id: 'pvmbg', num: '03', name: 'PVMBG', tagKey: 'missionSrcTagPvmbg', mxKey: 'missionSrcMxPvmbg' },
  { id: 'inarisk', num: '04', name: 'InaRISK BNPB', tagKey: 'missionSrcTagInarisk', mxKey: 'missionSrcMxInarisk' },
  { id: 'bmkg', num: '05', name: 'BMKG', tagKey: 'missionSrcTagBmkg', mxKey: 'missionSrcMxBmkg' },
];

const FIELDS = [
  { key: 'pga', labelKey: 'missionPgaLabel', valKey: 'missionPgaVal', subKey: 'missionPgaSub', srcNums: ['01', '02'] },
  { key: 'site', labelKey: 'missionSiteLabel', valKey: 'missionSiteVal', subKey: 'missionSiteSub', srcNums: ['03'] },
  { key: 'fs', labelKey: 'missionFsLabel', valKey: 'missionFsVal', subKey: 'missionFsSub', srcNums: ['05'] },
  { key: 'flood', labelKey: 'missionFloodLabel', valKey: 'missionFloodVal', subKey: 'missionFloodSub', srcNums: ['04', '05'] },
];

const STEP_MS = 3200;
const ARMED_MS = 1900;
const ROW_STAGGER = 0.07;
const LEADER_BASE = 0.35;
const STAMP_DELAY = 1.45;
const JOLT_DELAY = 1.52;

const INSTANT = { duration: 0 };

const canHover =
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(hover: hover)').matches
    : false;

const listV = (reduce) =>
  reduce
    ? { hidden: {}, show: {} }
    : { hidden: {}, show: { transition: { staggerChildren: ROW_STAGGER, delayChildren: 0.1 } } };

const rowV = (reduce) =>
  reduce
    ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } }
    : {
        hidden: { opacity: 0, y: 18 },
        show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } },
      };

const leaderV = (reduce) =>
  reduce
    ? { hidden: { scaleX: 1 }, show: { scaleX: 1 } }
    : {
        hidden: { scaleX: 0 },
        show: (i) => ({
          scaleX: 1,
          transition: { duration: 0.7, ease: EASE, delay: LEADER_BASE + i * ROW_STAGGER },
        }),
      };

const Row = memo(function Row({ s, i, isActive, inView, reduce, onPick, t }) {
  return (
    <motion.li variants={rowV(reduce)} className="lp-msn-rowli">
      <button
        type="button"
        onClick={() => onPick(i)}
        aria-current={isActive ? 'true' : undefined}
        className={`lp-msn-row ${isActive ? 'is-active' : ''}`}
      >
        <span className="lp-msn-idx">{s.num}</span>
        <span className="lp-msn-rowmain">
          <span className="lp-msn-name lp-serif">{s.name}</span>
          <span className="lp-msn-tag">{t(s.tagKey)}</span>
        </span>
        <motion.span
          className="lp-msn-leader"
          aria-hidden="true"
          variants={leaderV(reduce)}
          custom={i}
          style={{ originX: 0, y: '-0.3em' }}
          initial={undefined}
          animate={inView || reduce ? 'show' : 'hidden'}
        />
        <span className="lp-msn-mx">{t(s.mxKey)}</span>
        <span className="lp-msn-arrow" aria-hidden="true">
          →
        </span>
      </button>
    </motion.li>
  );
});

export default function MissionSection({ t }) {
  const { rootRef, inView } = useLpInView({ threshold: 0.15 });
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [armed, setArmed] = useState(false);
  const [hoverPause, setHoverPause] = useState(false);
  const [focusPause, setFocusPause] = useState(false);
  const [epoch, setEpoch] = useState(0);

  const paused = hoverPause || focusPause;

  useEffect(() => {
    if (!inView) return undefined;
    if (reduce) {
      setArmed(true);
      return undefined;
    }
    const id = setTimeout(() => setArmed(true), ARMED_MS);
    return () => clearTimeout(id);
  }, [inView, reduce]);

  useEffect(() => {
    if (!inView || !armed || paused || reduce) return undefined;
    const id = setInterval(() => setActive((a) => (a + 1) % SOURCES.length), STEP_MS);
    return () => clearInterval(id);
  }, [inView, armed, paused, reduce, epoch]);

  const pick = useCallback((i) => {
    setActive(i);
    setEpoch((e) => e + 1);
  }, []);

  return (
    <section id="misi" className="lp-section" aria-labelledby="misi-title">
      <div className="lp-container">
        <div className="flex items-start justify-between gap-6">
          <div className="max-w-[44rem]">
            <span className="lp-eyebrow">{t('missionEyebrow')}</span>
            <h2
              id="misi-title"
              className="lp-serif mt-5 text-balance text-[clamp(1.9rem,3.8vw,2.9rem)] leading-[1.1] text-[color:var(--lp-mocha)]"
            >
              {t('missionTitle')}
            </h2>
            <p className="mt-4 text-[1rem] leading-relaxed text-[color:var(--lp-clay)]">{t('missionLead')}</p>
          </div>
          <span className="lp-msn-folio mt-2 hidden shrink-0 md:block" aria-hidden="true">
            ARSP/TNH · LAMP 03
          </span>
        </div>

        <div
          ref={rootRef}
          className="lp-msn-grid mt-12 md:mt-16"
          onMouseEnter={canHover ? () => setHoverPause(true) : undefined}
          onMouseLeave={canHover ? () => setHoverPause(false) : undefined}
          onFocus={(e) => {
            try {
              if (e.target.matches(':focus-visible')) setFocusPause(true);
            } catch {
              setFocusPause(true); // engine lawas tanpa :focus-visible → anggap keyboard
            }
          }}
          onBlur={() => setFocusPause(false)}
        >
          {/* Register arsip */}
          <motion.div
            className="lp-msn-register"
            variants={listV(reduce)}
            initial={reduce ? false : 'hidden'}
            animate={inView || reduce ? 'show' : 'hidden'}
          >
            <span className="lp-msn-col-label">{t('missionSourcesLabel')}</span>
            <ul className="lp-msn-rows">
              {SOURCES.map((s, i) => (
                <Row
                  key={s.id}
                  s={s}
                  i={i}
                  t={t}
                  reduce={reduce}
                  inView={inView}
                  isActive={armed && i === active}
                  onPick={pick}
                />
              ))}
            </ul>
          </motion.div>

          {/* Lembar laporan */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 56, rotate: 1.4 }}
            animate={inView ? { opacity: 1, y: 0, rotate: 0 } : undefined}
            transition={reduce ? INSTANT : { type: 'spring', stiffness: 150, damping: 21 }}
            className="lp-msn-docwrap"
          >
            <motion.div
              className="lp-msn-doc"
              initial={false}
              animate={inView && !reduce ? { y: [0, 2.5, -0.4, 0], scale: [1, 0.997, 1] } : undefined}
              transition={{
                delay: JOLT_DELAY,
                duration: 0.5,
                times: [0, 0.2, 0.5, 1],
                ease: ['easeIn', 'easeOut', 'easeOut'],
              }}
            >
              <motion.span
                className="lp-msn-tab"
                initial={reduce ? false : { y: -26, opacity: 0 }}
                animate={inView ? { y: 0, opacity: 1 } : undefined}
                transition={reduce ? INSTANT : { delay: 0.45, duration: 0.6, ease: EASE }}
              >
                {t('missionReadyTag')}
              </motion.span>

              <div className="lp-msn-doc-head">
                <span className="lp-msn-doc-title">{t('missionCardTitle')}</span>
              </div>

              {FIELDS.map((f, i) => {
                const isHot = armed && f.srcNums.includes(SOURCES[active].num);
                return (
                  <div key={f.key} className={`lp-msn-field ${isHot ? 'is-hot' : ''}`}>
                    <span className="lp-msn-field-label">{t(f.labelKey)}</span>
                    <div className="lp-msn-field-body">
                      <span className="lp-msn-field-mask">
                        <motion.span
                          className="lp-msn-field-value lp-serif"
                          initial={reduce ? false : { y: '112%' }}
                          animate={inView ? { y: '0%' } : undefined}
                          transition={reduce ? INSTANT : { duration: 0.75, ease: EASE, delay: 0.4 + i * 0.09 }}
                        >
                          {t(f.valKey)}
                          <span className="lp-msn-field-refs">
                            {f.srcNums.map((n) => (
                              <sup key={n} className={armed && n === SOURCES[active].num ? 'is-on' : ''} aria-label={n}>
                                {n}
                              </sup>
                            ))}
                          </span>
                        </motion.span>
                      </span>
                      <span className="lp-msn-field-sub">{t(f.subKey)}</span>
                    </div>
                  </div>
                );
              })}

              <div className="lp-msn-doc-foot">
                <BadgeCheck size={15} strokeWidth={1.8} aria-hidden="true" />
                <span>{t('missionCardFoot')}</span>
                <span className="lp-msn-doc-manual">{t('missionManual')}</span>
              </div>

              {/* Cap: beat utama, menunggu semua tenang lalu menghentak */}
              <motion.span
                className="lp-msn-stamp"
                aria-hidden="true"
                initial={reduce ? false : { opacity: 0, scale: 2.3, rotate: -26 }}
                animate={inView ? { opacity: 0.92, scale: 1, rotate: -9 } : undefined}
                transition={reduce ? INSTANT : { delay: STAMP_DELAY, type: 'spring', stiffness: 420, damping: 15, mass: 1 }}
              >
                {t('missionStampText')}
                <small>SNI 1726:2019</small>
              </motion.span>
            </motion.div>
          </motion.div>
        </div>

        {/* Pull-quote — folio penutup */}
        <blockquote
          className={`relative mt-16 pl-10 md:mt-20 md:pl-14 ${inView ? 'lp-in' : 'lp-reveal'}`}
          style={{ '--lp-delay': '420ms' }}
        >
          <span
            className="lp-serif pointer-events-none absolute -top-3 left-0 select-none text-[3.4rem] leading-none text-[color:var(--lp-taupe)] md:-top-5 md:text-[4.2rem]"
            aria-hidden="true"
          >
            &ldquo;
          </span>
          <p className="lp-serif max-w-[40rem] text-[clamp(1.35rem,2.6vw,1.85rem)] italic leading-[1.45] text-[color:var(--lp-chestnut)]">
            {t('missionQuote')}
          </p>
          <cite className="lp-mono mt-4 flex items-center gap-3 text-[10px] not-italic text-[color:var(--lp-taupe)]">
            <span className="inline-block h-px w-8 bg-[color:var(--lp-taupe)]" aria-hidden="true" />
            {t('missionQuoteSource')}
          </cite>
        </blockquote>
      </div>
    </section>
  );
}

