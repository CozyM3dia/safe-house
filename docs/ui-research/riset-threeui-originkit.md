# Laporan Riset: Shader Background & Animated Background — ThreeUI vs Originkit

Tanggal riset: 2026-08-25. Metode: fallback `web_search` + `web_extract` + fetch HTTP langsung (Python) karena `browser_exec` diblokir menunggu persetujuan remote-debugging Chrome oleh user.

## ⚠️ Koreksi Domain (penting)

| Domain dari brief | Status DNS (Google DoH) | Situs asli |
|---|---|---|
| `threeui.dev` | **NXDOMAIN** (tidak terdaftar) | **`https://threeui.com`** ✅ |
| `threeui.org`, `three-ui.com`, `threeui.io/app` | NXDOMAIN | — |
| `originikit.com` | **NXDOMAIN** (tidak terdaftar) | **`https://www.originkit.dev`** ✅ (dengan "k": Origi**k**it) |

---

# SITUS 1 — ThreeUI (threeui.com)

**Identitas:** "Three.js Components & Interactive Shaders" — template web Three.js prosedural buatan Meng To (Design+Code). Tagline: *Procedural Three.js web design templates for agents — lightweight JS code, copyable as prompts.*

**Model lisensi:**
- **Community (gratis, open-source, MIT)** — repo `github.com/MengTo/threeui`, npm `@designcodeio/threeui`. 50 parent komponen, 111 rute, 141 free variant records + 23 singleton = 164 item browse. Kode aplikasi + kode komponen Community **MIT**; font OFL 1.1; runtime Three.js MIT. Thumbnail/preview remote tetap milik threeui.com.
- **Pro (berbayar)** — full 284 koleksi. Skema **langganan tahunan + opsi lifetime** (meta pricing: *"Compare ThreeUI Community, yearly Pro, and lifetime access"*). Angka harga hanya dirender client-side di `/pricing` (tidak terekspos di HTML statis). Source Pro di-download via CLI oleh member aktif, tidak dipublikasikan ke npm.

**Teknologi umum:** Raw WebGL/GLSL (termasuk raymarching SDF), Canvas 2D, dan Three.js **r128–r165 dengan ShaderMaterial custom** — **bukan TSL/node material**. Sebagian memakai postprocessing ringan (bloom/afterimage: Flux Vortex, Emberline, Tidecrest). Hampir semua varian punya kontrol `hue/saturation/brightness` bawaan → re-tint ke palet apapun itu trivial.

## 1a. Backgrounds — GRATIS (Community)

