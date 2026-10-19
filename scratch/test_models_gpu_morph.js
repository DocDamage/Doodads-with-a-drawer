// scratch/test_models_gpu_morph.js
// 3D models, what was still open (D): morph targets (shape keys, and animations of their weights), normal
// maps (tangents, per-pixel light), a selection box that follows the pose, and drawing on the GPU (World >
// 3D Models) with its fallbacks. morph_cube.glb is made by Blender (scripts/make_model_fixtures.py).
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const E = require('./engine/fake_engine');

console.log('=== Testing Model Morphs, Normal Maps and GPU Drawing ===');

E.install();
E.setupWorld({ width: 30, height: 24, px: 12, py: 12 });
require('../Docs-Doodads.js');
const D = DocsDoodads, G = D.Gltf, M = D.Models;
const near = (a, b, eps = 1e-4) => Math.abs(a - b) <= eps;
const cubePath = path.join(__dirname, 'fixtures', 'morph_cube.glb');

// 1. Blender's export: a shape key, its animation, a normal map.
const cube = G.meshes(G.parse(fs.readFileSync(cubePath)));
const prim = cube.primitives[0];
assert.ok(prim.morph && prim.morph.targets.length === 1, 'one shape key');
assert.ok(prim.normalImage && near(prim.normalScale, 0.8), 'the normal map and its strength');
const squash = cube.animations[0];
assert.deepStrictEqual(squash.channels.map(c => [c.path, c.size]), [['weights', 1]]);
const height = t => G.boundsOf(G.pose(cube, squash, t).positions).max[1];
assert.ok(near(height(0), 1) && near(height(0.5), 0.75) && near(height(1), 0.5), 'the top comes down and back');
assert.deepStrictEqual(cube.min.map(v => +v.toFixed(3)), [-0.5, 0, -0.5]);
console.log('✓ Blender\'s cube: shape key, weights animation, normal map');

// 2. Built by hand: default weights at rest, morphed normals, and tangents from the UVs.
function build(spec) {
    const parts = [], views = [], accessors = [];
    let offset = 0;
    const add = (array, type, componentType) => {
        const bytes = Buffer.from(array.buffer, array.byteOffset, array.byteLength);
        const pad = (4 - (bytes.length % 4)) % 4;
        parts.push(bytes, Buffer.alloc(pad));
        views.push({ buffer: 0, byteOffset: offset, byteLength: bytes.length });
        offset += bytes.length + pad;
        accessors.push({ bufferView: views.length - 1, componentType, count: array.length / { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[type], type });
        return accessors.length - 1;
    };
    const json = spec({ f32: (a, t) => add(new Float32Array(a), t, 5126), u16: (a, t) => add(new Uint16Array(a), t, 5123) });
    const bin = Buffer.concat(parts);
    json.asset = { version: '2.0' };
    json.buffers = [{ byteLength: bin.length, uri: 'data:application/octet-stream;base64,' + bin.toString('base64') }];
    json.bufferViews = views;
    json.accessors = accessors;
    return G.meshes(G.parse(Buffer.from(JSON.stringify(json))));
}
// A quad on the ground (y up), its UVs running along x and z, a shape key lifting one corner.
const quad = build(({ f32, u16 }) => ({
    meshes: [{ weights: [0.5], primitives: [{
        attributes: { POSITION: f32([0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1], 'VEC3'), NORMAL: f32([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 'VEC3'),
            TEXCOORD_0: f32([0, 0, 1, 0, 1, 1, 0, 1], 'VEC2') },
        indices: u16([0, 2, 1, 0, 3, 2], 'SCALAR'),
        targets: [{ POSITION: f32([0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0], 'VEC3') }],
        material: 0
    }] }],
    materials: [{ normalTexture: { index: 0, scale: 1 } }], textures: [{ source: 0 }], images: [{ uri: 'bumps.png' }],
    nodes: [{ mesh: 0 }], scenes: [{ nodes: [0] }]
}));
const q = quad.primitives[0];
assert.ok(near(q.positions[7], 1), 'the default weight (0.5) lifts the corner at rest: ' + q.positions[7]);
assert.ok(near(q.local.positions[7], 0), 'the part keeps its own unmorphed points for posing');
assert.ok(near(G.pose(quad, null, 0).positions[0][7], 1), 'and the rest pose adds the weight again');
const tan = G.tangentsFor(new Float32Array([0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1]), new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]),
    new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), new Uint32Array([0, 2, 1, 0, 3, 2]));
