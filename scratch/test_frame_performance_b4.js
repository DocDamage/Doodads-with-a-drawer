// scratch/test_frame_performance_b4.js
// Phase B4 (§10.1 of docs/CREATOR_IMPROVEMENTS_PLAN.md): the per-frame work on a map with many doodads,
// counted on the stand-in engine, and the caches that removed it still following every change.
// Wall-clock numbers are in scratch/bench_frames.js (not a test: they depend on the machine).
const assert = require('assert');
const E = require('./engine/fake_engine');

console.log("=== Testing Per-frame Performance (B4) ===");

E.install();
E.setupWorld({ width: 60, height: 40, px: 8, py: 6, tilesetMode: 1, tiles: [[30, 20, 5, 10]] });
const N = 300;
const list = [];
for (let i = 0; i < N; i++) {
    const extra = { uid: 'dd_' + i };
    if (i % 25 === 0) extra.light = { enabled: true, when: 'always', radius: 120 };
    if (i % 4 === 0) extra.shadow = { enabled: true };
    if (i % 20 === 1) extra.states = { list: [{ name: 'closed' }, { name: 'open' }], by: 'switch', switchId: 3 };
    if (i % 10 === 2) extra.switch = [[5, true]];
    if (i % 3 === 0) extra.layer = 'props';
    list.push(E.doodad(i % 60, Math.floor(i / 60) * 8, extra));
}
// One wall with a body, on the player's row, and one far off screen.
const wall = E.doodad(10, 6, { uid: 'wall', collision: { preset: 'full', shape: null }, frameW: 48, frameH: 48 });
const far = E.doodad(55, 38, { uid: 'far', light: { enabled: true, when: 'always', radius: 120 }, shadow: { enabled: true } });
list.push(wall, far);
$dataDocsDoodads[1] = list;
$gameSwitches.setValue(5, true);
require('../Docs-Doodads.js');
const D = DocsDoodads;
D.Lighting.setMapSettings(1, { layers: [{ id: 'props', name: 'Props' }], ambient: { darkness: 0.5, color: '#000000', switchId: 0 } });

const counts = {};
const count = (obj, key, label) => {
    const fn = obj[key];
    counts[label] = 0;
    obj[key] = function(...a) { counts[label]++; return fn.apply(this, a); };
};
count(D.Layers, 'list', 'Layers.list');
count(D.Appearance, 'signature', 'signature');
count(D.Appearance, 'parseSwitches', 'parseSwitches');
count(D.Collision, 'bodyOf', 'bodyOf');
count(D.Seasons, 'current', 'Seasons.current');
count(D.PostFX, 'resolveLook', 'resolveLook');
count(D.VisualEquip, 'resolve', 'VisualEquip.resolve');
count(D.MapLayers, 'list', 'MapLayers.list');
const Texture = PIXI.Texture;
counts.textures = 0;
PIXI.Texture = class extends Texture { constructor(...a) { super(...a); counts.textures++; } };
Object.assign(PIXI.Texture, Texture);
const reset = () => { for (const k of Object.keys(counts)) counts[k] = 0; };

const ss = new Spriteset_Map();
SceneManager._scene = { _spriteset: ss };
// The party walks about (characters change frames, so textures would be made).
const walk = n => { for (let i = 0; i < n; i++) { $gamePlayer._pattern = (i % 4); E.frames(ss, 1); } };
walk(20);

// 1. The per-frame calls B4 removed (counted over 30 frames).
reset();
walk(30);
assert.ok(counts['Layers.list'] <= 30 * 2, 'the layer list is built about once a frame, not per doodad: ' + counts['Layers.list']);
assert.strictEqual(counts.signature, 0, 'no appearance signature strings per frame');
assert.strictEqual(counts.parseSwitches, 0, 'switch lists are parsed once, not per doodad per frame');
assert.strictEqual(counts['MapLayers.list'], 0, 'unchanged picture layers are not read again');
assert.strictEqual(counts.textures, 0, 'no textures made per frame once characters have shown their frames');
console.log('✓ Per frame: layers', counts['Layers.list'], '/ 30 frames, no signatures, no switch parsing, no textures.');

