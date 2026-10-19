// scratch/test_placement_tools.js
// Path tool, prefabs, rule-based scatter, smart guides with drag-moving, and cross-map editing
// (clipboard, send to map, edge mirroring, and staged map edits that follow their own map).
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log("=== Testing Placement Tools ===");

const elements = {};
function el(id) {
    if (!elements[id]) elements[id] = { id, value: '', checked: false, innerHTML: '', textContent: '', style: {}, classList: { toggle() {}, add() {}, remove() {} },
        appendChild() {}, querySelectorAll: () => [], addEventListener() {} };
    return elements[id];
}
global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.document = {
    createElement: () => ({ style: {}, appendChild() {}, removeChild() {}, querySelectorAll: () => [], addEventListener() {}, getContext: () => ({}) }),
    body: { appendChild() {}, removeChild() {} },
    getElementById: (id) => el(id)
};
global.Utils = { RPGMAKER_NAME: "MZ", isNwjs: () => true, isOptionValid: (opt) => opt === "test" };
global.PluginManager = { parameters: () => ({}) };
let currentMapId = 1;
global.$gameMap = { mapId: () => currentMapId, displayX: () => 0, displayY: () => 0, tileWidth: () => 48, tileHeight: () => 48,
    width: () => 20, height: () => 15, regionId: () => 0, terrainTag: () => 0, isPassable: () => true };
global.$dataDocsDoodads = { 1: [] };

const sandbox = path.join(__dirname, 'placement_tools_fixture');
fs.rmSync(sandbox, { recursive: true, force: true });
fs.mkdirSync(path.join(sandbox, 'data'), { recursive: true });
process.on('exit', () => { process.chdir(__dirname); fs.rmSync(sandbox, { recursive: true, force: true }); });
process.chdir(sandbox);

require('../Docs-Doodads.js');
const ws = DocsDoodads.Workspace;
const Undo = DocsDoodads.Undo;
ws.showToast = () => {};
ws.refreshSpriteset = () => {};
ws.refreshInspector = () => {};
DocsDoodads.AssetIndex.save = () => {};
const near = (a, b, eps = 0.01) => Math.abs(a - b) <= eps;

// 1. Paths: evenly spaced points along a line, with start, end and corner pieces.
const Paths = DocsDoodads.Paths;
const straight = Paths.sample([{ x: 0, y: 0 }, { x: 200, y: 0 }], 50);
assert.deepStrictEqual(straight.map(p => p.x), [0, 50, 100, 150, 200]);
assert.deepStrictEqual(straight.map(p => p.kind), ['start', 'segment', 'segment', 'segment', 'end']);
assert.ok(straight.every(p => near(p.angle, 0)));
const elbow = Paths.sample([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }], 40);
const corner = elbow.find(p => p.kind === 'corner');
assert.ok(corner && corner.x === 100 && corner.y === 0, "a sharp turn gets a corner piece at the vertex");
assert.ok(elbow.every(p => p === corner || Math.hypot(p.x - corner.x, p.y - corner.y) >= 20), "nothing crowds the corner");
assert.ok(near(elbow[elbow.length - 1].angle, 90), "angles follow the path direction");
const gentle = Paths.sample([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 200, y: 10 }], 50);
assert.ok(!gentle.some(p => p.kind === 'corner'), "gentle bends are not corners");
const curve = Paths.smooth([{ x: 0, y: 0 }, { x: 100, y: 100 }, { x: 200, y: 0 }], 8);
assert.ok(curve.length > 3 && curve[0].x === 0 && curve[curve.length - 1].x === 200, "smoothing keeps the end points");
assert.deepStrictEqual(Paths.sample([{ x: 5, y: 5 }], 48).length, 1, "a single click places one piece");

// Placing a path is one undo step and uses the end/corner assets when set.
const post = { id: 'img/doodads/post.png', path: 'img/doodads/post.png', fileName: 'post.png', width: 16, height: 48, placement: {}, collision: { preset: 'none' } };
const cap = { id: 'img/doodads/cap.png', path: 'img/doodads/cap.png', fileName: 'cap.png', width: 16, height: 48, placement: {}, collision: { preset: 'none' } };
$dataDocsDoodads[1] = [];
const placedPath = ws.placePath([{ x: 0, y: 48 }, { x: 96, y: 48 }, { x: 96, y: 144 }], post,
    { spacing: 48, alignToPath: true, endAsset: cap, cornerAsset: cap, jitter: 0 });
