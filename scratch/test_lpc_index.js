// scratch/test_lpc_index.js
// LPC library, phase 1: reading a library folder into an index (parts, palettes, the schema guard and what
// it skips, the library's commit), licences judged per image folder, credits recorded per image and
// written out as CREDITS_LPC.txt, and the warning for a library inside the project.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== Testing LPC Library Index ===');

global.window = global;
global.window.addEventListener = () => {};
global.document = undefined;
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: opt => opt === 'test' };
global.PluginManager = { parameters: () => ({}) };
global.$gameMap = { mapId: () => 1, tileWidth: () => 48, tileHeight: () => 48 };

const root = path.join(__dirname, 'lpc_index_fixture');
fs.rmSync(root, { recursive: true, force: true });
process.on('exit', () => fs.rmSync(root, { recursive: true, force: true }));
const lib = path.join(root, 'library');
const write = (rel, data) => { const f = path.join(lib, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, typeof data === 'string' ? data : JSON.stringify(data)); };

const credit = (file, licenses, authors = ['Ann']) => ({ file, licenses, authors, urls: ['https://opengameart.org/x'], notes: '' });
// A body whose male folder offers OGA-BY but whose female folder doesn't.
write('sheet_definitions/body/body.json', {
    name: 'Body Color', priority: 10, type_name: 'body', match_body_color: true, animations: ['walk'],
    layer_1: { zPos: 10, male: 'body/bodies/male/', female: 'body/bodies/female/' },
    recolors: { material: 'body', palettes: ['ulpc'] },
    credits: [credit('body/bodies/male', ['OGA-BY 3.0', 'CC-BY-SA 3.0']), credit('body/bodies/female', ['CC-BY-SA 3.0', 'GPL 3.0'], ['Bea'])]
});
write('sheet_definitions/body/meta_body.json', { priority: 1 });
write('sheet_definitions/hair/bob/hair_bob.json', {
    name: 'Bob', type_name: 'hair', layer_1: { zPos: 120, male: 'hair/bob/adult/', female: 'hair/bob/adult/' }, sparkle: true,
    credits: [credit('hair/bob', ['CC0'], ['Cy'])]
});
write('sheet_definitions/weapons/sword.json', {
    name: 'Sword', type_name: 'weapon', layer_1: { zPos: 140, male: 'weapon/sword/' }, layer_2: { zPos: -1, male: 'weapon/sword/behind/' },
    credits: [credit('weapon/sword', ['CC-BY-SA 3.0'])]
});
write('sheet_definitions/broken/no_z.json', { name: 'No z', layer_1: { male: 'x/' } });
write('sheet_definitions/broken/no_bodies.json', { name: 'Ghost', layer_1: { zPos: 3 } });
write('sheet_definitions/broken/bad.json', '{ not json');
write('sheet_definitions/broken/no_credits.json', { name: 'Mystery', layer_1: { zPos: 5, male: 'mystery/' } });
write('palette_definitions/body/meta_body.json', { label: 'Skintone', default: 'ulpc', base: 'light' });
write('palette_definitions/body/body_ulpc.json', { light: ['#271920', '#99423C'], olive: ['#271920', '#442725'], broken: ['red'] });
write('palette_definitions/hair/meta_hair.json', { label: 'Hair', default: 'lpcr', base: 'orange' });
write('palette_definitions/hair/hair_ulpc.json', { orange: ['#260D14'] });
write('palette_definitions/empty/meta_empty.json', { label: 'Nothing' });
fs.mkdirSync(path.join(lib, 'spritesheets'), { recursive: true });
write('.git/HEAD', 'ref: refs/heads/master\n');
write('.git/packed-refs', '# pack-refs with: peeled\nb2c85f98de52624b454dfdfac329bfee75795c2d refs/heads/master\n');

require('../Docs-Doodads.js');
const L = DocsDoodads.Lpc;

