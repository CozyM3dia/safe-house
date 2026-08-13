import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { createT } from '../lib/i18n';

/**
 * Returns a `t(key)` function that translates based on the current language.
 * Usage: const t = useT();  t('search.placeholder')
 */
export function useT() {
  const lang = useAppStore((s) => s.lang);
  return useMemo(() => createT(lang), [lang]);
}
