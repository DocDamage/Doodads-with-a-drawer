//==========================================================
// SECTION 12L: RPG MAKER MZ GENERATOR COMPOSITOR (VIEWS, ORDER, COLOUR SLOTS)
//==========================================================
// Stacks a character's MZ generator parts for one view: walking (TV), damaged (TVD), the side-view battler (SV)
// or the face. Parts are drawn in the view's order (23_mzgen_index.js). Colours are the character's slots
// (skin, eyes, hair, clothing 1-4...): a slot left as drawn keeps the part's own colours; a slot given a ramp
// recolours its pixels, each to the ramp's colour of the same brightness. Which pixels a slot covers comes from
// the part's mask (walking, damaged, battler: the key colour) or the face file's own slot (_m007).
//
// The stage and the exports read a composed sheet in the LPC compositor's layout (rows up, left, down, right;
// frames along a row; sheet.frame): walk is the TV sheet's three frames, damage the TVD row, face one frame,
// and each battler motion (sv_wait, sv_swing...) its three frames, in every row.
//
//   resolve(index, recipe, animation, exists) -> { view, layers, warnings, used }
//   compose(resolved, index, loadImage, cache) -> { sheet, view, warnings }
DocsDoodads.MzGenCompose = {
    frame: 48,
    directions: ['up', 'left', 'down', 'right'],
    // MZ's own row order on walking sheets.
    mzRows: ['down', 'left', 'right', 'up'],
    svMotions: ['walk', 'wait', 'chant', 'guard', 'damage', 'evade', 'thrust', 'swing', 'missile', 'skill', 'spell', 'item', 'escape', 'victory', 'dying', 'abnormal', 'sleep', 'dead'],

    // An animation key -> what it draws: { view, frames, frame size }.
    animationOf(key) {
        if (key === 'walk') return { view: 'TV', frames: 3, frame: 48 };
        if (key === 'damage') return { view: 'TVD', frames: 3, frame: 48 };
        if (key === 'face') return { view: 'Face', frames: 1, frame: 144 };
        const m = /^sv_(\w+)$/.exec(key || '');
        if (m && this.svMotions.includes(m[1])) return { view: 'SV', frames: 3, frame: 64, motion: this.svMotions.indexOf(m[1]) };
        return null;
    },

    // For the creator (frameRect and the stage): frames per animation.
    get animations() {
        const out = { walk: { frames: 3 }, damage: { frames: 3 }, face: { frames: 1 } };
        for (const m of this.svMotions) out['sv_' + m] = { frames: 3 };
        return out;
    },

    // ---- Which layers ----

    // recipe: { body (the base), picks: [{ id }], colours: { slot: ramp name } }.
    resolve(index, recipe, animation, exists) {
        const M = DocsDoodads.MzGen;
        const anim = this.animationOf(animation);
        const warnings = [];
        if (!anim) return { animation, layers: [], warnings: [`There is no ${animation} animation.`], used: [] };
        const byId = new Map((index && index.parts || []).map(p => [p.id, p]));
        const order = M.order[anim.view];
        const rank = (family, layer) => { const i = order.indexOf(family + (layer || '')); return i >= 0 ? i : order.indexOf(family); };
        const layers = [];
        (recipe && recipe.picks || []).forEach((pick, n) => {
            const part = byId.get(pick.id);
            if (!part) { warnings.push(`There is no part "${pick.id}" any more.`); return; }
            for (const f of part.files[anim.view] || []) {
                const r = rank(part.family, f.layer);
                if (r < 0 || !exists(f.file)) continue;
                layers.push({ file: f.file, mask: f.mask || '', maskSlots: f.slots || null, slot: f.m || '', c: f.c || 0, rank: r, n, part, face: anim.view === 'Face' });
            }
        });
        // Back to front: the view's order; a face part's layers from the highest c (c1 on top).
        layers.sort((a, b) => a.rank - b.rank || b.c - a.c || a.n - b.n);
        return { animation, view: anim.view, layers, warnings, colours: Object.assign({}, recipe && recipe.colours), used: layers.map(l => ({ part: l.part, folder: l.file })) };
    },

    // ---- Colours ----

    luma(r, g, b) {
        return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    },

    // brightness (0-255) -> the ramp's colour of nearest brightness.
    lut(ramp) {
        const lum = ramp.map(c => this.luma(c[0], c[1], c[2]));
        const out = new Array(256);
        for (let v = 0; v < 256; v++) {
            let best = 0, d = 1e9;
            for (let x = 0; x < ramp.length; x++) { const e = Math.abs(lum[x] - v); if (e < d) { d = e; best = x; } }
            out[v] = ramp[best];
        }
        return out;
    },

    // Recolours a copy: each pixel whose slot has a ramp takes that ramp's colour of its own brightness.
    // slotAt(i) -> the slot of the pixel at byte i ('' for fixed); luts: slot -> lut.
    recolour(image, slotAt, luts) {
        const d = image.data;
        for (let i = 0; i < d.length; i += 4) {
            if (!d[i + 3]) continue;
            const lut = luts[slotAt(i)];
            if (!lut) continue;
            const c = lut[this.luma(d[i], d[i + 1], d[i + 2])];
            d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2];
        }
        return image;
    },

    // ---- Stacking ----

    // The view's whole picture (TV 144 x 192, SV 576 x 384...), every layer recoloured and stacked.
    composeView(resolved, index, loadImage, cache) {
        const C = DocsDoodads.LpcCompose, M = DocsDoodads.MzGen;
        const warnings = resolved.warnings.slice();
        const size = M.sizes[resolved.view];
        if (!size) return { image: null, warnings };
        const out = C.blank(size[0], size[1]);
        const colours = resolved.colours || {};
        const luts = {};
        for (const [slot, name] of Object.entries(colours)) { const r = name && M.ramp(index, name); if (r) luts[slot] = C.cached(cache, 'lut|' + name, () => this.lut(r)); }
        let drawn = 0;
        for (const layer of resolved.layers) {
            // The cache key names only the colours this layer can take: a face file its own slot; a walking or
            // battler layer the slots its mask holds (from the index; every coloured slot for an older index).
            // So a new skin colour doesn't redraw clothing with no skin in it.
            const reach = layer.face ? [layer.slot] : layer.maskSlots;
            const slots = Object.keys(luts).filter(s => !reach || reach.includes(s)).sort();
            const used = slots.map(s => s + '=' + colours[s]).join(',');
            const image = C.cached(cache, layer.file + '|' + used, () => {
                const raw = loadImage(layer.file);
                if (!raw) return null;
                // Nothing to recolour: the decoded file as it is (nothing draws into a cached image).
                if (!slots.length) return raw;
                const copy = C.copy(raw);
                if (layer.face) return this.recolour(copy, () => layer.slot, luts);
                const mask = layer.mask ? loadImage(layer.mask) : null;
                if (!mask || mask.width !== raw.width || mask.height !== raw.height) return raw;
                // A near colour the index didn't give this layer (one of another part's slots) stays as drawn.
                const slotAt = i => {
                    if (!mask.data[i + 3]) return '';
                    const s = M.slotOfKey((mask.data[i] << 16) | (mask.data[i + 1] << 8) | mask.data[i + 2]);
                    return !reach || reach.includes(s) ? s : '';
                };
                return this.recolour(copy, slotAt, luts);
            });
            if (!image) { warnings.push(`Could not read ${layer.file}.`); continue; }
            // Face parts may be 160 x 160: centred on the 144 face.
            const ox = Math.round((image.width - out.width) / 2), oy = Math.round((image.height - out.height) / 2);
            const w = Math.min(out.width, image.width), h = Math.min(out.height, image.height);
            C.overRect(out, image, Math.max(0, ox), Math.max(0, oy), Math.max(0, -ox), Math.max(0, -oy), w, h);
            drawn++;
        }
        return { image: drawn ? out : null, warnings };
    },

    // The animation as a sheet in the LPC layout, for the stage and the exports.
    compose(resolved, index, loadImage, cache) {
        const C = DocsDoodads.LpcCompose;
        const anim = this.animationOf(resolved.animation);
        const view = this.composeView(resolved, index, loadImage, cache);
        if (!anim || !view.image) return { sheet: null, view: null, warnings: view.warnings };
        const F = anim.frame, img = view.image;
        const sheet = C.blank(anim.frames * F, 4 * F);
        sheet.frame = F;
        this.directions.forEach((dir, row) => {
            for (let f = 0; f < anim.frames; f++) {
                let sx = 0, sy = 0;
                if (anim.view === 'TV') { sx = f * F; sy = this.mzRows.indexOf(dir) * F; }
                else if (anim.view === 'TVD') sx = f * F;
                else if (anim.view === 'SV') { sx = (Math.floor(anim.motion / 6) * 3 + f) * F; sy = (anim.motion % 6) * F; }
                if (sx + F <= img.width && sy + F <= img.height) C.overRect(sheet, img, sx, sy, f * F, row * F, F, F);
            }
        });
        return { sheet, view: img, warnings: view.warnings };
    },

    frameRect(animation, direction, frame, size = this.frame) {
        const a = this.animationOf(animation) || { frames: 1 };
        const row = Math.max(0, this.directions.indexOf(direction));
        return { x: (frame % a.frames) * size, y: row * size, w: size, h: size };
    }
};
