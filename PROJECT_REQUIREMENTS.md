# S.A.F.E House — Project Requirements
## Landing Page (Google AI Studio Build Target)

**Version:** 3.0
**Date:** May 23, 2026
**Competition:** #JuaraVibeCoding2026
**Goal:** Build a stunning, competition-winning landing page for S.A.F.E House using Google AI Studio

---

## Part 1 — App Context (What the App Does)

> This section gives AI Studio context about the product being marketed. The actual build target is the **Landing Page** in Part 2.

### What is S.A.F.E House?

**S.A.F.E House** (Seismic Analysis for Foundation Evaluation) is a geophysics property risk analysis web app for Indonesia.

**Core value:** A user clicks any location on an Indonesia map → the app fetches real geospatial data + calls AI → returns a comprehensive geological risk report in 10-15 seconds.

### What the App Analyzes
| Risk Category | Data Points |
|--------------|-------------|
| **Seismic** | Distance to active faults, PGA (Peak Ground Acceleration), soil class (VS30), megathrust proximity |
| **Flood** | Elevation above sea level, river/coastline proximity, annual rainfall, drainage capacity |
| **Volcanic** | Distance to active volcanoes, PVMBG danger zones, lahar paths |
| **Geotechnical** | Soil type, liquefaction factor of safety, slope grade, subsidence history |

### Output Delivered to Users
- **S.A.F.E Score** — composite 0-100 risk score
- **Risk Breakdown** — Seismic / Flood / Soil percentages
- **Technical Metrics** — VS30, PGA, elevation, liquefaction FS
- **Risk Radar Chart** — 5-axis visual (Flood, Soil, Air, Seismic, Elevation)
- **Seismic Waveform** — nearest fault visualization
- **Full AI Report** — markdown document with mitigation recommendations
- **Battle Mode** — compare two properties side-by-side
- **PDF Export** — publication-ready report

### Data Sources
| Source | Data Provided |
|--------|--------------|
| BMKG | Indonesian earthquake & weather data |
| PVMBG | Volcanic hazard zones |
| USGS | Global seismic events |
| OpenStreetMap | Geographic reference data |
| Gemini AI | Risk analysis & report generation |
| Open-Meteo | Elevation, AQI, weather |

### User Journey in the App
```
Landing Page (/) → Click "Mulai" → App (/app) →
Click map location → 3 second geospatial fetch →
Instant score dashboard → 8 second AI report → 
Full markdown report in drawer → PDF export option
```

---

## Part 2 — Landing Page Requirements (BUILD THIS)

> This is what must be built in Google AI Studio. A React + Tailwind landing page at route `/`.

### 2.1 Purpose & Goal

The landing page must:
1. **Hook** — make visitors immediately understand the value
2. **Show** — demonstrate what the app looks like/does
3. **Educate** — explain the 4 risk types briefly
4. **Trust** — show credible data sources
5. **Convert** — drive visitors to click through to `/app`

**Success metric:** Visitor understands the product and wants to try it within 30 seconds.

---

### 2.2 Design System

#### Color Palette — "Void & Electric"

```css
/* Paste these variables into any CSS :root or .landing class */
--void:          oklch(0.10 0.015 290);  /* #0a0c10 — main background */
--void-surface:  oklch(0.15 0.01 290);   /* card backgrounds */
--void-elevated: oklch(0.18 0.01 290);   /* hover/elevated */
--void-border:   oklch(0.22 0.01 290);   /* subtle borders */
--electric:      oklch(0.60 0.20 310);   /* ~#a855f7 purple — PRIMARY CTA */
--electric-dim:  oklch(0.45 0.15 310);   /* muted purple */
--teal:          oklch(0.55 0.15 200);   /* ~#14b8a6 — secondary */
--text-bright:   oklch(0.96 0.005 290);  /* white headings */
--text-muted:    oklch(0.45 0.01 290);   /* body text */
--text-subtle:   oklch(0.35 0.01 290);   /* labels, captions */
--risk-safe:     oklch(0.68 0.18 145);   /* green */
--risk-moderate: oklch(0.72 0.14 75);    /* amber */
--risk-danger:   oklch(0.62 0.20 25);    /* red */
```

**Dark theme only.** No light mode. Background is always near-black void.

