//==========================================================
// SECTION 5H: VISUAL EQUIPMENT & MAP DESTINATION
//==========================================================
// Gear drawn on characters. Notetags (weapons, armors, states, actors, classes, events):
//   <visual: image, z N, part P, index I, sv SVIMAGE>   a layer (z < 0 is behind the body)
//   <visual base: ...>                                  a layer the actor always wears (hair, ears)
//   <visual hide: part, part>                           parts this hides (a helmet hides the hair)
//   <visual color: part, switch N | variable N, hue N, tint #rrggbb>
//   <visual alias: X>                                   fills {alias} in image names (body types)
//   <visual actor: N>                                   an event wears actor N's look
DocsDoodads.VisualEquip = {
    _notes: {},

    parseLayer(text) {
        const parts = String(text || '').split(',').map(p => p.trim()).filter(Boolean);
        const image = parts.shift() || '';
        const layer = { image, z: 1, up: null, part: image, index: null, sv: '' };
        for (const p of parts) {
            const m = /^(z|up|part|index|sv)\s*[:=]?\s*(.+)$/i.exec(p);
            if (!m) continue;
            const key = m[1].toLowerCase(), value = m[2].trim();
            if (key === 'z') layer.z = Number(value) || 0;
            else if (key === 'up') layer.up = Number(value) || 0;
            else if (key === 'index') {
                const n = parseInt(value, 10);
                layer.index = n >= 0 && n < 8 ? n : null;
            } else layer[key] = value;
        }
        return layer;
    },

    parseColor(text) {
        const parts = String(text || '').split(',').map(p => p.trim()).filter(Boolean);
        const rule = { part: parts.shift() || '', switchId: 0, variableId: 0, hue: null, tint: null };
        for (const p of parts) {
            const m = /^(switch|variable|hue|tint)\s*[:=]?\s*(.+)$/i.exec(p);
            if (!m) continue;
            const key = m[1].toLowerCase(), value = m[2].trim();
            if (key === 'switch') rule.switchId = Math.max(0, parseInt(value, 10) || 0);
            else if (key === 'variable') rule.variableId = Math.max(0, parseInt(value, 10) || 0);
            else if (key === 'hue') rule.hue = Number(value) || 0;
            else {
                const hex = /^#?([0-9a-f]{6})$/i.exec(value);
                if (hex) rule.tint = parseInt(hex[1], 16);
            }
        }
        return rule;
    },

    // Cached by text: notes are read every frame. Callers must not change the result.
    parseNote(note) {
        const text = String(note || '');
        if (this._notes[text]) return this._notes[text];
        const out = { layers: [], base: [], hides: [], colors: [], alias: '', actorId: 0 };
        if (/<\s*visual/i.test(text)) {
            const re = /<\s*visual(?:\s+(base|hide|alias|colou?r|actor))?\s*:\s*([^>]*)>/gi;
            let m;
            while ((m = re.exec(text))) {
                const kind = (m[1] || '').toLowerCase(), body = m[2].trim();
                if (!kind) out.layers.push(this.parseLayer(body));
                else if (kind === 'base') out.base.push(this.parseLayer(body));
                else if (kind === 'hide') out.hides.push(...body.split(',').map(s => s.trim()).filter(Boolean));
                else if (kind === 'alias') out.alias = body;
                else if (kind === 'actor') out.actorId = Math.max(0, parseInt(body, 10) || 0);
                else out.colors.push(this.parseColor(body));
            }
        }
        if (Object.keys(this._notes).length > 2000) this._notes = {};
        this._notes[text] = out;
        return out;
    },

    // ctx: { actorNote, equipNotes[], extraNotes[], alias?, colors? { part: { hue, tint } } }
    // env: { switch(id), variable(id) }. Returns the layers to draw, back to front.
    resolve(ctx, env) {
        env = env || {};
        const sources = [this.parseNote(ctx.actorNote)]
            .concat((ctx.equipNotes || []).map(n => this.parseNote(n)), (ctx.extraNotes || []).map(n => this.parseNote(n)));
        const alias = ctx.alias ? String(ctx.alias) : sources.map(s => s.alias).filter(Boolean).pop() || '';
        const hides = new Set();
        const rules = [];
        const all = [];
        sources.forEach((s, source) => {
            s.hides.forEach(h => hides.add(h.toLowerCase()));
            rules.push(...s.colors);
            for (const layer of s.base.concat(s.layers)) all.push({ layer, source });
        });
        // Named parts are slots: the last item naming a part replaces earlier ones (a shirt by armor).
        // Pieces from the same item share a slot, and unnamed layers (part = image) never replace.
        const owner = {};
        for (const { layer, source } of all) {
            if (layer.part && layer.part !== layer.image) owner[String(layer.part).toLowerCase()] = source;
        }
        const fill = v => String(v || '').replace(/\{alias\}/gi, alias);
        const switchOn = id => (typeof env.switch === 'function' ? Boolean(env.switch(id)) : false);
        const variable = id => (typeof env.variable === 'function' ? Number(env.variable(id)) || 0 : 0);
        const overrides = ctx.colors || {};
        const out = [];
        for (const { layer, source } of all) {
            const part = String(layer.part || '').toLowerCase();
            if (!layer.image || hides.has(part)) continue;
            if (layer.part !== layer.image && owner[part] !== source) continue;
            let hue = 0, tint = null;
            for (const rule of rules) {
                if (String(rule.part).toLowerCase() !== part) continue;
                if (rule.switchId && !switchOn(rule.switchId)) continue;
                if (rule.variableId) hue = variable(rule.variableId);
                else if (rule.hue !== null) hue = rule.hue;
                if (rule.tint !== null) tint = rule.tint;
            }
            const set = Object.keys(overrides).find(k => k.toLowerCase() === part);
            if (set) {
                if (overrides[set].hue !== undefined && overrides[set].hue !== null) hue = Number(overrides[set].hue) || 0;
                if (overrides[set].tint !== undefined) tint = overrides[set].tint;
            }
            out.push({ image: fill(layer.image), z: layer.z, up: layer.up, part: layer.part, index: layer.index, sv: fill(layer.sv), hue, tint });
        }
        return out.sort((a, b) => a.z - b.z);
    },

    signature(layers) {
        return (layers || []).map(l => [l.image, l.z, l.up, l.index, l.sv, l.hue, l.tint].join(':')).join('|');
    },

    // The draw order for a facing: "up" replaces z while facing up (a cape goes in front of the back).
    zFor(layer, facing) {
        return [7, 8, 9].includes(facing) && layer.up !== null && layer.up !== undefined ? layer.up : layer.z;
    },

    // Tie-break offsets around the body's spriteId, back to front: behind from -0.5, in front from +0.01.
    orderFor(layers, facing) {
        const zs = layers.map(l => this.zFor(l, facing));
        const sorted = layers.map((_, i) => i).sort((a, b) => zs[a] - zs[b] || a - b);
        const out = new Array(layers.length);
        let behind = 0, front = 0;
        for (const i of sorted) out[i] = zs[i] < 0 ? -0.5 + (behind++) * 0.001 : 0.01 + (front++) * 0.001;
        return out;
    },

    // The cell of a layer sheet for frame column `col` and row `row`, laid out like a character sheet
    // ($ single sheets, 8-character sheets, or [fN]/[dN] tagged sheets).
    frameRect(name, width, height, index, col, row) {
        const layout = DocsDoodads.CharacterAnim.parseName(name);
        const single = layout.tagged || /^!?\$/.test(String(name || ''));
        const i = ((Number(index) || 0) % 8 + 8) % 8;
        const block = single ? { x: 0, y: 0, w: width, h: height } : { x: (i % 4) * width / 4, y: Math.floor(i / 4) * height / 2, w: width / 4, h: height / 2 };
        const pw = Math.floor(block.w / layout.frames), ph = Math.floor(block.h / layout.dirs);
        const f = ((Math.floor(col) % layout.frames) + layout.frames) % layout.frames;
        const r = Math.max(0, Math.min(layout.dirs - 1, Math.floor(row) || 0));
        return { x: block.x + f * pw, y: block.y + r * ph, w: pw, h: ph };
    },

    // Side-view battlers: the same cell of the layer's sheet, scaled when the layer is a different size.
    svRect(layerW, layerH, frame, baseW, baseH) {
        const sx = baseW > 0 ? layerW / baseW : 1, sy = baseH > 0 ? layerH / baseH : 1;
        return { x: Math.round(frame.x * sx), y: Math.round(frame.y * sy), w: Math.round(frame.width * sx), h: Math.round(frame.height * sy) };
    },

    savefileLayers(lists) {
        return (lists || []).map(list => (list || []).map(l => ({ image: l.image, z: l.z, index: l.index, hue: l.hue, tint: l.tint })));
    },

    // Hue rotation (like MZ's sprite hue) and a multiply tint on RGBA pixels, for drawing in windows.
    recolor(data, hue, tint) {
        hue = Number(hue) || 0;
        const tr = tint === null || tint === undefined ? 255 : (tint >> 16) & 255;
        const tg = tint === null || tint === undefined ? 255 : (tint >> 8) & 255;
        const tb = tint === null || tint === undefined ? 255 : tint & 255;
        if (!hue && tr === 255 && tg === 255 && tb === 255) return data;
        const shift = (((hue / 360) % 1) + 1) % 1;
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] === 0) continue;
            let r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
            if (shift) {
                const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
                if (d > 0) {
                    let h = max === r ? (((g - b) / d + 6) % 6) / 6 : max === g ? ((b - r) / d + 2) / 6 : ((r - g) / d + 4) / 6;
                    const s = l < 1 ? d / (1 - Math.abs(2 * l - 1)) : 0;
                    h = (h + shift) % 1;
                    const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h * 6) % 2 - 1)), m = l - c / 2;
                    const k = Math.floor(h * 6);
                    [r, g, b] = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][Math.min(5, k)].map(v => v + m);
                }
            }
            data[i] = Math.round(r * tr);
            data[i + 1] = Math.round(g * tg);
            data[i + 2] = Math.round(b * tb);
        }
        return data;
    }
};

