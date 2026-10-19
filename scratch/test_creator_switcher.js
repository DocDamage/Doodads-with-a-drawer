// scratch/test_creator_switcher.js
// Creators, Part A phase 4 (docs/CREATOR_IMPROVEMENTS_PLAN.md §2.3): the Characters card in a group per library,
// folded as left; the palette's two entries (the card, and the creator used last); the window's library switcher
// keeping the name and each library's character; the export's face slots read from the face sheet; and the
// window under High contrast.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

console.log('=== Testing Character Creator Switcher, Card, Face Slots and Contrast (Part A, phase 4) ===');

const store = {};
let cardEl = null;
const cards = [];
const running = new Set();
const realSetInterval = global.setInterval, realClearInterval = global.clearInterval;
global.setInterval = (fn, ms) => { const t = realSetInterval(fn, ms); running.add(t); if (t.unref) t.unref(); return t; };
global.clearInterval = t => { running.delete(t); realClearInterval(t); };
const timers = () => (DocsDoodads.Workspace._lpcPreviewTimer && running.has(DocsDoodads.Workspace._lpcPreviewTimer) ? 1 : 0);
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
    tagName: tag.toUpperCase(), style: {}, textContent: '', width: 0, height: 0, _html: '', setAttribute() {}, appendChild() {}, getContext: () => ctx2d, toDataURL: () => 'data:image/png;base64,F',
    get innerHTML() { return this._html; },
    set innerHTML(v) { this._html = v; if (this.id === 'dd-creator') for (const k of Object.keys(stubs)) delete stubs[k]; },
    contains: el => Boolean(el && el.id && html().includes(`id="${el.id}"`)), querySelectorAll: () => []
});
global.document = {
    activeElement: null, createElement: makeEl,
    body: { appendChild(n) { if (n.id === 'dd-creator') root = n; if (n.id === 'dd-lpc-card') { cardEl = n; cards.push(n); } if (n.id === 'dd-cr-live') live.push(n); n.parentNode = this; }, removeChild(n) { if (n === root) root = null; if (n === cardEl) cardEl = null; n.parentNode = null; } },
    getElementById: id => (id === 'dd-creator' ? root : id === 'dd-lpc-card' ? cardEl : (html() + (cardEl ? cardEl.innerHTML : '')).includes(`id="${id}"`) ? stub(id) : null),
    querySelector: () => null, querySelectorAll: () => []
};
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: opt => opt === 'test' };
global.PluginManager = { parameters: () => ({}) };
global.$gameMap = { mapId: () => 1, tileWidth: () => 48, tileHeight: () => 48 };
global.$dataDocsDoodads = { 1: [] };

