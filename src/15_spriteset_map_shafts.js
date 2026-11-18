//==========================================================
// SECTION 7A: LIGHT SHAFTS, SOFT SHADOWS AND GLOW OFF WALLS ON THE MAP (7.3.7, 8.3.2)
//==========================================================
// Light shafts: one filter on the map layer, with a quarter-size picture of what stops light made each frame
// (only while the look has them on). Soft shadows: each lamp's wall mask is drawn once, blurred, into a picture
// of its own and used instead of the hard outline; it is made again only when the outline changes. Glow off walls:
// faint lights where a lamp's light meets a wall. Flat maps only; the 3D view leaves all three out.
(function() {
    if (typeof Spriteset_Map === 'undefined' || typeof PIXI === 'undefined') return;
    const R = DocsDoodads.Rays, S = DocsDoodads.SoftLight, O = DocsDoodads.Occlusion;
    const quality = () => DocsDoodads.PostFX.effectiveQuality(DocsDoodads.World.settings().postfx.quality, DocsDoodads.qualityOption());

    // ---- Light shafts ----
    Spriteset_Map.prototype.docsRaysMask = function(w, h) {
        const qw = Math.max(1, Math.ceil(w / 4)), qh = Math.max(1, Math.ceil(h / 4));
        if (!this._docsRaysTexture || this._docsRaysTexture.width !== qw || this._docsRaysTexture.height !== qh) {
            if (this._docsRaysTexture) this._docsRaysTexture.destroy(true);
            this._docsRaysTexture = PIXI.RenderTexture.create({ width: qw, height: qh });
        }
        const g = this._docsRaysShapes = this._docsRaysShapes || new PIXI.Graphics();
        g.clear();
        g.beginFill(0xffffff, 1); g.drawRect(0, 0, qw, qh); g.endFill();
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const isWall = O.wallQuery ? O.wallQuery($gameMap) : () => false;
        const x0 = Math.floor($gameMap.displayX()), y0 = Math.floor($gameMap.displayY());
        const ox = ($gameMap.displayX() - x0) * tw, oy = ($gameMap.displayY() - y0) * th;
        let blocked = 0;
        g.beginFill(0x000000, 1);
        for (let y = 0; y <= Math.ceil(h / th) + 1; y++) for (let x = 0; x <= Math.ceil(w / tw) + 1; x++) {
            if (!isWall(x0 + x, y0 + y)) continue;
            g.drawRect((x * tw - ox) / 4, (y * th - oy) / 4, tw / 4, th / 4);
            blocked++;
        }
        // Marked doodads: an ellipse over their picture (a canopy, a pillar).
        for (const sprite of this._docsDoodadSprites || []) {
            const d = sprite._data;
            if (!sprite.visible || !R.shades(d)) continue;
            const sw = Math.abs((Number(d.frameW) || 48) * (Number(d.scaleX) || 1)), sh = Math.abs((Number(d.frameH) || 48) * (Number(d.scaleY) || 1));
            const p = DocsDoodads.mapToScreen(Number(d.x) || 0, Number(d.y) || 0);
            const ax = d.anchorX !== undefined ? d.anchorX : 0.5, ay = d.anchorY !== undefined ? d.anchorY : 1;
            const cx = p.x - sw * ax + sw / 2, cy = p.y - sh * ay + sh / 2;
            if (cx + sw < 0 || cy + sh < 0 || cx - sw > w || cy - sh > h) continue;
            g.drawEllipse(cx / 4, cy / 4, sw / 8, sh / 8);
            blocked++;
        }
        g.endFill();
        const renderer = DocsDoodads.Compat.getRenderer();
        if (renderer) renderer.render(g, this._docsRaysTexture, true);
        this._docsRaysBlocked = blocked;
        return this._docsRaysTexture;
    };

    Spriteset_Map.prototype.updateDocsRays = function() {
        const inputs = this._docsHazeInputs, target = this._baseSprite;
        const look = inputs && !inputs.hidden ? inputs.look : null;
        const rays = look && look.rays;
        const w = typeof Graphics !== 'undefined' ? Graphics.width : 816, h = typeof Graphics !== 'undefined' ? Graphics.height : 624;
        const ms = DocsDoodads.Lighting.mapSettings($gameMap.mapId());
        let strength = this._docs3d || !rays ? 0 : R.strength(rays, { quality: inputs.quality, minutes: DocsDoodads.Atmosphere.minutes(), foggy: R.foggy(ms) });
        let light = null, radius = 0, colour = [1, 0.92, 0.75];
        if (strength > 0 && rays.fromLamps) {
            const info = this._docsLightInfo;
            const player = typeof $gamePlayer !== 'undefined' && $gamePlayer ? { x: $gamePlayer.screenX(), y: $gamePlayer.screenY() } : null;
            const lamp = R.pickLamp(info && info.lights, w, h, player);
            if (lamp) {
                light = [lamp.x / w, lamp.y / h];
                radius = lamp.radius * 1.5 / h;
                const c = Number(lamp.color) || 0xffffff;
                colour = [((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255];
            } else strength = 0;
        } else if (strength > 0) {
            light = R.sunPosition(DocsDoodads.Atmosphere.sun().angle);
        }
        let f = this._docsRaysFilter;
        if (!(strength > 0) || !target) {
            if (f && target && target.filters && target.filters.includes(f)) target.filters = target.filters.filter(x => x !== f).length ? target.filters.filter(x => x !== f) : null;
            this._docsRaysStrength = 0;
            return;
        }
        if (!f) {
            try {
                f = this._docsRaysFilter = new PIXI.Filter(undefined, R.fragment, { uMask: PIXI.Texture.WHITE, uLight: [0.5, 0], uColor: colour, uStrength: 0,
                    uLength: 0.6, uSamples: 24, uRadius: 0, uAspect: 1 });
            } catch (error) {
                DocsDoodads.Core.log('Light shafts could not be built; drawing without them.', error);
                this._docsRaysFilter = null;
                return;
            }
        }
        f.uniforms.uMask = this.docsRaysMask(w, h);
        f.uniforms.uLight = light;
        f.uniforms.uColor = colour;
        f.uniforms.uStrength = strength;
        f.uniforms.uLength = rays.length;
        f.uniforms.uSamples = R.samples(inputs.quality);
        f.uniforms.uRadius = radius;
        f.uniforms.uAspect = w / h;
        const list = target.filters || [];
        if (!list.includes(f)) target.filters = [f].concat(list);
        if (!target.filterArea || target.filterArea.width !== w || target.filterArea.height !== h) target.filterArea = new PIXI.Rectangle(0, 0, w, h);
        this._docsRaysStrength = strength;
    };

    const post = Spriteset_Map.prototype.updateDocsPostFx || (typeof Spriteset_Base !== 'undefined' ? Spriteset_Base.prototype.updateDocsPostFx : null);
    if (typeof post === 'function') {
        Spriteset_Map.prototype.updateDocsPostFx = function() {
            const result = post.apply(this, arguments);
            if (typeof $gameMap !== 'undefined' && $gameMap) this.updateDocsRays();
            return result;
        };
    }

    // ---- Soft shadows and glow off walls ----
    const addFlashlight = Spriteset_Map.prototype.docsAddFlashlight;
    Spriteset_Map.prototype.docsAddFlashlight = function(lights) {
        const out = addFlashlight ? addFlashlight.call(this, lights) || lights : lights;
        const ms = DocsDoodads.Lighting.mapSettings($gameMap.mapId());
        const levels = this._docsSoftLevels = this._docs3d ? { shadows: false, bounce: false } : S.levels(ms && ms.softLight, quality());
        if (!levels.bounce) return out;
        const world = O.settings();
        const rays = Math.max(40, Math.min(360, Number(world.rays) || 160));
        const extra = [];
        for (const l of out) {
            if (!l || l.bounce || l.screenFixed || !O.appliesTo(l, world)) continue;
            const pts = O.outlineFor(l, rays);
            for (const b of S.bounces(l, pts, 6)) {
                const p = DocsDoodads.mapToScreen(b.mapX, b.mapY);
                extra.push(Object.assign({}, l, { x: p.x, y: p.y, mapX: b.mapX, mapY: b.mapY, radius: b.radius, intensity: b.intensity, glow: 0,
                    shape: 'point', bounce: true, occlude: false, flicker: l.flicker }));
            }
        }
        for (const e of extra) out.push(e);
        return out;
    };

    const mask = Spriteset_Map.prototype.docsMaskLight;
    Spriteset_Map.prototype.docsMaskLight = function(sprite, light, index) {
        const used = mask.call(this, sprite, light, index);
        const pool = this._docsSoftMasks = this._docsSoftMasks || [];
        const levels = this._docsSoftLevels;
        let soft = pool[index];
        if (!used || !levels || !levels.shadows) { if (soft) soft.visible = false; return used; }
        const g = this._docsLightMasks[index], pts = g && g._docsOutline;
        const renderer = DocsDoodads.Compat.getRenderer();
        if (!pts || !renderer) return used;
        if (!soft) {
            soft = pool[index] = new PIXI.Sprite(PIXI.Texture.EMPTY);
            this._docsLightScene.addChild(soft);
        }
        if (soft._docsOutline !== pts) {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (let i = 0; i < pts.length; i += 2) {
                if (pts[i] < minX) minX = pts[i]; if (pts[i] > maxX) maxX = pts[i];
                if (pts[i + 1] < minY) minY = pts[i + 1]; if (pts[i + 1] > maxY) maxY = pts[i + 1];
            }
            const blur = S.blur(light.radius), pad = Math.ceil(blur * 2);
            const width = Math.max(1, Math.ceil(maxX - minX) + pad * 2), height = Math.max(1, Math.ceil(maxY - minY) + pad * 2);
            if (soft._docsTexture) soft._docsTexture.destroy(true);
            const rt = soft._docsTexture = PIXI.RenderTexture.create({ width, height });
            const shape = new PIXI.Graphics();
            shape.beginFill(0xffffff, 1);
            shape.drawPolygon(pts.map((v, i) => (i % 2 ? v - minY + pad : v - minX + pad)));
            shape.endFill();
            if (PIXI.filters && PIXI.filters.BlurFilter) shape.filters = [new PIXI.filters.BlurFilter(blur, 2)];
            renderer.render(shape, rt, true);
            shape.destroy();
            soft.texture = rt;
            soft._docsOutline = pts;
            soft._docsAt = { x: minX - pad, y: minY - pad };
        }
        soft.x = soft._docsAt.x - $gameMap.displayX() * $gameMap.tileWidth();
        soft.y = soft._docsAt.y - $gameMap.displayY() * $gameMap.tileHeight();
        soft.visible = true;
        g.visible = false;
        if (sprite.mask !== soft) sprite.mask = soft;
        return used;
    };
})();
