// scratch/test_loop_maps.js
// On looping (world) maps the camera wraps around; doodads, lights, outlines and clicks must wrap with it,
// the way MZ's own characters use $gameMap.adjustX/adjustY.
const assert = require('assert');

console.log("=== Testing Looping Maps ===");

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

// A 30x60 map looping both ways, 17x13 tiles on screen, camera wrapped to the bottom.
const map = {
    _displayX: 0, _displayY: 56, w: 30, h: 60, loop: true,
    mapId: () => 4, tileWidth: () => 48, tileHeight: () => 48, width() { return this.w; }, height() { return this.h; },
    displayX() { return this._displayX; }, displayY() { return this._displayY; },
    screenTileX: () => 17, screenTileY: () => 13,
    isLoopHorizontal() { return this.loop; }, isLoopVertical() { return this.loop; },
    adjustX(x) { return this.isLoopHorizontal() && x < this._displayX - (this.w - this.screenTileX()) / 2 ? x - this._displayX + this.w : x - this._displayX; },
    adjustY(y) { return this.isLoopVertical() && y < this._displayY - (this.h - this.screenTileY()) / 2 ? y - this._displayY + this.h : y - this._displayY; }
};
global.$gameMap = map;

require('../Docs-Doodads.js');
const ws = DocsDoodads.Workspace;

// 1. A doodad near the top of the map shows just below the wrap seam, not 2600px off-screen.
const p = DocsDoodads.mapToScreen(816, 40);
assert.deepStrictEqual([p.x, p.y], [816, 232]);
// Without looping the plain offset is used.
map.loop = false;
assert.strictEqual(DocsDoodads.mapToScreen(816, 40).y, 40 - 56 * 48);
map.loop = true;

// 2. Lights and selection outlines use the same wrapped positions.
const lamp = Object.assign(DocsDoodads.standardStruct(), { x: 816, y: 40, light: { enabled: true, offsetY: 0 } });
const lights = DocsDoodads.Lighting.collect([lamp], (x, y) => DocsDoodads.mapToScreen(x, y));
assert.deepStrictEqual([lights[0].x, lights[0].y], [816, 232]);
assert.strictEqual(DocsDoodads.Lighting.collect([lamp], { x: 10, y: 20 })[0].y, 20, "plain offsets still work");
global.$dataDocsDoodads = { 4: [lamp] };
ws.selectDoodads = function(items) { this.selectedDoodads = items; this.selectedDoodad = items[0]; };
ws.selectDoodads([Object.assign(lamp, { frameW: 48, frameH: 48 })]);
assert.deepStrictEqual(ws.selectionScreenRects()[0], { x: 792, y: 184, w: 48, h: 48 });

// 3. Clicking the wrapped area maps back into the map's real coordinates.
const canvas = { width: 816, height: 624, getBoundingClientRect: () => ({ left: 0, top: 0, width: 816, height: 624 }) };
DocsDoodads.Compat.getCanvas = () => canvas;
const clicked = ws.clientToMapCoords(800, 200);
assert.deepStrictEqual([clicked.x, clicked.y, clicked.tileX, clicked.tileY], [800, 8, 16, 0], "below the seam is the top of the map");
assert.strictEqual(ws.doodadAt(clicked.x, clicked.y + 20), lamp, "so the doodad there can be clicked");

console.log("✓ Wrapped doodad, light, outline and click positions on looping maps verified.");
