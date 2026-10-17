// scratch/test_render_effects.js
// Depth sorting with characters, restored appearance/visibility settings, motion, shadows,
// lights, and collision traced from the art.
const assert = require('assert');

console.log("=== Testing Render Effects ===");

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

require('../Docs-Doodads.js');
const doodad = (props) => Object.assign(DocsDoodads.standardStruct(), props);

// 1. Depth: three bands, and "sorted" doodads share the characters' z so the tilemap y-sorts them.
const Depth = DocsDoodads.Depth;
assert.strictEqual(DocsDoodads.standardStruct().depth, 'sorted', "new doodads sort with characters");
assert.strictEqual(Depth.spriteZ(doodad({ depth: 'sorted', z: 7 })), 3, "sorted doodads use the character layer z");
assert.ok(Depth.spriteZ(doodad({ depth: 'below' })) < 1, "below doodads sit under below-priority events");
assert.ok(Depth.spriteZ(doodad({ depth: 'below' })) > 0, "below doodads still draw over ground tiles");
assert.ok(Depth.spriteZ(doodad({ depth: 'above' })) > 4, "above doodads cover the upper tile layer");
assert.ok(Depth.spriteZ(doodad({ depth: 'above' })) < 5, "above-priority events still fly over above doodads");
assert.ok(Depth.spriteZ(doodad({ depth: 'below', z: 2 })) > Depth.spriteZ(doodad({ depth: 'below', z: 1 })), "z orders doodads inside a band");
assert.ok(Depth.spriteZ(doodad({ depth: 'below', z: 99999 })) < Depth.shadowZ, "huge z values stay inside their band");

// The sort line is the doodad's base, plus an adjustable offset.
assert.strictEqual(Depth.baseY(doodad({ y: 300, frameH: 100, anchorY: 1 })), 300);
assert.strictEqual(Depth.baseY(doodad({ y: 300, frameH: 100, anchorY: 0.5 })), 350, "centre-anchored doodads sort by their bottom edge");
assert.strictEqual(Depth.baseY(doodad({ y: 300, frameH: 100, anchorY: 0.5, scaleY: 2 })), 400);
assert.strictEqual(Depth.baseY(doodad({ y: 300, frameH: 100, sortOffsetY: -20 })), 280);

// A character standing in front of a tree draws over it; one standing behind is covered.
const tree = doodad({ x: 240, y: 288, frameW: 96, frameH: 144, depth: 'sorted' });
const behind = { z: 3, y: 288 - 48 - 6, spriteId: 5 };
const inFront = { z: 3, y: 288 + 48 - 6, spriteId: 6 };
const treeSprite = { z: Depth.spriteZ(tree), y: 288, _docsSortY: Depth.baseY(tree), spriteId: 1 };
const sorted = [inFront, treeSprite, behind].sort(Depth.compareChildren);
assert.deepStrictEqual(sorted, [behind, treeSprite, inFront]);

// QJ projects: z decided the layer (characters are z 3); projects get an explicit depth on load.
const legacy = { 1: [{ z: 0 }, { z: 3 }, { z: 6 }, { z: 1, depth: 'above' }] };
DocsDoodads.migrateData(legacy, 'doodads');
assert.deepStrictEqual(legacy[1].map(d => d.depth), ['below', 'sorted', 'above', 'above']);

// 2. Appearance: QJ switch strings, arrays and typed text all mean the same thing.
const Appearance = DocsDoodads.Appearance;
assert.deepStrictEqual(Appearance.parseSwitches("5|true~6|false"), [[5, true], [6, false]]);
assert.deepStrictEqual(Appearance.parseSwitches([[5, true], { id: 6, value: false }]), [[5, true], [6, false]]);
assert.deepStrictEqual(Appearance.parseSwitchText("5:on, 6 off, 7"), [[5, true], [6, false], [7, true]]);
assert.strictEqual(Appearance.formatSwitches([[5, true], [6, false]]), "5:on, 6:off");
assert.deepStrictEqual(Appearance.parseSwitches(""), []);

const switches = { 5: true, 6: false };
const ctx = { switchValue: id => !!switches[id], editing: false };
assert.strictEqual(Appearance.isVisible(doodad({ switch: "5|true~6|false" }), ctx), true);
switches[6] = true;
assert.strictEqual(Appearance.isVisible(doodad({ switch: "5|true~6|false" }), ctx), false, "a failed switch hides the doodad");
assert.strictEqual(Appearance.isVisible(doodad({ switch: "5|true~6|false" }), Object.assign({}, ctx, { editing: true })), true, "the editor always shows conditional doodads");
global.testFlag = 1;
assert.strictEqual(Appearance.isVisible(doodad({ condition: "testFlag === 1" }), ctx), true);
assert.strictEqual(Appearance.isVisible(doodad({ condition: "testFlag === 2" }), ctx), false);
assert.strictEqual(Appearance.isVisible(doodad({ condition: "this is not javascript" }), ctx), true, "a broken condition never hides the doodad");

