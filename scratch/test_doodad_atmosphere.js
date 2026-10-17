// scratch/test_doodad_atmosphere.js
// Doodads that react to the world: see-through when the player walks behind them, animated
// appear/disappear, seasonal art swaps, water reflections, and shadows that follow the sun.
const assert = require('assert');

console.log("=== Testing Doodad Atmosphere ===");

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
const near = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;
const doodad = (props) => Object.assign(DocsDoodads.standardStruct(), props);

// 1. See-through: tall standing doodads fade when the player is hidden behind them.
const ST = DocsDoodads.SeeThrough;
const world = { enabled: true };
const tree = doodad({ x: 240, y: 288, frameW: 96, frameH: 144, depth: 'sorted' });
assert.strictEqual(ST.appliesTo(tree, world, 48), true, "tall sorted doodads qualify automatically");
assert.strictEqual(ST.appliesTo(doodad({ frameH: 40, depth: 'sorted' }), world, 48), false, "short props don't");
assert.strictEqual(ST.appliesTo(doodad({ frameH: 200, depth: 'below' }), world, 48), false, "floor decals never hide anyone");
assert.strictEqual(ST.appliesTo(doodad({ frameH: 40, depth: 'sorted', seeThrough: 'on' }), world, 48), true);
assert.strictEqual(ST.appliesTo(Object.assign({}, tree, { seeThrough: 'off' }), world, 48), false);
assert.strictEqual(ST.appliesTo(tree, { enabled: false }, 48), false);

const treeRect = { x: 192, y: 144, w: 96, h: 144 };
const behindRect = { x: 220, y: 200, w: 48, h: 48 };
assert.strictEqual(ST.occludes(treeRect, 288, 'sorted', behindRect, 248), true, "behind the trunk line and overlapping: hidden");
assert.strictEqual(ST.occludes(treeRect, 288, 'sorted', { x: 220, y: 260, w: 48, h: 48 }, 308), false, "in front of the tree: not hidden");
assert.strictEqual(ST.occludes(treeRect, 288, 'sorted', { x: 500, y: 200, w: 48, h: 48 }, 248), false, "beside the tree: not hidden");
assert.strictEqual(ST.occludes(treeRect, 288, 'above', { x: 220, y: 260, w: 48, h: 48 }, 308), true, "overhangs hide the player wherever they overlap");
assert.strictEqual(ST.occludes(treeRect, 288, 'sorted', { x: 280, y: 200, w: 48, h: 48 }, 248), false, "a sliver of overlap at the edge doesn't count");
assert.ok(near(ST.step(1, 0.4, 0.1), 0.9));
assert.ok(near(ST.step(0.45, 0.4, 0.1), 0.4), "the fade lands exactly on its target");

// 2. Appear/disappear transitions for switch-controlled doodads.
const T = DocsDoodads.Transition;
assert.deepStrictEqual(T.sample('none', 0.3), { alphaMul: 0, scaleMul: 1, offsetY: 0, dissolve: 0 }, "no transition is instant");
assert.deepStrictEqual(T.sample('none', 1), { alphaMul: 1, scaleMul: 1, offsetY: 0, dissolve: 0 });
assert.ok(near(T.sample('fade', 0.5).alphaMul, 0.5));
assert.ok(near(T.sample('pop', 1).scaleMul, 1) && T.sample('pop', 0.6).scaleMul > 1, "pop overshoots then settles");
assert.ok(near(T.sample('pop', 0).scaleMul, 0));
assert.strictEqual(T.sample('rise', 0).offsetY, 16);
assert.strictEqual(T.sample('rise', 1).offsetY, 0);
assert.ok(near(T.sample('dissolve', 0.25).dissolve, 0.75) && T.sample('dissolve', 0.25).alphaMul === 1);
assert.ok(T.sample('crumble', 0.5).offsetY > 0 && T.sample('crumble', 0.5).dissolve > 0, "crumbling pieces fall as they vanish");
assert.ok(near(T.advance(0, true, 30), 1 / 30));
assert.strictEqual(T.advance(1, true, 30), 1);
assert.ok(near(T.advance(1, false, 4), 0.75));
assert.strictEqual(T.advance(0.5, false, 0), 0, "zero frames snaps");
assert.strictEqual(T.advance(0.2, true, 0), 1);

