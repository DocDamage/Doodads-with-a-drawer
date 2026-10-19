// scratch/test_creator_grid.js
// Creators, Part A phase 2 (docs/CREATOR_IMPROVEMENTS_PLAN.md §2.2, the grid picker): a row's choices in a
// grid in the row's order with None first and the current one marked; thumbnails made once per part and body
// (MZ's Variation icons where the generator has them); tiles drawn as they come into view; typing filters;
// the keys and the pad move, pick and close; Esc clears the filter first; a rescan forgets the thumbnails.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

console.log('=== Testing Character Creator Grid Picker (Part A, phase 2) ===');

// ---- A page: elements by id from the window's HTML, made again on every rebuild ----
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
let urls = 0;
const stub = id => {
    if (!stubs[id]) {
        const classes = new Set((new RegExp(`class="([^"]*)" id="${id}"`).exec(html()) || [])[1] ? (new RegExp(`class="([^"]*)" id="${id}"`).exec(html()))[1].split(/\s+/) : []);
        const box = { innerHTML: '' };
        const attrs = {};
        stubs[id] = { id, getContext: () => ctx2d, width: 256, height: 256, style: {}, offsetParent: {}, value: '', scrolled: 0,
            classList: { add: c => classes.add(c), remove: c => classes.delete(c), contains: c => classes.has(c) },
            box, querySelector: sel => (sel === '.dd-cr-tileimg' ? box : null),
            setAttribute(k, v) { attrs[k] = String(v); }, getAttribute: k => (k in attrs ? attrs[k] : null), removeAttribute(k) { delete attrs[k]; },
            focus() { global.document.activeElement = this; }, scrollIntoView() { this.scrolled++; } };
        const v = new RegExp(`id="${id}" value="([^"]*)"`).exec(html());
        if (v) stubs[id].value = v[1];
        if (new RegExp(`id="${id}"[^>]*style="display: none;"`).test(html())) stubs[id].style.display = 'none';
    }
    return stubs[id];
};
const makeEl = tag => ({
    tagName: tag.toUpperCase(), style: {}, textContent: '', width: 0, height: 0, _html: '', setAttribute() {}, appendChild() {},
    getContext: () => Object.assign({}, ctx2d), toDataURL: () => 'data:image/png;base64,T' + (++urls),
    get innerHTML() { return this._html; },
    set innerHTML(v) { this._html = v; if (this.id === 'dd-creator') for (const k of Object.keys(stubs)) delete stubs[k]; },
    contains: el => Boolean(el && el.id && html().includes(`id="${el.id}"`)),
    querySelectorAll: () => []
});
global.document = {
    activeElement: null,
    createElement: makeEl,
    body: {
        appendChild(n) { if (n.id === 'dd-creator') root = n; if (n.id === 'dd-cr-live') live.push(n); n.parentNode = this; },
        removeChild(n) { if (n === root) root = null; n.parentNode = null; }
    },
    getElementById: id => (id === 'dd-creator' ? root : html().includes(`id="${id}"`) ? stub(id) : null),
    querySelector: () => null,
    querySelectorAll: () => []
};
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: opt => opt === 'test' };
global.PluginManager = { parameters: () => ({}) };
global.$gameMap = { mapId: () => 1, tileWidth: () => 48, tileHeight: () => 48 };
global.$dataDocsDoodads = { 1: [] };

