//==========================================================
// SECTION 19C: ROOM STAMPS
//==========================================================
// A rectangle of map saved as a stamp: its tiles (all six layers: four tile layers, shadows and
// regions), the doodads standing in it and the events on it, to place again here or on another map.
// Stamps are kept in data/DocsDoodadsRooms.json. Tiles are MZ's map data (index (z * h + y) * w + x).
DocsDoodads.Rooms = {
    filePath: 'data/DocsDoodadsRooms.json',
    layers: 6,
    list: [],
    loaded: false,

    load() {
        const data = DocsDoodads.FS.readJson(this.filePath);
        this.list = data && Array.isArray(data.rooms) ? data.rooms : [];
        this.loaded = true;
        return this.list;
    },

    ensureLoaded() {
        if (!this.loaded) this.load();
        return this.list;
    },

    save() {
        return DocsDoodads.FS.atomicWriteJson(this.filePath, { version: 1, rooms: this.ensureLoaded() });
    },

    get(id) {
        return this.ensureLoaded().find(r => r.id === id) || null;
    },

    add(room) {
        this.ensureLoaded().push(room);
        return room;
    },

    remove(id) {
        const i = this.ensureLoaded().findIndex(r => r.id === id);
        if (i >= 0) this.list.splice(i, 1);
        return i >= 0;
    },

    index(w, h, x, y, z) {
        return (z * h + y) * w + x;
    },

    // The rectangle between two tiles, inside the map.
    rectBetween(a, b, mapW, mapH) {
        const x0 = Math.max(0, Math.min(a.x, b.x)), y0 = Math.max(0, Math.min(a.y, b.y));
        const x1 = Math.min(mapW - 1, Math.max(a.x, b.x)), y1 = Math.min(mapH - 1, Math.max(a.y, b.y));
        return { x: x0, y: y0, w: Math.max(0, x1 - x0 + 1), h: Math.max(0, y1 - y0 + 1) };
    },

    // map: { width, height, data }; rect in tiles; doodads (pixels) and events (tiles) of the map.
    capture(name, map, rect, doodads, events, tw = 48, th = 48) {
        const W = Number(map.width) || 0, H = Number(map.height) || 0;
        const tiles = new Array(rect.w * rect.h * this.layers).fill(0);
        for (let z = 0; z < this.layers; z++) {
            for (let y = 0; y < rect.h; y++) {
                for (let x = 0; x < rect.w; x++) {
                    tiles[this.index(rect.w, rect.h, x, y, z)] = Number(map.data[this.index(W, H, rect.x + x, rect.y + y, z)]) || 0;
                }
            }
        }
        const left = rect.x * tw, top = rect.y * th, right = (rect.x + rect.w) * tw, bottom = (rect.y + rect.h) * th;
        // A doodad belongs to the room when it stands in it (its anchor point, at its foot).
        const inside = (doodads || []).filter(d => d && d.x >= left && d.x < right && d.y > top && d.y <= bottom && !d.mirrorOf);
        return {
            id: DocsDoodads.Prefabs.newId('room_'),
            name: String(name || 'Room').trim() || 'Room',
            createdAt: Date.now(),
            w: rect.w, h: rect.h, tileWidth: tw, tileHeight: th,
            tiles,
            doodads: inside.map(d => Object.assign(DocsDoodads.Prefabs.cleanDoodad(d), { x: d.x - left, y: d.y - top })),
            events: (events || []).filter(e => e && e.x >= rect.x && e.x < rect.x + rect.w && e.y >= rect.y && e.y < rect.y + rect.h)
                .map(e => Object.assign(JSON.parse(JSON.stringify(e)), { dx: e.x - rect.x, dy: e.y - rect.y }))
        };
    },

    // What placing the room with its top-left on tile (at.x, at.y) does. options: { tiles, doodads, events
    // (each on unless false), keepUnder (a tile layer the room leaves empty keeps the map's tile), tileWidth,
    // tileHeight, allocateEventId }. Returns { changes: [{ index, before, after }], doodads, events }; the
    // map is not changed here. Parts outside the map are left off.
    place(room, map, at, options = {}) {
        const W = Number(map.width) || 0, H = Number(map.height) || 0;
        const tw = options.tileWidth || 48, th = options.tileHeight || 48;
        const keepUnder = options.keepUnder !== false;
        const out = { changes: [], doodads: [], events: [] };
        const inMap = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
        if (options.tiles !== false) {
            for (let z = 0; z < this.layers; z++) {
                for (let y = 0; y < room.h; y++) {
                    for (let x = 0; x < room.w; x++) {
                        const mx = at.x + x, my = at.y + y;
                        if (!inMap(mx, my)) continue;
                        const after = Number(room.tiles[this.index(room.w, room.h, x, y, z)]) || 0;
                        // Empty upper layers and no region in the room leave the map's own.
                        if (keepUnder && after === 0 && z > 0) continue;
                        const index = this.index(W, H, mx, my, z);
                        const before = Number(map.data[index]) || 0;
                        if (before !== after) out.changes.push({ index, before, after });
                    }
                }
            }
        }
        // Doodads keep where they stood in the room; their size scales with a different tile size.
        const sx = tw / (room.tileWidth || tw), sy = th / (room.tileHeight || th);
        if (options.doodads !== false) {
            const groupId = 'grp_' + DocsDoodads.Prefabs.newId('rm_');
            for (const src of room.doodads || []) {
                const d = JSON.parse(JSON.stringify(src));
                d.x = Math.round(at.x * tw + src.x * sx);
                d.y = Math.round(at.y * th + src.y * sy);
                if (!inMap(Math.floor(d.x / tw), Math.floor((d.y - 1) / th))) continue;
                if ((room.doodads || []).length > 1) d.groupId = groupId;
                out.doodads.push(d);
            }
        }
        if (options.events !== false) {
            for (const src of room.events || []) {
                const x = at.x + src.dx, y = at.y + src.dy;
                if (!inMap(x, y)) continue;
                const e = JSON.parse(JSON.stringify(src));
                delete e.dx;
                delete e.dy;
                e.x = x;
                e.y = y;
                e.id = options.allocateEventId ? options.allocateEventId(e) : null;
                out.events.push(e);
            }
        }
        return out;
    },

    summary(room) {
        const n = (room.doodads || []).length, e = (room.events || []).length;
        return `${room.w} x ${room.h} tiles` + (n ? `, ${n} doodad${n === 1 ? '' : 's'}` : '') + (e ? `, ${e} event${e === 1 ? '' : 's'}` : '');
    }
};
