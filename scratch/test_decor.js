'use strict';
// 8.4.1 Decorate mode: every rule in canPlace; limits and where pieces come from; a save and load round trip
// (pieces come back as doodads with their light); a piece whose catalog entry was removed is skipped with a warning;
// a piece outside a changed zone is handed back; the player's mode (place, lift, move, flip, put away, done); the
// maker's card as Undo steps; Shipped notices a released piece that is gone.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const E = require('./engine/fake_engine');

process.chdir(fs.mkdtempSync(path.join(os.tmpdir(), 'dd-decor-')));
E.install();
const W_ = 12, H_ = 10, WALL = 1600;
const tiles = [];
// A room x 2..9, y 2..7 with walls round it and a door (transfer event) at (5, 7) in the bottom wall.
for (let x = 1; x <= 10; x++) { tiles.push([x, 1, 0, WALL]); if (x !== 5) tiles.push([x, 8, 0, WALL]); }
for (let y = 1; y <= 8; y++) { tiles.push([1, y, 0, WALL]); tiles.push([10, y, 0, WALL]); }
for (let y = 2; y <= 7; y++) for (let x = 2; x <= 9; x++) tiles.push([x, y, 5, 12]);
E.setupWorld({ width: W_, height: H_, px: 3, py: 3, tiles, flags: { [WALL]: 0x0f } });
global.$dataItems = [null, { id: 1, name: 'Chair kit' }];
const lampTemplate = Object.assign(E.doodad(0, 0, { uid: 'tpl' }), { light: { enabled: true, radius: 90 } });
delete lampTemplate.x; delete lampTemplate.y; delete lampTemplate.uid;
$dataDocsDoodads.decor = {
    catalog: [
        { id: 'decor_lamp', name: 'Lamp', doodad: lampTemplate, w: 1, h: 1, limit: 2 },
        { id: 'decor_table', name: 'Table', doodad: Object.assign({}, lampTemplate, { light: undefined }), w: 2, h: 1, free: true },
        { id: 'decor_chair', name: 'Chair', doodad: lampTemplate, itemId: 1 }
    ],
    zones: { 1: { regions: '12', boxes: [] } }
};
require('../Docs-Doodads.js');
const D = DocsDoodads, Dc = D.Decor, M = D.DecorMode;
// The door: a transfer event on the room's bottom wall.
const door = new Game_Event(1, 1);
door.locate(5, 8);
door.list = () => [{ code: 201, parameters: [0, 2, 1, 1, 2, 0] }, { code: 0 }];
$gameMap._events = [null, door];
$gameMap.canvasToMapY = y => Math.floor(y / 48);
$gameParty.numItems = () => party;
$gameParty.loseItem = () => { party--; };
$gameParty.gainItem = () => { party++; };
let party = 1;

// ---- canPlace ----
const lamp = Dc.item('decor_lamp'), table = Dc.item('decor_table');
assert.strictEqual(Dc.catalog().length, 3);
const ctx = extra => Object.assign({ zones: Dc.zonesFor(1), regionAt: (x, y) => $gameMap.regionId(x, y), w: W_, h: H_,
    passable: (x, y) => [2, 4, 6, 8].some(d => $gameMap.isPassable(x, y, d)), placed: [], start: { x: 3, y: 3 }, exits: [{ x: 5, y: 8 }] }, extra || {});
assert.deepStrictEqual(Dc.canPlace(lamp, 4, 4, ctx()), { ok: true, reason: '' });
assert.strictEqual(Dc.canPlace(lamp, 0, 0, ctx()).reason, 'zone', 'outside the zone');
assert.strictEqual(Dc.canPlace(lamp, 3, 3, ctx()).reason, 'player', 'not on the player');
assert.strictEqual(Dc.canPlace(table, 9, 4, ctx()).reason, 'zone', 'a two-tile table must fit inside');
assert.strictEqual(Dc.canPlace(lamp, 4, 4, ctx({ placed: [{ x: 3, y: 4, item: table }] })).reason, 'piece', 'not on another piece');
assert.strictEqual(Dc.canPlace(lamp, -1, 4, ctx()).reason, 'edge');
assert.strictEqual(Dc.canPlace(lamp, 4, 4, ctx({ passable: () => false })).reason, 'blocked');
assert.strictEqual(Dc.canPlace(null, 4, 4, ctx()).reason, 'missing');
// Walling in: the room's way to the door is (5, 7). A row of pieces from x 2 to 9 at y 6 but one gap; filling it fails.
const row = [];
for (let x = 2; x <= 9; x++) if (x !== 6) row.push({ x, y: 6, item: lamp });
assert.strictEqual(Dc.canPlace(lamp, 6, 6, ctx({ placed: row })).reason, 'wallsIn', 'they cannot wall themselves in');
assert.ok(Dc.canPlace(lamp, 3, 5, ctx({ placed: row })).ok, 'elsewhere is fine');
assert.deepStrictEqual(Dc.footprint(table, 3, 4), [{ x: 3, y: 4 }, { x: 4, y: 4 }]);
assert.deepStrictEqual(Dc.footprint(Object.assign({}, lamp, { h: 2 }), 3, 4), [{ x: 3, y: 4 }, { x: 3, y: 3 }], 'tall pieces go up from their base');
assert.ok(Dc.inZone({ regions: new Set(), boxes: [{ x: 1, y: 1, w: 2, h: 2 }] }, 2, 2, () => 0), 'boxes');

// ---- Limits and where pieces come from ----
assert.strictEqual(Dc.left(lamp), 0, 'none given yet');
Dc.give('decor_lamp', 5);
assert.strictEqual(Dc.left(lamp), 2, 'the limit is two');
assert.strictEqual(Dc.left(table), 999, 'free');
assert.strictEqual(Dc.left(Dc.item('decor_chair')), 1, 'a party item');

