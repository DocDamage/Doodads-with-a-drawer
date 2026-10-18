// scratch/test_terrain.js
// Terrain height for the 3D view: heights from world-tileset mountains and forests, terrain tags,
// regions and a painted height brush; smooth or stepped ground; heights under any point (so feet sit
// on the ground); walking blocked by steep steps; and clicks on raised ground.
const assert = require('assert');

console.log("=== Testing Terrain Height ===");

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
const T = DocsDoodads.Terrain;
const P = DocsDoodads.Perspective;
const near = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;

// A 6x4 map. Layer 0 ground; layer 1 overlays; layer 5 regions.
const W = 6, H = 4;
const A2 = kind => 2048 + kind * 48 + 46;
const data = new Array(W * H * 6).fill(0);
const at = (z, x, y, id) => { data[(z * H + y) * W + x] = id; };
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) at(0, x, y, A2(16));   // grass
at(1, 1, 1, A2(22));                     // mountain (impassable A2)
at(1, 2, 1, A2(20));                     // forest (passable, airship can't land)
at(0, 4, 2, 1600);                       // a tile with terrain tag 3
at(5, 5, 3, 7);                          // region 7
const flags = [];
flags[A2(16)] = 0x600;
flags[A2(22)] = 0xe0f;
flags[A2(20)] = 0xe00;
flags[1600] = 3 << 12;
const map = { width: W, height: H, data };
const world = { mode: 0, flags };

// 1. Settings.
const s = T.normalize({});
assert.deepStrictEqual([s.enabled, s.style, s.auto, s.mountain, s.forest, s.block, s.climb], [false, 'smooth', true, 1, 0.25, false, 0.5]);
assert.strictEqual(T.normalize({ style: 'odd' }).style, 'smooth');
assert.strictEqual(T.normalize({ mountain: 99 }).mountain, 20, "clamped");

// 2. Automatic heights on world tilesets.
assert.strictEqual(T.autoKind(A2(22), flags, 0), 'mountain');
assert.strictEqual(T.autoKind(A2(20), flags, 0), 'forest');
assert.strictEqual(T.autoKind(A2(16), flags, 0), null);
assert.strictEqual(T.autoKind(A2(22), flags, 1), null, "only world tilesets");
assert.strictEqual(T.autoKind(2048 + 3 * 48, [], 0), null, "water is never raised");
let h = T.buildHeights(map, world, T.normalize({ enabled: true }));
assert.strictEqual(h[1 * W + 1], 1);
assert.strictEqual(h[1 * W + 2], 0.25);
assert.strictEqual(h[0], 0);
assert.strictEqual(T.buildHeights(map, world, T.normalize({ enabled: true, auto: false }))[1 * W + 1], 0);

// 3. Tags, regions and paint, in rising priority.
const custom = T.normalize({ enabled: true, tags: [{ tag: 3, height: 1 }], regions: [{ region: 7, height: 2 }, { region: 9, height: 4 }],
    paint: { '1,1': 0.5, '0,3': -0.5 } });
h = T.buildHeights(map, world, custom);
assert.strictEqual(h[2 * W + 4], 1, "terrain tag 3");
assert.strictEqual(h[3 * W + 5], 2, "region 7");
assert.strictEqual(h[1 * W + 1], 0.5, "painted beats the mountain");
assert.strictEqual(h[3 * W + 0], -0.5, "dips too");
assert.strictEqual(T.signature(map, world, custom), T.signature(map, world, T.normalize(JSON.parse(JSON.stringify(custom)))));
assert.notStrictEqual(T.signature(map, world, custom), T.signature(map, world, T.normalize({ enabled: true })));

