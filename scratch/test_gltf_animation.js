// scratch/test_gltf_animation.js
// glTF models, the next steps: animations (translation, rotation, scale; linear, step and cubic),
// skinned models posed from their joints, materials (metal, roughness, glow, alpha modes, unlit, vertex
// colours) and the light they get, and the drawing side: animated models posed each frame, picking a
// model by its triangles and a selection box that fits it.
const assert = require('assert');
const path = require('path');
const E = require('./engine/fake_engine');

console.log("=== Testing glTF Animation, Skinning and Materials ===");

E.install();
E.setupWorld({ width: 30, height: 24, px: 12, py: 12 });
require('../Docs-Doodads.js');
const G = DocsDoodads.Gltf;
const near = (a, b, eps = 1e-4) => Math.abs(a - b) <= eps;

// A small glTF builder: typed arrays become one embedded buffer with an accessor each.
function build(spec) {
    const parts = [], views = [], accessors = [];
    let offset = 0;
    const add = (array, type, componentType) => {
        const bytes = Buffer.from(array.buffer, array.byteOffset, array.byteLength);
        const pad = (4 - (bytes.length % 4)) % 4;
        parts.push(bytes, Buffer.alloc(pad));
        views.push({ buffer: 0, byteOffset: offset, byteLength: bytes.length });
        offset += bytes.length + pad;
        const count = array.length / { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 }[type];
        accessors.push({ bufferView: views.length - 1, componentType, count, type });
        return accessors.length - 1;
    };
    const f32 = (a, type) => add(new Float32Array(a), type, 5126);
    const json = spec({ f32, u16: (a, type) => add(new Uint16Array(a), type, 5123) });
    const bin = Buffer.concat(parts);
    json.asset = { version: '2.0' };
    json.buffers = [{ byteLength: bin.length, uri: 'data:application/octet-stream;base64,' + bin.toString('base64') }];
    json.bufferViews = views;
    json.accessors = accessors;
    return G.meshes(G.parse(Buffer.from(JSON.stringify(json))));
}
const tri = [0, 0, 0, 1, 0, 0, 0, 1, 0];

// 1. An animation turning, moving and growing a node.
const spinner = build(({ f32 }) => {
    const pos = f32(tri, 'VEC3');
    const times = f32([0, 1, 2], 'SCALAR');
    const s = Math.SQRT1_2;
    return {
        meshes: [{ primitives: [{ attributes: { POSITION: pos } }] }],
        nodes: [{ mesh: 0 }], scenes: [{ nodes: [0] }],
        animations: [{ name: 'Spin', samplers: [
            { input: times, output: f32([0, 0, 0, 1, 0, s, 0, s, 0, 1, 0, 0], 'VEC4') },               // 0, 90, 180 degrees about y
            { input: times, output: f32([0, 0, 0, 0, 2, 0, 0, 4, 0], 'VEC3') },                          // rises 2 a second
            { input: f32([0, 2], 'SCALAR'), output: f32([1, 1, 1, 3, 3, 3], 'VEC3'), interpolation: 'STEP' }
        ], channels: [
            { sampler: 0, target: { node: 0, path: 'rotation' } },
            { sampler: 1, target: { node: 0, path: 'translation' } },
            { sampler: 2, target: { node: 0, path: 'scale' } }
        ] }, { name: 'Empty', samplers: [], channels: [] }]
    };
});
assert.strictEqual(spinner.animations.length, 1, 'animations without channels are left out');
const spin = spinner.animations[0];
assert.strictEqual(spin.duration, 2);
assert.strictEqual(G.pickAnimation(spinner, ''), spin, 'blank: the first');
assert.strictEqual(G.pickAnimation(spinner, 'spin'), spin, 'by name, any case');
assert.strictEqual(G.pickAnimation(spinner, '1'), spin, 'by number');
assert.strictEqual(G.pickAnimation(spinner, 'none'), null);
const at1 = G.pose(spinner, spin, 1).positions[0];
// At t = 1: turned 90 degrees about y (x -> -z), raised 2, scale still 1 (step).
assert.ok(near(at1[3], 0) && near(at1[4], 2) && near(at1[5], -1), 'turned and raised: ' + Array.from(at1.subarray(3, 6)));
const at05 = G.pose(spinner, spin, 0.5).positions[0];
assert.ok(near(Math.hypot(at05[3], at05[5]), 1, 1e-3) && near(at05[4], 1), 'rotations blend the short way round, keeping their length');
assert.ok(near(G.pose(spinner, spin, 2.5).positions[0][4], 1), 'loops');
const rest = G.pose(spinner, null, 0).positions[0];
assert.deepStrictEqual(Array.from(rest), tri, 'the rest pose without an animation');

