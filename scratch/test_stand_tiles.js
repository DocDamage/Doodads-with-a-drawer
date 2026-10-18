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

// 5. Roofs and walls stay flat: a star tile over an A3 roof (eaves) or an A4 wall (a window) isn't a
// tree. A keep-flat region keeps anything flat; elsewhere trees still stand.
{
    const ROOF = 4352, WALL_TOP = 5888;
    const m2 = { width: W, height: H, data: map.data.slice() };
    const put = (x, y, z, id) => { m2.data[(z * H + y) * W + x] = id; };
    put(4, 4, 2, 0);
    put(0, 4, 0, ROOF); put(0, 4, 2, TOP);          // eaves over a roof
    put(2, 4, 0, WALL_TOP); put(2, 4, 2, BARREL);   // a window on a wall
    const g = S.groups(m2, flags, 'all');
    assert.ok(!g.list.some(gr => gr.x === 0 && gr.y === 4), 'eaves on a roof stay flat');
    assert.ok(!g.list.some(gr => gr.x === 2 && gr.y === 4), 'a window on a wall stays flat');
    assert.ok(g.list.some(gr => gr.x === 1 && gr.y === 1), 'the tree still stands');
    // A tree in front of a house: its top over the wall, its trunk on the ground. It still stands.
    put(5, 2, 0, WALL_TOP); put(5, 2, 2, TOP); put(5, 3, 2, TRUNK);
    assert.ok(S.groups(m2, flags, 'star').list.some(gr => gr.x === 5 && gr.y === 2 && gr.h === 2), 'a tree against a wall stands');
    put(1, 1, 5, 7); put(1, 2, 5, 7);
    const kept = S.groups(m2, flags, 'star', { flatRegion: 7 });
    assert.ok(!kept.list.some(gr => gr.x === 1 && gr.y === 1), 'a tree in the keep-flat region stays flat');
    assert.ok(kept.list.some(gr => gr.x === 3), 'others still stand');
    assert.strictEqual(P.normalize({}).standFlatRegion, 0);
    assert.strictEqual(P.normalize({ standFlatRegion: 300 }).standFlatRegion, 255);
}

console.log("✓ Standing tileset objects: modes, star groups with trunks, wide objects, 'all' mode, tile sources, roofs and walls kept flat and the keep-flat region verified.");
