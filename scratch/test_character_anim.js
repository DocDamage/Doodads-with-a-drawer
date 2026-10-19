// scratch/test_character_anim.js
// Character sheets beyond MZ's 3x4 frames: frame/direction tags, single-row and 8-direction sheets,
// idle and run cycles from animation sets, one-shot actions, and diagonal movement.
const assert = require('assert');

console.log("=== Testing Character Animation ===");

const elements = {};
function el(id) {
    if (!elements[id]) elements[id] = { id, value: '', checked: false, innerHTML: '', textContent: '', style: {}, onclick: null, onchange: null, oninput: null,
        classList: { toggle() {}, add() {}, remove() {} }, appendChild() {}, querySelectorAll: () => [], addEventListener() {} };
    return elements[id];
}
global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.document = {
    createElement: () => ({ style: {}, appendChild() {}, removeChild() {}, querySelectorAll: () => [], addEventListener() {}, getContext: () => ({}) }),
    body: { appendChild() {}, removeChild() {} },
    getElementById: (id) => el(id)
};
global.Utils = { RPGMAKER_NAME: "MZ", isNwjs: () => true, isOptionValid: (opt) => opt === "test" };
global.PluginManager = { parameters: () => ({}) };
// MZ's side-view battler, as far as its size goes: updateFrame sets the frame to one cell of the sheet.
global.Sprite_Actor = function() { this._battlerName = ''; this._frame = null; this._cell = { w: 64, h: 64 }; };
Sprite_Actor.prototype.setFrame = function(x, y, width, height) { this._frame = { x, y, width, height }; };
Sprite_Actor.prototype.updateFrame = function() { this.setFrame(0, 0, this._cell.w, this._cell.h); };
global.$gameMap = { mapId: () => 1, displayX: () => 0, displayY: () => 0, tileWidth: () => 48, tileHeight: () => 48 };
global.$dataDocsDoodads = { 1: [] };

require('../Docs-Doodads.js');
const C = DocsDoodads.CharacterAnim;

// 1. Sheet names carry their layout: [f8] frames per row, [d1]/[d8] direction rows. %(8) is accepted too.
assert.deepStrictEqual(C.parseName('Actor1'), { base: 'Actor1', frames: 3, dirs: 4, tagged: false, walkTiles: 0, below: 0 });
assert.deepStrictEqual(C.parseName('Hero[f8]'), { base: 'Hero', frames: 8, dirs: 4, tagged: true, walkTiles: 0, below: 0 });
assert.deepStrictEqual(C.parseName('$Slime[f6][d1]'), { base: '$Slime', frames: 6, dirs: 1, tagged: true, walkTiles: 0, below: 0 });
assert.deepStrictEqual(C.parseName('Knight[d8][f4]'), { base: 'Knight', frames: 4, dirs: 8, tagged: true, walkTiles: 0, below: 0 });
assert.deepStrictEqual(C.parseName('Bat%(5)'), { base: 'Bat', frames: 5, dirs: 4, tagged: true, walkTiles: 0, below: 0 });
assert.strictEqual(C.parseName('Weird[f0]').frames, 3, "nonsense counts fall back");
assert.strictEqual(C.parseName('Big[f99]').frames, 64, "and are capped");
assert.deepStrictEqual(C.parseName('$Hero[f9][w2]'), { base: '$Hero', frames: 9, dirs: 4, tagged: true, walkTiles: 2, below: 0 }, 'walk pace: frame 0 stands, a cycle every 2 tiles');
assert.strictEqual(C.parseName('$Hero[w2]').walkTiles, 0, "pace needs more than MZ's 3 frames");
// [bN]: art below the feet (an LPC spear thrust); the sheet still stands on its feet.
assert.deepStrictEqual(C.parseName('$Knight_slash[f6][b64]'), { base: '$Knight_slash', frames: 6, dirs: 4, tagged: true, walkTiles: 0, below: 64 });
assert.strictEqual(C.belowFor('$Knight_slash[f6][b64]', null), 64);
assert.strictEqual(C.belowFor('$Knight_slash[f6]', { '$Knight_slash[f6]': 64 }), 64, "or the project's table (names unchanged)");
assert.strictEqual(C.belowFor('$Knight[f9][w2]', { '$Knight_slash[f6]': 64 }), 0);
assert.strictEqual(C.footAnchor(192, 64), 1 - 64 / 192, 'the feet stay where the character stands');
assert.strictEqual(C.footAnchor(64, 0), 1);
// A battler grown to fit a big weapon keeps the figure's height, so battle animations aim at the figure.
assert.strictEqual(C.svBodyFor('Knight[h64]', null), 64);
assert.strictEqual(C.svBodyFor('Knight', { Knight: 64 }), 64, "or the project's table");
assert.strictEqual(C.svBodyFor('Actor1_1', { Knight: 64 }), 0);
const battler = new Sprite_Actor();
battler._battlerName = 'Knight';
battler._cell = { w: 192, h: 128 };
DocsDoodads.World.settings().characterAnim.svBody = { Knight: 64 };
battler.updateFrame();
assert.deepStrictEqual(battler._frame, { x: 0, y: 0, width: 192, height: 64 }, 'the figure is 64 tall in a 192 x 128 cell');
battler._battlerName = 'Actor1_1';
battler._cell = { w: 64, h: 64 };
battler.updateFrame();
assert.deepStrictEqual(battler._frame, { x: 0, y: 0, width: 64, height: 64 }, 'other battlers are left alone');
DocsDoodads.World.settings().characterAnim.svBody = {};

