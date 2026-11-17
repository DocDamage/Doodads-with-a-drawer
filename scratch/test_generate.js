'use strict';
const assert = require('assert');
const E = require('./engine/fake_engine');

E.install();
E.setupWorld();
require('../Docs-Doodads.js');

const D = DocsDoodads;
const G = D.Generate;
assert.ok(G, 'seeded map generator exists in the game build');

const stamp = {
    id: 'cross-room', name: 'Cross Room', w: 5, h: 5,
    doors: [{ x: 0, y: 2, side: 'west' }, { x: 4, y: 2, side: 'east' }, { x: 2, y: 0, side: 'north' }, { x: 2, y: 4, side: 'south' }]
};
const originalRandom = Math.random;
Math.random = () => { throw new Error('generated maps must never use Math.random'); };
let first;
try {
    first = G.dungeon({ w: 40, h: 30, count: 8, seed: 'same place', rooms: [stamp] });
    const again = G.dungeon({ w: 40, h: 30, count: 8, seed: 'same place', rooms: [stamp] });
    assert.deepStrictEqual(again, first, 'the same seed is byte-for-byte deterministic');
    assert.notDeepStrictEqual(G.dungeon({ w: 40, h: 30, count: 8, seed: 'another place', rooms: [stamp] }), first,
        'a different seed changes the dungeon');
} finally {
    Math.random = originalRandom;
}

assert.ok(first.rooms.length >= 2 && first.rooms.length <= 8);
for (let i = 0; i < first.rooms.length; i++) {
    const a = first.rooms[i];
    assert.strictEqual(a.templateId, stamp.id);
    for (let j = i + 1; j < first.rooms.length; j++) {
        const b = first.rooms[j];
        assert.ok(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y,
            `rooms ${i} and ${j} never overlap`);
    }
}
assert.ok(first.doors.length >= (first.rooms.length - 1) * 2, 'corridors use compatible room-stamp openings');
for (let i = 0; i < first.doors.length; i += 2) {
    if (!first.doors[i + 1]) break;
    assert.strictEqual(G.opposite(first.doors[i].side), first.doors[i + 1].side);
}

const floor = new Set(first.floor.map(p => `${p.x},${p.y}`));
const reached = D.MapCheck.reach(first.entrance, {
    width: first.w, height: first.h, loopX: false, loopY: false,
    canStep(x, y, dir) {
        const row = D.MapCheck.dirs.find(d => d[0] === dir);
        return Boolean(row && floor.has(`${x + row[1]},${y + row[2]}`));
    }
});
assert.ok(first.rooms.every(room => reached.seen[(room.cy * first.w) + room.cx] === 1), 'every room is reachable from the entrance');
assert.strictEqual(reached.seen[first.exit.y * first.w + first.exit.x], 1, 'the exit is reachable');

const tiny = G.dungeon({ w: 8, h: 8, count: 1, seed: 1 });
assert.strictEqual(tiny.rooms.length, 1, 'the smallest supported map can hold one room');
assert.throws(() => G.dungeon({ w: 10000, h: 10000, seed: 1 }), /size|large|limit/i);

const wilderness = G.wilderness({
    w: 24, h: 18, seed: 42,
    biomes: [{ id: 'forest', weight: 3 }, { id: 'meadow', weight: 2 }, { id: 'marsh', weight: 1 }],
    points: [{ x: 1, y: 2 }, { x: 20, y: 4 }, { x: 18, y: 15 }]
});
assert.deepStrictEqual(G.wilderness({
    w: 24, h: 18, seed: 42,
    biomes: [{ id: 'forest', weight: 3 }, { id: 'meadow', weight: 2 }, { id: 'marsh', weight: 1 }],
    points: [{ x: 1, y: 2 }, { x: 20, y: 4 }, { x: 18, y: 15 }]
}), wilderness);
assert.strictEqual(wilderness.biomeIds.length, 24 * 18);
assert.ok(wilderness.biomeIds.every(id => ['forest', 'meadow', 'marsh'].includes(id)));
const path = new Set(wilderness.paths.map(p => `${p.x},${p.y}`));
assert.ok(wilderness.points.every(p => path.has(`${p.x},${p.y}`)), 'every marked point is on the generated path');
for (let i = 1; i < wilderness.paths.length; i++) {
    const a = wilderness.paths[i - 1], b = wilderness.paths[i];
    assert.ok(Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= 1 || wilderness.points.some(p => p.x === b.x && p.y === b.y),
        'path tiles are contiguous within each marked-point leg');
}