| Nama (varian) | Teknologi (`runtime` dari katalog) | Deskripsi visual | Adaptasi cream+copper |
|---|---|---|---|
| **Flow Field** (Portal Field family) | Canvas 2D | 2.500 partikel trail **amber/gold/coral** mengikuti simplex-noise deterministik, reaktif pointer | ★★★ Palet sudah hangat default; tinggal set bg cream, garis copper |
| **Topo Field** (Constellation Field family) | Raw WebGL | Bidang **topografi dengan elevation bands mengalir** | ★★★ Literal peta kontur — inti tema geoteknik |
| **Bell Field** (Portal Field family) | Raw WebGL + Canvas 2D | Pola nodal ala **Chladni**, motif logam + bara "foundry" naik | ★★ Nuansa logam tempa = cocok aksen copper |
| **Amber Halftone** | Three.js r128 | Point field **amber→putih** beranimasi di plane gelap | ★★ Retint terang mudah (kontrol warna) |
| **Override Grid** (Predictive Arc) | Canvas 2D | Grid override blok-per-blok dengan aksen **telemetry-orange** | ★★ Vibe grid teknik/blueprint |
| Halftone Flow | Raw WebGL | Flow field merah-oranye lewat matriks halftone 6-piksel | ★★ Hangat, tapi halftone kasar |
| Ribbon Field | Raw WebGL | Ribbon cyan/indigo/ungu lewat dot-matrix animasi | ★ Perlu re-tint total |
| Predictive Arc / Data Pixel Arc / Signal Particles | Canvas 2D + WebGL | Arch piksel violet; horizon piksel emerald; partikel sinyal gelap | ★ Gelap/vivid |
| Void Field | Raw WebGL | Void field **transparan** | ★ Transparan = gampang ditempel di terang, tapi visual abstrak |
| Liquid Form | Raw WebGL raymarching | Formasi **cairan logam silver** ray-marched, refleksi studio, kamera respons pointer | ★★ Untuk kebutuhan "marble/liquid" — retint ke copper |
| CRT (boot terminal + **Globe**) | Raw WebGL + Canvas 2D | Boot terminal era Matrix; **FBM energy sphere** dengan rim glow + star field | ★ Nebula FBM-nya bagus, estetika CRT kurang pas kertas |
| Spark Badge (Badge/Browser/iPhone/Display) | Canvas 2D | Badge kredensial diikat **curl-noise embers** + hujan bercahaya | ★★ Curl-noise ember = partikel hangat |
| Elements — Water | Raw WebGL2 | Mark refraksi + **riak sirkular** driven pointer | ★ Terdekat "caustics" di ThreeUI |
| Elements — Lightning / Fire | Raw WebGL2 | Arc **fBm** violet; ribbon api noise + bara | ★ |
| Elements — Condensation | Canvas 2D | Butir air tumbuh, merge, jatuh, splash | ★ |
| **Elements — Generative Tree** | Canvas 2D | Pohon branching painterly **sienna hangat → ujung emas**, angin pointer | ★★★ Palet sienna/gold on-brand |
| Constellation Field lainnya (Particle Drift/Network, Gateway Flow, Connectivity Graph, Interface Lines, Defense Lines) | Canvas 2D | Jaringan partikel, graf konektivitas (ada mode **light**), garis interface tipis | ★★ Interface Lines/Connectivity Graph light-mode bagus untuk latar terang |
| Laser/Matrix Junction, Atmospheric Blade, Vanishing Array, Halftone Relay | Raw WebGL | Sinar laser pointer-reactive, vapor prosedural | ★ Gelap |

## 1b. Three.js — GRATIS (Community)

| Nama | Teknologi | Visual | Catatan |
|---|---|---|---|
| **Landscape** (7 varian: Sunrise/Noon/Sunset/Night/Rain/Storm/Snow) | Three.js r149 | **Terrain prosedural tanpa tower**: rumput, batu, kabut, bintang (39.200 di Night), cuaca lengkap | ★★★ Heightmap terrain paling lengkap yang gratis; Sunrise = "low amber light crossing grass and distant ridges" |
| Sylva Living World (Living Green) | Three.js r149 | Dunia moss-root prosedural, pakis, pollen | ★ Organik hijau |
| Temple Night | Three.js r149 | Kuil Kyoto pegunungan malam, hujan+mist | ✗ |
| Country Towers (6 negara) | Three.js r149 + Canvas 2D | Menara di atas landscape prosedural | ✗ |
| Bookshelf / Complete Shelf | Three.js r165 | Rak buku interaktif | ✗ |
| **Structure Flow** (13 studies) | Three.js r128–r160 | **Topology Field**: graf topologi berputar + pulsa titik • **Nebula**: FBM 4-oktaf indigo • **Fluid Field**: fluid ShaderMaterial biru-ungu • **Emerald Horizon**: glow shader dari horizon organik • **Ember Storm**: vortex 12.000 partikel bara • **Flux Vortex**: vortex + post-process glow • Expanse/Dimensional Field (ShaderMaterial) • Dot Matrix, Orbital Sphere, Logic Core, Data Field | ★★ Topology Field alternatif "contour"; Ember Storm hangat tapi additive (lemah di latar terang) |
| Warp Field (Streaks/Letters/Keycaps/Hyperspace) | Three.js r128 | Koridor warp streaks emerald/es | ✗ |

## 1c. PRO — Backgrounds & Three.js (berbayar; deskripsi dari halaman live)

