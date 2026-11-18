//==========================================================
// SECTION 7R2: A WORLD THAT REMEMBERS ON THE MAP (8.4.2)
//==========================================================
// Once a frame: when the calendar day changes (and when a map is first shown), growing doodads step on and wear
// eases down. Worn tiles are drawn as soft patches of the path colour under the characters, made again only when
// a step changes them; footprints fade where they were left. Flat maps.
(function() {
    if (typeof Spriteset_Map === 'undefined' || typeof PIXI === 'undefined') return;
    const G = DocsDoodads.Growth, W = DocsDoodads.Wear;

    Spriteset_Map.prototype.updateDocsRemember = function() {
        if (typeof $gameMap === 'undefined' || !$gameMap || (DocsDoodads.Workspace && DocsDoodads.Workspace.mounted)) return;
        const mapId = $gameMap.mapId(), today = DocsDoodads.Calendar.day();
        if (this._docsGrowDay !== today || this._docsGrowMap !== mapId) {
            this._docsGrowDay = today; this._docsGrowMap = mapId;
            if (G.update(mapId, today) && DocsDoodads.api && DocsDoodads.api.refresh) DocsDoodads.api.refresh();
        }
        const ms = DocsDoodads.Lighting.mapSettings(mapId);
        const s = ms && ms.remember ? W.settings(ms) : null;
        this.docsDrawWear(s && s.wear ? s : null, mapId, today);
        this.docsDrawPrints(s && s.trails ? s : null);
    };

    Spriteset_Map.prototype.docsDrawWear = function(s, mapId, today) {
        let g = this._docsWearLayer;
        if (!s || this._docs3d) { if (g) g.visible = false; return; }
        const grid = W.grid(mapId, $gameMap.width(), $gameMap.height());
        if (today > 0) {
            if (grid.day > 0 && today > grid.day) { W.ease(grid.data, Math.min(30, today - grid.day)); grid.version++; }
            grid.day = today;
        }
        const parent = this._tilemap || this._baseSprite;
        if (!g) { g = this._docsWearLayer = new PIXI.Graphics(); g.z = 0.5; parent.addChild(g); }
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        if (g._docsVersion !== grid.version || g._docsGrid !== grid) {
            g._docsVersion = grid.version; g._docsGrid = grid;
            g.clear();
            const colour = parseInt(String(s.color).slice(1), 16) || 0x7a5c3c;
            let drawn = 0;
            for (let i = 0; i < grid.data.length; i++) {
                const a = W.alpha(grid.data[i], s.threshold);
                if (a < 0.05) continue;
                const x = i % grid.w, y = Math.floor(i / grid.w);
                g.beginFill(colour, a * 0.55);
                g.drawEllipse(x * tw + tw / 2, y * th + th / 2, tw * 0.55, th * 0.5);
                g.endFill();
                drawn++;
            }
            this._docsWearDrawn = drawn;
        }
        g.visible = true;
        g.x = -$gameMap.displayX() * tw;
        g.y = -$gameMap.displayY() * th;
    };

    Spriteset_Map.prototype.docsDrawPrints = function(s) {
        let g = this._docsPrintLayer;
        const prints = W._prints || [];
        if (!s || this._docs3d || !prints.length) { if (g) g.visible = false; if (!s) W._prints = []; return; }
        const parent = this._tilemap || this._baseSprite;
        if (!g) { g = this._docsPrintLayer = new PIXI.Graphics(); g.z = 0.55; parent.addChild(g); }
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        g.clear();
        for (const p of prints) {
            p.age++;
            const a = Math.max(0, 1 - p.age / p.life);
            if (!a) continue;
            const across = p.d === 2 || p.d === 8;
            const side = (p.left ? -1 : 1) * (across ? tw * 0.12 : th * 0.12);
            const cx = p.x * tw + tw / 2 + (across ? side : 0), cy = p.y * th + th * 0.7 + (across ? 0 : side);
            g.beginFill(0x000000, 0.3 * a);
            g.drawEllipse(cx, cy, across ? tw * 0.08 : tw * 0.13, across ? th * 0.13 : th * 0.08);
            g.endFill();
        }
        W._prints = prints.filter(p => p.age < p.life);
        g.visible = true;
        g.x = -$gameMap.displayX() * tw;
        g.y = -$gameMap.displayY() * th;
    };

    DocsDoodads.spritesetSteps.push('updateDocsRemember');
})();
