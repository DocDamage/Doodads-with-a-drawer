// scratch/test_stand_tiles.js
// Tileset objects standing up in 3D: which B-E tiles are lifted off the ground, and how they group
// into billboards (a star tree top with its trunk, side-by-side columns as one wide object).
const assert = require('assert');

console.log("=== Testing Standing Tileset Objects ===");

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
const S = DocsDoodads.StandTiles;
const P = DocsDoodads.Perspective;

// A 6 x 6 map: grass (A tile 2816) everywhere on layer 0, objects on layer 2.
const W = 6, H = 6;
const map = { width: W, height: H, data: new Array(W * H * 6).fill(0) };
const set = (x, y, z, id) => { map.data[(z * H + y) * W + x] = id; };
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) set(x, y, 0, 2816);
const flags = [];
const TOP = 10, TRUNK = 18, BARREL = 30, WIDE_TOP = 40, WIDE_BASE = 48;
flags[TOP] = 0x10; flags[WIDE_TOP] = 0x10;
flags[TRUNK] = 0x0f; flags[BARREL] = 0x0f; flags[WIDE_BASE] = 0x0f;
set(1, 1, 2, TOP); set(1, 2, 2, TRUNK);                 // a tree: star top over its trunk
set(4, 4, 2, BARREL);                                   // a barrel: no star tile
set(3, 0, 2, WIDE_TOP); set(4, 0, 2, WIDE_TOP);         // a two-wide object
set(3, 1, 2, WIDE_BASE); set(4, 1, 2, WIDE_BASE);

// 1. Off by default; unknown modes are off.
assert.strictEqual(P.normalize({}).standTiles, 'off');
assert.strictEqual(P.normalize({ standTiles: 'everything' }).standTiles, 'off');
assert.strictEqual(P.normalize({ standTiles: 'star' }).standTiles, 'star');
assert.deepStrictEqual(S.groups(map, flags, 'off').list, []);

// 2. 'star': the tree (top + trunk) and the two-wide object stand; the barrel stays flat.
const star = S.groups(map, flags, 'star');
const box = g => [g.x, g.y, g.w, g.h];
assert.deepStrictEqual(star.list.map(box).sort(), [[1, 1, 1, 2], [3, 0, 2, 2]].sort());
const masked = (x, y, z) => star.mask[(z * H + y) * W + x] === 1;
assert.ok(masked(1, 1, 2) && masked(1, 2, 2), 'the tree leaves the ground');
assert.ok(!masked(1, 1, 0), 'the grass under it stays');
assert.ok(!masked(4, 4, 2), 'the barrel stays flat in star mode');
const tree = star.list.find(g => g.x === 1);
assert.deepStrictEqual(tree.cells, [{ dx: 0, dy: 0, tiles: [TOP] }, { dx: 0, dy: 1, tiles: [TRUNK] }]);
// Groups with the same tiles share a picture.
assert.strictEqual(tree.key, '1x2:' + TOP + '|' + TRUNK);

// 3. 'all': the barrel stands on its own too.
const all = S.groups(map, flags, 'all');
assert.deepStrictEqual(all.list.map(box).sort(), [[1, 1, 1, 2], [3, 0, 2, 2], [4, 4, 1, 1]].sort());

// 4. Where a tile's picture is in the tileset images (MZ's layout: B is set 5, C set 6...).
assert.deepStrictEqual(S.source(0, 48, 48), { set: 5, x: 0, y: 0 });
assert.deepStrictEqual(S.source(9, 48, 48), { set: 5, x: 48, y: 48 });
assert.deepStrictEqual(S.source(128, 48, 48), { set: 5, x: 384, y: 0 });
assert.deepStrictEqual(S.source(256 + 3, 48, 48), { set: 6, x: 144, y: 0 });
assert.ok(!S.isObjectTile(0) && !S.isObjectTile(1536) && !S.isObjectTile(2816) && S.isObjectTile(1023));

console.log("✓ Standing tileset objects: modes, star groups with trunks, wide objects, 'all' mode and tile sources verified.");
