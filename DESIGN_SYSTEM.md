# S.A.F.E House — App Design System

**Version:** 3.0 — "Mocha Command Center"
**Date:** May 23, 2026
**Scope:** Main App UI (/app) — map dashboard, panels, cards, drawers
**NOT for:** Landing page (uses separate "Void & Electric" purple system)

---

## 1. Brand Concept

**Aesthetic:** Warm dark command center — like a geological field terminal. Matte black with copper/amber accents.

**Tone:** Professional. Scientific. Trustworthy. Indonesian.

**Design Goal:** UI harus terasa seperti instrumen presisi, bukan dashboard SaaS generik. Peta tetap jadi fokus utama. Panel bersifat ringan — glass layer di atas peta, bukan menghalanginya.

---

## 2. Color Palette — Warm Dark ("Mocha")

### Base Surfaces

| Token (Tailwind) | Value | Usage |
|-----------------|-------|-------|
| `bg` | `#0f0b08` | App background — near-black with warm undertone |
| `bg-surface` | `rgba(22, 14, 8, 0.88)` | Panel & card backgrounds (with alpha) |
| `bg-elevated` | `#1a1208` | Elevated surfaces — popovers, dropdowns |

### Text

| Token | Value | Usage |
|-------|-------|-------|
| `text-primary` | `#f0e4cc` | Headlines, labels, important values |
| `text-secondary` | `#c4a87e` | Body text, descriptions, secondary info |
| `text-muted` | `#7d6245` | Captions, timestamps, subtle metadata |

### Accent — Copper/Amber

| Token | Value | Usage |
|-------|-------|-------|
| `accent` | `#d4956a` | Primary accent — icons, highlights, active states |
| `accent-hover` | `#b87a52` | Hover state for accent elements |

### Risk Colors

| Level | Token | Value | Usage |
|-------|-------|-------|-------|
| Safe | `risk-safe` | `#10b981` | Low risk — green |
| Moderate | `risk-moderate` | `#f59e0b` | Medium risk — amber |
| Danger | `risk-danger` | `#ef4444` | High risk — red |

### Borders & Dividers

```css
/* Global default border color */
border-color: rgba(255, 210, 170, 0.07);  /* warm amber tint, very subtle */

/* Slightly stronger for interactive borders */
border-color: rgba(255, 210, 170, 0.12);

/* Glass panel borders */
border-color: rgba(255, 210, 170, 0.10);
```

### Raw Hex Reference (for non-Tailwind use)

```
Background:     #0f0b08
Surface:        #160e08 (approx)
Elevated:       #1a1208
Text bright:    #f0e4cc
Text secondary: #c4a87e
Text muted:     #7d6245
Accent:         #d4956a
Accent hover:   #b87a52
Border warm:    rgba(255, 210, 170, 0.07–0.14)
Risk green:     #10b981
Risk amber:     #f59e0b
Risk red:       #ef4444
```

---

## 3. Typography

### Font Stack

| Role | Font | Fallback | Weight |
|------|------|---------|--------|
| Display / Score numbers | `Archivo` | ui-sans-serif | 700–900 |
| Body / UI text | `Red Hat Display` | ui-sans-serif | 400–600 |
| Data / coordinates / metrics | `Azeret Mono` | ui-monospace | 400–500 |
| General UI / panels | `Inter` | ui-sans-serif | 400–700 |
| Code / AI report | `Geist Mono` | ui-monospace | 400–600 |

Load via Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Geist+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
```

### Type Scale (App Panels)

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Panel title | 14–16px | 700 | text-primary |
| Section label | 9–10px, uppercase, tracking-[0.2em] | 700 | text-muted |
| Data value (big) | 28–48px | 800–900 | text-primary or accent |
| Data value (small) | 14–20px | 600–700 | text-primary |
| Unit/suffix | 10–12px | 400 | text-muted |
| Body/description | 12–14px | 400 | text-secondary |
| Caption | 10–11px | 400 | text-muted |
| Score number | 48–72px | 900 | accent or risk color |
| Badge text | 10–11px | 600–700 | various |

### Letter Spacing
- Panel titles: `letter-spacing: -0.01em`
- Section labels: `letter-spacing: 0.2em` (wide, uppercase)
- Data numbers: `letter-spacing: -0.02em` to `tabular-nums`
- Body: normal

---

## 4. Spacing & Layout

### App Layout Grid
```
Full screen: h-screen w-screen overflow-hidden
Z-layers:
  z-0   → MapArea (Leaflet)
  z-5   → LoadingBeam (top bar progress)
  z-10  → TopBar
  z-20  → LeftPanel (floating)
  z-25  → DisasterLayersPanel
  z-20  → ChatbotFab
  z-30  → AuditDrawer (bottom sheet)
  z-40  → CommandPalette
  z-45  → OnboardingOverlay
  z-50  → Toaster
