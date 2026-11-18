//==========================================================
// SECTION 5V: MAP ERAS (8.4.5)
//==========================================================
// One map in several versions (whole, burning, ruined; now and ten years on). $dataDocsDoodads.eras[mapId] =
// { list: [{ id, name }], pick: { switchId } | { variableId } }: with a switch, off is the first era and on the second;
// with a variable, its value is the era's number (0 the first). A doodad with `eras: [ids]` shows only in those;
// one without shows in every era. Collision and lights follow what shows. When the era changes on the map, the
// doodads crossfade. Tiles stay the same in every era (a second set of map tiles would be needed).
DocsDoodads.Eras = {
    fadeFrames: 30,
    _fade: null,
    _editing: null,
    onion: 0.25,

    of(mapId) {
        const data = typeof window !== 'undefined' && window.$dataDocsDoodads;
        const e = data && data.eras && data.eras[mapId];
        if (!e || !Array.isArray(e.list) || !e.list.length) return null;
        const list = e.list.filter(x => x && x.id).map(x => ({ id: String(x.id), name: String(x.name || x.id) }));
        if (!list.length) return null;
        const pick = e.pick && typeof e.pick === 'object' ? e.pick : {};
        return { list, pick: { switchId: Math.max(0, Math.floor(Number(pick.switchId) || 0)), variableId: Math.max(0, Math.floor(Number(pick.variableId) || 0)) } };
    },

    // The era showing: by the variable, else the switch, else the first.
    current(mapId, switchValue, variableValue) {
        const e = this.of(mapId);
        if (!e) return null;
        let n = 0;
        if (e.pick.variableId > 0 && variableValue) n = Math.floor(Number(variableValue(e.pick.variableId)) || 0);
        else if (e.pick.switchId > 0 && switchValue) n = switchValue(e.pick.switchId) ? 1 : 0;
        return e.list[Math.max(0, Math.min(e.list.length - 1, n))].id;
    },

    visible(d, era) {
        if (!d || !Array.isArray(d.eras) || !d.eras.length || !era) return true;
        return d.eras.includes(era);
    },

    // The era for the map on screen (the editor's own pick while editing).
    live() {
        if (typeof $gameMap === 'undefined' || !$gameMap || !$gameMap.mapId) return null;
        const mapId = $gameMap.mapId();
        if (DocsDoodads.Workspace && DocsDoodads.Workspace.mounted && this._editing && this._editing.mapId === mapId) return this._editing.era;
        const sw = id => (typeof $gameSwitches !== 'undefined' && $gameSwitches ? $gameSwitches.value(id) : false);
        const vr = id => (typeof $gameVariables !== 'undefined' && $gameVariables ? $gameVariables.value(id) : 0);
        return this.current(mapId, sw, vr);
    },

    // Steps the crossfade once a frame: { from, to, t }.
    step() {
        const era = this.live(), mapId = typeof $gameMap !== 'undefined' && $gameMap ? $gameMap.mapId() : 0;
        const f = this._fade;
        if (!f || f.mapId !== mapId) { this._fade = { mapId, from: era, to: era, t: 1 }; return this._fade; }
        if (era !== f.to) { f.from = f.t >= 1 ? f.to : f.from; f.to = era; f.t = 0; }
        if (f.t < 1) f.t = Math.min(1, f.t + 1 / this.fadeFrames);
        return f;
    },

    // How much of a doodad shows during a crossfade (1 outside one).
    alpha(d) {
        const f = this._fade;
        if (!f || f.t >= 1 || !d || !Array.isArray(d.eras) || !d.eras.length) return 1;
        const inFrom = d.eras.includes(f.from), inTo = d.eras.includes(f.to);
        if (inFrom && inTo) return 1;
        return inTo ? f.t : inFrom ? 1 - f.t : 0;
    },

    // Shown in the game now: in the era, or fading out of the last one.
    shown(d) {
        if (!d || !Array.isArray(d.eras) || !d.eras.length) return true;
        const f = this._fade, era = f ? f.to : this.live();
        if (this.visible(d, era)) return true;
        return Boolean(f && f.t < 1 && this.visible(d, f.from));
    }
};

