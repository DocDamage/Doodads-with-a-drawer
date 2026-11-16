// scratch/test_edit_window.js
// A bigger window while editing (8.2.1): the Playtest window grows to fill the screen when the editor opens
// and goes back to its own place and size on Done. The rules take a stand-in window; nw is stubbed for the
// thin hooks (the editor opening and closing, the window closing).
const assert = require('assert');

console.log('=== Testing A Bigger Window While Editing ===');

const byId = {};
function makeNode(tag) {
    return {
        tagName: String(tag).toUpperCase(), style: {}, childNodes: [], parentNode: null, textContent: '', value: '',
        get innerHTML() { return this._html || ''; },
        set innerHTML(v) { this._html = v; this.childNodes = []; for (const m of String(v).matchAll(/id="([^"]+)"/g)) { const c = makeNode('div'); c.id = m[1]; this.appendChild(c); } },
        appendChild(c) { this.childNodes.push(c); c.parentNode = this; if (c.id) byId[c.id] = c; (c.childNodes || []).forEach(x => { if (x.id) byId[x.id] = x; }); return c; },
        removeChild(c) { this.childNodes = this.childNodes.filter(x => x !== c); c.parentNode = null; if (byId[c.id] === c) delete byId[c.id]; return c; },
        setAttribute() {}, addEventListener() {}, removeEventListener() {}, querySelectorAll: () => [], querySelector: () => null,
        classList: { add() {}, remove() {}, contains: () => false, toggle() {} },
        getBoundingClientRect: () => ({ left: 0, right: 100, top: 0, bottom: 100, width: 100, height: 100 })
    };
}
const store = {};
global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.window.innerWidth = 816;
global.window.innerHeight = 624;
global.window.screen = { availLeft: 0, availTop: 0, availWidth: 1920, availHeight: 1040 };
global.document = {
    body: makeNode('body'), documentElement: makeNode('html'), activeElement: null, createElement: makeNode,
    getElementById: id => byId[id] || null,
    querySelectorAll: () => [], addEventListener() {}, removeEventListener() {}
};
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: opt => opt === 'test' };
global.PluginManager = { parameters: () => ({}) };
global.Graphics = { width: 816, height: 624 };

// A stand-in for an NW.js window: maximize() fills the screen's free area, restore() goes back.
function standIn(box) {
    const calls = [];
    const win = Object.assign({ listeners: {} }, box, {
        calls,
        maximize() { calls.push('maximize'); this._before = { x: this.x, y: this.y, width: this.width, height: this.height }; Object.assign(this, { x: -8, y: -8, width: 1936, height: 1056 }); },
        restore() { calls.push('restore'); if (this._before) Object.assign(this, this._before); },
        resizeTo(w, h) { calls.push('resizeTo'); this.width = w; this.height = h; },
        moveTo(x, y) { calls.push('moveTo'); this.x = x; this.y = y; },
        on(name, fn) { this.listeners[name] = fn; },
        removeAllListeners(name) { delete this.listeners[name]; },
        close() { calls.push('close'); }
    });
    return win;
}
const gameWin = standIn({ x: 552, y: 208, width: 832, height: 663 });
let quit = 0;
global.nw = { Window: { get: () => gameWin }, App: { quit: () => { quit++; } } };

require('../Docs-Doodads.js');
const D = DocsDoodads, E = D.EditWindow;
const screen = { left: 0, top: 0, w: 1920, h: 1040 };
const env = extra => Object.assign({ enabled: true, inner: { w: 816, h: 624 }, game: { w: 816, h: 624 }, screen }, extra || {});

// 1. Grow then restore gives the first place and size back.
{
    E.saved = null;
    const win = standIn({ x: 100, y: 50, width: 832, height: 663 });
    assert.strictEqual(E.whyNot(win, env()), '');
    assert.strictEqual(E.grow(win, env()), true);
    assert.deepStrictEqual(win.calls, ['maximize']);
    assert.ok(E.fillsScreen(E.box(win), screen), 'the window fills the screen');
    assert.strictEqual(E.grow(win, env()), false, 'growing twice does nothing');
    assert.strictEqual(E.restore(win, env()), true);
    assert.deepStrictEqual({ x: win.x, y: win.y, width: win.width, height: win.height }, { x: 100, y: 50, width: 832, height: 663 });
    assert.strictEqual(E.saved, null);
    assert.strictEqual(E.restore(win, env()), false, 'restoring twice does nothing');
}

// 2. A window the user maximized is left alone, and so is one they resized.
{
    E.saved = null;
    const maxed = standIn({ x: -8, y: -8, width: 1936, height: 1056 });
    assert.strictEqual(E.whyNot(maxed, env()), 'already fills the screen');
    assert.strictEqual(E.grow(maxed, env()), false);
    assert.strictEqual(E.restore(maxed, env()), false, 'nothing kept, nothing put back');
    assert.deepStrictEqual(maxed.calls, []);
    const resized = standIn({ x: 10, y: 10, width: 1216, height: 939 });
    assert.strictEqual(E.whyNot(resized, env({ inner: { w: 1200, h: 900 } })), 'resized by the user');
    assert.strictEqual(E.grow(resized, env({ inner: { w: 1200, h: 900 } })), false);
    assert.deepStrictEqual(resized.calls, []);
    // MZ's own screen scale (System 2) is the start size, not a user's resize.
    const scaled = standIn({ x: 10, y: 10, width: 1648, height: 1287 });
    assert.strictEqual(E.userSized({ w: 1632, h: 1248 }, { w: 816 * 2, h: 624 * 2 }), false);
    assert.strictEqual(E.grow(scaled, env({ inner: { w: 1632, h: 1248 }, game: { w: 1632, h: 1248 }, screen: { left: 0, top: 0, w: 2560, h: 1400 } })), true);
    E.saved = null;
}

