//==========================================================
// SECTION 7a: DOODAD STATES, WORLD STATE & TOUCHABLE DOODADS
//==========================================================
// A doodad can have named states (lit and unlit, open and closed, whole and broken). State 0 is the
// doodad as placed; each other state can show other art, put its light out and drop its collision.
// d.states = { list: [{ name, path, w, h, light, collision }], by: 'switch'|'variable'|'events',
//              switchId, variableId, fade }
// What events set (the lamp smashed, the door left open) is kept per save in $gameSystem, and wins over
// the switch or variable until it is cleared.
DocsDoodads.States = {
    byOptions: [
        { value: 'events', label: 'Events only' },
        { value: 'switch', label: 'A switch (off: 0, on: 1)' },
        { value: 'variable', label: 'A variable (its value)' }
    ],

    defaults: { by: 'events', switchId: 0, variableId: 0, fade: 20 },

    // The editor's "Preview" pick, kept outside the doodad so it is never saved.
    _preview: typeof WeakMap !== 'undefined' ? new WeakMap() : null,

    list(d) {
        return d && d.states && Array.isArray(d.states.list) ? d.states.list : [];
    },

    has(d) {
        return this.list(d).length > 1;
    },

    // A state by number or name (any case); -1 when there is no such state.
    find(d, which) {
        const list = this.list(d);
        if (which === null || which === undefined || which === '') return -1;
        if (typeof which === 'number' || /^\d+$/.test(String(which).trim())) {
            const n = Number(which);
            return n >= 0 && n < list.length ? n : -1;
        }
        const name = String(which).trim().toLowerCase();
        return list.findIndex(s => s && String(s.name || '').trim().toLowerCase() === name);
    },

    // The state a doodad is in: the editor's preview, then what events saved, then its switch or variable.
    index(d, mapId) {
        const list = this.list(d);
        if (list.length < 2) return 0;
        const editing = Boolean(DocsDoodads.Workspace && DocsDoodads.Workspace.mounted);
        if (editing && this._preview && this._preview.has(d)) return Math.min(list.length - 1, this._preview.get(d));
        const saved = this.find(d, DocsDoodads.WorldState.savedState(d, mapId));
        if (saved >= 0) return saved;
        const s = Object.assign({}, this.defaults, d.states);
        if (s.by === 'switch' && Number(s.switchId) > 0) {
            return typeof $gameSwitches !== 'undefined' && $gameSwitches && $gameSwitches.value(Number(s.switchId)) ? 1 : 0;
        }
        if (s.by === 'variable' && Number(s.variableId) > 0) {
            const v = typeof $gameVariables !== 'undefined' && $gameVariables ? Math.floor(Number($gameVariables.value(Number(s.variableId))) || 0) : 0;
            return Math.max(0, Math.min(list.length - 1, v));
        }
        return 0;
    },

    current(d, mapId) {
        return this.list(d)[this.index(d, mapId)] || null;
    },

    name(d, mapId) {
        const s = this.current(d, mapId);
        return s ? String(s.name || '') : '';
    },

    // The art a state shows ({ path, w, h }), or null for the doodad's own.
    art(d, mapId) {
        const s = this.current(d, mapId);
        return s && s.path && this.index(d, mapId) > 0 ? { path: s.path, w: Number(s.w) || 0, h: Number(s.h) || 0 } : null;
    },

    // Whether the state lets the doodad's light shine and its collision block (both on unless turned off).
    lightAllowed(d, mapId) {
        const s = this.current(d, mapId);
        return !s || s.light !== false;
    },

    blocks(d, mapId) {
        const s = this.current(d, mapId);
        return !s || s.collision !== false;
    },

    fadeFrames(d) {
        const f = d && d.states && d.states.fade !== undefined ? Number(d.states.fade) : this.defaults.fade;
        return Math.max(0, Math.min(240, Math.round(f) || 0));
    },

    setPreview(d, index) {
        if (!this._preview) return;
        if (index === null || index === undefined || index < 0) this._preview.delete(d);
        else this._preview.set(d, index);
    },

    previewOf(d) {
        return this._preview && this._preview.has(d) ? this._preview.get(d) : -1;
    }
};

