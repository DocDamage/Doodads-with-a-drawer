// scratch/test_memao.js
// The Memao creator: the pack's index (README names, draw order, pairs, sleeves per arm), the compositor (an
// animation's frames per facing, depth per facing, recolouring of the greys only, pairs, props), the slots
// (first character, ◀ ▶, arms, colours that follow), the MZ exports (walkers, actions, the paint rows, the
// battler, the face), and in the editor: the scan, the export and the Character Creator window opened for
// Memao. The pack is synthetic, made in memory at the real sheets' sizes.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

console.log('=== Testing Memao Creator ===');

const store = {};
global.window = global;
global.innerWidth = 1400;
const listeners = {};
global.window.addEventListener = (type, fn) => { listeners[type] = fn; };
global.window.removeEventListener = (type, fn) => { if (listeners[type] === fn) delete listeners[type]; };
global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
let root = null, card = null;
const stubs = {};
const ctx2d = { createImageData: (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }), putImageData() {}, drawImage() {}, clearRect() {} };
global.document = {
    createElement: tag => ({ tagName: tag.toUpperCase(), style: {}, innerHTML: '', setAttribute() {}, appendChild() {}, getContext: () => ctx2d }),
    body: { appendChild(n) { if (n.id === 'dd-creator') root = n; if (n.id === 'dd-lpc-card') card = n; n.parentNode = this; }, removeChild(n) { if (n === root) root = null; if (n === card) card = null; } },
    getElementById: id => {
        if (id === 'dd-creator') return root;
        if (id === 'dd-lpc-card') return card;
        const html = (root ? root.innerHTML : '') + (card ? card.innerHTML : '');
        if (!html.includes(`id="${id}"`)) return null;
        if (!stubs[id]) stubs[id] = { id, getContext: () => ctx2d, width: 256, height: 256, style: {} };
        return stubs[id];
    },
    querySelector: () => null,
    querySelectorAll: () => []
};
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: opt => opt === 'test' };
global.PluginManager = { parameters: () => ({}) };
global.$gameMap = { mapId: () => 1, tileWidth: () => 48, tileHeight: () => 48 };
global.$dataDocsDoodads = { 1: [] };

// ---- A synthetic pack ----
const fixture = path.join(__dirname, 'memao_fixture');
fs.rmSync(fixture, { recursive: true, force: true });
const project = path.join(fixture, 'project'), pack = path.join(fixture, 'memao-assets');
const write = (rel, data) => { const f = path.join(pack, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, data); };
const { encodePng } = require('../scripts/png');
// A sheet of 8 x rows frames of 48; paint(frame, x, y) -> [r, g, b, a] or null.
const sheet = (rows, paint) => { const w = 384, h = rows * 48, d = new Uint8Array(w * h * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = paint(Math.floor(y / 48) * 8 + Math.floor(x / 48), x % 48, y % 48); if (c) d.set(c, (y * w + x) * 4); }
    return encodePng(w, h, d, b => zlib.deflateSync(b)); };
