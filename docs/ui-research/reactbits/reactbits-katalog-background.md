# Katalog React Bits — Backgrounds · Animations · Text Animations

**Sumber:** https://reactbits.dev (sitemap resmi, 179 URL) + kode sumber publik repo `DavidHDev/react-bits@main` (registry `public/r/*.json` = persis isi tab **Code** di tiap halaman).
**Tanggal riset:** 2026-08-25. **Total komponen target:** 122 (53 Backgrounds, 37 Animations, 32 Text Animations).

> **Metodologi:** browser_exec terblokir menunggu persetujuan Chrome remote-debugging (tidak bisa dikonfirmasi user oleh subagent) → fallback sesuai instruksi: sitemap + web_extract + source publik. Verifikasi halaman dilakukan via web_extract `/backgrounds/aurora`: halaman memuat toggle **Preview/Code**, panel **Customize** live (Color 1/2/3, Speed, Blend), **tabel Props berisi default value** (mis. `colorStops` default `["#3A29FF", "#FF94B4", "#FF3232"]`), daftar **Dependencies**, tombol *Copy for AI*, dan *Open in BG Studio*.
>
> **Kesimpulan GLSL:** YA — kode shader penuh (vertex+fragment) terbuka di halaman setiap komponen WebGL via tab **Code** (varian JS/TS × CSS/Tailwind), bisa dicopy langsung. Situs juga menyediakan **Background Studio** (`/tools/background-studio`) dan **Texture Lab** (`/tools/texture-lab`) untuk eksperimen palet secara live.

**Legenda kolom "Paper":** ✅ = cocok/default ramah tema kertas hangat terang (cream/warm) · 🟡 = cocok setelah palet diganti via props (default neon/gelap) · ⚠️ = desain dark-neon/hardcoded, tidak praktis untuk paper.

---

## A. BACKGROUND (53)

