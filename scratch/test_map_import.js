'use strict';
// 7.1.6 Bringing in Tiled and LDtk maps: both readers (flips, external tileset and level, base64/zlib, refusals),
// the plan (scale, picture layers, Overlay split, doodad pieces, walls, new MZ map), the editor's import with
// all-or-nothing pictures, and "empty tiles are floor".
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const zlib = require('zlib');
const E = require('./engine/fake_engine');

const fixtures = path.join(__dirname, 'fixtures', 'map_import');
const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-map-import-'));
process.chdir(projectRoot);
E.install();
E.setupWorld({ width: 10, height: 10, px: 1, py: 1 });
require('../Docs-Doodads.js');
const D = DocsDoodads, M = D.MapImport, W = D.Workspace;

const readJson = file => JSON.parse(fs.readFileSync(path.join(fixtures, file), 'utf8'));
const asked = [];
const readFile = rel => { asked.push(rel); return readJson(rel); };

// ---- Tiled ----
const town = readJson('town.tmj');
const tiled = M.readTiled(town, readFile, { file: 'town.tmj' });
assert.deepStrictEqual([tiled.source, tiled.width, tiled.height, tiled.tile], ['tiled', 64, 64, 16]);
assert.deepStrictEqual(asked, ['tiles/props.tsj'], 'the external tileset is read beside the map');
assert.deepStrictEqual(tiled.layers.map(l => [l.kind, l.name]), [['tiles', 'Ground'], ['objects', 'Player'], ['tiles', 'Roofs'], ['collision', 'Collision']], 'hidden layers are left out');
const ground = tiled.layers[0].tiles;
assert.strictEqual(ground.length, 16);
const flipped = ground.find(t => t.x === 16 && t.y === 32);
assert.deepStrictEqual([flipped.image, flipped.sx, flipped.sy, flipped.flipX, flipped.flipY, flipped.diagonal], ['tiles/ground.png', 16, 0, true, false, false], 'the flip bits are read and masked off');
const roof = tiled.layers[2].tiles[0];
assert.deepStrictEqual([roof.image, roof.sx, roof.sy, roof.flipY, roof.x, roof.y], ['tiles/props.png', 19, 1, true, 16, 16], 'margin and spacing place the tile; vertical flip');
assert.strictEqual(tiled.layers[2].opacity, 0.5);
const [barrel, start] = tiled.layers[1].objects;
assert.deepStrictEqual([barrel.x, barrel.y, barrel.w, barrel.h, barrel.tile.image, barrel.tile.sx, barrel.tile.sy], [16, 32, 16, 16, 'tiles/props.png', 1, 1], "a tile object's y is its bottom");
assert.strictEqual(start.tile, null);
assert.deepStrictEqual(tiled.layers[3].rects, [{ x: 0, y: 0, w: 32, h: 16 }]);

// Base64 data, plain and zlib, reads the same as an array.
const packed = Buffer.alloc(64);
town.layers[0].data.forEach((gid, i) => packed.writeUInt32LE(gid >>> 0, i * 4));
const b64 = JSON.parse(JSON.stringify(town));
b64.layers[0] = Object.assign({}, town.layers[0], { data: packed.toString('base64'), encoding: 'base64' });
assert.deepStrictEqual(M.readTiled(b64, readFile, { file: 'town.tmj' }).layers[0].tiles, ground);
b64.layers[0].data = zlib.deflateSync(packed).toString('base64'); b64.layers[0].compression = 'zlib';
assert.deepStrictEqual(M.readTiled(b64, readFile, { file: 'town.tmj', inflate: bytes => zlib.inflateSync(bytes) }).layers[0].tiles, ground);
b64.layers[0].compression = 'zstd';
assert.throws(() => M.readTiled(b64, readFile, { file: 'town.tmj' }), /zstd/);
assert.throws(() => M.readTiled(Object.assign({}, town, { infinite: true }), readFile), /Infinite/);
assert.throws(() => M.readTiled(Object.assign({}, town, { orientation: 'isometric' }), readFile), /orthogonal/);
assert.throws(() => M.readTiled(Object.assign({}, town, { tileheight: 8 }), readFile), /square/);
assert.throws(() => M.readTiled(null, readFile), /not a Tiled map/);
assert.strictEqual(M.join('maps/one.tmj', '../tiles/a.png'), 'tiles/a.png');

// ---- The plan ----
const plan = M.plan(tiled, { projectTile: 48, mapId: 7, baseName: 'Town', mapName: 'Town', tilesetId: 2 });
assert.deepStrictEqual([plan.mapId, plan.width, plan.height, plan.scale], [7, 4, 4, 3]);
assert.ok(plan.notices.some(n => /16-pixel tiles are scaled ×3/.test(n)), 'the user is told about the scale');
assert.deepStrictEqual(plan.files.map(f => [f.path, f.kind]), [
    ['img/parallaxes/Town_7_Ground.png', 'layer'], ['img/doodads/Town/props_1_1_16x16.png', 'piece'], ['img/parallaxes/Town_7_Roofs.png', 'layer']]);