assert.ok(near(tan[0], 1) && near(tan[1], 0) && near(tan[2], 0), 'the tangent runs along u (x)');
assert.ok(Math.abs(tan[3]) === 1, 'with a handedness');
// Map space: model x, z turn by yaw into east, south; y is up; tangents flip handedness with the swap.
const outN = new Float32Array(3), outT = new Float32Array(4);
M.mapNormals(new Float32Array([0, 1, 0]), new Float32Array([1, 0, 0, 1]), 90, false, outN, outT);
assert.ok(near(outN[2], 1) && near(outN[0], 0), 'up stays up');
assert.ok(near(outT[1], 1) && outT[3] === -1, 'x turned 90 degrees points south; handedness flipped');
// The light per pixel: material uniforms.
const u = M.materialUniforms({ color: [1, 1, 1, 1], roughness: 0.1, metallic: 0.5, normalImage: {}, normalScale: 2 }, PIXI.Texture.WHITE, { fake: true });
assert.ok(u.uHasNormal === 1 && u.uNormalScale === 2 && near(u.uSmooth, 0.9) && u.uShine > 64, 'smooth: a sharp highlight per pixel');
assert.strictEqual(M.materialUniforms({ color: [1, 1, 1, 1] }, PIXI.Texture.WHITE, PIXI.Texture.WHITE).uHasNormal, 0, 'no normal map');
assert.ok(/uNormalMap/.test(M.lightFragment) && /cross\(n, t\)/.test(M.lightFragment) && /pow\(max\(0\.0, dot\(n, h\)\), uShine\)/.test(M.lightFragment));
console.log('✓ by hand: default weights, unmorphed points kept, tangents, map space, per-pixel light');

// 3. Drawing the CPU way: normals and tangents per vertex; the selection box follows the pose.
D.Lighting.setMapSettings(1, { perspective: { enabled: true, pitch: 45, viewTiles: 20 } });
const doodad = E.doodad(12, 10, { model: { path: cubePath, scale: 2, yaw: 0, animation: '', speed: 1 } });
$dataDocsDoodads[1] = [doodad];
const ss = new Spriteset_Map();
SceneManager._scene = { _spriteset: ss };
Graphics.frameCount = 0;
E.frames(ss, 1);
const sprite = ss._docsDoodadSprites[0];
assert.ok(sprite._docsModelMeshes && sprite._docsModelMeshes[0], 'drawn the CPU way');
const mesh = sprite._docsModelMeshes[0];
assert.ok(mesh.geometry.getBuffer('aNormal') && mesh.geometry.getBuffer('aTangent'));
assert.ok(mesh.shader.uniforms.uLight && mesh.shader.uniforms.uView, 'the light and the view are uniforms');
const ws = D.Workspace;
const tallAt = frame => {
    Graphics.frameCount = frame;
    E.frames(ss, 1);
    return ws.doodadFlatBox(doodad).rect.h;
};
const upright = tallAt(0);
const flat = tallAt(60);
assert.ok(flat < upright * 0.75, `the box comes down with the squash: ${upright} -> ${flat}`);
console.log('✓ the CPU way: per-vertex normals and tangents, the box follows the pose');

