//==========================================================
// SECTION 23B2: DRAWING 3D MODELS (PER-PIXEL LIGHT, NORMAL MAPS, CPU AND GPU)
//==========================================================
// Models are lit per pixel: each part carries its normals (and tangents, for a normal map) in map space,
// and the fragment shader works out the sun's light and the highlight towards the camera, so a glint
// lands between a cube's corners and normal maps show their bumps.
// Two ways to draw them. The CPU way (always available) poses and projects the points here, sorts the
// triangles far to near and draws them among the billboards. The GPU way (World > 3D Models, flat maps)
// poses the skin, places and projects the points in the vertex shader and draws each model into its own
// picture with a depth buffer, which is then drawn in its place; it falls back to the CPU way for curved
// worlds, skins with more joints than the shader takes, or a graphics card that refuses the shader.
DocsDoodads.Models.maxGpuJoints = 32;

DocsDoodads.Models.lightFragment = [
    'precision mediump float;',
    'varying vec2 vUv;',
    'varying vec3 vNormal;',
    'varying vec4 vTangent;',
    'varying vec4 vColor;',
    'uniform sampler2D uSampler;',
    'uniform sampler2D uNormalMap;',
    'uniform vec4 uColor;',
    'uniform vec3 uTint;',
    'uniform float uAlpha;',
    // Materials: glow (not darkened at night), metal (tints the highlight, darkens the diffuse light),
    // smoothness, the alpha mode (0 opaque, 1 mask below uCutoff, 2 blend), unlit, and the normal map.
    'uniform vec3 uEmissive;',
    'uniform float uMetal;',
    'uniform float uSmooth;',
    'uniform float uShine;',
    'uniform float uUnlit;',
    'uniform float uMode;',
    'uniform float uCutoff;',
    'uniform float uHasNormal;',
    'uniform float uNormalScale;',
    'uniform vec3 uLight;',
    'uniform vec3 uView;',
    'void main() {',
    '    vec4 c = texture2D(uSampler, vUv) * uColor * vColor;',
    '    if (uMode > 0.5 && uMode < 1.5 && c.a < uCutoff) discard;',
    '    float a = (uMode > 1.5 ? c.a : 1.0) * uAlpha;',
    '    vec3 n = normalize(vNormal);',
    '    if (uHasNormal > 0.5) {',
    '        vec3 t = normalize(vTangent.xyz - n * dot(n, vTangent.xyz));',
    '        vec3 b = cross(n, t) * vTangent.w;',
    '        vec3 m = texture2D(uNormalMap, vUv).xyz * 2.0 - 1.0;',
    '        m.xy *= uNormalScale;',
    '        n = normalize(t * m.x + b * m.y + n * m.z);',
    '    }',
    '    float diffuse = 0.45 + 0.55 * max(0.0, dot(n, uLight));',
    '    float spec = 0.0;',
    '    if (uSmooth > 0.0) {',
    '        vec3 h = normalize(uLight + uView);',
    '        spec = min(1.0, uSmooth * uSmooth * pow(max(0.0, dot(n, h)), uShine));',
    '        diffuse *= 1.0 - 0.6 * uMetal * uSmooth;',
    '    }',
    '    if (uUnlit > 0.5) { diffuse = 1.0; spec = 0.0; }',
    '    vec3 lit = (c.rgb * diffuse + spec * mix(vec3(1.0), c.rgb, uMetal)) * uTint + uEmissive;',
    '    gl_FragColor = vec4(lit * a, a);',
    '}'
].join('\n');

// The CPU way: points already in screen pixels, normals and tangents in map space.
DocsDoodads.Models.vertex = [
    'precision highp float;',
    'attribute vec2 aVertexPosition;',
    'attribute vec2 aUv;',
    'attribute vec3 aNormal;',
    'attribute vec4 aTangent;',
    'attribute vec4 aColor;',
    'uniform mat3 projectionMatrix;',
    'uniform mat3 translationMatrix;',
    'varying vec2 vUv;',
    'varying vec3 vNormal;',
    'varying vec4 vTangent;',
    'varying vec4 vColor;',
    'void main() {',
    '    vUv = aUv;',
    '    vNormal = aNormal;',
    '    vTangent = aTangent;',
    '    vColor = aColor;',
    '    gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);',
    '}'
].join('\n');
DocsDoodads.Models.fragment = DocsDoodads.Models.lightFragment;

