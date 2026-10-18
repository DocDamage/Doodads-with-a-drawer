// scratch/test_feedback.js
// Feedback: progress pills with Cancel for long jobs (indexing, packing, Auto-Slice, importing), every
// toast kept in Messages with Undo on the ones that throw work away, and themed tooltips with shortcuts.
const assert = require('assert');

console.log('=== Testing Progress, Messages and Tooltips ===');

const byId = {};
function makeNode(tag) {
    const classes = new Set();
    const attrs = {};
    const n = {
        tagName: String(tag).toUpperCase(), style: {}, childNodes: [], parentNode: null, textContent: '', value: '', isConnected: true,
        offsetWidth: 120, offsetHeight: 24,
        get innerHTML() { return this._html || ''; },
        set innerHTML(v) { this._html = v; this.childNodes = []; for (const m of String(v).matchAll(/id="([^"]+)"/g)) { const c = makeNode('div'); c.id = m[1]; this.appendChild(c); } },
        get id() { return attrs.id || ''; },
        set id(v) { attrs.id = String(v); },
        get className() { return Array.from(classes).join(' '); },
        set className(v) { classes.clear(); String(v).split(/\s+/).filter(Boolean).forEach(c => classes.add(c)); },
        classList: { add: c => classes.add(c), remove: c => classes.delete(c), contains: c => classes.has(c), toggle: (c, on) => { if (on === undefined ? !classes.has(c) : on) classes.add(c); else classes.delete(c); } },
        appendChild(c) { this.childNodes.push(c); c.parentNode = this; register(c); return c; },
        removeChild(c) { this.childNodes = this.childNodes.filter(x => x !== c); c.parentNode = null; unregister(c); return c; },
        setAttribute(k, v) { attrs[k] = String(v); }, getAttribute(k) { return k in attrs ? attrs[k] : null; },
        hasAttribute(k) { return k in attrs; }, removeAttribute(k) { delete attrs[k]; },
        matches(sel) {
            return sel.split(',').map(s => s.trim()).some(s => s[0] === '#' ? attrs.id === s.slice(1) : s[0] === '.' ? classes.has(s.slice(1))
                : s[0] === '[' ? s.slice(1, -1) in attrs : this.tagName === s.toUpperCase());
        },
        closest(sel) { let x = this; while (x) { if (x.matches && x.matches(sel)) return x; x = x.parentNode; } return null; },
        addEventListener() {}, removeEventListener() {}, querySelectorAll: () => [], querySelector: () => null,
        getBoundingClientRect: () => ({ left: 100, right: 160, top: 50, bottom: 80, width: 60, height: 30 })
    };
    return n;
}
function register(n) { if (n.id) byId[n.id] = n; (n.childNodes || []).forEach(register); }
function unregister(n) { if (n.id && byId[n.id] === n) delete byId[n.id]; (n.childNodes || []).forEach(unregister); }
const body = makeNode('body');
const docListeners = [];
global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.window.innerWidth = 1000;
global.window.innerHeight = 600;
global.document = {
    body, createElement: makeNode, activeElement: null,
    getElementById: id => byId[id] || null,
    querySelectorAll: () => [],
    addEventListener: (type, fn, capture) => docListeners.push({ type, fn, capture }),
    removeEventListener: (type, fn) => { const i = docListeners.findIndex(l => l.type === type && l.fn === fn); if (i >= 0) docListeners.splice(i, 1); }
};
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: opt => opt === 'test' };
global.PluginManager = { parameters: () => ({}) };
global.$gameMap = { mapId: () => 1, tileWidth: () => 48, tileHeight: () => 48, displayX: () => 0, displayY: () => 0 };

require('../Docs-Doodads.js');
const D = DocsDoodads, U = D.Ui, ws = D.Workspace;
const wait = ms => new Promise(r => setTimeout(r, ms));
const stack = () => byId['dd-progress-stack'];
const pills = () => (stack() ? stack().childNodes : []);
const pillText = p => p.childNodes[0].childNodes[0].textContent;