// ---- An MZ generator folder: four front hairs (icons for 1 and 2, none for 3 and 12), eyes only in faces ----
const fixture = path.join(__dirname, 'creator_grid_fixture');
fs.rmSync(fixture, { recursive: true, force: true });
const project = path.join(fixture, 'project'), gen = path.join(fixture, 'generator'), lib = path.join(fixture, 'lpc');
const { encodePng } = require('../scripts/png');
const write = (base, rel, data) => { const f = path.join(base, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, typeof data === 'string' || Buffer.isBuffer(data) ? data : JSON.stringify(data)); };
const png = (w, h, paint) => { const d = new Uint8Array(w * h * 4); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = paint(x, y); if (c) d.set(c, (y * w + x) * 4); } return encodePng(w, h, d, b => zlib.deflateSync(b)); };
const band = (x, base) => base.map(v => Math.round(v * (1 - x / 255)));
for (const g of ['common', 'skin', 'hair', 'eyes']) write(gen, `grad_${g}.png`, png(256, 4, x => band(x, [200, 150, 100]).concat(255)));
write(gen, 'TV/Male/TV_Body_p01.png', png(144, 192, (x, y) => (x % 48 >= 16 && x % 48 < 32 && y % 48 >= 10 && y % 48 < 44 ? [200, 150, 120, 255] : null)));
write(gen, 'TV/Female/TV_Body_p01.png', png(144, 192, (x, y) => (x % 48 >= 18 && x % 48 < 30 && y % 48 >= 12 && y % 48 < 44 ? [180, 140, 110, 255] : null)));
for (const n of ['01', '02', '03', '12']) {
    write(gen, `TV/Male/TV_FrontHair1_p${n}.png`, png(144, 192, (x, y) => (x % 48 >= 14 && x % 48 < 34 && y % 48 >= 8 && y % 48 < 18 ? [90, 60, Number(n) * 10, 255] : null)));
    write(gen, `TV/Female/TV_FrontHair1_p${n}.png`, png(144, 192, (x, y) => (x % 48 >= 14 && x % 48 < 34 && y % 48 >= 8 && y % 48 < 18 ? [90, 60, Number(n) * 10, 255] : null)));
}
write(gen, 'Variation/Male/icon_FrontHair_p01.png', png(64, 64, (x, y) => (x > 10 && x < 50 && y > 20 && y < 40 ? [255, 0, 0, 255] : null)));
write(gen, 'Variation/Male/icon_FrontHair_p02.png', png(64, 64, (x, y) => (x > 10 && x < 50 && y > 20 && y < 40 ? [0, 255, 0, 255] : null)));
write(gen, 'Face/Male/FG_Body_p01_c1_m001.png', png(144, 144, () => null));
write(gen, 'Face/Male/FG_Face_p01_c1_m001.png', png(144, 144, () => null));
write(gen, 'Face/Male/FG_Eyes_p01_c1_m002.png', png(144, 144, (x, y) => (x >= 50 && x < 60 && y === 60 ? [40, 80, 200, 255] : null)));
write(gen, 'Face/Female/FG_Body_p01_c1_m001.png', png(144, 144, () => null));
write(gen, 'Face/Female/FG_Face_p01_c1_m001.png', png(144, 144, () => null));
// A small LPC library: two shirts, for thumbnails composed from the library (no icons).
const cc0 = file => [{ file, licenses: ['CC0'], authors: ['Ann'] }];
const sheet = rgba => png(576, 256, (x, y) => (x % 64 >= 20 && x % 64 < 44 && y % 64 >= 30 && y % 64 < 50 ? rgba : null));
write(lib, 'sheet_definitions/body/body.json', { name: 'Body Color', type_name: 'body', match_body_color: true, recolors: { material: 'body' }, layer_1: { zPos: 10, male: 'body/m/', female: 'body/f/' }, credits: cc0('body') });
write(lib, 'sheet_definitions/head/human_male.json', { name: 'Human Male', type_name: 'head', match_body_color: true, recolors: { color_1: { material: 'body' } }, layer_1: { zPos: 100, male: 'head/m/', female: 'head/m/' }, credits: cc0('head') });
write(lib, 'sheet_definitions/torso/shirt.json', { name: 'Shirt', type_name: 'clothes', recolors: { material: 'cloth' }, layer_1: { zPos: 35, male: 'torso/shirt/' }, credits: cc0('torso') });
write(lib, 'sheet_definitions/torso/tunic.json', { name: 'Tunic', type_name: 'clothes', recolors: { material: 'cloth' }, layer_1: { zPos: 35, male: 'torso/tunic/' }, credits: cc0('tunic') });
write(lib, 'palette_definitions/body/meta_body.json', { default: 'ulpc', base: 'light' });
write(lib, 'palette_definitions/body/body_ulpc.json', { light: ['#271920'] });
write(lib, 'palette_definitions/cloth/meta_cloth.json', { default: 'ulpc', base: 'white' });
write(lib, 'palette_definitions/cloth/cloth_ulpc.json', { white: ['#fefefe'], blue: ['#0000fe'] });
write(lib, 'spritesheets/body/m/walk.png', sheet([0x27, 0x19, 0x20, 255]));
write(lib, 'spritesheets/head/m/walk.png', png(576, 256, () => null));
write(lib, 'spritesheets/torso/shirt/walk.png', sheet([0xfe, 0xfe, 0xfe, 255]));
write(lib, 'spritesheets/torso/tunic/walk.png', sheet([0xfe, 0xfe, 0xfe, 255]));
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
const key = (k, extra = {}) => { const ev = Object.assign({ key: k, target: { tagName: 'DIV' }, stopped: false, prevented: false, preventDefault() { this.prevented = true; }, stopPropagation() { this.stopped = true; } }, extra); listeners.keydown(ev); return ev; };
const said = () => (live.length ? live[live.length - 1].textContent : '');
const tiles = () => Array.from(html().matchAll(/id="dd-cr-tile-(\d+)"[^>]*title="([^"]*)"/g)).map(m => m[2]);

