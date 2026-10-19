// scratch/test_keyboard_screen_readers.js
// Plan B3 (§9.3): focus rings that MZ's Chromium 85 shows, the context menu by keyboard, Undo and Redo said
// to be unavailable, the bag's kinds as tabs, panel edges resized with the keys, Tab let through to the
// editor, and the screen-reader watcher labelling only what was added.
const assert = require('assert');

console.log('=== Testing Keyboard and Screen Readers (B3) ===');

// A small page: elements with settable ids, attributes, children, focus, click and listeners.
const byId = {};
let attached = new Set();
function el(tag, attrs = {}, kids = []) {
    const a = Object.assign({}, attrs);
    const classes = new Set(String(a.class || '').split(/\s+/).filter(Boolean));
    delete a.class;
    const listeners = {};
    const n = {
        nodeType: 1, tagName: tag.toUpperCase(), style: {}, childNodes: [], parentNode: null, dataset: {}, innerHTML: '', title: '',
        disabled: false, onclick: null, onkeydown: null, onmousedown: null,
        get id() { return a.id || ''; }, set id(v) { a.id = String(v); byId[v] = n; },
        get children() { return this.childNodes; },
        get className() { return Array.from(classes).join(' '); }, set className(v) { classes.clear(); String(v).split(/\s+/).filter(Boolean).forEach(c => classes.add(c)); },
        get textContent() { return this.childNodes.map(c => (c.nodeType === 3 ? c.nodeValue : c.textContent)).join(''); },
        get isConnected() { let x = n; while (x) { if (x === global.document.body) return true; x = x.parentNode; } return false; },
        getAttribute(k) { return k in a ? a[k] : (k === 'title' && n.title ? n.title : null); },
        setAttribute(k, v) { a[k] = String(v); if (k === 'id') byId[v] = n; },
        hasAttribute(k) { return k in a; }, removeAttribute(k) { delete a[k]; },
        classList: { contains: c => classes.has(c), add: c => classes.add(c), remove: c => classes.delete(c), toggle: (c, on) => (on ? classes.add(c) : classes.delete(c)) },
        appendChild(c) { this.childNodes.push(c); c.parentNode = this; if (c.id) byId[c.id] = c; return c; },
        removeChild(c) { const i = this.childNodes.indexOf(c); if (i >= 0) this.childNodes.splice(i, 1); c.parentNode = null; if (c.id && byId[c.id] === c) delete byId[c.id]; return c; },
        closest(sel) { let x = this; while (x) { if (x.tagName === sel.toUpperCase()) return x; x = x.parentNode; } return null; },
        querySelectorAll(sel) {
            const tags = sel.split(',').map(s => s.trim()).filter(s => /^[a-z]+$/.test(s)).map(s => s.toUpperCase());
            const roleBtn = sel.includes('[role="button"]');
            const out = [];
            const walk = x => { for (const c of x.childNodes || []) { if (c.nodeType === 1) { if (tags.includes(c.tagName) || (roleBtn && c.getAttribute('role') === 'button')) out.push(c); walk(c); } } };
            walk(this);
            return out;
        },
        querySelector() { return null; },
        addEventListener(t, fn) { (listeners[t] = listeners[t] || []).push(fn); },
        fire(t, e) { (listeners[t] || []).forEach(fn => fn(e)); },
        focus() { global.document.activeElement = n; },
        click() { if (n.onclick) n.onclick({ stopPropagation() {} }); },
        contains(x) { while (x) { if (x === n) return true; x = x.parentNode; } return false; },
        get offsetWidth() { return 180; }, get offsetHeight() { return 200; },
        getBoundingClientRect: () => ({ left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 })
    };
    if (a.id) byId[a.id] = n;
    kids.forEach(k => n.appendChild(typeof k === 'string' ? { nodeType: 3, nodeValue: k, parentNode: null } : k));
    return n;
}
const rootClasses = new Set();
const docListeners = {};
global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.window.innerWidth = 1200;
global.window.innerHeight = 800;
global.document = {
    body: el('body'),
    documentElement: { classList: { add: c => rootClasses.add(c), remove: c => rootClasses.delete(c), contains: c => rootClasses.has(c), toggle(c, on) { if (on) rootClasses.add(c); else rootClasses.delete(c); } } },
    createElement: tag => el(tag), getElementById: id => byId[id] || null, querySelectorAll: () => [],
    addEventListener(t, fn, capture) { (docListeners[t] = docListeners[t] || []).push({ fn, capture }); }, removeEventListener() {},
    activeElement: null
};
const store = {};
global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } };
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: opt => opt === 'test' };
global.PluginManager = { parameters: () => ({}) };
global.$gameMap = { mapId: () => 1, tileWidth: () => 48, tileHeight: () => 48 };
global.$dataDocsDoodads = { 1: [] };
// MZ's own key handler, to see what reaches it.
const mzKeys = [];
global.Input = { _onKeyDown(e) { mzKeys.push(e.keyCode); } };
let observer = null;
global.MutationObserver = class { constructor(fn) { this.fn = fn; observer = this; } observe() {} disconnect() {} };

