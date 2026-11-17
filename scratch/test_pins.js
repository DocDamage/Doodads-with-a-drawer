'use strict';
// 9.1.6 Pins and fast travel: pure rules, discovery, event pins by page, the save, travel and its switch, the
// minimap and world map, plugin commands, and the editor's pins, Undo and Problems.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const E = require('./engine/fake_engine');

process.chdir(fs.mkdtempSync(path.join(os.tmpdir(), 'dd-pins-')));
E.install();
global.Window_Help = class { constructor(rect) { this.rect = rect; this.text = ''; } setText(text) { this.text = text; } };
E.setupWorld({ width: 30, height: 20, px: 3, py: 3 });
const parameters = PluginManager.parameters;
PluginManager.parameters = name => Object.assign({}, parameters ? parameters.call(PluginManager, name) : {}, { fastTravelForbidSwitch: '9' });
const commands = {};
const register = PluginManager.registerCommand;
PluginManager.registerCommand = (plugin, name, fn) => { commands[name] = fn; if (register) return register.call(PluginManager, plugin, name, fn); return undefined; };
$dataDocsDoodads.world = { minimap: { flat: true, fog: false, radius: 6, size: 140 } };
require('../Docs-Doodads.js');
const D = DocsDoodads, P = D.Pins, W = D.Workspace;
global.$dataMapInfos = [null, { name: 'Town' }, { name: 'Field' }];

// ---- Pure rules ----
const mill = P.add(1, { x: 20, y: 5, name: 'Old Mill', icon: 87, travel: true });
const well = P.add(1, { x: 4, y: 4, name: 'Well' });
const inn = P.add(2, { x: 7, y: 8, name: 'Harbour Inn', travel: true, switchId: 3 });
P.add(5, { x: 1, y: 1, name: 'Lost Map', travel: true });
assert.deepStrictEqual([mill.id, well.id, inn.id], ['m1p1', 'm1p2', 'm2p1']);
assert.strictEqual(P.add(1, { x: 0, y: 0, name: '   ' }), null, 'a pin needs a name');
assert.strictEqual(P.at(1, 4, 4), P.list(1)[1]);
P.update(1, well.id, { name: 'Village Well', icon: 'x' });
assert.deepStrictEqual([P.list(1)[1].name, P.list(1)[1].icon], ['Village Well', 0]);
assert.strictEqual(P.find('village well').pin.id, 'm1p2', 'found by name, any case');
assert.strictEqual(P.find('m2p1').mapId, 2, 'found by id');
assert.strictEqual(P.find('nowhere'), null);
assert.deepStrictEqual(P.parseTag('Hello <docs pin: 87, Inn, by the sea, travel>'), { icon: 87, name: 'Inn, by the sea' });
assert.deepStrictEqual(P.parseTag('<Docs Pin:Shop>'), { icon: 190, name: 'Shop' });
assert.strictEqual(P.parseTag('<docs pin: 12>'), null, 'a pin tag needs a name');
assert.strictEqual(P.parseTag('no tag'), null);

const ctx = { found: () => false, hidden: () => false, switchOn: id => id === 3, explored: (x, y) => x === 20 && y === 5 };
assert.ok(P.visible(P.list(1)[0], ctx), 'an explored tile shows its pin');
assert.ok(!P.visible(P.list(1)[1], ctx), 'an unexplored pin is not shown');
assert.ok(P.visible(P.list(1)[1], Object.assign({}, ctx, { found: id => id === 'm1p2' })), 'a found pin shows');
assert.ok(!P.visible(P.list(1)[0], Object.assign({}, ctx, { hidden: id => id === 'm1p1' })), 'a hidden pin does not show');
assert.ok(!P.visible(P.list(2)[0], Object.assign({}, ctx, { found: () => true, switchOn: () => false })), 'its switch must be on');

// Discovery: within the radius without fog (across a looping seam), by explored tiles with fog.
$gameSystem._docsPins = null;
assert.deepStrictEqual(P.discoverNear(P.list(1), { fog: false, px: 1, py: 5, radius: 6, width: 30, height: 20, loopX: true }).map(p => p.id), ['m1p2'],
    'the well is near; the mill is not');
