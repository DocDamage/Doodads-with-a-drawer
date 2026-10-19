//==========================================================
// SECTION 5D2: STATE EFFECTS, TOUCH ONCE AND COOLDOWN, PLAYING AN ANIMATION ONCE
//==========================================================
// A state can play a sound and an effect when the doodad goes into it, and go back to the state before
// after some seconds (a trap that resets). A touch can run only once (kept in the save) or wait between
// runs, and say so when the player faces it (15_spriteset_map_prompts.js draws that). A doodad's picture
// strip can be played once, now, with an "animationEnd" event at its end.

// States: { sound, vfx, revert (seconds) } beside name, path, light and collision.
DocsDoodads.StateFx = {
    // The sprite saw its doodad go from state `from` to `to` on the map (not while editing, not at load).
    entered(d, from, to) {
        const st = DocsDoodads.States.list(d)[to];
        if (!st || (DocsDoodads.Workspace && DocsDoodads.Workspace.mounted)) return;
        const tw = typeof $gameMap !== 'undefined' && $gameMap && $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
        const th = typeof $gameMap !== 'undefined' && $gameMap && $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
        const sound = String(st.sound || '').trim();
        if (sound && typeof AudioManager !== 'undefined') {
            const se = { name: sound, volume: Number(st.soundVolume) || 90, pitch: Number(st.soundPitch) || 100, pan: 0 };
            const at = DocsDoodads.SpatialSound && DocsDoodads.SpatialSound.forTile
                ? DocsDoodads.SpatialSound.forTile(se, Math.floor((Number(d.x) || 0) / tw), Math.floor(((Number(d.y) || 0) - 1) / th)) : se;
            if (at) AudioManager.playSe(at);
        }
        const vfx = String(st.vfx || '').trim();
        if (vfx && DocsDoodads.Vfx) {
            const h = (Number(d.frameH) || th) * Math.abs(d.scaleY !== undefined ? Number(d.scaleY) : 1);
            DocsDoodads.Vfx.play({ id: vfx, x: Number(d.x) || 0, y: (Number(d.y) || 0) - h * (d.anchorY !== undefined ? Number(d.anchorY) : 1) + h / 2 });
        }
        if (Number(st.revert) > 0 && from !== undefined && from !== to) this.schedule(d, from, Number(st.revert));
        else this.cancel(d);
    },

    // Timers going back: { key: { frames, back } }, kept in the save so a reset trap resets after a load too.
    timers(write) {
        if (typeof $gameSystem === 'undefined' || !$gameSystem) return {};
        if (!write && !$gameSystem._docsStateTimers) return {};
        return ($gameSystem._docsStateTimers = $gameSystem._docsStateTimers || {});
    },

    keyOf(d, mapId) {
        const W = DocsDoodads.WorldState, id = W.idOf(d);
        return id ? W.key(mapId, id) : '';
    },

    schedule(d, back, seconds, mapId) {
        const key = this.keyOf(d, mapId);
        if (!key) return false;
        this.timers(true)[key] = { frames: Math.max(1, Math.round(seconds * 60)), back };
        return true;
    },

    cancel(d, mapId) {
        const key = this.keyOf(d, mapId);
        const timers = this.timers(false);
        if (key && timers[key]) delete timers[key];
    },

    // A frame on the map: timers for this map count down and send their doodad back.
    update() {
        const timers = this.timers(false);
        const keys = Object.keys(timers);
        if (!keys.length) return;
        const W = DocsDoodads.WorldState, prefix = W.mapId(0) + '/';
        for (const key of keys) {
            if (key.indexOf(prefix) !== 0) continue;
            const t = timers[key];
            if (--t.frames > 0) continue;
            delete timers[key];
            // The key holds the doodad's handle ("name:door" or "uid:..."); setState takes a name or a uid handle.
            const id = key.slice(prefix.length);
            W.setState(id.indexOf('name:') === 0 ? id.slice(5) : id, t.back, W.mapId(0));
        }
    }
};

// Touch once (kept in the save: a chest), a cooldown between runs (a lever), and a prompt when faced.
Object.assign(DocsDoodads.Touch.defaults, { once: false, cooldown: 0, prompt: '' });
DocsDoodads.Touch._cooldowns = typeof WeakMap !== 'undefined' ? new WeakMap() : null;

// Whether a once-only touch has run on this map (the save remembers).
DocsDoodads.Touch.usedUp = function(d, mapId) {
    const t = this.settings(d);
    if (!t || !t.once) return false;
    const W = DocsDoodads.WorldState, id = W.idOf(d);
    const s = W.store(false);
    return Boolean(id && s.touched && s.touched[W.key(mapId, id)]);
};

// Frames left before it answers again (0: ready).
DocsDoodads.Touch.coolingFor = function(d) {
    const t = this.settings(d);
    const until = t && Number(t.cooldown) > 0 && this._cooldowns ? this._cooldowns.get(d) : 0;
    return until ? Math.max(0, until - DocsDoodads.frameCount()) : 0;
};

// Lets a once-only touch run again (api.resetTouch).
DocsDoodads.Touch.reset = function(d, mapId) {
    const W = DocsDoodads.WorldState, id = W.idOf(d);
    const s = W.store(false);
    if (id && s.touched) delete s.touched[W.key(mapId, id)];
    if (this._cooldowns) this._cooldowns.delete(d);
};

