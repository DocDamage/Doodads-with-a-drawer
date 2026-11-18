'use strict';
// 8.5.4 Maps inside maps: the map file and MapInfos are both written or neither; ids never clash; a changed MapInfos
// stops it; a link makes two transfers that point at each other; links that are missing or land on a blocked tile
// are marked; removing a place removes neither map nor events silently; a grid of maps is joined as neighbours.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const E = require('./engine/fake_engine');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-places-'));
process.chdir(dir);
E.install();
E.setupWorld({ width: 20, height: 15, px: 5, py: 5 });
fs.mkdirSync('data', { recursive: true });
const infos = [null, { id: 1, name: 'Town', order: 1, parentId: 0 }, null, { id: 3, name: 'Shop', order: 2, parentId: 1 }];
fs.writeFileSync('data/MapInfos.json', JSON.stringify(infos));
fs.writeFileSync('data/Map001.json', JSON.stringify(Object.assign({}, $dataMap, { events: [null] })));
fs.writeFileSync('data/Map003.json', JSON.stringify({ width: 10, height: 8, tilesetId: 1, data: new Array(480).fill(0), events: [null] }));
global.$dataMapInfos = infos;
require('../Docs-Doodads.js');
const D = DocsDoodads, NM = D.NewMap, P = D.Places, W = D.Workspace;
W.showToast = () => {};
D.AssetIndex.data = { version: 1, assets: {}, collections: {} };

// ---- Pure ----
assert.strictEqual(NM.nextId(infos), 2, 'the lowest free id');
assert.strictEqual(NM.nextId([null, { id: 1 }, { id: 2 }]), 3);
const p = NM.plan(infos, { name: 'Inn', width: 12, height: 9, tilesetId: 2, parentId: 1 });
assert.strictEqual(p.id, 2);
assert.deepStrictEqual([p.map.width, p.map.height, p.map.tilesetId, p.map.data.length, p.map.events.length], [12, 9, 2, 12 * 9 * 6, 1]);
assert.deepStrictEqual([p.infos[2].name, p.infos[2].parentId, p.infos[2].order], ['Inn', 1, 3]);
assert.strictEqual(infos[2], null, 'the plan never changes what it was given');
assert.ok(NM.infosText([null, { id: 1 }]).startsWith('[\nnull,\n{"id":1}'));
const g = NM.grid(600, 300);
assert.strictEqual(g.length, 6, 'a 600 × 300 area is 3 × 2 maps');
assert.deepStrictEqual([g[0].width, g[2].width, g[3].height], [256, 88, 44]);
assert.deepStrictEqual(g[0].links, { east: 1, south: 3 });
assert.deepStrictEqual(g[4].links, { east: 5, west: 3, north: 1 });

// ---- Making a map: both files or neither ----
D.Compat.isTest = () => true;
const id = NM.make({ name: 'Inn', width: 12, height: 9, parentId: 1 });
assert.strictEqual(id, 2);
assert.ok(fs.existsSync('data/Map002.json'));
const written = JSON.parse(fs.readFileSync('data/MapInfos.json', 'utf8'));
assert.strictEqual(written[2].name, 'Inn');
assert.ok(fs.readFileSync('data/MapInfos.json', 'utf8').includes('\n'), 'MZ\'s one-entry-a-line form');
assert.ok(fs.readdirSync('data/docs_doodads_cache/backups').some(f => /MapInfos/.test(f)), 'MapInfos backed up first');
assert.strictEqual(NM.make({ name: 'Cellar' }), 4, 'ids never clash');
// A failed write leaves neither.
const write = D.FS.atomicWriteManyJson;
D.FS.atomicWriteManyJson = () => ({ ok: false, error: 'disk full', rolledBack: true });
assert.throws(() => NM.make({ name: 'Nope' }), /not written/);
D.FS.atomicWriteManyJson = write;
assert.ok(!fs.existsSync('data/Map005.json') && !JSON.parse(fs.readFileSync('data/MapInfos.json', 'utf8'))[5], 'neither file');
// MZ changed MapInfos behind the editor's back: stop.
fs.writeFileSync('data/MapInfos.json', fs.readFileSync('data/MapInfos.json', 'utf8') + ' ');
const t = new Date(Date.now() + 5000); fs.utimesSync('data/MapInfos.json', t, t);
assert.throws(() => NM.make({ name: 'Late' }), /changed in RPG Maker MZ/);
NM._snapshot = D.FS.stat('data/MapInfos.json');

// ---- A place: two transfers pointing at each other ----
W.mounted = true;
D.Persistence.stagedFor(1);
const place = W.makePlace({ x: 6, y: 4, name: 'Bakery', kind: 'room', parentName: 'Town' });
const child = JSON.parse(fs.readFileSync(NM.path(place.mapId), 'utf8'));
const back = P.transfersTo(child, 1);
assert.strictEqual(back.length, 1, 'a way back in the new map');
assert.deepStrictEqual(back[0].target, { x: 6, y: 5 }, 'it lands just below the door');
const there = P.transfersTo($gameMap._stagedMapData, place.mapId);
assert.strictEqual(there.length, 1, 'a transfer at the door');
assert.deepStrictEqual([there[0].x, there[0].y], [6, 4]);
assert.deepStrictEqual(there[0].target, { x: place.entrance.x, y: place.entrance.y - 1 }, 'one tile inside the entrance');
assert.deepStrictEqual(D.Places.list().map(x => x.name), ['Bakery']);
// Checking links: a blank new map has no tiles, so its landing tile is blocked.
const problems = W.placeProblems(place);
assert.ok(problems.includes('lands on a blocked tile'), 'a landing on a blocked tile is marked');
assert.ok(!problems.includes('no transfer there') && !problems.includes('no way back'));
// Using a map that exists: its file gets the way back (backed up).
const shop = W.makePlace({ x: 9, y: 4, name: 'Shop', kind: 'room', mapId: 3 });
assert.strictEqual(P.transfersTo(JSON.parse(fs.readFileSync('data/Map003.json', 'utf8')), 1).length, 1);
assert.strictEqual(shop.mapId, 3);
// The tree.
const tree = P.tree(P.list());
assert.strictEqual(tree[0].root, 1);
assert.deepStrictEqual(tree.slice(1).map(r => [r.place.name, r.depth]), [['Bakery', 1], ['Shop', 1]]);
// Removing a place leaves its map and events.
W.removePlace(place.id);
assert.ok(fs.existsSync(NM.path(place.mapId)), 'the map stays');
assert.strictEqual(P.transfersTo($gameMap._stagedMapData, place.mapId).length, 1, 'the transfer stays');
D.Undo.undo();
assert.ok(P.list().some(x => x.id === place.id), 'Undo brings the link back');
// A grid of maps joined as neighbours.
const ids = W.makeMapGrid('World', 300, 100);
assert.strictEqual(ids.length, 2);
assert.deepStrictEqual(D.Lighting.mapSettings(ids[0]).neighbors, { east: ids[1] });
assert.deepStrictEqual(D.Lighting.mapSettings(ids[1]).neighbors, { west: ids[0] });
console.log('test_places: OK');
