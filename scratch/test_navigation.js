// scratch/test_navigation.js
// Getting around: the command palette (any word order, recent first, shortcuts, typed values such as
// "time 18:30" and "go to map 3"), map tabs with an unsaved dot, and the Item Bag's folder view.
const assert = require('assert');

console.log('=== Testing Palette, Map Tabs and Folders ===');

const byId = {};
function makeNode(tag) {
    const classes = new Set();
    return {
        tagName: String(tag).toUpperCase(), style: {}, childNodes: [], parentNode: null, textContent: '', value: '', title: '', clientWidth: 230,
        get innerHTML() { return this._html || ''; },
        set innerHTML(v) { this._html = v; this.childNodes = []; for (const m of String(v).matchAll(/id="([^"]+)"/g)) { const c = makeNode('div'); c.id = m[1]; this.appendChild(c); } },
        get className() { return Array.from(classes).join(' '); },
        set className(v) { classes.clear(); String(v).split(/\s+/).filter(Boolean).forEach(c => classes.add(c)); },
        classList: { add: c => classes.add(c), remove: c => classes.delete(c), contains: c => classes.has(c), toggle() {} },
        appendChild(c) { this.childNodes.push(c); c.parentNode = this; if (c.id) byId[c.id] = c; (c.childNodes || []).forEach(x => { if (x.id) byId[x.id] = x; }); return c; },
        removeChild(c) { this.childNodes = this.childNodes.filter(x => x !== c); c.parentNode = null; if (byId[c.id] === c) delete byId[c.id]; return c; },
        setAttribute() {}, addEventListener() {}, removeEventListener() {}, querySelectorAll: () => [], querySelector: () => null, focus() {},
        getBoundingClientRect: () => ({ left: 0, right: 0, top: 0, bottom: 72 })
    };
}
const body = makeNode('body');
global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.window.innerWidth = 1200;
global.window.innerHeight = 800;
global.document = {
    body, documentElement: makeNode('html'), createElement: makeNode,
    getElementById: id => byId[id] || null,
    querySelectorAll: () => [], addEventListener() {}, removeEventListener() {}
};
const store = {};
global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } };
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: opt => opt === 'test' };
global.PluginManager = { parameters: () => ({}) };
let mapId = 1;
global.$gameMap = { mapId: () => mapId, tileWidth: () => 48, tileHeight: () => 48, displayX: () => 0, displayY: () => 0 };
global.$dataMapInfos = [null, { id: 1, name: "Hero's House" }, null, { id: 3, name: 'Starting Town' }, { id: 4, name: 'Field' }, { id: 5, name: 'Cave' }];

require('../Docs-Doodads.js');
const D = DocsDoodads, ws = D.Workspace, U = D.Ui, P = D.Persistence;
ws.showToast = () => {};
ws.refreshSpriteset = () => {};
ws.refreshInspector = () => {};
const went = [];
ws.goToMap = id => went.push(id);

