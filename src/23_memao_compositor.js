//==========================================================
// SECTION 12H: MEMAO COMPOSITOR (ANIMATIONS, DEPTH PER FACING, COLOURS)
//==========================================================
// Stacks the layers of one Memao character into a sheet for one animation. The pack's sheets are 8 columns of
// 48-pixel frames running left to right; each animation is its four facings (down, up, left, right) of N
// frames each, at a fixed place in its set (measured on the pack: docs/MEMAO_CHARACTER_CREATOR_PLAN.md). A
// layer's depth depends on the facing. The output uses the LPC compositor's layout (rows up, left, down,
// right; frames along a row; sheet.frame = 48), so the creator's stage and the exports read both alike.
//
// The art is greyscale: the three greys of a part are swapped for a 3-tone ramp of its colour (outlines and
// coloured details stay). The ramps are Doc's Doodads' own.
//
//   resolve(index, recipe, animation, exists) -> the layers to draw (files, depths, colours) and warnings
//   compose(resolved, loadImage, cache) -> { sheet, warnings }
DocsDoodads.MemaoCompose = {
    frame: 48,
    columns: 8,
    // The facings in the pack's order within an animation, and the rows of a composed sheet (as LPC's).
    order: ['down', 'up', 'left', 'right'],
    directions: ['up', 'left', 'down', 'right'],
    animations: {
        idle: { set: 'Main', start: 0, frames: 4 }, walk: { set: 'Main', start: 16, frames: 6 }, run: { set: 'Main', start: 40, frames: 6 },
        pickup: { set: 'Main', start: 64, frames: 4 }, strike: { set: 'Main', start: 80, frames: 4 }, chop: { set: 'Main', start: 96, frames: 4 },
        seed: { set: 'Main', start: 112, frames: 3 }, water: { set: 'Main', start: 124, frames: 4 }, reap: { set: 'Main', start: 140, frames: 4 },
        slash: { set: 'Battle', start: 0, frames: 4 }, hurt: { set: 'Battle', start: 16, frames: 2 }, downed: { set: 'Battle', start: 24, frames: 2 },
        death: { set: 'Battle', start: 32, frames: 3 },
        eat: { set: 'Daily Life', start: 0, frames: 3 }, drink: { set: 'Daily Life', start: 12, frames: 3 }, laugh: { set: 'Daily Life', start: 24, frames: 3 },
        wave: { set: 'Daily Life', start: 36, frames: 4 }, think: { set: 'Daily Life', start: 52, frames: 4 }, shrug: { set: 'Daily Life', start: 68, frames: 4 },
        sit: { set: 'Daily Life', start: 84, frames: 4 }, read: { set: 'Daily Life', start: 100, frames: 4 },
        // Paint is drawn facing left and right only.
        paint: { set: 'Daily Life', start: 116, frames: 4, sides: true }
    },
    // The greys each kind of part is drawn in (darkest first), swapped for a ramp's dark, middle and light.
    greys: { skin: [0x545454, 0xaaaaaa, 0xffffff], eyes: [0x404040, 0x808080], other: [0x404040, 0x808080, 0xffffff] },
    // Doc's Doodads' ramps: [dark, middle, light].
    palettes: {
        skin: {
            porcelain: ['#c48f7f', '#f2cbb8', '#fff0e6'], light: ['#b5786a', '#e8b49a', '#fbe0cf'], peach: ['#a96652', '#dba07f', '#f6cdb0'],
            tan: ['#93583f', '#c88a63', '#ecb88f'], olive: ['#7d5a3a', '#b58757', '#dcb383'], bronze: ['#6e4229', '#a2663f', '#cf9466'],
            brown: ['#53301f', '#84502f', '#b27a50'], deep: ['#33190f', '#5c3320', '#8a5634'],
            green: ['#3f6b3a', '#6fa25e', '#a6d38c'], blue: ['#3c4f86', '#6b85c4', '#a9c0ef'], ash: ['#55525e', '#8b8796', '#c4c1cc']
        },
        hair: {
            black: ['#141219', '#2c2833', '#4d4757'], dark_brown: ['#2a1710', '#4b2c1d', '#704630'], brown: ['#4a2a17', '#7a4a2a', '#a8703f'],
            auburn: ['#5a1e12', '#8f3a22', '#c25f37'], ginger: ['#7a2e0e', '#c25a1c', '#ee8a3a'], blonde: ['#8a6326', '#c99b45', '#f0d07e'],
            platinum: ['#8f8a7c', '#cfc9b6', '#f7f3e6'], grey: ['#55555e', '#8e8e98', '#cfcfd6'], white: ['#a7a7b8', '#dedee8', '#ffffff'],
            pink: ['#9b3f6a', '#d66f9c', '#f6a9c9'], purple: ['#4a2f73', '#7c55b0', '#b18ee0'], blue: ['#22407a', '#3f6fc0', '#7fa8ec'],
            teal: ['#1d5c5a', '#2f918a', '#62c7bb'], green: ['#2c5a2a', '#4b8f44', '#83c574'], red: ['#6b1018', '#a8222e', '#e0505a']
        },
        eyes: {
            brown: ['#3b2416', '#6e4428', '#6e4428'], hazel: ['#4a3a16', '#8a6f2c', '#8a6f2c'], green: ['#1f4a2a', '#3f8a4f', '#3f8a4f'],
            blue: ['#1d3a6e', '#3f6fbf', '#3f6fbf'], grey: ['#3a3d44', '#6f7480', '#6f7480'], violet: ['#3e2468', '#7450b0', '#7450b0'],
            red: ['#5e1414', '#a8302c', '#a8302c'], gold: ['#6e5010', '#c49a2a', '#c49a2a'], black: ['#141216', '#2e2b33', '#2e2b33']
        },
        cloth: {
            white: ['#9a9aa8', '#d8d8e2', '#ffffff'], cream: ['#a8957a', '#e1d1b5', '#fff7e8'], grey: ['#5b5b66', '#9a9aa6', '#d2d2da'],
            charcoal: ['#2a2a31', '#4a4a55', '#73737f'], black: ['#121216', '#26262d', '#45454f'], red: ['#6e1418', '#b02a2e', '#e65a55'],
            orange: ['#8a3a10', '#d06a20', '#f5a050'], mustard: ['#8a6a14', '#c9a228', '#ecd060'], olive: ['#4a5320', '#76823a', '#a8b464'],
            green: ['#1f5a32', '#348c4e', '#6cc27a'], teal: ['#155a5a', '#25918a', '#5fc7bb'], sky: ['#3a6f9c', '#6aa6d6', '#a8d6f4'],
            blue: ['#1c3870', '#2f5cb0', '#6a94e0'], navy: ['#141c3c', '#25336a', '#43579c'], denim: ['#23365a', '#3d5a8a', '#6a8ab8'],
            purple: ['#3e2468', '#6c45a8', '#a07ad8'], lavender: ['#6c5a9c', '#a28cd4', '#d6c8f4'], pink: ['#9c3a6a', '#e070a0', '#f8b0cc'],
            rose: ['#8a2c44', '#c8546e', '#ee90a4'], brown: ['#3e2414', '#6a4026', '#9a6640'], tan: ['#7a5a36', '#b08a5a', '#dcbc8a']
        }
    },
    // Each channel's colour for a new pick.
    defaults: { skin: 'light', hair: 'brown', eyes: 'brown', cloth: 'white' },

    fileOf(set, folder, num) {
        return set + '/' + folder + '/' + folder.toLowerCase() + '_' + DocsDoodads.Memao.pad(num) + '.png';
    },

    // A channel's colour names, and the swatch a name shows (the middle of its ramp).
    colourNames(channel) {
        return channel && this.palettes[channel] ? Object.keys(this.palettes[channel]) : [];
    },

    swatch(channel, name) {
        const ramp = channel && this.palettes[channel] && this.palettes[channel][name];
        return ramp ? ramp[1] : '';
    },

    // ---- Which layers ----

    // recipe: { body (the arms), picks: [{ id, colour }] } where each pick's colour is already the one to draw
    // it in (MemaoSlots.toRecipe works out skin and sleeves). The Arms and the props are added here.
    resolve(index, recipe, animation, exists) {
        const M = DocsDoodads.Memao;
        const meta = this.animations[animation];
        const warnings = [];
        const layers = [];
        if (!meta) return { animation, layers, warnings: [`There is no ${animation} animation.`], used: [] };
        if (!index || !index.sets || !index.sets[meta.set] || !index.sets[meta.set].frames) {
            return { animation, layers, warnings: [`The pack has no ${meta.set} set, which ${animation} is in.`], used: [] };
        }
        const byId = new Map((index.parts || []).map(p => [p.id, p]));
        const arm = recipe && recipe.body || 'average';
        const add = (folder, num, colour, part, order) => {
            const info = index.folders[folder];
            if (!info || num === null || num === undefined) return;
            const file = this.fileOf(meta.set, folder, num);
            if (!exists(file)) return;
            layers.push({ file, folder, num, z: info.z, channel: info.channel, colour: info.channel ? colour || this.defaults[info.channel] : '', part, order });
        };
        let order = 0;
        for (const pick of recipe && recipe.picks || []) {
            const part = byId.get(pick.id);
            if (!part) { warnings.push(`There is no part "${pick.id}" in the pack any more.`); continue; }
            const num = M.fileFor(part, arm);
            if (num === null) { warnings.push(`${part.name} has nothing for ${arm} arms.`); continue; }
            add(part.folder, num, pick.colour, part, order++);
            // Its frames at another depth (Hair D for Hair B...), from the same file number.
            for (const [follower, leader] of Object.entries(M.pairs)) if (leader === part.folder) add(follower, num, pick.colour, part, order++);
        }
        // Props show in their own animations only (their other frames are empty).
        for (const folder of M.props) {
            const part = (index.parts || []).filter(p => p.folder === folder).sort((a, b) => a.order - b.order)[0];
            if (part) add(folder, M.fileFor(part, arm), '', part, order++);
        }
        return { animation, layers, warnings, used: layers.map(l => ({ part: l.part, folder: l.folder })) };
    },

    // ---- Colours ----

    // source grey -> [r, g, b] for a channel's colour.
    recolourMap(channel, colour) {
        const ramp = channel && this.palettes[channel] && this.palettes[channel][colour];
        if (!ramp) return null;
        const hex = DocsDoodads.LpcCompose.hex.bind(DocsDoodads.LpcCompose);
        const greys = this.greys[channel] || this.greys.other;
        const map = new Map();
        greys.forEach((g, i) => map.set(g, hex(ramp[i])));
        return map;
    },

    // Only opaque pixels in exactly the template's greys change; outlines, coloured details and glass stay.
    recolour(image, map) {
        if (!map) return image;
        const d = image.data;
        for (let i = 0; i < d.length; i += 4) {
            if (d[i + 3] !== 255) continue;
            const to = map.get((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]);
            if (to) { d[i] = to[0]; d[i + 1] = to[1]; d[i + 2] = to[2]; }
        }
        return image;
    },

    // ---- Stacking ----

    // loadImage(file) -> { width, height, data } or null. One row per facing, each with its own depth order.
    compose(resolved, loadImage, cache) {
        const C = DocsDoodads.LpcCompose;
        const meta = this.animations[resolved.animation];
        const warnings = resolved.warnings.slice();
        if (!meta || !resolved.layers.length) return { sheet: null, warnings };
        const F = this.frame;
        const sheet = C.blank(meta.frames * F, 4 * F);
        sheet.frame = F;
        const images = new Map();
        for (const layer of resolved.layers) {
            const image = C.cached(cache, layer.file + '|' + layer.colour, () => {
                const raw = loadImage(layer.file);
                return raw ? this.recolour(C.copy(raw), this.recolourMap(layer.channel, layer.colour)) : null;
            });
            if (!image) { warnings.push(`Could not read ${layer.file}.`); continue; }
            images.set(layer, image);
        }
        this.directions.forEach((dir, row) => {
            const facing = this.order.indexOf(dir);
            const list = resolved.layers.filter(l => images.has(l)).sort((a, b) => a.z[dir] - b.z[dir] || a.order - b.order);
            for (const layer of list) {
                const image = images.get(layer), cols = Math.max(1, Math.floor(image.width / F));
                for (let f = 0; f < meta.frames; f++) {
                    const at = meta.start + facing * meta.frames + f;
                    const sx = (at % cols) * F, sy = Math.floor(at / cols) * F;
                    if (sy + F <= image.height) C.overRect(sheet, image, sx, sy, f * F, row * F, F, F);
                }
            }
        });
        return { sheet, warnings };
    },

    // One frame of a composed sheet: frame number along the row, facing by name.
    frameRect(animation, direction, frame, size = this.frame) {
        const a = this.animations[animation] || { frames: 1 };
        const row = Math.max(0, this.directions.indexOf(direction));
        return { x: (frame % a.frames) * size, y: row * size, w: size, h: size };
    }
};
