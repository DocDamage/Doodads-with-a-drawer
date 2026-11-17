// Released data and save-name compatibility. The pure snapshot/diff also runs in deployment tooling.
DocsDoodads.Shipped = {
    path: 'data/DocsDoodadsShipped.json',
    name(value) { return String(value || '').trim().toLowerCase(); },
    traceName(aliases, mapId, name) {
        const first = this.name(name), map = aliases && aliases[Number(mapId)] || {};
        let current = first;
        const seen = new Set();
        for (;;) {
            const key = Object.prototype.hasOwnProperty.call(map, 'name:' + current) ? 'name:' + current : current;
            if (!Object.prototype.hasOwnProperty.call(map, key)) break;
            if (seen.has(current)) return { name: first, valid: false };
            seen.add(current); current = this.name(map[key]);
            if (!current) return { name: first, valid: false };
        }
        return { name: current, valid: true };
    },
    resolveName(aliases, mapId, name) { return this.traceName(aliases, mapId, name).name; },
    resolveId(id, mapId) {
        if (!String(id || '').startsWith('name:')) return id;
        const data = typeof window !== 'undefined' ? window.$dataDocsDoodads : null;
        return 'name:' + this.resolveName(data && data.aliases, mapId, id.slice(5));
    },
    snapshot(data, sizes = {}, version = '') {
        const names = {}, states = {}, stateKeys = {}, items = {};
        for (const mapId of Object.keys(data || {}).filter(id => /^\d+$/.test(id) && Array.isArray(data[id])).sort((a, b) => Number(a) - Number(b))) {
            names[mapId] = []; items[mapId] = [];
            for (const item of data[mapId]) {
                const name = String(item && item.name || '').trim();
                if (!name) continue;
                const id = this.name(name), key = mapId + '/' + id;
                if (!names[mapId].some(value => this.name(value) === id)) names[mapId].push(name);
                const list = item.states && Array.isArray(item.states.list) ? item.states.list : [];
                if (!states[key]) {
                    states[key] = list.map(state => String(state && state.name || ''));
                    stateKeys[key] = list.map(state => state && String(state.name || '').trim() ? 'name:' + this.name(state.name) : 'unnamed:' + JSON.stringify(state || {}));
                }
                items[mapId].push({ name, uid: String(item.uid || ''), art: item.bit && String(item.bit[1] || '') || '', x: Number(item.x) || 0, y: Number(item.y) || 0 });
            }
        }
        return { version: String(version), date: '', names, states, stateKeys, maps: JSON.parse(JSON.stringify(sizes || {})), items, aliases: JSON.parse(JSON.stringify(data && data.aliases || {})) };
    },
    latest(value) {
        if (!value) return null;
        if (Array.isArray(value.releases)) return value.releases[value.releases.length - 1] || null;
        if (Array.isArray(value)) return value[value.length - 1] || null;
        return value.names ? value : null;
    },
    diff(before, now) {
        before = this.latest(before);
        if (!before || !now) return [];
        const out = [], add = (type, mapId, text, more) => out.push(Object.assign({ type, mapId: Number(mapId), text, kind: 'shipped', global: true }, more || {}));
        for (const [mapId, oldNames] of Object.entries(before.names || {})) {
            const currentNames = now.names[mapId] || [];
            for (const oldName of oldNames) {
                const oldId = this.name(oldName), resolved = this.resolveName(now.aliases, mapId, oldName);
                const found = currentNames.find(name => this.name(name) === resolved);
                if (!found) {
                    const oldItem = (before.items && before.items[mapId] || []).find(item => this.name(item.name) === oldId);
                    const matches = oldItem ? (now.items[mapId] || []).filter(item => oldItem.uid ? item.uid === oldItem.uid : item.art === oldItem.art && item.x === oldItem.x && item.y === oldItem.y) : [];
                    if (matches.length === 1) add('renamed', mapId, 'Map ' + mapId + ': released name ' + oldName + ' appears renamed to ' + matches[0].name + '.', { oldName, newName: matches[0].name });
                    else add('nameGone', mapId, 'Map ' + mapId + ': players\' saves know the missing name ' + oldName + '.', { oldName });
                    continue;
                }
                const oldKey = mapId + '/' + oldId, newKey = mapId + '/' + this.name(found);
                const previous = before.stateKeys && before.stateKeys[oldKey] || ((before.states || {})[oldKey] || []).map(name => 'name:' + this.name(name));
                const current = now.stateKeys && now.stateKeys[newKey] || ((now.states || {})[newKey] || []).map(name => 'name:' + this.name(name));
                previous.forEach((key, index) => {
                    const next = current.indexOf(key), label = ((before.states || {})[oldKey] || [])[index] || 'state ' + index;
                    if (next < 0) add('stateGone', mapId, oldName + ': released ' + label + ' is missing.', { oldName, state: label });
                    else if (next !== index) add('stateMoved', mapId, oldName + ': released ' + label + ' moved from ' + index + ' to ' + next + '; older numeric saves need care.', { oldName, state: label });
                });
            }
        }
        for (const [mapId, size] of Object.entries(before.maps || {})) if (now.maps[mapId] && JSON.stringify(size) !== JSON.stringify(now.maps[mapId])) {
            add('mapResized', mapId, 'Map ' + mapId + ' changed size from ' + size.join(' × ') + ' to ' + now.maps[mapId].join(' × ') + '; saved exploration may be reset.');
        }
        return out;
    },
    migrateSaved(mapId) {
        const W = DocsDoodads.WorldState;
        if (!W || !W.anySaved() || !W.mapLoaded(mapId)) return;
        const generated = typeof $gameSystem !== 'undefined' && $gameSystem && $gameSystem._docsGeneratedMaps && $gameSystem._docsGeneratedMaps[mapId];
        if (generated && DocsDoodads.GenerateRuntime && !DocsDoodads.GenerateRuntime.isMaterialized(mapId)) return;
        const items = DocsDoodads.doodads(mapId).filter(Boolean);
        const prefix = W.mapId(mapId) + '/', valid = new Set(items.map(item => W.idOf(item)));
        const store = W.store(false);
        for (const field of ['states', 'lights']) {
            const values = store[field];
            for (const key of Object.keys(values)) {
                if (!key.startsWith(prefix)) continue;
                const oldId = key.slice(prefix.length);
                const data = typeof window !== 'undefined' ? window.$dataDocsDoodads : null;
                if (oldId.startsWith('name:') && !this.traceName(data && data.aliases, mapId, oldId.slice(5)).valid) continue;
                const owners = store.liveNames && store.liveNames[field] || {};
                const owned = typeof owners[key] === 'string' ? items.find(item => item.uid === owners[key]) : null;
                if (typeof owners[key] === 'string' && !owned) { delete values[key]; delete owners[key]; continue; }
                const id = owned ? W.idOf(owned) : owners[key] && valid.has(oldId) ? oldId : this.resolveId(oldId, W.mapId(mapId)), target = prefix + id;
                if (!valid.has(id)) { delete values[key]; delete owners[key]; continue; }
                if (target !== key) {
                    if (!Object.prototype.hasOwnProperty.call(values, target)) { values[target] = values[key]; if (owners[key]) owners[target] = owners[key]; }
                    delete values[key]; delete owners[key];
                }
            }
        }
    },
    // Object API calls address the actual placed object. A reused historic name must not be migrated
    // into its predecessor's alias on the next load; old saves have no ownership marker and still migrate.
    markObject(field, object, mapId, id) {
        if (!object || typeof object !== 'object' || this.resolveId(id, mapId) === id) return;
        const store = DocsDoodads.WorldState.store(), owners = store.liveNames = store.liveNames || {};
        const values = owners[field] = owners[field] || {};
        values[DocsDoodads.WorldState.key(mapId, id)] = object.uid || true;
    }
};
