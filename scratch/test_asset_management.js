// scratch/test_asset_management.js
// Where-used across maps/events/database/doodads/prefabs, safe rename/move, unused report,
// image fingerprints for duplicates and "more like this", live reload, and per-map art packing.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log("=== Testing Asset Management ===");

global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.document = {
    createElement: () => ({ style: {}, appendChild() {}, removeChild() {}, querySelectorAll: () => [], addEventListener() {}, getContext: () => ({}) }),
    body: { appendChild() {}, removeChild() {} },
    getElementById: () => null
};
global.Utils = { RPGMAKER_NAME: "MZ", isNwjs: () => true, isOptionValid: (opt) => opt === "test" };
global.PluginManager = { parameters: () => ({}) };
global.$gameMap = { mapId: () => 1, displayX: () => 0, displayY: () => 0, tileWidth: () => 48, tileHeight: () => 48 };

const sandbox = path.join(__dirname, 'asset_management_fixture');
fs.rmSync(sandbox, { recursive: true, force: true });
const write = (rel, content) => {
    const full = path.join(sandbox, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, typeof content === 'string' || Buffer.isBuffer(content) ? content : JSON.stringify(content));
};
const readJson = rel => JSON.parse(fs.readFileSync(path.join(sandbox, rel), 'utf8'));
const exists = rel => fs.existsSync(path.join(sandbox, rel));

write('data/MapInfos.json', [null, { id: 1, name: 'Town' }, { id: 2, name: 'Field' }]);
write('data/Map001.json', { tilesetId: 1, parallaxName: 'Sky', bgm: { name: 'Town1' }, bgs: { name: '' }, events: [null, {
    id: 1, name: 'NPC', x: 1, y: 1, pages: [{ image: { characterName: 'Actor1', characterIndex: 0 }, list: [
        { code: 101, indent: 0, parameters: ['Actor1', 0, 0, 2] },
        { code: 241, indent: 0, parameters: [{ name: 'Battle1', volume: 90, pitch: 100, pan: 0 }] },
        { code: 205, indent: 0, parameters: [-1, { list: [{ code: 41, parameters: ['People1', 2] }, { code: 44, parameters: [{ name: 'Cursor1' }] }, { code: 0 }] }] },
        { code: 505, indent: 0, parameters: [{ code: 41, parameters: ['People1', 2] }] },
        { code: 0, indent: 0, parameters: [] }
    ] }]
}] });
write('data/Map002.json', { tilesetId: 1, events: [null, { id: 1, name: 'Villager', x: 2, y: 2, pages: [{ image: { characterName: 'People1', characterIndex: 3 }, list: [{ code: 0 }] }] }] });
write('data/Actors.json', [null, { id: 1, characterName: 'Actor1', faceName: 'Actor1', battlerName: 'Actor1_1' }]);
write('data/Enemies.json', [null, { id: 1, battlerName: 'Bat' }]);
write('data/Tilesets.json', [null, { id: 1, tilesetNames: ['Outside_A1', '', '', '', '', 'Outside_B', '', '', ''] }]);
write('data/System.json', { title1Name: 'Castle', title2Name: '', sounds: [{ name: 'Cursor1' }], titleBgm: { name: 'Theme1' },
    boat: { characterName: 'Vehicle', bgm: { name: 'Ship1' } }, ship: { characterName: '', bgm: { name: '' } }, airship: { characterName: '', bgm: { name: '' } } });
write('data/CommonEvents.json', [null, { id: 1, name: 'Show sign', list: [{ code: 231, indent: 0, parameters: [1, 'Sign', 0, 0, 0, 0, 100, 100, 255, 0] }, { code: 0 }] }]);
write('data/Troops.json', [null]);
write('data/DocsDoodads.json', {});
write('img/characters/People1.png', 'people');
write('img/characters/Actor1.png', 'actor');
write('img/doodads/trees/Oak.png', 'oak');
write('img/doodads/trees/Oak.json', JSON.stringify({ frames: {} }));
write('img/doodads/Unused.png', 'unused');
write('img/system/Window.png', 'window');
process.on('exit', () => { process.chdir(__dirname); fs.rmSync(sandbox, { recursive: true, force: true }); });
process.chdir(sandbox);

