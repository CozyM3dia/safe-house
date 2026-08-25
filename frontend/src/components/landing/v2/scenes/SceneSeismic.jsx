import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/**
 * Scene "Gempa" v2 — medan gelombang dua lapis, episenter, kota mini yang
 * goyang saat gelombang lewat, mobil, stasiun sensor (panel surya + kabel),
 * seismograf drum rol kertas dengan pena ganda, tebing sesar, retakan.
 *
 * Kontrak: build(scene, { accent }) => update(t) — murni, tanpa listener,
 * tanpa alokasi objek per-frame (semua geometri/material dibuat sekali di sini).
 */

const TAU = Math.PI * 2;

/* ── Util material & tekstur (pola RailScene3D, salinan lokal) ──────────── */

const std = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.04, envMapIntensity: 0.55, ...opts });

const glass = (opts = {}) =>
  new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0.05,
    transparent: true,
    opacity: 0.16,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    envMapIntensity: 2.2,
    side: THREE.DoubleSide,
    depthWrite: false,
    ...opts,
  });

const emissive = (color, intensity = 1, opts = {}) =>
  new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: 0.5, ...opts });

function shade(hex, amt) {
  const f = (c) => (amt >= 0 ? c + (255 - c) * amt : c * (1 + amt)) | 0;
  return `rgb(${f((hex >> 16) & 255)},${f((hex >> 8) & 255)},${f(hex & 255)})`;
}

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/* Sprite radial lembut (debu episenter) */
function makeSoftSprite(rgb) {
  return canvasTexture(128, 128, (ctx, S) => {
    const g = ctx.createRadialGradient(S / 2, S / 2, 2, S / 2, S / 2, S / 2);
    g.addColorStop(0, `rgba(${rgb},0.85)`);
    g.addColorStop(0.5, `rgba(${rgb},0.3)`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
  });
}

/* Fasad gedung: beton gelap + grid jendela, sebagian menyala (krem/aksen) */
function makeFacadeTexture(accentCss) {
  return canvasTexture(128, 256, (ctx, W, H) => {
    ctx.fillStyle = '#3a3129';
    ctx.fillRect(0, 0, W, H);
    // noise beton halus
    for (let i = 0; i < 260; i += 1) {
      ctx.fillStyle = `rgba(232,217,192,${Math.random() * 0.05})`;
      ctx.fillRect(Math.random() * W, Math.random() * H, 1.4, 1.4);
    }
    const cols = 5;
    const rows = 12;
    const cw = W / cols;
    const ch = H / rows;
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const lit = Math.random();
        if (lit > 0.62) ctx.fillStyle = lit > 0.88 ? accentCss : 'rgba(232,217,192,0.92)';
        else ctx.fillStyle = 'rgba(12,10,8,0.85)';
        ctx.fillRect(c * cw + cw * 0.22, r * ch + ch * 0.24, cw * 0.56, ch * 0.44);
      }
    }
    // lantai pemisah tipis
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    for (let r = 0; r <= rows; r += 1) ctx.fillRect(0, r * ch - 1, W, 2);
  });
}

/* Kertas seismogram v2: trace P+S berganda, grid milimeter, tepi robek */
function makeSeismoTraceTexture() {
  return canvasTexture(512, 128, (ctx, W, H) => {
    ctx.fillStyle = '#f2ecdd';
    ctx.fillRect(0, 0, W, H);
    // grid milimeter
    ctx.strokeStyle = 'rgba(140,110,80,0.14)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    // garis tengah penanda waktu
    ctx.strokeStyle = 'rgba(140,110,80,0.32)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, H / 2);
    ctx.lineTo(W, H / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    // trace P (halus dulu)
    ctx.strokeStyle = '#3a5a7a';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, H / 2);
    for (let x = 0; x <= W; x += 4) {
      const y = H / 2 + Math.sin(x * 0.05) * 3 + Math.sin(x * 0.21) * 2;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    // trace S (besar di kanan)
    ctx.strokeStyle = '#8c2f2f';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, H / 2);
    for (let x = 0; x <= W; x += 4) {
      const swell = x > W * 0.45 ? 1 : 0.25;
      const y =
        H / 2 +
        Math.sin(x * 0.09) * 6 * swell +
        Math.sin(x * 0.31) * 10 * swell * (Math.random() > 0.82 ? 1 : 0.35);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    // bingkai gelap tipis
    ctx.strokeStyle = 'rgba(60,40,25,0.5)';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, W, H);
  });
}

