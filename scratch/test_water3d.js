// scratch/test_water3d.js
// Rippling water in the 3D view: settings, the water mask, the wave field the shader uses (and its
// gradient), wake rings left by things moving through water, and when wakes are made.
const assert = require('assert');

console.log("=== Testing 3D Water ===");

global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.document = {
    createElement: () => ({ style: {}, appendChild() {}, removeChild() {}, querySelectorAll: () => [], addEventListener() {}, getContext: () => ({}) }),
    body: { appendChild() {}, removeChild() {} },
    getElementById: () => null
};
global.Utils = { RPGMAKER_NAME: "MZ", isNwjs: () => true, isOptionValid: (opt) => opt === "test" };
global.PluginManager = { parameters: () => ({}) };
global.$gameMap = { mapId: () => 1, displayX: () => 0, displayY: () => 0, tileWidth: () => 48, tileHeight: () => 48 };
global.$dataDocsDoodads = { 1: [] };

require('../Docs-Doodads.js');
const P = DocsDoodads.Perspective;
const Wt = DocsDoodads.Water3D;
const near = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;

// 1. Settings live with the 3D view; water ripples by default.
const s = P.normalize({ enabled: true });
assert.deepStrictEqual([s.water, s.waterStrength, s.waterSpeed, s.waterShine, s.waterWakes], [true, 0.6, 1, 0.4, true]);
const odd = P.normalize({ water: false, waterStrength: 9, waterSpeed: -1, waterShine: 3, waterWakes: false });
assert.deepStrictEqual([odd.water, odd.waterStrength, odd.waterSpeed, odd.waterShine, odd.waterWakes], [false, 2, 0, 1, false]);

// 2. The mask: one RGBA texel per tile, 255 for water.
const mask = Wt.mask(3, 2, (x, y) => x === 1 || (x === 2 && y === 1));
assert.strictEqual(mask.length, 3 * 2 * 4);
assert.deepStrictEqual([0, 1, 2, 3, 4, 5].map(i => mask[i * 4]), [0, 255, 0, 0, 255, 255]);
assert.ok([0, 1, 2, 3, 4, 5].every(i => mask[i * 4 + 3] === 255), "opaque, so the shader reads red only");

// 3. The wave field: deterministic, moving with time and speed, and its gradient matches the slope.
const h = (x, y, t, sp) => Wt.height(x, y, t, sp === undefined ? 1 : sp);
assert.strictEqual(h(100, 50, 2), h(100, 50, 2));
assert.notStrictEqual(h(100, 50, 2), h(100, 50, 2.5), "moves with time");
assert.strictEqual(h(100, 50, 7, 0), h(100, 50, 0, 0), "still water at speed 0");
for (const [x, y, t] of [[0, 0, 0], [37, 91, 1.3], [500, 220, 9.7]]) {
    const g = Wt.gradient(x, y, t, 1);
    const e = 1e-4;
    assert.ok(near(g.x, (h(x + e, y, t) - h(x - e, y, t)) / (2 * e), 1e-5), 'dx');
    assert.ok(near(g.y, (h(x, y + e, t) - h(x, y - e, t)) / (2 * e), 1e-5), 'dy');
}
let maxSlope = 0;
for (let i = 0; i < 400; i++) { const g = Wt.gradient(i * 7.3, i * 3.1, i * 0.05, 1); maxSlope = Math.max(maxSlope, Math.hypot(g.x, g.y)); }
assert.ok(maxSlope > 0.3 && maxSlope <= 1.0001, "gentle ripples, at most a slope of 1: " + maxSlope);
// The shader uses exactly these waves.
for (const w of Wt.waves) assert.ok(Wt.glsl.includes(w.k.toFixed(6)) && Wt.glsl.includes(w.a.toFixed(6)));

// 4. Wakes: rings that spread out from where something moved through water, and fade.
let wakes = [];
wakes = Wt.addWake(wakes, 100, 100, 0);
const ring = t => Wt.wakeGradient(wakes, 100 + Wt.wakeSpeed * t, 100, t);
assert.ok(Math.abs(ring(0.5).x) > 0, "a ring where the wave front is");
assert.ok(near(Wt.wakeGradient(wakes, 100 + Wt.wakeSpeed * 0.5 + 80, 100, 0.5).x, 0, 1e-3), "nothing well outside the ring");
assert.ok(Math.abs(ring(0.4).x) > Math.abs(ring(Wt.wakeLife * 0.9).x), "fades as it spreads");
assert.strictEqual(Wt.wakeGradient(wakes, 100 + Wt.wakeSpeed * (Wt.wakeLife + 1), 100, Wt.wakeLife + 1).x, 0, "gone after its life");
// Looping maps: a wake near the seam reaches across it (the camera may be on the other copy).
const seam = Wt.addWake([], 10, 100, 0);
const across = Wt.wakeGradient(seam, 1440 + 10 + Wt.wakeSpeed * 0.5, 100, 0.5, { width: 1440, height: 0 });
assert.ok(near(across.x, Wt.wakeGradient(seam, 10 + Wt.wakeSpeed * 0.5, 100, 0.5).x, 1e-9) && Math.abs(across.x) > 0);
assert.strictEqual(Wt.wakeGradient(seam, 1440 + 10 + Wt.wakeSpeed * 0.5, 100, 0.5).x, 0, "without the loop it's far away");
// The camera's wrapped position is followed smoothly across the seam.
assert.strictEqual(Wt.unwrap(1430 - 10, 1440), -20);
assert.strictEqual(Wt.unwrap(30, 1440), 30);
assert.strictEqual(Wt.unwrap(1430 - 10, 0), 1420, "no loop: as is");

// Old wakes are dropped; at most 16 are kept (the oldest go first).
for (let i = 0; i < 20; i++) wakes = Wt.addWake(wakes, i, i, 1 + i * 0.01);
assert.strictEqual(wakes.length, 16);
assert.strictEqual(wakes[0].x, 4);
assert.strictEqual(Wt.prune(wakes, 1 + Wt.wakeLife + 0.5).length, 0);
// Packed for the shader: x, y, age, strength for 16 slots; empty slots have strength 0.
const packed = Wt.pack([{ x: 5, y: 6, born: 1, strength: 1 }], 1.5);
assert.strictEqual(packed.length, 64);
assert.deepStrictEqual(Array.from(packed.slice(0, 4)), [5, 6, 0.5, 1]);
assert.strictEqual(packed[7], 0);

// 5. When to make a wake: moving on water, every few frames, or right away on entering a new tile.
const state = {};
assert.strictEqual(Wt.shouldWake(state, { onWater: true, moving: true, tile: '1,1', frame: 100 }), true);
assert.strictEqual(Wt.shouldWake(state, { onWater: true, moving: true, tile: '1,1', frame: 104 }), false, "not every frame");
assert.strictEqual(Wt.shouldWake(state, { onWater: true, moving: true, tile: '1,1', frame: 100 + Wt.wakeEvery }), true);
assert.strictEqual(Wt.shouldWake(state, { onWater: true, moving: true, tile: '2,1', frame: 100 + Wt.wakeEvery + 1 }), true, "a new tile");
assert.strictEqual(Wt.shouldWake(state, { onWater: false, moving: true, tile: '3,1', frame: 400 }), false, "only on water");
assert.strictEqual(Wt.shouldWake({}, { onWater: true, moving: false, tile: '1,1', frame: 500 }), false, "standing still");

console.log("✓ Water settings, mask, wave field and gradient, wakes (spread, fade, cap, packing) and wake timing verified.");
