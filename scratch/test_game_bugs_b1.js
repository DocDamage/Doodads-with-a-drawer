// scratch/test_game_bugs_b1.js
// The game-side bugs of the improvements plan (Part B, §8): sound variance off by default and only for
// map characters, Play SE aliased; the clock created only when it runs, earlier hours keeping the day;
// world state, touch and the API on other maps and across counters; ice, loop seams, dives, boats and
// the camera with Scroll Map; layer parallaxes, idle sheets and non-PNG pictures in deployed games,
// Change Tileset, and models found from the game's folder and not retried while drawing.
const assert = require('assert');
const path = require('path');
const E = require('./engine/fake_engine');

console.log('=== Testing Game Bugs (B1) ===');

E.install();
E.setupWorld({ width: 20, height: 15, px: 5, py: 5 });
$gameTemp.reserveCommonEvent = () => {};
$gameTemp.isCommonEventReserved = () => false;
// A plugin above Doc's Doodads that wraps Play SE.
const wrapped = [];
Game_Interpreter.prototype.command250 = function(params) {
    wrapped.push(params[0]);
    AudioManager.playSe(params[0]);
    return true;
};
require('../Docs-Doodads.js');
const D = DocsDoodads, SS = D.SpatialSound, X = D.Traversal;
const world = over => {
    $dataDocsDoodads.world = over;
    D.World._version++;
};
const quietly = fn => {
    const warn = console.warn, said = [];
    console.warn = m => said.push(String(m));
    try {
        return { value: fn(), said };
    } finally {
        console.warn = warn;
    }
};

// 1. Sound effects keep their authored pitch and volume unless variance is set, and only map characters
// are varied or placed. Play SE goes through the plugin that wrapped it first.
{
    const se = { name: 'Door1', volume: 90, pitch: 100, pan: 0 };
    assert.strictEqual(D.World.settings().sound.pitchVariance, 0, 'pitch variance is off by default');
    assert.strictEqual(D.World.settings().sound.volumeVariance, 0, 'volume variance is off by default');
    assert.deepStrictEqual(SS.vary(se, { mode: 'off', pitchVariance: 20, volumeVariance: 20 }, Math.random), se, 'mode off: no variance');
    world({ sound: { pitchVariance: 20, volumeVariance: 30 } });
    for (let i = 0; i < 20; i++) assert.deepStrictEqual(SS.forCharacter(se, null), se, 'no character (battle, menu): as authored');

    const ev = new Game_Event(1, 3);
    ev.locate(5, 5);
    $gameMap._events = [null, null, null, ev];
    const seen = new Set();
    for (let i = 0; i < 40; i++) seen.add(SS.forCharacter(se, ev).pitch);
    assert.ok(seen.size > 1, 'a map event with variance on varies');
    assert.deepStrictEqual(D.CharacterTags.parse('<no variance>'), { variance: false });
    $dataMap.events[3] = { id: 3, name: 'Bell', note: '<no variance>', pages: [{ list: [] }] };
    D.CharacterTags._cache = new WeakMap();
    for (let i = 0; i < 20; i++) assert.strictEqual(SS.forCharacter(se, ev).pitch, 100, '<no variance> keeps the pitch');

    const battle = new Game_Interpreter();
    wrapped.length = 0;
    battle.command250([se]);
    assert.deepStrictEqual(wrapped, [se], 'in battle the earlier plugin gets the authored sound');
    const mapInterp = new Game_Interpreter();
    mapInterp._mapId = $gameMap.mapId();
    mapInterp._eventId = 3;
    ev.locate(8, 5);
    wrapped.length = 0;
    mapInterp.command250([se]);
    assert.strictEqual(wrapped.length, 1, 'a map event still runs the earlier plugin');
    assert.ok(wrapped[0].pan > 0 && wrapped[0].volume < 90, 'with the sound placed where the event stands');
    world({});
    $dataMap.events[3] = undefined;
    $gameMap._events = [null];
    console.log('✓ sound variance off by default, only for map characters; Play SE aliased');
}

