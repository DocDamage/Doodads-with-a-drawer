//==========================================================
// SECTION 7b: PUBLIC API
//==========================================================
// DocsDoodads.api: one documented way for other plugins and scripts to find, place, move and change
// doodads, their states and lights, and the clock, season and ambient light. Everything here works on
// the map the player is on unless a mapId is given.
//
// Doodads placed, moved or removed through the API change the game's copy of the map, not the project:
// they last until the game is closed or reloaded and are never written to the project's files or saves.
// States and lights set here are kept in the save file (as the plugin commands do).
DocsDoodads.api = {
    version: 1,

    _listeners: {},

    // ---- Events: 'touch' ({ doodad, mapId, x, y }: the tile its base is on), 'state' ({ name, state, mapId }), 'light' ({ name, on, mapId }) ----
    on(event, fn) {
        if (typeof fn !== 'function') return () => {};
        (this._listeners[event] = this._listeners[event] || []).push(fn);
        return () => this.off(event, fn);
    },

    off(event, fn) {
        const list = this._listeners[event];
        if (list) this._listeners[event] = list.filter(f => f !== fn);
    },

    emit(event, detail) {
        for (const fn of (this._listeners[event] || []).slice()) {
            try {
                fn(detail);
            } catch (error) {
                console.warn(`[DocsDoodads] a "${event}" listener failed:`, error);
            }
        }
    },

    // ---- Finding doodads ----
    mapId(mapId) {
        return DocsDoodads.WorldState.mapId(mapId);
    },

    tileSize() {
        const ok = typeof $gameMap !== 'undefined' && $gameMap && $gameMap.tileWidth;
        return { w: ok ? $gameMap.tileWidth() : 48, h: ok ? $gameMap.tileHeight() : 48 };
    },

    // The doodads on a map (the live list; change them through the calls below so the map keeps up).
    doodads(mapId) {
        return (DocsDoodads.doodads(this.mapId(mapId)) || []).filter(Boolean);
    },

    // query: a Name (any case), a doodad, or { name, uid, art, near: { x, y, radius } (tiles), mapId, where(d) }.
    find(query, mapId) {
        if (query && typeof query === 'object' && query.bit) return [query];
        const q = typeof query === 'string' ? { name: query } : Object.assign({}, query);
        const list = this.doodads(q.mapId !== undefined ? q.mapId : mapId);
        const ts = this.tileSize();
        const name = q.name !== undefined ? String(q.name).trim().toLowerCase() : null;
        const art = q.art ? String(q.art).toLowerCase() : null;
        return list.filter(d => {
            if (name !== null && String(d.name || '').trim().toLowerCase() !== name) return false;
            if (q.uid && d.uid !== q.uid) return false;
            if (art && !(d.bit && d.bit[0] === 3 && String(d.bit[1]).toLowerCase().includes(art))) return false;
            // The tile its base stands on, within radius tiles (0: that tile).
            if (q.near) {
                const tx = Math.floor(d.x / ts.w), ty = Math.floor((d.y - 1) / ts.h);
                if (Math.hypot(tx - Number(q.near.x), ty - Number(q.near.y)) > (Number(q.near.radius) || 0) + 1e-9) return false;
            }
            if (typeof q.where === 'function' && !q.where(d)) return false;
            return true;
        });
    },

    get(query, mapId) {
        return this.find(query, mapId)[0] || null;
    },

    // Where a doodad stands, in tiles ({ x, y }: the tile its base is on).
    tileOf(query) {
        const d = this.get(query);
        if (!d) return null;
        const ts = this.tileSize();
        return { x: Math.floor(d.x / ts.w), y: Math.floor((d.y - 1) / ts.h) };
    },

    // ---- Changing the map's doodads (for this run of the game only) ----
    spriteset() {
        const scene = typeof SceneManager !== 'undefined' && SceneManager ? SceneManager._scene : null;
        return scene && scene._spriteset && scene._spriteset.addDocsDoodads ? scene._spriteset : null;
    },

    // Rebuilds the doodad sprites (after changing art or many fields at once).
    refresh() {
        const ss = this.spriteset();
        if (ss) ss.addDocsDoodads();
    },

    // spec: { art: 'img/doodads/Rock.png', x, y, tiles: true (x and y are tiles; false = pixels), name,
    //         and any doodad field (light, states, touch, collision, scaleX...) }. Returns the doodad.
    place(spec) {
        spec = Object.assign({ tiles: true }, spec);
        const art = String(spec.art || spec.path || '');
        if (!art) return null;
        const mapId = this.mapId(spec.mapId);
        const ts = this.tileSize();
        const d = DocsDoodads.standardStruct();
        const fields = Object.assign({}, spec);
        for (const k of ['art', 'path', 'tiles', 'mapId', 'x', 'y']) delete fields[k];
        Object.assign(d, fields);
        d.bit = [3, art];
        d.x = spec.tiles ? (Number(spec.x) || 0) * ts.w + ts.w / 2 : Number(spec.x) || 0;
        d.y = spec.tiles ? (Number(spec.y) || 0) * ts.h + ts.h : Number(spec.y) || 0;
        d.temp = true;
        if (!d.uid) d.uid = 'dd_api_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        this.sizeFor(d, art, spec.frameW, spec.frameH);
        const data = window.$dataDocsDoodads = window.$dataDocsDoodads || {};
        data[mapId] = data[mapId] || [];
        data[mapId].push(d);
        const ss = this.spriteset();
        if (ss && mapId === this.mapId() && ss.addDocsDoodadSprites) ss.addDocsDoodadSprites([d]);
        return d;
    },

    // A doodad's frame size: as given, then from the library, then (for either one still missing) from
    // the picture once it loads.
    sizeFor(d, art, frameW, frameH) {
        const assets = DocsDoodads.AssetIndex && DocsDoodads.AssetIndex.data && DocsDoodads.AssetIndex.data.assets;
        const asset = assets ? assets[String(art).toLowerCase()] : null;
        d.frameW = Number(frameW) || (asset && Number(asset.frameW || asset.width)) || 0;
        d.frameH = Number(frameH) || (asset && Number(asset.frameH || asset.height)) || 0;
        if ((d.frameW && d.frameH) || typeof DocsDoodads.loadBitmap !== 'function') return;
        const bmp = DocsDoodads.loadBitmap(art);
        if (!bmp || !bmp.addLoadListener) return;
        bmp.addLoadListener(b => {
            if (!d.bit || d.bit[1] !== art) return;
            if (!d.frameW) d.frameW = b.width;
            if (!d.frameH) d.frameH = b.height;
        });
    },

    // Moves doodads to (x, y): tiles unless opts.tiles is false; opts.relative moves them by that much.
    move(query, x, y, opts = {}) {
        const list = this.find(query);
        const ts = this.tileSize();
        const tiles = opts.tiles !== false;
        for (const d of list) {
            const px = tiles ? Number(x) * ts.w : Number(x), py = tiles ? Number(y) * ts.h : Number(y);
            if (opts.relative) {
                d.x += px;
                d.y += py;
            } else {
                d.x = tiles ? px + ts.w / 2 : px;
                d.y = tiles ? py + ts.h : py;
            }
        }
        // Collision keeps bodies by tile for a frame; the next step sees where they went.
        if (list.length && DocsDoodads.Collision.invalidate) DocsDoodads.Collision.invalidate();
        return list.length;
    },

    // Changes fields on doodads ({ opacity: 0.5, light: {...} }); a new picture redraws them, at its own
    // size unless frameW and frameH come with it.
    set(query, props) {
        const list = this.find(query);
        if (!props || list.length === 0) return 0;
        for (const d of list) {
            const next = Object.assign({}, props);
            if (next.art) {
                const art = String(next.art);
                d.bit = [3, art];
                if (next.frameX === undefined) d.frameX = 0;
                if (next.frameY === undefined) d.frameY = 0;
                this.sizeFor(d, art, next.frameW, next.frameH);
                delete next.art;
                delete next.frameW;
                delete next.frameH;
            }
            Object.assign(d, next);
        }
        if (DocsDoodads.Collision.invalidate) DocsDoodads.Collision.invalidate();
        this.refresh();
        return list.length;
    },

    remove(query, mapId) {
        const m = this.mapId(query && typeof query === 'object' && query.mapId !== undefined ? query.mapId : mapId);
        const list = this.find(query, m);
        if (list.length === 0) return 0;
        const data = window.$dataDocsDoodads || {};
        if (Array.isArray(data[m])) data[m] = data[m].filter(d => !list.includes(d));
        if (m === this.mapId()) this.refresh();
        return list.length;
    },

    // ---- States and lights (kept in the save file) ----
    state(name, mapId) {
        return DocsDoodads.WorldState.state(name, mapId);
    },

    setState(name, state, mapId) {
        return DocsDoodads.WorldState.setState(name, state, mapId);
    },

    stateNames(query) {
        const d = this.get(query);
        return d ? DocsDoodads.States.list(d).map(s => String(s.name || '')) : [];
    },

    light(name, mapId) {
        return DocsDoodads.WorldState.light(name, mapId);
    },

    setLight(name, on, mapId) {
        return DocsDoodads.WorldState.setLight(name, on, mapId);
    },

    // ---- Clock, season and ambient light ----
    // The time of day in minutes (0-1439), or null when the clock is off.
    time() {
        const m = DocsDoodads.Atmosphere.minutes();
        return m === null || m === undefined ? null : m;
    },

    // day (optional) sets the clock's day too; without it the day stays as it is.
    setTime(hour, minute = 0, day = null) {
        DocsDoodads.setTimeOfDay((Number(hour) || 0) * 60 + (Number(minute) || 0), day);
    },

    addTime(hours, minutes = 0) {
        DocsDoodads.addTimeOfDay((Number(hours) || 0) * 60 + (Number(minutes) || 0));
    },

    season() {
        return DocsDoodads.Atmosphere.season();
    },

    seasonName() {
        const names = DocsDoodads.World.settings().seasons.names || [];
        return names[this.season()] || '';
    },

    setSeason(season) {
        let n = Number(season);
        if (typeof season === 'string' && !/^\d+$/.test(season.trim())) {
            n = (DocsDoodads.World.settings().seasons.names || []).findIndex(s => String(s).toLowerCase() === season.trim().toLowerCase());
        }
        if (n >= 0) DocsDoodads.setSeason(n);
        return n >= 0;
    },

    // darkness 0-1, color '#rrggbb', over frames; ambient(null) goes back to the map's own.
    ambient(darkness, color, frames = 60) {
        if (darkness === null || darkness === undefined) {
            const switchValue = id => (typeof $gameSwitches !== 'undefined' && $gameSwitches ? $gameSwitches.value(id) : false);
            return DocsDoodads.setAmbient(DocsDoodads.currentAmbient(switchValue), Number(frames) || 0, true);
        }
        return DocsDoodads.setAmbient({ darkness: Math.max(0, Math.min(1, Number(darkness) || 0)), color: color || DocsDoodads.Lighting.ambientDefaults.color }, Number(frames) || 0);
    }
};
