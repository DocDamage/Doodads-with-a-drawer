'use strict';
// 9.2.2 Indoors by region: the pure mask and blends, rain hidden over indoor tiles (flat MZ weather and 3D drops),
// no sway or sun shadow indoors, eased darkness, dimmed lightning, quieter weather sound, and the old path when
// a map marks nothing.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const E = require('./engine/fake_engine');

process.chdir(fs.mkdtempSync(path.join(os.tmpdir(), 'dd-indoors-')));
E.install();
const W = 20, H = 15;
E.setupWorld({ width: W, height: H, px: 3, py: 3 });
// A house: region 7 on x 10..13, y 4..7.
for (let y = 4; y <= 7; y++) for (let x = 10; x <= 13; x++) $dataMap.data[(5 * H + y) * W + x] = 7;
const inside = E.doodad(11, 5, { uid: 'inside', motion: { type: 'sway', amount: 1 }, shadow: { enabled: true, followSun: true } });
const outside = E.doodad(3, 5, { uid: 'outside', motion: { type: 'sway', amount: 1 }, shadow: { enabled: true, followSun: true } });
$dataDocsDoodads[1] = [inside, outside];
require('../Docs-Doodads.js');
const D = DocsDoodads, I = D.Indoors;

// ---- Pure ----
assert.strictEqual(I.settingsFor(null), null);
assert.strictEqual(I.settingsFor({ indoors: { regions: '' } }), null, 'no regions is no indoors');
assert.deepStrictEqual(I.normalize({ regions: ' 7, 8 ', darkness: 3, quiet: -1 }), { regions: '7, 8', darkness: 1, quiet: 0 });
assert.strictEqual(I.normalize({ darkness: '' }).darkness, null);
assert.ok(I.isIndoors({ indoors: { regions: '7 8' } }, 8));
assert.ok(!I.isIndoors({ indoors: { regions: '7 8' } }, 9));
const regionAt = (x, y) => (x >= 1 && x <= 2 && y === 1 ? 4 : 0);
const m = I.mask(regionAt, 4, 3, new Set([4]));
assert.deepStrictEqual(Array.from(m), [0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0]);
assert.strictEqual(I.mask(regionAt, 4, 3, new Set([5])), null, 'a map with no indoor tiles makes no mask');
assert.strictEqual(I.mask(regionAt, 4, 3, new Set()), null);
assert.ok(I.at(m, 4, 3, 1, 1) && !I.at(m, 4, 3, 0, 1));
assert.ok(I.at(m, 4, 3, 5, 1, true, false), 'a looping map wraps the mask');
assert.ok(!I.at(m, 4, 3, 5, 1, false, false), 'beyond the edge is outdoors');
assert.strictEqual(I.ease(0, true, 1 / 60) > 0, true);
assert.strictEqual(I.ease(1, true, 1), 1);
assert.strictEqual(I.ease(0.2, false, 1), 0);
const set = { indoors: { regions: '7', darkness: 0.8, quiet: 0.2 } };
assert.strictEqual(I.ambient({ darkness: 0, color: '#000000' }, set, 1).darkness, 0.8);
assert.strictEqual(I.ambient({ darkness: 0.2, color: '#000000' }, set, 0.5).darkness, 0.5);
// By day the clock's colour is white: inside, it moves to the plain ambient colour so the darkness shows.
const day = I.ambient({ darkness: 0, color: '#ffffff' }, set, 1);
assert.strictEqual(day.darkness, 0.8);
assert.strictEqual(day.color, DocsDoodads.Lighting.ambientDefaults.color, 'a white day colour is not kept inside');
assert.strictEqual(I.ambient({ darkness: 0.9, color: '#2a2050' }, set, 1).color, '#2a2050', 'darker outside keeps its own colour');
const same = { darkness: 0.3 };
assert.strictEqual(I.ambient(same, { indoors: { regions: '7' } }, 1), same, 'no indoor darkness keeps the map\'s');
assert.ok(Math.abs(I.volume(set, 1) - 0.2) < 1e-9);
assert.strictEqual(I.volume(set, 0), 1);
assert.strictEqual(I.flash(100, 1), 40);
assert.strictEqual(I.flash(100, 0), 100);