const ROWS = { Main: 20, Battle: 20, 'Daily Life': 17 };
// Body: a marker (10, 20) coloured by frame number, a skin-grey pixel (11, 30), outline (12, 30).
const body = sheet(20, f => (x, y) => null);
for (const set of Object.keys(ROWS)) {
    write(`${set}/Body/body_001.png`, sheet(ROWS[set], (f, x, y) => (x === 10 && y === 20 ? [f & 255, 7, 9, 255] : x === 11 && y === 30 ? [0xaa, 0xaa, 0xaa, 255] : x === 12 && y === 30 ? [0, 0, 0, 255] : x === 20 && y === 20 ? [1, 1, 1, 255] : null)));
    write(`${set}/Head/head_001.png`, sheet(ROWS[set], (f, x, y) => (x === 13 && y === 8 ? [0x54, 0x54, 0x54, 255] : null)));
    for (const n of [1, 2, 3]) write(`${set}/Arms/arms_00${n}.png`, sheet(ROWS[set], (f, x, y) => (x === 30 && y === 30 ? [n, n, n, 255] : null)));
    write(`${set}/Eyes/eyes_001.png`, sheet(ROWS[set], (f, x, y) => (x === 14 && y === 9 ? [0x80, 0x80, 0x80, 255] : x === 15 && y === 9 ? [255, 255, 255, 255] : null)));
    write(`${set}/HairA/haira_000.png`, sheet(ROWS[set], () => null));
    write(`${set}/HairA/haira_001.png`, sheet(ROWS[set], (f, x, y) => (x === 16 && y === 4 ? [0x80, 0x80, 0x80, 255] : x === 17 && y === 4 ? [255, 255, 255, 120] : null)));
    write(`${set}/HairA/haira_002.png`, sheet(ROWS[set], () => null));
    write(`${set}/HairB/hairb_000.png`, sheet(ROWS[set], () => null));
    write(`${set}/HairB/hairb_001.png`, sheet(ROWS[set], () => null));
    write(`${set}/HairD/haird_001.png`, sheet(ROWS[set], (f, x, y) => (x === 18 && y === 4 ? [0x40, 0x40, 0x40, 255] : null)));
    // The shirt covers the body's marker spot at (20, 20): over it facing down, under it facing up.
    write(`${set}/TopA/topa_000.png`, sheet(ROWS[set], () => null));
    write(`${set}/TopA/topa_001.png`, sheet(ROWS[set], (f, x, y) => (x === 20 && y === 20 ? [0xff, 0xff, 0xff, 255] : null)));
    for (const [n, arm] of [[1, 9], [2, 10], [3, 11]]) write(`${set}/TopB/topb_00${n}.png`, sheet(ROWS[set], (f, x, y) => (x === 21 && y === 21 ? [arm, arm, arm, 255] : null)));
    write(`${set}/BottomA/bottoma_001.png`, sheet(ROWS[set], () => null));
    write(`${set}/Shoes/shoes_001.png`, sheet(ROWS[set], () => null));
    write(`${set}/Eyebrows/eyebrows_001.png`, sheet(ROWS[set], () => null));
}
write('Battle/Sword/sword_000.png', sheet(20, () => null));
write('Battle/Sword/sword_001.png', sheet(20, (f, x, y) => (f < 16 && x === 40 && y === 10 ? [200, 100, 50, 255] : null)));
write('Daily Life/Eat/eat_000.png', sheet(17, () => null));
write('Daily Life/Eat/eat_001.png', sheet(17, (f, x, y) => (f < 12 && x === 41 && y === 11 ? [10, 200, 10, 255] : null)));
write('Daily Life/Body/body_001.png.import', 'godot');
write('README.md', ['# Memao', '**Arms** - Arm sizes', '- 001 (001: Dainty)', '- 002 (002: Average)', '- 003 (003: Broad)',
    '**Hair A** - Bangs', '- 000 (000: Bald)', '- 001 (002: Right Part)', '- 002 (001: Buzz)', '**Hair B** - long', '- 001 (001: Bob)',
    '**Top A** - Shirt', '- 001 (001: Crew)', '**Top B** - Sleeves', '- 001 (001: Short Dainty Arm)', '- 002 (001: Short Average Arm)', '- 003 (001: Short Broad Arm)',
    '**Bottom A** - Bottom', '- 001 (001: Pants)', '**Shoes** - shoes', '- 001 (001:  Closed) <- note', '**Sword** - Slash', '- 001 (001: Sword)'].join('\n'));
write('z_index_player_library.json', JSON.stringify({ Body: { front: 11, right: 10, back: 11, left: 10 }, TopA: { front: 15, right: 14, back: 5, left: 14 }, Head: { front: 4, right: 2, back: 6, left: 2 },
    HairB: { front: 8, right: 6, back: 27, left: 6 }, HairD: { front: 31, right: 31, back: 29, left: 31 }, Tool: { front: 31, right: 31, back: 31, left: 31 } }));
write('License.txt', 'licence');
fs.mkdirSync(path.join(project, 'data'), { recursive: true });
process.on('exit', () => { process.chdir(__dirname); fs.rmSync(fixture, { recursive: true, force: true }); });
process.chdir(project);

