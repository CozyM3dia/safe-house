# S.A.F.E House -- Full UI Design Specification for Stitch

## App Identity

**Name:** S.A.F.E House (Seismic Assessment for Foundation Evaluation)
**Tagline:** "Indonesia's First AI-Powered Geophysical Property Risk Intelligence Platform"
**Purpose:** A web-based command center that evaluates the geological safety of any property in Indonesia. Users click a location on a map and receive instant geophysical risk analysis (earthquake, flood, soil liquefaction, landslide, air quality), a 0-100 safety score, and an AI-generated audit report.

**Target Audience:** Indonesian homebuyers, real estate investors, civil engineers, geotechnical consultants, insurance underwriters.

**Competition Context:** Built for Vibe Coding 2026 -- must look Bloomberg Terminal-tier polished.

---

## Design Language

### Aesthetic: "Geophysics Command Center"
Dark, warm-toned dashboard overlaying a full-bleed map. Think: satellite ground station control room meets luxury fintech app. Minimal, data-dense, every pixel purposeful.

### Color System (Dark + Warm Amber)
- **Background:** #0f0b08 (deep warm black, like dark mahogany)
- **Panel Surface:** rgba(22, 14, 8, 0.80) with backdrop-blur 24px (frosted dark glass)
- **Panel Border:** rgba(255, 210, 170, 0.10) (warm white, barely visible)
- **Text Primary:** #f0e4cc (warm cream white)
- **Text Secondary:** #c4a87e (muted gold)
- **Text Muted:** #6b5a45 (dark gold, for labels)
- **Accent:** #d4956a (warm amber/copper -- used for interactive elements, highlights, branding)
- **Risk Safe:** #10b981 (emerald green)
- **Risk Moderate:** #f59e0b (amber yellow)
- **Risk Danger:** #ef4444 (red)
- **Card Background:** rgba(255,255,255,0.02) to rgba(255,255,255,0.04) gradient
- **Card Border:** rgba(255,255,255,0.08), hover: rgba(255,255,255,0.14)
- **Glow Effects:** Colored box-shadow/blur matching the risk color of data

### Typography
- **UI Font:** Inter (weights: 400, 500, 600, 700, 800)
- **Data/Numbers Font:** Geist Mono (monospaced, for coordinates, scores, technical values)
- **Display/Headings:** Inter with letter-spacing: -0.02em
- **Micro Labels:** 8-10px, font-weight 600-700, uppercase, letter-spacing 0.18-0.25em (creates that "instrument panel" look)
- **Data Numbers:** Tabular numerals, medium weight, tight tracking

### Iconography
- Lucide React icons (1.5px stroke, clean geometric)
- 3x3px to 4x4px size for card headers
- Colored to match their data category

### Effects
- All floating panels: backdrop-blur(24px) saturate(150%) over the map
- Cards: subtle gradient from-white/4 to-white/1
- Hover: cards lift 2px (spring animation), border brightens, corner glow blob fades in
- Active data: colored glow shadow matching risk level
- Animations: spring physics (damping 22, stiffness 200), staggered children entry

---

## Screen 1: Main App (Map + Dashboard)

### Layout Architecture
Full-viewport map with floating glass panels overlaid. No traditional page structure -- the map IS the background.

```
+------------------------------------------------------------------+
|  [=] [SAFE House logo]  [___Search bar___  Ctrl+K]  [ID|EN] [AUDIT|BATTLE] [* Ready]  |  <-- TopBar (h-14, fixed top, glass blur)
+------------------------------------------------------------------+
|  +--[LEFT PANEL]--+                                               |
|  | Site Analysis   |                                               |
|  | Risk Dashboard  |                                               |
|  |                 |          +-- FULL BLEED MAP --+               |
|  | [ARC GAUGE]     |          |                     |               |
|  |   72 / 100      |          |   Carto Positron    |               |
|  |   MODERATE      |          |   (light tiles)     |               |
|  |                 |          |                     |               |
|  | [VS30] [PGA]   |          |   * Property Marker  |               |
|  | [FS]  [ELEV]   |          |   (custom animated)  |               |
|  |                 |          |                     |               |
|  | -- Risk --      |          |   [ Risk Zone HUD ] |               |
|  | [RADAR CHART]   |          |   circles + flags   |               |
|  |                 |          |                     |               |
|  | [WAVEFORM]      |          +---------------------+               |
|  | [GAUSSIAN]      |                                               |
|  |                 |                                               |
|  | -- Location --  |                              +--[CHATBOT]--+  |
|  | [ADDRESS CARD]  |                              | [*] Ask AI  |  |
|  |                 |                              | [___] [Send] |  |
|  | [View Report >] |                              +--------------+  |
|  +-----------------+                                               |
+------------------------------------------------------------------+
```