// The marker where the player clicks or taps to walk.
// Minimap and world map: one pixel per tile, coloured by what the tile is, and a globe view for
// planet-shaped maps.
DocsDoodads.Minimap = {
    colors: { water: [59, 125, 216], blocked: [122, 127, 136], forest: [47, 107, 51], ground: [106, 168, 79], object: [150, 120, 80] },

    // info: { water, blocked, forest, object, height (tiles) }. Raised ground is lighter.
    tileColor(info) {
        const kind = info.water ? 'water' : info.blocked ? 'blocked' : info.forest ? 'forest' : info.object ? 'object' : 'ground';
        const c = this.colors[kind];
        const k = Math.max(-0.4, Math.min(0.5, (Number(info.height) || 0) * 0.12));
        return k >= 0 ? c.map(v => Math.round(v + (255 - v) * k)) : c.map(v => Math.round(v * (1 + k)));
    },

    pixels(width, height, infoAt) {
        const out = new Uint8ClampedArray(width * height * 4);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const [r, g, b] = this.tileColor(infoAt(x, y));
                const i = (y * width + x) * 4;
                out[i] = r; out[i + 1] = g; out[i + 2] = b; out[i + 3] = 255;
            }
        }
        return out;
    },

    // A globe (size x size) of the map wrapped round a sphere: the map's width is one lap, and it is
    // turned so (cx, cy) (tiles) faces the viewer. Outside the map's rows is dark; the back is hidden.
    globePixels(map, mapW, mapH, size, cx, cy, spin) {
        const out = new Uint8ClampedArray(size * size * 4);
        const r = size / 2 - 1, k = (2 * Math.PI) / mapW;
        const lon0 = cx * k + (spin || 0), lat0 = (cy - mapH / 2) * k;
        const cl = Math.cos(lat0), sl = Math.sin(lat0);
        for (let py = 0; py < size; py++) {
            for (let px = 0; px < size; px++) {
                const u = (px - size / 2 + 0.5) / r, v = (py - size / 2 + 0.5) / r;
                const d = u * u + v * v;
                const i = (py * size + px) * 4;
                if (d > 1) continue;
                const z = Math.sqrt(1 - d);
                // Tilt by the viewer's latitude, then read longitude and latitude.
                const y2 = v * cl + z * sl, z2 = -v * sl + z * cl;
                const lat = Math.asin(Math.max(-1, Math.min(1, y2)));
                const lon = lon0 + Math.atan2(u, z2);
                const tx = ((Math.floor(lon / k) % mapW) + mapW) % mapW, ty = Math.floor(lat / k + mapH / 2);
                const shade = 0.55 + 0.45 * z;
                if (ty < 0 || ty >= mapH) { out[i] = 12 * shade; out[i + 1] = 18 * shade; out[i + 2] = 36 * shade; out[i + 3] = 255; continue; }
                const m = (ty * mapW + tx) * 4;
                out[i] = map[m] * shade; out[i + 1] = map[m + 1] * shade; out[i + 2] = map[m + 2] * shade; out[i + 3] = 255;
            }
        }
        return out;
    }
};

