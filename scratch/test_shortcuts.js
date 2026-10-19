// scratch/test_shortcuts.js
// One shortcut table (6.1.3): the key handler, the Keyboard Shortcuts card, tooltips, the palette and the
// guide's cheat sheet all read DocsDoodads.Shortcuts; keys can be rebound, a key in use asks before it
// moves, reserved keys are refused, and letters follow the keyboard layout.
const assert = require('assert');

console.log('=== Testing Shortcut Table ===');

const byId = {};
function makeNode(tag) {
    const attrs = {};
    const classes = new Set();
    const n = {
        tagName: String(tag).toUpperCase(), style: {}, childNodes: [], parentNode: null, textContent: '',
        get innerHTML() { return this._html || ''; },
        set innerHTML(v) { this._html = v; this.childNodes = []; for (const m of String(v).matchAll(/id="([^"]+)"/g)) { const c = makeNode('div'); c.id = m[1]; this.appendChild(c); } },
        get id() { return attrs.id || ''; }, set id(v) { attrs.id = String(v); if (v) byId[v] = this; },
        get className() { return Array.from(classes).join(' '); }, set className(v) { classes.clear(); String(v).split(/\s+/).filter(Boolean).forEach(c => classes.add(c)); },
        classList: { add: c => classes.add(c), remove: c => classes.delete(c), contains: c => classes.has(c), toggle() {} },
        appendChild(c) { this.childNodes.push(c); c.parentNode = this; if (c.id) byId[c.id] = c; return c; },
        removeChild(c) { this.childNodes = this.childNodes.filter(x => x !== c); c.parentNode = null; if (byId[c.id] === c) delete byId[c.id]; return c; },
        setAttribute(k, v) { attrs[k] = String(v); }, getAttribute(k) { return k in attrs ? attrs[k] : null; },
        hasAttribute(k) { return k in attrs; }, removeAttribute(k) { delete attrs[k]; },
        querySelectorAll: () => [], querySelector: () => null, addEventListener() {}, removeEventListener() {}
    };
    return n;
}
const windowListeners = {};
const docListeners = [];
global.window = global;
global.window.addEventListener = (type, fn) => { (windowListeners[type] = windowListeners[type] || []).push(fn); };
global.window.removeEventListener = () => {};
global.document = {
    body: makeNode('body'), createElement: makeNode, getElementById: id => byId[id] || null, querySelectorAll: () => [],
    addEventListener: (type, fn, capture) => { if (type === 'keydown' && capture) docListeners.push(fn); },
    removeEventListener: (type, fn) => { const i = docListeners.indexOf(fn); if (i >= 0) docListeners.splice(i, 1); }
};
const store = {};
global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } };
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: opt => opt === 'test' };
global.PluginManager = { parameters: () => ({ editKey: 'F10', editorMode: 'true' }) };
global.$gameSystem = {};

require('../Docs-Doodads.js');
const D = DocsDoodads, S = D.Shortcuts, ws = D.Workspace;
const toasts = [];
ws.showToast = (text, kind) => toasts.push([text, kind]);

const key = (k, extra = {}) => Object.assign({ key: k, code: '', ctrlKey: false, shiftKey: false, altKey: false, target: null, prevented: false,
    preventDefault() { this.prevented = true; }, stopPropagation() {}, stopImmediatePropagation() {} }, extra);
const press = e => { for (const fn of windowListeners.keydown) fn(e); return e; };

// 1. The table: unique ids, every rebindable default readable, the old hard-coded keys still there.
const ids = S.list.map(s => s.id);
assert.strictEqual(new Set(ids).size, ids.length, 'ids are unique');
for (const s of S.list.filter(s => !s.fixed && s.keys)) assert.ok(S.parse(s.keys), s.id + ' parses');
assert.deepStrictEqual(['undo', 'redo', 'save', 'duplicate', 'palette', 'copy', 'paste', 'pasteInPlace', 'selectAll', 'grid', 'details', 'find'].map(id => S.label(id)),
    ['Ctrl+Z', 'Ctrl+Y', 'Ctrl+S', 'Ctrl+D', 'Ctrl+K', 'Ctrl+C', 'Ctrl+V', 'Ctrl+Shift+V', 'Ctrl+A', 'G', 'H', 'F']);
assert.strictEqual(S.label('delete'), 'Delete');
assert.strictEqual(S.label('brushSmaller'), '[');
assert.strictEqual(S.label('toolStamp'), '', 'tools have no key until given one');
assert.strictEqual(S.tip('undo', 'Undo'), 'Undo (Ctrl+Z)');
assert.strictEqual(S.tip('toolStamp', 'Stamp'), 'Stamp', 'no key, no brackets');
assert.deepStrictEqual(D.Ui.splitTip(S.tip('pasteInPlace', 'Paste in Place')), ['Paste in Place', 'Ctrl+Shift+V'], 'the tooltip finds the key');
console.log('✓ the table: unique ids, the old keys, tips the tooltip can read');

