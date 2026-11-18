'use strict';
// 7.1.8 The sample project: run into a stub project in a temp folder; the data loads through DataFiles; the door
// opens on Action; the flashlight follows the cave's switch; the cave uses Dungeon tiles; every
// picture it names exists; every transfer lands on a tile that can be stood on and has a way back; Check Reach
// reaches the town's transfer; it refuses a project that already has doodad data, or is not an MZ project.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const project = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-sample-'));
const data = path.join(project, 'data');
fs.mkdirSync(data, { recursive: true });
const W = 17, H = 13, GRASS = 2816;
const map1 = { width: W, height: H, tilesetId: 1, data: new Array(W * H * 6).fill(0), events: [null], scrollType: 0 };
for (let i = 0; i < W * H; i++) map1.data[i] = GRASS;
fs.writeFileSync(path.join(data, 'System.json'), JSON.stringify({ gameTitle: 'Sample', switches: ['', ''] }));
fs.writeFileSync(path.join(data, 'MapInfos.json'), JSON.stringify([null, { id: 1, name: 'MAP001', order: 1, parentId: 0 }]));
fs.writeFileSync(path.join(data, 'Map001.json'), JSON.stringify(map1));
const flags = new Array(8192).fill(0); flags[0] = 0x10;
const dungeonFlags = new Array(8192).fill(0); dungeonFlags[0] = 0x10;
fs.writeFileSync(path.join(data, 'Tilesets.json'), JSON.stringify([null, { id: 1, name: 'Field', flags }, null, null, { id: 4, name: 'Dungeon', flags: dungeonFlags }]));
assert.throws(() => require('../scripts/sample.js').sample(os.tmpdir() + '/nope-' + Date.now()), /not an MZ project/);

