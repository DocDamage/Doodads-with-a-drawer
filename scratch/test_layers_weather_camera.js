// scratch/test_layers_weather_camera.js
// Batch 7: flat-map picture layers (6.2.6), wind, blowing leaves and lightning (6.2.7), and the 2D
// camera (6.2.9): easing after the player, region bounds, follow and paths. On the stand-in engine.
const assert = require('assert');
const E = require('./engine/fake_engine');

console.log('=== Testing Map Layers, Weather and the 2D Camera ===');

E.install();
E.setupWorld({ width: 60, height: 40, px: 30, py: 20, tilesetMode: 0, tiles: [] });
// MZ's scrolling, which the stand-in engine leaves out: clamped at the map's edges.
Game_Map.prototype.scrollRight = function(d) { this._displayX = Math.min(this.width() - this.screenTileX(), this._displayX + d); };
Game_Map.prototype.scrollLeft = function(d) { this._displayX = Math.max(0, this._displayX - d); };
Game_Map.prototype.scrollDown = function(d) { this._displayY = Math.min(this.height() - this.screenTileY(), this._displayY + d); };
Game_Map.prototype.scrollUp = function(d) { this._displayY = Math.max(0, this._displayY - d); };
let mzScrolls = 0;
Game_Player.prototype.updateScroll = function() { mzScrolls++; };
const flashes = [];
$gameScreen.startFlash = (color, frames) => flashes.push([color, frames]);
const commands = {};
const register = PluginManager.registerCommand;
PluginManager.registerCommand = (plugin, name, fn) => { commands[name] = fn; if (register) register.call(PluginManager, plugin, name, fn); };
require('../Docs-Doodads.js');
const D = DocsDoodads, L = D.MapLayers, W = D.Wind, C = D.Camera2D;

// 1. Layers: normalised, positions follow the camera by their factor plus their own drift.
assert.deepStrictEqual(L.normalize({ image: 'img/parallaxes/Mountains.png', follow: 9, zoom: 0, blend: 'weird' }),
    Object.assign({}, L.defaults, { image: 'Mountains', follow: 2, zoom: 0.1, blend: 'normal' }));
assert.deepStrictEqual(L.list({ layers2d: [{ image: '' }, { image: 'Clouds' }] }).map(l => l.image), ['Clouds'], 'a layer with no picture is left out');
const o = L.origin(L.normalize({ image: 'x', follow: 0.5, zoom: 2 }), { x: 400, y: 100 }, { x: 20, y: 0 });
assert.deepStrictEqual(o, { x: 110, y: 25 });
assert.strictEqual(L.blendMode('add'), 1);
const blobs = L.fogBlobs(512, 10, 3);
assert.strictEqual(blobs.length, 10);
assert.deepStrictEqual(L.fogBlobs(512, 10, 3), blobs, 'the same fog every time');

D.Lighting.setMapSettings(1, { layers2d: [
    { image: 'Far', place: 'back', follow: 0.2 },
    { image: 'Near', place: 'back', follow: 0.6 },
    { image: '#fog', place: 'front', follow: 1, scrollX: 1, wind: true, opacity: 0.5, blend: 'screen', zoom: 2 },
    { image: 'Mist', place: 'front', loopX: false, loopY: false, follow: 1 }
] });
const ss = new Spriteset_Map();
SceneManager._scene = { _spriteset: ss };
E.frames(ss, 2);
const kids = ss._baseSprite.children;
const at = name => kids.findIndex(c => c._docsLayer && c._docsLayer.image === name);
assert.ok(at('Far') === kids.indexOf(ss._parallax) + 1 && at('Near') === at('Far') + 1, 'backgrounds above the parallax, in order');
assert.ok(at('#fog') === kids.indexOf(ss._tilemap) + 1 && at('Mist') === at('#fog') + 1, 'overlays above the tilemap, in order');
const fog = kids[at('#fog')];
assert.strictEqual(fog.blendMode, 3);
assert.strictEqual(Math.round(fog.opacity), 128);
assert.ok(fog.origin, 'fog repeats');
assert.ok(!kids[at('Mist')].origin, 'a layer that doesn\'t repeat is a plain sprite');
$gameMap._displayX = 10;
const before = fog.origin.x;
E.frames(ss, 1);
assert.ok(Math.abs(fog.origin.x - (before + (10 * 48 + 1) / 2)) < 1e-6, 'follows the map and drifts: ' + fog.origin.x);
assert.ok(Math.abs(kids[at('Far')].origin.x - 10 * 48 * 0.2) < 1e-6, 'a far layer moves slower');
D.Lighting.setMapSettings(1, { layers2d: [] });
E.frames(ss, 1);
assert.ok(!ss._baseSprite.children.some(c => c._docsLayer), 'removed again');
console.log('✓ layers: behind the tiles and over the map, in order, following and drifting');

