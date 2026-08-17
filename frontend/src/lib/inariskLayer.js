import L from 'leaflet';
import { tileToBbox3857, buildExportUrl, buildRainbowLut } from './hazardOverlay';

// LUT rainbow dibangun sekali, dipakai semua tile.
const LUT = buildRainbowLut();

// GridLayer canvas: ambil tile grayscale InaRISK (ImageServer/exportImage) lalu
// recolor client-side jadi rainbow (biru rendah → merah tinggi). Grayscale =
// indeks bahaya; nodata (alpha 0) tetap transparan. crossOrigin 'anonymous'
// wajib agar getImageData tidak men-taint canvas (gis.bnpb.go.id kirim CORS).
const InariskColorLayer = L.GridLayer.extend({
  initialize(cfg, options) {
    this._cfg = cfg;
    L.GridLayer.prototype.initialize.call(this, options);
  },
  createTile(coords, done) {
    const size = this.getTileSize();
    const tile = document.createElement('canvas');
    tile.width = size.x;
    tile.height = size.y;
    const ctx = tile.getContext('2d');

    const bbox = tileToBbox3857({ x: coords.x, y: coords.y, z: coords.z });
    const url = buildExportUrl(this._cfg.serviceUrl, bbox);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        ctx.drawImage(img, 0, 0, size.x, size.y);
        const id = ctx.getImageData(0, 0, size.x, size.y);
        const d = id.data;
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] < 10) {
            d[i + 3] = 0; // nodata → transparan
            continue;
          }
          // luminance grayscale = indeks bahaya → LUT rainbow
          const lum = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) | 0;
          const p = lum * 3;
          d[i] = LUT[p];
          d[i + 1] = LUT[p + 1];
          d[i + 2] = LUT[p + 2];
        }
        ctx.putImageData(id, 0, 0);
        done(null, tile);
      } catch (err) {
        done(err, tile);
      }
    };
    img.onerror = () => done(new Error('InaRISK tile load failed'), tile);
    img.src = url;

    return tile;
  },
});

export function createInariskLayer(cfg, opacity) {
  return new InariskColorLayer(cfg, {
    opacity,
    attribution: cfg.attribution,
    zIndex: 350, // di tilePane, di atas basemap; faults pane z430 (di atas)
    className: `inarisk-overlay inarisk-${cfg.key}`,
  });
}
