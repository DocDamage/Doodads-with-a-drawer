// scratch/test_audit_runtime.js
// The audit's game-side fixes: event waits that survive saving, no boarding from the air (and boats keep
// to water), a flyer's shadow on the ground, the region sound after loading inside a region, VFX that
// carry on after the menu, the boot waiting for the plugin's data (and surviving a broken file), the
// filter toggle, animation frames inside a packed region, late pictures, snow caps freed with their
// pictures, and the kept terrain settings.
const assert = require('assert');
const E = require('./engine/fake_engine');

console.log('=== Testing Audit Fixes (runtime) ===');

E.install();
E.setupWorld({ width: 20, height: 15, px: 5, py: 5 });
require('../Docs-Doodads.js');
const D = DocsDoodads;

// 1. Waiting for a character action or a VFX keeps ids on the interpreter, never live objects
// (interpreters are saved with the game; a character or a PIXI view would break the save).
const ev = new Game_Event(1, 4);
ev.locate(3, 3);
$gameMap._events = [null, null, null, null, ev];
$gameMap.event = id => $gameMap._events[id];
const interp = new Game_Interpreter();
interp._eventId = 4;
PluginManager.callCommand(interp, 'Docs-Doodads', 'characterAction', { target: 'this', sheet: 'Actor1', fps: '8', loops: '1', hold: 'false', wait: 'true' });
assert.strictEqual(interp._waitMode, 'docsAction');
assert.strictEqual(interp._docsWaitTarget, 4, 'the event by id');
assert.doesNotThrow(() => JSON.stringify(interp), 'the interpreter saves');
assert.strictEqual(interp.updateWaitMode(), true, 'waiting while the action plays');
ev._docsAction = null;
assert.strictEqual(interp.updateWaitMode(), false, 'done when it ends');
PluginManager.callCommand(interp, 'Docs-Doodads', 'characterAction', { target: 'player', sheet: 'Actor1', fps: '8', loops: '1', hold: 'false', wait: 'true' });
assert.strictEqual(interp._docsWaitTarget, 'player');
$gamePlayer._docsAction = null;
assert.strictEqual(interp.updateWaitMode(), false);
D.Vfx._playing = [];
PluginManager.callCommand(interp, 'Docs-Doodads', 'playVfx', { effect: 'explosion', target: 'tile', x: '2', y: '2', wait: 'true' });
assert.strictEqual(interp._waitMode, 'docsVfx');
assert.strictEqual(typeof interp._docsWaitVfx, 'number', 'the effect by number');
assert.doesNotThrow(() => JSON.stringify(interp));
assert.strictEqual(interp.updateWaitMode(), true);
D.Vfx._playing = [];
assert.strictEqual(interp.updateWaitMode(), false, 'after loading (no effects playing) the wait ends');
console.log('✓ waits keep ids: saves work, and a loaded game does not wait forever');

// 2. Flying: no boarding from the air; in a boat the vehicle decides where it can go.
const X = D.Traversal, p = $gamePlayer;
const boardHook = Game_Player.prototype.getOnVehicle;
const engineBoard = D.reWrite.Game_Player_getOnVehicle_traversal;
let boarded = 0;
D.reWrite.Game_Player_getOnVehicle_traversal = function() { boarded++; return true; };
p._docsFlying = true;
assert.strictEqual(boardHook.call(p), false, 'no boarding while flying');
assert.strictEqual(boarded, 0);
p._docsFlying = false;
assert.strictEqual(boardHook.call(p), true, 'on foot MZ boards as usual');
D.reWrite.Game_Player_getOnVehicle_traversal = engineBoard;
p.isInVehicle = () => true;
let asked = 0;
const enginePassable = D.reWrite.Game_Player_isMapPassable_traversal;
const realTraversalPassable = X.passable;
D.reWrite.Game_Player_isMapPassable_traversal = function() { asked++; return false; };
X.passable = () => true;
assert.strictEqual(p.isMapPassable(5, 5, 6), false, 'the boat decides, not swimming or climbing');
assert.strictEqual(asked, 1);
D.reWrite.Game_Player_isMapPassable_traversal = enginePassable;
X.passable = realTraversalPassable;
delete p.isInVehicle;
console.log('✓ no boarding from the air; vehicles keep to their own passability');

