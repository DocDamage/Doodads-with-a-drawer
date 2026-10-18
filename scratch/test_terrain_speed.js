// scratch/test_terrain_speed.js
// The 3D terrain's per-frame work: triangles sorted far to near by a radix sort on typed arrays, level
// tiles drawn as one quad without changing the ground's shape, and settings looked up once a frame.
const assert = require('assert');

console.log("=== Testing Terrain Speed-ups ===");

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
global.$dataDocsDoodads = { 1: [], mapSettings: {} };

require('../Docs-Doodads.js');
const T = DocsDoodads.Terrain;
const P = DocsDoodads.Perspective;

// 1. The radix sort puts depths far to near, like a comparison sort, and returns positions.
const rng = DocsDoodads.Scatter.rng(3);
const n = 5000;
const buf = T.sortBuffers(n);
const depths = [];
for (let i = 0; i < n; i++) depths.push(buf.depth[i] = 1 + rng() * 4000);
depths[10] = buf.depth[10] = depths[20]; // ties
const order = T.sortFarToNear(buf, n);
for (let i = 1; i < n; i++) assert.ok(buf.depth[order[i - 1]] >= buf.depth[order[i]], 'far to near at ' + i);
assert.deepStrictEqual(Array.from(order).sort((a, b) => a - b), Array.from({ length: n }, (_, i) => i), 'every position once');
// Only the first `count` entries are sorted; the buffers can be reused frame after frame.
buf.depth[0] = 1; buf.depth[1] = 9; buf.depth[2] = 5;
assert.deepStrictEqual(Array.from(T.sortFarToNear(buf, 3).subarray(0, 3)), [1, 2, 0]);
assert.strictEqual(T.sortFarToNear(buf, 0).length, n, 'nothing to sort');

// 2. Level tiles (open ground, inside a range or a forest) are one quad, and the mesh still matches the
// smooth height field everywhere.
const W = 12, H = 12, heights = new Float64Array(W * H);
for (let y = 3; y < 9; y++) for (let x = 3; x < 9; x++) heights[y * W + x] = 2;
const grid = { heights, width: W, height: H };
const mesh = T.buildMesh(grid, 0, 0, W, H, 48, 48, 'smooth');
for (const v of mesh.vertices) assert.ok(Math.abs(T.heightAt(grid, v.x / 48, v.y / 48, 'smooth') - v.h) < 1e-9, 'on the field');
const inside = mesh.vertices.filter(v => v.x === 5 * 48 && v.y === 5 * 48);
assert.ok(inside.length && inside.every(v => v.h === 2), 'the plateau top is at its height');
// The 4 x 4 tiles of the plateau's middle have level neighbours: 2 triangles each, not 32.
const sloped = 8 * 8 - 4 * 4; // the plateau and its ring, minus its level middle
assert.strictEqual(mesh.triangles.length / 3, sloped * 32 + (W * H - sloped) * 2);

// 3. With a frame counter, Perspective.active() and Terrain.grid() are worked out once a frame.
global.$gameMap = { mapId: () => 1, displayX: () => 0, displayY: () => 0, tileWidth: () => 48, tileHeight: () => 48,
    tileset: () => ({ mode: 0, flags: [] }), isLoopHorizontal: () => false, isLoopVertical: () => false };
global.$dataMap = { width: W, height: H, data: new Array(W * H * 6).fill(0) };
global.Graphics = { frameCount: 1 };
$dataDocsDoodads.mapSettings[1] = { perspective: { enabled: true }, terrain: { enabled: true, regions: [] } };
let resolves = 0;
const resolve = P.resolve;
P.resolve = function() { resolves++; return resolve.apply(this, arguments); };
const a = P.active();
assert.strictEqual(P.active(), a, 'same frame: same answer');
assert.strictEqual(resolves, 1);
Graphics.frameCount++;
P.active();
assert.strictEqual(resolves, 2, 'next frame: worked out again');
$dataDocsDoodads.mapSettings[1] = { perspective: { enabled: true, viewTiles: 30 }, terrain: { enabled: true } };
assert.strictEqual(P.active().viewTiles, 30, 'new settings are seen at once');
$gameMap._docsCamera = { pitch: 70 };
assert.strictEqual(P.active().pitch, 70, 'so is a camera change');
P.resolve = resolve;
const g = T.grid();
assert.ok(g && T.grid() === g);
Graphics.frameCount++;
assert.ok(T.grid() === g, 'unchanged settings keep the built heights');
delete global.Graphics;

console.log("✓ Radix sort far to near, level tiles as one quad on the same field, and once-a-frame settings verified.");