// 4. Height under a point (tile units). Stepped: the tile's height. Smooth: a blurred field, so a lone
// mountain is a rounded mound, ranges stay full height inside, and edges have low foothills.
const flatHeights = new Float32Array(W * H);
flatHeights[1 * W + 1] = 2;
const grid = { heights: flatHeights, width: W, height: H };
assert.strictEqual(T.heightAt(grid, 1.5, 1.5, 'stepped'), 2);
assert.strictEqual(T.heightAt(grid, 1.01, 1.99, 'stepped'), 2);
assert.strictEqual(T.heightAt(grid, 0.5, 0.5, 'stepped'), 0);
const peak = T.heightAt(grid, 1.5, 1.5, 'smooth');
assert.ok(peak > 1 && peak < 2, "a lone mountain is a rounded mound, lower than a full range");
assert.ok(T.heightAt(grid, 1.25, 1.5, 'smooth') < peak && T.heightAt(grid, 1.25, 1.5, 'smooth') > 0, "slopes down from the middle");
assert.ok(near(T.heightAt(grid, 1.3, 1.5, 'smooth'), T.heightAt(grid, 1.7, 1.5, 'smooth')), "symmetrical");
assert.ok(T.heightAt(grid, 0.6, 1.5, 'smooth') < 0.2, "low foothills just beside it");
assert.ok(near(T.heightAt(grid, 3.5, 1.5, 'smooth'), 0, 1e-6), "flat a tile away");
const range = new Float64Array(W * H);
for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) range[y * W + x] = 2;
const rangeGrid = { heights: range, width: W, height: H };
assert.ok(near(T.heightAt(rangeGrid, 1.5, 1.5, 'smooth'), 2, 0.02), "full height inside a range");
assert.ok(near(T.heightAt(rangeGrid, 2, 2, 'smooth'), 2, 0.02), "no dips between peaks");
// Gentle: nowhere steeper than a reasonable slope, so the art isn't stretched into spikes.
let steepest = 0;
for (let x = 0; x < 5; x += 0.05) steepest = Math.max(steepest, Math.abs(T.heightAt(grid, x + 0.05, 1.5, 'smooth') - T.heightAt(grid, x, 1.5, 'smooth')) / 0.05);
assert.ok(steepest < 4, 'steepest slope ' + steepest.toFixed(2));
// Outside the map: 0 (or wrapped on looping maps).
assert.strictEqual(T.heightAt(grid, -3, 1, 'stepped'), 0);
assert.strictEqual(T.heightAt(Object.assign({}, grid, { loopX: true }), 1.5 + W, 1.5, 'stepped'), 2);
assert.ok(T.heightAt(Object.assign({}, grid, { loopX: true }), 1.5 + W, 1.5, 'smooth') > 1);

// Characters stand on the highest ground under their base, so a bump beside the feet doesn't swallow them.
assert.ok(T.footHeight(grid, 2.3, 1.5, 0.5, 'smooth') >= T.heightAt(grid, 2.3, 1.48, 'smooth'), "a wide base reaches the slope beside it");
assert.strictEqual(T.footHeight(grid, 2.1, 1.5, 0.5, 'stepped'), 0, "stepped: stays on its own tile beside a block");
assert.strictEqual(T.footHeight(grid, 1.5, 2, 0.5, 'stepped'), 2, "a base on its tile's bottom edge belongs to that tile");
// Doodads stand only on level ground: a plateau top or open ground is level; a mountain isn't.
assert.strictEqual(T.groundUnder(grid, 4.5, 3, 0.5, 'smooth').level, true, "open ground");
assert.strictEqual(T.groundUnder(grid, 1.5, 1.9, 0.5, 'smooth').level, false, "on the mountain");
assert.strictEqual(T.groundUnder(rangeGrid, 1.5, 1.5, 0.4, 'smooth').level, true, "the level middle of raised ground you made is fine");
const autoGrid = { heights: T.buildHeights(map, world, T.normalize({ enabled: true, mountain: 2 })), width: W, height: H };
assert.strictEqual(autoGrid.heights.mountains[1 * W + 1], 1, "marked as a mountain");
assert.strictEqual(T.groundUnder(autoGrid, 1.5, 2, 0.3, 'smooth').mountain, true);
assert.strictEqual(T.groundUnder(autoGrid, 1.5, 2, 0.3, 'stepped').level, false, "never on a mountain, even a flat-topped one");
const plateau = new Float64Array(W * H); plateau[1 * W + 1] = 2; plateau[1 * W + 2] = 2;
const plateauGrid = { heights: plateau, width: W, height: H };
assert.strictEqual(T.groundUnder(plateauGrid, 1.5, 2, 0.3, 'stepped').level, true, "on top of a stepped plateau");
assert.strictEqual(T.groundUnder(plateauGrid, 1.1, 2, 0.4, 'stepped').level, false, "straddling a cliff edge");
const forest = new Float64Array(W * H); forest[1 * W + 1] = 0.25;
assert.strictEqual(T.groundUnder({ heights: forest, width: W, height: H }, 1.5, 2, 0.5, 'smooth').level, true, "forest bumps are fine");

