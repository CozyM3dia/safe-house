# S.A.F.E House — Project Handoff

**Date:** May 23, 2026
**Competition:** #JuaraVibeCoding2026
**Status:** MVP functional. App works end-to-end. Landing page redesign pending.

---

## 1. What This Project Is

**S.A.F.E House** (Seismic Analysis for Foundation Evaluation) — geophysics property risk web app for Indonesia.

**Core flow:** User clicks map → geospatial data fetched from multiple APIs → Gemini AI analyzes → S.A.F.E Score (0–100) + full risk report generated in ~12 seconds.

**Two routes:**
- `/` — Landing/marketing page
- `/app` — Main dashboard (map + AI analysis)

---

## 2. Architecture — 100% Frontend

**No backend. No database. No Docker.**

```
Browser
  ↓ direct API calls
  ├── Gemini 2.0 Flash Lite (primary AI)
  ├── OpenRouter / Gemma 2 9B (AI fallback 1)
  ├── Ollama localhost:11434 (AI fallback 2)
  ├── Open-Meteo (elevation, AQI, weather)
  └── USGS Earthquake API
```

AI failover: Gemini → OpenRouter → Ollama → error state

---

## 3. How to Run

```bash
cd "C:\Kuliah\Vibe Coding\S.A.F.E House\frontend"
npm install
npm run dev
# → http://localhost:5173
```

Build:
```bash
npm run build    # → dist/
npm run preview  # preview production
```

---

## 4. API Keys

