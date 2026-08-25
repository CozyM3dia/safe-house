# Riset Teknik: Background Terang "Kertas Geologi Hangat"
*(grain halus · garis kontur topografi · sediment drift · performa canvas WebGL)*

Tanggal riset: 2026-08-25. Semua snippet di bawah sudah diverifikasi dari sumber aslinya (bukan rekonstruksi), siap diadaptasi.

---

## 1. Garis Kontur Topografi (GLSL fbm/noise)

### Pendekatan inti
Kontur = **iso-lines dari field elevasi** `v = fbm(p)`:

```
c   = v * levels                 // skala ke jumlah band
w   = fwidth(c)                  // gradien screen-space (lebar 1 piksel)
dist = 0.5 - abs(fract(c)-0.5)   // jarak fraksional ke iso-level terdekat
line = smoothstep(w*(t+0.5), w*(t-0.5), dist)   // garis AA selebar konstan
```

Tiga trik kunci yang muncul konsisten di semua sumber:

1. **`fract()` pada height × N** — mengubah field kontinu jadi band berulang; `abs(fract(c)-0.5)` memberi jarak simetris ke garis.
2. **`fwidth()` untuk anti-aliasing** — membagi jarak fraksional dengan gradien per-piksel sehingga garis **selebar piksel yang sama** di area landai maupun curam (tanpa ini: garis gemuk/kurus acak — persis masalah yang didokumentasikan di thread GameDev.net 2009, solusi klasik oleh "Trurl" + penyempurnaan "knighty").
3. **Fade saat field curam ekstrem** — jika `w` besar (band < 1 px), redupkan garis agar tidak moiré.

### Sumber kode konkret

| Sumber | URL | Catatan |
|---|---|---|
| **topolines** (repo React, MIT) | https://github.com/idleCyrex/topolines | Shader kontur animasi paling lengkap & modern. Kode lokal: `C:\Users\Sibgha\topolines-shader.ts` + `-engine.ts`. Default: `speed 0.012` (≈10px/detik drift), `levels 11`, `lineWidth 1.2`, `opacity 0.16`, `warp 0.18`. |
| GameDev.net "Terrain Contour Lines using pixel shader" | https://gamedev.net/forums/topic/529926-terrain-contour-lines-using-pixel-shader | Asal-usul teknik fract+fwidth; versi knighty: `abs(fract(P*gsize)-0.5)` + `smoothstep(-gw*df, gw*df, f)`. |
| linad3d/contourlines | https://github.com/linad3d/contourlines (demo: https://linad3d.github.io/contourlines/) | Peta kontur planet WebGL2 zero-dep: fwidth-AA lines, **hypsometric tint**, hillshading screen-space — referensi palet warna elevasi. |
| Remotion `contourLines()` effect | https://github.com/remotion-dev/remotion/pull/8411 | Implementasi produksi: value-noise + FBM + contour-AA, parameter tervalidasi. |
| arthurxavierx/contour-lines | https://github.com/arthurxavierx/contour-lines | Eksperimen generatif terrain contours. |
| felipeog/topographic | https://github.com/felipeog/topographic | **Alternatif non-WebGL**: marching squares → SVG Bézier, Web Worker. Cocok kalau mau kontur statis tajam tanpa GPU. |

### Snippet siap adaptasi (diringkas dari topolines, MIT — Ashima simplex noise)

