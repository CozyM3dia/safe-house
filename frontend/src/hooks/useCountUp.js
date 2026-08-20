import { useEffect, useRef, useState } from 'react';

import { shouldSkipCountUp } from '../lib/utils';

/**
 * Animasi angka naik dari 0 ke `end`.
 *
 * Animasi digerakkan requestAnimationFrame, yang berhenti total saat dokumen
 * tersembunyi. Pada laporan risiko yang bisa dibagikan publik, angka yang
 * membeku di 0 bukan sekadar animasi belum selesai — "0/100" terbaca sebagai
 * skor yang sebenarnya dan itu menyesatkan. Karena itu ada dua penjagaan:
 *
 * 1. Saat mount, bila requestAnimationFrame memang tak akan berjalan (tab
 *    latar belakang, crawler, layanan screenshot, atau prefers-reduced-motion),
 *    nilai akhir langsung dipakai tanpa animasi.
 * 2. Bila dokumen menjadi tersembunyi di tengah animasi, animasi dihentikan
 *    dan nilai akhir langsung dipasang — tanpa ini angkanya membeku di posisi
 *    terakhir, yang bisa saja masih 0.
 */
export function useCountUp(end, duration = 1500, decimals = 0) {
  const skip = shouldSkipCountUp();
  const [current, setCurrent] = useState(() => (skip ? end : 0));
  const rafRef = useRef();
  const doneRef = useRef(skip);

  useEffect(() => {
    if (skip) return undefined;

    let startTime = null;
    const factor = Math.pow(10, decimals);

    const settle = () => {
      doneRef.current = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setCurrent(end);
    };

    const animate = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * end * factor) / factor);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        doneRef.current = true;
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden && !doneRef.current) settle();
    };

    doneRef.current = false;
    rafRef.current = requestAnimationFrame(animate);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [end, duration, decimals, skip]);

  // `end` bisa berubah setelah mount; kembalikan nilai akhir langsung supaya
  // tidak perlu memanggil setState di dalam effect.
  return skip ? end : current;
}
