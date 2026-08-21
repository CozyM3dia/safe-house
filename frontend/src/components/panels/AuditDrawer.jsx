import { createElement, useEffect, useRef, useState } from 'react';
import { Drawer } from 'vaul';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Check,
  ChevronDown,
  Copy,
  Download,
  Droplets,
  ExternalLink,
  FileCheck,
  FileText,
  GitCompareArrows,
  Info,
  Layers,
  Loader2,
  MapPin,
  Scale,
  Sparkles,
  TrendingUp,
  Wrench,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { useAppStore } from '../../store/useAppStore';
import { useT } from '../../hooks/useTranslation';
import { Button } from '../ui/button';
import { Skeleton, SkeletonText } from '../ui/skeleton';
import { PbgChecklistCard } from '../cards/PbgChecklistCard';
import { hazardBand, locationToUrl, riskHex, riskLabel, shortAddress } from '../../lib/utils';
import { siteClass } from '../../lib/formatters';
import { parseBuildingCodes } from '../../lib/standards';
import { canExportSniReport, exportPrintReadyPdf } from '../../lib/pdfExport';

// ─── Primitif visual ────────────────────────────────────────────────
//
// Laporan versi lama memakai sembilan keluarga warna (ungu, cyan, rose,
// emerald, biru…) untuk membedakan bagian, ukuran font turun sampai 7,5px,
// dan skala risiko digambar sebagai gradien tiga warna dengan opacity 55%.
// Hasilnya terbaca sebagai dasbor mainan, bukan dokumen teknis. Di sini
// paletnya dikunci: satu aksen merek + tiga warna risiko yang punya arti
// (aman / sedang / bahaya), dengan ambang batas 10px untuk semua teks.

const TONE_HEX = {
  danger: '#ef4444',
  moderate: '#f59e0b',
  safe: '#10b981',
};

const ZONE_BG = {
  danger: 'rgba(239, 68, 68, 0.26)',
  moderate: 'rgba(245, 158, 11, 0.24)',
  safe: 'rgba(16, 185, 129, 0.24)',
  neutral: 'rgba(212, 149, 106, 0.14)',
};

const ACCENT = 'hsl(var(--safe-accent))';

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
// Beberapa kunci i18n menyimpan titik dua di akhir ("Tindakan: "); sebagai
// label kapital-spasi-lebar, tanda itu menggantung tanpa isi.
const stripColon = (s) => String(s).replace(/\s*:\s*$/, '');

function computeScore(p) {
  if (typeof p?.safe_score === 'number') return p.safe_score;
  return null;
}

/** Label sumbu di ujung rel akan terpotong bila selalu dipusatkan. */
function tickStyle(pct) {
  if (pct <= 1) return { left: 0 };
  if (pct >= 99) return { right: 0 };
  return { left: `${pct}%`, transform: 'translateX(-50%)' };
}

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

/**
 * Rel ukur tunggal yang dipakai ulang untuk FS, PGA, jarak sesar, dan AQI.
 *
 * Zona diwarnai rata — bukan gradien — supaya batas ambang terlihat sebagai
 * garis keputusan, bukan sapuan dekoratif. Jarumnya diberi cincin sewarna
 * panel agar tetap terbaca di atas pita merah maupun hijau.
 */
