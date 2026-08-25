import { useEffect, useRef } from 'react';

/**
 * HalftoneReveal — panel "cetak halftone" interaktif (adaptasi komponen
 * Halftone Reveal React Bits, di-port ke raw WebGL1 tanpa dependency ogl).
 *
 * Foto dirender sebagai matriks titik cetak ink-on-paper; kursor menjadi
 * loupe yang memperlihatkan foto tajam di dalam lingkaran reveal (dengan
 * lens-bend + chromatic aberration ringan ala kaca pembesar).
 *
 * Kontrak teknis (sama dengan LandingBackdrop):
 * - Canvas overlay di atas <img> fallback; tanpa WebGL / gambar gagal →
 *   img tetap terlihat (degradasi anggun).
 * - DPR cap 1,5; loop hanya saat section in-view; ~30fps; skip draw saat
 *   nilai sudah settle; pause saat tab hidden.
 * - prefers-reduced-motion → frame statis tanpa loupe (idle bleed saja).
 * - Warna ink/paper mengikuti tema (data-theme) via uniform, tanpa recompile.
 * - Cleanup penuh saat unmount; context dibiarkan hidup (StrictMode-safe).
 */

const VERT = `
attribute vec2 a_pos;
varying vec2 vUv;
void main() {
  vUv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

/* Mono halftone + loupe reveal. Di-port dari halftone-reveal.glsl
   (React Bits, ogl/WebGL2) → WebGL1: texture2D, varying, extension derivatives. */
const FRAG = `
#extension GL_OES_standard_derivatives : enable
precision highp float;

uniform sampler2D tMap;
uniform vec2 iResolution;
uniform vec2 uImageSize;
uniform vec2 uMouse;
uniform float uActivity;
uniform float uDotSize;
uniform float uDensity;
uniform float uAngle;
uniform vec3 uInk;
uniform vec3 uPaper;
uniform float uRevealRadius;
uniform float uEdge;
uniform float uIdleReveal;
uniform float uContrast;

varying vec2 vUv;

vec2 uAspect() {
  return vec2(iResolution.x / max(iResolution.y, 1.0), 1.0);
}

vec2 coverUv(vec2 uv) {
  float ia = uImageSize.x / max(uImageSize.y, 1.0);
  float pa = iResolution.x / max(iResolution.y, 1.0);
  vec2 s = pa > ia ? vec2(1.0, ia / pa) : vec2(pa / ia, 1.0);
  return (uv - 0.5) * s + 0.5;
}

vec3 gradeRGB(vec3 c) {
  return clamp((c - 0.5) * uContrast + 0.5, 0.0, 1.0);
}

mat2 rot(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}

vec4 sampleCell(vec2 st, float dens, float ang) {
  vec2 rp = rot(ang) * st * dens;
  vec2 center = floor(rp) + 0.5;
  vec2 stC = rot(-ang) * (center / dens);
  vec2 uvC = stC / uAspect();
  return texture2D(tMap, clamp(coverUv(uvC), 0.0, 1.0));
}

float coverage(vec2 st, float dens, float ang, float ink) {
  vec2 rp = rot(ang) * st * dens;
  vec2 f = fract(rp) - 0.5;
  float d = length(f);
  float r = sqrt(clamp(ink, 0.0, 1.0)) * 0.72 * uDotSize;
  float w = length(fwidth(rp)) * 0.6 + 1e-4;
  return smoothstep(r + w, r - w, d);
}

