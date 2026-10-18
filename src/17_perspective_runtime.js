//==========================================================
// SECTION 7I: PERSPECTIVE (3D) RUNTIME
//==========================================================
// Each frame the tilemap's flat things (tiles, floor doodads, shadows, reflections, the lightmap and
// the editor grid) are drawn into a ground texture, which a shader lays on a ground plane. Everything
// that stands up is drawn as an upright billboard at its projected foot point, far to near.

// The map's 3D settings now (with plugin-command camera changes), or null when the map is flat.
DocsDoodads.Perspective.active = function() {
    if (typeof $gameMap === 'undefined' || !$gameMap || !$gameMap.mapId || !$gameMap.mapId()) return null;
    if (this._suspended) return null;
    const mine = (DocsDoodads.Lighting.mapSettings($gameMap.mapId()) || {}).perspective;
    const editing = !!(DocsDoodads.Workspace && DocsDoodads.Workspace.mounted);
    const quality = typeof ConfigManager !== 'undefined' ? ConfigManager.docsFxQuality : 0;
    // Asked for many times a frame: kept for the rest of the frame while nothing it depends on changes.
    const frame = typeof Graphics !== 'undefined' && Graphics.frameCount !== undefined ? Graphics.frameCount : null;
    const memo = this._activeMemo;
    if (frame !== null && memo && memo.frame === frame && memo.mine === mine && memo.camera === $gameMap._docsCamera
        && memo.editing === editing && memo.quality === quality) return memo.s;
    let s = this.resolve(mine, $gameMap._docsCamera || null);
    // The editor shows the map as it was set; the player's Effects Quality applies in play.
    if (s && !editing) s = this.withQuality(s, quality);
    this._activeMemo = frame === null ? null : { frame, mine, camera: $gameMap._docsCamera, editing, quality, s };
    return s;
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
    const rgb = info.base.slice(0, 3);
    for (const l of info.lights || []) {
        const dist = Math.hypot(l.x - x, l.y - y) / Math.max(1, l.radius);
        if (dist >= 1) continue;
        const fall = dist < 0.45 ? 1 - (dist / 0.45) * 0.45 : 0.55 * (1 - (dist - 0.45) / 0.55);
        const c = DocsDoodads.Perspective.hexToRgb('#' + ('000000' + (l.color >>> 0).toString(16)).slice(-6));
        const k = fall * (l.intensity || 0);
        rgb[0] += c[0] * k; rgb[1] += c[1] * k; rgb[2] += c[2] * k;
    }
    const to = v => Math.max(0, Math.min(255, Math.round(v * 255)));
    return (to(rgb[0]) << 16) | (to(rgb[1]) << 8) | to(rgb[2]);
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
        const tinted = [];
        // Scaled and leaning sprites can sample a texel past their frame (the next tile in an atlas or
        // the next frame of a sheet), and MZ bitmaps filter smoothly. A half-texel inset while drawing keeps them inside.
        const inset = [];
        const shrink = obj => {
            const tex = obj && obj instanceof PIXI.Sprite ? obj.texture : null;
            if (tex && tex.valid && !tex.rotate && tex.baseTexture && tex.frame.width > 1 && tex.frame.height > 1
                && (tex.frame.width < tex.baseTexture.width || tex.frame.height < tex.baseTexture.height)) {
                const f = tex.frame;
                inset.push([tex, f.x, f.y, f.width, f.height]);
                tex.frame = new PIXI.Rectangle(f.x + 0.5, f.y + 0.5, f.width - 1, f.height - 1);
            }
            for (const child of (obj && obj.children) || []) shrink(child);
        };
        const tint = (obj, color) => {
            if (obj && obj.tint !== undefined && obj instanceof PIXI.Sprite) {
                tinted.push([obj, obj.tint]);
                obj.tint = DocsDoodads.Perspective.multiplyTint(obj.tint, color);
            }
            for (const child of (obj && obj.children) || []) tint(child, color);
        };
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
            const obj = it.obj;
            if (!obj || obj._destroyed || !obj.parent || !obj.visible) continue;
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
            if (it.tint !== null && it.tint !== undefined) tint(obj, it.tint);
            if (it.matrix) shrink(obj);
            obj.render(renderer);
            // The batch reads tints and texture coordinates when it flushes: draw before restoring them.
            if ((tinted.length || inset.length) && renderer.batch) renderer.batch.flush();
            for (const [o, old] of tinted) o.tint = old;
            tinted.length = 0;
            for (const [tex, x, y, w, h] of inset) tex.frame = new PIXI.Rectangle(x, y, w, h);
            inset.length = 0;
            obj.parent = parent;
            // Recompute against the real parent next frame, even if transform ids happen to match.
            obj.transform._parentID = -1;
        }
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
            const flying = typeof Game_Vehicle !== 'undefined' && ch instanceof Game_Vehicle && ch.isAirship && ch.isAirship() ? ch._altitude || 0 : 0;
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
        for (const child of billboards) child.renderable = child._docsWasRenderable !== false;
        tilemap.renderable = false;
        for (const o of [this._docsLightOverlay, this._docsGlowLayer, this._docsSelectionOutline]) {
            if (!o) continue;
            o.renderable = true;
            if (o.visible) renderer.render(o, rt, false);
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
            if (!m) continue;
            const fog = P.fogAt(Math.hypot(pivot.x - cam.target.x, pivot.y - cam.target.y), fogRange[0], fogRange[1]);
            if (fog >= 1) continue;
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
            items.push({ obj, depth: m.depth, bias: $gameMap.tileHeight() * 0.5 + halfWidth, z: obj.z || 0, spriteId: obj.spriteId || 0, matrix: isEffekseer ? null : m,
                alpha: 1 - fog, tint: light ? P.lightAt(light, pivot.x, pivot.y) : null });
        }
        this._docs3dSee = this.docsPlayerSeeThrough();
        this.docsSeeThroughBillboards(items, this._docs3dSee);
        this.updateDocsSnowCaps(items, snow);
        for (const band of this.updateDocsWeather(s, cam, fogRange)) items.push(band);
        items.sort(P.compareBillboards);
        this._docs3dBillboards.items = terrain ? this.docsInterleaveTerrain(items, this.updateDocsTerrain(cam, s, terrain, rt, fogRange)) : items;
        this.updateDocsGizmos(cam);
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
        if (!state) {
            grad.visible = false;
            return;
        }
        const W = Graphics.width, H = Graphics.height;
        // The sky: its top colour fading to the horizon colour at the horizon line, horizon colour below.
        if (!parallax) {
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
                g.lineStyle(1.5, 0xef4444, 0.9);
                for (const [a, b] of box) { g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); }
            }
        }
        for (const item of ws.selection3d ? ws.selection3d() : []) {
            const box = P.gizmoBox(cam, item.rect, item.pivot);
            if (!box) continue;
            g.lineStyle(1.5, 0xfacc15, 0.95);
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

    $.Spriteset_Map_update_3d = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        $.Spriteset_Map_update_3d.call(this);
        this.updateDocsPerspective();
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

    $.Spriteset_Map_destroy_3d = Spriteset_Map.prototype.destroy;
    Spriteset_Map.prototype.destroy = function(options) {
        if (this._docsWater && this._docsWater.texture) this._docsWater.texture.destroy(true);
        this._docsWater = null;
        if (this._docs3dTexture) {
            this._docs3dTexture.destroy(true);
            this._docs3dTexture = null;
        }
        // Textures and meshes the 3D view made itself (MZ frees the sprites' textures, not their pictures).
        if (this._docsTerrainMesh) { this._docsTerrainMesh.destroy(); this._docsTerrainMesh = null; }
        this._docsTerrainTopo = null;
        if (this._docsLightTexture) { this._docsLightTexture.destroy(true); this._docsLightTexture = null; }
        if (this._docsSkyTexture) { this._docsSkyTexture.destroy(true); this._docsSkyTexture = null; }
        for (const bitmap of this._docsStandBitmaps ? this._docsStandBitmaps.values() : []) if (bitmap) bitmap.destroy();
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
    $.Game_Map_update_3d = Game_Map.prototype.update;
    Game_Map.prototype.update = function(sceneActive) {
        $.Game_Map_update_3d.call(this, sceneActive);
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
    PluginManager.registerCommand(pluginName, 'resetCamera', function(args) {
        if (typeof $gameMap === 'undefined' || !$gameMap) return;
        const mine = DocsDoodads.Perspective.normalize((DocsDoodads.Lighting.mapSettings($gameMap.mapId()) || {}).perspective);
        $gameMap.docsMoveCamera({ pitch: mine.pitch, yaw: mine.yaw, zoom: mine.zoom, fov: mine.fov, curve: mine.curve,
            curvature: DocsDoodads.Perspective.curvatureOf(mine, $gameMap.width()) }, Number(args.duration) || 0);
    });
}

// ---- Terrain height (3D view) ----
DocsDoodads.Terrain.settingsFor = function(mapId) {
    return this.normalize((DocsDoodads.Lighting.mapSettings(mapId) || {}).terrain);
};

// The map's terrain settings when the map is shown in 3D with terrain on.
DocsDoodads.Terrain.active = function() {
    if (!DocsDoodads.Perspective.active()) return null;
    const s = this.settingsFor($gameMap.mapId());
    return s.enabled ? s : null;
};

// Heights for the current map (cached). force: build even when the map isn't in 3D (the brush).
DocsDoodads.Terrain.grid = function(force) {
    if (typeof $gameMap === 'undefined' || !$gameMap || typeof $dataMap === 'undefined' || !$dataMap) return null;
    // Asked for by every character and doodad each frame: the answer is kept for the rest of the frame.
    const frame = !force && typeof Graphics !== 'undefined' && Graphics.frameCount !== undefined ? Graphics.frameCount : null;
    const memo = this._gridMemo;
    if (frame !== null && memo && memo.frame === frame && memo.mapId === $gameMap.mapId() && memo.data === $dataMap.data) return memo.grid;
    const grid = this.buildGrid(force);
    this._gridMemo = frame === null ? null : { frame, mapId: $gameMap.mapId(), data: $dataMap.data, grid };
    return grid;
};

DocsDoodads.Terrain.buildGrid = function(force) {
    const s = force ? this.settingsFor($gameMap.mapId()) : this.active();
    if (!s) return null;
    const tileset = $gameMap.tileset ? $gameMap.tileset() : null;
    const map = { width: $dataMap.width, height: $dataMap.height, data: $dataMap.data };
    const sig = $gameMap.mapId() + '|' + this.signature(map, tileset, s);
    const c = this._grid;
    if (c && c.sig === sig && c.data === $dataMap.data) return c;
    const heights = this.buildHeights(map, tileset, s);
    let max = 0, min = 0;
    for (const h of heights) { if (h > max) max = h; if (h < min) min = h; }
    this._grid = { sig, data: $dataMap.data, heights, width: map.width, height: map.height, style: s.style, max, min, settings: s,
        loopX: $gameMap.isLoopHorizontal(), loopY: $gameMap.isLoopVertical() };
    return this._grid;
};

// Terrain height in pixels under a flat (tilemap) point; 0 when the map has no terrain.
DocsDoodads.Terrain.heightPxAtFlat = function(fx, fy) {
    const g = this.grid();
    if (!g) return 0;
    const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
    return this.heightAt(g, (fx + $gameMap.displayX() * tw) / tw, (fy + $gameMap.displayY() * th) / th, g.style) * th;
};

// The height a character halfWidthPx wide stands at, in pixels.
DocsDoodads.Terrain.footHeightPxAtFlat = function(fx, fy, halfWidthPx) {
    const g = this.grid();
    if (!g) return 0;
    const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
    return this.footHeight(g, (fx + $gameMap.displayX() * tw) / tw, (fy + $gameMap.displayY() * th) / th, (halfWidthPx || 0) / tw, g.style) * th;
};

// Doodads stand only on level ground; one on a mountain or slope stays at the lowest ground under it.
DocsDoodads.Terrain.doodadHeightPxAtFlat = function(fx, fy, halfWidthPx) {
    const g = this.grid();
    if (!g) return 0;
    const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
    const ground = this.groundUnder(g, (fx + $gameMap.displayX() * tw) / tw, (fy + $gameMap.displayY() * th) / th, (halfWidthPx || 0) / tw, g.style);
    return (ground.level ? ground.max : ground.min) * th;
};

// Whether a doodad may be placed at its spot: always, unless the map's terrain puts it on a mountain or slope.
DocsDoodads.Terrain.allowsDoodad = function(d, mapId) {
    if (!d || typeof $gameMap === 'undefined' || !$gameMap) return true;
    const s = this.settingsFor(mapId || $gameMap.mapId());
    if (!s.enabled) return true;
    const g = this.grid(true);
    if (!g) return true;
    const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
    const half = (d.frameW || 48) * Math.abs(d.scaleX !== undefined ? d.scaleX : 1) / 2;
    return this.groundUnder(g, d.x / tw, DocsDoodads.Depth.baseY(d) / th, half / tw, g.style).level;
};

DocsDoodads.Terrain.vertex = [
    'precision highp float;',
    'attribute vec2 aVertexPosition;',
    'attribute vec2 aUv;',
    'attribute vec2 aShade;',
    'attribute float aDepth;',
    'attribute float aHeight;',
    'uniform mat3 projectionMatrix;',
    'uniform mat3 translationMatrix;',
    'varying vec2 vUv;',
    'varying vec2 vShade;',
    'varying vec2 vScreen;',
    'varying float vDepth;',
    'varying float vHeight;',
    'void main() {',
    '    vUv = aUv;',
    '    vHeight = aHeight;',
    '    vShade = aShade;',
    '    vScreen = aVertexPosition;',
    '    vDepth = aDepth;',
    '    gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);',
    '}'
].join('\n');

DocsDoodads.Terrain.fragment = [
    fragmentPrecision,
    'varying vec2 vUv;',
    'varying vec2 vShade;',
    'varying vec2 vScreen;',
    'varying float vDepth;',
    'uniform sampler2D uSampler;',
    'uniform vec3 uVoid;',
    'uniform vec4 uFog;',
    'uniform float uAlpha;',
    'uniform vec3 uCam;',
    'uniform vec2 uGround;',
    // The player on screen (centre, half size) and their depth: ground in front of them there fades.
    'uniform vec4 uSee;',
    'uniform float uSeeDepth;',
    'uniform float uSeeAlpha;',
    'uniform float uSnow;',
    'uniform vec4 uClouds;',
    'uniform vec4 uMist;',
    'varying float vHeight;',
    DocsDoodads.Water3D.glsl,
    DocsDoodads.Perspective.skyGlsl,
    'void main() {',
    '    vec2 uv = vUv;',
    '    vec2 p = vUv * uGround;',
    DocsDoodads.Water3D.applyGlsl,
    '    vec4 c = vec4(0.0);',
    '    if (uv.x >= 0.0 && uv.y >= 0.0 && uv.x <= 1.0 && uv.y <= 1.0) c = texture2D(uSampler, uv);',
    '    vec3 rgb = (c.rgb + uVoid * (1.0 - c.a)) * vShade.x * docsWaterShade + vec3(docsWaterSpec);',
    DocsDoodads.SnowCover.glsl,
    // Low fog lies below the fog height (tiles above the lowest ground).
    '    float docsLow = 1.0 - smoothstep(0.0, uMist.y, vHeight);',
    DocsDoodads.Perspective.skyApplyGlsl,
    '    float f = 1.0 - vShade.y;',
    '    rgb = mix(rgb, uFog.rgb, f * uFog.a);',
    '    float a = mix(1.0 - f, 1.0, uFog.a) * uAlpha;',
    '    if (uSeeDepth > 0.0 && vDepth < uSeeDepth) {',
    '        vec2 q = abs(vScreen - uSee.xy) / max(uSee.zw, vec2(1.0));',
    '        a *= mix(uSeeAlpha, 1.0, smoothstep(0.75, 1.15, max(q.x, q.y)));',
    '    }',
    '    gl_FragColor = vec4(rgb * a, a);',
    '}'
].join('\n');

if (typeof Spriteset_Map !== 'undefined' && typeof PIXI !== 'undefined') {
    const P = DocsDoodads.Perspective, T = DocsDoodads.Terrain;

    // The tiles the terrain draws this frame: the view plus a tile and a half on each side.
    Spriteset_Map.prototype.docsTerrainWindow = function(s) {
        const x = Math.floor($gameMap.displayX()) - 1, y = Math.floor($gameMap.displayY()) - 1;
        return { x, y, size: s.viewTiles + 3 };
    };

    // The terrain mesh's shape around the camera. It covers a few tiles more than the view, so walking
    // rebuilds it only every few tiles; updateDocsTerrain draws just the part inside the view.
    Spriteset_Map.prototype.docsTerrainTopology = function(grid, s) {
        const margin = DocsDoodads.Terrain.meshMargin;
        const view = this.docsTerrainWindow(s);
        const light = this._docsSkyLight || T.light;
        const key = [grid.sig, s.viewTiles, s.terrainSteps || 0, DocsDoodads.Sky3D.lightKey(light)].join('|');
        const old = this._docsTerrainTopo;
        if (old && this._docsTerrainKey === key && view.x >= old.tx0 && view.y >= old.ty0
            && view.x + view.size <= old.tx0 + old.cols && view.y + view.size <= old.ty0 + old.rows) return old;
        this._docsTerrainKey = key;
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const tx0 = view.x - margin, ty0 = view.y - margin, cols = view.size + margin * 2, rows = cols;
        const mesh = T.buildMesh(grid, tx0, ty0, cols, rows, tw, th, grid.style, light, s.terrainSteps);
        const n = mesh.vertices.length;
        const topo = this._docsTerrainTopo = {
            tx0, ty0, cols, rows,
            vertices: mesh.vertices, triangles: mesh.triangles,
            positions: new Float32Array(n * 2), uvs: new Float32Array(n * 2), shades: new Float32Array(n * 2), depths: new Float32Array(n), heights: new Float32Array(mesh.vertices.map(v => v.h - (grid.min || 0))),
            depth: new Float64Array(n), ok: new Uint8Array(n),
            index: n < 65536 ? new Uint16Array(mesh.triangles.length) : new Uint32Array(mesh.triangles.length),
            sort: T.sortBuffers(mesh.triangles.length / 3), triOf: new Uint32Array(mesh.triangles.length / 3),
            order: { length: 0, depth: new Float64Array(mesh.triangles.length / 3) }
        };
        if (this._docsTerrainMesh) {
            this._docsTerrainMesh.destroy();
            this._docsTerrainMesh = null;
        }
        const geometry = new PIXI.Geometry()
            .addAttribute('aVertexPosition', topo.positions, 2)
            .addAttribute('aUv', topo.uvs, 2)
            .addAttribute('aShade', topo.shades, 2)
            .addAttribute('aDepth', topo.depths, 1)
            .addAttribute('aHeight', topo.heights, 1)
            .addIndex(topo.index);
        const shader = PIXI.Shader.from(T.vertex, T.fragment, { uSampler: PIXI.Texture.EMPTY, uVoid: [0, 0, 0], uFog: [0, 0, 0, 0], uAlpha: 1,
            uCam: [0, 0, 1], uGround: [1, 1], uSee: [0, 0, 1, 1], uSeeDepth: 0, uSeeAlpha: 0.4, uSnow: 0, uClouds: [0, 1, 0, 0], uMist: [0, 1, 0, 0],
            uWater: [0, 0, 0, 0], uWaterTime: 0, uWaterMask: PIXI.Texture.EMPTY, uMapTiles: [1, 1], uTile: [48, 48], uOrigin: [0, 0], uLoop: [0, 0],
            uLightDir: DocsDoodads.Terrain.light.slice(), uWakes: new Float32Array(DocsDoodads.Water3D.maxWakes * 4) });
        this._docsTerrainMesh = new PIXI.Mesh(geometry, shader);
        return topo;
    };

    // Projects the terrain for this frame and returns its triangles sorted far to near
    // ({ length, depth[i] }). It runs every frame over tens of thousands of points, so it allocates nothing.
    Spriteset_Map.prototype.updateDocsTerrain = function(cam, s, grid, rt, fogRange) {
        const topo = this.docsTerrainTopology(grid, s);
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const ox = $gameMap.displayX() * tw, oy = $gameMap.displayY() * th;
        const gw = rt.width, gh = rt.height;
        const V = topo.vertices;
        const flat = cam.curve === 'flat';
        const C = cam.C, F = cam.F, R = cam.R, U = cam.U, focal = cam.focal, hw = cam.width / 2, hh = cam.height / 2;
        const tx = cam.target.x, ty = cam.target.y, fog0 = fogRange[0], fog1 = fogRange[1];
        // Only the tiles in view are drawn; the rest of the mesh is margin for the next few steps.
        const view = this.docsTerrainWindow(s);
        const minX = view.x * tw, minY = view.y * th, maxX = (view.x + view.size) * tw, maxY = (view.y + view.size) * th;
        for (let i = 0; i < V.length; i++) {
            const v = V[i];
            const fx = v.x - ox, fy = v.y - oy;
            let ok = 0;
            if (v.x < minX || v.y < minY || v.x > maxX || v.y > maxY) {
                // Outside the view: never drawn.
            } else if (flat) {
                // Flat ground: the point is (fx, fy, height); projected inline.
                const vx = fx - C.x, vy = fy - C.y, vz = v.h * th - C.z;
                const depth = vx * F.x + vy * F.y + vz * F.z;
                if (depth >= 1) {
                    const scale = focal / depth;
                    topo.positions[i * 2] = hw + (vx * R.x + vy * R.y + vz * R.z) * scale;
                    topo.positions[i * 2 + 1] = hh - (vx * U.x + vy * U.y + vz * U.z) * scale;
                    topo.depth[i] = depth;
                    topo.depths[i] = depth;
                    ok = 1;
                }
            } else {
                const g = P.groundPoint(cam, fx, fy, v.h * th);
                if (g.visible) {
                    const n = P.surfacePoint(cam, fx, fy);
                    const p = n.nx * (C.x - g.x) + n.ny * (C.y - g.y) + n.nz * (C.z - g.z) > 0 ? P.project(cam, g.x, g.y, g.z) : null;
                    if (p) {
                        topo.positions[i * 2] = p.x;
                        topo.positions[i * 2 + 1] = p.y;
                        topo.depth[i] = p.depth;
                        topo.depths[i] = p.depth;
                        ok = 1;
                    }
                }
            }
            topo.ok[i] = ok;
            topo.uvs[i * 2] = (v.u - ox) / gw;
            topo.uvs[i * 2 + 1] = (v.v - oy) / gh;
            topo.shades[i * 2] = v.shade;
            topo.shades[i * 2 + 1] = 1 - P.fogAt(Math.hypot(fx - tx, fy - ty), fog0, fog1);
        }
        const tris = topo.triangles, buf = topo.sort, triOf = topo.triOf, order = topo.order;
        // Without a fog colour, ground past the fog's end is fully transparent: skip it.
        const fadeOut = !s.fogColor, shade = topo.shades;
        let count = 0;
        for (let t = 0; t < tris.length; t += 3) {
            const a = tris[t], b = tris[t + 1], c = tris[t + 2];
            if (!topo.ok[a] || !topo.ok[b] || !topo.ok[c]) continue;
            if (fadeOut && shade[a * 2 + 1] === 0 && shade[b * 2 + 1] === 0 && shade[c * 2 + 1] === 0) continue;
            buf.depth[count] = (topo.depth[a] + topo.depth[b] + topo.depth[c]) / 3;
            triOf[count++] = t;
        }
        const sorted = T.sortFarToNear(buf, count);
        for (let i = 0; i < count; i++) {
            const k = sorted[i], t = triOf[k];
            topo.index[i * 3] = tris[t];
            topo.index[i * 3 + 1] = tris[t + 1];
            topo.index[i * 3 + 2] = tris[t + 2];
            order.depth[i] = buf.depth[k];
        }
        order.length = count;
        const mesh = this._docsTerrainMesh;
        const geo = mesh.geometry;
        geo.getBuffer('aVertexPosition').update(topo.positions);
        geo.getBuffer('aUv').update(topo.uvs);
        geo.getBuffer('aShade').update(topo.shades);
        geo.getBuffer('aDepth').update(topo.depths);
        geo.getIndex().update(topo.index);
        const u = mesh.shader.uniforms;
        u.uSampler = rt;
        u.uVoid = P.hexToRgb(s.voidColor);
        u.uFog = s.fogColor ? P.hexToRgb(s.fogColor).concat([1]) : [0, 0, 0, 0];
        u.uAlpha = 1;
        u.uSnow = this._docs3dSnow || 0;
        this.docsSkyUniforms(u, s);
        const see = this._docs3dSee;
        u.uSee = see ? see.rect : [0, 0, 1, 1];
        u.uSeeDepth = see ? see.depth : 0;
        u.uSeeAlpha = see ? see.opacity : 1;
        this.docsWaterUniforms(u, s, cam);
        return order;
    };

    // ---- Tileset objects standing up ----
    // The groups for the current map and mode (cached), and which tiles leave the ground.
    Spriteset_Map.prototype.docsStandGroups = function(s) {
        const mode = s ? s.standTiles : 'off';
        if (this._docsStand && this._docsStand.map === $dataMap && this._docsStand.mode === mode) return this._docsStand;
        const tileset = $gameMap.tileset ? $gameMap.tileset() : null;
        const built = DocsDoodads.StandTiles.groups($dataMap || { width: 0, height: 0, data: [] }, tileset && tileset.flags, mode);
        this._docsStand = { map: $dataMap, mode, list: built.list, mask: built.list.length ? built.mask : null };
        if (this._tilemap) {
            this._tilemap._docsStandMask = this._docsStand.mask;
            if (this._tilemap.refresh) this._tilemap.refresh();
        }
        return this._docsStand;
    };

    // One picture per kind of group (a forest of the same tree shares one), drawn from the tilesets.
    Spriteset_Map.prototype.docsStandBitmap = function(group) {
        const cache = this._docsStandBitmaps = this._docsStandBitmaps || new Map();
        if (cache.has(group.key)) return cache.get(group.key);
        const sets = this._tilemap && this._tilemap._bitmaps;
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const needed = new Set();
        for (const cell of group.cells) for (const id of cell.tiles) needed.add(DocsDoodads.StandTiles.source(id, tw, th).set);
        for (const set of needed) if (!sets || !sets[set] || !sets[set].isReady()) return null;
        const bitmap = new Bitmap(group.w * tw, group.h * th);
        for (const cell of group.cells) {
            for (const id of cell.tiles) {
                const src = DocsDoodads.StandTiles.source(id, tw, th);
                bitmap.blt(sets[src.set], src.x, src.y, tw, th, cell.dx * tw, cell.dy * th);
            }
        }
        cache.set(group.key, bitmap);
        return bitmap;
    };

    // Groups near the camera get a billboard from a pool, standing on their foot line like a doodad.
    // A group keeps the same sprite while it stays in view, so its fade (See-Through) stays with it.
    Spriteset_Map.prototype.updateDocsStandTiles = function(s) {
        const stand = this.docsStandGroups(s);
        const pool = this._docsStandSprites = this._docsStandSprites || [];
        const shown = this._docsStandShown = this._docsStandShown || new Map();
        shown.clear();
        if (stand.list.length && this._docs3dSize) {
            const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
            const { width: gw, height: gh } = this._docs3dSize;
            for (const g of stand.list) {
                const x = $gameMap.adjustX(g.x + g.w / 2) * tw, y = $gameMap.adjustY(g.y + g.h) * th;
                if (x < -g.w * tw || y < 0 || x > gw + g.w * tw || y > gh + g.h * th) continue;
                const bitmap = this.docsStandBitmap(g);
                if (bitmap) shown.set(g, { bitmap, x, y });
            }
        }
        const owned = new Map(), free = [];
        for (const sprite of pool) {
            if (sprite._docsStandGroup && shown.has(sprite._docsStandGroup)) owned.set(sprite._docsStandGroup, sprite);
            else { sprite._docsStandGroup = null; sprite.visible = false; free.push(sprite); }
        }
        for (const [g, at] of shown) {
            let sprite = owned.get(g);
            if (!sprite) {
                sprite = free.pop();
                if (!sprite) {
                    sprite = new Sprite();
                    sprite.anchor.set(0.5, 1);
                    sprite.z = 3;
                    sprite._docsStandTile = true;
                    pool.push(sprite);
                    this._tilemap.addChild(sprite);
                }
                sprite._docsStandGroup = g;
                sprite.alpha = 1;
                sprite.spriteId = g.y * 100000 + g.x;
            }
            if (sprite.bitmap !== at.bitmap) sprite.bitmap = at.bitmap;
            sprite.x = at.x;
            sprite.y = at.y;
            sprite.visible = true;
        }
    };

    // Back to a flat map: the tiles return to the ground.
    Spriteset_Map.prototype.clearDocsStandTiles = function() {
        for (const sprite of this._docsStandSprites || []) {
            if (sprite.parent) sprite.parent.removeChild(sprite);
            sprite.destroy();
        }
        this._docsStandSprites = [];
        this._docsStand = null;
        if (this._tilemap && this._tilemap._docsStandMask) {
            this._tilemap._docsStandMask = null;
            if (this._tilemap.refresh) this._tilemap.refresh();
        }
    };

    // ---- Cloud shadows and low fog ----
    Spriteset_Map.prototype.docsSkyUniforms = function(u, s) {
        const tw = $gameMap.tileWidth();
        const t = DocsDoodads.frameCount() / 60;
        const drift = P.cloudDrift(t, s.cloudSpeed);
        u.uClouds = [s.clouds, s.cloudScale * tw, drift.x, drift.y];
        u.uMist = [s.mist, s.mistHeight, drift.x * 0.35, -drift.y * 0.2];
    };

    // ---- Snow cover ----
    // The cover now (kept in the save), stepped while the map is shown in 3D with Snow settles on.
    Spriteset_Map.prototype.updateDocsSnowCover = function(s) {
        if (!s.snowCover || typeof $gameSystem === 'undefined' || !$gameSystem) return 0;
        const C = DocsDoodads.SnowCover;
        const seasons = DocsDoodads.World.settings().seasons;
        const winter = C.isWinter(DocsDoodads.Atmosphere.season(), seasons && seasons.names);
        const editing = DocsDoodads.Workspace && DocsDoodads.Workspace.mounted;
        const dt = editing ? 0 : 1 / 60;
        $gameSystem._docsSnowCover = C.step($gameSystem._docsSnowCover, dt, $gameScreen.weatherType(), $gameScreen.weatherPower(), winter);
        return $gameSystem._docsSnowCover;
    };

    // White tops for standing doodads and tileset objects (a picture made once per image).
    DocsDoodads.SnowCover.capBase = function(texture) {
        const base = texture && texture.baseTexture;
        const source = base && base.resource && base.resource.source;
        if (!source || !source.width || typeof document === 'undefined') return null;
        const cellH = Math.round(texture.frame.height);
        const key = (base.cacheId || base.uid) + '|' + cellH;
        this._caps = this._caps || new Map();
        if (this._caps.has(key)) {
            // Most recently used last, so the oldest unused one goes first.
            const hit = this._caps.get(key);
            this._caps.delete(key);
            this._caps.set(key, hit);
            return hit;
        }
        const w = source.width, h = source.height;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(source, 0, 0);
        const image = ctx.getImageData(0, 0, w, h);
        const alpha = new Uint8ClampedArray(w * h);
        for (let i = 0; i < w * h; i++) alpha[i] = image.data[i * 4 + 3];
        const cap = this.capAlpha(alpha, w, h, cellH, Math.max(3, cellH * 0.16));
        for (let i = 0; i < w * h; i++) {
            image.data[i * 4] = 240; image.data[i * 4 + 1] = 245; image.data[i * 4 + 2] = 255;
            image.data[i * 4 + 3] = cap[i];
        }
        ctx.putImageData(image, 0, 0);
        const out = new PIXI.BaseTexture(canvas);
        // At most 64 kept: the oldest goes (Maps keep insertion order).
        while (this._caps.size >= 64) {
            const oldest = this._caps.keys().next().value;
            const old = this._caps.get(oldest);
            this._caps.delete(oldest);
            if (old && old.destroy) old.destroy();
        }
        this._caps.set(key, out);
        return out;
    };

    Spriteset_Map.prototype.updateDocsSnowCaps = function(items, cover) {
        for (const it of items) {
            const obj = it.obj;
            if (!obj || !it.matrix || !(obj instanceof PIXI.Sprite)) continue;
            const isDoodad = typeof Sprite_DocsDoodad !== 'undefined' && obj instanceof Sprite_DocsDoodad;
            if (!isDoodad && !obj._docsStandTile) continue;
            let cap = obj._docsSnowCap;
            if (cover <= 0.01) {
                if (cap) cap.visible = false;
                continue;
            }
            const tex = obj.texture;
            if (!tex || !tex.valid) continue;
            const base = DocsDoodads.SnowCover.capBase(tex);
            if (!base) continue;
            if (!cap) {
                cap = obj._docsSnowCap = new PIXI.Sprite(PIXI.Texture.EMPTY);
                obj.addChild(cap);
            }
            const f = tex.frame;
            const key = base.uid + '|' + f.x + ',' + f.y + ',' + f.width + ',' + f.height;
            if (cap._docsKey !== key) {
                cap._docsKey = key;
                if (cap.texture && cap.texture !== PIXI.Texture.EMPTY) cap.texture.destroy(false);
                cap.texture = new PIXI.Texture(base, new PIXI.Rectangle(f.x, f.y, f.width, f.height));
            }
            // Same place and size as the picture it caps (a child, so it shares the transform).
            cap.anchor.set(obj.anchor.x, obj.anchor.y);
            cap.alpha = cover;
            cap.visible = true;
        }
    };

    // Where the player is drawn this frame ({ rect: [centre x, centre y, half width, half height], depth }),
    // so hills between them and the camera can fade there. null when the player isn't drawn, or while
    // editing (everything shows as placed). The 3D view has no silhouette, so Silhouette mode fades too.
    Spriteset_Map.prototype.docsPlayerSeeThrough = function() {
        const settings = DocsDoodads.World.settings().seeThrough;
        if (!settings || !settings.enabled || !DocsDoodads.Atmosphere.featureOn('seeThrough')) return null;
        if (DocsDoodads.Workspace && DocsDoodads.Workspace.mounted) return null;
        const sprite = (this._characterSprites || []).find(sp => sp._character === $gamePlayer);
        const m = sprite && sprite.visible && sprite._docs3dMatrix;
        if (!m || !(sprite.width > 0)) return null;
        const see = P.seeThroughRect(m, sprite.x, sprite.y, Math.abs(sprite.width), Math.abs(sprite.height), $gameMap.tileWidth() * 1.5);
        see.opacity = Math.max(0, Math.min(1, Number(settings.opacity)));
        see.speed = settings.speed;
        see.player = sprite;
        return see;
    };

    // Tall doodads and tileset objects in front of the player fade (like See-Through on flat maps).
    Spriteset_Map.prototype.docsSeeThroughBillboards = function(items, see) {
        const settings = DocsDoodads.World.settings().seeThrough;
        const th = $gameMap.tileHeight();
        for (const it of items) {
            const obj = it.obj;
            if (!obj || !it.matrix) continue;
            const base = obj._docsBillboardOwner || obj;
            const isDoodad = typeof Sprite_DocsDoodad !== 'undefined' && base instanceof Sprite_DocsDoodad;
            if (!isDoodad && !base._docsStandTile) continue;
            if (isDoodad && !DocsDoodads.SeeThrough.appliesTo(base._data, settings, th)) continue;
            // Particles and effects on a doodad fade with it.
            if (base !== obj) {
                if (base._docs3dSeeAlpha !== undefined) it.alpha *= base._docs3dSeeAlpha;
                continue;
            }
            let target = 1;
            if (see) {
                const w = Math.abs(obj.width), h = Math.abs(obj.height);
                const ax = obj.anchor ? obj.anchor.x : 0.5, ay = obj.anchor ? obj.anchor.y : 1;
                const box = P.screenBox(it.matrix, obj.x - ax * w, obj.y - ay * h, w, h);
                if (P.hidesPlayer(box, it.matrix.depth, see)) target = see.opacity;
            }
            obj._docs3dSeeAlpha = DocsDoodads.SeeThrough.step(obj._docs3dSeeAlpha !== undefined ? obj._docs3dSeeAlpha : 1, target, see ? see.speed : 1);
            it.alpha *= obj._docs3dSeeAlpha;
        }
    };

    // Billboards between the terrain's triangles, so hills hide what's behind them. Each billboard
    // goes after the ground around its feet (half a tile of slack).
    Spriteset_Map.prototype.docsInterleaveTerrain = function(items, order) {
        const th = $gameMap.tileHeight();
        const mesh = this._docsTerrainMesh;
        const out = [];
        let i = 0;
        const flush = until => {
            const start = i;
            while (i < order.length && order.depth[i] > until) i++;
            if (i > start) out.push({ terrain: true, mesh, start, count: i - start });
        };
        for (const item of items) {
            flush(item.depth - (item.bias !== undefined ? item.bias : th * 0.5));
            out.push(item);
        }
        flush(-Infinity);
        return out;
    };
}

if (typeof Tilemap !== 'undefined') {
    // Tiles standing up in 3D are drawn as billboards, so the ground leaves them out.
    $.Tilemap_readMapData_stand = Tilemap.prototype._readMapData;
    Tilemap.prototype._readMapData = function(x, y, z) {
        const mask = this._docsStandMask;
        if (mask && z < 4 && this._mapData) {
            const w = this._mapWidth, h = this._mapHeight;
            const mx = this.horizontalWrap ? ((x % w) + w) % w : x, my = this.verticalWrap ? ((y % h) + h) % h : y;
            if (mx >= 0 && my >= 0 && mx < w && my < h && mask[(z * h + my) * w + mx]) return 0;
        }
        return $.Tilemap_readMapData_stand.call(this, x, y, z);
    };
}

if (typeof Game_CharacterBase !== 'undefined') {
    // Steep steps block walking when the map asks for it.
    $.Game_CharacterBase_isMapPassable_terrain = Game_CharacterBase.prototype.isMapPassable;
    Game_CharacterBase.prototype.isMapPassable = function(x, y, d) {
        if (!$.Game_CharacterBase_isMapPassable_terrain.call(this, x, y, d)) return false;
        const T = DocsDoodads.Terrain;
        // Pathfinding asks this thousands of times a frame: the grid (and its settings) is kept per frame.
        const g = T.grid();
        const s = g && g.settings;
        if (!s || !s.block) return true;
        const x2 = $gameMap.roundXWithDirection(x, d), y2 = $gameMap.roundYWithDirection(y, d);
        return T.stepKind(T.tileHeight(g, x, y), T.tileHeight(g, x2, y2), s) !== 'blocked';
    };

    // Off a ledge or up a small step: the move is a jump onto the next tile.
    $.Game_CharacterBase_moveStraight_terrain = Game_CharacterBase.prototype.moveStraight;
    Game_CharacterBase.prototype.moveStraight = function(d) {
        const T = DocsDoodads.Terrain;
        const g = T.grid();
        const s = g && g.settings;
        if (s && s.block && (s.drop || s.hop > 0) && !this.isJumping() && this.docsWalksTerrain() && this.canPass(this._x, this._y, d)) {
            const x2 = $gameMap.roundXWithDirection(this._x, d), y2 = $gameMap.roundYWithDirection(this._y, d);
            const kind = T.stepKind(T.tileHeight(g, this._x, this._y), T.tileHeight(g, x2, y2), s);
            if (kind === 'drop' || kind === 'hop') {
                this.setMovementSuccess(true);
                this.setDirection(d);
                this.jump(d === 4 ? -1 : d === 6 ? 1 : 0, d === 8 ? -1 : d === 2 ? 1 : 0);
                this.increaseSteps();
                return;
            }
        }
        $.Game_CharacterBase_moveStraight_terrain.call(this, d);
    };

    // Ledges are for walkers: not vehicles, the party aboard one, or characters set to Through.
    Game_CharacterBase.prototype.docsWalksTerrain = function() {
        if (this.isThrough() || (this.isDebugThrough && this.isDebugThrough())) return false;
        if (typeof Game_Vehicle !== 'undefined' && this instanceof Game_Vehicle) return false;
        if (this.isInVehicle && this.isInVehicle()) return false;
        return true;
    };
}

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
    const ctx = canvas.getContext('2d');
    const image = ctx.createImageData(width, height);
    image.data.set(pixels);
    ctx.putImageData(image, 0, 0);
    return canvas;
};

if (typeof Spriteset_Map !== 'undefined' && typeof PIXI !== 'undefined') {
    $.Spriteset_Map_update_minimap = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        $.Spriteset_Map_update_minimap.call(this);
        this.updateDocsMinimap();
    };

    // A small map in the top-right corner with the player's arrow, on maps that ask for it.
    Spriteset_Map.prototype.updateDocsMinimap = function() {
        const s = DocsDoodads.Perspective.active();
        const on = Boolean(s && s.minimap) && !(DocsDoodads.Workspace && DocsDoodads.Workspace.mounted);
        if (!on) {
            if (this._docsMinimap) this._docsMinimap.visible = false;
            return;
        }
        const map = DocsDoodads.Minimap.forCurrentMap();
        if (!map) return;
        let mini = this._docsMinimap;
        if (!mini || mini._docsData !== map.data) {
            this.docsDestroyMinimap();
            mini = this._docsMinimap = new PIXI.Container();
            mini._docsData = map.data;
            // Its own picture (not in PIXI's shared cache), freed with the minimap.
            const base = new PIXI.BaseTexture(DocsDoodads.Minimap.canvasFor(map.pixels, map.width, map.height), { scaleMode: PIXI.SCALE_MODES.NEAREST });
            const pic = new PIXI.Sprite(new PIXI.Texture(base));
            const scale = 140 / Math.max(map.width, map.height);
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

// Loaded models by path (project-relative): { ready, error, primitives, textures }.
DocsDoodads.Models = {
    _cache: {},
    // A model that failed to load (missing, half-copied, broken) is tried again after this long.
    retryAfter: 5000,

    // Models, and the files they point to, have to be inside the project folder.
    inside(root, target) {
        const path = DocsDoodads.FS.path;
        const rel = path.relative(root, target);
        return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
    },

    get(path) {
        if (!path) return null;
        const key = String(path).replace(/\\/g, '/');
        const cached = this._cache[key];
        if (cached && !(cached.error && Date.now() - cached.failedAt >= this.retryAfter)) return cached;
        if (cached) this.release(cached);
        // files: every file the model reads (itself, its buffers and images), for live reload.
        const entry = this._cache[key] = { ready: false, error: null, primitives: [], textures: [], files: [] };
        try {
            const FS = DocsDoodads.FS;
            if (!FS.fs) throw new Error('Models need the desktop game.');
            const root = FS.path.resolve('.');
            const file = FS.path.resolve(root, key);
            if (!this.inside(root, file)) throw new Error('Models have to be inside the project folder.');
            entry.files.push(file);
            const dir = FS.path.dirname(file);
            const local = uri => {
                const target = FS.path.resolve(dir, decodeURIComponent(uri));
                if (!this.inside(root, target)) throw new Error('"' + uri + '" is outside the project folder.');
                if (!entry.files.includes(target)) entry.files.push(target);
                return target;
            };
            const doc = DocsDoodads.Gltf.parse(FS.fs.readFileSync(file), uri => FS.fs.readFileSync(local(uri)));
            const mesh = DocsDoodads.Gltf.meshes(doc);
            entry.primitives = mesh.primitives;
            entry.min = mesh.min;
            entry.max = mesh.max;
            // Image files load by their place in the project, as the game's own pictures do.
            const url = uri => FS.path.relative(root, local(uri)).split(FS.path.sep).map(encodeURIComponent).join('/');
            const images = new Map();
            entry.textures = mesh.primitives.map(prim => this.texture(prim, url, images));
            entry.ready = true;
        } catch (e) {
            entry.error = e.message;
            entry.failedAt = Date.now();
            if (!cached || cached.error !== e.message) console.warn('[DocsDoodads] Could not load model ' + key + ': ' + e.message);
        }
        if (DocsDoodads.LiveReload && DocsDoodads.LiveReload.watchModels) DocsDoodads.LiveReload.watchModels();
        return entry;
    },

    // The folders holding the files of every model asked for (live reload watches them).
    directories() {
        const path = DocsDoodads.FS.path;
        const dirs = new Set();
        for (const entry of Object.values(this._cache)) for (const file of entry.files || []) dirs.add(path.dirname(file));
        return [...dirs];
    },

    // Loads again every model that reads one of these files (absolute paths). The old textures may
    // still be on screen until the doodads redraw, so they're kept until the map's sprites go
    // (freeRetired). Returns the paths of the models loaded again.
    reloadFiles(files) {
        const norm = f => String(f).replace(/\\/g, '/').toLowerCase();
        const changed = new Set(files.map(norm));
        const keys = Object.keys(this._cache).filter(key => (this._cache[key].files || []).some(f => changed.has(norm(f))));
        for (const key of keys) {
            const old = this._cache[key];
            delete this._cache[key];
            this._retired = (this._retired || []).concat(old.textures || []);
            old.textures = [];
            this.get(key);
        }
        return keys;
    },

    freeRetired() {
        const retired = this._retired || [];
        this._retired = [];
        this.release({ textures: retired });
    },

    // Loads the models a map's doodads use when the map is set up, not in the middle of drawing a frame.
    preload(list) {
        for (const d of list || []) if (d && d.model && d.model.path) this.get(d.model.path);
    },

    // The primitive's colour texture (shared between scenes, and between parts using the same image),
    // or plain white until it has loaded.
    texture(prim, url, images) {
        if (!prim.image || typeof Image === 'undefined') return PIXI.Texture.WHITE;
        const id = prim.image.source !== undefined ? prim.image.source + (prim.nearest ? 'n' : 'l') : null;
        if (id !== null && images && images.has(id)) return images.get(id);
        const img = new Image();
        const texture = new PIXI.Texture(new PIXI.BaseTexture(img, { scaleMode: prim.nearest ? PIXI.SCALE_MODES.NEAREST : PIXI.SCALE_MODES.LINEAR }));
        // Scenes come and go; the texture stays until the model is let go of (release).
        texture.destroy = function() {};
        if (prim.image.bytes) {
            const src = URL.createObjectURL(new Blob([prim.image.bytes], { type: prim.image.mime }));
            if (img.addEventListener) {
                const done = () => URL.revokeObjectURL(src);
                img.addEventListener('load', done, { once: true });
                img.addEventListener('error', done, { once: true });
            }
            img.src = src;
        } else if (/^data:/i.test(prim.image.uri)) {
            img.src = prim.image.uri;
        } else {
            img.src = url(prim.image.uri);
        }
        if (id !== null && images) images.set(id, texture);
        return texture;
    },

    // Frees a model's textures (a model loaded again, or dropped from the cache).
    release(entry) {
        const seen = new Set();
        for (const texture of entry.textures || []) {
            if (!texture || texture === PIXI.Texture.WHITE || seen.has(texture)) continue;
            seen.add(texture);
            PIXI.Texture.prototype.destroy.call(texture, true);
        }
        entry.textures = [];
    },

    forget(path) {
        const key = String(path || '').replace(/\\/g, '/');
        if (this._cache[key]) this.release(this._cache[key]);
        delete this._cache[key];
    }
};

if (typeof Spriteset_Map !== 'undefined' && Spriteset_Map.prototype.addDocsDoodads) {
    $.Spriteset_Map_addDocsDoodads_models = Spriteset_Map.prototype.addDocsDoodads;
    Spriteset_Map.prototype.addDocsDoodads = function() {
        DocsDoodads.Models.preload(DocsDoodads.doodads());
        $.Spriteset_Map_addDocsDoodads_models.call(this);
    };
}

DocsDoodads.Models.vertex = [
    'precision highp float;',
    'attribute vec2 aVertexPosition;',
    'attribute vec2 aUv;',
    'attribute float aShade;',
    'uniform mat3 projectionMatrix;',
    'uniform mat3 translationMatrix;',
    'varying vec2 vUv;',
    'varying float vShade;',
    'void main() {',
    '    vUv = aUv;',
    '    vShade = aShade;',
    '    gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);',
    '}'
].join('\n');

DocsDoodads.Models.fragment = [
    'precision mediump float;',
    'varying vec2 vUv;',
    'varying float vShade;',
    'uniform sampler2D uSampler;',
    'uniform vec4 uColor;',
    'uniform vec3 uTint;',
    'uniform float uAlpha;',
    'void main() {',
    '    vec4 c = texture2D(uSampler, vUv) * uColor;',
    '    float a = c.a * uAlpha;',
    '    gl_FragColor = vec4(c.rgb * vShade * uTint * a, a);',
    '}'
].join('\n');

if (typeof Spriteset_Map !== 'undefined' && typeof PIXI !== 'undefined') {
    // A model doodad's draw items for this frame (one per primitive, sorted far to near), or null to draw
    // the picture instead (no model, or still loading). Each part keeps its placed points and shading
    // until the model is turned, scaled or lit differently, and its projected triangles until the camera
    // or the doodad moves, so a still view costs almost nothing.
    Spriteset_Map.prototype.docsModelItems = function(obj, cam, pivot, fog, light, s) {
        const d = obj._data;
        const entry = d && d.model && d.model.path ? DocsDoodads.Models.get(d.model.path) : null;
        if (!entry || !entry.ready || !entry.primitives.length) return null;
        const P = DocsDoodads.Perspective, G = DocsDoodads.Gltf, T = DocsDoodads.Terrain;
        const tw = $gameMap.tileWidth();
        const scale = (Number(d.model.scale) || 1) * tw * s.doodadScale, yaw = Number(d.model.yaw) || 0;
        const dir = this._docsSkyLight || T.light;
        const flat = cam.curve === 'flat';
        let meshes = obj._docsModelMeshes = obj._docsModelMeshes || [];
        // Another model (the path changed, or it was loaded again): the old parts go.
        if (obj._docsModelEntry !== entry) {
            for (const m of meshes) if (m && !m._destroyed) m.destroy();
            meshes = obj._docsModelMeshes = [];
            obj._docsModelEntry = entry;
        }
        const items = [];
        const ph = pivot.h || 0;
        const pivotDepth = P.project(cam, pivot.x, pivot.y, ph);
        if (!pivotDepth) return [];
        const placeKey = scale + '|' + yaw;
        const shadeKey = yaw + '|' + dir[0] + ',' + dir[1] + ',' + dir[2];
        const C = cam.C, F = cam.F, R = cam.R, U = cam.U;
        const frameKey = [C.x, C.y, C.z, F.x, F.y, F.z, R.x, R.y, U.z, cam.focal, cam.width, cam.height, cam.curve, cam.radius,
            cam.target.x, cam.target.y, pivot.x, pivot.y, ph, placeKey].join(',');
        // A doodad flipped by a negative scale turns its faces inside out.
        const mirrored = scale < 0;
        const hw = cam.width / 2, hh = cam.height / 2, focal = cam.focal;
        entry.primitives.forEach((prim, pi) => {
            const n = prim.positions.length / 3, triCount = prim.indices.length / 3;
            let m = meshes[pi];
            if (!m || m._destroyed || m._docsCount !== n || m._docsTris !== triCount) {
                if (m && !m._destroyed) m.destroy();
                const geometry = new PIXI.Geometry()
                    .addAttribute('aVertexPosition', new Float32Array(n * 2), 2)
                    .addAttribute('aUv', new Float32Array(prim.uvs), 2)
                    .addAttribute('aShade', new Float32Array(n), 1)
                    .addIndex(n < 65536 ? new Uint16Array(prim.indices.length) : new Uint32Array(prim.indices.length));
                const shader = PIXI.Shader.from(DocsDoodads.Models.vertex, DocsDoodads.Models.fragment,
                    { uSampler: entry.textures[pi], uColor: prim.color, uTint: [1, 1, 1], uAlpha: 1 });
                m = meshes[pi] = new PIXI.Mesh(geometry, shader);
                m._docsCount = n;
                m._docsTris = triCount;
                m._docsPlaced = new Float64Array(n * 3);
                m._docsDepth = new Float64Array(n);
                m._docsOk = new Uint8Array(n);
                m._docsSort = T.sortBuffers(triCount);
                m._docsTri = new Uint32Array(triCount);
                m._docsPlaceKey = m._docsShadeKey = m._docsFrameKey = null;
            }
            const placed = m._docsPlaced;
            if (m._docsPlaceKey !== placeKey) {
                for (let v = 0; v < n; v++) {
                    const w = G.place(prim.positions[v * 3], prim.positions[v * 3 + 1], prim.positions[v * 3 + 2], scale, yaw);
                    placed[v * 3] = w.dx; placed[v * 3 + 1] = w.dy; placed[v * 3 + 2] = w.h;
                }
                m._docsPlaceKey = placeKey;
                m._docsFrameKey = null;
            }
            if (m._docsShadeKey !== shadeKey) {
                const shade = m.geometry.getBuffer('aShade').data;
                for (let v = 0; v < n; v++) shade[v] = G.shade(prim.normals[v * 3], prim.normals[v * 3 + 1], prim.normals[v * 3 + 2], yaw, dir);
                m.geometry.getBuffer('aShade').update();
                m._docsShadeKey = shadeKey;
            }
            if (m._docsFrameKey !== frameKey) {
                const pos = m.geometry.getBuffer('aVertexPosition').data, ok = m._docsOk, depthOf = m._docsDepth;
                // P.project, written out so the loop allocates nothing on flat maps.
                for (let v = 0; v < n; v++) {
                    let x = pivot.x + placed[v * 3], y = pivot.y + placed[v * 3 + 1], z = ph + placed[v * 3 + 2];
                    if (!flat) {
                        const g = P.groundPoint(cam, x, y, z);
                        if (!g.visible) { ok[v] = 0; continue; }
                        x = g.x; y = g.y; z = g.z;
                    }
                    const vx = x - C.x, vy = y - C.y, vz = z - C.z;
                    const depth = vx * F.x + vy * F.y + vz * F.z;
                    if (depth < 1) { ok[v] = 0; continue; }
                    const k = focal / depth;
                    pos[v * 2] = hw + (vx * R.x + vy * R.y + vz * R.z) * k;
                    pos[v * 2 + 1] = hh - (vx * U.x + vy * U.y + vz * U.z) * k;
                    depthOf[v] = depth;
                    ok[v] = 1;
                }
                const idx = prim.indices, buf = m._docsSort;
                let count = 0, sum = 0;
                for (let t = 0; t < triCount; t++) {
                    const a = idx[t * 3], b = idx[t * 3 + 1], c = idx[t * 3 + 2];
                    if (!ok[a] || !ok[b] || !ok[c]) continue;
                    // Single-sided faces turned away from the camera are skipped.
                    if (!prim.doubleSided) {
                        const area = (pos[b * 2] - pos[a * 2]) * (pos[c * 2 + 1] - pos[a * 2 + 1]) - (pos[c * 2] - pos[a * 2]) * (pos[b * 2 + 1] - pos[a * 2 + 1]);
                        if (mirrored ? area < 0 : area > 0) continue;
                    }
                    const depth = (depthOf[a] + depthOf[b] + depthOf[c]) / 3;
                    buf.depth[count] = depth;
                    m._docsTri[count++] = t;
                    sum += depth;
                }
                const sorted = T.sortFarToNear(buf, count);
                const out = m.geometry.getIndex().data;
                for (let i = 0; i < count; i++) {
                    const t = m._docsTri[sorted[i]];
                    out[i * 3] = idx[t * 3]; out[i * 3 + 1] = idx[t * 3 + 1]; out[i * 3 + 2] = idx[t * 3 + 2];
                }
                m.geometry.getBuffer('aVertexPosition').update();
                m.geometry.getIndex().update();
                m._docsFrameKey = frameKey;
                m._docsDrawn = count;
                m._docsMean = count ? sum / count : pivotDepth.depth;
            }
            const u = m.shader.uniforms;
            u.uSampler = entry.textures[pi];
            u.uAlpha = 1 - fog;
            u.uTint = light !== null && light !== undefined ? [((light >> 16) & 255) / 255, ((light >> 8) & 255) / 255, (light & 255) / 255] : [1, 1, 1];
            // Parts sort among themselves by their own depth, all at the model's place among billboards.
            const count = m._docsDrawn;
            if (count) items.push({ terrain: true, mesh: m, start: 0, count, depth: pivotDepth.depth + (m._docsMean - pivotDepth.depth) * 1e-3, bias: tw * 0.5, z: obj.z || 0, spriteId: obj.spriteId || 0 });
        });
        // Parts the model no longer has.
        for (let i = entry.primitives.length; i < meshes.length; i++) if (meshes[i] && !meshes[i]._destroyed) meshes[i].destroy();
        meshes.length = entry.primitives.length;
        return items;
    };
}

// A doodad's model meshes go with its sprite (scene changes, editor refreshes).
if (typeof Sprite_DocsDoodad !== 'undefined' && Sprite_DocsDoodad.prototype.destroy) {
    $.Sprite_DocsDoodad_destroy_models = Sprite_DocsDoodad.prototype.destroy;
    Sprite_DocsDoodad.prototype.destroy = function(options) {
        for (const mesh of this._docsModelMeshes || []) if (mesh && !mesh._destroyed) mesh.destroy();
        this._docsModelMeshes = null;
        $.Sprite_DocsDoodad_destroy_models.call(this, options);
    };
}

// Battles on 3D maps can use the map itself as the background: when MZ takes its snapshot for the
// battle, the 3D view is drawn again from a low camera, without characters, pictures or the minimap.
if (typeof Spriteset_Map !== 'undefined' && typeof Bitmap !== 'undefined' && Bitmap.snap) {
    Spriteset_Map.prototype.docsBattleSnapshot = function(s) {
        const hidden = [];
        const hide = obj => { if (obj && obj.visible) { obj.visible = false; hidden.push(obj); } };
        for (const sp of this._characterSprites || []) {
            hide(sp);
            hide(sp._docsShadow);
            for (const layer of sp._docsVisualSprites || []) hide(layer);
        }
        hide(this._pictureContainer);
        hide(this._timerSprite);
        hide(this._docsMinimap);
        hide(this._destinationSprite);
        const saved = $gameMap._docsCamera;
        $gameMap._docsCamera = Object.assign({}, saved, DocsDoodads.Perspective.battleCamera(s));
        let bitmap = null;
        try {
            this.updateDocsPerspective();
            bitmap = Bitmap.snap(this);
        } finally {
            $gameMap._docsCamera = saved;
            for (const obj of hidden) obj.visible = true;
            this.updateDocsPerspective();
        }
        return bitmap;
    };
}

if (typeof Scene_Map !== 'undefined') {
    $.Scene_Map_snapForBattleBackground_3d = Scene_Map.prototype.snapForBattleBackground;
    Scene_Map.prototype.snapForBattleBackground = function() {
        $.Scene_Map_snapForBattleBackground_3d.call(this);
        if (typeof $gameTemp === 'undefined' || !$gameTemp) return;
        DocsDoodads.Perspective.releaseBattleBack();
        const s = DocsDoodads.Perspective.active();
        if (s && s.battleBack && this._spriteset && this._spriteset.docsBattleSnapshot) {
            $gameTemp._docsBattleBack = this._spriteset.docsBattleSnapshot(s);
        }
    };
}

if (typeof Sprite_Battleback !== 'undefined') {
    $.Sprite_Battleback_battleback1Bitmap_3d = Sprite_Battleback.prototype.battleback1Bitmap;
    Sprite_Battleback.prototype.battleback1Bitmap = function() {
        const back = typeof $gameTemp !== 'undefined' && $gameTemp ? $gameTemp._docsBattleBack : null;
        return back || $.Sprite_Battleback_battleback1Bitmap_3d.call(this);
    };
    $.Sprite_Battleback_battleback2Bitmap_3d = Sprite_Battleback.prototype.battleback2Bitmap;
    // The map picture covers both layers; the second is left empty (one blank picture, shared).
    Sprite_Battleback.prototype.battleback2Bitmap = function() {
        const back = typeof $gameTemp !== 'undefined' && $gameTemp ? $gameTemp._docsBattleBack : null;
        if (!back) return $.Sprite_Battleback_battleback2Bitmap_3d.call(this);
        if (!DocsDoodads.Perspective._blankBack || !DocsDoodads.Perspective._blankBack.baseTexture) DocsDoodads.Perspective._blankBack = new Bitmap(1, 1);
        return DocsDoodads.Perspective._blankBack;
    };
}

// The map picture taken for a battle is freed when the battle ends or another is taken.
DocsDoodads.Perspective.releaseBattleBack = function() {
    if (typeof $gameTemp === 'undefined' || !$gameTemp) return;
    const back = $gameTemp._docsBattleBack;
    $gameTemp._docsBattleBack = null;
    if (back && back.destroy && back.baseTexture) back.destroy();
};

if (typeof Scene_Battle !== 'undefined') {
    $.Scene_Battle_terminate_3d = Scene_Battle.prototype.terminate;
    Scene_Battle.prototype.terminate = function() {
        $.Scene_Battle_terminate_3d.call(this);
        DocsDoodads.Perspective.releaseBattleBack();
    };
}

// Show World Map: the whole map, or a globe on planet-shaped 3D maps, until OK or Cancel.
function Scene_DocsWorldMap() {
    this.initialize(...arguments);
}
DocsDoodads.Scene_DocsWorldMap = Scene_DocsWorldMap;

if (typeof Scene_MenuBase !== 'undefined') {
    Scene_DocsWorldMap.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_DocsWorldMap.prototype.constructor = Scene_DocsWorldMap;

    Scene_DocsWorldMap.prototype.create = function() {
        Scene_MenuBase.prototype.create.call(this);
        const map = DocsDoodads.Minimap.forCurrentMap();
        const s = DocsDoodads.Perspective.active();
        this._map = map;
        this._globe = Boolean(s && s.curve === 'sphere');
        this._spin = 0;
        this._picture = new Sprite();
        this.addChild(this._picture);
        this._marker = new PIXI.Graphics();
        this.addChild(this._marker);
        this.drawWorldMap();
    };

    Scene_DocsWorldMap.prototype.drawWorldMap = function() {
        const map = this._map;
        if (!map) return;
        const M = DocsDoodads.Minimap;
        const px = $gamePlayer.x, py = $gamePlayer.y;
        this._marker.clear();
        if (this._globe) {
            const size = Math.min(Graphics.width, Graphics.height) - 60;
            const canvas = M.canvasFor(M.globePixels(map.pixels, map.width, map.height, size, px + 0.5, py + 0.5, this._spin), size, size);
            const bitmap = this.worldMapBitmap(size, size);
            bitmap.context.clearRect(0, 0, size, size);
            bitmap.context.drawImage(canvas, 0, 0);
            this._picture.bitmap.baseTexture.update();
            this._picture.x = (Graphics.width - size) / 2;
            this._picture.y = (Graphics.height - size) / 2;
            // The player faces the viewer at the centre until the globe is turned.
            if (Math.abs(this._spin) < 1e-6) this._marker.beginFill(0xffffff).lineStyle(2, 0x000000).drawCircle(Graphics.width / 2, Graphics.height / 2, 5).endFill();
        } else {
            const scale = Math.max(0.1, Math.min((Graphics.width - 60) / map.width, (Graphics.height - 60) / map.height));
            const canvas = M.canvasFor(map.pixels, map.width, map.height);
            const w = Math.round(map.width * scale), h = Math.round(map.height * scale);
            this.worldMapBitmap(w, h);
            this._picture.bitmap.context.imageSmoothingEnabled = false;
            this._picture.bitmap.context.drawImage(canvas, 0, 0, w, h);
            this._picture.bitmap.baseTexture.update();
            this._picture.x = (Graphics.width - w) / 2;
            this._picture.y = (Graphics.height - h) / 2;
            this._marker.beginFill(0xffffff).lineStyle(2, 0x000000).drawCircle(this._picture.x + (px + 0.5) * scale, this._picture.y + (py + 0.5) * scale, 5).endFill();
        }
    };

    // One picture, redrawn while the globe turns (a new one each frame would pile up until the scene ends).
    Scene_DocsWorldMap.prototype.worldMapBitmap = function(w, h) {
        const old = this._picture.bitmap;
        if (old && old.width === w && old.height === h) return old;
        if (old) old.destroy();
        return (this._picture.bitmap = new Bitmap(w, h));
    };

    Scene_DocsWorldMap.prototype.terminate = function() {
        Scene_MenuBase.prototype.terminate.call(this);
        if (this._picture && this._picture.bitmap) {
            const bitmap = this._picture.bitmap;
            this._picture.bitmap = null;
            bitmap.destroy();
        }
    };

    Scene_DocsWorldMap.prototype.update = function() {
        Scene_MenuBase.prototype.update.call(this);
        if (this._globe && (Input.isPressed('left') || Input.isPressed('right'))) {
            this._spin += Input.isPressed('left') ? -0.05 : 0.05;
            this.drawWorldMap();
        }
        if (Input.isTriggered('ok') || Input.isTriggered('cancel') || TouchInput.isCancelled() || TouchInput.isTriggered()) {
            SoundManager.playCancel();
            this.popScene();
        }
    };
}

if (typeof PluginManager !== 'undefined' && typeof PluginManager.registerCommand === 'function') {
    PluginManager.registerCommand(pluginName, 'showWorldMap', () => {
        if (typeof SceneManager !== 'undefined' && typeof Scene_DocsWorldMap.prototype.create === 'function') SceneManager.push(Scene_DocsWorldMap);
    });
}

// The ground height (tiles) under a character, for event conditions and scripts:
// DocsDoodads.Terrain.heightOf($gamePlayer) in a Conditional Branch script.
DocsDoodads.Terrain.heightOf = function(character) {
    const g = this.grid(true);
    if (!g || !character) return 0;
    return this.tileHeight(g, character.x, character.y);
};

if (typeof PluginManager !== 'undefined' && typeof PluginManager.registerCommand === 'function') {
    PluginManager.registerCommand(pluginName, 'storeHeight', function(args) {
        const ch = DocsDoodads.characterFor(this, args.target, args.eventId);
        const id = Number(args.variableId) || 0;
        if (id > 0 && typeof $gameVariables !== 'undefined') $gameVariables.setValue(id, Math.round(DocsDoodads.Terrain.heightOf(ch)));
    });
}

