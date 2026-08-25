import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/**
 * Scene 3D kartu BANJIR — varian detail tinggi (rumah panggung Indonesia).
 * Kontrak builder: export default build(scene, { accent }) => update(t).
 * Pola helper disalin dari RailScene3D.jsx (IBL + ACES diset oleh induk;
 * dispose ditangani induk). Tanpa listener, tanpa alokasi objek per-frame.
 */

const TAU = Math.PI * 2;

/* ── Util material & tekstur (disalin dari RailScene3D.jsx) ─────────────── */

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

/* Sprite radial lembut (hujan) */
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

/* ── Builder banjir ──────────────────────────────────────────────────────── */

export default function build(scene, { accent }) {
  const group = new THREE.Group();

  /* Tanah */
  const ground = new THREE.Mesh(new RoundedBoxGeometry(4.8, 0.5, 3.2, 2, 0.16), std(0x3a2d22, { roughness: 0.95 }));
  ground.position.y = -0.35;
  group.add(ground);

  /* ── Rumah panggung: ditinggikan pada 4 tiang kayu (khas banjir ID) ── */
  const house = new THREE.Group();
  const stiltMat = std(0x5c4632, { roughness: 0.88 });
  [[-0.42, -0.32], [0.42, -0.32], [-0.42, 0.32], [0.42, 0.32]].forEach(([sx, sz]) => {
    const stilt = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.04, 0.62, 8), stiltMat);
    stilt.position.set(sx, 0.13, sz);
    stilt.rotation.z = sx > 0 ? -0.02 : 0.02;
    house.add(stilt);
  });
  // Lantai panggung
  const floorSlab = new THREE.Mesh(new RoundedBoxGeometry(1.18, 0.07, 1.0, 1, 0.02), std(0x6b4a2e, { roughness: 0.85 }));
  floorSlab.position.y = 0.47;
  house.add(floorSlab);

  const body = new THREE.Mesh(new RoundedBoxGeometry(1.05, 0.68, 0.9, 2, 0.05), std(0xe8d9c0, { roughness: 0.7 }));
  body.position.y = 0.85;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.82, 0.5, 4), std(0xb45309, { roughness: 0.65 }));
  roof.position.y = 1.44;
  roof.rotation.y = Math.PI / 4;
  const door = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.34, 0.03, 1, 0.015), std(0x6b4a2e, { roughness: 0.8 }));
  door.position.set(0.18, 0.68, 0.46);
  // Kaca jendela menyala hangat (emissive lembut) — rumah tetap berpenghuni
  const winMat = glass({ opacity: 0.5, color: 0xbfd4e8, emissive: 0xffa04a, emissiveIntensity: 0.55 });
  const winA = new THREE.Mesh(new RoundedBoxGeometry(0.24, 0.2, 0.03, 1, 0.015), winMat);
  winA.position.set(-0.2, 0.94, 0.46);
  const winB = new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.18, 0.2, 1, 0.012), winMat);
  winB.position.set(0.54, 0.94, -0.05);
  // Pipa air vertikal
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.68, 8), std(0x8d7a64, { metalness: 0.6, roughness: 0.4 }));
  pipe.position.set(-0.44, 0.85, 0.42);

  // Tangga panggung: 2 rel + 3 anak tangga
  const railGeo = new THREE.BoxGeometry(0.03, 0.5, 0.03);
  [-0.08, 0.08].forEach((dx) => {
    const rail = new THREE.Mesh(railGeo, stiltMat);
    rail.position.set(0.34 + dx, 0.24, 0.56);
    rail.rotation.x = -0.28;
    house.add(rail);
  });
  [0.14, 0.28, 0.42].forEach((y) => {
    const step = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.022, 0.035), stiltMat);
    step.position.set(0.34, y, 0.56 + (0.47 - y) * 0.29);
    house.add(step);
  });
  house.add(body, roof, door, winA, winB, pipe);
  house.position.set(-0.7, 0, -0.1);
  group.add(house);

  /* ── Perahu kecil: hull rounded + 2 bangku, mengapung & bergoyang ── */
  const boat = new THREE.Group();
  const hull = new THREE.Mesh(
    new RoundedBoxGeometry(0.52, 0.11, 0.22, 2, 0.05),
    std(0xb45309, { roughness: 0.55 })
  );
  hull.scale.set(1, 1, 1);
  // Moncong meruncing: pinch ujung hull lewat skala vertex sederhana via dua "prow"
  const bow = new THREE.Mesh(new THREE.ConeGeometry(0.105, 0.16, 4), std(0xb45309, { roughness: 0.55 }));
  bow.rotation.z = -Math.PI / 2;
  bow.rotation.y = Math.PI / 4;
  bow.position.x = 0.31;
  const seatGeo = new THREE.BoxGeometry(0.07, 0.02, 0.18);
  const seatMat = std(0x6b4a2e, { roughness: 0.8 });
  const seatA = new THREE.Mesh(seatGeo, seatMat);
  seatA.position.set(-0.1, 0.065, 0);
  const seatB = new THREE.Mesh(seatGeo, seatMat);
  seatB.position.set(0.1, 0.065, 0);
  boat.add(hull, bow, seatA, seatB);
  boat.position.set(0.95, 0.1, 0.62);
  boat.rotation.y = -0.5;
  group.add(boat);

  /* ── Tiang listrik + kabel melengkung + lampu jalan mati ── */
  const pole = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.034, 1.5, 8), std(0x6b5138, { roughness: 0.85 }));
  shaft.position.y = 0.65;
  const crossarm = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.03, 0.03), std(0x6b5138, { roughness: 0.85 }));
  crossarm.position.y = 1.28;
  const insGeo = new THREE.CylinderGeometry(0.016, 0.02, 0.045, 6);
  const insMat = std(0xd8d2c4, { roughness: 0.4, metalness: 0.1 });
  [-0.18, 0.18].forEach((dx) => {
    const ins = new THREE.Mesh(insGeo, insMat);
    ins.position.set(dx, 1.315, 0);
    pole.add(ins);
  });
  // Lengan lampu jalan + kepala lampu MATI (gelap, tanpa emissive)
  const lampArm = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.3), std(0x4a4038, { roughness: 0.6, metalness: 0.5 }));
  lampArm.position.set(0, 1.42, 0.14);
  const lampHead = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.05, 0.14), std(0x2e2a26, { roughness: 0.5, metalness: 0.4 }));
  lampHead.position.set(0, 1.39, 0.27);
  pole.add(shaft, crossarm, lampArm, lampHead);
  pole.position.set(1.9, -0.1, -0.78);
  group.add(pole);

  // Kabel melengkung: tiang → dinding rumah (QuadraticBezierCurve3 + Tube tipis)
  const wireMat = std(0x1e1a16, { roughness: 0.6 });
  const curveHouse = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(1.72, 1.2, -0.78),
    new THREE.Vector3(0.7, 0.82, -0.55),
    new THREE.Vector3(-0.16, 1.12, -0.38)
  );
  const wireHouse = new THREE.Mesh(new THREE.TubeGeometry(curveHouse, 20, 0.008, 5), wireMat);
  const curveSpan = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(2.08, 1.2, -0.78),
    new THREE.Vector3(2.5, 0.86, -1.05),
    new THREE.Vector3(2.85, 0.95, -1.3)
  );
  const wireSpan = new THREE.Mesh(new THREE.TubeGeometry(curveSpan, 16, 0.008, 5), wireMat);
  group.add(wireHouse, wireSpan);

  /* ── Pohon: satu utuh di daratan kering, satu setengah terendam ── */
  const trunkMat = std(0x5c4632, { roughness: 0.9 });
  const leafMat = std(0x5c6b46, { roughness: 0.9 });
  const treeDry = new THREE.Group();
  const trunkDry = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.045, 0.24, 6), trunkMat);
  trunkDry.position.y = 0.12;
  const coneDryA = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.24, 7), leafMat);
  coneDryA.position.y = 0.32;
  const coneDryB = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.18, 7), leafMat);
  coneDryB.position.y = 0.48;
  treeDry.add(trunkDry, coneDryA, coneDryB);
  treeDry.position.set(2.05, -0.1, 0.2);
  group.add(treeDry);

  // Setengah terendam: kanopi bawah hilang, kanopi atas "terlipat" miring
  const treeWet = new THREE.Group();
  const trunkWet = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.55, 6), trunkMat);
  trunkWet.position.y = 0.27;
  const coneWet = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.2, 7), leafMat);
  coneWet.position.y = 0.6;
  coneWet.rotation.z = 0.35;
  treeWet.add(trunkWet, coneWet);
  treeWet.position.set(-1.75, -0.1, 0.78);
  treeWet.rotation.y = 0.6;
  group.add(treeWet);

  /* ── Patok elevasi + pita ── */
  const stake = new THREE.Mesh(new RoundedBoxGeometry(0.06, 1.5, 0.06, 1, 0.02), std(0xe8d9c0, { roughness: 0.6 }));
  stake.position.set(2.15, -0.05, 0.95);
  const tape = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.7, 0.02), emissive(accent, 0.25));
  tape.position.set(2.15, 0.25, 0.97);
  group.add(stake, tape);

  /* ── Air physical clearcoat (accent) ── */
  const waterGeo = new THREE.PlaneGeometry(7.2, 4.2, 48, 28);
  waterGeo.rotateX(-Math.PI / 2);
  const water = new THREE.Mesh(
    waterGeo,
    new THREE.MeshPhysicalMaterial({
      color: accent,
      transparent: true,
      opacity: 0.42,
      roughness: 0.12,
      metalness: 0.05,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      envMapIntensity: 1.4,
    })
  );
  group.add(water);

  /* ── Tepian busa garis pantai: 2 ring putih semi transparan ── */
  const foamMats = [0, 1].map(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0xeaf2f8,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
  );
  const foams = foamMats.map((mat, i) => {
    const f = new THREE.Mesh(new THREE.TorusGeometry(1, i === 0 ? 0.018 : 0.01, 6, 72), mat);
    f.rotation.x = -Math.PI / 2;
    f.scale.set(3.58 + i * 0.05, 2.08 + i * 0.04, 1);
    f.userData.phase = i * 1.7;
    group.add(f);
    return f;
  });

  /* ── Pelampung ── */
  const buoy = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.03, 8, 20), std(0xb45309, { roughness: 0.6 }));
  buoy.rotation.x = -Math.PI / 2;
  group.add(buoy);

  /* ── Riak titik hujan di muka air: 3 cincin membesar-memudar ── */
  const splashes = [0, 1, 2].map((i) => {
    const r = new THREE.Mesh(
      new THREE.RingGeometry(0.9, 1, 24),
      new THREE.MeshBasicMaterial({ color: 0xd8e6f4, transparent: true, opacity: 0.4, side: THREE.DoubleSide })
    );
    r.rotation.x = -Math.PI / 2;
    r.userData.phase = i / 3;
    r.userData.px = [-1.5, 0.6, 1.9][i];
    r.userData.pz = [0.35, -0.55, 0.15][i];
    group.add(r);
    return r;
  });

  /* ── Hujan: Points sprite lembut ── */
  const RAIN = 130;
  const rainPos = new Float32Array(RAIN * 3);
  for (let i = 0; i < RAIN; i += 1) {
    rainPos[i * 3] = (Math.random() - 0.5) * 7;
    rainPos[i * 3 + 1] = Math.random() * 3;
    rainPos[i * 3 + 2] = (Math.random() - 0.5) * 4;
  }
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
  const rain = new THREE.Points(
    rainGeo,
    new THREE.PointsMaterial({ size: 0.09, map: makeSoftSprite('200,220,240'), transparent: true, opacity: 0.55, depthWrite: false })
  );
  group.add(rain);
  scene.add(group);

  group.scale.setScalar(0.95);

  /* Muka air naik-turun pelan (siklus pasang) */
  const waterY = (t) => 0.02 + Math.sin(t * 0.65) * 0.2;

  /* Gelombang 2 oktaf dengan arah flow ke +x:
     oktaf 1 gelombang primer searah aliran, oktaf 2 cross-swell lebih halus */
  const wave = (x, z, t) =>
    Math.sin(x * 1.9 - t * 2.4) * 0.032 +
    Math.cos(x * 1.1 + z * 2.4 + t * 1.5) * 0.022;

  return (t) => {
    const wy = waterY(t);
    water.position.y = wy;

    // Permukaan air: deformasi vertex 2 oktaf (tanpa alokasi baru)
    const pos = waterGeo.attributes.position;
    for (let i = 0; i < pos.count; i += 1) {
      pos.setY(i, wave(pos.getX(i), pos.getZ(i), t));
    }
    pos.needsUpdate = true;

    // Tepian busa mengikuti muka air + denyut lembut
    foams.forEach((f, i) => {
      f.position.y = wy + 0.012 + i * 0.006;
      const pulse = 1 + Math.sin(t * 1.1 + f.userData.phase) * 0.004;
      f.scale.set((i === 0 ? 3.58 : 3.63) * pulse, (i === 0 ? 2.08 : 2.12) * pulse, 1);
      foamMats[i].opacity = (i === 0 ? 0.34 : 0.2) * (0.75 + 0.25 * Math.sin(t * 0.9 + f.userData.phase));
    });

    // Perahu: mengapung pada muka air + bergoyang ikut gelombang lokal
    const bw = wave(boat.position.x, boat.position.z, t);
    boat.position.y = wy + 0.045 + bw;
    boat.rotation.z = bw * 2.2;
    boat.rotation.x = Math.cos(boat.position.z * 2.4 + t * 1.5) * 0.06;
    boat.position.x = 0.95 + Math.sin(t * 0.4) * 0.06;

    // Pelampung ikut muka air
    buoy.position.set(-1.2, wy + 0.03 + Math.sin(t * 1.8) * 0.02, -0.3);

    // Riak hujan
    splashes.forEach((r) => {
      const k = (t * 0.7 + r.userData.phase) % 1;
      r.position.set(r.userData.px, wy + 0.015, r.userData.pz);
      r.scale.setScalar(0.06 + k * 0.22);
      r.material.opacity = 0.4 * (1 - k);
    });

    // Hujan turun, reset di atas muka air
    const rp = rainGeo.attributes.position;
    for (let i = 0; i < RAIN; i += 1) {
      let y = rp.getY(i) - 0.075;
      if (y < wy) y = 3;
      rp.setY(i, y);
    }
    rp.needsUpdate = true;

    // Cahaya jendela hangat berkedip sangat lembut
    winMat.emissiveIntensity = 0.5 + Math.sin(t * 1.3) * 0.07 + Math.sin(t * 3.7) * 0.03;

    group.rotation.y = Math.sin(t * 0.26) * 0.05;
  };
}
