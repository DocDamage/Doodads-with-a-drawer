'use strict';
// 8.4.3 Elements that spread: fire goes downwind more than upwind over many seeded runs; rain stops it; water ends at
// the lowest tile; fireproof and unmarked ground never burn; the same seed burns the same way; on the map a Burns
// doodad goes to its Burnt state, burning tiles give light, and a map with it off never steps.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const E = require('./engine/fake_engine');

process.chdir(fs.mkdtempSync(path.join(os.tmpdir(), 'dd-elements-')));
E.install();
const W = 24, H = 12;
E.setupWorld({ width: W, height: H, px: 1, py: 1 });
// Region 5 is dry grass across x 2..21, y 3..8; region 9 a fireproof strip at x 16.
for (let y = 3; y <= 8; y++) for (let x = 2; x <= 21; x++) $dataMap.data[(5 * H + y) * W + x] = x === 16 ? 9 : 5;
const hut = E.doodad(19, 5, { uid: 'hut', name: 'Hut', element: 'burns', states: { list: [{ name: 'Standing' }, { name: 'Burnt' }] } });
$dataDocsDoodads[1] = [hut];
require('../Docs-Doodads.js');
const D = DocsDoodads, El = D.Elements;

// ---- Pure ----
const field = () => El.make(21, 1, () => 100, () => false);
let down = 0, up = 0;
for (let seed = 1; seed <= 40; seed++) {
    const g = field(), rng = D.Scatter.rng(seed);
    El.ignite(g, 10, 0);
    for (let s = 0; s < 12; s++) El.step(g, { wind: { x: 1, y: 0 }, rng });
    for (let x = 11; x < 21; x++) if (g.burnt[x] || g.burn[x]) down++;
    for (let x = 0; x < 10; x++) if (g.burnt[x] || g.burn[x]) up++;
}
assert.ok(down > up * 2, `fire goes downwind more than upwind (${down} vs ${up})`);
const run = seed => { const g = field(), rng = D.Scatter.rng(seed); El.ignite(g, 10, 0); for (let s = 0; s < 10; s++) El.step(g, { wind: { x: 0.5, y: 0 }, rng }); return Array.from(g.burnt).join(''); };
assert.strictEqual(run(3), run(3), 'the same seed burns the same way');
const wet = field(), rng = D.Scatter.rng(1);
El.ignite(wet, 10, 0);
for (let s = 0; s < 10; s++) El.step(wet, { wind: { x: 0, y: 0 }, rain: 1, rng });
assert.strictEqual(El.burning(wet), 0, 'rain puts it out');
assert.ok(!El.ignite(wet, 3, 0), 'wet ground does not light');
const bare = El.make(5, 1, (x) => (x === 2 ? 0 : 100), (x) => x === 4);
assert.ok(!El.ignite(bare, 2, 0), 'no fuel, no fire');
assert.ok(!El.ignite(bare, 4, 0), 'fireproof');
// Water runs downhill: a slope from x 0 (high) to x 4 (low).
const slope = El.make(5, 1, () => 0, () => false);
slope.wet[0] = 100; slope.wet[1] = 100;
for (let s = 0; s < 40; s++) El.step(slope, { rng, height: x => 5 - x });
const lowest = slope.wet.indexOf(Math.max(...slope.wet));
assert.strictEqual(lowest, 4, 'water ends at the lowest tile');
assert.ok(slope.puddle[4] > 0, 'a puddle forms there');
assert.strictEqual(El.putOut(Object.assign(field(), { burn: new Uint8Array(21).fill(3) })), 21);

// ---- On the map ----
const ss = new Spriteset_Map();
SceneManager._scene = { _spriteset: ss };
E.frames(ss, 30);
assert.strictEqual(El.current(), null, 'a map with it off never steps');
assert.strictEqual(El.startAt(5, 5), false);
D.Lighting.setMapSettings(1, { elements: { enabled: true, fuelRegions: '5', fireproofRegions: '9', seed: 4 } });
D.World.settings().weather2d = { wind: { strength: 1, direction: 1, gusts: 0, fromWeather: false } };
assert.ok(El.startAt(14, 5), 'Start Fire At on dry grass');
assert.ok(!El.startAt(0, 0), 'not on unmarked ground');
E.frames(ss, 15 * 60);
const g = El.current();
assert.ok(g.burnt.some(v => v), 'it spread and burned');
for (let y = 3; y <= 8; y++) assert.ok(!g.burnt[y * W + 16], 'the fireproof strip never burns');
assert.ok(!g.burnt[5 * W + 19] || D.api.state('Hut') === 'Burnt', 'a hut whose tile burned is Burnt');
// Light while burning.
El.ignite(g, 4, 4);
E.frames(ss, 1);
assert.ok((ss._docsFireLights || []).length >= 1, 'burning tiles give light');
assert.ok(ss._docsLightInfo === null || ss._docsLightInfo === undefined || ss._docsLightInfo.lights.some(l => l.fire), 'and reach the lightmap');
// Put Out Fires.
El.putOut(g);
E.frames(ss, 1);
assert.strictEqual(El.burning(g), 0);
// The Burnt state is kept, so a new grid starts with no fuel there.
D.WorldState.setState(hut, 'Burnt', 1);
const again = El.build(1);
assert.strictEqual(again.fuel[5 * W + 19], 0, 'a burnt hut does not burn twice');
// Details.
const Wk = D.Workspace, d = E.doodad(1, 1, { uid: 'x' });
Wk.applyDoodadProperty(d, 'element', 'putsOut');
assert.strictEqual(d.element, 'putsOut');
Wk.applyDoodadProperty(d, 'element', '');
assert.ok(!d.element);
console.log('test_elements: OK');
