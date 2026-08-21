import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAppStore, targetSlotFor } from '../../store/useAppStore';
import { cn } from '../../lib/utils';

/**
 * Konfirmasi titik sebelum audit dijalankan.
 *
 * Yang dikonfirmasi adalah koordinatnya, jadi koordinat itulah satu-satunya
 * elemen besar di kartu. Sisanya ditahan sekecil mungkin: eyebrow "Konfirmasi
 * Titik" dulu hanya mengulang judul, dan daftar parameter berbentuk chip
 * membungkus jadi tiga baris bergerigi untuk informasi yang sifatnya cuma
 * penegas. Keduanya diringkas jadi satu baris teks redup.
 */

const PARAMETERS = {
  id: 'Vs30 · kelas situs · PGA SNI 1726 · FS likuefaksi · banjir & longsor · sesar terdekat',
  en: 'Vs30 · site class · SNI 1726 PGA · liquefaction FS · flood & landslide · nearest fault',
};

export function AuditConfirmDialog() {
  const pendingAudit = useAppStore((s) => s.pendingAudit);
  const confirmPendingAudit = useAppStore((s) => s.confirmPendingAudit);
  const cancelPendingAudit = useAppStore((s) => s.cancelPendingAudit);
  const lang = useAppStore((s) => s.lang);
  const mode = useAppStore((s) => s.mode);
  const propertyA = useAppStore((s) => s.propertyA);
  const propertyB = useAppStore((s) => s.propertyB);
  const armedSlot = useAppStore((s) => s.armedSlot);
  const theme = useAppStore((s) => s.theme);
  const confirmButtonRef = useRef(null);
  const previousFocusRef = useRef(null);
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
  const isLight = theme === 'light';
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

  const hairline = isLight ? 'border-[rgba(91,67,48,0.14)]' : 'border-white/10';

  return createPortal(
    <AnimatePresence>
      {pendingAudit && (
        <div className="safe-inset-x fixed inset-y-0 z-[9999] flex items-center justify-center p-3 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={cancelPendingAudit}
            className="absolute inset-0 bg-bg/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="audit-confirm-title"
            className={cn(
              'relative isolate max-h-[calc(100dvh-1.5rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] w-full max-w-[400px] overflow-y-auto overscroll-contain rounded-2xl backdrop-blur-2xl',
              isLight
                ? 'border border-[rgba(91,67,48,0.18)] bg-[rgba(250,244,236,0.98)] shadow-[0_24px_64px_rgba(91,67,48,0.24)]'
                : 'border border-white/[0.09] bg-[#15100c] shadow-[0_28px_80px_rgba(0,0,0,0.75)]',
            )}
          >
            {/* Aksen atas */}
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent"
            />

            {/* ── Kepala ── */}
            <div className="flex items-start justify-between gap-3 px-5 pb-4 pt-4">
              <div className="min-w-0">
                {/* Penanda slot hanya relevan di mode bandingkan; di mode audit
                    barisnya hilang sama sekali dan judul naik ke atas. */}
                {slotLabel && (
                  <span className="mb-2 inline-block rounded border border-accent/30 bg-accent/10 px-1.5 py-px font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-accent">
                    {slotLabel}
                  </span>
                )}
                <h3
                  id="audit-confirm-title"
                  className="font-sans text-[21px] font-semibold leading-[1.1] tracking-[-0.03em] text-text-primary"
                >
                  {isEn ? 'Audit this location?' : 'Audit lokasi ini?'}
                </h3>
              </div>
              <button
                type="button"
                onClick={cancelPendingAudit}
                className={cn(
                  '-mr-1.5 -mt-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:text-text-primary',
                  isLight ? 'hover:bg-[rgba(91,67,48,0.08)]' : 'hover:bg-white/10',
                )}
                aria-label={isEn ? 'Cancel' : 'Batal'}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* ── Pembacaan koordinat ── */}
            <div className="px-5">
              <div
                className={cn(
                  'relative overflow-hidden rounded-xl border',
                  isLight
                    ? 'border-[rgba(91,67,48,0.14)] bg-[rgba(91,67,48,0.05)]'
                    : 'border-white/[0.09] bg-white/[0.035]',
                )}
              >
                {/* Reticle latar */}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 200 100"
                  className="pointer-events-none absolute inset-0 h-full w-full text-accent/[0.09]"
                  fill="none"
                >
                  <circle cx="100" cy="50" r="34" stroke="currentColor" strokeWidth="0.6" />
                  <circle cx="100" cy="50" r="9" stroke="currentColor" strokeWidth="0.6" />
                  <line x1="100" y1="6" x2="100" y2="94" stroke="currentColor" strokeWidth="0.6" strokeDasharray="2 5" />
                  <line x1="6" y1="50" x2="194" y2="50" stroke="currentColor" strokeWidth="0.6" strokeDasharray="2 5" />
                </svg>

                <div className="relative grid grid-cols-2">
                  {[
                    ['Latitude', pendingAudit.lat],
                    ['Longitude', pendingAudit.lng],
                  ].map(([label, value], index) => (
                    <div
                      key={label}
                      className={cn(
                        'px-4 py-3.5',
                        index === 1 && (isLight ? 'border-l border-[rgba(91,67,48,0.14)]' : 'border-l border-white/[0.08]'),
                      )}
                    >
                      <span className="block font-mono text-[8.5px] font-bold uppercase tracking-[0.2em] text-text-muted">
                        {label}
                      </span>
                      <span className="mt-1.5 block font-mono text-[19px] font-bold leading-none tabular-nums text-accent">
                        {value.toFixed(5)}
                        <span className="text-[13px] font-normal opacity-70">°</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Apa yang dihitung ── */}
            <p className="px-5 pt-3.5 text-[10.5px] leading-[1.6] text-text-muted">
              <span className="font-medium text-text-secondary">
                {isEn ? 'Computes:' : 'Dihitung:'}
              </span>{' '}
              {isEn ? PARAMETERS.en : PARAMETERS.id}
            </p>

            {/* ── Aksi ── */}
            <div className={cn('mt-4 flex items-center gap-2 border-t px-5 py-3.5', hairline)}>
              <button
                type="button"
                onClick={cancelPendingAudit}
                className={cn(
                  'flex min-h-[44px] items-center justify-center rounded-xl px-4 text-xs font-semibold text-text-secondary transition-all hover:text-text-primary active:scale-[0.98]',
                  isLight
                    ? 'border border-[rgba(91,67,48,0.14)] bg-[rgba(91,67,48,0.045)] hover:bg-[rgba(91,67,48,0.08)]'
                    : 'border border-white/12 bg-white/[0.04] hover:bg-white/10',
                )}
              >
                {isEn ? 'Cancel' : 'Batal'}
                <kbd
                  className={cn(
                    'ml-2 hidden rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase leading-none tracking-wider text-text-muted sm:inline-block',
                    isLight ? 'bg-[rgba(91,67,48,0.08)]' : 'bg-white/[0.07]',
                  )}
                >
                  Esc
                </kbd>
              </button>

              <button
                type="button"
                ref={confirmButtonRef}
                onClick={confirmPendingAudit}
                className={cn(
                  'flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-accent bg-accent px-5 text-xs font-bold shadow-[0_6px_24px_-6px_rgba(212,149,106,0.7)] transition-all hover:bg-accent-hover hover:shadow-[0_8px_28px_-6px_rgba(212,149,106,0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:scale-[0.98]',
                  isLight ? 'text-[#30241d]' : 'text-bg',
                )}
              >
                {isEn ? 'Start audit' : 'Mulai audit'}
                <kbd className="hidden rounded bg-black/[0.14] px-1.5 py-0.5 font-mono text-[10px] font-semibold leading-none sm:inline-block">
                  &#8629;
                </kbd>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
