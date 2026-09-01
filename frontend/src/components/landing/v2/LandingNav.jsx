import { useEffect, useState } from 'react';
import { useLpNavigate } from '../../../hooks/useLpNavigate';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowRight } from 'lucide-react';
import { useAppStore } from '../../../store/useAppStore';
import { LandingLogo } from './atoms';
import ThemeToggle from './ThemeToggle';

/**
 * Nav landing v2, tenang, compact, editorial.
 * - Transparan menyatu hero saat paling atas; kertas blur saat scroll.
 * - Kontrak test: aria-label "Open navigation"/"Close navigation",
 *   target sentuh >= 40px, header+h1 tanpa overflow 320-1440px.
 */
export default function LandingNav({ t }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useLpNavigate();
  const setLang = useAppStore((s) => s.setLang);
  const lang = useAppStore((s) => s.lang);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleClick = (item) => {
    setOpen(false);
    if (item.path) {
      navigate(item.path);
    } else if (item.id) {
      document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const links = [
    { label: t('navLayers'), id: 'bento' },
    { label: t('navShowcase'), id: 'showcase' },
    { label: t('navValidation'), path: '/validasi' },
    { label: t('navSources'), id: 'misi' },
    { label: t('navFaq'), id: 'faq' },
  ];

  const start = () => {
    setOpen(false);
    navigate('/app');
  };

  return (
    <motion.header
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-white/10 bg-[#12100d]/95 shadow-[0_12px_36px_rgba(0,0,0,0.5)] backdrop-blur-xl'
          : 'border-b border-white/[0.08] bg-[#12100d]/80 shadow-[0_4px_24px_rgba(0,0,0,0.35)] backdrop-blur-md'
      }`}
    >
      <nav className="lp-container flex h-[68px] items-center justify-between gap-3" aria-label="Utama">
        {/* Kiri: brand */}
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex min-h-[44px] items-center gap-3 rounded-lg transition-transform hover:scale-[1.02] active:scale-95"
          aria-label="S.A.F.E House, beranda"
        >
          <LandingLogo className="h-7 w-auto max-w-[42vw] object-left md:h-9 md:max-w-none" />
        </button>

        {/* Tengah: anchor links (desktop) */}
        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <button
              key={l.id || l.path}
              type="button"
              onClick={() => handleClick(l)}
              className="rounded-lg px-3.5 py-2 text-[0.88rem] font-medium text-[#e8d9c0] transition-colors duration-200 hover:bg-white/[0.08] hover:text-[#f5ebd9]"
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Kanan: lang + CTA */}
        <div className="flex items-center gap-2">
          <ThemeToggle t={t} />
          <div
            className="hidden items-center rounded-full border border-white/10 bg-[#1a1512]/80 p-0.5 sm:flex"
            role="group"
            aria-label={t('navLangGroup')}
          >
            {[
              { code: 'id', label: 'ID' },
              { code: 'en', label: 'EN' },
            ].map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLang(l.code)}
                aria-pressed={lang === l.code}
                className={`min-h-[34px] min-w-[38px] rounded-full px-2.5 text-[11px] font-bold tracking-[0.12em] transition-all duration-200 ${
                  lang === l.code
                    ? 'bg-[#d4956a] text-[#241a12] shadow-sm'
                    : 'text-[#a08c74] hover:text-[#f0e4cc]'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={start}
            className="btn-shine relative !hidden min-[480px]:!inline-flex !min-h-[40px] items-center gap-2 whitespace-nowrap rounded-full bg-[#d4956a] px-4 text-[0.85rem] font-semibold text-[#241a12] shadow-md transition-transform hover:scale-[1.02] active:scale-95"
          >
            {t('navCta')}
            <ArrowRight size={15} aria-hidden="true" />
          </button>

          {/* Menu mobile, target sentuh >= 40px */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Close navigation' : 'Open navigation'}
            aria-expanded={open}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-[#f0e4cc] md:hidden"
          >
            {open ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
          </button>
        </div>
      </nav>

      {/* Panel mobile */}
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="mx-3 mb-3 rounded-2xl border border-[color:var(--lp-line)] bg-[color:var(--lp-paper)] p-2 shadow-[0_24px_60px_rgba(74,54,38,0.18)] md:hidden"
          >
            {links.map((l) => (
              <button
                key={l.id || l.path}
                type="button"
                onClick={() => handleClick(l)}
                className="flex min-h-[48px] w-full items-center rounded-xl px-4 text-left text-[0.95rem] font-medium text-[color:var(--lp-umber)] transition-colors hover:bg-[color:var(--lp-well)]"
              >
                {l.label}
              </button>
            ))}
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[color:var(--lp-line-soft)] px-2 pt-3">
              <div className="flex items-center gap-2">
                <ThemeToggle t={t} />
              </div>
              <div className="flex items-center rounded-full border border-[color:var(--lp-line)] p-0.5">
                {[
                  { code: 'id', label: 'ID' },
                  { code: 'en', label: 'EN' },
                ].map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => setLang(l.code)}
                    aria-pressed={lang === l.code}
                    className={`min-h-[40px] min-w-[44px] rounded-full px-3 text-[11px] font-bold tracking-[0.12em] ${
                      lang === l.code
                        ? 'bg-[color:var(--lp-mocha)] text-[color:var(--lp-paper)]'
                        : 'text-[color:var(--lp-clay)]'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
              <button type="button" onClick={start} className="lp-btn lp-btn--primary flex-1 !min-h-[48px] text-[0.9rem]">
                {t('navCta')}
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.header>
  );
}
