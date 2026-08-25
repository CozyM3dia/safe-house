import * as THREE from 'three';

/**
 * Scene 3D kartu "Likuefaksi" — cross-section cutaway tanah berstrata.
 * Kontrak builder: export default build(scene, { accent }) → update(t) (t detik).
 * Tanpa listener, tanpa alokasi objek per-frame; disposal oleh parent
 * (scene.traverse dispose geometry/material/map, lihat RailScene3D.jsx).
 */

/* ── Util material & tekstur (disalin dari RailScene3D.jsx) ──────────────── */

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

/* Sedimen: speckle butiran + laminasi (strata likuefaksi) */
function makeSedimentTexture(base, fleck) {
  return canvasTexture(256, 256, (ctx, S) => {
    ctx.fillStyle = shade(base, 0);
    ctx.fillRect(0, 0, S, S);
    for (let i = 0; i < 900; i += 1) {
      ctx.fillStyle = Math.random() > 0.5
        ? `rgba(${fleck},${Math.random() * 0.12})`
        : `rgba(0,0,0,${Math.random() * 0.14})`;
      ctx.fillRect(Math.random() * S, Math.random() * S, 1.6, 1.6);
    }
    for (let i = 0; i < 14; i += 1) {
      ctx.strokeStyle = `rgba(0,0,0,${0.05 + Math.random() * 0.06})`;
      ctx.lineWidth = 1;
      const y = Math.random() * S;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(S * 0.33, y + (Math.random() - 0.5) * 8, S * 0.66, y + (Math.random() - 0.5) * 8, S, y);
      ctx.stroke();
    }
  });
}

/* ── Builder scene likuefaksi ────────────────────────────────────────────── */