```

### Panel Dimensions
| Panel | Width | Position |
|-------|-------|----------|
| LeftPanel | ~380px | left: 16px, top: 64px |
| TopBar | 100% | top: 0, fixed |
| ChatbotFab collapsed | ~280px pill | bottom-right |
| ChatbotFab expanded | ~360px | bottom-right |
| AuditDrawer | 100% | bottom, 78vh height |

### Internal Spacing (Cards & Panels)
| Context | Value |
|---------|-------|
| Panel padding | `px-4 py-4` or `p-5` |
| Card padding | `p-3` to `p-4` |
| Between label and value | `mt-0.5` to `mt-1` |
| Between cards | `gap-3` |
| Section label margin | `mb-1.5` |
| Icon size (default) | `h-4 w-4` (16px) |
| Icon size (compact) | `h-3.5 w-3.5` (14px) |

### Border Radius
| Element | Value |
|---------|-------|
| Main panels | `rounded-xl` (12px) to `rounded-2xl` (16px) |
| Cards within panel | `rounded-lg` (8px) |
| Small badges/chips | `rounded-md` (6px) to `rounded-full` |
| Buttons | `rounded-lg` (8px) |
| Tooltips | `rounded-xl` (10px) |
| Drawer | `rounded-t-2xl` (top corners only) |

---

## 5. Surface Patterns

### Glass Panel (Standard)
Used for: LeftPanel, ChatbotFab, TopBar

```css
.glass {
  background: rgba(22, 14, 8, 0.80);
  backdrop-filter: blur(24px) saturate(150%);
  -webkit-backdrop-filter: blur(24px) saturate(150%);
  border: 1px solid rgba(255, 210, 170, 0.10);
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.40),
              0 1px 4px rgba(0, 0, 0, 0.25);
}
```

### Glass Strong (Drawer / Modal)
Used for: AuditDrawer, CommandPalette, Dialogs

```css
.glass-strong {
  background: rgba(26, 17, 10, 0.90);
  backdrop-filter: blur(32px) saturate(170%);
  -webkit-backdrop-filter: blur(32px) saturate(170%);
  border: 1px solid rgba(255, 210, 170, 0.12);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.50),
              0 2px 8px rgba(0, 0, 0, 0.30);
}
```

### Double-Bezel (Premium Cards)
Used for: SafeScoreCard, main highlight cards — gives machined hardware feel

```css
.bezel-outer {
  background: rgba(255, 210, 170, 0.03);
  border: 1px solid rgba(255, 210, 170, 0.08);
  padding: 5px;
  border-radius: 1.25rem; /* 20px */
}

.bezel-inner {
  background: rgba(15, 11, 8, 0.65);
  border-radius: calc(1.25rem - 5px);
  box-shadow: inset 0 1px 1px rgba(255, 210, 170, 0.08),
              0 2px 12px rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 210, 170, 0.06);
}
```

### Shimmer Skeleton
Used for loading states

```css
.shimmer {
  background: linear-gradient(
    90deg,
    rgba(212, 149, 106, 0.04) 0%,
    rgba(212, 149, 106, 0.10) 50%,
    rgba(212, 149, 106, 0.04) 100%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s linear infinite;
}
```

---

## 6. Component Patterns

### Buttons

| Type | Style |
|------|-------|
| Primary | `bg-accent text-bg font-semibold rounded-lg px-4 py-2` |
| Secondary | `bg-white/5 border border-white/10 text-text-primary rounded-lg px-4 py-2` |
| Ghost | `text-text-secondary hover:text-text-primary hover:bg-white/5` |
| Icon-only | `rounded-lg p-2 hover:bg-white/5` |
| Danger | `bg-risk-danger/10 border border-risk-danger/20 text-risk-danger` |

All buttons: press feedback via `.btn-press` class:
```css
.btn-press {
  transition: transform 150ms cubic-bezier(0.32, 0.72, 0, 1),
              box-shadow 150ms cubic-bezier(0.32, 0.72, 0, 1);
}
.btn-press:active {
  transform: scale(0.97);
}
```

### Badges / Risk Chips

```
Safe chip:     bg: risk-safe/10,     border: risk-safe/20,     text: risk-safe
Moderate chip: bg: risk-moderate/10, border: risk-moderate/20, text: risk-moderate
Danger chip:   bg: risk-danger/10,   border: risk-danger/20,   text: risk-danger
Accent chip:   bg: accent/15,        border: accent/30,        text: accent
```

### Section Labels (Panel headers)
```css
/* Always above a data block */
font-size: 9–10px;
font-weight: 700;
text-transform: uppercase;
letter-spacing: 0.2em;
color: text-muted; /* #7d6245 */
margin-bottom: 6px;
```

### Data Numbers
```css
/* Big metric values */
font-family: 'Azeret Mono', monospace;
font-variant-numeric: tabular-nums;
letter-spacing: -0.02em;
color: text-primary; /* #f0e4cc */
```

### Pulse Dot (Active indicators)
```css
.pulse-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: currentColor;
  position: relative;
}
.pulse-dot::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.35;
  animation: pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;
}
```

---

## 7. Map Components

### Map Style
- **Tile layer:** Carto Positron (light, clean street map)
- **Background:** `#e8e4df` (warm parchment — complements the dark UI)
- Leaflet zoom controls: hidden (`display: none`)
- Attribution: glassmorphism style with warm tint