assert.deepStrictEqual(plan.layers2d.map(l => [l.image, l.place, l.follow, l.loopX, l.opacity]), [['Town_7_Ground', 'back', 1, false, 1], ['Town_7_Roofs', 'front', 1, false, 0.5]],
    'layers above the Player objects go over the map; pictures move with it');
assert.deepStrictEqual([plan.files[0].width, plan.files[0].height], [192, 192]);
const scaledFlip = plan.files[0].draws.find(t => t.flipX);
assert.deepStrictEqual([scaledFlip.x, scaledFlip.y, scaledFlip.dw], [48, 96, 48]);
assert.deepStrictEqual(plan.doodads, [{ path: 'img/doodads/Town/props_1_1_16x16.png', x: 72, y: 144, frameW: 16, frameH: 16, scaleX: 3, scaleY: 3, name: 'Barrel' }]);
assert.deepStrictEqual(plan.skipped, ['Player: "Start" has no picture']);
assert.strictEqual(plan.walls.cell, 12);
assert.ok(plan.walls.cells[0][0] && plan.walls.cells[3][7] && !plan.walls.cells[0][8] && !plan.walls.cells[4][0], 'the collision rectangle is painted in cells');
assert.deepStrictEqual([plan.map.width, plan.map.height, plan.map.data.length, plan.map.tilesetId, plan.map.events], [4, 4, 96, 2, [null]]);
assert.deepStrictEqual(plan.mapInfo, { id: 7, expanded: false, name: 'Town', order: 7, parentId: 0, scrollX: 0, scrollY: 0 });
assert.throws(() => M.plan(tiled, { projectTile: 48, scale: 'refuse' }), /16 pixels/);
assert.throws(() => M.plan(Object.assign({}, tiled, { width: 16 * 300 }), { projectTile: 16 }), /256/);
assert.strictEqual(M.plan(tiled, { projectTile: 16, mapId: 1 }).scale, 1);
assert.strictEqual(M.nextMapId([null, { id: 1 }, null, { id: 5 }]), 6);

// ---- LDtk ----
const project = readJson('dungeon.ldtk');
assert.deepStrictEqual(M.levels(project).map(l => l.name), ['Level_0', 'Level_1']);
const ldtk = M.readLdtk(project, readFile, 0, { file: 'dungeon.ldtk' });
assert.deepStrictEqual([ldtk.source, ldtk.width, ldtk.height, ldtk.tile, ldtk.level], ['ldtk', 48, 32, 16, 'Level_0']);
assert.deepStrictEqual(ldtk.layers.map(l => [l.kind, l.name]), [['tiles', 'Floor'], ['collision', 'Walls'], ['objects', 'Entities']], 'LDtk lists the top layer first; the model is bottom first');
const floor = ldtk.layers[0].tiles;
assert.deepStrictEqual(floor.map(t => [t.x, t.y, t.sx, t.sy, t.flipX, t.flipY]), [[0, 0, 0, 0, false, false], [16, 0, 16, 0, true, false], [32, 16, 0, 16, true, true]]);
assert.strictEqual(floor[0].image, 'tiles/dungeon.png');
assert.deepStrictEqual(ldtk.layers[1].rects, [{ x: 0, y: 0, w: 16, h: 16 }, { x: 32, y: 16, w: 16, h: 16 }], 'IntGrid values become collision');
const chest = ldtk.layers[2].objects[0];
assert.deepStrictEqual([chest.x, chest.y, chest.tile.image, chest.tile.sx], [16, 16, 'tiles/dungeon.png', 32], 'the pivot is taken off');
asked.length = 0;
const second = M.readLdtk(project, readFile, 1, { file: 'dungeon.ldtk' });
assert.deepStrictEqual(asked, ['levels/second.ldtkl'], 'a level in its own file is read');
assert.deepStrictEqual([second.width, second.layers[0].tiles[0].sx], [16, 16]);
assert.throws(() => M.readLdtk(project, readFile, 5), /no such level/);
assert.throws(() => M.readLdtk({}, readFile), /not an LDtk/);
const ldtkPlan = M.plan(ldtk, { projectTile: 48, mapId: 8, baseName: 'Dungeon' });
assert.deepStrictEqual([ldtkPlan.width, ldtkPlan.height], [3, 2]);
assert.deepStrictEqual(ldtkPlan.layers2d.map(l => l.place), ['back'], 'with no player layer, layers below the first object layer stay behind');

// ---- Empty tiles are floor ----
const P = D.PictureMaps;
assert.strictEqual(P.passes([0, 0, 0, 0], 0x0f, true), true);
assert.strictEqual(P.passes([0, 0, 0, 2048], 0x0f, true), null, 'a real tile keeps its own passage');
assert.strictEqual(P.passes([0, 0, 0, 0], 0x0200, true), null, 'boats keep MZ\'s rules');
assert.strictEqual(P.passes([0, 0, 0, 0], 0x0f, false), null);
$gameMap.setup(1);
$dataMap.data[1 * $dataMap.width + 1] = 0; // tile (1, 1): nothing on any layer
assert.strictEqual($gameMap.checkPassage(2, 2, 0x0f), true, 'a ground tile walks as before');
assert.strictEqual($gameMap.checkPassage(1, 1, 0x0f), false, 'an empty tile is a wall by default, as in MZ');
D.Lighting.setMapSettings(1, { emptyIsFloor: true });
assert.strictEqual($gameMap.checkPassage(1, 1, 0x0f), true, 'with Empty tiles are floor it can be walked on');
assert.strictEqual($gameMap.checkPassage(1, 1, 0x0200), false);
D.Lighting.setMapSettings(1, { emptyIsFloor: undefined });

