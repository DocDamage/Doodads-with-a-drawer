'use strict';
// 9.2.3 Bridges: levelAfter and canPass for every pair, a walk under and a walk over the same tile, characters on
// different levels passing and not starting each other, the level kept in a save, drawing heights, and the old
// path on a map with no bridge regions.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const E = require('./engine/fake_engine');

process.chdir(fs.mkdtempSync(path.join(os.tmpdir(), 'dd-bridges-')));
E.install();
// MZ's collision and event-start methods the stand-in engine leaves out, as rmmz_objects.js has them.
Game_CharacterBase.prototype.isCollidedWithEvents = function(x, y) { return $gameMap.eventsXyNt(x, y).some(e => e.isNormalPriority()); };
Game_Event.prototype.isCollidedWithEvents = function(x, y) { return $gameMap.eventsXyNt(x, y).length > 0; };
Game_Event.prototype.isCollidedWithPlayerCharacters = function(x, y) { return this.isNormalPriority() && $gamePlayer.pos(x, y); };
Game_Event.prototype.checkEventTriggerTouch = function(x, y) { if ($gamePlayer.pos(x, y)) this.start(); };
Game_Event.prototype.isTriggerIn = function(t) { return t.includes(0); };
Game_Event.prototype.start = function() { this._started = (this._started || 0) + 1; };
Game_Player.prototype.startMapEvent = function(x, y, triggers, normal) { for (const e of $gameMap.eventsXy(x, y)) if (e.isTriggerIn(triggers) && e.isNormalPriority() === normal) e.start(); };

const W = 20, H = 12, WATER = 2048, DECK = 10;
const tiles = [];
// A north-south bridge at x = 10: ends at y 2 and 8, deck y 3..7 over water, with a road under it at y = 5.
for (let y = 3; y <= 7; y++) { if (y !== 5) tiles.push([10, y, 0, WATER]); tiles.push([10, y, 2, DECK]); tiles.push([10, y, 5, 5]); }
tiles.push([10, 2, 5, 6], [10, 8, 5, 6]);
// Water either side of the deck so the top is the only way across.
for (let y = 3; y <= 7; y++) for (const x of [9, 11]) if (y !== 5) tiles.push([x, y, 0, WATER]);
E.setupWorld({ width: W, height: H, px: 10, py: 1, tiles, flags: { [WATER]: 0x0f, [DECK]: 0x10 } });
require('../Docs-Doodads.js');
const D = DocsDoodads, B = D.Bridges;

// ---- Pure ----
for (const level of [0, 1]) {
    assert.strictEqual(B.levelAfter(level, null, 'end'), 1, 'onto an end goes up');
    assert.strictEqual(B.levelAfter(level, 'deck', 'end'), 1);
    assert.strictEqual(B.levelAfter(level, 'end', null), 0, 'off an end comes down');
    assert.strictEqual(B.levelAfter(level, null, null), 0);
    assert.strictEqual(B.levelAfter(level, 'deck', 'deck'), level, 'along the deck keeps the level');
    assert.strictEqual(B.levelAfter(level, 'end', 'deck'), level);
}
assert.strictEqual(B.levelAfter(0, null, 'deck'), 0, 'from the ground straight onto a deck tile stays below');
assert.strictEqual(B.canPass(1, 'deck', null), 'block', 'no stepping off the side');
assert.strictEqual(B.canPass(1, 'deck', 'deck'), 'pass');
assert.strictEqual(B.canPass(1, 'deck', 'end'), 'pass');
assert.strictEqual(B.canPass(1, 'end', null), 'normal', 'down off an end');
assert.strictEqual(B.canPass(0, null, 'deck'), 'under');
assert.strictEqual(B.canPass(0, 'deck', null), 'under');
assert.strictEqual(B.canPass(0, 'deck', 'deck'), 'under');
assert.strictEqual(B.canPass(0, null, 'end'), 'normal');
assert.strictEqual(B.canPass(0, null, null), 'normal');
assert.deepStrictEqual(B.normalize({ deck: '5, 5 x 6', ends: '6 7' }), { deck: '5, 6', ends: '7' }, 'a region is a deck or an end, not both');
assert.strictEqual(B.normalize({ deck: '', ends: '7' }), null, 'no deck is no bridge');
assert.strictEqual(B.kind({ deck: '5', ends: '6' }, 5), 'deck');
assert.strictEqual(B.kind({ deck: '5', ends: '6' }, 6), 'end');
assert.strictEqual(B.kind({ deck: '5', ends: '6' }, 7), null);

