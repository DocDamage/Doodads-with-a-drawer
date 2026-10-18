// scratch/test_billboard_scale.js
// 3D-only height for things that stand up: standing doodads and characters can be shrunk (or grown) in
// the 3D view without changing the 2D map. They stay on their feet, and editor picking matches.
const assert = require('assert');

console.log("=== Testing 3D Billboard Scale ===");

global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.document = {
    createElement: () => ({ style: {}, appendChild() {}, removeChild() {}, querySelectorAll: () => [], addEventListener() {}, getContext: () => ({}) }),
    body: { appendChild() {}, removeChild() {} },
    getElementById: () => null
};
global.Utils = { RPGMAKER_NAME: "MZ", isNwjs: () => true, isOptionValid: (opt) => opt === "test" };
global.PluginManager = { parameters: () => ({}) };
global.$gameMap = { mapId: () => 1, displayX: () => 0, displayY: () => 0, tileWidth: () => 48, tileHeight: () => 48, width: () => 40, height: () => 40 };
global.$dataDocsDoodads = { 1: [] };

require('../Docs-Doodads.js');
const P = DocsDoodads.Perspective;
const ws = DocsDoodads.Workspace;
const near = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;

// 1. Settings: full size by default, clamped.
const s = P.normalize({ enabled: true });
assert.deepStrictEqual([s.doodadScale, s.characterScale], [1, 1]);
assert.deepStrictEqual([P.normalize({ doodadScale: 9 }).doodadScale, P.normalize({ characterScale: 0 }).characterScale], [2, 0.25]);

// 2. Scaling a billboard about its foot: the foot stays put, everything else shrinks toward it.
const cam = P.camera({ target: { x: 480, y: 480 }, pitch: 40, yaw: 0, fov: 50, zoom: 1, width: 816, height: 624 });
const pivot = { x: 480, y: 480 };
const m = P.billboardMatrix(cam, pivot);
const half = P.scaleAbout(m, pivot, 0.5);
const apply = (mm, x, y) => ({ x: mm.a * x + mm.c * y + mm.tx, y: mm.b * x + mm.d * y + mm.ty });
const foot = apply(m, 480, 480), footHalf = apply(half, 480, 480);
assert.ok(near(foot.x, footHalf.x) && near(foot.y, footHalf.y), "feet on the ground");
const top = apply(m, 480, 336), topHalf = apply(half, 480, 336);
assert.ok(near(foot.y - topHalf.y, (foot.y - top.y) / 2), "half as tall");
assert.strictEqual(P.scaleAbout(m, pivot, 1), m, "unchanged at 1");

// 3. Editor picking uses the same size: a lamp shrunk to half is only picked on its lower half.
$dataDocsDoodads[1] = [Object.assign(DocsDoodads.standardStruct(), { x: 480, y: 480, frameW: 48, frameH: 144, posMode: 1 })];
global.$dataDocsDoodads.mapSettings = { 1: { perspective: { enabled: true, doodadScale: 0.5 } } };
P._cam = cam;
const lamp = $dataDocsDoodads[1][0];
const box = ws.doodadFlatBox(lamp);
assert.deepStrictEqual([box.rect.h, box.rect.y], [72, 408], "72px tall, standing on the same spot");
const footScreen = P.project(cam, 480, 480, 0);
assert.strictEqual(ws.doodadAtScreen({ x: footScreen.x, y: footScreen.y - 40 * footScreen.scale }), lamp);
assert.strictEqual(ws.doodadAtScreen({ x: footScreen.x, y: footScreen.y - 120 * footScreen.scale }), null, "above the shrunk lamp");
global.$dataDocsDoodads.mapSettings = {};
assert.strictEqual(ws.doodadFlatBox(lamp).rect.h, 144, "2D (and 3D at 1): full size");

console.log("✓ 3D height settings, scaling about the foot, and editor picking at the 3D size verified.");
