import { useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Equal, Info, Minus } from 'lucide-react';

import { useT } from '../../hooks/useTranslation';
import { useAppStore } from '../../store/useAppStore';
import { compareAudits } from '../../lib/compare';
import { riskHex, riskLabel, shortAddress } from '../../lib/utils';

/**
 * Laporan perbandingan dua lokasi — tampilan "bangku pembanding" forensik.
 *
 * Versi lama hanya melempar markdown battle report ke SectionList yang sama
 * dengan audit satu tapak: tabel Markdown polos di kolom sempit, tanpa cara
 * membaca siapa unggul di parameter mana selain membandingkan angka satu per
 * satu dengan mata. Di sini perbandingan dibuat sebagai instrumen:
 *
 * 1. `Arena`  — dua plinth skor berdampingan dengan jahitan tengah; pemenang
 *               diberi cincin sewarna bandnya, bukan warna dekoratif baru.
 * 2. `Verdict`— putusan AI dipisah tegas dari dasar deterministik mesin.
 * 3. `Matrix` — tiap parameter SNI digambar sebagai simpangan jarum dari garis
 *               tengah, jadi arah dan besar keunggulan terbaca sekaligus.
 *
 * Seluruh angka berasal dari `lib/compare.js` (deterministik). Lapis AI hanya
 * mengisi narasi — aturan itu ada di CLAUDE.md dan dipertahankan di sini,
 * bahkan ditegaskan secara visual lewat label provenance per blok.
 */

const TONE = {
  lead: '#10b981',
  trail: 'hsl(var(--safe-text-secondary))',
};

const HEADING_SKIP = [
  'putusan komparatif',
  'comparative verdict',
  'perbandingan data terverifikasi',
  'verified data comparison',
];

/**
 * Pecah markdown battle report jadi bagian putusan (dinaikkan ke hero) dan
 * sisanya. Judul level-1 dibuang: drawer sudah punya judulnya sendiri.
 */
