// scratch/test_edit_key_binding.js
// Regression: the configured edit key (F10 by default) must open the workspace
// from the map, not only close it once it is already open.
const assert = require('assert');

console.log("=== Testing Editor Toggle Key Binding ===");

const listeners = {};
global.window = global;
global.window.addEventListener = (evt, fn) => { (listeners[evt] = listeners[evt] || []).push(fn); };
global.window.removeEventListener = () => {};
global.document = {
    createElement: () => ({ style: {}, appendChild() {}, removeChild() {}, querySelectorAll: () => [], addEventListener() {}, getContext: () => ({}) }),
    body: { appendChild() {}, removeChild() {} },
    getElementById: () => null
};
global.Utils = { RPGMAKER_NAME: "MZ", isNwjs: () => true, isOptionValid: (opt) => opt === "test" };
// MZ's Input only reports names registered in Input.keyMapper; "F10" is not one of them.
global.Input = { keyMapper: { 120: 'debug' }, isTriggered: (name) => false };
function Scene_Map() {}
Scene_Map.prototype.initialize = function() {};
Scene_Map.prototype.updateScene = function() {};
function Scene_Title() {}
global.Scene_Map = Scene_Map;
global.SceneManager = { _scene: new Scene_Map() };
global.PluginManager = { parameters: () => ({ editKey: "F10", editorMode: "true" }) };
// A fresh New Game: Game_System carries no doodadsQJ editor state.
global.$gameSystem = {};

require('../QJ-Doodads.js');

let toggles = 0;
QJ.DD.Workspace.mounted = false;
QJ.DD.Workspace.toggle = function() { toggles++; this.mounted = !this.mounted; };

function pressKey(code) {
    const event = { code, key: code, ctrlKey: false, target: null, preventDefault() { this.prevented = true; } };
    for (const fn of listeners.keydown || []) fn(event);
    SceneManager._scene.updateScene();
    return event;
}

// Opening from the map while the workspace is closed.
let event = pressKey('F10');
assert.strictEqual(toggles, 1, "F10 on the map should open the workspace when it is closed");
assert.ok(event.prevented, "F10 should be consumed so NW.js does not also handle it");

// Editor shortcuts and Explorer drops are live once the workspace is mounted.
let undos = 0;
QJ.DD.Undo.undo = () => { undos++; };
for (const fn of listeners.keydown) fn({ code: 'KeyZ', key: 'z', ctrlKey: true, target: null, preventDefault() {} });
assert.strictEqual(undos, 1, "Ctrl+Z should reach Undo while the workspace is open");
let imported = null;
QJ.DD.Workspace.showAssetImportModal = (paths) => { imported = paths; };
const dropEvent = { dataTransfer: { files: [{ path: 'C:/art/tree.png' }] }, preventDefault() { this.prevented = true; } };
for (const fn of listeners.drop) fn(dropEvent);
assert.deepStrictEqual(imported, ['C:/art/tree.png'], "Explorer drops should open the import modal while editing");

// Closing while editing toggles exactly once.
pressKey('F10');
assert.strictEqual(toggles, 2, "F10 while editing should toggle exactly once");
assert.strictEqual(QJ.DD.Workspace.mounted, false);

// Shortcuts stay inert while closed.
for (const fn of listeners.keydown) fn({ code: 'KeyZ', key: 'z', ctrlKey: true, target: null, preventDefault() {} });
assert.strictEqual(undos, 1, "Ctrl+Z must not reach Undo while the workspace is closed");

// Other keys and other scenes never open the workspace.
pressKey('F9');
assert.strictEqual(toggles, 2, "Keys other than the edit key must not toggle the workspace");
SceneManager._scene = new Scene_Title();
SceneManager._scene.updateScene = () => {};
pressKey('F10');
assert.strictEqual(toggles, 2, "The edit key must not open the workspace outside Scene_Map");

console.log("✓ Edit key opens and closes the workspace from the map only; shortcuts and drops follow the mounted state.");
