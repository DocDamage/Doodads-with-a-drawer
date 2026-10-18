// scratch/test_perspective.js
// The 3D perspective mode: a camera over the map (pitch, yaw, field of view, zoom), projecting ground
// points to the screen and screen clicks back to the ground, upright billboards scaled by distance and
// sorted far to near, character facings and arrow keys turned with the camera, fog, and editor gizmos.
const assert = require('assert');

console.log("=== Testing Perspective Mode ===");

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
global.$gameMap = { mapId: () => 1, displayX: () => 0, displayY: () => 0, tileWidth: () => 48, tileHeight: () => 48 };
global.$dataDocsDoodads = { 1: [] };

require('../Docs-Doodads.js');
const P = DocsDoodads.Perspective;
const near = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;

// 1. Settings: off unless the map turns it on; values clamped.
assert.strictEqual(P.resolve(null, null), null, "off by default");
assert.strictEqual(P.resolve({ enabled: false }, null), null);
const s = P.resolve({ enabled: true }, null);
assert.deepStrictEqual([s.pitch, s.yaw, s.fov, s.zoom, s.viewTiles], [55, 0, 50, 1, 40]);
const odd = P.normalize({ enabled: true, pitch: 200, fov: 1, zoom: 99, viewTiles: 3, yaw: 450, fogStart: 30, fogEnd: 10 });
assert.deepStrictEqual([odd.pitch, odd.fov, odd.zoom, odd.viewTiles, odd.yaw], [89, 20, 4, 12, 90], "clamped, yaw wrapped");
assert.ok(odd.fogEnd > odd.fogStart, "fog end is kept beyond fog start");
// Mid-game camera changes (plugin command) override the map's camera; "enabled" can be overridden too.
const over = P.resolve({ enabled: true, pitch: 50 }, { yaw: 90, zoom: 2 });
assert.deepStrictEqual([over.pitch, over.yaw, over.zoom], [50, 90, 2]);
assert.strictEqual(P.resolve({ enabled: true }, { enabled: false }), null, "turned off mid-game");
assert.ok(P.resolve({ enabled: false }, { enabled: true }), "turned on mid-game");

// 2. Camera and projection. Screen 800x600; the target is at the screen centre at the zoom's scale.
const cam = P.camera({ target: { x: 1000, y: 1000 }, pitch: 60, yaw: 0, fov: 50, zoom: 1, width: 800, height: 600 });
const t = P.project(cam, 1000, 1000, 0);
assert.ok(near(t.x, 400) && near(t.y, 300), "target in the middle");
assert.ok(near(t.scale, 1), "target at zoom scale");
assert.ok(near(P.project(P.camera({ target: { x: 0, y: 0 }, pitch: 60, yaw: 0, fov: 50, zoom: 2, width: 800, height: 600 }), 0, 0, 0).scale, 2));
// North (smaller y) is further away: higher on screen and smaller.
const far = P.project(cam, 1000, 800, 0), close = P.project(cam, 1000, 1100, 0);
assert.ok(far.y < t.y && far.scale < t.scale && far.depth > t.depth);
assert.ok(close.y > t.y && close.scale > t.scale);
// East is to the right when looking north.
assert.ok(P.project(cam, 1100, 1000, 0).x > 400);
// Looking east (yaw 90): north is to the left, east is further away.
const east = P.camera({ target: { x: 1000, y: 1000 }, pitch: 60, yaw: 90, fov: 50, zoom: 1, width: 800, height: 600 });
assert.ok(P.project(east, 1000, 900, 0).x < 400, "north is left");
assert.ok(P.project(east, 1100, 1000, 0).depth > P.project(east, 1000, 1000, 0).depth, "east is further");
// Behind the camera: nothing.
assert.strictEqual(P.project(cam, 1000, 3000, 0), null);
// Top-down at pitch 89 looks almost flat: equal spacing either side.
const top = P.camera({ target: { x: 0, y: 0 }, pitch: 89, yaw: 0, fov: 50, zoom: 1, width: 800, height: 600 });
const up = P.project(top, 0, -48, 0), down = P.project(top, 0, 48, 0);
assert.ok(Math.abs((300 - up.y) - (down.y - 300)) < 2, "nearly orthographic from above");
// Screen back to ground.
for (const [x, y] of [[1000, 1000], [1040, 900], [960, 1080], [1200, 700]]) {
    const p = P.project(cam, x, y, 0);
    const g = P.unproject(cam, p.x, p.y);
    assert.ok(near(g.x, x, 1e-3) && near(g.y, y, 1e-3), `round trip ${x},${y}`);
}
// The horizon: above it there is no ground.
const horizon = P.horizonY(cam);
assert.ok(horizon > -1e6 && horizon < 300);
assert.strictEqual(P.unproject(cam, 400, horizon - 5), null);
assert.ok(P.unproject(cam, 400, horizon + 5));
// Height: a point 48px up projects above its foot by 48 x its scale (billboards stand upright).
const foot = P.project(cam, 1000, 1000, 0), head = P.billboardTop(cam, 1000, 1000, 48);
assert.ok(near(head.y, foot.y - 48 * foot.scale) && near(head.x, foot.x));

