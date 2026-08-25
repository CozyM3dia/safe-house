/**
 * Geometri murni CircularTestimonials — dipisah dari React supaya bisa
 * dites tanpa DOM (pola node:assert seperti standards.test.mjs).
 */

export function calculateGap(width) {
  const minWidth = 1024;
  const maxWidth = 1456;
  const minGap = 60;
  const maxGap = 86;
  if (width <= minWidth) return minGap;
  if (width >= maxWidth) return Math.max(minGap, maxGap + 0.06018 * (width - maxWidth));
  return minGap + (maxGap - minGap) * ((width - minWidth) / (maxWidth - minWidth));
}

export function circularOffset(index, activeIndex, length) {
  return (((index - activeIndex) % length) + length) % length;
}

export function slideRole(index, activeIndex, length) {
  const offset = circularOffset(index, activeIndex, length);
  if (offset === 0) return 'active';
  // Cek kiri dulu: dengan 2 item, satu slide adalah tetangga kiri sekaligus
  // kanan — komponen sumber memprioritaskan kiri.
  if (offset === length - 1) return 'left';
  if (offset === 1) return 'right';
  return 'hidden';
}

export function slideStyle(role, gap) {
  const transition = 'all 0.8s cubic-bezier(.4,2,.3,1)';
  const maxStickUp = gap * 0.8;
  switch (role) {
    case 'active':
      return {
        zIndex: 3,
        opacity: 1,
        pointerEvents: 'auto',
        transform: 'translateX(0px) translateY(0px) scale(1) rotateY(0deg)',
        transition,
      };
    case 'left':
      return {
        zIndex: 2,
        opacity: 1,
        pointerEvents: 'auto',
        transform: `translateX(-${gap}px) translateY(-${maxStickUp}px) scale(0.85) rotateY(15deg)`,
        transition,
      };
    case 'right':
      return {
        zIndex: 2,
        opacity: 1,
        pointerEvents: 'auto',
        transform: `translateX(${gap}px) translateY(-${maxStickUp}px) scale(0.85) rotateY(-15deg)`,
        transition,
      };
    default:
      return { zIndex: 1, opacity: 0, pointerEvents: 'none', transition };
  }
}
