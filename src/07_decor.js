//==========================================================
// SECTION 5D: DECORATE MODE FOR PLAYERS (8.4.1)
//==========================================================
// In the finished game the player places and moves pieces the maker chose, where the maker allows, kept in the save.
// Project: $dataDocsDoodads.decor = { catalog: [{ id, name, doodad, w, h, price, limit, itemId, tags }],
//   zones: { [mapId]: { regions: '7 8', boxes: [{ x, y, w, h }] } } }. A catalog piece's `doodad` is a doodad
//   without a place (its picture, light, states, collision); w × h is the tiles it covers.
// Save: $gameSystem._docsDecor = { maps: { [mapId]: [{ uid, item, x, y, flip, state }] }, bag: { [item]: count } }.
//   Ids and numbers only. A piece whose catalog entry or zone has gone is handed back to the bag, with a warning.
// Pieces become doodads (temp, never written to the project) each time a map's spriteset is made.
DocsDoodads.Decor = {
    maxPieces: 400,

    // ---- The maker's data ----
    data() {
        const data = typeof window !== 'undefined' && window.$dataDocsDoodads;
        const d = data && data.decor && typeof data.decor === 'object' ? data.decor : {};
        return { catalog: Array.isArray(d.catalog) ? d.catalog : [], zones: d.zones && typeof d.zones === 'object' ? d.zones : {} };
    },

    cleanItem(item) {
        if (!item || typeof item !== 'object') return null;
        const id = String(item.id || '').replace(/[^\w-]/g, '').slice(0, 40);
        if (!id || !item.doodad || !item.doodad.bit) return null;
        const int = (v, lo, hi, d) => { const n = Math.floor(Number(v)); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : d; };
        return { id, name: String(item.name || id).slice(0, 60), doodad: item.doodad, w: int(item.w, 1, 8, 1), h: int(item.h, 1, 8, 1),
            price: int(item.price, 0, 9999999, 0), limit: int(item.limit, 0, 999, 0), itemId: int(item.itemId, 0, 9999, 0),
            free: Boolean(item.free), tags: Array.isArray(item.tags) ? item.tags.map(String).slice(0, 12) : [] };
    },

    catalog() { return this.data().catalog.map(i => this.cleanItem(i)).filter(Boolean); },
    item(id) { return this.catalog().find(i => i.id === id) || null; },

    zonesFor(mapId) {
        const z = this.data().zones[mapId];
        if (!z) return null;
        const regions = new Set(String(z.regions || '').split(/[\s,;]+/).map(n => parseInt(n, 10)).filter(n => n > 0));
        const boxes = (Array.isArray(z.boxes) ? z.boxes : []).map(b => ({ x: Math.floor(Number(b.x) || 0), y: Math.floor(Number(b.y) || 0), w: Math.max(1, Math.floor(Number(b.w) || 1)), h: Math.max(1, Math.floor(Number(b.h) || 1)) }));
        return regions.size || boxes.length ? { regions, boxes } : null;
    },

    inZone(zones, x, y, regionAt) {
        if (!zones) return false;
        if (zones.regions.size && zones.regions.has(Number(regionAt(x, y)) || 0)) return true;
        return zones.boxes.some(b => x >= b.x && y >= b.y && x < b.x + b.w && y < b.y + b.h);
    },

    // The tiles a piece covers when its base-left tile is (x, y): w across, h up from the base row.
    footprint(item, x, y) {
        const out = [];
        for (let dy = 0; dy < item.h; dy++) for (let dx = 0; dx < item.w; dx++) out.push({ x: x + dx, y: y - dy });
        return out;
    },

    snap(px, py, tw, th) { return { x: Math.floor(Number(px) / tw), y: Math.floor(Number(py) / th) }; },

    // A 4-way flood from start over passable(x, y): a Uint8Array of reached tiles.
    reach(start, w, h, passable) {
        const seen = new Uint8Array(w * h);
        if (!start || start.x < 0 || start.y < 0 || start.x >= w || start.y >= h) return seen;
        const queue = [start.y * w + start.x];
        seen[queue[0]] = 1;
        for (let q = 0; q < queue.length; q++) {
            const x = queue[q] % w, y = Math.floor(queue[q] / w);
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const nx = x + dx, ny = y + dy;
                if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
                const k = ny * w + nx;
                if (seen[k] || !passable(nx, ny)) continue;
                seen[k] = 1; queue.push(k);
            }
        }
        return seen;
    },

    // ctx: { zones, regionAt, w, h, passable(x, y) (the map, without pieces), placed: [{ x, y, item }] (other pieces,
    // resolved), start: the player's tile, exits: [{ x, y }] (doors, stairs) }. → { ok, reason }.
    canPlace(item, x, y, ctx) {
        if (!item) return { ok: false, reason: 'missing' };
        const tiles = this.footprint(item, x, y);
        for (const t of tiles) {
            if (t.x < 0 || t.y < 0 || t.x >= ctx.w || t.y >= ctx.h) return { ok: false, reason: 'edge' };
            if (!this.inZone(ctx.zones, t.x, t.y, ctx.regionAt)) return { ok: false, reason: 'zone' };
            if (!ctx.passable(t.x, t.y)) return { ok: false, reason: 'blocked' };
            if (ctx.start && t.x === ctx.start.x && t.y === ctx.start.y) return { ok: false, reason: 'player' };
        }
        const taken = new Set();
        for (const p of ctx.placed || []) for (const t of this.footprint(p.item, p.x, p.y)) taken.add(t.x + ',' + t.y);
        if (tiles.some(t => taken.has(t.x + ',' + t.y))) return { ok: false, reason: 'piece' };
        // Not walling anyone in: every exit the player can reach now stays reachable.
        if (ctx.start && ctx.exits && ctx.exits.length) {
            const without = (px, py) => ctx.passable(px, py) && !taken.has(px + ',' + py);
            const mine = new Set(tiles.map(t => t.x + ',' + t.y));
            const before = this.reach(ctx.start, ctx.w, ctx.h, without);
            const after = this.reach(ctx.start, ctx.w, ctx.h, (px, py) => without(px, py) && !mine.has(px + ',' + py));
            const near = (seen, e) => [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
                const nx = e.x + dx, ny = e.y + dy;
                return nx >= 0 && ny >= 0 && nx < ctx.w && ny < ctx.h && seen[ny * ctx.w + nx];
            });
            if (ctx.exits.some(e => near(before, e) && !near(after, e))) return { ok: false, reason: 'wallsIn' };
        }
        return { ok: true, reason: '' };
    },

    reasons: { missing: 'That piece is not in the catalog.', edge: 'Off the edge.', zone: 'Pieces can only go in the marked area.', blocked: 'Something is already there.',
        player: 'You are standing there.', piece: 'Another piece is there.', wallsIn: 'That would block the way out.', none: 'You have none of those left.' },

    // ---- The save ----
    store(write = true) {
        if (typeof $gameSystem === 'undefined' || !$gameSystem) return { maps: {}, bag: {} };
        if (!write && !$gameSystem._docsDecor) return { maps: {}, bag: {} };
        const s = $gameSystem._docsDecor = $gameSystem._docsDecor || {};
        s.maps = s.maps || {}; s.bag = s.bag || {};
        return s;
    },

    pieces(mapId) { return (this.store(false).maps[mapId] || []).slice(); },

    placedCount(itemId) {
        let n = 0;
        for (const list of Object.values(this.store(false).maps)) for (const p of list || []) if (p.item === itemId) n++;
        return n;
    },

    // How many more of a piece the player may place: its limit, and what they hold (the bag, or a party item).
    left(item) {
        if (!item) return 0;
        const placed = this.placedCount(item.id);
        const byLimit = item.limit > 0 ? Math.max(0, item.limit - placed) : Infinity;
        let held;
        if (item.itemId > 0) held = typeof $gameParty !== 'undefined' && $gameParty && typeof $dataItems !== 'undefined' && $dataItems ? $gameParty.numItems($dataItems[item.itemId]) : 0;
        else if (item.free) held = Infinity;
        else held = Number(this.store(false).bag[item.id]) || 0;
        const n = Math.min(byLimit, held);
        return n === Infinity ? 999 : n;
    },

    give(itemId, count) {
        const s = this.store(true);
        s.bag[itemId] = Math.max(0, (Number(s.bag[itemId]) || 0) + Math.floor(Number(count) || 0));
        if (!s.bag[itemId]) delete s.bag[itemId];
        return s.bag[itemId] || 0;
    },

    take(item) {
        if (item.itemId > 0) { if (typeof $gameParty !== 'undefined' && $gameParty && $dataItems) $gameParty.loseItem($dataItems[item.itemId], 1); return; }
        if (!item.free) this.give(item.id, -1);
    },

    handBack(item) {
        if (!item) return;
        if (item.itemId > 0) { if (typeof $gameParty !== 'undefined' && $gameParty && $dataItems) $gameParty.gainItem($dataItems[item.itemId], 1); return; }
        if (!item.free) this.give(item.id, 1);
    },

    newUid() { return 'decor_' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36); },

    add(mapId, itemId, x, y, flip) {
        const s = this.store(true), list = s.maps[mapId] = s.maps[mapId] || [];
        if (list.length >= this.maxPieces) return null;
        const piece = { uid: this.newUid(), item: itemId, x: Math.floor(x), y: Math.floor(y) };
        if (flip) piece.flip = true;
        list.push(piece);
        return piece;
    },

    move(mapId, uid, x, y, flip) {
        const p = (this.store(true).maps[mapId] || []).find(q => q.uid === uid);
        if (!p) return null;
        p.x = Math.floor(x); p.y = Math.floor(y);
        if (flip) p.flip = true; else delete p.flip;
        return p;
    },

    remove(mapId, uid) {
        const s = this.store(true), list = s.maps[mapId] || [];
        const i = list.findIndex(q => q.uid === uid);
        if (i < 0) return null;
        const [p] = list.splice(i, 1);
        if (!list.length) delete s.maps[mapId];
        return p;
    },

    // Old saves after the maker changed the catalog or the zones: keep what still fits, hand back the rest.
    // fits(item, piece) checks the zone. Returns the pieces handed back.
    tidy(mapId, fits) {
        const s = this.store(false), list = s.maps[mapId];
        if (!list || !list.length) return [];
        const gone = [];
        s.maps[mapId] = list.filter(p => {
            const item = this.item(p.item);
            if (item && (!fits || fits(item, p))) return true;
            gone.push(p);
            if (item) this.handBack(item);
            else if (typeof console !== 'undefined') console.warn(`[DocsDoodads] Decor piece "${p.item}" is no longer in the catalog; it was taken off map ${mapId}.`);
            return false;
        });
        if (!s.maps[mapId].length) delete s.maps[mapId];
        return gone;
    },

    // A placed piece as a doodad: the catalog's doodad at the piece's tile, standing on its base row.
    doodadFor(piece, item, tw, th) {
        const d = JSON.parse(JSON.stringify(item.doodad));
        d.x = piece.x * tw + (item.w * tw) / 2;
        d.y = piece.y * th + th;
        d.uid = piece.uid;
        d.temp = true;
        d.decor = piece.uid;
        if (piece.flip) d.scaleX = -Math.abs(Number(d.scaleX) || 1);
        if (!d.name) d.name = '';
        return d;
    },

    // The map's list of doodads with this save's pieces in it (the old pieces taken out first).
    sync(mapId) {
        const data = typeof window !== 'undefined' && window.$dataDocsDoodads;
        if (!data || !mapId) return 0;
        const list = Array.isArray(data[mapId]) ? data[mapId].filter(d => !(d && d.decor)) : [];
        const zones = this.zonesFor(mapId);
        const regionAt = (x, y) => (typeof $gameMap !== 'undefined' && $gameMap && $gameMap.mapId() === mapId ? $gameMap.regionId(x, y) : 0);
        this.tidy(mapId, zones ? (item, p) => this.footprint(item, p.x, p.y).every(t => this.inZone(zones, t.x, t.y, regionAt)) : () => false);
        const tw = typeof $gameMap !== 'undefined' && $gameMap ? $gameMap.tileWidth() : 48, th = typeof $gameMap !== 'undefined' && $gameMap ? $gameMap.tileHeight() : 48;
        let n = 0;
        for (const p of this.pieces(mapId)) {
            const item = this.item(p.item);
            if (!item) continue;
            list.push(this.doodadFor(p, item, tw, th));
            n++;
        }
        if (list.length || data[mapId]) data[mapId] = list;
        if (DocsDoodads.Collision && DocsDoodads.Collision.invalidate) DocsDoodads.Collision.invalidate();
        return n;
    }
};

