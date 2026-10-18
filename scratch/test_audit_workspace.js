// scratch/test_audit_workspace.js
// The audit's editor fixes and wiring: search exclusions and animated:, collections (picker, delete,
// remove-from), the thumbnail queue and disk cache, undo marking work unsaved, arrow nudges as one step,
// event edits on the staged copy, prefab copies, templates, snapping grid, toasts, the slicer, the
// marquee on a looping map, history and recovery across maps, box collision, file safety and audio names.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

console.log('=== Testing Audit Fixes (workspace) ===');

const elements = {};
function el(id) {
    if (!elements[id]) elements[id] = { id, value: '', checked: false, innerHTML: '', textContent: '', style: {}, onclick: null, onchange: null, oninput: null,
        disabled: false, childNodes: [], children: [], scrollTop: 0, clientWidth: 400, clientHeight: 400,
        classList: { toggle() {}, add() {}, remove() {} }, appendChild(c) { this.childNodes.push(c); }, querySelectorAll: () => [], addEventListener() {} };
    return elements[id];
}
const made = [];
function node(tag) {
    const n = { tagName: String(tag).toUpperCase(), style: {}, childNodes: [], className: '', textContent: '', value: '', isConnected: true,
        appendChild(c) { this.childNodes.push(c); return c; }, insertBefore(c) { this.childNodes.push(c); }, removeChild() {}, querySelectorAll: () => [],
        addEventListener() {}, removeEventListener() {}, matches: () => false, getContext: () => ({}), setAttribute() {} };
    made.push(n);
    return n;
}
global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.document = {
    createElement: node,
    body: { appendChild() {}, removeChild() {} },
    getElementById: id => el(id),
    querySelectorAll: () => []
};
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: opt => opt === 'test' };
// A half-tile snapping grid (Grid Snap Width / Height) for section 9.
global.PluginManager = { parameters: () => ({ gridSnapWidth: '24', gridSnapHeight: '24' }) };
const W20 = 20;
global.$gameMap = { mapId: () => 1, displayX: () => 0, displayY: () => 0, tileWidth: () => 48, tileHeight: () => 48, width: () => W20, height: () => 15,
    isLoopHorizontal: () => false, isLoopVertical: () => false };
global.$dataDocsDoodads = { 1: [] };

require('../Docs-Doodads.js');
const D = DocsDoodads, ws = D.Workspace, Undo = D.Undo, S = D.Search;
const toasts = [];
const realShowToast = ws.showToast;
ws.showToast = msg => toasts.push(msg);
ws.refreshSpriteset = () => {};
const doodad = props => Object.assign(D.standardStruct(), { frameW: 48, frameH: 48, posMode: 1 }, props);

// 1. Search: minus on a prefixed term leaves those assets out; animated: and favorite: filter.
const assets = [
    { id: 'a', fileName: 'oak.png', path: 'img/doodads/trees/oak.png', type: 'image', tags: ['deep woods'], autoTags: [], collections: ['Castle Set'], favorite: true },
    { id: 'b', fileName: 'rock.png', path: 'img/doodads/rock.png', type: 'image', tags: [], autoTags: [], collections: [], favorite: false },
    { id: 'c', fileName: 'Actor1.png', path: 'img/characters/Actor1.png', type: 'character_sheet', category: 'Characters', width: 576, height: 384, tags: [], autoTags: [], collections: [] }
];
const names = q => S.filter(assets, q).map(a => a.id);
assert.deepStrictEqual(names('-tag:"deep woods"'), ['b', 'c'], 'minus tag');
assert.deepStrictEqual(names('-type:character_sheet'), ['a', 'b'], 'minus type');
assert.deepStrictEqual(names('-folder:trees'), ['b', 'c'], 'minus folder');
assert.deepStrictEqual(names('-collection:"castle set"'), ['b', 'c'], 'minus collection');
assert.deepStrictEqual(names('rock -'), ['b'], 'a lone minus (still typing) hides nothing');
assert.deepStrictEqual(names('-oak'), ['b', 'c'], 'minus plain text still works');
assert.deepStrictEqual(names('animated:true'), ['c'], 'a walking sheet is animated');
assert.deepStrictEqual(names('animated:false'), ['a', 'b']);
assert.deepStrictEqual(names('favorite:false'), ['b', 'c'], 'no favorite flag counts as not favorite');
assert.deepStrictEqual(names('category:characters'), ['c'], 'category: (documented, now read)');
assert.deepStrictEqual(names('-category:characters'), ['a', 'b']);
console.log('✓ search: prefixed exclusions, a lone minus, animated: and favorite:');

