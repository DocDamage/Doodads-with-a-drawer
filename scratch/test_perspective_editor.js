// scratch/test_perspective_editor.js
// The map panel's 3D View section, live camera settings, plugin-command camera moves, and editing in
// 3D: clicks through the ground, picking standing doodads by what's on screen, and drag grab offsets.
const assert = require('assert');

console.log("=== Testing Perspective Editor & Camera ===");

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
global.$gameMap = { mapId: () => 1, displayX: () => 0, displayY: () => 0, tileWidth: () => 48, tileHeight: () => 48, width: () => 40, height: () => 40 };
global.$dataDocsDoodads = { 1: [] };

require('../Docs-Doodads.js');
const ws = DocsDoodads.Workspace;
const P = DocsDoodads.Perspective;
const Undo = DocsDoodads.Undo;
ws.showToast = () => {};
ws.refreshSpriteset = () => {};
ws.currentMapId = () => 1;

// 1. The panel and its settings (undoable).
assert.strictEqual(P.active(), null, "flat until turned on");
const keys = ws.perspectiveFields().map(f => f.key);
for (const k of ['enabled', 'pitch', 'yaw', 'fov', 'zoom', 'viewTiles', 'fogStart', 'fogEnd', 'fogColor', 'skyColor', 'voidColor', 'rotate', 'smoothGround', 'curve', 'curveRadius', 'lean', 'water', 'waterStrength', 'waterSpeed', 'waterShine', 'waterWakes', 'weather', 'weatherDensity', 'dayNight', 'doodadScale', 'characterScale']) assert.ok(keys.includes(k), k);
assert.ok(ws.renderPerspectivePanel().includes('3D View (this map)'));
ws.setPerspectiveField('enabled', true);
assert.ok(P.active(), "on");
ws.setPerspectiveField('pitch', 40);
assert.strictEqual(P.active().pitch, 40);
ws.setPerspectiveField('fogUseColor', true);
assert.strictEqual(P.active().fogColor, '#000000', "fog colour switched on");
ws.setPerspectiveField('fogUseColor', false);
assert.strictEqual(P.active().fogColor, '', "fades into the sky");
Undo.undo(); Undo.undo(); Undo.undo();
assert.strictEqual(P.active().pitch, 55);
Undo.undo();
assert.strictEqual(P.active(), null);
ws.setPerspectiveField('enabled', true);

// 2. Camera moves from plugin commands: eased, saved on the map, cleared on a new map.
$gameMap._docsCamera = { yaw: 90 };
assert.strictEqual(P.active().yaw, 90, "a mid-game turn overrides the map's camera");
$gameMap._docsCamera = { enabled: false };
assert.strictEqual(P.active(), null, "Set 3D View: off");
$gameMap._docsCamera = { yaw: 45 };
ws.setPerspectiveField('zoom', 1.5);
assert.strictEqual($gameMap._docsCamera, null, "editing the panel shows the map's own camera again");
assert.strictEqual(P.active().yaw, 0);
Undo.undo();

// 3. Editing in 3D: picking standing doodads by their image on screen, nearest first.
P._cam = P.camera({ target: { x: 480, y: 480 }, pitch: 50, yaw: 0, fov: 50, zoom: 1, width: 816, height: 624 });
const doodad = (props) => Object.assign(DocsDoodads.standardStruct(), { frameW: 48, frameH: 96, posMode: 1 }, props);
const back = doodad({ x: 480, y: 456 }), front = doodad({ x: 480, y: 480 });
$dataDocsDoodads[1] = [front, back];
const boxFront = ws.doodadFlatBox(front);
assert.deepStrictEqual(boxFront.rect, { x: 456, y: 384, w: 48, h: 96 });
assert.deepStrictEqual(boxFront.pivot, { x: 480, y: 480, h: 0 }, "h: the terrain height under it (none here)");
const footFront = P.project(P._cam, 480, 480, 0);
// A point on the front tree's trunk, also covered by the taller-looking tree behind it.
assert.strictEqual(ws.doodadAtScreen({ x: footFront.x, y: footFront.y - 30 }), front, "the nearer one wins");
assert.strictEqual(ws.doodadAtScreen({ x: footFront.x + 200, y: footFront.y }), null);
ws._lastScreenPoint = { x: footFront.x, y: footFront.y - 30 };
assert.strictEqual(ws.doodadAt(0, 0), front, "doodadAt uses the screen in 3D");
ws.selectDoodads([front]);
const sel = ws.selection3d();
assert.strictEqual(sel.length, 1);
assert.strictEqual(P.gizmoBox(P._cam, sel[0].rect, sel[0].pivot).length, 12);
// Dragging grabs the foot: the starting point is the doodad's base, offset by where it was grabbed.
ws.beginDoodadDrag({ x: 0, y: 0 });
assert.deepStrictEqual(ws._drag.start, { x: 480, y: 480 });
assert.ok(Math.abs(ws._drag.grab.y + 30) < 1e-6 && Math.abs(ws._drag.grab.x) < 1e-6);
ws.endDoodadDrag();

// 4. Clicks go through the ground.
DocsDoodads.Compat.getCanvas = () => ({ width: 816, height: 624, getBoundingClientRect: () => ({ left: 0, top: 0, width: 816, height: 624 }) });
const ground = P.project(P._cam, 600, 400, 0);
const at = ws.clientToMapCoords(ground.x, ground.y);
assert.ok(Math.abs(at.x - 600) < 1e-3 && Math.abs(at.y - 400) < 1e-3);
assert.deepStrictEqual([at.tileX, at.tileY], [12, 8]);
const sky = ws.clientToMapCoords(408, -2000);
assert.deepStrictEqual([sky.x, sky.y], [at.x, at.y], "above the horizon: the last ground point");

console.log("✓ 3D View panel, undo, camera overrides, picking, gizmo selection, drag grab and ground clicks verified.");
