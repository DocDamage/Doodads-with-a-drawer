// scratch/test_postfx.js
// Post-processing: looks (defaults, clamping, presets, blending), which look applies where, render
// passes by quality, shader uniforms, animated screen effects, and planning a full-map image export.
const assert = require('assert');

console.log("=== Testing Post-Processing ===");

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
global.$gameMap = { mapId: () => 1, displayX: () => 0, displayY: () => 0, tileWidth: () => 48, tileHeight: () => 48 };
global.$dataDocsDoodads = { 1: [] };

require('../Docs-Doodads.js');
const P = DocsDoodads.PostFX;
const near = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;

// 1. A look holds every effect; nothing is on by default.
const ids = ['bloom', 'color', 'vignette', 'grain', 'aberration', 'lens', 'crt', 'pixelate', 'sharpen', 'tiltShift'];
const base = P.defaultLook();
assert.deepStrictEqual(Object.keys(base).sort(), ids.slice().sort());
assert.ok(ids.every(id => base[id].enabled === false));
assert.strictEqual(P.isActive(base), false);
assert.ok(P.effects.every(e => e.label && Array.isArray(e.params)), "every effect describes its controls for the builder");

// Partial looks are filled in, out-of-range values clamped, unknown keys dropped.
const n = P.normalizeLook({ vignette: { enabled: true, amount: 5 }, bogus: { enabled: true } });
assert.strictEqual(n.vignette.amount, 1);
assert.strictEqual(n.vignette.softness, base.vignette.softness);
assert.strictEqual(n.bogus, undefined);
assert.strictEqual(P.isActive(n), true);
assert.strictEqual(P.normalizeLook({ color: { enabled: 'yes', shadows: 'not a colour' } }).color.shadows, base.color.shadows, "bad colours fall back");
assert.strictEqual(P.normalizeLook(null).bloom.enabled, false);

// 2. Blending looks: an effect fades from its value towards "no effect", then switches off.
const on = P.normalizeLook({ vignette: { enabled: true, amount: 0.8 }, color: { enabled: true, shadows: '#000000' } });
const off = P.normalizeLook({ color: { enabled: true, shadows: '#ffffff' } });
const half = P.lerpLook(on, off, 0.5);
assert.ok(half.vignette.enabled && near(half.vignette.amount, 0.4));
assert.strictEqual(half.color.shadows, '#808080');
assert.strictEqual(P.lerpLook(on, off, 1).vignette.enabled, false);
assert.strictEqual(P.lerpLook(on, off, 0).vignette.amount, 0.8);

const fade = P.fadeStart(on, off, 10);
for (let i = 0; i < 5; i++) P.fadeStep(fade);
assert.ok(near(fade.current.vignette.amount, 0.4));
for (let i = 0; i < 5; i++) P.fadeStep(fade);
assert.strictEqual(fade.framesLeft, 0);
assert.strictEqual(fade.current.vignette.enabled, false);
assert.strictEqual(P.fadeStart(on, off, 0).current.vignette.enabled, false, "zero frames is instant");

// 3. Presets.
assert.ok(P.presets.length >= 6);
for (const preset of P.presets) assert.ok(P.isActive(P.presetLook(preset.id)), `${preset.id} does something`);
assert.strictEqual(P.presetLook('nope'), null);
assert.notStrictEqual(P.presetLook('noir'), P.presetLook('noir'), "presets are copies");

// 4. Which look applies: plugin command > the map's choice > the game-wide look.
const world = { postfx: { enabled: true, look: { vignette: { enabled: true, amount: 0.5 } } } };
assert.strictEqual(P.resolveLook({ world, mapSettings: null }).vignette.amount, 0.5);
assert.strictEqual(P.resolveLook({ world, mapSettings: { postfx: { mode: 'off' } } }), null);
const custom = P.resolveLook({ world, mapSettings: { postfx: { mode: 'custom', look: { crt: { enabled: true } } } } });
assert.ok(custom.crt.enabled && !custom.vignette.enabled, "a map's own look replaces the game-wide one");
assert.ok(P.resolveLook({ world, mapSettings: { postfx: { mode: 'off' } }, runtime: P.presetLook('noir') }).color.enabled, "a plugin-command look wins");
assert.strictEqual(P.resolveLook({ world: { postfx: { enabled: false, look: world.postfx.look } } }), null, "switched off for the project");
assert.strictEqual(P.resolveLook({ world: { postfx: { enabled: true, look: {} } } }), null, "a look with nothing on costs nothing");

