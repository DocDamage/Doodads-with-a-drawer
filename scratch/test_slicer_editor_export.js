// scratch/test_slicer_editor_export.js
// Cut Up Sheet (27_slicing_editor.js) and Save as PNGs (26_export.js), driven through a small stand-in
// for the page: open a sheet, cut it with the buttons, draw, move and resize boxes with the mouse (with
// snapping), the keys, undo and redo, the region list and the inspector, saving and closing with changes;
// then each piece written as its own PNG (trimmed, rotated, names made unique, an empty sheet refused).
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

console.log('=== Testing Cut Up Sheet and Save as PNGs ===');

// ---- A small page ----
const byId = {};
const drawn = [];
function makeCtx() {
    const ctx = { calls: [] };
    for (const m of ['clearRect', 'fillRect', 'strokeRect', 'save', 'restore', 'translate', 'scale', 'rotate', 'drawImage', 'beginPath', 'moveTo',
        'lineTo', 'stroke', 'fillText', 'setLineDash']) ctx[m] = (...a) => { ctx.calls.push(m); if (m === 'drawImage') drawn.push(a); };
    ctx.createPattern = () => ({});
    return ctx;
}
function element(tag, id) {
    const el = {
        tagName: String(tag).toUpperCase(), id: id || '', style: {}, className: '', textContent: '', value: '', children: [], parentNode: null,
        listeners: {}, clientWidth: 800, clientHeight: 600, width: 0, height: 0,
        appendChild(child) { child.parentNode = this; this.children.push(child); return child; },
        removeChild(child) { this.children = this.children.filter(c => c !== child); child.parentNode = null; return child; },
        addEventListener(type, fn) { (this.listeners[type] = this.listeners[type] || []).push(fn); },
        removeEventListener() {},
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600, right: 800, bottom: 600 }),
        click() { if (this.onclick) return this.onclick({ target: this }); },
        getContext() { return this._ctx || (this._ctx = makeCtx()); },
        toDataURL: () => 'data:image/png;base64,' + Buffer.from('PNG').toString('base64'),
        setAttribute() {}, getAttribute: () => null, querySelectorAll: () => [], focus() {}
    };
    let html = '';
    Object.defineProperty(el, 'innerHTML', {
        get: () => html,
        set(v) {
            html = String(v);
            if (!v) el.children = [];
            // Elements with ids in the new markup are new elements (as a browser makes them).
            for (const m of html.matchAll(/id="([^"]+)"/g)) {
                const tagName = (html.slice(0, m.index).match(/<(\w+)[^<]*$/) || [])[1] || 'div';
                const made = element(tagName, m[1]);
                const value = (html.slice(m.index).match(/^id="[^"]+"[^>]*?value="([^"]*)"/) || [])[1];
                if (value !== undefined) made.value = value;
                byId[m[1]] = made;
            }
        }
    });
    return el;
}
const winListeners = {};
global.window = global;
global.window.addEventListener = (type, fn) => { (winListeners[type] = winListeners[type] || []).push(fn); };
global.window.removeEventListener = () => {};
const body = element('body');
global.document = {
    body,
    createElement: tag => element(tag),
    getElementById: id => byId[id] || null,
    querySelectorAll: () => [],
    addEventListener() {}, removeEventListener() {},
    activeElement: null
};
global.Image = class {
    constructor() { this.naturalWidth = 0; this.naturalHeight = 0; this.onload = null; }
    set src(v) { this._src = v; this.naturalWidth = this.width = 256; this.naturalHeight = this.height = 128; setTimeout(() => this.onload && this.onload(), 0); }
    get src() { return this._src; }
};
const store = {};
global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } };
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: opt => opt === 'test' };
global.PluginManager = { parameters: () => ({}) };

const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-slicer-'));
const repoRoot = path.resolve(__dirname, '..');
process.on('exit', () => { process.chdir(repoRoot); fs.rmSync(sandbox, { recursive: true, force: true }); });
process.chdir(sandbox);

require(path.join(repoRoot, 'Docs-Doodads.js'));
const D = DocsDoodads, SE = D.Slicing.Editor, ws = D.Workspace;
const toasts = [];
ws.showToast = msg => toasts.push(msg);
ws.refreshDrawerCards = () => {};
const tick = () => new Promise(r => setTimeout(r, 5));
const mouse = (type, x, y, extra = {}) => {
    const e = Object.assign({ clientX: x, clientY: y, button: 0, preventDefault() {} }, extra);
    if (type === 'mousedown' || type === 'wheel') for (const fn of SE.container.listeners[type] || []) fn(e);
    else for (const fn of winListeners[type] || []) fn(e);
};
const key = (k, extra = {}) => { for (const fn of winListeners.keydown || []) fn(Object.assign({ key: k, code: k.length === 1 ? 'Key' + k.toUpperCase() : k, target: body, preventDefault() {} }, extra)); };

