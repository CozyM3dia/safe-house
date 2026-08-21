import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { useAppStore, targetSlotFor } from '../../store/useAppStore';

/**
 * Konfirmasi titik sebelum audit dijalankan.
 *
 * Yang dikonfirmasi adalah koordinatnya, jadi plat koordinat dijadikan
 * satu-satunya tokoh besar di kartu — digambar sebagai jendela instrumen
 * survei: graticule halus, reticle yang mengunci ke tengah saat kartu
 * muncul, lalu angka lintang/bujur dalam notasi belahan bumi. Daftar
 * parameter yang dulu jadi satu kalimat cetak-kecil dua baris kini berupa
 * lajur bergaris, supaya isinya bisa dipindai, bukan cuma dibaca sekilas.
 */

const COMPUTES = {
  id: ['Vs30', 'Kelas situs', 'PGA SNI 1726', 'FS likuefaksi', 'Banjir & longsor', 'Sesar terdekat'],
  en: ['Vs30', 'Site class', 'SNI 1726 PGA', 'Liquefaction FS', 'Flood & landslide', 'Nearest fault'],
};

// Tanda minus di depan lintang tidak memberi tahu apa pun kepada pembaca
// non-teknis. Notasi belahan bumi ("5.44731° LS") adalah cara koordinat
// dibacakan di lapangan, dan panjangnya sama.
function splitCoordinate(value, axis, isEn) {
  const south = axis === 'lat' && value < 0;
  const north = axis === 'lat' && value >= 0;
  const west = axis === 'lon' && value < 0;

  let hemisphere;
  if (north) hemisphere = isEn ? 'N' : 'LU';
  else if (south) hemisphere = isEn ? 'S' : 'LS';
  else if (west) hemisphere = isEn ? 'W' : 'BB';
  else hemisphere = isEn ? 'E' : 'BT';

  return { number: Math.abs(value).toFixed(5), hemisphere };
}

const EASE_OUT = [0.16, 1, 0.3, 1];

const draw = (still, delay, duration = 0.6) =>
  still
    ? { initial: false }
    : {
        initial: { pathLength: 0, opacity: 0 },
        animate: { pathLength: 1, opacity: 1 },
        transition: { duration, delay, ease: EASE_OUT },
      };

/**
 * Latar plat koordinat: graticule yang memudar ke tepi plus kurung sudut.
 *
 * Versi lama memasang reticle statis pada opacity 0.09 di dalam kotak yang
 * lebih pendek dari viewBox-nya, jadi yang tampil cuma potongan busur di sisi
 * kanan — terbaca sebagai cacat render. Reticle-nya sekarang pindah ke
 * jahitan pembatas (lihat SeamReticle) supaya tidak menimpa angka.
 */
function Graticule() {
  const grid = [];
  for (let x = 16; x < 320; x += 16) {
    grid.push(<line key={`v${x}`} x1={x} y1="0" x2={x} y2="112" stroke="var(--acd-grid)" strokeWidth="0.4" />);
  }
  for (let y = 16; y < 112; y += 16) {
    grid.push(<line key={`h${y}`} x1="0" y1={y} x2="320" y2={y} stroke="var(--acd-grid)" strokeWidth="0.4" />);
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 320 112"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 h-full w-full"
      fill="none"
    >
      <defs>
        <radialGradient id="acd-fade" cx="50%" cy="50%" r="66%">
          <stop offset="0%" stopColor="#fff" stopOpacity="1" />
          <stop offset="54%" stopColor="#fff" stopOpacity="0.62" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id="acd-mask">
          <rect width="320" height="112" fill="url(#acd-fade)" />
        </mask>
        <radialGradient id="acd-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(var(--safe-accent))" stopOpacity="0.16" />
          <stop offset="100%" stopColor="hsl(var(--safe-accent))" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="160" cy="56" r="64" fill="url(#acd-glow)" />
      <g mask="url(#acd-mask)">{grid}</g>

      {/* Kurung sudut — bingkai bidik, penanda bahwa ini bidang pembacaan. */}
      <g stroke="hsl(var(--safe-accent))" strokeOpacity="0.45" strokeWidth="1.1" strokeLinecap="round">
        <path d="M10 21V10h11" />
        <path d="M310 21V10h-11" />
        <path d="M10 91v11h11" />
        <path d="M310 91v11h-11" />
      </g>
    </svg>
  );
}

/**
 * Reticle di titik temu kedua sumbu bacaan. Ia duduk tepat di garis pembatas
 * lintang/bujur — vertikal saat berdampingan, horizontal saat menumpuk —
 * jadi pembatas itu sendiri yang jadi silang bidik.
 */
