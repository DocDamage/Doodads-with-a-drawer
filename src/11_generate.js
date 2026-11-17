//==========================================================
// SECTION 4G: SEEDED MAP GENERATION
//==========================================================
// Pure layouts shared by the editor and game. A seed is resolved once, then the same small PRNG is passed
// through every choice; generated maps never depend on Math.random or on frame timing.
DocsDoodads.Generate = {
    minSide: 8,
    maxSide: 256,
    maxCells: 65536,
    maxRooms: 64,
    sides: ['north', 'east', 'south', 'west'],

    seed(value) {
        if (typeof value === 'number' && isFinite(value)) return Math.floor(value) >>> 0;
        const text = String(value === undefined || value === null ? '' : value);
        let hash = 2166136261;
        for (let i = 0; i < text.length; i++) {
            hash ^= text.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        return hash >>> 0;
    },

    rng(seed) {
        let state = this.seed(seed);
        return function() {
            state = (state + 0x6d2b79f5) >>> 0;
            let value = state;
            value = Math.imul(value ^ value >>> 15, value | 1);
            value ^= value + Math.imul(value ^ value >>> 7, value | 61);
            return ((value ^ value >>> 14) >>> 0) / 4294967296;
        };
    },

    dimensions(spec) {
        const w = Math.floor(Number(spec && spec.w));
        const h = Math.floor(Number(spec && spec.h));
        if (!Number.isInteger(w) || !Number.isInteger(h) || w < this.minSide || h < this.minSide
            || w > this.maxSide || h > this.maxSide || w * h > this.maxCells) {
            throw new Error(`Generated map size must be ${this.minSide}-${this.maxSide} tiles per side and at most ${this.maxCells} tiles.`);
        }
        return { w, h };
    },

    int(rng, min, max) {
        min = Math.ceil(min); max = Math.floor(max);
        return max <= min ? min : min + Math.floor(rng() * (max - min + 1));
    },

    opposite(side) {
        return { north: 'south', south: 'north', east: 'west', west: 'east' }[side] || '';
    },

    normalizeDoor(door, w, h) {
        if (!door || !this.sides.includes(door.side)) return null;
        const x = Math.floor(Number(door.x)), y = Math.floor(Number(door.y));
        if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= w || y >= h) return null;
        if (door.side === 'north' && y !== 0 || door.side === 'south' && y !== h - 1
            || door.side === 'west' && x !== 0 || door.side === 'east' && x !== w - 1) return null;
        return { x, y, side: door.side };
    },

    normalizeRoom(room) {
        if (!room) return null;
        const w = Math.floor(Number(room.w)), h = Math.floor(Number(room.h));
        if (w < 3 || h < 3 || w > 64 || h > 64) return null;
        const seen = new Set(), doors = [];
        for (const raw of room.doors || []) {
            const door = this.normalizeDoor(raw, w, h);
            const key = door && `${door.x},${door.y},${door.side}`;
            if (door && !seen.has(key)) { seen.add(key); doors.push(door); }
        }
        return { id: String(room.id || ''), name: String(room.name || room.id || 'Room'), w, h, doors };
    },

    splitLeaves(w, h, count, candidates, rng) {
        const widest = candidates.length ? Math.max(...candidates.map(room => room.w)) : 3;
        const tallest = candidates.length ? Math.max(...candidates.map(room => room.h)) : 3;
        const minW = Math.max(3, widest), minH = Math.max(3, tallest);
        const leaves = [{ x: 1, y: 1, w: w - 2, h: h - 2 }];
        while (leaves.length < count) {
            let pick = -1, score = -1;
            for (let i = 0; i < leaves.length; i++) {
                const leaf = leaves[i], canV = leaf.w >= minW * 2, canH = leaf.h >= minH * 2;
                if (!canV && !canH) continue;
                const value = leaf.w * leaf.h;
                if (value > score) { score = value; pick = i; }
            }
            if (pick < 0) break;
            const leaf = leaves.splice(pick, 1)[0];
            const canV = leaf.w >= minW * 2, canH = leaf.h >= minH * 2;
            const vertical = canV && (!canH || leaf.w / Math.max(1, leaf.h) > 1.2 || leaf.w / Math.max(1, leaf.h) >= 0.8 && rng() < 0.5);
            if (vertical) {
                const cut = this.int(rng, minW, leaf.w - minW);
                leaves.push({ x: leaf.x, y: leaf.y, w: cut, h: leaf.h }, { x: leaf.x + cut, y: leaf.y, w: leaf.w - cut, h: leaf.h });
            } else {
                const cut = this.int(rng, minH, leaf.h - minH);
                leaves.push({ x: leaf.x, y: leaf.y, w: leaf.w, h: cut }, { x: leaf.x, y: leaf.y + cut, w: leaf.w, h: leaf.h - cut });
            }
        }
        return leaves;
    },

    doorAt(room, side, toward) {
        if (side === 'east') return { x: room.x + room.w - 1, y: room.y + Math.max(1, Math.min(room.h - 2, toward.y - room.y)), side };
        if (side === 'west') return { x: room.x, y: room.y + Math.max(1, Math.min(room.h - 2, toward.y - room.y)), side };
        if (side === 'south') return { x: room.x + Math.max(1, Math.min(room.w - 2, toward.x - room.x)), y: room.y + room.h - 1, side };
        return { x: room.x + Math.max(1, Math.min(room.w - 2, toward.x - room.x)), y: room.y, side: 'north' };
    },

    doorPair(a, b) {
        const pairs = [];
        for (const da of a.doors || []) for (const db of b.doors || []) {
            if (this.opposite(da.side) !== db.side) continue;
            const one = Object.assign({ room: a.index }, da), two = Object.assign({ room: b.index }, db);
            pairs.push({ one, two, distance: Math.abs(one.x - two.x) + Math.abs(one.y - two.y) });
        }
        pairs.sort((x, y) => x.distance - y.distance || x.one.y - y.one.y || x.one.x - y.one.x || x.two.y - y.two.y || x.two.x - y.two.x);
        if (pairs.length) return pairs[0];
        if (a.templateId || b.templateId) return null;
        const dx = b.cx - a.cx, dy = b.cy - a.cy;
        let side;
        if (Math.abs(dx) >= Math.abs(dy)) side = dx >= 0 ? 'east' : 'west';
        else side = dy >= 0 ? 'south' : 'north';
        return { one: Object.assign({ room: a.index }, this.doorAt(a, side, b)),
            two: Object.assign({ room: b.index }, this.doorAt(b, this.opposite(side), a)) };
    },

    corridor(from, to, rng) {
        const out = [{ x: from.x, y: from.y }];
        let x = from.x, y = from.y;
        const horizontalFirst = rng() < 0.5;
        const stepX = () => { while (x !== to.x) { x += x < to.x ? 1 : -1; out.push({ x, y }); } };
        const stepY = () => { while (y !== to.y) { y += y < to.y ? 1 : -1; out.push({ x, y }); } };
        if (horizontalFirst) { stepX(); stepY(); } else { stepY(); stepX(); }
        return out;
    },

    dungeon(spec = {}) {
        const { w, h } = this.dimensions(spec), seed = this.seed(spec.seed), rng = this.rng(seed);
        const candidates = (Array.isArray(spec.rooms) ? spec.rooms : []).map(room => this.normalizeRoom(room)).filter(Boolean);
        const asked = Array.isArray(spec.rooms) ? Number(spec.count) || Math.min(8, Math.max(1, Math.floor(w * h / 120))) : Number(spec.rooms || spec.count);
        const count = Math.max(1, Math.min(this.maxRooms, Math.floor(asked) || 6));
        if (candidates.length && count > 1 && candidates.every(room => room.doors.length === 0)) {
            throw new Error('Selected room stamps need edge door openings before they can be connected.');
        }
        const leaves = this.splitLeaves(w, h, count, candidates, rng);
        const rooms = [];
        for (const leaf of leaves) {
            const fitting = candidates.filter(room => room.w <= leaf.w && room.h <= leaf.h);
            if (candidates.length && !fitting.length) continue;
            const template = fitting.length ? fitting[this.int(rng, 0, fitting.length - 1)] : null;
            const rw = template ? template.w : this.int(rng, 3, Math.max(3, leaf.w - (leaf.w > 5 ? 1 : 0)));
            const rh = template ? template.h : this.int(rng, 3, Math.max(3, leaf.h - (leaf.h > 5 ? 1 : 0)));
            const x = this.int(rng, leaf.x, leaf.x + leaf.w - rw), y = this.int(rng, leaf.y, leaf.y + leaf.h - rh);
            const room = { index: rooms.length, x, y, w: rw, h: rh, cx: x + Math.floor(rw / 2), cy: y + Math.floor(rh / 2),
                templateId: template ? template.id : null, doors: [] };
            if (template) room.doors = template.doors.map(door => ({ x: x + door.x, y: y + door.y, side: door.side, room: room.index }));
            rooms.push(room);
        }
        if (!rooms.length) throw new Error('No selected room stamp fits inside this generated map size.');
        const floor = new Set(), corridors = [], doors = [];
        for (const room of rooms) for (let y = room.y; y < room.y + room.h; y++) for (let x = room.x; x < room.x + room.w; x++) floor.add(`${x},${y}`);
        for (let i = 1; i < rooms.length; i++) {
            const room = rooms[i];
            let nearest = rooms[0], distance = Infinity;
            for (let j = 0; j < i; j++) {
                const other = rooms[j], d = Math.abs(room.cx - other.cx) + Math.abs(room.cy - other.cy);
                if (d < distance) { distance = d; nearest = other; }
            }
            const pair = this.doorPair(nearest, room);
            if (!pair) throw new Error(`Room stamps ${nearest.templateId || nearest.index} and ${room.templateId || room.index} have no compatible facing doors.`);
            doors.push(pair.one, pair.two);
            const path = this.corridor(pair.one, pair.two, rng);
            corridors.push(path);
            for (const tile of path) floor.add(`${tile.x},${tile.y}`);
        }
        const entrance = { x: rooms[0].cx, y: rooms[0].cy };
        let far = rooms[0], farDistance = -1;
        for (const room of rooms) {
            const distance = Math.abs(room.cx - entrance.x) + Math.abs(room.cy - entrance.y);
            if (distance > farDistance) { far = room; farDistance = distance; }
        }
        const exit = { x: far.cx, y: far.cy };
        return { kind: 'dungeon', seed, w, h, rooms, corridors, doors, entrance, exit,
            floor: Array.from(floor, key => { const [x, y] = key.split(',').map(Number); return { x, y }; }).sort((a, b) => a.y - b.y || a.x - b.x) };
    },

    hash2(x, y, seed) {
        let value = Math.imul(x | 0, 0x1f123bb5) ^ Math.imul(y | 0, 0x5f356495) ^ seed;
        value = Math.imul(value ^ value >>> 16, 0x45d9f3b);
        value = Math.imul(value ^ value >>> 16, 0x45d9f3b);
        return ((value ^ value >>> 16) >>> 0) / 4294967295;
    },

    noise(x, y, seed) {
        const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
        const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
        const a = this.hash2(ix, iy, seed) * (1 - sx) + this.hash2(ix + 1, iy, seed) * sx;
        const b = this.hash2(ix, iy + 1, seed) * (1 - sx) + this.hash2(ix + 1, iy + 1, seed) * sx;
        return a * (1 - sy) + b * sy;
    },

    pathBetween(from, to, rng) {
        const out = [{ x: from.x, y: from.y }];
        let x = from.x, y = from.y;
        while (x !== to.x || y !== to.y) {
            const moveX = x !== to.x && (y === to.y || rng() < 0.5);
            if (moveX) x += x < to.x ? 1 : -1;
            else y += y < to.y ? 1 : -1;
            out.push({ x, y });
        }
        return out;
    },

    wilderness(spec = {}) {
        const { w, h } = this.dimensions(spec), seed = this.seed(spec.seed), rng = this.rng(seed ^ 0x9e3779b9);
        const biomes = (Array.isArray(spec.biomes) ? spec.biomes : []).map((biome, index) => typeof biome === 'string'
            ? { id: biome, weight: 1 } : { id: String(biome && biome.id || `biome${index + 1}`), weight: Math.max(0, Number(biome && biome.weight) || 0) }).filter(b => b.id && b.weight > 0);
        if (!biomes.length) throw new Error('Wilderness generation needs at least one biome.');
        const total = biomes.reduce((sum, b) => sum + b.weight, 0), scale = Math.max(2, Math.min(64, Number(spec.scale) || 8));
        const biomeIds = new Array(w * h);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
            const value = (this.noise(x / scale, y / scale, seed) * 0.65 + this.noise(x / (scale / 2), y / (scale / 2), seed ^ 0x85ebca6b) * 0.35) * total;
            let cursor = value, picked = biomes[biomes.length - 1].id;
            for (const biome of biomes) { cursor -= biome.weight; if (cursor <= 0) { picked = biome.id; break; } }
            biomeIds[y * w + x] = picked;
        }
        const rawPoints = Array.isArray(spec.points) && spec.points.length ? spec.points : [{ x: 1, y: Math.floor(h / 2) }, { x: w - 2, y: Math.floor(h / 2) }];
        const points = rawPoints.map(point => ({ x: Math.max(0, Math.min(w - 1, Math.floor(Number(point.x) || 0))),
            y: Math.max(0, Math.min(h - 1, Math.floor(Number(point.y) || 0))) }));
        const paths = [];
        for (let i = 1; i < points.length; i++) {
            const leg = this.pathBetween(points[i - 1], points[i], rng);
            paths.push(...(i > 1 ? leg.slice(1) : leg));
        }
        if (points.length === 1) paths.push(points[0]);
        return { kind: 'wilderness', seed, w, h, biomes, biomeIds, points, paths,
            entrance: Object.assign({}, points[0]), exit: Object.assign({}, points[points.length - 1]) };
    },

    list(value) {
        if (Array.isArray(value)) return value.map(String).map(s => s.trim()).filter(Boolean);
        return String(value || '').split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
    },

    recipe(raw = {}, map = null) {
        const kind = String(raw.kind || 'dungeon').toLowerCase() === 'wilderness' ? 'wilderness' : 'dungeon';
        const w = Math.floor(Number(raw.w || raw.width || (map && map.width) || 0));
        const h = Math.floor(Number(raw.h || raw.height || (map && map.height) || 0));
        this.dimensions({ w, h });
        let biomes = raw.biomes;
        if (typeof biomes === 'string' && /^\s*[\[{]/.test(biomes)) {
            try { biomes = JSON.parse(biomes); } catch (error) { biomes = []; }
        }
        if (!Array.isArray(biomes)) biomes = this.list(biomes).map(id => ({ id, weight: 1 }));
        biomes = biomes.map((biome, index) => typeof biome === 'string' ? { id: biome, weight: 1, tile: 0 } : {
            id: String(biome && biome.id || `biome${index + 1}`), weight: Math.max(0, Number(biome && biome.weight) || 0),
            tile: Math.max(0, Math.floor(Number(biome && (biome.tile || biome.tileId)) || 0))
        }).filter(biome => biome.id && biome.weight > 0);
        let points = raw.points;
        if (typeof points === 'string') points = points.split(';').map(pair => pair.split(',').map(Number)).filter(pair => pair.length === 2)
            .map(pair => ({ x: pair[0], y: pair[1] }));
        return {
            kind, w, h, count: Math.max(1, Math.min(this.maxRooms, Math.floor(Number(raw.count || raw.roomCount)) || 6)),
            roomIds: this.list(raw.roomIds || raw.rooms), biomes, points: Array.isArray(points) ? points : [],
            floorTile: Math.max(0, Math.floor(Number(raw.floorTile) || 0)), wallTile: Math.max(0, Math.floor(Number(raw.wallTile) || 0)),
            pathTile: Math.max(0, Math.floor(Number(raw.pathTile) || 0)), dress: raw.dress !== false && raw.dress !== 'false'
        };
    },

    layout(recipe, seed, roomCatalog = []) {
        const chosen = recipe.roomIds.length ? roomCatalog.filter(room => recipe.roomIds.includes(String(room.id))) : [];
        return recipe.kind === 'wilderness'
            ? this.wilderness({ w: recipe.w, h: recipe.h, seed, biomes: recipe.biomes, points: recipe.points })
            : this.dungeon({ w: recipe.w, h: recipe.h, seed, count: recipe.count, rooms: chosen });
    },

    // Turns a layout into reversible changes without mutating the source map. Tiles.paint is deliberately
    // used here so generated autotile edges get the same MZ shapes as hand-painted tiles.
    plan(layout, recipe, map, roomCatalog = [], options = {}) {
        const work = { width: map.width, height: map.height, loopX: false, loopY: false, data: (map.data || []).slice() };
        const brushRows = [], floor = new Set((layout.floor || []).map(tile => `${tile.x},${tile.y}`));
        const path = new Set((layout.paths || []).map(tile => `${tile.x},${tile.y}`));
        const biomeTiles = new Map((recipe.biomes || []).map(biome => [biome.id, biome.tile || recipe.floorTile]));
        for (let y = 0; y < layout.h; y++) {
            const row = [];
            for (let x = 0; x < layout.w; x++) {
                let id = recipe.wallTile;
                if (layout.kind === 'dungeon' && floor.has(`${x},${y}`)) id = recipe.floorTile;
                if (layout.kind === 'wilderness') id = path.has(`${x},${y}`) && recipe.pathTile ? recipe.pathTile
                    : (biomeTiles.get(layout.biomeIds[y * layout.w + x]) || recipe.floorTile);
                row.push(id);
            }
            brushRows.push(row);
        }
        const painted = DocsDoodads.Tiles.paint(work, 0, 0, { ids: brushRows, layer: 0 }, options.tables || {});
        for (const change of painted) work.data[change.index] = change.after;
        const doodads = [], events = [], usedIds = new Set((map.events || []).map((event, id) => event ? id : 0));
        const allocate = () => { let id = 1; while (usedIds.has(id)) id++; usedIds.add(id); return id; };
        if (layout.kind === 'dungeon') for (const placed of layout.rooms || []) {
            const room = roomCatalog.find(item => String(item.id) === String(placed.templateId));
            if (!room) continue;
            const roomPlan = DocsDoodads.Rooms.place(room, work, { x: placed.x, y: placed.y }, {
                tiles: true, doodads: true, events: true, keepUnder: true,
                tileWidth: options.tileWidth || 48, tileHeight: options.tileHeight || 48,
                groupId: `grp_gen_${layout.seed}_${placed.index}`, allocateEventId: allocate
            });
            for (const change of roomPlan.changes) work.data[change.index] = change.after;
            doodads.push(...roomPlan.doodads); events.push(...roomPlan.events);
        }
        const changes = [];
        for (let index = 0; index < work.data.length; index++) {
            const before = Number(map.data[index]) || 0, after = Number(work.data[index]) || 0;
            if (before !== after) changes.push({ index, before, after });
        }
        return { changes, doodads, events };
    }
};
