import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import buildSeismic from './scenes/SceneSeismic';
import buildFlood from './scenes/SceneFlood';
import buildLiquefaction from './scenes/SceneLiquefaction';
import buildVolcanic from './scenes/SceneVolcanic';
import buildTerrain from './scenes/SceneTerrain';

/**
 * RailScene3D — manajer render 3D bersama untuk 5 kartu rail.
 *
 * Optimasi brutal (masalah: 5 WebGL context + 5 PMREM + 5 loop = berat, apalagi mobile):
 *  - SATU renderer WebGL offscreen untuk semua kartu; hasil tiap scene di-copy
 *    ke canvas 2D masing-masing kartu via drawImage (synchronous, murah).
 *  - PMREM RoomEnvironment dibuat SEKALI dan dibagi ke semua scene (desktop;
 *    mobile memakai lights-only agar boot instan).
 *  - Satu rAF loop dengan FPS cap (30 mobile / 60 desktop), berhenti total saat
 *    tidak ada kartu terlihat / tab hidden / reduced-motion selesai draw statis.
 *  - Kartu offscreen (slide carousel di luar viewport) tidak dirender (IO per kartu).
 *  - Build scene di-stagger 1 per frame supaya kompilasi shader tidak menggantung
 *    main thread.
 *  - Buffer render internal kecil dan tetap (384x156) → biaya GPU per frame minim
 *    di perangkat mana pun; DPR canvas 2D dibatasi (1 mobile / 1.5 desktop).
 *  - Renderer di-dispose otomatis setelah 90 dtk idle; chunk tetap lazy.
 *
 * Kontrak scene modules tidak berubah: build(scene, { accent, camera }) => update(t).
 */

const ACCENTS = {
  seismic: 0xd4956a,
  flood: 0x7a9cbe,
  liquefaction: 0x9db48a,
  volcanic: 0xe0a35c,
  terrain: 0xb98a6e,
};

const BUILDERS = {
  seismic: buildSeismic,
  flood: buildFlood,
  liquefaction: buildLiquefaction,
  volcanic: buildVolcanic,
  terrain: buildTerrain,
};

/* Buffer render internal (rasio ~2.46, mendekati rasio kartu) */
const BUF_W = 320;
const BUF_H = 130;
const IDLE_DISPOSE_MS = 90_000;

const isMobile = () =>
  window.matchMedia('(pointer: coarse)').matches ||
  Math.min(window.innerWidth, window.innerHeight) < 640;

/* ── Manajer singleton ───────────────────────────────────────────────────── */