// ---- No regions: the old path ----
assert.strictEqual(I.current(), null);
assert.ok(!I.tile(11, 5));
D.World.settings().weather2d = { wind: { strength: 1, direction: 1, gusts: 0, fromWeather: false } };
const ss = new Spriteset_Map();
SceneManager._scene = { _spriteset: ss };
E.frames(ss, 2);
const sprite = uid => ss._docsDoodadSprites.find(s => s._data.uid === uid);
assert.ok(sprite('inside')._shadowSprite, 'without indoor regions the sun shadow is drawn');
assert.strictEqual(I.windX(inside), D.Wind.current().x);

// ---- Marked ----
D.Lighting.setMapSettings(1, Object.assign({}, D.Lighting.mapSettings(1), set));
const c = I.current();
assert.ok(c && c.mask, 'the mask is made');
assert.ok(I.tile(10, 4) && I.tile(13, 7) && !I.tile(9, 4) && !I.tile(14, 7));
assert.strictEqual(I.current(), c, 'made once');
$dataMap.data[(5 * H + 2) * W + 2] = 7;
I.invalidate();
assert.ok(I.tile(2, 2), 'repainting a region rebuilds the mask');
$dataMap.data[(5 * H + 2) * W + 2] = 0;
I.invalidate();
assert.ok(I.doodad(inside) && !I.doodad(outside));
if (D.Wind.current().x) assert.strictEqual(I.windX(inside), 0, 'no wind indoors');
assert.strictEqual(I.windX(outside), D.Wind.current().x);
E.frames(ss, 2);
assert.ok(!sprite('inside')._shadowSprite, 'no sun shadow indoors');
assert.ok(sprite('outside')._shadowSprite, 'the street keeps its shadows');

// Flat weather: drops whose screen point is over an indoor tile are hidden; the rest stay.
const drop = (sx, sy) => { const s = new PIXI.Sprite(); s.x = sx; s.y = sy; return s; };
const tw = $gameMap.tileWidth();
const dry = drop(11 * tw + 5 - $gameMap.displayX() * tw, 5 * tw + 5 - $gameMap.displayY() * tw);
const wet = drop(2 * tw + 5 - $gameMap.displayX() * tw, 2 * tw + 5 - $gameMap.displayY() * tw);
ss._weather._sprites = [dry, wet];
E.frames(ss, 1);
assert.strictEqual(dry.visible, false, 'rain stops at the door');
assert.strictEqual(wet.visible, true, 'and falls in the street');

// The player walks in: darkness eases to the indoor darkness, lightning and sound soften.
AudioManager._bgsVolume = 100;
AudioManager._currentBgs = { name: 'Rain', volume: 80 };
AudioManager._bgsBuffer = { volume: 0.8 };
$gameScreen.changeWeather('rain', 5);
$gamePlayer.locate(11, 5);
E.frames(ss, 40);
assert.strictEqual(I.blend, 1, 'eased fully inside');
assert.ok(Math.abs(AudioManager._bgsBuffer.volume - 0.8 * 0.2) < 1e-9, 'the rain is heard quietly');
const lit = ss._docsNormalLightInfo;
assert.ok(lit && lit.base, 'lighting ran');
$gamePlayer.locate(3, 3);
E.frames(ss, 40);
assert.strictEqual(I.blend, 0, 'eased back outside');
assert.ok(Math.abs(AudioManager._bgsBuffer.volume - 0.8) < 1e-9, 'full volume outside');

// Clearing the regions restores every drop.
D.Lighting.setMapSettings(1, Object.assign({}, D.Lighting.mapSettings(1), { indoors: undefined }));
E.frames(ss, 1);
assert.strictEqual(dry.visible, true, 'no mask: every drop shows again');

// The Regions legend names indoor regions.
{
    const section = D.Workspace.mapSections.find(s => /dd-indoors-sec/.test(s.render.call(D.Workspace, {})));
    assert.ok(section, 'the Indoors map section is there');
    assert.ok(/value="7"/.test(section.render.call(D.Workspace, set)));
}
assert.deepStrictEqual(D.Regions.uses({}, set)[7], ['indoors']);

console.log('test_indoors: OK');