(async () => {
    // 1. Progress pills.
    let cancelled = 0;
    const p1 = U.progress('Finding your art', { onCancel: () => { cancelled++; } });
    assert.strictEqual(pills().length, 1);
    p1.update(3, 12);
    assert.strictEqual(pillText(pills()[0]), 'Finding your art 3/12');
    assert.strictEqual(p1.barEl.style.width, '25%');
    assert.ok(!pills()[0].classList.contains('dd-progress-unknown'));
    p1.update(0, 0, 'Starting');
    assert.ok(pills()[0].classList.contains('dd-progress-unknown'), 'no total yet: a moving bar');
    assert.strictEqual(pillText(pills()[0]), 'Finding your art · Starting');
    const cancelBtn = pills()[0].childNodes[1];
    assert.strictEqual(cancelBtn.textContent, 'Cancel');
    cancelBtn.onclick();
    cancelBtn.onclick();
    assert.ok(p1.cancelled && cancelled === 1, 'Cancel runs once');
    assert.ok(/Cancelling/.test(pillText(pills()[0])) && cancelBtn.disabled);
    p1.finish();
    assert.strictEqual(pills().length, 0);
    assert.deepStrictEqual(U.activeProgress(), []);
    // A quick job with a delay never shows; a slow one does. No onCancel, no button.
    const quick = U.progress('Quick', { delay: 80 });
    quick.finish();
    await wait(120);
    assert.strictEqual(pills().length, 0, 'finished before the delay: no pill');
    const slow = U.progress('Slow', { delay: 40 });
    slow.update(1, 2);
    assert.strictEqual(pills().length, 0);
    await wait(80);
    assert.strictEqual(pills().length, 1);
    assert.strictEqual(pills()[0].childNodes.length, 1, 'no Cancel without onCancel');
    assert.strictEqual(pillText(pills()[0]), 'Slow 1/2', 'shows the latest count when it appears');
    slow.finish();
    console.log('✓ progress pills: count and bar, unknown totals, Cancel once, delayed for quick jobs');

    // 2. Indexing shows a pill once it takes a while, and its Cancel stops the scan.
    ws.mounted = true;
    const toasts = [];
    const realToast = ws.showToast;
    ws.showToast = (msg, kind, opts) => { toasts.push([msg, kind, opts]); };
    ws.refreshDrawerCards = () => {};
    ws.updateIndexStatus = () => {};
    let finishScan;
    D.AssetIndex.scanAsync = opts => new Promise(resolve => {
        opts.onProgress({ completed: 5, total: 50 });
        finishScan = () => resolve({ cancelled: Boolean(opts.cancellationToken.cancelled), removed: 0, errors: [] });
    });
    const scanning = ws.startAssetScan();
    assert.strictEqual(pills().length, 0, 'not straight away');
    await wait(650);
    assert.strictEqual(pillText(pills()[0]), 'Finding your art 5/50');
    pills()[0].childNodes[1].onclick();
    assert.ok(ws._assetScanToken.cancelled, 'Cancel stops the scan');
    finishScan();
    await scanning;
    assert.strictEqual(pills().length, 0);
    assert.ok(/Stopped looking/.test(toasts[toasts.length - 1][0]));
    console.log('✓ indexing: pill after a moment, Cancel stops it');

    // 3. Packing: Cancel while the pictures load writes nothing.
    D.Packer.regionsFor = () => [{ key: 'a', path: 'img/doodads/a.png', rect: { x: 0, y: 0, w: 8, h: 8 } }, { key: 'b', path: 'img/doodads/b.png', rect: { x: 0, y: 0, w: 8, h: 8 } }];
    D.Packer.pack = () => ({ sheets: [] });
    let wrote = 0;
    D.FS.mkdirp = () => { wrote++; };
    global.Image = class { set src(v) { setTimeout(() => this.onload(), 450); } };
    D.LiveReload.urlFor = p => p;
    const packing = ws.packCurrentMap();
    await wait(350);
    assert.strictEqual(pillText(pills()[0]), 'Packing map art 0/2');
    pills()[0].childNodes[1].onclick();
    assert.strictEqual(await packing, null);
    assert.strictEqual(wrote, 0, 'nothing written');
    assert.strictEqual(pills().length, 0);
    assert.ok(/Packing cancelled/.test(toasts[toasts.length - 1][0]));
    console.log('✓ packing: pill with a count; Cancel writes nothing');

    // 4. Auto-Slice on a big sheet: a pill with the stage, and its Cancel stops the analysis.
    const E = D.Slicing.Editor;
    E.img = { naturalWidth: 4096, naturalHeight: 4096 };
    let token = null, progress = null, resolveAnalysis;
    D.Slicing.Visual.analyzeAsync = (img, opts, onProgress, t) => { token = t; progress = onProgress; return new Promise(r => { resolveAnalysis = r; }); };
    const slicing = E.autoSlice();
    progress('Finding Islands', 40);
    assert.strictEqual(pillText(pills()[0]), 'Auto-Slice 40/100 · Finding Islands');
    pills()[0].childNodes[1].onclick();
    assert.ok(token.isCancelled);
    resolveAnalysis(null);
    assert.strictEqual(await slicing, null);
    assert.strictEqual(pills().length, 0);
    console.log('✓ auto-slice: pill with the stage; Cancel stops it');

    // 5. Importing closes the card and goes on in a pill.
    const runs = [];
    let finishImport;
    ws.runAssetImport = (paths, opts) => new Promise(resolve => { runs.push(opts); finishImport = () => resolve({ ok: true, imported: paths }); });
    D.Import.describeResult = r => `Brought in ${r.imported.length}`;
    D.Import.collectFiles = paths => ({ files: paths });
    D.Import.isSupported = () => true;
    ws.showAssetImportModal(['C:/art/a.png', 'C:/art/b.png']);
    const overlay = byId['dd-import-modal'] || body.childNodes.find(n => n.childNodes.some(c => c.id === 'dd-import-confirm'));
    assert.ok(byId['dd-import-confirm'], 'the import card');
    byId['dd-import-destination'].value = 'img/doodads';
    byId['dd-import-collision'].value = 'rename';
    const importing = byId['dd-import-confirm'].onclick();
    assert.ok(!byId['dd-import-confirm'], 'the card closes at once');
    assert.strictEqual(pillText(pills()[0]), 'Bringing in files 0/2');
    runs[0].onProgress({ completed: 1, total: 2 });
    assert.strictEqual(pillText(pills()[0]), 'Bringing in files 1/2');
    pills()[0].childNodes[1].onclick();
    assert.ok(runs[0].cancellationToken.cancelled, 'Cancel reaches the import');
    finishImport();
    await importing;
    assert.strictEqual(pills().length, 0);
    assert.strictEqual(toasts[toasts.length - 1][0], 'Brought in 2');
    assert.ok(overlay);
    console.log('✓ import: the card closes, the pill counts, Cancel reaches the import');

    // 6. Messages: every toast is kept; an Undo button on toasts after work is thrown away.
    ws.showToast = realToast;
    ws.toastLog = [];
    for (let i = 0; i < 65; i++) ws.showToast('Message ' + i, i % 2 ? 'success' : 'error');
    assert.strictEqual(ws.toastLog.length, 60, 'the last 60');
    assert.strictEqual(ws.toastLog[0].msg, 'Message 64', 'newest first');
    assert.strictEqual(ws.toastLog[0].kind, 'error');
    ws.showToast('Timed', 3000);
    assert.strictEqual(ws.toastLog[0].kind, 'info', 'a duration counts as info');
    // Undo on the toast only while that step is the last one.
    const Undo = D.Undo;
    Undo.clear();
    let undone = 0;
    const step = { apply() {}, revert() { undone++; } };
    Undo.execute(step);
    ws.toastUndo('Deleted 2 Doodad(s)');
    let toast = byId['dd-toast'];
    assert.strictEqual(toast._ddAction.textContent, 'Undo');
    assert.strictEqual(toast.style.pointerEvents, 'auto', 'the toast can be clicked');
    toast._ddAction.onclick();
    assert.strictEqual(undone, 1);
    assert.ok(!byId['dd-toast'], 'the toast goes');
    // An Undo toast stays while the mouse is on it, then goes when it leaves.
    const realTimeout = global.setTimeout;
    const timers = [];
    global.setTimeout = (fn, ms) => { timers.push([fn, ms]); return timers.length; };
    Undo.execute(step);
    ws.toastUndo('Deleted 1 Doodad(s)');
    toast = byId['dd-toast'];
    assert.strictEqual(timers[0][1], 8000, 'Undo toasts stay up for eight seconds');
    toast.onmouseenter();
    timers[0][0]();
    assert.notStrictEqual(toast.style.opacity, '0', 'not while the mouse is on it');
    toast.onmouseleave();
    assert.strictEqual(toast.style.opacity, '0', 'it goes once the mouse leaves');
    global.setTimeout = realTimeout;
    toast.parentNode.removeChild(toast);
    Undo.clear();
    Undo.execute(step);
    ws.toastUndo('Erased 3 prop(s).');
    toast = byId['dd-toast'];
    Undo.execute({ apply() {}, revert() {} });
    toast._ddAction.onclick();
    assert.strictEqual(undone, 1, 'a later step is not undone by an old toast');
    assert.ok(/Other changes came after it/.test(ws.toastLog[0].msg));
    Undo.clear();
    ws.toastUndo('Nothing to undo');
    assert.ok(!byId['dd-toast']._ddAction, 'no step, no button');
    // The Messages panel.
    ws.toastLog = [{ msg: 'Saved <b>', kind: 'success', at: Date.now() }, { msg: 'Oops', kind: 'error', at: Date.now() - 1000 }];
    const panel = ws.showToastHistory();
    assert.ok(panel && byId['dd-th-list']);
    assert.ok(/Saved &lt;b&gt;/.test(byId['dd-th-list'].innerHTML), 'escaped');
    assert.ok(/dd-th-error/.test(byId['dd-th-list'].innerHTML) && /dd-th-success/.test(byId['dd-th-list'].innerHTML));
    ws.showToast('New one');
    assert.ok(/New one/.test(byId['dd-th-list'].innerHTML), 'new messages appear while it is open');
    byId['dd-th-clear'].onclick();
    assert.deepStrictEqual(ws.toastLog, []);
    assert.ok(/No messages yet/.test(byId['dd-th-list'].innerHTML));
    byId['dd-th-close'].onclick();
    assert.ok(!byId['dd-toast-history']);
    ws.mapEntries = () => [];
    assert.ok(ws.paletteCommands().some(c => c.label === 'Messages (read them again)'));
    console.log('✓ messages: kept newest first (60), Undo while the step is last, the Messages panel');

    // 7. Tooltips.
    assert.deepStrictEqual(U.splitTip('Save everything (Ctrl+S)'), ['Save everything', 'Ctrl+S']);
    assert.deepStrictEqual(U.splitTip('Close the editor and play (Ctrl + Shift + E)'), ['Close the editor and play', 'Ctrl+Shift+E']);
    assert.deepStrictEqual(U.splitTip('Show the snapping grid (G)'), ['Show the snapping grid', 'G']);
    assert.deepStrictEqual(U.splitTip('Select: click things to change them, drag to move (Esc)'), ['Select: click things to change them, drag to move', 'Esc']);
    assert.deepStrictEqual(U.splitTip('Grab: click a doodad (or Alt+click)'), ['Grab: click a doodad (or Alt+click)', ''], 'not a key: left in the text');
    assert.deepStrictEqual(U.splitTip('Delete (doodads move to Main)'), ['Delete (doodads move to Main)', '']);
    const root = makeNode('div'); root.id = 'dd-asset-workspace-root'; body.appendChild(root);
    const btn = makeNode('button'); btn.setAttribute('title', 'Save everything (Ctrl+S)'); btn.textContent = '';
    const icon = makeNode('i'); btn.appendChild(icon); root.appendChild(btn);
    const named = makeNode('button'); named.setAttribute('title', 'Undo (Ctrl+Z)'); named.textContent = 'Undo'; root.appendChild(named);
    const outside = makeNode('button'); outside.setAttribute('title', 'Game button'); body.appendChild(outside);
    assert.strictEqual(U.tipTarget(icon), btn, 'from a child to its button');
    assert.strictEqual(btn.getAttribute('title'), null, 'the browser tooltip is off');
    assert.strictEqual(btn.getAttribute('data-dd-tip'), 'Save everything (Ctrl+S)');
    assert.strictEqual(btn.getAttribute('aria-label'), 'Save everything (Ctrl+S)', 'an icon-only button keeps a name for screen readers');
    U.tipTarget(named);
    assert.strictEqual(named.getAttribute('aria-label'), null, 'a button with words keeps them');
    assert.strictEqual(U.tipTarget(outside), null, 'only the editor');
    assert.strictEqual(outside.getAttribute('title'), 'Game button');
    U.installTooltips();
    U.installTooltips();
    const over = docListeners.filter(l => l.type === 'mouseover');
    assert.strictEqual(over.length, 1, 'installed once');
    U.tooltipDelay = 30;
    over[0].fn({ target: icon });
    assert.ok(!byId['dd-tooltip']);
    await wait(60);
    const tip = byId['dd-tooltip'];
    assert.ok(tip, 'shown after a rest');
    assert.strictEqual(tip.textContent, 'Save everything');
    assert.strictEqual(tip.childNodes[0].tagName, 'KBD');
    assert.strictEqual(tip.childNodes[0].textContent, 'Ctrl+S');
    assert.deepStrictEqual([tip.style.left, tip.style.top], ['70px', '88px'], 'centred under the button');
    over[0].fn({ target: icon });
    assert.ok(byId['dd-tooltip'], 'moving within the same button keeps it');
    docListeners.find(l => l.type === 'mousedown').fn({});
    assert.ok(!byId['dd-tooltip'], 'a click hides it');
    over[0].fn({ target: named });
    over[0].fn({ target: outside });
    await wait(60);
    assert.ok(!byId['dd-tooltip'], 'leaving before the delay shows nothing');
    U.removeTooltips();
    assert.strictEqual(docListeners.filter(l => ['mouseover', 'mousedown', 'keydown', 'wheel'].includes(l.type)).length, 0, 'all listeners removed');
    // The workspace turns them on and off with itself.
    assert.ok(/Ui\.installTooltips\(\)/.test(String(ws.open)) && /Ui\.removeTooltips\(\)/.test(String(ws.close)));
    console.log('✓ tooltips: shortcut in a key cap, after a rest, editor only, aria-label kept, removed on close');

    console.log('=== Progress, messages and tooltips passed ===');
})().catch(e => { console.error(e); process.exit(1); });
