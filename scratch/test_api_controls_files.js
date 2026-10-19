// scratch/test_api_controls_files.js
// The public API (finding, placing, moving and changing doodads; states, lights, clock, season and
// ambient; events for other plugins), gamepad and on-screen traversal buttons, and the doodad data
// files (keys in a fixed order, one file per map, read back for the game and the editor).
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const E = require('./engine/fake_engine');

console.log('=== Testing the Public API, Traversal Buttons and Data Files ===');

E.install();
E.setupWorld({ width: 20, height: 15, px: 5, py: 5 });
$gameTemp.reserveCommonEvent = () => {};
$gameTemp.isCommonEventReserved = () => false;
// What the stand-in engine leaves out of MZ.
Bitmap.prototype.drawCircle = function(x, y, r, color) { (this._circles = this._circles || []).push(color); };
global.Sprite_Clickable = class extends Sprite {
    constructor() { super(); this._pressed = false; this._touched = false; }
    isPressed() { return this._pressed; }
    isBeingTouched() { return this._touched; }
};
let mzButtonPressed = false;
Scene_Map.prototype.createDisplayObjects = function() { this._created = true; };
Scene_Map.prototype.isAnyButtonPressed = function() { return mzButtonPressed; };
Input.gamepadMapper = { 0: 'ok', 1: 'cancel', 2: 'shift', 3: 'menu', 4: 'pageup', 5: 'pagedown', 12: 'up' };
require('../Docs-Doodads.js');
const D = DocsDoodads, api = D.api, X = D.Traversal, F = D.DataFiles;