assert.strictEqual(placedPath.length, $dataDocsDoodads[1].length);
assert.strictEqual($dataDocsDoodads[1][0].bit[1], 'img/doodads/cap.png', "the start uses the end piece");
assert.strictEqual($dataDocsDoodads[1].filter(d => d.bit[1] === 'img/doodads/cap.png').length, 3, "start, corner and end");
assert.ok($dataDocsDoodads[1].some(d => d.rotation === 90), "pieces turn with the path when aligned");
Undo.undo();
assert.strictEqual($dataDocsDoodads[1].length, 0);

// 2. Scatter: evenly spaced (Poisson-disk), deterministic per seed, and rule-aware.
const Scatter = DocsDoodads.Scatter;
const rng = Scatter.rng(42);
const points = Scatter.candidates({ x: 500, y: 500 }, 200, 40, [], 25, rng);
assert.ok(points.length >= 10, "fills the brush");
for (let i = 0; i < points.length; i++) {
    assert.ok(Math.hypot(points[i].x - 500, points[i].y - 500) <= 200);
    for (let j = i + 1; j < points.length; j++) assert.ok(Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y) >= 40);
}
const again = Scatter.candidates({ x: 500, y: 500 }, 200, 40, [], 25, Scatter.rng(42));
assert.deepStrictEqual(again, points, "the same seed scatters the same way");
const avoid = Scatter.candidates({ x: 500, y: 500 }, 100, 30, [{ x: 500, y: 500 }], 10, Scatter.rng(1));
assert.ok(avoid.every(p => Math.hypot(p.x - 500, p.y - 500) >= 30), "existing props are kept clear of");

const query = { tileWidth: 48, tileHeight: 48, width: 20, height: 15,
    regionId: (x, y) => (x < 10 ? 3 : 0), terrainTag: (x, y) => (y < 5 ? 1 : 0), isPassable: (x, y) => !(x === 12 && y === 12) };
assert.strictEqual(Scatter.allowed({ x: 100, y: 100 }, { regions: [3] }, query), true);
assert.strictEqual(Scatter.allowed({ x: 600, y: 100 }, { regions: [3] }, query), false, "outside the allowed region");
assert.strictEqual(Scatter.allowed({ x: 600, y: 600 }, { terrainTags: [1] }, query), false, "wrong terrain tag");
assert.strictEqual(Scatter.allowed({ x: 12 * 48 + 10, y: 12 * 48 + 10 }, { avoidBlocked: true }, query), false, "blocked tiles");
assert.strictEqual(Scatter.allowed({ x: -5, y: 100 }, {}, query), false, "off the map");
assert.deepStrictEqual(Scatter.parseIdList("1, 3 5,x"), [1, 3, 5]);
const v = Scatter.variation({ scaleJitter: 0.2, rotateJitter: 10, flipChance: 1, hueJitter: 30 }, Scatter.rng(7));
assert.ok(v.scale >= 0.8 && v.scale <= 1.2 && Math.abs(v.rotation) <= 10 && v.flipX === true && Math.abs(v.hue) <= 30);

// 3. Smart guides: snap edges/centres to nearby doodads and equalise spacing.
const Guides = DocsDoodads.Guides;
const others = [{ left: 0, right: 48, top: 100, bottom: 148 }, { left: 200, right: 248, top: 0, bottom: 48 }];
const moving = { left: 203, right: 251, top: 300, bottom: 348 };
const snap = Guides.snap(moving, others, 6);
assert.strictEqual(snap.dx, -3, "left edges line up");
assert.ok(snap.lines.some(l => l.axis === 'x' && l.at === 200));
assert.deepStrictEqual(Guides.snap({ left: 500, right: 548, top: 500, bottom: 548 }, others, 6), { dx: 0, dy: 0, lines: [] }, "nothing nearby, nothing snaps");
const row = [{ left: 0, right: 48, top: 0, bottom: 48 }, { left: 200, right: 248, top: 0, bottom: 48 }];
const between = Guides.snap({ left: 98, right: 146, top: 0, bottom: 48 }, row, 6);
assert.strictEqual(between.dx, 2, "equal gaps on both sides");
assert.ok(between.lines.some(l => l.kind === 'spacing'));
assert.deepStrictEqual(Guides.rectOf(Object.assign(DocsDoodads.standardStruct(), { x: 100, y: 200, frameW: 40, frameH: 60 })),
    { left: 80, right: 120, top: 140, bottom: 200, cx: 100, cy: 170, base: 200 });

