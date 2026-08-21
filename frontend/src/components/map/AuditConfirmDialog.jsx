import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { MapPin, X } from 'lucide-react';
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

const STAGE_VARIANTS = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.24, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.18, ease: 'easeIn' },
  },
};

const BACKDROP_VARIANTS = {
  hidden: { opacity: 0, backdropFilter: 'blur(0px)' },
  visible: {
    opacity: 1,
    backdropFilter: 'blur(10px)',
    transition: { duration: 0.46, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    backdropFilter: 'blur(0px)',
    transition: { duration: 0.16, ease: 'easeIn' },
  },
};

const CARD_VARIANTS = {
  hidden: {
    opacity: 0,
    y: 24,
    scale: 0.95,
    rotateX: 5,
    filter: 'blur(8px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    filter: 'blur(0px)',
    transition: {
      type: 'spring',
      damping: 27,
      stiffness: 310,
      mass: 0.78,
      delay: 0.04,
    },
  },
  exit: {
    opacity: 0,
    y: 12,
    scale: 0.975,
    rotateX: -2,
    filter: 'blur(4px)',
    transition: { duration: 0.2, ease: EASE_OUT },
  },
};

const HEADER_VARIANTS = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, delay: 0.13, ease: EASE_OUT },
  },
  exit: { opacity: 0, y: 6, transition: { duration: 0.12 } },
};

const ADDRESS_VARIANTS = {
  hidden: { opacity: 0, y: -5, height: 0 },
  visible: {
    opacity: 1,
    y: 0,
    height: 'auto',
    transition: { duration: 0.38, delay: 0.04, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    y: -3,
    height: 0,
    transition: { duration: 0.16, ease: 'easeIn' },
  },
};

const PLATE_VARIANTS = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.52, delay: 0.2, ease: EASE_OUT },
  },
  exit: { opacity: 0, y: 8, scale: 0.98, transition: { duration: 0.14 } },
};

const DETAIL_VARIANTS = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.48, delay: 0.3, ease: EASE_OUT },
  },
  exit: { opacity: 0, y: 8, transition: { duration: 0.12 } },
};

const FOOTER_VARIANTS = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, delay: 0.38, ease: EASE_OUT },
  },
  exit: { opacity: 0, y: 6, transition: { duration: 0.12 } },
};

const AXIS_VARIANTS = {
  hidden: { opacity: 0, x: 0, y: 8, filter: 'blur(4px)' },
  visible: (index) => ({
    opacity: 1,
    x: 0,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.44, delay: 0.3 + index * 0.07, ease: EASE_OUT },
  }),
  exit: { opacity: 0, y: 5, transition: { duration: 0.1 } },
};

const LIST_VARIANTS = {
  hidden: {},
  visible: { transition: { delayChildren: 0.38, staggerChildren: 0.045 } },
  exit: { transition: { staggerChildren: 0.02, staggerDirection: -1 } },
};

const LIST_ITEM_VARIANTS = {
  hidden: { opacity: 0, x: -5 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.28, ease: EASE_OUT } },
  exit: { opacity: 0, x: -3, transition: { duration: 0.1 } },
};

const ART_VARIANTS = {
  hidden: { opacity: 0, scale: 1.04 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.7, delay: 0.23, ease: EASE_OUT } },
  exit: { opacity: 0, scale: 1.02, transition: { duration: 0.14 } },
};

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
    <motion.svg
      aria-hidden="true"
      viewBox="0 0 320 112"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 h-full w-full"
      fill="none"
      variants={ART_VARIANTS}
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
    </motion.svg>
  );
}

/** Kurung sudut plat — bingkai bidik, penanda bahwa ini bidang pembacaan. */
function CornerBrackets() {
  const corners = [
    'left-2.5 top-2.5 border-l border-t rounded-tl-[3px]',
    'right-2.5 top-2.5 border-r border-t rounded-tr-[3px]',
    'left-2.5 bottom-2.5 border-b border-l rounded-bl-[3px]',
    'right-2.5 bottom-2.5 border-b border-r rounded-br-[3px]',
  ];
  return corners.map((corner) => (
    <motion.span
      key={corner}
      aria-hidden="true"
      className={`pointer-events-none absolute h-2.5 w-2.5 ${corner}`}
      style={{ borderColor: 'hsl(var(--safe-accent) / 0.45)' }}
      variants={ART_VARIANTS}
    />
  ));
}