#### Typography

| Role | Font | Weight |
|------|------|--------|
| Headlines | `Archivo` | 800–900 |
| Body / UI | `Red Hat Display` | 400–600 |
| Data/Numbers | `Azeret Mono` | 400–500 |

Load via Google Fonts. Font sizes use `clamp()` for fluid scaling:
- Hero title: `clamp(2.4rem, 6vw, 3.8rem)`
- Section h2: `clamp(1.5rem, 3vw, 2rem)`
- Body: `clamp(0.85rem, 1.5vw, 1rem)`

#### Animation Easing
All transitions use: `cubic-bezier(0.32, 0.72, 0, 1)` — smooth deceleration, no bounce.

---

### 2.3 Page Sections (Must Have All 6)

---

#### Section 1 — HERO

**Purpose:** Hook the user in the first 3 seconds.

**Layout:** Full viewport height (`100vh`). Globe or dramatic visual centered. Text bottom-left.

**Visual:**
- Background: `var(--void)` solid dark
- Subtle radial purple gradient at center: `radial-gradient(ellipse at 50% 50%, oklch(0.50 0.20 310 / 0.06), transparent 55%)`
- **Center visual:** 3D rotating globe (react-globe.gl) showing Indonesia with purple glowing seismic dots, OR a dramatic CSS/SVG alternative (particle field, topographic contour lines, radar sweep animation)
- Bottom-left: headline + subtitle + CTA button
- Bottom: gradient fade into next section

**Navigation (absolute top):**
```
[S.A.F.E HOUSE]                                    [ID / EN]  [Mulai →]
```
- Logo: `font-weight: 900, tracking-wide, color: var(--text-bright)`
- Lang toggle: `text-[11px], color: var(--text-muted)`
- Mulai button: `bg: purple/0.12, border: purple/0.30, color: var(--electric), rounded-md, px-4 py-2`

**Hero Text:**
```
Headline (h1):  "Rumah aman\natau tidak?"
                Font: Archivo 900, clamp(2.4rem, 6vw, 3.8rem)
                Color: var(--text-bright), letter-spacing: -0.03em
                White-space: pre-line (preserve line break)

Subtitle (p):   "Cek risiko gempa, banjir dan longsor di lokasi properti Anda."
                Font: Red Hat Display 400, clamp(0.85rem, 1.5vw, 1rem)
                Color: var(--text-muted), max-width: 28rem

CTA Button:     "Cek Lokasi Sekarang"
                bg: var(--electric), color: var(--void)
                font: Archivo 800, 14px, rounded-lg, px-7 py-3
                Hover: box-shadow: 0 0 20px purple/0.25, 0 0 48px purple/0.08
                Active: scale(0.97)
```

**Entrance Animations:** Staggered `translateY(20px) + blur(6px) → 0` on page load:
- Nav: 100ms delay
- Headline: 300ms delay
- Subtitle: 450ms delay
- CTA: 600ms delay

---

#### Section 2 — DEMO PREVIEW

**Purpose:** Show the app in action without making user open it.

**Headline:**
```
"Klik. Analisis. Selesai."
Font: Archivo 800, clamp(1.5rem, 3vw, 2rem), color: var(--text-bright)

Subtitle:
"Pilih titik di peta, lihat hasilnya dalam 10 detik"
Font: Red Hat Display 400, 14px, color: var(--text-muted)
```

**Layout:** Two cards side-by-side (flex, gap-4, max-w-3xl centered):

**Left card — Map mockup (flex-[1.3]):**
```
Background: var(--void-surface)
Border: 1px solid var(--void-border), rounded-xl, min-h: 220px

Contents:
- Subtle dark grid overlay (repeating-linear-gradient 20px grid lines, opacity 20%)
- Pulsing purple pin in center (12px circle, purple glow)
  → 2 pulse rings: pin-pulse animation 2s infinite (scale 1→3.5, opacity 0.5→0)
- Bottom-left: coords badge "-6.21° 106.85°" (dark pill, mono font, text-muted)
- Top-left: "Leaflet Map" (text-subtle, 10px)
```