// Dragging selected doodads moves them with guides, as one undo step; locked doodads stay put.
const anchor = Object.assign(DocsDoodads.standardStruct(), { x: 224, y: 48, frameW: 48, frameH: 48 });
const mover = Object.assign(DocsDoodads.standardStruct(), { x: 100, y: 300, frameW: 48, frameH: 48 });
const locked = Object.assign(DocsDoodads.standardStruct(), { x: 400, y: 300, frameW: 48, frameH: 48, locked: true });
$dataDocsDoodads[1] = [anchor, mover, locked];
ws.selectDoodads([mover, locked]);
assert.strictEqual(ws.beginDoodadDrag({ x: 100, y: 280 }), true);
ws.updateDoodadDrag({ x: 222, y: 380 }, {});
assert.strictEqual(mover.x, 224, "snapped into line with the anchor's centre");
assert.strictEqual(locked.x, 400);
assert.ok(ws.activeGuides.length > 0, "guide lines are shown while dragging");
ws.updateDoodadDrag({ x: 222, y: 380 }, { altKey: true });
assert.strictEqual(mover.x, 222, "Alt turns guides off");
ws.updateDoodadDrag({ x: 130, y: 330 }, { shiftKey: true });
assert.deepStrictEqual([mover.x, mover.y], [120, 336], "Shift snaps to the tile grid");
assert.strictEqual(ws.endDoodadDrag(), true);
assert.deepStrictEqual(ws.activeGuides, []);
Undo.undo();
assert.deepStrictEqual([mover.x, mover.y], [100, 300], "the drag undoes in one step");
ws.selectDoodads([]);
assert.strictEqual(ws.beginDoodadDrag({ x: 400, y: 280 }), false, "locked doodads cannot be dragged");

// 4. Prefabs: capture doodads and events, place copies, update the master, sync every copy.
const Prefabs = DocsDoodads.Prefabs;
Prefabs.list = [];
const lamp = Object.assign(DocsDoodads.standardStruct(), { bit: [3, 'img/doodads/lamp.png'], x: 240, y: 240, frameW: 32, frameH: 64, light: { enabled: true, radius: 100 } });
const bench = Object.assign(DocsDoodads.standardStruct(), { bit: [3, 'img/doodads/bench.png'], x: 288, y: 240, frameW: 64, frameH: 32, groupId: 'grp_old' });
const sign = { id: 4, name: 'Sign', x: 5, y: 4, note: '', pages: [{ list: [{ code: 0, indent: 0, parameters: [] }] }] };
const prefab = Prefabs.capture('Lamp Corner', [lamp, bench], [sign], { tileWidth: 48, tileHeight: 48 });
assert.strictEqual(prefab.name, 'Lamp Corner');
assert.strictEqual(prefab.doodads.length, 2);
assert.strictEqual(prefab.doodads[0].groupId, undefined, "group ids are not stored in the master");
assert.strictEqual(prefab.events.length, 1);
assert.strictEqual(prefab.thumbnail, 'img/doodads/lamp.png');
Prefabs.add(prefab);

let nextEventId = 10;
const inst = Prefabs.instantiate(prefab, { x: 480, y: 480 }, { tileWidth: 48, tileHeight: 48, allocateEventId: () => nextEventId++ });
assert.strictEqual(inst.doodads.length, 2);
assert.ok(inst.doodads[0].groupId && inst.doodads[0].groupId === inst.doodads[1].groupId, "a placed copy is grouped");
assert.strictEqual(inst.doodads[0].prefabRef.id, prefab.id);
assert.deepStrictEqual([inst.doodads[1].x - inst.doodads[0].x, inst.doodads[1].y - inst.doodads[0].y], [48, 0], "layout is preserved");
assert.strictEqual(inst.events[0].id, 10);
assert.strictEqual(inst.events[0].x - Math.floor(480 / 48), sign.x - Math.floor(prefab.origin.x / 48), "events keep their tile offset");
inst.doodads[0].light.radius = 999;
assert.strictEqual(prefab.doodads[0].light.radius, 100, "copies don't share objects with the master");

// Placing through the workspace: doodads and events in one undo step.
$dataDocsDoodads[1] = [];
$gameMap._stagedMapData = { events: [null, { id: 1, name: 'EV1', x: 0, y: 0, pages: [] }] };
$gameMap._stagedMapDataId = 1;
ws.placePrefab(prefab, { x: 480, y: 480 });
assert.strictEqual($dataDocsDoodads[1].length, 2);
assert.strictEqual($gameMap._stagedMapData.events.filter(Boolean).length, 2);
const second = ws.placePrefab(prefab, { x: 960, y: 480 });
assert.strictEqual($dataDocsDoodads[1].length, 4);

