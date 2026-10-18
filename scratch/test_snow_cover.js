// scratch/test_snow_cover.js
// Snow that settles in the 3D view: the cover builds while it snows, melts afterwards, stays up in
// Winter, and standing objects get white tops where they face the sky.
const assert = require('assert');

console.log("=== Testing Snow Cover ===");

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
global.$dataDocsDoodads = {};

require('../Docs-Doodads.js');
const C = DocsDoodads.SnowCover;
const P = DocsDoodads.Perspective;
const near = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;

// 1. Off unless the map turns it on.
assert.strictEqual(P.normalize({}).snowCover, false);
assert.strictEqual(P.normalize({ snowCover: true }).snowCover, true);

// 2. Heavy snow covers everything in about a minute; light snow takes longer; it melts when it stops.
let cover = 0;
for (let i = 0; i < 30 * 60; i++) cover = C.step(cover, 1 / 60, 'snow', 9, false);
assert.ok(near(cover, 0.5, 1e-6), 'half covered after 30 s of heavy snow');
for (let i = 0; i < 40 * 60; i++) cover = C.step(cover, 1 / 60, 'snow', 9, false);
assert.strictEqual(cover, 1, 'never more than fully covered');
assert.ok(C.step(0, 1, 'snow', 3, false) < C.step(0, 1, 'snow', 9, false), 'light snow settles slower');
assert.ok(C.step(1, 1, 'rain', 9, false) < 1 && C.step(1, 1, 'none', 0, false) < 1, 'rain or clear skies melt it');
assert.strictEqual(C.step(0, 1, 'none', 0, false), 0);
// Winter keeps at least the winter cover; it still fills up further while it snows.
assert.strictEqual(C.step(0, 1, 'none', 0, true), C.winterCover);
assert.ok(C.step(0.9, 1, 'snow', 9, true) > 0.9);
assert.strictEqual(C.isWinter(3, ['Spring', 'Summer', 'Autumn', 'Winter']), true);
assert.strictEqual(C.isWinter(1, ['Spring', 'Summer', 'Autumn', 'Winter']), false);
assert.strictEqual(C.isWinter(-1, ['Winter']), false);
assert.strictEqual(C.isWinter(0, ['Deep winter']), true);

// 3. White tops: the top of each opaque run down a column, fading with depth; each frame of a sheet
// gets its own tops; transparent pixels stay clear.
const W = 2, H = 8;
const alpha = new Uint8ClampedArray(W * H);
// Column 0: opaque from row 2 to 7. Column 1: opaque rows 1-2, a gap at 3, opaque 4-7.
for (let y = 2; y < 8; y++) alpha[y * W] = 255;
for (const y of [1, 2, 4, 5, 6, 7]) alpha[y * W + 1] = 255;
const cap = C.capAlpha(alpha, W, H, 0, 2);
const col = x => Array.from({ length: H }, (_, y) => cap[y * W + x]);
assert.deepStrictEqual(col(0), [0, 0, 255, 128, 0, 0, 0, 0], 'the top of the trunk');
assert.deepStrictEqual(col(1), [0, 255, 128, 0, 255, 128, 0, 0], 'a lower ledge gets its own top');
// Frames 4 pixels tall: the second frame starts a new top even without a gap.
const framed = C.capAlpha(alpha, W, H, 4, 2);
assert.strictEqual(framed[4 * W], 255, 'frame 2 has its own top');

console.log("✓ Snow cover: settling, melting, winter, and white tops on standing objects verified.");
