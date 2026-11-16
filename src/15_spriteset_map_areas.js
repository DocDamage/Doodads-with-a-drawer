if (typeof Spriteset_Map !== 'undefined') {
    Spriteset_Map.prototype.updateDocsAreas = function() {
        if (typeof $gameMap === 'undefined' || !$gameMap || typeof $gamePlayer === 'undefined' || !$gamePlayer) return;
        if (DocsDoodads.Workspace && DocsDoodads.Workspace.mounted) { this._docsAreaState = null; return; }
        const mapId = $gameMap.mapId(), settings = DocsDoodads.Lighting.mapSettings(mapId);
        if (!settings || !Array.isArray(settings.areas) || !settings.areas.length) return;
        let state = this._docsAreaState;
        if (!state || state.mapId !== mapId || state.settings !== settings) {
            const system = typeof $gameSystem !== 'undefined' ? $gameSystem : null;
            const all = system ? (system._docsAreasSeen = system._docsAreasSeen || {}) : {};
            state = this._docsAreaState = { mapId, settings, seen: all[mapId] = all[mapId] || {} };
        }
        const region = $gameMap.regionId($gamePlayer.x, $gamePlayer.y);
        const area = DocsDoodads.Areas.changed(state, region, DocsDoodads.frameCount());
        if (!area) return;
        DocsDoodads.api.emit('areaEnter', { mapId, region, name: String(area.name) });
        const scene = typeof SceneManager !== 'undefined' ? SceneManager._scene : null;
        const banner = scene && scene._mapNameWindow;
        if (banner && typeof banner.open === 'function') {
            banner._docsAreaName = String(area.name);
            banner.open();
        }
    };
}
if (typeof Window_MapName !== 'undefined' && typeof Window_MapName.prototype.refresh === 'function') {
    const refreshMapNameBeforeAreas = Window_MapName.prototype.refresh;
    Window_MapName.prototype.refresh = function() {
        if (this._docsAreaName === undefined) return refreshMapNameBeforeAreas.call(this);
        this.contents.clear();
        const text = this._docsAreaName, width = this.innerWidth;
        this.drawBackground(0, 0, width, this.lineHeight());
        const size = this.textSizeEx(text);
        this.drawTextEx(text, Math.max(0, (width - size.width) / 2), 0, width);
    };
}
