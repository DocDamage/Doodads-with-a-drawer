//==========================================================
// SECTION 6: SPRITE_DOCSDOODAD RUNTIME ENGINE
//==========================================================
// Map pixels to screen pixels. Looping maps wrap the camera, so this uses MZ's adjustX/adjustY
// exactly like Sprite_Character; a plain display offset would push doodads off-screen at the seam.
DocsDoodads.mapToScreen = function(x, y) {
    const gameMap = typeof window !== 'undefined' ? window.$gameMap : null;
    if (!gameMap) return { x, y };
    const tw = gameMap.tileWidth ? gameMap.tileWidth() : 48;
    const th = gameMap.tileHeight ? gameMap.tileHeight() : 48;
    const round = v => Math.round(v * 1000) / 1000;
    return {
        x: round(typeof gameMap.adjustX === 'function' ? gameMap.adjustX(x / tw) * tw : x - gameMap.displayX() * tw),
        y: round(typeof gameMap.adjustY === 'function' ? gameMap.adjustY(y / th) * th : y - gameMap.displayY() * th)
    };
};

// Screen pixels back to map pixels, wrapped into the map on looping maps.
DocsDoodads.screenToMap = function(screenX, screenY) {
    const gameMap = typeof window !== 'undefined' ? window.$gameMap : null;
    if (!gameMap) return { x: screenX, y: screenY };
    const tw = gameMap.tileWidth ? gameMap.tileWidth() : 48;
    const th = gameMap.tileHeight ? gameMap.tileHeight() : 48;
    let x = gameMap.displayX() * tw + screenX;
    let y = gameMap.displayY() * th + screenY;
    const wrap = (v, size) => ((v % size) + size) % size;
    if (gameMap.isLoopHorizontal && gameMap.isLoopHorizontal() && gameMap.width) x = wrap(x, gameMap.width() * tw);
    if (gameMap.isLoopVertical && gameMap.isLoopVertical() && gameMap.height) y = wrap(y, gameMap.height() * th);
    return { x, y };
};

DocsDoodads.frameCount = function() {
    return typeof Graphics !== 'undefined' && Graphics.frameCount !== undefined ? Graphics.frameCount : 0;
};

