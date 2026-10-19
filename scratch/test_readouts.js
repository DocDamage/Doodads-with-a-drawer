// scratch/test_readouts.js
// Map readouts: the collision overlay (every doodad's box by preset, tiles blocked by doodads and by
// the map), the readout beside a dragged doodad, smart guides that also snap to base lines and tile
// lines, and the status bar (cursor, map, selection, layer, zoom, saving).
const assert = require('assert');

console.log('=== Testing Map Readouts ===');

const byId = {};
function makeNode(tag) {
    const classes = new Set();
    return {
        tagName: String(tag).toUpperCase(), style: {}, childNodes: [], parentNode: null, innerHTML: '', textContent: '',
        get className() { return Array.from(classes).join(' '); },
        set className(v) { classes.clear(); String(v).split(/\s+/).filter(Boolean).forEach(c => classes.add(c)); },
        classList: { add: c => classes.add(c), remove: c => classes.delete(c), contains: c => classes.has(c), toggle: (c, on) => (on ? classes.add(c) : classes.delete(c)) },
        appendChild(c) { this.childNodes.push(c); c.parentNode = this; if (c.id) byId[c.id] = c; return c; },
        removeChild(c) { this.childNodes = this.childNodes.filter(x => x !== c); c.parentNode = null; if (byId[c.id] === c) delete byId[c.id]; return c; },
        setAttribute() {}, addEventListener() {}, removeEventListener() {}, querySelectorAll: () => [], querySelector: () => null
    };
}
const body = makeNode('body');
global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.window.innerWidth = 1200;
global.document = {
    body, createElement: makeNode,
    getElementById: id => byId[id] || null,
    querySelectorAll: () => [],
    addEventListener() {}, removeEventListener() {}
};
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: opt => opt === 'test' };
global.PluginManager = { parameters: () => ({}) };
const blockedByMap = new Set(['3,3', '4,3']);
global.$gameMap = {
    mapId: () => 1, displayX: () => 0, displayY: () => 0, tileWidth: () => 48, tileHeight: () => 48, width: () => 20, height: () => 15,
    isLoopHorizontal: () => false, isLoopVertical: () => false, adjustX: x => x, adjustY: y => y, roundX: x => x, roundY: y => y,
    isValid: (x, y) => x >= 0 && y >= 0 && x < 20 && y < 15, isPassable: (x, y) => !blockedByMap.has(x + ',' + y)
};
global.$gameScreen = { zoomScale: () => 1.5 };
global.$dataMapInfos = [null, { name: 'Starting <Town>' }];

require('../Docs-Doodads.js');
const D = DocsDoodads, ws = D.Workspace, G = D.Guides, C = D.Collision;
ws.showToast = () => {};
ws.refreshSpriteset = () => {};
ws.refreshInspector = () => {};
const doodad = props => Object.assign(D.standardStruct(), { frameW: 48, frameH: 48 }, props);

// 1. Guides: base lines and tile lines.
// A lamp anchored at its middle stands on y = 300; a bush with its foot at the bottom lines its base up.
const lamp = G.rectOf(doodad({ x: 100, y: 300, anchorY: 0.5, frameH: 96 }));
assert.deepStrictEqual([lamp.top, lamp.bottom, lamp.base], [252, 348, 300]);
const bush = G.rectOf(doodad({ x: 400, y: 303 }));
const toBase = G.snap(bush, [lamp], 6);
assert.strictEqual(toBase.dy, -3, 'the base line lines up with the lamp\'s');
assert.ok(toBase.lines.some(l => l.axis === 'y' && l.at === 300));
// Nothing near: an edge or base goes onto a tile line, with a teal line.
const alone = G.snap({ left: 98, right: 146, top: 5, bottom: 53, base: 194 }, [], 6, { tile: { w: 48, h: 48 } });
assert.deepStrictEqual([alone.dx, alone.dy], [-2, -2], 'left edge to 96, base to 192');
assert.ok(alone.lines.every(l => l.kind === 'tile'));
assert.ok(alone.lines.some(l => l.axis === 'x' && l.at === 96) && alone.lines.some(l => l.axis === 'y' && l.at === 192));
const far = G.snap({ left: 110, right: 158, top: 10, bottom: 34, base: 34 }, [], 6, { tile: { w: 48, h: 48 } });
assert.deepStrictEqual([far.dx, far.dy, far.lines.length], [0, 0, 0], 'too far from a tile line: free');
// A doodad to line up with wins over a tile line.
const near = G.snap({ left: 99, right: 147, top: 0, bottom: 48, base: 48 }, [{ left: 101, right: 149, top: 300, bottom: 348, base: 348 }], 6, { tile: { w: 48, h: 48 } });
assert.strictEqual(near.dx, 2);
assert.ok(near.lines.some(l => l.axis === 'x' && !l.kind));
assert.deepStrictEqual(G.snap({ left: 98, right: 146, top: 0, bottom: 48 }, [], 6), { dx: 0, dy: 0, lines: [] }, 'no tile lines unless asked');
assert.strictEqual(G.unionRect([lamp, bush]).base, 303, 'several moving: the lowest base');
console.log('✓ guides: base lines, tile lines (teal) after doodads and spacing');