// 2. The clock: reading it never adds one to the save; Set Time keeps the day; Pass Time over midnight
// starts the next.
{
    const A = D.Atmosphere;
    delete $gameSystem._docsClock;
    assert.strictEqual(A.clock(), null, 'day and night off: no clock');
    A.env();
    A.minutes();
    assert.strictEqual($gameSystem._docsClock, undefined, 'reading the time stores nothing');
    world({ time: { source: 'clock', startHour: 6 } });
    assert.strictEqual(A.minutes(), 360, 'before it runs, the start hour');
    assert.strictEqual($gameSystem._docsClock, undefined, 'still nothing stored');
    world({ time: { source: 'clock', startHour: 9 } });
    assert.strictEqual(A.minutes(), 540, 'the start hour is not frozen by an early read');
    A.update(true);
    assert.ok($gameSystem._docsClock, 'running the clock stores it');
    D.api.setTime(23, 0);
    D.api.setTime(22, 0);
    assert.strictEqual($gameSystem._docsClock.day, 0, '22:00 from 23:00 is the same day');
    assert.strictEqual(D.api.time(), 22 * 60);
    D.api.addTime(3);
    assert.strictEqual($gameSystem._docsClock.day, 1, 'Pass Time past midnight is the next day');
    assert.strictEqual(D.api.time(), 60);
    D.api.setTime(7, 30, 5);
    assert.strictEqual($gameSystem._docsClock.day, 5, 'Set Time with a day');
    PluginManager.callCommand(new Game_Interpreter(), 'Docs-Doodads', 'setTime', { hour: '6', minute: '0', day: '' });
    assert.strictEqual($gameSystem._docsClock.day, 5, 'a blank day keeps it');
    PluginManager.callCommand(new Game_Interpreter(), 'Docs-Doodads', 'addTime', { hours: '1', minutes: '0' });
    assert.strictEqual(D.api.time(), 7 * 60);
    world({});
    delete $gameSystem._docsClock;
    console.log('✓ clock created only when it runs; earlier hours keep the day');
}

// 3. World state on another map, unknown states, Store Doodad State's map, and the touch payload.
{
    const W = D.WorldState;
    const lamp = (mapId, tx) => E.doodad(tx, 4, { name: 'Lamp', uid: 'lamp' + mapId, light: { enabled: true, radius: 80 },
        states: { by: 'events', list: [{ name: 'Lit' }, { name: 'Out', light: false }] } });
    $dataDocsDoodads[1] = [lamp(1, 4)];
    $dataDocsDoodads[2] = [lamp(2, 7)];
    $gameSystem._docsWorldState = null;
    W.setLight('Lamp', false, 2);
    assert.strictEqual(W.light('Lamp', 2), false, "another map's light is that map's");
    assert.strictEqual(W.light('Lamp', 1), true, "this map's stays on");
    const bad = quietly(() => W.setState('Lamp', 'Smashed', 1));
    assert.strictEqual(bad.value, false, 'a state the doodad does not have is refused');
    assert.ok(/Lit, Out/.test(bad.said[0]), 'the warning lists its states: ' + bad.said[0]);
    assert.deepStrictEqual(W.store().states, {}, 'nothing saved for it');
    assert.strictEqual(quietly(() => W.setState('Nobody', 'Out', 2)).value, false, 'no doodad by that name on a loaded map');
    assert.strictEqual(W.setState('Lamp', 'Out', 2), true);
    assert.strictEqual(W.state('Lamp', 2), 'Out');
    assert.strictEqual(W.state('Lamp', 1), 'Lit');
    PluginManager.callCommand(new Game_Interpreter(), 'Docs-Doodads', 'storeDoodadState', { name: 'Lamp', variableId: '4', mapId: '2' });
    assert.strictEqual($gameVariables.value(4), 1, 'Store Doodad State reads the map asked for');
    PluginManager.callCommand(new Game_Interpreter(), 'Docs-Doodads', 'storeDoodadState', { name: 'Lamp', variableId: '4', mapId: '0' });
    assert.strictEqual($gameVariables.value(4), 0, 'and this map by default');
    PluginManager.callCommand(new Game_Interpreter(), 'Docs-Doodads', 'storeDoodadState', { name: 'Nobody', variableId: '4' });
    assert.strictEqual($gameVariables.value(4), -1);

    // A touchable doodad behind a counter: the player faces up from (5, 7), the counter is at (5, 6).
    const sign = E.doodad(5, 5, { name: 'Sign', uid: 'sign', touch: { commonEventId: 3, trigger: 'action' } });
    $dataDocsDoodads[1] = [sign];
    const touches = [];
    const off = D.api.on('touch', t => touches.push(t));
    $gamePlayer.locate(5, 7);
    $gamePlayer.setDirection(8);
    $gameMap.isCounter = (x, y) => x === 5 && y === 6;
    Graphics.frameCount += 10;
    $gamePlayer.checkEventTriggerThere([0]);
    assert.strictEqual(touches.length, 1, 'touched across the counter');
    assert.deepStrictEqual([touches[0].x, touches[0].y, touches[0].mapId], [5, 5, 1], 'the payload says where');
    assert.deepStrictEqual([$gameTemp._docsTouched.x, $gameTemp._docsTouched.y], [5, 5]);
    $gameMap.isCounter = () => false;
    Graphics.frameCount += 10;
    $gamePlayer.checkEventTriggerThere([0]);
    assert.strictEqual(touches.length, 1, 'no counter, no reach');
    off();
    $dataDocsDoodads[1] = [];
    delete $dataDocsDoodads[2];
    $gameSystem._docsWorldState = null;
    console.log('✓ world state on other maps, unknown states refused, Store Doodad State by map, touch over counters');
}

