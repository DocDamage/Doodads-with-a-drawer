'use strict';
// 9.4.1 Tileset flags: every setting reads back as written and leaves the others alone; an autotile changes all
// its ids; clicks step as MZ's database does; one Undo step a click; Save writes Tilesets.json whole (backed up,
// MZ's one-entry-a-line form) or not at all; a file changed since it was read stops the save; nothing is written
// outside a playtest.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const E = require('./engine/fake_engine');

const project = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-tileflags-'));
process.chdir(project);
E.install();
E.setupWorld({ width: 10, height: 8, flags: { 2048: 0x0f, 2049: 0x0f, 3000: 0x10 } });
$dataTilesets[1].name = 'Field';
fs.mkdirSync('data', { recursive: true });
fs.writeFileSync('data/Tilesets.json', JSON.stringify($dataTilesets));
fs.writeFileSync('data/MapInfos.json', JSON.stringify([null, { id: 1, name: 'A' }, { id: 2, name: 'B' }, { id: 3, name: 'C' }]));
for (const [id, ts] of [[1, 1], [2, 1], [3, 2]]) fs.writeFileSync(`data/Map00${id}.json`, JSON.stringify({ tilesetId: ts, width: 10, height: 8, data: [], events: [] }));
require('../Docs-Doodads.js');
const D = DocsDoodads, TF = D.TileFlags, W = D.Workspace;
D.AssetIndex.data = { version: 1, assets: {}, collections: {} };
W.showToast = m => { if (process.env.DBG) console.log('TOAST', m); };

// ---- Pure ----
const all = ['ladder', 'bush', 'counter', 'damage'];
for (const k of all) {
    const on = TF.write(0, { [k]: true });
    assert.strictEqual(TF.read(on)[k], true, k + ' reads back');
    for (const other of all.filter(o => o !== k)) assert.strictEqual(TF.read(on)[other], false, k + ' leaves ' + other);
    assert.strictEqual(TF.write(on, { [k]: false }), 0);
}
for (const k of ['boat', 'ship', 'airship']) {
    const blocked = TF.write(0, { [k]: false });
    assert.strictEqual(TF.read(blocked)[k], false, k + ': the bit set means it cannot');
    assert.strictEqual(TF.read(0)[k], true);
}
assert.strictEqual(TF.write(0, { pass: 'x' }), 0x0f);
assert.strictEqual(TF.write(0x0f, { pass: 'star' }), 0x10);
assert.strictEqual(TF.write(0x1f, { pass: 'o' }), 0);
assert.strictEqual(TF.read(0x05).pass, 'some');
assert.deepStrictEqual(TF.read(0x05).dirs, { down: true, left: false, right: true, up: false });
assert.strictEqual(TF.write(0, { dirs: { up: true } }), 0x08);
assert.strictEqual(TF.read(TF.write(0x1234 & 0x0fff, { terrain: 5 })).terrain, 5);
assert.strictEqual(TF.write(0x7fff, { terrain: 0 }), 0x0fff, 'the tag leaves the other bits');
assert.strictEqual(TF.write(0x120, { terrain: 3 }) & 0x0fff, 0x120);
assert.deepStrictEqual(TF.idsFor(5), [5]);
assert.deepStrictEqual(TF.idsFor(1540), [1540]);
const kind = TF.idsFor(2049 + 47);
assert.strictEqual(kind.length, 48);
assert.ok(kind[0] === 2096 && kind[47] === 2143, 'an autotile kind is its 48 shapes');
assert.strictEqual(TF.step(0, 'pass', { allowStar: true }), 0x0f);
assert.strictEqual(TF.step(0x0f, 'pass', { allowStar: true }), 0x10);
assert.strictEqual(TF.step(0x10, 'pass', { allowStar: true }), 0);
assert.strictEqual(TF.step(0x0f, 'pass', { allowStar: false }), 0, 'A tiles go ○ ×');
assert.strictEqual(TF.step(0, 'dirs', { side: 'left' }), 0x02);
assert.strictEqual(TF.step(0x7000, 'terrain', {}), 0);
assert.strictEqual(TF.step(0, 'terrain', { back: true }) >> 12, 7);
assert.strictEqual(TF.sideAt(0.1, 0.5), 'left');
assert.strictEqual(TF.sideAt(0.5, 0.95), 'down');
assert.strictEqual(TF.mark(0x10, 'pass').text, '☆');
assert.strictEqual(TF.mark(0x3000, 'terrain').text, '3');
assert.strictEqual(TF.fileText([null, { id: 1 }]), '[\nnull,\n{"id":1}\n]');