// 2. Collision bodies and the tiles they block agree with blocksTile.
const wall = doodad({ x: 240, y: 240, frameW: 96, frameH: 48, collision: { preset: 'full', shape: null } });
const tree = doodad({ x: 400, y: 384, frameW: 96, frameH: 144, collision: { preset: 'trunk', shape: null } });
const traced = doodad({ x: 600, y: 240, collision: { preset: 'full', shape: { x: 0, y: 0.5, w: 1, h: 0.5 } } });
const ghost = doodad({ x: 100, y: 600, collision: { preset: 'bottomHalf', shape: null }, layer: 'secret' });
const plain = doodad({ x: 700, y: 600 });
global.$dataDocsDoodads = { 1: [wall, tree, traced, ghost, plain], mapSettings: { 1: { layers: [{ id: 'secret', name: 'Secret', gameHidden: true }] } } };
assert.deepStrictEqual(C.bodyOf(wall), { x: 192, y: 192, w: 96, h: 48 });
assert.strictEqual(C.bodyOf(plain), null);
for (const d of [wall, tree, traced]) {
    const under = new Set(C.tilesUnder(C.bodyOf(d), 48, 48).map(t => t.x + ',' + t.y));
    for (let y = 0; y < 15; y++) for (let x = 0; x < 20; x++) {
        if (under.has(x + ',' + y)) assert.ok(C.blocksTile(x, y), `blocks ${x},${y}`);
    }
}
assert.deepStrictEqual(C.tilesUnder(C.bodyOf(wall), 48, 48), [{ x: 4, y: 4 }, { x: 5, y: 4 }]);
assert.ok(!C.blocksTile(2, 12), 'a doodad on a layer hidden in game does not block');
console.log('✓ collision bodies and their tiles match blocksTile');

// 3. The overlay: bodies by preset (traced shapes as custom), dim when not showing in game; tiles blocked
// by doodads and by the map; nothing in 3D.
const data = ws.collisionOverlayData({ x0: 0, y0: 0, x1: 19, y1: 14 });
assert.deepStrictEqual(data.bodies.map(b => [b.preset, b.shows]), [['full', true], ['trunk', true], ['custom', true], ['bottomHalf', false]]);
assert.ok(data.doodadTiles.has('4,4') && data.doodadTiles.has('5,4'));
assert.ok(!data.doodadTiles.has('2,12'), 'hidden doodads shade no tiles');
assert.deepStrictEqual([...data.mapTiles].sort(), ['3,3', '4,3']);
const g = { rects: [], fills: [], line: 2, lineStyle(w) { this.line = w; }, beginFill(c, a) { this.fills.push([c, a, this.line]); }, endFill() {}, drawRect(x, y, w, h) { this.rects.push([x, y, w, h]); },
    drawCircle() {}, moveTo() {}, lineTo() {}, addChild() {} };
