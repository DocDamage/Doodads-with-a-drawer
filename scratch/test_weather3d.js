// scratch/test_weather3d.js
// Weather in the 3D view: rain, storms and snow from MZ's weather, as particles falling through the
// space around the camera that splash on the ground (and ripple water), drift, and stay around the camera.
const assert = require('assert');

console.log("=== Testing 3D Weather ===");

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
const Wx = DocsDoodads.Weather3D;
const near = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;

// 1. Settings live with the 3D view.
const s = P.normalize({ enabled: true });
assert.deepStrictEqual([s.weather, s.weatherDensity], [true, 1]);
assert.deepStrictEqual([P.normalize({ weather: false, weatherDensity: 9 }).weather, P.normalize({ weatherDensity: 9 }).weatherDensity], [false, 3]);

// 2. What each kind of weather looks like, scaled by MZ's power (0-9) and the density setting.
assert.strictEqual(Wx.params('none', 5, 1), null);
assert.strictEqual(Wx.params('rain', 0, 1), null);
const rain = Wx.params('rain', 5, 1), storm = Wx.params('storm', 5, 1), snow = Wx.params('snow', 5, 1);
assert.ok(rain.count > 0 && Wx.params('rain', 9, 1).count > rain.count && Wx.params('rain', 5, 2).count === rain.count * 2);
assert.ok(storm.speed > rain.speed && storm.count > rain.count && Math.abs(storm.wind) > Math.abs(rain.wind));
assert.ok(snow.speed < rain.speed / 5 && snow.kind === 'flake' && rain.kind === 'streak');
assert.ok(near(rain.dim, 5 * 6 / 255), "dims like MZ's weather");
assert.ok(Wx.params('rain', 9, 3).count <= Wx.maxParticles, "capped");

// 3. Particles fall through a box around the camera's target (map pixels).
const rng = DocsDoodads.Scatter.rng(7);
const box = { x: 1000, y: 1000, radius: 400, height: 480 };
let parts = Wx.resize([], rain.count, box, rng);
assert.strictEqual(parts.length, rain.count);
assert.ok(parts.every(p => Math.abs(p.x - 1000) <= 400 && Math.abs(p.y - 1000) <= 400 && p.z >= 0 && p.z <= 480));
assert.strictEqual(Wx.resize(parts, 10, box, rng).length, 10, "fewer when the weather eases off");
// Rain falls fast and splashes on the ground, then starts again at the top.
const one = [{ x: 1000, y: 1000, z: 20, seed: 0.3 }];
let r = Wx.step(one, 1 / 60, rain, box, rng, 0, () => 0);
assert.ok(r.particles[0].z < 20);
r = Wx.step(r.particles, 0.1, rain, box, rng, 0.1, () => 0);
assert.strictEqual(r.splashes.length, 1, "hit the ground");
assert.ok(r.particles[0].z > 300, "back at the top");
// Raised ground: splashes happen on it, not under it.
r = Wx.step([{ x: 1000, y: 1000, z: 100, seed: 0.5 }], 0.05, rain, box, rng, 0, () => 96);
assert.strictEqual(r.splashes.length, 1);
assert.strictEqual(r.splashes[0].z, 96);
// Wind blows rain sideways; snow sways and drifts slowly, without splashing.
const windy = Wx.step([{ x: 1000, y: 1000, z: 400, seed: 0.5 }], 0.1, storm, box, rng, 0, () => 0).particles[0];
assert.ok(windy.x !== 1000);
let flake = [{ x: 1000, y: 1000, z: 400, seed: 0.25 }];
const xs = [];
for (let i = 0; i < 60; i++) { const out = Wx.step(flake, 1 / 30, snow, box, rng, i / 30, () => 0); flake = out.particles; xs.push(flake[0].x); assert.strictEqual(out.splashes.length, 0); }
assert.ok(Math.max(...xs) - Math.min(...xs) > 4, "sways");
assert.ok(flake[0].z > 200 && flake[0].z < 350, "falls slowly: about 130px in 2 seconds");
// The box follows the camera: particles left behind wrap to the far side.
const moved = Object.assign({}, box, { x: 1500 });
const wrapped = Wx.step([{ x: 1000, y: 1000, z: 300, seed: 0.5 }], 0, rain, moved, rng, 0, () => 0).particles[0];
assert.ok(Math.abs(wrapped.x - 1500) <= 400, "kept around the camera");

// 4. Splashes last a moment.
const sp = [{ x: 0, y: 0, z: 0, born: 0 }];
assert.strictEqual(Wx.pruneSplashes(sp, Wx.splashLife * 0.5).length, 1);
assert.strictEqual(Wx.pruneSplashes(sp, Wx.splashLife + 0.01).length, 0);
assert.ok(Wx.pruneSplashes(Array.from({ length: 500 }, () => ({ x: 0, y: 0, z: 0, born: 1 })), 1).length <= Wx.maxSplashes, "capped");

// Drops are drawn in depth bands sorted in with the trees: nearest band 0, each sorted at its near edge.
assert.strictEqual(Wx.band(100, 100, 900), 0);
assert.strictEqual(Wx.band(900, 100, 900), Wx.depthBands - 1, 'the farthest drop is in the last band');
assert.strictEqual(Wx.band(500, 100, 900), Math.floor(Wx.depthBands / 2));
assert.strictEqual(Wx.band(300, 300, 300), 0, 'all at one depth');
assert.strictEqual(Wx.bandDepth(0, 100, 900), 100);
assert.strictEqual(Wx.bandDepth(1, 100, 900), 100 + 800 / Wx.depthBands);
for (let d = 100; d <= 900; d += 37) assert.ok(Wx.bandDepth(Wx.band(d, 100, 900), 100, 900) <= d, 'a band sorts no farther than its drops');

console.log("✓ Weather settings, rain/storm/snow parameters, falling, splashing on raised ground, wind, snow sway, following the camera and splash lifetimes verified.");
