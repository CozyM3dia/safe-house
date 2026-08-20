export function isNarrowViewport() {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches;
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
