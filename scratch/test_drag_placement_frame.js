// Regression: dropping a drawer card passes the drag payload (frameW/frameH, no width/height)
// to commitPlacement; the placed doodad must keep the asset's full frame, not a 48x48 corner.
const assert = require('assert');

console.log("=== Testing Drag Placement Frame Size ===");

global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.document = {
    createElement: () => ({ style: {}, appendChild() {}, removeChild() {}, querySelectorAll: () => [], addEventListener() {}, getContext: () => ({}) }),
    body: { appendChild() {}, removeChild() {} },
    getElementById: () => null
};
global.Utils = { RPGMAKER_NAME: "MZ", isNwjs: () => true, isOptionValid: (opt) => opt === "test" };
global.PluginManager = { parameters: () => ({ editKey: "F10", editorMode: "true" }) };
global.$gameMap = { mapId: () => 1 };
global.$dataDocsDoodads = { 1: [] };
global.SceneManager = { _scene: null };

require('../Docs-Doodads.js');
const ws = DocsDoodads.Workspace;
ws.showToast = () => {};

const payload = {
    assetId: 'img/enemies/actor1_3.png', path: 'img/enemies/Actor1_3.png', fileName: 'Actor1_3.png',
    category: 'Other', type: 'doodad', frameW: 224, frameH: 228,
    collision: { preset: 'none' }, placementMode: 'doodad'
};
ws.commitPlacement(payload, { x: 456, y: 432, tileX: 9, tileY: 8 }, payload.placementMode);

const placed = $dataDocsDoodads[1][0];
assert.ok(placed, "dropping a card places a doodad");
assert.deepStrictEqual([placed.frameW, placed.frameH], [224, 228], "the placed doodad shows the whole image");

console.log("✓ Dragged doodads keep the asset's full frame size.");
