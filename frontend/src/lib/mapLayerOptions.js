export function getLeafletTileLayerOptions(tile) {
  const options = {
    url: tile.url,
    attribution: tile.attribution,
    maxZoom: tile.maxZoom,
    keepBuffer: 4,
    updateWhenIdle: true,
  };

  if (tile.subdomains != null) {
    options.subdomains = tile.subdomains;
  }

  return options;
}
