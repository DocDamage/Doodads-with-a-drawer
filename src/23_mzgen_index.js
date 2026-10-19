//==========================================================
// SECTION 12K: RPG MAKER MZ GENERATOR PARTS (INDEX)
//==========================================================
// The parts of RPG Maker MZ's own Character Generator, read from the generator folder of the MZ installation
// on this computer (RPG Maker MZ/generator). They are licensed for games made with RPG Maker MZ and may not be
// redistributed, so none of them ship with the plugin or go into the project: the index lives in the editor's
// cache, and only the sheets made from them go into the game. None of MZ's editor code is used; the format was
// read from the files (docs/MZ_CHARACTER_CREATOR_PLAN.md).
//
// The folder has, for each base (Male, Female, Kid): TV (walking, 144 x 192), TVD (damaged, 144 x 48), SV (the
// side-view battler, 576 x 384) and Face (144 x 144, some 160 x 160) parts, and grad_*.png, the colour ramps.
//   TV_Clothing2_p03.png + TV_Clothing2_p03_c.png  a part's layer (the digit), and its mask: flat key colours
//                                                  that say which colour slot each pixel takes (white: fixed)
//   FG_Clothing2_p03_c4_m007.png                  a face part's layer c4, in colour slot m007 (none: fixed)
//
// Pure: reading the folder is passed in as a small fs ({ readdirSync, readFileSync, existsSync }) with a path
// module; the gradients are decoded with decodePng (inflate: zlib.inflateSync).
DocsDoodads.MzGen = {
    indexFormat: 'docs-doodads-mzgen-index',
    indexVersion: 1,
    indexFile: 'data/docs_doodads_cache/mzgen_index.json',
    bases: ['Male', 'Female', 'Kid'],
    views: ['TV', 'TVD', 'SV', 'Face'],
    prefixes: { TV: 'TV', TVD: 'TVD', SV: 'SV', Face: 'FG' },
    gradients: ['common', 'eyes', 'hair', 'skin'],
    // The colour slots, as the face files name them (m001...) plus the walking-only tail and wing: the label,
    // and the gradient file whose ramps they take.
    slots: {
        m001: ['Skin', 'skin'], m002: ['Eyes', 'eyes'], m003: ['Hair', 'hair'], m004: ['Hair 2', 'hair'], m005: ['Facial mark', 'common'],
        m006: ['Beast ears', 'hair'], m007: ['Clothing 1', 'common'], m008: ['Clothing 2', 'common'], m009: ['Clothing 3', 'common'],
        m010: ['Clothing 4', 'common'], m011: ['Cloak 1', 'common'], m012: ['Cloak 2', 'common'], m013: ['Accessory A 1', 'common'],
        m014: ['Accessory A 2', 'common'], m015: ['Accessory A 3', 'common'], m016: ['Accessory B 1', 'common'], m017: ['Accessory B 2', 'common'],
        m018: ['Accessory B 3', 'common'], m019: ['Accessory B 4', 'common'], m020: ['Glasses 1', 'common'], m021: ['Glasses 2', 'common'],
        tail: ['Tail', 'hair'], wing: ['Wing', 'common']
    },
    // The walking, damaged and battler masks' key colours and the slot each stands for (measured: each key's
    // colours under the mask, against the same part's face files).
    keys: {
        f9c19d: 'm001', '2c80cb': 'm002', fccb0a: 'm003', b892c5: 'm004', '009296': 'm005', d3cec7: 'm006', ae8682: 'm007', fe9d1e: 'm008',
        '1c76d0': 'm009', d9a404: 'm010', d8ac00: 'm011', a30708: 'm012', d3cec2: 'm013', da346e: 'm014', a4c911: 'm015', c78407: 'm016',
        c0d3d2: 'm017', '4155b6': 'm018', ba3b45: 'm019', '999999': 'm020', ccbad2: 'm021', e6d6bd: 'tail', a7d6d6: 'wing'
    },
    // The parts' families (layers 1 and 2 of a family are one part), and the slots the walking-only ones take.
    familySlots: { Tail: ['tail'], Wing: ['wing'] },
    // Drawing order, back to front, per view (a family's layer 2 is behind the body, its layer 1 in front).
    order: {
        TV: ['Tail2', 'Wing2', 'Cloak2', 'RearHair2', 'FrontHair2', 'Body', 'Ears', 'FacialMark', 'Beard', 'Clothing1', 'Clothing2', 'Cloak1', 'RearHair1', 'FrontHair1', 'BeastEars', 'AccA', 'Glasses', 'AccB', 'Wing1', 'Tail1'],
        TVD: ['Wing', 'Tail', 'Cloak', 'Body', 'Ears', 'FacialMark', 'Beard', 'Clothing', 'RearHair', 'FrontHair', 'BeastEars', 'AccA', 'Glasses', 'AccB'],
        SV: ['Wing', 'Tail', 'Cloak2', 'Body', 'Ears', 'FacialMark', 'Beard', 'Clothing1', 'Clothing2', 'Cloak1', 'RearHair1', 'FrontHair', 'BeastEars', 'AccA', 'Glasses', 'AccB'],
        // A face part's layers within its place: the highest c first (c1 on top).
        Face: ['RearHair2', 'Cloak2', 'Body', 'Face', 'Ears', 'Eyes', 'Nose', 'Mouth', 'Eyebrows', 'FacialMark', 'Beard', 'Clothing1', 'Clothing2', 'Cloak1', 'RearHair1', 'FrontHair', 'BeastEars', 'AccA', 'Glasses', 'AccB']
    },
    sizes: { TV: [144, 192], TVD: [144, 48], SV: [576, 384], Face: [144, 144] },

    pad(n) {
        return String(n).padStart(2, '0');
    },

    // 'TV_Clothing2_p03.png' -> { family: 'Clothing', layer: 2, num: 3 }; 'FG_Eyes_p01_c2.png' -> { ..., c: 2, m: '' }.
    // Masks (_c.png) and stray names give null.
    parseName(view, file) {
        const pre = this.prefixes[view];
        if (view === 'Face') {
            const m = new RegExp('^' + pre + '_([A-Za-z]+?)(\\d?)_p(\\d+)_c(\\d+)(?:_m(\\d+))?\\.png$').exec(file);
            return m ? { family: this.family(m[1]), layer: m[2] ? Number(m[2]) : 0, num: Number(m[3]), c: Number(m[4]), m: m[5] ? 'm' + m[5].padStart(3, '0') : '' } : null;
        }
        const m = new RegExp('^' + pre + '_([A-Za-z]+?)(\\d?)_p(\\d+)\\.png$').exec(file);
        return m ? { family: this.family(m[1]), layer: m[2] ? Number(m[2]) : 0, num: Number(m[3]) } : null;
    },

    // SV names the body 'body'.
    family(name) {
        return name === 'body' ? 'Body' : name;
    },

    isLibrary(fsLike, pathLib, root) {
        try {
            return Boolean(root) && fsLike.existsSync(pathLib.join(root, 'TV')) && fsLike.existsSync(pathLib.join(root, 'grad_common.png'));
        } catch (e) {
            return false;
        }
    },

    // A gradient file's ramps: 4-pixel bands, light to dark, read along each band's middle.
    readRamps(image) {
        const out = [];
        if (!image) return out;
        for (let y = 1; y < image.height; y += 4) {
            let hex = '';
            for (let x = 0; x < image.width; x++) {
                const o = (y * image.width + x) * 4;
                hex += ((image.data[o] << 16) | (image.data[o + 1] << 8) | image.data[o + 2]).toString(16).padStart(6, '0');
            }
            out.push(hex);
        }
        return out;
    },

    // Reads the folder into an index. now: an ISO time for 'built' (for tests).
    scan(fsLike, pathLib, root, inflate, now) {
        if (!this.isLibrary(fsLike, pathLib, root)) return null;
        const warnings = [];
        const ramps = {};
        for (const g of this.gradients) {
            let image = null;
            try { image = DocsDoodads.LpcCompose.decodePng(fsLike.readFileSync(pathLib.join(root, `grad_${g}.png`)), inflate); } catch (e) { image = null; }
            if (!image) warnings.push(`grad_${g}.png could not be read: its colours are left as drawn.`);
            ramps[g] = this.readRamps(image);
        }
        // base/family/num -> part
        const byKey = new Map();
        for (const base of this.bases) {
            for (const view of this.views) {
                const dir = pathLib.join(root, view, base);
                let files = [];
                try { files = fsLike.readdirSync(dir).filter(f => /\.png$/i.test(f)).sort(); } catch (e) { if (view === 'TV') warnings.push(`There is no ${base} base.`); continue; }
                const have = new Set(files);
                for (const file of files) {
                    const info = this.parseName(view, file);
                    if (!info) continue;
                    const id = base + '/' + info.family + '/' + this.pad(info.num);
                    const part = byKey.get(id) || { id, base, family: info.family, num: info.num, files: { TV: [], TVD: [], SV: [], Face: [] }, slots: [] };
                    const mask = file.replace(/\.png$/i, '_c.png');
                    const entry = view === 'Face' ? { file: view + '/' + base + '/' + file, layer: info.layer, c: info.c, m: info.m }
                        : { file: view + '/' + base + '/' + file, layer: info.layer, mask: have.has(mask) ? view + '/' + base + '/' + mask : '' };
                    part.files[view].push(entry);
                    if (view === 'Face' && info.m && !part.slots.includes(info.m)) part.slots.push(info.m);
                    byKey.set(id, part);
                }
            }
        }
        const parts = [...byKey.values()].sort((a, b) => (a.base < b.base ? -1 : a.base > b.base ? 1 : 0) || (a.family < b.family ? -1 : a.family > b.family ? 1 : 0) || a.num - b.num);
        // Each mask is read once: the slots it holds (so a colour change only redraws the layers it reaches),
        // and the colours that are no key: listed, so a stray pixel left as drawn can be found.
        const offKeys = new Map(), snappedKeys = new Map();
        const note = (map, rgb, part) => { const list = map.get(rgb) || []; if (!list.includes(part.name + ' (' + part.base + ')')) list.push(part.name + ' (' + part.base + ')'); map.set(rgb, list); };
        for (const part of parts) {
            for (const s of this.familySlots[part.family] || []) if (!part.slots.includes(s)) part.slots.push(s);
            part.slots.sort();
            part.name = this.label(part.family) + ' ' + part.num;
            for (const view of ['TV', 'TVD', 'SV']) {
                for (const entry of part.files[view]) {
                    if (!entry.mask) continue;
                    let mask = null;
                    try { mask = DocsDoodads.LpcCompose.decodePng(fsLike.readFileSync(pathLib.join(root, entry.mask)), inflate); } catch (e) { mask = null; }
                    if (!mask) continue;
                    const seen = this.maskSlots(mask, part.slots);
                    entry.slots = seen.slots;
                    seen.unknown.forEach(rgb => note(offKeys, rgb, part));
                    seen.snapped.forEach(rgb => note(snappedKeys, rgb, part));
                }
            }
        }
        const some = list => list.slice(0, 3).join(', ') + (list.length > 3 ? ` and ${list.length - 3} more` : '');
        for (const [rgb, list] of snappedKeys) {
            const k = this.nearestKey(rgb);
            warnings.push(`Mask colour ${this.hex(rgb)} is read as ${this.slots[this.keys[this.hex(k).slice(1)]][0]} (${this.hex(k)}) in ${some(list)}.`);
        }
        for (const [rgb, list] of offKeys) warnings.push(`Mask colour ${this.hex(rgb)} is no colour slot: those pixels keep their colour, in ${some(list)}.`);
        return { format: this.indexFormat, version: this.indexVersion, library: root, built: now || new Date().toISOString(), bases: this.bases.filter(b => parts.some(p => p.base === b)), ramps, parts, warnings };
    },

    // 'FrontHair' -> 'Front hair'.
    label(family) {
        return { AccA: 'Accessory A', AccB: 'Accessory B', FacialMark: 'Facial mark', BeastEars: 'Beast ears', FrontHair: 'Front hair', RearHair: 'Rear hair' }[family] || family;
    },

    validIndex(index) {
        return index && index.format === this.indexFormat && index.version === this.indexVersion && Array.isArray(index.parts) ? index : null;
    },

    summary(index) {
        if (!this.validIndex(index)) return null;
        return { parts: index.parts.length, bases: index.bases || [], built: index.built || '', warnings: index.warnings || [] };
    },

    // The slot a mask key colour stands for ('' when it is fixed). Called for every pixel of a layer, so the
    // keys are a Map from the packed colour, and an off-key colour (MZ's masks have a few) takes the nearest key
    // whose channels are each within snapDistance; farther ones stay fixed. Results are remembered.
    snapDistance: 24,

    slotOfKey(rgb) {
        rgb &= 0xffffff;
        const known = this.keyMap();
        if (known.has(rgb)) return known.get(rgb);
        const near = this._snapped || (this._snapped = new Map());
        if (!near.has(rgb)) {
            const k = this.nearestKey(rgb);
            near.set(rgb, k === null ? '' : known.get(k));
        }
        return near.get(rgb);
    },

    keyMap() {
        if (!this._keyMap) this._keyMap = new Map(Object.entries(this.keys).map(([hex, slot]) => [parseInt(hex, 16), slot]));
        return this._keyMap;
    },

    // The known key nearest rgb (by distance in RGB) among those with every channel within snapDistance, or
    // null. White and near-white mean fixed and never snap.
    isWhite(rgb) {
        return ((rgb >> 16) & 255) >= 0xf0 && ((rgb >> 8) & 255) >= 0xf0 && (rgb & 255) >= 0xf0;
    },

    nearestKey(rgb) {
        const r = (rgb >> 16) & 255, g = (rgb >> 8) & 255, b = rgb & 255;
        if (this.isWhite(rgb)) return null;
        let best = null, bestD = Infinity;
        for (const key of this.keyMap().keys()) {
            const dr = ((key >> 16) & 255) - r, dg = ((key >> 8) & 255) - g, db = (key & 255) - b;
            if (Math.max(Math.abs(dr), Math.abs(dg), Math.abs(db)) > this.snapDistance) continue;
            const d = dr * dr + dg * dg + db * db;
            if (d < bestD) { best = key; bestD = d; }
        }
        return best;
    },

    // A walking, damaged or battler mask's colour slots, and its colours that are neither a key, near one,
    // nor white (left as drawn): { slots: [...], unknown: [rgb], snapped: [rgb] }. partSlots: the slots the
    // part uses (its face files', its family's): a near colour only counts as a slot the part has or the mask
    // holds exactly (a stray pixel in a coat must not take the tail's colour).
    maskSlots(mask, partSlots) {
        const known = this.keyMap(), d = mask.data;
        const colours = new Set();
        let last = -1;
        for (let i = 0; i < d.length; i += 4) {
            if (!d[i + 3]) continue;
            const rgb = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2];
            if (rgb !== last) { colours.add(rgb); last = rgb; }
        }
        const allowed = new Set(partSlots || []);
        for (const rgb of colours) if (known.has(rgb)) allowed.add(known.get(rgb));
        const slots = new Set(), unknown = new Set(), snapped = new Set();
        for (const rgb of colours) {
            const slot = this.slotOfKey(rgb);
            if (slot && (known.has(rgb) || !partSlots || allowed.has(slot))) {
                slots.add(slot);
                if (!known.has(rgb)) snapped.add(rgb);
            } else if (!this.isWhite(rgb)) unknown.add(rgb);
        }
        return { slots: [...slots].sort(), unknown: [...unknown], snapped: [...snapped] };
    },

    hex(rgb) {
        return '#' + (rgb & 0xffffff).toString(16).padStart(6, '0');
    },

    // ---- Colours ----

    // A slot's colour choices: '' (as drawn) then each ramp of its gradient file ('hair:5').
    colourNames(index, slot) {
        const info = this.slots[slot];
        const list = info && index && index.ramps ? index.ramps[info[1]] || [] : [];
        return [''].concat(list.map((_, i) => info[1] + ':' + i));
    },

    // A ramp as [r, g, b] x 256, or null.
    ramp(index, name) {
        const [g, i] = String(name || '').split(':');
        const hex = index && index.ramps && index.ramps[g] && index.ramps[g][Number(i)];
        if (!hex) return null;
        const out = [];
        for (let x = 0; x < hex.length; x += 6) { const v = parseInt(hex.slice(x, x + 6), 16); out.push([(v >> 16) & 255, (v >> 8) & 255, v & 255]); }
        return out;
    },

    // The swatch of a ramp: about a third of the way along (light to dark), where the colour is clearest.
    swatch(index, name) {
        const r = this.ramp(index, name);
        if (!r) return '';
        const c = r[Math.floor(r.length * 0.35)];
        return '#' + ((c[0] << 16) | (c[1] << 8) | c[2]).toString(16).padStart(6, '0');
    },

    insideProject(pathLib, folder, project) {
        return DocsDoodads.Lpc.insideProject(pathLib, folder, project);
    }
};