if (typeof PIXI !== 'undefined') {
    Sprite_DocsDoodad.prototype = Object.create(PIXI.Sprite.prototype);
    Sprite_DocsDoodad.prototype.constructor = Sprite_DocsDoodad;

    Sprite_DocsDoodad.prototype.initialize = function(data, spriteset) {
        PIXI.Sprite.call(this);
        this._data = data;
        this._spriteset = spriteset;
        // The tilemap breaks z/y ties by spriteId, like Sprite_Character.
        this.spriteId = typeof Sprite !== 'undefined' && Sprite._counter !== undefined ? Sprite._counter++ : 0;
        this._frameTimer = 0;
        this._currentFrame = 0;
        this._spin = 0;
        this._lastUpdateFrame = -1;
        this._appearanceSig = null;
        this._shadowSprite = null;
        this.loadTexture();
        this.updatePlacement();
    };

    Sprite_DocsDoodad.prototype.loadTexture = function() {
        if (!this._data || !this._data.bit) return;
        const bit = this._data.bit;
        let bmp = null;
        if (bit[0] === 1 && typeof ImageManager !== 'undefined') {
            bmp = ImageManager.loadSystem("IconSet");
        } else if (bit[0] === 2 && typeof $gameMap !== 'undefined' && $dataTilesets) {
            const tileset = $dataTilesets[$gameMap.tilesetId()];
            if (tileset && tileset.tilesetNames && tileset.tilesetNames[bit[1]]) {
                bmp = ImageManager.loadTileset(tileset.tilesetNames[bit[1]]);
            }
        } else if (bit[0] === 3) {
            const path = this.seasonPath();
            this._loadedPath = path;
            const packed = path === bit[1] && DocsDoodads.Packer.shouldUse() && typeof $gameMap !== 'undefined' && $gameMap
                ? DocsDoodads.Packer.resolve(DocsDoodads.Packer.forMap($gameMap.mapId()), this._data) : null;
            this._regionOrigin = packed ? { x: packed.x, y: packed.y } : null;
            this._regionSize = packed ? { w: packed.w, h: packed.h } : null;
            bmp = DocsDoodads.loadBitmap(packed ? packed.sheet : path);
        }
        if (bmp) {
            if (bmp.isReady()) {
                this.setupBitmap(bmp);
            } else {
                bmp.addLoadListener(() => this.setupBitmap(bmp));
            }
        }
    };

    // The art for the current season, re-resolved only when the season or the table changes.
    Sprite_DocsDoodad.prototype.seasonPath = function() {
        const bit = this._data && this._data.bit;
        if (!bit || bit[0] !== 3) return null;
        const season = DocsDoodads.Atmosphere.season();
        const sets = DocsDoodads.World.settings().seasons.sets;
        if (this._seasonKey !== season || this._seasonSets !== sets || this._seasonSource !== bit[1]) {
            this._seasonKey = season;
            this._seasonSets = sets;
            this._seasonSource = bit[1];
            this._seasonResolved = DocsDoodads.Seasons.resolve(bit[1], season, sets);
        }
        return this._seasonResolved;
    };

    Sprite_DocsDoodad.prototype.setupBitmap = function(bmp) {
        if (!bmp || !bmp._baseTexture) return;
        this._bmp = bmp;
        const fw = this._data.frameW || bmp.width;
        const fh = this._data.frameH || bmp.height;
        const fx = this._regionOrigin ? this._regionOrigin.x : (this._data.frameX || 0);
        const fy = this._regionOrigin ? this._regionOrigin.y : (this._data.frameY || 0);
        // A packed region may have been clipped to a smaller image; never read into its neighbours.
        const limitW = this._regionSize ? fx + Math.min(fw, this._regionSize.w) : bmp.width;
        const limitH = this._regionSize ? fy + Math.min(fh, this._regionSize.h) : bmp.height;
        const frame = DocsDoodads.safeFrame({ x: fx, y: fy, w: fw, h: fh }, Math.min(bmp.width, limitW), Math.min(bmp.height, limitH));
        this.texture = new PIXI.Texture(bmp._baseTexture, new PIXI.Rectangle(frame.x, frame.y, frame.w, frame.h));
        if (this._shadowSprite) this._shadowSprite.texture = this.texture;
    };

    // Called by the tilemap (which updates its children) and by Spriteset_Map; runs once per frame.
    Sprite_DocsDoodad.prototype.update = function() {
        if (!this._data) return;
        const frame = DocsDoodads.frameCount();
        if (frame === this._lastUpdateFrame && frame !== 0) return;
        this._lastUpdateFrame = frame;
        const d = this._data;
        if (d.rotateSpeed) this._spin += d.rotateSpeed * Math.PI / 180;
        if (d.frameUpdate && (d.xFrame > 1 || d.yFrame > 1)) {
            this._frameTimer++;
            if (this._frameTimer >= d.frameUpdate) {
                this._frameTimer = 0;
                this.updateFrameAnimation();
            }
        }
        if (d.bit && d.bit[0] === 3 && this._loadedPath !== undefined && this.seasonPath() !== this._loadedPath) this.loadTexture();
        this.updatePlacement();
    };

    Sprite_DocsDoodad.prototype.screenPosition = function() {
        const d = this._data;
        if (d.posMode === 1 && typeof $gameMap !== 'undefined' && $gameMap) {
            return DocsDoodads.mapToScreen(d.x, d.y);
        }
        return { x: d.x || 0, y: d.y || 0 };
    };

    Sprite_DocsDoodad.prototype.updatePlacement = function() {
        const d = this._data;
        const editing = Boolean(DocsDoodads.Workspace && DocsDoodads.Workspace.mounted);
        if (this._motionSource !== d.motion || editing) {
            this._motionSource = d.motion;
            this._motion = DocsDoodads.Motion.normalize(d.motion);
        }
        const motion = DocsDoodads.Motion.sample(this._motion, DocsDoodads.frameCount() / 60, (d.x || 0) + (d.y || 0));
        const pos = this.screenPosition();
        const sx = d.scaleX !== undefined ? d.scaleX : 1;
        const sy = d.scaleY !== undefined ? d.scaleY : 1;

        this.anchor.x = d.anchorX !== undefined ? d.anchorX : 0.5;
        this.anchor.y = d.anchorY !== undefined ? d.anchorY : 1.0;
        this.x = pos.x;
        this.y = pos.y + motion.offsetY;
        this.scale.x = sx * motion.scaleMul;
        this.scale.y = sy * motion.scaleMul;
        this.skew.x = motion.skewX;
        this.rotation = (d.rotation || 0) * Math.PI / 180 + this._spin;
        this.z = DocsDoodads.Depth.spriteZ(d);
        this._docsSortY = pos.y + (DocsDoodads.Depth.baseY(d) - d.y);

        let visible = true;
        let dim = 1;
        let fx = null;
        if (editing) {
            visible = !d.editorHidden;
            this._transitionP = null;
            // Conditional doodads stay editable but look faded while their condition is false.
            if (visible && DocsDoodads.Appearance.isConditional(d) && !DocsDoodads.Appearance.isVisible(d, {})) dim = 0.45;
        } else {
            const shown = DocsDoodads.Appearance.isConditional(d) ? DocsDoodads.Appearance.isVisible(d, {}) : true;
            const type = d.transition && d.transition.type;
            if (type && type !== 'none') {
                const frames = d.transition.frames !== undefined ? d.transition.frames : DocsDoodads.Transition.defaults.frames;
                // The first frame starts settled, so maps never open mid-transition.
                if (this._transitionP === null || this._transitionP === undefined) this._transitionP = shown ? 1 : 0;
                this._transitionP = DocsDoodads.Transition.advance(this._transitionP, shown, frames);
                fx = DocsDoodads.Transition.sample(type, this._transitionP);
                visible = this._transitionP > 0;
            } else {
                this._transitionP = null;
                visible = shown;
            }
        }
        if (fx) {
            this.y += fx.offsetY;
            this.scale.x *= fx.scaleMul;
            this.scale.y *= fx.scaleMul;
        }
        this._transitionAlpha = fx ? fx.alphaMul : 1;
        const layerSettings = DocsDoodads.Lighting.mapSettings(typeof $gameMap !== 'undefined' && $gameMap ? $gameMap.mapId() : 0);
        if (!(editing ? DocsDoodads.Layers.visibleInEditor(d, layerSettings) : DocsDoodads.Layers.visibleInGame(d, layerSettings))) visible = false;
        this.visible = visible;
        this.alpha = (d.opacity !== undefined ? d.opacity : 1) * motion.alphaMul * dim * this._transitionAlpha * this.updateSeeThrough(editing);

        this.refreshAppearance();
        this.updateDissolve(fx);
        if (this._shimmerFilter) {
            this._shimmerFilter.uniforms.time = DocsDoodads.frameCount() / 60;
        }
        this.updateShadow();
    };

    // Screen rectangle of the drawn frame.
    Sprite_DocsDoodad.prototype.screenRect = function() {
        const d = this._data;
        const w = (d.frameW || (this.texture ? this.texture.frame.width : 48)) * Math.abs(this.scale.x);
        const h = (d.frameH || (this.texture ? this.texture.frame.height : 48)) * Math.abs(this.scale.y);
        return { x: this.x - this.anchor.x * w, y: this.y - this.anchor.y * h, w, h };
    };

    // Fades a tall doodad while the player is hidden behind it (and flags the player for the silhouette).
    Sprite_DocsDoodad.prototype.updateSeeThrough = function(editing) {
        const settings = DocsDoodads.World.settings().seeThrough;
        const th = typeof $gameMap !== 'undefined' && $gameMap && $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
        let target = 1;
        if (!editing && this.visible !== false && DocsDoodads.Atmosphere.featureOn('seeThrough') && DocsDoodads.SeeThrough.appliesTo(this._data, settings, th)) {
            const player = DocsDoodads.Atmosphere._playerRect;
            if (player && DocsDoodads.SeeThrough.occludes(this.screenRect(), this._docsSortY, DocsDoodads.Depth.resolve(this._data), player, player.baseY)) {
                DocsDoodads.Atmosphere._playerHidden = true;
                if (settings.mode !== 'silhouette') target = Math.max(0.05, Math.min(1, Number(settings.opacity)));
            }
        }
        const current = this._seeAlpha !== undefined ? this._seeAlpha : 1;
        this._seeAlpha = DocsDoodads.SeeThrough.step(current, target, settings.speed);
        return this._seeAlpha;
    };

    // Dissolve and crumble transitions add a noise filter only while they run.
    Sprite_DocsDoodad.prototype.updateDissolve = function(fx) {
        const active = Boolean(fx && fx.dissolve > 0 && fx.dissolve < 1);
        const filters = this.filters ? this.filters.slice() : [];
        const index = this._dissolveFilter ? filters.indexOf(this._dissolveFilter) : -1;
        if (!active) {
            if (index >= 0) {
                filters.splice(index, 1);
                this.filters = filters.length ? filters : null;
            }
            return;
        }
        if (!this._dissolveFilter) {
            try {
                this._dissolveFilter = new PIXI.Filter(undefined, DocsDoodads.Transition.dissolveFragment, { uAmount: 0, uBlock: 1, uFall: 0 });
                this._dissolveFilter.padding = 12;
            } catch (error) {
                return;
            }
        }
        const crumble = this._data.transition && this._data.transition.type === 'crumble';
        this._dissolveFilter.uniforms.uAmount = fx.dissolve;
        this._dissolveFilter.uniforms.uBlock = crumble ? 4 : 1;
        this._dissolveFilter.uniforms.uFall = crumble ? 10 : 0;
        if (index < 0) {
            filters.push(this._dissolveFilter);
            this.filters = filters;
        }
    };

    // Rebuilds the filter stack only when tint, hue, blur, blend or shimmer settings change.
    Sprite_DocsDoodad.prototype.refreshAppearance = function() {
        const d = this._data;
        const sig = DocsDoodads.Appearance.signature(d);
        if (sig === this._appearanceSig) return;
        this._appearanceSig = sig;
        this.blendMode = DocsDoodads.Appearance.blendMode(d);
        const filters = [];
        try {
            if (DocsDoodads.Appearance.needsColorFilter(d)) {
                const tone = [Number(d.r) || 0, Number(d.g) || 0, Number(d.b) || 0, Number(d.grey) || 0];
                if (typeof ColorFilter !== 'undefined') {
                    const filter = new ColorFilter();
                    filter.setColorTone(tone);
                    filter.setHue(Number(d.hue) || 0);
                    filters.push(filter);
                } else if (typeof ToneFilter !== 'undefined') {
                    const filter = new ToneFilter();
                    filter.adjustHue(Number(d.hue) || 0);
                    filter.adjustTone(tone[0], tone[1], tone[2]);
                    filter.adjustSaturation(-tone[3]);
                    filters.push(filter);
                }
            }
            if (Number(d.blur) > 0 && PIXI.filters && PIXI.filters.BlurFilter) {
                filters.push(new PIXI.filters.BlurFilter(Math.min(20, Number(d.blur))));
            }
            if ((Number(d.contrast) > 0 || d.sepia || d.bright) && PIXI.filters && PIXI.filters.ColorMatrixFilter) {
                const matrix = new PIXI.filters.ColorMatrixFilter();
                let multiply = false;
                if (Number(d.contrast) > 0) { matrix.contrast(Number(d.contrast) * 0.01, multiply); multiply = true; }
                if (d.sepia) { matrix.sepia(multiply); multiply = true; }
                if (d.bright) { matrix.brightness(1.6, multiply); multiply = true; }
                filters.push(matrix);
            }
            this._shimmerFilter = null;
            if (d.motion && d.motion.type === 'shimmer' && PIXI.Filter) {
                const motion = DocsDoodads.Motion.normalize(d.motion);
                const shimmer = new PIXI.Filter(undefined, DocsDoodads.Motion.shimmerFragment, { time: 0, amount: motion.amount });
                shimmer.padding = 4;
                this._shimmerFilter = shimmer;
                filters.push(shimmer);
            }
        } catch (error) {
            DocsDoodads.Core.log('Doodad filters could not be built; drawing without them.', error);
        }
        this.filters = filters.length > 0 ? filters : null;
    };

    // The shadow is a black silhouette sprite beside the doodad in the same tilemap.
    Sprite_DocsDoodad.prototype.updateShadow = function() {
        const followSun = this._data.shadow && this._data.shadow.followSun;
        const t = DocsDoodads.Shadow.transform(this._data, followSun ? DocsDoodads.Atmosphere.sun() : null);
        if (!t) {
            this.destroyShadow();
            return;
        }
        if (!this.parent) return;
        let shadow = this._shadowSprite;
        if (!shadow) {
            shadow = this._shadowSprite = new PIXI.Sprite(this.texture);
            shadow.tint = 0x000000;
            shadow.spriteId = this.spriteId;
            this.parent.addChild(shadow);
        }
        if (shadow.parent !== this.parent) this.parent.addChild(shadow);
        shadow.texture = this.texture;
        shadow.anchor.x = this.anchor.x;
        // Sun shadows pivot on the doodad's base so they lie along the ground.
        shadow.anchor.y = t.followsSun ? 1 : this.anchor.y;
        const pos = this.screenPosition();
        const d = this._data;
        const baseShift = t.followsSun
            ? (d.frameH || this.texture.frame.height) * Math.abs(d.scaleY !== undefined ? d.scaleY : 1) * (1 - this.anchor.y) : 0;
        shadow.x = pos.x + t.offsetX;
        shadow.y = pos.y + baseShift + t.offsetY;
        shadow.scale.x = t.scaleX;
        shadow.scale.y = t.scaleY;
        shadow.skew.x = t.followsSun ? 0 : t.skewX + this.skew.x;
        shadow.rotation = t.rotation || 0;
        shadow.alpha = t.alpha * (this._transitionAlpha !== undefined ? this._transitionAlpha : 1);
        shadow.z = DocsDoodads.Depth.shadowZ;
        shadow._docsSortY = shadow.y;
        shadow.visible = this.visible;
        if (shadow._docsBlur !== t.blur) {
            shadow._docsBlur = t.blur;
            shadow.filters = t.blur > 0 && PIXI.filters && PIXI.filters.BlurFilter ? [new PIXI.filters.BlurFilter(Math.min(16, t.blur))] : null;
        }
    };

    Sprite_DocsDoodad.prototype.destroyShadow = function() {
        if (!this._shadowSprite) return;
        if (this._shadowSprite.parent) this._shadowSprite.parent.removeChild(this._shadowSprite);
        this._shadowSprite.destroy();
        this._shadowSprite = null;
    };

    Sprite_DocsDoodad.prototype.updateFrameAnimation = function() {
        if (!this._bmp || !this._bmp._baseTexture) return;
        const total = (this._data.xFrame || 1) * (this._data.yFrame || 1);
        this._currentFrame = (this._currentFrame + 1) % total;
        const xF = this._data.xFrame || 1;
        const col = this._currentFrame % xF;
        const row = Math.floor(this._currentFrame / xF);
        const fw = this._data.frameW || 32;
        const fh = this._data.frameH || 32;
        const startX = this._regionOrigin ? this._regionOrigin.x : (this._data.frameX || 0);
        const startY = this._regionOrigin ? this._regionOrigin.y : (this._data.frameY || 0);
        const frame = DocsDoodads.safeFrame({ x: startX + col * fw, y: startY + row * fh, w: fw, h: fh }, this._bmp.width, this._bmp.height);
        this.texture.frame = new PIXI.Rectangle(frame.x, frame.y, frame.w, frame.h);
    };
}