// 2. Which row a direction uses. MZ order: down, left, right, up; 8-direction sheets add the diagonals.
assert.deepStrictEqual(C.rowFor(2, 4), { row: 0, mirror: false });
assert.deepStrictEqual(C.rowFor(8, 4), { row: 3, mirror: false });
assert.deepStrictEqual(C.rowFor(1, 4), { row: 1, mirror: false }, "4-direction sheets show diagonals as their side");
assert.deepStrictEqual(C.rowFor(9, 4), { row: 2, mirror: false });
assert.deepStrictEqual(C.rowFor(1, 8), { row: 4, mirror: false });
assert.deepStrictEqual(C.rowFor(3, 8), { row: 5, mirror: false });
assert.deepStrictEqual(C.rowFor(7, 8), { row: 6, mirror: false });
assert.deepStrictEqual(C.rowFor(9, 8), { row: 7, mirror: false });
assert.deepStrictEqual(C.rowFor(6, 1), { row: 0, mirror: false }, "single-row sheets face right");
assert.deepStrictEqual(C.rowFor(4, 1), { row: 0, mirror: true }, "and are mirrored to face left");
assert.deepStrictEqual(C.rowFor(7, 1), { row: 0, mirror: true });

// 3. Frames: MZ's 3-frame sheets step 0,1,2,1; longer sheets loop through every frame.
assert.deepStrictEqual([0, 1, 2, 3, 4].map(p => C.walkFrame(p, 3)), [0, 1, 2, 1, 0]);
assert.deepStrictEqual([0, 1, 7, 8, 9].map(p => C.walkFrame(p, 8)), [0, 1, 7, 0, 1]);
assert.strictEqual(C.standingFrame(3), 1);
assert.strictEqual(C.standingFrame(8), 0);
assert.strictEqual(C.cycleFrame(0, 8, 6), 0);
assert.strictEqual(C.cycleFrame(30, 8, 6), 4, "half a second at 8 fps is 4 frames in");
assert.strictEqual(C.cycleFrame(120, 8, 6), 4, "and wraps");

// 4. Animation sets: idle and run sheets for a character; which state shows when.
const sets = [{ character: 'Hero[f8]', idle: 'Hero_idle[f6]', run: 'Hero_run[f8]', idleDelay: 90, idleFps: 6, runFps: 12 }];
assert.strictEqual(C.setFor('Hero[f8]', sets).idle, 'Hero_idle[f6]');
assert.strictEqual(C.setFor('Other', sets), null);
const base = { moving: false, dashing: false, stillFrames: 0, action: null };
assert.strictEqual(C.stateFor(base, sets[0]), 'stand');
assert.strictEqual(C.stateFor(Object.assign({}, base, { stillFrames: 100 }), sets[0]), 'idle');
assert.strictEqual(C.stateFor(Object.assign({}, base, { stillFrames: 100 }), null), 'stand', "no idle sheet, no idle state");
assert.strictEqual(C.stateFor(Object.assign({}, base, { moving: true }), sets[0]), 'walk');
assert.strictEqual(C.stateFor(Object.assign({}, base, { moving: true, dashing: true }), sets[0]), 'run');
assert.strictEqual(C.stateFor(Object.assign({}, base, { moving: true, dashing: true }), { character: 'X', idle: 'X_idle' }), 'walk', "no run sheet: dashing walks faster");
assert.strictEqual(C.stateFor(Object.assign({}, base, { moving: true, action: { sheet: 'Hero_drink' } }), sets[0]), 'action', "actions win");
assert.strictEqual(C.sheetFor('idle', 'Hero[f8]', sets[0]), 'Hero_idle[f6]');
assert.strictEqual(C.sheetFor('run', 'Hero[f8]', sets[0]), 'Hero_run[f8]');
assert.strictEqual(C.sheetFor('walk', 'Hero[f8]', sets[0]), 'Hero[f8]');
assert.strictEqual(C.sheetFor('idle', 'Hero[f8]', null), 'Hero[f8]');