require('../Docs-Doodads.js');
const D = DocsDoodads, U = D.Ui, ws = D.Workspace;
ws.showToast = () => {};
const key = (k, extra = {}) => Object.assign({ key: k, preventDefault() { this.prevented = true; }, stopPropagation() { this.stopped = true; } }, extra);

// 1. Focus rings in the built CSS, as Chromium 85 reads it.
const css = U.styleText().replace(/\/\*[\s\S]*?\*\//g, '');
const rules = [];
// Top-level and @media rules alike: a selector list, then a body with no braces in it.
for (const m of css.matchAll(/([^{}@]+)\{([^{}]*)\}/g)) rules.push({ sel: m[1].trim(), body: m[2].trim(), list: m[1].split(',').map(s => s.trim()) });
const visibleRules = rules.filter(r => r.sel.includes(':focus-visible'));
assert.ok(visibleRules.length >= 4, 'the rings are still there for newer Chromium');
for (const r of visibleRules) {
    assert.ok(r.list.every(s => s.includes(':focus-visible')), `a rule naming :focus-visible names nothing else (Chromium 85 would drop it all): ${r.sel}`);
}
// What Chromium 85 keeps: every rule that doesn't name :focus-visible.
const kept = rules.filter(r => !r.sel.includes(':focus-visible'));
const ring = (selector, prop) => kept.find(r => r.list.includes(selector) && new RegExp(`${prop}\\s*:`).test(r.body));
const base = ring(':root:not(.dd-mouse-focus) .dd-btn:focus', 'box-shadow');
assert.ok(base && /0 0 0 3px/.test(base.body), 'a button shows a ring on plain :focus');
assert.ok(ring(':root[data-dd-theme="contrast"]:not(.dd-mouse-focus) .dd-btn:focus', 'box-shadow'), 'and in the contrast theme');
assert.ok(ring(':root[data-dd-theme="playful"]:not(.dd-mouse-focus) .dd-btn:focus', 'box-shadow'), 'and in the playful theme');
assert.ok(ring(':root[data-dd-theme="contrast"] .dd-glass input:focus', 'box-shadow'), 'the contrast theme\'s field ring is a rule of its own now');
assert.ok(ring(':root:not(.dd-mouse-focus) .dd-glass :focus', 'outline'), 'anything in a panel shows the outline');
assert.ok(ring(':root:not(.dd-mouse-focus) #dd-asset-workspace-root :focus', 'outline'), 'the workspace outline names the real root');
assert.ok(ring(':root:not(.dd-mouse-focus) #dd-creator button:focus', 'outline'), 'the character creator\'s buttons too');
assert.ok(kept.some(r => r.list.includes('#dd-context-menu .dd-btn:focus') && /background/.test(r.body)), 'the focused menu item is lit');
// Every rule naming the editor names its real root (#dd-workspace was never on the page).
assert.ok(!rules.some(r => r.list.some(s => /#dd-workspace(?![-\w])/.test(s))), 'no rule names #dd-workspace');
assert.ok(rules.some(r => r.list.includes(':root.dd-less-motion #dd-asset-workspace-root *') && /animation:\s*none/.test(r.body)), 'Less motion stops the whole editor');
// The one unconditional .dd-btn:focus rule only turns the browser outline off; it sets no box-shadow.
const plain = kept.filter(r => r.list.includes('.dd-btn:focus'));
assert.ok(plain.length === 1 && !/box-shadow/.test(plain[0].body));
// Where focus came from: a press hides the :focus rings, moving with the keys shows them again.
assert.strictEqual(U.watchFocusSource(), true);
assert.strictEqual(U.watchFocusSource(), false, 'only once');
const fireDoc = (t, e) => (docListeners[t] || []).forEach(l => { assert.strictEqual(l.capture, true, 'listened for before the editor\'s own handlers'); l.fn(e); });
fireDoc('pointerdown', {});
assert.ok(rootClasses.has('dd-mouse-focus'));
fireDoc('keydown', key('s'));
assert.ok(rootClasses.has('dd-mouse-focus'), 'a shortcut doesn\'t ring the button last clicked');
fireDoc('keydown', key('Tab'));
assert.ok(!rootClasses.has('dd-mouse-focus'), 'Tab shows the rings');
fireDoc('mousedown', {});
fireDoc('keydown', key('ArrowDown'));
assert.ok(!rootClasses.has('dd-mouse-focus'), 'and so do the arrows');
console.log('✓ focus rings: no :focus-visible in a shared rule, plain :focus twins for every ring, pointer vs keys');

// 2. Tab reaches the editor: MZ cancels it on anything that isn't a field.
const btn = el('button');
ws.mounted = true;
Input._onKeyDown({ keyCode: 9, target: btn });
Input._onKeyDown({ keyCode: 37, target: btn });
ws.mounted = false;
Input._onKeyDown({ keyCode: 9, target: btn });
assert.deepStrictEqual(mzKeys, [37, 9], 'Tab skips MZ only while the editor is open');
console.log('✓ Tab: left to the browser while the editor is open');

// 3. The context menu.
const canvas = el('canvas');
document.body.appendChild(canvas);
canvas.focus();
const ran = [];
const items = [
    { label: 'Copy', iconName: 'copy', onClick: () => ran.push('copy') },
    { label: 'Paste', onClick: () => ran.push('paste') },
    { separator: true },
    { label: 'Delete', danger: true, onClick: () => ran.push('delete') }
];
ws.showContextMenu(100, 100, items);
const menu = byId['dd-context-menu'];
assert.ok(menu, 'the menu is on the page');
assert.strictEqual(menu.getAttribute('role'), 'menu');
const entries = menu.childNodes.filter(c => c.getAttribute('role') === 'menuitem');
assert.strictEqual(entries.length, 3);
assert.ok(entries.every(b => b.getAttribute('tabindex') === '-1'), 'items are reached with the arrows, not Tab');
assert.strictEqual(menu.childNodes[2].getAttribute('role'), 'separator');
assert.strictEqual(document.activeElement, entries[0], 'the first item has the focus');
const send = k => { const e = key(k); menu.fire('keydown', e); return e; };
let e = send('ArrowDown');
assert.strictEqual(document.activeElement, entries[1]);
assert.ok(e.prevented && e.stopped, 'the arrow doesn\'t also nudge the selection on the map');
send('ArrowDown');
assert.strictEqual(document.activeElement, entries[2], 'the separator is skipped');
send('ArrowDown');
assert.strictEqual(document.activeElement, entries[0], 'it wraps round');
send('ArrowUp');
assert.strictEqual(document.activeElement, entries[2]);
send('Home');
assert.strictEqual(document.activeElement, entries[0]);
send('End');
assert.strictEqual(document.activeElement, entries[2]);
e = send('x');
assert.ok(!e.prevented, 'other keys pass');
send('ArrowUp');
send('Enter');
assert.deepStrictEqual(ran, ['paste'], 'Enter runs the item');
assert.strictEqual(byId['dd-context-menu'], undefined, 'and closes the menu');
assert.strictEqual(document.activeElement, canvas, 'focus goes back to the map');
ws.showContextMenu(100, 100, items);
const menu2 = byId['dd-context-menu'];
const e2 = key('Escape');
menu2.fire('keydown', e2);
assert.strictEqual(byId['dd-context-menu'], undefined, 'Esc closes it');
assert.ok(e2.stopped, 'without also dropping the tool or the selection');
assert.strictEqual(document.activeElement, canvas);
assert.deepStrictEqual(ran, ['paste'], 'nothing ran');
ws.showContextMenu(100, 100, items);
const e3 = key('Tab');
byId['dd-context-menu'].fire('keydown', e3);
assert.strictEqual(byId['dd-context-menu'], undefined, 'Tab closes it too');
// The quick row of most-used actions is items as well.
const many = ['A', 'B', 'C', 'D', 'E', 'F'].map(l => ({ label: l, onClick: () => ran.push(l) }));
U.setPref('menuUse', { A: 3, B: 2 });
ws.showContextMenu(100, 100, many);
const quickRow = byId['dd-context-menu'].childNodes[0];
assert.strictEqual(quickRow.getAttribute('role'), 'group');
assert.ok(quickRow.childNodes.every(b => b.getAttribute('role') === 'menuitem'));
assert.strictEqual(document.activeElement, quickRow.childNodes[0], 'the first quick action has the focus');
ws.closeContextMenu();
assert.strictEqual(document.activeElement, canvas, 'closed from outside, focus still goes back');
console.log('✓ context menu: roles, first item focused, arrows, Home/End, Enter, Esc, Tab, focus returned');

// 4. Undo and Redo say when there is nothing to take back.
const undoBtn = el('button', { id: 'dd-undo-btn' }), redoBtn = el('button', { id: 'dd-redo-btn' });
D.Undo.undoStack = [];
D.Undo.redoStack = [];
ws.updateUndoButtons();
assert.strictEqual(undoBtn.getAttribute('aria-disabled'), 'true');
assert.strictEqual(redoBtn.getAttribute('aria-disabled'), 'true');
assert.strictEqual(undoBtn.style.opacity, '0.5');
D.Undo.undoStack.push({});
ws.updateUndoButtons();
assert.strictEqual(undoBtn.getAttribute('aria-disabled'), 'false');
assert.strictEqual(undoBtn.style.opacity, '1');
assert.strictEqual(redoBtn.getAttribute('aria-disabled'), 'true');
D.Undo.undoStack = [];
console.log('✓ undo and redo: aria-disabled follows the stacks');

// 5. The bag's kinds are tabs.
const markup = ws.buildDom.toString();
assert.ok(/id="dd-category-tabs" role="tablist"/.test(markup), 'the row is a tab list');
assert.ok(/role="tab" aria-selected="\$\{cat === this\.currentCategory\}"/.test(markup), 'each kind is a tab, the shown one selected');
assert.ok(/id="dd-drawer-resizer"[^>]*role="separator"[^>]*tabindex="0"/.test(markup) && /id="dd-inspector-resizer"[^>]*tabindex="0"/.test(markup), 'the edges are in the tab order');
const tabRow = el('div', { id: 'dd-category-tabs' });
for (const [cat] of ws.categoryTabs.slice(0, 4)) { const b = el('button', { role: 'tab' }); b.dataset.cat = cat; tabRow.appendChild(b); }
const tabs = tabRow.childNodes;
ws.refreshDrawerCards = () => {};
ws.isFolded = () => false;
ws.setCategory(tabs[0].dataset.cat);
assert.deepStrictEqual(tabs.map(t => [t.getAttribute('aria-selected'), t.getAttribute('tabindex')]), [['true', '0'], ['false', '-1'], ['false', '-1'], ['false', '-1']]);
assert.ok(tabs[0].className.includes('dd-btn-primary'));
let k = key('ArrowRight', { target: tabs[0] });
assert.strictEqual(ws.categoryTabKey(k), true);
assert.strictEqual(ws.currentCategory, tabs[1].dataset.cat, 'the arrow shows the next kind');
assert.strictEqual(document.activeElement, tabs[1]);
assert.deepStrictEqual(tabs.map(t => t.getAttribute('tabindex')), ['-1', '0', '-1', '-1'], 'one tab in the tab order');
assert.ok(k.prevented && k.stopped);
ws.categoryTabKey(key('ArrowLeft', { target: tabs[1] }));
ws.categoryTabKey(key('ArrowLeft', { target: tabs[0] }));
assert.strictEqual(document.activeElement, tabs[3], 'it wraps round');
ws.categoryTabKey(key('Home', { target: tabs[3] }));
assert.strictEqual(ws.currentCategory, tabs[0].dataset.cat);
ws.categoryTabKey(key('End', { target: tabs[0] }));
assert.strictEqual(ws.currentCategory, tabs[3].dataset.cat);
assert.strictEqual(ws.categoryTabKey(key('Enter', { target: tabs[3] })), false, 'other keys pass (Enter clicks the button)');
ws.setCategory('Similar');
assert.deepStrictEqual(tabs.map(t => [t.getAttribute('aria-selected'), t.getAttribute('tabindex')]), [['false', '0'], ['false', '-1'], ['false', '-1'], ['false', '-1']], 'showing look-alikes, the first tab keeps the row reachable');
console.log('✓ category tabs: tablist, aria-selected, one tab stop, arrows, Home/End');

// 6. Panel edges resized with the keys.
ws.roomSize = () => ({ w: 1200, h: 800 });
ws.uiScaleNow = () => 1;
const drawer = el('div', { id: 'dd-drawer-panel' }), insp = el('div', { id: 'dd-inspector-panel' });
const drawerEdge = el('div', { id: 'dd-drawer-resizer' }), inspEdge = el('div', { id: 'dd-inspector-resizer' });
drawer.style.width = '250px'; insp.style.width = '270px';
ws.layoutPanels = function() { this.applyDockPositions(80); };
ws.loadDock('Mapping');
ws.applyDockPositions(80);
assert.strictEqual(drawerEdge.getAttribute('tabindex'), '0');
assert.strictEqual(drawerEdge.getAttribute('role'), 'separator');
assert.strictEqual(drawerEdge.getAttribute('aria-orientation'), 'vertical');
assert.strictEqual(drawerEdge.getAttribute('aria-valuenow'), '250');
assert.strictEqual(typeof drawerEdge.onkeydown, 'function');
k = key('ArrowRight');
drawerEdge.onkeydown(k);
assert.strictEqual(drawer.style.width, '260px', 'right arrow widens a bag on the left');
assert.ok(k.prevented && k.stopped, 'the arrow doesn\'t also move doodads');
assert.strictEqual(drawerEdge.getAttribute('aria-valuenow'), '260', 'the new size is said');
drawerEdge.onkeydown(key('ArrowLeft', { shiftKey: true }));
assert.strictEqual(drawer.style.width, '210px', 'Shift moves by 50');
drawerEdge.onkeydown(key('Home'));
assert.strictEqual(drawer.style.width, '200px', 'Home: smallest');
inspEdge.onkeydown(key('ArrowLeft'));
assert.strictEqual(insp.style.width, '280px', 'left arrow widens Details on the right');
inspEdge.onkeydown(key('End'));
assert.strictEqual(insp.style.width, '600px', 'End: biggest');
ws.setDock('inspector', 'bottom');
assert.strictEqual(inspEdge.getAttribute('aria-orientation'), 'horizontal');
const h = ws.dock.bottomHeight;
inspEdge.onkeydown(key('ArrowUp'));
assert.strictEqual(ws.dock.bottomHeight, h + 10, 'up arrow makes a bottom panel taller');
assert.strictEqual(JSON.parse(store['docsDoodads.ui']).docks.Mapping.bottomHeight, h + 10, 'and it is kept');
assert.strictEqual(ws.dockResizeKey('inspector', key('ArrowLeft')), false, 'sideways does nothing along the bottom');
ws.setDock('inspector', 'right');
console.log('✓ resizers: tab stop, separator role and value, arrows, Shift, Home/End, bottom panels');

// 7. The screen-reader watcher labels only what was added.
ws.container = el('div', { id: 'dd-asset-workspace-root' });
document.body.appendChild(ws.container);
const roots = [];
const baseLabel = U.labelTree;
U.labelTree = function(root, opts) { roots.push(root); return baseLabel.call(this, root, opts); };
ws.labelWorkspace();
assert.ok(observer, 'a watcher is set');
assert.deepStrictEqual(roots, [ws.container], 'the whole editor once, when it opens');
roots.length = 0;
const added = el('div', {}, [el('button', { title: 'Fold the bag away' })]);
const iconBtn = el('button', { title: 'Undo (Ctrl+Z)' });
ws.container.appendChild(added);
ws.container.appendChild(iconBtn);
const gone = el('div');
observer.fn([{ addedNodes: [added, added.childNodes[0], { nodeType: 3, nodeValue: 'text' }] }, { addedNodes: [iconBtn, gone] }]);
setTimeout(() => {
    assert.deepStrictEqual(roots, [added, iconBtn], 'only the added subtrees, the outermost of each, once each, still on the page');
    assert.strictEqual(added.childNodes[0].getAttribute('aria-label'), 'Fold the bag away', 'a button inside one is named');
    assert.strictEqual(iconBtn.getAttribute('aria-label'), 'Undo', 'an added button is named itself');
    roots.length = 0;
    observer.fn([{ addedNodes: [{ nodeType: 3, nodeValue: 'just text' }] }]);
    setTimeout(() => {
        assert.deepStrictEqual(roots, [], 'text alone labels nothing');
        U.labelTree = baseLabel;
        ws.stopLabelWatch();
        console.log('✓ screen readers: the watcher labels the added nodes, not the whole editor');
        console.log('\nAll keyboard and screen reader tests passed.');
    }, 90);
}, 90);
