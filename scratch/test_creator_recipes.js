// scratch/test_creator_recipes.js
// Creators, Part A phase 5 (docs/CREATOR_IMPROVEMENTS_PLAN.md §2.4): Memao characters exported standing on the
// tile's bottom (6 pixels lower, a sheet that would lose pixels left as it was); Memao prop rows; MZ colour
// channels from the walking and battler masks; recipes written, read back, undone, refused from another creator.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

console.log('=== Testing Character Creator Standing, Props, Mask Channels and Recipes (Part A, phase 5) ===');

const store = {};
let root = null;
const stubs = {};
const live = [];
const ctx2d = { createImageData: (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }), putImageData() {}, drawImage() {}, clearRect() {}, imageSmoothingEnabled: true };
global.window = global;
global.innerWidth = 1400;
const listeners = {};
global.window.addEventListener = (type, fn) => { listeners[type] = fn; };
global.window.removeEventListener = (type, fn) => { if (listeners[type] === fn) delete listeners[type]; };
global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
const html = () => (root ? root.innerHTML : '');
const stub = id => (stubs[id] || (stubs[id] = { id, getContext: () => ctx2d, width: 256, height: 256, style: {}, focus() { global.document.activeElement = this; }, scrollIntoView() {} }));
const makeEl = tag => ({
    tagName: tag.toUpperCase(), style: {}, textContent: '', width: 0, height: 0, _html: '', setAttribute() {}, appendChild() {}, getContext: () => ctx2d,
    get innerHTML() { return this._html; },
    set innerHTML(v) { this._html = v; if (this.id === 'dd-creator') for (const k of Object.keys(stubs)) delete stubs[k]; },
    contains: el => Boolean(el && el.id && html().includes(`id="${el.id}"`)), querySelectorAll: () => []
});
global.document = {
    activeElement: null, createElement: makeEl,
    body: { appendChild(n) { if (n.id === 'dd-creator') root = n; if (n.id === 'dd-cr-live') live.push(n); n.parentNode = this; }, removeChild(n) { if (n === root) root = null; n.parentNode = null; } },
    getElementById: id => (id === 'dd-creator' ? root : html().includes(`id="${id}"`) ? stub(id) : null),
    querySelector: () => null, querySelectorAll: () => []
};
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: opt => opt === 'test' };
global.PluginManager = { parameters: () => ({}) };
global.$gameMap = { mapId: () => 1, tileWidth: () => 48, tileHeight: () => 48 };
global.$dataDocsDoodads = { 1: [] };

