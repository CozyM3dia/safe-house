# S.A.F.E House Frontend

React + Vite frontend for the S.A.F.E House property-risk intelligence experience.

## Development

```bash
npm install
npm run dev
```

The frontend expects the FastAPI backend URL in `VITE_API_URL`.

## Basemap providers

CARTO Positron remains the verified default. The map also includes Esri World Imagery and an opt-in Stadia Maps Alidade Smooth analysis basemap.

```env
VITE_STADIA_MAPS_ENABLED=false
VITE_STADIA_MAPS_API_KEY=
```

Only set `VITE_STADIA_MAPS_ENABLED=true` after Stadia tile delivery has been verified on the deployed domain. If the analysis basemap produces repeated tile errors, the application automatically returns to CARTO.

For browser deployments, prefer Stadia domain authentication. If an API key is used, restrict it to the deployed domain and never commit the local `.env` file.

## Licensing guardrail

The Stadia Free plan is limited to non-commercial use. S.A.F.E House must not claim commercial Stadia usage while using the Free plan. Review the current Stadia license and move to an appropriate commercial plan before a commercial deployment.

The existing Esri source remains responsible for satellite mode; this integration does not enable Stadia satellite imagery.

## Validation

```bash
npm run lint
npm run build
```

The basemap integration does not change risk scoring, audit logic, battle calculations, hazard values, or backend APIs.
