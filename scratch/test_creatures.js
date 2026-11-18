'use strict';
// 9.3.1 Ambient creatures: the same seed flies the same way; startled at the range and not beyond; back after the
// wait; none outside their hours or weather; Effects Quality scales the count; the pool never passes it; birds
// land on perches; fish keep to water and scatter only from a swimmer or boat; lightning startles everything; the
// editor's fields; and the sample sheets.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const E = require('./engine/fake_engine');

process.chdir(fs.mkdtempSync(path.join(os.tmpdir(), 'dd-creatures-')));
E.install();
E.setupWorld({ width: 30, height: 20, px: 2, py: 2 });
const tree = E.doodad(10, 6, { uid: 'tree', creatures: { kind: 'birds', count: 4 } });
const perch = E.doodad(12, 6, { uid: 'perch', perch: true, frameH: 96 });
const meadow = E.doodad(20, 10, { uid: 'meadow', creatures: { kind: 'butterflies', count: 6, hours: 'day' } });
const pond = E.doodad(5, 15, { uid: 'pond', creatures: { kind: 'fish', count: 3 } });
$dataDocsDoodads[1] = [tree, perch, meadow, pond];
require('../Docs-Doodads.js');
const D = DocsDoodads, C = D.Creatures;

// ---- Pure ----
const s = C.normalize({ kind: 'birds', count: 3 });
assert.strictEqual(C.normalize({ kind: 'dragons' }), null);
assert.strictEqual(C.normalize({ kind: 'birds', count: 999 }).count, C.maxPerDoodad);
assert.strictEqual(C.normalize({ kind: 'birds', sheet: 'img/../x.png' }).sheet, '');
const fly = seed => {
    const rng = D.Scatter.rng(seed), c = C.spawn({ x: 100, y: 100 }, rng), path = [];
    for (let i = 0; i < 60; i++) { C.step(c, 1 / 60, { settings: s, player: { x: 140, y: 100 }, rng, wind: 0, tw: 48 }); path.push([c.x, c.y, c.z, c.mode]); }
    return path;
};
assert.deepStrictEqual(fly(7), fly(7), 'the same seed gives the same flight');
assert.notDeepStrictEqual(fly(7), fly(8));
const rng = D.Scatter.rng(3);
const bird = C.spawn({ x: 100, y: 100 }, rng);
C.step(bird, 1 / 60, { settings: s, player: { x: 100 + 48 * 3 + 5, y: 100 }, rng, tw: 48 });
assert.strictEqual(bird.mode, 'idle', 'not startled beyond the range');
C.step(bird, 1 / 60, { settings: s, player: { x: 100 + 48 * 3 - 5, y: 100 }, rng, tw: 48 });
assert.strictEqual(bird.mode, 'away', 'startled at the range');
assert.ok(bird.vx < 0, 'away from the player');
for (let i = 0; i < 60 * 3; i++) C.step(bird, 1 / 60, { settings: s, player: { x: 1000, y: 1000 }, rng, tw: 48 });
assert.ok(bird.z > 0, 'birds fly up');
for (let i = 0; i < 60 * 4; i++) C.step(bird, 1 / 60, { settings: s, player: { x: 1000, y: 1000 }, rng, tw: 48 });
assert.ok(['back', 'idle'].includes(bird.mode), 'they come back after the wait');
for (let i = 0; i < 60 * 30 && bird.mode !== 'idle'; i++) C.step(bird, 1 / 60, { settings: s, player: { x: 1000, y: 1000 }, rng, tw: 48 });
assert.strictEqual(bird.mode, 'idle', 'and settle home');
const calm = C.spawn({ x: 0, y: 0 }, rng);
C.step(calm, 1 / 60, { settings: s, player: null, rng, startle: true, tw: 48 });
assert.strictEqual(calm.mode, 'away', 'lightning startles them');
assert.ok(!C.active({ kind: 'birds' }, 23, 'none'), 'no birds at night');
assert.ok(C.active({ kind: 'birds' }, 12, 'none'));
assert.ok(C.active({ kind: 'birds', hours: 'night' }, 23, 'none'));
assert.ok(!C.active({ kind: 'butterflies' }, 12, 'rain'), 'none in the rain');
assert.ok(C.active({ kind: 'butterflies', weather: 'any' }, 12, 'storm'));
assert.ok(C.active({ kind: 'fish' }, 12, 'rain'), 'fish do not mind rain');
assert.ok(C.active({ kind: 'birds' }, null, 'none'), 'no clock: always');
assert.deepStrictEqual(['high', 'medium', 'low', 'off'].map(q => C.countFor(6, q)), [6, 3, 0, 0]);
const perched = C.spots({ x: 100, y: 100 }, C.normalize({ kind: 'birds', count: 3 }), [{ x: 120, y: 20, w: 40 }], D.Scatter.rng(1), null, 48);
assert.ok(perched.every(p => p.y === 20), 'birds land on perches');
const wet = C.spots({ x: 0, y: 0 }, C.normalize({ kind: 'fish', count: 3 }), [], D.Scatter.rng(1), () => false, 48);
assert.strictEqual(wet.length, 0, 'no water, no fish');