// Doodad states and lights per save file: what events set is kept in $gameSystem (saved with the game).
// Doodads are found by the Name given in Details (all doodads with that name on the map follow it).
DocsDoodads.WorldState = {
    // write: false only reads, so drawing a map never adds the store to a save that has none.
    store(write = true) {
        if (typeof $gameSystem === 'undefined' || !$gameSystem) return { states: {}, lights: {} };
        if (!write && !$gameSystem._docsWorldState) return { states: {}, lights: {} };
        const s = $gameSystem._docsWorldState = $gameSystem._docsWorldState || {};
        s.states = s.states || {};
        s.lights = s.lights || {};
        return s;
    },

    mapId(mapId) {
        const n = Number(mapId) || 0;
        if (n > 0) return n;
        return typeof $gameMap !== 'undefined' && $gameMap && $gameMap.mapId ? $gameMap.mapId() : 0;
    },

    // A doodad's handle: its Name, or its id when it has none.
    idOf(d) {
        if (!d) return '';
        const name = String(d.name || '').trim();
        return name ? 'name:' + name.toLowerCase() : (d.uid ? 'uid:' + d.uid : '');
    },

    key(mapId, id) {
        return this.mapId(mapId) + '/' + id;
    },

    handle(nameOrDoodad) {
        if (nameOrDoodad && typeof nameOrDoodad === 'object') return this.idOf(nameOrDoodad);
        const name = String(nameOrDoodad || '').trim();
        if (!name) return '';
        return /^uid:/.test(name) ? name : 'name:' + name.toLowerCase();
    },

    // The name events know a doodad by (its uid when it has no name).
    nameOf(nameOrDoodad) {
        if (nameOrDoodad && typeof nameOrDoodad === 'object') return String(nameOrDoodad.name || nameOrDoodad.uid || '');
        return String(nameOrDoodad || '').trim();
    },

    savedState(d, mapId) {
        const id = this.idOf(d);
        if (!id) return undefined;
        const v = this.store(false).states[this.key(mapId, id)];
        return v === undefined || v === null ? undefined : v;
    },

    savedLight(d, mapId) {
        const id = this.idOf(d);
        if (!id) return undefined;
        const v = this.store(false).lights[this.key(mapId, id)];
        return typeof v === 'boolean' ? v : undefined;
    },

    // The doodads with this name (or the given doodad) on a map (this map when 0).
    doodadsNamed(name, mapId) {
        if (name && typeof name === 'object') return [name];
        const id = this.handle(name);
        if (!id) return [];
        const list = typeof DocsDoodads.doodads === 'function' ? DocsDoodads.doodads(this.mapId(mapId)) || [] : [];
        return list.filter(d => d && this.idOf(d) === id);
    },

    // Whether a map's doodads are loaded, so a name missing from them really is missing.
    mapLoaded(mapId) {
        const data = typeof window !== 'undefined' ? window.$dataDocsDoodads : null;
        return Boolean(data && Array.isArray(data[this.mapId(mapId)]));
    },

    // The number of the state a named doodad is in (0 = as placed), or -1 when there is no such doodad.
    stateIndex(name, mapId) {
        const m = this.mapId(mapId);
        const d = this.doodadsNamed(name, m)[0];
        if (d) return DocsDoodads.States.index(d, m);
        const id = this.handle(name);
        const v = id ? this.store(false).states[this.key(m, id)] : undefined;
        return typeof v === 'number' ? v : -1;
    },

    // The state a named doodad is in, as its name ('' when there is no such doodad on this map, or
    // what was saved for another map).
    state(name, mapId) {
        const m = this.mapId(mapId);
        const d = this.doodadsNamed(name, m)[0];
        if (d) return DocsDoodads.States.name(d, m);
        const id = this.handle(name);
        const v = id ? this.store(false).states[this.key(m, id)] : undefined;
        return v === undefined || v === null ? '' : String(v);
    },

    // For Conditional Branch scripts: DocsDoodads.WorldState.is('Front Door', 'Open').
    is(name, stateName, mapId) {
        return this.state(name, mapId).trim().toLowerCase() === String(stateName === undefined ? '' : stateName).trim().toLowerCase();
    },

    // Sets a named doodad's state on a map (this map when 0): a state name, its number, 'next', or
    // '' to go back to following its switch or variable.
    setState(name, which, mapId) {
        const id = this.handle(name);
        if (!id) return false;
        const m = this.mapId(mapId);
        const key = this.key(m, id);
        const states = this.store().states;
        const raw = which === undefined || which === null ? '' : String(which).trim();
        const told = () => { if (DocsDoodads.api) DocsDoodads.api.emit('state', { name: this.nameOf(name), state: this.state(name, m), mapId: m }); };
        if (raw === '') {
            delete states[key];
            told();
            return true;
        }
        const d = this.doodadsNamed(name, m)[0];
        if (raw.toLowerCase() === 'next') {
            if (!d) return false;
            const n = DocsDoodads.States.list(d).length;
            if (n < 2) return false;
            states[key] = (DocsDoodads.States.index(d, m) + 1) % n;
            told();
            return true;
        }
        // Only states the doodad has, so a typo doesn't leave a dead key in every save.
        if (d && DocsDoodads.States.find(d, raw) < 0) {
            const names = DocsDoodads.States.list(d).map((s, i) => String((s && s.name) || i)).join(', ');
            console.warn(`[DocsDoodads] "${this.nameOf(name)}" has no state "${raw}"; its states are: ${names || 'none'}.`);
            return false;
        }
        if (!d && this.mapLoaded(m)) {
            console.warn(`[DocsDoodads] no doodad named "${this.nameOf(name)}" on map ${m}.`);
            return false;
        }
        states[key] = /^\d+$/.test(raw) ? Number(raw) : raw;
        told();
        return true;
    },

    // Whether a named doodad's light is on; null when no doodad on that map has that name.
    light(name, mapId) {
        const d = this.doodadsNamed(name, mapId)[0];
        if (!d) {
            const id = this.handle(name);
            const v = id ? this.store(false).lights[this.key(mapId, id)] : undefined;
            return typeof v === 'boolean' ? v : null;
        }
        return DocsDoodads.WorldState.lightOn(d, mapId);
    },

    // on: true, false, or null to go back to the doodad's own setting.
    setLight(name, on, mapId) {
        const id = this.handle(name);
        if (!id) return false;
        const key = this.key(mapId, id);
        const lights = this.store().lights;
        if (on === null || on === undefined || on === '') delete lights[key];
        else lights[key] = Boolean(on === true || on === 'true' || on === 'on' || on === 1);
        if (DocsDoodads.api) DocsDoodads.api.emit('light', { name: this.nameOf(name), on: this.light(name, mapId), mapId: this.mapId(mapId) });
        return true;
    },

    // A doodad's light, from what events saved, then its state.
    lightOn(d, mapId) {
        const saved = this.savedLight(d, mapId);
        if (saved !== undefined) return saved;
        return DocsDoodads.States.lightAllowed(d, mapId);
    },

    clearMap(mapId) {
        const prefix = this.mapId(mapId) + '/';
        const s = this.store();
        for (const k of Object.keys(s.states)) if (k.indexOf(prefix) === 0) delete s.states[k];
        for (const k of Object.keys(s.lights)) if (k.indexOf(prefix) === 0) delete s.lights[k];
    },

    // The doodad the player last touched ({ mapId, name, state }), for a common event to read.
    touched() {
        return typeof $gameTemp !== 'undefined' && $gameTemp && $gameTemp._docsTouched ? $gameTemp._docsTouched : null;
    }
};

