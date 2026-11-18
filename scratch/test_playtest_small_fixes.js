// scratch/test_playtest_small_fixes.js
// Small things found in the MZ playtest (sessions B to D): the drop toast's collision words, the Details ?
// with nothing picked, Find a Tool ranking a tool above its Help entry, a copied map kind keeping its tiles,
// Generate Map's default tiles on a tileset without that sheet, the transfer picker's first map, the ground
// brush's see-through texture parts, the tooltip clip's width and painted collision in 3D.
const assert = require('assert');

console.log('=== Testing small playtest fixes ===');

global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
const store = new Map();
global.localStorage = { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)) };
const made = [];
const element = () => {
    const e = { style: {}, children: [], appendChild(c) { this.children.push(c); return c; }, removeChild() {}, querySelectorAll: () => [],
        addEventListener() {}, setAttribute(k, v) { this[k] = v; }, getContext: () => ({}) };
    made.push(e);
    return e;
};
const byId = new Map();
global.document = {
    createElement: element,
    body: { appendChild(e) { if (e.id) byId.set(e.id, e); }, removeChild() {} },
    getElementById: id => byId.get(id) || null,
    querySelectorAll: () => [], addEventListener() {}, removeEventListener() {}
};
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: opt => opt === 'test' };
global.PluginManager = { parameters: () => ({}) };

require('../Docs-Doodads.js');
const D = DocsDoodads, ws = D.Workspace;

// 1. The toast names collision the way Details does.
{
    const toasts = [];
    ws.showToast = t => toasts.push(t);
    ws.guessEnabled = () => true;
    ws.guessKind = () => 'bush';
    ws.currentMapId = () => 1;
    window.$dataDocsDoodads = { 1: [] };
    const placed = [{ motion: { type: 'sway', amount: 0.15, speed: 0.7 }, collision: { preset: 'bottomThird', shape: null } }];
    ws.guessedPlacementToast({}, placed, {});
    assert.ok(/bottom third collision/.test(toasts[0]), toasts[0]);
    assert.ok(!/bottomThird/.test(toasts[0]), toasts[0]);
    console.log('PASS the drop toast says "bottom third collision"');
}

// 2. Details ? with nothing picked opens the map's settings; with a doodad picked, the doodads' section.
{
    const H = D.Help, details = H.panels.find(p => p.words === 'details').anchor, map = H.panels.find(p => p.words === 'map settings').anchor;
    assert.ok(details && map && details !== map);
    ws.selectedDoodads = []; ws.selectedDoodad = null; ws.selectedEvent = null;
    assert.strictEqual(H.anchorNow(details), map);
    ws.selectedDoodads = [{}];
    assert.strictEqual(H.anchorNow(details), details);
    ws.selectedDoodads = [];
    assert.strictEqual(H.anchorNow(map), map, 'other panels are unchanged');
    console.log('PASS the Details ? follows what is picked');
}

// 3. Find a Tool: a tool that fits as well comes before its guide heading, unless "help" is typed.
{
    const commands = [{ label: 'Help: More like this', group: 'Help', run() {} }, { label: 'More Like This', group: 'Map', run() {} }];
    const rank = q => ws.paletteResults(q, commands, 10).map(c => c.label);
    assert.strictEqual(rank('more like')[0], 'More Like This');
    assert.strictEqual(rank('help more like')[0], 'Help: More like this');
    console.log('PASS Find a Tool lists the tool above its Help entry');
}

// 4. A copied kind keeps the tiles chosen for the original, on each tileset.
{
    window.$dataMap = { tilesetId: 1 };
    D.Persistence.dirtyDoodads = false;
    ws.mapFromTile('overworld', 'grass', 2816);
    D.Ui.setPref('mapFromTiles', Object.assign({}, D.Ui.prefs().mapFromTiles, { '3:overworld': { sea: 2048 } }));
    const copy = ws.copyMapKind('overworld', 'Overworld (mine)');
    assert.ok(copy && copy.id !== 'overworld');
    assert.strictEqual(ws.mapFromTile(copy.id, 'grass'), 2816);
    assert.deepStrictEqual(D.Ui.prefs().mapFromTiles['3:' + copy.id], { sea: 2048 });
    console.log('PASS a copied kind keeps its tile choices');
}

