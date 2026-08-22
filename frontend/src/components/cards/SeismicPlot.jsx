import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

import { cn } from '../../lib/utils';
import './analysis-deck.css';

const DURATION_S = 6;
const N_SAMPLES = 240;
const VIEW_W = 600;
const VIEW_H = 132;
const BASELINE_Y = VIEW_H / 2;
const SPAN_UNITS = 54;
const T_P = 1.05;
const T_S = 2.3;
const T_C = 2.62;
const SIGMA_S = 0.34;
const EASE_DRAW = [0.65, 0, 0.35, 1];
const DRAW_S = 1.5;

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

    const y = Math.min(VIEW_H - 6, Math.max(6, BASELINE_Y - sig * unitPerG));
    d += `${i === 0 ? 'M' : 'L'}${((i / N_SAMPLES) * VIEW_W).toFixed(1)} ${y.toFixed(1)}`;
  }

  /* Dulu tangga sumbu-Y menandai tiap 0,1 g. Pada PGA 0,5 g itu tujuh label
     mono berdesakan di kolom setinggi 40px sampai saling tumpang tindih dan
     tak terbaca. Dua label saja — setengah skala dan skala penuh — sudah
     cukup untuk membaca besaran, dan sisanya jadi kisi tanpa angka. */
  const half = Number((scaleMax / 2).toFixed(2));
  const levels = [half, scaleMax];

  return {
    d,
    scaleMax,
    unitPerG,
    levels,
    ticks: levels.map((v) => ({
      v,
      label: `${v.toFixed(2).replace(/0$/, '')}g`,
      frac: (BASELINE_Y - v * unitPerG) / VIEW_H,
    })),
    zeroFrac: BASELINE_Y / VIEW_H,
  };
}

/**
 * Plot telanjang: seismogram sintetik yang diturunkan dari PGA permukaan.
 * Angka PGA-nya sendiri ditampilkan sekali oleh pemanggil, bukan di sini.
 */
export function SeismicPlot({ property }) {
  const reduceMotion = useReducedMotion();
  const pga = Number(property?.geotech?.pga_surface ?? property?.geotech?.pga);
  const wave = useMemo(() => buildWaveform(pga), [pga]);

  const drawTransition = reduceMotion ? { duration: 0 } : { duration: DRAW_S, ease: EASE_DRAW };
  const pgaText = pga.toFixed(2);

  return (
    <div>
      <div
        className="sp-wrap"
        role="img"
        aria-label={`Seismogram sintetik dengan PGA permukaan ${pgaText.replace('.', ',')} g`}
      >
        <div className="sp-gutter" aria-hidden>
          {wave.ticks.map((tick) => (
            <div key={tick.label} className="sp-tick" style={{ top: `${tick.frac * 100}%` }}>
              <span className="sp-tick-label">{tick.label}</span>
              <span className="sp-tick-dash" />
            </div>
          ))}
          <div className="sp-tick sp-tick-zero" style={{ top: `${wave.zeroFrac * 100}%` }}>
            <span className="sp-tick-label">0</span>
            <span className="sp-tick-dash" />
          </div>
        </div>

        <div className="sp-canvas" aria-hidden>
          <svg className="w-full" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="none">
            {wave.levels.map((v) => (
              <g key={`g-${v}`}>
                <line
                  x1="0"
                  y1={BASELINE_Y - v * wave.unitPerG}
                  x2={VIEW_W}
                  y2={BASELINE_Y - v * wave.unitPerG}
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                  className="sp-grid"
                />
                <line
                  x1="0"
                  y1={BASELINE_Y + v * wave.unitPerG}
                  x2={VIEW_W}
                  y2={BASELINE_Y + v * wave.unitPerG}
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                  className="sp-grid"
                />
              </g>
            ))}
            {[1, 2, 3, 4, 5].map((s) => (
              <line
                key={`gv-${s}`}
                x1={s * 100}
                y1="6"
                x2={s * 100}
                y2={VIEW_H - 6}
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
                className="sp-grid"
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
              className="sp-base"
            />

            <motion.path
              d={wave.d}
              className="sp-trace"
              strokeWidth="2.5"
              vectorEffect="non-scaling-stroke"
              style={{ opacity: 0.22 }}
              initial={{ pathLength: reduceMotion ? 1 : 0 }}
              animate={{ pathLength: 1 }}
              transition={drawTransition}
            />
            <motion.path
              d={wave.d}
              className="sp-trace"
              strokeWidth="1.1"
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: reduceMotion ? 1 : 0 }}
              animate={{ pathLength: 1 }}
              transition={drawTransition}
            />
          </svg>

          {[
            { label: 'P', at: T_P },
            { label: 'S', at: T_S },
          ].map((phase) => (
            <motion.span
              key={phase.label}
              className="sp-phase"
              style={{ left: `${(phase.at / DURATION_S) * 100}%` }}
              initial={{ opacity: reduceMotion ? 1 : 0 }}
              animate={{ opacity: 1 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.4, delay: DRAW_S * 0.8 }}
            >
              {phase.label}
            </motion.span>
          ))}
        </div>
      </div>

      <div className="sp-time" aria-hidden>
        {Array.from({ length: 4 }, (_, k) => {
          const second = k * 2;
          return (
            <span
              key={second}
              className={cn(
                'sp-time-tick',
                k === 0 && 'sp-time-tick-first',
                k === 3 && 'sp-time-tick-last',
              )}
              style={{ left: `${(second / DURATION_S) * 100}%` }}
            >
              {second}s
            </span>
          );
        })}
      </div>
    </div>
  );
}
