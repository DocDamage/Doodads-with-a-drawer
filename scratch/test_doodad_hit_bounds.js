// Regression: clicking anywhere on a placed doodad's visible image selects it,
// not only within 40px of its bottom-centre anchor.
const assert = require('assert');

console.log("=== Testing Doodad Selection Hit Bounds ===");

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

require('../Docs-Doodads.js');
const ws = DocsDoodads.Workspace;
let selected = null;
ws.selectDoodad = (d) => { selected = d; };
ws.selectEvent = () => {};

const warrior = Object.assign(DocsDoodads.standardStruct(), { x: 360, y: 432, frameW: 224, frameH: 228 });
const coin = Object.assign(DocsDoodads.standardStruct(), { x: 600, y: 600, frameW: 16, frameH: 16 });
const big = Object.assign(DocsDoodads.standardStruct(), { x: 900, y: 900, frameW: 100, frameH: 100, scaleX: 2, scaleY: 2 });
global.$dataDocsDoodads = { 1: [warrior, coin, big] };

function click(x, y) {
    selected = undefined;
    ws.handleDoodadSelection({ x, y, tileX: Math.floor(x / 48), tileY: Math.floor(y / 48) }, false);
    return selected;
}

assert.strictEqual(click(360, 330), warrior, "clicking the body (100px above the feet) selects the doodad");
assert.strictEqual(click(460, 220), warrior, "clicking near the top-right of the image selects it");
assert.strictEqual(click(480, 330), null, "clicking just outside the image selects nothing");
assert.strictEqual(click(620, 600), coin, "tiny doodads keep a comfortable click radius");
assert.strictEqual(click(990, 720), big, "scaled doodads hit-test against their scaled size");

// Eyedropper: clicking a placed doodad's body picks its source asset in the drawer.
const asset = { id: 'img/enemies/actor1_3.png', path: 'img/enemies/Actor1_3.png', fileName: 'Actor1_3.png' };
DocsDoodads.AssetIndex.list = [asset];
warrior.bit = [3, 'img/enemies/Actor1_3.png'];
let pickedAsset = null;
ws.selectAsset = (a) => { pickedAsset = a; };
ws.showToast = () => {};
ws.handleEyedropper({ x: 360, y: 330, tileX: 7, tileY: 6 });
assert.strictEqual(pickedAsset, asset, "eyedropper on the body selects the doodad's asset in the drawer");
// A doodad whose image is not in the library still gets selected on the map.
coin.bit = [3, 'img/pictures/missing.png'];
selected = undefined;
ws.handleEyedropper({ x: 600, y: 595, tileX: 12, tileY: 12 });
assert.strictEqual(selected, coin, "eyedropper falls back to selecting the placed doodad");

// Right-click hit test uses the same bounds.
assert.strictEqual(ws.doodadAt(360, 330), warrior);
assert.strictEqual(ws.doodadAt(480, 330), null);

console.log("✓ Doodads are selectable anywhere on their visible bounds.");