// 1. Palette ranking.
assert.ok(ws.paletteScore('grid toggle', 'Toggle Grid') > 0, 'any word order');
assert.ok(ws.paletteScore('tog grd', 'Toggle Grid') > 0, 'short, fuzzy words');
assert.ok(ws.paletteScore('toggle grid', 'Toggle Grid') > ws.paletteScore('grid toggle', 'Toggle Grid'), 'in order ranks higher');
assert.strictEqual(ws.paletteScore('zebra', 'Toggle Grid'), -1);
const commands = [
    { label: 'Save', group: 'Command', keys: 'Ctrl+S', run() {} },
    { label: 'Toggle Grid', group: 'Command', keys: 'G', run() {} },
    { label: 'Select All (Ctrl+A)', group: 'Command', run() {} },
    { label: 'Show / Hide Sounds', group: 'Command', run() {} },
    { label: 'Show / Hide Collision', group: 'Command', run() {} }
];
assert.deepStrictEqual(ws.paletteResults('', commands).map(c => c.label), commands.map(c => c.label), 'nothing typed, nothing recent: as listed');
ws.rememberCommand('Show / Hide Collision');
ws.rememberCommand('Toggle Grid');
const empty = ws.paletteResults('', commands);
assert.deepStrictEqual(empty.slice(0, 2).map(c => c.label), ['Toggle Grid', 'Show / Hide Collision'], 'recent first, newest first');
assert.ok(empty[0].recent && !empty[2].recent);
assert.strictEqual(empty.length, commands.length, 'no duplicates');
assert.deepStrictEqual(ws.paletteResults('show hide', commands).map(c => c.label).slice(0, 2), ['Show / Hide Collision', 'Show / Hide Sounds'], 'a recent match is lifted');
for (let i = 0; i < 12; i++) ws.rememberCommand('Command ' + i);
assert.strictEqual(ws.recentCommands().length, 8, 'the last 8');
assert.deepStrictEqual(ws.paletteRowParts(commands[2]), { name: 'Select All', keys: 'Ctrl+A' });
assert.deepStrictEqual(ws.paletteRowParts(commands[0]), { name: 'Save', keys: 'Ctrl+S' });
assert.deepStrictEqual(ws.paletteRowParts(commands[3]), { name: 'Show / Hide Sounds', keys: '' });
console.log('✓ palette ranking: any word order, recent first and lifted, shortcuts split out');

// 2. Typed values.
const value = q => ws.paletteValueCommands(q).map(c => c.label);
assert.deepStrictEqual(value('time 18:30'), ['Preview the time ' + D.TimeOfDay.format(18 * 60 + 30)]);
assert.deepStrictEqual(value('time 6pm'), ['Preview the time ' + D.TimeOfDay.format(18 * 60)]);
assert.deepStrictEqual(value('at 12am'), ['Preview the time ' + D.TimeOfDay.format(0)]);
assert.deepStrictEqual(value('go to map 3'), ['Go to map 3: Starting Town']);
assert.deepStrictEqual(value('Map003'), ['Go to map 3: Starting Town']);
assert.deepStrictEqual(value('go to 5'), ['Go to map 5: Cave']);
assert.deepStrictEqual(value('go to map 99'), [], 'no such map');
assert.deepStrictEqual(value('3'), [], 'a bare number is not a map');
D.World.settings().seasons.names = ['Spring', 'Summer', 'Autumn', 'Winter'];
assert.deepStrictEqual(value('season wi'), ['Preview the season Winter']);
assert.deepStrictEqual(value('size 125'), ['Editor size 125%']);
assert.deepStrictEqual(value('size 130'), [], 'only the sizes on offer');
ws.stopClock = () => {};
ws.updateClockBar = () => {};
ws.mounted = true;
ws.paletteResults('time 7:05', commands)[0].run();
assert.strictEqual(ws.previewMinutes, 7 * 60 + 5, 'typed values come first and run');
ws.paletteValueCommands('go to map 4')[0].run();
assert.deepStrictEqual(went, [4]);
ws.paletteValueCommands('season sum')[0].run();
assert.strictEqual(ws.previewSeason, 1);
ws.previewMinutes = null; ws.previewSeason = null;
// In the palette itself: key caps, Recent, and only named commands are remembered.
ws.paletteCommands = () => commands;
store['docsDoodads.ui'] = '{}';
ws.showCommandPalette();
const input = byId['dd-palette-input'];
assert.ok(input);
input.value = '';
input.oninput();
assert.ok(/<kbd>Ctrl\+S<\/kbd>/.test(byId['dd-palette-list'].innerHTML), 'shortcuts as key caps');
assert.ok(/Select All<\/span><kbd>Ctrl\+A<\/kbd>/.test(byId['dd-palette-list'].innerHTML), 'the shortcut comes off the name');
input.value = 'grid';
input.oninput();
input.onkeydown({ key: 'Enter', preventDefault() {}, stopPropagation() {} });
assert.deepStrictEqual(ws.recentCommands(), ['Toggle Grid']);
ws.showCommandPalette();
byId['dd-palette-input'].value = 'time 9:00';
byId['dd-palette-input'].oninput();
byId['dd-palette-input'].onkeydown({ key: 'Enter', preventDefault() {}, stopPropagation() {} });
assert.strictEqual(ws.previewMinutes, 540);
assert.deepStrictEqual(ws.recentCommands(), ['Toggle Grid'], 'a typed time is not remembered');
ws.showCommandPalette();
assert.ok(/Recent · Command/.test(byId['dd-palette-list'].innerHTML), 'recent ones are marked');
byId['dd-palette-input'].onkeydown({ key: 'Escape', preventDefault() {}, stopPropagation() {} });
console.log('✓ typed values: times, maps, seasons, sizes; in the palette with key caps and Recent');

