// scratch/test_biome_dress.js
// The biome painter (weighted asset mixes, spacing, edge thinning, clustering) and automatic
// map dressing rules (water edges, wall bases, beside a region, inside a region, terrain, open ground).
const assert = require('assert');

console.log("=== Testing Biome Painter & Map Dressing ===");

const elements = {};
function el(id) {
    if (!elements[id]) elements[id] = { id, value: '', checked: false, innerHTML: '', textContent: '', style: {}, onclick: null, onchange: null, oninput: null,
        classList: { toggle() {}, add() {}, remove() {} }, appendChild() {}, querySelectorAll: () => [], addEventListener() {} };
    return elements[id];
}
global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.document = {
    createElement: () => ({ style: {}, appendChild() {}, removeChild() {}, querySelectorAll: () => [], addEventListener() {}, getContext: () => ({}) }),
    body: { appendChild() {}, removeChild() {} },
    getElementById: (id) => el(id)
};
global.Utils = { RPGMAKER_NAME: "MZ", isNwjs: () => true, isOptionValid: (opt) => opt === "test" };
global.PluginManager = { parameters: () => ({}) };
global.$gameMap = { mapId: () => 1, displayX: () => 0, displayY: () => 0, tileWidth: () => 48, tileHeight: () => 48, width: () => 6, height: () => 5 };
global.$dataDocsDoodads = { 1: [] };

require('../Docs-Doodads.js');
const ws = DocsDoodads.Workspace;
const Undo = DocsDoodads.Undo;
const B = DocsDoodads.Biome;
const rng = DocsDoodads.Scatter.rng(7);
ws.showToast = () => {};
ws.refreshSpriteset = () => {};

// 1. Biomes: normalized, entries picked by weight.
const forest = B.normalize({ name: 'Forest', entries: [{ path: 'img/doodads/oak.png', weight: 3 }, { path: 'img/doodads/bush.png', weight: 1, scaleMin: 0.8, scaleMax: 1.2 }, { path: '' }] });
assert.strictEqual(forest.entries.length, 2, "entries without art are dropped");
assert.strictEqual(forest.entries[0].scaleMin, 1);
assert.ok(forest.spacing > 0 && forest.density > 0);
const counts = { 'img/doodads/oak.png': 0, 'img/doodads/bush.png': 0 };
for (let i = 0; i < 2000; i++) counts[B.pickEntry(forest.entries, rng).path]++;
assert.ok(counts['img/doodads/oak.png'] / counts['img/doodads/bush.png'] > 2.2 && counts['img/doodads/oak.png'] / counts['img/doodads/bush.png'] < 3.8, "about 3:1");
assert.strictEqual(B.pickEntry([], rng), null);

// Edge thinning: the centre always keeps, the rim keeps less often.
const keepRate = (dist, thin) => { let n = 0; for (let i = 0; i < 1000; i++) if (B.keep({ x: dist, y: 0 }, { x: 0, y: 0 }, 100, { edgeThin: thin, cluster: 0 }, rng)) n++; return n / 1000; };
assert.strictEqual(keepRate(0, 1), 1);
assert.ok(keepRate(95, 1) < 0.2);
assert.strictEqual(keepRate(95, 0), 1, "no thinning keeps everything");
// Clustering keeps points in patches: neighbours agree more often than far-apart points.
assert.strictEqual(B.keep({ x: 10, y: 10 }, { x: 0, y: 0 }, 1000, { edgeThin: 0, cluster: 1 }, rng), B.keep({ x: 11, y: 10 }, { x: 0, y: 0 }, 1000, { edgeThin: 0, cluster: 1 }, rng));

// A stroke: placements within the brush, spaced apart.
const placements = B.paint(forest, { x: 200, y: 200 }, 120, [], DocsDoodads.Scatter.rng(3));
assert.ok(placements.length > 0);
for (const p of placements) {
    assert.ok(Math.hypot(p.x - 200, p.y - 200) <= 120);
    assert.ok(['img/doodads/oak.png', 'img/doodads/bush.png'].includes(p.path));
    assert.ok(p.scale >= 0.8 && p.scale <= 1.2);
}
for (let i = 0; i < placements.length; i++) for (let j = i + 1; j < placements.length; j++) {
    assert.ok(Math.hypot(placements[i].x - placements[j].x, placements[i].y - placements[j].y) >= forest.spacing - 1e-6, "spaced apart");
}

