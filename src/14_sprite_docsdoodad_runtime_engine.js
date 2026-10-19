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

// Puts one filter in (on) or out of a sprite's filter list, copying the list only when it changes.
// The list is checked every frame: MZ replaces it when it adds its own colour filter.
DocsDoodads.toggleFilter = function(obj, filter, on) {
    const list = obj.filters || null;
    const index = filter && list ? list.indexOf(filter) : -1;
    if (on && filter && index < 0) {
        obj.filters = (list || []).concat([filter]);
    } else if (!on && index >= 0) {
        const next = list.slice();
        next.splice(index, 1);
        obj.filters = next.length ? next : null;
    }
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

    // Change Tileset: doodads cut from the tileset take the new one's pictures.
    if (typeof Spriteset_Map !== 'undefined' && typeof Spriteset_Map.prototype.loadTileset === 'function') {
        $.Spriteset_Map_loadTileset_doodads = Spriteset_Map.prototype.loadTileset;
        Spriteset_Map.prototype.loadTileset = function() {
            $.Spriteset_Map_loadTileset_doodads.call(this);
            for (const sprite of this._docsDoodadSprites || []) {
                if (sprite && sprite._data && sprite._data.bit && sprite._data.bit[0] === 2) sprite.loadTexture();
            }
        };
    }

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
            // A state with its own art (an open door, a broken pot) shows that picture instead.
            this._stateArt = DocsDoodads.States.art(this._data);
            this._stateArtKey = this._stateArt ? this._stateArt.path : '';
            const path = this.seasonPath();
            this._loadedPath = path;
            const packed = path === bit[1] && DocsDoodads.Packer.shouldUse() && typeof $gameMap !== 'undefined' && $gameMap
                ? DocsDoodads.Packer.resolve(DocsDoodads.Packer.forMap($gameMap.mapId()), this._data) : null;
            this._regionOrigin = packed ? { x: packed.x, y: packed.y } : null;
            this._regionSize = packed ? { w: packed.w, h: packed.h } : null;
            bmp = DocsDoodads.loadBitmap(packed ? packed.sheet : path);
        }
        // Only the newest request is shown: an older picture finishing later doesn't replace it.
        this._pendingBmp = bmp || null;
        if (bmp) {
            if (bmp.isReady()) {
                this.setupBitmap(bmp);
            } else {
                bmp.addLoadListener(() => { if (this._pendingBmp === bmp) this.setupBitmap(bmp); });
            }
        }
    };

    // The art for the current season, re-resolved only when the season or the table changes.
    Sprite_DocsDoodad.prototype.seasonPath = function() {
        const bit = this._data && this._data.bit;
        if (!bit || bit[0] !== 3) return null;
        const source = this._stateArt ? this._stateArt.path : bit[1];
        const season = DocsDoodads.Atmosphere.season();
        const sets = DocsDoodads.World.settings().seasons.sets;
        if (this._seasonKey !== season || this._seasonSets !== sets || this._seasonSource !== source) {
            this._seasonKey = season;
            this._seasonSets = sets;
            this._seasonSource = source;
            this._seasonResolved = DocsDoodads.Seasons.resolve(source, season, sets);
        }
        return this._seasonResolved;
    };

    Sprite_DocsDoodad.prototype.setupBitmap = function(bmp) {
        if (!bmp || !bmp._baseTexture) return;
        this._bmp = bmp;
        // Doodad Scaling Mode: smooth (MZ's default) or pixelated.
        if (bmp.smooth !== doodadScaleMode) bmp.smooth = doodadScaleMode;
        const base = this.frameBase(bmp);
        const fw = base.w, fh = base.h, fx = base.x, fy = base.y;
        // A packed region may have been clipped to a smaller image; never read into its neighbours.
        const limitW = this._regionSize ? fx + Math.min(fw, this._regionSize.w) : bmp.width;
        const limitH = this._regionSize ? fy + Math.min(fh, this._regionSize.h) : bmp.height;
        const frame = DocsDoodads.safeFrame({ x: fx, y: fy, w: fw, h: fh }, Math.min(bmp.width, limitW), Math.min(bmp.height, limitH));
        this.texture = new PIXI.Texture(bmp._baseTexture, new PIXI.Rectangle(frame.x, frame.y, frame.w, frame.h));
        if (this._shadowSprite) this._shadowSprite.texture = this.texture;
    };

    // The first frame's rectangle in the picture: a state's own art is split evenly by the frame counts.
    Sprite_DocsDoodad.prototype.frameBase = function(bmp) {
        const d = this._data;
        if (this._stateArt) {
            const w = this._stateArt.w || bmp.width, h = this._stateArt.h || bmp.height;
            return { x: 0, y: 0, w: Math.max(1, Math.floor(w / Math.max(1, d.xFrame || 1))), h: Math.max(1, Math.floor(h / Math.max(1, d.yFrame || 1))) };
        }
        return {
            x: this._regionOrigin ? this._regionOrigin.x : (d.frameX || 0),
            y: this._regionOrigin ? this._regionOrigin.y : (d.frameY || 0),
            w: d.frameW || bmp.width,
            h: d.frameH || bmp.height
        };
    };

    // A change of state: the old picture fades out over the new one, then the new art loads.
    Sprite_DocsDoodad.prototype.updateState = function() {
        const d = this._data;
        const States = DocsDoodads.States;
        const index = States.has(d) ? States.index(d) : 0;
        if (this._stateIndex === undefined) {
            this._stateIndex = index;
            return;
        }
        if (index === this._stateIndex) return;
        const from = this._stateIndex;
        this._stateIndex = index;
        if (DocsDoodads.StateFx) DocsDoodads.StateFx.entered(d, from, index);
        const art = States.art(d);
        if ((art ? art.path : '') === (this._stateArtKey || '')) return;
        this.beginStateFade(States.fadeFrames(d));
        this.loadTexture();
    };

    Sprite_DocsDoodad.prototype.beginStateFade = function(frames) {
        this.endStateFade();
        if (!(frames > 0) || !this._bmp || !this._bmp._baseTexture || !this.texture || !this.texture.frame) return;
        try {
            const old = new PIXI.Sprite(new PIXI.Texture(this._bmp._baseTexture, this.texture.frame.clone()));
            old.anchor.x = this.anchor.x;
            old.anchor.y = this.anchor.y;
            this.addChild(old);
            this._stateFade = { sprite: old, left: frames, total: frames };
        } catch (error) {
            this._stateFade = null;
        }
    };

    Sprite_DocsDoodad.prototype.updateStateFade = function() {
        const f = this._stateFade;
        if (!f) return;
        f.left--;
        if (f.left <= 0) {
            this.endStateFade();
            return;
        }
        f.sprite.anchor.x = this.anchor.x;
        f.sprite.anchor.y = this.anchor.y;
        f.sprite.alpha = f.left / f.total;
    };

    Sprite_DocsDoodad.prototype.endStateFade = function() {
        const f = this._stateFade;
        this._stateFade = null;
        if (!f || !f.sprite) return;
        if (f.sprite.parent) f.sprite.parent.removeChild(f.sprite);
        f.sprite.destroy();
    };

    // Called by the tilemap (which updates its children) and by Spriteset_Map; runs once per frame.
    Sprite_DocsDoodad.prototype.update = function() {
        if (!this._data) return;
        const frame = DocsDoodads.frameCount();
        if (frame === this._lastUpdateFrame && frame !== 0) return;
        this._lastUpdateFrame = frame;
        const d = this._data;
        if (d.rotateSpeed) this._spin += d.rotateSpeed * Math.PI / 180;
        if (d.states || this._stateIndex !== undefined) {
            this.updateState();
            this.updateStateFade();
        }
        // Play Doodad Animation (07_doodad_states_extras.js) runs the strip once, over its own mode.
        const played = DocsDoodads.AnimPlay && (d.xFrame > 1 || d.yFrame > 1) ? DocsDoodads.AnimPlay.step(d) : null;
        if (played !== null) {
            if (played !== this._currentFrame || this._animShownFor !== this._bmp) this.showFrame(played);
        } else if (d.xFrame > 1 || d.yFrame > 1) {
            const A = DocsDoodads.FrameAnim;
            // "Once" waits for its switch; the steps count from when it turned on.
            const switchId = Number(d.anim && d.anim.switchId) || 0;
            const switchOn = switchId > 0 && typeof $gameSwitches !== 'undefined' && $gameSwitches ? $gameSwitches.value(switchId) : false;
            if (A.mode(d) === 'once' && switchId > 0 && !switchOn) this._animSteps = 0;
            if (d.frameUpdate > 0 && A.moving(d, switchOn)) {
                this._frameTimer++;
                if (this._frameTimer >= d.frameUpdate) {
                    this._frameTimer = 0;
                    this._animSteps = (this._animSteps || 0) + 1;
                }
            }
            const total = (d.xFrame || 1) * (d.yFrame || 1);
            const want = A.index(d, this._animSteps || 0, total);
            if (want !== this._currentFrame || this._animShownFor !== this._bmp) this.showFrame(want);
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
        const motion = DocsDoodads.Motion.sample(this._motion, DocsDoodads.frameCount() / 60, (d.x || 0) + (d.y || 0), DocsDoodads.Wind.current().x);
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
            // Leaving (api.remove with a transition) plays the transition out, then the doodad goes.
            const shown = d._docsLeaving ? false : DocsDoodads.Appearance.isConditional(d) ? DocsDoodads.Appearance.isVisible(d, {}) : true;
            const type = d.transition && d.transition.type;
            if (type && type !== 'none') {
                const frames = d.transition.frames !== undefined ? d.transition.frames : DocsDoodads.Transition.defaults.frames;
                // The first frame starts settled, so maps never open mid-transition.
                if (this._transitionP === null || this._transitionP === undefined) this._transitionP = shown ? 1 : 0;
                this._transitionP = DocsDoodads.Transition.advance(this._transitionP, shown, frames);
                fx = DocsDoodads.Transition.sample(type, this._transitionP);
                visible = this._transitionP > 0;
                if (d._docsLeaving && this._transitionP <= 0) this._docsLeft = true;
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
        // Off the screen it isn't drawn and its see-through, filters and shadow wait; `visible` keeps its
        // meaning (lights, reflections and collision read it), so culling uses `renderable`.
        const culled = visible && this.docsCulled(editing);
        this._docsCulled = culled;
        this.renderable = !culled;
        if (culled) {
            this._seeAlpha = 1;
            this.alpha = (d.opacity !== undefined ? d.opacity : 1) * motion.alphaMul * dim * this._transitionAlpha;
            if (this._shadowSprite) this._shadowSprite.renderable = false;
            return;
        }
        this.alpha = (d.opacity !== undefined ? d.opacity : 1) * motion.alphaMul * dim * this._transitionAlpha * this.updateSeeThrough(editing);

        this.refreshAppearance();
        this.updateDissolve(fx);
        if (this._shimmerFilter) {
            this._shimmerFilter.uniforms.time = DocsDoodads.frameCount() / 60;
        }
        this.updateShadow();
        if (this._shadowSprite) this._shadowSprite.renderable = true;
    };

    // Off-screen culling in play: true when the drawn rectangle, with room around it for a shadow, filters
    // and sway (a tile and its own size), is off the screen. A zoom that shows more than the screen widens
    // it. In 3D the billboards decide by the camera (a doodad off the 3D picture last frame is culled); the
    // editor shows everything.
    Sprite_DocsDoodad.prototype.docsCulled = function(editing) {
        const d = this._data;
        if (editing || !d || d.posMode !== 1 || typeof Graphics === 'undefined') return false;
        if (DocsDoodads.Perspective && DocsDoodads.Perspective.active()) {
            return this._docs3dOut === true && DocsDoodads.frameCount() - (this._docs3dOutFrame || 0) <= 1;
        }
        const zoom = typeof $gameScreen !== 'undefined' && $gameScreen && $gameScreen.zoomScale ? Number($gameScreen.zoomScale()) || 1 : 1;
        const w = (d.frameW || (this.texture ? this.texture.frame.width : 48)) * Math.abs(this.scale.x);
        const h = (d.frameH || (this.texture ? this.texture.frame.height : 48)) * Math.abs(this.scale.y);
        const left = this.x - this.anchor.x * w, top = this.y - this.anchor.y * h;
        const pad = 48 + Math.max(w, h);
        const wide = zoom < 1 ? (1 / zoom - 1) / 2 : 0;
        const W = Graphics.width, H = Graphics.height;
        return left + w < -pad - W * wide || top + h < -pad - H * wide || left > W + pad + W * wide || top > H + pad + H * wide;
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
        // The 3D view fades by what's on screen after the camera (docsSeeThroughBillboards); the flat
        // rectangles here would fade the wrong doodads on top of that.
        if (DocsDoodads.Perspective && DocsDoodads.Perspective.active()) {
            this._seeAlpha = 1;
            return 1;
        }
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
        if (!active) {
            DocsDoodads.toggleFilter(this, this._dissolveFilter, false);
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
        DocsDoodads.toggleFilter(this, this._dissolveFilter, true);
    };

    // Rebuilds the filter stack only when tint, hue, blur, blend or shimmer settings change.
    Sprite_DocsDoodad.prototype.refreshAppearance = function() {
        const d = this._data;
        if (!this._appearanceSig) this._appearanceSig = [];
        if (DocsDoodads.Appearance.sameLook(d, this._appearanceSig)) return;
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

    // One frame on (looping).
    Sprite_DocsDoodad.prototype.updateFrameAnimation = function() {
        const total = (this._data.xFrame || 1) * (this._data.yFrame || 1);
        this.showFrame((this._currentFrame + 1) % total);
    };

    // Frame `index` of the strip (left to right, then down).
    Sprite_DocsDoodad.prototype.showFrame = function(index) {
        if (!this._bmp || !this._bmp._baseTexture) return;
        this._currentFrame = index;
        this._animShownFor = this._bmp;
        const xF = this._data.xFrame || 1;
        const col = this._currentFrame % xF;
        const row = Math.floor(this._currentFrame / xF);
        const base = this.frameBase(this._bmp);
        const fw = base.w, fh = base.h, startX = base.x, startY = base.y;
        // In a packed sheet the frames stay inside this doodad's region (as setupBitmap does).
        const limitW = this._regionSize ? Math.min(this._bmp.width, startX + this._regionSize.w) : this._bmp.width;
        const limitH = this._regionSize ? Math.min(this._bmp.height, startY + this._regionSize.h) : this._bmp.height;
        let fx = Math.floor(startX + col * fw), fy = Math.floor(startY + row * fh);
        // A frame clipped off the region shows the first frame instead.
        if (fx >= limitW || fy >= limitH) { fx = Math.floor(startX); fy = Math.floor(startY); }
        const frame = { x: fx, y: fy, w: Math.max(1, Math.min(fw, limitW - fx)), h: Math.max(1, Math.min(fh, limitH - fy)) };
        this.texture.frame = new PIXI.Rectangle(frame.x, frame.y, frame.w, frame.h);
    };
}

