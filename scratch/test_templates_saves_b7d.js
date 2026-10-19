// scratch/test_templates_saves_b7d.js
// Phase B7d (§12.2 of docs/CREATOR_IMPROVEMENTS_PLAN.md): managing event templates and carrying them in packs
// (12.2.5), copying map settings and map presets (12.2.6), picking several items in the Item Bag (12.2.7),
// autosave and saving one map (12.2.8), named checkpoints (12.2.9) and bringing in a zip (12.2.10).
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');

console.log('=== Testing Templates, Map Settings, Bag Picks, Checkpoints, Saving and Zips (B7d) ===');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-b7d-'));
process.on('exit', () => { process.chdir(os.tmpdir()); fs.rmSync(root, { recursive: true, force: true }); });
process.chdir(root);
const write = (rel, data) => { fs.mkdirSync(path.dirname(rel), { recursive: true }); fs.writeFileSync(rel, data); };
const png = tag => Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52, 0, 0, 0, 16, 0, 0, 0, 16]), Buffer.from(tag)]);
fs.mkdirSync('data', { recursive: true });
write('img/doodads/oak.png', png('oak'));
write('img/doodads/rock.png', png('rock'));
write('img/doodads/fern.png', png('fern'));
write('img/doodads/moss.png', png('moss'));

const byId = {};
function element(tag, id) {
    const el = { tagName: String(tag).toUpperCase(), id: id || '', style: {}, className: '', textContent: '', value: '', children: [], parentNode: null,
        classList: { toggle() {}, add() {}, remove() {} },
        appendChild(c) { c.parentNode = this; this.children.push(c); if (c.id) byId[c.id] = c; return c; },
        insertBefore(c) { return this.appendChild(c); },
        removeChild(c) { this.children = this.children.filter(x => x !== c); c.parentNode = null; if (byId[c.id] === c) delete byId[c.id]; },
        addEventListener() {}, setAttribute() {}, getAttribute: () => null, querySelectorAll: () => [], click() { if (this.onclick) return this.onclick(); } };
    let html = '';
    Object.defineProperty(el, 'innerHTML', { get: () => html, set(v) {
        html = String(v);
        el.children = [];
        for (const m of html.matchAll(/id="([^"]+)"/g)) byId[m[1]] = element('div', m[1]);
    } });
    return el;
}
global.window = global;
global.window.addEventListener = () => {};
global.document = { body: element('body'), createElement: t => element(t), getElementById: id => byId[id] || null, querySelectorAll: () => [], addEventListener() {}, removeEventListener() {} };
const store = {};
global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } };
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: o => o === 'test' };
global.PluginManager = { parameters: () => ({}) };
global.$gameMap = { mapId: () => 1, tileWidth: () => 48, tileHeight: () => 48, width: () => 20, height: () => 15, displayX: () => 0, displayY: () => 0 };
global.$dataMapInfos = [null, { id: 1, name: 'Village' }, { id: 2, name: 'Forest' }];

require(path.join(__dirname, '..', 'Docs-Doodads.js'));
const D = DocsDoodads, ws = D.Workspace, T = D.EventTemplates;
const toasts = [];
ws.showToast = m => toasts.push(m);
ws.refreshSpriteset = () => {};
ws.refreshInspector = () => {};
ws.refreshDrawerCards = () => {};
ws.updateSaveState = () => {};
ws.placeReadouts = () => {};
ws.mounted = true;
const doodad = (x, extra = {}) => Object.assign(D.standardStruct(), { bit: [3, 'img/doodads/oak.png'], frameW: 48, frameH: 48, x, y: 48 }, extra);

