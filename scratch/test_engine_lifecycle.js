// scratch/test_engine_lifecycle.js
// What the 3D view and its extras free and keep: textures and meshes freed with the map, the battle
// background and world map pictures, the snow cap cache, standing tiles keeping their sprites, models
// (loading, sharing textures, mirrored nodes, retrying, staying in the project, live reload), and edge cases: ledges
// and vehicles, See-Through in 3D, Effekseer targets not drawn, the water mask for snow, the undo
// history panel, Aseprite layer names and parts the build would leave out.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const E = require('./engine/fake_engine');

console.log("=== Testing Lifecycle and Edge Cases on a Stand-in Engine ===");

E.install();
const TREE = 10;
E.setupWorld({ width: 40, height: 30, px: 20, py: 15, tilesetMode: 0, tiles: [[5, 5, 2, TREE], [9, 5, 2, TREE], [13, 5, 2, TREE]], flags: { [TREE]: 0x10 } });
const crate = path.join(__dirname, 'fixtures', 'crate.glb');
$dataDocsDoodads[1] = [E.doodad(18, 14, { model: { path: crate, scale: 1, yaw: 0 } })];
require('../Docs-Doodads.js');
const P = DocsDoodads.Perspective;

const errors = [];
const run = (label, fn) => { try { fn(); } catch (e) { errors.push(label + ': ' + (e.stack || e.message)); } };
const spy = (obj, name) => { const calls = []; const fn = obj[name]; obj[name] = function(...a) { calls.push(a); return fn.apply(this, a); }; return calls; };

// 1. Leaving the map frees what the 3D view made: terrain mesh, lighting, sky and minimap pictures,
// standing tile pictures.
DocsDoodads.Lighting.setMapSettings(1, {
    perspective: { enabled: true, pitch: 45, viewTiles: 24, standTiles: 'star', minimap: true, snowCover: true },
    terrain: { enabled: true, style: 'smooth', auto: false, regions: [], paint: { '10,10': 2 } },
    ambient: { darkness: 0.4, color: '#101830', switchId: 0 }
});
let ss = new Spriteset_Map();
SceneManager._scene = { _spriteset: ss };
run('3D frames', () => E.frames(ss, 6));
assert.deepStrictEqual(errors, []);
const mesh = ss._docsTerrainMesh, light = ss._docsLightTexture, mini = ss._docsMinimap;
const standBitmaps = Array.from(ss._docsStandBitmaps.values());
assert.ok(mesh && light && mini && standBitmaps.length, 'all made');
assert.ok(ss._docsWater, 'snow cover builds the water mask (no water setting)');
const miniBase = mini.children[0].texture.baseTexture;
const bitmapDestroys = standBitmaps.map(b => spy(b, 'destroy'));
ss.destroy({ children: true, texture: true });
assert.ok(mesh._destroyed, 'terrain mesh');
assert.ok(light.baseTexture === null || light.valid === false, 'lighting texture');
assert.strictEqual(miniBase.destroyed, true, 'minimap picture');
assert.ok(bitmapDestroys.every(c => c.length === 1), 'standing tile pictures');
assert.strictEqual(ss._docsMinimap, null);

// 2. Standing tiles: each tree keeps its own sprite while the camera moves.
ss = new Spriteset_Map();
SceneManager._scene = { _spriteset: ss };
run('stand frames', () => E.frames(ss, 3));
const owner = new Map(ss._docsStandSprites.filter(sp => sp.visible).map(sp => [sp._docsStandGroup, sp]));
assert.strictEqual(owner.size, 3, 'three trees standing');
$gameMap.setDisplayPos(1, 0);
run('stand frames 2', () => E.frames(ss, 3));
for (const sp of ss._docsStandSprites.filter(s => s.visible)) {
    if (owner.has(sp._docsStandGroup)) assert.strictEqual(owner.get(sp._docsStandGroup), sp, 'same sprite for the same tree');
}
$gameMap.setDisplayPos(0, 0);

