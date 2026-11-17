//==========================================================
// SECTION 4F: MOVEMENT OFF THE GRID (7.3.3), THE PURE PART
//==========================================================
// A character's box (24 × 16 pixels at the feet by default) moves by pixels and slides along whatever stops
// it: x and y are resolved apart, a long move is cut into short steps so nothing thin is jumped over, and a
// box that just clips a corner is nudged round it. `blocked(rect, from)` says whether a box may stand
// somewhere; the runtime builds it from painted walls, doodad bodies, MZ's tiles and other characters.
DocsDoodads.FreeMove = {
    defaults: { enabled: false, boxW: 24, boxH: 16 },
    maxStep: 4,
    slip: 8,

    settings(world) {
        const s = Object.assign({}, this.defaults, (world && world.freeMove) || {});
        const num = (v, min, max, d) => { const n = Number(v); return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : d; };
        return { enabled: s.enabled === true, boxW: Math.round(num(s.boxW, 4, 96, 24)), boxH: Math.round(num(s.boxH, 4, 96, 16)) };
    },

    // MZ's numpad directions: 1 down-left ... 9 up-right. Diagonals are as fast as straight moves.
    vector(dir8) {
        const v = { 1: [-1, 1], 2: [0, 1], 3: [1, 1], 4: [-1, 0], 6: [1, 0], 7: [-1, -1], 8: [0, -1], 9: [1, -1] }[dir8];
        if (!v) return { x: 0, y: 0 };
        const length = Math.hypot(v[0], v[1]);
        return { x: v[0] / length, y: v[1] / length };
    },

    // The way a character faces while moving diagonally: it keeps facing a side it already faces.
    facing(dir8, current) {
        if ([2, 4, 6, 8].includes(dir8)) return dir8;
        const parts = { 1: [4, 2], 3: [6, 2], 7: [4, 8], 9: [6, 8] }[dir8];
        if (!parts) return current;
        return parts.includes(current) ? current : parts[0];
    },

    // The box at a character's real position (tiles): centred on its feet, which are the bottom of its tile.
    box(realX, realY, tw, th, w, h) {
        return { x: (realX + 0.5) * tw - w / 2, y: (realY + 1) * th - h, w, h };
    },

    realOf(box, tw, th) {
        return { x: (box.x + box.w / 2) / tw - 0.5, y: (box.y + box.h) / th - 1 };
    },

    // The tile a box stands on: the one under its middle.
    tileOf(box, tw, th) {
        return { x: Math.floor((box.x + box.w / 2) / tw), y: Math.floor((box.y + box.h / 2) / th) };
    },

    // Touching is not overlapping: a box may slide along a wall it touches.
    overlaps(a, b) {
        return Boolean(a && b) && a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    },

    // The tiles a box covers (for walls and solid tiles).
    tilesUnder(box, tw, th) {
        const out = [];
        const x0 = Math.floor(box.x / tw), x1 = Math.floor((box.x + box.w - 1e-6) / tw);
        const y0 = Math.floor(box.y / th), y1 = Math.floor((box.y + box.h - 1e-6) / th);
        for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) out.push({ x: tx, y: ty });
        return out;
    },

    // Whether going from one tile to the next is stopped by MZ's passage rules. passable(x, y, d): may a
    // character leave (x, y) towards d, as Game_CharacterBase.isMapPassable answers. A diagonal step is
    // allowed when either way round is.
    crossBlocked(passable, from, to) {
        const dx = Math.sign(to.x - from.x), dy = Math.sign(to.y - from.y);
        if (!dx && !dy) return false;
        const h = dx > 0 ? 6 : 4, v = dy > 0 ? 2 : 8;
        if (dx && !dy) return !passable(from.x, from.y, h);
        if (dy && !dx) return !passable(from.x, from.y, v);
        const viaX = passable(from.x, from.y, h) && passable(from.x + dx, from.y, v);
        const viaY = passable(from.x, from.y, v) && passable(from.x, from.y + dy, h);
        return !(viaX || viaY);
    },

    // As far as it can along one axis: the whole way, or up to what stops it (to 1/64 of the step).
    advance(box, mx, my, blocked) {
        const target = { x: box.x + mx, y: box.y + my, w: box.w, h: box.h };
        if (!blocked(target, box)) return { box: target, hit: false };
        let lo = 0, hi = 1;
        for (let k = 0; k < 6; k++) {
            const mid = (lo + hi) / 2;
            if (blocked({ x: box.x + mx * mid, y: box.y + my * mid, w: box.w, h: box.h }, box)) hi = mid; else lo = mid;
        }
        return { box: { x: box.x + mx * lo, y: box.y + my * lo, w: box.w, h: box.h }, hit: true };
    },

    // A box stopped while moving straight slips sideways (up to `slip` pixels) when that clears the corner.
    corner(box, mx, my, blocked, slip) {
        for (let off = 1; off <= slip; off++) {
            for (const sign of [-1, 1]) {
                const side = mx ? { x: box.x, y: box.y + sign * off, w: box.w, h: box.h } : { x: box.x + sign * off, y: box.y, w: box.w, h: box.h };
                if (blocked(side, box)) continue;
                const ahead = { x: side.x + mx, y: side.y + my, w: box.w, h: box.h };
                if (blocked(ahead, side)) continue;
                const nudge = Math.min(off, Math.max(Math.abs(mx), Math.abs(my)));
                return mx ? { x: box.x, y: box.y + sign * nudge, w: box.w, h: box.h } : { x: box.x + sign * nudge, y: box.y, w: box.w, h: box.h };
            }
        }
        return null;
    },

    // One frame's move. A box that starts inside something is let out (no collision until it is clear).
    step(box, dx, dy, blocked, options = {}) {
        const maxStep = Math.max(0.25, Number(options.maxStep) || this.maxStep), slip = Math.max(0, Number(options.slip === undefined ? this.slip : options.slip) || 0);
        const start = { x: box.x, y: box.y, w: box.w, h: box.h };
        if (blocked(start, start)) {
            const free = { x: box.x + dx, y: box.y + dy, w: box.w, h: box.h };
            return { x: free.x, y: free.y, hitX: false, hitY: false, moved: Math.hypot(dx, dy), stuck: true };
        }
        let current = start, hitX = false, hitY = false;
        const n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / maxStep));
        const sx = dx / n, sy = dy / n;
        for (let i = 0; i < n; i++) {
            if (sx && !hitX) {
                const r = this.advance(current, sx, 0, blocked);
                current = r.box;
                if (r.hit) {
                    const round = !sy && slip ? this.corner(current, sx, 0, blocked, slip) : null;
                    if (round) current = round; else hitX = true;
                }
            }
            if (sy && !hitY) {
                const r = this.advance(current, 0, sy, blocked);
                current = r.box;
                if (r.hit) {
                    const round = !sx && slip ? this.corner(current, 0, sy, blocked, slip) : null;
                    if (round) current = round; else hitY = true;
                }
            }
        }
        return { x: current.x, y: current.y, hitX, hitY, moved: Math.hypot(current.x - start.x, current.y - start.y), stuck: false };
    },

    // Followers: the point `distance` back along a trail of { x, y, d } (newest last).
    alongTrail(trail, distance) {
        if (!trail || !trail.length) return null;
        let left = Math.max(0, distance);
        for (let i = trail.length - 1; i > 0; i--) {
            const a = trail[i], b = trail[i - 1], span = Math.hypot(a.x - b.x, a.y - b.y);
            if (span >= left && span > 0) {
                const f = left / span;
                return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, d: a.d };
            }
            left -= span;
        }
        return { x: trail[0].x, y: trail[0].y, d: trail[0].d };
    }
};
