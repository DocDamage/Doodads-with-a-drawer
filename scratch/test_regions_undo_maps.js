// scratch/test_regions_undo_maps.js
// The Regions tool (painting region numbers into the map data, one undo step per stroke, the legend
// and the overlay with terrain tags) and undo history kept per map (steps wait while the editor is on
// another map and come back with it, unless MZ changed the map file meanwhile).
const assert = require('assert');

console.log('=== Testing the Region Brush and Undo per Map ===');

const byId = {};
function makeNode(tag) {
    return {
        tagName: String(tag).toUpperCase(), style: {}, childNodes: [], parentNode: null, textContent: '', value: '', checked: false,
        get innerHTML() { return this._html || ''; },
        set innerHTML(v) {
            this._html = v;
            this.childNodes = [];
            this._rows = [];
            for (const m of String(v).matchAll(/data-region="(\d+)"/g)) this._rows.push({ getAttribute: () => m[1] });
        },
        querySelectorAll(sel) { return sel === '.dd-region-row' ? this._rows || [] : []; },
        appendChild(c) { this.childNodes.push(c); c.parentNode = this; if (c.id) byId[c.id] = c; return c; },
        removeChild(c) { this.childNodes = this.childNodes.filter(x => x !== c); c.parentNode = null; return c; },
        setAttribute() {}, addEventListener() {}, removeEventListener() {}, querySelector: () => null, remove() {},
        classList: { add() {}, remove() {}, contains: () => false, toggle() {} }
    };
}
global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.document = { body: makeNode('body'), documentElement: makeNode('html'), createElement: makeNode, getElementById: id => byId[id] || null, querySelectorAll: () => [], addEventListener() {}, removeEventListener() {} };
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: opt => opt === 'test' };
global.PluginManager = { parameters: () => ({}) };

// A 4 x 3 map; regions in the sixth layer. Tile (3, 2) has terrain tag 2.
const W = 4, H = 3;
const blank = () => ({ width: W, height: H, data: new Array(W * H * 6).fill(0), events: [null] });
let mapId = 1;
const liveEvents = [];
global.$dataMap = blank();
global.$gameMap = {
    mapId: () => mapId, width: () => W, height: () => H, tileWidth: () => 48, tileHeight: () => 48,
    displayX: () => 0, displayY: () => 0, adjustX: x => x, adjustY: y => y,
    terrainTag: (x, y) => (x === 3 && y === 2 ? 2 : 0), events: () => liveEvents
};
global.Graphics = { width: 192, height: 144 };
global.$dataDocsDoodads = { mapSettings: { 1: { regionSounds: [{ regionId: 3, name: 'Wind' }] } }, world: { traversal: { climb: { regions: '3, 7' }, fly: { noRegion: 9 } } } };

require('../Docs-Doodads.js');
const D = DocsDoodads, R = D.Regions, ws = D.Workspace, Undo = D.Undo, P = D.Persistence;
const toasts = [];
ws.showToast = (m, kind) => toasts.push([m, kind]);
ws.refreshSpriteset = () => {};
ws.refreshInspector = () => {};
ws.updateUndoButtons = () => {};
ws.currentMapId = () => mapId;
let at = { tileX: 0, tileY: 0 };
ws.clientToMapCoords = () => ({ tileX: at.tileX, tileY: at.tileY, x: at.tileX * 48, y: at.tileY * 48 });
const stats = {};
D.FS.stat = p => stats[p] || null;
D.FS.readJson = () => blank();

