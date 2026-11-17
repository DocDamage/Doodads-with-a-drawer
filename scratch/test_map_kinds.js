'use strict';
// 8.5.3 What kind of map: the four kinds' finishing rules on small hand-made plans, rooms reachable through
// doors, seeded cave walls, user copies and a pack round trip.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const E = require('./engine/fake_engine');

process.chdir(fs.mkdtempSync(path.join(os.tmpdir(), 'dd-map-kinds-')));
E.install();
E.setupWorld({ width: 10, height: 10, px: 0, py: 0 });
require('../Docs-Doodads.js');
const D = DocsDoodads, M = D.MapFrom;

// A plan from rows of letters: each letter a class (or '.' for nothing).
const fromRows = (rows, legend, kindId, options = {}) => {
    const w = rows[0].length, h = rows.length, cells = [];
    for (const row of rows) for (const ch of row) cells.push(legend[ch] || null);
    return M.finish({ w, h, kind: kindId, cells, heights: options.heights || null, features: [], options }, M.kind(kindId));
};
const at = (plan, x, y) => plan.cells[y * plan.w + x];

assert.deepStrictEqual(M.kinds().map(k => k.id), ['overworld', 'town', 'dungeon', 'room'], 'four kinds are built in');
assert.ok(M.kinds().every(k => k.classes.length && k.scale), 'each with its classes and scale');

// ---- Town: a square outline becomes a building with one door facing the road ----
const town = fromRows([
    '.......',
    '..BBB..',
    '..B.B..',
    '..BBB..',
    '.......',
    'RRRRRRR'
], { B: 'building', R: 'road' }, 'town');
assert.strictEqual(at(town, 3, 2), 'roof', 'inside is roof');
assert.strictEqual(at(town, 3, 3), 'door', 'the door is on the side facing the road');
assert.deepStrictEqual(town.features.filter(f => f.type === 'door').map(f => [f.x, f.y]), [[3, 3]], 'exactly one door');
assert.ok(['2,1', '3,1', '4,1', '2,2', '4,2', '2,3', '4,3'].every(k => { const [x, y] = k.split(',').map(Number); return at(town, x, y) === 'building'; }), 'the rest of the outline is wall');
assert.deepStrictEqual(town.features.find(f => f.type === 'building'), { type: 'building', name: '', x: 2, y: 1, w: 3, h: 3 });
const filled = fromRows(['.....', '.BBB.', '.BBB.', '.BBB.', 'RRRRR'], { B: 'building', R: 'road' }, 'town');
assert.strictEqual(at(filled, 2, 2), 'roof', 'a filled block is roofed inside too');
const gate = fromRows(['...', 'WRW', '...'], { W: 'wall', R: 'road' }, 'town');
assert.deepStrictEqual(gate.features.filter(f => f.type === 'gate').map(f => [f.x, f.y]), [[1, 1]], 'a street through a town wall is a gate');

// ---- Dungeon: lines become walls and floor, a gap is a door, every room reachable ----
const dungeon = fromRows([
    'WWWWWWWWW',
    'W...W...W',
    'W.......W',
    'W...W.S.W',
    'WWWWWWWWW'
], { W: 'wall', S: 'stairs' }, 'dungeon');
assert.strictEqual(at(dungeon, 4, 2), 'door', 'a gap in a wall is a door');
assert.strictEqual(at(dungeon, 1, 1), 'floor');
assert.strictEqual(at(dungeon, 6, 3), 'floor', 'stairs stand on floor');
assert.ok(dungeon.features.some(f => f.type === 'stairs' && f.x === 6 && f.y === 3));
const walkable = c => c === 'floor' || c === 'door';
const reach = D.MapCheck.reach({ x: 1, y: 1 }, { width: dungeon.w, height: dungeon.h, canStep(x, y, dir) {
    const [dx, dy] = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] }[dir], nx = x + dx, ny = y + dy;
    return nx >= 0 && ny >= 0 && nx < dungeon.w && ny < dungeon.h && walkable(at(dungeon, nx, ny));
} });
dungeon.cells.forEach((c, i) => { if (c === 'floor') assert.strictEqual(reach.seen[i], 1, `floor ${i % dungeon.w},${Math.floor(i / dungeon.w)} is reachable`); });
const open = fromRows(['.....', '.WWW.', '.W.W.', '.WWW.', '.....'], { W: 'wall' }, 'dungeon');
assert.strictEqual(at(open, 0, 0), null, 'outside the walls is left alone');
assert.strictEqual(at(open, 2, 2), 'floor', 'what the walls close in is floor');
const rows = ['WWWWWWWW', 'W......W', 'W......W', 'W......W', 'WWWWWWWW'];
const cave1 = fromRows(rows, { W: 'wall' }, 'dungeon', { roughen: 1, seed: 7 });
const cave2 = fromRows(rows, { W: 'wall' }, 'dungeon', { roughen: 1, seed: 7 });
const smooth = fromRows(rows, { W: 'wall' }, 'dungeon', { roughen: 0 });
assert.deepStrictEqual(cave1.cells, cave2.cells, 'the same seed gives the same cave');
assert.ok(cave1.cells.filter(c => c === 'wall').length > smooth.cells.filter(c => c === 'wall').length, 'caves roughen their walls');