require('../Docs-Doodads.js');
const ws = DocsDoodads.Workspace;
const Usage = DocsDoodads.Usage;
ws.showToast = () => {};
ws.refreshSpriteset = () => {};
ws.refreshInspector = () => {};
ws.refreshDrawerCards = () => {};

const oak = Object.assign(DocsDoodads.standardStruct(), { bit: [3, 'img/doodads/trees/Oak.png'], x: 10, y: 10 });
const sign = Object.assign(DocsDoodads.standardStruct(), { bit: [3, 'img/pictures/Sign.png'], x: 20, y: 20 });
global.$dataDocsDoodads = { 1: [oak], 2: [sign], mapSettings: {} };
DocsDoodads.Prefabs.list = [{ id: 'pf_1', name: 'Grove', thumbnail: 'img/doodads/trees/Oak.png', doodads: [Object.assign({}, oak, { x: 0, y: 0 })], events: [] }];
DocsDoodads.Prefabs.loaded = true;

// 1. Where-used: every place a file is referenced, keyed by folder/name without extension.
assert.strictEqual(Usage.keyOf('img/Doodads/Trees/Oak.PNG'), 'img/doodads/trees/oak');
const sources = ws.loadUsageSources();
const index = Usage.buildIndex(sources);
const refs = key => (index.get(key) || []);
assert.ok(refs('img/characters/actor1').length >= 2, "event image and actor");
assert.ok(refs('img/faces/actor1').some(r => r.source === 'map:1'), "Show Text face");
assert.ok(refs('img/faces/actor1').some(r => r.source === 'database:Actors'));
assert.ok(refs('audio/bgm/battle1').length === 1, "Play BGM command");
assert.ok(refs('audio/se/cursor1').some(r => r.source === 'map:1') && refs('audio/se/cursor1').some(r => r.source === 'database:System'), "move route SE and system sounds");
assert.strictEqual(refs('img/characters/people1').length, 2, "move route image change and another map's event (505 display lines are not double counted)");
assert.ok(refs('img/tilesets/outside_b').length >= 1);
assert.ok(refs('img/parallaxes/sky').length === 1);
assert.ok(refs('audio/bgm/town1').length === 1, "map autoplay BGM");
assert.ok(refs('img/pictures/sign').some(r => r.source === 'database:CommonEvents') && refs('img/pictures/sign').some(r => r.source === 'doodads'));
assert.deepStrictEqual(refs('img/doodads/trees/oak').map(r => r.source).sort(), ['doodads', 'prefabs']);
assert.ok(refs('img/enemies/bat').length === 1 && refs('img/sv_enemies/bat').length === 1, "enemy battlers can live in either folder");
assert.ok(refs('img/titles1/castle').length === 1 && refs('img/characters/vehicle').length === 1 && refs('audio/bgm/ship1').length === 1);
const npcRef = refs('img/characters/people1').find(r => r.source === 'map:1');
assert.ok(/Town/.test(npcRef.label) && /NPC/.test(npcRef.label), "references name the map and event: " + npcRef.label);