// ---- Fixtures: an LPC library (male and female bodies, two shirts, two hats, two hairs), an MZ folder ----
const fixture = path.join(__dirname, 'creator_switcher_fixture');
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
    // 1. The Characters card: a group per library, in order, each saying how much it has; folded groups stay
    // folded when the card opens again; the LPC try-out doesn't run while its group is folded.
    ws.setLpcLibraryFolder(lib);
    ws.scanLpcLibrary();
    ws.setLpcSafeOnly(false);
    let card = null;
    ws.showLpcCard();
    card = cards[cards.length - 1];
    const order = ['id="dd-chars-mz"', 'id="dd-chars-lpc"', 'id="dd-chars-memao"'].map(id => card.innerHTML.indexOf(id));
    assert.ok(order.every(i => i >= 0) && order[0] < order[1] && order[1] < order[2], 'MZ, LPC, Memao');
    assert.ok(/id="dd-chars-lpc" open>[\s\S]*?The LPC character library<\/span><span class="dd-chars-status">8 parts<\/span>/.test(card.innerHTML), 'the LPC group, open, with its parts');
    assert.ok(/id="dd-chars-mz" open>[\s\S]*?not scanned/.test(card.innerHTML), 'MZ not scanned yet');
    assert.ok(timers() > 0, 'the try-out runs while its group is open');
    // A group drawn open fires a toggle as the page draws it: nothing is saved or drawn again.
    let redraws = 0;
    const realShow = ws.showLpcCard;
    ws.showLpcCard = function(...a) { redraws++; return realShow.apply(this, a); };
    stub('dd-chars-lpc').open = true;
    stub('dd-chars-lpc').ontoggle();
    assert.deepStrictEqual([D.Ui.prefs().charGroups, redraws], [undefined, 0], 'the toggle of a group drawn open changes nothing');
    ws.showLpcCard = realShow;
    stub('dd-chars-lpc').open = false;
    stub('dd-chars-lpc').ontoggle();
    assert.deepStrictEqual(D.Ui.prefs().charGroups, { lpc: false }, 'kept on this computer');
    assert.strictEqual(timers(), 0, 'folded: the try-out stops');
    ws.closeLpcCard();
    ws.showLpcCard();
    card = cards[cards.length - 1];
    assert.ok(/id="dd-chars-lpc">/.test(card.innerHTML) && !/id="dd-chars-lpc" open/.test(card.innerHTML), 'still folded next time');
    assert.strictEqual(timers(), 0, 'and the try-out doesn\'t start');
    stub('dd-chars-lpc').open = true;
    stub('dd-chars-lpc').ontoggle();
    ws.closeLpcCard();
    console.log('✓ Characters card: a group per library, folded as left');

    // 2. The palette has two entries: the card, and the creator of the library used last.
    ws.mapEntries = () => [];
    const labels = ws.paletteCommands().map(c => c.label).filter(l => /Charact/.test(l));
    assert.deepStrictEqual(labels.filter(l => !/CREDITS/.test(l)), ['Characters (MZ, LPC and Memao libraries)', 'Character Creator...']);
    assert.strictEqual(ws.lastCreatorKit(), 'lpc', 'only LPC is scanned');
    ws.setMzGenLibraryFolder(gen);
    ws.scanMzGenLibrary(gen);
    assert.strictEqual(ws.lastCreatorKit(), 'mz', 'nothing opened yet: the first scanned, in the card\'s order');
    ws.openCreator(null, 'lpc');
    assert.strictEqual(D.Ui.prefs().creatorKit, 'lpc', 'the creator opened is remembered');
    assert.strictEqual(ws.lastCreatorKit(), 'lpc');
    ws.closeCreator();
    ws.paletteCommands().find(c => c.label === 'Character Creator...').run();
    assert.strictEqual(cr().kit, 'lpc', 'Character Creator... opens it again');
    console.log('✓ palette: Characters and Character Creator... (the last one)');

    // 3. The switcher: the libraries scanned; another keeps the name; coming back finds its character.
    assert.ok(/<select class="dd-cr-kit" id="dd-cr-kit" aria-label="Library"[^>]*><option value="mz">RPG Maker MZ<\/option><option value="lpc" selected>LPC<\/option><\/select>/.test(html()), 'MZ and LPC (Memao isn\'t scanned)');
    cr().name = 'Robin';
    cr().state.slots.shirt = { id: 'torso/shirt', colour: 'blue' };
    const lpcState = JSON.stringify(cr().state);
    stub('dd-cr-kit').onchange({ target: { value: 'mz' } });
    assert.deepStrictEqual([cr().kit, cr().name], ['mz', 'Robin'], 'MZ, with the name kept');
    assert.ok(html().includes('MZ Character Creator') && /<option value="mz" selected>/.test(html()));
    assert.strictEqual(said(), 'MZ Character Creator');
    cr().state.slots.clothing = { id: 'Male/Clothing/03' };
    stub('dd-cr-kit').onchange({ target: { value: 'lpc' } });
    assert.strictEqual(JSON.stringify(cr().state), lpcState, 'back to LPC: the LPC character as it was');
    stub('dd-cr-kit').onchange({ target: { value: 'mz' } });
    assert.strictEqual(cr().state.slots.clothing.id, 'Male/Clothing/03', 'and the MZ one as it was');
    assert.strictEqual(D.Ui.prefs().creatorKit, 'mz');
    ws.closeCreator();
    // One library scanned: no switcher.
    const realMz = D.CreatorKits.mz.index;
    D.CreatorKits.mz.index = () => null;
    ws.openCreator(null, 'lpc');
    assert.ok(!html().includes('id="dd-cr-kit"'), 'no switcher with one library');
    assert.strictEqual(ws.lastCreatorKit(), 'lpc', 'the last one gone: another that is there');
    D.CreatorKits.mz.index = realMz;
    console.log('✓ switcher: another library, name kept, each character kept');

    // 4. Face slots in the export: the face sheet's eight faces, empty ones numbered, the chosen one checked.
    cr().name = 'Robin';
    const E = D.LpcExport, F = E.faceSize;
    const faceSheet = E.blank(F * 4, F * 2);
    for (const slot of [0, 5]) { const x = (slot % 4) * F + 50, y = Math.floor(slot / 4) * F + 60; faceSheet.data[(y * faceSheet.width + x) * 4 + 3] = 255; }
    ws.writeLpcPng('img/faces/Robin.png', faceSheet);
    cr().exportOptions = Object.assign(ws.creatorKit().exportDefaults(ws), { faceSlot: 2 });
    cr().pop = { kind: 'export' };
    ws.renderCreator();
    const slots = Array.from(html().matchAll(/id="dd-cr-ex-slot-(\d)" role="radio" aria-checked="(true|false)" aria-label="([^"]*)"[^>]*>(<img|<span>)/g)).map(m => [Number(m[1]), m[2] === 'true', m[4] === '<img']);
    assert.deepStrictEqual(slots, [[0, false, true], [1, false, false], [2, true, false], [3, false, false], [4, false, false], [5, false, true], [6, false, false], [7, false, false]],
        'faces 1 and 6 are pictures, slot 3 is chosen');
    assert.ok(html().includes('aria-label="Slot 1 (a face is there, it will be replaced)"') && html().includes('aria-label="Slot 2, empty"'));
    click('dd-cr-ex-slot-5');
    assert.strictEqual(cr().exportOptions.faceSlot, 5);
    assert.ok(/id="dd-cr-ex-slot-5" role="radio" aria-checked="true"/.test(html()));
    assert.strictEqual(said(), 'Face slot 6');
    let reads = 0;
    const realRead = ws.readLpcPng;
    ws.readLpcPng = function(...a) { reads++; return realRead.apply(this, a); };
    ws.renderCreator();
    assert.strictEqual(reads, 0, 'the sheet is read again only when it changes');
    await new Promise(r => setTimeout(r, 20));
    faceSheet.data[((F + 60) * faceSheet.width + 3 * F + 50) * 4 + 3] = 255; // a face in slot 8
    ws.writeLpcPng('img/faces/Robin.png', faceSheet);
    fs.utimesSync('img/faces/Robin.png', new Date(), new Date(Date.now() + 5000));
    ws.renderCreator();
    assert.strictEqual(reads, 1, 'changed: read again');
    assert.ok(/id="dd-cr-ex-slot-7" role="radio" aria-checked="false" aria-label="Slot 8 \(a face is there/.test(html()));
    ws.readLpcPng = realRead;
    ws.closeCreator();
    console.log('✓ face slots: the sheet\'s faces, the chosen one, read again when it changes');

    // 5. High contrast: the window in the theme's black on white (its --dd-text and --dd-panel) with 3-pixel
    // borders; its focus ring stays yellow.
    const css = D.Ui.styleText();
    assert.ok(/:root\[data-dd-theme="contrast"\] #dd-creator \.dd-cr \{ background: var\(--dd-panel\); background-image: none; color: var\(--dd-text\); border: 3px solid var\(--dd-text\);/.test(css));
    assert.ok(/:root\[data-dd-theme="contrast"\] #dd-creator \.dd-cr-tab\[aria-selected="true"\][^{]*\{ background: var\(--dd-text\); color: var\(--dd-panel\); border: 3px solid var\(--dd-text\);/.test(css), 'what is chosen is white on black');
    const contrastRules = css.split('}').filter(r => r.includes('[data-dd-theme="contrast"] #dd-creator'));
    assert.ok(contrastRules.every(r => !/outline/.test(r)), 'the yellow focus ring is not overridden');
    console.log('✓ High contrast: black on white, 3-pixel borders, the focus ring kept');

    console.log('\nAll switcher, card, face slot and contrast tests passed.');
})().catch(e => { console.error(e); process.exit(1); });