// 2. Collections: the toolbar picker shows them with counts, picking one swaps the search's
// collection term, delete keeps the assets, and the asset menu removes from a collection.
D.AssetIndex.save = () => {};
D.AssetIndex.data = { version: 1, assets: {}, collections: {} };
for (const a of assets) D.AssetIndex.data.assets[a.id] = JSON.parse(JSON.stringify(Object.assign({ placement: { defaultMode: 'doodad' }, collision: { preset: 'none' }, slice: { regions: [] }, usage: { useCount: 0, lastUsedAt: 0 } }, a, { collections: [] })));
D.AssetIndex.rebuildList();
D.AssetIndex.addAssetToCollection('a', 'Castle Set');
D.AssetIndex.addAssetToCollection('b', 'Castle Set');
D.AssetIndex.addAssetToCollection('b', 'Forest');
ws.searchQuery = 'rock';
ws.refreshCollectionPicker();
const picker = el('dd-collection-select');
assert.deepStrictEqual(picker.childNodes.map(o => o.textContent), ['All collections', '📁 Castle Set (2)', '📁 Forest (1)']);
ws.setSearchCollection('Castle Set');
assert.strictEqual(ws.searchQuery, 'rock collection:"Castle Set"', 'the rest of the search stays');
assert.strictEqual(el('dd-search-input').value, ws.searchQuery);
assert.strictEqual(ws.searchCollection(), 'Castle Set');
assert.strictEqual(el('dd-del-collection-btn').style.display, 'inline-block');
assert.deepStrictEqual(ws.filteredAssets.map(a => a.id), ['b']);
ws.setSearchCollection('Forest');
assert.strictEqual(ws.searchQuery, 'rock collection:"Forest"', 'one collection term at a time');
// Delete (confirmed): the collection goes, its assets stay, the search shows everything again.
global.confirm = () => true;
ws.bindEvents();
el('dd-del-collection-btn').onclick();
assert.ok(!D.AssetIndex.getCollections().includes('Forest'));
assert.deepStrictEqual(D.AssetIndex.data.assets.b.collections, ['Castle Set']);
assert.ok(D.AssetIndex.data.assets.b, 'the asset is still in the library');
assert.strictEqual(ws.searchQuery, 'rock');
// The card's right-click menu: one "Remove from" item per collection the asset is in.
let menu = null;
ws.showContextMenu = (x, y, items) => { menu = items; };
const card = ws.createCardElement(D.AssetIndex.data.assets.b, 100);
card.oncontextmenu({ preventDefault() {}, clientX: 0, clientY: 0 });
const remove = menu.find(i => i.label === 'Remove from "Castle Set"');
assert.ok(remove, 'a remove item for its collection');
remove.onClick();
assert.deepStrictEqual(D.AssetIndex.data.assets.b.collections, []);
assert.deepStrictEqual(D.AssetIndex.data.collections['Castle Set'], ['a']);
// Adding strips quotes (they would break the collection:"..." term).
global.prompt = () => 'Big "Hall"';
menu.find(i => i.label === 'Add to Collection...').onClick();
assert.ok(D.AssetIndex.getCollections().includes('Big Hall'));
console.log('✓ collections: picker with counts, swapping the search term, delete, remove from, safe names');

