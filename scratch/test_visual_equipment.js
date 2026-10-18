// scratch/test_visual_equipment.js
// Visual equipment: gear notetags draw layers on character sprites (in front or behind by z), hide
// tags stop clipping, colours follow switches/variables, aliases share art across bodies, and
// the same layers show on followers, NPC events, side-view battlers, menus and save files.
const assert = require('assert');

console.log("=== Testing Visual Equipment ===");

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
const V = DocsDoodads.VisualEquip;

// 1. Notetags.
assert.deepStrictEqual(V.parseNote('<visual: Cape_Red, z -1, part cape>').layers,
    [{ image: 'Cape_Red', z: -1, part: 'cape', index: null, sv: '' }]);
assert.deepStrictEqual(V.parseNote('<visual: Helm_Iron>').layers, [{ image: 'Helm_Iron', z: 1, part: 'Helm_Iron', index: null, sv: '' }], "front by default; the part is the image name");
assert.deepStrictEqual(V.parseNote('<visual: Armor_{alias}, z 2, sv SV_Armor_{alias}, index 3>').layers[0],
    { image: 'Armor_{alias}', z: 2, part: 'Armor_{alias}', index: 3, sv: 'SV_Armor_{alias}' });
const helm = V.parseNote('<visual: Helm_Iron, part helmet>\n<visual hide: hair, ears>');
assert.deepStrictEqual(helm.hides, ['hair', 'ears']);
const actorNote = V.parseNote('<visual alias: M>\n<visual base: Hair_Short, part hair, z 2>\n<visual color: hair, switch 12, hue 120>\n<visual color: hair, variable 7>\n<visual color: cape, switch 13, tint #ff8800>');
assert.strictEqual(actorNote.alias, 'M');
assert.deepStrictEqual(actorNote.base.map(l => l.image), ['Hair_Short']);
assert.deepStrictEqual(actorNote.colors, [
    { part: 'hair', switchId: 12, variableId: 0, hue: 120, tint: null },
    { part: 'hair', switchId: 0, variableId: 7, hue: null, tint: null },
    { part: 'cape', switchId: 13, variableId: 0, hue: null, tint: 0xff8800 }
]);
assert.strictEqual(V.parseNote('<visual actor: 4>').actorId, 4, "events can wear an actor's gear");
assert.deepStrictEqual(V.parseNote('just a note').layers, []);

// 2. Putting it together for an actor: base layers, gear, hides, aliases, colours, z order.
const env = { switch: id => id === 12, variable: id => (id === 7 ? 45 : 0) };
const layers = V.resolve({
    actorNote: '<visual alias: M>\n<visual base: Hair_Short, part hair, z 2>\n<visual color: hair, switch 12, hue 120>\n<visual color: cape, switch 13, tint #ff8800>',
    equipNotes: ['<visual: Cape_Red, z -1, part cape>', '<visual: Armor_{alias}, z 1, part body>']
}, env);
assert.deepStrictEqual(layers.map(l => l.image), ['Cape_Red', 'Armor_M', 'Hair_Short'], "sorted by z, alias filled in");
assert.strictEqual(layers.find(l => l.part === 'hair').hue, 120, "switch 12 is on: hair hue 120");
assert.strictEqual(layers.find(l => l.part === 'cape').tint, null, "switch 13 is off: no tint");
const helmeted = V.resolve({
    actorNote: '<visual base: Hair_Short, part hair, z 2>',
    equipNotes: ['<visual: Helm_Iron, part helmet, z 3>\n<visual hide: hair>']
}, env);
assert.deepStrictEqual(helmeted.map(l => l.image), ['Helm_Iron'], "the helmet hides the hair");
const byVariable = V.resolve({ actorNote: '<visual base: Hair, part hair>\n<visual color: hair, variable 7>', equipNotes: [] }, env);
assert.strictEqual(byVariable[0].hue, 45, "variable 7 sets the hue");
assert.deepStrictEqual(V.resolve({ actorNote: '', equipNotes: [null, '', 'nothing'] }, env), []);
// NPC events: their own layers and hides on top of a mirrored actor's gear.
const npc = V.resolve({ actorNote: '<visual base: Hair, part hair>', equipNotes: ['<visual: Hat, part hat>'], extraNotes: ['<visual: Beard, z 2>\n<visual hide: hat>'] }, env);
assert.deepStrictEqual(npc.map(l => l.image), ['Hair', 'Beard']);
assert.ok(V.signature(layers) !== V.signature(helmeted), "signature changes with the look");

