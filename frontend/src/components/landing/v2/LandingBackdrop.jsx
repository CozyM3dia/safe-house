import { useEffect, useRef } from 'react';
import { prefersLiteMedia } from '../../../lib/responsive';

/**
 * LandingBackdrop — latar penuh halaman: medan kontur topografi yang
 * merayap sangat pelan (shader WebGL, tanpa dependency — three.js tetap
 * eksklusif untuk RailScene3D).
 *
 * Desain:
 * - fbm + domain warp dua lapis → garis kontur organik ala peta sediment,
 *   bukan gradien blob. Kontur mayor (tiap 5) sedikit lebih tebal.
 * - Drift mengikuti scroll halaman (parallax halus) + waktu.
 * - Satu sapuan aksen copper yang mengorbit lambat, hanya menyorot garis.
 * - Palet dari token tema (dark mocha / light paper) via uniform; ganti
 *   tema tidak recompile shader.
 *
 * Kontrak teknis:
 * - fixed di belakang seluruh halaman (z -10, root .lp wajib `isolate`),
 *   pointer-events none, aria-hidden.
 * - Internal resolution di-cap (DPR ≤ 1,5; lebar ≤ 1600px) + render ~30fps
 *   + pause saat tab hidden → biaya GPU konstan dan kecil.
 * - prefers-reduced-motion: render SATU frame statis, tanpa loop.
 * - Tanpa WebGL: canvas tetap transparan → fallback pola kontur SVG statis.
 * - Context loss ditangani (preventDefault + re-init saat restore).
 * - Cleanup penuh saat unmount (rAF, observer, listener, GL).
 */

const VERT = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