// 1. The library is recognised; the index holds the good parts, skips the rest with reasons, notes new fields.
assert.strictEqual(L.isLibrary(fs, path, lib), true);
assert.strictEqual(L.isLibrary(fs, path, root), false, 'a folder without sheet_definitions is not a library');
assert.strictEqual(L.scan(fs, path, root), null);
const index = L.scan(fs, path, lib, '2026-10-19T10:00:00.000Z');
assert.strictEqual(index.format, 'docs-doodads-lpc-index');
assert.deepStrictEqual(index.parts.map(p => p.id), ['body/body', 'broken/no_credits', 'hair/bob/hair_bob', 'weapons/sword'], 'meta_ files are not parts');
assert.deepStrictEqual(index.skipped.map(s => s.id + ': ' + s.why).sort(),
    ['broken/bad: not readable JSON', 'broken/no_bodies: layer_1 has no body types', 'broken/no_z: layer_1 has no zPos']);
assert.deepStrictEqual(index.newFields, ['sparkle'], 'fields the library added are reported');
assert.strictEqual(index.commit, 'b2c85f98de52624b454dfdfac329bfee75795c2d', 'commit from packed-refs');
write('.git/refs/heads/master', 'AAAABBBBCCCCDDDDEEEEFFFF0000111122223333\n');
assert.strictEqual(L.libraryCommit(fs, path, lib), 'aaaabbbbccccddddeeeeffff0000111122223333', 'a loose ref wins');
const sword = index.parts.find(p => p.id === 'weapons/sword');
assert.deepStrictEqual(sword.layers.map(l => l.z), [140, -1], 'layers in order with their z');
assert.strictEqual(sword.category, 'weapons');
console.log('✓ scan: parts, skipped with reasons, new fields, commit');

// 2. Licences: judged per body type's folders. The body is safe for male (OGA-BY offered) but not female.
const body = index.parts.find(p => p.id === 'body/body');
assert.deepStrictEqual(body.safeFor, { male: true, female: false });
assert.strictEqual(body.safeToEncrypt, true, 'usable safely by at least one body type');
assert.deepStrictEqual(index.parts.find(p => p.id === 'hair/bob/hair_bob').safeFor, { male: true, female: true });
assert.strictEqual(sword.safeToEncrypt, false);
assert.strictEqual(index.parts.find(p => p.id === 'broken/no_credits').credited, false);
assert.strictEqual(index.parts.find(p => p.id === 'broken/no_credits').safeToEncrypt, false, 'no credits: never safe');
assert.strictEqual(L.creditFor(body.credits, 'body/bodies/male/').file, 'body/bodies/male');
assert.strictEqual(L.creditFor(body.credits, 'body/bodies/males/'), null, 'a prefix must end at a folder');
assert.strictEqual(L.creditFor([credit('a', []), credit('a/b', [])], 'a/b/c/').file, 'a/b', 'the longest prefix wins');
assert.strictEqual(L.preferredLicence(['GPL 3.0', 'CC-BY-SA 3.0', 'OGA-BY 3.0']), 'OGA-BY 3.0');
assert.strictEqual(L.preferredLicence(['CC-BY-SA 4.0', 'CC-BY 4.0']), 'CC-BY 4.0', 'CC-BY before CC-BY-SA');
console.log('✓ licences: per folder, longest prefix, the most open named first');

// 3. Palettes: the default version, base ramp, bad ramps dropped, empty materials left out.
assert.deepStrictEqual(Object.keys(index.palettes).sort(), ['body', 'hair']);
assert.strictEqual(index.palettes.body.base, 'light');
assert.deepStrictEqual(index.palettes.body.versions.ulpc.light, ['#271920', '#99423c'], 'lower case');
assert.strictEqual(index.palettes.body.versions.ulpc.broken, undefined);
assert.strictEqual(index.palettes.hair.version, 'ulpc', 'a default that is missing falls back to a version that exists');
console.log('✓ palettes: versions, base, bad ramps dropped');

// 4. The summary, the saved-index check, and a library inside the project.
const s = L.summary(index, true);
assert.deepStrictEqual([s.parts, s.safe, s.usable, s.skipped, s.materials], [4, 2, 2, 3, 2]);
assert.deepStrictEqual(s.categories, { body: 1, hair: 1 });
assert.strictEqual(L.summary(index, false).usable, 4);
assert.strictEqual(L.validIndex({ format: 'other' }), null);
assert.strictEqual(L.validIndex(JSON.parse(JSON.stringify(index))).parts.length, 4, 'survives a save and load');
assert.strictEqual(L.insideProject(path, path.join(root, 'proj', 'lpc'), path.join(root, 'proj')), true);
assert.strictEqual(L.insideProject(path, path.join(root, 'proj'), path.join(root, 'proj')), true);
assert.strictEqual(L.insideProject(path, path.join(root, 'proj2'), path.join(root, 'proj')), false, 'a sibling with a longer name is outside');
assert.strictEqual(L.insideProject(path, lib, path.join(root, 'proj')), false);
console.log('✓ summary, saved index check, library inside the project');

