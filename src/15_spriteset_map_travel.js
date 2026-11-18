//==========================================================
// SECTION 7T: RIDERS AND TRAVELLERS ON THE MAP (9.2.5)
//==========================================================
// Each frame, before the doodads are drawn, riders and travellers (a short list kept apart from the rest) are moved
// to where they are now. Carriers take whoever stands on them a tile when they cross a tile line, and their tiles
// can be walked on (a raft on water). While the editor is open everything stands where it was placed.
(function() {
    if (typeof Spriteset_Map === 'undefined') return;
    const T = DocsDoodads.Travel;
    T._decks = new Set();

    Spriteset_Map.prototype.docsMovers = function() {
        const list = DocsDoodads.doodads() || [];
        const c = this._docsMoverCache;
        if (c && c.list === list && c.length === list.length && c.version === DocsDoodads.Travel._version) return c.movers;
        const movers = list.filter(d => d && (d.ride || d.travel));
        this._docsMoverCache = { list, length: list.length, movers, version: DocsDoodads.Travel._version };
        return movers;
    };

    Spriteset_Map.prototype.updateDocsMovers = function() {
        if (typeof $gameMap === 'undefined' || !$gameMap) return;
        const movers = this.docsMovers();
        T._decks.clear();
        if (!movers.length) return;
        if (DocsDoodads.Workspace && DocsDoodads.Workspace.mounted) {
            // Once, as the editor opens: back where they were placed, and forget that place so a drag in the
            // editor becomes the new one.
            if (!this._docsMoversParked) { T.restore(movers); for (const d of movers) T._homes.delete(d); this._docsMoversParked = true; }
            return;
        }
        this._docsMoversParked = false;
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight(), mapId = $gameMap.mapId();
        const frames = this._docsTravelFrames = this._docsTravelFrames || new Map();
        const switchValue = id => (typeof $gameSwitches !== 'undefined' && $gameSwitches ? $gameSwitches.value(id) : false);
        let moved = false;
        for (const d of movers) {
            const home = T.home(d);
            const bx = d.x, by = d.y;
            if (d.ride) {
                const r = T.normalizeRide(d.ride);
                const who = r && (r.on === 'player' ? (typeof $gamePlayer !== 'undefined' ? $gamePlayer : null) : $gameMap.event(r.on));
                const at = who ? T.rideAt(r, who, tw, th) : null;
                if (at) { d.x = at.x; d.y = at.y; } else { d.x = home.x; d.y = home.y; }
            } else {
                let place;
                if (T.finished(d, mapId)) place = T.at(d.travel, Infinity);
                else {
                    let f = frames.get(d) || 0;
                    if (T.running(d, mapId, switchValue)) f++;
                    frames.set(d, f);
                    place = T.at(d.travel, f);
                    if (place.done) T.finish(d, mapId);
                }
                d.x = home.x + place.dx; d.y = home.y + place.dy;
                const t = T.normalizeTravel(d.travel);
                if (t && t.carries) this.docsCarry(d, bx, by, tw, th);
            }
            if (d.x !== bx || d.y !== by) moved = true;
        }
        if (moved && DocsDoodads.Collision.invalidate) DocsDoodads.Collision.invalidate();
    };

    // The carrier's tiles (its body, or the tile under its base) and whoever stood on them crossing with it.
    Spriteset_Map.prototype.docsCarry = function(d, bx, by, tw, th) {
        const tilesOf = (x, y) => {
            const keys = T.bodyTiles(Object.assign({}, d, { x, y }), tw, th);
            return keys.length ? keys : [Math.floor(x / tw) + ',' + Math.floor((y - 1) / th)];
        };
        const now = tilesOf(d.x, d.y);
        for (const k of now) T._decks.add(k);
        const ox = Math.floor(bx / tw), oy = Math.floor((by - 1) / th), nx = Math.floor(d.x / tw), ny = Math.floor((d.y - 1) / th);
        if (ox === nx && oy === ny) return;
        const before = new Set(tilesOf(bx, by));
        const riders = [];
        if (typeof $gamePlayer !== 'undefined' && $gamePlayer) riders.push($gamePlayer);
        for (const who of riders) {
            if (!before.has(who.x + ',' + who.y) || (who.isMoving && who.isMoving()) || (who.isJumping && who.isJumping())) continue;
            // A step of the carrier's size; MZ slides the character to it at its own speed.
            who._x = $gameMap.roundX(who.x + nx - ox);
            who._y = $gameMap.roundY(who.y + ny - oy);
            if (who._followers && who._followers.synchronize) who._followers.synchronize(who._x, who._y, who.direction());
        }
    };

    DocsDoodads.spritesetSteps.unshift('updateDocsMovers');

    // A carrier's tiles can be walked on whatever is under them.
    if (typeof Game_Player !== 'undefined') {
        const canPass = Game_Player.prototype.canPass;
        Game_Player.prototype.canPass = function(x, y, d) {
            if (canPass.apply(this, arguments)) return true;
            if (!T._decks.size) return false;
            const x2 = $gameMap.roundXWithDirection(x, d), y2 = $gameMap.roundYWithDirection(y, d);
            return $gameMap.isValid(x2, y2) && T._decks.has(x2 + ',' + y2) && !(this.isCollidedWithCharacters && this.isCollidedWithCharacters(x2, y2));
        };
    }
})();
