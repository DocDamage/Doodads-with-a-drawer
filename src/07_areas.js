// Region names: entry settles for twelve frames before a banner is shown.
DocsDoodads.Areas = {
    at(mapSettings, regionId) {
        const list = mapSettings && mapSettings.areas;
        if (!Array.isArray(list)) return null;
        return list.find(a => a && Number(a.region) === Number(regionId) && String(a.name || '').trim()) || null;
    },
    changed(state, regionId, frame) {
        if (!state || !state.settings || !Array.isArray(state.settings.areas) || !state.settings.areas.length) return null;
        const id = Number(regionId) || 0;
        if (state.pending !== id) { state.pending = id; state.since = frame; return null; }
        if (state.current === id || frame - state.since < 12) return null;
        state.current = id;
        const area = this.at(state.settings, id);
        if (!area) return null;
        const seen = state.seen = state.seen || {};
        if (area.once && seen[id]) return null;
        seen[id] = true;
        return area;
    },
    current() {
        if (typeof $gameMap === 'undefined' || !$gameMap || typeof $gamePlayer === 'undefined' || !$gamePlayer) return null;
        return this.at(DocsDoodads.Lighting.mapSettings($gameMap.mapId()), $gameMap.regionId($gamePlayer.x, $gamePlayer.y));
    }
};
if (typeof PluginManager !== 'undefined' && typeof PluginManager.registerCommand === 'function') {
    PluginManager.registerCommand(pluginName, 'storeAreaName', args => {
        const id = Number(args.variableId) || 0;
        if (id > 0 && typeof $gameVariables !== 'undefined' && $gameVariables) $gameVariables.setValue(id, DocsDoodads.api.area());
    });
}
