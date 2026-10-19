// scratch/test_language_access_docking.js
// Batch 8: the editor's language layer (6.2.15), accessibility (6.3.2) and docking the panels (6.3.9).
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== Testing Language, Accessibility and Docking ===');

// A small page: elements with attributes, children, text nodes and the selectors the code uses.
const byId = {};
function text(value) { return { nodeType: 3, nodeValue: value, parentNode: null }; }
function el(tag, attrs = {}, kids = []) {
    const a = Object.assign({}, attrs);
    const classes = new Set(String(a.class || '').split(/\s+/).filter(Boolean));
    const listeners = {};
    const n = {
        nodeType: 1, tagName: tag.toUpperCase(), style: {}, childNodes: [], parentNode: null, type: a.type || '',
        get id() { return a.id || ''; },
        get className() { return Array.from(classes).join(' '); }, set className(v) { classes.clear(); String(v).split(/\s+/).filter(Boolean).forEach(c => classes.add(c)); },
        get textContent() { return this.childNodes.map(c => (c.nodeType === 3 ? c.nodeValue : c.textContent)).join(''); },
        set textContent(v) { this.childNodes = [text(String(v))]; },
        getAttribute(k) { return k in a ? a[k] : null; }, setAttribute(k, v) { a[k] = String(v); if (k === 'id') byId[v] = n; },
        hasAttribute(k) { return k in a; }, removeAttribute(k) { delete a[k]; },
        classList: { contains: c => classes.has(c), add: c => classes.add(c), remove: c => classes.delete(c), toggle: (c, on) => (on === undefined ? (classes.has(c) ? classes.delete(c) : classes.add(c)) : on ? classes.add(c) : classes.delete(c)) },
        appendChild(c) { this.childNodes.push(c); c.parentNode = this; if (c.id) byId[c.id] = c; return c; },
        closest(sel) { let x = this; while (x) { if (x.tagName === sel.toUpperCase()) return x; x = x.parentNode; } return null; },
        querySelectorAll(sel) {
            const tags = sel.split(',').map(s => s.trim()).filter(s => /^[a-z]+$/.test(s)).map(s => s.toUpperCase());
            const roleBtn = sel.includes('[role="button"]');
            const out = [];
            const walk = x => { for (const c of x.childNodes || []) { if (c.nodeType === 1) { if (tags.includes(c.tagName) || (roleBtn && c.getAttribute('role') === 'button')) out.push(c); walk(c); } } };
            walk(this);
            return out;
        },
        querySelector(sel) { const m = /^label\[for="(.+)"\]$/.exec(sel); if (!m) return null; const all = []; const walk = x => { for (const c of x.childNodes || []) if (c.nodeType === 1) { if (c.tagName === 'LABEL' && c.getAttribute('for') === m[1]) all.push(c); walk(c); } }; walk(this); return all[0] || null; },
        addEventListener(t, fn) { (listeners[t] = listeners[t] || []).push(fn); }, fire(t, e) { (listeners[t] || []).forEach(fn => fn(e)); },
        focus() { global.document.activeElement = n; }, contains(x) { while (x) { if (x === n) return true; x = x.parentNode; } return false; },
        getBoundingClientRect: () => n._rect || { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 }
    };
    if (a.id) byId[a.id] = n;
    kids.forEach(k => n.appendChild(typeof k === 'string' ? text(k) : k));
    return n;
}
const root = { classList: new Set(), };
global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.window.innerWidth = 1200;
global.window.innerHeight = 800;
global.document = {
    body: el('body'), documentElement: { classList: { toggle(c, on) { if (on) root.classList.add(c); else root.classList.delete(c); } } },
    createElement: tag => el(tag), getElementById: id => byId[id] || null, querySelectorAll: () => [], addEventListener() {}, removeEventListener() {}, activeElement: null
};
const store = {};
global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } };
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: opt => opt === 'test' };
global.PluginManager = { parameters: () => ({}) };
global.$gameMap = { mapId: () => 1, tileWidth: () => 48, tileHeight: () => 48 };
global.$dataDocsDoodads = { 1: [] };

