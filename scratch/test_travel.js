'use strict';
// 9.2.5 Doodads that ride and travel: the place at a frame for each mode, a rider following a moved event and the
// player, lights going with them, the body's tiles moving, a raft carrying the player over water, Stop/Start and
// a finished `once` kept in the save, the editor putting movers back, and doodads with neither left alone.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const E = require('./engine/fake_engine');

process.chdir(fs.mkdtempSync(path.join(os.tmpdir(), 'dd-travel-')));
E.install();
const WATER = 2048;
const tiles = [];
for (let x = 6; x <= 14; x++) tiles.push([x, 5, 0, WATER]);
E.setupWorld({ width: 20, height: 12, px: 5, py: 5, tiles, flags: { [WATER]: 0x0f } });
const lantern = E.doodad(0, 0, { uid: 'lantern', name: 'Lantern', ride: { on: 1, dx: 0, dy: -20 }, light: { enabled: true, radius: 80 } });
const hat = E.doodad(0, 0, { uid: 'hat', ride: { on: 'player', dx: 0, dy: -40 } });
const cloud = E.doodad(2, 2, { uid: 'cloud', name: 'Cloud', travel: { points: [{ x: 96, y: 0 }], speed: 48, mode: 'loop' } });
const lift = E.doodad(2, 8, { uid: 'lift', name: 'Lift', travel: { points: '0,-96', speed: 96, mode: 'backAndForth' } });
const once = E.doodad(1, 9, { uid: 'once', name: 'Gate', travel: { points: [{ x: 48, y: 0 }], speed: 48, mode: 'once' } });
// A raft at the water's west edge: one tile, carries, travels 4 tiles east.
const raft = E.doodad(6, 5, { uid: 'raft', name: 'Raft', travel: { points: [{ x: 192, y: 0 }], speed: 24, mode: 'once', carries: true, switchId: 10 } });
const still = E.doodad(15, 2, { uid: 'still' });
$dataDocsDoodads[1] = [lantern, hat, cloud, lift, once, raft, still];
require('../Docs-Doodads.js');
const D = DocsDoodads, T = D.Travel;

// ---- Pure ----
const loop = { points: [{ x: 60, y: 0 }], speed: 60, mode: 'loop' };
assert.deepStrictEqual(T.stops(T.normalizeTravel(loop)), [{ x: 0, y: 0 }, { x: 60, y: 0 }, { x: 0, y: 0 }]);
assert.deepStrictEqual(T.legs(T.normalizeTravel(loop)), [60, 60], 'a second a leg at 60 pixels a second');
assert.deepStrictEqual(T.at(loop, 30), { dx: 30, dy: 0, done: false });
assert.deepStrictEqual(T.at(loop, 60), { dx: 60, dy: 0, done: false });
assert.deepStrictEqual(T.at(loop, 90), { dx: 30, dy: 0, done: false }, 'coming back');
assert.deepStrictEqual(T.at(loop, 120), { dx: 0, dy: 0, done: false }, 'round again');
const bf = { points: [{ x: 60, y: 0 }, { x: 60, y: 60 }], speed: 60, mode: 'backAndForth' };
assert.strictEqual(T.length(T.normalizeTravel(bf)), 240);
assert.deepStrictEqual(T.at(bf, 150), { dx: 60, dy: 30, done: false }, 'turned round at the far end');
const one = { points: [{ x: 60, y: 0 }], speed: 60, mode: 'once' };
assert.deepStrictEqual(T.at(one, 30), { dx: 30, dy: 0, done: false });
assert.deepStrictEqual(T.at(one, 999), { dx: 60, dy: 0, done: true }, 'once stops at the end');
const waits = { points: [{ x: 60, y: 0 }], speed: 60, mode: 'once', wait: 30 };
assert.deepStrictEqual(T.at(waits, 20), { dx: 0, dy: 0, done: false }, 'waits at the start');
assert.deepStrictEqual(T.at(waits, 60), { dx: 30, dy: 0, done: false });
const smooth = T.at({ points: [{ x: 100, y: 0 }], speed: 100, mode: 'once', ease: 'smooth' }, 15);
assert.ok(smooth.dx < 25, 'smooth legs start slowly');
assert.strictEqual(T.normalizeTravel({ points: '' }), null, 'no points is no travel');
assert.deepStrictEqual(T.normalizeTravel({ points: '10, 20; 30,40', speed: -3, mode: 'x' }).points, [{ x: 10, y: 20 }, { x: 30, y: 40 }]);
assert.strictEqual(T.normalizeTravel({ points: '1,1', speed: -3 }).speed, 48);
assert.strictEqual(T.normalizeRide({ on: 0 }), null);
assert.deepStrictEqual(T.rideAt({ on: 'player', dx: 2, dy: -4 }, { _realX: 3, _realY: 1, jumpHeight: () => 0 }, 48, 48), { x: 3 * 48 + 24 + 2, y: 96 - 4 });