/**
 * Reticle di titik temu kedua sumbu bacaan. Ia duduk tepat di garis pembatas
 * lintang/bujur — vertikal saat berdampingan, horizontal saat menumpuk —
 * jadi pembatas itu sendiri yang jadi silang bidik.
 */
function SeamReticle({ still }) {
  return (
    <motion.svg
      aria-hidden="true"
      viewBox="0 0 40 40"
      // Pemusatan tidak boleh lewat `-translate-x/y-1/2`: Tailwind v3 menaruh
      // keduanya di properti `transform`, properti yang sama yang ditulis
      // Motion untuk `scale` di ART_VARIANTS. Transform inline itu menang,
      // pemusatannya hilang, dan reticle jatuh menimpa label "Bujur" di layar
      // sempit. Margin negatif setengah ukuran kotak (h-8/w-8 = 32px → 16px)
      // memberi hasil yang sama tanpa menyentuh `transform`.
      className="pointer-events-none absolute left-1/2 top-1/2 z-0 -ml-4 -mt-4 h-8 w-8 min-[392px]:relative min-[392px]:left-auto min-[392px]:top-auto min-[392px]:col-start-2 min-[392px]:row-start-1 min-[392px]:ml-0 min-[392px]:mt-0 min-[392px]:self-center min-[392px]:justify-self-center"
      fill="none"
      stroke="hsl(var(--safe-accent))"
      strokeLinecap="round"
      variants={ART_VARIANTS}
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
    </motion.svg>
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
  const address = typeof pendingAudit?.address === 'string'
    ? pendingAudit.address.trim()
    : '';

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

  const motionInitial = reduceMotion ? false : 'hidden';

  return createPortal(
    <AnimatePresence>
      {pendingAudit && (
        <motion.div
          className="acd safe-inset-x fixed inset-y-0 z-[9999] flex items-center justify-center p-3 sm:p-4"
          initial={motionInitial}
          animate="visible"
          exit="exit"
          variants={STAGE_VARIANTS}
          style={{ perspective: 1200 }}
        >
          <motion.div
            initial={motionInitial}
            animate="visible"
            exit="exit"
            variants={BACKDROP_VARIANTS}
            onClick={cancelPendingAudit}
            className="absolute inset-0 bg-bg/80 backdrop-blur-md"
          />

          <motion.div
            initial={motionInitial}
            animate="visible"
            exit="exit"
            variants={CARD_VARIANTS}
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
              <motion.div
                initial={motionInitial}
                animate="visible"
                exit="exit"
                variants={HEADER_VARIANTS}
                className="flex items-start gap-3 px-5 pt-4 sm:px-6 sm:pt-5"
              >
                <div className="min-w-0 flex-1">
                  {/* Penanda slot hanya relevan di mode bandingkan; di mode
                      audit barisnya hilang sama sekali. */}
                  {slotLabel && (
                    <motion.span
                      variants={HEADER_VARIANTS}
                      className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/[0.10] py-0.5 pl-2 pr-2.5 font-data text-[10px] font-semibold uppercase tracking-[0.14em] text-accent"
                    >
                      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />
                      {slotLabel}
                    </motion.span>
                  )}
                  <motion.h3
                    id="audit-confirm-title"
                    variants={HEADER_VARIANTS}
                    className="acd-title text-[27px] leading-[1.06] text-text-primary sm:text-[30px]"
                  >
                    Audit{' '}
                    <span className="italic text-accent">
                      {isEn ? 'this location' : 'lokasi ini'}
                    </span>
                    ?
                  </motion.h3>

                  <AnimatePresence initial={false}>
                    {address && (
                      <motion.div
                        initial={motionInitial}
                        animate="visible"
                        exit="exit"
                        variants={ADDRESS_VARIANTS}
                        className="acd-address mt-3 flex min-w-0 items-start gap-2 overflow-hidden rounded-lg px-2.5 py-2"
                        title={address}
                      >
                        <MapPin aria-hidden="true" className="acd-address-icon mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span className="line-clamp-2 min-w-0">{address}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  type="button"
                  onClick={cancelPendingAudit}
                  className="acd-focus -mr-2 -mt-1.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-accent/[0.10] hover:text-text-primary"
                  aria-label={isEn ? 'Cancel' : 'Batal'}
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 pt-4 sm:px-6">
                {/* ── Plat koordinat ── */}
                <motion.div
                  variants={PLATE_VARIANTS}
                  initial={motionInitial}
                  animate="visible"
                  exit="exit"
                  className="acd-plate relative overflow-hidden rounded-2xl"
                >
                  <Graticule />
                  <CornerBrackets />

                  <div className="relative grid grid-cols-1 min-[392px]:grid-cols-[minmax(0,1fr)_2.5rem_minmax(0,1fr)]">
                    <SeamReticle still={Boolean(reduceMotion)} />
                    {axes.map((axis, index) => (
                      <motion.div
                        key={axis.key}
                        custom={index}
                        variants={AXIS_VARIANTS}
                        initial={motionInitial}
                        animate="visible"
                        exit="exit"
                        className={
                          index === 1
                            ? 'acd-hair relative z-10 col-start-1 flex flex-col items-center border-t px-3 py-3 text-center min-[392px]:col-start-3 min-[392px]:border-t-0 sm:px-5 sm:py-4'
                            : 'relative z-10 col-start-1 flex flex-col items-center px-3 py-3 text-center min-[392px]:col-start-1 sm:px-5 sm:py-4'
                        }
                      >
                        <span className="acd-eyebrow block text-center text-[9.5px]">{axis.label}</span>
                        <span className="mt-2 flex whitespace-nowrap items-baseline justify-center font-data text-[18px] font-semibold leading-none tabular-nums tracking-[-0.02em] text-text-primary sm:text-[20px]">
                          {axis.number}
                          <span className="text-[11px] font-medium tracking-normal text-accent sm:text-[12px]">
                            °<span className="ml-[0.3em]">{axis.hemisphere}</span>
                          </span>
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* ── Apa yang dihitung ── */}
                <motion.div
                  variants={DETAIL_VARIANTS}
                  initial={motionInitial}
                  animate="visible"
                  exit="exit"
                  className="mt-5"
                >
                  <span className="acd-eyebrow">
                    {isEn ? 'This audit computes' : 'Audit ini menghitung'}
                  </span>
                  <motion.ul
                    variants={LIST_VARIANTS}
                    initial={motionInitial}
                    animate="visible"
                    exit="exit"
                    className="acd-hair mt-2.5 grid grid-cols-2 gap-x-4 border-t"
                  >
                    {(isEn ? COMPUTES.en : COMPUTES.id).map((item) => (
                      <motion.li
                        key={item}
                        variants={LIST_ITEM_VARIANTS}
                        className="acd-hair flex items-center gap-2 border-b py-2 text-[12px] leading-tight text-text-secondary"
                      >
                        <span
                          aria-hidden="true"
                          className="h-[3px] w-[3px] shrink-0 rotate-45 bg-accent/70"
                        />
                        <span className="min-w-0">{item}</span>
                      </motion.li>
                    ))}
                  </motion.ul>
                </motion.div>
              </div>

              {/* ── Aksi ── */}
              <motion.div
                variants={FOOTER_VARIANTS}
                initial={motionInitial}
                animate="visible"
                exit="exit"
                className="acd-hair flex shrink-0 items-center gap-2 border-t px-5 py-3.5 sm:px-6"
              >
                <button
                  type="button"
                  onClick={cancelPendingAudit}
                  aria-label={isEn ? 'Cancel' : 'Batal'}
                  className="acd-ghost acd-focus flex h-11 cursor-pointer select-none items-center justify-center gap-2 rounded-[10px] px-4 text-[12.5px] font-semibold transition-all active:scale-[0.98] sm:h-10"
                >
                  <span>{isEn ? 'Cancel' : 'Batal'}</span>
                  <kbd className="acd-kbd hidden rounded px-1.5 py-[3px] font-data text-[9px] font-semibold uppercase leading-none tracking-wider sm:inline-block">
                    Esc
                  </kbd>
                </button>

                <button
                  ref={confirmButtonRef}
                  type="button"
                  onClick={confirmPendingAudit}
                  aria-label={isEn ? 'Start audit' : 'Mulai audit'}
                  className="acd-cta acd-focus flex h-11 flex-1 cursor-pointer select-none items-center justify-center gap-2 rounded-[10px] px-4 text-[12.5px] font-bold transition-all active:scale-[0.98] sm:h-10"
                >
                  <span>{isEn ? 'Start audit' : 'Mulai audit'}</span>
                  <kbd className="acd-kbd-cta hidden rounded px-1.5 py-[3px] font-data text-[9.5px] font-semibold leading-none sm:inline-block">
                    &#8629;
                  </kbd>
                </button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
