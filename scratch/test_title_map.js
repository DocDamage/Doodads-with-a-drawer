'use strict';
const assert = require('assert');
const E = require('./engine/fake_engine');
E.install(); E.setupWorld({ width: 24, height: 18, px: 3, py: 4 });

// Native MZ owns these constructors. The stand-in keeps them deliberately small while preserving
// reference identity, so the title context cannot accidentally borrow the real/new-game objects.
class Game_Temp {
    isDestinationValid() { return false; }
    destinationX() { return 0; }
    destinationY() { return 0; }
    retrieveAnimation() { return null; }
    requestAnimation() {}
    requestBalloon() {}
}
class Game_System { constructor() { this._docsFeatureOff = {}; this._docsWind = null; this._docsExplored = {}; } isSideView() { return false; } mainFontFace() { return 'sans-serif'; } }
class Game_Screen {
    constructor() { this._weatherType = 'none'; this._weatherPower = 0; this.updates = 0; }
    changeWeather(type, power) { this._weatherType = type; this._weatherPower = power; }
    weatherType() { return this._weatherType; }
    weatherPower() { return this._weatherPower; }
    update() { this.updates++; }
    zoomScale() { return 1; } zoomX() { return 0; } zoomY() { return 0; }
    shake() { return 0; } brightness() { return 255; } picture() { return null; }
}
class Game_Timer {}
class Game_Message { isBusy() { return false; } }
class Game_Switches { constructor() { this._data = {}; } value(id) { return Boolean(this._data[id]); } setValue(id, value) { this._data[id] = Boolean(value); } }
class Game_Variables { constructor() { this._data = {}; } value(id) { return this._data[id] || 0; } setValue(id, value) { this._data[id] = value; } }
class Game_SelfSwitches { constructor() { this._data = {}; } value(key) { return Boolean(this._data[key]); } setValue(key, value) { this._data[key] = value; } }
class Game_Actors { actor() { return null; } }
class Game_Party { setupStartingMembers() { this.started = true; } members() { return []; } battleMembers() { return []; } allMembers() { return []; } leader() { return null; } }
class Game_Troop { members() { return []; } }
Object.assign(global, { Game_Temp, Game_System, Game_Screen, Game_Timer, Game_Message, Game_Switches,
    Game_Variables, Game_SelfSwitches, Game_Actors, Game_Party, Game_Troop });

const mapSetup = Game_Map.prototype.setup;
Game_Map.prototype.setup = function(mapId) {
    mapSetup.call(this, mapId);
    const event = new Game_Event(mapId, 1); event.locate(7, 8); event.animations = 0;
    event.updateAnimation = function() { this.animations++; };
    this._events = [null, event];
};
let unsafeMapUpdates = 0;
Game_Map.prototype.update = function() { unsafeMapUpdates++; throw new Error('title ran map event commands'); };
Game_Map.prototype.updateParallax = function() { this.parallaxUpdates = (this.parallaxUpdates || 0) + 1; };
Game_Map.prototype.refreshIfNeeded = function() { this.refreshChecks = (this.refreshChecks || 0) + 1; };
Game_Player.prototype.setTransparent = function(value) { this._transparent = Boolean(value); };

let loadId = 0, nativeUpdates = 0, nativeTerminates = 0, snapshots = 0, renderMap = null, throwRender = false;
DataManager.loadMapData = id => { loadId = id; global.$dataMap = null; };
DataManager.isMapLoaded = () => Boolean(global.$dataMap);
DataManager.setupNewGame = () => {
    global.$gameTemp = new Game_Temp(); global.$gameSystem = new Game_System(); global.$gameScreen = new Game_Screen();
    global.$gameTimer = new Game_Timer(); global.$gameMessage = new Game_Message(); global.$gameSwitches = new Game_Switches();
    global.$gameVariables = new Game_Variables(); global.$gameSelfSwitches = new Game_SelfSwitches(); global.$gameActors = new Game_Actors();
    global.$gameParty = new Game_Party(); global.$gameTroop = new Game_Troop(); global.$gameMap = new Game_Map(); global.$gamePlayer = new Game_Player();
    $gameParty.setupStartingMembers(); $gamePlayer.locate(11, 12); $gameSwitches.setValue(4, true); $gameSystem._docsClock = { minutes: 123, day: 2 };
};
class Scene_Title extends Scene_Base {
    create() {
        this.nativeCreates = (this.nativeCreates || 0) + 1;
        this._backSprite1 = new Sprite(); this._backSprite2 = new Sprite(); this._gameTitleSprite = new Sprite(); this._commandWindow = new Sprite();
        this.addChild(this._backSprite1); this.addChild(this._backSprite2); this.addChild(this._gameTitleSprite); this.addChild(this._commandWindow);
    }
    isReady() { return true; }
    update() {
        nativeUpdates++;
        for (const child of this.children) if (child && child.update) child.update();
        if (this.onNativeUpdate) this.onNativeUpdate();
    }
    terminate() { nativeTerminates++; SceneManager.snapForBackground(); }
}
global.Scene_Title = Scene_Title;
SceneManager.snapForBackground = () => { snapshots++; renderMap = $gameMap; if (throwRender) throw new Error('snapshot failed'); };