// 4. The API: sizes from the picture, remove on one map, colours in any case, unknown templates.
{
    const placed = D.api.place({ art: 'img/doodads/NotIndexed.png', x: 2, y: 2, frameW: 32 });
    assert.strictEqual(placed.frameW, 32, 'the width given');
    assert.strictEqual(placed.frameH, 96, "the height from the picture (it isn't in the library)");
    const old = E.doodad(3, 3, { name: 'Crate', frameW: 48, frameH: 24, frameX: 48 });
    $dataDocsDoodads[1].push(old);
    D.api.set('Crate', { art: 'img/doodads/Barrel.png' });
    assert.deepStrictEqual([old.frameW, old.frameH, old.frameX], [96, 96, 0], 'a new picture at its own size');
    D.api.set('Crate', { art: 'img/doodads/Barrel2.png', frameW: 40, frameH: 30 });
    assert.deepStrictEqual([old.frameW, old.frameH], [40, 30], 'or the size given with it');
    $dataDocsDoodads[2] = [E.doodad(3, 3, { name: 'Crate', uid: 'crate2' })];
    assert.strictEqual(D.api.remove('Crate'), 1);
    assert.strictEqual($dataDocsDoodads[2].length, 1, "another map's Crate stays");
    assert.strictEqual(D.api.remove('Crate', 2), 1, 'and goes when its map is named');
    delete $dataDocsDoodads[2];
    $dataDocsDoodads[1] = [];

    const actor = $gameActors.actor(1);
    const color = args => PluginManager.callCommand(new Game_Interpreter(), 'Docs-Doodads', 'setVisualColor', Object.assign({ actor: 'leader' }, args));
    color({ part: 'Hair', hue: '40', tint: '' });
    assert.deepStrictEqual(Object.keys(actor._docsVisual.colors), ['hair']);
    color({ part: 'HAIR', hue: '80', tint: '' });
    assert.strictEqual(actor._docsVisual.colors.hair.hue, 80, 'one colour per part, whatever the case');
    color({ part: 'hair', reset: 'true' });
    assert.deepStrictEqual(actor._docsVisual.colors, {}, 'reset in another case removes it');
    delete actor._docsVisual;

    assert.strictEqual(D.EventTemplates.get('custom_gone'), null, 'a deleted template is not an NPC');
    assert.ok(D.EventTemplates.get('npc'));
    console.log('✓ API sizes, remove per map, visual colours in any case, unknown templates');
}

