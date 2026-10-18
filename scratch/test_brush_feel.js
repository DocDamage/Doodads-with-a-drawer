// scratch/test_brush_feel.js
// Scatter's eraser (right-drag, the picked item only, one undo step) and its circle; the Hills brush's
// hard and soft edge, [ and ] for brush sizes and height numbers under the brush; and an editor toggle
// key that can be any key or a chord (Ctrl+Shift+E here).
const assert = require('assert');

console.log('=== Testing Brush Feel and the Toggle Key ===');

const elements = {};
function el(id) {
    if (!elements[id]) elements[id] = { id, value: '', checked: false, innerHTML: '', textContent: '', style: {}, onclick: null, oninput: null,
        childNodes: [], classList: { toggle() {}, add() {}, remove() {}, contains: () => false }, appendChild(c) { this.childNodes.push(c); },
        querySelectorAll: () => [], addEventListener() {} };
    return elements[id];
}
const winListeners = [];
global.window = global;
global.window.addEventListener = (type, fn) => winListeners.push({ type, fn });
global.window.removeEventListener = () => {};
global.document = {
    createElement: tag => ({ tagName: String(tag).toUpperCase(), style: {}, childNodes: [], appendChild(c) { this.childNodes.push(c); return c; },
        setAttribute() {}, addEventListener() {}, removeEventListener() {}, querySelectorAll: () => [] }),
    body: { appendChild() {}, removeChild() {} },
    getElementById: id => el(id),
    querySelectorAll: () => [],
    addEventListener() {},
    removeEventListener() {}
};
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: opt => opt === 'test' };
global.PluginManager = { parameters: () => ({ editKey: 'Ctrl+Shift+E' }) };
function Scene_Map() {}
global.Scene_Map = Scene_Map;
global.SceneManager = { _scene: new Scene_Map() };
class FakeText {
    constructor(text, style) { this.text = text; this.style = style; this.visible = true; this.anchor = { set: v => { this.anchorAt = v; } }; }
}
global.$gameMap = { mapId: () => 1, displayX: () => 0, displayY: () => 0, tileWidth: () => 48, tileHeight: () => 48, width: () => 20, height: () => 15,
    isLoopHorizontal: () => false, isLoopVertical: () => false, adjustX: x => x, adjustY: y => y };

require('../Docs-Doodads.js');
// Only text for the height numbers (a full PIXI before loading would build the sprite classes).
global.PIXI = { Text: FakeText };
const D = DocsDoodads, ws = D.Workspace, K = D.KeyChord, T = D.Terrain;
const toasts = [];
ws.showToast = (msg, kind) => toasts.push([msg, kind]);
ws.refreshSpriteset = () => {};
ws.refreshInspector = () => {};
const keys = winListeners.find(l => l.type === 'keydown').fn;

