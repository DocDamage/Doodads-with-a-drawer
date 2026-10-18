// scratch/test_engine_characters.js
// Character drawing on the stand-in engine: visual equipment layers (and in shadows), sun shadows,
// motion blur, character animation sheets, the destination marker, Effekseer placement in 3D, a flying
// airship, the battle snapshot, and the editor overlay (selection boxes, gizmos, the terrain brush
// preview) in 2D and 3D.
const assert = require('assert');
const E = require('./engine/fake_engine');

console.log("=== Testing Character Drawing on a Stand-in Engine ===");

E.install();
E.setupWorld({ width: 30, height: 24, px: 12, py: 12 });
$dataDocsDoodads[1] = [E.doodad(10, 10), E.doodad(14, 12, { frameH: 144 })];
$dataDocsDoodads.world = {
    characterShadows: { enabled: true, mode: 'all', includePlayer: true, opacity: 0.5, length: 1, blur: 2 },
    sun: { source: 'fixed', angle: 40 },
    motionBlur: { enabled: true, mode: 'all', strength: 1 },
    destination: { style: 'ring', color: '#ffffff', pathDots: true }
};
$dataActors[1].note = '<visual: Cape, z -1, up 2, part cape><visual: Hat, z 2><visual color: cape, hue 120>';
require('../Docs-Doodads.js');

const errors = [];
const run = (label, fn) => { try { fn(); } catch (e) { errors.push(label + ': ' + (e.stack || e.message)); } };

const ss = new Spriteset_Map();
SceneManager._scene = { _spriteset: ss };
const player = ss._characterSprites.find(s => s._character === $gamePlayer);

// 1. Gear layers and shadows with the gear in them; walking for motion blur.
run('2D frames', () => E.frames(ss, 5));
for (const d of [6, 6, 2, 2]) { run('walk', () => { $gamePlayer.moveStraight(d); $gamePlayer._realX -= 0.5; E.frames(ss, 3); }); }
assert.deepStrictEqual(errors, []);
assert.strictEqual(player._docsVisualSprites.length, 2, 'cape and hat layers');
assert.ok(player._docsShadow && player._docsShadow.visible, 'a sun shadow');
assert.strictEqual(player._docsShadow._docsGear.filter(p => p.visible).length, 2, 'the gear is in the shadow');
assert.ok((player._docsShadow.filters || []).some(f => f instanceof PIXI.filters.AlphaFilter), 'faded once as a whole');

// 2. The destination marker.
$gameTemp.isDestinationValid = () => true;
$gameTemp.destinationX = () => 15;
$gameTemp.destinationY = () => 14;
run('destination', () => E.frames(ss, 5));
assert.deepStrictEqual(errors, []);

// 3. 3D: an Effekseer animation on the player is placed where the player is drawn and sized like them.
DocsDoodads.Lighting.setMapSettings(1, { perspective: { enabled: true, pitch: 50, zoom: 0.7, battleBack: true } });
const anim = new Sprite_Animation();
anim._targets = [player];
ss._tilemap.addChild(anim);
run('3D frames', () => E.frames(ss, 5));
assert.deepStrictEqual(errors, []);
assert.ok(player._docs3dMatrix, 'the player has a 3D transform');
assert.ok(anim._docs3dScale > 0 && anim._docs3dScale < 1, 'the animation shrinks with the camera');
const at = anim.targetSpritePosition(player);
assert.ok(Number.isFinite(at.x) && Number.isFinite(at.y));

// 4. A flying airship stands over its own tile; its shadow lies on the ground.
const airship = $gameMap.airship();
airship.locate(13, 12);
airship._altitude = 48;
run('airship', () => E.frames(ss, 3));
const airSprite = ss._characterSprites.find(s => s._character === airship);
const pivot = ss.docsPivotOf(airSprite);
assert.strictEqual(pivot.y, airSprite.y + 48, 'altitude added back to the foot');
assert.strictEqual(ss.docsIsGround(ss._shadowSprite), true);

// 5. The battle background snapshot from the 3D map.
run('battle snapshot', () => {
    const scene = new Scene_Map();
    scene._spriteset = ss;
    scene.snapForBattleBackground();
});
assert.deepStrictEqual(errors, []);
assert.ok($gameTemp._docsBattleBack, 'a battle background');
assert.ok(player.visible, 'characters shown again afterwards');
const back = new Sprite_Battleback();
assert.strictEqual(back.battleback1Bitmap(), $gameTemp._docsBattleBack);
assert.strictEqual(back.battleback2Bitmap().width, 1);

// 6. The editor overlay: selection boxes and gizmos in 3D, the terrain brush preview.
const W = DocsDoodads.Workspace;
W.mounted = true;
W.selectedDoodads = [$dataDocsDoodads[1][0]];
W.selectedDoodad = $dataDocsDoodads[1][0];
W.gridSnapShow = true;
W.placementTool = 'terrain';
W._terrainHover = { tileX: 12, tileY: 12 };
DocsDoodads.Lighting.setMapSettings(1, { perspective: { enabled: true }, terrain: { enabled: true, paint: { '5,5': 2 } } });
run('editor 3D frames', () => E.frames(ss, 3));
assert.deepStrictEqual(errors, []);
assert.ok(ss._docsSelectionOutline.geometry.graphicsData.some(d => d.fillStyle && d.fillStyle.visible), 'the brush preview is drawn');
DocsDoodads.Lighting.setMapSettings(1, { perspective: { enabled: false } });
run('editor 2D frames', () => E.frames(ss, 3));
assert.deepStrictEqual(errors, []);
W.mounted = false;
W.placementTool = null;

console.log("✓ Character drawing on a stand-in engine: gear layers and gear shadows, motion blur, the destination marker, Effekseer in 3D, the airship, the battle snapshot and the editor overlay.");