// 3. Thumbnails: one job per image however often the drawer asks, failures not retried every redraw,
// no duplicate cache order entries, and stale disk files pruned against the library.
const T = D.Thumbnail;
T.clearCache = T.clearCache.bind(T);
T.cache = {}; T.cacheOrder = []; T.queue = []; T.pending = {}; T.failed.clear(); T.active = 0;
const jobs = [];
const realGenerate = T.generate;
T.generate = (asset, size, done) => jobs.push(done);
const realDiskDir = T.diskDir;
const disk = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-thumbs-'));
T.diskDir = disk.replace(/\\/g, '/');
const asset = { id: 'img/doodads/oak.png', mtimeMs: 5, path: 'img/doodads/oak.png' };
const got = [];
T.get(asset, 96, url => got.push('first:' + url));
T.get(asset, 96, url => got.push('second:' + url));
assert.strictEqual(jobs.length, 1, 'the second ask waits for the first job');
jobs[0]('data:image/png;base64,AAA');
assert.deepStrictEqual(got, ['first:data:image/png;base64,AAA', 'second:data:image/png;base64,AAA']);
T.setCache(T.keyFor(asset, 96), 'data:image/png;base64,AAA');
assert.strictEqual(T.cacheOrder.filter(k => k === T.keyFor(asset, 96)).length, 1, 'no duplicate LRU entries');
const broken = { id: 'img/doodads/broken.png', mtimeMs: 1, path: 'img/doodads/broken.png' };
T.get(broken, 96, () => {});
jobs[1]('');
T.get(broken, 96, url => got.push('again:' + url));
assert.strictEqual(jobs.length, 2, 'a failed image is not tried again on every redraw');
assert.strictEqual(got[got.length - 1], 'again:');
T.invalidate(broken.id);
T.get(broken, 96, () => {});
assert.strictEqual(jobs.length, 3, 'until the file changes');
// Only 4 images load at once; the rest wait and start as those finish.
T.queue = []; T.pending = {}; T.active = 0; jobs.length = 0;
for (let i = 0; i < 7; i++) T.get({ id: 'img/doodads/n' + i + '.png', mtimeMs: 1, path: '' }, 96, () => {});
assert.strictEqual(jobs.length, 4);
jobs[0]('data:image/png;base64,B');
assert.strictEqual(jobs.length, 5, 'a finished job lets the next start');
// Disk: the file for an older version of a picture, and for a picture gone from the library, go.
const keep = T.safeKey(`${asset.id}_5`) + '_96.txt', old = T.safeKey(`${asset.id}_4`) + '_96.txt', gone = T.safeKey('img/doodads/gone.png_1') + '_64.txt';
for (const f of fs.readdirSync(disk)) fs.unlinkSync(path.join(disk, f));
for (const f of [keep, old, gone]) fs.writeFileSync(path.join(disk, f), 'data:image/png;base64,');
assert.strictEqual(T.pruneDisk([asset]), 2);
assert.deepStrictEqual(fs.readdirSync(disk), [keep]);
T.generate = realGenerate;
T.diskDir = realDiskDir;
fs.rmSync(disk, { recursive: true, force: true });
console.log('✓ thumbnails: shared jobs, at most 4 loading, failures remembered, LRU without duplicates, stale disk files pruned');

// 4. Every undoable step is unsaved work; arrow nudges that keep coming are one step.
const P = D.Persistence;
const rock = doodad({ x: 100, y: 100 });
$dataDocsDoodads[1] = [rock];
P.dirtyDoodads = false;
ws.selectDoodads([rock]);
ws.bringForward();
assert.strictEqual(P.dirtyDoodads, true, 'z-order marks the doodads changed');
P.dirtyDoodads = false;
Undo.undo();
assert.strictEqual(P.dirtyDoodads, true, 'undo too');
const steps = Undo.undoStack.length;
ws.nudgeSelection(1, 0);
ws.nudgeSelection(1, 0);
ws.nudgeSelection(0, 16);
assert.deepStrictEqual([rock.x, rock.y], [102, 116]);
assert.strictEqual(Undo.undoStack.length, steps + 1, 'one undo step for the run of presses');
assert.strictEqual(Undo.labelFor(Undo.undoStack[Undo.undoStack.length - 1]), 'Nudge');
Undo.undo();
assert.deepStrictEqual([rock.x, rock.y], [100, 100]);
Undo.redo();
assert.deepStrictEqual([rock.x, rock.y], [102, 116]);
ws._nudge.at -= 5000;
ws.nudgeSelection(-2, 0);
assert.strictEqual(Undo.undoStack.length, steps + 2, 'a later press is a new step');
// Align, distribute, lock, hide and group are undoable and restore in place.
const a2 = doodad({ x: 10, y: 0 }), b2 = doodad({ x: 50, y: 5 }), c2 = doodad({ x: 200, y: 9 });
$dataDocsDoodads[1] = [a2, b2, c2];
ws.selectDoodads([a2, b2, c2]);
ws.alignSelected('left');
assert.deepStrictEqual([a2.x, b2.x, c2.x], [10, 10, 10]);
Undo.undo();
assert.deepStrictEqual([a2.x, b2.x, c2.x], [10, 50, 200]);
ws.distributeSelected('horizontal');
assert.deepStrictEqual([a2.x, b2.x, c2.x], [10, 105, 200]);
ws.lockSelected(true);
assert.ok(a2.locked && c2.locked);
Undo.undo();
assert.ok(!a2.locked);
ws.groupSelected();
assert.ok(a2.groupId && a2.groupId === c2.groupId);
Undo.undo();
assert.strictEqual(a2.groupId, undefined);
console.log('✓ undo: unsaved work on every step, nudges merged, shared edits for align/distribute/lock/group');

