// scratch/test_doodad_packs.js
// Doodad packs (6.2.10): prefabs (with the prefabs inside them), rooms, biomes, dressing rules and
// collections saved with the files they use and those files' Item Bag entries as one .ddpack, then brought
// into another project: new files written, files already the same skipped, different ones kept (or
// replaced after a backup), ids that clash renamed, unsafe paths refused.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== Testing Doodad Packs ===');

const elements = {};
global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.document = {
    createElement: () => ({ style: {}, innerHTML: '', appendChild() {}, removeChild() {}, querySelectorAll: () => [], addEventListener() {}, getContext: () => ({}) }),
    body: { appendChild(n) { if (n.id) elements[n.id] = n; n.parentNode = this; }, removeChild(n) { if (elements[n.id] === n) delete elements[n.id]; } },
    getElementById: id => elements[id] || null
};
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: opt => opt === 'test' };
global.PluginManager = { parameters: () => ({}) };
global.$gameMap = { mapId: () => 1, tileWidth: () => 48, tileHeight: () => 48 };
global.$dataDocsDoodads = { 1: [] };

const root = path.join(__dirname, 'doodad_packs_fixture');
const projectA = path.join(root, 'A'), projectB = path.join(root, 'B');
fs.rmSync(root, { recursive: true, force: true });
const write = (dir, rel, data) => { const f = path.join(dir, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, data); };
// A tiny PNG header is enough for the Item Bag.
const png = tag => Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52, 0, 0, 0, 16, 0, 0, 0, 16]), Buffer.from(tag)]);
for (const dir of [projectA, projectB]) fs.mkdirSync(path.join(dir, 'data'), { recursive: true });
write(projectA, 'img/doodads/lamp.png', png('lamp'));
write(projectA, 'img/doodads/lamp_off.png', png('lampoff'));
write(projectA, 'img/doodads/bench.png', png('bench'));
write(projectA, 'img/doodads/flower.png', png('flower'));
write(projectA, 'img/doodads/rock.png', png('rock-A'));
write(projectA, 'audio/bgs/Fire.ogg', Buffer.from('ogg'));
process.on('exit', () => { process.chdir(__dirname); fs.rmSync(root, { recursive: true, force: true }); });
process.chdir(projectA);

require('../Docs-Doodads.js');
const D = DocsDoodads, P = D.Packs, ws = D.Workspace;
const toasts = [];
ws.showToast = text => toasts.push(text);
ws.refreshDrawerCards = () => {};
ws.mounted = true;

