import { useEffect, useId, useMemo, useState } from 'react';
import { animate, motion, useReducedMotion } from 'framer-motion';
import { Activity } from 'lucide-react';

import { Card } from '../ui/card';
import './gaussian-card.css';

const W = 320;
const H = 148;
const MARGIN = { top: 20, right: 12, bottom: 28, left: 36 };
const PLOT_W = W - MARGIN.left - MARGIN.right;
const PLOT_H = H - MARGIN.top - MARGIN.bottom;
const BASE_Y = MARGIN.top + PLOT_H;
const X_TICKS = [0, 0.5, 1, 1.5, 2, 2.5, 3];

function computeSpectrum(pga) {
  const sds = 2.5 * pga;
  const sd1 = 1.5 * pga;
  const ratio = sds > 0 ? sd1 / sds : 0;
  const t0 = 0.2 * ratio;
  const ts = ratio;
  const points = [];
  for (let i = 0; i <= 60; i += 1) {
    const t = i * 0.05;
    let sa;
    if (t < t0) {
      sa = sds * (0.4 + 0.6 * (t / t0));
    } else if (t <= ts) {
      sa = sds;
    } else {
      sa = sd1 / t;
    }
    if (!Number.isFinite(sa)) sa = 0;
    points.push([Number(t.toFixed(2)), sa]);
  }
  return { sds, sd1, t0, ts, points };
}

function niceYScale(maxVal) {
  const target = maxVal > 0 ? maxVal * 1.06 : 0.5;
  for (const step of [0.25, 0.5, 0.1, 0.2, 0.05, 1]) {
    const n = Math.ceil(target / step);
    if (n >= 2 && n <= 5) {
      return Array.from({ length: n }, (_, i) => Number(((i + 1) * step).toFixed(3)));
    }
  }
  return [Math.ceil(target)];
}

function useCountUp(target, enabled, duration = 0.6) {
  const [value, setValue] = useState(enabled ? 0 : target);
  useEffect(() => {
    if (!enabled) {
      setValue(target);
      return undefined;
    }
    const controls = animate(0, target, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setValue(v),
    });
    return () => controls.stop();
  }, [target, enabled, duration]);
  return value;
}

