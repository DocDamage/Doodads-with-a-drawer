//==========================================================
// SECTION 12F: LPC EXPORTS (MZ SHEETS AND FACES)
//==========================================================
// Sheets for RPG Maker MZ from a composed LPC character (23_lpc_compositor.js). MZ's rows face down, left,
// right, up; the library's face up, left, down, right, so rows are reordered. Frames stay 64 x 64: MZ draws
// $ sheets at any frame size, standing on the tile's bottom edge.
//
//   classic  $Name.png              3 x 4, MZ's own walk (step, stand, step), works without the plugin
//   smooth   $Name[f9][w2].png      every walk frame; [w2]: frame 0 stands, the walk covers 2 tiles a cycle
//   idle     $Name_idle[f2].png     breathing while standing (an animation set plays it after a moment)
//   run      $Name_run[f8].png      while dashing
//   face     img/faces/Name.png     the head, scaled up whole pixels, in one of the sheet's 8 slots
//
// Pure: images are { width, height, data } (RGBA). Writing them is the workspace's (44_workspace_lpc_export.js).
DocsDoodads.LpcExport = {
    frame: 64,
    mzRows: ['down', 'left', 'right', 'up'],
    // The classic walker's columns: the two widest strides around the standing frame (measured in phase 0).
    classicColumns: [1, 0, 5],
    faceSize: 144,

    // A file name part that MZ and Windows accept: no brackets (they are tags), slashes or reserved signs.
    cleanName(name) {
        return String(name || '').replace(/[\[\]\\/:*?"<>|$!%]/g, '').replace(/\s+/g, ' ').trim().slice(0, 60);
    },

    names(name) {
        const n = this.cleanName(name) || 'Character';
        return { classic: '$' + n, smooth: '$' + n + '[f9][w2]', idle: '$' + n + '_idle[f2]', run: '$' + n + '_run[f8]', face: n };
    },

    // The animation set that plays the idle and run sheets with the smooth walker.
    animationSet(names) {
        return { character: names.smooth, idle: names.idle, run: names.run, idleDelay: 90, idleFps: 3, runFps: 20 };
    },

    blank(width, height) {
        return { width, height, data: new Uint8ClampedArray(width * height * 4) };
    },

    blit(dst, src, sx, sy, dx, dy, w, h) {
        for (let y = 0; y < h; y++) {
            if (sy + y < 0 || sy + y >= src.height || dy + y < 0 || dy + y >= dst.height) continue;
            const from = ((sy + y) * src.width + sx) * 4, to = ((dy + y) * dst.width + dx) * 4;
            dst.data.set(src.data.subarray(from, from + w * 4), to);
        }
    },

    // A sheet in MZ's row order from one of the library's animations, with the given columns (frames).
    mzSheet(sheet, columns) {
        const F = this.frame, dirs = DocsDoodads.LpcCompose.directions;
        const out = this.blank(columns.length * F, 4 * F);
        this.mzRows.forEach((dir, row) => columns.forEach((frame, col) => {
            if ((frame + 1) * F <= sheet.width) this.blit(out, sheet, frame * F, dirs.indexOf(dir) * F, col * F, row * F, F, F);
        }));
        return out;
    },

    frames(sheet) {
        return Math.floor(sheet.width / this.frame);
    },

    classic(walk) {
        return this.mzSheet(walk, this.classicColumns);
    },

    allFrames(sheet) {
        return this.mzSheet(sheet, Array.from({ length: this.frames(sheet) }, (_, i) => i));
    },

    // ---- Character Actions ----

    // The animations offered as action sheets, with the speed they look right at (frames a second).
    actions: [['slash', 12], ['thrust', 12], ['spellcast', 10], ['shoot', 14], ['hurt', 8], ['jump', 10], ['sit', 4], ['emote', 6], ['climb', 8], ['combat', 3], ['1h_backslash', 14], ['1h_halfslash', 12]],

    actionName(name, anim) {
        const n = this.cleanName(name) || 'Character';
        return '$' + n + '_' + anim.replace(/^1h_/, '') + '[f' + (DocsDoodads.LpcCompose.animations[anim] || { frames: 1 }).frames + ']';
    },

    // An action sheet: every frame, four MZ rows. Animations drawn in one row (hurt, climb) use it for all four.
    actionSheet(sheet, anim) {
        const meta = DocsDoodads.LpcCompose.animations[anim] || {};
        if (meta.rows !== 1) return this.allFrames(sheet);
        const F = this.frame, n = this.frames(sheet);
        const out = this.blank(n * F, 4 * F);
        for (let row = 0; row < 4; row++) this.blit(out, sheet, 0, 0, 0, row * F, n * F, F);
        return out;
    },

    // ---- The side-view battler ----

    // MZ's 18 battle motions in order (each 3 frames; motion i is at column group floor(i / 6), row i % 6),
    // and the library animation drawn for each, facing left unless given. frames: which three, or spread
    // evenly over the animation when not given.
    svMotions: [
        { motion: 'walk', anim: 'walk', frames: [1, 0, 5] },
        { motion: 'wait', anim: 'idle', frames: [0, 1, 0] },
        { motion: 'chant', anim: 'spellcast', frames: [1, 2, 1] },
        { motion: 'guard', anim: 'combat', frames: [0, 1, 0] },
        { motion: 'damage', anim: 'hurt', frames: [0, 1, 2] },
        { motion: 'evade', anim: 'jump', frames: [0, 1, 0] },
        { motion: 'thrust', anim: 'thrust' },
        { motion: 'swing', anim: 'slash' },
        { motion: 'missile', anim: 'shoot' },
        { motion: 'skill', anim: '1h_halfslash' },
        { motion: 'spell', anim: 'spellcast' },
        { motion: 'item', anim: 'emote' },
        { motion: 'escape', anim: 'run', dir: 'right' },
        { motion: 'victory', anim: 'jump', frames: [1, 2, 3] },
        { motion: 'dying', anim: 'hurt', frames: [2, 3, 2] },
        { motion: 'abnormal', anim: 'hurt', frames: [1, 2, 1] },
        { motion: 'sleep', anim: 'hurt', frames: [5, 5, 5] },
        { motion: 'dead', anim: 'hurt', frames: [5, 5, 5] }
    ],
    // When a character's parts have no picture for an animation, the motion uses another.
    svFallback: { idle: 'walk', combat: 'idle', spellcast: 'idle', hurt: 'walk', jump: 'walk', thrust: 'walk', slash: 'walk', shoot: 'walk', '1h_halfslash': 'slash', emote: 'idle', run: 'walk' },

    // The library animations a battler needs.
    svAnimations() {
        return [...new Set(this.svMotions.map(m => m.anim))];
    },

    // Three frames spread over an animation of n frames.
    spread(n) {
        return [0, 1, 2].map(k => Math.min(n - 1, Math.floor((k + 0.5) * n / 3)));
    },

    // sheets: { anim: composed sheet or null }. Returns the 576 x 384 battler and which motions fell back.
    svSheet(sheets) {
        const F = this.frame, dirs = DocsDoodads.LpcCompose.directions;
        const out = this.blank(9 * F, 6 * F);
        const fellBack = [];
        this.svMotions.forEach((m, i) => {
            let anim = m.anim, frames = m.frames, guard = 0;
            while (!sheets[anim] && this.svFallback[anim] && guard++ < 4) { anim = this.svFallback[anim]; frames = null; }
            const sheet = sheets[anim];
            if (!sheet) return;
            if (anim !== m.anim) fellBack.push(m.motion);
            const n = this.frames(sheet);
            const meta = DocsDoodads.LpcCompose.animations[anim] || {};
            const row = meta.rows === 1 ? 0 : dirs.indexOf(m.dir || 'left');
            const cols = (frames || this.spread(n)).map(f => Math.min(n - 1, f));
            cols.forEach((f, k) => this.blit(out, sheet, f * F, row * F, (Math.floor(i / 6) * 3 + k) * F, (i % 6) * F, F, F));
        });
        return { sheet: out, fellBack };
    },

    // ---- The face ----

    // Where the head is in the down-facing standing frame: from the top of the hair (or head) 32 pixels
    // down, centred on what is drawn in those rows.
    headBox(walk) {
        const F = this.frame, row = DocsDoodads.LpcCompose.directions.indexOf('down') * F;
        const at = (x, y) => walk.data[((row + y) * walk.width + x) * 4 + 3];
        let top = -1;
        for (let y = 0; y < F && top < 0; y++) for (let x = 0; x < F; x++) if (at(x, y)) { top = y; break; }
        if (top < 0) return null;
        let sum = 0, n = 0;
        for (let y = top; y < Math.min(F, top + 24); y++) for (let x = 0; x < F; x++) if (at(x, y)) { sum += x; n++; }
        const size = 32;
        const cx = n ? Math.round(sum / n) : F / 2;
        return { x: Math.max(0, Math.min(F - size, cx - size / 2)), y: Math.max(0, Math.min(F - size, top - 2)), size };
    },

    // A 144 x 144 face: the head scaled 4 times (whole pixels) on a soft rounded card, or on nothing.
    face(walk, options = {}) {
        const S = this.faceSize, box = this.headBox(walk);
        const out = this.blank(S, S);
        if (!box) return out;
        const scale = 4, size = box.size * scale, ox = Math.floor((S - size) / 2), oy = S - size - 4;
        if (options.background !== false) {
            const [r, g, b] = options.background || [217, 244, 239];
            const radius = 24;
            for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
                const dx = Math.max(radius - x, 0, x - (S - 1 - radius)), dy = Math.max(radius - y, 0, y - (S - 1 - radius));
                if (dx * dx + dy * dy > radius * radius) continue;
                const o = (y * S + x) * 4;
                out.data[o] = r; out.data[o + 1] = g; out.data[o + 2] = b; out.data[o + 3] = 255;
            }
        }
        const row = DocsDoodads.LpcCompose.directions.indexOf('down') * this.frame;
        for (let y = 0; y < box.size; y++) for (let x = 0; x < box.size; x++) {
            const i = ((row + box.y + y) * walk.width + box.x + x) * 4;
            const a = walk.data[i + 3];
            if (!a) continue;
            for (let sy = 0; sy < scale; sy++) for (let sx = 0; sx < scale; sx++) {
                const px = ox + x * scale + sx, py = oy + y * scale + sy;
                if (px < 0 || py < 0 || px >= S || py >= S) continue;
                const o = (py * S + px) * 4, k = a / 255, d = out.data[o + 3] / 255, oa = k + d * (1 - k);
                for (let c = 0; c < 3; c++) out.data[o + c] = Math.round((walk.data[i + c] * k + out.data[o + c] * d * (1 - k)) / oa);
                out.data[o + 3] = Math.round(oa * 255);
            }
        }
        return out;
    },

    // MZ's face sheet: 4 x 2 faces of 144. An existing sheet keeps its other faces.
    faceSheet(existing, face, slot = 0) {
        const S = this.faceSize;
        const out = this.blank(S * 4, S * 2);
        if (existing && existing.width === out.width && existing.height === out.height) out.data.set(existing.data);
        const s = Math.max(0, Math.min(7, Math.floor(slot)));
        const x = (s % 4) * S, y = Math.floor(s / 4) * S;
        for (let r = 0; r < S; r++) out.data.fill(0, ((y + r) * out.width + x) * 4, ((y + r) * out.width + x + S) * 4);
        this.blit(out, face, 0, 0, x, y, S, S);
        return out;
    }
};
