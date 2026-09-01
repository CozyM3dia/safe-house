import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { BadgeCheck } from 'lucide-react';
import { EASE } from './motion';
import { useLpInView } from '../../../hooks/useLpMotion';

/**
 * Misi — "Manifold": diagram teknik ala gambar kerja.
 *
 * Lima port sumber (kiri) mengalir lewat kabel SVG ke segel mesin hitung
 * deterministik SNI (tengah), lalu SATU jalur keluaran ke berkas gelap
 * ber-cap (kanan). Ide "5 masuk → 1 keluar" menjadi bentuk visualnya
 * sendiri, bukan sekadar list + kartu.
 *
 * - Kabel diukur dari DOM (getBoundingClientRect, remeasure via
 *   ResizeObserver + resize + document.fonts.ready). Anchor SELALU pada
 *   wrapper statis; semua transform framer hidup di elemen dalam, jadi
 *   pengukuran tidak pernah menangkap posisi tengah-animasi.
 * - Kabel hanya digambar ≥1024px; di bawahnya alur jadi vertikal
 *   (port → mesin → berkas) dengan sambungan dash CSS.
 * - Denyut data = SMIL animateMotion, dirender hanya saat !reduce dan
 *   baru terlihat setelah `is-live` (armed).
 * - Siklus sorotan 3.2s: port aktif menyalakan kabel + isian berkas yang
 *   ia beri makan; pause saat hover (perangkat hover) / fokus keyboard;
 *   klik port me-reset interval via `epoch`.
 * - prefers-reduced-motion: kabel langsung tergambar, tanpa denyut,
 *   tanpa orbit/aliran, sorotan statis di port 01.
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
const ARMED_MS = 1700;
const INSTANT = { duration: 0 };

const canHover =
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(hover: hover)').matches
    : false;

const listV = (reduce) =>
  reduce
    ? { hidden: {}, show: {} }
    : { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } };

const itemV = (reduce) =>
  reduce
    ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } }
    : {
        hidden: { opacity: 0, y: 16 },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
      };

export default function MissionSection({ t }) {
  const { rootRef, inView } = useLpInView({ threshold: 0.15 });
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [armed, setArmed] = useState(false);
  const [hoverPause, setHoverPause] = useState(false);
  const [focusPause, setFocusPause] = useState(false);
  const [epoch, setEpoch] = useState(0);

  const paused = hoverPause || focusPause;

  // ── Geometri kabel (hanya layout ≥1024px) ────────────────────────────
  const diagRef = useRef(null);
  const portRefs = useRef([]);
  const hubRef = useRef(null);
  const docRef = useRef(null);
  const [geo, setGeo] = useState(null);

  useLayoutEffect(() => {
    const el = diagRef.current;
    if (!el) return undefined;
    let raf = 0;

    const measure = () => {
      raf = 0;
      const hub = hubRef.current;
      const doc = docRef.current;
      if (!hub || !doc) return;
      if (!window.matchMedia('(min-width: 1024px)').matches) {
        setGeo(null);
        return;
      }
      const box = el.getBoundingClientRect();
      if (!box.width) return;
      const hb = hub.getBoundingClientRect();
      const db = doc.getBoundingClientRect();
      const hubY = hb.top + hb.height / 2 - box.top;
      const hubL = hb.left - box.left - 4;
      const hubR = hb.right - box.left + 4;

      const paths = portRefs.current.map((p) => {
        if (!p) return '';
        const r = p.getBoundingClientRect();
        const x1 = r.right - box.left - 1;
        const y1 = r.top + r.height / 2 - box.top;
        const dx = Math.max((hubL - x1) * 0.55, 32);
        return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${hubL - dx} ${hubY}, ${hubL} ${hubY}`;
      });

      const x2 = db.left - box.left + 1;
      const y2 = db.top + db.height / 2 - box.top;
      const odx = Math.max((x2 - hubR) * 0.55, 32);
      const out = `M ${hubR} ${hubY} C ${hubR + odx} ${hubY}, ${x2 - odx} ${y2}, ${x2} ${y2}`;

      setGeo({ w: Math.round(box.width), h: Math.round(box.height), paths, out });
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };

    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
    ro?.observe(el);
    window.addEventListener('resize', schedule);
    // Font display swap menggeser tinggi baris → ukur ulang saat font siap.
    if (document.fonts?.ready) document.fonts.ready.then(schedule).catch(() => {});

    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // ── Arm + siklus sorotan ──────────────────────────────────────────────
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

  const drawn = inView || reduce;

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

        <div ref={rootRef}>
          {/* ── Bidang gambar kerja ── */}
          <div
            ref={diagRef}
            className={`lp-mfd mt-12 md:mt-14 ${armed ? 'is-live' : ''}`}
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
            {geo && (
              <svg className="lp-mfd-svg" viewBox={`0 0 ${geo.w} ${geo.h}`} aria-hidden="true">
                {geo.paths.map((d, i) =>
                  d ? (
                    <g key={SOURCES[i].id} className={armed && i === active ? 'is-on' : ''}>
                      <path
                        className="lp-mfd-wire"
                        d={d}
                        pathLength="1"
                        style={{ strokeDashoffset: drawn ? 0 : 1, transitionDelay: `${0.15 + i * 0.12}s` }}
                      />
                      <path className="lp-mfd-flow" d={d} pathLength="1" id={`lp-mfd-p${i}`} />
                      {!reduce && (
                        <circle className="lp-mfd-pulse" r="2.6">
                          <animateMotion dur={`${2.6 + i * 0.2}s`} begin={`${-(i * 0.55)}s`} repeatCount="indefinite">
                            <mpath href={`#lp-mfd-p${i}`} />
                          </animateMotion>
                        </circle>
                      )}
                    </g>
                  ) : null
                )}
                <g>
                  <path
                    className="lp-mfd-wire lp-mfd-wire-out"
                    d={geo.out}
                    pathLength="1"
                    style={{ strokeDashoffset: drawn ? 0 : 1, transitionDelay: '0.9s' }}
                  />
                  <path className="lp-mfd-flow lp-mfd-flow-out" d={geo.out} pathLength="1" id="lp-mfd-pout" />
                  {!reduce && (
                    <circle className="lp-mfd-pulse lp-mfd-pulse-out" r="3.1">
                      <animateMotion dur="2.1s" repeatCount="indefinite">
                        <mpath href="#lp-mfd-pout" />
                      </animateMotion>
                    </circle>
                  )}
                </g>
              </svg>
            )}

            <div className="lp-mfd-grid">
              {/* Kolom 1: lima port sumber */}
              <div className="lp-mfd-col">
                <span className="lp-mfd-col-label">{t('missionSourcesLabel')}</span>
                <motion.ul
                  className="lp-mfd-ports"
                  variants={listV(reduce)}
                  initial={reduce ? false : 'hidden'}
                  animate={inView || reduce ? 'show' : 'hidden'}
                >
                  {SOURCES.map((s, i) => {
                    const isActive = armed && i === active;
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          ref={(node) => {
                            portRefs.current[i] = node;
                          }}
                          onClick={() => pick(i)}
                          aria-current={isActive ? 'true' : undefined}
                          className={`lp-mfd-port ${isActive ? 'is-active' : ''}`}
                        >
                          <motion.span className="lp-mfd-port-in" variants={itemV(reduce)}>
                            <span className="lp-mfd-port-idx">{s.num}</span>
                            <span className="lp-mfd-port-main">
                              <span className="lp-mfd-port-name lp-serif">{s.name}</span>
                              <span className="lp-mfd-port-tag">{t(s.tagKey)}</span>
                            </span>
                            <span className="lp-mfd-port-mx">{t(s.mxKey)}</span>
                          </motion.span>
                          <span className="lp-mfd-port-pin" aria-hidden="true" />
                        </button>
                      </li>
                    );
                  })}
                </motion.ul>
              </div>

              <span className="lp-mfd-vline" aria-hidden="true" />

              {/* Kolom 2: segel mesin hitung */}
              <div className="lp-mfd-col lp-mfd-hubcol">
                <div ref={hubRef} className="lp-mfd-hub">
                  <span className="lp-mfd-hub-orbit" aria-hidden="true" />
                  <span className="lp-mfd-hub-ping" aria-hidden="true" />
                  <motion.span
                    className="lp-mfd-hub-face"
                    initial={reduce ? false : { scale: 0.72, opacity: 0 }}
                    animate={inView ? { scale: 1, opacity: 1 } : undefined}
                    transition={reduce ? INSTANT : { delay: 0.5, type: 'spring', stiffness: 190, damping: 18 }}
                  >
                    <span className="lp-mfd-hub-fx" aria-hidden="true">
                      ƒ(lat, lon)
                    </span>
                    <span className="lp-mfd-hub-sni lp-serif">SNI</span>
                    <span className="lp-mfd-hub-code">1726:2019</span>
                  </motion.span>
                </div>
                <p className="lp-mfd-hub-label">{t('missionEngine')}</p>
                <p className="lp-mfd-hub-sub">{t('missionEngineSub')}</p>
              </div>

              <span className="lp-mfd-vline" aria-hidden="true" />

              {/* Kolom 3: satu berkas keluar */}
              <div className="lp-mfd-col lp-mfd-doccol">
                <span className="lp-mfd-col-label">{t('missionOutputLabel')}</span>
                <div ref={docRef} className="lp-mfd-doc">
                  <motion.div
                    className="lp-mfd-doc-card"
                    initial={reduce ? false : { opacity: 0, y: 42, rotate: 1.1 }}
                    animate={inView ? { opacity: 1, y: 0, rotate: 0 } : undefined}
                    transition={reduce ? INSTANT : { delay: 0.35, type: 'spring', stiffness: 150, damping: 21 }}
                  >
                    <span className="lp-mfd-tab">{t('missionReadyTag')}</span>
                    <div className="lp-mfd-doc-head">{t('missionCardTitle')}</div>

                    {FIELDS.map((f, i) => {
                      const isHot = armed && f.srcNums.includes(SOURCES[active].num);
                      return (
                        <div key={f.key} className={`lp-mfd-field ${isHot ? 'is-hot' : ''}`}>
                          <span className="lp-mfd-field-left">
                            <span className="lp-mfd-field-label">{t(f.labelKey)}</span>
                            <span className="lp-mfd-field-sub">{t(f.subKey)}</span>
                          </span>
                          <span className="lp-mfd-field-mask">
                            <motion.span
                              className="lp-mfd-field-value lp-serif"
                              initial={reduce ? false : { y: '115%' }}
                              animate={inView ? { y: '0%' } : undefined}
                              transition={reduce ? INSTANT : { duration: 0.7, ease: EASE, delay: 0.55 + i * 0.09 }}
                            >
                              {t(f.valKey)}
                              <span className="lp-mfd-field-refs">
                                {f.srcNums.map((n) => (
                                  <sup
                                    key={n}
                                    className={armed && n === SOURCES[active].num ? 'is-on' : ''}
                                    aria-label={n}
                                  >
                                    {n}
                                  </sup>
                                ))}
                              </span>
                            </motion.span>
                          </span>
                        </div>
                      );
                    })}

                    <div className="lp-mfd-doc-foot">
                      <BadgeCheck size={14} strokeWidth={1.8} aria-hidden="true" />
                      <span>{t('missionCardFoot')}</span>
                      <span className="lp-mfd-doc-manual">{t('missionManual')}</span>
                    </div>

                    <motion.span
                      className="lp-mfd-stamp"
                      aria-hidden="true"
                      initial={reduce ? false : { opacity: 0, scale: 2.2, rotate: -25 }}
                      animate={inView ? { opacity: 0.92, scale: 1, rotate: -8 } : undefined}
                      transition={reduce ? INSTANT : { delay: 1.5, type: 'spring', stiffness: 420, damping: 15 }}
                    >
                      {t('missionStampText')}
                      <small>SNI 1726:2019</small>
                    </motion.span>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Buku besar: cara lama vs dengan S.A.F.E House ── */}
          <div className="lp-mfd-ledger">
            <div
              className={`lp-mfd-ledger-col is-old ${inView ? 'lp-in' : 'lp-reveal'}`}
              style={{ '--lp-delay': '250ms' }}
            >
              <span className="lp-mfd-ledger-label">{t('missionOldLabel')}</span>
              <p className="lp-mfd-ledger-stat lp-serif">
                <span className={`lp-mfd-strike ${inView ? 'is-on' : ''}`}>{t('missionOldStat')}</span>
              </p>
              <p className="lp-mfd-ledger-desc">{t('missionOldDesc')}</p>
              <p className="lp-mfd-ledger-note">{t('missionOldRisk')}</p>
            </div>
            <div
              className={`lp-mfd-ledger-col is-new ${inView ? 'lp-in' : 'lp-reveal'}`}
              style={{ '--lp-delay': '350ms' }}
            >
              <span className="lp-mfd-ledger-label">{t('missionNewLabel')}</span>
              <p className="lp-mfd-ledger-stat lp-serif">{t('missionNewStat')}</p>
              <p className="lp-mfd-ledger-desc">{t('missionNewDesc')}</p>
              <p className="lp-mfd-ledger-note is-proof">{t('missionNewProof')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