// Edit one copy, update the master from it, then sync every copy on every map.
const edited = $dataDocsDoodads[1][0];
edited.hue = 90;
$dataDocsDoodads[2] = Prefabs.instantiate(prefab, { x: 100, y: 100 }, { tileWidth: 48, tileHeight: 48 }).doodads;
ws.updatePrefabFromInstance(edited);
assert.strictEqual(Prefabs.get(prefab.id).doodads[0].hue, 90, "the master takes the instance's edits");
const synced = ws.syncPrefabInstances(prefab.id);
assert.strictEqual(synced, 3, "three copies across two maps");
assert.strictEqual($dataDocsDoodads[1][2].hue, 90);
assert.strictEqual($dataDocsDoodads[2][0].hue, 90);
assert.strictEqual($dataDocsDoodads[1][2].x, second.doodads[0].x, "copies stay where they were placed");
Undo.undo();
assert.strictEqual($dataDocsDoodads[2][0].hue, 0, "syncing undoes");

// Saving a prefab from a selection links the originals as its first copy (undoably).
const f1 = Object.assign(DocsDoodads.standardStruct(), { bit: [3, 'img/doodads/post.png'], x: 48, y: 48 });
const f2 = Object.assign(DocsDoodads.standardStruct(), { bit: [3, 'img/doodads/post.png'], x: 96, y: 48 });
currentMapId = 1;
$dataDocsDoodads[1] = [f1, f2];
$gameMap._stagedMapData = { events: [null] };
$gameMap._stagedMapDataId = 1;
ws.selectDoodads([f1, f2]);
const fence = ws.savePrefabFromSelection('Fence', true);
assert.ok(f1.prefabRef && f1.prefabRef.id === fence.id && f1.prefabRef.instance === f2.prefabRef.instance, 'the selection becomes a linked copy');
assert.ok(f1.groupId && f1.groupId === f2.groupId);
assert.strictEqual(ws.syncPrefabInstances(fence.id), 1, 'the originals sync like any other copy');
Undo.undo();
Undo.undo();
assert.strictEqual(f1.prefabRef, undefined, 'linking undoes');

// Prefabs persist to their own file.
assert.ok(Prefabs.save());
const reloaded = JSON.parse(fs.readFileSync(path.join(sandbox, 'data', 'DocsDoodadsPrefabs.json'), 'utf8'));
assert.strictEqual(reloaded.prefabs[0].name, 'Lamp Corner');

// 5. Cross-map clipboard: copies survive a reload and paste in place on another map.
$dataDocsDoodads[1] = [Object.assign(DocsDoodads.standardStruct(), { x: 300, y: 300 })];
ws.selectDoodads([$dataDocsDoodads[1][0]]);
ws.copySelected();
ws._clipboardDoodads = [];
currentMapId = 3;
$dataDocsDoodads[3] = [];
ws.pasteCopied();
assert.strictEqual($dataDocsDoodads[3].length, 1, "the clipboard is read back from disk");
assert.deepStrictEqual([$dataDocsDoodads[3][0].x, $dataDocsDoodads[3][0].y], [300, 300], "pasting on another map keeps the position");
currentMapId = 1;
ws.pasteCopied();
assert.deepStrictEqual([$dataDocsDoodads[1][1].x, $dataDocsDoodads[1][1].y], [316, 316], "pasting on the same map offsets the copy");

// Send to map: copy or move, undoable.
const traveller = $dataDocsDoodads[1][0];
ws.sendDoodadsToMap([traveller], 4, 'copy');
assert.strictEqual($dataDocsDoodads[4].length, 1);
assert.notStrictEqual($dataDocsDoodads[4][0], traveller);
assert.strictEqual($dataDocsDoodads[1].includes(traveller), true);
ws.sendDoodadsToMap([traveller], 4, 'move');
assert.strictEqual($dataDocsDoodads[4].length, 2);
assert.strictEqual($dataDocsDoodads[1].includes(traveller), false);
Undo.undo();
assert.strictEqual($dataDocsDoodads[1].includes(traveller), true, "moving undoes");
assert.strictEqual($dataDocsDoodads[4].length, 1);

