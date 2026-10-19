// scratch/test_item_bag.js
// The Item Bag: sorting, the search's terms as removable chips and saved searches, the hover card
// (size, frames, depth, uses, links) and what an empty tab says and offers.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

console.log('=== Testing the Item Bag ===');

const byId = {};
function makeNode(tag) {
    const classes = new Set();
    return {
        tagName: String(tag).toUpperCase(), style: {}, childNodes: [], parentNode: null, textContent: '', value: '', title: '', listeners: {},
        get innerHTML() { return this._html || ''; },
        set innerHTML(v) { this._html = v; if (v === '') this.childNodes = []; },
        get className() { return Array.from(classes).join(' '); },
        set className(v) { classes.clear(); String(v).split(/\s+/).filter(Boolean).forEach(c => classes.add(c)); },
        classList: { add: c => classes.add(c), remove: c => classes.delete(c), contains: c => classes.has(c), toggle() {} },
        appendChild(c) { this.childNodes.push(c); c.parentNode = this; if (c.id) byId[c.id] = c; return c; },
        insertBefore(c) { return this.appendChild(c); },
        removeChild(c) { this.childNodes = this.childNodes.filter(x => x !== c); c.parentNode = null; if (byId[c.id] === c) delete byId[c.id]; return c; },
        setAttribute() {}, addEventListener(type, fn) { this.listeners[type] = fn; }, removeEventListener() {},
        querySelectorAll: () => [], querySelector: () => null,
        getBoundingClientRect: () => ({ left: 10, right: 110, top: 200, bottom: 300, width: 100, height: 100 })
    };
}
const body = makeNode('body');
const add = (id, tag) => { const n = makeNode(tag || 'div'); n.id = id; byId[id] = n; return n; };
global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.window.innerHeight = 700;
global.document = {
    body, createElement: makeNode,
    getElementById: id => byId[id] || null,
    querySelectorAll: () => [],
    addEventListener() {}, removeEventListener() {}
};
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: opt => opt === 'test' };
global.PluginManager = { parameters: () => ({}) };
global.$gameMap = { mapId: () => 1, tileWidth: () => 48, tileHeight: () => 48, displayX: () => 0, displayY: () => 0 };

require('../Docs-Doodads.js');
const D = DocsDoodads, ws = D.Workspace, S = D.Search;
const toasts = [];
ws.showToast = (msg, kind) => toasts.push([msg, kind]);
const prefs = {};
D.Ui.setPref = (k, v) => { prefs[k] = v; };
D.AssetIndex.save = () => {};
const wait = ms => new Promise(r => setTimeout(r, ms));

const asset = (id, more) => Object.assign({ id, path: 'img/doodads/' + id + '.png', fileName: id + '.png', type: 'image', category: 'Doodads',
    tags: [], autoTags: [], collections: [], favorite: false, usage: { useCount: 0, lastUsedAt: 0 }, placement: { defaultMode: 'doodad' } }, more);
const list = [
    asset('oak', { width: 96, height: 144, addedAt: 300, usage: { useCount: 5, lastUsedAt: 50 } }),
    asset('Rock10', { width: 48, height: 48, addedAt: 100, usage: { useCount: 9, lastUsedAt: 10 } }),
    asset('rock2', { width: 32, height: 32, mtimeMs: 500, usage: { useCount: 0, lastUsedAt: 0 } }),
    asset('bush', { width: 48, height: 48, addedAt: 200, usage: { useCount: 5, lastUsedAt: 90 }, tags: ['forest'] })
];

