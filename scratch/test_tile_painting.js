// scratch/test_tile_painting.js
// Painting MZ tiles (6.2.4): tile ids on the tileset sheets, autotile shapes from the neighbours (checked
// against MZ's own tables when an MZ project's rmmz_core.js is on this computer), layers, the eraser,
// picking up a tile, and the Tiles tool's strokes as undo steps written into the staged map.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== Testing Tile Painting ===');

global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.document = {
    createElement: () => ({ style: {}, appendChild() {}, removeChild() {}, querySelectorAll: () => [], addEventListener() {}, getContext: () => ({}) }),
    body: { appendChild() {}, removeChild() {} },
    getElementById: () => null
};
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: opt => opt === 'test' };
global.PluginManager = { parameters: () => ({}) };
const W = 6, H = 5;
global.$dataMap = { width: W, height: H, data: new Array(W * H * 6).fill(0), events: [] };
global.$gameMap = { mapId: () => 1, tileWidth: () => 48, tileHeight: () => 48, width: () => W, height: () => H, adjustX: x => x, adjustY: y => y,
    isLoopHorizontal: () => false, isLoopVertical: () => false, tileset: () => ({ tilesetNames: ['A1', 'A2', 'A3', 'A4', 'A5', 'B', 'C', '', ''] }) };
global.$gameMap._stagedMapData = { width: W, height: H, data: $dataMap.data.slice(), events: [null] };
global.$gameMap._stagedMapDataId = 1;
global.$dataDocsDoodads = { 1: [] };

require('../Docs-Doodads.js');
const D = DocsDoodads, T = D.Tiles, ws = D.Workspace;
ws.showToast = () => {};
ws.refreshSpriteset = () => {};

// MZ's tables: the full ones from an MZ project's rmmz_core.js when there is one; otherwise a table made
// by the same rule (the waterfall and the first wall and floor rows are MZ's, as a fixed point).
function mzTables() {
    const core = path.join(process.env.USERPROFILE || '', 'Documents', 'RPGMakerMZ', 'DocsDoodadsQA', 'js', 'rmmz_core.js');
    if (fs.existsSync(core)) {
        const text = fs.readFileSync(core, 'utf8');
        const grab = name => JSON.parse(new RegExp('Tilemap\\.' + name + ' = (\\[[\\s\\S]*?\\]);').exec(text)[1].replace(/\s+/g, ''));
        return { real: true, floor: grab('FLOOR_AUTOTILE_TABLE'), wall: grab('WALL_AUTOTILE_TABLE'), waterfall: grab('WATERFALL_AUTOTILE_TABLE') };
    }
    const combos = (keys, type) => {
        const out = [];
        const seen = new Set();
        for (let m = 0; m < (1 << keys.length); m++) {
            const n = {};
            keys.forEach((k, i) => { n[k] = Boolean(m & (1 << i)); });
            const p = T.pieces(type, n);
            const key = JSON.stringify(p);
            if (!seen.has(key)) { seen.add(key); out.push(p); }
        }
        return out;
    };
    return { real: false, floor: [[[2, 4], [1, 4], [2, 3], [1, 3]]].concat(combos(['l', 'r', 'u', 'd', 'ul', 'ur', 'dl', 'dr'], 'floor')),
        wall: [[[2, 2], [1, 2], [2, 1], [1, 1]]].concat(combos(['l', 'r', 'u', 'd'], 'wall')),
        waterfall: [[[2, 0], [1, 0], [2, 1], [1, 1]], [[0, 0], [1, 0], [0, 1], [1, 1]], [[2, 0], [3, 0], [2, 1], [3, 1]], [[0, 0], [3, 0], [0, 1], [3, 1]]] };
}
const tables = mzTables();
global.Tilemap = { FLOOR_AUTOTILE_TABLE: tables.floor, WALL_AUTOTILE_TABLE: tables.wall, WATERFALL_AUTOTILE_TABLE: tables.waterfall };

// 1. Ids and kinds.
assert.strictEqual(T.make(16, 0), T.A2);
assert.deepStrictEqual([T.kind(T.make(50, 7)), T.shape(T.make(50, 7))], [50, 7]);
assert.deepStrictEqual([T.type(T.make(16, 0)), T.type(T.make(5, 0)), T.type(T.make(4, 0)), T.type(T.make(48, 0)), T.type(T.make(56, 0)), T.type(T.make(80, 0)), T.type(T.make(88, 0)), T.type(5)],
    ['floor', 'waterfall', 'floor', 'wall', 'wall', 'floor', 'wall', null], 'A2 floor, A1 waterfall and water, A3 roof and wall, A4 top and side, B none');