// 6. Edge mirroring: doodads hanging over an edge appear on the neighbouring map, and re-running replaces them.
const MapLinks = DocsDoodads.MapLinks;
const edgeTree = Object.assign(DocsDoodads.standardStruct(), { uid: 'tree1', x: 950, y: 300, frameW: 96, frameH: 144 });
const inside = Object.assign(DocsDoodads.standardStruct(), { uid: 'rock1', x: 400, y: 300, frameW: 48, frameH: 48 });
const topTree = Object.assign(DocsDoodads.standardStruct(), { uid: 'tree2', x: 400, y: 100, frameW: 96, frameH: 144 });
const sizes = { 1: { w: 960, h: 720 }, 5: { w: 480, h: 720 }, 6: { w: 960, h: 960 } };
const copies = MapLinks.edgeCopies(1, [edgeTree, inside, topTree], { east: 5, north: 6 }, id => sizes[id]);
assert.strictEqual(copies.length, 2);
const east = copies.find(c => c.mapId === 5);
assert.deepStrictEqual([east.doodad.x, east.doodad.y], [-10, 300], "shifted by this map's width");
assert.deepStrictEqual(east.doodad.mirrorOf, { mapId: 1, uid: 'tree1' });
const north = copies.find(c => c.mapId === 6);
assert.deepStrictEqual([north.doodad.x, north.doodad.y], [400, 1060], "shifted by the neighbour's height");
$dataDocsDoodads[1] = [edgeTree, inside, topTree];
$dataDocsDoodads[5] = [Object.assign(DocsDoodads.standardStruct(), { mirrorOf: { mapId: 1, uid: 'old' } }), Object.assign(DocsDoodads.standardStruct(), { uid: 'own' })];
ws.mapSizeLookup = id => sizes[id];
DocsDoodads.Lighting.setMapSettings(1, { neighbors: { east: 5, north: 6 } });
assert.strictEqual(ws.mirrorEdgeDoodads(), 2);
assert.deepStrictEqual($dataDocsDoodads[5].map(d => d.uid || (d.mirrorOf && d.mirrorOf.uid)), ['own', 'tree1'], "old mirrors are replaced, the map's own doodads stay");
Undo.undo();
assert.strictEqual($dataDocsDoodads[5][0].mirrorOf.uid, 'old');
assert.ok(MapLinks.ensureUid(Object.assign(DocsDoodads.standardStruct(), {})).uid, "doodads get a stable id when mirrored");

// 7. Staged event edits belong to their map: changing maps stashes them and saving writes each to its own file.
const Persistence = DocsDoodads.Persistence;
fs.writeFileSync(path.join(sandbox, 'data', 'Map001.json'), JSON.stringify({ events: [null] }));
fs.writeFileSync(path.join(sandbox, 'data', 'Map002.json'), JSON.stringify({ events: [null, { id: 1, name: 'Original' }] }));
currentMapId = 1;
$gameMap._stagedMapData = { events: [null, { id: 1, name: 'Added on map 1' }] };
$gameMap._stagedMapDataId = 1;
Persistence.dirtyMap = true;
Undo.execute({ apply() {}, revert() {} });
Persistence.onMapChanging(1, 2);
currentMapId = 2;
assert.strictEqual(Undo.undoStack.length + Undo.redoStack.length, 0, "map 2 starts with no steps (map 1's wait for it)");
assert.strictEqual($gameMap._stagedMapData, null, "map 2 starts without map 1's staged edits");
assert.ok(Persistence.stagedMaps[1], "map 1's edits are kept aside");
assert.strictEqual(DocsDoodads.Persistence.stagedFor(2).events[1].name, 'Original', "staging map 2 loads map 2");
$gameMap._stagedMapData.events[1].name = 'Edited on map 2';
assert.ok(Persistence.saveAll(true));
const map1 = JSON.parse(fs.readFileSync(path.join(sandbox, 'data', 'Map001.json'), 'utf8'));
const map2 = JSON.parse(fs.readFileSync(path.join(sandbox, 'data', 'Map002.json'), 'utf8'));
assert.strictEqual(map1.events[1].name, 'Added on map 1', "map 1's edits land in Map001.json");
assert.strictEqual(map2.events[1].name, 'Edited on map 2', "map 2's edits land in Map002.json");
assert.deepStrictEqual(Persistence.stagedMaps, {}, "nothing is left pending after saving");
// Coming back to a map restores its pending edits.
$gameMap._stagedMapData = null;
Persistence.stagedMaps[1] = { events: [null, { id: 1, name: 'Pending' }] };
Persistence.onMapChanging(2, 1);
assert.strictEqual($gameMap._stagedMapData.events[1].name, 'Pending');
assert.strictEqual($gameMap._stagedMapDataId, 1);

console.log("✓ Paths, scatter rules, smart guides and dragging, prefabs, cross-map clipboard, send to map, edge mirroring, and per-map staged edits verified.");
