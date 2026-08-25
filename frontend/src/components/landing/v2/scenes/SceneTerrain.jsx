import * as THREE from 'three';

/**
 * Scene 3D "Terrain" — builder mandiri untuk RailScene3D.
 * Kontrak: export default build(scene, { accent }) → update(t detik).
 * Pola helper disalin dari RailScene3D.jsx (std/emissive/shade/canvasTexture/
 * makeSoftSprite/makeContourTexture/makeTree). Tanpa listener, tanpa alokasi
 * per-frame; dispose ditangani parent lewat scene.traverse.
 *
 * Pesan utama: pemindaian LiDAR — cincin scan menyusuri elevasi + sweep wedge
 * (sektor tipis accent) berputar di ketinggian yang sama. Pendukung: point
 * cloud survey berkedip, sungai kecil mengalir menuruni lereng (UV scroll),
 * terasering sawah sage di 2 teras atas, rumah kampung + halaman di teras
 * bawah, tripod + laptop lapangan, jalur pendakian, benchmark, pin puncak.
 */

const TAU = Math.PI * 2;

/* ── Util material & tekstur (pola RailScene3D) ─────────────────────────── */

const std = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.04, envMapIntensity: 0.55, ...opts });

const emissive = (color, intensity = 1, opts = {}) =>
  new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: 0.5, ...opts });

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

/* Kontur topografi organik (piringan terrain) */
function makeContourTexture(base) {
  return canvasTexture(512, 512, (ctx, S) => {
    ctx.fillStyle = shade(base, 0.1);
    ctx.fillRect(0, 0, S, S);
    const c = S / 2;
    for (let i = 0; i < 16; i += 1) {
      ctx.strokeStyle = `rgba(240,228,204,${0.1 + (i % 3) * 0.05})`;
      ctx.lineWidth = i % 4 === 0 ? 2.2 : 1;
      ctx.beginPath();
      const r = 24 + i * 14;
      for (let a = 0; a <= TAU + 0.01; a += TAU / 90) {
        const wob = 1 + Math.sin(a * 3 + i) * 0.05 + Math.sin(a * 7 + i * 2) * 0.03;
        const x = c + Math.cos(a) * r * wob;
        const y = c + Math.sin(a) * r * wob;
        if (a === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  });
}

/* Sprite radial lembut (point cloud survey) */
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

/* Aliran air: arus biru-krem dengan urat krim searah V (scroll UV pelan) */
function makeRiverTexture() {
  return canvasTexture(64, 256, (ctx, W, H) => {
    ctx.fillStyle = '#87a6b3';
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 9; i += 1) {
      const x = ((i + 0.5) / 9) * W + (Math.random() - 0.5) * 5;
      ctx.strokeStyle = `rgba(232,220,196,${0.25 + Math.random() * 0.4})`;
      ctx.lineWidth = 1 + Math.random() * 2.5;
      ctx.beginPath();
      ctx.moveTo(x, -6);
      ctx.bezierCurveTo(
        x + (Math.random() - 0.5) * 8, H * 0.33,
        x + (Math.random() - 0.5) * 8, H * 0.66,
        x + (Math.random() - 0.5) * 6, H + 6,
      );
      ctx.stroke();
    }
    for (let i = 0; i < 60; i += 1) {
      ctx.fillStyle = `rgba(255,244,224,${Math.random() * 0.18})`;
      ctx.fillRect(Math.random() * W, Math.random() * H, 1.5, 2 + Math.random() * 4);
    }
  });
}

/* Pohon low-poly: batang + kanopi kerucut bertumpuk */
function makeTree(trunkMat, leafMat, scale = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.045, 0.22, 6), trunkMat);
  trunk.position.y = 0.11;
  g.add(trunk);
  const c1 = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.22, 7), leafMat);
  c1.position.y = 0.3;
  const c2 = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.18, 7), leafMat);
  c2.position.y = 0.45;
  g.add(c1, c2);
  g.scale.setScalar(scale);
  return g;
}

/* ── Builder ─────────────────────────────────────────────────────────────── */

