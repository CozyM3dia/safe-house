import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useAppStore } from '../../../store/useAppStore';

/**
 * ThemeToggle, sakelar dark mocha / light paper untuk landing.
 * Menulis ke `theme` di store yang sama dengan app (persist + pre-hydration
 * script), sehingga AppPreferences menyinkronkan html[data-theme] global.
 * Ikon: moon (ke dark) / sun (ke light) dengan crossfade + rotate halus.
 */
export default function ThemeToggle({ t }) {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const isDark = theme !== 'light';

  return (
    <motion.button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      whileTap={{ scale: 0.92 }}
      aria-label={isDark ? t('navThemeToLight') : t('navThemeToDark')}
      aria-pressed={!isDark}
      title={isDark ? t('navThemeToLight') : t('navThemeToDark')}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[color:var(--lp-line)] text-[color:var(--lp-clay)] transition-colors duration-300 hover:border-[color:var(--lp-taupe)] hover:text-[color:var(--lp-mocha)]"
    >
      <motion.span
        key={isDark ? 'moon' : 'sun'}
        initial={{ opacity: 0, rotate: -35, scale: 0.7 }}
        animate={{ opacity: 1, rotate: 0, scale: 1 }}
        transition={{ duration: 0.32, ease: [0.19, 1, 0.22, 1] }}
        className="flex items-center justify-center"
      >
        {isDark ? <Moon size={15} aria-hidden="true" /> : <Sun size={15} aria-hidden="true" />}
      </motion.span>
    </motion.button>
  );
}