const M = {
  renderer: null,
  camera: null,
  envTex: null,
  pmrem: null,
  entries: new Map(),
  pending: [],
  raf: 0,
  lastDraw: 0,
  t0: 0,
  booted: false,
  failed: false,
  reduce: false,
  idleTimer: 0,
  rotate: 0,

  boot() {
    if (this.booted || this.failed) return;
    const mobile = isMobile();
    this.reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !mobile,
        alpha: true,
        powerPreference: 'low-power',
        preserveDrawingBuffer: false,
      });
    } catch {
      this.failed = true; // tanpa WebGL → fallback SVG vignette di induk
      return;
    }
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setSize(BUF_W, BUF_H, false);

    const camera = new THREE.PerspectiveCamera(36, BUF_W / BUF_H, 0.1, 50);
    camera.position.set(0, 2.5, 5.4);
    camera.lookAt(0, -0.05, 0);

    this.renderer = renderer;
    this.camera = camera;
    this.booted = true;
    this.t0 = performance.now();
    this.onVisChange = () => {
      if (document.hidden) this.stop();
      else this.wake();
    };
    document.addEventListener('visibilitychange', this.onVisChange);

    // Env IBL desktop-only & dinamis: mobile boot tanpa PMREM (hemat ±ratusan ms)
    if (!mobile && !this.reduce) {
      import('three/examples/jsm/environments/RoomEnvironment.js')
        .then(({ RoomEnvironment }) => {
          if (!this.booted) return;
          const pmrem = new THREE.PMREMGenerator(renderer);
          this.envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
          this.pmrem = pmrem;
          for (const e of this.entries.values()) {
            if (e.scene) e.scene.environment = this.envTex;
          }
        })
        .catch(() => {});
    }
  },

  onVisChange: null, // diisi di boot (arrow agar bound)

  wake() {
    if (this.failed || this.raf) return;
    if (![...this.entries.values()].some((e) => e.visible) && !this.pending.length) return;
    this.lastDraw = 0;
    const fpsCap = isMobile() ? 24 : 30;
    const minDelta = 1000 / fpsCap;

    const tick = (now) => {
      this.raf = requestAnimationFrame(tick);
      if (document.hidden) return;

      // Bangun maksimal 1 scene per frame → kompilasi shader tak pernah memblok
      if (this.pending.length) {
        const e = this.entries.get(this.pending.shift());
        if (e) this.buildEntry(e);
      }

      const active = [];
      for (const e of this.entries.values()) {
        if (e.scene && e.visible) active.push(e);
      }
      if (!active.length && !this.pending.length) {
        this.stop();
        return;
      }
      if (this.reduce) {
        // Reduced motion: satu frame statis per kartu, lalu loop berhenti sendiri
        for (const e of active) {
          if (!e.staticDrawn) {
            this.draw(e, 400);
            e.staticDrawn = true;
          }
        }
        if (!this.pending.length && this.entries.size && [...this.entries.values()].every((x) => x.staticDrawn || !x.visible)) {
          this.stop();
        }
        return;
      }
      if (now - this.lastDraw < minDelta - 0.5) return; // FPS cap
      this.lastDraw = now;

      const t = (now - this.t0) / 1000;
      // Drift kamera bersama (semua scene "difilmkan" dengan gerak identik).
      // Update scene di-round-robin: per frame hanya ceil(n/2) scene update,
      // giliran bergantian tiap frame — tiap scene dapat ±15 fps efektif di
      // 30 fps cap, halus untuk gerak pelan khas vignette ini.
      this.camera.position.x = Math.sin(t * 0.12) * 0.18;
      this.camera.lookAt(0, -0.05, 0);
      const budget = Math.ceil(active.length / 2);
      this.rotate = (this.rotate + budget) % active.length;
      for (let i = 0; i < budget; i += 1) {
        this.draw(active[(this.rotate + i) % active.length], t);
      }
    };
    this.raf = requestAnimationFrame(tick);
  },

  stop() {
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  },

  buildEntry(e) {
    if (!this.booted || this.failed || e.scene) return;
    const mobile = isMobile();
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xf0e4cc, 0x241a12, mobile ? 1.15 : 0.5));
    const dir = new THREE.DirectionalLight(0xffe8cf, mobile ? 1.5 : 1.1);
    dir.position.set(3, 5, 2.5);
    scene.add(dir);
    if (this.envTex) scene.environment = this.envTex;
    e.update =
      BUILDERS[e.variant]?.(scene, { accent: ACCENTS[e.variant] ?? 0xd4956a, camera: this.camera }) ?? null;
    e.scene = scene;
  },

  draw(e, t) {
    e.update?.(t);
    this.renderer.render(e.scene, this.camera);
    const c = e.ctx;
    c.clearRect(0, 0, e.canvas.width, e.canvas.height);
    // Synchronous same-task copy: aman tanpa preserveDrawingBuffer
    c.drawImage(this.renderer.domElement, 0, 0, e.canvas.width, e.canvas.height);
  },

  removeEntry(e) {
    this.entries.delete(e.id);
    this.pending = this.pending.filter((id) => id !== e.id);
    if (e.scene) {
      e.scene.traverse((o) => {
        o.geometry?.dispose();
        if (o.material) {
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
            m.map?.dispose();
            m.dispose();
          });
        }
      });
    }
    if (!this.entries.size) {
      this.stop();
      clearTimeout(this.idleTimer);
      // Tahan renderer ±90 dtk (kembali scroll ke section = instan), lalu bebaskan
      this.idleTimer = setTimeout(() => this.disposeAll(), IDLE_DISPOSE_MS);
    }
  },

  disposeAll() {
    this.stop();
    this.envTex?.dispose();
    this.pmrem?.dispose();
    this.renderer?.dispose();
    this.envTex = null;
    this.pmrem = null;
    this.renderer = null;
    this.camera = null;
    this.booted = false;
    if (this.onVisChange) document.removeEventListener('visibilitychange', this.onVisChange);
    this.onVisChange = null;
  },
};

/* ── Komponen per kartu (API sama seperti versi lama) ────────────────────── */

export default function RailScene3D({ variant }) {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    M.boot();
    if (M.failed) return undefined; // fallback SVG tetap tampil

    const mobile = isMobile();
    const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.5);
    const size = () => ({
      w: Math.max(2, Math.round((host.clientWidth || 272) * dpr)),
      h: Math.max(2, Math.round((host.clientHeight || 110) * dpr)),
    });

    const canvas = document.createElement('canvas');
    const s0 = size();
    canvas.width = s0.w;
    canvas.height = s0.h;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    host.appendChild(canvas);

    const entry = {
      id: Symbol('railScene'),
      variant,
      canvas,
      ctx: canvas.getContext('2d'),
      visible: true,
      scene: null,
      update: null,
      staticDrawn: false,
    };
    M.entries.set(entry.id, entry);
    M.pending.push(entry.id);
    clearTimeout(M.idleTimer);
    M.wake();

    const io = new IntersectionObserver(
      ([en]) => {
        entry.visible = en.isIntersecting;
        if (entry.visible) M.wake();
      },
      { threshold: 0.05 }
    );
    io.observe(host);

    const ro = new ResizeObserver(() => {
      const s = size();
      canvas.width = s.w;
      canvas.height = s.h;
      entry.staticDrawn = false;
      if (M.reduce) M.wake();
    });
    ro.observe(host);

    return () => {
      io.disconnect();
      ro.disconnect();
      M.removeEntry(entry);
      if (canvas.parentNode === host) host.removeChild(canvas);
    };
  }, [variant]);

  return <div ref={hostRef} className="h-full w-full" aria-hidden="true" />;
}
