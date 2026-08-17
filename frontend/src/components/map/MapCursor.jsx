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
      // If hovering over any UI controls/dialogs/panels, hide the custom reticle
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
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
              willChange: 'transform',
            }}
            className="absolute -left-[20px] -top-[20px] h-[40px] w-[40px]"
          >
            {/* ── Outer glowing dashed ring ── */}
            <div className="absolute inset-0 rounded-full border border-accent/40 animate-[spin_12s_linear_infinite]" style={{ borderStyle: 'dashed' }} />

            {/* ── Precision HUD corner brackets ── */}
            <div className="absolute left-[3px] top-[3px] h-[6px] w-[6px] border-l-2 border-t-2 border-accent" />
            <div className="absolute right-[3px] top-[3px] h-[6px] w-[6px] border-r-2 border-t-2 border-accent" />
            <div className="absolute bottom-[3px] left-[3px] h-[6px] w-[6px] border-b-2 border-l-2 border-accent" />
            <div className="absolute bottom-[3px] right-[3px] h-[6px] w-[6px] border-b-2 border-r-2 border-accent" />

            {/* ── Crosshair guide ticks ── */}
            <div className="absolute left-1/2 top-0 h-[5px] w-[1px] -translate-x-1/2 bg-accent/80" />
            <div className="absolute bottom-0 left-1/2 h-[5px] w-[1px] -translate-x-1/2 bg-accent/80" />
            <div className="absolute left-0 top-1/2 h-[1px] w-[5px] -translate-y-1/2 bg-accent/80" />
            <div className="absolute right-0 top-1/2 h-[1px] w-[5px] -translate-y-1/2 bg-accent/80" />

            {/* ── Center pinpoint dot with glow pulse ── */}
            <div className="absolute left-1/2 top-1/2 h-[5px] w-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_8px_#d4956a]" />
            <div className="absolute left-1/2 top-1/2 h-[14px] w-[14px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/50 animate-ping opacity-30" />

            {/* ── Real-time Coordinate Readout Pill ── */}
            {coords && (
              <div className="absolute left-[28px] top-[24px] flex items-center gap-1.5 whitespace-nowrap rounded-md border border-accent/25 bg-bg/90 px-2 py-0.5 shadow-glass-md backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                <span className="font-mono text-[9px] font-semibold tracking-wider text-text-primary">
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