(async () => {
    // 1. Finding doodads.
    const lamp = E.doodad(3, 4, { name: 'Street Lamp', uid: 'dd_l1', bit: [3, 'img/doodads/Lamp.png'], light: { enabled: true },
        states: { list: [{ name: 'Lit' }, { name: 'Out', light: false }] } });
    const lamp2 = E.doodad(8, 4, { name: 'street lamp', uid: 'dd_l2', bit: [3, 'img/doodads/Lamp.png'] });
    const rock = E.doodad(6, 6, { uid: 'dd_rock', bit: [3, 'img/doodads/Rock.png'] });
    $dataDocsDoodads[1] = [lamp, lamp2, rock];
    assert.deepStrictEqual(api.find('Street Lamp'), [lamp, lamp2], 'by name, any case');
    assert.deepStrictEqual(api.find({ art: 'rock' }), [rock]);
    assert.deepStrictEqual(api.find({ uid: 'dd_l2' }), [lamp2]);
    assert.deepStrictEqual(api.find({ near: { x: 6, y: 6 } }), [rock], 'near a tile');
    assert.deepStrictEqual(api.find({ near: { x: 5, y: 4 } }).length, 0);
    assert.deepStrictEqual(api.find({ near: { x: 5, y: 4, radius: 3 } }), [lamp, lamp2, rock], 'within 3 tiles');
    assert.deepStrictEqual(api.find({ near: { x: 5, y: 4, radius: 2 } }), [lamp]);
    assert.deepStrictEqual(api.find({ where: d => d.light }), [lamp]);
    assert.deepStrictEqual(api.find(rock), [rock], 'a doodad finds itself');
    assert.strictEqual(api.get('nobody'), null);
    assert.deepStrictEqual(api.tileOf(rock), { x: 6, y: 6 });
    assert.strictEqual(api.tileOf('nobody'), null);
    assert.strictEqual(api.doodads().length, 3);
    assert.strictEqual(api.doodads(9).length, 0);
    console.log('✓ find by name, art, id, place and test; get; tileOf');

    // 2. Placing, moving, changing and removing (the game's copy only).
    const scene = new Scene_Map();
    const ss = new Spriteset_Map();
    scene._spriteset = ss;
    SceneManager._scene = scene;
    let rebuilt = 0;
    const realAdd = ss.addDocsDoodads.bind(ss);
    ss.addDocsDoodads = () => { rebuilt++; realAdd(); };
    D.AssetIndex.data = { assets: { 'img/doodads/barrel.png': { width: 40, height: 50 } } };
    const barrel = api.place({ art: 'img/doodads/Barrel.png', x: 2, y: 3, name: 'Barrel', opacity: 0.5 });
    assert.ok(barrel.temp && barrel.uid, 'placed doodads are temporary');
    assert.deepStrictEqual([barrel.x, barrel.y, barrel.frameW, barrel.frameH, barrel.opacity, barrel.name], [2 * 48 + 24, 3 * 48 + 48, 40, 50, 0.5, 'Barrel']);
    assert.ok($dataDocsDoodads[1].includes(barrel));
    assert.ok(ss._docsDoodadSprites.some(s => s._data === barrel), 'and drawn at once');
    const crate = api.place({ art: 'img/doodads/Crate.png', x: 100, y: 200, tiles: false });
    assert.deepStrictEqual([crate.x, crate.y], [100, 200], 'pixels');
    assert.ok(crate.frameW > 0, 'its size comes from the picture');
    assert.strictEqual(api.place({}), null, 'no art, no doodad');
    const other = api.place({ art: 'img/doodads/Crate.png', x: 1, y: 1, mapId: 4 });
    assert.ok($dataDocsDoodads[4].includes(other) && !$dataDocsDoodads[1].includes(other), 'another map');
    assert.strictEqual(api.move('Barrel', 5, 5), 1);
    assert.deepStrictEqual([barrel.x, barrel.y], [5 * 48 + 24, 5 * 48 + 48]);
    api.move('Barrel', 1, -1, { relative: true });
    assert.deepStrictEqual([barrel.x, barrel.y], [6 * 48 + 24, 4 * 48 + 48]);
    api.move(barrel, 10, 20, { tiles: false, relative: true });
    assert.deepStrictEqual([barrel.x, barrel.y], [6 * 48 + 34, 4 * 48 + 68]);
    const before = rebuilt;
    assert.strictEqual(api.set('Barrel', { art: 'img/doodads/Keg.png', opacity: 1 }), 1);
    assert.deepStrictEqual([barrel.bit[1], barrel.opacity], ['img/doodads/Keg.png', 1]);
    assert.ok(rebuilt > before, 'a new picture redraws');
    assert.strictEqual(api.set('nobody', { opacity: 0 }), 0);
    assert.strictEqual(api.remove(crate), 1);
    assert.ok(!$dataDocsDoodads[1].includes(crate));
    assert.strictEqual(api.remove('nobody'), 0);
    console.log('✓ place (tiles or pixels, another map), move, set and remove');

    // 3. States, lights and events for other plugins.
    const heard = [];
    const stop = api.on('state', e => heard.push(['state', e.name, e.state]));
    api.on('light', e => heard.push(['light', e.name, e.on]));
    api.on('touch', e => heard.push(['touch', e.doodad.name]));
    const stopBroken = api.on('state', () => { throw new Error('a broken listener'); });
    const warn = console.warn;
    const warned = [];
    console.warn = (...a) => warned.push(a.join(' '));
    assert.ok(api.setState('Street Lamp', 'Out'));
    assert.strictEqual(api.state('Street Lamp'), 'Out');
    assert.deepStrictEqual(api.stateNames('Street Lamp'), ['Lit', 'Out']);
    assert.deepStrictEqual(api.stateNames('nobody'), []);
    assert.strictEqual(api.light('Street Lamp'), false, 'the Out state has no light');
    api.setLight('Street Lamp', true);
    assert.strictEqual(api.light('Street Lamp'), true);
    lamp.touch = { commonEventId: 2 };
    D.Touch.run(lamp);
    assert.deepStrictEqual(heard, [['state', 'Street Lamp', 'Out'], ['light', 'Street Lamp', true], ['touch', 'Street Lamp']]);
    assert.ok(warned.some(w => /"state" listener failed/.test(w)), 'a failing listener is reported, not thrown');
    console.warn = warn;
    stop();
    stopBroken();
    api.setState('Street Lamp', '');
    assert.strictEqual(heard.length, 3, 'off() stops it');
    assert.strictEqual(typeof api.on('x', null), 'function');
    console.log('✓ states, lights and events (state, light, touch)');

    // 4. Clock, season and ambient.
    const world = D.World.settings();
    world.time.source = 'clock';
    $gameSystem._docsClock = { minutes: 600, day: 0 };
    D.Atmosphere.clock = () => $gameSystem._docsClock;
    api.setTime(18, 30);
    assert.strictEqual($gameSystem._docsClock.minutes, 18 * 60 + 30);
    api.addTime(1, 15);
    assert.strictEqual($gameSystem._docsClock.minutes, 19 * 60 + 45);
    const realMinutes = D.Atmosphere.minutes;
    D.Atmosphere.minutes = () => null;
    assert.strictEqual(api.time(), null, 'clock off');
    D.Atmosphere.minutes = () => 75;
    assert.strictEqual(api.time(), 75);
    D.Atmosphere.minutes = realMinutes;
    world.seasons.source = 'system';
    assert.ok(api.setSeason(2));
    assert.strictEqual($gameSystem._docsSeason, 2);
    const names = world.seasons.names;
    assert.ok(api.setSeason(String(names[1]).toUpperCase()), 'by name');
    assert.strictEqual($gameSystem._docsSeason, 1);
    assert.ok(!api.setSeason('Monsoon'));
    const realSeason = D.Atmosphere.season;
    D.Atmosphere.season = () => 3;
    assert.strictEqual(api.season(), 3);
    assert.strictEqual(api.seasonName(), names[3] || '');
    D.Atmosphere.season = realSeason;
    const fade = api.ambient(0.7, '#102040', 30);
    assert.ok(fade && $gameSystem._docsAmbientFade === fade && !fade.clearWhenDone);
    const reset = api.ambient(null);
    assert.ok(reset.clearWhenDone, 'null goes back to the map\'s own');
    console.log('✓ clock, season (by number or name) and ambient');

    // 5. Gamepad buttons.
    X.syncPad();
    assert.strictEqual(Input.gamepadMapper[7], 'docsJump');
    assert.strictEqual(Input.gamepadMapper[6], 'docsFly');
    world.traversal.controls = { padJump: 10, padFly: -1, buttons: 'touch', size: 72 };
    X.syncPad();
    assert.strictEqual(Input.gamepadMapper[10], 'docsJump');
    assert.ok(!(7 in Input.gamepadMapper) && !(6 in Input.gamepadMapper), 'buttons it no longer uses are given back');
    world.traversal.controls = { padJump: 5, padFly: 5 };
    X.syncPad();
    assert.strictEqual(Input.gamepadMapper[5], 'docsJump', 'one button can only do one thing');
    world.traversal.controls = { padJump: 7, padFly: 6 };
    X.syncPad();
    assert.strictEqual(Input.gamepadMapper[5], 'pagedown', 'and what it did before comes back');
    assert.strictEqual(Input.gamepadMapper[10], undefined);
    console.log('✓ gamepad: jump and fly buttons, given back when changed');

    // 6. On-screen buttons.
    world.traversal.controls = { buttons: 'never' };
    assert.ok(!X.showButtons());
    world.traversal.controls = { buttons: 'always' };
    assert.ok(X.showButtons());
    world.traversal.controls = { buttons: 'touch' };
    Utils.isMobileDevice = () => true;
    assert.ok(X.showButtons(), 'touch screens');
    Utils.isMobileDevice = () => false;
    assert.ok(!X.showButtons() || Number(navigator.maxTouchPoints) > 0);
    world.traversal.controls = { buttons: 'always', size: 64 };
    assert.deepStrictEqual(X.buttonActions(), [], 'nothing learned: no buttons');
    world.traversal.jump.enabled = true;
    world.traversal.fly.enabled = true;
    assert.deepStrictEqual(X.buttonActions().map(a => a.label), ['Jump', 'Fly']);
    $gamePlayer._docsFlying = true;
    assert.deepStrictEqual(X.buttonActions().map(a => a.label), ['Land'], 'flying: only Land');
    $gamePlayer._docsFlying = false;
    const map = new Scene_Map();
    map.createDisplayObjects();
    assert.ok(map._created && map._docsTravelButtons.length === 2);
    map.updateDocsTravelButtons();
    const [jumpBtn, flyBtn] = map._docsTravelButtons;
    assert.ok(jumpBtn.visible && flyBtn.visible);
    assert.strictEqual(jumpBtn._docsLabel, 'Jump');
    assert.strictEqual(jumpBtn.x, Graphics.boxWidth - 64 - 16, 'Jump in the corner');
    assert.strictEqual(flyBtn.x, Graphics.boxWidth - 64 - 16 - 76, 'Fly beside it');
    assert.strictEqual(jumpBtn.bitmap.width, 64);
    $gameMessage.isBusy = () => true;
    map.updateDocsTravelButtons();
    assert.ok(!jumpBtn.visible && !flyBtn.visible, 'hidden while a message shows');
    $gameMessage.isBusy = () => false;
    map.updateDocsTravelButtons();
    // A tap on a button never walks the player there; MZ's own buttons still count.
    assert.ok(!map.isAnyButtonPressed());
    flyBtn._touched = true;
    assert.ok(map.isAnyButtonPressed());
    flyBtn._touched = false;
    mzButtonPressed = true;
    assert.ok(map.isAnyButtonPressed());
    mzButtonPressed = false;
    jumpBtn.visible = false;
    jumpBtn._touched = true;
    assert.ok(!map.isAnyButtonPressed(), 'hidden buttons are never touched');
    jumpBtn._touched = false;
    flyBtn.onClick();
    assert.ok($gamePlayer._docsFlying, 'Fly takes off');
    map.updateDocsTravelButtons();
    assert.strictEqual(flyBtn._docsLabel, 'Land');
    jumpBtn.update();
    $gameMap.isEventRunning = () => true;
    assert.ok(!X.pressButton('fly'), 'not while an event runs');
    $gameMap.isEventRunning = () => false;
    assert.ok(!X.pressButton('nothing'));
    $gamePlayer._docsFlying = false;
    console.log('✓ on-screen buttons: when to show, labels, places, taps');

    // 7. Data files: keys in order, temporary doodads left out.
    const stable = F.stable({ b: 1, a: { d: [3, { z: 1, y: 2 }], c: undefined }, 1: [{ temp: true }, { k: 1, j: 2 }] });
    assert.deepStrictEqual(JSON.stringify(stable), '{"1":[{"j":2,"k":1}],"a":{"d":[3,{"y":2,"z":1}]},"b":1}');
    const data = { mapSettings: { 3: { b: 1, a: 2 } }, 3: [{ y: 1, x: 2 }], 1: [{ x: 1 }, { x: 2, temp: true }], 2: [] };
    const one = F.entriesFor(data, false);
    assert.strictEqual(one.length, 1);
    assert.strictEqual(one[0].path, 'data/DocsDoodads.json');
    assert.deepStrictEqual(one[0].data[1], [{ x: 1 }]);
    assert.ok(!('_mapFiles' in one[0].data));
    const split = F.entriesFor(data, true);
    assert.deepStrictEqual(split.map(e => e.path), ['data/DocsDoodads.json', 'data/DocsDoodads/DocsDoodads-Map001.json', 'data/DocsDoodads/DocsDoodads-Map003.json']);
    assert.deepStrictEqual(split[0].data, { _mapFiles: [1, 3], mapSettings: { 3: { a: 2, b: 1 } } }, 'the main file: settings and the list of maps');
    assert.deepStrictEqual(split[2].data, [{ x: 2, y: 1 }]);
    assert.strictEqual(F.mapIdOfPath('data\\DocsDoodads\\DocsDoodads-Map012.json'), 12);
    assert.strictEqual(F.mapIdOfPath('data/Map012.json'), 0, 'MZ\'s map files are not doodad files');
    assert.deepStrictEqual(F.merge(split[0].data, id => (id === 1 ? [{ x: 1 }] : null)), { mapSettings: { 3: { a: 2, b: 1 } }, 1: [{ x: 1 }] });
    assert.strictEqual(F.pathForMap(3), 'data/DocsDoodads.json');
    F.split = true;
    assert.strictEqual(F.pathForMap(3), 'data/DocsDoodads/DocsDoodads-Map003.json');
    F.split = false;
    console.log('✓ data files: fixed key order, one file or one per map');

    // 8. Saving and reading back on disk, and the game loading map files.
    const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-files-'));
    const cwd = process.cwd();
    process.chdir(sandbox);
    try {
        fs.mkdirSync('data');
        const P = D.Persistence;
        D.Workspace.showToast = () => {};
        P.checkConflict = () => false;
        P.pendingMapEntries = () => [];
        D.AssetIndex.libraryPath = 'data/DocsDoodadsLibrary.json';
        D.AssetIndex.data = { version: 2, assets: {} };
        window.$dataDocsDoodads = { mapSettings: {}, 1: [{ x: 1, uid: 'a' }], 5: [{ x: 5, uid: 'b' }, { x: 6, temp: true }] };
        F.split = true;
        assert.ok(P.saveAll(true));
        assert.deepStrictEqual(JSON.parse(fs.readFileSync('data/DocsDoodads.json', 'utf8'))._mapFiles, [1, 5]);
        assert.deepStrictEqual(JSON.parse(fs.readFileSync('data/DocsDoodads/DocsDoodads-Map005.json', 'utf8')), [{ uid: 'b', x: 5 }], 'temporary doodads are never saved');
        assert.deepStrictEqual(F.readAll(), { mapSettings: {}, 1: [{ uid: 'a', x: 1 }], 5: [{ uid: 'b', x: 5 }] });
        // A map that lost its doodads: its file goes (backed up first).
        window.$dataDocsDoodads[5] = [];
        assert.ok(P.saveAll(true));
        assert.ok(!fs.existsSync('data/DocsDoodads/DocsDoodads-Map005.json'));
        assert.ok(fs.readdirSync('data/docs_doodads_cache/backups').some(f => f.startsWith('DocsDoodads-Map005.json.')));
        // Back to one file: the map files go too.
        F.split = false;
        assert.ok(P.saveAll(true));
        assert.deepStrictEqual(fs.readdirSync('data/DocsDoodads'), []);
        assert.deepStrictEqual(JSON.parse(fs.readFileSync('data/DocsDoodads.json', 'utf8'))[1], [{ uid: 'a', x: 1 }]);
        // Discard reads the files again.
        F.split = true;
        P.saveAll(true);
        window.$dataDocsDoodads[1].push({ x: 9 });
        P.discardUnsaved();
        assert.deepStrictEqual(window.$dataDocsDoodads[1].map(d => d.uid), ['a'], 'the unsaved doodad is gone');
        // The game loads the main file, then each map file.
        const files = { 'data/DocsDoodads/DocsDoodads-Map001.json': '[{"x":1}]', 'data/DocsDoodads/DocsDoodads-Map002.json': '{broken' };
        const realRequest = DataManager.docsRequest;
        DataManager.docsRequest = (url, done) => done({ status: files[url] ? 200 : 404, responseText: files[url] || '' });
        DataManager.loadDocsDoodadsPacked = () => {};
        DataManager.loadDocsDoodadsAseprite = () => {};
        const warn2 = console.warn;
        console.warn = () => {};
        DataManager.loadDocsDoodadsMapFiles({ mapSettings: {}, _mapFiles: [1, 2, 3] });
        console.warn = warn2;
        assert.deepStrictEqual(Object.keys(window.$dataDocsDoodads).sort(), ['1', 'mapSettings'], 'unreadable or missing map files are skipped');
        assert.strictEqual(window.$dataDocsDoodads[1][0].scaleX, 1, 'and the doodads are brought up to date');
        DataManager.loadDocsDoodadsMapFiles({ 4: [{ x: 4 }] });
        assert.strictEqual(window.$dataDocsDoodads[4][0].x, 4, 'one file: as before');
        DataManager.docsRequest = realRequest;
        F.split = false;
    } finally {
        process.chdir(cwd);
        fs.rmSync(sandbox, { recursive: true, force: true });
    }
    console.log('✓ saving one file per map, removing emptied maps, reading back, loading in game');

    console.log('All API, traversal button and data file tests passed.');
})().catch(e => { console.error(e); process.exit(1); });