function splitBattleReport(markdown) {
  if (!markdown) return { verdict: '', rest: '' };

  const blocks = [];
  let current = null;

  for (const line of markdown.split('\n')) {
    const trimmed = line.trim();
    if (/^#{1,3}\s+/.test(trimmed)) {
      if (current) blocks.push(current);
      const level = trimmed.match(/^#+/)[0].length;
      const title = trimmed.replace(/^#{1,3}\s+/, '').replace(/\*/g, '').trim();
      current = { level, title, raw: line, body: [] };
    } else if (current) {
      current.body.push(line);
    }
  }
  if (current) blocks.push(current);

  const matches = (title, needles) => {
    const s = title.toLowerCase();
    return needles.some((n) => s.includes(n));
  };

  let verdict = '';
  const rest = [];

  for (const block of blocks) {
    if (block.level === 1) continue;
    // Putusan AI ditarik ke panel hero, tidak diulang sebagai seksi biasa.
    if (matches(block.title, [HEADING_SKIP[0], HEADING_SKIP[1]])) {
      verdict = block.body.join('\n').trim();
      continue;
    }
    // Tabel Markdown bawaan backend digantikan matriks diferensial di bawah;
    // menampilkan keduanya berarti pengguna membaca angka yang sama dua kali.
    if (matches(block.title, [HEADING_SKIP[2], HEADING_SKIP[3]])) continue;

    rest.push([block.raw, ...block.body].join('\n').trim());
  }

  return { verdict, rest: rest.join('\n\n').trim() };
}

// ─── Plinth skor satu lokasi ────────────────────────────────────────

function Plinth({ side, property, score, isWinner, isTie, lang, t, delay }) {
  const ready = Number.isFinite(score);
  const hex = ready ? riskHex(score) : 'hsl(var(--safe-text-muted))';
  const address = shortAddress(property?.address, 3) || '—';

  return (
    <article
      className={`btl-plinth btl-in${isWinner ? ' btl-plinth--lead' : ''}`}
      style={{ '--btl-tone': hex, animationDelay: `${delay}ms` }}
      data-testid={`battle-plinth-${side.toLowerCase()}`}
    >
      <span aria-hidden="true" className="btl-plinth-ghost font-display">
        {side}
      </span>

      <header className="relative flex items-center justify-between gap-2">
        <span className="rpt-eyebrow flex items-center gap-1.5">
          <span aria-hidden="true" className="btl-swatch" />
          {t(side === 'A' ? 'battle.siteA' : 'battle.siteB')}
        </span>
        {isWinner && (
          <span className="btl-tag" style={{ color: hex, borderColor: `${hex}55` }}>
            {t('battle.safer')}
          </span>
        )}
        {isTie && (
          <span className="btl-tag btl-tag--muted">
            <Equal className="h-2.5 w-2.5" aria-hidden="true" />
            {t('battle.even')}
          </span>
        )}
      </header>

      <div className="relative mt-3 flex items-baseline gap-1.5">
        <span
          className="data-num text-[52px] font-semibold leading-[0.82] tracking-tighter sm:text-[64px]"
          style={{ color: hex }}
        >
          {ready ? score : '—'}
        </span>
        <span className="data-num text-[13px] text-text-muted">/100</span>
      </div>

      <div className="relative mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span
          className="text-[11px] font-bold uppercase tracking-[0.16em]"
          style={{ color: hex }}
        >
          {ready ? riskLabel(score, lang) : t('battle.noScore')}
        </span>
        {property?.audit_status && property.audit_status !== 'valid' && (
          <span className="btl-tag btl-tag--muted">{property.audit_status}</span>
        )}
      </div>

      {/* Rel band memakai bahasa visual yang sama dengan HeroScore audit satu
          tapak, supaya dua laporan terbaca sebagai satu alat ukur. */}
      <div className="relative mt-4 h-2.5">
        <div className="rpt-well absolute inset-x-0 top-1/2 h-[6px] -translate-y-1/2 overflow-hidden rounded-full">
          <div className="absolute inset-y-0 left-0 w-[39%]" style={{ background: 'rgba(239, 68, 68, 0.26)' }} />
          <div className="absolute inset-y-0 left-[39%] w-[31%]" style={{ background: 'rgba(245, 158, 11, 0.24)' }} />
          <div className="absolute inset-y-0 left-[70%] right-0" style={{ background: 'rgba(16, 185, 129, 0.24)' }} />
          <div className="rpt-tick absolute inset-y-0 left-[39%] w-px" />
          <div className="rpt-tick absolute inset-y-0 left-[70%] w-px" />
        </div>
        {ready && (
          <div
            className="rpt-needle absolute top-0 h-2.5 w-[3px] rounded-full"
            style={{
              left: `${Math.min(100, Math.max(0, score))}%`,
              transform: 'translateX(-50%)',
              background: hex,
            }}
          />
        )}
      </div>

      <p
        className="relative mt-4 line-clamp-2 font-display text-[15px] font-semibold leading-snug text-text-primary"
        title={property?.address}
      >
        {address}
      </p>
      <p className="rpt-legend relative mt-1.5 font-data text-[11px] tracking-wide text-text-muted">
        <span>
          {property?.lat?.toFixed(4)}, {property?.lon?.toFixed(4)}
        </span>
        {(property?.elevation ?? property?.geotech?.elevation_m) != null && (
          <span>{property?.elevation ?? property?.geotech?.elevation_m} mdpl</span>
        )}
      </p>
    </article>
  );
}

// ─── Jahitan tengah: arah + besar selisih skor ──────────────────────

function Seam({ status, winner, delta, tone, t }) {
  const gap = Number.isFinite(delta) ? Math.abs(delta) : null;

  return (
    <div className="btl-seam btl-in" style={{ animationDelay: '120ms', '--btl-tone': tone }}>
      <span aria-hidden="true" className="btl-seam-rule" />
      <div className="btl-crest">
        {status === 'winner' ? (
          <>
            <span className="btl-crest-arrow" aria-hidden="true">
              {winner === 'A' ? (
                <ChevronLeft className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </span>
            <span className="data-num btl-crest-num">{gap}</span>
            <span className="btl-crest-cap">{t('battle.pointGap')}</span>
          </>
        ) : status === 'tie' ? (
          <>
            <Equal className="h-4 w-4 text-text-muted" aria-hidden="true" />
            <span className="btl-crest-cap">{t('battle.even')}</span>
          </>
        ) : (
          <>
            <Minus className="h-4 w-4 text-text-muted" aria-hidden="true" />
            <span className="btl-crest-cap">{t('battle.noScore')}</span>
          </>
        )}
      </div>
      <span aria-hidden="true" className="btl-seam-rule" />
    </div>
  );
}

// ─── Satu baris matriks diferensial ─────────────────────────────────

function MatrixRow({ row, label, index, reduced, t }) {
  // Selisih dinormalkan terhadap toleransi parameter agar "PGA beda 0.05 g"
  // dan "Vs30 beda 90 m/s" bisa digambar pada skala yang sama.
  //
  // Skalanya asimtotik, bukan dipotong keras: pemotongan di kelipatan tetap
  // membuat mayoritas pasangan lokasi nyata menabrak langit-langit yang sama
  // (Vs30 beda 170 m/s dan FS beda 1,26 sama-sama >5× toleransi), sehingga
  // jarum kehilangan daya bedanya persis pada kasus yang paling penting.
  // Kurva ini terus naik tanpa pernah menyentuh tepi rel.
  const ratio = row.known && row.delta !== null ? Math.abs(row.delta) / row.tolerance : 0;
  const magnitude = ratio > 0 ? 1 - 1 / (1 + ratio / 3) : 0;
  const width = row.better === 'A' || row.better === 'B' ? 8 + magnitude * 40 : 0;
  const leadsA = row.better === 'A';
  const leadsB = row.better === 'B';

  const style = { animationDelay: reduced ? '0ms' : `${180 + index * 55}ms` };

  return (
    <div className="btl-row btl-in" style={style} data-testid={`battle-row-${row.key}`}>
      <div className="btl-cell-label">
        <span className="btl-label">{label}</span>
        {row.unit && <span className="btl-unit"> {row.unit}</span>}
      </div>

      <Value
        display={row.aDisplay}
        note={row.aNote}
        lead={leadsA}
        known={row.known}
        align="right"
        area="a"
        sideLabel={t('battle.siteA')}
      />

      {/* Identitas kolom A/B hanya ada di baris kepala yang bersifat visual;
          tanpa penanda ini pembaca layar mendengar deret angka tanpa tahu
          angka mana milik lokasi mana. */}
      <div className="btl-gauge">
        <span className="sr-only">
          {!row.known
            ? t('battle.noData')
            : row.better === 'equal'
              ? t('battle.even')
              : `${t(leadsA ? 'battle.siteA' : 'battle.siteB')} ${t('battle.betterHere')}`}
        </span>
        <div className={`btl-gauge-well${row.known ? '' : ' btl-gauge-well--void'}`} aria-hidden="true">
          <span aria-hidden="true" className="btl-gauge-axis" />
          {width > 0 && (
            <span
              aria-hidden="true"
              className="btl-gauge-fill"
              data-side={leadsA ? 'a' : 'b'}
              style={{
                width: `${width}%`,
                [leadsA ? 'right' : 'left']: '50%',
                '--btl-origin': leadsA ? 'right' : 'left',
                animationDelay: reduced ? '0ms' : `${300 + index * 55}ms`,
              }}
            />
          )}
          {row.known && row.better === 'equal' && (
            <span aria-hidden="true" className="btl-gauge-even" />
          )}
        </div>
      </div>

      <Value
        display={row.bDisplay}
        note={row.bNote}
        lead={leadsB}
        known={row.known}
        align="left"
        area="b"
        sideLabel={t('battle.siteB')}
      />
    </div>
  );
}

function Value({ display, note, lead, known, align, area, sideLabel }) {
  return (
    <div
      className="btl-cell-val"
      style={{ gridArea: area, textAlign: align }}
    >
      <span className="sr-only">{sideLabel}: </span>
      <span
        className="data-num text-[13px] font-semibold"
        style={{ color: !known ? 'hsl(var(--safe-text-muted))' : lead ? TONE.lead : TONE.trail }}
      >
        {display}
      </span>
      {note && (
        <span className="btl-note" title={note}>
          {note}
        </span>
      )}
    </div>
  );
}

// ─── Laporan ────────────────────────────────────────────────────────

export function BattleReport({ propertyA, propertyB, markdown, meta, renderSections }) {
  const t = useT();
  const lang = useAppStore((s) => s.lang);
  const reduced = useReducedMotion();

  const result = useMemo(
    () => compareAudits(propertyA, propertyB, lang),
    [propertyA, propertyB, lang]
  );
  const { verdict, rest } = useMemo(() => splitBattleReport(markdown), [markdown]);

  const { rows, winner, status, scoreA, scoreB, scoreDelta, reason, unknownLabels } = result;
  const paramRows = rows.filter((r) => r.key !== 'score');

  const winnerScore = winner === 'A' ? scoreA : winner === 'B' ? scoreB : null;
  const seamTone = Number.isFinite(winnerScore) ? riskHex(winnerScore) : 'hsl(var(--safe-accent))';

  const labelOf = (row) => (lang === 'en' ? row.labelEn || row.label : row.label);

  return (
    <div className="btl" data-testid="battle-report">
      {/* ── Arena ── */}
      <section className="btl-arena" aria-label={t('battle.headToHead')}>
        <span aria-hidden="true" className="btl-graticule" />
        <Plinth
          side="A"
          property={propertyA}
          score={scoreA}
          isWinner={winner === 'A'}
          isTie={status === 'tie'}
          lang={lang}
          t={t}
          delay={0}
        />
        <Seam status={status} winner={winner} delta={scoreDelta} tone={seamTone} t={t} />
        <Plinth
          side="B"
          property={propertyB}
          score={scoreB}
          isWinner={winner === 'B'}
          isTie={status === 'tie'}
          lang={lang}
          t={t}
          delay={60}
        />
      </section>

      {/* ── Putusan: narasi AI dan dasar mesin dipisah tegas ── */}
      <section className="btl-verdict btl-in" style={{ animationDelay: '160ms' }}>
        {verdict && (
          <div className="btl-verdict-ai">
            <h3 className="rpt-eyebrow text-accent">{t('battle.aiVerdict')}</h3>
            <p className="btl-lede">{verdict}</p>
            {meta?.model && (
              <p className="btl-provenance">
                {t('battle.aiProvenance')} <span className="font-data">{meta.model}</span>
              </p>
            )}
          </div>
        )}

        {reason && (
          <div className="btl-verdict-engine">
            <h3 className="rpt-eyebrow">{t('battle.engineBasis')}</h3>
            <p className="mt-2 text-[12.5px] leading-relaxed text-text-secondary">{reason}</p>
            <p className="btl-provenance">{t('battle.engineProvenance')}</p>
          </div>
        )}
      </section>

      {/* ── Matriks diferensial ── */}
      <section className="btl-matrix">
        <header className="btl-matrix-head">
          <h3 className="rpt-eyebrow">{t('battle.matrix')}</h3>
          <span className="btl-matrix-legend">
            <span aria-hidden="true" className="btl-legend-dot" />
            {t('battle.legendLead')}
          </span>
        </header>

        <div className="btl-row btl-row--head" aria-hidden="true">
          <span className="btl-cell-label rpt-eyebrow">{t('battle.parameter')}</span>
          <span className="btl-cell-val rpt-eyebrow" style={{ gridArea: 'a', textAlign: 'right' }}>
            {t('battle.siteA')}
          </span>
          <span className="btl-gauge rpt-eyebrow" style={{ textAlign: 'center' }}>
            {t('battle.advantage')}
          </span>
          <span className="btl-cell-val rpt-eyebrow" style={{ gridArea: 'b', textAlign: 'left' }}>
            {t('battle.siteB')}
          </span>
        </div>

        <div className="btl-rows">
          {paramRows.map((row, i) => (
            <MatrixRow
              key={row.key}
              row={row}
              label={labelOf(row)}
              index={i}
              reduced={Boolean(reduced)}
              t={t}
            />
          ))}
        </div>

        {unknownLabels.length > 0 && (
          <p className="btl-void-note">
            <Info className="mt-px h-3 w-3 shrink-0" aria-hidden="true" />
            <span>
              {t('battle.notCompared')}{' '}
              {unknownLabels
                .map((label) => {
                  const row = rows.find((r) => r.label === label);
                  return row ? labelOf(row) : label;
                })
                .join(', ')}
              .
            </span>
          </p>
        )}
      </section>

      {/* ── Sisa narasi AI (perbedaan utama, rekomendasi, keterbatasan) ── */}
      {rest && <div className="btl-sections">{renderSections(rest)}</div>}
    </div>
  );
}