function buildFragSrc(hasDeriv) {
  const header = hasDeriv
    ? '#extension GL_OES_standard_derivatives : enable\n#define LP_DERIV 1\n'
    : '#define LP_DERIV 0\n';
  return `${header}precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform float u_scroll;
uniform float u_grain;
uniform vec3 u_bg;
uniform vec3 u_line;
uniform vec3 u_accent;
uniform float u_line_str;
uniform float u_major_str;
uniform float u_accent_str;
uniform float u_relief;
uniform float u_vign;

float hash(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 4; i++) {
    v += amp * vnoise(p);
    p = rot * p * 2.03 + vec2(11.7, 5.3);
    amp *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / u_res.y;
  vec2 p = vec2(uv.x * aspect, uv.y);
  float t = u_time;

  // Drift sediment: rayap pelan + mengikuti scroll halaman (parallax).
  // Kecepatan di-tone-down (feedback user): ~40% lebih lambat dari versi awal.
  vec2 drift = vec2(t * 0.0058, -t * 0.0038 + u_scroll);

  // Domain warp dua lapis -> kontur organik, bukan lingkaran konsentris.
  vec2 q = vec2(
    fbm(p * 0.9 + drift),
    fbm(p * 0.9 + drift + vec2(5.2, 1.3))
  );
  float r = fbm(p * 1.5 + 2.0 * q + vec2(1.7, 9.2) + 0.075 * t);
  float h = fbm(p * 1.2 + 1.7 * r + drift * 0.7);

  // Relief makro murah: pakai ulang lapis warp pertama.
  float shade = q.y;

  // Kontur minor + mayor (tiap 5 garis).
  // Formula AA selebar-piksel-konstan (topolines/GameDev.net): jarak fraksional
  // dibagi fwidth -> garis 1px konsisten di landai & curam; area curam ekstrem
  // di-fade agar tidak moiré. Tanpa derivatives: fallback lebar tetap.
  float levels = 22.0;
  float coord = h * levels;
  float f = fract(coord);
  float dist = 0.5 - abs(f - 0.5);
#if LP_DERIV
  float wC = fwidth(coord);
  float line = 1.0 - smoothstep(0.1, 1.1, dist / max(wC, 1e-5));
  line *= 1.0 - smoothstep(0.55, 1.3, wC);
#else
  float line = 1.0 - smoothstep(0.02, 0.05, dist);
#endif

  float coordM = coord * 0.2;
  float fm = fract(coordM);
  float distM = 0.5 - abs(fm - 0.5);
#if LP_DERIV
  float wM = fwidth(coordM);
  float major = 1.0 - smoothstep(0.15, 1.3, distM / max(wM, 1e-5));
  major *= 1.0 - smoothstep(0.55, 1.3, wM);
#else
  float major = 1.0 - smoothstep(0.03, 0.07, distM);
#endif

  // Relief mikro antar-bank kontur (hypsometric tipis).
  float band = smoothstep(0.0, 0.5, f) * smoothstep(1.0, 0.5, f);

  vec3 col = u_bg * (1.0 + (shade - 0.5) * u_relief + (band - 0.5) * u_relief * 0.35);

  float lineA = clamp(line * u_line_str + major * u_major_str, 0.0, 1.0);
  col = mix(col, u_line, lineA);

  // Sapuan aksen copper mengorbit sangat pelan; hanya menyorot garis.
  vec2 c1 = vec2(aspect * (0.5 + 0.44 * sin(t * 0.032)), 0.55 + 0.34 * cos(t * 0.027));
  float d1 = length(p - c1);
  float glow = exp(-d1 * d1 * 1.1);
  col = mix(col, u_accent, clamp(lineA * glow * u_accent_str, 0.0, 0.55));
  col += u_accent * glow * glow * 0.025;

  // Vignette tepi.
  vec2 e = uv - 0.5;
  col *= 1.0 - dot(e, e) * u_vign;

  // Grain film statis (hash tanpa t) — grain berkedip per-frame terlihat
  // seperti noise TV; grain kertas harus diam. Menyatukan halaman dengan
  // grain feTurbulence layer CSS.
  float g = hash(gl_FragCoord.xy * 0.7);
  col += (g - 0.5) * u_grain;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;
}

/* Palet per tema — mirror token --lp-* di landing-v2.css. */
const PALETTES = {
  dark: {
    bg: [0.102, 0.082, 0.071], // #1a1512
    line: [0.941, 0.894, 0.8], // #f0e4cc
    accent: [0.831, 0.584, 0.416], // #d4956a
    lineStr: 0.16,
    majorStr: 0.2,
    accentStr: 0.38,
    relief: 0.1,
    vign: 0.42,
    grain: 0.014,
  },
  light: {
    bg: [0.957, 0.937, 0.902], // #f4efe6
    line: [0.29, 0.208, 0.161], // #4a3529
    accent: [0.69, 0.431, 0.259], // #b06e42
    lineStr: 0.13,
    majorStr: 0.16,
    accentStr: 0.3,
    relief: 0.07,
    vign: 0.16,
    grain: 0.01,
  },
};

function currentTheme() {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

export default function LandingBackdrop() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    // Ponsel / Save-Data: jangan buka context WebGL. Fallback SVG sudah ada.
    if (prefersLiteMedia()) return undefined;

    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let gl = null;
    let cleanupGl = null;
    let raf = 0;
    let disposed = false;
    let themeObs = null;
    let onResize = null;
    let onScroll = null;
    let onContextLost = null;
    let onContextRestored = null;

    const initGl = () => {
      const contextAttrs = { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' };
      gl = canvas.getContext('webgl', contextAttrs) || canvas.getContext('experimental-webgl', contextAttrs);
      if (!gl) return false;

      const hasDeriv = Boolean(
        gl.getExtension('OES_standard_derivatives')
      );

      const compile = (type, src) => {
        const sh = gl.createShader(type);
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
          const info = gl.getShaderInfoLog(sh);
          gl.deleteShader(sh);
          throw new Error(`shader: ${info}`);
        }
        return sh;
      };

      let prog;
      try {
        const vs = compile(gl.VERTEX_SHADER, VERT);
        const fs = compile(gl.FRAGMENT_SHADER, buildFragSrc(hasDeriv));
        prog = gl.createProgram();
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
          throw new Error(`link: ${gl.getProgramInfoLog(prog)}`);
        }
        gl.deleteShader(vs);
        gl.deleteShader(fs);
      } catch {
        return false; // fallback CSS
      }
      gl.useProgram(prog);

      // Fullscreen triangle.
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'a_pos');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

      const U = {};
      for (const name of [
        'u_res', 'u_time', 'u_scroll', 'u_grain', 'u_bg', 'u_line', 'u_accent',
        'u_line_str', 'u_major_str', 'u_accent_str', 'u_relief', 'u_vign',
      ]) U[name] = gl.getUniformLocation(prog, name);

      const applyPalette = () => {
        const pal = PALETTES[currentTheme()] || PALETTES.dark;
        gl.uniform3fv(U.u_bg, pal.bg);
        gl.uniform3fv(U.u_line, pal.line);
        gl.uniform3fv(U.u_accent, pal.accent);
        gl.uniform1f(U.u_line_str, pal.lineStr);
        gl.uniform1f(U.u_major_str, pal.majorStr);
        gl.uniform1f(U.u_accent_str, pal.accentStr);
        gl.uniform1f(U.u_relief, pal.relief);
        gl.uniform1f(U.u_vign, pal.vign);
        gl.uniform1f(U.u_grain, pal.grain);
      };

      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        let w = Math.round(window.innerWidth * dpr);
        const MAX_W = 1600;
        if (w > MAX_W) w = MAX_W;
        const h = Math.max(2, Math.round((w / window.innerWidth) * window.innerHeight));
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
          gl.viewport(0, 0, w, h);
        }
      };

      // Waktu terakumulasi (bukan absolute) → tanpa lompatan saat tab kembali.
      let time = reduceMotion ? 37 : 0;
      let last = performance.now();
      let frameFlip = false;
      let scrollCur = window.scrollY * 0.00045;
      let scrollTarget = scrollCur;
      let needsStaticFrame = true;

      const draw = () => {
        resize();
        applyPalette();
        gl.uniform2f(U.u_res, canvas.width, canvas.height);
        gl.uniform1f(U.u_time, time);
        gl.uniform1f(U.u_scroll, scrollCur);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      };

      const tick = (now) => {
        raf = window.requestAnimationFrame(tick);
        if (document.hidden) {
          last = now;
          return;
        }
        const dt = Math.min((now - last) / 1000, 0.1);
        last = now;
        time += dt;
        // ~30fps: drift glacial, 30fps tak terbedakan dari 60.
        frameFlip = !frameFlip;
        if (!frameFlip) return;
        scrollTarget = window.scrollY * 0.00045;
        scrollCur += (scrollTarget - scrollCur) * 0.08;
        draw();
      };

      if (reduceMotion) {
        draw(); // satu frame statis, representatif
        needsStaticFrame = false;
      } else {
        raf = window.requestAnimationFrame(tick);
      }

      onResize = () => {
        if (reduceMotion) draw();
      };
      window.addEventListener('resize', onResize, { passive: true });

      onScroll = () => {
        if (reduceMotion && needsStaticFrame) draw();
      };
      window.addEventListener('scroll', onScroll, { passive: true });

      // Ganti tema → update uniform saja (tanpa recompile).
      themeObs = new MutationObserver(() => {
        if (reduceMotion) draw();
      });
      themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

      return () => {
        window.cancelAnimationFrame(raf);
        window.removeEventListener('resize', onResize);
        window.removeEventListener('scroll', onScroll);
        if (themeObs) themeObs.disconnect();
        // Hapus resource GL tapi BIARKAN context hidup: browser mem-cache
        // context per canvas — loseContext() di cleanup StrictMode
        // (double-mount) membunuh context mount berikutnya (drawingBuffer
        // 0x0) dan webglcontextrestored tidak menyala. Deletable objects
        // (program/buffer) dibuat ulang tiap initGl, aman di-delete di sini.
        gl.deleteBuffer(buf);
        gl.deleteProgram(prog);
        gl = null;
      };
    };

    const start = () => {
      if (disposed) return;
      cleanupGl = initGl();
      // initGl gagal → biarkan fallback SVG terlihat (canvas transparan).
    };

    onContextLost = (e) => {
      e.preventDefault();
      if (cleanupGl) {
        cleanupGl();
        cleanupGl = null;
      }
    };
    onContextRestored = () => start();
    canvas.addEventListener('webglcontextlost', onContextLost);
    canvas.addEventListener('webglcontextrestored', onContextRestored);

    start();

    return () => {
      disposed = true;
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      if (cleanupGl) cleanupGl();
    };
  }, []);

  return (
    <div className="lp-backdrop" aria-hidden="true">
      {/* Fallback statis: terlihat bila WebGL tak tersedia / saat init */}
      <div className="lp-backdrop-fallback" />
      <canvas ref={canvasRef} className="lp-backdrop-canvas" />
    </div>
  );
}
