// scratch/test_traversal.js
// Getting around: abilities (settings, switches, Set Traversal), jumping (hops, gaps, ledges, gliding off
// high ground, landing rules), swimming, diving, flying (passing over, landing, shadow, 3D), climbing,
// sliding on ice, the keys and plugin commands, and World settings at any depth.
const assert = require('assert');
const E = require('./engine/fake_engine');

console.log("=== Testing Traversal ===");

E.install();
const WATER = 2048, FENCE = 40, CLIFF = 3000;
const tiles = [];
for (let y = 0; y < 15; y++) { tiles.push([8, y, 0, WATER], [9, y, 0, WATER], [12, y, 2, FENCE]); }
for (let y = 3; y <= 7; y++) { tiles.push([16, y, 0, CLIFF], [16, y, 5, 5]); }
for (let x = 2; x <= 6; x++) tiles.push([x, 12, 5, 7]);
E.setupWorld({ width: 20, height: 15, px: 5, py: 5, tiles, flags: { [WATER]: 0x0f, [FENCE]: 0x0f, [CLIFF]: 0x0f } });
require('../Docs-Doodads.js');
const X = DocsDoodads.Traversal, W = DocsDoodads.World;
const p = $gamePlayer;
const world = patch => { $dataDocsDoodads.world = W.merge(JSON.parse(JSON.stringify($dataDocsDoodads.world || {})), { traversal: patch }); };
const at = (x, y, d) => { p.locate(x, y); p._jumpCount = 0; p.setDirection(d || 6); };
$gameSwitches.setValue = function(id, v) { this._data[id] = v; };

// 1. Abilities: off until turned on; a switch can be needed; Set Traversal overrides for this game.
assert.strictEqual(X.can('jump'), false);
world({ jump: { enabled: true } });
assert.strictEqual(X.can('jump'), true);
world({ jump: { switchId: 9 } });
assert.strictEqual(X.can('jump'), false, 'needs switch 9');
$gameSwitches.setValue(9, true);
assert.strictEqual(X.can('jump'), true);
X.setAbility('jump', false);
assert.strictEqual(X.can('jump'), false, 'Set Traversal off');
X.setAbility('jump', null);
assert.strictEqual(X.can('jump'), true, 'back to the settings');
X.setAbility('swim', true);
assert.strictEqual(X.can('swim'), true, 'Set Traversal on (the hero learnt to swim)');
X.setAbility('swim', null);
assert.strictEqual(W.settings().traversal.jump.distance, 2, 'other jump settings keep their defaults');

// 2. World settings at any depth.
W.set('traversal.fly.altitude', 60);
assert.strictEqual(W.get('traversal.fly.altitude'), 60);
assert.strictEqual(W.get('traversal.fly.speed'), 1, "the rest of fly's defaults stay");
assert.strictEqual(W.raw('traversal.fly.altitude'), 60);
W.set('traversal.fly.altitude', undefined);
assert.strictEqual(W.raw('traversal.fly'), undefined, 'removing the last field removes the group');