require('../Docs-Doodads.js');
const D = DocsDoodads, M = D.Memao, C = D.MemaoCompose, S = D.MemaoSlots, E = D.MemaoExport, ws = D.Workspace;
const toasts = [];
ws.showToast = (text, kind) => toasts.push([kind, text]);
ws.mounted = true;
D.Ui.sound = () => {};
const px = (img, x, y) => Array.from(img.data.slice((y * img.width + x) * 4, (y * img.width + x) * 4 + 4));
const hex = h => D.LpcCompose.hex(h).concat(255);

(async () => {
    // 1. Names from the README; sleeves split by arm.
    const names = M.readNames('**Hair A** - Bangs\n- 007 (015: Emo Left)\n- 011 (011:  Mouse Ears)\n**Eyebrows** - x\n- 007 (007: Bandana) <- to be under Hair A');
    assert.deepStrictEqual(names.HairA, { label: 'Hair A', about: 'Bangs', items: { 7: { order: 15, name: 'Emo Left' }, 11: { order: 11, name: 'Mouse Ears' } } });
    assert.deepStrictEqual(names.Eyebrows.items[7], { order: 7, name: 'Bandana' }, 'notes after the bracket are left off');
    assert.deepStrictEqual(M.splitArm('Off Shoulder S. Poof Broad Arm'), { style: 'Off Shoulder S. Poof', arm: 'broad' });
    assert.strictEqual(M.splitArm('Crew'), null);
    assert.deepStrictEqual(M.zFor({ Body: { front: 11, back: 9, left: 10, right: 10 } }, 'Body'), { down: 11, up: 9, left: 10, right: 10 });
    assert.deepStrictEqual(M.zFor({ Tool: { front: 31, back: 30, left: 31, right: 31 } }, 'Sword'), { down: 31, up: 30, left: 31, right: 31 }, 'folders it does not name use Tool');
    console.log('✓ names, sleeves, draw order');

    // 2. The scan.
    const index = M.scan(fs, path, pack, '2026-10-19T00:00:00.000Z');
    assert.ok(M.validIndex(index));
    assert.deepStrictEqual(index.sets.Main, { width: 384, height: 960, columns: 8, frames: 160 });
    assert.deepStrictEqual(index.sets['Daily Life'].height, 816);
    assert.deepStrictEqual(index.parts.filter(p => p.folder === 'HairA').map(p => [p.id, p.name, p.order]), [['HairA/001', 'Right Part', 2], ['HairA/002', 'Buzz', 1]], '000 is None, not a part');
    assert.strictEqual(index.folders.HairA.none, true);
    assert.strictEqual(index.folders.Body.none, false);
    assert.deepStrictEqual(index.parts.find(p => p.folder === 'TopB'), { id: 'TopB/Short', folder: 'TopB', name: 'Short', order: 1, files: { dainty: 1, average: 2, broad: 3 }, sets: ['Main', 'Battle', 'Daily Life'] }, 'one sleeve style, a file per arm');
    assert.ok(!index.parts.some(p => p.folder === 'HairD'), 'a paired folder is not a part of its own');
    assert.strictEqual(index.folders.HairD.leader, 'HairB');
    assert.deepStrictEqual(index.parts.find(p => p.folder === 'Sword').sets, ['Battle']);
    assert.strictEqual(index.parts.find(p => p.folder === 'Shoes').name, 'Closed');
    assert.deepStrictEqual([index.folders.Body.channel, index.folders.HairA.channel, index.folders.Eyes.channel, index.folders.TopA.channel, index.folders.Sword.channel], ['skin', 'hair', 'eyes', 'cloth', '']);
    assert.strictEqual(M.scan(fs, path, project), null, 'not a pack');
    console.log('✓ scan: sets, parts, None, sleeves, pairs, channels');

    // 3. Compose: frames per facing at the animation's place, rows up, left, down, right.
    const exists = f => fs.existsSync(path.join(pack, f));
    const load = f => D.LpcCompose.decodePng(fs.readFileSync(path.join(pack, f)), zlib.inflateSync);
    const draw = (picks, anim, body = 'average') => C.compose(C.resolve(index, { body, picks }, anim, exists), load, null);
    let out = draw([{ id: 'Body/001', colour: 'light' }], 'walk');
    assert.deepStrictEqual([out.sheet.width, out.sheet.height, out.sheet.frame], [6 * 48, 4 * 48, 48]);
    const marker = (img, col, row) => px(img, col * 48 + 10, row * 48 + 20)[0];
    // walk starts at 16; facings down, up, left, right of 6 frames each.
    assert.deepStrictEqual([marker(out.sheet, 0, 2), marker(out.sheet, 5, 2), marker(out.sheet, 0, 0), marker(out.sheet, 2, 1), marker(out.sheet, 2, 3)], [16, 21, 22, 30, 36], 'down 16, up 22, left 28+, right 34+');
    out = draw([{ id: 'Body/001', colour: 'light' }], 'slash');
    assert.deepStrictEqual(marker(out.sheet, 3, 3), 15, 'Battle: slash 0-15, facing right last');
    out = draw([{ id: 'Body/001', colour: 'light' }], 'paint');
    assert.deepStrictEqual([marker(out.sheet, 1, 1), marker(out.sheet, 1, 3)], [125, 129], 'paint: left 124+, right 128+');
    // Colours: only opaque template greys change.
    out = draw([{ id: 'Body/001', colour: 'tan' }, { id: 'Head/001', colour: 'tan' }, { id: 'Eyes/001', colour: 'blue' }, { id: 'HairA/001', colour: 'ginger' }], 'idle');
    const at = (x, y) => px(out.sheet, 2 * 48 + x, 2 * 48 + y);
    assert.deepStrictEqual(at(11, 30), hex(C.palettes.skin.tan[1]), 'skin #aaaaaa -> the middle of the skin ramp');
    assert.deepStrictEqual(at(12, 30), [0, 0, 0, 255], 'outlines stay');
    assert.deepStrictEqual(at(13, 8), hex(C.palettes.skin.tan[0]), 'skin #545454 -> dark');
    assert.deepStrictEqual(at(14, 9), hex(C.palettes.eyes.blue[1]), 'eyes #808080 -> the eye colour');
    assert.deepStrictEqual(at(15, 9), [255, 255, 255, 255], 'the whites of the eyes stay white');
    assert.deepStrictEqual(at(16, 4), hex(C.palettes.hair.ginger[1]), 'hair #808080 -> middle');
    assert.deepStrictEqual(at(17, 4), [255, 255, 255, 120], 'translucent pixels stay');
    // Depth per facing: the shirt is over the body facing down (15 > 11), under it facing up (5 < 11).
    out = draw([{ id: 'Body/001', colour: 'light' }, { id: 'TopA/001', colour: 'red' }], 'idle');
    assert.deepStrictEqual([px(out.sheet, 2 * 48 + 20, 2 * 48 + 20), px(out.sheet, 20, 20)], [hex(C.palettes.cloth.red[2]), [1, 1, 1, 255]]);
    // Pairs, sleeves by arm, props, missing sets.
    out = draw([{ id: 'HairB/001', colour: 'black' }], 'idle');
    assert.deepStrictEqual(px(out.sheet, 2 * 48 + 18, 2 * 48 + 4), hex(C.palettes.hair.black[0]), 'Hair D comes with Hair B, in its colour');
    assert.deepStrictEqual([px(draw([{ id: 'TopB/Short' }], 'idle', 'broad').sheet, 2 * 48 + 21, 2 * 48 + 21)[0], px(draw([{ id: 'TopB/Short' }], 'idle', 'dainty').sheet, 2 * 48 + 21, 2 * 48 + 21)[0]], [11, 9], 'the sleeve for the arms');
    out = draw([{ id: 'Body/001', colour: 'light' }], 'eat');
    assert.deepStrictEqual(px(out.sheet, 0 * 48 + 41, 2 * 48 + 11), [10, 200, 10, 255], 'props show in their own animation');
    out = draw([{ id: 'Body/001', colour: 'light' }, { id: 'Sword/001' }], 'idle');
    assert.ok(!out.warnings.length, 'a sword has nothing in Main and is quietly left out');
    assert.deepStrictEqual(px(draw([{ id: 'Body/001' }, { id: 'Sword/001' }], 'slash').sheet, 40, 10), [200, 100, 50, 255], 'and drawn in slash');
    const noBattle = Object.assign({}, index, { sets: { Main: index.sets.Main } });
    assert.ok(/no Battle set/.test(C.resolve(noBattle, { body: 'average', picks: [{ id: 'Body/001' }] }, 'slash', exists).warnings[0]));
    assert.ok(/no part "Gone\/001"/.test(C.resolve(index, { body: 'average', picks: [{ id: 'Gone/001' }] }, 'idle', exists).warnings[0]));
    assert.deepStrictEqual(C.frameRect('walk', 'left', 7), { x: 48, y: 48, w: 48, h: 48 });
    console.log('✓ compose: frames per facing, colours, depth per facing, pairs, sleeves, props, missing sets');

    // 4. Slots: a first character, ◀ ▶ (None first), arms, colours that follow, the dice, saving.
    let st = S.newState(index);
    assert.strictEqual(st.body, 'average');
    assert.deepStrictEqual(Object.keys(st.slots).sort(), ['body', 'bottom', 'eyebrows', 'eyes', 'hair', 'head', 'shirt', 'shoes', 'sleeves']);
    assert.strictEqual(st.slots.hair.id, 'HairA/001', 'Right Part, by name');
    assert.deepStrictEqual(S.options(index, S.slot('hair'), 'average').map(p => p.name), ['Buzz', 'Right Part'], "the tool's order");
    S.step(st, index, 'hair', 1);
    assert.strictEqual(st.slots.hair, undefined, 'after the last comes None (bald)');
    S.step(st, index, 'hair', 1);
    assert.strictEqual(st.slots.hair.id, 'HairA/002');
    S.step(st, index, 'body', 1);
    assert.strictEqual(st.slots.body.id, 'Body/001', 'required: no None');
    assert.deepStrictEqual(S.colours(index, index.parts.find(p => p.id === 'Head/001')), [], 'the head takes the skin');
    assert.deepStrictEqual(S.colours(index, index.parts.find(p => p.id === 'TopB/Short')), [], "sleeves take the shirt's colour");
    assert.ok(S.colours(index, index.parts.find(p => p.id === 'TopA/001')).includes('navy'));
    st.slots.shirt.colour = 'navy';
    st.slots.body.colour = 'deep';
    const recipe = S.toRecipe(st);
    assert.deepStrictEqual(recipe.picks.slice(0, 3), [{ id: 'Arms/002', colour: 'deep' }, { id: 'Body/001', colour: 'deep' }, { id: 'Head/001', colour: 'deep' }], 'the arms for the body, in the skin');
    assert.deepStrictEqual(recipe.picks.find(p => p.id === 'TopB/Short'), { id: 'TopB/Short', colour: 'navy' });
    assert.ok(!S.toRecipe(st, { showBody: false }).picks.some(p => p.id === 'Body/001' || p.id === 'Arms/002'), 'Show body off: the outfit only');
    st = S.setBody(st, index, 'broad');
    assert.strictEqual(st.slots.sleeves.id, 'TopB/Short', 'the sleeves stay; their file follows the arms');
    assert.strictEqual(S.armsPart(st, index), 'Arms/003');
    let seed = 5;
    const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    for (let i = 0; i < 20; i++) {
        const r = S.shuffle(S.shuffle(st, index, 'body', rand), index, 'outfit', rand);
        assert.ok(r.slots.body && r.slots.head && r.slots.eyes && r.slots.bottom, 'required slots always');
        assert.ok(!r.slots.sleeves || r.slots.shirt, 'no sleeves without a shirt');
        assert.ok(S.bodies.some(b => b[0] === r.body));
    }
    assert.deepStrictEqual(S.missing({ body: 'average', slots: { hair: { id: 'HairA/099' } } }, index), ['hair']);
    const saved = S.save(null, 'Mia', st, 'now');
    assert.deepStrictEqual([saved.format, saved.characters[0].name], ['docs-doodads-memao-characters', 'Mia']);
    assert.deepStrictEqual(S.load(saved, 'mia'), { body: st.body, slots: st.slots });
    assert.notStrictEqual(S.charactersFile, D.LpcSlots.charactersFile, 'a file of its own');
    console.log('✓ slots: first character, steps, None, arms, following colours, dice, saving');

    // 5. Exports: MZ rows down, left, right, up; 48-pixel frames.
    const full = [{ id: 'Body/001', colour: 'light' }];
    const walk = draw(full, 'walk').sheet, idle = draw(full, 'idle').sheet;
    const classic = E.classic(walk, idle);
    assert.deepStrictEqual([classic.width, classic.height], [144, 192]);
    assert.deepStrictEqual([marker(classic, 0, 0), marker(classic, 1, 0), marker(classic, 2, 0), marker(classic, 1, 1), marker(classic, 1, 2), marker(classic, 1, 3)], [17, 0, 20, 8, 12, 4],
        'stride, idle stand, stride; the stand facing left, right, up');
    const smooth = E.smooth(walk, idle);
    assert.deepStrictEqual([smooth.width, marker(smooth, 0, 0), marker(smooth, 1, 0), marker(smooth, 6, 3)], [7 * 48, 0, 16, 27], 'frame 0 stands, then the walk');
    assert.deepStrictEqual(E.names(' Mia [1] '), { classic: '$Mia 1', smooth: '$Mia 1[f7][w2]', idle: '$Mia 1_idle[f4]', run: '$Mia 1_run[f6]', face: 'Mia 1' });
    assert.strictEqual(E.actionName('Mia', 'wave'), '$Mia_wave[f4]');
    assert.strictEqual(E.actionLabel('pickup'), 'pick up');
    const paint = E.actionSheet(draw(full, 'paint').sheet, 'paint');
    assert.deepStrictEqual([marker(paint, 0, 0), marker(paint, 0, 1), marker(paint, 0, 2), marker(paint, 0, 3)], [124, 124, 128, 128], 'paint: down shows left, up shows right');
    assert.deepStrictEqual([marker(E.allFrames(idle), 0, 3), marker(E.allFrames(idle), 0, 0)], [4, 0], 'other sheets keep their own up and down rows');
    const sheets = {};
    for (const a of E.svAnimations()) sheets[a] = draw(full, a).sheet;
    const sv = E.svSheet(sheets);
    assert.deepStrictEqual([sv.sheet.width, sv.sheet.height, sv.fellBack], [432, 288, []]);
    assert.deepStrictEqual(marker(sv.sheet, 0, 0), 29, 'walk facing left, walk frame 1');
    assert.deepStrictEqual(marker(sv.sheet, 3 + 1, 1), 10, 'swing: slash facing left (8+), frames spread 0, 2, 3');
    assert.deepStrictEqual(marker(sv.sheet, 6 + 0, 0), 59, 'escape: running right (58+), frames spread 1, 3, 5');
    delete sheets.think;
    assert.deepStrictEqual(E.svSheet(sheets).fellBack, ['chant']);
    const face = E.face(idle);
    assert.deepStrictEqual([face.width, face.height, px(face, 72, 2)[3] > 0], [144, 144, true], 'a face on its card');
    console.log('✓ exports: classic, smooth, names, actions, paint rows, battler, face');

    // 6. In the editor: scan, export, the creator window for Memao.
    assert.strictEqual(ws.scanMemaoLibrary(''), null);
    assert.ok(/Choose the Memao asset folder/.test(toasts.pop()[1]));
    ws.setMemaoLibraryFolder(project);
    assert.strictEqual(ws.scanMemaoLibrary(), null);
    assert.ok(/no Main folder/.test(toasts.pop()[1]));
    ws.setMemaoLibraryFolder(pack);
    assert.ok(ws.scanMemaoLibrary());
    assert.ok(/Found \d+ Memao parts in 3 sets/.test(toasts.pop()[1]));
    assert.ok(fs.existsSync(path.join(project, M.indexFile)), 'the index is cached');
    ws._memaoIndex = undefined;
    assert.ok(ws.memaoIndex(), 'and read back');
    const mia = S.newState(ws.memaoIndex());
    const result = ws.exportMemaoCharacter(mia, Object.assign({ name: 'Mia' }, ws.memaoExportDefaults()));
    assert.deepStrictEqual(result.files.slice().sort(), ws.memaoExportFiles('Mia', ws.memaoExportDefaults()).slice().sort(), 'the files it said it would write');
    for (const f of ['img/characters/$Mia.png', 'img/characters/$Mia[f7][w2].png', 'img/characters/$Mia_idle[f4].png', 'img/characters/$Mia_run[f6].png', 'img/characters/$Mia_slash[f4].png', 'img/sv_actors/Mia.png', 'img/faces/Mia.png']) assert.ok(fs.existsSync(path.join(project, f)), f);
    const written = D.LpcCompose.decodePng(fs.readFileSync(path.join(project, 'img/characters/$Mia[f7][w2].png')), zlib.inflateSync);
    assert.deepStrictEqual([written.width, written.height], [336, 192]);
    assert.deepStrictEqual(D.World.get('characterAnim.sets').find(s => s.character === '$Mia[f7][w2]'), { character: '$Mia[f7][w2]', idle: '$Mia_idle[f4]', run: '$Mia_run[f6]', idleDelay: 90, idleFps: 4, runFps: 14 });
    assert.ok(S.load(ws.readCreatorSaved(S), 'Mia'), 'kept to change later');
    assert.ok(!D.LpcSlots.load(ws.readCreatorSaved(D.LpcSlots), 'Mia'), 'not among the LPC characters');
    assert.ok(/Exported Mia: \d+ pictures\./.test(toasts.pop()[1]));
    // The window: the LPC creator's, with Memao's parts.
    assert.ok(ws.openCreator(null, 'memao'));
    const html = () => root.innerHTML;
    for (const text of ['Memao Creator', 'Memao assets · ', 'Body type', 'Skin', 'id="dd-cr-tab-outfit-3"', 'Tools', 'id="dd-cr-anim-paint"', 'Export to RPG Maker', 'class="dd-cr-card']) assert.ok(html().includes(text), text);
    assert.ok(!html().includes('id="dd-cr-safe"') && !html().includes('id="dd-cr-addons"'), "no LPC licence switch or add-ons");
    assert.strictEqual(stubs['dd-cr-canvas'].width, 5 * 48, 'the stage draws 48-pixel frames 5 times');
    document.getElementById('dd-cr-_body-next').onclick();
    assert.strictEqual(ws._creator.state.body, 'dainty');
    document.getElementById('dd-cr-tab-body-2').onclick();
    document.getElementById('dd-cr-hair-next').onclick();
    assert.ok(/<span>(Buzz|Right Part|None)<\/span>/.test(html()));
    document.getElementById('dd-cr-anim-slash').onclick();
    assert.strictEqual(ws._creator.anim, 'slash');
    ws._creator.name = 'Mia';
    document.getElementById('dd-cr-export').onclick();
    assert.ok(/Export Mia to RPG Maker/.test(html()) && html().includes('id="dd-cr-ex-act-wave"') && !html().includes('dd-cr-ex-parts'));
    assert.ok(html().includes('may go into your games, but not be shared on their own'));
    D.Ui.confirm = async () => true;
    const again = await ws.creatorExport();
    assert.ok(again && again.files.includes('img/characters/$Mia_slash[f4].png'));
    assert.ok(/Wrote \d+ files/.test(html()));
    ws.closeCreator();
    // The LPC creator is still the LPC creator.
    ws._creator = null;
    assert.strictEqual(ws.openCreator(), null, 'no LPC library scanned');
    assert.ok(/Scan the LPC library first/.test(toasts.pop()[1]));
    // The Characters card has the Memao part.
    ws.showLpcCard();
    assert.ok(card.innerHTML.includes('Memao Sprite Sheet Creator assets') && card.innerHTML.includes('id="dd-memao-creator"'));
    ws.setMemaoLibraryFolder(path.join(project, 'inside'));
    ws.refreshLpcCard();
    assert.ok(card.innerHTML.includes('id="dd-memao-inside"'), 'a folder inside the project is warned about');
    console.log('✓ editor: scan, export, the creator window for Memao, the Characters card');

    console.log('=== Memao creator passed ===');
})().catch(e => { console.error(e); process.exit(1); });