ws.showCollision = false;
ws.drawCollisionOverlay(g);
assert.strictEqual(g.rects.length, 0, 'off: nothing drawn');
ws.showCollision = true;
D.Perspective.liveCamera = () => null;
ws.drawCollisionOverlay(g);
assert.strictEqual(g.rects.length, 2 + data.doodadTiles.size + 4, 'map tiles, doodad tiles, four bodies');
assert.ok(g.rects.some(r => r[0] === 192 && r[1] === 192 && r[2] === 96 && r[3] === 48), 'the wall\'s body');
assert.ok(g.fills.some(f => f[0] === D.Ui.mapColor('trunk')), 'coloured by preset');
assert.ok(g.fills.slice(0, 2 + data.doodadTiles.size).every(f => f[2] === 0), 'tiles have no outline left over from the selection');
g.rects = [];
D.Perspective.liveCamera = () => ({});
ws.drawCollisionOverlay(g);
assert.strictEqual(g.rects.length, 0, 'not in the 3D view');
D.Perspective.liveCamera = () => null;
console.log('✓ collision overlay: presets, dim when hidden in game, doodad and map tiles, flat maps only');

// The toggle (More, palette) is remembered and shows a key to the colours.
const prefs = {};
D.Ui.setPref = (k, v) => { prefs[k] = v; };
const root = makeNode('div');
ws.container = root;
ws.mounted = true;
const label = makeNode('span'); label.id = 'dd-collision-label'; byId[label.id] = label;
ws.toggleCollisionOverlay(false);
assert.strictEqual(byId['dd-collision-legend'], undefined);
assert.strictEqual(ws.toggleCollisionOverlay(), true);
assert.strictEqual(prefs.collisionOverlay, true);
assert.strictEqual(label.textContent, 'Hide Collision');
const legend = byId['dd-collision-legend'];
assert.ok(legend && legend.parentNode === root);
assert.ok(/Full/.test(legend.innerHTML) && /Tree trunk/.test(legend.innerHTML) && /Custom/.test(legend.innerHTML) && /Bottom half/.test(legend.innerHTML));
assert.ok(!/Thin wall/.test(legend.innerHTML), 'only presets on this map');
// A doodad given a new preset shows in the key at the next refresh (the status timer calls this).
const before = legend.innerHTML;
ws.updateCollisionLegend();
assert.strictEqual(legend.innerHTML, before);
plain.collision = { preset: 'thinWall', shape: null };
ws.updateCollisionLegend();
assert.ok(/Thin wall/.test(legend.innerHTML), 'new presets appear');
plain.collision = { preset: 'none', shape: null };
ws.toggleCollisionOverlay();
assert.strictEqual(byId['dd-collision-legend'], undefined, 'the key goes with the overlay');
assert.strictEqual(label.textContent, 'Show Collision');
ws.mapEntries = () => [];
assert.ok(ws.paletteCommands().some(c => c.label === 'Show / Hide Collision'));
console.log('✓ collision toggle: remembered, labelled, with a key to its colours');

// 4. Dragging: a readout beside the cursor with position, tile and size; gone when the drag ends.
const crate = doodad({ x: 100, y: 100, frameW: 64, frameH: 32, scaleX: -1.5, scaleY: 1.5 });
assert.strictEqual(ws.dragReadoutText(crate), 'x 100, y 100 · tile 2, 2 · 96×48 px (2×1 tiles)');
assert.strictEqual(ws.dragReadoutText(doodad({ x: 96, y: 96 })), 'x 96, y 96 · tile 2, 1 · 48×48 px (1×1 tiles)', 'standing on a tile edge is that tile');
global.$dataDocsDoodads[1].push(crate);
ws.doodadAt = () => crate;
ws.selectDoodads([]);
assert.ok(ws.beginDoodadDrag({ x: 100, y: 100 }));
ws.updateDoodadDrag({ x: 150, y: 100 }, { altKey: true });
ws.showDragReadout(300, 200);
const readout = byId['dd-drag-readout'];
assert.ok(/^x 150, y 100/.test(readout.textContent), readout.textContent);
assert.deepStrictEqual([readout.style.left, readout.style.top], ['318px', '220px']);
ws.selectDoodads([crate, wall]);
ws._drag.items = [crate, wall];
ws.showDragReadout(1190, 200);
assert.ok(/2 moving$/.test(readout.textContent));
assert.strictEqual(readout.style.left, '870px', 'kept inside the window');
ws.endDoodadDrag();
assert.strictEqual(byId['dd-drag-readout'], undefined);
D.Undo.clear();
console.log('✓ drag readout: position, tile, size, count; kept on screen; removed at the end');

