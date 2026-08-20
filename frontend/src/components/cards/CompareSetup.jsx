import {
  Check,
  MapPin,
  X,
  ArrowLeftRight,
  Loader2,
  FileText,
  ChevronRight,
  Lock,
} from 'lucide-react';

import { useAppStore } from '../../store/useAppStore';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { riskHex, comparisonLabels } from '../../lib/utils';

/**
 * Penyiapan perbandingan dalam tiga langkah eksplisit.
 *
 * Menggantikan toggle tersembunyi yang lama: pengguna kini selalu melihat di
 * langkah mana ia berada, dan punya jalan keluar yang jelas dari mode pemilihan
 * peta lewat tombol Batal.
 */
export function CompareSetup({
  propertyA,
  propertyB,
  loading,
  onGenerateReport,
  onOpenReport,
  reportContent,
  reportLoading,
}) {
  const armedSlot = useAppStore((s) => s.armedSlot);
  const armSlot = useAppStore((s) => s.armSlot);
  const clearPropertyB = useAppStore((s) => s.clearPropertyB);
  const swapSites = useAppStore((s) => s.swapSites);
  const toggleLeftPanel = useAppStore((s) => s.toggleLeftPanel);
  const leftPanelOpen = useAppStore((s) => s.leftPanelOpen);

  const bothReady = Boolean(propertyA && propertyB);

  // Di bawah breakpoint `sm`, panel ini menutupi seluruh peta. Menyuruh
  // pengguna "klik peta" sambil menutupi petanya adalah jalan buntu, jadi panel
  // menyingkir begitu sebuah slot di-arm. Panel terbuka lagi sendiri saat audit
  // selesai (processLocation menyetel leftPanelOpen).
  const arm = (slot) => {
    armSlot(slot);
    const isNarrow =
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 639px)').matches;
    if (slot && isNarrow && leftPanelOpen) toggleLeftPanel();
  };

  // Slot yang sedang diaudit — cerminan resolveSlot() di store. Dipakai untuk
  // menaruh indikator progres di langkah yang bersangkutan, bukan mengganti
  // seluruh stepper dengan skeleton dan menghilangkan konteks.
  const loadingSlot = loading ? (!propertyA ? 'A' : armedSlot ?? 'A') : null;

  const [labelA, labelB] = comparisonLabels(propertyA, propertyB);

  return (
    <Card className="p-3">
      <ol className="flex flex-col">
        <Step
          index={1}
          label="Lokasi A"
          displayLabel={labelA}
          property={propertyA}
          armed={armedSlot === 'A'}
          loading={loadingSlot === 'A'}
          active={!propertyA}
          onArm={() => arm('A')}
          onCancel={() => armSlot(null)}
        />

        {bothReady && (
          <li className="flex justify-center py-0.5">
            <button
              type="button"
              onClick={swapSites}
              title="Tukar Lokasi A dan B"
              aria-label="Tukar Lokasi A dan B"
              className="flex h-6 items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted transition-colors hover:border-white/20 hover:text-text-secondary"
            >
              <ArrowLeftRight className="h-2.5 w-2.5" />
              Tukar
            </button>
          </li>
        )}

        <Step
          index={2}
          label="Lokasi B"
          displayLabel={labelB}
          property={propertyB}
          armed={armedSlot === 'B'}
          loading={loadingSlot === 'B'}
          active={Boolean(propertyA) && !propertyB}
          disabled={!propertyA}
          disabledHint="Pilih Lokasi A dulu"
          onArm={() => arm('B')}
          onCancel={() => armSlot(null)}
          onRemove={clearPropertyB}
        />

        {/* ── Langkah 3: laporan ── */}
        <li className="flex gap-2.5 pt-2">
          <Marker done={Boolean(reportContent)} active={bothReady && !reportContent} index={3} />

          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
              Laporan Perbandingan
            </span>

            <div className="mt-1.5">
              {!bothReady && (
                <p className="flex items-center gap-1.5 text-[10px] text-text-muted">
                  <Lock className="h-2.5 w-2.5 shrink-0" />
                  Terkunci sampai kedua lokasi siap
                </p>
              )}

              {bothReady && !reportContent && (
                <Button
                  onClick={onGenerateReport}
                  size="sm"
                  className="w-full"
                  disabled={reportLoading}
                >
                  {reportLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Membuat laporan…
                    </>
                  ) : (
                    <>
                      <FileText className="h-3.5 w-3.5" />
                      Buat Laporan Perbandingan
                    </>
                  )}
                </Button>
              )}

              {bothReady && reportContent && (
                <Button onClick={onOpenReport} size="sm" className="group w-full">
                  <FileText className="h-3.5 w-3.5" />
                  Lihat Laporan
                  <ChevronRight className="ml-auto h-3 w-3 opacity-50 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                </Button>
              )}
            </div>
          </div>
        </li>
      </ol>
    </Card>
  );
}

