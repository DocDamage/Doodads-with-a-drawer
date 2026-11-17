// @editor-only
DocsDoodads.Trace = {
    filePattern: /^data\/docs_doodads_cache\/trace\/[a-f0-9]{64}\.(png|jpe?g|webp)$/,
    normalize(value) {
        if (!value || !this.filePattern.test(String(value.file || ''))) return null;
        const number = (v, fallback, min, max) => Number.isFinite(Number(v)) ? Math.max(min, Math.min(max, Number(v))) : fallback;
        return { file: String(value.file), width: number(value.width, 1, 1, 4096), height: number(value.height, 1, 1, 4096),
            x: number(value.x, 0, -1000000, 1000000), y: number(value.y, 0, -1000000, 1000000),
            scale: number(value.scale, 1, 0.01, 256), turn: ((number(value.turn, 0, -1000000, 1000000) + 180) % 360 + 360) % 360 - 180,
            alpha: number(value.alpha, 0.4, 0, 1), show: value.show !== false, locked: value.locked !== false };
    },
    point(transform, point) {
        const a = transform.turn * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
        return { x: transform.x + transform.scale * (point.x * c - point.y * s), y: transform.y + transform.scale * (point.x * s + point.y * c) };
    },
    inverse(transform, point) {
        const a = -transform.turn * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
        const x = (point.x - transform.x) / transform.scale, y = (point.y - transform.y) / transform.scale;
        return { x: x * c - y * s, y: x * s + y * c };
    },
    unwrap(point, reference, loop) {
        const near = (value, anchor, size) => size > 0 ? anchor + ((value - anchor) % size + size * 1.5) % size - size / 2 : value;
        return { x: near(point.x, reference.x, loop && loop.w), y: near(point.y, reference.y, loop && loop.h) };
    },
    fitTwo(a, b, first, second) {
        const dx = b.x - a.x, dy = b.y - a.y, tx = second.x - first.x, ty = second.y - first.y;
        const length = Math.hypot(dx, dy), target = Math.hypot(tx, ty);
        if (!(length > 0.0001) || !(target > 0.0001)) return null;
        const scale = target / length;
        if (!Number.isFinite(scale) || scale < 0.01 || scale > 256) return null;
        const turn = (Math.atan2(ty, tx) - Math.atan2(dy, dx)) * 180 / Math.PI;
        const origin = this.point({ x: 0, y: 0, scale, turn }, a);
        return { x: first.x - origin.x, y: first.y - origin.y, scale, turn };
    },
    fitMap(width, height, mapWidth, mapHeight) {
        if (![width, height, mapWidth, mapHeight].every(v => Number.isFinite(v) && v > 0)) return null;
        const scale = Math.min(mapWidth / width, mapHeight / height);
        return { x: (mapWidth - width * scale) / 2, y: (mapHeight - height * scale) / 2, scale, turn: 0 };
    },
    handles(trace) {
        const w = trace.width, h = trace.height;
        return { scale: this.point(trace, { x: w, y: h }), rotate: this.point(trace, { x: w / 2, y: -24 / trace.scale }),
            corners: [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: h }, { x: 0, y: h }].map(p => this.point(trace, p)) };
    }
};
