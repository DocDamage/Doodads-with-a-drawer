// scratch/test_editor_safety_b2.js
// Plan B2 (§9.1, §9.2): the editor's data safety and behaviour. Rebuild Index keeps what people set,
// the library is read again only when it changed, restoring a backup starts Undo again, packs ask before
// replacing and are written whole, a pack can't write into data/, the slicer saves its thumbnail and asks
// before closing, its keys follow the shortcut table, Placement Mode is saved, shortcuts reach the editor
// from a field, Esc lets an event go, a duplicated event stays on the map, the active layer follows the
// map, the z-order acts on the selection, hidden doodads can be shown again, and import routes by words.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== Testing Editor Data Safety and Behaviour (B2) ===');

const elements = {};
function el(id) {
    if (!elements[id]) elements[id] = { id, value: '', checked: false, innerHTML: '', textContent: '', style: {}, onclick: null,
        childNodes: [], classList: { toggle() {}, add() {}, remove() {}, contains: () => false }, appendChild(c) { this.childNodes.push(c); },
        querySelectorAll: () => [], addEventListener() {}, setAttribute() {}, getAttribute: () => null, click() {} };
    return elements[id];
}
const winListeners = [];
global.window = global;
global.window.addEventListener = (type, fn) => winListeners.push({ type, fn });
global.window.removeEventListener = () => {};
global.document = {
    createElement: tag => ({ tagName: String(tag).toUpperCase(), style: {}, childNodes: [], appendChild(c) { this.childNodes.push(c); return c; },
        setAttribute() {}, addEventListener() {}, removeEventListener() {}, querySelectorAll: () => [] }),
    body: { appendChild() {}, removeChild() {} },
    getElementById: id => el(id),
    querySelectorAll: () => [],
    addEventListener() {},
    removeEventListener() {},
    activeElement: null
};
const store = {};
global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } };
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: opt => opt === 'test' };
global.PluginManager = { parameters: () => ({}) };
global.$gameMap = { mapId: () => 1, displayX: () => 0, displayY: () => 0, tileWidth: () => 48, tileHeight: () => 48, width: () => 10, height: () => 8,
    isLoopHorizontal: () => false, isLoopVertical: () => false, events: () => [], eventsXy: () => [] };

// A project of our own: files are written here, never in the repository.
const sandbox = path.join(__dirname, 'editor_safety_fixture');
fs.rmSync(sandbox, { recursive: true, force: true });
fs.mkdirSync(path.join(sandbox, 'img', 'doodads'), { recursive: true });
fs.mkdirSync(path.join(sandbox, 'data'), { recursive: true });
process.on('exit', () => { process.chdir(__dirname); fs.rmSync(sandbox, { recursive: true, force: true }); });
process.chdir(sandbox);

