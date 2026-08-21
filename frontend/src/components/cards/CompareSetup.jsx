import {
  MapPin,
  X,
  ArrowLeftRight,
  Loader2,
  FileText,
  ChevronRight,
  Check,
} from 'lucide-react';

import { useAppStore } from '../../store/useAppStore';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { riskHex, riskLabel, comparisonLabels, hazardBand, cn } from '../../lib/utils';

/**
 * Penyiapan perbandingan dua lokasi.
 *
 * Kartu ini hanya mengurus pemilihan titik: dua slot bernomor, penanda
 * kemajuan, dan satu aksi lanjutan. Penilaian "mana yang lebih aman"
 * sepenuhnya milik VerdictCard, sehingga tidak ada dua komponen yang
 * menjawab pertanyaan yang sama dengan cara berbeda.
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
  const lang = useAppStore((s) => s.lang);
  const isEn = lang === 'en';

  const bothReady = Boolean(propertyA && propertyB);
  const filledCount = (propertyA ? 1 : 0) + (propertyB ? 1 : 0);

  // Di bawah breakpoint `sm`, panel ini menutupi seluruh peta.
  const arm = (slot) => {
    armSlot(slot);
    const isNarrow =
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 639px)').matches;
    if (slot && isNarrow && leftPanelOpen) toggleLeftPanel();
  };

  const loadingSlot = loading ? (!propertyA ? 'A' : armedSlot ?? 'A') : null;
  const [labelA, labelB] = comparisonLabels(propertyA, propertyB);

  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.09] bg-bg-surface/70 backdrop-blur-sm">
      {/* ── Kepala: judul + kemajuan pemilihan ── */}
      <header className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-3">
        <h3 className="font-mono text-[9.5px] font-bold uppercase tracking-[0.2em] text-text-secondary">
          {isEn ? 'Site selection' : 'Pemilihan Lokasi'}
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1" aria-hidden="true">
            {['A', 'B'].map((s) => (
              <span
                key={s}
                className={cn(
                  'h-1.5 w-4 rounded-full transition-colors duration-300',
                  (s === 'A' ? propertyA : propertyB)
                    ? 'bg-accent'
                    : 'bg-white/12'
                )}
              />
            ))}
          </div>
          <span className="font-mono text-[10px] font-bold tabular-nums text-text-muted">
            {filledCount}/2
          </span>
        </div>
      </header>

      <div className="p-3">
        <LocationSlot
          slot="A"
          label={isEn ? 'Site A' : 'Lokasi A'}
          displayLabel={labelA}
          property={propertyA}
          armed={armedSlot === 'A'}
          loading={loadingSlot === 'A'}
          lang={lang}
          onArm={() => arm('A')}
          onCancel={() => armSlot(null)}
        />

        {/* ── Konektor: garis vertikal, "vs" atau tombol tukar ── */}
        <div className="relative flex h-9 items-center justify-center">
          <span
            className="absolute left-[22px] top-0 h-full w-px bg-gradient-to-b from-white/12 via-white/8 to-white/12"
            aria-hidden="true"
          />
          {bothReady ? (
            <button
              type="button"
              onClick={swapSites}
              title={isEn ? 'Swap Site A and Site B' : 'Tukar Lokasi A dan B'}
              aria-label={isEn ? 'Swap Site A and Site B' : 'Tukar Lokasi A dan B'}
              className="group/swap relative z-10 flex h-7 items-center gap-1.5 rounded-full border border-white/12 bg-bg-elevated px-3 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-text-secondary transition-all hover:border-accent/45 hover:bg-accent/12 hover:text-accent active:scale-95"
            >
              <ArrowLeftRight className="h-3 w-3 text-accent transition-transform duration-300 group-hover/swap:rotate-180" />
              {isEn ? 'Swap' : 'Tukar'}
            </button>
          ) : (
            <span className="relative z-10 rounded-full bg-bg-surface px-2 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-text-muted">
              vs
            </span>
          )}
        </div>

        <LocationSlot
          slot="B"
          label={isEn ? 'Site B' : 'Lokasi B'}
          displayLabel={labelB}
          property={propertyB}
          armed={armedSlot === 'B'}
          loading={loadingSlot === 'B'}
          locked={!propertyA}
          lang={lang}
          onArm={() => arm('B')}
          onCancel={() => armSlot(null)}
          onRemove={clearPropertyB}
        />
      </div>

      {/* ── Aksi ── */}
      <div className="border-t border-white/[0.07] p-3">
        {bothReady && reportContent ? (
          <Button
            onClick={onOpenReport}
            size="lg"
            variant="secondary"
            className="group h-11 w-full justify-between rounded-xl border-accent/30 bg-accent/10 px-3.5 text-xs font-semibold text-accent hover:bg-accent/[0.18]"
          >
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {isEn ? 'View comparison report' : 'Lihat laporan perbandingan'}
            </span>
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        ) : (
          <Button
            onClick={onGenerateReport}
            size="lg"
            variant={bothReady ? 'accent' : 'secondary'}
            disabled={!bothReady || reportLoading}
            className={cn(
              'h-11 w-full justify-center rounded-xl text-xs font-bold tracking-wide',
              bothReady
                ? 'shadow-glow'
                : 'cursor-not-allowed border-white/8 bg-white/[0.02] font-medium tracking-normal text-text-muted opacity-100'
            )}
          >
            {reportLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isEn ? 'Generating…' : 'Menyusun…'}
              </>
            ) : bothReady ? (
              <>
                <FileText className="mr-1.5 h-4 w-4" />
                {isEn ? 'Compare both sites' : 'Bandingkan kedua lokasi'}
              </>
            ) : (
              <>
                {propertyA
                  ? isEn
                    ? 'Select Site B to compare'
                    : 'Pilih Lokasi B untuk membandingkan'
                  : isEn
                    ? 'Select Site A to begin'
                    : 'Pilih Lokasi A untuk memulai'}
              </>
            )}
          </Button>
        )}
      </div>
    </section>
  );
}