// 2. Matching: modifiers exact, letters by name (layouts), the key's position as a fallback.
assert.strictEqual(S.match(key('z', { ctrlKey: true })), 'undo');
assert.strictEqual(S.match(key('Z', { ctrlKey: true, code: 'KeyZ' })), 'undo');
assert.strictEqual(S.match(key('z', { metaKey: true })), 'undo', 'Cmd counts as Ctrl');
assert.strictEqual(S.match(key('z')), null, 'Z alone is not Ctrl+Z');
assert.strictEqual(S.match(key('g', { ctrlKey: true })), null, 'Ctrl+G is not G');
assert.strictEqual(S.match(key('V', { ctrlKey: true, shiftKey: true })), 'pasteInPlace');
assert.strictEqual(S.match(key('v', { ctrlKey: true })), 'paste');
// AZERTY: the key marked Z sits where QWERTY has W. Its letter wins.
assert.strictEqual(S.match(key('z', { ctrlKey: true, code: 'KeyW' })), 'undo');
// A Cyrillic layout gives a letter that names nothing; the key's position is used.
assert.strictEqual(S.match(key('я', { ctrlKey: true, code: 'KeyZ' })), 'undo');
assert.strictEqual(S.match(key('[', { code: 'BracketLeft' })), 'brushSmaller');
assert.strictEqual(S.match(key('?', { shiftKey: true, code: 'Slash' })), 'shortcuts', 'a shifted symbol is read from its key');
assert.strictEqual(S.match(key('Delete')), 'delete');
assert.strictEqual(S.match(key('ArrowLeft')), null, 'arrows are not in the rebindable rows');
console.log('✓ matching: exact modifiers, letters by layout, the key position as a fallback');

// 3. The key handler runs the table's rows while the editor is open.
D.Compat.isTest = () => true;
D.Compat.isNwjs = () => true;
ws.mounted = true;
const ran = [];
D.Undo.undo = () => ran.push('undo');
ws.toggleGrid = () => ran.push('grid');
ws.pasteCopied = inPlace => ran.push(inPlace ? 'pasteInPlace' : 'paste');
ws.setPlacementTool = t => ran.push('tool:' + t);
ws.resizeBrush = () => false;
ws.selectionItems = () => [];
ws.selectedEvent = null;
let e = press(key('z', { ctrlKey: true }));
assert.ok(e.prevented);
press(key('g'));
press(key('V', { ctrlKey: true, shiftKey: true }));
press(key('v', { ctrlKey: true }));
e = press(key('['));
assert.ok(!e.prevented, 'a brush key with no brush to resize is left alone');
assert.deepStrictEqual(ran, ['undo', 'grid', 'pasteInPlace', 'paste']);
ran.length = 0;
press(key('z', { ctrlKey: true, target: { tagName: 'INPUT' } }));
assert.deepStrictEqual(ran, [], 'keys typed in a field stay there');
console.log('✓ the key handler runs rows from the table');

