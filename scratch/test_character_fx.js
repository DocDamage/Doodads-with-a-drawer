// scratch/test_character_fx.js
// Player and event effects: note/comment tags, sun shadows shaped like the sprite (including in tall
// grass), shadows cut short under roofs, and motion blur that follows how fast a character moves.
const assert = require('assert');

console.log("=== Testing Character Shadows & Motion Blur ===");

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
const near = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;

// 1. Tags in an event's note or its page comments.
const Tags = DocsDoodads.CharacterTags;
assert.deepStrictEqual(Tags.parse('<shadow: length 0.8, opacity 0.5>\n<no motion blur>'),
    { shadow: true, shadowLength: 0.8, shadowOpacity: 0.5, motionBlur: false });
assert.deepStrictEqual(Tags.parse('<Shadow>'), { shadow: true });
assert.deepStrictEqual(Tags.parse('<no shadow> <no reflection> <motion blur> <other plugin tag>'),
    { shadow: false, reflect: false, motionBlur: true }, "other plugins' tags are ignored");
assert.deepStrictEqual(Tags.parse(''), {});
// Events read the note plus comments on the active page; the result is cached per page.
const page = { list: [{ code: 108, parameters: ['<shadow>'] }, { code: 408, parameters: ['<motion blur>'] }, { code: 0, parameters: [] }] };
global.$dataMap = { events: [null, { id: 1, note: '<no reflection>', pages: [page] }] };
const event = { eventId: () => 1, _pageIndex: 0, page: () => page, event: () => $dataMap.events[1] };
assert.deepStrictEqual(Tags.forCharacter(event), { reflect: false, shadow: true, motionBlur: true });
assert.strictEqual(Tags.forCharacter(event), Tags.forCharacter(event), "cached until the page changes");
assert.deepStrictEqual(Tags.forCharacter({}), {}, "the player and followers have no tags");

// 2. Who casts a shadow.
const CS = DocsDoodads.CharacterShadow;
const on = { enabled: true, mode: 'all', includePlayer: true };
const npc = { playerLike: false, priorityType: 1, hasImage: true };
assert.strictEqual(CS.enabledFor({ enabled: false, mode: 'all' }, {}, npc), false, "off for the whole game");
assert.strictEqual(CS.enabledFor(on, {}, npc), true);
assert.strictEqual(CS.enabledFor(on, { shadow: false }, npc), false, "<no shadow> opts out");
assert.strictEqual(CS.enabledFor(on, {}, { playerLike: false, priorityType: 0, hasImage: true }), false, "floor events (below characters) cast none");
assert.strictEqual(CS.enabledFor(on, { shadow: true }, { playerLike: false, priorityType: 0, hasImage: true }), true, "unless tagged");
assert.strictEqual(CS.enabledFor(on, {}, { playerLike: false, priorityType: 1, hasImage: false }), false, "no image, no shadow");
const tagged = { enabled: true, mode: 'tagged', includePlayer: true };
assert.strictEqual(CS.enabledFor(tagged, {}, npc), false, "tagged mode: untagged events cast none");
assert.strictEqual(CS.enabledFor(tagged, { shadow: true }, npc), true);
assert.strictEqual(CS.enabledFor(tagged, {}, { playerLike: true, priorityType: 1, hasImage: true }), true, "the party is included");
assert.strictEqual(CS.enabledFor(Object.assign({}, tagged, { includePlayer: false }), {}, { playerLike: true, priorityType: 1, hasImage: true }), false);

// Per-event tag values override the project's length and opacity.
assert.deepStrictEqual(CS.styleFor({ opacity: 0.35, length: 0.6, blur: 1, offsetX: 0, offsetY: 0 }, { shadowLength: 0.9 }),
    { opacity: 0.35, length: 0.9, blur: 1, offsetX: 0, offsetY: 0 });

