'use strict';
// 7.2.5 Panels in their own window (logic only; the real NW.js window is a manual check): the panel moves into the
// new window and lookups by id still find it; keys there reach the editor except while typing; the game does not
// pause while it has focus; closing it, Dock Back or closing the editor put it back where it was, with its place
// kept; without NW.js it says so.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const E = require('./engine/fake_engine');

process.chdir(fs.mkdtempSync(path.join(os.tmpdir(), 'dd-popout-')));
E.install();
E.setupWorld({ width: 10, height: 10 });
// A tiny DOM: elements with parents and ids, two documents.
class El {
    constructor(doc, id) { this.ownerDocument = doc; this.id = id; this.children = []; this.parentNode = null; this.style = { cssText: 'left:10px' }; }
    appendChild(c) { if (c.parentNode) c.parentNode.removeChild(c); c.parentNode = this; this.children.push(c); return c; }
    insertBefore(c, ref) { if (c.parentNode) c.parentNode.removeChild(c); c.parentNode = this; this.children.splice(this.children.indexOf(ref), 0, c); return c; }
    removeChild(c) { this.children.splice(this.children.indexOf(c), 1); c.parentNode = null; return c; }
    get nextSibling() { const s = this.parentNode && this.parentNode.children; return s ? s[s.indexOf(this) + 1] || null : null; }
}
const makeDoc = () => {
    const doc = { listeners: {}, focused: false };
    doc.body = new El(doc, 'body'); doc.head = new El(doc, 'head'); doc.documentElement = new El(doc, 'html');
    doc.documentElement.getAttribute = () => null; doc.documentElement.setAttribute = () => {};
    const find = (n, id) => (n.id === id ? n : n.children.reduce((a, c) => a || find(c, id), null));
    doc.getElementById = id => find(doc.body, id);
    doc.adoptNode = n => { if (n.parentNode) n.parentNode.removeChild(n); n.ownerDocument = doc; return n; };
    doc.importNode = n => n;
    doc.addEventListener = (t, f) => { doc.listeners[t] = f; };
    doc.removeEventListener = t => { delete doc.listeners[t]; };
    doc.hasFocus = () => doc.focused;
    doc.querySelectorAll = () => [];
    doc.readyState = 'complete';
    return doc;
};
const main = makeDoc();
global.document = main;
const shell = main.body.appendChild(new El(main, 'dd-shell'));
const drawer = shell.appendChild(new El(main, 'dd-drawer-panel'));
shell.appendChild(new El(main, 'dd-inspector-panel'));
const inner = drawer.appendChild(new El(main, 'dd-drawer-search'));
global.SceneManager.isGameActive = () => main.focused;
const dispatched = [];
global.window.dispatchEvent = e => { dispatched.push(e); };
require('../Docs-Doodads.js');
const D = DocsDoodads, W = D.Workspace;
const toasts = [];
W.showToast = m => toasts.push(m);
D.isEditableTarget = t => Boolean(t && t.editable);