// 3. A flyer's sun shadow and reflection stay on the ground.
p._docsFlying = true;
p._docsFlyAlt = 40;
assert.strictEqual(X.liftOf(p), 40);
assert.strictEqual(X.liftOf(ev), 0, 'events are not lifted');
p._docsFlying = false;
p._docsFlyAlt = 0;
console.log('✓ lift for shadows and reflections');

// 4. Region sounds: leaving a region after loading a save made inside it goes back to the map's BGS,
// not the region's own sound again.
const RS = D.RegionSounds;
$dataMap.autoplayBgs = true;
$dataMap.bgs = { name: 'Wind', volume: 80, pitch: 100, pan: 0 };
AudioManager._currentBgs = { name: 'River', volume: 90, pitch: 100, pan: 0, pos: 3 };
const list = [{ region: 4, name: 'River' }];
assert.strictEqual(RS.bgsBefore(list).name, 'Wind', 'the playing sound is the region\'s own: the map\'s BGS');
AudioManager._currentBgs = { name: 'Town', volume: 90, pitch: 100, pan: 0, pos: 1 };
assert.strictEqual(RS.bgsBefore(list).name, 'Town', 'otherwise what was playing');
console.log('✓ region sound remembers the right BGS');

// 5. VFX started by Play VFX carry on from where they were after the menu.
D.Vfx._playing = [];
const ss = new Spriteset_Map();
const fx = D.Vfx.play({ id: 'heal', x: 100, y: 100 });
E.frames(ss, 20);
assert.ok(fx.time > 0.2, 'it has run: ' + fx.time);
const ran = fx.view._time;
const again = new Spriteset_Map();
assert.strictEqual(fx.view, null, 'a new map scene makes a new view');
E.frames(again, 1);
assert.ok(fx.view._time >= ran, 'the new view starts where the old one was: ' + fx.view._time + ' >= ' + ran);
fx.done = true;
E.frames(again, 1);
assert.ok(!D.Vfx._playing.includes(fx), 'finished effects go');
console.log('✓ VFX continue after the menu');

// 6. Boot: the game waits for the plugin's data files; a broken data file doesn't stop it.
const sent = [];
global.XMLHttpRequest = function() {};
XMLHttpRequest.prototype.open = function(m, url) { this.url = url; };
XMLHttpRequest.prototype.overrideMimeType = function() {};
XMLHttpRequest.prototype.send = function() { sent.push(this); };
const reply = (xhr, status, text) => { xhr.status = status; xhr.responseText = text; xhr.onload(); };
const warn = console.warn;
console.warn = () => {};
DataManager.loadDocsDoodadsData();
assert.strictEqual(DataManager.isDatabaseLoaded(), false, 'not before DocsDoodads.json is in');
reply(sent[0], 200, '{ "1": [ broken');
assert.deepStrictEqual(Object.keys(window.$dataDocsDoodads).filter(k => k !== 'mapSettings'), [], 'a broken file: the map starts without doodads');
const later = sent.slice(1);
assert.ok(later.length >= 1, 'then the manifests are asked for');
assert.strictEqual(DataManager.isDatabaseLoaded(), false, 'still waiting for them');
for (const xhr of later) reply(xhr, 404, '');
assert.strictEqual(DataManager.isDatabaseLoaded(), true);
console.warn = warn;
// The Aseprite manifest arriving clears gear looked up before it.
D.AsepriteVisuals._names.set('img/characters/hero.aseprite#sword', '');
sent.length = 0;
DataManager.loadDocsDoodadsAseprite();
reply(sent[0], 200, JSON.stringify({ refs: { 'img/characters/hero.aseprite#sword': 'hero_sword' } }));
assert.strictEqual(D.AsepriteVisuals._names.size, 0);
console.log('✓ boot waits for the data; a broken file is survived; late manifests refresh gear');

