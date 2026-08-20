import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Zap, X, Crosshair } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../lib/utils';

export function AuditConfirmDialog() {
  const pendingAudit = useAppStore((s) => s.pendingAudit);
  const confirmPendingAudit = useAppStore((s) => s.confirmPendingAudit);
  const cancelPendingAudit = useAppStore((s) => s.cancelPendingAudit);
  const lang = useAppStore((s) => s.lang);
  const mode = useAppStore((s) => s.mode);
  const theme = useAppStore((s) => s.theme);

  // Keyboard accessibility: Enter to confirm, Escape to cancel
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
  const isBattle = mode === 'battle' || Boolean(pendingAudit?.isBattlePin);

  return createPortal(
    <AnimatePresence>
      {pendingAudit && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={cancelPendingAudit}
            className="absolute inset-0 bg-bg/80 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 14 }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            role="dialog"
            aria-modal="true"
            className={cn(
              'relative w-full max-w-md overflow-hidden rounded-2xl p-6 backdrop-blur-2xl',
              theme === 'light'
                ? 'border border-[rgba(91,67,48,0.18)] bg-[rgba(248,241,231,0.98)] shadow-[0_24px_64px_rgba(91,67,48,0.24)]'
                : 'border border-accent/40 bg-[#16100c] shadow-2xl shadow-black/90',
            )}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={cancelPendingAudit}
              className={cn(
                'absolute right-3.5 top-3.5 flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:text-text-primary',
                theme === 'light' ? 'hover:bg-[rgba(91,67,48,0.08)]' : 'hover:bg-white/10',
              )}
              aria-label={isEn ? 'Cancel' : 'Batal'}
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header Icon */}
            <div className="mb-4 flex items-center gap-3">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-accent/40 bg-accent/15 shadow-[0_0_15px_rgba(212,149,106,0.2)]">
                <Crosshair className="h-6 w-6 text-accent animate-pulse" />
                <div className="absolute inset-0 rounded-xl bg-accent/10 blur-sm" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-md border border-accent/30 bg-accent/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-accent">
                    <MapPin className="h-2.5 w-2.5" />
                    {isBattle
                      ? (pendingAudit.isBattlePin ? (isEn ? 'Site B (Comparison)' : 'Lokasi B (Pembanding)') : (isEn ? 'Site A' : 'Lokasi A'))
                      : (isEn ? 'Target Location' : 'Titik Target')}
                  </span>
                </div>
                <h3 className="mt-1 font-display text-base font-bold text-text-primary">
                  {isEn ? 'Confirm Location Audit' : 'Konfirmasi Audit Lokasi'}
                </h3>
              </div>
            </div>

            {/* Question / Description */}
            <div className="mb-5 space-y-3 text-xs leading-relaxed text-text-secondary">
              <p className="font-medium text-text-primary text-sm">
                {isEn
                  ? 'Are you sure you want to audit this location?'
                  : 'Apakah Anda yakin ingin mengaudit lokasi ini?'}
              </p>

              {/* Coordinates Card */}
              <div className={cn(
                'flex items-center justify-between rounded-xl px-4 py-3 font-mono text-xs',
                theme === 'light'
                  ? 'border border-[rgba(91,67,48,0.14)] bg-[rgba(91,67,48,0.045)]'
                  : 'border border-white/10 bg-white/[0.04]',
              )}>
                <div>
                  <span className="block text-[9px] font-sans font-medium uppercase tracking-wider text-text-muted">
                    Latitude
                  </span>
                  <span className="font-bold text-accent">{pendingAudit.lat.toFixed(5)}°</span>
                </div>
                <div className={cn('h-6 w-px', theme === 'light' ? 'bg-[rgba(91,67,48,0.14)]' : 'bg-white/10')} />
                <div className="text-right">
                  <span className="block text-[9px] font-sans font-medium uppercase tracking-wider text-text-muted">
                    Longitude
                  </span>
                  <span className="font-bold text-accent">{pendingAudit.lng.toFixed(5)}°</span>
                </div>
              </div>

              <p className="text-[11px] text-text-muted leading-normal">
                {isEn
                  ? 'S.A.F.E House will compute geotechnical soil stability, SNI 1726 seismic amplification, and InaRISK hazard layers for these coordinates.'
                  : 'S.A.F.E House akan menganalisis stabilitas geoteknik, amplifikasi seismik SNI 1726, serta layer bahaya InaRISK untuk koordinat ini.'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className={cn(
              'flex items-center justify-end gap-3 border-t pt-3',
              theme === 'light' ? 'border-[rgba(91,67,48,0.14)]' : 'border-white/10',
            )}>
              <button
                type="button"
                onClick={cancelPendingAudit}
                className={cn(
                  'flex items-center justify-center rounded-xl px-4 py-2 text-xs font-semibold text-text-secondary transition-all hover:text-text-primary active:scale-95 cursor-pointer',
                  theme === 'light'
                    ? 'border border-[rgba(91,67,48,0.14)] bg-[rgba(91,67,48,0.045)] hover:border-[rgba(91,67,48,0.25)] hover:bg-[rgba(91,67,48,0.08)]'
                    : 'border border-white/12 bg-white/[0.04] hover:border-white/25 hover:bg-white/10',
                )}
              >
                {isEn ? 'Cancel' : 'Batal'}
              </button>
              <button
                type="button"
                onClick={confirmPendingAudit}
                className={cn(
                  'flex items-center gap-1.5 rounded-xl border border-[#d4956a] bg-[#d4956a] px-5 py-2 text-xs font-bold shadow-[0_0_20px_rgba(212,149,106,0.35)] transition-all hover:bg-[#e4a87e] hover:shadow-[0_0_25px_rgba(212,149,106,0.55)] active:scale-95 cursor-pointer',
                  theme === 'light' ? 'text-[#30241d] hover:text-[#30241d]' : 'text-bg hover:text-bg',
                )}
              >
                <Zap className={cn('h-3.5 w-3.5', theme === 'light' ? 'fill-[#30241d] text-[#30241d]' : 'fill-bg text-bg')} />
                <span>{isEn ? 'Audit This Location' : 'Audit Lokasi Sekarang'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