// Room-stamp openings are explicit edge coordinates. Invalid/interior entries are ignored, and the
// same small notation is used by the room capture/edit form.
assert.deepStrictEqual(D.Rooms.parseDoors('N 2, east 1; south 3; W1; north 99', 5, 5), [
    { x: 2, y: 0, side: 'north' }, { x: 4, y: 1, side: 'east' },
    { x: 3, y: 4, side: 'south' }, { x: 0, y: 1, side: 'west' }
]);
assert.strictEqual(D.Rooms.formatDoors(stamp.doors), 'N2, E2, S2, W2');
const plainRecipe = G.recipe({ kind: 'dungeon', w: 16, h: 12, count: 1, floorTile: 2816, wallTile: 4352 });
assert.strictEqual(G.layout(plainRecipe, 5, [stamp]).rooms[0].templateId, null,
    'leaving room stamps unselected makes plain rooms instead of silently using every saved stamp');

const roomWithContents = Object.assign({}, stamp, {
    tiles: new Array(5 * 5 * 6).fill(0), tileWidth: 48, tileHeight: 48,
    doodads: [{ bit: [3, 'img/doodads/Chest.png'], x: 72, y: 96 }],
    events: [{ id: 1, name: 'Guard', dx: 2, dy: 2, pages: [] }]
});
for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) roomWithContents.tiles[(y * 5) + x] = 2816;

// Runtime requests keep only the recipe and resolved seed. The same record is regenerated when the
// target map is set up; generated arrays never enter $gameSystem/save contents.
assert.ok(D.GenerateRuntime && typeof D.GenerateRuntime.queue === 'function', 'runtime generator exists in the ordinary game build');
D.GenerateRuntime.setRooms([roomWithContents]);
$gameVariables.setValue(7, 123456);
const queued = D.GenerateRuntime.command({
    mapId: 1, kind: 'dungeon', seedVariable: 7, w: 24, h: 18, count: 3,
    roomIds: 'cross-room', floorTile: 2816, wallTile: 4352
});
assert.strictEqual(queued.seed, 123456, 'the seed variable is resolved when the command runs');
assert.deepStrictEqual(Object.keys($gameSystem._docsGeneratedMaps[1]).sort(), ['recipe', 'seed']);
assert.ok(!JSON.stringify($gameSystem._docsGeneratedMaps).includes('biomeIds'));
$gameMap.setup(1);
assert.ok($dataMap.data.some(id => id === 4352), 'setup applies the generated walls before the map is shown');
assert.strictEqual(D.GenerateRuntime.isMaterialized(1), true, 'a successful setup records the exact materialized map object');
assert.ok(($dataMap.events || []).some(e => e && e._docsGeneratedMap === 1), 'room events are materialized');
assert.ok((D.doodads(1) || []).some(d => d && d._docsGeneratedMap === 1), 'room doodads are materialized');
assert.throws(() => D.GenerateRuntime.queue({ mapId: 1, kind: 'dungeon', seed: 4, w: 2, h: 2 }), /size/i);
assert.strictEqual(D.GenerateRuntime.isMaterialized(1), true, 'an invalid replacement recipe leaves the working materialization active');

const generatedBeforeMissing = JSON.stringify({ map: $dataMap, doodads: D.doodads(1) });
D.GenerateRuntime.queue({ mapId: 1, kind: 'dungeon', seed: 9, w: 24, h: 18, count: 2,
    roomIds: 'room-that-was-deleted', floorTile: 2816, wallTile: 4352 });
assert.strictEqual(D.GenerateRuntime.isMaterialized(1), false, 'queuing a new recipe invalidates the previously materialized seed');
const oldWarn = console.warn; let generationWarning = '';
console.warn = (...parts) => { generationWarning = parts.map(String).join(' '); };
try { assert.strictEqual(D.GenerateRuntime.apply(1, $dataMap), null, 'a requested room missing from the loaded catalog cancels generation'); }
finally { console.warn = oldWarn; }
assert.match(generationWarning, /room stamp not loaded/i);
assert.strictEqual(D.GenerateRuntime.isMaterialized(1), false, 'failed generation is never reported as materialized');
assert.strictEqual(JSON.stringify({ map: $dataMap, doodads: D.doodads(1) }), generatedBeforeMissing,
    'a failed recipe leaves the previous generated map intact');

