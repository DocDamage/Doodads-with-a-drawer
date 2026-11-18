'use strict';
// 7.3.6 A cutscene timeline: due over a frame, over several and at the end; keys at the same frame keep their
// track order; each kind calls what exists; Play Timeline's wait releases at the end; holding OK skips; Stop puts
// the camera back; the editor's tracks and keys are Undo steps; a preview jump backwards replays from the start.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const E = require('./engine/fake_engine');

process.chdir(fs.mkdtempSync(path.join(os.tmpdir(), 'dd-timeline-')));
E.install();
E.setupWorld({ width: 20, height: 15, px: 5, py: 5 });
const commands = {};
global.PluginManager.registerCommand = (plugin, name, fn) => { (PluginManager._commands = PluginManager._commands || {})[plugin + ':' + name] = fn; commands[name] = fn; };
const door = E.doodad(8, 6, { uid: 'door', name: 'Door', states: { list: [{ name: 'Shut' }, { name: 'Open' }] } });
const lamp = E.doodad(9, 6, { uid: 'lamp', name: 'Lamp', light: { enabled: true, radius: 60 } });
$dataDocsDoodads[1] = [door, lamp];
require('../Docs-Doodads.js');
const D = DocsDoodads, T = D.Timeline;

const tl = {
    id: 'opening', name: 'Opening', length: 120, tracks: [
        { kind: 'switch', keys: [{ t: 10, id: 3, on: true }, { t: 60, id: 4, on: true }] },
        { kind: 'state', target: 'Door', keys: [{ t: 10, state: 'Open' }] },
        { kind: 'weather', keys: [{ t: 30, type: 'rain', power: 5, frames: 0 }] },
        { kind: 'character', target: 'player', keys: [{ t: 0, action: 'face', dir: 8 }] },
        { kind: 'nonsense', keys: [{ t: 1 }] }
    ]
};

// ---- Pure ----
assert.strictEqual(T.normalize(tl).tracks.length, 4, 'unknown kinds are left out');
assert.strictEqual(T.length(tl), 120);
assert.strictEqual(T.length({ id: 'x', length: 10, tracks: [{ kind: 'switch', keys: [{ t: 50 }] }] }), 51, 'runs to its last key');
assert.deepStrictEqual(T.due(tl, -1, 0).map(a => a.track.kind), ['character'], 'frame 0');
assert.deepStrictEqual(T.due(tl, 9, 10).map(a => a.track.kind), ['switch', 'state'], 'same frame: track order');
assert.deepStrictEqual(T.due(tl, 0, 59).map(a => a.key.t), [10, 10, 30], 'over several frames, in time order');
assert.deepStrictEqual(T.due(tl, 59, 200).map(a => a.key.t), [60], 'to the end');
assert.deepStrictEqual(T.due(tl, 10, 10), [], 'nothing twice');
assert.strictEqual(T.normalizeKey({ t: -5, a: 1 }).t, 0);

// ---- Playing ----
$dataDocsDoodads.timelines = [tl];
const ss = new Spriteset_Map();
SceneManager._scene = { _spriteset: ss };
assert.ok(T.play('Opening'));
E.frames(ss, 1);
assert.strictEqual($gamePlayer.direction(), 8, 'frame 0 runs at once');
E.frames(ss, 10);
assert.ok($gameSwitches.value(3), 'a switch key');
assert.strictEqual(D.api.state('Door'), 'Open', 'a state key calls the doodad\'s state');
E.frames(ss, 20);
assert.strictEqual($gameScreen.weatherType(), 'rain', 'a weather key');
assert.ok(T.isPlaying('opening'));
E.frames(ss, 120);
assert.ok(!T.isPlaying(), 'it ends');
assert.ok($gameSwitches.value(4));

