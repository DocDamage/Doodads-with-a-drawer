// Bounded local heat data. The sampling cursor is transient and never part of an exported file.
DocsDoodads.Trails = {
    maxBytes: 16 * 1024 * 1024,
    maxCells: 131072,
    empty() { return { version: 1, maps: {} }; },
    cell(data, mapId, x, y) {
        const map = data.maps[String(mapId)] || (data.maps[String(mapId)] = {}), key = x + ',' + y;
        if (!map[key]) {
            if ((data._cells || 0) >= this.maxCells) return null;
            map[key] = { steps: 0, frames: 0, deaths: 0 }; data._cells = (data._cells || 0) + 1;
        }
        return map[key];
    },
    sample(data, at) {
        const prior = data.cursor, now = { mapId: Number(at.mapId), x: Math.floor(at.x), y: Math.floor(at.y), frame: Number(at.frame) };
        if (!(now.mapId > 0) || !isFinite(now.x + now.y + now.frame) || now.x < 0 || now.y < 0) { delete data.cursor; return false; }
        data.cursor = now;
        const cell = this.cell(data, now.mapId, now.x, now.y);
        if (!cell) return false;
        if (prior && prior.mapId === now.mapId && (prior.x !== now.x || prior.y !== now.y)) cell.steps = Math.min(1e9, cell.steps + 1);
        else if (prior && prior.mapId === now.mapId && !at.moving) cell.frames = Math.min(1e9, cell.frames + Math.max(0, Math.min(120, now.frame - prior.frame)));
        return true;
    },
    death(data, mapId, x, y) {
        if (!(mapId > 0) || !isFinite(x + y) || x < 0 || y < 0) return false;
        const cell = this.cell(data, mapId, Math.floor(x), Math.floor(y));
        if (!cell) return false;
        cell.deaths = Math.min(1e9, cell.deaths + 1); return true;
    },
    clean(source, validMap = () => true) {
        if (!source || source.version !== 1 || !source.maps || typeof source.maps !== 'object' || Array.isArray(source.maps)) throw new Error('Unsupported trails version.');
        const out = this.empty(); let count = 0;
        const number = value => Number.isFinite(Number(value)) ? Math.min(1e9, Math.max(0, Math.floor(Number(value)))) : 0;
        for (const id of Object.keys(source.maps)) {
            if (!/^[1-9]\d{0,3}$/.test(id) || !validMap(Number(id))) continue;
            const map = source.maps[id];
            if (!map || typeof map !== 'object' || Array.isArray(map)) continue;
            for (const key of Object.keys(map)) {
                if (!/^\d{1,4},\d{1,4}$/.test(key)) continue;
                const value = map[key]; if (!value || typeof value !== 'object') continue;
                const cell = { steps: number(value.steps), frames: number(value.frames), deaths: number(value.deaths) };
                if (!cell.steps && !cell.frames && !cell.deaths) continue;
                if (++count > this.maxCells) throw new Error('This trails file has too many tiles.');
                (out.maps[id] || (out.maps[id] = {}))[key] = cell;
            }
        }
        return out;
    },
    read(text, validMap) {
        if (typeof text !== 'string' || text.length > this.maxBytes) throw new Error('This trails file is too large.');
        return this.clean(JSON.parse(text), validMap);
    },
    merge(first, second, validMap) {
        const out = this.clean(first, validMap), more = this.clean(second, validMap);
        for (const id of Object.keys(more.maps)) for (const key of Object.keys(more.maps[id])) {
            const a = (out.maps[id] || (out.maps[id] = {}))[key] || { steps: 0, frames: 0, deaths: 0 }, b = more.maps[id][key];
            out.maps[id][key] = { steps: Math.min(1e9, a.steps + b.steps), frames: Math.min(1e9, a.frames + b.frames), deaths: Math.min(1e9, a.deaths + b.deaths) };
        }
        return this.clean(out, validMap);
    }
};
