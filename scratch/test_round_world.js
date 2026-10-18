// scratch/test_round_world.js
// Round worlds for the 3D view: a planet (sphere) or a rolling log (cylinder). The ground curves away
// from the camera's target, things beyond the horizon are hidden, billboards lean with the surface,
// and clicks find the right spot on the curve.
const assert = require('assert');

console.log("=== Testing Round World ===");

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

// 1. Settings.
const s = P.normalize({ enabled: true });
assert.deepStrictEqual([s.curve, s.curveRadius, s.lean], ['flat', 60, true]);
const odd = P.normalize({ enabled: true, curve: 'donut', curveRadius: 2, lean: false });
assert.deepStrictEqual([odd.curve, odd.curveRadius, odd.lean], ['flat', 6, false]);
assert.strictEqual(P.normalize({ curve: 'sphere', curveRadius: 0 }).curveRadius, 0, "0 = fit the map's width");
// A planet that fits a looping map: walking all the way round is one lap.
assert.ok(near(P.fitRadius(30, 48), 30 * 48 / (2 * Math.PI)));

const spec = (curve, radius, extra) => Object.assign({ target: { x: 1000, y: 1000 }, pitch: 40, yaw: 0, fov: 50, zoom: 1, width: 800, height: 600, curve, radius }, extra || {});
const flat = P.camera(spec('flat', 0));
const ball = P.camera(spec('sphere', 1200));
const log = P.camera(spec('cylinder', 1200));

// 2. The target touches the ground: it projects to the same place on every shape.
for (const cam of [flat, ball, log]) {
    const g = P.groundPoint(cam, 1000, 1000);
    assert.ok(near(g.z, 0) && g.visible);
    const p = P.project(cam, g.x, g.y, g.z);
    assert.ok(near(p.x, 400) && near(p.y, 300));
}
// Away from the target the ground drops below the flat plane.
const gFar = P.groundPoint(ball, 1000, 400);
assert.ok(gFar.z < -10, "the planet curves down");
assert.ok(near(Math.hypot(gFar.x - 1000, gFar.y - 1000, gFar.z + 1200), 1200, 1e-6), "on the sphere");
assert.ok(P.groundPoint(ball, 1600, 1000).z < -10, "sideways too");
assert.ok(near(P.groundPoint(log, 1600, 1000).z, 0), "a rolling log doesn't curve sideways");
assert.ok(P.groundPoint(log, 1000, 400).z < -10, "but does ahead");
assert.strictEqual(P.groundPoint(flat, 1000, 400).z, 0);
// Arc length is kept: a point 600px away along the ground is 600px of arc away.
const arc = Math.acos((gFar.z + 1200) / 1200) * 1200;
assert.ok(near(arc, 600, 1e-6));
// Far ahead, the curve drops things lower on screen than a flat ground would.
const pf = P.billboardMatrix(flat, { x: 1000, y: 700 }), pb = P.billboardMatrix(ball, { x: 1000, y: 700 });
assert.ok(pb.ty + pb.d * 700 > pf.ty + pf.d * 700, "the curve lowers distant things on screen");

// 3. Beyond the horizon things are hidden (the back of the planet).
assert.strictEqual(P.billboardMatrix(ball, { x: 1000, y: 1000 - 1200 * 2.5 }), null, "past the horizon");
assert.strictEqual(P.groundPoint(ball, 1000, 1000 - 1200 * 4).visible, false, "more than halfway round");

// 4. Leaning: things to the right lean right, to the left lean left; none on a flat world.
const right = P.billboardMatrix(ball, { x: 1500, y: 1000 }), left = P.billboardMatrix(ball, { x: 500, y: 1000 });
assert.ok(right.b > 0 && left.b < 0, "lean outwards");
assert.ok(near(P.billboardMatrix(flat, { x: 1500, y: 1000 }).b, 0));
assert.ok(near(P.billboardMatrix(Object.assign({}, ball, { lean: false }), { x: 1500, y: 1000 }).b, 0), "lean can be off");
// The foot still lands on its projection when leaning.
const g = P.groundPoint(ball, 1500, 1000), p = P.project(ball, g.x, g.y, g.z);
assert.ok(near(right.a * 1500 + right.c * 1000 + right.tx, p.x, 1e-6) && near(right.b * 1500 + right.d * 1000 + right.ty, p.y, 1e-6));

// 5. Clicks find the spot on the curve.
for (const cam of [ball, log]) {
    for (const [x, y] of [[1000, 1000], [1100, 900], [900, 1050], [1250, 800]]) {
        const gp = P.groundPoint(cam, x, y);
        const sp = P.project(cam, gp.x, gp.y, gp.z);
        const back = P.unproject(cam, sp.x, sp.y);
        assert.ok(back && near(back.x, x, 1e-3) && near(back.y, y, 1e-3), `${cam.curve} round trip ${x},${y}`);
    }
}
// Above the planet's edge there's only sky.
assert.strictEqual(P.unproject(ball, 400, -400), null);

// 6. Editor boxes and click rectangles still work on the curve.
assert.strictEqual(P.gizmoBox(ball, { x: 976, y: 904, w: 48, h: 96 }, { x: 1000, y: 1000 }).length, 12);
const r = P.screenRect(ball, { x: 1476, y: 904, w: 48, h: 96 }, { x: 1500, y: 1000 });
assert.ok(r && r.w > 0 && r.h > 0, "a leaning sprite's bounding box");

console.log("✓ Curve settings, map-fitted radius, sphere and cylinder ground, horizon hiding, leaning, clicks and editor boxes verified.");