(async () => {
    // 1. Opening: the window, the fitted view and the list.
    const asset = { id: 'img/doodads/sheet.png', path: 'img/doodads/sheet.png', fileName: 'sheet.png', slice: { status: 'auto', regions: [{ id: 'a', name: 'Tree', x: 0, y: 0, w: 64, h: 64, pivotX: 0.5, pivotY: 1 }] } };
    SE.open(asset);
    await tick();
    assert.ok(SE.modal && body.children.includes(SE.modal), 'the window opens');
    assert.ok(SE.zoom >= 0.25 && SE.zoom <= 4, 'the sheet fits the view');
    assert.strictEqual(byId['dd-region-count'].textContent, 1);
    assert.ok(byId['dd-region-inspector'].innerHTML.includes('Region #1'), 'the picked box in the inspector');
    assert.ok(SE.ctx.calls.includes('drawImage') && SE.ctx.calls.includes('strokeRect'), 'the sheet and the boxes are drawn');
    console.log('✓ Opening: the window, the view fitted, the list and the inspector.');

    // 2. The buttons: a box, copy, split both ways, join, order, delete, grid.
    byId['dd-slicer-add-btn'].click();
    assert.strictEqual(SE.regions.length, 2);
    assert.deepStrictEqual([SE.regions[1].w, SE.regions[1].h], [48, 48]);
    byId['dd-slicer-dup-btn'].click();
    assert.strictEqual(SE.regions.length, 3);
    assert.strictEqual(SE.regions[2].x, SE.regions[1].x + 16, 'the copy sits beside it');
    byId['dd-slicer-splitv-btn'].click();
    assert.strictEqual(SE.regions.length, 4);
    assert.strictEqual(SE.regions[2].w + SE.regions[3].w, 48, 'split into a left and a right half');
    byId['dd-slicer-splith-btn'].click();
    assert.strictEqual(SE.regions.length, 5);
    SE.selectedRegionIdx = 1;
    assert.strictEqual(SE.mergeWithNext(), true, 'joined');
    assert.strictEqual(SE.regions.length, 4);
    assert.strictEqual(SE.moveRegion(1), true);
    assert.strictEqual(SE.selectedRegionIdx, 2);
    assert.strictEqual(SE.moveRegion(5), false, 'not past the end');
    byId['dd-slicer-del-btn'].click();
    assert.strictEqual(SE.regions.length, 3);
    D.Ui.prompt = () => Promise.resolve('4x2');
    await byId['dd-slicer-grid-btn'].click();
    assert.strictEqual(SE.regions.length, 8, '4 x 2 grid');
    assert.deepStrictEqual([SE.regions[0].w, SE.regions[0].h], [64, 64]);
    D.Ui.prompt = () => Promise.resolve('nonsense');
    await byId['dd-slicer-grid-btn'].click();
    assert.strictEqual(SE.regions.length, 8, 'an answer that is no grid changes nothing');
    console.log('✓ Buttons: box, copy, split, join, order, delete and grid.');

    // 3. Undo and redo, by button and by key.
    const before = JSON.stringify(SE.regions);
    byId['dd-slicer-undo'].click();
    assert.strictEqual(SE.regions.length, 3, 'the grid is undone');
    byId['dd-slicer-redo'].click();
    assert.strictEqual(JSON.stringify(SE.regions), before, 'and redone');
    key('z', { ctrlKey: true });
    assert.strictEqual(SE.regions.length, 3, 'Ctrl+Z');
    key('y', { ctrlKey: true });
    assert.strictEqual(SE.regions.length, 8, 'Ctrl+Y');
    assert.strictEqual(byId['dd-slicer-undo'].style.opacity, '1');
    console.log('✓ Undo and redo, by button and by key.');

    // 4. The mouse: a new box drawn on empty space, moved by its body (snapping), resized by a corner,
    // panned with Alt, zoomed with the wheel.
    SE.regions = [{ id: 'a', name: 'A', x: 0, y: 0, w: 40, h: 40 }, { id: 'b', name: 'B', x: 100, y: 0, w: 40, h: 40 }];
    SE.selectedRegionIdx = -1;
    SE.zoom = 1; SE.panX = 0; SE.panY = 0;
    const undoCount = SE.undoStack.length;
    mouse('mousedown', 50, 60);
    mouse('mousemove', 90, 100);
    assert.strictEqual(SE.isCreatingRegion, true);
    mouse('mouseup', 90, 100);
    assert.strictEqual(SE.regions.length, 3, 'a box drawn on empty space');
    assert.deepStrictEqual([SE.regions[2].x, SE.regions[2].y, SE.regions[2].w, SE.regions[2].h], [50, 60, 40, 40]);
    assert.strictEqual(SE.undoStack.length, undoCount + 1);
    mouse('mousedown', 200, 200);
    mouse('mouseup', 202, 202);
    assert.strictEqual(SE.regions.length, 3, 'a click without a drag makes no box');
    // Drag the new box by its body near B's left edge: it snaps there, with a guide.
    mouse('mousedown', 70, 80);
    assert.strictEqual(SE.activeHandle, 'body');
    mouse('mousemove', 68 + 48, 80);
    assert.strictEqual(SE.regions[2].x, 100, 'snapped to the other box');
    assert.ok(SE.activeGuides.some(g => g.type === 'v' && g.x === 100), 'with a guide');
    mouse('mouseup', 116, 80);
    assert.strictEqual(SE.undoStack.length, undoCount + 2, 'a move is a step');
    mouse('mousedown', 140, 80);
    mouse('mouseup', 140, 80);
    assert.strictEqual(SE.undoStack.length, undoCount + 2, 'a click on a box without moving is not');
    // Resize from the bottom-right corner.
    const r = SE.regions[SE.selectedRegionIdx];
    const corner = SE.imageToScreen(r.x + r.w, r.y + r.h);
    assert.strictEqual(SE.hitTestHandles(corner.x, corner.y, r), 'se');
    mouse('mousedown', corner.x, corner.y);
    mouse('mousemove', corner.x + 10, corner.y + 20);
    mouse('mouseup', corner.x + 10, corner.y + 20);
    assert.deepStrictEqual([r.w, r.h], [50, 60], 'resized by the corner');
    assert.deepStrictEqual(SE.resizeRegion({ x: 10, y: 10, w: 20, h: 20 }, 'nw', 100, 100), { x: 26, y: 26, w: 4, h: 4 }, 'never smaller than 4 x 4');
    mouse('mousemove', 2, 2);
    assert.strictEqual(SE.container.style.cursor, 'crosshair');
    mouse('mousedown', 300, 300, { altKey: true });
    mouse('mousemove', 320, 330);
    mouse('mouseup', 320, 330);
    assert.deepStrictEqual([SE.panX, SE.panY], [20, 30], 'Alt-drag looks around');
    mouse('wheel', 400, 300, { deltaY: -100 });
    assert.ok(SE.zoom > 1, 'the wheel zooms in');
    assert.ok(byId['dd-slicer-zoom-indicator'].textContent.endsWith('%'));
    SE.zoom = 5; SE.render();
    assert.ok(SE.ctx.calls.filter(c => c === 'moveTo').length > 100, 'a pixel grid when zoomed in close');
    console.log('✓ Mouse: draw, move with snapping, resize, look around, zoom.');

    // 5. The list and the inspector.
    SE.zoom = 1; SE.panX = 0; SE.panY = 0;
    SE.updateRegionList();
    const list = byId['dd-region-list'];
    assert.strictEqual(list.children.length, SE.regions.length);
    list.children[0].onclick();
    assert.strictEqual(SE.selectedRegionIdx, 0, 'a row picks its box');
    byId['dd-insp-rw'].value = '2';
    byId['dd-insp-name'].value = 'Trunk';
    byId['dd-insp-pivx'].value = '0';
    byId['dd-insp-rw'].onchange();
    assert.strictEqual(SE.regions[0].w, 4, 'at least 4 wide');
    assert.strictEqual(SE.regions[0].name, 'Trunk');
    assert.strictEqual(SE.regions[0].pivotX, 0, 'a pivot of 0 is kept');
    SE.selectedRegionIdx = -1;
    SE.updateInspectorValues();
    assert.ok(byId['dd-region-inspector'].innerHTML.includes('No region selected'));
    assert.strictEqual(SE.uniqueRegionName('Trunk'), 'Trunk_2');
    console.log('✓ The list picks, the inspector edits.');

    // 6. Keys: Delete, Ctrl+D, Space to look around; nothing while typing.
    SE.selectedRegionIdx = 0;
    const n = SE.regions.length;
    key('d', { ctrlKey: true });
    assert.strictEqual(SE.regions.length, n + 1, 'Ctrl+D copies');
    key('Delete');
    assert.strictEqual(SE.regions.length, n, 'Delete removes');
    key(' ', { code: 'Space' });
    assert.strictEqual(SE._spaceHeld, true);
    for (const fn of winListeners.keyup || []) fn({ code: 'Space' });
    assert.strictEqual(SE._spaceHeld, false);
    const input = element('input');
    key('Delete', { target: input });
    assert.strictEqual(SE.regions.length, n, 'not while typing in a field');
    console.log('✓ Keys: Delete, Ctrl+D, Space; fields keep their keys.');

    // 7. Auto-Slice (small sheets at once, big ones in the background with Cancel).
    const V = D.Slicing.Visual;
    V.analyze = () => ({ regions: [{ id: 'x', name: 'X', x: 0, y: 0, w: 32, h: 32 }], confidence: 0.9, status: 'auto' });
    const res = await SE.autoSlice();
    assert.strictEqual(res.regions.length, 1);
    assert.ok(toasts.some(t => /Auto-slice complete: 1 regions \(90% confidence\)/.test(t)));
    SE.img.naturalWidth = 4096; SE.img.naturalHeight = 2048;
    V.analyzeAsync = (img, opts, onProgress, token) => new Promise(resolve => { onProgress('edges', 50); setTimeout(() => resolve(token.isCancelled ? null : { regions: [], confidence: 0.4, status: 'review' }), 10); });
    const first = SE.autoSlice();
    assert.strictEqual(byId['dd-slicer-auto-btn'].textContent, 'Cancel');
    assert.strictEqual(await SE.autoSlice(), null, 'pressed again: cancelled');
    assert.strictEqual(await first, null);
    assert.ok(toasts.includes('Auto-slice cancelled.'));
    assert.strictEqual(byId['dd-slicer-auto-btn'].textContent, 'Auto-Slice');
    const review = await SE.autoSlice();
    assert.strictEqual(review.status, 'review');
    assert.ok(toasts.some(t => t.startsWith('Review required')));
    SE.img.naturalWidth = 256; SE.img.naturalHeight = 128;
    console.log('✓ Auto-Slice: at once, or in the background with Cancel.');

    // 8. Closing with changes asks; Save Pieces writes them to the library.
    let saves = 0;
    D.AssetIndex.save = () => { saves++; return true; };
    let invalidated = null;
    D.Thumbnail.invalidate = id => { invalidated = id; };
    D.Ui.choose = () => Promise.resolve('stay');
    assert.strictEqual(await SE.requestClose(), false, 'Keep Editing keeps it open');
    assert.ok(SE.modal);
    D.Ui.choose = () => Promise.resolve('save');
    const shown = SE.regions.length;
    assert.strictEqual(await SE.requestClose(), true);
    assert.strictEqual(saves, 1, 'saved');
    assert.strictEqual(asset.slice.regions.length, shown);
    assert.strictEqual(asset.slice.status, 'manual');
    assert.strictEqual(invalidated, asset.id, 'its picture is made again');
    assert.strictEqual(SE.modal, null, 'and closed');
    SE.open(asset);
    await tick();
    assert.strictEqual(SE.hasChanges(), false);
    assert.strictEqual(await SE.requestClose(), true, 'no changes: closes at once');
    SE.open(asset);
    await tick();
    byId['dd-slicer-add-btn'].click();
    D.Ui.choose = () => Promise.resolve('discard');
    key('Escape');
    await tick();
    assert.strictEqual(SE.modal, null, "Esc, then Don't Save");
    assert.strictEqual(asset.slice.regions.length, shown, 'nothing saved');
    for (const fn of winListeners.resize || []) fn();
    console.log('✓ Closing asks when pieces changed; Save Pieces writes them.');

    // 9. Save as PNGs: each piece a file, names made safe and unique, trimmed and rotated pieces placed.
    const sheet = { path: 'img/doodads/sheet.png', fileName: 'sheet.png', slice: { regions: [
        { name: 'leaf.png', x: 0, y: 0, w: 16, h: 16 },
        { name: 'leaf.png', x: 16, y: 0, w: 16, h: 16 },
        { name: '../../evil?.png', x: 32, y: 0, w: 10, h: 20, rotated: true },
        { name: '', x: 0, y: 32, w: 8, h: 8, trimmed: true, sourceSize: { w: 16, h: 16 }, spriteSourceSize: { x: 4, y: 4 } }
    ] } };
    drawn.length = 0;
    assert.strictEqual(D.Export.exportSlices(sheet), true);
    await tick();
    const out = path.join('img', 'doodads', 'sliced_sheet');
    assert.deepStrictEqual(fs.readdirSync(out).sort(), ['evil_.png', 'leaf.png', 'leaf_2.png', 'slice_4.png'], 'names safe and unique');
    assert.strictEqual(fs.readFileSync(path.join(out, 'leaf.png')).toString(), 'PNG', 'the picture is written');
    assert.ok(drawn.some(a => a[5] === 4 && a[6] === 4), 'a trimmed piece is placed back in its frame');
    assert.ok(toasts.some(t => t.startsWith('Exported 4 slices')));
    assert.strictEqual(D.Export.exportSlices({ path: 'x.png', fileName: 'x.png', slice: { regions: [] } }), false, 'no pieces: nothing to save');
    assert.ok(toasts.some(t => t.includes('no slices yet')));
    console.log('✓ Save as PNGs: one file a piece, safe unique names, trimmed and rotated pieces.');

    console.log('\nAll Cut Up Sheet and Save as PNGs checks passed.');
})().catch(error => { console.error(error); process.exit(1); });
