import { useMemo } from 'react';
import { ImageOverlay } from 'react-leaflet';
import { useAppStore } from '../../store/useAppStore';
import {
  ACTIVE_FAULTS,
  VOLCANOES,
  MEGATHRUST,
  COASTLINE
} from '../../services/engine';

// Major cities for zoning/population/landcover/ZNT mock simulations
const MAJOR_CITIES = [
  { name: "Jakarta", coords: [-6.208, 106.846], pop: "Tinggi", znt: "Sangat Tinggi" },
  { name: "Surabaya", coords: [-7.250, 112.750], pop: "Tinggi", znt: "Tinggi" },
  { name: "Bandung", coords: [-6.917, 107.619], pop: "Tinggi", znt: "Tinggi" },
  { name: "Medan", coords: [3.595, 98.672], pop: "Tinggi", znt: "Tinggi" },
  { name: "Makassar", coords: [-5.135, 119.424], pop: "Sedang", znt: "Sedang" },
  { name: "Semarang", coords: [-6.966, 110.420], pop: "Sedang", znt: "Sedang" },
  { name: "Yogyakarta", coords: [-7.797, 110.369], pop: "Sedang", znt: "Sedang" },
  { name: "Palembang", coords: [-2.990, 104.756], pop: "Sedang", znt: "Sedang" },
  { name: "Banjarmasin", coords: [-3.317, 114.590], pop: "Sedang", znt: "Sedang" },
  { name: "Balikpapan", coords: [-1.267, 116.831], pop: "Sedang", znt: "Tinggi" },
  { name: "Denpasar", coords: [-8.650, 115.219], pop: "Sedang", znt: "Tinggi" },
  { name: "Manado", coords: [1.474, 124.842], pop: "Sedang", znt: "Sedang" },
  { name: "Ambon", coords: [-3.695, 128.178], pop: "Rendah", znt: "Sedang" },
  { name: "Jayapura", coords: [-2.534, 140.718], pop: "Rendah", znt: "Sedang" },
  { name: "Pontianak", coords: [-0.023, 109.343], pop: "Sedang", znt: "Sedang" },
  { name: "Kupang", coords: [-10.178, 123.607], pop: "Rendah", znt: "Sedang" }
];

