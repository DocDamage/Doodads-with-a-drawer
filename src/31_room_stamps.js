// @editor-only
//==========================================================
// SECTION 19C: ROOM STAMPS (EDITOR STORAGE AND CAPTURE)
//==========================================================
Object.assign(DocsDoodads.Rooms, {
    filePath: 'data/DocsDoodadsRooms.json',
    load() {
        const data = DocsDoodads.FS.readJson(this.filePath);
        this.list = data && Array.isArray(data.rooms) ? data.rooms : [];
        this.loaded = true;
        return this.list;
    },
    ensureLoaded() { if (!this.loaded) this.load(); return this.list; },
    save() { return DocsDoodads.FS.atomicWriteJson(this.filePath, { version: 2, rooms: this.ensureLoaded() }); },
    get(id) { return this.ensureLoaded().find(room => room.id === id) || null; },
    add(room) { this.ensureLoaded().push(room); return room; },
    remove(id) {
        const index = this.ensureLoaded().findIndex(room => room.id === id);
        if (index >= 0) this.list.splice(index, 1);
        return index >= 0;
    },
    capture(name, map, rect, doodads, events, tw = 48, th = 48, doors = []) {
        const W = Number(map.width) || 0, H = Number(map.height) || 0;
        const tiles = new Array(rect.w * rect.h * this.layers).fill(0);
        for (let z = 0; z < this.layers; z++) for (let y = 0; y < rect.h; y++) for (let x = 0; x < rect.w; x++) {
            tiles[this.index(rect.w, rect.h, x, y, z)] = Number(map.data[this.index(W, H, rect.x + x, rect.y + y, z)]) || 0;
        }
        const left = rect.x * tw, top = rect.y * th, right = (rect.x + rect.w) * tw, bottom = (rect.y + rect.h) * th;
        const inside = (doodads || []).filter(doodad => doodad && doodad.x >= left && doodad.x < right && doodad.y > top && doodad.y <= bottom && !doodad.mirrorOf);
        return {
            id: DocsDoodads.Prefabs.newId('room_'), name: String(name || 'Room').trim() || 'Room', createdAt: Date.now(),
            w: rect.w, h: rect.h, tileWidth: tw, tileHeight: th, tiles,
            doors: (doors || []).map(door => this.normalizeDoor(door, rect.w, rect.h)).filter(Boolean),
            doodads: inside.map(doodad => Object.assign(DocsDoodads.Prefabs.cleanDoodad(doodad), { x: doodad.x - left, y: doodad.y - top })),
            events: (events || []).filter(event => event && event.x >= rect.x && event.x < rect.x + rect.w && event.y >= rect.y && event.y < rect.y + rect.h)
                .map(event => Object.assign(JSON.parse(JSON.stringify(event)), { dx: event.x - rect.x, dy: event.y - rect.y }))
        };
    }
});
