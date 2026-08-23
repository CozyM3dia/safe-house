import { createElement, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  BookOpen,
  ChevronDown,
  Droplets,
  ExternalLink,
  FileCheck,
  FileText,
  Info,
  Layers,
  MapPin,
  Scale,
  Sparkles,
  TrendingUp,
  Wrench,
} from 'lucide-react';

import { useAppStore } from '../../store/useAppStore';
import { useT } from '../../hooks/useTranslation';
import { Skeleton, SkeletonText } from '../ui/skeleton';
import { PbgChecklistCard } from '../cards/PbgChecklistCard';
import {
  TONE_HEX,
  ZONE_BG,
  bandTone,
  fsTone,
  riskHex,
  riskLabel,
  shortAddress,
  thresholdTone,
  hazardBand,
} from '../../lib/utils';
import { siteClass } from '../../lib/formatters';
import { parseBuildingCodes } from '../../lib/standards';

// ─── Konstanta & util ────────────────────────────────────────────────

const ACCENT = 'hsl(var(--safe-accent))';

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const stripColon = (s) => String(s).replace(/\s*:\s*$/, '');

/**
 * Salinan teks laporan per bahasa. Ditempatkan lokal di sini — bukan di
 * i18n.js — karena seluruh struktur bagian laporan (01-06) hanya dipakai
 * oleh komponen ini dan harus terbaca sebagai satu dokumen utuh.
 */
const COPY = {
  mastheadEyebrow: { id: 'Laporan Audit Risiko Geoteknik', en: 'Geotechnical Risk Audit Report' },
  docRef: { id: 'No. Dokumen', en: 'Document Ref.' },
  standard: { id: 'Acuan', en: 'Standard' },
  execSummary: { id: 'Ringkasan Eksekutif', en: 'Executive Summary' },
  seismicParams: { id: 'Parameter Seismik Situs', en: 'Site Seismic Parameters' },
  hazards: { id: 'Bahaya Multirisiko', en: 'Multi-Hazard Exposure' },
  dataQuality: { id: 'Kelengkapan & Sumber Data', en: 'Data Coverage & Sources' },
  pbgReadiness: { id: 'Kesiapan Dokumen PBG', en: 'PBG Document Readiness' },
  analysis: { id: 'Analisis & Rekomendasi', en: 'Analysis & Recommendations' },
  methodology: { id: 'Metodologi & Batasan', en: 'Methodology & Limitations' },
  waterBodyTitle: { id: 'Titik berada di atas badan air', en: 'Point falls on a water body' },
  waterBodyNote: {
    id: 'Parameter tanah pada titik ini kemungkinan tidak mewakili tapak daratan. Pindahkan penanda ke lokasi darat.',
    en: 'Soil parameters at this point may not represent land. Move the marker to an onshore location.',
  },
  mainConcern: { id: 'Perhatian utama', en: 'Main concerns' },
  confidence: { id: 'Keyakinan data', en: 'Data confidence' },
  paramTable: { id: 'Parameter Terukur', en: 'Measured Parameters' },
  vs30: { id: 'Vs30 (kecepatan gelombang geser)', en: 'Vs30 (shear-wave velocity)' },
  siteClassLabel: { id: 'Kelas situs SNI 1726', en: 'SNI 1726 site class' },
  bedrockPga: { id: 'PGA batuan dasar', en: 'Bedrock PGA' },
  faFactor: { id: 'Faktor situs Fa', en: 'Site coefficient Fa' },
  surfacePgaLabel: { id: 'PGA permukaan (desain)', en: 'Surface PGA (design)' },
  resonanceT0: { id: 'Periode resonansi T₀', en: 'Resonant period T₀' },
  faultRow: { id: 'Sesar aktif terdekat', en: 'Nearest active fault' },
  megathrustRow: { id: 'Zona megathrust terdekat', en: 'Nearest megathrust zone' },
  volcanoRow: { id: 'Gunungapi terdekat', en: 'Nearest active volcano' },
  coastRow: { id: 'Garis pantai terdekat', en: 'Nearest coastline' },
  seismicityRow: { id: 'Seismisitas kawasan (12 bln)', en: 'Regional seismicity (12 mo)' },
  events: { id: 'peristiwa M≥4,5', en: 'events M≥4.5' },
  liquefactionMeter: { id: 'Faktor Keamanan Likuefaksi (FS)', en: 'Liquefaction Factor of Safety (FS)' },
  fsDesignMargin: { id: '1,4 · margin desain', en: '1.4 · design margin' },
  pgaMeter: { id: 'Percepatan Tanah Maksimum (PGA Surface)', en: 'Peak Ground Acceleration (Surface PGA)' },
  faultMeter: { id: 'Kedekatan dengan Sesar Aktif', en: 'Active Fault Proximity' },
  hazardRowsTitle: { id: 'Paparan Bahaya', en: 'Hazard Exposure' },
  floodRow: { id: 'Banjir', en: 'Flood' },
  tsunamiRow: { id: 'Tsunami', en: 'Tsunami' },
  landslideRow: { id: 'Longsor', en: 'Landslide' },
  subsidenceRow: { id: 'Subsiden tanah', en: 'Land subsidence' },
  terrainMeter: { id: 'Ketinggian vs Level Banjir Rob', en: 'Elevation vs Coastal Flood Level' },
  radarTitle: { id: 'Indeks Bahaya Relatif (0–100)', en: 'Relative Hazard Index (0–100)' },
  radarFlood: { id: 'Banjir', en: 'Flood' },
  radarSeismic: { id: 'Tektonik', en: 'Tectonic' },
  radarSoil: { id: 'Tanah', en: 'Soil' },
  radarLandslide: { id: 'Longsor', en: 'Landslide' },
  radarSubsidence: { id: 'Subsiden', en: 'Subsidence' },
  radarAir: { id: 'Udara', en: 'Air' },
  sourcesList: { id: 'Sumber data naratif', en: 'Narrative data sources' },
  limitationsList: { id: 'Batasan data', en: 'Data limitations' },
  noNarrative: {
    id: 'Analisis naratif tidak tersedia pada laporan bersama. Parameter terukur di atas tetap sahih.',
    en: 'Narrative analysis is unavailable on shared reports. Measured parameters above remain valid.',
  },
  nearbyContext: { id: 'Konteks sekitar. ', en: 'Nearby context. ' },
  generatedBy: { id: 'Disusun oleh', en: 'Prepared by' },
  deskStudy: {
    id: 'Laporan ini adalah penyaringan awal (desk study) dari data sekunder publik — bukan pengganti penyelidikan tanah langsung (SPT/CPT/bor). Keputusan akhir tetap milik ahli teknik yang menandatangani gambar struktur.',
    en: 'This report is a preliminary desk study of public secondary data — not a replacement for direct field investigation (SPT/CPT/boring). Final decisions belong to the licensed engineer signing the structural drawings.',
  },
};

const tr = (lang, entry) => (entry ? entry[lang] || entry.id : '');

// ─── Primitif visual ─────────────────────────────────────────────────

/** Label kapital kecil untuk kepala rel ukur. */
function Readout({ tone, children }) {
  return (
    <span
      className={`data-num shrink-0 text-[12px] font-semibold ${tone ? '' : 'text-accent'}`}
      style={tone ? { color: TONE_HEX[tone] } : undefined}
    >
      {children}
    </span>
  );
}

/** Label sumbu di ujung rel akan terpotong bila selalu dipusatkan. */
function tickStyle(pct) {
  if (pct <= 1) return { left: 0 };
  if (pct >= 99) return { right: 0 };
  return { left: `${pct}%`, transform: 'translateX(-50%)' };
}

/**
 * Rel ukur tunggal untuk FS, PGA, jarak sesar. Zona flat dengan jarum
 * bercincin — batas ambang terlihat sebagai garis keputusan.
 */