// 5. Status bar.
ws.selectDoodads([]);
ws.selectedEvent = null;
ws.activeLayer = 'secret';
ws._cursor = null;
D.Persistence.dirtyDoodads = false;
D.Persistence.dirtyMap = false;
D.Persistence.lastSavedAt = 0;
assert.deepStrictEqual(ws.statusParts(), ['Tile –', 'Map 1 · Starting <Town>', 'Nothing picked', 'Layer: Secret', 'Zoom 150%', 'No changes']);
ws.clientToMapCoords = (x, y) => ({ x: x * 2, y: y * 2, tileX: Math.floor(x * 2 / 48), tileY: Math.floor(y * 2 / 48) });
const bar = makeNode('div'); bar.id = 'dd-statusbar'; byId[bar.id] = bar;
ws.trackCursor(100.4, 60);
assert.strictEqual(ws.statusParts()[0], 'Tile 4, 2 · 201, 120 px');
ws.trackCursor(10, 10, { closest: sel => (sel === '.dd-glass' ? {} : null) });
assert.strictEqual(ws.statusParts()[0], 'Tile 4, 2 · 201, 120 px', 'over a panel the last map tile stays');
ws.trackCursor(10, 10, { closest: () => null });
assert.strictEqual(ws.statusParts()[0], 'Tile 0, 0 · 20, 20 px');
ws.trackCursor(100.4, 60);
assert.ok(/Starting &lt;Town&gt;/.test(bar.innerHTML), 'the map name is escaped');
ws.selectDoodads([wall, tree]);
D.Persistence.dirtyDoodads = true;
ws.updateStatusBar();
assert.ok(/2 picked/.test(bar.innerHTML));
assert.ok(/dd-sb-unsaved">● Not saved/.test(bar.innerHTML));
D.Persistence.dirtyDoodads = false;
D.Persistence.lastSavedAt = new Date(2026, 9, 18, 9, 5).getTime();
assert.ok(/^Saved \S/.test(ws.statusParts()[5]), ws.statusParts()[5]);
ws.selectDoodads([]);
ws.selectedEvent = { gameEvent: {} };
assert.strictEqual(ws.statusParts()[2], 'An event picked');
ws.activeLayer = 'gone';
assert.strictEqual(ws.statusParts()[3], 'Layer: Main', 'an unknown layer is Main');
// The bar is built with the workspace and refreshed on a timer until it closes.
delete byId['dd-statusbar'];
const hint = makeNode('div'); hint.id = 'dd-hint'; byId[hint.id] = hint;
ws.buildStatusBar();
assert.ok(byId['dd-statusbar'] && byId['dd-statusbar'].parentNode === root);
assert.ok(hint.classList.contains('dd-hint-raised'), 'the hint bubble moves up over it');
assert.ok(ws._statusTimer);
ws.placeReadouts();
assert.strictEqual(byId['dd-statusbar'].style.left, '8px');
ws.stopStatusBar();
assert.strictEqual(ws._statusTimer, null);
// Saving records the time.
const realWrite = D.FS.atomicWriteManyJson, realBackup = D.FS.createTimestampedBackup, realConflict = D.Persistence.checkConflict;
D.FS.atomicWriteManyJson = () => ({ ok: true });
D.FS.createTimestampedBackup = () => {};
D.Persistence.checkConflict = () => false;
D.FS.stat = () => null;
D.Persistence.clearRecovery = () => {};
D.Persistence.lastSavedAt = 0;
assert.ok(D.Persistence.saveAll());
assert.ok(Date.now() - D.Persistence.lastSavedAt < 5000);
D.FS.atomicWriteManyJson = realWrite; D.FS.createTimestampedBackup = realBackup; D.Persistence.checkConflict = realConflict;
console.log('✓ status bar: cursor, map, picked, layer, zoom, saving; built, placed and stopped');

console.log('=== Map readouts passed ===');