const sandbox = path.join(__dirname, 'language_fixture');
fs.rmSync(sandbox, { recursive: true, force: true });
fs.mkdirSync(path.join(sandbox, 'data', 'DocsDoodadsLanguages'), { recursive: true });
fs.writeFileSync(path.join(sandbox, 'data', 'DocsDoodadsLanguages', 'de.json'), JSON.stringify({ language: 'Deutsch', strings: {
    'Save everything': 'Alles speichern', 'Item Bag': 'Tasche', 'Placed {n} doodad(s)': '{n} Doodad(s) gesetzt', 'Untranslated': '', 'Find a setting': 'Einstellung suchen'
} }));
fs.writeFileSync(path.join(sandbox, 'data', 'DocsDoodadsLanguages', 'broken.json'), '{ nope');
process.on('exit', () => { process.chdir(__dirname); fs.rmSync(sandbox, { recursive: true, force: true }); });
process.chdir(sandbox);

require('../Docs-Doodads.js');
const D = DocsDoodads, I = D.I18n, U = D.Ui, ws = D.Workspace;
ws.showToast = () => {};

// 1. The language layer.
assert.deepStrictEqual(I.available().map(l => [l.code, l.name]), [['en', 'English'], ['broken', 'broken'], ['de', 'Deutsch']]);
assert.strictEqual(I.t('Save everything'), 'Save everything', 'English until a language is picked');
assert.strictEqual(I.load('de'), 'de');
assert.strictEqual(I.t('Save everything'), 'Alles speichern');
assert.strictEqual(I.t('  Item Bag '), '  Tasche ', 'the spaces around stay');
assert.strictEqual(I.t('Placed 12 doodad(s)'), '12 Doodad(s) gesetzt', 'a pattern carries the value');
assert.strictEqual(I.t('Untranslated'), 'Untranslated', 'an empty translation keeps the English');
assert.strictEqual(I.t('Something new'), 'Something new');
assert.strictEqual(I.t('Hello {who}', { who: 'Pat' }), 'Hello Pat');
assert.strictEqual(I.load('broken'), 'en', 'a file that can\'t be read is English');
I.load('de');
const panel = el('div', { id: 'dd-test-panel', title: 'Save everything (Ctrl+S)' }, [
    el('button', { title: 'Item Bag' }, ['Save everything']),
    el('input', { type: 'text', placeholder: 'Find a setting', value: 'Item Bag' }),
    el('span', {}, ['Placed 3 doodad(s)'])
]);
assert.ok(I.translateTree(panel) >= 3);
assert.strictEqual(panel.childNodes[0].childNodes[0].nodeValue, 'Alles speichern');
assert.strictEqual(panel.childNodes[0].getAttribute('title'), 'Tasche');
assert.strictEqual(panel.childNodes[1].getAttribute('placeholder'), 'Einstellung suchen');
assert.strictEqual(panel.childNodes[1].getAttribute('value'), 'Item Bag', 'what was typed stays');
assert.strictEqual(panel.childNodes[2].childNodes[0].nodeValue, '3 Doodad(s) gesetzt');
assert.strictEqual(I.translateTree(panel), 0, 'running it again changes nothing');
// Look: the language, kept on this computer.
ws.setLanguage('de');
assert.strictEqual(U.prefs().language, 'de');
I.lang = 'en';
U.applyLanguage();
assert.strictEqual(I.lang, 'de', 'the picked language comes back');
ws.setLanguage('xx');
assert.strictEqual(I.lang, 'en', 'a language that isn\'t there is English');
// The template for translators.
const S = require('../scripts/strings.js');
const template = S.build();
assert.ok(template.strings['Save everything'] === '' && template.strings['Keyboard Shortcuts'] === '' && template.strings['Rooms'] === '');
assert.strictEqual(S.placeholders('Placed ${plan.doodads.length} doodad(s) on ${escapeHtml(map.name)}'), 'Placed {doodads} doodad(s) on {name}');
assert.strictEqual(S.placeholders("${U.icon('box', 1)} Packs"), ' Packs');
assert.ok(!S.looksLikeWords('Math.abs(top(c))') && !S.looksLikeWords('dd-room-btn') && !S.looksLikeWords('{btn}{side}') && S.looksLikeWords('Show or hide the grid'));
console.log('✓ language: tables, patterns, the page translated once, English fallback, the template');

