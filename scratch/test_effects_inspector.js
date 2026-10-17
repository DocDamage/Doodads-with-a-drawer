// scratch/test_effects_inspector.js
// Inspector controls for depth, appearance, motion, shadows, lights, visibility and map lighting,
// all undoable, plus collision traced from the art and depth defaults for new placements.
const assert = require('assert');

console.log("=== Testing Effects Inspector ===");

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
global.$gameMap = { mapId: () => 1, displayX: () => 0, displayY: () => 0, tileWidth: () => 48, tileHeight: () => 48 };
global.$dataDocsDoodads = { 1: [] };

require('../Docs-Doodads.js');
const ws = DocsDoodads.Workspace;
const Undo = DocsDoodads.Undo;
ws.showToast = () => {};
ws.refreshSpriteset = () => {};
DocsDoodads.AssetIndex.save = () => {};

// 1. Property edits go through undo, for one doodad or a whole selection, including nested settings.
const a = Object.assign(DocsDoodads.standardStruct(), { x: 10, y: 10 });
const b = Object.assign(DocsDoodads.standardStruct(), { x: 20, y: 10 });
$dataDocsDoodads[1] = [a, b];
ws.setDoodadProperty([a, b], 'hue', 45);
assert.deepStrictEqual([a.hue, b.hue], [45, 45]);
ws.setDoodadProperty([a], 'light.radius', 200);
assert.strictEqual(a.light.radius, 200);
assert.strictEqual(a.light.intensity, DocsDoodads.Lighting.lightDefaults.intensity, "nested settings start from their defaults");
ws.setDoodadProperty([a], 'depth', 'below');
Undo.undo();
assert.strictEqual(a.depth, 'sorted');
Undo.undo();
assert.strictEqual(a.light, undefined, "undo removes a settings group that did not exist");
Undo.undo();
assert.deepStrictEqual([a.hue, b.hue], [0, 0]);
Undo.redo();
assert.deepStrictEqual([a.hue, b.hue], [45, 45]);
assert.strictEqual(DocsDoodads.Persistence.dirtyDoodads, true, "edits mark the doodads file as changed");

// Reading values falls back to defaults; flip is a sign on the scale.
assert.strictEqual(ws.getDoodadProperty(b, 'shadow.length'), DocsDoodads.Shadow.defaults.length);
ws.setDoodadProperty([b], 'flipX', true);
assert.ok(b.scaleX < 0 && ws.getDoodadProperty(b, 'flipX') === true);
ws.setDoodadProperty([b], 'flipX', false);
assert.ok(b.scaleX > 0);
ws.setDoodadProperty([b], 'switchText', '5:on, 6 off');
assert.deepStrictEqual(b.switch, [[5, true], [6, false]]);
assert.strictEqual(ws.getDoodadProperty(b, 'switchText'), '5:on, 6:off');

// Undo and redo refresh the open inspector so its fields never show the undone value.
let inspectorRefreshes = 0;
const realRefresh = ws.refreshInspector;
ws.refreshInspector = function() { inspectorRefreshes++; return realRefresh.apply(this, arguments); };
ws.mounted = true;
ws.setDoodadProperty([a], 'depth', 'above');
Undo.undo();
Undo.redo();
Undo.undo();
ws.mounted = false;
ws.refreshInspector = realRefresh;
assert.strictEqual(inspectorRefreshes, 3, "each undo/redo re-renders the inspector");

// 2. A live slider drag is one undo step.
ws.beginPropertyPreview([a]);
ws.previewDoodadProperty([a], 'opacity', 0.9);
ws.previewDoodadProperty([a], 'opacity', 0.6);
ws.previewDoodadProperty([a], 'opacity', 0.3);
ws.commitPropertyPreview();
assert.strictEqual(a.opacity, 0.3);
const depthBefore = Undo.undoStack.length;
Undo.undo();
assert.strictEqual(a.opacity, 1, "the whole drag undoes at once");
assert.strictEqual(Undo.undoStack.length, depthBefore - 1);

// 3. The inspector shows the new sections for doodads and the map panel when nothing is selected.
ws.selectDoodads([a]);
ws.refreshInspector();
let html = el('dd-inspector-content').innerHTML;
for (const section of ['Depth', 'Appearance', 'Motion', 'Shadow', 'Light', 'Visibility']) {
    assert.ok(html.includes(`>${section}<`), `doodad inspector has a ${section} section`);
}
assert.ok(html.includes('Trace from Art'), "collision can be traced from the art");
ws.selectDoodads([a, b]);
ws.refreshInspector();
html = el('dd-inspector-content').innerHTML;
assert.ok(html.includes('>Light<') && html.includes('>Motion<'), "multi-selection edits effects together");