export default function build(scene, { accent }) {
  const group = new THREE.Group();

  /* Strata: 4 lempeng sedimen bergeser lateral bergantian arah.
     Sisi kanan dipotong terbuka (cutaway): badan utama lebih pendek,
     muka potong datar warna berbeda menempel sebagai anak lempeng. */
  const tones = [0x4a3828, 0x5c4632, 0x3a2d22, 0x4a3828];
  const cutTones = [0x33271c, 0x40301f, 0x241b14, 0x33271c];
  const slabMeshes = tones.map((c, i) => {
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(4.1, 0.34, 2.6),
      new THREE.MeshStandardMaterial({
        map: makeSedimentTexture(c, i % 2 ? '210,190,160' : '160,120,80'),
        roughness: 0.9,
        envMapIntensity: 0.4,
      })
    );
    body.geometry.translate(-0.25, 0, 0);

    // Muka potong: pelat tipis warna polos (tanah segar terpotong), anak badan
    const face = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.34, 2.6),
      std(cutTones[i], { roughness: 0.72, envMapIntensity: 0.5 })
    );
    face.position.x = 1.68 + (i % 2 ? -0.1 : 0); // potongan bertangga
    body.add(face);

    body.position.y = -0.6 + i * 0.36;
    body.userData.phase = i * 1.25;
    body.userData.dir = i % 2 === 0 ? 1 : -1;
    group.add(body);
    return body;
  });

  // Garis tepi potongan: benang aksen tipis di sudut depan cutaway
  const cutEdge = new THREE.Mesh(new THREE.BoxGeometry(0.012, 1.46, 0.012), emissive(accent, 0.35, { roughness: 0.4 }));
  cutEdge.position.set(1.79, -0.06, 1.305);
  group.add(cutEdge);

  /* Panah pergeseran lateral: sepasang kerucut emissive berlawanan arah,
     bolak-balik dengan fase yang sama seperti geser lapisan atas. */
  const arrowGeo = new THREE.ConeGeometry(0.07, 0.17, 4);
  const arrowMat = emissive(accent, 1.1, { roughness: 0.4 });
  const arrowA = new THREE.Mesh(arrowGeo, arrowMat);
  arrowA.rotation.z = -Math.PI / 2; // tunjuk +x
  arrowA.position.set(1.42, 0.88, -0.55);
  const arrowB = new THREE.Mesh(arrowGeo, arrowMat);
  arrowB.rotation.z = Math.PI / 2; // tunjuk −x
  arrowB.position.set(1.42, 0.88, 0.55);
  group.add(arrowA, arrowB);

  /* Muka air tanah: plane physical tipis mengilap di antara strata 2–3,
     naik saat likuefaksi memuncak (fase sama dengan driver geser). */
  const gwGeo = new THREE.PlaneGeometry(5, 2.72);
  gwGeo.rotateX(-Math.PI / 2);
  const groundwater = new THREE.Mesh(
    gwGeo,
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(accent).lerp(new THREE.Color(0x7a9cbe), 0.45),
      transparent: true,
      opacity: 0.42,
      roughness: 0.08,
      metalness: 0.05,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      envMapIntensity: 1.8,
    })
  );
  group.add(groundwater);
  const GW_BASE_Y = -0.06;

  /* Retakan permukaan di lapisan atas (ikut bergeser) */
  const cracks = [[-0.8, 0.5, 0.3], [0.5, 0.7, -0.4]].map(([x, len, z]) => {
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.02, len), std(0x120d08, { roughness: 1 }));
    c.userData.off = x;
    c.userData.z = z;
    c.rotation.y = x > 0 ? 0.3 : -0.45;
    group.add(c);
    return c;
  });

  /* Sand boil diperbesar: mini-gunung pasir + saluran lumpur (tube aksen)
     mengalir keluar + genangan di ujungnya. */
  const boil = new THREE.Group();
  const mound = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.24, 14), std(0xa89070, { roughness: 0.97 }));
  mound.position.y = 0.12;
  const moundTop = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.12, 10), std(0xbfa584, { roughness: 0.95 }));
  moundTop.position.set(-0.07, 0.27, 0.03);
  const crater = new THREE.Mesh(
    new THREE.CircleGeometry(0.05, 12),
    std(0x2c211a, { roughness: 1 })
  );
  crater.rotation.x = -Math.PI / 2;
  crater.position.y = 0.243;
  const ventGlow = new THREE.Mesh(new THREE.CircleGeometry(0.035, 10), emissive(accent, 0.9, { roughness: 0.5 }));
  ventGlow.rotation.x = -Math.PI / 2;
  ventGlow.position.y = 0.245;

  const channelCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.225, 0.02),
    new THREE.Vector3(0.19, 0.15, 0.1),
    new THREE.Vector3(0.36, 0.05, 0.17),
    new THREE.Vector3(0.54, 0.02, 0.24),
  ]);
  const channel = new THREE.Mesh(
    new THREE.TubeGeometry(channelCurve, 14, 0.02, 6),
    emissive(accent, 0.85, { roughness: 0.45 })
  );

  const poolGeo = new THREE.CircleGeometry(0.13, 18);
  poolGeo.rotateX(-Math.PI / 2);
  const pool = new THREE.Mesh(
    poolGeo,
    new THREE.MeshPhysicalMaterial({
      color: accent,
      transparent: true,
      opacity: 0.5,
      roughness: 0.12,
      clearcoat: 1,
      envMapIntensity: 1.5,
    })
  );
  pool.position.set(0.57, 0.014, 0.25);

  const wetRing = new THREE.Mesh(
    new THREE.RingGeometry(0.38, 0.5, 28),
    new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.22, side: THREE.DoubleSide })
  );
  wetRing.rotation.x = -Math.PI / 2;
  wetRing.position.y = 0.006;

  boil.add(mound, moundTop, crater, ventGlow, channel, pool, wetRing);
  boil.position.set(-1.35, 0.17, 0.45);
  group.add(boil);

  /* Selongsong pasir emissive */
  const dike = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.5, 8), emissive(accent, 0.4, { roughness: 0.5 }));
  dike.position.set(0.9, -0.25, 0.2);
  dike.rotation.z = 0.12;
  group.add(dike);

  /* Rumah retak: rumah kecil di lapisan atas + retakan emissive tipis,
     ikut miring sedikit mengikuti fase pergeseran. */
  const house = new THREE.Group();
  const hb = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.4, 0.52), std(0xe8d9c0, { roughness: 0.7 }));
  hb.position.y = 0.2;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.3, 4), std(0xb45309, { roughness: 0.65 }));
  roof.position.y = 0.55;
  roof.rotation.y = Math.PI / 4;
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 0.02), std(0x6b4a2e, { roughness: 0.8 }));
  door.position.set(0.12, 0.1, 0.27);
  const win = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.02), glass({ opacity: 0.4, color: 0xbfd4e8 }));
  win.position.set(-0.13, 0.26, 0.27);
  const crackA = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.26, 0.012), emissive(accent, 0.95, { roughness: 0.5 }));
  crackA.position.set(0.02, 0.21, 0.272);
  crackA.rotation.z = 0.18;
  const crackB = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.16, 0.012), emissive(accent, 0.75, { roughness: 0.5 }));
  crackB.position.set(-0.05, 0.14, 0.272);
  crackB.rotation.z = -0.35;
  house.add(hb, roof, door, win, crackA, crackB);
  house.position.set(0.55, 0, -0.5);
  group.add(house);

  /* Tiang listrik miring (ciri klasik likuefaksi) */
  const pole = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.95, 8), std(0x6b5138, { roughness: 0.85 }));
  shaft.position.y = 0.47;
  const crossarm = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.03, 0.03), std(0x6b5138, { roughness: 0.85 }));
  crossarm.position.y = 0.86;
  pole.add(shaft, crossarm);
  pole.rotation.z = 0.32;
  group.add(pole);

  /* P bor: casing logam + bendera + tumpukan inti bor (3 silinder pendek
     berjajar di rak kayu) di sebelah casing. */
  const pin = new THREE.Group();
  const casing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.95, 12, 1, true),
    std(0xe8d9c0, { metalness: 0.9, roughness: 0.25, envMapIntensity: 1.3, side: THREE.DoubleSide })
  );
  casing.position.y = 0.45;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.05, 12), std(0xe8d9c0, { metalness: 0.9, roughness: 0.2 }));
  cap.position.y = 0.95;
  const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.4, 6), std(0xe8d9c0, { metalness: 0.8, roughness: 0.3 }));
  flagPole.position.y = 1.15;
  const flag = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.13, 0.01), emissive(accent, 0.35));
  flag.position.set(0.12, 1.28, 0);
  pin.add(casing, cap, flagPole, flag);

  const cores = new THREE.Group();
  const coreTones = [0x4a3828, 0x5c4632, 0x3a2d22];
  const railMat = std(0x8d7a64, { roughness: 0.9 });
  [0.12, 0.2].forEach((z) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.018, 0.02), railMat);
    rail.position.set(0.32, 0.012, z);
    cores.add(rail);
  });
  coreTones.forEach((ct, i) => {
    const core = new THREE.Mesh(
      new THREE.CylinderGeometry(0.042, 0.042, 0.2, 10),
      new THREE.MeshStandardMaterial({
        map: makeSedimentTexture(ct, i % 2 ? '210,190,160' : '160,120,80'),
        roughness: 0.92,
        envMapIntensity: 0.35,
      })
    );
    core.rotation.z = Math.PI / 2;
    core.position.set(0.18 + i * 0.14, 0.055, 0.16);
    cores.add(core);
  });
  pin.add(cores);
  group.add(pin);
  scene.add(group);

  /* ── Update per-frame: hanya mutasi transform/uniform, tanpa alokasi ── */
  return (t) => {
    const k = Math.sin(t * 0.7); // driver geser bersama

    slabMeshes.forEach((s) => {
      s.position.x = k * 0.16 * s.userData.dir;
    });

    const topX = slabMeshes[3].position.x;
    const topY = slabMeshes[3].position.y;

    // Panah pergeseran saling mendekat-mendekat
    arrowA.position.x = 1.42 + k * 0.13;
    arrowB.position.x = 1.42 - k * 0.13;
    arrowMat.emissiveIntensity = 0.9 + k * 0.35;

    // Muka air tanah naik saat likuefaksi memuncak + kilau berdenyut
    groundwater.position.y = GW_BASE_Y + Math.max(0, k) * 0.085;
    groundwater.material.opacity = 0.36 + 0.09 * (0.5 + 0.5 * Math.sin(t * 1.9));

    cracks.forEach((c) => {
      c.position.x = topX + c.userData.off;
      c.position.y = topY + 0.18;
    });

    boil.position.x = topX - 1.35;
    boil.position.y = topY + 0.18;
    channel.material.emissiveIntensity = 0.7 + k * 0.4;
    pool.material.opacity = 0.42 + k * 0.14;
    wetRing.material.opacity = 0.16 + k * 0.1;
    ventGlow.material.emissiveIntensity = 0.7 + k * 0.5;

    house.position.x = topX + 0.55;
    house.position.y = topY + 0.17;
    house.rotation.z = 0.05 + k * 0.05; // ikut miring sedikit
    crackA.material.emissiveIntensity = 0.8 + k * 0.35;

    pole.position.x = topX + 1.5;
    pole.position.y = topY + 0.17;
    pole.rotation.z = 0.32 + k * 0.03;

    pin.position.x = topX - 0.3;
    pin.position.y = topY + 0.17;

    group.rotation.y = Math.sin(t * 0.24) * 0.06;
  };
}