### TopBar (fixed, h-56px, z-10)
- Left: hamburger toggle (PanelLeftClose/Open icon) + app icon (32x32 PNG) + "S.A.F.E House" text (13px bold, "House" in accent color) + subtitle "GEOPHYSICS CORE v3.0" (9px mono, muted)
- Center: search bar trigger (rounded-lg, border white/8, bg white/3). Placeholder: "Search location or run command..." in muted text. Right side shows "Ctrl+K" keyboard hint badge.
- Right: Language selector dropdown (globe icon + "English"/"Bahasa"), segmented toggle [AUDIT | BATTLE] (active state has bg-white/10 + border + shadow), status badge with pulsing dot ("Ready" green / "Analyzing..." amber / "AI Processing" accent)

### Left Panel (w-380px, glass, floating, rounded-2xl, z-20)
- Position: fixed left-16px, top-72px, bottom-16px
- Background: rgba(22, 14, 8, 0.80) + backdrop-blur(24px)
- Border: 1px solid rgba(255,210,170,0.10)
- Scrollable interior, custom thin scrollbar (amber tint)
- Slides in from left with spring animation

**Content (top to bottom, with section dividers):**

#### A. Panel Header
- Badge: amber pill "Site Analysis" with lightning icon
- Title: "Risk Dashboard" (14px semibold)

#### B. S.A.F.E Score Card (hero card)
- Left side: **SVG Arc Gauge** (240-degree arc, 120px diameter)
  - Background arc: very subtle white/6 track
  - Foreground arc: gradient from accent/60 to accent/100, with glow filter
  - 5 tick marks at 0/25/50/75/100
  - Center: large score number (32px bold mono), "/100" below (10px muted)
- Right side:
  - Shield icon + "S.A.F.E SCORE" label (10px bold uppercase tracking-wide, colored by risk)
  - Risk badge: rounded pill with trend icon (TrendingUp for safe, TrendingDown for danger) + label "SAFE"/"MODERATE"/"DANGER", background is risk color at 10% opacity
  - 3 mini horizontal bars: Seismic, Flood, Soil -- each with label (8px), thin bar (animated width), value number (8px). Bar colors: green/amber/red based on value.
- Dual ambient glow blobs (top-right and bottom-left corners, risk-colored, blur-3xl, opacity 20%)

#### C. Section: "TECHNICAL METRICS" (with gradient line divider)

#### D. Metrics Grid (2x2)
Four tiles, each:
- Top: icon (3x3) + label (9px bold uppercase tracking-wide), colored per metric
- Middle: large number (20px semibold mono) + suffix (10px muted)
- Bottom: subtitle text (10px muted) e.g. "Site Class SC"
- Very bottom: mini animated progress bar (0.5px height)
- Hover: lift 2px, border brightens, corner glow blob appears

Metrics:
1. **Vs30** (Mountain icon, amber) -- value like "450 m/s", sub "Class SC"
2. **PGA** (Activity icon, yellow) -- value like "0.48g", sub "Peak accel."
3. **Liq. FS** (Waves icon, green/red) -- value like "1.85", sub "Stable" or "High risk"
4. **Elevation** (Droplets icon, purple/red) -- value like "96 m", sub "Standard" or "Flood prone"

#### E. Section: "RISK ANALYSIS" (with gradient line divider)

#### F. Radar Card
- Header: radar icon + "Risk Radar (5-axis)" + "0-100 scale" mono text
- 5-axis radar chart (Flood, Soil, Air, Seismic, Elevation)
- Dark styled: grid lines rgba(255,210,170,0.10) dashed
- Fill: accent color at 18% opacity, stroke 2px
- Axis labels: 10px semibold gold text
- Tooltip: dark glass panel (rgba(26,17,10,0.96))
- In battle mode: two overlapping radar shapes (accent + red)

