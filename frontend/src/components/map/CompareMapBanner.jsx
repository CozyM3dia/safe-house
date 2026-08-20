import { motion, AnimatePresence } from 'framer-motion';
import { GitCompareArrows, MousePointerClick, X } from 'lucide-react';

import { useAppStore } from '../../store/useAppStore';

/**
 * Penanda mode bandingkan di atas peta.
 *
 * Tanpa ini, mode audit dan mode bandingkan terlihat identik begitu panel kiri
 * ditutup atau perhatian pengguna pindah ke peta: satu-satunya pembeda hanya
 * badge kecil di panel. Banner ini menyatakan mode yang aktif dan, saat sedang
 * menunggu klik, lokasi mana yang akan diisi.
 */
export function CompareMapBanner() {
  const mode = useAppStore((s) => s.mode);
  const armedSlot = useAppStore((s) => s.armedSlot);
  const armSlot = useAppStore((s) => s.armSlot);
  const propertyA = useAppStore((s) => s.propertyA);
  const propertyB = useAppStore((s) => s.propertyB);
  const pendingAudit = useAppStore((s) => s.pendingAudit);
  const loading = useAppStore((s) => s.loading);

  // Dialog konfirmasi sudah menjelaskan slot tujuannya sendiri — dua pesan
  // sekaligus hanya menambah bising.
  const suppressed = Boolean(pendingAudit) || loading;
  const visible = mode === 'battle' && !suppressed;

  // Slot yang akan terisi bila pengguna mengklik peta sekarang. Cerminan
  // resolveSlot() di store: tanpa Lokasi A, klik selalu mengisi A.
  const targetSlot = !propertyA ? 'A' : armedSlot;
  const bothReady = Boolean(propertyA && propertyB);

  return (
    // TopBar menempati ~72px teratas; menyamai offset LeftPanel supaya banner
    // tidak tersembunyi di belakangnya.
    <div className="pointer-events-none absolute inset-x-0 top-[76px] z-[16] flex justify-center px-4 max-[639px]:top-[calc(4.75rem+env(safe-area-inset-top))] max-[639px]:px-2">
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="glass pointer-events-auto flex max-w-full items-center gap-2.5 rounded-full border border-accent/25 py-1.5 pl-3 pr-2 shadow-lg max-[639px]:w-full max-[639px]:flex-wrap max-[639px]:items-start max-[639px]:rounded-2xl max-[639px]:px-3 max-[639px]:py-2"
          >
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-accent max-[639px]:w-full">
              <GitCompareArrows className="h-3 w-3" />
              Mode Bandingkan
            </span>

            <span className="h-3 w-px bg-white/12 max-[639px]:hidden" />

            {targetSlot ? (
              <>
                <span className="flex min-w-0 items-start gap-1.5 text-[11px] text-text-secondary max-[639px]:w-full">
                  <MousePointerClick className="h-3 w-3 shrink-0 text-accent" />
                  Klik peta untuk menempatkan{' '}
                  <strong className="font-semibold text-text-primary">
                    Lokasi {targetSlot}
                  </strong>
                </span>
                {/* Tanpa Lokasi A, klik peta memang selalu mengisi A — tidak
                    ada yang bisa dibatalkan, jadi tombolnya pun tak muncul. */}
                {armedSlot && (
                <button
                    type="button"
                    onClick={() => armSlot(null)}
                    aria-label="Batalkan pemilihan lokasi"
                    className="flex min-h-[32px] items-center gap-1 rounded-full px-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-text-muted transition-colors hover:bg-white/8 hover:text-text-primary max-[639px]:ml-auto"
                  >
                    <X className="h-2.5 w-2.5" />
                    Batal
                  </button>
                )}
              </>
            ) : (
              <span className="pr-1 text-[11px] text-text-secondary">
                {bothReady
                  ? 'Dua lokasi terpasang — lihat hasilnya di panel kiri'
                  : 'Pilih Lokasi B untuk mulai membandingkan'}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