// Unused assets: nothing references them; engine system files are never reported.
const library = [
    { id: 'img/characters/actor1.png', path: 'img/characters/Actor1.png', fileName: 'Actor1.png', category: 'Characters' },
    { id: 'img/doodads/unused.png', path: 'img/doodads/Unused.png', fileName: 'Unused.png', category: 'Doodads' },
    { id: 'img/system/window.png', path: 'img/system/Window.png', fileName: 'Window.png', category: 'System' },
    { id: 'img/doodads/trees/oak.png', path: 'img/doodads/trees/Oak.png', fileName: 'Oak.png', category: 'Doodads' }
];
assert.deepStrictEqual(Usage.unusedAssets(library, index).map(a => a.fileName), ['Unused.png']);
Usage.lastIndex = index;
assert.deepStrictEqual(DocsDoodads.Search.filter(library, 'used:no').map(a => a.fileName), ['Unused.png']);
assert.deepStrictEqual(DocsDoodads.Search.filter(library, 'used:yes').map(a => a.fileName), ['Actor1.png', 'Oak.png']);

// 2. Safe rename: every reference follows the file, in one transaction.
DocsDoodads.AssetIndex.data.assets = {};
for (const a of library.concat([{ id: 'img/characters/people1.png', path: 'img/characters/People1.png', fileName: 'People1.png', category: 'Characters', tags: ['crowd'], favorite: true }])) {
    DocsDoodads.AssetIndex.data.assets[a.id] = Object.assign({ tags: [], autoTags: [], placement: {}, collision: { preset: 'none' } }, a);
}
DocsDoodads.AssetIndex.rebuildList();
DocsDoodads.Persistence.dirtyDoodads = false;
DocsDoodads.Persistence.dirtyMap = false;
const people = DocsDoodads.AssetIndex.data.assets['img/characters/people1.png'];

const blocked = ws.renameAsset(people, 'img/doodads/People1.png');
assert.strictEqual(blocked.ok, false);
assert.ok(/referenced by name/i.test(blocked.error), "engine files can't leave their folder: " + blocked.error);
assert.ok(exists('img/characters/People1.png'), "a refused move touches nothing");
assert.strictEqual(ws.renameAsset(people, 'img/characters/Actor1.png').ok, false, "never overwrite another file");

const renamed = ws.renameAsset(people, 'img/characters/Townsfolk.png');
assert.ok(renamed.ok, renamed.error);
assert.ok(!exists('img/characters/People1.png') && exists('img/characters/Townsfolk.png'), "the file is renamed");
assert.strictEqual(readJson('data/Map002.json').events[1].pages[0].image.characterName, 'Townsfolk');
const routeCmd = readJson('data/Map001.json').events[1].pages[0].list[2];
assert.strictEqual(routeCmd.parameters[1].list[0].parameters[0], 'Townsfolk', "move route image changes are updated");
assert.strictEqual(readJson('data/Map001.json').events[1].pages[0].list[3].parameters[0].parameters[0], 'Townsfolk', "and their editor display lines");
const rekeyed = DocsDoodads.AssetIndex.data.assets['img/characters/townsfolk.png'];
assert.ok(rekeyed && rekeyed.favorite === true && rekeyed.tags[0] === 'crowd', "tags and favourites move with the file");
assert.strictEqual(DocsDoodads.AssetIndex.data.assets['img/characters/people1.png'], undefined);
assert.ok(renamed.changedFiles.includes('data/Map001.json') && renamed.changedFiles.includes('data/Map002.json'));
assert.ok(fs.readdirSync(path.join(sandbox, 'data/docs_doodads_cache/backups')).some(f => f.startsWith('Map002.json')), "changed files are backed up first");

// Moving a doodad image to a new folder updates doodads, prefabs and its sidecar metadata.
const oakAsset = DocsDoodads.AssetIndex.data.assets['img/doodads/trees/oak.png'];
const moved = ws.renameAsset(oakAsset, 'img/doodads/forest/OldOak.png');
assert.ok(moved.ok, moved.error);
assert.ok(exists('img/doodads/forest/OldOak.png') && exists('img/doodads/forest/OldOak.json'), "image and its atlas metadata move together");
assert.strictEqual(oak.bit[1], 'img/doodads/forest/OldOak.png');
assert.strictEqual(readJson('data/DocsDoodads.json')[1][0].bit[1], 'img/doodads/forest/OldOak.png');
assert.strictEqual(DocsDoodads.Prefabs.list[0].doodads[0].bit[1], 'img/doodads/forest/OldOak.png');
assert.strictEqual(DocsDoodads.Prefabs.list[0].thumbnail, 'img/doodads/forest/OldOak.png');

