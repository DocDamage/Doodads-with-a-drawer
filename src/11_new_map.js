// @editor-only
//==========================================================
// SECTION 5M: MAPS INSIDE MAPS (8.5.4)
//==========================================================
// DocsDoodads.NewMap makes an empty MZ map (data/Map###.json) and its entry in data/MapInfos.json, written together
// with backups, or neither. DocsDoodads.Places links a feature (a town marker, a door, stairs) to a map: it makes
// the map if asked, a transfer event at the feature and one back at the new map's entrance.
// $dataDocsDoodads.places = [{ id, name, mapId, kind, parent: { mapId, x, y }, entrance: { x, y } }].
// RPG Maker MZ keeps MapInfos in memory while the project is open and writes its own copy when you save there:
// close and reopen the project in MZ after making maps here.
DocsDoodads.NewMap = {
    maxId: 999,

    // The lowest id no map has.
    nextId(infos) {
        const used = new Set((infos || []).filter(Boolean).map(i => Number(i.id)));
        for (let id = 1; id <= this.maxId; id++) if (!used.has(id)) return id;
        return 0;
    },

    blank(spec = {}) {
        const w = Math.max(1, Math.min(256, Math.floor(Number(spec.width) || 17))), h = Math.max(1, Math.min(256, Math.floor(Number(spec.height) || 13)));
        const audio = () => ({ name: '', pan: 0, pitch: 100, volume: 90 });
        const data = new Array(w * h * 6).fill(0);
        const ground = Math.floor(Number(spec.ground) || 0);
        if (ground > 0) for (let i = 0; i < w * h; i++) data[i] = ground;
        return { autoplayBgm: false, autoplayBgs: false, battleback1Name: '', battleback2Name: '', bgm: audio(), bgs: audio(), disableDashing: false,
            displayName: String(spec.displayName || ''), encounterList: [], encounterStep: 30, height: h, note: String(spec.note || ''),
            parallaxLoopX: false, parallaxLoopY: false, parallaxName: '', parallaxShow: true, parallaxSx: 0, parallaxSy: 0, scrollType: Number(spec.scrollType) || 0,
            specifyBattleback: false, tilesetId: Math.max(1, Math.floor(Number(spec.tilesetId) || 1)), width: w, data, events: [null] };
    },

    infoFor(id, name, parentId, infos) {
        const order = Math.max(0, ...(infos || []).filter(Boolean).map(i => Number(i.order) || 0)) + 1;
        return { id, expanded: false, name: String(name || 'MAP' + String(id).padStart(3, '0')), order, parentId: Math.max(0, Number(parentId) || 0), scrollX: 0, scrollY: 0 };
    },

    // What will be written: { id, map, infos } (infos a new array with the entry at index id). Pure.
    plan(infos, spec = {}) {
        const id = this.nextId(infos);
        if (!id) throw new Error('Every map id up to 999 is taken.');
        const map = this.blank(spec);
        if (Array.isArray(spec.events)) for (const ev of spec.events) if (ev && ev.id) map.events[ev.id] = ev;
        const next = (infos || []).slice();
        while (next.length <= id) next.push(null);
        next[id] = this.infoFor(id, spec.name, spec.parentId, infos);
        return { id, map, infos: next };
    },

    path(id) { return `data/Map${String(id).padStart(3, '0')}.json`; },

    // MZ's MapInfos form: one entry a line.
    infosText(infos) { return '[\n' + infos.map(i => JSON.stringify(i === undefined ? null : i)).join(',\n') + '\n]'; },

    // The MapInfos file's state when the editor first read it this session, for the changed-since check.
    _snapshot: undefined,
    remember() { if (this._snapshot === undefined) this._snapshot = DocsDoodads.FS.stat('data/MapInfos.json') || null; },
    changedSince() {
        if (!this._snapshot) return false;
        const now = DocsDoodads.FS.stat('data/MapInfos.json');
        return Boolean(now && (now.mtimeMs !== this._snapshot.mtimeMs || now.size !== this._snapshot.size));
    },

    // Writes the map and MapInfos together (backups first), or neither. Returns the new id.
    make(spec = {}) {
        const FS = DocsDoodads.FS;
        this.remember();
        if (this.changedSince()) throw new Error('data/MapInfos.json was changed in RPG Maker MZ since the editor read it. Close and reopen the project there, then try again.');
        const infos = FS.readJson('data/MapInfos.json') || (typeof window !== 'undefined' && window.$dataMapInfos) || [null];
        const p = this.plan(infos, spec);
        if (FS.existsSync(this.path(p.id))) throw new Error(`${this.path(p.id)} is already there but not in MapInfos.json; check the project in RPG Maker MZ.`);
        const entries = [{ path: this.path(p.id), data: p.map, indent: 0 }, { path: 'data/MapInfos.json', json: this.infosText(p.infos) }];
        FS.backupChanged(entries);
        const result = FS.atomicWriteManyJson(entries);
        if (!result.ok) throw new Error(`The new map was not written${result.rolledBack ? ' (nothing was changed)' : ''}: ${result.error}`);
        this._snapshot = FS.stat('data/MapInfos.json') || null;
        if (typeof window !== 'undefined') window.$dataMapInfos = p.infos;
        return p.id;
    },

    // A big picture cut into maps on a grid: [{ col, row, x, y, width, height, links }] with east/west/north/south
    // filled with the index of the neighbouring piece. Pure.
    grid(tilesW, tilesH, max = 256) {
        const cols = Math.ceil(tilesW / max), rows = Math.ceil(tilesH / max), out = [];
        for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
            const x = col * max, y = row * max;
            out.push({ col, row, x, y, width: Math.min(max, tilesW - x), height: Math.min(max, tilesH - y), links: {} });
        }
        const at = (c, r) => out.findIndex(p => p.col === c && p.row === r);
        for (const p of out) {
            for (const [side, dc, dr] of [['east', 1, 0], ['west', -1, 0], ['north', 0, -1], ['south', 0, 1]]) {
                const i = at(p.col + dc, p.row + dr);
                if (i >= 0) p.links[side] = i;
            }
        }
        return out;
    }
};