// 4. The GPU way: a picture of its own with a depth buffer, drawn as one quad; morph weights move the points.
D.World.set('models3d.gpu', true);
Graphics.frameCount = 0;
E.frames(ss, 1);
assert.ok(sprite._docsModelGpu && sprite._docsModelGpu.rt && sprite._docsModelGpu.quad, 'a picture and a quad');
assert.ok(sprite._docsModelGpuDrawn);
const item = ss._docs3dBillboards.items.find(it => it.mesh === sprite._docsModelGpu.quad);
assert.ok(item && item.count === 2, 'one quad among the billboards');
const gmesh = sprite._docsModelGpu.meshes[0];
assert.ok(gmesh.state.depthTest === true, 'parts sort by the depth buffer');
assert.strictEqual(gmesh.shader.uniforms.uSkinned, 0);
assert.ok(gmesh.shader.uniforms.uDepthRange[1] > gmesh.shader.uniforms.uDepthRange[0]);
const top0 = Math.max(...Array.from(gmesh.geometry.getBuffer('aVertexPosition').data).filter((v, i) => i % 3 === 2));
Graphics.frameCount = 60;
E.frames(ss, 1);
const zs = Array.from(gmesh.geometry.getBuffer('aVertexPosition').data);
assert.ok(Math.max(...zs.filter((v, i) => i % 3 === 2)) <= top0 + 1e-6, 'buffer updated');
assert.ok(sprite._docsPose && Math.abs(sprite._docsPose.time - 1) < 0.1 && sprite._docsPose.data === null, 'the GPU way records the moment drawn');
assert.ok(ws.doodadFlatBox(doodad).rect.h < upright * 0.75, 'and the editor box follows it');
assert.ok(/aJoints/.test(M.gpuVertex) && /uJoints\[32\]/.test(M.gpuVertex) && /uCamF/.test(M.gpuVertex), 'skin and camera in the shader');
// Picking a model drawn the GPU way: projected on the CPU when clicked.
const g = sprite._docsModelGpu.screen;
const hit = ss.docsModelHit(doodad, g.x0 + g.w / 2, g.y0 + g.h / 2);
assert.ok(hit !== null && hit > 0, 'clicked in the middle: a hit');
assert.strictEqual(ss.docsModelHit(doodad, g.x0 - 50, g.y0 - 50), null, 'outside: none');
assert.strictEqual(sprite._docsModelMeshes.length === 0 || sprite._docsModelMeshes.every(m => m && !m._destroyed), true, 'the one-off drawing left nothing behind');
// Fallbacks: a curved world, a skin with too many joints, a card that refuses the shader.
D.Lighting.setMapSettings(1, { perspective: { enabled: true, pitch: 45, viewTiles: 20, curve: 'sphere', curveRadius: 30 } });
E.frames(ss, 1);
assert.ok(!sprite._docsModelGpu && sprite._docsModelMeshes.length, 'a round world: the CPU way');
D.Lighting.setMapSettings(1, { perspective: { enabled: true, pitch: 45, viewTiles: 20 } });
assert.strictEqual(M.gpuFor({ skins: [{ joints: new Array(33) }] }, { curve: 'flat' }), false, 'too many joints');
assert.strictEqual(M.gpuFor({ skins: [{ joints: new Array(20) }] }, { curve: 'flat' }), true);
const realMesh = PIXI.Mesh;
PIXI.Mesh = function() { throw new Error('shader refused'); };
const warn = console.warn;
console.warn = () => {};
E.frames(ss, 1);
console.warn = warn;
PIXI.Mesh = realMesh;
assert.ok(M._gpuBroken, 'remembered');
E.frames(ss, 1);
assert.ok(!sprite._docsModelGpu && sprite._docsModelMeshes.length && sprite._docsModelMeshes[0].geometry, 'and the CPU way from then on');
M._gpuBroken = false;
D.World.set('models3d.gpu', false);
console.log('✓ the GPU way: a picture with depth, one quad, morphs, picking, and falling back');

console.log('=== Model morphs, normal maps and GPU drawing passed ===');
