// scratch/test_destination.js
// The animated map destination: the marker shown where the player clicks or taps to walk. Shape,
// colour, blending, pulse and spin, image strips, database animations or VFX, a ground layer, and
// dots along the path the player will take.
const assert = require('assert');

console.log("=== Testing Animated Map Destination ===");

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
const D = DocsDoodads.Destination;

// 1. Settings: defaults look like MZ's own marker; bad values are clamped or ignored.
const def = D.normalize({});
assert.deepStrictEqual([def.style, def.color, def.opacity, def.blend, def.scale, def.pulse, def.spin, def.layer], ['default', '#ffffff', 120, 'add', 1, 'mz', 0, 'above']);
const odd = D.normalize({ style: 'teapot', opacity: 999, scale: -3, blend: 'weird', pulse: 'nope', spin: 'fast', fps: 0 });
assert.deepStrictEqual([odd.style, odd.opacity, odd.scale, odd.blend, odd.pulse, odd.spin, odd.fps], ['default', 255, 0.1, 'add', 'mz', 0, 1]);
assert.strictEqual(D.normalize({ color: 'red' }).color, '#ffffff', "only #rrggbb colours");
assert.strictEqual(D.blendMode('normal'), 0);
assert.strictEqual(D.blendMode('add'), 1);
assert.strictEqual(D.blendMode('screen'), 3);
// A plugin command can change the marker mid-game; fields it leaves out keep the project's value.
const merged = D.merge({ style: 'circle', color: '#00ff00', spin: 90 }, { color: '#ff0000' });
assert.deepStrictEqual([merged.style, merged.color, merged.spin], ['circle', '#ff0000', 90]);
assert.strictEqual(D.merge({ style: 'ring' }, null).style, 'ring');

// 2. Pulses (frame counts at 60 fps). "mz" matches MZ's 20-frame pulse exactly.
assert.deepStrictEqual(D.pulse('mz', 0), { scale: 1, alpha: 1 });
assert.deepStrictEqual(D.pulse('mz', 10), { scale: 1.5, alpha: 0.5 });
assert.deepStrictEqual(D.pulse('mz', 20), { scale: 1, alpha: 1 }, "loops every 20 frames");
assert.deepStrictEqual(D.pulse('none', 37), { scale: 1, alpha: 1 });
const b0 = D.pulse('breathe', 0), b15 = D.pulse('breathe', 15);
assert.ok(b15.scale > b0.scale && b15.scale <= 1.1, "breathing swells gently");
const r0 = D.pulse('ripple', 0), r30 = D.pulse('ripple', 30);
assert.ok(r30.scale > r0.scale && r30.alpha < r0.alpha, "ripples grow and fade");
assert.ok(Math.abs(D.rotation(90, 60) - Math.PI / 2) < 1e-9, "90 degrees a second");
assert.strictEqual(D.rotation(0, 999), 0);
// Bobbing (pixels up), for arrows and gems.
assert.strictEqual(D.bob(0, 0), 0);
assert.ok(D.bob(6, 15) < 0 && D.bob(6, 15) >= -6, "bobs upwards");

// 3. Image strips: a [fN] tag splits the image into frames.
assert.deepStrictEqual(D.imageFrame('Arrow[f4]', 192, 48, 0, 8), { x: 0, y: 0, w: 48, h: 48 });
assert.deepStrictEqual(D.imageFrame('Arrow[f4]', 192, 48, 30, 8), { x: 0, y: 0, w: 48, h: 48 }, "half a second at 8 fps is frame 4, which wraps to 0");
assert.deepStrictEqual(D.imageFrame('Arrow[f4]', 192, 48, 15, 8), { x: 96, y: 0, w: 48, h: 48 }, "15 frames at 8 fps = frame 2");
assert.deepStrictEqual(D.imageFrame('Marker', 64, 64, 99, 8), { x: 0, y: 0, w: 64, h: 64 }, "untagged images are one frame");

// 4. The path the player will walk, for the dots.
// A 6x3 map with a wall at x = 2 except the bottom row.
const wall = (x, y) => x === 2 && y < 2;
const pass = (x, y) => x >= 0 && y >= 0 && x < 6 && y < 3 && !wall(x, y);
const path = D.path({ x: 0, y: 0 }, { x: 4, y: 0 }, pass, 100);
assert.deepStrictEqual(path[path.length - 1], { x: 4, y: 0 });
assert.ok(path.every(p => pass(p.x, p.y)), "never through the wall");
assert.strictEqual(path.length, 8, "the shortest way, down around the wall and back up");
assert.ok(path.every((p, i) => {
    const prev = i === 0 ? { x: 0, y: 0 } : path[i - 1];
    return Math.abs(p.x - prev.x) + Math.abs(p.y - prev.y) === 1;
}), "one tile at a time");
const blocked = (x, y) => pass(x, y) && x < 2;
const partial = D.path({ x: 0, y: 0 }, { x: 4, y: 0 }, blocked, 100);
assert.deepStrictEqual(partial[partial.length - 1], { x: 1, y: 0 }, "out of reach: as close as it can get");
assert.strictEqual(D.path({ x: 0, y: 0 }, { x: 4, y: 0 }, pass, 3).length <= 3, true, "the search stops at its limit");
assert.deepStrictEqual(D.path({ x: 1, y: 1 }, { x: 1, y: 1 }, pass, 100), []);
// Clicking a wall: MZ walks as close as it can; the dots stop at the nearest reachable tile.
const toWall = D.path({ x: 0, y: 0 }, { x: 2, y: 0 }, pass, 100);
assert.deepStrictEqual(toWall[toWall.length - 1], { x: 1, y: 0 });
// Dots skip the last tile (the marker is there) and can be spaced out.
assert.deepStrictEqual(D.dots([{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }], 1), [{ x: 1, y: 0 }, { x: 2, y: 0 }]);
assert.deepStrictEqual(D.dots([{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }], 2), [{ x: 2, y: 0 }, { x: 4, y: 0 }]);

// 5. Where the marker is drawn: above characters (MZ) or on the ground beneath them.
assert.strictEqual(D.zFor('above'), 9);
assert.ok(D.zFor('ground') < 1 && D.zFor('ground') > 0, "between the ground tiles and the characters");

console.log("✓ Marker settings, merging, pulses, spin and bob, image strips, path dots and layering verified.");
