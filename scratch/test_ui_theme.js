// scratch/test_ui_theme.js
// The friendly workspace look: pixel icons (built from art/ui_icons.png), remembered UI choices, little
// sounds, the tool buttons lighting up with a hint for each tool, folding panels, the welcome card, the
// More menu, option cards under their buttons, and the bag opening on Doodads (or Everything).
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== Testing UI Theme ===');

const elements = {};
function classList() {
    const set = new Set();
    return { add: c => set.add(c), remove: c => set.delete(c), contains: c => set.has(c), toggle(c, on) { const want = on === undefined ? !set.has(c) : Boolean(on); if (want) set.add(c); else set.delete(c); return want; }, set };
}
function el(id) {
    if (!elements[id]) elements[id] = { id, value: '', innerHTML: '', textContent: '', title: '', style: {}, classList: classList(), childNodes: [], offsetWidth: 270,
        appendChild(c) { this.childNodes.push(c); return c; }, contains: () => false, querySelectorAll: () => [], addEventListener() {},
        getBoundingClientRect: () => ({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }) };
    return elements[id];
}
global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.innerWidth = 816;
const store = {};
global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
global.document = {
    createElement: tag => ({ tagName: tag, style: {}, childNodes: [], classList: classList(), appendChild(c) { this.childNodes.push(c); }, querySelectorAll: () => [], addEventListener() {} }),
    body: { appendChild() {}, removeChild() {} },
    getElementById: id => el(id),
    querySelectorAll: () => [],
    addEventListener() {}, removeEventListener() {}
};
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: opt => opt === 'test' };
global.PluginManager = { parameters: () => ({}) };
global.$gameMap = { mapId: () => 1, displayX: () => 0, displayY: () => 0, tileWidth: () => 48, tileHeight: () => 48, width: () => 20, height: () => 15 };
global.$dataDocsDoodads = { 1: [] };
const played = [];
global.SoundManager = { playOk: () => played.push('ok'), playCancel: () => played.push('cancel'), playSave: () => played.push('save'), playBuzzer: () => played.push('buzzer'), playCursor: () => played.push('cursor') };

require('../Docs-Doodads.js');
const D = DocsDoodads, U = D.Ui, I = D.UiIcons, ws = D.Workspace;
ws.showToast = () => {};
ws.refreshSpriteset = () => {};

// 1. Icons: built from art/ui_icons.png (16 x 16 cells, in the order of art/ui_icons.json).
const root = path.join(__dirname, '..');
const meta = JSON.parse(fs.readFileSync(path.join(root, 'art', 'ui_icons.json'), 'utf8'));
const png = fs.readFileSync(path.join(root, 'art', 'ui_icons.png'));
assert.deepStrictEqual(I.names, meta.names, 'the plugin has the icons named in art/ui_icons.json');
assert.strictEqual(I.url, 'data:image/png;base64,' + png.toString('base64'), 'and the current art/ui_icons.png (run npm run icons after editing it)');
assert.strictEqual(I.width, png.readUInt32BE(16));
for (const name of ['select', 'stamp', 'brush', 'biome', 'path', 'terrain', 'mirror', 'picker', 'undo', 'redo', 'save', 'done', 'bag', 'more']) {
    assert.ok(I.names.includes(name), 'icon ' + name);
}
const stamp = U.icon('stamp', 2);
assert.ok(/background-position: -32px -0px/.test(stamp) && /width: 32px/.test(stamp), stamp);
const redo = U.icon('redo', 1);
const at = I.names.indexOf('redo');
assert.ok(redo.includes(`-${(at % I.cols) * 16}px -${Math.floor(at / I.cols) * 16}px`), redo);
assert.strictEqual(U.icon('no such icon'), '');
assert.ok(U.styleText().includes('--dd-icons: url(data:image/png;base64,'), 'the stylesheet carries the icon sheet');
console.log('✓ icons: built from the art, placed by name');

// 1b. The editor's rounded font (Nunito) travels inside the plugin with its licence.
const fontMeta = JSON.parse(fs.readFileSync(path.join(root, 'art', 'fonts', 'fonts.json'), 'utf8'));
const F = D.UiFonts;
assert.strictEqual(F.family, fontMeta.family);
for (const file of Object.keys(fontMeta.files)) {
    const data = fs.readFileSync(path.join(root, 'art', 'fonts', file)).toString('base64');
    assert.ok(F.css.includes(data), file + ' is the current file (run npm run fonts after changing art/fonts)');
}
assert.strictEqual((F.css.match(/@font-face/g) || []).length, Object.keys(fontMeta.files).length);
assert.ok(/SIL Open Font License/.test(fs.readFileSync(path.join(root, 'src', '36_ui_fonts.js'), 'utf8')), 'the licence goes with the font');
assert.ok(U.styleText().startsWith('@font-face'), 'the stylesheet starts with the font');
assert.ok(U.css.includes(`--dd-font: '${F.family}'`), 'and uses it first');
console.log('✓ font: built in, with its licence');

// 2. Choices kept on this computer; broken or blocked storage never breaks the editor.
assert.deepStrictEqual(U.prefs(), {});
U.setPref('sounds', false);
assert.strictEqual(U.prefs().sounds, false);
store[U.prefsKey] = '{ broken';
assert.deepStrictEqual(U.prefs(), {}, 'unreadable: nothing remembered');
const realStorage = global.localStorage;
global.localStorage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
assert.deepStrictEqual(U.prefs(), {});
assert.doesNotThrow(() => U.setPref('x', 1));
global.localStorage = realStorage;
delete store[U.prefsKey];
console.log('✓ remembered choices, safely');

