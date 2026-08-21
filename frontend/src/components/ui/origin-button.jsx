"use client";

import * as React from 'react';
import { motion, useReducedMotion } from 'motion/react';

import { cn } from '@/lib/utils';

/**
 * Tombol dengan tinta yang mengembang dari titik sentuh.
 *
 * Port dari OriginButton. Dua hal dari versi aslinya sengaja tidak dibawa:
 *
 * 1. Blok `componentThemeClassName` — ia menimpa `--color-accent`,
 *    `--color-border`, `--color-muted`, dan belasan token lain dengan palet
 *    biru-langit/abu netral. Di produk ini palet Mocha adalah bagian merek,
 *    jadi warna diambil dari dua variabel yang diisi pemakai:
 *    `--ob-fill` (warna tinta) dan `--ob-fill-fg` (warna teks saat tertutup
 *    tinta). Sisanya diserahkan ke className.
 *
 * 2. Varian `dark:` — `darkMode` tidak diset di tailwind.config.js, jadi
 *    Tailwind memakai default `media` (prefers-color-scheme). Tema aplikasi
 *    ini justru berpindah lewat `html[data-theme]`, sehingga setiap `dark:`
 *    akan mengikuti setelan sistem dan lepas dari tombol tema.
 */

const FILL_DURATION = 0.5;
const FILL_EASE = [0.16, 1, 0.3, 1];

/** Diameter lingkaran terkecil yang menutupi tombol dari titik (x, y). */
function getCoverDiameter(width, height, x, y) {
  return Math.ceil(
    2 *
      Math.max(
        Math.hypot(x, y),
        Math.hypot(width - x, y),
        Math.hypot(x, height - y),
        Math.hypot(width - x, height - y)
      )
  );
}

function assignRef(ref, value) {
  if (typeof ref === 'function') {
    ref(value);
    return;
  }
  if (ref) ref.current = value;
}

function hasTextContent(node) {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node).trim().length > 0;
  }
  if (Array.isArray(node)) return node.some(hasTextContent);
  if (React.isValidElement(node)) return hasTextContent(node.props.children);
  return false;
}