// 3. The snow cap cache keeps the 64 most recently used pictures and frees the rest.
{
    const C = DocsDoodads.SnowCover;
    for (const base of (C._caps || new Map()).values()) base.destroy();
    C._caps = new Map();
    const textures = Array.from({ length: 66 }, () => new PIXI.Texture(new PIXI.BaseTexture(E.makeCanvas(8, 16))));
    const first = C.capBase(textures[0]);
    for (let i = 1; i < 64; i++) C.capBase(textures[i]);
    assert.strictEqual(C.capBase(textures[0]), first, 'a hit');
    C.capBase(textures[64]);
    assert.strictEqual(first.destroyed, false, 'recently used, so kept');
    const second = C._caps.get(Array.from(C._caps.keys())[0]);
    C.capBase(textures[65]);
    assert.strictEqual(second.destroyed, true, 'the oldest goes');
    assert.strictEqual(C._caps.size, 64);
}

// 4. The battle background: the old picture is freed for a new one and when the battle ends; the
// second layer is one shared blank.
{
    DocsDoodads.Lighting.setMapSettings(1, { perspective: Object.assign({}, DocsDoodads.Lighting.mapSettings(1).perspective, { battleBack: true }) });
    const scene = new Scene_Map();
    scene._spriteset = ss;
    scene.snapForBattleBackground();
    const first = $gameTemp._docsBattleBack;
    const freed = spy(first, 'destroy');
    scene.snapForBattleBackground();
    assert.ok($gameTemp._docsBattleBack && $gameTemp._docsBattleBack !== first);
    assert.strictEqual(freed.length, 1, 'the old one is freed');
    const back = new Sprite_Battleback();
    assert.strictEqual(back.battleback2Bitmap(), back.battleback2Bitmap(), 'one blank picture');
    const second = $gameTemp._docsBattleBack;
    const freed2 = spy(second, 'destroy');
    new Scene_Battle().terminate();
    assert.strictEqual(freed2.length, 1);
    assert.strictEqual($gameTemp._docsBattleBack, null);
}

// 5. The world map: one picture while the globe turns, freed on leaving.
{
    DocsDoodads.Lighting.setMapSettings(1, { perspective: Object.assign({}, DocsDoodads.Lighting.mapSettings(1).perspective, { curve: 'sphere' }) });
    const scene = new DocsDoodads.Scene_DocsWorldMap();
    run('world map', () => scene.create());
    assert.deepStrictEqual(errors, []);
    const picture = scene._picture.bitmap;
    Input._pressed = { right: true };
    Input.isTriggered = k => k === 'none';
    run('turn', () => { scene.update(); scene.update(); });
    Input._pressed = {};
    assert.strictEqual(scene._picture.bitmap, picture, 'redrawn in place');
    const freed = spy(picture, 'destroy');
    scene.terminate();
    assert.strictEqual(freed.length, 1, 'freed with the scene');
    DocsDoodads.Lighting.setMapSettings(1, { perspective: Object.assign({}, DocsDoodads.Lighting.mapSettings(1).perspective, { curve: 'flat' }) });
}

// 6. Models: a still camera reuses last frame's triangles; changing model frees the old parts.
{
    const sprite = ss._docsDoodadSprites[0];
    run('model frames', () => E.frames(ss, 2));
    const parts = sprite._docsModelMeshes.slice();
    assert.ok(parts.length === 1 && parts[0]._docsFrameKey, 'drawn as a model');
    const updates = spy(parts[0].geometry.getIndex(), 'update');
    run('still frames', () => E.frames(ss, 3));
    assert.strictEqual(updates.length, 0, 'nothing re-sorted for a still view');
    $gameMap.setDisplayPos(0.5, 0);
    run('moved frames', () => E.frames(ss, 1));
    assert.ok(updates.length >= 1, 'sorted again when the camera moves');
    $gameMap.setDisplayPos(0, 0);
    DocsDoodads.Models.forget(crate);
    run('reloaded', () => E.frames(ss, 1));
    assert.ok(parts[0]._destroyed, 'old parts freed when the model is loaded again');
    assert.ok(sprite._docsModelMeshes[0] && sprite._docsModelMeshes[0] !== parts[0]);
    assert.deepStrictEqual(errors, []);
}