// 4. Rebinding: a free key binds at once; Esc while waiting keeps the old keys; reserved keys are refused.
(async () => {
    await ws.bindShortcut('toolStamp', 'S');
    assert.strictEqual(S.label('toolStamp'), 'S');
    assert.deepStrictEqual(JSON.parse(store['docsDoodads.ui']).shortcuts, { toolStamp: 'S' }, 'kept on this computer');
    press(key('s'));
    assert.deepStrictEqual(ran, ['tool:stamp'], 'the new key works');
    ran.length = 0;
    assert.ok(S.isChanged('toolStamp') && !S.isChanged('undo'));

    // A default put back is stored as no change.
    await ws.bindShortcut('undo', 'Ctrl+U');
    assert.strictEqual(S.match(key('z', { ctrlKey: true })), null, 'Ctrl+Z is free now');
    assert.strictEqual(S.match(key('u', { ctrlKey: true })), 'undo');
    await ws.bindShortcut('undo', 'Ctrl+Z');
    assert.ok(!('undo' in S.overrides()));

    // Reserved: the editor key, Esc and the arrows.
    toasts.length = 0;
    assert.strictEqual(await ws.bindShortcut('grid', 'F10'), false);
    assert.strictEqual(await ws.bindShortcut('grid', 'Escape'), false);
    assert.strictEqual(await ws.bindShortcut('grid', 'ArrowUp'), false);
    assert.strictEqual(S.label('grid'), 'G');
    assert.strictEqual(toasts.length, 3);
    assert.ok(/editor/.test(toasts[0][0]) && toasts[0][1] === 'error', toasts[0][0]);

    // A key in use asks; yes moves it (the other row has no key), no keeps both as they were.
    let asked = null;
    D.Ui.confirm = text => { asked = text; return Promise.resolve(false); };
    assert.strictEqual(await ws.bindShortcut('toolPath', 'G'), false);
    assert.ok(/Show or hide the grid/.test(asked), asked);
    assert.strictEqual(S.label('grid'), 'G');
    assert.strictEqual(S.label('toolPath'), '');
    D.Ui.confirm = () => Promise.resolve(true);
    assert.strictEqual(await ws.bindShortcut('toolPath', 'G'), true);
    assert.strictEqual(S.label('toolPath'), 'G');
    assert.strictEqual(S.label('grid'), '', 'the grid lost its key');
    assert.strictEqual(S.match(key('g')), 'toolPath');
    console.log('✓ rebinding: free keys bind, reserved keys refused, a key in use asks before it moves');

    // 5. The card: every row, keys as buttons, fixed rows plain, Reset All.
    const card = ws.showShortcutsCard();
    for (const s of S.list) assert.ok(card.innerHTML.includes(s.label.replace(/&/g, '&amp;')), s.label);
    assert.ok(card.innerHTML.includes('data-keys="toolStamp"') && !card.innerHTML.includes('data-keys="nudge"'), 'fixed rows have no button');
    assert.ok(/dd-keys-changed[^>]*>Stamp tool/.test(card.innerHTML), 'changed rows stand out');
    assert.ok(card.innerHTML.includes('Open or close the editor') && card.innerHTML.includes('>F10<'));

    // Capturing: the next key press is the binding and reaches nothing else.
    ws.startShortcutCapture('toolGrab', null);
    assert.ok(ws.capturingShortcut());
    press(key('g'));
    assert.deepStrictEqual(ran, [], 'the editor ignores keys while a binding is being made');
    const lone = key('Control', { ctrlKey: true, code: 'ControlLeft' });
    docListeners.forEach(fn => fn(lone));
    assert.ok(ws.capturingShortcut(), 'Ctrl on its own waits for the rest');
    docListeners.slice().forEach(fn => fn(key('e', { ctrlKey: true, code: 'KeyE' })));
    await Promise.resolve();
    assert.ok(!ws.capturingShortcut());
    assert.strictEqual(S.label('toolGrab'), 'Ctrl+E');
    ws.startShortcutCapture('toolGrab', null);
    docListeners.slice().forEach(fn => fn(key('Escape', { code: 'Escape' })));
    assert.strictEqual(S.label('toolGrab'), 'Ctrl+E', 'Esc keeps the keys');
    assert.strictEqual(docListeners.length, 0, 'the listener is gone');

    // Tooltips follow a change.
    const stamp = makeNode('button'); stamp.id = 'dd-stamp-btn'; stamp.setAttribute('data-dd-tip', 'old');
    const undoBtn = makeNode('button'); undoBtn.id = 'dd-undo-btn';
    ws.refreshShortcutTips();
    assert.strictEqual(stamp.getAttribute('data-dd-tip'), 'Stamp: click the map to place the picked item again and again (S)');
    assert.strictEqual(undoBtn.title, 'Undo (Ctrl+Z)');
    assert.strictEqual(ws.shortcutTip('dd-select-btn'), 'Select: click things on the map to change them, drag to move (Esc)', 'Select keeps Esc');

    // The palette shows the user's keys.
    ws.mapEntries = () => [];
    const commands = ws.paletteCommands();
    assert.strictEqual(commands.find(c => c.label === 'Tool: Stamp').keys, 'S');
    assert.strictEqual(commands.find(c => c.label === 'Toggle Grid').keys, undefined);
    assert.ok(commands.some(c => /^Keyboard Shortcuts/.test(c.label)));

    S.resetAll();
    assert.deepStrictEqual(S.overrides(), {});
    assert.strictEqual(S.label('grid'), 'G');
    console.log('✓ card, capture, tooltips and palette follow the table');

    // 6. The guide's table is written from the same defaults (npm run shortcuts).
    const guide = require('fs').readFileSync(require('path').join(__dirname, '..', 'Docs_Doodads_Guide.md'), 'utf8').replace(/\r\n/g, '\n');
    assert.ok(guide.includes(S.markdown()), 'the guide matches the table: run npm run shortcuts');
    assert.ok(!/48px Tile Grid|pointer tool|Slicer Modal/.test(guide.slice(guide.indexOf('## 23.'))), 'the old names are gone from the cheat sheet');
    console.log('✓ the guide\'s cheat sheet matches the table');

    console.log('=== Shortcut table passed ===');
})().catch(err => { console.error(err); process.exit(1); });