// 3. Sounds: the project's own System sounds, unless turned off in More.
U.sound('ok'); U.sound('save'); U.sound('buzzer'); U.sound();
assert.deepStrictEqual(played, ['ok', 'save', 'buzzer', 'cursor']);
U.setPref('sounds', false);
U.sound('ok');
assert.strictEqual(played.length, 4, 'off: silent');
U.setPref('sounds', true);
console.log('✓ sounds');

// 4. Tools: one lights up (none = Select), its card opens, and the hint says what to do.
ws.setPlacementTool('brush');
assert.ok(el('dd-brush-btn').classList.contains('dd-btn-active'));
assert.ok(!el('dd-select-btn').classList.contains('dd-btn-active'));
assert.strictEqual(el('dd-brush-popover').style.display, 'block');
assert.strictEqual(el('dd-status-left').textContent, U.hints.brush);
ws.setPlacementTool('terrain');
assert.ok(el('dd-terrain-btn').classList.contains('dd-btn-active') && !el('dd-brush-btn').classList.contains('dd-btn-active'));
assert.strictEqual(el('dd-brush-popover').style.display, 'none');
assert.strictEqual(el('dd-terrain-popover').style.display, 'block');
ws.setPlacementTool(null);
assert.ok(el('dd-select-btn').classList.contains('dd-btn-active'), 'no tool: Select');
assert.strictEqual(el('dd-status-left').textContent, U.hints.none);
for (const tool of Object.keys(ws.toolButtons)) if (tool !== 'select') assert.ok(U.hints[tool], 'a hint for ' + tool);
console.log('✓ tools light up, cards open, hints follow');

// 5. Option cards sit under their button, inside the window.
el('dd-toolbar').getBoundingClientRect = () => ({ left: 8, top: 8, right: 808, bottom: 72, width: 800, height: 64 });
el('dd-sym-btn').getBoundingClientRect = () => ({ left: 400, top: 12, right: 454, bottom: 66, width: 54, height: 54 });
el('dd-close-btn').getBoundingClientRect = () => ({ left: 760, top: 12, right: 814, bottom: 66, width: 54, height: 54 });
ws.placePopover(el('dd-sym-popover'), 'dd-sym-btn');
assert.deepStrictEqual([el('dd-sym-popover').style.top, el('dd-sym-popover').style.left], ['80px', '292px'], 'centred under the button');
ws.placePopover(el('dd-more-menu'), 'dd-close-btn');
assert.strictEqual(el('dd-more-menu').style.left, '538px', 'kept inside the window');
console.log('✓ option cards under their buttons');

// 6. More: opens with the current grid and sound labels; closes again.
ws.gridSnapShow = true;
ws.showMoreMenu(true);
assert.strictEqual(el('dd-more-menu').style.display, 'block');
assert.strictEqual(el('dd-grid-label').textContent, 'Hide Grid');
assert.strictEqual(el('dd-sound-label').textContent, 'Sounds: On');
assert.ok(el('dd-more-btn').classList.contains('dd-btn-active'));
ws.showMoreMenu(false);
assert.strictEqual(el('dd-more-menu').style.display, 'none');
ws.gridSnapShow = false;
console.log('✓ More menu');

// 7. Folding: the bag and the details fold to a strip, remembered; H folds the details.
ws.foldPanel('drawer', true);
assert.ok(ws.isFolded('drawer') && U.prefs().drawerFolded === true);
assert.strictEqual(el('dd-drawer-resizer').style.display, 'none');
ws.foldPanel('drawer', false);
assert.ok(!ws.isFolded('drawer') && U.prefs().drawerFolded === false);
ws.toggleInspector();
assert.ok(ws.isFolded('inspector'));
ws.toggleInspector();
assert.ok(!ws.isFolded('inspector'));
// Choosing a tab opens a folded bag.
ws.foldPanel('drawer', true);
ws.setCategory('Pictures');
assert.ok(!ws.isFolded('drawer'));
console.log('✓ folding panels');

// 8. The bag opens on Doodads; a project without any opens on Everything.
D.AssetIndex.list = [{ id: 'a', fileName: 'Actor1.png', path: 'img/characters/Actor1.png', category: 'Characters', tags: [], autoTags: [], collections: [] }];
ws._categoryChosen = false;
ws.currentCategory = 'Doodads';
ws.searchQuery = '';
ws.refreshDrawerCards();
assert.strictEqual(ws.currentCategory, 'All');
assert.strictEqual(el('dd-asset-count').textContent, '1 item');
assert.strictEqual(el('dd-drawer-category').textContent, '· Everything');
assert.strictEqual(ws.categoryName('Characters'), 'People');
console.log('✓ the bag opens on Doodads or Everything');

// 9. The details heading names what is shown, with a hint.
ws.selectAsset = ws.selectAsset || (() => {});
ws.selectedAsset = { fileName: 'Oak.png', category: 'Doodads', type: 'image' };
ws.updateInspectorHead();
assert.strictEqual(el('dd-inspector-title').textContent, 'Oak');
assert.ok(/click the map/i.test(el('dd-status-left').textContent));
ws.selectedAsset = null;
ws.selectedDoodads = [{}, {}, {}];
ws.updateInspectorHead();
assert.strictEqual(el('dd-inspector-title').textContent, '3 things');
ws.selectedDoodads = [];
ws.selectedDoodad = null;
global.$dataMapInfos = [null, { name: 'Starting Town' }];
ws.updateInspectorHead();
assert.strictEqual(el('dd-inspector-title').textContent, 'Starting Town');
console.log('✓ details heading and hints');

// 10. The welcome card: shown until "Got it!".
ws.container = { appendChild() {} };
ws.showWelcome();
assert.ok(typeof el('dd-welcome-ok').onclick === 'function');
el('dd-welcome-ok').onclick();
assert.strictEqual(U.prefs().welcomed, true);
console.log('✓ welcome card');

console.log('=== UI theme passed ===');
