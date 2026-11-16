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

    /**
     * Returns the player's Reduce Flashes and Less Camera Motion choices.
     * @returns {{reduceFlashes: boolean, lessCameraMotion: boolean}}
     */
    comfort() { return DocsDoodads.Comfort.choices(); },

    /**
     * The name of the area under the player, or an empty string.
     * @returns {string}
     */
    area() { const area = DocsDoodads.Areas.current(); return area ? String(area.name) : ''; },

    _listeners: {},

    // ---- Events: 'touch' ({ doodad, mapId, x, y }: the tile its base is on), 'state' ({ name, state, mapId }), 'light' ({ name, on, mapId }) ----
    /**
     * Listens for one of the plugin's events. Returns a function that stops listening.
     * @template {keyof DocsDoodadsEvents} K
     * @param {K} event - 'touch', 'state', 'light', 'animationEnd', 'takeOff', 'land' or 'dive'.
     * @param {(detail: DocsDoodadsEvents[K]) => void} fn - Called with the event's detail.
     * @returns {() => void}
     */
    on(event, fn) {
        if (typeof fn !== 'function') return () => {};
        (this._listeners[event] = this._listeners[event] || []).push(fn);
        return () => this.off(event, fn);
    },

    /**
     * Stops a listener added with on().
     * @template {keyof DocsDoodadsEvents} K
     * @param {K} event
     * @param {(detail: DocsDoodadsEvents[K]) => void} fn
     * @returns {void}
     */
    off(event, fn) {
        const list = this._listeners[event];
        if (list) this._listeners[event] = list.filter(f => f !== fn);
    },

    /**
     * Tells every listener of an event (the plugin calls this; a listener that throws is logged and skipped).
     * @internal
     * @template {keyof DocsDoodadsEvents} K
     * @param {K} event
     * @param {DocsDoodadsEvents[K]} detail
     * @returns {void}
     */
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
    /**
     * The map id the API works on: the one given, or the map the player is on.
     * @param {number} [mapId]
     * @returns {number}
     */
    mapId(mapId) {
        return DocsDoodads.WorldState.mapId(mapId);
    },

    /**
     * The map's tile size in pixels (48 by 48 when no map is loaded).
     * @returns {{ w: number, h: number }}
     */
    tileSize() {
        const ok = typeof $gameMap !== 'undefined' && $gameMap && $gameMap.tileWidth;
        return { w: ok ? $gameMap.tileWidth() : 48, h: ok ? $gameMap.tileHeight() : 48 };
    },

    /**
     * The doodads on a map (the live list; change them through the calls below so the map keeps up).
     * @param {number} [mapId]
     * @returns {DocsDoodad[]}
     */
    doodads(mapId) {
        return (DocsDoodads.doodads(this.mapId(mapId)) || []).filter(Boolean);
    },

    /**
     * The doodads that match a query: a name (any case), a doodad, or { name, uid, art, near, mapId, where }.
     * @param {DocsDoodadQuery} query
     * @param {number} [mapId]
     * @returns {DocsDoodad[]}
     */
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

    /**
     * The first doodad that matches a query, or null.
     * @param {DocsDoodadQuery} query
     * @param {number} [mapId]
     * @returns {DocsDoodad | null}
     */
    get(query, mapId) {
        return this.find(query, mapId)[0] || null;
    },

    /**
     * Where a doodad stands, in tiles: the tile its base is on, or null when none matches.
     * @param {DocsDoodadQuery} query
     * @returns {{ x: number, y: number } | null}
     */
    tileOf(query) {
        const d = this.get(query);
        if (!d) return null;
        const ts = this.tileSize();
        return { x: Math.floor(d.x / ts.w), y: Math.floor((d.y - 1) / ts.h) };
    },

    // ---- Changing the map's doodads (for this run of the game only) ----
    /**
     * The map's spriteset when doodads are drawn on it, or null.
     * @internal
     * @returns {object | null}
     */
    spriteset() {
        const scene = typeof SceneManager !== 'undefined' && SceneManager ? SceneManager._scene : null;
        return scene && scene._spriteset && scene._spriteset.addDocsDoodads ? scene._spriteset : null;
    },

    /**
     * Rebuilds the doodad sprites (after changing art or many fields at once).
     * @returns {void}
     */
    refresh() {
        const ss = this.spriteset();
        if (ss) ss.addDocsDoodads();
    },

    /**
     * Places a doodad for this run of the game (never written to the project or the save). Returns the doodad, or null without art.
     * @param {DocsDoodadPlaceSpec} spec - { art, x, y, tiles, name, transition, frames, mapId } and any doodad field.
     * @returns {DocsDoodad | null}
     */
    place(spec) {
        spec = Object.assign({ tiles: true }, spec);
        const appear = spec.transition && spec.transition !== 'none' ? { type: String(spec.transition), frames: Number(spec.frames) > 0 ? Number(spec.frames) : 30 } : null;
        delete spec.transition;
        delete spec.frames;
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
        if (appear) d.transition = appear;
        if (!d.uid) d.uid = 'dd_api_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        this.sizeFor(d, art, spec.frameW, spec.frameH);
        const data = window.$dataDocsDoodads = window.$dataDocsDoodads || {};
        data[mapId] = data[mapId] || [];
        data[mapId].push(d);
        const ss = this.spriteset();
        if (ss && mapId === this.mapId() && ss.addDocsDoodadSprites) {
            ss.addDocsDoodadSprites([d]);
            // It starts hidden and comes in by its transition.
            const sprite = appear ? (ss._docsDoodadSprites || []).find(s => s._data === d) : null;
            if (sprite) sprite._transitionP = 0;
        }
        return d;
    },

    /**
     * Sets a doodad's frame size: as given, then from the library, then from the picture once it loads.
     * @internal
     * @param {DocsDoodad} d
     * @param {string} art
     * @param {number} [frameW]
     * @param {number} [frameH]
     * @returns {void}
     */
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

    /**
     * Moves doodads to (x, y): tiles unless opts.tiles is false; opts.relative moves them by that much. Returns how many moved.
     * @param {DocsDoodadQuery} query
     * @param {number} x
     * @param {number} y
     * @param {{ tiles?: boolean, relative?: boolean }} [opts]
     * @returns {number}
     */
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

    /**
     * Changes fields on doodads ({ opacity: 0.5, light: {...} }); a new art redraws them, at its own size unless frameW and frameH come with it. Returns how many changed.
     * @param {DocsDoodadQuery} query
     * @param {Partial<DocsDoodad> & { art?: string }} props
     * @returns {number}
     */
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

    /**
     * Takes doodads off the map, through a transition if opts has one. Only their sprites go; the rest of the map is not built again. Returns how many.
     * @param {DocsDoodadQuery} query
     * @param {number | DocsDoodadRemoveOptions} [mapId] - A map id, or the options in its place.
     * @param {DocsDoodadRemoveOptions} [opts]
     * @returns {number}
     */
    remove(query, mapId, opts = {}) {
        if (mapId && typeof mapId === 'object') { opts = mapId; mapId = undefined; }
        const m = this.mapId(query && typeof query === 'object' && query.mapId !== undefined ? query.mapId : mapId);
        const list = this.find(query, m);
        if (list.length === 0) return 0;
        const ss = m === this.mapId() ? this.spriteset() : null;
        if (ss && opts.transition && opts.transition !== 'none') {
            for (const d of list) {
                d.transition = { type: String(opts.transition), frames: Number(opts.frames) > 0 ? Number(opts.frames) : 30 };
                d._docsLeaving = true;
            }
            return list.length;
        }
        this.takeOut(list, m);
        return list.length;
    },

    /**
     * Out of the map's list and off the map at once, with collision told.
     * @internal
     * @param {DocsDoodad[]} list
     * @param {number} [mapId]
     * @returns {void}
     */
    takeOut(list, mapId) {
        const m = this.mapId(mapId);
        const data = window.$dataDocsDoodads || {};
        if (Array.isArray(data[m])) data[m] = data[m].filter(d => !list.includes(d));
        const ss = m === this.mapId() ? this.spriteset() : null;
        if (ss && ss.removeSomeDocsDoodads) ss.removeSomeDocsDoodads(list);
        if (DocsDoodads.Collision.invalidate) DocsDoodads.Collision.invalidate();
    },

    // ---- States and lights (kept in the save file) ----
    /**
     * A named doodad's state ('' when it has none set). Kept in the save file.
     * @param {string | DocsDoodad} name
     * @param {number} [mapId]
     * @returns {string}
     */
    state(name, mapId) {
        return DocsDoodads.WorldState.state(name, mapId);
    },

    /**
     * Sets a named doodad's state: a state's name or number, 'next', or '' (or null) for its first. Returns whether it changed.
     * @param {string | DocsDoodad} name
     * @param {string | number | null} state
     * @param {number} [mapId]
     * @returns {boolean}
     */
    setState(name, state, mapId) {
        return DocsDoodads.WorldState.setState(name, state, mapId);
    },

    /**
     * The names of a doodad's states, in order.
     * @param {DocsDoodadQuery} query
     * @returns {string[]}
     */
    stateNames(query) {
        const d = this.get(query);
        return d ? DocsDoodads.States.list(d).map(s => String(s.name || '')) : [];
    },

    /**
     * Whether a named doodad's light is on (null when there's no such doodad and nothing saved). Kept in the save file.
     * @param {string | DocsDoodad} name
     * @param {number} [mapId]
     * @returns {boolean | null}
     */
    light(name, mapId) {
        return DocsDoodads.WorldState.light(name, mapId);
    },

    /**
     * Turns a named doodad's light on or off, or back to its own setting (null). Returns false for a doodad with no Name.
     * @param {string | DocsDoodad} name
     * @param {boolean | null} on
     * @param {number} [mapId]
     * @returns {boolean}
     */
    setLight(name, on, mapId) {
        return DocsDoodads.WorldState.setLight(name, on, mapId);
    },

    // ---- What the plugin commands do, for scripts and other plugins ----
    /**
     * A doodad acts as if the player touched it (its next state, its common event); once-only and cooldowns apply. Returns whether anything ran.
     * @param {DocsDoodadQuery} query
     * @param {number} [mapId]
     * @returns {boolean}
     */
    touch(query, mapId) {
        const d = this.get(query, mapId);
        return d ? DocsDoodads.Touch.run(d, mapId) : false;
    },

    /**
     * Lets once-only doodads run again. Returns how many.
     * @param {DocsDoodadQuery} query
     * @param {number} [mapId]
     * @returns {number}
     */
    resetTouch(query, mapId) {
        const list = this.find(query, mapId);
        for (const d of list) DocsDoodads.Touch.reset(d, mapId);
        return list.length;
    },

    /**
     * Plays the doodads' picture strips once; 'animationEnd' says when each is done. Returns how many.
     * @param {DocsDoodadQuery} query
     * @param {{ from?: number, to?: number, hold?: boolean }} [opts]
     * @param {number} [mapId]
     * @returns {number}
     */
    playAnimation(query, opts = {}, mapId) {
        const list = this.find(query, mapId);
        for (const d of list) DocsDoodads.AnimPlay.play(d, Object.assign({}, opts, { mapId }));
        return list.length;
    },

    /**
     * Sets the wind: strength 0-1 (or 'world' for World > Weather's own) over frames, blowing 'left', 'right' or the 'same' way.
     * @param {number | 'world'} strength
     * @param {number} [frames]
     * @param {'left' | 'right' | 'same'} [direction]
     * @returns {object | null}
     */
    setWind(strength, frames = 0, direction = 'same') {
        return DocsDoodads.Wind.set(strength === 'world' ? 'world' : Number(strength), Number(frames) || 0, String(direction || 'same'));
    },

    /**
     * The flashlight on (true), off (false) or as World > Lighting sets it (null). Returns false before a game is loaded.
     * @param {boolean | null} on
     * @returns {boolean}
     */
    flashlight(on) {
        if (typeof $gameSystem === 'undefined' || !$gameSystem) return false;
        $gameSystem._docsFlashlight = on === null || on === undefined ? undefined : Boolean(on);
        return true;
    },

    /**
     * An ability (jump, glide, swim, dive, fly, climb, ice) on (true), off (false) or as set (null).
     * @param {DocsTraversalAbility} ability
     * @param {boolean | null} on
     * @returns {boolean}
     */
    traversal(ability, on) {
        DocsDoodads.Traversal.setAbility(String(ability || ''), on === null || on === undefined ? null : Boolean(on));
        return true;
    },

    /**
     * The player jumps, takes off, lands or dives, as if they pressed the key. Returns whether they did.
     * @param {'jump' | 'takeOff' | 'land' | 'dive'} action
     * @returns {boolean}
     */
    traversalAction(action) {
        const X = DocsDoodads.Traversal, a = String(action || '');
        if (a === 'jump') return X.jump();
        if (a === 'takeOff') return X.takeOff();
        if (a === 'land') return X.land();
        if (a === 'dive') return X.dive();
        return false;
    },

    /**
     * Plays an effect from the Effects Maker (or a built-in) at a tile, or on a character or 'player' (it follows them). Returns the playing effect, or null.
     * @param {string} id
     * @param {{ x: number, y: number } | DocsCharacter | 'player'} [at]
     * @returns {object | null}
     */
    playVfx(id, at = {}) {
        if (typeof $gameMap === 'undefined' || !$gameMap) return null;
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const spec = { id: String(id || '') };
        const ch = at && typeof at.screenX === 'function' ? at : at === 'player' && typeof $gamePlayer !== 'undefined' ? $gamePlayer : null;
        if (ch) { spec.follow = ch; spec.x = (ch._realX + 0.5) * tw; spec.y = (ch._realY + 0.5) * th; }
        else { spec.x = ((Number(at.x) || 0) + 0.5) * tw; spec.y = ((Number(at.y) || 0) + 0.5) * th; }
        return DocsDoodads.Vfx.play(spec);
    },

    /**
     * The explored map: 'all', 'around' (opts.radius), 'region' (opts.region), 'store' (opts.variableId) or 'forget'.
     * @param {'all' | 'around' | 'region' | 'store' | 'forget'} [action]
     * @param {{ radius?: number, region?: number, variableId?: number, mapId?: number }} [opts]
     * @returns {boolean}
     */
    reveal(action = 'all', opts = {}) {
        return DocsDoodads.Minimap.exploredCommand(Object.assign({ action }, opts));
    },

    /**
     * How much of a map has been seen, 0-1.
     * @param {number} [mapId]
     * @returns {number}
     */
    explored(mapId) {
        if (typeof $gameMap === 'undefined' || !$gameMap) return 0;
        const m = this.mapId(mapId);
        const E = DocsDoodads.Explored;
        if (m === $gameMap.mapId()) return E.fraction(m, $gameMap.width(), $gameMap.height());
        const saved = (E.system() && E.system()._docsExplored && E.system()._docsExplored[m]) || E._maps[m];
        return saved ? E.fraction(m, saved.w, saved.h) : 0;
    },

    /**
     * An atmosphere effect on or off for this playthrough (characterShadows, motionBlur, reflections, seeThrough, postfx).
     * @param {string} name
     * @param {boolean} on
     * @returns {boolean}
     */
    feature(name, on) {
        if (typeof $gameSystem === 'undefined' || !$gameSystem) return false;
        const off = $gameSystem._docsFeatureOff = $gameSystem._docsFeatureOff || {};
        if (on === false) off[name] = true; else delete off[name];
        return true;
    },

    // ---- The flat map's camera ----
    /**
     * The flat map's camera stays where it is put (Scroll Map, setDisplayPos) until followCamera().
     * @returns {boolean}
     */
    freeCamera() {
        const s = DocsDoodads.Camera2D.state();
        if (!s) return false;
        s.hold = null; s.path = null; s.follow = 0; s.free = 'event';
        return true;
    },

    /**
     * The flat map's camera follows a character again (the player when none is given).
     * @param {DocsCharacter} [character]
     * @returns {boolean}
     */
    followCamera(character) {
        const s = DocsDoodads.Camera2D.state();
        if (!s) return false;
        s.hold = null; s.path = null; s.free = null;
        s.follow = character && typeof character.eventId === 'function' ? character.eventId() : 0;
        return true;
    },

    /**
     * Zooms the flat map in on a tile ({ x, y }), a character or 'player' over frames; scale 1 goes back.
     * @param {{ x: number, y: number } | DocsCharacter | 'player'} target
     * @param {number} [scale]
     * @param {number} [frames]
     * @returns {boolean}
     */
    zoomTo(target, scale = 2, frames = 60) {
        const C = DocsDoodads.Camera2D;
        return C.zoomTo(C.pointOf(target === 'player' && typeof $gamePlayer !== 'undefined' ? $gamePlayer : target), scale, frames);
    },

    // ---- The calendar (the running clock's days; World > Day and Night) ----
    /**
     * Today's number, 1 on the first day of a new game; 0 when the clock doesn't run.
     * @returns {number}
     */
    day() { return DocsDoodads.Calendar.day(); },
    /**
     * The weekday: 0 for the first of World > Day and Night's list.
     * @returns {number}
     */
    weekday() { return DocsDoodads.Calendar.weekday(); },
    /**
     * The weekday's name for a day (today when none is given).
     * @param {number} [day]
     * @returns {string}
     */
    weekdayName(day) { return DocsDoodads.Calendar.weekdayName(day); },
    /**
     * The named date for a day (today when none is given), or ''.
     * @param {number} [day]
     * @returns {string}
     */
    dateName(day) { return DocsDoodads.Calendar.dateName(day); },
    /**
     * Goes to a day (1 or more), keeping the time of day. Returns false when the clock doesn't run.
     * @param {number} day
     * @returns {boolean}
     */
    setDay(day) { return DocsDoodads.Calendar.setDay(day); },

    /**
     * Turns scheduled event movement on or off for a cutscene. This pause is not kept in the save.
     * @param {boolean} [on]
     * @returns {boolean} Whether schedules are now on.
     */
    schedules(on = true) { return DocsDoodads.Schedules.setEnabled(on); },

    // ---- Clock, season and ambient light ----
    /**
     * The time of day in minutes (0-1439), or null when the clock is off.
     * @returns {number | null}
     */
    time() {
        const m = DocsDoodads.Atmosphere.minutes();
        return m === null || m === undefined ? null : m;
    },

    /**
     * Sets the clock; day (optional) sets its day too.
     * @param {number} hour
     * @param {number} [minute]
     * @param {number | null} [day]
     * @returns {void}
     */
    setTime(hour, minute = 0, day = null) {
        DocsDoodads.setTimeOfDay((Number(hour) || 0) * 60 + (Number(minute) || 0), day);
    },

    /**
     * Moves the clock on.
     * @param {number} hours
     * @param {number} [minutes]
     * @returns {void}
     */
    addTime(hours, minutes = 0) {
        DocsDoodads.addTimeOfDay((Number(hours) || 0) * 60 + (Number(minutes) || 0));
    },

    /**
     * The season's number (0 for the first).
     * @returns {number}
     */
    season() {
        return DocsDoodads.Atmosphere.season();
    },

    /**
     * The season's name from World > Seasons.
     * @returns {string}
     */
    seasonName() {
        const names = DocsDoodads.World.settings().seasons.names || [];
        return names[this.season()] || '';
    },

    /**
     * Sets the season by number or name. Returns false for a name that isn't one.
     * @param {number | string} season
     * @returns {boolean}
     */
    setSeason(season) {
        let n = Number(season);
        if (typeof season === 'string' && !/^\d+$/.test(season.trim())) {
            n = (DocsDoodads.World.settings().seasons.names || []).findIndex(s => String(s).toLowerCase() === season.trim().toLowerCase());
        }
        if (n >= 0) DocsDoodads.setSeason(n);
        return n >= 0;
    },

    /**
     * Ambient light: darkness 0-1 and a colour '#rrggbb' over frames; ambient(null) goes back to the map's own.
     * @param {number | null} darkness
     * @param {string} [color]
     * @param {number} [frames]
     * @returns {object | null}
     */
    ambient(darkness, color, frames = 60) {
        if (darkness === null || darkness === undefined) {
            const switchValue = id => (typeof $gameSwitches !== 'undefined' && $gameSwitches ? $gameSwitches.value(id) : false);
            return DocsDoodads.setAmbient(DocsDoodads.currentAmbient(switchValue), Number(frames) || 0, true);
        }
        return DocsDoodads.setAmbient({ darkness: Math.max(0, Math.min(1, Number(darkness) || 0)), color: color || DocsDoodads.Lighting.ambientDefaults.color }, Number(frames) || 0);
    }
};
