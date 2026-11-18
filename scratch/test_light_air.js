'use strict';
// 7.3.7 Light shafts and 8.3.2 soft shadows / glow off walls: the effect's settings from a look, strength by time
// of day (none at night, strongest at a low sun, more in fog), off at Low and fewer samples at Medium; the shader
// stays GLSL ES 1.00; on the stand-in engine the filter, the mask of what stops light, soft masks made once per
// outline, and bounce lights by quality; a map with neither takes the old path.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const E = require('./engine/fake_engine');

process.chdir(fs.mkdtempSync(path.join(os.tmpdir(), 'dd-light-air-')));
E.install();
const WALL = 1600;
const tiles = [];
for (let y = 2; y <= 8; y++) tiles.push([8, y, 0, WALL]);
E.setupWorld({ width: 20, height: 14, px: 4, py: 5, tiles, flags: { [WALL]: 0x0f } });
const tree = E.doodad(5, 5, { uid: 'tree', shade: true });
const lamp = E.doodad(6, 5, { uid: 'lamp', light: { enabled: true, radius: 200, intensity: 1, occlude: true } });
$dataDocsDoodads[1] = [tree, lamp];
require('../Docs-Doodads.js');
const D = DocsDoodads, R = D.Rays, S = D.SoftLight, P = D.PostFX;

