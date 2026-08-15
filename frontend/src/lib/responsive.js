export const COMPACT_VIEWPORT_MAX = 767;

export function isCompactViewport(width) {
  return width <= COMPACT_VIEWPORT_MAX;
}
