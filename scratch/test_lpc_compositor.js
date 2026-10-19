// scratch/test_lpc_compositor.js
// LPC compositor, phase 2: which images a recipe stacks (body types, fixed-colour variants, ${head} paths,
// required tags, missing animations), in z order; colours swapped from each material's base ramp (and a
// channel's own source ramp, and the body's skin for parts that match it); alpha stacking; the cache of
// recoloured layers; frames; and random characters. Images are made in memory.
const assert = require('assert');

console.log('=== Testing LPC Compositor ===');

global.window = global;
global.window.addEventListener = () => {};
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: () => false };
global.PluginManager = { parameters: () => ({}) };

require('../Docs-Doodads.js');
const L = DocsDoodads.Lpc, C = DocsDoodads.LpcCompose;

const SKIN = { light: ['#111111', '#aaaaaa'], olive: ['#222222', '#bbbbbb'] };
const HAIR = { orange: ['#ff8800'], black: ['#000001'] };
const EYE = { blue: ['#0000ff'], green: ['#00ff00'] };
const palettes = L.readPalettes([
    { material: 'body', meta: { default: 'ulpc', base: 'light' }, versions: { ulpc: SKIN } },
    { material: 'hair', meta: { default: 'ulpc', base: 'orange' }, versions: { ulpc: HAIR } },
    { material: 'eye', meta: { default: 'ulpc' }, versions: { ulpc: EYE } }
]);
// Each part credits its own top folder under CC0.
const def = (o) => {
    const folders = Object.keys(o).filter(k => /^layer_/.test(k)).flatMap(k => Object.values(o[k]).filter(v => typeof v === 'string' && v.includes('/')));
    return Object.assign({ credits: [...new Set(folders.map(f => f.split('/')[0]))].map(file => ({ file, licenses: ['CC0'], authors: ['A'] })) }, o);
};
const parts = [
    ['body/body', def({ name: 'Body Color', type_name: 'body', match_body_color: true, priority: 10, recolors: { material: 'body' },
        layer_1: { zPos: 10, male: 'body/male/', female: 'body/female/' } })],
    ['head/human_male', def({ name: 'Human Male', type_name: 'head', tags: ['human'], match_body_color: true,
        recolors: { color_1: { material: 'body' }, color_2: { material: 'eye', source: ['#0000ff'] } }, layer_1: { zPos: 100, male: 'head/male/', female: 'head/male/' } })],
    ['head/face_angry', def({ name: 'Angry', type_name: 'expression', required_tags: ['human'], replace_in_path: { head: { Human_Male: 'male' } },
        layer_1: { zPos: 101, male: 'faces/${head}/anger/' } })],
    ['head/elf_ears', def({ name: 'Elf Ears', type_name: 'ears', required_tags: ['elf'], layer_1: { zPos: 105, male: 'ears/elf/' } })],
    ['hair/bob', def({ name: 'Bob', type_name: 'hair', recolors: { material: 'hair' }, layer_1: { zPos: 120, male: 'hair/bob/', female: 'hair/bob/' } })],
    ['torso/robe', def({ name: 'Robe', type_name: 'clothes', variants: ['red', 'blue'], layer_1: { zPos: 35, male: 'torso/robe/' } })],
    ['weapons/sword', def({ name: 'Sword', type_name: 'weapon', animations: ['slash', 'walk'], layer_1: { zPos: 140, male: 'weapon/sword/' }, layer_2: { zPos: 1, male: 'weapon/sword/behind/' } })],
    ['body/wheelchair', def({ name: 'Wheelchair', type_name: 'wheelchair', variants: ['black'], animations: ['wheelchair'],
        layer_1: { zPos: -2, custom_animation: 'wheelchair', male: 'chair/back/' } })],
    ['legs/skirt', def({ name: 'Skirt', type_name: 'legs', layer_1: { zPos: 20, female: 'legs/skirt/' } })]
];
const index = { parts: parts.map(([id, d]) => L.readPart(id, d)), palettes };

