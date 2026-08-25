import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Sparkles, X, ChevronLeft, ChevronRight, Crosshair, Search,
  GitCompareArrows, LayoutDashboard, FileText, Layers,
  MessageCircle, Languages, Rocket, MapPin,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useT } from '../../hooks/useTranslation';
import { Button } from '../ui/button';
import { subscribeToViewport } from '../../lib/responsive';

const STEP_ICONS = {
  welcome: Sparkles,
  cursor: Crosshair,
  search: Search,
  mode: GitCompareArrows,
  panel: LayoutDashboard,
  reports: FileText,
  layers: Layers,
  chatbot: MessageCircle,
  display: Languages,
  finish: Rocket,
};

// Token warna brand — hindari literal tersebar yang bisa desinkron dari
// palet Mocha saat token aksen berubah.
const ACCENT_RGB = '212,149,106';
const BACKDROP_RGB = '8,6,4';

/** Lokasi contoh untuk langkah penutup — satu klik langsung menjalankan audit. */
const FINISH_SITES = [
  { key: 'monas', labelKey: 'tour.finishSite.monas', lat: -6.1754, lon: 106.8272 },
  { key: 'gedungsate', labelKey: 'tour.finishSite.gedungsate', lat: -6.9025, lon: 107.6186 },
  { key: 'lampung', labelKey: 'tour.finishSite.lampung', lat: -5.3838, lon: 105.2807 },
];

/** Sudut bidik ala instrumen survei — anak dari frame yang meluncur,
    jadi keempat sudut bergerak bersama bingkai, bukan teleport. */
function CornerBrackets({ reduceMotion }) {
  const corners = [
    { id: 'tl', cls: '-top-2 -left-2 border-l-2 border-t-2 rounded-tl-md' },
    { id: 'tr', cls: '-top-2 -right-2 border-r-2 border-t-2 rounded-tr-md' },
    { id: 'bl', cls: '-bottom-2 -left-2 border-l-2 border-b-2 rounded-bl-md' },
    { id: 'br', cls: '-bottom-2 -right-2 border-r-2 border-b-2 rounded-br-md' },
  ];
  return corners.map(({ id, cls }) => (
    <motion.span
      key={id}
      aria-hidden="true"
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 1.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
      className={`absolute h-4 w-4 border-accent ${cls}`}
    />
  ));
}