File: `frontend/.env`

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
```

> Keys are in the frontend bundle — fine for demo/MVP only.

Backend folder exists at `backend/` but is **not used**. All AI calls are direct from browser.

---

## 5. Tech Stack

| Layer | Tech | Version |
|-------|------|---------|
| Framework | React | 19.2 |
| Bundler | Vite | 8.0 |
| State | Zustand | 5.0 (persist middleware) |
| Styling | Tailwind CSS | 3.4 |
| Animation | Framer Motion | 12.38 |
| Map | Leaflet + react-leaflet | 1.9 / 5.0 |
| Globe (landing) | react-globe.gl | 2.38 |
| Charts | Recharts | 3.8 |
| PDF | jsPDF + html2canvas | 4.2 / 1.4 |
| Markdown | react-markdown + remark-gfm | 10.1 |
| Drawer | Vaul | 1.1 |
| Command palette | cmdk | 1.1 |
| Toast | Sonner | 2.0 |
| Icons | Lucide React | 1.16 |
| HTTP | Axios | 1.16 |
| Query | TanStack Query | 5.100 |
| 3D | Three.js | 0.184 |
| Confetti | canvas-confetti | 1.9 |

---

## 6. Complete File Map

```
C:\Kuliah\Vibe Coding\S.A.F.E House\
├── HANDOFF.md                  ← this file
├── DESIGN_SYSTEM.md            ← app design system (mocha/copper theme)
├── PROJECT_REQUIREMENTS.md     ← landing page build spec for Google AI Studio
├── LANDING_PAGE_HANDOFF.md     ← landing page technical reference
├── LANDING_PAGE_PROMPT.md      ← copy-paste prompt for AI Studio
├── design.md                   ← OLD design doc (ignore)
├── project.md                  ← OLD requirements doc (ignore)
├── SafeHouse Briefing.md       ← competition brief
├── implementation_plan.md      ← original plan (may be outdated)
├── backend/                    ← EXISTS but NOT USED
│   ├── server.js
│   ├── routes/
│   └── .env                    ← same API keys, unused
└── frontend/
    ├── .env                    ← API keys (source of truth)
    ├── index.html
    ├── package.json
    ├── tailwind.config.js      ← design tokens
    ├── vite.config.js
    └── src/
        ├── App.jsx             ← router + AppShell + hotkeys
        ├── main.jsx            ← React entry
        ├── index.css           ← global styles, glass classes, animations
        │
        ├── pages/
        │   └── LandingPage.jsx ← landing orchestrator + COPY dict (bilingual)
        │
        ├── services/
        │   └── engine.js       ← ★ CORE BRAIN — 800+ lines
        │                          AI calls, geospatial data, Indonesia DB
        │
        ├── store/
        │   └── useAppStore.js  ← ★ ALL STATE — Zustand + persist
        │
        ├── hooks/
        │   └── useTranslation.js ← useT() hook for bilingual
        │
        ├── lib/
        │   ├── pdfExport.js    ← exportPrintReadyPdf, exportBattlePdf
        │   ├── aiPrompts.js    ← AI prompt templates
        │   ├── ragEngine.js    ← RAG chatbot logic
        │   ├── knowledgeBase.js ← Indonesia geological knowledge base
        │   ├── i18n.js         ← translation strings
        │   ├── formatters.js   ← number/unit formatters
        │   ├── constants.js    ← app constants
        │   └── utils.js        ← cn(), locationToUrl(), helpers
        │
        ├── components/
        │   ├── landing/        ← 7 files — marketing page sections
        │   │   ├── HeroSection.jsx       ← fullscreen globe + headline
        │   │   ├── GlobeHero.jsx         ← react-globe.gl (lazy-loaded)
        │   │   ├── DemoSection.jsx       ← mock map + risk bars
        │   │   ├── RiskSection.jsx       ← 4 risk type cards + mini viz
        │   │   ├── ScoreSection.jsx      ← animated count-up + progress bars
        │   │   ├── TrustSection.jsx      ← data source badges
        │   │   └── CTASection.jsx        ← final CTA + footer
        │   │
        │   ├── panels/         ← main app panels
        │   │   ├── LeftPanel.jsx         ← sidebar with all data cards
        │   │   ├── TopBar.jsx            ← top nav + mode toggle + lang
        │   │   ├── AuditDrawer.jsx       ← bottom sheet AI report + PDF
        │   │   └── ChatbotFab.jsx        ← floating chatbot (RAG)
        │   │
        │   ├── cards/          ← data visualization cards in LeftPanel
        │   │   ├── SafeScoreCard.jsx     ← circular score gauge
        │   │   ├── MetricsGrid.jsx       ← VS30, PGA, Liq.FS, Elevation
        │   │   ├── RadarCard.jsx         ← 5-axis Recharts radar
        │   │   ├── GaussianCard.jsx      ← PGA bell curve SVG
        │   │   ├── SeismicWaveform.jsx   ← waveform + fault label
        │   │   ├── AddressCard.jsx       ← location + coords + fault badge
        │   │   └── BattleCard.jsx        ← side-by-side comparison card
        │   │
        │   ├── map/            ← Leaflet map components
        │   │   ├── MapArea.jsx           ← main map container
        │   │   ├── MapMarker.jsx         ← location pin + glow
        │   │   ├── MapControls.jsx       ← custom zoom + layer buttons
        │   │   ├── RiskZoneOverlay.jsx   ← colored risk zones
        │   │   ├── DisasterLayersPanel.jsx ← layer toggle panel
        │   │   └── NationwideOverlays.jsx ← Indonesia-wide data overlays
        │   │
        │   ├── command/
        │   │   └── CommandPalette.jsx    ← Cmd+K search + quick actions
        │   │
        │   ├── onboarding/
        │   │   ├── OnboardingOverlay.jsx ← 7-step spotlight tour
        │   │   ├── SpotlightSvg.jsx      ← spotlight mask
        │   │   └── tourSteps.js          ← tour step definitions
        │   │
        │   ├── feedback/
        │   │   ├── LoadingBeam.jsx       ← top progress bar
        │   │   └── ErrorFallback.jsx     ← error boundary UI
        │   │
        │   └── ui/             ← primitives (shadcn-style)
        │       ├── button.jsx
        │       ├── badge.jsx
        │       ├── card.jsx
        │       ├── dialog.jsx
        │       ├── skeleton.jsx
        │       ├── carousel.jsx
        │       ├── language-selector.jsx
        │       ├── disclaimer-dialog.jsx
        │       ├── faq-dialog.jsx
        │       └── gallery4.jsx
