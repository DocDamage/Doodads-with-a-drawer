if (typeof Spriteset_Map !== 'undefined') {
    Spriteset_Map.prototype.updateDocsNear = function() {
        if (typeof $gameMap === 'undefined' || !$gameMap || typeof $gamePlayer === 'undefined' || !$gamePlayer) return;
        if (DocsDoodads.Workspace && DocsDoodads.Workspace.mounted) { this._docsNearData = null; return; }
        const mapId = $gameMap.mapId(), data = DocsDoodads.doodads() || [];
        if (this._docsNearMap !== mapId || this._docsNearData !== data || this._docsNearLength !== data.length) {
            this._docsNearMap = mapId; this._docsNearData = data; this._docsNearLength = data.length;
            this._docsNearEntries = data.filter(d => d && d.near && Number(d.near.range) > 0).map(d => ({ doodad: d, inside: false, active: false }));
            this._docsNearTick = 0;
        }
        if (!this._docsNearEntries.length || ++this._docsNearTick % 6 !== 0) return;
        const N = DocsDoodads.Near, W = DocsDoodads.WorldState;
        const settings = DocsDoodads.Lighting.mapSettings(mapId);
        const loop = { w: $gameMap.isLoopHorizontal() ? $gameMap.width() : 0, h: $gameMap.isLoopVertical() ? $gameMap.height() : 0 };
        for (const entry of this._docsNearEntries) {
            const d = entry.doodad;
            const visible = DocsDoodads.Layers.visibleInGame(d, settings) && DocsDoodads.Appearance.isVisible(d, {});
            const inside = visible && N.inside(d, $gamePlayer._realX === undefined ? $gamePlayer.x : $gamePlayer._realX,
                $gamePlayer._realY === undefined ? $gamePlayer.y : $gamePlayer._realY, $gameMap.tileWidth(), $gameMap.tileHeight(), loop, entry.inside);
            const transition = N.step(entry.inside, inside);
            entry.inside = inside;
            if (!transition) continue;
            if (transition === 'enter') {
                const key = W.key(mapId, W.idOf(d));
                const system = typeof $gameSystem !== 'undefined' ? $gameSystem : null;
                if (d.near.once && system) {
                    const once = system._docsNearOnce = system._docsNearOnce || {};
                    if (once[key]) { entry.active = false; continue; }
                    once[key] = true;
                }
                entry.active = true;
            } else {
                if (!entry.active) continue;
                entry.active = false;
            }
            N.run(d, transition, mapId);
        }
    };
}
