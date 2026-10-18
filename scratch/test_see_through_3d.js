// scratch/test_see_through_3d.js
// Camera collision in the 3D view: hills, tall doodads and tileset objects between the camera and the
// player fade where they cover the player, using the See-Through opacity.
const assert = require('assert');

console.log("=== Testing 3D See-Through ===");

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
const P = DocsDoodads.Perspective;
const near = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;

// A billboard transform: half size, moved to (300, 200), depth 500.
const m = { a: 0.5, b: 0, c: 0, d: 0.5, tx: 300, ty: 200, depth: 500 };

// 1. The player's box runs from their feet to a little above their head; ground must be a margin
// nearer than them to fade, so the ground at their feet never does.
const see = P.seeThroughRect(m, 100, 200, 48, 48, 72);
const [cx, cy, hw, hh] = see.rect;
assert.ok(near(cy + hh, 0.5 * 200 + 200), 'the box starts at the feet');
assert.ok(near(cy - hh, 0.5 * (200 - 48 * 1.2) + 200), 'and reaches a fifth past the head');
assert.ok(near(cx, 0.5 * 100 + 300));
assert.ok(near(hw, 48 * 0.5 * 0.65));
assert.strictEqual(see.depth, 500 - 72);

// 2. Screen boxes of flat rectangles, including a leaning (rotated) transform.
assert.deepStrictEqual(P.screenBox(m, 0, 0, 10, 20), { x: 300, y: 200, w: 5, h: 10 });
const lean = { a: 0, b: 1, c: -1, d: 0, tx: 0, ty: 0 };
assert.deepStrictEqual(P.screenBox(lean, 0, 0, 10, 20), { x: -20, y: 0, w: 20, h: 10 });

// 3. Something hides the player when it is nearer and covers at least a quarter of them.
const playerSee = { rect: [100, 100, 10, 20], depth: 400 };
const covering = { x: 80, y: 70, w: 40, h: 60 };
assert.strictEqual(P.hidesPlayer(covering, 300, playerSee), true);
assert.strictEqual(P.hidesPlayer(covering, 450, playerSee), false, 'behind the player');
assert.strictEqual(P.hidesPlayer({ x: 108, y: 112, w: 4, h: 4 }, 300, playerSee), false, 'a corner is not enough');
assert.strictEqual(P.hidesPlayer({ x: 200, y: 70, w: 40, h: 60 }, 300, playerSee), false, 'off to the side');
assert.strictEqual(P.hidesPlayer(covering, 300, null), false, 'see-through off');

console.log("✓ 3D see-through: player box, screen boxes and what hides the player verified.");
