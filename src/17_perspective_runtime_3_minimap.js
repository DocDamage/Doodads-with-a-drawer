//==========================================================
// SECTION 7I: PERSPECTIVE (3D) RUNTIME: THE MINIMAP AND THE EXPLORED MAP
//==========================================================
// The current map as minimap pixels (cached per map).
DocsDoodads.Minimap.forCurrentMap = function() {
    if (typeof $gameMap === 'undefined' || !$gameMap || typeof $dataMap === 'undefined' || !$dataMap) return null;
    if (this._map && this._map.data === $dataMap.data) return this._map;
    const w = $gameMap.width(), h = $gameMap.height();
    const tileset = $gameMap.tileset ? $gameMap.tileset() : null;
    const flags = (tileset && tileset.flags) || [];
    const world = DocsDoodads.World.settings().reflections;
    const isWaterTile = id => (typeof Tilemap !== 'undefined' && Tilemap.isWaterTile ? Tilemap.isWaterTile(id) : false);
    const grid = DocsDoodads.Terrain.grid(true);
    const pixels = this.pixels(w, h, (x, y) => {
        const layers = [0, 1, 2, 3].map(z => $gameMap.tileId(x, y, z));
        const water = DocsDoodads.Reflection.isWaterAt(layers, $gameMap.regionId(x, y), world, isWaterTile);
        const blocked = !water && ![2, 4, 6, 8].some(d => $gameMap.isPassable(x, y, d));
        const base = layers[1] || layers[0];
        const forest = tileset && tileset.mode === 0 && (((flags[base] || 0) & 0x800) !== 0);
        const object = DocsDoodads.StandTiles.isObjectTile(layers[2]) || DocsDoodads.StandTiles.isObjectTile(layers[3]);
        return { water, blocked, forest, object, height: grid ? DocsDoodads.Terrain.tileHeight(grid, x, y) : 0 };
    });
    this._map = { data: $dataMap.data, width: w, height: h, pixels };
    return this._map;
};

DocsDoodads.Minimap.canvasFor = function(pixels, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    this.paint(canvas, pixels, width, height);
    return canvas;
};

DocsDoodads.Minimap.paint = function(canvas, pixels, width, height) {
    const ctx = canvas.getContext('2d');
    const image = ctx.createImageData(width, height);
    image.data.set(pixels);
    ctx.putImageData(image, 0, 0);
};

// The minimap's settings for a map: { on, fog, radius, size }.
DocsDoodads.Minimap.settingsFor = function(mapId) {
    const world = DocsDoodads.World.settings().minimap || {};
    const own = (DocsDoodads.Lighting.mapSettings(mapId) || {}).minimap;
    const s3d = DocsDoodads.Perspective.active();
    const on = s3d ? Boolean(s3d.minimap) : own === 'on' || (own !== 'off' && Boolean(world.flat));
    return { on, fog: Boolean(world.fog), radius: Math.max(1, Number(world.radius) || 6), size: Math.max(60, Math.min(400, Number(world.size) || 140)) };
};

// The Explored Map command. Another map's size is read from its file once it has been visited (its
// explored bits know it); the current map's from the game.
DocsDoodads.Minimap.exploredCommand = function(args) {
    if (typeof $gameMap === 'undefined' || !$gameMap) return false;
    const E = DocsDoodads.Explored;
    const mapId = Number(args.mapId) || $gameMap.mapId();
    let w = $gameMap.width(), h = $gameMap.height();
    if (mapId !== $gameMap.mapId()) {
        const saved = (E.system() && E.system()._docsExplored && E.system()._docsExplored[mapId]) || E._maps[mapId];
        if (!saved) return false;
        w = saved.w; h = saved.h;
    }
    const action = String(args.action || 'all');
    if (action === 'forget') E.forget(mapId, w, h);
    else if (action === 'around') E.reveal(mapId, w, h, $gamePlayer.x, $gamePlayer.y, Number(args.radius) || 8);
    else E.revealAll(mapId, w, h);
    return true;
};

// Reveals around the player when they reach a new tile (the explored map is kept in the save).
DocsDoodads.Minimap.explore = function(map, cfg) {
    if (typeof $gamePlayer === 'undefined' || !$gamePlayer) return 0;
    const key = $gameMap.mapId() + ':' + $gamePlayer.x + ',' + $gamePlayer.y + ':' + cfg.radius;
    if (this._lastExplore === key) return 0;
    this._lastExplore = key;
    return DocsDoodads.Explored.reveal($gameMap.mapId(), map.width, map.height, $gamePlayer.x, $gamePlayer.y, cfg.radius).length;
};