require('../Docs-Doodads.js');
const D = DocsDoodads, ws = D.Workspace, AI = D.AssetIndex, Undo = D.Undo;
const toasts = [];
ws.showToast = (msg, kind) => toasts.push([msg, kind]);
ws.toastUndo = msg => toasts.push([msg, 'undo']);
ws.refreshSpriteset = () => {};
ws.refreshInspector = () => {};
ws.refreshDrawerCards = () => {};
ws.mounted = true;
const doodad = props => Object.assign(D.standardStruct(), { frameW: 48, frameH: 48 }, props);
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
    // 1. Rebuild Index keeps tags, favourites, collections, hand-cut pieces, collision, placement and use counts.
    fs.writeFileSync('img/doodads/rock.png', 'not really a png');
    fs.writeFileSync('img/doodads/tree.png', 'not really a png either');
    const stat = fs.statSync('img/doodads/rock.png');
    const mine = {
        id: 'img/doodads/rock.png', path: 'img/doodads/rock.png', fileName: 'rock.png', type: 'doodad', mtimeMs: stat.mtimeMs, sizeBytes: stat.size,
        entryRevision: AI.entryRevision, tags: ['cave'], favorite: true, collections: ['Caves'],
        slice: { status: 'manual', method: 'manual', confidence: 1, regions: [{ id: 'r1', x: 0, y: 0, w: 8, h: 8 }] },
        collision: { preset: 'bottomHalf', shape: null }, placement: { defaultMode: 'event', characterIndex: 3 }, usage: { lastUsedAt: 5, useCount: 9 }
    };
    AI.data = { version: 1, projectId: 'test', generatedAt: 0, assets: { 'img/doodads/rock.png': JSON.parse(JSON.stringify(mine)) },
        collections: { Caves: ['img/doodads/rock.png', 'img/doodads/gone.png'] }, settings: {} };
    AI.rebuildList();
    const result = await AI.rebuild({ roots: ['img/doodads'] });
    assert.strictEqual(result.indexed, 2, 'every file is read again, the known one too');
    const rock = AI.data.assets['img/doodads/rock.png'];
    for (const key of ['tags', 'favorite', 'collections', 'slice', 'collision', 'placement', 'usage']) assert.deepStrictEqual(rock[key], mine[key], key + ' kept');
    assert.strictEqual(rock.entryRevision, AI.entryRevision);
    assert.ok(AI.data.assets['img/doodads/tree.png'], 'a new file is found');
    assert.ok(fs.existsSync(AI.libraryPath), 'and the library saved');
    // The Rebuild button asks first; No changes nothing.
    let asked = 0, rebuilt = 0;
    const realRebuild = AI.rebuild;
    AI.rebuild = async () => { rebuilt++; return { indexed: 0 }; };
    D.Ui.confirm = async () => { asked++; return false; };
    D.Ui.progress = () => ({ update() {}, finish() {} });
    ws.openDiagnosticsModal();
    await el('dd-rebuild-idx-btn').onclick();
    assert.deepStrictEqual([asked, rebuilt], [1, 0], 'asked, and No rebuilds nothing');
    D.Ui.confirm = async () => true;
    await el('dd-rebuild-idx-btn').onclick();
    assert.strictEqual(rebuilt, 1);
    AI.rebuild = realRebuild;
    console.log('✓ rebuild index: asks first, keeps what people set, finds new files');

    // 2. The library is read again only when its file changed; the editor's pointers follow.
    AI.save();
    const before = AI.data;
    assert.strictEqual(AI.init(), false, 'unchanged since our own save: not read again');
    assert.strictEqual(AI.data, before, 'the same objects');
    const onDisk = JSON.parse(fs.readFileSync(AI.libraryPath, 'utf8'));
    onDisk.assets['img/doodads/rock.png'].tags = ['cave', 'edited elsewhere'];
    fs.writeFileSync(AI.libraryPath, JSON.stringify(onDisk, null, 4));
    ws.selectedAsset = before.assets['img/doodads/rock.png'];
    ws.lastAsset = before.assets['img/doodads/tree.png'];
    ws.similarResults = [before.assets['img/doodads/tree.png']];
    ws.filteredAssets = [before.assets['img/doodads/rock.png'], { id: 'pf', type: 'prefab' }];
    assert.strictEqual(AI.init(), true, 'changed on disk: read again');
    ws.reresolveAssets();
    assert.notStrictEqual(AI.data, before);
    assert.strictEqual(ws.selectedAsset, AI.data.assets['img/doodads/rock.png']);
    assert.deepStrictEqual(ws.selectedAsset.tags, ['cave', 'edited elsewhere']);
    assert.strictEqual(ws.lastAsset, AI.data.assets['img/doodads/tree.png']);
    assert.strictEqual(ws.similarResults[0], AI.data.assets['img/doodads/tree.png']);
    assert.strictEqual(ws.filteredAssets[0], AI.data.assets['img/doodads/rock.png']);
    assert.strictEqual(ws.filteredAssets[1].type, 'prefab', 'prefabs stay');
    AI.data = { version: 1, assets: {}, collections: {}, settings: {} };
    assert.strictEqual(AI.init(), true, 'data replaced in memory: read again');
    // Placement Mode and Character on Sheet are saved, once, a moment after the last change.
    let saves = 0;
    const realSave = AI.save;
    AI.save = function() { saves++; return realSave.call(this); };
    AI.saveSoon(15); AI.saveSoon(15); AI.saveSoon(15);
    await wait(40);
    assert.strictEqual(saves, 1, 'three quick changes, one write');
    AI.save = realSave;
    const src = fs.readFileSync(path.join(__dirname, '..', 'src', '38_workspace_inspector.js'), 'utf8');
    assert.ok(/defaultMode = e\.target\.value;[\s\S]{0,200}saveSoon\(/.test(src), 'Placement Mode is saved');
    assert.ok(/characterIndex = parseInt\(e\.target\.value, 10\) \|\| 0;[\s\S]{0,80}saveSoon\(/.test(src), 'Character on Sheet is saved');
    console.log('✓ library: read again only when changed, pointers re-resolved, placement saved (debounced)');

    // 3. Restoring a backup: Undo starts again, nothing unsaved is left, staged maps go.
    fs.writeFileSync(D.DataFiles.mainPath(), JSON.stringify({ 1: [doodad({ bit: [3, 'img/doodads/rock.png'], x: 7 })] }));
    global.$dataDocsDoodads = { 1: [doodad({ bit: [3, 'img/doodads/rock.png'], x: 99 })] };
    Undo.execute({ type: 'test', apply() {}, revert() {} });
    D.Persistence.dirtyDoodads = true;
    $gameMap._stagedMapData = { events: [null] };
    $gameMap._stagedMapDataId = 1;
    D.Persistence.stagedMaps = { 2: { events: [null] } };
    ws.selectedDoodad = $dataDocsDoodads[1][0];
    assert.strictEqual(ws.afterRestore(D.DataFiles.mainPath()), 'data');
    assert.deepStrictEqual([Undo.undoStack.length, Undo.redoStack.length], [0, 0], 'Undo has nothing pointing at the old data');
    assert.ok(!D.Persistence.hasUnsavedWork(), 'nothing unsaved');
    assert.strictEqual($gameMap._stagedMapData, null);
    assert.deepStrictEqual(D.Persistence.stagedMaps, {});
    assert.strictEqual($dataDocsDoodads[1][0].x, 7, 'the doodads are the restored ones');
    assert.strictEqual(ws.selectedDoodad, null, 'nothing picked from the old data');
    console.log('✓ backup restore: undo cleared, unsaved flags reset, staged maps cleared');

    // 4. Packs: asked before replacing, written whole, never into data/.
    const P = D.Packs;
    assert.ok(!P.safePath('data/DocsDoodads/DocsDoodads-Map001.json') && !P.safePath('data/DocsDoodads.json'), 'nothing in data/');
    assert.ok(P.safePath('img/doodads/a.png') && P.safePath('audio/se/a.ogg') && P.safePath('models/a.glb'));
    const realGather = P.gather, realBuild = P.build;
    let version = 'one';
    P.gather = () => ({ contents: { prefabs: [{}], rooms: [], biomes: [], dress: [], collections: {} }, files: [] });
    P.build = name => ({ name, format: P.format, version: 1, files: {}, missing: [], library: {}, contents: {}, mark: version });
    const ok = await ws.exportPack('Kit', {});
    assert.ok(ok && fs.existsSync('packs/Kit.ddpack'));
    version = 'two';
    asked = 0;
    D.Ui.confirm = async text => { asked++; assert.ok(/already there/.test(text)); return false; };
    assert.strictEqual(await ws.exportPack('Kit', {}), null, 'No keeps the old pack');
    assert.strictEqual(JSON.parse(fs.readFileSync('packs/Kit.ddpack', 'utf8')).mark, 'one');
    D.Ui.confirm = async () => true;
    await ws.exportPack('Kit', {});
    assert.strictEqual(JSON.parse(fs.readFileSync('packs/Kit.ddpack', 'utf8')).mark, 'two', 'Yes replaces it');
    assert.ok(!fs.existsSync('packs/Kit.ddpack.tmp'), 'no temporary file left');
    // A write that fails half-way leaves the old file as it was.
    const realRename = D.FS.fs.renameSync;
    D.FS.fs.renameSync = () => { throw new Error('disk full'); };
    version = 'three';
    assert.strictEqual(await ws.exportPack('Kit', {}), null);
    D.FS.fs.renameSync = realRename;
    assert.strictEqual(JSON.parse(fs.readFileSync('packs/Kit.ddpack', 'utf8')).mark, 'two', 'the old pack is whole');
    assert.ok(!fs.existsSync('packs/Kit.ddpack.tmp'));
    assert.ok(/Could not save the pack: disk full/.test(toasts[toasts.length - 1][0]));
    P.gather = realGather; P.build = realBuild;
    console.log('✓ packs: ask before replacing, atomic write, data/ refused');

    // 5. The slicer: Save refreshes the bag's picture; closing with changes asks; keys from the table; a
    // click that doesn't drag is no undo step.
    const S = D.Slicing.Editor;
    let invalidated = null;
    const realInvalidate = D.Thumbnail.invalidate;
    D.Thumbnail.invalidate = id => { invalidated = id; };
    const startSlicer = () => {
        S.modal = { parentNode: null };
        S.container = {};
        S.asset = AI.data.assets['img/doodads/rock.png'] || (AI.data.assets['img/doodads/rock.png'] = JSON.parse(JSON.stringify(mine)));
        S.regions = [{ id: 'a', name: 'A', x: 0, y: 0, w: 10, h: 10 }];
        S._savedRegions = JSON.stringify(S.regions);
        S.undoStack = []; S.redoStack = [];
        S.render = () => {}; S.updateRegionList = () => {}; S.updateUndoButtons = () => {};
    };
    startSlicer();
    assert.strictEqual(S.hasChanges(), false);
    let choice = 'stay', chooseAsked = 0;
    D.Ui.choose = async (text, buttons) => { chooseAsked++; assert.ok(buttons.some(b => b.value === 'save')); return choice; };
    await S.requestClose();
    assert.strictEqual(chooseAsked, 0, 'nothing changed: closes without asking');
    assert.strictEqual(S.modal, null);
    startSlicer();
    S.regions[0].w = 20;
    assert.strictEqual(await S.requestClose(), false, 'Keep Editing');
    assert.ok(S.modal && chooseAsked === 1);
    choice = 'discard';
    await S.requestClose();
    assert.strictEqual(S.modal, null, "Don't Save closes");
    assert.strictEqual(AI.data.assets['img/doodads/rock.png'].slice.regions[0].w, 8, 'and saves nothing');
    startSlicer();
    S.regions[0].w = 30;
    choice = 'save';
    await S.requestClose();
    assert.strictEqual(AI.data.assets['img/doodads/rock.png'].slice.regions[0].w, 30, 'Save Pieces saves');
    assert.strictEqual(invalidated, 'img/doodads/rock.png', "and the bag's picture is made again");
    // Esc asks too, and not while a question card is open.
    startSlicer();
    S.regions[0].x = 4;
    chooseAsked = 0; choice = 'stay';
    S.handleKeyDown({ key: 'Escape', target: {}, preventDefault() {} });
    await wait(5);
    assert.strictEqual(chooseAsked, 1, 'Esc asks');
    // Undo, Redo and Duplicate follow the shortcut table.
    let undone = 0;
    S.undo = () => { undone++; };
    D.Shortcuts.set('undo', 'Ctrl+U');
    S.handleKeyDown({ key: 'z', code: 'KeyZ', ctrlKey: true, target: {}, preventDefault() {} });
    assert.strictEqual(undone, 0, 'Ctrl+Z is no longer Undo');
    S.handleKeyDown({ key: 'u', code: 'KeyU', ctrlKey: true, target: {}, preventDefault() {} });
    assert.strictEqual(undone, 1, 'the rebound key is');
    D.Shortcuts.set('undo', 'Ctrl+Z');
    delete S.undo;
    // A click on a piece without moving it adds no step; a drag that moves it adds one.
    S._dragBefore = JSON.stringify(S.regions);
    S.isDraggingHandle = true;
    S.onWindowMouseUp();
    assert.strictEqual(S.undoStack.length, 0, 'a click is no undo step');
    S._dragBefore = JSON.stringify(S.regions);
    S.isDraggingHandle = true;
    S.regions[0].x = 9;
    S.onWindowMouseUp();
    assert.strictEqual(S.undoStack.length, 1, 'a drag is one');
    assert.strictEqual(JSON.parse(S.undoStack[0])[0].x, 4, 'the step goes back to before the drag');
    // Closing the editor asks about the pieces first.
    let wsClosed = false;
    const realWsClose = ws.close;
    ws.close = () => { wsClosed = true; };
    choice = 'stay';
    assert.strictEqual(await ws.requestClose(), false, 'Keep Editing keeps the editor open');
    assert.strictEqual(wsClosed, false);
    ws.close = realWsClose;
    S.modal = null;
    D.Thumbnail.invalidate = realInvalidate;
    console.log('✓ slicer: thumbnail refreshed, asks before closing, rebound keys, drag-only undo steps');

    // 6. Shortcuts from a field: chords that don't type reach the editor, the field's own keys stay.
    const SC = D.Shortcuts;
    const k = (key, mods = {}) => Object.assign({ key, code: /^[a-z]$/i.test(key) ? 'Key' + key.toUpperCase() : key }, mods);
    assert.ok(SC.passesField(k('s', { ctrlKey: true })), 'Ctrl+S');
    assert.ok(SC.passesField(k('k', { ctrlKey: true })), 'Ctrl+K');
    assert.ok(SC.passesField(k('F6')), 'F6');
    for (const key of ['z', 'y', 'a', 'c', 'v', 'x', 'Z', 'V']) assert.ok(!SC.passesField(k(key, { ctrlKey: true })), 'Ctrl+' + key + ' belongs to the field');
    assert.ok(!SC.passesField(k('ArrowLeft', { ctrlKey: true })) && !SC.passesField(k('Backspace', { ctrlKey: true })), 'moving and deleting by word');
    assert.ok(!SC.passesField(k('s')) && !SC.passesField(k('Delete')) && !SC.passesField(k('Escape')), 'keys that type or edit');
    assert.ok(!SC.passesField(k('q', { ctrlKey: true, altKey: true })), 'AltGr types');
    const keys = winListeners.find(l => l.type === 'keydown' && /passesField/.test(l.fn.toString())).fn;
    let saved = 0, undid = 0, blurred = 0;
    const realSaveAll = D.Persistence.saveAll, realUndo = Undo.undo;
    D.Persistence.saveAll = () => { saved++; return true; };
    Undo.undo = () => { undid++; };
    D.Ui.dialogOpen = () => false;
    D.Compat.isTest = () => true;
    D.Compat.isNwjs = () => true;
    const field = { tagName: 'INPUT', blur() { blurred++; } };
    keys(Object.assign(k('s', { ctrlKey: true }), { target: field, preventDefault() {} }));
    assert.deepStrictEqual([saved, blurred], [1, 1], 'Ctrl+S in a field saves, after the field gives up what was typed');
    keys(Object.assign(k('z', { ctrlKey: true }), { target: field, preventDefault() {} }));
    assert.strictEqual(undid, 0, "Ctrl+Z in a field is the field's own undo");
    ws.selectDoodads([]);
    D.Persistence.saveAll = realSaveAll; Undo.undo = realUndo;
    // Esc lets go of a picked event and closes the menu.
    ws.selectedEvent = { stagedEvent: { id: 1 } };
    let menuClosed = 0;
    const realCloseMenu = ws.closeContextMenu;
    ws.closeContextMenu = () => { menuClosed++; };
    ws.setPlacementTool = () => {};
    ws.removeGhost = () => {};
    keys({ key: 'Escape', code: 'Escape', target: { tagName: 'CANVAS' }, preventDefault() {} });
    assert.strictEqual(ws.selectedEvent, null, 'the event is let go');
    assert.strictEqual(menuClosed, 1, 'the menu is closed');
    ws.closeContextMenu = realCloseMenu;
    console.log('✓ keys: shortcuts from fields (not the field\'s own), Esc lets an event go');

    // 7. A duplicated event stays on the map and off other events.
    const E = D.Events;
    const events = [null, { id: 1, x: 9, y: 5 }, { id: 2, x: 8, y: 5 }];
    assert.deepStrictEqual(E.nearestFreeTile({ events }, 10, 5, 10, 8), { x: 9, y: 4 }, 'off the right edge: the nearest free tile inside');
    assert.deepStrictEqual(E.nearestFreeTile({ events }, 3, 3, 10, 8), { x: 3, y: 3 }, 'a free tile is used as it is');
    assert.deepStrictEqual(E.nearestFreeTile({ events: [null, { x: 0, y: 0 }] }, 0, 0, 2, 1), { x: 1, y: 0 });
    assert.strictEqual(E.nearestFreeTile({ events: [null, { x: 0, y: 0 }, { x: 1, y: 0 }] }, 0, 0, 2, 1), null, 'a full map has no room');
    assert.deepStrictEqual(E.nearestFreeTile({ events }, 50, 5), { x: 50, y: 5 }, 'no known size: no limit');
    D.Persistence.dirtyMap = false;
    $gameMap._stagedMapData = { events: JSON.parse(JSON.stringify(events)) };
    $gameMap._stagedMapDataId = 1;
    ws.selectEvent = info => { ws.selectedEvent = info; };
    ws.selectedEvent = { stagedEvent: $gameMap._stagedMapData.events[1] };
    ws.duplicateSelectedEvent();
    const dup = $gameMap._stagedMapData.events[3];
    assert.ok(dup && dup.x >= 0 && dup.x < 10 && dup.y >= 0 && dup.y < 8, 'the copy is inside the map');
    assert.ok(!events.some(ev => ev && ev.x === dup.x && ev.y === dup.y), 'and not on another event');
    Undo.clear();
    console.log('✓ duplicate event: clamped to the map, nearest free tile');

    // 8. Layers per map, z-order on the selection, hidden doodads.
    global.$dataDocsDoodads = {
        1: [doodad({ bit: [3, 'img/doodads/rock.png'], x: 0 }), doodad({ bit: [3, 'img/doodads/rock.png'], x: 10, layer: 'top', editorHidden: true }),
            doodad({ bit: [3, 'img/doodads/rock.png'], x: 20, editorHidden: true }), doodad({ bit: [3, 'img/doodads/rock.png'], x: 30 })],
        2: [],
        mapSettings: { 1: { layers: [{ id: 'top', name: 'Treetops' }] } }
    };
    let mapId = 1;
    ws.currentMapId = () => mapId;
    assert.strictEqual(ws.layerOnThisMap('top'), 'top');
    mapId = 2;
    assert.strictEqual(ws.layerOnThisMap('top'), 'main', 'map 2 has no Treetops');
    ws.activeLayer = 'top';
    for (const name of ['updateCollisionLegend', 'applyStagedRegions', 'reportStepsBack', 'rememberMap', 'finishPendingGoTo']) ws[name] = () => {};
    ws.onMapLoaded();
    assert.strictEqual(ws.activeLayer, 'main', 'after Go to Map, new doodads go on a layer that exists');
    mapId = 1;
    ws.activeLayer = 'top';
    // Z-order from the menu acts on everything picked.
    const map1 = $dataDocsDoodads[1];
    let menu = null;
    ws.showContextMenu = (x, y, items) => { menu = items; };
    ws.clientToMapCoords = () => ({ x: 0, y: 0, tileX: 0, tileY: 0 });
    ws.attachCanvasListeners();
    ws.selectDoodads([map1[0], map1[3]]);
    ws.doodadAt = () => map1[3];
    ws._onCanvasContextMenu({ preventDefault() {}, clientX: 5, clientY: 5 });
    menu.find(i => i.label === 'Bring to Front').onClick();
    assert.ok(map1[0].z === map1[3].z && map1[0].z > 0, 'Bring to Front moves both picked doodads');
    menu.find(i => i.label === 'Send Backward (-1 Z)').onClick();
    assert.ok(map1[0].z === map1[3].z, 'and so does Send Backward');
    // Hidden doodads: in the empty map's menu, the palette and Layers, and shown again in one step.
    ws.doodadAt = () => null;
    ws._onCanvasContextMenu({ preventDefault() {}, clientX: 5, clientY: 5 });
    const show = menu.find(i => i.label === 'Show Hidden Doodads (2)');
    assert.ok(show, 'the empty map offers to show the 2 hidden doodads');
    ws.mapEntries = () => [];
    assert.ok(ws.paletteCommands().some(c => c.label === 'Show Hidden Doodads'), 'and the palette');
    const layersHtml = ws.renderLayersPanel(D.Lighting.mapSettings(1));
    assert.ok(/1 hidden in the editor/.test(layersHtml) && /dd-layer-show-hidden/.test(layersHtml) && /Show Hidden Doodads \(2\)/.test(layersHtml), 'Layers counts them per layer');
    Undo.clear();
    show.onClick();
    assert.ok(!map1.some(d => d.editorHidden), 'shown again');
    assert.strictEqual(Undo.undoStack.length, 1, 'one step');
    Undo.undo();
    assert.ok(map1[1].editorHidden && map1[2].editorHidden, 'and back with Undo');
    console.log('✓ layers follow the map, z-order on the selection, hidden doodads reachable');

    // 9. Import routes by whole words and shows where each file goes; the picker offers what it takes.
    const I = D.Import;
    const dest = name => I.detectDestination(path.join(sandbox, 'downloads', name));
    assert.strictEqual(dest('surface.png'), 'img/doodads', 'surface is not a face');
    assert.strictEqual(dest('fertile.png'), 'img/doodads', 'fertile is not a tile');
    assert.strictEqual(dest('tractor.png'), 'img/doodads', 'tractor is not an actor');
    assert.strictEqual(dest('Actor1.png'), 'img/characters');
    assert.strictEqual(dest('$BigMonster.png'), 'img/characters');
    assert.strictEqual(dest('hero_face.png'), 'img/faces');
    assert.strictEqual(dest('HeroFace.png'), 'img/faces', 'a capital starts a word');
    assert.strictEqual(dest('Outside_A2.png'), 'img/tilesets', "MZ's tileset names");
    assert.strictEqual(dest('forest tiles.png'), 'img/tilesets');
    assert.strictEqual(dest('sky_parallax.png'), 'img/parallaxes');
    assert.strictEqual(dest('title_picture.png'), 'img/pictures');
    assert.strictEqual(I.detectDestination(path.join(sandbox, 'faces', 'surface.png')), 'img/faces', 'the source folder still counts');
    const rows = ws.importPreviewRows([path.join(sandbox, 'surface.png'), path.join(sandbox, 'hero_face.png'), path.join(sandbox, 'notes.txt')], 'auto');
    assert.deepStrictEqual(rows.map(r => [r.name, r.folder]), [['surface.png', 'img/doodads'], ['hero_face.png', 'img/faces']], 'the preview: each file and its folder');
    assert.deepStrictEqual(ws.importPreviewRows([path.join(sandbox, 'surface.png')], 'img/pictures').map(r => r.folder), ['img/pictures'], 'or the folder picked');
    let accept = null;
    const realCreate = document.createElement;
    document.createElement = tag => { const node = realCreate(tag); if (tag === 'input') Object.defineProperty(node, 'accept', { set(v) { accept = v; }, get() { return accept; } }); node.click = () => {}; return node; };
    ws.pickFilesToImport();
    document.createElement = realCreate;
    const offered = accept.split(',');
    assert.ok(offered.every(ext => I.isSupported('x' + ext)), 'every type offered is one the import takes');
    assert.ok(!/json|aseprite|glb|gltf/.test(accept), 'no .json, .aseprite or models');
    console.log('✓ import: whole-word routing, the destination preview, the picker offers what imports');

    console.log('\nAll editor data safety and behaviour tests passed.');
})().catch(e => { console.error(e); process.exit(1); });
