//==========================================================
// SECTION 7: SPRITESET_MAP DOODAD LAYER HOOKS
//==========================================================
// Doodads with a base line need the tilemap's z/y sort; plain sprites keep MZ's default order.
if (typeof Tilemap !== 'undefined' && Tilemap.prototype._compareChildOrder) {
    $.Tilemap__compareChildOrder = Tilemap.prototype._compareChildOrder;
    Tilemap.prototype._compareChildOrder = function(a, b) {
        if (a._docsSortY === undefined && b._docsSortY === undefined) return $.Tilemap__compareChildOrder.call(this, a, b);
        return DocsDoodads.Depth.compareChildren(a, b);
    };
}

if (typeof Spriteset_Map !== 'undefined') {
    $.Spriteset_Map_createLowerLayer = Spriteset_Map.prototype.createLowerLayer;
    Spriteset_Map.prototype.createLowerLayer = function() {
        $.Spriteset_Map_createLowerLayer.call(this);
        this.createDocsDoodadsLayer();
        this.createDocsLighting();
    };

    Spriteset_Map.prototype.createDocsDoodadsLayer = function() {
        this._docsDoodadSprites = [];
        // Sprites go into the tilemap with the characters; a plain container is the fallback.
        if (this._tilemap && typeof this._tilemap.addChild === 'function') {
            this._docsDoodadsContainer = this._tilemap;
        } else {
            this._docsDoodadsContainer = new PIXI.Container();
            this._baseSprite.addChild(this._docsDoodadsContainer);
        }
        this.addDocsDoodads();
    };

    Spriteset_Map.prototype.removeDocsDoodadSprites = function() {
        for (const sprite of this._docsDoodadSprites || []) {
            sprite.destroyShadow();
            if (sprite.parent) sprite.parent.removeChild(sprite);
            sprite.destroy();
        }
        this._docsDoodadSprites = [];
    };

    Spriteset_Map.prototype.addDocsDoodads = function() {
        if (!this._docsDoodadsContainer) return;
        this.removeDocsDoodadSprites();
        const list = DocsDoodads.doodads();
        for (const data of list) {
            if (!data) continue;
            const spr = new Sprite_DocsDoodad(data, this);
            this._docsDoodadsContainer.addChild(spr);
            this._docsDoodadSprites.push(spr);
        }
        this.sortDocsDoodads();
    };

    Spriteset_Map.prototype.sortDocsDoodads = function() {
        if (!this._docsDoodadsContainer) return;
        for (const sprite of this._docsDoodadSprites || []) sprite.updatePlacement();
        // The tilemap re-sorts itself every frame; the fallback container needs an explicit sort.
        if (this._docsDoodadsContainer !== this._tilemap) {
            this._docsDoodadsContainer.children.sort(DocsDoodads.Depth.compareChildren);
        }
    };

    $.Spriteset_Map_update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        this.captureDocsPlayer();
        $.Spriteset_Map_update.call(this);
        if (this._docsDoodadSprites) {
            for (let i = 0; i < this._docsDoodadSprites.length; i++) {
                this._docsDoodadSprites[i].update();
            }
        }
        this.updateDocsLighting();
        this.updateDocsReflections();
        this.updateDocsSilhouette();
        this.updateDocsEditorOverlay();
    };

    Spriteset_Map.prototype.docsPlayerSprite = function() {
        if (typeof $gamePlayer === 'undefined' || !this._characterSprites) return null;
        if (!this._docsPlayerSprite || this._docsPlayerSprite._character !== $gamePlayer) {
            this._docsPlayerSprite = this._characterSprites.find(s => s._character === $gamePlayer) || null;
        }
        return this._docsPlayerSprite;
    };

    // Where the player was drawn last frame, for see-through. Doodads flag _playerHidden as they update.
    Spriteset_Map.prototype.captureDocsPlayer = function() {
        const Atmosphere = DocsDoodads.Atmosphere;
        Atmosphere._playerHidden = false;
        Atmosphere._playerRect = null;
        const sprite = this.docsPlayerSprite();
        if (!sprite || !sprite.visible || !sprite._docsFrame) return;
        const w = sprite._docsFrame.w * Math.abs(sprite.scale.x), h = sprite._docsFrame.h * Math.abs(sprite.scale.y);
        Atmosphere._playerRect = { x: sprite.x - w * 0.5, y: sprite.y - h, w, h, baseY: sprite.y };
    };

    // Water reflections: mirrored copies of characters and doodads, masked to water tiles, with a ripple.
    Spriteset_Map.prototype.updateDocsReflections = function() {
        if (typeof $gameMap === 'undefined' || !$gameMap || !this._tilemap || typeof PIXI === 'undefined') return;
        const settings = DocsDoodads.World.settings().reflections;
        const on = DocsDoodads.Atmosphere.featureOn('reflections')
            && DocsDoodads.Reflection.mapEnabled(settings, DocsDoodads.Lighting.mapSettings($gameMap.mapId()));
        if (!on) {
            if (this._docsReflectLayer) this._docsReflectLayer.visible = false;
            return;
        }
        let layer = this._docsReflectLayer;
        if (!layer) {
            layer = this._docsReflectLayer = new PIXI.Container();
            layer.z = 0.2;
            layer._docsSortY = -1e9;
            layer._docsMask = new PIXI.Graphics();
            layer.addChild(layer._docsMask);
            layer.mask = layer._docsMask;
            layer._docsPool = [];
            try {
                layer._docsRipple = new PIXI.Filter(undefined, DocsDoodads.Motion.shimmerFragment, { time: 0, amount: 0.5 });
                layer._docsRipple.padding = 4;
                layer.filters = [layer._docsRipple];
            } catch (error) {
                layer._docsRipple = null;
            }
        }
        if (layer.parent !== this._tilemap) this._tilemap.addChild(layer);
        const water = this.updateDocsWaterMask(layer, settings);
        layer.visible = water;
        if (!water) return;
        if (layer._docsRipple) {
            layer._docsRipple.uniforms.time = DocsDoodads.frameCount() / 60;
            layer._docsRipple.uniforms.amount = Math.max(0, Math.min(1, Number(settings.ripple) || 0));
        }

        const sources = [];
        for (const sprite of this._characterSprites || []) {
            const ch = sprite._character;
            if (!sprite.visible || !sprite._docsFrameTexture || !ch) continue;
            if (DocsDoodads.CharacterTags.forCharacter(ch).reflect === false) continue;
            const jump = typeof ch.jumpHeight === 'function' ? ch.jumpHeight() : 0;
            const at = { x: sprite.x, y: sprite.y + jump * 2, sy: sprite.scale.y, anchorX: 0.5, alpha: sprite.opacity / 255, rotation: 0 };
            // Gear layers reflect too, behind and in front of the body.
            const gear = (sprite._docsVisualSprites || []).filter(l => l.visible);
            const layer = l => {
                const texture = sprite.docsVisualTexture(l);
                if (texture) sources.push(Object.assign({}, at, { texture, sx: l.scale.x, tint: l.tint }));
            };
            gear.filter(l => l._docsZ < 0).sort((a, b) => a._docsOrder - b._docsOrder).forEach(layer);
            sources.push(Object.assign({}, at, { texture: sprite._docsFrameTexture, sx: sprite.scale.x }));
            gear.filter(l => l._docsZ >= 0).sort((a, b) => a._docsOrder - b._docsOrder).forEach(layer);
        }
        for (const sprite of this._docsDoodadSprites || []) {
            const d = sprite._data;
            if (!sprite.visible || !sprite.texture || !sprite.texture.valid || !DocsDoodads.Reflection.appliesTo(d, settings)) continue;
            const h = sprite.texture.frame.height * Math.abs(sprite.scale.y);
            sources.push({ texture: sprite.texture, x: sprite.x, y: sprite.y + h * (1 - sprite.anchor.y), sx: sprite.scale.x, sy: Math.abs(sprite.scale.y),
                anchorX: sprite.anchor.x, alpha: sprite.alpha, rotation: -sprite.rotation });
        }
        const pool = layer._docsPool;
        while (pool.length < sources.length) {
            const s = new PIXI.Sprite(PIXI.Texture.EMPTY);
            layer.addChild(s);
            pool.push(s);
        }
        const opacity = Math.max(0, Math.min(1, Number(settings.opacity) || 0));
        pool.forEach((s, i) => {
            const src = sources[i];
            s.visible = Boolean(src);
            if (!src) return;
            s.texture = src.texture;
            s.anchor.set(src.anchorX, 1);
            s.x = src.x;
            s.y = src.y;
            s.scale.set(src.sx, -src.sy);
            s.rotation = src.rotation;
            s.alpha = src.alpha * opacity;
            s.tint = src.tint !== undefined ? src.tint : 0xffffff;
        });
    };

    // Rebuilds the water mask when the camera moves; false when no water is on screen.
    Spriteset_Map.prototype.updateDocsWaterMask = function(layer, settings) {
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const key = [$gameMap.mapId(), $gameMap.displayX(), $gameMap.displayY(), settings.regionId, settings.shoreInset, Math.floor(DocsDoodads.frameCount() / 30)].join('|');
        if (layer._docsMaskKey === key) return layer._docsHasWater;
        layer._docsMaskKey = key;
        const ox = Math.floor($gameMap.displayX()), oy = Math.floor($gameMap.displayY());
        const fx = ($gameMap.displayX() - ox) * tw, fy = ($gameMap.displayY() - oy) * th;
        const width = typeof Graphics !== 'undefined' ? Graphics.width : 816;
        const height = typeof Graphics !== 'undefined' ? Graphics.height : 624;
        const cols = Math.ceil(width / tw) + 1, rows = Math.ceil(height / th) + 1;
        const isWaterTile = id => (typeof Tilemap !== 'undefined' && Tilemap.isWaterTile ? Tilemap.isWaterTile(id) : false);
        const rects = DocsDoodads.Reflection.maskRects(cols, rows, (c, r) => {
            const x = $gameMap.roundX(ox + c), y = $gameMap.roundY(oy + r);
            if (!$gameMap.isValid(x, y)) return false;
            const layers = [0, 1, 2, 3].map(z => $gameMap.tileId(x, y, z));
            return DocsDoodads.Reflection.isWaterAt(layers, $gameMap.regionId(x, y), settings, isWaterTile);
        }, tw, th, settings.shoreInset);
        const g = layer._docsMask;
        g.clear();
        g.beginFill(0xffffff, 1);
        for (const rect of rects) g.drawRect(rect.x - fx, rect.y - fy, rect.w, rect.h);
        g.endFill();
        layer._docsHasWater = rects.length > 0;
        return layer._docsHasWater;
    };

    // The player drawn as a tinted outline above everything while hidden behind a doodad.
    Spriteset_Map.prototype.updateDocsSilhouette = function() {
        if (!this._baseSprite || typeof PIXI === 'undefined') return;
        const settings = DocsDoodads.World.settings().seeThrough;
        const sprite = this.docsPlayerSprite();
        const show = DocsDoodads.Atmosphere._playerHidden && settings.mode !== 'fade' && sprite && sprite._docsFrameTexture
            && !(DocsDoodads.Workspace && DocsDoodads.Workspace.mounted);
        let ghost = this._docsSilhouette;
        if (!show) {
            if (ghost) ghost.visible = false;
            return;
        }
        if (!ghost) {
            ghost = this._docsSilhouette = new PIXI.Sprite(PIXI.Texture.EMPTY);
            ghost.anchor.set(0.5, 1);
            try {
                ghost._docsFilter = new PIXI.Filter(undefined, DocsDoodads.SeeThrough.silhouetteFragment, { uColor: [0.5, 0.8, 1], uAlpha: 0.55 });
                ghost.filters = [ghost._docsFilter];
            } catch (error) {
                ghost.tint = 0x7dd3fc;
                ghost.alpha = 0.5;
            }
        }
        if (ghost.parent !== this._baseSprite) this._baseSprite.addChild(ghost);
        const parent = ghost.parent;
        if (this._tilemap && parent.children.indexOf(ghost) < parent.children.indexOf(this._tilemap)) parent.addChild(ghost);
        if (ghost._docsFilter) ghost._docsFilter.uniforms.uColor = DocsDoodads.Lighting.channels(settings.silhouetteColor);
        ghost.texture = sprite._docsFrameTexture;
        ghost.x = sprite.x;
        ghost.y = sprite.y;
        ghost.scale.set(sprite.scale.x, sprite.scale.y);
        ghost.visible = true;
    };

    // Lighting: a lightmap (ambient colour plus additive lights) is rendered off-screen and
    // multiplied over the tilemap, under weather and pictures. Glows add a halo in daylight too.
    Spriteset_Map.prototype.createDocsLighting = function() {
        if (typeof PIXI === 'undefined' || !PIXI.RenderTexture || !this._baseSprite) return;
        this._docsLightScene = new PIXI.Container();
        this._docsLightBase = new PIXI.Sprite(PIXI.Texture.WHITE);
        this._docsLightScene.addChild(this._docsLightBase);
        this._docsLightSprites = [];
        this._docsGlowLayer = new PIXI.Container();
        this._docsGlowSprites = [];
        this._docsLightOverlay = new PIXI.Sprite(PIXI.Texture.EMPTY);
        this._docsLightOverlay.blendMode = PIXI.BLEND_MODES.MULTIPLY;
        this._docsLightOverlay.visible = false;
        this._baseSprite.addChild(this._docsLightOverlay);
        this._baseSprite.addChild(this._docsGlowLayer);
    };

    Spriteset_Map.prototype.docsLightTexture = function() {
        if (!DocsDoodads._lightGradient && typeof document !== 'undefined') {
            const size = 128;
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
            gradient.addColorStop(0, 'rgba(255,255,255,1)');
            gradient.addColorStop(0.45, 'rgba(255,255,255,0.55)');
            gradient.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, size, size);
            DocsDoodads._lightGradient = DocsDoodads.sharedTexture(canvas);
        }
        return DocsDoodads._lightGradient;
    };

    Spriteset_Map.prototype.docsSpritePool = function(pool, layer, count) {
        while (pool.length < count) {
            const sprite = new PIXI.Sprite(this.docsLightTexture());
            sprite.anchor.set(0.5, 0.5);
            sprite.blendMode = PIXI.BLEND_MODES.ADD;
            layer.addChild(sprite);
            pool.push(sprite);
        }
        for (let i = 0; i < pool.length; i++) pool[i].visible = i < count;
    };

    Spriteset_Map.prototype.updateDocsLighting = function() {
        if (!this._docsLightOverlay || typeof $gameMap === 'undefined' || !$gameMap) return;
        const Lighting = DocsDoodads.Lighting;
        const workspace = DocsDoodads.Workspace;
        const fade = typeof $gameSystem !== 'undefined' && $gameSystem ? $gameSystem._docsAmbientFade : null;
        if (fade) {
            Lighting.stepFade(fade);
            if (fade.framesLeft <= 0 && fade.clearWhenDone) $gameSystem._docsAmbientFade = null;
        }
        const switchValue = id => (typeof $gameSwitches !== 'undefined' && $gameSwitches ? $gameSwitches.value(id) : false);
        const world = DocsDoodads.World.settings();
        let ambient = Lighting.resolveAmbient({ world, minutes: DocsDoodads.Atmosphere.minutes(), mapSettings: Lighting.mapSettings($gameMap.mapId()),
            override: fade ? fade.current : null, switchValue });
        if (workspace.mounted && workspace.lightingPreview === false) ambient = { darkness: 0, color: '#000000' };

        const tw = $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
        const th = $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
        const visibleData = (this._docsDoodadSprites || []).filter(s => s.visible).map(s => s._data);
        const lights = Lighting.collect(visibleData, (x, y) => DocsDoodads.mapToScreen(x, y),
            { darkness: ambient.darkness, threshold: world.time.lampThreshold, step: 1 / 30 });
        // In 3D the ground is lit around the lamp's base: the height offset would land the pool behind it.
        if (this._docs3d) {
            for (const l of lights) l.y -= Number(Object.assign({}, Lighting.lightDefaults, l.doodad && l.doodad.light).offsetY) || 0;
        }
        const time = DocsDoodads.frameCount() / 60;

        const glowing = lights.filter(l => l.glow > 0);
        this.docsSpritePool(this._docsGlowSprites, this._docsGlowLayer, glowing.length);
        glowing.forEach((l, i) => {
            const s = this._docsGlowSprites[i];
            s.x = l.x; s.y = l.y;
            s.scale.set((l.radius * 2) / 128);
            s.tint = l.color;
            s.alpha = l.glow * l.intensity * Lighting.flicker(time, l.seed, l.flicker);
        });

        const renderer = DocsDoodads.Compat.getRenderer();
        if (ambient.darkness <= 0.001 || !renderer) {
            this._docsLightOverlay.visible = false;
            this._docsLightInfo = null;
            return;
        }
        const size = this._docs3dSize;
        const w = size ? size.width : typeof Graphics !== 'undefined' ? Graphics.width : 816;
        const h = size ? size.height : typeof Graphics !== 'undefined' ? Graphics.height : 624;
        if (!this._docsLightTexture || this._docsLightTexture.width !== w || this._docsLightTexture.height !== h) {
            if (this._docsLightTexture) this._docsLightTexture.destroy(true);
            this._docsLightTexture = PIXI.RenderTexture.create({ width: w, height: h });
            this._docsLightOverlay.texture = this._docsLightTexture;
        }
        const base = Lighting.lightmapBase(ambient);
        this._docsLightInfo = { base, lights };
        this._docsLightBase.width = w;
        this._docsLightBase.height = h;
        this._docsLightBase.tint = (Math.round(base[0] * 255) << 16) | (Math.round(base[1] * 255) << 8) | Math.round(base[2] * 255);
        this.docsSpritePool(this._docsLightSprites, this._docsLightScene, lights.length);
        lights.forEach((l, i) => {
            const s = this._docsLightSprites[i];
            s.x = l.x; s.y = l.y;
            s.scale.set((l.radius * 2) / 128);
            s.tint = l.color;
            s.alpha = l.intensity * Lighting.flicker(time, l.seed, l.flicker);
        });
        renderer.render(this._docsLightScene, this._docsLightTexture, true);
        this._docsLightOverlay.visible = true;
        // Keep the lightmap directly above the tilemap and doodads after layers are rebuilt.
        const parent = this._docsLightOverlay.parent;
        if (parent && this._tilemap && parent.children.indexOf(this._docsLightOverlay) < parent.children.indexOf(this._tilemap)) {
            parent.addChild(this._docsLightOverlay);
            parent.addChild(this._docsGlowLayer);
        }
    };

    // Editor-only overlay above the doodad layer: placement grid, selection outlines and guides.
    Spriteset_Map.prototype.updateDocsEditorOverlay = function() {
        if (!this._docsDoodadsContainer || typeof PIXI === 'undefined' || !PIXI.Graphics) return;
        if (!this._docsSelectionOutline) {
            this._docsSelectionOutline = new PIXI.Graphics();
            this._baseSprite.addChild(this._docsSelectionOutline);
        }
        const outline = this._docsSelectionOutline;
        outline.clear();
        if (!DocsDoodads.Workspace.mounted) return;
        // Keep the outline above the doodad layer even after the layer is rebuilt.
        if (outline.parent && outline.parent.children[outline.parent.children.length - 1] !== outline) {
            outline.parent.addChild(outline);
        }
        const workspace = DocsDoodads.Workspace;
        if (workspace.gridSnapShow) {
            const size = this._docs3dSize;
            const width = size ? size.width : typeof Graphics !== 'undefined' ? Graphics.width : 816;
            const height = size ? size.height : typeof Graphics !== 'undefined' ? Graphics.height : 624;
            const grid = workspace.placementGridLines(width, height);
            outline.lineStyle(1, 0xffffff, 0.25);
            for (const x of grid.xs) { outline.moveTo(x, 0); outline.lineTo(x, height); }
            for (const y of grid.ys) { outline.moveTo(0, y); outline.lineTo(width, y); }
        }
        for (const rect of this._docs3d ? [] : workspace.selectionScreenRects()) {
            outline.lineStyle(2, 0x38bdf8, 1);
            outline.drawRect(rect.x, rect.y, rect.w, rect.h);
        }
        if (typeof workspace.drawEditorOverlayExtras === 'function') workspace.drawEditorOverlayExtras(outline);
    };
}