// ---- Fixtures: an LPC library (male and female bodies, two shirts, two hats, two hairs), an MZ folder ----
const fixture = path.join(__dirname, 'creator_recipes_fixture');
fs.rmSync(fixture, { recursive: true, force: true });
const project = path.join(fixture, 'project'), lib = path.join(fixture, 'lpc'), gen = path.join(fixture, 'generator');
const { encodePng } = require('../scripts/png');
const write = (base, rel, data) => { const f = path.join(base, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, typeof data === 'string' || Buffer.isBuffer(data) ? data : JSON.stringify(data)); };
const png = (w, h, paint) => { const d = new Uint8Array(w * h * 4); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = paint(x, y); if (c) d.set(c, (y * w + x) * 4); } return encodePng(w, h, d, b => zlib.deflateSync(b)); };
const cc0 = file => [{ file, licenses: ['CC0'], authors: ['Ann'] }];
const sheet = png(576, 256, (x, y) => (x % 64 === 30 && y % 64 === 40 ? [200, 200, 200, 255] : null));
const def = (rel, name, type, paths, material) => write(lib, 'sheet_definitions/' + rel + '.json', Object.assign({ name, type_name: type, layer_1: Object.assign({ zPos: 40 }, paths), credits: cc0(rel) }, material ? { recolors: { material } } : {}));
def('body/body', 'Body Color', 'body', { male: 'body/m/', female: 'body/f/' }, 'body');
write(lib, 'sheet_definitions/body/body.json', { name: 'Body Color', type_name: 'body', match_body_color: true, recolors: { material: 'body' }, layer_1: { zPos: 10, male: 'body/m/', female: 'body/f/' }, credits: cc0('body') });
write(lib, 'sheet_definitions/head/human_male.json', { name: 'Human Male', type_name: 'head', match_body_color: true, recolors: { color_1: { material: 'body' } }, layer_1: { zPos: 100, male: 'head/m/', female: 'head/m/' }, credits: cc0('head') });
for (const [rel, name, type] of [['torso/shirt', 'Shirt', 'clothes'], ['torso/tunic', 'Tunic', 'clothes'], ['hat/cap', 'Cap', 'hat'], ['hat/hood', 'Hood', 'hat'], ['hair/bob', 'Bob', 'hair'], ['hair/afro', 'Afro', 'hair']]) {
    def(rel, name, type, { male: rel + '/', female: rel + '/' }, 'cloth');
    write(lib, `spritesheets/${rel}/walk.png`, sheet);
}
write(lib, 'palette_definitions/body/meta_body.json', { default: 'ulpc', base: 'light' });
write(lib, 'palette_definitions/body/body_ulpc.json', { light: ['#271920'], olive: ['#442725'], brown: ['#5a3a2a'] });
write(lib, 'palette_definitions/cloth/meta_cloth.json', { default: 'ulpc', base: 'white' });
write(lib, 'palette_definitions/cloth/cloth_ulpc.json', { white: ['#fefefe'], blue: ['#0000fe'], red: ['#fe0000'], green: ['#00fe00'] });
for (const rel of ['body/m', 'body/f', 'head/m']) write(lib, `spritesheets/${rel}/walk.png`, sheet);
const band = (x, base) => base.map(v => Math.round(v * (1 - x / 255)));
for (const g of ['common', 'skin', 'hair', 'eyes']) write(gen, `grad_${g}.png`, png(256, 16, (x, y) => band(x, [200 - y * 8, 150, 100]).concat(255)));
for (const base of ['Male', 'Female']) {
    write(gen, `TV/${base}/TV_Body_p01.png`, png(144, 192, () => null));
    write(gen, `Face/${base}/FG_Body_p01_c1_m001.png`, png(144, 144, () => null));
    write(gen, `Face/${base}/FG_Face_p01_c1_m001.png`, png(144, 144, () => null));
    for (const n of ['01', '02', '03']) {
        write(gen, `TV/${base}/TV_Clothing2_p${n}.png`, png(144, 192, () => null));
        write(gen, `Face/${base}/FG_Clothing2_p${n}_c3_m007.png`, png(144, 144, () => null));
    }
}
fs.mkdirSync(path.join(project, 'data'), { recursive: true });
process.on('exit', () => { process.chdir(__dirname); fs.rmSync(fixture, { recursive: true, force: true }); });
process.chdir(project);

require('../Docs-Doodads.js');
const D = DocsDoodads, ws = D.Workspace;
ws.showToast = () => {};
ws.mounted = true;
D.Ui.sound = () => {};
const cr = () => ws._creator;
const click = id => { const el = document.getElementById(id); assert.ok(el && el.onclick, 'no button ' + id); return el.onclick({ target: el, preventDefault() {} }); };
const key = (k, extra = {}) => { const ev = Object.assign({ key: k, target: { tagName: 'DIV' }, preventDefault() {}, stopPropagation() {} }, extra); listeners.keydown(ev); return ev; };
const said = () => (live.length ? live[live.length - 1].textContent : '');
const snap = () => JSON.stringify(cr().state);

