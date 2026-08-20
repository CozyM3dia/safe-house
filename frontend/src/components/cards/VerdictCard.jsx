import { ShieldCheck, Minus, Info } from 'lucide-react';

import { Card, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { riskHex, comparisonLabels } from '../../lib/utils';
import { compareAudits } from '../../lib/compare';

/**
 * Rekomendasi perbandingan dua lokasi.
 *
 * Menjawab "kenapa", bukan sekadar "siapa menang": setiap parameter SNI yang
 * membentuk skor ditampilkan berdampingan dengan penanda sisi yang lebih baik.
 * Semua angka deterministik — lihat lib/compare.js.
 */
export function VerdictCard({ propertyA, propertyB }) {
  if (!propertyA || !propertyB) return null;

  const result = compareAudits(propertyA, propertyB);
  const [labelA, labelB] = comparisonLabels(propertyA, propertyB);
  const { rows, winner, status, scoreA, scoreB, scoreDelta, reason, unknownLabels } = result;

  const verdictLabel =
    status === 'winner'
      ? `Lokasi ${winner} lebih aman`
      : status === 'tie'
        ? 'Setara'
        : 'Data tidak cukup';

  const verdictVariant =
    status === 'winner' ? 'safe' : status === 'tie' ? 'accent' : 'danger';

  return (
    <Card glow={status === 'winner' ? 'safe' : null}>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <ShieldCheck className="h-3 w-3 text-accent" />
          Rekomendasi
        </CardTitle>
        <Badge variant={verdictVariant}>{verdictLabel}</Badge>
      </CardHeader>

      {/* ── Baris skor utama ── */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2">
        <ScorePane
          side="A"
          label={labelA}
          address={propertyA.address}
          score={scoreA}
          isWinner={winner === 'A'}
          delta={winner === 'A' && scoreDelta !== null ? Math.abs(scoreDelta) : null}
        />
        <div className="flex items-center justify-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
            vs
          </span>
        </div>
        <ScorePane
          side="B"
          label={labelB}
          address={propertyB.address}
          score={scoreB}
          isWinner={winner === 'B'}
          delta={winner === 'B' && scoreDelta !== null ? Math.abs(scoreDelta) : null}
        />
      </div>

      {/* ── Tabel delta parameter ── */}
      <div className="mt-3.5">
        <div className="mb-1.5 flex items-center gap-2">
          <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-text-muted">
            Perbandingan Parameter
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-white/6 to-transparent" />
        </div>

        <div className="divide-y divide-white/5">
          {rows
            .filter((row) => row.key !== 'score')
            .map((row) => (
              <ParamRow key={row.key} row={row} />
            ))}
        </div>
      </div>

      {/* ── Alasan bahasa awam ── */}
      {reason && (
        <p className="mt-3 text-[11px] leading-relaxed text-text-secondary">
          {reason}
        </p>
      )}

      {/* ── Kejujuran data ── */}
      {unknownLabels.length > 0 && (
        <p className="mt-2 flex items-start gap-1.5 text-[10px] leading-relaxed text-text-muted">
          <Info className="mt-px h-2.5 w-2.5 shrink-0" />
          <span>
            Tidak dibandingkan karena data tidak tersedia:{' '}
            {unknownLabels.join(', ')}.
          </span>
        </p>
      )}
    </Card>
  );
}

// ── Panel skor per lokasi ────────────────────────────────────────
function ScorePane({ side, label, address, score, isWinner, delta }) {
  const ready = Number.isFinite(score);
  const hex = riskHex(ready ? score : 0);

  return (
    <div
      className="rounded-lg border bg-white/[0.02] p-2.5"
      style={{
        borderColor: isWinner ? `${hex}66` : 'rgba(255,255,255,0.08)',
        boxShadow: isWinner ? `inset 0 0 0 1px ${hex}22` : undefined,
      }}
    >
      <div className="mb-1 flex items-center justify-between gap-1">
        <span
          className="text-[9px] font-bold uppercase tracking-[0.2em]"
          style={{ color: isWinner ? hex : undefined }}
        >
          Lokasi {side}
        </span>
        {delta !== null && (
          <span
            className="data-num rounded px-1 text-[9px] font-semibold"
            style={{ color: hex, backgroundColor: `${hex}1a` }}
          >
            +{delta}
          </span>
        )}
      </div>

      <div className="data-num text-[20px] font-semibold leading-none text-text-primary">
        {ready ? score : '—'}
      </div>

      <p className="mt-1 line-clamp-1 text-[10px] text-text-muted" title={address}>
        {label}
      </p>
    </div>
  );
}

// ── Satu baris parameter ─────────────────────────────────────────
function ParamRow({ row }) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2 py-1.5">
      <span className="text-[10px] text-text-muted">
        {row.label}
        {row.unit && <span className="text-text-muted"> ({row.unit})</span>}
      </span>
      <ParamValue
        display={row.aDisplay}
        note={row.aNote}
        highlight={row.better === 'A'}
        muted={!row.known}
      />
      <ParamValue
        display={row.bDisplay}
        note={row.bNote}
        highlight={row.better === 'B'}
        muted={!row.known}
        trailing={
          row.better === 'equal' ? (
            <Minus className="h-2.5 w-2.5 text-text-muted" aria-label="setara" />
          ) : null
        }
      />
    </div>
  );
}

function ParamValue({ display, note, highlight, muted, trailing }) {
  return (
    <div className="w-[74px] text-right">
      <div className="flex items-center justify-end gap-1">
        {trailing}
        <span
          className={[
            'data-num text-[11px] font-semibold',
            muted
              ? 'text-text-muted'
              : highlight
                ? 'text-risk-safe'
                : 'text-text-secondary',
          ].join(' ')}
        >
          {display}
        </span>
      </div>
      {note && (
        <span className="block truncate text-[10px] text-text-muted" title={note}>
          {note}
        </span>
      )}
    </div>
  );
}