#### G. Seismic Waveform Card
- Header: waves icon (colored by PGA risk) + "Seismic Signature" + PGA value in mono
- SVG waveform: pseudo-realistic seismograph trace
  - Center dashed baseline
  - Animated path draw (1.6s ease)
  - Glow layer underneath (same path, blur 3px, opacity 25%)
  - Sweeping cursor line (vertical gradient, loops infinitely left to right)
- Footer: fault name + distance in mono text

#### H. Gaussian / PGA Distribution Card
- Header: chart icon + "PGA Distribution" + dynamic badge (SAFE/MODERATE/CRITICAL with icon, colored)
- Area chart: gaussian bell curve centered on PGA value
  - Fill gradient changes color dynamically (green to amber to red based on PGA)
  - Dashed reference line at current PGA
- Custom slider below:
  - Track: gradient bar (green to yellow to red)
  - Filled portion: matches current PGA position
  - Custom thumb: 16px circle, colored by PGA risk, with glow shadow, 2px dark border
  - Labels below: "0.1g SAFE" / "0.5g MOD" / "1.0g CRIT"

#### I. Section: "LOCATION" (with gradient line divider)

#### J. Address Card
- Header: MapPin icon + "Site Location" + copy button ("Copy" with clipboard icon, shows "Copied" checkmark on click)
- Address text: 11px, 2-line clamp
- 3 coordinate cells in a row, each with:
  - Small icon (Navigation rotated for Lon, Mountain for Elev)
  - 8px uppercase label (LAT / LON / ELEV)
  - 11px mono value
  - Subtle border, hover brightens
- Fault line indicator (conditional):
  - Rounded card with colored border (red <10km, amber <30km, green >30km)
  - Left: compass icon in colored badge
  - Center: fault name (11px bold) + distance (9px mono colored)
  - Right: severity label (NEAR / MOD / FAR)

#### K. View Full Report Button
- Full-width, accent-styled button
- Icon: FileText
- Text: "View AI Audit Report"
- Right: chevron arrow that slides right on hover
- Disabled state with "Generating report..." if AI still loading

### Map Layer (z-0, full viewport)
- Tile: Carto Positron (light gray, clean, minimal labels)
- Background: #e8e4df (warm off-white)
- Custom property marker: amber pin with drop animation (spring physics)
- Risk Zone Overlay (when property selected):
  - 500m outer scan ring (dashed, subtle amber)
  - 200m inner risk zone (solid, colored by overall risk, 8% fill)
  - 60m core glow circle (risk-colored, 15% fill)
  - 4 floating info flags at compass positions around property:
    - Each flag: dark glass card (rgba(15,11,8,0.88), blur 16px, rounded 10px)
    - Contains: emoji icon + label (9px gold) + value (13px bold mono, risk-colored) + severity (7px) + tiny progress bar (3px)
    - Example: [Flood icon] FLOOD | 25 LOW [===----]
  - Dashed connector lines toward nearest fault/volcano/coast with distance labels
  - Meter labels ("200m", "500m") at ring edges

### Chatbot (bottom-right, z-20)
**Collapsed state (default):**
- Floating pill, w-340px, dark glass, rounded-2xl
- Single row: sparkle icon badge + text input + send button (circular)
- Send button: amber when input has text, muted when empty

**Expanded state:**
- Slides open as sidebar panel (w-380px, full height)
- Header: sparkle icon + "GEO-AI Bot" title + "SAFE-CONSULT v3.0" subtitle + minimize chevron
- Messages area: scrollable, user bubbles (amber bg, right-aligned), AI bubbles (dark glass, left-aligned, markdown rendered)
- Loading state: 3 bouncing amber dots + "Thinking..."
- Suggested prompts: rounded pills, subtle border, 10px text
- Input: double-bordered rounded textarea with animated placeholder, send button

---

## Screen 2: Battle Mode (compare 2 properties)

Same layout, but Left Panel content changes:

### Battle Card (replaces score card)
- Header: Trophy icon (amber) + "Battle Verdict" + "Site A wins" badge (green)
- 3-column grid: Site A pill | arrow | Site B pill
- Each pill: colored border (by score), site label (A/B), score number, truncated address

### Setup State (before Site B selected)
- Dashed border card with instruction text
- Button: "Select Target on Map" (toggles to "Click anywhere on map...")

