import { useEffect, useState, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, targetSlotFor } from '../../store/useAppStore';

export function MapCursor() {
  const map = useMap();
  const [pos, setPos] = useState(null);
  const [coords, setCoords] = useState(null);
  const [visible, setVisible] = useState(false);
  const pendingAudit = useAppStore((s) => s.pendingAudit);
  const auditDrawerOpen = useAppStore((s) => s.auditDrawerOpen);
  const cmdPaletteOpen = useAppStore((s) => s.cmdPaletteOpen);
  const mode = useAppStore((s) => s.mode);
  const armedSlot = useAppStore((s) => s.armedSlot);
  const propertyA = useAppStore((s) => s.propertyA);
  const propertyB = useAppStore((s) => s.propertyB);
  const animRef = useRef(null);

  // Ditempelkan ke reticle supaya niat klik terbaca di titik perhatian
  // pengguna, bukan cuma di panel kiri.
  const targetSlot = targetSlotFor({ mode, propertyA, propertyB, armedSlot });

  useEffect(() => {
    if (!map) return;
    const container = map.getContainer();
    if (!container) return;

    // Apply precision crosshair cursor to Leaflet map container
    container.classList.add('safe-map-crosshair');

    let isMouseDown = false;

    const onMouseDown = (e) => {
      if (e.button === 0) {
        isMouseDown = true;
        container.classList.add('safe-map-dragging');
        document.body.classList.add('safe-map-dragging');
        setVisible(false);
      }
    };

    const onMouseUp = () => {
      isMouseDown = false;
      container.classList.remove('safe-map-dragging');
      document.body.classList.remove('safe-map-dragging');
    };

    const onDragStart = () => {
      container.classList.add('safe-map-dragging');
      document.body.classList.add('safe-map-dragging');
      setVisible(false);
    };

    const onDragEnd = () => {
      if (!isMouseDown) {
        container.classList.remove('safe-map-dragging');
        document.body.classList.remove('safe-map-dragging');
      }
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    map.on('dragstart', onDragStart);
    map.on('dragend', onDragEnd);
    map.on('movestart', onDragStart);
    map.on('moveend', onDragEnd);

    const handleMouseMove = (e) => {
      if (isMouseDown) {
        setVisible(false);
        return;
      }

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
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      map.off('dragstart', onDragStart);
      map.off('dragend', onDragEnd);
      map.off('movestart', onDragStart);
      map.off('moveend', onDragEnd);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.classList.remove('safe-map-crosshair');
      container.classList.remove('safe-map-dragging');
      document.body.classList.remove('safe-map-dragging');
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
            <div className="absolute inset-[2px] rounded-full border border-bg/80 drop-shadow-[0_0_1px_#f0e4cc]" />

            {/* ── Precision center dot ── */}
            <div className="absolute left-1/2 top-1/2 h-[3.5px] w-[3.5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-bg ring-1 ring-text-primary shadow-sm" />

            {/* ── Sleek low-profile coordinate pill ── */}
            {coords && (
              <div className="absolute left-[16px] top-[14px] flex items-center gap-1 whitespace-nowrap rounded border border-white/20 bg-bg/90 px-1.5 py-0.5 shadow-md backdrop-blur-md">
                <span className="h-1 w-1 rounded-full bg-accent animate-pulse" />
                {targetSlot && (
                  <span className="rounded-sm bg-accent px-1 text-[9px] font-bold uppercase tracking-wide text-bg">
                    Lokasi {targetSlot}
                  </span>
                )}
                <span className="font-mono text-[9px] font-semibold tracking-wide text-text-primary">
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