// 3. Jumping: a hop forward; over a gap (the water, two tiles); a fence; never onto an event; on the
// spot when there is nowhere to land.
at(5, 5);
assert.deepStrictEqual(X.plan(p), { dx: 1, dy: 0, glide: false }, 'a hop');
at(7, 5);
assert.deepStrictEqual(X.plan(p), { dx: 0, dy: 0, glide: false }, 'water two wide needs a jump of three: on the spot at distance 2');
world({ jump: { distance: 3 } });
assert.deepStrictEqual(X.plan(p), { dx: 3, dy: 0, glide: false }, 'over the water');
world({ jump: { distance: 2 } });
at(11, 5);
assert.deepStrictEqual(X.plan(p), { dx: 2, dy: 0, glide: false }, 'over the fence');
const ev = new Game_Event(1, 1);
ev.locate(13, 5);
ev._priorityType = 1;
$gameMap._events[1] = ev;
p.isCollidedWithCharacters = function(x, y) { return $gameMap.eventsXy(x, y).some(e => e.isNormalPriority()); };
assert.deepStrictEqual(X.plan(p), { dx: 0, dy: 0, glide: false }, 'not onto someone: on the spot');
$gameMap._events = [];
at(19, 5);
assert.deepStrictEqual(X.plan(p), { dx: 0, dy: 0, glide: false }, 'the map edge: on the spot');
at(5, 5);
assert.ok(X.jump() && p.isJumping() && p.x === 6, 'jumps');
assert.strictEqual(X.jump(), false, 'not again mid-air');
X.setAbility('jump', false);
at(5, 5);
assert.strictEqual(X.jump(), false, 'not when off');
X.setAbility('jump', null);
// Terrain: up a small ledge only; off high ground a glide carries further.
DocsDoodads.Lighting.setMapSettings(1, { perspective: { enabled: true }, terrain: { enabled: true, style: 'stepped', auto: false, paint: { '3,10': 2, '4,10': 0, '5,10': 0, '6,10': 0, '7,10': 0 } } });
Graphics.frameCount++;
at(2, 10);
p._jumpCount = 0;
assert.deepStrictEqual(X.plan(p), { dx: 0, dy: 0, glide: false }, 'too high to jump up (2 tiles)');
world({ jump: { up: 2 } });
Graphics.frameCount++;
assert.deepStrictEqual(X.plan(p), { dx: 1, dy: 0, glide: false }, 'up when allowed');
world({ jump: { up: 1 } });
world({ glide: { enabled: true, perHeight: 1.5, max: 4 } });
// From the 2-high tile, with the next three tiles taken (water-like gaps): a glide reaches further.
for (const x of [4, 5]) { $dataMap.data[(2 * 15 + 10) * 20 + x] = FENCE; }
Graphics.frameCount++;
at(3, 10);
const g = X.plan(p);
assert.ok(g.glide && g.dx === 3, 'a glide off high ground: ' + JSON.stringify(g));
world({ glide: { enabled: false } });
Graphics.frameCount++;
assert.deepStrictEqual(X.plan(p), { dx: 0, dy: 0, glide: false }, 'no glide: nowhere to land');
DocsDoodads.Lighting.setMapSettings(1, { perspective: { enabled: false }, terrain: { enabled: false } });
Graphics.frameCount++;

// 4. Swimming: into deep water and out again; in to the waist, slower; not in a no-swim region.
at(7, 5);
assert.strictEqual(p.canPass(7, 5, 6), false, 'water stops you');
world({ swim: { enabled: true } });
assert.strictEqual(p.canPass(7, 5, 6), true, 'until you can swim');
at(8, 5);
assert.ok(X.isSwimming(p), 'swimming in deep water');
p.refreshBushDepth();
assert.strictEqual(p._bushDepth, 20, 'in to the waist');
const walkSpeed = 4;
assert.strictEqual(p.realMoveSpeed(), walkSpeed - 1, 'slower');
assert.strictEqual(p.canPass(9, 5, 6), true, 'out onto land');
assert.strictEqual(p.canPass(8, 5, 4), true, 'or back');
world({ swim: { noRegion: 6 } });
$dataMap.data[(5 * 15 + 6) * 20 + 9] = 6;
assert.strictEqual(p.canPass(8, 6, 6), false, 'not into a no-swim region');
world({ swim: { noRegion: 0 } });

// 5. Diving: in deep water the jump key goes to the map set under this one, and back up from there.
world({ dive: { enabled: true } });
DocsDoodads.Lighting.setMapSettings(1, { diveMap: 2 });
at(8, 5);
p._newMapId = 0;
assert.ok(X.jump() && p._newMapId === 2, 'dives to map 2');
DocsDoodads.Lighting.setMapSettings(1, { surfaceMap: 3 });
at(4, 4);
p._newMapId = 0;
assert.ok(X.jump() && p._newMapId === 3, 'surfaces to map 3');
DocsDoodads.Lighting.setMapSettings(1, { diveMap: 0, surfaceMap: 0 });