(async () => {
    // 1. Pure helpers.
    assert.strictEqual(R.layerIndex(W, H, 1, 2), (5 * H + 2) * W + 1);
    const data = blank().data;
    data[R.layerIndex(W, H, 2, 1)] = 5;
    assert.strictEqual(R.get(data, W, H, 2, 1), 5);
    assert.strictEqual(R.get(data, W, H, -1, 0), 0, 'off the map');
    assert.strictEqual(R.footprint(0, 0, 1, W, H).length, 4, 'clipped to the map');
    assert.strictEqual(R.footprint(1, 1, 1, W, H).length, 9);
    assert.strictEqual(R.footprint(1, 1, 99, W, H).length, 12, 'at most 6, and never past the edge');
    const colors = [1, 2, 3, 4, 5].map(id => R.color(id));
    assert.ok(colors.every(c => Number.isInteger(c) && c >= 0 && c <= 0xffffff) && new Set(colors).size === 5);
    assert.deepStrictEqual(R.counts(data, W, H), { 5: 1 });
    assert.deepStrictEqual(R.counts(null, W, H), {});
    const uses = R.uses({ traversal: { climb: { regions: '3, 7' }, ice: { regions: '4' }, jump: { noRegion: 2 }, swim: { noRegion: 0 }, fly: { noRegion: 9 } },
        reflections: { regionId: 6 }, characterShadows: { occlusionRegions: [8] }, ambience: { layers: [{ kind: 'region', id: 3, sound: 'Birds' }, { kind: 'water' }] },
        footsteps: { rows: [{ kind: 'region', id: 4, sound: 'Snow' }] } }, { regionSounds: [{ regionId: 3, name: 'Wind' }] });
    assert.deepStrictEqual(uses[3], ['climbing', 'ambience: Birds', 'background sound: Wind']);
    assert.deepStrictEqual(uses[4], ['ice', 'footsteps: Snow']);
    assert.deepStrictEqual([uses[2], uses[6], uses[7], uses[8], uses[9]], [['no jumping'], ['water reflections'], ['climbing'], ['stops character shadows'], ['no flying']]);
    assert.deepStrictEqual(Object.keys(R.uses({}, null)), []);
    console.log('✓ regions: layer index, brush footprint, colours, counts, what uses each');

    // 2. Painting: the game sees it at once and Save writes it; one undo step per stroke.
    $gameMap._stagedMapData = blank();
    $gameMap._stagedMapDataId = 1;
    const staged = $gameMap._stagedMapData;
    P.dirtyMap = false;
    ws.regionBrush = { id: 3, radius: 1, showTags: false };
    at = { tileX: 1, tileY: 1 };
    assert.ok(ws.beginRegionStroke(0, 0));
    at = { tileX: 2, tileY: 1 };
    ws.regionPaintAt(0, 0);
    ws.regionPaintAt(0, 0);
    const idx = (x, y) => R.layerIndex(W, H, x, y);
    assert.strictEqual($dataMap.data[idx(0, 0)], 3);
    assert.strictEqual($dataMap.data[idx(3, 2)], 3);
    assert.strictEqual(staged.data[idx(3, 2)], 3, 'into the map Save writes too');
    assert.ok(P.dirtyMap);
    const depth = Undo.undoStack.length;
    assert.ok(ws.endRegionStroke());
    assert.strictEqual(Undo.undoStack.length, depth + 1, 'one step for the stroke');
    assert.strictEqual(Undo.labelFor(Undo.undoStack[depth]), 'Region brush stroke');
    assert.deepStrictEqual(R.counts($dataMap.data, W, H), { 3: 12 });
    Undo.undo();
    assert.deepStrictEqual(R.counts($dataMap.data, W, H), {});
    assert.deepStrictEqual(R.counts(staged.data, W, H), {});
    Undo.redo();
    assert.deepStrictEqual(R.counts(staged.data, W, H), { 3: 12 });
    // Rubbing out one tile.
    ws.regionBrush = { id: 0, radius: 0 };
    at = { tileX: 0, tileY: 0 };
    ws.beginRegionStroke(0, 0);
    ws.endRegionStroke();
    assert.strictEqual($dataMap.data[idx(0, 0)], 0);
    // A stroke that changes nothing is no step.
    const before = Undo.undoStack.length;
    ws.beginRegionStroke(0, 0);
    assert.ok(!ws.endRegionStroke());
    assert.strictEqual(Undo.undoStack.length, before);
    assert.ok(!ws.endRegionStroke(), 'no stroke');
    // Painting on a map with no data does nothing.
    const realMap = global.$dataMap;
    global.$dataMap = null;
    assert.ok(!ws.beginRegionStroke(0, 0));
    assert.strictEqual(ws.pickRegionAt(0, 0), 0);
    global.$dataMap = realMap;
    // Coming back to the map reads it from disk: the unsaved painting goes back into the game's copy.
    const painted = global.$dataMap;
    global.$dataMap = blank();
    assert.strictEqual(ws.applyStagedRegions(), 11);
    assert.deepStrictEqual(R.counts($dataMap.data, W, H), { 3: 11 });
    assert.strictEqual(ws.applyStagedRegions(), 0, 'nothing more to copy');
    $gameMap._stagedMapDataId = 2;
    global.$dataMap = blank();
    assert.strictEqual(ws.applyStagedRegions(), 0, 'never another map painting');
    $gameMap._stagedMapDataId = 1;
    global.$dataMap = painted;
    console.log('✓ painting: live and saved map data, one undo step per stroke, rubbing out, back after a reload');

    // 3. Picking, the legend and the popover.
    document.body.appendChild(Object.assign(makeNode('input'), { id: 'dd-region-id' }));
    document.body.appendChild(Object.assign(makeNode('div'), { id: 'dd-region-legend' }));
    for (const id of ['dd-region-btn', 'dd-region-rad', 'dd-region-rad-val', 'dd-region-tags']) document.body.appendChild(Object.assign(makeNode('div'), { id }));
    at = { tileX: 2, tileY: 2 };
    assert.strictEqual(ws.pickRegionAt(0, 0), 3, 'Alt+click takes the tile\'s region');
    assert.strictEqual(byId['dd-region-id'].value, '3');
    ws.setRegionBrushId(999);
    assert.strictEqual(ws.regionBrush.id, 255);
    ws.setRegionBrushId('x');
    assert.strictEqual(ws.regionBrush.id, 0);
    ws.setRegionBrushId(3);
    const legend = byId['dd-region-legend'].innerHTML;
    assert.ok(/<b>3<\/b>/.test(legend) && /11 tiles/.test(legend) && /climbing, background sound: Wind/.test(legend), legend);
    assert.ok(/<b>9<\/b>/.test(legend) && /0 tiles/.test(legend), 'regions the project uses show even when none are painted');
    assert.ok(/dd-active/.test(legend));
    byId['dd-region-legend']._rows.find(r => r.getAttribute() === '9').onclick();
    assert.strictEqual(ws.regionBrush.id, 9, 'a legend row picks that region');
    ws.bindRegionTool();
    byId['dd-region-rad'].oninput({ target: { value: '2' } });
    assert.strictEqual(ws.regionBrush.radius, 2);
    assert.strictEqual(byId['dd-region-rad-val'].textContent, '5', 'tiles across');
    byId['dd-region-tags'].onchange({ target: { checked: true } });
    assert.ok(ws.regionBrush.showTags);
    byId['dd-region-id'].onchange({ target: { value: '4' } });
    assert.strictEqual(ws.regionBrush.id, 4);
    ws.setPlacementTool = tool => { ws.placementTool = tool; };
    byId['dd-region-btn'].onclick();
    assert.strictEqual(ws.placementTool, 'region');
    byId['dd-region-btn'].onclick();
    assert.strictEqual(ws.placementTool, null);
    assert.ok(/Region brush off/.test(toasts[toasts.length - 1][0]));
    console.log('✓ Alt+click pick, legend (counts, uses, click to pick), size and tag options');

    // 4. The overlay.
    const g = { fills: [], rects: 0, line: [], beginFill(c) { this.fills.push(c); }, drawRect() { this.rects++; }, endFill() {}, lineStyle(w) { this.line.push(w); } };
    ws.placementTool = null;
    ws.drawRegionOverlay(g);
    assert.strictEqual(g.rects, 0, 'only while the tool is out');
    ws.placementTool = 'region';
    ws._regionHover = { tileX: 0, tileY: 0 };
    ws.regionBrush.radius = 0;
    global.PIXI = { Text: class { constructor(t) { this.text = t; this.style = {}; this.anchor = { set() {} }; } } };
    g.children = [];
    g.addChild = c => g.children.push(c);
    ws.drawRegionOverlay(g);
    assert.strictEqual(g.fills.length, 11, 'a fill per painted tile in view');
    assert.ok(g.fills.every(c => c === R.color(3)));
    const texts = g._ddRegionLabels.filter(l => l.visible).map(l => l.text);
    assert.ok(texts.includes('3') && texts.includes('T2'), 'region numbers and the terrain tag');
    assert.ok(g.line.includes(2) && g.line[g.line.length - 1] === 0, 'the brush outline, then the line style is reset');
    ws.placementTool = null;
    ws.drawRegionOverlay(g);
    assert.ok(g._ddRegionLabels.every(l => !l.visible), 'labels hide with the tool');
    console.log('✓ overlay: painted tiles, numbers, terrain tags, brush outline');

    // 5. Undo per map.
    Undo.clear();
    P.stagedMaps = {};
    P.dirtyMap = false;
    stats['data/Map001.json'] = { mtimeMs: 1, size: 10 };
    stats['data/Map002.json'] = { mtimeMs: 2, size: 20 };
    const log = [];
    const step = name => Undo.execute({ type: name, apply() { log.push('do ' + name); }, revert() { log.push('undo ' + name); } });
    step('a1');
    step('a2');
    Undo.undo();
    const stagedOne = $gameMap._stagedMapData;
    P.onMapChanging(1, 2);
    mapId = 2;
    assert.strictEqual(Undo.undoStack.length + Undo.redoStack.length, 0, 'map 2 starts with its own (no) steps');
    assert.ok(Undo.parked[1]);
    step('b1');
    P.onMapChanging(2, 1);
    mapId = 1;
    assert.deepStrictEqual(Undo.history().map(h => h.label), ['A1', 'A2'], 'map 1\'s steps are back, redo too');
    assert.strictEqual($gameMap._stagedMapData, stagedOne, 'with the map data they point into (not read again)');
    assert.ok(Undo.parked[2]);
    ws.reportStepsBack();
    assert.ok(/2 steps on this map can be undone again/.test(toasts[toasts.length - 1][0]));
    Undo.redo();
    assert.strictEqual(log[log.length - 1], 'do a2');
    // MZ changed map 2 while the editor was away: its steps go.
    stats['data/Map002.json'] = { mtimeMs: 99, size: 20 };
    P.onMapChanging(1, 2);
    mapId = 2;
    assert.strictEqual(Undo.history().length, 0);
    ws.reportStepsBack();
    assert.ok(/changed in MZ/.test(toasts[toasts.length - 1][0]));
    ws.reportStepsBack();
    // Only the last ten maps keep their steps.
    for (let m = 10; m < 22; m++) {
        step('m' + m);
        P.onMapChanging(m === 10 ? 2 : m - 1, m);
    }
    assert.strictEqual(Object.keys(Undo.parked).length, 10);
    assert.ok(!Undo.parked[1], 'the oldest went first');
    Undo.clear();
    assert.deepStrictEqual([Object.keys(Undo.parked).length, Undo.parkOrder.length], [0, 0], 'Discard clears every map\'s steps');
    console.log('✓ undo per map: steps wait and come back, dropped if MZ changed the map, last ten maps');

    // 6. Events on the map follow an undo; the staged map is kept while there are steps.
    mapId = 1;
    $gameMap._stagedMapDataId = 1;
    $gameMap._stagedMapData = { data: [], events: [null, { id: 1, x: 2, y: 2 }] };
    const ge = (id, x, y) => ({ x, y, _erased: false, eventId: () => id, locate(nx, ny) { this.x = nx; this.y = ny; } });
    const e1 = ge(1, 0, 0), e2 = ge(2, 1, 1);
    liveEvents.push(e1, e2);
    Undo.syncEvents();
    assert.deepStrictEqual([e1.x, e1.y], [2, 2], 'moved to where the map data has it');
    assert.ok(e2._erased && e2._docsEditorErased, 'an event the map data no longer has is hidden');
    $gameMap._stagedMapData.events[2] = { id: 2, x: 1, y: 1 };
    Undo.syncEvents();
    assert.ok(!e2._erased, 'and shows again when it comes back');
    $gameMap._stagedMapDataId = 5;
    e1.locate(0, 0);
    Undo.syncEvents();
    assert.deepStrictEqual([e1.x, e1.y], [0, 0], 'never from another map\'s data');
    $gameMap._stagedMapDataId = 1;
    const keep = $gameMap._stagedMapData;
    P.sessionSnapshots['data/Map001.json'] = { mtimeMs: 1, size: 10 };
    stats['data/Map001.json'] = { mtimeMs: 1, size: 10 };
    P.dirtyMap = false;
    step('c1');
    P.captureSession();
    assert.strictEqual($gameMap._stagedMapData, keep, 'kept while steps point into it');
    stats['data/Map001.json'] = { mtimeMs: 5, size: 10 };
    P.captureSession();
    assert.strictEqual($gameMap._stagedMapData, null, 'dropped once MZ changed the file');
    assert.strictEqual(Undo.history().length, 0, 'and its steps with it');
    console.log('✓ events follow undo; staged map kept for its steps unless the file changed');

    // 7. The Steps panel names the map's steps and the others.
    document.body.appendChild(Object.assign(makeNode('div'), { id: 'dd-undo-history' }));
    document.body.appendChild(Object.assign(makeNode('button'), { id: 'dd-undo-history-close' }));
    Undo.parked[7] = { undo: [{}], redo: [] };
    ws.renderUndoHistory();
    const html = byId['dd-undo-history'].innerHTML;
    assert.ok(/Steps on this map/.test(html) && /1 other map keeps its own steps/.test(html), html);
    Undo.clear();
    console.log('✓ Steps panel: this map\'s steps, and how many other maps keep theirs');

    console.log('All region brush and undo per map tests passed.');
})().catch(e => { console.error(e); process.exit(1); });
