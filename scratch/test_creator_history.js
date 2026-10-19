// scratch/test_creator_history.js
// Creators, Part A phase 3 (docs/CREATOR_IMPROVEMENTS_PLAN.md §2.2: locks, undo, the dice and the body type,
// Memao's linked hair): a locked row survives both dice (an MZ part with its colour slots); undo goes back
// before a roll, a step, a colour, a grid pick or a load, the last 20; the body dice keep the body type and
// Shift+X rolls a new one among those the library offers (not a locked one, nor one a locked part can't wear);
// Memao's long hair takes the hair's colour until unlinked; the keys and the pad's chords.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

console.log('=== Testing Character Creator Locks, Undo and Linked Hair (Part A, phase 3) ===');

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
const fixture = path.join(__dirname, 'creator_history_fixture');
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
    ws.setLpcLibraryFolder(lib);
    ws.scanLpcLibrary();
    ws.setLpcSafeOnly(false);
    ws.openCreator();
    const S = D.LpcSlots;
    // Dress the character: a shirt and a hat on the outfit card, hair on the body card.
    cr().state.slots.shirt = { id: 'torso/shirt', colour: 'blue' };
    cr().state.slots.hat = { id: 'hat/cap', colour: 'red' };
    cr().state.slots.hair = { id: 'hair/bob', colour: 'green' };
    ws.creatorChanged();
    const hatRow = () => ws.creatorRows('outfit').findIndex(r => r.key === 'hat');

    // 1. Locks: a padlock per row; L on the cursor row; the outfit dice leave a locked row as it is.
    assert.ok(/id="dd-cr-hat-lock"[^>]*aria-pressed="false"/.test(html()) || /class="dd-cr-lock" id="dd-cr-hat-lock" aria-pressed="false"/.test(html()) || html().includes('id="dd-cr-hat-lock"'), 'a padlock on the hat row');
    cr().tabs.outfit = S.cards[1].tabs.findIndex(t => t.slots.some(s => s.key === 'hat'));
    ws.renderCreator();
    click('dd-cr-hat-lock');
    assert.ok(ws.creatorLocked('hat') && /class="dd-cr-lock dd-cr-locked" id="dd-cr-hat-lock" aria-pressed="true"/.test(html()), 'clicked: locked, and shown so');
    assert.strictEqual(said(), 'Hat locked: the dice leave it');
    const shirtTab = S.cards[1].tabs.findIndex(t => t.slots.some(s => s.key === 'shirt'));
    cr().tabs.outfit = shirtTab;
    cr().cursor = { card: 'outfit', row: ws.creatorRows('outfit').findIndex(r => r.key === 'shirt') };
    key('l');
    assert.ok(ws.creatorLocked('shirt'), 'L locks the cursor row');
    const realRandom = Math.random;
    let seed = 7;
    Math.random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    for (let i = 0; i < 12; i++) {
        key('y');
        assert.deepStrictEqual([cr().state.slots.hat, cr().state.slots.shirt], [{ id: 'hat/cap', colour: 'red' }, { id: 'torso/shirt', colour: 'blue' }], 'locked rows survive the outfit dice');
    }
    assert.ok(/^New outfit; 2 locked kept$/.test(said()), said());
    key('l');
    assert.ok(!ws.creatorLocked('shirt'), 'L again unlocks');
    let changed = false;
    for (let i = 0; i < 12; i++) { key('y'); if (JSON.stringify(cr().state.slots.shirt) !== JSON.stringify({ id: 'torso/shirt', colour: 'blue' })) changed = true; }
    assert.ok(changed, 'unlocked, the dice change it');
    // The body dice skip a locked row of the body card too.
    ws.creatorToggleLock('hair');
    for (let i = 0; i < 8; i++) { key('x'); assert.deepStrictEqual(cr().state.slots.hair, { id: 'hair/bob', colour: 'green' }); }
    console.log('✓ locks: padlock, L, both dice leave locked rows');

    // 2. The body dice keep the body type; Shift+X rolls a new one among those the library offers.
    cr().state = S.setBody(cr().state, ws.lpcIndex(), 'female', false);
    ws.creatorChanged();
    for (let i = 0; i < 10; i++) { key('x'); assert.strictEqual(cr().state.body, 'female', 'X keeps the body type'); }
    assert.ok(/^New face and hair/.test(said()));
    assert.deepStrictEqual(ws.creatorBodyTypes(), ['male', 'female'], 'the types this library has a body for (no teen, child... here)');
    const seenTypes = new Set();
    for (let i = 0; i < 20; i++) { key('X', { shiftKey: true }); seenTypes.add(cr().state.body); }
    assert.deepStrictEqual([...seenTypes].sort(), ['female', 'male'], 'Shift+X rolls the type too, only to ones offered');
    assert.ok(cr().state.slots.body && cr().state.slots.head, 'with a body and a head');
    ws.creatorToggleLock('_body');
    const typeNow = cr().state.body;
    for (let i = 0; i < 10; i++) { key('X', { shiftKey: true }); assert.strictEqual(cr().state.body, typeNow, 'a locked body type stays'); }
    ws.creatorToggleLock('_body');
    // A locked part only one type can wear keeps the roll on that type.
    const realOptions = S.options;
    S.options = function(index, slot, body, safe) { const list = realOptions.call(this, index, slot, body, safe); return slot && slot.key === 'hat' && body === 'male' ? list.filter(p => p.id !== 'hat/cap') : list; };
    cr().state = S.setBody(cr().state, ws.lpcIndex(), 'female', false);
    cr().state.slots.hat = { id: 'hat/cap', colour: 'red' };
    assert.deepStrictEqual(ws.creatorBodyTypes(), ['female'], 'the locked cap only fits the female body');
    for (let i = 0; i < 10; i++) { key('X', { shiftKey: true }); assert.strictEqual(cr().state.body, 'female'); }
    S.options = realOptions;
    console.log('✓ body type: kept by X, rolled by Shift+X among those offered, not past a lock');

    // 3. Undo: back before a roll, a step, a colour and a grid pick; Ctrl+Z; nothing left says so.
    cr().history = [];
    const s0 = snap();
    key('y');
    assert.notStrictEqual(snap(), s0);
    cr().state.slots.shirt = { id: 'torso/shirt', colour: 'white' }; // so → lands on the Tunic
    const s1 = snap();
    cr().cursor = { card: 'outfit', row: ws.creatorRows('outfit').findIndex(r => r.key === 'shirt') };
    key('ArrowRight');
    const s2 = snap();
    key('ArrowRight', { shiftKey: true });
    const s3 = snap();
    ws.creatorOpenGrid('shirt');
    ws.creatorGridPick(0);
    assert.strictEqual(cr().state.slots.shirt, undefined, 'None picked in the grid');
    key('z', { ctrlKey: true });
    assert.strictEqual(snap(), s3, 'undo the grid pick');
    key('z', { ctrlKey: true });
    assert.strictEqual(snap(), s2, 'undo the colour');
    key('z', { ctrlKey: true });
    assert.strictEqual(snap(), s1, 'undo the step');
    key('z', { ctrlKey: true });
    assert.strictEqual(snap(), s0, 'undo the dice');
    assert.strictEqual(said(), 'Undone (0 more)');
    key('z', { ctrlKey: true });
    assert.strictEqual(said(), 'Nothing to undo');
    for (let i = 0; i < 30; i++) key('y');
    assert.strictEqual(cr().history.length, 20, 'the last 20');
    // Typing Ctrl+Z in the name field is the field's own.
    cr().history = [];
    key('y');
    key('z', { ctrlKey: true, target: { tagName: 'INPUT', type: 'text' } });
    assert.strictEqual(cr().history.length, 1, 'not the creator\'s');
    // A load can be undone.
    D.Ui.prompt = async () => 'Sam';
    cr().name = 'Sam';
    await ws.creatorSave();
    const beforeLoad = snap();
    key('y');
    const rolled = snap();
    ws.creatorLoad('Sam');
    assert.strictEqual(snap(), beforeLoad);
    ws.creatorUndo();
    assert.strictEqual(snap(), rolled, 'undo the load');
    Math.random = realRandom;
    console.log('✓ undo: dice, step, colour, grid pick, load; 20 kept; fields keep their own');

    // 4. The pad: Y held with a direction locks (without moving); Back held with B undoes (without closing);
    // X held rolls a new type; X, Y and Back alone act when let go.
    let pressed = [];
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { getGamepads: () => [{ connected: true, axes: [0, 0], buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: pressed.includes(i) })) }] } });
    const poll = (...b) => { pressed = b; ws.pollCreatorPad(); };
    const realNow = Date.now;
    let now = 1000;
    Date.now = () => now;
    poll();
    cr().tabs.outfit = S.cards[1].tabs.findIndex(t => t.slots.some(s => s.key === 'hat'));
    cr().cursor = { card: 'outfit', row: hatRow() };
    const lockedBefore = ws.creatorLocked('hat');
    const row = cr().cursor.row;
    poll(3); poll(3, 13); poll(3); poll();
    assert.strictEqual(ws.creatorLocked('hat'), !lockedBefore, 'Y + ↓ toggles the lock');
    assert.strictEqual(cr().cursor.row, row, 'and the cursor stays');
    const beforeY = snap();
    poll(3); poll();
    assert.notStrictEqual(snap(), beforeY, 'Y alone, let go: the outfit dice');
    const beforeUndo = cr().history.length;
    poll(8); poll(8, 1); poll(8); poll();
    assert.strictEqual(cr().history.length, beforeUndo - 1, 'Back + B undoes');
    assert.ok(ws.creatorOpen(), 'without closing');
    assert.strictEqual(cr().cursor.card, 'outfit', 'nor switching sides');
    poll(8); poll();
    assert.strictEqual(cr().cursor.card, 'body', 'Back alone, let go: the other side');
    const typeRolls = new Set();
    for (let i = 0; i < 12; i++) { poll(2); now += 700; poll(2); poll(); typeRolls.add(cr().state.body); }
    assert.ok(/^New body type/.test(said()), 'X held: a new body type: ' + said());
    Date.now = realNow;
    ws.closeCreator();
    console.log('✓ pad: Y + direction locks, Back + B undoes, X held rolls the type');

    // 5. MZ: a locked part keeps its colour slots through the dice.
    ws.setMzGenLibraryFolder(gen);
    ws.scanMzGenLibrary(gen);
    ws.openCreator(null, 'mz');
    const M = D.MzGenSlots;
    cr().state.slots.clothing = { id: 'Male/Clothing/02' };
    cr().state.colours.m007 = 'common:3';
    ws.creatorToggleLock('clothing');
    Math.random = () => 0.42;
    for (let i = 0; i < 5; i++) ws.creatorShuffle('outfit');
    assert.deepStrictEqual([cr().state.slots.clothing.id, cr().state.colours.m007], ['Male/Clothing/02', 'common:3'], 'the part and its Clothing 1 colour');
    assert.deepStrictEqual(ws.creatorBodyTypes(), ['Male'], 'MZ parts belong to their base: locked, no other base');
    ws.creatorShuffle('body', true);
    assert.strictEqual(cr().state.body, 'Male');
    Math.random = realRandom;
    void M;
    ws.closeCreator();
    console.log('✓ MZ: locked part and colour slots kept; the base stays');

    // 6. Memao: long hair takes the hair's colour until unlinked (K or the chain), and back.
    const MS = D.MemaoSlots;
    const part = (folder, n) => ({ id: folder + '/' + n, folder, name: folder + ' ' + n, order: Number(n), files: { any: folder + '_' + n + '.png' } });
    const memaoIndex = { format: D.Memao.indexFormat, version: D.Memao.indexVersion, library: fixture, sets: ['Main'],
        parts: [part('Body', '001'), part('Head', '001'), part('Eyes', '001'), part('HairA', '001'), part('HairB', '001'), part('HairB', '002'), part('HairC', '001'), part('Eyebrows', '001'), part('BottomA', '001'), part('Arms', '002')],
        folders: { Body: { channel: 'skin' }, Head: { channel: 'skin' }, Eyes: { channel: 'eyes' }, HairA: { channel: 'hair' }, HairB: { channel: 'hair' }, HairC: { channel: 'hair' }, Eyebrows: { channel: 'hair' }, BottomA: { channel: 'cloth' }, Arms: { channel: 'skin' } } };
    ws._memaoIndex = memaoIndex;
    ws.memaoIndex = () => memaoIndex;
    ws.composeMemao = () => ({ sheet: null, warnings: [], used: [] });
    ws.openCreator(null, 'memao');
    const hairColours = MS.colours(memaoIndex, memaoIndex.parts[3], 0);
    assert.ok(hairColours.length > 2, 'hair colours');
    cr().state.slots.hair = { id: 'HairA/001', colour: hairColours[1] };
    cr().state.slots.hairlong = { id: 'HairB/001', colour: hairColours[2] };
    const long = () => MS.toRecipe(cr().state).picks.find(p => p.id === 'HairB/001').colour;
    assert.strictEqual(long(), hairColours[1], 'linked: the long hair draws in the hair\'s colour');
    cr().tabs.body = MS.cards[0].tabs.findIndex(t => t.key === 'hair');
    ws.renderCreator();
    assert.ok(/class="dd-cr-link dd-cr-linked" id="dd-cr-hairlong-link" aria-pressed="true"/.test(html()), 'a chain where its swatch would be');
    assert.ok(!html().includes('id="dd-cr-hairlong-colour"'), 'no swatch of its own while linked');
    cr().cursor = { card: 'body', row: ws.creatorRows('body').findIndex(r => r.key === 'hairlong') };
    key('ArrowRight', { shiftKey: true });
    assert.strictEqual(said(), 'Long hair takes the hair colour: K for its own', 'a colour key on a linked row says how to unlink');
    cr().state.slots.hair.colour = hairColours[3];
    assert.strictEqual(long(), hairColours[3], 'and follows the hair as it changes');
    key('k');
    assert.ok(cr().state.slots.hairlong.ownColour, 'K: its own colour');
    assert.strictEqual(cr().state.slots.hairlong.colour, hairColours[3], 'starting from the hair\'s');
    assert.strictEqual(said(), 'Long hair: its own colour');
    assert.ok(html().includes('id="dd-cr-hairlong-colour"') && /class="dd-cr-link" id="dd-cr-hairlong-link" aria-pressed="false"/.test(html()), 'its swatch back, and the chain beside it');
    assert.ok(/<span class="dd-cr-swcell"><button type="button" class="dd-cr-swatch" id="dd-cr-hairlong-colour"[^]*?<\/button><button type="button" class="dd-cr-link" id="dd-cr-hairlong-link"[^]*?<\/button><\/span>/.test(html()), 'in one cell (not wrapped under the row)');
    key('ArrowRight', { shiftKey: true });
    assert.notStrictEqual(long(), hairColours[3], 'now it has its own colour');
    cr().state.slots.hair.colour = hairColours[0];
    assert.notStrictEqual(long(), hairColours[0], 'and no longer follows the hair');
    click('dd-cr-hairlong-link');
    assert.strictEqual(long(), hairColours[0], 'the chain links it again');
    ws.creatorUndo();
    assert.ok(cr().state.slots.hairlong.ownColour, 'linking can be undone');
    assert.deepStrictEqual([MS.slot('hairside').link, MS.slot('eyebrows').link, MS.slot('hair').link], ['hair', 'hair', undefined], 'side hair and eyebrows link too');
    ws.closeCreator();
    console.log('✓ Memao: linked hair follows until unlinked; K and the chain; undo');

    console.log('\nAll lock, undo and linked hair tests passed.');
})().catch(e => { console.error(e); process.exit(1); });