(async () => {
    // 1. Sorting.
    const ids = l => l.map(a => a.id);
    assert.deepStrictEqual(ids(ws.sortAssets(list, 'search')), ['oak', 'Rock10', 'rock2', 'bush'], 'Best match keeps the search order');
    assert.deepStrictEqual(ids(ws.sortAssets(list, 'name')), ['bush', 'oak', 'rock2', 'Rock10'], 'by name, numbers in order, any case');
    assert.deepStrictEqual(ids(ws.sortAssets(list, 'added')), ['rock2', 'oak', 'bush', 'Rock10'], 'newest first (file time without a date added)');
    assert.deepStrictEqual(ids(ws.sortAssets(list, 'size')), ['oak', 'Rock10', 'bush', 'rock2'], 'biggest first, ties in search order');
    assert.deepStrictEqual(ids(ws.sortAssets(list, 'placed')), ['Rock10', 'oak', 'bush', 'rock2']);
    assert.deepStrictEqual(ids(ws.sortAssets(list, 'last')), ['bush', 'oak', 'Rock10', 'rock2']);
    assert.deepStrictEqual(ids(list), ['oak', 'Rock10', 'rock2', 'bush'], 'the list itself is untouched');
    // The drawer uses it, except where the tab has its own order.
    D.AssetIndex.list = list;
    const realGrid = ws.updateVirtualGrid;
    ws.updateVirtualGrid = () => {};
    ws.currentCategory = 'Doodads';
    ws._categoryChosen = true;
    ws.searchQuery = '';
    const sortSel = add('dd-bag-sort', 'select');
    ws.setBagSort('name');
    assert.strictEqual(prefs.bagSort, 'name', 'remembered');
    assert.strictEqual(sortSel.value, 'name');
    assert.deepStrictEqual(ids(ws.filteredAssets), ['bush', 'oak', 'rock2', 'Rock10']);
    ws.currentCategory = 'Recent';
    ws.refreshDrawerCards();
    assert.deepStrictEqual(ids(ws.filteredAssets), ['bush', 'oak', 'Rock10'], 'Recent stays most recent first');
    ws.currentCategory = 'Doodads';
    ws.setBagSort('nonsense');
    assert.strictEqual(ws.bagSort, 'search');
    // New library entries remember when the bag first saw them.
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-bag-'));
    const file = path.join(dir, 'new.png');
    fs.writeFileSync(file, Buffer.alloc(8));
    const savedData = D.AssetIndex.data;
    D.AssetIndex.data = { version: 1, assets: {}, collections: {} };
    const before = Date.now();
    D.AssetIndex.indexFile(file, 'new.png', '.png', 'img/doodads/new.png');
    const entry = D.AssetIndex.data.assets['img/doodads/new.png'];
    assert.ok(entry.addedAt >= before, 'a new file gets the time it was added');
    entry.mtimeMs = 1;
    const firstSeen = entry.addedAt;
    D.AssetIndex.indexFile(file, 'new.png', '.png', 'img/doodads/new.png', { mtimeMs: 2, size: 9 });
    assert.strictEqual(D.AssetIndex.data.assets['img/doodads/new.png'].addedAt, firstSeen, 'and keeps it when the file changes');
    D.AssetIndex.data = savedData;
    fs.rmSync(dir, { recursive: true, force: true });
    console.log('✓ sorting: name, newest, biggest, most and last placed; remembered; Recent keeps its order; date added recorded');

    // 2. Search chips and saved searches.
    assert.deepStrictEqual(S.tokens('oak tag:"deep woods" -dead  collection:\'Castle Set\''), ['oak', 'tag:"deep woods"', '-dead', "collection:'Castle Set'"]);
    assert.deepStrictEqual(S.tokens(''), []);
    const chips = add('dd-search-chips');
    const input = add('dd-search-input', 'input');
    add('dd-collection-select', 'select');
    D.AssetIndex.data.savedSearches = [];
    ws.setSearchQuery('rock -dead tag:"deep woods"');
    assert.strictEqual(input.value, 'rock -dead tag:"deep woods"');
    const labels = () => chips.childNodes.map(c => c.childNodes[0].textContent);
    assert.deepStrictEqual(labels(), ['rock', '-dead', 'tag:"deep woods"', '☆ Save search'], 'one chip per term, and Save');
    // × on a term takes it out.
    chips.childNodes[1].childNodes[1].onclick({ stopPropagation() {} });
    assert.strictEqual(ws.searchQuery, 'rock tag:"deep woods"');
    assert.deepStrictEqual(labels(), ['rock', 'tag:"deep woods"', '☆ Save search']);
    // Save it under a name.
    D.Ui.prompt = async () => '  Forest rocks ';
    chips.childNodes[2].onclick();
    await wait(0);
    assert.deepStrictEqual(D.AssetIndex.savedSearches(), [{ name: 'Forest rocks', query: 'rock tag:"deep woods"' }]);
    assert.deepStrictEqual(labels(), ['rock', 'tag:"deep woods"', 'Forest rocks'], 'saved: no Save chip for the same search');
    // A plain word shows no term chip; a saved chip brings its search back.
    ws.setSearchQuery('oak');
    assert.deepStrictEqual(labels(), ['Forest rocks', '☆ Save search']);
    chips.childNodes[0].onclick();
    assert.strictEqual(ws.searchQuery, 'rock tag:"deep woods"');
    // Saving under the same name replaces it; × forgets it.
    D.AssetIndex.saveSearch('Forest rocks', 'rock');
    assert.deepStrictEqual(D.AssetIndex.savedSearches(), [{ name: 'Forest rocks', query: 'rock' }]);
    assert.strictEqual(D.AssetIndex.saveSearch('', 'x'), false);
    ws.setSearchQuery('');
    assert.deepStrictEqual(labels(), ['Forest rocks'], 'nothing typed: just the saved ones');
    chips.childNodes[0].childNodes[1].onclick({ stopPropagation() {} });
    assert.deepStrictEqual(D.AssetIndex.savedSearches(), []);
    assert.strictEqual(chips.childNodes.length, 0);
    // Cancelling the name saves nothing; bad data is ignored.
    ws.searchQuery = 'bush';
    D.Ui.prompt = async () => null;
    assert.strictEqual(await ws.saveCurrentSearch(), null);
    D.AssetIndex.data.savedSearches = [{ name: 'ok', query: 'x' }, null, { name: 3 }];
    assert.deepStrictEqual(D.AssetIndex.savedSearches(), [{ name: 'ok', query: 'x' }]);
    D.AssetIndex.data.savedSearches = [];
    // The collection picker keeps the chips up to date too.
    ws.setSearchCollection('Castle Set');
    assert.deepStrictEqual(labels(), ['bush', 'collection:"Castle Set"', '☆ Save search']);
    console.log('✓ search chips: terms removable, saved searches applied, replaced and forgotten');

    // 3. The hover card.
    ws.mounted = true;
    const anim = asset('walker', { path: 'img/characters/!$Walker.png', fileName: '!$Walker.png', width: 144, height: 192, category: 'Characters', type: 'character_sheet',
        usage: { useCount: 3, lastUsedAt: 1 } });
    D.Usage.lastIndex = null;
    let facts = ws.hoverCardFacts(list[0]);
    assert.deepStrictEqual(facts, [['Size', '96 × 144 px'], ['Frames', '1'], ['Depth', 'Sorted with characters'], ['Used in', 'press Where Used'], ['Placed', '5 time(s)']]);
    const rug = asset('rug', { placement: { depth: 'below' } });
    assert.deepStrictEqual(ws.hoverCardFacts(rug).find(f => f[0] === 'Depth'), ['Depth', 'Below characters']);
    assert.ok(/animated/.test(ws.hoverCardFacts(anim).find(f => f[0] === 'Frames')[1]));
    D.Usage.lastIndex = new Map([[D.Usage.keyOf(list[0].path), [{}, {}]]]);
    assert.deepStrictEqual(ws.hoverCardFacts(list[0]).find(f => f[0] === 'Used in'), ['Used in', '2 place(s)']);
    assert.ok(!ws.hoverCardFacts({ id: 'p', type: 'prefab', fileName: 'Hut' }).some(f => f[0] === 'Used in' || f[0] === 'Depth'));
    add('dd-drawer-panel').getBoundingClientRect = () => ({ right: 260 });
    const card = makeNode('div');
    const hc = ws.showHoverCard(list[0], card);
    assert.strictEqual(hc.parentNode, body);
    assert.deepStrictEqual([hc.style.left, hc.style.top], ['270px', '200px'], 'beside the bag, level with the card');
    assert.strictEqual(hc.childNodes[0].textContent, 'oak.png');
    const links = hc.childNodes[hc.childNodes.length - 1].childNodes;
    assert.deepStrictEqual(links.map(b => b.textContent), ['Details', 'Cut Up', 'Where Used']);
    let picked = null;
    ws.selectAsset = a => { picked = a; };
    links[0].onclick();
    assert.strictEqual(picked, list[0]);
    assert.ok(!hc.parentNode, 'a link closes the card');
    let counted = 0;
    ws.refreshUsageIndex = () => { counted++; };
    ws.showHoverCard(list[0], card).childNodes.slice(-1)[0].childNodes[2].onclick();
    assert.strictEqual(counted, 1, 'Where Used counts the uses');
    assert.ok(ws._hoverCard, 'and the card comes back with them');
    ws.hideHoverCard(true);
    // It waits for the mouse to rest, and lingers long enough to reach it.
    const real = makeNode('div');
    ws.createCardElement(list[1], 120);
    ws.hoverCardEnter(list[1], real);
    assert.ok(!ws._hoverCard, 'not straight away');
    await wait(650);
    assert.ok(ws._hoverCard && ws._hoverCard.asset === list[1]);
    ws.hoverCardLeave();
    assert.ok(ws._hoverCard, 'leaving the item leaves time to reach the card');
    ws._hoverCard.el.onmouseenter();
    await wait(300);
    assert.ok(ws._hoverCard, 'on the card it stays');
    ws._hoverCard.el.onmouseleave();
    await wait(300);
    assert.ok(!ws._hoverCard);
    ws.hoverCardEnter(list[1], real);
    ws.hoverCardLeave();
    await wait(650);
    assert.ok(!ws._hoverCard, 'passing over an item shows nothing');
    const built = ws.createCardElement(list[2], 120);
    assert.strictEqual(typeof built.listeners.mouseenter, 'function', 'bag cards are wired');
    ws.mounted = false;
    assert.strictEqual(ws.showHoverCard(list[0], card), null, 'not with the editor closed');
    console.log('✓ hover card: size, frames, depth, uses, times placed; links; waits, lingers and closes');

    // 4. Empty tabs say what goes there, with a button.
    const viewport = makeNode('div');
    ws.searchQuery = '';
    ws.categoryName = c => c === 'Characters' ? 'Characters' : c;
    const state = cat => { ws.currentCategory = cat; return ws.emptyBagState(); };
    assert.strictEqual(state('Doodads').button.label, 'Bring In Files...');
    assert.strictEqual(state('Favorites').button.label, 'Show Everything');
    assert.ok(/Save Prefab/.test(state('Prefabs').text));
    assert.ok(/More Like This/.test(state('Similar').text));
    assert.ok(/No characters here/.test(state('Characters').title));
    let category = null;
    ws.setCategory = c => { category = c; };
    ws.currentCategory = 'Recent';
    const shown = ws.renderEmptyBag(viewport);
    assert.strictEqual(shown.title, 'Nothing placed yet');
    const btn = viewport.childNodes[0].childNodes[2];
    btn.onclick();
    assert.strictEqual(category, 'All');
    ws.currentCategory = 'Doodads';
    ws.searchQuery = 'zzz';
    ws.renderEmptyBag(viewport);
    assert.ok(/No items match "zzz"/.test(viewport.childNodes[0].childNodes[1].textContent));
    ws.setSearchQuery = q => { ws.searchQuery = q; };
    viewport.childNodes[0].childNodes[2].onclick();
    assert.strictEqual(ws.searchQuery, '', 'Clear the Search');
    // Bring In Files opens a picker and passes the chosen files to the import card.
    let imported = null;
    ws.showAssetImportModal = paths => { imported = paths; };
    const created = [];
    const realCreate = document.createElement;
    document.createElement = tag => { const n = realCreate(tag); created.push(n); n.click = () => { n.files = [{ path: 'C:/art/a.png' }, { name: 'nopath.png' }]; n.onchange(); }; return n; };
    assert.ok(ws.pickFilesToImport());
    assert.deepStrictEqual(imported, ['C:/art/a.png']);
    assert.ok(created[0].multiple && created[0].type === 'file');
    document.createElement = realCreate;
    // The real grid shows the empty state when nothing is left.
    ws.updateVirtualGrid = realGrid;
    add('dd-cards-container').clientWidth = 240;
    add('dd-cards-sizer');
    const vp = add('dd-cards-viewport');
    ws.filteredAssets = [];
    ws.currentCategory = 'Favorites';
    ws.searchQuery = '';
    ws.updateVirtualGrid(true);
    assert.strictEqual(vp.childNodes[0].className, 'dd-empty');
    assert.strictEqual(vp.style.gridTemplateColumns, '1fr', 'the message gets the whole width');
    console.log('✓ empty tabs: what goes there, a button (show everything, clear the search, bring in files)');

    // 5. The palette lists the sorts and saved searches.
    D.AssetIndex.data.savedSearches = [{ name: 'Rocks', query: 'rock' }];
    ws.mapEntries = () => [];
    const palette = ws.paletteCommands().map(c => c.label);
    for (const label of ['Sort Item Bag: Name', 'Sort Item Bag: Most placed', 'Save This Search', 'Saved search: Rocks']) assert.ok(palette.includes(label), label);
    console.log('✓ palette: sorts and saved searches');

    console.log('=== Item Bag passed ===');
})().catch(e => { console.error(e); process.exit(1); });