export function Meter({ label, value, min, max, zones = [], ticks = [], readout, tone }) {
  const span = max - min || 1;
  const pct = (v) => clamp(((v - min) / span) * 100, 0, 100);

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="rpt-eyebrow">{label}</span>
        <Readout tone={tone}>{readout}</Readout>
      </div>

      <div className="relative h-3.5">
        <div className="rpt-well absolute inset-x-0 top-1/2 h-[7px] -translate-y-1/2 overflow-hidden rounded-full">
          {zones.map((z) => (
            <div
              key={`z-${z.from}-${z.to}`}
              className="absolute inset-y-0"
              style={{
                left: `${pct(z.from)}%`,
                width: `${pct(z.to) - pct(z.from)}%`,
                background: ZONE_BG[z.tone] || ZONE_BG.neutral,
              }}
            />
          ))}
          {zones.slice(1).map((z) => (
            <div
              key={`b-${z.from}`}
              className="rpt-tick absolute inset-y-0 w-px"
              style={{ left: `${pct(z.from)}%` }}
            />
          ))}
        </div>
        <div
          className="rpt-needle absolute top-0 h-3.5 w-[3px] rounded-full"
          style={{
            left: `${pct(value)}%`,
            transform: 'translateX(-50%)',
            background: tone ? TONE_HEX[tone] : ACCENT,
          }}
        />
      </div>

      {ticks.length > 0 && (
        <div className="relative mt-1.5 h-3">
          {ticks.map((tk) => (
            <span
              key={`t-${tk.at}`}
              className="absolute top-0 whitespace-nowrap font-data text-[10px] leading-none tracking-wide text-text-muted"
              style={tickStyle(pct(tk.at))}
            >
              {tk.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** Kelas situs SNI 1726 sebagai satu sumbu Vs30 bersambung. */
export function ClassStrip({ vs30, label, classLabels }) {
  const bands = [
    { key: 'SE', name: 'SE', caption: classLabels.soft, lo: 0, hi: 180 },
    { key: 'SD', name: 'SD', caption: classLabels.medium, lo: 180, hi: 360 },
    { key: 'SC', name: 'SC', caption: classLabels.hard, lo: 360, hi: 760 },
    { key: 'SB', name: 'SB/SA', caption: classLabels.rock, lo: 760, hi: 1500 },
  ];
  const idx = vs30 >= 760 ? 3 : vs30 >= 360 ? 2 : vs30 >= 180 ? 1 : 0;
  const band = bands[idx];
  const frac = clamp((vs30 - band.lo) / (band.hi - band.lo), 0, 1);
  const pos = ((idx + frac) / bands.length) * 100;

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="rpt-eyebrow">{label}</span>
        <Readout>
          {vs30} m/s · {band.name}
        </Readout>
      </div>

      <div className="relative mt-1.5">
        <div className="rpt-hair grid grid-cols-4 overflow-hidden rounded-lg">
          {bands.map((b, i) => (
            <div
              key={b.key}
              className={`px-1.5 py-2 text-center transition-colors ${
                i === idx ? 'bg-accent/[0.16]' : ''
              }`}
              style={{
                background: i === idx ? undefined : 'var(--rpt-fill)',
                borderLeft: i > 0 ? '1px solid var(--rpt-line)' : undefined,
                boxShadow: i === idx ? 'inset 0 0 0 1px hsl(var(--safe-accent) / 0.42)' : undefined,
              }}
            >
              <div
                className={`data-num text-[12px] font-semibold ${
                  i === idx ? 'text-accent' : 'text-text-secondary'
                }`}
              >
                {b.name}
              </div>
              <div className="mt-0.5 truncate text-[10px] text-text-muted">{b.caption}</div>
            </div>
          ))}
        </div>
        <div
          className="pointer-events-none absolute inset-y-0 w-[2px]"
          style={{ left: `${pos}%`, transform: 'translateX(-50%)', background: ACCENT }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-[5px] h-0 w-0"
          style={{
            left: `${pos}%`,
            transform: 'translateX(-50%)',
            borderLeft: '4px solid transparent',
            borderRight: '4px solid transparent',
            borderTop: `5px solid ${ACCENT}`,
          }}
        />
      </div>

      <div className="relative mt-1.5 h-3">
        {[
          { at: 25, label: '180' },
          { at: 50, label: '360' },
          { at: 75, label: '760' },
        ].map((tk) => (
          <span
            key={tk.label}
            className="absolute top-0 font-data text-[10px] leading-none text-text-muted"
            style={{ left: `${tk.at}%`, transform: 'translateX(-50%)' }}
          >
            {tk.label}
          </span>
        ))}
        <span className="absolute right-0 top-0 font-data text-[10px] leading-none text-text-muted">
          m/s
        </span>
      </div>
    </div>
  );
}

/** Penampang topografi tapak terhadap muka air rob. */
export function TerrainProfile({ elevationM, label, readout, captions }) {
  const idx = elevationM < 10 ? 0 : elevationM < 50 ? 1 : 2;
  const marker = [
    { x: 160, y: 42 },
    { x: 270, y: 31 },
    { x: 368, y: 20 },
  ][idx];
  const ridge = 'M0 52 H96 L120 42 H208 L232 31 H312 L336 20 H400';

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="rpt-eyebrow">{label}</span>
        <Readout>{readout}</Readout>
      </div>

      <div className="rpt-hair rpt-well overflow-hidden rounded-lg">
        <svg
          viewBox="0 0 400 62"
          className="block w-full"
          role="img"
          aria-label={`${readout} — ${captions[idx]}`}
        >
          <path d={`${ridge} V62 H0 Z`} fill="var(--rpt-fill-2)" />
          <path d={ridge} fill="none" stroke="var(--rpt-line-strong)" strokeWidth="1.25" />
          <rect x="0" y="52" width="96" height="10" fill="rgba(56, 148, 214, 0.30)" />
          <line x1="0" y1="52" x2="96" y2="52" stroke="rgba(96, 178, 235, 0.75)" strokeWidth="1.25" />
          <line
            x1="0"
            y1="45"
            x2="400"
            y2="45"
            stroke="rgba(96, 178, 235, 0.55)"
            strokeWidth="1"
            strokeDasharray="5 4"
          />
          <line x1={marker.x} y1={marker.y} x2={marker.x} y2={marker.y - 11} stroke={ACCENT} strokeWidth="1.5" />
          <circle
            cx={marker.x}
            cy={marker.y - 13.5}
            r="4"
            fill={ACCENT}
            stroke="var(--rpt-ring)"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      <div
        className="mt-1.5 grid gap-2 text-[10px] leading-tight text-text-muted"
        style={{ gridTemplateColumns: '52fr 26fr 22fr' }}
      >
        {captions.map((c, i) => (
          <span
            key={c}
            className={`${i === 1 ? 'text-center' : i === 2 ? 'text-right' : ''} ${
              i === idx ? 'font-semibold text-text-secondary' : ''
            }`}
          >
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Kerangka bagian laporan ─────────────────────────────────────────

/**
 * Kepala bagian bernomor. Nomor mono + judul kapital memberikan ritme
 * dokumen resmi; pembaca bisa melompat antar bagian tanpa membaca urut.
 */
function SectionHeading({ num, title, aside }) {
  return (
    <div className="rpt-hair-b mb-5 flex items-center gap-3 pb-2.5">
      <span className="data-num shrink-0 text-[11px] font-semibold tracking-[0.08em] text-accent">
        {num}
      </span>
      <h2 className="min-w-0 flex-1 font-display text-[12px] font-bold uppercase tracking-[0.16em] text-text-primary">
        {title}
      </h2>
      {aside && <div className="shrink-0">{aside}</div>}
    </div>
  );
}

/** Ubin parameter satu angka — unit pembacaan cepat Ringkasan Eksekutif. */
function KpiTile({ label, value, note, tone }) {
  const hex = tone ? TONE_HEX[tone] : undefined;
  return (
    <div className="rpt-surface relative overflow-hidden rounded-xl p-3.5">
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-[2px]"
        style={{ background: hex || 'var(--rpt-line-strong)' }}
      />
      <p className="rpt-eyebrow">{label}</p>
      <p className="data-num mt-1.5 truncate text-[20px] font-semibold leading-none" style={{ color: hex }}>
        {value}
      </p>
      {note && (
        <p className="mt-1.5 truncate text-[10.5px] leading-tight text-text-muted" title={note}>
          {note}
        </p>
      )}
    </div>
  );
}

/** Baris paparan bahaya: label kiri, chip band kanan. */
function HazardRow({ label, band, note, tone }) {
  const hex = tone ? TONE_HEX[tone] : undefined;
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="min-w-0 shrink-0 text-[12px] text-text-muted">{label}</dt>
      <dd className="flex min-w-0 items-baseline justify-end gap-2 text-right">
        {note && (
          <span className="truncate text-[10.5px] leading-tight text-text-muted" title={note}>
            {note}
          </span>
        )}
        {band ? (
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{
              color: hex || 'hsl(var(--safe-text-primary))',
              background: hex ? `${hex}14` : 'var(--rpt-fill)',
              border: `1px solid ${hex ? `${hex}33` : 'var(--rpt-line)'}`,
            }}
          >
            {band}
          </span>
        ) : (
          <span className="data-num shrink-0 text-[12px] text-text-muted">—</span>
        )}
      </dd>
    </div>
  );
}

/** Indeks bahaya relatif dari hazard.radar — satu bar tipis per sumbu. */
function RadarBar({ label, value }) {
  const pct = clamp(value, 0, 100);
  const tone = thresholdTone(value, 40, 70);
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 truncate text-[11px] text-text-muted">{label}</span>
      <div className="relative h-1.5 min-w-0 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--rpt-well)' }}>
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500"
          style={{ width: `${pct}%`, background: tone ? TONE_HEX[tone] : ACCENT }}
        />
      </div>
      <span className="data-num w-7 shrink-0 text-right text-[11px] font-semibold text-text-secondary">
        {Math.round(pct)}
      </span>
    </div>
  );
}

/** Chip asal laporan (engine / AI / cache). */
export function ProvenanceChip({ state, detail }) {
  const tone = state === 'live' ? 'safe' : state === 'fallback' ? 'moderate' : null;
  return (
    <span className="rpt-hair inline-flex min-w-0 items-center gap-1.5 rounded-full py-0.5 pl-2 pr-2.5">
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ background: tone ? TONE_HEX[tone] : ACCENT }}
      />
      <span className="font-data text-[10px] uppercase tracking-[0.12em] text-text-secondary">
        {state}
      </span>
      {detail && (
        <span className="max-[479px]:hidden truncate text-[10px] text-text-muted" title={detail}>
          {detail}
        </span>
      )}
    </span>
  );
}

export function ReportSkeleton({ label = 'Loading report' }) {
  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div className="space-y-2.5">
        <Skeleton className="h-3 w-2/5 rounded" />
        <SkeletonText lines={4} />
      </div>
      <div className="space-y-2.5">
        <Skeleton className="h-3 w-1/3 rounded" />
        <SkeletonText lines={5} />
      </div>
      <Skeleton className="h-28 rounded-xl" />
    </div>
  );
}

// ─── Panel skor (Bagian 01) ──────────────────────────────────────────

/**
 * Skor + rail tiga zona. Label zona memakai flex antara ujung-ujung — bukan
 * absolut di tengah tiap zona — sehingga mustahil saling bertabrakan di
 * layar sempit (bug lama).
 */
function ScorePanel({ score, ready, status, lang }) {
  const t = useT();
  const hex = ready ? riskHex(score) : undefined;
  const meaningKey =
    score >= 70 ? 'drawer.relativeBuildable' : score >= 40 ? 'drawer.needsMitigation' : 'drawer.seriousMitigation';

  const bands = [
    { name: riskLabel(20, lang), range: '0–39', tone: TONE_HEX.danger },
    { name: riskLabel(55, lang), range: '40–69', tone: TONE_HEX.moderate },
    { name: riskLabel(85, lang), range: '70–100', tone: TONE_HEX.safe },
  ];
  const activeIdx = !ready ? -1 : score >= 70 ? 2 : score >= 40 ? 1 : 0;

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-baseline gap-2">
          <span className="data-num text-[64px] font-semibold leading-[0.85] tracking-tighter" style={{ color: hex }}>
            {ready ? score : '—'}
          </span>
          <span className="data-num text-[15px] text-text-muted">/100</span>
        </div>
        {ready && (
          <span
            className="mb-1 inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.16em]"
            style={{ color: hex }}
          >
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ background: hex }} />
            {riskLabel(score, lang)}
          </span>
        )}
      </div>

      {!ready && (
        <p className="mt-2 text-[12.5px] font-semibold uppercase tracking-[0.12em] text-risk-moderate">
          {t('drawer.auditDataInsufficient')}
        </p>
      )}

      <div className="mt-4">
        <div className="relative h-3.5">
          <div className="rpt-well absolute inset-x-0 top-1/2 h-[7px] -translate-y-1/2 overflow-hidden rounded-full">
            <div className="absolute inset-y-0 left-0 w-[39%]" style={{ background: ZONE_BG.danger }} />
            <div className="absolute inset-y-0 left-[39%] w-[31%]" style={{ background: ZONE_BG.moderate }} />
            <div className="absolute inset-y-0 left-[70%] right-0" style={{ background: ZONE_BG.safe }} />
            <div className="rpt-tick absolute inset-y-0 left-[39%] w-px" />
            <div className="rpt-tick absolute inset-y-0 left-[70%] w-px" />
          </div>
          {ready && (
            <div
              className="rpt-needle absolute top-0 h-3.5 w-[3px] rounded-full"
              style={{ left: `${clamp(score, 0, 100)}%`, transform: 'translateX(-50%)', background: hex }}
            />
          )}
        </div>

        {/* Tiga kolom flex: rata kiri / tengah / kanan. Tanpa posisi absolut. */}
        <div className="mt-2 flex items-start justify-between gap-2">
          {bands.map((b, i) => {
            const isActive = i === activeIdx;
            return (
              <span key={b.range} className={i === 0 ? 'text-left' : i === 1 ? 'text-center' : 'text-right'}>
                <span
                  className="block text-[10px] font-bold uppercase tracking-[0.12em]"
                  style={{ color: isActive ? b.tone : undefined }}
                >
                  <span className={isActive ? '' : 'text-text-muted'}>{b.name}</span>
                </span>
                <span className="mt-0.5 block font-data text-[10px] text-text-muted">{b.range}</span>
              </span>
            );
          })}
        </div>
      </div>

      {ready && <p className="mt-3 text-[12.5px] leading-relaxed text-text-secondary">{t(meaningKey)}</p>}

      {status && status !== 'valid' && (
        <span
          className="rpt-hair mt-3 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-risk-moderate"
          style={{ borderColor: `${TONE_HEX.moderate}44` }}
        >
          {status}
        </span>
      )}
    </div>
  );
}

// ─── Narasi AI ───────────────────────────────────────────────────────

/**
 * Pemecah bagian markdown. Perbaikan atas versi lama: prolog sebelum
 * heading pertama tidak lagi dibuang diam-diam — ia dikembalikan sebagai
 * bagian pertama tanpa judul.
 */
function parseReportSections(markdown) {
  if (!markdown) return [];
  const lines = markdown.split('\n');
  const sections = [];
  let current = null;

  const headerRe = /^#{2,3}\s+/;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (headerRe.test(line)) {
      if (current) sections.push(current);
      const title = line.replace(headerRe, '').replace(/\*/g, '').trim();
      current = { title, contentLines: [] };
    } else if (current) {
      current.contentLines.push(lines[i]);
    } else {
      // Prolog sebelum heading pertama.
      current = { title: '', contentLines: [lines[i]] };
    }
  }
  if (current) sections.push(current);

  return sections.map((s) => ({
    title: s.title,
    content: s.contentLines.join('\n').trim(),
  }));
}const parseMitigations = (content) => {
  const items = [];
  const lines = content.split('\n');

  const hasSubBullets =
    content.includes('- Apa yang harus dilakukan') ||
    content.includes('- Tindakan') ||
    content.includes('- What to do') ||
    content.includes('- Action:');

  if (hasSubBullets) {
    const blocks = content.split(/(?:\r?\n)+(?=\d+\.|\*\*\d+\.)/);
    for (const block of blocks) {
      const trimmed = block.trim();
      if (!trimmed) continue;

      let title = '';
      const titleMatch = trimmed.match(
        /^(?:\*\*\d+\.\s*(.*?)\*\*|\d+\.\s*\*\*(.*?)\*\*|\d+\.\s*(.*?)(?:\r?\n|-))/
      );
      if (titleMatch) {
        title = (titleMatch[1] || titleMatch[2] || titleMatch[3] || '').trim();
      }
      if (!title) {
        title = trimmed.split('\n')[0].replace(/^[\d.]+\s*/, '').trim();
      }

      let action = '';
      let why = '';
      let cost = '';
      let priority = '';

      for (const line of trimmed.split('\n')) {
        const lineTrim = line.trim();
        if (lineTrim.match(/-\s*(?:Apa yang harus dilakukan|What to do|Tindakan|Action)\s*:\s*(.*)/i)) {
          action = lineTrim.match(/-\s*(?:Apa yang harus dilakukan|What to do|Tindakan|Action)\s*:\s*(.*)/i)[1].trim();
        } else if (lineTrim.match(/-\s*(?:Mengapa penting|Why it matters|Pentingnya|Rationale)\s*:\s*(.*)/i)) {
          why = lineTrim.match(/-\s*(?:Mengapa penting|Why it matters|Pentingnya|Rationale)\s*:\s*(.*)/i)[1].trim();
        } else if (lineTrim.match(/-\s*(?:Estimasi biaya|Estimated cost|Biaya|Cost)\s*:\s*(.*)/i)) {
          cost = lineTrim.match(/-\s*(?:Estimasi biaya|Estimated cost|Biaya|Cost)\s*:\s*(.*)/i)[1].trim();
        } else if (lineTrim.match(/-\s*(?:Prioritas|Priority)\s*:\s*(.*)/i)) {
          priority = lineTrim.match(/-\s*(?:Prioritas|Priority)\s*:\s*(.*)/i)[1].trim();
        }
      }

      if (title) items.push({ title, action, why, cost, priority });
    }
  } else {
    for (const line of lines) {
      const lineTrim = line.trim();
      if (!lineTrim) continue;

      const boldMatch = lineTrim.match(/^(?:-\s*|\d+\.\s*)?\*\*(.*?)\*\*(?:\s*:\s*|\s*-\s*)(.*)/);
      if (boldMatch) {
        const title = boldMatch[1].trim();
        let action = boldMatch[2].trim();
        let cost = '';
        let priority = '';

        const costMatch = action.match(/(?:Estimasi biaya|Estimasi Biaya|Biaya|Cost)\s*:\s*([^.\n]+)/i);
        if (costMatch) {
          cost = costMatch[1].trim();
          action = action.replace(costMatch[0], '');
        }
        const priorityMatch = action.match(/(?:Prioritas|Priority)\s*:\s*([^.\n]+)/i);
        if (priorityMatch) {
          priority = priorityMatch[1].trim();
          action = action.replace(priorityMatch[0], '');
        }
        action = action
          .replace(/(?:Estimasi biaya|Estimasi Biaya|Biaya|Cost)\s*:\s*$/i, '')
          .replace(/(?:Prioritas|Priority)\s*:\s*$/i, '')
          .replace(/[,.\s]+$/, '')
          .trim();

        items.push({ title, action, why: '', cost, priority });
      }
    }
  }
  return items;
};