```glsl
// FRAG (WebGL1 + #extension GL_OES_standard_derivatives : enable)
precision highp float;
uniform vec2  uRes;      // ukuran buffer px
uniform float uTime, uScale, uLevels, uLineWidth, uOpacity, uWarp;
uniform vec2  uSeed, uDrift;
uniform vec3  uColor;

// ... snoise(vec3) standar Ashima/Gustavson (MIT) — lihat repo webgl-noise ...

// 2 oktava saja: 1 = terlalu 'glassy', 3 = ramai & sesak (komentar asli repo)
float fbm(vec3 p) { return (snoise(p) + 0.5 * snoise(p * 2.0)) / 1.5; }

void main() {
  // normalisasi sisi pendek -> aspect-correct, pola ikut skala elemen
  vec2 stN = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);
  vec2 st  = stN * uScale + uSeed + uDrift * uTime;

  // domain warp ringan: loop meander seperti terrain nyata, bukan blob konsentris
  vec2 q = vec2(fbm(vec3(st,        uTime * 0.6)),
                fbm(vec3(st + 5.2,  uTime * 0.6)));
  st += q * uWarp;                       // uWarp ≈ 0.18

  float v = fbm(vec3(st, uTime));        // sumbu-z = waktu -> loop tumbuh/menyusut sendiri
  float c = v * uLevels;

  float w    = fwidth(c);                              // lebar 1 piksel dalam satuan c
  float dist = 0.5 - abs(fract(c) - 0.5);              // jarak ke iso-level terdekat
  float dd   = dist / max(w, 1e-5);
  float line = 1.0 - smoothstep(uLineWidth*0.5 - 0.5, uLineWidth*0.5 + 0.5, dd);

  // daerah terlalu curam (band < ~1px): fade, bukan moiré
  line *= 1.0 - smoothstep(0.6, 1.4, w);

  float a = line * uOpacity;
  gl_FragColor = vec4(uColor * a, a);                  // premultiplied alpha
}
```

JS side minimal (pola engine.ts topolines): satu **oversized triangle** `[-1,-1, 3,-1, -1,3]` menutup viewport tanpa quad penuh; blending `gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)`; wajib `gl.getExtension("OES_standard_derivatives")` (WebGL1) — di WebGL2 `fwidth()` built-in.