// "Set Ambient Light" / "Reset Ambient Light" plugin commands fade the map's darkness.
DocsDoodads.setAmbient = function(target, frames, clearWhenDone) {
    if (typeof $gameSystem === 'undefined' || !$gameSystem || typeof $gameMap === 'undefined' || !$gameMap) return null;
    const Lighting = DocsDoodads.Lighting;
    const switchValue = id => (typeof $gameSwitches !== 'undefined' && $gameSwitches ? $gameSwitches.value(id) : false);
    const current = $gameSystem._docsAmbientFade ? $gameSystem._docsAmbientFade.current
        : DocsDoodads.currentAmbient(switchValue);
    const fade = Lighting.startFade(current, target, frames);
    fade.clearWhenDone = Boolean(clearWhenDone);
    $gameSystem._docsAmbientFade = fade;
    return fade;
};

if (typeof PluginManager !== 'undefined' && typeof PluginManager.registerCommand === 'function') {
    PluginManager.registerCommand(pluginName, 'setAmbient', args => {
        DocsDoodads.setAmbient({
            darkness: Math.max(0, Math.min(100, Number(args.darkness) || 0)) / 100,
            color: args.color || DocsDoodads.Lighting.ambientDefaults.color
        }, Number(args.duration) || 0, false);
    });
    PluginManager.registerCommand(pluginName, 'resetAmbient', args => {
        const switchValue = id => (typeof $gameSwitches !== 'undefined' && $gameSwitches ? $gameSwitches.value(id) : false);
        DocsDoodads.setAmbient(DocsDoodads.currentAmbient(switchValue), Number(args.duration) || 0, true);
    });

    // Time of day, seasons and effect switches.
    PluginManager.registerCommand(pluginName, 'setTime', args => {
        DocsDoodads.setTimeOfDay((Number(args.hour) || 0) * 60 + (Number(args.minute) || 0));
    });
    PluginManager.registerCommand(pluginName, 'addTime', args => {
        const now = DocsDoodads.Atmosphere.minutes();
        DocsDoodads.setTimeOfDay((now === null ? 0 : now) + (Number(args.hours) || 0) * 60 + (Number(args.minutes) || 0));
    });
    PluginManager.registerCommand(pluginName, 'clockControl', args => {
        const clock = DocsDoodads.Atmosphere.clock();
        if (!clock) return;
        if (args.action === 'pause') clock.paused = true;
        else if (args.action === 'resume') clock.paused = false;
        else if (args.action === 'speed') clock.speed = Math.max(0, Number(args.speed) || 0);
        else if (args.action === 'defaultSpeed') clock.speed = null;
    });
    PluginManager.registerCommand(pluginName, 'setSeason', args => {
        DocsDoodads.setSeason(Number(args.season) || 0);
    });
    PluginManager.registerCommand(pluginName, 'setFeature', args => {
        if (typeof $gameSystem === 'undefined' || !$gameSystem) return;
        const off = $gameSystem._docsFeatureOff = $gameSystem._docsFeatureOff || {};
        if (String(args.enabled) === 'false') off[args.feature] = true;
        else delete off[args.feature];
    });
}

// The ambient the map has right now without any plugin-command fade.
DocsDoodads.currentAmbient = function(switchValue) {
    const Lighting = DocsDoodads.Lighting;
    return Lighting.resolveAmbient({ world: DocsDoodads.World.settings(), minutes: DocsDoodads.Atmosphere.minutes(),
        mapSettings: Lighting.mapSettings($gameMap.mapId()), switchValue });
};