// 5. The mesh: smooth tiles near raised ground are split 4 x 4; flat tiles are one quad. Stepped tiles
// are flat tops with walls.
const smooth = T.buildMesh(grid, 0, 0, 5, 4, 48, 48, 'smooth');
const nearTiles = 3 * 3, farTiles = 5 * 4 - nearTiles;
assert.strictEqual(smooth.triangles.length / 3, nearTiles * 4 * 4 * 2 + farTiles * 2);
const top = smooth.vertices.find(v => near(v.x, 72) && near(v.y, 72));
assert.ok(top && near(top.h, peak), "vertices follow the field");
const stepped = T.buildMesh(grid, 0, 0, 3, 3, 48, 48, 'stepped');
const walls = stepped.triangles.length / 3 - 3 * 3 * 2;
assert.strictEqual(walls, 4 * 2, "a raised tile has four walls of two triangles");
assert.ok(stepped.vertices.every(v => Number.isFinite(v.u) && Number.isFinite(v.v) && v.shade > 0 && v.shade <= 1));
// The shading follows the light it is given (the sun moving through the day).
const east = T.buildMesh(grid, 0, 0, 5, 4, 48, 48, 'smooth', [0.8, 0, 0.6]), west = T.buildMesh(grid, 0, 0, 5, 4, 48, 48, 'smooth', [-0.8, 0, 0.6]);
const shadeAtX = (m, x) => m.vertices.find(v => near(v.x, x) && near(v.y, 72)).shade;
assert.ok(shadeAtX(east, 84) > shadeAtX(west, 84) && shadeAtX(west, 60) > shadeAtX(east, 60), "the east slope is lit by an eastern sun");
// Slopes facing away from the light are darker than flat ground.
const shades = smooth.vertices.map(v => v.shade);
assert.ok(Math.min(...shades) < Math.max(...shades));

// 6. Walking: steps steeper than the climb limit block when blocking is on.
assert.strictEqual(T.canStep(0, 0.4, 0.5), true);
assert.strictEqual(T.canStep(0, 1.5, 0.5), false);
assert.strictEqual(T.canStep(1.5, 0, 0.5), false, "can't jump down a cliff either");

// 7. Things stand on the terrain, and clicks find raised ground.
const cam = P.camera({ target: { x: 120, y: 120 }, pitch: 40, yaw: 0, fov: 50, zoom: 1, width: 800, height: 600 });
const g = P.groundPoint(cam, 72, 72, 96);
assert.ok(near(g.z, 96), "raised by the height on flat worlds");
const ball = P.camera({ target: { x: 120, y: 120 }, pitch: 40, yaw: 0, fov: 50, zoom: 1, width: 800, height: 600, curve: 'sphere', radius: 1000 });
const gb = P.groundPoint(ball, 300, 120, 96), g0 = P.groundPoint(ball, 300, 120, 0);
assert.ok(near(Math.hypot(gb.x - g0.x, gb.y - g0.y, gb.z - g0.z), 96, 1e-6), "along the surface normal on round worlds");
const heightPx = (x, y) => T.heightAt(grid, x / 48, y / 48, 'smooth') * 48;
for (const c of [cam, ball]) {
    // Points on slopes facing the camera (a ray aimed exactly at a pyramid's tip only grazes it).
    for (const [x, y] of [[72, 84], [60, 82], [130, 100], [200, 40]]) {
        const p3 = P.groundPoint(c, x, y, heightPx(x, y));
        const sp = P.project(c, p3.x, p3.y, p3.z);
        const back = P.unprojectTerrain(c, sp.x, sp.y, heightPx);
        assert.ok(back && near(back.x, x, 0.5) && near(back.y, y, 0.5), `click on raised ground ${c.curve} ${x},${y}: ${back && back.x.toFixed(2)},${back && back.y.toFixed(2)}`);
    }
}

