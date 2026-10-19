//==========================================================
// SECTION 12J: MEMAO EXPORTS (MZ SHEETS, BATTLER, FACE)
//==========================================================
// Sheets for RPG Maker MZ from a composed Memao character (23_memao_compositor.js). Its frames are 48 x 48,
// MZ's own size. Rows go into MZ's order (down, left, right, up).
//
//   classic  $Name.png              3 x 4, MZ's own walk (step, stand, step), works without the plugin
//   smooth   $Name[f7][w2].png      frame 0 stands (idle frame 0), then the 6 walk frames, a cycle every 2 tiles
//   idle     $Name_idle[f4].png     breathing while standing (an animation set plays it after a moment)
//   run      $Name_run[f6].png      while dashing
//   action   $Name_wave[f4].png     every animation, for Play Character Action
//   battler  img/sv_actors/Name.png 9 x 6 cells of 48, MZ's 18 motions facing left
//   face     img/faces/Name.png     the head, scaled up whole pixels, in one of the sheet's 8 slots
//
// Pure: images are { width, height, data } (RGBA). Writing them is the workspace's (44_workspace_memao.js).
DocsDoodads.MemaoExport = {
    frame: 48,
    mzRows: ['down', 'left', 'right', 'up'],
    // The classic walker's columns, from the walk: a stride, then the standing frame, then the other stride.
    classicWalk: [1, 4],

    cleanName(name) {
        return DocsDoodads.LpcExport.cleanName(name);
    },

    names(name) {
        const n = this.cleanName(name) || 'Character';
        return { classic: '$' + n, smooth: '$' + n + '[f7][w2]', idle: '$' + n + '_idle[f4]', run: '$' + n + '_run[f6]', face: n };
    },

    animationSet(names) {
        return { character: names.smooth, idle: names.idle, run: names.run, idleDelay: 90, idleFps: 4, runFps: 14 };
    },

    // The animations offered as action sheets, with the speed they look right at (frames a second).
    actions: [['slash', 10], ['hurt', 6], ['downed', 4], ['death', 6], ['pickup', 8], ['strike', 10], ['chop', 10], ['reap', 10], ['seed', 8], ['water', 6],
        ['eat', 6], ['drink', 6], ['laugh', 8], ['wave', 8], ['think', 4], ['shrug', 6], ['sit', 4], ['read', 4], ['paint', 6]],

    actionLabel(anim) {
        return { pickup: 'pick up' }[anim] || String(anim);
    },

    actionName(name, anim) {
        const n = this.cleanName(name) || 'Character';
        return '$' + n + '_' + anim + '[f' + (DocsDoodads.MemaoCompose.animations[anim] || { frames: 1 }).frames + ']';
    },

    blank(width, height) {
        return { width, height, data: new Uint8ClampedArray(width * height * 4) };
    },

    blit(dst, src, sx, sy, dx, dy, w, h) {
        DocsDoodads.LpcExport.blit(dst, src, sx, sy, dx, dy, w, h);
    },

    frames(sheet) {
        return Math.floor(sheet.width / this.frame);
    },

    // A sheet in MZ's row order with the given columns: [{ sheet, frame }] or frame numbers of one sheet.
    // sides: an animation drawn facing left and right only (paint), whose down row shows left and up shows right.
    mzSheet(sheet, columns, sides) {
        const F = this.frame, dirs = DocsDoodads.MemaoCompose.directions;
        const out = this.blank(columns.length * F, 4 * F);
        this.mzRows.forEach((dir, row) => columns.forEach((col, i) => {
            const c = typeof col === 'number' ? { sheet, frame: col } : col;
            if (!c.sheet || (c.frame + 1) * F > c.sheet.width) return;
            const from = dirs.indexOf(sides && dir === 'down' ? 'left' : sides && dir === 'up' ? 'right' : dir);
            this.blit(out, c.sheet, c.frame * F, from * F, i * F, row * F, F, F);
        }));
        return out;
    },

    allFrames(sheet, sides) {
        return this.mzSheet(sheet, Array.from({ length: this.frames(sheet) }, (_, i) => i), sides);
    },

    classic(walk, idle) {
        return this.mzSheet(walk, [{ sheet: walk, frame: this.classicWalk[0] }, idle ? { sheet: idle, frame: 0 } : { sheet: walk, frame: 0 }, { sheet: walk, frame: this.classicWalk[1] }]);
    },

    // Frame 0 stands (the first idle frame), then every walk frame.
    smooth(walk, idle) {
        return this.mzSheet(walk, [idle ? { sheet: idle, frame: 0 } : { sheet: walk, frame: 0 }].concat(Array.from({ length: this.frames(walk) }, (_, i) => ({ sheet: walk, frame: i }))));
    },

    actionSheet(sheet, anim) {
        return this.allFrames(sheet, Boolean((DocsDoodads.MemaoCompose.animations[anim] || {}).sides));
    },

    // ---- The side-view battler ----

    // MZ's 18 motions in order, the animation for each (facing left unless given), and which frames (spread
    // over the animation when not given).
    svMotions: [
        { motion: 'walk', anim: 'walk', frames: [1, 0, 4] },
        { motion: 'wait', anim: 'idle', frames: [0, 1, 2] },
        { motion: 'chant', anim: 'think' },
        { motion: 'guard', anim: 'idle', frames: [0, 0, 0] },
        { motion: 'damage', anim: 'hurt', frames: [0, 1, 1] },
        { motion: 'evade', anim: 'walk', frames: [5, 4, 5] },
        { motion: 'thrust', anim: 'strike' },
        { motion: 'swing', anim: 'slash' },
        { motion: 'missile', anim: 'seed' },
        { motion: 'skill', anim: 'slash' },
        { motion: 'spell', anim: 'wave' },
        { motion: 'item', anim: 'drink' },
        { motion: 'escape', anim: 'run', dir: 'right' },
        { motion: 'victory', anim: 'laugh' },
        { motion: 'dying', anim: 'downed', frames: [0, 1, 1] },
        { motion: 'abnormal', anim: 'downed', frames: [1, 0, 1] },
        { motion: 'sleep', anim: 'death', frames: [2, 2, 2] },
        { motion: 'dead', anim: 'death', frames: [2, 2, 2] }
    ],
    svFallback: { think: 'idle', strike: 'slash', slash: 'walk', seed: 'walk', wave: 'idle', drink: 'idle', laugh: 'idle', hurt: 'walk', downed: 'idle', death: 'idle', run: 'walk', idle: 'walk' },

    svAnimations() {
        return [...new Set(this.svMotions.map(m => m.anim))];
    },

    spread(n) {
        return [0, 1, 2].map(k => Math.min(n - 1, Math.floor((k + 0.5) * n / 3)));
    },

    // sheets: { anim: composed sheet or null }. Returns the 432 x 288 battler and which motions fell back.
    svSheet(sheets) {
        const F = this.frame, dirs = DocsDoodads.MemaoCompose.directions;
        const out = this.blank(9 * F, 6 * F);
        const fellBack = [];
        this.svMotions.forEach((m, i) => {
            let anim = m.anim, frames = m.frames, guard = 0;
            while (!sheets[anim] && this.svFallback[anim] && guard++ < 4) { anim = this.svFallback[anim]; frames = null; }
            const sheet = sheets[anim];
            if (!sheet) return;
            if (anim !== m.anim) fellBack.push(m.motion);
            const n = this.frames(sheet);
            const row = dirs.indexOf(m.dir || 'left');
            (frames || this.spread(n)).map(f => Math.min(n - 1, f)).forEach((f, k) => this.blit(out, sheet, f * F, row * F, (Math.floor(i / 6) * 3 + k) * F, (i % 6) * F, F, F));
        });
        return { sheet: out, fellBack };
    },

    // ---- The face ----

    faceSize: 144,

    // The head in the first frame facing down: from the top of what is drawn, 20 pixels down, centred on it.
    headBox(sheet) {
        const F = this.frame, row = DocsDoodads.MemaoCompose.directions.indexOf('down') * F;
        const at = (x, y) => sheet.data[((row + y) * sheet.width + x) * 4 + 3];
        let top = -1;
        for (let y = 0; y < F && top < 0; y++) for (let x = 0; x < F; x++) if (at(x, y)) { top = y; break; }
        if (top < 0) return null;
        let sum = 0, n = 0;
        for (let y = top; y < Math.min(F, top + 14); y++) for (let x = 0; x < F; x++) if (at(x, y)) { sum += x; n++; }
        const size = 22;
        const cx = n ? Math.round(sum / n) : F / 2;
        return { x: Math.max(0, Math.min(F - size, cx - size / 2)), y: Math.max(0, Math.min(F - size, top - 2)), size };
    },

    // A 144 x 144 face: the head scaled 6 times on a soft rounded card (LpcExport.face's look).
    face(sheet, options = {}) {
        const S = this.faceSize, box = sheet ? this.headBox(sheet) : null;
        const out = this.blank(S, S);
        if (!box) return out;
        const scale = 6, size = box.size * scale, ox = Math.floor((S - size) / 2), oy = S - size - 4;
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
        const row = DocsDoodads.MemaoCompose.directions.indexOf('down') * this.frame;
        for (let y = 0; y < box.size; y++) for (let x = 0; x < box.size; x++) {
            const i = ((row + box.y + y) * sheet.width + box.x + x) * 4;
            const a = sheet.data[i + 3];
            if (!a) continue;
            for (let sy = 0; sy < scale; sy++) for (let sx = 0; sx < scale; sx++) {
                const px = ox + x * scale + sx, py = oy + y * scale + sy;
                if (px < 0 || py < 0 || px >= S || py >= S) continue;
                const o = (py * S + px) * 4, k = a / 255, d = out.data[o + 3] / 255, oa = k + d * (1 - k);
                for (let c = 0; c < 3; c++) out.data[o + c] = Math.round((sheet.data[i + c] * k + out.data[o + c] * d * (1 - k)) / oa);
                out.data[o + 3] = Math.round(oa * 255);
            }
        }
        return out;
    },

    faceSheet(existing, face, slot = 0) {
        return DocsDoodads.LpcExport.faceSheet(existing, face, slot);
    }
};
