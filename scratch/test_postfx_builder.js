// scratch/test_postfx_builder.js
// The post-processing builder: undoable edits to the game-wide look and a map's own look, live
// slider previews as one undo step, presets, the map's look choice, and the panel itself.
const assert = require('assert');

console.log("=== Testing Post-Processing Builder ===");

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
const World = DocsDoodads.World;
const P = DocsDoodads.PostFX;
ws.showToast = () => {};
ws.refreshSpriteset = () => {};

// 1. Game-wide look edits are undoable.
ws.setLookValue('world', 'vignette.enabled', true);
ws.setLookValue('world', 'vignette.amount', 0.6);
assert.strictEqual(P.normalizeLook(World.get('postfx.look')).vignette.amount, 0.6);
assert.strictEqual(ws.getLookValue('world', 'vignette.amount'), 0.6);
Undo.undo();
Undo.undo();
assert.strictEqual(P.isActive(P.normalizeLook(World.get('postfx.look'))), false);
assert.strictEqual(DocsDoodads.Persistence.dirtyDoodads, true);

// A slider drag previews live and commits as one step.
ws.setLookValue('world', 'bloom.enabled', true);
const steps = Undo.undoStack.length;
ws.previewLookValue('world', 'bloom.intensity', 0.3);
ws.previewLookValue('world', 'bloom.intensity', 0.9);
ws.previewLookValue('world', 'bloom.intensity', 1.4);
assert.strictEqual(ws.getLookValue('world', 'bloom.intensity'), 1.4, "the preview shows immediately");
ws.commitLookPreview();
assert.strictEqual(Undo.undoStack.length, steps + 1);
Undo.undo();
assert.strictEqual(ws.getLookValue('world', 'bloom.intensity'), P.defaultLook().bloom.intensity);
assert.strictEqual(ws.getLookValue('world', 'bloom.enabled'), true, "only the drag was undone");
Undo.undo();

// 2. Presets replace the look in one step.
ws.applyPreset('world', 'noir');
assert.deepStrictEqual(P.normalizeLook(World.get('postfx.look')), P.presetLook('noir'));
Undo.undo();
assert.strictEqual(P.isActive(P.normalizeLook(World.get('postfx.look'))), false);
ws.applyPreset('world', 'cinematic');

// 3. A map can follow the game-wide look, use none, or have its own (seeded from the game-wide one).
assert.strictEqual(ws.mapPostFxMode(), 'global');
ws.setMapPostFxMode('custom');
assert.strictEqual(DocsDoodads.Lighting.mapSettings(1).postfx.mode, 'custom');
assert.deepStrictEqual(P.normalizeLook(DocsDoodads.Lighting.mapSettings(1).postfx.look), P.presetLook('cinematic'));
ws.setLookValue('map', 'crt.enabled', true);
assert.strictEqual(ws.getLookValue('map', 'crt.enabled'), true);
assert.strictEqual(ws.getLookValue('world', 'crt.enabled'), false, "the game-wide look is untouched");
ws.setMapPostFxMode('off');
assert.strictEqual(P.resolveLook({ world: World.settings(), mapSettings: DocsDoodads.Lighting.mapSettings(1) }), null);
ws.setMapPostFxMode('custom');
assert.strictEqual(ws.getLookValue('map', 'crt.enabled'), true, "switching back keeps the map's own look");
Undo.undo();
Undo.undo();
Undo.undo();
Undo.undo();
assert.strictEqual(DocsDoodads.Lighting.mapSettings(1), null, "every map change undoes");

// 4. Project options.
ws.setWorldSetting('postfx.quality', 'low');
assert.strictEqual(World.get('postfx.quality'), 'low');
ws.setWorldSetting('postfx.includePictures', true);
assert.strictEqual(World.get('postfx.includePictures'), true);

// 5. The builder panel lists every effect with its controls, presets, and the map choice.
ws.showPostFxBuilder();
const panel = created.find(node => node.id === 'dd-postfx');
assert.ok(panel, "the panel opens");
for (const effect of P.effects) assert.ok(panel.innerHTML.includes(effect.label), `${effect.label} is listed`);
for (const preset of P.presets) assert.ok(panel.innerHTML.includes(preset.label), `${preset.label} preset is offered`);
assert.ok(panel.innerHTML.includes('dd-pfx-target') && panel.innerHTML.includes('dd-pfx-compare'), "target switch and compare button");
assert.ok(panel.innerHTML.includes('dd-pfx-export'), "map image export lives here too");
// Hold to compare hides the effects without changing settings.
ws.setPostFxCompare(true);
assert.strictEqual(ws.postFxCompare, true);
ws.setPostFxCompare(false);
assert.strictEqual(ws.postFxCompare, false);

// 6. Closing the editor removes panels attached to the page (they lose their styles without the workspace)
// and never leaves the effects hidden by a stuck compare button.
const removed = [];
const floating = { parentNode: { removeChild: node => removed.push(node) } };
document.querySelectorAll = selector => (selector === 'body > .dd-glass' ? [floating] : []);
ws.mounted = true;
ws.container = null;
ws.setPostFxCompare(true);
ws.close();
assert.deepStrictEqual(removed, [floating]);
assert.strictEqual(ws.postFxCompare, false);

console.log("✓ Undoable look edits, one-step slider drags, presets, map look modes, project options and the builder panel verified.");