assert.deepStrictEqual(P.discoverNear(P.list(1), { fog: false, px: 26, py: 5, radius: 6, width: 30, height: 20, loopX: true }).map(p => p.id), ['m1p1']);
assert.strictEqual(P.loopDelta(28, 30, true), -2, 'a looping map measures the short way round');
assert.strictEqual(P.loopDelta(28, 30, false), 28);
assert.deepStrictEqual(P.discoverNear([{ id: 'x', x: 9, y: 9 }], { fog: true, explored: () => true }).map(p => p.id), ['x']);
assert.deepStrictEqual(P.discoverNear([{ id: 'x', x: 9, y: 9 }], { fog: true, explored: () => true }), [], 'found once');

// The save, and travel.
P.discover('m2p1');
P.setHidden('m1p2', true); P.setHidden('m1p2', true);
const saved = JSON.parse(JSON.stringify($gameSystem._docsPins));
$gameSystem._docsPins = saved;
assert.deepStrictEqual(saved, { found: ['m1p2', 'm1p1', 'x', 'm2p1'], hidden: ['m1p2'] }, 'found and hidden ids round-trip through the save');
P.discover('m5p1');
const travel = P.travelList({ mapInfos: $dataMapInfos, switchOn: id => id === 3 });
assert.deepStrictEqual(travel.map(row => row.pin.id), ['m1p1', 'm2p1'], 'travel pins that are found and shown; a deleted map is skipped');
assert.strictEqual(travel[1].mapName, 'Field');
assert.deepStrictEqual(P.travelList({ mapInfos: $dataMapInfos, switchOn: () => false }).map(row => row.pin.id), ['m1p1'], "a pin's switch gates travel too");
assert.ok(P.travelAllowed(9, () => false));
assert.ok(!P.travelAllowed(9, id => id === 9), 'the Forbid Fast Travel switch stops travel');
assert.ok(P.travelAllowed(0, () => true));
assert.strictEqual(P.forbidSwitch, 9, 'the switch comes from the plugin parameters');
assert.deepStrictEqual(P.iconFrame(87), { x: 7 * 32, y: 5 * 32, w: 32, h: 32 });

// ---- Event pins follow the event's page ----
$dataMap.events = [null, { id: 1, name: 'Sign', note: '', pages: [{ list: [{ code: 108, parameters: ['<docs pin: 12, Notice Board>'] }] }, { list: [] }] }];
const sign = new Game_Event(1, 1);
sign._x = 6; sign._y = 6; sign._realX = 6; sign._realY = 6;
sign.page = function() { return this.event().pages[this._pageIndex]; };
$gameMap._events[1] = sign;
let here = P.currentPins();
assert.ok(here.some(p => p.id === 'm1e1' && p.name === 'Notice Board' && p.event && !p.travel), 'an event page comment makes a pin');
sign._pageIndex = 1;
here = P.currentPins();
assert.ok(!here.some(p => p.id === 'm1e1'), 'another page without the comment has no pin');
sign._pageIndex = 0;

// ---- Minimap and world map ----
P.state().found.push('m1e1');
const ss = new Spriteset_Map();
SceneManager._scene = { _spriteset: ss };
E.frames(ss, 2);
const mini = ss._docsMinimap;
assert.ok(mini && mini._docsPins, 'the minimap has a pin layer');
const shownIds = mini._docsPins.children.map(c => c._docsPinId).sort();
assert.deepStrictEqual(shownIds, ['m1e1', 'm1p1'], 'found pins show; hidden ones do not');
const firstLayer = mini._docsPins;
E.frames(ss, 1);
assert.strictEqual(mini._docsPins, firstLayer, 'the layer is not rebuilt while nothing changes');

