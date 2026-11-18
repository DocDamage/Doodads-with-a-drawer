'use strict';
// 8.5.2 A picture into a map: reading (commonest colour per tile, median cut), guessing the key, ignoring thin
// lines, heights from grey, the plan, building lists, and Apply on the stand-in engine as one undo step.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const E = require('./engine/fake_engine');

process.chdir(fs.mkdtempSync(path.join(os.tmpdir(), 'dd-map-from-')));
E.install();
if (typeof global.localStorage === 'undefined') global.localStorage = { data: {}, getItem(k) { return k in this.data ? this.data[k] : null; }, setItem(k, v) { this.data[k] = String(v); }, removeItem(k) { delete this.data[k]; } };
E.setupWorld({ width: 4, height: 4, px: 0, py: 0 });
require('../Docs-Doodads.js');
const D = DocsDoodads, M = D.MapFrom, W = D.Workspace;

const picture = (w, h, paint) => {
    const data = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = paint(x, y), at = (y * w + x) * 4; data.set([c[0], c[1], c[2], c[3] === undefined ? 255 : c[3]], at); }
    return data;
};
const BLUE = [40, 90, 220], GREEN = [60, 170, 70], GREY = [128, 128, 128], DARK = [30, 90, 40];
const quarters = picture(40, 40, (x, y) => x < 20 ? (y < 20 ? BLUE : GREEN) : (y < 20 ? GREY : DARK));

// ---- Reading ----
const read = M.read(quarters, 40, 40, { tilesW: 4, tilesH: 4 });
assert.strictEqual(read.groups.length, 4, 'four coloured quarters give four groups');
assert.deepStrictEqual(read.groups.map(g => g.count), [4, 4, 4, 4]);
const groupAt = (x, y) => read.cells[y * 4 + x];
assert.ok(groupAt(0, 0) === groupAt(1, 1) && groupAt(0, 0) !== groupAt(3, 0) && groupAt(0, 3) !== groupAt(3, 3), 'each quarter is its own group');
const noisy = picture(40, 40, (x, y) => (x === 3 && y === 3) ? [255, 0, 0] : (x < 20 ? BLUE : GREEN));
assert.strictEqual(M.read(noisy, 40, 40, { tilesW: 4, tilesH: 4 }).groups.length, 2, 'the commonest colour wins: a stray pixel is not a group');
assert.deepStrictEqual(M.read(quarters, 40, 40, { tilesW: 4, tilesH: 4 }), read, 'the same picture gives the same reading');
const clear = M.read(picture(4, 4, () => [0, 0, 0, 0]), 4, 4, { tilesW: 2, tilesH: 2 });
assert.deepStrictEqual([clear.cells, clear.groups], [[-1, -1, -1, -1], []], 'see-through tiles are nothing');
const many = M.read(picture(64, 1, x => [x * 4, 255 - x * 4, (x * 37) % 256]), 64, 1, { tilesW: 64, tilesH: 1 });
assert.ok(many.groups.length <= 12, 'at most twelve groups');
assert.throws(() => M.read(new Uint8ClampedArray(4), 10, 10, {}), /could not be read/);
// A big area of one colour is never split into empty copies: a sea, grass, forest, a road and a red mark
// (counts 110, 80, 20, 8 and 3) are five groups, each with its own tiles.
{
    const sea = [40, 92, 204], grass = [100, 188, 84], forest = [20, 100, 28], road = [148, 148, 148], red = [220, 28, 28];
    const cols = [].concat(...[[sea, 110], [grass, 80], [forest, 20], [road, 8], [red, 3]].map(([c, n]) => new Array(n).fill(c)));
    const island = M.read(picture(cols.length, 1, x => cols[x].concat(255)), cols.length, 1, { tilesW: cols.length, tilesH: 1 });
    assert.strictEqual(island.groups.length, 5, 'one group a colour');
    assert.ok(island.groups.every(g => g.count > 0), 'no empty groups');
    assert.deepStrictEqual(island.groups.map(g => g.count).sort((a, b) => a - b), [3, 8, 20, 80, 110]);
}

// ---- The key ----
const overworld = M.kind('overworld');
assert.strictEqual(M.guess(BLUE, overworld), 'water');
assert.strictEqual(M.guess(GREEN, overworld), 'grass');
assert.strictEqual(M.guess(DARK, overworld), 'forest', 'dark green is forest');
assert.strictEqual(M.guess(GREY, overworld), 'road');
assert.strictEqual(M.guess([250, 250, 250], overworld), 'snow');
assert.strictEqual(M.guess([220, 30, 30], overworld), 'place');
assert.strictEqual(M.guess(BLUE, M.kind('room')), null, 'a class the kind does not have is left alone');
assert.strictEqual(M.guess([20, 20, 20], M.kind('dungeon')), 'wall');