export function GaussianCard({ property }) {
  const g = property?.geotech || {};
  const pga = g.pga_surface ?? g.pga ?? 0.35;
  const reduceMotion = useReducedMotion();
  const rawId = useId();
  const gradId = `gc-grad-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;

  const status = pga >= 0.6 ? 'danger' : pga >= 0.3 ? 'moderate' : 'safe';

  const { sds, sd1, t0, ts, points } = useMemo(() => computeSpectrum(pga), [pga]);
  const yTicks = useMemo(() => niceYScale(sds), [sds]);

  const geom = useMemo(() => {
    const yMax = yTicks[yTicks.length - 1];
    const xOf = (t) => MARGIN.left + (t / 3) * PLOT_W;
    const yOf = (sa) => MARGIN.top + PLOT_H * (1 - sa / yMax);
    let curvePath = '';
    points.forEach(([t, sa], i) => {
      const cmd = i === 0 ? 'M' : 'L';
      curvePath += `${cmd} ${xOf(t).toFixed(2)} ${yOf(sa).toFixed(2)} `;
    });
    const areaPath = `${curvePath}L ${(W - MARGIN.right).toFixed(2)} ${BASE_Y} L ${MARGIN.left} ${BASE_Y} Z`;
    return {
      xOf,
      yOf,
      yMax,
      curvePath,
      areaPath,
      sdsY: yOf(sds),
      tsX: xOf(ts),
      t0X: xOf(t0),
    };
  }, [points, sds, ts, t0, yTicks]);

  const animPga = useCountUp(pga, !reduceMotion);
  const animSds = useCountUp(sds, !reduceMotion);
  const animSd1 = useCountUp(sd1, !reduceMotion);
  const fmt = (v) => v.toFixed(2);

  const ariaLabel =
    `Kurva spektrum respons desain SNI 1726:2019 untuk PGA permukaan ${fmt(pga)} g, ` +
    `SDS ${fmt(sds)} g dan SD1 ${fmt(sd1)} g, dengan platou hingga periode ${Number(ts.toFixed(2))} detik.`;

  return (
    <Card className="gcard" data-status={status} glow={status === 'moderate' ? 'accent' : status}>
      <div className="flex items-center gap-2">
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-accent/25 bg-accent/10 text-accent">
          <Activity className="h-3 w-3" strokeWidth={2.25} />
        </div>
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-secondary">
          Spektrum Respons Gempa
        </h3>
        <span className="ml-auto flex items-center gap-1.5 rounded-full border border-white/10 px-2 py-[3px] font-mono text-[8px] tracking-[0.14em] text-text-muted">
          <span className="h-1 w-1 rounded-full" style={{ background: 'var(--gc-status)' }} />
          SNI 1726:2019
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 border-y border-white/8 py-2">
        {[
          { label: 'PGA Surface', value: animPga },
          { label: 'SDS', value: animSds },
          { label: 'SD1', value: animSd1 },
        ].map((cell, i) => (
          <div key={cell.label} className={i === 0 ? 'pr-3' : 'border-l border-white/8 px-3'}>
            <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-text-muted">
              {cell.label}
            </div>
            <div className="mt-1 font-mono text-[15px] font-bold leading-none tracking-tight text-text-primary tabular-nums">
              {fmt(cell.value)}
              <span className="ml-0.5 text-[10px] font-medium text-text-muted">g</span>
            </div>
          </div>
        ))}
      </div>

      {(g.site_class != null || g.fa != null) && (
        <div className="mt-2 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.15em] text-text-muted">
          {g.site_class != null && <span>Site Class {g.site_class}</span>}
          {g.site_class != null && g.fa != null && <span className="opacity-40">·</span>}
          {g.fa != null && <span>FA {g.fa}</span>}
        </div>
      )}

      <div className="relative mt-3">
        <span className="gc-corner gc-corner--tl" aria-hidden="true" />
        <span className="gc-corner gc-corner--tr" aria-hidden="true" />
        <span className="gc-corner gc-corner--bl" aria-hidden="true" />
        <span className="gc-corner gc-corner--br" aria-hidden="true" />

        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full"
          role="img"
          aria-label={ariaLabel}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" className="gc-grad-top" />
              <stop offset="100%" className="gc-grad-bottom" />
            </linearGradient>
          </defs>

          {yTicks.map((v) => {
            const y = geom.yOf(v);
            return (
              <g key={`yt-${v}`}>
                <line className="gc-grid-line" x1={MARGIN.left} y1={y} x2={W - MARGIN.right} y2={y} />
                <line className="gc-tick-mark" x1={MARGIN.left - 3} y1={y} x2={MARGIN.left} y2={y} />
                <text className="gc-tick-text" x={MARGIN.left - 6} y={y + 2.5} textAnchor="end">
                  {v}g
                </text>
              </g>
            );
          })}

          {X_TICKS.map((t) => {
            const x = geom.xOf(t);
            return (
              <g key={`xt-${t}`}>
                <line className="gc-grid-line" x1={x} y1={MARGIN.top} x2={x} y2={BASE_Y} />
                <line className="gc-tick-mark" x1={x} y1={BASE_Y} x2={x} y2={BASE_Y + 3} />
                <text className="gc-tick-text" x={x} y={BASE_Y + 13} textAnchor="middle">
                  {t}s
                </text>
              </g>
            );
          })}

          <line className="gc-axis-line" x1={MARGIN.left} y1={BASE_Y} x2={W - MARGIN.right} y2={BASE_Y} />
          <line className="gc-axis-line" x1={MARGIN.left} y1={MARGIN.top} x2={MARGIN.left} y2={BASE_Y} />
          <text className="gc-axis-title" x={MARGIN.left} y={MARGIN.top - 9}>
            SA (G)
          </text>
          <text className="gc-axis-title" x={W - MARGIN.right} y={H - 2} textAnchor="end">
            T (DETIK)
          </text>

          <motion.g
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={reduceMotion ? { duration: 0 } : { delay: 0.85, duration: 0.45 }}
          >
            <line className="gc-anno-line" x1={MARGIN.left} y1={geom.sdsY} x2={W - MARGIN.right} y2={geom.sdsY} />
            <text className="gc-anno-text" x={MARGIN.left + 5} y={geom.sdsY - 4}>
              SDS
            </text>

            <line className="gc-anno-line" x1={geom.tsX} y1={geom.sdsY} x2={geom.tsX} y2={BASE_Y} />
            <circle className="gc-anno-dot" cx={geom.tsX} cy={geom.sdsY} r="2.5" />
            <text className="gc-anno-text" x={geom.tsX + 6} y={geom.sdsY - 5}>
              TS={Number(ts.toFixed(2))}s
            </text>

            {t0 > 0 && (
              <text
                className="gc-anno-text"
                x={geom.t0X - 4}
                y={geom.yOf(sds * 0.62)}
                textAnchor="end"
                opacity="0.7"
              >
                T0
              </text>
            )}
          </motion.g>

          <motion.g
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={reduceMotion ? { duration: 0 } : { delay: 0.7, duration: 0.6 }}
          >
            <path className="gc-area-fill" d={geom.areaPath} fill={`url(#${gradId})`} stroke="none" />
          </motion.g>

          <motion.path
            className="gc-curve"
            d={geom.curvePath}
            initial={reduceMotion ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 1.05, ease: 'easeInOut', delay: 0.1 }
            }
          />
        </svg>
      </div>

      <div className="mt-2 flex items-baseline justify-between font-mono text-[9px] uppercase tracking-[0.14em] text-text-muted">
        <span>Respons spektral periode 0–3 detik</span>
        <span className="shrink-0 pl-2 text-accent/80">FIG. 03</span>
      </div>
    </Card>
  );
}