// ── Satu langkah pemilihan lokasi ────────────────────────────────
function Step({
  index,
  label,
  displayLabel,
  property,
  armed,
  loading,
  active,
  disabled,
  disabledHint,
  onArm,
  onCancel,
  onRemove,
}) {
  const filled = Boolean(property);
  const score = Number.isFinite(property?.safe_score) ? property.safe_score : null;
  const hex = score === null ? null : riskHex(score);

  return (
    <li className="flex gap-2.5 py-1">
      <Marker done={filled && !loading} active={active || armed || loading} index={index} />

      <div className="min-w-0 flex-1">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
          {label}
        </span>

        {loading ? (
          <p
            className="mt-2 flex items-center gap-2 text-[10px] text-accent"
            role="status"
            aria-live="polite"
          >
            <Skeleton as="span" className="h-2.5 w-24 rounded" />
            <span className="sr-only">Menganalisis {label}…</span>
          </p>
        ) : filled ? (
          <div className="mt-1 flex items-center gap-2">
            {score !== null && (
              <span
                className="data-num shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold"
                style={{ color: hex, backgroundColor: `${hex}1a` }}
              >
                {score}
              </span>
            )}
            <p
              className="min-w-0 flex-1 truncate text-[11px] text-text-secondary"
              title={property.address}
            >
              {displayLabel}
            </p>

            <div className="flex shrink-0 items-center gap-1">
              {armed ? (
                <StepAction onClick={onCancel} tone="danger">
                  Batal
                </StepAction>
              ) : (
                <StepAction onClick={onArm}>Ganti</StepAction>
              )}
              {onRemove && !armed && (
                <StepAction onClick={onRemove} tone="danger" title={`Hapus ${label}`}>
                  <X className="h-2.5 w-2.5" />
                </StepAction>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-1.5">
            {disabled ? (
              <p className="text-[10px] text-text-muted">{disabledHint}</p>
            ) : armed ? (
              <div className="flex items-center gap-2">
                <span className="flex min-w-0 flex-1 items-center gap-1.5 text-[10px] text-accent">
                  <span className="pulse-dot shrink-0" />
                  Klik peta untuk {label}…
                </span>
                <StepAction onClick={onCancel} tone="danger">
                  Batal
                </StepAction>
              </div>
            ) : (
              <Button variant="secondary" size="sm" className="w-full" onClick={onArm}>
                <MapPin className="h-3.5 w-3.5" />
                Pilih {label} di peta
              </Button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

function StepAction({ children, onClick, tone, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={[
        'flex h-5 items-center rounded px-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] transition-colors',
        tone === 'danger'
          ? 'text-risk-danger hover:bg-risk-danger/10 hover:text-risk-danger'
          : 'text-text-muted hover:bg-white/8 hover:text-text-primary',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

// ── Penanda urutan langkah ───────────────────────────────────────
function Marker({ index, done, active }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={[
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold transition-colors',
          done
            ? 'border-risk-safe/40 bg-risk-safe/15 text-risk-safe'
            : active
              ? 'border-accent/50 bg-accent/15 text-accent'
              : 'border-white/10 bg-white/[0.03] text-text-muted',
        ].join(' ')}
      >
        {done ? <Check className="h-2.5 w-2.5" /> : index}
      </div>
      <div className="mt-1 w-px flex-1 bg-white/6" />
    </div>
  );
}
