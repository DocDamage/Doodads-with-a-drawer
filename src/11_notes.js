//==========================================================
// SECTION 5G4: MAP NOTES
//==========================================================
// Notes and to-dos pinned to tiles ("a chest here"), seen only in the editor: $dataDocsDoodads.notes[mapId] =
// [{ id, x, y, text, done, colour }]. Saved with the doodads (in the main file either way of saving); the game
// never reads them. A map without notes has no key, and with no notes anywhere there is no notes key at all.
// The editor's part is 44_workspace_notes.js.
DocsDoodads.Notes = {
    colours: ['yellow', 'red', 'green', 'blue'],

    store(write) {
        const data = typeof window !== 'undefined' ? (window.$dataDocsDoodads = window.$dataDocsDoodads || {}) : {};
        if (write && (!data.notes || typeof data.notes !== 'object' || Array.isArray(data.notes))) data.notes = {};
        return data.notes && typeof data.notes === 'object' ? data.notes : {};
    },

    // A map's notes (the live list; empty when it has none).
    list(mapId) {
        const list = this.store(false)[Number(mapId)];
        return Array.isArray(list) ? list : [];
    },

    at(mapId, x, y) {
        return this.list(mapId).find(n => n.x === x && n.y === y) || null;
    },

    clean(fields) {
        const out = {};
        if (fields.text !== undefined) out.text = String(fields.text || '').trim().slice(0, 500);
        if (fields.done !== undefined) out.done = Boolean(fields.done);
        if (fields.colour !== undefined) out.colour = this.colours.includes(fields.colour) ? fields.colour : 'yellow';
        if (fields.x !== undefined) out.x = Math.floor(Number(fields.x)) || 0;
        if (fields.y !== undefined) out.y = Math.floor(Number(fields.y)) || 0;
        return out;
    },

    // Adds a note at a tile; returns it (null without text).
    add(mapId, fields) {
        const note = Object.assign({ id: '', x: 0, y: 0, text: '', done: false, colour: 'yellow' }, this.clean(fields || {}));
        if (!note.text) return null;
        note.id = 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        const list = this.list(mapId).slice();
        list.push(note);
        this.put(mapId, list);
        return note;
    },

    // Changes a note's fields; returns it, or null when there is no such note. An empty text removes it.
    update(mapId, id, fields) {
        const note = this.list(mapId).find(n => n.id === id);
        if (!note) return null;
        const next = this.clean(fields || {});
        if (next.text === '') { this.remove(mapId, id); return null; }
        Object.assign(note, next);
        return note;
    },

    remove(mapId, id) {
        const list = this.list(mapId);
        const left = list.filter(n => n.id !== id);
        if (left.length === list.length) return false;
        this.put(mapId, left);
        return true;
    },

    // A copy of a map's notes, and putting one back (for undo). An empty list takes the key away.
    copy(mapId) {
        return JSON.parse(JSON.stringify(this.list(mapId)));
    },

    put(mapId, list) {
        const notes = this.store(true);
        const key = String(Number(mapId));
        if (Array.isArray(list) && list.length) notes[key] = list;
        else delete notes[key];
        if (Object.keys(notes).length === 0 && typeof window !== 'undefined' && window.$dataDocsDoodads) delete window.$dataDocsDoodads.notes;
    },

    // Every note: [{ mapId, note }], by map then position.
    all() {
        const out = [];
        const notes = this.store(false);
        for (const key of Object.keys(notes).sort((a, b) => Number(a) - Number(b))) {
            for (const note of this.list(key).slice().sort((a, b) => a.y - b.y || a.x - b.x)) out.push({ mapId: Number(key), note });
        }
        return out;
    },

    // { open, done } across every map, and per map.
    counts() {
        const total = { open: 0, done: 0, maps: {} };
        for (const { mapId, note } of this.all()) {
            const m = total.maps[mapId] = total.maps[mapId] || { open: 0, done: 0 };
            if (note.done) { total.done++; m.done++; } else { total.open++; m.open++; }
        }
        return total;
    }
};
