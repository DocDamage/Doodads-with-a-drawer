// Crash recovery keeps editor-only metadata (map notes and future bookmark schemas) exactly as it was
// when the editor stopped. The suite uses a private project directory even when run by itself.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

console.log('=== Testing Recovery Editor Metadata ===');

const repoRoot = process.env.DD_REPO_ROOT || path.resolve(__dirname, '..');
const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-recovery-metadata-'));
process.on('exit', () => { process.chdir(repoRoot); fs.rmSync(sandbox, { recursive: true, force: true }); });
process.chdir(sandbox);
fs.mkdirSync('data', { recursive: true });

global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.document = {
    createElement: () => ({ style: {}, appendChild() {}, removeChild() {}, querySelectorAll: () => [], addEventListener() {}, getContext: () => ({}) }),
    body: { appendChild() {}, removeChild() {} }, getElementById: () => null, querySelector: () => null
};
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: opt => opt === 'test' };
global.PluginManager = { parameters: () => ({}) };
global.$gameMap = { mapId: () => 1, displayX: () => 0, displayY: () => 0, tileWidth: () => 48, tileHeight: () => 48 };

require(path.join(repoRoot, 'Docs-Doodads.js'));
const D = DocsDoodads, P = D.Persistence, ws = D.Workspace;
ws.refreshSpriteset = () => {};
ws.updateSaveState = () => {};

const readSnapshot = () => JSON.parse(fs.readFileSync('data/DocsDoodadsRecovery.json', 'utf8'));

(async () => {
    // Metadata is project-wide: a snapshot from map 1 must include notes for every map and raw bookmark
    // data without depending on the later Bookmarks API's eventual representation.
    const notes = {
        1: [{ id: 'town', x: 2, y: 3, text: 'Town chest', done: false, colour: 'yellow' }],
        8: [{ id: 'cave', x: 4, y: 5, text: 'Cave exit', done: true, colour: 'blue' }]
    };
    const bookmarks = [{ id: 'home', mapId: 1, x: 2, y: 3 }, { id: 'cave', mapId: 8, x: 4, y: 5 }];
    global.$dataDocsDoodads = { 1: [], notes, bookmarks };
    P.dirtyDoodads = true;
    assert.strictEqual(await P.writeRecovery(), true, 'the unsaved metadata snapshot is written');
    const snapshot = readSnapshot();
    assert.deepStrictEqual(snapshot.notes, notes, 'notes from every map are captured');
    assert.deepStrictEqual(snapshot.bookmarks, bookmarks, 'raw global bookmarks are captured');

    global.$dataDocsDoodads = {
        1: [],
        notes: { 1: [{ id: 'old', text: 'saved note' }] },
        bookmarks: [{ id: 'old-bookmark', mapId: 1 }]
    };
    P.dirtyDoodads = false;
    ws.applyRecovery(snapshot);
    assert.deepStrictEqual($dataDocsDoodads.notes, notes, 'recovery restores notes for every map');
    assert.deepStrictEqual($dataDocsDoodads.bookmarks, bookmarks, 'recovery restores global bookmarks');
    assert.strictEqual(P.dirtyDoodads, true, 'recovered metadata remains saveable');

    // A new snapshot says that a metadata key was deliberately removed (null), so saved entries do not
    // return after a crash. Empty objects are retained as a distinct state as well.
    delete $dataDocsDoodads.notes;
    delete $dataDocsDoodads.bookmarks;
    P.dirtyDoodads = true;
    assert.strictEqual(await P.writeRecovery(), true, 'a deletion snapshot is written');
    const deleted = readSnapshot();
    assert.ok(Object.hasOwn(deleted, 'notes') && deleted.notes === null, 'deleted notes are explicit');
    assert.ok(Object.hasOwn(deleted, 'bookmarks') && deleted.bookmarks === null, 'deleted bookmarks are explicit');
    $dataDocsDoodads.notes = { 1: [{ id: 'saved-note' }] };
    $dataDocsDoodads.bookmarks = [{ id: 'saved-bookmark' }];
    ws.applyRecovery(deleted);
    assert.ok(!Object.hasOwn($dataDocsDoodads, 'notes'), 'recovery keeps notes deleted');
    assert.ok(!Object.hasOwn($dataDocsDoodads, 'bookmarks'), 'recovery keeps bookmarks deleted');

    $dataDocsDoodads.notes = {};
    $dataDocsDoodads.bookmarks = [];
    P.dirtyDoodads = true;
    assert.strictEqual(await P.writeRecovery(), true, 'an empty metadata snapshot is written');
    const empty = readSnapshot();
    assert.deepStrictEqual(empty.notes, {}, 'empty notes are not confused with deletion');
    assert.deepStrictEqual(empty.bookmarks, [], 'empty bookmarks are not confused with deletion');
    $dataDocsDoodads.notes = { 1: [{ id: 'saved-note' }] };
    $dataDocsDoodads.bookmarks = [{ id: 'saved-bookmark' }];
    ws.applyRecovery(empty);
    assert.deepStrictEqual($dataDocsDoodads.notes, {}, 'recovery restores an explicitly empty notes object');
    assert.deepStrictEqual($dataDocsDoodads.bookmarks, [], 'recovery restores an explicitly empty bookmarks array');

    // Dirty tracking must come from the metadata itself, even when a snapshot has no doodad payload.
    P.dirtyDoodads = false;
    ws.applyRecovery({ mapId: 1, notes, bookmarks });
    assert.strictEqual(P.dirtyDoodads, true, 'metadata-only recovery is saveable');
    assert.deepStrictEqual($dataDocsDoodads.notes, notes);
    assert.deepStrictEqual($dataDocsDoodads.bookmarks, bookmarks);

    // Old recovery files have no metadata keys. They still restore their original contents without
    // touching metadata loaded from disk.
    $dataDocsDoodads.notes = { 3: [{ id: 'saved-note' }] };
    $dataDocsDoodads.bookmarks = [{ id: 'saved-bookmark' }];
    ws.applyRecovery({ timestamp: 1, mapId: 1, doodads: [] });
    assert.deepStrictEqual($dataDocsDoodads.notes, { 3: [{ id: 'saved-note' }] }, 'legacy recovery preserves notes');
    assert.deepStrictEqual($dataDocsDoodads.bookmarks, [{ id: 'saved-bookmark' }], 'legacy recovery preserves bookmarks');

    console.log('✓ Recovery preserves, clears and restores editor metadata across every map.');
})().catch(error => { console.error(error); process.exitCode = 1; });
