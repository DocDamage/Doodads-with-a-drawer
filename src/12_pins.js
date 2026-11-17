//==========================================================
// SECTION 6P: PINS AND FAST TRAVEL (9.1.6)
//==========================================================
// Places on the minimap and the world map. Pins placed in the editor live in the project:
// $dataDocsDoodads.pins[mapId] = [{ id, x, y, icon, name, travel, switchId }]. An event can carry one in its
// note or a comment on its page: <docs pin: icon, name> (add ", travel" only for display; event pins never
// take the player anywhere, since an event's tile is usually not one to stand on). What the player has
// found or the game has hidden is in the save: $gameSystem._docsPins = { found: [ids], hidden: [ids] }.
// A pin shows once found: its tile explored (with the minimap's fog of war), the player within the minimap's
// radius (without it), or a Find Pin command. Pins are placed by tile, so looping maps and planets agree.
DocsDoodads.Pins = {
    tag: /<docs\s*pin\s*:\s*([^>]*)>/i,

    store(write) {
        const data = typeof window !== 'undefined' ? (window.$dataDocsDoodads = window.$dataDocsDoodads || {}) : {};
        if (write && (!data.pins || typeof data.pins !== 'object' || Array.isArray(data.pins))) data.pins = {};
        return data.pins && typeof data.pins === 'object' && !Array.isArray(data.pins) ? data.pins : {};
    },

    clean(fields) {
        const out = {};
        const int = (v, min, max) => Math.max(min, Math.min(max, Math.floor(Number(v)) || 0));
        if (fields.x !== undefined) out.x = int(fields.x, 0, 9999);
        if (fields.y !== undefined) out.y = int(fields.y, 0, 9999);
        if (fields.icon !== undefined) out.icon = int(fields.icon, 0, 9999);
        if (fields.name !== undefined) out.name = String(fields.name || '').replace(/[\r\n]+/g, ' ').trim().slice(0, 60);
        if (fields.travel !== undefined) out.travel = Boolean(fields.travel);
        if (fields.switchId !== undefined) out.switchId = int(fields.switchId, 0, 9999);
        return out;
    },

    list(mapId) {
        const list = this.store(false)[Number(mapId)];
        return Array.isArray(list) ? list.filter(p => p && typeof p.id === 'string') : [];
    },

    copy(mapId) { return JSON.parse(JSON.stringify(this.list(mapId))); },

    // Replaces a map's pins; an empty list removes the key, and no pins anywhere removes `pins`.
    put(mapId, list) {
        const store = this.store(true);
        if (Array.isArray(list) && list.length) store[Number(mapId)] = list;
        else delete store[Number(mapId)];
        if (!Object.keys(store).length && typeof window !== 'undefined' && window.$dataDocsDoodads) delete window.$dataDocsDoodads.pins;
    },

    at(mapId, x, y) { return this.list(mapId).find(p => p.x === x && p.y === y) || null; },

    add(mapId, fields) {
        const clean = Object.assign({ x: 0, y: 0, icon: 190, name: '', travel: false, switchId: 0 }, this.clean(fields || {}));
        if (!clean.name) return null;
        const list = this.copy(mapId);
        let n = 1;
        for (const p of list) { const m = /p(\d+)$/.exec(p.id); if (m) n = Math.max(n, Number(m[1]) + 1); }
        const pin = Object.assign({ id: `m${Number(mapId)}p${n}` }, clean);
        list.push(pin);
        this.put(mapId, list);
        return pin;
    },

    update(mapId, id, fields) {
        const list = this.copy(mapId), pin = list.find(p => p.id === id);
        if (!pin) return null;
        Object.assign(pin, this.clean(fields || {}));
        if (!pin.name) return this.remove(mapId, id);
        this.put(mapId, list);
        return pin;
    },

    remove(mapId, id) {
        const list = this.copy(mapId), next = list.filter(p => p.id !== id);
        if (next.length === list.length) return null;
        this.put(mapId, next);
        return true;
    },

    // "<docs pin: 87, Inn>" → { icon: 87, name: 'Inn' }. A missing icon number means the default flag.
    parseTag(text) {
        const m = this.tag.exec(String(text || ''));
        if (!m) return null;
        const parts = m[1].split(',').map(s => s.trim()).filter(Boolean);
        let icon = 190;
        if (parts.length && /^\d+$/.test(parts[0])) icon = Math.min(9999, Number(parts.shift()));
        if (parts.length && /^travel$/i.test(parts[parts.length - 1])) parts.pop();
        const name = parts.join(', ').slice(0, 60);
        return name ? { icon, name } : null;
    },

    eventPin(mapId, eventId, x, y, text) {
        const tag = this.parseTag(text);
        return tag ? { id: `m${Number(mapId)}e${Number(eventId)}`, x, y, icon: tag.icon, name: tag.name, travel: false, switchId: 0, event: true } : null;
    },

    // Every pin on a map: its own and its events' ({ eventId, x, y, text } each).
    forMap(mapId, events) {
        const out = this.list(mapId).slice();
        for (const ev of events || []) {
            const pin = ev ? this.eventPin(mapId, ev.eventId, ev.x, ev.y, ev.text) : null;
            if (pin) out.push(pin);
        }
        return out;
    },

    // A project pin by id, or by name (any map, letter case ignored).
    find(key) {
        const text = String(key || '').trim();
        if (!text) return null;
        const store = this.store(false), byName = [];
        for (const mapId of Object.keys(store)) {
            for (const pin of this.list(mapId)) {
                if (pin.id === text) return { mapId: Number(mapId), pin };
                if (pin.name.toLowerCase() === text.toLowerCase()) byName.push({ mapId: Number(mapId), pin });
            }
        }
        return byName[0] || null;
    },

    state() {
        const sys = typeof $gameSystem !== 'undefined' && $gameSystem ? $gameSystem : null;
        if (!sys) return { found: [], hidden: [] };
        const s = sys._docsPins;
        if (!s || !Array.isArray(s.found) || !Array.isArray(s.hidden)) sys._docsPins = { found: [], hidden: [] };
        return sys._docsPins;
    },

    isFound(id) { return this.state().found.includes(id); },
    isHidden(id) { return this.state().hidden.includes(id); },

    discover(id) {
        const s = this.state();
        if (!id || s.found.includes(id)) return false;
        s.found.push(id);
        return true;
    },

    setHidden(id, hidden) {
        const s = this.state(), at = s.hidden.indexOf(id);
        if (hidden && at < 0) s.hidden.push(id);
        if (!hidden && at >= 0) s.hidden.splice(at, 1);
        return Boolean(hidden);
    },

    // ctx: { found(id), hidden(id), switchOn(id), explored(x, y) }.
    visible(pin, ctx = {}) {
        if (!pin || (ctx.hidden && ctx.hidden(pin.id))) return false;
        if (pin.switchId > 0 && !(ctx.switchOn && ctx.switchOn(pin.switchId))) return false;
        return Boolean((ctx.found && ctx.found(pin.id)) || (ctx.explored && ctx.explored(pin.x, pin.y)));
    },

    // Pins near the player become found: with fog, by an explored tile; without, within `radius` tiles.
    discoverNear(pins, ctx) {
        const found = [];
        for (const pin of pins || []) {
            if (!pin || this.isFound(pin.id)) continue;
            const near = ctx.fog ? Boolean(ctx.explored && ctx.explored(pin.x, pin.y))
                : Math.hypot(this.loopDelta(pin.x - ctx.px, ctx.width, ctx.loopX), this.loopDelta(pin.y - ctx.py, ctx.height, ctx.loopY)) <= ctx.radius;
            if (near && this.discover(pin.id)) found.push(pin);
        }
        return found;
    },

    loopDelta(d, size, loop) {
        if (!loop || !size) return d;
        d = ((d % size) + size) % size;
        return d > size / 2 ? d - size : d;
    },

    // Found, shown, travel pins on maps that still exist, by map and then name.
    travelList(ctx = {}) {
        const out = [], store = this.store(false), infos = ctx.mapInfos || [];
        for (const mapId of Object.keys(store).map(Number).sort((a, b) => a - b)) {
            if (!infos[mapId]) continue;
            for (const pin of this.list(mapId)) {
                if (!pin.travel || !this.visible(pin, { found: id => this.isFound(id), hidden: id => this.isHidden(id), switchOn: ctx.switchOn })) continue;
                out.push({ mapId, pin, mapName: infos[mapId].name || `Map ${mapId}` });
            }
        }
        return out.sort((a, b) => a.mapId - b.mapId || a.pin.name.localeCompare(b.pin.name));
    },

    travelAllowed(forbidSwitch, switchOn) {
        return !(Number(forbidSwitch) > 0 && switchOn && switchOn(Number(forbidSwitch)));
    },

    iconFrame(icon, size = 32) {
        icon = Math.max(0, Math.floor(Number(icon) || 0));
        return { x: (icon % 16) * size, y: Math.floor(icon / 16) * size, w: size, h: size };
    }
};
