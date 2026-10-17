// scratch/test_world_view.js
// World View lays out linked neighbouring maps around the current one and draws their doodads.
const assert = require('assert');

console.log("=== Testing World View ===");

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

require('../Docs-Doodads.js');
const MapLinks = DocsDoodads.MapLinks;

const sizes = { 1: { w: 960, h: 720 }, 5: { w: 480, h: 720 }, 6: { w: 960, h: 960 }, 7: { w: 480, h: 480 }, 8: { w: 300, h: 300 } };
const links = { 1: { east: 5, north: 6 }, 5: { west: 1, east: 7 }, 6: { south: 1 }, 7: { west: 5, east: 8 }, 8: { west: 7 } };
const layout = MapLinks.layout(1, id => links[id] || {}, id => sizes[id], 2);
const at = id => layout.find(m => m.mapId === id);
assert.deepStrictEqual([at(1).x, at(1).y], [0, 0], "the current map is the origin");
assert.deepStrictEqual([at(5).x, at(5).y], [960, 0], "east neighbours sit to the right");
assert.deepStrictEqual([at(6).x, at(6).y], [0, -960], "north neighbours sit above, by their own height");
assert.deepStrictEqual([at(7).x, at(7).y], [1440, 0], "neighbours of neighbours are included up to the depth");
assert.strictEqual(at(8), undefined, "beyond the depth is left out");
assert.strictEqual(layout.length, 4);
assert.deepStrictEqual(MapLinks.layout(2, () => ({}), () => ({ w: 100, h: 100 }), 2).map(m => m.mapId), [2], "an unlinked map shows alone");
assert.deepStrictEqual(MapLinks.layout(1, id => links[id] || {}, id => (id === 6 ? null : sizes[id]), 2).map(m => m.mapId).sort(), [1, 5, 7], "maps that can't be read are skipped");

const bounds = MapLinks.bounds(layout);
assert.deepStrictEqual(bounds, { left: 0, top: -960, right: 1920, bottom: 720 });

console.log("✓ Neighbour layout, depth limit, unreadable maps and bounds verified.");