// 3. Seasons: one table swaps art across the whole game; doodads can be limited to seasons.
const Seasons = DocsDoodads.Seasons;
const sets = [
    { 0: 'img/doodads/oak_spring.png', 1: 'img/doodads/oak.png', 2: 'img/doodads/oak_autumn.png', 3: 'img/doodads/oak_snow.png' },
    { 1: 'img/doodads/flowers.png', 3: 'img/doodads/dead_grass.png' }
];
assert.strictEqual(Seasons.resolve('img/doodads/oak.png', 2, sets), 'img/doodads/oak_autumn.png');
assert.strictEqual(Seasons.resolve('img/doodads/oak_snow.png', 0, sets), 'img/doodads/oak_spring.png', "any cell in the row is a member");
assert.strictEqual(Seasons.resolve('img/doodads/flowers.png', 0, sets), 'img/doodads/flowers.png', "an empty cell keeps the original");
assert.strictEqual(Seasons.resolve('img/doodads/flowers.png', 3, sets), 'img/doodads/dead_grass.png');
assert.strictEqual(Seasons.resolve('img\\doodads\\oak.png', 2, sets), 'img/doodads/oak_autumn.png', "slashes don't matter");
assert.strictEqual(Seasons.resolve('img/doodads/rock.png', 2, sets), 'img/doodads/rock.png');
assert.strictEqual(Seasons.resolve('img/doodads/oak.png', -1, sets), 'img/doodads/oak.png', "seasons off");
assert.strictEqual(Seasons.visibleIn(doodad({ seasons: [0, 1] }), 2), false);
assert.strictEqual(Seasons.visibleIn(doodad({ seasons: [0, 1] }), 1), true);
assert.strictEqual(Seasons.visibleIn(doodad({}), 2), true);
assert.strictEqual(Seasons.visibleIn(doodad({ seasons: [0] }), -1), true);
const vars = { 12: 6 };
assert.strictEqual(Seasons.current({ source: 'variable', variableId: 12, names: ['a', 'b', 'c', 'd'] }, { variable: id => vars[id] || 0 }), 2, "variables wrap round the year");
assert.strictEqual(Seasons.current({ source: 'system' }, { system: 3 }), 3);
assert.strictEqual(Seasons.current({ source: 'off' }, {}), -1);
// Season-limited doodads count as conditional, so they hide during play.
assert.strictEqual(DocsDoodads.Appearance.isConditional(doodad({ seasons: [0] })), true);
assert.strictEqual(DocsDoodads.Appearance.isVisible(doodad({ seasons: [0] }), { season: 2 }), false);
assert.strictEqual(DocsDoodads.Appearance.isVisible(doodad({ seasons: [0] }), { season: 0 }), true);
// Art only reachable through the season table still counts as used (and is renamed with the rest).
const refs = [];
const seasonData = { world: { seasons: { sets: [{ 2: 'img/doodads/oak_autumn.png' }] } } };
DocsDoodads.Usage.visitSources({ doodads: seasonData }, ref => refs.push(ref));
assert.ok(refs.some(ref => ref.key === DocsDoodads.Usage.keyOf('img/doodads/oak_autumn.png')), "season art is in use");
refs[0].set('img/doodads/fall/oak.png');
assert.strictEqual(seasonData.world.seasons.sets[0][2], 'img/doodads/fall/oak.png');

