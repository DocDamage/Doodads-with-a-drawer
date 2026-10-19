//==========================================================
// SECTION 15B: FLAT-MAP LAYERS, BLOWING LEAVES AND LIGHTNING (RUNTIME)
//==========================================================
// The map's picture layers (DocsDoodads.MapLayers): backgrounds go just above MZ's parallax, overlays
// just above the tilemap (over characters, under weather and pictures). Leaves blow across the screen
// in a strong wind, and storms flash lightning with thunder after. Flat maps only: the 3D view has its
// own sky, fog and weather.
DocsDoodads.MapLayers.fogBitmap = function() {
    if (this._fog && this._fog.width) return this._fog;
    const size = 512;
    const bitmap = new Bitmap(size, size);
    const ctx = bitmap.context;
    if (ctx && ctx.createRadialGradient) {
        for (const b of this.fogBlobs(size, 26, 7)) {
            // Each blob drawn nine times, shifted by the picture's size, so the edges join up when it repeats.
            for (const dx of [-size, 0, size]) {
                for (const dy of [-size, 0, size]) {
                    const g = ctx.createRadialGradient(b.x + dx, b.y + dy, 0, b.x + dx, b.y + dy, b.r);
                    g.addColorStop(0, `rgba(255,255,255,${b.a})`);
                    g.addColorStop(1, 'rgba(255,255,255,0)');
                    ctx.fillStyle = g;
                    ctx.fillRect(b.x + dx - b.r, b.y + dy - b.r, b.r * 2, b.r * 2);
                }
            }
        }
        if (bitmap._baseTexture && bitmap._baseTexture.update) bitmap._baseTexture.update();
    }
    this._fog = bitmap;
    return bitmap;
};