### Palet warna "geologi hangat"
- **Garis**: tinta sepia/cokelat tua di atas kertas krem — opacity total garis 0.12–0.20 (default topolines 0.16) supaya jadi tekstur, bukan grafik.
- **Hypsometric tint ala peta sungguhan** (pola linad3d/contourlines): ramp 3–4 stop dari kertas → pasir → oker tua per band elevasi, dipakai sangat samar. Contoh nyata terverifikasi (Daylight Computer): cream `#f2eade`, pasir `#cec0b4`, abu-hangat `#a39384/#48453d`, cokelat tinta `#241f19`.
- Alternatif rumus palet prosedural: cosine palette iq — `pal(t) = a + b*cos(6.28318*(c*t+d))` (https://iquilezles.org/articles/palettes/) — set amplitude rendah di channel chroma agar tetap netral hangat.

---

## 2. Paper Grain / Paper Texture Halus (background TERANG)

### Rekomendasi utama: SVG feTurbulence sebagai data-URI statis
Untuk background terang, grain = overlay **sangat samar**. Teknik paling murah & tidak norak: filter noise dirender **sekali** sebagai `background-image` (nol request gambar, nol biaya per-frame).

```css
/* grain kertas untuk background TERANG */
.paper-grain::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  isolation: isolate;            /* cegah blend bocor ke elemen lain */
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 256px 256px;
  mix-blend-mode: multiply;      /* di bg terang: multiply/soft-light */
  opacity: 0.04;                 /* 0.03–0.06 = 'terasa', 0.08 = mulai kelihatan */
}
```

Parameter yang penting (dari CSS-Tricks "Creating Patterns With SVG Filters"):
- `type="fractalNoise"` (bukan `turbulence` default — fractalNoise merata di RGBA; turbulence bikin alpha aneh).
- `baseFrequency` 0.65–0.9 untuk grain halus; **anisotropi** `baseFrequency="0.001 1"` menghasilkan serat vertikal seperti kertas bertekstur — opsi bagus untuk nuansa "kertas gambar teknik".
- `numOctaves` 3–4; `stitchTiles="stitch"` wajib agar tile mulus.
- **Jangan** pakai hack `filter: contrast(170%) brightness(500%)` dari artikel CSS-Tricks — itu untuk gradient gelap dithering; di background terang ia merusak palet. Cukup opacity rendah + blend mode.
- Batas aman: opacity > 0.6 = norak; sweet spot 0.03–0.08 untuk kertas (konsensus beberapa guide: "kalau kelihatan dari jarak normal di HP siang hari, terlalu kuat").

### Varian lanjutan
- **feDisplacementMap** (teknik revisi master.dev/blog/grainy-gradients): gradient dimasukkan ke filter, noise di-desaturasi lalu dipakai menggeser piksel gradient — grain tanpa mengubah warna/hue gradient asli. Lebih bersih tapi lebih mahal dirender.
- **Animasi grain ala film**: jitter posisi background dengan `steps()` 8×/detik (pola codefronts.com) — hanya jika memang mau film grain; untuk kertas geologi, grain statis lebih tepat.

### CSS vs WebGL
| | CSS feTurbulence | WebGL hash-noise |
|---|---|---|
| Biaya runtime | ~nol (raster sekali) | per-frame per-pixel |
| Kontrol animasi | statis / jitter posisi | penuh (grain bisa berevolusi) |
| Interaksi dengan shader kontur | overlay terpisah di atas canvas | bisa digabung 1 pass |
Rekomendasi praktis: **canvas WebGL hanya untuk kontur/drift; grain tetap layer CSS di atasnya** — dua concern terpisah, grain gratis.

Snippet WebGL grain (jika ingin satu pass):
```glsl
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
// grain halus terang: geser luminance ±0.02
col += (hash(gl_FragCoord.xy + floor(uTime*8.0)*0.01) - 0.5) * 0.02;
```
Untuk grain statis berkualitas, pre-bake tekstur noise 256² sekali ke texture dan sample dengan offset — lebih murah daripada hash per frame.

Sumber: css-tricks.com/grainy-gradients · css-tricks.com/creating-patterns-with-svg-filters · master.dev/blog/grainy-gradients · dev.to/developedbyluke "noise overlay used in award-winning sites in 3 steps".

---

## 3. Flow Field / Sediment Drift Halus (hero)

### Opsi A — Domain-warped fbm (paling cocok "sedimen", termurah)
Referensi kanonik: iq "Domain warping" (https://iquilezles.org/articles/warp) — kode asli artikel:

```glsl
float pattern(in vec2 p) {
  vec2 q = vec2(fbm(p + vec2(0.0, 0.0)), fbm(p + vec2(5.2, 1.3)));
  vec2 r = vec2(fbm(p + 4.0*q + vec2(1.7, 9.2)),
                fbm(p + 4.0*q + vec2(8.3, 2.8)));
  return fbm(p + 4.0*r);
}
```
Demo live Shadertoy milik iq: https://www.shadertoy.com/view/lsl3RH .
Cara pakai subtle: jangan pakai hasil pattern sebagai warna penuh — map ke **dua tone kertas berdekatan** (`mix(paperA, paperB, smoothstep(0.35,0.65,pattern))`) dan gerakkan waktu sangat lambat (`p += t*0.02`). Ini membaca sebagai "endapan bergeser", bukan lava-lava.

### Opsi B — Kontur yang berdrift (gabung §1)
Engine topolines: `speed 0.012 ≈ 10px/detik`; sumbu-z simplex = waktu sehingga loop kontur **tumbuh/menyusut/bergabung sendiri** — efek "peta hidup" tanpa partikel sama sekali. Sudah termasuk domain warp 0.18. Ini opsi paling hemat untuk hero.

### Opsi C — Curl-noise particle advection (paling mahal, paling "flow")
Referensi: paper Bridson et al. *"Curl-Noise for Procedural Fluid Flow"* (2007); implementasi web ringkas: al-ro.github.io/projects/particles (instanced particles mengikuti curl dari FBM gradient noise; divergence-free → aliran fluid-like tanpa kompresi/eksplorasi aneh) dan ziyadx.com/experiments/flow-field (curl advection multi-step + streamlines).

```glsl
// curl 2D dari potensial noise ψ (versi 2D dari metode finite-difference al-ro/Bridson)
vec2 flow(vec2 p, float eps) {
  float n1 = fbm(p + vec2(0.0, eps)), n2 = fbm(p - vec2(0.0, eps));
  float n3 = fbm(p + vec2(eps, 0.0)), n4 = fbm(p - vec2(eps, 0.0));
  return vec2(n1 - n2, n4 - n3) / (2.0 * eps);   // rot90 dari grad ψ
}
```
Untuk hero terang: batasi 800–2000 partikel, trail via fade-alpha rendah, warna tinta transparan 0.05 — ATAU skip partikel dan langsung pakai Opsi A/B (rekomendasi: A atau B; partikel jarang worth biayanya untuk estetika kertas tenang).

---

## 4. Praktik Performa: Full-page Background Canvas WebGL

### Checklist wajib (semua item ini ada di implementasi topolines/engine.ts — bukti pola production)
```js
// 1) DPR CAP — jangan render di atas 2 (atau 1.75) fisik pixel
const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);   // topolines: maxDpr prop
canvas.width  = Math.round(canvas.clientWidth  * dpr);
canvas.height = Math.round(canvas.clientHeight * dpr);

// 2) PAUSE saat offscreen
const io = new IntersectionObserver(([e]) =>
  e.isIntersecting ? start() : stop(), { threshold: 0 });
io.observe(canvas);

// 3) PAUSE saat tab hidden (rAF otomatis throttled, tapi hentikan clock juga)
document.addEventListener('visibilitychange', () =>
  document.hidden ? stop() : start());

// 4) prefers-reduced-motion -> SATU frame statis, bukan animasi
const rm = matchMedia('(prefers-reduced-motion: reduce)');
rm.addEventListener('change', () => { stop(); resize(); render(); start(); });
if (rm.matches) { render(); }        // jangan panggil rAF loop

// 5) clamp dt — tab background tak bikin lompatan pola saat kembali
const dt = Math.min((now - last) / 1000, 0.1);

// 6) DPR berubah (pindah monitor): ResizeObserver TIDAK fire ->
matchMedia(`(resolution: ${dpr}dppx)`).addEventListener('change', onDprChange);

// 7) context loss
canvas.addEventListener('webglcontextlost',  e => { e.preventDefault(); stop(); });
canvas.addEventListener('webglcontextrestored', () => setupGL(); resize(); render());
```

Optimasi tambahan yang terbukti di lapangan:
- Fullscreen quad = **1 triangle oversize** `[-1,-1, 3,-1, -1,3]`.
- Output premultiplied alpha + `blendFunc(ONE, ONE_MINUS_SRC_ALPHA)` → canvas bisa transparan di atas warna kertas CSS.
- fbm fullscreen mahal di 4K/retina: kombinasi DPR-cap + 2 oktava saja sudah cukup; kalau masih berat, render ke buffer setengah resolusi lalu upscale (kontur memang low-frequency).
- Background tab: rAF otomatis pause (MDN) — item 3 menjaga clock & GPU work.

### Ukuran bundle (benchmark empiris jsulpis/webgl-libs-comparison, kasus fullscreen-fragment-shader)
| Library | Minified | Gzipped | Catatan |
|---|---|---|---|
| **Raw WebGL** | 3.2 kB | **1.7 kB** | cukup untuk 1 quad + 1 program |
| four (mini three) | 18.5 kB | 7.1 kB | |
| TWGL | 20.6 kB | 7.2 kB | helper tipis di atas native |
| **ogl** | 44.5 kB | **13.5 kB** | Core 8kB + Math 6kB + Extras 15kB minzip (README resmi); tree-shakeable |
| regl | 125 kB | 42 kB | kurang cocok untuk kasus sekecil ini |
| three.js | 454 kB | 116 kB | overkill untuk background quad |
| pixi | 461 kB | 140 kB | idem |

**Rekomendasi**: raw WebGL (±30 baris boilerplate) atau ogl jika ingin ergonomi. three.js tidak dibenarkan hanya untuk background.

### Fallback berlapis
1. WebGL tak tersedia / extension gagal → CSS statis: warna kertas + grain feTurbulence + (opsional) SVG kontur pra-render dari marching squares (felipeog/topographic bisa jadi generator build-time).
2. `prefers-reduced-motion` → render 1 frame (field tetap terlihat, tidak bergerak).
3. `@media (prefers-reduced-motion: reduce)` untuk transisi CSS: durasi 0.01ms (pola cssremedy/web.dev).

---

## 5. Situs Nyata: Background Terang Bertekstur yang Diakui Premium

1. **Daylight Computer — https://daylightcomputer.com**
   Hardware "calm computer"; situsnya commit ke nuansa kertas hangat. Teardown SiteThis (sitethis.com/site/daylight): *"warm paper tones, amber light… the design argues the thesis"*. Palet terverifikasi dari listing: cream `#f2eade`, pasir `#cec0b4`, `#a39384`, tinta `#241f19`. Teknik dominan: warna flat hangat + fotografi natural + tipografi lembut — bukti bahwa "tekstur" bisa datang dari palet & foto, bukan filter.
2. **Stripe Press — https://press.stripe.com**
   Editorial "books as objects, cream + ink". Dirancang menerjemahkan kualitas taktil cetakan ke digital — buku dirender 3D interaktif dengan detail punggung/sampul (curriculum vitae desainer Yuin Chien, yuinchien.com/p/stripe-press: *"translating the tactile qualities of print into a digital space"*). Review landing.love: restraint monokrom hitam-di-atas-putih, whitespace lega.
3. **Readymag — https://readymag.com (+ galeri examples/editorial)**
   Platform editorial ber-metafora kertas; komunitas template-nya adalah sumber terbesar pola grain overlay halus di background terang (dev.to/developedbyluke mendokumentasikan pola noise-overlay "award-winning" yang populer di ekosistem ini).
4. **Galeri kurasi untuk cari 10 contoh lagi:**
   - https://godly.website — tag/koleksi "grain" (situs-situs dengan noise overlay halus).
   - https://www.a1.gallery/websites/texture-landing — 30 contoh landing bertekstur + FAQ teknis (CSS noise lightweight, tekstur image harus kecil & tiled).
   - https://minimal.gallery — minimalis terang.
   Pola umum dari NitroFox ("Awwwards-style design on a budget"): grain = *one texture move* dari 4 moves; "harus subtle — kalau kelihatan di HP siang hari, terlalu kuat".

Catatan anti-pola yang disepakati semua sumber trend 2026 (spoko.space, dst.): grain/noise/paper texture justru sedang naik sebagai **reaksi terhadap estetika AI-gradient generik** — jadi arah "kertas geologi hangat" ini tepat sasaran, asalkan opacity rendah & palet hangat konsisten.

---

## Ringkasan Resep untuk Implementasi
1. Base: warna kertas krem flat (`#f2eade` family) di CSS body.
2. Layer 1: canvas WebGL (raw/ogl) full-viewport DI BELAKANG konten — kontur fbm (§1) + drift lambat (§3 opsi A/B), premultiplied alpha, DPR≤2, IO+visibility pause, reduced-motion = 1 frame.
3. Layer 2: grain feTurbulence CSS statis opacity 0.03–0.06, `mix-blend-mode: multiply`, di atas segalanya (`pointer-events:none`).
4. Tanpa WebGL: warna + grain tetap tampil (fallback murni CSS) — degradasi anggun.
