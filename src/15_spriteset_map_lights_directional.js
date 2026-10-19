//==========================================================
// SECTION 15C: CONE LIGHTS, THE FLASHLIGHT AND WALL SHADOWS (RUNTIME)
//==========================================================
// updateDocsLighting asks these for the flashlight (docsAddFlashlight), each light's picture
// (docsShapeLight: a soft disc, or a cone pointing its way) and, on flat maps, a mask of where walls let
// it reach (docsMaskLight, from DocsDoodads.Occlusion; outlines are kept while nothing moves).
DocsDoodads.Lighting.coneTexture = function(spread) {
    const key = Math.max(5, Math.min(180, Math.round((Number(spread) || 60) / 5) * 5));
    const cache = this._cones = this._cones || {};
    if (cache[key]) return cache[key];
    if (typeof document === 'undefined' || !document.createElement) return null;
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx && ctx.createRadialGradient) {
        const half = key * Math.PI / 360;
        const g = ctx.createRadialGradient(0, size / 2, 0, 0, size / 2, size);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(0.5, 'rgba(255,255,255,0.5)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(0, size / 2);
        ctx.arc(0, size / 2, size, -half, half);
        ctx.closePath();
        ctx.fill();
    }
    cache[key] = DocsDoodads.sharedTexture ? DocsDoodads.sharedTexture(canvas) : null;
    return cache[key];
};

// Tiles that stop light on the current map (cached while the map's tiles and the wall regions stay).
DocsDoodads.Occlusion.wallsFor = function() {
    if (typeof $gameMap === 'undefined' || !$gameMap || typeof $dataMap === 'undefined' || !$dataMap) return null;
    const s = this.settings();
    const c = this._walls;
    if (c && c.data === $dataMap.data && c.regions === s.wallRegions && c.mapId === $gameMap.mapId()) return c;
    const w = $gameMap.width(), h = $gameMap.height();
    const regions = this.regions(s.wallRegions);
    const isWater = id => (typeof Tilemap !== 'undefined' && Tilemap.isWaterTile ? Tilemap.isWaterTile(id) : false);
    const grid = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            // Water can't be walked on but light crosses it; only what stands up (walls, cliffs, trees) blocks.
            const water = isWater($gameMap.tileId(x, y, 0)) || isWater($gameMap.tileId(x, y, 1));
            const blocked = !water && ![2, 4, 6, 8].some(d => $gameMap.isPassable(x, y, d));
            grid[y * w + x] = blocked || regions.has($gameMap.regionId(x, y)) ? 1 : 0;
        }
    }
    this._walls = { data: $dataMap.data, regions: s.wallRegions, mapId: $gameMap.mapId(), w, h, grid, outlines: new Map() };
    return this._walls;
};

DocsDoodads.Occlusion.outlineFor = function(light, rays) {
    const walls = this.wallsFor();
    if (!walls) return null;
    const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
    const key = [Math.round(light.mapX), Math.round(light.mapY), Math.round(light.radius), light.shape, Math.round(light.angle), Math.round(light.spread), rays].join('|');
    let pts = walls.outlines.get(key);
    if (!pts) {
        const isWall = (x, y) => x < 0 || y < 0 || x >= walls.w || y >= walls.h ? false : walls.grid[y * walls.w + x] === 1;
        pts = this.visibility(light.mapX, light.mapY, light.radius, isWall, tw, th,
            light.shape === 'cone' ? { rays, angle: light.angle, spread: light.spread } : { rays });
        // Moving lights (the flashlight) make new outlines every few steps; old ones are let go.
        if (walls.outlines.size > 400) walls.outlines.clear();
        walls.outlines.set(key, pts);
    }
    return pts;
};