// 2. Dressing: which tiles each rule targets. A 6x5 map: water in column 0, a wall row on top, a path region in row 3.
//    W . . . . .     row 0 is wall (impassable) except the water column
//    W . . . . .
//    W . . . . .
//    W . r r r .     r = region 9 (path)
//    W . . . . .
const D = DocsDoodads.Dress;
const query = {
    width: 6, height: 5,
    isWater: (x, y) => x === 0,
    isPassable: (x, y) => x > 0 && y > 0,
    regionId: (x, y) => (y === 3 && x >= 2 && x <= 4 ? 9 : 0),
    terrainTag: (x, y) => (x === 5 ? 2 : 0),
    hasEvent: (x, y) => x === 5 && y === 4
};
const tiles = rule => D.tilesFor(rule, query).map(t => t.x + ',' + t.y).sort();
assert.deepStrictEqual(tiles({ where: 'waterEdge' }), ['1,1', '1,2', '1,3', '1,4']);
assert.deepStrictEqual(tiles({ where: 'wallBase' }), ['1,1', '2,1', '3,1', '4,1', '5,1']);
assert.deepStrictEqual(tiles({ where: 'nearRegion', param: 9 }), ['1,3', '2,2', '2,4', '3,2', '3,4', '4,2', '4,4', '5,3']);
assert.deepStrictEqual(tiles({ where: 'region', param: 9 }), ['2,3', '3,3', '4,3']);
assert.deepStrictEqual(tiles({ where: 'terrain', param: 2 }), ['5,1', '5,2', '5,3'], "the event's tile is skipped");
assert.strictEqual(tiles({ where: 'open' }).length, 4 * 5 - 1 - 3, "passable, no event, not on the path");
// Blank tiles (the void around a map) count as passable in MZ but have no ground to dress.
const withVoid = Object.assign({}, query, { hasGround: (x, y) => !(x === 1 && y === 1) });
assert.ok(!D.tilesFor({ where: 'waterEdge' }, withVoid).some(t => t.x === 1 && t.y === 1), 'nothing is placed on blank tiles');

// Planning: chance per tile, spacing from each other and from existing doodads.
const rule = D.normalize({ name: 'Reeds', where: 'waterEdge', chance: 1, spacing: 0, entries: [{ path: 'img/doodads/reed.png' }] });
let plan = D.plan([rule], query, [], 48, 48, DocsDoodads.Scatter.rng(1));
assert.strictEqual(plan.length, 4, "every water-edge tile");
assert.ok(plan.every(p => p.x >= 48 && p.x < 96), "inside column 1");
assert.strictEqual(D.plan([Object.assign({}, rule, { chance: 0 })], query, [], 48, 48, rng).length, 0);
plan = D.plan([Object.assign({}, rule, { spacing: 100 })], query, [], 48, 48, DocsDoodads.Scatter.rng(1));
assert.ok(plan.length >= 1 && plan.length <= 2, "spacing thins them");
plan = D.plan([rule], query, [{ x: 72, y: 96 }], 48, 48, DocsDoodads.Scatter.rng(1));
assert.ok(plan.every(p => Math.hypot(p.x - 72, p.y - 96) >= rule.minGap), "keeps clear of what's already there");

// 3. Editor: biomes and rules are undoable project settings; dressing the map is one undo step.
const bid = ws.newBiome('Forest');
ws.addBiomeEntry(bid, 'img/doodads/oak.png');
ws.setBiomeEntryField(bid, 0, 'weight', 4);
assert.strictEqual(B.find(bid, DocsDoodads.World.get('biomes.list')).entries[0].weight, 4);
ws.setBiomeField(bid, 'spacing', 64);
ws.removeBiomeEntry(bid, 0);
assert.strictEqual(B.find(bid, DocsDoodads.World.get('biomes.list')).entries.length, 0);
for (let i = 0; i < 5; i++) Undo.undo();
assert.deepStrictEqual(DocsDoodads.World.get('biomes.list'), []);

DocsDoodads.World.set('dress.rules', [{ name: 'Reeds', where: 'waterEdge', chance: 1, entries: [{ path: 'img/doodads/reed.png' }] }]);
ws.dressQuery = () => query;
const added = ws.dressMap(5);
assert.strictEqual(added, 4);
assert.strictEqual($dataDocsDoodads[1].length, 4);
assert.ok($dataDocsDoodads[1].every(d => d.bit[1] === 'img/doodads/reed.png' && d.dressed === true), "dressed doodads are marked");
assert.strictEqual(ws.dressMap(5), 0, "dressing again doesn't stack on the same spots");
Undo.undo();
assert.strictEqual($dataDocsDoodads[1].length, 0, "one undo removes the whole dressing pass");
ws.dressMap(5);
assert.strictEqual(ws.clearDressing(), 4, "dressed doodads can be cleared together");
assert.strictEqual($dataDocsDoodads[1].length, 0);

// 4. Panels.
ws.selectDoodads([]);
ws.selectedAsset = null;
ws.refreshInspector();
const html = el('dd-inspector-content').innerHTML;
assert.ok(html.includes('>Biomes<') && html.includes('>Dressing Rules<'));

console.log("✓ Biome weighting, thinning, clustering and strokes; dressing targets, planning, undo and clearing verified.");
