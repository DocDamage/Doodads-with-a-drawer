// scratch/test_project_release_b6.js
// Phase B6 (§11 of docs/CREATOR_IMPROVEMENTS_PLAN.md), the parts that change behaviour: place, delete,
// duplicate and paste share one undo step (and delete puts doodads back in list order), deleting an event
// leaves the game's own erasing alone, the drag ghost loads its picture once, Spriteset_Map.update and
// Game_Map.update are wrapped once with their steps listed, + and - are taken only while zooming by keys
// is on, isTest() is false outside MZ, and Problems lists conditions that don't compile.
const assert = require('assert');
const E = require('./engine/fake_engine');

console.log('=== Testing Project and Release (B6) ===');

// 1. Outside MZ (no Utils) it is not a playtest, as FS.writable() says too.
E.install();
const utils = global.Utils;
delete global.Utils;
E.setupWorld({ width: 20, height: 15, px: 5, py: 5 });
$dataDocsDoodads[1] = [];
require('../Docs-Doodads.js');
const D = DocsDoodads;
assert.strictEqual(D.Compat.isTest(), false, 'no Utils: not a playtest');
assert.strictEqual(D.FS.writable(), false);
global.Utils = utils;
assert.strictEqual(D.Compat.isTest(), true, 'with MZ in a playtest');
console.log('✓ isTest() agrees with the write guard outside MZ.');

// 2. One wrapper each, the steps in their listed order.
assert.deepStrictEqual(D.spritesetSteps, ['updateDocsDoodadsFrame', 'updateDocsVfx', 'updateDocsWeather2d', 'updateDocsPerspective',
    'updateDocsSkyVideoOnMap', 'updateDocsMinimap', 'updateDocsFlyShadow', 'updateDocsTouchPrompt']);
const ss = new Spriteset_Map();
SceneManager._scene = { _spriteset: ss };
const ran = [];
for (const step of D.spritesetSteps) {
    const real = Spriteset_Map.prototype[step];
    assert.strictEqual(typeof real, 'function', step + ' is a method of the spriteset');
    Spriteset_Map.prototype[step] = function() { ran.push(step); return real.apply(this, arguments); };
}
const mapRan = [];
for (const step of D.mapSteps) {
    const real = Game_Map.prototype[step];
    assert.strictEqual(typeof real, 'function', step + ' is a method of the map');
    Game_Map.prototype[step] = function(active) { mapRan.push([step, active]); return real.apply(this, arguments); };
}
E.frames(ss, 1);
assert.deepStrictEqual(ran, D.spritesetSteps, 'each step once, in order');
assert.deepStrictEqual(mapRan.map(r => r[0]), D.mapSteps);
assert.ok(mapRan.every(r => r[1] === true), 'the map steps are told the scene is active');
console.log('✓ Spriteset_Map.update and Game_Map.update: one wrapper each, steps in order.');

// 3. + and - belong to zooming only while zooming by keys is on.
const keys = [187, 189, 107, 109];
assert.ok(keys.every(k => !Input.keyMapper || Input.keyMapper[k] !== 'docsZoomIn' && Input.keyMapper[k] !== 'docsZoomOut'), 'not taken at load');
Input.keyMapper = Input.keyMapper || {};
D.World.set('zoom', { enabled: true, keys: true });
D.PlayerZoom.update();
assert.strictEqual(Input.keyMapper[187], 'docsZoomIn');
assert.strictEqual(Input.keyMapper[189], 'docsZoomOut');
D.World.set('zoom', { enabled: false });
D.PlayerZoom.update();
assert.ok(!Input.keyMapper[187] && !Input.keyMapper[189], 'given back when zooming is turned off');
Input.keyMapper[187] = 'otherPlugin';
D.World.set('zoom', { enabled: true, keys: true });
D.PlayerZoom.update();
assert.strictEqual(Input.keyMapper[187], 'otherPlugin', 'a key another plugin took is left alone');
D.World.set('zoom', undefined);
console.log('✓ Zoom keys: taken when wanted, given back, others left alone.');

// 4. The shared add/remove step: delete puts doodads back where they were, in list order.
const ws = D.Workspace;
ws.refreshSpriteset = () => {};
ws.refreshInspector = () => {};
ws.toastUndo = () => {};
ws.showToast = () => {};
ws.updateUndoButtons = () => {};
const a = E.doodad(1, 1, { uid: 'a' }), b = E.doodad(2, 1, { uid: 'b' }), c = E.doodad(3, 1, { uid: 'c' }), d = E.doodad(4, 1, { uid: 'd' });
const list = $dataDocsDoodads[1] = [a, b, c, d];
ws.selectedDoodads = [d, b];
ws.deleteSelectedDoodad();
assert.deepStrictEqual(list.map(x => x.uid), ['a', 'c']);
D.Undo.undo();
assert.deepStrictEqual(list.map(x => x.uid), ['a', 'b', 'c', 'd'], 'back in their places (picked last first)');
D.Undo.redo();
assert.deepStrictEqual(list.map(x => x.uid), ['a', 'c']);
D.Undo.undo();
// Placing records its own map's list: redone on another map, it still goes to the first.
const step = ws.doodadListStep('place_doodad', list, [E.doodad(5, 5, { uid: 'e' })], true);
D.Undo.execute(step);
assert.strictEqual(list.length, 5);
$dataDocsDoodads[2] = [];
D.Undo.undo();
D.Undo.redo();
assert.strictEqual(list.length, 5, 'redone into its own map');
assert.strictEqual($dataDocsDoodads[2].length, 0);
console.log('✓ One add/remove step: delete keeps list order; a step keeps its map.');

