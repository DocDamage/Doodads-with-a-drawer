//==========================================================
// SECTION 5K: BAKING FOR PHONES (7.3.4)
//==========================================================
// Map → Bake This Map draws a map's still doodads into a few big pictures (chunks of 1024 × 1024 map pixels, one
// set below the characters and one above), img/doodads/_baked/Map###_<band>_<cx>_<cy>.png, and keeps a manifest in
// $dataDocsDoodads.baked[mapId] = { hash, size, chunks: [{ band, cx, cy, file }], uids }. The game draws the chunks
// instead of those doodads' sprites while the manifest is current: `hash` is of the map's whole doodad list, so any
// change there (in the editor) makes the bake stale and the game draws the real doodads until it is baked again.
// Collision, touch, sound and lights still read the doodad data. A playtest shows the real doodads unless
// World → bake → playtest is on. The 3D view never uses chunks.
DocsDoodads.Bake = {
    size: 1024,
    dir: 'img/doodads/_baked',

    // Why a doodad can't be baked, or '' when it is still. Anything that moves, changes, gives light, sorts with
    // characters, or is drawn with a filter or blend stays a sprite.
    whyNot(d) {
        if (!d || !d.bit || d.bit[0] !== 3) return 'no picture';
        if (d.temp || d.decor) return 'placed in the game';
        const depth = DocsDoodads.Depth.resolve(d);
        if (depth === 'sorted') return 'sorted with characters';
        const on = v => v && (v.enabled === undefined || v.enabled);
        if (d.motion && d.motion.type && d.motion.type !== 'none') return 'moves';
        if (Number(d.rotateSpeed)) return 'spins';
        if ((Number(d.xFrame) || 1) * (Number(d.yFrame) || 1) > 1 && Number(d.frameUpdate) > 0) return 'animated';
        if (d.anim) return 'animated';
        if (d.states && Array.isArray(d.states.list) && d.states.list.length > 1) return 'has states';
        if (String(d.condition || '').trim() || (Array.isArray(d.switch) && d.switch.length)) return 'shows by a switch or condition';
        if (d.touch) return 'touchable';
        if (on(d.light)) return 'gives light';
        if (on(d.shadow)) return 'casts a shadow';
        if (d.particles || d.vfx || d.sound || d.react || d.seeThrough || d.seasons || d.transition) return 'has an effect';
        if (d.line || d.ride || d.travel || d.creatures || (Array.isArray(d.eras) && d.eras.length) || d.grow || d.element) return 'changes in play';
        if (Number(d.blend) || Number(d.blur) || Number(d.contrast) || d.sepia || Number(d.hue) || d.bright || Number(d.grey) || Number(d.r) || Number(d.g) || Number(d.b)) return 'drawn with a filter';
        if (d.model) return 'a 3D model';
        return '';
    },

    isStill(d) { return !this.whyNot(d); },

    // A doodad's box in map pixels (its picture, scaled; turned doodads take the box round their turn).
    box(d) {
        const w = Math.abs((Number(d.frameW) || 48) * (d.scaleX !== undefined ? d.scaleX : 1)), h = Math.abs((Number(d.frameH) || 48) * (d.scaleY !== undefined ? d.scaleY : 1));
        const ax = d.anchorX !== undefined ? d.anchorX : 0.5, ay = d.anchorY !== undefined ? d.anchorY : 1;
        const r = Math.max(w, h);
        if (Number(d.rotation)) return { x: d.x - r, y: d.y - r, w: r * 2, h: r * 2 };
        return { x: d.x - w * ax, y: d.y - h * ay, w, h };
    },

    // Still doodads into chunks by band: [{ band, cx, cy, items }] (a doodad goes in every chunk it touches, in its
    // map's drawing order).
    chunks(doodads, mapW, mapH, size = this.size) {
        const out = new Map();
        (doodads || []).forEach((d, order) => {
            if (!this.isStill(d)) return;
            const band = DocsDoodads.Depth.resolve(d) === 'above' ? 'above' : 'below';
            const b = this.box(d);
            const x0 = Math.max(0, Math.floor(b.x / size)), y0 = Math.max(0, Math.floor(b.y / size));
            const x1 = Math.min(Math.ceil(mapW / size) - 1, Math.floor((b.x + b.w) / size)), y1 = Math.min(Math.ceil(mapH / size) - 1, Math.floor((b.y + b.h) / size));
            for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
                const key = band + '_' + cx + '_' + cy;
                if (!out.has(key)) out.set(key, { band, cx, cy, items: [] });
                out.get(key).items.push({ d, order, z: DocsDoodads.Depth.spriteZ(d) });
            }
        });
        const list = Array.from(out.values());
        for (const c of list) c.items.sort((a, b) => a.z - b.z || a.order - b.order);
        return list.sort((a, b) => (a.band < b.band ? -1 : a.band > b.band ? 1 : a.cy - b.cy || a.cx - b.cx));
    },

    file(mapId, band, cx, cy) { return `${this.dir}/Map${String(mapId).padStart(3, '0')}_${band}_${cx}_${cy}.png`; },

    // The map's doodads in a fixed order of keys, without those placed in the game.
    stable(value) {
        if (Array.isArray(value)) return value.filter(v => !(v && v.temp)).map(v => this.stable(v));
        if (!value || typeof value !== 'object') return value;
        const out = {};
        for (const k of Object.keys(value).sort()) if (value[k] !== undefined) out[k] = this.stable(value[k]);
        return out;
    },

    // FNV-1a over the stable text (scripts/deploy.js --bake makes the same number).
    hash(list) {
        const text = JSON.stringify(this.stable(list || []));
        let h = 2166136261;
        for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
        return (h >>> 0).toString(16);
    },

    manifest(mapId, chunks, list) {
        const uids = [];
        for (const c of chunks) for (const it of c.items) if (it.d.uid && !uids.includes(it.d.uid)) uids.push(it.d.uid);
        return { hash: this.hash(list), size: this.size, chunks: chunks.map(c => ({ band: c.band, cx: c.cx, cy: c.cy, file: this.file(mapId, c.band, c.cx, c.cy) })), uids };
    },

    stale(manifest, list) {
        return !manifest || manifest.hash !== this.hash(list);
    },

    // The current map's manifest when the game should use it, else null.
    active(mapId) {
        const data = typeof window !== 'undefined' && window.$dataDocsDoodads;
        const m = data && data.baked && data.baked[mapId];
        if (!m || !Array.isArray(m.chunks) || !m.chunks.length) return null;
        if (DocsDoodads.Workspace && DocsDoodads.Workspace.mounted) return null;
        const C = DocsDoodads.Compat;
        if (C && C.isTest && C.isTest() && !((DocsDoodads.World.settings().bake || {}).playtest)) return null;
        const list = DocsDoodads.doodads(mapId) || [];
        const c = this._check;
        if (c && c.mapId === mapId && c.manifest === m && c.list === list && c.length === list.length) return c.ok ? m : null;
        const ok = !this.stale(m, list);
        this._check = { mapId, manifest: m, list, length: list.length, ok };
        return ok ? m : null;
    }
};