(async () => {
    // Without NW.js it says so.
    assert.strictEqual(await W.popOut('drawer'), false);
    assert.ok(/desktop playtest/.test(toasts.pop()));
    // A stand-in nw.Window.
    const second = makeDoc();
    const handlers = {};
    let closed = 0;
    const win = { window: { document: second }, x: 50, y: 60, width: 320, height: 500, on(n, f) { handlers[n] = f; }, close() { closed++; } };
    global.nw = { Window: { open: (url, opts, cb) => { win.opts = opts; cb(win); } } };
    assert.ok(await W.popOut('drawer'), 'popped out');
    assert.strictEqual(drawer.parentNode, second.body, 'the panel moved to the new window');
    assert.strictEqual(document.getElementById('dd-drawer-search'), inner, 'lookups by id still find it');
    assert.ok(W.isPoppedOut('drawer'));
    // It fills its window: docking and the panel layout leave it alone. (Docking read width: 100% as 100 and
    // squeezed the Item Bag to 100 pixels, hiding most of its cards.)
    assert.ok(/width:\s*100%/.test(drawer.style.cssText), 'fills its window: ' + drawer.style.cssText);
    W.applyDockPositions(80);
    if (W.layoutPanels) { try { W.layoutPanels(); } catch (e) { /* the stand-in page has no toolbar */ } }
    assert.ok(!/px$/.test(drawer.style.width || '') && drawer.style.left !== '8px' && !/px$/.test(drawer.style.top || ''), 'still fills it after the editor lays out its panels: width ' + drawer.style.width + ', left ' + drawer.style.left);
    // Keys reach the editor, except while typing.
    second.listeners.keydown({ key: 'z', code: 'KeyZ', ctrlKey: true, target: {} });
    assert.strictEqual(dispatched.length, 1, 'a key there is passed on');
    second.listeners.keydown({ key: 'z', code: 'KeyZ', target: { editable: true } });
    assert.strictEqual(dispatched.length, 1, 'not while typing in a field');
    // The game does not pause while that window has focus.
    main.focused = false; second.focused = true;
    assert.strictEqual(SceneManager.isGameActive(), true);
    second.focused = false;
    assert.strictEqual(SceneManager.isGameActive(), false);
    // Closing the window puts it back where it was, and its place is kept.
    handlers.close();
    assert.strictEqual(drawer.parentNode, shell, 'docked back');
    assert.strictEqual(shell.children.indexOf(drawer), 0, 'in its old place');
    assert.strictEqual(drawer.style.cssText, 'left:10px', 'with its old style');
    assert.strictEqual(closed, 1);
    assert.deepStrictEqual(W.popoutPlace('drawer'), { x: 50, y: 60, width: 320, height: 500 }, 'its place is kept');
    assert.ok(!second.listeners.keydown, 'its key listener goes');
    // Next time it opens there.
    await W.popOut('drawer');
    assert.strictEqual(win.opts.x, 50);
    // Closing the editor docks everything back.
    W.dockAllBack();
    assert.strictEqual(drawer.parentNode, shell);
    assert.ok(!W.isPoppedOut('drawer'));
    // NW.js 0.48: the blank window arrives still loading, with no body, and sends 'document-end', never 'loaded'.
    // The panel used to stay put and an empty window was left open.
    {
        const late = makeDoc(); const body = late.body; late.body = null; late.readyState = 'loading';
        const lateHandlers = {};
        const lateWin = { window: { document: late }, x: 0, y: 0, width: 360, height: 600, on(n, f) { lateHandlers[n] = f; }, close() { this.closed = true; } };
        global.nw = { Window: { open: (url, opts, cb) => { cb(lateWin); } } };
        const pending = W.popOut('drawer');
        assert.strictEqual(drawer.parentNode, shell, 'not moved before the window has a body');
        late.body = body; late.readyState = 'complete'; lateHandlers['document-end']();
        assert.ok(await pending, 'moved once the window is ready');
        assert.strictEqual(drawer.parentNode, body);
        W.dockAllBack();
        assert.strictEqual(drawer.parentNode, shell);
        // A window that never gets a body is closed, and says so.
        const never = makeDoc(); never.body = null; never.readyState = 'loading';
        const neverWin = { window: { document: never }, on() {}, close() { this.closed = true; } };
        global.nw = { Window: { open: (url, opts, cb) => { cb(neverWin); } } };
        const realTimeout = global.setTimeout; global.setTimeout = fn => { fn(); return 0; };
        assert.strictEqual(await W.popOut('inspector'), false);
        global.setTimeout = realTimeout;
        assert.ok(neverWin.closed && /couldn't open/.test(toasts.pop()), 'the empty window is closed');
        global.nw = { Window: { open: (url, opts, cb) => { win.opts = opts; cb(win); } } };
    }
    // The View menu offers both.
    const ids = W.menus().find(m => m.id === 'view').items.map(i => i.id);
    assert.ok(ids.includes('dd-popout-drawer-btn') && ids.includes('dd-popout-inspector-btn'));
    console.log('test_popout: OK');
})().catch(e => { console.error(e); process.exit(1); });
