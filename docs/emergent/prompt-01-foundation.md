# Prompt 01 — Foundation

**Tujuan:** scaffold + design system + app shell. Belum ada fitur, belum ada data, belum ada AI.
**Agent:** E1
**Estimasi:** 1 sesi

Salin semua yang ada di dalam blok di bawah ke Emergent.

---

```
Build the foundation for a web app called "S.A.F.E House" (Spatial Analyst for
Flood and Environment). This is a geospatial risk-audit tool for properties in
Indonesia — it scores flood risk, soil liquefaction, seismic exposure, and
environmental quality for any coordinate.

IMPORTANT — SCOPE FOR THIS TASK:
Build ONLY the foundation described below. Do NOT build the map, the audit
engine, any data fetching, any charts, any AI features, or any database models
yet. Those come in later tasks. If you finish the items listed here, stop.
Keep the codebase small and clean so it is easy to extend.

STACK
- Frontend: React + Tailwind CSS
- Backend: FastAPI (create the project skeleton and a single GET /api/health
  endpoint returning {"status": "ok"}. Nothing else.)
- Database: MongoDB (connect it, but create NO collections or models yet)

DESIGN SYSTEM — "Mocha Command Center"
The aesthetic is a warm dark command center — like a geological field terminal.
Matte near-black with copper and amber accents. Professional, scientific,
trustworthy. It must feel like a precision instrument, not a generic SaaS
dashboard.

Configure these as Tailwind theme tokens (do not hardcode hex values in
components):

Colors:
  bg.DEFAULT      #0f0b08     app background, near-black with warm undertone
  bg.surface      rgba(22, 14, 8, 0.88)   panel and card backgrounds
  bg.elevated     #1a1208     popovers, dropdowns
  text.primary    #f0e4cc     headlines, labels, important values
  text.secondary  #c4a87e     body text, descriptions
  text.muted      #7d6245     captions, timestamps, subtle metadata
  accent.DEFAULT  #d4956a     primary accent — icons, highlights, active states
  accent.hover    #b87a52     hover state for accent elements
  risk.safe       #10b981     low risk
  risk.moderate   #f59e0b     medium risk
  risk.danger     #ef4444     high risk

Default border color everywhere: rgba(255, 210, 170, 0.07)
Interactive borders: rgba(255, 210, 170, 0.12)

Box shadows:
  glass       0 2px 16px rgba(0,0,0,0.35), 0 1px 4px rgba(0,0,0,0.25)
  glass-lg    0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.28)
  glow        0 0 20px rgba(212, 149, 106, 0.35)

TYPOGRAPHY
Load from Google Fonts and register as Tailwind font families:
  font-sans     Inter              general UI, panels (400–800)
  font-display  Archivo            score numbers, big display values (700–900)
  font-data     Azeret Mono        coordinates, metrics, any number (400–500)
  font-mono     Geist Mono         code, report text (400–600)

Type rules to apply consistently:
- Section labels above data blocks: 9–10px, weight 700, uppercase,
  letter-spacing 0.2em, color text.muted, margin-bottom 6px
- Panel titles: 14–16px, weight 700, letter-spacing -0.01em, color text.primary
- Big data values: font-data, tabular-nums, letter-spacing -0.02em
- Body text: 12–14px, weight 400, color text.secondary

REUSABLE CSS UTILITIES
Create these as global utility classes:

.glass — for floating panels
  background: rgba(22, 14, 8, 0.80)
  backdrop-filter: blur(24px) saturate(150%)
  border: 1px solid rgba(255, 210, 170, 0.10)
  box-shadow: 0 2px 20px rgba(0,0,0,0.40), 0 1px 4px rgba(0,0,0,0.25)

.glass-strong — for drawers and modals
  background: rgba(26, 17, 10, 0.90)
  backdrop-filter: blur(32px) saturate(170%)
  border: 1px solid rgba(255, 210, 170, 0.12)
  box-shadow: 0 8px 32px rgba(0,0,0,0.50), 0 2px 8px rgba(0,0,0,0.30)

.btn-press — press feedback on every button
  transition: transform 150ms cubic-bezier(0.32, 0.72, 0, 1)
  on :active — transform: scale(0.97)

.pulse-dot — 8px circle with an expanding ring animation at 2s infinite,
  used later for active status indicators

Custom scrollbar: 6px wide, transparent track, thumb
rgba(212, 149, 106, 0.18), thumb on hover rgba(212, 149, 106, 0.32).

Focus state: outline 2px solid #d4956a, outline-offset 2px.

Respect prefers-reduced-motion — disable animations and transitions when set.

ROUTES AND LAYOUT
Two routes:

1. "/" — Landing page. Single hero section only:
   - App name "S.A.F.E House" and the expansion
     "Spatial Analyst for Flood and Environment"
   - One-line description in Indonesian: "Audit risiko geospasial properti —
     banjir, likuefaksi, stabilitas tanah, dan lingkungan, dalam satu laporan."
   - One primary button "Mulai Audit" that navigates to /app
   - Keep it restrained. No feature grid, no testimonials, no pricing,
     no footer links. It will be expanded later.

2. "/app" — The main workspace. Full-screen, no page scroll
   (h-screen w-screen overflow-hidden). Build the shell only, with these
   layers and z-index values:

   z-0   Map area — for now render an empty div with background #e8e4df
         (warm parchment) and the centered muted text "Peta akan dimuat di
         tahap berikutnya"
   z-10  TopBar — fixed, full width, .glass. Contains: the S.A.F.E House
         wordmark on the left, and on the right a language toggle showing
         "ID | EN" (visual only, non-functional for now)
   z-20  LeftPanel — floating panel, width 380px, positioned left 16px /
         top 64px, .glass, rounded-2xl, padding p-5. Inside, render a section
         label "STATUS" and below it the muted text "Belum ada lokasi dipilih".
   z-50  Toaster — set up a toast system, styled with background
         rgba(26, 17, 10, 0.94), border rgba(255, 210, 170, 0.14),
         backdrop blur 24px, text #f0e4cc

   Border radius: main panels rounded-xl to rounded-2xl, cards rounded-lg,
   buttons rounded-lg.

LANGUAGE
All user-facing text in Indonesian. Structure the text so a second language
can be added later — put every string in a single translations module keyed
by locale, with "id" filled in and "en" left as a stub. Do not build a
language switcher beyond the visual toggle in the TopBar.

RESPONSIVE
Desktop-first, since this is a map workspace. On screens under 768px the
LeftPanel should become a bottom sheet instead of a floating side panel.
Do not over-engineer this yet — just make sure nothing overflows horizontally.

WHAT DONE LOOKS LIKE
- "/" renders the hero and the button navigates to "/app"
- "/app" renders the parchment map placeholder with the TopBar and LeftPanel
  floating over it, and nothing overflows or scrolls
- GET /api/health returns {"status": "ok"}
- All colors and fonts come from the theme config, not hardcoded values
- The app looks warm and dark, not blue-grey or purple
```

---

## Setelah prompt ini jalan

Cek sebelum lanjut ke prompt 2:

- [ ] Warna terasa hangat (cokelat/tembaga), bukan abu-abu kebiruan
- [ ] Font Archivo dan Azeret Mono benar-benar termuat, bukan fallback
- [ ] `/app` tidak bisa di-scroll dan tidak ada yang keluar layar
- [ ] Panel kiri terlihat seperti kaca di atas latar parchment
- [ ] `GET /api/health` menjawab
- [ ] Semua teks berbahasa Indonesia

Kalau warna atau font meleset, perbaiki di prompt ini juga — jangan lanjut,
karena semua tahap berikutnya menumpuk di atas fondasi ini.

**Simpan ke GitHub** lewat tombol "Save to GitHub" begitu hasilnya benar,
sebelum mulai prompt 2.