// 2. Collision: a step looks at the doodads on its tile, and bodies are made once.
assert.strictEqual($gamePlayer.canPass(9, 6, 6), false, 'the wall blocks');
assert.ok(counts.bodyOf > N, 'the first step builds every body');
reset();
for (let i = 0; i < 20; i++) assert.strictEqual($gamePlayer.canPass(9, 6, 6), false, 'the wall blocks');
assert.strictEqual($gamePlayer.canPass(9, 6, 2), true, 'the tile below is free');
E.frames(ss, 1);
assert.strictEqual($gamePlayer.canPass(9, 6, 6), false, 'still blocked next frame');
assert.strictEqual(counts.bodyOf, 0, 'no body is built again while none moves');
D.api.move({ uid: 'wall' }, 20, 20);
assert.strictEqual($gamePlayer.canPass(9, 6, 6), true, 'a moved doodad frees its tile at once (same frame)');
wall.x = 10 * 48 + 24; wall.y = 7 * 48;
E.frames(ss, 1);
assert.strictEqual($gamePlayer.canPass(9, 6, 6), false, 'moved back by hand: seen on the next frame');
wall.switch = [[9, true]];
assert.strictEqual($gamePlayer.canPass(9, 6, 6), true, 'a switch hides it at once (checked per step, not cached)');
wall.switch = [];
console.log('✓ Collision: bodies by tile, moves seen, switches checked per step.');

// 3. Layers: a layer hidden in game takes effect on the next frame; in the editor at once.
const props = list.find(d => d.layer === 'props');
D.Lighting.setMapSettings(1, { layers: [{ id: 'props', name: 'Props', gameHidden: true }] });
E.frames(ss, 1);
const sprite = d => ss._docsDoodadSprites.find(s => s._data === d);
assert.strictEqual(sprite(props).visible, false, 'a layer hidden in game hides its doodads');
D.Lighting.setMapSettings(1, { layers: [{ id: 'props', name: 'Props' }] });
E.frames(ss, 1);
assert.strictEqual(sprite(props).visible, true, 'and shows them again');

// 4. Appearance: a tint changed in place rebuilds the filters (fields are compared, not a string).
const tinted = list[7];
E.frames(ss, 1);
const before = sprite(tinted).filters;
tinted.r = 80;
E.frames(ss, 1);
assert.notStrictEqual(sprite(tinted).filters, before, 'a new tint rebuilds the filters');
assert.ok(sprite(tinted).filters && sprite(tinted).filters.length === 1, 'with a colour filter');
console.log('✓ Layers and appearance follow changes.');

// 5. Switch lists: one grown in place, and the editor, parse again.
const lit = list[2];
$gameSwitches.setValue(6, false);
E.frames(ss, 1);
assert.strictEqual(sprite(lit).visible, true);
lit.switch.push([6, true]);
E.frames(ss, 1);
assert.strictEqual(sprite(lit).visible, false, 'a switch added to the list in place counts');
lit.switch.pop();

// 6. The season follows its variable at once (no per-frame memo to go stale).
D.World.set('seasons.source', 'variable');
D.World.set('seasons.variableId', 8);
$gameVariables.setValue(8, 2);
assert.strictEqual(D.Atmosphere.season(), 2);
$gameVariables.setValue(8, 3);
assert.strictEqual(D.Atmosphere.season(), 3, 'a season changed mid-frame is read at once');
D.World.set('seasons', undefined);
console.log('✓ Switch lists and the season stay current.');

// 7. Off-screen culling: not drawn, but still "visible" (its light shines on), and never in the editor.
E.frames(ss, 2);
const farSprite = sprite(far);
assert.strictEqual(farSprite.renderable, false, 'an off-screen doodad is not drawn');
assert.strictEqual(farSprite.visible, true, 'but stays visible for lights and collision');
assert.ok(ss._docsLightInfo && ss._docsLightInfo.lights.some(l => l.doodad === far), 'its light is still collected');
const farLight = ss._docsLightInfo.lights.findIndex(l => l.doodad === far);
assert.strictEqual(ss._docsLightSprites[farLight].visible, false, 'but not drawn into the lightmap it cannot reach');
assert.ok(ss._docsLightSprites.some(sp => sp.visible), 'lights near the screen are');
const near = sprite(list[0]);
assert.strictEqual(near.renderable, true, 'an on-screen doodad is drawn');
D.Workspace.mounted = true;
E.frames(ss, 1);
assert.strictEqual(farSprite.renderable, true, 'the editor shows everything');
D.Workspace.mounted = false;
E.frames(ss, 1);
$gamePlayer.locate(50, 34);
$gameMap.setDisplayPos(43, 28);
E.frames(ss, 1);
assert.strictEqual(farSprite.renderable, true, 'drawn again when the camera reaches it');
assert.ok(farSprite._shadowSprite && farSprite._shadowSprite.renderable, 'with its shadow');
$gamePlayer.locate(8, 6); $gameMap.setDisplayPos(0, 0);
console.log('✓ Culling: off-screen doodads skipped, lights kept, editor and camera respected.');