ws.selectDoodads([]);
ws.selectedAsset = null;
ws.refreshInspector();
html = el('dd-inspector-content').innerHTML;
assert.ok(html.includes('Ambient Darkness'), "the map panel offers ambient lighting");
ws.setMapAmbient({ darkness: 0.6, color: '#102030', switchId: 4 });
assert.deepStrictEqual(DocsDoodads.Lighting.mapSettings(1).ambient, { darkness: 0.6, color: '#102030', switchId: 4 });
Undo.undo();
assert.strictEqual(DocsDoodads.Lighting.mapSettings(1), null, "map lighting changes undo too");

// 4. New placements: depth comes from the asset (or a guess from its name); custom collision keeps its shape.
const rug = { id: 'img/doodads/red_rug.png', path: 'img/doodads/red_rug.png', fileName: 'red_rug.png', width: 96, height: 48, tags: [], autoTags: [],
    placement: { defaultMode: 'doodad' }, collision: { preset: 'none', shape: null } };
const lamp = { id: 'img/doodads/lamp.png', path: 'img/doodads/lamp.png', fileName: 'lamp.png', width: 32, height: 64, tags: [], autoTags: [],
    placement: { defaultMode: 'doodad', depth: 'above' }, collision: { preset: 'custom', shape: { x: 0.3, y: 0.8, w: 0.4, h: 0.2 } } };
const crate = { id: 'img/doodads/crate.png', path: 'img/doodads/crate.png', fileName: 'crate.png', width: 48, height: 48, tags: [], autoTags: [],
    placement: { defaultMode: 'doodad' }, collision: { preset: 'full', shape: null } };
$dataDocsDoodads[1] = [];
ws.commitPlacement(rug, { x: 100, y: 100, tileX: 2, tileY: 2 });
ws.commitPlacement(lamp, { x: 200, y: 100, tileX: 4, tileY: 2 });
ws.commitPlacement(crate, { x: 300, y: 100, tileX: 6, tileY: 2 });
const placed = $dataDocsDoodads[1];
assert.deepStrictEqual(placed.map(d => d.depth), ['below', 'above', 'sorted']);
assert.deepStrictEqual(placed[1].collision, { preset: 'custom', shape: { x: 0.3, y: 0.8, w: 0.4, h: 0.2 } });
placed[1].collision.shape.x = 0.9;
assert.strictEqual(lamp.collision.shape.x, 0.3, "placed doodads get their own copy of the shape");

// 5. Tracing collision from the art sets a custom shape on doodads (undoably) and on library assets.
(async () => {
    const tree = Object.assign(DocsDoodads.standardStruct(), { bit: [3, 'img/doodads/tree.png'], frameW: 48, frameH: 96 });
    $dataDocsDoodads[1] = [tree];
    const pixels = new Uint8ClampedArray(48 * 96 * 4);
    for (let y = 64; y < 92; y++) for (let x = 18; x < 30; x++) pixels[(y * 48 + x) * 4 + 3] = 255;
    const loader = async (path) => { assert.strictEqual(path, 'img/doodads/tree.png'); return { data: pixels, width: 48, height: 96 }; };
    const traced = await ws.traceCollision([tree], loader);
    assert.strictEqual(traced, 1);
    assert.strictEqual(tree.collision.preset, 'custom');
    assert.ok(Math.abs(tree.collision.shape.w - 12 / 48) < 0.01);
    Undo.undo();
    assert.strictEqual(tree.collision.preset, 'none', "tracing undoes");

    const treeAsset = { id: 'img/doodads/tree.png', path: 'img/doodads/tree.png', fileName: 'tree.png', width: 48, height: 96, collision: { preset: 'none', shape: null }, placement: {} };
    DocsDoodads.AssetIndex.data.assets[treeAsset.id] = treeAsset;
    assert.ok(await ws.traceAssetCollision(treeAsset, loader));
    assert.strictEqual(treeAsset.collision.preset, 'custom');

    // An image with nothing solid leaves the collision alone and says so.
    const empty = Object.assign(DocsDoodads.standardStruct(), { bit: [3, 'img/doodads/tree.png'], frameW: 48, frameH: 96, collision: { preset: 'full', shape: null } });
    const emptyLoader = async () => ({ data: new Uint8ClampedArray(48 * 96 * 4), width: 48, height: 96 });
    assert.strictEqual(await ws.traceCollision([empty], emptyLoader), 0);
    assert.strictEqual(empty.collision.preset, 'full');

    console.log("✓ Undoable property edits, slider drags, inspector sections, map lighting, placement depth/collision defaults, and collision tracing verified.");
})().catch(error => { console.error(error); process.exit(1); });
