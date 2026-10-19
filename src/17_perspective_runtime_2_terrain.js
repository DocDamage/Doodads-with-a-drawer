//==========================================================
// SECTION 7I: PERSPECTIVE (3D) RUNTIME: TERRAIN
//==========================================================
// ---- Terrain height (3D view) ----
// In play the map's terrain settings only change by being replaced, so the normalized copy is kept
// while they stay the same object; the editor (whose brush paints in place) always works them out.
DocsDoodads.Terrain.settingsFor = function(mapId) {
    const raw = (DocsDoodads.Lighting.mapSettings(mapId) || {}).terrain;
    const editing = Boolean(DocsDoodads.Workspace && DocsDoodads.Workspace.mounted);
    const memo = this._settingsMemo;
    if (!editing && memo && memo.mapId === mapId && memo.raw === raw) return memo.settings;
    const settings = this.normalize(raw);
    this._settingsMemo = editing ? null : { mapId, raw, settings };
    return settings;
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
    const c = this._grid;
    // The same (kept) settings on the same map data: nothing to compare.
    if (c && c.settings === s && c.data === $dataMap.data && c.mapId === $gameMap.mapId() && c.tileset === tileset) return c;
    const sig = $gameMap.mapId() + '|' + this.signature(map, tileset, s);
    if (c && c.sig === sig && c.data === $dataMap.data) { c.settings = s; c.tileset = tileset; return c; }
    const heights = this.buildHeights(map, tileset, s);
    let max = 0, min = 0;
    for (const h of heights) { if (h > max) max = h; if (h < min) min = h; }
    this._grid = { sig, data: $dataMap.data, heights, width: map.width, height: map.height, style: s.style, max, min, settings: s,
        mapId: $gameMap.mapId(), tileset, loopX: $gameMap.isLoopHorizontal(), loopY: $gameMap.isLoopVertical() };
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
    'attribute float aWall;',
    'uniform mat3 projectionMatrix;',
    'uniform mat3 translationMatrix;',
    'varying vec2 vUv;',
    'varying vec2 vShade;',
    'varying vec2 vScreen;',
    'varying float vDepth;',
    'varying float vHeight;',
    'varying float vWall;',
    'void main() {',
    '    vUv = aUv;',
    '    vHeight = aHeight;',
    '    vWall = aWall;',
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
    // The ground without floor decals, for walls (a rug runs under a wall, not up it).
    'uniform sampler2D uWallSampler;',
    'varying float vWall;',
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
    '    if (uv.x >= 0.0 && uv.y >= 0.0 && uv.x <= 1.0 && uv.y <= 1.0) c = mix(texture2D(uSampler, uv), texture2D(uWallSampler, uv), step(0.5, vWall));',
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

    // The ground without floor decals (Below characters), for wall tiles: drawn only on maps with walls
    // and visible floor decals. null when the walls can use the normal ground.
    Spriteset_Map.prototype.docsWallGround = function(renderer, tilemap, gw, gh) {
        const grid = T.grid();
        const decals = grid && grid.heights && grid.heights.wall
            ? (this._docsDoodadSprites || []).filter(sp => sp.visible && sp.renderable !== false && sp.parent === tilemap && DocsDoodads.Depth.resolve(sp._data) === 'below')
            : [];
        if (!decals.length) {
            this._docsWallUsed = false;
            return null;
        }
        if (!this._docsWallTexture || this._docsWallTexture.width !== gw || this._docsWallTexture.height !== gh) {
            if (this._docsWallTexture) this._docsWallTexture.destroy(true);
            this._docsWallTexture = PIXI.RenderTexture.create({ width: gw, height: gh });
        }
        this._docsWallTexture.baseTexture.scaleMode = this._docs3dTexture.baseTexture.scaleMode;
        for (const sp of decals) sp.renderable = false;
        renderer.render(tilemap, this._docsWallTexture, true);
        for (const sp of decals) sp.renderable = true;
        this._docsWallUsed = true;
        return this._docsWallTexture;
    };

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
            walls: new Float32Array(mesh.vertices.map(v => v.wall || 0)),
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
            .addAttribute('aWall', topo.walls, 1)
            .addIndex(topo.index);
        const shader = PIXI.Shader.from(T.vertex, T.fragment, { uSampler: PIXI.Texture.EMPTY, uWallSampler: PIXI.Texture.EMPTY, uVoid: [0, 0, 0], uFog: [0, 0, 0, 0], uAlpha: 1,
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
                    // Sorted by place on the ground; the shader's depth (for See-Through) keeps the height.
                    topo.depth[i] = depth - vz * F.z - C.z * F.z;
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
                        topo.depth[i] = (n.x - C.x) * F.x + (n.y - C.y) * F.y + (n.z - C.z) * F.z;
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
        u.uWallSampler = this._docsWallUsed && this._docsWallTexture ? this._docsWallTexture : rt;
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
        const flatRegion = s ? s.standFlatRegion : 0;
        const c = this._docsStand;
        if (c && c.map === $dataMap && c.mode === mode && c.flatRegion === flatRegion) return c;
        const tileset = $gameMap.tileset ? $gameMap.tileset() : null;
        const built = DocsDoodads.StandTiles.groups($dataMap || { width: 0, height: 0, data: [] }, tileset && tileset.flags, mode, { flatRegion });
        this._docsStand = { map: $dataMap, mode, flatRegion, list: built.list, mask: built.list.length ? built.mask : null };
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

    // The caps made from a picture that is going away (stand-tile pictures are rebuilt with each map scene).
    DocsDoodads.SnowCover.dropCapsFor = function(base) {
        if (!base || !this._caps) return;
        const prefix = (base.cacheId || base.uid) + '|';
        for (const [key, cap] of [...this._caps]) {
            if (!String(key).startsWith(prefix)) continue;
            this._caps.delete(key);
            if (cap && cap.destroy) cap.destroy();
        }
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
    // editing (everything shows as placed). Hills fade in every mode; doodads follow the mode.
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
    // Returns whether something in front hides the player. Fade and Both fade it; Silhouette and Both
    // show the player's outline over it instead (docsSilhouetteItems).
    Spriteset_Map.prototype.docsSeeThroughBillboards = function(items, see) {
        const settings = DocsDoodads.World.settings().seeThrough;
        const th = $gameMap.tileHeight();
        const fade = settings.mode !== 'silhouette';
        let hidden = false;
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
                if (P.hidesPlayer(box, it.matrix.depth, see)) {
                    hidden = true;
                    if (fade) target = see.opacity;
                }
            }
            obj._docs3dSeeAlpha = DocsDoodads.SeeThrough.step(obj._docs3dSeeAlpha !== undefined ? obj._docs3dSeeAlpha : 1, target, see ? see.speed : 1);
            it.alpha *= obj._docs3dSeeAlpha;
        }
        return hidden;
    };

    // What the silhouette draws: the player and their gear, in the order they're drawn (items sorted).
    Spriteset_Map.prototype.docsSilhouetteItems = function(items, see) {
        const player = see && see.player;
        if (!player) return null;
        const out = items.filter(it => it.obj && it.matrix && (it.obj === player || it.obj._docsBillboardOwner === player));
        return out.length ? out : null;
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
        // Flying, and climbing a climbable cliff (Traversal), aren't walking.
        if (DocsDoodads.Traversal && DocsDoodads.Traversal.bypassesTerrain(this)) return false;
        if (typeof Game_Vehicle !== 'undefined' && this instanceof Game_Vehicle) return false;
        if (this.isInVehicle && this.isInVehicle()) return false;
        return true;
    };
}