**Right card — Risk summary (flex-1):**
```
Background: var(--void-surface)
Border: 1px solid var(--void-border), rounded-xl, p-4

Top row:
  Left: Location label (teal, 10px uppercase tracking-widest): "Cibubur, Jakarta"
        Risk label (text-bright, 15px bold): "Risiko Sedang"
  Right: Score badge "72/100"
         bg: purple/0.12, border: purple/0.30, rounded-full
         72 in purple Archivo 800 text-lg, /100 in text-muted 10px

Bottom: 3 risk bars
  [Seismik]  [Sedang]  ████████░░░  65%  amber
  [Banjir]   [Rendah]  █████████░░  85%  green
  [Vulkanik] [Tinggi]  ████░░░░░░░  35%  red

Bar specs:
  Label: Red Hat Display 11px, color: text-muted
  Level: Red Hat Display 11px semibold, matching risk color
  Track: 3px height, rounded-full, bg: oklch(0.20 0.01 290)
  Fill: rounded-full, matching risk color
```

**Scroll animation:** Full block fades up on scroll into view (Framer Motion useInView).

---

#### Section 3 — RISK TYPES

**Purpose:** Educate about the 4 risk categories. Each card is a full-height scroll section.

**Format:** 4 stacked full-width sections, alternating backgrounds:
- Odd (01, 03): `var(--void)` background
- Even (02, 04): `oklch(0.08 0.012 290)` slightly darker

**Each section layout:**
- Large decorative number (01-04) top-right: `clamp(7rem, 18vw, 12rem), color: oklch(0.14 0.01 290)` — fades in on scroll
- Content block centered, `max-w-lg, mx-auto`
- `min-height: 70vh` (reduces to `50vh` on mobile)

**Content structure per card:**
```
Label (10px uppercase tracking-[0.2em], color: var(--teal)):
"01 — Apa yang kami analisis"

Title (h3, Archivo 800, clamp(1.6rem, 4vw, 2.2rem), tracking: -0.02em):
[See titles below]

Description (Red Hat Display 400, 14px, leading-relaxed, color: text-muted):
[See descriptions below]

Data Viz box (mt-6, p-4, rounded-lg, bg: oklch(0.12 0.01 290), border: 1px solid void-border):
[Animated mini-viz, see specs below]
```

**The 4 risk cards:**

| Num | Title | Description | Mini-Viz |
|-----|-------|-------------|----------|
| 01 | Risiko Seismik | Jarak ke patahan aktif, zona megathrust, riwayat gempa 50 tahun terakhir, dan klasifikasi tanah (VS30) menentukan kerentanan lokasi. | Seismogram SVG line — stroke-dasharray draw animation (see spec A) |
| 02 | Risiko Banjir | Elevasi, jarak ke sungai dan pantai, curah hujan tahunan, dan kapasitas drainase menentukan potensi banjir di lokasi. | Bar chart — 7 vertical bars, scaleY(0→1) stagger (see spec B) |
| 03 | Risiko Vulkanik | Jarak ke gunung api aktif, jalur lahar, zona bahaya PVMBG, dan sejarah erupsi menentukan ancaman vulkanik. | Concentric pulse rings — scale(0.3→1) (see spec C) |
| 04 | Risiko Geoteknik | Jenis tanah, kemiringan lereng, potensi likuifaksi, dan riwayat amblesan menentukan stabilitas fondasi. | Layered soil bars — scaleY animation (see spec D) |

**Mini-Viz Specs:**

**A — Seismogram (SVG):**
```jsx
<svg width="100%" height="48" viewBox="0 0 300 48" preserveAspectRatio="none">
  <polyline
    points="0,24 15,24 25,16 35,32 42,6 52,38 62,18 72,30 85,24 110,24 
            125,22 135,28 142,14 152,34 162,20 172,26 190,24 300,24"
    fill="none" stroke="var(--electric)" strokeWidth="1.5"
    style={{
      strokeDasharray: 800,
      strokeDashoffset: animate ? 0 : 800,
      transition: 'stroke-dashoffset 1200ms cubic-bezier(0.32,0.72,0,1) 200ms'
    }}
  />
</svg>
```

**B — Bar Chart:**
```jsx
// Heights: [60, 80, 40, 70, 55, 30, 45]
// 7 divs, flex items-end gap-2, h-12
// Alternating electric/teal color
// scaleY(0→1) on animate, 500ms easing, 80ms stagger
```