// Unsaved work must be saved first, and a failed write puts the file back.
DocsDoodads.Persistence.dirtyDoodads = true;
assert.ok(/save/i.test(ws.renameAsset(rekeyed, 'img/characters/Crowd.png').error));
DocsDoodads.Persistence.dirtyDoodads = false;
const realWrite = DocsDoodads.FS.atomicWriteManyJson;
DocsDoodads.FS.atomicWriteManyJson = () => ({ ok: false, error: 'disk full', rolledBack: true });
const failed = ws.renameAsset(rekeyed, 'img/characters/Crowd.png');
DocsDoodads.FS.atomicWriteManyJson = realWrite;
assert.strictEqual(failed.ok, false);
assert.ok(exists('img/characters/Townsfolk.png') && !exists('img/characters/Crowd.png'), "the rename is undone when the data can't be written");
assert.ok(DocsDoodads.AssetIndex.data.assets['img/characters/townsfolk.png'], "the library is unchanged");

// 3. Fingerprints: duplicates and look-alikes from a 9x8 difference hash.
const Sim = DocsDoodads.Similarity;
function image(w, h, fn) {
    const data = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const [r, g, b, a] = fn(x, y);
        data.set([r, g, b, a], (y * w + x) * 4);
    }
    return data;
}
const ramp = image(36, 32, x => [x * 7, x * 7, x * 7, 255]);
const rampHash = Sim.hashPixels(ramp, 36, 32);
assert.strictEqual(rampHash, 'ffffffffffffffff', "brightness rising left to right sets every bit");
const reversed = Sim.hashPixels(image(36, 32, x => [255 - x * 7, 255 - x * 7, 255 - x * 7, 255]), 36, 32);
assert.strictEqual(reversed, '0000000000000000');
assert.strictEqual(Sim.hamming(rampHash, reversed), 64);
const bigger = Sim.hashPixels(image(72, 64, x => [x * 3.5, x * 3.5, x * 3.5, 255]), 72, 64);
assert.ok(Sim.hamming(rampHash, bigger) <= 2, "a resized copy has nearly the same fingerprint");
// Transparent areas count as mid-grey, so a sprite on transparency matches the same sprite on grey.
const onClear = Sim.hashPixels(image(36, 32, (x, y) => (x > 10 && x < 26 ? [255, 255, 255, 255] : [0, 0, 0, 0])), 36, 32);
const onGrey = Sim.hashPixels(image(36, 32, (x, y) => (x > 10 && x < 26 ? [255, 255, 255, 255] : [128, 128, 128, 255])), 36, 32);
assert.ok(Sim.hamming(onClear, onGrey) <= 2);
const frameHash = Sim.hashPixels(image(72, 32, x => (x < 36 ? [x * 7, x * 7, x * 7, 255] : [0, 0, 0, 255])), 72, 32, { x: 0, y: 0, w: 36, h: 32 });
assert.strictEqual(frameHash, rampHash, "a frame inside a sheet is fingerprinted on its own");