require('../Docs-Doodads.js');
const D = DocsDoodads, T = D.TitleMap, W = D.Workspace;
assert.ok(T, 'title-map settings and runtime exist');

// Pure settings are bounded, and a closed camera path returns to its first point rather than stopping.
D.World.set('title', { mapId: -3, x: 'bad', y: Infinity, time: -1, season: -4, weather: { type: 'lava', power: 99 }, pictures: 'bad' });
assert.deepStrictEqual(T.settings(), { mapId: 0, x: 0, y: 0, time: 1439, season: 0,
    weather: { type: 'none', power: 9 }, look: null, path: null, pictures: 'over' });
const loop = { mapId: 2, x: 1, y: 1, path: { points: [{ x: 1, y: 1 }, { x: 5, y: 1 }], frames: 10, ease: 'linear' } };
assert.deepStrictEqual(T.frame(loop, 0), { x: 1, y: 1 });
assert.deepStrictEqual(T.frame(loop, 10), { x: 5, y: 1 });
assert.deepStrictEqual(T.frame(loop, 20), { x: 1, y: 1 });

// Off means native title behavior only: no data load, extra sprite or global swap.
D.World.set('title', { mapId: 0 }); loadId = 0;
const off = new Scene_Title(), offMap = $gameMap;
off.create(); assert.strictEqual(loadId, 0); assert.strictEqual(off._docsTitleSpriteset, undefined);
off.update(); off.terminate(); assert.strictEqual($gameMap, offMap);

// A live title waits for its map, then restores the caller's database and every game object after setup.
DataManager.setupNewGame();
const newGameSummary = () => ({ player: [$gamePlayer.x, $gamePlayer.y], switch4: $gameSwitches.value(4),
    clock: JSON.parse(JSON.stringify($gameSystem._docsClock)), wind: $gameSystem._docsWind,
    explored: JSON.parse(JSON.stringify($gameSystem._docsExplored)) });
const cleanNewGame = newGameSummary();
const originalDataMap = $dataMap;
const original = ['$gameTemp','$gameSystem','$gameScreen','$gameMessage','$gameSwitches','$gameVariables','$gameActors','$gameParty','$gameTroop','$gameMap','$gamePlayer']
    .reduce((out, key) => (out[key] = global[key], out), {});
const callerClimate = { key: 'live-game', plan: { day: 8 }, fog: { image: '#fog', opacity: 0.6 },
    composite: { live: true }, power: 7, ownsWind: true, writing: false };
Object.assign(D.Climate, { _key: callerClimate.key, _plan: callerClimate.plan, _fog: callerClimate.fog,
    _fogComposite: callerClimate.composite, _fogPower: callerClimate.power,
    _ownsWind: callerClimate.ownsWind, _writing: callerClimate.writing });
const callerLampLevels = new WeakMap(), titleLamp = { x: 96, y: 96,
    light: { enabled: true, when: 'dark', radius: 96, intensity: 1, color: '#ffffff' } };