// 5. Generate Map's default wall and floor move to sheets the tileset has; a typed tile is kept.
{
    const flags = []; flags[2816 + 48 * 5] = 0x0f; // the sixth A2 kind is blocked
    global.$dataTilesets = [null, { tilesetNames: ['World_A1', 'World_A2', '', '', '', 'World_B', '', '', ''], flags }];
    ws.liveMapData = () => ({ width: 30, height: 20, tilesetId: 1 });
    ws.generateOptions = Object.assign({}, ws.generateOptions, { wallTile: 4352, floorTile: 2816 });
    ws._generateTilesTyped = false;
    ws.fitGenerateSize();
    assert.strictEqual(ws.generateOptions.wallTile, D.Tiles.A2 + 48 * 5, 'no A3 or A4: the wall is a blocked A2 kind');
    assert.strictEqual(ws.generateOptions.floorTile, 2816, 'A2 is there: the floor stays');
    global.$dataTilesets[1].tilesetNames = ['A1', 'A2', 'A3', 'A4', 'A5', 'B', '', '', ''];
    ws.generateOptions.wallTile = 4352;
    ws.fitGenerateSize();
    assert.strictEqual(ws.generateOptions.wallTile, 4352);
    global.$dataTilesets[1].tilesetNames = ['A1', 'A2', '', '', '', '', '', '', ''];
    ws.generateOptions.wallTile = 4400; ws._generateTilesTyped = true;
    ws.fitGenerateSize();
    assert.strictEqual(ws.generateOptions.wallTile, 4400, 'a typed tile is never changed');
    ws._generateTilesTyped = false;
    console.log('PASS Generate Map picks tiles the tileset has');
}

// 6. The transfer picker starts on the command's destination map.
{
    ws.mapEntries = () => [{ id: 1, name: 'Town' }, { id: 2, name: 'Field' }, { id: 3, name: 'Cave' }];
    const html = ws.mapOptions(2, false);
    assert.ok(/value="2" selected/.test(html));
    byId.clear();
    document.getElementById = id => (id === 'dd-map-picker-cancel' || id === 'dd-map-picker-ok' ? {} : byId.get(id) || null);
    ws.showMapPicker('Transfer', () => {}, 3);
    const modal = made.filter(e => e.id === 'dd-map-picker').pop();
    assert.ok(modal && /value="3" selected/.test(modal.innerHTML), 'opens on map 3');
    console.log('PASS the transfer picker starts on the current destination');
}

// 7. The ground shader weighs each texture by its own alpha (premultiplied), so see-through parts show the tiles.
{
    const f = D.Ground.fragment;
    assert.ok(/vec4 c = texture2D\(uTex0/.test(f), 'textures are read with their alpha');
    assert.ok(/gl_FragColor = c \/ total \* a;/.test(f));
    console.log('PASS see-through texture parts are not drawn black');
}

// 8. The tooltip clip grows to the tooltip's width in whole steps.
{
    global.getComputedStyle = () => ({ paddingLeft: '9px', paddingRight: '9px' });
    const C = D.ToolClips, art = D.ToolClipArt;
    assert.strictEqual(C.scaleFor({ clientWidth: art.frameW * 3 + 18 }), 3);
    assert.strictEqual(C.scaleFor({ clientWidth: 60 }), C.scale, 'never smaller than usual');
    console.log('PASS the tooltip clip fills the tooltip');
}

// 9. Painted collision is drawn on the ground in 3D.
{
    global.Graphics = { width: 816, height: 624 };
    global.$gameMap = { displayX: () => 0, displayY: () => 0, tileWidth: () => 48, tileHeight: () => 48 };
    const grid = D.Walls.blank(4, 4, 12, {});
    grid.cells[1][1] = 1;
    ws.wallGrid = () => grid;
    ws.placementTool = 'walls';
    const cam = { C: { x: 0, y: 600, z: 400 }, F: { x: 0, y: -0.6, z: -0.8 }, R: { x: 1, y: 0, z: 0 }, U: { x: 0, y: 0.8, z: -0.6 }, focal: 600, width: 816, height: 624 };
    D.Perspective.groundPoint = (c, x, y) => ({ x, y, z: 0, visible: true });
    const polys = [];
    ws.drawWalls3d({ lineStyle() {}, beginFill() {}, endFill() {}, drawPolygon: p => polys.push(p) }, cam);
    assert.strictEqual(polys.length, 1);
    assert.strictEqual(polys[0].length, 8);
    ws.placementTool = null; ws.showCollision = false;
    polys.length = 0;
    ws.drawWalls3d({ lineStyle() {}, beginFill() {}, endFill() {}, drawPolygon: p => polys.push(p) }, cam);
    assert.strictEqual(polys.length, 0, 'only with the Collision tool or overlay on');
    console.log('PASS painted collision shows in 3D');
}

console.log('\nAll small playtest fix tests passed.');
