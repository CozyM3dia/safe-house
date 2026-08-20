import L from 'leaflet';
import { tileToBbox3395, buildExportUrl, buildRainbowLut } from './hazardOverlay';

// LUT rainbow dibangun sekali, dipakai semua tile.
const LUT = buildRainbowLut();

// GridLayer canvas: ambil tile grayscale InaRISK (ImageServer/exportImage) lalu
// recolor client-side jadi rainbow (biru rendah → merah tinggi). Grayscale =
// indeks bahaya; nodata (alpha 0) tetap transparan. crossOrigin 'anonymous'
// wajib agar getImageData tidak men-taint canvas (gis.bnpb.go.id kirim CORS).
const InariskColorLayer = L.GridLayer.extend({
  initialize(cfg, options, onStatus) {
    this._cfg = cfg;
    this._onStatus = onStatus;
    L.GridLayer.prototype.initialize.call(this, options);
  },
  createTile(coords, done) {
    const size = this.getTileSize();
    const tile = document.createElement('canvas');
    tile.width = size.x;
    tile.height = size.y;
    const ctx = tile.getContext('2d');

    const bbox = tileToBbox3395({ x: coords.x, y: coords.y, z: coords.z });
    const candidates = this._cfg.serviceCandidates?.length
      ? this._cfg.serviceCandidates
      : [{ url: this._cfg.serviceUrl, source: 'official' }];
    let settled = false;
    let timeoutId;

    const tryCandidate = (candidateIndex) => {
      if (settled) return;
      const candidate = candidates[candidateIndex];
      const img = new Image();
      img.crossOrigin = 'anonymous';
      let attemptSettled = false;
      const clearAttempt = () => window.clearTimeout(timeoutId);
      const failAttempt = (error) => {
        if (attemptSettled || settled) return;
        attemptSettled = true;
        clearAttempt();

        if (candidateIndex < candidates.length - 1) {
          const next = candidates[candidateIndex + 1];
          this._onStatus?.('loading', {
            source: next.source,
            serviceUrl: next.url,
          });
          tryCandidate(candidateIndex + 1);
          return;
        }

        settled = true;
        this._onStatus?.('error', {
          source: candidate.source,
          serviceUrl: candidate.url,
          error,
        });
        done(error, tile);
      };

      img.onload = () => {
        if (attemptSettled || settled) return;
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
          attemptSettled = true;
          settled = true;
          clearAttempt();
          this._onStatus?.('ready', {
            source: candidate.source,
            serviceUrl: candidate.url,
          });
          done(null, tile);
        } catch (err) {
          failAttempt(err);
        }
      };
      img.onerror = () => failAttempt(new Error('InaRISK tile load failed'));
      timeoutId = window.setTimeout(
        () => failAttempt(new Error('InaRISK tile load timed out')),
        8000
      );
      img.src = buildExportUrl(candidate.url, bbox);
    };

    this._onStatus?.('loading', {
      source: candidates[0].source,
      serviceUrl: candidates[0].url,
    });
    tryCandidate(0);

    return tile;
  },
});

export function createInariskLayer(cfg, opacity, onStatus) {
  return new InariskColorLayer(cfg, {
    pane: 'hazardOverlay',
    opacity,
    attribution: cfg.attribution,
    zIndex: 350, // hazardOverlay pane; faults pane z430 tetap di atas
    className: `inarisk-overlay inarisk-${cfg.key}`,
  }, onStatus);
}
