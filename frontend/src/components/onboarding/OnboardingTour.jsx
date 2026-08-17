import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { useT } from '../../hooks/useTranslation';
import { Button } from '../ui/button';
import { Sparkles, X, ChevronLeft, ChevronRight } from 'lucide-react';

export function OnboardingTour() {
  const t = useT();
  const onboardingActive = useAppStore((s) => s.onboardingActive);
  const onboardingStep = useAppStore((s) => s.onboardingStep);
  const nextStep = useAppStore((s) => s.nextOnboardingStep);
  const prevStep = useAppStore((s) => s.prevOnboardingStep);
  const stopOnboarding = useAppStore((s) => s.stopOnboarding);

  const [targetRect, setTargetRect] = useState(null);

  const steps = [
    {
      title: t('tour.welcome.title'),
      desc: t('tour.welcome.desc'),
      selector: null,
      position: 'center',
    },
    {
      title: t('tour.cursor.title'),
      desc: t('tour.cursor.desc'),
      selector: '[data-tour="map-area"]',
      position: 'center',
    },
    {
      title: t('tour.search.title'),
      desc: t('tour.search.desc'),
      selector: '[data-tour="topbar-search"]',
      position: 'bottom',
    },
    {
      title: t('tour.mode.title'),
      desc: t('tour.mode.desc'),
      selector: '[data-tour="topbar-mode"]',
      position: 'bottom',
    },
    {
      title: t('tour.panel.title'),
      desc: t('tour.panel.desc'),
      selector: '[data-tour="left-panel"]',
      position: 'right',
    },
    {
      title: t('tour.layers.title'),
      desc: t('tour.layers.desc'),
      selector: '[data-tour="map-layers-trigger"]',
      position: 'left-top',
    },
    {
      title: t('tour.chatbot.title'),
      desc: t('tour.chatbot.desc'),
      selector: '[data-tour="chatbot-fab"]',
      position: 'left-top',
    },
    {
      title: t('tour.finish.title'),
      desc: t('tour.finish.desc'),
      selector: null,
      position: 'center',
    },
  ];

  const currentStepData = steps[onboardingStep];

  useEffect(() => {
    if (!onboardingActive || !currentStepData?.selector) {
      // Reset stale spotlight coordinates when the tour switches to a centered step.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTargetRect(null);
      return;
    }

    const updatePosition = () => {
      const el = document.querySelector(currentStepData.selector);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    const interval = setInterval(updatePosition, 100);

    return () => {
      window.removeEventListener('resize', updatePosition);
      clearInterval(interval);
    };
  }, [onboardingActive, onboardingStep, currentStepData?.selector]);

  if (!onboardingActive) return null;

  const handleNext = () => {
    if (onboardingStep < steps.length - 1) {
      nextStep();
    } else {
      stopOnboarding();
    }
  };

  const getTooltipStyle = () => {
    const style = {
      position: 'fixed',
      zIndex: 55, // higher than topbar and panels
    };

    if (!targetRect || currentStepData.position === 'center') {
      style.top = '50%';
      style.left = '50%';
      style.transform = 'translate(-50%, -50%)';
      return style;
    }

    const space = 14;
    const pos = currentStepData.position;
    
    // Set a safe maximum width for the tooltip box
    const tooltipWidth = Math.min(380, window.innerWidth - 32);
    
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
      style.top = '50%';
      style.left = '50%';
      style.transform = 'translate(-50%, -50%)';
      return style;
    }

    // Clamp coordinates to keep the tooltip fully visible on screen
    const padding = 16;
    left = Math.max(padding, Math.min(window.innerWidth - tooltipWidth - padding, left));
    top = Math.max(padding, Math.min(window.innerHeight - 320 - padding, top));

    style.top = `${top}px`;
    style.left = `${left}px`;
    style.width = `${tooltipWidth}px`;

    return style;
  };

  return (
    <div className="fixed inset-0 z-40 overflow-hidden select-none">
      {/* 1. Backdrop overlay with mask */}
      <svg className="absolute inset-0 pointer-events-none w-screen h-screen">
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - 6}
                y={targetRect.top - 6}
                width={targetRect.width + 12}
                height={targetRect.height + 12}
                rx={12}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(8, 6, 4, 0.72)"
          mask="url(#spotlight-mask)"
          className="transition-all duration-300"
        />
      </svg>

      {/* 2. Highlight borders around active selector */}
      {targetRect && (
        <div
          className="pointer-events-none fixed border border-accent/60 rounded-2xl shadow-[0_0_24px_rgba(212,149,106,0.3)] z-40 transition-all duration-300"
          style={{
            top: `${targetRect.top - 6}px`,
            left: `${targetRect.left - 6}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
          }}
        />
      )}

      {/* 3. Floating Tooltip Box */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`tour-step-${onboardingStep}`}
          initial={{ opacity: 0, scale: 0.94, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 10 }}
          transition={{ type: 'spring', damping: 24, stiffness: 260 }}
          style={getTooltipStyle()}
          className="glass-strong w-full max-w-sm rounded-2xl p-5 shadow-2xl border border-white/12"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={stopOnboarding}
            aria-label={t('accessibility.close')}
            className="absolute right-3 top-3 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-white/8 hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-accent/20 bg-accent/10">
              <Sparkles className="h-4 w-4 text-accent animate-pulse" />
            </div>
            <h3 className="font-display text-sm font-semibold text-text-primary">
              {currentStepData.title}
            </h3>
          </div>

          {/* Body */}
          <p className="text-xs leading-relaxed text-text-secondary mb-5">
            {currentStepData.desc}
          </p>

          {/* Footer Controls */}
          <div className="flex items-center justify-between border-t border-white/6 pt-4">
            <span className="text-[10px] text-text-muted font-medium">
              {onboardingStep + 1} {t('tour.stepOf')} {steps.length}
            </span>

            <div className="flex items-center gap-2">
              {onboardingStep > 0 ? (
                <Button
                  onClick={prevStep}
                  variant="outline"
                  size="sm"
                  className="h-8 text-[11px] font-semibold py-1 px-2.5 flex items-center gap-1 border border-white/8 hover:bg-white/6"
                >
                  <ChevronLeft className="h-3 w-3" />
                  {t('tour.back')}
                </Button>
              ) : (
                <Button
                  onClick={stopOnboarding}
                  variant="ghost"
                  size="sm"
                  className="h-8 text-[11px] font-semibold py-1 px-2.5 text-text-muted hover:text-text-primary"
                >
                  {t('tour.skip')}
                </Button>
              )}

              <Button
                onClick={handleNext}
                variant="accent"
                size="sm"
                className="h-8 text-[11px] font-semibold py-1 px-3 flex items-center gap-1 shadow-[0_0_12px_rgba(212,149,106,0.15)]"
              >
                <span>
                  {onboardingStep === steps.length - 1
                    ? t('tour.getStarted')
                    : t('tour.next')}
                </span>
                {onboardingStep < steps.length - 1 && (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