### Map Marker
```css
/* Glow effect on active pin */
.marker-glow {
  filter: drop-shadow(0 0 8px rgba(212, 149, 106, 0.60))
          drop-shadow(0 0 16px rgba(212, 149, 106, 0.28));
}
```

### Risk Zone Overlay
Colored zones drawn over map:
- Safe zones: `#10b981` with low opacity fill
- Moderate zones: `#f59e0b` with low opacity fill
- Danger zones: `#ef4444` with low opacity fill

### Risk Tooltip (on zone hover)
```css
.risk-tooltip {
  background: rgba(15, 11, 8, 0.92) !important;
  border: 1px solid rgba(255, 210, 170, 0.16) !important;
  border-radius: 10px !important;
  color: #f0e4cc !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4) !important;
  padding: 6px 10px !important;
}
```

---

## 8. Data Visualization

### S.A.F.E Score — Circular Gauge
- Range: 0–100
- Track color: `rgba(255, 210, 170, 0.08)` (warm dim)
- Fill color: risk color (green/amber/red based on score)
- Number: Archivo 900, large, centered
- Label "MODERATE/SAFE/DANGER": badge below number

### Risk Radar — 5-Axis Chart (Recharts)
- Axes: Flood, Soil, Air, Seismic, Elevation
- Fill: `rgba(212, 149, 106, 0.15)`
- Stroke: `#d4956a` (accent copper)
- Grid lines: `rgba(255, 210, 170, 0.06)`

### PGA Distribution — Gaussian Curve (SVG)
- Curve fill: gradient from accent to transparent
- Marker line: accent color vertical
- Safe/Moderate/Critical zones: labeled on x-axis

### Seismic Waveform (SVG/Canvas)
- Waveform color: `#10b981` (green) — seismic safe feel
- Background: transparent
- Fault name label below

### Progress Bars (Risk breakdown)
- Track: `rgba(255, 255, 255, 0.06)`
- Fill: risk color matching metric
- Height: 3–4px, rounded-full

---

## 9. AI Report Styles (Markdown)

The `AuditDrawer` renders AI-generated markdown. Style via `.prose-safe` class:

```css
.prose-safe {
  color: #c4a87e;         /* text-secondary */
  font-size: 14px;
  line-height: 1.75;
}

.prose-safe h1, h2, h3 {
  color: #f0e4cc;         /* text-primary */
  font-weight: 700;
  letter-spacing: -0.02em;
}

.prose-safe h1 {
  font-size: 1.45em;
  border-bottom: 1px solid rgba(255, 210, 170, 0.10);
  padding-bottom: 0.4em;
}

.prose-safe h2 { font-size: 1.15em; color: #d4956a; }  /* accent */
.prose-safe h3 { font-size: 1.02em; color: #e0a87a; }

.prose-safe strong { color: #f0e4cc; font-weight: 700; }
.prose-safe em { color: #e0a87a; }

.prose-safe code {
  background: rgba(212, 149, 106, 0.12);
  color: #d4956a;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Geist Mono', monospace;
  border: 1px solid rgba(212, 149, 106, 0.22);
}

.prose-safe blockquote {
  border-left: 3px solid #d4956a;
  background: rgba(212, 149, 106, 0.05);
  color: #9a7c5a;
}

.prose-safe table {
  border: 1px solid rgba(255, 210, 170, 0.10);
}

.prose-safe th {
  background: rgba(255, 210, 170, 0.06);
  color: #f0e4cc;
  border-bottom: 1px solid rgba(255, 210, 170, 0.10);
}

.prose-safe td {
  color: #c4a87e;
  border-bottom: 1px solid rgba(255, 210, 170, 0.06);
}
```

