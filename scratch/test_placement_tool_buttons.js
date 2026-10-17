// Regression: switching placement tools must leave exactly one tool highlighted and
// close the scatter-brush settings popover when the brush is not the active tool.
const assert = require('assert');

console.log("=== Testing Placement Tool Buttons ===");

const elements = {};
function el(id) {
    if (!elements[id]) {
        const classes = new Set();
        elements[id] = {
            id, style: { display: 'none' },
            classList: {
                toggle(name, force) { if (force) classes.add(name); else classes.delete(name); },
                remove(name) { classes.delete(name); },
                contains(name) { return classes.has(name); }
            }
        };
    }
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

require('../Docs-Doodads.js');
const ws = DocsDoodads.Workspace;
ws.showToast = () => {};
ws.removeGhost = () => {};
const active = () => ['dd-eyedropper-btn', 'dd-stamp-btn', 'dd-brush-btn'].filter(id => el(id).classList.contains('dd-btn-active'));

ws.setPlacementTool('stamp');
assert.deepStrictEqual(active(), ['dd-stamp-btn']);
ws.setPlacementTool('brush');
assert.strictEqual(ws.placementTool, 'brush');
assert.deepStrictEqual(active(), ['dd-brush-btn'], "switching to the brush un-highlights Stamp");
assert.strictEqual(el('dd-brush-popover').style.display, 'block');
ws.setPlacementTool('eyedropper');
assert.deepStrictEqual(active(), ['dd-eyedropper-btn'], "switching to the eyedropper un-highlights the brush");
assert.strictEqual(el('dd-brush-popover').style.display, 'none', "brush settings close when another tool is chosen");
ws.setPlacementTool(null);
assert.deepStrictEqual(active(), []);
assert.strictEqual(ws.placementTool, null);

console.log("✓ Exactly one placement tool is highlighted at a time.");
