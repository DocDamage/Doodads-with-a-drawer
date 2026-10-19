// scratch/test_creator_fixes.js
// Creators, Part A phase 1 (docs/CREATOR_IMPROVEMENTS_PLAN.md §2.1): MZ mask keys snapped or reported, the
// index's slots per mask, decoded files cached once (a colour change reads nothing again), caches by bytes,
// an MZ skin change keeping clothing's cached layer, credits from the stage's walk, the replace dialog naming
// the face slot and the outfit's part files, Tab inside the window, focus kept across a redraw, a live region,
// colour channels from the keys and the pad, the window following its size, slot labels in the translation
// template, stale picks dropped on load, and MZ's generator folder found on macOS.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

console.log('=== Testing Character Creator Fixes (Part A, phase 1) ===');

// ---- A page: elements by id from the window's HTML, with focus, Tab order and scrolling ----
const store = {};
let root = null, card = null;
const stubs = {};
const live = [];
const scrolled = [];
const ctx2d = { createImageData: (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }), putImageData() {}, drawImage() {}, clearRect() {}, imageSmoothingEnabled: true };
global.window = global;
global.innerWidth = 1400;
const listeners = {};
global.window.addEventListener = (type, fn) => { listeners[type] = fn; };
global.window.removeEventListener = (type, fn) => { if (listeners[type] === fn) delete listeners[type]; };
global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
const html = () => (root ? root.innerHTML : '');
const stub = id => {
    if (!stubs[id]) {
        stubs[id] = { id, getContext: () => ctx2d, width: 256, height: 256, style: {}, offsetParent: {}, disabled: false,
            getAttribute: k => (k === 'tabindex' ? null : null), focus() { global.document.activeElement = this; }, scrollIntoView() { scrolled.push(id); } };
    }
    stubs[id].disabled = new RegExp(`id="${id}"[^>]*\\sdisabled`).test(html());
    return stubs[id];
};
// Every element is made again when the window is rebuilt, as in a browser.
const makeEl = tag => ({
    tagName: tag.toUpperCase(), style: {}, textContent: '', width: 0, height: 0, _html: '', setAttribute() {}, appendChild() {}, getContext: () => ctx2d,
    get innerHTML() { return this._html; },
    set innerHTML(v) { this._html = v; if (this.id === 'dd-creator') for (const k of Object.keys(stubs)) delete stubs[k]; },
    contains: el => Boolean(el && el.id && html().includes(`id="${el.id}"`)),
    // The window's controls in document order, as the browser tabs through them.
    querySelectorAll: () => Array.from(html().matchAll(/<(?:button|input|select)\b[^>]*\bid="([^"]+)"/g)).map(m => stub(m[1]))
});
global.document = {
    activeElement: null,
    createElement: makeEl,
    body: {
        appendChild(n) {
            if (n.id === 'dd-creator') root = n;
            if (n.id === 'dd-lpc-card') card = n;
            if (n.id === 'dd-cr-live') live.push(n);
            n.parentNode = this;
        },
        removeChild(n) { if (n === root) root = null; if (n === card) card = null; n.parentNode = null; }
    },
    getElementById: id => {
        if (id === 'dd-creator') return root;
        if (id === 'dd-lpc-card') return card;
        const text = html() + (card ? card.innerHTML : '');
        return text.includes(`id="${id}"`) ? stub(id) : null;
    },
    querySelector: () => null,
    querySelectorAll: () => []
};
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: opt => opt === 'test' };
global.PluginManager = { parameters: () => ({}) };
global.$gameMap = { mapId: () => 1, tileWidth: () => 48, tileHeight: () => 48 };
global.$dataDocsDoodads = { 1: [] };

