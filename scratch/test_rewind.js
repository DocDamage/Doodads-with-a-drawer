'use strict';
// 8.4.6 Rewind in a playtest: the player's place, switches and variables after a rewind match the snapshot; the ring
// keeps 60 and drops the oldest; nothing is written to disk; the key does nothing with the editor open or off the
// map; a slow project falls back to light snapshots; the key is in the shortcut table.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const E = require('./engine/fake_engine');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-rewind-'));
process.chdir(dir);
E.install();
E.setupWorld({ width: 20, height: 15, px: 2, py: 2 });
// MZ's save contents for the stand-in: switches, variables and the player.
global.DataManager = Object.assign(global.DataManager || {}, {
    makeSaveContents: () => ({ switches: $gameSwitches._data, variables: $gameVariables._data, player: { x: $gamePlayer.x, y: $gamePlayer.y, d: $gamePlayer.direction() } }),
    extractSaveContents: c => { $gameSwitches._data = c.switches; $gameVariables._data = c.variables; $gamePlayer.locate(c.player.x, c.player.y); }
});
require('../Docs-Doodads.js');
const D = DocsDoodads, R = D.Rewind;
D.Compat.isTest = () => true;
const scene = new Scene_Map();
SceneManager._scene = scene;
$gamePlayer.requestMapReload = () => { reloads++; };
let reloads = 0;
const frames = n => { for (let i = 0; i < n; i++) { Graphics.frameCount++; R.update(); } };

// Thirty frames a snapshot.
frames(30);
assert.strictEqual(R.ring.length, 1);
$gameSwitches.setValue(4, true); $gameVariables.setValue(2, 7);
$gamePlayer.locate(5, 6);
frames(30);
const remembered = { x: 5, y: 6 };
$gameSwitches.setValue(4, false); $gameVariables.setValue(2, 99);
$gamePlayer.locate(12, 3);
frames(30);
assert.strictEqual(R.ring.length, 3);
// Hold: step back one snapshot (every 6 frames), let go: loaded.
assert.ok(R.press());
frames(6);
assert.strictEqual(R.back, 1);
assert.strictEqual(R.seconds(), 1);
R.release();
assert.deepStrictEqual([$gamePlayer.x, $gamePlayer.y], [remembered.x, remembered.y], 'the player is where they were');
assert.strictEqual($gameSwitches.value(4), true, 'switches as they were');
assert.strictEqual($gameVariables.value(2), 7, 'variables as they were');
assert.strictEqual(reloads, 1, 'the map is shown again');
assert.strictEqual(R.ring.length, 2, 'what came after is dropped');
// The ring keeps 60.
frames(30 * 70);
assert.strictEqual(R.ring.length, 60, 'the oldest go');
// Nothing on disk.
const files = [];
const walk = p => { for (const e of fs.readdirSync(p, { withFileTypes: true })) { const q = path.join(p, e.name); if (e.isDirectory()) walk(q); else files.push(q); } };
walk(dir);
assert.deepStrictEqual(files, [], 'nothing is written to disk');
// Not with the editor open, nor off the map.
D.Workspace.mounted = true;
assert.ok(!R.press(), 'not while editing');
D.Workspace.mounted = false;
SceneManager._scene = new Scene_Base();
assert.ok(!R.press(), 'not in menus or battles');
const before = R.ring.length;
frames(30);
assert.strictEqual(R.ring.length, before, 'no snapshots off the map');
SceneManager._scene = scene;
// A slow project keeps only the map, the player, switches and variables.
const slow = DataManager.makeSaveContents;
DataManager.makeSaveContents = () => { const until = Date.now() + 6; while (Date.now() < until) { /* slow */ } return slow(); };
R._timings = [];
frames(30 * 5);
assert.ok(R.light, 'falls back to light snapshots');
DataManager.makeSaveContents = slow;
$gameVariables.setValue(9, 1);
frames(30);
$gameVariables.setValue(9, 2);
R.press(); R.release();
assert.strictEqual($gameVariables.value(9), 1, 'a light snapshot still brings variables back');
// The key is in the table, and only says how in the editor.
assert.ok(D.Shortcuts.find('rewind') && D.Shortcuts.find('rewind').keys === 'Ctrl+Backspace');
let toast = '';
D.Workspace.showToast = m => { toast = m; };
assert.ok(D.Workspace.runShortcut('rewind'));
assert.ok(/Close the editor/.test(toast));
console.log('test_rewind: OK');