| Nama | Visual (deskripsi resmi) | Relevansi geoteknik/paper |
|---|---|---|
| **Terrain Plume** (Alpine/River/Desert/Bridge-City) | "Monochrome plume behind its exact **engraved mountain range**, foreground firs, **grain, dithered reveal**" — Alpine: 14 massif hand-placed, ridged couloirs | ★★★ Estetika **technical drawing/engraving** — paling on-brand untuk geoteknik; tinggal tinta copper di atas cream |
| **Recursive Erosion — Mountains** (+ Sphere/Branches/Nebula) | "**Ridged height field** drifting 9 detik, relief far-to-near, **scree violet tererosi dari crest hangat**, 6 lava…" | ★★★ Narasi erosi/sedimen harfiah |
| **Tidecrest Terrain** | Ridgeline terrain + bloom chain sebagai full-frame bg | ★★★ |
| Sunset Valley (Sunset/Aurora/Forest/Blue-Hour) | Lembah prosedural: "**warm canyon, glowing river, smoke, dust, grass, pointer physics**" | ★★★ Sudah hangat |
| Sylva Maple Autumn | Daun maple crimson→gold | ★★ |
| Purple Desert | Dune flight sinematik: sand ridges prosedural, range berlapis, haze | ★★ Re-tint ke cream/sand |
| At the Horizon | Figur bercahaya vs profil horizon yang larut dalam **directional threshold grain** | ★★ Grain-nya paper-like |
| Hypnotic Loops (Lines/Dots/Rays/Type) | Loop konsentris supersampled, palet **orange-to-sunset** | ★★ |
| Energy Orb / Globe (Network Globe) | Sphere energi FBM berasap; globe kontinen titik + rute | ★★ |
| Tideform Phase Field | Radial point-lattice phase field | ★ |
| Orrery | Plinth batu + cincin orbit bercahaya | ★ |
| Emberline Vortex | Vortex garis biru-putih + bloom | ✗ dingin |
| Nocturne / Cadence / Cross Beam / ASCII Vortex / Cathode / Cortexa / Axonis / Betawise / Trochil / Mira Solvang / Quantera | Kartu kredit malam, radial light field, beam blue-noise, vortex ASCII, dsb. | ✗–★ |
| Noema Bloom / Sakura Branch / Heatmap Badge / Retro Metallic / Wood Icons / Halftone Keyboard / Isometric series | Bunga partikel, keyboard, **heatmap badge** (canvas/retro/titanium/vinyl), ikon kayu | ★★ Heatmap Badge menarik untuk visualisasi data tanah |

---

# SITUS 2 — Originkit (originkit.dev)

**Identitas:** "The largest free animated component library for modern websites." Komponen animated **Framer + React** (copy-paste code), browse online, integrasi AI via **MCP server**. 260 komponen, kategori: animation, **background-animation**, text, button, border, image, image-gallery, interactive-elements, cursor + Sections (hero/features/pricing/cta/footer) & Templates.

**Lisensi (docs/licensing, dikutip):** lisensi **worldwide, non-exclusive, royalty-free, perpetual** saat mengambil komponen (copy source / editor / MCP). **Boleh:** pekerjaan komersial, unlimited projects, modifikasi bebas, proyek klien. **Larangan:** produk yang menjual/distribusikan komponennya itu sendiri ("kalau mau jual/distribusikan sesuatu yang berisi komponennya, partner dengan kami"). Inti: **gratis untuk landing geoteknik**.

**Teknologi umum:** Framer code components (React); mayoritas **raw WebGL/GLSL** — raymarching SDF, simulasi fluid **Navier-Stokes GPU**, domain-warped noise; sisanya Canvas 2D/SVG/CSS. Keyword SEO beberapa komponen menyebut three.js (`paper-image`: "three js image shader", `liquid-vortex`: "three.js noise background", `prisma-smoke`: "three js sdf"). **Tidak ada TSL.**

## 2a. Katalog background-animation + shader yang relevan