// ---- On the map ----
const ss = new Spriteset_Map();
SceneManager._scene = { _spriteset: ss };
E.frames(ss, 2);
const flock = d => ss._docsFlocks.get(d);
assert.ok(flock(tree) && flock(tree).list.length === 4, 'a flock of four');
assert.ok(flock(tree).list.every(c => Math.abs(c.hy - (perch.y - 96)) < 1e-9), 'they rest on the perch\'s top');
assert.ok(flock(meadow).sprites.filter(s => s.visible).length === 6);
assert.ok(!flock(pond), 'no water tiles here: no fish');
assert.strictEqual(ss._docsCreatureCount, 10);
// Walking near startles them.
$gamePlayer.locate(11, 4);
E.frames(ss, 2);
assert.ok(flock(tree).list.every(c => c.mode === 'away'), 'the player comes near and they fly');
// Quality halves and Low removes them.
D.qualityOption = () => 1;
E.frames(ss, 1);
assert.strictEqual(flock(meadow).sprites.filter(s => s.visible).length, 3, 'Medium: half');
D.qualityOption = () => 2;
E.frames(ss, 1);
assert.ok(!flock(meadow) && !flock(tree), 'Low: none, and their sprites are freed');
D.qualityOption = () => 0;
// Rain sends butterflies and birds away.
$gameScreen.changeWeather('rain', 5);
E.frames(ss, 1);
assert.ok(!flock(meadow) && !flock(tree));
$gameScreen.changeWeather('none', 0);
E.frames(ss, 1);
assert.ok(flock(meadow));
// The pool never passes its count.
const many = [];
for (let i = 0; i < 10; i++) many.push(E.doodad(1 + i * 2, 18, { uid: 'm' + i, creatures: { kind: 'butterflies', count: 24 } }));
$dataDocsDoodads[1].push(...many);
E.frames(ss, 1);
assert.ok(ss._docsCreatureCount <= C.maxOnMap, 'the map\'s pool is capped');
// Editing hides them.
D.Workspace.mounted = true;
E.frames(ss, 1);
assert.strictEqual(ss._docsFlocks.size, 0, 'none while editing');
D.Workspace.mounted = false;

// ---- Details ----
const W = D.Workspace, d = E.doodad(1, 1, { uid: 'x' });
W.applyDoodadProperty(d, 'creatures.kind', 'fish');
assert.strictEqual(d.creatures.kind, 'fish');
assert.strictEqual(W.getDoodadProperty(d, 'creatures.hours'), 'any', 'a kind brings its own defaults');
W.applyDoodadProperty(d, 'creatures.count', 9);
assert.strictEqual(d.creatures.count, 9);
W.applyDoodadProperty(d, 'creatures.kind', '');
assert.ok(!d.creatures);
W.applyDoodadProperty(d, 'perch', true);
assert.strictEqual(d.perch, true);
W.applyDoodadProperty(d, 'perch', false);
assert.ok(!('perch' in d));

// ---- Sample sheets ----
for (const kind of D.SampleArt.creatureKinds) {
    const art = D.SampleArt.draw(kind);
    assert.ok(art && art.width === 64 && art.height === 24, kind + ' is two frames');
    let opaque = 0;
    for (let i = 3; i < art.rgba.length; i += 4) if (art.rgba[i]) opaque++;
    assert.ok(opaque > 20, kind + ' is drawn');
}
console.log('test_creatures: OK');
