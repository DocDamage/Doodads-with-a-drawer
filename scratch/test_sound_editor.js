// scratch/test_sound_editor.js
// Editor controls for sound: a doodad's Sound section, the project-wide Spatial Sound settings, and
// the map's echo and region background sounds (all undoable).
const assert = require('assert');

console.log("=== Testing Sound Editor ===");

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
global.$gameMap = { mapId: () => 1, displayX: () => 0, displayY: () => 0, tileWidth: () => 48, tileHeight: () => 48 };
global.$dataDocsDoodads = { 1: [] };

require('../Docs-Doodads.js');
const ws = DocsDoodads.Workspace;
const Undo = DocsDoodads.Undo;
ws.showToast = () => {};
ws.refreshSpriteset = () => {};
DocsDoodads.AssetIndex.data.assets = {
    'audio/bgs/River.ogg': { id: 'audio/bgs/River.ogg', path: 'audio/bgs/River.ogg', fileName: 'River.ogg' },
    'audio/se/Bird1.ogg': { id: 'audio/se/Bird1.ogg', path: 'audio/se/Bird1.ogg', fileName: 'Bird1.ogg' },
    'img/doodads/tree.png': { id: 'img/doodads/tree.png', path: 'img/doodads/tree.png', fileName: 'tree.png' }
};

// 1. Doodad Sound section: a file picker over background sounds and sound effects.
const keys = ws.effectSections().reduce((all, s) => all.concat(s.fields.map(f => f.key)), []);
for (const key of ['sound.file', 'sound.volume', 'sound.pitch', 'sound.radius', 'sound.every']) assert.ok(keys.includes(key), `inspector edits ${key}`);
const fileField = ws.effectSections().find(s => s.title === 'Sound').fields.find(f => f.key === 'sound.file');
assert.deepStrictEqual(fileField.options.map(o => o.value), ['', 'bgs/River', 'se/Bird1']);
const fountain = Object.assign(DocsDoodads.standardStruct(), { x: 10, y: 10 });
$dataDocsDoodads[1] = [fountain];
ws.setDoodadProperty([fountain], 'sound.file', 'bgs/River');
assert.strictEqual(fountain.sound.file, 'bgs/River');
assert.strictEqual(fountain.sound.radius, DocsDoodads.SpatialSound.emitterDefaults.radius);
ws.setDoodadProperty([fountain], 'sound.file', '');
assert.strictEqual(fountain.sound, undefined, "None removes the sound");
Undo.undo();
assert.strictEqual(fountain.sound.file, 'bgs/River');

// 2. Project-wide settings.
ws.setWorldSetting('sound.mode', 'tagged');
assert.strictEqual(DocsDoodads.World.get('sound.mode'), 'tagged');
assert.strictEqual(DocsDoodads.World.get('sound.far'), DocsDoodads.SpatialSound.defaults.far);
Undo.undo();

// 3. The map's echo and region sounds.
ws.setMapSetting('echo', { enabled: true, delay: 0.2, feedback: 0.4, mix: 0.3 });
assert.deepStrictEqual(DocsDoodads.SpatialSound.echoFor(DocsDoodads.Lighting.mapSettings(1)), { delay: 0.2, feedback: 0.4, mix: 0.3 });
ws.addRegionSound();
ws.setRegionSoundField(0, 'regionId', 4);
ws.setRegionSoundField(0, 'name', 'River');
assert.deepStrictEqual(DocsDoodads.Lighting.mapSettings(1).regionSounds, [{ regionId: 4, name: 'River', volume: 90, pitch: 100, fade: 1 }]);
ws.removeRegionSound(0);
assert.deepStrictEqual(DocsDoodads.Lighting.mapSettings(1).regionSounds, []);
for (let i = 0; i < 5; i++) Undo.undo();
assert.strictEqual(DocsDoodads.Lighting.mapSettings(1), null, "every map sound change undoes");

// 4. Panels.
ws.selectDoodads([]);
ws.selectedAsset = null;
ws.refreshInspector();
const html = el('dd-inspector-content').innerHTML;
assert.ok(html.includes('>Spatial Sound<'), "world section");
assert.ok(html.includes('>Sound (this map)<') && html.includes('dd-map-echo') && html.includes('dd-region-add'), "map echo and region sounds");

console.log("✓ Doodad sound fields, spatial settings, map echo and region sounds verified.");