// 8. The height brush: raise and lower with falloff, flatten toward a height, set, and erase.
const brushGrid = { heights: new Float64Array(W * H), width: W, height: H };
brushGrid.heights[1 * W + 1] = 1.5;
let paint = T.applyBrush({}, brushGrid, 2, 2, { mode: 'raise', amount: 1, radius: 1 });
assert.strictEqual(paint['2,2'], 1, "full strength in the middle");
assert.strictEqual(paint['3,2'], 0.5, "half at the edge of a radius-1 brush");
assert.strictEqual(paint['1,1'], undefined, "corners are outside a round brush");
paint = T.applyBrush(paint, brushGrid, 2, 2, { mode: 'raise', amount: 1, radius: 0 });
assert.strictEqual(paint['2,2'], 2, "dabs add up");
paint = T.applyBrush(paint, brushGrid, 1, 1, { mode: 'lower', amount: 1, radius: 0 });
assert.strictEqual(paint['1,1'], 0.5, "starts from the automatic height");
paint = T.applyBrush(paint, brushGrid, 2, 2, { mode: 'flatten', amount: 1, radius: 0, target: 0.5 });
assert.strictEqual(paint['2,2'], 0.5);
paint = T.applyBrush(paint, brushGrid, 0, 0, { mode: 'set', value: 3, radius: 0 });
assert.strictEqual(paint['0,0'], 3);
paint = T.applyBrush(paint, brushGrid, 0, 0, { mode: 'erase', radius: 0 });
assert.strictEqual(paint['0,0'], undefined);
assert.strictEqual(T.applyBrush({}, brushGrid, -5, -5, { mode: 'raise', amount: 1, radius: 1 })['-5,-5'], undefined, "off the map");
assert.ok('5,1' in T.applyBrush({}, Object.assign({}, brushGrid, { loopX: true }), 0, 1, { mode: 'raise', amount: 1, radius: 1 }), "wraps on looping maps");

// Height-aware movement: with steep steps blocking, ledges can be jumped down and small steps hopped up.
{
    const Tt = DocsDoodads.Terrain;
    const base = Tt.normalize({ block: true, climb: 0.5 });
    assert.deepStrictEqual([base.drop, base.hop], [false, 0], 'off by default');
    assert.strictEqual(Tt.stepKind(0, 0.25, base), 'walk');
    assert.strictEqual(Tt.stepKind(2, 0, base), 'blocked');
    const both = Tt.normalize({ block: true, climb: 0.5, drop: true, hop: 1 });
    assert.strictEqual(Tt.stepKind(2, 0, both), 'drop', 'off a ledge');
    assert.strictEqual(Tt.stepKind(0, 1, both), 'hop', 'up a one-tile step');
    assert.strictEqual(Tt.stepKind(0, 2, both), 'blocked', 'too high to hop');
    assert.strictEqual(Tt.stepKind(0, 0.5, both), 'walk', 'small steps are still walked');
    assert.strictEqual(Tt.normalize({ hop: 99 }).hop, 20);
}

console.log("✓ Settings, automatic/tag/region/painted heights, height under points, smooth and stepped meshes, shading, level ground for doodads, steps, raised feet, clicks and the height brush verified.");