callerLampLevels.set(titleLamp, 0.37); D.Lighting._lampLevels = callerLampLevels;
const callerPostAnims = [{ type: 'bloomFlash', start: 0, duration: 30, strength: 1 }];
const callerPostResolved = { live: true };
Object.assign(D.PostFX, { _anims: callerPostAnims, _resolved: callerPostResolved, _runtimeFrame: 123 });
const assertCallerRenderState = label => {
    assert.strictEqual(D.Climate._key, callerClimate.key, label + ' climate key');
    assert.strictEqual(D.Climate._plan, callerClimate.plan, label + ' climate plan');
    assert.strictEqual(D.Climate._fog, callerClimate.fog, label + ' climate fog');
    assert.strictEqual(D.Climate._fogComposite, callerClimate.composite, label + ' climate composite');
    assert.strictEqual(D.Climate._fogPower, callerClimate.power, label + ' climate power');
    assert.strictEqual(D.Climate._ownsWind, callerClimate.ownsWind, label + ' climate wind ownership');
    assert.strictEqual(D.Climate._writing, callerClimate.writing, label + ' climate write guard');
    assert.strictEqual(D.Lighting._lampLevels, callerLampLevels, label + ' lamp cache identity');
    assert.strictEqual(callerLampLevels.get(titleLamp), 0.37, label + ' lamp cache value');
    assert.strictEqual(D.PostFX._anims, callerPostAnims, label + ' screen animation list');
    assert.strictEqual(D.PostFX._resolved, callerPostResolved, label + ' resolved look cache');
    assert.strictEqual(D.PostFX._runtimeFrame, 123, label + ' runtime look frame');
};
D.World.set('title', { mapId: 7, x: 6, y: 5, time: 1260, season: 2, weather: { type: 'storm', power: 6 },
    look: {}, path: { points: [{ x: 6, y: 5 }, { x: 10, y: 5 }], frames: 2, ease: 'linear' }, pictures: 'hide' });
D.World.set('climate.enabled', true);
$dataDocsDoodads.mapSettings[7] = { perspective: { enabled: true }, climate: 'none' };
const titleData = { width: 24, height: 18, data: originalDataMap.data.slice(), tilesetId: 1, scrollType: 2,
    events: [null, { id: 1, name: 'Decoration', note: '', x: 7, y: 8, pages: [{ list: [] }] }], note: '', parallaxName: '' };
const title = new Scene_Title(); title.create(); assert.strictEqual(loadId, 7); assert.strictEqual(title.isReady(), false);
global.$dataMap = titleData; assert.strictEqual(title.isReady(), true);
assert.strictEqual($dataMap, originalDataMap); for (const key of Object.keys(original)) assert.strictEqual(global[key], original[key], key + ' restored after setup');
assertCallerRenderState('after title setup');
assert.ok(title._docsTitleSpriteset instanceof Spriteset_Map); assert.strictEqual(title.children[0], title._docsTitleSpriteset, 'map is behind native title art');
assert.strictEqual(title._backSprite1.visible, false); assert.strictEqual(title._backSprite2.visible, false);
assert.strictEqual(title._docsTitleContext.$gamePlayer.isTransparent(), true); assert.strictEqual(title._docsTitleContext.$gamePlayer.x, 6);
T.withContext(title._docsTitleContext, () => assert.strictEqual(D.Perspective.active(), null, 'the first title-map release remains flat even if the map uses 3D'));
T.withContext(title._docsTitleContext, () => {
    assert.strictEqual(D.Climate._fog, null, 'a clear title does not inherit the live game fog');
    assert.notStrictEqual(D.Lighting._lampLevels, callerLampLevels, 'title lamps have their own fade cache');
    assert.notStrictEqual(D.PostFX._anims, callerPostAnims, 'title screen animations are isolated');
    D.Lighting.collect([titleLamp], { x: 0, y: 0 }, { darkness: 1, threshold: 0.3, step: 0.1 });
    D.Climate._fog = { image: '#title-fog' };
    D.PostFX._anims.push({ type: 'bloomFlash', start: 999999, duration: 30, strength: 1, center: [0.5, 0.5] });
    D.PostFX._resolved = { title: true }; D.PostFX._runtimeFrame = 456;
});
assertCallerRenderState('after title transient updates');

// Map event commands never update. Safe parallax, event animation, weather, path and the map sprites do.
title.onNativeUpdate = () => { assert.strictEqual($gameMap, original.$gameMap, 'native title commands run in the caller context'); };
const tileFrames = title._docsTitleSpriteset._tilemap.animationCount;
title.update();
assert.strictEqual(unsafeMapUpdates, 0); assert.ok(title._docsTitleContext.$gameMap.parallaxUpdates > 0);
assert.ok(title._docsTitleContext.$gameMap.events()[0].animations > 0); assert.ok(title._docsTitleContext.$gameScreen.updates > 0);
assert.ok(title._docsTitleSpriteset._tilemap.animationCount > tileFrames);
assert.strictEqual(title._docsTitleContext.$gameScreen.weatherType(), 'storm');
assert.strictEqual(title._docsTitleContext.$gameMap.displayX(), T.displayFor(T.frame(T.settings(), 1), title._docsTitleContext.$gameMap).x);
for (const key of Object.keys(original)) assert.strictEqual(global[key], original[key], key + ' restored after update');