const { sample } = require('../scripts/sample.js');
const r = sample(project);
const D = global.DocsDoodads;
assert.deepStrictEqual(r.maps, [1, 2, 3]);
// The data loads (one file, read back as the plugin reads it).
assert.strictEqual(r.name, 'DocsDoodads.json', "the plugin's default data file, not the old QJ name");
const loaded = JSON.parse(fs.readFileSync(path.join(data, 'DocsDoodads.json'), 'utf8'));
const merged = D.DataFiles.merge(loaded, () => null);
assert.ok(merged[1].length >= 8 && merged[2].length >= 30 && merged[3].length >= 4, 'three maps of doodads');
const house = merged[1].find(d => d.states && d.states.list.length === 2 && d.touch);
assert.ok(house, 'a door with two states that opens on touch');
// The plugin reads touch as { commonEventId, trigger, nextState }: Action facing it goes to the next state.
assert.deepStrictEqual(D.Touch.settings(house), Object.assign({}, D.Touch.defaults, { trigger: 'action', nextState: true }), 'the door opens with no event');
assert.ok(merged[1].some(d => d.light && d.light.when === 'dark'), 'lamps at dusk');
assert.ok(merged.mapSettings[2].perspective.enabled, 'the field in 3D');
assert.ok(merged.mapSettings[3].echo.enabled && merged.world.lighting2d.flashlight.enabled, 'the cave: echo and the flashlight');
// The flashlight only while switch 1 is on: the way into the cave turns it on, the way out turns it off.
assert.strictEqual(merged.world.lighting2d.flashlight.switchId, 1, 'the flashlight follows a switch, not every map');
assert.strictEqual(JSON.parse(fs.readFileSync(path.join(data, 'System.json'), 'utf8')).switches[1], 'Sample: flashlight', 'the switch is named');
assert.ok(merged[2].some(d => d.creatures && d.creatures.kind === 'birds'), 'birds in the field');
// Every picture it names exists, and is a PNG.
const paths = new Set();
for (const id of [1, 2, 3]) for (const d of merged[id]) { paths.add(d.bit[1]); for (const s of (d.states && d.states.list) || []) if (s.path) paths.add(s.path); if (d.creatures && d.creatures.sheet) paths.add(d.creatures.sheet); }
for (const p of paths) {
    const bytes = fs.readFileSync(path.join(project, p));
    assert.strictEqual(bytes.slice(1, 4).toString(), 'PNG', p + ' is a PNG');
}
// Transfers land where you can stand, and every map has a way back.
const maps = { 1: JSON.parse(fs.readFileSync(path.join(data, 'Map001.json'), 'utf8')), 2: JSON.parse(fs.readFileSync(path.join(data, 'Map002.json'), 'utf8')), 3: JSON.parse(fs.readFileSync(path.join(data, 'Map003.json'), 'utf8')) };
for (const [from, map] of Object.entries(maps)) {
    for (const to of [1, 2, 3]) for (const t of D.Places.transfersTo(map, to)) assert.ok(D.Places.standable(maps[to], maps[to].tilesetId === 4 ? dungeonFlags : flags, t.target.x, t.target.y), `map ${from} → ${to} lands on a tile you can stand on`);
}
assert.ok(D.Places.transfersTo(maps[2], 1).length && D.Places.transfersTo(maps[1], 2).length, 'town ↔ field');
assert.ok(D.Places.transfersTo(maps[2], 3).length && D.Places.transfersTo(maps[3], 2).length, 'field ↔ cave');
const switchSet = (map, toMap) => { const ev = map.events.find(e => e && e.pages[0].list.some(c => c.code === 201 && c.parameters[1] === toMap)); const c = ev.pages[0].list.find(x => x.code === 121); return c && c.parameters[0] === 1 && c.parameters[1] === 1 ? (c.parameters[2] === 0 ? 'on' : 'off') : null; };
assert.strictEqual(switchSet(maps[2], 3), 'on', 'into the cave: flashlight on');
assert.strictEqual(switchSet(maps[3], 2), 'off', 'out of the cave: flashlight off');
assert.strictEqual(switchSet(maps[2], 1), null, 'the way to the town leaves the switch alone');
assert.strictEqual(maps[2].scrollType, 0, 'the field does not loop: its way back to the town is on its west edge');
assert.strictEqual(maps[3].tilesetId, 4, "the cave uses the project's Dungeon tileset");
assert.strictEqual(maps[3].data[0], 2816, "on the Dungeon tileset's floor");
const infos = JSON.parse(fs.readFileSync(path.join(data, 'MapInfos.json'), 'utf8'));
assert.deepStrictEqual(infos.map(i => i && i.name), [null, 'MAP001', 'Sample Field', 'Sample Cave']);
// Check Reach: from the middle of the town the transfer to the field can be reached.
const canStep = (x, y, dir) => { const nx = x + (dir === 6 ? 1 : dir === 4 ? -1 : 0), ny = y + (dir === 2 ? 1 : dir === 8 ? -1 : 0); return D.Places.standable(maps[1], flags, nx, ny); };
const reach = D.MapCheck.reach({ x: 3, y: Math.floor(H / 2) }, { width: W, height: H, canStep });
const door = D.Places.transfersTo(maps[1], 2)[0];
assert.ok(D.MapCheck.nearReached(reach.seen, W, H, door.x, door.y, false), 'Check Reach reaches the way to the field');
// Never into a project that has doodad data.
assert.throws(() => sample(project), /already has doodad data/);
// Nor into one with doodad data under the old QJ name.
fs.renameSync(path.join(data, 'DocsDoodads.json'), path.join(data, 'DoodadsQJ.json'));
for (const f of ['Map002.json', 'Map003.json']) fs.unlinkSync(path.join(data, f));
assert.throws(() => sample(project), /DoodadsQJ\.json/);
// Without a Dungeon tileset the cave keeps the town's tileset and ground.
const project2 = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-sample-'));
fs.mkdirSync(path.join(project2, 'data'));
for (const f of ['System.json', 'MapInfos.json']) fs.copyFileSync(path.join(data, f), path.join(project2, 'data', f));
fs.writeFileSync(path.join(project2, 'data', 'MapInfos.json'), JSON.stringify([null, { id: 1, name: 'MAP001', order: 1, parentId: 0 }]));
fs.writeFileSync(path.join(project2, 'data', 'Map001.json'), JSON.stringify(map1));
fs.writeFileSync(path.join(project2, 'data', 'Tilesets.json'), JSON.stringify([null, { id: 1, name: 'Field', flags }]));
sample(project2);
const cave2 = JSON.parse(fs.readFileSync(path.join(project2, 'data', 'Map003.json'), 'utf8'));
assert.ok(cave2.tilesetId === 1 && cave2.data[0] === GRASS, "no Dungeon tileset: the town's tileset and ground");
console.log('test_sample: OK');
