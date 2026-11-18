//==========================================================
// SECTION 17C: EVENT SCHEDULE RUNTIME
//==========================================================
// Runtime targets and original visibility live in WeakMaps, not save data. A restored Game_Map is a new object,
// so its first update derives every scheduled event from the restored clock even when _docsScheduleKey was saved.
DocsDoodads.ScheduleRuntime = {
    reset() {
        this._events = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
        this._maps = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
    },

    peek(event) { return this._events ? this._events.get(event) : null; },

    stateFor(event) {
        if (!this._events) this.reset();
        let state = this._events.get(event);
        if (!state) {
            const data = event && typeof event.event === 'function' ? event.event() : null;
            state = {
                key: null, target: null, hidden: false, fresh: true,
                baseTransparent: Boolean(event && event.isTransparent && event.isTransparent()),
                baseThrough: Boolean(event && event.isThrough && event.isThrough()),
                originX: Math.max(0, Math.floor(Number(data && data.x) || 0)),
                originY: Math.max(0, Math.floor(Number(data && data.y) || 0))
            };
            this._events.set(event, state);
        }
        return state;
    },

    mapState(map) {
        if (!this._maps) this.reset();
        let state = this._maps.get(map);
        if (!state) { state = { minute: null, weekday: null, revision: -1, pending: true, initialized: false, hasSchedules: null }; this._maps.set(map, state); }
        return state;
    },

    now() {
        const minutes = DocsDoodads.Atmosphere.minutes();
        return {
            minutes: minutes === null || minutes === undefined ? null : Math.max(0, Math.min(1439, Math.floor(Number(minutes) || 0))),
            weekday: DocsDoodads.Calendar.weekday(), names: DocsDoodads.Calendar.weekdayNames()
        };
    },

    busy(event) {
        const map = typeof $gameMap !== 'undefined' ? $gameMap : null;
        if (map && map.isEventRunning && map.isEventRunning()) return true;
        const interpreter = map && map._interpreter;
        if (interpreter && interpreter.isRunning && interpreter.isRunning() && interpreter.eventId && interpreter.eventId() === event.eventId()) return true;
        return Boolean(event && event._interpreter && event._interpreter.isRunning && event._interpreter.isRunning());
    },

    target(map, entry) {
        let x = Math.floor(Number(entry.x) || 0), y = Math.floor(Number(entry.y) || 0);
        if (map && map.isLoopHorizontal && map.isLoopHorizontal()) x = map.roundX(x);
        if (map && map.isLoopVertical && map.isLoopVertical()) y = map.roundY(y);
        if (map && map.isValid && !map.isValid(x, y)) return null;
        return { x, y };
    },

    savedKey(event) {
        const raw = String(event && event._docsScheduleKey || ''), marker = raw.lastIndexOf('\u001e');
        if (marker < 0) return { key: raw, flags: null };
        const flags = raw.slice(marker + 1);
        return { key: raw.slice(0, marker), flags: /^[01]{2}$/.test(flags) ? flags : null };
    },

    storeKey(event, entry, state) {
        event._docsScheduleKey = entry.key + (entry.hide ? '\u001e' + (state.baseTransparent ? '1' : '0') + (state.baseThrough ? '1' : '0') : '');
    },

    restoreVisibility(event, state) {
        if (!state.hidden) return;
        if (event.setTransparent) event.setTransparent(state.baseTransparent);
        if (event.setThrough) event.setThrough(state.baseThrough);
        state.hidden = false;
    },

    hide(event, state) {
        if (!state.hidden) {
            state.baseTransparent = Boolean(event.isTransparent && event.isTransparent());
            state.baseThrough = Boolean(event.isThrough && event.isThrough());
        }
        if (event.setTransparent) event.setTransparent(true);
        if (event.setThrough) event.setThrough(true);
        state.hidden = true;
    },

    finishTarget(event, state) {
        const target = state.target;
        if (!target) return;
        if (event.locate && (event.x !== target.x || event.y !== target.y)) event.locate(target.x, target.y);
        if (target.face && event.setDirection) event.setDirection(target.face);
        state.target = null;
    },

    applyEvent(event, entry, setup) {
        const state = this.stateFor(event), map = typeof $gameMap !== 'undefined' ? $gameMap : null;
        const key = entry ? entry.key : null;
        if (!setup && state.key === key && (key !== null || !event._docsScheduleKey)) return true;
        if (!setup && this.busy(event)) return false;

        // A saved hidden entry leaves MZ's ordinary flags true in the serialized Game_Event. The key tells us
        // which entry caused them, so restore the page's normal through value before deriving the new state.
        if (state.fresh && event._docsScheduleKey) {
            const saved = this.savedKey(event);
            const old = DocsDoodads.Schedules.of(event).find(item => item.key === saved.key);
            if ((old && old.hide) || saved.flags) {
                const page = event.page && event.page();
                state.baseTransparent = saved.flags ? saved.flags[0] === '1' : false;
                state.baseThrough = saved.flags ? saved.flags[1] === '1' : Boolean(page && page.through);
                if (event.setTransparent) event.setTransparent(state.baseTransparent);
                if (event.setThrough) event.setThrough(state.baseThrough);
            }
        }
        state.fresh = false;
        state.target = null;
        this.restoreVisibility(event, state);

        if (!entry) {
            const origin = this.target(map, { x: state.originX, y: state.originY });
            if (origin && event.locate) event.locate(origin.x, origin.y);
            state.key = null;
            delete event._docsScheduleKey;
            return true;
        }
        const target = this.target(map, entry);
        if (!target) {
            state.key = entry.key;
            this.storeKey(event, entry, state);
            return true;
        }
        target.face = [2, 4, 6, 8].includes(Number(entry.face)) ? Number(entry.face) : 0;
        if (setup || !entry.walk) {
            if (event.locate) event.locate(target.x, target.y);
            if (target.face && event.setDirection) event.setDirection(target.face);
        } else {
            state.target = { x: target.x, y: target.y, face: target.face, frames: 0 };
        }
        if (entry.hide) this.hide(event, state);
        state.key = entry.key;
        this.storeKey(event, entry, state);
        return true;
    },

    updateMap(map, setup) {
        const tracked = this.mapState(map), now = this.now();
        tracked.minute = now.minutes; tracked.weekday = now.weekday; tracked.revision = DocsDoodads.Schedules.revision; tracked.initialized = true;
        let pending = false, hasSchedules = false;
        for (const event of (map && map.events ? map.events() : [])) {
            if (!event || event._erased) continue;
            const entries = DocsDoodads.Schedules.of(event, now.names);
            if (entries.length) hasSchedules = true;
            if (!DocsDoodads.Schedules.enabled()) continue;
            if (!entries.length) {
                if ((this.peek(event) || event._docsScheduleKey) && !this.applyEvent(event, null, Boolean(setup))) pending = true;
                continue;
            }
            const current = now.minutes === null ? null : DocsDoodads.Schedules.current(entries, now.minutes, now.weekday, now.names);
            if (!this.applyEvent(event, current, Boolean(setup))) pending = true;
        }
        tracked.hasSchedules = hasSchedules;
        tracked.pending = pending;
        return DocsDoodads.Schedules.enabled() && !pending;
    },

    stepEvent(event) {
        const state = this.peek(event), target = state && state.target;
        if (state && state.hidden) {
            if (event.setTransparent && (!event.isTransparent || !event.isTransparent())) event.setTransparent(true);
            if (event.setThrough && (!event.isThrough || !event.isThrough())) event.setThrough(true);
        }
        if (!target || !DocsDoodads.Schedules.enabled() || event._erased || this.busy(event)) return false;
        const moving = Boolean(event.isMoving && event.isMoving());
        if (!moving && event.pos && event.pos(target.x, target.y)) { this.finishTarget(event, state); return true; }
        target.frames++;
        if (target.frames >= 600) {
            // Never placed onto the player or a follower: a solid event waits until the tile is free.
            if (this.playerOn(event, target)) return false;
            this.finishTarget(event, state); return true;
        }
        if (moving) return false;
        const direction = event.findDirectionTo ? event.findDirectionTo(target.x, target.y) : 0;
        if (direction > 0 && event.moveStraight) event.moveStraight(direction);
        return false;
    },

    // True when a solid event (same as characters, not Through) would land on the player or a follower.
    playerOn(event, target) {
        const player = typeof $gamePlayer !== 'undefined' ? $gamePlayer : null;
        if (!player || !player.isCollided || (event.isThrough && event.isThrough())) return false;
        if (event.isNormalPriority && !event.isNormalPriority()) return false;
        return Boolean(player.isCollided(target.x, target.y));
    },

    invalidateEvent(event) {
        const state = this.peek(event);
        if (state) {
            this.restoreVisibility(event, state);
            state.key = null; state.target = null; state.fresh = false;
            state.baseTransparent = Boolean(event.isTransparent && event.isTransparent());
            state.baseThrough = Boolean(event.isThrough && event.isThrough());
        }
        DocsDoodads.Schedules.invalidate(event);
        const map = typeof $gameMap !== 'undefined' ? $gameMap : null;
        if (map) this.mapState(map).pending = true;
    }
};
DocsDoodads.ScheduleRuntime.reset();

