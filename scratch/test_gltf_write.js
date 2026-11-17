'use strict';
// 8.4.8 The 3D map as a file: the .glb writer read back with Gltf.parse (counts, bounds, UVs, pictures), the
// ground facing up, a flat map in two triangles, a 200 × 200 map under a size limit, and the editor's save.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const zlib = require('zlib');
const E = require('./engine/fake_engine');

const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-gltf-write-'));
process.chdir(projectRoot);
E.install();
E.setupWorld({ width: 10, height: 8, px: 2, py: 2 });
const tree = E.doodad(4, 5, { uid: 'tree', bit: [3, 'img/doodads/Tree.png'], frameW: 48, frameH: 96, depth: 'sorted' });
const rug = E.doodad(6, 6, { uid: 'rug', bit: [3, 'img/doodads/Rug.png'], depth: 'below' });
$dataDocsDoodads[1] = [tree, rug];
require('../Docs-Doodads.js');
const D = DocsDoodads, GW = D.GltfWrite, G = D.Gltf;

const png = Buffer.from(D.AsepriteSheets.encodePng(2, 2, new Uint8Array(16).fill(200), data => zlib.deflateSync(data)));
const read = bytes => G.meshes(G.parse(bytes));
const primsOf = model => model.prims || model.primitives || model;

// ---- Round trip ----
const ground = Object.assign(GW.flatGround(10, 8), { image: { bytes: png, mime: 'image/png' } });
const trees = GW.quads('Tree', [{ x: 4.5, y: 6, w: 1, h: 2 }, { x: 7, y: 3, w: 1, h: 2, ground: 0.5, flipX: true }], { bytes: png, mime: 'image/png' });
const glb = GW.glb([ground, trees]);
assert.strictEqual(new DataView(glb.buffer).getUint32(0, true), 0x46546c67, 'a binary glTF');
assert.strictEqual(glb.byteLength % 4, 0);
const doc = G.parse(glb);
assert.strictEqual(doc.json.asset.version, '2.0');
assert.strictEqual(doc.json.images.length, 1, 'one picture shared by both meshes is stored once');
const prims = primsOf(read(glb));
assert.strictEqual(prims.length, 2, 'two meshes come back');
assert.strictEqual(prims[0].indices.length / 3, 2, 'a flat map is two triangles');
assert.strictEqual(prims[1].indices.length / 3, 4, 'two standing pictures, two triangles each');
const bounds = G.boundsOf([prims[0].positions]);
assert.deepStrictEqual(bounds, { min: [0, 0, 0], max: [10, 0, 8] }, 'the ground spans the map, one tile a metre');
assert.deepStrictEqual(Array.from(prims[0].normals.slice(0, 3)), [0, 1, 0], 'the ground faces up');
assert.ok(prims[0].image && prims[0].image.bytes && prims[0].image.bytes.length === png.length, 'with its picture');
const treeBounds = G.boundsOf([prims[1].positions]);
assert.deepStrictEqual(treeBounds, { min: [4, 0, 3], max: [7.5, 2.5, 6] }, 'standing pictures stand on their ground');
assert.deepStrictEqual(Array.from(prims[1].uvs.slice(8, 10)), [1, 1], 'a flipped picture has its UVs flipped');
assert.strictEqual(doc.json.materials[1].doubleSided, true);
assert.strictEqual(doc.json.samplers[0].magFilter, 9728, 'nearest filtering keeps pixel art sharp');

// Terrain from Terrain.buildMesh-shaped data faces up after the axis change.
const built = { vertices: [{ x: 0, y: 0, h: 1, u: 0, v: 0 }, { x: 48, y: 0, h: 1, u: 48, v: 0 }, { x: 48, y: 48, h: 1, u: 48, v: 48 }, { x: 0, y: 48, h: 1, u: 0, v: 48 }], triangles: [0, 1, 2, 0, 2, 3] };
const hill = GW.groundFromTerrain(built, 48, 48, 96, 96);
const hillPrims = primsOf(read(GW.glb([hill])));
assert.ok(hillPrims[0].normals[1] > 0.99, 'terrain faces up');
assert.deepStrictEqual(Array.from(hillPrims[0].uvs.slice(2, 4)), [0.5, 0]);
assert.deepStrictEqual(GW.normalsFor([0, 0, 0, 1, 0, 0, 0, 0, 1], [0, 2, 1]).slice(0, 3), Float32Array.from([0, 1, 0]));

// A 200 × 200 map, a quad a tile, stays under a size limit and switches to 32-bit indices.
const big = { name: 'Big', positions: [], uvs: [], indices: [] };
for (let y = 0; y < 200; y++) for (let x = 0; x < 200; x++) {
    const b = big.positions.length / 3;
    big.positions.push(x, 0, y, x + 1, 0, y, x + 1, 0, y + 1, x, 0, y + 1);
    big.uvs.push(x / 200, y / 200, (x + 1) / 200, y / 200, (x + 1) / 200, (y + 1) / 200, x / 200, (y + 1) / 200);
    big.indices.push(b, b + 2, b + 1, b, b + 3, b + 2);
}
const bigGlb = GW.glb([big]);
assert.ok(bigGlb.byteLength < 8 * 1024 * 1024, `a 200 × 200 map is ${(bigGlb.byteLength / 1048576).toFixed(1)} MB`);
assert.strictEqual(G.parse(bigGlb).json.accessors.find(a => a.type === 'SCALAR').componentType, 5125);
assert.strictEqual(primsOf(read(bigGlb))[0].indices.length, 240000);

// ---- The editor ----
(async () => {
    const W = D.Workspace;
    W.showToast = () => {};
    W.currentMapId = () => 1;
    const ss = new Spriteset_Map();
    SceneManager._scene = { _spriteset: ss };
    E.frames(ss, 1);
    let renderedTree = null;
    D.MapExport.capture = spriteset => {
        renderedTree = spriteset._docsDoodadSprites.find(s => s._data === tree).renderable;
        return { canvas: { toDataURL: () => 'data:image/png;base64,' + png.toString('base64') } };
    };
    assert.deepStrictEqual(W.standingDoodads(), [tree], 'floor decals are part of the ground, not standing');
    const out = await W.saveMapGlb({ values: { scale: '0.5', groundOnly: false }, framePng: async () => png });
    assert.ok(/^screenshots\/Map001_3d_\d{8}-\d{6}\.glb$/.test(out), out);
    assert.strictEqual(renderedTree, false, 'standing doodads are left out of the ground picture');
    assert.notStrictEqual(ss._docsDoodadSprites.find(s => s._data === tree).renderable, false, 'and shown again after');
    const saved = primsOf(read(fs.readFileSync(out)));
    assert.strictEqual(saved.length, 2, 'the ground and the tree');
    assert.deepStrictEqual(G.boundsOf([saved[1].positions]).max.map(v => Math.round(v * 100) / 100), [5, 2, 6], 'the tree stands at its spot, two tiles tall');
    const groundOnly = await W.saveMapGlb({ values: { scale: '0.25', groundOnly: true }, framePng: async () => png });
    assert.strictEqual(primsOf(read(fs.readFileSync(groundOnly))).length, 1, 'ground only');
    D.Ui.form = async () => null;
    assert.strictEqual(await W.saveMapGlb(), null, 'nothing is written without a click');
    assert.ok(W.menus().find(m => m.id === 'map').items.some(i => i.id === 'dd-map-glb-btn'));
    console.log('glTF writing: round trip, shared pictures, bounds, normals, UVs, flat and terrain ground, 200 × 200 size, and Save 3D Map as File passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
