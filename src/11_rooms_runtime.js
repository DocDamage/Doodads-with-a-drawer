//==========================================================
// SECTION 4H: ROOM STAMPS (GAME-SAFE CORE)
//==========================================================
DocsDoodads.Rooms = {
    layers: 6, list: [], loaded: false,

    sideName(value) {
        const key = String(value || '').trim().toLowerCase();
        return { n: 'north', north: 'north', e: 'east', east: 'east', s: 'south', south: 'south', w: 'west', west: 'west' }[key] || '';
    },
    normalizeDoor(door, w, h) {
        const side = this.sideName(door && door.side), x = Math.floor(Number(door && door.x)), y = Math.floor(Number(door && door.y));
        if (!side || !Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= w || y >= h) return null;
        if ((side === 'north' && y !== 0) || (side === 'south' && y !== h - 1)
            || (side === 'west' && x !== 0) || (side === 'east' && x !== w - 1)) return null;
        return { x, y, side };
    },
    parseDoors(text, w, h) {
        const out = [], seen = new Set();
        for (const part of String(text || '').split(/[,;\n]+/)) {
            const match = /^\s*(north|east|south|west|n|e|s|w)\s*[:=]?\s*(\d+)\s*$/i.exec(part);
            if (!match) continue;
            const side = this.sideName(match[1]), along = Number(match[2]);
            const door = this.normalizeDoor(side === 'north' ? { x: along, y: 0, side }
                : side === 'south' ? { x: along, y: h - 1, side }
                    : side === 'west' ? { x: 0, y: along, side } : { x: w - 1, y: along, side }, w, h);
            const key = door && `${door.x},${door.y},${door.side}`;
            if (door && !seen.has(key)) { seen.add(key); out.push(door); }
        }
        return out;
    },
    formatDoors(doors) {
        const initial = { north: 'N', east: 'E', south: 'S', west: 'W' };
        const order = { north: 0, east: 1, south: 2, west: 3 };
        return (doors || []).slice().sort((a, b) => order[a.side] - order[b.side]
            || (a.side === 'north' || a.side === 'south' ? a.x - b.x : a.y - b.y))
            .map(door => initial[door.side] + (door.side === 'north' || door.side === 'south' ? door.x : door.y)).join(', ');
    },
    index(w, h, x, y, z) { return (z * h + y) * w + x; },
    rectBetween(a, b, mapW, mapH) {
        const x0 = Math.max(0, Math.min(a.x, b.x)), y0 = Math.max(0, Math.min(a.y, b.y));
        const x1 = Math.min(mapW - 1, Math.max(a.x, b.x)), y1 = Math.min(mapH - 1, Math.max(a.y, b.y));
        return { x: x0, y: y0, w: Math.max(0, x1 - x0 + 1), h: Math.max(0, y1 - y0 + 1) };
    },
    place(room, map, at, options = {}) {
        const W = Number(map.width) || 0, H = Number(map.height) || 0;
        const tw = options.tileWidth || 48, th = options.tileHeight || 48, keepUnder = options.keepUnder !== false;
        const out = { changes: [], doodads: [], events: [] }, inMap = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
        if (options.tiles !== false) for (let z = 0; z < this.layers; z++) for (let y = 0; y < room.h; y++) for (let x = 0; x < room.w; x++) {
            const mx = at.x + x, my = at.y + y;
            if (!inMap(mx, my)) continue;
            const after = Number((room.tiles || [])[this.index(room.w, room.h, x, y, z)]) || 0;
            if (keepUnder && after === 0 && z > 0) continue;
            const index = this.index(W, H, mx, my, z), before = Number(map.data[index]) || 0;
            if (before !== after) out.changes.push({ index, before, after });
        }
        const sx = tw / (room.tileWidth || tw), sy = th / (room.tileHeight || th), groupId = options.groupId || null;
        if (options.doodads !== false) for (const source of room.doodads || []) {
            const doodad = JSON.parse(JSON.stringify(source));
            doodad.x = Math.round(at.x * tw + source.x * sx); doodad.y = Math.round(at.y * th + source.y * sy);
            if (groupId && (room.doodads || []).length > 1) doodad.groupId = groupId;
            if (inMap(Math.floor(doodad.x / tw), Math.floor((doodad.y - 1) / th))) out.doodads.push(doodad);
        }
        if (options.events !== false) for (const source of room.events || []) {
            const x = at.x + source.dx, y = at.y + source.dy;
            if (!inMap(x, y)) continue;
            const event = JSON.parse(JSON.stringify(source));
            delete event.dx; delete event.dy; event.x = x; event.y = y;
            event.id = options.allocateEventId ? options.allocateEventId(event) : null; out.events.push(event);
        }
        return out;
    },
    summary(room) {
        const n = (room.doodads || []).length, e = (room.events || []).length, d = (room.doors || []).length;
        return `${room.w} x ${room.h} tiles` + (d ? `, ${d} opening${d === 1 ? '' : 's'}` : '')
            + (n ? `, ${n} doodad${n === 1 ? '' : 's'}` : '') + (e ? `, ${e} event${e === 1 ? '' : 's'}` : '');
    }
};
