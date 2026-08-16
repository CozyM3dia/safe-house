import L from 'leaflet';
import { tileToBbox3857, buildExportUrl } from './hazardOverlay';

// L.TileLayer yang membangun URL dynamic-export ArcGIS per tile.
const InariskTileLayer = L.TileLayer.extend({
  initialize(cfg, options) {
    this._cfg = cfg;
    L.TileLayer.prototype.initialize.call(this, '', options);
  },
  getTileUrl(coords) {
    const bbox = tileToBbox3857({ x: coords.x, y: coords.y, z: coords.z });
    return buildExportUrl(this._cfg.serviceUrl, bbox);
  },
});

export function createInariskLayer(cfg, opacity) {
  return new InariskTileLayer(cfg, {
    opacity,
    attribution: cfg.attribution,
    crossOrigin: false,
    zIndex: 350, // di bawah faults (pane z 430) & marker
    className: `inarisk-overlay inarisk-${cfg.key}`,
  });
}