// ---- The editor's import ----
(async () => {
    fs.mkdirSync('data', { recursive: true });
    fs.writeFileSync('data/MapInfos.json', JSON.stringify([null, { id: 1, name: 'Start' }, { id: 2, name: 'Field' }]));
    D.Compat.isTest = () => true;
    const toasts = [];
    W.showToast = (text, kind) => toasts.push([text, kind]);
    let savedMap = null;
    D.Persistence.saveMapOnly = id => { savedMap = id; return true; };
    const read = W.readImportMap(path.join(fixtures, 'town.tmj'));
    assert.strictEqual(read.kind, 'tiled');
    const importPlan = W.importMapPlan(read, { baseName: 'Town' });
    assert.strictEqual(importPlan.mapId, 3, 'the next free map id');
    const io = { loadImage: async url => ({ url }), draw: file => Buffer.from(`PNG:${file.path}`) };
    const urls = [];
    const made = await W.runMapImport(read, importPlan, Object.assign({}, io, { loadImage: async url => { urls.push(url); return { url }; } }));
    assert.strictEqual(made, 3, toasts.map(t => t[0]).join(' | '));
    assert.ok(urls.length === 2 && urls.every(u => /^file:/.test(u)), 'each tileset picture is read once from beside the map');
    for (const f of importPlan.files) assert.strictEqual(fs.readFileSync(f.path, 'utf8'), `PNG:${f.path}`);
    const mapFile = JSON.parse(fs.readFileSync('data/Map003.json', 'utf8'));
    assert.deepStrictEqual([mapFile.width, mapFile.height], [importPlan.width, importPlan.height]);
    const infos = JSON.parse(fs.readFileSync('data/MapInfos.json', 'utf8'));
    assert.deepStrictEqual(infos[3], importPlan.mapInfo);
    assert.strictEqual(infos[1].name, 'Start', 'other maps are kept');
    assert.ok(fs.readdirSync('data/docs_doodads_cache/backups').some(f => /MapInfos/.test(f)), 'MapInfos.json is backed up first');
    assert.strictEqual(window.$dataMapInfos[3].name, 'Town');
    assert.deepStrictEqual($dataDocsDoodads[3].map(d => [d.bit[1], d.x, d.y, d.scaleX, d.depth]), [['img/doodads/Town/props_1_1_16x16.png', 72, 144, 3, 'sorted']]);
    assert.strictEqual(D.Lighting.mapSettings(3).emptyIsFloor, true);
    assert.strictEqual(D.Lighting.mapSettings(3).layers2d.length, 2);
    assert.ok($dataDocsDoodads.walls && $dataDocsDoodads.walls[3], 'collision is painted');
    assert.strictEqual(savedMap, 3, 'the new map\'s doodads are saved');
    assert.ok(fs.readdirSync(path.join('img', 'parallaxes')).every(f => !/ddimport/.test(f)), 'no temporary files are left');

    // A second import of the same file onto the same names stops, and writes nothing.
    const again = W.importMapPlan(read, { baseName: 'Town' });
    again.mapId = 3; again.files = importPlan.files;
    const before = fs.readdirSync('img/parallaxes').length;
    assert.strictEqual(await W.runMapImport(read, again, io), null);
    assert.ok(/already exists/.test(toasts[toasts.length - 1][0]) && toasts[toasts.length - 1][1] === 'error');
    assert.strictEqual(fs.readdirSync('img/parallaxes').length, before, 'nothing is written when one file is in the way');
    const partial = W.writeImportFiles([{ path: 'img/parallaxes/New.png', bytes: Buffer.from('a') }, { path: importPlan.files[0].path, bytes: Buffer.from('b') }]);
    assert.ok(!partial.ok && !fs.existsSync('img/parallaxes/New.png'), 'all or nothing');

    // Outside a playtest nothing is imported.
    D.Compat.isTest = () => false;
    assert.strictEqual(await W.runMapImport(read, importPlan, io), null);

    // The menu entry and the map setting.
    assert.ok(W.menus().find(m => m.id === 'map').items.some(i => i.id === 'dd-map-import-btn' && i.label === 'Import Map'));
    assert.ok(W.mapSections.some(s => /Empty tiles are floor/.test(s.render.call(W, {}))));
    const ldtkRead = W.readImportMap(path.join(fixtures, 'dungeon.ldtk'), 1);
    assert.deepStrictEqual([ldtkRead.kind, ldtkRead.levels.length, ldtkRead.model.level], ['ldtk', 2, 'Level_1']);
    console.log('Map import: Tiled and LDtk readers, flips, external files, base64/zlib, plan, scale, layers, pieces, walls, new map, all-or-nothing and empty-tile floor passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