/* Panel surya: sel fotovoltaik biru-gelap dengan garis busbar */
function makeSolarTexture() {
  return canvasTexture(128, 128, (ctx, S) => {
    ctx.fillStyle = '#141c30';
    ctx.fillRect(0, 0, S, S);
    ctx.strokeStyle = 'rgba(120,150,200,0.55)';
    ctx.lineWidth = 2;
    for (let i = 1; i < 4; i += 1) {
      ctx.beginPath();
      ctx.moveTo((i * S) / 4, 0);
      ctx.lineTo((i * S) / 4, S);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, (i * S) / 4);
      ctx.lineTo(S, (i * S) / 4);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(160,190,230,0.28)';
    ctx.lineWidth = 1;
    for (let x = 8; x < S; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, S);
      ctx.stroke();
    }
  });
}

/* ── Builder scene seismic ───────────────────────────────────────────────── */

export default function build(scene, { accent }) {
  const group = new THREE.Group();
  const accentCss = `#${new THREE.Color(accent).getHexString()}`;

  /* Pelat dasar tanah */
  const base = new THREE.Mesh(
    new RoundedBoxGeometry(7, 0.5, 3.8, 2, 0.16),
    std(0x2b2118, { roughness: 0.92 })
  );
  base.position.y = -0.42;
  group.add(base);

  /* Gelombang permukaan dua lapis: wireframe halus + kasar, fase beda */
  const fineGeo = new THREE.PlaneGeometry(7, 3.6, 64, 28);
  fineGeo.rotateX(-Math.PI / 2);
  const fineField = new THREE.Mesh(
    fineGeo,
    new THREE.MeshBasicMaterial({ color: accent, wireframe: true, transparent: true, opacity: 0.36 })
  );
  fineField.position.y = -0.1;
  group.add(fineField);

  const coarseGeo = new THREE.PlaneGeometry(7, 3.6, 20, 9);
  coarseGeo.rotateX(-Math.PI / 2);
  const coarseField = new THREE.Mesh(
    coarseGeo,
    new THREE.MeshBasicMaterial({ color: 0xe8d9c0, wireframe: true, transparent: true, opacity: 0.13 })
  );
  coarseField.position.y = -0.085;
  group.add(coarseField);

  /* Tebing sesar: wedge miring bertekstur strata di belakang medan */
  const scarpTex = canvasTexture(256, 128, (ctx, S) => {
    ctx.fillStyle = '#241b13';
    ctx.fillRect(0, 0, S, S);
    for (let i = 0; i < 10; i += 1) {
      ctx.strokeStyle = `rgba(92,70,50,${0.25 + Math.random() * 0.3})`;
      ctx.lineWidth = 2 + Math.random() * 3;
      const y = Math.random() * S;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(S * 0.33, y + (Math.random() - 0.5) * 10, S * 0.66, y + (Math.random() - 0.5) * 10, S, y);
      ctx.stroke();
    }
  });
  const scarp = new THREE.Mesh(new RoundedBoxGeometry(0.7, 0.34, 3.4, 1, 0.05), std(0x241b13, { roughness: 0.95, map: scarpTex }));
  scarp.position.set(-2.2, -0.2, -0.4);
  scarp.rotation.y = 0.18;
  group.add(scarp);

  /* Retakan tanah: tiga garis gelap, satu bercabang */
  [[0.2, 0.9, 0.5, 0.4], [-0.4, 0.7, -0.6, -0.5], [0.9, 0.5, 0.9, 0.15]].forEach(([x, len, z, ry]) => {
    const crack = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.015, len), std(0x120d08, { roughness: 1 }));
    crack.position.set(x, 0.155, z);
    crack.rotation.y = ry;
    group.add(crack);
  });

  /* Episenter + 3 cincin gelombang + debu sprite */
  const epiPos = { x: -1.4, z: 0 };
  const epi = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), emissive(accent, 1.6, { roughness: 0.4 }));
  epi.position.set(epiPos.x, -0.05, epiPos.z);
  group.add(epi);
  const dust = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: makeSoftSprite('212,149,106'), transparent: true, opacity: 0.5, depthWrite: false })
  );
  dust.scale.setScalar(0.9);
  dust.position.set(epiPos.x, 0.05, epiPos.z);
  group.add(dust);
  const rings = [0, 1, 2].map((i) => {
    const r = new THREE.Mesh(
      new THREE.RingGeometry(0.96, 1, 48),
      new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
    );
    r.rotation.x = -Math.PI / 2;
    r.position.set(epiPos.x, -0.06, epiPos.z);
    r.userData.phase = i / 3;
    group.add(r);
    return r;
  });

  /* ── Kota mini: 4 gedung RoundedBox fasad jendela, goyang ter-delay ────── */
  const facades = [makeFacadeTexture(accentCss), makeFacadeTexture(accentCss)];
  const facadeMats = facades.map(
    (tex) =>
      new THREE.MeshStandardMaterial({
        map: tex,
        emissive: 0xffffff,
        emissiveMap: tex,
        emissiveIntensity: 0.5,
        roughness: 0.72,
        metalness: 0.08,
        envMapIntensity: 0.6,
      })
  );
  const roofMat = std(0x1f1913, { roughness: 0.9 });

  const buildingSpecs = [
    { x: 0.35, z: -0.75, w: 0.34, h: 0.62, d: 0.34, mat: 0 },
    { x: 0.95, z: 0.35, w: 0.3, h: 0.44, d: 0.3, mat: 1 },
    { x: 1.65, z: -0.55, w: 0.26, h: 0.78, d: 0.26, mat: 0 },
    { x: 0.15, z: 0.75, w: 0.26, h: 0.36, d: 0.26, mat: 1 },
  ];
  const buildings = buildingSpecs.map((b) => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new RoundedBoxGeometry(b.w, b.h, b.d, 2, 0.03), facadeMats[b.mat]);
    body.position.y = b.h / 2;
    const cap = new THREE.Mesh(new RoundedBoxGeometry(b.w + 0.03, 0.03, b.d + 0.03, 1, 0.01), roofMat);
    cap.position.y = b.h + 0.015;
    g.add(body, cap);
    // antena kecil di gedung tertinggi
    if (b.h > 0.6) {
      const ant = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.008, 0.16, 5),
        std(0xe8d9c0, { metalness: 0.9, roughness: 0.25, envMapIntensity: 1.3 })
      );
      ant.position.y = b.h + 0.11;
      const blink = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), emissive(accent, 1.4));
      blink.position.y = b.h + 0.2;
      g.add(ant, blink);
      g.userData.blink = blink;
    }
    g.position.set(b.x, 0.16, b.z); // duduk di atas medan gelombang
    g.userData.spec = b;
    const dx = b.x - epiPos.x;
    const dz = b.z - epiPos.z;
    g.userData.dist = Math.sqrt(dx * dx + dz * dz);
    group.add(g);
    return g;
  });

  /* ── Mobil kecil: bodi rounded + kabin kaca + roda, tergoyang/geser ───── */
  const car = new THREE.Group();
  const carBody = new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.09, 0.15, 2, 0.035), std(0xb45309, { roughness: 0.4, metalness: 0.35, envMapIntensity: 1.0 }));
  carBody.position.y = 0.07;
  const cabin = new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.07, 0.13, 2, 0.03), glass({ opacity: 0.45, color: 0xcfd8e2 }));
  cabin.position.set(-0.02, 0.145, 0);
  const wheelGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.03, 10);
  wheelGeo.rotateX(Math.PI / 2);
  const wheelMat = std(0x171310, { roughness: 0.85 });
  [[-0.1, 0.078], [0.1, 0.078], [-0.1, -0.078], [0.1, -0.078]].forEach(([wx, wz]) => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.position.set(wx, 0.045, wz);
    car.add(wheel);
  });
  car.add(carBody, cabin);
  car.position.set(-0.35, 0.17, 1.05);
  car.rotation.y = 0.12;
  group.add(car);
  const carDist = Math.sqrt((car.position.x - epiPos.x) ** 2 + (car.position.z - epiPos.z) ** 2);

  /* ── Stasiun sensor diperluas: kubah + tiang + panel surya + kabel ─────── */
  const metalDark = std(0x8d7a64, { metalness: 0.7, roughness: 0.35, envMapIntensity: 0.9 });
  const metalBright = std(0xe8d9c0, { metalness: 0.85, roughness: 0.22, envMapIntensity: 1.35 });

  const station = new THREE.Group();
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.12, 24), metalDark);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.55, 10), metalBright);
  mast.position.y = 0.32;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), emissive(accent, 0.7, { metalness: 0.5, roughness: 0.3 }));
  head.position.y = 0.62;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 14, 0, TAU, 0, Math.PI / 2), glass());
  dome.position.y = 0.06;
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 6), metalBright);
  ant.position.set(0.16, 0.45, 0.1);
  ant.rotation.z = -0.25;

  // Panel surya kecil: rangka + sel, miring menghadap matahari
  const panelFrame = new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.02, 0.2, 1, 0.008), metalBright);
  panelFrame.position.set(-0.24, 0.34, 0.05);
  panelFrame.rotation.z = 0.42;
  const panelCells = new THREE.Mesh(
    new THREE.PlaneGeometry(0.27, 0.17),
    new THREE.MeshStandardMaterial({ map: makeSolarTexture(), roughness: 0.25, metalness: 0.4, envMapIntensity: 1.1 })
  );
  panelCells.rotation.x = -Math.PI / 2;
  panelCells.position.y = 0.011;
  panelFrame.add(panelCells);
  const panelArm = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.16, 6), metalDark);
  panelArm.position.set(-0.24, 0.24, 0.05);
  station.add(foot, mast, head, dome, ant, panelArm, panelFrame);

  // Kabel sensor ke ground: kurva CatmullRom statis → Tube
  const cableCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.05, 0.18, 0.12),
    new THREE.Vector3(0.34, 0.06, 0.3),
    new THREE.Vector3(0.58, 0.02, 0.52),
    new THREE.Vector3(0.78, 0.0, 0.66),
  ]);
  const cable = new THREE.Mesh(
    new THREE.TubeGeometry(cableCurve, 20, 0.011, 6, false),
    std(0x1a1512, { roughness: 0.7 })
  );
  station.add(cable);
  station.position.set(1.6, -0.16, 0.4);
  group.add(station);

  /* ── Seismograf v2: rol kertas realistis + pena ganda + pelat dasar ────── */
  const drum = new THREE.Group();
  const drumBase = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.05, 0.3, 1, 0.015), std(0x241b13, { roughness: 0.85 }));
  drumBase.position.y = -0.31;
  const drumBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, 0.34, 32, 1, true),
    new THREE.MeshStandardMaterial({ map: makeSeismoTraceTexture(), roughness: 0.88, side: THREE.DoubleSide })
  );
  drumBody.rotation.z = Math.PI / 2;
  // Rol kertas inti di dalam + flensa logam kedua ujung
  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.36, 12, 1, true),
    std(0xd8cbb2, { roughness: 0.9, side: THREE.DoubleSide })
  );
  core.rotation.z = Math.PI / 2;
  const flangeGeo = new THREE.CylinderGeometry(0.225, 0.225, 0.02, 28);
  const flangeMat = metalBright;
  const flangeA = new THREE.Mesh(flangeGeo, flangeMat);
  flangeA.rotation.z = Math.PI / 2;
  flangeA.position.x = -0.185;
  const flangeB = new THREE.Mesh(flangeGeo, flangeMat);
  flangeB.rotation.z = Math.PI / 2;
  flangeB.position.x = 0.185;
  const drumAxle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.46, 8), metalBright);
  drumAxle.rotation.z = Math.PI / 2;
  const standGeo = new RoundedBoxGeometry(0.05, 0.3, 0.05, 1, 0.012);
  const standMat = metalDark;
  const drumStandA = new THREE.Mesh(standGeo, standMat);
  drumStandA.position.set(-0.24, -0.2, 0);
  const drumStandB = new THREE.Mesh(standGeo, standMat);
  drumStandB.position.set(0.24, -0.2, 0);

  // Tiang pena + DUA lengan pena (offset fase, warna beda)
  const needlePost = new THREE.Mesh(new RoundedBoxGeometry(0.05, 0.34, 0.05, 1, 0.012), standMat);
  needlePost.position.set(0, -0.22, 0.34);
  const makeNeedle = (colorHex, zOff) => {
    const arm = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.014, 0.3), emissive(colorHex, 0.5, { metalness: 0.6, roughness: 0.3 }));
    shaft.position.z = -0.15;
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), emissive(colorHex, 1.1));
    tip.position.z = -0.3;
    arm.add(shaft, tip);
    arm.position.set(0, 0.02, zOff);
    return arm;
  };
  const needleMain = makeNeedle(accent, 0.32);
  const needleSecond = makeNeedle(0xe8d9c0, 0.37);
  needleSecond.scale.setScalar(0.92);

  drum.add(drumBase, drumBody, core, flangeA, flangeB, drumAxle, drumStandA, drumStandB, needlePost, needleMain, needleSecond);
  drum.position.set(0.6, 0.32, 1.15);
  group.add(drum);

  scene.add(group);

  /* ── Fungsi gelombang & update per-frame (tanpa alokasi) ───────────────── */
  const EPICENTER_X = epiPos.x;
  const WAVE_SPEED = 2.6; // satuan/detik — delay per jarak

  const waveFine = (x, z, t) =>
    Math.sin(x * 1.7 - t * 3.1) * 0.1 * (0.55 + 0.45 * Math.sin(t * 0.7)) +
    Math.cos(z * 2.2 + t * 1.6) * 0.045;

  const waveCoarse = (x, z, t) =>
    Math.sin(x * 0.9 - t * 2.2 + 1.3) * 0.13 * (0.5 + 0.5 * Math.sin(t * 0.5 + 2)) +
    Math.cos(z * 1.4 - t * 1.1) * 0.06;

  const tmp = new THREE.Vector3();

  return (t) => {
    // Lapisan gelombang halus & kasar, fase berbeda
    const fp = fineGeo.attributes.position;
    for (let i = 0; i < fp.count; i += 1) fp.setY(i, waveFine(fp.getX(i), fp.getZ(i), t));
    fp.needsUpdate = true;
    const cp = coarseGeo.attributes.position;
    for (let i = 0; i < cp.count; i += 1) cp.setY(i, waveCoarse(cp.getX(i), cp.getZ(i), t));
    cp.needsUpdate = true;

    // Cincin memancar + pulsa episenter + debu
    rings.forEach((r) => {
      const k = (t * 0.4 + r.userData.phase) % 1;
      r.scale.setScalar(0.3 + k * 2.6);
      r.material.opacity = 0.5 * (1 - k) * (1 - k);
    });
    epi.material.emissiveIntensity = 1.2 + Math.sin(t * 3.1) * 0.7;
    dust.material.opacity = 0.32 + 0.22 * Math.abs(Math.sin(t * 3.1));
    dust.scale.setScalar(0.8 + 0.15 * Math.sin(t * 1.3));

    // Gedung goyang: sampel gelombang dengan delay jarak dari episenter
    buildings.forEach((b) => {
      const delay = b.userData.dist / WAVE_SPEED;
      const w = waveFine(b.userData.spec.x, b.userData.spec.z, t - delay);
      const tilt = w * (1.4 / b.userData.spec.h); // gedung pendek lebih kaku
      b.rotation.z = tilt * 0.55;
      b.rotation.x = tilt * 0.3;
      b.position.y = 0.16 + w * 0.5;
      if (b.userData.blink) b.userData.blink.material.emissiveIntensity = 0.6 + 0.9 * (Math.sin(t * 4.2) > 0.6 ? 1 : 0.15);
    });

    // Mobil: geser bolak-balik + goyang mengikuti lerap gelombang
    const cw = waveFine(car.position.x, 1.05, t - carDist / WAVE_SPEED);
    car.position.x = -0.35 + Math.sin(t * 0.5) * 0.22 + cw * 0.6;
    car.position.y = 0.17 + cw * 0.5;
    car.rotation.z = cw * 1.6;
    car.rotation.x = waveFine(car.position.x, 1.05, t - carDist / WAVE_SPEED - 0.08) * 0.9;

    // Stasiun: kepala sensor naik-turun ikut gelombang lokal
    tmp.copy(station.position);
    head.position.y = 0.62 + waveFine(tmp.x, tmp.z, t) * 0.8;
    head.scale.setScalar(1 + 0.2 * Math.abs(Math.sin(t * 3.1)));

    // Drum berputar, pena ganda menari dengan fase beda
    drumBody.rotation.x = t * 0.8;
    core.rotation.x = drumBody.rotation.x;
    flangeA.rotation.x = drumBody.rotation.x;
    flangeB.rotation.x = drumBody.rotation.x;
    needleMain.rotation.x = waveFine(drum.position.x, drum.position.z, t) * 2.4;
    needleSecond.rotation.x = waveFine(drum.position.x, drum.position.z, t - 0.12) * 2.0;

    group.rotation.y = Math.sin(t * 0.28) * 0.05;
  };
}