// Variable mode writes the variables; otherwise the running clock jumps.
DocsDoodads.setTimeOfDay = function(minutes) {
    const Time = DocsDoodads.TimeOfDay;
    const world = DocsDoodads.World.settings();
    const m = Time.wrap(minutes);
    if (world.time.source === 'variable' && typeof $gameVariables !== 'undefined' && $gameVariables) {
        if (Number(world.time.variableId) > 0) $gameVariables.setValue(Number(world.time.variableId), Math.floor(m / 60));
        if (Number(world.time.minuteVariableId) > 0) $gameVariables.setValue(Number(world.time.minuteVariableId), Math.floor(m % 60));
        return;
    }
    const clock = DocsDoodads.Atmosphere.clock();
    if (!clock) return;
    if (m < clock.minutes) clock.day = (clock.day || 0) + 1;
    clock.minutes = m;
    Time.syncVariables(world, m, (id, value) => { if ($gameVariables.value(id) !== value) $gameVariables.setValue(id, value); });
};

DocsDoodads.setSeason = function(season) {
    const settings = DocsDoodads.World.settings().seasons;
    if (settings.source === 'variable' && Number(settings.variableId) > 0 && typeof $gameVariables !== 'undefined' && $gameVariables) {
        $gameVariables.setValue(Number(settings.variableId), season);
    } else if (typeof $gameSystem !== 'undefined' && $gameSystem) {
        $gameSystem._docsSeason = season;
    }
};

// The clock moves with the map.
if (typeof Game_Map !== 'undefined') {
    $.Game_Map_update = Game_Map.prototype.update;
    Game_Map.prototype.update = function(sceneActive) {
        $.Game_Map_update.call(this, sceneActive);
        DocsDoodads.Atmosphere.update(sceneActive);
    };
}

// Players and events: sun shadows shaped like the sprite, and motion blur.
if (typeof Sprite_Character !== 'undefined' && typeof PIXI !== 'undefined') {
    $.Sprite_Character_update = Sprite_Character.prototype.update;
    Sprite_Character.prototype.update = function() {
        $.Sprite_Character_update.call(this);
        this.updateDocsCharacterFx();
    };

    Sprite_Character.prototype.updateDocsCharacterFx = function() {
        const ch = this._character;
        if (!ch || typeof $gameMap === 'undefined' || !$gameMap) return;
        this.updateDocsFrameTexture();
        const world = DocsDoodads.World.settings();
        const isVehicle = typeof Game_Vehicle !== 'undefined' && ch instanceof Game_Vehicle;
        const playerLike = (typeof Game_Player !== 'undefined' && ch instanceof Game_Player)
            || (typeof Game_Follower !== 'undefined' && ch instanceof Game_Follower);
        const tags = DocsDoodads.CharacterTags.forCharacter(ch);
        const mapSettings = DocsDoodads.Lighting.mapSettings($gameMap.mapId());
        const hasImage = Boolean(this._docsFrameTexture) && this.visible && !(ch.isTransparent && ch.isTransparent())
            && Boolean((ch.characterName && ch.characterName()) || (ch.tileId && ch.tileId() > 0));
        const castShadow = !isVehicle && Boolean(this.parent) && DocsDoodads.Atmosphere.featureOn('characterShadows')
            && !(mapSettings && mapSettings.characterShadows === false)
            && DocsDoodads.CharacterShadow.enabledFor(world.characterShadows, tags, { playerLike, priorityType: ch._priorityType, hasImage });
        if (castShadow) this.updateDocsShadow(world.characterShadows, tags);
        else if (this._docsShadow) this._docsShadow.visible = false;
        this.updateDocsMotionBlur(world.motionBlur, tags, playerLike && !isVehicle);
    };

    // A texture for the whole current frame (the main sprite's frame is empty in tall grass).
    Sprite_Character.prototype.updateDocsFrameTexture = function() {
        const bitmap = this.bitmap;
        const frame = bitmap && bitmap.isReady() ? DocsDoodads.CharacterShadow.frameFor(this) : null;
        const base = bitmap ? (bitmap.baseTexture || bitmap._baseTexture) : null;
        if (!frame || !base) {
            this._docsFrame = null;
            this._docsFrameTexture = null;
            return;
        }
        const last = this._docsFrame;
        if (this._docsFrameTexture && last && this._docsFrameBase === base
            && last.x === frame.x && last.y === frame.y && last.w === frame.w && last.h === frame.h) return;
        const safe = DocsDoodads.safeFrame(frame, bitmap.width, bitmap.height);
        this._docsFrame = frame;
        this._docsFrameBase = base;
        this._docsFrameTexture = new PIXI.Texture(base, new PIXI.Rectangle(safe.x, safe.y, safe.w, safe.h));
    };

    Sprite_Character.prototype.updateDocsShadow = function(settings, tags) {
        let shadow = this._docsShadow;
        if (!shadow) {
            shadow = this._docsShadow = new PIXI.Sprite(PIXI.Texture.EMPTY);
            shadow.anchor.set(0.5, 1);
            shadow.tint = 0x000000;
            shadow.spriteId = this.spriteId;
        }
        if (shadow.parent !== this.parent) this.parent.addChild(shadow);
        const sun = DocsDoodads.Atmosphere.sun();
        const t = DocsDoodads.Sun.transform(sun, DocsDoodads.CharacterShadow.styleFor(settings, tags));
        const ch = this._character;
        const jump = typeof ch.jumpHeight === 'function' ? ch.jumpHeight() : 0;
        const footX = this.x + t.offsetX;
        const footY = this.y + jump + t.offsetY;
        let scaleY = t.scaleY;
        const regions = (settings.occlusionRegions || []).map(Number).filter(n => n > 0);
        if (regions.length > 0 && this._docsFrame) {
            const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
            const blocked = (x, y) => {
                const at = DocsDoodads.screenToMap(x, y);
                return regions.includes($gameMap.regionId(Math.floor(at.x / tw), Math.floor(at.y / th)));
            };
            const full = this._docsFrame.h * scaleY;
            scaleY = DocsDoodads.CharacterShadow.clipLength(footX, footY, sun.angle, full, blocked) / this._docsFrame.h;
        }
        shadow.texture = this._docsFrameTexture;
        shadow.x = footX;
        shadow.y = footY;
        shadow.rotation = t.rotation;
        shadow.scale.set(this.scale.x, scaleY * this.scale.y);
        const alpha = t.alpha * (this.opacity / 255);
        const gear = this.updateDocsShadowGear(shadow);
        shadow.visible = scaleY > 0.02 && alpha > 0.005;
        shadow.z = DocsDoodads.Depth.shadowZ;
        shadow._docsSortY = footY;
        // With gear, the parts are drawn solid and faded once together, so overlaps don't darken twice.
        const fadeOnce = gear > 0 && PIXI.filters && PIXI.filters.AlphaFilter;
        shadow.alpha = fadeOnce ? 1 : alpha;
        if (fadeOnce) {
            shadow._docsFade = shadow._docsFade || new PIXI.filters.AlphaFilter(alpha);
            shadow._docsFade.alpha = alpha;
        }
        const key = t.blur + '|' + Boolean(fadeOnce);
        if (shadow._docsFilterKey !== key) {
            shadow._docsFilterKey = key;
            if (shadow._docsBlur !== t.blur) {
                shadow._docsBlur = t.blur;
                shadow._docsBlurFilter = t.blur > 0 && PIXI.filters && PIXI.filters.BlurFilter ? new PIXI.filters.BlurFilter(Math.min(16, t.blur)) : null;
            }
            const filters = [shadow._docsBlurFilter, fadeOnce ? shadow._docsFade : null].filter(Boolean);
            shadow.filters = filters.length ? filters : null;
        }
    };

    // Gear layers (capes, hats) join the shadow, so it has the shape of what the character wears.
    // Returns how many layers are in it.
    Sprite_Character.prototype.updateDocsShadowGear = function(shadow) {
        const gear = (this._docsVisualSprites || []).filter(sp => sp.visible && sp._docsRect && sp.bitmap && sp.bitmap.isReady());
        const parts = shadow._docsGear = shadow._docsGear || [];
        while (parts.length < gear.length) {
            const part = new PIXI.Sprite(PIXI.Texture.EMPTY);
            part.anchor.set(0.5, 1);
            part.tint = 0x000000;
            part._docsFrames = new Map();
            shadow.addChild(part);
            parts.push(part);
        }
        gear.forEach((sp, i) => {
            const part = parts[i], r = sp._docsRect, base = sp.bitmap.baseTexture || sp.bitmap._baseTexture;
            const frameKey = r.x + ',' + r.y + ',' + r.w + ',' + r.h;
            if (part._docsBase !== base) {
                part._docsBase = base;
                part._docsFrames.clear();
            }
            let texture = part._docsFrames.get(frameKey);
            if (!texture) {
                texture = new PIXI.Texture(base, new PIXI.Rectangle(r.x, r.y, r.w, r.h));
                if (part._docsFrames.size > 32) part._docsFrames.clear();
                part._docsFrames.set(frameKey, texture);
            }
            part.texture = texture;
            // The shadow already has the body's scale; a mirrored layer (8-direction sheets) flips.
            part.scale.set(Math.sign(sp.scale.x || 1) * Math.sign(this.scale.x || 1), 1);
            part.visible = true;
        });
        for (let i = gear.length; i < parts.length; i++) parts[i].visible = false;
        return gear.length;
    };

    Sprite_Character.prototype.updateDocsMotionBlur = function(settings, tags, playerLike) {
        const ch = this._character;
        const optionOn = typeof ConfigManager === 'undefined' || ConfigManager.docsMotionBlur !== false;
        const enabled = DocsDoodads.Atmosphere.featureOn('motionBlur') && DocsDoodads.MotionBlur.enabledFor(settings, tags, playerLike, optionOn)
            && !(DocsDoodads.Workspace && DocsDoodads.Workspace.mounted);
        const real = { x: ch._realX, y: ch._realY };
        let target = { x: 0, y: 0 };
        if (enabled && this._docsLastReal) {
            target = DocsDoodads.MotionBlur.target(real.x - this._docsLastReal.x, real.y - this._docsLastReal.y,
                $gameMap.tileWidth(), $gameMap.tileHeight(), settings.strength);
        }
        this._docsLastReal = real;
        const blur = this._docsBlurVector = DocsDoodads.MotionBlur.step(this._docsBlurVector || { x: 0, y: 0 }, target, 0.5);
        const active = blur.x !== 0 || blur.y !== 0;
        // MZ replaces the filter list when it adds its colour filter, so membership is checked every frame.
        const filters = this.filters ? this.filters.slice() : [];
        const index = this._docsBlurFilter ? filters.indexOf(this._docsBlurFilter) : -1;
        if (!active) {
            if (index >= 0) {
                filters.splice(index, 1);
                this.filters = filters.length ? filters : null;
            }
            return;
        }
        if (!this._docsBlurFilter) {
            try {
                this._docsBlurFilter = new PIXI.Filter(undefined, DocsDoodads.MotionBlur.fragment, { uVelocity: [0, 0] });
                this._docsBlurFilter.padding = DocsDoodads.MotionBlur.maxLength + 2;
            } catch (error) {
                return;
            }
        }
        this._docsBlurFilter.uniforms.uVelocity = [blur.x, blur.y];
        if (index < 0) {
            filters.push(this._docsBlurFilter);
            this.filters = filters;
        }
    };
}

// Post-processing is offered in Options only when the project uses it.
DocsDoodads.PostFX.offeredInOptions = function() {
    const pf = DocsDoodads.World.settings().postfx;
    if (!pf.enabled) return false;
    if (this.isActive(this.normalizeLook(pf.look))) return true;
    const maps = (typeof window !== 'undefined' && window.$dataDocsDoodads && window.$dataDocsDoodads.mapSettings) || {};
    return Object.keys(maps).some(id => maps[id] && maps[id].postfx && maps[id].postfx.mode === 'custom' && this.isActive(this.normalizeLook(maps[id].postfx.look)));
};

