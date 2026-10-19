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
assert.deepStrictEqual(ids(C.resolve(index, { body: 'male', picks: [{ id: 'torso/robe' }] }, 'walk', exists)), ['torso/robe/walk/red.png'], 'no variant given: the first');
r = C.resolve(index, { body: 'male', picks: [{ id: 'body/wheelchair', variant: 'black' }] }, 'wheelchair', exists);
assert.deepStrictEqual(ids(r), ['chair/back/black.png'], 'a custom animation is one picture per variant');
assert.deepStrictEqual(ids(C.resolve(index, { body: 'male', picks: [{ id: 'body/wheelchair', variant: 'black' }] }, 'walk', exists)), []);
r = C.resolve(index, { body: 'female', picks: [{ id: 'body/body', colours: ['light'] }, { id: 'head/face_angry' }] }, 'walk', exists);
assert.ok(r.warnings.some(w => /Angry goes with human/.test(w)), 'without the human head, the face is not drawn');
r = C.resolve(index, { body: 'male', picks: [{ id: 'weapons/sword' }] }, 'slash', exists);
assert.deepStrictEqual([ids(r), r.warnings], [['weapon/sword/slash.png'], []], 'a layer missing for one animation is fine while another layer has it');
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

// 4b. Oversize weapon art: the bigger animation that stands for one (slash_oversize for slash, walk_128 for
// walk...), drawn at its size on a sheet of bigger frames with the 64-pixel layers in the middle of each;
// a return swing plays the body backwards; normal art first; left out on request (Visual Equipment parts).
const big = [
    ['weapons/longsword', def({ name: 'Longsword', type_name: 'weapon', variants: ['long'], animations: ['walk', 'slash_oversize', 'thrust_oversize'],
        layer_1: { zPos: 140, male: 'weapon/long/' },
        layer_2: { zPos: -1, custom_animation: 'slash_oversize', male: 'weapon/long/attack_slash/behind/' },
        layer_3: { zPos: 150, custom_animation: 'slash_oversize', male: 'weapon/long/attack_slash/' },
        layer_4: { zPos: 150, custom_animation: 'thrust_oversize', male: 'weapon/long/attack_thrust/' } })],
    ['weapons/club', def({ name: 'Club', type_name: 'weapon', variants: ['club'], animations: ['slash_reverse_oversize'],
        layer_1: { zPos: 150, custom_animation: 'slash_reverse_oversize', male: 'weapon/club/' } })],
    ['weapons/spear', def({ name: 'Spear', type_name: 'weapon', variants: ['spear'], animations: ['walk_128'],
        layer_1: { zPos: 140, custom_animation: 'walk_128', male: 'weapon/spear/walk/' } })],
    ['weapons/arming', def({ name: 'Arming Sword', type_name: 'weapon', variants: ['steel'], animations: ['walk', 'backslash_128'],
        layer_1: { zPos: 140, custom_animation: 'backslash_128', male: 'weapon/arming/backslash/' } })],
    ['weapons/bow', def({ name: 'Bow', type_name: 'weapon', variants: ['light'], animations: ['walk', 'walk_128'],
        layer_1: { zPos: 140, male: 'weapon/bow/' }, layer_2: { zPos: 141, custom_animation: 'walk_128', male: 'weapon/bow/walk/' } })]
];
const bigIndex = { parts: index.parts.concat(big.map(([id, d]) => L.readPart(id, d))), palettes };
// A sheet of cols x rows cells of size cell; paint(frame, row, x, y) -> [r, g, b, a] or null.
const grid = (cols, rows, cell, paint) => {
    const img = C.blank(cols * cell, rows * cell);
    for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) {
        const c = paint(Math.floor(x / cell), Math.floor(y / cell), x % cell, y % cell);
        if (c) img.data.set(c, (y * img.width + x) * 4);
    }
    return img;
};
// The body: each 64-pixel cell solid from y 10 down, coloured by frame and row.
const bodyCells = frames => grid(frames, 4, 64, (f, r, x, y) => (y >= 10 ? [f * 20 + 10, r * 50 + 10, 1, 255] : null));
// A weapon: a dot at (5, 5) of each cell, one at the body's spot (64 + 10, 64 + 20), and one behind it.
const weaponCells = (cols, cell, tint) => grid(cols, 4, cell, (f, r, x, y) => ((x === 5 && y === 5) || (x === cell / 2 - 22 && y === cell / 2 - 12) ? [tint, f * 20, r * 50, 255] : null));
const bigFiles = {
    'body/male/slash.png': bodyCells(6), 'body/male/walk.png': bodyCells(9), 'body/male/backslash.png': bodyCells(13), 'body/male/thrust.png': bodyCells(8),
    'weapon/long/walk.png': weaponCells(9, 64, 210),
    'weapon/long/attack_slash/long.png': weaponCells(6, 192, 200),
    'weapon/long/attack_slash/behind/long.png': grid(6, 4, 192, (f, r, x, y) => (x === 64 + 30 && y === 64 + 40 ? [1, 2, 3, 255] : null)),
    'weapon/long/attack_thrust/long.png': C.blank(8 * 192, 4 * 100), // not 192-pixel frames: left out
    'weapon/club/club.png': weaponCells(6, 192, 190),
    'weapon/spear/walk/spear.png': weaponCells(13, 128, 180), // padded to 13 columns, as the library does
    'weapon/arming/backslash/steel.png': weaponCells(13, 128, 170),
    'weapon/bow/walk.png': weaponCells(9, 64, 160), 'weapon/bow/walk/light.png': weaponCells(13, 128, 150)
};
const bigExists = f => f in bigFiles;
const bigLoad = f => bigFiles[f] || null;
const at = (img, x, y) => Array.from(img.data.slice((y * img.width + x) * 4, (y * img.width + x) * 4 + 4));
const male = (...ids) => ({ body: 'male', picks: [{ id: 'body/body', colours: ['light'] }].concat(ids.map(id => ({ id }))) });

