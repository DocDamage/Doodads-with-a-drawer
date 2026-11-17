//==========================================================
// SECTION 7G: THE GROUND BRUSH ON THE MAP (8.3.4)
//==========================================================
// The painted ground is a mesh in the tilemap above the ground tiles and below every doodad and character
// (z 0.4), mixing the map's textures by its mask in one shader. Looping maps get a copy across each seam. While
// the editor paints, it draws from the editor's live mask (DocsDoodads.Ground.live) instead of the saved PNG.
// Flat maps only in this version.
(function() {
    if (typeof Spriteset_Map === 'undefined' || typeof PIXI === 'undefined' || !PIXI.Mesh || !PIXI.Geometry || !PIXI.Shader) return;
    const G = DocsDoodads.Ground;
    G.live = G.live || {};
    G.z = 0.4;

    G.textureFor = function(path) {
        if (!path) return null;
        const bmp = DocsDoodads.loadBitmap(path);
        if (!bmp || !bmp._baseTexture || (bmp.isReady && !bmp.isReady())) return null;
        if (!bmp._docsGroundTexture || bmp._docsGroundTexture.baseTexture !== bmp._baseTexture) bmp._docsGroundTexture = new PIXI.Texture(bmp._baseTexture);
        return { texture: bmp._docsGroundTexture, w: bmp.width, h: bmp.height };
    };

    Spriteset_Map.prototype.docsGroundMeshes = function(count, width, height) {
        const list = this._docsGroundMeshes = this._docsGroundMeshes || [];
        if (list.length && (list[0]._docsW !== width || list[0]._docsH !== height)) this.docsRemoveGround();
        while (list.length < count) {
            const geometry = new PIXI.Geometry().addAttribute('aVertexPosition', [0, 0, width, 0, width, height, 0, height], 2).addIndex([0, 1, 2, 0, 2, 3]);
            const shader = PIXI.Shader.from(G.vertex, G.fragment, { uMask: PIXI.Texture.EMPTY, uMapSize: [width, height], uTex0: PIXI.Texture.EMPTY, uTex1: PIXI.Texture.EMPTY,
                uTex2: PIXI.Texture.EMPTY, uTexSize0: [1, 1], uTexSize1: [1, 1], uTexSize2: [1, 1], uAlpha: 1 });
            const mesh = new PIXI.Mesh(geometry, shader);
            mesh._docsW = width; mesh._docsH = height; mesh.z = G.z; mesh.spriteId = -1;
            if (this._tilemap) this._tilemap.addChild(mesh);
            list.push(mesh);
        }
        for (let i = 0; i < list.length; i++) list[i].visible = i < count;
        return list;
    };

    Spriteset_Map.prototype.docsRemoveGround = function() {
        for (const mesh of this._docsGroundMeshes || []) {
            if (mesh.parent) mesh.parent.removeChild(mesh);
            if (mesh.destroy) mesh.destroy();
        }
        this._docsGroundMeshes = [];
    };

    Spriteset_Map.prototype.updateDocsGround = function() {
        if (typeof $gameMap === 'undefined' || !$gameMap || !this._tilemap) return 0;
        const mapId = $gameMap.mapId(), settings = G.settings(DocsDoodads.Lighting.mapSettings(mapId)), live = G.live[mapId];
        const mask = live && live.texture ? { texture: live.texture } : settings && settings.mask ? G.textureFor(settings.mask) : null;
        if (this._docs3d || !settings || !mask) { for (const m of this._docsGroundMeshes || []) m.visible = false; return 0; }
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight(), width = $gameMap.width() * tw, height = $gameMap.height() * th;
        const loopX = $gameMap.isLoopHorizontal(), loopY = $gameMap.isLoopVertical();
        const offsets = [];
        for (const ox of loopX ? [-1, 0, 1] : [0]) for (const oy of loopY ? [-1, 0, 1] : [0]) offsets.push([ox, oy]);
        const meshes = this.docsGroundMeshes(offsets.length, width, height);
        const textures = settings.textures.map(path => G.textureFor(path));
        const origin = { x: -$gameMap.displayX() * tw, y: -$gameMap.displayY() * th };
        offsets.forEach(([ox, oy], i) => {
            const mesh = meshes[i], u = mesh.shader.uniforms;
            u.uMask = mask.texture; u.uMapSize = [width, height];
            textures.forEach((t, k) => {
                u['uTex' + k] = t ? t.texture : PIXI.Texture.EMPTY;
                u['uTexSize' + k] = t ? [Math.max(1, t.w * settings.scale), Math.max(1, t.h * settings.scale)] : [1, 1];
            });
            mesh.x = Math.round(origin.x + ox * width);
            mesh.y = Math.round(origin.y + oy * height);
            mesh.z = G.z;
            mesh.visible = mesh.x < Graphics.width && mesh.x + width > 0 && mesh.y < Graphics.height && mesh.y + height > 0;
        });
        return offsets.length;
    };

    const update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        update.apply(this, arguments);
        this.updateDocsGround();
    };
})();
