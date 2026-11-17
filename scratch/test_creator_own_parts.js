// User-owned character parts: native folder scans, collision-safe merging, extra rows, source-aware recipes,
// file routing, and the Characters-card controls for MZ, LPC and Memao.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

console.log('=== Testing Creator Own Parts ===');

global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
let shownCard = null;
global.document = { createElement: () => ({ style: {}, innerHTML: '', setAttribute() {}, click() {} }), getElementById: id => id === 'dd-lpc-card' ? shownCard : null, querySelector: () => null, querySelectorAll: () => [], body: { appendChild(el) { if (el.id === 'dd-lpc-card') shownCard = el; }, removeChild(el) { if (el === shownCard) shownCard = null; } } };
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: x => x === 'test' };
global.PluginManager = { parameters: () => ({}) };
global.$gameMap = { mapId: () => 1, tileWidth: () => 48, tileHeight: () => 48 };
global.$dataDocsDoodads = { 1: [] };

require('../Docs-Doodads.js');
const D = DocsDoodads;
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-own-parts-'));
process.on('exit', () => fs.rmSync(temp, { recursive: true, force: true }));
const touch = (root, rel, data = '') => { const file = path.join(root, rel); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, data); };

// MZ: a real generator-layout folder needs no colour ramps, and a clash stays beside the built-in part.
const mzMine = path.join(temp, 'MZ Heroes');
touch(mzMine, 'TV/Male/TV_Body_p01.png');
touch(mzMine, 'TV/Male/TV_Horns3_p02.png');
const mzScanned = D.MzGen.scan(fs, path, mzMine, x => x, '2026-01-01', { mine: true });
const mzBase = { format: D.MzGen.indexFormat, version: D.MzGen.indexVersion, library: 'generator', built: 'old', bases: ['Male'], ramps: {}, warnings: [], parts: [
    { id: 'Male/Body/1', base: 'Male', family: 'Body', num: 1, name: 'Body 1', files: { TV: [{ file: 'TV/Male/TV_Body_p01.png', layer: 1 }] } }
] };
const mz = D.MzGen.mergeIndexes(mzBase, mzScanned, 'MZ Heroes');
assert.strictEqual(mz.parts.length, 3);
assert.strictEqual(mz.parts.filter(p => p.family === 'Body').length, 2, 'MZ clash keeps both');
assert.ok(mz.parts.find(p => p.family === 'Horns').mine);
D.MzGenSlots.useIndex(mz);
assert.strictEqual(D.MzGenSlots.cards.find(c => c.key === 'outfit').tabs.at(-1).label, 'MZ Heroes');
assert.strictEqual(D.MzGen.filePath(path, mz, mz.parts.find(p => p.mine).files.TV[0].file).startsWith(mzMine), true);

// LPC: native sheet_definitions/spritesheets scan, same id kept twice, unknown type becomes an Extra row.
const lpcMine = path.join(temp, 'LPC Heroes');
const lpcDef = (name, type, folder) => JSON.stringify({ name, type_name: type, layer_1: { zPos: 5, male: folder }, credits: [{ file: folder, authors: ['Me'], licenses: ['CC0'] }] });
touch(lpcMine, 'sheet_definitions/body.json', lpcDef('Body custom', 'body', 'body'));
touch(lpcMine, 'sheet_definitions/relic.json', lpcDef('Relic', 'relic', 'relic'));
touch(lpcMine, 'spritesheets/.keep');
const lpcScanned = D.Lpc.scan(fs, path, lpcMine, '2026-01-01', { mine: true });
const lpcBase = { format: D.Lpc.indexFormat, version: D.Lpc.indexVersion, library: 'lpc', commit: '', built: 'old', palettes: {}, skipped: [], newFields: [], parts: [D.Lpc.readPart('body', JSON.parse(lpcDef('Body', 'body', 'body')))] };
const lpc = D.Lpc.mergeIndexes(lpcBase, lpcScanned, 'LPC Heroes');
assert.strictEqual(lpc.parts.filter(p => p.id.endsWith('body')).length, 2, 'LPC clash keeps both');
D.LpcSlots.useIndex(lpc);
assert.strictEqual(D.LpcSlots.cards.find(c => c.key === 'outfit').tabs.at(-1).label, 'LPC Heroes');
assert.strictEqual(D.Lpc.filePath(path, lpc, lpc.parts.find(p => p.mine).layers[0].paths.male).startsWith(path.join(lpcMine, 'spritesheets')), true);

// Memao: native set/folder scan, collision-safe merge, unknown folder row and custom-root file routing.
const memMine = path.join(temp, 'Memao Heroes');
touch(memMine, D.Memao.zFile, '{}');
touch(memMine, 'Main/Relic/relic_001.png');
const memScanned = D.Memao.scan(fs, path, memMine, '2026-01-01', { mine: true });
const memBase = { format: D.Memao.indexFormat, version: D.Memao.indexVersion, library: 'memao', built: 'old', warnings: [], sets: { Main: { width: 384, height: 960, columns: 8, frames: 160 } }, folders: { Relic: { label: 'Relic', channel: 'cloth', z: { down: 1, up: 1, left: 1, right: 1 } } }, parts: [{ id: 'Relic/001', folder: 'Relic', name: 'Relic 1', order: 1, files: { any: 1 }, sets: ['Main'] }] };
const mem = D.Memao.mergeIndexes(memBase, memScanned, 'Memao Heroes');
assert.strictEqual(mem.parts.length, 2, 'Memao clash keeps both');
D.MemaoSlots.useIndex(mem);
assert.strictEqual(D.MemaoSlots.cards.find(c => c.key === 'outfit').tabs.at(-1).label, 'Memao Heroes');
const customMem = mem.parts.find(p => p.mine);
const resolved = D.MemaoCompose.resolve(mem, { body: 'average', picks: [{ id: customMem.id, colour: 'red' }] }, 'walk', () => true);
assert.ok(resolved.layers[0].file.startsWith(D.Memao.minePrefix));
assert.strictEqual(D.Memao.filePath(path, mem, resolved.layers[0].file).startsWith(memMine), true);

// Recipes preserve the folder name so a missing saved part can say which folder changed.
const state = { body: 'Male', colours: {}, slots: {} };
D.MzGenSlots.setPart(state, mz, 'x_Horns', mz.parts.find(p => p.family === 'Horns'));
const roundTrip = D.CreatorRecipe.read(D.CreatorRecipe.write('mz', 'Own', state), 'mz').state;
assert.strictEqual(roundTrip.slots.x_Horns.from, 'MZ Heroes');
assert.match(D.MzGenSlots.goneNote(roundTrip.slots, ['x_Horns']), /MZ Heroes/);

// Each Characters card exposes a second directory and warns when it is inside the project.
const ws = D.Workspace;
ws._mzgenIndex = mz; ws._lpcIndex = lpc; ws._memaoIndex = mem;
ws.mzgenMineFolder = () => 'project/mz-own'; ws.lpcMineFolder = () => 'project/lpc-own'; ws.memaoMineFolder = () => 'project/memao-own';
assert.match(ws.mzgenCardHtml(), /dd-mzgen-mine-folder/);
assert.match(ws.memaoCardHtml(), /dd-memao-mine-folder/);
ws.showLpcCard();
assert.match(shownCard.innerHTML, /dd-lpc-mine-folder/);

console.log('Creator own-parts tests passed.');
