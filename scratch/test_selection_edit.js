// scratch/test_selection_edit.js
// Editing picked doodads: Details with several picked shows "—" where they differ and an edit sets them
// all (with a Placement section); number boxes scrub by dragging their label and step with the arrows;
// and the picked doodad has handles to resize (Shift keeps proportions) and turn (Shift snaps to 15°).
const assert = require('assert');

console.log('=== Testing Mixed Values, Scrubbing and Handles ===');

const byId = {};
const winListeners = {};
function makeNode(tag) {
    const attrs = {};
    const listeners = {};
    return {
        tagName: String(tag).toUpperCase(), style: {}, childNodes: [], parentNode: null, textContent: '', value: '', checked: false, title: '',
        classList: { add() {}, remove() {}, contains: () => false, toggle() {} },
        get id() { return attrs.id || ''; }, set id(v) { attrs.id = String(v); byId[v] = this; },
        setAttribute(k, v) { attrs[k] = String(v); if (k === 'id') byId[v] = this; }, getAttribute(k) { return k in attrs ? attrs[k] : null; },
        appendChild(c) { this.childNodes.push(c); c.parentNode = this; return c; },
        removeChild(c) { this.childNodes = this.childNodes.filter(x => x !== c); c.parentNode = null; return c; },
        addEventListener(type, fn) { (listeners[type] = listeners[type] || []).push(fn); },
        fire(type, e) { (listeners[type] || []).forEach(fn => fn(e)); },
        removeEventListener() {}, querySelectorAll: () => [], querySelector: () => null, focus() { this.focused = true; }
    };
}
global.window = global;
global.window.addEventListener = (type, fn) => { (winListeners[type] = winListeners[type] || []).push(fn); };
global.window.removeEventListener = (type, fn) => { winListeners[type] = (winListeners[type] || []).filter(f => f !== fn); };
const fireWin = (type, e) => (winListeners[type] || []).slice().forEach(fn => fn(e));
global.document = {
    body: makeNode('body'), documentElement: makeNode('html'), createElement: makeNode,
    getElementById: id => byId[id] || null,
    querySelectorAll: () => [], addEventListener() {}, removeEventListener() {}
};
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: opt => opt === 'test' };
global.PluginManager = { parameters: () => ({}) };
global.$gameMap = { mapId: () => 1, tileWidth: () => 48, tileHeight: () => 48, displayX: () => 0, displayY: () => 0, adjustX: x => x, adjustY: y => y, width: () => 40, height: () => 30 };

require('../Docs-Doodads.js');
const D = DocsDoodads, ws = D.Workspace, Undo = D.Undo;
ws.showToast = () => {};
ws.refreshSpriteset = () => {};
const realRefresh = ws.refreshInspector;
ws.refreshInspector = () => {};
D.Perspective.liveCamera = () => null;
const doodad = props => Object.assign(D.standardStruct(), { frameW: 48, frameH: 96, posMode: 1 }, props);

