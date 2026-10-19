//==========================================================
// SECTION 6E: EXPLORED MAP (THE MINIMAP'S FOG OF WAR)
//==========================================================
// With fog of war on (World > Minimap), the minimap shows only the tiles the player has been near. What
// was seen is kept per map in the save: $gameSystem._docsExplored[mapId] = { w, h, bits } (one bit per
// tile, base64). While playing, the bits live decoded here and are written back before a save.
DocsDoodads.Explored = {
    _sys: null,
    _maps: {}, // mapId -> { w, h, bytes: Uint8Array, dirty }

    system() {
        const sys = typeof $gameSystem !== 'undefined' ? $gameSystem : null;
        if (sys !== this._sys) { this._sys = sys; this._maps = {}; }
        return sys;
    },

    encode(bytes) {
        let text = '';
        for (let i = 0; i < bytes.length; i += 0x8000) text += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
        return typeof btoa === 'function' ? btoa(text) : Buffer.from(text, 'binary').toString('base64');
    },

    decode(text, length) {
        const out = new Uint8Array(length);
        try {
            const raw = typeof atob === 'function' ? atob(String(text || '')) : Buffer.from(String(text || ''), 'base64').toString('binary');
            for (let i = 0; i < Math.min(length, raw.length); i++) out[i] = raw.charCodeAt(i);
        } catch (e) {}
        return out;
    },

    // The map's bits (a new map, or one whose size changed, starts unexplored).
    entry(mapId, w, h) {
        const sys = this.system();
        const id = Number(mapId) || 0;
        const length = Math.ceil((w * h) / 8);
        let m = this._maps[id];
        if (m && m.w === w && m.h === h) return m;
        const saved = sys && sys._docsExplored && sys._docsExplored[id];
        const bytes = saved && saved.w === w && saved.h === h ? this.decode(saved.bits, length) : new Uint8Array(length);
        m = this._maps[id] = { w, h, bytes, dirty: false, version: 0 };
        return m;
    },

    isExplored(m, x, y) {
        if (!m || x < 0 || y < 0 || x >= m.w || y >= m.h) return false;
        const i = y * m.w + x;
        return (m.bytes[i >> 3] & (1 << (i & 7))) !== 0;
    },

    mark(m, x, y) {
        const i = y * m.w + x;
        const bit = 1 << (i & 7);
        if (m.bytes[i >> 3] & bit) return false;
        m.bytes[i >> 3] |= bit;
        return true;
    },

    // Reveals a circle of tiles; returns the tiles newly seen ([{ x, y }]).
    reveal(mapId, w, h, cx, cy, radius) {
        const m = this.entry(mapId, w, h);
        const r = Math.max(0, Number(radius) || 0);
        const out = [];
        for (let y = Math.max(0, Math.floor(cy - r)); y <= Math.min(h - 1, Math.ceil(cy + r)); y++) {
            for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(w - 1, Math.ceil(cx + r)); x++) {
                if ((x - cx) * (x - cx) + (y - cy) * (y - cy) > r * r + 0.25) continue;
                if (this.mark(m, x, y)) out.push({ x, y });
            }
        }
        if (out.length) { m.dirty = true; m.version++; }
        return out;
    },

    revealAll(mapId, w, h) {
        const m = this.entry(mapId, w, h);
        m.bytes.fill(255);
        m.dirty = true;
        m.version++;
        return m;
    },

    forget(mapId, w, h) {
        const m = this.entry(mapId, w, h);
        m.bytes.fill(0);
        m.dirty = true;
        m.version++;
        return m;
    },

    // How much of a map has been seen, 0-1.
    fraction(mapId, w, h) {
        const m = this.entry(mapId, w, h);
        let n = 0;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (this.isExplored(m, x, y)) n++;
        return w * h ? n / (w * h) : 0;
    },

    // Into the save: every map changed since the last save.
    writeBack() {
        const sys = this.system();
        if (!sys) return 0;
        let n = 0;
        for (const id of Object.keys(this._maps)) {
            const m = this._maps[id];
            if (!m.dirty) continue;
            sys._docsExplored = sys._docsExplored || {};
            sys._docsExplored[id] = { w: m.w, h: m.h, bits: this.encode(m.bytes) };
            m.dirty = false;
            n++;
        }
        return n;
    }
};

if (typeof Game_System !== 'undefined' && Game_System.prototype.onBeforeSave) {
    $.Game_System_onBeforeSave_explored = Game_System.prototype.onBeforeSave;
    Game_System.prototype.onBeforeSave = function() {
        if (this === DocsDoodads.Explored._sys) DocsDoodads.Explored.writeBack();
        $.Game_System_onBeforeSave_explored.call(this);
    };
}