// 1. Key chords.
assert.deepStrictEqual(K.parse('F10'), { code: 'F10', ctrl: false, shift: false, alt: false });
assert.deepStrictEqual(K.parse('ctrl + f10'), { code: 'F10', ctrl: true, shift: false, alt: false });
assert.deepStrictEqual(K.parse('Ctrl+Shift+E'), { code: 'KeyE', ctrl: true, shift: true, alt: false });
assert.deepStrictEqual(K.parse('Alt+1'), { code: 'Digit1', ctrl: false, shift: false, alt: true });
assert.strictEqual(K.parse('`').code, 'Backquote');
assert.strictEqual(K.parse('Ctrl++').code, 'Equal', 'Ctrl++ is the plus key');
assert.strictEqual(K.parse('Numpad0').code, 'Numpad0', 'any KeyboardEvent code');
assert.deepStrictEqual(K.parse(''), { code: 'F10', ctrl: false, shift: false, alt: false }, 'nothing readable: F10');
assert.deepStrictEqual(K.parse('Ctrl+'), { code: 'F10', ctrl: false, shift: false, alt: false });
const chord = K.parse('Ctrl+F10');
assert.ok(K.matches(chord, { code: 'F10', ctrlKey: true }));
assert.ok(K.matches(chord, { code: 'F10', metaKey: true }), 'Cmd counts as Ctrl');
assert.ok(!K.matches(chord, { code: 'F10' }), 'F10 alone is not Ctrl+F10');
assert.ok(!K.matches(chord, { code: 'F10', ctrlKey: true, shiftKey: true }), 'extra Shift is another chord');
assert.ok(K.types(K.parse('E')) && K.types(K.parse('Shift+E')) && K.types(K.parse('`')));
assert.ok(!K.types(K.parse('F10')) && !K.types(K.parse('Ctrl+E')) && !K.types(K.parse('Alt+E')));
assert.strictEqual(K.label(K.parse('ctrl+shift+e')), 'Ctrl+Shift+E');
assert.strictEqual(K.label(K.parse('`')), '`');
assert.strictEqual(K.label(K.parse('Alt+Digit1')), 'Alt+1');
// The plugin's own toggle key, from the parameter.
assert.deepStrictEqual(D.editChord, { code: 'KeyE', ctrl: true, shift: true, alt: false });
let toggles = 0;
ws.toggle = () => { toggles++; };
ws.mounted = false;
const press = (code, mods, target) => {
    const e = Object.assign({ code, key: code, target: target || { tagName: 'CANVAS' }, preventDefault() { this.prevented = true; } }, mods);
    keys(e);
    return e;
};
assert.ok(press('KeyE', { ctrlKey: true, shiftKey: true }).prevented);
assert.strictEqual(toggles, 1, 'Ctrl+Shift+E opens the editor');
press('F10', {});
press('KeyE', { ctrlKey: true });
assert.strictEqual(toggles, 1, 'F10 and Ctrl+E do nothing now');
// A typing key as the toggle key: not while a field has focus.
D.editChord = K.parse('`');
press('Backquote', {}, { tagName: 'INPUT' });
assert.strictEqual(toggles, 1, 'typing ` in a field types it');
press('Backquote', {});
assert.strictEqual(toggles, 2);
D.editChord = K.parse('F10');
console.log('✓ toggle key: any key or chord (Ctrl+Shift+E), F10 if unreadable, typing keys left to fields');

// 2. Hills: a hard edge raises the whole circle the same; soft stays gentle towards the edge.
const soft = T.brushFootprint(5, 5, 2, 'soft');
const hard = T.brushFootprint(5, 5, 2, 'hard');
assert.strictEqual(soft.length, hard.length);
assert.ok(hard.every(t => t.weight === 1));
assert.strictEqual(soft.find(t => t.x === 5 && t.y === 5).weight, 1);
assert.ok(soft.find(t => t.x === 7 && t.y === 5).weight < 0.5);
assert.deepStrictEqual(T.brushFootprint(5, 5, 2), soft, 'soft is the default');
const grid = { width: 20, height: 15, heights: new Float64Array(300) };
const raisedHard = T.applyBrush({}, grid, 5, 5, { mode: 'raise', amount: 1, radius: 2, falloff: 'hard' });
const raisedSoft = T.applyBrush({}, grid, 5, 5, { mode: 'raise', amount: 1, radius: 2 });
assert.strictEqual(raisedHard['7,5'], 1, 'hard: the edge rises as much as the centre');
assert.strictEqual(raisedHard['5,5'], 1);
assert.ok(raisedSoft['7,5'] < 0.5 && raisedSoft['5,5'] === 1, 'soft: less towards the edge');
assert.deepStrictEqual(T.brushFalloffs.map(f => f.value), ['soft', 'hard']);
assert.strictEqual(ws.terrainBrush.falloff, 'soft');
console.log('✓ hills: hard and soft edges in the brush and its preview');

