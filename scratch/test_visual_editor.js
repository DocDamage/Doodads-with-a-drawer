// scratch/test_visual_editor.js
// The map panel's Visual Equipment section (settings, try-on preview, notetag builder) and its
// Destination Marker section.
const assert = require('assert');

console.log("=== Testing Visual Equipment & Destination Editor ===");

const elements = {};
function el(id) {
    if (!elements[id]) elements[id] = { id, value: '', checked: false, innerHTML: '', textContent: '', style: {}, onclick: null, onchange: null, oninput: null,
        classList: { toggle() {}, add() {}, remove() {} }, appendChild() {}, querySelectorAll: () => [], addEventListener() {} };
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
global.PluginManager = { parameters: () => ({}) };
global.$gameMap = { mapId: () => 1, displayX: () => 0, displayY: () => 0, tileWidth: () => 48, tileHeight: () => 48, width: () => 20, height: () => 15 };
global.$dataDocsDoodads = { 1: [] };
global.$dataActors = [null,
    { id: 1, name: 'Reid', classId: 1, characterName: 'Actor1', characterIndex: 0, equips: [1, 0, 2, 0, 0],
        note: '<visual alias: M>\n<visual base: Hair_Short, part hair, z 2>' },
    { id: 2, name: 'Priscilla', classId: 2, characterName: 'Actor1', characterIndex: 1, equips: [0, 0, 0, 0, 0], note: '<visual alias: F>' }];
global.$dataClasses = [null, { id: 1, name: 'Hero', note: '' }, { id: 2, name: 'Mage', note: '<visual: Robe_{alias}, part body>' }];
global.$dataWeapons = [null, { id: 1, name: 'Sword', note: '<visual: Sword, z 3>' }, { id: 2, name: 'Stick', note: '' }];
global.$dataArmors = [null, { id: 1, name: 'Cap', note: '' }, { id: 2, name: 'Iron Helm', note: '<visual: Helm_{alias}, part helmet, z 4>\n<visual hide: hair>' },
    { id: 3, name: 'Cape', note: '<visual: Cape, z -1>' }];

require('../Docs-Doodads.js');
const ws = DocsDoodads.Workspace;
ws.showToast = () => {};
ws.refreshSpriteset = () => {};

// 1. Settings in the map panel.
const sections = ws.worldSections();
const titles = sections.map(s => s.title);
assert.ok(titles.includes('Visual Equipment') && titles.includes('Destination Marker'));
const keys = sections.reduce((all, s) => all.concat(s.fields.map(f => f.key)), []);
for (const key of ['visualEquip.enabled', 'visualEquip.followers', 'visualEquip.events', 'visualEquip.battlers', 'visualEquip.menus', 'visualEquip.equipPreview',
    'destination.style', 'destination.color', 'destination.pulse', 'destination.spin', 'destination.layer', 'destination.image', 'destination.animationId', 'destination.vfx', 'destination.pathDots']) {
    assert.ok(keys.includes(key), `panel has ${key}`);
}
assert.strictEqual(DocsDoodads.World.get('visualEquip.enabled'), true, "on by default");
assert.strictEqual(DocsDoodads.World.get('destination.style'), 'default', "MZ's marker by default");
ws.setWorldSetting('destination.style', 'ring');
assert.strictEqual(DocsDoodads.Destination.current().style, 'ring');
DocsDoodads.Undo.undo();
assert.strictEqual(DocsDoodads.Destination.current().style, 'default', "undoable");

// 2. Try-on: items with <visual> tags, what an actor starts with, and the resulting layers.
assert.deepStrictEqual(ws.visualItems().map(i => i.key), ['w1', 'a2', 'a3']);
assert.deepStrictEqual(ws.visualWornKeys(1), ['w1', 'a2'], "Reid starts with the sword and the helm");
assert.deepStrictEqual(ws.visualTryOnLayers(1, ['w1', 'a2']).map(l => l.image), ['Sword', 'Helm_M'], "the helm hides the hair");
assert.deepStrictEqual(ws.visualTryOnLayers(1, ['a3']).map(l => l.image), ['Cape', 'Hair_Short']);
assert.deepStrictEqual(ws.visualTryOnLayers(2, []).map(l => l.image), ['Robe_F'], "class notes count, with the actor's alias");
const html = ws.renderVisualTryOn();
assert.ok(html.includes('dd-ve-canvas') && html.includes('Iron Helm') && html.includes('Priscilla'));

// 3. Notetag builder.
assert.strictEqual(ws.visualNotetag({ image: 'Cape_Red', z: '-1', part: 'cape', hide: '', sv: '' }), '<visual: Cape_Red, z -1, part cape>');
assert.strictEqual(ws.visualNotetag({ image: 'Helm', z: '1', part: 'helmet', hide: 'hair, ears', sv: 'SV_Helm' }), '<visual: Helm, part helmet, sv SV_Helm>\n<visual hide: hair, ears>');
assert.strictEqual(ws.visualNotetag({ image: '' }), '');
// What the builder writes reads back the same.
const parsed = DocsDoodads.VisualEquip.parseNote(ws.visualNotetag({ image: 'Cape_Red', z: '-1', part: 'cape' }));
assert.deepStrictEqual([parsed.layers[0].image, parsed.layers[0].z, parsed.layers[0].part], ['Cape_Red', -1, 'cape']);

// 4. Mid-game marker changes (Set Destination Marker) sit on top of the project's settings.
global.$gameSystem = { _docsDestination: { color: '#ff0000' } };
ws.setWorldSetting('destination.style', 'circle');
const now = DocsDoodads.Destination.current();
assert.deepStrictEqual([now.style, now.color], ['circle', '#ff0000']);
global.$gameSystem._docsDestination = null;
assert.strictEqual(DocsDoodads.Destination.current().color, '#ffffff');

console.log("✓ Panel settings, defaults, undo, try-on items and layers, notetag builder and mid-game marker changes verified.");