// 5. Events: edits (arrow keys, the inspector's fields) change the staged copy that Save writes.
const liveEvent = { id: 3, x: 4, y: 5, pages: [{ trigger: 0, priorityType: 1, list: [] }] };
global.$dataMap = { events: [null, null, null, liveEvent] };
$gameMap._stagedMapData = { events: [null, null, null, JSON.parse(JSON.stringify(liveEvent))] };
$gameMap._stagedMapDataId = 1;
const located = [];
const ge = { eventId: () => 3, x: 4, y: 5, event: () => liveEvent, locate(x, y) { this.x = x; this.y = y; located.push([x, y]); } };
ws.selectEvent({ gameEvent: ge, stagedEvent: liveEvent });
P.dirtyMap = false;
assert.ok(ws.editSelectedEvent('move_event', e => { e.x += 1; }));
const staged = $gameMap._stagedMapData.events[3];
assert.deepStrictEqual([staged.x, liveEvent.x], [5, 4], 'the staged copy moved, not $dataMap');
assert.strictEqual(ws.selectedEvent.stagedEvent, staged, 'the selection now points at it');
assert.deepStrictEqual(located, [[5, 5]], 'the event on the map follows');
assert.strictEqual(P.dirtyMap, true);
Undo.undo();
assert.strictEqual(staged.x, 4);
// The inspector's fields are bound.
ws.refreshInspector();
el('dd-ev-trigger').value = '3';
el('dd-ev-trigger').onchange();
assert.strictEqual(staged.pages[0].trigger, 3, 'trigger set');
el('dd-ev-y').value = '99';
el('dd-ev-y').onchange();
assert.strictEqual(staged.y, 14, 'kept on the map');
el('dd-ev-priority').value = '2';
el('dd-ev-priority').onchange();
assert.strictEqual(staged.pages[0].priorityType, 2);
ws.selectEvent(null);
console.log('✓ events: staged copy edited (undoable), map event follows, inspector fields bound');

// 6. Copying a placed prefab copy makes a new placed copy (Sync no longer deletes the duplicate).
const pa = doodad({ x: 100, y: 100, prefabRef: { id: 'pf1', instance: 'pi_1', ox: 96, oy: 96 } });
const pb = doodad({ x: 120, y: 100, prefabRef: { id: 'pf1', instance: 'pi_1', ox: 96, oy: 96 } });
const copies = ws.cloneDoodadsForCopy([pa, pb], 16);
assert.notStrictEqual(copies[0].prefabRef.instance, 'pi_1');
assert.strictEqual(copies[0].prefabRef.instance, copies[1].prefabRef.instance, 'one new instance for the copied set');
assert.deepStrictEqual([copies[0].prefabRef.ox, copies[0].prefabRef.oy], [112, 112], 'its origin moved with it');
assert.strictEqual(pa.prefabRef.instance, 'pi_1', 'the original is untouched');
console.log('✓ prefab copies get their own instance and origin');