function stripMarkdownNode(props) {
  const { node, ...rest } = props;
  void node;
  return rest;
}

/**
 * Peta komponen markdown. Hierarki heading kini lengkap (h1-h4) — versi
 * lama hanya mendefinisikan h4 sehingga struktur dokumen hilang. Daftar
 * berurutan kembali menampilkan nomornya (bullet-bar kini hanya untuk ul,
 * lewat CSS .sni-prose).
 */
const markdownComponents = {
  h1: (props) => (
    <h2
      className="mb-2 mt-5 font-display text-[15px] font-bold text-text-primary"
      {...stripMarkdownNode(props)}
    />
  ),
  h2: (props) => (
    <h3
      className="mb-2 mt-5 font-display text-[13.5px] font-bold text-text-primary"
      {...stripMarkdownNode(props)}
    />
  ),
  h3: (props) => (
    <h4
      className="mb-2 mt-4 font-display text-[12.5px] font-bold text-text-primary"
      {...stripMarkdownNode(props)}
    />
  ),
  h4: (props) => (
    <h5
      className="mb-1.5 mt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-accent"
      {...stripMarkdownNode(props)}
    />
  ),
  blockquote: (props) => (
    <blockquote
      className="mb-3 border-l-2 pl-3 text-[12.5px] italic leading-relaxed text-text-muted"
      style={{ borderColor: 'var(--rpt-line-strong)' }}
      {...stripMarkdownNode(props)}
    />
  ),
  p: (props) => (
    <p className="mb-3 text-[13px] leading-[1.72] text-text-secondary" {...stripMarkdownNode(props)} />
  ),
  ul: (props) => <ul className="mb-3 list-none space-y-1.5 pl-0" {...stripMarkdownNode(props)} />,
  ol: (props) => <ol className="sni-ol mb-3 space-y-1.5" {...stripMarkdownNode(props)} />,
  li: (props) => {
    const cleanProps = stripMarkdownNode(props);
    return (
      <li className="sni-li text-[13px] leading-[1.72] text-text-secondary">
        <span className="min-w-0">{cleanProps.children}</span>
      </li>
    );
  },
  strong: (props) => <strong className="font-semibold text-text-primary" {...stripMarkdownNode(props)} />,
  table: ({ children, ...props }) => (
    <div className="table-scroll rpt-hair my-4 max-w-full overflow-hidden rounded-xl">
      <table className="min-w-full text-left text-[12.5px]" {...stripMarkdownNode(props)}>
        {children}
      </table>
    </div>
  ),
  thead: (props) => (
    <thead style={{ background: 'var(--rpt-fill-2)' }} {...stripMarkdownNode(props)} />
  ),
  tbody: (props) => <tbody className="rpt-rows" {...stripMarkdownNode(props)} />,
  tr: (props) => <tr {...stripMarkdownNode(props)} />,
  th: (props) => (
    <th
      className="px-3.5 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-text-primary"
      {...stripMarkdownNode(props)}
    />
  ),
  td: (props) => <td className="px-3.5 py-2.5 align-top text-text-secondary" {...stripMarkdownNode(props)} />,
};