### Dual Radar
- Two overlapping radar shapes (accent for A, red for B)
- Legend: colored dots with "Site A" / "Site B"

### Generate Battle Report Button
- Swords icon + "Generate AI Battle Report"
- Loading state: spinning loader + "Analyzing..."

---

## Screen 3: Command Palette (Ctrl+K)

- Modal overlay, centered, w-480px
- Dark glass background, rounded-xl
- Search input at top (full-width, 14px, magnifier icon)
- Results list below: each item has icon + title + description + keyboard hint
- Categories: "Recent Searches", "Favorites", "Actions"
- Keyboard: up/down to navigate, Enter to select, Esc to close
- Subtle border glow animation

---

## Screen 4: Audit Report Drawer (bottom sheet)

- Slides up from bottom, 78vh height
- Dark glass panel, rounded-t-2xl
- Drag handle bar at top (12px wide, centered, white/14)
- Header row:
  - Left: FileText icon badge + "AI Audit Report" title + "Generated by GEO-AI" subtitle with address
  - Right: Street View badge (if used), Copy Link button, Export PDF button, close X button
- Warning banner: amber border, "AI-generated analysis..." disclaimer
- Summary cards (3-column): Geotechnical / Seismic / Environment (each with label + short text)
- Micro Analysis box: accent border, Eye icon badge + analysis paragraph
- Full markdown report: dark themed prose (cream headings, gold body text, amber links, glass code blocks, styled tables)

---

## Screen 5: Onboarding Tour

- Full-viewport dark overlay (rgba(5,3,2,0.72))
- Spotlight cutout on target element (with animated amber glow ring)
- Tooltip card (340px wide, glass panel):
  - Progress bar at top (amber gradient)
  - Icon badge + step title + step counter "2 of 7"
  - Description text
  - Navigation: Skip (text button) + Back (ghost button) + Next (accent button with chevron)
  - Keyboard hints at bottom: Enter/arrow/Esc badges

7 tour steps:
1. Map area (full viewport pulse rings)
2. Search bar
3. Left panel
4. Score card
5. Mode toggle
6. Chatbot
7. Status indicator

---

## Screen 6: Loading State

When user clicks map and data is fetching:
- Left Panel shows shimmer skeletons matching final card layouts
- Score card skeleton: h-144px rounded-xl with shimmer animation
- Metrics: 2x2 grid of h-72px shimmer blocks
- Radar: h-224px shimmer
- Bottom: spinning Loader2 icon with ping ring animation + "Fetching geospatial data..."

---

## Screen 7: Empty State (no location selected)

- Centered in Left Panel
- Large MapPin icon (36px) inside circle (80px) with accent glow blob behind
- Badge: "GEO-AI Powered" with sparkle icon
- Title: "Property Risk Scanner" (18px semibold)
- Description: "Click anywhere on the map..." + Ctrl+K keyboard hint
- 4 feature pills (2x2 grid): pin icon + "Vs30 & Soil Class", wave + "Flood Risk Map", volcano + "Fault Distance", robot + "AI Report"

---

## Micro-Interactions & Animation Details

- **Panel entrance:** spring slide from left (x: -440 to 0)
- **Card stagger:** each card fades up (y: 16 to 0) with 70ms delay between siblings
- **Score count-up:** 0 to final number over 1.5s, easeOutCubic
- **Confetti:** fires when score >= 80 (80 particles, emerald + amber + cream colors)
- **Arc gauge:** pathLength animates 0 to 1 over 1.8s
- **Waveform:** path draws in over 1.6s, sweep cursor loops every 3.2s
- **Metric tiles:** hover lifts 2px with spring, corner glow blob fades to 30% opacity
- **Map marker:** drops in with spring bounce
- **Gaussian slider:** thumb has colored glow shadow that changes with PGA value
- **Report button chevron:** slides 2px right on hover
- **Status badge:** pulsing dot with ring animation
- **Chatbot:** collapsed slides up from y:30, expanded slides from x:420
- **Toast notifications:** Sonner toasts, bottom-center, dark themed

---

## Responsive Notes

- Desktop-first (1280px+ optimal)
- Map always full viewport
- Panels overlay map, never push it
- Below 768px: left panel becomes full-width bottom sheet
- Touch: all hover states also work on tap