// 7. Filters: added and removed without copying the list every frame.
const sprite = new PIXI.Sprite();
const f1 = new PIXI.Filter(), f2 = new PIXI.Filter();
D.toggleFilter(sprite, f1, true);
const listed = sprite.filters;
D.toggleFilter(sprite, f1, true);
assert.strictEqual(sprite.filters, listed, 'already there: the same list');
D.toggleFilter(sprite, f2, true);
D.toggleFilter(sprite, f1, false);
assert.deepStrictEqual(sprite.filters, [f2]);
D.toggleFilter(sprite, f2, false);
assert.strictEqual(sprite.filters, null);
D.toggleFilter(sprite, null, false);
console.log('✓ filter toggle');

// 8. Doodad sprites: animation frames stay in a packed region; a late picture doesn't replace a newer one.
$dataDocsDoodads[1] = [E.doodad(2, 2, { xFrame: 4, yFrame: 1, frameW: 32, frameH: 32 })];
ss.addDocsDoodads();
const dd = ss._docsDoodadSprites[0];
dd._bmp = new Bitmap(512, 512);
dd._regionOrigin = { x: 100, y: 100 };
dd._regionSize = { w: 64, h: 32 };
dd.texture = new PIXI.Texture(dd._bmp._baseTexture, new PIXI.Rectangle(100, 100, 32, 32));
dd._currentFrame = 0;
dd.updateFrameAnimation();
assert.deepStrictEqual([dd.texture.frame.x, dd.texture.frame.width], [132, 32], 'frame 2 inside the region');
dd.updateFrameAnimation();
assert.deepStrictEqual([dd.texture.frame.x, dd.texture.frame.y], [100, 100], 'frame 3 was clipped off: the first frame instead of a neighbour');
const slow = new Bitmap(10, 10), fast = new Bitmap(20, 20);
let slowListener = null;
slow.isReady = () => false;
slow.addLoadListener = cb => { slowListener = cb; };
const realLoad = D.loadBitmap;
D.loadBitmap = path => path.includes('Slow') ? slow : fast;
dd._data.bit = [3, 'img/doodads/Slow.png'];
dd._seasonSource = null;
dd.loadTexture();
dd._data.bit = [3, 'img/doodads/Fast.png'];
dd._seasonSource = null;
dd.loadTexture();
assert.strictEqual(dd._bmp, fast);
slowListener();
assert.strictEqual(dd._bmp, fast, 'the older picture arriving later is ignored');
D.loadBitmap = realLoad;
console.log('✓ packed animation frames, late pictures');

// 9. Snow caps made from a stand-tile picture go with it.
const C = D.SnowCover;
C._caps = new Map();
const stand = new Bitmap(48, 96);
C._caps.set((stand._baseTexture.cacheId || stand._baseTexture.uid) + '|48', new PIXI.BaseTexture());
C._caps.set('other|48', new PIXI.BaseTexture());
C.dropCapsFor(stand._baseTexture);
assert.deepStrictEqual([...C._caps.keys()], ['other|48']);
console.log('✓ snow caps freed with their pictures');

// 10. Terrain settings: worked out once while they stay the same object in play; always in the editor.
const T = D.Terrain;
$dataDocsDoodads.mapSettings = $dataDocsDoodads.mapSettings || {};
$dataDocsDoodads.mapSettings[1] = { terrain: { enabled: true, mountain: 2 } };
const s1 = T.settingsFor(1), s2 = T.settingsFor(1);
assert.strictEqual(s1, s2, 'kept');
$dataDocsDoodads.mapSettings[1] = { terrain: { enabled: true, mountain: 3 } };
assert.strictEqual(T.settingsFor(1).mountain, 3, 'replaced settings are read again');
D.Workspace.mounted = true;
$dataDocsDoodads.mapSettings[1].terrain.mountain = 4;
assert.strictEqual(T.settingsFor(1).mountain, 4, 'the editor changes them in place: read every time');
D.Workspace.mounted = false;
console.log('✓ terrain settings kept in play');

console.log('=== Audit fixes (runtime) passed ===');
