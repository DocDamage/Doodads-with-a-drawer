//==========================================================
// SECTION 7I: PERSPECTIVE (3D) RUNTIME
//==========================================================
// Each frame the tilemap's flat things (tiles, floor doodads, shadows, reflections, the lightmap and
// the editor grid) are drawn into a ground texture, which a shader lays on a ground plane. Everything
// that stands up is drawn as an upright billboard at its projected foot point, far to near.

// The map's 3D settings now (with plugin-command camera changes), or null when the map is flat.
DocsDoodads.Perspective.active = function() {
    if (typeof $gameMap === 'undefined' || !$gameMap || !$gameMap.mapId || !$gameMap.mapId()) return null;
    const mine = (DocsDoodads.Lighting.mapSettings($gameMap.mapId()) || {}).perspective;
    const editing = !!(DocsDoodads.Workspace && DocsDoodads.Workspace.mounted);
    const quality = typeof ConfigManager !== 'undefined' ? ConfigManager.docsFxQuality : 0;
    // Asked for many times a frame: kept for the rest of the frame while nothing it depends on changes.
    const frame = typeof Graphics !== 'undefined' && Graphics.frameCount !== undefined ? Graphics.frameCount : null;
    const memo = this._activeMemo;
    const zoom = DocsDoodads.PlayerZoom ? DocsDoodads.PlayerZoom.level() : 1;
    if (frame !== null && memo && memo.frame === frame && memo.mine === mine && memo.camera === $gameMap._docsCamera
        && memo.editing === editing && memo.quality === quality && memo.zoom === zoom) return memo.s;
    let s = this.resolve(mine, $gameMap._docsCamera || null);
    // The editor shows the map as it was set; the player's Effects Quality and zoom apply in play.
    if (s && !editing) s = this.withQuality(s, quality);
    if (s && !editing && zoom !== 1) s = Object.assign({}, s, { zoom: s.zoom * zoom });
    this._activeMemo = frame === null ? null : { frame, mine, camera: $gameMap._docsCamera, editing, quality, zoom, s };
    return s;
};

// A copy of a texture inset by half a texel, for drawing billboards (drawDocsItem). Kept per texture and
// moved with it when its frame changes (an animated doodad), so drawing makes no texture a frame.
DocsDoodads.Perspective.insetTexture = function(tex) {
    const cache = this._insets || (this._insets = new WeakMap());
    const f = tex.frame;
    let c = cache.get(tex);
    if (c && c.texture.baseTexture !== tex.baseTexture) c = null;
    if (!c) {
        c = { x: f.x, y: f.y, w: f.width, h: f.height, texture: new PIXI.Texture(tex.baseTexture, new PIXI.Rectangle(f.x + 0.5, f.y + 0.5, f.width - 1, f.height - 1)) };
        cache.set(tex, c);
    } else if (c.x !== f.x || c.y !== f.y || c.w !== f.width || c.h !== f.height) {
        c.x = f.x; c.y = f.y; c.w = f.width; c.h = f.height;
        c.texture.frame = new PIXI.Rectangle(f.x + 0.5, f.y + 0.5, f.width - 1, f.height - 1);
    }
    return c.texture;
};

// The camera used for the last frame drawn (null when the map is flat).
DocsDoodads.Perspective.liveCamera = function() {
    return this.active() ? this._cam || null : null;
};

// The facing to draw for a character, turned with the camera.
DocsDoodads.Perspective.displayFacing = function(dir) {
    const s = this.active();
    return s ? this.viewDirection(dir, s.yaw) : dir;
};

// Flat pixels to screen pixels (ground level), for things drawn in screen space.
DocsDoodads.Perspective.flatToScreen = function(x, y) {
    const cam = this.liveCamera();
    if (!cam) return { x, y, scale: 1 };
    return this.project(cam, x, y, 0) || { x: -10000, y: -10000, scale: 0 };
};

