// scratch/test_effekseer_3d.js
// MZ's Effekseer animations in the 3D view play where their target is drawn (not where it would be
// on the flat map) and shrink with distance like the target.
const assert = require('assert');

console.log("=== Testing Effekseer Animations in 3D ===");

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

// Stand-ins for MZ's Point and Sprite_Animation (the parts the plugin wraps).
global.Point = class { constructor(x, y) { this.x = x || 0; this.y = y || 0; } };
function Sprite_Animation() {}
Sprite_Animation.prototype.targetSpritePosition = function(sprite) { return new Point(sprite.x, sprite.y - sprite.height / 2); };
Sprite_Animation.prototype.updateEffectGeometry = function() {
    const scale = this._animation.scale / 100;
    this._handle.setScale(scale, scale, scale);
};
global.Sprite_Animation = Sprite_Animation;

require('../Docs-Doodads.js');
const P = DocsDoodads.Perspective;

const anim = new Sprite_Animation();
anim._animation = { scale: 100, alignBottom: false };
let handleScale = null;
anim._handle = { setScale: (x) => { handleScale = x; } };
const target = { x: 100, y: 200, height: 48, scale: { y: 1 } };

// 1. On a flat map, MZ's own placement and size are untouched.
P.liveCamera = () => null;
assert.deepStrictEqual(Object.assign({}, anim.targetSpritePosition(target)), { x: 100, y: 176 });
anim._docs3dScale = 0.5;
anim.updateEffectGeometry();
assert.strictEqual(handleScale, 1);

// 2. In 3D: placed by the target's billboard transform (here: half size, moved), then the view's own.
P.liveCamera = () => ({});
global.SceneManager = { _scene: { _spriteset: { _docs3dBillboards: { worldTransform: { apply: p => new Point(p.x + 10, p.y + 20) } } } } };
target._docs3dMatrix = { a: 0.5, b: 0, c: 0, d: 0.5, tx: 300, ty: 40 };
const at = anim.targetSpritePosition(target);
assert.deepStrictEqual([at.x, at.y], [0.5 * 100 + 300 + 10, 0.5 * 176 + 40 + 20], 'the middle of the target as drawn');
anim._animation.alignBottom = true;
const feet = anim.targetSpritePosition(target);
assert.deepStrictEqual([feet.x, feet.y], [360, 0.5 * 200 + 60], 'bottom-aligned animations play at the feet');
// ...and sized like the target.
anim.updateEffectGeometry();
assert.strictEqual(handleScale, 0.5);
anim._animation.scale = 150;
anim.updateEffectGeometry();
assert.strictEqual(handleScale, 0.75);

// 3. A target the 3D view hasn't placed yet falls back to MZ's placement.
const fresh = { x: 5, y: 50, height: 10, scale: { y: 1 } };
assert.deepStrictEqual(Object.assign({}, anim.targetSpritePosition(fresh)), { x: 5, y: 45 });

console.log("✓ Effekseer animations follow their target's 3D position and size; flat maps unchanged.");