assert.deepStrictEqual([T.idAt(5, 0, 0), T.idAt(5, 8, 0), T.idAt(5, 1, 2), T.idAt(6, 0, 0), T.idAt(4, 3, 2)], [0, 128, 17, 256, 1536 + 19]);
assert.strictEqual(T.idAt(1, 3, 4), T.make(16 + 8 + 1, 0), 'an A2 block');
for (let k = 0; k < 128; k++) {
    const p = T.kindPosition(k);
    assert.strictEqual(T.idAt(p.sheet, p.x, p.y), T.make(k, 0), 'kind ' + k + ' round trip');
    assert.strictEqual(T.sheetOf(T.make(k, 3)), p.sheet);
}
assert.deepStrictEqual([T.sheetOf(5), T.sheetOf(300), T.sheetOf(1600)], [5, 6, 4]);
console.log('✓ ids: sheets, kinds, the palette positions of every autotile');

// 2. Shapes from neighbours, against MZ's tables.
const every = (keys, type, table) => {
    for (let m = 0; m < (1 << keys.length); m++) {
        const n = {};
        keys.forEach((k, i) => { n[k] = Boolean(m & (1 << i)); });
        const pieces = T.pieces(type, n);
        const s = T.shapeFor(pieces, table);
        assert.deepStrictEqual(table[s], pieces, `${type} ${JSON.stringify(n)} has an exact shape`);
    }
};
every(['l', 'r', 'u', 'd', 'ul', 'ur', 'dl', 'dr'], 'floor', tables.floor);
every(['l', 'r', 'u', 'd'], 'wall', tables.wall);
every(['l', 'r'], 'waterfall', tables.waterfall);
const all = { l: true, r: true, u: true, d: true, ul: true, ur: true, dl: true, dr: true };
assert.strictEqual(T.shapeFor(T.pieces('floor', all), tables.floor), 0, 'surrounded: shape 0, as MZ');
assert.strictEqual(T.shapeFor(T.pieces('wall', all), tables.wall), 0);
console.log(`✓ shapes: every neighbour pattern has its shape in ${tables.real ? "MZ's own tables (rmmz_core.js)" : 'the tables'}`);

// 3. Painting: a grass patch joins up; the map edge counts as grass; layers; the eraser.
const map = () => ({ width: W, height: H, data: $dataMap.data, loopX: false, loopY: false });
const grass = T.make(16, 0);
const brush = { ids: [[grass]], layer: 'auto' };
const apply = changes => changes.forEach(c => { $dataMap.data[c.index] = c.after; });
apply(T.paint(map(), 2, 2, brush, tables));
const at = (x, y, z = 0) => $dataMap.data[T.index(W, H, x, y, z)];
assert.strictEqual(T.kind(at(2, 2)), 16);
const alone = T.shape(at(2, 2));
apply(T.paint(map(), 3, 2, brush, tables));
assert.notStrictEqual(T.shape(at(2, 2)), alone, 'the first tile changed shape when the second joined it');
assert.deepStrictEqual(tables.floor[T.shape(at(2, 2))], T.pieces('floor', { l: false, r: true, u: false, d: false }), 'grass on its right only');
apply(T.paint(map(), 0, 0, brush, tables));
assert.deepStrictEqual(tables.floor[T.shape(at(0, 0))], T.pieces('floor', { l: true, u: true, ul: true, ur: true, dl: true }), 'the map edge is grass');
// B tiles go on the upper layers: 2, then 3 over it, then the third pushes the older down.
apply(T.paint(map(), 4, 4, { ids: [[5]], layer: 'auto' }, tables));
apply(T.paint(map(), 4, 4, { ids: [[6]], layer: 'auto' }, tables));
assert.deepStrictEqual([at(4, 4, 2), at(4, 4, 3)], [5, 6]);
apply(T.paint(map(), 4, 4, { ids: [[7]], layer: 'auto' }, tables));
assert.deepStrictEqual([at(4, 4, 2), at(4, 4, 3)], [6, 7]);
assert.strictEqual(T.paint(map(), 4, 4, { ids: [[7]], layer: 'auto' }, tables).length, 0, 'painting the same again changes nothing');
// A block of B tiles, clipped at the edge.
const block = T.paint(map(), 5, 0, { ids: [[1, 2], [9, 10]], layer: 2 }, tables);
assert.deepStrictEqual(block.map(c => c.after).sort((a, b) => a - b), [1, 9], 'only the column that fits');
// The eraser takes the top tile.
apply(T.paint(map(), 4, 4, { erase: true, layer: 'auto' }, tables));
assert.deepStrictEqual([at(4, 4, 2), at(4, 4, 3)], [6, 0]);
apply(T.paint(map(), 3, 2, { erase: true, layer: 'auto' }, tables));
assert.strictEqual(T.shape(at(2, 2)), alone, 'erasing a neighbour reshapes the one left');
assert.deepStrictEqual(T.topAt(map(), 4, 4), { id: 6, layer: 2 });
assert.deepStrictEqual(T.topAt(map(), 2, 2), { id: grass, layer: 0 }, 'an autotile is picked up as its kind');
assert.strictEqual(T.topAt(map(), 1, 3), null);
assert.strictEqual(T.autoLayer(T.make(2, 0)), 1, 'A1 rocks on the water overlay layer');
console.log('✓ painting: joining up, the map edge, upper layers, blocks, the eraser, picking up');