// Any map shown in 3D: Effects Quality scales the 3D view down too.
DocsDoodads.Perspective.usedInProject = function() {
    const maps = (typeof window !== 'undefined' && window.$dataDocsDoodads && window.$dataDocsDoodads.mapSettings) || {};
    return Object.keys(maps).some(id => maps[id] && maps[id].perspective && maps[id].perspective.enabled === true);
};

DocsDoodads.fxQualityOffered = function() {
    return DocsDoodads.PostFX.offeredInOptions() || DocsDoodads.Perspective.usedInProject();
};

// Options menu: players can switch motion blur off and lower the effects quality
// (post-processing and the 3D view).
DocsDoodads.fxQualityLabels = ['High', 'Medium', 'Low', 'Off'];
if (typeof ConfigManager !== 'undefined') {
    ConfigManager.docsMotionBlur = true;
    ConfigManager.docsFxQuality = 0;
    $.ConfigManager_makeData = ConfigManager.makeData;
    ConfigManager.makeData = function() {
        const config = $.ConfigManager_makeData.call(this);
        config.docsMotionBlur = this.docsMotionBlur;
        config.docsFxQuality = this.docsFxQuality;
        return config;
    };
    $.ConfigManager_applyData = ConfigManager.applyData;
    ConfigManager.applyData = function(config) {
        $.ConfigManager_applyData.call(this, config);
        this.docsMotionBlur = config && 'docsMotionBlur' in config ? Boolean(config.docsMotionBlur) : true;
        this.docsFxQuality = config && 'docsFxQuality' in config ? Math.max(0, Math.min(3, Number(config.docsFxQuality) || 0)) : 0;
    };
}
DocsDoodads.extraOptionCount = function() {
    return (DocsDoodads.World.settings().motionBlur.enabled ? 1 : 0) + (DocsDoodads.fxQualityOffered() ? 1 : 0);
};
if (typeof Window_Options !== 'undefined') {
    $.Window_Options_addGeneralOptions = Window_Options.prototype.addGeneralOptions;
    Window_Options.prototype.addGeneralOptions = function() {
        $.Window_Options_addGeneralOptions.call(this);
        if (DocsDoodads.World.settings().motionBlur.enabled) this.addCommand('Motion Blur', 'docsMotionBlur');
        if (DocsDoodads.fxQualityOffered()) this.addCommand('Effects Quality', 'docsFxQuality');
    };
    // Effects Quality cycles High > Medium > Low > Off.
    $.Window_Options_statusText = Window_Options.prototype.statusText;
    Window_Options.prototype.statusText = function(index) {
        if (this.commandSymbol(index) === 'docsFxQuality') return DocsDoodads.fxQualityLabels[this.getConfigValue('docsFxQuality') || 0];
        return $.Window_Options_statusText.call(this, index);
    };
    const shiftQuality = (win, delta, wrap) => {
        const value = (win.getConfigValue('docsFxQuality') || 0) + delta;
        win.changeValue('docsFxQuality', wrap ? (value + 4) % 4 : Math.max(0, Math.min(3, value)));
    };
    $.Window_Options_processOk = Window_Options.prototype.processOk;
    Window_Options.prototype.processOk = function() {
        if (this.commandSymbol(this.index()) === 'docsFxQuality') return shiftQuality(this, 1, true);
        $.Window_Options_processOk.call(this);
    };
    $.Window_Options_cursorRight = Window_Options.prototype.cursorRight;
    Window_Options.prototype.cursorRight = function() {
        if (this.commandSymbol(this.index()) === 'docsFxQuality') return shiftQuality(this, 1, false);
        $.Window_Options_cursorRight.apply(this, arguments);
    };
    $.Window_Options_cursorLeft = Window_Options.prototype.cursorLeft;
    Window_Options.prototype.cursorLeft = function() {
        if (this.commandSymbol(this.index()) === 'docsFxQuality') return shiftQuality(this, -1, false);
        $.Window_Options_cursorLeft.apply(this, arguments);
    };
}
if (typeof Scene_Options !== 'undefined' && Scene_Options.prototype.maxCommands) {
    $.Scene_Options_maxCommands = Scene_Options.prototype.maxCommands;
    Scene_Options.prototype.maxCommands = function() {
        return $.Scene_Options_maxCommands.call(this) + DocsDoodads.extraOptionCount();
    };
}

// Post-processing runs on the map layer (or the whole spriteset with pictures), in battle too.
if (typeof Spriteset_Base !== 'undefined' && typeof PIXI !== 'undefined') {
    $.Spriteset_Base_update = Spriteset_Base.prototype.update;
    Spriteset_Base.prototype.update = function() {
        $.Spriteset_Base_update.call(this);
        this.updateDocsPostFx();
    };

    Spriteset_Base.prototype.createDocsPostFxFilters = function() {
        const P = DocsDoodads.PostFX;
        const f = {};
        try {
            f.grade = new PIXI.Filter(undefined, P.gradeFragment, P.uniforms(null, null, 0));
            f.tiltH = new PIXI.Filter(undefined, P.tiltFragment, { uDir: [1, 0], uBlur: 0, uFocus: 0.55, uBand: 0.12 });
            f.tiltV = new PIXI.Filter(undefined, P.tiltFragment, { uDir: [0, 1], uBlur: 0, uFocus: 0.55, uBand: 0.12 });
            const extract = new PIXI.Filter(undefined, P.bloomExtractFragment, { uThreshold: 0.6 });
            const blur = PIXI.filters && PIXI.filters.BlurFilter ? new PIXI.filters.BlurFilter(8, 4) : null;
            const combine = new PIXI.Filter(undefined, P.bloomCombineFragment, { uBloom: PIXI.Texture.EMPTY, uIntensity: 0.8 });
            const bloom = new PIXI.Filter(undefined, P.bloomExtractFragment, { uThreshold: 0.6 });
            // Bright parts are extracted, blurred and added back on top.
            bloom.apply = function(filterManager, input, output, clearMode) {
                const bright = filterManager.getFilterTexture(input);
                extract.apply(filterManager, input, bright, PIXI.CLEAR_MODES ? PIXI.CLEAR_MODES.CLEAR : true);
                if (blur) blur.apply(filterManager, bright, bright, PIXI.CLEAR_MODES ? PIXI.CLEAR_MODES.CLEAR : true);
                combine.uniforms.uBloom = bright;
                combine.apply(filterManager, input, output, clearMode);
                filterManager.returnFilterTexture(bright);
            };
            bloom._docsParts = { extract, blur, combine };
            f.bloom = bloom;
        } catch (error) {
            DocsDoodads.Core.log('Post-processing filters could not be built; the game is shown without them.', error);
            return null;
        }
        return f;
    };

    Spriteset_Base.prototype.updateDocsPostFx = function() {
        const P = DocsDoodads.PostFX;
        const world = DocsDoodads.World.settings();
        const ws = DocsDoodads.Workspace;
        const editing = Boolean(ws && ws.mounted);
        const hidden = (editing && (ws.postFxCompare || ws.postFxPreview === false)) || !DocsDoodads.Atmosphere.featureOn('postfx');
        const mapSettings = typeof $gameMap !== 'undefined' && $gameMap && $gameMap.mapId ? DocsDoodads.Lighting.mapSettings($gameMap.mapId()) : null;
        const runtime = P.runtimeLook();
        let look = hidden ? null : P.resolveLook({ world, mapSettings, runtime });
        let anim = P.Animations.sample(P._anims, DocsDoodads.frameCount());
        if (this._docsExportLook !== undefined) {
            look = this._docsExportLook;
            anim = null;
        }
        const option = typeof ConfigManager !== 'undefined' ? ConfigManager.docsFxQuality : 0;
        const quality = P.effectiveQuality(world.postfx.quality, option);
        const passes = hidden && this._docsExportLook === undefined ? [] : P.passes(look, quality, anim);
        const target = world.postfx.includePictures ? this : this._baseSprite;
        const other = target === this ? this._baseSprite : this;
        if (!target) return;
        if (passes.length && !this._docsPostFx) this._docsPostFx = this.createDocsPostFxFilters();
        const f = this._docsPostFx;
        const ours = [];
        if (f) {
            if (passes.includes('bloom')) {
                const bloom = P.normalizeLook(look).bloom;
                const parts = f.bloom._docsParts;
                parts.extract.uniforms.uThreshold = bloom.enabled ? bloom.threshold : 0.7;
                parts.combine.uniforms.uIntensity = (bloom.enabled ? bloom.intensity : 0) + (anim ? anim.bloom : 0);
                if (parts.blur) {
                    parts.blur.blur = bloom.enabled ? bloom.radius : 10;
                    parts.blur.quality = P.bloomBlurQuality(quality);
                }
                ours.push(f.bloom);
            }
            if (passes.includes('tiltShift')) {
                for (const tilt of [f.tiltH, f.tiltV]) {
                    tilt.uniforms.uBlur = look.tiltShift.blur;
                    tilt.uniforms.uFocus = look.tiltShift.focus;
                    tilt.uniforms.uBand = look.tiltShift.band;
                    ours.push(tilt);
                }
            }
            if (passes.includes('grade')) {
                const u = P.uniforms(look, anim, DocsDoodads.frameCount() / 60);
                for (const key of Object.keys(u)) f.grade.uniforms[key] = u[key];
                ours.push(f.grade);
            }
        }
        const all = f ? [f.bloom, f.tiltH, f.tiltV, f.grade] : [];
        const strip = list => (list || []).filter(filter => !all.includes(filter));
        // The other container may still hold our filters from before "Affect pictures" changed.
        if (other && other.filters && other.filters.some(filter => all.includes(filter))) other.filters = strip(other.filters);
        const kept = strip(target.filters);
        // Ours go after MZ's tone filter on the map layer, and before the fade/flash filter on the whole spriteset.
        const desired = target === this ? ours.concat(kept) : kept.concat(ours);
        const current = target.filters || [];
        if (desired.length !== current.length || desired.some((filter, i) => filter !== current[i])) {
            target.filters = desired.length ? desired : null;
        }
        if (ours.length) {
            const w = typeof Graphics !== 'undefined' ? Graphics.width : 816;
            const h = typeof Graphics !== 'undefined' ? Graphics.height : 624;
            if (!target.filterArea || target.filterArea.width !== w || target.filterArea.height !== h) target.filterArea = new PIXI.Rectangle(0, 0, w, h);
        }
    };
}

// Where a character is on screen, 0-1, for screen effects centred on it.
DocsDoodads.PostFX.screenCenterOf = function(character) {
    if (!character || typeof Graphics === 'undefined') return [0.5, 0.5];
    const at = DocsDoodads.Perspective && DocsDoodads.Perspective.liveCamera()
        ? DocsDoodads.Perspective.flatToScreen(character.screenX(), character.screenY()) : { x: character.screenX(), y: character.screenY(), scale: 1 };
    const x = at.x / Graphics.width;
    const y = (at.y - 24 * (at.scale || 1)) / Graphics.height;
    return [Math.max(0, Math.min(1, x)), Math.max(0, Math.min(1, y))];
};

DocsDoodads.PostFX.play = function(spec) {
    return this.Animations.start(this._anims, spec, DocsDoodads.frameCount());
};

// "Set Look" fades from what is on screen now to a preset, to no effects, or back to the map's own look.
DocsDoodads.PostFX.setLook = function(id, frames) {
    if (typeof $gameSystem === 'undefined' || !$gameSystem) return null;
    const world = DocsDoodads.World.settings();
    const mapSettings = typeof $gameMap !== 'undefined' && $gameMap ? DocsDoodads.Lighting.mapSettings($gameMap.mapId()) : null;
    const mapLook = this.resolveLook({ world, mapSettings }) || this.defaultLook();
    const current = $gameSystem._docsLook ? $gameSystem._docsLook.current : mapLook;
    const target = id === 'map' ? mapLook : id === 'none' ? this.defaultLook() : this.presetLook(id);
    if (!target) return null;
    const fade = this.fadeStart(current, target, frames);
    fade.clearWhenDone = id === 'map';
    $gameSystem._docsLook = fade;
    return fade;
};

