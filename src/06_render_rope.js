//==========================================================
// SECTION 4R: ROPES AND CABLES (9.3.2)
//==========================================================
// Pure rules for a line between two points that sags and sways. A rope is a doodad with `line`; its first end
// is the doodad's own point and the other is (x2, y2) pixels from it, so moving the doodad moves the rope and a
// looping map's seam never splits it. Plain ropes carry MZ's empty icon (IconSet 0) as their picture, so a
// build without ropes shows nothing instead of a missing picture.
DocsDoodads.Rope = {
    defaults: { x2: 96, y2: 0, sag: 16, width: 2, color: '#3b2a1a', sway: 1, hang: { path: '', count: 0, light: '' } },
    maxLength: 4096,

    normalize(line) {
        if (!line || typeof line !== 'object') return null;
        const d = this.defaults, num = (v, fallback, min, max) => {
            const n = Number(v);
            return Math.max(min, Math.min(max, Number.isFinite(n) ? n : fallback));
        };
        const hang = line.hang && typeof line.hang === 'object' ? line.hang : {};
        const color = /^#[0-9a-f]{6}$/i.test(String(line.color || '')) ? String(line.color).toLowerCase() : d.color;
        return {
            x2: Math.round(num(line.x2, d.x2, -this.maxLength, this.maxLength)),
            y2: Math.round(num(line.y2, d.y2, -this.maxLength, this.maxLength)),
            sag: Math.round(num(line.sag, d.sag, 0, 512)),
            width: num(line.width, d.width, 1, 16),
            color,
            sway: num(line.sway, d.sway, 0, 2),
            hang: {
                path: typeof hang.path === 'string' && /^img\/[^\0]*\.(png|jpe?g|webp)$/i.test(hang.path) && !hang.path.split('/').includes('..') ? hang.path : '',
                count: Math.round(num(hang.count, 0, 0, 24)),
                light: typeof hang.light === 'string' ? hang.light : ''
            }
        };
    },

    // Points along a hanging line: straight between the ends plus a parabola of `sag` pixels at the middle.
    points(x1, y1, x2, y2, sag, n) {
        n = Math.max(2, Math.min(64, Math.floor(Number(n) || 2)));
        sag = Math.max(0, Number(sag) || 0);
        const out = [];
        for (let i = 0; i <= n; i++) {
            const t = i / n;
            out.push({ x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t + 4 * sag * t * (1 - t), t });
        }
        return out;
    },

    // Enough segments for a smooth curve: about one per 16 pixels, at least 8.
    segmentsFor(line) {
        const l = this.normalize(line);
        if (!l) return 8;
        return Math.max(8, Math.min(64, Math.ceil((Math.hypot(l.x2, l.y2) + l.sag) / 16)));
    },

    length(points) {
        let total = 0;
        for (let i = 1; i < (points || []).length; i++) total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
        return total;
    },

    // The wind pushes the middle sideways most and the ends not at all; a slow swing with the gusts.
    // wind: { x, strength } as DocsDoodads.Wind.current() gives it. No wind is no sway.
    swayed(points, wind, time, seed = 0, amount = 1) {
        const x = Number(wind && wind.x) || 0, strength = Math.max(0, Number(wind && wind.strength) || 0);
        amount = Math.max(0, Number(amount) || 0);
        if ((!x && !strength) || !amount) return (points || []).map(p => ({ x: p.x, y: p.y, t: p.t }));
        const swing = Math.sin((Number(time) || 0) * 1.7 + (Number(seed) || 0) * 0.37) * 4 * strength;
        return points.map(p => {
            const t = p.t !== undefined ? p.t : 0, belly = 4 * t * (1 - t);
            const dx = belly * (x * 14 + swing) * amount;
            return { x: p.x + dx, y: p.y - Math.abs(dx) * 0.2, t };
        });
    },

    // Where hung things go: evenly spaced, never on the ends.
    hangAt(points, count) {
        count = Math.max(0, Math.min(24, Math.floor(Number(count) || 0)));
        if (!count || !points || points.length < 2) return [];
        const total = this.length(points), out = [];
        for (let k = 1; k <= count; k++) {
            let want = total * k / (count + 1), i = 1;
            while (i < points.length - 1 && want > Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y)) {
                want -= Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
                i++;
            }
            const a = points[i - 1], b = points[i], span = Math.hypot(b.x - a.x, b.y - a.y) || 1, f = Math.min(1, want / span);
            out.push({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f });
        }
        return out;
    },

    // The lowest point below the first end (for "sorted with characters": the rope sorts by its lower end).
    lowest(line) {
        const l = this.normalize(line);
        if (!l) return 0;
        return Math.max(...this.points(0, 0, l.x2, l.y2, l.sag, 16).map(p => p.y));
    },

    colorNumber(color) {
        const text = /^#[0-9a-f]{6}$/i.test(String(color || '')) ? String(color) : this.defaults.color;
        return parseInt(text.slice(1), 16);
    }
};
