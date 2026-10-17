// scratch/test_inspector_followups.js
// Regressions from manual MZ testing: categories for faces/battlers/backgrounds/system,
// hand-written tags, choosing the character on 8-character sheets, and pivot 0 in the slicer.
const assert = require('assert');

console.log("=== Testing Inspector Follow-ups ===");

const elements = {};
function el(id) {
    if (!elements[id]) elements[id] = { id, value: '', style: {}, onchange: null, onclick: null, onkeydown: null, appendChild() {}, querySelectorAll: () => [] };
    return elements[id];
}
global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.document = {
    createElement: () => ({ style: {}, appendChild() {}, removeChild() {}, querySelectorAll: () => [], addEventListener() {}, getContext: () => ({}) }),
    body: { appendChild() {}, removeChild() {} },
    getElementById: (id) => el(id)
};
global.Utils = { RPGMAKER_NAME: "MZ", isNwjs: () => true, isOptionValid: (opt) => opt === "test" };
global.PluginManager = { parameters: () => ({ editKey: "F10", editorMode: "true" }) };

require('../QJ-Doodads.js');
const index = QJ.DD.AssetIndex;
index.save = () => {};

// 1. Categories
const expected = {
    'img/faces/Actor1.png': 'Faces',
    'img/enemies/Slime.png': 'Battlers',
    'img/sv_enemies/Slime.png': 'Battlers',
    'img/sv_actors/Actor1_1.png': 'Battlers',
    'img/battlebacks1/Grassland.png': 'Backgrounds',
    'img/parallaxes/Sky.png': 'Backgrounds',
    'img/titles1/Castle.png': 'Backgrounds',
    'img/system/IconSet.png': 'System',
    'img/characters/Actor1.png': 'Characters',
    'img/animations/Fire.png': 'Other'
};
for (const [file, category] of Object.entries(expected)) {
    assert.strictEqual(index.detectCategory(file), category, file);
}

// 2. Manual tags are normalized, saved on the asset, and searchable with tag:
index.data = { version: 1, assets: {
    'img/pictures/tree.png': { id: 'img/pictures/tree.png', path: 'img/pictures/tree.png', fileName: 'tree.png', category: 'Pictures', type: 'doodad', tags: [], autoTags: ['pictures', 'tree'], favorite: false }
}, collections: {}, settings: {} };
index.rebuildList();
index.setTags('img/pictures/tree.png', ' Forest, prop ,forest,, Big Tree ');
assert.deepStrictEqual(index.data.assets['img/pictures/tree.png'].tags, ['forest', 'prop', 'big tree']);
const parsed = QJ.DD.Search.parseQuery('tag:forest');
assert.ok(QJ.DD.Search.matches(index.data.assets['img/pictures/tree.png'], parsed), "manual tags are searchable");

// 3. Events from an 8-character sheet use the chosen character.
global.$gameMap = { mapId: () => 1, _stagedMapData: { events: [null] } };
const ws = QJ.DD.Workspace;
ws.showToast = () => {};
el('qj-event-template').value = 'npc';
const sheet = { id: 'img/characters/people1.png', path: 'img/characters/People1.png', fileName: 'People1.png', type: 'character_sheet', category: 'Characters', placement: { defaultMode: 'event', characterIndex: 5 }, collision: { preset: 'none' } };
ws.commitPlacement(sheet, { x: 0, y: 0, tileX: 3, tileY: 4 }, 'event');
const created = $gameMap._stagedMapData.events.filter(Boolean)[0];
assert.strictEqual(created.pages[0].image.characterIndex, 5, "inspector choice of character #6 is used");
assert.strictEqual(created.pages[0].image.characterName, 'People1');
// Drag payloads carry the same choice.
ws.commitPlacement({ ...sheet, placement: undefined, placementMode: 'event', characterIndex: 2 }, { x: 0, y: 0, tileX: 5, tileY: 4 }, 'event');
assert.strictEqual($gameMap._stagedMapData.events.filter(Boolean)[1].pages[0].image.characterIndex, 2, "drag payload character index is used");

// 4. Slicer pivots accept 0.
const editor = QJ.DD.Slicing.Editor;
editor.regions = [{ id: 'r', name: 'R', x: 0, y: 0, w: 48, h: 48, pivotX: 0.5, pivotY: 1 }];
editor.selectedRegionIdx = 0;
editor.render = () => {};
editor.updateInspectorValues();
Object.assign(el('qj-insp-rx'), { value: '0' }); Object.assign(el('qj-insp-ry'), { value: '0' });
Object.assign(el('qj-insp-rw'), { value: '48' }); Object.assign(el('qj-insp-rh'), { value: '48' });
Object.assign(el('qj-insp-name'), { value: 'R' });
el('qj-insp-pivx').value = '0';
el('qj-insp-pivy').value = '0';
el('qj-insp-pivy').onchange();
assert.strictEqual(editor.regions[0].pivotX, 0, "Pivot X 0 (left edge) is kept");
assert.strictEqual(editor.regions[0].pivotY, 0, "Pivot Y 0 (top edge) is kept");
el('qj-insp-pivy').value = '';
el('qj-insp-pivy').onchange();
assert.strictEqual(editor.regions[0].pivotY, 1, "an empty pivot falls back to the default");

console.log("✓ Categories, manual tags, character choice, and zero pivots verified.");
