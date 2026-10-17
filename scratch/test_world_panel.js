// scratch/test_world_panel.js
// Editor controls for the world: project-wide settings and per-map day/night rules (all undoable),
// the season table, the doodad Atmosphere section, and recovery snapshots that keep world settings.
const assert = require('assert');

console.log("=== Testing World Panel ===");

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
const World = DocsDoodads.World;
ws.showToast = () => {};
ws.refreshSpriteset = () => {};

// 1. World settings are undoable and mark the doodads file as changed.
DocsDoodads.Persistence.dirtyDoodads = false;
ws.setWorldSetting('characterShadows.enabled', true);
assert.strictEqual(World.get('characterShadows.enabled'), true);
assert.strictEqual(DocsDoodads.Persistence.dirtyDoodads, true);
ws.setWorldSetting('time.source', 'clock');
Undo.undo();
assert.strictEqual(World.get('time.source'), 'off');
Undo.undo();
assert.strictEqual(World.get('characterShadows.enabled'), false);
assert.strictEqual($dataDocsDoodads.world, undefined, "undoing every change leaves no world block behind");
Undo.redo();
assert.strictEqual(World.get('characterShadows.enabled'), true);

// Whole values (the keyframe table) go through the same path.
const keys = [{ hour: 6, darkness: 0.2, color: '#203040' }, { hour: 20, darkness: 0.7, color: '#000010' }];
ws.setWorldSetting('time.keyframes', keys);
keys[0].hour = 99;
assert.strictEqual(World.get('time.keyframes')[0].hour, 6, "the stored table is a copy");
Undo.undo();
assert.deepStrictEqual(World.get('time.keyframes'), World.defaults.time.keyframes);

// 2. Per-map day/night rule.
ws.setMapSetting('dayNight', 'off');
assert.strictEqual(DocsDoodads.Lighting.mapSettings(1).dayNight, 'off');
ws.setMapSetting('reflections', false);
Undo.undo();
Undo.undo();
assert.strictEqual(DocsDoodads.Lighting.mapSettings(1), null);

// 3. The season table: rows of art, one cell per season.
ws.addSeasonSet();
ws.setSeasonCell(0, 2, 'img/doodads/oak_autumn.png');
ws.setSeasonCell(0, 1, 'img/doodads/oak.png');
assert.deepStrictEqual(World.get('seasons.sets'), [{ 1: 'img/doodads/oak.png', 2: 'img/doodads/oak_autumn.png' }]);
ws.setSeasonCell(0, 2, '');
assert.deepStrictEqual(World.get('seasons.sets'), [{ 1: 'img/doodads/oak.png' }], "clearing a cell removes it");
Undo.undo();
assert.strictEqual(World.get('seasons.sets')[0][2], 'img/doodads/oak_autumn.png');
ws.removeSeasonSet(0);
assert.deepStrictEqual(World.get('seasons.sets'), []);

// 4. The map panel (nothing selected) shows the world sections.
ws.selectDoodads([]);
ws.selectedAsset = null;
ws.refreshInspector();
let html = el('dd-inspector-content').innerHTML;
for (const section of ['Day and Night', 'Sun and Shadows', 'Seasons', 'Water Reflections', 'See-Through', 'Motion Blur']) {
    assert.ok(html.includes(`>${section}<`), `map panel has ${section}`);
}
assert.ok(html.includes('dd-map-daynight'), "the map's own day/night rule is offered");

// 5. Doodad inspector: atmosphere options, season checkboxes, lamps and sun-following shadows.
const a = Object.assign(DocsDoodads.standardStruct(), { x: 10, y: 10 });
$dataDocsDoodads[1] = [a];
ws.selectDoodads([a]);
ws.refreshInspector();
html = el('dd-inspector-content').innerHTML;
assert.ok(html.includes('>Atmosphere<'));
const keysShown = ws.effectSections().reduce((all, s) => all.concat(s.fields.map(f => f.key)), []);
for (const key of ['light.when', 'shadow.followSun', 'seeThrough', 'reflect', 'transition.type', 'transition.frames', 'seasonIn.0', 'seasonIn.3']) {
    assert.ok(keysShown.includes(key), `inspector edits ${key}`);
}
ws.setDoodadProperty([a], 'seasonIn.2', true);
assert.deepStrictEqual(a.seasons, [2]);
assert.strictEqual(ws.getDoodadProperty(a, 'seasonIn.2'), true);
assert.strictEqual(ws.getDoodadProperty(a, 'seasonIn.0'), false);
ws.setDoodadProperty([a], 'seasonIn.0', true);
assert.deepStrictEqual(a.seasons, [0, 2]);
ws.setDoodadProperty([a], 'seasonIn.0', false);
ws.setDoodadProperty([a], 'seasonIn.2', false);
assert.strictEqual(a.seasons, undefined, "no seasons ticked means every season");
assert.strictEqual(ws.getDoodadProperty(a, 'seasonIn.1'), false);
ws.setDoodadProperty([a], 'transition.type', 'dissolve');
assert.strictEqual(a.transition.frames, DocsDoodads.Transition.defaults.frames, "transition settings start from defaults");

// 6. Recovery snapshots carry world settings back.
const before = JSON.parse(JSON.stringify($dataDocsDoodads.world));
$dataDocsDoodads.world = {};
ws.applyRecovery({ timestamp: 1, mapId: 1, doodads: [], world: before });
assert.deepStrictEqual($dataDocsDoodads.world, before);

console.log("✓ Undoable world and map settings, season table, map panel sections, doodad atmosphere fields and recovery verified.");