const getSectionIcon = (title) => {
  const s = String(title || '').toLowerCase();
  if (s.includes('ringkasan') || s.includes('summary') || s.includes('verdict') || s.includes('hasil'))
    return Sparkles;
  if (
    s.includes('geoteknik') ||
    s.includes('geotechnical') ||
    s.includes('tanah') ||
    s.includes('soil') ||
    s.includes('likuefaksi')
  )
    return Layers;
  if (
    s.includes('gempa') ||
    s.includes('earthquake') ||
    s.includes('tektonik') ||
    s.includes('seismic') ||
    s.includes('seismik') ||
    s.includes('sesar')
  )
    return Activity;
  if (
    s.includes('banjir') ||
    s.includes('flood') ||
    s.includes('lingkungan') ||
    s.includes('environmental') ||
    s.includes('hidrometeorologi')
  )
    return Droplets;
  if (s.includes('mikro') || s.includes('micro') || s.includes('evakuasi') || s.includes('jalan'))
    return MapPin;
  if (s.includes('regulasi') || s.includes('sni') || s.includes('code') || s.includes('persyaratan bangunan'))
    return BookOpen;
  if (s.includes('mitigasi') || s.includes('mitigation') || s.includes('rekomendasi')) return Wrench;
  if (s.includes('investasi') || s.includes('investment') || s.includes('harga') || s.includes('biaya total'))
    return TrendingUp;
  if (s.includes('referensi') || s.includes('reference') || s.includes('disclaimer')) return Info;
  if (s.includes('contrast') || s.includes('perbandingan') || s.includes('head-to-head')) return Scale;
  return FileText;
};

const SectionIcon = ({ title, className }) =>
  createElement(getSectionIcon(title), { className });

