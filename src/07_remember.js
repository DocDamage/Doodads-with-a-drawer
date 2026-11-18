//==========================================================
// SECTION 5R: A WORLD THAT REMEMBERS (8.4.2)
//==========================================================
// Growth: a doodad with states and `grow: { days: [3, 4, 5] }` steps to its next state when its state has lasted
// that many calendar days, and stops at the last (farming). Only the day each state began is kept, with the
// states in the save (WorldState). Doodads on other maps catch up when their map is next shown.
// Wear: one map's setting `remember: { wear, trails, trailRegions, trailTags, color }`. With wear on, each step
// counts on its tile; counts ease down each new day; where they are high the ground shows a worn path. Kept in the
// save as a short run-length string per map. Trails: footprints on marked ground (and anywhere while it snows)
// that fade as snow and wind fill them; not saved. Off unless a map turns them on.
DocsDoodads.Growth = {
    normalize(g) {
        const days = (g && Array.isArray(g.days) ? g.days : String((g && g.days) || '').split(/[\s,;]+/))
            .map(n => Math.floor(Number(n))).filter(n => n > 0).slice(0, 32);
        return days.length ? { days } : null;
    },

    // From the state it is in and the day that state began: { state, began } for `today`. Stops at the last state.
    advance(state, began, days, today, last) {
        let s = Math.max(0, Math.floor(Number(state) || 0)), b = Number(began);
        if (!Number.isFinite(b) || b <= 0) b = today;
        while (s < last && s < days.length && today - b >= days[s]) { b += days[s]; s++; }
        return { state: s, began: b };
    },

    store(write = true) {
        const ws = DocsDoodads.WorldState.store(write);
        if (write) ws.grown = ws.grown || {};
        return ws.grown || {};
    },

    // Steps every growing doodad on a map to today.
    update(mapId, today) {
        if (!(today > 0)) return 0;
        const W = DocsDoodads.WorldState, S = DocsDoodads.States;
        let changed = 0;
        for (const d of DocsDoodads.doodads(mapId) || []) {
            const g = d && this.normalize(d.grow);
            if (!g || !S.has(d)) continue;
            const id = W.idOf(d);
            if (!id) continue;
            const key = W.key(mapId, id), grown = this.store(true);
            const current = Math.max(0, S.index(d, mapId));
            const next = this.advance(current, grown[key], g.days, today, S.list(d).length - 1);
            grown[key] = next.began;
            if (next.state !== current) { W.setState(d, next.state, mapId); changed++; }
        }
        return changed;
    }
};