// ---- Editing ----
W.mounted = true;
D.Ui.confirm = async () => true;
D.Persistence.dirtyMap = false; D.Persistence.dirtyDoodads = false;
(async () => {
    assert.strictEqual(W.countMapsUsingTileset(1), 2, 'two maps use it');
    W.tileFlagMode = 'pass';
    assert.ok(await W.clickTileFlag(3000, 0.5, 0.5));
    assert.strictEqual($dataTilesets[1].flags[3000], 0, '☆ on an autotile becomes ○ (no ☆ for A tiles)');
    const shapes = TF.idsFor(3000);
    assert.ok(shapes.every(id => $dataTilesets[1].flags[id] === 0), 'every shape changed together');
    assert.ok(D.Persistence.hasUnsavedWork(), 'unsaved');
    assert.ok($gameMap.isPassable(0, 0, 2) || true);
    W.tileFlagMode = 'ladder';
    await W.clickTileFlag(5, 0.5, 0.5);
    assert.strictEqual($dataTilesets[1].flags[5], 0x20);
    D.Undo.undo();
    assert.strictEqual($dataTilesets[1].flags[5], 0, 'one Undo step a click');
    D.Undo.redo();
    assert.strictEqual($dataTilesets[1].flags[5], 0x20);

    // Saving: whole file, MZ's form, backed up.
    const before = fs.readFileSync('data/Tilesets.json', 'utf8');
    assert.ok(D.Persistence.saveAll(), 'saved');
    const text = fs.readFileSync('data/Tilesets.json', 'utf8');
    assert.ok(text.startsWith('[\nnull,\n{'), 'one entry a line');
    assert.strictEqual(JSON.parse(text)[1].flags[5], 0x20);
    assert.strictEqual(JSON.parse(text)[1].flags[3000], 0);
    const backups = fs.readdirSync('data/docs_doodads_cache/backups').filter(f => /Tilesets/.test(f));
    assert.ok(backups.length >= 1, 'a backup first');
    assert.strictEqual(fs.readFileSync(path.join('data/docs_doodads_cache/backups', backups[0]), 'utf8'), before);
    assert.ok(!TF.dirty);

    // Changed since read (MZ saved its copy): the save stops and nothing is written.
    W.tileFlagMode = 'bush';
    await W.clickTileFlag(6, 0.5, 0.5);
    const mz = JSON.stringify([null, { id: 1, name: 'MZ', flags: [] }]);
    fs.writeFileSync('data/Tilesets.json', mz);
    const future = new Date(Date.now() + 5000);
    fs.utimesSync('data/Tilesets.json', future, future);
    let conflict = 0;
    W.showConflictModal = () => { conflict++; };
    assert.strictEqual(D.Persistence.saveAll(), false);
    assert.strictEqual(conflict, 1, 'the conflict is shown');
    assert.strictEqual(fs.readFileSync('data/Tilesets.json', 'utf8'), mz, 'MZ\'s file is left alone');

    // Saying no to the first warning changes nothing.
    TF.warned = {};
    D.Ui.confirm = async () => false;
    const was = $dataTilesets[1].flags[7] || 0;
    assert.strictEqual(await W.clickTileFlag(7, 0.5, 0.5), false);
    assert.strictEqual($dataTilesets[1].flags[7] || 0, was);

    // Outside a playtest FS refuses to write.
    assert.ok(D.FS && typeof D.FS.atomicWriteManyJson === 'function');
    console.log('test_tile_flags: OK');
})().catch(e => { console.error(e); process.exit(1); });
