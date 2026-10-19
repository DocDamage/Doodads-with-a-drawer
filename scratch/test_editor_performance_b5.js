// scratch/test_editor_performance_b5.js
// Phase B5 (§10.2 of docs/CREATOR_IMPROVEMENTS_PLAN.md): the editor's own work. The crash snapshot is
// written only when something changed (and a save in the meantime wins), the library is written a moment
// after a change and compact, key presses don't parse the saved keys, the usage index reads a map file only
// when it changed, an import indexes only its own files and walks dropped folders once, files are compared
// a piece at a time, the map panel's file list is built when wanted, thumbnails read disk in the background
// and keep one per item, and a save backs up only the files it changes, reading the backups folder once.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

console.log('=== Testing Editor Performance (B5) ===');

const elements = {};
function el(id) {
    if (!elements[id]) elements[id] = { id, value: '', checked: false, innerHTML: '', textContent: '', style: {}, firstChild: null,
        classList: { toggle() {}, add() {}, remove() {}, contains: () => false }, appendChild() {}, querySelectorAll: () => [],
        addEventListener() {}, setAttribute() {}, getAttribute: () => null };
    return elements[id];
}
global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.document = {
    createElement: tag => ({ tagName: String(tag).toUpperCase(), style: {}, appendChild() {}, setAttribute() {}, addEventListener() {}, querySelectorAll: () => [] }),
    body: { appendChild() {}, removeChild() {} },
    getElementById: id => el(id),
    querySelectorAll: () => [],
    addEventListener() {},
    removeEventListener() {}
};
const store = {};
global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } };
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: opt => opt === 'test' };
global.PluginManager = { parameters: () => ({}) };
global.$gameMap = { mapId: () => 1, displayX: () => 0, displayY: () => 0, tileWidth: () => 48, tileHeight: () => 48, width: () => 10, height: () => 8,
    isLoopHorizontal: () => false, isLoopVertical: () => false, events: () => [], eventsXy: () => [] };

// A project of our own in the system's temp folder: nothing is written in the repository.
const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-b5-'));
for (const dir of ['img/doodads', 'img/characters', 'data', 'audio/se']) fs.mkdirSync(path.join(sandbox, dir), { recursive: true });
const repoRoot = path.resolve(__dirname, '..');
process.on('exit', () => { process.chdir(repoRoot); fs.rmSync(sandbox, { recursive: true, force: true }); });
process.chdir(sandbox);
fs.writeFileSync('data/MapInfos.json', JSON.stringify([null, { id: 1, name: 'Town' }]));
fs.writeFileSync('data/Map001.json', JSON.stringify({ width: 10, height: 8, parallaxName: 'Sky', events: [null], data: [] }));
for (const name of ['Actors', 'Enemies', 'Tilesets', 'System', 'CommonEvents', 'Troops']) fs.writeFileSync(`data/${name}.json`, '[]');

require(path.join(repoRoot, 'Docs-Doodads.js'));
const D = DocsDoodads, ws = D.Workspace, AI = D.AssetIndex, P = D.Persistence, FS = D.FS;
ws.showToast = () => {};
ws.refreshSpriteset = () => {};
ws.refreshInspector = () => {};
ws.refreshDrawerCards = () => {};
ws.updateSaveState = () => {};
ws.renderMapTabs = () => {};
const tick = async () => { for (let i = 0; i < 6; i++) await new Promise(r => setImmediate(r)); };
const spy = (obj, key) => {
    const real = obj[key];
    const calls = [];
    obj[key] = function(...a) { calls.push(a); return real.apply(this, a); };
    calls.restore = () => { obj[key] = real; };
    return calls;
};

