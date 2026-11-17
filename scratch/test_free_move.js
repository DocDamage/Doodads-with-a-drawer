'use strict';
// 7.3.3 Movement off the grid: the pure mover (sliding, sub-steps, corners, edges, trails) and the player on the
// stand-in engine (walls, doodad bodies, tiles, events, steps per tile, triggers, followers, destination,
// looping maps, the grid fallbacks and the switch being off).
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const E = require('./engine/fake_engine');

process.chdir(fs.mkdtempSync(path.join(os.tmpdir(), 'dd-free-move-')));
E.install();
E.setupWorld({ width: 20, height: 15, px: 5, py: 5, flags: { 2816: 0, 1536: 0x0f } });
const crate = E.doodad(10, 9, { uid: 'crate', bit: [3, 'img/doodads/Crate.png'], frameW: 48, frameH: 48, collision: { preset: 'full' } });
$dataDocsDoodads[1] = [crate];
$dataDocsDoodads.world = { freeMove: { enabled: true, boxW: 24, boxH: 16 } };
require('../Docs-Doodads.js');
const D = DocsDoodads, F = D.FreeMove;

// ---- Pure rules ----
const diag = F.vector(9);
assert.ok(Math.abs(Math.hypot(diag.x, diag.y) - 1) < 1e-12 && diag.x > 0 && diag.y < 0, 'diagonals are as fast as straight moves');
assert.deepStrictEqual(F.vector(5), { x: 0, y: 0 });
assert.strictEqual(F.facing(3, 2), 2, 'keeps facing a side it already faces');
assert.strictEqual(F.facing(3, 8), 6, 'otherwise faces sideways');
assert.strictEqual(F.facing(8, 2), 8);
const box = F.box(5, 5, 48, 48, 24, 16);
assert.deepStrictEqual(box, { x: 252, y: 272, w: 24, h: 16 }, 'the box is at the feet, centred');
assert.deepStrictEqual(F.realOf(box, 48, 48), { x: 5, y: 5 });
assert.deepStrictEqual(F.tileOf(box, 48, 48), { x: 5, y: 5 });
assert.ok(!F.overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 5, h: 5 }), 'touching is not overlapping');
assert.deepStrictEqual(F.tilesUnder({ x: 40, y: 40, w: 16, h: 16 }, 48, 48).length, 4);

const wallAt = x0 => rect => rect.x + rect.w > x0 && rect.x < x0 + 2;
const open = F.step({ x: 0, y: 0, w: 24, h: 16 }, 10, 0, () => false);
assert.deepStrictEqual([open.x, open.hitX], [10, false]);
const stop = F.step({ x: 0, y: 0, w: 24, h: 16 }, 50, 0, wallAt(40));
assert.ok(stop.hitX && stop.x <= 16 && stop.x > 15.4, `stops at the wall's face (${stop.x})`);
const thin = F.step({ x: 0, y: 0, w: 24, h: 16 }, 200, 0, wallAt(100));
assert.ok(thin.hitX && thin.x < 100, 'a long move does not jump over a thin wall');
const slide = F.step({ x: 0, y: 0, w: 24, h: 16 }, 30, 30, wallAt(30), { slip: 0 });
assert.ok(slide.hitX && !slide.hitY && slide.y === 30 && slide.x <= 6, 'a diagonal into a wall slides along it');
const pillar = rect => rect.x < 60 && rect.x + rect.w > 40 && rect.y < 3 && rect.y + rect.h > -20;
const clipped = F.step({ x: 0, y: 0, w: 24, h: 16 }, 20, 0, pillar);
assert.ok(clipped.y > 0 && clipped.x <= 16, 'a box clipping a corner is nudged round it');
let after = { x: clipped.x, y: clipped.y, w: 24, h: 16 };
for (let i = 0; i < 6; i++) { const r = F.step(after, 6, 0, pillar); after = { x: r.x, y: r.y, w: 24, h: 16 }; }
assert.ok(after.x > 40, 'and then passes the corner');
const inside = F.step({ x: 0, y: 0, w: 24, h: 16 }, 5, 0, () => true);
assert.ok(inside.stuck && inside.x === 5, 'a box that starts inside something is let out');
const passable = (x, y, d) => !(x === 1 && y === 1 && d === 6) && !(x === 0 && y === 0 && d === 2);
assert.ok(F.crossBlocked(passable, { x: 1, y: 1 }, { x: 2, y: 1 }), 'an edge that blocks that way stops the crossing');
assert.ok(!F.crossBlocked(passable, { x: 2, y: 1 }, { x: 1, y: 1 }));
assert.ok(!F.crossBlocked(passable, { x: 0, y: 0 }, { x: 1, y: 1 }), 'a diagonal goes either way round');
assert.ok(F.crossBlocked((x, y, d) => !(d === 6 || d === 2), { x: 0, y: 0 }, { x: 1, y: 1 }), 'and is stopped when both ways are');
const trail = [{ x: 0, y: 0, d: 6 }, { x: 1, y: 0, d: 6 }, { x: 3, y: 0, d: 6 }];
assert.deepStrictEqual(F.alongTrail(trail, 1), { x: 2, y: 0, d: 6 });
assert.deepStrictEqual(F.alongTrail(trail, 2.5), { x: 0.5, y: 0, d: 6 });
assert.deepStrictEqual(F.alongTrail(trail, 99), { x: 0, y: 0, d: 6 });
assert.deepStrictEqual(F.settings({ freeMove: { enabled: 1, boxW: 999 } }), { enabled: false, boxW: 96, boxH: 16 }, 'only true turns it on');