function MitigationCard({ item, index }) {
  const t = useT();
  const { title, action, why, cost, priority } = item;
  const p = (priority || '').toLowerCase();

  let tone = null;
  let priorityLabel = priority;

  if (p.includes('wajib') || p.includes('required') || p.includes('high') || p.includes('urgent')) {
    tone = 'danger';
    priorityLabel = p.includes('wajib') ? 'WAJIB' : 'REQUIRED';
  } else if (p.includes('disarankan') || p.includes('recommended') || p.includes('moderate') || p.includes('medium')) {
    tone = 'moderate';
    priorityLabel = p.includes('disarankan') ? 'DISARANKAN' : 'RECOMMENDED';
  } else if (p.includes('jangka panjang') || p.includes('long-term') || p.includes('low') || p.includes('long term')) {
    tone = 'safe';
    priorityLabel = p.includes('jangka') ? 'JANGKA PANJANG' : 'LONG-TERM';
  }

  const toneColor = tone ? TONE_HEX[tone] : ACCENT;

  return (
    <article
      className="rpt-surface relative overflow-hidden rounded-xl p-4"
      style={tone ? { borderColor: `${TONE_HEX[tone]}55` } : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <h4 className="font-display text-[13px] font-bold leading-snug text-text-primary">
          <span className="mr-1.5 font-data text-[11px] font-medium text-text-muted">
            {String(index + 1).padStart(2, '0')}
          </span>
          {title}
        </h4>
        {priorityLabel && (
          <span
            className="rpt-hair shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{
              color: toneColor,
              borderColor: tone ? `${TONE_HEX[tone]}55` : undefined,
            }}
          >
            {priorityLabel}
          </span>
        )}
      </div>

      {cost && (
        <p className="mt-2.5 font-data text-[11px] text-text-secondary">
          <span className="text-text-muted">{stripColon(t('drawer.cost'))} </span>
          <span className="font-semibold text-accent">{cost}</span>
        </p>
      )}

      <dl className="mt-3 space-y-2">
        {action && (
          <div>
            <dt className="rpt-eyebrow">{stripColon(t('drawer.action'))}</dt>
            <dd className="mt-1 text-[12.5px] leading-relaxed text-text-secondary">{action}</dd>
          </div>
        )}
        {why && (
          <div>
            <dt className="rpt-eyebrow">{stripColon(t('drawer.reason'))}</dt>
            <dd className="mt-1 text-[12.5px] leading-relaxed text-text-secondary">{why}</dd>
          </div>
        )}
      </dl>
    </article>
  );
}

function MitigationSection({ content }) {
  const mitigations = parseMitigations(content);

  if (mitigations.length === 0) {
    return (
      <article className="sni-prose">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </article>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
      {mitigations.map((item, idx) => (
        <MitigationCard key={`${item.title}-${idx}`} item={item} index={idx} />
      ))}
    </div>
  );
}

function CodeCard({ item }) {
  const t = useT();
  const { code, description, url, badge, fullTitle } = item;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={`${t('drawer.openDoc')}: ${code}${fullTitle ? ` — ${fullTitle}` : ''}`}
      className="rpt-surface rpt-focus group flex items-start gap-3.5 rounded-xl p-4 transition-colors hover:border-accent/40"
    >
      <span className="rpt-hair mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/[0.10] text-accent">
        <FileCheck className="h-4 w-4" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-data text-[12px] font-semibold uppercase tracking-[0.1em] text-accent">
            {code}
          </span>
          {badge && (
            <span className="rpt-hair rounded px-1.5 py-px font-data text-[10px] tracking-wide text-text-muted">
              {badge}
            </span>
          )}
        </span>
        {description && (
          <span className="mt-1 block text-[12.5px] leading-relaxed text-text-secondary">
            {description}
          </span>
        )}
      </span>

      <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-text-muted transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
    </a>
  );
}

function CodeSection({ content }) {
  const codes = parseBuildingCodes(content);

  if (codes.length === 0) {
    return (
      <article className="sni-prose">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </article>
    );
  }

  return (
    <div className="space-y-2.5">
      {codes.map((item, idx) => (
        <CodeCard key={`${item.code}-${idx}`} item={item} />
      ))}
    </div>
  );
}

/**
 * Satu bagian naratif yang selalu terbuka. Versi lama melipat semua bagian
 * di balik akordeon — pembaca bisnis kehilangan isi laporan karena harus
 * mengklik tujuh kali untuk membaca satu dokumen.
 */
function NarrativeSection({ title, content }) {
  const s = String(title || '').toLowerCase();

  const isMitigation = s.includes('mitigasi') || s.includes('mitigation') || s.includes('rekomendasi');
  const isCode =
    s.includes('persyaratan bangunan') ||
    s.includes('building code') ||
    s.includes('regulasi') ||
    s.includes('sni') ||
    s.includes('standar');

  return (
    <section className="rpt-section-item">
      {title && (
        <div className="mb-3 flex items-center gap-2.5">
          <span className="rpt-hair flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent/[0.08]">
            <SectionIcon title={title} className="h-3.5 w-3.5 text-accent" />
          </span>
          <h3 className="min-w-0 font-display text-[12px] font-bold uppercase tracking-[0.14em] text-text-primary">
            {title}
          </h3>
        </div>
      )}
      <div className="max-w-[74ch] pb-1">
        {isMitigation ? (
          <MitigationSection content={content} />
        ) : isCode ? (
          <CodeSection content={content} />
        ) : (
          <article className="sni-prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {content}
            </ReactMarkdown>
          </article>
        )}
      </div>
    </section>
  );
}

/**
 * Daftar bagian naratif. Dipakai bersama oleh laporan tunggal dan mode
 * bandingkan (lewat properti renderSections BattleReport).
 */
export function NarrativeSectionList({ markdown }) {
  const sections = parseReportSections(markdown);

  if (sections.length === 0) {
    return (
      <article className="sni-prose max-w-[74ch]">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {markdown}
        </ReactMarkdown>
      </article>
    );
  }

  return (
    <div className="rpt-sections">
      {sections.map((sec, idx) => (
        <NarrativeSection key={`${sec.title}-${idx}`} title={sec.title} content={sec.content} />
      ))}
    </div>
  );
}

// ─── Bagian 04: kelengkapan data ─────────────────────────────────────

const COVERAGE_LABELS = {
  location: 'Lokasi',
  elevation: 'Elevasi',
  soil: 'Tanah / Vs30',
  seismic: 'PGA',
  fault_reference: 'Referensi sesar',
  flood: 'Banjir',
  landslide: 'Longsor',
  subsidence: 'Subsiden',
  weather: 'Cuaca',
  soil_moisture: 'Kelembapan tanah',
  air_quality: 'Kualitas udara',
  earthquake_history: 'Riwayat gempa',
  nearby: 'Objek sekitar',
  tsunami: 'Tsunami',
  tsunami_map: 'Peta tsunami InaRISK',
  liquefaction_map: 'Peta likuefaksi InaRISK',
  volcanic_map: 'Peta letusan gunungapi InaRISK',
  coastal_map: 'Peta abrasi/gelombang InaRISK',
  official_vs30_grid: 'Grid Vs30 resmi',
  official_pga_grid: 'Grid PGA resmi',
};

const COVERAGE_LABELS_EN = {
  location: 'Location',
  elevation: 'Elevation',
  soil: 'Soil / Vs30',
  seismic: 'PGA',
  fault_reference: 'Fault reference',
  flood: 'Flood',
  landslide: 'Landslide',
  subsidence: 'Subsidence',
  weather: 'Weather',
  soil_moisture: 'Soil moisture',
  air_quality: 'Air quality',
  earthquake_history: 'Earthquake history',
  nearby: 'Nearby objects',
  tsunami: 'Tsunami',
  tsunami_map: 'InaRISK tsunami map',
  liquefaction_map: 'InaRISK liquefaction map',
  volcanic_map: 'InaRISK volcanic map',
  coastal_map: 'InaRISK coastal map',
  official_vs30_grid: 'Official Vs30 grid',
  official_pga_grid: 'Official PGA grid',
};

const COVERAGE_TONE = {
  official: TONE_HEX.safe,
  model: TONE_HEX.moderate,
  reference: ACCENT,
  open_data: ACCENT,
};

