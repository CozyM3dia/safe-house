import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Waves } from 'lucide-react';

import { Card, CardHeader, CardTitle } from '../ui/card';
import { useT } from '../../hooks/useTranslation';
import { cn } from '../../lib/utils';
import './seismic-waveform.css';

const DURATION_S = 6;
const N_SAMPLES = 240;
const VIEW_W = 600;
const VIEW_H = 132;
const BASELINE_Y = 76;
const SPAN_UNITS = 52;
const T_P = 1.05;
const T_S = 2.3;
const T_C = 2.62;
const SIGMA_S = 0.34;
const EASE_DRAW = [0.65, 0, 0.35, 1];
const DRAW_S = 1.6;

function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function smoothstep(edge0, edge1, x) {
  const u = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return u * u * (3 - 2 * u);
}

function scaleCeiling(pga) {
  return Math.max(0.2, Math.ceil((pga * 1.25) / 0.1) * 0.1);
}

function buildWaveform(pga) {
  const scaleMax = scaleCeiling(pga);
  const rand = mulberry32(7919 + Math.round(pga * 500));
  const ph1 = rand() * 2 * Math.PI;
  const ph2 = rand() * 2 * Math.PI;
  const ph3 = rand() * 2 * Math.PI;
  const noise = new Array(N_SAMPLES + 1);
  for (let i = 0; i <= N_SAMPLES; i += 1) noise[i] = rand() * 2 - 1;

  const nAmbient = 0.006 + 0.02 * Math.min(pga, 0.5);
  const unitPerG = SPAN_UNITS / scaleMax;
  let d = '';
  for (let i = 0; i <= N_SAMPLES; i += 1) {
    const t = (i / N_SAMPLES) * DURATION_S;

    const ambient = nAmbient * noise[i];

    const dtP = t - T_P;
    const envP = dtP > 0 ? (1 - Math.exp(-dtP / 0.05)) * Math.exp(-dtP / 0.42) : 0;
    const pTerm = 0.26 * pga * envP * Math.sin(2 * Math.PI * 9.4 * t + ph1);

    const gauss = Math.exp(-((t - T_C) ** 2) / (2 * SIGMA_S ** 2));
    const sCarrier =
      0.84 * Math.sin(2 * Math.PI * 4.4 * t + ph2) +
      0.16 * Math.sin(2 * Math.PI * 6.9 * t + ph3);
    const sTerm = pga * gauss * sCarrier;

    const dtC = t - T_C;
    const coda =
      dtC > 0
        ? 0.5 *
          pga *
          Math.exp(-dtC / 1.05) *
          (0.55 + 0.45 * noise[i]) *
          Math.sin(2 * Math.PI * 2.5 * t + ph1)
        : 0;

    const fade = 1 - smoothstep(5.3, DURATION_S, t);
    const sig = (ambient + pTerm + sTerm + coda) * fade;

    const y = Math.min(
      VIEW_H - 10,
      Math.max(12, BASELINE_Y - (sig / scaleMax) * unitPerG),
    );
    d += `${i === 0 ? 'M' : 'L'}${((i / N_SAMPLES) * VIEW_W).toFixed(1)} ${y.toFixed(1)}`;
  }

  const ticks = [];
  for (let k = 1; k <= 9; k += 1) {
    const v = k / 10;
    if (v > scaleMax + 1e-9) break;
    ticks.push({
      v,
      label: `${v.toFixed(1)}g`,
      frac: (BASELINE_Y - v * unitPerG) / VIEW_H,
    });
  }

  return {
    d,
    unitPerG,
    ticks,
    zeroFrac: BASELINE_Y / VIEW_H,
  };
}

function GridLine({ y, className }) {
  return (
    <line x1="0" y1={y} x2={VIEW_W} y2={y} strokeWidth="1" vectorEffect="non-scaling-stroke" className={className} />
  );
}

