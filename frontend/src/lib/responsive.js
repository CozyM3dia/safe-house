export function isNarrowViewport() {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches;
}

/**
 * Perangkat / jaringan yang tidak boleh menjalankan media mahal:
 * video hero, WebGL backdrop, Three.js rail, tile Leaflet di mockup.
 * Ponsel selalu lite. Desktop hanya lite saat Save-Data, 2G, atau
 * prefers-reduced-motion.
 */
export function prefersLiteMedia() {
  if (typeof window === 'undefined') return true;
  try {
    const connection = navigator.connection;
    const saveData = Boolean(connection?.saveData);
    const slow = ['slow-2g', '2g'].includes(connection?.effectiveType || '');
    const phone = window.matchMedia('(max-width: 767px)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return saveData || slow || phone || reduce;
  } catch {
    return true;
  }
}

/** Video hero hanya di desktop lebar, tanpa mode lite. */
export function prefersHeroVideo() {
  if (typeof window === 'undefined') return false;
  try {
    return !prefersLiteMedia() && window.matchMedia('(min-width: 1024px)').matches;
  } catch {
    return false;
  }
}

export function getViewportHeight() {
  if (typeof window === 'undefined') return 0;
  return Math.round(window.visualViewport?.height || window.innerHeight || 0);
}

export function subscribeToViewport(callback) {
  if (typeof window === 'undefined') return () => {};

  const viewport = window.visualViewport;
  const notify = () => callback({
    width: Math.round(viewport?.width || window.innerWidth),
    height: getViewportHeight(),
  });

  window.addEventListener('resize', notify, { passive: true });
  window.addEventListener('orientationchange', notify, { passive: true });
  viewport?.addEventListener('resize', notify, { passive: true });
  viewport?.addEventListener('scroll', notify, { passive: true });
  notify();

  return () => {
    window.removeEventListener('resize', notify);
    window.removeEventListener('orientationchange', notify);
    viewport?.removeEventListener('resize', notify);
    viewport?.removeEventListener('scroll', notify);
  };
}
