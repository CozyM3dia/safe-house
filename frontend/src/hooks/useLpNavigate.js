import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * navigate dengan View Transition (React Router v7: opsi viewTransition).
 * RR membungkus update route di document.startViewTransition() — browser
 * tanpa View Transitions API otomatis fallback ke swap biasa tanpa error.
 * Mitigasi prefers-reduced-motion ditangani global via CSS
 * (::view-transition-* di-matikan) sehingga hook ini tidak perlu cek media.
 *
 * Hanya untuk navigasi keluar/masuk landing (v2); /app memakai navigate
 * polos miliknya sendiri.
 */
export function useLpNavigate() {
  const navigate = useNavigate();
  return useCallback((to, opts) => navigate(to, { viewTransition: true, ...opts }), [navigate]);
}