assert.deepStrictEqual(C.standIns('slash'), ['slash_128', 'slash_oversize', 'slash_reverse_oversize']);
assert.deepStrictEqual(C.standIns('1h_backslash'), ['backslash_128'], 'by the animation file');
assert.deepStrictEqual(C.standIns('walk'), ['walk_128']);
assert.deepStrictEqual(C.standIns('idle'), []);
r = C.resolve(bigIndex, male('weapons/longsword'), 'slash', bigExists);
assert.deepStrictEqual(ids(r), ['weapon/long/attack_slash/behind/long.png', 'body/male/slash.png', 'weapon/long/attack_slash/long.png']);
assert.deepStrictEqual([r.frame, r.reverse, r.oversize, r.warnings], [192, false, ['slash_oversize'], []]);
assert.deepStrictEqual(r.layers.map(l => l.frame), [192, 64, 192]);
assert.deepStrictEqual(r.used.map(u => u.folder).sort(), ['body/male/', 'weapon/long/attack_slash/', 'weapon/long/attack_slash/behind/'], 'credited');
out = C.compose(r, bigIndex, bigLoad, null);
assert.deepStrictEqual([out.sheet.width, out.sheet.height, out.sheet.frame, out.warnings], [1152, 768, 192, []]);
assert.deepStrictEqual(at(out.sheet, 2 * 192 + 64 + 40, 192 + 64 + 30), [2 * 20 + 10, 60, 1, 255], 'the body in the middle of the bigger frame (frame 2, left)');
assert.deepStrictEqual(at(out.sheet, 2 * 192 + 5, 192 + 5), [200, 40, 50, 255], 'the weapon at its size');
assert.deepStrictEqual(at(out.sheet, 2 * 192 + 64 + 10, 192 + 64 + 20), [200, 40, 50, 255], 'in front of the body');
assert.deepStrictEqual(at(out.sheet, 2 * 192 + 64 + 30, 192 + 64 + 40), [2 * 20 + 10, 60, 1, 255], 'the part behind the body is behind it');
assert.deepStrictEqual(at(out.sheet, 2 * 192 + 64 + 30, 192 + 64 + 5), [0, 0, 0, 0], 'nothing above the body\'s own art');
r = C.resolve(bigIndex, male('weapons/longsword'), 'slash', bigExists, { oversize: false });
assert.deepStrictEqual([ids(r), r.frame, r.warnings], [['body/male/slash.png'], 64, ['Longsword has no slash.']], 'left out on request');
r = C.resolve(bigIndex, male('weapons/longsword'), 'walk', bigExists);
assert.deepStrictEqual([ids(r), r.frame], [['body/male/walk.png', 'weapon/long/walk.png'], 64], 'the usual walk, at its size');
r = C.resolve(bigIndex, male('weapons/longsword'), 'thrust', bigExists);
out = C.compose(r, bigIndex, bigLoad, null);
assert.ok(out.warnings.some(w => /Longsword is drawn at another size \(1536x400\); left out/.test(w)), 'art whose frames are not the size it should be');
assert.deepStrictEqual([out.sheet.width, out.sheet.frame], [8 * 192, 192]);
// A return swing: the body's slash backwards.
r = C.resolve(bigIndex, male('weapons/club'), 'slash', bigExists);
assert.deepStrictEqual([r.frame, r.reverse, r.oversize], [192, true, ['slash_reverse_oversize']]);
out = C.compose(r, bigIndex, bigLoad, null);
assert.deepStrictEqual(at(out.sheet, 0 * 192 + 64 + 40, 2 * 192 + 64 + 30), [5 * 20 + 10, 110, 1, 255], 'frame 0 shows the body\'s last frame');
assert.deepStrictEqual(at(out.sheet, 0 * 192 + 5, 2 * 192 + 5), [190, 0, 100, 255], 'the weapon keeps its own order');
r = C.resolve(bigIndex, male('weapons/club', 'weapons/longsword'), 'slash', bigExists);
assert.deepStrictEqual([r.reverse, r.oversize], [false, ['slash_oversize']]);
assert.ok(r.warnings.some(w => /Club only swings back.*left out/.test(w)), 'forward and back at once: the forward swing wins');
// walk_128: a spear carried on 128-pixel frames, the padded columns ignored.
r = C.resolve(bigIndex, male('weapons/spear'), 'walk', bigExists);
out = C.compose(r, bigIndex, bigLoad, null);
assert.deepStrictEqual([r.frame, out.sheet.width, out.sheet.height], [128, 9 * 128, 512]);
assert.deepStrictEqual(at(out.sheet, 8 * 128 + 32 + 40, 3 * 128 + 32 + 30), [8 * 20 + 10, 160, 1, 255], 'the body in the middle of 128');
assert.deepStrictEqual(at(out.sheet, 8 * 128 + 5, 3 * 128 + 5), [180, 160, 150, 255]);
assert.ok(C.resolve(bigIndex, male('weapons/spear'), 'idle', bigExists).warnings.includes('Spear has no idle.'));
r = C.resolve(bigIndex, male('weapons/arming'), '1h_backslash', bigExists);
assert.deepStrictEqual([r.frame, C.compose(r, bigIndex, bigLoad, null).sheet.width], [128, 13 * 128], 'backslash_128 for the 13-frame backslash');
r = C.resolve(bigIndex, male('weapons/bow'), 'walk', bigExists);
assert.deepStrictEqual([ids(r), r.frame], [['body/male/walk.png', 'weapon/bow/walk.png'], 64], 'normal art first when a part has both');
r = C.resolve(bigIndex, male('weapons/spear'), 'walk', f => f !== 'weapon/spear/walk/spear.png' && bigExists(f));
assert.deepStrictEqual([ids(r), r.frame], [['body/male/walk.png'], 64]);
assert.ok(r.warnings.includes('Spear has no walk picture for the male body.'));
assert.deepStrictEqual(C.frameRect('slash', 'left', 2, 192), { x: 384, y: 192, w: 192, h: 192 });
console.log('✓ oversize weapon art: stand-ins, bigger frames, centred body, return swing, left out on request');

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