// 2. Wind: the world's, raised by storms, gusting; Set Wind eases to a strength; sway leans with it.
D.World.set('weather2d.wind', { strength: 0.3, direction: -1, gusts: 0, fromWeather: true, leaves: true });
assert.deepStrictEqual(W.now(0, null), { x: -0.3, strength: 0.3 });
const storm = W.now(0, { type: 'storm', power: 9 });
assert.ok(Math.abs(storm.strength - 0.9) < 1e-9, 'a full storm adds 0.6');
D.World.set('weather2d.wind.gusts', 1);
const gusts = [0, 3, 7, 11].map(t => W.now(t, null).x);
assert.ok(new Set(gusts.map(g => g.toFixed(3))).size > 1 && gusts.every(g => g < 0), 'gusts vary, the direction holds');
global.$gameSystem._docsWind = null;
W.set(1, 10, 'right');
for (let i = 0; i < 5; i++) W.tick();
D.World.set('weather2d.wind.gusts', 0);
const mid = W.now(0, null);
assert.ok(mid.x > 0 && Math.abs(mid.strength - 0.65) < 1e-9, 'halfway to a gale, now to the right');
commands.setWind({ strength: 'world', direction: 'same', duration: 0 });
assert.strictEqual(global.$gameSystem._docsWind, null, 'back to the world\'s wind');
const calm = D.Motion.sample(D.Motion.normalize({ type: 'sway', amount: 1 }), 0, 0, 0);
const windy = D.Motion.sample(D.Motion.normalize({ type: 'sway', amount: 1 }), 0, 0, 1);
assert.ok(windy.skewX > calm.skewX + 0.05, 'swaying props lean with the wind');
console.log('✓ wind: the world\'s, storms, gusts, Set Wind, leaning sway');

// 3. Leaves in a strong wind; none while editing or calm.
D.World.set('weather2d.wind', { strength: 0.8, direction: 1, gusts: 0, leaves: true });
E.frames(ss, 2);
assert.ok(ss._docsLeaves && ss._docsLeaves._docsLeaves.length === 24, 'leaves: ' + (ss._docsLeaves && ss._docsLeaves._docsLeaves.length));
assert.ok(ss.children.indexOf(ss._docsLeaves) < ss.children.indexOf(ss._weather), 'under the weather');
const x0 = ss._docsLeaves._docsLeaves[0].x;
E.frames(ss, 1);
assert.notStrictEqual(ss._docsLeaves._docsLeaves[0].x, x0, 'they blow');
D.World.set('weather2d.wind.strength', 0);
E.frames(ss, 1);
assert.ok(!ss._docsLeaves, 'gone when calm');
console.log('✓ leaves blow across in a strong wind');

// 4. Lightning: strikes in storms, flash, thunder later; nothing outside storms.
const Li = D.Lightning;
const s = Object.assign({}, Li.defaults, { every: 10 });
assert.ok(Li.nextIn(s, 9, 0.5) < Li.nextIn(s, 1, 0.5), 'more often in a stronger storm');
const near = Li.strike(s, 1), far = Li.strike(s, 0);
assert.ok(near.flash > far.flash && near.thunderIn === 0 && far.thunderIn === 120, 'near strikes are brighter and the thunder sooner');
D.World.set('weather2d.lightning', { enabled: true, every: 2, sound: 'Thunder9', delay: 0.5 });
$gameScreen.changeWeather('storm', 9);
AudioManager._seBuffers = [];
E.frames(ss, 400);
assert.ok(flashes.length >= 2, 'flashes: ' + flashes.length);
assert.ok(AudioManager._seBuffers.some(b => /Thunder9/.test(b._url)), 'thunder');
$gameScreen.changeWeather('none', 0);
const count = flashes.length;
E.frames(ss, 400);
assert.strictEqual(flashes.length, count, 'no lightning without a storm');
console.log('✓ lightning: flashes and thunder in storms only');

