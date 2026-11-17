'use strict';
const assert = require('assert');
const E = require('./engine/fake_engine');
E.install(); E.setupWorld({ width: 12, height: 10, px: 5, py: 5 });
global.$gameSelfSwitches = { _data: {}, value(key) { return Boolean(this._data[key.join(',')]); }, setValue(key, value) { this._data[key.join(',')] = Boolean(value); } };
let reservedCommonEvent = 0;
$gameTemp.reserveCommonEvent = id => { reservedCommonEvent = id; };
$gameTemp.isCommonEventReserved = () => reservedCommonEvent > 0;

require('../Docs-Doodads.js');
const D = DocsDoodads, L = D.Lighting, S = D.Sight, R = D.SightRuntime, W = D.Workspace;
assert.ok(S && R && typeof L.levelAt === 'function', 'light queries and sight runtime exist');

// The shared sampler keeps Perspective's exact colour while also exposing a scalar. Two white lamps over
// 10% ambient contribute 40% and 30%; a wall removes only the occluding lamp.
const info = { base: [0.1, 0.1, 0.1], lights: [
    { x: 0, y: 0, mapX: 0, mapY: 0, radius: 10, color: 0xffffff, intensity: 0.4, shape: 'round', occlude: 'off' },
    { x: 5, y: 0, mapX: 5, mapY: 0, radius: 10, color: 0xffffff, intensity: 0.6, shape: 'round', occlude: 'on' }
] };
assert.ok(Math.abs(L.levelAt(0, 0, info) - 0.8) < 1e-9, 'ambient and lamp shares are hand-checkable');
assert.strictEqual(D.Perspective.lightAt(info, 0, 0), L.colorAt(0, 0, info), '3D tint delegates without changing bytes');
const wallCtx = { mapCoordinates: true, tileWidth: 1, tileHeight: 1, isWall: (x, y) => x === 3 && y === 0,
    occlusion: { occlusion: true } };
assert.ok(Math.abs(L.levelAt(0, 0, info, wallCtx) - 0.5) < 1e-9, 'one wall ray removes the lamp behind it');

assert.strictEqual(S.sees({ x: 0.5, y: 0.5 }, 0, { x: 4.5, y: 0.5 }, { range: 6, spread: 60, level: 1, minLevel: 0.4, isWall: () => false }), true);
assert.strictEqual(S.sees({ x: 0.5, y: 0.5 }, 0, { x: 4.5, y: 4.5 }, { range: 8, spread: 60, level: 1, minLevel: 0.4, isWall: () => false }), false, 'outside the cone is unseen');
assert.strictEqual(S.sees({ x: 0.5, y: 0.5 }, 0, { x: 4.5, y: 0.5 }, { range: 6, spread: 90, level: 1, minLevel: 0.4, isWall: x => x === 2 }), false, 'sight always uses the wall grid');
assert.strictEqual(S.sees({ x: 0.5, y: 0.5 }, 0, { x: 1.5, y: 0.5 }, { range: 6, spread: 90, level: 0.1, minLevel: 0.4, isWall: () => false }), true, 'dark targets remain visible close up');
assert.strictEqual(S.sees({ x: 0.5, y: 0.5 }, 0, { x: 2.5, y: 0.5 }, { range: 6, spread: 90, level: 0.1, minLevel: 0.4, isWall: () => false }), false, 'darkness shortens range');
const flashlightAtTarget = { base: [0.05, 0.05, 0.05], lights: [{ x: 4.5, y: 0.5, radius: 6, color: 0xffffff, intensity: 0.8,
    shape: 'cone', angle: 180, spread: 20, occlude: 'on' }] };
const flashLevel = L.levelAt(4.5, 0.5, flashlightAtTarget, { tileWidth: 1, tileHeight: 1, isWall: () => false, occlusion: { occlusion: true } });
assert.ok(flashLevel > 0.8, 'a cone illuminates its own zero-distance source regardless of angle');
assert.strictEqual(S.sees({ x: 0.5, y: 0.5 }, 0, { x: 4.5, y: 0.5 }, { range: 6, spread: 90, level: flashLevel, minLevel: 0.4, isWall: () => false }), true,
    'the player flashlight extends detection at the player centre');

const parsed = S.parse('<docs sight: 7, 80>\n<docs sight light: .35>\n<docs sight self switch: C>');
assert.deepStrictEqual(parsed, { range: 7, spread: 80, minLevel: 0.35, selfSwitch: 'C', commonEvent: 0 });
const rewritten = S.write('<docs label: Guard>\n<docs sight: 2, 30>\n<docs sight common event: 4>', { range: 9, spread: 120, minLevel: 0.2, selfSwitch: '', commonEvent: 8 });
assert.ok(rewritten.includes('<docs label: Guard>') && rewritten.includes('<docs sight: 9, 120>') && rewritten.includes('<docs sight common event: 8>'));
assert.ok(!rewritten.includes('common event: 4'));

