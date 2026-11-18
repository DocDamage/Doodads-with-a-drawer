//==========================================================
// SECTION 7K: BAKED CHUNKS ON THE MAP (7.3.4)
//==========================================================
// When the map's bake is current (DocsDoodads.Bake.active), the baked doodads' sprites are taken off and a sprite
// per chunk is drawn in their band, moved with the camera.
if (typeof Spriteset_Map !== 'undefined' && typeof PIXI !== 'undefined') {
    const B = DocsDoodads.Bake;
    // After the doodads' sprites are made: baked ones go, and the chunks come in their place.
    const add = Spriteset_Map.prototype.addDocsDoodads;
    if (typeof add === 'function') {
        Spriteset_Map.prototype.addDocsDoodads = function() {
            const result = add.apply(this, arguments);
            this.docsApplyBake();
            return result;
        };
    }
    Spriteset_Map.prototype.docsApplyBake = function() {
        for (const s of this._docsBakeSprites || []) { if (s.parent) s.parent.removeChild(s); if (s.destroy) s.destroy(); }
        this._docsBakeSprites = [];
        if (typeof $gameMap === 'undefined' || !$gameMap || this._docs3d || !this._docsDoodadsContainer) return;
        const m = B.active($gameMap.mapId());
        if (!m) return;
        const uids = new Set(m.uids || []);
        const baked = (this._docsDoodadSprites || []).map(s => s._data).filter(d => d && uids.has(d.uid));
        if (this.removeSomeDocsDoodads) this.removeSomeDocsDoodads(baked);
        for (const c of m.chunks) {
            const sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
            const bmp = DocsDoodads.loadBitmap(c.file);
            const set = () => { if (bmp && bmp._baseTexture) sprite.texture = new PIXI.Texture(bmp._baseTexture); };
            if (bmp && bmp.addLoadListener) bmp.addLoadListener(set); else set();
            sprite.z = DocsDoodads.Depth.bands[c.band === 'above' ? 'above' : 'below'];
            sprite._docsChunk = c;
            this._docsDoodadsContainer.addChild(sprite);
            this._docsBakeSprites.push(sprite);
        }
        this._docsBakedCount = baked.length;
    };
    Spriteset_Map.prototype.updateDocsBake = function() {
        const size = B.size;
        for (const s of this._docsBakeSprites || []) {
            const p = DocsDoodads.mapToScreen(s._docsChunk.cx * size, s._docsChunk.cy * size);
            s.x = p.x; s.y = p.y;
            s.visible = !this._docs3d;
        }
    };
    DocsDoodads.spritesetSteps.push('updateDocsBake');
}