// 5. The camera: MZ's own unless something is asked for.
mzScrolls = 0;
$gamePlayer.updateScroll(0, 0);
assert.strictEqual(mzScrolls, 1, 'MZ scrolls as usual');
D.World.set('camera2d.smooth', 0.5);
$gameMap._displayX = 0; $gameMap._displayY = 0;
$gamePlayer.locate(30, 20);
$gamePlayer.updateScroll(0, 0);
assert.strictEqual(mzScrolls, 1, 'eased: ours');
const wantX = 30 - 8, wantY = 20 - 6;
assert.ok(Math.abs($gameMap.displayX() - wantX / 2) < 1e-9 && Math.abs($gameMap.displayY() - wantY / 2) < 1e-9, 'halfway in one frame');
for (let i = 0; i < 40; i++) $gamePlayer.updateScroll(0, 0);
assert.ok(Math.abs($gameMap.displayX() - wantX) < 0.01, 'catches up');
// Region bounds: a room painted region 5 from (20,15) to (31,24); the camera stays inside it.
D.World.set('camera2d.smooth', 0);
for (let y = 15; y <= 24; y++) for (let x = 20; x <= 31; x++) $dataMap.data[(5 * 40 + y) * 60 + x] = 5;
assert.deepStrictEqual(C.regionBox($dataMap.data, 60, 40, 5), { x0: 20, y0: 15, x1: 31, y1: 24 });
assert.deepStrictEqual(C.clamp({ x0: 20, y0: 15, x1: 31, y1: 24 }, 10, 30, 17, 13), { x: 17.5, y: 13.5 }, 'a room smaller than the screen is centred');
assert.deepStrictEqual(C.clamp({ x0: 0, y0: 0, x1: 59, y1: 39 }, -5, 50, 17, 13), { x: 0, y: 27 });
D.Lighting.setMapSettings(1, { cameraBounds: [5] });
$gamePlayer.locate(30, 16);
$gamePlayer.updateScroll(0, 0);
assert.deepStrictEqual([$gameMap.displayX(), $gameMap.displayY()], [17.5, 13.5], 'held inside the room');
$gamePlayer.locate(45, 30);
$gamePlayer.updateScroll(0, 0);
assert.deepStrictEqual([$gameMap.displayX(), $gameMap.displayY()], [37, 24], 'outside the room it follows');
// Following an event.
const ev = new Game_Event(1, 3);
ev.locate(10, 10);
$gameMap._events[3] = ev;
commands.cameraFollow2d.call({}, { target: 'event', eventId: 3 });
$gamePlayer.updateScroll(0, 0);
assert.deepStrictEqual([$gameMap.displayX(), $gameMap.displayY()], [2, 4], 'on the event');
commands.cameraFollow2d.call({}, { target: 'player' });
// A path: waits for it, glides, comes back.
let waited = 0;
D.Lighting.setMapSettings(1, { cameraBounds: undefined });
$gamePlayer.locate(30, 20);
$gameMap._displayX = 22; $gameMap._displayY = 14;
commands.cameraPath2d.call({ wait(f) { waited = f; } }, { points: '40,20; 40,30', frames: 10, ease: 'linear', then: 'return', wait: 'true' });
assert.strictEqual(waited, 30, 'three legs of 10 frames (there and back)');
for (let i = 0; i < 10; i++) $gamePlayer.updateScroll(0, 0);
assert.ok(Math.abs($gameMap.displayX() - (40 - 8)) < 1e-9, 'at the first point after a leg');
for (let i = 0; i < 25; i++) $gamePlayer.updateScroll(0, 0);
assert.strictEqual(C.state().path, null, 'finished');
assert.ok(Math.abs($gameMap.displayX() - 22) < 1e-9 && Math.abs($gameMap.displayY() - 14) < 1e-9, 'back where it started');
commands.cameraPath2d.call({}, { points: '5,5', frames: 5, then: 'stay', wait: 'false' });
for (let i = 0; i < 10; i++) $gamePlayer.updateScroll(0, 0);
assert.ok(C.state().hold, 'stays');
$gamePlayer.updateScroll(0, 0);
assert.deepStrictEqual([$gameMap.displayX(), $gameMap.displayY()], [0, 0], 'held at the corner (clamped by the map)');
commands.cameraFollow2d.call({}, { target: 'player' });
assert.strictEqual(C.state().hold, null, 'follow lets it go');
assert.deepStrictEqual(C.parsePoints('1,2; 3 4 | x,y'), [{ x: 1, y: 2 }, { x: 3, y: 4 }]);
// A new map starts fresh; the 3D view keeps MZ's.
$gameMap._docsCam2d = { path: { points: [] }, follow: 3 };
Game_Map.prototype.setup.call($gameMap, 1);
assert.strictEqual($gameMap._docsCam2d, null);
console.log('✓ the camera: easing, region bounds, following an event, paths that come back or stay');

// 6. The map panel sections.
const html = D.Workspace.mapSections.map(sec => sec.render.call(D.Workspace, { cameraBounds: [5, 7], layers2d: [{ image: '#fog' }] })).join('');
assert.ok(html.includes('dd-cam2d-regions') && html.includes('5, 7') && html.includes('Fog Banks'));

console.log('=== Map layers, weather and the 2D camera passed ===');