function SeamReticle({ still }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 40 40"
      className="pointer-events-none absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2"
      fill="none"
      stroke="hsl(var(--safe-accent))"
      strokeLinecap="round"
    >
      <motion.circle cx="20" cy="20" r="11" strokeWidth="1" strokeOpacity="0.5" {...draw(still, 0.24, 0.7)} />
      <motion.circle cx="20" cy="20" r="3.2" strokeWidth="1.2" strokeOpacity="0.85" {...draw(still, 0.4, 0.4)} />
      {[
        [20, 3, 20, 8],
        [20, 32, 20, 37],
        [3, 20, 8, 20],
        [32, 20, 37, 20],
      ].map(([x1, y1, x2, y2]) => (
        <motion.line
          key={`${x1}-${y1}`}
          x1={x1} y1={y1} x2={x2} y2={y2}
          strokeWidth="1.2" strokeOpacity="0.6"
          {...draw(still, 0.46, 0.32)}
        />
      ))}
    </svg>
  );
}

export function AuditConfirmDialog() {
  const pendingAudit = useAppStore((s) => s.pendingAudit);
  const confirmPendingAudit = useAppStore((s) => s.confirmPendingAudit);
  const cancelPendingAudit = useAppStore((s) => s.cancelPendingAudit);
  const lang = useAppStore((s) => s.lang);
  const mode = useAppStore((s) => s.mode);
  const propertyA = useAppStore((s) => s.propertyA);
  const propertyB = useAppStore((s) => s.propertyB);
  const armedSlot = useAppStore((s) => s.armedSlot);
  const confirmButtonRef = useRef(null);
  const previousFocusRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const hasPendingAudit = Boolean(pendingAudit);

  useEffect(() => {
    if (!hasPendingAudit) return undefined;
    previousFocusRef.current = document.activeElement;
    const frame = window.requestAnimationFrame(() => confirmButtonRef.current?.focus());
    return () => {
      window.cancelAnimationFrame(frame);
      previousFocusRef.current?.focus?.();
      previousFocusRef.current = null;
    };
  }, [hasPendingAudit]);

  // Enter mengonfirmasi, Escape membatalkan.
  useEffect(() => {
    if (!pendingAudit) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cancelPendingAudit();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        confirmPendingAudit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pendingAudit, confirmPendingAudit, cancelPendingAudit]);

  if (typeof document === 'undefined') return null;

  const isEn = lang === 'en';
  // Label slot mengikuti resolveSlot() lewat helper yang sama, bukan menebak
  // dari `isBattlePin` saja — dulu klik tanpa arm selalu berlabel "Lokasi A"
  // padahal slot tujuannya bisa B.
  const slot = pendingAudit?.isBattlePin
    ? 'B'
    : targetSlotFor({ mode, propertyA, propertyB, armedSlot });
  const slotLabel = slot
    ? slot === 'B'
      ? isEn ? 'Site B' : 'Lokasi B'
      : isEn ? 'Site A' : 'Lokasi A'
    : null;

  const axes = pendingAudit
    ? [
        {
          key: 'lat',
          label: isEn ? 'Latitude' : 'Lintang',
          ...splitCoordinate(pendingAudit.lat, 'lat', isEn),
        },
        {
          key: 'lon',
          label: isEn ? 'Longitude' : 'Bujur',
          ...splitCoordinate(pendingAudit.lng, 'lon', isEn),
        },
      ]
    : [];

  const rise = reduceMotion
    ? { initial: false }
    : {
        initial: { opacity: 0, y: 8, filter: 'blur(5px)' },
        animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
      };

  return createPortal(
    <AnimatePresence>
      {pendingAudit && (
        <div className="acd safe-inset-x fixed inset-y-0 z-[9999] flex items-center justify-center p-3 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={cancelPendingAudit}
            className="absolute inset-0 bg-bg/80 backdrop-blur-md"
          />

          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.965, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 10 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="audit-confirm-title"
            className="acd-card acd-grain relative isolate flex max-h-[calc(100dvh-1.5rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] w-full max-w-[420px] flex-col overflow-hidden rounded-[20px]"
          >
            {/* Aksen atas */}
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent"
            />

            <div className="relative z-10 flex min-h-0 flex-col">
              {/* ── Kepala ── */}
              <div className="flex items-start gap-3 px-5 pt-4 sm:px-6 sm:pt-5">
                <div className="min-w-0 flex-1">
                  {/* Penanda slot hanya relevan di mode bandingkan; di mode
                      audit barisnya hilang sama sekali. */}
                  {slotLabel && (
                    <motion.span
                      {...rise}
                      transition={{ duration: 0.4, delay: 0.04, ease: EASE_OUT }}
                      className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/[0.10] py-0.5 pl-2 pr-2.5 font-data text-[10px] font-semibold uppercase tracking-[0.14em] text-accent"
                    >
                      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />
                      {slotLabel}
                    </motion.span>
                  )}
                  <motion.h3
                    id="audit-confirm-title"
                    {...rise}
                    transition={{ duration: 0.45, delay: 0.06, ease: EASE_OUT }}
                    className="acd-title text-[27px] leading-[1.06] text-text-primary sm:text-[30px]"
                  >
                    Audit{' '}
                    <span className="italic text-accent">
                      {isEn ? 'this location' : 'lokasi ini'}
                    </span>
                    ?
                  </motion.h3>
                </div>

                <button
                  type="button"
                  onClick={cancelPendingAudit}
                  className="acd-focus -mr-2 -mt-1.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-accent/[0.10] hover:text-text-primary"
                  aria-label={isEn ? 'Cancel' : 'Batal'}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 pt-4 sm:px-6">
                {/* ── Plat koordinat ── */}
                <motion.div
                  {...rise}
                  transition={{ duration: 0.5, delay: 0.1, ease: EASE_OUT }}
                  className="acd-plate relative overflow-hidden rounded-2xl"
                >
                  <Graticule />

                  <div className="relative grid grid-cols-1 min-[392px]:grid-cols-2">
                    <SeamReticle still={Boolean(reduceMotion)} />
                    {axes.map((axis, index) => (
                      <div
                        key={axis.key}
                        className={
                          index === 1
                            ? 'acd-hair border-t px-4 py-3 min-[392px]:border-l min-[392px]:border-t-0 sm:px-5 sm:py-4'
                            : 'px-4 py-3 sm:px-5 sm:py-4'
                        }
                      >
                        <span className="acd-eyebrow block text-[9.5px]">{axis.label}</span>
                        <span className="mt-2 flex items-baseline gap-1 font-data text-[19px] font-semibold leading-none tabular-nums tracking-tight text-text-primary sm:text-[21px]">
                          {axis.number}
                          <span className="text-[12px] font-medium tracking-normal text-accent">
                            °<span className="ml-[0.15em]">{axis.hemisphere}</span>
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* ── Apa yang dihitung ── */}
                <motion.div
                  {...rise}
                  transition={{ duration: 0.5, delay: 0.16, ease: EASE_OUT }}
                  className="mt-5"
                >
                  <span className="acd-eyebrow">
                    {isEn ? 'This audit computes' : 'Audit ini menghitung'}
                  </span>
                  <ul className="acd-hair mt-2.5 grid grid-cols-2 gap-x-4 border-t">
                    {(isEn ? COMPUTES.en : COMPUTES.id).map((item) => (
                      <li
                        key={item}
                        className="acd-hair flex items-center gap-2 border-b py-2 text-[12px] leading-tight text-text-secondary"
                      >
                        <span
                          aria-hidden="true"
                          className="h-[3px] w-[3px] shrink-0 rotate-45 bg-accent/70"
                        />
                        <span className="min-w-0">{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </div>

              {/* ── Aksi ── */}
              <div className="acd-hair flex shrink-0 items-center gap-2.5 border-t px-5 py-4 sm:px-6">
                <button
                  type="button"
                  onClick={cancelPendingAudit}
                  className="acd-ghost acd-focus flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 text-[13px] font-semibold text-text-secondary transition-colors hover:text-text-primary"
                >
                  {isEn ? 'Cancel' : 'Batal'}
                  <kbd className="acd-kbd hidden rounded px-1.5 py-1 font-data text-[9px] font-semibold uppercase leading-none tracking-wider text-text-muted sm:inline-block">
                    Esc
                  </kbd>
                </button>

                <button
                  type="button"
                  ref={confirmButtonRef}
                  onClick={confirmPendingAudit}
                  className="acd-cta acd-focus flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl px-5 text-[13px] font-bold"
                >
                  {isEn ? 'Start audit' : 'Mulai audit'}
                  <kbd className="acd-kbd-cta hidden rounded px-1.5 py-1 font-data text-[10px] font-semibold leading-none sm:inline-block">
                    &#8629;
                  </kbd>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
