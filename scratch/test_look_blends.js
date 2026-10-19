// scratch/test_look_blends.js
// Looks by time and by region (6.1.18): time windows that ease in and out (across midnight too), region
// looks game-wide and per map (the map's win), maps that leave the time looks out, region fades that snap
// on a new map, Set Look's "map" target including them, and the Screen Looks card's rows.
const assert = require('assert');

console.log('=== Testing Looks by Time and Region ===');

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
    createElement: () => ({ style: {}, innerHTML: '', appendChild() {}, removeChild() {}, querySelectorAll: () => [], addEventListener() {}, getContext: () => ({}) }),
    body: { appendChild() {}, removeChild() {} },
    getElementById: id => el(id)
};
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: opt => opt === 'test' };
global.PluginManager = { parameters: () => ({}) };
let mapId = 1, region = 0;
global.$gameMap = { mapId: () => mapId, displayX: () => 0, displayY: () => 0, tileWidth: () => 48, tileHeight: () => 48, regionId: () => region };
global.$gamePlayer = { x: 3, y: 4 };
global.$dataDocsDoodads = { 1: [] };

require('../Docs-Doodads.js');
const D = DocsDoodads, ws = D.Workspace, Undo = D.Undo, World = D.World, P = D.PostFX, B = P.Blends;
ws.showToast = () => {};
ws.refreshSpriteset = () => {};
const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-6, `${msg}: ${a} vs ${b}`);
// Looks compared with numbers rounded (a blend all the way in is the target, give or take a rounding error).
const round = look => JSON.parse(JSON.stringify(look, (k, v) => (typeof v === 'number' ? Math.round(v * 1e6) / 1e6 : v)));
const sameLook = (a, b, msg) => assert.deepStrictEqual(round(a), round(b), msg);

// 1. Time weights: whole inside, smooth fades, across midnight, no fade.
const dusk = { from: 17 * 60, to: 19 * 60 + 30, fade: 60, preset: 'golden', amount: 1 };
near(B.timeWeight(dusk, 18 * 60), 1, 'inside');
near(B.timeWeight(dusk, 17 * 60), 1, 'at the start');
near(B.timeWeight(dusk, 16 * 60 + 30), 0.5, 'halfway into the fade before');
near(B.timeWeight(dusk, 20 * 60), 0.5, 'halfway out after');
near(B.timeWeight(dusk, 16 * 60 + 15), 0.15625, 'smoothstep, not a straight line');
near(B.timeWeight(dusk, 12 * 60), 0, 'midday');
const night = { from: 22 * 60, to: 4 * 60, fade: 0, preset: 'noir' };
near(B.timeWeight(night, 23 * 60), 1, 'before midnight');
near(B.timeWeight(night, 2 * 60), 1, 'after midnight');
near(B.timeWeight(night, 5 * 60), 0, 'no fade: off straight after');
near(B.timeWeight(night, 4 * 60 + 1), 0, 'the minute after');
assert.deepStrictEqual(B.normalizeTime({ from: -60, to: 1500, fade: 9999, amount: 3, preset: 'nope' }),
    { from: 1380, to: 60, fade: 720, amount: 1, preset: 'golden' }, 'times wrap, fades and strengths are kept in range');
assert.ok(B.normalizeTime({ look: { vignette: { enabled: true } } }).look.vignette.enabled, 'its own look is kept');
console.log('✓ time windows ease in and out, across midnight too');