// ---- The player ----
const P = $gamePlayer;
P.locate(5, 5);
let walked = 0, steps = 0, here = [];
$gameParty.onPlayerWalk = () => { walked++; };
P.increaseSteps = () => { steps++; };
P.checkEventTriggerHere = triggers => { here.push(triggers); };
P.updateEncounterCount = () => {};
$gameMap.setupStartingEvent = () => false;
const press = (dir, frames) => { for (let i = 0; i < frames; i++) { Input.dir8 = dir; P.moveByInput(); } Input.dir8 = 0; };
assert.ok(P.docsFreeOn(), 'on by the world setting');
press(6, 1);
assert.ok(Math.abs(P._realX - (5 + 1 / 8)) < 1e-9 && P.x === 5 && P.isMoving(), 'moves by pixels; its tile stays whole');
press(6, 4);
assert.strictEqual(P.x, 6, 'the tile under the box');
assert.deepStrictEqual([walked, steps, here[0]], [1, 1, [1, 2]], 'a new tile is a step: the party walks and floor events are checked');
P.moveByInput();
assert.ok(!P.isMoving(), 'no input, no movement');

// Painted walls stop the box exactly; a diagonal slides along them.
const W = D.Walls, grid = W.blank(80, 60, 12);
for (let cy = 0; cy < 60; cy++) grid.cells[cy][36] = 1;
W.set(1, grid);
P.locate(6, 5);
press(6, 40);
const right = P.docsFreeBox();
assert.ok(right.x + right.w <= 36 * 12 + 1e-6 && right.x + right.w > 36 * 12 - 1, 'the box stops at the painted wall');
const yBefore = P._realY;
press(3, 8);
assert.ok(P._realY > yBefore && P.docsFreeBox().x + 24 <= 36 * 12 + 1e-6, 'and slides down along it');
W.set(1, null);

// A doodad body stops the box (not the whole tile).
P.locate(10, 6);
press(2, 40);
const down = P.docsFreeBox(), body = D.Collision.bodyOf(crate);
assert.ok(!F.overlaps(down, body) && down.y + down.h <= body.y + 1e-6 && down.y + down.h > body.y - 1, 'stops at the crate');

// MZ's impassable tiles are solid.
$dataMap.data[7 * $dataMap.width + 3] = 1536;
P.locate(3, 5);
press(2, 40);
assert.ok(P.docsFreeBox().y + 16 <= 7 * 48 + 1e-6, 'an impassable tile stops the box');
$dataMap.data[7 * $dataMap.width + 3] = 2816;

