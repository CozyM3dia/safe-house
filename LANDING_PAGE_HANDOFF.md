# S.A.F.E House Landing Page — Handoff for Remake

**Date:** May 23, 2026
**Purpose:** Complete reference for rebuilding the landing page in Google AI Studio (Gemini)

---

## Project Context

**S.A.F.E House** (Seismic Analysis for Foundation Evaluation) — a geophysics property risk analysis web app for Indonesia. Users click anywhere on a map, get AI-powered geological risk scores (seismic, flood, volcanic, geotechnical).

**Competition:** #JuaraVibeCoding2026
**Stack:** React 19 + Vite 8 + Tailwind CSS 3 + Framer Motion 12

---

## Current Landing Page Architecture

**Entry:** `frontend/src/pages/LandingPage.jsx` — main page component
**Sections:** 7 component files in `frontend/src/components/landing/`
**Route:** `/` (root path), app lives at `/app`

### File Structure
```
pages/LandingPage.jsx          ← orchestrator, COPY dict, lang switch
components/landing/
  ├── HeroSection.jsx          ← fullscreen hero with globe + CTA
  ├── GlobeHero.jsx            ← 3D rotating globe (react-globe.gl)
  ├── DemoSection.jsx          ← mock map + risk bars preview
  ├── RiskSection.jsx          ← 4 risk type cards (scroll-reveal)
  ├── ScoreSection.jsx         ← animated score counter + progress bars
  ├── TrustSection.jsx         ← data source badges (BMKG, PVMBG, etc.)
  └── CTASection.jsx           ← final CTA + footer
```

### Section Flow (top to bottom)
1. **HeroSection** — Full-screen, 3D globe background, headline "Rumah aman atau tidak?", CTA button
2. **DemoSection** — Side-by-side: mock map grid + risk summary card (score 72, 3 bars)
3. **RiskSection** — 4 full-height scroll cards: Seismic, Flood, Volcanic, Geotechnical (each with mini data viz)
4. **ScoreSection** — Animated count-up to "86", 4 progress bars (Seismik, Banjir, Vulkanik, Geoteknik)
5. **TrustSection** — Data source badges: BMKG, PVMBG, USGS, OpenStreetMap, Gemini AI
6. **CTASection** — Final CTA: "Jangan beli kucing dalam karung." with purple button

---

## Design System — "Void & Electric"

### Color Palette (CSS custom properties)
```css
--void:          oklch(0.10 0.015 290);  /* Near-black background */
--void-surface:  oklch(0.15 0.01 290);   /* Card backgrounds */
--void-elevated: oklch(0.18 0.01 290);   /* Elevated surfaces */
--void-border:   oklch(0.22 0.01 290);   /* Subtle borders */
--electric:      oklch(0.60 0.20 310);   /* Purple/violet accent — PRIMARY */
--electric-dim:  oklch(0.45 0.15 310);   /* Dimmed purple */
--teal:          oklch(0.55 0.15 200);   /* Teal secondary accent */
--teal-dim:      oklch(0.40 0.10 200);   /* Dimmed teal */
--text-bright:   oklch(0.96 0.005 290);  /* White headings */
--text-muted:    oklch(0.45 0.01 290);   /* Body/description text */
--text-subtle:   oklch(0.35 0.01 290);   /* Very subtle labels */
--risk-safe:     oklch(0.68 0.18 145);   /* Green */
--risk-moderate: oklch(0.72 0.14 75);    /* Yellow/amber */
--risk-danger:   oklch(0.62 0.20 25);    /* Red */
```

### Hex Equivalents (for easier use)
```
Background:  #0a0c10 (near-black with blue-purple tint)
Surface:     #1a1520 (dark cards)
Electric:    ~#a855f7 (vibrant purple)
Teal:        ~#14b8a6
Text bright: #f5f5f5
Text muted:  #6b7280
Risk safe:   #10b981
Risk moderate: #f59e0b
Risk danger: #ef4444
```

### Typography
```
Headlines:    font-family: 'Archivo', sans-serif — font-weight: 800-900, tracking: -0.02em to -0.03em
Body text:    font-family: 'Red Hat Display', sans-serif — 400-600
Data/mono:    font-family: 'Azeret Mono', monospace
Fallback:     font-family: 'Inter', sans-serif
```

### Font Sizes (responsive clamp)
```
Hero title:   clamp(2.4rem, 6vw, 3.8rem)
Section h2:   clamp(1.5rem, 3vw, 2rem)
Risk h3:      clamp(1.6rem, 4vw, 2.2rem)
Score number: clamp(4rem, 10vw, 6rem)
Body text:    clamp(0.85rem, 1.5vw, 1rem)
Labels:       10-11px uppercase tracking-[0.2em]
```

### Animation System
- **Entrance:** `landing-enter` class — translateY(16px) + blur(8px) → 0, 650ms cubic-bezier(0.32, 0.72, 0, 1)
- **Hero stagger:** `hero-enter` with animation-delay (100ms, 300ms, 450ms, 600ms)
- **CTA glow:** box-shadow: 0 0 20px purple/0.25 + 0 0 48px purple/0.08 on hover
- **Button press:** scale(0.97) on :active
- **ScrollInView:** Each section uses framer-motion `useInView` with `once: true`