// 6. Flying: up over walls, water and people; no events or battles from the air; lands where you can stand.
world({ swim: { enabled: false }, fly: { enabled: true, altitude: 40 } });
at(11, 5);
const ss = new Spriteset_Map();
SceneManager._scene = { _spriteset: ss };
assert.ok(X.takeOff(), 'takes off');
for (let i = 0; i < 25; i++) X.update();
assert.strictEqual(X.altitude(), 40, 'up to its height');
const groundY = $gameMap.adjustY(p._realY) * 48 + 48 - 6;
assert.strictEqual(p.screenY(), groundY - 40, 'drawn up in the air');
assert.strictEqual(p.screenZ(), 5, 'above tree tops and roofs');
p._bushDepth = 12;
p.refreshBushDepth();
assert.strictEqual(p._bushDepth, 0, 'no wading in the air');
assert.strictEqual(p.canPass(11, 5, 6), true, 'over the fence');
assert.strictEqual(p.canPass(7, 5, 6), true, 'over the water');
assert.strictEqual(p.canPass(19, 5, 6), false, 'not off the map');
assert.strictEqual(p.isCollidedWithCharacters(12, 5), false, 'over people');
assert.strictEqual(p.canStartLocalEvents(), false, 'no events from the air');
assert.strictEqual(p.canEncounter(), false, 'no battles');
assert.ok(X.bypassesTerrain(p), 'terrain steps do not apply');
E.frames(ss, 1);
assert.ok(ss._docsFlyShadow && ss._docsFlyShadow.visible && ss._docsFlyShadow._docsGround, 'a shadow on the ground');
at(8, 5);
assert.strictEqual(X.land(), false, 'cannot land in deep water (without swimming)');
at(12, 5);
assert.strictEqual(X.land(), false, 'nor on the fence');
at(13, 5);
assert.ok(X.land(), 'lands on open ground');
for (let i = 0; i < 25; i++) X.update();
assert.strictEqual(X.altitude(), 0);
E.frames(ss, 1);
assert.ok(!ss._docsFlyShadow.visible, 'shadow gone');
// In 3D, the flyer stands on its own tile, drawn higher.
X.takeOff();
for (let i = 0; i < 25; i++) X.update();
const sprite = ss._characterSprites.find(s => s._character === p);
E.frames(ss, 1);
assert.strictEqual(ss.docsPivotOf(sprite).y, sprite.y + 40, '3D: the altitude added back to the foot');
X.land();
for (let i = 0; i < 25; i++) X.update();

// 7. Climbing: cliffs in a climbable region, up, along and over the top; faces up on them.
at(16, 8, 8);
assert.strictEqual(p.canPass(16, 8, 8), false, 'the cliff stops you');
world({ climb: { enabled: true, regions: '5' } });
assert.strictEqual(p.canPass(16, 8, 8), true, 'until it is climbable');
at(16, 5, 8);
assert.ok(p.isOnLadder(), 'on it like a ladder (facing up)');
assert.strictEqual(p.canPass(16, 3, 8), true, 'off the top onto open ground');
assert.strictEqual(p.realMoveSpeed(), 3, 'slower');
assert.ok(X.bypassesTerrain(p), 'terrain steps do not apply while climbing');
assert.strictEqual(p.canPass(16, 5, 6), true, 'off the side onto open ground');

// 8. Ice: step onto it and slide on until stopped; no walking animation meanwhile.
world({ ice: { enabled: true, regions: '7' } });
at(1, 12, 6);
p.moveStraight(6);
assert.strictEqual(p._docsSlideDir, 6, 'on the ice: sliding right');
assert.strictEqual(p.hasWalkAnime(), false);
let guard = 0;
while (p._docsSlideDir && guard++ < 20) { p._realX = p._x; p._realY = p._y; p.moveByInput(); }
assert.strictEqual(p.x, 7, 'slid to the end of the ice: ' + p.x);
p._realX = p._x;
p.moveByInput();
assert.strictEqual(p._docsSlideDir, null, 'off the ice: walking again');
assert.strictEqual(p.hasWalkAnime(), true);

// 9. Keys and commands.
at(5, 5);
p.canMove = () => true;
Input._pressed = { docsJump: true };
X.update();
Input._pressed = {};
assert.ok(p.isJumping(), 'C jumps');
p._jumpCount = 0;
PluginManager.callCommand($gameMap._interpreter, 'Docs-Doodads', 'setTraversal', { ability: 'fly', state: 'off' });
assert.strictEqual(X.can('fly'), false);
PluginManager.callCommand($gameMap._interpreter, 'Docs-Doodads', 'setTraversal', { ability: 'fly', state: 'default' });
at(5, 5);
PluginManager.callCommand($gameMap._interpreter, 'Docs-Doodads', 'traversalAction', { action: 'takeOff' });
assert.ok(p._docsFlying, 'Traversal Action: take off');
PluginManager.callCommand($gameMap._interpreter, 'Docs-Doodads', 'traversalAction', { action: 'land' });
assert.ok(!p._docsFlying, 'and land');

console.log("✓ Traversal: abilities, switches and Set Traversal, deep World settings, jumping (hops, gaps, fences, people, edges, ledges, gliding), swimming, diving and surfacing, flying (over everything, no events or battles, landing rules, shadow, 3D), climbing, ice and the keys and commands.");
