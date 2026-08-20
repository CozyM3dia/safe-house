import {
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
import { riskHex, riskLabel, comparisonLabels, cn } from '../../lib/utils';

/**
 * Penyiapan perbandingan dua lokasi (Dual-Slot Comparison Card).
 *
 * Mengusung arsitektur slot A & B yang tegas, terstruktur, dan elegan
 * dengan indikator skor visual, konektor tukar lokasi yang presisi,
 * dan tombol aksi laporan komparatif berstandar impeccable.
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

  const bothReady = Boolean(propertyA && propertyB);

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
    <Card className="flex flex-col gap-2.5 p-3.5">
      {/* ── Slot Lokasi A ── */}
      <LocationSlot
        slot="A"
        label={lang === 'en' ? 'Site A' : 'Lokasi A'}
        displayLabel={labelA}
        property={propertyA}
        armed={armedSlot === 'A'}
        loading={loadingSlot === 'A'}
        active={!propertyA}
        lang={lang}
        onArm={() => arm('A')}
        onCancel={() => armSlot(null)}
      />

      {/* ── Konektor Tukar Lokasi ── */}
      {bothReady && (
        <div className="relative my-0.5 flex items-center justify-center py-1">
          <div className="absolute inset-x-0 h-px bg-white/8" />
          <button
            type="button"
            onClick={swapSites}
            title={lang === 'en' ? 'Swap Site A and Site B' : 'Tukar Lokasi A dan B'}
            aria-label={lang === 'en' ? 'Swap Site A and Site B' : 'Tukar Lokasi A dan B'}
            className="relative z-10 flex h-7 items-center gap-1.5 rounded-full border border-white/12 bg-bg-surface/95 px-3 font-mono text-[9px] font-bold tracking-[0.14em] text-text-secondary shadow-sm backdrop-blur-md transition-all hover:border-accent/40 hover:bg-accent/10 hover:text-accent active:scale-95"
          >
            <ArrowLeftRight className="h-3 w-3 text-accent" />
            <span>{lang === 'en' ? 'SWAP SITES' : 'TUKAR LOKASI'}</span>
          </button>
        </div>
      )}

      {/* ── Slot Lokasi B ── */}
      <LocationSlot
        slot="B"
        label={lang === 'en' ? 'Site B' : 'Lokasi B'}
        displayLabel={labelB}
        property={propertyB}
        armed={armedSlot === 'B'}
        loading={loadingSlot === 'B'}
        active={Boolean(propertyA) && !propertyB}
        disabled={!propertyA}
        disabledHint={lang === 'en' ? 'Select Site A first' : 'Pilih Lokasi A dulu'}
        lang={lang}
        onArm={() => arm('B')}
        onCancel={() => armSlot(null)}
        onRemove={clearPropertyB}
      />

      {/* ── Sintesis & Laporan Perbandingan ── */}
      <div className="mt-1 border-t border-white/8 pt-3">
        {!bothReady && (
          <div className="flex items-center gap-2.5 rounded-xl border border-white/6 bg-white/[0.015] px-3 py-2.5 text-text-muted">
            <Lock className="h-3.5 w-3.5 shrink-0 text-accent/60" />
            <p className="text-[11px] leading-snug">
              {lang === 'en'
                ? 'Select both locations to unlock comparison analysis'
                : 'Lengkapi kedua lokasi untuk membuka analisis perbandingan'}
            </p>
          </div>
        )}

        {bothReady && !reportContent && (
          <div className="space-y-2">
            <Button
              onClick={onGenerateReport}
              size="lg"
              variant="accent"
              className="group h-11 w-full justify-center rounded-xl text-xs font-bold tracking-wide shadow-glow"
              disabled={reportLoading}
            >
              {reportLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{lang === 'en' ? 'Generating comparison…' : 'Membuat laporan perbandingan…'}</span>
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-1.5" />
                  <span>{lang === 'en' ? 'Generate Comparison Report' : 'Buat Laporan Perbandingan'}</span>
                </>
              )}
            </Button>
            <p className="text-center font-mono text-[8.5px] tracking-wider text-text-muted">
              {lang === 'en'
                ? 'AI-grounded geotechnical & hazard synthesis'
                : 'Sintesis geoteknik & risiko bencana berbasis AI'}
            </p>
          </div>
        )}

        {bothReady && reportContent && (
          <Button
            onClick={onOpenReport}
            size="lg"
            variant="secondary"
            className="group h-11 w-full justify-between rounded-xl border-accent/30 bg-accent/10 px-3.5 text-xs font-semibold text-accent hover:bg-accent/18"
          >
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>{lang === 'en' ? 'View Comparison Report' : 'Lihat Laporan Perbandingan'}</span>
            </span>
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        )}
      </div>
    </Card>
  );
}