// The GPU way: the part's own points (morphs added), its node or skin, placing and the camera, all here.
DocsDoodads.Models.gpuVertex = [
    'precision highp float;',
    'attribute vec3 aVertexPosition;',
    'attribute vec3 aLocalNormal;',
    'attribute vec4 aLocalTangent;',
    'attribute vec2 aUv;',
    'attribute vec4 aColor;',
    'attribute vec4 aJoints;',
    'attribute vec4 aWeights;',
    'uniform mat3 projectionMatrix;',
    'uniform mat4 uNode;',
    'uniform mat4 uJoints[' + DocsDoodads.Models.maxGpuJoints + '];',
    'uniform float uSkinned;',
    'uniform vec2 uYaw;',
    'uniform float uScale;',
    'uniform float uMirror;',
    'uniform vec3 uPivot;',
    'uniform vec3 uCamC;',
    'uniform vec3 uCamF;',
    'uniform vec3 uCamR;',
    'uniform vec3 uCamU;',
    'uniform float uFocal;',
    'uniform vec2 uHalf;',
    'uniform vec2 uOrigin;',
    'uniform vec2 uDepthRange;',
    'varying vec2 vUv;',
    'varying vec3 vNormal;',
    'varying vec4 vTangent;',
    'varying vec4 vColor;',
    'vec3 toMap(vec3 v) { return vec3(v.x * uYaw.x - v.z * uYaw.y, v.x * uYaw.y + v.z * uYaw.x, v.y); }',
    'void main() {',
    '    mat4 m = uNode;',
    '    if (uSkinned > 0.5) {',
    '        m = uJoints[int(aJoints.x)] * aWeights.x + uJoints[int(aJoints.y)] * aWeights.y',
    '          + uJoints[int(aJoints.z)] * aWeights.z + uJoints[int(aJoints.w)] * aWeights.w;',
    '    }',
    '    vec4 p = m * vec4(aVertexPosition, 1.0);',
    '    vec3 w = toMap(p.xyz) * uScale + uPivot;',
    '    vec3 v = w - uCamC;',
    '    float depth = dot(v, uCamF);',
    '    float k = uFocal / max(depth, 1.0);',
    '    vec2 screen = vec2(uHalf.x + dot(v, uCamR) * k, uHalf.y - dot(v, uCamU) * k) - uOrigin;',
    '    float z = clamp((depth - uDepthRange.x) / max(1.0, uDepthRange.y - uDepthRange.x), 0.0, 1.0) * 2.0 - 1.0;',
    '    gl_Position = vec4((projectionMatrix * vec3(screen, 1.0)).xy, z, 1.0);',
    // GLSL ES 1.00 (WebGL 1) can't make a mat3 from a mat4: built from its columns.
    '    mat3 r = mat3(m[0].xyz, m[1].xyz, m[2].xyz);',
    '    vNormal = normalize(toMap(r * aLocalNormal)) * uMirror;',
    '    vTangent = vec4(normalize(toMap(r * aLocalTangent.xyz)), -aLocalTangent.w);',
    '    vUv = aUv;',
    '    vColor = aColor;',
    '}'
].join('\n');

// The model's picture drawn on screen (premultiplied, faded by the fog).
DocsDoodads.Models.quadVertex = [
    'precision highp float;',
    'attribute vec2 aVertexPosition;',
    'attribute vec2 aTextureCoord;',
    'uniform mat3 projectionMatrix;',
    'uniform mat3 translationMatrix;',
    'varying vec2 vUv;',
    'void main() {',
    '    vUv = aTextureCoord;',
    '    gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);',
    '}'
].join('\n');
DocsDoodads.Models.quadFragment = [
    'precision mediump float;',
    'varying vec2 vUv;',
    'uniform sampler2D uSampler;',
    'uniform float uAlpha;',
    'void main() { gl_FragColor = texture2D(uSampler, vUv) * uAlpha; }'
].join('\n');

// A part's material as the light shader's uniforms.
DocsDoodads.Models.materialUniforms = function(prim, texture, normalTexture) {
    const rough = Math.max(0.02, Math.min(1, prim.roughness !== undefined ? prim.roughness : 1));
    return {
        uSampler: texture, uNormalMap: normalTexture || PIXI.Texture.WHITE, uColor: prim.color, uTint: [1, 1, 1], uAlpha: 1,
        uEmissive: (prim.emissive || [0, 0, 0]).slice(), uMetal: Math.max(0, Math.min(1, prim.metallic !== undefined ? prim.metallic : 0)),
        uSmooth: 1 - rough,
        // Worked out per pixel, so the highlight can be sharp (a smooth ball gets a small bright spot).
        uShine: Math.max(2, Math.min(256, 2 / (rough * rough * rough * rough + 0.001) - 2)),
        uUnlit: prim.unlit ? 1 : 0,
        uMode: prim.alphaMode === 'MASK' ? 1 : prim.alphaMode === 'BLEND' ? 2 : 0, uCutoff: prim.alphaCutoff !== undefined ? prim.alphaCutoff : 0.5,
        uHasNormal: prim.normalImage && normalTexture && normalTexture !== PIXI.Texture.WHITE ? 1 : 0, uNormalScale: prim.normalScale || 1,
        uLight: [0, 0, 1], uView: [0, 0, 1]
    };
};