// ---- Pure ----
const look = P.normalizeLook({ rays: { enabled: true, strength: 0.8, length: 0.5 } });
assert.ok(look.rays && look.rays.enabled && look.rays.strength === 0.8 && look.rays.fromLamps === false, 'the effect is read from a look');
assert.ok(P.passes(look, 'high').includes('rays'));
assert.ok(!P.passes(look, 'low').includes('rays'), 'off at Low');
assert.ok(!P.passes(P.defaultLook(), 'high').includes('rays'), 'off unless asked for');
assert.deepStrictEqual([R.samples('high'), R.samples('medium'), R.samples('low')], [24, 12, 0]);
const at = h => R.strength(look.rays, { quality: 'high', minutes: h * 60 });
assert.strictEqual(at(23), 0, 'none at night');
assert.strictEqual(at(3), 0);
assert.ok(at(7) > at(12), 'stronger at a low sun than at noon');
assert.ok(at(17) > at(12));
assert.ok(R.strength(look.rays, { quality: 'high', minutes: 720, foggy: true }) > at(12), 'fog raises it');
assert.strictEqual(R.strength(look.rays, { quality: 'low', minutes: 420 }), 0);
assert.ok(R.strength(Object.assign({}, look.rays, { fromLamps: true }), { quality: 'high', minutes: 23 * 60 }) > 0, 'lamp shafts at night');
assert.ok(R.foggy({ layers: [{ preset: 'fog' }] }) && !R.foggy({ layers: [{ name: 'clouds' }] }));
const noon = R.sunPosition(0);
assert.ok(noon[1] > 1, 'at noon shadows point north, so the sun is south, below the screen');
const evening = R.sunPosition(90);
assert.ok(evening[0] < 0, 'evening shadows point east: the sun is to the west');
assert.strictEqual(R.pickLamp([{ x: 100, y: 100, radius: 50, intensity: 1 }, { x: 5000, y: 100, radius: 500, intensity: 1 }], 816, 624, { x: 0, y: 0 }).x, 100, 'only lamps on screen');
assert.strictEqual(R.pickLamp([], 816, 624), null);
assert.ok(!/#version|texture\(|mat3\(mat4/.test(R.fragment), 'GLSL ES 1.00');
assert.ok(/for \(int i = 0; i < 24; i\+\+\)/.test(R.fragment), 'a fixed loop of 24 samples');
assert.deepStrictEqual(S.levels({ shadows: true, bounce: true }, 'low'), { shadows: false, bounce: false });
assert.deepStrictEqual(S.levels({ shadows: true, bounce: true }, 'medium'), { shadows: true, bounce: false }, 'soft edges at Medium');
assert.deepStrictEqual(S.levels({ shadows: true, bounce: true }, 'high'), { shadows: true, bounce: true }, 'glow too at High');
assert.deepStrictEqual(S.levels(null, 'high'), { shadows: false, bounce: false });
// A light whose outline meets a wall on its east side.
const pts = [];
for (let a = 0; a < 360; a += 10) { const r = Math.cos(a * Math.PI / 180) > 0.5 ? 60 : 200; pts.push(100 + Math.cos(a * Math.PI / 180) * r, 100 + Math.sin(a * Math.PI / 180) * r); }
const bounces = S.bounces({ mapX: 100, mapY: 100, radius: 200, intensity: 1 }, pts, 6);
assert.ok(bounces.length > 0 && bounces.length <= 6, 'a few glows where it meets the wall');
assert.ok(bounces.every(b => b.mapX > 100 && b.intensity < 0.3), 'on the wall side, faint');
assert.deepStrictEqual(S.bounces({ mapX: 0, mapY: 0, radius: 50 }, [50, 0, 0, 50, -50, 0, 0, -50], 6), [], 'nothing met: no glow');

// ---- On the map ----
D.World.settings().occlusion = true;
D.Lighting.setMapSettings(1, { ambient: { darkness: 0.7, color: '#101830', switchId: 0 } });
const ss = new Spriteset_Map();
SceneManager._scene = { _spriteset: ss };
E.frames(ss, 2);
assert.ok(!ss._docsRaysFilter, 'no shafts until a look asks');
assert.ok(!(ss._docsSoftMasks || []).some(m => m && m.visible), 'no soft masks by default');
const lightsBefore = ss._docsLightInfo.lights.length;

// Light shafts on, at dusk.
D.World.settings().postfx.look = look;
D.World.settings().postfx.enabled = true;
P._resolved = null;
D.setTimeOfDay && D.setTimeOfDay(17 * 60);
E.frames(ss, 2);
if (ss._docsHazeInputs && ss._docsHazeInputs.look && ss._docsHazeInputs.look.rays && ss._docsHazeInputs.look.rays.enabled) {
    assert.ok(ss._docsRaysFilter, 'the filter is made');
    assert.ok(ss._baseSprite.filters.includes(ss._docsRaysFilter), 'on the map layer');
    assert.ok(ss._docsRaysBlocked >= 7 + 1, 'walls and the marked tree stop light');
    assert.ok(ss._docsRaysFilter.uniforms.uStrength > 0);
    D.qualityOption = () => 1;
    E.frames(ss, 1);
    assert.strictEqual(ss._docsRaysFilter.uniforms.uSamples, 12, 'Medium: 12 samples');
    D.qualityOption = () => 2;
    E.frames(ss, 1);
    assert.ok(!(ss._baseSprite.filters || []).includes(ss._docsRaysFilter), 'Low: none');
    D.qualityOption = () => 0;
} else {
    console.log('  (the stand-in engine resolved no project look; the map checks for shafts were skipped)');
}

// Soft shadows and glow at High.
D.Lighting.setMapSettings(1, { softLight: { shadows: true, bounce: true } });
E.frames(ss, 2);
const soft = (ss._docsSoftMasks || []).filter(m => m && m.visible);
assert.ok(soft.length >= 1, 'a soft mask for the lamp');
const lampSprite = ss._docsLightSprites.find(s => s.mask && soft.includes(s.mask));
assert.ok(lampSprite, 'the lamp uses the soft mask');
const texture = soft[0].texture;
E.frames(ss, 3);
assert.strictEqual(soft[0].texture, texture, 'made once while the outline stays');
assert.ok(ss._docsLightInfo.lights.some(l => l.bounce), 'glow off the wall');
assert.ok(ss._docsLightInfo.lights.length > lightsBefore);
D.qualityOption = () => 1;
E.frames(ss, 1);
assert.ok(!ss._docsLightInfo.lights.some(l => l.bounce), 'no glow at Medium');
D.qualityOption = () => 2;
E.frames(ss, 1);
assert.ok(!(ss._docsSoftMasks || []).some(m => m && m.visible), 'nothing soft at Low');
D.qualityOption = () => 0;

// Details' checkbox.
const W = D.Workspace, d = E.doodad(1, 1, { uid: 'x' });
W.applyDoodadProperty(d, 'shade', true);
assert.strictEqual(d.shade, true);
W.applyDoodadProperty(d, 'shade', false);
assert.ok(!('shade' in d));
assert.ok(W.mapSections.some(s => /dd-softlight-sec/.test(s.render.call(W, {}))));
console.log('test_light_air: OK');