// ── Komponen Slot Lokasi Terstruktur ─────────────────────────────
function LocationSlot({
  slot,
  label,
  displayLabel,
  property,
  armed,
  loading,
  disabled,
  disabledHint,
  lang,
  onArm,
  onCancel,
  onRemove,
}) {
  const filled = Boolean(property);
  const score = Number.isFinite(property?.safe_score) ? property.safe_score : null;
  const hex = score === null ? null : riskHex(score);

  if (loading) {
    return (
      <div className="rounded-xl border border-accent/25 bg-white/[0.02] p-3 shadow-inner">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md border border-accent/30 bg-accent/10 font-mono text-[10px] font-bold text-accent">
              {slot}
            </span>
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-accent">
              {label}
            </span>
          </div>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
        </div>
        <div className="mt-2.5 space-y-1.5">
          <Skeleton className="h-3 w-3/4 rounded" />
          <Skeleton className="h-2.5 w-1/2 rounded" />
        </div>
      </div>
    );
  }

  if (armed) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-accent/40 bg-accent/[0.06] p-3 shadow-[0_0_16px_rgba(212,149,106,0.1)]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md border border-accent/40 bg-accent/20 font-mono text-[10px] font-bold text-accent">
              {slot}
            </span>
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-accent">
              {label}
            </span>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-risk-danger/30 bg-risk-danger/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-risk-danger transition-colors hover:bg-risk-danger/20"
          >
            {lang === 'en' ? 'Cancel' : 'Batal'}
          </button>
        </div>
        <div className="mt-2.5 flex items-center gap-2 text-[11px] font-medium text-accent">
          <span className="pulse-dot shrink-0" />
          <span>{lang === 'en' ? `Click map for ${label}…` : `Klik titik di peta untuk ${label}…`}</span>
        </div>
      </div>
    );
  }

  if (filled) {
    return (
      <div className="group relative rounded-xl border border-white/10 bg-white/[0.025] p-3 transition-all hover:border-white/20 hover:bg-white/[0.04]">
        <div className="flex items-center justify-between gap-2 border-b border-white/6 pb-2">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md border border-white/12 bg-white/5 font-mono text-[10px] font-bold text-text-primary">
              {slot}
            </span>
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted">
              {label}
            </span>
            {property.geotech?.site_class && (
              <span className="rounded border border-white/8 bg-white/5 px-1 py-0.2 font-mono text-[8.5px] font-semibold text-text-muted">
                {property.geotech.site_class}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onArm}
              className="flex h-6 items-center gap-1 rounded-md border border-white/10 bg-white/[0.035] px-2 text-[10px] font-semibold text-text-secondary transition-colors hover:border-accent/30 hover:bg-accent/8 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              <MapPin className="h-2.5 w-2.5 text-accent/70" />
              <span>{lang === 'en' ? 'Change' : 'Ganti'}</span>
            </button>
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                title={lang === 'en' ? `Remove ${label}` : `Hapus ${label}`}
                aria-label={lang === 'en' ? `Remove ${label}` : `Hapus ${label}`}
                className="flex h-6 w-6 items-center justify-center rounded-md border border-white/10 bg-white/[0.035] text-text-muted transition-colors hover:border-risk-danger/40 hover:bg-risk-danger/10 hover:text-risk-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-risk-danger/70"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        <div className="mt-2.5 flex items-center gap-3">
          {score !== null && (
            <div
              className="flex h-10 min-w-11 shrink-0 flex-col items-center justify-center rounded-lg border font-mono leading-tight shadow-sm"
              style={{
                color: hex,
                backgroundColor: `${hex}14`,
                borderColor: `${hex}33`,
              }}
            >
              <span className="text-sm font-bold">{score}</span>
              <span className="text-[7.5px] font-semibold tracking-wider opacity-85">
                {riskLabel(score, lang)}
              </span>
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p
              className="truncate text-xs font-semibold leading-snug text-text-primary"
              title={property.address}
            >
              {displayLabel}
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-text-muted">
              {Number.isFinite(property.lat) && Number.isFinite(property.lon ?? property.lng) && (
                <span className="font-mono">
                  {property.lat.toFixed(3)}, {(property.lon ?? property.lng).toFixed(3)}
                </span>
              )}
              {property.hazard?.flood_label && (
                <span className="truncate opacity-75">· {property.hazard.flood_label}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={!disabled ? onArm : undefined}
      className={cn(
        'group flex min-h-[62px] items-center justify-between rounded-xl border border-dashed p-3 transition-all',
        disabled
          ? 'cursor-not-allowed border-white/8 bg-white/[0.01] opacity-60'
          : 'cursor-pointer border-white/15 bg-white/[0.018] hover:border-accent/40 hover:bg-accent/[0.04]'
      )}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-lg border font-mono text-[10px] font-bold',
            disabled
              ? 'border-white/8 bg-white/[0.02] text-text-muted'
              : 'border-accent/25 bg-accent/8 text-accent group-hover:scale-105 transition-transform'
          )}
        >
          {slot}
        </span>
        <div className="min-w-0">
          <p
            className={cn(
              'text-xs font-semibold',
              disabled ? 'text-text-muted' : 'text-text-secondary group-hover:text-text-primary'
            )}
          >
            {disabled
              ? disabledHint
              : lang === 'en'
                ? `Select ${label} on map`
                : `Pilih ${label} di peta`}
          </p>
          <p className="text-[10px] text-text-muted">
            {disabled
              ? lang === 'en'
                ? 'Step 1 required first'
                : 'Langkah 1 diperlukan'
              : lang === 'en'
                ? 'Click map to place pin'
                : 'Klik peta untuk menaruh pin'}
          </p>
        </div>
      </div>

      {!disabled ? (
        <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/8 bg-white/5 text-text-muted transition-colors group-hover:border-accent/30 group-hover:text-accent">
          <MapPin className="h-3.5 w-3.5" />
        </span>
      ) : (
        <Lock className="h-3.5 w-3.5 text-text-muted" />
      )}
    </div>
  );
}