// 5. Render passes by quality.
const full = P.normalizeLook({ bloom: { enabled: true }, tiltShift: { enabled: true }, vignette: { enabled: true } });
assert.deepStrictEqual(P.passes(full, 'high'), ['bloom', 'tiltShift', 'grade']);
assert.deepStrictEqual(P.passes(full, 'low'), ['bloom', 'grade'], "low quality skips tilt-shift");
assert.deepStrictEqual(P.passes(full, 'off'), []);
assert.deepStrictEqual(P.passes(P.normalizeLook({ bloom: { enabled: true } }), 'high'), ['bloom']);
assert.deepStrictEqual(P.passes(null, 'high'), []);
assert.deepStrictEqual(P.passes(P.defaultLook(), 'high', { zoom: 1.1 }), ['grade'], "a screen effect needs the grade pass even with no look");
assert.strictEqual(P.effectiveQuality('high', 1), 'medium', "the player's Options choice can lower the project's quality");
assert.strictEqual(P.effectiveQuality('low', 0), 'low', "but never raise it");
assert.strictEqual(P.effectiveQuality('high', 3), 'off');
assert.strictEqual(P.bloomBlurQuality('low') < P.bloomBlurQuality('high'), true);

// 6. Shader uniforms: a look with nothing on is neutral; values map to the shader's units.
const u = P.uniforms(P.defaultLook(), null, 0);
assert.strictEqual(u.uExposure, 1);
assert.strictEqual(u.uContrast, 1);
assert.strictEqual(u.uSaturation, 1);
assert.strictEqual(u.uVignette, 0);
assert.strictEqual(u.uGrain, 0);
assert.strictEqual(u.uPixel, 1);
assert.strictEqual(u.uZoom, 1);
assert.strictEqual(u.uShock[3], 0);
assert.strictEqual(P.uniforms(P.normalizeLook({ color: { enabled: true, exposure: 1 } }), null, 0).uExposure, 2, "exposure is in stops");
assert.deepStrictEqual(P.uniforms(P.normalizeLook({ vignette: { enabled: true, color: '#ff0000' } }), null, 0).uVignetteColor, [1, 0, 0]);
const animated = P.uniforms(P.defaultLook(), { zoom: 1.2, zoomCenter: [0.3, 0.4], shock: [0.5, 0.5, 0.2, 0.05], aberration: 0.5, bloom: 0 }, 0);
assert.strictEqual(animated.uZoom, 1.2);
assert.deepStrictEqual(animated.uZoomCenter, [0.3, 0.4]);
assert.ok(animated.uAberration > 0, "a chromatic punch adds to the look's aberration");

// Shaders reading inputSize declare high precision (see test_doodad_atmosphere).
for (const [name, source] of Object.entries({ grade: P.gradeFragment, extract: P.bloomExtractFragment, combine: P.bloomCombineFragment, tilt: P.tiltFragment })) {
    assert.ok(typeof source === 'string' && source.includes('void main'), `${name} shader exists`);
    if (/inputSize/.test(source)) assert.ok(/precision highp float;/.test(source), `${name} declares high precision`);
}

// smoothstep with descending edges is undefined in GLSL (some GPUs return nothing), so edges must ascend.
for (const source of [P.gradeFragment, P.tiltFragment, DocsDoodads.Transition.dissolveFragment, DocsDoodads.Motion.shimmerFragment]) {
    const re = /smoothstep\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*[,)]/g;
    let m;
    while ((m = re.exec(source))) assert.ok(parseFloat(m[1]) < parseFloat(m[2]), 'smoothstep edges ascend: ' + m[0]);
    assert.ok(!/smoothstep\(\s*1\.0\s*,\s*1\.0\s*-/.test(source), 'no descending smoothstep');
}