if (typeof PluginManager !== 'undefined' && typeof PluginManager.registerCommand === 'function') {
    PluginManager.registerCommand(pluginName, 'setLook', args => {
        DocsDoodads.PostFX.setLook(String(args.look || 'map'), Number(args.duration) || 0);
    });
    PluginManager.registerCommand(pluginName, 'playScreenEffect', args => {
        const P = DocsDoodads.PostFX;
        let center = [0.5, 0.5];
        if (args.origin === 'player' && typeof $gamePlayer !== 'undefined') center = P.screenCenterOf($gamePlayer);
        else if (args.origin === 'event' && typeof $gameMap !== 'undefined' && $gameMap) center = P.screenCenterOf($gameMap.event(Number(args.eventId) || 0));
        P.play({ type: args.effect, strength: Number(args.strength), duration: Number(args.duration) || 30, center });
    });
}

// Full-map image export: renders each screen-sized piece with the camera moved there, then restores everything.
DocsDoodads.MapExport.capture = function(spriteset, options = {}) {
    const renderer = DocsDoodads.Compat.getRenderer();
    if (!renderer || !spriteset || typeof $gameMap === 'undefined' || !$gameMap) throw new Error('The map is not ready.');
    const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
    const plan = this.plan($gameMap.width(), $gameMap.height(), tw, th, Graphics.width, Graphics.height, options.scale || 1);
    if (plan.error) throw new Error(plan.error);
    const canvas = document.createElement('canvas');
    canvas.width = plan.width;
    canvas.height = plan.height;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = plan.scale !== 1;
    const saved = { x: $gameMap._displayX, y: $gameMap._displayY, px: $gameMap._parallaxX, py: $gameMap._parallaxY };
    const P = DocsDoodads.PostFX;
    const look = options.includeEffects
        ? P.exportLook(P.resolveLook({ world: DocsDoodads.World.settings(), mapSettings: DocsDoodads.Lighting.mapSettings($gameMap.mapId()), runtime: P.runtimeLook() }))
        : null;
    spriteset._docsExportLook = look;
    const rt = PIXI.RenderTexture.create({ width: Graphics.width, height: Graphics.height });
    try {
        for (const chunk of plan.chunks) {
            $gameMap.setDisplayPos(chunk.displayX, chunk.displayY);
            spriteset.update();
            spriteset.scale.set(1, 1);
            spriteset.x = 0;
            spriteset.y = 0;
            if (spriteset._docsSelectionOutline) spriteset._docsSelectionOutline.visible = false;
            if (spriteset._docsSilhouette) spriteset._docsSilhouette.visible = false;
            if (spriteset._weather) spriteset._weather.visible = false;
            if (!options.includeEffects) {
                if (spriteset._docsLightOverlay) spriteset._docsLightOverlay.visible = false;
                if (spriteset._docsGlowLayer) spriteset._docsGlowLayer.visible = false;
            }
            if (!options.includeCharacters) {
                for (const sprite of spriteset._characterSprites || []) {
                    sprite.visible = false;
                    if (sprite._docsShadow) sprite._docsShadow.visible = false;
                }
                if (spriteset._docsReflectLayer) spriteset._docsReflectLayer.visible = false;
                if (spriteset._shadowSprite) spriteset._shadowSprite.visible = false;
            }
            renderer.render(spriteset, rt, true);
            const piece = renderer.extract.canvas(rt);
            // MZ centres maps smaller than the screen, so read where the camera really is.
            const sx = Math.round(chunk.dx - $gameMap.displayX() * tw), sy = Math.round(chunk.dy - $gameMap.displayY() * th);
            ctx.drawImage(piece, sx, sy, chunk.w, chunk.h,
                Math.round(chunk.dx * plan.scale), Math.round(chunk.dy * plan.scale), Math.round(chunk.w * plan.scale), Math.round(chunk.h * plan.scale));
        }
    } finally {
        rt.destroy(true);
        delete spriteset._docsExportLook;
        $gameMap._displayX = saved.x;
        $gameMap._displayY = saved.y;
        $gameMap._parallaxX = saved.px;
        $gameMap._parallaxY = saved.py;
        if (spriteset._weather) spriteset._weather.visible = true;
        if (spriteset._docsGlowLayer) spriteset._docsGlowLayer.visible = true;
        spriteset.update();
    }
    return { canvas, plan };
};

// ---- Particles, VFX and reactive doodads on the map ----
// Small white textures (one per shape), tinted per particle.
// A texture drawn once and shared by every scene. MZ destroys the textures of all sprites in a scene
// when it leaves it (the menu, battle, a map transfer), and the next scene is built before the old one
// goes, so a shared texture must ignore that, as PIXI's own Texture.WHITE does.
DocsDoodads.sharedTexture = function(canvas) {
    const texture = PIXI.Texture.from(canvas);
    texture.destroy = function() {};
    return texture;
};

DocsDoodads.ParticleTextures = {
    _cache: {},
    size: 32,

    get(shape) {
        if (this._cache[shape]) return this._cache[shape];
        if (typeof document === 'undefined' || typeof PIXI === 'undefined') return null;
        const n = this.size, c = document.createElement('canvas');
        c.width = n;
        c.height = n;
        const g = c.getContext('2d');
        g.fillStyle = '#ffffff';
        const mid = n / 2;
        if (shape === 'soft') {
            const grad = g.createRadialGradient(mid, mid, 0, mid, mid, mid);
            grad.addColorStop(0, 'rgba(255,255,255,1)');
            grad.addColorStop(0.5, 'rgba(255,255,255,0.5)');
            grad.addColorStop(1, 'rgba(255,255,255,0)');
            g.fillStyle = grad;
            g.fillRect(0, 0, n, n);
        } else if (shape === 'circle') {
            g.beginPath();
            g.arc(mid, mid, mid - 2, 0, Math.PI * 2);
            g.fill();
        } else if (shape === 'square') {
            g.fillRect(4, 4, n - 8, n - 8);
        } else if (shape === 'spark') {
            g.beginPath();
            g.ellipse(mid, mid, mid - 1, mid / 5, 0, 0, Math.PI * 2);
            g.fill();
        } else if (shape === 'leaf') {
            g.beginPath();
            g.moveTo(2, mid);
            g.quadraticCurveTo(mid, 2, n - 2, mid);
            g.quadraticCurveTo(mid, n - 2, 2, mid);
            g.fill();
        } else {
            g.beginPath();
            for (let i = 0; i < 8; i++) {
                const r = i % 2 === 0 ? mid - 1 : mid / 4;
                const a = i * Math.PI / 4;
                g.lineTo(mid + Math.cos(a) * r, mid + Math.sin(a) * r);
            }
            g.closePath();
            g.fill();
        }
        this._cache[shape] = DocsDoodads.sharedTexture(c);
        return this._cache[shape];
    }
};

if (typeof PIXI !== 'undefined' && PIXI.Container) {
    // One particle emitter drawn with pooled sprites, positioned relative to its container.
    window.Sprite_DocsParticles = function() { this.initialize(...arguments); };
    Sprite_DocsParticles.prototype = Object.create(PIXI.Container.prototype);
    Sprite_DocsParticles.prototype.constructor = Sprite_DocsParticles;

    Sprite_DocsParticles.prototype.initialize = function(config, seed) {
        PIXI.Container.call(this);
        this._pool = [];
        this.setConfig(config, seed);
    };

    Sprite_DocsParticles.prototype.setConfig = function(config, seed) {
        this._config = config;
        this._state = DocsDoodads.Particles.createState(config, seed || 1);
        this._bursted = false;
    };

    Sprite_DocsParticles.prototype.burstNow = function(count) {
        DocsDoodads.Particles.burst(this._state, count === undefined ? this._config.burst : count);
    };

    Sprite_DocsParticles.prototype.alive = function() {
        return this._state.particles.length;
    };

    Sprite_DocsParticles.prototype.stepAndDraw = function(dt, emitting) {
        const P = DocsDoodads.Particles;
        if (emitting && !this._bursted) {
            this._bursted = true;
            if (this._config.burst) this.burstNow();
        }
        P.step(this._state, dt, emitting);
        const views = P.view(this._state);
        const texture = DocsDoodads.ParticleTextures.get(this._config.shape);
        const blend = this._config.blend === 'add' ? PIXI.BLEND_MODES.ADD : this._config.blend === 'screen' ? PIXI.BLEND_MODES.SCREEN : PIXI.BLEND_MODES.NORMAL;
        while (this._pool.length < views.length) {
            const s = new PIXI.Sprite(texture || PIXI.Texture.WHITE);
            s.anchor.set(0.5, 0.5);
            this.addChild(s);
            this._pool.push(s);
        }
        const unit = DocsDoodads.ParticleTextures.size;
        for (let i = 0; i < this._pool.length; i++) {
            const s = this._pool[i], v = views[i];
            s.visible = Boolean(v);
            if (!v) continue;
            if (texture && s.texture !== texture) s.texture = texture;
            s.x = v.x;
            s.y = v.y;
            s.scale.set(Math.max(0.001, v.size / unit), Math.max(0.001, v.size / unit) * (1 + v.stretch));
            s.alpha = v.alpha;
            s.rotation = v.rotation;
            s.tint = v.color;
            s.blendMode = blend;
        }
    };

    // A whole VFX: particle layers and sprite-sheet layers on one clock.
    window.Sprite_DocsVfx = function() { this.initialize(...arguments); };
    Sprite_DocsVfx.prototype = Object.create(PIXI.Container.prototype);
    Sprite_DocsVfx.prototype.constructor = Sprite_DocsVfx;

    Sprite_DocsVfx.prototype.initialize = function(def, seed) {
        PIXI.Container.call(this);
        this._def = def;
        this._time = 0;
        this._layers = def.layers.map((layer, i) => {
            if (layer.type === 'particles') {
                const view = new Sprite_DocsParticles(DocsDoodads.Particles.normalize(layer.emitter), (seed || 1) + i * 7919);
                view.x = layer.offsetX;
                view.y = layer.offsetY;
                this.addChild(view);
                return { layer, view };
            }
            const sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
            sprite.anchor.set(0.5, 0.5);
            sprite.x = layer.offsetX;
            sprite.y = layer.offsetY;
            sprite.scale.set(layer.scale);
            sprite.rotation = layer.rotation * Math.PI / 180;
            sprite.alpha = layer.alpha;
            sprite.tint = DocsDoodads.Lighting.parseColor(layer.tint, 0xffffff);
            sprite.blendMode = layer.blend === 'add' ? PIXI.BLEND_MODES.ADD : layer.blend === 'screen' ? PIXI.BLEND_MODES.SCREEN : PIXI.BLEND_MODES.NORMAL;
            this.addChild(sprite);
            const entry = { layer, view: sprite, bitmap: layer.image ? DocsDoodads.loadBitmap(layer.image) : null };
            return entry;
        });
    };

    Sprite_DocsVfx.prototype.alive = function() {
        return this._layers.reduce((n, l) => n + (l.layer.type === 'particles' ? l.view.alive() : 0), 0);
    };

    Sprite_DocsVfx.prototype.isFinished = function() {
        return DocsDoodads.Vfx.isFinished(this._def, this._time, this.alive());
    };

    Sprite_DocsVfx.prototype.step = function(dt) {
        const V = DocsDoodads.Vfx;
        this._time += dt;
        // Looping effects restart their clock (and bursts) each cycle.
        if (this._def.loop && this._time >= this._def.duration) {
            this._time -= this._def.duration;
            for (const l of this._layers) if (l.layer.type === 'particles') l.view._bursted = false;
        }
        for (const l of this._layers) {
            const t = this._time - l.layer.start;
            if (l.layer.type === 'particles') {
                l.view.stepAndDraw(dt, V.emitting(this._def, l.layer, this._time));
                continue;
            }
            const frame = t >= 0 ? V.sheetFrame(l.layer, t) : -1;
            const bmp = l.bitmap;
            if (frame < 0 || !bmp || !bmp.isReady() || !(bmp.baseTexture || bmp._baseTexture)) {
                l.view.visible = false;
                continue;
            }
            const w = bmp.width / l.layer.cols, h = bmp.height / l.layer.rows;
            const rect = DocsDoodads.safeFrame({ x: (frame % l.layer.cols) * w, y: Math.floor(frame / l.layer.cols) * h, w, h }, bmp.width, bmp.height);
            if (!l.texture) l.texture = new PIXI.Texture(bmp.baseTexture || bmp._baseTexture, new PIXI.Rectangle(rect.x, rect.y, rect.w, rect.h));
            else l.texture.frame = new PIXI.Rectangle(rect.x, rect.y, rect.w, rect.h);
            l.view.texture = l.texture;
            l.view.visible = true;
        }
    };
}