// 4. The tool: a stroke writes the game's map and the staged map, and is one undo step.
$dataMap.data.fill(0);
$gameMap._stagedMapData.data.fill(0);
ws.tileBrush = { sheet: 1, ids: [[grass]], layer: 'auto', erase: false, scale: 0.5 };
ws.clientToMapCoords = (x, y) => ({ tileX: x, tileY: y, x: x * 48, y: y * 48 });
const hook = ws.toolHooks.tiles;
assert.ok(hook.down.call(ws, { clientX: 1, clientY: 1 }));
hook.move.call(ws, { clientX: 2, clientY: 1 }, true);
hook.move.call(ws, { clientX: 3, clientY: 1 }, true);
hook.up.call(ws, {});
assert.ok([1, 2, 3].every(x => T.kind(at(x, 1)) === 16));
assert.ok([1, 2, 3].every(x => $gameMap._stagedMapData.data[T.index(W, H, x, 1, 0)] === at(x, 1)), 'Save writes them');
assert.deepStrictEqual(tables.floor[T.shape(at(2, 1))], T.pieces('floor', { l: true, r: true }), 'the middle joins both ways');
assert.ok(D.Persistence.dirtyMap);
D.Undo.undo();
assert.ok([1, 2, 3].every(x => at(x, 1) === 0 && $gameMap._stagedMapData.data[T.index(W, H, x, 1, 0)] === 0), 'one undo step');
D.Undo.redo();
assert.strictEqual(T.kind(at(2, 1)), 16);
// Alt+click picks up; no tile picked asks for one.
ws.tileBrush.ids = [[0]];
assert.strictEqual(hook.down.call(ws, { clientX: 0, clientY: 0 }), false, 'nothing picked yet');
hook.down.call(ws, { clientX: 2, clientY: 1, altKey: true });
assert.deepStrictEqual(ws.tileBrush.ids, [[grass]]);
assert.strictEqual(ws.tileBrush.sheet, 1);
// Picking from the palette: a block on B, one kind on A2.
ws.tileBrush.sheet = 5;
ws.pickTilesFromSheet({ x: 1, y: 1 }, { x: 2, y: 2 });
assert.deepStrictEqual(ws.tileBrush.ids, [[9, 10], [17, 18]]);
assert.deepStrictEqual(ws.tileSelectionRect(), { x: 1, y: 1, w: 2, h: 2 });
ws.tileBrush.sheet = 1;
ws.pickTilesFromSheet({ x: 3, y: 4 }, { x: 5, y: 5 });
assert.deepStrictEqual(ws.tileBrush.ids, [[T.make(25, 0)]], 'an autotile sheet picks one kind');
assert.deepStrictEqual(ws.tileSelectionRect(), { x: 2, y: 3, w: 2, h: 3 });
// The overlay outlines the brush.
const drawn = [];
ws.placementTool = 'tiles';
ws._tileHover = { x: 1, y: 1 };
hook.overlay.call(ws, { lineStyle() {}, drawRect(...a) { drawn.push(a); } });
assert.deepStrictEqual(drawn[0], [48, 48, 48, 48]);
console.log('✓ the Tiles tool: strokes into the map and the staged map, undo, picking up, the palette');

console.log('=== Tile painting passed ===');
