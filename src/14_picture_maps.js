//==========================================================
// SECTION 7M: PICTURE MAPS: EMPTY TILES ARE FLOOR (7.1.6)
//==========================================================
// A map drawn with picture layers (an imported Tiled or LDtk map, or parallax art) may have no tiles at all,
// and MZ counts a tile with nothing on it as a wall. With the map's "Empty tiles are floor" on, a tile whose
// four layers are empty can be walked on in every direction; painted collision (DocsDoodads.Walls) and
// doodads still stop the player. Boats, ships and airship landings keep MZ's rules.
DocsDoodads.PictureMaps = {
    emptyIsFloor(mapId) {
        const settings = DocsDoodads.Lighting && DocsDoodads.Lighting.mapSettings ? DocsDoodads.Lighting.mapSettings(mapId) : null;
        return Boolean(settings && settings.emptyIsFloor === true);
    },

    // bit: MZ's passage bit (0x0f for walking directions).
    passes(tileIds, bit, emptyIsFloor) {
        if (!emptyIsFloor || !(bit & 0x0f)) return null;
        return (tileIds || []).every(id => !id) ? true : null;
    }
};

if (typeof Game_Map !== 'undefined' && typeof Game_Map.prototype.checkPassage === 'function') {
    $.Game_Map_checkPassage_pictureMaps = Game_Map.prototype.checkPassage;
    Game_Map.prototype.checkPassage = function(x, y, bit) {
        const P = DocsDoodads.PictureMaps;
        const open = P.emptyIsFloor(this.mapId()) && typeof this.layeredTiles === 'function' ? P.passes(this.layeredTiles(x, y), bit, true) : null;
        return open === true ? true : $.Game_Map_checkPassage_pictureMaps.call(this, x, y, bit);
    };
}
