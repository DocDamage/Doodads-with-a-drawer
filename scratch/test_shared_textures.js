// scratch/test_shared_textures.js
// Textures drawn once and shared by every scene (the light glow, particle shapes, 3D weather) must
// survive MZ destroying the old scene's sprite textures on a menu, battle or map change.
const assert = require('assert');

console.log("=== Testing Shared Textures Across Scenes ===");

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

// A stand-in for PIXI.Texture: destroy() clears it the way PIXI does.
class FakeTexture {
    constructor(source) { this.source = source; this.baseTexture = { source }; }
    destroy() { this.baseTexture = null; }
}
global.PIXI = { Texture: { from: source => new FakeTexture(source) } };

// 1. A shared texture ignores destroy(), as MZ's Stage.destroy({ children, texture }) calls it.
const canvas = { width: 8, height: 8 };
const shared = DocsDoodads.sharedTexture(canvas);
shared.destroy(false);
shared.destroy(true);
assert.ok(shared.baseTexture && shared.baseTexture.source === canvas, 'still usable after the scene is destroyed');
// An ordinary texture is unaffected.
const plain = PIXI.Texture.from(canvas);
plain.destroy();
assert.strictEqual(plain.baseTexture, null);

// 2. The particle shape cache hands out the same texture to the next scene, still alive.
global.document.createElement = () => ({ width: 0, height: 0, getContext: () => ({
    createRadialGradient: () => ({ addColorStop() {} }), fillRect() {}, beginPath() {}, arc() {}, fill() {}, moveTo() {},
    lineTo() {}, quadraticCurveTo() {}, closePath() {}, fillStyle: '' }) });
const T = DocsDoodads.ParticleTextures;
T._cache = {};
const soft = T.get('soft');
soft.destroy(false); // the old map scene goes
assert.strictEqual(T.get('soft'), soft);
assert.ok(T.get('soft').baseTexture, 'the next scene gets a live texture');

console.log("✓ Shared textures survive scene teardown; particle shapes stay usable after the menu.");