// Where each walker is (map pixels) this frame, for grass and bushes that react.
DocsDoodads.React.walkers = function() {
    const frame = DocsDoodads.frameCount();
    if (this._walkersFrame === frame && this._walkers) return this._walkers;
    this._walkersFrame = frame;
    const out = [];
    if (typeof $gameMap !== 'undefined' && $gameMap && typeof $gamePlayer !== 'undefined' && $gamePlayer) {
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const add = ch => {
            if (!ch || (ch.isTransparent && ch.isTransparent())) return;
            const moving = ch.isMoving && ch.isMoving();
            out.push({ x: (ch._realX + 0.5) * tw, baseY: (ch._realY + 1) * th, speed: moving && ch.distancePerFrame ? ch.distancePerFrame() * tw : 0 });
        };
        add($gamePlayer);
        if ($gamePlayer.followers) $gamePlayer.followers().visibleFollowers().forEach(add);
        for (const ev of $gameMap.events()) if (ev.characterName() || ev.tileId() > 0) add(ev);
    }
    this._walkers = out;
    return out;
};

if (typeof Sprite_DocsDoodad !== 'undefined' && Sprite_DocsDoodad.prototype && Sprite_DocsDoodad.prototype.updatePlacement) {
    $.Sprite_DocsDoodad_updatePlacement = Sprite_DocsDoodad.prototype.updatePlacement;
    Sprite_DocsDoodad.prototype.updatePlacement = function() {
        $.Sprite_DocsDoodad_updatePlacement.call(this);
        this.updateDocsReact();
        this.updateDocsParticles();
    };

    // Bending: walkers inside the doodad's base push it away; a spring brings it back.
    Sprite_DocsDoodad.prototype.updateDocsReact = function() {
        const d = this._data;
        if (!d.react || !d.react.enabled) {
            this._react = null;
            return;
        }
        const R = DocsDoodads.React;
        const frame = DocsDoodads.frameCount();
        // The spring moves once per frame; the bend is applied on every placement pass.
        if (this._lastReactFrame !== frame || !this._react) {
            this._lastReactFrame = frame;
            const th = typeof $gameMap !== 'undefined' && $gameMap ? $gameMap.tileHeight() : 48;
            let impulse = 0, touching = false;
            for (const w of R.walkers()) {
                if (!R.touching(d, w.x, w.baseY, th)) continue;
                touching = true;
                if (w.speed > 0) impulse += R.push(d, w.x, w.speed) * 0.6;
            }
            if (touching && !this._reactTouching) {
                impulse += R.push(d, d.x - 1, 4) * 1.5 * (Math.random() < 0.5 ? -1 : 1);
                if (d.react.leaves) this.dropDocsLeaves();
            }
            this._reactTouching = touching;
            this._react = R.step(this._react || { bend: 0, vel: 0 }, impulse);
        }
        // A positive bend leans the top to the right; PIXI skews the top left for positive skew.x.
        this.skew.x -= this._react.bend;
    };

    Sprite_DocsDoodad.prototype.dropDocsLeaves = function() {
        if (!this.parent) return;
        if (!this._docsLeaves) {
            const d = this._data;
            const config = DocsDoodads.Particles.normalize({ preset: 'leaves', rate: 0, area: [(d.frameW || 48) * 0.6, 8], lifetime: [0.8, 1.4], speed: [20, 40], angle: -60, spread: 80, gravity: 60 });
            this._docsLeaves = new Sprite_DocsParticles(config, (d.x || 1) + (d.y || 1));
            this._docsLeaves.z = 5.5;
            this._docsLeaves._docsBillboardOwner = this;
            this._docsLeaves._docsSortY = 0;
        }
        if (this._docsLeaves.parent !== this.parent) this.parent.addChild(this._docsLeaves);
        this._docsLeaves.burstNow(3);
    };

    // Emitters and attached VFX follow the doodad; "below" sits under characters, "above" over them.
    Sprite_DocsDoodad.prototype.updateDocsParticles = function() {
        const d = this._data;
        if (this._lastParticleFrame === DocsDoodads.frameCount() && DocsDoodads.frameCount() !== 0) return;
        this._lastParticleFrame = DocsDoodads.frameCount();
        const pos = this.screenPosition();
        const h = (d.frameH || 48) * Math.abs(d.scaleY !== undefined ? d.scaleY : 1);
        const centerY = pos.y + h * (0.5 - (d.anchorY !== undefined ? d.anchorY : 1));
        const parent = this.parent;
        const wanted = d.particles && d.particles.preset && d.particles.preset !== 'none' ? d.particles : null;
        const sig = wanted ? JSON.stringify(wanted) : '';
        if (sig !== this._particleSig) {
            this._particleSig = sig;
            this.destroyDocsParticles();
            if (wanted && typeof Sprite_DocsParticles !== 'undefined') {
                const config = DocsDoodads.Particles.normalize(Object.assign({}, wanted, { preset: wanted.preset }));
                config.rate *= wanted.rateScale !== undefined ? Math.max(0, Number(wanted.rateScale) || 0) : 1;
                this._docsEmitter = new Sprite_DocsParticles(config, Math.round((d.x || 0) * 7 + (d.y || 0) * 13) + 1);
                this._docsEmitter._docsBillboardOwner = this;
            }
        }
        if (this._docsEmitter && parent) {
            const e = this._docsEmitter;
            if (e.parent !== parent) parent.addChild(e);
            e.z = wanted && wanted.layer === 'below' ? 0.6 : 5.5;
            e._docsSortY = 0;
            e.x = pos.x + (Number(wanted.offsetX) || 0);
            e.y = centerY + (Number(wanted.offsetY) || 0);
            e.visible = this.visible;
            e.stepAndDraw(1 / 60, this.visible);
        }
        const vfxId = d.vfx || '';
        if (vfxId !== this._vfxId) {
            this._vfxId = vfxId;
            if (this._docsVfx) {
                if (this._docsVfx.parent) this._docsVfx.parent.removeChild(this._docsVfx);
                this._docsVfx.destroy({ children: true });
                this._docsVfx = null;
            }
            const def = vfxId ? DocsDoodads.Vfx.find(vfxId, DocsDoodads.Vfx.library()) : null;
            if (def && typeof Sprite_DocsVfx !== 'undefined') {
                this._docsVfx = new Sprite_DocsVfx(Object.assign({}, def, { loop: true }), (d.x || 1) + (d.y || 1));
                this._docsVfx._docsBillboardOwner = this;
            }
        }
        if (this._docsVfx && parent) {
            const v = this._docsVfx;
            if (v.parent !== parent) parent.addChild(v);
            v.z = 5.5;
            v._docsSortY = 0;
            v.x = pos.x;
            v.y = centerY;
            v.visible = this.visible;
            v.step(1 / 60);
        }
        if (this._docsLeaves && this._docsLeaves.parent) {
            this._docsLeaves.x = pos.x;
            this._docsLeaves.y = centerY;
            this._docsLeaves.stepAndDraw(1 / 60, false);
        }
    };

    Sprite_DocsDoodad.prototype.destroyDocsParticles = function() {
        if (this._docsEmitter) {
            if (this._docsEmitter.parent) this._docsEmitter.parent.removeChild(this._docsEmitter);
            this._docsEmitter.destroy({ children: true });
            this._docsEmitter = null;
        }
    };

    // Effects living beside the doodad in the tilemap go with it when the layer is rebuilt.
    Sprite_DocsDoodad.prototype.destroyDocsFx = function() {
        this.destroyDocsParticles();
        for (const key of ['_docsVfx', '_docsLeaves']) {
            if (this[key]) {
                if (this[key].parent) this[key].parent.removeChild(this[key]);
                this[key].destroy({ children: true });
                this[key] = null;
            }
        }
        this._particleSig = undefined;
        this._vfxId = undefined;
    };
}

if (typeof Spriteset_Map !== 'undefined') {
    $.Spriteset_Map_removeDocsDoodadSprites = Spriteset_Map.prototype.removeDocsDoodadSprites;
    Spriteset_Map.prototype.removeDocsDoodadSprites = function() {
        for (const sprite of this._docsDoodadSprites || []) if (sprite.destroyDocsFx) sprite.destroyDocsFx();
        $.Spriteset_Map_removeDocsDoodadSprites.call(this);
    };

    // Effects started by "Play VFX" belong to the map they started on; they survive the menu.
    $.Spriteset_Map_createCharacters = Spriteset_Map.prototype.createCharacters;
    Spriteset_Map.prototype.createCharacters = function() {
        $.Spriteset_Map_createCharacters.call(this);
        const mapId = typeof $gameMap !== 'undefined' && $gameMap ? $gameMap.mapId() : 0;
        if (DocsDoodads.Vfx._mapId !== mapId) DocsDoodads.Vfx._playing = [];
        DocsDoodads.Vfx._mapId = mapId;
        for (const instance of DocsDoodads.Vfx._playing) instance.view = null;
        this._docsVfxViews = [];
        DocsDoodads.CharacterAnim.preload();
    };

    $.Spriteset_Map_update_vfx = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        $.Spriteset_Map_update_vfx.call(this);
        this.updateDocsVfx();
    };

    Spriteset_Map.prototype.updateDocsVfx = function() {
        if (!this._tilemap || typeof Sprite_DocsVfx === 'undefined') return;
        this._docsVfxViews = this._docsVfxViews || [];
        const playing = DocsDoodads.Vfx._playing;
        for (const instance of playing) {
            if (!instance.view) {
                instance.view = new Sprite_DocsVfx(instance.def, instance.seed);
                instance.view.z = 5.5;
                // Effects on a character are drawn 24px up; in 3D they stand on its foot.
                instance.view._docsPivotDy = instance.follow ? 24 : 0;
                instance.view._docsSortY = 0;
                this._docsVfxViews.push(instance.view);
            }
            if (instance.view.parent !== this._tilemap) this._tilemap.addChild(instance.view);
            let at;
            const ch = instance.follow;
            if (ch && typeof ch.screenX === 'function') {
                at = { x: ch.screenX(), y: ch.screenY() - 24 };
            } else {
                at = DocsDoodads.mapToScreen(instance.x, instance.y);
            }
            instance.view.x = at.x;
            instance.view.y = at.y;
            instance.view.step(1 / 60);
            instance.time = instance.view._time;
            if (instance.view.isFinished()) instance.done = true;
        }
        for (let i = playing.length - 1; i >= 0; i--) {
            const instance = playing[i];
            if (!instance.done) continue;
            if (instance.view.parent) instance.view.parent.removeChild(instance.view);
            instance.view.destroy({ children: true });
            playing.splice(i, 1);
        }
    };
}

// ---- Character animation ----
DocsDoodads.CharacterAnim.sets = function() {
    return DocsDoodads.World.settings().characterAnim.sets || [];
};

// Loads idle and run sheets for characters on the map before they are needed, so switching never blinks.
DocsDoodads.CharacterAnim.preload = function() {
    if (typeof ImageManager === 'undefined' || typeof $gameMap === 'undefined' || !$gameMap) return;
    const sets = this.sets();
    if (!sets.length) return;
    const names = new Set();
    const add = ch => { if (ch && ch.characterName && ch.characterName()) names.add(ch.characterName()); };
    if (typeof $gamePlayer !== 'undefined' && $gamePlayer) {
        add($gamePlayer);
        if ($gamePlayer.followers) $gamePlayer.followers().data().forEach(add);
    }
    for (const ev of $gameMap.events()) add(ev);
    for (const name of names) {
        const set = this.setFor(name, sets);
        if (!set) continue;
        if (set.idle) ImageManager.loadCharacter(set.idle);
        if (set.run) ImageManager.loadCharacter(set.run);
    }
};

