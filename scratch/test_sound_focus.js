// scratch/test_sound_focus.js
// Zooming in on the player and the sound that comes forward: the focus maths, sounds carrying less far
// and louder up close, music dropping, ambience layers by what's around (water, trees, open ground,
// doodads, regions), footsteps by ground, the zoom itself (wheel, keys, Set Zoom; flat and 3D maps).
const assert = require('assert');
const E = require('./engine/fake_engine');

console.log("=== Testing Zoom and Sound Focus ===");

E.install();
const WATER = 2048;
// Water along the left of the map (x 0-6), the player at (10, 10).
const tiles = [];
for (let y = 0; y < 24; y++) for (let x = 0; x < 7; x++) tiles.push([x, y, 0, WATER]);
E.setupWorld({ width: 30, height: 24, px: 10, py: 10, tiles });
require('../Docs-Doodads.js');
const SS = DocsDoodads.SpatialSound, Z = DocsDoodads.PlayerZoom, W = DocsDoodads.World;
const near = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;

// 1. The maths.
assert.strictEqual(SS.focusOf(1, 2.5), 0);
assert.strictEqual(SS.focusOf(2.5, 2.5), 1);
assert.ok(near(SS.focusOf(1.75, 2.5), 0.5));
const base = { mode: 'auto', near: 2, far: 14, panWidth: 8 };
assert.strictEqual(SS.focused(base, 0, { reach: 0.5, boost: 1.5 }), base, 'no zoom, no change');
const fs1 = SS.focused(base, 1, { reach: 0.5, boost: 1.5 });
assert.deepStrictEqual([fs1.far, fs1.boost, fs1.reachScale], [7, 1.5, 0.5], 'half the reach, half as loud again');
assert.strictEqual(SS.focused(base, 1, { enabled: false, reach: 0.5 }), base, 'focus off');
assert.ok(near(SS.musicScale(1, { music: 0.6 }), 0.4) && SS.musicScale(0, { music: 0.6 }) === 1);
assert.ok(near(SS.closeness(0.35, 0), 0.35) && near(SS.closeness(0.35, 1), 1));
const se = { name: 'Bell', volume: 80, pitch: 100, pan: 0 };
assert.strictEqual(SS.apply(se, 1, 0, fs1).volume, 100, 'close by: louder (up to 100)');
assert.strictEqual(SS.apply(se, 10, 0, fs1), null, 'far away: out of earshot zoomed in');
assert.ok(SS.apply(se, 10, 0, base).volume > 0, 'but heard at normal zoom');
const em = { emitter: { radius: 8 }, key: 'a', dx: 6, dy: 0 };
assert.ok(SS.planEmitters([em], base).a.gain > 0 && SS.planEmitters([em], fs1).a.gain === 0, 'an emitter carries less far zoomed in');
assert.ok(SS.planEmitters([Object.assign({}, em, { dx: 0.5 })], fs1).a.gain > SS.planEmitters([Object.assign({}, em, { dx: 0.5 })], base).a.gain, 'and is louder close by');

// 2. What's around: water to the west of the player, panned left; regions; doodads by picture name.
const q = DocsDoodads.Ambience.query();
const water = SS.coverage({ kind: 'water', radius: 6 }, 10, 10, q, 48, 48);
assert.ok(water.coverage > 0 && water.pan < -40, 'water nearby, to the left: ' + JSON.stringify(water));
assert.strictEqual(SS.coverage({ kind: 'water', radius: 3 }, 10, 10, q, 48, 48).coverage, 0, 'out of reach');
const open = SS.coverage({ kind: 'open', radius: 4 }, 20, 10, q, 48, 48);
assert.ok(open.coverage > 0.9 && open.pan === 0, 'open ground');
const doodads = { doodads: [{ x: 11 * 48, y: 11 * 48, path: 'img/doodads/OakTree.png' }, { x: 11 * 48, y: 11 * 48, path: 'img/doodads/Rock.png' }] };
assert.ok(SS.coverage({ kind: 'doodads', id: 'tree', radius: 4 }, 10, 10, doodads, 48, 48).coverage > 0, 'doodads named like the text');
assert.strictEqual(SS.coverage({ kind: 'doodads', id: 'bird', radius: 4 }, 10, 10, doodads, 48, 48).coverage, 0);

// 3. Footsteps by ground: region, then terrain tag, then kind of ground, then the default.
const rows = [{ kind: 'default', sound: 'Step' }, { kind: 'bush', sound: 'Grass' }, { kind: 'tag', id: 2, sound: 'Wood' }, { kind: 'region', id: 5, sound: 'Stone' }];
assert.strictEqual(SS.footstepFor(rows, { region: 5, tag: 2, bush: true }).sound, 'Stone');
assert.strictEqual(SS.footstepFor(rows, { region: 0, tag: 2, bush: true }).sound, 'Wood');
assert.strictEqual(SS.footstepFor(rows, { region: 0, tag: 0, bush: true }).sound, 'Grass');
assert.strictEqual(SS.footstepFor(rows, { region: 0, tag: 0 }).sound, 'Step');
assert.strictEqual(SS.footstepFor([{ kind: 'bush', sound: 'Grass' }], { region: 0, tag: 0 }), null, 'nothing for this ground');