// 7. Templates: the chest gives gold and opens once; herbs go once picked; the boulder moves away.
const E = D.Events, TT = D.EventTemplates;
const chest = TT.get('chest');
assert.deepStrictEqual(chest.list.find(c => c.code === 125).parameters, [0, 0, 100], 'Change Gold: increase by 100');
const chestEvent = E.createEventObject(1, 0, 0, { list: chest.list, characterName: '!Chest', after: chest.after });
assert.strictEqual(chestEvent.pages.length, 2);
assert.ok(chestEvent.pages[1].conditions.selfSwitchValid && chestEvent.pages[1].conditions.selfSwitchCh === 'A');
assert.strictEqual(chestEvent.pages[1].image.direction, 8, 'shown open');
assert.deepStrictEqual(chestEvent.pages[1].list.map(c => c.code), [0], 'nothing more to take');
const herb = E.createEventObject(2, 0, 0, { list: TT.get('harvestable').list, characterName: '!Flame', after: TT.get('harvestable').after });
assert.strictEqual(herb.pages[1].image.characterName, '', 'picked: gone');
const push = TT.get('pushable').list.find(c => c.code === 205).parameters[1].list;
assert.strictEqual(push[0].code, 11, 'move away from the player (14 is Jump, which needs offsets)');
// A template saved from an event keeps all its pages; placing it shows the new picture on the first.
const tplDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-tpl-'));
TT.customPath = path.join(tplDir, 'templates.json');
const twoPages = E.createEventObject(5, 0, 0, { list: chest.list, characterName: '!Chest', after: chest.after });
const key = TT.saveCustomTemplate('Two Pages', twoPages, 'Custom');
assert.strictEqual(TT.get(key).pages.length, 2);
const placedTwo = E.createEventObject(6, 1, 1, { characterName: 'Hero', list: TT.get(key).list, pages: TT.get(key).pages });
assert.strictEqual(placedTwo.pages.length, 2);
assert.strictEqual(placedTwo.pages[0].image.characterName, 'Hero', 'the placed picture on the first page');
assert.strictEqual(placedTwo.pages[1].image.characterName, '!Chest', 'later pages keep theirs');
assert.ok(placedTwo.pages[1].conditions.selfSwitchValid);
fs.rmSync(tplDir, { recursive: true, force: true });
console.log('✓ templates: gold, opened chest, picked herb, pushable boulder, every page saved');