| Nama | Teknologi | Deskripsi visual | Adaptasi cream+copper |
|---|---|---|---|
| **Topo Contour** | WebGL, **canvas transparan** | **Garis kontur topografis beranimasi** di atas bidang transparan, index lines lebih tebal tiap kelima garis, roughness terrain adjustable | ★★★ **#1.** Kontur peta hidup; tinggal set stroke copper, taruh langsung di atas kertas cream tanpa membawa bg |
| **Paper Fold (paper-ridge)** | WebGL geometry | **Lembar kertas crumpled** yang melipat-flat dan kembali; creases flat-shaded, atur ukuran lipatan/kedalaman/tilt/sheen tepi | ★★★ **#1 paper texture.** Kertas harfiah untuk hero |
| Paper Image | WebGL (three.js) | Foto dipetakan ke lembar kertas WebGL, riak di bawah pointer, shading+sheen, mode Lift (mengelupas) | ★★ Elemen foto hero |
| Inkbleed | Interaktif (cursor) | Efek tinta bleed pada teks, terasa hand-drawn | ★★ Tipografi tinta di kertas |
| **Flow Field** | WebGL | Domain-warped noise mengalir satu arah — 3 treatment: satin bands, smear steered-pointer, curl-stirred paint | ★★★ Flow field hangat bila di-tint gold/copper |
| Ink Flow Field | WebGL fluid sim (**Navier-Stokes pressure-solved**) | Tinta berwarna diadvektsi medan kecepatan, diaduk pointer + drift sendiri | ★★ Tinta di kertas — set tinta copper |
| Chromatic Waves | WebGL | **Perlin noise mengalir → grid halftone dot** dengan gradient multi-warna | ★★★ Halftone print cream/copper sangat alami |
| Light Bloom | WebGL | Glow lembut dari tepi, 2 color stop, **light shafts drifting, film grain**, track pointer | ★★★ Grain + glow rendah = nuansa kertas hangat |
| Moiré Lattice | WebGL | Dua grid titik tertumpuk dengan twist → **rosette moiré** mekar di dekat cursor | ★★ Pola print/lattice teknik |
| Dither Effect | WebGL dither shader | Dither terurut beranimasi, warna/density/speed custom, repulsi cursor | ★★ Estetika cetakan retro |
| Line Ripple Background | SVG/canvas, noise field | Medan garis ber-ripple & swirl saat hover; count/speed/color customizable | ★★ Garis-garis halus di terang |
| Smokey Shader | WebGL domain-warped noise | Asap berwarna drif, tint **gradient sampai 8 warna**, swirl di sekitar pointer | ★★ Set 8-stop ke cream→sand→copper |
| Molten Cracks | WebGL **Worley/Voronoi noise** | Batu retak menyala dari dalam: jaringan fissure white-hot dekat pointer, merah redup di belakang | ★★ Metafora retakan tanah/magma — redupkan glow-nya jadi copper |
| Lava Lamp | WebGL raymarched metaballs | Blob wax naik-merge, condong ke cursor | ★ |
| Stained Glass | WebGL Voronoi | Pane mozaik kaca motley + jaringan lead, backlight mengikuti cursor | ★ |
| Liquid Vortex | WebGL shader (three.js keyword) | Vortex asap berputar ke "drain"; kontrol warna/turbulence/swirl/density + hover boost | ★ |
| Prisma Smoke | Raymarching SDF volume | Blok kaca dengan **tinta volumetrik** berputar di dalam, refraksi Fresnel, drag-to-rotate | ★★ "Marble/ink in glass" terdekat |
| Chrome Blob | Raymarched SDF | Blob **logam cair** mengikuti pointer, pecah jadi beads saat klik | ★★ Copper blob? |
| Morph Solid | Raymarched SDF | Solid metalik morph cube→sphere→octahedron→torus, drag-spin | ★ |
| Cosmic BG | WebGL, **canvas transparan** | Nebula core glow + filamen gas drift | ★ |
| Scroll Wave Field | WebGL point cloud | Ribuan titik di plane ber-riak, kamera di dalam medan, bump cursor | ★★ Dot-grid terrain-ish terang |
| Wave Arcs | Canvas 2D | Arc garis bercahaya sweep, reaktif kursor | ★ |
| Pulse Lines / Rising Lines / Reactive Grid / Kinetic Grid / Dice Wave Field / Fluid Trail / Ribbon Trails / Glowing Particles / Particle Simulation / Blackhole / Snowfall / Starburst/Stardust | Canvas/WebGL campuran | Garis sweep, partikel horizon naik, grid partikel bloom, dadu 3D raymarched, fluid GPU Navier-Stokes di cursor, dsb. | ★ kebanyakan gelap/neon |

