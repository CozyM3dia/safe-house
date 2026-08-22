import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Radar as RadarIcon } from 'lucide-react';

import { Card, CardHeader, CardTitle } from '../ui/card';
import { useT } from '../../hooks/useTranslation';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../lib/utils';
import { RADAR_AXES, buildRadarData, clampRadarValue } from './analysis-data';
import './analysis-deck.css';

const W = 340;
const H = 196;
const CX = W / 2;
const CY = 100;
const R = 66;
const LABEL_R = R + 16;
const SECTOR_R = R + 22;
const LEVELS = [25, 50, 75, 100];

const clampVal = clampRadarValue;
const radOf = (i) => ((i * 72 - 90) * Math.PI) / 180;
const pxAt = (i, r) => CX + r * Math.cos(radOf(i));
const pyAt = (i, r) => CY + r * Math.sin(radOf(i));

/**
 * Plot telanjang: hanya gambarnya. Bingkai, judul, dan keterangan
 * disediakan pemanggil (AnalysisDeck) supaya tidak digambar tiga kali.
 */
export function RadarPlot({ propertyA, propertyB }) {
  const isEn = useAppStore((s) => s.lang) === 'en';
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(null);

  const a = useMemo(() => buildRadarData(propertyA), [propertyA]);
  const b = useMemo(() => (propertyB ? buildRadarData(propertyB) : null), [propertyB]);

  const valsA = RADAR_AXES.map((ax) => clampVal(a[ax.key]));
  const valsB = b ? RADAR_AXES.map((ax) => clampVal(b[ax.key])) : null;
  const keyA = valsA.join(',');
  const keyB = valsB ? valsB.join(',') : null;

  const geom = useMemo(() => {
    const polyPath = (vals) =>
      vals
        .map((v, i) => {
          const rr = (v / 100) * R;
          return `${i === 0 ? 'M' : 'L'}${pxAt(i, rr).toFixed(2)} ${pyAt(i, rr).toFixed(2)}`;
        })
        .join(' ') + ' Z';

    const dotsOf = (vals) =>
      vals.map((v, i) => ({
        i,
        cx: pxAt(i, (v / 100) * R).toFixed(2),
        cy: pyAt(i, (v / 100) * R).toFixed(2),
      }));

    let maxIdx = 0;
    valsA.forEach((v, i) => {
      if (v > valsA[maxIdx]) maxIdx = i;
    });

    return {
      rings: LEVELS.map((level) => ({
        level,
        d:
          RADAR_AXES.map((_, i) => {
            const x = pxAt(i, (level / 100) * R).toFixed(2);
            const y = pyAt(i, (level / 100) * R).toFixed(2);
            return `${i === 0 ? 'M' : 'L'}${x} ${y}`;
          }).join(' ') + ' Z',
      })),
      // Jari-jari berhenti sebelum cincin terluar. Kalau menyentuhnya, jaring
      // grid menutup jadi bentuk pentagon kedua yang bersaing dengan poligon
      // data — persis yang bikin garisnya terbaca "nyatu" dengan grafik.
      spokes: RADAR_AXES.map((_, i) => ({
        i,
        x1: pxAt(i, R * 0.16).toFixed(2),
        y1: pyAt(i, R * 0.16).toFixed(2),
        x2: pxAt(i, R * 0.88).toFixed(2),
        y2: pyAt(i, R * 0.88).toFixed(2),
        // Saat disorot, jari-jari berhenti tepat di titik datanya. Kalau
        // diteruskan sampai rim ia menonjol keluar poligon dan terbaca
        // sebagai garis data kedua.
        hotX: pxAt(i, (valsA[i] / 100) * R).toFixed(2),
        hotY: pyAt(i, (valsA[i] / 100) * R).toFixed(2),
      })),
      sectors: RADAR_AXES.map((_, i) => {
        const x1 = pxAt(i - 0.5, SECTOR_R);
        const y1 = pyAt(i - 0.5, SECTOR_R);
        const x2 = pxAt(i + 0.5, SECTOR_R);
        const y2 = pyAt(i + 0.5, SECTOR_R);
        return {
          i,
          d: `M${CX} ${CY} L${x1.toFixed(2)} ${y1.toFixed(2)} L${x2.toFixed(2)} ${y2.toFixed(2)} Z`,
        };
      }),
      labels: RADAR_AXES.map((ax, i) => {
        const lx = pxAt(i, LABEL_R);
        const ly = pyAt(i, LABEL_R);
        const below = Math.sin(radOf(i)) > 0.001;
        const cos = Math.cos(radOf(i));
        return {
          key: ax.key,
          x: Number(lx.toFixed(2)),
          nameY: Number((below ? ly + 5 : ly - 7).toFixed(2)),
          valY: Number((below ? ly + 16 : ly + 4).toFixed(2)),
          anchor: i === 0 ? 'middle' : cos > 0.01 ? 'start' : 'end',
        };
      }),
      polyA: polyPath(valsA),
      polyB: valsB ? polyPath(valsB) : null,
      dotsA: dotsOf(valsA),
      dotsB: valsB ? dotsOf(valsB) : null,
      maxIdx,
    };
    // Nilai sumbu diringkas jadi keyA/keyB: array valsA/valsB dibuat ulang
    // tiap render, jadi memakainya sebagai dependensi akan membatalkan memo
    // setiap saat.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyA, keyB]);

  const axisName = (ax) => (isEn ? ax.en : ax.id);
  const ariaLabel =
    `${isEn ? 'Five-axis hazard radar' : 'Radar bahaya lima sumbu'}: ` +
    RADAR_AXES.map((ax, i) => `${axisName(ax).toLowerCase()} ${Math.round(valsA[i])}`).join(', ') +
    (valsB
      ? `. ${isEn ? 'Site B' : 'Lokasi B'}: ` +
        RADAR_AXES.map((ax, i) => `${axisName(ax).toLowerCase()} ${Math.round(valsB[i])}`).join(', ')
      : '') +
    `. ${isEn ? 'Scale 0 to 100.' : 'Skala 0 sampai 100.'}`;

  const spring = reduceMotion
    ? { duration: 0 }
    : { type: 'spring', stiffness: 140, damping: 18, mass: 0.8 };

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="select-none"
      role="img"
      aria-label={ariaLabel}
      onMouseLeave={() => setActive(null)}
    >
      <g className={active != null ? 'rp-dim' : undefined}>
        {geom.rings.map((ring) => (
          <path
            key={`ring-${ring.level}`}
            d={ring.d}
            className={ring.level === 100 ? 'rp-ring rp-ring-outer' : 'rp-ring'}
          />
        ))}
      </g>
      <g>
        {geom.spokes.map((sp) => (
          <line
            key={`spoke-${sp.i}`}
            x1={sp.x1}
            y1={sp.y1}
            x2={active === sp.i ? sp.hotX : sp.x2}
            y2={active === sp.i ? sp.hotY : sp.y2}
            className={cn(
              'rp-spoke',
              active === sp.i && 'rp-spoke-hot',
              active != null && active !== sp.i && 'rp-dim',
            )}
          />
        ))}
      </g>

      <motion.g
        style={{ transformBox: 'view-box', transformOrigin: `${CX}px ${CY}px` }}
        initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={spring}
        pointerEvents="none"
      >
        {geom.polyB && <path d={geom.polyB} className="rp-poly-b" />}
        <path d={geom.polyA} className="rp-poly" />
        {geom.dotsB?.map((dot) => (
          <circle key={`db-${dot.i}`} cx={dot.cx} cy={dot.cy} r="2" className="rp-dot-b" />
        ))}
        {geom.dotsA.map((dot) => (
          <circle
            key={`da-${dot.i}`}
            cx={dot.cx}
            cy={dot.cy}
            r={dot.i === active ? 4 : dot.i === geom.maxIdx ? 3.4 : 2.4}
            className={cn('rp-dot', active != null && active !== dot.i && 'rp-dim')}
          />
        ))}
      </motion.g>

      {geom.labels.map((lb, i) => (
        <g
          key={`label-${lb.key}`}
          className={cn(
            'rp-label',
            active === i && 'rp-hot',
            active == null && i === geom.maxIdx && 'rp-max',
            active != null && active !== i && 'rp-dim',
          )}
          pointerEvents="none"
        >
          <text x={lb.x} y={lb.nameY} textAnchor={lb.anchor} className="rp-name">
            {axisName(RADAR_AXES[i])}
          </text>
          <text x={lb.x} y={lb.valY} textAnchor={lb.anchor} className="rp-val">
            {Math.round(valsA[i])}
            {valsB && (
              <tspan className="rp-val-b" dx="3">
                ·{Math.round(valsB[i])}
              </tspan>
            )}
          </text>
        </g>
      ))}

      {geom.sectors.map((sec) => (
        <path
          key={`sector-${sec.i}`}
          d={sec.d}
          className="rp-sector"
          tabIndex={0}
          role="img"
          aria-label={`${axisName(RADAR_AXES[sec.i])} ${Math.round(valsA[sec.i])}`}
          onMouseEnter={() => setActive(sec.i)}
          onFocus={() => setActive(sec.i)}
          onBlur={() => setActive(null)}
        />
      ))}
    </svg>
  );
}

/**
 * Kartu mandiri — dipakai halaman laporan publik, yang tidak punya
 * pemilih kanal. Di panel audit radar tampil lewat AnalysisDeck.
 */
export function RadarCard({ propertyA, propertyB }) {
  const t = useT();
  if (!propertyA?.hazard?.radar) return null;

  return (
    <Card className="instr">
      <CardHeader className="mb-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-accent/25 bg-accent/10 text-accent">
            <RadarIcon className="h-3 w-3" strokeWidth={2.25} />
          </span>
          <CardTitle>{t('deck.radar')}</CardTitle>
        </div>
        <span className="instr-eyebrow shrink-0">{t('deck.scale')}</span>
      </CardHeader>
      <div className="instr-plot">
        <RadarPlot propertyA={propertyA} propertyB={propertyB} />
      </div>
      {propertyB ? (
        <div className="instr-meta">
          <span className="rp-key">
            <span className="rp-key-dot rp-key-dot-a" aria-hidden />
            {t('battle.siteA')}
          </span>
          <span className="rp-key">
            <span className="rp-key-dot rp-key-dot-b" aria-hidden />
            {t('battle.siteB')}
          </span>
        </div>
      ) : (
        <p className="instr-meta">{t('deck.radarMeta')}</p>
      )}
    </Card>
  );
}