// 8. Toasts: kinds set colour and time (errors stay longer); a number is still a duration.
const timers = [];
const realTimeout = global.setTimeout;
global.setTimeout = (fn, ms) => { timers.push(ms); return 0; };
ws.showToast = realShowToast;
ws.showToast('Saved', 'success');
ws.showToast('Broken', 'error');
ws.showToast('Long', 9000);
global.setTimeout = realTimeout;
assert.deepStrictEqual(timers, [2200, 5000, 9000]);
const toastNodes = made.filter(n => n.textContent === 'Broken');
assert.ok(/#b91c1c/.test(toastNodes[0].style.cssText), 'errors are red');
ws.showToast = msg => toasts.push(msg);
console.log('✓ toasts: info / success / error, or a duration');

// 9. The snapping grid (Grid Snap Width / Height 24 here) and the grid drawn for it.
assert.deepStrictEqual(ws.snapGrid(), { w: 24, h: 24, tw: 48, th: 48 });
assert.deepStrictEqual(ws.snapToTile({ x: 100, y: 100 }), { x: 108, y: 120, tileX: 2, tileY: 2 }, 'bottom middle of the 24px cell; the tile for events');
assert.deepStrictEqual(ws.snapToTile({ tileX: 3, tileY: 4 }), { x: 168, y: 240, tileX: 3, tileY: 4 }, 'a tile without a point snaps to the tile');
assert.deepStrictEqual(ws.placementGridLines(100, 50).xs, [0, 24, 48, 72, 96]);
assert.strictEqual(ws.gridSnapShow, false, 'Show Grid Snap (off by default)');
console.log('✓ grid snap parameters: cell size, tile for events, grid lines');

// 10. Slicer: corner handles resize both ways, a region is at least 4 x 4, names stay unique,
// keys don't throw without the modal's buttons, and closing lets go of the sheet.
const SE = D.Slicing.Editor;
const s0 = { x: 10, y: 10, w: 20, h: 20 };
assert.deepStrictEqual(SE.resizeRegion(s0, 'ne', 5, -5), { x: 10, y: 5, w: 25, h: 25 });
assert.deepStrictEqual(SE.resizeRegion(s0, 'sw', -3, 4), { x: 7, y: 10, w: 23, h: 24 });
assert.deepStrictEqual(SE.resizeRegion(s0, 'nw', 50, 50), { x: 26, y: 26, w: 4, h: 4 }, 'no drifting past the minimum');
assert.deepStrictEqual(SE.resizeRegion(s0, 'w', -40, 0), { x: 0, y: 10, w: 30, h: 20 }, 'stops at the image edge');
SE.regions = [{ name: 'Region_1' }, { name: 'Region_1_2' }];
assert.strictEqual(SE.uniqueRegionName('Region_1'), 'Region_1_3');
SE.modal = {};
SE.img = {}; SE.ctx = {}; SE.undoStack = [1, 2];
const realGet = document.getElementById;
document.getElementById = () => null;
SE.handleKeyDown({ key: 'Delete', target: {} });
SE.handleKeyDown({ key: 'd', ctrlKey: true, preventDefault() {}, target: {} });
SE.handleKeyDown({ key: ' ', code: 'Space', preventDefault() {}, target: {} });
assert.strictEqual(SE._spaceHeld, true, 'Space held pans');
document.getElementById = realGet;
SE.close();
assert.deepStrictEqual([SE.modal, SE.img, SE.ctx, SE.undoStack.length, SE._spaceHeld], [null, null, null, 0, false]);
console.log('✓ slicer: corner handles, minimum size, unique names, safe keys, Space pan, close releases');

// 11. Closing the workspace closes the slicer with it (its shortcuts would stay off otherwise) and
// forgets panels that were removed.
ws.mounted = true;
ws.detachCanvasListeners = () => {};
ws.removeGhost = () => {};
SE.modal = { parentNode: { removeChild() {} } };
ws._historyDiff = { mapId: 1 };
ws._vfxPreview = { done: false };
const preview = ws._vfxPreview;
ws.close();
assert.strictEqual(SE.modal, null);
assert.strictEqual(ws._historyDiff, null);
assert.strictEqual(preview.done, true, 'the VFX preview ends');
console.log('✓ closing the workspace closes the slicer, the history diff and the VFX preview');

// 12. The marquee selects by where doodads are drawn: across the seam of a looping map too.
$gameMap.isLoopHorizontal = () => true;
$gameMap.displayX = () => 15;
$gameMap.adjustX = x => ((x - 15) % W20 + W20) % W20;
$gameMap.adjustY = y => y;
D.Compat.getCanvas = () => ({ width: 816, height: 624, getBoundingClientRect: () => ({ left: 0, top: 0, width: 816, height: 624 }) });
const nearSeam = doodad({ x: 48 + 24, y: 100 }), farAway = doodad({ x: 12 * 48, y: 100 });
$dataDocsDoodads[1] = [nearSeam, farAway];
const boxed = ws.doodadsInClientBox({ x: 300, y: 50 }, { x: 360, y: 150 });
assert.deepStrictEqual(boxed, [nearSeam], 'tile 1 is drawn at x 336 when the camera is at tile 15');
$gameMap.isLoopHorizontal = () => false;
$gameMap.displayX = () => 0;
delete $gameMap.adjustX;
delete $gameMap.adjustY;
console.log('✓ marquee by screen position (looping maps)');

// 13. History restores only into the map the comparison was made on; recovery covers every map.
ws._historyDiff = { mapId: 2, kind: 'doodads' };
assert.strictEqual(ws.restoreHistoryItem({ kind: 'removed', backup: doodad({}) }), false);
ws._historyDiff = null;
P.stagedMaps = {};
ws.applyRecovery({ mapId: 1, doodads: [doodad({ x: 1 })], allDoodads: { 1: [doodad({ x: 1 })], 7: [doodad({ x: 7 })] }, stagedMaps: { 7: { events: [null] }, 1: { events: [] } } });
assert.strictEqual($dataDocsDoodads[7][0].x, 7, 'another map\'s doodads come back');
assert.deepStrictEqual(Object.keys(P.stagedMaps), ['7'], 'parked event edits for other maps come back');
console.log('✓ history stays on its map; recovery brings back every map');

// 14. Opening the workspace: a staged copy with no changes is dropped (read fresh, so MZ editor changes
// since aren't overwritten); one with changes keeps the snapshot it was made against.
const realStat = D.FS.stat;
let fileStat = { size: 1, mtimeMs: 1 };
D.FS.stat = () => fileStat;
P.sessionSnapshots = {};
P.dirtyMap = false;
$gameMap._stagedMapData = { events: [null] };
P.captureSession();
assert.strictEqual($gameMap._stagedMapData, null);
fileStat = { size: 2, mtimeMs: 2 };
P.dirtyMap = true;
$gameMap._stagedMapData = { events: [null] };
P.captureSession();
assert.deepStrictEqual(P.sessionSnapshots[P.mapFilePath(1)], { size: 1, mtimeMs: 1 }, 'the snapshot from before the edits');
assert.strictEqual(P.checkConflict(), true, 'so Save notices the MZ editor changed the map');
D.FS.stat = realStat;
P.dirtyMap = false;
$gameMap._stagedMapData = null;
console.log('✓ reopening: clean staged copies dropped, edited ones keep their conflict snapshot');

// 15. Box collision: overlap or touch collides; a mirrored doodad is the same box.
assert.ok(D.judge(D.box(0, 0, 10, 10), D.box(10, 0, 10, 10)), 'touching edges');
assert.ok(!D.judge(D.box(0, 0, 10, 10), D.box(10.1, 0, 10, 10)));
assert.deepStrictEqual(D.box(0, 0, -10, 4), D.box(0, 0, 10, 4));
console.log('✓ collision boxes');

// 16. Files: an unreadable file is copied once and reported while it stays unreadable; old unreadable
// copies are pruned; writing nothing is refused; usage is written after placements stop.
const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-audit-'));
const cwd = process.cwd();
process.chdir(sandbox);
try {
    fs.mkdirSync('data', { recursive: true });
    fs.writeFileSync('data/Broken.json', '{ nope');
    const warn = console.warn;
    console.warn = () => {};
    D.FS.recoveryNotices.length = 0;
    D.FS.readJson('data/Broken.json');
    D.FS.readJson('data/Broken.json');
    D.FS.readJson('data/Broken.json');
    console.warn = warn;
    const kept = fs.readdirSync('data/docs_doodads_cache/backups').filter(f => f.endsWith('.unreadable'));
    assert.strictEqual(kept.length, 1, 'one copy, not one per read');
    assert.strictEqual(D.FS.takeRecoveryNotices().length, 1, 'one notice waiting');
    for (let i = 0; i < 5; i++) fs.writeFileSync(`data/docs_doodads_cache/backups/Broken.json.2026-01-0${i}.unreadable`, 'x');
    fs.writeFileSync('data/Broken2.json', '{}');
    fs.writeFileSync('data/docs_doodads_cache/backups/Broken2.json.x.unreadable', 'x');
    D.FS.pruneBackups('data/docs_doodads_cache/backups', 'Broken.json', 10);
    const left = fs.readdirSync('data/docs_doodads_cache/backups');
    assert.strictEqual(left.filter(f => f.startsWith('Broken.json.') && f.endsWith('.unreadable')).length, 3);
    assert.ok(left.includes('Broken2.json.x.unreadable'), 'another file with the same start is not touched');
    const err = console.error;
    console.error = () => {};
    assert.strictEqual(D.FS.atomicWriteJson('data/Nothing.json', undefined), false);
    console.error = err;
    let saves = 0;
    const AI = D.AssetIndex;
    AI.save = () => { saves++; };
    AI.data.assets.a.usage = { useCount: 0, lastUsedAt: 0 };
    AI.recordUsage('a');
    AI.recordUsage('a');
    assert.strictEqual(saves, 0, 'not written on each placement');
    AI.flushUsage();
    assert.strictEqual(saves, 1);
    assert.strictEqual(AI.data.assets.a.usage.useCount, 2);
} finally {
    process.chdir(cwd);
    fs.rmSync(sandbox, { recursive: true, force: true });
}
console.log('✓ files: unreadable copies once, pruned; nothing written refused; usage written once placements stop');

// 17. Audio in a subfolder plays (and goes into events) by its path inside the audio folder.
assert.deepStrictEqual(D.Audio.soundFor({ path: 'audio/se/doors/Creak.ogg', fileName: 'Creak.ogg' }), { type: 'se', name: 'doors/Creak', code: 250 });
assert.deepStrictEqual(D.Audio.soundFor({ path: 'audio\\bgm\\Theme.ogg', fileName: 'Theme.ogg' }), { type: 'bgm', name: 'Theme', code: 241 });
console.log('✓ audio names with folders');

// 18. The drawer keeps its place when the same search is redrawn, and only rebuilds cards for new rows.
let built = 0;
const realCard = ws.createCardElement;
ws.createCardElement = () => { built++; return node('div'); };
ws.currentCategory = 'All';
ws.searchQuery = '';
ws.refreshDrawerCards();
el('dd-cards-container').scrollTop = 300;
ws.refreshDrawerCards();
assert.strictEqual(el('dd-cards-container').scrollTop, 300, 'a reload or favourite keeps the place');
ws.searchQuery = 'oak';
ws.refreshDrawerCards();
assert.strictEqual(el('dd-cards-container').scrollTop, 0, 'a new search starts at the top');
el('dd-cards-viewport').childNodes = [node('div')];
const before = built;
ws.updateVirtualGrid();
assert.strictEqual(built, before, 'scrolling within the same rows rebuilds nothing');
ws.createCardElement = realCard;
console.log('✓ drawer: place kept, unchanged rows not rebuilt');

console.log('=== Audit fixes (workspace) passed ===');