if (typeof Spriteset_Map !== 'undefined' && typeof PIXI !== 'undefined') {
    Spriteset_Map.prototype.docsAddFlashlight = function(lights) {
        const F = DocsDoodads.Flashlight;
        const switchValue = id => (typeof $gameSwitches !== 'undefined' && $gameSwitches ? $gameSwitches.value(id) : false);
        if (this._docs3d || typeof $gamePlayer === 'undefined' || !$gamePlayer || !F.isOn(switchValue)) return lights;
        if ($gamePlayer.isTransparent && $gamePlayer.isTransparent()) return lights;
        const s = F.settings();
        const target = F.angleFor($gamePlayer.direction());
        this._docsFlashAngle = this._docsFlashAngle === undefined ? target : F.turn(this._docsFlashAngle, target);
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        lights.push({
            doodad: null, flashlight: true,
            x: $gamePlayer.screenX(), y: $gamePlayer.screenY() - th / 2,
            mapX: ($gamePlayer._realX + 0.5) * tw, mapY: ($gamePlayer._realY + 0.5) * th,
            radius: Math.max(16, Number(s.radius) || 280), color: DocsDoodads.Lighting.parseColor(s.color, 0xfff2cc),
            intensity: Math.max(0, Math.min(1, Number(s.intensity) || 0.9)), flicker: 0, glow: 0.05, seed: 0,
            shape: 'cone', angle: this._docsFlashAngle, spread: Math.max(5, Math.min(180, Number(s.spread) || 50)),
            occlude: s.occlude ? 'on' : 'off'
        });
        return lights;
    };

    // The disc, or a cone from its tip pointing the light's way.
    Spriteset_Map.prototype.docsShapeLight = function(sprite, light) {
        if (light.shape === 'cone') {
            const tex = DocsDoodads.Lighting.coneTexture(light.spread);
            if (tex && sprite.texture !== tex) sprite.texture = tex;
            sprite.anchor.set(0, 0.5);
            sprite.scale.set(light.radius / 256);
            sprite.rotation = light.angle * Math.PI / 180;
        } else {
            const tex = this.docsLightTexture();
            if (sprite.texture !== tex) sprite.texture = tex;
            sprite.anchor.set(0.5, 0.5);
            sprite.rotation = 0;
        }
    };

    // On flat maps, a light that walls stop only shows inside the outline it can reach.
    Spriteset_Map.prototype.docsMaskLight = function(sprite, light, index) {
        const O = DocsDoodads.Occlusion;
        const pool = this._docsLightMasks = this._docsLightMasks || [];
        const world = O.settings();
        const use = !this._docs3d && !light.screenFixed && O.appliesTo(light, world);
        let g = pool[index];
        if (!use) {
            if (sprite.mask) sprite.mask = null;
            if (g) { g.clear(); g.visible = false; }
            return false;
        }
        const pts = O.outlineFor(light, Math.max(40, Math.min(360, Number(world.rays) || 160)));
        if (!pts) return false;
        if (!g) {
            g = pool[index] = new PIXI.Graphics();
            this._docsLightScene.addChild(g);
        }
        const ox = $gameMap.displayX() * $gameMap.tileWidth(), oy = $gameMap.displayY() * $gameMap.tileHeight();
        const screen = new Array(pts.length);
        for (let i = 0; i < pts.length; i += 2) { screen[i] = pts[i] - ox; screen[i + 1] = pts[i + 1] - oy; }
        g.clear();
        g.beginFill(0xffffff, 1);
        g.drawPolygon(screen);
        g.endFill();
        g.visible = true;
        if (sprite.mask !== g) sprite.mask = g;
        return true;
    };
}

if (typeof PluginManager !== 'undefined' && typeof PluginManager.registerCommand === 'function') {
    PluginManager.registerCommand(pluginName, 'flashlight', args => {
        if (typeof $gameSystem === 'undefined' || !$gameSystem) return;
        const state = String(args.state || 'on');
        $gameSystem._docsFlashlight = state === 'on' ? true : state === 'off' ? false : undefined;
    });
}