**C — Concentric Rings:**
```jsx
// 3 rings: sizes [80, 56, 32]px
// All absolute centered
// scale(0.3→1) + opacity(0→0.75/0.5/0.25) on animate
// 600ms, 180ms stagger delay
// Center dot: 8px, electric color
```

**D — Soil Layers:**
```jsx
// 6 bars: opacities [0.3, 0.5, 0.7, 0.9, 0.6, 0.4]
// flex items-end gap-1, h-12
// gradient: teal → transparent
// scaleY(0→1) on animate, 500ms, 80ms stagger
```

**Scroll animation per card:** `useInView(ref, { once: true, margin: '-100px' })` — number and content fade separately.

---

#### Section 4 — SCORE EXPLANATION

**Purpose:** Show how the S.A.F.E Score works — animated and satisfying.

**Background:** `var(--void)`

**Label (10px uppercase tracking-[0.2em], color: teal):**
`"Bagaimana skor dihitung"`

**Layout:** Two-column flex, `items-start gap-8, max-w-2xl mx-auto`

**Left — Score counter:**
```
Number: font-display font-black, clamp(4rem, 10vw, 6rem)
Color: var(--electric), letter-spacing: -0.05em
Value: animates from 0 → 86 on scroll into view (count-up, 800ms quartic ease-out)

Under number:
"dari 100" — font-body text-xs, color: text-subtle
```

**Right — Factor bars (4 items, stagger 120ms):**
```
[Seismik]    75  ████████████░░░░  electric
[Banjir]     90  ██████████████░░  teal
[Vulkanik]   85  █████████████░░░  electric
[Geoteknik]  88  █████████████░░░  teal

Each bar:
  Label: Red Hat Display 12px, color: text-muted
  Value: Archivo bold 12px, matching color (electric/teal alternate)
  Track: 4px, rounded-full, bg: oklch(0.18 0.01 290)
  Fill: width transitions from 0% → N% on scroll, 600ms easing + stagger
```

---

#### Section 5 — TRUST / DATA SOURCES

**Purpose:** Build credibility with institutional data sources.

**Background:** `oklch(0.08 0.012 290)` — darkest section for contrast

**Label:**
`"Didukung data dari"` — 10px uppercase tracking-[0.2em], color: text-subtle, centered, mb-6

**Badges row (flex wrap justify-center gap-3):**

```
BMKG        → bg: purple/0.08, border: 1px solid purple/0.20, text: #c0c0d0, font-extrabold, px-5 py-2 rounded-lg
PVMBG       → bg: teal/0.08,   border: 1px solid teal/0.20,   text: #c0c0d0, font-extrabold, px-5 py-2 rounded-lg
USGS        → bg: void-surface, border: 1px solid oklch(0.20 0.01 290), text: oklch(0.55 0.01 290), font-semibold, text-xs, px-3.5 py-1.5 rounded-md
OpenStreetMap → same as USGS
Gemini AI   → bg: purple/0.05, border: 1px dashed purple/0.20, text: oklch(0.50 0.01 290), italic, text-[11px], px-3 py-1 rounded-full
```

---

#### Section 6 — FINAL CTA + FOOTER

**Purpose:** Convert. Last chance.

**Background:** `var(--void)` with radial purple glow:
`radial-gradient(ellipse at 50% 70%, oklch(0.50 0.20 310 / 0.08), transparent 60%)`

**Layout:** `py-28 px-6 flex flex-col items-center text-center`

**Headline:**
```
"Jangan beli kucing\ndalam karung."
Font: Archivo 900, clamp(1.6rem, 4vw, 2.4rem), color: text-bright
tracking: -0.02em, white-space: pre-line
```

**Subtitle:**
```
"Cek risiko geologis sebelum beli atau sewa properti."
Font: Red Hat Display 400, 14px, color: text-muted, max-w: 28rem, mx-auto
```

**CTA Button (mt-7):**
```
"Mulai Analisis Gratis"
bg: var(--electric), color: var(--void)
Font: Archivo 800, 14px, px-9 py-3.5, rounded-lg
Hover: same glow as hero CTA
Active: scale(0.97)
```