// Normals (and tangents) turned from the model's space into the map's: model x, y up, z towards the
// viewer, turned by yaw, become map east, south, up. That swap mirrors, so tangents' handedness flips.
DocsDoodads.Models.mapNormals = function(normals, tangents, yaw, mirrored, outN, outT) {
    const r = (yaw || 0) * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
    const sign = mirrored ? -1 : 1;
    const n = normals.length / 3;
    for (let v = 0; v < n; v++) {
        const x = normals[v * 3], y = normals[v * 3 + 1], z = normals[v * 3 + 2];
        outN[v * 3] = (x * c - z * s) * sign; outN[v * 3 + 1] = (x * s + z * c) * sign; outN[v * 3 + 2] = y * sign;
        if (tangents) {
            const tx = tangents[v * 4], ty = tangents[v * 4 + 1], tz = tangents[v * 4 + 2];
            outT[v * 4] = tx * c - tz * s; outT[v * 4 + 1] = tx * s + tz * c; outT[v * 4 + 2] = ty; outT[v * 4 + 3] = -tangents[v * 4 + 3];
        } else {
            outT[v * 4] = 1; outT[v * 4 + 1] = 0; outT[v * 4 + 2] = 0; outT[v * 4 + 3] = 1;
        }
    }
};

// Whether a model can be drawn the GPU way here (and the world asks for it).
DocsDoodads.Models.gpuFor = function(entry, cam) {
    const w = DocsDoodads.World.settings().models3d || {};
    if (!w.gpu || this._gpuBroken || !cam || cam.curve !== 'flat') return false;
    if (typeof PIXI === 'undefined' || !PIXI.RenderTexture || !PIXI.Mesh) return false;
    for (const s of entry.skins || []) if (s.joints.length > this.maxGpuJoints) return false;
    return true;
};