(async () => {
    await D.AssetIndex.scanAsync({ loadCache: false });
    D.AssetIndex.data.assets['img/doodads/bench.png'].slice = { status: 'manual', method: 'grid', confidence: 1, regions: [{ x: 0, y: 0, w: 8, h: 8 }] };
    D.AssetIndex.data.assets['img/doodads/bench.png'].tags = ['park'];
    D.AssetIndex.addAssetToCollection('img/doodads/flower.png', 'Garden');

    // Project A: a lamp prefab (with a state picture and a sound), a plaza holding it, a room, a biome, a rule.
    const lamp = D.Prefabs.capture('Lamp', [Object.assign(D.standardStruct(), { bit: [3, 'img/doodads/lamp.png'], x: 0, y: 0,
        states: { list: [{ name: 'Off', path: 'img/doodads/lamp_off.png' }] }, sound: { file: 'bgs/Fire', volume: 80 } })], [], { tileWidth: 48, tileHeight: 48 });
    D.Prefabs.add(lamp);
    const plaza = { id: 'pf_plaza', name: 'Plaza', origin: { x: 0, y: 0 }, doodads: [{ bit: [3, 'img/doodads/bench.png'], x: 48, y: 0, pk: 'k0' }],
        children: [{ key: 'c0', id: lamp.id, x: 0, y: 0 }], events: [] };
    D.Prefabs.add(plaza);
    const room = { id: 'room_hut', name: 'Hut', w: 1, h: 1, tiles: [1, 0, 0, 0, 0, 0], doodads: [{ bit: [3, 'img/doodads/rock.png'], x: 0, y: 48 }], events: [] };
    D.Rooms.add(room);
    D.World.set('biomes.list', [{ id: 'biome_meadow', name: 'Meadow', entries: [{ path: 'img/doodads/flower.png', weight: 1 }] }]);
    D.World.set('dress.rules', [{ name: 'Shore rocks', where: 'waterEdge', entries: [{ path: 'img/doodads/rock.png', weight: 1 }] }]);

    // 1. Gathering: the plaza brings the lamp; every file it needs; the library entries come along.
    const g = P.gather({ prefabs: ['pf_plaza'], rooms: ['room_hut'], biomes: ['biome_meadow'], dress: [0], collections: ['Garden'] },
        ws.packSources(), n => ws.packAudioFile(n));
    assert.deepStrictEqual(g.contents.prefabs.map(p => p.name), ['Lamp', 'Plaza'], 'the inner prefab first');
    assert.deepStrictEqual(g.files, ['audio/bgs/Fire.ogg', 'img/doodads/bench.png', 'img/doodads/flower.png', 'img/doodads/lamp.png', 'img/doodads/lamp_off.png', 'img/doodads/rock.png']);
    assert.deepStrictEqual(g.contents.collections, { Garden: ['img/doodads/flower.png'] });
    assert.ok(!P.safePath('../evil.png') && !P.safePath('C:/x.png') && !P.safePath('js/plugins/x.js') && P.safePath('img/doodads/a.png'));
    console.log('✓ gathering: prefabs inside prefabs, files from pictures, states and sounds, collections');

    // 2. Making the pack: written into packs/, files as base64, a missing file is listed.
    D.Prefabs.get(lamp.id).doodads.push({ bit: [3, 'img/doodads/gone.png'], x: 0, y: -48, pk: 'k1' });
    assert.strictEqual(await ws.exportPack('Town Kit!', {}), null, 'nothing picked');
    const made = await ws.exportPack('Town Kit!', { prefabs: ['pf_plaza'], rooms: ['room_hut'], biomes: ['biome_meadow'], dress: [0], collections: ['Garden'] });
    assert.strictEqual(made.path.replace(/\\/g, '/'), 'packs/Town_Kit.ddpack');
    assert.ok(fs.existsSync(path.join(projectA, 'packs', 'Town_Kit.ddpack')));
    assert.deepStrictEqual(made.pack.missing, ['img/doodads/gone.png']);
    assert.strictEqual(Buffer.from(made.pack.files['img/doodads/lamp.png'], 'base64').toString('latin1').slice(-4), 'lamp');
    assert.deepStrictEqual(made.pack.library['img/doodads/bench.png'].tags, ['park']);
    assert.ok(/not found were left out/.test(toasts[toasts.length - 1]));
    const packFile = path.join(root, 'Town_Kit.ddpack');
    fs.copyFileSync(path.join(projectA, 'packs', 'Town_Kit.ddpack'), packFile);
    console.log('✓ making a pack: one file in packs/, missing files listed');

    // 3. Reading: not a pack, a newer pack.
    assert.throws(() => P.parse('nope'), /not a doodad pack/);
    assert.throws(() => P.parse('{"format":"other"}'), /not a doodad pack/);
    assert.throws(() => P.parse(JSON.stringify({ format: P.format, version: 99 })), /newer/);

    // 4. Project B: a different rock, the same flower, a prefab with the lamp's id.
    process.chdir(projectB);
    write(projectB, 'img/doodads/rock.png', png('rock-B'));
    write(projectB, 'img/doodads/flower.png', png('flower'));
    D.Prefabs.list = [{ id: lamp.id, name: 'My Own Lamp', doodads: [], events: [] }];
    D.Prefabs.loaded = true;
    D.Rooms.list = [];
    D.Rooms.loaded = true;
    D.AssetIndex.data = { version: 1, assets: {}, collections: {}, settings: {} };
    global.$dataDocsDoodads = { 1: [] };
    await D.AssetIndex.scanAsync({ loadCache: false });
    const incoming = ws.readPack(packFile);
    assert.strictEqual(incoming.plan.newFiles, 4);
    assert.strictEqual(incoming.plan.sameFiles, 1, 'the flower is already here');
    assert.deepStrictEqual(incoming.plan.conflicts, ['img/doodads/rock.png']);
    assert.strictEqual(incoming.plan.idClashes, 1, 'the lamp\'s id is taken');
    ws.showPacksCard();
    assert.ok(/different from yours/.test(elements['dd-packs-card'].innerHTML) && /Keep mine/.test(elements['dd-packs-card'].innerHTML));

    // Keep mine: the different rock stays; the rest comes in.
    const result = await ws.importPack();
    assert.strictEqual(fs.readFileSync(path.join(projectB, 'img/doodads/rock.png')).toString('latin1').slice(-6), 'rock-B', 'mine kept');
    assert.ok(fs.existsSync(path.join(projectB, 'img/doodads/lamp.png')) && fs.existsSync(path.join(projectB, 'audio/bgs/Fire.ogg')));
    assert.strictEqual(result.written.length, 4);
    const prefabs = D.Prefabs.ensureLoaded();
    const newLamp = prefabs.find(p => p.name === 'Lamp'), newPlaza = prefabs.find(p => p.name === 'Plaza');
    assert.ok(newLamp && newLamp.id !== lamp.id, 'the clashing id got a new one');
    assert.strictEqual(prefabs.find(p => p.id === lamp.id).name, 'My Own Lamp', 'mine is untouched');
    assert.strictEqual(newPlaza.children[0].id, newLamp.id, 'the plaza holds the new lamp');
    assert.strictEqual(D.Rooms.get('room_hut').name, 'Hut');
    assert.ok(D.World.get('biomes.list').some(b => b.name === 'Meadow'));
    assert.ok(D.World.get('dress.rules').some(r => r.name === 'Shore rocks'));
    assert.deepStrictEqual(D.AssetIndex.data.assets['img/doodads/bench.png'].tags, ['park'], 'Item Bag entries come along');
    assert.strictEqual(D.AssetIndex.data.assets['img/doodads/bench.png'].slice.status, 'manual');
    assert.ok(D.AssetIndex.data.collections.Garden.includes('img/doodads/flower.png'));
    assert.ok(fs.existsSync(path.join(projectB, 'data', 'DocsDoodadsPrefabs.json')) && fs.existsSync(path.join(projectB, 'data', 'DocsDoodadsRooms.json')));
    assert.strictEqual(ws._incomingPack, null);

    // Use the pack's: mine is backed up first.
    ws.readPack(packFile);
    ws._incomingPack.conflict = 'replace';
    await ws.importPack();
    assert.strictEqual(fs.readFileSync(path.join(projectB, 'img/doodads/rock.png')).toString('latin1').slice(-6), 'rock-A', 'the pack\'s');
    const backups = fs.readdirSync(path.join(projectB, 'data', 'docs_doodads_cache', 'backups')).filter(f => f.startsWith('rock.png'));
    assert.strictEqual(backups.length, 1, 'mine backed up');

    // Unsafe paths in a hand-made pack are never written.
    const evil = { format: P.format, version: 1, name: 'Evil', contents: {}, files: { '../../outside.txt': Buffer.from('x').toString('base64'), 'js/plugins/x.js': 'eA==' }, library: {} };
    fs.writeFileSync(path.join(root, 'evil.ddpack'), JSON.stringify(evil));
    const bad = ws.readPack(path.join(root, 'evil.ddpack'));
    assert.strictEqual(bad.plan.unsafe.length, 2);
    await ws.importPack();
    assert.ok(!fs.existsSync(path.join(root, 'outside.txt')) && !fs.existsSync(path.join(projectB, 'js', 'plugins', 'x.js')));
    console.log('✓ bringing a pack in: new files, same skipped, mine kept or backed up and replaced, ids renamed, unsafe refused');

    console.log('=== Doodad packs passed ===');
})().catch(err => { console.error(err); process.exit(1); });