DocsDoodads.Places = {
    sizes: { town: [40, 30], room: [17, 13], floor: [30, 24], dungeon: [40, 40], overworld: [80, 60] },

    list() {
        const data = typeof window !== 'undefined' && window.$dataDocsDoodads;
        return data && Array.isArray(data.places) ? data.places.filter(p => p && p.id && p.mapId) : [];
    },

    // A transfer: the template's command pointing at (mapId, x, y), facing d.
    transferList(mapId, x, y, d) {
        const t = DocsDoodads.EventTemplates.templates.transfer_door;
        const list = JSON.parse(JSON.stringify(t.list));
        const cmd = list.find(c => c.code === 201);
        cmd.parameters = [0, Number(mapId), Number(x), Number(y), Number(d) || 2, 0];
        return list;
    },

    transferEvent(id, x, y, toMap, toX, toY, d, name) {
        const t = DocsDoodads.EventTemplates.templates.transfer_door;
        return DocsDoodads.Events.createEventObject(id, x, y, { name: name || 'Transfer', trigger: t.trigger, priorityType: t.priorityType, list: this.transferList(toMap, toX, toY, d) });
    },

    // The entrance of a new map of a kind: the bottom middle (the player walks in facing up).
    entrance(kind, w, h) {
        return { x: Math.floor(w / 2), y: Math.max(0, h - 2) };
    },

    // Every event on a map that transfers to `toMap`: [{ x, y, target: { x, y } }].
    transfersTo(map, toMap) {
        const out = [];
        for (const ev of (map && map.events) || []) {
            if (!ev) continue;
            for (const page of ev.pages || []) for (const c of page.list || []) {
                if (c && c.code === 201 && Number(c.parameters[0]) === 0 && Number(c.parameters[1]) === Number(toMap)) out.push({ x: ev.x, y: ev.y, target: { x: Number(c.parameters[2]), y: Number(c.parameters[3]) } });
            }
        }
        return out;
    },

    // Whether a tile of a map can be stood on: some side passable by its tileset's flags (MZ's check).
    standable(map, flags, x, y) {
        if (!map || x < 0 || y < 0 || x >= map.width || y >= map.height) return false;
        const w = map.width, h = map.height;
        const ids = [3, 2, 1, 0].map(z => map.data[(z * h + y) * w + x] || 0);
        if (ids.every(id => !id)) return false; // no tile at all: nothing to stand on
        return [1, 2, 4, 8].some(bit => {
            for (const id of ids) {
                const f = flags[id] || 0;
                if ((f & 0x10) !== 0) continue;
                if ((f & bit) === 0) return true;
                if ((f & bit) === bit) return false;
            }
            return false;
        });
    },

    // What is wrong with a place's links: { missingThere, missingBack, blockedThere, blockedBack } (each true when so).
    check(place, readMap, flagsOf) {
        const parent = readMap(place.parent.mapId), child = readMap(place.mapId);
        const there = this.transfersTo(parent, place.mapId).filter(t => t.x === place.parent.x && t.y === place.parent.y);
        const back = this.transfersTo(child, place.parent.mapId);
        const out = { missingThere: !there.length, missingBack: !back.length, blockedThere: false, blockedBack: false };
        if (there.length && child) out.blockedThere = !this.standable(child, flagsOf(child.tilesetId), there[0].target.x, there[0].target.y);
        if (back.length && parent) out.blockedBack = !this.standable(parent, flagsOf(parent.tilesetId), back[0].target.x, back[0].target.y);
        return out;
    },

    // The tree: places under their parent's map, roots first. [{ place, depth }].
    tree(places) {
        const byParent = new Map();
        for (const p of places) { const k = Number(p.parent && p.parent.mapId) || 0; (byParent.get(k) || byParent.set(k, []).get(k)).push(p); }
        const childMaps = new Set(places.map(p => Number(p.mapId)));
        const roots = Array.from(byParent.keys()).filter(k => !childMaps.has(k)).sort((a, b) => a - b);
        const out = [], seen = new Set();
        const walk = (mapId, depth) => {
            for (const p of byParent.get(mapId) || []) {
                if (seen.has(p.id)) continue;
                seen.add(p.id);
                out.push({ place: p, depth });
                walk(Number(p.mapId), depth + 1);
            }
        };
        for (const r of roots) { out.push({ root: r, depth: 0 }); walk(r, 1); }
        return out;
    }
};