if (typeof Game_Map !== 'undefined') {
    $.Game_Map_setup_schedules = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        $.Game_Map_setup_schedules.call(this, mapId);
        DocsDoodads.ScheduleRuntime.updateMap(this, true);
    };

    Game_Map.prototype.updateDocsSchedules = function() {
        const R = DocsDoodads.ScheduleRuntime, state = R.mapState(this);
        if (state.initialized && state.hasSchedules === false && !state.pending && state.revision === DocsDoodads.Schedules.revision) return;
        const now = R.now();
        const changed = !state.initialized || state.minute !== now.minutes || state.weekday !== now.weekday || state.revision !== DocsDoodads.Schedules.revision;
        if (changed || state.pending) R.updateMap(this, !state.initialized);
    };
    if (DocsDoodads.mapSteps && !DocsDoodads.mapSteps.includes('updateDocsSchedules')) DocsDoodads.mapSteps.push('updateDocsSchedules');
}

if (typeof Game_Event !== 'undefined') {
    $.Game_Event_update_schedules = Game_Event.prototype.update;
    Game_Event.prototype.update = function() {
        $.Game_Event_update_schedules.call(this);
        DocsDoodads.ScheduleRuntime.stepEvent(this);
    };

    $.Game_Event_updateSelfMovement_schedules = Game_Event.prototype.updateSelfMovement;
    Game_Event.prototype.updateSelfMovement = function() {
        const state = DocsDoodads.ScheduleRuntime.peek(this);
        if (state && state.target) return;
        $.Game_Event_updateSelfMovement_schedules.call(this);
    };

    if (typeof Game_Event.prototype.refresh === 'function') {
        $.Game_Event_refresh_schedules = Game_Event.prototype.refresh;
        Game_Event.prototype.refresh = function() {
            const R = DocsDoodads.ScheduleRuntime, state = R.peek(this);
            const wasHidden = Boolean(state && state.hidden);
            if (state) R.restoreVisibility(this, state);
            $.Game_Event_refresh_schedules.call(this);
            R.invalidateEvent(this);
            if (state && wasHidden) R.hide(this, state);
        };
    }
}

if (typeof DataManager !== 'undefined') {
    if (typeof DataManager.createGameObjects === 'function') {
        $.DataManager_createGameObjects_schedules = DataManager.createGameObjects;
        DataManager.createGameObjects = function() {
            $.DataManager_createGameObjects_schedules.call(this);
            DocsDoodads.Schedules.reset(); DocsDoodads.ScheduleRuntime.reset();
        };
    }
    if (typeof DataManager.extractSaveContents === 'function') {
        $.DataManager_extractSaveContents_schedules = DataManager.extractSaveContents;
        DataManager.extractSaveContents = function(contents) {
            $.DataManager_extractSaveContents_schedules.call(this, contents);
            DocsDoodads.Schedules.reset(); DocsDoodads.ScheduleRuntime.reset();
        };
    }
}