```

---

## 7. Key Files Deep Dive

### `services/engine.js` — Core Brain
Everything important lives here:

```javascript
// Direct API config (no backend)
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.0-flash-lite';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// Key exports:
export async function fetchGeospatialData(lat, lng) { ... }
export async function generateSummaryCards(data, lang, signal) { ... }
export async function generateDetailedReport(data, lang, signal) { ... }
export async function generateBattleReport(propA, propB, lang) { ... }
export async function callAI(prompt, signal) { ... } // Gemini → OpenRouter → Ollama
```

Built-in geological database:
- `ACTIVE_FAULTS` — 40+ Indonesian fault lines with coords
- `VOLCANOES` — 80+ active volcanoes
- `MEGATHRUST` — 8 subduction zones
- `COASTLINE` — coastal reference points
- `INDONESIA_RISK_KNOWLEDGE` — ~1270 token knowledge base embedded in AI prompts

### `store/useAppStore.js` — All State

```javascript
// Key state:
propertyA, propertyB     // analyzed location data
mode                     // 'audit' | 'battle'
loading, aiLoading       // loading states
auditDrawerOpen          // bottom sheet
leftPanelOpen            // sidebar
battleReportContent      // AI battle markdown
recentSearches           // persisted, last 8
favorites                // persisted, up to 30
lang                     // 'id' | 'en', persisted
hasSeenOnboarding        // persisted, bool

// Key actions:
processLocation(lat, lng, isBattle)  // ★ main flow
runBattleReportAction()              // generate comparison
toggleFavorite(entry)
addRecentSearch(entry)
reset()
```

### `store/useAppStore.js` — Two-Phase AI Flow
```
processLocation(lat, lng)
  → fetchGeospatialData()          (~2s) → show map immediately
  → generateSummaryCards()         (~3s) → show score cards
  → generateDetailedReport()       (~8s) → show full report in drawer
```

AbortController cancels previous request when user clicks new location.

---

## 8. Design System — App (Mocha Command Center)

Full spec in `DESIGN_SYSTEM.md`. Quick reference:

```css
/* Colors */
bg:             #0f0b08   /* near-black, warm */
bg-surface:     rgba(22, 14, 8, 0.88)
text-primary:   #f0e4cc   /* warm white */
text-secondary: #c4a87e   /* copper text */
text-muted:     #7d6245   /* dim copper */
accent:         #d4956a   /* primary copper/amber */
risk-safe:      #10b981   /* green */
risk-moderate:  #f59e0b   /* amber */
risk-danger:    #ef4444   /* red */

/* Borders */
rgba(255, 210, 170, 0.07–0.14)  /* warm amber tint */

/* Glass panel */
background: rgba(22, 14, 8, 0.80)
backdrop-filter: blur(24px) saturate(150%)
border: 1px solid rgba(255, 210, 170, 0.10)
```

---

## 9. Landing Page Design System — "Void & Electric"

Separate theme. Full spec in `LANDING_PAGE_HANDOFF.md`.

```css
--void:     oklch(0.10 0.015 290)  /* near-black purple-tint */
--electric: oklch(0.60 0.20 310)   /* vibrant purple */
--teal:     oklch(0.55 0.15 200)   /* teal secondary */
```

---

## 10. App Features — Working State

| Feature | Status | Notes |
|---------|--------|-------|
| Map click → analyze | ✅ Working | Leaflet click → processLocation() |
| S.A.F.E Score display | ✅ Working | 0–100 circular gauge |
| Metrics grid | ✅ Working | VS30, PGA, Liq.FS, Elevation |
| Risk radar | ✅ Working | 5-axis Recharts radar |
| Seismic waveform | ✅ Working | SVG + fault label |
| PGA distribution | ✅ Working | Gaussian bell curve |
| AI summary cards | ✅ Working | Phase 1, ~3s |
| AI detailed report | ✅ Working | Phase 2, ~8s, in AuditDrawer |
| Battle mode | ✅ Working | A vs B comparison + AI report |
| PDF export | ✅ Working | jsPDF single + battle |
| Command palette | ✅ Working | Cmd+K, search + actions |
| Chatbot (RAG) | ✅ Working | Context-aware, suggestion chips |
| Bilingual (ID/EN) | ✅ Working | Zustand lang state |
| Recent searches | ✅ Working | Persisted localStorage |
| Favorites | ✅ Working | Persisted localStorage |
| Onboarding tour | ✅ Working | 7-step spotlight, auto first-visit |
| Map overlays | ✅ Working | AQI, Soil, Volcano badges on map |
| Disaster layers | ✅ Working | Toggle panel for map layers |

---

## 11. Known Issues & Limitations

| Issue | Detail |
|-------|--------|
| API keys in bundle | Exposed in frontend — demo only, not production-safe |
| Large bundle | ~2MB uncompressed (Leaflet + jsPDF + react-globe.gl) |
| AI rate limits | Free tier Gemini may fail under load |
| Indonesia only | Geological DB coverage — other countries get limited analysis |
| No user accounts | MVP — no cross-device sync |
| backend/ folder | Exists but unused — can be deleted |
| text-muted contrast | #7d6245 = 3.2:1 — fails WCAG AA for body text |

---

## 12. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+K` / `Ctrl+K` | Open command palette |
| `L` | Toggle left panel |
| `C` | Toggle chatbot |

