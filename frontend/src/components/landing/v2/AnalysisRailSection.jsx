import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import { useLpInView } from '../../../hooks/useLpMotion';
import { SectionHeader } from './atoms';
import HazardFigure from './HazardFigures';

/**
 * "Lima bahaya, satu kertas kerja": section-nya adalah kertas kerja itu.
 *
 * Kiri: indeks lima lapisan (tablist vertikal) yang sekaligus memuat
 *   keluaran tiap lapisan, jadi lima angka terbaca sekilas tanpa klik.
 * Kanan: satu lembar kerja untuk lapisan aktif — pertanyaan yang dijawab,
 *   diagram teknis SVG ringan, alur sumber → metode → keluaran, tabel
 *   parameter yang dikutip di laporan, dan batasan metodenya.
 *
 * Tanpa three.js, tanpa carousel: seluruh visual = SVG + CSS.
 * Berganti otomatis pelan saat terlihat; berhenti begitu pengguna
 * hover/fokus/memilih, dan mati total pada prefers-reduced-motion.
 * Angka memakai skenario kanonik Bandar Lampung dari COPY dict.
 */

const LAYERS = [
  { key: 'Seismic', hue: 'seismic' },
  { key: 'Flood', hue: 'flood' },
  { key: 'Liquefaction', hue: 'liquefaction' },
  { key: 'Volcanic', hue: 'volcanic' },
  { key: 'Terrain', hue: 'terrain' },
];
const AUTO_MS = 7000;
const pad2 = (n) => String(n).padStart(2, '0');