assert.strictEqual(Appearance.blendMode(doodad({ blend: 1 })), 1);
assert.strictEqual(Appearance.blendMode(doodad({ blend: 99 })), 0, "unknown blend modes fall back to normal");
assert.notStrictEqual(Appearance.signature(doodad({ hue: 0 })), Appearance.signature(doodad({ hue: 40 })), "filter changes are detected");
assert.strictEqual(Appearance.signature(doodad({ x: 1 })), Appearance.signature(doodad({ x: 500 })), "moving does not rebuild filters");
assert.strictEqual(Appearance.needsColorFilter(doodad({})), false);
assert.strictEqual(Appearance.needsColorFilter(doodad({ r: 40 })), true);

// 3. Motion: each type moves one property; phases vary by position so rows of trees don't sway in lockstep.
const Motion = DocsDoodads.Motion;
assert.deepStrictEqual(Motion.sample(null, 1, 0), { skewX: 0, offsetY: 0, alphaMul: 1, scaleMul: 1 });
const sway = Motion.normalize({ type: 'sway', amount: 1, speed: 1 });
const swaySamples = [0, 0.5, 1, 1.5].map(t => Motion.sample(sway, t, 0).skewX);
assert.ok(Math.max(...swaySamples) > 0.05 && Math.min(...swaySamples) < -0.05, "sway leans both ways");
assert.ok(Math.abs(Motion.sample(sway, 0.3, 0).skewX - Motion.sample(sway, 0.3, 500).skewX) > 0.001, "position offsets the phase");
const bob = Motion.sample(Motion.normalize({ type: 'bob', amount: 1 }), 0.5, 0);
assert.ok(bob.offsetY !== 0 && bob.skewX === 0);
for (let t = 0; t < 5; t += 0.37) {
    const flicker = Motion.sample(Motion.normalize({ type: 'flicker', amount: 1 }), t, 3).alphaMul;
    assert.ok(flicker <= 1 && flicker >= 0.6, "flicker dims but never hides");
}
assert.ok(Motion.sample(Motion.normalize({ type: 'pulse', amount: 1 }), 0.5, 0).scaleMul !== 1);
assert.strictEqual(Motion.normalize({ type: 'nonsense' }).type, 'none');

// 4. Shadows: a squashed, leaning silhouette from the same frame.
const Shadow = DocsDoodads.Shadow;
assert.strictEqual(Shadow.transform(doodad({})), null, "no shadow unless enabled");
const shadowed = doodad({ scaleX: 2, scaleY: 1.5, opacity: 0.8, shadow: { enabled: true, opacity: 0.5, length: 0.4, angle: -30, offsetX: 3, offsetY: 2 } });
const st = Shadow.transform(shadowed);
assert.strictEqual(st.scaleX, 2);
assert.ok(Math.abs(st.scaleY - 0.6) < 1e-9, "shadow height is the doodad height times length");
assert.ok(Math.abs(st.skewX - (-30 * Math.PI / 180)) < 1e-9);
assert.ok(Math.abs(st.alpha - 0.4) < 1e-9, "shadow strength follows the doodad's opacity");
assert.deepStrictEqual([st.offsetX, st.offsetY], [3, 2]);
assert.ok(Depth.shadowZ > Depth.spriteZ(doodad({ depth: 'below', z: 500 })) && Depth.shadowZ < 1, "shadows fall over floor decals and under characters");

// 5. Lights and ambient darkness.
const Lighting = DocsDoodads.Lighting;
assert.strictEqual(Lighting.parseColor('#ff8000'), 0xff8000);
assert.strictEqual(Lighting.parseColor('nonsense', 0x123456), 0x123456);
assert.strictEqual(Lighting.ambientFor(null, null, () => false).darkness, 0, "maps are fully lit by default");
const night = { ambient: { darkness: 0.7, color: '#102040', switchId: 0 } };
assert.strictEqual(Lighting.ambientFor(night, null, () => false).darkness, 0.7);
const nightSwitch = { ambient: { darkness: 0.7, color: '#102040', switchId: 12 } };
assert.strictEqual(Lighting.ambientFor(nightSwitch, null, () => false).darkness, 0, "switch-gated darkness waits for its switch");
assert.strictEqual(Lighting.ambientFor(nightSwitch, null, id => id === 12).darkness, 0.7);
assert.strictEqual(Lighting.ambientFor(night, { darkness: 0.2, color: '#000000' }, () => false).darkness, 0.2, "a plugin command overrides the map setting");
assert.deepStrictEqual(Lighting.lightmapBase({ darkness: 0, color: '#000000' }), [1, 1, 1]);
assert.deepStrictEqual(Lighting.lightmapBase({ darkness: 1, color: '#ff0000' }), [1, 0, 0]);
const half = Lighting.lightmapBase({ darkness: 0.5, color: '#000000' });
assert.ok(Math.abs(half[0] - 0.5) < 1e-9);

