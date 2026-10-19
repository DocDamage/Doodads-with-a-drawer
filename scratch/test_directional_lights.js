// scratch/test_directional_lights.js
// Shaped lights (6.2.8): cones that point a way, presets, the player's flashlight, and walls that stop
// light on flat maps (a mask from rays cast across the tiles). On the stand-in engine.
const assert = require('assert');
const E = require('./engine/fake_engine');

console.log('=== Testing Cone Lights, the Flashlight and Wall Shadows ===');

E.install();
// A 20 x 12 room: a wall down column 10 (tiles with every passage closed).
const WALL = 30;
const tiles = [];
for (let y = 0; y < 12; y++) tiles.push([10, y, 0, WALL]);
E.setupWorld({ width: 20, height: 12, px: 4, py: 6, tilesetMode: 0, tiles, flags: { [WALL]: 0x0f } });
const commands = {};
const register = PluginManager.registerCommand;
PluginManager.registerCommand = (plugin, name, fn) => { commands[name] = fn; if (register) register.call(PluginManager, plugin, name, fn); };
require('../Docs-Doodads.js');
const D = DocsDoodads, L = D.Lighting, O = D.Occlusion, F = D.Flashlight, P = D.LightPresets;

// 1. Presets set the look of a light, keep where it is and whether it is on.
const torch = P.apply({ enabled: true, offsetX: 4, offsetY: -30, color: '#000000' }, 'torch');
assert.strictEqual(torch.color, '#ff9a3c');
assert.strictEqual(torch.preset, 'torch');
assert.deepStrictEqual([torch.enabled, torch.offsetX, torch.offsetY], [true, 4, -30]);
assert.strictEqual(P.apply({ color: '#123456' }, 'nope').preset, '', 'an unknown preset changes nothing but the name');
assert.strictEqual(P.apply({}, 'spotlight').shape, 'cone');
// Through Details: one edit, one undo step.
const ws = D.Workspace;
ws.refreshSpriteset = () => {};
const lamp = E.doodad(5, 5, { light: { enabled: true, radius: 100 } });
ws.setDoodadProperty([lamp], 'light.preset', 'neonBlue');
assert.strictEqual(lamp.light.color, '#38d6ff');
assert.strictEqual(lamp.light.enabled, true);
D.Undo.undo();
assert.strictEqual(lamp.light.color, undefined, 'undone');
console.log('✓ presets: colour, size and shape, position kept, undoable');

// 2. collect() carries the shape, direction and where on the map.
const cone = E.doodad(5, 6, { light: { enabled: true, shape: 'cone', angle: 450, spread: 500, radius: 200, offsetY: -20 } });
const got = L.collect([cone], { x: 48, y: 0 })[0];
assert.deepStrictEqual([got.shape, got.angle, got.spread], ['cone', 90, 180]);
assert.deepStrictEqual([got.mapX, got.mapY], [cone.x, cone.y - 20]);
assert.deepStrictEqual([got.x, got.y], [cone.x - 48, cone.y - 20]);

// 3. Rays: a wall stops them; the light's own tile doesn't; a cone only casts across its width.
const isWall = (x, y) => x === 10;
const toWall = O.cast(4 * 48 + 24, 6 * 48 + 24, 1, 0, 1000, isWall, 48, 48, 4, 6);
assert.ok(Math.abs(toWall - (10 * 48 - (4 * 48 + 24))) < 1e-6, 'stops at the wall\'s near edge: ' + toWall);
assert.strictEqual(O.cast(4 * 48 + 24, 6 * 48 + 24, -1, 0, 100, isWall, 48, 48, 4, 6), 100, 'nothing that way: the radius');
assert.strictEqual(O.cast(10 * 48 + 24, 6 * 48 + 24, 1, 0, 100, isWall, 48, 48, 10, 6), 100, 'a lamp standing in the wall shines out of it');
const round = O.visibility(200, 300, 500, isWall, 48, 48, { rays: 16 });
assert.strictEqual(round.length, 2 + 17 * 2, 'a fan: the centre, then every ray, closed');
assert.ok(Math.max(...round.filter((v, i) => i % 2 === 0)) <= 10 * 48 + 1e-6, 'nothing past the wall');
const fan = O.visibility(200, 300, 500, () => false, 48, 48, { rays: 360, angle: 0, spread: 90 });
const angles = [];
for (let i = 2; i < fan.length; i += 2) angles.push(Math.atan2(fan[i + 1] - 300, fan[i] - 200) * 180 / Math.PI);
assert.ok(Math.min(...angles) >= -45.01 && Math.max(...angles) <= 45.01, 'the cone\'s rays stay inside it');
assert.strictEqual(O.appliesTo({ occlude: 'world' }, { occlusion: true }), true);
assert.strictEqual(O.appliesTo({ occlude: 'off' }, { occlusion: true }), false);
assert.strictEqual(O.appliesTo({ occlude: 'on' }, { occlusion: false }), true);
console.log('✓ rays: walls stop them, the lamp\'s own tile doesn\'t, cones stay in their width');