// 5. Deleting an event: the game's own Erase Event is not undone by Undo.
const ev = new Game_Event(1, 1);
$gameMap._events[1] = ev;
$gameMap._stagedMapData = { events: [null, { id: 1, x: 3, y: 3, pages: [] }] };
$gameMap._stagedMapDataId = 1;
ev._erased = true; // erased by the game before the editor opened
ws.selectedEvent = { gameEvent: ev, stagedEvent: $gameMap._stagedMapData.events[1] };
ws.selectEvent = () => { ws.selectedEvent = null; };
D.Persistence.stagedFor = () => $gameMap._stagedMapData;
ws.deleteSelectedEvent();
assert.ok(!$gameMap._stagedMapData.events[1]);
D.Undo.undo();
assert.ok($gameMap._stagedMapData.events[1], 'the event is back in the map');
assert.strictEqual(ev._erased, true, 'and the game still has it erased');
const ev2 = new Game_Event(1, 2);
$gameMap._events[2] = ev2;
$gameMap._stagedMapData.events[2] = { id: 2, x: 4, y: 4, pages: [] };
ws.selectedEvent = { gameEvent: ev2, stagedEvent: $gameMap._stagedMapData.events[2] };
ws.deleteSelectedEvent();
assert.strictEqual(ev2._erased, true, 'a deleted event is hidden');
D.Undo.undo();
assert.strictEqual(ev2._erased, false, 'and shown again by Undo');
console.log("✓ Deleting an event: Undo shows it again, but not one the game erased.");

// 6. The drag ghost sets its picture once, not on every mouse move.
const img = { _src: '', sets: 0, style: {} };
Object.defineProperty(img, 'src', { get() { return 'file:///C:/project/' + this._src; }, set(v) { this._src = v; this.sets++; } });
const realGet = document.getElementById;
document.getElementById = id => (id === 'dd-ghost-img' ? img : realGet(id));
ws.ghostEl = { style: {}, parentNode: null, appendChild() {} };
const asset = { path: 'img/doodads/Tree.png' };
for (let i = 0; i < 10; i++) ws.showGhost(asset, 100 + i, 100, true);
assert.strictEqual(img.sets, 1, 'set once');
ws.showGhost({ path: 'img/doodads/Rock.png' }, 120, 100, true);
assert.strictEqual(img.sets, 2, 'and again for another picture');
ws.removeGhost();
// Stamp's picture under the mouse goes when another tool is picked (it stayed where the mouse left the map).
ws.ghostEl = { style: {}, parentNode: null, appendChild() {} };
const realSetTool = ws.setPlacementTool;
if (typeof realSetTool === 'function') {
    ws.placementTool = 'stamp';
    ws.setPlacementTool('stamp');
    assert.ok(ws.ghostEl, 'still Stamp: the picture stays');
    ws.setPlacementTool(null);
    assert.strictEqual(ws.ghostEl, null, 'Select: the picture goes');
}
document.getElementById = realGet;
console.log('✓ The drag ghost loads its picture once, and goes with Stamp.');

// 7. Problems: a condition that isn't JavaScript.
ws.fileExists = () => true;
ws.soundExists = () => true;
ws.mapSize = () => ({ w: 20, h: 15 });
ws.currentMapId = () => 1;
const broken = E.doodad(2, 2, { uid: 'bad', condition: '$gameSwitches.value(' });
const fine = E.doodad(3, 2, { uid: 'ok', condition: '$gameSwitches.value(3)' });
const found = ws.doodadProblems(1, [broken, fine], null, {});
const bad = found.filter(p => p.kind === 'badCondition');
assert.strictEqual(bad.length, 1, 'only the broken one');
assert.strictEqual(bad[0].doodad, broken);
assert.ok(ws.problemGroups.some(g => g[0] === 'badCondition'));
ws.editDoodads = (items, fn) => items.forEach(fn);
bad[0].fix.run();
assert.strictEqual(broken.condition, '', 'Remove Condition');
console.log("✓ Problems lists conditions that don't run.");

console.log('\nAll project and release (B6) checks passed.');
