// scratch/test_gltf_models.js
// 3D models as doodads: the glTF reader, on models exported by Blender (scratch/fixtures), and the
// helpers that place and light them on the map.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log("=== Testing glTF Models ===");

global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.document = {
    createElement: () => ({ style: {}, appendChild() {}, removeChild() {}, querySelectorAll: () => [], addEventListener() {}, getContext: () => ({}) }),
    body: { appendChild() {}, removeChild() {} },
    getElementById: () => null
};
global.Utils = { RPGMAKER_NAME: "MZ", isNwjs: () => true, isOptionValid: (opt) => opt === "test" };
global.PluginManager = { parameters: () => ({}) };
global.$dataDocsDoodads = {};

require('../Docs-Doodads.js');
const G = DocsDoodads.Gltf;
const near = (a, b, eps = 1e-4) => Math.abs(a - b) <= eps;
const fixture = name => fs.readFileSync(path.join(__dirname, 'fixtures', name));

// 1. The tree: two parts (trunk and canopy), each with its own colour, from two root nodes.
const tree = G.meshes(G.parse(fixture('tree.glb')));
assert.strictEqual(tree.primitives.length, 2);
assert.ok(near(tree.min[1], 0) && near(tree.max[1], 3), 'stands from 0 to 3 units tall');
const [bark, leaves] = tree.primitives;
assert.ok(near(bark.color[0], G.toSrgb(0.35)) && bark.color[0] > 0.6, 'colours come out in sRGB');
assert.ok(leaves.color[1] > leaves.color[0] && leaves.color[1] > leaves.color[2], 'the canopy is green');
assert.strictEqual(bark.image, null);
for (const prim of tree.primitives) {
    assert.strictEqual(prim.indices.length % 3, 0);
    assert.ok(Math.max(...prim.indices) < prim.positions.length / 3, 'indices in range');
    for (let i = 0; i < prim.normals.length; i += 3) assert.ok(near(Math.hypot(prim.normals[i], prim.normals[i + 1], prim.normals[i + 2]), 1, 1e-3));
}

// 2. The crate: a cube under a node turned 45 degrees, with an embedded checker texture.
const crate = G.meshes(G.parse(fixture('crate.glb')));
assert.strictEqual(crate.primitives.length, 1);
const half = Math.SQRT1_2;
assert.ok(near(crate.max[0], half) && near(crate.min[0], -half), 'turned by the parent node');
assert.ok(near(crate.min[1], 0) && near(crate.max[1], 1));
const prim = crate.primitives[0];
assert.ok(prim.image && prim.image.mime === 'image/png' && prim.image.bytes.length > 8);
assert.deepStrictEqual(Array.from(prim.image.bytes.subarray(1, 4)), [80, 78, 71], 'PNG bytes');
assert.strictEqual(prim.nearest, true, 'the sampler asks for nearest filtering');
assert.strictEqual(prim.indices.length, 36);

// 3. A .gltf with its data in a data URI reads the same, and other files are refused clearly.
const glb = fixture('crate.glb');
const jsonLen = glb.readUInt32LE(12);
const json = JSON.parse(glb.subarray(20, 20 + jsonLen).toString());
const binStart = 20 + jsonLen + 8;
json.buffers = [{ byteLength: json.buffers[0].byteLength, uri: 'data:application/octet-stream;base64,' + glb.subarray(binStart, binStart + json.buffers[0].byteLength).toString('base64') }];
const fromText = G.meshes(G.parse(Buffer.from(JSON.stringify(json))));
assert.deepStrictEqual(Array.from(fromText.primitives[0].positions), Array.from(prim.positions));
const external = JSON.parse(JSON.stringify(json));
external.buffers[0].uri = 'crate.bin';
const read = [];
G.parse(Buffer.from(JSON.stringify(external)), uri => { read.push(uri); return glb.subarray(binStart, binStart + json.buffers[0].byteLength); });
assert.deepStrictEqual(read, ['crate.bin'], 'external buffers are read next to the model');
assert.throws(() => G.parse(Buffer.from('{"asset":{"version":"1.0"}}')), /glTF 2\.0/);

// 4. Placing on the map: +Z faces the viewer (south), turning goes clockwise, 1 unit = scale pixels.
assert.deepStrictEqual(G.place(0, 2, 1, 48, 0), { dx: 0, dy: 48, h: 96 });
const turned = G.place(1, 0, 0, 48, 90);
assert.ok(near(turned.dx, 0) && near(turned.dy, 48), 'east turns to south after a quarter turn');
// Light: a face towards the light is bright, one facing away is at the floor.
const up = [0, 0, 1];
assert.ok(near(G.shade(0, 1, 0, 0, up), 1));
assert.ok(near(G.shade(0, -1, 0, 0, up), 0.45));

console.log("✓ glTF models: GLB and .gltf reading (nodes, colours, textures, external buffers), placing and lighting verified.");