---

## 13. Bilingual System

Language stored in Zustand (`lang: 'id' | 'en'`), persisted.

**App panels:** use `useT()` hook from `hooks/useTranslation.js`
**Landing page:** use local `COPY` dict in `LandingPage.jsx` + `t(key)` helper

AI prompts switch language: if `lang === 'en'` → English prompts → English report.

---

## 14. What Was Done This Session (May 23)

1. **Ran app** — verified end-to-end: click Jakarta → S.A.F.E Score 44, VS30 160m/s, PGA 0.30, Liq.FS 0.05, AI analysis complete
2. **Created `LANDING_PAGE_HANDOFF.md`** — full technical reference for landing page rebuild
3. **Created `LANDING_PAGE_PROMPT.md`** — copy-paste prompt for Google AI Studio
4. **Created `DESIGN_SYSTEM.md`** — app design system (mocha/copper theme, all tokens, components, pain points)
5. **Created `PROJECT_REQUIREMENTS.md`** — landing page build spec for Google AI Studio (Part 1 = app context, Part 2 = what to build)
6. **Updated `HANDOFF.md`** — this file

---

## 15. Pending / Next Steps

### For Landing Page Redesign (Google AI Studio)
1. Open `PROJECT_REQUIREMENTS.md` → copy Part 2 into Google AI Studio
2. Reference `DESIGN_SYSTEM.md` for app palette if doing app redesign
3. Reference `LANDING_PAGE_HANDOFF.md` for landing page palette + component specs
4. Replace existing `components/landing/` files with output from AI Studio
5. Test at `localhost:5173/`

### For App Dashboard Redesign
See `DESIGN_SYSTEM.md` section 13 "What to Redesign" for specific pain points per component:
- SafeScoreCard gauge → custom arc gradient
- MetricsGrid → better 2×2 hierarchy
- RadarChart → thicker stroke + glow
- TopBar mode toggle → pill highlight active state
- AuditDrawer header → collapse into icon buttons on mobile

### For Production
- Move API keys to backend proxy
- Add rate limiting
- SEO meta tags on landing page
- PWA manifest

---

## 16. Project Doc Index

| File | Purpose |
|------|---------|
| `HANDOFF.md` | This file — complete project state |
| `DESIGN_SYSTEM.md` | App design system (mocha/copper theme) |
| `PROJECT_REQUIREMENTS.md` | Landing page build spec for AI Studio |
| `LANDING_PAGE_HANDOFF.md` | Landing page technical reference |
| `LANDING_PAGE_PROMPT.md` | Ready prompt for Google AI Studio |
| `SafeHouse Briefing.md` | Competition brief |
| `design.md` | OLD — ignore |
| `project.md` | OLD — ignore |

---

**App is working. Paste `PROJECT_REQUIREMENTS.md` Part 2 into Google AI Studio to rebuild landing page.**