// 5. Ice waits for messages; jumps over a looping edge land on the map; dives check the map; boats sail
// past doodads.
{
    const p = $gamePlayer;
    const can = X.can, isIce = X.isIce;
    X.can = kind => kind === 'ice' || kind === 'jump' || kind === 'dive';
    X.isIce = () => true;
    p.locate(5, 5);
    p._docsSlideDir = 6;
    p.canMove = () => false;
    p.moveByInput();
    assert.strictEqual(p.x, 5, 'no sliding while a message is open');
    assert.strictEqual(p._docsSlideDir, 6, 'the slide waits');
    delete p.canMove;
    p.moveByInput();
    assert.strictEqual(p.x, 6, 'then carries on');
    p._docsSlideDir = null;

    $dataMap.scrollType = 2;
    X.isIce = () => false;
    p.locate(19, 5);
    p.setDirection(6);
    world({ traversal: { jump: { enabled: true, distance: 2 } } });
    assert.strictEqual(X.jump(), true);
    assert.strictEqual(p.x, 0, 'the jump over the edge lands inside the map');
    assert.strictEqual(p._realX, -1, 'drawn from just before the edge, as a step over it is');
    while (p.isJumping()) p.update();
    assert.strictEqual(p._realX, 0);
    $dataMap.scrollType = 0;

    const isSwimming = X.isSwimming;
    X.isSwimming = () => true;
    $dataDocsDoodads.mapSettings[1] = { diveMap: 9 };
    global.$dataMapInfos = [null, { id: 1 }, { id: 2 }];
    let buzz = 0;
    SoundManager.playBuzzer = () => buzz++;
    const missing = quietly(() => X.dive());
    assert.strictEqual(missing.value, false, 'no dive to a map that does not exist');
    assert.strictEqual(buzz, 1);
    assert.ok(!p.isTransferring());
    $dataDocsDoodads.mapSettings[1] = { diveMap: 2 };
    p.locate(18, 5);
    assert.strictEqual(X.dive(), true);
    p._x = 30;
    p.performTransfer();
    assert.ok($gameMap.isValid(p.x, p.y), 'kept inside a smaller map on arrival');
    assert.strictEqual(p.x, 19);
    X.isSwimming = isSwimming;
    $dataDocsDoodads.mapSettings[1] = {};
    X.can = can;
    X.isIce = isIce;
    world({});

    const rock = E.doodad(8, 5, { collision: { preset: 'full', shape: null }, frameW: 48, frameH: 48 });
    $dataDocsDoodads[1] = [rock];
    p.locate(7, 5);
    assert.strictEqual(p.canPass(7, 5, 6), false, 'on foot the rock blocks');
    p._vehicleType = 'boat';
    assert.strictEqual(p.canPass(7, 5, 6), true, 'a boat sails past');
    p._vehicleType = 'ship';
    assert.strictEqual(p.canPass(7, 5, 6), true, 'so does a ship');
    rock.collision.vehicles = true;
    assert.strictEqual(p.canPass(7, 5, 6), false, 'unless the doodad blocks boats and ships');
    p._vehicleType = 'walk';
    $dataDocsDoodads[1] = [];
    console.log('✓ ice waits, loop-seam jumps, dives to missing maps, boats past doodads');
}

// 6. The eased 2D camera leaves Scroll Map (and a script's setDisplayPos) alone until the player moves,
// and 2D Camera Follow > Nothing keeps it put.
{
    const p = $gamePlayer;
    // The screen is 17 tiles wide on a 20-tile map: the camera's left edge goes from 0 to 3.
    world({ camera2d: { smooth: 0 } });
    $dataDocsDoodads.mapSettings[1] = { cameraBounds: [0] };
    p.locate(9, 7);
    $gameMap.setDisplayPos(0, 0);
    D.Camera2D._external = false;
    $gameMap._docsCam2d = null;
    p.updateScroll(0, 0);
    assert.strictEqual($gameMap.displayX(), 1, 'the camera follows the player');
    $gameMap._scrollRest = 4;
    $gameMap._displayX = 3;
    p.updateScroll(0, 0);
    assert.strictEqual($gameMap.displayX(), 3, 'Scroll Map is not dragged back');
    $gameMap._scrollRest = 0;
    p.updateScroll(0, 0);
    assert.strictEqual($gameMap.displayX(), 3, 'and stays after it until the player moves');
    p.locate(10, 7);
    p.updateScroll(0, 0);
    assert.strictEqual($gameMap.displayX(), 2, 'a step brings the camera back');
    $gameMap.setDisplayPos(0, 0);
    p.updateScroll(0, 0);
    assert.strictEqual($gameMap.displayX(), 0, "a script's display position is kept too");
    p.locate(11, 7);
    p.updateScroll(0, 0);
    assert.strictEqual($gameMap.displayX(), 3);
    const follow = target => PluginManager.callCommand(new Game_Interpreter(), 'Docs-Doodads', 'cameraFollow2d', { target, eventId: '0' });
    follow('free');
    $gameMap._displayX = 0;
    p.locate(10, 7);
    p.updateScroll(0, 0);
    assert.strictEqual($gameMap.displayX(), 0, 'Follow: Nothing holds even when the player moves');
    follow('player');
    p.updateScroll(0, 0);
    assert.strictEqual($gameMap.displayX(), 2, 'Follow: the player again');
    $dataDocsDoodads.mapSettings[1] = {};
    $gameMap._docsCam2d = null;
    world({});
    console.log('✓ the 2D camera and Scroll Map');
}