let reserved = null, popped = 0;
$gamePlayer.reserveTransfer = (...args) => { reserved = args; };
const Scene = D.Scene_DocsWorldMap;
const makeScene = () => {
    const scene = Object.create(Scene.prototype);
    scene.addChild = () => {}; scene.addWindow = () => {}; scene.popScene = () => { popped++; };
    scene.calcWindowHeight = () => 72;
    scene.create();
    return scene;
};
const scene = makeScene();
assert.strictEqual(scene._docsTravel.length, 1, 'only the travel pins that are found, shown and allowed now');
assert.ok(scene._docsPinHelp.text.includes('Old Mill'), 'the chosen pin is named');
Input._pressed = { ok: true };
scene.update();
assert.ok(scene._docsConfirm && /Travel to Old Mill/.test(scene._docsPinHelp.text), 'OK asks first');
Input._pressed = { cancel: true };
scene.update();
assert.ok(!scene._docsConfirm && popped === 0, 'Cancel goes back to choosing');
Input._pressed = { ok: true }; scene.update(); scene.update();
assert.deepStrictEqual(reserved, [1, 20, 5, 2, 0], "OK again travels to the pin's tile");
assert.strictEqual(popped, 1);
Input._pressed = {};
$gameSwitches.setValue(9, true);
assert.strictEqual(makeScene()._docsTravel.length, 0, 'the forbid switch leaves only the map');
$gameSwitches.setValue(9, false);

// ---- Commands ----
commands.hidePin({ pin: 'Old Mill', hidden: 'true' });
assert.ok(P.isHidden('m1p1'));
commands.findPin({ pin: 'old mill' });
assert.ok(!P.isHidden('m1p1') && P.isFound('m1p1'), 'Find Pin finds and shows');
assert.strictEqual(commands.findPin({ pin: 'Nowhere' }), false);
let pushed = null;
SceneManager.push = target => { pushed = target; };
commands.openFastTravel();
assert.strictEqual(pushed, Scene);

// ---- Editor ----
W.showToast = () => {};
W.currentMapId = () => 1;
D.Ui.form = async () => ({ name: 'Bridge', icon: 5, travel: true, switchId: 0 });
(async () => {
    const before = P.list(1).length;
    const added = await W.addPinAt(12, 12);
    assert.strictEqual(added.name, 'Bridge');
    assert.strictEqual(P.list(1).length, before + 1);
    D.Undo.undo();
    assert.strictEqual(P.list(1).length, before, 'adding a pin is one Undo step');
    D.Undo.redo();
    assert.ok(P.at(1, 12, 12));
    D.Ui.form = async () => ({ name: '', icon: 5, travel: true, switchId: 0 });
    await W.editPinAt(12, 12);
    assert.ok(!P.at(1, 12, 12), 'an empty name deletes the pin');
    D.Undo.undo();
    assert.ok(P.at(1, 12, 12));
    const items = W.pinMenuItems(12, 12);
    assert.ok(items.some(i => /Edit Pin "Bridge"/.test(i.label)) && items.some(i => i.label === 'Delete Pin'), 'the tile menu offers the pin');
    assert.ok(W.pinMenuItems(13, 13).some(i => i.label === 'Add Pin Here...'));
    assert.ok(/pinMenuItems/.test(fs.readFileSync(path.join(__dirname, '..', 'src', '44_workspace_canvas_input_1_mouse.js'), 'utf8')), 'the tile menu offers pins');
    assert.ok(/pinProblems/.test(String(W.collectProblems)), 'Problems asks for travel pins');
    // Problems: a travel pin on a tile nobody can stand on.
    const passable = $gameMap.isPassable;
    $gameMap.isPassable = (x, y) => !(x === 12 && y === 12);
    W.doodadBlockedTiles = () => new Set();
    const problems = W.pinProblems();
    assert.ok(problems.some(p => p.kind === 'travelPin' && /Bridge/.test(p.text)));
    assert.ok(!problems.some(p => /Old Mill/.test(p.text)));
    $gameMap.isPassable = passable;
    // Recovery keeps pins.
    const built = fs.readFileSync(path.join(__dirname, '..', 'Docs-Doodads.js'), 'utf8');
    assert.ok(/pins: Object\.prototype\.hasOwnProperty\.call\(data, 'pins'\)/.test(built) && /restoreMetadata\('pins'\)/.test(built));
    // Removing the last pin of the last map removes the key.
    for (const id of Object.keys(P.store(false))) P.put(id, []);
    assert.ok(!('pins' in $dataDocsDoodads), 'no pins, no key');
    console.log('Pins: rules, discovery, events by page, save, travel and its switch, minimap, world map, commands, editor, Undo and Problems passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