// ---- Fixtures: a small LPC library, a small MZ generator folder, a project ----
const fixture = path.join(__dirname, 'creator_fixes_fixture');
fs.rmSync(fixture, { recursive: true, force: true });
const project = path.join(fixture, 'project'), lib = path.join(fixture, 'lpc'), gen = path.join(fixture, 'generator');
const { encodePng } = require('../scripts/png');
const write = (base, rel, data) => { const f = path.join(base, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, typeof data === 'string' || Buffer.isBuffer(data) ? data : JSON.stringify(data)); };
const png = (w, h, paint) => { const d = new Uint8Array(w * h * 4); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = paint(x, y); if (c) d.set(c, (y * w + x) * 4); } return encodePng(w, h, d, b => zlib.deflateSync(b)); };
const sheet = rgba => png(576, 256, () => rgba);
const cc0 = file => [{ file, licenses: ['CC0'], authors: ['Ann'] }];
write(lib, 'sheet_definitions/body/body.json', { name: 'Body Color', type_name: 'body', match_body_color: true, recolors: { material: 'body' }, layer_1: { zPos: 10, male: 'body/m/', female: 'body/f/' }, credits: cc0('body') });
write(lib, 'sheet_definitions/head/human_male.json', { name: 'Human Male', type_name: 'head', match_body_color: true, recolors: { color_1: { material: 'body' } }, layer_1: { zPos: 100, male: 'head/m/', female: 'head/m/' }, credits: cc0('head') });
write(lib, 'sheet_definitions/torso/shirt.json', { name: 'Shirt', type_name: 'clothes', recolors: { material: 'cloth' }, layer_1: { zPos: 35, male: 'torso/shirt/' }, credits: [{ file: 'torso', licenses: ['CC0'], authors: ['Bo'] }] });
write(lib, 'sheet_definitions/cape/cape.json', { name: 'Cape', type_name: 'cape', recolors: { material: 'cloth' }, layer_1: { zPos: 5, male: 'cape/back/' }, layer_2: { zPos: 120, male: 'cape/front/' }, credits: cc0('cape') });
write(lib, 'palette_definitions/body/meta_body.json', { default: 'ulpc', base: 'light' });
write(lib, 'palette_definitions/body/body_ulpc.json', { light: ['#271920'], olive: ['#442725'] });
write(lib, 'palette_definitions/cloth/meta_cloth.json', { default: 'ulpc', base: 'white' });
write(lib, 'palette_definitions/cloth/cloth_ulpc.json', { white: ['#fefefe'], blue: ['#0000fe'], red: ['#fe0000'] });
write(lib, 'spritesheets/body/m/walk.png', sheet([0x27, 0x19, 0x20, 255]));
write(lib, 'spritesheets/head/m/walk.png', sheet([0, 0, 0, 0]));
write(lib, 'spritesheets/torso/shirt/walk.png', sheet([0xfe, 0xfe, 0xfe, 255]));
write(lib, 'spritesheets/cape/back/walk.png', sheet([0xfe, 0xfe, 0xfe, 255]));
write(lib, 'spritesheets/cape/front/walk.png', sheet([0xfe, 0xfe, 0xfe, 255]));
// MZ: ramps; a body whose mask has the skin key, one colour a step off the eyes key (snaps), one far from every
// key (left as drawn, reported); a clothing part whose mask has only Clothing 1 and whose face uses two slots.
const band = (x, base) => base.map(v => Math.round(v * (1 - x / 255)));
write(gen, 'grad_common.png', png(256, 8, (x, y) => (y < 4 ? band(x, [255, 255, 255]) : band(x, [255, 40, 40])).concat(255)));
write(gen, 'grad_skin.png', png(256, 8, (x, y) => (y < 4 ? band(x, [255, 200, 160]) : band(x, [120, 80, 60])).concat(255)));
write(gen, 'grad_hair.png', png(256, 4, x => band(x, [250, 220, 90]).concat(255)));
write(gen, 'grad_eyes.png', png(256, 4, x => band(x, [80, 200, 255]).concat(255)));
const KEY_SKIN = [0xf9, 0xc1, 0x9d, 255], NEAR_EYES = [0x30, 0x84, 0xd0, 255], FAR = [0x13, 0x80, 0xf8, 255], KEY_CLOTH1 = [0xae, 0x86, 0x82, 255], NEAR_CLOTH1 = [0xb2, 0x8a, 0x86, 255], WHITE = [255, 255, 255, 255];
write(gen, 'TV/Male/TV_Body_p01.png', png(144, 192, (x, y) => (y % 48 === 30 && x % 48 >= 10 && x % 48 <= 13 ? [200, 150, 120, 255] : null)));
write(gen, 'TV/Male/TV_Body_p01_c.png', png(144, 192, (x, y) => (y % 48 !== 30 ? null : x % 48 === 10 ? KEY_SKIN : x % 48 === 11 ? NEAR_EYES : x % 48 === 12 ? FAR : x % 48 === 13 ? WHITE : null)));
write(gen, 'TV/Male/TV_Clothing2_p01.png', png(144, 192, (x, y) => (x % 48 === 20 && y % 48 === 20 ? [128, 64, 32, 255] : null)));
write(gen, 'TV/Male/TV_Clothing2_p01_c.png', png(144, 192, (x, y) => (x % 48 === 20 && y % 48 === 20 ? KEY_CLOTH1 : x % 48 === 21 && y % 48 === 20 ? NEAR_CLOTH1 : null)));
write(gen, 'TV/Male/TV_FrontHair_p03.png', png(144, 192, () => null));
write(gen, 'TV/Male/TV_FrontHair_p08.png', png(144, 192, () => null));
write(gen, 'Face/Male/FG_Body_p01_c1_m001.png', png(144, 144, (x, y) => (x === 40 && y === 40 ? [200, 150, 120, 255] : null)));
write(gen, 'Face/Male/FG_Face_p02_c1_m001.png', png(144, 144, () => null));
write(gen, 'Face/Male/FG_Face_p06_c1_m001.png', png(144, 144, () => null));
write(gen, 'Face/Male/FG_Clothing2_p01_c3_m007.png', png(144, 144, (x, y) => (x === 60 && y === 60 ? [128, 64, 32, 255] : null)));
write(gen, 'Face/Male/FG_Clothing2_p01_c4_m008.png', png(144, 144, (x, y) => (x === 61 && y === 60 ? [128, 64, 32, 255] : null)));
fs.mkdirSync(path.join(project, 'data'), { recursive: true });
process.on('exit', () => { process.chdir(__dirname); fs.rmSync(fixture, { recursive: true, force: true }); });
process.chdir(project);

