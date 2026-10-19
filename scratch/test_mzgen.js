// scratch/test_mzgen.js
// The MZ creator: RPG Maker MZ's generator parts (names, the scan, the colour ramps), the compositor (each
// view's order, a family's layers behind and in front, masks and colour slots recoloured by brightness, face
// layers by c, 160-pixel face parts centred, the stage's sheets for walk, damage, face and battler motions),
// the slots (colour channels shared by parts, bases), the exports, and in the editor: the scan, the export and
// the creator window opened for MZ (colour tabs in the palette, the stage's scale per sheet). The parts are
// synthetic, made in memory at the real sizes.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

console.log('=== Testing MZ Creator ===');

const store = {};
global.window = global;
global.innerWidth = 1400;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
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

// ---- A synthetic generator folder ----
const fixture = path.join(__dirname, 'mzgen_fixture');
fs.rmSync(fixture, { recursive: true, force: true });
const project = path.join(fixture, 'project'), gen = path.join(fixture, 'generator');
const { encodePng } = require('../scripts/png');
const png = (w, h, paint) => { const d = new Uint8Array(w * h * 4); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = paint(x, y); if (c) d.set(c, (y * w + x) * 4); } return encodePng(w, h, d, b => zlib.deflateSync(b)); };
const write = (rel, data) => { const f = path.join(gen, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, data); };
// Ramps: 4-pixel bands, light (left) to dark (right).
const band = (x, base) => base.map(v => Math.round(v * (1 - x / 255)));
write('grad_common.png', png(256, 8, (x, y) => (y < 4 ? band(x, [255, 255, 255]) : band(x, [255, 40, 40])).concat(255)));
write('grad_skin.png', png(256, 4, x => band(x, [255, 200, 160]).concat(255)));
write('grad_hair.png', png(256, 8, (x, y) => (y < 4 ? band(x, [250, 220, 90]) : band(x, [120, 160, 255])).concat(255)));
write('grad_eyes.png', png(256, 4, x => band(x, [80, 200, 255]).concat(255)));
// Walking: markers coloured by cell (frame, row) at (10, 20); a skin pixel, an eye pixel and a fixed one.
const cell = (x, y) => [Math.floor(x / 48), Math.floor(y / 48)];
const SKIN = [200, 150, 120, 255], KEY_SKIN = [0xf9, 0xc1, 0x9d, 255], KEY_EYES = [0x2c, 0x80, 0xcb, 255], KEY_CLOTH1 = [0xae, 0x86, 0x82, 255], WHITE = [255, 255, 255, 255];
write('TV/Male/TV_Body_p01.png', png(144, 192, (x, y) => { const [f, r] = cell(x, y); const lx = x % 48, ly = y % 48; return lx === 10 && ly === 20 ? [f * 40, r * 50, 7, 255] : lx === 11 && ly === 30 ? SKIN : lx === 12 && ly === 30 ? [60, 90, 200, 255] : lx === 13 && ly === 30 ? [9, 9, 9, 255] : lx === 30 && ly === 30 ? [1, 1, 1, 255] : null; }));
write('TV/Male/TV_Body_p01_c.png', png(144, 192, (x, y) => { const lx = x % 48, ly = y % 48; return lx === 11 && ly === 30 ? KEY_SKIN : lx === 12 && ly === 30 ? KEY_EYES : (lx === 13 || lx === 10) && (ly === 30 || ly === 20) ? WHITE : null; }));
write('TV/Male/TV_Clothing2_p01.png', png(144, 192, (x, y) => (x % 48 === 20 && y % 48 === 20 ? [128, 64, 32, 255] : null)));
write('TV/Male/TV_Clothing2_p01_c.png', png(144, 192, (x, y) => (x % 48 === 20 && y % 48 === 20 ? KEY_CLOTH1 : null)));
// A rear hair's layer 2 behind the body, its layer 1 in front, both where the body has a pixel (30, 30).
write('TV/Male/TV_RearHair2_p01.png', png(144, 192, (x, y) => (x % 48 === 30 && y % 48 === 30 ? [222, 0, 0, 255] : null)));
write('TV/Male/TV_RearHair1_p01.png', png(144, 192, (x, y) => (x % 48 === 31 && y % 48 === 30 ? [0, 222, 0, 255] : null)));
write('TV/Male/TV_Wing1_p01.png', png(144, 192, () => null));
write('TV/Male/TV_Wing2_p01.png', png(144, 192, () => null));
write('TV/Male/TV_Body_p01.png.import', 'x');
write('TV/Female/TV_Body_p01.png', png(144, 192, (x, y) => (x % 48 === 10 && y % 48 === 20 ? [5, 5, 5, 255] : null)));
write('TV/Female/TV_Body_p02.png', png(144, 192, () => null));
write('TVD/Male/TVD_Body_p01.png', png(144, 48, x => (x % 48 === 10 ? [Math.floor(x / 48) * 40 + 1, 2, 3, 255] : null)));
write('TVD/Male/TV_Clothing_p01.png', png(144, 48, () => null));
// The battler: cell (column, row) marked at (10, 20) in its 64-pixel cells.
write('SV/Male/SV_body_p01.png', png(576, 384, (x, y) => (x % 64 === 10 && y % 64 === 20 ? [Math.floor(x / 64) * 20, Math.floor(y / 64) * 30, 9, 255] : null)));
write('SV/Male/SV_body_p01_c.png', png(576, 384, () => null));
// Face: skin (slot m001), eyes in slot m002 over its fixed whites (no slot), a 160-pixel clothing layer.
write('Face/Male/FG_Body_p01_c1_m001.png', png(144, 144, (x, y) => (x === 40 && y === 40 ? SKIN : null)));
write('Face/Male/FG_Eyes_p01_c1_m002.png', png(144, 144, (x, y) => (x === 50 && y === 50 ? [60, 90, 200, 255] : null)));
write('Face/Male/FG_Eyes_p01_c2.png', png(144, 144, (x, y) => (x === 50 && y === 50 ? WHITE : x === 51 && y === 50 ? WHITE : null)));
write('Face/Male/FG_Clothing2_p01_c3_m007.png', png(160, 160, (x, y) => (x === 88 && y === 88 ? [128, 64, 32, 255] : null)));
write('Face/Male/FG_FrontHair_p17_c1].png', png(4, 4, () => null));
fs.mkdirSync(path.join(project, 'data'), { recursive: true });
process.on('exit', () => { process.chdir(__dirname); fs.rmSync(fixture, { recursive: true, force: true }); });
process.chdir(project);

