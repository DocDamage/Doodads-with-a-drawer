// scratch/test_recovery_and_drag_release.js
// Recovered sessions go back to the map they were recorded on (doodads and staged event edits),
// and a drag whose mouse-up was missed (focus left the window) ends on the next button-less move.
const assert = require('assert');

console.log("=== Testing Recovery Map Targeting & Drag Release ===");

global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
const canvas = {
    width: 816, height: 624,
    addEventListener() {}, removeEventListener() {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 816, height: 624 })
};
global.document = {
    createElement: () => ({ style: {}, appendChild() {}, removeChild() {}, querySelectorAll: () => [], addEventListener() {}, getContext: () => ({}) }),
    body: { appendChild() {}, removeChild() {} },
    getElementById: () => null,
    querySelector: () => canvas
};
global.Utils = { RPGMAKER_NAME: "MZ", isNwjs: () => true, isOptionValid: (opt) => opt === "test" };
global.PluginManager = { parameters: () => ({}) };
global.$gameMap = { mapId: () => 1, displayX: () => 0, displayY: () => 0, tileWidth: () => 48, tileHeight: () => 48 };

require('../Docs-Doodads.js');
const ws = DocsDoodads.Workspace;
const Persistence = DocsDoodads.Persistence;
ws.showToast = () => {};
ws.refreshSpriteset = () => {};
ws.refreshInspector = () => {};

// 1. A snapshot from map 2 restores map 2, even when the editor is opened on map 1.
const mapOneDoodad = Object.assign(DocsDoodads.standardStruct(), { x: 1 });
const recoveredDoodad = Object.assign(DocsDoodads.standardStruct(), { x: 2 });
global.$dataDocsDoodads = { 1: [mapOneDoodad], 2: [] };
ws.applyRecovery({ timestamp: 1, mapId: 2, doodads: [recoveredDoodad], stagedMap: { events: [null, { id: 1, name: 'Recovered' }] },
    mapSettings: { 2: { ambient: { darkness: 0.5 } } } });
assert.deepStrictEqual($dataDocsDoodads[1], [mapOneDoodad], "map 1 is untouched");
assert.deepStrictEqual($dataDocsDoodads[2], [recoveredDoodad], "map 2 gets its doodads back");
assert.strictEqual(Persistence.stagedMaps[2].events[1].name, 'Recovered', "map 2's staged event edits are restored too");
assert.strictEqual($gameMap._stagedMapData, undefined, "the current map's staged data is not replaced");
assert.strictEqual($dataDocsDoodads.mapSettings[2].ambient.darkness, 0.5);
assert.ok(Persistence.dirtyDoodads && Persistence.dirtyMap, "recovered work is unsaved work");

// Snapshots from older builds have no map id: they belong to the map the editor opened on.
Persistence.stagedMaps = {};
ws.applyRecovery({ timestamp: 1, doodads: [recoveredDoodad], stagedMap: { events: [null] } });
assert.deepStrictEqual($dataDocsDoodads[1], [recoveredDoodad]);
assert.strictEqual($gameMap._stagedMapDataId, 1);
assert.deepStrictEqual($gameMap._stagedMapData, { events: [null] });

// 2. A missed mouse-up: the next move with no buttons held finishes the drag where it is.
const crate = Object.assign(DocsDoodads.standardStruct(), { x: 100, y: 100, frameW: 48, frameH: 48 });
$dataDocsDoodads[1] = [crate];
ws.attachCanvasListeners();
ws._onCanvasMouseDown({ button: 0, clientX: 100, clientY: 80, shiftKey: false, altKey: false });
assert.ok(ws._drag, "pressing on a doodad starts a drag");
ws._onCanvasMouseMove({ buttons: 1, clientX: 160, clientY: 80, shiftKey: false, altKey: true });
assert.strictEqual(crate.x, 160);
ws._onCanvasMouseMove({ buttons: 0, clientX: 600, clientY: 500, shiftKey: false, altKey: true });
assert.strictEqual(ws._drag, null, "the drag ended");
assert.strictEqual(crate.x, 160, "the doodad stays where the button was last held");
assert.strictEqual(DocsDoodads.Undo.undoStack.length > 0, true, "the move is still undoable");
ws.detachCanvasListeners();

console.log("✓ Recovery restores into the recorded map (doodads, staged events, settings), and missed mouse-ups end drags.");