// 3. Map tabs.
const root = makeNode('div');
ws.container = root;
ws.placeReadouts = () => {};
store['docsDoodads.ui'] = '{}';
ws.rememberMap(1);
const strip = byId['dd-map-tabs'];
assert.strictEqual(strip.style.display, 'none', 'one map: no tabs');
ws.rememberMap(3);
ws.rememberMap(4);
ws.rememberMap(3);
assert.deepStrictEqual(ws.recentMaps(), [1, 3, 4], 'a map keeps its place');
assert.strictEqual(strip.style.display, 'flex');
const tabs = () => strip.childNodes.map(t => ({ name: t.childNodes.find(c => c.tagName === 'SPAN').textContent, current: t.classList.contains('dd-current'), dot: t.childNodes.some(c => c.className === 'dd-tab-dot') }));
assert.deepStrictEqual(tabs(), [{ name: "Hero's House", current: true, dot: false }, { name: 'Starting Town', current: false, dot: false }, { name: 'Field', current: false, dot: false }]);
strip.childNodes[1].onclick();
assert.deepStrictEqual(went.slice(-1), [3], 'a tab goes to its map');
assert.strictEqual(strip.childNodes[0].onclick, undefined, 'the current map has no click and no ×');
// Unsaved dots follow the maps that changed.
ws.mounted = true;
P.dirtyDoodads = false; P.dirtyMap = false;
P.dirtyDoodads = true;
assert.deepStrictEqual(tabs().map(t => t.dot), [true, false, false], 'an edit here dots this tab');
mapId = 3;
ws.renderMapTabs();
assert.deepStrictEqual(tabs().map(t => t.current), [false, true, false]);
assert.deepStrictEqual(tabs().map(t => t.dot), [true, false, false], 'the dot stays with the map that changed');
P.stagedMaps = { 4: { events: [] } };
ws.renderMapTabs();
assert.deepStrictEqual(tabs().map(t => t.dot), [true, false, true], 'parked event edits count too');
P.stagedMaps = {};
P.dirtyDoodads = false;
assert.deepStrictEqual(tabs().map(t => t.dot), [false, false, false], 'saved: no dots');
assert.strictEqual(P.touchedMaps.size, 0);
// × takes a map out; at most 8 tabs.
const x = strip.childNodes[2].childNodes.find(c => c.tagName === 'BUTTON');
x.onclick({ stopPropagation() {} });
assert.deepStrictEqual(ws.recentMaps(), [1, 3]);
for (let i = 10; i < 20; i++) ws.rememberMap(i);
assert.strictEqual(ws.recentMaps().length, 8);
assert.ok(strip.childNodes.length <= 3, 'maps that no longer exist are not shown');
console.log('✓ map tabs: recent maps, current marked, one click away, unsaved dots per map, × and a limit of 8');