if (typeof Spriteset_Map !== 'undefined' && typeof PIXI !== 'undefined') {
    $.Spriteset_Map_update_layers2d = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        $.Spriteset_Map_update_layers2d.call(this);
        DocsDoodads.Wind.tick();
        const flat = !DocsDoodads.Perspective.active();
        this.updateDocsLayers2d(flat);
        this.updateDocsLeaves(flat);
        this.updateDocsLightning();
    };

    Spriteset_Map.prototype.updateDocsLayers2d = function(flat) {
        const L = DocsDoodads.MapLayers;
        const list = flat && typeof $gameMap !== 'undefined' && $gameMap ? L.list(DocsDoodads.Lighting.mapSettings($gameMap.mapId())) : [];
        const key = JSON.stringify(list);
        if (key !== this._docsLayersKey) {
            this.docsDestroyLayers2d();
            this._docsLayersKey = key;
            this._docsLayers2d = list.map(layer => {
                const bitmap = layer.image === '#fog' ? L.fogBitmap() : ImageManager.loadParallax(layer.image);
                const sprite = layer.loopX || layer.loopY ? new TilingSprite(bitmap) : new Sprite(bitmap);
                sprite._docsLayer = layer;
                sprite._docsDrift = { x: 0, y: 0 };
                sprite.blendMode = L.blendMode(layer.blend);
                sprite.opacity = Math.round(layer.opacity * 255);
                sprite.scale.x = sprite.scale.y = layer.zoom;
                if (sprite.move && sprite.origin) sprite.move(0, 0, Math.ceil(Graphics.width / layer.zoom) + 1, Math.ceil(Graphics.height / layer.zoom) + 1);
                this.docsPlaceLayer2d(sprite, layer.place);
                return sprite;
            });
        }
        if (!this._docsLayers2d || !this._docsLayers2d.length) return;
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const display = { x: $gameMap.displayX() * tw, y: $gameMap.displayY() * th };
        const wind = DocsDoodads.Wind.current().x;
        for (const sprite of this._docsLayers2d) {
            const layer = sprite._docsLayer;
            sprite._docsDrift.x += layer.scrollX + (layer.wind ? wind * 1.5 : 0);
            sprite._docsDrift.y += layer.scrollY;
            const o = L.origin(layer, display, sprite._docsDrift);
            if (sprite.origin) {
                // A repeating layer: the picture slides under a screen-sized window.
                sprite.origin.x = layer.loopX ? o.x : 0;
                sprite.origin.y = layer.loopY ? o.y : 0;
                sprite.x = layer.loopX ? 0 : -o.x * layer.zoom;
                sprite.y = layer.loopY ? 0 : -o.y * layer.zoom;
            } else {
                sprite.x = -o.x * layer.zoom;
                sprite.y = -o.y * layer.zoom;
            }
        }
    };

    // Backgrounds just above MZ's parallax; overlays just above the tilemap.
    Spriteset_Map.prototype.docsPlaceLayer2d = function(sprite, place) {
        const parent = this._baseSprite;
        if (!parent) return;
        const anchor = place === 'front' ? this._tilemap : this._parallax;
        // After the layers already placed there, so they stack in the order listed.
        const fronts = parent.children.filter(s => s._docsLayer && s._docsLayer.place === place).length;
        const at = anchor && anchor.parent === parent ? parent.children.indexOf(anchor) + 1 + fronts : parent.children.length;
        parent.addChildAt(sprite, Math.min(at, parent.children.length));
    };

    Spriteset_Map.prototype.docsDestroyLayers2d = function() {
        for (const sprite of this._docsLayers2d || []) {
            if (sprite.parent) sprite.parent.removeChild(sprite);
            // The fog picture is shared; parallax pictures belong to MZ's image cache.
            if (sprite.destroy) sprite.destroy({ children: true, texture: false, baseTexture: false });
        }
        this._docsLayers2d = [];
        this._docsLayersKey = null;
    };

    // Leaves blowing across the screen while the wind is strong (World > Weather > Leaves).
    Spriteset_Map.prototype.updateDocsLeaves = function(flat) {
        const W = DocsDoodads.Wind;
        const s = W.settings();
        const wind = W.current();
        const editing = DocsDoodads.Workspace && DocsDoodads.Workspace.mounted;
        const want = flat && s.leaves && !editing ? Math.round(Math.max(0, wind.strength - 0.2) * 40) : 0;
        let box = this._docsLeaves;
        if (!want && !box) return;
        if (!box) {
            box = this._docsLeaves = new PIXI.Container();
            box._docsLeaves = [];
            const at = this._weather && this._weather.parent === this ? this.children.indexOf(this._weather) : this.children.length;
            this.addChildAt(box, at);
        }
        const color = parseInt(String(s.leafColor || '#c27c2c').replace('#', ''), 16) || 0xc27c2c;
        while (box._docsLeaves.length < want) {
            const leaf = new PIXI.Graphics();
            leaf.beginFill(color, 0.9).drawEllipse(0, 0, 4, 2).endFill();
            leaf.x = Math.random() * Graphics.width;
            leaf.y = Math.random() * Graphics.height;
            leaf._docsSpin = (Math.random() - 0.5) * 0.3;
            leaf._docsFall = 0.4 + Math.random() * 0.8;
            box.addChild(leaf);
            box._docsLeaves.push(leaf);
        }
        while (box._docsLeaves.length > want) {
            const leaf = box._docsLeaves.pop();
            box.removeChild(leaf);
            leaf.destroy();
        }
        const t = DocsDoodads.frameCount() / 60;
        for (const leaf of box._docsLeaves) {
            leaf.x += wind.x * 6 + Math.sin(t * 2 + leaf._docsFall * 9) * 0.6;
            leaf.y += leaf._docsFall + Math.cos(t * 3 + leaf._docsSpin * 20) * 0.4;
            leaf.rotation += leaf._docsSpin;
            const w = Graphics.width, h = Graphics.height;
            if (leaf.x < -10) leaf.x += w + 20; else if (leaf.x > w + 10) leaf.x -= w + 20;
            if (leaf.y > h + 10) leaf.y -= h + 20;
        }
        if (!want && box._docsLeaves.length === 0) {
            this.removeChild(box);
            box.destroy({ children: true });
            this._docsLeaves = null;
        }
    };

    // Lightning in storms (World > Weather > Lightning): a flash, then thunder a moment later.
    Spriteset_Map.prototype.updateDocsLightning = function() {
        const L = DocsDoodads.Lightning;
        const s = L.settings();
        const screen = typeof $gameScreen !== 'undefined' ? $gameScreen : null;
        const editing = DocsDoodads.Workspace && DocsDoodads.Workspace.mounted;
        const storm = screen && screen.weatherType && screen.weatherType() === 'storm';
        const bolt = this._docsBolt = this._docsBolt || { wait: 0, thunder: [] };
        for (let i = bolt.thunder.length - 1; i >= 0; i--) {
            const th = bolt.thunder[i];
            if (--th.in > 0) continue;
            bolt.thunder.splice(i, 1);
            if (s.sound && typeof AudioManager !== 'undefined') AudioManager.playSe({ name: s.sound, volume: th.volume, pitch: 90 + Math.round(Math.random() * 20), pan: th.pan });
        }
        if (!s.enabled || !storm || editing) { bolt.wait = 0; return; }
        if (bolt.wait <= 0) { bolt.wait = L.nextIn(s, screen.weatherPower(), Math.random()); return; }
        if (--bolt.wait > 0) return;
        const strike = L.strike(s, Math.random());
        if (screen.startFlash) screen.startFlash([255, 255, 255, strike.flash], 12);
        bolt.thunder.push({ in: Math.max(1, strike.thunderIn), volume: strike.volume, pan: strike.pan });
        bolt.strikes = (bolt.strikes || 0) + 1;
        bolt.wait = L.nextIn(s, screen.weatherPower(), Math.random());
    };
}

if (typeof PluginManager !== 'undefined' && typeof PluginManager.registerCommand === 'function') {
    PluginManager.registerCommand(pluginName, 'setWind', args => {
        const strength = String(args.strength || '').trim().toLowerCase() === 'world' ? 'world' : Number(args.strength);
        DocsDoodads.Wind.set(strength, Number(args.duration) || 0, String(args.direction || 'same'));
    });
}
