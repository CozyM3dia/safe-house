import { useMemo, useState } from 'react';
import { CheckSquare, ExternalLink, FileCheck2, Square } from 'lucide-react';

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

  return (
    <section aria-label={t('pbg.title')}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="rpt-eyebrow flex items-center gap-1.5">
          <FileCheck2 className="h-3.5 w-3.5 text-accent" />
          {t('pbg.title')}
        </h2>
        <span className="data-num shrink-0 text-[12px] font-semibold text-text-primary">
          {doneCount}
          <span className="text-text-muted">/{items.length}</span>
        </span>
      </div>

      <ul className="mt-2.5 space-y-1.5">
        {items.map((item) => {
          const isDone = checked.has(item.id);
          const wajib = item.priority === 'wajib';
          return (
            <li
              key={item.id}
              className="rounded-lg border p-2.5 transition-colors"
              style={{
                borderColor: isDone ? 'var(--rpt-line)' : wajib ? `${TONE_WAJIB}55` : 'var(--rpt-line)',
                background: isDone ? 'transparent' : wajib ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255, 210, 170, 0.03)',
              }}
            >
              <button
                type="button"
                onClick={() => toggle(item.id)}
                className="rpt-focus flex w-full items-start gap-2.5 text-left"
                aria-pressed={isDone}
              >
                {isDone ? (
                  <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                ) : (
                  <Square className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span
                      className={`text-[12.5px] font-semibold leading-snug ${isDone ? 'text-text-muted line-through decoration-1' : 'text-text-primary'}`}
                    >
                      {t(`pbg.item.${item.id}.title`)}
                    </span>
                    <span
                      className="rounded px-1 py-px font-data text-[8.5px] font-bold uppercase tracking-[0.12em]"
                      style={{
                        color: wajib ? TONE_WAJIB : 'var(--safe-text-muted)',
                        border: `1px solid ${wajib ? `${TONE_WAJIB}66` : 'var(--rpt-line-strong)'}`,
                      }}
                    >
                      {wajib ? t('pbg.wajib') : t('pbg.disarankan')}
                    </span>
                  </span>
                  <span className={`mt-0.5 block text-[11px] leading-relaxed ${isDone ? 'text-text-muted/70' : 'text-text-muted'}`}>
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
                            className="inline-flex items-center gap-0.5 rounded border border-[rgba(255,210,170,0.14)] bg-[rgba(22,14,8,0.5)] px-1.5 py-px font-data text-[9.5px] text-accent transition-colors hover:border-accent/40"
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

      <p className="mt-2 text-[10px] leading-relaxed text-text-muted">
        {t('pbg.note')}
      </p>
    </section>
  );
}