// Events that stand like characters stop the box; one that starts on touch starts.
const ev = new Game_Event(1, 1);
ev.locate(2, 9); ev._priorityType = 1;
let started = 0;
ev.isTriggerIn = triggers => triggers.includes(1);
ev.start = () => { started++; };
$gameMap._events[1] = ev;
P.locate(5, 9);
press(4, 40);
assert.ok(P.docsFreeBox().x >= F.box(2, 9, 48, 48, 24, 16).x + 24 - 1e-6, 'the event stops the box');
assert.ok(started > 0, 'pushing into a touch event starts it');
ev._through = true;
press(4, 20);
assert.ok(P.docsFreeBox().x < F.box(2, 9, 48, 48, 24, 16).x + 24, 'a through event does not stop the box');
$gameMap._events[1] = null;

// The action button looks in front of the box.
P.locate(8, 8); P.setDirection(6);
assert.deepStrictEqual(P.docsFreeFront(), { x: 9, y: 8 });
P.setDirection(8);
assert.deepStrictEqual(P.docsFreeFront(), { x: 8, y: 7 });

// Followers walk the trail a tile apart, and stand when the player stands.
const f1 = new Game_Follower(1), f2 = new Game_Follower(2);
P._followers._data = [f1, f2];
P.locate(4, 12); P._docsFreeTrailPoints = null;
for (let i = 0; i < 40; i++) { Input.dir8 = 6; P.moveByInput(); P.docsFreeFollowers(); }
Input.dir8 = 0;
assert.ok(Math.abs((P._realX - f1._realX) - 1) < 0.06 && Math.abs((f1._realX - f2._realX) - 1) < 0.06, 'a tile apart along the trail');
assert.ok(f1.isMoving(), 'walking while the player walks');
P.moveByInput(); P.docsFreeFollowers();
assert.ok(!f1.isMoving(), 'standing when the player stands');
P._followers._data = [];

// Touch or mouse destination: the tile path, walked freely.
let dest = { x: 9, y: 12 };
$gameTemp.isDestinationValid = () => Boolean(dest);
$gameTemp.destinationX = () => dest.x; $gameTemp.destinationY = () => dest.y;
$gameTemp.clearDestination = () => { dest = null; };
P.findDirectionTo = (x, y) => (x > P.x ? 6 : x < P.x ? 4 : y > P.y ? 2 : y < P.y ? 8 : 0);
P.locate(6, 12);
for (let i = 0; i < 60 && dest; i++) P.moveByInput();
assert.ok(!dest && P.x === 9 && Math.abs(P._realX - 9) < 0.2, 'walks to the touched tile and stops');

// A looping map wraps the position.
$dataMap.scrollType = 2;
P.locate(19, 3);
press(6, 6);
assert.ok(P.x === 0 && P._realX >= -0.5 && P._realX < 0.5, `across the seam (${P._realX})`);
const seamScreen = P.docsFreeBox();
assert.ok(seamScreen.x < 48, 'the box is drawn at the start of the map, not a map away');
$dataMap.scrollType = 0;

// The grid takes over for vehicles, jumps, forced routes, traversal; and with the switch off.
P.locate(5, 5);
P.isInVehicle = () => true;
assert.ok(!P.docsFreeOn()); P.isInVehicle = () => false;
P._jumpCount = 3; assert.ok(!P.docsFreeOn()); P._jumpCount = 0;
P.isMoveRouteForcing = () => true; assert.ok(!P.docsFreeOn()); P.isMoveRouteForcing = () => false;
P._docsSlideDir = 6; assert.ok(!P.docsFreeOn(), 'sliding on ice is on the grid'); P._docsSlideDir = null;
const T = D.Traversal, isFlying = T.isFlying;
T.isFlying = () => true; assert.ok(!P.docsFreeOn(), 'flying is on the grid'); T.isFlying = isFlying;
D.World.settings().freeMove.enabled = false;
P.locate(5, 5);
press(6, 10);
assert.strictEqual(P._realX, 5, 'off: MZ moves the player as before');
assert.ok(!P.isMoving());

// World → Movement offers the switch.
const section = D.Workspace.worldSections().find(s => s.title === 'Movement');
assert.ok(section && section.fields.some(f => f.key === 'freeMove.enabled'));
console.log('Free movement: vectors, boxes, sliding, sub-steps, corners, edges, trails, walls, bodies, tiles, events, steps, triggers, followers, destination, seam and grid fallbacks passed.');