// Touchable doodads: d.touch = { commonEventId, trigger: 'action'|'touch', nextState }.
// Action: the Action button (or a click) facing it. Touch: walking into it or onto it, or Action.
DocsDoodads.Touch = {
    triggers: [
        { value: 'action', label: 'Action button (or a click)' },
        { value: 'touch', label: 'Walking into it, or the Action button' }
    ],

    defaults: { commonEventId: 0, trigger: 'action', nextState: false },

    settings(d) {
        return d && d.touch ? Object.assign({}, this.defaults, d.touch) : null;
    },

    isTouchable(d) {
        const t = this.settings(d);
        return Boolean(t && (Number(t.commonEventId) > 0 || (t.nextState && DocsDoodads.States.has(d))));
    },

    // The tiles a doodad answers on: those its collision covers, or the tile its base stands on.
    tilesOf(d, tw, th) {
        const C = DocsDoodads.Collision;
        const body = C && C.bodyOf ? C.bodyOf(d) : null;
        // The same tiles in every state, so an opened door doesn't answer somewhere else.
        if (body) {
            const tiles = C.tilesUnder(body, tw, th);
            if (tiles.length > 0) return tiles;
        }
        return [{ x: Math.floor((Number(d.x) || 0) / tw), y: Math.floor(((Number(d.y) || 0) - 1) / th) }];
    },

    // Touchable doodads showing on a tile.
    at(x, y, doodads, tw, th, visible) {
        const out = [];
        for (const d of doodads || []) {
            if (!d || !this.isTouchable(d)) continue;
            if (visible && !visible(d)) continue;
            if (this.tilesOf(d, tw, th).some(t => t.x === x && t.y === y)) out.push(d);
        }
        return out;
    },

    // kind: 'action' (the Action button) or 'touch' (walked into or onto).
    fits(d, kind) {
        const t = this.settings(d);
        if (!t) return false;
        return kind === 'action' || t.trigger === 'touch';
    },

    // Runs a doodad's touch: its next state, then its common event. Returns whether anything ran.
    run(d, mapId) {
        const t = this.settings(d);
        if (!t) return false;
        const W = DocsDoodads.WorldState;
        let ran = false;
        if (t.nextState && DocsDoodads.States.has(d)) {
            ran = W.setState(d, 'next', mapId) || ran;
        }
        if (typeof $gameTemp !== 'undefined' && $gameTemp) {
            // The tile its base stands on, so a common event can play a sound or an effect there.
            const tw = typeof $gameMap !== 'undefined' && $gameMap && $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
            const th = typeof $gameMap !== 'undefined' && $gameMap && $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
            const x = Math.floor((Number(d.x) || 0) / tw), y = Math.floor(((Number(d.y) || 0) - 1) / th);
            $gameTemp._docsTouched = { mapId: W.mapId(mapId), name: String(d.name || ''), uid: d.uid || '', state: DocsDoodads.States.name(d, mapId), x, y };
            if (DocsDoodads.api) DocsDoodads.api.emit('touch', { doodad: d, mapId: W.mapId(mapId), x, y });
            const id = Number(t.commonEventId) || 0;
            if (id > 0 && $gameTemp.reserveCommonEvent) {
                $gameTemp.reserveCommonEvent(id);
                ran = true;
            }
        }
        return ran;
    },

    // The player touched tile (x, y): the first touchable doodad there that fits runs.
    tryAt(x, y, kind) {
        if (typeof $gameMap === 'undefined' || !$gameMap) return false;
        if ($gameMap.isEventRunning && $gameMap.isEventRunning()) return false;
        if (typeof $gameTemp !== 'undefined' && $gameTemp && $gameTemp.isCommonEventReserved && $gameTemp.isCommonEventReserved()) return false;
        const doodads = typeof DocsDoodads.doodads === 'function' ? DocsDoodads.doodads() : null;
        if (!doodads || doodads.length === 0) return false;
        const settings = DocsDoodads.Lighting.mapSettings($gameMap.mapId());
        const visible = d => DocsDoodads.Layers.visibleInGame(d, settings) && DocsDoodads.Appearance.isVisible(d, {});
        const found = this.at(x, y, doodads, $gameMap.tileWidth(), $gameMap.tileHeight(), visible).find(d => this.fits(d, kind));
        if (!found) return false;
        // One run per press: Action checks the tile underfoot and the one ahead in the same frame, and
        // pushing against a doodad tries again every frame until the player moves.
        const frame = DocsDoodads.frameCount();
        const p = typeof $gamePlayer !== 'undefined' && $gamePlayer ? { x: $gamePlayer.x, y: $gamePlayer.y } : { x: -1, y: -1 };
        const last = this._last;
        if (last && last.frame === frame) return false;
        if (kind === 'touch' && last && last.d === found && last.kind === 'touch' && last.px === p.x && last.py === p.y) return false;
        this._last = { d: found, kind, frame, px: p.x, py: p.y };
        return this.run(found);
    }
};