// 3. Which part of a layer sheet matches the character's current frame.
// 8-character sheets (576x384): block by index, 3 frames x 4 rows of 48x48.
assert.deepStrictEqual(V.frameRect('Armor', 576, 384, 5, 2, 3), { x: (3 + 2) * 48, y: (4 + 3) * 48, w: 48, h: 48 });
// $ single sheets (144x192).
assert.deepStrictEqual(V.frameRect('$Cape', 144, 192, 5, 1, 2), { x: 48, y: 96, w: 48, h: 48 });
// Tagged sheets follow their own layout; frames wrap and rows clamp.
assert.deepStrictEqual(V.frameRect('Robe[f6]', 288, 192, 0, 7, 1), { x: 48, y: 48, w: 48, h: 48 });
assert.deepStrictEqual(V.frameRect('Wings[f4][d1]', 192, 48, 0, 2, 3), { x: 96, y: 0, w: 48, h: 48 });
// Side-view battlers: the same cell of a 9x6 sheet.
assert.deepStrictEqual(V.svRect(576, 384, { x: 128, y: 64, width: 64, height: 64 }, 576, 384), { x: 128, y: 64, w: 64, h: 64 });
assert.deepStrictEqual(V.svRect(288, 192, { x: 128, y: 64, width: 64, height: 64 }, 576, 384), { x: 64, y: 32, w: 32, h: 32 }, "scaled to the layer's own size");

// 4. Save files remember each member's layers so the load screen can draw them.
const info = V.savefileLayers([layers, []]);
assert.deepStrictEqual(info[0].map(l => l.image), ['Cape_Red', 'Armor_M', 'Hair_Short']);
assert.deepStrictEqual(Object.keys(info[0][0]).sort(), ['hue', 'image', 'index', 'tint', 'z'], "only what drawing needs");

// 5. Menus and save files recolour layer pixels themselves (hue like MZ's sprites, then tint).
const px = V.recolor(new Uint8ClampedArray([255, 0, 0, 255, 255, 255, 255, 255, 9, 9, 9, 0]), 120, null);
assert.deepStrictEqual(Array.from(px.slice(0, 4)), [0, 255, 0, 255], "red turned 120 degrees is green");
assert.deepStrictEqual(Array.from(px.slice(4, 8)), [255, 255, 255, 255], "white has no hue");
assert.deepStrictEqual(Array.from(px.slice(8)), [9, 9, 9, 0], "transparent pixels are skipped");
assert.deepStrictEqual(Array.from(V.recolor(new Uint8ClampedArray([255, 255, 255, 255]), 0, 0x808000)), [128, 128, 0, 255]);

// 6. Events: tags in the note or page comments, an actor's look with <visual actor: N>, and nothing
// on a page without an image. (Classes defined after loading, so no game hooks are installed.)
global.Game_Event = class {
    constructor(note, image, comments) { this._note = note; this._image = image; this._pageIndex = 0; this._list = (comments || []).map(c => ({ code: 108, parameters: [c] })); }
    event() { return { note: this._note }; }
    page() { return { list: this._list }; }
    characterName() { return this._image; }
    characterIndex() { return 0; }
};
global.$gameSwitches = { value: () => false };
global.$gameVariables = { value: () => 0 };
global.$gameActors = { actor: id => (id === 2 ? { _docsVisual: null, actor: () => ({ note: '<visual base: Braid, part hair>' }), currentClass: () => ({ note: '' }),
    equips: () => [{ note: '<visual: Hat, z 2>' }], states: () => [] } : null) };
const npc1 = new Game_Event('<visual: Apron>', 'People1');
assert.deepStrictEqual(V.layersForCharacter(npc1).map(l => l.image), ['Apron']);
assert.deepStrictEqual(V.layersForCharacter(new Game_Event('', 'People1', ['<visual: Scarf>'])).map(l => l.image), ['Scarf'], "page comments count");
assert.deepStrictEqual(V.layersForCharacter(new Game_Event('<visual actor: 2>', 'Actor1')).map(l => l.image), ['Braid', 'Hat'], "wears actor 2's look");
assert.deepStrictEqual(V.layersForCharacter(new Game_Event('<visual actor: 2>', '')), [], "no image on this page: no gear");
assert.deepStrictEqual(V.layersForCharacter(new Game_Event('just a sign', 'Sign')), []);

console.log("✓ Notetags, resolution (base, gear, hides, aliases, colours, NPCs), frame matching, side-view cells, save info, recolouring and event rules verified.");
