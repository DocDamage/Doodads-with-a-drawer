// @editor-only
//==========================================================
// SECTION 5G5: THE RULER AND BOOKMARKS
//==========================================================
// The editor's Ruler (44_workspace_ruler.js) measures between two points on the map, and bookmarks
// (44_workspace_places_bookmarks.js) keep places to jump back to. Both editor only.

// Points are map pixels; tw and th the tile size.
DocsDoodads.Ruler = {
    // The middle of the tile a point is on (Shift while measuring).
    snap(p, tw, th) {
        return { x: (Math.floor(p.x / tw) + 0.5) * tw, y: (Math.floor(p.y / th) + 0.5) * th };
    },

    // From a to b: tiles across and down (between the tiles they are on), the walk (across + down: steps on the
    // grid), the straight line in tiles, and pixels.
    measure(a, b, tw, th) {
        const dx = Math.floor(b.x / tw) - Math.floor(a.x / tw), dy = Math.floor(b.y / th) - Math.floor(a.y / th);
        const px = b.x - a.x, py = b.y - a.y;
        return {
            dx, dy, walk: Math.abs(dx) + Math.abs(dy),
            tiles: Math.round(Math.hypot(px / tw, py / th) * 10) / 10,
            px: Math.round(px), py: Math.round(py), pixels: Math.round(Math.hypot(px, py))
        };
    },

    label(m) {
        return `${Math.abs(m.dx)} × ${Math.abs(m.dy)} tiles · walk ${m.walk} · straight ${m.tiles} tiles · ${m.pixels} px (${Math.abs(m.px)} × ${Math.abs(m.py)})`;
    }
};

// $dataDocsDoodads.bookmarks = [{ id, name, mapId, x, y, camera }]: x and y the tile at the middle of the view,
// camera the 3D view's camera (null on a flat map). Saved with the doodads, in the main file either way of
// saving; never read by the game. No bookmarks, no key.
DocsDoodads.Bookmarks = {
    list() {
        const data = typeof window !== 'undefined' ? window.$dataDocsDoodads : null;
        return data && Array.isArray(data.bookmarks) ? data.bookmarks : [];
    },

    get(id) {
        return this.list().find(b => b.id === id) || null;
    },

    put(list) {
        const data = window.$dataDocsDoodads = window.$dataDocsDoodads || {};
        if (Array.isArray(list) && list.length) data.bookmarks = list;
        else delete data.bookmarks;
    },

    add(fields) {
        const name = String(fields.name || '').trim().slice(0, 60);
        const mapId = Math.floor(Number(fields.mapId)) || 0;
        if (!name || !mapId) return null;
        const camera = fields.camera && typeof fields.camera === 'object' ? JSON.parse(JSON.stringify(fields.camera)) : null;
        const b = { id: 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name, mapId,
            x: Math.floor(Number(fields.x)) || 0, y: Math.floor(Number(fields.y)) || 0, camera };
        this.put(this.list().concat([b]));
        return b;
    },

    rename(id, name) {
        const b = this.get(id);
        const next = String(name || '').trim().slice(0, 60);
        if (!b || !next) return false;
        b.name = next;
        return true;
    },

    remove(id) {
        const list = this.list();
        const left = list.filter(b => b.id !== id);
        if (left.length === list.length) return false;
        this.put(left);
        return true;
    },

    // Moves a bookmark up (-1) or down (1): the first nine have Ctrl+1 to Ctrl+9.
    shift(id, by) {
        const list = this.list().slice();
        const i = list.findIndex(b => b.id === id), j = i + by;
        if (i < 0 || j < 0 || j >= list.length) return false;
        [list[i], list[j]] = [list[j], list[i]];
        this.put(list);
        return true;
    }
};