// ---- No bridge regions: the old path ----
const p = $gamePlayer;
assert.strictEqual(B.active(), null);
p.locate(10, 1);
p.moveStraight(2);
assert.deepStrictEqual([p.x, p.y, p._docsLevel || 0], [10, 2, 0], 'an unmarked map has no levels');

// ---- Marked ----
D.Lighting.setMapSettings(1, { bridges: { deck: '5', ends: '6' } });
assert.ok(B.active());
// Over: up the north end, along the deck, down the south end.
p.locate(10, 1);
assert.strictEqual(p._docsLevel, 0);
p.moveStraight(2);
assert.deepStrictEqual([p.y, p._docsLevel], [2, 1], 'up onto the end');
for (let i = 0; i < 3; i++) p.moveStraight(2);
assert.deepStrictEqual([p.y, p._docsLevel], [5, 1], 'along the deck over the water');
assert.strictEqual(p.screenZ(), 5, 'drawn over the deck');
p.moveStraight(6);
assert.deepStrictEqual([p.x, p.y], [10, 5], 'no stepping off the side onto the road below');
for (let i = 0; i < 3; i++) p.moveStraight(2);
assert.deepStrictEqual([p.y, p._docsLevel], [8, 1], 'onto the south end');
p.moveStraight(2);
assert.deepStrictEqual([p.y, p._docsLevel], [9, 0], 'down off the end');
// Under: along the road, through the same tile.
p.locate(8, 5);
p.moveStraight(6);
p.moveStraight(6);
assert.deepStrictEqual([p.x, p.y, p._docsLevel], [10, 5, 0], 'under the deck on the road');
assert.strictEqual(p.screenZ(), 3, 'drawn under the deck');
p.moveStraight(8);
assert.deepStrictEqual([p.x, p.y], [10, 5], 'below, the water under the deck still stops you');
p.moveStraight(6);
assert.deepStrictEqual([p.x, p.y, p._docsLevel], [11, 5, 0], 'and out the other side');

// Two characters on different levels pass and do not start each other.
const ev = new Game_Event(1, 1);
$gameMap._events = [null, ev];
ev.locate(10, 4);
ev._docsLevel = 1;
p.locate(9, 5); p._docsLevel = 0;
p.moveStraight(6);
assert.ok(!p.isCollidedWithEvents(10, 4), 'the walker on the deck is on the other level');
ev._docsLevel = 0;
assert.ok(p.isCollidedWithEvents(10, 4), 'the same level bumps');
ev._docsLevel = 1;
ev.locate(10, 5); ev._docsLevel = 1;
p.startMapEvent(10, 5, [0], true);
assert.ok(!ev._started, 'not started from the other level');
ev.checkEventTriggerTouch(10, 5);
assert.ok(!ev._started, 'nor by touch');
assert.ok(!ev.isCollidedWithPlayerCharacters(10, 5));
ev._docsLevel = 0;
p.startMapEvent(10, 5, [0], true);
assert.strictEqual(ev._started, 1, 'the same level starts it');

// The level is kept in a save (it is a field of the player, which MZ writes).
p.locate(10, 1); p.moveStraight(2); p.moveStraight(2);
const saved = JSON.parse(JSON.stringify(p));
assert.strictEqual(saved._docsLevel, 1);
const loaded = Object.assign(new Game_Player(), saved);
loaded.moveStraight(6);
assert.deepStrictEqual([loaded.x, loaded.y], [10, 3], 'after loading, still on top');

// An event placed on the deck with <docs bridge: over> starts on top.
D.VisualEquip.eventText = c => (c === ev ? '<docs bridge: over>' : '');
delete ev._docsLevel;
ev.locate(10, 4);
assert.strictEqual(ev._docsLevel, 1);

// The Regions legend and the map section.
assert.deepStrictEqual(D.Regions.uses({}, { bridges: { deck: '5', ends: '6' } })[5], ['bridge deck']);
assert.deepStrictEqual(D.Regions.uses({}, { bridges: { deck: '5', ends: '6' } })[6], ['bridge end']);
assert.ok(D.Workspace.mapSections.some(s => /dd-bridges-sec/.test(s.render.call(D.Workspace, {}))));

// Clearing the setting: levels drop away on the next step.
D.Lighting.setMapSettings(1, { bridges: undefined });
p.moveStraight(6);
assert.strictEqual(p._docsLevel, 0);
console.log('test_bridges: OK');
