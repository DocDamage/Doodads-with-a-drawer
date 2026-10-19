// scratch/test_lpc_slots.js
// LPC creator slots, phase 3: which parts each picker offers (by kind, body, walk, licence), ◀ ▶ through
// them with "None", colours (ramps, variants, skin-following channels), changing the body, the recipe for
// the compositor (Show body, Body add-ons), the dice, parts that went missing, and saved characters.
const assert = require('assert');

console.log('=== Testing LPC Creator Slots ===');

global.window = global;
global.window.addEventListener = () => {};
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: () => false };
global.PluginManager = { parameters: () => ({}) };

require('../Docs-Doodads.js');
const L = DocsDoodads.Lpc, S = DocsDoodads.LpcSlots;

const palettes = L.readPalettes([
    { material: 'body', meta: { default: 'ulpc', base: 'light' }, versions: { ulpc: { light: ['#111111', '#aaaaaa', '#cccccc'], olive: ['#222222', '#bbbbbb', '#dddddd'], brown: ['#333333', '#444444', '#555555'] } } },
    { material: 'cloth', meta: { default: 'ulpc', base: 'white' }, versions: { ulpc: { white: ['#ffffff'], blue: ['#0000ff'], red: ['#ff0000'] } } },
    { material: 'eye', meta: { default: 'ulpc' }, versions: { ulpc: { blue: ['#0000ff'], green: ['#00ff00'] } } }
]);
const part = (id, o) => L.readPart(id, Object.assign({ credits: [{ file: id.split('/')[0], licenses: o.unsafe ? ['CC-BY-SA 3.0'] : ['CC0'], authors: ['A'] }] }, o));
const index = { palettes, parts: [
    part('body/body', { name: 'Body Color', type_name: 'body', match_body_color: true, recolors: { material: 'body' }, layer_1: { zPos: 10, male: 'body/m/', female: 'body/f/' } }),
    part('head/human_male', { name: 'Human Male', type_name: 'head', tags: ['human'], match_body_color: true, recolors: { color_1: { material: 'body' }, color_2: { material: 'eye', source: ['#0000ff'] } }, layer_1: { zPos: 100, male: 'head/m/', female: 'head/m/' } }),
    part('head/human_female', { name: 'Human Female', type_name: 'head', tags: ['human'], match_body_color: true, recolors: { color_1: { material: 'body' } }, layer_1: { zPos: 100, male: 'head/f/', female: 'head/f/' } }),
    part('torso/shirt', { name: 'Shirt', type_name: 'clothes', recolors: { material: 'cloth' }, layer_1: { zPos: 35, male: 'torso/shirt/m/', female: 'torso/shirt/f/' } }),
    part('torso/robe', { name: 'Robe', type_name: 'clothes', variants: ['red', 'blue'], layer_1: { zPos: 35, male: 'torso/robe/' } }),
    part('torso/fancy', { name: 'Fancy', type_name: 'clothes', unsafe: true, layer_1: { zPos: 35, male: 'torso/fancy/' } }),
    part('torso/swim', { name: 'Swimsuit', type_name: 'clothes', animations: ['swim'], layer_1: { zPos: 35, male: 'torso/swim/' } }),
    part('body/wings', { name: 'Wings', type_name: 'wings', layer_1: { zPos: 5, male: 'body/wings/', female: 'body/wings/' } }),
    part('legs/skirt', { name: 'Skirt', type_name: 'legs', layer_1: { zPos: 20, female: 'legs/skirt/' } }),
    part('legs/pants', { name: 'Pants', type_name: 'legs', recolors: { material: 'cloth' }, layer_1: { zPos: 20, male: 'legs/pants/', female: 'legs/pants/' } }),
    part('hat/trim', { name: 'Trim', type_name: 'hat', required_tags: ['tricorn'], layer_1: { zPos: 130, male: 'hat/trim/' } })
] };