---

## 10. Toast Notifications

```javascript
// Sonner config (in App.jsx)
<Toaster
  theme="dark"
  toastOptions={{
    style: {
      background: 'rgba(26, 17, 10, 0.94)',
      border: '1px solid rgba(255, 210, 170, 0.14)',
      backdropFilter: 'blur(24px)',
      color: '#f0e4cc',
    }
  }}
/>
```

---

## 11. Scrollbar

```css
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: rgba(212, 149, 106, 0.18);
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(212, 149, 106, 0.32);
}
```

---

## 12. Accessibility

### Focus State
```css
:focus-visible {
  outline: 2px solid #d4956a;  /* accent copper */
  outline-offset: 2px;
  border-radius: 4px;
}
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Contrast Targets
- `text-primary` (#f0e4cc) on `bg` (#0f0b08): **~13:1** — AAA
- `text-secondary` (#c4a87e) on `bg`: **~7:1** — AAA
- `text-muted` (#7d6245) on `bg`: **~3.2:1** — AA Large only ⚠️
- `accent` (#d4956a) on `bg`: **~4.8:1** — AA ✓
- Risk green (#10b981) on `bg`: **~5.1:1** — AA ✓
- Risk amber (#f59e0b) on `bg`: **~6.9:1** — AA ✓
- Risk red (#ef4444) on `bg`: **~4.7:1** — AA ✓

> ⚠️ `text-muted` fails AA for body-size text. Use only for non-essential captions/labels (10px+).

---

## 13. What to Redesign (Current Pain Points)

This section documents known issues for the upcoming redesign:

| Component | Issue | Suggested Fix |
|-----------|-------|---------------|
| LeftPanel header | Cluttered — too many elements in top row | Simplify to logo + mode badge only |
| SafeScoreCard | Score gauge looks generic | Custom arc gauge with gradient fill |
| MetricsGrid | 4 cards feel cramped at small widths | Reduce to 2×2 grid with better hierarchy |
| RadarChart | Recharts default look — too thin | Thicker stroke, glow on data polygon |
| AuditDrawer header | Button row too wide on mobile | Collapse copy/export into icon buttons |
| ChatbotFab | Expanded panel shadow too subtle | Stronger glass-strong treatment |
| TopBar | Mode toggle feels disconnected from modes | More distinct active state with pill highlight |
| Risk badges on map | Color contrast on parchment map bg | Darker stroke/outline for legibility |
| Onboarding spotlight | Hard edge — no blur on mask | Add blur transition to spotlight mask |
| Section labels | Inconsistent uppercase tracking across panels | Standardize: 9px, 700, tracking-[0.2em] |

---

## 14. Design Token Quick Reference

```javascript
// tailwind.config.js — current tokens
colors: {
  bg: {
    DEFAULT: '#0f0b08',
    surface: 'rgba(22, 14, 8, 0.88)',
    elevated: '#1a1208',
  },
  text: {
    primary:   '#f0e4cc',
    secondary: '#c4a87e',
    muted:     '#7d6245',
  },
  risk: {
    safe:     '#10b981',
    moderate: '#f59e0b',
    danger:   '#ef4444',
  },
  accent: {
    DEFAULT: '#d4956a',
    hover:   '#b87a52',
  },
},
fontFamily: {
  sans:    ['Inter', ...],
  mono:    ['"Geist Mono"', ...],
  display: ['Archivo', ...],
  body:    ['"Red Hat Display"', ...],
  data:    ['"Azeret Mono"', ...],
},
boxShadow: {
  glass:       '0 2px 16px rgba(0,0,0,0.35), 0 1px 4px rgba(0,0,0,0.25)',
  'glass-lg':  '0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.28)',
  glow:        '0 0 20px rgba(212, 149, 106, 0.35)',
  'glow-safe': '0 0 20px rgba(16, 185, 129, 0.35)',
  'glow-danger': '0 0 20px rgba(239, 68, 68, 0.35)',
},
```

---

**This document covers the app dashboard design system only.**
**For landing page design (purple "Void & Electric" theme) → see `LANDING_PAGE_HANDOFF.md`**