const apiRecord = D.api.generateMap({ mapId: 1, kind: 'wilderness', seed: 'api-seed', w: 16, h: 12,
    biomes: [{ id: 'forest', weight: 1 }], floorTile: 2816, pathTile: 1536 });
assert.strictEqual(apiRecord.seed, G.seed('api-seed'));
assert.ok(PluginManager._commands['Docs-Doodads:generateMap'], 'Generate Map plugin command is registered');

const biomeLayout = G.wilderness({ w: 16, h: 12, seed: 77,
    biomes: [{ id: 'forest', weight: 1 }, { id: 'marsh', weight: 1 }] });
const biomeRecipe = G.recipe({ kind: 'wilderness', w: 16, h: 12, biomes: [
    { id: 'forest', weight: 1, tile: 2816 }, { id: 'marsh', weight: 1, tile: 2912 }
], floorTile: 2816 });
const blankBiomeMap = { width: 16, height: 12, data: new Array(16 * 12 * 6).fill(0), events: [null] };
const biomePlan = G.plan(biomeLayout, biomeRecipe, blankBiomeMap);
const changedTiles = new Set(biomePlan.changes.filter(change => change.index < 16 * 12).map(change => D.Tiles.kind(change.after)));
assert.ok(changedTiles.size >= 2, 'different wilderness biomes can paint different MZ tiles');
D.World.set('biomes.list', [{ id: 'forest', name: 'Forest', spacing: 16, density: 20, edgeThin: 0, cluster: 0,
    entries: [{ path: 'img/doodads/Pine.png', weight: 1, scaleMin: 1, scaleMax: 1 }] }]);
D.World.set('dress.rules', [{ name: 'Rocks', where: 'open', chance: 1, spacing: 24,
    entries: [{ path: 'img/doodads/Rock.png', weight: 1, scaleMin: 1, scaleMax: 1 }] }]);
const artRecipe = G.recipe({ kind: 'wilderness', w: 16, h: 12,
    biomes: [{ id: 'forest', weight: 1, tile: 2816 }], floorTile: 2816 });
const artLayout = G.layout(artRecipe, 991, []);
const runtimeArt = D.GenerateRuntime.decorations(artLayout, artRecipe, 1, 991, [], []);
assert.ok(runtimeArt.some(d => d.bit[1] === 'img/doodads/Pine.png') && runtimeArt.some(d => d.bit[1] === 'img/doodads/Rock.png'),
    'runtime generation uses both Biome.paint and Dress.plan art');
assert.deepStrictEqual(D.GenerateRuntime.decorations(artLayout, artRecipe, 1, 991, [], []), runtimeArt,
    'runtime decoration is seeded and deterministic');
assert.deepStrictEqual(D.Workspace.generatedDecorations({ layout: artLayout, recipe: artRecipe, mapId: 1, seed: 991 }, [], []), runtimeArt,
    'editor preview and game runtime materialize the same seeded biome and dressing art');

// Generated props use their real picture size. A tall tree must not be clipped to a tile, and the
// generated data keeps the ordinary standing anchor/depth used by hand-placed art.
const loadBitmap = D.loadBitmap;
D.loadBitmap = () => ({ addLoadListener(listener) { listener({ width: 96, height: 144 }); } });
const tall = D.GenerateRuntime.makeDoodad({ path: 'img/doodads/TallTree.png', x: 96, y: 144, scale: 1, flipX: false }, 1, 991, 99);
D.loadBitmap = loadBitmap;
assert.deepStrictEqual([tall.frameW, tall.frameH, tall.anchorX, tall.anchorY, tall.depth], [96, 144, 0.5, 1, 'sorted'],
    'generated art gets its full bitmap frame and remains anchored/sorted at its base');

// Loading a save does not always call Game_Map.setup. The pending post-extract path regenerates $dataMap
// before Scene_Map creates its display objects.
const loadedMap = { width: 16, height: 12, data: new Array(16 * 12 * 6).fill(0), events: [null], tilesetId: 1 };
global.$dataMap = loadedMap;
D.GenerateRuntime.queue({ mapId: 1, kind: 'wilderness', seed: 81, w: 16, h: 12,
    biomes: [{ id: 'forest', weight: 1, tile: 2816 }], floorTile: 2816 });