function Meter({ label, value, min, max, zones = [], ticks = [], readout, tone }) {
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

/**
 * Kelas situs SNI 1726 sebagai satu rel bersambung.
 *
 * Empat kotak terpisah versi lama tidak menunjukkan bahwa kelas situs adalah
 * pembagian dari satu sumbu Vs30 yang sama; nilai 450 m/s terlihat sebagai
 * "kotak SC menyala", bukan sebagai posisi di dalam rentang 360-760.
 */
function ClassStrip({ vs30, label, classLabels }) {
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
                // Isian aksen saja terlalu tipis untuk menandai kelas aktif di
                // mode terang; cincin dalam memberinya tepi yang jelas.
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

/**
 * Profil topografi tapak terhadap muka air.
 *
 * Menggantikan susunan balok CSS dan emoji rumah — yang terbaca sebagai
 * clip-art — dengan penampang melintang: laut, dataran pesisir, perbukitan,
 * dataran tinggi, plus garis putus-putus batas rob.
 */
function TerrainProfile({ elevationM, label, readout, captions }) {
  const idx = elevationM < 10 ? 0 : elevationM < 50 ? 1 : 2;
  // Bidang gambar sengaja dibuat sangat lebar (400×62) — pada rasio 200×56
  // penampangnya melar setinggi 200px di kolom laporan dan menenggelamkan
  // teks di sekitarnya.
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
          <line
            x1={marker.x}
            y1={marker.y}
            x2={marker.x}
            y2={marker.y - 11}
            stroke={ACCENT}
            strokeWidth="1.5"
          />
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

      {/* Kolom keterangan mengikuti lebar pita ketinggiannya, bukan dibagi tiga
          sama rata, supaya setiap label berdiri di atas zonanya sendiri. */}
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

function VisualBlock({ children }) {
  return (
    <div className="rpt-surface mt-5 space-y-5 rounded-xl p-4 sm:p-5">{children}</div>
  );
}

// ─── Visualisasi per bagian ─────────────────────────────────────────
//
// Semua nilai dibaca apa adanya. Versi lama memasang default diam-diam
// (`?? 180`, `?? 0.35`, `?? 20`) sehingga lokasi tanpa data tetap menampilkan
// jarum di posisi tertentu — angka karangan yang terlihat seperti pengukuran.

function SoilVisual({ property }) {
  const t = useT();
  const geo = property?.geotech || {};
  const vs30 = num(geo.vs30);
  const fs = num(geo.fs);
  if (vs30 == null && fs == null) return null;

  const fsTone = fs == null ? undefined : fs < 1 ? 'danger' : fs < 1.25 ? 'moderate' : 'safe';

  return (
    <VisualBlock>
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
          label={t('drawer.liquefactionSafety')}
          value={fs}
          min={0}
          max={2.5}
          tone={fsTone}
          readout={`FS ${fs.toFixed(2)} · ${fs < 1 ? t('drawer.liquefactionRisk') : t('drawer.safe')}`}
          zones={[
            { from: 0, to: 1, tone: 'danger' },
            { from: 1, to: 1.25, tone: 'moderate' },
            { from: 1.25, to: 2.5, tone: 'safe' },
          ]}
          ticks={[
            { at: 0, label: '0' },
            { at: 1, label: `1,0 · ${t('drawer.liquefactionCritical')}` },
            { at: 2.5, label: '2,5+' },
          ]}
        />
      )}
    </VisualBlock>
  );
}

function SeismicVisual({ property }) {
  const t = useT();
  const geo = property?.geotech || {};
  const pga = num(geo.pga_surface) ?? num(property?.seismic?.pgaSurface);
  const fault = geo.nearest_fault || {};
  const dist = num(fault.distance_km);
  if (pga == null && dist == null) return null;

  const pgaTone = pga == null ? undefined : pga >= 0.5 ? 'danger' : pga >= 0.2 ? 'moderate' : 'safe';
  const distTone = dist == null ? undefined : dist < 10 ? 'danger' : dist < 30 ? 'moderate' : 'safe';

  return (
    <VisualBlock>
      {pga != null && (
        <Meter
          label={t('drawer.maxGroundAcceleration')}
          value={pga}
          min={0}
          max={1}
          tone={pgaTone}
          readout={`${pga.toFixed(3)} g`}
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

      {dist != null && (
        <Meter
          label={`${t('drawer.activeFaultProximity')}${fault.name ? ` · ${fault.name}` : ''}`}
          value={dist}
          min={0}
          max={60}
          tone={distTone}
          readout={`${dist.toFixed(1)} km`}
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
    </VisualBlock>
  );
}

function EnvironmentVisual({ property }) {
  const t = useT();
  const elevation = num(property?.elevation) ?? num(property?.geotech?.elevation_m);
  // Sumbernya Open-Meteo `european_aqi`: skala 0-100+, bukan AQI Amerika.
  // Ambang lama (50 / 100 / 150) memakai skala yang salah, sehingga udara
  // "buruk" menurut standar Eropa masih tampil hijau.
  const aqi = num(property?.environment?.aqi);
  if (elevation == null && aqi == null) return null;

  const aqiTone = aqi == null ? undefined : aqi > 80 ? 'danger' : aqi > 40 ? 'moderate' : 'safe';
  const aqiWord =
    aqi == null
      ? ''
      : aqi > 80
        ? t('drawer.veryUnhealthy')
        : aqi > 60
          ? t('drawer.aqiPoor')
          : aqi > 40
            ? t('drawer.medium')
            : aqi > 20
              ? t('drawer.aqiFair')
              : t('drawer.healthy');

  return (
    <VisualBlock>
      {elevation != null && (
        <TerrainProfile
          elevationM={elevation}
          label={t('drawer.coastalFloodLevel')}
          readout={`${elevation} mdpl`}
          captions={[t('drawer.coastalSurge'), t('drawer.localFlood'), t('drawer.noFlood')]}
        />
      )}

      {aqi != null && (
        <Meter
          label={t('drawer.airQuality')}
          value={aqi}
          min={0}
          max={100}
          tone={aqiTone}
          readout={`AQI ${aqi} · ${aqiWord}`}
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
    </VisualBlock>
  );
}

// ─── Pemecah markdown laporan ───────────────────────────────────────

const parseSections = (markdown) => {
  if (!markdown) return [];
  const lines = markdown.split('\n');
  const sections = [];
  let currentSection = null;

  // Terima header level-2 atau level-3 ("## Judul" atau "### Judul").
  const headerRe = /^#{2,3}\s+/;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (headerRe.test(line)) {
      if (currentSection) {
        sections.push(currentSection);
      }
      const title = line.replace(headerRe, '').replace(/\*/g, '').trim();
      currentSection = { title, contentLines: [] };
    } else if (currentSection) {
      currentSection.contentLines.push(lines[i]);
    }
  }
  if (currentSection) {
    sections.push(currentSection);
  }

  return sections.map((s) => ({
    title: s.title,
    content: s.contentLines.join('\n').trim(),
  }));
};

const parseMitigations = (content) => {
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
        const linesOfBlock = trimmed.split('\n');
        title = linesOfBlock[0].replace(/[\d.]/g, '').trim();
      }

      let action = '';
      let why = '';
      let cost = '';
      let priority = '';

      const linesOfBlock = trimmed.split('\n');
      for (const line of linesOfBlock) {
        const lineTrim = line.trim();
        if (lineTrim.match(/-\s*(?:Apa yang harus dilakukan|What to do|Tindakan|Action)\s*:\s*(.*)/i)) {
          action = lineTrim.match(
            /-\s*(?:Apa yang harus dilakukan|What to do|Tindakan|Action)\s*:\s*(.*)/i
          )[1].trim();
        } else if (lineTrim.match(/-\s*(?:Mengapa penting|Why it matters|Pentingnya|Rationale)\s*:\s*(.*)/i)) {
          why = lineTrim.match(
            /-\s*(?:Mengapa penting|Why it matters|Pentingnya|Rationale)\s*:\s*(.*)/i
          )[1].trim();
        } else if (lineTrim.match(/-\s*(?:Estimasi biaya|Estimated cost|Biaya|Cost)\s*:\s*(.*)/i)) {
          cost = lineTrim.match(/-\s*(?:Estimasi biaya|Estimated cost|Biaya|Cost)\s*:\s*(.*)/i)[1].trim();
        } else if (lineTrim.match(/-\s*(?:Prioritas|Priority)\s*:\s*(.*)/i)) {
          priority = lineTrim.match(/-\s*(?:Prioritas|Priority)\s*:\s*(.*)/i)[1].trim();
        }
      }

      if (title) {
        items.push({ title, action, why, cost, priority });
      }
    }
  } else {
    // Format satu baris:
    // **Audit Struktur oleh Ahli**: Wajib sebelum renovasi. Biaya: Rp 15-25 juta. Prioritas: WAJIB.
    for (const line of lines) {
      const lineTrim = line.trim();
      if (!lineTrim) continue;

      const boldMatch = lineTrim.match(/^(?:-\s*|\d+\.\s*)?\*\*(.*?)\*\*(?:\s*:\s*|\s*-\s*)(.*)/);
      if (boldMatch) {
        const title = boldMatch[1].trim();
        const rest = boldMatch[2].trim();

        let cost = '';
        let priority = '';
        let action = rest;

        const costMatch = rest.match(/(?:Estimasi biaya|Estimasi Biaya|Biaya|Cost)\s*:\s*([^.\n]+)/i);
        if (costMatch) {
          cost = costMatch[1].trim();
          action = action.replace(costMatch[0], '');
        }

        const priorityMatch = rest.match(/(?:Prioritas|Priority)\s*:\s*([^.\n]+)/i);
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

/**
 * Ikon per bagian tetap berbeda supaya laporan bisa dipindai cepat, tapi
 * warnanya tidak lagi. Satu aksen merek untuk semua bagian; warna risiko
 * disimpan khusus untuk angka yang memang punya ambang batas.
 */
const getSectionIcon = (title) => {
  const s = title.toLowerCase();
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

/** Dibungkus agar tabel ikon tidak terbaca sebagai komponen baru tiap render. */
const SectionIcon = ({ title, className }) =>
  createElement(getSectionIcon(title), { className });

// ─── Subkomponen laporan ────────────────────────────────────────────

function ReportSkeleton({ label = 'Loading report' }) {
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

  // Prioritas ditandai lewat tepi kartu dan chip, bukan pita samping tebal:
  // tiga kartu berdampingan dengan balok warna terbaca sebagai peringatan
  // berjenjang, padahal urutannya sudah dinyatakan oleh nomor dan chip.
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
      <article className="prose-safe rpt-prose">
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
      <article className="prose-safe rpt-prose">
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

function stripMarkdownNode(props) {
  const { node, ...rest } = props;
  void node;
  return rest;
}

const markdownComponents = {
  h4: (props) => (
    <h4
      className="mb-2 mt-5 text-[11px] font-bold uppercase tracking-[0.16em] text-text-primary"
      {...stripMarkdownNode(props)}
    />
  ),
  p: (props) => (
    <p className="mb-3 text-[13px] leading-[1.72] text-text-secondary" {...stripMarkdownNode(props)} />
  ),
  ul: (props) => <ul className="mb-3 list-none space-y-1.5 pl-0" {...stripMarkdownNode(props)} />,
  ol: (props) => <ol className="mb-3 list-none space-y-1.5 pl-0" {...stripMarkdownNode(props)} />,
  li: (props) => {
    const cleanProps = stripMarkdownNode(props);
    return (
      <li className="flex gap-2.5 text-[13px] leading-[1.72] text-text-secondary">
        <span
          aria-hidden="true"
          className="mt-[0.62em] h-px w-2.5 shrink-0"
          style={{ background: 'var(--rpt-line-strong)' }}
        />
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

function SectionCard({ title, content, defaultExpanded = false, property }) {
  const t = useT();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const s = title.toLowerCase();

  const isMitigation = s.includes('mitigasi') || s.includes('mitigation') || s.includes('rekomendasi');
  const isCode =
    s.includes('persyaratan bangunan') ||
    s.includes('building code') ||
    s.includes('regulasi') ||
    s.includes('sni') ||
    s.includes('standar');
  const isGeotechnical =
    s.includes('geoteknik') || s.includes('geotechnical') || s.includes('tanah') || s.includes('soil') || s.includes('stabilitas');
  const isSeismic =
    s.includes('gempa') || s.includes('seismic') || s.includes('sesar') || s.includes('tektonik');
  const isEnvironment =
    s.includes('banjir') || s.includes('flood') || s.includes('lingkungan') || s.includes('environmental') || s.includes('hidrometeorologi');

  return (
    <motion.section layout>
      <button
        type="button"
        aria-expanded={expanded}
        aria-label={`${expanded ? t('drawer.sectionCollapse') : t('drawer.sectionExpand')}: ${title}`}
        onClick={() => setExpanded((v) => !v)}
        className="rpt-focus group flex w-full items-center gap-3 py-4 text-left"
      >
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors"
          style={{
            borderColor: expanded ? 'hsl(var(--safe-accent) / 0.38)' : 'var(--rpt-line)',
            background: expanded ? 'hsl(var(--safe-accent) / 0.12)' : 'var(--rpt-fill)',
          }}
        >
          <SectionIcon
            title={title}
            className={`h-3.5 w-3.5 ${expanded ? 'text-accent' : 'text-text-muted'}`}
          />
        </span>

        <h3 className="min-w-0 flex-1 font-display text-[12px] font-bold uppercase tracking-[0.14em] text-text-primary">
          {title}
        </h3>

        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
            expanded ? 'rotate-180 text-accent' : 'text-text-muted group-hover:text-text-secondary'
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="overflow-hidden"
          >
            <div className="max-w-[74ch] pb-6 pl-10">
              {isMitigation ? (
                <MitigationSection content={content} />
              ) : isCode ? (
                <CodeSection content={content} />
              ) : (
                <article className="prose-safe rpt-prose max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {content}
                  </ReactMarkdown>
                </article>
              )}

              {isGeotechnical && property && <SoilVisual property={property} />}
              {isSeismic && property && <SeismicVisual property={property} />}
              {isEnvironment && property && <EnvironmentVisual property={property} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

function SectionList({ markdown, property, isExpanded }) {
  const sections = parseSections(markdown);

  if (sections.length === 0) {
    return (
      <article className="prose-safe rpt-prose max-w-[74ch]">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {markdown}
        </ReactMarkdown>
      </article>
    );
  }

  return (
    <div className="rpt-sections">
      {sections.map((sec, idx) => (
        <SectionCard
          key={`${sec.title}-${idx}`}
          title={sec.title}
          content={sec.content}
          defaultExpanded={isExpanded(sec, idx)}
          property={property}
        />
      ))}
    </div>
  );
}

/**
 * Asal laporan. Versi lama menuliskannya sebagai
 * `FALLBACK · DETERMINISTIC-ENGINE` dalam mono kapital — terbaca seperti
 * keluaran debug yang bocor ke antarmuka pengguna.
 */
function ProvenanceChip({ state, detail }) {
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
        <span className="truncate text-[10px] text-text-muted max-[479px]:hidden" title={detail}>
          {detail}
        </span>
      )}
    </span>
  );
}

// ─── Skor sebagai tokoh utama laporan ───────────────────────────────

function HeroScore({ score, ready, status }) {
  const t = useT();
  const lang = useAppStore((s) => s.lang);
  const hex = ready ? riskHex(score) : undefined;
  const meaningKey =
    score >= 70 ? 'drawer.relativeBuildable' : score >= 40 ? 'drawer.needsMitigation' : 'drawer.seriousMitigation';

  const bands = [
    { center: 19.5, name: riskLabel(20, lang), range: '0–39', tone: 'danger' },
    { center: 54.5, name: riskLabel(55, lang), range: '40–69', tone: 'moderate' },
    { center: 85, name: riskLabel(85, lang), range: '70–100', tone: 'safe' },
  ];
  const activeIdx = !ready ? -1 : score >= 70 ? 2 : score >= 40 ? 1 : 0;

  return (
    <section>
      <h2 className="rpt-eyebrow">{t('drawer.safeScore')}</h2>

      <div className="mt-2 flex items-baseline gap-2">
        <span
          className="data-num text-[64px] font-semibold leading-[0.85] tracking-tighter"
          style={{ color: hex }}
        >
          {ready ? score : '—'}
        </span>
        <span className="data-num text-[15px] text-text-muted">/100</span>
      </div>

      <div className="mt-3.5 flex flex-wrap items-center gap-2">
        <span
          className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.16em]"
          style={{ color: hex }}
        >
          {ready && (
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: hex }}
            />
          )}
          {ready ? riskLabel(score, lang) : t('drawer.auditDataInsufficient')}
        </span>
        {status && status !== 'valid' && (
          <span
            className="rpt-hair rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-risk-moderate"
            style={{ borderColor: `${TONE_HEX.moderate}44` }}
          >
            {status}
          </span>
        )}
      </div>

      {ready && (
        <>
          <p className="mt-2 text-[12.5px] leading-relaxed text-text-secondary">{t(meaningKey)}</p>

          <div className="mt-5">
            <div className="relative h-3.5">
              <div className="rpt-well absolute inset-x-0 top-1/2 h-[7px] -translate-y-1/2 overflow-hidden rounded-full">
                <div className="absolute inset-y-0 left-0 w-[39%]" style={{ background: ZONE_BG.danger }} />
                <div className="absolute inset-y-0 left-[39%] w-[31%]" style={{ background: ZONE_BG.moderate }} />
                <div className="absolute inset-y-0 left-[70%] right-0" style={{ background: ZONE_BG.safe }} />
                <div className="rpt-tick absolute inset-y-0 left-[39%] w-px" />
                <div className="rpt-tick absolute inset-y-0 left-[70%] w-px" />
              </div>
              <div
                className="rpt-needle absolute top-0 h-3.5 w-[3px] rounded-full"
                style={{
                  left: `${clamp(score, 0, 100)}%`,
                  transform: 'translateX(-50%)',
                  background: hex,
                }}
              />
            </div>

            <div className="relative mt-2 h-7">
              {bands.map((b, i) => (
                <span
                  key={b.range}
                  className="absolute top-0 whitespace-nowrap text-center"
                  style={{ left: `${b.center}%`, transform: 'translateX(-50%)' }}
                >
                  <span
                    className={`block text-[10px] font-bold uppercase tracking-[0.12em] ${
                      i === activeIdx ? '' : 'text-text-muted'
                    }`}
                    style={i === activeIdx ? { color: TONE_HEX[b.tone] } : undefined}
                  >
                    {b.name}
                  </span>
                  <span className="mt-0.5 block font-data text-[10px] text-text-muted">{b.range}</span>
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

// ─── Parameter kunci ────────────────────────────────────────────────

function KeyParameters({ property }) {
  const t = useT();
  const lang = useAppStore((s) => s.lang);
  const geo = property?.geotech;
  if (!geo) return null;

  const hazard = property?.hazard || {};
  const fault = geo.nearest_fault || {};
  const floodKnown = hazard.flood_known !== false;
  // `flood_label` datang sebagai "SEDANG — ESTIMASI PROVINSI (BUKAN PETA
  // BANJIR)". Dirender utuh dan rata kanan, kalimat itu pecah jadi empat baris
  // kapital yang menenggelamkan seluruh kolom. Band dan kualifikasinya
  // dipisah: satu jadi nilai, satu jadi catatan.
  const flood = hazardBand(hazard.flood_label);
  const vs30 = num(geo.vs30);
  const fs = num(geo.fs);
  const pga = num(geo.pga_surface);
  const faultDist = num(fault.distance_km);

  const rows = [
    {
      label: 'Vs30',
      value: vs30 != null ? `${vs30} m/s` : '—',
      note: vs30 != null ? siteClass(vs30, lang) : null,
    },
    {
      label: t('drawer.liquefaction'),
      value: fs != null ? fs.toFixed(2) : '—',
      note: geo.status || null,
      tone: fs == null ? null : fs < 1 ? 'danger' : fs < 1.25 ? 'moderate' : 'safe',
    },
    {
      label: t('drawer.surfacePga'),
      value: pga != null ? `${pga.toFixed(3)} g` : '—',
      note: null,
      tone: pga == null ? null : pga >= 0.5 ? 'danger' : pga >= 0.2 ? 'moderate' : null,
    },
    {
      label: t('drawer.nearestFault'),
      value: faultDist != null ? `${faultDist.toFixed(1)} km` : '—',
      note: fault.name || null,
      tone: faultDist == null ? null : faultDist < 10 ? 'danger' : faultDist < 30 ? 'moderate' : null,
    },
    {
      label: t('drawer.floodHazard'),
      value: floodKnown && flood.band ? flood.band : '—',
      note: !floodKnown
        ? t('drawer.dataUnavailable')
        : flood.provisional
          ? lang === 'en'
            ? 'provincial estimate, not a flood map'
            : 'estimasi provinsi, bukan peta banjir'
          : null,
    },
  ];

  return (
    <section>
      <h2 className="rpt-eyebrow mb-1">{t('drawer.keyParameters')}</h2>
      <dl className="rpt-rows">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-4 py-3">
            <dt className="min-w-0 text-[12px] text-text-muted">{row.label}</dt>
            <dd className="min-w-0 max-w-[62%] text-right">
              <span
                className={`data-num block text-[14px] font-semibold ${row.tone ? '' : 'text-text-primary'}`}
                style={row.tone ? { color: TONE_HEX[row.tone] } : undefined}
              >
                {row.value}
              </span>
              {row.note && (
                <span className="mt-0.5 block text-[10.5px] leading-tight text-text-muted">
                  {row.note}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

// ─── Kelengkapan data ───────────────────────────────────────────────

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

function DataCoverageSummary({ property }) {
  const t = useT();
  const lang = useAppStore((s) => s.lang);
  // Enam belas chip status yang selalu terbuka mendominasi kolom bukti dan
  // mendorong skor keluar dari pandangan pertama. Rekapnya tetap terlihat
  // sebagai satu pita provenance; daftarnya dibuka saat dibutuhkan.
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
    <section>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="rpt-eyebrow">{t('drawer.dataCoverage')}</h2>
        <span className="data-num shrink-0 text-[12px] font-semibold text-text-primary">
          {covered}
          <span className="text-text-muted">/{entries.length}</span>
        </span>
      </div>

      {/* Pita provenance: satu segmen per field, diwarnai menurut asal data. */}
      <div className="mt-2.5 flex h-2 gap-[2px]">
        {entries.map(([key, label, item]) => (
          <span
            key={key}
            title={`${label} — ${statusLabel(item.status)}`}
            className="flex-1 rounded-[2px]"
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
    </section>
  );
}

// ─── Drawer ─────────────────────────────────────────────────────────

export function AuditDrawer() {
  const t = useT();
  const open = useAppStore((s) => s.auditDrawerOpen);
  const propertyA = useAppStore((s) => s.propertyA);
  const propertyB = useAppStore((s) => s.propertyB);
  const mode = useAppStore((s) => s.mode);
  const battleReport = useAppStore((s) => s.battleReportContent);
  const battleReportMeta = useAppStore((s) => s.battleReportMeta);
  const battleReportLoading = useAppStore((s) => s.battleReportLoading);
  const setAuditDrawer = useAppStore((s) => s.setAuditDrawer);
  const lang = useAppStore((s) => s.lang);
  const reportRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Mode bandingkan menampilkan laporan head-to-head; mode audit menampilkan
  // laporan satu tapak.
  const isBattle = mode === 'battle' && propertyB;
  const aiReport = propertyA?.aiReport;
  const drawerScore = computeScore(propertyA);
  const drawerScoreReady = Number.isFinite(drawerScore);

  const handleCopy = async () => {
    if (propertyA?.lat == null) return;
    const url = locationToUrl(propertyA.lat, propertyA.lon);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(t('toast.shareCopied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('toast.shareFailed'));
    }
  };

  const handleDownloadPdf = async () => {
    if (!propertyA || !canExportSniReport(propertyA)) {
      toast.warning(
        lang === 'en'
          ? 'PDF is locked because this audit has insufficient evidence.'
          : 'PDF dikunci karena bukti audit belum cukup.'
      );
      return;
    }
    setPdfLoading(true);
    const toastId = toast.loading(lang === 'en' ? 'Preparing full audit PDF…' : 'Menyiapkan PDF audit full…');
    try {
      await exportPrintReadyPdf(propertyA, lang);
      toast.success(
        lang === 'en' ? 'Full AI audit PDF downloaded.' : 'PDF full audit AI berhasil diunduh.',
        { id: toastId }
      );
    } catch (error) {
      console.error('PDF export failed', error);
      toast.error(error.message || (lang === 'en' ? 'PDF export failed.' : 'Ekspor PDF gagal.'), {
        id: toastId,
      });
    } finally {
      setPdfLoading(false);
    }
  };

  const drawerTitle = isBattle ? t('drawer.battleTitle') : t('drawer.title');
  const drawerSubtitle = isBattle
    ? `${shortAddress(propertyA?.address) || '---'} vs ${shortAddress(propertyB?.address) || '---'}`
    : shortAddress(propertyA?.address, 3) || '---';

  // Chip provenance hanya menampilkan keterangan yang menambah informasi:
  // "ENGINE · S.A.F.E engine" mengulang dirinya sendiri.
  const provenance = isBattle
    ? {
        state: battleReportMeta?.delivery_mode === 'fallback' ? 'fallback' : 'live',
        detail: battleReportMeta?.model || null,
      }
    : {
        state: aiReport?.deliveryMode || 'engine',
        detail:
          aiReport?.deliveryMode === 'cached'
            ? t('drawer.cached')
            : aiReport?.aiModel || aiReport?.generatedBy || null,
      };

  // Vaul 1.1.2 tetap mengaktifkan kunci pointer milik Radix walau opsi `modal`
  // dimatikan. Interaksi halaman dipulihkan setelah drawer mount supaya elemen
  // di luar laporan masih menerima event.
  useEffect(() => {
    if (!open || typeof document === 'undefined') return undefined;
    const unlockPage = window.setTimeout(() => {
      document.body.style.pointerEvents = 'auto';
    }, 0);
    return () => window.clearTimeout(unlockPage);
  }, [open]);

  return (
    <Drawer.Root modal={false} open={open} onOpenChange={setAuditDrawer}>
      <Drawer.Portal>
        <div
          aria-hidden="true"
          data-testid="audit-drawer-backdrop"
          onClick={() => setAuditDrawer(false)}
          className="pointer-events-auto fixed inset-0 z-30 bg-bg/60 backdrop-blur-sm"
        />
        {/* z-40: panel chatbot memakai z-[35]. Dengan z-30, panel chat menutupi
            laporan dan membuatnya tak terbaca saat keduanya terbuka. */}
        <Drawer.Content
          data-testid="audit-drawer"
          className="rpt glass-strong fixed bottom-0 left-0 right-0 z-40 mt-24 flex h-[min(80dvh,58rem)] max-h-[calc(100dvh-env(safe-area-inset-top))] flex-col rounded-t-2xl outline-none max-[639px]:h-[calc(100dvh-env(safe-area-inset-top))] max-[639px]:rounded-t-3xl"
        >
          <Drawer.Title className="sr-only">{drawerTitle}</Drawer.Title>
          <Drawer.Description className="sr-only">{drawerSubtitle}</Drawer.Description>

          <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full" style={{ background: 'var(--rpt-line-strong)' }} />

          {/* ── Header ── */}
          <header className="rpt-hair-b sticky top-0 z-10 flex shrink-0 items-center gap-3 bg-bg-surface/95 px-4 py-3 backdrop-blur-xl sm:px-6 sm:py-3.5">
            <span className="rpt-hair flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/[0.12] text-accent">
              {isBattle ? <GitCompareArrows className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
            </span>

            <div className="min-w-0 flex-1">
              <h2 className="truncate font-display text-[15px] font-semibold leading-tight text-text-primary">
                {drawerTitle}
              </h2>
              <div className="mt-1 flex min-w-0 items-center gap-2">
                <ProvenanceChip state={provenance.state} detail={provenance.detail} />
                <span className="hidden min-w-0 truncate text-[11px] text-text-muted sm:block">
                  {drawerSubtitle}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              {!isBattle && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDownloadPdf}
                  disabled={pdfLoading}
                  className="rpt-hair flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 px-2.5 text-xs hover:border-accent/40 hover:text-accent sm:px-3"
                  title={lang === 'en' ? 'Download full PDF report' : 'Unduh laporan PDF full'}
                >
                  {pdfLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
                  ) : (
                    <Download className="h-3.5 w-3.5 text-accent" />
                  )}
                  <span className="max-[899px]:hidden">{lang === 'en' ? 'Full PDF' : 'Unduh PDF'}</span>
                </Button>
              )}

              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopy}
                className="rpt-hair flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 px-2.5 text-xs sm:px-3"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-risk-safe" /> : <Copy className="h-3.5 w-3.5" />}
                <span className="max-[899px]:hidden">{copied ? t('drawer.copied') : t('drawer.copyLink')}</span>
              </Button>

              <span aria-hidden="true" className="mx-0.5 h-6 w-px" style={{ background: 'var(--rpt-line)' }} />

              <button
                type="button"
                data-testid="audit-drawer-close"
                aria-label={t('drawer.close')}
                title={t('drawer.close')}
                onClick={() => setAuditDrawer(false)}
                className="rpt-focus flex h-11 w-11 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-accent/[0.10] hover:text-text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          {/* ── Isi ── */}
          <div className="overscroll-contain flex-1 overflow-y-auto">
            <div
              ref={reportRef}
              className="mx-auto w-full min-w-0 max-w-[1400px] px-4 py-6 sm:px-8 sm:py-9"
            >
              {!isBattle && propertyA && (
                <header className="rpt-hair-b mb-8 pb-6">
                  <span className="rpt-eyebrow text-accent">{t('drawer.auditResult')}</span>
                  {/* Alamat penuh dulu dipangkas paksa dengan `truncate`, jadi
                      nama jalan sering hilang. Dua baris cukup untuk alamat
                      Nominatim terpanjang sekalipun. */}
                  <h1
                    className="mt-2.5 max-w-[42ch] font-display text-[22px] font-bold leading-[1.2] tracking-tight text-text-primary sm:text-[28px]"
                    title={propertyA.address}
                  >
                    {shortAddress(propertyA.address, 3)}
                  </h1>
                  <p className="rpt-legend mt-3 font-data text-[11px] tracking-wide text-text-muted">
                    <span>
                      {propertyA.lat?.toFixed(5)}, {propertyA.lon?.toFixed(5)}
                    </span>
                    <span>{propertyA.elevation ?? propertyA.geotech?.elevation_m} mdpl</span>
                  </p>
                </header>
              )}

              {isBattle ? (
                <div className="mx-auto max-w-3xl">
                  {battleReport ? (
                    <SectionList
                      markdown={battleReport}
                      property={propertyA}
                      isExpanded={(sec, idx) => idx < 2}
                    />
                  ) : battleReportLoading ? (
                    <ReportSkeleton
                      label={lang === 'en' ? 'Generating comparison report' : 'Menyusun laporan perbandingan'}
                    />
                  ) : (
                    <p className="text-sm text-text-muted">{t('drawer.reportLoading')}</p>
                  )}
                </div>
              ) : (
                /* Dua kolom di layar lebar: bukti terukur di kiri, narasi di
                   kanan. Satu kolom max-w-3xl membuat laporan jadi pita sempit
                   dengan ruang kosong besar di kedua sisi monitor lebar. */
                <div className="grid min-w-0 gap-10 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-0">
                  <aside className="space-y-8 lg:sticky lg:top-6 lg:self-start lg:pr-12">
                    <HeroScore
                      score={drawerScore}
                      ready={drawerScoreReady}
                      status={propertyA?.audit_status}
                    />
                    <KeyParameters property={propertyA} />
                    {propertyA?.data_quality?.fields && <DataCoverageSummary property={propertyA} />}
                    <PbgChecklistCard property={propertyA} />
                  </aside>

                  <div
                    className="min-w-0 lg:border-l lg:pl-12"
                    style={{ borderColor: 'var(--rpt-line)' }}
                  >
                    <h2 className="rpt-eyebrow mb-1 hidden lg:block">{t('drawer.analysis')}</h2>

                    {aiReport?.aiError && (
                      <div
                        className="mb-6 mt-4 flex items-start gap-3 rounded-xl border p-4"
                        style={{
                          borderColor: `${TONE_HEX.danger}40`,
                          background: 'rgba(239, 68, 68, 0.06)',
                        }}
                      >
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-risk-danger" />
                        <div>
                          <p className="mb-1 text-[13px] font-semibold text-risk-danger">
                            {t('drawer.aiUnavailable')}
                          </p>
                          <p className="text-[12px] leading-relaxed text-text-muted">
                            {t('drawer.deterministicValid')}
                          </p>
                        </div>
                      </div>
                    )}

                    {aiReport?.detailedReport ? (
                      <SectionList
                        markdown={aiReport.detailedReport}
                        property={propertyA}
                        isExpanded={(sec, idx) =>
                          idx < 3 ||
                          sec.title.toLowerCase().includes('mitigasi') ||
                          sec.title.toLowerCase().includes('rekomendasi')
                        }
                      />
                    ) : aiReport?.reportLoading ? (
                      <div className="pt-4">
                        <ReportSkeleton label={lang === 'en' ? 'Generating report' : 'Menyusun laporan'} />
                      </div>
                    ) : !aiReport?.aiError ? (
                      <p className="pt-4 text-sm text-text-muted">{t('drawer.reportLoading')}</p>
                    ) : null}

                    {aiReport?.microAnalysis && (
                      <p className="rpt-hair-t mt-8 max-w-[74ch] pt-5 text-[12px] leading-relaxed text-text-muted">
                        <span className="font-semibold text-text-secondary">{t('drawer.nearbyContext')}</span>
                        {aiReport.microAnalysis}
                      </p>
                    )}

                    {/* Satu-satunya disclaimer. Sebelumnya ada tiga blok
                        peringatan bernada sama bertumpuk di bagian atas. */}
                    <p className="mt-5 max-w-[74ch] text-[11.5px] leading-relaxed text-text-muted">
                      {t('drawer.disclaimer')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
