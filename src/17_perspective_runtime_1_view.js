//==========================================================
// SECTION 7I: PERSPECTIVE (3D) RUNTIME: THE VIEW
//==========================================================
// The 3D view on the map's spriteset (the ground texture, sky, billboards, weather, the minimap's frame),
// MZ's scrolling around the camera, facing by the camera, and the camera plugin commands.
if (typeof Spriteset_Map !== 'undefined' && typeof PIXI !== 'undefined') {
    const P = DocsDoodads.Perspective;

    Spriteset_Map.prototype.docsIsGround = function(child) {
        const t = this._tilemap;
        if (child === t._lowerLayer || child === t._upperLayer || child._docsGround) return true;
        // The airship's shadow lies on the ground.
        if (child === this._shadowSprite) return true;
        if (typeof Sprite_Destination !== 'undefined' && child instanceof Sprite_Destination) return true;
        return child.z !== undefined && child.z < 1;
    };

    // The 3D-only height setting that applies to something standing up: doodads (and their particles and
    // effects) or characters (and their gear, balloons and animations).
    Spriteset_Map.prototype.docsBillboardScale = function(obj, s) {
        let base = obj;
        for (let i = 0; i < 4 && base; i++) {
            if ((typeof Sprite_DocsDoodad !== 'undefined' && base instanceof Sprite_DocsDoodad) || base._docsStandTile) return s.doodadScale;
            if (typeof Sprite_Character !== 'undefined' && base instanceof Sprite_Character) return s.characterScale;
            base = base._docsBillboardOwner || base._target || (base._targets && base._targets[0]) || null;
        }
        return 1;
    };

    // Doodads (and their particles and effects) follow the level-ground rule; characters climb hills.
    Spriteset_Map.prototype.docsStandsOnDoodadRule = function(obj) {
        const base = obj._docsBillboardOwner || obj;
        return typeof Sprite_DocsDoodad !== 'undefined' && base instanceof Sprite_DocsDoodad;
    };

    // Half the width of what stands there (its owner's, for gear, effects and balloons), in flat pixels.
    Spriteset_Map.prototype.docsHalfWidthOf = function(obj) {
        const tw = $gameMap.tileWidth();
        const base = obj._docsBillboardOwner || obj._target || obj;
        const w = base instanceof PIXI.Sprite ? Math.abs(base.width) : tw;
        return Math.max(tw * 0.25, Math.min(tw * 4, w / 2 || tw / 2));
    };

    // The foot point a billboard stands on, in flat pixels.
    Spriteset_Map.prototype.docsPivotOf = function(obj, depth) {
        if (depth > 4) return { x: obj.x, y: obj.y };
        const owner = obj._docsBillboardOwner || obj._target || (obj._targets && obj._targets[0]) || null;
        if (owner && owner !== obj && owner.parent) return this.docsPivotOf(owner, (depth || 0) + 1);
        if (typeof Sprite_Character !== 'undefined' && obj instanceof Sprite_Character && obj._character) {
            // A jump or a flying airship stands on its own tile and is drawn higher up.
            const ch = obj._character;
            const jump = typeof ch.jumpHeight === 'function' ? ch.jumpHeight() : 0;
            let flying = typeof Game_Vehicle !== 'undefined' && ch instanceof Game_Vehicle && ch.isAirship && ch.isAirship() ? ch._altitude || 0 : 0;
            // The party flying (Traversal) is drawn up in the air above its own tile too.
            if (DocsDoodads.Traversal && DocsDoodads.Traversal.isPartyMember(ch)) flying += DocsDoodads.Traversal.altitude();
            return { x: obj.x, y: obj.y + jump + flying };
        }
        if (typeof Sprite_DocsDoodad !== 'undefined' && obj instanceof Sprite_DocsDoodad && obj._docsSortY !== undefined) return { x: obj.x, y: obj._docsSortY };
        return { x: obj.x, y: obj.y + (obj._docsPivotDy || 0) };
    };

    Spriteset_Map.prototype.enterDocsPerspective = function() {
        const view = this._docs3dView = new PIXI.Container();
        this._docs3dSky = new PIXI.Sprite(PIXI.Texture.WHITE);
        this._docs3dBillboards = new Sprite_DocsBillboards();
        this._docs3dGizmo = new PIXI.Graphics();
        view.addChild(this._docs3dSky);
        this._docs3dGround = null;
        view.addChild(this._docs3dBillboards);
        view.addChild(this._docs3dGizmo);
        this._baseSprite.addChild(view);
        this._docs3d = true;
    };

    Spriteset_Map.prototype.exitDocsPerspective = function() {
        this._docs3d = false;
        if (this.clearDocsStandTiles) this.clearDocsStandTiles();
        for (const sprite of this._docsDoodadSprites || []) if (sprite._docsSnowCap) sprite._docsSnowCap.visible = false;
        if (this._weather) this._weather.visible = true;
        this._docs3dWeather = null;
        this._docs3dSkyGrad = null;
        this._docs3dCelestial = null;
        // The sky video's sprite goes with the 3D view (the video stays while the map may still show it flat).
        this._docsSkyVideoSprite = null;
        this._docsSkyKey = null;
        this._docsSkyLight = null;
        this._docsWeatherParts = [];
        this._docsSplashes = [];
        P._cam = null;
        if (this._docs3dView) {
            if (this._docs3dView.parent) this._docs3dView.parent.removeChild(this._docs3dView);
            this._docs3dView.destroy({ children: true });
            this._docs3dView = null;
        }
        if (this._docs3dTexture) {
            this._docs3dTexture.destroy(true);
            this._docs3dTexture = null;
        }
        if (this._docsWallTexture) {
            this._docsWallTexture.destroy(true);
            this._docsWallTexture = null;
        }
        this._docs3dGround = null;
        this._docs3dSize = null;
        const tilemap = this._tilemap;
        if (tilemap) {
            tilemap.renderable = true;
            tilemap.width = Graphics.width;
            tilemap.height = Graphics.height;
            if (tilemap.refresh) tilemap.refresh();
            for (const child of tilemap.children) child.renderable = true;
        }
        for (const o of [this._docsLightOverlay, this._docsGlowLayer, this._docsSelectionOutline]) if (o) o.renderable = true;
        DocsDoodads.Perspective.recenter();
    };

    Spriteset_Map.prototype.docsGroundMesh = function(width, height) {
        if (this._docs3dGround && this._docs3dGround._docsW === width && this._docs3dGround._docsH === height) return this._docs3dGround;
        if (this._docs3dGround) {
            this._docs3dGround.parent.removeChild(this._docs3dGround);
            this._docs3dGround.destroy();
        }
        const geometry = new PIXI.Geometry()
            .addAttribute('aVertexPosition', [0, 0, width, 0, width, height, 0, height], 2)
            .addIndex([0, 1, 2, 0, 2, 3]);
        const shader = PIXI.Shader.from(P.groundVertex, P.groundFragment, {
            uSampler: PIXI.Texture.EMPTY, uCam: [0, 0, 1], uF: [0, 0, -1], uR: [1, 0, 0], uU: [0, -1, 0], uFocal: 1,
            uHalf: [width / 2, height / 2], uGround: [1, 1], uFog: [0, 0, 0, 0], uFogRange: [1, 2], uTarget: [0, 0], uCurve: 0, uRadius: 1, uAxis: [1, 0], uAhead: [0, -1], uVoid: [0, 0, 0], uAlpha: 1, uSnow: 0, uClouds: [0, 1, 0, 0], uMist: [0, 1, 0, 0],
            uWater: [0, 0, 0, 0], uWaterTime: 0, uWaterMask: PIXI.Texture.EMPTY, uMapTiles: [1, 1], uTile: [48, 48], uOrigin: [0, 0], uLoop: [0, 0],
            uLightDir: DocsDoodads.Terrain.light.slice(), uWakes: new Float32Array(DocsDoodads.Water3D.maxWakes * 4)
        });
        const mesh = new PIXI.Mesh(geometry, shader);
        mesh._docsW = width;
        mesh._docsH = height;
        this._docs3dView.addChildAt(mesh, 1);
        this._docs3dGround = mesh;
        return mesh;
    };

    Spriteset_Map.prototype.updateDocsPerspective = function() {
        const s = P.active();
        const renderer = DocsDoodads.Compat.getRenderer();
        if (!s || !renderer || !this._tilemap || !PIXI.Mesh || !PIXI.Shader) {
            if (this._docs3d) this.exitDocsPerspective();
            return;
        }
        if (!this._docs3d) this.enterDocsPerspective();
        const tilemap = this._tilemap;
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const gw = s.viewTiles * tw, gh = s.viewTiles * th;
        this._docs3dSize = { width: gw, height: gh };
        if (tilemap.width !== gw || tilemap.height !== gh) {
            tilemap.width = gw;
            tilemap.height = gh;
            if (tilemap.refresh) tilemap.refresh();
            P.recenter();
        }
        if (!this._docs3dTexture || this._docs3dTexture.width !== gw || this._docs3dTexture.height !== gh) {
            if (this._docs3dTexture) this._docs3dTexture.destroy(true);
            this._docs3dTexture = PIXI.RenderTexture.create({ width: gw, height: gh });
        }
        const rt = this._docs3dTexture;
        rt.baseTexture.scaleMode = s.smoothGround ? PIXI.SCALE_MODES.LINEAR : PIXI.SCALE_MODES.NEAREST;
        this.updateDocsStandTiles(s);
        const W = Graphics.width, H = Graphics.height;
        const radius = s.curve === 'flat' ? 0 : (s.curveRadius > 0 ? s.curveRadius * tw : P.fitRadius($gameMap.width(), tw));
        const cam = P._cam = P.camera({ target: { x: gw / 2, y: gh / 2 + th / 2 }, pitch: s.pitch, yaw: s.yaw, fov: s.fov, zoom: s.zoom, width: W, height: H,
            curve: s.curve, radius, lean: s.lean });

        // Ground pass: everything flat, with billboards switched off.
        const billboards = [];
        for (const child of tilemap.children) {
            if (this.docsIsGround(child)) continue;
            billboards.push(child);
            child._docsWasRenderable = child.renderable;
            child.renderable = false;
        }
        tilemap.renderable = true;
        renderer.render(tilemap, rt, true);
        // Walls rising through floor decals draw from the ground drawn again without them.
        const wallRt = this.docsWallGround(renderer, tilemap, gw, gh);
        for (const child of billboards) child.renderable = child._docsWasRenderable !== false;
        tilemap.renderable = false;
        for (const o of [this._docsLightOverlay, this._docsGlowLayer, this._docsSelectionOutline]) {
            if (!o) continue;
            o.renderable = true;
            if (o.visible) {
                renderer.render(o, rt, false);
                if (wallRt) renderer.render(o, wallRt, false);
            }
            o.renderable = false;
        }

        // The view sits where the tilemap was: above the sky (parallax), below weather and pictures.
        const parent = tilemap.parent;
        if (this._docs3dView.parent !== parent || parent.children.indexOf(this._docs3dView) !== parent.children.indexOf(tilemap) + 1) {
            parent.addChildAt(this._docs3dView, parent.children.indexOf(tilemap) + 1);
        }
        const sky = this._docs3dSky;
        const parallax = Boolean($gameMap.parallaxName && $gameMap.parallaxName());
        sky.visible = !parallax;
        sky.width = W;
        sky.height = H;
        sky.tint = parseInt(s.skyColor.slice(1), 16);
        this.updateDocsSky(s, cam, parallax);

        const terrain = DocsDoodads.Terrain.grid();
        const mesh = this.docsGroundMesh(W, H);
        mesh.visible = !terrain;
        const u = mesh.shader.uniforms;
        // Settled snow keeps off water, so it needs the water mask as well.
        if (s.water || s.snowCover) this.docsWaterMask();
        if (s.water) this.updateDocsWakes(s, DocsDoodads.frameCount() / 60);
        u.uSampler = rt;
        u.uCam = [cam.C.x, cam.C.y, cam.C.z];
        u.uF = [cam.F.x, cam.F.y, cam.F.z];
        u.uR = [cam.R.x, cam.R.y, cam.R.z];
        u.uU = [cam.U.x, cam.U.y, cam.U.z];
        u.uFocal = cam.focal;
        u.uHalf = [W / 2, H / 2];
        u.uGround = [gw, gh];
        const fogRange = [s.fogStart * tw, s.fogEnd * tw];
        u.uFogRange = fogRange;
        u.uTarget = [cam.target.x, cam.target.y];
        u.uCurve = cam.curve === 'sphere' ? 1 : cam.curve === 'cylinder' ? 2 : 0;
        u.uRadius = cam.radius || 1;
        u.uAxis = [cam.axis.x, cam.axis.y];
        u.uAhead = [cam.ahead.x, cam.ahead.y];
        this.docsWaterUniforms(u, s, cam);
        u.uFog = s.fogColor ? P.hexToRgb(s.fogColor).concat([1]) : [0, 0, 0, 0];
        u.uVoid = P.hexToRgb(s.voidColor);
        u.uAlpha = 1;
        const snow = this._docs3dSnow = this.updateDocsSnowCover(s);
        u.uSnow = snow;
        this.docsSkyUniforms(u, s);

        // Billboards, far to near, faded by fog and lit like the ground.
        const light = this._docsLightInfo || null;
        const items = [];
        for (const obj of billboards) {
            if (!obj.visible) continue;
            const pivot = this.docsPivotOf(obj);
            const halfWidth = this.docsHalfWidthOf(obj);
            if (terrain) pivot.h = this.docsStandsOnDoodadRule(obj)
                ? DocsDoodads.Terrain.doodadHeightPxAtFlat(pivot.x, pivot.y, halfWidth)
                : DocsDoodads.Terrain.footHeightPxAtFlat(pivot.x, pivot.y, halfWidth);
            const m = P.scaleAbout(P.billboardMatrix(cam, pivot), pivot, this.docsBillboardScale(obj, s));
            // Off the 3D picture (behind the camera, its foot with room for its own size outside the view, or
            // lost in the fog): not listed nor drawn, and its doodad's shadow and effects wait next frame
            // (Sprite_DocsDoodad.docsCulled). Models can be larger than their sprite, so they are always listed.
            const frame = DocsDoodads.frameCount();
            if (!m) {
                obj._docs3dOut = true;
                obj._docs3dOutFrame = frame;
                continue;
            }
            if (!(obj._data && obj._data.model)) {
                const footX = m.a * pivot.x + m.c * pivot.y + m.tx, footY = m.b * pivot.x + m.d * pivot.y + m.ty;
                const base = obj._docsBillboardOwner || obj;
                const size = Math.max(halfWidth * 2, base instanceof PIXI.Sprite ? Math.abs(base.height) : $gameMap.tileHeight());
                const reach = Math.hypot(m.a, m.b) * size + 64;
                const out = footX < -reach || footX > W + reach || footY < -reach || footY > H + reach;
                obj._docs3dOut = out;
                obj._docs3dOutFrame = frame;
                if (out) continue;
            }
            const fog = P.fogAt(Math.hypot(pivot.x - cam.target.x, pivot.y - cam.target.y), fogRange[0], fogRange[1]);
            if (fog >= 1) {
                obj._docs3dOut = true;
                obj._docs3dOutFrame = frame;
                continue;
            }
            if (obj.renderable === false && obj._docsCulled !== undefined) obj.renderable = true;
            // A doodad with a 3D model is drawn as the model.
            if (obj._data && obj._data.model && typeof Sprite_DocsDoodad !== 'undefined' && obj instanceof Sprite_DocsDoodad) {
                const models = this.docsModelItems(obj, cam, pivot, fog, light ? P.lightAt(light, pivot.x, pivot.y) : null, s);
                if (models) {
                    for (const it of models) items.push(it);
                    obj._docs3dMatrix = m;
                    obj._docs3dFrame = DocsDoodads.frameCount();
                    continue;
                }
            }
            const isEffekseer = typeof Sprite_Animation !== 'undefined' && obj instanceof Sprite_Animation;
            // Effekseer draws in screen space at its target; it shrinks with distance like the target does.
            if (isEffekseer) obj._docs3dScale = Math.hypot(m.a, m.b);
            obj._docs3dMatrix = m;
            obj._docs3dFrame = DocsDoodads.frameCount();
            // Ground within the sprite's own width (plus half a tile) is drawn before it, not over it.
            items.push({ obj, depth: P.groundDepth(cam, pivot.x, pivot.y), bias: $gameMap.tileHeight() * 0.5 + halfWidth, z: obj.z || 0, spriteId: obj.spriteId || 0, matrix: isEffekseer ? null : m,
                alpha: 1 - fog, tint: light ? P.lightAt(light, pivot.x, pivot.y) : null });
        }
        const see = this._docs3dSee = this.docsPlayerSeeThrough();
        const hidden = this.docsSeeThroughBillboards(items, see);
        this.updateDocsSnowCaps(items, snow);
        for (const band of this.updateDocsWeather(s, cam, fogRange)) items.push(band);
        items.sort(P.compareBillboards);
        const seeSettings = DocsDoodads.World.settings().seeThrough;
        this._docs3dBillboards.silhouette = hidden && seeSettings.mode !== 'fade' ? this.docsSilhouetteItems(items, see) : null;
        this._docs3dBillboards.silhouetteColor = DocsDoodads.Lighting.channels(seeSettings.silhouetteColor);
        this._docs3dBillboards.items = terrain ? this.docsInterleaveTerrain(items, this.updateDocsTerrain(cam, s, terrain, rt, fogRange)) : items;
        this.updateDocsGizmos(cam);
    };

    // The sky video (perspective settings skyVideo...), drawn into `container` at `index`. Returns whether it
    // shows (it waits until the video has a frame). Day and night tint it with the light, if asked.
    Spriteset_Map.prototype.updateDocsSkyVideo = function(s, cam, state, container, index) {
        const V = DocsDoodads.SkyVideo;
        const path = s && s.skyVideo;
        if (this._docsSkyVideoPath !== path) {
            if (this._docsSkyVideoPath) V.release(this._docsSkyVideoPath, this);
            this._docsSkyVideoPath = path || '';
            this._docsSkyVideoEntry = path ? V.acquire(path, this) : null;
        }
        const entry = this._docsSkyVideoEntry;
        let sprite = this._docsSkyVideoSprite;
        if (!entry || !V.ready(entry)) {
            if (sprite) sprite.visible = false;
            return false;
        }
        if (!sprite) {
            sprite = this._docsSkyVideoSprite = new PIXI.TilingSprite(entry.texture, Graphics.width, Graphics.height);
            sprite._docsGround = true;
        }
        if (sprite.texture !== entry.texture) sprite.texture = entry.texture;
        if (sprite.parent !== container || container.children.indexOf(sprite) !== index) container.addChildAt(sprite, Math.max(0, Math.min(index, container.children.length)));
        entry.video.playbackRate = Math.max(0.0625, s.skyVideoSpeed || 0) || 1;
        if (s.skyVideoSpeed === 0) entry.video.pause();
        else if (entry.video.paused) { const p = entry.video.play(); if (p && p.catch) p.catch(() => {}); }
        const horizon = Math.max(1, Math.min(Graphics.height, DocsDoodads.Perspective.horizonY(cam)));
        const L = V.layout(s.skyVideoMode, cam, s.yaw, horizon, entry.video.videoWidth, entry.video.videoHeight);
        sprite.x = 0;
        sprite.y = L.y;
        sprite.width = Graphics.width;
        sprite.height = L.height;
        sprite.tileScale.set(L.scaleX, L.scaleY);
        sprite.tilePosition.set(L.offsetX, L.offsetY);
        sprite.tint = s.skyVideoDayNight && state ? DocsDoodads.Perspective.multiplyTint(0xffffff, state.light.color) : 0xffffff;
        sprite.visible = true;
        return true;
    };

    // Flat maps can show the sky video behind the tiles, in place of the parallax.
    Spriteset_Map.prototype.updateDocsFlatSkyVideo = function() {
        // The map's settings, with any Set Sky Video change.
        const P3 = DocsDoodads.Perspective;
        const mine = (DocsDoodads.Lighting.mapSettings($gameMap.mapId()) || {}).perspective;
        const camera = $gameMap._docsCamera || null;
        // Most flat maps have no sky video and none playing: nothing to merge.
        if (!(mine && mine.skyVideo) && !(camera && camera.skyVideo) && !this._docsSkyVideoPath && !this._docsFlatSkyVideo) return;
        const settings = P3.withOverride(mine, camera);
        const on = !this._docs3d && settings.skyVideo && settings.skyVideoFlat;
        if (!on) {
            if (this._docsFlatSkyVideo) this._docsFlatSkyVideo.visible = false;
            if (!this._docs3d && this._docsSkyVideoPath) this.updateDocsSkyVideo(null, null, null, null, 0);
            return;
        }
        const V = DocsDoodads.SkyVideo;
        if (this._docsSkyVideoPath !== settings.skyVideo) {
            if (this._docsSkyVideoPath) V.release(this._docsSkyVideoPath, this);
            this._docsSkyVideoPath = settings.skyVideo;
            this._docsSkyVideoEntry = V.acquire(settings.skyVideo, this);
        }
        const entry = this._docsSkyVideoEntry;
        let sprite = this._docsFlatSkyVideo;
        if (!entry || !V.ready(entry)) {
            if (sprite) sprite.visible = false;
            return;
        }
        if (!sprite) {
            sprite = this._docsFlatSkyVideo = new PIXI.TilingSprite(entry.texture, Graphics.width, Graphics.height);
        }
        const parent = this._parallax ? this._parallax.parent : this._baseSprite;
        const at = this._parallax ? parent.children.indexOf(this._parallax) + 1 : 0;
        if (sprite.parent !== parent) parent.addChildAt(sprite, at);
        const vw = entry.video.videoWidth, vh = entry.video.videoHeight;
        const scale = Graphics.height / vh;
        sprite.width = Graphics.width;
        sprite.height = Graphics.height;
        sprite.tileScale.set(settings.skyVideoMode === 'fill' ? Graphics.width / vw : scale, scale);
        // A panorama drifts with the map's scrolling, like a distant parallax.
        sprite.tilePosition.set(settings.skyVideoMode === 'fill' ? 0 : -$gameMap.displayX() * $gameMap.tileWidth() * 0.25, 0);
        entry.video.playbackRate = Math.max(0.0625, settings.skyVideoSpeed || 0) || 1;
        sprite.visible = true;
    };

    // Day and night: a sky that follows the clock, stars, the sun and moon, and their light.
    Spriteset_Map.prototype.updateDocsSky = function(s, cam, parallax) {
        const minutes = DocsDoodads.Atmosphere.minutes();
        const state = s.dayNight && minutes !== null && minutes !== undefined ? DocsDoodads.Sky3D.at(minutes) : null;
        this._docsSkyLight = state ? state.light.dir : null;
        const view = this._docs3dView;
        if (!this._docs3dSkyGrad) {
            this._docs3dSkyGrad = new PIXI.Sprite(PIXI.Texture.EMPTY);
            this._docs3dCelestial = new PIXI.Graphics();
        }
        const grad = this._docs3dSkyGrad, cel = this._docs3dCelestial;
        const at = view.children.indexOf(this._docs3dSky) + 1;
        if (grad.parent !== view) view.addChildAt(grad, at);
        if (cel.parent !== view) view.addChildAt(cel, at + 1);
        cel.clear();
        const video = this.updateDocsSkyVideo(s, cam, state, view, view.children.indexOf(grad));
        if (!state) {
            grad.visible = false;
            return;
        }
        const W = Graphics.width, H = Graphics.height;
        // The sky: its top colour fading to the horizon colour at the horizon line, horizon colour below.
        if (!parallax && !video) {
            this._docs3dSky.tint = state.horizon;
            const key = state.top + '|' + state.horizon;
            if (this._docsSkyKey !== key) {
                this._docsSkyKey = key;
                const c = document.createElement('canvas');
                c.width = 1;
                c.height = 64;
                const g = c.getContext('2d');
                const hex = n => '#' + ('000000' + n.toString(16)).slice(-6);
                const lg = g.createLinearGradient(0, 0, 0, 64);
                lg.addColorStop(0, hex(state.top));
                lg.addColorStop(1, hex(state.horizon));
                g.fillStyle = lg;
                g.fillRect(0, 0, 1, 64);
                if (this._docsSkyTexture) this._docsSkyTexture.destroy(true);
                this._docsSkyTexture = PIXI.Texture.from(c);
                grad.texture = this._docsSkyTexture;
            }
            const horizon = Math.max(1, Math.min(H, DocsDoodads.Perspective.horizonY(cam)));
            grad.visible = true;
            grad.x = 0;
            grad.y = 0;
            grad.width = W;
            grad.height = horizon;
        } else {
            grad.visible = false;
        }
        // Stars, then the moon and sun, above the horizon.
        const S = DocsDoodads.Sky3D;
        const horizonY = DocsDoodads.Perspective.horizonY(cam);
        if (state.stars > 0) {
            if (!S._stars) {
                const rng = DocsDoodads.Scatter.rng(1234);
                S._stars = Array.from({ length: 320 }, () => ({ az: rng() * 360, el: 2 + Math.asin(rng()) * 180 / Math.PI * 0.95, size: rng() < 0.85 ? 1 : 2, tw: rng() * 6.28 }));
            }
            const t = DocsDoodads.frameCount() / 60;
            for (const st of S._stars) {
                const p = S.skyPoint(cam, st.az, st.el);
                if (!p || p.y >= horizonY || p.x < -2 || p.x > W + 2 || p.y < -2) continue;
                cel.beginFill(0xffffff, state.stars * (0.55 + 0.45 * Math.sin(t * 2 + st.tw)));
                cel.drawRect(p.x, p.y, st.size, st.size);
                cel.endFill();
            }
        }
        const disc = (body, color, radius, glow) => {
            if (body.elevation <= -2) return;
            const p = S.skyPoint(cam, body.azimuth, body.elevation);
            if (!p || p.y >= horizonY + radius) return;
            for (let i = 4; i >= 1; i--) {
                cel.beginFill(color, glow * 0.12 * (5 - i) / 4);
                cel.drawCircle(p.x, p.y, radius * (1 + i * 0.6));
                cel.endFill();
            }
            cel.beginFill(color, 1);
            cel.drawCircle(p.x, p.y, radius);
            cel.endFill();
        };
        disc(state.moon, 0xe6ecff, 10, 0.6);
        disc(state.sun, state.sun.elevation < 15 ? 0xffd08a : 0xfff6d8, 15, 1);
    };

    // Editor selection as boxes standing on the ground.
    Spriteset_Map.prototype.updateDocsGizmos = function(cam) {
        const g = this._docs3dGizmo;
        g.clear();
        const ws = DocsDoodads.Workspace;
        if (!ws || !ws.mounted) return;
        // Doodads left on a mountain or slope (placed before terrain was turned on) show red boxes.
        if (DocsDoodads.Terrain.active()) {
            for (const d of DocsDoodads.doodads() || []) {
                if (d.editorHidden || DocsDoodads.Terrain.allowsDoodad(d)) continue;
                const item = ws.doodadFlatBox(d);
                const box = P.gizmoBox(cam, item.rect, item.pivot);
                if (!box) continue;
                g.lineStyle(1.5, DocsDoodads.Ui.mapColor('warning'), 0.9);
                for (const [a, b] of box) { g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); }
            }
        }
        for (const item of ws.selection3d ? ws.selection3d() : []) {
            const box = P.gizmoBox(cam, item.rect, item.pivot);
            if (!box) continue;
            g.lineStyle(1.5, DocsDoodads.Ui.mapColor('selection3d'), 0.95);
            for (const [a, b] of box) { g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); }
        }
    };

    // ---- Water ----
    // Which tiles are water (built once per map), as an array for lookups and a texture for the shaders.
    Spriteset_Map.prototype.docsWaterMask = function() {
        const world = DocsDoodads.World.settings().reflections;
        const key = $gameMap.mapId() + '|' + (Number(world.regionId) || 0);
        if (this._docsWater && this._docsWater.key === key && this._docsWater.data === $dataMap.data) return this._docsWater;
        if (this._docsWater && this._docsWater.texture) this._docsWater.texture.destroy(true);
        const w = $gameMap.width(), h = $gameMap.height();
        const isWaterTile = id => (typeof Tilemap !== 'undefined' && Tilemap.isWaterTile ? Tilemap.isWaterTile(id) : false);
        const pixels = DocsDoodads.Water3D.mask(w, h, (x, y) => DocsDoodads.Reflection.isWaterAt([0, 1, 2, 3].map(z => $gameMap.tileId(x, y, z)),
            $gameMap.regionId(x, y), world, isWaterTile));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        const image = ctx.createImageData(w, h);
        image.data.set(pixels);
        ctx.putImageData(image, 0, 0);
        const texture = PIXI.Texture.from(canvas);
        texture.baseTexture.scaleMode = PIXI.SCALE_MODES.LINEAR;
        let any = false;
        for (let i = 0; i < pixels.length; i += 4) if (pixels[i]) { any = true; break; }
        this._docsWater = { key, data: $dataMap.data, pixels, width: w, height: h, texture, any };
        return this._docsWater;
    };

    Spriteset_Map.prototype.docsOnWater = function(x, y) {
        const m = this._docsWater;
        if (!m) return false;
        x = $gameMap.roundX(x);
        y = $gameMap.roundY(y);
        return x >= 0 && y >= 0 && x < m.width && y < m.height && m.pixels[(y * m.width + x) * 4] > 0;
    };

    // Wakes behind things moving through water: boats, ships, and characters wading in shallow water.
    Spriteset_Map.prototype.updateDocsWakes = function(s, now) {
        if (!s.waterWakes) {
            this._docsWakes = [];
            return;
        }
        const W = DocsDoodads.Water3D;
        this._docsWakeState = this._docsWakeState || new WeakMap();
        let wakes = W.prune(this._docsWakes || [], now);
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const frame = DocsDoodads.frameCount();
        const movers = [].concat($gameMap.vehicles ? $gameMap.vehicles().filter(v => v._mapId === $gameMap.mapId()) : [],
            $gamePlayer.isInVehicle() ? [] : [$gamePlayer], $gamePlayer.followers().visibleFollowers(), $gameMap.events());
        for (const ch of movers) {
            if (!ch || ch.isTransparent() && !(typeof Game_Vehicle !== 'undefined' && ch instanceof Game_Vehicle)) continue;
            let state = this._docsWakeState.get(ch);
            if (!state) this._docsWakeState.set(ch, state = {});
            const x = Math.round(ch._realX), y = Math.round(ch._realY);
            if (W.shouldWake(state, { onWater: this.docsOnWater(x, y), moving: ch.isMoving(), tile: x + ',' + y, frame })) {
                const vehicle = typeof Game_Vehicle !== 'undefined' && ch instanceof Game_Vehicle;
                wakes = W.addWake(wakes, (ch._realX + 0.5) * tw, (ch._realY + 0.5) * th, now, vehicle ? 1.4 : 1);
            }
        }
        this._docsWakes = wakes;
    };

    // Map pixels of flat (tilemap) point 0,0. On looping maps the camera's position wraps; this follows
    // it continuously (once per frame), so waves and weather don't jump at the seam.
    Spriteset_Map.prototype.docsMapOrigin = function() {
        const frame = DocsDoodads.frameCount();
        const o = this._docsOrigin && this._docsOrigin.mapId === $gameMap.mapId() ? this._docsOrigin : null;
        if (o && o.frame === frame) return o;
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const ox = $gameMap.displayX() * tw, oy = $gameMap.displayY() * th;
        if (!o) return (this._docsOrigin = { mapId: $gameMap.mapId(), x: ox, y: oy, rx: ox, ry: oy, frame });
        const mw = $gameMap.isLoopHorizontal() ? $gameMap.width() * tw : 0, mh = $gameMap.isLoopVertical() ? $gameMap.height() * th : 0;
        o.x += DocsDoodads.Water3D.unwrap(ox - o.rx, mw);
        o.y += DocsDoodads.Water3D.unwrap(oy - o.ry, mh);
        o.rx = ox;
        o.ry = oy;
        o.frame = frame;
        return o;
    };

    // ---- Weather ----
    DocsDoodads.Weather3D.textures = function() {
        if (this._textures) return this._textures;
        const make = (w, h, draw) => {
            const c = document.createElement('canvas');
            c.width = w; c.height = h;
            draw(c.getContext('2d'), w, h);
            return DocsDoodads.sharedTexture(c);
        };
        this._textures = {
            streak: make(4, 32, (g, w, h) => {
                const grad = g.createLinearGradient(0, 0, 0, h);
                grad.addColorStop(0, 'rgba(255,255,255,0)');
                grad.addColorStop(1, 'rgba(255,255,255,1)');
                g.fillStyle = grad;
                g.fillRect(1, 0, 2, h);
            }),
            flake: make(16, 16, (g) => {
                const grad = g.createRadialGradient(8, 8, 0, 8, 8, 8);
                grad.addColorStop(0, 'rgba(255,255,255,1)');
                grad.addColorStop(0.5, 'rgba(255,255,255,0.8)');
                grad.addColorStop(1, 'rgba(255,255,255,0)');
                g.fillStyle = grad;
                g.fillRect(0, 0, 16, 16);
            }),
            splash: make(32, 12, (g) => {
                g.strokeStyle = 'rgba(255,255,255,1)';
                g.lineWidth = 2;
                g.beginPath();
                g.ellipse(16, 6, 14, 4.5, 0, 0, Math.PI * 2);
                g.stroke();
            })
        };
        return this._textures;
    };

    // Rain, storms and snow from MZ's Set Weather Effect, falling through the space around the camera.
    Spriteset_Map.prototype.updateDocsWeather = function(s, cam, fogRange) {
        const W = DocsDoodads.Weather3D;
        if (this._weather) this._weather.visible = !s.weather;
        const params = s.weather ? W.params($gameScreen.weatherType(), $gameScreen.weatherPower(), s.weatherDensity) : null;
        let layer = this._docs3dWeather;
        if (!params) {
            if (layer) layer.visible = false;
            this._docsWeatherParts = [];
            this._docsSplashes = [];
            return [];
        }
        if (!layer) {
            layer = this._docs3dWeather = new PIXI.Container();
            this._docs3dWeatherDim = new PIXI.Sprite(PIXI.Texture.WHITE);
            this._docs3dWeatherDim.tint = 0x000000;
            layer.addChild(this._docs3dWeatherDim);
        }
        const view = this._docs3dView;
        if (layer.parent !== view || view.children.indexOf(layer) !== view.children.indexOf(this._docs3dGizmo) - 1) {
            view.addChildAt(layer, view.children.indexOf(this._docs3dGizmo));
        }
        layer.visible = true;
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const origin = this.docsMapOrigin();
        const box = { x: cam.target.x + origin.x, y: cam.target.y + origin.y, radius: Math.min(s.viewTiles, 24) * tw / 2,
            height: (params.kind === 'flake' ? 8 : 10) * th };
        const now = DocsDoodads.frameCount() / 60;
        this._docsWeatherRng = this._docsWeatherRng || DocsDoodads.Scatter.rng(Date.now());
        const ground = (x, y) => DocsDoodads.Terrain.heightPxAtFlat(x - origin.x, y - origin.y);
        const moved = W.step(W.resize(this._docsWeatherParts || [], params.count, box, this._docsWeatherRng), 1 / 60, params, box, this._docsWeatherRng, now, ground);
        this._docsWeatherParts = moved.particles;
        // Some raindrops on water ripple it.
        if (s.water && this._docsWater) {
            for (const sp of moved.splashes) {
                if (this._docsWeatherRng() > 0.15) continue;
                if (this.docsOnWater(Math.floor(sp.x / tw), Math.floor(sp.y / th))) {
                    this._docsWakes = DocsDoodads.Water3D.addWake(this._docsWakes || [], sp.x, sp.y, now, 0.35);
                }
            }
        }
        this._docsSplashes = W.pruneSplashes((this._docsSplashes || []).concat(moved.splashes), now);

        const tex = W.textures();
        const base = this._docsLightInfo ? this._docsLightInfo.base : null;
        const light = base ? Math.max(0.25, (base[0] + base[1] + base[2]) / 3) : 1;
        const shade = c => {
            const ch = sh => Math.round(((c >> sh) & 255) * light);
            return (ch(16) << 16) | (ch(8) << 8) | ch(0);
        };
        const dim = this._docs3dWeatherDim;
        dim.width = Graphics.width;
        dim.height = Graphics.height;
        dim.alpha = params.dim;
        const at = (x, y, z) => {
            const fx = x - origin.x, fy = y - origin.y;
            const g = P.groundPoint(cam, fx, fy, z);
            if (!g.visible) return null;
            const p = P.project(cam, g.x, g.y, g.z);
            if (!p) return null;
            p.fog = P.fogAt(Math.hypot(fx - cam.target.x, fy - cam.target.y), fogRange[0], fogRange[1]);
            return p;
        };
        // Work out where every drop and splash is first, so they can be split into depth bands.
        const drops = [];
        let near = Infinity, far = -Infinity;
        const keep = d => {
            drops.push(d);
            if (d.head.depth < near) near = d.head.depth;
            if (d.head.depth > far) far = d.head.depth;
        };
        for (const pt of this._docsWeatherParts) {
            const head = at(pt.x, pt.y, pt.z);
            if (!head || head.fog >= 1) continue;
            if (params.kind === 'streak') {
                const tail = at(pt.x - params.wind * params.length, pt.y, pt.z + params.length);
                if (!tail) continue;
                const dx = tail.x - head.x, dy = tail.y - head.y, len = Math.hypot(dx, dy);
                if (len >= 0.5) keep({ kind: 'streak', head, dx, dy, len });
            } else {
                keep({ kind: 'flake', head, seed: pt.seed });
            }
        }
        for (const spl of this._docsSplashes) {
            const head = at(spl.x, spl.y, spl.z);
            if (head && head.fog < 1) keep({ kind: 'splash', head, age: (now - spl.born) / W.splashLife });
        }
        // Each band is drawn with the billboards at its depth, so trees and hills in front hide the
        // weather behind them. Sorted at its near edge: whatever is behind any of its drops goes first.
        const count = W.depthBands;
        const bands = this._docs3dWeatherBands = this._docs3dWeatherBands || [];
        this._docs3dWeatherHolder = this._docs3dWeatherHolder || new PIXI.Container();
        for (let b = bands.length; b < count; b++) {
            const box = new PIXI.Container();
            this._docs3dWeatherHolder.addChild(box);
            bands.push({ box, pool: [], used: 0 });
        }
        for (const band of bands) band.used = 0;
        const sprite = (band, texture) => {
            if (band.used >= band.pool.length) {
                const sp = new PIXI.Sprite(texture);
                band.box.addChild(sp);
                band.pool.push(sp);
            }
            const sp = band.pool[band.used++];
            sp.texture = texture;
            sp.visible = true;
            return sp;
        };
        const color = shade(params.color);
        for (const d of drops) {
            const band = bands[W.band(d.head.depth, near, far)];
            const head = d.head;
            if (d.kind === 'streak') {
                const sp = sprite(band, tex.streak);
                sp.anchor.set(0.5, 1);
                sp.x = head.x; sp.y = head.y;
                sp.rotation = Math.atan2(d.dx, -d.dy);
                sp.scale.set(Math.max(0.25, params.size * head.scale) / 2, d.len / 32);
                sp.tint = color;
                sp.alpha = params.alpha * (1 - head.fog);
            } else if (d.kind === 'flake') {
                const sp = sprite(band, tex.flake);
                sp.anchor.set(0.5, 0.5);
                sp.x = head.x; sp.y = head.y;
                sp.rotation = 0;
                sp.scale.set(Math.max(0.1, params.size * head.scale * (0.7 + 0.6 * d.seed) / 8));
                sp.tint = color;
                sp.alpha = params.alpha * (1 - head.fog);
            } else {
                const sp = sprite(band, tex.splash);
                sp.anchor.set(0.5, 0.5);
                sp.x = head.x; sp.y = head.y;
                sp.rotation = 0;
                sp.scale.set(head.scale * (0.25 + 0.5 * d.age));
                sp.tint = color;
                sp.alpha = 0.6 * (1 - d.age) * (1 - head.fog);
            }
        }
        const items = [];
        bands.forEach((band, b) => {
            for (let i = band.used; i < band.pool.length; i++) band.pool[i].visible = false;
            if (band.used) items.push({ obj: band.box, depth: W.bandDepth(b, near, far), bias: 0, z: 0, spriteId: 0, matrix: null, alpha: 1, tint: null });
        });
        return items;
    };

    // The water uniforms both ground shaders share.
    Spriteset_Map.prototype.docsWaterUniforms = function(u, s, cam) {
        const mask = this._docsWater;
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const now = DocsDoodads.frameCount() / 60;
        const base = this._docsLightInfo ? this._docsLightInfo.base : null;
        const light = base ? (base[0] + base[1] + base[2]) / 3 : 1;
        u.uWater = [s.water && mask && mask.any ? 1 : 0, s.waterStrength, s.waterShine, light];
        u.uWaterTime = now * s.waterSpeed;
        u.uWaterMask = mask ? mask.texture : PIXI.Texture.EMPTY;
        u.uMapTiles = [$gameMap.width(), $gameMap.height()];
        u.uTile = [tw, th];
        const o = this.docsMapOrigin();
        u.uOrigin = [o.x, o.y];
        u.uLoop = [$gameMap.isLoopHorizontal() ? 1 : 0, $gameMap.isLoopVertical() ? 1 : 0];
        u.uWakes = DocsDoodads.Water3D.pack(this._docsWakes || [], now);
        u.uLightDir = (this._docsSkyLight || DocsDoodads.Terrain.light).slice();
        if (u.uCam !== undefined) u.uCam = [cam.C.x, cam.C.y, cam.C.z];
        if (u.uGround !== undefined) u.uGround = [this._docs3dTexture.width, this._docs3dTexture.height];
    };

    // In 3D the parallax is the sky: it turns with the camera and stays put as the party walks.
    $.Spriteset_Map_updateParallax_3d = Spriteset_Map.prototype.updateParallax;
    Spriteset_Map.prototype.updateParallax = function() {
        $.Spriteset_Map_updateParallax_3d.call(this);
        const s = P.active();
        if (s && this._parallax && this._parallax.bitmap) {
            this._parallax.origin.x = (s.yaw / 360) * this._parallax.bitmap.width * 2;
            this._parallax.origin.y = 0;
        }
    };

    // A step of Spriteset_Map.update (DocsDoodads.spritesetSteps).
    Spriteset_Map.prototype.updateDocsSkyVideoOnMap = function() {
        if (typeof $gameMap !== 'undefined' && $gameMap && $gameMap.mapId()) this.updateDocsFlatSkyVideo();
    };

    $.Spriteset_Map_destroy_3d = Spriteset_Map.prototype.destroy;
    Spriteset_Map.prototype.destroy = function(options) {
        if (this._docsSkyVideoPath) DocsDoodads.SkyVideo.release(this._docsSkyVideoPath, this);
        this._docsSkyVideoPath = '';
        this._docsSkyVideoEntry = null;
        if (this._docsWater && this._docsWater.texture) this._docsWater.texture.destroy(true);
        this._docsWater = null;
        if (this._docs3dTexture) {
            this._docs3dTexture.destroy(true);
            this._docs3dTexture = null;
        }
        if (this._docsWallTexture) {
            this._docsWallTexture.destroy(true);
            this._docsWallTexture = null;
        }
        // Textures and meshes the 3D view made itself (MZ frees the sprites' textures, not their pictures).
        if (this._docsTerrainMesh) { this._docsTerrainMesh.destroy(); this._docsTerrainMesh = null; }
        this._docsTerrainTopo = null;
        if (this._docsLightTexture) { this._docsLightTexture.destroy(true); this._docsLightTexture = null; }
        if (this._docsSkyTexture) { this._docsSkyTexture.destroy(true); this._docsSkyTexture = null; }
        for (const bitmap of this._docsStandBitmaps ? this._docsStandBitmaps.values() : []) {
            if (!bitmap) continue;
            DocsDoodads.SnowCover.dropCapsFor(bitmap._baseTexture);
            bitmap.destroy();
        }
        this._docsStandBitmaps = null;
        if (this.docsDestroyMinimap) this.docsDestroyMinimap();
        // Model textures replaced by a live reload were kept for these sprites; they go with them.
        DocsDoodads.Models.freeRetired();
        P._cam = null;
        $.Spriteset_Map_destroy_3d.call(this, options);
    };
}

