//==========================================================
// SECTION 5S: WALKING FROM MAP TO MAP WITHOUT A FADE (7.3.1)
//==========================================================
// With maps linked as neighbours (Map → neighbours: east, west, north, south) and World → seamless on, the player
// walks off one map's edge onto the next. It is a quick transfer with no fade: the neighbours' map files are
// fetched ahead when a map starts, so the next map is there at once; the camera may look past an edge that has a
// neighbour, whose tiles are drawn there (when it uses the same tileset), and keeps the player where they were on
// screen. Neighbours' events are not shown past the edge. A map can opt out (its setting `seamless: 'off'`);
// looping maps are left alone on the axis they loop. Flat maps.
DocsDoodads.Seamless = {
    cache: {},
    _loading: {},

    enabled(mapId) {
        const world = DocsDoodads.World.settings(), s = world && world.seamless;
        if (!s || !s.enabled) return false;
        const ms = DocsDoodads.Lighting.mapSettings(mapId);
        return !(ms && ms.seamless === 'off');
    },

    links(mapId) {
        const ms = DocsDoodads.Lighting.mapSettings(mapId);
        return (ms && ms.neighbors) || {};
    },

    // Where a step off the edge lands: { mapId, x, y } or null. sizes(id) → { w, h } or null; loop: { x, y }.
    target(mapId, x, y, d, links, sizes, loop = {}) {
        const here = sizes(mapId);
        if (!here || !links) return null;
        let side = null;
        if (d === 6 && x === here.w - 1 && !loop.x) side = 'east';
        else if (d === 4 && x === 0 && !loop.x) side = 'west';
        else if (d === 8 && y === 0 && !loop.y) side = 'north';
        else if (d === 2 && y === here.h - 1 && !loop.y) side = 'south';
        const id = side ? Number(links[side]) : 0;
        if (!id) return null;
        const there = sizes(id);
        if (!there) return null;
        const t = side === 'east' ? { x: 0, y } : side === 'west' ? { x: there.w - 1, y } : side === 'north' ? { x, y: there.h - 1 } : { x, y: 0 };
        if (t.x < 0 || t.y < 0 || t.x >= there.w || t.y >= there.h) return null;
        return { mapId: id, x: t.x, y: t.y, side };
    },

    // Where a map sits beside this one, in tiles: east is +w, west is -(its w), and so on.
    offset(side, here, there) {
        return side === 'east' ? { x: here.w, y: 0 } : side === 'west' ? { x: -there.w, y: 0 } : side === 'north' ? { x: 0, y: -there.h } : side === 'south' ? { x: 0, y: here.h } : { x: 0, y: 0 };
    },

    // Whether a tile of a cached map can be walked onto from direction d (MZ's passage check over its layers).
    passable(map, flags, x, y, d) {
        if (!map || !Array.isArray(map.data)) return false;
        const w = map.width, h = map.height, bit = (1 << ((10 - d) / 2 - 1)) & 0x0f;
        for (const z of [3, 2, 1, 0]) {
            const id = map.data[(z * h + y) * w + x] || 0;
            if (!id) continue;
            const f = flags[id] || 0;
            if ((f & 0x10) !== 0) continue;
            if ((f & bit) === 0) return true;
            if ((f & bit) === bit) return false;
        }
        return false;
    },

    sizeOf(id) {
        if (typeof $gameMap !== 'undefined' && $gameMap && $gameMap.mapId() === id && typeof $dataMap !== 'undefined' && $dataMap) return { w: $dataMap.width, h: $dataMap.height };
        const m = this.cache[id];
        return m ? { w: m.width, h: m.height } : null;
    },

    // Fetches each neighbour's map file once (JSON, like MZ's own loader).
    preload(mapId) {
        if (typeof XMLHttpRequest === 'undefined') return;
        for (const side of ['east', 'west', 'north', 'south']) {
            const id = Number(this.links(mapId)[side]);
            if (!id || this.cache[id] || this._loading[id]) continue;
            this._loading[id] = true;
            const xhr = new XMLHttpRequest();
            xhr.open('GET', 'data/Map' + String(id).padStart(3, '0') + '.json');
            xhr.overrideMimeType && xhr.overrideMimeType('application/json');
            xhr.onload = () => { try { if (xhr.status < 400) this.cache[id] = JSON.parse(xhr.responseText); } catch (e) { /* left out */ } this._loading[id] = false; };
            xhr.onerror = () => { this._loading[id] = false; };
            xhr.send();
        }
    },

    // The step off the edge: a fade-less transfer when the next map's tile can be walked onto.
    stepFrom(player, d) {
        if (typeof $gameMap === 'undefined' || !$gameMap) return false;
        const mapId = $gameMap.mapId();
        if (!this.enabled(mapId)) return false;
        const loop = { x: $gameMap.isLoopHorizontal(), y: $gameMap.isLoopVertical() };
        const t = this.target(mapId, player.x, player.y, d, this.links(mapId), id => this.sizeOf(id), loop);
        if (!t) return false;
        const map = this.cache[t.mapId];
        const tileset = map && typeof $dataTilesets !== 'undefined' ? $dataTilesets[map.tilesetId] : null;
        if (!map || !tileset || !this.passable(map, tileset.flags || [], t.x, t.y, d)) return false;
        // The camera keeps the player where they were on screen.
        const here = this.sizeOf(mapId), off = this.offset(t.side, here, { w: map.width, h: map.height });
        this._carry = { mapId: t.mapId, displayX: $gameMap.displayX() - off.x, displayY: $gameMap.displayY() - off.y };
        player.reserveTransfer(t.mapId, t.x, t.y, d, 2);
        return true;
    }
};