// ---- Overworld: coast, mountains from height, place markers ----
const world = fromRows([
    'wwwww',
    'wwGww',
    'wwwww',
    'GGPGG',
    'GGGGG'
], { w: 'water', G: 'grass', P: 'place' }, 'overworld', { heights: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.9, 0.9, 0, 0] });
assert.strictEqual(at(world, 2, 1), 'water', 'a speck of land in the sea is smoothed away');
assert.ok(world.features.some(f => f.type === 'place' && f.x === 2 && f.y === 3), 'a place mark becomes a marker');
assert.strictEqual(at(world, 2, 3), 'grass', 'the marker stands on the land around it');
assert.strictEqual(at(world, 1, 4), 'mountain', 'high ground becomes mountains');

// ---- Room: walls round, floor in, doors and windows on the edge, furniture by name ----
const room = fromRows(['.......', '.FFFFF.', '.FFFFD.', '.FFFFF.', '.FNFFF.', '.......'], { F: 'floor', D: 'door', N: 'window' }, 'room', { name: 'Bedroom' });
assert.strictEqual(at(room, 1, 1), 'wall');
assert.strictEqual(at(room, 3, 2), 'floor');
assert.strictEqual(at(room, 5, 2), 'door', 'the door on the edge stays');
assert.strictEqual(at(room, 2, 4), 'window');
assert.ok(room.features.some(f => f.type === 'furniture' && f.name === 'Bedroom'), 'furniture follows the room name');

// ---- User kinds and packs ----
const mine = M.copyKind(M.kind('dungeon'), 'kind_caves', 'Caves');
mine.rules.roughen = 0.5;
assert.deepStrictEqual([mine.id, mine.base, mine.name], ['kind_caves', 'dungeon', 'Caves']);
assert.ok(M.kinds([mine]).some(k => k.id === 'kind_caves'), 'a user kind sits beside the built-in ones');
assert.ok(!M.kinds([Object.assign({}, mine, { id: 'town' })]).filter(k => k.id === 'town').some(k => k.name === 'Caves'), 'a user kind cannot replace a built-in one');
const caveFromCopy = M.plan({ w: 8, h: 5, cells: rows.join('').split('').map(ch => (ch === 'W' ? 0 : -1)), groups: [{ colour: [0, 0, 0], count: 1 }] }, ['wall'], M.kinds([mine]).find(k => k.id === 'kind_caves'), { seed: 7 });
assert.ok(caveFromCopy.cells.includes('floor'), 'a copy finishes as the kind it came from');
const P = D.Packs;
const gathered = P.gather({ mapKinds: ['kind_caves'] }, { mapKinds: [mine], biomes: [], dress: [], collections: {} }, () => null);
assert.deepStrictEqual(gathered.contents.mapKinds.map(k => k.id), ['kind_caves']);
const pack = P.parse(JSON.stringify({ format: P.format, version: P.version, name: 'Kinds', contents: gathered.contents, files: {}, library: {} }));
const ready = P.prepare(pack, { prefabs: new Set(), rooms: new Set(), biomes: new Set(), mapKinds: new Set(['kind_caves']) }, prefix => prefix + 'new');
assert.deepStrictEqual(ready.mapKinds.map(k => [k.id, k.name, k.rules.roughen]), [['kind_new', 'Caves', 0.5]], 'a user kind survives a pack round trip (renamed when its id is taken)');
assert.deepStrictEqual(P.parse(JSON.stringify({ format: P.format, version: P.version, contents: {} })).contents.mapKinds, [], 'older packs have none');
console.log('Kinds of map: town buildings, doors and gates, dungeon walls/floor/doors/stairs and reach, caves, overworld coast/mountains/places, rooms, copies and packs passed.');
