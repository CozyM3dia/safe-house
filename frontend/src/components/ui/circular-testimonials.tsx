import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { calculateGap, slideRole, slideStyle } from '@/lib/testimonialLayout';
import { cn } from '@/lib/utils';

export interface Testimonial {
  quote: string;
  name: string;
  designation: string;
  src: string;
}

export interface Colors {
  name?: string;
  designation?: string;
  testimony?: string;
  arrowBackground?: string;
  arrowForeground?: string;
  arrowHoverBackground?: string;
}

export interface FontSizes {
  name?: string;
  designation?: string;
  quote?: string;
}

export interface CircularTestimonialsProps {
  testimonials: Testimonial[];
  autoplay?: boolean;
  colors?: Colors;
  fontSizes?: FontSizes;
  className?: string;
}

const AUTOPLAY_MS = 5000;

/**
 * Carousel testimoni melingkar (3 slide terlihat: kiri, tengah, kanan).
 * Adaptasi untuk Vite + palet Mocha:
 * - <style jsx> Next.js diganti class lp-tst-* di landing-v2.css.
 * - Ikon panah memakai lucide-react (react-icons tidak ada di proyek).
 * - Default warna mengikuti token --lp-* sehingga ikut tema gelap/terang.
 * - Autoplay berhenti permanen saat pengguna bernavigasi manual dan
 *   tidak jalan bila prefers-reduced-motion.
 */
export const CircularTestimonials = ({
  testimonials,
  autoplay = true,
  colors = {},
  fontSizes = {},
  className,
}: CircularTestimonialsProps) => {
  const colorName = colors.name ?? 'var(--lp-mocha)';
  const colorDesignation = colors.designation ?? 'var(--lp-clay)';
  const colorTestimony = colors.testimony ?? 'var(--lp-umber)';
  const colorArrowBg = colors.arrowBackground ?? 'var(--lp-copper)';
  const colorArrowFg = colors.arrowForeground ?? '#14100b';
  const colorArrowHoverBg = colors.arrowHoverBackground ?? 'var(--lp-copper-deep)';
  const fontSizeName = fontSizes.name ?? '1.5rem';
  const fontSizeDesignation = fontSizes.designation ?? '0.925rem';
  const fontSizeQuote = fontSizes.quote ?? '1.125rem';

  const reduceMotion = useReducedMotion();

  const [activeIndex, setActiveIndex] = useState(0);
  const [hoverPrev, setHoverPrev] = useState(false);
  const [hoverNext, setHoverNext] = useState(false);
  const [containerWidth, setContainerWidth] = useState(1200);

  const imageContainerRef = useRef<HTMLDivElement>(null);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const testimonialsLength = useMemo(() => testimonials.length, [testimonials]);
  const activeTestimonial = useMemo(
    () => testimonials[activeIndex],
    [activeIndex, testimonials]
  );

  useEffect(() => {
    function handleResize() {
      if (imageContainerRef.current) {
        setContainerWidth(imageContainerRef.current.offsetWidth);
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const stopAutoplay = useCallback(() => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }
  }, []);

  useEffect(() => {
    stopAutoplay();
    if (!autoplay || reduceMotion || testimonialsLength < 2) return undefined;
    autoplayRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonialsLength);
    }, AUTOPLAY_MS);
    return stopAutoplay;
  }, [autoplay, reduceMotion, testimonialsLength, stopAutoplay]);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % testimonialsLength);
    stopAutoplay();
  }, [testimonialsLength, stopAutoplay]);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + testimonialsLength) % testimonialsLength);
    stopAutoplay();
  }, [testimonialsLength, stopAutoplay]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        e.altKey ||
        e.ctrlKey ||
        e.metaKey ||
        (target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT' ||
            target.isContentEditable))
      ) {
        return;
      }
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handlePrev, handleNext]);

  function getImageStyle(index: number): React.CSSProperties {
    const gap = calculateGap(containerWidth);
    const role = slideRole(index, activeIndex, testimonialsLength);
    return slideStyle(role, gap) as React.CSSProperties;
  }

  const quoteVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <div
      className={cn('lp-tst', className)}
      aria-roledescription="carousel"
      aria-label="Testimoni pengguna"
    >
      <div className="lp-tst-grid">
        <div className="lp-tst-images" ref={imageContainerRef}>
          {testimonials.map((testimonial, index) => (
            <img
              key={testimonial.src}
              src={testimonial.src}
              alt={testimonial.name}
              loading="lazy"
              className="lp-tst-img"
              data-index={index}
              style={getImageStyle(index)}
            />
          ))}
        </div>
        <div className="lp-tst-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              variants={quoteVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <h3 className="lp-tst-name" style={{ color: colorName, fontSize: fontSizeName }}>
                {activeTestimonial.name}
              </h3>
              <p
                className="lp-tst-role"
                style={{ color: colorDesignation, fontSize: fontSizeDesignation }}
              >
                {activeTestimonial.designation}
              </p>
              <motion.p
                className="lp-tst-quote"
                style={{ color: colorTestimony, fontSize: fontSizeQuote }}
              >
                {activeTestimonial.quote.split(' ').map((word, i) => (
                  <motion.span
                    key={i}
                    initial={{ filter: 'blur(10px)', opacity: 0, y: 5 }}
                    animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.22,
                      ease: 'easeInOut',
                      delay: reduceMotion ? 0 : 0.025 * i,
                    }}
                    style={{ display: 'inline-block' }}
                  >
                    {word}&nbsp;
                  </motion.span>
                ))}
              </motion.p>
            </motion.div>
          </AnimatePresence>
          <div className="lp-tst-arrows">
            <button
              type="button"
              className="lp-tst-arrow"
              onClick={handlePrev}
              style={{
                backgroundColor: hoverPrev ? colorArrowHoverBg : colorArrowBg,
              }}
              onMouseEnter={() => setHoverPrev(true)}
              onMouseLeave={() => setHoverPrev(false)}
              aria-label="Testimoni sebelumnya"
            >
              <ArrowLeft size={20} color={colorArrowFg} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="lp-tst-arrow"
              onClick={handleNext}
              style={{
                backgroundColor: hoverNext ? colorArrowHoverBg : colorArrowBg,
              }}
              onMouseEnter={() => setHoverNext(true)}
              onMouseLeave={() => setHoverNext(false)}
              aria-label="Testimoni berikutnya"
            >
              <ArrowRight size={20} color={colorArrowFg} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CircularTestimonials;