**Footer line (mt-16):**
```
"S.A.F.E House · #JuaraVibeCoding2026"
Font: Red Hat Display 400, 10px, color: text-subtle
```

---

### 2.4 Component Architecture

All sections are separate files imported into `LandingPage.jsx`:

```
pages/LandingPage.jsx          ← COPY dict + section imports
components/landing/
  ├── HeroSection.jsx
  ├── GlobeHero.jsx            ← lazy-loaded
  ├── DemoSection.jsx
  ├── RiskSection.jsx          ← contains MiniViz + RiskCard sub-components
  ├── ScoreSection.jsx         ← contains useCountUp hook
  ├── TrustSection.jsx
  └── CTASection.jsx
```

### 2.5 Bilingual Requirements

All text in a `COPY` dict in `LandingPage.jsx`:

```javascript
const COPY = {
  id: {
    heroNav:    'Mulai →',
    heroTitle:  'Rumah aman\natau tidak?',
    heroSub:    'Cek risiko gempa, banjir dan longsor di lokasi properti Anda.',
    heroCTA:    'Cek Lokasi Sekarang',
    demoTitle:  'Klik. Analisis. Selesai.',
    demoSub:    'Pilih titik di peta, lihat hasilnya dalam 10 detik',
    demoLoc:    'Cibubur, Jakarta',
    demoRisk:   'Risiko Sedang',
    scoreLabel: 'Bagaimana skor dihitung',
    scoreOf:    'dari 100',
    trustLabel: 'Didukung data dari',
    ctaTitle:   'Jangan beli kucing\ndalam karung.',
    ctaSub:     'Cek risiko geologis sebelum beli atau sewa properti.',
    ctaBtn:     'Mulai Analisis Gratis',
  },
  en: {
    heroNav:    'Start →',
    heroTitle:  'Is your home\nsafe?',
    heroSub:    'Check earthquake, flood & landslide risk at any property location.',
    heroCTA:    'Check Location Now',
    demoTitle:  'Click. Analyze. Done.',
    demoSub:    'Pick a spot on the map, see results in 10 seconds',
    demoLoc:    'Cibubur, Jakarta',
    demoRisk:   'Medium Risk',
    scoreLabel: 'How the score works',
    scoreOf:    'out of 100',
    trustLabel: 'Powered by data from',
    ctaTitle:   "Don't buy a pig\nin a poke.",
    ctaSub:     'Check geological risk before buying or renting property.',
    ctaBtn:     'Start Free Analysis',
  },
};
```

Components receive `t(key)` helper: `const t = (key) => dict[key] ?? key`

Lang stored in Zustand (`useAppStore`), default `'id'`.

### 2.6 Animation Requirements

**Scroll animations:** Use Framer Motion `useInView`:
```javascript
import { useInView } from 'framer-motion';
const ref = useRef(null);
const inView = useInView(ref, { once: true, margin: '-80px' });
```

**CSS class for scroll reveals:**
```css
.landing-enter {
  opacity: 0;
  transform: translateY(16px);
  filter: blur(8px);
  transition: opacity 650ms cubic-bezier(0.32, 0.72, 0, 1),
              transform 650ms cubic-bezier(0.32, 0.72, 0, 1),
              filter 650ms cubic-bezier(0.32, 0.72, 0, 1);
}
/* Toggle visible via inline style when inView = true */
```

**Hero page-load animation:**
```css
@keyframes hero-fade-up {
  from { opacity: 0; transform: translateY(20px); filter: blur(6px); }
  to   { opacity: 1; transform: translateY(0); filter: blur(0); }
}
.hero-enter {
  animation: hero-fade-up 700ms cubic-bezier(0.32, 0.72, 0, 1) both;
}
```

**Map pin pulse animation:**
```css
@keyframes pin-pulse {
  0%   { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
  100% { transform: translate(-50%, -50%) scale(3.5); opacity: 0; }
}
```

**Button CTA glow:**
```css
.cta-glow:hover {
  box-shadow: 0 0 20px oklch(0.60 0.20 310 / 0.25),
              0 0 48px oklch(0.60 0.20 310 / 0.08);
}
```

**Reduced motion:**
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 2.7 Routing & Navigation

