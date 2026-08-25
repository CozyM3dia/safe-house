import * as THREE from 'three';

/**
 * Scene 3D "Vulkanik" — builder mandiri untuk RailScene3D.
 * Kontrak: export default build(scene, { accent }) → update(t detik).
 * Pola helper disalin dari RailScene3D.jsx (std/emissive/canvasTexture/
 * makeSoftSprite). Tanpa listener, tanpa alokasi per-frame; dispose
 * ditangani parent lewat scene.traverse.
 *
 * Elemen: kerucut lathe + kawah bercahaya + kilat kawah sesekali +
 * 2 cabang aliran lava bertekstur (UV scroll) + marking zona KRB
 * (cincin tetap + tiang bendera + rumah di dalam vs luar zona) +
 * abu berangin + asap + kabut dasar + vegetasi mati.
 */

const TAU = Math.PI * 2;

/* ── Util material & tekstur (pola RailScene3D) ─────────────────────────── */

const std = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.04, envMapIntensity: 0.55, ...opts });

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

/* Sprite radial lembut (asap, kabut, glow kawah) */
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

/* Tekstur aliran lava: urat emissive vertikal di batu gelap (scroll UV) */
function makeLavaFlowTexture(accent) {
  return canvasTexture(96, 256, (ctx, W, H) => {
    ctx.fillStyle = '#1c0e06';
    ctx.fillRect(0, 0, W, H);
    // urat lava terang memanjang searah aliran (V)
    for (let i = 0; i < 11; i += 1) {
      const x = ((i + 0.5) / 11) * W + (Math.random() - 0.5) * 6;
      ctx.strokeStyle = `rgba(${(accent >> 16) & 255},${(accent >> 8) & 255},${accent & 255},${0.35 + Math.random() * 0.5})`;
      ctx.lineWidth = 1.5 + Math.random() * 3.5;
      ctx.beginPath();
      ctx.moveTo(x, -8);
      ctx.bezierCurveTo(
        x + (Math.random() - 0.5) * 14, H * 0.33,
        x + (Math.random() - 0.5) * 14, H * 0.66,
        x + (Math.random() - 0.5) * 8, H + 8,
      );
      ctx.stroke();
    }
    // bercak kerak gelap
    for (let i = 0; i < 130; i += 1) {
      ctx.fillStyle = `rgba(0,0,0,${0.1 + Math.random() * 0.25})`;
      ctx.fillRect(Math.random() * W, Math.random() * H, 2 + Math.random() * 5, 1.5 + Math.random() * 3);
    }
  });
}

/* Rumah mini (kontras dalam vs luar KRB) */
function makeMiniHouse(wallMat, roofMat, markMat) {
  const h = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.14, 0.16), wallMat);
  body.position.y = 0.07;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.155, 0.1, 4), roofMat);
  roof.position.y = 0.19;
  roof.rotation.y = Math.PI / 4;
  h.add(body, roof);
  if (markMat) {
    // penanda atap accent (rumah di dalam zona)
    const mark = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.035, 0.035), markMat);
    mark.position.set(0.06, 0.235, 0);
    h.add(mark);
  }
  return h;
}

/* Pohon mati low-poli: batang + 2 cabang, tanpa daun */
function makeDeadTree(trunkMat) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.03, 0.3, 5), trunkMat);
  trunk.position.y = 0.15;
  g.add(trunk);
  const b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.012, 0.17, 4), trunkMat);
  b1.position.set(0.05, 0.27, 0);
  b1.rotation.z = -0.85;
  const b2 = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.01, 0.13, 4), trunkMat);
  b2.position.set(-0.04, 0.22, 0.02);
  b2.rotation.z = 0.95;
  b2.rotation.x = 0.3;
  g.add(b1, b2);
  return g;
}

/* ── Builder ─────────────────────────────────────────────────────────────── */