// Runtime snapshots include all map lamps (not only sprites on screen), but use exactly the game's actual
// visibility gates. Effects Quality must not affect either a query or sight.
const lamp = E.doodad(5, 5, { uid: 'visible', light: { enabled: true, radius: 180, intensity: 1, color: '#ffffff', occlude: 'off' } });
const hiddenCondition = E.doodad(4, 5, { uid: 'condition', condition: 'false', light: { enabled: true, radius: 180, intensity: 1 } });
const hiddenSwitch = E.doodad(3, 5, { uid: 'switch', switch: [[22, true]], light: { enabled: true, radius: 180, intensity: 1 } });
const hiddenSeason = E.doodad(2, 5, { uid: 'season', seasons: [3], light: { enabled: true, radius: 180, intensity: 1 } });
const hiddenLayer = E.doodad(1, 5, { uid: 'layer', layer: 'hidden', light: { enabled: true, radius: 180, intensity: 1 } });
const stateOff = E.doodad(6, 5, { uid: 'stateOff', light: { enabled: true, radius: 180, intensity: 1 } });
$dataDocsDoodads[1] = [lamp, hiddenCondition, hiddenSwitch, hiddenSeason, hiddenLayer, stateOff];
$dataDocsDoodads.mapSettings[1] = { layers: [{ id: 'hidden', name: 'Hidden', gameHidden: true }] };
D.World.set('lighting2d.darkSwitchId', 9); D.World.set('lighting2d.darkLevel', 0.3);
D.World.set('ambient.darkness', 0.9); D.World.set('ambient.color', '#000000');
const lightOn = D.WorldState.lightOn; D.WorldState.lightOn = d => d.uid !== 'stateOff';
const snapshot = R.lightInfo();
D.WorldState.lightOn = lightOn;
assert.deepStrictEqual(snapshot.lights.filter(light => light.doodad).map(light => light.doodad.uid), ['visible'], 'raw queries honor condition, switch, season, layer and saved light state');
ConfigManager.docsFxQuality = 3;
const darkQuality = R.levelAtTile(0, 0); ConfigManager.docsFxQuality = 0;
assert.strictEqual(R.levelAtTile(0, 0), darkQuality, 'gameplay brightness is independent of Effects Quality');

// A tagged guard sees across a looping seam, acts once per acquisition, updates the dark switch, and an
// untagged/offscreen event does no ray work. Sight still blocks on walls when visual light occlusion is off.
$dataMap.scrollType = 2;
$dataMap.events[1] = { id: 1, name: 'Guard', note: '<docs sight: 6, 90>\n<docs sight self switch: B>', x: 11, y: 5, pages: [{ list: [] }] };
$dataMap.events[2] = { id: 2, name: 'Civilian', note: '', x: 4, y: 5, pages: [{ list: [] }] };
const guard = new Game_Event(1, 1); guard.locate(11, 5); guard.setDirection(6); guard.isNearTheScreen = () => true;
const civilian = new Game_Event(1, 2); civilian.locate(4, 5); civilian.isNearTheScreen = () => false;
$gameMap._events = [null, guard, civilian]; $gamePlayer.locate(0, 5);
R.reset(); R.levelAtTile = () => 1; R.wallAt = () => false; R.update(true);
assert.strictEqual($gameSelfSwitches.value([1, 1, 'B']), true, 'loop-shortest sight turns on the chosen self switch');
$gameSelfSwitches.setValue([1, 1, 'B'], false); R.update(true);
assert.strictEqual($gameSelfSwitches.value([1, 1, 'B']), false, 'continuous sight does not retrigger until it is lost');
$gamePlayer.locate(6, 5); R.update(true); $gamePlayer.locate(0, 5); R.update(true);
assert.strictEqual($gameSelfSwitches.value([1, 1, 'B']), true, 'losing sight rearms the response');
R.levelAtTile = () => 0.1; R.update(true); assert.strictEqual($gameSwitches.value(9), true, 'the configured switch follows player darkness');

$dataMap.events[1].note = '<docs sight: 6, 90>\n<docs sight common event: 7>';
if (D.VisualEquip._eventText) D.VisualEquip._eventText.delete(guard);
reservedCommonEvent = 0; R.reset(); R.levelAtTile = () => 1; R.wallAt = () => false; R.update(true);
assert.strictEqual(reservedCommonEvent, 7);
reservedCommonEvent = 3; $gamePlayer.locate(6, 5); R.update(true); $gamePlayer.locate(0, 5); R.update(true);
assert.strictEqual(reservedCommonEvent, 3, 'sight never overwrites an already reserved common event');

assert.strictEqual(typeof D.api.lightAt, 'function');
assert.strictEqual(typeof D.api.sees, 'function');
const store = Object.keys(PluginManager._commands).find(key => /:storeLightLevel$/.test(key));
assert.ok(store); R.levelAtTile = () => 0.625; PluginManager._commands[store]({ tileX: '3', tileY: '4', variableId: '12' });
assert.strictEqual($gameVariables.value(12), 0.625);

// Editor writes only the active scope, through one undo step, and exposes/draws the picked event's cone.
const staged = JSON.parse(JSON.stringify($dataMap.events[1]));
staged.note = '<docs label: Guard>\n<docs sight: 6, 90>\n<docs sight self switch: A>';
W.selectedEvent = { gameEvent: guard, stagedEvent: staged }; W.selectedStagedEvent = () => staged;
const commands = [], execute = D.Undo.execute; D.Undo.execute = command => { commands.push(command); command.apply(); };
assert.strictEqual(W.editEventSight({ range: 8, spread: 70, minLevel: 0.25, selfSwitch: 'D', commonEvent: 0 }), true);
assert.strictEqual(commands.length, 1); assert.ok(staged.note.includes('<docs sight: 8, 70>') && staged.note.includes('self switch: D') && staged.note.includes('<docs label: Guard>'));
commands[0].revert(); assert.ok(staged.note.includes('<docs sight: 6, 90>'));
commands[0].apply();
const cone = W.sightOverlayPoints(); assert.ok(cone.length >= 8 && cone[0] === guard.x && cone[1] === guard.y, 'picked event cone uses the shared wall outline');
assert.ok(String(W.renderSightDetails).includes('Sight'));
D.Undo.execute = execute;

console.log('PASS light scalar/color, occlusion, sight cone/darkness/flashlight, runtime actions, API and editor');