const entries = [
    { id: 'a', hash: 'ffffffffffffffff' }, { id: 'b', hash: 'fffffffffffffffe' }, { id: 'c', hash: '0000000000000000' },
    { id: 'd', hash: '00000000000000f0' }, { id: 'e', hash: 'f0f0f0f0f0f0f0f0' }, { id: 'f', hash: '0000000000000000', sha1: 'x' }, { id: 'g', hash: null }
];
const groups = Sim.findDuplicates(entries, 4).map(g => g.map(e => e.id).sort()).sort();
assert.deepStrictEqual(groups, [['a', 'b'], ['c', 'd', 'f']], "near-identical images group together");
assert.deepStrictEqual(Sim.similarTo('ffffffffffffffff', entries, 3).map(r => r.entry.id), ['a', 'b', 'e']);
const many = [];
for (let i = 0; i < 4000; i++) many.push({ id: 'n' + i, hash: (Math.random().toString(16).slice(2, 10) + Math.random().toString(16).slice(2, 10)).padEnd(16, '0').slice(0, 16) });
const started = Date.now();
Sim.findDuplicates(many, 4);
assert.ok(Date.now() - started < 1500, "thousands of fingerprints compare quickly");

// 4. Live reload: file changes become asset paths; temp files and packed art are ignored.
const Live = DocsDoodads.LiveReload;
assert.strictEqual(Live.classify('img', 'doodads\\Tree.png'), 'img/doodads/Tree.png');
assert.strictEqual(Live.classify('audio', 'se/Bell.ogg'), 'audio/se/Bell.ogg');
assert.strictEqual(Live.classify('img', 'doodads/Tree.png.tmp'), null);
assert.strictEqual(Live.classify('img', 'doodads/Tree.png.ddimport-123'), null);
assert.strictEqual(Live.classify('img', 'doodads/_packed/Map001_0.png'), null);
assert.strictEqual(Live.classify('img', 'doodads/notes.txt'), null);
const calls = [];
const summary = Live.process(['img/doodads/Tree.png', 'img/doodads/Tree.png', 'img/doodads/Gone.png'], {
    exists: p => p !== 'img/doodads/Gone.png',
    index: p => calls.push('index ' + p),
    remove: p => calls.push('remove ' + p),
    invalidate: p => calls.push('invalidate ' + p),
    reloadSprites: () => calls.push('reload')
});
assert.deepStrictEqual(summary, { updated: ['img/doodads/Tree.png'], removed: ['img/doodads/Gone.png'] });
assert.deepStrictEqual(calls, ['index img/doodads/Tree.png', 'invalidate img/doodads/Tree.png', 'remove img/doodads/Gone.png', 'invalidate img/doodads/Gone.png', 'reload']);
// Reloaded images get a new URL so the browser can't hand back the old picture.
Live.versions = {};
assert.strictEqual(Live.urlFor('img/doodads/Tree.png'), 'img/doodads/Tree.png');
Live.bump('img/doodads/Tree.png');
assert.ok(/^img\/doodads\/Tree\.png\?v=\d+$/.test(Live.urlFor('img/doodads/Tree.png')));

// A file replaced by a smaller one must not crash the game: frames are kept inside the image.
assert.deepStrictEqual(DocsDoodads.safeFrame({ x: 0, y: 0, w: 768, h: 768 }, 16, 16), { x: 0, y: 0, w: 16, h: 16 });
assert.deepStrictEqual(DocsDoodads.safeFrame({ x: 10, y: 0, w: 20, h: 10 }, 16, 16), { x: 10, y: 0, w: 6, h: 10 });
assert.deepStrictEqual(DocsDoodads.safeFrame({ x: 40, y: 40, w: 8, h: 8 }, 16, 16), { x: 0, y: 0, w: 16, h: 16 }, 'a frame entirely outside shows the whole image');
assert.deepStrictEqual(DocsDoodads.safeFrame({ x: 0, y: 0, w: 32, h: 32 }, 64, 64), { x: 0, y: 0, w: 32, h: 32 });

// The look-alike view replaces the drawer's search, so the results aren't filtered away.
ws.refreshDrawerCards = () => {};
ws.searchQuery = 'people1';
ws.setCategory('Similar');
assert.strictEqual(ws.searchQuery, '');
assert.strictEqual(ws.currentCategory, 'Similar');