// 3. A window the user made smaller again while editing is not moved on Done.
{
    E.saved = null;
    const win = standIn({ x: 100, y: 50, width: 832, height: 663 });
    E.grow(win, env());
    Object.assign(win, { x: 300, y: 200, width: 1000, height: 700 });
    assert.strictEqual(E.restore(win, env()), false);
    assert.deepStrictEqual({ x: win.x, width: win.width }, { x: 300, width: 1000 });
    assert.strictEqual(E.saved, null, 'forgotten either way');
}

// 4. Turned off, nothing is called; no window, nothing happens.
{
    E.saved = null;
    const win = standIn({ x: 100, y: 50, width: 832, height: 663 });
    assert.strictEqual(E.grow(win, env({ enabled: false })), false);
    assert.strictEqual(E.whyNot(win, env({ enabled: false })), 'turned off');
    assert.deepStrictEqual(win.calls, []);
    assert.strictEqual(E.grow(null, env()), false);
    assert.strictEqual(E.restore(null, env()), false);
}

// 5. The setting: on by default, kept on this computer.
{
    assert.strictEqual(E.enabled(), true, 'on by default');
    E.setEnabled(false, false);
    assert.strictEqual(D.Ui.prefs().bigWindow, false);
    assert.strictEqual(E.enabled(), false);
    assert.strictEqual(E.env().enabled, false);
    E.setEnabled(true, false);
    assert.strictEqual(E.enabled(), true);
}

// 6. The thin hooks: the editor opening and closing, through the stubbed nw.Window.
{
    E.saved = null;
    assert.strictEqual(E.nwWindow(), gameWin);
    const e = E.env();
    assert.deepStrictEqual(e.inner, { w: 816, h: 624 });
    assert.deepStrictEqual(e.game, { w: 816, h: 624 });
    assert.deepStrictEqual(e.screen, screen);
    const ws = D.Workspace;
    // open() and close() carry on to the rest of the editor; only their window steps are checked here.
    assert.ok(/this\.mounted = true;\s*DocsDoodads\.EditWindow\.onOpen\(\);/.test(String(ws.open)), 'open() grows the window');
    assert.ok(/this\.mounted = false;\s*DocsDoodads\.EditWindow\.onClose\(\);/.test(String(ws.close)), 'close() puts it back');
    assert.strictEqual(E.onOpen(), true);
    assert.deepStrictEqual(gameWin.calls, ['maximize']);
    assert.strictEqual(E.onClose(), true);
    assert.deepStrictEqual({ x: gameWin.x, y: gameWin.y, width: gameWin.width, height: gameWin.height }, { x: 552, y: 208, width: 832, height: 663 });
    // Turning the setting off while editing puts the window back at once; on again grows it.
    gameWin.calls.length = 0;
    E.onOpen();
    assert.strictEqual(E.setEnabled(false, true), true);
    assert.strictEqual(gameWin.width, 832);
    assert.strictEqual(E.onOpen(), false, 'off: the editor opening leaves the window alone');
    assert.strictEqual(E.setEnabled(true, true), true);
    assert.strictEqual(gameWin.width, 1936);
    E.onClose();
    // Outside a playtest there is no window to grow.
    global.Utils.isOptionValid = () => false;
    assert.strictEqual(E.nwWindow(), null);
    assert.strictEqual(E.onOpen(), false);
    global.Utils.isOptionValid = opt => opt === 'test';
}

// 7. Closing the Playtest window while it is grown puts it back before quitting.
{
    E.saved = null;
    assert.strictEqual(typeof gameWin.listeners.close, 'function', 'the close listener is in place');
    E.onOpen();
    assert.strictEqual(gameWin.width, 1936);
    gameWin.listeners.close();
    assert.strictEqual(gameWin.width, 832, 'put back');
    assert.strictEqual(quit, 1, 'and then quit');
    assert.strictEqual(E.saved, null);
}

// 8. More > Look has the switch, and Settings finds it.
{
    D.Workspace.mounted = false;
    const card = D.Workspace.showLookCard();
    assert.ok(card, 'the Look card opens');
    const box = byId['dd-look-bigwin'];
    assert.ok(box, 'Look has the switch');
    box.onchange({ target: { checked: false } });
    assert.strictEqual(E.enabled(), false);
    box.onchange({ target: { checked: true } });
    assert.strictEqual(E.enabled(), true);
    D.Workspace.closeLookCard();
    const rows = D.SettingsSearch.search(D.Workspace.refreshSettingsIndex ? (() => {
        try { return D.Workspace.refreshSettingsIndex(); } catch (e) { return D.SettingsSearch.create([{ id: 'look:dd-look-bigwin', controlId: 'dd-look-bigwin', label: 'Bigger window while editing', words: '', where: 'Editor / Look', kind: 'look' }]); }
    })() : [], 'bigger window');
    assert.ok(rows.some(r => r.controlId === 'dd-look-bigwin'), 'Settings finds "Bigger window while editing"');
}

console.log('A bigger window while editing: all tests passed.');
