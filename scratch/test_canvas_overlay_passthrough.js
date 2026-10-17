// Regression: MZ stacks #gameVideo (z-index 2) and #errorPrinter over the game canvas,
// so canvas drop/click listeners never fire unless those overlays let pointer events through.
const assert = require('assert');

console.log("=== Testing Canvas Overlay Pointer Passthrough ===");

function element(id) {
    return { id, style: { pointerEvents: '' }, addEventListener() {}, removeEventListener() {} };
}
const overlays = { gameVideo: element('gameVideo'), errorPrinter: element('errorPrinter') };
overlays.errorPrinter.style.pointerEvents = 'auto';

global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.document = {
    createElement: () => ({ style: {}, appendChild() {}, removeChild() {}, querySelectorAll: () => [], addEventListener() {}, getContext: () => ({}) }),
    body: { appendChild() {}, removeChild() {} },
    getElementById: (id) => overlays[id] || null,
    querySelector: () => null
};
global.Utils = { RPGMAKER_NAME: "MZ", isNwjs: () => true, isOptionValid: (opt) => opt === "test" };
global.PluginManager = { parameters: () => ({ editKey: "F10", editorMode: "true" }) };
const canvasEvents = [];
global.Graphics = { _canvas: { addEventListener: (type) => canvasEvents.push(type), removeEventListener() {} } };

require('../Docs-Doodads.js');
const ws = DocsDoodads.Workspace;

ws.attachCanvasListeners();
assert.ok(canvasEvents.includes('drop'), "drop is handled on the canvas");
assert.strictEqual(overlays.gameVideo.style.pointerEvents, 'none', "#gameVideo must not swallow drops/clicks while editing");
assert.strictEqual(overlays.errorPrinter.style.pointerEvents, 'none', "#errorPrinter must not swallow drops/clicks while editing");

ws.detachCanvasListeners();
assert.strictEqual(overlays.gameVideo.style.pointerEvents, '', "closing restores the video overlay");
assert.strictEqual(overlays.errorPrinter.style.pointerEvents, 'auto', "closing restores the error printer");

console.log("✓ Engine overlays pass pointer events to the canvas only while the workspace is open.");
