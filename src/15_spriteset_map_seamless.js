//==========================================================
// SECTION 7S: NEIGHBOURS' TILES PAST THE EDGE (7.3.1)
//==========================================================
// With seamless steps on, each linked neighbour whose map file is loaded and that uses this map's tileset gets a
// tilemap of its own behind this one, moved with the camera, so the join is never a black strip. Events and
// doodads of the neighbour are not drawn past the edge.
(function() {
    if (typeof Spriteset_Map === 'undefined' || typeof Tilemap === 'undefined') return;
    const S = DocsDoodads.Seamless;

    Spriteset_Map.prototype.updateDocsSeamless = function() {
        const maps = this._docsNeighbourMaps = this._docsNeighbourMaps || {};
        if (typeof $gameMap === 'undefined' || !$gameMap || this._docs3d || !S.enabled($gameMap.mapId()) || !this._tilemap) {
            for (const k of Object.keys(maps)) if (maps[k]) maps[k].visible = false;
            return;
        }
        const mapId = $gameMap.mapId(), links = S.links(mapId), here = S.sizeOf(mapId);
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        for (const side of ['east', 'west', 'north', 'south']) {
            const id = Number(links[side]), map = id ? S.cache[id] : null;
            let t = maps[side];
            const loops = side === 'east' || side === 'west' ? $gameMap.isLoopHorizontal() : $gameMap.isLoopVertical();
            if (!map || loops || map.tilesetId !== $dataMap.tilesetId) { if (t) t.visible = false; continue; }
            if (!t || t._docsMapId !== id) {
                if (t && t.parent) t.parent.removeChild(t);
                t = maps[side] = new Tilemap();
                t._docsMapId = id;
                t.tileWidth = tw; t.tileHeight = th;
                t.setData(map.width, map.height, map.data);
                t.horizontalWrap = false; t.verticalWrap = false;
                if (this._tilemap._bitmaps && t.setBitmaps) t.setBitmaps(this._tilemap._bitmaps);
                t.flags = this._tilemap.flags;
                const parent = this._tilemap.parent || this._baseSprite;
                parent.addChildAt(t, Math.max(0, parent.children.indexOf(this._tilemap)));
                if (t.refresh) t.refresh();
            }
            const off = S.offset(side, here, { w: map.width, h: map.height });
            t.visible = true;
            t.origin.x = this._tilemap.origin.x - off.x * tw;
            t.origin.y = this._tilemap.origin.y - off.y * th;
            if (t.update) t.update();
        }
        if (!this._docsPreloaded) { this._docsPreloaded = true; S.preload(mapId); }
    };

    DocsDoodads.spritesetSteps.push('updateDocsSeamless');
})();
