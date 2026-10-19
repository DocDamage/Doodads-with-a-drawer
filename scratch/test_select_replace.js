// scratch/test_select_replace.js
// More ways to select (Select All, Same Art, by Layer, Invert), Paste in Place, and Replace Art (the
// picked doodads, or every doodad with a picture on this map or every map), with their menus and keys.
const assert = require('assert');

console.log('=== Testing Selection, Paste in Place and Replace Art ===');

const elements = {};
function el(id) {
    if (!elements[id]) elements[id] = { id, value: '', checked: false, innerHTML: '', textContent: '', style: {}, onclick: null,
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
global.PluginManager = { parameters: () => ({}) };
global.$gameMap = { mapId: () => 1, displayX: () => 0, displayY: () => 0, tileWidth: () => 48, tileHeight: () => 48, width: () => 20, height: () => 15,
    isLoopHorizontal: () => false, isLoopVertical: () => false };

require('../Docs-Doodads.js');
const D = DocsDoodads, ws = D.Workspace, Undo = D.Undo;
const toasts = [];
ws.showToast = (msg, kind) => toasts.push([msg, kind]);
ws.refreshSpriteset = () => {};
ws.refreshInspector = () => {};
ws.mounted = true;
const doodad = props => Object.assign(D.standardStruct(), { frameW: 48, frameH: 48 }, props);

const oak = (x, more) => doodad(Object.assign({ bit: [3, 'img/doodads/Oak.png'], x, y: 10 }, more));
const map1 = [
    oak(0),
    oak(10, { layer: 'top' }),
    doodad({ bit: [3, 'img\\doodads\\oak.png'], x: 20 }),       // the same picture, written another way
    doodad({ bit: [3, 'img/doodads/rock.png'], x: 30 }),
    doodad({ bit: [3, 'img/doodads/rock.png'], x: 40, editorHidden: true }),
    doodad({ bit: [3, 'img/doodads/Oak.png'], x: 50, layer: 'hidden' }),
    doodad({ bit: [1, 'Actor1', 0], x: 60 }),
    doodad({ bit: [3, 'img/doodads/Oak.png'], x: 70, locked: true })
];
global.$dataDocsDoodads = {
    1: map1,
    2: [oak(5), doodad({ bit: [3, 'img/doodads/rock.png'], x: 6 })],
    mapSettings: { 1: { layers: [{ id: 'top', name: 'Treetops' }, { id: 'hidden', name: 'Hidden', hidden: true }] } }
};
const ids = list => list.map(d => map1.indexOf(d));

(async () => {
    // 1. Select All reaches what Select can: not hidden in the editor, not on a hidden layer.
    assert.strictEqual(ws.selectAllDoodads(), 6);
    assert.deepStrictEqual(ids(ws.selectedDoodads), [0, 1, 2, 3, 6, 7]);
    assert.ok(/Picked 6/.test(toasts[toasts.length - 1][0]));
    // Ctrl+A in the editor; not while typing in a field.
    const keys = winListeners.find(l => l.type === 'keydown').fn;
    ws.selectDoodads([]);
    let prevented = false;
    keys({ key: 'a', code: 'KeyA', ctrlKey: true, target: { tagName: 'CANVAS' }, preventDefault() { prevented = true; } });
    assert.strictEqual(ws.selectedDoodads.length, 6, 'Ctrl+A picks everything');
    assert.ok(prevented, 'and the page is not text-selected');
    ws.selectDoodads([]);
    keys({ key: 'a', code: 'KeyA', ctrlKey: true, target: { tagName: 'INPUT' }, preventDefault() {} });
    assert.strictEqual(ws.selectedDoodads.length, 0, 'Ctrl+A in a field selects its text instead');
    // Invert.
    ws.selectDoodads([map1[0], map1[3]]);
    ws.invertSelection();
    assert.deepStrictEqual(ids(ws.selectedDoodads), [1, 2, 6, 7]);
    ws.selectDoodads([]);
    ws.invertSelection();
    assert.strictEqual(ws.selectedDoodads.length, 6, 'inverting nothing picks everything');
    // Same art: the same picture however its path is written; other kinds of doodad by their source.
    ws.selectSameArt(map1[0]);
    assert.deepStrictEqual(ids(ws.selectedDoodads), [0, 1, 2, 7], 'Oak.png, oak.png and img\\doodads\\oak.png match');
    ws.selectSameArt(map1[6]);
    assert.deepStrictEqual(ids(ws.selectedDoodads), [6]);
    ws.selectDoodad(map1[3]);
    ws.selectSameArt();
    assert.deepStrictEqual(ids(ws.selectedDoodads), [3], 'the hidden rock is left out');
    // By layer.
    ws.selectLayer('top');
    assert.deepStrictEqual(ids(ws.selectedDoodads), [1]);
    assert.ok(/on Treetops/.test(toasts[toasts.length - 1][0]));
    ws.selectLayer('main');
    assert.deepStrictEqual(ids(ws.selectedDoodads), [0, 2, 3, 6, 7]);
    ws.selectLayer('hidden');
    assert.strictEqual(ws.selectedDoodads.length, 0, 'a hidden layer has nothing to pick');
    assert.ok(/Nothing picked/.test(toasts[toasts.length - 1][0]));
    console.log('✓ select all (Ctrl+A), invert, same art, by layer: only what Select can reach');

    // 2. Paste in Place: same map, no offset; plain paste still offsets; Ctrl+Shift+V.
    ws._clipboardDoodads = [JSON.parse(JSON.stringify(map1[3]))];
    ws._clipboardSourceMapId = 1;
    const before = map1.length;
    ws.pasteCopied();
    assert.strictEqual(map1[map1.length - 1].x, 46, 'a plain paste is offset to be seen');
    ws.pasteCopied(true);
    const inPlace = map1[map1.length - 1];
    assert.deepStrictEqual([inPlace.x, inPlace.y], [30, 0], 'in place: the copied position');
    assert.notStrictEqual(inPlace, map1[3]);
    assert.deepStrictEqual(ws.selectedDoodads, [inPlace], 'the pasted copy is picked');
    assert.ok(/in place/.test(toasts[toasts.length - 1][0]));
    keys({ key: 'V', code: 'KeyV', ctrlKey: true, shiftKey: true, target: { tagName: 'CANVAS' }, preventDefault() {} });
    assert.deepStrictEqual([map1[map1.length - 1].x, map1[map1.length - 1].y], [30, 0], 'Ctrl+Shift+V pastes in place');
    keys({ key: 'v', code: 'KeyV', ctrlKey: true, target: { tagName: 'CANVAS' }, preventDefault() {} });
    assert.strictEqual(map1[map1.length - 1].x, 46, 'Ctrl+V still offsets');
    Undo.undo(); Undo.undo(); Undo.undo(); Undo.undo();
    assert.strictEqual(map1.length, before, 'each paste is one undo step');
    console.log('✓ paste in place (menu and Ctrl+Shift+V), plain paste still offset');

    // 3. Replace Art: the picture changes; position, depth, lights and the rest stay. The frame size
    // follows the new picture, split by the frame count of an animated doodad. Locked doodads stay.
    D.AssetIndex.list = [
        { id: 'pine', path: 'img/doodads/pine.png', fileName: 'pine.png', width: 64, height: 128, type: 'image' },
        { id: 'flame', path: 'img/doodads/flame.png', fileName: 'flame.png', width: 192, height: 48, type: 'image' },
        { id: 'song', path: 'audio/bgm/song.ogg', fileName: 'song.ogg', category: 'Audio', type: 'audio' },
        { id: 'p', path: '', fileName: 'Hut', type: 'prefab' }
    ];
    D.AssetIndex.recordUsage = () => {};
    const lamp = doodad({ bit: [3, 'img/doodads/torch.png'], x: 1, y: 2, z: 3, depth: 'above', light: { radius: 90 }, xFrame: 4, frameX: 48, frameW: 32, rotateSpeed: 2 });
    map1.push(lamp);
    const pine = D.AssetIndex.list[0];
    assert.strictEqual(ws.replaceArt([map1[0], map1[7]], pine), 1, 'the locked oak is left alone');
    assert.deepStrictEqual(map1[0].bit, [3, 'img/doodads/pine.png']);
    assert.deepStrictEqual([map1[0].frameW, map1[0].frameH, map1[0].x, map1[0].y], [64, 128, 0, 10]);
    assert.deepStrictEqual(map1[7].bit, [3, 'img/doodads/Oak.png']);
    ws.replaceArt([lamp], D.AssetIndex.list[1]);
    assert.deepStrictEqual([lamp.frameW, lamp.frameH, lamp.frameX], [48, 48, 0], 'four frames across a 192px strip');
    assert.deepStrictEqual([lamp.x, lamp.y, lamp.z, lamp.depth, lamp.light, lamp.rotateSpeed], [1, 2, 3, 'above', { radius: 90 }, 2], 'everything else stays');
    Undo.undo();
    assert.deepStrictEqual([lamp.bit[1], lamp.frameW, lamp.frameX], ['img/doodads/torch.png', 32, 48], 'undo brings the old picture back');
    Undo.undo();
    assert.deepStrictEqual(map1[0].bit, [3, 'img/doodads/Oak.png']);
    // Which doodads show a picture: this map or every map, never locked ones.
    assert.deepStrictEqual(ids(ws.doodadsShowing('img/doodads/oak.png', 'map')), [0, 1, 2, 5], 'hidden layers count; locked do not');
    assert.strictEqual(ws.doodadsShowing('img/doodads/Oak.png', 'all').length, 5, 'map 2 too');
    assert.strictEqual(ws.imageAssetAt('IMG\\doodads\\Pine.png'), pine, 'paths match however they are written');
    assert.strictEqual(ws.imageAssetAt('audio/bgm/song.ogg'), null, 'only pictures');
    assert.strictEqual(ws.imageAssetAt(''), null);
    console.log('✓ replace art: picture swapped, frames follow it, everything else and locked doodads stay, one undo step');

    // 4. The Replace Art card: picked doodads, this map or every map; it suggests the last picked picture.
    let asked = null, answer = null;
    D.Ui.form = async opts => { asked = opts; return answer; };
    ws.selectAsset(pine);
    ws.selectDoodads([map1[0], map1[3]]);
    answer = { path: 'img/doodads/flame.png', scope: 'selected' };
    assert.strictEqual(await ws.showReplaceArt(), 2);
    assert.strictEqual(asked.fields[0].value, 'img/doodads/pine.png', 'the last picture picked in the bag is suggested');
    assert.deepStrictEqual(asked.fields[0].choices, ['img/doodads/pine.png', 'img/doodads/flame.png'], 'pictures only');
    assert.deepStrictEqual(asked.fields[1].options.map(o => o.value), ['selected', 'map', 'all']);
    assert.ok(/The 2 picked/.test(asked.fields[1].options[0].label));
    assert.ok(/Oak.png on this map \(4\)/.test(asked.fields[1].options[1].label), asked.fields[1].options[1].label);
    assert.deepStrictEqual([map1[0].bit[1], map1[3].bit[1]], ['img/doodads/flame.png', 'img/doodads/flame.png']);
    Undo.undo();
    // Every map, from an Item Bag picture (no picked doodads needed).
    answer = { path: 'img/doodads/pine.png', scope: 'all' };
    assert.strictEqual(await ws.showReplaceArt('img/doodads/rock.png'), 3, 'the rock here (and the hidden one) and on map 2');
    assert.deepStrictEqual(asked.fields[1].options.map(o => o.value), ['map', 'all']);
    assert.strictEqual($dataDocsDoodads[2][1].bit[1], 'img/doodads/pine.png');
    assert.strictEqual(D.Persistence.dirtyDoodads, true);
    Undo.undo();
    assert.strictEqual($dataDocsDoodads[2][1].bit[1], 'img/doodads/rock.png', 'other maps undo too');
    // A picture not in the bag, cancelling, or nothing picked.
    answer = { path: 'img/doodads/nope.png', scope: 'map' };
    assert.strictEqual(await ws.showReplaceArt('img/doodads/rock.png'), 0);
    assert.strictEqual(toasts[toasts.length - 1][1], 'error');
    answer = null;
    assert.strictEqual(await ws.showReplaceArt('img/doodads/rock.png'), 0);
    ws.selectDoodads([map1[6]]);
    asked = null;
    assert.strictEqual(await ws.showReplaceArt(), 0, 'a character doodad has no picture to replace');
    assert.strictEqual(asked, null);
    console.log('✓ replace art card: picked, this map or every map, suggestion, pictures only, cancel and errors');

    // 5. Menus: right-clicking one of several picked doodads keeps them picked and offers the new items;
    // the empty map offers Select All, Invert and Paste in Place; the palette lists them.
    let menu = null;
    ws.showContextMenu = (x, y, items) => { menu = items.filter(i => !i.separator).map(i => i.label); };
    ws.clientToMapCoords = () => ({ x: 0, y: 0, tileX: 0, tileY: 0 });
    ws.attachCanvasListeners();
    assert.strictEqual(typeof ws._onCanvasContextMenu, 'function', 'the canvas menu handler exists');
    ws.selectDoodads([map1[0], map1[3]]);
    ws.doodadAt = () => map1[3];
    ws._onCanvasContextMenu({ preventDefault() {}, clientX: 5, clientY: 5 });
    assert.deepStrictEqual(ids(ws.selectionItems()), [0, 3], 'the selection is kept');
    for (const label of ['Select Same Art', 'Select Everything on Main', 'Replace Art...']) assert.ok(menu.includes(label), label);
    ws.doodadAt = () => map1[6];
    ws._onCanvasContextMenu({ preventDefault() {}, clientX: 5, clientY: 5 });
    assert.deepStrictEqual(ids(ws.selectionItems()), [6], 'a doodad outside the selection is picked alone');
    assert.ok(!menu.includes('Replace Art...'), 'no Replace Art for a character doodad');
    ws.doodadAt = () => null;
    global.$gameMap.eventsXy = () => [];
    ws._clipboardDoodads = [doodad({ bit: [3, 'img/doodads/rock.png'] })];
    ws._onCanvasContextMenu({ preventDefault() {}, clientX: 5, clientY: 5 });
    for (const label of ['Paste in Place (Ctrl+Shift+V)', 'Select All (Ctrl+A)', 'Invert Selection']) assert.ok(menu.includes(label), label);
    ws.mapEntries = () => [];
    const commands = ws.paletteCommands();
    const palette = commands.map(c => c.label);
    for (const label of ['Select All', 'Invert Selection', 'Select Same Art as Picked', 'Paste in Place',
        'Replace Art of Picked Doodads', 'Select Layer: Treetops']) assert.ok(palette.includes(label), label);
    // Their keys come from the shortcut table and show as key caps.
    assert.strictEqual(commands.find(c => c.label === 'Select All').keys, 'Ctrl+A');
    assert.strictEqual(commands.find(c => c.label === 'Paste in Place').keys, 'Ctrl+Shift+V');
    console.log('✓ menus and palette: selection kept on right-click, new items listed');

    console.log('=== Selection, paste in place and replace art passed ===');
})().catch(e => { console.error(e); process.exit(1); });
