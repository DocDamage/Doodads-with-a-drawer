// scratch/test_3d_quality.js
// 3D quality: the player's Effects Quality option (High, Medium, Low, Off) also scales the 3D view down
// for slower machines: a shorter view distance (with the fog pulled in), less weather, no wakes on Low,
// and coarser hills. The editor always shows the map as it was set.
const assert = require('assert');

console.log("=== Testing 3D Quality Presets ===");

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
global.$dataDocsDoodads = { 1: [], mapSettings: {} };
global.ConfigManager = { makeData: () => ({}), applyData() {} };

require('../Docs-Doodads.js');
const P = DocsDoodads.Perspective;
const T = DocsDoodads.Terrain;
const near = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;

// 1. High (0) leaves the 3D view exactly as it was set.
const s = P.normalize({ enabled: true, viewTiles: 40, fogStart: 12, fogEnd: 19, weatherDensity: 1, waterWakes: true });
assert.strictEqual(P.withQuality(s, 0), s);
assert.strictEqual(P.withQuality(null, 2), null, "a flat map stays flat");
assert.strictEqual(P.withQuality(s, 'junk'), s, "an unreadable option counts as High");

// 2. Medium: a shorter view with the fog pulled in by the same amount, less weather, wakes kept.
const medium = P.withQuality(s, 1);
assert.strictEqual(medium.viewTiles, 32);
assert.ok(near(medium.fogStart, 12 * 0.8) && near(medium.fogEnd, 19 * 0.8), "the fog closes in with the view");
assert.ok(medium.fogEnd < medium.viewTiles / 2, "the ground's edge stays inside the fog");
assert.ok(near(medium.weatherDensity, 0.6));
assert.strictEqual(medium.waterWakes, true);
assert.strictEqual(medium.terrainSteps, 2);
assert.strictEqual(s.viewTiles, 40, "the map's own settings are untouched");

// 3. Low: shorter still, no wakes, a third of the weather, one quad per hill tile. Off counts as Low.
const low = P.withQuality(s, 2);
assert.deepStrictEqual([low.viewTiles, low.waterWakes, low.terrainSteps], [24, false, 1]);
assert.ok(near(low.weatherDensity, 0.35) && near(low.fogEnd, 19 * 24 / 40));
assert.deepStrictEqual(P.withQuality(s, 3), low);
// A map already set to a short view distance keeps it, and its fog.
const short = P.withQuality(P.normalize({ enabled: true, viewTiles: 20, fogStart: 6, fogEnd: 9 }), 2);
assert.deepStrictEqual([short.viewTiles, short.fogStart, short.fogEnd], [20, 6, 9]);
// Weather drops scale with the density.
const W = DocsDoodads.Weather3D;
assert.ok(W.params('rain', 9, low.weatherDensity).count < W.params('rain', 9, s.weatherDensity).count / 2);

// 4. In play, the 3D view follows the player's option; the editor shows the map as it was set.
$dataDocsDoodads.mapSettings[1] = { perspective: { enabled: true, viewTiles: 40 } };
ConfigManager.docsFxQuality = 0;
assert.strictEqual(P.active().viewTiles, 40);
ConfigManager.docsFxQuality = 2;
assert.strictEqual(P.active().viewTiles, 24);
assert.strictEqual(P.active().waterWakes, false);
DocsDoodads.Workspace.mounted = true;
assert.strictEqual(P.active().viewTiles, 40, "editing: as set");
DocsDoodads.Workspace.mounted = false;
ConfigManager.docsFxQuality = 0;

// 5. Effects Quality is offered in Options when any map uses the 3D view, even without post-processing.
assert.strictEqual(DocsDoodads.PostFX.offeredInOptions(), false);
assert.strictEqual(DocsDoodads.Perspective.usedInProject(), true);
assert.strictEqual(DocsDoodads.fxQualityOffered(), true);
const base = DocsDoodads.extraOptionCount();
$dataDocsDoodads.mapSettings[1] = { perspective: { enabled: false } };
assert.strictEqual(DocsDoodads.fxQualityOffered(), false);
assert.strictEqual(DocsDoodads.extraOptionCount(), base - 1, "the Options window makes room for it");

// 6. Hills: lower quality splits tiles near raised ground into fewer pieces, but they still rise.
const GW = 5, GH = 4, heights = new Float64Array(GW * GH);
heights[1 * GW + 1] = 2;
const grid = { heights, width: GW, height: GH };
const tris = m => m.triangles.length / 3;
const full = T.buildMesh(grid, 0, 0, GW, GH, 48, 48, 'smooth');
const half = T.buildMesh(grid, 0, 0, GW, GH, 48, 48, 'smooth', null, 2);
const one = T.buildMesh(grid, 0, 0, GW, GH, 48, 48, 'smooth', null, 1);
const nearTiles = 3 * 3, farTiles = GW * GH - nearTiles;
assert.strictEqual(tris(full), nearTiles * 4 * 4 * 2 + farTiles * 2, "High: 4 x 4 as before");
assert.strictEqual(tris(half), nearTiles * 2 * 2 * 2 + farTiles * 2);
assert.strictEqual(tris(one), (nearTiles + farTiles) * 2, "Low: one quad per tile");
const corner = one.vertices.find(v => near(v.x, 96) && near(v.y, 96));
assert.ok(corner && corner.h > 0 && near(corner.h, T.heightAt(grid, 2, 2, 'smooth')), "corners still follow the hills");
assert.ok(one.vertices.every(v => v.shade > 0 && v.shade <= 1));
assert.deepStrictEqual(T.buildMesh(grid, 0, 0, GW, GH, 48, 48, 'smooth', null, 9).triangles, full.triangles, "never finer than the field");
assert.deepStrictEqual(T.buildMesh(grid, 0, 0, 3, 3, 48, 48, 'stepped', null, 1).triangles,
    T.buildMesh(grid, 0, 0, 3, 3, 48, 48, 'stepped').triangles, "stepped ground is unchanged");

// Battle backgrounds from the 3D map: off unless asked for; a low camera looking the map camera's way.
{
    assert.strictEqual(P.normalize({}).battleBack, false);
    assert.strictEqual(P.normalize({ battleBack: true }).battleBack, true);
    assert.deepStrictEqual(P.battleCamera({ pitch: 55, yaw: 90, zoom: 1 }), { pitch: 22, yaw: 90, zoom: 1.2 });
    assert.deepStrictEqual(P.battleCamera({ pitch: 15, yaw: 0, zoom: 2 }), { pitch: 15, yaw: 0, zoom: 2 }, 'already low and close');
}

console.log("✓ 3D quality presets (view distance and fog, weather, wakes, hill detail), the editor exception and the Options entry verified.");