// 4. Zooming: Set Zoom eases in; flat maps zoom the screen around the player.
const ss = new Spriteset_Map();
SceneManager._scene = { _spriteset: ss };
const scene = new Scene_Map();
scene.isActive = () => true;
const frames = n => { for (let i = 0; i < n; i++) { Graphics.frameCount++; $gameMap.update(true); Scene_Map.prototype.update.call(scene); } };
PluginManager.callCommand($gameMap._interpreter, 'Docs-Doodads', 'setZoom', { level: '2', duration: '20', wait: 'false' });
frames(10);
assert.ok(Z.level() > 1 && Z.level() < 2, 'easing in: ' + Z.level());
frames(15);
assert.strictEqual(Z.level(), 2, 'there');
assert.strictEqual($gameSystem._docsZoom, 2, 'kept in the save');
assert.strictEqual($gameScreen._zoomScale, 2, 'the flat map is zoomed');
assert.strictEqual($gameScreen._zoomX, $gamePlayer.screenX(), 'around the player');
// Players zoom themselves only when allowed.
let wheel = -100;
TouchInput.wheelY = wheel;
frames(1);
assert.strictEqual(Z.target(), 2, 'the wheel does nothing until zooming is allowed');
$dataDocsDoodads.world = Object.assign({}, $dataDocsDoodads.world, { zoom: { enabled: true, wheel: true, keys: true, max: 2.5, step: 0.25, ease: 1 } });
frames(1);
assert.strictEqual(Z.target(), 2.25, 'wheel up: closer');
TouchInput.wheelY = 100;
frames(1);
assert.strictEqual(Z.target(), 2, 'wheel down: further');
TouchInput.wheelY = 0;
Input._pressed = { docsZoomIn: true };
Input.isRepeated = k => Boolean(Input._pressed[k]);
frames(4);
assert.strictEqual(Z.target(), 2.5, '+ key, never past the closest zoom');
Input._pressed = {};
DocsDoodads.Workspace.mounted = true;
TouchInput.wheelY = 100;
frames(1);
assert.strictEqual(Z.target(), 2.5, 'not while editing (the editor uses the wheel)');
DocsDoodads.Workspace.mounted = false;
TouchInput.wheelY = 0;
assert.strictEqual(Z.focus(), 1);

// 5. Music drops zoomed in; sound effects carry less far.
AudioManager.playBgm({ name: 'Theme', volume: 90, pitch: 100, pan: 0 });
frames(1);
assert.ok(near(AudioManager._bgmBuffer.volume, 0.9 * 0.4, 1e-6), 'music at 40%: ' + AudioManager._bgmBuffer.volume);
assert.ok(SS.settings().far < W.settings().sound.far, 'event sounds carry less far');

// 6. Ambience: water to the west plays, panned left, louder zoomed in; stops when removed.
$dataDocsDoodads.world = Object.assign({}, $dataDocsDoodads.world, { ambience: { layers: [{ kind: 'water', sound: 'River', volume: 80, radius: 6, quiet: 0.4 }] } });
frames(7);
const river = DocsDoodads.Ambience._playing.get(0);
assert.ok(river && river.buffer._playing && river.buffer.pan < 0, 'the river plays, to the left');
const loud = river.volume;
PluginManager.callCommand($gameMap._interpreter, 'Docs-Doodads', 'setZoom', { level: '1', duration: '0' });
frames(14);
assert.ok(DocsDoodads.Ambience._playing.get(0).volume < loud * 0.6, 'quieter back at normal zoom');
$gamePlayer.locate(25, 10);
frames(7);
assert.ok(!DocsDoodads.Ambience._playing.get(0), 'walk away from the water and it stops');
$dataDocsDoodads.world = Object.assign({}, $dataDocsDoodads.world, { ambience: { layers: [] } });

// 7. Footsteps: quiet at normal zoom, clear zoomed in; not in a vehicle.
$dataDocsDoodads.world = Object.assign({}, $dataDocsDoodads.world, { footsteps: { enabled: true, volume: 100, quiet: 0.3, dash: 1.2, followers: false, rows: [{ kind: 'default', sound: 'Step', volume: 90 }] } });
const played = [];
const realPlaySe = AudioManager.playSe;
AudioManager.playSe = function(s) { played.push(s); };
$gamePlayer.locate(20, 10);
$gamePlayer.moveStraight(6);
const quietStep = played.pop();
assert.ok(quietStep && quietStep.name === 'Step' && quietStep.volume <= 30, 'a quiet step at normal zoom: ' + JSON.stringify(quietStep));
Z.set(2.5, 0);
frames(30);
$gamePlayer.moveStraight(6);
const clearStep = played.pop();
assert.ok(clearStep && clearStep.volume > 80, 'a clear step zoomed in: ' + clearStep.volume);
$gamePlayer.isInVehicle = () => true;
$gamePlayer.moveStraight(6);
assert.strictEqual(played.length, 0, 'none aboard a vehicle');
$gamePlayer.isInVehicle = () => false;
AudioManager.playSe = realPlaySe;

// 8. In 3D the camera moves in instead, and the screen stays as it is.
DocsDoodads.Lighting.setMapSettings(1, { perspective: { enabled: true, zoom: 1.2 } });
frames(2);
assert.ok(near(DocsDoodads.Perspective.active().zoom, 1.2 * 2.5), '3D: the camera zoom times the player zoom');
assert.strictEqual($gameScreen._zoomScale, 1, 'and the screen is not zoomed');
DocsDoodads.Workspace.mounted = true;
assert.ok(near(DocsDoodads.Perspective.active().zoom, 1.2), 'the editor shows the map as set');
DocsDoodads.Workspace.mounted = false;

console.log("✓ Zoom and sound focus: the maths, closer sounds louder and far ones quieter, ambience by what's around, footsteps by ground, zooming (Set Zoom, wheel, keys, limits, editor), music dropping, flat and 3D maps.");
