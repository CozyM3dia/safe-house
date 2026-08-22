import { useId, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

import { computeSpectrum } from './analysis-data';
import './analysis-deck.css';

const W = 340;
const H = 190;
const MARGIN = { top: 20, right: 14, bottom: 28, left: 38 };
const PLOT_W = W - MARGIN.left - MARGIN.right;
const PLOT_H = H - MARGIN.top - MARGIN.bottom;
const BASE_Y = MARGIN.top + PLOT_H;
const X_TICKS = [0, 0.5, 1, 1.5, 2, 2.5, 3];

function niceYScale(maxVal) {
  const target = maxVal > 0 ? maxVal * 1.06 : 0.5;
  for (const step of [0.5, 0.25, 1, 0.2, 0.1]) {
    const n = Math.ceil(target / step);
    if (n >= 2 && n <= 4) {
      return Array.from({ length: n }, (_, i) => Number(((i + 1) * step).toFixed(3)));
    }
  }
  return [Math.ceil(target)];
}

/**
 * Plot telanjang: kurva spektrum respons desain SNI 1726:2019.
 * SDS, SD1, kelas situs, dan Fa dicetak sekali oleh pemanggil di baris
 * keterangan — dulu tiga di antaranya diulang di dalam kartu ini.
 */
export function SpectrumPlot({ property }) {
  const reduceMotion = useReducedMotion();
  const gradId = `qp-grad-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  const g = property?.geotech || {};
  const pga = Number(g.pga_surface ?? g.pga);

  const { sds, sd1, ts, points } = useMemo(() => computeSpectrum(pga), [pga]);
  const yTicks = useMemo(() => niceYScale(sds), [sds]);

  const geom = useMemo(() => {
    const yMax = yTicks[yTicks.length - 1];
    const xOf = (t) => MARGIN.left + (t / 3) * PLOT_W;
    const yOf = (sa) => MARGIN.top + PLOT_H * (1 - sa / yMax);
    let curvePath = '';
    points.forEach(([t, sa], i) => {
      curvePath += `${i === 0 ? 'M' : 'L'} ${xOf(t).toFixed(2)} ${yOf(sa).toFixed(2)} `;
    });
    return {
      xOf,
      yOf,
      curvePath,
      areaPath: `${curvePath}L ${(W - MARGIN.right).toFixed(2)} ${BASE_Y} L ${MARGIN.left} ${BASE_Y} Z`,
      sdsY: yOf(sds),
      tsX: xOf(ts),
    };
  }, [points, sds, ts, yTicks]);

  const fmt = (v) => v.toFixed(2);
  const ariaLabel =
    `Kurva spektrum respons desain SNI 1726:2019 untuk PGA permukaan ${fmt(pga)} g, ` +
    `SDS ${fmt(sds)} g dan SD1 ${fmt(sd1)} g, dengan plato hingga periode ${Number(ts.toFixed(2))} detik.`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" className="qp-grad-top" />
          <stop offset="100%" className="qp-grad-bottom" />
        </linearGradient>
      </defs>

      {yTicks.map((v) => {
        const y = geom.yOf(v);
        return (
          <g key={`yt-${v}`}>
            <line className="qp-grid" x1={MARGIN.left} y1={y} x2={W - MARGIN.right} y2={y} />
            <text className="qp-tick" x={MARGIN.left - 6} y={y + 3} textAnchor="end">
              {v}g
            </text>
          </g>
        );
      })}

      {X_TICKS.map((t, i) => {
        const x = geom.xOf(t);
        return (
          <g key={`xt-${t}`}>
            <line className="qp-grid" x1={x} y1={MARGIN.top} x2={x} y2={BASE_Y} />
            {i % 2 === 0 && (
              <text className="qp-tick" x={x} y={BASE_Y + 12} textAnchor="middle">
                {t}s
              </text>
            )}
          </g>
        );
      })}

      <line className="qp-axis" x1={MARGIN.left} y1={BASE_Y} x2={W - MARGIN.right} y2={BASE_Y} />
      <line className="qp-axis" x1={MARGIN.left} y1={MARGIN.top} x2={MARGIN.left} y2={BASE_Y} />
      <text className="qp-axis-title" x={MARGIN.left} y={MARGIN.top - 8}>
        SA (G)
      </text>
      <text className="qp-axis-title" x={W - MARGIN.right} y={H - 3} textAnchor="end">
        T (DETIK)
      </text>

      <motion.g
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={reduceMotion ? { duration: 0 } : { delay: 0.55, duration: 0.5 }}
      >
        <path className="qp-area" d={geom.areaPath} fill={`url(#${gradId})`} stroke="none" />
      </motion.g>

      <motion.path
        className="qp-curve"
        d={geom.curvePath}
        initial={reduceMotion ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 1, ease: 'easeInOut' }}
      />

      <motion.g
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={reduceMotion ? { duration: 0 } : { delay: 0.8, duration: 0.4 }}
      >
        <line className="qp-anno" x1={geom.tsX} y1={geom.sdsY} x2={geom.tsX} y2={BASE_Y} />
        <circle className="qp-anno-dot" cx={geom.tsX} cy={geom.sdsY} r="2.5" />
        <text className="qp-anno-text" x={geom.tsX + 6} y={geom.sdsY - 5}>
          TS {Number(ts.toFixed(2))}s
        </text>
      </motion.g>
    </svg>
  );
}