// A screen point to flat pixels on the ground (null above the horizon).
DocsDoodads.Perspective.screenToFlat = function(sx, sy) {
    const cam = this.liveCamera();
    if (!cam) return { x: sx, y: sy };
    const grid = DocsDoodads.Terrain.grid();
    if (grid && (grid.max !== 0 || grid.min !== 0)) {
        const th = $gameMap.tileHeight();
        return this.unprojectTerrain(cam, sx, sy, (x, y) => DocsDoodads.Terrain.heightPxAtFlat(x, y), { maxHeight: grid.max * th, minHeight: grid.min * th });
    }
    return this.unproject(cam, sx, sy);
};

// Screen pixels to map pixels, through the ground when the map is in 3D.
DocsDoodads.screenPointToMap = function(sx, sy) {
    const flat = DocsDoodads.Perspective.screenToFlat(sx, sy);
    return flat ? DocsDoodads.screenToMap(flat.x, flat.y) : null;
};

DocsDoodads.Perspective.groundVertex = [
    'precision highp float;',
    'attribute vec2 aVertexPosition;',
    'uniform mat3 projectionMatrix;',
    'uniform mat3 translationMatrix;',
    'varying vec2 vScreen;',
    'void main() {',
    '    vScreen = aVertexPosition;',
    '    gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);',
    '}'
].join('\n');

DocsDoodads.Perspective.groundFragment = [
    fragmentPrecision,
    'varying vec2 vScreen;',
    'uniform sampler2D uSampler;',
    'uniform vec3 uCam;',
    'uniform vec3 uF;',
    'uniform vec3 uR;',
    'uniform vec3 uU;',
    'uniform float uFocal;',
    'uniform vec2 uHalf;',
    'uniform vec2 uGround;',
    'uniform vec4 uFog;',
    'uniform vec2 uFogRange;',
    'uniform vec2 uTarget;',
    'uniform float uCurve;',
    'uniform float uRadius;',
    'uniform vec2 uAxis;',
    'uniform vec2 uAhead;',
    'uniform vec3 uVoid;',
    'uniform float uAlpha;',
    'uniform float uSnow;',
    'uniform vec4 uClouds;',
    'uniform vec4 uMist;',
    DocsDoodads.Water3D.glsl,
    DocsDoodads.Perspective.skyGlsl,
    'void main() {',
    '    vec3 dir = uF + ((vScreen.x - uHalf.x) / uFocal) * uR + ((uHalf.y - vScreen.y) / uFocal) * uU;',
    '    vec2 p;',
    '    if (uCurve > 1.5) {',
    '        vec2 o = uCam.xy - uTarget;',
    '        vec3 c = vec3(dot(o, uAxis), dot(o, uAhead), uCam.z + uRadius);',
    '        vec3 d = vec3(dot(dir.xy, uAxis), dot(dir.xy, uAhead), dir.z);',
    '        float qa = d.y * d.y + d.z * d.z;',
    '        float qb = 2.0 * (c.y * d.y + c.z * d.z);',
    // Expanded so R^2 never cancels, and the stable root form: nearly flat worlds have huge radii.
    '        float qc = c.y * c.y + uCam.z * uCam.z + 2.0 * uCam.z * uRadius;',
    '        float disc = qb * qb - 4.0 * qa * qc;',
    '        if (disc < 0.0 || qa < 1e-9) discard;',
    '        float t = qb < 0.0 ? (2.0 * qc) / (-qb + sqrt(disc)) : (-qb - sqrt(disc)) / (2.0 * qa);',
    '        if (t <= 0.0) discard;',
    '        vec3 h = c + t * d;',
    '        float along = uRadius * atan(h.y, h.z);',
    '        p = uTarget + uAxis * h.x + uAhead * along;',
    '    } else if (uCurve > 0.5) {',
    '        vec3 c = vec3(uCam.xy - uTarget, uCam.z + uRadius);',
    '        float qa = dot(dir, dir);',
    '        float qb = 2.0 * dot(dir, c);',
    '        float qc = dot(c.xy, c.xy) + uCam.z * uCam.z + 2.0 * uCam.z * uRadius;',
    '        float disc = qb * qb - 4.0 * qa * qc;',
    '        if (disc < 0.0) discard;',
    '        float t = qb < 0.0 ? (2.0 * qc) / (-qb + sqrt(disc)) : (-qb - sqrt(disc)) / (2.0 * qa);',
    '        if (t <= 0.0) discard;',
    '        vec3 v = c + t * dir;',
    '        float hl = length(v.xy);',
    '        float ang = atan(hl, v.z);',
    '        p = hl < 0.0001 ? uTarget : uTarget + v.xy / hl * uRadius * ang;',
    '    } else {',
    '        if (dir.z > -0.00001) discard;',
    '        float t = -uCam.z / dir.z;',
    '        p = uCam.xy + t * dir.xy;',
    '    }',
    '    vec2 uv = p / uGround;',
    DocsDoodads.Water3D.applyGlsl,
    '    vec4 c = vec4(0.0);',
    '    if (uv.x >= 0.0 && uv.y >= 0.0 && uv.x <= 1.0 && uv.y <= 1.0) c = texture2D(uSampler, uv);',
    '    vec3 rgb = c.rgb + uVoid * (1.0 - c.a);',
    '    rgb = rgb * docsWaterShade + vec3(docsWaterSpec);',
    DocsDoodads.SnowCover.glsl,
    '    float docsLow = 1.0;',
    DocsDoodads.Perspective.skyApplyGlsl,
    // Fog by distance along the ground from the camera's target, so it hides the ground's edges all round.
    '    float f = smoothstep(uFogRange.x, uFogRange.y, length(p - uTarget));',
    // uFog.a = 1: blend into the fog colour; 0: fade out so the sky shows through.
    '    rgb = mix(rgb, uFog.rgb, f * uFog.a);',
    '    float a = mix(1.0 - f, 1.0, uFog.a) * uAlpha;',
    '    gl_FragColor = vec4(rgb * a, a);',
    '}'
].join('\n');