// The pieces go in when a map is set up (a transfer, a new game) and when a save is loaded, before its spriteset.
if (typeof Game_Map !== 'undefined') {
    const setup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        const result = setup.apply(this, arguments);
        if (this === window.$gameMap && !(DocsDoodads.Workspace && DocsDoodads.Workspace.mounted)) {
            try { DocsDoodads.Decor.sync(mapId); } catch (error) { DocsDoodads.Core.log('Decor pieces could not be placed.', error); }
        }
        return result;
    };
}
if (typeof DataManager !== 'undefined' && typeof DataManager.extractSaveContents === 'function') {
    const extract = DataManager.extractSaveContents;
    DataManager.extractSaveContents = function() {
        const result = extract.apply(this, arguments);
        if (window.$gameMap && $gameMap.mapId && $gameMap.mapId() > 0) {
            try { DocsDoodads.Decor.sync($gameMap.mapId()); } catch (error) { DocsDoodads.Core.log('Decor pieces could not be placed.', error); }
        }
        return result;
    };
}
if (typeof Spriteset_Map !== 'undefined') {
    const init = Spriteset_Map.prototype.initialize;
    Spriteset_Map.prototype.initialize = function() {
        if (typeof $gameMap !== 'undefined' && $gameMap && $gameMap.mapId && !(DocsDoodads.Workspace && DocsDoodads.Workspace.mounted)) {
            try { DocsDoodads.Decor.sync($gameMap.mapId()); } catch (error) { DocsDoodads.Core.log('Decor pieces could not be placed.', error); }
        }
        return init.apply(this, arguments);
    };
}

if (typeof PluginManager !== 'undefined' && typeof PluginManager.registerCommand === 'function') {
    PluginManager.registerCommand(pluginName, 'openDecorate', () => { if (DocsDoodads.DecorMode) DocsDoodads.DecorMode.open(); });
    PluginManager.registerCommand(pluginName, 'giveDecor', args => DocsDoodads.Decor.give(String(args.item || ''), Number(args.count) || 1));
    PluginManager.registerCommand(pluginName, 'countDecor', args => {
        const D = DocsDoodads.Decor, id = String(args.item || ''), v = Number(args.variableId) || 0;
        const n = String(args.what) === 'held' ? D.left(D.item(id)) : D.placedCount(id);
        if (v > 0 && typeof $gameVariables !== 'undefined') $gameVariables.setValue(v, n);
    });
}