require('../Docs-Doodads.js');
const D = DocsDoodads, ws = D.Workspace, C = D.LpcCompose, M = D.MzGen;
const toasts = [];
ws.showToast = (text, kind) => toasts.push([kind, text]);
ws.mounted = true;
D.Ui.sound = () => {};
const click = id => { const el = document.getElementById(id); assert.ok(el && el.onclick, 'no button ' + id); return el.onclick({ target: el, preventDefault() {} }); };
const cr = () => ws._creator;
const key = (k, extra = {}) => { const ev = Object.assign({ key: k, target: { tagName: 'DIV' }, stopped: false, prevented: false, preventDefault() { this.prevented = true; }, stopPropagation() { this.stopped = true; } }, extra); listeners.keydown(ev); return ev; };
const said = () => (live.length ? live[live.length - 1].textContent : '');

(async () => {
    // 1. Caches by bytes: the oldest image goes past the budget, whatever the count; colour tables count nothing.
    const img = n => ({ width: n, height: 1, data: new Uint8Array(n * 4) });
    const cache = C.newCache(100, 1000);
    C.cached(cache, 'a', () => img(100));
    C.cached(cache, 'b', () => img(100));
    assert.strictEqual(cache.bytes, 800);
    C.cached(cache, 'a', () => assert.fail('a is cached'));
    C.cached(cache, 'c', () => img(100));
    assert.deepStrictEqual([...cache.map.keys()], ['a', 'c'], 'b, the least recently used, goes once past 1000 bytes');
    assert.strictEqual(cache.bytes, 800);
    C.cached(cache, 'lut', () => [1, 2, 3]);
    assert.strictEqual(cache.bytes, 800, 'a colour table counts nothing');
    C.cached(cache, 'huge', () => img(1000));
    assert.deepStrictEqual([...cache.map.keys()], ['huge'], 'the newest is kept even alone past the budget');
    const counted = C.newCache(2);
    ['x', 'y', 'z'].forEach(k => C.cached(counted, k, () => img(1)));
    assert.deepStrictEqual([...counted.map.keys()], ['y', 'z'], 'a count still limits a cache without a budget');
    console.log('✓ caches: by bytes, by count, newest kept');

    // 2. Mask keys: the numeric map gives every key its slot; near colours snap, far ones and white stay fixed.
    for (const [hex, slot] of Object.entries(M.keys)) assert.strictEqual(M.slotOfKey(parseInt(hex, 16)), slot, hex);
    assert.strictEqual(M.slotOfKey(0x3084d0), 'm002', '#3084d0 is a step off the eyes key');
    assert.strictEqual(M.slotOfKey(0xdcb010), 'm011', "MZ's #dcb010 snaps to Cloak 1 (#d8ac00), its nearest key");
    assert.strictEqual(M.slotOfKey(0x1380f8), '', '#1380f8 is too far from any key');
    assert.strictEqual(M.slotOfKey(0xfdfdfd), '', 'near-white is fixed');
    assert.strictEqual(M.slotOfKey(0xffffff), '');
    console.log('✓ mask keys: every known key, snapping within 24, far and white fixed');

    // 3. The MZ scan reads each mask once: its slots in the index, snapped and unknown colours in the warnings.
    ws.setMzGenLibraryFolder(gen);
    const index = ws.scanMzGenLibrary(gen);
    assert.ok(index);
    const body = index.parts.find(p => p.id === 'Male/Body/01'), cloth = index.parts.find(p => p.id === 'Male/Clothing/01');
    assert.deepStrictEqual(body.files.TV[0].slots, ['m001'], 'skin; the colour near the eyes key stays as drawn, as Body has no eyes slot');
    assert.deepStrictEqual(cloth.files.TV[0].slots, ['m007']);
    assert.ok(index.warnings.some(w => /#b28a86 is read as Clothing 1 \(#ae8682\) in Clothing 1 \(Male\)/.test(w)), 'a snapped colour is listed to check');
    assert.ok(index.warnings.some(w => /#3084d0 is no colour slot: those pixels keep their colour, in Body 1 \(Male\)/.test(w)), 'a colour near the key of a slot the part lacks is not snapped');
    assert.ok(index.warnings.some(w => /#1380f8 is no colour slot: those pixels keep their colour, in Body 1 \(Male\)/.test(w)), 'an unknown one is listed');
    assert.ok(!index.warnings.some(w => /#ffffff/.test(w)), 'white is not');
    console.log('✓ MZ scan: slots per mask, snapped and unknown colours in the warnings');

    // 4. Drawing MZ: each file decoded once; a skin change reads nothing again and keeps clothing's layer.
    let decodes = 0;
    const realDecode = C.decodePng;
    C.decodePng = function(...a) { decodes++; return realDecode.apply(this, a); };
    const S = D.MzGenSlots;
    const state = { body: 'Male', colours: { m001: 'skin:0', m007: 'common:1' }, slots: { body: { id: 'Male/Body/01' }, clothing: { id: 'Male/Clothing/01' } } };
    ws.composeMzGen(S.toRecipe(state), 'walk');
    assert.strictEqual(decodes, 4, 'two layers and their masks');
    const raw = ws.creatorImageCaches('mz').raw;
    assert.ok(raw.map.has('TV/Male/TV_Body_p01_c.png') && raw.map.has('TV/Male/TV_Clothing2_p01_c.png'), 'the masks are kept decoded');
    const layers = ws.mzgenCache();
    const clothKey = [...layers.map.keys()].find(k => k.startsWith('TV/Male/TV_Clothing2_p01.png|'));
    assert.strictEqual(clothKey, 'TV/Male/TV_Clothing2_p01.png|m007=common:1', "clothing's layer is keyed by its own slot only");
    const clothImage = layers.map.get(clothKey);
    state.colours.m001 = 'skin:1';
    ws.composeMzGen(S.toRecipe(state), 'walk');
    assert.strictEqual(decodes, 4, 'a new colour decodes nothing again');
    assert.strictEqual(layers.map.get(clothKey), clothImage, 'and the clothing layer is the same one, not drawn again');
    assert.ok([...layers.map.keys()].includes('TV/Male/TV_Body_p01.png|m001=skin:1'), 'the body is redrawn with its new skin');
    const out = ws.composeMzGen(S.toRecipe(state), 'walk');
    const px = (x, y) => Array.from(out.sheet.data.slice((y * out.sheet.width + x) * 4, (y * out.sheet.width + x) * 4 + 4));
    // Row 'up' is the sheet's first; the TV sheet's 'up' row is its fourth (y 144 + 30).
    assert.deepStrictEqual(px(12, 30), [200, 150, 120, 255], 'the far colour is left as drawn');
    assert.notDeepStrictEqual(px(10, 30), [200, 150, 120, 255], 'the skin pixel is recoloured');
    state.colours.m002 = 'eyes:0';
    const withEyes = ws.composeMzGen(S.toRecipe(state), 'walk');
    const at = (x, y) => Array.from(withEyes.sheet.data.slice((y * withEyes.sheet.width + x) * 4, (y * withEyes.sheet.width + x) * 4 + 4));
    assert.deepStrictEqual(at(11, 30), [200, 150, 120, 255], 'an eyes colour leaves the body\'s near-eyes pixel as drawn (Body has no eyes slot)');
    delete state.colours.m002;
    C.decodePng = realDecode;
    console.log('✓ MZ drawing: files decoded once, layers keyed by their mask\'s slots');

    // 5. Stale picks on load: a gone part is dropped and named; a required slot takes the nearest number.
    fs.writeFileSync(path.join(project, S.charactersFile), JSON.stringify({ format: S.format, version: 1, characters: [
        { name: 'Rin', body: 'Male', colours: {}, slots: { body: { id: 'Male/Body/01' }, face: { id: 'Male/Face/05' }, fronthair: { id: 'Male/FrontHair/04' } } }
    ] }));
    ws.openCreator(null, 'mz');
    ws.creatorLoad('Rin');
    assert.strictEqual(cr().state.slots.face.id, 'Male/Face/06', 'the face (required) takes the nearest number, 6 for 5');
    assert.strictEqual(cr().state.slots.fronthair, undefined, 'the gone front hair is dropped');
    assert.ok(/Some parts aren't offered now \(Face, Front hair\)/.test(toasts[toasts.length - 1][1]), 'and named');
    assert.ok(!/FrontHair 4|Front hair 4/.test(html()), 'no row shows a part that is not there');
    assert.strictEqual(said(), 'Loaded Rin');
    assert.strictEqual(S.nearestPart(index, S.slot('fronthair'), 'Male', 'Male/FrontHair/06').id, 'Male/FrontHair/08', 'nearest by number, the higher on a tie');
    console.log('✓ stale picks: dropped and named, required slots take the nearest part');

    // 6. Colour channels: C steps the cursor row's channel (shown on the swatch); Shift+arrows change that one.
    cr().state.slots.clothing = { id: 'Male/Clothing/01' };
    cr().state.colours = {};
    const outfitRows = ws.creatorRows('outfit');
    cr().cursor = { card: 'outfit', row: outfitRows.findIndex(r => r.key === 'clothing') };
    ws.creatorChanged();
    assert.ok(/id="dd-cr-clothing-colour"[^>]*><span class="dd-cr-chn">1<\/span>/.test(html()), 'the swatch shows channel 1 of 2');
    key('ArrowRight', { shiftKey: true });
    assert.ok(cr().state.colours.m007 !== undefined && cr().state.colours.m008 === undefined, 'Shift+→ changes the first channel');
    assert.ok(/^Clothing 1 colour: colour \d+ of 2$/.test(said()), 'and says so, by number: ' + said());
    key('c');
    assert.strictEqual(cr().channels.clothing, 1);
    assert.ok(/<span class="dd-cr-chn">2<\/span>/.test(html()), 'the swatch shows channel 2');
    assert.strictEqual(said(), 'Clothing 2 colour: as drawn');
    const before7 = cr().state.colours.m007;
    key('ArrowRight', { shiftKey: true });
    assert.ok(cr().state.colours.m008 && cr().state.colours.m007 === before7, 'now Shift+→ changes the second');
    key('c');
    assert.strictEqual(cr().channels.clothing, 0, 'and round again');
    // The pad's A: a short press is the next colour; held, the next channel.
    let pressed = [];
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { getGamepads: () => [{ connected: true, axes: [0, 0], buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: pressed.includes(i) })) }] } });
    const realNow = Date.now;
    let now = 5000;
    Date.now = () => now;
    const c7 = cr().state.colours.m007;
    pressed = [0]; ws.pollCreatorPad(); now += 100; pressed = []; ws.pollCreatorPad();
    assert.notStrictEqual(cr().state.colours.m007, c7, 'A pressed: the next colour');
    pressed = [0]; ws.pollCreatorPad(); now += 700; ws.pollCreatorPad();
    assert.strictEqual(cr().channels.clothing, 1, 'A held: the next channel');
    const c8 = cr().state.colours.m008;
    pressed = []; ws.pollCreatorPad();
    assert.strictEqual(cr().state.colours.m008, c8, 'and letting go changes no colour');
    Date.now = realNow;
    ws.closeCreator();
    assert.strictEqual(live[live.length - 1].parentNode, null, 'the live region goes with the window');
    console.log('✓ channels: C and the pad\'s long A step it, Shift+arrows and A change its colour');

    // 7. The LPC window: credits from the stage's walk, Tab inside, focus kept, the live region, the size.
    ws.setLpcLibraryFolder(lib);
    ws.scanLpcLibrary();
    ws.setLpcSafeOnly(false);
    ws.openCreator();
    assert.ok(root && cr().kit === 'lpc');
    let walks = 0;
    const realCompose = ws.composeLpc;
    ws.composeLpc = function(recipe, anim, ...rest) { if (anim === 'walk') walks++; return realCompose.call(this, recipe, anim, ...rest); };
    ws.creatorChanged();
    assert.strictEqual(walks, 1, 'one walk for the stage, and the credits read it');
    assert.ok(/Credits · 1 artist/.test(html()));
    ws.renderCreator();
    assert.strictEqual(walks, 1, 'redrawing (turning, a cursor move) composes nothing');
    cr().showBody = false;
    ws.creatorChanged();
    assert.strictEqual(walks, 3, 'with the body hidden the stage leaves it out, so the credits draw the whole walk');
    cr().showBody = true;
    ws.creatorChanged();
    ws.composeLpc = realCompose;
    // Focus: the button pressed is focused again after the window is rebuilt; the live region says the value.
    cr().cursor = { card: 'body', row: 0 };
    ws.renderCreator();
    stub('dd-cr-_body-next').focus();
    click('dd-cr-_body-next');
    assert.ok(document.activeElement === document.getElementById('dd-cr-_body-next'), 'focus is on the new ▶ after the window is rebuilt');
    assert.strictEqual(said(), 'Body type: Female, 2 of 6');
    click('dd-cr-_body-prev');
    key('ArrowDown');
    assert.ok(/^Skin: Body Color, 1 of 1$/.test(said()), 'moving the cursor says the row: ' + said());
    key('ArrowUp');
    // Tab: the browser moves the focus; from the last control it goes round to the first, and Shift the other way.
    const controls = root.querySelectorAll();
    const first = controls[0], last = controls[controls.length - 1];
    stub(controls[3].id).focus();
    let e = key('Tab');
    assert.ok(!e.prevented && e.stopped, 'Tab in the middle is the browser\'s, and stops at the window');
    last.focus();
    e = key('Tab');
    assert.ok(e.prevented && document.activeElement === first, 'from the last control to the first');
    e = key('Tab', { shiftKey: true });
    assert.ok(e.prevented && document.activeElement === last, 'Shift+Tab from the first to the last');
    document.activeElement = null;
    key('Tab');
    assert.strictEqual(document.activeElement, first, 'from outside the window, in to its first control');
    assert.ok(/C channel · /.test(html()) && / \[ \] side · /.test(html()), 'the key line says the new keys');
    // The size: smaller, the window shows one card; the cursor row is scrolled into view.
    scrolled.length = 0;
    global.innerWidth = 816;
    listeners.resize();
    assert.ok(/dd-cr-narrow/.test(html()) && cr().narrow, 'made smaller: one card at a time');
    assert.ok(scrolled.includes('dd-cr-_body-row'), 'the cursor row is scrolled into view');
    const renders = html();
    listeners.resize();
    assert.strictEqual(html(), renders, 'the same size: nothing redrawn');
    global.innerWidth = 1400;
    listeners.resize();
    assert.ok(!/dd-cr-narrow/.test(html()), 'and back');
    console.log('✓ LPC window: credits from the walk, focus kept, live region, Tab, size');

    // 8. The replace dialog: the face names its slot (only when the slot is taken), the part files are listed.
    D.Ui.prompt = async () => 'Robin';
    cr().name = 'Robin';
    cr().state.slots.shirt = { id: 'torso/shirt', colour: 'white' };
    cr().state.slots.cape = { id: 'cape/cape', colour: 'white' };
    const K = ws.creatorKit();
    const o = Object.assign(K.exportDefaults(ws), { parts: true, actions: [] });
    cr().exportOptions = o;
    const entries = K.exportFiles(ws, 'Robin', o, cr().state);
    const face = entries.find(f => f.file === 'img/faces/Robin.png');
    assert.deepStrictEqual([face.faceSlot, face.note], [0, 'face 1 of 8 in Robin.png; the others are kept']);
    const partFiles = entries.filter(f => /outfit part/.test(f.note)).map(f => f.file);
    assert.ok(partFiles.some(f => /Shirt/.test(f)), 'the shirt\'s part sheets are listed');
    assert.ok(partFiles.some(f => /Cape/.test(f) && /behind/i.test(entries.find(x => x.file === f).note)), 'and the cape behind the body');
    const E = D.LpcExport, faceSheet = E.blank(E.faceSize * 4, E.faceSize * 2);
    faceSheet.data[3] = 255; // a pixel in face 1
    ws.writeLpcPng('img/faces/Robin.png', faceSheet);
    ws.writeLpcPng('img/characters/$Robin.png', E.blank(144, 192));
    let asked = null;
    D.Ui.confirm = async text => { asked = text; return false; };
    o.faceSlot = 2;
    await ws.creatorExport();
    assert.ok(asked && /Replace 1 picture/.test(asked) && !/faces/.test(asked), 'an empty face slot is no replacement: ' + asked);
    o.faceSlot = 0;
    await ws.creatorExport();
    assert.ok(/Replace 2 pictures/.test(asked) && /img\/faces\/Robin\.png \(face 1 of 8 in Robin\.png; the others are kept\)/.test(asked), 'a taken one is named with its slot');
    fs.mkdirSync('img/characters', { recursive: true });
    const shirtFile = partFiles.find(f => /Shirt/.test(f) && /^img\/characters\/\$/.test(f));
    ws.writeLpcPng(shirtFile, E.blank(144, 192));
    await ws.creatorExport();
    assert.ok(asked.includes(shirtFile + ' (outfit part: Shirt)'), 'a part sheet already there is listed');
    assert.deepStrictEqual(ws.exportLpcParts(cr().state, o, null, null, { dryRun: true }).map(f => f.file), partFiles, 'the dry run is the list');
    ws.closeCreator();
    console.log('✓ replace dialog: the face slot, only when taken; the outfit\'s part files');

    // 9. The translation template has the creators' row labels; MZ's folder is found from a macOS app too.
    const strings = require('../scripts/strings.js').build().strings;
    for (const label of ['Beast ears', 'Accessory A', 'Facial mark']) assert.ok(label in strings, label);
    const mac = path.join(fixture, 'mac');
    fs.mkdirSync(path.join(mac, 'RPG Maker MZ.app', 'Contents', 'MacOS'), { recursive: true });
    fs.mkdirSync(path.join(mac, 'generator', 'TV'), { recursive: true });
    fs.writeFileSync(path.join(mac, 'generator', 'grad_common.png'), 'x');
    assert.strictEqual(ws.mzgenDetectFolder(path.join(mac, 'RPG Maker MZ.app', 'Contents', 'MacOS', 'nwjs')), path.join(mac, 'generator'), 'three folders up from the app\'s executable');
    const win = path.join(fixture, 'win');
    fs.mkdirSync(path.join(win, 'nwjs-win'), { recursive: true });
    fs.mkdirSync(path.join(win, 'generator', 'TV'), { recursive: true });
    fs.writeFileSync(path.join(win, 'generator', 'grad_common.png'), 'x');
    assert.strictEqual(ws.mzgenDetectFolder(path.join(win, 'nwjs-win', 'nw.exe')), path.join(win, 'generator'), 'beside nwjs-win on Windows');
    const deep = path.join(fixture, 'deep', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h');
    fs.mkdirSync(deep, { recursive: true });
    fs.mkdirSync(path.join(fixture, 'deep', 'generator', 'TV'), { recursive: true });
    fs.writeFileSync(path.join(fixture, 'deep', 'generator', 'grad_common.png'), 'x');
    assert.strictEqual(ws.mzgenDetectFolder(path.join(deep, 'nw.exe')), '', 'no further than six folders up');
    console.log('✓ slot labels in the template; MZ found from a macOS app');

    console.log('\nAll character creator fix tests passed.');
})().catch(e => { console.error(e); process.exit(1); });
