// scratch/test_menus.js
// The top bar's menus (7.2.1): More split into Map, Art, View and More, described as data. Every entry that was
// in More is in exactly one menu, with its id kept; each has words and a run; the menus' HTML and the palette are
// made from the same list; one menu opens at a time; in a narrow window Map, Art and View fold into More under
// headings and come back; and the arrow keys move inside a menu and between menus.
const assert = require('assert');

console.log('=== Testing the Top Bar Menus ===');

const elements = {};
function classList() {
    const set = new Set();
    return { add: c => set.add(c), remove: c => set.delete(c), contains: c => set.has(c), toggle(c, on) { const want = on === undefined ? !set.has(c) : Boolean(on); if (want) set.add(c); else set.delete(c); return want; }, set };
}
function node(id) {
    return { id, value: '', textContent: '', title: '', style: {}, classList: classList(), childNodes: [], parentNode: null, attrs: {}, offsetWidth: 300,
        appendChild(c) { if (c.parentNode) c.parentNode.removeChild(c); this.childNodes.push(c); c.parentNode = this; return c; },
        insertBefore(c, ref) { if (c.parentNode) c.parentNode.removeChild(c); const i = this.childNodes.indexOf(ref); this.childNodes.splice(i < 0 ? this.childNodes.length : i, 0, c); c.parentNode = this; return c; },
        removeChild(c) { this.childNodes = this.childNodes.filter(x => x !== c); c.parentNode = null; return c; },
        contains: () => false, querySelectorAll: () => [], querySelector: () => null, addEventListener(type, fn) { (this.listeners = this.listeners || {})[type] = fn; },
        setAttribute(k, v) { this.attrs[k] = String(v); }, getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; },
        focus() { global.document.activeElement = this; },
        getBoundingClientRect: () => ({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }) };
}
const el = id => (elements[id] = elements[id] || node(id));
global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.innerWidth = 816;
global.document = {
    activeElement: null, createElement: tag => node(''), body: node('body'),
    getElementById: id => el(id), querySelectorAll: () => [], addEventListener() {}, removeEventListener() {}
};
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: opt => opt === 'test' };
global.PluginManager = { parameters: () => ({}) };
global.$gameMap = { mapId: () => 1, displayX: () => 0, displayY: () => 0, tileWidth: () => 48, tileHeight: () => 48, width: () => 20, height: () => 15 };
global.$dataDocsDoodads = { 1: [] };

require('../Docs-Doodads.js');
const D = DocsDoodads, ws = D.Workspace;
ws.showToast = () => {};

// Every button that was in More before the split.
const OLD = ['dd-slicer-btn', 'dd-postfx-btn', 'dd-vfx-btn', 'dd-history-btn', 'dd-tools-btn', 'dd-diag-btn', 'dd-grid-btn', 'dd-collision-btn',
    'dd-sound-btn', 'dd-palette-btn', 'dd-messages-btn', 'dd-look-btn', 'dd-rooms-btn', 'dd-packs-btn', 'dd-lpc-btn', 'dd-keys-btn', 'dd-capture-btn',
    'dd-find-btn', 'dd-outliner-btn', 'dd-templates-btn', 'dd-mapset-btn', 'dd-savemap-btn', 'dd-autosave-btn', 'dd-problems-btn', 'dd-sounds-btn',
    'dd-listen-btn', 'dd-perf-btn', 'dd-help-btn'];