// 2. Mixing: time looks by the clock, region looks by weight, the map's region looks win.
const world = { postfx: { enabled: true, look: {}, times: [dusk], regions: [{ region: 5, preset: 'underwater', fade: 1 }, { region: 6, preset: 'noir' }] } };
const golden = P.presetLook('golden');
assert.strictEqual(P.resolveLook({ world }), null, 'without the clock nothing mixes in (as before)');
sameLook(P.resolveLook({ world, minutes: 18 * 60 }), golden, 'all the way in at 18:00');
const half = P.resolveLook({ world, minutes: 20 * 60 });
near(half.color.temperature, golden.color.temperature * 0.5, 'half the warmth at 20:00');
assert.strictEqual(P.resolveLook({ world, minutes: 12 * 60 }), null, 'nothing at noon');
const strong = P.resolveLook({ world: { postfx: Object.assign({}, world.postfx, { times: [Object.assign({}, dusk, { amount: 0.5 })] }) }, minutes: 18 * 60 });
near(strong.color.temperature, golden.color.temperature * 0.5, 'strength scales it');
// Over a base look of the map's own.
const crypt = { postfx: { mode: 'custom', look: P.presetLook('cinematic') } };
const mixed = P.resolveLook({ world, mapSettings: crypt, minutes: 20 * 60 });
near(mixed.color.temperature, golden.color.temperature * 0.5, 'warmth over the map look');
assert.ok(mixed.grain.enabled, 'the map look\'s grain is still there');
// Interiors leave time looks out; a map that is off stays off.
assert.strictEqual(P.resolveLook({ world, mapSettings: { lookBlends: { noTimes: true } }, minutes: 18 * 60 }), null);
assert.strictEqual(P.resolveLook({ world, mapSettings: { postfx: { mode: 'off' } }, minutes: 18 * 60, regionWeights: { 5: 1 } }), null);
assert.strictEqual(P.resolveLook({ world: { postfx: Object.assign({}, world.postfx, { enabled: false }) }, minutes: 18 * 60 }), null, 'the master switch wins');
// Regions.
sameLook(P.resolveLook({ world, regionWeights: { 5: 1 } }), P.presetLook('underwater'));
sameLook(P.resolveLook({ world, mapSettings: { lookBlends: { regions: [{ region: 5, preset: 'horror' }] } }, regionWeights: { 5: 1 } }), P.presetLook('horror'), 'the map\'s region 5 wins');
assert.deepStrictEqual(B.regions(world, { lookBlends: { regions: [{ region: 9, preset: 'dreamy' }] } }).map(e => e.region).sort(), [5, 6, 9]);
// A runtime look (Set Look) still wins over everything.
assert.deepStrictEqual(P.resolveLook({ world, runtime: P.presetLook('pixel'), minutes: 18 * 60, regionWeights: { 5: 1 } }), P.presetLook('pixel'));
console.log('✓ mixing: time looks, region looks, map regions win, interiors and off maps');

// 3. Region fades: step toward the player's region, fade out on leaving, snap on a new map.
const fadeWorld = { postfx: { enabled: true, look: {}, times: [], regions: [{ region: 5, preset: 'underwater', fade: 1 }, { region: 6, preset: 'noir', fade: 0 }] } };
B._fade = { mapId: 0, weights: {} };
assert.deepStrictEqual(B.stepRegions(1, 0, fadeWorld, null), {}, 'arriving on a map off the regions');
let w;
for (let i = 0; i < 30; i++) w = B.stepRegions(1, 5, fadeWorld, null);
near(w[5], 0.5, 'half a second into a 1 s fade');
for (let i = 0; i < 40; i++) w = B.stepRegions(1, 5, fadeWorld, null);
near(w[5], 1, 'all the way in');
w = B.stepRegions(1, 6, fadeWorld, null);
near(w[6], 1, 'a region with no fade is in at once');
near(w[5], 1 - 1 / 60, 'the old region fades out');
w = B.stepRegions(2, 5, fadeWorld, null);
assert.deepStrictEqual(w, { 5: 1 }, 'a new map starts at its target');
console.log('✓ region fades: in, out, at once with no fade, snap on a new map');

// 4. Live inputs: the clock (and the clock bar's preview), the player's region, the editor's preview.
World.set('postfx.times', [dusk]);
World.set('postfx.regions', [{ region: 5, preset: 'underwater', fade: 0 }]);
B._fade = { mapId: 0, weights: {} };
region = 5;
ws.mounted = true;
ws.previewMinutes = 18 * 60;
let live = P.liveInputs(true);
assert.strictEqual(live.minutes, 18 * 60, 'the clock bar\'s preview time');
assert.deepStrictEqual(live.regionWeights, { 5: 1 }, 'the player stands on region 5');
region = 0;
assert.deepStrictEqual(P.liveInputs(false).regionWeights, { 5: 1 }, 'not stepped: unchanged');
assert.deepStrictEqual(P.liveInputs(true).regionWeights, {}, 'stepped off');
ws.previewRegionLook = 5;
assert.deepStrictEqual(P.liveInputs(true).regionWeights, { 5: 1 }, 'previewing a region while editing');
ws.previewRegionLook = 0;
// Set Look's "map" target is the map's look with the time looks in it.
global.$gameSystem = {};
const fade = P.setLook('map', 0);
sameLook(fade.to, golden, 'back to the map look means back to the dusk look at 18:00');
ws.previewMinutes = null;
ws.mounted = false;
console.log('✓ live inputs: clock, region, editor preview; Set Look back to the map includes them');

