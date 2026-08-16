# S.A.F.E House geo-data contract

The application must distinguish a screening proxy from an authoritative
geospatial layer. The current audit response therefore exposes provenance and
marks the score `provisional` until the required layers are configured.

By default the API runs in `AUDIT_DATA_MODE=best_available`: every valid land
location receives a field-by-field coverage manifest, and missing map layers
may be filled by low-confidence screening proxies. These values are labelled
`model` in `data_quality.fields` and in the hazard label. Set
`AUDIT_DATA_MODE=strict` for a certification workflow that refuses a score
when critical official layers are missing.

Required production inputs:

- `INDONESIA_LAND_GEOJSON`: versioned Indonesia **land** polygon from the
  approved geospatial authority. This is not the old rectangular bounding box.
- Official Vs30/soil grid or a validated site investigation provider.
- Official PGA/design-spectrum grid for the selected building standard.
- Fault and coastline line geometries, not only representative points.
- Versioned subsidence and tsunami inundation layers.

The audit also queries public BNPB InaRISK MapServer layers for tsunami,
liquefaction, volcanic eruption, and extreme-wave/abrasion evidence. These
observations are shown as `official` source observations when a pixel is
returned, but they are not automatically treated as a site investigation and
are not silently added to the buildability weighting. A missing pixel or a
timeout remains `unavailable`.

For a construction or permitting workflow, configure `AUDIT_DATA_MODE=strict`.
Use `best_available` only for early screening: it may calculate a clearly
labelled provisional score from elevation/coast/precipitation proxies when an
official layer is absent.

Until these inputs are available, `data_quality.fields`,
`data_quality.estimated_fields`, and `data_quality.optional_missing` must remain
visible and the S.A.F.E score must not be presented as a final engineering
decision. The existing InaRISK, USGS, Open-Meteo, Nominatim, and OSM calls are
retained as source-specific observations; they do not upgrade proxy geotech
values into official site investigation data. Each field includes status,
source, confidence, and an `as_of` timestamp so consumers can filter evidence
quality instead of inferring accuracy from the presence of a number.