// 1. The data: every old id in exactly one menu; words and a run for each.
{
    const menus = ws.menus();
    assert.deepStrictEqual(menus.map(m => m.label), ['Map', 'Art', 'View', 'More']);
    const ids = menus.flatMap(m => m.items.map(i => i.id));
    for (const id of OLD) assert.strictEqual(ids.filter(x => x === id).length, 1, `${id} is in exactly one menu`);
    assert.strictEqual(new Set(ids).size, ids.length, 'no entry twice');
    assert.deepStrictEqual(ids.filter(id => !OLD.includes(id)).sort(), ['dd-bookmarks-btn', 'dd-moods-btn', 'dd-notes-btn', 'dd-notes-show-btn', 'dd-reach-btn', 'dd-ruler-btn', 'dd-settings-btn'],
        'new since the split: Check Reach, Settings, Notes, Show Notes, Ruler and Bookmarks');
    const where = id => menus.find(m => m.items.some(i => i.id === id)).id;
    assert.strictEqual(where('dd-problems-btn'), 'map');
    assert.strictEqual(where('dd-lpc-btn'), 'art');
    assert.strictEqual(where('dd-grid-btn'), 'view');
    assert.strictEqual(where('dd-palette-btn'), 'more');
    assert.deepStrictEqual(['dd-notes-btn', 'dd-ruler-btn', 'dd-notes-show-btn', 'dd-bookmarks-btn'].map(where), ['map', 'map', 'view', 'view']);
    assert.ok(menus.find(m => m.id === 'view').layouts, 'the layouts are in View');
    for (const m of menus) for (const item of m.items) assert.ok(ws.menuItemText(item) && item.icon, `${item.id} has words and an icon`);
    for (const c of ws.menuCommands()) assert.strictEqual(typeof c.run, 'function', c.label);
    assert.strictEqual(ws.menuCommands().length, ids.length);
    console.log('PASS every old entry in exactly one menu, each with words and a run');
}

// 2. The HTML comes from the same list: each id once, and a bar button per menu.
{
    const html = ws.renderMenus();
    for (const id of OLD.concat(['dd-reach-btn', 'dd-layout-select', 'dd-save-layout-btn', 'dd-del-layout-btn'])) {
        assert.strictEqual(html.split(`id="${id}"`).length - 1, 1, `${id} drawn once`);
    }
    for (const id of ['dd-more-menu', 'dd-menu-map', 'dd-menu-art', 'dd-menu-view']) assert.ok(html.includes(`id="${id}"`), id);
    ws.gridSnapShow = true;
    assert.ok(ws.renderMenus().includes('<span id="dd-grid-label">Hide Grid</span>'), 'words that follow a setting');
    ws.gridSnapShow = false;
    const tool = (id, icon, label) => `[${id}:${label}]`;
    assert.strictEqual(ws.renderMenuButtons(tool), '[dd-menu-map-btn:Map]\n[dd-menu-art-btn:Art]\n[dd-menu-view-btn:View]\n[dd-more-btn:More]');
    const core = require('fs').readFileSync(require('path').join(__dirname, '..', 'Docs-Doodads.js'), 'utf8');
    assert.ok(core.includes('${this.renderMenuButtons(tool)}') && core.includes('${this.renderMenus()}'), 'the bar and the pop-ups use them');
    console.log('PASS the menus and their bar buttons are drawn from the list');
}

// 3. The palette has every entry: as "Menu → entry", or already under its own words.
{
    ws.mapEntries = () => [];
    const palette = ws.paletteCommands().map(c => c.label.toLowerCase());
    for (const c of ws.menuCommands()) {
        const words = c.text.toLowerCase();
        assert.ok(palette.includes(c.label.toLowerCase()) || palette.some(l => l === words || l.startsWith(words + ' ') || l.startsWith(words + ':')), `${c.label} in the palette`);
    }
    assert.ok(palette.includes('map → templates') && palette.includes('view → show collision') && palette.includes('art → cut up sheet'));
    assert.ok(!palette.includes('art → characters'), 'not twice: Characters (MZ, LPC and Memao libraries) is there already');
    let ran = 0;
    el('dd-listen-btn').onclick = () => { ran++; };
    ws.menuCommands().find(c => c.id === 'dd-listen-btn').run();
    assert.strictEqual(ran, 1, 'a palette entry does what the button does');
    console.log('PASS every entry is in the palette once');
}

