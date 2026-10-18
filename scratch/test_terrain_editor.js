// scratch/test_terrain_editor.js
// The map panel's Terrain Height section and the Terrain brush: settings, region/tag lists, painting
// strokes (one undo step each), and the heights the game then uses.
const assert = require('assert');

console.log("=== Testing Terrain Editor ===");

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
const W = 8, H = 6;
global.$dataMap = { width: W, height: H, data: new Array(W * H * 6).fill(0) };
const MOUNTAIN = 2048 + 22 * 48 + 46;
const worldFlags = [];
worldFlags[MOUNTAIN] = 0xe0f;
global.$gameMap = { mapId: () => 1, displayX: () => 0, displayY: () => 0, tileWidth: () => 48, tileHeight: () => 48, width: () => W, height: () => H,
    tileset: () => ({ mode: 0, flags: worldFlags }), isLoopHorizontal: () => false, isLoopVertical: () => false };
global.$dataDocsDoodads = { 1: [] };

require('../Docs-Doodads.js');
const ws = DocsDoodads.Workspace;
const T = DocsDoodads.Terrain;
const Undo = DocsDoodads.Undo;
ws.showToast = () => {};
ws.refreshSpriteset = () => {};
ws.refreshInspector = () => {};
ws.currentMapId = () => 1;
DocsDoodads.Compat.getCanvas = () => ({ width: 384, height: 288, getBoundingClientRect: () => ({ left: 0, top: 0, width: 384, height: 288 }) });

// 1. Panel.
assert.ok(ws.renderTerrainPanel().includes('Terrain Height (this map)'));
const keys = ws.terrainFields().map(f => f.key);
for (const k of ['enabled', 'style', 'auto', 'mountain', 'forest', 'block', 'climb']) assert.ok(keys.includes(k), k);
ws.setTerrainField('enabled', true);
ws.setTerrainField('style', 'stepped');
assert.deepStrictEqual([T.settingsFor(1).enabled, T.settingsFor(1).style], [true, 'stepped']);
ws.setTerrainField('regions', [{ region: 4, height: 2 }]);
$dataMap.data[(5 * H + 2) * W + 3] = 4;
assert.strictEqual(T.grid(true).heights[2 * W + 3], 2, "region 4 raised");
Undo.undo();
assert.strictEqual(T.grid(true).heights[2 * W + 3], 0, "undone");

// 2. Brush strokes: dabs while dragging, one undo step per stroke; painting turns terrain on.
ws.setTerrainField('enabled', false);
ws.terrainBrush = { mode: 'raise', amount: 1, radius: 0, value: 1 };
ws.beginTerrainStroke(48 * 2 + 10, 48 * 1 + 10);      // tile (2, 1)
ws.terrainPaintAt(48 * 2 + 30, 48 * 1 + 20);          // same tile: no second dab
ws.terrainPaintAt(48 * 3 + 10, 48 * 1 + 10);          // tile (3, 1)
ws.endTerrainStroke();
let t = T.settingsFor(1);
assert.strictEqual(t.enabled, true);
assert.deepStrictEqual(t.paint, { '2,1': 1, '3,1': 1 });
ws.terrainBrush = { mode: 'set', amount: 1, radius: 1, value: 3 };
ws.beginTerrainStroke(48 * 5 + 5, 48 * 4 + 5);
ws.endTerrainStroke();
assert.strictEqual(T.settingsFor(1).paint['5,4'], 3);
assert.strictEqual(T.settingsFor(1).paint['4,4'], 3);
Undo.undo();
assert.deepStrictEqual(T.settingsFor(1).paint, { '2,1': 1, '3,1': 1 }, "one stroke undone");
Undo.undo();
assert.strictEqual(T.settingsFor(1).enabled, false, "the first stroke undone too");

// 3. Doodads go on level ground only: placing on a mountain is refused; dragging stops at its edge.
for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) $dataMap.data[(1 * H + y) * W + x] = MOUNTAIN;
ws.setTerrainField('enabled', true);
ws.setTerrainField('paint', {});
let toast = '';
ws.showToast = msg => { toast = msg; };
const lamp = { id: 'img/doodads/lamp.png', path: 'img/doodads/lamp.png', fileName: 'lamp.png', width: 48, height: 96, tags: [], autoTags: [], placement: { defaultMode: 'doodad' }, collision: { preset: 'none' } };
$dataDocsDoodads[1] = [];
ws.commitPlacement(lamp, { x: 72, y: 96, tileX: 1, tileY: 1 });
assert.strictEqual($dataDocsDoodads[1].length, 0, "not on the mountain");
assert.ok(/level ground/.test(toast));
ws.commitPlacement(lamp, { x: 6 * 48 + 24, y: 5 * 48 + 48, tileX: 6, tileY: 5 });
assert.strictEqual($dataDocsDoodads[1].length, 1, "fine on open ground");
const placed = $dataDocsDoodads[1][0];
assert.strictEqual(T.allowsDoodad(placed, 1), true);
ws.selectDoodads([placed]);
ws._lastScreenPoint = null;
ws._drag = { start: { x: 0, y: 0 }, primary: placed, items: [placed], origin: [{ x: placed.x, y: placed.y }], before: [], others: [], moved: false };
ws.updateDoodadDrag({ x: -48, y: 0 }, { altKey: true });
assert.strictEqual(placed.x, 6 * 48 + 24 - 48, "a step along open ground");
ws.updateDoodadDrag({ x: -4 * 48 - 24, y: -3 * 48 }, { altKey: true });
assert.strictEqual(placed.x, 6 * 48 + 24 - 48, "stopped before climbing the mountain");
ws._drag = null;
// The level-ground rule is off when the map has no terrain.
ws.setTerrainField('enabled', false);
assert.strictEqual(T.allowsDoodad(Object.assign({}, placed, { x: 72, y: 96 }), 1), true);

// The brush preview shows exactly the tiles a dab changes, strongest at the centre.
{
    const Tt = DocsDoodads.Terrain;
    const grid = { heights: new Float64Array(20 * 20), width: 20, height: 20 };
    for (const radius of [0, 1, 3]) {
        const foot = Tt.brushFootprint(10, 10, radius);
        const painted = Tt.applyBrush({}, grid, 10, 10, { mode: 'raise', amount: 1, radius });
        assert.deepStrictEqual(foot.map(t => t.x + ',' + t.y).sort(), Object.keys(painted).sort(), 'same tiles at radius ' + radius);
        for (const t of foot) assert.ok(Math.abs(painted[t.x + ',' + t.y] - Math.round(t.weight * 100) / 100) < 1e-9, 'same strength');
    }
    const centre = Tt.brushFootprint(10, 10, 2).find(t => t.x === 10 && t.y === 10);
    assert.strictEqual(centre.weight, 1);
    assert.ok(Object.keys(Tt.brushColors).length === Tt.brushModes.length, 'a colour for every brush mode');
}

console.log("✓ Terrain panel, region heights with undo, brush strokes and undo, and level ground for doodads verified.");