// ---- The mode ----
const ss = new Spriteset_Map();
SceneManager._scene = { _spriteset: ss };
assert.ok(M.open(), 'opens on a map with a zone');
assert.ok(!$gamePlayer.canMove(), 'the player stands still');
M.setCursor(4, 4);
assert.ok(M.ok(), 'placed');
assert.strictEqual(Dc.pieces(1).length, 1);
assert.strictEqual(Dc.left(lamp), 1);
const placed = $dataDocsDoodads[1].filter(d => d.decor);
assert.strictEqual(placed.length, 1, 'the piece is a doodad now');
assert.ok(placed[0].temp && placed[0].light && placed[0].light.enabled, 'with its light, and never written to the project');
// Lift and move it, flipped.
assert.ok(M.ok(), 'lifted');
M.moveCursor(2, 0);
M.flip();
assert.ok(M.ok(), 'put down');
assert.deepStrictEqual([Dc.pieces(1)[0].x, Dc.pieces(1)[0].y, Dc.pieces(1)[0].flip], [6, 4, true]);
assert.ok($dataDocsDoodads[1].find(d => d.decor).scaleX < 0, 'drawn flipped');
// A bad spot says why and changes nothing.
M.setCursor(0, 0);
assert.ok(!M.ok());
assert.ok(/marked area/.test(M.text()));
// The next piece: the table (free), twice.
M.setCursor(6, 3);
M.nextItem(1);
assert.strictEqual(M.item().id, 'decor_table');
assert.ok(M.ok());
// Lift the lamp and put it away in the bag.
M.setCursor(6, 4);
M.ok();
M.cancel();
assert.strictEqual(Dc.pieces(1).filter(p => p.item === 'decor_lamp').length, 0, 'put away');
assert.strictEqual(Dc.store().bag.decor_lamp, 5, 'back in the bag');
M.cancel();
assert.ok(!M.active() && $gamePlayer.canMove(), 'Done');

// ---- Save and load ----
const saved = JSON.parse(JSON.stringify($gameSystem._docsDecor));
assert.ok(JSON.stringify(saved).length < 300, 'ids and numbers only');
$gameSystem._docsDecor = null;
$dataDocsDoodads[1] = ($dataDocsDoodads[1] || []).filter(d => !d.decor);
$gameSystem._docsDecor = saved;
$gameMap.setup(1);
const again = new Spriteset_Map();
assert.strictEqual($dataDocsDoodads[1].filter(d => d.decor).length, 1, 'the table is back after loading');
assert.ok(again._docsDoodadSprites.some(s => s._data.decor), 'and drawn');
// The maker removed the table from the catalog: it is skipped with a warning, not an error.
const warn = console.warn; const warnings = [];
console.warn = m => warnings.push(m);
$dataDocsDoodads.decor.catalog = $dataDocsDoodads.decor.catalog.filter(i => i.id !== 'decor_table');
$gameMap.setup(1);
console.warn = warn;
assert.strictEqual($dataDocsDoodads[1].filter(d => d.decor).length, 0);
assert.ok(warnings.some(w => /no longer in the catalog/.test(w)));
// A zone made smaller hands pieces back.
Dc.give('decor_lamp', 0);
Dc.add(1, 'decor_lamp', 2, 2);
$dataDocsDoodads.decor.zones[1] = { regions: '', boxes: [{ x: 5, y: 5, w: 2, h: 2 }] };
const bagBefore = Dc.store().bag.decor_lamp;
Dc.sync(1);
assert.strictEqual(Dc.pieces(1).length, 0, 'no longer fits');
assert.strictEqual(Dc.store().bag.decor_lamp, bagBefore + 1, 'handed back');

// ---- Commands ----
const commands = PluginManager._commands || {};
const run = (name, args) => { const fn = commands['Docs-Doodads:' + name] || Object.entries(commands).find(([k]) => k.endsWith(':' + name))?.[1]; if (fn) fn.call({}, args); return Boolean(fn); };
if (run('giveDecor', { item: 'decor_lamp', count: '2' })) {
    assert.strictEqual(Dc.store().bag.decor_lamp, bagBefore + 3);
    run('countDecor', { item: 'decor_lamp', what: 'held', variableId: '5' });
    assert.strictEqual($gameVariables.value(5), 2, 'held, within the limit');
}

// ---- The maker's card ----
const Wk = D.Workspace;
Wk.mounted = true; Wk.showToast = () => {};
const id = Wk.addDecorPiece({ path: 'img/doodads/Rug.png', width: 96, height: 48 }, 'Rug');
assert.ok(Dc.item(id) && Dc.item(id).w === 2, 'a piece from a picture, two tiles across');
Wk.editDecorPiece(id, { limit: 3 });
assert.strictEqual(Dc.item(id).limit, 3);
D.Undo.undo();
assert.strictEqual(Dc.item(id).limit, 0, 'one Undo step a change');
Wk.setDecorZone(2, { regions: '4', boxes: [] });
assert.ok(Dc.zonesFor(2));
Wk.setDecorZone(2, { regions: '', boxes: [] });
assert.strictEqual(Dc.zonesFor(2), null);
// Shipped: a released piece that is gone.
const before = D.Shipped.snapshot({ decor: { catalog: [{ id: 'decor_old', name: 'Old Chair' }] } });
const now = D.Shipped.snapshot({ decor: { catalog: [] } });
assert.ok(D.Shipped.diff(before, now).some(f => f.type === 'decorGone'));
console.log('test_decor: OK');