// 5. The card: rows for the game-wide times and regions, this map's regions and its time switch.
World.set('postfx.times', undefined);
World.set('postfx.regions', undefined);
ws.postFxTarget = 'world';
let html = ws.renderPostFxBuilder();
assert.ok(html.includes('Looks by time of day') && html.includes('dd-lb-add-time') && html.includes('dd-lb-add-region'));
ws.showPostFxBuilder();
el('dd-lb-add-time').onclick();
assert.strictEqual(ws.timeLooks().length, 1);
assert.deepStrictEqual(ws.timeLooks()[0], B.normalizeTime(B.timeDefaults));
ws.bindPostFxBuilder();
el('dd-lb-t-0-from').onchange({ target: { value: '18:15' } });
assert.strictEqual(ws.timeLooks()[0].from, 18 * 60 + 15);
el('dd-lb-t-0-from').onchange({ target: { value: '25:99' } });
assert.strictEqual(ws.timeLooks()[0].from, 18 * 60 + 15, 'a time that isn\'t one changes nothing');
el('dd-lb-t-0-look').onchange({ target: { value: 'noir' } });
assert.strictEqual(ws.timeLooks()[0].preset, 'noir');
// "Copy the look above" makes the entry's own look from the game-wide look.
ws.applyPreset('world', 'dreamy');
ws.bindPostFxBuilder();
el('dd-lb-t-0-look').onchange({ target: { value: '__above' } });
assert.deepStrictEqual(ws.timeLooks()[0].look, P.presetLook('dreamy'));
assert.ok(ws.renderPostFxBuilder().includes('Its own look'));
el('dd-lb-t-0-amount').onchange({ target: { value: '0.4' } });
near(ws.timeLooks()[0].amount, 0.4, 'strength');
// Undo steps back through the edits.
Undo.undo();
near(ws.timeLooks()[0].amount, 1, 'undo');
ws.bindPostFxBuilder();
el('dd-lb-t-0-del').onclick();
assert.strictEqual(ws.timeLooks().length, 0);
assert.strictEqual(World.raw('postfx.times'), undefined, 'an empty list is removed');

// Regions, game-wide: added with a free number, previewed, removed.
el('dd-lb-add-region').onclick();
el('dd-lb-add-region').onclick();
assert.deepStrictEqual(ws.regionLooks('world').map(e => e.region), [1, 2]);
ws.bindPostFxBuilder();
el('dd-lb-r-1-region').onchange({ target: { value: '7' } });
assert.deepStrictEqual(ws.regionLooks('world').map(e => e.region), [1, 7]);
ws.bindPostFxBuilder();
el('dd-lb-r-1-preview').onclick();
assert.strictEqual(ws.previewRegionLook, 7);
ws.bindPostFxBuilder();
el('dd-lb-r-1-del').onclick();
assert.strictEqual(ws.previewRegionLook, 0, 'removing the previewed region stops the preview');

// This map: its own regions and the time switch, in the map settings.
ws.postFxTarget = 'map';
html = ws.renderPostFxBuilder();
assert.ok(html.includes('dd-lb-times-on') && !html.includes('dd-lb-add-time'), 'the map has a switch, not its own times');
ws.bindPostFxBuilder();
el('dd-lb-times-on').onchange({ target: { checked: false } });
assert.deepStrictEqual(D.Lighting.mapSettings(1).lookBlends, { noTimes: true });
ws.bindPostFxBuilder();
el('dd-lb-add-region').onclick();
assert.strictEqual(D.Lighting.mapSettings(1).lookBlends.regions.length, 1);
assert.strictEqual(ws.regionLooks('world').length, 1, 'the game-wide regions are untouched');
ws.bindPostFxBuilder();
el('dd-lb-times-on').onchange({ target: { checked: true } });
assert.deepStrictEqual(Object.keys(D.Lighting.mapSettings(1).lookBlends), ['regions'], 'turning time looks back on keeps the regions');
el('dd-pfx-close').onclick();
console.log('✓ the Screen Looks card: times, regions, this map\'s regions and time switch, undo');

console.log('=== Looks by time and region passed ===');