D.GenerateRuntime.afterExtract();
assert.strictEqual(D.GenerateRuntime.isMaterialized(1), false, 'extracting a save clears materialization until its map data is loaded');
const migrateSaved = D.Shipped.migrateSaved; let migratedAfterGeneration = 0;
D.Shipped.migrateSaved = mapId => { migratedAfterGeneration = mapId; };
assert.ok(D.GenerateRuntime.beforeLoadedScene(), 'save-load path regenerated without calling setup');
D.Shipped.migrateSaved = migrateSaved;
assert.strictEqual(migratedAfterGeneration, 1, 'saved generated names migrate only after their doodads exist again');
assert.strictEqual(D.GenerateRuntime.isMaterialized(1), true);
assert.ok(loadedMap.data.some(Boolean), 'post-load generation restored tile data before display');

// The editor owns one preview at a time. Apply delegates all map, doodad and event mutations to one
// Undo command, so Undo returns the exact map snapshot.
assert.ok(typeof D.Workspace.showGenerateCard === 'function' && typeof D.Workspace.previewGeneratedMap === 'function');
const editorMap = { width: 16, height: 12, data: new Array(16 * 12 * 6).fill(0), events: [null] };
const editorDoodads = [];
const beforeEditor = JSON.stringify(editorMap);
const oldDoodads = global.$dataDocsDoodads;
global.$dataDocsDoodads = { 1: editorDoodads, mapSettings: {} };
D.Workspace.liveMapData = () => editorMap;
D.Workspace.currentMapId = () => 1;
D.Workspace.regionTargets = () => ({ live: editorMap, staged: editorMap });
D.Workspace.tileSize = () => ({ tw: 48, th: 48 });
D.Workspace.afterTileEdit = () => {};
D.Workspace.refreshSpriteset = () => {};
D.Workspace.updateUndoButtons = () => {};
D.Workspace.showToast = message => { D.Workspace._testToast = String(message); };
D.Workspace.mounted = true;
D.Workspace.generateOptions = { kind: 'dungeon', w: 16, h: 12, count: 2, seed: 'editor', roomIds: ['cross-room'], floorTile: 2816, wallTile: 4352 };
D.GenerateRuntime.setRooms([roomWithContents]);
D.Rooms.list = [roomWithContents]; D.Rooms.loaded = true;
const preview = D.Workspace.previewGeneratedMap(false);
assert.ok(preview && preview.layout.rooms.length, `preview creates an overlay-only layout (${D.Workspace._testToast || 'no error'})`);
assert.ok(D.Generate.plan(preview.layout, preview.recipe, editorMap, [roomWithContents]).changes.length > 0,
    'preview materializes to a non-empty reversible tile plan');
assert.strictEqual(D.Workspace.applyGeneratedMap(), true, 'preview can be applied on the same map');
assert.notStrictEqual(JSON.stringify(editorMap), beforeEditor, 'Apply changes the staged map');
assert.strictEqual(D.Undo.undoStack[D.Undo.undoStack.length - 1].type, 'generate_map');
D.Undo.undo();
assert.strictEqual(JSON.stringify(editorMap), beforeEditor, 'one Undo restores tiles and events exactly');
assert.ok(D.Workspace.menus().some(menu => menu.id === 'map' && menu.items.some(item => item.id === 'dd-generate-btn')),
    'Generate Map is an actual Map-menu command');

D.Workspace.liveMapData = () => editorMap;
D.Workspace.previewGeneratedMap(false);
const replacementMap = { width: 16, height: 12, data: new Array(16 * 12 * 6).fill(0), events: [null] };
D.Workspace.liveMapData = () => replacementMap;
assert.strictEqual(D.Workspace.applyGeneratedMap(), false, 'a same-id map reload cannot receive an old asynchronous preview');
D.Workspace.liveMapData = () => editorMap;
D.Workspace.previewGeneratedMap(false);
D.Workspace.setPlacementTool(null);
assert.strictEqual(D.Workspace._generatedPreview, null, 'Escape or another tool discards the overlay-only preview');
global.$dataDocsDoodads = oldDoodads;

const required = D.RequiredAssets.collect({ doodads: { world: {
    biomes: { list: [{ entries: [{ path: 'img/doodads/Pine.png' }] }] },
    dress: { rules: [{ entries: [{ path: 'img/doodads/Rock.png' }] }] }
} }, rooms: [roomWithContents] });
assert.ok(required.includes('img/doodads/Chest.png'), 'room-stamp art is kept by Exclude unused files deployment');
assert.ok(required.includes('img/doodads/Pine.png') && required.includes('img/doodads/Rock.png'),
    'generated biome and dressing art is kept by Exclude unused files deployment');

console.log('Generated maps: deterministic BSP rooms, stamp doors, reachability, limits, wilderness noise and paths passed.');
