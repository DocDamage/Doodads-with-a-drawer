// scratch/test_lpc_creator.js
// The Character Creator window, phase 3: opening (and asking for a scan first), the two cards with tabs
// and ◀ ▶ rows, the body type, colours and the palette, the stage (animations, turning, a drawn frame and
// the warning for parts without an animation), Show body, the dice, saving / loading / deleting
// characters, credits, the keyboard and a gamepad, the small-window layout, and closing.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

console.log('=== Testing LPC Character Creator ===');

// A fake page: any element asked for by id exists once the window's HTML names it.
const store = {};
let root = null;
const stubs = {};
const drawn = [];
const ctx2d = { createImageData: (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }), putImageData() {},
    drawImage: (...a) => drawn.push(a.length), clearRect() {}, imageSmoothingEnabled: true };
global.window = global;
global.innerWidth = 1400;
const listeners = {};
global.window.addEventListener = (type, fn) => { listeners[type] = fn; };
global.window.removeEventListener = (type, fn) => { if (listeners[type] === fn) delete listeners[type]; };
global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
global.document = {
    createElement: tag => ({ tagName: tag.toUpperCase(), style: {}, innerHTML: '', setAttribute() {}, appendChild() {}, getContext: () => ctx2d, width: 0, height: 0 }),
    body: { appendChild(n) { if (n.id === 'dd-creator') root = n; n.parentNode = this; }, removeChild(n) { if (n === root) root = null; } },
    getElementById: id => {
        if (id === 'dd-creator') return root;
        if (!root || !root.innerHTML.includes(`id="${id}"`)) return null;
        if (!stubs[id]) stubs[id] = { id, getContext: () => ctx2d, width: 256, height: 256 };
        return stubs[id];
    },
    querySelector: () => null,
    querySelectorAll: () => []
};
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: opt => opt === 'test' };
global.PluginManager = { parameters: () => ({}) };
global.$gameMap = { mapId: () => 1, tileWidth: () => 48, tileHeight: () => 48 };
global.$dataDocsDoodads = { 1: [] };

const fixture = path.join(__dirname, 'lpc_creator_fixture');
fs.rmSync(fixture, { recursive: true, force: true });
const project = path.join(fixture, 'project'), lib = path.join(fixture, 'library');
const write = (base, rel, data) => { const f = path.join(base, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, typeof data === 'string' || Buffer.isBuffer(data) ? data : JSON.stringify(data)); };
const { encodePng } = require('../scripts/png');
const sheet = rgba => { const d = new Uint8Array(576 * 256 * 4); for (let i = 0; i < 576 * 256; i++) d.set(rgba, i * 4); return encodePng(576, 256, d, b => zlib.deflateSync(b)); };
const cc0 = file => [{ file, licenses: ['CC0'], authors: ['Ann'] }];
write(lib, 'sheet_definitions/body/body.json', { name: 'Body Color', type_name: 'body', match_body_color: true, recolors: { material: 'body' }, layer_1: { zPos: 10, male: 'body/m/', female: 'body/f/' }, credits: cc0('body') });
write(lib, 'sheet_definitions/head/human_male.json', { name: 'Human Male', type_name: 'head', match_body_color: true, recolors: { color_1: { material: 'body' } }, layer_1: { zPos: 100, male: 'head/m/', female: 'head/m/' }, credits: cc0('head') });
write(lib, 'sheet_definitions/torso/shirt.json', { name: 'Shirt', type_name: 'clothes', recolors: { material: 'cloth' }, layer_1: { zPos: 35, male: 'torso/shirt/' }, credits: [{ file: 'torso', licenses: ['CC-BY-SA 3.0'], authors: ['Bo'] }] });
write(lib, 'sheet_definitions/torso/robe.json', { name: 'Robe', type_name: 'clothes', variants: ['red'], layer_1: { zPos: 35, male: 'torso/robe/' }, credits: cc0('torso/robe') });
write(lib, 'palette_definitions/body/meta_body.json', { default: 'ulpc', base: 'light' });
write(lib, 'palette_definitions/body/body_ulpc.json', { light: ['#271920'], olive: ['#442725'] });
write(lib, 'palette_definitions/cloth/meta_cloth.json', { default: 'ulpc', base: 'white' });
write(lib, 'palette_definitions/cloth/cloth_ulpc.json', { white: ['#fefefe'], blue: ['#0000fe'], red: ['#fe0000'] });
write(lib, 'spritesheets/body/m/walk.png', sheet([0x27, 0x19, 0x20, 255]));
write(lib, 'spritesheets/body/f/walk.png', sheet([0x27, 0x19, 0x20, 255]));
write(lib, 'spritesheets/head/m/walk.png', sheet([0, 0, 0, 0]));
write(lib, 'spritesheets/body/m/slash.png', sheet([0x27, 0x19, 0x20, 255]));
write(lib, 'spritesheets/torso/shirt/walk.png', sheet([0xfe, 0xfe, 0xfe, 255]));
write(lib, 'spritesheets/torso/robe/walk/red.png', sheet([200, 0, 0, 255]));
fs.mkdirSync(path.join(project, 'data'), { recursive: true });
process.on('exit', () => { process.chdir(__dirname); fs.rmSync(fixture, { recursive: true, force: true }); });
process.chdir(project);

