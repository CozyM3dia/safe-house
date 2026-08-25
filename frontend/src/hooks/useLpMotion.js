import { useEffect, useRef, useState } from 'react';

/**
 * useLpReveal, primitif reveal halaman landing v2.
 *
 * Satu pola IntersectionObserver untuk SEMUA section (threshold 0.2,
 * sekali jalan lalu berhenti memantau). Elemen diberi class `lp-in`
 * dan CSS (landing-v2.css) yang mengurus transisinya, JS hanya
 * menyalakan state, durasi/easing/stagger hidup di token CSS.
 *
 * reduced-motion tidak perlu dicek di sini: CSS media query sudah
 * memaksa state akhir (opacity 1, transform none) tanpa transisi.
 *
 * Pemakaian:
 *   const ref = useLpReveal();
 *   <section ref={ref}> ... <div className="lp-reveal" style={{'--lp-delay':'140ms'}}>
 *
 * Atau untuk banyak elemen sekaligus (stagger otomatis):
 *   const { rootRef, inView } = useLpInView();
 *   <div ref={rootRef}> {items.map((it,i)=>(
 *     <div className={`lp-reveal ${inView?'lp-in':''}`} style={{'--lp-delay':`${i*70}ms`}}/>))}
 */
export function useLpReveal(options = {}) {
  const { threshold = 0.2, rootMargin = '0px 0px -8% 0px' } = options;
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    // Konten harus terbaca walau observer gagal (mis. browser lawas).
    if (typeof IntersectionObserver === 'undefined') {
      const id = setTimeout(() => setInView(true), 0);
      return () => clearTimeout(id);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect(); // sekali jalan, tidak repeat
          }
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);

    // Fallback tahan-gagal (dua lapis):
    // 1. setTimeout, menangani elemen yang SUDAH di viewport saat mount
    //    di window occluded (IO callback bisa tertunda tanpa batas).
    // 2. Scroll/resize listener, di window yang compositor-nya dibekukan
    //    (backgrounded/occluded), callback IntersectionObserver tidak pernah
    //    menyala walau elemen masuk viewport, padahal main thread tetap
    //    jalan. Pemeriksaan rect pada event scroll menjamin reveal tetap
    //    terjadi. Listener dibuang begitu reveal menyala.
    let pending = 0;
    const checkNow = () => {
      pending = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      if (rect.top < vh * 1.05 && rect.bottom > -40) {
        setInView(true);
        observer.disconnect();
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
      }
    };
    const onScroll = () => {
      if (!pending) pending = setTimeout(checkNow, 120);
    };
    const failsafe = setTimeout(checkNow, 1200);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      observer.disconnect();
      clearTimeout(failsafe);
      if (pending) clearTimeout(pending);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [threshold, rootMargin]);

  return [ref, inView];
}

/**
 * Varian untuk root container: mengembalikan ref + status inView,
 * dipakai section yang mengoordinasi banyak anak ber-stagger.
 */
export function useLpInView(options = {}) {
  const [ref, inView] = useLpReveal(options);
  return { rootRef: ref, inView };
}

/**
 * useLpParallax, kedalaman lanskap hero yang SANGAT halus.
 * Menggeser elemen dekoratif mengikuti scroll (maks ±amplitudo kecil),
 * dinonaktifkan penuh pada prefers-reduced-motion dan layar sentuh
 * (hemat GPU mobile). Menggunakan rAF + transform, tanpa layout shift.
 */
export function useLpParallax(strength = 0.08) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    if (reduced || coarse) return undefined;

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // progress -1..1 relatif posisi elemen di viewport
      const progress = Math.max(-1, Math.min(1, (rect.top + rect.height / 2) / vh - 0.5));
      el.style.transform = `translate3d(0, ${(-progress * strength * 100).toFixed(2)}px, 0)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [strength]);

  return ref;
}
