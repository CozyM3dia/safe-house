import { useEffect, useRef } from 'react';
import { Drawer } from 'vaul';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, X, FileText, AlertTriangle, MapPin, GitCompareArrows, Sparkles, Layers, Droplets, BookOpen, Wrench, TrendingUp, Info, Activity, ChevronDown, FileCheck, Scale, Award } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

import { useAppStore } from '../../store/useAppStore';
import { useT } from '../../hooks/useTranslation';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { locationToUrl, riskHex, riskLabel } from '../../lib/utils';

// ─── Local Helpers ──────────────────────────────────────────────────
function computeScore(p) {
  if (typeof p?.safe_score === 'number') return p.safe_score;
  return null;
}

// ─── Visualizations for Report Sections ──────────────────────────────

function SoilVisual({ property }) {
  const vs30 = property?.geotech?.vs30 ?? 180;
  const siteClass = property?.geotech?.site_class ?? 'SD';
  const fs = property?.geotech?.fs ?? 1.2;
  
  const classes = [
    { name: 'SE', label: 'Lunak', range: '<180', color: '#ef4444' },
    { name: 'SD', label: 'Sedang', range: '180-360', color: '#f59e0b' },
    { name: 'SC', label: 'Keras', range: '360-760', color: '#10b981' },
    { name: 'SB/SA', label: 'Batuan', range: '>760', color: '#06b6d4' }
  ];
  
  let activeIdx = 0;
  if (vs30 >= 760) activeIdx = 3;
  else if (vs30 >= 360) activeIdx = 2;
  else if (vs30 >= 180) activeIdx = 1;
  
  return (
    <div className="mt-4 p-4.5 rounded-2xl border border-white/6 bg-white/[0.01] space-y-4">
      {/* Vs30 Scale */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold text-text-primary tracking-wider uppercase">Kelas Kekerasan Tanah (Vs30)</span>
          <span className="text-[11px] font-mono font-bold text-accent">{vs30} m/s (Kelas {siteClass})</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {classes.map((c, idx) => {
            const isActive = idx === activeIdx;
            return (
              <div 
                key={c.name} 
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  isActive 
                    ? 'border-accent bg-accent/[0.05] shadow-[0_0_12px_rgba(212,149,106,0.1)] scale-[1.02]' 
                    : 'border-white/5 bg-white/[0.005] opacity-50'
                }`}
              >
                <div className="text-[11.5px] font-extrabold" style={{ color: isActive ? 'var(--accent)' : c.color }}>{c.name}</div>
                <div className="text-[8.5px] font-bold text-text-secondary mt-0.5">{c.label}</div>
                <div className="text-[7.5px] font-mono text-text-muted mt-0.5">{c.range}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Liquefaction Factor of Safety (FS) scale */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold text-text-primary tracking-wider uppercase">Faktor Keamanan Likuefaksi (FS)</span>
          <span className="text-[11px] font-mono font-bold" style={{ color: fs < 1.0 ? '#ef4444' : '#10b981' }}>
            FS = {fs.toFixed(2)} ({fs < 1.0 ? 'RAWAN LIKUEFAKSI' : 'AMAN'})
          </span>
        </div>
        <div className="relative h-2.5 rounded-full bg-white/5 overflow-hidden">
          {/* Red zone (0 to 1.0) and Green zone (1.0 to 2.0) */}
          <div className="absolute top-0 bottom-0 left-0 w-1/2 bg-gradient-to-r from-red-500 to-orange-500 opacity-55" />
          <div className="absolute top-0 bottom-0 left-1/2 w-1/2 bg-gradient-to-r from-yellow-500 to-green-500 opacity-55" />
          {/* Current FS marker */}
          <div 
            className="absolute h-full w-1.5 bg-white border border-black shadow-[0_0_6px_rgba(255,255,255,0.9)] rounded-full"
            style={{ left: `${Math.min(98, (fs / 2) * 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-[7px] font-mono text-text-muted mt-1.5">
          <span>0.0 (Sangat Rawan)</span>
          <span>1.0 (Batas Kritis)</span>
          <span>2.0+ (Sangat Aman)</span>
        </div>
      </div>
    </div>
  );
}

function SeismicVisual({ property }) {
  const pga = property?.geotech?.pga_surface ?? property?.seismic?.pgaSurface ?? 0.35;
  const faultName = property?.geotech?.nearest_fault?.name ?? 'N/A';
  const faultDist = property?.geotech?.nearest_fault?.distance_km ?? 999;
  
  return (
    <div className="mt-4 p-4.5 rounded-2xl border border-white/6 bg-white/[0.01] space-y-4">
      {/* PGA Surface Scale */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold text-text-primary tracking-wider uppercase">Percepatan Tanah Maksimum (PGA Surface)</span>
          <span className="text-[11px] font-mono font-bold text-accent">{pga.toFixed(3)}g</span>
        </div>
        <div className="relative h-2.5 rounded-full bg-white/5 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 opacity-55" />
          {/* Current PGA marker */}
          <div 
            className="absolute h-full w-1.5 bg-white border border-black shadow-[0_0_6px_rgba(255,255,255,0.9)] rounded-full"
            style={{ left: `${Math.min(98, (pga / 1.0) * 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-[7px] font-mono text-text-muted mt-1.5">
          <span>0.1g (Aman)</span>
          <span>0.4g (Sedang)</span>
          <span>0.8g+ (Sangat Tinggi)</span>
        </div>
      </div>

      {/* Fault Distance Proximity Line */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold text-text-primary tracking-wider uppercase">Kedekatan dengan Sesar Aktif ({faultName})</span>
          <span className="text-[11px] font-mono font-bold" style={{ color: faultDist < 10 ? '#ef4444' : faultDist < 30 ? '#f59e0b' : '#10b981' }}>
            {faultDist.toFixed(1)} km
          </span>
        </div>
        <div className="flex items-center gap-2 bg-black/25 rounded-xl px-3 py-2 border border-white/5">
          <span className="text-[8.5px] font-extrabold text-red-400 font-mono shrink-0">SESAR</span>
          <div className="flex-1 relative h-3 flex items-center">
            {/* Dotted horizontal line */}
            <div className="w-full h-px border-t border-dashed border-white/20" />
            {/* Proximity zones */}
            <div className="absolute left-0 w-[20%] h-1 bg-red-500/20 border-r border-red-500/30" />
            <div className="absolute left-[20%] w-[30%] h-1 bg-yellow-500/10 border-r border-yellow-500/30" />
            {/* House marker icon */}
            <div 
              className="absolute flex items-center justify-center h-5.5 w-5.5 rounded-full bg-accent border border-black text-[9px] shadow-[0_0_10px_rgba(212,149,106,0.3)] transition-all duration-300"
              style={{ left: `${Math.min(94, (faultDist / 50) * 100)}%` }}
            >
              🏠
            </div>
          </div>
          <span className="text-[8.5px] font-extrabold text-text-muted font-mono shrink-0">AMAN</span>
        </div>
        <div className="flex justify-between text-[7px] font-mono text-text-muted mt-1.5">
          <span>Sangat Rawan (&lt;10km)</span>
          <span>Waspada (10-30km)</span>
          <span>Aman (&gt;50km)</span>
        </div>
      </div>
    </div>
  );
}

function EnvironmentVisual({ property }) {
  const elevasi = property?.elevation ?? property?.geotech?.elevation_m ?? 0;
  const aqi = property?.environment?.aqi ?? 20;
  
  return (
    <div className="mt-4 p-4.5 rounded-2xl border border-white/6 bg-white/[0.01] space-y-4">
      {/* Elevation Visual scale */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold text-text-primary tracking-wider uppercase">Ketinggian vs Level Banjir Rob</span>
          <span className="text-[11px] font-mono font-bold text-accent">{elevasi} mdpl</span>
        </div>
        <div className="flex items-end gap-3 h-10 pb-1.5 relative border-b border-white/10 px-1 bg-black/15 rounded-xl border border-white/5 pt-2">
          {/* Sea */}
          <div className="w-1/4 h-2 bg-blue-500/30 border-t border-blue-400 rounded-l text-center text-[7px] text-blue-300 font-mono font-bold pt-0.5 leading-none">LAUT</div>
          {/* Coastal flat */}
          <div className="w-1/4 h-4 bg-white/5 border-t border-white/10 text-center text-[7px] text-text-muted font-mono font-bold pt-1 leading-none border-r border-dashed border-white/10">0-10m</div>
          {/* Hills */}
          <div className="w-1/4 h-7 bg-white/5 border-t border-white/10 text-center text-[7px] text-text-muted font-mono font-bold pt-1 leading-none border-r border-dashed border-white/10">10-50m</div>
          {/* Highlands */}
          <div className="w-1/4 h-9 bg-white/5 border-t border-white/10 text-center text-[7px] text-text-muted font-mono font-bold pt-1 leading-none rounded-r">&gt;50m</div>

          {/* Current location pin */}
          <div 
            className="absolute flex flex-col items-center pointer-events-none transition-all duration-300"
            style={{ 
              left: `${elevasi < 10 ? 37 : elevasi < 50 ? 62 : 87}%`,
              bottom: '5px'
            }}
          >
            <span className="text-[11px] leading-none mb-0.5">🏠</span>
            <div className="h-4 w-0.5 bg-accent" />
          </div>
        </div>
        <div className="flex justify-between text-[7px] font-mono text-text-muted mt-1.5">
          <span>Rawan Pasang Air Laut</span>
          <span>Potensi Banjir Lokal</span>
          <span>Bebas Luapan Banjir</span>
        </div>
      </div>

      {/* Air Quality (AQI) bar */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold text-text-primary tracking-wider uppercase">Indeks Kualitas Udara (European AQI)</span>
          <span className="text-[11px] font-mono font-bold" style={{ color: aqi >= 100 ? '#ef4444' : aqi >= 50 ? '#f59e0b' : '#10b981' }}>
            AQI = {aqi} ({aqi >= 100 ? 'SANGAT BURUK' : aqi >= 50 ? 'SEDANG' : 'SEHAT'})
          </span>
        </div>
        <div className="relative h-2.5 rounded-full bg-white/5 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 opacity-55" />
          {/* Current AQI marker */}
          <div 
            className="absolute h-full w-1.5 bg-white border border-black shadow-[0_0_6px_rgba(255,255,255,0.9)] rounded-full"
            style={{ left: `${Math.min(98, (aqi / 150) * 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-[7px] font-mono text-text-muted mt-1.5">
          <span>0 (Sangat Sehat)</span>
          <span>50 (Sedang)</span>
          <span>100+ (Tidak Sehat)</span>
        </div>
      </div>
    </div>
  );
}

// ─── Generative UI Parsing Helpers ─────────────────────────────────

const parseSections = (markdown) => {
  if (!markdown) return [];
  const lines = markdown.split('\n');
  const sections = [];
  let currentSection = null;

  // Accept level-2 or level-3 ATX headers ("## Judul" or "### Judul").
  const headerRe = /^#{2,3}\s+/;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (headerRe.test(line)) {
      if (currentSection) {
        sections.push(currentSection);
      }
      const title = line.replace(headerRe, '').replace(/\*/g, '').trim();
      currentSection = { title, contentLines: [] };
    } else {
      if (currentSection) {
        currentSection.contentLines.push(lines[i]);
      }
    }
  }
  if (currentSection) {
    sections.push(currentSection);
  }

  return sections.map(s => ({
    title: s.title,
    content: s.contentLines.join('\n').trim()
  }));
};

const parseMitigations = (content) => {
  const items = [];
  const lines = content.split('\n');
  
  // Detect if we have standard multi-line bullet details
  const hasSubBullets = content.includes('- Apa yang harus dilakukan') || content.includes('- Tindakan') || content.includes('- What to do');
  
  if (hasSubBullets) {
    const blocks = content.split(/(?:\r?\n)+(?=\d+\.|\*\*\d+\.)/);
    for (const block of blocks) {
      const trimmed = block.trim();
      if (!trimmed) continue;
      
      let title = '';
      const titleMatch = trimmed.match(/^(?:\*\*\d+\.\s*(.*?)\*\*|\d+\.\s*\*\*(.*?)\*\*|\d+\.\s*(.*?)(?:\r?\n|-))/);
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
          action = lineTrim.match(/-\s*(?:Apa yang harus dilakukan|What to do|Tindakan|Action)\s*:\s*(.*)/i)[1].trim();
        } else if (lineTrim.match(/-\s*(?:Mengapa penting|Why it matters|Pentingnya|Rationale)\s*:\s*(.*)/i)) {
          why = lineTrim.match(/-\s*(?:Mengapa penting|Why it matters|Pentingnya|Rationale)\s*:\s*(.*)/i)[1].trim();
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
    // Single-line format, e.g.:
    // **Audit Struktur oleh Ahli**: Wajib dilakukan sebelum renovasi. Biaya: Rp 15-25 juta. Prioritas: WAJIB.
    for (const line of lines) {
      const lineTrim = line.trim();
      if (!lineTrim) continue;
      
      // Match title in bold (could start with bullet or number)
      const boldMatch = lineTrim.match(/^(?:-\s*|\d+\.\s*)?\*\*(.*?)\*\*(?:\s*:\s*|\s*-\s*)(.*)/);
      if (boldMatch) {
        const title = boldMatch[1].trim();
        const rest = boldMatch[2].trim();
        
        let cost = '';
        let priority = '';
        let action = rest;
        
        // Try to extract Biaya / Cost
        const costMatch = rest.match(/(?:Estimasi biaya|Estimasi Biaya|Biaya|Cost)\s*:\s*([^.\n]+)/i);
        if (costMatch) {
          cost = costMatch[1].trim();
          action = action.replace(costMatch[0], '');
        }
        
        // Try to extract Prioritas / Priority
        const priorityMatch = rest.match(/(?:Prioritas|Priority)\s*:\s*([^.\n]+)/i);
        if (priorityMatch) {
          priority = priorityMatch[1].trim();
          action = action.replace(priorityMatch[0], '');
        }
        
        // Clean up action text
        action = action.replace(/(?:Estimasi biaya|Estimasi Biaya|Biaya|Cost)\s*:\s*$/i, '')
                      .replace(/(?:Prioritas|Priority)\s*:\s*$/i, '')
                       .replace(/[,.\s]+$/, '')
                      .trim();
        
        items.push({
          title,
          action,
          why: '',
          cost,
          priority
        });
      }
    }
  }
  
  return items;
};

const parseBuildingCodes = (content) => {
  const items = [];
  const lines = content.split('\n');
  for (const line of lines) {
    const lineTrim = line.trim();
    if (!lineTrim) continue;
    
    // Match e.g. - **SNI 1726:2019**: ... or SNI 1726:2019: ...
    const match = lineTrim.match(/^(?:-\s*|\*\s*|\d+\.\s*)?(?:\*\*)?(SNI\s+\d+:\d+|\w+)(?:\*\*)?\s*:\s*(.*)/i);
    if (match) {
      items.push({
        code: match[1].trim(),
        description: match[2].trim()
      });
    } else {
      const boldMatch = lineTrim.match(/^(?:-\s*|\*\s*|\d+\.\s*)?\*\*(.*?)\*\*\s*(.*)/);
      if (boldMatch) {
        items.push({
          code: boldMatch[1].trim(),
          description: boldMatch[2].trim()
        });
      }
    }
  }
  return items;
};

const getSectionMeta = (title) => {
  const t = title.toLowerCase();
  
  // Default values
  let icon = FileText;
  let accentClass = 'text-accent border-accent/20 bg-accent/5';
  let isImportant = false;
  
  if (t.includes('ringkasan') || t.includes('summary') || t.includes('verdict') || t.includes('hasil')) {
    icon = Sparkles;
    accentClass = 'text-amber-400 border-amber-400/20 bg-amber-400/5';
    isImportant = true;
  } else if (t.includes('geoteknik') || t.includes('geotechnical') || t.includes('tanah') || t.includes('soil')) {
    icon = Layers;
    accentClass = 'text-amber-500 border-amber-500/20 bg-amber-500/5';
  } else if (t.includes('gempa') || t.includes('earthquake') || t.includes('tektonik') || t.includes('seismic')) {
    icon = Activity;
    accentClass = 'text-red-400 border-red-400/20 bg-red-400/5';
  } else if (t.includes('banjir') || t.includes('flood') || t.includes('lingkungan') || t.includes('environmental')) {
    icon = Droplets;
    accentClass = 'text-blue-400 border-blue-400/20 bg-blue-400/5';
  } else if (t.includes('mikro') || t.includes('micro') || t.includes('evakuasi') || t.includes('jalan')) {
    icon = MapPin;
    accentClass = 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5';
  } else if (t.includes('regulasi') || t.includes('sni') || t.includes('code') || t.includes('persyaratan bangunan')) {
    icon = BookOpen;
    accentClass = 'text-purple-400 border-purple-400/20 bg-purple-400/5';
  } else if (t.includes('mitigasi') || t.includes('mitigation') || t.includes('rekomendasi')) {
    icon = Wrench;
    accentClass = 'text-orange-400 border-orange-400/20 bg-orange-400/5';
  } else if (t.includes('investasi') || t.includes('investment') || t.includes('harga') || t.includes('biaya total')) {
    icon = TrendingUp;
    accentClass = 'text-cyan-400 border-cyan-400/20 bg-cyan-400/5';
  } else if (t.includes('referensi') || t.includes('reference') || t.includes('disclaimer')) {
    icon = Info;
    accentClass = 'text-gray-400 border-gray-400/20 bg-gray-400/5';
  } else if (t.includes('contrast') || t.includes('perbandingan') || t.includes('head-to-head')) {
    icon = Scale;
    accentClass = 'text-rose-400 border-rose-400/20 bg-rose-400/5';
  }
  
  return { icon, accentClass, isImportant };
};

// ─── Generative UI Subcomponents ───────────────────────────────────

function MitigationCard({ item }) {
  const { title, action, why, cost, priority } = item;
  const p = priority.toLowerCase();
  let priorityLabel = priority;
  let priorityStyle = 'border-l-4 border-l-gray-500/80 bg-gray-500/[0.02] border-white/8';
  let badgeColor = 'secondary';
  
  if (p.includes('wajib') || p.includes('required') || p.includes('high') || p.includes('urgent')) {
    priorityLabel = priority.includes('wajib') ? 'WAJIB' : 'REQUIRED';
    priorityStyle = 'border-l-4 border-l-risk-danger bg-risk-danger/[0.02] border-risk-danger/20';
    badgeColor = 'danger';
  } else if (p.includes('disarankan') || p.includes('recommended') || p.includes('moderate') || p.includes('medium')) {
    priorityLabel = priority.includes('disarankan') ? 'DISARANKAN' : 'RECOMMENDED';
    priorityStyle = 'border-l-4 border-l-risk-moderate bg-risk-moderate/[0.02] border-risk-moderate/20';
    badgeColor = 'warning';
  } else if (p.includes('jangka panjang') || p.includes('long-term') || p.includes('low') || p.includes('long term')) {
    priorityLabel = priority.includes('jangka') ? 'JANGKA PANJANG' : 'LONG-TERM';
    priorityStyle = 'border-l-4 border-l-accent bg-accent/[0.02] border-accent/20';
    badgeColor = 'accent';
  }
  
  return (
    <div className={`flex flex-col justify-between rounded-2xl border p-4.5 shadow-sm hover:border-white/16 hover:scale-[1.01] transition-all duration-300 relative overflow-hidden ${priorityStyle}`}>
      {/* Decorative background circle */}
      <div className="absolute -right-6 -bottom-6 h-12 w-12 rounded-full bg-white/[0.01] blur-xl" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h4 className="font-display text-[12px] font-bold text-text-primary leading-snug">
            {title}
          </h4>
          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-widest shrink-0 ${
            badgeColor === 'danger' ? 'bg-risk-danger/10 text-risk-danger border border-risk-danger/20' :
            badgeColor === 'warning' ? 'bg-risk-moderate/10 text-risk-moderate border border-risk-moderate/20' :
            'bg-accent/10 text-accent border border-accent/20'
          }`}>
            {priorityLabel}
          </span>
        </div>
        
        {cost && (
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] border border-white/6 px-2.5 py-1 text-[10px] font-mono text-text-primary mb-3.5 shadow-sm">
            <Award className="h-3 w-3 text-accent" />
            <span className="text-text-muted">Biaya:</span>
            <span className="font-extrabold text-accent">{cost}</span>
          </div>
        )}
        
        <div className="space-y-2 text-xs">
          {action && (
            <div className="flex gap-2">
              <span className="text-text-muted/50 select-none shrink-0 mt-0.5">✦</span>
              <p className="text-text-secondary leading-relaxed text-[11px]">
                <span className="font-bold text-text-primary">Tindakan: </span>
                {action}
              </p>
            </div>
          )}
          {why && (
            <div className="flex gap-2">
              <span className="text-text-muted/50 select-none shrink-0 mt-0.5">✦</span>
              <p className="text-text-secondary leading-relaxed text-[11px]">
                <span className="font-bold text-text-primary">Alasan: </span>
                {why}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MitigationSection({ content }) {
  const mitigations = parseMitigations(content);
  
  if (mitigations.length === 0) {
    return (
      <article className="prose-safe">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </article>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {mitigations.map((item, idx) => (
        <MitigationCard key={idx} item={item} />
      ))}
    </div>
  );
}

function CodeCard({ item }) {
  const { code, description } = item;
  
  return (
    <div className="flex gap-4.5 rounded-2xl border border-white/8 bg-white/[0.01] p-4.5 hover:border-white/14 hover:bg-white/[0.02] transition-all duration-300 relative overflow-hidden" style={{
      backgroundImage: 'radial-gradient(rgba(255,255,255,0.01) 1px, transparent 1px)',
      backgroundSize: '12px 12px'
    }}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shadow-sm">
        <FileCheck className="h-5 w-5" />
      </div>
      <div>
        <h4 className="font-mono text-xs font-extrabold text-purple-300 uppercase tracking-widest mb-1.5">
          {code}
        </h4>
        <p className="text-[11px] leading-relaxed text-text-secondary">
          {description}
        </p>
      </div>
    </div>
  );
}

function CodeSection({ content }) {
  const codes = parseBuildingCodes(content);
  
  if (codes.length === 0) {
    return (
      <article className="prose-safe">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </article>
    );
  }
  
  return (
    <div className="space-y-3">
      {codes.map((item, idx) => (
        <CodeCard key={idx} item={item} />
      ))}
    </div>
  );
}

function stripMarkdownNode(props) {
  const { node, ...rest } = props;
  void node;
  return rest;
}

function SectionCard({ title, content, defaultExpanded = false, property }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const { icon: Icon, accentClass, isImportant } = getSectionMeta(title);
  
  const isMitigationSection = title.toLowerCase().includes('mitigasi') || title.toLowerCase().includes('mitigation');
  const isCodeSection = title.toLowerCase().includes('persyaratan bangunan') || title.toLowerCase().includes('building code') || title.toLowerCase().includes('regulasi');
  
  const isGeotechnical = title.toLowerCase().includes('geoteknik') || title.toLowerCase().includes('geotechnical') || title.toLowerCase().includes('tanah') || title.toLowerCase().includes('soil');
  const isSeismic = title.toLowerCase().includes('gempa') || title.toLowerCase().includes('seismic') || title.toLowerCase().includes('tektonik');
  const isEnvironment = title.toLowerCase().includes('banjir') || title.toLowerCase().includes('flood') || title.toLowerCase().includes('lingkungan') || title.toLowerCase().includes('environmental');

  return (
    <motion.div 
      layout
      className={`mb-4 overflow-hidden rounded-2xl border transition-all duration-300 ${
        expanded ? 'border-white/14 shadow-lg shadow-black/20' : 'border-white/8 hover:border-white/12'
      } ${
        isImportant 
          ? 'bg-gradient-to-br from-white/[0.05] to-transparent shadow-md shadow-black/10' 
          : 'bg-white/[0.01]'
      }`}
    >
      <button
        type="button"
        aria-expanded={expanded}
        aria-label={`${expanded ? 'Collapse' : 'Expand'} ${title}`}
        onClick={() => setExpanded(!expanded)}
        className={`flex w-full items-center justify-between px-5 py-4.5 text-left transition-all duration-300 ${
          expanded ? 'bg-white/[0.03]' : 'hover:bg-white/[0.02]'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl border shadow-sm transition-transform duration-300 ${
            expanded ? 'scale-105' : ''
          } ${accentClass}`}>
            <Icon className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="font-display text-xs font-bold tracking-wider text-text-primary uppercase">
              {title}
            </h3>
            {isImportant && (
              <span className="inline-block mt-0.5 text-[8px] font-mono text-amber-400 font-bold tracking-widest">
                • CORE REPORT FINDINGS
              </span>
            )}
          </div>
        </div>
        <div className={`transition-transform duration-300 ${expanded ? 'rotate-180 text-accent' : 'text-text-muted'}`}>
          <ChevronDown className="h-4.5 w-4.5" />
        </div>
      </button>
      
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="border-t border-white/6 px-5 py-4 text-sm leading-relaxed text-text-secondary space-y-4 overflow-hidden"
          >
          {isMitigationSection ? (
            <MitigationSection content={content} />
          ) : isCodeSection ? (
            <CodeSection content={content} />
          ) : (
            <article className="prose-safe max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h4: (props) => <h4 className="text-xs font-bold text-text-primary mt-4 mb-2 uppercase tracking-widest" {...stripMarkdownNode(props)} />,
                  p: (props) => <p className="text-xs text-text-secondary leading-relaxed mb-3" {...stripMarkdownNode(props)} />,
                  ul: (props) => <ul className="list-none space-y-2 mb-3 pl-1" {...stripMarkdownNode(props)} />,
                  li: (props) => {
                    const cleanProps = stripMarkdownNode(props);
                    return (
                      <li className="flex items-start gap-2 text-xs text-text-secondary leading-relaxed">
                        <span className="text-accent/60 mt-1 select-none text-[10px] shrink-0">✦</span>
                        <span>{cleanProps.children}</span>
                      </li>
                    );
                  },
                  strong: (props) => <strong className="font-semibold text-text-primary" {...stripMarkdownNode(props)} />,
                  table: (props) => (
                    <div className="my-4 overflow-x-auto rounded-xl border border-white/8 bg-white/[0.01] backdrop-blur-md">
                      <table className="min-w-full divide-y divide-white/8 text-left text-xs" {...stripMarkdownNode(props)} />
                    </div>
                  ),
                  thead: (props) => <thead className="bg-white/[0.02]" {...stripMarkdownNode(props)} />,
                  tbody: (props) => <tbody className="divide-y divide-white/6" {...stripMarkdownNode(props)} />,
                  tr: (props) => <tr className="hover:bg-white/[0.01] transition-colors" {...stripMarkdownNode(props)} />,
                  th: (props) => <th className="px-4 py-2.5 font-bold text-accent tracking-wider" {...stripMarkdownNode(props)} />,
                  td: (props) => <td className="px-4 py-2 text-text-secondary" {...stripMarkdownNode(props)} />,
                }}
              >
                {content}
              </ReactMarkdown>
            </article>
          )}

          {/* Dynamic Visualizations */}
          {isGeotechnical && property && <SoilVisual property={property} />}
          {isSeismic && property && <SeismicVisual property={property} />}
          {isEnvironment && property && <EnvironmentVisual property={property} />}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function AuditDrawer() {
  const t = useT();
  const open = useAppStore((s) => s.auditDrawerOpen);
  const setOpen = useAppStore((s) => s.setAuditDrawer);
  const propertyA = useAppStore((s) => s.propertyA);
  const propertyB = useAppStore((s) => s.propertyB);
  const mode = useAppStore((s) => s.mode);
  const battleReport = useAppStore((s) => s.battleReportContent);
  const battleReportMeta = useAppStore((s) => s.battleReportMeta);
  const reportRef = useRef(null);
  const [copied, setCopied] = useState(false);

  // In battle mode, show battle report; in audit mode, show single site report
  const isBattle = mode === 'battle' && propertyB;
  const aiReport = propertyA?.aiReport;
  const drawerScore = computeScore(propertyA);
  const drawerScoreReady = Number.isFinite(drawerScore);

  const lang = useAppStore((s) => s.lang);

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

  const drawerTitle = isBattle
    ? t('drawer.battleTitle')
    : t('drawer.title');

  const drawerSubtitle = isBattle
    ? `${propertyA?.address?.slice(0, 30) ?? '---'} vs ${propertyB?.address?.slice(0, 30) ?? '---'}`
    : (propertyA?.address?.slice(0, 60) ?? '---');
  const reportGeneratedBy = isBattle
    ? battleReportMeta?.delivery_mode === 'fallback'
      ? 'S.A.F.E House deterministic fallback'
      : battleReportMeta?.model
        ? `Gemini (${battleReportMeta.model})`
        : 'Audit deterministik'
    : (aiReport?.generatedBy || 'Audit deterministik');

  // Vaul 1.1.2 keeps Radix's modal pointer lock active internally even when
  // its own `modal` option is false. Restore page interaction after the
  // drawer mounts so elements outside the report can still receive events.
  useEffect(() => {
    if (!open || typeof document === 'undefined') return undefined;

    const unlockPage = window.setTimeout(() => {
      document.body.style.pointerEvents = 'auto';
    }, 0);

    return () => window.clearTimeout(unlockPage);
  }, [open]);

  // Keep this drawer non-modal so the floating audit chatbot remains usable
  // while the full report is open. Vaul's modal mode sets body pointer-events
  // to none, which makes elements outside the drawer look visible but ignore
  // clicks and focus. The custom backdrop preserves the dimmed presentation
  // and dismiss behavior without locking the rest of the app.
  return (
    <Drawer.Root modal={false} open={open} onOpenChange={setOpen}>
      <Drawer.Portal>
        <div
          aria-hidden="true"
          data-testid="audit-drawer-backdrop"
          onClick={() => setOpen(false)}
          className="pointer-events-auto fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
        />
        {/* Keep this control outside the drawer stacking context: the chatbot stays interactive above the report, while close remains above both. */}
        <button
          type="button"
          data-testid="audit-drawer-close"
          aria-label={t('drawer.close')}
          title={t('drawer.close')}
          onClick={() => setOpen(false)}
          className="fixed right-4 top-[calc(22vh+0.75rem)] z-[45] flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-white/10 bg-bg-surface/95 text-text-muted shadow-glass-lg transition-colors hover:bg-white/8 hover:text-text-primary sm:right-6"
        >
          <X className="h-4 w-4" />
        </button>

        <Drawer.Content data-testid="audit-drawer" className="glass-strong fixed bottom-0 left-0 right-0 z-30 mt-24 flex h-[78vh] flex-col rounded-t-2xl border-t border-white/10 outline-none">
          <Drawer.Title className="sr-only">{drawerTitle}</Drawer.Title>
          <Drawer.Description className="sr-only">{drawerSubtitle}</Drawer.Description>

          {/* Drag handle */}
          <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-white/14" />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/8 px-4 py-4 pr-20 sm:px-6 sm:pr-24">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 border border-accent/30">
                {isBattle
                  ? <GitCompareArrows className="h-4 w-4 text-accent" />
                  : <FileText className="h-4 w-4 text-accent" />
                }
              </div>
              <div>
                <h2 className="font-display text-base font-semibold text-text-primary">
                  {drawerTitle}
                </h2>
                <p className="text-[10px] text-text-muted font-mono tracking-wider flex items-center gap-1.5">
                  {reportGeneratedBy}
                  {!isBattle && aiReport?.deliveryMode && (
                    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[7px] font-bold tracking-widest uppercase ${
                      aiReport.deliveryMode === 'live' ? 'bg-risk-safe/10 text-risk-safe border border-risk-safe/20' :
                      aiReport.deliveryMode === 'fallback' ? 'bg-risk-moderate/10 text-risk-moderate border border-risk-moderate/20' :
                      'bg-accent/10 text-accent border border-accent/20'
                    }`}>
                      {aiReport.deliveryMode === 'live' ? `LIVE · ${aiReport.aiModel || ''}` :
                       aiReport.deliveryMode === 'fallback' ? `FALLBACK · ${aiReport.aiModel || ''}` :
                       'CACHED · dibuat sebelumnya'}
                    </span>
                  )}
                  <span className="text-text-muted/60">·</span>
                  {drawerSubtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handleCopy}>
                {copied
                  ? <Check className="h-3.5 w-3.5" />
                  : <Copy className="h-3.5 w-3.5" />
                }
                {copied ? t('drawer.copied') : t('drawer.copyLink')}
              </Button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div
              ref={reportRef}
              className="mx-auto max-w-3xl rounded-2xl border border-white/8 bg-gradient-to-br from-white/[0.02] to-transparent p-8 relative overflow-hidden"
            >
              {/* Disclaimer */}
              <div className="mb-6 flex items-center gap-2 rounded-lg border border-risk-moderate/20 bg-risk-moderate/5 px-3 py-2 text-[11px] text-risk-moderate relative z-10">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {t('drawer.disclaimer')}
              </div>

              {!isBattle && propertyA?.data_quality?.fields && (
                <DataCoverageSummary property={propertyA} />
              )}

              {!isBattle && propertyA?.audit_status && propertyA.audit_status !== 'valid' && (
                <div className="mb-6 rounded-lg border border-risk-moderate/25 bg-risk-moderate/5 px-3 py-2 text-[11px] text-risk-moderate relative z-10">
                  Audit {propertyA.audit_status}.
                  {propertyA.data_quality?.optional_missing?.length > 0 && (
                    <> Layer belum tersedia: {propertyA.data_quality.optional_missing.join(', ')}.</>
                  )}
                </div>
              )}

              {/* Dynamic Header Card */}
              {!isBattle && propertyA && (
                <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6 relative overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.2)]">
                  {/* Subtle decorative grid background */}
                  <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{
                    backgroundImage: 'radial-gradient(rgba(212,149,106,0.15) 1px, transparent 1px)',
                    backgroundSize: '14px 14px'
                  }} />
                  <div className="relative z-10 flex-1 min-w-0">
                    <span className="text-[9px] font-bold tracking-[0.25em] text-accent uppercase mb-1.5 block">
                      HASIL AUDIT PROPERTI
                    </span>
                    <h1 className="font-display text-[15px] font-bold text-text-primary leading-tight mb-2 truncate">
                      {propertyA.address}
                    </h1>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] text-text-muted font-mono">
                      <span>LAT: {propertyA.lat?.toFixed(6)}</span>
                      <span>LON: {propertyA.lon?.toFixed(6)}</span>
                      <span>ELEV: {propertyA.elevation ?? propertyA.geotech?.elevation_m}m</span>
                    </div>
                  </div>
                  <div className="relative z-10 shrink-0 flex items-center gap-4 bg-black/35 border border-white/8 rounded-2xl px-4.5 py-3.5">
                    <div className="text-right">
                      <span className="text-[8px] font-bold text-text-muted tracking-wider block mb-1">SCORE</span>
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                        drawerScore >= 70 ? 'bg-risk-safe/10 text-risk-safe border border-risk-safe/25' :
                        drawerScore >= 40 ? 'bg-risk-moderate/10 text-risk-moderate border border-risk-moderate/25' :
                        'bg-risk-danger/10 text-risk-danger border border-risk-danger/25'
                      }`}>
                        {drawerScoreReady ? `${drawerScore}/100` : 'N/A — DATA TIDAK CUKUP'}
                      </span>
                    </div>
                    <div className="h-9 w-px bg-white/10" />
                    <div>
                      <span className="text-[8px] font-bold text-text-muted tracking-wider block mb-1">KATEGORI SKOR</span>
                      <span className="text-[11px] font-extrabold block tracking-wider uppercase" style={{ color: riskHex(drawerScore || 0) }}>
                        {drawerScoreReady ? riskLabel(drawerScore) : 'DATA TIDAK CUKUP'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {isBattle ? (
                /* ── Battle Report ── */
                battleReport ? (
                  (() => {
                    const sections = parseSections(battleReport);
                    if (sections.length > 0) {
                      return (
                        <div className="space-y-1 relative z-10">
                          {sections.map((sec, idx) => (
                            <SectionCard 
                              key={idx} 
                              title={sec.title} 
                              content={sec.content} 
                              defaultExpanded={idx === 0 || idx === 1}
                              property={propertyA}
                            />
                          ))}
                        </div>
                      );
                    }
                    return (
                      <article className="prose-safe relative z-10">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {battleReport}
                        </ReactMarkdown>
                      </article>
                    );
                  })()
                ) : (
                  <p className="text-sm text-text-muted relative z-10">
                    {t('drawer.reportLoading')}
                  </p>
                )
              ) : (
                /* ── Single Site Report ── */
                <div className="relative z-10">
                  {/* Summary cards */}
                  {aiReport && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <SummaryCell 
                        label={t('drawer.geotechnical')} 
                        text={aiReport.geoStabilityExplanation} 
                        icon={Layers}
                        colorClass="text-amber-500"
                        borderClass="border-amber-500/20"
                        bgClass="bg-amber-500/[0.02]"
                      />
                      <SummaryCell 
                        label={t('drawer.seismicLabel')} 
                        text={aiReport.seismicExplanation} 
                        icon={Activity}
                        colorClass="text-red-400"
                        borderClass="border-red-400/20"
                        bgClass="bg-red-400/[0.02]"
                      />
                      <SummaryCell 
                        label={t('drawer.environment')} 
                        text={aiReport.floodEnvExplanation} 
                        icon={Droplets}
                        colorClass="text-blue-400"
                        borderClass="border-blue-400/20"
                        bgClass="bg-blue-400/[0.02]"
                      />
                    </div>
                  )}

                  {/* AI error state */}
                  {aiReport?.aiError && (
                    <div className="mb-6 rounded-lg border border-risk-danger/20 bg-risk-danger/5 p-4 flex items-start gap-3">
                      <AlertTriangle className="h-4 w-4 text-risk-danger shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-risk-danger mb-1">
                          AI belum dapat membuat penjelasan
                        </p>
                        <p className="text-xs text-text-muted leading-relaxed">
                          {lang === 'en'
                            ? 'The AI explanation could not be generated. The scores and classifications above remain valid — they are calculated by the S.A.F.E House deterministic engine.'
                            : 'AI belum dapat membuat penjelasan. Angka dan klasifikasi audit di atas tetap valid karena dihitung oleh mesin audit S.A.F.E House.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Micro analysis */}
                  {aiReport?.microAnalysis && (
                    <div className="mb-6 rounded-2xl border border-accent/20 bg-accent/[0.02] p-5 relative overflow-hidden" style={{
                      backgroundImage: 'radial-gradient(rgba(212,149,106,0.03) 1px, transparent 1px)',
                      backgroundSize: '16px 16px'
                    }}>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="default" className="gap-1 shadow-sm">
                          <MapPin className="h-3 w-3" />
                          {t('drawer.microAnalysis')}
                        </Badge>
                      </div>
                      <p className="text-xs leading-relaxed text-text-secondary">
                        {aiReport.microAnalysis}
                      </p>
                    </div>
                  )}

                  {/* Detailed report sections or loading skeleton */}
                  {aiReport?.detailedReport ? (
                    (() => {
                      const sections = parseSections(aiReport.detailedReport);
                      if (sections.length > 0) {
                        return (
                          <div className="space-y-1">
                            {sections.map((sec, idx) => (
                              <SectionCard 
                                key={idx} 
                                title={sec.title} 
                                content={sec.content} 
                                defaultExpanded={idx === 0} 
                                property={propertyA}
                              />
                            ))}
                          </div>
                        );
                      }
                      return (
                        <article className="prose-safe">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {aiReport.detailedReport}
                          </ReactMarkdown>
                        </article>
                      );
                    })()
                  ) : aiReport?.reportLoading ? (
                    <div className="space-y-3 animate-pulse">
                      <div className="h-4 bg-white/8 rounded w-2/5" />
                      <div className="h-3 bg-white/6 rounded w-full" />
                      <div className="h-3 bg-white/6 rounded w-11/12" />
                      <div className="h-3 bg-white/6 rounded w-4/5" />
                      <div className="h-4 bg-white/8 rounded w-1/3 mt-5" />
                      <div className="h-3 bg-white/6 rounded w-full" />
                      <div className="h-3 bg-white/6 rounded w-10/12" />
                      <div className="h-4 bg-white/8 rounded w-2/5 mt-5" />
                      <div className="h-3 bg-white/6 rounded w-full" />
                      <div className="h-3 bg-white/6 rounded w-3/4" />
                      <div className="h-3 bg-white/6 rounded w-full" />
                      <p className="text-[10px] text-text-muted font-mono mt-4">
                        {lang === 'en' ? 'Generating full report…' : 'Membuat laporan lengkap…'}
                      </p>
                    </div>
                  ) : !aiReport?.aiError ? (
                    <p className="text-sm text-text-muted">{t('drawer.reportLoading')}</p>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

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
};

function DataCoverageSummary({ property }) {
  const quality = property?.data_quality || {};
  const fields = quality.fields || {};
  const entries = Object.entries(COVERAGE_LABELS)
    .filter(([key]) => fields[key])
    .map(([key, label]) => [key, label, fields[key]]);

  const statusLabel = (status) => ({
    official: 'RESMI',
    model: 'MODEL',
    reference: 'REFERENSI',
    open_data: 'OPEN DATA',
    unavailable: 'BELUM TERSEDIA',
  }[status] || String(status || '—').toUpperCase());

  const statusClass = (status) => ({
    official: 'text-risk-safe border-risk-safe/20 bg-risk-safe/5',
    model: 'text-amber-300 border-amber-300/20 bg-amber-300/5',
    reference: 'text-sky-300 border-sky-300/20 bg-sky-300/5',
    open_data: 'text-sky-300 border-sky-300/20 bg-sky-300/5',
    unavailable: 'text-text-muted border-white/10 bg-white/[0.03]',
  }[status] || 'text-text-muted border-white/10 bg-white/[0.03]');

  return (
    <div className="mb-6 rounded-2xl border border-accent/15 bg-accent/[0.025] p-4 relative z-10">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <p className="text-[9px] font-bold tracking-[0.2em] text-accent uppercase">KELENGKAPAN DATA</p>
          <p className="mt-1 text-[11px] text-text-secondary">
            {quality.coverage_status === 'complete_with_estimates'
              ? 'Semua field terisi; sebagian memakai estimasi model yang diberi label.'
              : 'Field yang belum tersedia ditandai terbuka, bukan dianggap aman.'}
          </p>
        </div>
        <span className="rounded-md border border-accent/20 bg-accent/8 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-accent">
          {quality.mode === 'best_available' ? 'BEST AVAILABLE' : 'STRICT'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1.5 md:grid-cols-3">
        {entries.map(([key, label, item]) => (
          <div key={key} className="flex items-center justify-between gap-2 rounded-lg border border-white/6 bg-black/15 px-2 py-1.5">
            <span className="truncate text-[9px] text-text-muted">{label}</span>
            <span className={`shrink-0 rounded border px-1 py-0.5 text-[7px] font-bold tracking-wider ${statusClass(item.status)}`}>
              {statusLabel(item.status)}
            </span>
          </div>
        ))}
      </div>
      {/* Hanya daftar field proxy. Kalimat "bukan pengganti survei lapangan"
          sudah ada di banner disclaimer paling atas drawer; mengulanginya di
          sini membuat satu layar memuat peringatan yang sama dua kali. */}
      {quality.estimated_fields?.length > 0 && (
        <p className="mt-3 text-[9px] leading-relaxed text-amber-200/80">
          MODEL/proxy: {quality.estimated_fields.map((name) => COVERAGE_LABELS[name] || name).join(', ')}.
        </p>
      )}
    </div>
  );
}

function SummaryCell({ label, text, icon: Icon, colorClass, borderClass, bgClass }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border ${borderClass} ${bgClass} p-4 hover:scale-[1.02] hover:bg-white/[0.03] transition-all duration-300 shadow-sm`}>
      {/* Decorative background glow */}
      <div className={`absolute -right-6 -top-6 h-12 w-12 rounded-full blur-2xl opacity-15 ${colorClass.replace('text-', 'bg-')}`} />
      
      <div className="flex items-center gap-2 mb-2 relative z-10">
        <div className={`flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-white/5 border border-white/8 shadow-sm ${colorClass}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <p className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-text-muted">
          {label}
        </p>
      </div>
      <p className="text-[11.5px] leading-relaxed text-text-secondary relative z-10">{text}</p>
    </div>
  );
}
