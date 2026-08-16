/**
 * Nationwide overlays are intentionally disabled until versioned, approved
 * geospatial layers are connected.
 *
 * The previous implementation generated TIFF-like canvases from static
 * points and gradients. Those visuals looked like official hazard maps while
 * containing no authoritative raster/polygon data, so rendering them would be
 * a credibility defect.
 */
export function NationwideOverlays() {
  return null;
}