// 5. Packing: every image a map uses goes into as few sheets as possible, without overlaps.
const Packer = DocsDoodads.Packer;
const rects = [{ key: 'a', w: 100, h: 200 }, { key: 'b', w: 300, h: 80 }, { key: 'c', w: 50, h: 50 }, { key: 'd', w: 400, h: 120 }, { key: 'e', w: 120, h: 120 }];
const packed = Packer.pack(rects, { maxSize: 512, padding: 2 });
const placed = packed.sheets.flatMap((s, si) => s.items.map(i => Object.assign({ sheet: si }, i)));
assert.strictEqual(placed.length, rects.length, "everything is placed");
for (const p of placed) assert.ok(p.x >= 0 && p.y >= 0 && p.x + p.w <= packed.sheets[p.sheet].w && p.y + p.h <= packed.sheets[p.sheet].h);
for (let i = 0; i < placed.length; i++) for (let j = i + 1; j < placed.length; j++) {
    const a = placed[i], b = placed[j];
    if (a.sheet !== b.sheet) continue;
    assert.ok(a.x + a.w + 2 <= b.x || b.x + b.w + 2 <= a.x || a.y + a.h + 2 <= b.y || b.y + b.h + 2 <= a.y, `${a.key} and ${b.key} overlap`);
}
assert.strictEqual(packed.sheets.length, 1, "small images share one sheet");
assert.strictEqual(Packer.pack([{ key: 'x', w: 400, h: 400 }, { key: 'y', w: 400, h: 400 }], { maxSize: 512 }).sheets.length, 2, "full sheets spill into a new one");
assert.strictEqual(Packer.pack([{ key: 'huge', w: 3000, h: 100 }], { maxSize: 2048 }).skipped[0].key, 'huge', "images too big for a sheet stay unpacked");

const tree1 = Object.assign(DocsDoodads.standardStruct(), { bit: [3, 'img/tilesets/Outside_B.png'], frameX: 384, frameY: 288, frameW: 96, frameH: 96 });
const tree2 = Object.assign({}, tree1, { x: 500 });
const torch = Object.assign(DocsDoodads.standardStruct(), { bit: [3, 'img/doodads/Torch.png'], frameX: 0, frameY: 0, frameW: 32, frameH: 48, xFrame: 3, yFrame: 1, frameUpdate: 8 });
const regions = Packer.regionsFor([tree1, tree2, torch]);
assert.strictEqual(regions.length, 2, "repeated frames are stored once");
assert.deepStrictEqual(regions.find(r => r.path.includes('Torch')).rect, { x: 0, y: 0, w: 96, h: 48 }, "animated doodads keep their whole strip");
const manifest = Packer.buildManifest(3, regions, Packer.pack(regions.map(r => ({ key: r.key, w: r.rect.w, h: r.rect.h })), { maxSize: 2048, padding: 2 }),
    { 'img/tilesets/Outside_B.png': 111, 'img/doodads/Torch.png': 222 });
const frame = Packer.resolve(manifest, torch);
assert.ok(frame && frame.sheet === 'img/doodads/_packed/Map003_0.png' && frame.w === 96 && frame.h === 48);
assert.strictEqual(Packer.resolve(manifest, Object.assign({}, torch, { frameX: 5 })), null, "frames that were not packed fall back to the original image");
assert.deepStrictEqual(Packer.staleSources(manifest, p => (p.includes('Torch') ? 999 : 111)), ['img/doodads/Torch.png'], "edited source images make the pack stale");
assert.strictEqual(Packer.shouldUse(), false, "playtests use the original images by default");
global.Utils.isOptionValid = () => false;
assert.strictEqual(Packer.shouldUse(), true, "deployed games use packed art");
global.Utils.isOptionValid = (opt) => opt === "test";

// The asset scan never indexes packed sheets.
assert.strictEqual(DocsDoodads.AssetIndex.isIgnoredDirectory('_packed'), true);