(function() {
    const S = DocsDoodads.Seamless;
    // The next map comes from the cache: no wait on the disk.
    if (typeof DataManager !== 'undefined' && typeof DataManager.loadMapData === 'function') {
        const load = DataManager.loadMapData;
        DataManager.loadMapData = function(mapId) {
            const cached = mapId > 0 && S._carry && S._carry.mapId === mapId ? S.cache[mapId] : null;
            if (cached) {
                window.$dataMap = JSON.parse(JSON.stringify(cached));
                if (this.onLoad) this.onLoad(window.$dataMap);
                return;
            }
            return load.apply(this, arguments);
        };
    }
    if (typeof Game_Player !== 'undefined') {
        // MZ's Game_Player has its own moveStraight; where it doesn't, the inherited one is looked up each call so
        // later parts' wrappers of it still run.
        const own = Object.prototype.hasOwnProperty.call(Game_Player.prototype, 'moveStraight') ? Game_Player.prototype.moveStraight : null;
        Game_Player.prototype.moveStraight = function(d) {
            if (!this.isTransferring || !this.isTransferring()) {
                const edge = !(this.canPass && this.canPass(this.x, this.y, d)) && S.stepFrom(this, d);
                if (edge) return;
            }
            return own ? own.apply(this, arguments) : Game_Character.prototype.moveStraight.apply(this, arguments);
        };
    }
    if (typeof Game_Map !== 'undefined') {
        const setup = Game_Map.prototype.setup;
        Game_Map.prototype.setup = function(mapId) {
            const result = setup.apply(this, arguments);
            if (this === window.$gameMap && S.enabled(mapId)) S.preload(mapId);
            return result;
        };
        // The camera may look past an edge with a neighbour, up to half a screen (the player at the edge, centred).
        const limits = map => {
            const links = S.enabled(map.mapId()) ? S.links(map.mapId()) : {};
            const sx = map.screenTileX(), sy = map.screenTileY();
            return {
                minX: links.west && !map.isLoopHorizontal() ? -sx / 2 : 0, maxX: Math.max(0, map.width() - sx) + (links.east && !map.isLoopHorizontal() ? sx / 2 : 0),
                minY: links.north && !map.isLoopVertical() ? -sy / 2 : 0, maxY: Math.max(0, map.height() - sy) + (links.south && !map.isLoopVertical() ? sy / 2 : 0),
                any: Boolean(links.east || links.west || links.north || links.south)
            };
        };
        const wrap = (name, axis, sign) => {
            const original = Game_Map.prototype[name];
            if (typeof original !== 'function') return;
            Game_Map.prototype[name] = function(distance) {
                const loop = axis === 'x' ? this.isLoopHorizontal() : this.isLoopVertical();
                const l = loop ? null : limits(this);
                if (!l || !l.any) return original.apply(this, arguments);
                const key = axis === 'x' ? '_displayX' : '_displayY', par = axis === 'x' ? '_parallaxX' : '_parallaxY';
                const last = this[key];
                this[key] = Math.max(axis === 'x' ? l.minX : l.minY, Math.min(axis === 'x' ? l.maxX : l.maxY, this[key] + sign * distance));
                if (this[par] !== undefined) this[par] += this[key] - last;
            };
        };
        wrap('scrollRight', 'x', 1); wrap('scrollLeft', 'x', -1); wrap('scrollDown', 'y', 1); wrap('scrollUp', 'y', -1);
        const setPos = Game_Map.prototype.setDisplayPos;
        Game_Map.prototype.setDisplayPos = function(x, y) {
            const result = setPos.apply(this, arguments);
            const l = limits(this);
            if (!l.any) return result;
            // After a seamless step the camera picks up where it was, shifted by the maps' places.
            const carry = S._carry && S._carry.mapId === this.mapId() ? S._carry : null;
            const wantX = carry ? carry.displayX : x, wantY = carry ? carry.displayY : y;
            if (!this.isLoopHorizontal()) this._displayX = Math.max(l.minX, Math.min(l.maxX, wantX));
            if (!this.isLoopVertical()) this._displayY = Math.max(l.minY, Math.min(l.maxY, wantY));
            if (carry) S._carry = null;
            return result;
        };
    }
})();