// 7. Models stay inside the project, and a model that failed loads once it's fixed.
{
    const M = DocsDoodads.Models;
    const warn = console.warn;
    const warned = [];
    console.warn = m => warned.push(m);
    const outside = path.join(os.tmpdir(), 'docs_doodads_outside.glb');
    fs.copyFileSync(crate, outside);
    assert.ok(/inside the project/.test(M.get(outside).error), 'a model outside the project is refused');
    const later = path.join(__dirname, 'fixtures', 'later_test.glb');
    try {
        assert.ok(M.get(later).error, 'missing');
        assert.strictEqual(M.get(later).error, M.get(later).error, 'not retried at once');
        fs.copyFileSync(crate, later);
        M._cache[later.replace(/\\/g, '/')].failedAt -= M.retryAfter;
        assert.strictEqual(M.get(later).ready, true, 'loads once the file is there');
        assert.strictEqual(warned.length, 2, 'one warning per problem, not one per frame');
    } finally {
        console.warn = warn;
        fs.unlinkSync(outside);
        if (fs.existsSync(later)) fs.unlinkSync(later);
        M.forget(later);
    }
    // A .gltf pointing at a buffer outside the project is refused too.
    const gltf = path.join(__dirname, 'fixtures', 'escape_test.gltf');
    fs.writeFileSync(gltf, JSON.stringify({ asset: { version: '2.0' }, buffers: [{ uri: '../../../../escape.bin', byteLength: 4 }] }));
    console.warn = () => {};
    try {
        assert.ok(/outside the project/.test(M.get(gltf).error));
    } finally {
        console.warn = warn;
        fs.unlinkSync(gltf);
        M.forget(gltf);
    }
}

// 8. glTF: parts using the same image share one texture; data: URI images load as they are; a mirrored
// node keeps its faces facing out.
{
    const G = DocsDoodads.Gltf;
    const pos = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
    const nor = new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]);
    const bin = Buffer.concat([Buffer.from(pos.buffer), Buffer.from(nor.buffer)]);
    const doc = scale => ({
        asset: { version: '2.0' },
        buffers: [{ byteLength: bin.length, uri: 'data:application/octet-stream;base64,' + bin.toString('base64') }],
        bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 36 }, { buffer: 0, byteOffset: 36, byteLength: 36 }],
        accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: 'VEC3' }, { bufferView: 1, componentType: 5126, count: 3, type: 'VEC3' }],
        images: [{ uri: 'data:image/png;base64,iVBORw0KGgo=' }], textures: [{ source: 0 }],
        materials: [{ pbrMetallicRoughness: { baseColorTexture: { index: 0 } } }],
        meshes: [{ primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, material: 0 }, { attributes: { POSITION: 0, NORMAL: 1 }, material: 0 }] }],
        nodes: [{ mesh: 0, scale }], scenes: [{ nodes: [0] }]
    });
    const plain = G.meshes(G.parse(Buffer.from(JSON.stringify(doc([1, 1, 1])))));
    const mirror = G.meshes(G.parse(Buffer.from(JSON.stringify(doc([-1, 1, 1])))));
    assert.deepStrictEqual(Array.from(plain.primitives[0].indices), [0, 1, 2]);
    assert.deepStrictEqual(Array.from(mirror.primitives[0].indices), [0, 2, 1], 'winding reversed under a mirror');
    assert.ok(Math.abs(mirror.primitives[0].normals[2] - 1) < 1e-6, 'the normal still points out (+z)');
    const squash = G.meshes(G.parse(Buffer.from(JSON.stringify(Object.assign(doc([1, 1, 1]), {
        nodes: [{ mesh: 0, matrix: [2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] }]
    })))));
    assert.ok(Math.abs(squash.primitives[0].normals[2] - 1) < 1e-6, 'stretching sideways leaves a front-facing normal alone');
    const textures = [];
    const images = new Map();
    for (const prim of plain.primitives) textures.push(DocsDoodads.Models.texture(prim, u => u, images));
    assert.strictEqual(textures[0], textures[1], 'one texture for the shared image');
    assert.ok(/^data:image\/png/.test(textures[0].baseTexture.resource.source.src), 'data: images load as they are');
    DocsDoodads.Models.release({ textures });
    assert.strictEqual(textures[0].valid, false, 'freed when the model goes');
}

