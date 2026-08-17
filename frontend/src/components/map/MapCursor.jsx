import { useEffect, useState, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';

export function MapCursor() {
  const map = useMap();
  const [pos, setPos] = useState(null);
  const [coords, setCoords] = useState(null);
  const [visible, setVisible] = useState(false);
  const pendingAudit = useAppStore((s) => s.pendingAudit);
  const auditDrawerOpen = useAppStore((s) => s.auditDrawerOpen);
  const cmdPaletteOpen = useAppStore((s) => s.cmdPaletteOpen);
  const animRef = useRef(null);

  useEffect(() => {
    if (!map) return;
    const container = map.getContainer();
    if (!container) return;

    // Apply precision crosshair cursor to Leaflet map container
    container.classList.add('safe-map-crosshair');

    const handleMouseMove = (e) => {
      // If hovering over any floating UI controls/dialogs/panels, hide the custom reticle
      const target = e.target;
      if (
        target.closest('.glass') ||
        target.closest('button') ||
        target.closest('[role="dialog"]') ||
        target.closest('[data-tour]') ||
        target.closest('.leaflet-control') ||
        target.closest('.pointer-events-auto')
      ) {
        setVisible(false);
        return;
      }

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (x < 0 || x > rect.width || y < 0 || y > rect.height) {
        setVisible(false);
        return;
      }

      if (animRef.current) cancelAnimationFrame(animRef.current);
      animRef.current = requestAnimationFrame(() => {
        setPos({ x, y });
        try {
          const latlng = map.containerPointToLatLng([x, y]);
          setCoords({
            lat: latlng.lat.toFixed(4),
            lng: latlng.lng.toFixed(4),
          });
        } catch {
          // ignore outside bounds
        }
        setVisible(true);
      });
    };

    const handleMouseLeave = () => {
      setVisible(false);
    };

    container.addEventListener('mousemove', handleMouseMove, { passive: true });
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.classList.remove('safe-map-crosshair');
    };
  }, [map]);

  const isModalActive = Boolean(pendingAudit || auditDrawerOpen || cmdPaletteOpen);
  const shouldShow = visible && pos && !isModalActive;

  return (
    <div className="pointer-events-none absolute inset-0 z-[15] overflow-hidden">
      <AnimatePresence>
        {shouldShow && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.1, ease: 'easeOut' }}
            style={{
              transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
              willChange: 'transform',
            }}
            className="absolute -left-[12px] -top-[12px] h-[24px] w-[24px]"
          >
            {/* ── Subtle low-profile ring ── */}
            <div className="absolute inset-[2px] rounded-full border border-black/70 drop-shadow-[0_0_1px_#ffffff]" />

            {/* ── Precision center dot ── */}
            <div className="absolute left-1/2 top-1/2 h-[3.5px] w-[3.5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-black ring-1 ring-white shadow-sm" />

            {/* ── Sleek low-profile coordinate pill ── */}
            {coords && (
              <div className="absolute left-[16px] top-[14px] flex items-center gap-1 whitespace-nowrap rounded border border-white/20 bg-black/90 px-1.5 py-0.5 shadow-md backdrop-blur-md">
                <span className="h-1 w-1 rounded-full bg-accent animate-pulse" />
                <span className="font-mono text-[8px] font-semibold tracking-wide text-white">
                  {coords.lat}°, {coords.lng}°
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
