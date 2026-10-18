// scratch/test_dialogs.js
// The editor's question cards (no browser prompt, confirm or alert left), asking before unsaved work is
// lost (Done, the toggle key, closing or reloading the window), the Save button's unsaved dot and
// "Saved" flash, and the clearer destructive confirmations (layers, the save conflict).
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== Testing Dialogs and Unsaved Work ===');

// A small DOM: nodes with parents, classes and focus; key listeners on the document by phase.
const docListeners = [];
const winListeners = [];
function makeNode(tag) {
    const classes = new Set();
    const n = {
        tagName: String(tag).toUpperCase(), style: {}, childNodes: [], parentNode: null, attrs: {}, value: '', checked: false,
        textContent: '', innerHTML: '', onclick: null, isConnected: true,
        get className() { return Array.from(classes).join(' '); },
        set className(v) { classes.clear(); String(v).split(/\s+/).filter(Boolean).forEach(c => classes.add(c)); },
        classList: {
            add: c => classes.add(c), remove: c => classes.delete(c), contains: c => classes.has(c),
            toggle: (c, on) => { const want = on === undefined ? !classes.has(c) : Boolean(on); if (want) classes.add(c); else classes.delete(c); return want; }
        },
        appendChild(c) { this.childNodes.push(c); c.parentNode = this; return c; },
        removeChild(c) { this.childNodes = this.childNodes.filter(x => x !== c); c.parentNode = null; return c; },
        setAttribute(k, v) { this.attrs[k] = String(v); },
        focus() { global.document.activeElement = this; },
        select() { this.selected = true; },
        querySelector(sel) { return find(this, x => x.tagName === sel.toUpperCase()); },
        querySelectorAll: () => [], addEventListener() {}, removeEventListener() {}, contains: () => false
    };
    return n;
}
function find(root, test) {
    for (const c of root.childNodes || []) {
        if (test(c)) return c;
        const deeper = find(c, test);
        if (deeper) return deeper;
    }
    return null;
}
const byId = {};
const body = makeNode('body');
global.window = global;
global.window.addEventListener = (type, fn) => winListeners.push({ type, fn });
global.window.removeEventListener = () => {};
global.document = {
    body, activeElement: null,
    createElement: makeNode,
    getElementById: id => byId[id] || find(body, n => n.id === id),
    querySelectorAll: () => [],
    addEventListener: (type, fn, capture) => docListeners.push({ type, fn, capture: Boolean(capture) }),
    removeEventListener: (type, fn, capture) => {
        const i = docListeners.findIndex(l => l.type === type && l.fn === fn && l.capture === Boolean(capture));
        if (i >= 0) docListeners.splice(i, 1);
    }
};
// Presses a key the way the browser would: document capture listeners, then window bubble listeners.
function press(key, target, extra) {
    let stopped = false, prevented = false;
    const e = Object.assign({ key, code: key, target: target || body, stopPropagation() { stopped = true; }, preventDefault() { prevented = true; } }, extra);
    for (const l of docListeners.filter(x => x.type === 'keydown' && x.capture)) { l.fn(e); if (stopped) return { stopped, prevented }; }
    for (const l of winListeners.filter(x => x.type === 'keydown')) l.fn(e);
    return { stopped, prevented };
}
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: opt => opt === 'test' };
global.PluginManager = { parameters: () => ({}) };
let reloads = 0;
global.SceneManager = { reloadGame() { reloads++; } };
const nwHandlers = {};
let windowClosed = 0;
// MZ's main.js already quits on 'close'; the plugin takes that listener over.
nwHandlers.close = () => { throw new Error("MZ's quit-at-once listener should be replaced"); };
global.nw = {
    App: { quit: () => { windowClosed++; } },
    Window: { get: () => ({ on: (type, fn) => { nwHandlers[type] = fn; }, removeAllListeners: type => { delete nwHandlers[type]; } }) }
};
const located = [];
const liveEvent = { x: 7, y: 7, eventId: () => 3, locate(x, y) { this.x = x; this.y = y; located.push([x, y]); } };
global.$gameMap = { mapId: () => 1, displayX: () => 0, displayY: () => 0, tileWidth: () => 48, tileHeight: () => 48, width: () => 20, height: () => 15,
    isLoopHorizontal: () => false, isLoopVertical: () => false, events: () => [liveEvent] };
global.$dataDocsDoodads = { 1: [] };