// 3. The frame the shadow copies. In tall grass MZ draws the character as two half sprites and gives
// the main sprite a zero-width frame; the shadow must rebuild the whole frame, never the whole sheet.
assert.deepStrictEqual(CS.frameFor({ _frame: { x: 48, y: 96, width: 48, height: 48 } }), { x: 48, y: 96, w: 48, h: 48 });
assert.deepStrictEqual(CS.frameFor({
    _frame: { x: 48, y: 96, width: 0, height: 48 }, _bushDepth: 12,
    _upperBody: { _frame: { x: 48, y: 96, width: 48, height: 36 } },
    _lowerBody: { _frame: { x: 48, y: 132, width: 48, height: 12 } }
}), { x: 48, y: 96, w: 48, h: 48 });
assert.strictEqual(CS.frameFor({ _frame: { x: 0, y: 0, width: 0, height: 0 } }), null, "an empty frame draws no shadow");

// 4. Under a roof: the shadow stops where it would enter a blocked region.
const blocked = (x, y) => y < 100; // everything above y=100 is under a roof
assert.ok(near(CS.clipLength(200, 200, 0, 60, blocked), 60), "a shadow in the open keeps its length");
const clipped = CS.clipLength(200, 140, 0, 80, blocked, 4);
assert.ok(clipped <= 40 && clipped >= 36, `pointing north into the roof it stops at the edge (got ${clipped})`);
assert.ok(near(CS.clipLength(200, 140, 180, 80, blocked), 80), "pointing away from the roof it is unaffected");
assert.strictEqual(CS.clipLength(200, 90, 0, 80, blocked), 0, "standing under the roof: no shadow");

// 5. Motion blur: strength follows speed, the direction follows the movement, teleports never smear.
const MB = DocsDoodads.MotionBlur;
const walk = MB.target(1 / 16, 0, 48, 48, 1);
const dash = MB.target(2 / 16, 0, 48, 48, 1);
assert.ok(walk.x > 0 && near(walk.y, 0), "moving right blurs horizontally");
assert.ok(dash.x > walk.x, "dashing blurs more than walking");
assert.ok(MB.target(0, -1 / 16, 48, 48, 1).y < 0, "moving up blurs vertically");
assert.deepStrictEqual(MB.target(3, 0, 48, 48, 1), { x: 0, y: 0 }, "a transfer or jump of several tiles is not motion");
assert.deepStrictEqual(MB.target(0.001, 0, 48, 48, 1), { x: 0, y: 0 }, "standing still has no blur");
assert.ok(Math.abs(MB.target(1, 0, 48, 48, 50).x) <= MB.maxLength, "blur is capped");
// It eases in and out instead of blinking on and off.
const eased = MB.step({ x: 0, y: 0 }, { x: 10, y: 0 }, 0.5);
assert.deepStrictEqual(eased, { x: 5, y: 0 });
assert.deepStrictEqual(MB.step({ x: 0.1, y: 0 }, { x: 0, y: 0 }, 0.5), { x: 0, y: 0 }, "tiny leftovers snap to zero");
// Who gets it: everyone, or only tagged events; the Options menu can switch it off.
assert.strictEqual(MB.enabledFor({ enabled: true, mode: 'all' }, {}, false, true), true);
assert.strictEqual(MB.enabledFor({ enabled: true, mode: 'all' }, {}, false, false), false, "the player turned it off in Options");
assert.strictEqual(MB.enabledFor({ enabled: true, mode: 'tagged' }, {}, false, true), false);
assert.strictEqual(MB.enabledFor({ enabled: true, mode: 'tagged' }, { motionBlur: true }, false, true), true);
assert.strictEqual(MB.enabledFor({ enabled: true, mode: 'all' }, { motionBlur: false }, false, true), false);
assert.strictEqual(MB.enabledFor({ enabled: false, mode: 'all' }, { motionBlur: true }, false, true), false);

console.log("✓ Tags, shadow casting rules, bush frames, roof clipping and motion blur verified.");