// Cubic spline keys (in-tangent, value, out-tangent): flat tangents ease in and out.
const cubic = { path: 'translation', interpolation: 'CUBICSPLINE', times: new Float64Array([0, 1]),
    values: new Float64Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 0, 0, 0, 0, 0]) };
assert.ok(near(G.sample(cubic, 0.5)[0], 5) && G.sample(cubic, 0.25)[0] < 2.5, 'eases: ' + G.sample(cubic, 0.25)[0]);

// 2. A skinned strip: two joints, the top half follows the second, which bends 90 degrees.
const skinned = build(({ f32, u16 }) => {
    const pos = f32([0, 0, 0, 1, 0, 0, 0, 2, 0, 1, 2, 0], 'VEC3');
    const joints = u16([0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], 'VEC4');
    const weights = f32([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], 'VEC4');
    const inverse = f32([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, -1, 0, 1], 'MAT4');
    const s = Math.SQRT1_2;
    return {
        meshes: [{ primitives: [{ attributes: { POSITION: pos, JOINTS_0: joints, WEIGHTS_0: weights }, indices: u16([0, 1, 2, 1, 3, 2], 'SCALAR') }] }],
        nodes: [{ mesh: 0, skin: 0 }, { children: [2] }, { translation: [0, 1, 0] }],
        skins: [{ joints: [1, 2], inverseBindMatrices: inverse }],
        scenes: [{ nodes: [0, 1] }],
        animations: [{ name: 'Bend', samplers: [{ input: f32([0, 1], 'SCALAR'), output: f32([0, 0, 0, 1, 0, 0, s, s], 'VEC4') }],
            channels: [{ sampler: 0, target: { node: 2, path: 'rotation' } }] }]
    };
});
const sp = skinned.primitives[0];
assert.ok(sp.skin === 0 && sp.joints && sp.weights, 'a skinned part');
assert.deepStrictEqual(Array.from(sp.positions), [0, 0, 0, 1, 0, 0, 0, 2, 0, 1, 2, 0], 'rests where it was bound');
assert.ok(near(skinned.max[1], 2), 'bounds from the rest pose');
// Just before the clip's end (at its end it loops back to the start).
const bent = G.pose(skinned, skinned.animations[0], 0.99999).positions[0];
// The top corners swing about the second joint (at y 1): (0, 2) -> (-1, 1), (1, 2) -> (-1, 2).
assert.ok(near(bent[0], 0) && near(bent[1], 0), 'the bottom stays');
assert.ok(near(bent[6], -1, 1e-3) && near(bent[7], 1, 1e-3) && near(bent[9], -1, 1e-3) && near(bent[10], 2, 1e-3), 'the top bends with its joint: ' + Array.from(bent.subarray(6)));