// The command with wait holds the interpreter until the end.
const interp = new (class { setWaitMode(m) { this._waitMode = m; } })();
Object.setPrototypeOf(interp, Game_Interpreter.prototype);
interp._waitMode = '';
$gameSwitches.setValue(4, false);
commands.playTimeline.call(interp, { name: 'opening', wait: 'true', skippable: 'true' });
assert.strictEqual(interp._waitMode, 'docsTimeline');
assert.strictEqual(interp.updateWaitMode(), true, 'waiting');
E.frames(ss, 130);
assert.strictEqual(interp.updateWaitMode(), false, 'released at the end');
assert.strictEqual(interp._waitMode, '');

// Holding OK for a second skips to the end, running what was left.
$gameSwitches.setValue(4, false);
T.play('opening');
Input.isPressed = k => k === 'ok';
E.frames(ss, 61);
Input.isPressed = () => false;
assert.ok(!T.isPlaying(), 'skipped');
assert.ok($gameSwitches.value(4), 'the remaining keys ran');
// Not skippable: holding OK does nothing.
T.play('opening', { skippable: false });
Input.isPressed = k => k === 'ok';
E.frames(ss, 65);
Input.isPressed = () => false;
assert.ok(T.isPlaying(), 'not skippable');
// Stop puts the camera back on the player.
let followed = 0;
const follow = D.api.followCamera;
D.api.followCamera = () => { followed++; return true; };
commands.stopTimeline.call(interp, {});
assert.ok(!T.isPlaying());
assert.strictEqual(followed, 1, 'Stop gives the camera back');
D.api.followCamera = follow;
assert.ok(!T.play('missing'), 'no such timeline');
assert.strictEqual(D.api.playTimeline('Opening'), true);
assert.strictEqual(D.api.timelinePlaying('Opening'), true);
D.api.stopTimeline();

// ---- The editor ----
const W = D.Workspace;
W.mounted = true;
W.showToast = () => {};
$dataDocsDoodads.timelines = [];
const id = W.newTimeline('Bridge Collapse');
assert.ok(T.find('Bridge Collapse'));
W.addTimelineTrack(id, 'switch', '');
W.addTimelineKey(id, 0, { t: 30, id: 7, on: true });
W.addTimelineKey(id, 0, { t: 5, id: 8, on: true });
assert.deepStrictEqual(T.find(id).tracks[0].keys.map(k => k.t), [5, 30], 'keys kept in time order');
W.updateTimelineKey(id, 0, 1, { t: 90 });
assert.deepStrictEqual(T.find(id).tracks[0].keys.map(k => k.t), [5, 90], 'moved');
D.Undo.undo();
assert.deepStrictEqual(T.find(id).tracks[0].keys.map(k => k.t), [5, 30], 'one Undo step a change');
D.Undo.redo();
W.updateTimelineKey(id, 0, 0, null);
assert.deepStrictEqual(T.find(id).tracks[0].keys.map(k => k.t), [90], 'deleted');
assert.ok(!W.addTimelineTrack(id, 'nonsense'));

// Preview: Stop puts the map back; a jump backwards replays from the start.
$gameSwitches.setValue(7, false);
$gameSwitches.setValue(8, false);
W.addTimelineKey(id, 0, { t: 20, id: 8, on: true });
W.scrubTimeline(id, 95);
assert.ok($gameSwitches.value(7) && $gameSwitches.value(8), 'a jump runs everything up to there');
assert.ok(T._player.paused, 'and holds there');
$gameSwitches.setValue(8, false);
W.scrubTimeline(id, 10);
assert.ok(!$gameSwitches.value(7) && !$gameSwitches.value(8), 'a jump back starts again from the snapshot');
W.stopTimelinePreview();
assert.ok(!T.isPlaying() && !T._editorPreview);
assert.ok(!$gameSwitches.value(7), 'Stop puts the map back');
W.deleteTimeline(id);
assert.ok(!T.find(id));
assert.ok(!('timelines' in $dataDocsDoodads), 'no timelines, no key');
console.log('test_timeline: OK');