if (typeof Game_CharacterBase !== 'undefined') {
    const C = DocsDoodads.CharacterAnim;
    const walkFrames = ch => C.parseName(ch.characterName ? ch.characterName() : '').frames;

    $.Game_CharacterBase_update = Game_CharacterBase.prototype.update;
    Game_CharacterBase.prototype.update = function() {
        $.Game_CharacterBase_update.call(this);
        if (this.isMoving() || this.isJumping()) this._docsStill = 0;
        else this._docsStill = Math.min(100000, (this._docsStill || 0) + 1);
        this._docsAnimTimer = ((this._docsAnimTimer || 0) + 1) % 1000000;
        if (this._docsAction) {
            this._docsAction.elapsed++;
            if (C.actionFrame(this._docsAction, this._docsAction.elapsed).done) this._docsAction = null;
        }
    };

    // Sheets with more than 3 frames loop through every frame.
    $.Game_CharacterBase_maxPattern = Game_CharacterBase.prototype.maxPattern;
    Game_CharacterBase.prototype.maxPattern = function() {
        const frames = walkFrames(this);
        return frames === 3 ? $.Game_CharacterBase_maxPattern.call(this) : frames;
    };
    $.Game_CharacterBase_pattern = Game_CharacterBase.prototype.pattern;
    Game_CharacterBase.prototype.pattern = function() {
        const frames = walkFrames(this);
        return frames === 3 ? $.Game_CharacterBase_pattern.call(this) : ((this._pattern % frames) + frames) % frames;
    };
    $.Game_CharacterBase_resetPattern = Game_CharacterBase.prototype.resetPattern;
    Game_CharacterBase.prototype.resetPattern = function() {
        if (walkFrames(this) === 3) $.Game_CharacterBase_resetPattern.call(this);
        else this.setPattern(0);
    };
    $.Game_CharacterBase_isOriginalPattern = Game_CharacterBase.prototype.isOriginalPattern;
    Game_CharacterBase.prototype.isOriginalPattern = function() {
        return walkFrames(this) === 3 ? $.Game_CharacterBase_isOriginalPattern.call(this) : this.pattern() === 0;
    };

    // The facing used by 8-direction sheets (1, 3, 7, 9 after diagonal moves).
    $.Game_CharacterBase_setDirection = Game_CharacterBase.prototype.setDirection;
    Game_CharacterBase.prototype.setDirection = function(d) {
        $.Game_CharacterBase_setDirection.call(this, d);
        this._docsDir8 = this.direction();
    };
    $.Game_CharacterBase_moveDiagonally = Game_CharacterBase.prototype.moveDiagonally;
    Game_CharacterBase.prototype.moveDiagonally = function(horz, vert) {
        $.Game_CharacterBase_moveDiagonally.call(this, horz, vert);
        if (!this.isDirectionFixed()) this._docsDir8 = C.dir8(horz, vert);
    };
    Game_CharacterBase.prototype.docsFacing = function() {
        return this._docsDir8 || this.direction();
    };
}

// Optional diagonal movement for the player (and so 8-direction sheets show their diagonals).
if (typeof Game_Player !== 'undefined') {
    $.Game_Player_getInputDirection = Game_Player.prototype.getInputDirection;
    Game_Player.prototype.getInputDirection = function() {
        if (DocsDoodads.World.settings().characterAnim.diagonal && typeof Input !== 'undefined') return Input.dir8;
        return $.Game_Player_getInputDirection.call(this);
    };
    $.Game_Player_executeMove = Game_Player.prototype.executeMove;
    Game_Player.prototype.executeMove = function(direction) {
        const split = DocsDoodads.CharacterAnim.split8(direction);
        if (!split) return $.Game_Player_executeMove.call(this, direction);
        this.moveDiagonally(split.horz, split.vert);
        // Blocked diagonally: slide along whichever side is open.
        if (!this.isMovementSucceeded()) {
            this.moveStraight(split.horz);
            if (!this.isMovementSucceeded()) this.moveStraight(split.vert);
        }
    };
}

if (typeof Sprite_Character !== 'undefined') {
    const C = DocsDoodads.CharacterAnim;

    // Which sheet and frame a character shows, or null to let MZ draw it the usual way.
    Sprite_Character.prototype.docsAnimFrame = function() {
        const ch = this._character;
        if (!ch || !ch.characterName || ch.tileId() > 0) return null;
        const name = ch.characterName();
        if (!name) return null;
        const set = C.setFor(name, C.sets());
        const action = ch._docsAction;
        const parsedName = C.parseName(name);
        if (!action && !set && !parsedName.tagged) return null;
        const moving = ch.isMoving();
        const dashing = moving && ch.realMoveSpeed && ch.realMoveSpeed() >= 5;
        const state = C.stateFor({ moving, dashing, stillFrames: ch._docsStill || 0, action }, set);
        const sheet = state === 'action' ? action.sheet : C.sheetFor(state, name, set);
        const layout = C.parseName(sheet);
        let frame;
        if (state === 'action') frame = C.actionFrame(action, action.elapsed).frame;
        else if (state === 'idle') frame = C.cycleFrame(ch._docsStill - (set.idleDelay || 0), set.idleFps || 6, layout.frames);
        else if (state === 'run' && layout.frames !== parsedName.frames) frame = C.cycleFrame(ch._docsAnimTimer || 0, set.runFps || 12, layout.frames);
        else frame = layout.frames === 3 ? C.walkFrame(ch._pattern, 3) : ch.pattern() % layout.frames;
        const single = layout.tagged || sheet.startsWith('$') || (sheet.length > 1 && sheet[0] === '!' && sheet[1] === '$');
        return { sheet, frames: layout.frames, dirs: layout.dirs, frame, single, index: ch.characterIndex(), facing: DocsDoodads.Perspective.displayFacing(ch.docsFacing ? ch.docsFacing() : ch.direction()) };
    };

    $.Sprite_Character_updateBitmap = Sprite_Character.prototype.updateBitmap;
    Sprite_Character.prototype.updateBitmap = function() {
        const anim = this.docsAnimFrame();
        this._docsAnim = anim;
        if (!anim) {
            if (this._docsAnimSheet) {
                // Back to a normal sheet: make MZ reload it.
                this._docsAnimSheet = null;
                this._characterName = '';
                this.scale.x = Math.abs(this.scale.x);
            }
            return $.Sprite_Character_updateBitmap.call(this);
        }
        if (this._docsAnimSheet !== anim.sheet) {
            const bmp = ImageManager.loadCharacter(anim.sheet);
            // Keep the old frame on screen until the new sheet has loaded.
            if (bmp.isReady() || !this.bitmap) {
                this._docsAnimSheet = anim.sheet;
                this.bitmap = bmp;
                this._characterName = this._character.characterName();
                this._tileId = 0;
            }
        }
    };

    $.Sprite_Character_updateCharacterFrame = Sprite_Character.prototype.updateCharacterFrame;
    Sprite_Character.prototype.updateCharacterFrame = function() {
        const anim = this._docsAnim;
        if (!anim || !this.bitmap || !this.bitmap.isReady() || this._docsAnimSheet !== anim.sheet) {
            if (!anim) return $.Sprite_Character_updateCharacterFrame.call(this);
            return;
        }
        const W = this.bitmap.width, H = this.bitmap.height;
        const block = anim.single ? { x: 0, y: 0, w: W, h: H } : { x: (anim.index % 4) * W / 4, y: Math.floor(anim.index / 4) * H / 2, w: W / 4, h: H / 2 };
        const pw = Math.floor(block.w / anim.frames), ph = Math.floor(block.h / anim.dirs);
        const facing = C.rowFor(anim.facing, anim.dirs);
        const sx = block.x + Math.min(anim.frame, anim.frames - 1) * pw;
        const sy = block.y + Math.min(facing.row, anim.dirs - 1) * ph;
        this.scale.x = Math.abs(this.scale.x) * (facing.mirror ? -1 : 1);
        this.updateHalfBodySprites();
        if (this._bushDepth > 0) {
            const d = Math.min(this._bushDepth, ph);
            this._upperBody.setFrame(sx, sy, pw, ph - d);
            this._lowerBody.setFrame(sx, sy + ph - d, pw, d);
            this.setFrame(sx, sy, 0, ph);
        } else {
            this.setFrame(sx, sy, pw, ph);
        }
    };
}

// The interpreter can wait for an action or a VFX to finish.
if (typeof Game_Interpreter !== 'undefined') {
    $.Game_Interpreter_updateWaitMode = Game_Interpreter.prototype.updateWaitMode;
    Game_Interpreter.prototype.updateWaitMode = function() {
        if (this._waitMode === 'docsAction') {
            const waiting = Boolean(this._docsWaitCharacter && this._docsWaitCharacter._docsAction);
            if (!waiting) {
                this._waitMode = '';
                this._docsWaitCharacter = null;
            }
            return waiting;
        }
        if (this._waitMode === 'docsVfx') {
            const waiting = Boolean(this._docsWaitVfx && !this._docsWaitVfx.done && DocsDoodads.Vfx._playing.includes(this._docsWaitVfx));
            if (!waiting) {
                this._waitMode = '';
                this._docsWaitVfx = null;
            }
            return waiting;
        }
        return $.Game_Interpreter_updateWaitMode.call(this);
    };
}

// "this" event, the player, or an event by ID.
DocsDoodads.characterFor = function(interpreter, target, eventId) {
    if (target === 'player') return typeof $gamePlayer !== 'undefined' ? $gamePlayer : null;
    if (typeof $gameMap === 'undefined' || !$gameMap) return null;
    if (target === 'this') return interpreter && interpreter.eventId ? $gameMap.event(interpreter.eventId()) : null;
    return $gameMap.event(Number(eventId) || 0) || null;
};

if (typeof PluginManager !== 'undefined' && typeof PluginManager.registerCommand === 'function') {
    PluginManager.registerCommand(pluginName, 'characterAction', function(args) {
        const ch = DocsDoodads.characterFor(this, args.target, args.eventId);
        if (!ch) return;
        const action = DocsDoodads.CharacterAnim.newAction({ sheet: args.sheet, fps: Number(args.fps) || 8, loops: Number(args.loops), hold: String(args.hold) === 'true' });
        ch._docsAction = action;
        if (typeof ImageManager !== 'undefined') ImageManager.loadCharacter(action.sheet);
        if (String(args.wait) === 'true' && !action.hold && action.loops > 0 && this && this.setWaitMode) {
            this._docsWaitCharacter = ch;
            this.setWaitMode('docsAction');
        }
    });
    PluginManager.registerCommand(pluginName, 'clearCharacterAction', function(args) {
        const ch = DocsDoodads.characterFor(this, args.target, args.eventId);
        if (ch) ch._docsAction = null;
    });
    PluginManager.registerCommand(pluginName, 'playVfx', function(args) {
        if (typeof $gameMap === 'undefined' || !$gameMap) return;
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const spec = { id: String(args.effect || '').trim() };
        if (args.target === 'tile') {
            spec.x = ((Number(args.x) || 0) + 0.5) * tw;
            spec.y = ((Number(args.y) || 0) + 0.5) * th;
        } else if (args.target === 'screen') {
            const at = DocsDoodads.screenPointToMap(Graphics.width / 2, Graphics.height / 2) || DocsDoodads.screenToMap(Graphics.width / 2, Graphics.height / 2);
            spec.x = at.x;
            spec.y = at.y;
        } else {
            const ch = DocsDoodads.characterFor(this, args.target, args.eventId);
            if (!ch) return;
            if (String(args.follow) !== 'false') spec.follow = ch;
            spec.x = (ch._realX + 0.5) * tw;
            spec.y = (ch._realY + 0.5) * th;
        }
        const instance = DocsDoodads.Vfx.play(spec);
        if (instance && String(args.wait) === 'true' && this && this.setWaitMode) {
            this._docsWaitVfx = instance;
            this.setWaitMode('docsVfx');
        }
    });
}

