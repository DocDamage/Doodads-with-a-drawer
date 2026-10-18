// scratch/test_curvature.js
// Controlling how round a round world is: a curvature value (0 = flat .. 100 = tiny planet), the panel
// slider, Set Camera easing between flat and round, and accurate clicks even when barely curved.
const assert = require('assert');

console.log("=== Testing Round World Curvature ===");

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
global.$gameMap = { mapId: () => 1, displayX: () => 0, displayY: () => 0, tileWidth: () => 48, tileHeight: () => 48, width: () => 30, height: () => 40 };
global.$dataDocsDoodads = { 1: [] };

require('../Docs-Doodads.js');
const P = DocsDoodads.Perspective;
const ws = DocsDoodads.Workspace;
const Undo = DocsDoodads.Undo;
ws.showToast = () => {};
ws.refreshSpriteset = () => {};
ws.currentMapId = () => 1;
const near = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;

// 1. Curvature is the inverse of the radius: 0 is flat, 10 is the default radius of 60 tiles, 100 is 6 tiles.
assert.strictEqual(P.radiusFromCurvature(10), 60);
assert.strictEqual(P.radiusFromCurvature(100), 6);
assert.strictEqual(P.radiusFromCurvature(0), Infinity);
assert.strictEqual(P.curvatureFromRadius(12), 50);
assert.strictEqual(P.curvatureOf(P.normalize({ curve: 'flat' }), 30), 0);
assert.strictEqual(P.curvatureOf(P.normalize({ curve: 'sphere', curveRadius: 60 }), 30), 10);
assert.ok(near(P.curvatureOf(P.normalize({ curve: 'sphere', curveRadius: 0 }), 30), 600 / (30 / (2 * Math.PI))), "fitted planets too");

// 2. Mid-game curvature (Set Camera) overrides the map's radius; 0 flattens; a shape can be given.
assert.deepStrictEqual(['curve', 'curveRadius'].map(k => P.resolve({ enabled: true, curve: 'sphere', curveRadius: 60 }, { curvature: 50 })[k]), ['sphere', 12]);
assert.strictEqual(P.resolve({ enabled: true, curve: 'sphere' }, { curvature: 0 }).curve, 'flat');
assert.strictEqual(P.resolve({ enabled: true }, { curvature: 25 }).curve, 'sphere', "curving a flat map makes a planet");
assert.strictEqual(P.resolve({ enabled: true }, { curvature: 25, curve: 'cylinder' }).curve, 'cylinder');
assert.ok(near(P.resolve({ enabled: true }, { curvature: 0.5 }).curveRadius, 1200), "very slight curves are allowed");

// 3. Easing curvature with the other camera values.
const tween = P.startTween({ pitch: 40, yaw: 0, zoom: 1, fov: 50, curvature: 0 }, { curvature: 60 }, 4);
const steps = [1, 2, 3, 4].map(() => P.stepTween(tween).curvature);
assert.ok(steps[0] > 0 && steps[1] > steps[0] && steps[3] === 60);

// 4. Barely curved worlds stay accurate (no wobble when easing from flat).
for (const radiusTiles of [2000, 600, 60]) {
    for (const curve of ['sphere', 'cylinder']) {
        const cam = P.camera({ target: { x: 1000, y: 1000 }, pitch: 40, yaw: 30, fov: 50, zoom: 1, width: 800, height: 600, curve, radius: radiusTiles * 48 });
        for (const [x, y] of [[1000, 1000], [1240, 760], [700, 1100], [1300, 500]]) {
            const g = P.groundPoint(cam, x, y), p = P.project(cam, g.x, g.y, g.z);
            const back = P.unproject(cam, p.x, p.y);
            assert.ok(back && near(back.x, x, 0.01) && near(back.y, y, 0.01), `${curve} r=${radiusTiles} ${x},${y}: ${back && back.x},${back && back.y}`);
        }
    }
}
// Almost flat matches flat.
const flat = P.camera({ target: { x: 1000, y: 1000 }, pitch: 40, yaw: 0, fov: 50, zoom: 1, width: 800, height: 600 });
const almost = P.camera({ target: { x: 1000, y: 1000 }, pitch: 40, yaw: 0, fov: 50, zoom: 1, width: 800, height: 600, curve: 'sphere', radius: 2000 * 48 });
const a = P.unproject(flat, 300, 400), b = P.unproject(almost, 300, 400);
assert.ok(Math.hypot(a.x - b.x, a.y - b.y) < 2, "a 2000-tile planet looks flat up close");

// 5. The panel slider: 0 = flat, moving it curves a flat map into a planet, and it reads back.
const keys = ws.perspectiveFields().map(f => f.key);
assert.ok(keys.includes('curvature'));
ws.setPerspectiveField('enabled', true);
ws.setPerspectiveField('curvature', 50);
let s = P.active();
assert.deepStrictEqual([s.curve, s.curveRadius], ['sphere', 12]);
assert.strictEqual(ws.perspectiveFieldValue('curvature'), 50);
ws.setPerspectiveField('curve', 'cylinder');
ws.setPerspectiveField('curvature', 20);
assert.deepStrictEqual([P.active().curve, P.active().curveRadius], ['cylinder', 30], "the shape is kept");
ws.setPerspectiveField('curvature', 0);
assert.strictEqual(P.active().curve, 'flat');
assert.strictEqual(ws.perspectiveFieldValue('curvature'), 0);
Undo.undo();
assert.strictEqual(P.active().curve, 'cylinder', "undoable");
ws.setPerspectiveField('curveRadius', 0);
assert.ok(near(ws.perspectiveFieldValue('curvature'), Math.round(600 / (30 / (2 * Math.PI)))), "a fitted planet shows its curvature");

console.log("✓ Curvature and radius, mid-game overrides, easing, accuracy when barely curved, and the panel slider verified.");