// 6. Follow-ups from playtesting.
// Thumbnails are keyed by the file's modified time, so a file changed while the game was closed
// is not shown with its old picture.
const Thumb = DocsDoodads.Thumbnail;
assert.notStrictEqual(Thumb.keyFor({ id: 'img/doodads/a.png', mtimeMs: 1 }, 96), Thumb.keyFor({ id: 'img/doodads/a.png', mtimeMs: 2 }, 96));
Thumb.cache = {}; Thumb.cacheOrder = [];
Thumb.setCache(Thumb.keyFor({ id: 'img/doodads/a.png', mtimeMs: 1 }, 96), 'data:image/png;old');
Thumb.setCache(Thumb.keyFor({ id: 'img/doodads/ab.png', mtimeMs: 1 }, 96), 'data:image/png;other');
Thumb.invalidate('img/doodads/a.png');
assert.deepStrictEqual(Object.values(Thumb.cache), ['data:image/png;other'], "only that asset's thumbnails are dropped");

// Live reload refreshes the selected asset so the inspector shows the new size.
// Only the PNG signature and IHDR size fields are read when indexing.
const pngHeader = (w, h) => { const b = Buffer.alloc(33); Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(b, 0); b.writeUInt32BE(13, 8); b.write('IHDR', 12, 'ascii'); b.writeUInt32BE(w, 16); b.writeUInt32BE(h, 20); return b; };
write('img/doodads/Live.png', pngHeader(16, 16));
DocsDoodads.AssetIndex.indexFile('img/doodads/Live.png', 'Live.png', '.png', 'img/doodads/Live.png');
const before = DocsDoodads.AssetIndex.data.assets['img/doodads/live.png'];
before.width = 768;
ws.selectedAsset = before;
ws.mounted = true;
ws.updateIndexStatus = () => {};
let inspected = 0;
ws.refreshInspector = () => { inspected++; };
fs.utimesSync(path.join(sandbox, 'img/doodads/Live.png'), new Date(), new Date(Date.now() + 5000));
Live.pending = new Set(['img/doodads/Live.png']);
Live.flush();
ws.mounted = false;
assert.notStrictEqual(ws.selectedAsset, before, "the selection points at the re-indexed entry");
assert.strictEqual(ws.selectedAsset.width, 16);
assert.ok(inspected > 0, "and the inspector is redrawn");

// The packed manifest is only requested when a project has one (no console error otherwise).
assert.strictEqual(Packer.manifestExists(), false);
write('data/DocsDoodadsPacked.json', { version: 1, maps: { 7: { sheets: [], frames: {}, sources: {} } } });
assert.strictEqual(Packer.manifestExists(), true);
fs.unlinkSync(path.join(sandbox, 'data/DocsDoodadsPacked.json'));

// Regions are clipped to the real image size before packing (the image may have been replaced).
const clamped = Packer.clampRegions([{ key: 'k', path: 'img/doodads/Live.png', rect: { x: 0, y: 0, w: 768, h: 768 } }], () => ({ w: 16, h: 16 }));
assert.deepStrictEqual(clamped[0].rect, { x: 0, y: 0, w: 16, h: 16 });
assert.strictEqual(clamped[0].key, 'k', "the key still matches the doodad");

// The toolbar may wrap onto two rows; the side panels start below it.
const panels = { 'dd-toolbar': { offsetTop: 10, offsetHeight: 96, style: {} }, 'dd-drawer-panel': { style: {} }, 'dd-inspector-panel': { style: {} } };
const realGet = document.getElementById;
document.getElementById = id => panels[id] || null;
ws.layoutPanels();
document.getElementById = realGet;
assert.strictEqual(panels['dd-drawer-panel'].style.top, '114px');
assert.strictEqual(panels['dd-inspector-panel'].style.top, '114px');

console.log("✓ Where-used, unused report, used: search, safe rename/move with rollback, fingerprints and duplicates, live reload, and per-map packing verified.");