// 3. [ and ] change the size of the tool that is out, through its slider (clamped).
let shown = null;
el('dd-brush-rad').value = '80';
el('dd-brush-rad').oninput = e => { shown = e.target.value; ws.brushSettings.radius = Number(e.target.value); };
ws.placementTool = 'brush';
ws.mounted = true;
const bracket = (key, mods) => { const e = { key, code: key === '[' ? 'BracketLeft' : 'BracketRight', target: { tagName: 'CANVAS' }, preventDefault() { this.prevented = true; } }; Object.assign(e, mods); keys(e); return e; };
assert.ok(bracket(']').prevented);
assert.strictEqual(shown, '90');
assert.strictEqual(ws.brushSettings.radius, 90);
bracket('[');
bracket('[');
assert.strictEqual(shown, '70');
el('dd-brush-rad').value = '245';
bracket(']');
assert.strictEqual(shown, '250', 'no bigger than the slider goes');
ws.placementTool = 'terrain';
el('dd-terrain-radius').value = '0';
el('dd-terrain-radius').oninput = e => { ws.terrainBrush.radius = Number(e.target.value); };
bracket('[');
assert.strictEqual(el('dd-terrain-radius').value, '0', 'no smaller than 0 tiles');
bracket(']'); bracket(']');
assert.strictEqual(ws.terrainBrush.radius, 2);
ws.placementTool = 'biome';
el('dd-biome-rad').value = '96';
bracket(']');
assert.strictEqual(el('dd-biome-rad').value, '112');
ws.placementTool = null;
assert.ok(!bracket(']').prevented, 'with Select, [ and ] do nothing');
console.log('✓ [ and ]: Scatter, Paint and Hills sizes, clamped to their sliders');

// 4. Height numbers on the tiles under the Hills brush; hidden when the brush moves away or another tool is out.
const heights = new Float64Array(300);
heights[5 * 20 + 5] = 1.5;
heights[5 * 20 + 6] = -0.25;
T.grid = () => ({ width: 20, height: 15, heights });
const overlay = { children: [], addChild(c) { this.children.push(c); }, lineStyle() {}, beginFill() {}, endFill() {}, drawRect() {}, drawCircle(x, y, r) { this.circle = { x, y, r }; }, moveTo() {}, lineTo() {} };
ws.historyOverlayRects = () => [];
ws.symmetryFor = () => ({ mode: 'off' });
ws.placementTool = 'terrain';
ws.terrainBrush.radius = 1;
ws._terrainHover = { tileX: 5, tileY: 5 };
ws.drawEditorOverlayExtras(overlay);
const labels = overlay.children;
assert.strictEqual(labels.length, 5, 'one number per tile under the brush');
const centre = labels.find(l => l.x === 5.5 * 48 && l.y === 5.5 * 48);
assert.strictEqual(centre.text, '1.5');
assert.strictEqual(labels.find(l => l.x === 6.5 * 48).text, '-0.25');
assert.strictEqual(labels.find(l => l.x === 4.5 * 48).text, '0');
assert.ok(labels.every(l => l.visible));
ws.terrainBrush.radius = 0;
ws.drawEditorOverlayExtras(overlay);
assert.strictEqual(overlay.children.length, 5, 'labels are reused, not made again');
assert.strictEqual(labels.filter(l => l.visible).length, 1);
ws.placementTool = 'brush';
ws._brushHover = { x: 100, y: 120 };
ws.brushSettings.radius = 64;
ws.drawEditorOverlayExtras(overlay);
assert.strictEqual(labels.filter(l => l.visible).length, 0, 'no numbers with another tool');
console.log('✓ height numbers under the Hills brush, reused and hidden');