if (typeof Spriteset_Map !== 'undefined' && typeof PIXI !== 'undefined') {
    // A model doodad's draw items for this frame, or null to draw its picture instead (no model, or still
    // loading). Doodads showing the same model, animation and moment share one pose.
    Spriteset_Map.prototype.docsModelItems = function(obj, cam, pivot, fog, light, s) {
        const d = obj._data;
        const entry = d && d.model && d.model.path ? DocsDoodads.Models.get(d.model.path) : null;
        if (!entry || !entry.ready || !entry.primitives.length) return null;
        const G = DocsDoodads.Gltf;
        // Kept for picking a model drawn the GPU way, and for its box in the editor.
        obj._docsLastPivot = pivot;
        // Another model (the path changed, or it was loaded again): the old parts go.
        if (obj._docsModelEntry !== entry) {
            this.docsFreeModel(obj);
            obj._docsModelEntry = entry;
        }
        const animation = G.pickAnimation(entry, d.model.animation);
        const speed = d.model.speed !== undefined && d.model.speed !== '' ? Number(d.model.speed) : 1;
        const time = animation ? DocsDoodads.frameCount() / 60 * (Number.isFinite(speed) ? speed : 1) : 0;
        const ctx = { obj, d, entry, cam, pivot, fog, light, s, animation, time };
        if (DocsDoodads.Models.gpuFor(entry, cam)) {
            try {
                const items = this.docsModelItemsGpu(ctx);
                if (items) return items;
            } catch (e) {
                // A card that won't build the shader: the CPU way from now on.
                DocsDoodads.Models._gpuBroken = true;
                console.warn('[DocsDoodads] Drawing models on the GPU failed; drawing them the usual way. ' + (e && e.message));
                this.docsFreeModelGpu(obj);
            }
        }
        if (obj._docsModelGpu) this.docsFreeModelGpu(obj);
        return this.docsModelItemsCpu(ctx);
    };

    // The pose for this frame (shared by doodads with the same model, animation and moment).
    Spriteset_Map.prototype.docsModelPose = function(ctx) {
        const { obj, entry, animation, time } = ctx;
        if (!animation) { obj._docsPose = null; return null; }
        const shared = entry._docsPoses = entry._docsPoses || new Map();
        let posed = shared.get(animation);
        if (!posed || posed.time !== time) {
            posed = { time, entry, animation, data: DocsDoodads.Gltf.pose(entry, animation, time) };
            shared.set(animation, posed);
        }
        obj._docsPose = posed;
        return posed.data;
    };

    // The CPU way: placed points and normals are kept until the model turns, scales or moves its pose; the
    // projected triangles until the camera or the doodad moves.
    Spriteset_Map.prototype.docsModelItemsCpu = function(ctx) {
        const { obj, d, entry, cam, pivot, fog, light, s, animation, time } = ctx;
        const P = DocsDoodads.Perspective, G = DocsDoodads.Gltf, T = DocsDoodads.Terrain, M = DocsDoodads.Models;
        const tw = $gameMap.tileWidth();
        const scale = (Number(d.model.scale) || 1) * tw * s.doodadScale, yaw = Number(d.model.yaw) || 0;
        const dir = this._docsSkyLight || T.light;
        const flat = cam.curve === 'flat';
        const meshes = obj._docsModelMeshes = obj._docsModelMeshes || [];
        const items = [];
        const ph = pivot.h || 0;
        const pivotDepth = P.project(cam, pivot.x, pivot.y, ph);
        if (!pivotDepth) return [];
        const groundDepth = P.groundDepth(cam, pivot.x, pivot.y);
        const pose = this.docsModelPose(ctx);
        const poseKey = animation ? '|' + animation.name + '@' + time : '';
        const placeKey = scale + '|' + yaw + poseKey;
        const view = [-cam.F.x, -cam.F.y, -cam.F.z];
        const C = cam.C, F = cam.F, R = cam.R, U = cam.U;
        const frameKey = [C.x, C.y, C.z, F.x, F.y, F.z, R.x, R.y, U.z, cam.focal, cam.width, cam.height, cam.curve, cam.radius,
            cam.target.x, cam.target.y, pivot.x, pivot.y, ph, placeKey].join(',');
        // A doodad flipped by a negative scale turns its faces inside out.
        const mirrored = scale < 0;
        const hw = cam.width / 2, hh = cam.height / 2, focal = cam.focal;
        entry.primitives.forEach((prim, pi) => {
            const positions = pose ? pose.positions[pi] : prim.positions, normals = pose ? pose.normals[pi] : prim.normals;
            const n = positions.length / 3, triCount = prim.indices.length / 3;
            let m = meshes[pi];
            if (!m || m._destroyed || m._docsCount !== n || m._docsTris !== triCount) {
                if (m && !m._destroyed) m.destroy();
                const colors = prim.colors ? new Float32Array(prim.colors) : new Float32Array(n * 4).fill(1);
                const geometry = new PIXI.Geometry()
                    .addAttribute('aVertexPosition', new Float32Array(n * 2), 2)
                    .addAttribute('aUv', new Float32Array(prim.uvs), 2)
                    .addAttribute('aNormal', new Float32Array(n * 3), 3)
                    .addAttribute('aTangent', new Float32Array(n * 4), 4)
                    .addAttribute('aColor', colors, 4)
                    .addIndex(n < 65536 ? new Uint16Array(prim.indices.length) : new Uint32Array(prim.indices.length));
                const shader = PIXI.Shader.from(M.vertex, M.fragment, M.materialUniforms(prim, entry.textures[pi], entry.normalTextures && entry.normalTextures[pi]));
                m = meshes[pi] = new PIXI.Mesh(geometry, shader);
                m._docsCount = n;
                m._docsTris = triCount;
                m._docsPlaced = new Float64Array(n * 3);
                m._docsDepth = new Float64Array(n);
                m._docsOk = new Uint8Array(n);
                m._docsSort = T.sortBuffers(triCount);
                m._docsTri = new Uint32Array(triCount);
                m._docsPlaceKey = m._docsNormalKey = m._docsFrameKey = null;
            }
            const placed = m._docsPlaced;
            if (m._docsPlaceKey !== placeKey) {
                for (let v = 0; v < n; v++) {
                    const w = G.place(positions[v * 3], positions[v * 3 + 1], positions[v * 3 + 2], scale, yaw);
                    placed[v * 3] = w.dx; placed[v * 3 + 1] = w.dy; placed[v * 3 + 2] = w.h;
                }
                m._docsPlaceKey = placeKey;
                m._docsFrameKey = null;
            }
            // Normals (and tangents, for a normal map) in map space, again only when the pose or turn changes.
            if (m._docsNormalKey !== placeKey) {
                const tangents = prim.normalImage ? G.tangentsFor(positions, normals, prim.uvs, prim.indices) : null;
                M.mapNormals(normals, tangents, yaw, false, m.geometry.getBuffer('aNormal').data, m.geometry.getBuffer('aTangent').data);
                m.geometry.getBuffer('aNormal').update();
                m.geometry.getBuffer('aTangent').update();
                m._docsNormalKey = placeKey;
            }
            if (m._docsFrameKey !== frameKey) {
                const pos = m.geometry.getBuffer('aVertexPosition').data, ok = m._docsOk, depthOf = m._docsDepth;
                // P.project, written out so the loop allocates nothing on flat maps.
                for (let v = 0; v < n; v++) {
                    let x = pivot.x + placed[v * 3], y = pivot.y + placed[v * 3 + 1], z = ph + placed[v * 3 + 2];
                    if (!flat) {
                        const g = P.groundPoint(cam, x, y, z);
                        if (!g.visible) { ok[v] = 0; continue; }
                        x = g.x; y = g.y; z = g.z;
                    }
                    const vx = x - C.x, vy = y - C.y, vz = z - C.z;
                    const depth = vx * F.x + vy * F.y + vz * F.z;
                    if (depth < 1) { ok[v] = 0; continue; }
                    const k = focal / depth;
                    pos[v * 2] = hw + (vx * R.x + vy * R.y + vz * R.z) * k;
                    pos[v * 2 + 1] = hh - (vx * U.x + vy * U.y + vz * U.z) * k;
                    depthOf[v] = depth;
                    ok[v] = 1;
                }
                const idx = prim.indices, buf = m._docsSort;
                let count = 0, sum = 0;
                for (let t = 0; t < triCount; t++) {
                    const a = idx[t * 3], b = idx[t * 3 + 1], c = idx[t * 3 + 2];
                    if (!ok[a] || !ok[b] || !ok[c]) continue;
                    // Single-sided faces turned away from the camera are skipped.
                    if (!prim.doubleSided) {
                        const area = (pos[b * 2] - pos[a * 2]) * (pos[c * 2 + 1] - pos[a * 2 + 1]) - (pos[c * 2] - pos[a * 2]) * (pos[b * 2 + 1] - pos[a * 2 + 1]);
                        if (mirrored ? area < 0 : area > 0) continue;
                    }
                    const depth = (depthOf[a] + depthOf[b] + depthOf[c]) / 3;
                    buf.depth[count] = depth;
                    m._docsTri[count++] = t;
                    sum += depth;
                }
                const sorted = T.sortFarToNear(buf, count);
                const out = m.geometry.getIndex().data;
                for (let i = 0; i < count; i++) {
                    const t = m._docsTri[sorted[i]];
                    out[i * 3] = idx[t * 3]; out[i * 3 + 1] = idx[t * 3 + 1]; out[i * 3 + 2] = idx[t * 3 + 2];
                }
                m.geometry.getBuffer('aVertexPosition').update();
                m.geometry.getIndex().update();
                m._docsFrameKey = frameKey;
                m._docsDrawn = count;
                m._docsMean = count ? sum / count : pivotDepth.depth;
            }
            const u = m.shader.uniforms;
            u.uSampler = entry.textures[pi];
            u.uAlpha = 1 - fog;
            u.uLight = dir;
            u.uView = view;
            u.uTint = light !== null && light !== undefined ? [((light >> 16) & 255) / 255, ((light >> 8) & 255) / 255, (light & 255) / 255] : [1, 1, 1];
            // Parts sort among themselves by their own depth, all at the model's place among billboards.
            const count = m._docsDrawn;
            if (count) items.push({ terrain: true, mesh: m, start: 0, count, depth: groundDepth + (m._docsMean - pivotDepth.depth) * 1e-3, bias: tw * 0.5, z: obj.z || 0, spriteId: obj.spriteId || 0 });
        });
        // Parts the model no longer has.
        for (let i = entry.primitives.length; i < meshes.length; i++) if (meshes[i] && !meshes[i]._destroyed) meshes[i].destroy();
        meshes.length = entry.primitives.length;
        return items;
    };

    // ---- The GPU way ----
    Spriteset_Map.prototype.docsModelItemsGpu = function(ctx) {
        const { obj, d, entry, cam, pivot, fog, light, s, animation, time } = ctx;
        const P = DocsDoodads.Perspective, G = DocsDoodads.Gltf, T = DocsDoodads.Terrain, M = DocsDoodads.Models;
        const renderer = DocsDoodads.Compat.getRenderer();
        if (!renderer) return null;
        const tw = $gameMap.tileWidth();
        const scale = (Number(d.model.scale) || 1) * tw * s.doodadScale, yaw = Number(d.model.yaw) || 0;
        const ph = pivot.h || 0;
        const pivotDepth = P.project(cam, pivot.x, pivot.y, ph);
        if (!pivotDepth) return [];
        const groundDepth = P.groundDepth(cam, pivot.x, pivot.y);
        const gpu = obj._docsModelGpu = obj._docsModelGpu || { meshes: [], scene: new PIXI.Container(), rt: null, quad: null };
        // The pose's matrices (the skin is posed in the shader); morphs are added here when their weights move.
        const mats = animation ? G.matrices(entry, animation, time) : (entry._docsRest = entry._docsRest || G.matrices(entry, null, 0));
        // The moment drawn (the editor's box follows it; its points are worked out only if asked for).
        obj._docsPose = animation ? { time, entry, animation, data: null } : null;
        const bounds = this.docsModelBounds(obj, entry, animation, time);
        // Where it lands on screen: the box round its pose, projected, is the picture's size.
        const r = (yaw * Math.PI) / 180, c = Math.cos(r), sn = Math.sin(r);
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, near = Infinity, far = -Infinity;
        for (const bx of [bounds.min[0], bounds.max[0]]) for (const by of [bounds.min[1], bounds.max[1]]) for (const bz of [bounds.min[2], bounds.max[2]]) {
            const wx = pivot.x + (bx * c - bz * sn) * scale, wy = pivot.y + (bx * sn + bz * c) * scale, wz = ph + by * scale;
            const p = P.project(cam, wx, wy, wz);
            if (!p) continue;
            x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y);
            near = Math.min(near, p.depth); far = Math.max(far, p.depth);
        }
        if (!(x1 > x0) || !(y1 > y0)) return [];
        x0 = Math.max(0, Math.floor(x0) - 2); y0 = Math.max(0, Math.floor(y0) - 2);
        x1 = Math.min(cam.width, Math.ceil(x1) + 2); y1 = Math.min(cam.height, Math.ceil(y1) + 2);
        const w = Math.max(1, x1 - x0), h = Math.max(1, y1 - y0);
        if (!gpu.rt || gpu.rt.width < w || gpu.rt.height < h || gpu.rt.width > w * 2 + 64 || gpu.rt.height > h * 2 + 64) {
            if (gpu.rt) gpu.rt.destroy(true);
            gpu.rt = PIXI.RenderTexture.create({ width: Math.ceil(w / 32) * 32, height: Math.ceil(h / 32) * 32 });
            if (gpu.rt.framebuffer && gpu.rt.framebuffer.enableDepth) gpu.rt.framebuffer.enableDepth();
        }
        const dir = this._docsSkyLight || T.light;
        const view = [-cam.F.x, -cam.F.y, -cam.F.z];
        const tint = light !== null && light !== undefined ? [((light >> 16) & 255) / 255, ((light >> 8) & 255) / 255, (light & 255) / 255] : [1, 1, 1];
        const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
        entry.primitives.forEach((prim, pi) => {
            const n = prim.local.positions.length / 3;
            let m = gpu.meshes[pi];
            if (!m || m._destroyed || m._docsCount !== n) {
                if (m && !m._destroyed) m.destroy();
                const tangents = prim.normalImage ? G.tangentsFor(prim.local.positions, prim.local.normals || new Float32Array(n * 3).fill(0), prim.uvs, prim.indices) : new Float32Array(n * 4);
                const geometry = new PIXI.Geometry()
                    .addAttribute('aVertexPosition', new Float32Array(prim.local.positions), 3)
                    .addAttribute('aLocalNormal', prim.local.normals ? new Float32Array(prim.local.normals) : new Float32Array(n * 3).map((v, i) => (i % 3 === 1 ? 1 : 0)), 3)
                    .addAttribute('aLocalTangent', tangents, 4)
                    .addAttribute('aUv', new Float32Array(prim.uvs), 2)
                    .addAttribute('aColor', prim.colors ? new Float32Array(prim.colors) : new Float32Array(n * 4).fill(1), 4)
                    .addAttribute('aJoints', prim.joints ? new Float32Array(prim.joints) : new Float32Array(n * 4), 4)
                    .addAttribute('aWeights', prim.weights ? new Float32Array(prim.weights) : new Float32Array(n * 4), 4)
                    .addIndex(n < 65536 ? new Uint16Array(prim.indices) : new Uint32Array(prim.indices));
                const uniforms = Object.assign(M.materialUniforms(prim, entry.textures[pi], entry.normalTextures && entry.normalTextures[pi]), {
                    uNode: identity, uJoints: new Float32Array(M.maxGpuJoints * 16), uSkinned: 0, uYaw: [1, 0], uScale: 1, uMirror: 1,
                    uPivot: [0, 0, 0], uCamC: [0, 0, 0], uCamF: [0, 0, 1], uCamR: [1, 0, 0], uCamU: [0, 1, 0], uFocal: 1, uHalf: [0, 0], uOrigin: [0, 0], uDepthRange: [0, 1]
                });
                m = gpu.meshes[pi] = new PIXI.Mesh(geometry, PIXI.Shader.from(M.gpuVertex, M.lightFragment, uniforms));
                if (!m.state) m.state = PIXI.State && PIXI.State.for2d ? PIXI.State.for2d() : {};
                m.state.depthTest = true;
                // The depth test hides the back of a closed model; culling is left off (the winding flips on screen).
                m.state.culling = false;
                m._docsCount = n;
                m._docsWeights = null;
                gpu.scene.addChild(m);
            }
            // Morphs: the points move only when the weights change.
            if (prim.morph) {
                const wts = (mats.weights[prim.node] || prim.morph.weights).map(Number);
                const key = wts.join(',');
                if (m._docsWeights !== key) {
                    const buf = m.geometry.getBuffer('aVertexPosition');
                    buf.data.set(G.morph(prim.local.positions, prim.morph.targets, wts, 'positions'));
                    buf.update();
                    if (prim.local.normals) {
                        const nb = m.geometry.getBuffer('aLocalNormal');
                        nb.data.set(G.morph(prim.local.normals, prim.morph.targets, wts, 'normals'));
                        nb.update();
                    }
                    m._docsWeights = key;
                }
            }
            const u = m.shader.uniforms;
            if (prim.skin !== undefined) {
                const joints = mats.joints[prim.skin] || [];
                const arr = u.uJoints instanceof Float32Array ? u.uJoints : new Float32Array(M.maxGpuJoints * 16);
                joints.forEach((jm, k) => arr.set(jm, k * 16));
                u.uJoints = arr;
                u.uSkinned = 1;
            } else {
                u.uNode = mats.world[prim.node] || identity;
                u.uSkinned = 0;
            }
            u.uYaw = [c, sn];
            u.uScale = scale;
            u.uMirror = scale < 0 ? -1 : 1;
            u.uPivot = [pivot.x, pivot.y, ph];
            u.uCamC = [cam.C.x, cam.C.y, cam.C.z];
            u.uCamF = [cam.F.x, cam.F.y, cam.F.z];
            u.uCamR = [cam.R.x, cam.R.y, cam.R.z];
            u.uCamU = [cam.U.x, cam.U.y, cam.U.z];
            u.uFocal = cam.focal;
            u.uHalf = [cam.width / 2, cam.height / 2];
            u.uOrigin = [x0, y0];
            u.uDepthRange = [Math.max(1, near - 1), far + 1];
            u.uSampler = entry.textures[pi];
            u.uLight = dir;
            u.uView = view;
            u.uTint = tint;
            u.uAlpha = 1;
        });
        for (let i = entry.primitives.length; i < gpu.meshes.length; i++) if (gpu.meshes[i] && !gpu.meshes[i]._destroyed) gpu.meshes[i].destroy();
        gpu.meshes.length = entry.primitives.length;
        // The model's picture: cleared, its depth too, then every part with the depth test.
        if (renderer.renderTexture && renderer.renderTexture.bind) {
            renderer.renderTexture.bind(gpu.rt);
            const gl = renderer.gl;
            if (gl && gl.clear) { gl.clearColor(0, 0, 0, 0); gl.clearDepth(1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); }
        }
        renderer.render(gpu.scene, gpu.rt, false);
        // The picture, drawn as a flat quad where the model is on screen, at the model's depth.
        if (!gpu.quad || gpu.quad._destroyed) {
            const geometry = new PIXI.Geometry()
                .addAttribute('aVertexPosition', new Float32Array(8), 2)
                .addAttribute('aTextureCoord', new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), 2)
                .addIndex(new Uint16Array([0, 1, 2, 0, 2, 3]));
            gpu.quad = new PIXI.Mesh(geometry, PIXI.Shader.from(M.quadVertex, M.quadFragment, { uSampler: gpu.rt, uAlpha: 1 }));
        }
        const quadPos = gpu.quad.geometry.getBuffer('aVertexPosition');
        quadPos.data.set([x0, y0, x0 + w, y0, x0 + w, y0 + h, x0, y0 + h]);
        quadPos.update();
        const uvs = gpu.quad.geometry.getBuffer('aTextureCoord');
        uvs.data.set([0, 0, w / gpu.rt.width, 0, w / gpu.rt.width, h / gpu.rt.height, 0, h / gpu.rt.height]);
        uvs.update();
        gpu.quad.shader.uniforms.uSampler = gpu.rt;
        gpu.quad.shader.uniforms.uAlpha = 1 - fog;
        gpu.screen = { x0, y0, w, h };
        obj._docsModelGpuDrawn = true;
        return [{ terrain: true, mesh: gpu.quad, start: 0, count: 2, depth: groundDepth, bias: tw * 0.5, z: obj.z || 0, spriteId: obj.spriteId || 0 }];
    };

    // The box round the model's pose at this moment (model units), kept while the pose stays.
    Spriteset_Map.prototype.docsModelBounds = function(obj, entry, animation, time) {
        if (!animation) return { min: entry.min, max: entry.max };
        const cache = entry._docsBounds = entry._docsBounds || new Map();
        const key = animation.name + '@' + time;
        let b = cache.get(key);
        if (!b) {
            const posed = obj._docsPose && obj._docsPose.animation === animation && obj._docsPose.time === time && obj._docsPose.data ? obj._docsPose.data : DocsDoodads.Gltf.pose(entry, animation, time);
            b = DocsDoodads.Gltf.boundsOf(posed.positions) || { min: entry.min, max: entry.max };
            if (cache.size > 120) cache.clear();
            cache.set(key, b);
        }
        return b;
    };

    Spriteset_Map.prototype.docsFreeModelGpu = function(obj) {
        const gpu = obj._docsModelGpu;
        obj._docsModelGpu = null;
        obj._docsModelGpuDrawn = false;
        if (!gpu) return;
        for (const m of gpu.meshes) if (m && !m._destroyed) m.destroy();
        if (gpu.quad && !gpu.quad._destroyed) gpu.quad.destroy();
        if (gpu.rt) gpu.rt.destroy(true);
    };

    Spriteset_Map.prototype.docsFreeModel = function(obj) {
        for (const m of obj._docsModelMeshes || []) if (m && !m._destroyed) m.destroy();
        obj._docsModelMeshes = [];
        this.docsFreeModelGpu(obj);
    };

    // The editor picks a model doodad by the triangles drawn last frame: the depth under the screen point
    // (x, y in the camera's pixels), or null when the point misses the model. A model drawn the GPU way is
    // projected here, when it is clicked.
    Spriteset_Map.prototype.docsModelHit = function(d, x, y) {
        const sprite = (this._docsDoodadSprites || []).find(sp => sp._data === d);
        if (!sprite || !sprite.visible) return null;
        if (sprite._docsModelGpuDrawn) {
            const cam = DocsDoodads.Perspective.liveCamera();
            const s = DocsDoodads.Perspective.active();
            if (!cam || !s || !sprite._docsLastPivot) return null;
            // A one-off CPU drawing of the model at the same place gives its triangles.
            const saved = sprite._docsModelMeshes;
            sprite._docsModelMeshes = [];
            const animation = DocsDoodads.Gltf.pickAnimation(sprite._docsModelEntry, d.model.animation);
            this.docsModelItemsCpu({ obj: sprite, d, entry: sprite._docsModelEntry, cam, pivot: sprite._docsLastPivot, fog: 0, light: null, s, animation,
                time: sprite._docsPose ? sprite._docsPose.time : 0 });
            const hit = this.docsModelHitMeshes(sprite._docsModelMeshes, x, y);
            for (const m of sprite._docsModelMeshes) if (m && !m._destroyed) m.destroy();
            sprite._docsModelMeshes = saved;
            return hit;
        }
        return sprite._docsModelMeshes ? this.docsModelHitMeshes(sprite._docsModelMeshes, x, y) : null;
    };

    Spriteset_Map.prototype.docsModelHitMeshes = function(meshes, x, y) {
        let best = null;
        for (const m of meshes) {
            if (!m || m._destroyed || !m._docsDrawn) continue;
            const pos = m.geometry.getBuffer('aVertexPosition').data, idx = m.geometry.getIndex().data;
            for (let i = 0; i < m._docsDrawn; i++) {
                const a = idx[i * 3], b = idx[i * 3 + 1], c = idx[i * 3 + 2];
                const ax = pos[a * 2], ay = pos[a * 2 + 1], bx = pos[b * 2], by = pos[b * 2 + 1], cx = pos[c * 2], cy = pos[c * 2 + 1];
                const d1 = (x - bx) * (ay - by) - (ax - bx) * (y - by);
                const d2 = (x - cx) * (by - cy) - (bx - cx) * (y - cy);
                const d3 = (x - ax) * (cy - ay) - (cx - ax) * (y - ay);
                if ((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0)) continue;
                const depth = (m._docsDepth[a] + m._docsDepth[b] + m._docsDepth[c]) / 3;
                if (best === null || depth < best) best = depth;
            }
        }
        return best;
    };
}
