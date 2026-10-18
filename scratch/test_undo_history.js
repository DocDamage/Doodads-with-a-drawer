// scratch/test_undo_history.js
// The undo history panel: every step has a readable name, and you can step back or forward to any point.
const assert = require('assert');

console.log("=== Testing Undo History ===");

global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.document = {
    createElement: () => ({ style: {}, appendChild() {}, removeChild() {}, querySelectorAll: () => [], addEventListener() {}, getContext: () => ({}) }),
    body: { appendChild() {}, removeChild() {} },
    getElementById: () => null
};
global.Utils = { RPGMAKER_NAME: "MZ", isNwjs: () => true, isOptionValid: (opt) => opt === "test" };
global.PluginManager = { parameters: () => ({}) };
global.$dataDocsDoodads = {};

require('../Docs-Doodads.js');
const U = DocsDoodads.Undo;
U.clear();

// 1. Names: from the command's label, its type, or a tidy version of an unknown type.
assert.strictEqual(U.labelFor({ type: 'move_doodads' }), 'Move doodads');
assert.strictEqual(U.labelFor({ type: 'z_order_front' }), 'Bring to front');
assert.strictEqual(U.labelFor({ type: 'something_new' }), 'Something new');
assert.strictEqual(U.labelFor({ type: 'map_setting', label: 'Terrain height' }), 'Terrain height');
assert.strictEqual(U.labelFor({}), 'Edit');

// 2. A counter changed by five steps.
let value = 0;
const step = (type, n) => U.execute({ type, apply: () => { value += n; }, revert: () => { value -= n; } });
step('place_doodad', 1); step('move_doodads', 10); step('align_doodads', 100); step('group_doodads', 1000); step('delete_doodads', 10000);
assert.strictEqual(value, 11111);
assert.deepStrictEqual(U.history().map(h => [h.index, h.label, h.done]), [
    [0, 'Place doodad', true], [1, 'Move doodads', true], [2, 'Align', true], [3, 'Group', true], [4, 'Delete doodads', true]
]);

// 3. Back to just after step 2: three steps undone in one go, shown greyed (not done).
assert.strictEqual(U.goTo(2), 3);
assert.strictEqual(value, 11);
assert.deepStrictEqual(U.history().map(h => h.done), [true, true, false, false, false]);
assert.deepStrictEqual(U.history().map(h => h.label), ['Place doodad', 'Move doodads', 'Align', 'Group', 'Delete doodads'], 'order kept');
// Forward again to after step 4, then to the start, then all the way.
assert.strictEqual(U.goTo(4), 2);
assert.strictEqual(value, 1111);
U.goTo(0);
assert.strictEqual(value, 0);
U.goTo(99);
assert.strictEqual(value, 11111, 'past the end: everything redone');
assert.strictEqual(U.goTo(5), 0, 'already there');
// A new step after going back drops the undone ones, as usual.
U.goTo(1);
step('lock_doodads', 7);
assert.deepStrictEqual(U.history().map(h => h.label), ['Place doodad', 'Lock or unlock']);
assert.strictEqual(value, 8);

console.log("✓ Undo history: step names, the list in order, and stepping back and forward to any point verified.");