DocsDoodads.Perspective.hexToRgb = function(hex) {
    const n = parseInt(String(hex || '#000000').slice(1), 16) || 0;
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

// What light falls on a point: the ambient multiply colour plus nearby lights (like the lightmap).
DocsDoodads.Perspective.lightAt = function(info, x, y) {
    if (!info || !info.base) return null;
    let r = info.base[0], g = info.base[1], b = info.base[2];
    const lights = info.lights || [];
    // Asked for every billboard: lights out of reach are passed over by a box test before the root.
    for (let i = 0; i < lights.length; i++) {
        const l = lights[i];
        const reach = Math.max(1, l.radius), dx = l.x - x, dy = l.y - y;
        if (dx >= reach || dx <= -reach || dy >= reach || dy <= -reach) continue;
        const dist = Math.sqrt(dx * dx + dy * dy) / reach;
        if (dist >= 1) continue;
        const fall = dist < 0.45 ? 1 - (dist / 0.45) * 0.45 : 0.55 * (1 - (dist - 0.45) / 0.55);
        const color = l.color >>> 0;
        const k = fall * (l.intensity || 0) / 255;
        r += ((color >> 16) & 255) * k; g += ((color >> 8) & 255) * k; b += (color & 255) * k;
    }
    const to = v => Math.max(0, Math.min(255, Math.round(v * 255)));
    return (to(r) << 16) | (to(g) << 8) | to(b);
};

DocsDoodads.Perspective.multiplyTint = function(a, b) {
    const ch = (v, s) => (v >> s) & 255;
    const m = s => Math.round(ch(a, s) * ch(b, s) / 255);
    return (m(16) << 16) | (m(8) << 8) | m(0);
};

if (typeof PIXI !== 'undefined' && PIXI.Container) {
    // Draws billboards: each item renders its display object with a flat-to-screen transform.
    window.Sprite_DocsBillboards = function() {
        PIXI.Container.call(this);
        this.items = [];
        this._temp = new PIXI.Container();
    };
    Sprite_DocsBillboards.prototype = Object.create(PIXI.Container.prototype);
    Sprite_DocsBillboards.prototype.constructor = Sprite_DocsBillboards;

    Sprite_DocsBillboards.prototype.render = function(renderer) {
        if (!this.visible || !this.renderable || this.worldAlpha <= 0) return;
        const temp = this._temp;
        const wt = this.worldTransform;
        for (const it of this.items) {
            if (it.terrain) {
                // A run of terrain triangles, already in screen space.
                const mesh = it.mesh;
                if (!mesh || mesh._destroyed) continue;
                temp.transform.worldTransform.copyFrom(wt);
                temp.transform._worldID++;
                temp.worldAlpha = this.worldAlpha;
                mesh.parent = temp;
                mesh.updateTransform();
                mesh.start = it.start * 3;
                mesh.size = it.count * 3;
                mesh.render(renderer);
                mesh.parent = null;
                mesh.transform._parentID = -1;
                continue;
            }
            this.drawDocsItem(renderer, it, false);
        }
        if (this.silhouette && this.silhouette.length) this.drawDocsSilhouette(renderer);
    };

    // One standing thing, drawn with its billboard transform (tinted by the light unless `plain`).
    Sprite_DocsBillboards.prototype.drawDocsItem = function(renderer, it, plain) {
        const obj = it.obj;
        if (!obj || obj._destroyed || !obj.parent || !obj.visible) return;
        const temp = this._temp;
        const wt = this.worldTransform;
        // Kept between items and frames: what was tinted or inset, to put back after drawing.
        const tinted = this._docsTinted || (this._docsTinted = []);
        const inset = this._docsInset || (this._docsInset = []);
        tinted.length = 0;
        inset.length = 0;
        const m = it.matrix;
        const world = temp.transform.worldTransform;
        if (m) world.set(wt.a * m.a + wt.c * m.b, wt.b * m.a + wt.d * m.b, wt.a * m.c + wt.c * m.d, wt.b * m.c + wt.d * m.d,
            wt.a * m.tx + wt.c * m.ty + wt.tx, wt.b * m.tx + wt.d * m.ty + wt.ty);
        else world.copyFrom(wt);
        temp.transform._worldID++;
        temp.worldAlpha = this.worldAlpha * it.alpha;
        const parent = obj.parent;
        obj.parent = temp;
        obj.updateTransform();
        if (!plain && it.tint !== null && it.tint !== undefined) this.docsTintTree(obj, it.tint, tinted);
        if (m) this.docsInsetTree(obj, inset);
        obj.render(renderer);
        // The batch reads tints and textures when it flushes: draw before putting them back.
        if ((tinted.length || inset.length) && renderer.batch) renderer.batch.flush();
        for (let i = 0; i < tinted.length; i += 2) tinted[i].tint = tinted[i + 1];
        for (let i = 0; i < inset.length; i += 2) inset[i].texture = inset[i + 1];
        tinted.length = 0;
        inset.length = 0;
        obj.parent = parent;
        // Recompute against the real parent next frame, even if transform ids happen to match.
        obj.transform._parentID = -1;
    };

    // Tints a sprite and its children by the light (pairs of sprite, old tint into `out`).
    Sprite_DocsBillboards.prototype.docsTintTree = function(o, color, out) {
        if (!o) return;
        if (o.tint !== undefined && o instanceof PIXI.Sprite) {
            out.push(o, o.tint);
            o.tint = DocsDoodads.Perspective.multiplyTint(o.tint, color);
        }
        const children = o.children;
        if (children) for (let i = 0; i < children.length; i++) this.docsTintTree(children[i], color, out);
    };

    // Scaled and leaning sprites can sample a texel past their frame (the next tile in an atlas or the next
    // frame of a sheet), and MZ bitmaps filter smoothly. While drawing, each sprite shows a copy of its texture
    // inset by half a texel (pairs of sprite, own texture into `out`). The copies are kept per texture.
    Sprite_DocsBillboards.prototype.docsInsetTree = function(o, out) {
        if (!o) return;
        const tex = o instanceof PIXI.Sprite ? o.texture : null;
        if (tex && tex.valid && !tex.rotate && tex.baseTexture && tex.frame.width > 1 && tex.frame.height > 1
            && (tex.frame.width < tex.baseTexture.width || tex.frame.height < tex.baseTexture.height)) {
            const inset = DocsDoodads.Perspective.insetTexture(tex);
            if (inset) {
                out.push(o, tex);
                o.texture = inset;
            }
        }
        const children = o.children;
        if (children) for (let i = 0; i < children.length; i++) this.docsInsetTree(children[i], out);
    };

    // The player (and their gear) hidden behind something, drawn again on top as one tinted outline:
    // drawn together and then coloured, so gear over the body doesn't show darker.
    Sprite_DocsBillboards.prototype.drawDocsSilhouette = function(renderer) {
        let ghost = this._ghost;
        if (!ghost) {
            ghost = this._ghost = new PIXI.Container();
            ghost._render = r => { for (const it of this.silhouette || []) this.drawDocsItem(r, it, true); };
            try {
                ghost._docsFilter = new PIXI.Filter(undefined, DocsDoodads.SeeThrough.silhouetteFragment, { uColor: [0.5, 0.8, 1], uAlpha: 0.55 });
                ghost.filters = [ghost._docsFilter];
            } catch (error) {
                ghost._docsFilter = null;
            }
        }
        // Without filters there's no outline to draw; the player stays hidden as before.
        if (!ghost._docsFilter) return;
        ghost._docsFilter.uniforms.uColor = this.silhouetteColor || [0.5, 0.8, 1];
        ghost.filterArea = renderer.screen;
        ghost.worldAlpha = this.worldAlpha;
        ghost.render(renderer);
    };
}

if (typeof Sprite_Animation !== 'undefined') {
    // In 3D, MZ's Effekseer animations take the size their target is drawn at (set each frame by the 3D view).
    // ...and plays where the target is drawn, not where it would be on the flat map.
    $.Sprite_Animation_targetSpritePosition_3d = Sprite_Animation.prototype.targetSpritePosition;
    Sprite_Animation.prototype.targetSpritePosition = function(sprite) {
        // The target as drawn in the last frame or this one; a target not drawn (hidden, blinking, past
        // the fog) has an old matrix, so the animation's own (made at its first target) is used instead.
        const frame = DocsDoodads.frameCount();
        const fresh = sp => sp && sp._docs3dMatrix && frame - (sp._docs3dFrame || 0) <= 1 ? sp._docs3dMatrix : null;
        const m = fresh(sprite) || fresh(this);
        const spriteset = typeof SceneManager !== 'undefined' && SceneManager._scene && SceneManager._scene._spriteset;
        const view = spriteset && spriteset._docs3dBillboards;
        if (!m || !view || !DocsDoodads.Perspective.liveCamera()) return $.Sprite_Animation_targetSpritePosition_3d.call(this, sprite);
        const x = sprite.x, y = sprite.y - (this._animation.alignBottom ? 0 : (sprite.height * Math.abs(sprite.scale.y)) / 2);
        return view.worldTransform.apply(new Point(m.a * x + m.c * y + m.tx, m.b * x + m.d * y + m.ty));
    };

    $.Sprite_Animation_updateEffectGeometry_3d = Sprite_Animation.prototype.updateEffectGeometry;
    Sprite_Animation.prototype.updateEffectGeometry = function() {
        $.Sprite_Animation_updateEffectGeometry_3d.call(this);
        const k = this._docs3dScale;
        if (this._handle && k > 0 && k !== 1 && DocsDoodads.Perspective.liveCamera()) {
            const scale = (this._animation.scale / 100) * k;
            this._handle.setScale(scale, scale, scale);
        }
    };
}