// 3. Billboards: a transform from flat map space to the screen around the foot point.
const m = P.billboardMatrix(cam, { x: 1000, y: 1000 });
assert.ok(near(m.a, 1) && near(m.d, 1) && near(m.b, 0) && near(m.c, 0));
assert.ok(near(m.a * 1000 + m.tx, 400) && near(m.d * 1000 + m.ty, 300), "the foot lands on its projection");
assert.ok(near(m.a * 1000 + m.tx, 400) && near(m.d * 952 + m.ty, 300 - 48), "48px above the foot is 48px up at scale 1");
assert.strictEqual(P.billboardMatrix(cam, { x: 1000, y: 3000 }), null, "behind the camera");
// Far to near, then z, then sprite id.
const items = [{ id: 'a', depth: 100, z: 3, spriteId: 5 }, { id: 'b', depth: 300, z: 3, spriteId: 1 }, { id: 'c', depth: 100, z: 1, spriteId: 9 },
    { id: 'd', depth: 100, z: 3, spriteId: 2 }];
assert.deepStrictEqual(items.sort(P.compareBillboards).map(i => i.id), ['b', 'c', 'd', 'a']);
// Fog: 0 before it starts, 1 after it ends.
assert.deepStrictEqual([P.fogAt(100, 200, 400), P.fogAt(500, 200, 400)], [0, 1]);
assert.ok(P.fogAt(300, 200, 400) > 0 && P.fogAt(300, 200, 400) < 1);

// 4. Turning the camera turns what you see and what the arrow keys mean.
assert.strictEqual(P.quarter(0), 0);
assert.strictEqual(P.quarter(90), 1);
assert.strictEqual(P.quarter(-90), 3);
assert.strictEqual(P.quarter(181), 2);
// Looking east, a character facing east is seen from behind; one facing south shows its right side.
assert.strictEqual(P.viewDirection(6, 90), 8);
assert.strictEqual(P.viewDirection(2, 90), 6);
assert.strictEqual(P.viewDirection(4, 180), 6);
assert.strictEqual(P.viewDirection(2, 0), 2);
assert.strictEqual(P.viewDirection(3, 90), 9, "diagonals turn too");
// Up means away from the camera.
assert.strictEqual(P.inputDirection(8, 90), 6);
assert.strictEqual(P.inputDirection(4, 90), 8);
assert.strictEqual(P.inputDirection(2, 270), 6);
assert.strictEqual(P.inputDirection(0, 90), 0);
for (const d of [1, 2, 3, 4, 6, 7, 8, 9]) for (const yaw of [0, 90, 180, 270]) {
    assert.strictEqual(P.viewDirection(P.inputDirection(d, yaw), yaw), d, "walking away shows the back");
}

// 5. Camera changes ease in.
const tween = P.startTween({ pitch: 50, yaw: 0, zoom: 1, fov: 50 }, { yaw: 90 }, 10);
let cur;
for (let i = 0; i < 5; i++) cur = P.stepTween(tween);
assert.ok(cur.yaw > 0 && cur.yaw < 90 && cur.pitch === 50);
for (let i = 0; i < 5; i++) cur = P.stepTween(tween);
assert.strictEqual(cur.yaw, 90);
assert.strictEqual(tween.done, true);
// Turning takes the short way round.
const wrapTween = P.startTween({ pitch: 50, yaw: 350, zoom: 1, fov: 50 }, { yaw: 10 }, 2);
P.stepTween(wrapTween);
assert.ok(near(P.stepTween(wrapTween).yaw % 360, 10));
assert.ok(near(P.startTween({ yaw: 350 }, { yaw: 10 }, 2).to.yaw, 370));

// 6. Editor: a billboard's on-screen rectangle (for clicking) and its 3D box (for the selection gizmo).
const rect = P.screenRect(cam, { x: 976, y: 904, w: 48, h: 96 }, { x: 1000, y: 1000 });
assert.ok(near(rect.x, 376) && near(rect.y, 204) && near(rect.w, 48) && near(rect.h, 96));
assert.strictEqual(P.screenRect(cam, { x: 976, y: 2904, w: 48, h: 96 }, { x: 1000, y: 3000 }), null);
const box = P.gizmoBox(cam, { x: 976, y: 904, w: 48, h: 96 }, { x: 1000, y: 1000 });
assert.strictEqual(box.length, 12, "twelve edges");
assert.ok(box.every(e => e.length === 2 && e.every(p => Number.isFinite(p.x) && Number.isFinite(p.y))));

console.log("✓ Settings, camera, projection and unprojection, horizon, billboards and sorting, fog, turning, easing and gizmos verified.");