// The ground texture covers viewTiles x viewTiles tiles around the camera, so MZ scrolls as if the
// screen were that big; the camera looks at its middle.
DocsDoodads.Perspective.recenter = function() {
    if (typeof $gamePlayer !== 'undefined' && $gamePlayer && typeof $gameMap !== 'undefined' && $gameMap && $gameMap.mapId()) {
        $gamePlayer.center($gamePlayer.x, $gamePlayer.y);
    }
};

if (typeof Game_Map !== 'undefined') {
    const P = DocsDoodads.Perspective;
    $.Game_Map_screenTileX_3d = Game_Map.prototype.screenTileX;
    Game_Map.prototype.screenTileX = function() {
        const s = P.active();
        return s ? s.viewTiles : $.Game_Map_screenTileX_3d.call(this);
    };
    $.Game_Map_screenTileY_3d = Game_Map.prototype.screenTileY;
    Game_Map.prototype.screenTileY = function() {
        const s = P.active();
        return s ? s.viewTiles : $.Game_Map_screenTileY_3d.call(this);
    };

    // MZ stops scrolling at the map's edges (and centres maps smaller than the screen), which in 3D
    // leaves the camera still while the party walks off the bottom of the window. The void colour
    // shows past the edges, so in 3D the display follows freely; looping axes keep MZ's wrapping.
    $.Game_Map_setDisplayPos_3d = Game_Map.prototype.setDisplayPos;
    Game_Map.prototype.setDisplayPos = function(x, y) {
        $.Game_Map_setDisplayPos_3d.call(this, x, y);
        if (!P.active()) return;
        if (!this.isLoopHorizontal()) this._displayX = this._parallaxX = x;
        if (!this.isLoopVertical()) this._displayY = this._parallaxY = y;
    };
    for (const [name, axis, sign] of [['scrollDown', 'Y', 1], ['scrollUp', 'Y', -1], ['scrollRight', 'X', 1], ['scrollLeft', 'X', -1]]) {
        const base = $['Game_Map_' + name + '_3d'] = Game_Map.prototype[name];
        Game_Map.prototype[name] = function(distance) {
            const loops = axis === 'X' ? this.isLoopHorizontal() : this.isLoopVertical();
            if (loops || !P.active()) return base.call(this, distance);
            this['_display' + axis] += sign * distance;
            this['_parallax' + axis] += sign * distance;
        };
    }

    // Map touch: MZ asks for x and y separately, so both use the touch point.
    $.Game_Map_canvasToMapX_3d = Game_Map.prototype.canvasToMapX;
    Game_Map.prototype.canvasToMapX = function(x) {
        if (!P.liveCamera()) return $.Game_Map_canvasToMapX_3d.call(this, x);
        const at = DocsDoodads.screenPointToMap(x, typeof TouchInput !== 'undefined' ? TouchInput.y : 0);
        return at ? this.roundX(Math.floor(at.x / this.tileWidth())) : -1;
    };
    $.Game_Map_canvasToMapY_3d = Game_Map.prototype.canvasToMapY;
    Game_Map.prototype.canvasToMapY = function(y) {
        if (!P.liveCamera()) return $.Game_Map_canvasToMapY_3d.call(this, y);
        const at = DocsDoodads.screenPointToMap(typeof TouchInput !== 'undefined' ? TouchInput.x : 0, y);
        return at ? this.roundY(Math.floor(at.y / this.tileHeight())) : -1;
    };

    // A new map starts with its own camera.
    $.Game_Map_setup_3d = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        this._docsCamera = null;
        this._docsCameraTween = null;
        $.Game_Map_setup_3d.call(this, mapId);
    };

    // Camera moves from plugin commands, and Q / W turning on maps that allow it.
    // A step of Game_Map.update (DocsDoodads.mapSteps).
    Game_Map.prototype.updateDocsCamera3d = function(sceneActive) {
        if (this._docsCameraTween) {
            const now = P.stepTween(this._docsCameraTween);
            this._docsCamera = Object.assign({}, this._docsCamera, now);
            if (this._docsCameraTween.done) this._docsCameraTween = null;
        }
        const s = P.active();
        const editing = DocsDoodads.Workspace && DocsDoodads.Workspace.mounted;
        if (s && s.rotate && sceneActive && !editing && typeof Input !== 'undefined' && !this._docsCameraTween
            && !(typeof $gameMessage !== 'undefined' && $gameMessage.isBusy())) {
            const turn = Input.isTriggered('pageup') ? -90 : Input.isTriggered('pagedown') ? 90 : 0;
            if (turn) this.docsMoveCamera({ yaw: s.yaw + turn }, 20);
        }
        const key = s ? s.viewTiles : 0;
        if (key !== this._docs3dKey) {
            this._docs3dKey = key;
            P.recenter();
        }
    };

    Game_Map.prototype.docsMoveCamera = function(target, frames) {
        const s = P.active() || P.normalize((DocsDoodads.Lighting.mapSettings(this.mapId()) || {}).perspective);
        const from = { pitch: s.pitch, yaw: s.yaw, zoom: s.zoom, fov: s.fov, curvature: P.curvatureOf(s, this.width()) };
        this._docsCamera = Object.assign({}, this._docsCamera, from);
        // A new shape takes over at once; its roundness eases in from where the world is now.
        if (target.curve === 'sphere' || target.curve === 'cylinder') this._docsCamera.curve = target.curve;
        if (!frames || frames <= 0) {
            const tween = P.startTween(from, target, 1);
            this._docsCamera = Object.assign({}, this._docsCamera, P.stepTween(tween));
            this._docsCameraTween = null;
        } else {
            this._docsCameraTween = P.startTween(from, target, frames);
        }
    };
}

