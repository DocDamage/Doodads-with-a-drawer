// scratch/test_editing_input_guards.js
// Regression: while the workspace is open the game must not react to editor input
// (player touch-move, event triggers, menu), and text fields must receive normal keys.
const assert = require('assert');

console.log("=== Testing Workspace Editing Input Guards ===");

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
global.PluginManager = { parameters: () => ({ editKey: "F10", editorMode: "true" }) };

// Minimal MZ engine surface the guards wrap.
global.Input = {
    keyMapper: { 8: 'backspace', 37: 'left', 88: 'escape', 90: 'ok' },
    _currentState: {},
    _shouldPreventDefault(keyCode) { return [8, 9, 37, 38, 39, 40].includes(keyCode); },
    _onKeyDown(event) {
        if (this._shouldPreventDefault(event.keyCode)) event.preventDefault();
        const name = this.keyMapper[event.keyCode];
        if (name) this._currentState[name] = true;
    }
};
global.TouchInput = {
    _newState: { wheelY: 0 },
    _onWheel(event) { this._newState.wheelY += event.deltaY; event.preventDefault(); }
};
function Game_Player() {}
Game_Player.prototype.canMove = function() { return true; };
function Game_Event() { this.moved = 0; }
Game_Event.prototype.updateSelfMovement = function() { this.moved++; };
function Game_Map() {}
Game_Map.prototype.isEventRunning = function() { return false; };
function Scene_Map() {}
Scene_Map.prototype.initialize = function() {};
Object.assign(global, { Game_Player, Game_Event, Game_Map, Scene_Map });
global.SceneManager = { _scene: new Scene_Map() };
global.$gameSystem = {};

require('../QJ-Doodads.js');
const ws = QJ.DD.Workspace;

const player = new Game_Player();
const npc = new Game_Event();
const map = new Game_Map();
const searchBox = { tagName: 'INPUT' };
function keyEvent(keyCode, extra = {}) {
    return Object.assign({ keyCode, code: '', key: '', ctrlKey: false, target: searchBox, prevented: false, preventDefault() { this.prevented = true; } }, extra);
}

// Closed workspace: the game behaves normally.
ws.mounted = false;
assert.strictEqual(player.canMove(), true);
npc.updateSelfMovement();
assert.strictEqual(npc.moved, 1);
assert.strictEqual(map.isEventRunning(), false);
let backspace = keyEvent(8);
Input._onKeyDown(backspace);
assert.strictEqual(backspace.prevented, true, "MZ keeps its default key handling during play");
const playWheel = { deltaY: 120, prevented: false, preventDefault() { this.prevented = true; } };
TouchInput._onWheel(playWheel);
assert.strictEqual(playWheel.prevented, true, "MZ keeps its wheel handling during play");
TouchInput._newState.wheelY = 0;

// Open workspace: the game world is frozen for editing.
ws.mounted = true;
assert.strictEqual(player.canMove(), false, "Clicks in the workspace must not walk the player");
npc.updateSelfMovement();
assert.strictEqual(npc.moved, 1, "Events must not wander while editing");
assert.strictEqual(map.isEventRunning(), true, "Menu and event triggers stay blocked while editing");

// Text fields get normal editing keys and never feed game input.
Input._currentState = {};
backspace = keyEvent(8);
Input._onKeyDown(backspace);
assert.strictEqual(backspace.prevented, false, "Backspace must reach the focused text field");
Input._onKeyDown(keyEvent(88));
assert.strictEqual(Input._currentState.escape, undefined, "Typing 'x' in a field must not open the game menu");

// The wheel scrolls workspace panels (asset grid, tabs, lists) instead of being eaten by MZ.
const wheel = { deltaY: 120, target: { tagName: 'DIV' }, prevented: false, preventDefault() { this.prevented = true; } };
TouchInput._onWheel(wheel);
assert.strictEqual(wheel.prevented, false, "Wheel must scroll the asset grid while editing");
assert.strictEqual(TouchInput._newState.wheelY, 0, "Wheel input must not reach the game while editing");

// Workspace shortcuts must not hijack clipboard/delete inside text fields.
let pasted = 0, deleted = 0;
ws.pasteCopied = () => { pasted++; };
ws.deleteSelectedDoodad = () => { deleted++; };
const paste = keyEvent(86, { key: 'v', ctrlKey: true });
for (const fn of listeners.keydown) fn(paste);
assert.strictEqual(pasted, 0, "Ctrl+V in a text field pastes text, not doodads");
assert.strictEqual(paste.prevented, false);
for (const fn of listeners.keydown) fn(keyEvent(46, { key: 'Delete' }));
assert.strictEqual(deleted, 0, "Delete in a text field must not delete the selected doodad");

// The same shortcuts still work on the canvas.
for (const fn of listeners.keydown) fn(keyEvent(86, { key: 'v', ctrlKey: true, target: { tagName: 'CANVAS' } }));
assert.strictEqual(pasted, 1, "Ctrl+V on the canvas pastes copied doodads");

// Slicer: reopening must not stack key listeners, and its fields keep Backspace.
const editor = QJ.DD.Slicing.Editor;
let regionDeletes = 0, mapUndos = 0;
QJ.DD.Undo.undo = () => { mapUndos++; };
const stubElement = () => ({ style: {}, onclick: null, addEventListener() {}, getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }), click() {} });
document.getElementById = (id) => id === 'qj-slicer-del-btn' ? Object.assign(stubElement(), { click() { regionDeletes++; } }) : stubElement();
editor.bindEvents();
editor.bindEvents();
editor.modal = {};
editor.undo = () => {};
const canvasTarget = { tagName: 'CANVAS' };
for (const fn of listeners.keydown) fn(keyEvent(46, { key: 'Delete', target: canvasTarget }));
assert.strictEqual(regionDeletes, 1, "One Delete press removes exactly one region after reopening the slicer");
for (const fn of listeners.keydown) fn(keyEvent(8, { key: 'Backspace', target: searchBox }));
assert.strictEqual(regionDeletes, 1, "Backspace in a slicer field edits text instead of deleting the region");
for (const fn of listeners.keydown) fn(keyEvent(90, { key: 'z', ctrlKey: true, target: canvasTarget }));
assert.strictEqual(mapUndos, 0, "Ctrl+Z in the slicer must not undo map edits");
editor.modal = null;

console.log("✓ Player, events, menu, and text-field keys are guarded while the workspace is open.");