const lamp = doodad({ x: 100, y: 200, light: { enabled: true, radius: 120, color: '#ffcc00', intensity: 0.9, offsetY: -30 } });
const lights = Lighting.collect([lamp, doodad({})], { x: 10, y: 20 });
assert.strictEqual(lights.length, 1);
assert.deepStrictEqual([lights[0].x, lights[0].y, lights[0].radius, lights[0].color], [90, 150, 120, 0xffcc00], "lights follow map scrolling and their offset");
for (let t = 0; t < 3; t += 0.29) {
    const f = Lighting.flicker(t, 1, 0.5);
    assert.ok(f <= 1 && f >= 0.5);
}
assert.strictEqual(Lighting.flicker(1.3, 1, 0), 1, "steady lights do not flicker");

// Fading the ambient light from a plugin command.
const fade = Lighting.startFade({ darkness: 0, color: '#000000' }, { darkness: 0.8, color: '#000000' }, 4);
Lighting.stepFade(fade); Lighting.stepFade(fade);
assert.ok(Math.abs(fade.current.darkness - 0.4) < 1e-9, "halfway through the fade");
Lighting.stepFade(fade); Lighting.stepFade(fade); Lighting.stepFade(fade);
assert.strictEqual(fade.current.darkness, 0.8);
assert.strictEqual(fade.framesLeft, 0);

// Map settings live beside the per-map doodad arrays without disturbing them.
global.$dataDocsDoodads = { 1: [lamp] };
Lighting.setMapSettings(1, { ambient: { darkness: 0.5, color: '#000000', switchId: 0 } });
assert.strictEqual(Lighting.mapSettings(1).ambient.darkness, 0.5);
assert.ok(Array.isArray($dataDocsDoodads[1]));
DocsDoodads.migrateData($dataDocsDoodads, 'doodads');
assert.strictEqual(Lighting.mapSettings(1).ambient.darkness, 0.5, "migration leaves map settings alone");

// 6. Collision traced from the art: the solid footprint at the bottom of the sprite.
const Collision = DocsDoodads.Collision;
function pixels(w, h) { return new Uint8ClampedArray(w * h * 4); }
function fill(data, w, x, y, rw, rh) {
    for (let py = y; py < y + rh; py++) for (let px = x; px < x + rw; px++) data[(py * w + px) * 4 + 3] = 255;
}
// A tree: wide canopy on top, a trunk 12px wide at the bottom.
const treePx = pixels(48, 96);
fill(treePx, 48, 4, 4, 40, 60);
fill(treePx, 48, 18, 64, 12, 28);
const trunk = Collision.footprintFromAlpha(treePx, 48, 96);
assert.ok(trunk, "a footprint is found");
assert.ok(Math.abs(trunk.x - 18 / 48) < 0.01 && Math.abs(trunk.w - 12 / 48) < 0.01, "footprint is the trunk's width, not the canopy's");
assert.ok(Math.abs((trunk.y + trunk.h) - 92 / 96) < 0.01, "footprint ends at the lowest solid row");
assert.ok(trunk.h > 0 && trunk.h <= 0.3);
// A wall fills its whole width at the bottom.
const wallPx = pixels(96, 48);
fill(wallPx, 96, 0, 8, 96, 40);
const wall = Collision.footprintFromAlpha(wallPx, 96, 48);
assert.ok(Math.abs(wall.x) < 0.01 && Math.abs(wall.w - 1) < 0.01);
// Faint pixels (soft shadows, anti-aliasing) are ignored; an empty sprite has no footprint.
const faint = pixels(32, 32);
for (let i = 3; i < faint.length; i += 4) faint[i] = 10;
assert.strictEqual(Collision.footprintFromAlpha(faint, 32, 32), null);
// A frame inside a larger sheet is analysed on its own.
const sheet = pixels(96, 48);
fill(sheet, 96, 0, 0, 48, 48);
fill(sheet, 96, 60, 30, 10, 18);
const frame = Collision.footprintFromAlpha(sheet, 96, 48, { frame: { x: 48, y: 0, w: 48, h: 48 } });
assert.ok(Math.abs(frame.x - 12 / 48) < 0.01 && Math.abs(frame.w - 10 / 48) < 0.01);

console.log("✓ Depth bands and sorting, QJ migration, switches/conditions, filters, motion, shadows, lights, fades, and traced collision verified.");