// 4. The flashlight: on by World > Lighting (and its switch), the command wins; it turns to face.
assert.strictEqual(F.isOn(), false);
D.World.set('lighting2d.flashlight.enabled', true);
assert.strictEqual(F.isOn(), true);
D.World.set('lighting2d.flashlight.switchId', 7);
assert.strictEqual(F.isOn(id => id === 7 ? false : true), false, 'its switch is off');
commands.flashlight({ state: 'on' });
assert.strictEqual(F.isOn(() => false), true, 'the command turns it on anyway');
commands.flashlight({ state: 'off' });
assert.strictEqual(F.isOn(() => true), false);
commands.flashlight({ state: 'world' });
D.World.set('lighting2d.flashlight.switchId', 0);
assert.deepStrictEqual([2, 4, 6, 8].map(d => F.angleFor(d)), [90, 180, 0, 270]);
assert.strictEqual(F.turn(0, 90, 18), 18);
assert.strictEqual(F.turn(350, 10, 18), 8, 'the short way round');
assert.strictEqual(F.turn(85, 90, 18), 90);
console.log('✓ the flashlight: world setting, its switch, the command, turning to face');

// 5. On the map: cones drawn as cones, walls masking them, the flashlight added.
D.Lighting.setMapSettings(1, { ambient: { darkness: 0.8, color: '#101830', switchId: 0 } });
D.World.set('lighting2d.occlusion', true);
$dataDocsDoodads[1] = [
    E.doodad(5, 6, { light: { enabled: true, radius: 300, shape: 'round' } }),
    E.doodad(6, 3, { light: { enabled: true, radius: 300, shape: 'cone', angle: 0, spread: 40, occlude: 'off' } })
];
const ss = new Spriteset_Map();
SceneManager._scene = { _spriteset: ss };
E.frames(ss, 3);
assert.ok(ss._docsLightOverlay.visible, 'the lightmap is drawn');
const sprites = ss._docsLightSprites.filter(s => s.visible);
assert.strictEqual(sprites.length, 3, 'two lamps and the flashlight');
assert.ok(sprites[0].mask && sprites[0].mask.visible, 'the round lamp is masked by the walls');
assert.ok(!sprites[1].mask, 'a light set not to stop at walls has no mask');
assert.strictEqual(sprites[1].anchor.x, 0, 'a cone from its tip');
assert.strictEqual(sprites[1].texture, D.Lighting.coneTexture(40));
assert.ok(sprites[2].mask, 'the flashlight is stopped by walls too');
assert.strictEqual(sprites[2].rotation, Math.PI / 2, 'pointing down, as the player faces');
const outlines = O._walls.outlines.size;
E.frames(ss, 3);
assert.strictEqual(O._walls.outlines.size, outlines, 'outlines are kept while nothing moves');
$gamePlayer.setDirection(6);
E.frames(ss, 10);
assert.strictEqual(ss._docsFlashAngle, 0, 'it turned to the right');
// Turning the flashlight off and occlusion off: no masks left showing.
commands.flashlight({ state: 'off' });
D.World.set('lighting2d.occlusion', false);
E.frames(ss, 2);
assert.strictEqual(ss._docsLightSprites.filter(s => s.visible).length, 2);
assert.ok(ss._docsLightMasks.every(g => !g.visible), 'masks put away');
assert.ok(!ss._docsLightSprites[0].mask);
console.log('✓ on the map: cones, wall masks, the flashlight facing the player');

console.log('=== Cone lights, the flashlight and wall shadows passed ===');