// ── Slot lokasi ──────────────────────────────────────────────────
function LocationSlot({
  slot,
  label,
  displayLabel,
  property,
  armed,
  loading,
  locked,
  lang,
  onArm,
  onCancel,
  onRemove,
}) {
  const isEn = lang === 'en';
  const filled = Boolean(property);
  const score = Number.isFinite(property?.safe_score) ? property.safe_score : null;
  const hex = score === null ? null : riskHex(score);
  const flood = hazardBand(property?.hazard?.flood_label);

  const state = loading ? 'loading' : armed ? 'armed' : filled ? 'filled' : locked ? 'locked' : 'empty';

  const railColor = {
    loading: 'bg-accent/60',
    armed: 'bg-accent',
    filled: null, // diwarnai skor
    locked: 'bg-white/8',
    empty: 'bg-white/15',
  }[state];

  return (
    <div
      onClick={state === 'empty' ? onArm : undefined}
      className={cn(
        'group relative flex items-stretch gap-3 overflow-hidden rounded-xl border pl-0 pr-3 transition-all duration-200',
        state === 'empty' &&
          'cursor-pointer border-dashed border-white/15 bg-white/[0.015] hover:border-accent/40 hover:bg-accent/[0.045]',
        state === 'locked' && 'border-dashed border-white/[0.07] bg-white/[0.008]',
        state === 'armed' &&
          'border-accent/45 bg-accent/[0.07] shadow-[0_0_20px_-4px_rgba(212,149,106,0.35)]',
        state === 'loading' && 'border-accent/25 bg-white/[0.02]',
        state === 'filled' && 'border-white/10 bg-white/[0.028] hover:border-white/[0.18]'
      )}
    >
      {/* Rel status di tepi kiri */}
      <span
        aria-hidden="true"
        className={cn('w-[3px] shrink-0 rounded-r-sm', railColor)}
        style={state === 'filled' && hex ? { backgroundColor: hex } : undefined}
      />

      <div className="flex min-w-0 flex-1 flex-col justify-center py-3">
        {/* Baris label */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded font-mono text-[10px] font-bold leading-none',
              state === 'locked'
                ? 'bg-white/[0.05] text-text-muted'
                : state === 'filled'
                  ? 'bg-white/[0.08] text-text-primary'
                  : 'bg-accent/20 text-accent'
            )}
          >
            {slot}
          </span>
          <span
            className={cn(
              'font-mono text-[9.5px] font-bold uppercase tracking-[0.16em]',
              state === 'locked' ? 'text-text-muted' : state === 'filled' ? 'text-text-muted' : 'text-accent'
            )}
          >
            {label}
          </span>
          {state === 'filled' && property.geotech?.site_class && (
            <span className="rounded border border-white/10 bg-white/[0.05] px-1.5 py-px font-mono text-[8.5px] font-semibold leading-[1.4] text-text-secondary">
              {property.geotech.site_class}
            </span>
          )}
          {state === 'filled' && (
            <Check className="ml-auto h-3 w-3 shrink-0 text-risk-safe/70" />
          )}
        </div>

        {/* Isi per state */}
        {state === 'loading' && (
          <div className="mt-2 space-y-1.5">
            <Skeleton className="h-3 w-3/4 rounded" />
            <Skeleton className="h-2.5 w-1/2 rounded" />
          </div>
        )}

        {state === 'armed' && (
          <p className="mt-1.5 flex items-center gap-2 text-[11.5px] font-medium text-accent">
            <span className="pulse-dot shrink-0" />
            {isEn ? 'Click a point on the map…' : 'Klik titik di peta…'}
          </p>
        )}

        {state === 'empty' && (
          <p className="mt-1 text-[12px] font-medium text-text-secondary transition-colors group-hover:text-text-primary">
            {isEn ? 'Click the map to place a pin' : 'Klik peta untuk menaruh pin'}
          </p>
        )}

        {state === 'locked' && (
          <p className="mt-1 text-[12px] text-text-muted">
            {isEn ? 'Unlocks after Site A' : 'Terbuka setelah Lokasi A'}
          </p>
        )}

        {state === 'filled' && (
          <>
            <p
              className="mt-1.5 truncate text-[12.5px] font-semibold leading-snug text-text-primary"
              title={property.address}
            >
              {displayLabel}
            </p>
            <div className="mt-1.5 flex items-center gap-2.5">
              {score !== null && (
                <span className="flex shrink-0 items-baseline gap-1">
                  <span
                    className="font-mono text-[15px] font-bold leading-none tabular-nums"
                    style={{ color: hex }}
                  >
                    {score}
                  </span>
                  <span
                    className="font-mono text-[8px] font-bold uppercase tracking-[0.12em]"
                    style={{ color: hex }}
                  >
                    {riskLabel(score, lang)}
                  </span>
                </span>
              )}
              {score !== null && (
                <span className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
                  <span
                    className="block h-full rounded-full transition-[width] duration-700 ease-out"
                    style={{ width: `${score}%`, backgroundColor: hex }}
                  />
                </span>
              )}
            </div>
            {Number.isFinite(property.lat) &&
              Number.isFinite(property.lon ?? property.lng) && (
                <p className="mt-1.5 truncate font-mono text-[9.5px] text-text-muted">
                  {property.lat.toFixed(4)}, {(property.lon ?? property.lng).toFixed(4)}
                  {flood.band ? ` · ${isEn ? 'flood' : 'banjir'} ${flood.band.toLowerCase()}` : ''}
                  {flood.provisional ? ' (est.)' : ''}
                </p>
              )}
          </>
        )}
      </div>

      {/* Aksi kanan */}
      <div className="flex shrink-0 items-center gap-1.5 py-3">
        {state === 'armed' && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-risk-danger/30 bg-risk-danger/10 px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-wider text-risk-danger transition-colors hover:bg-risk-danger/20"
          >
            {isEn ? 'Cancel' : 'Batal'}
          </button>
        )}

        {state === 'empty' && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.09] bg-white/[0.04] text-text-muted transition-colors group-hover:border-accent/35 group-hover:bg-accent/10 group-hover:text-accent">
            <MapPin className="h-3.5 w-3.5" />
          </span>
        )}

        {state === 'filled' && (
          <>
            <button
              type="button"
              onClick={onArm}
              className="flex h-7 items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 text-[10px] font-semibold text-text-secondary transition-colors hover:border-accent/35 hover:bg-accent/10 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              <MapPin className="h-2.5 w-2.5" />
              {isEn ? 'Change' : 'Ganti'}
            </button>
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                title={isEn ? `Remove ${label}` : `Hapus ${label}`}
                aria-label={isEn ? `Remove ${label}` : `Hapus ${label}`}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-text-muted transition-colors hover:border-risk-danger/40 hover:bg-risk-danger/10 hover:text-risk-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-risk-danger/70"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