// 5. Scatter's circle, and the eraser: right-drag takes away the picked item inside it, one undo step.
assert.deepStrictEqual(overlay.circle, { x: 100, y: 120, r: 64 }, 'the Scatter circle is drawn at the brush size');
const doodad = props => Object.assign(D.standardStruct(), { frameW: 48, frameH: 48 }, props);
const grass = { id: 'g', path: 'img/doodads/grass.png', fileName: 'grass.png', width: 32, height: 32 };
const list = [
    doodad({ bit: [3, 'img/doodads/grass.png'], x: 100, y: 100 }),
    doodad({ bit: [3, 'img/doodads/Grass.png'], x: 130, y: 100 }),
    doodad({ bit: [3, 'img/doodads/rock.png'], x: 110, y: 100 }),          // other art stays
    doodad({ bit: [3, 'img/doodads/grass.png'], x: 120, y: 100, locked: true }),
    doodad({ bit: [3, 'img/doodads/grass.png'], x: 300, y: 100 }),         // outside the circle
    doodad({ bit: [3, 'img/doodads/grass.png'], x: 105, y: 105, layer: 'locked' })
];
global.$dataDocsDoodads = { 1: list, mapSettings: { 1: { layers: [{ id: 'locked', name: 'Locked', locked: true }] } } };
const original = list.slice();
ws.clientToMapCoords = (x, y) => ({ x, y, tileX: Math.floor(x / 48), tileY: Math.floor(y / 48) });
ws.brushSettings.radius = 40;
ws.attachCanvasListeners();
let menus = 0;
ws.showContextMenu = () => { menus++; };
ws.selectDoodads([list[0], list[2]]);
ws.selectedAsset = grass; // as if picked in the Item Bag while the two stay outlined
ws._onCanvasMouseDown({ button: 2, clientX: 100, clientY: 100 });
assert.ok(ws._scatterErase && ws.isBrushActive);
assert.deepStrictEqual(list.map(d => original.indexOf(d)), [2, 3, 4, 5], 'the two grass doodads in the circle go');
assert.deepStrictEqual(ws.selectionItems(), [original[2]], 'erased doodads leave the selection');
ws.drawEditorOverlayExtras(overlay);
ws._onCanvasMouseMove({ buttons: 2, clientX: 300, clientY: 110 });
assert.deepStrictEqual(list.map(d => original.indexOf(d)), [2, 3, 5], 'dragging on erases more');
let prevented = false;
ws._onCanvasContextMenu({ preventDefault() { prevented = true; }, clientX: 300, clientY: 110 });
assert.ok(prevented && menus === 0, 'no right-click menu with Scatter out');
const steps = D.Undo.undoStack.length;
ws._onCanvasMouseUp({ clientX: 300, clientY: 110 });
assert.strictEqual(ws._scatterErase, null);
assert.strictEqual(D.Undo.undoStack.length, steps + 1, 'one undo step for the stroke');
assert.strictEqual(D.Undo.labelFor(D.Undo.undoStack[D.Undo.undoStack.length - 1]), 'Scatter eraser');
assert.ok(/Erased 3/.test(toasts[toasts.length - 1][0]));
D.Undo.undo();
assert.deepStrictEqual($dataDocsDoodads[1].map(d => original.indexOf(d)), [0, 1, 2, 3, 4, 5], 'undo puts them back in order');
D.Undo.redo();
assert.strictEqual($dataDocsDoodads[1].length, 3);
// A stroke that erases nothing is no step; no picked item, no eraser.
ws._onCanvasMouseDown({ button: 2, clientX: 600, clientY: 600 });
ws._onCanvasMouseUp({ clientX: 600, clientY: 600 });
assert.strictEqual(D.Undo.undoStack.length, steps + 1);
ws.selectedAsset = null;
ws._onCanvasMouseDown({ button: 2, clientX: 100, clientY: 100 });
assert.ok(!ws._scatterErase && !ws.isBrushActive);
assert.ok(/Pick the item to erase/.test(toasts[toasts.length - 1][0]));
// Other tools keep the right-click menu.
ws.placementTool = null;
ws.doodadAt = () => null;
global.$gameMap.eventsXy = () => [];
ws._onCanvasContextMenu({ preventDefault() {}, clientX: 5, clientY: 5 });
assert.strictEqual(menus, 1);
console.log('✓ scatter eraser: right-drag, picked item only, not locked, one undo step, red circle, no menu');

console.log('=== Brush feel and toggle key passed ===');