// 9. Ledges: vehicles, the party aboard one, and Through characters move normally.
{
    DocsDoodads.Lighting.setMapSettings(1, {
        perspective: { enabled: true },
        terrain: { enabled: true, style: 'stepped', auto: false, regions: [], paint: { '21,15': 0, '20,15': 2 }, block: true, drop: true }
    });
    Graphics.frameCount++; // the terrain grid is kept for the rest of a frame
    const walker = new Game_Character();
    walker.locate(20, 15);
    run('walker', () => walker.moveStraight(6));
    assert.ok(walker.isJumping(), 'a walker jumps off the ledge');
    const boat = $gameMap.boat();
    boat.locate(20, 15);
    run('boat', () => boat.moveStraight(6));
    assert.ok(!boat.isJumping(), 'a boat does not');
    const ghost = new Game_Character();
    ghost.locate(20, 15);
    ghost._through = true;
    run('through', () => ghost.moveStraight(6));
    assert.ok(!ghost.isJumping(), 'nor does a Through character');
    $gamePlayer.isInVehicle = () => true;
    assert.strictEqual($gamePlayer.docsWalksTerrain(), false, 'nor the party in a vehicle');
    $gamePlayer.isInVehicle = () => false;
    assert.deepStrictEqual(errors, []);
}

// 10. See-Through in 3D: the flat test and the flat silhouette stay out of it; nothing fades while editing.
{
    const sprite = ss._docsDoodadSprites[0];
    sprite._seeAlpha = 0.3;
    assert.strictEqual(sprite.updateSeeThrough(false), 1, 'the flat fade is off in 3D');
    DocsDoodads.Atmosphere._playerHidden = true;
    $dataDocsDoodads.world = Object.assign({}, $dataDocsDoodads.world, { seeThrough: { enabled: true, mode: 'both', opacity: 0.4, speed: 1 } });
    run('silhouette', () => ss.updateDocsSilhouette());
    assert.ok(!ss._docsSilhouette || !ss._docsSilhouette.visible, 'no flat silhouette over the 3D view');
    DocsDoodads.Workspace.mounted = true;
    assert.strictEqual(ss.docsPlayerSeeThrough(), null, 'off while editing');
    DocsDoodads.Workspace.mounted = false;
    DocsDoodads.Atmosphere._playerHidden = false;
}

// 11. Effekseer: a target not drawn this frame doesn't pull the animation to where it was last drawn.
{
    const target = new Sprite();
    target.x = 100; target.y = 100;
    target._docs3dMatrix = new PIXI.Matrix(1, 0, 0, 1, 5000, 5000);
    target._docs3dFrame = Graphics.frameCount - 30;
    const anim = new Sprite_Animation();
    anim._docs3dMatrix = new PIXI.Matrix(1, 0, 0, 1, 10, 10);
    anim._docs3dFrame = Graphics.frameCount;
    const at = anim.targetSpritePosition(target);
    assert.ok(at.x < 1000 && at.y < 1000, 'placed by the animation itself');
}

// 12. Closing the editor closes the undo history panel too.
{
    const removed = [];
    const panel = { parentNode: { removeChild: p => removed.push(p) } };
    const getById = document.getElementById;
    document.getElementById = id => (id === 'dd-undo-history' ? panel : null);
    const W = DocsDoodads.Workspace;
    W.mounted = true;
    W._undoHistoryOpen = true;
    W.detachCanvasListeners = () => {};
    W.removeGhost = () => {};
    run('close', () => W.close());
    document.getElementById = getById;
    assert.deepStrictEqual(errors, []);
    assert.deepStrictEqual(removed, [panel]);
    assert.strictEqual(W._undoHistoryOpen, false);
}