All CTA buttons: `onClick={() => navigate('/app')}` (React Router `useNavigate`)
- `/` — Landing page
- `/app` — Main app dashboard
- `/*` — Redirect to `/`

Landing page must enable page scrolling (app is non-scrollable):
```javascript
// In LandingPage.jsx useEffect:
useEffect(() => {
  document.documentElement.classList.add('landing-scroll');
  return () => document.documentElement.classList.remove('landing-scroll');
}, []);
```

```css
/* In CSS: */
html.landing-scroll,
html.landing-scroll body,
html.landing-scroll #root {
  height: auto;
  overflow: visible;
}
```

### 2.8 Dependencies Available

These are already installed in the project:

```json
{
  "react": "^19.2",
  "framer-motion": "^12.x",
  "react-router-dom": "^7.x",
  "react-globe.gl": "latest",
  "tailwindcss": "^3.4",
  "zustand": "^5.0",
  "lucide-react": "^1.16"
}
```

**DO NOT** add new dependencies unless absolutely necessary.

---

### 2.9 Accessibility Checklist

- [ ] `h1` on hero — only one per page
- [ ] `h2` on each section title
- [ ] `h3` on risk card titles
- [ ] All `<button>` elements (not `<div onClick>`)
- [ ] `aria-label` on icon-only buttons
- [ ] Minimum 4.5:1 contrast for body text
- [ ] `focus-visible` outline: `2px solid var(--electric), offset: 2px`
- [ ] `prefers-reduced-motion` supported
- [ ] `<nav>` wrapping navigation
- [ ] `<section>` for each page section

### 2.10 Performance Requirements

- Globe component lazy-loaded via `React.lazy` + `Suspense`
- Loading fallback: animated pulse circle (same size as globe)
- IntersectionObserver pauses globe rotation when out of viewport
- No external images — all CSS/SVG/WebGL only
- Tailwind purge in production (unused classes removed)

---

## Part 3 — Improvement Opportunities (Optional Enhancements)

These are not in the current build but would make the landing page significantly better:

| Enhancement | Impact | Effort |
|-------------|--------|--------|
| Animated gradient mesh behind hero | Very high visual impact | Medium |
| Real Leaflet map preview in DemoSection | Shows actual product | Medium |
| Spotlight/beam effect on CTA button | Premium feel | Low |
| Testimonial/quote section | Social proof | Low |
| Animated number counters for stats ("40+ faults", "80+ volcanoes") | Credibility | Low |
| Mobile hamburger menu | Better mobile nav | Low |
| Smooth section scroll with anchor links | Better UX | Low |
| Loading progress bar at top of page | Polish | Low |
| SEO meta tags + og:image | Discoverability | Low |
| Video/GIF of app in use | Conversion boost | High |

---

## Part 4 — Quick Reference

### Section Summary Table

| # | Section | Background | Height | Key Element |
|---|---------|-----------|--------|-------------|
| 1 | Hero | `--void` | 100vh | 3D globe + headline + CTA |
| 2 | Demo Preview | `oklch(0.12 0.015 290)` | auto | Mock map + risk card |
| 3 | Risk Types (×4) | alternating void | 70vh each | Scroll-reveal + mini viz |
| 4 | Score | `--void` | auto | Count-up animation + bars |
| 5 | Trust | `oklch(0.08 0.012 290)` | auto | Institution badges |
| 6 | CTA + Footer | `--void` + purple glow | auto | Final CTA button |

### Key CSS Variables Cheatsheet

```css
/* Colors */
--void        /* background */
--void-surface /* cards */
--void-border  /* borders */
--electric     /* purple - CTAs */
--teal         /* teal - labels */
--text-bright  /* white headings */
--text-muted   /* body text */
--text-subtle  /* captions */
--risk-safe    /* green */
--risk-moderate /* amber */
--risk-danger  /* red */
```

### Risk Bar Color Map

```
Seismik → var(--electric)      or amber (#f59e0b)
Banjir  → var(--teal)          or green (#10b981)
Vulkanik → var(--risk-danger)  red     (#ef4444)
Geoteknik → var(--teal)        or teal
```

---

**This document is the complete spec for building the S.A.F.E House landing page.**
**Feed Part 2 (Section 2.1–2.10) into Google AI Studio as the build target.**