export default function build(scene, { accent }) {
  const group = new THREE.Group();
  const H = 0.22;
  const BASE_Y = -0.62;
  const steps = [1.55, 1.3, 1.05, 0.8, 0.55, 0.3]; // radius teras bawah → puncak
  const tones = [0x3a2d22, 0x4a3828, 0x5c4632, 0x4a3828, 0x5c4632, 0x6b5138];
  const plateTop = (lvl) => BASE_Y + (lvl + 1) * H; // permukaan atas teras lvl

  /* Piringan teras kontur */
  const plates = steps.map((r, i) => {
    const p = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r + 0.06, H, 28),
      new THREE.MeshStandardMaterial({ map: makeContourTexture(tones[i]), roughness: 0.9, envMapIntensity: 0.4 })
    );
    p.position.y = BASE_Y + i * H;
    group.add(p);
    return p;
  });

  /* Pohon */
  const trunkMat = std(0x5c4632, { roughness: 0.9 });
  const leafMat = std(0x5c6b46, { roughness: 0.9 });
  [
    [1.15, 2, 0.9, 1.0],
    [-1.05, 3, 0.75, 0.8],
    [0.5, 4, 0.42, 0.65],
    [-0.45, 5, 0.2, 0.55],
  ].forEach(([r, lvl, a, s]) => {
    const tree = makeTree(trunkMat, leafMat, s);
    tree.position.set(Math.cos(a) * r, plateTop(lvl), Math.sin(a) * r);
    group.add(tree);
  });

  /* Jalur pendakian (pijakan batu) — sisi angle ~2.2..4.4 rad */
  const stepMat = std(0x8d7a64, { roughness: 0.9 });
  for (let i = 0; i < 8; i += 1) {
    const a = 2.2 + i * 0.28;
    const lvl = Math.min(5, Math.floor(i / 1.6));
    const r = steps[5 - lvl] - 0.12;
    const slab = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.08), stepMat);
    slab.position.set(Math.cos(a) * r, plateTop(lvl) + 0.02, Math.sin(a) * r);
    slab.rotation.y = -a;
    group.add(slab);
  }

  /* ── LiDAR: cincin scan menyusuri elevasi ── */
  const scan = new THREE.Mesh(
    new THREE.TorusGeometry(1, 0.016, 8, 56),
    new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.85 })
  );
  scan.rotation.x = -Math.PI / 2;
  group.add(scan);

  /* Sweep wedge: sektor tipis accent berputar di ketinggian cincin */
  const wedgeGroup = new THREE.Group();
  const wedge = new THREE.Mesh(
    new THREE.RingGeometry(0.93, 1, 32, 1, 0, 0.6),
    new THREE.MeshBasicMaterial({
      color: accent,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  wedge.rotation.x = -Math.PI / 2;
  wedgeGroup.add(wedge);
  // titik ledger di ujung depan sweep (membaca arah pemindaian)
  const sweepTip = new THREE.Mesh(
    new THREE.SphereGeometry(0.03, 10, 8),
    emissive(accent, 1.6, { roughness: 0.4 })
  );
  sweepTip.position.y = 0.012;
  wedge.add(sweepTip); // ikut rotasi mesh: sudut 0 = arah sweep
  group.add(wedgeGroup);

  /* ── Point cloud survey: titik berkedip di permukaan teras ── */
  const PCOUNT = 72;
  const pcPos = new Float32Array(PCOUNT * 3);
  const pcPhase = new Float32Array(PCOUNT);
  for (let i = 0; i < PCOUNT; i += 1) {
    const lvl = Math.floor(Math.random() * 6);
    const rMax = steps[lvl] - 0.1;
    const r = rMax * (0.35 + Math.random() * 0.6);
    const a = Math.random() * TAU;
    pcPos[i * 3] = Math.cos(a) * r;
    pcPos[i * 3 + 1] = plateTop(lvl) + 0.02;
    pcPos[i * 3 + 2] = Math.sin(a) * r;
    pcPhase[i] = Math.random() * TAU;
  }
  const pcGeo = new THREE.BufferGeometry();
  pcGeo.setAttribute('position', new THREE.BufferAttribute(pcPos, 3));
  pcGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(PCOUNT * 3), 3));
  const acR = ((accent >> 16) & 255) / 255;
  const acG = ((accent >> 8) & 255) / 255;
  const acB = (accent & 255) / 255;
  const pointCloud = new THREE.Points(
    pcGeo,
    new THREE.PointsMaterial({
      size: 0.05,
      map: makeSoftSprite(`${(accent >> 16) & 255},${(accent >> 8) & 255},${accent & 255}`),
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  group.add(pointCloud);

  /* ── Sungai kecil menuruni lereng (berlawanan jalur pendakian) ── */
  const riverTex = makeRiverTexture();
  riverTex.wrapS = THREE.RepeatWrapping;
  riverTex.wrapT = THREE.RepeatWrapping;
  const riverCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.16, plateTop(5) + 0.01, -0.1),
    new THREE.Vector3(0.38, plateTop(4) + 0.01, -0.3),
    new THREE.Vector3(0.63, plateTop(2) + 0.01, -0.47),
    new THREE.Vector3(0.95, plateTop(1) + 0.01, -0.62),
    new THREE.Vector3(1.26, BASE_Y - 0.1, -0.72),
    new THREE.Vector3(1.52, BASE_Y - 0.34, -0.78),
  ]);
  const river = new THREE.Mesh(
    new THREE.TubeGeometry(riverCurve, 28, 0.036, 8),
    new THREE.MeshStandardMaterial({
      map: riverTex,
      color: 0xcfe0e6,
      roughness: 0.22,
      metalness: 0.05,
      envMapIntensity: 1.1,
    })
  );
  group.add(river);

  /* ── Terasering sawah sage di 2 teras atas (lvl 3 & 4) ── */
  const paddyMat = new THREE.MeshStandardMaterial({
    color: 0x9db48a,
    transparent: true,
    opacity: 0.55,
    roughness: 0.3,
    metalness: 0.02,
    envMapIntensity: 1.2,
  });
  const bundMat = std(0x8aa377, { roughness: 0.85 });
  [[3, 0.8], [4, 0.55]].forEach(([lvl, r]) => {
    const pad = new THREE.Mesh(new THREE.RingGeometry(r - 0.09, r - 0.015, 36), paddyMat);
    pad.rotation.x = -Math.PI / 2;
    pad.position.y = plateTop(lvl) + 0.004;
    group.add(pad);
    // galengan (bunds) radial pembagi petak
    for (let b = 0; b < 3; b += 1) {
      const a = (b / 3) * TAU + lvl;
      const bund = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.008, 0.016), bundMat);
      const rm = r - 0.052;
      bund.position.set(Math.cos(a) * rm, plateTop(lvl) + 0.007, Math.sin(a) * rm);
      bund.rotation.y = -a;
      group.add(bund);
    }
  });

  /* ── Rumah kampung + halaman di teras bawah (lvl 0) ── */
  const yardMat = std(0x6b5138, { roughness: 0.95 });
  const wallMat = std(0xe8d9c0, { roughness: 0.7 });
  const roofMat = std(0x6b4a2e, { roughness: 0.75 });
  const doorMat = std(0x4a3320, { roughness: 0.85 });
  const y0 = plateTop(0);
  const makeHouse = (x, z, rot) => {
    const house = new THREE.Group();
    const yard = new THREE.Mesh(new THREE.CircleGeometry(0.19, 20), yardMat);
    yard.rotation.x = -Math.PI / 2;
    yard.position.y = 0.003;
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 0.12), wallMat);
    body.position.y = 0.05;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.115, 0.09, 4), roofMat);
    roof.position.y = 0.145;
    roof.rotation.y = Math.PI / 4;
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.06, 0.008), doorMat);
    door.position.set(0.02, 0.03, 0.062);
    house.add(yard, body, roof, door);
    house.position.set(x, y0, z);
    house.rotation.y = rot;
    group.add(house);
  };
  makeHouse(-1.02, 0.52, 0.7);
  makeHouse(-1.28, 0.1, -0.4);

  /* ── Benchmark monument di teras 2 ── */
  const bench = new THREE.Group();
  const bPost = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.12, 10), std(0xe8d9c0, { roughness: 0.5 }));
  bPost.position.y = 0.06;
  const bTop = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.02, 10),
    emissive(accent, 0.8, { metalness: 0.5, roughness: 0.3 })
  );
  bTop.position.y = 0.13;
  bench.add(bPost, bTop);
  bench.position.set(-0.85, BASE_Y + 2 * H + H / 2, -0.5);
  group.add(bench);

  /* ── Tripod survei + instrumen kaca + sinar ── */
  const tripod = new THREE.Group();
  for (let i = 0; i < 3; i += 1) {
    const a = (i / 3) * TAU;
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.024, 0.72, 6),
      std(0xe8d9c0, { metalness: 0.85, roughness: 0.3, envMapIntensity: 1.2 })
    );
    leg.position.set(Math.cos(a) * 0.16, 0.3, Math.sin(a) * 0.16);
    leg.rotation.z = Math.cos(a) * 0.38;
    leg.rotation.x = -Math.sin(a) * 0.38;
    tripod.add(leg);
  }
  const deck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.14, 0.07, 16),
    std(0x8d7a64, { metalness: 0.7, roughness: 0.35 })
  );
  deck.position.y = 0.68;
  const lens = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 12), glass({ opacity: 0.3 }));
  lens.position.y = 0.76;
  const beam = new THREE.Mesh(
    new THREE.ConeGeometry(0.05, 0.3, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false })
  );
  beam.position.y = 0.62;
  beam.rotation.x = Math.PI;
  tripod.add(deck, lens, beam);

  /* Laptop lapangan mini terbuka di sebelah tripod */
  const laptop = new THREE.Group();
  const lidBase = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.012, 0.12), std(0x3d3630, { metalness: 0.5, roughness: 0.5 }));
  const keys = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.004, 0.09), std(0x241f1a, { roughness: 0.9 }));
  keys.position.y = 0.008;
  const screenPivot = new THREE.Group();
  const screenBack = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.11, 0.008), std(0x3d3630, { metalness: 0.5, roughness: 0.5 }));
  screenBack.position.set(0, 0.055, -0.004);
  const screenFace = new THREE.Mesh(
    new THREE.PlaneGeometry(0.155, 0.098),
    emissive(accent, 0.55, { roughness: 0.4, side: THREE.DoubleSide })
  );
  screenFace.position.set(0, 0.055, 0.001);
  screenPivot.add(screenBack, screenFace);
  screenPivot.position.set(0, 0.008, -0.058);
  screenPivot.rotation.x = -1.15; // terbuka ±110°
  laptop.add(lidBase, keys, screenPivot);

  const topPlateY = plateTop(5);
  tripod.position.set(0.32, topPlateY, 0.28);
  laptop.position.set(0.62, topPlateY, 0.44);
  laptop.rotation.y = -0.6;
  group.add(tripod, laptop);

  /* Pin puncak */
  const pin = new THREE.Group();
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6), std(0xe8d9c0, { metalness: 0.85, roughness: 0.3 }));
  rod.position.y = 0.25;
  const tip = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 12, 10),
    emissive(accent, 0.8, { metalness: 0.5, roughness: 0.3 })
  );
  tip.position.y = 0.53;
  pin.add(rod, tip);
  pin.position.y = BASE_Y + steps.length * H;
  group.add(pin);

  scene.add(group);

  /* Rentang elevasi scan */
  const top = plates[plates.length - 1].position.y + H / 2;
  const bottom = plates[0].position.y - H / 2;
  const span = top - bottom;

  /* Buffer warna point cloud (ditulis ulang tiap frame, tanpa alokasi) */
  const pcColAttr = pcGeo.attributes.color;

  return (t) => {
    /* Cincin scan + wedge: satu ketinggian, radius mengikuti teras */
    const k = Math.sin(t * 0.55) * 0.5 + 0.5;
    const y = bottom + k * span;
    scan.position.y = y;
    const idx = Math.min(steps.length - 1, Math.floor(((y - bottom) / span) * steps.length));
    const r = steps[steps.length - 1 - idx] + 0.12;
    scan.scale.set(r, r, 1);
    const pulse = 0.45 + 0.4 * Math.sin(t * 2);
    scan.material.opacity = pulse;

    wedgeGroup.position.y = y + 0.006;
    wedgeGroup.scale.set(r, 1, r);
    wedgeGroup.rotation.y = t * 1.5;
    wedge.material.opacity = 0.22 + 0.2 * Math.max(0, Math.sin(t * 2));

    /* Point cloud: kedip pelan per titik via vertex color */
    const col = pcColAttr.array;
    for (let i = 0; i < PCOUNT; i += 1) {
      const f = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * 1.1 + pcPhase[i]));
      col[i * 3] = acR * f;
      col[i * 3 + 1] = acG * f;
      col[i * 3 + 2] = acB * f;
    }
    pcColAttr.needsUpdate = true;

    /* Sungai: scroll UV pelan + kilau */
    riverTex.offset.y = -(t * 0.045) % 1;
    river.material.roughness = 0.2 + 0.06 * Math.sin(t * 1.3);

    /* Sinar tripod + layar laptop bernapas halus */
    beam.material.opacity = 0.2 + 0.15 * Math.sin(t * 3.2);
    screenFace.material.emissiveIntensity = 0.45 + 0.15 * Math.sin(t * 1.7);

    /* Drift yaw sangat pelan (konsisten scene lain) */
    group.rotation.y = Math.sin(t * 0.24) * 0.06;
  };
}
