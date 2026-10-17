// scratch/test_particles_vfx.js
// Particle emitters (presets, rates, bursts, lifetimes, forces, determinism, appearance over life),
// VFX definitions built from particle and sprite-sheet layers, and grass that bends when walked through.
const assert = require('assert');

console.log("=== Testing Particles, VFX & Reactive Doodads ===");

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
const near = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;
const P = DocsDoodads.Particles;

// 1. Configs: presets first, then the doodad's own overrides; bad values fall back or are clamped.
const embers = P.normalize({ preset: 'embers', rate: 5 });
assert.strictEqual(embers.rate, 5);
assert.strictEqual(embers.blend, 'add', "the preset's look is kept");
assert.strictEqual(P.normalize({ rate: 99999 }).rate, 500);
assert.strictEqual(P.normalize({ max: 0 }).max, 1);
assert.deepStrictEqual(P.normalize({ size: 'big' }).size, P.defaults.size);
assert.deepStrictEqual(P.normalize({ size: [4] }).size, [4, 4], "a single value means start = end");
assert.strictEqual(P.normalize({ shape: 'triangle' }).shape, P.defaults.shape);
assert.strictEqual(P.normalize(null).rate, P.defaults.rate);
assert.ok(P.presets.length >= 10);
for (const preset of P.presets) {
    const state = P.createState(P.normalize({ preset: preset.id }), 7);
    P.burst(state, 3);
    for (let i = 0; i < 30; i++) P.step(state, 1 / 60, true);
    assert.ok(state.particles.length > 0, `${preset.id} makes particles`);
}

// 2. Emission follows the rate; bursts add at once; the cap holds.
const steady = P.createState(P.normalize({ rate: 10, lifetime: [5, 5], speed: [0, 0] }), 1);
for (let i = 0; i < 60; i++) P.step(steady, 1 / 60, true);
assert.ok(Math.abs(steady.particles.length - 10) <= 1, `about 10 per second (got ${steady.particles.length})`);
P.burst(steady, 5);
assert.ok(Math.abs(steady.particles.length - 15) <= 1);
const capped = P.createState(P.normalize({ rate: 500, max: 20, lifetime: [5, 5] }), 1);
for (let i = 0; i < 60; i++) P.step(capped, 1 / 60, true);
assert.strictEqual(capped.particles.length, 20);
// Particles die at the end of their life; nothing new appears when emission stops.
for (let i = 0; i < 6 * 60; i++) P.step(steady, 1 / 60, false);
assert.strictEqual(steady.particles.length, 0);
assert.strictEqual(P.isIdle(steady), true);

// 3. Forces: gravity pulls down, the launch angle sets direction (0 = right, -90 = up).
const falling = P.createState(P.normalize({ rate: 0, gravity: 100, speed: [0, 0], lifetime: [9, 9] }), 1);
P.burst(falling, 1);
for (let i = 0; i < 60; i++) P.step(falling, 1 / 60, false);
assert.ok(falling.particles[0].y > 40, "after a second of gravity 100 a particle has dropped about 50px");
const rising = P.createState(P.normalize({ rate: 0, angle: -90, spread: 0, speed: [60, 60], lifetime: [9, 9] }), 1);
P.burst(rising, 1);
P.step(rising, 0.5, false);
assert.ok(near(rising.particles[0].y, -30, 0.5) && near(rising.particles[0].x, 0, 0.5));

// 4. The same seed gives the same particles (stable previews, reproducible tests).
const a = P.createState(P.normalize({ preset: 'sparkles' }), 42);
const b = P.createState(P.normalize({ preset: 'sparkles' }), 42);
for (let i = 0; i < 20; i++) { P.step(a, 1 / 60, true); P.step(b, 1 / 60, true); }
assert.deepStrictEqual(a.particles, b.particles);

// 5. Appearance over a particle's life.
const look = P.createState(P.normalize({ rate: 0, lifetime: [2, 2], size: [10, 2], alpha: [1, 0], colorStart: '#ffffff', colorEnd: '#000000', speed: [0, 0] }), 1);
P.burst(look, 1);
let view = P.view(look)[0];
assert.ok(near(view.size, 10) && near(view.alpha, 1));
assert.strictEqual(view.color, 0xffffff);
P.step(look, 1, false);
view = P.view(look)[0];
assert.ok(near(view.size, 6) && near(view.alpha, 0.5));
assert.strictEqual(view.color, 0x808080);