// 8. Light masks: an outline drawn once, then only moved with the camera.
D.World.set('lighting2d', { occlusion: true, wallRegions: '10', rays: 60 });
let polys = 0;
const draw = PIXI.Graphics.prototype.drawPolygon;
PIXI.Graphics.prototype.drawPolygon = function(...a) { polys++; return draw.apply(this, a); };
D.Lighting.setMapSettings(1, { layers: [{ id: 'props', name: 'Props' }], ambient: { darkness: 0.5, color: '#000000', switchId: 0 } });
E.frames(ss, 3);
const drawn = polys;
$gameMap.setDisplayPos(1, 0);
E.frames(ss, 10);
assert.strictEqual(polys, drawn, 'still lights are not traced again as the camera moves');
const masks = (ss._docsLightMasks || []).filter(g => g.visible);
assert.ok(drawn > 0, 'lights near walls are masked');
assert.ok(masks.length > 0 && masks.every(g => g.x === -48), 'masks move with the camera');
PIXI.Graphics.prototype.drawPolygon = draw;
$gameMap.setDisplayPos(0, 0);
D.World.set('lighting2d', undefined);
console.log(`✓ Light masks: ${drawn} outline(s) drawn once, moved with the map.`);

// 9. Post-processing resolves once while nothing changes, and again when the look does.
D.World.set('postfx', { enabled: true, look: { vignette: { enabled: true, amount: 0.4 } } });
E.frames(ss, 1);
reset();
E.frames(ss, 20);
assert.strictEqual(counts.resolveLook, 0, 'a still look is not resolved again');
D.World.set('postfx.look', { vignette: { enabled: true, amount: 0.7 } });
E.frames(ss, 1);
assert.strictEqual(counts.resolveLook, 1, 'a changed look is');
assert.ok(Math.abs(ss._docsPostFx.grade.uniforms.uVignette - 0.7) < 1e-9, 'and its uniforms are set');
D.World.set('postfx', undefined);
console.log('✓ Post-processing resolves only on change.');

// 10. Visual equipment: worked out again only when what it is made from changes.
D.World.set('visualEquip', { enabled: true });
const leader = $gameParty.leader();
let equips = [];
leader.equips = () => equips;
$dataActors[1].note = '<visual: Cape, z -1, part cape>\n<visual color: cape, switch 4, hue 90>';
E.frames(ss, 2);
reset();
E.frames(ss, 20);
assert.strictEqual(counts['VisualEquip.resolve'], 0, 'unchanged gear is not resolved again');
equips = [{ note: '<visual: Hat, z 1, part hat>' }];
E.frames(ss, 1);
assert.strictEqual(counts['VisualEquip.resolve'], 1, 'new equipment is');
reset();
$gameSwitches.setValue(4, true);
E.frames(ss, 1);
assert.strictEqual(counts['VisualEquip.resolve'], 1, 'and a switch a colour rule reads');
D.World.set('visualEquip', undefined);
console.log('✓ Visual equipment resolves only on change.');

// 11. 3D: billboards draw with inset copies and leave the doodads' own textures as they were.
D.Lighting.setMapSettings(1, { perspective: { enabled: true, pitch: 45, viewTiles: 24 } });
E.frames(ss, 3);
const own = near.texture, frame = own.frame;
const fx = frame.x, fw = frame.width;
reset();
E.frames(ss, 5);
assert.strictEqual(near.texture, own, 'a billboard keeps its texture after drawing');
assert.ok(near.texture.frame.x === fx && near.texture.frame.width === fw, 'and its frame');
assert.strictEqual(near.renderable, true, 'a doodad in the 3D picture is drawn');
const listed = new Set(ss._docs3dBillboards.items.map(it => it.obj));
assert.ok(listed.has(near), 'and listed');
assert.ok(!listed.has(farSprite) && farSprite.renderable === false, 'one far outside the 3D picture is neither listed nor drawn');
assert.strictEqual(farSprite.visible, true, 'but stays visible (its light)');
D.Lighting.setMapSettings(1, { perspective: { enabled: false } });
E.frames(ss, 2);
assert.strictEqual(farSprite.renderable, false, 'back on the flat map it is culled by the screen');
console.log('✓ 3D billboards: textures put back; culled by the 3D picture.');

console.log('\nAll per-frame performance (B4) checks passed.');