export function SeismicWaveform({ property }) {
  const t = useT();
  const reduceMotion = useReducedMotion();
  const geotech = property?.geotech;
  const pgaRaw = Number(geotech?.pga);
  const pga = Number.isFinite(pgaRaw) ? pgaRaw : 0.3;
  const fault = geotech?.nearest_fault ?? null;

  const wave = useMemo(() => buildWaveform(pga), [pga]);

  if (!property) return null;

  const tone = pga > 0.5 ? 'danger' : pga > 0.3 ? 'moderate' : 'safe';
  const catLabel = tone === 'danger' ? 'TINGGI' : tone === 'moderate' ? 'SEDANG' : 'RENDAH';
  const pgaText = pga.toFixed(2);

  const distRaw = Number(fault?.distance_km);
  const hasDist = Number.isFinite(distRaw);
  let markerPct = null;
  let markerFlip = false;
  if (hasDist) {
    const tMark = Math.min(4.3, Math.max(0.55, 0.55 + distRaw * 0.09));
    markerPct = (tMark / DURATION_S) * 100;
    markerFlip = markerPct > 58;
  }
  const markerX = markerPct != null ? (markerPct / 100) * VIEW_W : null;

  const drawTransition = reduceMotion ? { duration: 0 } : { duration: DRAW_S, ease: EASE_DRAW };
  const revealTransition = (delay) =>
    reduceMotion ? { duration: 0 } : { duration: 0.45, delay, ease: 'easeOut' };

  const traceLayers = [
    { className: 'sw-trace-halo', strokeWidth: 5, opacity: 0.12 },
    { className: 'sw-trace-glow', strokeWidth: 2.6, opacity: 0.28 },
    { className: 'sw-trace-core', strokeWidth: 1.25, opacity: 1 },
  ];

  return (
    <Card className="sw-root" data-tone={tone} glow={tone === 'moderate' ? undefined : tone}>
      <CardHeader className="mb-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-accent/25 bg-accent/10 text-accent">
            <Waves className="h-3 w-3" />
          </span>
          <CardTitle className="truncate">{t('card.seismic')}</CardTitle>
        </div>
        <div className="shrink-0 text-right">
          <div className="sw-readout-label">PGA</div>
          <div className="sw-readout-value">
            {pgaText}
            <span className="sw-readout-unit">g</span>
          </div>
          <div className="sw-readout-cat">{catLabel}</div>
        </div>
      </CardHeader>

      <motion.div
        initial={{ opacity: reduceMotion ? 1 : 0 }}
        animate={{ opacity: 1 }}
        transition={revealTransition(0)}
        className="relative h-[104px] select-none"
        role="img"
        aria-label={`Seismogram sintetik dengan PGA ${pgaText.replace('.', ',')}g`}
      >
        <span className="sw-reg sw-reg-tl" aria-hidden />
        <span className="sw-reg sw-reg-tr" aria-hidden />
        <span className="sw-reg sw-reg-bl" aria-hidden />
        <span className="sw-reg sw-reg-br" aria-hidden />

        <div className="absolute inset-y-0 left-0 z-10 w-7" aria-hidden>
          {wave.ticks.map((tick) => (
            <div key={tick.label} className="sw-tick" style={{ top: `${tick.frac * 100}%` }}>
              <span className="sw-tick-label">{tick.label}</span>
              <span className="sw-tick-dash" />
            </div>
          ))}
          <div className="sw-tick sw-tick-zero" style={{ top: `${wave.zeroFrac * 100}%` }}>
            <span className="sw-tick-label">0</span>
            <span className="sw-tick-dash" />
          </div>
        </div>

        <div className="absolute inset-y-0 left-7 right-0" aria-hidden>
          <svg
            className="h-full w-full"
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            preserveAspectRatio="none"
          >
            {wave.ticks.map((tick) => (
              <GridLine
                key={`gl-${tick.label}`}
                y={BASELINE_Y - tick.v * wave.unitPerG}
                className="sw-gl"
              />
            ))}
            {wave.ticks.map((tick) => (
              <GridLine
                key={`gm-${tick.label}`}
                y={Math.min(VIEW_H - 6, BASELINE_Y + tick.v * wave.unitPerG * 0.72)}
                className="sw-gl"
              />
            ))}
            {[1, 2, 3, 4, 5].map((s) => (
              <line
                key={`gv-${s}`}
                x1={s * 100}
                y1="8"
                x2={s * 100}
                y2={VIEW_H - 8}
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
                className="sw-gl"
              />
            ))}

            <line
              x1="0"
              y1={BASELINE_Y}
              x2={VIEW_W}
              y2={BASELINE_Y}
              strokeDasharray="5 4"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
              className="sw-base"
            />

            {markerX != null && (
              <>
                <line
                  x1={markerX}
                  y1="8"
                  x2={markerX}
                  y2="19"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                  className="sw-marker-cap"
                />
                <line
                  x1={markerX}
                  y1="19"
                  x2={markerX}
                  y2={VIEW_H - 8}
                  strokeDasharray="3 3"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                  className="sw-marker-dash"
                />
              </>
            )}

            {traceLayers.map((layer) => (
              <motion.path
                key={layer.className}
                d={wave.d}
                className={layer.className}
                strokeWidth={layer.strokeWidth}
                style={{ opacity: layer.opacity }}
                fill="none"
                strokeLinejoin="round"
                strokeLinecap="round"
                initial={{ pathLength: reduceMotion ? 1 : 0 }}
                animate={{ pathLength: 1 }}
                transition={
                  layer.className === 'sw-trace-core'
                    ? drawTransition
                    : { ...drawTransition, delay: reduceMotion ? 0 : 0.12 }
                }
              />
            ))}
          </svg>

          <motion.span
            initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : -3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={revealTransition(DRAW_S * 0.85)}
            className="sw-phase"
            style={{ left: `${(T_P / DURATION_S) * 100}%` }}
          >
            P
          </motion.span>
          <motion.span
            initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : -3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={revealTransition(DRAW_S * 0.85)}
            className="sw-phase"
            style={{ left: `${(T_S / DURATION_S) * 100}%` }}
          >
            S
          </motion.span>

          {markerPct != null && (
            <motion.div
              initial={{ opacity: reduceMotion ? 1 : 0 }}
              animate={{ opacity: 1 }}
              transition={revealTransition(DRAW_S * 0.95)}
              className="pointer-events-none absolute inset-0"
            >
              <span className="sw-node" style={{ left: `${markerPct}%` }} />
              <span
                className={cn('sw-fault-tag', markerFlip && 'sw-fault-tag-flip')}
                style={{
                  left: markerFlip ? undefined : `calc(${markerPct}% + 7px)`,
                  right: markerFlip ? `calc(${100 - markerPct}% + 7px)` : undefined,
                }}
              >
                <span title={`${fault?.name ?? ''}${hasDist ? ` · ${Math.round(distRaw)} km` : ''}`}>
                  SESAR {(fault?.name ?? '—').toUpperCase()}
                  {hasDist ? ` · ${Math.round(distRaw)} KM` : ''}
                </span>
              </span>
            </motion.div>
          )}

          {!reduceMotion && (
            <motion.div
              className="sw-sweep-wrap"
              initial={{ clipPath: 'inset(0% 100% 0% 0%)' }}
              animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
              transition={{
                duration: 3.4,
                ease: 'linear',
                repeat: Infinity,
                delay: DRAW_S + 0.3,
              }}
            >
              <span className="sw-sweep" />
            </motion.div>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: reduceMotion ? 1 : 0 }}
        animate={{ opacity: 1 }}
        transition={revealTransition(DRAW_S * 0.55)}
        className="relative ml-7 mt-1.5 h-3.5"
        aria-hidden
      >
        {Array.from({ length: 7 }, (_, k) => (
          <div
            key={k}
            className={cn(
              'sw-time-tick',
              k === 0 && 'sw-time-tick-first',
              k === 6 && 'sw-time-tick-last',
            )}
            style={{ left: `${(k / 6) * 100}%` }}
          >
            <span className="sw-time-dash" />
            <span className="sw-time-label">{k}s</span>
          </div>
        ))}
      </motion.div>

      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-white/[0.06] pt-2">
        <span className="sw-src truncate">SUMBER: BMKG · PUSGENGA</span>
        <span className="sw-fig shrink-0">FIG. 02 — SEISMOGRAM SINETIK</span>
      </div>
    </Card>
  );
}