// Stretched particles (flames, sparks) point along their motion.
const streak = P.createState(P.normalize({ rate: 0, angle: -90, spread: 0, speed: [60, 60], lifetime: [2, 2], stretch: 1.5 }), 1);
P.burst(streak, 1);
P.step(streak, 0.1, false);
view = P.view(streak)[0];
assert.strictEqual(view.stretch, 1.5);
assert.ok(near(view.rotation, 0, 1e-6), "moving straight up keeps the texture upright");
assert.strictEqual(P.view(look)[0].stretch, 0, "round by default");
assert.ok(P.normalize({ preset: 'fire' }).stretch > 0, "fire is drawn as rising tongues");

// 6. VFX: layers of particles and sprite sheets.
const V = DocsDoodads.Vfx;
const def = V.normalize({ id: 'x', name: 'Boom', duration: 1, layers: [
    { type: 'particles', emitter: { preset: 'fire', burst: 30, rate: 0 } },
    { type: 'sheet', image: 'img/animations/Fire1.png', cols: 5, rows: 2, fps: 10, loop: false },
    { type: 'nonsense' }
] });
assert.strictEqual(def.layers.length, 2, "unknown layer types are dropped");
assert.strictEqual(def.layers[0].emitter.burst, 30);
assert.strictEqual(def.layers[1].frames, 10, "frames default to the whole grid");
assert.strictEqual(V.sheetFrame(def.layers[1], 0), 0);
assert.strictEqual(V.sheetFrame(def.layers[1], 0.55), 5);
assert.strictEqual(V.sheetFrame(def.layers[1], 1.2), -1, "a one-shot sheet ends");
assert.strictEqual(V.sheetFrame(Object.assign({}, def.layers[1], { loop: true }), 1.2), 2, "a looping sheet wraps");
assert.ok(near(V.sheetLength(def.layers[1]), 1));
assert.strictEqual(V.emitting(def, def.layers[0], 0.5), true);
assert.strictEqual(V.emitting(def, def.layers[0], 1.5), false, "emission stops at the effect's duration");
assert.strictEqual(V.isFinished(def, 0.5, 0), false);
assert.strictEqual(V.isFinished(def, 1.5, 3), false, "still waiting for particles to fade");
assert.strictEqual(V.isFinished(def, 1.5, 0), true);
assert.strictEqual(V.isFinished(V.normalize({ loop: true, duration: 1, layers: [] }), 99, 0), false, "looping effects never finish");
assert.ok(V.builtIns.length >= 5 && V.builtIns.every(d => d.layers.length > 0));
// Lookups search the project's library first, then the built-ins; ids and names both work.
const library = [V.normalize({ id: 'mine', name: 'My Spell', layers: [{ type: 'particles', emitter: { preset: 'magic' } }] })];
assert.strictEqual(V.find('mine', library).name, 'My Spell');
assert.strictEqual(V.find('my spell', library).id, 'mine');
assert.strictEqual(V.find('explosion', library).id, 'explosion');
assert.strictEqual(V.find('nope', library), null);

// 7. Grass that bends when walked through: a damped spring, pushed away from the walker.
const R = DocsDoodads.React;
const grass = Object.assign(DocsDoodads.standardStruct(), { x: 240, y: 288, frameW: 48, frameH: 48, react: { enabled: true, amount: 1 } });
assert.strictEqual(R.touching(grass, 250, 286, 48), true);
assert.strictEqual(R.touching(grass, 320, 286, 48), false, "beside it");
assert.strictEqual(R.touching(grass, 250, 200, 48), false, "above it");
assert.ok(R.push(grass, 250, 2) < 0, "a walker on the right bends it left");
assert.ok(R.push(grass, 230, 2) > 0);
assert.ok(Math.abs(R.push(grass, 250, 4)) > Math.abs(R.push(grass, 250, 1)), "faster walkers push harder");
let spring = { bend: 0, vel: 0 };
spring = R.step(spring, 0.2);
assert.ok(spring.bend > 0);
let peak = 0;
for (let i = 0; i < 200; i++) { spring = R.step(spring, 0); peak = Math.max(peak, Math.abs(spring.bend)); }
assert.ok(Math.abs(spring.bend) < 0.01, "it springs back to rest");
assert.ok(R.step({ bend: 0, vel: 0 }, 50).bend <= R.maxBend, "bending is capped");

console.log("✓ Particle presets, emission, forces, determinism, appearance, VFX layers/timing/lookup and reactive bending verified.");