// 2x1 pixel images: a stand-in for each file, coloured so the stacking order shows.
const px = (...cols) => ({ width: cols.length, height: 1, data: new Uint8ClampedArray(cols.flat()) });
const files = {
    'body/male/walk.png': px([0xaa, 0xaa, 0xaa, 255], [0x11, 0x11, 0x11, 255]),
    'body/female/walk.png': px([0xaa, 0xaa, 0xaa, 255], [0xaa, 0xaa, 0xaa, 255]),
    'head/male/walk.png': px([0, 0, 0, 0], [0, 0, 255, 255]),
    'faces/male/anger/walk.png': px([0, 0, 0, 0], [9, 9, 9, 255]),
    'hair/bob/walk.png': px([0xff, 0x88, 0, 128], [0, 0, 0, 0]),
    'torso/robe/walk/red.png': px([200, 0, 0, 255], [0, 0, 0, 0]),
    'weapon/sword/walk.png': px([0, 0, 0, 0], [0, 0, 0, 0]),
    'weapon/sword/behind/walk.png': px([1, 1, 1, 255], [1, 1, 1, 255]),
    'weapon/sword/slash.png': px([5, 5, 5, 255], [5, 5, 5, 255], [5, 5, 5, 255]),
    'body/male/slash.png': px([0xaa, 0xaa, 0xaa, 255], [0xaa, 0xaa, 0xaa, 255], [0xaa, 0xaa, 0xaa, 255]),
    'chair/back/black.png': px([3, 3, 3, 255])
};
const exists = f => f in files;
let loads = 0;
const load = f => { loads++; return files[f] || null; };
const ids = r => r.layers.map(l => l.file);

// 1. Which files, in z order; fixed-colour variants; ${head}; required tags; animations; body types.
const recipe = { body: 'male', picks: [
    { id: 'hair/bob', colours: ['black'] }, { id: 'body/body', colours: ['olive'] }, { id: 'head/human_male', colours: ['light', 'green'] },
    { id: 'head/face_angry' }, { id: 'head/elf_ears' }, { id: 'torso/robe', variant: 'red' }, { id: 'weapons/sword' }, { id: 'legs/skirt' }, { id: 'gone/part' }
] };
let r = C.resolve(index, recipe, 'walk', exists);
assert.deepStrictEqual(ids(r), ['weapon/sword/behind/walk.png', 'body/male/walk.png', 'torso/robe/walk/red.png', 'head/male/walk.png',
    'faces/male/anger/walk.png', 'hair/bob/walk.png', 'weapon/sword/walk.png'], 'z order, whatever order they were picked in');
assert.ok(r.warnings.some(w => /no part "gone\/part"/.test(w)));
assert.ok(r.warnings.some(w => /Elf Ears goes with elf/.test(w)), 'a part needing a tag nobody has');
assert.ok(r.warnings.some(w => /Skirt has nothing for the male body/.test(w)));
assert.deepStrictEqual(r.used.map(u => u.folder).sort(), ['body/male/', 'faces/male/anger/', 'hair/bob/', 'head/male/', 'torso/robe/', 'weapon/sword/', 'weapon/sword/behind/'], 'folders used, for credits');
r = C.resolve(index, { body: 'male', picks: [{ id: 'weapons/sword' }] }, 'thrust', exists);
assert.deepStrictEqual(ids(r), []);
assert.ok(/Sword has no thrust/.test(r.warnings[0]));
r = C.resolve(index, { body: 'male', picks: [{ id: 'torso/robe', variant: 'green' }] }, 'walk', exists);
assert.ok(/Robe has no walk picture/.test(r.warnings[0]), 'a variant that is not there');
r = C.resolve(index, { body: 'male', picks: [{ id: 'body/wheelchair', variant: 'black' }] }, 'wheelchair', exists);
assert.deepStrictEqual(ids(r), ['chair/back/black.png'], 'a custom animation is one picture per variant');
assert.deepStrictEqual(ids(C.resolve(index, { body: 'male', picks: [{ id: 'body/wheelchair', variant: 'black' }] }, 'walk', exists)), []);
r = C.resolve(index, { body: 'female', picks: [{ id: 'body/body', colours: ['light'] }, { id: 'head/face_angry' }] }, 'walk', exists);
assert.ok(r.warnings.some(w => /Angry goes with human/.test(w)), 'without the human head, the face is not drawn');
assert.strictEqual(C.fileOf('combat'), 'combat_idle');
assert.strictEqual(C.fileOf('1h_backslash'), 'backslash');
console.log('✓ resolve: z order, variants, ${head}, required tags, animations, body types');

// 2. Colours: base ramp to the chosen ramp; the body's skin for matching parts; a channel's own source ramp.
const body = index.parts.find(p => p.id === 'body/body'), head = index.parts.find(p => p.id === 'head/human_male');
assert.strictEqual(C.channels(head).length, 2);
let maps = C.recolourMaps(palettes, body, ['olive'], 'olive');
assert.deepStrictEqual(maps[0].get(0xaaaaaa), [0xbb, 0xbb, 0xbb]);
maps = C.recolourMaps(palettes, head, ['light', 'green'], 'olive');
assert.deepStrictEqual(maps[0].get(0x111111), [0x22, 0x22, 0x22], 'the head follows the body skin, not its own colour');
assert.deepStrictEqual(maps[1].get(0x0000ff), [0, 255, 0], 'eyes from the channel source ramp');
assert.deepStrictEqual(C.recolourMaps(palettes, body, ['light'], 'light'), [], 'already the base: nothing to swap');
assert.deepStrictEqual(C.recolourMaps(palettes, body, ['nonsense'], ''), [], 'an unknown ramp is left alone');
assert.strictEqual(C.colourKey(head, ['light', 'green'], 'olive'), 'olive,green');
console.log('✓ colours: base ramps, skin matching, source ramps');