### Card/Surface Pattern
```
Background: oklch(0.12 0.01 290) or var(--void-surface)
Border: 1px solid var(--void-border)
Border-radius: rounded-xl (0.75rem) to rounded-lg (0.5rem)
Subtle grid overlay for map mockup: repeating-linear-gradient 20px grid
```

---

## Bilingual Copy

### Indonesian (default)
| Key | Text |
|-----|------|
| heroNav | Mulai → |
| heroTitle | Rumah aman\natau tidak? |
| heroSub | Cek risiko gempa, banjir dan longsor di lokasi properti Anda. |
| heroCTA | Cek Lokasi Sekarang |
| demoTitle | Klik. Analisis. Selesai. |
| demoSub | Pilih titik di peta, lihat hasilnya dalam 10 detik |
| scoreLabel | Bagaimana skor dihitung |
| trustLabel | Didukung data dari |
| ctaTitle | Jangan beli kucing\ndalam karung. |
| ctaSub | Cek risiko geologis sebelum beli atau sewa properti. |
| ctaBtn | Mulai Analisis Gratis |

### English
| Key | Text |
|-----|------|
| heroNav | Start → |
| heroTitle | Is your home\nsafe? |
| heroSub | Check earthquake, flood & landslide risk at any property location. |
| heroCTA | Check Location Now |
| demoTitle | Click. Analyze. Done. |
| demoSub | Pick a spot on the map, see results in 10 seconds |
| scoreLabel | How the score works |
| trustLabel | Powered by data from |
| ctaTitle | Don't buy a pig\nin a poke. |
| ctaSub | Check geological risk before buying or renting property. |
| ctaBtn | Start Free Analysis |

---

## Risk Categories (4 types)

| # | Type | ID Title | Description |
|---|------|----------|-------------|
| 01 | Seismic | Risiko Seismik | Active faults, megathrust zones, 50yr earthquake history, VS30 soil classification |
| 02 | Flood | Risiko Banjir | Elevation, river/coastline distance, annual rainfall, drainage capacity |
| 03 | Volcanic | Risiko Vulkanik | Active volcano distance, lahar paths, PVMBG danger zones, eruption history |
| 04 | Geotechnical | Risiko Geoteknik | Soil type, slope grade, liquefaction potential, subsidence history |

Each has animated mini data viz: seismogram line, bar chart, concentric rings, layered bars.

---

## Globe Component Details

**Library:** react-globe.gl (Three.js based)
**Texture:** earth-night.jpg from unpkg CDN
**Settings:**
- Center: Indonesia (-2.5°, 118°, altitude 2.5)
- Auto-rotate: 0.4 speed
- Atmosphere: purple (#a040a8), altitude 0.18
- Graticules: dark gray (#2d2a32)
- Seismic dots: 8 Indonesian cities (Jakarta, Yogyakarta, Bali, Pekanbaru, Lampung, Palu, Manado, Palembang)
- Dot color: #c050c8 (purple)
- No zoom, no pan, limited polar rotation

---

## Data Sources (Trust Section)

**Primary (prominent):** BMKG, PVMBG
**Secondary (smaller):** USGS, OpenStreetMap
**AI (dashed border):** Gemini AI

---

## What Needs Improvement

1. **Mobile responsiveness** — Risk cards at min-h-[70vh] too tall on mobile
2. **Hero globe** — Heavy 3D dependency (react-globe.gl ~500KB), consider lighter alternative
3. **DemoSection** — Mock map is static grid overlay, could show real map preview
4. **Performance** — Globe + Framer Motion + landing-enter transitions = heavy on low-end devices
5. **Accessibility** — Missing skip links, aria-labels on data viz, reduced-motion support partial
6. **SEO** — No meta tags, no structured data, no og:image
7. **CTA clarity** — "Jangan beli kucing dalam karung" — Indonesian idiom, may confuse some users
8. **Visual polish** — Risk section mini-viz are thin SVG/div animations, could be more impressive
9. **Social proof** — No user testimonials, case studies, or usage stats
10. **Footer** — Just one line "S.A.F.E House · #JuaraVibeCoding2026", needs proper footer

---

## Navigation

- Nav bar: "S.A.F.E HOUSE" logo (text) + "ID / EN" lang toggle + "Mulai →" button
- All CTA buttons → `navigate('/app')` (React Router)
- No anchor scroll links between sections currently

---

## Dependencies Used in Landing

```
react-globe.gl          ← 3D globe (heavy, ~500KB)
framer-motion           ← useInView for scroll animations
react-router-dom        ← useNavigate for CTA links
```

No other landing-specific deps. All styling is inline styles + CSS custom properties + Tailwind utility classes.

---

## Key Design Decisions

1. **Dark-first design** — void black (#0a0c10) with purple electric accents
2. **Scroll-reveal pattern** — Each section fades up + deblurs on scroll into view
3. **Data viz as decoration** — Mini seismogram, bars, rings are decorative, not interactive
4. **Bilingual from day one** — All copy in COPY dict, switchable via Zustand lang state
5. **No images** — Everything is CSS/SVG/WebGL, no static image assets needed
6. **Mobile-first font sizing** — All font-size uses clamp() for fluid scaling

---

**Use this document + the AI Studio prompt (LANDING_PAGE_PROMPT.md) to rebuild.**