void main() {
  vec2 aspect = uAspect();
  vec2 st = vUv * aspect;
  float ang = radians(uAngle);

  vec2 duv = (vUv - uMouse) * aspect;
  float dist = length(duv);

  float radius = max(uRevealRadius, 1e-4) * mix(0.4, 1.0, uActivity);
  float px = 1.4 / max(iResolution.y, 1.0);
  float band = max(px, radius * (1.0 - clamp(uEdge, 0.0, 1.0)) * 0.45);
  float loupe = 1.0 - smoothstep(radius - band, radius + band, dist);
  float focus = clamp(max(loupe * uActivity, uIdleReveal), 0.0, 1.0);

  float lum = dot(gradeRGB(sampleCell(st, uDensity, ang).rgb), vec3(0.299, 0.587, 0.114));
  float cov = coverage(st, uDensity, ang, 1.0 - lum);
  vec3 print = mix(uPaper, uInk, cov);

  float t = clamp(dist / radius, 0.0, 1.0);
  float bend = t * t * t * t;
  vec2 dir = dist > 1e-5 ? duv / dist : vec2(0.0);
  vec2 off = dir * bend * radius * 0.22 / aspect;
  vec2 ca = dir * bend * 0.0045 / aspect;
  vec3 sharp = gradeRGB(vec3(
    texture2D(tMap, clamp(coverUv(vUv - off - ca), 0.0, 1.0)).r,
    texture2D(tMap, clamp(coverUv(vUv - off), 0.0, 1.0)).g,
    texture2D(tMap, clamp(coverUv(vUv - off + ca), 0.0, 1.0)).b
  ));

  gl_FragColor = vec4(mix(print, sharp, focus), 1.0);
}
`;

const PALETTES = {
  dark: { ink: [0.941, 0.894, 0.8], paper: [0.102, 0.082, 0.071] }, // krem di atas mocha
  light: { ink: [0.29, 0.208, 0.161], paper: [0.98, 0.969, 0.945] }, // tinta coklat di atas kertas
};

const IMAGE_SRC = '/landing/landscape-break.jpg';

export default function HalftoneReveal() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const touchOnly =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(hover: none)').matches;

    let disposed = false;
    let raf = 0;
    let cleanupGl = null;
    let themeObs = null;
    let io = null;
    let ro = null;
    let onVis = null;
    let onContextLost = null;
    let onContextRestored = null;
    let img = null;

    const loadImage = () =>
      new Promise((resolve, reject) => {
        const el = new Image();
        el.decoding = 'async';
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error('image'));
        el.src = IMAGE_SRC;
      });

    const start = async () => {
      try {
        img = await loadImage();
      } catch {
        return; // fallback img tetap tampil
      }
      if (disposed) return;
      cleanupGl = initGl();
    };

    const initGl = () => {
      const gl =
        canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' }) ||
        canvas.getContext('experimental-webgl', { alpha: false });
      if (!gl) return null;
      if (!gl.getExtension('OES_standard_derivatives')) return null;

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
      let tex;
      let buf;
      try {
        const vs = compile(gl.VERTEX_SHADER, VERT);
        const fs = compile(gl.FRAGMENT_SHADER, FRAG);
        prog = gl.createProgram();
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
          throw new Error(`link: ${gl.getProgramInfoLog(prog)}`);
        }
        gl.deleteShader(vs);
        gl.deleteShader(fs);

        tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

        buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      } catch {
        return null;
      }
      gl.useProgram(prog);
      const loc = gl.getAttribLocation(prog, 'a_pos');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

      const U = {};
      for (const name of [
        'iResolution', 'uImageSize', 'uMouse', 'uActivity', 'uDotSize', 'uDensity',
        'uAngle', 'uInk', 'uPaper', 'uRevealRadius', 'uEdge', 'uIdleReveal', 'uContrast',
      ]) U[name] = gl.getUniformLocation(prog, name);

      // Parameter print: densitas & ukuran dot selaras default React Bits,
      // dikalibrasi untuk panel pendek (h-52/h-64).
      gl.uniform1f(U.uDotSize, 0.82);
      gl.uniform1f(U.uDensity, 130.0);
      gl.uniform1f(U.uAngle, 22.5);
      gl.uniform1f(U.uRevealRadius, 0.34);
      gl.uniform1f(U.uEdge, 0.62);
      gl.uniform1f(U.uContrast, 1.18);
      gl.uniform2f(U.uImageSize, img.naturalWidth || 1600, img.naturalHeight || 500);

      // Idle bleed: tanpa kursor, sebagian kecil foto tajam menembus titik.
      const idleBase = touchOnly ? 0.22 : 0.1;

      const applyTheme = () => {
        const pal = PALETTES[document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'];
        gl.uniform3fv(U.uInk, pal.ink);
        gl.uniform3fv(U.uPaper, pal.paper);
      };

      const resize = () => {
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        const w = Math.max(2, Math.round(rect.width * dpr));
        const h = Math.max(2, Math.round(rect.height * dpr));
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
          gl.viewport(0, 0, w, h);
          return true;
        }
        return false;
      };

      let mouse = { x: 0.5, y: 0.5 };
      let mouseTarget = { x: 0.5, y: 0.5 };
      let activity = 0;
      let activityTarget = 0;
      let inView = false;
      let needsDraw = true;
      let frameFlip = false;
      let last = performance.now();

      const draw = () => {
        resize();
        applyTheme();
        gl.uniform2f(U.iResolution, canvas.width, canvas.height);
        gl.uniform2f(U.uMouse, mouse.x, mouse.y);
        gl.uniform1f(U.uActivity, activity);
        gl.uniform1f(U.uIdleReveal, reduceMotion ? idleBase : idleBase * (1 - activity * 0.6));
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        needsDraw = false;
      };

      const tick = (now) => {
        raf = window.requestAnimationFrame(tick);
        if (!inView || document.hidden) {
          last = now;
          return;
        }
        const dt = Math.min((now - last) / 1000, 0.1);
        last = now;
        frameFlip = !frameFlip;
        if (!frameFlip) return;
        const k = Math.min(1, dt * 9);
        const dx = mouseTarget.x - mouse.x;
        const dy = mouseTarget.y - mouse.y;
        const da = activityTarget - activity;
        if (Math.abs(dx) < 0.0005 && Math.abs(dy) < 0.0005 && Math.abs(da) < 0.001 && !needsDraw) return;
        mouse.x += dx * k;
        mouse.y += dy * k;
        activity += da * k;
        draw();
      };

      const onMove = (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseTarget.x = (e.clientX - rect.left) / Math.max(rect.width, 1);
        mouseTarget.y = 1 - (e.clientY - rect.top) / Math.max(rect.height, 1);
        activityTarget = 1;
        needsDraw = true;
      };
      const onLeave = () => {
        activityTarget = 0;
        needsDraw = true;
      };
      if (!touchOnly && !reduceMotion) {
        canvas.parentElement.addEventListener('mousemove', onMove, { passive: true });
        canvas.parentElement.addEventListener('mouseleave', onLeave, { passive: true });
      }

      io = new IntersectionObserver(
        (entries) => {
          inView = entries[0]?.isIntersecting ?? false;
          if (inView) {
            needsDraw = true;
            if (reduceMotion) draw();
          }
        },
        { threshold: 0.05 }
      );
      io.observe(canvas);

      ro = new ResizeObserver(() => {
        needsDraw = true;
        if (reduceMotion) draw();
      });
      ro.observe(canvas);

      onVis = () => {
        if (!document.hidden) {
          needsDraw = true;
          if (reduceMotion) draw();
        }
      };
      document.addEventListener('visibilitychange', onVis);

      themeObs = new MutationObserver(() => {
        needsDraw = true;
        if (reduceMotion) draw();
      });
      themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

      draw();

      // Reduced motion: TANPA loop — frame statis; observer di atas yang
      // memicu redraw saat resize / ganti tema / kembali visible.
      if (!reduceMotion) raf = window.requestAnimationFrame(tick);
      return () => {
        window.cancelAnimationFrame(raf);
        canvas.parentElement.removeEventListener('mousemove', onMove);
        canvas.parentElement.removeEventListener('mouseleave', onLeave);
        if (io) io.disconnect();
        if (ro) ro.disconnect();
        document.removeEventListener('visibilitychange', onVis);
        if (themeObs) themeObs.disconnect();
        gl.deleteTexture(tex);
        gl.deleteBuffer(buf);
        gl.deleteProgram(prog);
      };
    };

    onContextLost = (e) => {
      e.preventDefault();
      if (cleanupGl) {
        cleanupGl();
        cleanupGl = null;
      }
    };
    onContextRestored = () => {
      if (!disposed && img) cleanupGl = initGl();
    };
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

  return <canvas ref={canvasRef} className="lp-halftone-canvas" aria-hidden="true" />;
}