// 7. Animated screen effects: each runs for its duration, then is removed.
const A = P.Animations;
const list = [];
assert.ok(A.start(list, { type: 'zoomPunch', strength: 0.2, duration: 20, center: [0.5, 0.5] }, 100));
assert.ok(A.sample(list, 104).zoom > 1);
assert.strictEqual(A.sample(list, 121).zoom, 1);
assert.strictEqual(list.length, 0, "finished effects are dropped");
A.start(list, { type: 'shockwave', strength: 1, duration: 20, center: [0.25, 0.75] }, 0);
const mid = A.sample(list, 10);
assert.ok(mid.shock[2] > 0 && mid.shock[3] > 0, "the ring has grown and still bends the picture");
assert.deepStrictEqual(mid.shock.slice(0, 2), [0.25, 0.75]);
assert.ok(A.sample(list, 18).shock[2] > mid.shock[2], "the ring keeps expanding");
list.length = 0;
A.start(list, { type: 'chromaticPunch', strength: 1, duration: 10 }, 0);
A.start(list, { type: 'bloomFlash', strength: 1, duration: 10 }, 0);
const both = A.sample(list, 1);
assert.ok(both.aberration > 0 && both.bloom > 0, "effects stack");
assert.strictEqual(A.start(list, { type: 'nonsense', duration: 10 }, 0), null);
assert.ok(A.types.length >= 4);

// 8. Exported map images skip effects shaped by the screen (they would repeat on every tile of the image).
const ex = P.exportLook(P.normalizeLook({ vignette: { enabled: true }, crt: { enabled: true }, lens: { enabled: true },
    aberration: { enabled: true }, tiltShift: { enabled: true }, color: { enabled: true }, bloom: { enabled: true }, grain: { enabled: true } }));
assert.deepStrictEqual(ids.filter(id => ex[id].enabled).sort(), ['bloom', 'color'].sort());

// 9. Full-map export plan: screen-sized captures that cover the map exactly once.
const X = DocsDoodads.MapExport;
const check = (plan, W, H) => {
    let area = 0;
    for (const c of plan.chunks) {
        area += c.w * c.h;
        assert.ok(c.dx + c.w <= W && c.dy + c.h <= H, "inside the map");
        assert.ok(c.sx >= 0 && c.sy >= 0 && c.sx + c.w <= 816 && c.sy + c.h <= 624, "inside the captured screen");
        assert.strictEqual(c.dx, c.displayX * 48 + c.sx, "screen offset + camera = map position");
        assert.strictEqual(c.dy, c.displayY * 48 + c.sy);
    }
    assert.strictEqual(area, W * H, "no gaps or overlaps");
};
const plan = X.plan(40, 30, 48, 48, 816, 624, 1);
assert.strictEqual(plan.error, undefined);
assert.deepStrictEqual([plan.width, plan.height], [1920, 1440]);
check(plan, 1920, 1440);
assert.ok(plan.chunks.every(c => c.displayX <= 40 - 17 && c.displayY <= 30 - 13), "the camera never leaves a non-looping map");
const small = X.plan(10, 8, 48, 48, 816, 624, 1);
assert.strictEqual(small.chunks.length, 1);
check(small, 480, 384);
const huge = X.plan(400, 400, 48, 48, 816, 624, 1);
assert.ok(huge.error && /scale/i.test(huge.error), "too big for one image: suggest a smaller scale");
const halfScale = X.plan(400, 400, 48, 48, 816, 624, 0.5);
assert.strictEqual(halfScale.error, undefined);
assert.deepStrictEqual([halfScale.width, halfScale.height], [9600, 9600]);
assert.ok(/^Map003_\d{8}-\d{6}\.png$/.test(X.fileName(3, new Date(2026, 9, 17, 16, 5, 9))));

console.log("✓ Looks, blending, presets, look priority, passes, quality, uniforms, screen effects and map export plans verified.");