(async () => {
    // 1. The scan records the generator's Variation icons.
    ws.setMzGenLibraryFolder(gen);
    const index = ws.scanMzGenLibrary(gen);
    const hair = n => index.parts.find(p => p.id === 'Male/FrontHair/' + n);
    assert.strictEqual(hair('01').icon, 'Variation/Male/icon_FrontHair_p01.png');
    assert.strictEqual(hair('03').icon, undefined, 'a part without an icon has none');
    console.log('✓ scan: Variation icons per part');

    // 2. The grid: the row's options in order, None first (front hair isn't required), the current marked.
    ws.openCreator(null, 'mz');
    const rows = ws.creatorRows('body');
    cr().tabs.body = D.MzGenSlots.cards[0].tabs.findIndex(t => t.key === 'hair');
    ws.renderCreator();
    cr().cursor = { card: 'body', row: ws.creatorRows('body').findIndex(r => r.key === 'fronthair') };
    ws.renderCreator();
    void rows;
    assert.ok(/id="dd-cr-fronthair-value"[^>]*aria-haspopup="listbox"/.test(html()), 'the value is a button that opens a list');
    stub('dd-cr-fronthair-next').focus(); // another button has the focus: the grid must still take it
    click('dd-cr-fronthair-value');
    assert.strictEqual(cr().pop.kind, 'grid');
    assert.deepStrictEqual(tiles(), ['None', 'Front hair 1', 'Front hair 2', 'Front hair 3', 'Front hair 12']);
    assert.ok(/id="dd-cr-tile-1" role="option" aria-selected="true"/.test(html()), 'the current one (Front hair 1) is marked');
    assert.ok(/class="dd-cr-tile dd-cr-tile-here" id="dd-cr-tile-1"/.test(html()), 'and the cursor starts on it');
    assert.strictEqual(said(), 'Front hair: choose from 5. Type to find one.');
    assert.strictEqual(document.activeElement && document.activeElement.id, 'dd-cr-grid-filter', 'the search box has the keys');
    console.log('✓ grid: order, None first, current marked, the search box focused');

    // 3. Thumbnails: the icon where there is one, the part drawn alone otherwise; once per part and body.
    const thumb1 = ws._creatorThumbs.get('mz|Male|Male/FrontHair/01');
    assert.ok(thumb1 && thumb1.image, 'drawn when the grid opened (no IntersectionObserver here: the first batch at once)');
    assert.deepStrictEqual([thumb1.image.width, thumb1.image.height], [39, 19], 'the icon, cut to its drawn pixels');
    assert.deepStrictEqual(Array.from(thumb1.image.data.slice(0, 4)), [255, 0, 0, 255], 'the generator\'s own icon');
    const thumb3 = ws._creatorThumbs.get('mz|Male|Male/FrontHair/03');
    assert.deepStrictEqual([thumb3.image.width, thumb3.image.height, ...Array.from(thumb3.image.data.slice(0, 3))], [20, 10, 90, 60, 30], 'no icon: the part drawn alone, standing, facing down');
    assert.ok(/^data:image\/png/.test(thumb3.url), 'a picture for the tile');
    assert.ok(stubs['dd-cr-tile-3'].box.innerHTML.includes(thumb3.url), 'put in its tile');
    let made = 0;
    const kit = D.CreatorKits.mz, realThumb = kit.thumbnail;
    kit.thumbnail = function(...a) { made++; return realThumb.apply(this, a); };
    ws.renderCreator();
    assert.ok(html().includes(thumb3.url), 'drawn again from the cache when the window is rebuilt');
    assert.strictEqual(made, 0, 'nothing made again');
    // The eyes only exist in faces: their tile is the face layer.
    cr().tabs.body = D.MzGenSlots.cards[0].tabs.findIndex(t => t.key === 'face');
    cr().pop = null;
    ws.renderCreator();
    ws.creatorOpenGrid('eyes');
    const eyes = ws._creatorThumbs.get('mz|Male|Male/Eyes/01');
    assert.ok(eyes && eyes.image && eyes.image.width === 10, 'the eyes tile is their face picture, cut: ' + (eyes && eyes.image && eyes.image.width));
    console.log('✓ thumbnails: Variation icon, else drawn alone; cut; cached; face-only parts from the face');

    // 4. Keys: arrows move, typing filters (Left / Right stay with the text), Esc clears then closes, Enter picks.
    cr().tabs.body = D.MzGenSlots.cards[0].tabs.findIndex(t => t.key === 'hair');
    cr().pop = null;
    cr().cursor = { card: 'body', row: ws.creatorRows('body').findIndex(r => r.key === 'fronthair') };
    ws.renderCreator();
    key('Enter');
    assert.strictEqual(cr().pop && cr().pop.row, 'fronthair', 'Enter on a row opens its grid');
    let e = key('ArrowRight', { target: { tagName: 'INPUT', type: 'search', id: 'dd-cr-grid-filter', value: '' } });
    assert.ok(e.prevented && cr().pop.at === 2 && stubs['dd-cr-tile-2'].classList.contains('dd-cr-tile-here'), '→ moves to Front hair 2');
    assert.ok(!stubs['dd-cr-tile-1'].classList.contains('dd-cr-tile-here'));
    assert.strictEqual(said(), 'Front hair 2, 3 of 5');
    key('ArrowDown', { target: { tagName: 'INPUT', type: 'search', id: 'dd-cr-grid-filter', value: '' } });
    assert.strictEqual(cr().pop.at, 4, '↓ a row of six: to the last');
    stubs['dd-cr-grid-filter'].value = '1';
    stubs['dd-cr-grid-filter'].oninput({ target: stubs['dd-cr-grid-filter'] });
    assert.deepStrictEqual([1, 2, 3, 4].map(i => stubs['dd-cr-tile-' + i].style.display || 'shown'), ['shown', 'none', 'none', 'shown'], 'typing "1": Front hair 1 and 12');
    assert.strictEqual(stubs['dd-cr-tile-0'].style.display, 'none', 'None too');
    assert.strictEqual(stubs['dd-cr-grid-count'].textContent, '2 of 5');
    assert.strictEqual(cr().pop.at, 4, 'the cursor stays on a tile still shown');
    e = key('ArrowLeft', { target: { tagName: 'INPUT', type: 'search', id: 'dd-cr-grid-filter', value: '1' } });
    assert.ok(!e.prevented, '← moves in the text while it has some');
    key('Home', { target: { tagName: 'INPUT', type: 'search', id: 'dd-cr-grid-filter', value: '' } });
    assert.strictEqual(cr().pop.at, 1);
    key('Escape', { target: { tagName: 'INPUT', type: 'search', id: 'dd-cr-grid-filter', value: '1' } });
    assert.ok(cr().pop && cr().pop.filter === '' && stubs['dd-cr-tile-2'].style.display === '', 'Esc clears the filter first');
    key('ArrowRight', { target: { tagName: 'INPUT', type: 'search', id: 'dd-cr-grid-filter', value: '' } });
    key('Enter', { target: { tagName: 'INPUT', type: 'search', id: 'dd-cr-grid-filter', value: '' } });
    assert.strictEqual(cr().state.slots.fronthair.id, 'Male/FrontHair/02', 'Enter picks');
    assert.strictEqual(cr().pop, null, 'and closes');
    assert.strictEqual(said(), 'Front hair: Front hair 2, 2 of 4');
    assert.strictEqual(document.activeElement && document.activeElement.id, 'dd-cr-fronthair-value', 'the focus goes back to the row');
    key('Enter');
    key('Escape', { target: { tagName: 'INPUT', type: 'search', id: 'dd-cr-grid-filter', value: '' } });
    assert.strictEqual(cr().pop, null, 'Esc with no filter closes');
    // A click on a tile picks it; None takes the part away.
    click('dd-cr-fronthair-value');
    click('dd-cr-tile-0');
    assert.strictEqual(cr().state.slots.fronthair, undefined, 'None');
    console.log('✓ keys: Enter opens and picks, arrows move, typing filters, Esc clears then closes; clicks');

    // 5. The pad: the right stick opens, the d-pad moves, A picks, B closes.
    let pressed = [];
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { getGamepads: () => [{ connected: true, axes: [0, 0], buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: pressed.includes(i) })) }] } });
    const tap = (...b) => { pressed = b; ws.pollCreatorPad(); pressed = []; ws.pollCreatorPad(); };
    tap(11);
    assert.strictEqual(cr().pop && cr().pop.kind, 'grid', 'R3 opens the grid');
    tap(15);
    tap(15);
    assert.strictEqual(cr().pop.at, 2);
    tap(1);
    assert.strictEqual(cr().pop, null, 'B closes');
    tap(11); tap(15); tap(15); tap(15);
    tap(0);
    assert.strictEqual(cr().state.slots.fronthair.id, 'Male/FrontHair/03', 'A picks');
    console.log('✓ pad: R3 opens, d-pad moves, A picks, B closes');

    // 6. Thumbnails are per body; tiles come into view lazily; a rescan forgets them.
    made = 0;
    ws.creatorStep('_body', 1);
    assert.strictEqual(cr().state.body, 'Female');
    ws.gridFirstBatch = 2;
    ws.creatorOpenGrid('fronthair');
    assert.strictEqual(made, 2, 'another body: new pictures, the first batch only');
    assert.ok(/data-pending="1"/.test(html()), 'the rest wait');
    ws.creatorFillThumbs();
    assert.strictEqual(made, 4, 'more as the grid scrolls');
    ws.creatorFillThumbs();
    assert.strictEqual(made, 4, 'and none twice');
    // With IntersectionObserver: tiles are watched and drawn when they come into view.
    const watched = [];
    let seen = null;
    global.IntersectionObserver = class { constructor(fn) { seen = fn; } observe(el) { watched.push(el.id); } unobserve() {} disconnect() {} };
    ws.forgetCreatorThumbs('mz');
    made = 0;
    cr().pop = null;
    ws.creatorOpenGrid('fronthair');
    assert.strictEqual(made, 0, 'nothing drawn before it is in view');
    assert.deepStrictEqual(watched, ['dd-cr-tile-1', 'dd-cr-tile-2', 'dd-cr-tile-3', 'dd-cr-tile-4']);
    seen([{ isIntersecting: true, target: stubs['dd-cr-tile-2'] }, { isIntersecting: false, target: stubs['dd-cr-tile-3'] }]);
    assert.strictEqual(made, 0, 'drawn between frames, not in the observer\'s call');
    await new Promise(r => setTimeout(r, 20));
    assert.strictEqual(made, 1, 'one came into view');
    assert.ok(ws._creatorThumbs.has('mz|Female|Female/FrontHair/02'));
    delete global.IntersectionObserver;
    ws.scanMzGenLibrary(gen);
    assert.ok(![...ws._creatorThumbs.keys()].some(k => k.startsWith('mz|')), 'a rescan forgets the kit\'s pictures');
    kit.thumbnail = realThumb;
    ws.closeCreator();
    console.log('✓ thumbnails per body, drawn as they come into view, forgotten on a rescan');

    // 7. LPC: tiles are the library's parts drawn alone, standing, facing down.
    ws.setLpcLibraryFolder(lib);
    ws.scanLpcLibrary();
    ws.setLpcSafeOnly(false);
    ws.openCreator();
    ws.gridFirstBatch = 60;
    let composed = 0;
    const realCompose = ws.composeLpc;
    ws.composeLpc = function(recipe, anim, ...rest) { if (recipe.picks.length === 1) composed++; return realCompose.call(this, recipe, anim, ...rest); };
    ws.creatorOpenGrid('shirt');
    assert.deepStrictEqual(tiles(), ['None', 'Shirt', 'Tunic']);
    assert.strictEqual(composed, 2, 'one picture per part');
    const shirt = ws._creatorThumbs.get('lpc|male|torso/shirt');
    assert.deepStrictEqual([shirt.image.width, shirt.image.height], [24, 20], 'the shirt alone, cut');
    ws.creatorGridPick(2);
    assert.strictEqual(cr().state.slots.shirt.id, 'torso/tunic');
    ws.creatorOpenGrid('shirt');
    assert.strictEqual(composed, 2, 'opened again: nothing drawn again');
    ws.composeLpc = realCompose;
    ws.closeCreator();
    console.log('✓ LPC tiles: the part alone, once each');

    console.log('\nAll grid picker tests passed.');
})().catch(e => { console.error(e); process.exit(1); });