export default function AnalysisRailSection({ t }) {
  const { rootRef, inView } = useLpInView({ threshold: 0.2 });
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const [manual, setManual] = useState(false); // pengguna sudah memilih sendiri
  const tabRefs = useRef([]);

  const autoplay = inView && !hover && !focus && !manual && !reduce;

  useEffect(() => {
    if (!autoplay) return undefined;
    const id = setTimeout(() => setActive((a) => (a + 1) % LAYERS.length), AUTO_MS);
    return () => clearTimeout(id);
  }, [autoplay, active]);

  const pick = (i, focus = false) => {
    const next = (i + LAYERS.length) % LAYERS.length;
    setActive(next);
    setManual(true);
    if (focus) tabRefs.current[next]?.focus();
  };

  const onTabKeyDown = (e) => {
    const delta = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (delta) {
      e.preventDefault();
      pick(active + delta, true);
    } else if (e.key === 'Home') {
      e.preventDefault();
      pick(0, true);
    } else if (e.key === 'End') {
      e.preventDefault();
      pick(LAYERS.length - 1, true);
    }
  };

  const cur = LAYERS[active];
  const K = cur.key;
  const params = t(`rail${K}Params`);
  const paramRows = Array.isArray(params) ? params : [];

  return (
    <section id="lapisan" ref={rootRef} className="lp-section" aria-labelledby="lapisan-title">
      <div className="lp-container">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeader
            eyebrow={t('railEyebrow')}
            title={t('railTitle')}
            titleId="lapisan-title"
            lead={t('railLead')}
          />
          <p className="lp-ws-meta">
            <span>{t('wsSheet')} 01–05</span>
            <span className="lp-ws-meta-sep" aria-hidden="true" />
            <span>{t('wsStandard')}</span>
          </p>
        </div>

        <div
          className={`lp-ws mt-10 ${inView ? 'lp-in' : 'lp-reveal'}`}
          data-hue={cur.hue}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onFocusCapture={() => setFocus(true)}
          onBlurCapture={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) setFocus(false);
          }}
        >
          {/* ── Indeks lapisan ─────────────────────────────────────────── */}
          <div className="lp-ws-side">
            <div
              role="tablist"
              aria-label={t('wsIndexLabel')}
              aria-orientation="vertical"
              className="lp-ws-index"
              onKeyDown={onTabKeyDown}
            >
              {LAYERS.map((layer, i) => {
                const on = i === active;
                return (
                  <button
                    key={layer.key}
                    ref={(el) => {
                      tabRefs.current[i] = el;
                    }}
                    type="button"
                    role="tab"
                    id={`lapisan-tab-${layer.hue}`}
                    aria-selected={on}
                    aria-controls="lapisan-panel"
                    tabIndex={on ? 0 : -1}
                    data-hue={layer.hue}
                    className="lp-ws-row"
                    onClick={() => pick(i)}
                  >
                    <span className="lp-ws-row-num lp-num">{pad2(i + 1)}</span>
                    <span className="lp-ws-row-main">
                      <span className="lp-ws-row-title lp-serif">{t(`rail${layer.key}Title`)}</span>
                      <span className="lp-ws-row-tag">{t(`rail${layer.key}Source`)}</span>
                    </span>
                    <span className="lp-ws-row-read">
                      <span className="lp-ws-row-readlabel">{t(`rail${layer.key}ReadLabel`)}</span>
                      <span className="lp-ws-row-readval lp-num">{t(`rail${layer.key}ReadValue`)}</span>
                    </span>
                    {on && autoplay ? (
                      <span
                        key={`p-${active}`}
                        className="lp-ws-row-progress"
                        style={{ '--ws-dur': `${AUTO_MS}ms` }}
                        aria-hidden="true"
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
            <p className="lp-ws-foot">{t('wsFootnote')}</p>
          </div>

          {/* ── Lembar kerja lapisan aktif ─────────────────────────────── */}
          <article
            id="lapisan-panel"
            role="tabpanel"
            aria-labelledby={`lapisan-tab-${cur.hue}`}
            className="lp-ws-sheet"
          >
            <span className="lp-ws-mark" data-pos="tl" aria-hidden="true" />
            <span className="lp-ws-mark" data-pos="tr" aria-hidden="true" />
            <span className="lp-ws-mark" data-pos="bl" aria-hidden="true" />
            <span className="lp-ws-mark" data-pos="br" aria-hidden="true" />

            <header className="lp-ws-sheet-head">
              <p className="lp-ws-sheet-id">
                <span className="lp-ws-sheet-dot" aria-hidden="true" />
                <span>
                  {t('wsSheet')} {pad2(active + 1)}
                  <span className="lp-ws-dim">/{pad2(LAYERS.length)}</span>
                </span>
              </p>
              <div className="flex items-center gap-3">
                <span className="lp-ws-scenario">{t('wsScenario')}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => pick(active - 1)}
                    aria-label={t('railPrev')}
                    className="lp-ws-nav"
                  >
                    <ArrowLeft size={14} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => pick(active + 1)}
                    aria-label={t('railNext')}
                    className="lp-ws-nav"
                  >
                    <ArrowRight size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </header>

            <div key={cur.key} className="lp-ws-panel">
              <div className="lp-ws-lede">
                <div className="min-w-0">
                  <p className="lp-ws-label">{t('wsQuestion')}</p>
                  <h3 className="lp-ws-q lp-serif">{t(`rail${K}Question`)}</h3>
                </div>
                <div className="lp-ws-hero">
                  <span className="lp-ws-label">{t(`rail${K}ReadLabel`)}</span>
                  <span className="lp-ws-hero-val lp-num">{t(`rail${K}ReadValue`)}</span>
                </div>
              </div>

              <figure className="lp-ws-fig" aria-hidden="true">
                <HazardFigure variant={cur.hue} labels={t(`rail${K}Fig`)} />
                <figcaption className="lp-ws-fig-cap">
                  {pad2(active + 1)} · {t(`rail${K}Title`)}
                </figcaption>
              </figure>

              <dl className="lp-ws-flow">
                <div className="lp-ws-flow-cell">
                  <dt>{t('wsColSource')}</dt>
                  <dd>{t(`rail${K}Source`)}</dd>
                </div>
                <div className="lp-ws-flow-cell">
                  <dt>{t('wsColMethod')}</dt>
                  <dd>{t(`rail${K}Method`)}</dd>
                </div>
                <div className="lp-ws-flow-cell lp-ws-flow-cell--out">
                  <dt>{t('wsColOutput')}</dt>
                  <dd className="lp-num">{t(`rail${K}ReadValue`)}</dd>
                </div>
              </dl>

              <div className="lp-ws-body">
                <div>
                  <h4 className="lp-ws-h lp-serif">{t(`rail${K}Title`)}</h4>
                  <p className="lp-ws-desc">{t(`rail${K}Desc`)}</p>
                  <p className="lp-ws-note">
                    <span className="lp-ws-note-label">{t('wsNoteLabel')}</span>
                    <span>{t(`rail${K}Note`)}</span>
                  </p>
                </div>
                <div>
                  <p className="lp-ws-label">{t('wsParamsTitle')}</p>
                  <ul className="lp-ws-params">
                    {paramRows.map(([label, value, note]) => (
                      <li key={label}>
                        <span className="lp-ws-params-key">{label}</span>
                        <span className="lp-ws-params-cell">
                          <span className="lp-ws-params-val lp-num">{value}</span>
                          <span className="lp-ws-params-note">{note}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