// 13. Aseprite: two layers with the same name make two sheets, not one overwritten.
{
    const A = DocsDoodads.AsepriteSheets;
    const cel = { layer: 0, x: 0, y: 0, w: 1, h: 1, pixels: new Uint8ClampedArray([255, 0, 0, 255]) };
    const frames = Array.from({ length: 12 }, () => ({ cels: [cel, Object.assign({}, cel, { layer: 1 }), Object.assign({}, cel, { layer: 2 })] }));
    const layer = name => ({ name, type: 0, visible: true, opacity: 255 });
    const ase = { width: 1, height: 1, depth: 32, layers: [layer('Hair'), layer('Hair'), layer('hair')], frames, tags: [], palette: [] };
    A.layerFrame = (a, index) => new Uint8ClampedArray([255, 0, 0, 255]);
    assert.deepStrictEqual(A.sheets(ase, 'Hero').map(s => s.fileName), ['$Hero_Hair.png', '$Hero_Hair_2.png', '$Hero_hair_3.png']);
}

// 14. The build refuses parts it would leave out.
{
    const stray = path.join(__dirname, '..', 'src', 'stray_test_part.js');
    fs.writeFileSync(stray, '');
    try {
        delete require.cache[require.resolve('../scripts/build.js')];
        assert.throws(() => require('../scripts/build.js').build(), /stray_test_part\.js/);
    } finally {
        fs.unlinkSync(stray);
    }
    assert.ok(require('../scripts/build.js').build().parts.length > 40);
}

// 15. Model live reload: exporting a model again reloads it on the map. Old textures stay until the
// map's sprites go (an unfocused game still draws), and other files' changes reload nothing.
{
    const L = DocsDoodads.LiveReload, M = DocsDoodads.Models;
    const realWatch = fs.watch;
    const watched = [];
    let closed = 0;
    fs.watch = (dir, opts, cb) => { watched.push({ dir, fn: typeof opts === 'function' ? opts : cb }); return { close() { closed++; } }; };
    const live = path.join(__dirname, 'fixtures', 'live_test.glb');
    fs.copyFileSync(crate, live);
    try {
        L.start();
        $dataDocsDoodads[1] = [E.doodad(18, 14, { model: { path: live, scale: 1, yaw: 0 } })];
        const map = new Spriteset_Map();
        SceneManager._scene = { _spriteset: map };
        run('live frames', () => E.frames(map, 2));
        const sprite = map._docsDoodadSprites[0];
        const before = M.get(live), oldPart = sprite._docsModelMeshes[0], oldTexture = before.textures[0];
        assert.ok(before.ready && oldPart, 'drawn as a model');
        const folder = watched.find(w => path.resolve(w.dir) === path.dirname(live));
        assert.ok(folder, "the model's folder is watched");
        assert.strictEqual(watched.filter(w => w.dir === folder.dir).length, 1, 'once');

        folder.fn('change', 'tree.glb');
        assert.deepStrictEqual(L.flushModels(), [], "another model's file reloads nothing");
        folder.fn('change', 'live_test.glb');
        folder.fn('change', 'live_test.glb');
        assert.deepStrictEqual(L.flushModels(), [live.replace(/\\/g, '/')], 'reloaded once');
        const after = M.get(live);
        assert.ok(after !== before && after.ready, 'a fresh copy');
        run('after reload', () => E.frames(map, 1));
        assert.ok(oldPart._destroyed && sprite._docsModelMeshes[0] !== oldPart, 'the doodad redraws with it');
        assert.strictEqual(oldTexture.valid, true, 'the old texture is kept for now');
        map.destroy({ children: true, texture: true });
        assert.strictEqual(oldTexture.valid, false, 'and freed with the map');
        assert.deepStrictEqual(errors, []);

        L.stop();
        assert.ok(closed >= 1 && !L.running && L.modelWatchers.size === 0, 'watchers closed with the editor');
        M.get(path.join(__dirname, 'fixtures', 'tree.glb'));
        assert.strictEqual(L.modelWatchers.size, 0, 'nothing watched while the editor is closed');
    } finally {
        fs.watch = realWatch;
        L.stop();
        fs.unlinkSync(live);
        M.forget(live);
    }
}

// 16. Clouds default to a size that shows on screen.
assert.strictEqual(P.normalize({}).cloudScale, 6);

assert.deepStrictEqual(errors, []);
console.log("✓ Lifecycle and edge cases: textures freed with the map, battle and world map pictures, snow caps, standing tiles, models (caching, sharing, mirrors, retry, project folder), ledges, See-Through in 3D, Effekseer, the undo panel, Aseprite names, the build and model live reload.");