// 2. Accessibility: names, roles, live regions; cards in the tab order; arrows; F6; less motion.
const tb = el('div', { id: 'dd-toolbar' }, [el('button', { id: 'dd-select-btn', title: 'Select: click things (Esc)' }), el('button', {}, ['Undo'])]);
const bag = el('div', { id: 'dd-drawer-panel' }, [el('input', { id: 'dd-search-input', placeholder: 'Find...' }), el('label', { for: 'x1' }, ['Name']), el('input', { id: 'x1' })]);
const hint = el('div', { id: 'dd-hint' });
const container = el('div', { id: 'dd-workspace' }, [tb, bag, hint]);
const named = U.labelTree(container);
assert.strictEqual(tb.getAttribute('role'), 'toolbar');
assert.strictEqual(bag.getAttribute('aria-label'), 'Item Bag');
assert.strictEqual(hint.getAttribute('aria-live'), 'polite');
assert.strictEqual(tb.childNodes[0].getAttribute('aria-label'), 'Select: click things', 'an icon button takes its tooltip, without the key');
assert.strictEqual(tb.childNodes[1].getAttribute('aria-label'), null, 'a button with words needs nothing');
assert.strictEqual(bag.childNodes[0].getAttribute('aria-label'), 'Find...', 'a field takes its placeholder');
assert.strictEqual(bag.childNodes[2].getAttribute('aria-label'), null, 'a field with a label is named already');
assert.strictEqual(named, 2);
// Cards.
ws.thumbSize = 48;
D.Thumbnail.get = () => {};
const grid = el('div');
const cards = [];
for (let i = 0; i < 6; i++) {
    const card = ws.createCardElement({ fileName: 'tree' + i, path: 'img/doodads/tree' + i + '.png' }, 80);
    card._rect = { top: Math.floor(i / 3) * 80, left: (i % 3) * 80, right: (i % 3) * 80 + 70, bottom: 0, width: 70, height: 80 };
    grid.appendChild(card);
    cards.push(card);
}
assert.strictEqual(cards[0].getAttribute('tabindex'), '0');
assert.strictEqual(cards[0].getAttribute('role'), 'option');
assert.strictEqual(cards[0].getAttribute('aria-label'), 'tree0');
let picked = null;
cards[4].onclick = () => { picked = 4; };
const key = k => ({ key: k, preventDefault() {}, stopPropagation() {} });
ws.cardKey(cards[0], key('ArrowRight'));
assert.strictEqual(document.activeElement, cards[1]);
ws.cardKey(cards[1], key('ArrowDown'));
assert.strictEqual(document.activeElement, cards[4], 'a row is three cards');
ws.cardKey(cards[4], key('Enter'));
assert.strictEqual(picked, 4, 'Enter picks');
ws.cardKey(cards[4], key('End'));
assert.strictEqual(document.activeElement, cards[5]);
// F6.
const inspector = el('div', { id: 'dd-inspector-panel' });
D.Compat.getCanvas = () => null;
document.activeElement = null;
ws.focusNextPanel(false);
assert.strictEqual(document.activeElement, byId['dd-select-btn']);
ws.focusNextPanel(false);
assert.strictEqual(document.activeElement, byId['dd-search-input']);
ws.focusNextPanel(false);
assert.strictEqual(document.activeElement, inspector);
assert.strictEqual(inspector.getAttribute('tabindex'), '-1', 'a panel can take the focus');
ws.focusNextPanel(true);
assert.strictEqual(document.activeElement, byId['dd-search-input'], 'Shift+F6 goes back');
assert.strictEqual(D.Shortcuts.label('nextPanel'), 'F6');
// Less motion.
assert.strictEqual(U.lessMotion(), false);
U.setPref('lessMotion', true);
U.applyMotion();
assert.ok(root.classList.has('dd-less-motion') && U.lessMotion());
U.setPref('lessMotion', false);
U.applyMotion();
assert.ok(!root.classList.has('dd-less-motion'));
assert.ok(/prefers-reduced-motion: reduce/.test(U.styleText()) && /:focus-visible/.test(U.styleText()));
console.log('✓ accessibility: names and roles, cards and arrows, F6, less motion');

