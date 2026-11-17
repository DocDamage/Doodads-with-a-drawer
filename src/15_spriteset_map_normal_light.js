//==========================================================
// SECTION 7E: FLAT-MAP NORMAL LIGHT RUNTIME
//==========================================================
(function() {
    const N = DocsDoodads.NormalLight;

    N.requestManifest = function() {
        if (typeof DataManager === 'undefined' || typeof DataManager.docsRequest !== 'function') return;
        DataManager.docsRequest(this.manifestPath, xhr => {
            if (xhr.status >= 400 || !xhr.responseText) { this.setManifest(null); return; }
            try { this.setManifest(JSON.parse(xhr.responseText)); }
            catch (error) {
                this.setManifest(null);
                console.warn('[DocsDoodads] Normal-map manifest could not be read:', error);
            }
        });
    };

    if (typeof DataManager !== 'undefined' && typeof DataManager.loadDatabase === 'function') {
        $.DataManager_loadDatabase_normal_light = DataManager.loadDatabase;
        DataManager.loadDatabase = function() {
            $.DataManager_loadDatabase_normal_light.call(this);
            N.requestManifest();
        };
    }

    if (typeof Spriteset_Map === 'undefined' || typeof PIXI === 'undefined' || !PIXI.Filter) return;

    N.sourceFor = function(sprite) {
        if (!sprite) return null;
        if (typeof Sprite_DocsDoodad !== 'undefined' && sprite instanceof Sprite_DocsDoodad) return sprite._loadedPath || null;
        if (typeof Sprite_Character !== 'undefined' && sprite instanceof Sprite_Character) {
            const character = sprite._character;
            if (!character || !character.characterName || (character.tileId && character.tileId() > 0)) return null;
            const sheet = sprite._docsAnim && sprite._docsAnim.sheet ? sprite._docsAnim.sheet : character.characterName();
            return sheet ? 'img/characters/' + String(sheet).replace(/\.png$/i, '') + '.png' : null;
        }
        return null;
    };

    N.spritePoint = function(sprite) {
        const frame = sprite.texture && sprite.texture.frame;
        const w = frame ? frame.width : 0, h = frame ? frame.height : 0;
        const anchor = sprite.anchor || { x: 0, y: 0 };
        const sx = sprite.scale ? sprite.scale.x : 1, sy = sprite.scale ? sprite.scale.y : 1;
        const dx = (0.5 - anchor.x) * w * sx, dy = (0.5 - anchor.y) * h * sy;
        const turn = Number(sprite.rotation) || 0, c = Math.cos(turn), s = Math.sin(turn);
        return { x: (Number(sprite.x) || 0) + dx * c - dy * s, y: (Number(sprite.y) || 0) + dx * s + dy * c };
    };

    N.textureFor = function(bitmap) {
        if (!bitmap || !bitmap._baseTexture) return null;
        if (!bitmap._docsNormalTexture || bitmap._docsNormalTexture.baseTexture !== bitmap._baseTexture) {
            bitmap._docsNormalTexture = new PIXI.Texture(bitmap._baseTexture);
        }
        return bitmap._docsNormalTexture;
    };

    N.detach = function(sprite) {
        if (!sprite) return;
        DocsDoodads.toggleFilter(sprite, sprite._docsNormalFilter, false);
        sprite._docsNormalActive = false;
    };

    N.finishLoad = function(sprite, request, normalBitmap) {
        if (!sprite || sprite._docsNormalRequest !== request || !request.base || sprite.bitmap !== request.base && sprite._bmp !== request.base) return false;
        if (!normalBitmap || !normalBitmap._baseTexture || normalBitmap.width !== request.base.width || normalBitmap.height !== request.base.height) {
            this.detach(sprite);
            if (!sprite._docsNormalSizeWarned) {
                sprite._docsNormalSizeWarned = true;
                DocsDoodads.Core.log(`Normal map ${request.normalPath} must match ${request.source} (${request.base.width}×${request.base.height}).`);
            }
            return false;
        }
        const texture = this.textureFor(normalBitmap);
        if (!texture) return false;
        sprite._docsNormalBitmap = normalBitmap;
        if (!sprite._docsNormalFilter) {
            try {
                const uniforms = this.uniforms([], [1, 1, 1]);
                uniforms.uNormalMap = texture;
                uniforms.uNormalUv = [0, 0, 1, 1];
                uniforms.uLightMap = PIXI.Texture.WHITE;
                uniforms.uLightMapSize = [1, 1];
                uniforms.uUseOcclusion = 0;
                const base = sprite._docsNormalBase;
                N.transformUniforms(sprite.worldTransform, sprite.texture && sprite.texture.frame, sprite.anchor, uniforms, base && base.worldTransform);
                sprite._docsNormalFilter = new PIXI.Filter(undefined, this.fragment, uniforms);
                sprite._docsNormalFilter.padding = 0;
                const apply = sprite._docsNormalFilter.apply;
                sprite._docsNormalFilter.apply = function() {
                    const base = sprite._docsNormalBase;
                    N.transformUniforms(sprite.worldTransform, sprite.texture && sprite.texture.frame, sprite.anchor, this.uniforms, base && base.worldTransform);
                    return apply.apply(this, arguments);
                };
            } catch (error) {
                DocsDoodads.Core.log('Normal-map filter could not be built; drawing without it.', error);
                return false;
            }
        }
        sprite._docsNormalFilter.uniforms.uNormalMap = texture;
        return true;
    };

    // The editor replaces this to make a missing map (8.3.1). A deployed game only uses what the manifest names.
    N.requestGenerated = N.requestGenerated || function() { return false; };
    // The editor replaces this to remake a map whose picture changed since it was made.
    N.checkGenerated = N.checkGenerated || function() { return false; };

    N.shadeFor = function(sprite, info) {
        if (typeof Sprite_DocsDoodad !== 'undefined' && sprite instanceof Sprite_DocsDoodad) return sprite._data && sprite._data.shade;
        return { mode: info && info.characters === 'made' ? 'made' : 'file' };
    };

    // Memoised per sprite: the key string is only rebuilt when the picture, its Shading, its frame grid or
    // the manifest changes, not every frame for every doodad.
    N.normalFor = function(sprite, source, info) {
        if (!sprite || !source) return null;
        // Before its picture loads a sprite shows an empty 1×1 frame: no grid can be read from that.
        const base = sprite._bmp || sprite.bitmap;
        if (!base || typeof base.isReady === 'function' && !base.isReady()) return null;
        const raw = this.shadeFor(sprite, info), s = this.shade(raw), frame = sprite.texture && sprite.texture.frame;
        const g = this.gridOf(frame), memo = sprite._docsNormalPick;
        if (memo && memo.source === source && memo.manifest === this.manifest && memo.mode === s.mode && memo.strength === s.strength &&
            memo.shape === s.shape && memo.w === g.w && memo.h === g.h && memo.x === g.x && memo.y === g.y) {
            if (memo.request && !memo.path) this.requestGenerated(memo.request);
            return memo.path;
        }
        const found = this.resolve(source, s, frame);
        const request = found.key ? { key: found.key, source, shape: s.shape, strength: s.strength, grid: g, path: found.path } : null;
        sprite._docsNormalPick = { source, manifest: this.manifest, mode: s.mode, strength: s.strength, shape: s.shape,
            w: g.w, h: g.h, x: g.x, y: g.y, path: found.path, request };
        if (request && found.missing) this.requestGenerated(request);
        else if (request) this.checkGenerated(request);
        return found.path;
    };

    N.ensure = function(sprite, source, normalPath = this.pathFor(source)) {
        const base = sprite && (sprite._bmp || sprite.bitmap);
        if (!sprite || !base || !normalPath) { this.detach(sprite); return false; }
        const old = sprite._docsNormalRequest;
        if (old && old.source === source && old.base === base && old.normalPath === normalPath) return Boolean(sprite._docsNormalBitmap && sprite._docsNormalFilter);
        this.detach(sprite);
        sprite._docsNormalBitmap = null;
        const request = sprite._docsNormalRequest = { source, normalPath, base };
        const bitmap = DocsDoodads.loadBitmap(normalPath);
        if (!bitmap) return false;
        const finish = () => this.finishLoad(sprite, request, bitmap);
        if (!bitmap.isReady || bitmap.isReady()) return finish();
        if (bitmap.addLoadListener) bitmap.addLoadListener(finish);
        return false;
    };

    N.updateSprite = function(sprite, source, info, max) {
        if (!sprite || !source || !sprite.visible || sprite.renderable === false || !this.ensure(sprite, source, this.normalFor(sprite, source, info))) {
            this.detach(sprite);
            return false;
        }
        const filter = sprite._docsNormalFilter, frame = sprite.texture && sprite.texture.frame;
        if (!filter || !frame || frame.width <= 0 || frame.height <= 0) { this.detach(sprite); return false; }
        const point = this.spritePoint(sprite), lights = this.pick(info.lights, point.x, point.y, max);
        this.uniforms(lights, info.base, filter.uniforms, light => {
            const flicker = DocsDoodads.Lighting.flicker(info.time, light.seed, light.flicker);
            return (Number(light.intensity) || 0) * flicker;
        });
        filter.uniforms.uNormalUv = this.frameUv(frame, sprite._docsNormalBitmap.width, sprite._docsNormalBitmap.height);
        const base = sprite._docsNormalBase;
        this.transformUniforms(sprite.worldTransform, frame, sprite.anchor, filter.uniforms, base && base.worldTransform);
        DocsDoodads.toggleFilter(sprite, filter, true);
        sprite._docsNormalActive = true;
        return true;
    };

    Spriteset_Map.prototype.docsNormalMax = function() {
        if (this._docs3d || DocsDoodads.Perspective && DocsDoodads.Perspective.active && DocsDoodads.Perspective.active()) return 0;
        const option = DocsDoodads.qualityOption();
        return N.effectiveMax(DocsDoodads.World.settings().normalLight, option);
    };

    Spriteset_Map.prototype.docsNormalSprites = function() {
        const out = (this._docsDoodadSprites || []).slice();
        for (const sprite of this._characterSprites || []) out.push(sprite);
        return out;
    };

    Spriteset_Map.prototype.updateDocsNormalSprites = function() {
        const sprites = this.docsNormalSprites(), max = this.docsNormalMax();
        if (!max) { for (const sprite of sprites) N.detach(sprite); return 0; }
        const info = this._docsNormalLightInfo || { base: [1, 1, 1], lights: [], time: DocsDoodads.frameCount() / 60 };
        info.characters = DocsDoodads.World.settings().normalLight.characters;
        let count = 0;
        for (const sprite of sprites) {
            sprite._docsNormalBase = this._baseSprite || null;
            if (N.updateSprite(sprite, N.sourceFor(sprite), info, max)) count++;
        }
        return count;
    };

    N.copyMaskTransform = function(mask, source, normal) {
        mask.texture = source.texture;
        mask.x = source.x; mask.y = source.y;
        mask.anchor.set(source.anchor ? source.anchor.x : 0, source.anchor ? source.anchor.y : 0);
        mask.scale.set(source.scale ? source.scale.x : 1, source.scale ? source.scale.y : 1);
        mask.skew.set(source.skew ? source.skew.x : 0, source.skew ? source.skew.y : 0);
        mask.rotation = source.rotation || 0;
        mask.alpha = Number.isFinite(source.worldAlpha) ? source.worldAlpha : source.alpha === undefined ? 1 : source.alpha;
        mask.visible = true; mask.renderable = true; mask.blendMode = PIXI.BLEND_MODES.NORMAL;
        mask._docsSource = source;
        mask._docsNormalWhite = Boolean(normal);
        if (!N._alphaFilter) N._alphaFilter = new PIXI.Filter(undefined, N.alphaFragment, {});
        if (!N._blackAlphaFilter) N._blackAlphaFilter = new PIXI.Filter(undefined, N.blackAlphaFragment, {});
        mask.filters = [normal ? N._alphaFilter : N._blackAlphaFilter];
    };

    N.isDrawableSprite = function(sprite) {
        const frame = sprite && sprite.texture && sprite.texture.frame;
        return Boolean(sprite && sprite.visible && sprite.renderable !== false && sprite.alpha !== 0 && frame && frame.width > 0 && frame.height > 0);
    };

    Spriteset_Map.prototype.docsNormalOrderedSources = function() {
        if (!this._tilemap || !this._tilemap.children) return [];
        const children = this._tilemap.children.slice();
        if (typeof this._tilemap._compareChildOrder === 'function') children.sort(this._tilemap._compareChildOrder.bind(this._tilemap));
        return children;
    };

    Spriteset_Map.prototype.updateDocsNormalMasks = function(show, renderer, width, height) {
        const pool = this._docsNormalMasks = this._docsNormalMasks || [];
        if (!show || !this._docsLightScene || !renderer) {
            for (const mask of pool) mask.visible = false;
            if (this._docsNormalCoverageScene) this._docsNormalCoverageScene.visible = false;
            return 0;
        }
        const normalSources = new Set(this.docsNormalSprites().filter(sprite => sprite && sprite._docsNormalActive));
        if (!normalSources.size) {
            for (const mask of pool) mask.visible = false;
            if (this._docsNormalCoverageScene) this._docsNormalCoverageScene.visible = false;
            return 0;
        }
        const coverage = this._docsNormalCoverageScene = this._docsNormalCoverageScene || new PIXI.Container();
        coverage.visible = true;
        coverage.removeChildren();
        const ordered = this.docsNormalOrderedSources();
        const layers = this._docsNormalTileLayers = this._docsNormalTileLayers || [];
        let count = 0, layerCount = 0;
        for (const source of ordered) {
            const isLayer = source === this._tilemap._lowerLayer || source === this._tilemap._upperLayer;
            if (isLayer) {
                if (!source.visible || source.renderable === false) continue;
                let item = layers[layerCount++];
                if (!item) {
                    item = layers[layers.length] = { sprite: new PIXI.Sprite(PIXI.Texture.EMPTY), texture: null };
                    if (!N._blackAlphaFilter) N._blackAlphaFilter = new PIXI.Filter(undefined, N.blackAlphaFragment, {});
                    item.sprite.filters = [N._blackAlphaFilter];
                    item.sprite._docsNormalWhite = false;
                }
                if (!item.texture || item.texture.width !== width || item.texture.height !== height) {
                    if (item.texture) item.texture.destroy(true);
                    item.texture = PIXI.RenderTexture.create({ width, height });
                    item.sprite.texture = item.texture;
                }
                renderer.render(source, item.texture, true);
                item.sprite.x = 0; item.sprite.y = 0; item.sprite.alpha = 1; item.sprite.visible = true;
                item.sprite._docsSource = source;
                coverage.addChild(item.sprite);
                continue;
            }
            if (!N.isDrawableSprite(source)) continue;
            const use = pool[count] || (pool[count] = new PIXI.Sprite(PIXI.Texture.EMPTY));
            N.copyMaskTransform(use, source, normalSources.has(source));
            coverage.addChild(use);
            count++;
        }
        for (let i = count; i < pool.length; i++) pool[i].visible = false;
        for (let i = layerCount; i < layers.length; i++) layers[i].sprite.visible = false;
        return normalSources.size;
    };

    Spriteset_Map.prototype.renderDocsNormalLightmap = function(renderer, target, width, height) {
        const ensureTexture = (key) => {
            let texture = this[key];
            if (!texture || texture.width !== width || texture.height !== height) {
                if (texture) texture.destroy(true);
                texture = this[key] = PIXI.RenderTexture.create({ width, height });
            }
            return texture;
        };
        const raw = ensureTexture('_docsNormalRawLightTexture');
        const coverage = ensureTexture('_docsNormalCoverageTexture');
        renderer.render(this._docsLightScene, raw, true);
        const useOcclusion = (this._docsLightMasks || []).some(mask => mask && mask.visible);
        for (const sprite of this.docsNormalSprites()) {
            if (!sprite || !sprite._docsNormalActive || !sprite._docsNormalFilter) continue;
            const uniforms = sprite._docsNormalFilter.uniforms;
            uniforms.uLightMap = raw;
            uniforms.uLightMapSize = [width, height];
            uniforms.uUseOcclusion = useOcclusion ? 1 : 0;
        }
        renderer.render(this._docsNormalCoverageScene, coverage, true);
        if (!this._docsNormalMixScene) {
            this._docsNormalMixScene = new PIXI.Container();
            this._docsNormalMixSprite = new PIXI.Sprite(raw);
            this._docsNormalMixFilter = new PIXI.Filter(undefined, N.ownershipFragment, { uCoverage: coverage });
            this._docsNormalMixSprite.filters = [this._docsNormalMixFilter];
            this._docsNormalMixScene.addChild(this._docsNormalMixSprite);
        }
        this._docsNormalMixSprite.texture = raw;
        this._docsNormalMixFilter.uniforms.uCoverage = coverage;
        renderer.render(this._docsNormalMixScene, target, true);
    };

})();
