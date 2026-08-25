import assert from 'node:assert';
import { calculateGap, circularOffset, slideRole, slideStyle } from './testimonialLayout.js';

console.log('Testing testimonialLayout.js ...');

/* ── calculateGap ────────────────────────────────────────────────────── */
// Di bawah/equal minWidth → gap minimum.
assert.strictEqual(calculateGap(0), 60);
assert.strictEqual(calculateGap(800), 60);
assert.strictEqual(calculateGap(1024), 60);

// Interpolasi linear di antara 1024–1456: tepat di tengah = 73.
assert.strictEqual(calculateGap((1024 + 1456) / 2), 73);

// Monoton naik di rentang interpolasi.
let prev = calculateGap(1024);
for (let w = 1100; w <= 1456; w += 28) {
  const g = calculateGap(w);
  assert.ok(g >= prev, `gap harus monoton naik di ${w}`);
  prev = g;
}

// Tepat di maxWidth = 86, lalu tumbuh pelan (0.06018/px).
assert.strictEqual(calculateGap(1456), 86);
assert.ok(Math.abs(calculateGap(2000) - (86 + 0.06018 * 544)) < 1e-9);
assert.strictEqual(calculateGap(9999), Math.max(60, 86 + 0.06018 * (9999 - 1456)));

/* ── circularOffset ──────────────────────────────────────────────────── */
// Offset positif biasa.
assert.strictEqual(circularOffset(1, 0, 4), 1);
assert.strictEqual(circularOffset(3, 2, 4), 1);

// Wrap maju: index sebelum active melingkar ke ekor.
assert.strictEqual(circularOffset(3, 0, 4), 3);
assert.strictEqual(circularOffset(0, 2, 4), 2);

// Tidak pernah negatif untuk input valid apa pun.
for (let length = 1; length <= 6; length += 1) {
  for (let a = 0; a < length; a += 1) {
    for (let i = 0; i < length; i += 1) {
      const off = circularOffset(i, a, length);
      assert.ok(off >= 0 && off < length, `offset ${off} di luar rentang (${i},${a},${length})`);
    }
  }
}

/* ── slideRole ───────────────────────────────────────────────────────── */
// Dengan ≥3 item: active, tetangga kiri/kanan, sisanya hidden.
assert.strictEqual(slideRole(2, 2, 4), 'active');
assert.strictEqual(slideRole(1, 2, 4), 'left');
assert.strictEqual(slideRole(3, 2, 4), 'right');
assert.strictEqual(slideRole(0, 2, 4), 'hidden');

// Dengan tepat 2 item: slide non-active adalah tetangga kiri sekaligus
// kanan; komponen sumber memprioritaskan kiri.
assert.strictEqual(slideRole(0, 1, 2), 'left');
assert.strictEqual(slideRole(1, 0, 2), 'left');
assert.strictEqual(slideRole(0, 0, 2), 'active');

// Satu item selalu active.
assert.strictEqual(slideRole(0, 0, 1), 'active');

// Setiap slide punya tepat satu role aktif per state.
const roles = [];
for (let i = 0; i < 5; i += 1) roles.push(slideRole(i, 2, 5));
assert.strictEqual(roles.filter((r) => r === 'active').length, 1);
assert.strictEqual(roles.filter((r) => r === 'left').length, 1);
assert.strictEqual(roles.filter((r) => r === 'right').length, 1);

/* ── slideStyle ──────────────────────────────────────────────────────── */
const active = slideStyle('active', 73);
assert.strictEqual(active.zIndex, 3);
assert.strictEqual(active.opacity, 1);
assert.strictEqual(active.pointerEvents, 'auto');
assert.ok(active.transform.includes('scale(1)'));

const left = slideStyle('left', 73);
assert.strictEqual(left.zIndex, 2);
assert.ok(left.transform.includes('translateX(-73px)'), left.transform);
assert.ok(left.transform.includes('rotateY(15deg)'));
assert.ok(left.transform.includes(`translateY(-${73 * 0.8}px)`));

const right = slideStyle('right', 73);
assert.ok(right.transform.includes('translateX(73px)'), right.transform);
assert.ok(right.transform.includes('rotateY(-15deg)'));
assert.notStrictEqual(
  left.transform,
  right.transform,
  'kiri dan kanan harus mirror, bukan identik'
);

const hidden = slideStyle('hidden', 73);
assert.strictEqual(hidden.opacity, 0);
assert.strictEqual(hidden.pointerEvents, 'none');

// Gap 0 tidak menghasilkan NaN.
assert.ok(!slideStyle('left', 0).transform.includes('NaN'));

console.log('All testimonialLayout tests passed.');
