//==========================================================
// SECTION 5E: ELEMENTS THAT SPREAD (8.4.3)
//==========================================================
// One map's setting `elements: { enabled, fuelRegions, fuelTags, fireproofRegions, seed }`. A slow cellular step
// (four times a second, never per frame) over a grid of tiles with fuel, wet and burning: fire moves to
// neighbours with fuel, more often downwind; rain wets everything, which stops fire; wet drains downhill by the 3D
// height and dries. Only marked ground burns (fuel regions and tags) and doodads marked Burns (their tile is fuel;
// when it burns out they go to their state named Burnt, kept by the save's states). Lights fires: a campfire that
// can light dry fuel beside it. Puts out: a well, a fountain. Fireproof regions never burn. Seeded. Off by default.
DocsDoodads.Elements = {
    every: 15,
    burnSteps: 24,

    settings(mapSettings) {
        const s = Object.assign({ enabled: false, fuelRegions: '', fuelTags: '', fireproofRegions: '', seed: 1 }, (mapSettings && mapSettings.elements) || {});
        s.enabled = Boolean(s.enabled);
        return s;
    },

    ids(text) { return new Set(String(text || '').split(/[\s,;]+/).map(n => parseInt(n, 10)).filter(n => n > 0)); },

    // fuelAt(x, y) → 0-100; proofAt(x, y) → never burns.
    make(w, h, fuelAt, proofAt) {
        const n = w * h, g = { w, h, fuel: new Uint8Array(n), wet: new Uint8Array(n), burn: new Uint8Array(n), burnt: new Uint8Array(n), proof: new Uint8Array(n), puddle: new Uint8Array(n), steps: 0 };
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
            const i = y * w + x;
            g.fuel[i] = Math.max(0, Math.min(100, Math.round(Number(fuelAt(x, y)) || 0)));
            g.proof[i] = proofAt && proofAt(x, y) ? 1 : 0;
        }
        return g;
    },

    ignite(g, x, y) {
        if (x < 0 || y < 0 || x >= g.w || y >= g.h) return false;
        const i = y * g.w + x;
        if (!g.fuel[i] || g.proof[i] || g.burn[i] || g.wet[i] >= 50) return false;
        g.burn[i] = this.burnSteps;
        return true;
    },

    burning(g) { let n = 0; for (let i = 0; i < g.burn.length; i++) if (g.burn[i]) n++; return n; },

    putOut(g) { let n = 0; for (let i = 0; i < g.burn.length; i++) if (g.burn[i]) { g.burn[i] = 0; n++; } return n; },

    // One step. ctx: { wind: { x, y } (-1..1), rain (0..1), height(x, y), rng, sources: [{ x, y }], wells: [{ x, y }] }.
    // Returns { lit: [i], out: [i] } (out: burned out this step, their fuel spent).
    step(g, ctx) {
        const w = g.w, h = g.h, rng = ctx.rng, wind = ctx.wind || { x: 0, y: 0 }, rain = Math.max(0, Math.min(1, Number(ctx.rain) || 0));
        const lit = [], out = [];
        g.steps++;
        for (const s of ctx.wells || []) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            const x = s.x + dx, y = s.y + dy;
            if (x >= 0 && y >= 0 && x < w && y < h) { g.wet[y * w + x] = 100; g.burn[y * w + x] = 0; }
        }
        // Rain wets everything; it dries slowly otherwise (a point a second).
        for (let i = 0; i < g.wet.length; i++) {
            if (rain > 0) g.wet[i] = Math.min(100, g.wet[i] + Math.ceil(rain * 6));
            else if (g.wet[i] && g.steps % 4 === 0) g.wet[i] = Math.max(0, g.wet[i] - 1);
            if (g.burn[i] && g.wet[i] >= 50) g.burn[i] = 0;
        }
        // Wet runs downhill: a share to the lowest lower neighbour.
        if (ctx.height) {
            const moved = new Int16Array(g.wet.length);
            for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
                const i = y * w + x;
                if (g.wet[i] < 10) continue;
                const here = ctx.height(x, y);
                let best = -1, low = here;
                for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                    const nx = x + dx, ny = y + dy;
                    if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
                    const v = ctx.height(nx, ny);
                    if (v < low) { low = v; best = ny * w + nx; }
                }
                if (best >= 0) { const share = Math.ceil(g.wet[i] / 3); moved[i] -= share; moved[best] += share; }
            }
            for (let i = 0; i < g.wet.length; i++) g.wet[i] = Math.max(0, Math.min(100, g.wet[i] + moved[i]));
        }
        // Puddles where it stays wet.
        for (let i = 0; i < g.wet.length; i++) g.puddle[i] = g.wet[i] >= 70 ? Math.min(255, g.puddle[i] + 1) : Math.max(0, g.puddle[i] - 1);
        // Fire: burn down, and spread (downwind more often).
        const next = [];
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
            const i = y * w + x;
            if (!g.burn[i]) continue;
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
                const nx = x + dx, ny = y + dy;
                if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
                const len = Math.hypot(dx, dy), along = (dx * wind.x + dy * wind.y) / len;
                const chance = 0.06 * (1 + Math.max(-0.9, along * 3)) / len;
                if (rng() < chance) next.push([nx, ny]);
            }
            g.burn[i]--;
            g.fuel[i] = Math.max(0, g.fuel[i] - Math.ceil(100 / this.burnSteps));
            if (!g.burn[i] || !g.fuel[i]) { g.burn[i] = 0; g.fuel[i] = 0; g.burnt[i] = 1; out.push(i); }
        }
        for (const s of ctx.sources || []) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (rng() < 0.01) next.push([s.x + dx, s.y + dy]);
        for (const [x, y] of next) if (this.ignite(g, x, y)) lit.push(y * w + x);
        return { lit, out };
    },

    // The game's grid for the map on screen; made when the map is first stepped.
    _grid: null,
    current() { return this._grid && typeof $gameMap !== 'undefined' && $gameMap && this._grid.mapId === $gameMap.mapId() ? this._grid : null; },

    build(mapId) {
        const ms = DocsDoodads.Lighting.mapSettings(mapId), s = this.settings(ms);
        const fuelR = this.ids(s.fuelRegions), fuelT = this.ids(s.fuelTags), proof = this.ids(s.fireproofRegions);
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const burners = new Map(), sources = [], wells = [];
        for (const d of DocsDoodads.doodads(mapId) || []) {
            if (!d || !d.element) continue;
            const x = Math.floor((Number(d.x) || 0) / tw), y = Math.floor(((Number(d.y) || 0) - 1) / th);
            if (d.element === 'burns') (burners.get(y * $gameMap.width() + x) || burners.set(y * $gameMap.width() + x, []).get(y * $gameMap.width() + x)).push(d);
            else if (d.element === 'lights') sources.push({ x, y });
            else if (d.element === 'putsOut') wells.push({ x, y });
        }
        const g = this.make($gameMap.width(), $gameMap.height(),
            (x, y) => (fuelR.has($gameMap.regionId(x, y)) || fuelT.has($gameMap.terrainTag(x, y)) || burners.has(y * $gameMap.width() + x) ? 100 : 0),
            (x, y) => proof.has($gameMap.regionId(x, y)));
        // Doodads already burnt (a save) leave no fuel.
        for (const [i, list] of burners) if (list.every(d => /burnt/i.test(DocsDoodads.WorldState.state(d, mapId)))) { g.fuel[i] = 0; g.burnt[i] = 1; }
        Object.assign(g, { mapId, burners, sources, wells, rng: DocsDoodads.Scatter.rng((Number(s.seed) || 1) * 7919 + mapId) });
        this._grid = g;
        return g;
    },

    startAt(x, y) {
        const g = this.current() || (typeof $gameMap !== 'undefined' && $gameMap && this.settings(DocsDoodads.Lighting.mapSettings($gameMap.mapId())).enabled ? this.build($gameMap.mapId()) : null);
        return g ? this.ignite(g, Math.floor(Number(x) || 0), Math.floor(Number(y) || 0)) : false;
    }
};

if (typeof PluginManager !== 'undefined' && typeof PluginManager.registerCommand === 'function') {
    PluginManager.registerCommand(pluginName, 'startFireAt', args => DocsDoodads.Elements.startAt(args.x, args.y));
    PluginManager.registerCommand(pluginName, 'putOutFires', () => { const g = DocsDoodads.Elements.current(); if (g) DocsDoodads.Elements.putOut(g); });
}