// 1. Mixed values in Details.
const a = doodad({ x: 100, y: 200, opacity: 1, blend: 0, light: { enabled: true, radius: 100 } });
const b = doodad({ x: 300, y: 200, opacity: 0.5, blend: 1, light: { enabled: false, radius: 100 }, scaleX: -2, scaleY: 2 });
global.$dataDocsDoodads = { 1: [a, b] };
const html = ws.renderEffectSections([a, b]);
const sections = ws._effectSections;
assert.strictEqual(sections[0].title, 'Placement', 'several picked: where they stand comes first');
const idOf = key => { for (let si = 0; si < sections.length; si++) { const fi = sections[si].fields.findIndex(f => f.key === key); if (fi >= 0) return `dd-fx-${si}-${fi}`; } return null; };
const fieldOf = key => { const id = idOf(key); const m = new RegExp(`(<[^>]*id="${id}"[^>]*>)`).exec(html); return m ? m[1] : ''; };
assert.ok(/placeholder="—"/.test(fieldOf('x')) && /value=""/.test(fieldOf('x')), 'different X: an empty box showing —');
assert.ok(/value="200"/.test(fieldOf('y')) && !/data-mixed/.test(fieldOf('y')), 'the same Y shows it');
assert.ok(new RegExp(`id="${idOf('opacity')}-val"[^>]*>—<`).test(html), 'a slider that differs shows —');
assert.ok(/data-mixed="1"/.test(fieldOf('light.enabled')) && !/checked/.test(fieldOf('light.enabled')), 'a half-ticked box');
assert.ok(new RegExp(`id="${idOf('blend')}"[^>]*><option value="__mixed" selected>— mixed —`).test(html), 'a different blend: a mixed choice, picked');
assert.ok(new RegExp(`id="${idOf('depth')}"[^>]*>(?!<option value="__mixed")`).test(html), 'the same draw order: no mixed choice');
assert.ok(/(mixed)/.test(html));
// Size shows whichever way a doodad is flipped.
assert.strictEqual(ws.getDoodadProperty(b, 'scale'), 2);
assert.strictEqual(ws.sharedValue([a, b], 'scale').mixed, true);
// Binding: the half-ticked box is indeterminate, leaving "—" alone changes nothing, an edit sets them all.
const inputs = {};
for (const s of sections) s.fields.forEach((f, fi) => {
    const id = `dd-fx-${sections.indexOf(s)}-${fi}`;
    const m = new RegExp(`<[^>]*id="${id}"[^>]*>`).exec(html);
    const n = makeNode(m && /^<select/.test(m[0]) ? 'select' : 'input');
    n.id = id;
    if (m && /data-mixed="1"/.test(m[0])) n.setAttribute('data-mixed', '1');
    const v = m && /value="([^"]*)"/.exec(m[0]);
    n.value = v ? v[1] : '';
    if (/<select/.test(m && m[0] || '')) n.value = new RegExp(`id="${id}"[^>]*>\\s*<option value="__mixed"`).test(html) ? '__mixed' : '';
    inputs[f.key] = n;
});
const steps = Undo.undoStack.length;
ws.bindEffectSections([a, b]);
assert.strictEqual(inputs['light.enabled'].indeterminate, true);
inputs.blend.onchange();
assert.deepStrictEqual([a.blend, b.blend], [0, 1], 'the mixed choice changes nothing');
assert.strictEqual(Undo.undoStack.length, steps);
inputs.x.onchange();
assert.strictEqual(Undo.undoStack.length, steps, 'an untouched — changes nothing');
inputs.x.value = '160';
inputs.x.onchange();
assert.deepStrictEqual([a.x, b.x], [160, 160], 'one edit sets them all');
assert.strictEqual(Undo.undoStack.length, steps + 1);
inputs.scale.value = '1.5';
inputs.scale.onchange();
assert.deepStrictEqual([a.scaleX, a.scaleY, b.scaleX, b.scaleY], [1.5, 1.5, -1.5, 1.5], 'size keeps each flip');
inputs.scale.value = '';
inputs.scale.onchange();
assert.strictEqual(a.scaleX, 1.5, 'an emptied number box is not 0');
Undo.undo(); Undo.undo();
assert.deepStrictEqual([a.x, b.x, b.scaleX], [100, 300, -2], 'undo, one step each');
// One doodad: no Placement section here (its own fields are above), and nothing mixed.
ws.renderEffectSections([a]);
assert.notStrictEqual(ws._effectSections[0].title, 'Placement');
assert.ok(!/data-mixed/.test(ws.renderEffectSections([a])));
console.log('✓ mixed values: — where picked doodads differ, half-ticked boxes, Placement, one edit sets all');

