import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ExternalLink, FileCheck2 } from 'lucide-react';

import { resolveStandardDoc } from '../../lib/standards';
import { useT } from '../../hooks/useTranslation';

const TONE_WAJIB = '#ef4444';

/**
 * Checklist kelengkapan teknis PBG dari hasil audit.
 *
 * Item dan prioritasnya ditentukan backend secara deterministik
 * (services/pbg_checklist.py); teks diterjemahkan di sini lewat i18n dengan
 * interpolasi params. Status centang murni lokal — alat bantu kerja, bukan
 * data yang disimpan.
 */
export function PbgChecklistCard({ property }) {
  const t = useT();
  const items = property?.pbg_checklist;

  const [checked, setChecked] = useState(() => new Set());

  const doneCount = useMemo(
    () => items?.filter((item) => checked.has(item.id)).length ?? 0,
    [items, checked],
  );

  if (!items || items.length === 0) return null;

  const toggle = (id) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const fill = (template, params = {}) =>
    template.replace(/\{(\w+)\}/g, (_, key) => {
      const value = params[key];
      return value === undefined || value === null ? '—' : String(value);
    });

  const allDone = doneCount === items.length;

  return (
    <section aria-label={t('pbg.title')} className="rpt-surface rounded-lg p-4">
      {/* Kepala + rel progres bergaya instrumen */}
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="rpt-eyebrow flex items-center gap-1.5">
          <FileCheck2 className="h-3.5 w-3.5 text-accent" />
          {t('pbg.title')}
        </h2>
        <span className="data-num shrink-0 font-data text-[12px] font-semibold tabular-nums text-text-primary">
          {doneCount}
          <span className="text-text-muted">/{items.length}</span>
        </span>
      </div>

      <div className="rpt-well mt-2.5 h-[3px] overflow-hidden rounded-full">
        <motion.div
          className="h-full rounded-full"
          style={{ background: allDone ? '#10b981' : 'hsl(var(--safe-accent))' }}
          initial={false}
          animate={{ width: `${(doneCount / items.length) * 100}%` }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      <ul className="mt-3 space-y-1.5">
        {items.map((item) => {
          const isDone = checked.has(item.id);
          const wajib = item.priority === 'wajib';
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => toggle(item.id)}
                aria-pressed={isDone}
                className={`rpt-focus group flex w-full items-start gap-2.5 rounded-md border p-2.5 text-left transition-colors duration-200 ${
                  isDone ? '' : 'hover:bg-[rgba(255,210,170,0.04)]'
                }`}
                style={{
                  borderColor: isDone ? 'var(--rpt-line)' : wajib ? `${TONE_WAJIB}44` : 'var(--rpt-line)',
                  background: isDone ? 'transparent' : wajib ? 'rgba(239, 68, 68, 0.045)' : 'var(--rpt-fill)',
                }}
              >
                {/* Kotak centang: kotak stensil yang terisi saat selesai. */}
                <span
                  aria-hidden
                  className="mt-px flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-[3px] border transition-all duration-200"
                  style={{
                    borderColor: isDone ? 'hsl(var(--safe-accent))' : 'var(--rpt-line-strong)',
                    background: isDone ? 'hsl(var(--safe-accent))' : 'transparent',
                  }}
                >
                  {isDone && (
                    <motion.span
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      className="flex"
                    >
                      <Check className="h-[11px] w-[11px] text-bg" strokeWidth={3} />
                    </motion.span>
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span
                      className={`text-[12.5px] font-semibold leading-snug transition-colors duration-200 ${
                        isDone ? 'text-text-muted line-through decoration-1' : 'text-text-primary'
                      }`}
                    >
                      {t(`pbg.item.${item.id}.title`)}
                    </span>
                    <span
                      className="rounded-sm px-1 py-px font-data text-[8.5px] font-bold uppercase tracking-[0.14em]"
                      style={{
                        color: wajib ? TONE_WAJIB : 'var(--safe-text-muted)',
                        border: `1px solid ${wajib ? `${TONE_WAJIB}55` : 'var(--rpt-line-strong)'}`,
                      }}
                    >
                      {wajib ? t('pbg.wajib') : t('pbg.disarankan')}
                    </span>
                  </span>
                  <span
                    className={`mt-0.5 block text-[11px] leading-relaxed transition-colors duration-200 ${
                      isDone ? 'text-text-muted/60' : 'text-text-muted'
                    }`}
                  >
                    {fill(t(`pbg.item.${item.id}.detail`), item.params)}
                  </span>
                  {item.sni_refs.length > 0 && (
                    <span className="mt-1.5 flex flex-wrap gap-1">
                      {item.sni_refs.map((ref) => {
                        const doc = resolveStandardDoc(ref);
                        return (
                          <a
                            key={ref}
                            href={doc?.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-0.5 rounded-sm border px-1.5 py-px font-data text-[9.5px] text-accent transition-colors hover:border-accent/50 hover:bg-accent/10"
                            style={{ borderColor: 'var(--rpt-line-strong)' }}
                          >
                            {ref}
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        );
                      })}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className="mt-2.5 border-t pt-2 text-[10px] leading-relaxed text-text-muted" style={{ borderColor: 'var(--rpt-line-soft)' }}>
        {t('pbg.note')}
      </p>
    </section>
  );
}