if (typeof Spriteset_Map !== 'undefined' && typeof PIXI !== 'undefined') {
    // A small map in the top-right corner with the player's arrow, on maps that ask for it (3D maps by
    // their 3D settings, flat maps by World > Minimap or their own choice). With fog of war, only what
    // the player has been near shows, and walking reveals more.
    Spriteset_Map.prototype.updateDocsMinimap = function() {
        const M = DocsDoodads.Minimap;
        const cfg = M.settingsFor($gameMap.mapId());
        const map = cfg.on || cfg.fog ? M.forCurrentMap() : null;
        if (map && cfg.fog) M.explore(map, cfg);
        const hidden = typeof $gameSystem !== 'undefined' && $gameSystem && $gameSystem._docsMinimapHidden;
        const on = cfg.on && Boolean(map) && !hidden && !(DocsDoodads.Workspace && DocsDoodads.Workspace.mounted);
        if (!on) {
            if (this._docsMinimap) this._docsMinimap.visible = false;
            return;
        }
        let mini = this._docsMinimap;
        if (!mini || mini._docsData !== map.data || mini._docsSize !== cfg.size || mini._docsFog !== cfg.fog) {
            this.docsDestroyMinimap();
            mini = this._docsMinimap = new PIXI.Container();
            mini._docsData = map.data;
            mini._docsSize = cfg.size;
            mini._docsFog = cfg.fog;
            mini._docsVersion = -1;
            // Its own picture (not in PIXI's shared cache), freed with the minimap.
            mini._docsCanvas = M.canvasFor(map.pixels, map.width, map.height);
            const base = new PIXI.BaseTexture(mini._docsCanvas, { scaleMode: PIXI.SCALE_MODES.NEAREST });
            mini._docsBase = base;
            const pic = new PIXI.Sprite(new PIXI.Texture(base));
            const scale = cfg.size / Math.max(map.width, map.height);
            pic.scale.set(scale);
            const frame = new PIXI.Graphics();
            frame.lineStyle(2, 0x0f172a, 0.9).drawRect(-1, -1, map.width * scale + 2, map.height * scale + 2);
            const arrow = new PIXI.Graphics();
            arrow.beginFill(0xffffff).lineStyle(1, 0x000000, 0.9).moveTo(0, -5).lineTo(4, 4).lineTo(-4, 4).closePath().endFill();
            mini.addChild(pic, frame, arrow);
            mini._docsScale = scale;
            mini._docsArrow = arrow;
            mini.alpha = 0.9;
            this.addChild(mini);
        }
        // Newly seen tiles: the picture is drawn again with the fog.
        if (cfg.fog) {
            const seen = DocsDoodads.Explored.entry($gameMap.mapId(), map.width, map.height);
            if (seen.version !== mini._docsVersion) {
                mini._docsVersion = seen.version;
                M.paint(mini._docsCanvas, M.withFog(map.pixels, map.width, map.height, seen), map.width, map.height);
                if (mini._docsBase && mini._docsBase.update) mini._docsBase.update();
            }
        }
        const sc = mini._docsScale;
        mini.visible = true;
        mini.x = Graphics.width - map.width * sc - 12;
        // Below MZ's menu button when Touch UI shows it.
        mini.y = typeof ConfigManager !== 'undefined' && ConfigManager.touchUI ? 64 : 12;
        const arrow = mini._docsArrow;
        arrow.x = ($gamePlayer._realX + 0.5) * sc;
        arrow.y = ($gamePlayer._realY + 0.5) * sc;
        arrow.rotation = { 2: Math.PI, 4: -Math.PI / 2, 6: Math.PI / 2, 8: 0 }[$gamePlayer.direction()] || 0;
    };

    Spriteset_Map.prototype.docsDestroyMinimap = function() {
        const mini = this._docsMinimap;
        this._docsMinimap = null;
        if (!mini || mini._destroyed) return;
        if (mini.parent) mini.parent.removeChild(mini);
        mini.destroy({ children: true, texture: true, baseTexture: true });
    };
}