// 3D models (glTF 2.0, .glb or .gltf) as doodads in the 3D view. The reader flattens the default scene
// into triangle lists in model space (+Y up, +Z towards the viewer at camera turn 0), one per primitive,
// with colours converted to sRGB and embedded images kept as bytes.
DocsDoodads.Gltf = {
    parse(buffer, readExternal) {
        const u8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
        const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
        let json, bin = null;
        if (u8.length >= 12 && dv.getUint32(0, true) === 0x46546c67) {
            let pos = 12;
            while (pos + 8 <= u8.length) {
                const len = dv.getUint32(pos, true), type = dv.getUint32(pos + 4, true);
                const chunk = u8.subarray(pos + 8, pos + 8 + len);
                if (type === 0x4e4f534a) json = JSON.parse(new TextDecoder('utf-8').decode(chunk));
                else if (type === 0x004e4942) bin = chunk;
                pos += 8 + len;
            }
        } else {
            json = JSON.parse(new TextDecoder('utf-8').decode(u8));
        }
        if (!json || !json.asset || String(json.asset.version).charAt(0) !== '2') throw new Error('Not a glTF 2.0 model.');
        const buffers = (json.buffers || []).map((b, i) => {
            if (!b.uri) return bin;
            const m = /^data:[^;]*;base64,(.*)$/.exec(b.uri);
            if (m) return Uint8Array.from(atob(m[1]), c => c.charCodeAt(0));
            if (!readExternal) throw new Error('Buffer ' + i + ' is in another file.');
            return new Uint8Array(readExternal(b.uri));
        });
        return { json, buffers };
    },

    viewBytes(doc, viewIndex) {
        const view = doc.json.bufferViews[viewIndex];
        const buf = doc.buffers[view.buffer];
        return buf.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength);
    },

    accessor(doc, index) {
        const a = doc.json.accessors[index];
        const sizes = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
        const types = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };
        const n = sizes[a.type], Type = types[a.componentType];
        const out = new Float64Array(a.count * n);
        if (a.bufferView === undefined) return out;
        const view = doc.json.bufferViews[a.bufferView];
        const bytes = this.viewBytes(doc, a.bufferView);
        const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        const size = Type.BYTES_PER_ELEMENT, stride = view.byteStride || n * size;
        const read = { 5120: 'getInt8', 5121: 'getUint8', 5122: 'getInt16', 5123: 'getUint16', 5125: 'getUint32', 5126: 'getFloat32' }[a.componentType];
        for (let i = 0; i < a.count; i++) {
            for (let k = 0; k < n; k++) {
                let v = dv[read]((a.byteOffset || 0) + i * stride + k * size, true);
                if (a.normalized && a.componentType !== 5126) v = read.indexOf('Uint') === 3 ? v / (Math.pow(2, 8 * size) - 1) : Math.max(-1, v / (Math.pow(2, 8 * size - 1) - 1));
                out[i * n + k] = v;
            }
        }
        return out;
    },

    // 4x4 column-major helpers.
    multiply(a, b) {
        const o = new Array(16).fill(0);
        for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
        return o;
    },

    nodeMatrix(node) {
        if (node.matrix) return node.matrix.slice();
        const [tx, ty, tz] = node.translation || [0, 0, 0];
        const [x, y, z, w] = node.rotation || [0, 0, 0, 1];
        const [sx, sy, sz] = node.scale || [1, 1, 1];
        return [
            (1 - 2 * (y * y + z * z)) * sx, (2 * (x * y + z * w)) * sx, (2 * (x * z - y * w)) * sx, 0,
            (2 * (x * y - z * w)) * sy, (1 - 2 * (x * x + z * z)) * sy, (2 * (y * z + x * w)) * sy, 0,
            (2 * (x * z + y * w)) * sz, (2 * (y * z - x * w)) * sz, (1 - 2 * (x * x + y * y)) * sz, 0,
            tx, ty, tz, 1
        ];
    },

    toSrgb(c) {
        return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    },

    // { primitives: [{ positions, normals, uvs (Float32Array), indices (Uint32Array), color [r,g,b,a],
    //   image: { bytes, mime } | null, nearest }], min: [x,y,z], max: [x,y,z] }
    meshes(doc) {
        const j = doc.json;
        const scene = j.scenes ? j.scenes[j.scene || 0] : { nodes: (j.nodes || []).map((n, i) => i) };
        const prims = [];
        const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
        const visit = (index, parent) => {
            const node = j.nodes[index];
            const m = this.multiply(parent, this.nodeMatrix(node));
            if (node.mesh !== undefined) {
                for (const p of j.meshes[node.mesh].primitives) {
                    if (p.mode !== undefined && p.mode !== 4) continue;
                    if (p.attributes.POSITION === undefined) continue;
                    const pos = this.accessor(doc, p.attributes.POSITION);
                    const nor = p.attributes.NORMAL !== undefined ? this.accessor(doc, p.attributes.NORMAL) : null;
                    const uv = p.attributes.TEXCOORD_0 !== undefined ? this.accessor(doc, p.attributes.TEXCOORD_0) : null;
                    const count = pos.length / 3;
                    const positions = new Float32Array(count * 3), normals = new Float32Array(count * 3), uvs = new Float32Array(count * 2);
                    for (let v = 0; v < count; v++) {
                        const x = pos[v * 3], y = pos[v * 3 + 1], z = pos[v * 3 + 2];
                        for (let k = 0; k < 3; k++) {
                            const w = m[k] * x + m[4 + k] * y + m[8 + k] * z + m[12 + k];
                            positions[v * 3 + k] = w;
                            if (w < min[k]) min[k] = w;
                            if (w > max[k]) max[k] = w;
                        }
                        if (nor) {
                            const nx = nor[v * 3], ny = nor[v * 3 + 1], nz = nor[v * 3 + 2];
                            const a = m[0] * nx + m[4] * ny + m[8] * nz, b = m[1] * nx + m[5] * ny + m[9] * nz, c = m[2] * nx + m[6] * ny + m[10] * nz;
                            const len = Math.hypot(a, b, c) || 1;
                            normals[v * 3] = a / len; normals[v * 3 + 1] = b / len; normals[v * 3 + 2] = c / len;
                        } else normals[v * 3 + 1] = 1;
                        if (uv) { uvs[v * 2] = uv[v * 2]; uvs[v * 2 + 1] = uv[v * 2 + 1]; }
                    }
                    const indices = p.indices !== undefined ? Uint32Array.from(this.accessor(doc, p.indices)) : Uint32Array.from({ length: count }, (_, i) => i);
                    const mat = p.material !== undefined ? j.materials[p.material] : {};
                    const pbr = mat.pbrMetallicRoughness || {};
                    const f = pbr.baseColorFactor || [1, 1, 1, 1];
                    let image = null, nearest = false;
                    if (pbr.baseColorTexture && j.textures) {
                        const tex = j.textures[pbr.baseColorTexture.index];
                        const img = tex && j.images[tex.source];
                        if (img && img.bufferView !== undefined) image = { bytes: this.viewBytes(doc, img.bufferView), mime: img.mimeType || 'image/png' };
                        else if (img && img.uri) image = { uri: img.uri, mime: img.mimeType || '' };
                        const sampler = tex && tex.sampler !== undefined && j.samplers ? j.samplers[tex.sampler] : null;
                        nearest = Boolean(sampler && sampler.magFilter === 9728);
                    }
                    prims.push({ positions, normals, uvs, indices, color: [this.toSrgb(f[0]), this.toSrgb(f[1]), this.toSrgb(f[2]), f[3]], image, nearest,
                        doubleSided: mat.doubleSided === true });
                }
            }
            for (const child of node.children || []) visit(child, m);
        };
        const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
        for (const root of scene.nodes || []) visit(root, identity);
        return { primitives: prims, min, max };
    },

    // A model point (x, y up, z towards the viewer) placed on the map: turned by yaw degrees and scaled
    // to pixels. Returns flat map offsets (dx east, dy south) and the height.
    place(x, y, z, scale, yaw) {
        const r = (yaw || 0) * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
        return { dx: (x * c - z * s) * scale, dy: (x * s + z * c) * scale, h: y * scale };
    },

    // Light on a surface facing (model normal) under a light from `dir` (map x, y, up): 0.45-1.
    shade(nx, ny, nz, yaw, dir) {
        const r = (yaw || 0) * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
        const mx = nx * c - nz * s, my = nx * s + nz * c, up = ny;
        return 0.45 + 0.55 * Math.max(0, mx * dir[0] + my * dir[1] + up * dir[2]);
    }
};