$.Touch_isTouchable_once = DocsDoodads.Touch.isTouchable;
DocsDoodads.Touch.isTouchable = function(d) {
    return $.Touch_isTouchable_once.call(this, d) && !this.usedUp(d);
};

$.Touch_run_once = DocsDoodads.Touch.run;
DocsDoodads.Touch.run = function(d, mapId) {
    const t = this.settings(d);
    if (!t || this.usedUp(d, mapId) || this.coolingFor(d) > 0) return false;
    const ran = $.Touch_run_once.call(this, d, mapId);
    if (t.once) {
        const W = DocsDoodads.WorldState, id = W.idOf(d);
        if (id) {
            const s = W.store();
            s.touched = s.touched || {};
            s.touched[W.key(mapId, id)] = true;
        }
    }
    if (Number(t.cooldown) > 0 && this._cooldowns) this._cooldowns.set(d, DocsDoodads.frameCount() + Math.round(Number(t.cooldown) * 60));
    return ran;
};

// The touchable doodad the player faces (the tile ahead, or underfoot for "walking into it"), for the prompt.
DocsDoodads.Touch.faced = function() {
    if (typeof $gamePlayer === 'undefined' || !$gamePlayer || typeof $gameMap === 'undefined' || !$gameMap) return null;
    const doodads = DocsDoodads.doodads();
    if (!doodads || !doodads.length) return null;
    const settings = DocsDoodads.Lighting.mapSettings($gameMap.mapId());
    const visible = d => DocsDoodads.Layers.visibleInGame(d, settings) && DocsDoodads.Appearance.isVisible(d, {});
    const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
    const dir = $gamePlayer.direction();
    const ahead = this.at($gameMap.roundXWithDirection($gamePlayer.x, dir), $gameMap.roundYWithDirection($gamePlayer.y, dir), doodads, tw, th, visible);
    const here = this.at($gamePlayer.x, $gamePlayer.y, doodads, tw, th, visible);
    return ahead.concat(here).find(d => this.coolingFor(d) === 0) || null;
};

// Playing a doodad's picture strip once, now (a chest lid, a door swinging), with an event at the end.
DocsDoodads.AnimPlay = {
    _req: typeof WeakMap !== 'undefined' ? new WeakMap() : null,

    // opts: { from (frame, 0), to (frame, the last), hold (keep the last frame, true), speed (frames a step) }.
    play(d, opts = {}) {
        if (!d || !this._req) return null;
        const total = Math.max(1, (Number(d.xFrame) || 1) * (Number(d.yFrame) || 1));
        const from = Math.max(0, Math.min(total - 1, Math.floor(Number(opts.from) || 0)));
        const toRaw = opts.to === undefined || opts.to === null || Number(opts.to) < 0 ? total - 1 : Math.floor(Number(opts.to));
        const req = { from, to: Math.max(from, Math.min(total - 1, toRaw)), steps: 0, timer: 0, done: false, hold: opts.hold !== false,
            speed: Math.max(1, Number(opts.speed) || Number(d.frameUpdate) || 6), mapId: DocsDoodads.WorldState.mapId(opts.mapId) };
        this._req.set(d, req);
        return req;
    },

    request(d) {
        return this._req ? this._req.get(d) || null : null;
    },

    playing(d) {
        const r = this.request(d);
        return Boolean(r && !r.done);
    },

    // The frame to show this frame (called once a frame by the doodad's sprite); null when not playing.
    step(d) {
        const r = this.request(d);
        if (!r) return null;
        if (!r.done && ++r.timer >= r.speed) {
            r.timer = 0;
            r.steps++;
        }
        const frame = Math.min(r.to, r.from + r.steps);
        if (!r.done && frame >= r.to) {
            r.done = true;
            if (!r.hold) this._req.delete(d);
            if (DocsDoodads.api) DocsDoodads.api.emit('animationEnd', { doodad: d, name: String(d.name || ''), mapId: r.mapId });
        }
        return frame;
    }
};

if (typeof Game_Map !== 'undefined') {
    // A step of Game_Map.update (DocsDoodads.mapSteps): state timers count down while the map runs.
    Game_Map.prototype.updateDocsStateTimers = function(sceneActive) {
        if (sceneActive === false || (DocsDoodads.Workspace && DocsDoodads.Workspace.mounted)) return;
        DocsDoodads.StateFx.update();
    };
}

if (typeof PluginManager !== 'undefined' && typeof PluginManager.registerCommand === 'function') {
    // Play Doodad Animation: the doodads with this Name play their picture strip once, now.
    PluginManager.registerCommand(pluginName, 'playDoodadAnimation', function(args) {
        const list = DocsDoodads.WorldState.doodadsNamed(args.name, Number(args.mapId) || 0);
        for (const d of list) DocsDoodads.AnimPlay.play(d, { from: Number(args.from) || 0, to: args.to === undefined || String(args.to).trim() === '' ? -1 : Number(args.to),
            hold: String(args.hold) !== 'false', mapId: Number(args.mapId) || 0 });
        if (list.length && String(args.wait) === 'true' && this && this.setWaitMode) {
            this._docsWaitAnim = list;
            this.setWaitMode('docsAnim');
        }
    });
}
