// scratch/test_vfx_builder.js
// Editor side of particles and VFX: doodad Particles/Interaction sections, the project's VFX library
// (new, duplicate a built-in, rename, layers, delete; all undoable) and the VFX builder panel.
const assert = require('assert');

console.log("=== Testing VFX Builder ===");

const elements = {};
function el(id) {
    if (!elements[id]) elements[id] = { id, value: '', checked: false, innerHTML: '', textContent: '', style: {}, onclick: null, onchange: null, oninput: null,
        classList: { toggle() {}, add() {}, remove() {} }, appendChild() {}, querySelectorAll: () => [], addEventListener() {} };
    return elements[id];
}
const created = [];
global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.document = {
    createElement: () => {
        const node = { style: {}, innerHTML: '', appendChild() {}, removeChild() {}, querySelectorAll: () => [], addEventListener() {}, getContext: () => ({}) };
        created.push(node);
        return node;
    },
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
const V = DocsDoodads.Vfx;
ws.showToast = () => {};
ws.refreshSpriteset = () => {};

// 1. Doodad inspector: particles, attached VFX and walk-through bending.
const bush = Object.assign(DocsDoodads.standardStruct(), { x: 10, y: 10 });
$dataDocsDoodads[1] = [bush];
const keys = ws.effectSections().reduce((all, s) => all.concat(s.fields.map(f => f.key)), []);
for (const key of ['particles.preset', 'particles.rateScale', 'particles.layer', 'particles.offsetX', 'particles.offsetY', 'vfx', 'react.enabled', 'react.amount', 'react.leaves']) {
    assert.ok(keys.includes(key), `inspector edits ${key}`);
}
ws.setDoodadProperty([bush], 'particles.preset', 'fireflies');
assert.strictEqual(bush.particles.preset, 'fireflies');
assert.strictEqual(bush.particles.rateScale, 1, "particle settings start from defaults");
ws.setDoodadProperty([bush], 'particles.preset', 'none');
assert.strictEqual(bush.particles, undefined, "None removes the emitter");
Undo.undo();
assert.strictEqual(bush.particles.preset, 'fireflies');
ws.setDoodadProperty([bush], 'react.enabled', true);
assert.strictEqual(bush.react.amount, DocsDoodads.React.defaults.amount);
const vfxField = ws.effectSections().find(s => s.title === 'Particles').fields.find(f => f.key === 'vfx');
assert.ok(vfxField.options.some(o => o.value === '') && vfxField.options.some(o => o.value === 'explosion'), "built-in effects can be attached");

// 2. The library: new effects, copies of built-ins, renaming, layers, deleting. All undoable.
const id = ws.newVfx('Fire Spell');
let lib = DocsDoodads.World.get('vfx.library');
assert.strictEqual(lib.length, 1);
assert.strictEqual(lib[0].name, 'Fire Spell');
assert.strictEqual(lib[0].layers.length, 1, "a new effect starts with one particle layer");
ws.addVfxLayer(id, 'sheet');
assert.strictEqual(V.find(id, DocsDoodads.World.get('vfx.library')).layers[1].type, 'sheet');
ws.setVfxField(id, 'layers.1.fps', 24);
assert.strictEqual(V.find(id, DocsDoodads.World.get('vfx.library')).layers[1].fps, 24);
ws.setVfxField(id, 'layers.0.emitter.preset', 'embers');
assert.strictEqual(V.find(id, DocsDoodads.World.get('vfx.library')).layers[0].emitter.preset, 'embers');
ws.setVfxField(id, 'duration', 2.5);
ws.removeVfxLayer(id, 1);
assert.strictEqual(V.find(id, DocsDoodads.World.get('vfx.library')).layers.length, 1);
ws.renameVfx(id, 'Big Fire');
assert.strictEqual(V.find(id, DocsDoodads.World.get('vfx.library')).name, 'Big Fire');
const copy = ws.duplicateVfx('explosion');
assert.notStrictEqual(copy, 'explosion', "copies of built-ins get their own id");
assert.strictEqual(V.find(copy, DocsDoodads.World.get('vfx.library')).name, 'Explosion copy');
ws.deleteVfx(copy);
assert.strictEqual(V.find(copy, DocsDoodads.World.get('vfx.library')), null);
Undo.undo();
assert.ok(V.find(copy, DocsDoodads.World.get('vfx.library')), "deleting undoes");
for (let i = 0; i < 9; i++) Undo.undo();
assert.deepStrictEqual(DocsDoodads.World.get('vfx.library'), [], "every library change undoes");
assert.strictEqual(ws.deleteVfx('explosion'), false, "built-ins can't be deleted");

// 3. The panel lists built-ins and project effects; preview plays the selected effect at the player.
ws.newVfx('Sparkle Trail');
let played = null;
const realPlay = V.play;
V.play = (spec) => { played = spec; return {}; };
ws.showVfxBuilder();
const panel = created.find(node => node.id === 'dd-vfx');
assert.ok(panel, "the panel opens");
for (const builtIn of V.builtIns) assert.ok(panel.innerHTML.includes(builtIn.name), `${builtIn.name} is listed`);
assert.ok(panel.innerHTML.includes('Sparkle Trail'));
ws.previewVfx('explosion');
assert.strictEqual(played.id, 'explosion');
V.play = realPlay;

console.log("✓ Doodad particle/interaction fields, undoable VFX library edits and the builder panel verified.");
