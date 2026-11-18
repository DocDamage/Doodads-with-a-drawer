'use strict';
// 8.4.2 A world that remembers: growth steps on the right day and stops at the last state (and catches up on a map
// not shown for days); wear counts rise and ease down; the save string round-trips; a resized map starts again; a
// map with it off keeps nothing; footprints on marked ground fade; the Details and map fields.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const E = require('./engine/fake_engine');

process.chdir(fs.mkdtempSync(path.join(os.tmpdir(), 'dd-remember-')));
E.install();
E.setupWorld({ width: 16, height: 12, px: 3, py: 3 });
const crop = E.doodad(6, 6, { uid: 'crop', name: 'Crop', states: { list: [{ name: 'Seed' }, { name: 'Sprout' }, { name: 'Ripe' }] }, grow: { days: [2, 3] } });
$dataDocsDoodads[1] = [crop];
require('../Docs-Doodads.js');
const D = DocsDoodads, G = D.Growth, Wr = D.Wear;

// ---- Pure ----
assert.deepStrictEqual(G.advance(0, 0, [2, 3], 5, 2), { state: 0, began: 5 }, 'first seen: planted today');
assert.deepStrictEqual(G.advance(0, 5, [2, 3], 6, 2), { state: 0, began: 5 });
assert.deepStrictEqual(G.advance(0, 5, [2, 3], 7, 2), { state: 1, began: 7 }, 'steps on the right day');
assert.deepStrictEqual(G.advance(1, 7, [2, 3], 10, 2), { state: 2, began: 10 });
assert.deepStrictEqual(G.advance(2, 10, [2, 3], 99, 2), { state: 2, began: 10 }, 'stops at the last state');
assert.deepStrictEqual(G.advance(0, 5, [2, 3], 30, 2), { state: 2, began: 10 }, 'a map not shown for days catches up');
assert.strictEqual(G.normalize({ days: '' }), null);
assert.deepStrictEqual(G.normalize({ days: '2, x, 3' }).days, [2, 3]);
const grid = new Uint8Array(6);
Wr.step(grid, 3, 1, 1); Wr.step(grid, 3, 1, 1); Wr.step(grid, 3, 0, 0);
assert.deepStrictEqual(Array.from(grid), [1, 0, 0, 0, 2, 0], 'counts rise');
for (let i = 0; i < 300; i++) Wr.step(grid, 3, 2, 0);
assert.strictEqual(grid[2], 255, 'capped');
Wr.ease(grid);
assert.deepStrictEqual(Array.from(grid), [0, 0, 204, 0, 1, 0], 'and ease down each day');
assert.strictEqual(Wr.encode(new Uint8Array([0, 0, 0, 5, 5, 0])), '0*3,5*2,0');
const big = new Uint8Array(400); big[17] = 9; big[200] = 255;
assert.deepStrictEqual(Array.from(Wr.decode(Wr.encode(big), 400)), Array.from(big), 'the save string round-trips');
assert.ok(Wr.encode(new Uint8Array(40000)).length < 12, 'short for an unworn map');
assert.ok(Wr.trailAt(Wr.settings({ remember: { trails: true, trailRegions: '3' } }), 3, 0, false));
assert.ok(!Wr.trailAt(Wr.settings({ remember: { trails: true, trailRegions: '3' } }), 4, 0, false));
assert.ok(Wr.trailAt(Wr.settings({ remember: { trails: true } }), 0, 0, true), 'anywhere while it snows');
assert.ok(!Wr.trailAt(Wr.settings({}), 3, 0, true), 'off');

// ---- Growth on the map, by the calendar ----
let day = 4;
D.Calendar.day = () => day;
const ss = new Spriteset_Map();
SceneManager._scene = { _spriteset: ss };
E.frames(ss, 1);
assert.strictEqual(D.api.state('Crop'), 'Seed');
day = 6;
E.frames(ss, 1);
assert.strictEqual(D.api.state('Crop'), 'Sprout', 'two days on');
day = 20;
E.frames(ss, 1);
assert.strictEqual(D.api.state('Crop'), 'Ripe', 'and ripe');
assert.ok($gameSystem._docsWorldState.grown['1/name:crop'] > 0, 'only the day kept');

// ---- Wear ----
const p = $gamePlayer;
for (let i = 0; i < 5; i++) { p.locate(3, 3); p.moveStraight(6); }
assert.ok(!Wr._grids[1] || !Wr._grids[1].data.some(v => v), 'a map with it off keeps nothing');
D.Lighting.setMapSettings(1, { remember: { wear: true, threshold: 2, trails: true, trailRegions: '' } });
day = 21;
for (let i = 0; i < 6; i++) { p.locate(3, 3); p.moveStraight(6); }
const g = Wr.grid(1, 16, 12);
assert.strictEqual(g.data[3 * 16 + 4], 6, 'six steps on that tile');
E.frames(ss, 1);
assert.ok(ss._docsWearLayer && ss._docsWearLayer.visible && ss._docsWearDrawn >= 1, 'a worn patch is drawn');
// Saving writes it; loading a game starts the grids again from the save.
DataManager.makeSaveContents && DataManager.makeSaveContents();
Wr.save();
const saved = JSON.parse(JSON.stringify($gameSystem._docsWear));
assert.ok(saved[1] && /6/.test(saved[1].data) && saved[1].w === 16, 'kept in the save');
Wr._grids = {};
assert.strictEqual(Wr.grid(1, 16, 12).data[3 * 16 + 4], 6, 'back from the save');
Wr._grids = {};
assert.strictEqual(Wr.grid(1, 20, 12).data.some(v => v), false, 'a resized map starts again');
Wr._grids = {};
day = 23;
E.frames(ss, 1);
assert.ok(Wr.grid(1, 16, 12).data[3 * 16 + 4] < 6, 'two days later it has eased');

// ---- Footprints ----
$dataMap.data[(5 * 12 + 3) * 16 + 5] = 3;
D.Lighting.setMapSettings(1, { remember: { trails: true, trailRegions: '3', fade: 1 } });
Wr._prints = [];
p.locate(4, 3); p.moveStraight(6);
assert.strictEqual(Wr._prints.length, 1, 'a footprint on the marked ground');
p.locate(7, 7); p.moveStraight(6);
assert.strictEqual(Wr._prints.length, 1, 'none on plain ground');
E.frames(ss, 2);
assert.ok(ss._docsPrintLayer && ss._docsPrintLayer.visible);
E.frames(ss, 70);
assert.strictEqual(Wr._prints.length, 0, 'filled in');

// ---- Editor ----
const Wk = D.Workspace, d = E.doodad(1, 1, { uid: 'x', states: { list: [{ name: 'a' }, { name: 'b' }] } });
Wk.applyDoodadProperty(d, 'grow.days', '1, 2');
assert.deepStrictEqual(d.grow, { days: [1, 2] });
assert.strictEqual(Wk.getDoodadProperty(d, 'grow.days'), '1, 2');
Wk.applyDoodadProperty(d, 'grow.days', '');
assert.ok(!d.grow);
assert.ok(Wk.mapSections.some(s => /dd-remember-sec/.test(s.render.call(Wk, {}))));
console.log('test_remember: OK');