// 5. Credits: one entry per credited folder, an image unsafe when any file is, uncredited art flagged.
const used = [{ part: body, folder: 'body/bodies/male/' }, { part: index.parts.find(p => p.id === 'hair/bob/hair_bob'), folder: 'hair/bob/adult/' },
    { part: index.parts.find(p => p.id === 'hair/bob/hair_bob'), folder: 'hair/bob/adult/' }];
const files = L.creditsForLayers(used);
assert.deepStrictEqual(files.map(f => f.file), ['body/bodies/male', 'hair/bob'], 'one entry per credited folder');
assert.ok(files.every(f => f.safeToEncrypt));
let credits = L.recordImage(null, 'img/characters/$Hero.png', files, '2026-10-19T10:00:00.000Z');
assert.strictEqual(credits.images['img/characters/$Hero.png'].safeToEncrypt, true);
credits = L.recordImage(credits, 'img/characters/$Knight.png', L.creditsForLayers([{ part: body, folder: 'body/bodies/male/' }, { part: sword, folder: 'weapon/sword/' }]));
credits = L.recordImage(credits, 'img/characters/$Odd.png', L.creditsForLayers([{ part: index.parts.find(p => p.id === 'broken/no_credits'), folder: 'mystery/' }]));
assert.deepStrictEqual(L.unsafeImages(credits).map(u => u.image), ['img/characters/$Knight.png', 'img/characters/$Odd.png']);
assert.deepStrictEqual(L.unsafeImages(credits)[0].licences, ['CC-BY-SA 3.0'], 'only the licences of the files that are not safe');
assert.strictEqual(L.unsafeImages(credits)[1].uncredited, true);
assert.deepStrictEqual(L.unsafeImages(credits, img => !img.includes('Odd')).map(u => u.image), ['img/characters/$Knight.png'], 'images gone from the project are left out');
credits = L.forgetImage(credits, 'img/characters/$Odd.png');
assert.strictEqual(credits.images['img/characters/$Odd.png'], undefined);
assert.deepStrictEqual(L.validCredits({ format: 'nope' }).images, {}, 'a file in another format starts empty');
console.log('✓ credits: per folder, unsafe images, uncredited art, forgetting');

// 6. CREDITS_LPC.txt: each image, its art, authors, the licence used (the most open) and links.
const text = L.creditsTextFor(credits);
assert.ok(text.startsWith('ART CREDITS\n'));
assert.ok(/img\/characters\/\$Hero\.png\n  - Body Color \(body\/bodies\/male\)\n    by Ann\n    licence: OGA-BY 3\.0 \[also CC-BY-SA 3\.0\]\n    https:\/\/opengameart\.org\/x/.test(text), text);
assert.ok(/  - Bob \(hair\/bob\)\n    by Cy\n    licence: CC0\n/.test(text));
assert.ok(/\$Knight\.png[\s\S]*licence: CC-BY-SA 3\.0\n/.test(text), 'a sword offered only under CC-BY-SA says so');
assert.ok(text.endsWith('\n') && !text.endsWith('\n\n'));
assert.ok(!/\$Hero/.test(L.creditsTextFor(credits, img => !img.includes('Hero'))), 'images gone from the project are left out');
assert.ok(/NO CREDITS FOUND/.test(L.creditsTextFor(L.recordImage(null, 'x.png', L.creditsForLayers([{ part: index.parts.find(p => p.id === 'broken/no_credits'), folder: 'mystery/' }])))));
assert.ok(/No images made/.test(L.creditsTextFor(null)));
console.log('✓ CREDITS_LPC.txt: images, art, authors, licence used and links');

// 7. The project setting defaults to art that is safe to encrypt.
assert.strictEqual(DocsDoodads.World.defaults.lpc.safeOnly, true);

console.log('=== LPC library index passed ===');