// Auto-detect finds the variants beside a character's sheet.
const files = ['Hero[f8]', 'Hero_idle[f6]', 'Hero_run[f8]', 'Hero_drink[f4]', 'Heroine', 'Actor1'];
assert.deepStrictEqual(C.autoDetect('Hero[f8]', files), { character: 'Hero[f8]', idle: 'Hero_idle[f6]', run: 'Hero_run[f8]' });
assert.deepStrictEqual(C.autoDetect('Actor1', files), { character: 'Actor1', idle: '', run: '' });

// 5. One-shot actions: play through, optionally loop, then hold or finish.
const action = C.newAction({ sheet: 'Hero_drink[f4]', fps: 8, loops: 1, hold: false });
assert.strictEqual(action.frames, 4, "frame count comes from the sheet name");
assert.deepStrictEqual(C.actionFrame(action, 0), { frame: 0, done: false });
assert.deepStrictEqual(C.actionFrame(action, 15), { frame: 2, done: false });
assert.deepStrictEqual(C.actionFrame(action, 30), { frame: 3, done: true });
const twice = C.newAction({ sheet: 'Hero_drink[f4]', fps: 8, loops: 2 });
assert.deepStrictEqual(C.actionFrame(twice, 37), { frame: 0, done: false }, "the second loop restarts");
const held = C.newAction({ sheet: 'Hero_sleep[f4]', fps: 8, loops: 1, hold: true });
assert.deepStrictEqual(C.actionFrame(held, 300), { frame: 3, done: false }, "held actions stay on their last frame until cleared");
const forever = C.newAction({ sheet: 'Hero_farm[f4]', fps: 8, loops: 0 });
assert.strictEqual(C.actionFrame(forever, 9999).done, false, "0 loops repeats until cleared");

// 6. Diagonals.
assert.strictEqual(C.dir8(4, 2), 1);
assert.strictEqual(C.dir8(6, 2), 3);
assert.strictEqual(C.dir8(4, 8), 7);
assert.strictEqual(C.dir8(6, 8), 9);
assert.deepStrictEqual(C.split8(7), { horz: 4, vert: 8 });
assert.strictEqual(C.split8(2), null);

// 7. Editor: settings and animation sets are undoable world settings; auto-detect fills a row.
const ws = DocsDoodads.Workspace;
ws.showToast = () => {};
ws.refreshSpriteset = () => {};
ws.setWorldSetting('characterAnim.diagonal', true);
assert.strictEqual(DocsDoodads.World.get('characterAnim.diagonal'), true);
ws.characterFileNames = () => files;
ws.addAnimationSet('Hero[f8]');
assert.deepStrictEqual(DocsDoodads.World.get('characterAnim.sets')[0], { character: 'Hero[f8]', idle: 'Hero_idle[f6]', run: 'Hero_run[f8]', idleDelay: 90, idleFps: 6, runFps: 12 });
ws.setAnimationSetField(0, 'idleDelay', 30);
assert.strictEqual(DocsDoodads.World.get('characterAnim.sets')[0].idleDelay, 30);
DocsDoodads.Undo.undo();
DocsDoodads.Undo.undo();
assert.deepStrictEqual(DocsDoodads.World.get('characterAnim.sets'), []);
ws.selectDoodads([]);
ws.selectedAsset = null;
ws.refreshInspector();
assert.ok(el('dd-inspector-content').innerHTML.includes('>Characters<'), "the map panel has a Characters section");

console.log("✓ Sheet tags, direction rows, frame stepping, idle/run states, auto-detect, actions, diagonals and editor sets verified.");
