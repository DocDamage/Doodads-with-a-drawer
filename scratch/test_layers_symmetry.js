// scratch/test_layers_symmetry.js
// Map layers (show/hide, lock, hide in game, active layer, moving doodads between layers) and
// symmetry mode (placements mirrored across one or both axes, in one undo step).
const assert = require('assert');

console.log("=== Testing Layers & Symmetry ===");

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
global.$gameMap = { mapId: () => 1, displayX: () => 0, displayY: () => 0, tileWidth: () => 48, tileHeight: () => 48, width: () => 20, height: () => 15 };
global.$dataDocsDoodads = { 1: [] };

require('../Docs-Doodads.js');
const ws = DocsDoodads.Workspace;
const Undo = DocsDoodads.Undo;
const L = DocsDoodads.Layers;
ws.showToast = () => {};
ws.refreshSpriteset = () => {};
const doodad = (props) => Object.assign(DocsDoodads.standardStruct(), { frameW: 48, frameH: 48 }, props);

// 1. Every map has a Main layer; doodads without a layer are on it.
assert.deepStrictEqual(L.list(null).map(l => l.id), ['main']);
assert.strictEqual(L.of(doodad({})), 'main');
const settings = { layers: [{ id: 'canopy', name: 'Canopy', hidden: true }, { id: 'debug', name: 'Markers', gameHidden: true }, { id: 'ground', name: 'Ground', locked: true }] };
assert.deepStrictEqual(L.list(settings).map(l => l.id), ['main', 'canopy', 'debug', 'ground']);
assert.strictEqual(L.visibleInEditor(doodad({ layer: 'canopy' }), settings), false);
assert.strictEqual(L.visibleInEditor(doodad({ layer: 'debug' }), settings), true);
assert.strictEqual(L.visibleInGame(doodad({ layer: 'debug' }), settings), false, "marker layers never show in the game");
assert.strictEqual(L.visibleInGame(doodad({ layer: 'canopy' }), settings), true, "hiding in the editor doesn't hide in the game");
assert.strictEqual(L.isLocked(doodad({ layer: 'ground' }), settings), true);
assert.strictEqual(L.isLocked(doodad({ layer: 'gone' }), settings), false, "unknown layers act like Main");

// 2. Editing layers (undoable).
const id = ws.addLayer('Props');
assert.ok(L.list(DocsDoodads.Lighting.mapSettings(1)).some(l => l.id === id && l.name === 'Props'));
ws.renameLayer(id, 'Big Props');
ws.setLayerFlag(id, 'locked', true);
let props = L.list(DocsDoodads.Lighting.mapSettings(1)).find(l => l.id === id);
assert.deepStrictEqual([props.name, props.locked], ['Big Props', true]);
assert.strictEqual(ws.renameLayer('main', 'X'), false, "Main can't be renamed");

// New placements go on the active layer; locked and hidden layers can't be clicked.
ws.activeLayer = id;
const crate = { id: 'img/doodads/crate.png', path: 'img/doodads/crate.png', fileName: 'crate.png', width: 48, height: 48, tags: [], autoTags: [], placement: { defaultMode: 'doodad' }, collision: { preset: 'none' } };
ws.commitPlacement(crate, { x: 100, y: 100, tileX: 2, tileY: 2 });
const placed = $dataDocsDoodads[1][0];
assert.strictEqual(placed.layer, id);
assert.strictEqual(ws.doodadAt(100, 90), null, "locked layer: not selectable");
ws.setLayerFlag(id, 'locked', false);
assert.strictEqual(ws.doodadAt(100, 90), placed);
ws.setLayerFlag(id, 'hidden', true);
assert.strictEqual(ws.doodadAt(100, 90), null, "hidden layer: not selectable");
ws.setLayerFlag(id, 'hidden', false);

// Moving the selection between layers, and deleting a layer moves its doodads to Main.
ws.selectDoodads([placed]);
ws.moveSelectionToLayer('main');
assert.strictEqual(placed.layer, undefined, "Main is stored as no layer");
Undo.undo();
assert.strictEqual(placed.layer, id);
ws.deleteLayer(id);
assert.strictEqual(placed.layer, undefined);
assert.ok(!L.list(DocsDoodads.Lighting.mapSettings(1)).some(l => l.id === id));
Undo.undo();
assert.strictEqual(placed.layer, id, "deleting undoes, doodads included");
ws.activeLayer = 'main';

// 3. Symmetry: mirrored copies around an axis.
const S = DocsDoodads.Symmetry;
const tree = doodad({ x: 100, y: 300, scaleX: 1 });
assert.deepStrictEqual(S.mirrors(tree, { mode: 'off' }), []);
let copies = S.mirrors(tree, { mode: 'x', axisX: 480, axisY: 360 });
assert.strictEqual(copies.length, 1);
assert.deepStrictEqual([copies[0].x, copies[0].y, copies[0].scaleX], [860, 300, -1], "mirrored across x = 480, and flipped");
copies = S.mirrors(tree, { mode: 'y', axisX: 480, axisY: 360 });
assert.deepStrictEqual([copies[0].x, copies[0].y, copies[0].scaleX], [100, 420, 1], "mirrored across y = 360, upright");
copies = S.mirrors(tree, { mode: 'xy', axisX: 480, axisY: 360 });
assert.deepStrictEqual(copies.map(c => [c.x, c.y]).sort(), [[100, 420], [860, 300], [860, 420]].sort());
assert.deepStrictEqual(S.mirrors(doodad({ x: 480, y: 300 }), { mode: 'x', axisX: 480, axisY: 360 }), [], "a doodad on the axis isn't doubled");
assert.notStrictEqual(copies[0], tree);
assert.deepStrictEqual(S.defaultAxes(20, 15, 48, 48), { axisX: 480, axisY: 360 });

// Placing with symmetry on adds the copies in the same undo step.
$dataDocsDoodads[1] = [];
ws.symmetry = { mode: 'x', axisX: 480, axisY: 360 };
ws.commitPlacement(crate, { x: 100, y: 100, tileX: 2, tileY: 2 });
assert.strictEqual($dataDocsDoodads[1].length, 2);
assert.strictEqual($dataDocsDoodads[1][1].x, 860);
Undo.undo();
assert.strictEqual($dataDocsDoodads[1].length, 0, "one undo removes both");
ws.symmetry = { mode: 'off' };

// 4. The map panel lists layers; the doodad inspector picks a layer.
ws.selectDoodads([]);
ws.selectedAsset = null;
ws.refreshInspector();
assert.ok(el('dd-inspector-content').innerHTML.includes('>Layers<'));
const keys = ws.effectSections().reduce((all, s) => all.concat(s.fields.map(f => f.key)), []);
assert.ok(keys.includes('layer'));

console.log("✓ Layer rules, layer editing, active layer, selection locks, moving and deleting layers, and symmetric placement verified.");
