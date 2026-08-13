# Prompt for Google AI Studio — Remake S.A.F.E House Landing Page

Copy everything below the line into Google AI Studio:

---

You are an elite frontend developer and UI designer. Build me a stunning, award-winning landing page for **S.A.F.E House** (Seismic Analysis for Foundation Evaluation) — a geophysics property risk analysis web app for Indonesia.

## Tech Stack (MUST use)
- React 19 with functional components and hooks
- Tailwind CSS 3 for styling
- Framer Motion for animations
- React Router v7 (`useNavigate` for CTA → `/app`)
- TypeScript optional but preferred

## Project Context
S.A.F.E House lets users click anywhere on an Indonesia map and get an AI-powered geological risk assessment. It analyzes seismic risk, flood risk, volcanic risk, and geotechnical risk, then outputs a composite "S.A.F.E Score" from 0-100.

This is for a competition (#JuaraVibeCoding2026) so the landing page must be **visually impressive**, **polished**, and make judges say "wow."

## Design System — "Void & Electric"

### Color Palette
Use oklch colors for precision. The theme is **deep dark void with purple electric accents and teal secondary**:

```
Background:     oklch(0.10 0.015 290)   — near-black with blue-purple tint
Surface:        oklch(0.15 0.01 290)    — dark cards
Elevated:       oklch(0.18 0.01 290)    — hover states
Border:         oklch(0.22 0.01 290)    — subtle borders
Electric:       oklch(0.60 0.20 310)    — vibrant purple — PRIMARY ACCENT
Electric dim:   oklch(0.45 0.15 310)    — muted purple
Teal:           oklch(0.55 0.15 200)    — secondary accent
Text bright:    oklch(0.96 0.005 290)   — white headings
Text muted:     oklch(0.45 0.01 290)    — body text
Text subtle:    oklch(0.35 0.01 290)    — labels
Risk safe:      oklch(0.68 0.18 145)    — green
Risk moderate:  oklch(0.72 0.14 75)     — amber
Risk danger:    oklch(0.62 0.20 25)     — red
```

### Typography
- Headlines: `font-family: 'Archivo', sans-serif` — weight 800-900, tracking -0.02em to -0.03em
- Body: `font-family: 'Red Hat Display', sans-serif` — weight 400-600
- Data/numbers: `font-family: 'Azeret Mono', monospace`
- Use `clamp()` for all font sizes. Hero title: `clamp(2.4rem, 6vw, 3.8rem)`, section titles: `clamp(1.5rem, 3vw, 2rem)`

### Animation Principles
- Entrance: elements translate up 16-20px + blur 6-8px → 0, with cubic-bezier(0.32, 0.72, 0, 1) easing, 600-700ms
- Stagger delays: 100ms between sibling elements
- Scroll-triggered: use Framer Motion `useInView` with `once: true`
- Buttons: scale(0.97) on active press, glow shadow on hover
- Prefer physics-based feel. No bounce. Smooth deceleration.

## Page Structure — 6 Sections

### Section 1: Hero (fullscreen)
- Full viewport height, deep void background
- **3D interactive globe** centered showing Indonesia with seismic dots (or a stunning visual alternative like an animated particle field, topographic mesh, or satellite-style map visualization)
- Headline: "Rumah aman atau tidak?" (bold, large, bottom-left)
- Subtitle: "Cek risiko gempa, banjir dan longsor di lokasi properti Anda."
- Purple CTA button: "Cek Lokasi Sekarang" with glow effect
- Top nav: "S.A.F.E HOUSE" (left), "ID / EN" + "Mulai →" button (right)
- Gradient fade to next section at bottom

### Section 2: Demo Preview
- Title: "Klik. Analisis. Selesai."
- Side-by-side layout: mock map (left, with animated pin pulse) + risk summary card (right, score 72/100 with 3 risk bars)
- Risk bars: Seismik (65%, amber), Banjir (85%, green), Vulkanik (35%, red)
- Animated on scroll into view

### Section 3: Risk Types (4 cards)
- Each risk type gets a prominent card or full-width section:
  1. **Risiko Seismik** — with seismogram line animation (SVG polyline draw)
  2. **Risiko Banjir** — with animated bar chart
  3. **Risiko Vulkanik** — with concentric pulse rings
  4. **Risiko Geoteknik** — with soil layer visualization
- Each card has: number (01-04), teal label, title, 2-line description, mini data viz
- Scroll-reveal: fade up + deblur

### Section 4: Score Explanation
- Big animated counter: "86" (count up on scroll)
- Label: "dari 100" / "out of 100"
- 4 horizontal progress bars: Seismik (75), Banjir (90), Vulkanik (85), Geoteknik (88)
- Bars animate width from 0% with stagger delay

### Section 5: Trust / Data Sources
- Label: "Didukung data dari"
- Badge pills: BMKG (primary), PVMBG (primary), USGS (secondary), OpenStreetMap (secondary), Gemini AI (dashed border, italic)
- Minimal section, just build trust

### Section 6: Final CTA + Footer
- Headline: "Jangan beli kucing dalam karung."
- Subtitle: "Cek risiko geologis sebelum beli atau sewa properti."
- Purple CTA: "Mulai Analisis Gratis"
- Subtle radial purple glow behind CTA
- Footer line: "S.A.F.E House · #JuaraVibeCoding2026"

## Bilingual Support
All text must be in a COPY dictionary object with `id` and `en` keys. Component receives a `t(key)` helper function. Default language: Indonesian.

## Critical Requirements

1. **NO generic AI look** — avoid flat cards, boring gradients, stock-photo energy. Make it feel like a premium geospatial product.
2. **Dark theme only** — no light mode toggle needed
3. **Scroll-driven animations** — each section animates on scroll into view using Framer Motion
4. **Mobile responsive** — use clamp() for fonts, flex-wrap for layouts, reasonable section heights on mobile
5. **Performance** — lazy load heavy components (globe), use `will-change` sparingly, prefer CSS animations over JS where possible
6. **Accessibility** — minimum AA contrast on body text, focus-visible outlines, semantic HTML (section, nav, h1-h3, button)
7. **No external images** — everything is CSS, SVG, canvas, or WebGL
8. **Component separation** — each section is its own component file, imported into LandingPage.jsx

## Output Format
Return the complete code for:
1. `LandingPage.jsx` — main page with COPY dict and section imports
2. `HeroSection.jsx` — with globe/visual
3. `DemoSection.jsx` — mock preview
4. `RiskSection.jsx` — 4 risk type cards
5. `ScoreSection.jsx` — animated score
6. `TrustSection.jsx` — data source badges
7. `CTASection.jsx` — final CTA + footer

Also include any CSS needed (custom animations, keyframes) that should go in `index.css`.

## Design Inspiration
- **Vercel.com** — clean dark layouts, subtle gradients, precision spacing
- **Linear.app** — bold headlines, smooth scroll reveals, purple accents
- **Stripe.com** — data visualizations as hero art, gradient meshes
- **Apple.com** — cinematic scroll storytelling, one idea per viewport
- **Aceternity UI** — animated gradient meshes, spotlight effects, bento grids

Make this landing page competition-winning. Every pixel should feel intentional. The judges should feel like they're looking at a real SaaS product, not a hackathon project.