// 7. Deployed games: a missing layer parallax or idle sheet is skipped, not a stop; JPEG and WebP doodads
// load by their own name; Change Tileset; models from the game's folder.
{
    const MA = D.MissingArt;
    const sky = D.loadImgTracked('img/parallaxes/', 'GoneSky');
    sky.isError = () => true;
    const sheet = D.loadImgTracked('img/characters/', 'Gone_idle');
    sheet.isError = () => true;
    const warned = quietly(() => assert.doesNotThrow(() => ImageManager.isReady(), 'no Failed to load screen')).said;
    assert.strictEqual(warned.length, 2);
    assert.ok(MA.isMissing('img/parallaxes/', 'GoneSky') && MA.isMissing('img/characters/', 'Gone_idle'));
    assert.strictEqual(D.loadImgTracked('img/parallaxes/', 'GoneSky'), null, 'not asked for again');

    const ss = new Spriteset_Map();
    $dataDocsDoodads.mapSettings[1] = { layers2d: [{ image: 'GoneSky' }, { image: 'Clouds' }] };
    ss.updateDocsLayers2d(true);
    assert.strictEqual(ss._docsLayers2d.length, 1, 'the missing layer is left out, the other shown');
    $dataDocsDoodads.mapSettings[1] = {};
    const ch = new Sprite_Character($gamePlayer);
    assert.strictEqual(ch.docsAnimSheet('Gone_idle'), null, 'a missing idle sheet: the walk sheet instead');
    assert.ok(ch.docsAnimSheet('Actor1_idle'), 'one that is there loads');

    const jpg = D.loadBitmap('img/doodads/Rock.jpg');
    assert.ok(ImageManager._cache['img/doodads/Rock.jpg'] === jpg, 'a JPEG is asked for as .jpg, not .png');
    const hasEncrypted = Utils.hasEncryptedImages;
    const image = global.Image;
    Utils.hasEncryptedImages = () => true;
    global.Image = class { set src(v) { this._src = v; } get src() { return this._src; } };
    Bitmap.prototype.initialize = function() {};
    Bitmap.prototype._onLoad = function() {};
    Bitmap.prototype._onError = function() {};
    const webp = D.loadBitmap('img/doodads/Moss.webp');
    assert.strictEqual(webp._image.src, 'img/doodads/Moss.webp', 'an encrypted game reads it as it is (MZ encrypts only PNG)');
    assert.strictEqual(ImageManager._cache['img/doodads/Moss.webp'], webp);
    Utils.hasEncryptedImages = hasEncrypted;
    global.Image = image;
    delete Bitmap.prototype.initialize;
    delete Bitmap.prototype._onLoad;
    delete Bitmap.prototype._onError;

    $dataDocsDoodads[1] = [E.doodad(4, 4, { bit: [2, 5], uid: 'tiledoodad' }), E.doodad(6, 4)];
    const map = new Spriteset_Map();
    const tileSprite = map._docsDoodadSprites.find(s => s._data.uid === 'tiledoodad');
    const before = tileSprite._pendingBmp;
    $dataTilesets[2] = Object.assign({}, $dataTilesets[1], { id: 2, tilesetNames: ['', '', '', '', '', 'Inside_B', '', '', ''] });
    $gameMap.tileset = () => $dataTilesets[2];
    $gameMap.tilesetId = () => 2;
    map.loadTileset();
    assert.notStrictEqual(tileSprite._pendingBmp, before, 'a tileset doodad takes the new tileset');
    assert.strictEqual(tileSprite._pendingBmp, ImageManager.loadTileset('Inside_B'));
    $dataDocsDoodads[1] = [];

    assert.strictEqual(D.Models.root(), path.dirname(process.mainModule.filename), "models resolve from the game's folder");
    assert.strictEqual(D.Models.retryAfter, undefined, 'no timed retry from the draw loop');
    console.log('✓ missing layers and sheets skipped, non-PNG pictures, Change Tileset, model folder');
}

console.log('=== Game Bugs (B1) passed ===');