// Renderer work sees the title context, and an exception still restores the real game.
let renderedEnvironment;
title._docsTitleSpriteset._render = () => {
    renderMap = $gameMap;
    renderedEnvironment = { data: $dataMap, minutes: D.Atmosphere.minutes(), season: D.Atmosphere.season(),
        weather: $gameScreen.weatherType(), look: $gameSystem._docsLook && $gameSystem._docsLook.current };
    if (throwRender) throw new Error('render failed');
};
renderMap = null; title.render(Graphics.app.renderer); assert.strictEqual(renderMap, title._docsTitleContext.$gameMap);
assert.deepStrictEqual(renderedEnvironment, { data: titleData, minutes: 1260, season: 2, weather: 'storm', look: {} });
throwRender = true; assert.throws(() => title.render(Graphics.app.renderer), /render failed/); throwRender = false;
assert.strictEqual($gameMap, original.$gameMap, 'render failure restores globals');
assertCallerRenderState('after render failure');

// New Game is invoked by the native command window outside the title context, before title terminate.
let madeNewGame = false;
title.onNativeUpdate = () => { if (!madeNewGame) { madeNewGame = true; DataManager.setupNewGame(); } };
title.update();
const newGame = { map: $gameMap, player: $gamePlayer, switches: $gameSwitches, system: $gameSystem };
assert.strictEqual(newGame.player.x, 11); assert.strictEqual(newGame.switches.value(4), true);
const titleMapAtSnapshot = title._docsTitleContext.$gameMap;
title.terminate(); assert.strictEqual(renderMap, titleMapAtSnapshot, 'native snapshot sees title objects');
assert.strictEqual($gameMap, newGame.map); assert.strictEqual($gamePlayer, newGame.player); assert.strictEqual($gameSystem._docsClock.minutes, 123);
assert.deepStrictEqual(newGameSummary(), cleanNewGame, 'title time, weather, wind, switches and explored tiles never reach New Game');
assertCallerRenderState('after New Game and title terminate');

// Throwing from native snapshot also restores the already-created New Game.
const failing = new Scene_Title(); failing.create(); global.$dataMap = titleData; failing.isReady();
DataManager.setupNewGame(); const failedNewMap = $gameMap; throwRender = true;
assert.throws(() => failing.terminate(), /snapshot failed/); throwRender = false; assert.strictEqual($gameMap, failedNewMap);

// The editor captures exactly what is visible as one undoable project setting, and exposes the Map command.
E.setupWorld({ width: 24, height: 18, px: 3, py: 4 });
$gameMap.setDisplayPos(2, 3); W.previewMinutes = 600; W.previewSeason = 1;
$gameScreen.changeWeather('rain', 4, 0); D.Camera2D.state().path = { points: [{ x: 4, y: 5 }, { x: 8, y: 5 }], frames: 90, ease: 'smooth' };
const undo = [], execute = D.Undo.execute; D.Undo.execute = command => { undo.push(command); command.apply(); };
assert.strictEqual(W.useThisViewAsTitle(), true); assert.strictEqual(undo.length, 1);
const captured = D.World.raw('title'); assert.strictEqual(captured.mapId, 1); assert.strictEqual(captured.time, 600); assert.strictEqual(captured.season, 1);
assert.deepStrictEqual(captured.weather, { type: 'rain', power: 4 }); assert.strictEqual(captured.path.frames, 90);
assert.ok(W.menus().find(menu => menu.id === 'map').items.some(item => item.id === 'dd-title-map-btn'));
undo[0].revert(); assert.notDeepStrictEqual(D.World.raw('title'), captured); D.Undo.execute = execute;

assert.ok(nativeUpdates >= 3 && nativeTerminates >= 3 && snapshots >= 3);
console.log('Title map: pure loop, isolated loading/update/render/snapshot/New Game, and editor capture passed.');