// ---- On the map ----
const ev = new Game_Event(1, 1);
ev.locate(3, 3);
$gameMap._events = [null, ev];
$gameSwitches.setValue(9, false);
const ss = new Spriteset_Map();
SceneManager._scene = { _spriteset: ss };
E.frames(ss, 1);
assert.deepStrictEqual([lantern.x, lantern.y], [3 * 48 + 24, 4 * 48 - 20], 'the lantern sits on the event');
assert.deepStrictEqual([hat.x, hat.y], [5 * 48 + 24, 6 * 48 - 40], 'the hat sits on the player');
ev.locate(7, 1);
E.frames(ss, 1);
assert.deepStrictEqual([lantern.x, lantern.y], [7 * 48 + 24, 2 * 48 - 20], 'and follows it');
const lit = (ss._docsLightInfo && ss._docsLightInfo.lights || []).find(l => l.doodad === lantern);
if (lit) assert.ok(Math.abs(lit.mapX - lantern.x) < 1, 'the light goes with it');
assert.deepStrictEqual([still.x, still.y], [15 * 48 + 24, 3 * 48], 'others are untouched');
const cloudHome = 2 * 48 + 24;
E.frames(ss, 118);
assert.ok(cloud.x > cloudHome + 80 && cloud.x <= cloudHome + 96, 'the cloud travels east');
const sprite = ss._docsDoodadSprites.find(s => s._data === cloud);
assert.ok(Math.abs(sprite.x - (cloud.x - $gameMap.displayX() * 48)) < 1, 'its sprite is drawn where it is now');

// Stop and Start by name.
const xStopped = cloud.x;
assert.strictEqual(T.setRunning('Cloud', false), 1);
E.frames(ss, 10);
assert.strictEqual(cloud.x, xStopped, 'stopped');
T.setRunning('Cloud', true);
E.frames(ss, 10);
assert.notStrictEqual(cloud.x, xStopped, 'started again');

// A switch holds it.
lift.travel.switchId = 9;
const liftY = lift.y;
E.frames(ss, 10);
assert.strictEqual(lift.y, liftY, 'switch off: it waits');
$gameSwitches.setValue(9, true);
E.frames(ss, 10);
assert.ok(lift.y < liftY, 'switch on: it rises');

// The raft carries the player over the water.
const p = $gamePlayer;
p.locate(5, 5);
assert.ok(!p.canPass(5, 5, 6) || D.Travel._decks.has('6,5'), 'the raft tile is walkable');
p.moveStraight(6);
assert.deepStrictEqual([p.x, p.y], [6, 5], 'onto the raft');
$gameSwitches.setValue(10, true);
p._realX = p._x; p._realY = p._y;
for (let i = 0; i < 600 && !T.finished(raft, 1); i++) { E.frames(ss, 1); p._realX = p._x; p._realY = p._y; }
assert.ok(T.finished(raft, 1), 'the raft arrives');
assert.deepStrictEqual([p.x, p.y], [10, 5], 'and the player is carried four tiles over the water');
assert.ok(!p.canPass(10, 5, 6), 'still water past the raft');
// once: kept in the save.
for (let i = 0; i < 80; i++) E.frames(ss, 1);
assert.ok(T.finished(once, 1));
const saved = JSON.parse(JSON.stringify($gameSystem._docsTravel));
assert.ok(saved.done['1/name:gate'] && saved.done['1/name:raft']);

// The editor puts every mover back where it was placed; a drag there becomes the new place.
D.Workspace.mounted = true;
E.frames(ss, 1);
assert.deepStrictEqual([cloud.x, cloud.y], [cloudHome, 3 * 48], 'back home while editing');
cloud.x += 48;
E.frames(ss, 1);
assert.strictEqual(cloud.x, cloudHome + 48, 'the editor\'s drag stays');
D.Workspace.mounted = false;
E.frames(ss, 1);
assert.ok(cloud.x >= cloudHome + 48, 'travelling again from the new place');

// Details fields round-trip.
const W = D.Workspace, d = E.doodad(1, 1, { uid: 'x' });
W.applyDoodadProperty(d, 'travel.points', '10,0; 10,10');
assert.deepStrictEqual(d.travel.points, [{ x: 10, y: 0 }, { x: 10, y: 10 }]);
assert.strictEqual(W.getDoodadProperty(d, 'travel.points'), '10,0; 10,10');
W.applyDoodadProperty(d, 'travel.mode', 'once');
assert.strictEqual(d.travel.mode, 'once');
W.applyDoodadProperty(d, 'ride.on', 'player');
assert.ok(d.ride && !d.travel, 'riding replaces travelling');
W.applyDoodadProperty(d, 'ride.on', '');
assert.ok(!d.ride, 'Nothing clears it');
W.applyDoodadProperty(d, 'travel.points', '');
assert.ok(!d.travel);
console.log('test_travel: OK');