// 3. Compose: stacked with alpha, recoloured, cached; layers drawn at another size left out.
const cache = C.newCache(50);
r = C.resolve(index, { body: 'male', picks: [{ id: 'body/body', colours: ['olive'] }, { id: 'head/human_male', colours: ['light', 'green'] }, { id: 'hair/bob', colours: ['black'] }] }, 'walk', exists);
let out = C.compose(r, index, load, cache);
assert.deepStrictEqual(Array.from(out.sheet.data), [
    93, 93, 94, 255, // hair 'black' (#000001) at alpha 128 over olive skin (#bbbbbb)
    0, 255, 0, 255 // green eyes over the body
]);
assert.deepStrictEqual(Array.from(files['body/male/walk.png'].data.slice(0, 4)), [0xaa, 0xaa, 0xaa, 255], 'the loaded image is not changed');
assert.strictEqual(loads, 3);
out = C.compose(C.resolve(index, { body: 'male', picks: [{ id: 'body/body', colours: ['olive'] }, { id: 'head/human_male', colours: ['light', 'green'] }, { id: 'hair/bob', colours: ['black'] }] }, 'walk', exists), index, load, cache);
assert.strictEqual(loads, 3, 'the second time comes from the cache');
assert.strictEqual(cache.hits, 3);
C.compose(C.resolve(index, { body: 'male', picks: [{ id: 'body/body', colours: ['light'] }] }, 'walk', exists), index, load, cache);
assert.strictEqual(loads, 4, 'other colours: loaded again');
const small = C.newCache(2);
for (const k of ['a', 'b', 'c']) C.cached(small, k, () => ({ k }));
assert.deepStrictEqual([...small.map.keys()], ['b', 'c'], 'the oldest dropped');
C.cached(small, 'b', () => null);
C.cached(small, 'd', () => ({}));
assert.deepStrictEqual([...small.map.keys()], ['b', 'd'], 'a hit makes it newest');
out = C.compose(C.resolve(index, { body: 'male', picks: [{ id: 'body/body', colours: ['light'] }, { id: 'weapons/sword' }] }, 'slash', exists), index, load, null);
assert.deepStrictEqual(out.sheet.width, 3);
r = C.resolve(index, { body: 'male', picks: [{ id: 'body/body', colours: ['light'] }] }, 'walk', exists);
r.layers.push({ z: 200, priority: 0, order: 9, file: 'weapon/sword/slash.png', part: index.parts.find(p => p.id === 'weapons/sword'), pick: {} });
out = C.compose(r, index, load, null);
assert.ok(out.warnings.some(w => /another size \(3x1\)/.test(w)), 'oversize art left out with a warning');
out = C.compose({ layers: [{ z: 0, file: 'missing.png', part: body, pick: {} }], warnings: [] }, index, load, null);
assert.strictEqual(out.sheet, null);
assert.ok(/Could not read missing\.png/.test(out.warnings[0]));
console.log('✓ compose: alpha, recolour, cache (and its limit), other sizes left out');

// 4. Frames: four direction rows (one row for hurt), frames along the row.
assert.deepStrictEqual(C.frameRect('walk', 'down', 3), { x: 192, y: 128, w: 64, h: 64 });
assert.deepStrictEqual(C.frameRect('walk', 'up', 9), { x: 0, y: 0, w: 64, h: 64 }, 'frames wrap');
assert.deepStrictEqual(C.frameRect('hurt', 'right', 5), { x: 320, y: 0, w: 64, h: 64 });
console.log('✓ frames');

// 5. Random characters: a body and head, only parts that suit the body, and safe ones when asked.
let seed = 7;
const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
for (let i = 0; i < 20; i++) {
    const rec = C.randomRecipe(index, { rand, safeOnly: true, body: 'male' });
    assert.strictEqual(rec.body, 'male');
    assert.strictEqual(rec.picks[0].id, 'body/body');
    assert.ok(['light', 'olive'].includes(rec.picks[0].colours[0]));
    assert.strictEqual(rec.picks[1].id, 'head/human_male');
    assert.ok(rec.picks.every(p => !['head/face_angry', 'head/elf_ears', 'legs/skirt', 'body/wheelchair'].includes(p.id)), 'nothing needing tags, other bodies or a custom animation');
    const robe = rec.picks.find(p => p.id === 'torso/robe');
    if (robe) assert.ok(['red', 'blue'].includes(robe.variant));
}
console.log('✓ random characters');

console.log('=== LPC compositor passed ===');