const OriginButton = React.forwardRef(function OriginButton(
  {
    children,
    className,
    disabled = false,
    loading = false,
    type = 'button',
    onBlur,
    onClick,
    onFocus,
    onKeyDown,
    onKeyUp,
    onPointerCancel,
    onPointerDown,
    onPointerEnter,
    onPointerLeave,
    onPointerUp,
    ...props
  },
  ref
) {
  const buttonRef = React.useRef(null);
  const isDisabled = Boolean(disabled || loading);
  const reduceMotion = useReducedMotion();
  const [hovered, setHovered] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);
  const [origin, setOrigin] = React.useState({ x: 0, y: 0 });
  const [coverSize, setCoverSize] = React.useState(0);

  const ariaLabel = props['aria-label'];
  const ariaLabelledBy = props['aria-labelledby'];

  React.useEffect(() => {
    if (import.meta.env.PROD) return;
    if (hasTextContent(children) || ariaLabel?.trim() || ariaLabelledBy?.trim()) return;
    console.warn(
      'OriginButton: provide visible label text or aria-label / aria-labelledby so the control has an accessible name.'
    );
  }, [ariaLabel, ariaLabelledBy, children]);

  const updateOrigin = React.useCallback((x, y) => {
    const node = buttonRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    setOrigin({ x, y });
    setCoverSize(getCoverDiameter(rect.width, rect.height, x, y));
  }, []);

  const updateOriginFromPointer = React.useCallback(
    (event) => {
      const rect = event.currentTarget.getBoundingClientRect();
      updateOrigin(event.clientX - rect.left, event.clientY - rect.top);
    },
    [updateOrigin]
  );

  const updateOriginFromCenter = React.useCallback(() => {
    const node = buttonRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    updateOrigin(rect.width / 2, rect.height / 2);
  }, [updateOrigin]);

  const showFill = !isDisabled && (hovered || isPressed);

  // Lebar tombol berubah saat label berganti bahasa dan saat webfont selesai
  // dimuat; tanpa pengukuran ulang, lingkaran tinta berhenti menutupi sudut.
  React.useLayoutEffect(() => {
    const node = buttonRef.current;
    if (!(node && showFill)) return undefined;

    const measure = () => {
      const rect = node.getBoundingClientRect();
      setCoverSize(getCoverDiameter(rect.width, rect.height, origin.x, origin.y));
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(node);

    const { fonts } = document;
    if (fonts?.ready) fonts.ready.then(measure).catch(() => undefined);

    return () => observer.disconnect();
  }, [showFill, origin.x, origin.y]);

  const setMergedRef = React.useCallback(
    (node) => {
      buttonRef.current = node;
      assignRef(ref, node);
    },
    [ref]
  );

  return (
    <motion.button
      {...props}
      aria-busy={loading || undefined}
      className={cn(
        'relative inline-flex h-11 cursor-pointer touch-manipulation select-none items-center',
        'justify-center overflow-hidden rounded-xl px-5 text-[13px] font-semibold',
        'transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
        'disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      data-pressed={isPressed ? 'true' : 'false'}
      disabled={isDisabled}
      onBlur={(event) => {
        onBlur?.(event);
        setIsPressed(false);
        if (!event.defaultPrevented) setHovered(false);
      }}
      onClick={onClick}
      onFocus={(event) => {
        onFocus?.(event);
        if (isDisabled || event.defaultPrevented) return;
        if (event.currentTarget.matches(':focus-visible')) {
          updateOriginFromCenter();
          setHovered(true);
        }
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (
          event.defaultPrevented ||
          isDisabled ||
          event.repeat ||
          (event.key !== ' ' && event.key !== 'Enter')
        ) {
          return;
        }
        if (event.key === ' ') event.preventDefault();
        updateOriginFromCenter();
        setIsPressed(true);
        setHovered(true);
      }}
      onKeyUp={(event) => {
        onKeyUp?.(event);
        if (event.key === ' ' || event.key === 'Enter') {
          setIsPressed(false);
          if (!event.currentTarget.matches(':focus-visible')) setHovered(false);
        }
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event);
        setIsPressed(false);
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (event.defaultPrevented || isDisabled || event.button !== 0) return;
        updateOriginFromPointer(event);
        setIsPressed(true);
        setHovered(true);
      }}
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        if (isDisabled || event.defaultPrevented) return;
        updateOriginFromPointer(event);
        setHovered(true);
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event);
        setHovered(false);
        setIsPressed(false);
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        setIsPressed(false);
      }}
      ref={setMergedRef}
      style={showFill ? { color: 'var(--ob-fill-fg)', ...props.style } : props.style}
      type={type}
      whileTap={isDisabled || reduceMotion ? undefined : { scale: 0.985 }}
    >
      <motion.span
        animate={{ scale: showFill && coverSize > 0 ? 1 : 0 }}
        aria-hidden
        className="pointer-events-none absolute rounded-full"
        initial={false}
        // Versi aslinya memusatkan lingkaran dengan `-translate-x/y-1/2`. Itu
        // hanya bekerja di Tailwind v4, yang mengompilasinya ke properti
        // `translate` terpisah. Proyek ini memakai v3, yang menaruhnya di
        // `transform` — properti yang sama yang ditulis Motion untuk `scale`,
        // sehingga pemusatannya tertimpa dan tintanya mengembang dari sudut
        // kanan-bawah. Offset dihitung di `left`/`top` supaya bebas transform.
        style={{
          background: 'var(--ob-fill)',
          height: coverSize,
          left: origin.x - coverSize / 2,
          top: origin.y - coverSize / 2,
          width: coverSize,
        }}
        // Dengan gerak dikurangi, tintanya berganti tanpa animasi mengembang —
        // isyaratnya tetap ada, sapuannya tidak.
        transition={reduceMotion ? { duration: 0 } : { duration: FILL_DURATION, ease: FILL_EASE }}
      />
      <span className="relative z-10 inline-flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
});

export { OriginButton };
