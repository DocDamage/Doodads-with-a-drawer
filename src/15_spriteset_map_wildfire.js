//==========================================================
// SECTION 7E: ELEMENTS ON THE MAP (8.4.3)
//==========================================================
// The grid steps four times a second while the map has elements on. Burning tiles are drawn as flickering flames
// and give light; burnt tiles darken; puddles sit where it stays wet. A doodad marked Burns goes to its Burnt
// state when its tile burns out. Flat maps.
(function() {
    if (typeof Spriteset_Map === 'undefined' || typeof PIXI === 'undefined') return;
    const El = DocsDoodads.Elements;

    Spriteset_Map.prototype.updateDocsElements = function() {
        if (typeof $gameMap === 'undefined' || !$gameMap) return;
        const mapId = $gameMap.mapId(), s = El.settings(DocsDoodads.Lighting.mapSettings(mapId));
        let layer = this._docsElementsLayer;
        if (!s.enabled || this._docs3d || (DocsDoodads.Workspace && DocsDoodads.Workspace.mounted)) {
            if (layer) layer.visible = false;
            this._docsFireLights = null;
            return;
        }
        const g = El.current() || El.build(mapId);
        if ((DocsDoodads.frameCount() % El.every) === 0) {
            const screen = typeof $gameScreen !== 'undefined' ? $gameScreen : null;
            const type = screen && screen.weatherType ? screen.weatherType() : 'none';
            const rain = type === 'rain' || type === 'storm' ? Math.min(1, (screen.weatherPower() || 0) / 9 + 0.2) : 0;
            const wx = DocsDoodads.Wind.current().x || 0;
            const T = DocsDoodads.Terrain;
            const grid = T && T.grid ? T.grid() : null;
            const height = grid && grid.max > 0 ? (x, y) => T.tileHeight(grid, x, y) : null;
            const r = El.step(g, { wind: { x: wx, y: 0 }, rain, height, rng: g.rng, sources: g.sources, wells: g.wells });
            for (const i of r.out) for (const d of g.burners.get(i) || []) {
                const burnt = (DocsDoodads.States.list(d) || []).findIndex(st => st && /burnt/i.test(String(st.name || '')));
                if (burnt >= 0) DocsDoodads.WorldState.setState(d, burnt, mapId);
            }
            if (r.out.length && DocsDoodads.api && DocsDoodads.api.refresh) DocsDoodads.api.refresh();
        }
        this.docsDrawElements(g);
    };

    Spriteset_Map.prototype.docsDrawElements = function(g) {
        const parent = this._tilemap || this._baseSprite;
        let layer = this._docsElementsLayer;
        if (!layer) {
            layer = this._docsElementsLayer = new PIXI.Container();
            layer.z = 0.6;
            layer._ground = new PIXI.Graphics(); layer._flames = new PIXI.Graphics(); layer._flames.z = 4;
            layer.addChild(layer._ground);
            parent.addChild(layer);
            parent.addChild(layer._flames);
        }
        layer.visible = true; layer._flames.visible = true;
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight(), t = DocsDoodads.frameCount() / 60;
        const ox = -$gameMap.displayX() * tw, oy = -$gameMap.displayY() * th;
        const ground = layer._ground, flames = layer._flames;
        ground.clear(); flames.clear();
        const lights = [];
        for (let i = 0; i < g.burn.length; i++) {
            const x = i % g.w, y = Math.floor(i / g.w);
            if (g.burnt[i]) { ground.beginFill(0x1a1410, 0.45); ground.drawRect(x * tw, y * th, tw, th); ground.endFill(); }
            if (g.puddle[i] > 8) { ground.beginFill(0x7090b0, Math.min(0.4, g.puddle[i] / 60)); ground.drawEllipse(x * tw + tw / 2, y * th + th * 0.6, tw * 0.4, th * 0.22); ground.endFill(); }
            if (!g.burn[i]) continue;
            const f = 0.7 + 0.3 * Math.sin(t * 13 + i * 1.7);
            flames.beginFill(0xff6a1a, 0.8); flames.drawEllipse(x * tw + tw / 2, y * th + th * 0.7, tw * 0.3 * f, th * 0.45 * f); flames.endFill();
            flames.beginFill(0xffd25a, 0.85); flames.drawEllipse(x * tw + tw / 2, y * th + th * 0.78, tw * 0.15 * f, th * 0.25 * f); flames.endFill();
            if (lights.length < 24) {
                const p = DocsDoodads.mapToScreen(x * tw + tw / 2, y * th + th / 2);
                lights.push({ x: p.x, y: p.y, mapX: x * tw + tw / 2, mapY: y * th + th / 2, radius: 90, color: 0xff8a30, intensity: 0.9, seed: i, flicker: 0.35, glow: 0,
                    shape: 'point', occlude: false, fire: true });
            }
        }
        ground.x = flames.x = ox; ground.y = flames.y = oy;
        this._docsFireLights = lights;
    };

    // Burning tiles light the map.
    const add = Spriteset_Map.prototype.docsAddFlashlight;
    Spriteset_Map.prototype.docsAddFlashlight = function(lights) {
        const out = add ? add.call(this, lights) || lights : lights;
        for (const l of this._docsFireLights || []) out.push(l);
        return out;
    };

    DocsDoodads.spritesetSteps.push('updateDocsElements');
})();
