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

// 7. See-Through in 3D, with a tall doodad between the camera and the player. Fade fades it;
// Silhouette leaves it and draws the player and their gear again on top as one outline; Both does both.
{
    $gamePlayer.locate(12, 12);
    $dataDocsDoodads[1] = [E.doodad(12, 14, { frameW: 96, frameH: 192 })];
    ss.addDocsDoodads();
    const tree = ss._docsDoodadSprites[0];
    DocsDoodads.Lighting.setMapSettings(1, { perspective: { enabled: true, pitch: 40 } });
    const mode = m => { $dataDocsDoodads.world = Object.assign({}, $dataDocsDoodads.world, { seeThrough: { enabled: true, mode: m, opacity: 0.3, speed: 1, silhouetteColor: '#ff0000' } }); };
    const view = () => ss._docs3dBillboards;
    const treeAlpha = () => view().items.find(it => it.obj === tree).alpha;

    mode('fade');
    run('fade', () => E.frames(ss, 3));
    assert.ok(treeAlpha() < 0.5, 'Fade: the tree fades');
    assert.strictEqual(view().silhouette, null, 'Fade: no outline');

    mode('silhouette');
    tree._docs3dSeeAlpha = 1;
    run('silhouette', () => E.frames(ss, 3));
    assert.ok(treeAlpha() > 0.99, 'Silhouette: the tree stays');
    const ghost = view().silhouette;
    assert.ok(ghost && ghost.some(it => it.obj === player), 'the player is outlined');
    assert.strictEqual(ghost.filter(it => it.obj._docsBillboardOwner === player).length, 2, 'with both gear layers');
    assert.deepStrictEqual(view().silhouetteColor, [1, 0, 0], 'in the chosen colour');
    assert.ok(view()._ghost && view()._ghost._docsFilter.uniforms.uColor[0] === 1, 'drawn through the outline filter');
    // The outline goes on top: drawn after everything else in the frame.
    const order = [];
    const realDraw = view().drawDocsItem;
    view().drawDocsItem = function(r, it, plain) { order.push([it.obj, plain]); return realDraw.call(this, r, it, plain); };
    view().render(Graphics.app.renderer);
    view().drawDocsItem = realDraw;
    const firstGhost = order.findIndex(([, plain]) => plain);
    assert.ok(firstGhost > 0 && order.slice(firstGhost).every(([, plain]) => plain), 'after the rest');
    assert.ok(order.slice(0, firstGhost).some(([o]) => o === tree), 'the tree is drawn first');

    mode('both');
    run('both', () => E.frames(ss, 3));
    assert.ok(treeAlpha() < 0.5 && view().silhouette, 'Both: fades and outlines');

    // Nothing in the way, or editing: no outline.
    $gamePlayer.locate(20, 12);
    run('clear', () => E.frames(ss, 3));
    assert.strictEqual(view().silhouette, null, 'not hidden, no outline');
    $gamePlayer.locate(12, 12);
    W.mounted = true;
    run('editing', () => E.frames(ss, 2));
    assert.strictEqual(view().silhouette, null, 'none while editing');
    W.mounted = false;
    assert.deepStrictEqual(errors, []);
}

console.log("✓ Character drawing on a stand-in engine: gear layers and gear shadows, motion blur, the destination marker, Effekseer in 3D, the airship, the battle snapshot, the editor overlay and See-Through in 3D (fade, silhouette, both).");