// 2. Scrubbing and stepping numbers.
const root = makeNode('div');
const label = makeNode('label');
const input = makeNode('input');
input.id = 'num-1'; input.type = 'number'; input.step = '0.05'; input.value = '1'; input.min = '0'; input.max = '3';
const seen = { input: [], change: 0 };
input.oninput = () => seen.input.push(input.value);
input.onchange = () => seen.change++;
root.querySelectorAll = sel => (sel === 'input[type=number]' ? [input] : []);
root.querySelector = sel => (sel === 'label[for="num-1"]' ? label : null);
assert.strictEqual(ws.attachNumberScrubbing(root), 1);
assert.strictEqual(ws.attachNumberScrubbing(root), 0, 'only once');
assert.ok(label.onmousedown && /Drag/.test(label.title));
label.onmousedown({ button: 0, clientX: 100, preventDefault() {} });
fireWin('mousemove', { clientX: 101 });
assert.deepStrictEqual(seen.input, [], 'a wobble is not a drag');
fireWin('mousemove', { clientX: 110 });
assert.strictEqual(input.value, '1.25', 'five steps of 0.05 for 10 pixels');
fireWin('mousemove', { clientX: 104, shiftKey: true });
assert.strictEqual(input.value, '2', 'Shift: ten steps at a time');
fireWin('mousemove', { clientX: 400 });
assert.strictEqual(input.value, '3', 'never past its maximum');
assert.strictEqual(seen.change, 0, 'previewed while dragging');
fireWin('mouseup', {});
assert.strictEqual(seen.change, 1, 'set when let go');
// A click without a drag puts the cursor in the box.
label.onmousedown({ button: 0, clientX: 50, preventDefault() {} });
fireWin('mouseup', {});
assert.ok(input.focused && seen.change === 1);
// Arrows step and apply at once.
input.value = '1';
input.fire('keydown', { key: 'ArrowUp', preventDefault() {} });
assert.strictEqual(input.value, '1.05');
input.fire('keydown', { key: 'ArrowDown', shiftKey: true, preventDefault() {} });
assert.strictEqual(input.value, '0.55');
assert.strictEqual(seen.change, 3);
input.fire('keydown', { key: 'a', preventDefault() {} });
assert.strictEqual(input.value, '0.55');
assert.strictEqual(ws.stepValue(0.1 + 0.2, 0.05), 0.3, 'no long decimals');
// The single doodad's own boxes have their label just before them.
const plainLabel = makeNode('label'), plain = makeNode('input');
plain.type = 'number'; plain.value = '5';
plain.previousElementSibling = plainLabel;
const root2 = makeNode('div');
root2.querySelectorAll = () => [plain];
root2.querySelector = () => null;
ws.attachNumberScrubbing(root2);
assert.ok(plainLabel.onmousedown, 'a label right before the box works too');
assert.ok(/attachNumberScrubbing\(content\)/.test(String(realRefresh)), 'Details wires every number box');
console.log('✓ scrubbing: drag a label (2 px a step, Shift ×10, clamped), arrows step and apply, click focuses');