// 3. Materials.
const shiny = build(({ f32 }) => ({
    meshes: [{ primitives: [{ attributes: { POSITION: f32(tri, 'VEC3'), COLOR_0: f32([1, 0, 0, 0, 1, 0, 0, 0, 1], 'VEC3') }, material: 0 },
        { attributes: { POSITION: f32(tri, 'VEC3') }, material: 1 }, { attributes: { POSITION: f32(tri, 'VEC3') } }] }],
    materials: [{ pbrMetallicRoughness: { metallicFactor: 1, roughnessFactor: 0.2 }, emissiveFactor: [1, 0.5, 0], alphaMode: 'MASK', alphaCutoff: 0.3 },
        { alphaMode: 'BLEND', extensions: { KHR_materials_unlit: {} } }],
    nodes: [{ mesh: 0 }], scenes: [{ nodes: [0] }]
}));
const [metal, glass, plain] = shiny.primitives;
assert.deepStrictEqual([metal.metallic, metal.roughness, metal.alphaMode, metal.alphaCutoff], [1, 0.2, 'MASK', 0.3]);
assert.ok(near(metal.emissive[0], 1) && near(metal.emissive[1], G.toSrgb(0.5)) && metal.emissive[2] === 0, 'glow in sRGB');
assert.deepStrictEqual(Array.from(metal.colors.subarray(0, 4)), [1, 0, 0, 1], 'vertex colours, alpha 1 for RGB');
assert.deepStrictEqual([glass.alphaMode, glass.unlit], ['BLEND', true]);
assert.deepStrictEqual([plain.metallic, plain.roughness, plain.alphaMode, plain.unlit, plain.colors], [1, 1, 'OPAQUE', false, null], "glTF's defaults");

// Light: a smooth surface facing the light and the viewer glints; rough ones don't; unlit is flat; metal
// darkens the diffuse light only when smooth.
const up = [0, 0, 1];
const glint = G.light(0, 1, 0, 0, up, [0, 0, 1], { roughness: 0.1, metallic: 0 });
assert.ok(glint[1] > 0.5 && near(glint[0], 1), 'a glint: ' + glint);
assert.strictEqual(G.light(0, 1, 0, 0, up, [0, 0, 1], { roughness: 1, metallic: 0 })[1], 0, 'rough: none');
assert.deepStrictEqual(G.light(0, -1, 0, 0, up, [0, 0, 1], { unlit: true }), [1, 0], 'unlit');
assert.ok(G.light(0, 1, 0, 0, up, [0, 0, 1], { roughness: 0.1, metallic: 1 })[0] < 0.6, 'smooth metal: little diffuse light');
assert.ok(near(G.light(0, 1, 0, 0, up, [0, 0, 1], { roughness: 1, metallic: 1 })[0], 1), "rough metal (glTF's default) looks as before");
assert.ok(G.light(0, 1, 0, 0, up, [1, 0, 0], { roughness: 0.1, metallic: 0 })[1] < glint[1], 'the glint moves with the viewer');