if (typeof Game_Player !== 'undefined') {
    const _Game_Player_checkEventTriggerHere = Game_Player.prototype.checkEventTriggerHere;
    Game_Player.prototype.checkEventTriggerHere = function(triggers) {
        if (_Game_Player_checkEventTriggerHere) _Game_Player_checkEventTriggerHere.apply(this, arguments);
        if (this.canStartLocalEvents && !this.canStartLocalEvents()) return;
        const kind = triggers && triggers.includes(0) ? 'action' : 'touch';
        DocsDoodads.Touch.tryAt(this.x, this.y, kind);
    };

    const _Game_Player_checkEventTriggerThere = Game_Player.prototype.checkEventTriggerThere;
    Game_Player.prototype.checkEventTriggerThere = function(triggers) {
        if (_Game_Player_checkEventTriggerThere) _Game_Player_checkEventTriggerThere.apply(this, arguments);
        if (this.canStartLocalEvents && !this.canStartLocalEvents()) return;
        if (!triggers || !triggers.includes(0)) return;
        const dir = this.direction();
        const x2 = $gameMap.roundXWithDirection(this.x, dir);
        const y2 = $gameMap.roundYWithDirection(this.y, dir);
        if (DocsDoodads.Touch.tryAt(x2, y2, 'action')) return;
        // Across a counter, as MZ does for events (a shop's lamp behind the counter).
        if ($gameMap.isCounter && $gameMap.isCounter(x2, y2) && !($gameMap.isAnyEventStarting && $gameMap.isAnyEventStarting())) {
            DocsDoodads.Touch.tryAt($gameMap.roundXWithDirection(x2, dir), $gameMap.roundYWithDirection(y2, dir), 'action');
        }
    };

    const _Game_Player_checkEventTriggerTouch = Game_Player.prototype.checkEventTriggerTouch;
    Game_Player.prototype.checkEventTriggerTouch = function(x, y) {
        if (_Game_Player_checkEventTriggerTouch) _Game_Player_checkEventTriggerTouch.apply(this, arguments);
        if (this.canStartLocalEvents && !this.canStartLocalEvents()) return;
        DocsDoodads.Touch.tryAt(x, y, 'touch');
    };
}

if (typeof PluginManager !== 'undefined' && typeof PluginManager.registerCommand === 'function') {
    PluginManager.registerCommand(pluginName, 'setDoodadState', args => {
        DocsDoodads.WorldState.setState(args.name, args.state, Number(args.mapId) || 0);
    });
    PluginManager.registerCommand(pluginName, 'setDoodadLight', args => {
        const v = String(args.light || 'default');
        DocsDoodads.WorldState.setLight(args.name, v === 'default' ? null : v === 'on', Number(args.mapId) || 0);
    });
    PluginManager.registerCommand(pluginName, 'storeDoodadState', args => {
        const id = Number(args.variableId) || 0;
        if (id <= 0 || typeof $gameVariables === 'undefined') return;
        $gameVariables.setValue(id, DocsDoodads.WorldState.stateIndex(args.name, Number(args.mapId) || 0));
    });
}