// Arrow keys are relative to the camera, and characters show the side that faces it.
if (typeof Game_Player !== 'undefined') {
    $.Game_Player_getInputDirection_3d = Game_Player.prototype.getInputDirection;
    Game_Player.prototype.getInputDirection = function() {
        const dir = $.Game_Player_getInputDirection_3d.call(this);
        const s = DocsDoodads.Perspective.active();
        return s && dir ? DocsDoodads.Perspective.inputDirection(dir, s.yaw) : dir;
    };
}
if (typeof Sprite_Character !== 'undefined') {
    $.Sprite_Character_characterPatternY_3d = Sprite_Character.prototype.characterPatternY;
    Sprite_Character.prototype.characterPatternY = function() {
        const s = DocsDoodads.Perspective.active();
        if (!s) return $.Sprite_Character_characterPatternY_3d.call(this);
        const dir = DocsDoodads.Perspective.viewDirection(this._character.direction(), s.yaw);
        return (dir - 2) / 2;
    };
}

if (typeof PluginManager !== 'undefined' && typeof PluginManager.registerCommand === 'function') {
    PluginManager.registerCommand(pluginName, 'setCamera', function(args) {
        if (typeof $gameMap === 'undefined' || !$gameMap) return;
        const target = {};
        const relative = String(args.relative) === 'true';
        const s = DocsDoodads.Perspective.active() || DocsDoodads.Perspective.normalize((DocsDoodads.Lighting.mapSettings($gameMap.mapId()) || {}).perspective);
        const now = Object.assign({}, s, { curvature: DocsDoodads.Perspective.curvatureOf(s, $gameMap.width()) });
        for (const key of ['pitch', 'yaw', 'zoom', 'fov', 'curvature']) {
            const raw = String(args[key] === undefined ? '' : args[key]).trim();
            if (raw === '') continue;
            target[key] = relative && key !== 'zoom' ? now[key] + Number(raw) : Number(raw);
        }
        if (target.curvature !== undefined) target.curvature = Math.max(0, Math.min(100, target.curvature));
        // "Flat" eases the curve out; a round shape switches and keeps (or eases to) its curvature.
        const curve = String(args.curve || '').trim();
        if (curve === 'flat' && target.curvature === undefined) target.curvature = 0;
        else if (curve === 'sphere' || curve === 'cylinder') {
            target.curve = curve;
            if (target.curvature === undefined && now.curvature === 0) target.curvature = 10;
        }
        $gameMap.docsMoveCamera(target, Number(args.duration) || 0);
        if (String(args.wait) === 'true' && Number(args.duration) > 0 && this && this.wait) this.wait(Number(args.duration));
    });
    PluginManager.registerCommand(pluginName, 'setPerspective', function(args) {
        if (typeof $gameMap === 'undefined' || !$gameMap) return;
        const mode = String(args.mode || 'map');
        $gameMap._docsCamera = Object.assign({}, $gameMap._docsCamera, { enabled: mode === 'map' ? null : mode === 'on' });
        if (mode === 'map') delete $gameMap._docsCamera.enabled;
    });
    // Set Sky Video: another video (or none) for this visit to the map, or back to the map's own.
    PluginManager.registerCommand(pluginName, 'setSkyVideo', function(args) {
        if (typeof $gameMap === 'undefined' || !$gameMap) return;
        const over = Object.assign({}, $gameMap._docsCamera);
        const video = String(args.video === undefined ? '' : args.video).trim();
        if (!video) delete over.skyVideo;
        else over.skyVideo = /^none$/i.test(video) ? '' : (video.includes('/') ? video : 'movies/' + video);
        const mode = String(args.mode || 'map');
        if (mode === 'map') delete over.skyVideoMode; else over.skyVideoMode = mode;
        const speed = String(args.speed === undefined ? '' : args.speed).trim();
        if (speed === '') delete over.skyVideoSpeed; else over.skyVideoSpeed = Number(speed);
        $gameMap._docsCamera = over;
    });
    PluginManager.registerCommand(pluginName, 'resetCamera', function(args) {
        if (typeof $gameMap === 'undefined' || !$gameMap) return;
        const mine = DocsDoodads.Perspective.normalize((DocsDoodads.Lighting.mapSettings($gameMap.mapId()) || {}).perspective);
        $gameMap.docsMoveCamera({ pitch: mine.pitch, yaw: mine.yaw, zoom: mine.zoom, fov: mine.fov, curve: mine.curve,
            curvature: DocsDoodads.Perspective.curvatureOf(mine, $gameMap.width()) }, Number(args.duration) || 0);
    });
}