(async () => {
    // 1. Memao standing on the tile: every frame 6 pixels lower (feet from y 40 to 46); a frame with something
    // in its bottom 6 rows would lose it, so that sheet stays as it was.
    const ME = D.MemaoExport;
    const sheetWith = (frames, ys) => { const s = ME.blank(frames * 48, 4 * 48); for (let r = 0; r < 4; r++) for (let f = 0; f < frames; f++) for (const y of ys) s.data[((r * 48 + y) * s.width + f * 48 + 20) * 4 + 3] = 255; return s; };
    const feet = sheetWith(6, [10, 40]);
    const moved = ME.shiftDown(feet);
    assert.strictEqual(moved.cropped, 0);
    const alpha = (s, x, y) => s.data[(y * s.width + x) * 4 + 3];
    assert.ok(alpha(moved.sheet, 20, 46) && alpha(moved.sheet, 20, 16) && !alpha(moved.sheet, 20, 40), 'the feet at y 46, the head 6 lower too');
    assert.ok(alpha(moved.sheet, 5 * 48 + 20, 3 * 48 + 46), 'in every frame');
    const cape = sheetWith(6, [10, 44]);
    const kept = ME.shiftDown(cape);
    assert.strictEqual(kept.cropped, 24, 'every frame reaches its bottom');
    assert.strictEqual(kept.sheet, cape, 'so the sheet stays as it was');
    // The export: ticked by default; the walk is lowered; an action sheet that would lose pixels stays, and says so.
    const memaoAnims = D.MemaoCompose.animations;
    const realCompose = ws.composeMemao;
    ws.composeMemao = (recipe, anim) => ({ sheet: anim === 'wave' ? sheetWith(memaoAnims.wave.frames, [10, 45]) : sheetWith((memaoAnims[anim] || { frames: 4 }).frames, [10, 40]), warnings: [], used: [] });
    assert.strictEqual(ws.memaoExportDefaults().stand, true, 'on by default');
    assert.ok(/Stand on the tile's bottom/.test(D.CreatorKits.memao.exportExtraTicks()[0][1]));
    const result = ws.exportMemaoCharacter({ body: 'average', slots: {} }, Object.assign(ws.memaoExportDefaults(), { name: 'Mia', face: false, battler: false, actions: ['wave', 'hurt'] }));
    assert.ok(result && result.files.length >= 5, 'written');
    const classic = ws.readLpcPng('img/characters/$Mia.png');
    assert.ok(alpha(classic, 20, 46) && !alpha(classic, 20, 40), 'the classic walker stands at y 46');
    const wave = ws.readLpcPng('img/characters/' + ME.actionName('Mia', 'wave') + '.png');
    assert.ok(alpha(wave, 20, 45), 'the wave sheet is left as it was');
    assert.ok(result.warnings.some(w => /The wave sheet is left where it was: \d+ frames reach its bottom/.test(w)), 'and the export says so');
    const unstood = ws.exportMemaoCharacter({ body: 'average', slots: {} }, Object.assign(ws.memaoExportDefaults(), { name: 'Mia', face: false, battler: false, actions: [], stand: false }));
    assert.ok(unstood && alpha(ws.readLpcPng('img/characters/$Mia.png'), 20, 40), 'unticked: where the pack draws it');
    ws.composeMemao = realCompose;
    console.log('✓ Memao: standing on the tile, 6 pixels lower; sheets that would lose pixels stay');

    // 2. Memao props: a row per prop when the pack has more than one; the pick is drawn, None draws the first.
    const MS = D.MemaoSlots, MC = D.MemaoCompose;
    const part = (folder, n, name) => ({ id: folder + '/' + n, folder, name: name || folder + ' ' + n, order: Number(n), files: { any: Number(n) } });
    const memaoIndex = { format: D.Memao.indexFormat, version: D.Memao.indexVersion, library: fixture, sets: { Main: { frames: 64 }, 'Daily Life': { frames: 160 } },
        parts: [part('Body', '001'), part('Head', '001'), part('Eyes', '001'), part('BottomA', '001'), part('Eat', '001', 'Apple'), part('Eat', '002', 'Bread'), part('Drink', '001', 'Cup')],
        folders: { Body: { channel: 'skin', z: 1 }, Head: { channel: 'skin', z: 2 }, Eyes: { channel: 'eyes', z: 3 }, BottomA: { channel: 'cloth', z: 4 }, Eat: { channel: '', z: 9, prop: true }, Drink: { channel: '', z: 9, prop: true } } };
    ws.memaoIndex = () => memaoIndex;
    ws.composeMemao = () => ({ sheet: null, warnings: [], used: [] });
    ws.openCreator(null, 'memao');
    cr().tabs.outfit = MS.cards[1].tabs.findIndex(t => t.key === 'tools');
    const toolRows = ws.creatorRows('outfit').map(r => r.key);
    assert.ok(toolRows.includes('propeat') && !toolRows.includes('propdrink'), 'Food: two to choose from; Drink: only one, no row');
    const eatLayer = recipe => MC.resolve(memaoIndex, recipe, 'eat', () => true).layers.find(l => l.folder === 'Eat');
    assert.strictEqual(eatLayer(MS.toRecipe(cr().state)).num, 1, 'None: the first, as before');
    ws.creatorStep('propeat', 1);
    ws.creatorStep('propeat', 1);
    assert.strictEqual(cr().state.slots.propeat.id, 'Eat/002');
    assert.strictEqual(eatLayer(MS.toRecipe(cr().state)).num, 2, 'Bread is drawn');
    assert.strictEqual(MC.resolve(memaoIndex, MS.toRecipe(cr().state), 'eat', () => true).layers.filter(l => l.folder === 'Eat').length, 1, 'once');
    ws.closeCreator();
    ws.composeMemao = realCompose;
    console.log('✓ Memao props: a row when there is a choice; the pick drawn, None the first');

    // 3. MZ: a part's colour channels are its face slots and the slots its walking masks hold.
    const MZ = D.MzGenSlots;
    const mzPart = { id: 'Male/Cloak/01', base: 'Male', family: 'Cloak', num: 1, slots: ['m011'], files: { TV: [{ file: 'a', slots: ['m011', 'm012'] }], TVD: [], SV: [{ file: 'b', slots: ['m007'] }], Face: [] } };
    assert.deepStrictEqual(MZ.channels(null, mzPart).map(c => c.slot), ['m007', 'm011', 'm012'], 'Cloak 2 from the walking mask, Clothing 1 from the battler\'s');
    assert.deepStrictEqual(MZ.channels(null, mzPart).map(c => c.label), ['Clothing 1', 'Cloak 1', 'Cloak 2']);
    assert.deepStrictEqual(MZ.channels(null, { slots: ['m001'], files: { TV: [{ file: 'x' }] } }).map(c => c.slot), ['m001'], 'an older index (no mask slots): the face\'s');
    console.log('✓ MZ channels: the face\'s and the masks\' slots');

    // 4. Recipes: written and read back; another creator's refused with what to do; not a recipe; newer.
    const R = D.CreatorRecipe;
    const lpcState = { body: 'female', slots: { body: { id: 'body/body', colour: 'olive' }, shirt: { id: 'torso/shirt', colour: 'blue' } } };
    const text = R.write('lpc', 'Robin', lpcState);
    assert.deepStrictEqual(R.read(text, 'lpc'), { name: 'Robin', state: lpcState });
    assert.throws(() => R.read(text, 'mz'), /This recipe is for the LPC creator, not the RPG Maker MZ one: switch to LPC \(the list beside the title\) and bring it in there\./);
    assert.throws(() => R.read('nope', 'lpc'), /not a character recipe/);
    assert.throws(() => R.read(JSON.stringify({ format: R.format, version: 9, kit: 'lpc' }), 'lpc'), /newer/);
    const mzState = { body: 'Male', colours: { m001: 'skin:2' }, slots: { body: { id: 'Male/Body/01' } } };
    const mzText = R.write('mz', 'Rin', mzState);
    assert.strictEqual(JSON.stringify(R.read(mzText, 'mz').state), JSON.stringify(mzState), 'MZ keeps its colour slots, in the creator\'s own shape');
    assert.strictEqual(R.fileName('Robin: the "Brave"'), 'Robin_ the _Brave_.character.json');
    // In the window: from the Load popover; out and back in; undo; another creator's file refused.
    ws.setLpcLibraryFolder(lib);
    ws.scanLpcLibrary();
    ws.setLpcSafeOnly(false);
    ws.openCreator();
    click('dd-cr-load');
    assert.ok(html().includes('id="dd-cr-recipe-out"') && html().includes('id="dd-cr-recipe-in"'), 'on the Load popover');
    cr().name = 'Robin';
    cr().state.slots.shirt = { id: 'torso/shirt', colour: 'blue' };
    const file = path.join(fixture, 'Robin.character.json');
    assert.strictEqual(ws.creatorWriteRecipe(file), true);
    const saved = JSON.stringify(cr().state);
    cr().state.slots.shirt = { id: 'torso/tunic', colour: 'red' };
    cr().name = 'Someone';
    const before = JSON.stringify(cr().state);
    assert.strictEqual(ws.creatorReadRecipe(file), true);
    assert.deepStrictEqual([JSON.stringify(cr().state), cr().name], [saved, 'Robin'], 'brought back as it was');
    assert.strictEqual(said(), 'Brought in Robin');
    ws.creatorUndo();
    assert.strictEqual(JSON.stringify(cr().state), before, 'and undone');
    fs.writeFileSync(path.join(fixture, 'Rin.character.json'), mzText);
    const toasts2 = [];
    ws.showToast = (t, k) => toasts2.push([k, t]);
    assert.strictEqual(ws.creatorReadRecipe(path.join(fixture, 'Rin.character.json')), false);
    assert.ok(toasts2.length && toasts2[0][0] === 'error' && /for the RPG Maker MZ creator/.test(toasts2[0][1]), 'an MZ recipe in the LPC creator: refused, saying where it goes');
    assert.strictEqual(JSON.stringify(cr().state), before, 'nothing changed');
    // A recipe whose part the library doesn't have loads without it, named.
    const gone = JSON.parse(fs.readFileSync(file, 'utf8'));
    gone.slots.hat = { id: 'hat/crown', colour: 'red' };
    fs.writeFileSync(file, JSON.stringify(gone));
    ws.creatorReadRecipe(file);
    assert.ok(!cr().state.slots.hat && toasts2.some(t => /Some parts aren't offered now \(Hat\)/.test(t[1])), 'a gone part is dropped and named');
    ws.closeCreator();
    console.log('✓ recipes: written, read back, undone; another creator\'s refused; gone parts dropped');

    console.log('\nAll standing, prop, channel and recipe tests passed.');
})().catch(e => { console.error(e); process.exit(1); });