require('../Docs-Doodads.js');
const D = DocsDoodads, ws = D.Workspace, S = D.LpcSlots;
const toasts = [];
ws.showToast = (text, kind) => toasts.push([kind, text]);
ws.mounted = true;
const sounds = [];
D.Ui.sound = kind => sounds.push(kind);
const click = id => { const el = document.getElementById(id); assert.ok(el && el.onclick, 'no button ' + id); return el.onclick({ target: el, preventDefault() {} }); };
const html = () => root.innerHTML;
const cr = () => ws._creator;

(async () => {
    // 1. Without a scan it says so and opens the Characters card instead.
    assert.strictEqual(ws.openCreator(), null);
    assert.ok(/Scan the LPC library first/.test(toasts.pop()[1]));
    ws.closeLpcCard();
    ws.setLpcLibraryFolder(lib);
    ws.scanLpcLibrary();

    // 2. Opens with a body and head; both cards, their tabs and rows; the stage draws a frame.
    ws.openCreator();
    assert.ok(root && ws.creatorOpen());
    assert.strictEqual(cr().state.slots.head.id, 'head/human_male');
    for (const text of ['Character Creator', 'Body type', 'Skin', 'id="dd-cr-tab-body-0"', 'id="dd-cr-tab-outfit-3"', 'Shuffle the body', 'id="dd-cr-anim-spellcast"', 'Show body', 'Export to RPG Maker']) assert.ok(html().includes(text), text);
    assert.ok(/id="dd-cr-export" disabled/.test(html()), 'export comes in the next version');
    assert.ok(/LPC library · 3 parts/.test(html()), 'safe parts only: the CC-BY-SA shirt is not counted');
    assert.ok(drawn.includes(9), 'a frame drawn on the stage');
    assert.strictEqual(sounds.pop(), 'ok');
    assert.ok(listeners.keydown, 'keys are listened for');
    console.log('✓ opens: cards, tabs, rows, stage');

    // 3. Rows: the body type, parts with None, colours and the palette.
    click('dd-cr-_body-next');
    assert.strictEqual(cr().state.body, 'female');
    assert.ok(/<span>Female<\/span>/.test(html()));
    click('dd-cr-_body-prev');
    assert.strictEqual(cr().state.body, 'male');
    click('dd-cr-tab-outfit-1');
    assert.ok(html().includes('id="dd-cr-shirt-next"'), 'the outfit Body tab shows the shirt row');
    assert.ok(/<span>None<\/span>/.test(html()));
    click('dd-cr-shirt-next');
    assert.strictEqual(cr().state.slots.shirt.id, 'torso/robe', 'only safe parts: the robe');
    assert.strictEqual(cr().state.slots.shirt.colour, 'red');
    assert.ok(html().includes('id="dd-cr-shirt-colour"'), 'a swatch for its colour');
    ws.setLpcSafeOnly(false);
    click('dd-cr-shirt-next');
    assert.strictEqual(cr().state.slots.shirt.id, 'torso/shirt', 'every part when the setting is off');
    assert.ok(/Credits · 2 artists · 1 not safe to encrypt/.test(html()), 'credits count the artists and unsafe art');
    click('dd-cr-shirt-colour');
    assert.strictEqual(cr().pop.kind, 'palette');
    assert.ok(/Shirt colour/.test(html()));
    click('dd-cr-pal-1');
    assert.strictEqual(cr().state.slots.shirt.colour, 'blue');
    assert.strictEqual(cr().pop, null, 'picking a colour closes the palette');
    stubs['dd-cr-shirt-colour'].oncontextmenu({ preventDefault() {} });
    assert.strictEqual(cr().state.slots.shirt.colour, 'white', 'right-click: the colour before');
    console.log('✓ rows: body type, parts, None, colours, palette');

    // 4. The stage: animations (and parts without them), turning, Show body, the dice.
    click('dd-cr-anim-slash');
    assert.strictEqual(cr().anim, 'slash');
    assert.ok(/2 parts have no slash: Human Male, Shirt/.test(html()), 'says which parts have no slash');
    click('dd-cr-anim-walk');
    click('dd-cr-turn-right');
    assert.strictEqual(cr().dir, 'left');
    click('dd-cr-turn-left');
    assert.strictEqual(cr().dir, 'down');
    stubs['dd-cr-showbody'].onchange({ target: { checked: false } });
    assert.deepStrictEqual(ws.creatorRecipe().picks.map(p => p.id), ['torso/shirt'], 'Show body off: only the outfit');
    stubs['dd-cr-showbody'].onchange({ target: { checked: true } });
    stubs['dd-cr-shadow'].onchange({ target: { checked: false } });
    assert.ok(!html().includes('dd-cr-shadow"></div>'), 'no shadow');
    const realRandom = Math.random;
    Math.random = () => 0.01; // every optional slot gets something
    click('dd-cr-dice-outfit');
    assert.ok(cr().state.slots.shirt, 'the outfit dice dressed the character');
    click('dd-cr-dice-body');
    Math.random = realRandom;
    assert.ok(cr().state.slots.body && cr().state.slots.head, 'the body dice keep a body and a head');
    console.log('✓ stage: animations, turning, Show body, shadow, dice');

    // 5. Saving, loading and deleting characters.
    D.Ui.prompt = async () => 'Robin';
    D.Ui.confirm = async () => true;
    assert.strictEqual(await ws.creatorSave(), true);
    assert.strictEqual(cr().name, 'Robin');
    const saved = JSON.stringify(cr().state);
    assert.ok(fs.existsSync(path.join(project, 'data/DocsDoodadsCharacters.json')));
    click('dd-cr-dice-outfit');
    click('dd-cr-dice-body');
    click('dd-cr-load');
    assert.ok(/Saved characters/.test(html()) && /Robin/.test(html()));
    click('dd-cr-load-0');
    assert.strictEqual(JSON.stringify(cr().state), saved, 'loaded back');
    ws.setLpcSafeOnly(true);
    cr().state.slots.shirt = { id: 'torso/shirt', colour: 'white' };
    await ws.creatorSave();
    ws.creatorLoad('Robin');
    assert.ok(/Some parts aren't offered now \(Shirt\)/.test(toasts.pop()[1]), 'parts no longer offered are named');
    click('dd-cr-load');
    await stubs['dd-cr-del-0'].onclick();
    assert.deepStrictEqual(S.validSaved(ws.readCreatorSaved()).characters, []);
    click('dd-cr-credits');
    assert.ok(/Who made this art/.test(html()) && /by Ann/.test(html()));
    console.log('✓ saving, loading, deleting; credits');

    // 6. Keyboard: rows, values, colours, tabs, cards, dice; typing in the name is left alone; others stop.
    const key = (k, extra = {}) => { const ev = Object.assign({ key: k, target: { tagName: 'DIV' }, stopped: false, prevented: false, preventDefault() { this.prevented = true; }, stopPropagation() { this.stopped = true; } }, extra); listeners.keydown(ev); return ev; };
    cr().state = S.setBody(cr().state, ws.lpcIndex(), 'male', true);
    cr().cursor = { card: 'body', row: 0 };
    cr().tabs.body = 0;
    ws.renderCreator();
    assert.strictEqual(key('Escape').prevented, true);
    assert.strictEqual(cr().pop, null, 'Esc closes a popover first');
    key('ArrowRight');
    assert.strictEqual(cr().state.body, 'female', '→ on the body type');
    key('ArrowLeft');
    key('ArrowDown');
    assert.strictEqual(cr().cursor.row, 1);
    assert.ok(/dd-cr-row dd-cr-cursor[^"]*" id="dd-cr-body-row"/.test(html()), 'the cursor row is marked');
    const skin = cr().state.slots.body.colour;
    key('ArrowRight', { shiftKey: true });
    assert.notStrictEqual(cr().state.slots.body.colour, skin, 'Shift+→ changes the colour');
    key('e');
    assert.strictEqual(cr().tabs.body, 1);
    key('q');
    assert.strictEqual(cr().tabs.body, 0);
    key('Tab');
    assert.strictEqual(cr().cursor.card, 'outfit');
    const typed = key('x', { target: { tagName: 'INPUT', type: 'text' } });
    assert.strictEqual(typed.stopped, false, 'typing a name is not a shortcut');
    assert.strictEqual(key('z').stopped, true, 'other keys stop at the creator');
    D.Ui.dialogOpen = () => true;
    assert.strictEqual(key('ArrowDown').stopped, false, 'a dialog on top gets the keys');
    D.Ui.dialogOpen = () => false;
    console.log('✓ keyboard');

    // 7. Gamepad: a press acts once; a held d-pad repeats after a pause.
    let pressed = [];
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { getGamepads: () => [{ connected: true, axes: [0, 0], buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: pressed.includes(i) })) }] } });
    const tab = cr().tabs.outfit;
    pressed = [5]; ws.pollCreatorPad(); ws.pollCreatorPad(); pressed = []; ws.pollCreatorPad();
    assert.strictEqual(cr().tabs.outfit, (tab + 1) % 4, 'RB: next tab, once');
    cr().cursor.row = 0;
    const realNow = Date.now;
    let now = 1000;
    Date.now = () => now;
    pressed = [13]; ws.pollCreatorPad();
    assert.strictEqual(cr().cursor.row, 1);
    now += 200; ws.pollCreatorPad();
    assert.strictEqual(cr().cursor.row, 1, 'no repeat before the pause');
    now += 300; ws.pollCreatorPad();
    assert.strictEqual(cr().cursor.row, 2, 'repeats when held');
    pressed = []; ws.pollCreatorPad();
    Date.now = realNow;
    pressed = [1]; ws.pollCreatorPad(); pressed = [];
    assert.strictEqual(ws.creatorOpen(), false, 'B closes');
    ws.openCreator();
    console.log('✓ gamepad');

    // 8. A small window shows one card with a switch; closing with the editor.
    global.innerWidth = 816;
    ws.renderCreator();
    assert.ok(html().includes('dd-cr-narrow'));
    assert.ok(/class="dd-cr-card dd-cr-here" id="dd-cr-card-body"|class="dd-cr-card dd-cr-here" id="dd-cr-card-outfit"/.test(html()));
    assert.ok(/dd-cr-hidden" id="dd-cr-card-(body|outfit)"/.test(html()), 'the other card is hidden');
    const card = cr().cursor.card;
    click(`dd-cr-switch-${card}-${card === 'body' ? 'outfit' : 'body'}`);
    assert.notStrictEqual(cr().cursor.card, card, 'the switch shows the other card');
    global.innerWidth = 1400;
    click('dd-cr-close');
    assert.strictEqual(ws.creatorOpen(), false);
    assert.strictEqual(listeners.keydown, undefined, 'stops listening');
    assert.ok(/closeCreator/.test(String(ws.close)), 'closed with the editor');
    console.log('✓ small window, closing');

    console.log('=== LPC character creator passed ===');
})().catch(e => { console.error(e); process.exit(1); });
