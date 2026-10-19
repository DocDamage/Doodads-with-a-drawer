//==========================================================
// SECTION 5B3: 2D CAMERA (FOLLOW SMOOTHING, REGION BOUNDS, PATHS)
//==========================================================
// On flat maps: the camera can ease after the player instead of snapping (World > Camera), stay inside a
// region's area while the player is in it (mapSettings.cameraBounds = [region numbers]: a room, a corridor
// that shouldn't show what is past its walls), follow an event, and glide along a path for a cutscene
// (2D Camera Path). Positions are the tile at the middle of the screen. The 3D view has Set Camera.
DocsDoodads.Camera2D = {
    defaults: { smooth: 0, lookAhead: 0 },
    eases: [{ value: 'smooth', label: 'Smooth (ease in and out)' }, { value: 'linear', label: 'Even speed' }],

    settings() {
        return Object.assign({}, this.defaults, DocsDoodads.World.settings().camera2d || {});
    },

    // "10,5; 20,8 | 3,4" -> [{ x: 10, y: 5 }, { x: 20, y: 8 }, { x: 3, y: 4 }]
    parsePoints(text) {
        return String(text || '').split(/[;|\n]+/).map(p => p.trim()).filter(Boolean).map(p => {
            const [x, y] = p.split(/[\s,]+/).map(Number);
            return isFinite(x) && isFinite(y) ? { x, y } : null;
        }).filter(Boolean);
    },

    ease(t, kind) {
        const c = Math.max(0, Math.min(1, t));
        return kind === 'linear' ? c : c * c * (3 - 2 * c);
    },

    // Where a path is after some frames: { x, y, done }. path: { points (from the start), frames (a leg) }.
    pathAt(path, frame) {
        const pts = path.points || [];
        if (pts.length === 0) return { x: 0, y: 0, done: true };
        const leg = Math.max(1, Number(path.frames) || 60);
        const i = Math.floor(frame / leg);
        if (i >= pts.length - 1) return Object.assign({}, pts[pts.length - 1], { done: true });
        const t = this.ease((frame - i * leg) / leg, path.ease);
        return { x: pts[i].x + (pts[i + 1].x - pts[i].x) * t, y: pts[i].y + (pts[i + 1].y - pts[i].y) * t, done: false };
    },

    pathFrames(path) {
        return Math.max(0, ((path.points || []).length - 1) * Math.max(1, Number(path.frames) || 60));
    },

    // The tiles with a region: { x0, y0, x1, y1 } (inclusive), or null. MZ keeps regions in layer 5.
    regionBox(data, w, h, region) {
        const r = Number(region) || 0;
        if (!data || r <= 0) return null;
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        const start = 5 * w * h;
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                if ((Number(data[start + y * w + x]) || 0) !== r) continue;
                if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
            }
        }
        return x1 < 0 ? null : { x0, y0, x1, y1 };
    },

    // A display position (top-left tile) kept so the screen (sw x sh tiles) stays inside the box; a box
    // smaller than the screen is centred.
    clamp(box, x, y, sw, sh) {
        const axis = (v, lo, hi, size) => {
            const span = hi - lo + 1;
            if (span <= size) return lo - (size - span) / 2;
            return Math.max(lo, Math.min(hi + 1 - size, v));
        };
        return { x: axis(x, box.x0, box.x1, sw), y: axis(y, box.y0, box.y1, sh) };
    },

    // One frame of easing toward the wanted display position. smooth 0 = there at once, 0.95 = very slow.
    // Looping maps go the short way round.
    step(from, to, smooth, loopW, loopH) {
        const k = 1 - Math.max(0, Math.min(0.97, Number(smooth) || 0));
        const short = (d, size) => (size ? ((d % size) + size * 1.5) % size - size / 2 : d);
        const dx = short(to.x - from.x, loopW), dy = short(to.y - from.y, loopH);
        const snap = v => (Math.abs(v) < 0.002 ? 0 : v);
        return { dx: snap(dx * k), dy: snap(dy * k) };
    }
};
