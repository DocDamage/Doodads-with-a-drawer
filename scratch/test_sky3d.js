// scratch/test_sky3d.js
// Day and night in the 3D view: sky colours through the day, the sun and moon crossing the sky on the
// same path the shadows use, stars at night, and the light direction for hills and water.
const assert = require('assert');

console.log("=== Testing 3D Sky ===");

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
const S = DocsDoodads.Sky3D;
const near = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;
const hour = h => h * 60;

// 1. A setting with the 3D view, on by default.
assert.strictEqual(P.normalize({}).dayNight, true);
assert.strictEqual(P.normalize({ dayNight: false }).dayNight, false);

// 2. The sun: up from 6 to 18, highest at noon, in the east at dawn, south at noon, west at dusk;
// its direction matches the shadows (they fall away from it).
assert.ok(S.at(hour(12)).sun.elevation > S.at(hour(9)).sun.elevation);
assert.ok(S.at(hour(9)).sun.elevation > 0 && S.at(hour(3)).sun.elevation < 0);
assert.ok(near(S.at(hour(6)).sun.azimuth, 90, 1e-6) && near(S.at(hour(12)).sun.azimuth, 180, 1e-6) && near(S.at(hour(17.999)).sun.azimuth, 270, 0.1));
for (const h of [7, 10, 15]) {
    const shadow = DocsDoodads.Sun.at(hour(h)).angle;
    assert.ok(near((shadow + 180) % 360, S.at(hour(h)).sun.azimuth, 1e-6), 'shadows fall away from the sun at ' + h);
}
// The moon at night, on the same kind of path.
assert.ok(S.at(hour(0)).moon.elevation > 0 && S.at(hour(12)).moon.elevation < 0);

// 3. Light: from the sun by day (warmer low down), from the moon at night (dim and blue).
const noon = S.at(hour(12)).light, dusk = S.at(hour(17.5)).light, night = S.at(hour(0)).light;
assert.ok(near(Math.hypot(...noon.dir), 1) && near(Math.hypot(...night.dir), 1), "unit vectors");
assert.ok(noon.dir[2] > dusk.dir[2], "higher at noon");
assert.ok(noon.dir[1] > 0, "the noon sun is in the south (+y)");
assert.ok(noon.intensity > night.intensity && night.intensity > 0);
assert.ok(((dusk.color >> 16) & 255) - (dusk.color & 255) > ((noon.color >> 16) & 255) - (noon.color & 255), "warmer at dusk");
assert.ok((night.color & 255) > ((night.color >> 16) & 255), "moonlight is blue");

// 4. Sky colours and stars.
const lum = c => ((c >> 16) & 255) + ((c >> 8) & 255) + (c & 255);
const sNoon = S.at(hour(12)), sDusk = S.at(hour(18)), sNight = S.at(hour(0));
assert.ok(lum(sNoon.top) > lum(sNight.top) * 3, "bright by day, dark at night");
assert.ok(((sDusk.horizon >> 16) & 255) > (sDusk.horizon & 255), "a warm horizon at sunset");
assert.ok((sNoon.top & 255) > ((sNoon.top >> 16) & 255), "a blue day sky");
assert.strictEqual(sNoon.stars, 0);
assert.strictEqual(sNight.stars, 1);
assert.ok(S.at(hour(19)).stars > 0 && S.at(hour(19)).stars < 1, "stars come out at dusk");
// Smooth through the day: no jumps between neighbouring minutes.
for (let m = 0; m < 1440; m += 7) {
    const a = S.at(m), b = S.at(m + 1);
    assert.ok(Math.abs(lum(a.top) - lum(b.top)) < 12 && Math.abs(a.stars - b.stars) < 0.05, 'smooth at ' + m);
}

// 5. Where something in the sky shows on screen: in front of the camera, above the horizon.
const cam = P.camera({ target: { x: 1000, y: 1000 }, pitch: 30, yaw: 180, fov: 50, zoom: 1, width: 800, height: 600 });
const sunAhead = S.skyPoint(cam, 180, 20);
assert.ok(sunAhead && near(sunAhead.x, 400, 1) && sunAhead.y < P.horizonY(cam), "south, ahead of a camera looking south");
assert.strictEqual(S.skyPoint(cam, 0, 20), null, "behind the camera");
assert.ok(S.skyPoint(cam, 200, 20).x > sunAhead.x, "further clockwise is to the right");

// 6. The quantized light key changes only when the light really moves (the terrain mesh rebuilds then).
assert.strictEqual(S.lightKey([0.1, 0.2, 0.97]), S.lightKey([0.101, 0.2, 0.97]));
assert.notStrictEqual(S.lightKey([0.1, 0.2, 0.97]), S.lightKey([0.3, 0.2, 0.93]));

// Cloud shadows and low fog: off by default, kept in range, and the clouds drift with time.
{
    const Pv = DocsDoodads.Perspective;
    const d = Pv.normalize({});
    assert.deepStrictEqual([d.clouds, d.mist, d.cloudScale, d.cloudSpeed, d.mistHeight], [0, 0, 6, 1, 1]);
    const v = Pv.normalize({ clouds: 5, mist: -1, cloudScale: 0, cloudSpeed: 99, mistHeight: 0 });
    assert.deepStrictEqual([v.clouds, v.mist, v.cloudScale, v.cloudSpeed, v.mistHeight], [1, 0, 2, 5, 0.25]);
    assert.deepStrictEqual(Pv.cloudDrift(0, 1), { x: 0, y: 0 });
    const a = Pv.cloudDrift(10, 1), b = Pv.cloudDrift(20, 1);
    assert.ok(b.x > a.x && b.y > a.y, 'drifts on');
    assert.ok(Math.abs(Pv.cloudDrift(10, 2).x - 2 * a.x) < 1e-12, 'faster with speed');
    assert.deepStrictEqual(Pv.cloudDrift(10, 0), { x: 0, y: 0 }, 'still at speed 0');
}

console.log("✓ Day/night setting, sun and moon paths matching shadows, light colour and direction, sky colours, stars, sky positions and light keys verified.");