export function NationwideOverlays() {
  const overlays = useAppStore((s) => s.overlays);
  const overlayOpacities = useAppStore((s) => s.overlayOpacities);

  // Generate raster TIFF-like data URLs for all 11 geohazard overlays across Indonesia
  const rasterLayers = useMemo(() => {
    const urls = {};
    const width = 368;
    const height = 136;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    const overlayKeys = [
      'earthquake', 'volcano', 'tsunami', 'flood', 'landslide',
      'fire', 'weather', 'rtrw', 'znt', 'landcover', 'population'
    ];

    const fireHotspots = [
      { coords: [0.5, 101.5] },
      { coords: [-1.6, 103.6] },
      { coords: [-2.2, 113.9] },
      { coords: [-3.2, 115.8] },
      { coords: [-0.5, 117.1] }
    ];

    const stormCells = [
      { coords: [-5.9, 105.9] },
      { coords: [-5.5, 111.0] },
      { coords: [-2.5, 118.8] },
      { coords: [-4.0, 131.0] }
    ];

    for (const key of overlayKeys) {
      const imgData = ctx.createImageData(width, height);
      const data = imgData.data;

      for (let y = 0; y < height; y++) {
        const lat = 6 - (y / height) * 17;
        const cosLat = Math.cos(lat * Math.PI / 180);
        for (let x = 0; x < width; x++) {
          const lon = 95 + (x / width) * 46;
          const idx = (y * width + x) * 4;

          let r = 0, g = 0, b = 0, a = 0;

          if (key === 'earthquake') {
            let maxHazard = 0;
            for (const f of ACTIVE_FAULTS) {
              const dy = (lat - f.coords[0]) * 111;
              const dx = (lon - f.coords[1]) * 111 * cosLat;
              const dist = Math.sqrt(dx*dx + dy*dy);
              const h = Math.max(0, 1 - dist / 50);
              if (h > maxHazard) maxHazard = h;
            }
            for (const m of MEGATHRUST) {
              const dy = (lat - m.coords[0]) * 111;
              const dx = (lon - m.coords[1]) * 111 * cosLat;
              const dist = Math.sqrt(dx*dx + dy*dy);
              const h = Math.max(0, 1 - dist / 110) * 0.9;
              if (h > maxHazard) maxHazard = h;
            }
            if (maxHazard > 0) {
              r = Math.round(168 + (239 - 168) * maxHazard);
              g = Math.round(85 + (68 - 85) * maxHazard);
              b = Math.round(247 + (68 - 247) * maxHazard);
              a = Math.round(maxHazard * 180);
            }
          } else if (key === 'volcano') {
            let maxHazard = 0;
            for (const v of VOLCANOES) {
              const dy = (lat - v.coords[0]) * 111;
              const dx = (lon - v.coords[1]) * 111 * cosLat;
              const dist = Math.sqrt(dx*dx + dy*dy);
              const h = Math.max(0, 1 - dist / 60);
              if (h > maxHazard) maxHazard = h;
            }
            if (maxHazard > 0) {
              r = 239;
              g = Math.round(180 - 130 * maxHazard);
              b = Math.round(11 + 40 * (1 - maxHazard));
              a = Math.round(maxHazard * 190);
            }
          } else if (key === 'tsunami') {
            let maxHazard = 0;
            for (const c of COASTLINE) {
              const dy = (lat - c.coords[0]) * 111;
              const dx = (lon - c.coords[1]) * 111 * cosLat;
              const dist = Math.sqrt(dx*dx + dy*dy);
              const h = Math.max(0, 1 - dist / 40);
              if (h > maxHazard) maxHazard = h;
            }
            if (maxHazard > 0) {
              r = Math.round(29 * (1 - maxHazard));
              g = Math.round(78 * (1 - maxHazard) + 120 * maxHazard);
              b = Math.round(216);
              a = Math.round(maxHazard * 180);
            }
          } else if (key === 'flood') {
            let maxHazard = 0;
            for (const c of COASTLINE) {
              const dy = (lat - c.coords[0]) * 111;
              const dx = (lon - c.coords[1]) * 111 * cosLat;
              const dist = Math.sqrt(dx*dx + dy*dy);
              const h = Math.max(0, 1 - dist / 35);
              if (h > maxHazard) maxHazard = h;
            }
            if (maxHazard > 0) {
              r = 6;
              g = Math.round(182 * (1 - maxHazard) + 100 * maxHazard);
              b = Math.round(212);
              a = Math.round(maxHazard * 180);
            }
          } else if (key === 'landslide') {
            let maxHazard = 0;
            for (const v of VOLCANOES) {
              const dy = (lat - v.coords[0]) * 111;
              const dx = (lon - v.coords[1]) * 111 * cosLat;
              const dist = Math.sqrt(dx*dx + dy*dy);
              const h = Math.max(0, 1 - dist / 35);
              if (h > maxHazard) maxHazard = h;
            }
            if (maxHazard > 0) {
              r = Math.round(249 - 69 * maxHazard);
              g = Math.round(115 - 35 * maxHazard);
              b = Math.round(22);
              a = Math.round(maxHazard * 180);
            }
          } else if (key === 'fire') {
            let maxHazard = 0;
            for (const f of fireHotspots) {
              const dy = (lat - f.coords[0]) * 111;
              const dx = (lon - f.coords[1]) * 111 * cosLat;
              const dist = Math.sqrt(dx*dx + dy*dy);
              const h = Math.max(0, 1 - dist / 110);
              if (h > maxHazard) maxHazard = h;
            }
            if (maxHazard > 0) {
              r = Math.round(234 + 5 * maxHazard);
              g = Math.round(88 - 30 * maxHazard);
              b = Math.round(12);
              a = Math.round(maxHazard * 170);
            }
          } else if (key === 'weather') {
            let maxHazard = 0;
            for (const s of stormCells) {
              const dy = (lat - s.coords[0]) * 111;
              const dx = (lon - s.coords[1]) * 111 * cosLat;
              const dist = Math.sqrt(dx*dx + dy*dy);
              const h = Math.max(0, 1 - dist / 140);
              if (h > maxHazard) maxHazard = h;
            }
            if (maxHazard > 0) {
              r = 16;
              g = Math.round(185 * (1 - maxHazard) + 110 * maxHazard);
              b = Math.round(129);
              a = Math.round(maxHazard * 150);
            }
          } else if (key === 'rtrw') {
            let maxHazard = 0;
            for (const c of MAJOR_CITIES) {
              const dy = (lat - c.coords[0]) * 111;
              const dx = (lon - c.coords[1]) * 111 * cosLat;
              const dist = Math.sqrt(dx*dx + dy*dy);
              const h = Math.max(0, 1 - dist / 60);
              if (h > maxHazard) maxHazard = h;
            }
            if (maxHazard > 0) {
              r = Math.round(212 - 32 * maxHazard);
              g = Math.round(149 - 29 * maxHazard);
              b = Math.round(106 - 36 * maxHazard);
              a = Math.round(maxHazard * 170);
            }
          } else if (key === 'znt') {
            let maxHazard = 0;
            for (const c of MAJOR_CITIES) {
              const dy = (lat - c.coords[0]) * 111;
              const dx = (lon - c.coords[1]) * 111 * cosLat;
              const dist = Math.sqrt(dx*dx + dy*dy);
              const h = Math.max(0, 1 - dist / 50);
              if (h > maxHazard) maxHazard = h;
            }
            if (maxHazard > 0) {
              r = 245;
              g = Math.round(158 - 30 * maxHazard);
              b = Math.round(11 + 20 * maxHazard);
              a = Math.round(maxHazard * 180);
            }
          } else if (key === 'landcover') {
            let maxHazard = 0;
            for (const c of MAJOR_CITIES) {
              const dy = (lat - c.coords[0]) * 111;
              const dx = (lon - c.coords[1]) * 111 * cosLat;
              const dist = Math.sqrt(dx*dx + dy*dy);
              const h = Math.max(0, 1 - dist / 75);
              if (h > maxHazard) maxHazard = h;
            }
            r = Math.round(34 + 10 * maxHazard);
            g = Math.round(197 - 50 * maxHazard);
            b = Math.round(94 - 30 * maxHazard);
            a = Math.round((1 - maxHazard) * 110 + 20);
          } else if (key === 'population') {
            let maxHazard = 0;
            for (const c of MAJOR_CITIES) {
              const dy = (lat - c.coords[0]) * 111;
              const dx = (lon - c.coords[1]) * 111 * cosLat;
              const dist = Math.sqrt(dx*dx + dy*dy);
              const h = Math.max(0, 1 - dist / 45);
              if (h > maxHazard) maxHazard = h;
            }
            if (maxHazard > 0) {
              r = Math.round(220 - 40 * maxHazard);
              g = Math.round(38 - 18 * maxHazard);
              b = Math.round(38 - 18 * maxHazard);
              a = Math.round(maxHazard * 190);
            }
          }

          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = a;
        }
      }
      ctx.putImageData(imgData, 0, 0);
      urls[key] = canvas.toDataURL();
    }
    return urls;
  }, []);

  const bounds = [[-11.0, 95.0], [6.0, 141.0]];

  return (
    <>
      {Object.entries(rasterLayers).map(([key, url]) => {
        if (!overlays[key]) return null;
        return (
          <ImageOverlay
            key={`sim-raster-${key}`}
            url={url}
            bounds={bounds}
            opacity={overlayOpacities[key] ?? 0.65}
            interactive={false}
          />
        );
      })}
    </>
  );
}