function DataCoveragePanel({ property, lang }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const quality = property?.data_quality || {};
  const fields = quality.fields || {};
  const labels = lang === 'en' ? COVERAGE_LABELS_EN : COVERAGE_LABELS;
  const entries = Object.entries(labels)
    .filter(([key]) => fields[key])
    .map(([key, label]) => [key, label, fields[key]]);

  if (entries.length === 0) return null;

  const covered = entries.filter(([, , item]) => item.status && item.status !== 'unavailable').length;

  const statusLabel = (status) =>
    ({
      official: lang === 'en' ? 'OFFICIAL' : 'RESMI',
      model: 'MODEL',
      reference: lang === 'en' ? 'REFERENCE' : 'REFERENSI',
      open_data: 'OPEN DATA',
      unavailable: lang === 'en' ? 'UNAVAILABLE' : 'BELUM TERSEDIA',
    })[status] || String(status || '—').toUpperCase();

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="rpt-eyebrow">{t('drawer.dataCoverage')}</span>
        <span className="data-num shrink-0 text-[12px] font-semibold text-text-primary">
          {covered}
          <span className="text-text-muted">/{entries.length}</span>
        </span>
      </div>

      <div className="mt-2.5 flex h-2 gap-[2px]">
        {entries.map(([key, label, item]) => (
          <span
            key={key}
            title={`${label} — ${statusLabel(item.status)}`}
            className="min-w-[3px] flex-1 rounded-[2px]"
            style={{ background: COVERAGE_TONE[item.status] || 'var(--rpt-line-strong)' }}
          />
        ))}
      </div>

      <p className="mt-2.5 text-[11.5px] leading-relaxed text-text-muted">
        {quality.coverage_status === 'complete_with_estimates'
          ? t('drawer.coverageComplete')
          : t('drawer.coverageUnavailable')}
      </p>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="rpt-focus mt-1 flex min-h-[40px] items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent transition-opacity hover:opacity-80"
      >
        {t('drawer.detail')}
        <span className="font-data font-normal normal-case tracking-normal text-text-muted">
          ({quality.mode === 'best_available' ? t('drawer.bestAvailable') : t('drawer.strict')})
        </span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.24, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="overflow-hidden"
          >
            <dl className="rpt-rows mt-2">
              {entries.map(([key, label, item]) => (
                <div key={key} className="flex items-baseline justify-between gap-3 py-1.5">
                  <dt className="min-w-0 truncate text-[11.5px] text-text-secondary">{label}</dt>
                  <dd
                    className="shrink-0 font-data text-[10px] uppercase tracking-[0.1em]"
                    style={{ color: COVERAGE_TONE[item.status] || undefined }}
                  >
                    <span className={COVERAGE_TONE[item.status] ? '' : 'text-text-muted'}>
                      {statusLabel(item.status)}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </motion.div>
        )}
      </AnimatePresence>

      {quality.estimated_fields?.length > 0 && (
        <p className="mt-3 text-[10.5px] leading-relaxed text-text-muted">
          <span className="font-data uppercase tracking-[0.1em]">{t('drawer.modelProxy')}</span>{' '}
          {quality.estimated_fields.map((name) => labels[name] || name).join(', ')}.
        </p>
      )}
    </div>
  );
}

// ─── Laporan utuh ────────────────────────────────────────────────────

/**
 * Laporan audit SNI dalam satu komponen — dipakai bersama oleh drawer
 * aplikasi dan halaman publik /laporan/:slug agar keduanya tidak lagi
 * punya dua bahasa visual berbeda untuk data yang sama.
 *
 * Struktur mengikuti kerangka laporan siap-PBG: ringkasan eksekutif,
 * parameter seismik, bahaya multirisiko, kelengkapan data, kesiapan PBG,
 * analisis naratif, metodologi & batasan.
 */
