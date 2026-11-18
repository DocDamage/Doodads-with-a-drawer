//==========================================================
// SECTION 5T: DOODADS THAT RIDE AND TRAVEL (9.2.5)
//==========================================================
// A doodad with `ride: { on, dx, dy }` sits on an event (its id) or the player ('player'), offset by dx, dy pixels.
// One with `travel: { points, speed, ease, mode, switchId, carries }` goes along points (pixels from where it was
// placed; the first leg starts there) at `speed` pixels a second: `loop` comes back to the start, `backAndForth`
// turns round at each end, `once` stops at the last point and stays there (kept in the save). A switch, when set,
// must be on for it to move. `carries` moves whoever stands on it, so a raft crosses water.
// The game moves the doodad's own x and y (as api.move does), so its light, shadow, particles, sound and body go
// with it; where it was placed is kept apart and put back whenever the editor is open.
DocsDoodads.Travel = {
    modes: ['loop', 'backAndForth', 'once'],
    // Bumped when a doodad gains or loses ride or travel, so the map's short list of movers is made again.
    _version: 0,

    normalizeTravel(t) {
        if (!t || typeof t !== 'object') return null;
        const points = (Array.isArray(t.points) ? t.points : DocsDoodads.Camera2D.parsePoints(t.points))
            .map(p => ({ x: Math.round(Number(p && p.x) || 0), y: Math.round(Number(p && p.y) || 0) }))
            .filter(p => Number.isFinite(p.x) && Number.isFinite(p.y)).slice(0, 64);
        if (!points.length) return null;
        const speed = Number(t.speed);
        return {
            points,
            speed: Number.isFinite(speed) && speed > 0 ? Math.min(2000, speed) : 48,
            ease: t.ease === 'smooth' ? 'smooth' : 'linear',
            mode: this.modes.includes(t.mode) ? t.mode : 'loop',
            switchId: Math.max(0, Math.floor(Number(t.switchId) || 0)),
            carries: Boolean(t.carries),
            wait: Math.max(0, Math.min(600, Math.round(Number(t.wait) || 0)))
        };
    },

    normalizeRide(r) {
        if (!r || typeof r !== 'object') return null;
        const on = r.on === 'player' ? 'player' : Math.floor(Number(r.on) || 0);
        if (!on) return null;
        return { on, dx: Math.round(Number(r.dx) || 0), dy: Math.round(Number(r.dy) || 0) };
    },

    // The stops of one trip, from the start (0, 0): loop closes back to it; backAndForth goes out and back.
    stops(t) {
        const out = [{ x: 0, y: 0 }].concat(t.points);
        if (t.mode === 'loop') out.push({ x: 0, y: 0 });
        else if (t.mode === 'backAndForth') for (let i = out.length - 2; i >= 0; i--) out.push(out[i]);
        return out;
    },

    // Frames each leg takes at the speed, plus `wait` frames held at each stop.
    legs(t) {
        const s = this.stops(t), out = [];
        for (let i = 1; i < s.length; i++) out.push(Math.max(1, Math.round(Math.hypot(s[i].x - s[i - 1].x, s[i].y - s[i - 1].y) / t.speed * 60)));
        return out;
    },

    length(t) {
        return this.legs(t).reduce((a, b) => a + b + t.wait, 0);
    },

    // Where a traveller is after `frame` frames: { dx, dy, done } from where it was placed.
    at(travel, frame) {
        const t = this.normalizeTravel(travel);
        if (!t) return { dx: 0, dy: 0, done: true };
        const s = this.stops(t), legs = this.legs(t), total = this.length(t);
        let f = Math.max(0, Number(frame) || 0);
        if (t.mode === 'once' && f >= total) return { dx: s[s.length - 1].x, dy: s[s.length - 1].y, done: true };
        if (t.mode !== 'once') f = f % Math.max(1, total);
        for (let i = 0; i < legs.length; i++) {
            if (f < t.wait) return { dx: s[i].x, dy: s[i].y, done: false };
            f -= t.wait;
            if (f < legs[i]) {
                const k = DocsDoodads.Camera2D.ease(f / legs[i], t.ease);
                return { dx: s[i].x + (s[i + 1].x - s[i].x) * k, dy: s[i].y + (s[i + 1].y - s[i].y) * k, done: false };
            }
            f -= legs[i];
        }
        const last = s[s.length - 1];
        return { dx: last.x, dy: last.y, done: t.mode === 'once' };
    },

    // A rider's map point from a character: { x, y } in map pixels (its feet, plus the offset).
    rideAt(ride, character, tw, th) {
        const r = this.normalizeRide(ride);
        if (!r || !character) return null;
        const rx = Number(character._realX !== undefined ? character._realX : character.x) || 0;
        const ry = Number(character._realY !== undefined ? character._realY : character.y) || 0;
        const jump = typeof character.jumpHeight === 'function' ? character.jumpHeight() : 0;
        return { x: rx * tw + tw / 2 + r.dx, y: ry * th + th + r.dy - jump };
    },

    // ---- The game's state, kept small: frames per traveller on this map, and where `once` travellers ended ----
    _homes: new WeakMap(),

    home(d) {
        let h = this._homes.get(d);
        if (!h) { h = { x: Number(d.x) || 0, y: Number(d.y) || 0 }; this._homes.set(d, h); }
        return h;
    },

    // Puts every mover back where it was placed (the editor opens, or the map is saved).
    restore(list) {
        for (const d of list || []) {
            const h = this._homes.get(d);
            if (h) { d.x = h.x; d.y = h.y; }
        }
    },

    store(write = true) {
        if (typeof $gameSystem === 'undefined' || !$gameSystem) return { done: {}, off: {} };
        if (!write && !$gameSystem._docsTravel) return { done: {}, off: {} };
        const s = $gameSystem._docsTravel = $gameSystem._docsTravel || {};
        s.done = s.done || {}; s.off = s.off || {};
        return s;
    },

    // Start Travel / Stop Travel by name (or id), on this map.
    setRunning(query, running, mapId) {
        const list = DocsDoodads.api ? DocsDoodads.api.find(query, mapId) : [];
        const s = this.store(true), id = DocsDoodads.WorldState.mapId(mapId);
        for (const d of list) {
            const key = id + '/' + DocsDoodads.WorldState.idOf(d);
            if (running) { delete s.off[key]; delete s.done[key]; } else s.off[key] = true;
        }
        return list.length;
    },

    // Whether a traveller moves now: not stopped, its switch on (or none), not a finished `once`.
    running(d, mapId, switchValue) {
        const t = this.normalizeTravel(d && d.travel);
        if (!t) return false;
        const s = this.store(false), key = DocsDoodads.WorldState.mapId(mapId) + '/' + DocsDoodads.WorldState.idOf(d);
        if (s.off[key]) return false;
        return !t.switchId || Boolean(switchValue(t.switchId));
    },

    finished(d, mapId) {
        const s = this.store(false);
        return Boolean(s.done[DocsDoodads.WorldState.mapId(mapId) + '/' + DocsDoodads.WorldState.idOf(d)]);
    },

    finish(d, mapId) {
        this.store(true).done[DocsDoodads.WorldState.mapId(mapId) + '/' + DocsDoodads.WorldState.idOf(d)] = true;
    },

    // The tiles a doodad's body covers, as "x,y" keys (empty when it has none).
    bodyTiles(d, tw, th) {
        const C = DocsDoodads.Collision;
        const body = C && C.bodyOf ? C.bodyOf(d) : null;
        if (!body) return [];
        return C.tilesUnder(body, tw, th).map(t => t.x + ',' + t.y);
    }
};

if (typeof PluginManager !== 'undefined' && typeof PluginManager.registerCommand === 'function') {
    PluginManager.registerCommand(pluginName, 'startTravel', args => DocsDoodads.Travel.setRunning(String(args.name || ''), true));
    PluginManager.registerCommand(pluginName, 'stopTravel', args => DocsDoodads.Travel.setRunning(String(args.name || ''), false));
}