DocsDoodads.Wear = {
    max: 255,
    defaults: { wear: false, trails: false, trailRegions: '', trailTags: '', color: '#7a5c3c', threshold: 12, fade: 20 },

    settings(mapSettings) {
        const s = Object.assign({}, this.defaults, (mapSettings && mapSettings.remember) || {});
        s.wear = Boolean(s.wear); s.trails = Boolean(s.trails);
        s.threshold = Math.max(1, Math.min(200, Number(s.threshold) || this.defaults.threshold));
        s.fade = Math.max(1, Math.min(600, Number(s.fade) || this.defaults.fade));
        return s;
    },

    step(grid, w, x, y) {
        const i = y * w + x;
        if (i < 0 || i >= grid.length) return;
        if (grid[i] < this.max) grid[i]++;
    },

    // A new day: every count eases down by a fifth (at least one).
    ease(grid, days = 1) {
        for (let n = 0; n < days; n++) for (let i = 0; i < grid.length; i++) if (grid[i]) grid[i] = Math.max(0, grid[i] - Math.max(1, Math.ceil(grid[i] / 5)));
        return grid;
    },

    // How worn a tile looks: 0 to 1.
    alpha(count, threshold) {
        return Math.max(0, Math.min(1, (Number(count) || 0) / (threshold * 2)));
    },

    // Run-length text: "count*run,count*run" (a run of 1 is just the count).
    encode(grid) {
        const out = [];
        for (let i = 0; i < grid.length;) {
            let j = i;
            while (j < grid.length && grid[j] === grid[i]) j++;
            out.push(j - i > 1 ? grid[i] + '*' + (j - i) : String(grid[i]));
            i = j;
        }
        return out.join(',');
    },

    decode(text, length) {
        const grid = new Uint8Array(length);
        let at = 0;
        for (const part of String(text || '').split(',')) {
            if (!part) continue;
            const [v, n] = part.split('*');
            const value = Math.max(0, Math.min(this.max, Math.floor(Number(v)) || 0)), run = n === undefined ? 1 : Math.max(0, Math.floor(Number(n)) || 0);
            for (let k = 0; k < run && at < length; k++) grid[at++] = value;
        }
        return grid;
    },

    store(write = true) {
        if (typeof $gameSystem === 'undefined' || !$gameSystem) return {};
        if (!write && !$gameSystem._docsWear) return {};
        return ($gameSystem._docsWear = $gameSystem._docsWear || {});
    },

    // A map's grid (made from the save when its map is shown), kept in memory until the save is written.
    _grids: {},
    grid(mapId, w, h) {
        const g = this._grids[mapId];
        if (g && g.w === w && g.h === h) return g;
        const saved = this.store(false)[mapId];
        // A map that changed size since starts its wear again.
        const text = saved && saved.w === w && saved.h === h ? saved.data : '';
        return (this._grids[mapId] = { w, h, data: this.decode(text, w * h), day: saved ? saved.day || 0 : 0, version: 0 });
    },

    save() {
        const store = this.store(true);
        for (const [mapId, g] of Object.entries(this._grids)) {
            if (g.data.some(v => v)) store[mapId] = { w: g.w, h: g.h, day: g.day, data: this.encode(g.data) };
            else delete store[mapId];
        }
        if (!Object.keys(store).length && typeof $gameSystem !== 'undefined' && $gameSystem) delete $gameSystem._docsWear;
    },

    // Whether a tile takes footprints: a marked region or terrain tag.
    trailAt(settings, regionId, tag, snowing) {
        if (!settings.trails) return false;
        if (snowing) return true;
        const has = (text, n) => String(text || '').split(/[\s,;]+/).map(v => parseInt(v, 10)).includes(Number(n));
        return (regionId > 0 && has(settings.trailRegions, regionId)) || (tag > 0 && has(settings.trailTags, tag));
    }
};

// Wear is written into the save as it is made; the in-memory grids start again with each new game or load.
if (typeof DataManager !== 'undefined') {
    const make = DataManager.makeSaveContents;
    if (typeof make === 'function') {
        DataManager.makeSaveContents = function() {
            try { DocsDoodads.Wear.save(); } catch (error) { DocsDoodads.Core.log('Wear could not be saved.', error); }
            return make.apply(this, arguments);
        };
    }
    for (const name of ['extractSaveContents', 'setupNewGame']) {
        const original = DataManager[name];
        if (typeof original !== 'function') continue;
        DataManager[name] = function() {
            DocsDoodads.Wear._grids = {};
            return original.apply(this, arguments);
        };
    }
}

// Each finished step of the player counts on its tile, and may leave a footprint.
if (typeof Game_Player !== 'undefined') {
    // MZ's Game_Player has its own increaseSteps; where it doesn't, the inherited one is looked up each call so
    // later parts' wrappers (footsteps) still run.
    const steps = Object.prototype.hasOwnProperty.call(Game_Player.prototype, 'increaseSteps') ? Game_Player.prototype.increaseSteps : null;
    Game_Player.prototype.increaseSteps = function() {
        const result = steps ? steps.apply(this, arguments) : Game_Character.prototype.increaseSteps.apply(this, arguments);
        if (typeof $gameMap === 'undefined' || !$gameMap || (DocsDoodads.Workspace && DocsDoodads.Workspace.mounted)) return result;
        const ms = DocsDoodads.Lighting.mapSettings($gameMap.mapId());
        if (!ms || !ms.remember) return result;
        const W = DocsDoodads.Wear, s = W.settings(ms);
        if (s.wear) {
            const g = W.grid($gameMap.mapId(), $gameMap.width(), $gameMap.height());
            W.step(g.data, g.w, this.x, this.y);
            g.version++;
        }
        if (s.trails) {
            const snowing = typeof $gameScreen !== 'undefined' && $gameScreen && $gameScreen.weatherType && $gameScreen.weatherType() === 'snow';
            if (W.trailAt(s, $gameMap.regionId(this.x, this.y), $gameMap.terrainTag(this.x, this.y), snowing)) {
                (W._prints = W._prints || []).push({ x: this.x, y: this.y, d: this.direction(), age: 0, life: s.fade * 60, left: ((W._printSide = !W._printSide)) });
                if (W._prints.length > 64) W._prints.shift();
            }
        }
        return result;
    };
}
