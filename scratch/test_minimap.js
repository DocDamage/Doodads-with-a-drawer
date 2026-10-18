// scratch/test_minimap.js
// Minimap and world map: tiles coloured by what they are, and the globe view for planet-shaped maps.
const assert = require('assert');

console.log("=== Testing Minimap and World Map ===");

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
global.$dataDocsDoodads = {};

require('../Docs-Doodads.js');
const M = DocsDoodads.Minimap;

// 1. Colours: water before anything else, then blocked ground, forest, objects, open ground; raised
// ground is lighter and lowered ground darker.
assert.deepStrictEqual(M.tileColor({ water: true, blocked: true }), M.colors.water);
assert.deepStrictEqual(M.tileColor({ blocked: true }), M.colors.blocked);
assert.deepStrictEqual(M.tileColor({ forest: true }), M.colors.forest);
assert.deepStrictEqual(M.tileColor({ object: true }), M.colors.object);
assert.deepStrictEqual(M.tileColor({}), M.colors.ground);
const high = M.tileColor({ height: 3 }), low = M.tileColor({ height: -2 });
assert.ok(high.every((v, i) => v > M.colors.ground[i]) && low.every((v, i) => v < M.colors.ground[i]));
assert.strictEqual(DocsDoodads.Perspective.normalize({}).minimap, false);

// 2. A pixel per tile.
const W = 8, H = 4;
const map = M.pixels(W, H, (x, y) => ({ water: x < 4, height: 0 }));
assert.strictEqual(map.length, W * H * 4);
assert.deepStrictEqual(Array.from(map.slice(0, 4)), M.colors.water.concat(255));
assert.deepStrictEqual(Array.from(map.slice((1 * W + 6) * 4, (1 * W + 6) * 4 + 4)), M.colors.ground.concat(255));

// 3. The globe faces the given tile: its centre pixel is that tile's colour (fully lit); corners
// outside the disc are clear; turning it brings other tiles round.
const size = 41;
const at = (px, x, y) => Array.from(px.slice((y * size + x) * 4, (y * size + x) * 4 + 4));
const facingWater = M.globePixels(map, W, H, size, 1.5, 2, 0);
const centre = at(facingWater, 20, 20);
assert.ok(Math.abs(centre[2] - M.colors.water[2]) <= 2 && centre[3] === 255, 'water at the centre');
assert.deepStrictEqual(at(facingWater, 0, 0), [0, 0, 0, 0], 'outside the disc');
const facingLand = M.globePixels(map, W, H, size, 1.5, 2, Math.PI);
const c2 = at(facingLand, 20, 20);
assert.ok(Math.abs(c2[1] - M.colors.ground[1]) <= 2, 'half a turn later: land faces the viewer');
// A map half as tall covers only a band of latitudes round the middle; the poles are dark.
const band = M.pixels(W, 2, (x, y) => ({ water: x < 4 }));
const top = at(M.globePixels(band, W, 2, size, 1.5, 1, 0), 20, 1);
assert.ok(top[3] === 255 && top[0] < 20 && top[2] < 40, 'beyond the map rows is dark');

console.log("✓ Minimap colours, map pixels and the globe view verified.");