// 1. Slots: every slot once; options by kind, body, walk, licence; sorted by name.
const keys = S.allSlots().map(s => s.key);
assert.strictEqual(new Set(keys).size, keys.length, 'each slot once');
assert.deepStrictEqual(S.slot('shirt').card, 'outfit');
assert.deepStrictEqual(S.options(index, S.slot('shirt'), 'male', false).map(p => p.name), ['Fancy', 'Robe', 'Shirt'], 'no swimsuit: it has no walk');
assert.deepStrictEqual(S.options(index, S.slot('shirt'), 'male', true).map(p => p.name), ['Robe', 'Shirt'], 'safe only');
assert.deepStrictEqual(S.options(index, S.slot('shirt'), 'female', true).map(p => p.name), ['Shirt'], 'only parts drawn for the body');
assert.deepStrictEqual(S.options(index, S.slot('legs'), 'male', true).map(p => p.name), ['Pants']);
assert.strictEqual(S.hiddenBySafeOnly(index, [S.slot('shirt'), S.slot('legs')], 'male'), 1, 'what the safe-to-encrypt switch hides');
// Big weapons that only have the library's bigger art (a spear walking on walk_128, a club that only swings) are offered.
const weapons = { palettes, parts: [
    part('weapons/spear', { name: 'Long spear', type_name: 'weapon', animations: ['walk_128', 'thrust_oversize'], layer_1: { zPos: 140, custom_animation: 'walk_128', male: 'w/spear/walk/' } }),
    part('weapons/club', { name: 'Club', type_name: 'weapon', animations: ['slash_reverse_oversize'], layer_1: { zPos: 150, custom_animation: 'slash_reverse_oversize', male: 'w/club/' } }),
    part('body/wheelchair', { name: 'Wheelchair', type_name: 'weapon', animations: ['wheelchair'], layer_1: { zPos: 1, custom_animation: 'wheelchair', male: 'w/chair/' } })
] };
assert.deepStrictEqual(S.options(weapons, S.slot('weapon'), 'male', false).map(p => p.name), ['Club', 'Long spear'], 'other custom animations still are not');
console.log('✓ slots and options');