// 4. Folder view.
const asset = (p, more) => Object.assign({ id: p, path: p, fileName: p.split('/').pop(), type: 'image', category: 'Doodads', tags: [], autoTags: [], usage: {} }, more);
const assets = [asset('img/doodads/trees/oak.png'), asset('img/doodads/trees/pine.png'), asset('img/doodads/trees/dead/stump.png'), asset('img/doodads/rock.png'), asset('img/doodads/castle/walls/gate.png')];
const tree = ws.folderTree(assets);
assert.deepStrictEqual(tree.folders.map(f => [f.name, f.count]), [['img/doodads', 5]], 'single-folder chains read as one');
const top = tree.folders[0];
assert.deepStrictEqual(top.folders.map(f => [f.name, f.count]), [['castle/walls', 1], ['trees', 3]], 'sorted, chains squashed');
assert.deepStrictEqual(top.items.map(a => a.fileName), ['rock.png']);
assert.deepStrictEqual(top.folders[1].folders.map(f => f.name), ['dead']);
const viewport = makeNode('div');
ws.createCardElement = a => Object.assign(makeNode('div'), { asset: a });
store['docsDoodads.ui'] = '{}';
ws.renderFolderTree(viewport, assets, 96);
assert.deepStrictEqual(viewport.childNodes.map(n => n.className), ['dd-folder'], 'folders start closed');
assert.strictEqual(viewport.childNodes[0].childNodes[1].textContent, 'img/doodads');
assert.strictEqual(viewport.childNodes[0].childNodes[2].textContent, '5');
let refreshed = 0;
const realGrid = ws.updateVirtualGrid;
ws.updateVirtualGrid = () => { refreshed++; ws.renderFolderTree(viewport, assets, 96); };
viewport.childNodes[0].onclick();
assert.ok(refreshed === 1 && U.prefs().openFolders.includes('img/doodads'), 'opening is remembered');
assert.deepStrictEqual(viewport.childNodes.map(n => n.className), ['dd-folder', 'dd-folder', 'dd-folder', 'dd-folder-items']);
assert.strictEqual(viewport.childNodes[3].childNodes[0].asset.fileName, 'rock.png', 'its own items after its folders');
viewport.childNodes[2].onclick();
assert.deepStrictEqual(viewport.childNodes.map(n => n.className), ['dd-folder', 'dd-folder', 'dd-folder', 'dd-folder', 'dd-folder-items', 'dd-folder-items']);
assert.strictEqual(viewport.childNodes[2].childNodes[0].textContent, '▾');
assert.strictEqual(viewport.childNodes[2].style.paddingLeft, '18px', 'indented');
ws.toggleFolder('img/doodads/trees');
assert.ok(!U.prefs().openFolders.includes('img/doodads/trees'), 'and closing');
// The bag switches between cards and folders, and remembers it.
ws.updateVirtualGrid = realGrid;
const container = makeNode('div'); container.id = 'dd-cards-container'; container.clientWidth = 240; byId[container.id] = container;
const sizer = makeNode('div'); sizer.id = 'dd-cards-sizer'; byId[sizer.id] = sizer;
const vp = makeNode('div'); vp.id = 'dd-cards-viewport'; byId[vp.id] = vp;
const btn = makeNode('button'); btn.id = 'dd-bag-view'; byId[btn.id] = btn;
ws.filteredAssets = assets;
ws.setBagView('folders');
assert.strictEqual(U.prefs().bagView, 'folders');
assert.deepStrictEqual([sizer.style.height, vp.style.position, vp.style.display], ['auto', 'relative', 'block']);
assert.strictEqual(vp.childNodes[0].className, 'dd-folder');
assert.ok(/as cards/.test(btn.title));
ws.setBagView('grid');
assert.deepStrictEqual([vp.style.position, vp.style.display], ['absolute', 'grid']);
assert.ok(vp.childNodes.every(n => n.asset), 'cards again');
ws.filteredAssets = [];
ws.setBagView('folders');
assert.strictEqual(vp.childNodes[0].className, 'dd-empty', 'an empty bag still explains itself');
console.log('✓ folder view: a tree from the paths (chains squashed), remembered open folders, cards inside, switch back');

console.log('=== Palette, map tabs and folders passed ===');