require('../Docs-Doodads.js');
const D = DocsDoodads, U = D.Ui, ws = D.Workspace, P = D.Persistence;
const toasts = [];
ws.showToast = (msg, kind) => toasts.push([msg, kind]);
ws.refreshSpriteset = () => {};
const tick = () => new Promise(r => setImmediate(r));

(async () => {
    // 1. No browser dialogs are left in the plugin (they ignore the look, Esc and small windows).
    const source = fs.readFileSync(path.join(__dirname, '..', 'Docs-Doodads.js'), 'utf8');
    const calls = source.split('\n').filter(line => /(^|[^.\w])(prompt|confirm|alert)\s*\(/.test(line) && !/^\s*(prompt|confirm|alert)\(text/.test(line));
    assert.deepStrictEqual(calls, [], 'no prompt(), confirm() or alert() calls');
    console.log('✓ no browser prompt, confirm or alert left');

    // 2. A card: title and text as plain text (names can't inject markup), fields, buttons; Enter answers
    // with the main button, Esc cancels, the first field has focus, keys don't reach the editor.
    let p = U.form({ title: 'Name <b>it</b>', text: 'Type <i>here</i>', fields: [{ key: 'name', value: 'Oak' }, { key: 'events', type: 'checkbox', value: true, label: 'Events' }] });
    const overlay = document.getElementById('dd-dialog-overlay');
    assert.ok(overlay && overlay.parentNode === body, 'the card is on the page');
    assert.ok(U.dialogOpen());
    const card = document.getElementById('dd-dialog');
    assert.strictEqual(card.attrs.role, 'dialog');
    assert.strictEqual(card.attrs['aria-modal'], 'true');
    const title = document.getElementById('dd-dialog-title');
    assert.strictEqual(title.childNodes[0].textContent, 'Name <b>it</b>', 'the title is text, not markup');
    assert.strictEqual(document.getElementById('dd-dialog-text').textContent, 'Type <i>here</i>');
    const nameInput = document.getElementById('dd-dialog-field-0');
    assert.strictEqual(document.activeElement, nameInput, 'the first field has focus');
    assert.ok(nameInput.selected, 'and its text is selected to type over');
    nameInput.value = 'Pine';
    let keys = 0;
    winListeners.push({ type: 'keydown', fn: () => keys++ });
    const r = press('Enter', nameInput);
    assert.ok(r.stopped && r.prevented, 'Enter is taken by the card');
    assert.strictEqual(keys, 0, 'the editor does not see the key');
    assert.deepStrictEqual(await p, { name: 'Pine', events: true });
    assert.ok(!U.dialogOpen() && !overlay.parentNode, 'the card is gone');
    assert.strictEqual(docListeners.filter(l => l.type === 'keydown').length, 0, 'its key listener is removed');
    winListeners.pop();

    p = U.prompt('Name?', 'x');
    press('Escape');
    assert.strictEqual(await p, null, 'Esc cancels a prompt');
    p = U.confirm('Sure?');
    press('Escape');
    assert.strictEqual(await p, false, 'Esc is No');
    p = U.confirm('Delete it?', { danger: true, ok: 'Delete' });
    const dangerCard = document.getElementById('dd-dialog');
    assert.ok(dangerCard.classList.contains('dd-dialog-danger'), 'a danger question is marked');
    assert.strictEqual(dangerCard.attrs.role, 'alertdialog');
    const buttons = U._dialog.buttons;
    assert.deepStrictEqual(buttons.map(b => b.textContent), ['Cancel', 'Delete']);
    assert.ok(buttons[1].classList.contains('dd-btn-danger'), 'with a red button');
    assert.strictEqual(document.activeElement, buttons[1]);
    buttons[1].onclick();
    assert.strictEqual(await p, true);
    // Enter on a focused button is the button's own (the browser clicks it): the card doesn't answer.
    p = U.confirm('Sure?');
    const enterOnCancel = press('Enter', Object.assign(U._dialog.buttons[0], { tagName: 'BUTTON' }));
    assert.ok(!enterOnCancel.prevented && U.dialogOpen());
    U._dialog.buttons[0].onclick();
    assert.strictEqual(await p, false);
    // A click on the dimmed page outside the card cancels.
    p = U.choose('Pick', [{ label: 'A', value: 'a' }, { label: 'B', value: 'b', main: true }], { cancelValue: 'none' });
    const ov = document.getElementById('dd-dialog-overlay');
    ov.onclick({ target: ov });
    assert.strictEqual(await p, 'none');
    // One card at a time: a new one cancels the old.
    const first = U.confirm('First?');
    const second = U.prompt('Second?', 'two');
    assert.strictEqual(await first, false, 'the first card was cancelled');
    press('Enter', document.getElementById('dd-dialog-field-0'));
    assert.strictEqual(await second, 'two');
    // A select field and text suggestions.
    p = U.form({ fields: [{ key: 't', type: 'select', value: 'door', options: [{ value: 'npc', label: 'NPC' }, { value: 'door', label: 'Door' }] },
        { key: 'c', choices: ['Interaction', 'Custom'] }] });
    const sel = document.getElementById('dd-dialog-field-0');
    assert.strictEqual(sel.tagName, 'SELECT');
    assert.deepStrictEqual(sel.childNodes.map(o => [o.value, o.textContent]), [['npc', 'NPC'], ['door', 'Door']]);
    assert.strictEqual(sel.value, 'door');
    assert.strictEqual(document.getElementById('dd-dialog-field-1').attrs.list, 'dd-dialog-field-1-choices');
    press('Enter');
    assert.deepStrictEqual(await p, { t: 'door', c: '' });
    // Tab stays inside the card.
    p = U.confirm('Tab?');
    const [cancelBtn, okBtn] = U._dialog.buttons;
    assert.strictEqual(document.activeElement, okBtn);
    press('Tab', okBtn);
    assert.strictEqual(document.activeElement, cancelBtn, 'Tab wraps to the first button');
    press('Tab', cancelBtn, { shiftKey: true });
    assert.strictEqual(document.activeElement, okBtn, 'Shift+Tab wraps back');
    press('Escape');
    await p;
    // An alert resolves on OK; with the editor closed the card brings the theme with it.
    p = U.alert('Done.');
    assert.ok(document.getElementById('dd-dialog-overlay').childNodes.some(n => n.tagName === 'STYLE' && /dd-dialog/.test(n.textContent)), 'the card carries the theme');
    press('Enter');
    assert.strictEqual(await p, undefined);
    console.log('✓ question cards: plain text, focus, Enter, Esc, outside click, one at a time, fields, Tab, danger styling');

    // 3. The Save button: dirty flags show a dot (whoever sets them), a save flashes "Saved".
    const saveBtn = makeNode('button');
    saveBtn.id = 'dd-save-btn';
    saveBtn.appendChild(Object.assign(makeNode('b'), { textContent: 'Save' }));
    byId['dd-save-btn'] = saveBtn;
    ws.mounted = true;
    P.dirtyDoodads = false;
    P.dirtyMap = false;
    assert.ok(!saveBtn.classList.contains('dd-unsaved'));
    P.dirtyDoodads = true;
    assert.ok(saveBtn.classList.contains('dd-unsaved'), 'an edit shows the dot');
    assert.ok(/not saved/.test(saveBtn.title));
    assert.strictEqual(P.hasUnsavedWork(), true);
    P.dirtyDoodads = false;
    P.dirtyMap = true;
    assert.ok(saveBtn.classList.contains('dd-unsaved'), 'event edits count too');
    P.dirtyMap = false;
    assert.ok(!saveBtn.classList.contains('dd-unsaved'));
    ws.updateSaveState(true);
    assert.ok(saveBtn.classList.contains('dd-just-saved'));
    assert.strictEqual(saveBtn.querySelector('b').textContent, 'Saved');
    await new Promise(r => setTimeout(r, 1700));
    assert.ok(!saveBtn.classList.contains('dd-just-saved'));
    assert.strictEqual(saveBtn.querySelector('b').textContent, 'Save');
    // Undo steps go through markDirty, which goes through the same flag.
    D.Undo.markDirty();
    assert.ok(saveBtn.classList.contains('dd-unsaved'));
    console.log('✓ save button: unsaved dot from any edit, "Saved" after a save');

    // 4. Done and the toggle key: nothing unsaved closes at once; otherwise Keep Editing, Save or Don't Save.
    let closed = 0;
    const realClose = ws.close;
    ws.close = function() { closed++; this.mounted = false; };
    P.dirtyDoodads = false;
    assert.strictEqual(await ws.requestClose(), true, 'clean: closes without asking');
    assert.strictEqual(closed, 1);
    ws.mounted = true;
    P.dirtyDoodads = true;
    let req = ws.toggle();
    assert.ok(U.dialogOpen(), 'the toggle key asks');
    assert.deepStrictEqual(U._dialog.buttons.map(b => b.textContent), ['Keep Editing', "Don't Save", 'Save']);
    press('Escape');
    assert.strictEqual(await req, false, 'Keep Editing stays');
    assert.ok(ws.mounted && closed === 1);
    // Save: closes only if the save worked.
    const realSaveAll = P.saveAll;
    let saveResult = false;
    P.saveAll = () => { if (saveResult) P.dirtyDoodads = false; return saveResult; };
    req = ws.requestClose();
    press('Enter');
    assert.strictEqual(await req, false, 'a failed save (or a conflict) keeps the editor open');
    saveResult = true;
    req = ws.requestClose();
    press('Enter');
    assert.strictEqual(await req, true, 'Enter is Save');
    assert.strictEqual(closed, 2);
    // Don't Save: the work goes back to what is on disk, including moved events and the crash snapshot.
    ws.mounted = true;
    const realRead = D.FS.readJson;
    D.FS.readJson = file => file === 'data/DocsDoodads.json' ? { 1: [{ id: 'saved' }] }
        : /Map001/.test(file) ? { events: [null, null, null, { id: 3, x: 2, y: 4 }] } : null;
    let recoveryCleared = 0;
    const realClear = P.clearRecovery;
    P.clearRecovery = () => { recoveryCleared++; };
    $dataDocsDoodads[1].push({ id: 'unsaved' });
    P.dirtyMap = true;
    $gameMap._stagedMapData = { events: [] };
    P.stagedMaps = { 5: { events: [] } };
    D.Undo.undoStack.push({ apply() {}, revert() {} });
    req = ws.requestClose();
    U._dialog.buttons[1].onclick();
    assert.strictEqual(await req, true);
    assert.deepStrictEqual($dataDocsDoodads[1].map(d => d.id), ['saved'], 'doodads read again from disk');
    assert.deepStrictEqual(located, [[2, 4]], 'a moved event goes back to its saved tile');
    assert.strictEqual($gameMap._stagedMapData, null);
    assert.deepStrictEqual(P.stagedMaps, {});
    assert.strictEqual(D.Undo.undoStack.length, 0, 'undo steps for thrown-away work are gone');
    assert.strictEqual(P.hasUnsavedWork(), false);
    assert.strictEqual(recoveryCleared, 1, 'no recovery offer for work the user threw away');
    assert.strictEqual(closed, 3);
    console.log("✓ closing the editor: Keep Editing, Save (only if it worked), Don't Save puts the saved work back");

    // 5. Closing or reloading the Playtest window: asks only with unsaved work, never traps the window.
    assert.strictEqual(typeof nwHandlers.close, 'function', 'the window close is watched');
    nwHandlers.close();
    assert.strictEqual(windowClosed, 1, 'clean: closes at once');
    P.dirtyDoodads = true;
    nwHandlers.close();
    assert.ok(U.dialogOpen());
    nwHandlers.close();
    press('Escape');
    await tick();
    assert.strictEqual(windowClosed, 1, 'Keep Editing keeps the window (and a second click while asking asks once)');
    nwHandlers.close();
    U._dialog.buttons[1].onclick();
    await tick();
    assert.strictEqual(windowClosed, 2, "Don't Save closes");
    assert.strictEqual(recoveryCleared, 2);
    // F5 (SceneManager.reloadGame) asks the same way.
    P.dirtyDoodads = true;
    SceneManager.reloadGame();
    assert.strictEqual(reloads, 0);
    press('Enter');
    await tick();
    assert.strictEqual(reloads, 1, 'Save then reload');
    SceneManager.reloadGame();
    assert.strictEqual(reloads, 2, 'clean: reloads at once');
    // If asking fails, the window closes rather than staying stuck open.
    P.dirtyDoodads = true;
    const realConfirmLeave = ws.confirmLeave;
    ws.confirmLeave = () => { throw new Error('no page'); };
    nwHandlers.close();
    await tick();
    assert.strictEqual(windowClosed, 3);
    ws.confirmLeave = () => Promise.reject(new Error('lost'));
    nwHandlers.close();
    await tick(); await tick();
    assert.strictEqual(windowClosed, 4);
    ws.confirmLeave = realConfirmLeave;
    P.dirtyDoodads = false;
    console.log('✓ closing or reloading the window: asks with unsaved work, never trapped open');

    // 6. Editor shortcuts wait while a card is open.
    ws.mounted = true;
    let undone = 0;
    const realUndo = D.Undo.undo;
    D.Undo.undo = () => { undone++; };
    // Straight to the window listener, as if the card's own listener weren't there.
    const editorKeys = winListeners.find(l => l.type === 'keydown').fn;
    editorKeys({ key: 'z', code: 'KeyZ', ctrlKey: true, target: body, preventDefault() {} });
    assert.strictEqual(undone, 1);
    p = U.confirm('Wait');
    editorKeys({ key: 'z', code: 'KeyZ', ctrlKey: true, target: body, preventDefault() {} });
    assert.strictEqual(undone, 1, 'no undo behind a card');
    press('Escape');
    await p;
    D.Undo.undo = realUndo;
    console.log('✓ editor shortcuts wait for the card');

    // 7. Deleting a layer with doodads on it asks, with a red button; an empty layer goes at once.
    D.Undo.clear();
    let asked = null;
    U.confirm = async (text, opts) => { asked = { text, opts }; return false; };
    const deleted = [];
    ws.deleteLayer = id => deleted.push(id);
    ws.refreshInspector = () => {};
    ws.currentMapId = () => 1;
    $dataDocsDoodads[1] = [{ layer: 'top' }, { layer: 'top' }, {}];
    const layerBtn = Object.assign(makeNode('button'), { id: 'dd-layer-del-1' });
    byId['dd-layer-del-1'] = layerBtn;
    const emptyBtn = Object.assign(makeNode('button'), { id: 'dd-layer-del-2' });
    byId['dd-layer-del-2'] = emptyBtn;
    const layerSettings = { layers: [{ id: 'top', name: 'Top' }, { id: 'empty', name: 'Empty' }] };
    ws.bindLayersPanel(layerSettings);
    assert.deepStrictEqual(D.Layers.list(layerSettings).map(l => l.id), ['main', 'top', 'empty']);
    await layerBtn.onclick();
    assert.ok(asked && /"Top"/.test(asked.text) && /2 doodad\(s\)/.test(asked.text) && asked.opts.danger, 'a plain sentence and a red button');
    assert.deepStrictEqual(deleted, [], 'No keeps the layer');
    asked = null;
    await emptyBtn.onclick();
    assert.strictEqual(asked, null, 'an empty layer is not asked about');
    assert.deepStrictEqual(deleted, ['empty']);
    U.confirm = async () => true;
    await layerBtn.onclick();
    assert.deepStrictEqual(deleted, ['empty', 'top'], 'Yes deletes it');
    console.log('✓ deleting a layer with doodads asks first');

    // 8. The save conflict: Esc is "Don't Save Yet"; the red button saves over MZ's changes.
    const forced = [];
    P.saveAll = force => { forced.push(force); return true; };
    p = ws.showConflictModal();
    assert.ok(document.getElementById('dd-dialog').classList.contains('dd-dialog-danger'));
    assert.ok(document.getElementById('dd-dialog').classList.contains('dd-dialog-stack'), 'long answers stack');
    press('Escape');
    assert.strictEqual(await p, null);
    assert.deepStrictEqual(forced, []);
    p = ws.showConflictModal();
    const force = U._dialog.buttons[2];
    assert.ok(force.classList.contains('dd-btn-danger'));
    force.onclick();
    assert.strictEqual(await p, 'force');
    assert.deepStrictEqual(forced, [true]);
    D.FS.stat = () => ({ mtimeMs: 1, size: 1 });
    P.dirtyMap = true;
    $gameMap._stagedMapData = { events: [] };
    p = ws.showConflictModal();
    U._dialog.buttons[1].onclick();
    assert.strictEqual(await p, 'reload');
    assert.strictEqual(P.dirtyMap, false);
    assert.strictEqual($gameMap._stagedMapData, null);
    console.log("✓ save conflict: Don't Save Yet, MZ's version, or the red Save Mine Anyway");

    ws.close = realClose;
    P.saveAll = realSaveAll;
    P.clearRecovery = realClear;
    D.FS.readJson = realRead;
    console.log('=== Dialogs and unsaved work passed ===');
})().catch(e => { console.error(e); process.exit(1); });