// ---- Cleaning ----
const lined = [];
for (let y = 0; y < 6; y++) for (let x = 0; x < 6; x++) lined.push(x === 2 ? 'road' : 'grass');
assert.deepStrictEqual(M.ignoreThin(lined, 6, 6, 1), new Array(36).fill('grass'), 'a one-tile line is ignored when asked');
assert.deepStrictEqual(M.ignoreThin(lined, 6, 6, 0), lined, 'and kept when not');
const thick = [];
for (let y = 0; y < 6; y++) for (let x = 0; x < 6; x++) thick.push(x === 2 || x === 3 ? 'road' : 'grass');
assert.deepStrictEqual(M.ignoreThin(thick, 6, 6, 1), thick, 'a two-tile road stays with N = 1');
const grey = picture(4, 2, x => [x * 80, x * 80, x * 80]);
assert.deepStrictEqual(M.heightsFrom(grey, 4, 2, 2, 1), [0.16, 0.78], 'dark low, light high (the mean grey of each tile)');
assert.strictEqual(M.pixelsPerTile(40, 40, 4, 4), 10);
assert.ok(M.pixelsPerTile(10, 10, 20, 20) < 2);

// ---- Plan and build ----
const key = read.groups.map(g => M.guess(g.colour, overworld));
const plan = M.plan(read, key, overworld, { seed: 3 });
assert.deepStrictEqual([plan.w, plan.h, plan.kind], [4, 4, 'overworld']);
const leave = key.slice(); leave[read.cells[0]] = null;
const leftAlone = M.plan(read, leave, overworld);
assert.ok([0, 1, 4, 5].every(i => leftAlone.cells[i] === null), 'Leave alone leaves those tiles out of the plan');
const tiles = { water: 2048, grass: 2816, road: 1544 };
const built = M.build(plan, overworld, id => tiles[id] || null);
assert.strictEqual(built.tiles.length, 12, 'every planned tile with a chosen tile is painted');
assert.deepStrictEqual(built.unmapped, ['forest'], 'a class with no tile is reported');
assert.ok(built.biomes.every(b => b.biome === 'forest') && built.biomes.length === 4, 'forest tiles get biome art');
const withHeights = M.plan(read, key, overworld, { heights: new Array(16).fill(0).map((_, i) => (i % 4) / 4) });
const builtHeights = M.build(withHeights, overworld, id => tiles[id] || null);
assert.ok(Object.keys(builtHeights.heights).length > 0 && !Object.keys(builtHeights.heights).some(k => { const [x, y] = k.split(',').map(Number); return withHeights.cells[y * 4 + x] === 'water'; }), 'heights for land, not water');

// ---- Apply on the map: one undo step ----
(async () => {
    W.showToast = () => {};
    const view = W.tileMapView();
    assert.ok(view, 'the live map');
    const before = Array.from(view.data);
    const result = W.applyMapFrom(plan, overworld, id => tiles[id] || null);
    assert.ok(result.changes > 0);
    const after = W.tileMapView().data;
    const top = (x, y) => [3, 2, 1, 0].map(z => after[(z * 4 + y) * 4 + x]).find(Boolean) || 0;
    assert.ok(D.Tiles.isAutotile(top(0, 0)) && D.Tiles.kind(top(0, 0)) === D.Tiles.kind(2048), 'water is painted as an autotile with its edges');
    assert.strictEqual(top(2, 0), 1544, 'road where the grey was');
    assert.strictEqual(top(3, 3), 2816, 'forest had no tile: left alone (the ground is unchanged)');
    const steps = D.Undo.undoStack.length;
    D.Undo.undo();
    assert.deepStrictEqual(Array.from(W.tileMapView().data), before, 'Undo puts every tile back');
    D.Undo.redo();
    assert.strictEqual(top(2, 0), 1544, 'Redo paints it again');
    assert.strictEqual(D.Undo.undoStack.length, steps, 'one undo step');
    // Leave alone leaves the tiles alone.
    D.Undo.undo();
    W.applyMapFrom(leftAlone, overworld, id => tiles[id] || null);
    const left = W.tileMapView().data;
    assert.ok([[0, 0], [1, 1]].every(([x, y]) => left[(0 * 4 + y) * 4 + x] === before[(0 * 4 + y) * 4 + x]), 'the left-alone quarter is untouched');
    // On a field tileset a forest goes on the second layer, with the plan's grass under it (not the sea).
    D.Undo.undo();
    const tileView = W.tileMapView;
    W.tileMapView = function() { return Object.assign(tileView.call(this), { mode: 0 }); };
    const forestTiles = { water: 2048, grass: 2816, road: 1544, forest: 3008 };
    W.applyMapFrom(plan, overworld, id => forestTiles[id] || null);
    const field = W.tileMapView().data, at = (x, y, z) => field[(z * 4 + y) * 4 + x];
    assert.strictEqual(D.Tiles.kind(at(3, 3, 1)), D.Tiles.kind(3008), 'the forest on the second layer');
    assert.strictEqual(D.Tiles.kind(at(3, 3, 0)), D.Tiles.kind(2816), 'grass under it');
    D.Undo.undo();
    W.tileMapView = tileView;
    // Tiles per class are remembered per tileset and kind.
    W.mapFromTile('overworld', 'forest', 2900);
    assert.strictEqual(W.mapFromTile('overworld', 'forest'), 2900);
    assert.strictEqual(W.mapFromTile('town', 'tree'), null);
    assert.ok(W.menus().find(m => m.id === 'map').items.some(i => i.id === 'dd-map-from-btn'));
    console.log('Picture to map: reading, groups, guesses, thin lines, heights, plan, build, Apply as one undo step and Leave alone passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