// Searching the map panel's settings: a section matches when it mentions every word searched for
// (any case, any order, the start of words or anywhere inside them).
DocsDoodads.SettingsSearch = {
    matches(text, query) {
        const words = String(query || '').toLowerCase().split(/\s+/).filter(Boolean);
        if (!words.length) return true;
        const hay = String(text || '').toLowerCase().replace(/\s+/g, ' ');
        return words.every(w => hay.includes(w));
    }
};

// Visual equipment sheets from Aseprite: one character sheet per layer (body, hair, clothes...) in MZ's
// layout, from a layered .aseprite file whose frames are the walk cycle. Frames come from tags named
// down, left, right and up (in any order), or else the first frames in that order. inflate / deflate are
// zlib's (passed in, so the parts stay testable outside NW.js).
DocsDoodads.AsepriteSheets = {
    directions: ['down', 'left', 'right', 'up'],

    parse(buffer, inflate) {
        const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
        const u8 = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
        let pos = 0;
        const byte = () => u8[pos++];
        const word = () => { const v = view.getUint16(pos, true); pos += 2; return v; };
        const short = () => { const v = view.getInt16(pos, true); pos += 2; return v; };
        const dword = () => { const v = view.getUint32(pos, true); pos += 4; return v; };
        const string = () => { const n = word(); const t = new TextDecoder('utf-8').decode(u8.subarray(pos, pos + n)); pos += n; return t; };
        dword();
        if (word() !== 0xa5e0) throw new Error('Not an Aseprite file.');
        const frameCount = word(), width = word(), height = word(), depth = word();
        dword(); word(); dword(); dword();
        const transparentIndex = byte();
        pos = 128;
        if (![32, 16, 8].includes(depth)) throw new Error('Unsupported colour depth: ' + depth);
        const out = { width, height, depth, transparentIndex, layers: [], frames: [], tags: [], palette: [] };
        for (let f = 0; f < frameCount; f++) {
            const frameStart = pos;
            const frameBytes = dword();
            if (word() !== 0xf1fa) throw new Error('Bad frame ' + f + '.');
            const oldChunks = word(), duration = word();
            pos += 2;
            const newChunks = dword();
            const chunks = newChunks || oldChunks;
            const frame = { duration, cels: [] };
            for (let c = 0; c < chunks; c++) {
                const chunkStart = pos;
                const size = dword(), type = word();
                if (type === 0x2004) {
                    const flags = word(), layerType = word(), level = word();
                    word(); word();
                    const blend = word(), opacity = byte();
                    pos += 3;
                    out.layers.push({ name: string(), visible: (flags & 1) === 1, type: layerType, level, blend, opacity });
                } else if (type === 0x2005) {
                    const layer = word(), x = short(), y = short(), opacity = byte(), celType = word();
                    pos += 7;
                    if (celType === 1) frame.cels.push({ layer, x, y, opacity, link: word() });
                    else if (celType === 0 || celType === 2) {
                        const w = word(), h = word();
                        const bpp = depth / 8;
                        const raw = celType === 0 ? u8.slice(pos, pos + w * h * bpp) : new Uint8Array(inflate(u8.subarray(pos, chunkStart + size)));
                        frame.cels.push({ layer, x, y, opacity, w, h, pixels: raw });
                    }
                } else if (type === 0x2018) {
                    const n = word();
                    pos += 8;
                    for (let t = 0; t < n; t++) {
                        const from = word(), to = word();
                        pos += 1 + 2 + 6 + 3 + 1;
                        out.tags.push({ from, to, name: string() });
                    }
                } else if (type === 0x2019) {
                    dword();
                    const first = dword(), last = dword();
                    pos += 8;
                    for (let i = first; i <= last; i++) {
                        const flags = word();
                        out.palette[i] = [byte(), byte(), byte(), byte()];
                        if (flags & 1) string();
                    }
                } else if (type === 0x0004 && !out.palette.length) {
                    const packets = word();
                    let index = 0;
                    for (let k = 0; k < packets; k++) {
                        index += byte();
                        let count = byte() || 256;
                        while (count--) out.palette[index++] = [byte(), byte(), byte(), 255];
                    }
                }
                pos = chunkStart + size;
            }
            out.frames.push(frame);
            pos = frameStart + frameBytes;
        }
        return out;
    },

    // One layer's picture in one frame, as RGBA (width x height).
    layerFrame(ase, layerIndex, frameIndex) {
        const { width, height, depth } = ase;
        const rgba = new Uint8ClampedArray(width * height * 4);
        let cel = ase.frames[frameIndex] && ase.frames[frameIndex].cels.find(c => c.layer === layerIndex);
        if (cel && cel.link !== undefined) {
            const linked = ase.frames[cel.link] && ase.frames[cel.link].cels.find(c => c.layer === layerIndex);
            cel = linked ? Object.assign({}, linked, { opacity: cel.opacity }) : null;
        }
        if (!cel || !cel.pixels) return rgba;
        const layer = ase.layers[layerIndex] || { opacity: 255 };
        const alphaScale = (cel.opacity / 255) * ((layer.opacity === undefined ? 255 : layer.opacity) / 255);
        for (let y = 0; y < cel.h; y++) {
            for (let x = 0; x < cel.w; x++) {
                const tx = cel.x + x, ty = cel.y + y;
                if (tx < 0 || ty < 0 || tx >= width || ty >= height) continue;
                const i = y * cel.w + x;
                let r, g, b, a;
                if (depth === 32) { r = cel.pixels[i * 4]; g = cel.pixels[i * 4 + 1]; b = cel.pixels[i * 4 + 2]; a = cel.pixels[i * 4 + 3]; }
                else if (depth === 16) { r = g = b = cel.pixels[i * 2]; a = cel.pixels[i * 2 + 1]; }
                else {
                    const index = cel.pixels[i];
                    const c = ase.palette[index] || [0, 0, 0, 0];
                    [r, g, b, a] = index === ase.transparentIndex ? [0, 0, 0, 0] : c;
                }
                const o = (ty * width + tx) * 4;
                rgba[o] = r; rgba[o + 1] = g; rgba[o + 2] = b; rgba[o + 3] = Math.round(a * alphaScale);
            }
        }
        return rgba;
    },

    // Which frames make each row (down, left, right, up) and how many frames a row has.
    plan(ase) {
        const named = {};
        for (const t of ase.tags) {
            const key = String(t.name || '').trim().toLowerCase();
            if (this.directions.includes(key) && !named[key]) named[key] = t;
        }
        if (this.directions.every(d => named[d])) {
            const rows = this.directions.map(d => { const t = named[d]; const r = []; for (let f = t.from; f <= t.to; f++) r.push(f); return r; });
            const perRow = Math.min(...rows.map(r => r.length));
            return { rows: rows.map(r => r.slice(0, perRow)), perRow };
        }
        const perRow = Math.max(1, Math.floor(ase.frames.length / 4));
        if (ase.frames.length < 4) throw new Error('Needs at least 4 frames, or tags named down, left, right and up.');
        return { rows: this.directions.map((d, i) => Array.from({ length: perRow }, (_, k) => i * perRow + k)), perRow };
    },

    // A sheet per visible image layer: { name, fileName, width, height, rgba }. Single-character sheets
    // ('$' prefix); rows of more or fewer than 3 frames say so in the name ([f4]).
    sheets(ase, baseName) {
        const plan = this.plan(ase);
        const fw = ase.width, fh = ase.height;
        const width = fw * plan.perRow, height = fh * 4;
        const safe = n => String(n).replace(/[\\/:*?"<>|\[\]$!]/g, '').replace(/\s+/g, '_') || 'Layer';
        const out = [];
        ase.layers.forEach((layer, index) => {
            if (layer.type !== 0 || !layer.visible) return;
            const rgba = new Uint8ClampedArray(width * height * 4);
            plan.rows.forEach((frames, row) => frames.forEach((frame, col) => {
                const picture = this.layerFrame(ase, index, frame);
                for (let y = 0; y < fh; y++) {
                    const from = y * fw * 4;
                    rgba.set(picture.subarray(from, from + fw * 4), ((row * fh + y) * width + col * fw) * 4);
                }
            }));
            if (!rgba.some((v, i) => i % 4 === 3 && v > 0)) return;
            const tag = plan.perRow === 3 ? '' : `[f${plan.perRow}]`;
            out.push({ name: layer.name, fileName: `$${safe(baseName)}_${safe(layer.name)}${tag}.png`, width, height, rgba });
        });
        return out;
    },

    crc32(bytes) {
        if (!this._crc) {
            this._crc = new Uint32Array(256);
            for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; this._crc[n] = c >>> 0; }
        }
        let c = 0xffffffff;
        for (let i = 0; i < bytes.length; i++) c = this._crc[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
        return (c ^ 0xffffffff) >>> 0;
    },

    // A PNG file (RGBA, 8 bits) for an image.
    encodePng(width, height, rgba, deflate) {
        const raw = new Uint8Array((width * 4 + 1) * height);
        for (let y = 0; y < height; y++) raw.set(rgba.subarray(y * width * 4, (y + 1) * width * 4), y * (width * 4 + 1) + 1);
        const chunk = (type, data) => {
            const out = new Uint8Array(12 + data.length);
            const dv = new DataView(out.buffer);
            dv.setUint32(0, data.length);
            for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
            out.set(data, 8);
            dv.setUint32(8 + data.length, this.crc32(out.subarray(4, 8 + data.length)));
            return out;
        };
        const ihdr = new Uint8Array(13);
        const dv = new DataView(ihdr.buffer);
        dv.setUint32(0, width); dv.setUint32(4, height);
        ihdr[8] = 8; ihdr[9] = 6;
        const parts = [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', new Uint8Array(deflate(raw))), chunk('IEND', new Uint8Array(0))];
        const total = parts.reduce((n, p) => n + p.length, 0);
        const png = new Uint8Array(total);
        let at = 0;
        for (const part of parts) { png.set(part, at); at += part.length; }
        return png;
    }
};

DocsDoodads.Destination = {
    styles: [
        { value: 'default', label: 'MZ square' },
        { value: 'square', label: 'Rounded square' },
        { value: 'circle', label: 'Circle' },
        { value: 'ring', label: 'Ring' },
        { value: 'diamond', label: 'Diamond' },
        { value: 'cross', label: 'Cross' },
        { value: 'arrow', label: 'Arrow' },
        { value: 'image', label: 'Image (img/system)' },
        { value: 'animation', label: 'Database animation' },
        { value: 'vfx', label: 'VFX effect' },
        { value: 'none', label: 'Hidden' }
    ],
    pulses: [
        { value: 'mz', label: 'MZ pulse' },
        { value: 'breathe', label: 'Breathe' },
        { value: 'ripple', label: 'Ripple' },
        { value: 'none', label: 'Still' }
    ],
    blends: [
        { value: 'add', label: 'Add (glow)' },
        { value: 'normal', label: 'Normal' },
        { value: 'multiply', label: 'Multiply' },
        { value: 'screen', label: 'Screen' }
    ],
    layers: [
        { value: 'above', label: 'Above characters (MZ)' },
        { value: 'ground', label: 'On the ground' }
    ],
    defaults: {
        style: 'default', color: '#ffffff', opacity: 120, blend: 'add', scale: 1, pulse: 'mz', spin: 0, bob: 0,
        layer: 'above', image: '', fps: 8, animationId: 0, vfx: '', pathDots: false, dotColor: '#ffffff', dotSpacing: 1
    },

    normalize(s) {
        s = s || {};
        const d = this.defaults;
        const pick = (list, v, fallback) => (list.some(o => o.value === v) ? v : fallback);
        const num = (v, fallback, min, max) => {
            const n = Number(v);
            return Number.isFinite(n) && v !== '' && v !== null ? Math.max(min, Math.min(max, n)) : fallback;
        };
        const color = (v, fallback) => (/^#[0-9a-f]{6}$/i.test(String(v || '')) ? String(v) : fallback);
        return {
            style: pick(this.styles, s.style, d.style),
            color: color(s.color, d.color),
            opacity: num(s.opacity, d.opacity, 0, 255),
            blend: pick(this.blends, s.blend, d.blend),
            scale: num(s.scale, d.scale, 0.1, 4),
            pulse: pick(this.pulses, s.pulse, d.pulse),
            spin: num(s.spin, d.spin, -720, 720),
            bob: num(s.bob, d.bob, 0, 48),
            layer: pick(this.layers, s.layer, d.layer),
            image: String(s.image || ''),
            fps: num(s.fps, d.fps, 1, 60) || 1,
            animationId: Math.max(0, Math.floor(Number(s.animationId) || 0)),
            vfx: String(s.vfx || ''),
            pathDots: s.pathDots === true,
            dotColor: color(s.dotColor, d.dotColor),
            dotSpacing: Math.max(1, Math.floor(num(s.dotSpacing, d.dotSpacing, 1, 8)))
        };
    },

    // The project's marker with mid-game changes from the plugin command on top.
    merge(project, override) {
        const out = Object.assign({}, project || {});
        for (const key of Object.keys(override || {})) {
            if (override[key] !== undefined && override[key] !== null) out[key] = override[key];
        }
        return this.normalize(out);
    },

    blendMode(blend) {
        return { normal: 0, add: 1, multiply: 2, screen: 3 }[blend] !== undefined ? { normal: 0, add: 1, multiply: 2, screen: 3 }[blend] : 1;
    },

    // Scale and opacity multipliers `frame` frames after the marker appeared.
    pulse(kind, frame) {
        frame = Math.max(0, Math.floor(frame) || 0);
        if (kind === 'mz') {
            const f = frame % 20;
            return { scale: 1 + f / 20, alpha: (20 - f) / 20 };
        }
        if (kind === 'breathe') {
            const w = Math.sin(frame / 60 * Math.PI * 2);
            return { scale: 1 + 0.08 * w, alpha: 0.8 + 0.2 * w };
        }
        if (kind === 'ripple') {
            const f = (frame % 60) / 60;
            return { scale: 0.6 + 0.9 * f, alpha: 1 - f };
        }
        return { scale: 1, alpha: 1 };
    },

    rotation(degreesPerSecond, frame) {
        return (Number(degreesPerSecond) || 0) * Math.PI / 180 * (Math.max(0, frame) / 60);
    },

    // Pixels up and down (negative is up), one bob a second.
    bob(height, frame) {
        if (!height) return 0;
        return -height * (0.5 - 0.5 * Math.cos(frame / 60 * Math.PI * 2));
    },

    // One row of frames: Marker[f4] is four frames side by side.
    imageFrame(name, width, height, frame, fps) {
        const layout = DocsDoodads.CharacterAnim.parseName(name);
        if (!layout.tagged) return { x: 0, y: 0, w: width, h: height };
        const w = Math.floor(width / layout.frames);
        const i = DocsDoodads.CharacterAnim.cycleFrame(frame, fps, layout.frames);
        return { x: i * w, y: 0, w, h: height };
    },

    // Breadth-first search like MZ's route search. canEnter(x, y, fromX, fromY, dir) says whether a step
    // is allowed; opts.wrap(x, y) handles looping maps; opts.distance(ax, ay, bx, by) measures closeness.
    // When the goal can't be reached, the path ends at the reachable tile closest to it (as MZ walks).
    path(start, goal, canEnter, limit, opts) {
        opts = opts || {};
        const wrap = opts.wrap || ((x, y) => ({ x, y }));
        const distance = opts.distance || ((ax, ay, bx, by) => Math.abs(ax - bx) + Math.abs(ay - by));
        const key = (x, y) => x + ',' + y;
        if (start.x === goal.x && start.y === goal.y) return [];
        const from = new Map([[key(start.x, start.y), null]]);
        const cost = new Map([[key(start.x, start.y), 0]]);
        const queue = [{ x: start.x, y: start.y }];
        let best = { x: start.x, y: start.y, h: distance(start.x, start.y, goal.x, goal.y) };
        let found = null;
        const steps = [[0, 1, 2], [-1, 0, 4], [1, 0, 6], [0, -1, 8]];
        while (queue.length && !found) {
            const cur = queue.shift();
            const g = cost.get(key(cur.x, cur.y));
            if (g >= (limit || 12)) continue;
            for (const [dx, dy, dir] of steps) {
                const n = wrap(cur.x + dx, cur.y + dy);
                const k = key(n.x, n.y);
                if (from.has(k) || !canEnter(n.x, n.y, cur.x, cur.y, dir)) continue;
                from.set(k, cur);
                cost.set(k, g + 1);
                if (n.x === goal.x && n.y === goal.y) {
                    found = n;
                    break;
                }
                const h = distance(n.x, n.y, goal.x, goal.y);
                if (h < best.h) best = { x: n.x, y: n.y, h };
                queue.push(n);
            }
        }
        const end = found || best;
        if (end.x === start.x && end.y === start.y) return [];
        const out = [];
        for (let p = { x: end.x, y: end.y }; p && !(p.x === start.x && p.y === start.y); p = from.get(key(p.x, p.y))) out.unshift({ x: p.x, y: p.y });
        return out;
    },

    // Dots along a path, every `spacing` tiles, leaving the last tile for the marker.
    dots(path, spacing) {
        spacing = Math.max(1, Math.floor(spacing) || 1);
        return (path || []).slice(0, -1).filter((_, i) => (i + 1) % spacing === 0);
    },

    zFor(layer) {
        return layer === 'ground' ? 0.6 : 9;
    }
};