// 4. Water reflections.
const R = DocsDoodads.Reflection;
const waterTile = id => id >= 2048 && id < 2816;
assert.strictEqual(R.isWaterAt([2048, 0, 0, 0], 0, { regionId: 0 }, waterTile), true);
assert.strictEqual(R.isWaterAt([2048, 0, 300, 0], 0, { regionId: 0 }, waterTile), false, "a bridge over water is not water");
assert.strictEqual(R.isWaterAt([1536, 0, 0, 0], 0, { regionId: 0 }, waterTile), false);
// Coastlines: MZ draws the sea on layer 0 and the sand/grass edge on layer 1 over it. That tile is shore, not water.
assert.strictEqual(R.isWaterAt([2048, 2900, 0, 0], 0, { regionId: 0 }, waterTile), false, "sand drawn over the sea is not water");
assert.strictEqual(R.isWaterAt([2048, 2100, 0, 0], 0, { regionId: 0 }, waterTile), true, "deep water over shallow water is still water");
assert.strictEqual(R.isWaterAt([0, 2100, 0, 0], 0, { regionId: 0 }, waterTile), true);
assert.strictEqual(R.isWaterAt([1536, 0, 0, 0], 5, { regionId: 5 }, waterTile), true, "a chosen region counts as water (custom ponds)");
// The mask stops short of dry neighbours: MZ water autotiles draw their sand/grass border inside the
// water tile, so reflections must start at the visible waterline, not at the tile edge.
const wet = new Set(['1,1', '2,1', '3,1', '1,2', '2,2', '3,2']);
const rects = R.maskRects(5, 4, (c, r) => wet.has(c + ',' + r), 48, 48, 12);
assert.deepStrictEqual(rects, [
    { x: 48 + 12, y: 48 + 12, w: 144 - 24, h: 48 - 12 },
    { x: 48 + 12, y: 96, w: 144 - 24, h: 48 - 12 }
], "each row is one rectangle, pulled in from the shore on every dry side");
// A neighbour off the visible area still counts, so a lake running off-screen has no false shore.
const open = R.maskRects(2, 1, () => true, 48, 48, 12);
assert.deepStrictEqual(open, [{ x: 0, y: 0, w: 96, h: 48 }]);
// A run whose top edge is shore in one tile and open water in the next splits there.
const bay = new Set(['0,0', '0,1', '1,1']);
assert.deepStrictEqual(R.maskRects(2, 2, (c, r) => (c >= 0 && c < 2 && r >= 0 && r < 2 ? bay.has(c + ',' + r) : c < 0), 48, 48, 12), [
    { x: 0, y: 12, w: 36, h: 36 },
    { x: 0, y: 48, w: 48, h: 36 },
    { x: 48, y: 60, w: 36, h: 24 }
]);
assert.strictEqual(R.appliesTo(doodad({ depth: 'sorted' }), { enabled: true }), true);
assert.strictEqual(R.appliesTo(doodad({ depth: 'below' }), { enabled: true }), false, "floor decals have nothing to reflect");
assert.strictEqual(R.appliesTo(doodad({ depth: 'sorted', reflect: 'off' }), { enabled: true }), false);
assert.strictEqual(R.appliesTo(doodad({ depth: 'below', reflect: 'on' }), { enabled: true }), true);
assert.strictEqual(R.appliesTo(doodad({ depth: 'sorted' }), { enabled: false }), false);
assert.strictEqual(R.mapEnabled({ enabled: true }, null), true);
assert.strictEqual(R.mapEnabled({ enabled: true }, { reflections: false }), false);
assert.strictEqual(R.mapEnabled({ enabled: false }, { reflections: true }), false);

// 5. Doodad shadows can follow the sun instead of a fixed lean.
const pine = doodad({ frameH: 96, shadow: { enabled: true, followSun: true, opacity: 0.5, length: 0.5 } });
const sunT = DocsDoodads.Shadow.transform(pine, { angle: 90, lengthMul: 2, strength: 1 });
assert.ok(near(sunT.rotation, Math.PI / 2) && near(sunT.skewX, 0), "following the sun rotates the silhouette");
assert.ok(near(sunT.scaleY, 1));
const fixedT = DocsDoodads.Shadow.transform(doodad({ shadow: { enabled: true, angle: -35 } }), { angle: 90, lengthMul: 2, strength: 1 });
assert.ok(near(fixedT.rotation, 0) && fixedT.skewX < 0, "fixed shadows keep their lean");
assert.ok(near(DocsDoodads.Shadow.transform(pine, null).rotation, 0), "without a sun the fixed lean is used");

// 6. Shaders that read PIXI's inputSize must match the vertex shader's high precision, or WebGL
// refuses to link them ("Precisions of uniform 'inputSize' differ") and the sprite vanishes.
const shaders = {
    shimmer: DocsDoodads.Motion.shimmerFragment,
    motionBlur: DocsDoodads.MotionBlur.fragment,
    dissolve: DocsDoodads.Transition.dissolveFragment
};
for (const [name, source] of Object.entries(shaders)) {
    if (!/inputSize/.test(source)) continue;
    assert.ok(/^\s*(#ifdef GL_FRAGMENT_PRECISION_HIGH\s*\n\s*)?precision highp float;/.test(source), `${name} shader declares high precision`);
}

console.log("✓ See-through, transitions, seasons, reflections, sun-following doodad shadows and shader precision verified.");