*(Katalog penuh 260 komponen tersimpan di `originkit-meta.json` + sitemap.)*

## 2b. Yang TIDAK ada di kedua situs

- **Caustics eksplisit**: tidak ada komponen caustics air di keduanya. Terdekat: ThreeUI *Water Element* (refraksi riak), Originkit *Liquid Distortion* (simulasi fluid real-time di atas gambar, ripple cursor-driven).
- **Marble eksplisit**: tidak ada. Terdekat: ThreeUI *Liquid Form* (logam cair silver), Originkit *Prisma Smoke* (tinta volumetrik dalam kaca), *Molten Cracks* (jaringan retakan Worley — paling dekat ke "sediment").

---

# REKOMENDASI FINAL — Landing Geoteknik, kertas hangat terang (cream) + aksen copper

| Rank | Komponen | Situs | Harga | Kenapa |
|---|---|---|---|---|
| 1 | **Topo Contour** | Originkit | Gratis | Kontur topografi animasi, canvas **transparan** → overlay langsung di cream, stroke copper, index line tebal. Paling harfiah "peta tanah" |
| 2 | **Topo Field** | ThreeUI | Gratis (MIT) | Elevation bands raw-WebGL; kontrol hue/sat/brightness → copper-on-cream |
| 3 | **Paper Fold (paper-ridge)** | Originkit | Gratis | Tekstur kertas crumpled yang bernapas — identitas "kertas hangat" literal |
| 4 | **Flow Field** | ThreeUI | Gratis | 2.500 trail simplex **amber/gold/coral** — palet hangat default, zero effort |
| 5 | **Landscape — Sunrise/Noon** | ThreeUI | Gratis | Terrain heightmap prosedural + kabut amber pagi; varian cuaca lengkap |
| 6 | **Terrain Plume — Alpine** | ThreeUI | **Pro** | Gaya *engraved technical drawing* monochrome + grain — ganti tinta ke copper = brand geoteknik sempurna |
| 7 | **Recursive Erosion — Mountains** | ThreeUI | **Pro** | Ridged heightfield yang tererosi — narasi sedimentasi/erosi tanpa kata |
| 8 | Chromatic Waves | Originkit | Gratis | Perlin→halftone dots; set gradient cream/copper = nuansa cetakan survey |
| 9 | Light Bloom | Originkit | Gratis | Glow rendah + film grain sebagai "finishing paper" di section manapun |
| 10 | Bell Field / Generative Tree / Override Grid | ThreeUI | Gratis | Aksen: nodal metal+bara, sienna→gold, grid telemetry-orange |

**Catatan adaptasi teknis:**
- Hampir semua item punya kontrol warna (hue/sat/brightness atau color stops) → re-tint murah. Raw WebGL = uniform warna mudah diedit di source.
- **Hati-hati additive blending/glow di latar terang**: komponen bergaya gelap (Nebula, Ember Storm, Laser, Emberline) kehilangan glow-nya di atas cream — pilih komponen mode-normal/transparan, atau invert logika blend.
- Canvas **transparan** (Topo Contour, Cosmic BG, Void Field) adalah jalur paling aman untuk tema terang karena tidak membawa background sendiri.
- ThreeUI Community bisa dicoba langsung: `npm i @designcodeio/threeui`; Originkit bisa ditarik agent via MCP server mereka.

---

# Lampiran: file riset di `C:\Users\Sibgha\shader-research\`

- `threeui-community-catalog.json` — 240 record terparse (label/category/runtime/description/tags)
- `threeui-shaders-catalog.tsx` — katalog Community mentah dari GitHub
- `threeui-sitemap.xml` (390 URL), `originkit-sitemap.xml` (337 URL)
- `originkit-meta.json` — meta 30 komponen background Originkit
- `ok-licensing.html`, `ok-comp-*.html` — snapshot halaman Originkit
- `threeui-home.html`, `threeui-browse.html`, `threeui-pricing.html`