// 4. Drawing: an animated model re-poses each frame; picking hits its triangles; the box fits the model.
const fs = require('fs');
const os = require('os');
const glbPath = path.join(__dirname, 'fixtures', 'anim_test.gltf');
const spinnerJson = (() => {
    const pos = new Float32Array([-0.5, 0, 0, 0.5, 0, 0, 0, 1.5, 0, -0.5, 0, 0, 0, 1.5, 0, 0.5, 0, 0]);
    const times = new Float32Array([0, 1, 2]);
    const rot = new Float32Array([0, 0, 0, 1, 0, Math.SQRT1_2, 0, Math.SQRT1_2, 0, 1, 0, 0]);
    const bin = Buffer.concat([Buffer.from(pos.buffer), Buffer.from(times.buffer), Buffer.from(rot.buffer)]);
    return {
        asset: { version: '2.0' },
        buffers: [{ byteLength: bin.length, uri: 'data:application/octet-stream;base64,' + bin.toString('base64') }],
        bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 72 }, { buffer: 0, byteOffset: 72, byteLength: 12 }, { buffer: 0, byteOffset: 84, byteLength: 48 }],
        accessors: [{ bufferView: 0, componentType: 5126, count: 6, type: 'VEC3' }, { bufferView: 1, componentType: 5126, count: 3, type: 'SCALAR' }, { bufferView: 2, componentType: 5126, count: 3, type: 'VEC4' }],
        materials: [{ doubleSided: true, emissiveFactor: [0.2, 0.2, 0], pbrMetallicRoughness: { metallicFactor: 0, roughnessFactor: 0.3 } }],
        meshes: [{ primitives: [{ attributes: { POSITION: 0 }, material: 0 }] }],
        nodes: [{ mesh: 0 }], scenes: [{ nodes: [0] }],
        animations: [{ name: 'Spin', samplers: [{ input: 1, output: 2 }], channels: [{ sampler: 0, target: { node: 0, path: 'rotation' } }] }]
    };
})();
fs.writeFileSync(glbPath, JSON.stringify(spinnerJson));
try {
    $dataDocsDoodads[1] = [E.doodad(12, 10, { model: { path: glbPath, scale: 1, yaw: 0 } })];
    DocsDoodads.Lighting.setMapSettings(1, { perspective: { enabled: true, pitch: 40 } });
    const ss = new Spriteset_Map();
    SceneManager._scene = { _spriteset: ss };
    const errors = [];
    const run = (label, fn) => { try { fn(); } catch (e) { errors.push(label + ': ' + (e.stack || e.message)); } };
    run('frames', () => E.frames(ss, 3));
    const sprite = ss._docsDoodadSprites[0];
    const mesh = sprite._docsModelMeshes[0];
    assert.ok(mesh && mesh._docsDrawn === 2, 'drawn as a model (both faces, double sided)');
    assert.ok(mesh.geometry.getBuffer('aNormal') && mesh.geometry.getBuffer('aTangent') && mesh.geometry.getBuffer('aColor'), 'normal, tangent and colour attributes (light per pixel)');
    assert.deepStrictEqual([mesh.shader.uniforms.uMode, mesh.shader.uniforms.uMetal], [0, 0]);
    assert.ok(near(mesh.shader.uniforms.uEmissive[0], G.toSrgb(0.2)), 'the glow reaches the shader');
    const a = Array.from(mesh.geometry.getBuffer('aVertexPosition').data);
    Graphics.frameCount += 30;
    run('later frames', () => E.frames(ss, 1));
    const b = Array.from(mesh.geometry.getBuffer('aVertexPosition').data);
    assert.ok(a.some((v, i) => Math.abs(v - b[i]) > 0.5), 'it moves as the animation plays');
    sprite._data.model.animation = 'none';
    run('stopped', () => E.frames(ss, 1));
    const c1 = Array.from(mesh.geometry.getBuffer('aVertexPosition').data);
    Graphics.frameCount += 30;
    run('stopped later', () => E.frames(ss, 1));
    assert.deepStrictEqual(Array.from(mesh.geometry.getBuffer('aVertexPosition').data), c1, "'none' holds the rest pose");
    // Picking by the drawn triangles.
    const pos = mesh.geometry.getBuffer('aVertexPosition').data, idx = mesh.geometry.getIndex().data;
    const cx = (pos[idx[0] * 2] + pos[idx[1] * 2] + pos[idx[2] * 2]) / 3, cy = (pos[idx[0] * 2 + 1] + pos[idx[1] * 2 + 1] + pos[idx[2] * 2 + 1]) / 3;
    assert.ok(ss.docsModelHit(sprite._data, cx, cy) > 0, 'a point on the model hits it');
    assert.strictEqual(ss.docsModelHit(sprite._data, cx + 400, cy), null, 'a point beside it does not');
    DocsDoodads.Perspective._cam = DocsDoodads.Perspective.liveCamera ? DocsDoodads.Perspective._cam : null;
    const W = DocsDoodads.Workspace;
    W.layerAllowsEditing = () => true;
    assert.strictEqual(W.doodadAtScreen({ x: cx, y: cy }), sprite._data, 'the editor picks it there');
    assert.strictEqual(W.doodadAtScreen({ x: cx + 400, y: cy }), null, 'and not beside it');
    const box = W.doodadFlatBox(sprite._data);
    // The model spans x -0.5 to 0.5 and stands 1.5 tall: at 48 pixels a unit, a 48 x 72 box on its foot.
    assert.ok(near(box.rect.w, 48) && near(box.rect.h, 72) && near(box.rect.y + box.rect.h, box.pivot.y), 'the box fits the model: ' + JSON.stringify(box.rect));
    assert.deepStrictEqual(errors, []);
} finally {
    fs.unlinkSync(glbPath);
    DocsDoodads.Models.forget(glbPath);
}

console.log("✓ glTF animation (linear, step, cubic, looping, by name), skinning, materials and their light, animated models drawn, picking by triangles and the model's selection box verified.");
