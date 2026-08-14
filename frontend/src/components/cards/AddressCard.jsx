import { motion } from 'framer-motion';
import { MapPin, Compass, Navigation, Mountain, Copy, Check } from 'lucide-react';
import { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle } from '../ui/card';
import { formatCoord, formatElevation } from '../../lib/formatters';

export function AddressCard({ property }) {
  const [copied, setCopied] = useState(false);

  // Membaca AuditResult langsung: lat/lon di akar, sesar di geotech.
  const lat = property?.lat;
  const lon = property?.lon;
  const elevation = property?.elevation ?? property?.geotech?.elevation_m;
  const fault = property?.geotech?.nearest_fault;
  const faultName = fault?.name;
  const faultDist = fault?.distance_km;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(`${lat}, ${lon}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }, [lat, lon]);

  if (!property) return null;

  const faultColor = faultDist < 10 ? '#ef4444' : faultDist < 30 ? '#f59e0b' : '#10b981';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <MapPin className="h-3 w-3 text-accent" />
          Site Location
        </CardTitle>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-mono text-text-muted hover:bg-white/8 hover:text-accent btn-press transition-colors"
          title="Copy coordinates"
        >
          {copied ? <Check className="h-2.5 w-2.5 text-risk-safe" /> : <Copy className="h-2.5 w-2.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </CardHeader>

      {/* Address */}
      <p className="text-[11px] leading-relaxed text-text-secondary line-clamp-2 mb-3">
        {property.address || 'Address unavailable'}
      </p>

      {/* Coordinates grid */}
      <div className="grid grid-cols-3 gap-1.5">
        <CoordCell
          icon={<Navigation className="h-2.5 w-2.5 text-accent/60" />}
          label="Lat"
          value={formatCoord(lat)}
        />
        <CoordCell
          icon={<Navigation className="h-2.5 w-2.5 text-accent/60 rotate-90" />}
          label="Lon"
          value={formatCoord(lon)}
        />
        <CoordCell
          icon={<Mountain className="h-2.5 w-2.5 text-accent/60" />}
          label="Elev"
          value={formatElevation(elevation)}
        />
      </div>

      {/* Fault line indicator */}
      {faultName && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-3 flex items-center gap-2.5 rounded-lg px-3 py-2.5"
          style={{
            background: `${faultColor}08`,
            border: `1px solid ${faultColor}25`,
          }}
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
            style={{ background: `${faultColor}15`, border: `1px solid ${faultColor}30` }}
          >
            <Compass className="h-3 w-3" style={{ color: faultColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-[11px] font-semibold text-text-primary">
              {faultName}
            </p>
            <p className="text-[9px] font-mono" style={{ color: faultColor }}>
              {faultDist < 1 ? `${(faultDist * 1000).toFixed(0)}m away` : `${faultDist.toFixed(1)}km away`}
            </p>
          </div>
          <div
            className="shrink-0 rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider"
            style={{ color: faultColor, background: `${faultColor}15` }}
          >
            {faultDist < 10 ? 'NEAR' : faultDist < 30 ? 'MOD' : 'FAR'}
          </div>
        </motion.div>
      )}
    </Card>
  );
}

function CoordCell({ icon, label, value }) {
  return (
    <div className="rounded-lg border border-white/6 bg-white/[0.02] px-2.5 py-2 hover:border-white/12 transition-colors shadow-[inset_0_1px_0_rgba(255,210,170,0.05)]">
      <div className="flex items-center gap-1 mb-1">
        {icon}
        <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-text-muted">
          {label}
        </p>
      </div>
      <p className="truncate font-mono text-[11px] text-text-primary font-medium">
        {value}
      </p>
    </div>
  );
}