// 3. Docking.
ws.roomSize = () => ({ w: 1200, h: 800 });
ws.uiScaleNow = () => 1;
const drawer = el('div', { id: 'dd-drawer-panel' }), insp = el('div', { id: 'dd-inspector-panel' });
el('div', { id: 'dd-drawer-resizer' }); el('div', { id: 'dd-inspector-resizer' });
drawer.style.width = '250px'; insp.style.width = '270px';
ws.isFolded = () => false;
ws.loadDock('Mapping');
assert.deepStrictEqual(ws.dock, { drawer: 'left', inspector: 'right', bottomHeight: 260 });
ws.applyDockPositions(80);
assert.deepStrictEqual([drawer.style.left, drawer.style.right, drawer.style.top, drawer.style.bottom], ['8px', '', '80px', '8px']);
assert.deepStrictEqual([insp.style.right, insp.style.left], ['8px', '']);
ws.layoutPanels = function() { this.applyDockPositions(80); };
ws.setDock('inspector', 'bottom');
assert.deepStrictEqual([insp.style.bottom, insp.style.height, insp.style.left, insp.style.right, insp.style.width], ['8px', '260px', '8px', '8px', 'auto']);
assert.strictEqual(drawer.style.bottom, '276px', 'the side panel stops above the bottom one');
assert.strictEqual(byId['dd-inspector-resizer'].style.cursor, 'ns-resize', 'the edge facing the map resizes it');
assert.deepStrictEqual(JSON.parse(store['docsDoodads.ui']).docks.Mapping, { drawer: 'left', inspector: 'bottom', bottomHeight: 260 }, 'kept for this layout');
ws.setDock('drawer', 'bottom');
assert.deepStrictEqual([drawer.style.width, drawer.style.left, insp.style.right], ['588px', '8px', '8px'], 'two at the bottom share it');
ws.setDock('drawer', 'right');
ws.setDock('inspector', 'right');
assert.strictEqual(drawer.style.height, '352px', 'two on one side: one above the other');
assert.strictEqual(insp.style.top, (80 + 352 + 8) + 'px');
assert.strictEqual(byId['dd-drawer-resizer'].style.left, '0', 'a right-docked panel resizes from its left edge');
assert.strictEqual(drawer.style.width, '250px', 'it keeps its width on the side');
// Resizing by the edge.
ws.dockResizeTo('drawer', 'right', { x: 900, y: 0, w: 250, h: 260 }, { clientX: 850, clientY: 0 });
assert.strictEqual(drawer.style.width, '300px', 'dragging left widens a right-docked panel');
ws.setDock('inspector', 'bottom');
ws.dockResizeTo('inspector', 'bottom', { x: 0, y: 600, w: 0, h: 260 }, { clientX: 0, clientY: 500 });
assert.strictEqual(ws.dock.bottomHeight, 360);
assert.strictEqual(ws.setDock('drawer', 'middle'), false);
// Drop zones.
assert.strictEqual(ws.dockZoneAt(50, 300), 'left');
assert.strictEqual(ws.dockZoneAt(1150, 300), 'right');
assert.strictEqual(ws.dockZoneAt(600, 700), 'bottom');
assert.strictEqual(ws.dockZoneAt(600, 300), null);
// Layouts carry it: another layout has its own, Save Layout writes it.
D.Layout.current = 'Compact';
ws.loadDock('Compact');
assert.deepStrictEqual(ws.dock, { drawer: 'left', inspector: 'right', bottomHeight: 260 }, 'a layout never changed is as it came');
ws.loadDock('Mapping');
assert.strictEqual(ws.dock.inspector, 'bottom', 'and Mapping is as it was left');
// The map's area follows the panels.
drawer._rect = { left: 642, right: 942, top: 80, bottom: 432, width: 300 };
insp._rect = { left: 8, right: 1192, top: 432, bottom: 792, width: 1184 };
ws.dock = { drawer: 'right', inspector: 'bottom', bottomHeight: 360 };
const area = ws.mapArea();
assert.deepStrictEqual(area, { left: 8, right: 634, bottom: 432, lift: 368 });
console.log('✓ docking: sides and bottom, shared sides, edges that resize, drop zones, per layout, the map\'s area');

console.log('=== Language, accessibility and docking passed ===');