// 4. One menu opens at a time; an entry used closes it; the words follow their settings.
{
    ws.placePopover = () => {};
    assert.strictEqual(ws.toggleMenu('map'), true);
    assert.strictEqual(el('dd-menu-map').style.display, 'block');
    assert.ok(el('dd-menu-map-btn').classList.contains('dd-btn-active'));
    assert.strictEqual(el('dd-menu-map-btn').getAttribute('aria-expanded'), 'true');
    assert.strictEqual(ws.openMenu(), 'map');
    ws.showCollision = true;
    ws.toggleMenu('view');
    assert.strictEqual(el('dd-menu-map').style.display, 'none', 'the other closes');
    assert.strictEqual(el('dd-menu-view').style.display, 'block');
    assert.strictEqual(el('dd-collision-label').textContent, 'Hide Collision');
    ws.showMoreMenu(false);
    assert.strictEqual(ws.openMenu(), null, 'showMoreMenu(false) closes whichever is open');
    ws.showMoreMenu(true);
    assert.strictEqual(ws.openMenu(), 'more');
    ws.toggleMenu('more');
    assert.strictEqual(ws.openMenu(), null);
    ws.showCollision = false;
    console.log('PASS one menu at a time');
}

// 5. Narrow: Map, Art and View fold into More under headings, in order, and go back.
{
    for (const m of ['map', 'art', 'view', 'more']) el(`dd-menu-sections-${m}`).appendChild(el(`dd-menu-sec-${m}`));
    ws._menusFolded = false;
    assert.strictEqual(ws.foldMenus(true), true);
    assert.deepStrictEqual(el('dd-menu-sections-more').childNodes.map(n => n.id), ['dd-menu-sec-map', 'dd-menu-sec-art', 'dd-menu-sec-view', 'dd-menu-sec-more']);
    assert.strictEqual(el('dd-menu-sections-map').childNodes.length, 0);
    assert.ok(el('dd-more-menu').classList.contains('dd-menus-folded'), 'headings shown');
    ws.foldMenus(false);
    assert.deepStrictEqual(el('dd-menu-sections-more').childNodes.map(n => n.id), ['dd-menu-sec-more']);
    assert.deepStrictEqual(el('dd-menu-sections-view').childNodes.map(n => n.id), ['dd-menu-sec-view']);
    assert.ok(!el('dd-more-menu').classList.contains('dd-menus-folded'));
    const css = D.Ui.css;
    assert.ok(/\.dd-menu-head \{ display: none; \}/.test(css) && /#dd-more-menu\.dd-menus-folded \.dd-menu-head \{ display: block;/.test(css));
    console.log('PASS folding into More and back');
}

// 6. Keys: up and down inside a menu, left and right between menus, Esc back to the button.
{
    const buttons = id => ws.menus().find(m => m.id === id).items.map(i => el(i.id));
    for (const m of ['map', 'art', 'view', 'more']) {
        el(ws.menuPopId(m)).querySelectorAll = () => buttons(m);
        el(ws.menuPopId(m)).querySelector = () => buttons(m)[0];
    }
    const key = (menu, k) => ws.topMenuKey(menu, { key: k, preventDefault() {}, stopPropagation() {} });
    ws.showMenu('art', true);
    el('dd-slicer-btn').focus();
    key('art', 'ArrowDown');
    assert.strictEqual(document.activeElement, el('dd-lpc-btn'));
    key('art', 'ArrowUp');
    key('art', 'ArrowUp');
    assert.strictEqual(document.activeElement, el('dd-tools-btn'), 'wraps round');
    key('art', 'ArrowRight');
    assert.strictEqual(ws.openMenu(), 'view');
    assert.strictEqual(document.activeElement, el('dd-grid-btn'));
    key('view', 'ArrowLeft');
    key('art', 'ArrowLeft');
    key('map', 'ArrowLeft');
    assert.strictEqual(ws.openMenu(), 'more', 'round to the end');
    key('more', 'Escape');
    assert.strictEqual(ws.openMenu(), null);
    assert.strictEqual(document.activeElement, el('dd-more-btn'));
    ws._menusFolded = true;
    ws.showMenu('more', true);
    key('more', 'ArrowRight');
    assert.strictEqual(ws.openMenu(), 'more', 'folded: only More is on the bar');
    ws._menusFolded = false;
    assert.strictEqual(key('more', 'x'), false, 'other keys are left alone');
    console.log('PASS keys');
}

console.log('\nAll top bar menu tests passed.');
