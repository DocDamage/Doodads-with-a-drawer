//==========================================================
// SECTION 12D: LPC COMPOSITOR (LAYERS, Z-ORDER, BODY TYPES, PALETTES, CACHE)
//==========================================================
// Stacks the LPC parts of one character into a sheet, written from the library's data format (no code of
// the generator is used). A recipe is { body: 'male', picks: [{ id, colours: ['olive', 'blue'], variant }] }:
// a part id from the index (23_lpc_index.js), the palette names for its colour channels, and, for parts sold
// in fixed colours, the variant.
//
//   resolve(index, recipe, animation, exists) -> which image files to stack, in order, and why any are missing
//   compose(resolved, index, loadImage, cache) -> the stacked sheet ({ width, height, data: RGBA bytes })
//
// Images are plain { width, height, data } so the editor (canvas ImageData) and the tests share the code;
// exists(file) and loadImage(file) are given paths relative to the library's spritesheets folder.
DocsDoodads.LpcCompose = {
    frame: 64,
    // The library's own folders face up, left, down, right (rows top to bottom).
    directions: ['up', 'left', 'down', 'right'],
    // Each animation's file name and frames per row; rows are 4 directions unless one.
    animations: {
        walk: { file: 'walk', frames: 9 }, idle: { file: 'idle', frames: 2 }, run: { file: 'run', frames: 8 },
        spellcast: { file: 'spellcast', frames: 7 }, thrust: { file: 'thrust', frames: 8 }, slash: { file: 'slash', frames: 6 },
        shoot: { file: 'shoot', frames: 13 }, hurt: { file: 'hurt', frames: 6, rows: 1 }, climb: { file: 'climb', frames: 6, rows: 1 },
        jump: { file: 'jump', frames: 5 }, sit: { file: 'sit', frames: 3 }, emote: { file: 'emote', frames: 3 },
        combat: { file: 'combat_idle', frames: 2 }, '1h_slash': { file: 'slash', frames: 6 },
        '1h_backslash': { file: 'backslash', frames: 13 }, '1h_halfslash': { file: 'halfslash', frames: 6 }
    },

    fileOf(animation) {
        const a = this.animations[animation];
        return a ? a.file : String(animation);
    },

    // ---- Which images, in which order ----

    // The value a ${name} in a path stands for: the picked part of that type, by its name ('Human Male' ->
    // 'Human_Male'), through the part's replace_in_path table.
    templateValue(part, name, picked) {
        const table = part.replaceInPath && part.replaceInPath[name];
        if (!table) return null;
        const source = picked.find(p => p.part.type === name);
        if (!source) return null;
        const key = source.part.name.replace(/\s+/g, '_');
        return table[key] !== undefined ? String(table[key]) : null;
    },

    resolve(index, recipe, animation, exists) {
        const byId = new Map((index && index.parts || []).map(p => [p.id, p]));
        const body = recipe && recipe.body || 'male';
        const warnings = [];
        const picked = [];
        for (const [order, pick] of (recipe && recipe.picks || []).entries()) {
            const part = byId.get(pick.id);
            if (!part) { warnings.push(`There is no part "${pick.id}" in the library any more.`); continue; }
            picked.push({ part, pick, order });
        }
        const tags = new Set(picked.flatMap(p => p.part.tags || []));
        const layers = [];
        const used = [];
        for (const { part, pick, order } of picked) {
            if ((part.requiredTags || []).length && !part.requiredTags.some(t => tags.has(t))) {
                warnings.push(`${part.name} goes with ${part.requiredTags.join(' or ')}, which nothing picked has.`);
                continue;
            }
            if (part.animations && part.animations.length && !part.animations.includes(animation)) {
                warnings.push(`${part.name} has no ${animation}.`);
                continue;
            }
            const folders = part.layers.filter(l => l.paths[body] && (!l.custom || l.custom === animation));
            if (!folders.length) {
                if (part.layers.some(l => !l.custom)) warnings.push(`${part.name} has nothing for the ${body} body.`);
                continue;
            }
            // Some layers of a part (a blade behind the body) exist for fewer animations: say so only when
            // none of them has a picture.
            let found = 0, missing = false;
            for (const layer of folders) {
                let folder = layer.paths[body];
                let unresolved = '';
                folder = folder.replace(/\$\{(\w+)\}/g, (m, name) => {
                    const v = this.templateValue(part, name, picked);
                    if (v === null) unresolved = name;
                    return v === null ? m : v;
                });
                if (unresolved) { warnings.push(`${part.name} needs a ${unresolved} it knows.`); continue; }
                const base = folder.replace(/\/*$/, '/');
                const name = layer.custom ? '' : this.fileOf(animation);
                // Without a variant (an old recipe), a part sold in fixed colours shows its first.
                const variant = pick.variant || (part.variants && part.variants[0]) || '';
                const candidates = layer.custom
                    ? [variant ? base + variant + '.png' : null]
                    : [base + name + '.png', variant ? base + name + '/' + variant + '.png' : null];
                const file = candidates.find(f => f && exists(f));
                if (!file) { missing = true; continue; }
                found++;
                layers.push({ z: layer.z, priority: part.priority || 0, order, file, part, pick });
                used.push({ part, folder: base });
            }
            if (missing && !found) warnings.push(`${part.name} has no ${animation} picture for the ${body} body.`);
        }
        layers.sort((a, b) => a.z - b.z || a.priority - b.priority || a.order - b.order);
        return { body, animation, layers, used, warnings };
    },

    // ---- Colours ----

    hex(c) {
        const v = parseInt(String(c).replace('#', ''), 16);
        return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
    },

    // The colour channels of a part: [{ material, source?, base? }] in order (color_1, color_2...).
    channels(part) {
        const r = part && part.recolors;
        if (!r) return [];
        if (r.material) return [r];
        return Object.keys(r).filter(k => /^color_\d+$/.test(k)).sort((a, b) => Number(a.slice(6)) - Number(b.slice(6))).map(k => r[k]);
    },

    // One map per channel: source colour (as a number) -> target [r, g, b]. The art is drawn in the
    // material's base ramp, or the channel's own source ramp.
    recolourMaps(palettes, part, colours, skin) {
        const maps = [];
        this.channels(part).forEach((ch, i) => {
            const target = i === 0 && part.matchBodyColor && skin ? skin : (colours || [])[i];
            const material = ch && palettes && palettes[ch.material];
            if (!material || !target) return;
            const ramps = material.versions[material.version] || {};
            const source = Array.isArray(ch.source) ? ch.source : ramps[ch.base || material.base];
            const goal = ramps[target];
            if (!source || !goal || source === goal) return;
            const map = new Map();
            source.forEach((c, j) => { if (goal[j]) { const [r, g, b] = this.hex(c); map.set((r << 16) | (g << 8) | b, this.hex(goal[j])); } });
            maps.push(map);
        });
        return maps;
    },

    // A short key for the colours a layer is drawn in (for the cache).
    colourKey(part, colours, skin) {
        const n = this.channels(part).length;
        if (!n) return '';
        return Array.from({ length: n }, (_, i) => (i === 0 && part.matchBodyColor && skin ? skin : (colours || [])[i]) || '').join(',');
    },

    recolour(image, maps) {
        if (!maps.length) return image;
        const d = image.data;
        for (let i = 0; i < d.length; i += 4) {
            if (!d[i + 3]) continue;
            const key = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2];
            for (const map of maps) {
                const to = map.get(key);
                if (to) { d[i] = to[0]; d[i + 1] = to[1]; d[i + 2] = to[2]; break; }
            }
        }
        return image;
    },

    // ---- Stacking ----

    blank(width, height) {
        return { width, height, data: new Uint8ClampedArray(width * height * 4) };
    },

    copy(image) {
        return { width: image.width, height: image.height, data: new Uint8ClampedArray(image.data) };
    },

    // src drawn over dst (same size), with alpha.
    over(dst, src) {
        const a = dst.data, b = src.data;
        for (let i = 0; i < a.length; i += 4) {
            const sa = b[i + 3];
            if (!sa) continue;
            if (sa === 255 || !a[i + 3]) { a[i] = b[i]; a[i + 1] = b[i + 1]; a[i + 2] = b[i + 2]; a[i + 3] = sa; continue; }
            const s = sa / 255, d = a[i + 3] / 255, o = s + d * (1 - s);
            for (let c = 0; c < 3; c++) a[i + c] = Math.round((b[i + c] * s + a[i + c] * d * (1 - s)) / o);
            a[i + 3] = Math.round(o * 255);
        }
        return dst;
    },

    // A cache of recoloured layers: (file, colours) -> image, the oldest dropped past max.
    newCache(max = 120) {
        return { max, map: new Map(), hits: 0, misses: 0 };
    },

    cached(cache, key, make) {
        if (!cache) return make();
        if (cache.map.has(key)) {
            const v = cache.map.get(key);
            cache.map.delete(key);
            cache.map.set(key, v);
            cache.hits++;
            return v;
        }
        cache.misses++;
        const v = make();
        if (v) {
            cache.map.set(key, v);
            while (cache.map.size > cache.max) cache.map.delete(cache.map.keys().next().value);
        }
        return v;
    },

    // The skin palette of the body pick, for parts that match the body's colour.
    skinOf(resolved) {
        const bodyLayer = resolved.layers.find(l => l.part.type === 'body' && l.part.matchBodyColor);
        return bodyLayer && bodyLayer.pick.colours ? bodyLayer.pick.colours[0] : '';
    },

    // loadImage(file) -> image or null. Layers whose size differs from the first (oversize weapons) are left
    // out with a warning, for now.
    compose(resolved, index, loadImage, cache) {
        const skin = this.skinOf(resolved);
        const warnings = resolved.warnings.slice();
        let sheet = null;
        for (const layer of resolved.layers) {
            const key = layer.file + '|' + this.colourKey(layer.part, layer.pick.colours, skin);
            const image = this.cached(cache, key, () => {
                const raw = loadImage(layer.file);
                return raw ? this.recolour(this.copy(raw), this.recolourMaps(index.palettes, layer.part, layer.pick.colours, skin)) : null;
            });
            if (!image) { warnings.push(`Could not read ${layer.file}.`); continue; }
            if (!sheet) sheet = this.blank(image.width, image.height);
            if (image.width !== sheet.width || image.height !== sheet.height) {
                warnings.push(`${layer.part.name} is drawn at another size (${image.width}x${image.height}); left out for now.`);
                continue;
            }
            this.over(sheet, image);
        }
        return { sheet, warnings };
    },

    // ---- Reading the library's PNGs ----

    // PNG bytes (a Buffer) -> { width, height, data: RGBA }. inflate is zlib.inflateSync. Handles what the
    // library uses: palette images at 1, 2, 4 or 8 bits with transparency, grey, RGB and RGBA (8 or 16 bits).
    // Interlaced images are refused (null).
    decodePng(buffer, inflate) {
        const sig = [137, 80, 78, 71, 13, 10, 26, 10];
        if (!buffer || buffer.length < 33 || sig.some((b, i) => buffer[i] !== b)) return null;
        const u32 = o => ((buffer[o] << 24) >>> 0) + (buffer[o + 1] << 16) + (buffer[o + 2] << 8) + buffer[o + 3];
        let pos = 8, header = null, palette = null, alpha = null;
        const idat = [];
        while (pos + 8 <= buffer.length) {
            const length = u32(pos), type = String.fromCharCode(buffer[pos + 4], buffer[pos + 5], buffer[pos + 6], buffer[pos + 7]);
            const body = buffer.subarray(pos + 8, pos + 8 + length);
            pos += 12 + length;
            if (type === 'IHDR') header = { width: (body[0] << 24 >>> 0) + (body[1] << 16) + (body[2] << 8) + body[3], height: (body[4] << 24 >>> 0) + (body[5] << 16) + (body[6] << 8) + body[7], depth: body[8], colorType: body[9], interlace: body[12] };
            else if (type === 'PLTE') palette = body;
            else if (type === 'tRNS') alpha = body;
            else if (type === 'IDAT') idat.push(body);
            else if (type === 'IEND') break;
        }
        if (!header || header.interlace) return null;
        const { width, height, depth, colorType } = header;
        const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType];
        if (!channels || (colorType === 3 && !palette)) return null;
        const total = idat.reduce((n, b) => n + b.length, 0);
        const joined = new Uint8Array(total);
        let at = 0;
        for (const b of idat) { joined.set(b, at); at += b.length; }
        const raw = inflate(joined);
        const bits = channels * depth, stride = Math.ceil(width * bits / 8), bpp = Math.max(1, bits >> 3);
        const rows = new Uint8Array(stride * height);
        for (let y = 0; y < height; y++) {
            const filter = raw[y * (stride + 1)], line = y * (stride + 1) + 1, out = y * stride, prev = out - stride;
            for (let i = 0; i < stride; i++) {
                const a = i >= bpp ? rows[out + i - bpp] : 0, b = y ? rows[prev + i] : 0, c = y && i >= bpp ? rows[prev + i - bpp] : 0;
                let add = 0;
                if (filter === 1) add = a; else if (filter === 2) add = b; else if (filter === 3) add = (a + b) >> 1;
                else if (filter === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); add = pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
                rows[out + i] = (raw[line + i] + add) & 255;
            }
        }
        const data = new Uint8ClampedArray(width * height * 4);
        const sample = (row, index) => {
            if (depth === 8) return rows[row + index];
            if (depth === 16) return rows[row + index * 2];
            const per = 8 / depth, byte = rows[row + Math.floor(index / per)];
            return (byte >> (8 - depth * (index % per + 1))) & ((1 << depth) - 1);
        };
        const grey = depth < 8 && colorType === 0 ? 255 / ((1 << depth) - 1) : 1;
        for (let y = 0; y < height; y++) {
            const row = y * stride;
            for (let x = 0; x < width; x++) {
                const o = (y * width + x) * 4;
                if (colorType === 3) {
                    const i = sample(row, x);
                    data[o] = palette[i * 3]; data[o + 1] = palette[i * 3 + 1]; data[o + 2] = palette[i * 3 + 2];
                    data[o + 3] = alpha && i < alpha.length ? alpha[i] : 255;
                } else if (colorType === 0 || colorType === 4) {
                    data[o] = data[o + 1] = data[o + 2] = Math.round(sample(row, x * channels) * grey);
                    data[o + 3] = colorType === 4 ? sample(row, x * channels + 1) : 255;
                } else {
                    data[o] = sample(row, x * channels); data[o + 1] = sample(row, x * channels + 1); data[o + 2] = sample(row, x * channels + 2);
                    data[o + 3] = colorType === 6 ? sample(row, x * channels + 3) : 255;
                }
            }
        }
        return { width, height, data };
    },

    // One frame (64x64) of a sheet: frame number along the row, direction by name.
    frameRect(animation, direction, frame) {
        const a = this.animations[animation] || { frames: 1 };
        const row = (a.rows === 1) ? 0 : Math.max(0, this.directions.indexOf(direction));
        return { x: (frame % a.frames) * this.frame, y: row * this.frame, w: this.frame, h: this.frame };
    },

    // ---- Random characters (the dice) ----

    // A part's colours: a random ramp of its material for each channel.
    randomColours(index, part, rand) {
        return this.channels(part).map(ch => {
            const m = index.palettes && index.palettes[ch.material];
            const names = m ? Object.keys(m.versions[m.version] || {}) : [];
            return names.length ? names[Math.floor(rand() * names.length)] : '';
        });
    },

    // A plain, complete character: a body, a head that fits it, and (each with a chance) hair, a shirt,
    // trousers and shoes, only from parts that have a walk for that body (and are safe to encrypt when asked).
    randomRecipe(index, options = {}) {
        const rand = options.rand || Math.random;
        const body = options.body || ['male', 'female'][Math.floor(rand() * 2)];
        const fits = p => (!options.safeOnly || p.safeFor[body]) && p.layers.some(l => l.paths[body] && !l.custom) &&
            (!p.animations.length || p.animations.includes('walk')) && !(p.requiredTags || []).length && !/\$\{/.test(JSON.stringify(p.layers));
        const pickOf = (filter) => {
            const list = index.parts.filter(p => fits(p) && filter(p));
            return list.length ? list[Math.floor(rand() * list.length)] : null;
        };
        const picks = [];
        const add = part => { if (part) picks.push({ id: part.id, colours: this.randomColours(index, part, rand), variant: part.variants.length ? part.variants[Math.floor(rand() * part.variants.length)] : undefined }); };
        const bodyPart = index.parts.find(p => p.id === 'body/body') || pickOf(p => p.type === 'body');
        add(bodyPart && fits(bodyPart) ? bodyPart : null);
        if (picks[0]) {
            const skins = ['light', 'amber', 'olive', 'taupe', 'bronze', 'brown', 'black'];
            const names = Object.keys((index.palettes.body && index.palettes.body.versions[index.palettes.body.version]) || {});
            const ok = skins.filter(s => names.includes(s));
            if (ok.length) picks[0].colours[0] = ok[Math.floor(rand() * ok.length)];
        }
        add(pickOf(p => p.type === 'head' && (p.tags || []).includes('human') && /^Human (Male|Female)$/.test(p.name) && p.name.toLowerCase().endsWith(body === 'female' ? 'female' : ' male')) || pickOf(p => p.type === 'head'));
        for (const [type, chance] of [['hair', 0.9], ['clothes', 0.95], ['legs', 0.95], ['shoes', 0.8]]) if (rand() < chance) add(pickOf(p => p.type === type));
        return { body, picks };
    }
};
