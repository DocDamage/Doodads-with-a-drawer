// scratch/test_engine_map.js
// The drawing code, run on a stand-in engine (scratch/engine/fake_engine.js): a map spriteset with
// doodads (lights, shadows, particles, sounds) in 2D, then the same map in the 3D view with terrain,
// water, weather, standing tileset objects, snow, clouds, see-through, models, the minimap, a menu
// round trip and leaving 3D. Nothing is drawn; this checks every path runs and leaves sane state.
const assert = require('assert');
const path = require('path');
const E = require('./engine/fake_engine');

console.log("=== Testing Map Drawing on a Stand-in Engine ===");

E.install();
const TREE = 10, TRUNK = 18;
const world = E.setupWorld({
    width: 40, height: 30, px: 20, py: 15, tilesetMode: 0,
    tiles: [[5, 5, 2, TREE], [5, 6, 2, TRUNK], [12, 8, 0, 2048], [13, 8, 0, 2048], [12, 9, 0, 2048]],
    flags: { [TREE]: 0x10, [TRUNK]: 0x0f }
});
$dataDocsDoodads[1] = [
    E.doodad(18, 14, { light: { enabled: true, when: 'always', radius: 160 }, shadow: { enabled: true } }),
    E.doodad(22, 14, { particles: { preset: 'fire', rateScale: 1, layer: 'above', offsetX: 0, offsetY: 0 } }),
    E.doodad(20, 12, { frameH: 144, seeThrough: 'on' }),
    E.doodad(25, 18, { sound: { file: 'bgs/River', volume: 80, pitch: 100, radius: 6 } }),
    E.doodad(14, 10, { model: { path: path.join(__dirname, 'fixtures', 'crate.glb'), scale: 1, yaw: 30 } })
];
require('../Docs-Doodads.js');

const errors = [];
const run = (label, fn) => { try { fn(); } catch (e) { errors.push(label + ': ' + (e.stack || e.message)); } };

// 1. Flat map: the doodad layer and lighting are built and updated.
const ss = new Spriteset_Map();
SceneManager._scene = { _spriteset: ss };
run('2D frames', () => E.frames(ss, 20));
assert.deepStrictEqual(errors, []);
assert.strictEqual(ss._docsDoodadSprites.length, 5, 'a sprite per doodad');
assert.ok(ss._docsLightOverlay, 'lighting overlay');
assert.ok(!ss._docs3d, 'flat');

// 2. 3D view with most things on.
const settings = DocsDoodads.Lighting.setMapSettings(1, {
    perspective: { enabled: true, pitch: 45, viewTiles: 24, fogStart: 8, fogEnd: 11, standTiles: 'star', snowCover: true, clouds: 0.5, mist: 0.5, minimap: true },
    terrain: { enabled: true, style: 'smooth', auto: false, regions: [], paint: { '10,10': 2, '11,10': 2, '10,11': 1 } },
    ambient: { darkness: 0.4, color: '#101830', switchId: 0 }
});
assert.ok(settings);
$gameScreen.changeWeather('storm', 9);
$gameSystem._docsSnowCover = 0.6;
run('3D frames', () => E.frames(ss, 15));
assert.deepStrictEqual(errors, []);
assert.ok(ss._docs3d, 'in 3D');
assert.ok(ss._docsTerrainTopo && ss._docsTerrainTopo.order.length > 0, 'terrain triangles drawn');
assert.ok(ss._docs3dBillboards.items.length > 5, 'billboards listed');
assert.ok(ss._docsStand && ss._docsStand.list.length === 1, 'the tree stands up');
assert.ok(ss._docs3dWeatherBands && ss._docs3dWeatherBands.some(b => b.used > 0), 'rain in depth bands');
assert.ok(ss._docsMinimap && ss._docsMinimap.visible, 'minimap');
assert.strictEqual(DocsDoodads.Models.get(path.join(__dirname, 'fixtures', 'crate.glb')).ready, true, 'model loaded');
assert.ok(ss._docs3dBillboards.items.some(it => it.terrain && it.mesh && it.mesh.shader && it.mesh.shader.uniforms.uColor), 'model drawn as a mesh');

// 3. Snow cover falls with snow, then melts.
$gameScreen.changeWeather('snow', 9);
const before = $gameSystem._docsSnowCover;
run('snow frames', () => E.frames(ss, 10));
assert.ok($gameSystem._docsSnowCover > before, 'snow settles');
assert.ok(ss._docsDoodadSprites.some(sp => sp._docsSnowCap && sp._docsSnowCap.visible), 'white tops');

// 4. Quality levels and the curved world.
ConfigManager.docsFxQuality = 2;
run('low quality', () => E.frames(ss, 3));
assert.strictEqual(DocsDoodads.Perspective.active().viewTiles, 24);
ConfigManager.docsFxQuality = 0;
DocsDoodads.Lighting.setMapSettings(1, { perspective: Object.assign({}, DocsDoodads.Lighting.mapSettings(1).perspective, { curve: 'sphere', curveRadius: 40 }) });
run('planet frames', () => E.frames(ss, 5));
assert.deepStrictEqual(errors, []);

// 5. A camera override, the see-through pass with the player behind the tall doodad.
$gameMap._docsCamera = { pitch: 25, yaw: 30 };
$gamePlayer.locate(20, 11);
run('see-through frames', () => E.frames(ss, 10));
assert.deepStrictEqual(errors, []);
$gameMap._docsCamera = null;

// 6. Leaving 3D puts the tilemap back.
DocsDoodads.Lighting.setMapSettings(1, { perspective: { enabled: false } });
run('leave 3D', () => E.frames(ss, 3));
assert.deepStrictEqual(errors, []);
assert.ok(!ss._docs3d, 'flat again');
assert.ok(!ss._tilemap._docsStandMask, 'tiles back on the ground');
assert.ok(ss._docsDoodadSprites.every(sp => !sp._docsSnowCap || !sp._docsSnowCap.visible), 'no snow caps on a flat map');

// 7. A new spriteset (the menu and back), destroying the old one the way MZ does.
run('menu round trip', () => {
    ss.destroy({ children: true, texture: true });
    const again = new Spriteset_Map();
    SceneManager._scene = { _spriteset: again };
    DocsDoodads.Lighting.setMapSettings(1, { perspective: { enabled: true, standTiles: 'all' } });
    E.frames(again, 5);
});
assert.deepStrictEqual(errors, []);

console.log("✓ Map drawing on a stand-in engine: 2D doodads and lighting, 3D with terrain, weather, standing tiles, snow, clouds, models, minimap, quality, planets, see-through, leaving 3D and a menu round trip.");