(async () => {
    // 1. Event templates: your own can be renamed, moved to a category and deleted; the plugin's can't.
    const ev = { pages: [{ trigger: 0, priorityType: 1, list: [{ code: 101, indent: 0, parameters: ['', 0, 0, 2, 'Guard'] }, { code: 0, indent: 0, parameters: [] }] }] };
    const key = T.saveCustomTemplate('Gate Guard', ev, 'Custom');
    assert.strictEqual(key, 'custom_gate_guard');
    assert.ok(T.isCustom(key) && !T.isCustom('npc'), 'built-ins are not custom');
    T.saveCustomTemplate('Shop Keeper', ev, 'Interaction');
    assert.ok(T.rename(key, 'Shop Keeper').error, 'a name in use is refused');
    assert.ok(T.rename('npc', 'Talker').error, 'a built-in is refused');
    const renamed = T.rename(key, 'Night Guard').key;
    assert.strictEqual(renamed, 'custom_night_guard');
    assert.ok(!T.get(key) && T.get(renamed).name === 'Night Guard');
    assert.ok(T.setCategory(renamed, 'Guards'));
    assert.deepStrictEqual(T.custom().map(t => t.category + '/' + t.name), ['Guards/Night Guard', 'Interaction/Shop Keeper'], 'by category, then name');
    let onDisk = JSON.parse(fs.readFileSync(T.customPath, 'utf8'));
    assert.deepStrictEqual(Object.keys(onDisk).sort(), ['custom_night_guard', 'custom_shop_keeper'], 'the file follows, built-ins never in it');
    assert.ok(await ws.deleteTemplate('custom_shop_keeper', true));
    assert.ok(!T.get('custom_shop_keeper') && !JSON.parse(fs.readFileSync(T.customPath, 'utf8')).custom_shop_keeper);
    assert.strictEqual(await ws.deleteTemplate('npc', true), false, 'built-ins stay');
    ws.showTemplatesCard();
    assert.ok(byId['dd-tpl-list'].children.some(c => c.className === 'dd-tpl-row' && c.children[0].textContent === 'Night Guard'), 'the card lists it');
    ws.closeTemplatesCard();
    console.log('✓ Templates: rename, category, delete, built-ins kept.');

    // 2. Templates travel in packs; an identical one is not added twice, a different one of the same name is renamed.
    const P = D.Packs;
    const gathered = P.gather({ templates: ['custom_night_guard', 'npc'] }, ws.packSources(), () => null);
    assert.deepStrictEqual(Object.keys(gathered.contents.templates), ['custom_night_guard'], 'only your own go in');
    const pack = P.parse(JSON.stringify(P.build('Guards', gathered, () => null, () => null)));
    assert.strictEqual(P.plan(pack, () => 'new', ws.projectIds()).templates, 1);
    const ready = P.prepare(pack, ws.projectIds(), () => 'x');
    assert.strictEqual(T.addFromPack('custom_night_guard', ready.templates.custom_night_guard), 'custom_night_guard', 'the same one: kept once');
    const other = Object.assign({}, ready.templates.custom_night_guard, { category: 'Elsewhere' });
    const k2 = T.addFromPack('custom_night_guard', other);
    assert.strictEqual(k2, 'custom_night_guard_2');
    assert.strictEqual(T.get(k2).name, 'Night Guard 2');
    assert.ok(P.parse(JSON.stringify({ format: P.format, version: 1 })).contents.templates, 'old packs read with no templates');
    console.log('✓ Packs: templates in, the same not twice, a different one renamed.');

    // 3. Map settings: copy some kinds from another map (one undo step), presets without the map's ground.
    $dataDocsDoodads = { 1: [], 2: [], mapSettings: {
        1: { ambient: { darkness: 0.1 }, terrain: { heights: [1, 2] }, layers: [{ id: 'a', name: 'A' }] },
        2: { ambient: { darkness: 0.7, color: '#203060' }, terrain: { heights: [9] }, echo: { amount: 0.4 }, weirdThing: 3 } } };
    assert.deepStrictEqual(D.MapSettingsCopy.partsIn($dataDocsDoodads.mapSettings[2]).map(p => p.id), ['light', 'sound', 'tiles', 'other']);
    ws.copyMapSettings($dataDocsDoodads.mapSettings[2], ['light']);
    let s1 = $dataDocsDoodads.mapSettings[1];
    assert.deepStrictEqual(s1.ambient, { darkness: 0.7, color: '#203060' }, 'the light came over');
    assert.deepStrictEqual(s1.terrain, { heights: [1, 2] }, 'the ground stayed');
    assert.ok(!s1.echo && s1.layers, 'what was not picked stayed as it was');
    D.Undo.undo();
    assert.deepStrictEqual($dataDocsDoodads.mapSettings[1].ambient, { darkness: 0.1 }, 'one undo step');
    ws.copyMapSettings($dataDocsDoodads.mapSettings[2], ['sound', 'other', 'layers']);
    s1 = $dataDocsDoodads.mapSettings[1];
    assert.ok(s1.echo && s1.weirdThing === 3 && !s1.layers, 'a kind the other map lacks is cleared');
    D.Undo.undo();
    $dataDocsDoodads.mapSettings[1].postfx = { mode: 'off' };
    const preset = ws.saveMapPreset('Dusk');
    assert.ok(preset && !preset.settings.terrain && preset.settings.ambient && preset.settings.postfx, 'a preset leaves the ground out');
    $gameMap.mapId = () => 2;
    ws.applyMapPreset('Dusk');
    const s2 = $dataDocsDoodads.mapSettings[2];
    assert.deepStrictEqual(s2.ambient, { darkness: 0.1 });
    assert.deepStrictEqual(s2.terrain, { heights: [9] }, 'map 2 keeps its own ground');
    assert.deepStrictEqual(s2.postfx, { mode: 'off' });
    $gameMap.mapId = () => 1;
    D.MapPresets.data = null;
    assert.deepStrictEqual(D.MapPresets.list().map(p => p.name), ['Dusk'], 'presets are kept in a file');
    assert.ok(D.MapPresets.remove('Dusk') && D.MapPresets.list().length === 0);
    assert.deepStrictEqual(ws.mapsWithSettings(), [2]);
    console.log('✓ Map settings: copy some kinds, one undo step, presets.');

    // 4. The Item Bag: Ctrl picks one more, Shift a run; tags, favourites, a collection, deleting the unused.
    await D.AssetIndex.scanAsync({ loadCache: false });
    const list = ws.filteredAssets = D.AssetIndex.list.slice().sort((a, b) => a.path.localeCompare(b.path));
    assert.deepStrictEqual(list.map(a => a.fileName), ['fern.png', 'moss.png', 'oak.png', 'rock.png']);
    ws.bagPick(list[0]);
    ws.bagPick(list[2], 'range');
    assert.deepStrictEqual(ws.bagPickedAssets().map(a => a.fileName), ['fern.png', 'moss.png', 'oak.png'], 'Shift: the run');
    ws.bagPick(list[1]);
    assert.deepStrictEqual(ws.bagPickedAssets().map(a => a.fileName), ['fern.png', 'oak.png'], 'Ctrl: one less');
    assert.ok(byId['dd-bag-batch'], 'the batch bar shows');
    await ws.bagBatch('tag', 'Forest, green');
    assert.deepStrictEqual(ws.bagPickedAssets().map(a => a.tags), [['forest', 'green'], ['forest', 'green']]);
    await ws.bagBatch('favorite');
    assert.ok(ws.bagPickedAssets().every(a => a.favorite));
    await ws.bagBatch('favorite');
    assert.ok(ws.bagPickedAssets().every(a => !a.favorite), 'all favourites: the star comes off');
    await ws.bagBatch('collection', 'Woods');
    assert.deepStrictEqual(D.AssetIndex.data.collections.Woods.slice().sort(), ['img/doodads/fern.png', 'img/doodads/oak.png']);
    // The oak is used on map 1; deleting keeps it and moves the fern to the editor's bin.
    $dataDocsDoodads[1] = [doodad(24)];
    ws.readUsageFile = () => null;
    const deleted = await ws.bagBatch('delete', true);
    assert.strictEqual(deleted, 1);
    assert.ok(!fs.existsSync('img/doodads/fern.png') && fs.existsSync('img/doodads/oak.png'));
    const bin = fs.readdirSync('data/docs_doodads_cache/deleted');
    assert.ok(fs.existsSync(path.join('data/docs_doodads_cache/deleted', bin[0], 'img/doodads/fern.png')), 'kept in the bin');
    assert.ok(!D.AssetIndex.data.assets['img/doodads/fern.png'] && !D.AssetIndex.data.collections.Woods.includes('img/doodads/fern.png'));
    assert.ok(toasts.some(t => /1 in use kept/.test(t)));
    ws.clearBagPicks();
    assert.ok(!byId['dd-bag-batch'], 'picking none hides the bar');
    // Moving: the moss goes to another folder (nothing unsaved, so the rename may run).
    D.Persistence.dirtyDoodads = false;
    ws.bagPick(D.AssetIndex.data.assets['img/doodads/moss.png']);
    assert.strictEqual(await ws.bagBatch('move', 'img/doodads/ground'), 1);
    assert.ok(fs.existsSync('img/doodads/ground/moss.png') && D.AssetIndex.data.assets['img/doodads/ground/moss.png']);
    ws.clearBagPicks();
    console.log('✓ Item Bag: Ctrl and Shift picks, tag, favourite, collection, delete the unused, move.');

    // 5. Checkpoints: kept on disk, restored as one undo step, the oldest go.
    $dataDocsDoodads = { 1: [doodad(24), doodad(72)], mapSettings: { 1: { ambient: { darkness: 0.2 } } } };
    const cp = await ws.addCheckpoint('Before scattering');
    $dataDocsDoodads[1].push(doodad(120), doodad(168));
    $dataDocsDoodads[1].push(doodad(200, { temp: true }));
    $dataDocsDoodads.mapSettings[1].ambient.darkness = 0.9;
    D.Checkpoints.data = null;
    assert.deepStrictEqual(D.Checkpoints.list(1).map(c => [c.name, c.count]), [['Before scattering', 2]], 'read back from disk');
    assert.ok(ws.restoreCheckpoint(cp.id));
    assert.deepStrictEqual($dataDocsDoodads[1].map(d => d.x), [24, 72, 200], 'the two doodads, and the API\'s one stays');
    assert.strictEqual($dataDocsDoodads.mapSettings[1].ambient.darkness, 0.2);
    D.Undo.undo();
    assert.deepStrictEqual($dataDocsDoodads[1].map(d => d.x), [24, 72, 120, 168, 200], 'undone');
    assert.strictEqual($dataDocsDoodads.mapSettings[1].ambient.darkness, 0.9);
    const html = ws.checkpointsHtml();
    assert.ok(html.includes('Before scattering') && html.includes('data-cp-restore'), 'Steps lists it');
    D.Checkpoints.maxPerMap = 3;
    for (let i = 0; i < 4; i++) D.Checkpoints.create(1, 'cp' + i, [], null, 1000 + i);
    assert.deepStrictEqual(D.Checkpoints.list(1).map(c => c.name), ['Before scattering', 'cp3', 'cp2'], 'the oldest went (newest first)');
    assert.ok(ws.deleteCheckpoint(cp.id) && D.Checkpoints.list(1).length === 2);
    console.log('✓ Checkpoints: on disk, restore as one step, the oldest go.');

    // 6. Save this map only: map 1's changes are written, map 2's wait.
    const DF = D.DataFiles;
    $dataDocsDoodads = { 1: [doodad(24)], 2: [doodad(48)], mapSettings: { 2: { echo: { amount: 0.1 } } } };
    D.FS.atomicWriteManyJson(DF.entriesFor($dataDocsDoodads));
    $dataDocsDoodads[1].push(doodad(96));
    $dataDocsDoodads[2].push(doodad(144));
    $dataDocsDoodads.mapSettings[1] = { ambient: { darkness: 0.5 } };
    D.Persistence.dirtyDoodads = true;
    assert.ok(D.Persistence.saveMapOnly(1));
    let disk = DF.readAll();
    assert.deepStrictEqual(disk[1].map(d => d.x), [24, 96], 'map 1 written');
    assert.deepStrictEqual(disk[2].map(d => d.x), [48], 'map 2 as it was on disk');
    assert.deepStrictEqual(disk.mapSettings, { 1: { ambient: { darkness: 0.5 } }, 2: { echo: { amount: 0.1 } } });
    assert.ok(D.Persistence.dirtyDoodads, 'map 2 is still unsaved');
    $dataDocsDoodads[2].pop();
    assert.ok(D.Persistence.saveMapOnly(1));
    assert.ok(!D.Persistence.hasUnsavedWork(), 'nothing else left: all saved');
    console.log('✓ Save this map only.');

    // 7. Autosave: off by default; after the minutes of unsaved work it saves, not during a drag or over MZ's changes.
    const saves = [];
    const realSave = D.Persistence.saveAll;
    D.Persistence.saveAll = function(force) { saves.push(force); this.dirtyDoodads = false; return true; };
    D.Persistence.dirtyDoodads = true;
    assert.strictEqual(D.Persistence.autosaveTick(0), false, 'off');
    assert.strictEqual(ws.cycleAutosave(), 5);
    assert.strictEqual(ws.autosaveLabel(), 'Autosave: 5 min');
    D.Persistence.lastSavedAt = 0;
    assert.strictEqual(D.Persistence.autosaveTick(1000), false, 'the clock starts');
    assert.strictEqual(D.Persistence.autosaveTick(1000 + 4 * 60000), false);
    ws.isBrushActive = true;
    assert.strictEqual(D.Persistence.autosaveTick(1000 + 5 * 60000), false, 'not in the middle of a stroke');
    ws.isBrushActive = false;
    const realConflict = D.Persistence.checkConflict;
    D.Persistence.checkConflict = () => true;
    D.Persistence.autosaveTick(1000 + 5 * 60000);
    D.Persistence.autosaveTick(1000 + 6 * 60000);
    assert.strictEqual(toasts.filter(t => /Autosave waits/.test(t)).length, 1, 'said once');
    D.Persistence.checkConflict = realConflict;
    assert.strictEqual(D.Persistence.autosaveTick(1000 + 6 * 60000), true);
    assert.deepStrictEqual(saves, [true]);
    assert.ok(toasts.some(t => /Autosaved \(every 5 minutes\)/.test(t)));
    ws.setAutosave(0);
    D.Persistence.saveAll = realSave;
    console.log('✓ Autosave: off, minutes, waits during a stroke and over MZ\'s changes.');

    // 8. Zips: pictures go in img/doodads/<zip>/, project folders keep their place, the rest is left out;
    //    names that reach outside and damaged files are refused; a pack inside a zip is read as a pack.
    const Z = D.Zip;
    const crc = buf => Z.crc32(buf);
    const makeZip = (files, opts = {}) => {
        const locals = [], dir = [];
        let offset = 0;
        for (const f of files) {
            const name = Buffer.from(f.name), data = Buffer.from(f.data);
            const packed = f.store ? data : zlib.deflateRawSync(data);
            const method = f.store ? 0 : 8;
            const head = Buffer.alloc(30);
            head.writeUInt32LE(0x04034b50, 0); head.writeUInt16LE(20, 4); head.writeUInt16LE(method, 8);
            head.writeUInt32LE(f.badCrc ? 1 : crc(data), 14); head.writeUInt32LE(packed.length, 18); head.writeUInt32LE(f.claim || data.length, 22);
            head.writeUInt16LE(name.length, 26);
            locals.push(head, name, packed);
            const c = Buffer.alloc(46);
            c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(method, 10);
            c.writeUInt32LE(f.badCrc ? 1 : crc(data), 16); c.writeUInt32LE(packed.length, 20); c.writeUInt32LE(f.claim || data.length, 24);
            c.writeUInt16LE(name.length, 28); c.writeUInt32LE(offset, 42);
            dir.push(c, name);
            offset += 30 + name.length + packed.length;
        }
        const dirBuf = Buffer.concat(dir);
        const end = Buffer.alloc(22);
        end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
        end.writeUInt32LE(dirBuf.length, 12); end.writeUInt32LE(offset, 16);
        return Buffer.concat(locals.concat([dirBuf, end, Buffer.from(opts.comment || '')]));
    };
    const art = makeZip([
        { name: 'Forest/Pine.png', data: png('pine') },
        { name: 'MyArt/img/doodads/ready/Stump.png', data: png('stump'), store: true },
        { name: 'readme.txt', data: 'hello' },
        { name: '../evil.png', data: png('evil') },
        { name: '__MACOSX/Forest/._Pine.png', data: 'junk' }
    ]);
    const read = Z.read(art, zlib.inflateRawSync);
    assert.deepStrictEqual(read.files.map(f => f.name), ['Forest/Pine.png', 'MyArt/img/doodads/ready/Stump.png', 'readme.txt', '__MACOSX/Forest/._Pine.png']);
    assert.deepStrictEqual(read.unsafe, ['../evil.png'], 'a name reaching outside is refused');
    assert.ok(Buffer.from(read.files[0].data).equals(png('pine')), 'deflated: unpacked as it was');
    write('incoming/Woodland Kit.zip', art);
    const inc = ws.readPack('incoming/Woodland Kit.zip');
    assert.deepStrictEqual(Object.keys(inc.pack.files).sort(), ['img/doodads/Woodland Kit/Forest/Pine.png', 'img/doodads/ready/Stump.png']);
    assert.strictEqual(inc.leftOut.length, 3, 'the text, the outside name and the Mac folder are left out');
    await ws.importPack(inc);
    assert.ok(fs.readFileSync('img/doodads/Woodland Kit/Forest/Pine.png').equals(png('pine')) && fs.existsSync('img/doodads/ready/Stump.png'));
    assert.ok(D.AssetIndex.data.assets['img/doodads/woodland kit/forest/pine.png'], 'the Item Bag has it');
    // A pack inside a zip.
    write('incoming/packed.zip', makeZip([{ name: 'Guards.ddpack', data: JSON.stringify(pack) }], { comment: 'a comment after' }));
    const inner = ws.readPack('incoming/packed.zip');
    assert.strictEqual(inner.pack.name, 'Guards');
    assert.strictEqual(inner.plan.templates, 1);
    // Damaged, too big, not a zip.
    assert.throws(() => Z.read(makeZip([{ name: 'a.png', data: png('a'), badCrc: true }]), zlib.inflateRawSync), /does not check out/);
    const max = Z.maxBytes;
    Z.maxBytes = 1000;
    assert.throws(() => Z.read(makeZip([{ name: 'big.png', data: png('b'), claim: 5000 }]), zlib.inflateRawSync), /more than/);
    Z.maxBytes = max;
    assert.throws(() => Z.read(Buffer.from('not a zip at all'), zlib.inflateRawSync), /not a zip/);
    write('incoming/text.zip', makeZip([{ name: 'notes.txt', data: 'x' }]));
    assert.throws(() => ws.readPack('incoming/text.zip'), /no pictures/);
    console.log('✓ Zips: art placed, project folders kept, outside names refused, a pack inside read, damage caught.');

    console.log('\nAll templates, map settings, bag picks, checkpoints, saving and zip (B7d) checks passed.');
})().catch(e => { console.error(e); process.exit(1); });