(async () => {
    // 1. The crash snapshot: written when there is unsaved work that changed since the last one.
    $dataDocsDoodads = { 1: [D.standardStruct()], mapSettings: {} };
    P.dirtyDoodads = false;
    assert.strictEqual(P.writeRecovery(), null, 'nothing unsaved: nothing written');
    P.dirtyDoodads = true;
    assert.strictEqual(await P.writeRecovery(), true, 'unsaved work is written');
    assert.ok(fs.existsSync('data/DocsDoodadsRecovery.json'));
    assert.strictEqual(P.writeRecovery(), null, 'nothing changed since: not written again');
    P.dirtyDoodads = true;
    const again = P.writeRecovery();
    assert.ok(again, 'another edit is written');
    assert.strictEqual(P.writeRecovery(), null, 'one write at a time');
    await again;
    // A save while a snapshot is being written wins: the snapshot isn't put back afterwards.
    P.dirtyDoodads = true;
    const late = P.writeRecovery();
    P.clearRecovery();
    assert.strictEqual(await late, false);
    assert.ok(!fs.existsSync('data/DocsDoodadsRecovery.json') && !fs.existsSync('data/DocsDoodadsRecovery.json.tmp'), 'no snapshot after the save');
    console.log('✓ Crash snapshot: only when changed, one at a time, a save wins.');

    // 2. The library: a moment after a change, written compact, and at once on Save and on closing.
    fs.writeFileSync('img/doodads/rock.png', 'x');
    AI.data = { version: 1, generatedAt: 1, assets: { 'img/doodads/rock.png': { id: 'img/doodads/rock.png', path: 'img/doodads/rock.png', tags: [], collections: [] } }, collections: {} };
    AI.rebuildList();
    const writes = spy(FS, 'atomicWriteJson');
    const libraryWrites = () => writes.filter(c => c[0] === AI.libraryPath).length;
    AI.toggleFavorite('img/doodads/rock.png');
    AI.setTags('img/doodads/rock.png', 'cave, stone');
    AI.addAssetToCollection('img/doodads/rock.png', 'Caves');
    assert.strictEqual(libraryWrites(), 0, 'favourite, tags and collections wait');
    AI.flushUsage();
    assert.strictEqual(libraryWrites(), 1, 'and are written together');
    assert.ok(!fs.readFileSync(AI.libraryPath, 'utf8').includes('\n'), 'compact');
    AI.toggleFavorite('img/doodads/rock.png');
    ws.mounted = true;
    ws.close();
    assert.strictEqual(libraryWrites(), 2, 'closing the editor writes what waits');
    AI.toggleFavorite('img/doodads/rock.png');
    D.leaveGuard.request('close the game', () => {});
    assert.strictEqual(libraryWrites(), 3, 'so does closing the game');
    writes.restore();
    console.log('✓ Library: written a moment after changes, compact, flushed on close.');

    // 3. Key presses: the saved keys are read once per change, not per row per press.
    const prefsRead = spy(D.Ui, 'prefs');
    const press = { key: 'z', code: 'KeyZ', ctrlKey: true };
    const first = D.Shortcuts.match(press);
    const readsForFirst = prefsRead.length;
    for (let i = 0; i < 20; i++) assert.strictEqual(D.Shortcuts.match(press), first);
    assert.strictEqual(prefsRead.length, readsForFirst, 'twenty presses read no preferences');
    const row = D.Shortcuts.list.find(s => !s.fixed && s.keys && !/Ctrl/.test(s.keys));
    D.Shortcuts.set(row.id, 'Ctrl+Alt+K');
    assert.strictEqual(D.Shortcuts.match({ key: 'k', code: 'KeyK', ctrlKey: true, altKey: true }), row.id, 'a new binding works at once');
    store[D.Ui.prefsKey] = JSON.stringify({ shortcuts: {} });
    assert.notStrictEqual(D.Shortcuts.match({ key: 'k', code: 'KeyK', ctrlKey: true, altKey: true }), row.id, 'keys changed elsewhere are seen');
    prefsRead.restore();
    console.log('✓ Shortcuts: compiled once per change of the saved keys.');

    // 4. The usage index: a map file is read again only when it changed on disk.
    const reads = spy(FS, 'readJson');
    const mapReads = () => reads.filter(c => c[0] === 'data/Map001.json').length;
    $dataDocsDoodads = { 1: [Object.assign(D.standardStruct(), { bit: [3, 'img/doodads/rock.png'] })], mapSettings: {} };
    let index = ws.refreshUsageIndex();
    assert.ok(index.has('img/parallaxes/sky') && index.has('img/doodads/rock'), 'maps and doodads are both in it');
    D.Undo.execute({ apply() {}, revert() {} });
    $dataDocsDoodads[1].push(Object.assign(D.standardStruct(), { bit: [3, 'img/doodads/tree.png'] }));
    index = ws.refreshUsageIndex();
    assert.strictEqual(mapReads(), 1, 'a step does not read the map again');
    assert.ok(index.has('img/doodads/tree'), 'but the doodads are current');
    const later = new Date(Date.now() + 5000);
    fs.writeFileSync('data/Map001.json', JSON.stringify({ width: 10, height: 8, parallaxName: 'Night', events: [null], data: [] }));
    fs.utimesSync('data/Map001.json', later, later);
    index = ws.refreshUsageIndex();
    assert.strictEqual(mapReads(), 2, 'a changed file is');
    assert.ok(index.has('img/parallaxes/night') && !index.has('img/parallaxes/sky'));
    reads.restore();
    console.log('✓ Usage index: map files read when they change, doodads every time.');

    // 5. Import: only the files written are indexed; dropped folders are walked once; files compared in pieces.
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-b5-drop-'));
    fs.writeFileSync(path.join(outside, 'Barrel.png'), 'png');
    fs.writeFileSync(path.join(outside, 'Crate.png'), 'png2');
    const scans = spy(AI, 'scanAsync');
    const walks = spy(D.Import, 'collectFiles');
    const collected = D.Import.collectFiles([outside]);
    const result = await ws.runAssetImport([outside], { destination: 'img/doodads', collisionPolicy: 'rename', collected });
    assert.ok(result.ok, 'imported');
    assert.strictEqual(scans.length, 0, 'no folder is walked again');
    assert.strictEqual(walks.length, 1, 'the dropped folder was walked once');
    assert.ok(AI.data.assets['img/doodads/barrel.png'] && AI.data.assets['img/doodads/crate.png'], 'the new files are in the Item Bag');
    scans.restore(); walks.restore();
    const big = Buffer.alloc(200000, 1), other = Buffer.from(big);
    other[0] = 2;
    fs.writeFileSync(path.join(outside, 'a.bin'), big);
    fs.writeFileSync(path.join(outside, 'b.bin'), other);
    fs.writeFileSync(path.join(outside, 'c.bin'), big);
    assert.strictEqual(D.Import.filesEqual(path.join(outside, 'a.bin'), path.join(outside, 'b.bin')), false, 'a difference at the start');
    assert.strictEqual(D.Import.filesEqual(path.join(outside, 'a.bin'), path.join(outside, 'c.bin')), true, 'the same bytes');
    fs.rmSync(outside, { recursive: true, force: true });
    console.log('✓ Import: indexes its own files, walks folders once, compares files in pieces.');

    // 6. The map panel's file list: empty until a field wants it, built once per library change.
    assert.strictEqual(ws.doodadFilesDatalist(), '<datalist id="dd-doodad-files"></datalist>');
    const built = spy(Object, 'values');
    const one = ws.doodadFilesOptions();
    const builds = built.length;
    assert.strictEqual(ws.doodadFilesOptions(), one);
    assert.strictEqual(built.length, builds, 'the second ask builds nothing');
    built.restore();
    assert.ok(one.includes('img/doodads/rock.png'));
    AI.data.generatedAt++;
    AI.data.assets['img/doodads/new.png'] = { id: 'img/doodads/new.png', path: 'img/doodads/new.png' };
    assert.ok(ws.doodadFilesOptions().includes('img/doodads/new.png'), 'a changed library is seen');
    let focus = null;
    const input = { addEventListener: (type, fn) => { if (type === 'focus') focus = fn; } };
    el('dd-doodad-files').firstChild = null;
    ws.bindDoodadFilesDatalist({ querySelectorAll: sel => (sel.includes('dd-doodad-files') ? [input] : []) });
    assert.strictEqual(el('dd-doodad-files').innerHTML, '', 'nothing until a field is focused');
    focus();
    assert.ok(el('dd-doodad-files').innerHTML.includes('img/doodads/rock.png'), 'filled on focus');
    console.log('✓ Map panel: the file list is built when a field wants it.');

    // 7. Thumbnails: the disk copy is read in the background, and the cache keeps one per item.
    const T = D.Thumbnail;
    T.cache = {}; T.cacheOrder = new Map(); T.queue = []; T.pending = {}; T.failed.clear(); T.active = 0;
    const asset = { id: 'img/doodads/rock.png', mtimeMs: 7, path: 'img/doodads/rock.png' };
    FS.mkdirp(T.diskDir);
    fs.writeFileSync(T.getDiskPath(T.keyFor(asset, 96)), 'data:image/png;base64,DISK');
    const syncReads = spy(FS.fs, 'readFileSync');
    let shown = null;
    T.get(asset, 96, url => { shown = url; });
    assert.strictEqual(shown, null, 'not read while the grid is drawn');
    await new Promise(r => setTimeout(r, 50));
    assert.strictEqual(shown, 'data:image/png;base64,DISK', 'read from disk in the background');
    assert.strictEqual(syncReads.filter(c => String(c[0]).includes('thumbnails')).length, 0, 'without blocking');
    syncReads.restore();
    const savedList = AI.list;
    AI.list = new Array(1200).fill(null);
    assert.strictEqual(T.capacity(), 1200, 'one per item in a bigger Item Bag');
    AI.list = new Array(9000).fill(null);
    assert.strictEqual(T.capacity(), T.cacheCeiling, 'up to the ceiling');
    AI.list = savedList;
    await T.flushed();
    console.log('✓ Thumbnails: disk read in the background, the cache sized to the Item Bag.');

    // 8. Save: backups only of the files that change, the backups folder read once.
    AI.data = { version: 1, generatedAt: 1, assets: {}, collections: {} };
    $dataDocsDoodads = { 1: [D.standardStruct()], mapSettings: {} };
    P.checkConflict = () => false;
    P.dirtyDoodads = true;
    assert.strictEqual(P.saveAll(), true, 'first save');
    const backups = () => (fs.existsSync('data/docs_doodads_cache/backups') ? fs.readdirSync('data/docs_doodads_cache/backups').filter(f => f.endsWith('.bak')) : []);
    const afterFirst = backups().length;
    const dirReads = spy(FS.fs, 'readdirSync');
    P.dirtyDoodads = true;
    assert.strictEqual(P.saveAll(), true, 'saved again, nothing changed');
    assert.strictEqual(backups().length, afterFirst, 'no backups of files that stay the same');
    $dataDocsDoodads[1].push(D.standardStruct());
    P.dirtyDoodads = true;
    assert.strictEqual(P.saveAll(), true, 'saved with a new doodad');
    const made = backups().length - afterFirst;
    assert.ok(made >= 1 && made <= 2, 'backups of the doodads only: ' + made);
    assert.ok(dirReads.filter(c => String(c[0]).includes('backups')).length <= 1, 'the backups folder read once for the save');
    dirReads.restore();
    console.log('✓ Save: backs up only what changes, one look at the backups folder.');

    console.log('\nAll editor performance (B5) checks passed.');
})().catch(error => { console.error(error); process.exit(1); });