export default function build(scene, { accent }) {
  const group = new THREE.Group();

  /* Kerucut gunung (lathe) */
  const profile = [
    [0.0, -0.62], [0.9, -0.62], [1.25, -0.4], [1.42, -0.12], [1.48, 0.14],
    [1.32, 0.3], [1.05, 0.34], [0.42, 0.36], [0.0, 0.36],
  ].map((p) => new THREE.Vector2(p[0], p[1]));
  const cone = new THREE.Mesh(
    new THREE.LatheGeometry(profile, 40),
    std(0x4a3828, { roughness: 0.95, envMapIntensity: 0.4 })
  );
  group.add(cone);

  /* Dasar dataran */
  const floor = new THREE.Mesh(new THREE.CircleGeometry(2.4, 40), std(0x2b2118, { roughness: 0.95 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.615;
  group.add(floor);

  /* Kawah: danau lava + glow sprite besar + lampu lava */
  const lava = new THREE.Mesh(new THREE.CircleGeometry(0.36, 24), emissive(accent, 2, { roughness: 0.6 }));
  lava.rotation.x = -Math.PI / 2;
  lava.position.y = 0.345;
  group.add(lava);
  const lavaLight = new THREE.PointLight(accent, 2.2, 3.2, 2);
  lavaLight.position.set(0, 0.7, 0);
  group.add(lavaLight);

  const accRgb = `${(accent >> 16) & 255},${(accent >> 8) & 255},${accent & 255}`;
  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeSoftSprite(accRgb),
      color: accent,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  glow.scale.setScalar(1.25);
  glow.position.set(0, 0.42, 0);
  group.add(glow);

  /* Kilat kawah sesekali: PointLight flash singkat tiap ±4 detik */
  const flash = new THREE.PointLight(0xe9edff, 0, 3.4, 2);
  flash.position.set(0, 0.85, 0);
  group.add(flash);

  /* Aliran lava: 2 cabang tube bertekstur (UV scroll per-frame) */
  const flowTex = makeLavaFlowTexture(accent);
  flowTex.wrapS = THREE.RepeatWrapping;
  flowTex.wrapT = THREE.RepeatWrapping;
  const mkFlowMat = () =>
    new THREE.MeshStandardMaterial({
      color: 0x241206,
      map: flowTex,
      emissive: accent,
      emissiveMap: flowTex,
      emissiveIntensity: 1.4,
      roughness: 0.6,
    });
  const branchA = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.3, 0.33, 0.1),
    new THREE.Vector3(0.72, 0.12, 0.28),
    new THREE.Vector3(1.05, -0.22, 0.38),
    new THREE.Vector3(1.28, -0.56, 0.42),
  ]);
  const branchB = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.22, 0.33, -0.14),
    new THREE.Vector3(0.58, 0.1, -0.52),
    new THREE.Vector3(1.0, -0.26, -0.74),
    new THREE.Vector3(1.32, -0.56, -0.86),
  ]);
  const flowA = new THREE.Mesh(new THREE.TubeGeometry(branchA, 20, 0.045, 8), mkFlowMat());
  const flowB = new THREE.Mesh(new THREE.TubeGeometry(branchB, 20, 0.038, 8), mkFlowMat());
  group.add(flowA, flowB);
  const poolA = new THREE.Mesh(new THREE.CircleGeometry(0.16, 16), emissive(accent, 1.2, { roughness: 0.6 }));
  poolA.rotation.x = -Math.PI / 2;
  poolA.position.set(1.28, -0.585, 0.42);
  const poolB = new THREE.Mesh(new THREE.CircleGeometry(0.13, 16), emissive(accent, 1.2, { roughness: 0.6 }));
  poolB.rotation.x = -Math.PI / 2;
  poolB.position.set(1.32, -0.585, -0.86);
  group.add(poolA, poolB);

  /* Zona KRB: cincin radius tetap + denyut halus */
  const krRing = new THREE.Mesh(
    new THREE.RingGeometry(1.66, 1.72, 56),
    new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.4, side: THREE.DoubleSide })
  );
  krRing.rotation.x = -Math.PI / 2;
  krRing.position.y = -0.6;
  group.add(krRing);
  const krPulse = new THREE.Mesh(
    new THREE.RingGeometry(1.66, 1.71, 56),
    new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.3, side: THREE.DoubleSide })
  );
  krPulse.rotation.x = -Math.PI / 2;
  krPulse.position.y = -0.605;
  group.add(krPulse);

  /* Tiang penanda KRB + bendera accent di keliling cincin */
  const postMat = std(0xe8d9c0, { metalness: 0.6, roughness: 0.4 });
  const flagMat = emissive(accent, 0.35);
  const flags = [0.5, 1.9, 3.4, 4.8].map((a) => {
    const post = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.014, 0.32, 6), postMat);
    pole.position.y = 0.16;
    const flag = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.07, 0.008), flagMat);
    flag.position.set(0.07, 0.28, 0);
    post.add(pole, flag);
    post.position.set(Math.cos(a) * 1.69, -0.6, Math.sin(a) * 1.69);
    post.rotation.y = -a + Math.PI / 2;
    group.add(post);
    return flag;
  });

  /* Rumah mini: satu DI DALAM zona KRB, satu DI LUAR (pesan produk) */
  const wallMat = std(0xd9c8ac, { roughness: 0.75 });
  const roofMat = std(0x5c4632, { roughness: 0.8 });
  const houseIn = makeMiniHouse(wallMat, roofMat, flagMat);
  houseIn.position.set(Math.cos(0.95) * 1.38, -0.615, Math.sin(0.95) * 1.38);
  houseIn.rotation.y = -0.6;
  const houseOut = makeMiniHouse(std(0xbfae94, { roughness: 0.75 }), roofMat, null);
  houseOut.position.set(Math.cos(0.45) * 2.02, -0.615, Math.sin(0.45) * 2.02);
  houseOut.rotation.y = -0.3;
  group.add(houseIn, houseOut);

  /* Vegetasi mati di lereng bawah, sisi jauh dari aliran lava (-x) */
  const deadMat = std(0x33281e, { roughness: 0.95 });
  [
    [1.78, 2.65, 0.9],
    [1.95, 3.35, 1.1],
    [1.72, 4.05, 0.75],
    [2.05, 2.2, 0.6],
  ].forEach(([r, a, s]) => {
    const tree = makeDeadTree(deadMat);
    tree.position.set(Math.cos(a) * r, -0.615, Math.sin(a) * r);
    tree.scale.setScalar(s);
    tree.rotation.z = (Math.random() - 0.5) * 0.12;
    group.add(tree);
  });

  /* Asap kawah naik + drift angin konsisten ke +x */
  const smokeTex = makeSoftSprite('205,190,170');
  const puffs = Array.from({ length: 6 }, (_, i) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, transparent: true, opacity: 0.5, depthWrite: false }));
    s.userData.offset = i / 6;
    s.userData.sway = Math.random() * TAU;
    group.add(s);
    return s;
  });

  /* Abu: naik + geser angin seragam, alpha turun dengan tinggi (RGBA vertex) */
  const ASH = 48;
  const ashPos = new Float32Array(ASH * 3);
  const ashCol = new Float32Array(ASH * 4);
  for (let i = 0; i < ASH; i += 1) {
    ashPos[i * 3] = (Math.random() - 0.5) * 0.9;
    ashPos[i * 3 + 1] = 0.4 + Math.random() * 1.8;
    ashPos[i * 3 + 2] = (Math.random() - 0.5) * 0.9;
    ashCol[i * 4] = 0.82;
    ashCol[i * 4 + 1] = 0.76;
    ashCol[i * 4 + 2] = 0.68;
    ashCol[i * 4 + 3] = 0.5;
  }
  const ashGeo = new THREE.BufferGeometry();
  ashGeo.setAttribute('position', new THREE.BufferAttribute(ashPos, 3));
  ashGeo.setAttribute('color', new THREE.BufferAttribute(ashCol, 4));
  const ash = new THREE.Points(
    ashGeo,
    new THREE.PointsMaterial({
      size: 0.06,
      map: smokeTex,
      transparent: true,
      vertexColors: true,
      depthWrite: false,
    })
  );
  group.add(ash);

  /* Kabut tipis di dasar: 2 sprite besar sangat transparan */
  const fogSprites = [-0.85, 0.9].map((x, i) => {
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: smokeTex, transparent: true, opacity: 0.09, depthWrite: false })
    );
    s.scale.set(3.4 + i * 0.5, 1.0);
    s.position.set(x, -0.48, 0.3 - i * 0.5);
    s.userData.baseX = x;
    s.userData.phase = i * 2.4;
    group.add(s);
    return s;
  });

  scene.add(group);

  /* ── Update per-frame: hanya mutasi state yang sudah ada ───────────────── */
  return (t) => {
    /* Asap: naik, melebar, terbawa angin ke +x */
    puffs.forEach((p) => {
      const k = (t * 0.2 + p.userData.offset) % 1;
      p.position.set(
        Math.sin(k * 5 + p.userData.sway) * 0.14 + k * 0.55,
        0.4 + k * 1.6,
        Math.cos(k * 4 + p.userData.sway) * 0.1
      );
      p.scale.setScalar(0.35 + k * 1.15);
      p.material.opacity = 0.5 * (1 - k);
    });

    /* Abu: naik + drift seragam, alpha memudar dengan tinggi */
    const ap = ashGeo.attributes.position;
    const ac = ashGeo.attributes.color;
    for (let i = 0; i < ASH; i += 1) {
      let y = ap.getY(i) + 0.006;
      let x = ap.getX(i) + 0.0042;
      if (y > 2.3) y = 0.4;
      if (x > 1.7) x = -1.0;
      ap.setY(i, y);
      ap.setX(i, x);
      ac.array[i * 4 + 3] = Math.max(0, 1 - (y - 0.4) / 1.9) * 0.5;
    }
    ap.needsUpdate = true;
    ac.needsUpdate = true;

    /* Kabut dasar: drift sangat lambat */
    fogSprites.forEach((s) => {
      s.position.x = s.userData.baseX + Math.sin(t * 0.07 + s.userData.phase) * 0.3;
    });

    /* Cincin KRB: statis + denyut halus menjauh */
    const pk = (t * 0.3) % 1;
    krPulse.scale.setScalar(1 + pk * 0.22);
    krPulse.material.opacity = 0.3 * (1 - pk);
    krRing.material.opacity = 0.34 + Math.sin(t * 1.1) * 0.08;

    /* Bendera berkibar pelan */
    flags.forEach((f, i) => {
      f.rotation.y = Math.sin(t * 1.6 + i * 1.7) * 0.22;
    });

    /* Kilat kawah: pulsa singkat tiap ±4 detik (bukan tiap frame) */
    const cyc = t % 4;
    let flashI = 0;
    if (cyc < 0.34) {
      flashI = 13 * Math.sin((Math.PI * cyc) / 0.34) ** 2;
      if (cyc > 0.12 && cyc < 0.2) flashI *= 0.2; // dobel-kilat
    }
    flash.intensity = flashI;

    /* Flicker lava + glow kawah + scroll tekstur aliran */
    const flicker = 1.6 + Math.sin(t * 2.4) * 0.6 + Math.sin(t * 7.3) * 0.25;
    lava.material.emissiveIntensity = flicker;
    glow.material.opacity = 0.42 + flicker * 0.07 + (flashI > 0 ? 0.25 : 0);
    glow.scale.setScalar(1.2 + Math.sin(t * 1.8) * 0.08);
    flowTex.offset.y = -(t * 0.22) % 1;
    flowA.material.emissiveIntensity = 1 + flicker * 0.35;
    flowB.material.emissiveIntensity = 0.9 + flicker * 0.3;
    poolA.material.emissiveIntensity = 0.9 + flicker * 0.3;
    poolB.material.emissiveIntensity = 0.8 + flicker * 0.3;
    lavaLight.intensity = 1.6 + flicker * 0.5;

    group.rotation.y = Math.sin(t * 0.25) * 0.06;
  };
}