// ---- Spatial sound ----
DocsDoodads.SpatialSound.settings = function() {
    return DocsDoodads.World.settings().sound;
};

// A sound effect from a character, varied and placed relative to the player.
DocsDoodads.SpatialSound.forCharacter = function(se, ch) {
    if (!se || !se.name) return se;
    const s = this.settings();
    const out = this.vary(se, s, Math.random);
    if (!ch || typeof $gamePlayer === 'undefined' || !$gamePlayer || typeof $gameMap === 'undefined' || !$gameMap) return out;
    const playerLike = ch === $gamePlayer || (typeof Game_Follower !== 'undefined' && ch instanceof Game_Follower);
    if (!this.shouldSpatialize(s, DocsDoodads.CharacterTags.forCharacter(ch), playerLike)) return out;
    return this.apply(out, $gameMap.deltaX(ch._realX, $gamePlayer._realX), $gameMap.deltaY(ch._realY, $gamePlayer._realY), s);
};

DocsDoodads.SpatialSound.forTile = function(se, x, y) {
    if (!se || typeof $gamePlayer === 'undefined' || !$gamePlayer || typeof $gameMap === 'undefined' || !$gameMap) return se;
    const s = this.settings();
    return this.apply(this.vary(se, s, Math.random), $gameMap.deltaX(x, $gamePlayer._realX), $gameMap.deltaY(y, $gamePlayer._realY), s);
};

if (typeof Game_Interpreter !== 'undefined') {
    // Play SE from a map event is heard from where the event stands.
    Game_Interpreter.prototype.command250 = function(params) {
        const sameMap = typeof $gameMap !== 'undefined' && $gameMap && this._mapId === $gameMap.mapId();
        const ch = sameMap && this.eventId() > 0 ? $gameMap.event(this.eventId()) : null;
        const se = DocsDoodads.SpatialSound.forCharacter(params[0], ch);
        if (se) AudioManager.playSe(se);
        return true;
    };
}

if (typeof Game_Character !== 'undefined') {
    // Move-route SE (footsteps, door creaks) too.
    $.Game_Character_processMoveCommand = Game_Character.prototype.processMoveCommand;
    Game_Character.prototype.processMoveCommand = function(command) {
        if (command && command.code === Game_Character.ROUTE_PLAY_SE) {
            const se = DocsDoodads.SpatialSound.forCharacter(command.parameters[0], this);
            if (se) AudioManager.playSe(se);
            return;
        }
        $.Game_Character_processMoveCommand.call(this, command);
    };
}

// Looping and repeating sounds on doodads and on events tagged <sound: ...>.
DocsDoodads.SoundEmitters = {
    _active: typeof Map !== 'undefined' ? new Map() : null,
    _mapId: null,

    sources() {
        const out = [];
        if (typeof $gameMap === 'undefined' || !$gameMap) return out;
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        for (const d of DocsDoodads.doodads()) {
            if (!d || !d.sound || !d.sound.file) continue;
            if (DocsDoodads.Appearance.isConditional(d) && !DocsDoodads.Appearance.isVisible(d, {})) continue;
            if (!DocsDoodads.Layers.visibleInGame(d, DocsDoodads.Lighting.mapSettings($gameMap.mapId()))) continue;
            const emitter = DocsDoodads.SpatialSound.normalizeEmitter(d.sound);
            // Doodads sit on their base line; characters' realY is their tile, feet at (realY + 1).
            if (emitter) out.push({ owner: d, emitter, x: d.x / tw - 0.5, y: d.y / th - 1 });
        }
        for (const ev of $gameMap.events()) {
            const tag = DocsDoodads.CharacterTags.forCharacter(ev).sound;
            const emitter = tag ? DocsDoodads.SpatialSound.normalizeEmitter(tag) : null;
            if (emitter) out.push({ owner: ev, emitter, x: ev._realX, y: ev._realY });
        }
        return out;
    },

    stop(owner) {
        const state = this._active.get(owner);
        if (state && state.buffer) state.buffer.stop();
        this._active.delete(owner);
    },

    stopAll() {
        if (!this._active) return;
        for (const owner of Array.from(this._active.keys())) this.stop(owner);
    },

    update() {
        if (!this._active || typeof AudioManager === 'undefined' || typeof $gamePlayer === 'undefined' || !$gamePlayer || !$gameMap) return;
        if (this._mapId !== $gameMap.mapId()) {
            this.stopAll();
            this._mapId = $gameMap.mapId();
        }
        const SS = DocsDoodads.SpatialSound;
        const s = SS.settings();
        const sources = this.sources();
        const plan = SS.planEmitters(sources.map((src, i) => ({ key: i, emitter: src.emitter,
            dx: $gameMap.deltaX(src.x, $gamePlayer._realX), dy: $gameMap.deltaY(src.y, $gamePlayer._realY) })), s);
        const seen = new Set();
        sources.forEach((src, i) => {
            const p = plan[i];
            const e = src.emitter;
            const sig = e.file + '|' + e.loop;
            let state = this._active.get(src.owner);
            if (state && state.sig !== sig) {
                this.stop(src.owner);
                state = null;
            }
            if (!state) {
                state = { sig, buffer: null, timer: SS.nextDelay(e.every) * Math.random() };
                this._active.set(src.owner, state);
            }
            seen.add(src.owner);
            if (e.loop) {
                if (p.gain > 0.001) {
                    if (!state.buffer) {
                        state.buffer = AudioManager.createBuffer('bgs/', e.name);
                        state.buffer.play(true, 0);
                    }
                    AudioManager.updateBufferParameters(state.buffer, AudioManager._bgsVolume, { volume: e.volume * p.gain, pitch: e.pitch, pan: p.pan });
                } else if (state.buffer) {
                    state.buffer.stop();
                    state.buffer = null;
                }
                return;
            }
            state.timer -= 1 / 60;
            if (state.timer > 0) return;
            state.timer = SS.nextDelay(e.every);
            if (p.gain > 0.001) AudioManager.playSe(SS.vary({ name: e.name, volume: Math.round(e.volume * p.gain), pitch: e.pitch, pan: p.pan }, s, Math.random));
        });
        for (const owner of Array.from(this._active.keys())) if (!seen.has(owner)) this.stop(owner);
    }
};

// Region background sounds: the map's own BGS comes back when the player leaves the region.
DocsDoodads.RegionSounds = {
    _state: null,
    _mapId: null,
    _saved: null,

    update() {
        if (typeof AudioManager === 'undefined' || typeof $gamePlayer === 'undefined' || !$gamePlayer || !$gameMap) return;
        const SS = DocsDoodads.SpatialSound;
        if (this._mapId !== $gameMap.mapId() || !this._state) {
            this._mapId = $gameMap.mapId();
            this._state = SS.regionStart();
            this._saved = null;
        }
        const list = (DocsDoodads.Lighting.mapSettings($gameMap.mapId()) || {}).regionSounds;
        if (!Array.isArray(list) || list.length === 0) {
            if (!this._state.key) return;
        }
        const step = SS.regionStep(this._state, list || [], $gameMap.regionId($gamePlayer.x, $gamePlayer.y));
        this._state = step.state;
        const action = step.action;
        if (!action) return;
        if (action.type === 'play') {
            if (action.save) this._saved = AudioManager.saveBgs();
            AudioManager.playBgs({ name: action.entry.name, volume: Number(action.entry.volume) || 90, pitch: Number(action.entry.pitch) || 100, pan: 0 });
            AudioManager.fadeInBgs(Math.max(0, Number(action.entry.fade) || 0));
        } else if (action.type === 'restore') {
            if (this._saved && this._saved.name) {
                AudioManager.playBgs(this._saved, this._saved.pos);
                AudioManager.fadeInBgs(Math.max(0, Number(action.fade) || 0));
            } else {
                AudioManager.fadeOutBgs(Math.max(0, Number(action.fade) || 0));
            }
            this._saved = null;
        }
    }
};

// Cave echo: a shared delay line that map sound effects and background sounds feed into.
DocsDoodads.SpatialSound.echoBus = function() {
    if (typeof WebAudio === 'undefined' || !WebAudio._context || !WebAudio._masterGainNode) return null;
    if (!this._bus) {
        const c = WebAudio._context;
        const input = c.createGain(), delay = c.createDelay(1.5), feedback = c.createGain();
        input.gain.value = 0;
        input.connect(delay);
        delay.connect(feedback);
        feedback.connect(delay);
        delay.connect(WebAudio._masterGainNode);
        this._bus = { input, delay, feedback };
    }
    return this._bus;
};

DocsDoodads.SpatialSound.updateEcho = function() {
    const params = typeof $gameMap !== 'undefined' && $gameMap ? this.echoFor(DocsDoodads.Lighting.mapSettings($gameMap.mapId())) : null;
    const sig = params ? params.delay + '|' + params.feedback + '|' + params.mix : 'off';
    if (sig === this._echoSig) return;
    const bus = this.echoBus();
    if (!bus) return;
    this._echoSig = sig;
    bus.input.gain.value = params ? params.mix : 0;
    bus.feedback.gain.value = params ? params.feedback : 0;
    bus.delay.delayTime.value = params ? params.delay : 0.2;
};

if (typeof AudioManager !== 'undefined') {
    // Map sound effects and background sounds may echo; music, jingles and menu sounds never do.
    $.AudioManager_createBuffer = AudioManager.createBuffer;
    AudioManager.createBuffer = function(folder, name) {
        const buffer = $.AudioManager_createBuffer.call(this, folder, name);
        if (buffer) buffer._docsEchoable = folder === 'se/' || folder === 'bgs/';
        return buffer;
    };
    $.AudioManager_loadStaticSe = AudioManager.loadStaticSe;
    AudioManager.loadStaticSe = function(se) {
        $.AudioManager_loadStaticSe.call(this, se);
        for (const buffer of this._staticBuffers || []) buffer._docsEchoable = false;
    };
}
if (typeof WebAudio !== 'undefined' && WebAudio.prototype._createPannerNode) {
    $.WebAudio__createPannerNode = WebAudio.prototype._createPannerNode;
    WebAudio.prototype._createPannerNode = function() {
        $.WebAudio__createPannerNode.call(this);
        const bus = this._docsEchoable ? DocsDoodads.SpatialSound.echoBus() : null;
        if (bus && this._pannerNode) this._pannerNode.connect(bus.input);
    };
}

if (typeof Game_Map !== 'undefined') {
    $.Game_Map_update_sound = Game_Map.prototype.update;
    Game_Map.prototype.update = function(sceneActive) {
        $.Game_Map_update_sound.call(this, sceneActive);
        DocsDoodads.SoundEmitters.update();
        DocsDoodads.RegionSounds.update();
        DocsDoodads.SpatialSound.updateEcho();
    };
}
if (typeof Scene_Map !== 'undefined') {
    // Emitters stop for menus and battles and start again on the map.
    $.Scene_Map_terminate_sound = Scene_Map.prototype.terminate;
    Scene_Map.prototype.terminate = function() {
        $.Scene_Map_terminate_sound.call(this);
        DocsDoodads.SoundEmitters.stopAll();
    };
}

if (typeof PluginManager !== 'undefined' && typeof PluginManager.registerCommand === 'function') {
    PluginManager.registerCommand(pluginName, 'playSeAt', function(args) {
        const se = { name: String(args.name || ''), volume: Number(args.volume) || 90, pitch: Number(args.pitch) || 100, pan: 0 };
        if (!se.name) return;
        let out;
        if (args.target === 'tile') out = DocsDoodads.SpatialSound.forTile(se, Number(args.x) || 0, Number(args.y) || 0);
        else out = DocsDoodads.SpatialSound.forCharacter(se, DocsDoodads.characterFor(this, args.target, args.eventId));
        if (out) AudioManager.playSe(out);
    });
}