export function OnboardingTour() {
  const t = useT();
  const reduceMotion = useReducedMotion();
  const onboardingActive = useAppStore((s) => s.onboardingActive);
  const onboardingStep = useAppStore((s) => s.onboardingStep);
  const nextStep = useAppStore((s) => s.nextOnboardingStep);
  const prevStep = useAppStore((s) => s.prevOnboardingStep);
  const jumpToStep = useAppStore((s) => s.jumpToOnboardingStep);
  const stopOnboarding = useAppStore((s) => s.stopOnboarding);
  const setTourMockPanel = useAppStore((s) => s.setTourMockPanel);
  const processLocation = useAppStore((s) => s.processLocation);
  const cmdPaletteOpen = useAppStore((s) => s.cmdPaletteOpen);
  const auditDrawerOpen = useAppStore((s) => s.auditDrawerOpen);
  const pendingAudit = useAppStore((s) => s.pendingAudit);

  const [targetRect, setTargetRect] = useState(null);
  const [contentH, setContentH] = useState(0);
  const [viewport, setViewport] = useState(() => ({
    w: window.innerWidth,
    h: Math.round(window.visualViewport?.height || window.innerHeight),
  }));
  const tooltipRef = useRef(null);
  const contentRef = useRef(null);
  const restoreFocusRef = useRef(null);
  // Tinggi kartu tidak boleh "dip" saat AnimatePresence mode="wait"
  // mengosongkan konten di antara dua langkah — ukuran mengecil diabaikan
  // selama jendela transisi.
  const stepChangedAt = useRef(0);

  const steps = [
    {
      id: 'welcome',
      title: t('tour.welcome.title'),
      desc: t('tour.welcome.desc'),
      selector: null,
      position: 'center',
    },
    {
      id: 'cursor',
      title: t('tour.cursor.title'),
      desc: t('tour.cursor.desc'),
      selector: '[data-tour="map-area"]',
      position: 'center',
    },
    {
      id: 'search',
      title: t('tour.search.title'),
      desc: t('tour.search.desc'),
      selector: '[data-tour="topbar-search"]',
      position: 'bottom',
    },
    {
      id: 'mode',
      title: t('tour.mode.title'),
      desc: t('tour.mode.desc'),
      selector: '[data-tour="topbar-mode"]',
      position: 'bottom',
    },
    {
      id: 'panel',
      title: t('tour.panel.title'),
      desc: t('tour.panel.desc'),
      specs: ['tour.spec.safe', 'tour.spec.vs30', 'tour.spec.pga', 'tour.spec.site', 'tour.spec.fs', 'tour.spec.flood'],
      selector: '[data-tour="left-panel"]',
      position: 'right',
    },
    {
      id: 'reports',
      title: t('tour.reports.title'),
      desc: t('tour.reports.desc'),
      selector: '[data-tour="panel-report-actions"]',
      position: 'right',
    },
    {
      id: 'layers',
      title: t('tour.layers.title'),
      desc: t('tour.layers.desc'),
      specs: ['tour.spec.inarisk', 'tour.spec.faultPuSGeN', 'tour.spec.basemap'],
      selector: '[data-tour="map-layers-trigger"]',
      position: 'left-top',
    },
    {
      id: 'chatbot',
      title: t('tour.chatbot.title'),
      desc: t('tour.chatbot.desc'),
      selector: '[data-tour="chatbot-fab"]',
      position: 'left-top',
    },
    {
      id: 'display',
      title: t('tour.display.title'),
      desc: t('tour.display.desc'),
      selector: null,
      position: 'center',
    },
    {
      id: 'finish',
      title: t('tour.finish.title'),
      desc: t('tour.finish.desc'),
      selector: null,
      position: 'center',
    },
  ];

  const currentStepData = steps[onboardingStep];
  const StepIcon = STEP_ICONS[currentStepData?.id] || Sparkles;
  const isLastStep = onboardingStep === steps.length - 1;
  const isCenterStep = !targetRect || currentStepData?.position === 'center';

  // Selama tur menyorot panel kiri (langkah dashboard & laporan), panel
  // menampilkan contoh hasil audit — bukan layar kosong. Langkah lain
  // mengembalikan tampilan awal.
  useEffect(() => {
    const showMock = onboardingActive
      && (currentStepData?.id === 'panel' || currentStepData?.id === 'reports');
    setTourMockPanel(showMock);
    return () => setTourMockPanel(false);
  }, [onboardingActive, currentStepData?.id, setTourMockPanel]);

  // Viewport berlangganan untuk SEMUA langkah — tooltip terpusat tetap
  // benar saat ponsel diputar atau keyboard mengecilkan visualViewport.
  useEffect(() => {
    const update = () => setViewport({
      w: window.innerWidth,
      h: Math.round(window.visualViewport?.height || window.innerHeight),
    });
    update();
    return subscribeToViewport(update);
  }, []);

  // Tinggi isi diukur agar kartu ikut meluncur secara vertikal saat
  // konten langkah berubah — bukan memotong ukuran seketika.
  useEffect(() => {
    stepChangedAt.current = Date.now();
  }, [onboardingStep]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(() => {
      const next = el.offsetHeight;
      setContentH((prev) => {
        const inSwap = Date.now() - stepChangedAt.current < 600;
        return inSwap && next < prev ? prev : next;
      });
    });
    observer.observe(el);
    setContentH(el.offsetHeight);
    return () => observer.disconnect();
  }, [onboardingActive, onboardingStep]);

  useEffect(() => {
    if (!onboardingActive || !currentStepData?.selector) {
      // Reset stale spotlight coordinates when the tour switches to a centered step.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTargetRect(null);
      return;
    }

    const updatePosition = () => {
      const el = document.querySelector(currentStepData.selector);
      if (!el) {
        setTargetRect(null);
        return;
      }
      const rect = el.getBoundingClientRect();
      // Lewati pembaruan identik — polling 4x/detik tidak boleh memaksa
      // re-render (dan restart animasi bracket) tanpa perubahan nyata.
      setTargetRect((prev) => (
        prev
        && Math.abs(prev.top - rect.top) < 0.5
        && Math.abs(prev.left - rect.left) < 0.5
        && Math.abs(prev.width - rect.width) < 0.5
        && Math.abs(prev.height - rect.height) < 0.5
          ? prev
          : rect
      ));
    };

    // Langkah laporan: target ada di dasar panel yang bisa digulir.
    // Gulirkan ke tengah dulu supaya spotlight benar-benar terlihat —
    // polling di bawah akan mengikuti posisi akhirnya.
    if (currentStepData.id === 'reports') {
      document.querySelector(currentStepData.selector)
        ?.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
    }

    updatePosition();
    const unsubscribe = subscribeToViewport(updatePosition);
    window.addEventListener('scroll', updatePosition, { capture: true, passive: true });
    const interval = setInterval(updatePosition, 250);

    return () => {
      unsubscribe();
      window.removeEventListener('scroll', updatePosition, { capture: true });
      clearInterval(interval);
    };
  }, [onboardingActive, onboardingStep, currentStepData?.selector, currentStepData?.id, reduceMotion]);

  // Navigasi keyboard: → lanjut, ← mundur, Esc keluar, Enter lanjut.
  // Abaikan saat mengetik di input atau saat permukaan lain (palette,
  // drawer, dialog konfirmasi) aktif — satu modal satu pemilik Escape.
  useEffect(() => {
    if (!onboardingActive) return undefined;
    const onKey = (event) => {
      const target = event.target;
      if (target?.closest?.('input, textarea, select, [contenteditable="true"], [cmdk-input]')) return;
      if (cmdPaletteOpen || auditDrawerOpen || pendingAudit) return;

      if (event.key === 'Escape') {
        stopOnboarding();
      } else if (event.key === 'ArrowRight' || (event.key === 'Enter' && target === tooltipRef.current)) {
        if (onboardingStep < steps.length - 1) nextStep();
        else stopOnboarding();
      } else if (event.key === 'ArrowLeft' && onboardingStep > 0) {
        prevStep();
      } else if (event.key === 'Tab') {
        // Focus trap: siklus Tab di dalam tooltip saja. Fokus yang jatuh ke
        // backdrop (klik di luar) ditarik kembali ke siklus.
        const container = tooltipRef.current;
        if (!container) return;
        const focusables = container.querySelectorAll(
          'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (!container.contains(document.activeElement)) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onboardingActive, onboardingStep, nextStep, prevStep, stopOnboarding, cmdPaletteOpen, auditDrawerOpen, pendingAudit]);

  // Fokus masuk ke dialog sekali saat tur dibuka; fokus pemanggil
  // dipulihkan saat tur ditutup. Pergantian langkah TIDAK mencuri fokus —
  // sudah diumumkan oleh region aria-live di dalam dialog.
  useEffect(() => {
    if (!onboardingActive) {
      if (restoreFocusRef.current !== null) {
        const prev = restoreFocusRef.current;
        restoreFocusRef.current = null;
        if (prev?.isConnected) prev.focus();
        else document.querySelector('main h1, main button')?.focus();
      }
      return;
    }
    if (restoreFocusRef.current === null) {
      restoreFocusRef.current = document.activeElement;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      tooltipRef.current?.focus?.({ preventScroll: true });
    }
  }, [onboardingActive]);

  if (!onboardingActive || !currentStepData) return null;

  const handleNext = () => {
    if (onboardingStep < steps.length - 1) {
      nextStep();
    } else {
      stopOnboarding();
    }
  };

  // Nilai numerik — motion menganimasikan top/left/width/height sehingga
  // tooltip "meluncur" ke target berikutnya alih-alih berpindah secara kasar.
  const getTooltipPos = () => {
    const tooltipWidth = Math.min(380, viewport.w - 24);
    const tooltipHeight = Math.min(420, viewport.h - 24);
    // Tinggi terukur isi kartu — 0 berarti belum terukur, pakai maksimum.
    const height = contentH > 0 ? Math.min(contentH, tooltipHeight) : tooltipHeight;

    if (isCenterStep) {
      return {
        top: Math.max(12, (viewport.h - height) / 2) + (window.visualViewport?.offsetTop ?? 0),
        left: Math.max(12, (viewport.w - tooltipWidth) / 2) + (window.visualViewport?.offsetLeft ?? 0),
        width: tooltipWidth,
        height,
        maxHeight: tooltipHeight,
      };
    }

    const space = 14;
    const pos = currentStepData.position;
    let top;
    let left;

    if (pos === 'bottom') {
      top = targetRect.bottom + space;
      left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
    } else if (pos === 'bottom-left') {
      top = targetRect.bottom + space;
      left = targetRect.right - tooltipWidth;
    } else if (pos === 'right') {
      top = targetRect.top;
      left = targetRect.right + space;
    } else if (pos === 'left-top') {
      top = targetRect.bottom - targetRect.height;
      left = targetRect.left - tooltipWidth - space;
    } else {
      top = (viewport.h - tooltipHeight) / 2;
      left = (viewport.w - tooltipWidth) / 2;
    }

    const padding = 12;
    left = Math.max(padding, Math.min(viewport.w - tooltipWidth - padding, left));
    top = Math.max(padding, Math.min(viewport.h - height - padding, top));

    // Keyboard ponsel mengecilkan visual viewport dengan offset —
    // position: fixed resolve terhadap layout viewport, jadi geser manual.
    top += window.visualViewport?.offsetTop ?? 0;
    left += window.visualViewport?.offsetLeft ?? 0;

    return { top, left, width: tooltipWidth, height, maxHeight: tooltipHeight };
  };

  const tooltipPos = getTooltipPos();

  const pad = 6;

  const springTransition = reduceMotion
    ? { duration: 0 }
    : { type: 'spring', damping: 30, stiffness: 320 };

  // Geometri frame mengikuti spring yang sama dengan tooltip — satu
  // "kamera" yang bergerak, bukan kartu melayang di atas slideshow.
  const framePos = targetRect
    ? {
        top: targetRect.top - pad,
        left: targetRect.left - pad,
        width: targetRect.width + pad * 2,
        height: targetRect.height + pad * 2,
      }
    : null;

  return (
    <motion.div
      className="fixed inset-0 z-40 overflow-hidden select-none"
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* 1. Backdrop bermasker + tepi sorot yang di-feather (blur), bukan
             potongan tajam — membaca sebagai optik, bukan hack CSS. */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full">
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {framePos && (
              <motion.rect
                rx={12}
                fill="black"
                initial={false}
                animate={{
                  x: framePos.left,
                  y: framePos.top,
                  width: framePos.width,
                  height: framePos.height,
                }}
                transition={springTransition}
              />
            )}
          </mask>
          <radialGradient id="tour-vignette" cx="50%" cy="45%" r="75%">
            <stop offset="0%" stopColor={`rgba(${BACKDROP_RGB},0)`} />
            <stop offset="100%" stopColor={`rgba(${BACKDROP_RGB},0.5)`} />
          </radialGradient>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(8, 6, 4, 0.72)"
          mask="url(#spotlight-mask)"
        />
        <rect width="100%" height="100%" fill="url(#tour-vignette)" />
      </svg>

      {/* 2. Spotlight terpadu: ring glow + denyut + sudut bidik meluncur
             bersama dalam satu frame */}
      {framePos && (
        <motion.div
          aria-hidden="true"
          initial={reduceMotion
            ? { opacity: 1 }
            : { opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1, top: framePos.top, left: framePos.left, width: framePos.width, height: framePos.height }}
          transition={{
            default: springTransition,
            opacity: { duration: reduceMotion ? 0 : 0.35 },
            scale: { duration: reduceMotion ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] },
          }}
          className="pointer-events-none fixed z-40"
        >
          {/* Feather palsu via box-shadow komposit — warna samar dengan
                  backdrop, terbaca sebagai tepi optik, dianimasikan di
                  compositor (jauh lebih murah dari feGaussianBlur). */}
          <div className={`absolute inset-0 rounded-2xl border border-accent/70 shadow-[0_0_18px_10px_rgba(${BACKDROP_RGB},0.72),0_0_32px_rgba(${ACCENT_RGB},0.35),inset_0_0_18px_rgba(${ACCENT_RGB},0.08)]`} />
          {!reduceMotion && (
            <motion.div
              className="absolute inset-0 rounded-2xl border border-accent/50"
              animate={{ opacity: [0.45, 0.12, 0.45] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
          <CornerBrackets reduceMotion={reduceMotion} />
        </motion.div>
      )}

      {/* 3. Tooltip persisten — meluncur antar target, isi ber-crossfade */}
      <motion.div
        ref={tooltipRef}
        data-testid="onboarding-tooltip"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        tabIndex={-1}
        initial={false}
        animate={{
          top: tooltipPos.top,
          left: tooltipPos.left,
          width: tooltipPos.width,
          height: tooltipPos.height,
        }}
        transition={springTransition}
        style={{ position: 'fixed', zIndex: 55, maxHeight: tooltipPos.maxHeight }}
        className={`glass-strong outline-none overflow-hidden rounded-2xl border border-white/10 shadow-[0_24px_64px_rgba(${BACKDROP_RGB},0.55)]`}
      >
        {/* Rail progres di tepi atas — instrumen yang terisi; satu tarikan
            napas cahaya saat mencapai 100% */}
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[2px] bg-accent/15">
          <motion.div
            className="h-full bg-gradient-to-r from-accent/60 to-accent"
            initial={false}
            animate={{
              width: `${((onboardingStep + 1) / steps.length) * 100}%`,
              boxShadow: isLastStep
                ? [`0 0 8px rgba(${ACCENT_RGB},0.4)`, `0 0 20px rgba(${ACCENT_RGB},0.9)`, `0 0 8px rgba(${ACCENT_RGB},0.4)`]
                : `0 0 8px rgba(${ACCENT_RGB},0.4)`,
            }}
            transition={reduceMotion
              ? { duration: 0 }
              : {
                  width: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
                  boxShadow: { duration: 0.9, ease: 'easeInOut' },
                }}
          />
        </div>

        {/* Close button — anak langsung tooltip, bukan scroller, supaya
            tidak pernah tergeser keluar layar saat konten panjang */}
        <button
          type="button"
          onClick={stopOnboarding}
          aria-label={t('accessibility.close')}
          className="absolute right-2.5 top-2.5 z-10 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-text-muted transition-all hover:bg-white/8 hover:text-text-primary active:scale-[0.94] sm:min-h-8 sm:min-w-8"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Boot sequence — kartu menyala seperti instrumen dinyalakan */}
        <motion.div
          ref={contentRef}
          className="overflow-y-auto p-4 sm:p-5"
          style={{ maxHeight: 'inherit' }}
          initial={reduceMotion
            ? { opacity: 1 }
            : { opacity: 0, y: 24, scale: 0.97, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          transition={reduceMotion
            ? { duration: 0 }
            : { type: 'spring', damping: 27, stiffness: 310, mass: 0.78, delay: 0.04 }}
        >
          {/* Pengumuman pembaca layar — pergantian langkah tidak lagi bisu */}
          <p aria-live="polite" className="sr-only">
            {currentStepData.title} — {onboardingStep + 1} {t('tour.stepOf')} {steps.length}
          </p>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`tour-content-${onboardingStep}`}
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -4 }}
              transition={reduceMotion
                ? { duration: 0 }
                : {
                    // Enter menunggu kartu hampir terpasang — teks muncul
                    // sebagai "focus pull", bukan menumpang di tengah lintasan.
                    duration: 0.18,
                    delay: 0.18,
                    ease: [0.16, 1, 0.3, 1],
                  }}
            >
              {/* Header: chip ikon + kicker + judul */}
              <div className="mb-3 flex items-start gap-3 pr-8">
                <motion.div
                  key={`tour-icon-${currentStepData.id}`}
                  initial={reduceMotion ? { opacity: 1 } : { scale: 0.6, opacity: 0, rotate: -12 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={reduceMotion
                    ? { duration: 0 }
                    : { type: 'spring', damping: 16, stiffness: 260, delay: 0.22 }}
                  className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent/25 bg-gradient-to-br from-accent/20 via-accent/10 to-transparent"
                >
                  <StepIcon className="h-[18px] w-[18px] text-accent" />
                  {!reduceMotion && (
                    <motion.span
                      aria-hidden="true"
                      className="absolute inset-0 rounded-xl border border-accent/30"
                      animate={{ scale: [1, 1.22], opacity: [0.5, 0] }}
                      transition={{ duration: 1.1, repeat: 2, ease: 'easeOut' }}
                    />
                  )}
                </motion.div>
                <div className="min-w-0 pt-0.5">
                  <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-accent/80">
                    {t('tour.kicker')} · {onboardingStep + 1}/{steps.length}
                  </p>
                  <h3 id="tour-title" className="mt-1 font-display text-[15px] font-semibold leading-snug tracking-tight text-text-primary">
                    {currentStepData.title}
                  </h3>
                </div>
              </div>

              {/* Body */}
              <p className="mb-4 text-xs leading-relaxed text-text-secondary">
                {currentStepData.desc}
              </p>

              {/* Spesifikasi sebagai chip mono — parameter padat jadi bisa
                  dipindai, bukan prosa cetak-kecil */}
              {currentStepData.specs && (
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {currentStepData.specs.map((specKey) => (
                    <span
                      key={specKey}
                      className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-text-secondary"
                    >
                      <span aria-hidden="true" className="h-1 w-1 rotate-45 bg-accent/70" />
                      {t(specKey)}
                    </span>
                  ))}
                </div>
              )}

              {/* Langkah penutup: lokasi contoh bisa langsung dijalankan —
                  tur berakhir dengan hasil nyata, bukan instruksi. Daftar
                  merakit dirinya setelah kartu terpasang. */}
              {currentStepData.id === 'finish' && (
                <div className="mb-4">
                  <p className="mb-2 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-text-muted">
                    {t('tour.finishTry')}
                  </p>
                  <motion.div
                    className="flex flex-col gap-1"
                    initial="hidden"
                    animate="show"
                    variants={{
                      hidden: {},
                      show: reduceMotion
                        ? {}
                        : { transition: { staggerChildren: 0.06, delayChildren: 0.15 } },
                    }}
                  >
                    {FINISH_SITES.map((site) => (
                      <motion.button
                        key={site.key}
                        type="button"
                        variants={{
                          hidden: reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 },
                          show: { opacity: 1, y: 0 },
                        }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        onClick={() => {
                          stopOnboarding();
                          processLocation(site.lat, site.lon);
                        }}
                        className="group flex min-h-[44px] items-center gap-2.5 rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2 text-left transition-all hover:border-accent/35 hover:bg-accent/10 active:scale-[0.98] sm:min-h-9"
                      >
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-accent/80" />
                        <span className="flex-1 text-[12px] font-semibold text-text-primary transition-colors group-hover:text-accent">
                          {t(site.labelKey)}
                        </span>
                        <span className="font-mono text-[9px] tabular-nums text-text-muted">
                          {site.lat.toFixed(2)}, {site.lon.toFixed(2)}
                        </span>
                        <ChevronRight className="h-3 w-3 -translate-x-1 text-accent opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-70" />
                      </motion.button>
                    ))}
                  </motion.div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Progress dots — lompatan atomik, target sentuh memadai */}
          <div className="mb-3 flex items-center gap-0.5" role="group" aria-label={t('tour.kicker')}>
            {steps.map((step, index) => (
              <button
                key={step.id}
                type="button"
                aria-current={index === onboardingStep ? 'step' : undefined}
                aria-label={`${t('tour.step')} ${index + 1} ${t('tour.stepOf')} ${steps.length}`}
                onClick={() => jumpToStep(index)}
                className="group flex h-10 w-10 shrink-0 items-center justify-center -mx-2.5 p-1"
              >
                <span
                  className={`rounded-full transition-[width,background-color,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    index === onboardingStep
                      ? `h-1.5 w-6 bg-accent shadow-[0_0_8px_rgba(${ACCENT_RGB},0.5)]`
                      : index < onboardingStep
                        ? 'h-1.5 w-1.5 bg-accent/40 group-hover:bg-accent/60'
                        : 'h-1.5 w-1.5 bg-white/15 group-hover:bg-white/30'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between border-t border-white/6 pt-3">
            <span className="hidden font-mono text-[9px] uppercase tracking-[0.1em] text-text-muted md:inline">
              {t('tour.keyboardHint')}
            </span>

            <div className="flex flex-1 items-center justify-between gap-2 md:justify-end">
              {onboardingStep > 0 ? (
                <Button
                  onClick={prevStep}
                  variant="outline"
                  size="sm"
                  className="min-h-[44px] text-[11px] font-semibold py-1 px-2.5 flex items-center gap-1 border border-white/8 hover:bg-white/6 transition-transform active:scale-[0.97] sm:min-h-8"
                >
                  <ChevronLeft className="h-3 w-3" />
                  {t('tour.back')}
                </Button>
              ) : (
                <Button
                  onClick={stopOnboarding}
                  variant="ghost"
                  size="sm"
                  className="min-h-[44px] text-[11px] font-semibold py-1 px-2.5 text-text-muted hover:text-text-primary sm:min-h-8"
                >
                  {t('tour.skip')}
                </Button>
              )}

              <Button
                onClick={handleNext}
                variant="accent"
                size="sm"
                  className={`min-h-[44px] text-[11px] font-semibold py-1 px-3.5 flex items-center gap-1 shadow-[0_0_16px_rgba(${ACCENT_RGB},0.2)] transition-transform active:scale-[0.97] sm:min-h-8`}
              >
                <span>
                  {isLastStep ? t('tour.getStarted') : t('tour.next')}
                </span>
                {!isLastStep && (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
