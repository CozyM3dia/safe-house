import { useEffect, useRef } from 'react';

/**
 * Kursor landing "Surveyor's Reticle".
 *
 * Titik tembaga presisi + bingkai bidik sudut (viewfinder) yang tertinggal
 * dengan lerp. Di atas elemen interaktif bingkai mengunci: membesar dan
 * berputar 45 jadi diamond. Klik memicu pulse cincin-scan — gema motif
 * scan-ring MapMarker di app. Nonaktif untuk perangkat sentuh dan
 * reduced-motion. Deteksi area gelap mengikuti .lp-footer landing v2.
 */
const INTERACTIVE = 'a, button, [role="button"], label, summary';
const NATIVE_FIELDS = 'input, textarea, select, [contenteditable="true"]';
const DARK_AREA = '.lp-footer, [data-theme="dark"]';

export default function LandingCursor() {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    const lp = host?.closest('.lp');
    if (!host || !lp) return undefined;

    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!finePointer.matches || reducedMotion.matches) return undefined;

    const dot = host.querySelector('[data-lp-dot]');
    const reticle = host.querySelector('[data-lp-reticle]');
    const pulse = host.querySelector('[data-lp-pulse]');
    if (!dot || !reticle || !pulse) return undefined;

    let raf = 0;
    let live = false;
    let tx = -100;
    let ty = -100;
    let dX = tx;
    let dY = ty;
    let rX = tx;
    let rY = ty;

    const wake = () => {
      if (live) return;
      live = true;
      lp.classList.add('lp-cursor-on');
      host.classList.add('is-visible');
    };
    const sleep = () => {
      live = false;
      lp.classList.remove('lp-cursor-on');
      host.classList.remove('is-visible');
    };

    const onMove = (e) => {
      tx = e.clientX;
      ty = e.clientY;
      wake();
    };

    const onOver = (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      const field = t.closest(NATIVE_FIELDS);
      host.classList.toggle('is-field', Boolean(field));
      host.classList.toggle('is-target', !field && Boolean(t.closest(INTERACTIVE)));
      host.classList.toggle('is-dark', Boolean(t.closest(DARK_AREA)));
    };

    const onDown = (e) => {
      host.classList.add('is-press');
      pulse.style.left = `${e.clientX}px`;
      pulse.style.top = `${e.clientY}px`;
      pulse.classList.remove('is-live');
      void pulse.offsetWidth;
      pulse.classList.add('is-live');
    };

    const onUp = () => host.classList.remove('is-press');

    const onOut = (e) => {
      if (!e.relatedTarget) sleep();
    };

    const frame = () => {
      dX += (tx - dX) * 0.55;
      dY += (ty - dY) * 0.55;
      rX += (tx - rX) * 0.17;
      rY += (ty - rY) * 0.17;
      dot.style.transform = `translate3d(${dX}px, ${dY}px, 0)`;
      reticle.style.transform = `translate3d(${rX}px, ${rY}px, 0)`;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    document.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseover', onOver, { passive: true });
    document.addEventListener('mousedown', onDown);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('mouseout', onOut, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('mouseout', onOut);
      lp.classList.remove('lp-cursor-on');
    };
  }, []);

  return (
    <div ref={hostRef} className="lp-cursor" aria-hidden="true">
      <div className="lp-cursor-layer" data-lp-dot>
        <span className="lp-cursor-dot" />
      </div>
      <div className="lp-cursor-layer" data-lp-reticle>
        <span className="lp-cursor-frame">
          <i />
          <i />
          <i />
          <i />
        </span>
      </div>
      <span className="lp-cursor-pulse" data-lp-pulse />
    </div>
  );
}
