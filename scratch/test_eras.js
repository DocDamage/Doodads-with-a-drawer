'use strict';
// 8.4.5 Map eras: visibility; a doodad with no eras is in all; the switch and variable pick; collision and drawing
// follow the era with a crossfade; old data with no eras loads unchanged; the editor's add, only-in, copy and delete
// (which asks what to do) as Undo steps; onion skin while editing.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const E = require('./engine/fake_engine');

process.chdir(fs.mkdtempSync(path.join(os.tmpdir(), 'dd-eras-')));
E.install();
E.setupWorld({ width: 16, height: 12, px: 2, py: 2 });
const house = E.doodad(6, 6, { uid: 'house', eras: ['now'], collision: { preset: 'full' } });
const ruin = E.doodad(6, 6, { uid: 'ruin', eras: ['ruined'] });
const tree = E.doodad(9, 6, { uid: 'tree' });
$dataDocsDoodads[1] = [house, ruin, tree];
require('../Docs-Doodads.js');
const D = DocsDoodads, Er = D.Eras;

// ---- Pure ----
assert.ok(Er.visible(tree, 'now') && Er.visible(tree, 'ruined'), 'no eras: in all');
assert.ok(Er.visible(house, 'now') && !Er.visible(house, 'ruined'));
assert.strictEqual(Er.of(1), null, 'old data with no eras');
assert.strictEqual(Er.current(1), null);

// ---- Old data: unchanged ----
const ss = new Spriteset_Map();
SceneManager._scene = { _spriteset: ss };
E.frames(ss, 2);
const sprite = d => ss._docsDoodadSprites.find(s => s._data === d);
assert.ok(sprite(house).visible && sprite(ruin).visible && sprite(tree).visible, 'without eras every doodad shows');

// ---- With eras ----
$dataDocsDoodads.eras = { 1: { list: [{ id: 'now', name: 'Now' }, { id: 'ruined', name: 'Ruined' }], pick: { switchId: 5 } } };
assert.strictEqual(Er.current(1, () => false), 'now');
assert.strictEqual(Er.current(1, () => true), 'ruined', 'the switch picks the second');
$dataDocsDoodads.eras[1].pick = { variableId: 3 };
assert.strictEqual(Er.current(1, null, () => 1), 'ruined', 'the variable picks by number');
assert.strictEqual(Er.current(1, null, () => 99), 'ruined', 'clamped');
$dataDocsDoodads.eras[1].pick = { switchId: 5 };
E.frames(ss, 2);
assert.ok(sprite(house).visible && !sprite(ruin).visible && sprite(tree).visible, 'only the first era shows');
assert.ok(D.Collision.blocksTile(6, 5), 'the house blocks');
$gameSwitches.setValue(5, true);
E.frames(ss, 10);
assert.ok(sprite(house).visible && sprite(ruin).visible, 'crossfading');
assert.ok(sprite(house).alpha < 1 && sprite(ruin).alpha < 1);
E.frames(ss, 30);
assert.ok(!sprite(house).visible && sprite(ruin).visible, 'the ruin now');
assert.ok(Math.abs(sprite(ruin).alpha - 1) < 1e-9);
assert.ok(!D.Collision.blocksTile(6, 5), 'collision follows what shows');

// ---- The editor ----
const W = D.Workspace;
W.mounted = true; W.showToast = () => {};
const id = W.addEra(1, 'Burning');
assert.ok(Er.of(1).list.some(e => e.id === id && e.name === 'Burning'));
W.setDoodadEras(1, ['tree'], id);
assert.deepStrictEqual($dataDocsDoodads[1].find(d => d.uid === 'tree').eras, [id]);
D.Undo.undo();
assert.ok(!$dataDocsDoodads[1].find(d => d.uid === 'tree').eras, 'one Undo step');
D.Undo.redo();
const copy = W.copyEra(1, 'ruined', 'Overgrown');
const copies = $dataDocsDoodads[1].filter(d => d.eras && d.eras[0] === copy);
assert.strictEqual(copies.length, 1, 'the ruin is copied into the new era');
assert.notStrictEqual(copies[0].uid, 'ruin', 'with its own id');
// Onion skin: editing the Now era, the ruin is faint.
W.setEditingEra(1, 'now');
E.frames(ss, 1);
const ruinNow = ss._docsDoodadSprites.find(s => s._data.uid === 'ruin');
assert.ok(ruinNow.alpha <= Er.onion + 1e-9, 'other eras drawn faint');
// Deleting an era asks what to do with its doodads.
W.deleteEra(1, copy, 'delete');
assert.ok(!$dataDocsDoodads[1].some(d => d.eras && d.eras.includes(copy)), 'its own doodads deleted');
W.deleteEra(1, id, 'all');
assert.ok(!$dataDocsDoodads[1].find(d => d.uid === 'tree').eras, 'or kept in every era');
W.deleteEra(1, 'ruined', 'all');
assert.strictEqual(Er.of(1), null, 'one era left is no eras');
assert.ok($dataDocsDoodads[1].every(d => !d.eras), 'and every doodad shows again');
console.log('test_eras: OK');
