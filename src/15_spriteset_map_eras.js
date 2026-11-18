//==========================================================
// SECTION 7V: MAP ERAS ON THE MAP (8.4.5)
//==========================================================
// What shows in the game (and so what blocks and gives light) follows the map's era; a change crossfades.
// While editing, the editor's era shows and the other eras' doodads are drawn faint (onion skin).
(function() {
    const Er = DocsDoodads.Eras, L = DocsDoodads.Layers;
    if (L && typeof L.visibleInGame === 'function') {
        const inGame = L.visibleInGame;
        L.visibleInGame = function(d) {
            return inGame.apply(this, arguments) && Er.shown(d);
        };
    }
    if (typeof Spriteset_Map !== 'undefined') {
        Spriteset_Map.prototype.updateDocsEras = function() { if (typeof $gameMap !== 'undefined' && $gameMap && Er.of($gameMap.mapId())) Er.step(); else Er._fade = null; };
        DocsDoodads.spritesetSteps.unshift('updateDocsEras');
    }
    if (typeof Sprite_DocsDoodad !== 'undefined') {
        const place = Sprite_DocsDoodad.prototype.updatePlacement;
        Sprite_DocsDoodad.prototype.updatePlacement = function() {
            const result = place.apply(this, arguments);
            const d = this._data;
            if (!d || !Array.isArray(d.eras) || !d.eras.length) return result;
            const editing = Boolean(DocsDoodads.Workspace && DocsDoodads.Workspace.mounted);
            if (editing) {
                const era = Er.live();
                if (era && !d.eras.includes(era)) { this.alpha *= Er.onion; if (!Er.onion) this.visible = false; }
            } else this.alpha *= Er.alpha(d);
            return result;
        };
    }
})();