| Nama | URL (`reactbits.dev/backgrounds/…`) | Teknologi | GLSL | Paper |
|---|---|---|---|---|
| Acid Squares | `acid-squares` | ogl | ✔ | ⚠️ koridor kristal neon |
| Aurora | `aurora` | ogl | ✔ | 🟡 gradient aurora mengalir; alpha-blend transparan, `colorStops` bebas → peach/gold di cream sangat bisa |
| Balatro | `balatro` | ogl | ✔ | 🟡 shader kartu Balatro, "fully customizable" tapi nuansa gelap |
| Ballpit | `ballpit` | three.js + GSAP | – | 🟡 bola fisika warna-warni; warna bola via props |
| Beams | `beams` | three.js | – | 🟡 pita cahaya menyilang; `lightColor` #ffffff |
| Color Bends | `color-bends` | three.js | ✔ | 🟡 lengkungan warna mengalir; `colors=[]` bebas, `transparent=true` |
| Dark Veil | `dark-veil` | ogl | ✔ | ⚠️ veil gelap by design |
| Dither | `dither` | three.js (R3F + postprocessing) | ✔ | 🟡 dithering retro fbm; `waveColor` [0.5,0.5,0.5], `colorNum` 4 → set coklat-tinta = vibe risograph |
| Dot Field | `dot-field` | **canvas 2D** (0 dep) | – | ✅ dot-grid interaktif (bulge/glow/sparkle/wave); `glowColor` #120F17 → tinta |
| Dot Grid | `dot-grid` | GSAP + canvas 2D | – | ✅ titik merespons kursor; `baseColor`/`activeColor` props → kertas milimeter |
| Evil Eye | `evil-eye` | ogl | ✔ | ⚠️ mata prosedural menyala |
| Faulty Terminal | `faulty-terminal` | ogl | ✔ | ⚠️ CRT hijau/amber untuk bg gelap |
| Ferrofluid | `ferrofluid` | ogl | ✔ | 🟡 fluida magnetik + kontur glow; menarik versi ink-on-paper tapi perlu tuning |
| Floating Lines | `floating-lines` | three.js | ✔ | 🟡 garis 3D bereaksi ke kursor; gradient via props |
| Galaxy | `galaxy` | ogl | ✔ | ⚠️ starfield parallax (butuh bg gelap) |
| Gradient Blinds | `gradient-blinds` | ogl | ✔ | 🟡 kerai gradient + spotlight; warna props |
| Gradient Waves | `gradient-waves` | ogl | ✔ | 🟡 raymarched gelombang kabut horizon; palet props (#5227FF/#FF9FFC/FFF) |
| Grainient | `grainient` | ogl | ✔ | ✅ **grainy gradient swirl**; 3 warna props + grain hash — set cream/sand/sepia = kertas bernuansa |
| Grid Distortion | `grid-distortion` | three.js | ✔ | 🟡 mesh grid melengkung ikut kursor; warna via material |
| Grid Motion | `grid-motion` | GSAP | – | 🟡 grid perspektif bergerak; `gradientColor:'black'` → ganti coklat muda |
| Grid Scan | `grid-scan` | three.js | ✔ | ⚠️ ruang grid 3D scan futuristik |
| Hyperspeed | `hyperspeed` | three.js | ✔×3 | ⚠️ hyperspace neon |
| Iridescence | `iridescence` | ogl | ✔ | ✅🟡 iridescent waves (cos-based); `color=[1,1,1]` → pastel lembut di cream bila amplitude/speed diturunkan |
| Letter Glitch | `letter-glitch` | canvas 2D | – | ⚠️ glitch Matrix |
| Light Pillar | `light-pillar` | three.js | ✔ | ⚠️ pilar cahaya (bg gelap) |
| Light Rays | `light-rays` | ogl | ✔ | ⚠️ ray volumetrik PUTIH — invisible di paper |
| Light Tunnel | `light-tunnel` | ogl | ✔ | ⚠️ tunnel serat optik |
| Lightfall | `lightfall` | ogl | ✔ | ⚠️ streak cahaya jatuh |
| Lightning | `lightning` | **raw WebGL** (0 dep) | ✔ | ⚠️ petir prosedural |
| Line Waves | `line-waves` | ogl | ✔ | 🟡 gelombang garis warna; `color1..3` props (default putih) + brightness |
| Liquid Chrome | `liquid-chrome` | ogl | ✔ | 🟡 krom metalik mengalir; elegan tapi metalik-gelap |
| Liquid Ether | `liquid-ether` | three.js | ✔×7 | 🟡 fluida pigmen interaktif; `colors` props bebas → tinta marmer di cream |
| Molten Metal | `molten-metal` | ogl | ✔ | ⚠️ plasma filamen white-hot |
| Orb | `orb` | ogl | ✔ | 🟡 orb energi; `backgroundColor='#000000'` default gelap |
| Particles | `particles` | ogl | ✔ | ✅ partikel halus connect-line; `color` #ffffff → tinta di cream, `particleCount`/speed bisa dikecilkan |
| Pixel Blast | `pixel-blast` | three.js + canvas 2D | ✔ | 🟡 ledakan piksel + postprocessing liquid |
| Pixel Snow | `pixel-snow` | three.js | ✔ | ✅🟡 salju piksel jatuh pelan; warna via props → "debu/debu kertas" bila di-subtletikan |
| Plasma | `plasma` | ogl | ✔ | 🟡 plasma organik morphing; palet props |
| Plasma Wave | `plasma-wave` | ogl | ✔ | 🟡 interferensi dual-wave raymarched; default ungu/cyan |
| Prism | `prism` | ogl | ✔ | 🟡 prism berputar; intensity/size/colors props |
| Prismatic Burst | `prismatic-burst` | ogl | ✔ | 🟡 burst sinar prisma |
| Radar | `radar` | ogl | ✔ | ⚠️ sweep radar militer |
| Ripple Grid | `ripple-grid` | ogl | ✔ | ✅🟡 grid garis berriak kontinu, monokrom putih → tinta tipis di cream |
| Scanner | `scanner` | ogl | ✔ | 🟡 pita interferensi tenang ala osiloskop |
| Shape Grid | `shape-grid` | canvas 2D | – | ✅🟡 grid bentuk (kotak/heksagon/lingkaran/segitiga); warna props (#999/#222) |
| Side Rays | `side-rays` | ogl | ✔ | 🟡 sinar lateral; warna props |
| Silk | `silk` | three.js (R3F) | ✔ | ✅ **gelombang sutra lembut + grain**; `color` #7B7481 → ivory/tan = satin kertas |
| Sliced Waves | `sliced-waves` | ogl | ✔ | 🟡 bar equalizer berriak lembut; palet props |
| Soft Aurora | `soft-aurora` | ogl | ✔ | ✅ aurora lembut cosine-gradient; `color1` default #f7f7f7 (terang!), band halus |
| Threads | `threads` | ogl | ✔ | ✅ **pola garis fabric-like**; `color=[1,1,1]` → benang tinta di linen |
| Topography | `topography` | ogl | ✔ | ✅ **peta kontur hidup**; `lowColor`/`midColor`/`highColor` props → kontur tinta sepia di kertas |
| Waves | `waves` | canvas 2D | – | ✅🟡 lapisan garis gelombang halus; warna via props |
| Web Threads | `web-threads` | ogl | ✔ | 🟡 benang sine menyatu ke titik konvergensi bercahaya; `color1..3` props |

---

## B. ANIMATIONS (37)

| Nama | URL (`reactbits.dev/animations/…`) | Teknologi | GLSL | Paper |
|---|---|---|---|---|
| Animated Content | `animated-content` | GSAP | – | ✅ wrapper entrance scroll/mount |
| Antigravity | `antigravity` | three.js | – | ✅🟡 medan partikel 3D repel kursor; warna via props |
| Blob Cursor | `blob-cursor` | GSAP | – | ✅ kursor blob organik (SVG) |
| Click Spark | `click-spark` | canvas 2D | – | ✅ percikan klik; warna props |
| Crosshair | `crosshair` | GSAP | – | ✅ kursor crosshair + hover link |
| Cubes | `cubes` | GSAP | – | ✅🟡 klaster kubus 3D rotasi |
| Cursor Grid | `cursor-grid` | canvas 2D | – | ✅ sel grid menyala di sekitar kursor; `color` #D946EF → tinta |
| Elastic Mesh | `elastic-mesh` | ogl | ✔ | 🟡 mesh pegas tertarik kursor; color1/color2/highlight/gridColor props |
| Electric Border | `electric-border` | canvas 2D | – | 🟡 border listrik jitter |
| Fade Content | `fade-content` | GSAP | – | ✅ fade/slide wrapper |
| Ghost Cursor | `ghost-cursor` | three.js | ✔×3 | ✅🟡 kursor hantu translucent metaball-ish |
| Glare Hover | `glare-hover` | CSS/DOM | – | ✅ kilau glare saat hover |
| Gradual Blur | `gradual-blur` | CSS/DOM | – | ✅ blur progresif saat scroll |
| Halftone Reveal | `halftone-reveal` | ogl | ✔ | ✅✅ **halftone cetak, DEFAULT `paperColor:#fff7e6` + `inkColor:#141414` — lahir untuk tema kertas hangat**; loupe reveal di kursor |
| Image Trail | `image-trail` | GSAP | – | ✅ jejak gambar mengikuti kursor |
| Laser Flow | `laser-flow` | three.js | ✔ | ⚠️ laser mengalir di permukaan |
| Logo Loop | `logo-loop` | CSS/DOM | – | ✅ marquee logo seamless |
| Magic Rings | `magic-rings` | three.js | ✔ | 🟡 cincin magis interaktif |
| Magnet | `magnet` | CSS/DOM | – | ✅ elemen tertarik ke kursor |
| Magnet Lines | `magnet-lines` | CSS/DOM (SVG) | – | ✅ ladang garis menekuk ke kursor; `lineColor` #efefef → #6b5d4f |
| Meta Balls | `meta-balls` | ogl | ✔ | ✅🟡 blob liquid merge/separate; `color`/`cursorBallColor` #ffffff → tinta, `enableTransparency` |
| Metallic Paint | `metallic-paint` | **raw WebGL** (+fallback 2D) | ✔ | 🟡 cat metalik cair untuk SVG/logo; lightColor/darkColor/tintColor props |
| Noise | `noise` | **canvas 2D** (0 dep) | – | ✅✅ **overlay film-grain** (`patternAlpha`=15/255) — tekstur kertas universal, taruh di atas apa pun |
| Orbit Images | `orbit-images` | Motion (framer) | – | ✅ gambar mengorbit path SVG |
| Pixel Swap | `pixel-swap` | CSS/DOM | – | ✅ transisi assemble piksel antar konten |
| Pixel Trail | `pixel-trail` | three.js (R3F) | ✔ | ✅🟡 jejak piksel memudar; `pixelColor` props → graphite |
| Pixel Transition | `pixel-transition` | GSAP | – | ✅ dissolve piksel saat hover |
| Ribbons | `ribbons` | ogl | ✔ | ✅🟡 pita fisika mengikuti kursor; `colors` props, `backgroundColor:[0,0,0,0]` transparan |
| Ripple Distortion | `ripple-distortion` | ogl | ✔×2 | 🟡 displacement air + wake meluruh pada konten/gambar |
| Scroll Expand | `scroll-expand` | CSS/DOM | – | ✅ frame media membesar saat scroll |
| Shape Blur | `shape-blur` | three.js | ✔ | 🟡 bentuk geometris blur morph saat hover |
| Splash Cursor | `splash-cursor` | **raw WebGL** (fluid sim, 41KB) | ✔×10 | 🟡 sim fluida penuh (curl, vorticity) — splash cair di kursor |
| Star Border | `star-border` | CSS/DOM | – | ✅ border sparkle berputar |
| Sticker Peel | `sticker-peel` | GSAP | – | ✅ stikel sticker 3D peel |
| Strands | `strands` | ogl | ✔×2 | ✅🟡 pita strand berkilau weave; palette props (`#FF4242`…) + glass/refraction opsional |
| Swarm Cursor | `swarm-cursor` | ogl | ✔×2 | ✅🟡 kawanan partikel flocking mengejar kursor; `color`/`accentColor` props |
| Target Cursor | `target-cursor` | GSAP | – | ✅ kursor 4 sudut mengunci target |

---

## C. TEXT ANIMATIONS (32)

| Nama | URL (`reactbits.dev/text-animations/…`) | Teknologi | GLSL | Paper |
|---|---|---|---|---|
| ASCII Text | `ascii-text` | three.js + canvas 2D | ✔ | ✅🟡 teks dari ASCII animasi; `textColor` #fdf9f3 → tinta |
| Blur Text | `blur-text` | Motion | – | ✅ reveal blur→tajam |
| Circular Text | `circular-text` | Motion | – | ✅ teks melingkar berputar |
| Count Up | `count-up` | Motion | – | ✅ counter angka |
| Curved Loop | `curved-loop` | SVG/DOM | – | ✅ teks loop melengkung + drag |
| Decrypted Text | `decrypted-text` | Motion | – | ✅ efek dekripsi glyph |
| Depth Text | `depth-text` | CSS/DOM | – | ✅ ekstrusi paralaks |
| Echo Text | `echo-text` | CSS/DOM | – | ✅ salinan ghost menyusul lalu menumpuk |
| Falling Text | `falling-text` | matter-js | – | ✅ huruf jatuh gravitasi |
| Fold Text | `fold-text` | GSAP | – | ✅✅ **baris terbuka seperti kertas terlipat** — tematik banget |
| Fuzzy Text | `fuzzy-text` | canvas 2D | – | ✅ teks bergetar; `color` props |
| Glitch Text | `glitch-text` | CSS/DOM | – | 🟡 RGB-split glitch |
| Gradient Text | `gradient-text` | Motion | – | ✅ sapuan gradient di teks |
| Masked Heading | `masked-heading` | GSAP | – | ✅ headline besar dengan mesh warna menerobos mask |
| Particle Text | `particle-text` | canvas 2D | – | ✅✅ teks dari partikel drift; `fillStyle`/`highlightColor` props → debu tinta |
| Rotating Text | `rotating-text` | Motion | – | ✅ rotasi frasa 3D |
| Scrambled Text | `scrambled-text` | GSAP | – | ✅ distorsi dekat kursor |
| Scroll Float / Reveal / Velocity | `scroll-float` `scroll-reveal` `scroll-velocity` | GSAP / Motion | – | ✅ trio scroll-teks |
| Shiny Text | `shiny-text` | Motion | – | ✅ sheen metalik menyapu teks |
| Shuffle | `shuffle` | GSAP | – | ✅ karakter shuffle sebelum settle |
| Split Flap Text | `split-flap-text` | CSS/DOM | – | ✅ papan keberangkatan flip |
| Split Text | `split-text` | GSAP | – | ✅ stagger per karakter/kata |
| Stroke Text | `stroke-text` | GSAP | – | ✅ outline menggambar diri lalu terisi |
| Text Cursor | `text-cursor` | Motion | – | ✅ teks mengikuti kursor |
| Text Loop | `text-loop` | GSAP | – | ✅ marquee path SVG |
| Text Pressure | `text-pressure` | CSS/DOM | – | ✅ skala/warp teks by pointer |
| Text Type | `text-type` | GSAP | – | ✅ typewriter + cursor |
| True Focus | `true-focus` | Motion | – | ✅ blur/fokus per kata |
| Variable Proximity | `variable-proximity` | Motion | – | ✅ styling font by jarak kursor |
| Warp Text | `warp-text` | ogl + canvas 2D | ✔ | ✅🟡 teks dibiaskan WebGL di sekitar pointer; `color` #f8f5ff → tinta |

---

## D. Detail Komponen Fokus Bertekstur Halus (rekomendasi paper-warm)

### Tier 1 — siap pakai untuk kertas hangat terang
1. **Halftone Reveal** (`animations/halftone-reveal`, ogl, GLSL ✔) — matriks titik cetak yang menajam di sekitar kursor (loupe). Default `inkColor:#141414`, `paperColor:#fff7e6`. Shader inti: lingkaran dot anti-aliased via `smoothstep(r+w, r-w, d)` + `fwidth`, radius reveal `loupe = 1-smoothstep(radius-band, radius+band, dist)`.
2. **Noise** (`animations/noise`, canvas 2D, 0 dep) — grain overlay: pola noise acak digambar ke canvas, refresh interval 2 frame, `patternAlpha=15` (≈6%). Pasang absolute inset-0 sebagai lapisan tekstur kertas di SEMUA section. Bukan GLSL.
3. **Silk** (`backgrounds/silk`, three.js/R3F, GLSL ✔) — kain sutra berkilau lembut:
   ```glsl
   float pattern = 0.6 + 0.4 * sin(5.0*(tex.x + tex.y + cos(3.0*tex.x + 5.0*tex.y) + 0.02*tOffset)
                  + sin(20.0*(tex.x + tex.y - 0.1*tOffset)));
   vec4 col = vec4(uColor,1.0) * pattern - rnd/15.0 * uNoiseIntensity;
   ```
   `color` default #7B7481 → ganti ivory `#EAE3D2`/tan `#DCCFB8`, `noiseIntensity` 0.3–0.5 = moiré kertas sutra hangat.
4. **Grainient** (`backgrounds/grainient`, ogl, GLSL ✔) — gradient bergrain: warp `sin()` dua-sumbu + hash/value-noise grain, semua via uniforms (`uColor1..3`, `uWarpFrequency`, `uTimeSpeed`, `uZoom`). Set `#F3EBDD / #E4D3BC / #C9B18F` → kertas dagu berbayang.
5. **Threads** (`backgrounds/threads`, ogl, GLSL ✔) — benang fabric-like melengkung reaktif mouse: loop `u_line_count` garis dengan `smoothstep` mask, `fragColor = vec4(uColor * colorVal, colorVal)` (premultiplied, transparan). `color=[1,1,1]` → `[0.24,0.21,0.17]` = benang tinta di linen.
6. **Topography** (`backgrounds/topography`, ogl, GLSL ✔) — kontur peta hidup: field morfing, garis `fract(field*uBands)` + anti-alias `fwidth`, tint elevasi `mix(uLow,uMid,uHigh)` + glow opsional + bump kursor. Palet `#8A6F52 / #B99B77 / #3B342A` = peta topografi sepia.
7. **Particles** (`backgrounds/particles`, ogl, GLSL ✔ point-sprite):
   ```glsl
   float d = length(uv - vec2(0.5));
   float circle = smoothstep(0.5, 0.4, d) * 0.8;
   gl_FragColor = vec4(vColor + 0.2*sin(uv.yxx + uTime + vRandom.y*6.28), circle);
   ```
   `color` #ffffff, `particleCount`, `connectDistance` dsb. → partikel debu tinta `#4A4238` halus di cream.

### Tier 2 — satu langkah ganti palet
8. **Soft Aurora** (`soft-aurora`, ogl, GLSL ✔) — cosine-gradient aurora 3D-Perlin; `col += auroraGlow(t) * cosineGradient(...) * uColorN`; default `color1:#f7f7f7` sudah terang; pair dengan `color2` peach.
9. **Aurora** (`aurora`, ogl, GLSL ✔) — ramp warna `COLOR_RAMP(colors[3], uv.x)` + `height = exp(snoise(...))`, output premultiplied-alpha → di atas cream jadi aurora pastel. Stops hangat: `["#F4A261","#E76F51","#E9C46A"]`.
10. **Iridescence** (`iridescence`, ogl, GLSL ✔) — loop `for(i<8){ a+=cos(i-d-a*uv.x); d+=sin(uv.y*i+a);} col = cos(col*cos(vec3(d,a,2.5))*0.5+0.5)*uColor;` — kilau mutiara; `amplitude` 0.05 + `speed` 0.5 di cream = opalescent kertas dongker emas.
11. **Web Threads / Sliced Waves / Line Waves / Ripple Grid** (ogl, GLSL ✔) — keluarga garis/benang bercahaya; semua `color1..3`/brightness props; turunkan glow, naikkan ketebalan garis tipis → teknik "etched lines".
12. **Dot Grid / Dot Field / Shape Grid** (GSAP+canvas2D / canvas2D / canvas2D, tanpa GLSL) — grid titik/bentuk interaktif murah (tanpa dependency shader); warna via props.
13. **Liquid Ether** (`liquid-ether`, three.js, GLSL ×7) — pigmen fluida marmer; `colors` props → marbling tinta di kertas (efek suminagashi) tapi berat.
14. **Strands / Ribbons / SwarmCursor / MetaBalls / PixelTrail** (ogl/three, GLSL ✔) — keluarga trail/partikel dengan canvas transparan + palet props → aksen tinta bergerak di hero paper.
15. **Fold Text / Particle Text / Warp Text / Fuzzy Text** — pasangan teks bertema kertas: lipatan kertas, debu-partikel membentuk judul, refraksi lensa di judul.

### Hindari untuk paper (dark-neon by design)
Dark Veil, Hyperspeed, Galaxy, Radar, Evil Eye, Faulty Terminal, Light Rays/Tunnel/Pillar/Fall, Lightning, Molten Metal, Grid Scan, Acid Squares, Laser Flow, Letter Glitch.

---

## E. Snippet GLSL representatif lain

```glsl
// DITHER (three.js) — posterize + fbm
float pattern(vec2 p){ vec2 p2=p-time*waveSpeed; return fbm(p+fbm(p2)); }
void main(){
  float f = pattern(uv);
  vec3 col = mix(vec3(0.0), waveColor, f); // lalu quantize colorNum level
  gl_FragColor = vec4(col,1.0);
}

// AURORA (ogl) — color ramp + exp(noise)
float height = snoise(vec2(uv.x*2.0 + uTime*0.1, uTime*0.25)) * 0.5 * uAmplitude;
height = exp(height); height = uv.y*2.0 - height + 0.2;
float intensity = 0.6*height;
float auroraAlpha = smoothstep(midPoint-uBlend*0.5, midPoint+uBlend*0.5, intensity);
fragColor = vec4(intensity*rampColor*auroraAlpha, auroraAlpha);

// IRIDESCENCE (ogl) — iterasi cos/sin 8x
float d=-uTime*0.5*uSpeed, a=0.0;
for(float i=0.;i<8.;++i){ a+=cos(i-d-a*uv.x); d+=sin(uv.y*i+a);}
vec3 col = cos(col*cos(vec3(d,a,2.5))*0.5+0.5)*uColor;

// TOPOGRAPHY (ogl) — kontur anti-aliased
float f = fv*uBands; float frac=fract(f);
float lineDist = min(frac,1.0-frac);
float aa = fwidth(f)+1e-4;
float mask = 1.0 - smoothstep(uThickness-aa, uThickness+aa, lineDist);

// THREADS (ogl) — benang fabric
for(int i=0;i<u_line_count;i++){
  float p=float(i)/float(u_line_count);
  line_strength *= (1.0 - lineFn(uv, u_line_width*pixel(1.0,iResolution.xy)*(1.0-p),
                    p, PI*p, uMouse, iTime, uAmplitude, uDistance));
}
fragColor = vec4(uColor*(1.0-line_strength), 1.0-line_strength);

// SPLASH CURSOR (raw WebGL, 0 dep) — fluid solver penuh: advection, curl/vorticity,
// divergence, pressure Jacobi, dye display (10 shader terpisah, port WebGL-Fluid-Simulation)
```

---

## F. Artefak pendukung (folder `research/reactbits/`)
- `catalog.json` — metadata 122 komponen (slug, tech, deps, GLSL flag, hex default, jumlah shader).
- `rb_snippets/<slug>.glsl` — shader mentah per komponen (63 komponen bershal).
- `rb_code/{kategori}/<slug>__<File>.tsx|.css` — kode lengkap varian TS-CSS (= tab Code di situs).
- `rb_registry/*.json` — 665 registry JSON (JS/TS × CSS/TW).