require('../Docs-Doodads.js');
const D = DocsDoodads, M = D.MzGen, C = D.MzGenCompose, S = D.MzGenSlots, E = D.MzGenExport, ws = D.Workspace;
const toasts = [];
ws.showToast = (text, kind) => toasts.push([kind, text]);
ws.mounted = true;
D.Ui.sound = () => {};
const px = (img, x, y) => Array.from(img.data.slice((y * img.width + x) * 4, (y * img.width + x) * 4 + 4));

(async () => {
    // 1. Names.
    assert.deepStrictEqual(M.parseName('TV', 'TV_Clothing2_p03.png'), { family: 'Clothing', layer: 2, num: 3 });
    assert.deepStrictEqual(M.parseName('SV', 'SV_body_p01.png'), { family: 'Body', layer: 0, num: 1 });
    assert.strictEqual(M.parseName('TV', 'TV_Clothing2_p03_c.png'), null, 'masks are not parts');
    assert.deepStrictEqual(M.parseName('Face', 'FG_Clothing2_p03_c4_m007.png'), { family: 'Clothing', layer: 2, num: 3, c: 4, m: 'm007' });
    assert.deepStrictEqual(M.parseName('Face', 'FG_Eyes_p01_c2.png'), { family: 'Eyes', layer: 0, num: 1, c: 2, m: '' }, 'no slot: fixed colours');
    assert.strictEqual(M.parseName('Face', 'FG_FrontHair_p17_c1].png'), null);
    assert.deepStrictEqual([M.slotOfKey(0xae8682), M.slotOfKey(0xf9c19d), M.slotOfKey(0xffffff)], ['m007', 'm001', '']);
    // A few of MZ's parts are interlaced PNGs (Adam7): the reader handles them.
    const adam7 = (w, h, rgba) => {
        const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
        const crc = buf => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
        const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
        const rows = [];
        for (const [x0, y0, dx, dy] of [[0, 0, 8, 8], [4, 0, 8, 8], [0, 4, 4, 8], [2, 0, 4, 4], [0, 2, 2, 4], [1, 0, 2, 2], [0, 1, 1, 2]]) {
            for (let y = y0; y < h; y += dy) { const line = [0]; for (let x = x0; x < w; x += dx) line.push(...rgba(x, y)); if (line.length > 1) rows.push(...line); }
        }
        const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6; ihdr[12] = 1;
        return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(Buffer.from(rows))), chunk('IEND', Buffer.alloc(0))]);
    };
    const colourAt = (x, y) => [x * 20 % 256, y * 30 % 256, (x + y) * 7 % 256, 255];
    const il = D.LpcCompose.decodePng(adam7(11, 9, colourAt), zlib.inflateSync);
    let same = il && il.width === 11 && il.height === 9;
    for (let y = 0; y < 9 && same; y++) for (let x = 0; x < 11; x++) if (px(il, x, y).join() !== colourAt(x, y).join()) { same = false; break; }
    assert.ok(same, 'an interlaced PNG reads pixel for pixel');
    console.log('✓ names and mask keys; interlaced PNGs');

    // 2. The scan.
    const index = M.scan(fs, path, gen, zlib.inflateSync, 'now');
    assert.ok(M.validIndex(index));
    assert.deepStrictEqual(index.bases, ['Male', 'Female']);
    assert.deepStrictEqual([index.ramps.common.length, index.ramps.hair.length, index.ramps.skin.length], [2, 2, 1]);
    const body = index.parts.find(p => p.id === 'Male/Body/01');
    assert.deepStrictEqual([body.files.TV.length, body.files.TV[0].mask, body.files.SV.length, body.files.TVD.length, body.files.Face.length], [1, 'TV/Male/TV_Body_p01_c.png', 1, 1, 1]);
    assert.deepStrictEqual(index.parts.find(p => p.id === 'Male/RearHair/01').files.TV.map(f => f.layer).sort(), [1, 2], 'layers 1 and 2 are one part');
    assert.deepStrictEqual(index.parts.find(p => p.id === 'Male/Eyes/01').slots, ['m002']);
    assert.deepStrictEqual(index.parts.find(p => p.id === 'Male/Wing/01').slots, ['wing'], 'walking-only families have their slot');
    assert.strictEqual(index.parts.find(p => p.id === 'Male/FrontHair/01'), undefined);
    assert.strictEqual(body.name, 'Body 1');
    assert.deepStrictEqual(M.colourNames(index, 'm007'), ['', 'common:0', 'common:1']);
    assert.deepStrictEqual(M.ramp(index, 'common:1')[0], [255, 40, 40]);
    assert.strictEqual(M.scan(fs, path, project, zlib.inflateSync), null);
    console.log('✓ scan: bases, ramps, parts with their views, layers and slots');

    // 3. Compose.
    const exists = f => fs.existsSync(path.join(gen, f));
    const load = f => D.LpcCompose.decodePng(fs.readFileSync(path.join(gen, f)), zlib.inflateSync);
    const draw = (picks, anim, colours = {}) => C.compose(C.resolve(index, { body: 'Male', picks: picks.map(id => ({ id })), colours }, anim, exists), index, load, null);
    let out = draw(['Male/Body/01', 'Male/RearHair/01'], 'walk');
    assert.deepStrictEqual([out.view.width, out.view.height, out.sheet.width, out.sheet.height, out.sheet.frame], [144, 192, 144, 192, 48]);
    // Sheet rows are up, left, down, right; MZ's are down, left, right, up.
    const mark = (s, f, r) => px(s, f * 48 + 10, r * 48 + 20).slice(0, 2);
    assert.deepStrictEqual([mark(out.sheet, 2, 0), mark(out.sheet, 1, 1), mark(out.sheet, 0, 2), mark(out.sheet, 2, 3)], [[80, 150], [40, 50], [0, 0], [80, 100]]);
    assert.deepStrictEqual([px(out.view, 30, 30), px(out.view, 31, 30)], [[1, 1, 1, 255], [0, 222, 0, 255]], 'rear hair 2 behind the body, 1 in front');
    // Colours: as drawn by default; a ramp recolours its slot's pixels by brightness; fixed pixels stay.
    out = draw(['Male/Body/01', 'Male/Clothing/01'], 'walk');
    assert.deepStrictEqual([px(out.view, 11, 30), px(out.view, 20, 20)], [[200, 150, 120, 255], [128, 64, 32, 255]], 'as drawn');
    out = draw(['Male/Body/01', 'Male/Clothing/01'], 'walk', { m007: 'common:1', m001: 'skin:0' });
    const lumOf = c => Math.round(0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]);
    const cloth = px(out.view, 20, 20), skin = px(out.view, 11, 30);
    assert.ok(cloth[0] > cloth[1] && cloth[1] === cloth[2], 'clothing 1 takes the red ramp');
    assert.ok(Math.abs(lumOf(cloth) - lumOf([128, 64, 32])) <= 3, 'at the same brightness');
    assert.ok(Math.abs(lumOf(skin) - lumOf(SKIN)) <= 3 && skin[0] > skin[2], 'skin takes the skin ramp at its brightness');
    assert.deepStrictEqual([px(out.view, 12, 30), px(out.view, 13, 30)], [[60, 90, 200, 255], [9, 9, 9, 255]], 'the eyes slot is as drawn; white in the mask is fixed');
    // Face: c1 over c2, 160-pixel parts centred, slots by file.
    out = draw(['Male/Body/01', 'Male/Eyes/01', 'Male/Clothing/01'], 'face', { m002: 'eyes:0' });
    assert.deepStrictEqual([out.view.width, out.sheet.frame], [144, 144]);
    const eye = px(out.view, 50, 50);
    assert.ok(eye[2] > eye[0] && Math.abs(lumOf(eye) - lumOf([60, 90, 200])) <= 3, 'the iris (c1, eyes slot) over the whites, recoloured');
    assert.deepStrictEqual(px(out.view, 51, 50), [255, 255, 255, 255], 'the whites (no slot) stay white');
    assert.deepStrictEqual(px(out.view, 80, 80), [128, 64, 32, 255], 'a 160-pixel layer centred on the 144 face');
    // Damage and battler motions.
    out = draw(['Male/Body/01'], 'damage');
    assert.deepStrictEqual([out.view.width, out.view.height, px(out.sheet, 2 * 48 + 10, 0)[0], px(out.sheet, 2 * 48 + 10, 3 * 48)[0]], [144, 48, 81, 81], 'the TVD row in every row');
    out = draw(['Male/Body/01'], 'sv_swing');
    assert.deepStrictEqual([out.view.width, out.view.height, out.sheet.frame], [576, 384, 64]);
    assert.deepStrictEqual(px(out.sheet, 64 + 10, 20).slice(0, 2), [4 * 20, 1 * 30], 'swing (motion 7): column group 1, row 1, frame 1');
    assert.deepStrictEqual(px(out.sheet, 64 + 10, 2 * 64 + 20).slice(0, 2), [80, 30], 'the same in every row');
    assert.ok(/no part "Gone/.test(C.resolve(index, { body: 'Male', picks: [{ id: 'Gone/x/01' }] }, 'walk', exists).warnings[0]));
    assert.ok(/no nope animation/.test(C.resolve(index, { body: 'Male', picks: [] }, 'nope', exists).warnings[0]));
    console.log('✓ compose: views, order, layers 1 and 2, colour slots by brightness, face layers, damage, battler motions');

    // 4. Slots.
    let st = S.newState(index, 'Male');
    assert.deepStrictEqual(Object.keys(st.slots).sort(), ['body', 'clothing', 'eyes', 'rearhair']);
    assert.deepStrictEqual(S.channels(index, S.partOf(st, index, 'clothing')), [{ slot: 'm007', label: 'Clothing 1' }]);
    assert.deepStrictEqual(S.colours(index, S.partOf(st, index, 'clothing'), 0), ['', 'common:0', 'common:1']);
    S.setColour(st, index, 'clothing', 0, 'common:1');
    assert.deepStrictEqual([st.colours, S.getColour(st, index, 'clothing', 0)], [{ m007: 'common:1' }, 'common:1']);
    S.stepColour(st, index, 'clothing', 1, 0);
    assert.strictEqual(S.getColour(st, index, 'clothing', 0), '', 'after the last ramp: as drawn');
    S.setColour(st, index, 'eyes', 0, 'eyes:0');
    assert.ok(/^linear-gradient/.test(S.swatch(index, null, '')) && /^#[0-9a-f]{6}$/.test(S.swatch(index, null, 'eyes:0')));
    assert.deepStrictEqual(S.toRecipe(st), { body: 'Male', picks: [{ id: 'Male/Body/01' }, { id: 'Male/Eyes/01' }, { id: 'Male/RearHair/01' }, { id: 'Male/Clothing/01' }], colours: { m002: 'eyes:0' } });
    assert.deepStrictEqual(S.toRecipe(st, { showBody: false }).picks, [{ id: 'Male/Clothing/01' }]);
    const fem = S.setBody(st, index, 'Female');
    assert.deepStrictEqual([fem.slots.body.id, fem.slots.clothing, fem.colours], ['Female/Body/01', undefined, { m002: 'eyes:0' }], 'the same numbers where the base has them; colours kept');
    S.step(st, index, 'clothing', 1);
    assert.strictEqual(st.slots.clothing, undefined, 'None after the last');
    let seed = 9;
    const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    for (let i = 0; i < 10; i++) { const r = S.shuffle(S.shuffle(st, index, 'body', rand), index, 'outfit', rand); assert.ok(r.slots.body && index.bases.includes(r.body)); }
    const saved = S.save(null, 'Rin', st, 'now');
    assert.deepStrictEqual(S.load(saved, 'rin'), { body: 'Male', colours: st.colours, slots: st.slots }, 'colours are saved too');
    assert.strictEqual(saved.format, 'docs-doodads-mz-characters');
    console.log('✓ slots: channels, shared colours, as drawn, bases, dice, saving with colours');

    // 5. In the editor: the folder, the scan, the export, the window.
    assert.strictEqual(ws.mzgenLibraryFolder(), '', 'Node is not MZ: nothing to find');
    ws.setMzGenLibraryFolder(project);
    assert.strictEqual(ws.scanMzGenLibrary(), null);
    assert.ok(/no TV folder/.test(toasts.pop()[1]));
    ws.setMzGenLibraryFolder(gen);
    assert.ok(ws.scanMzGenLibrary());
    assert.ok(/Found \d+ generator parts \(Male, Female\)/.test(toasts.pop()[1]));
    ws._mzgenIndex = undefined;
    assert.ok(ws.mzgenIndex(), 'read back from the cache');
    const rin = S.newState(ws.mzgenIndex(), 'Male');
    rin.colours = { m007: 'common:1' };
    const result = ws.exportMzGenCharacter(rin, Object.assign({ name: 'Rin' }, ws.mzgenExportDefaults()));
    assert.deepStrictEqual(result.files.slice().sort(), ['img/characters/$Rin.png', 'img/characters/$Rin_damage[f3][d1].png', 'img/faces/Rin.png', 'img/sv_actors/Rin.png']);
    assert.deepStrictEqual(result.files.slice().sort(), ws.mzgenExportFiles('Rin', ws.mzgenExportDefaults()).slice().sort());
    const size = f => { const b = fs.readFileSync(path.join(project, f)); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
    assert.deepStrictEqual([size('img/characters/$Rin.png'), size('img/characters/$Rin_damage[f3][d1].png'), size('img/sv_actors/Rin.png'), size('img/faces/Rin.png')], [[144, 192], [144, 48], [576, 384], [576, 288]]);
    assert.ok(S.load(ws.readCreatorSaved(S), 'Rin'), 'kept to change later');
    assert.ok(/Exported Rin: 4 pictures\./.test(toasts.pop()[1]));
    // The window.
    assert.ok(ws.openCreator(null, 'mz'));
    const html = () => root.innerHTML;
    for (const text of ['MZ Character Creator', 'MZ generator · ', 'Body type', 'id="dd-cr-anim-face"', 'id="dd-cr-anim-sv_swing"', 'Battle walk', 'Clothes', 'Export to RPG Maker']) assert.ok(html().includes(text), text);
    assert.strictEqual(stubs['dd-cr-canvas'].width, 5 * 48, 'walking frames 5 times');
    document.getElementById('dd-cr-anim-face').onclick();
    assert.strictEqual(stubs['dd-cr-canvas'].width, 2 * 144, 'the face twice');
    document.getElementById('dd-cr-anim-sv_wait').onclick();
    assert.strictEqual(stubs['dd-cr-canvas'].width, 4 * 64, 'battler cells 4 times');
    // Colour tabs: the clothing's slots in the palette.
    document.getElementById('dd-cr-switch-body-outfit') && document.getElementById('dd-cr-switch-body-outfit').onclick();
    document.getElementById('dd-cr-tab-outfit-0').onclick();
    ws.creatorOpenPalette('clothing', null);
    assert.ok(html().includes('Clothing 1 colour') && html().includes('id="dd-cr-pal-2"') && html().includes('As drawn'));
    document.getElementById('dd-cr-pal-2').onclick();
    assert.deepStrictEqual(ws._creator.state.colours, { m007: 'common:1' });
    ws._creator.name = 'Rin';
    document.getElementById('dd-cr-export').onclick();
    assert.ok(html().includes('id="dd-cr-ex-damage"') && html().includes('Damaged character') && !html().includes('dd-cr-ex-smooth') && !html().includes('>Actions<'));
    D.Ui.confirm = async () => true;
    const again = await ws.creatorExport();
    assert.ok(again && again.files.length === 4);
    ws.closeCreator();
    ws.showLpcCard();
    assert.ok(card.innerHTML.indexOf("RPG Maker MZ's generator parts") < card.innerHTML.indexOf('The LPC character library') && card.innerHTML.includes('id="dd-mzgen-creator"'), 'first on the Characters card');
    console.log('✓ editor: folder, scan, export, the creator window for MZ, the Characters card');

    console.log('=== MZ creator passed ===');
})().catch(e => { console.error(e); process.exit(1); });
