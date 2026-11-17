// @editor-only
//==========================================================
// SECTION 5W: WRITING glTF (8.4.8)
//==========================================================
// One binary .glb from meshes: { name, positions (x, y, z), normals, uvs, indices, image: { bytes, mime } | null,
// doubleSided }. Each mesh is a node of the one scene with its own material (its picture as the base colour,
// nearest-neighbour so pixel art stays sharp; cut-out transparency). Units: one tile is one metre, +Y up.
// Read back with DocsDoodads.Gltf.parse.
DocsDoodads.GltfWrite = {
    GLB: 0x46546c67, JSON: 0x4e4f534a, BIN: 0x004e4942,

    pad4(n) { return (4 - (n % 4)) % 4; },

    // Flat normals per triangle, added up per vertex and normalised: smooth where triangles share points.
    normalsFor(positions, indices) {
        const out = new Float32Array(positions.length);
        for (let i = 0; i + 2 < indices.length; i += 3) {
            const [a, b, c] = [indices[i] * 3, indices[i + 1] * 3, indices[i + 2] * 3];
            const ux = positions[b] - positions[a], uy = positions[b + 1] - positions[a + 1], uz = positions[b + 2] - positions[a + 2];
            const vx = positions[c] - positions[a], vy = positions[c + 1] - positions[a + 1], vz = positions[c + 2] - positions[a + 2];
            const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
            for (const k of [a, b, c]) { out[k] += nx; out[k + 1] += ny; out[k + 2] += nz; }
        }
        for (let k = 0; k < out.length; k += 3) {
            const length = Math.hypot(out[k], out[k + 1], out[k + 2]);
            if (length > 0) { out[k] /= length; out[k + 1] /= length; out[k + 2] /= length; } else out[k + 1] = 1;
        }
        return out;
    },

    glb(meshes, options = {}) {
        const json = { asset: { version: '2.0', generator: options.generator || "Doc's Doodads" }, scene: 0, scenes: [{ nodes: [] }], nodes: [], meshes: [],
            materials: [], accessors: [], bufferViews: [], buffers: [] };
        const chunks = [];
        let length = 0;
        const view = (bytes, target) => {
            const padding = this.pad4(length);
            if (padding) { chunks.push(new Uint8Array(padding)); length += padding; }
            json.bufferViews.push(Object.assign({ buffer: 0, byteOffset: length, byteLength: bytes.byteLength }, target ? { target } : {}));
            chunks.push(new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength));
            length += bytes.byteLength;
            return json.bufferViews.length - 1;
        };
        const accessor = (array, type, componentType, target, minMax) => {
            const count = array.length / ({ SCALAR: 1, VEC2: 2, VEC3: 3 }[type]);
            const a = { bufferView: view(array, target), componentType, count, type };
            if (minMax) {
                const n = { VEC2: 2, VEC3: 3 }[type], min = new Array(n).fill(Infinity), max = new Array(n).fill(-Infinity);
                for (let i = 0; i < array.length; i++) { const k = i % n; if (array[i] < min[k]) min[k] = array[i]; if (array[i] > max[k]) max[k] = array[i]; }
                a.min = min; a.max = max;
            }
            json.accessors.push(a);
            return json.accessors.length - 1;
        };
        const images = new Map();
        for (const mesh of meshes) {
            const positions = mesh.positions instanceof Float32Array ? mesh.positions : Float32Array.from(mesh.positions);
            if (!positions.length) continue;
            const count = positions.length / 3;
            const indices = count > 65535 ? Uint32Array.from(mesh.indices) : Uint16Array.from(mesh.indices);
            const normals = mesh.normals ? Float32Array.from(mesh.normals) : this.normalsFor(positions, indices);
            const attributes = { POSITION: accessor(positions, 'VEC3', 5126, 34962, true), NORMAL: accessor(normals, 'VEC3', 5126, 34962) };
            if (mesh.uvs) attributes.TEXCOORD_0 = accessor(Float32Array.from(mesh.uvs), 'VEC2', 5126, 34962);
            const primitive = { attributes, indices: accessor(indices, 'SCALAR', count > 65535 ? 5125 : 5123, 34963), mode: 4 };
            const material = { name: mesh.name || 'Material', doubleSided: Boolean(mesh.doubleSided), pbrMetallicRoughness: { metallicFactor: 0, roughnessFactor: 1 } };
            if (mesh.image && mesh.image.bytes && mesh.uvs) {
                if (!json.samplers) { json.samplers = [{ magFilter: 9728, minFilter: 9728, wrapS: 33071, wrapT: 33071 }]; json.textures = []; json.images = []; }
                let texture = images.get(mesh.image.bytes);
                if (texture === undefined) {
                    json.images.push({ bufferView: view(mesh.image.bytes instanceof Uint8Array ? mesh.image.bytes : new Uint8Array(mesh.image.bytes)), mimeType: mesh.image.mime || 'image/png' });
                    json.textures.push({ sampler: 0, source: json.images.length - 1 });
                    texture = json.textures.length - 1;
                    images.set(mesh.image.bytes, texture);
                }
                material.pbrMetallicRoughness.baseColorTexture = { index: texture };
                if (mesh.cutout !== false) { material.alphaMode = 'MASK'; material.alphaCutoff = 0.5; }
            }
            json.materials.push(material);
            primitive.material = json.materials.length - 1;
            json.meshes.push({ name: mesh.name || 'Mesh', primitives: [primitive] });
            json.nodes.push({ name: mesh.name || 'Node', mesh: json.meshes.length - 1 });
            json.scenes[0].nodes.push(json.nodes.length - 1);
        }
        const padding = this.pad4(length);
        if (padding) { chunks.push(new Uint8Array(padding)); length += padding; }
        json.buffers.push({ byteLength: length });
        const text = new TextEncoder().encode(JSON.stringify(json));
        const jsonPad = this.pad4(text.length), total = 12 + 8 + text.length + jsonPad + 8 + length;
        const out = new Uint8Array(total), dv = new DataView(out.buffer);
        dv.setUint32(0, this.GLB, true); dv.setUint32(4, 2, true); dv.setUint32(8, total, true);
        dv.setUint32(12, text.length + jsonPad, true); dv.setUint32(16, this.JSON, true);
        out.set(text, 20); out.fill(0x20, 20 + text.length, 20 + text.length + jsonPad);
        let at = 20 + text.length + jsonPad;
        dv.setUint32(at, length, true); dv.setUint32(at + 4, this.BIN, true); at += 8;
        for (const chunk of chunks) { out.set(chunk, at); at += chunk.length; }
        return out;
    },

    // A whole map's ground as one mesh from Terrain.buildMesh's vertices (map pixels, height in tiles).
    groundFromTerrain(built, tw, th, mapW, mapH) {
        const positions = new Float32Array(built.vertices.length * 3), uvs = new Float32Array(built.vertices.length * 2);
        built.vertices.forEach((v, i) => {
            positions[i * 3] = v.x / tw; positions[i * 3 + 1] = v.h; positions[i * 3 + 2] = v.y / th;
            uvs[i * 2] = v.u / mapW; uvs[i * 2 + 1] = v.v / mapH;
        });
        // Map y becomes glTF z, which mirrors the winding: each triangle is turned round so the ground faces up.
        const indices = [];
        for (let i = 0; i + 2 < built.triangles.length; i += 3) indices.push(built.triangles[i], built.triangles[i + 2], built.triangles[i + 1]);
        return { name: 'Ground', positions, uvs, indices };
    },

    // A flat map's ground: two triangles for the whole map.
    flatGround(tilesW, tilesH) {
        return { name: 'Ground', positions: [0, 0, 0, tilesW, 0, 0, tilesW, 0, tilesH, 0, 0, tilesH], uvs: [0, 0, 1, 0, 1, 1, 0, 1], indices: [0, 2, 1, 0, 3, 2] };
    },

    // Standing pictures as upright quads (facing +Z), merged per picture. items: [{ x, y, w, h, ground }] in
    // tiles: x the middle, y the foot, ground the height under it.
    quads(name, items, image) {
        const positions = [], uvs = [], indices = [];
        for (const it of items) {
            const base = positions.length / 3, half = it.w / 2, g = it.ground || 0;
            positions.push(it.x - half, g, it.y, it.x + half, g, it.y, it.x + half, g + it.h, it.y, it.x - half, g + it.h, it.y);
            const flip = it.flipX ? 1 : 0;
            uvs.push(flip, 1, 1 - flip, 1, 1 - flip, 0, flip, 0);
            indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
        }
        return { name, positions, uvs, indices, image, doubleSided: true };
    }
};