// 3. Handles.
const lamp = doodad({ x: 240, y: 240, frameW: 48, frameH: 96 });
global.$dataDocsDoodads = { 1: [lamp] };
ws.selectDoodads([lamp]);
const handles = ws.transformHandles();
assert.deepStrictEqual(handles.map(h => h.corner || h.kind), ['nw', 'ne', 'sw', 'se', 'rotate']);
assert.deepStrictEqual(handles.map(h => [h.x, h.y]), [[216, 144], [264, 144], [216, 240], [264, 240], [240, 122]]);
assert.strictEqual(ws.handleAt({ x: 262, y: 146 }).corner, 'ne');
assert.strictEqual(ws.handleAt({ x: 240, y: 200 }), null);
const pebble = doodad({ x: 100, y: 100, frameW: 8, frameH: 8 });
global.$dataDocsDoodads[1].push(pebble);
ws.selectDoodads([pebble]);
assert.deepStrictEqual(ws.transformHandles().slice(0, 4).map(h => [h.x, h.y]), [[86, 82], [114, 82], [86, 110], [114, 110]], 'a tiny doodad: handles spread to 28 px');
ws.beginHandleDrag(ws.transformHandles()[1], { x: 114, y: 82 });
assert.deepStrictEqual(ws.updateHandleDrag({ x: 128, y: 64 }), { scaleX: 2, scaleY: 2 }, 'and still resize by distance from the foot');
ws.endHandleDrag();
Undo.undo();
ws.selectDoodads([lamp]);
ws.selectDoodads([lamp, a]);
assert.deepStrictEqual(ws.transformHandles(), [], 'not with several picked');
ws.selectDoodads([lamp]);
lamp.locked = true;
assert.deepStrictEqual(ws.transformHandles(), [], 'not on a locked doodad');
lamp.locked = false;
D.Perspective.liveCamera = () => ({});
assert.deepStrictEqual(ws.transformHandles(), [], 'not in 3D');
D.Perspective.liveCamera = () => null;
// The top-right corner: wider and taller around the foot (free), Shift keeps proportions.
const ne = handles[1];
ws.beginHandleDrag(ne, { x: 264, y: 144 });
assert.deepStrictEqual(ws.updateHandleDrag({ x: 288, y: 144 }), { scaleX: 2, scaleY: 1 }, 'twice as wide, same height');
assert.ok(/Size ×2 × 1 · 96×96 px/.test(ws.handleReadoutText()));
assert.deepStrictEqual(ws.updateHandleDrag({ x: 288, y: 192 }, true), { scaleX: 2, scaleY: 2 }, 'Shift: the larger change for both');
assert.ok(ws.endHandleDrag());
assert.deepStrictEqual([lamp.scaleX, lamp.scaleY, lamp.x, lamp.y], [2, 2, 240, 240], 'the foot stays put');
assert.strictEqual(Undo.labelFor(Undo.undoStack[Undo.undoStack.length - 1]), 'Move / scale');
Undo.undo();
assert.deepStrictEqual([lamp.scaleX, lamp.scaleY], [1, 1]);
// A bottom corner (level with the foot) only says how wide: the height follows. Flips are kept; tiny is limited.
lamp.scaleX = -1;
ws.beginHandleDrag(ws.transformHandles()[3], { x: 264, y: 240 });
assert.deepStrictEqual(ws.updateHandleDrag({ x: 252, y: 250 }), { scaleX: -0.5, scaleY: 0.5 });
assert.deepStrictEqual(ws.updateHandleDrag({ x: 240.1, y: 240 }), { scaleX: -0.05, scaleY: 0.05 }, 'no smaller than 5%');
ws.endHandleDrag();
Undo.undo();
lamp.scaleX = 1;
// The knob turns around the foot; Shift snaps to 15 degrees.
ws.beginHandleDrag(ws.transformHandles()[4], { x: 240, y: 122 });
assert.deepStrictEqual(ws.updateHandleDrag({ x: 358, y: 240 }), { rotation: 90 }, 'a quarter turn');
assert.deepStrictEqual(ws.updateHandleDrag({ x: 300, y: 150 }, true), { rotation: 30 }, 'snapped');
assert.ok(/Turn 30°/.test(ws.handleReadoutText()));
ws.endHandleDrag();
assert.strictEqual(lamp.rotation, 30);
Undo.undo();
assert.strictEqual(lamp.rotation, 0);
// A press and release without moving is no step.
const before = Undo.undoStack.length;
ws.beginHandleDrag(ws.transformHandles()[0], { x: 216, y: 144 });
assert.strictEqual(ws.endHandleDrag(), false);
assert.strictEqual(Undo.undoStack.length, before);
// On the canvas: a press on a handle drags it (not the doodad, not a marquee), and the click after is ignored.
byId.GameCanvas = makeNode('canvas');
byId.GameCanvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 816, height: 624 });
byId.GameCanvas.width = 816; byId.GameCanvas.height = 624;
ws.attachCanvasListeners();
ws.clientToCanvas = (x, y) => ({ x, y });
ws._onCanvasMouseDown({ button: 0, clientX: 264, clientY: 144 });
assert.ok(ws._handleDrag && !ws._drag && !ws.isMarqueeActive);
ws._onCanvasMouseMove({ buttons: 1, clientX: 288, clientY: 144, shiftKey: false });
assert.strictEqual(lamp.scaleX, 2);
assert.ok(/Size ×2/.test(byId['dd-drag-readout'].textContent));
ws._onCanvasMouseUp({ clientX: 288, clientY: 144 });
assert.ok(!ws._handleDrag && ws._suppressNextClick);
assert.ok(!byId['dd-drag-readout'] || !byId['dd-drag-readout'].parentNode, 'the readout goes');
// Hovering a handle shows a resize cursor.
const nw = ws.transformHandles()[0];
ws._onCanvasMouseMove({ buttons: 0, clientX: nw.x, clientY: nw.y, target: null });
assert.strictEqual(byId.GameCanvas.style.cursor, 'nwse-resize');
ws._onCanvasMouseMove({ buttons: 0, clientX: 600, clientY: 600, target: null });
assert.strictEqual(byId.GameCanvas.style.cursor, '', 'and back off a handle');
const g = { rects: [], circles: [], lineStyle() {}, beginFill() {}, endFill() {}, drawRect(x, y) { this.rects.push([x, y]); }, drawCircle(x, y) { this.circles.push([x, y]); }, moveTo() {}, lineTo() {} };
ws.drawTransformHandles(g);
assert.strictEqual(g.rects.length, 4);
assert.strictEqual(g.circles.length, 1);
console.log('✓ handles: corners resize round the foot (Shift: proportions), knob turns (Shift: 15°), one undo step, canvas wiring');

console.log('=== Mixed values, scrubbing and handles passed ===');