export default function SniReport({ property }) {
  const t = useT();
  const lang = useAppStore((s) => s.lang);
  const L = (entry) => tr(lang, entry);

  if (!property) return null;

  const geo = property.geotech || {};
  const hazard = property.hazard || {};
  const env = property.environment || {};
  const aiReport = property.aiReport || {};
  const fault = geo.nearest_fault || {};

  const score = typeof property.safe_score === 'number' ? property.safe_score : null;
  const vs30 = num(geo.vs30);
  const fs = num(geo.fs);
  const pgaBed = num(geo.pga);
  const pgaSurf = num(geo.pga_surface) ?? num(property?.seismic?.pgaSurface);
  const fa = num(geo.fa);
  const t0 = num(geo.t0_resonance);
  const faultDist = num(fault.distance_km);
  const elevation =
    num(property.elevation) ?? num(geo.elevation_m);

  const flood = hazardBand(hazard.flood_label);
  const floodKnown = hazard.flood_known !== false;

  // Nomor dokumen bergaya arsip — sama dengan konvensi sampul PDF.
  const dateFrom = property.created_at ? new Date(property.created_at) : new Date();
  const validDate = !Number.isNaN(dateFrom.getTime());
  const ymd = validDate
    ? `${dateFrom.getFullYear()}${String(dateFrom.getMonth() + 1).padStart(2, '0')}${String(
        dateFrom.getDate()
      ).padStart(2, '0')}`
    : '';
  const dateLabel = validDate
    ? dateFrom.toLocaleDateString(lang === 'en' ? 'en-US' : 'id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';
  const coordOk = num(property.lat) != null && num(property.lon) != null;
  const docRef =
    ymd && coordOk
      ? `SH-${ymd}-${property.lat.toFixed(4)}-${property.lon.toFixed(4)}`
      : '';

  // Dua kekhawatiran teratas dari indeks radar — konteks bisnis yang
  // sebelumnya hanya ada di PDF dan tak pernah tampil di layar.
  const RADAR_META = [
    ['flood', 'radarFlood'],
    ['seismic', 'radarSeismic'],
    ['soil', 'radarSoil'],
    ['landslide', 'radarLandslide'],
    ['subsidence', 'radarSubsidence'],
    ['air', 'radarAir'],
  ];
  const radarEntries = RADAR_META.map(([key, copyKey]) => ({
    key,
    label: L(COPY[copyKey]),
    value: num(hazard.radar?.[key]),
  })).filter((e) => e.value != null);
  const topConcerns = [...radarEntries]
    .filter((e) => e.value >= 45)
    .sort((a, b) => b.value - a.value)
    .slice(0, 2);

  const paramRows = [
    {
      label: L(COPY.vs30),
      value: vs30 != null ? `${vs30} m/s` : '—',
      note: vs30 != null ? siteClass(vs30, lang) : null,
    },
    {
      label: L(COPY.siteClassLabel),
      value: geo.site_class || '—',
      note: null,
    },
    {
      label: L(COPY.bedrockPga),
      value: pgaBed != null ? `${pgaBed.toFixed(3)} g` : '—',
      note: null,
    },
    {
      label: L(COPY.faFactor),
      value: fa != null ? fa.toFixed(2) : '—',
      note: null,
    },
    {
      label: L(COPY.surfacePgaLabel),
      value: pgaSurf != null ? `${pgaSurf.toFixed(3)} g` : '—',
      note: null,
      tone: thresholdTone(pgaSurf, 0.2, 0.5),
    },
    {
      label: L(COPY.resonanceT0),
      value: t0 != null ? `${t0.toFixed(2)} s` : '—',
      note: null,
    },
    {
      label: L(COPY.faultRow),
      value: faultDist != null ? `${faultDist.toFixed(1)} km` : '—',
      note: fault.name || null,
      tone: faultDist == null ? null : faultDist < 10 ? 'danger' : faultDist < 30 ? 'moderate' : null,
    },
  ];

  if (geo.nearest_megathrust?.distance_km != null) {
    paramRows.push({
      label: L(COPY.megathrustRow),
      value: `${num(geo.nearest_megathrust.distance_km)?.toFixed(0)} km`,
      note: geo.nearest_megathrust.name || null,
    });
  }
  if (geo.nearest_volcano?.distance_km != null) {
    paramRows.push({
      label: L(COPY.volcanoRow),
      value: `${num(geo.nearest_volcano.distance_km)?.toFixed(0)} km`,
      note: geo.nearest_volcano.name || null,
    });
  }
  const recentCount = num(property.seismic?.recent_count);
  if (recentCount != null) {
    paramRows.push({
      label: L(COPY.seismicityRow),
      value: `${recentCount}`,
      note: L(COPY.events),
    });
  }

  const hazardRows = [
    {
      label: L(COPY.floodRow),
      band: floodKnown && flood.band ? flood.band : '',
      note: !floodKnown
        ? t('drawer.dataUnavailable')
        : flood.provisional
          ? lang === 'en'
            ? 'provincial estimate, not a flood map'
            : 'estimasi provinsi, bukan peta banjir'
          : null,
      tone: floodKnown && flood.band ? bandTone(flood.band) : null,
    },
    {
      label: L(COPY.tsunamiRow),
      band: hazard.tsunami_scored !== false && hazard.tsunami ? hazardBand(hazard.tsunami).band || String(hazard.tsunami) : '',
      note: null,
      tone: bandTone(hazardBand(hazard.tsunami).band || hazard.tsunami),
    },
    {
      label: L(COPY.landslideRow),
      band: hazard.landslide_known !== false ? hazardBand(hazard.landslide_label).band : '',
      note: hazard.landslide_known === false ? t('drawer.dataUnavailable') : null,
      tone: hazard.landslide_known !== false ? bandTone(hazardBand(hazard.landslide_label).band) : null,
    },
    {
      label: L(COPY.subsidenceRow),
      band: hazard.subsidence_data_status !== 'unavailable' ? hazardBand(hazard.subsidence_label).band : '',
      note: hazard.subsidence_source || null,
      tone: hazard.subsidence_data_status !== 'unavailable' ? bandTone(hazardBand(hazard.subsidence_label).band) : null,
    },
    ...(geo.nearest_coast?.distance_km != null
      ? [
          {
            label: L(COPY.coastRow),
            band: '',
            note: `${num(geo.nearest_coast.distance_km)?.toFixed(1)} km${geo.nearest_coast.name ? ` · ${geo.nearest_coast.name}` : ''}`,
            tone: null,
          },
        ]
      : []),
  ];

  const confidence = num(property.confidence);

  return (
    <article className="sni-report mx-auto w-full min-w-0">
      {/* ── Kepala dokumen ── */}
      <header className="rpt-hair-b mb-9 pb-6">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <span className="rpt-eyebrow text-accent">{L(COPY.mastheadEyebrow)}</span>
            <h1
              className="mt-2.5 max-w-[42ch] font-display text-[22px] font-bold leading-[1.2] tracking-tight text-text-primary sm:text-[28px]"
              title={property.address}
            >
              {shortAddress(property.address, 3) || property.address}
            </h1>
            <p className="rpt-legend mt-3 flex-wrap font-data text-[11px] tracking-wide text-text-muted">
              {coordOk && (
                <span>
                  {property.lat.toFixed(5)}, {property.lon.toFixed(5)}
                </span>
              )}
              {elevation != null && (
                <span>
                  {elevation} mdpl{geo.elevation_assumed ? ' *' : ''}
                </span>
              )}
              {geo.nearest_city && <span>{geo.nearest_city}</span>}
            </p>
          </div>

          {(docRef || dateLabel) && (
            <div className="hidden shrink-0 text-right sm:block">
              {docRef && (
                <>
                  <p className="font-data text-[9.5px] uppercase tracking-[0.18em] text-text-muted">
                    {L(COPY.docRef)}
                  </p>
                  <p className="data-num mt-0.5 text-[11px] text-text-secondary">{docRef}</p>
                </>
              )}
              {dateLabel && (
                <>
                  <p className="mt-2.5 font-data text-[9.5px] uppercase tracking-[0.18em] text-text-muted">
                    {L(COPY.standard)}
                  </p>
                  <p className="data-num text-[11px] text-text-secondary">SNI 1726:2019</p>
                  <p className="data-num mt-0.5 text-[10px] text-text-muted">{dateLabel}</p>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ── 01 · Ringkasan Eksekutif ── */}
      <section className="mb-12">
        <SectionHeading num="01" title={L(COPY.execSummary)} />

        {hazard.is_water === true && (
          <div
            className="mb-5 flex items-start gap-3 rounded-xl border p-4"
            style={{ borderColor: `${TONE_HEX.moderate}44`, background: 'rgba(245, 158, 11, 0.06)' }}
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-risk-moderate" />
            <div>
              <p className="mb-0.5 text-[13px] font-semibold text-risk-moderate">
                {L(COPY.waterBodyTitle)}
              </p>
              <p className="text-[12px] leading-relaxed text-text-muted">{L(COPY.waterBodyNote)}</p>
            </div>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-12">
          <div className="lg:w-72">
            <p className="rpt-eyebrow mb-2">{t('drawer.safeScore')}</p>
            <ScorePanel score={score} ready={score != null} status={property.audit_status} lang={lang} />
          </div>

          <div className="min-w-0 space-y-4">
            {topConcerns.length > 0 && (
              <div>
                <p className="rpt-eyebrow mb-2">{L(COPY.mainConcern)}</p>
                <div className="flex flex-wrap gap-2">
                  {topConcerns.map((c) => {
                    const tone = thresholdTone(c.value, 70, 999) || 'moderate';
                    const hex = TONE_HEX[tone];
                    return (
                      <span
                        key={c.key}
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold"
                        style={{
                          color: hex,
                          background: `${hex}12`,
                          border: `1px solid ${hex}33`,
                        }}
                      >
                        <span className="data-num opacity-70">{Math.round(c.value)}</span>
                        {c.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {confidence != null && (
              <div>
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <p className="rpt-eyebrow">{L(COPY.confidence)}</p>
                  <span className="data-num text-[12px] font-semibold text-text-secondary">
                    {Math.round(confidence)}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--rpt-well)' }}>
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${clamp(confidence, 0, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Empat ubin keputusan: likuefaksi, kelas situs, PGA, banjir. */}
        <div className="mt-7 grid grid-cols-2 gap-2.5 xl:grid-cols-4">
          <KpiTile
            label={t('drawer.liquefaction')}
            value={fs != null ? fs.toFixed(2) : '—'}
            note={
              fs == null
                ? null
                : fs < 1
                  ? t('drawer.liquefactionRisk')
                  : t('drawer.safe')
            }
            tone={fsTone(fs)}
          />
          <KpiTile
            label={t('report.siteClass')}
            value={geo.site_class || '—'}
            note={vs30 != null ? `${vs30} m/s` : null}
          />
          <KpiTile
            label={t('drawer.surfacePga')}
            value={pgaSurf != null ? `${pgaSurf.toFixed(3)} g` : '—'}
            note={
              pgaBed != null || fa != null
                ? `${L(COPY.bedrockPga)} ${pgaBed != null ? pgaBed.toFixed(3) : '—'} · Fa ${fa != null ? fa.toFixed(2) : '—'}`
                : null
            }
            tone={thresholdTone(pgaSurf, 0.2, 0.5)}
          />
          <KpiTile
            label={t('report.flood')}
            value={floodKnown && flood.band ? flood.band : '—'}
            note={
              !floodKnown
                ? t('drawer.dataUnavailable')
                : flood.provisional
                  ? lang === 'en'
                    ? 'provincial estimate'
                    : 'estimasi provinsi'
                  : null
            }
            tone={floodKnown && flood.band ? bandTone(flood.band) : null}
          />
        </div>
      </section>

      {/* ── 02 · Parameter Seismik Situs ── */}
      {(vs30 != null || fs != null || pgaSurf != null || faultDist != null) && (
        <section className="mb-12">
          <SectionHeading num="02" title={L(COPY.seismicParams)} />

          <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
            <div className="min-w-0">
              <p className="rpt-eyebrow mb-1">{L(COPY.paramTable)}</p>
              <dl className="rpt-rows">
                {paramRows.map((row) => (
                  <div key={row.label} className="flex items-baseline justify-between gap-4 py-2.5">
                    <dt className="min-w-0 text-[12px] text-text-muted">{row.label}</dt>
                    <dd className="min-w-0 max-w-[62%] text-right">
                      <span
                        className={`data-num block text-[14px] font-semibold ${row.tone ? '' : 'text-text-primary'}`}
                        style={row.tone ? { color: TONE_HEX[row.tone] } : undefined}
                      >
                        {row.value}
                      </span>
                      {row.note && (
                        <span className="mt-0.5 block break-words text-[10.5px] leading-tight text-text-muted">
                          {row.note}
                        </span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="min-w-0 space-y-6">
              {vs30 != null && (
                <ClassStrip
                  vs30={vs30}
                  label={t('drawer.soilStrength')}
                  classLabels={{
                    soft: t('drawer.soft'),
                    medium: t('drawer.medium'),
                    hard: t('drawer.hard'),
                    rock: t('drawer.rock'),
                  }}
                />
              )}

              {fs != null && (
                <Meter
                  label={L(COPY.liquefactionMeter)}
                  value={fs}
                  min={0}
                  max={2.5}
                  tone={fsTone(fs)}
                  readout={`FS ${fs.toFixed(2)} · ${fs < 1 ? t('drawer.liquefactionRisk') : t('drawer.safe')}`}
                  zones={[
                    { from: 0, to: 1, tone: 'danger' },
                    { from: 1, to: 1.4, tone: 'moderate' },
                    { from: 1.4, to: 2.5, tone: 'safe' },
                  ]}
                  ticks={[
                    { at: 0, label: '0' },
                    { at: 1, label: t('drawer.liquefactionCritical') },
                    { at: 1.4, label: L(COPY.fsDesignMargin) },
                    { at: 2.5, label: '2,5+' },
                  ]}
                />
              )}

              {pgaSurf != null && (
                <Meter
                  label={L(COPY.pgaMeter)}
                  value={pgaSurf}
                  min={0}
                  max={1}
                  tone={thresholdTone(pgaSurf, 0.2, 0.5)}
                  readout={`${pgaSurf.toFixed(3)} g`}
                  zones={[
                    { from: 0, to: 0.2, tone: 'safe' },
                    { from: 0.2, to: 0.5, tone: 'moderate' },
                    { from: 0.5, to: 1, tone: 'danger' },
                  ]}
                  ticks={[
                    { at: 0, label: '0' },
                    { at: 0.2, label: '0,2 g' },
                    { at: 0.5, label: '0,5 g' },
                    { at: 1, label: '1,0 g' },
                  ]}
                />
              )}

              {faultDist != null && (
                <Meter
                  label={`${L(COPY.faultMeter)}${fault.name ? ` · ${fault.name}` : ''}`}
                  value={faultDist}
                  min={0}
                  max={60}
                  tone={faultDist < 10 ? 'danger' : faultDist < 30 ? 'moderate' : 'safe'}
                  readout={`${faultDist.toFixed(1)} km`}
                  zones={[
                    { from: 0, to: 10, tone: 'danger' },
                    { from: 10, to: 30, tone: 'moderate' },
                    { from: 30, to: 60, tone: 'safe' },
                  ]}
                  ticks={[
                    { at: 0, label: t('drawer.fault') },
                    { at: 10, label: '10 km' },
                    { at: 30, label: '30 km' },
                    { at: 60, label: '60+ km' },
                  ]}
                />
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── 03 · Bahaya Multirisiko ── */}
      <section className="mb-12">
        <SectionHeading num="03" title={L(COPY.hazards)} />

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
          <div className="min-w-0">
            <p className="rpt-eyebrow mb-1">{L(COPY.hazardRowsTitle)}</p>
            <dl className="rpt-rows">
              {hazardRows.map((row) => (
                <HazardRow key={row.label} {...row} />
              ))}
            </dl>
          </div>

          <div className="min-w-0 space-y-6">
            {radarEntries.length > 0 && (
              <div className="rpt-surface space-y-2.5 rounded-xl p-4">
                <p className="rpt-eyebrow">{L(COPY.radarTitle)}</p>
                {radarEntries.map((e) => (
                  <RadarBar key={e.key} label={e.label} value={e.value} />
                ))}
              </div>
            )}

            {elevation != null && (
              <TerrainProfile
                elevationM={elevation}
                label={L(COPY.terrainMeter)}
                readout={`${elevation} mdpl`}
                captions={[t('drawer.coastalSurge'), t('drawer.localFlood'), t('drawer.noFlood')]}
              />
            )}

            {num(env.aqi) != null && (
              <Meter
                label={t('drawer.airQuality')}
                value={env.aqi}
                min={0}
                max={100}
                tone={env.aqi > 80 ? 'danger' : env.aqi > 40 ? 'moderate' : 'safe'}
                readout={`AQI ${env.aqi}`}
                zones={[
                  { from: 0, to: 40, tone: 'safe' },
                  { from: 40, to: 80, tone: 'moderate' },
                  { from: 80, to: 100, tone: 'danger' },
                ]}
                ticks={[
                  { at: 0, label: '0' },
                  { at: 40, label: '40' },
                  { at: 80, label: '80' },
                  { at: 100, label: '100+' },
                ]}
              />
            )}
          </div>
        </div>
      </section>

      {/* ── 04 · Kelengkapan & Sumber Data ── */}
      <section className="mb-12">
        <SectionHeading num="04" title={L(COPY.dataQuality)} />

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
          <div className="min-w-0">
            {property.data_quality?.fields ? (
              <DataCoveragePanel property={property} lang={lang} />
            ) : (
              <p className="text-[12px] text-text-muted">—</p>
            )}

            {property.sources_failed?.length > 0 && (
              <p className="rpt-hair mt-5 rounded-lg px-3 py-2.5 text-[11px] leading-relaxed text-text-muted">
                {t('report.sourcesUnavailable')} ({property.sources_failed.join(', ')}).{' '}
                {t('report.unknownNotSafe')}
              </p>
            )}
          </div>

          <div className="min-w-0 space-y-4">
            {Array.isArray(aiReport.sources) && aiReport.sources.length > 0 && (
              <div>
                <p className="rpt-eyebrow mb-2">{L(COPY.sourcesList)}</p>
                <ol className="sni-ol space-y-1">
                  {aiReport.sources.slice(0, 8).map((src, i) => (
                    <li key={i} className="sni-li text-[11.5px] leading-relaxed text-text-muted">
                      <span className="min-w-0">{typeof src === 'string' ? src : src?.name || JSON.stringify(src)}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {Array.isArray(aiReport.dataLimitations) && aiReport.dataLimitations.length > 0 && (
              <div>
                <p className="rpt-eyebrow mb-2">{L(COPY.limitationsList)}</p>
                <ul className="space-y-1">
                  {aiReport.dataLimitations.slice(0, 6).map((lim, i) => (
                    <li key={i} className="sni-li text-[11.5px] leading-relaxed text-text-muted">
                      <span className="min-w-0">{typeof lim === 'string' ? lim : lim?.description || JSON.stringify(lim)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 05 · Kesiapan PBG ── */}
      {Array.isArray(property.pbg_checklist) && property.pbg_checklist.length > 0 && (
        <section className="mb-12">
          <SectionHeading num="05" title={L(COPY.pbgReadiness)} />
          <div className="max-w-xl">
            <PbgChecklistCard property={property} />
          </div>
        </section>
      )}

      {/* ── 06 · Analisis & Rekomendasi ── */}
      <section className="mb-12">
        <SectionHeading
          num="06"
          title={L(COPY.analysis)}
          aside={
            <ProvenanceChip
              state={aiReport.deliveryMode || 'engine'}
              detail={
                aiReport.deliveryMode === 'cached'
                  ? t('drawer.cached')
                  : aiReport.aiModel || aiReport.generatedBy || null
              }
            />
          }
        />

        {aiReport.aiError ? (
          <div
            className="flex items-start gap-3 rounded-xl border p-4"
            style={{
              borderColor: `${TONE_HEX.danger}40`,
              background: 'rgba(239, 68, 68, 0.06)',
            }}
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-risk-danger" />
            <div>
              <p className="mb-1 text-[13px] font-semibold text-risk-danger">{t('drawer.aiUnavailable')}</p>
              <p className="text-[12px] leading-relaxed text-text-muted">{t('drawer.deterministicValid')}</p>
            </div>
          </div>
        ) : aiReport.reportLoading ? (
          <ReportSkeleton label={lang === 'en' ? 'Generating report' : 'Menyusun laporan'} />
        ) : aiReport.detailedReport ? (
          <NarrativeSectionList markdown={aiReport.detailedReport} />
        ) : (
          <p className="text-sm text-text-muted">{L(COPY.noNarrative)}</p>
        )}

        {aiReport.microAnalysis && (
          <p className="rpt-hair-t mt-8 max-w-[74ch] pt-5 text-[12px] leading-relaxed text-text-muted">
            <span className="font-semibold text-text-secondary">{t('drawer.nearbyContext')}</span>
            {aiReport.microAnalysis}
          </p>
        )}
      </section>

      {/* ── Kolofon ── */}
      <footer className="rpt-hair-t pt-5">
        <p className="rpt-eyebrow">{L(COPY.methodology)}</p>
        <p className="mt-2 max-w-[74ch] text-[11.5px] leading-relaxed text-text-muted">
          {t('drawer.disclaimer')} {L(COPY.deskStudy)}
        </p>
        {(aiReport.aiModel || aiReport.generatedBy || property.score_version) && (
          <p className="rpt-legend mt-3 font-data text-[10px] text-text-muted">
            {aiReport.aiModel && <span>{`${L(COPY.generatedBy)}: ${aiReport.aiModel}`}</span>}
            {!aiReport.aiModel && aiReport.generatedBy && (
              <span>{`${L(COPY.generatedBy)}: ${aiReport.generatedBy}`}</span>
            )}
            {property.score_version && <span>{property.score_version}</span>}
          </p>
        )}
      </footer>
    </article>
  );
}