// 2. A new character: the body and a head that suits it; skin-following channels are not offered.
let st = S.newState(index, 'male', true);
assert.deepStrictEqual(Object.keys(st.slots), ['body', 'head']);
assert.strictEqual(st.slots.body.colour, 'light');
assert.strictEqual(st.slots.head.id, 'head/human_male');
assert.strictEqual(st.slots.head.colour, '', 'the head follows the skin');
assert.strictEqual(st.slots.head.colour2, 'blue', 'its eyes have their own colour');
assert.strictEqual(S.newState(index, 'female', true).slots.head.id, 'head/human_female');
assert.deepStrictEqual(S.colours(index, index.parts.find(p => p.id === 'torso/robe')), ['red', 'blue'], 'fixed colours: the variants');
assert.ok(/^#[0-9a-f]{6}$/i.test(S.swatch(index, index.parts.find(p => p.id === 'torso/robe'), 'blue')));
assert.strictEqual(S.swatch(index, index.parts.find(p => p.id === 'body/body'), 'olive'), '#bbbbbb', 'a ramp shows its middle');
console.log('✓ new character, colours, swatches');

// 3. ◀ ▶ through parts with None; required slots have no None; colours step and wrap.
S.step(st, index, 'shirt', 1, true);
assert.strictEqual(st.slots.shirt.id, 'torso/robe');
assert.strictEqual(st.slots.shirt.colour, 'blue', 'a robe starts blue (a pleasant default that exists)');
S.step(st, index, 'shirt', 1, true);
assert.strictEqual(st.slots.shirt.id, 'torso/shirt');
assert.strictEqual(st.slots.shirt.colour, 'blue', 'the colour carries over when the new part has it');
S.step(st, index, 'shirt', 1, true);
assert.strictEqual(st.slots.shirt, undefined, 'past the last: None');
S.step(st, index, 'shirt', -1, true);
assert.strictEqual(st.slots.shirt.id, 'torso/shirt', 'and back');
S.step(st, index, 'head', 1, true);
S.step(st, index, 'head', 1, true);
assert.ok(st.slots.head, 'a required slot never becomes None');
S.stepColour(st, index, 'shirt', 1);
assert.strictEqual(st.slots.shirt.colour, 'red');
S.stepColour(st, index, 'shirt', 1);
assert.strictEqual(st.slots.shirt.colour, 'white', 'wraps');
S.stepColour(st, index, 'body', -1);
assert.strictEqual(st.slots.body.colour, 'brown');
console.log('✓ stepping parts and colours');

// 4. Changing the body keeps what fits; the recipe follows Show body and Body add-ons.
st.slots.wings = { id: 'body/wings', colour: '' };
S.step(st, index, 'shirt', -1, true); // the robe (male only)
assert.strictEqual(st.slots.shirt.id, 'torso/robe');
let fem = S.setBody(st, index, 'female', true);
assert.strictEqual(fem.body, 'female');
assert.strictEqual(fem.slots.shirt, undefined, 'the robe has no female picture');
assert.strictEqual(fem.slots.wings.id, 'body/wings');
assert.strictEqual(fem.slots.body.colour, 'brown', 'the skin stays');
assert.ok(fem.slots.head, 'a head is kept or found');
const recipe = S.toRecipe(st);
assert.deepStrictEqual(recipe.picks.map(p => p.id), ['body/body', 'head/human_male', 'body/wings', 'torso/robe'], 'in slot order');
assert.deepStrictEqual(recipe.picks[1].colours, ['', 'blue']);
assert.strictEqual(recipe.picks[3].variant, 'blue', 'white is not a robe colour: back to the default');
assert.deepStrictEqual(S.toRecipe(st, { showBody: false }).picks.map(p => p.id), ['torso/robe'], 'only the outfit');
assert.deepStrictEqual(S.toRecipe(st, { addons: false }).picks.map(p => p.id), ['body/body', 'head/human_male', 'torso/robe']);
console.log('✓ body changes and recipes');

// 5. Dice: a whole body or a whole outfit, from what fits, never parts that need tags.
let seed = 3;
const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
for (let i = 0; i < 30; i++) {
    const outfit = S.shuffle(st, index, 'outfit', rand, true);
    assert.strictEqual(outfit.body, st.body, 'the outfit dice keep the body');
    assert.strictEqual(outfit.slots.body, st.slots.body);
    assert.ok(!outfit.slots.hat, 'no hat trim without a tricorn');
    if (outfit.slots.shirt) assert.ok(['torso/robe', 'torso/shirt'].includes(outfit.slots.shirt.id));
    const body = S.shuffle(st, index, 'body', rand, true);
    assert.ok(['male', 'female'].includes(body.body));
    assert.ok(body.slots.body && body.slots.head, 'always a body and a head');
    assert.ok(['light', 'olive', 'brown'].includes(body.slots.body.colour));
    assert.deepStrictEqual(S.missing(body, index, true).filter(k => S.slot(k).card === 'body'), [], 'the body card only holds parts that fit');
}
console.log('✓ dice');

// 6. Missing parts and saved characters.
const odd = { body: 'male', slots: { body: { id: 'body/body', colour: 'light' }, shirt: { id: 'torso/fancy', colour: '' }, legs: { id: 'gone/part' } } };
assert.deepStrictEqual(S.missing(odd, index, true), ['shirt', 'legs'], 'not safe, and gone from the library');
assert.deepStrictEqual(S.missing(odd, index, false), ['legs']);
let saved = S.save(null, '  Robin ', st, '2026-10-19T00:00:00Z');
saved = S.save(saved, 'Ann', fem);
saved = S.save(saved, 'robin', fem);
assert.deepStrictEqual(saved.characters.map(c => c.name), ['Ann', 'robin'], 'by name, a name used again replaces it, sorted');
const loaded = S.load(saved, 'ROBIN');
assert.strictEqual(loaded.body, 'female');
loaded.slots.body.colour = 'x';
assert.notStrictEqual(saved.characters[1].slots.body.colour, 'x', 'a loaded character is a copy');
assert.strictEqual(S.load(saved, 'nobody'), null);
assert.deepStrictEqual(S.remove(saved, 'ann').characters.map(c => c.name), ['robin']);
assert.deepStrictEqual(S.validSaved({ format: 'other' }).characters, []);
console.log('✓ missing parts and saved characters');

console.log('=== LPC creator slots passed ===');
