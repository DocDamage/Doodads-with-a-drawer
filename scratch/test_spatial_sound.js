// scratch/test_spatial_sound.js
// Spatial sound: distance falloff, stereo pan, per-play variation, which sounds are spatial, event
// tags, ambient emitters on doodads and events, cave echo settings and region background sounds.
const assert = require('assert');

console.log("=== Testing Spatial Sound ===");

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
const S = DocsDoodads.SpatialSound;
const settings = Object.assign({}, S.defaults, { near: 2, far: 12, panWidth: 8 });

// 1. Falloff: full volume close by, silent past "far", smooth in between.
assert.strictEqual(S.gainAt(0, settings), 1);
assert.strictEqual(S.gainAt(2, settings), 1);
assert.strictEqual(S.gainAt(12, settings), 0);
assert.strictEqual(S.gainAt(30, settings), 0);
const mid = S.gainAt(7, settings);
assert.ok(mid > 0 && mid < 1);
assert.ok(S.gainAt(5, settings) > S.gainAt(9, settings), "farther is quieter");

// 2. Pan: left of the player is left, full pan at panWidth tiles, in MZ's -100..100.
assert.strictEqual(S.panFor(0, settings), 0);
assert.strictEqual(S.panFor(-4, settings), -50);
assert.strictEqual(S.panFor(20, settings), 100);

// 3. A sound effect placed in the world.
const se = { name: 'Dog', volume: 90, pitch: 100, pan: 0 };
const placed = S.apply(se, -4, 3, settings);
assert.strictEqual(placed.name, 'Dog');
assert.ok(placed.volume < 90 && placed.volume > 0, "5 tiles away is quieter");
assert.strictEqual(placed.pan, -50, "to the left");
assert.strictEqual(S.apply(se, 0, 20, settings), null, "too far to hear");
assert.deepStrictEqual(S.apply(se, -4, 3, Object.assign({}, settings, { mode: 'off' })), se, "off leaves sounds alone");
assert.strictEqual(se.volume, 90, "the event's own data is never changed");

// 4. Variation keeps repeated sounds from sounding identical, within the set range.
let seed = 1;
const rng = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const varied = [];
for (let i = 0; i < 50; i++) varied.push(S.vary({ name: 'Step', volume: 80, pitch: 100, pan: 0 }, { pitchVariance: 5, volumeVariance: 10 }, rng));
assert.ok(varied.every(v => v.pitch >= 95 && v.pitch <= 105 && v.volume <= 80 && v.volume >= 72));
assert.ok(new Set(varied.map(v => v.pitch)).size > 3, "pitches differ");
assert.deepStrictEqual(S.vary(se, { pitchVariance: 0, volumeVariance: 0 }, rng), se);

// 5. Which sounds are spatial.
assert.strictEqual(S.shouldSpatialize({ mode: 'auto' }, {}, false), true);
assert.strictEqual(S.shouldSpatialize({ mode: 'auto' }, {}, true), false, "the player hears their own sounds centred");
assert.strictEqual(S.shouldSpatialize({ mode: 'auto' }, { spatial: false }, false), false);
assert.strictEqual(S.shouldSpatialize({ mode: 'tagged' }, {}, false), false);
assert.strictEqual(S.shouldSpatialize({ mode: 'tagged' }, { spatial: true }, false), true);
assert.strictEqual(S.shouldSpatialize({ mode: 'off' }, { spatial: true }, false), false);
const Tags = DocsDoodads.CharacterTags;
assert.deepStrictEqual(Tags.parse('<no spatial>'), { spatial: false });
assert.deepStrictEqual(Tags.parse('<spatial>'), { spatial: true });
assert.deepStrictEqual(Tags.parse('<sound: River, 70, 9>'), { sound: { file: 'bgs/River', volume: 70, radius: 9 } });
assert.deepStrictEqual(Tags.parse('<sound: se/Bird1, 60, 10, 5>'), { sound: { file: 'se/Bird1', volume: 60, radius: 10, every: 5 } });

// 6. Ambient emitters: doodad/event sound settings, and which ones play.
assert.deepStrictEqual(S.splitFile('bgs/River'), { folder: 'bgs', name: 'River' });
assert.deepStrictEqual(S.splitFile('Bird1'), { folder: 'bgs', name: 'Bird1' });
assert.strictEqual(S.splitFile(''), null);
const emitter = S.normalizeEmitter({ file: 'bgs/Fire', volume: 200, radius: 6 });
assert.strictEqual(emitter.volume, 100);
assert.strictEqual(emitter.loop, true, "background sounds loop");
assert.strictEqual(S.normalizeEmitter({ file: 'se/Bird1' }).loop, false, "sound effects repeat instead");
assert.strictEqual(S.normalizeEmitter({ file: 'se/Bird1' }).every, S.emitterDefaults.every);
assert.strictEqual(S.normalizeEmitter(null), null);
const plan = S.planEmitters([
    { key: 'fire', emitter: emitter, dx: 1, dy: 0 },
    { key: 'river', emitter: S.normalizeEmitter({ file: 'bgs/River', radius: 4 }), dx: 10, dy: 0 }
], settings);
assert.strictEqual(plan.fire.gain > 0, true);
assert.ok(plan.fire.pan > 0, "to the right");
assert.strictEqual(plan.river.gain, 0, "out of its radius");
const delays = [];
for (let i = 0; i < 20; i++) delays.push(S.nextDelay(4, rng));
assert.ok(delays.every(d => d >= 2 && d <= 6), "repeats wander around the set interval");

// 7. Cave echo.
assert.strictEqual(S.echoFor(null), null);
assert.strictEqual(S.echoFor({ echo: { enabled: false } }), null);
assert.deepStrictEqual(S.echoFor({ echo: { enabled: true, delay: 5, feedback: 2, mix: -1 } }), { delay: 1, feedback: 0.9, mix: 0 }, "clamped to safe values");
assert.deepStrictEqual(S.echoFor({ echo: { enabled: true } }), { delay: S.echoDefaults.delay, feedback: S.echoDefaults.feedback, mix: S.echoDefaults.mix });

// 8. Region background sounds: entering a region plays its sound; leaving restores the map's.
const regions = [{ regionId: 3, name: 'Waterfall', volume: 80, pitch: 100, fade: 1 }, { regionId: 5, name: 'Wind', volume: 60, pitch: 100, fade: 2 }];
assert.strictEqual(S.regionSoundFor(regions, 3).name, 'Waterfall');
assert.strictEqual(S.regionSoundFor(regions, 4), null);
let state = S.regionStart();
let step = S.regionStep(state, regions, 0);
assert.strictEqual(step.action, null, "outside any region nothing happens");
step = S.regionStep(step.state, regions, 3);
assert.strictEqual(step.action.type, 'play');
assert.strictEqual(step.action.entry.name, 'Waterfall');
assert.strictEqual(step.action.save, true, "the map's own sound is remembered first");
step = S.regionStep(step.state, regions, 3);
assert.strictEqual(step.action, null, "staying in the region does nothing");
step = S.regionStep(step.state, regions, 5);
assert.strictEqual(step.action.type, 'play');
assert.strictEqual(step.action.save, false, "switching regions keeps the original saved sound");
step = S.regionStep(step.state, regions, 0);
assert.strictEqual(step.action.type, 'restore');
assert.strictEqual(step.action.fade, 2, "fades out at the region's own speed");

console.log("✓ Falloff, pan, placement, variation, spatial rules, tags, emitters, echo and region sounds verified.");
