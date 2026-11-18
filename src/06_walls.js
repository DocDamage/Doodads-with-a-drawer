//==========================================================
// SECTION 6C: FINE-CELL COLLISION WALLS
//==========================================================
// Painted walls are stored as readable run-length encoded rows. The decoded grid is deliberately
// plain game logic: play uses it without loading any editor part.
DocsDoodads.Walls = {
    defaultCell: 12,
    maxCells: 4194304,

    blank(w, h, cell = 12, options = {}) {
        const rawW = Number(w), rawH = Number(h), rawCell = Number(cell);
        let width = Number.isFinite(rawW) ? Math.max(0, Math.min(8192, Math.round(rawW))) : 0;
        let height = Number.isFinite(rawH) ? Math.max(0, Math.min(8192, Math.round(rawH))) : 0;
        // A damaged or hand-edited file must not be able to allocate an unbounded grid at boot.
        if (width * height > this.maxCells) { width = 0; height = 0; }
        return {
            cell: Number.isFinite(rawCell) ? Math.max(1, Math.min(1024, Math.round(rawCell))) : this.defaultCell,
            w: width,
            h: height,
            cells: Array.from({ length: height }, () => new Uint8Array(width)),
            loopX: Boolean(options.loopX),
            loopY: Boolean(options.loopY)
        };
    },

    // Rows use a count followed by . (open) or # (blocked); a run of one leaves its count out.
    encode(grid) {
        const g = grid && grid.cells ? grid : this.decode(grid);
        if (!g) return null;
        const rows = [];
        for (let y = 0; y < g.h; y++) {
            let row = '', value = -1, count = 0;
            const flush = () => {
                if (!count) return;
                row += (count > 1 ? String(count) : '') + (value ? '#' : '.');
            };
            for (let x = 0; x < g.w; x++) {
                const next = g.cells[y] && g.cells[y][x] ? 1 : 0;
                if (next === value) count++;
                else { flush(); value = next; count = 1; }
            }
            flush();
            rows.push(row || (g.w > 1 ? String(g.w) : '') + '.');
        }
        return { cell: g.cell, w: g.w, h: g.h, rows };
    },

    decode(saved, options = {}) {
        if (!saved || typeof saved !== 'object') return null;
        if (saved.cells) {
            saved.loopX = options.loopX !== undefined ? Boolean(options.loopX) : Boolean(saved.loopX);
            saved.loopY = options.loopY !== undefined ? Boolean(options.loopY) : Boolean(saved.loopY);
            return saved;
        }
        const g = this.blank(saved.w, saved.h, saved.cell, options);
        for (let y = 0; y < g.h; y++) {
            const text = String((saved.rows || [])[y] || '');
            let x = 0;
            text.replace(/(\d*)([.#])/g, (all, number, mark) => {
                const count = Math.max(1, Number(number) || 1);
                if (mark === '#') for (let n = 0; n < count && x + n < g.w; n++) g.cells[y][x + n] = 1;
                x += count;
                return all;
            });
        }
        return g;
    },

    loopOptions(mapId) {
        const map = typeof $gameMap !== 'undefined' && $gameMap && Number($gameMap.mapId()) === Number(mapId) ? $gameMap : null;
        return {
            loopX: Boolean(map && map.isLoopHorizontal && map.isLoopHorizontal()),
            loopY: Boolean(map && map.isLoopVertical && map.isLoopVertical())
        };
    },

    get(mapId) {
        const all = typeof $dataDocsDoodads !== 'undefined' && $dataDocsDoodads ? $dataDocsDoodads.walls : null;
        const raw = all && all[mapId];
        if (!raw) return null;
        const loops = this.loopOptions(mapId);
        const cached = this._cache && this._cache.raw === raw && this._cache.loopX === loops.loopX && this._cache.loopY === loops.loopY ? this._cache.grid : null;
        if (cached) return cached;
        const grid = this.decode(raw, loops);
        this._cache = { raw, loopX: loops.loopX, loopY: loops.loopY, grid };
        return grid;
    },

    isEmpty(grid) {
        if (!grid) return true;
        const g = grid.cells ? grid : this.decode(grid);
        for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) if (g.cells[y][x]) return false;
        return true;
    },

    set(mapId, grid) {
        if (typeof window === 'undefined') return null;
        const data = window.$dataDocsDoodads = window.$dataDocsDoodads || {};
        const empty = this.isEmpty(grid);
        if (empty) {
            if (data.walls) {
                delete data.walls[mapId];
                if (Object.keys(data.walls).length === 0) delete data.walls;
            }
            this._cache = null;
            return null;
        }
        data.walls = data.walls || {};
        data.walls[mapId] = this.encode(grid);
        this._cache = null;
        return data.walls[mapId];
    },

    wrapped(value, size) {
        return size > 0 ? ((value % size) + size) % size : value;
    },

    cellCoords(grid, cx, cy) {
        if (!grid) return null;
        let x = Math.floor(Number(cx)), y = Math.floor(Number(cy));
        if (grid.loopX) x = this.wrapped(x, grid.w);
        if (grid.loopY) y = this.wrapped(y, grid.h);
        return x >= 0 && y >= 0 && x < grid.w && y < grid.h ? { x, y } : null;
    },

    getCell(grid, cx, cy) {
        const at = this.cellCoords(grid, cx, cy);
        return Boolean(at && grid.cells[at.y] && grid.cells[at.y][at.x]);
    },

    setCell(grid, cx, cy, blocked) {
        const at = this.cellCoords(grid, cx, cy);
        if (!at) return false;
        const value = blocked ? 1 : 0;
        if (grid.cells[at.y][at.x] === value) return false;
        grid.cells[at.y][at.x] = value;
        return true;
    },

    cellAt(grid, px, py) {
        if (!grid) return false;
        return this.getCell(grid, Math.floor(Number(px) / grid.cell), Math.floor(Number(py) / grid.cell));
    },

    blocksRect(grid, x, y, w, h) {
        if (!grid || !(w > 0) || !(h > 0)) return false;
        const x0 = Math.floor(x / grid.cell), x1 = Math.ceil((x + w) / grid.cell) - 1;
        const y0 = Math.floor(y / grid.cell), y1 = Math.ceil((y + h) / grid.cell) - 1;
        for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) if (this.getCell(grid, cx, cy)) return true;
        return false;
    },

    blocksTile(grid, tx, ty, tw, th) {
        if (!grid) return false;
        const x0 = Math.floor(tx * tw / grid.cell), x1 = Math.ceil((tx + 1) * tw / grid.cell) - 1;
        const y0 = Math.floor(ty * th / grid.cell), y1 = Math.ceil((ty + 1) * th / grid.cell) - 1;
        let blocked = 0, total = 0;
        for (let cy = y0; cy <= y1; cy++) {
            for (let cx = x0; cx <= x1; cx++) {
                total++;
                if (this.getCell(grid, cx, cy)) blocked++;
            }
        }
        return blocked * 2 > total;
    },

    // A step from tile (tx, ty) in direction d (2/4/6/8) is cut by painted cells: no path of free cells,
    // moving up, down, left or right inside the two tiles, joins the middle of one tile to the middle of the
    // other. So a line one cell thick, straight or diagonal, stops a grid move across it. A start with no free
    // middle (a character already standing in a wall) never traps it; a destination with none is blocked.
    blocksStep(grid, tx, ty, d, tw, th) {
        if (!grid) return false;
        const dx = d === 4 ? -1 : d === 6 ? 1 : 0, dy = d === 8 ? -1 : d === 2 ? 1 : 0;
        if (!dx && !dy) return false;
        const c = grid.cell, nx = tx + dx, ny = ty + dy;
        const span = (t, size) => [Math.floor(t * size / c), Math.ceil((t + 1) * size / c) - 1];
        const middle = (t, size) => [Math.floor((t * size + size / 4) / c), Math.max(Math.floor((t * size + size / 4) / c), Math.ceil((t * size + size * 3 / 4) / c) - 1)];
        const [x0] = span(Math.min(tx, nx), tw), [, x1] = span(Math.max(tx, nx), tw);
        const [y0] = span(Math.min(ty, ny), th), [, y1] = span(Math.max(ty, ny), th);
        const w = x1 - x0 + 1, h = y1 - y0 + 1, seen = new Uint8Array(w * h), queue = [];
        const free = (cx, cy) => !this.getCell(grid, cx, cy);
        const block = (t, u) => { const [ax, bx] = middle(t, tw), [ay, by] = middle(u, th); return { ax, bx, ay, by }; };
        const from = block(tx, ty), to = block(nx, ny);
        for (let cy = from.ay; cy <= from.by; cy++) for (let cx = from.ax; cx <= from.bx; cx++) {
            if (free(cx, cy)) { seen[(cy - y0) * w + (cx - x0)] = 1; queue.push([cx, cy]); }
        }
        if (!queue.length) return false;
        let goal = false;
        for (let cy = to.ay; cy <= to.by && !goal; cy++) for (let cx = to.ax; cx <= to.bx; cx++) if (free(cx, cy)) { goal = true; break; }
        if (!goal) return true;
        for (let q = 0; q < queue.length; q++) {
            const [cx, cy] = queue[q];
            if (cx >= to.ax && cx <= to.bx && cy >= to.ay && cy <= to.by) return false;
            for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const ex = cx + ox, ey = cy + oy;
                if (ex < x0 || ey < y0 || ex > x1 || ey > y1) continue;
                const k = (ey - y0) * w + (ex - x0);
                if (seen[k] || !free(ex, ey)) continue;
                seen[k] = 1; queue.push([ex, ey]);
            }
        }
        return true;
    },

    brushCells(grid, cx, cy, radius, shape) {
        const r = Math.max(0, Math.min(16, Math.round(Number(radius) || 0)));
        const out = [], seen = new Set();
        for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
                if (shape === 'round' && dx * dx + dy * dy > (r + 0.35) * (r + 0.35)) continue;
                const at = this.cellCoords(grid, cx + dx, cy + dy);
                if (!at) continue;
                const key = at.x + ',' + at.y;
                if (!seen.has(key)) { seen.add(key); out.push(at); }
            }
        }
        return out;
    },

    line(grid, from, to) {
        let x0 = Math.round(from.x), y0 = Math.round(from.y), x1 = Math.round(to.x), y1 = Math.round(to.y);
        if (grid.loopX) {
            const direct = x1 - x0;
            if (Math.abs(direct) > grid.w / 2) x1 += direct > 0 ? -grid.w : grid.w;
        }
        if (grid.loopY) {
            const direct = y1 - y0;
            if (Math.abs(direct) > grid.h / 2) y1 += direct > 0 ? -grid.h : grid.h;
        }
        const out = [], seen = new Set();
        const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
        const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
        let error = dx + dy;
        while (true) {
            const at = this.cellCoords(grid, x0, y0);
            if (at) {
                const key = at.x + ',' + at.y;
                if (!seen.has(key)) { seen.add(key); out.push(at); }
            }
            if (x0 === x1 && y0 === y1) break;
            const twice = 2 * error;
            if (twice >= dy) { error += dy; x0 += sx; }
            if (twice <= dx) { error += dx; y0 += sy; }
        }
        return out;
    },

    fill(grid, cx, cy, blocked) {
        const start = this.cellCoords(grid, cx, cy);
        if (!start) return 0;
        const target = this.getCell(grid, start.x, start.y);
        if (target === Boolean(blocked)) return 0;
        const queue = [start], seen = new Set([start.x + ',' + start.y]);
        let changed = 0;
        for (let i = 0; i < queue.length; i++) {
            const at = queue[i];
            if (this.getCell(grid, at.x, at.y) !== target) continue;
            if (this.setCell(grid, at.x, at.y, blocked)) changed++;
            for (const next of [[at.x - 1, at.y], [at.x + 1, at.y], [at.x, at.y - 1], [at.x, at.y + 1]]) {
                const n = this.cellCoords(grid, next[0], next[1]);
                if (!n) continue;
                const key = n.x + ',' + n.y;
                if (!seen.has(key)) { seen.add(key); queue.push(n); }
            }
        }
        return changed;
    },

    // Samples the alpha at each destination cell's centre. Repeating picture layers wrap their source.
    fromAlpha(data, width, height, options = {}) {
        const cell = Math.max(1, Math.round(Number(options.cell) || this.defaultCell));
        const mapWidth = Math.max(0, Math.round(Number(options.mapWidth) || width));
        const mapHeight = Math.max(0, Math.round(Number(options.mapHeight) || height));
        const grid = this.blank(Math.ceil(mapWidth / cell), Math.ceil(mapHeight / cell), cell, options);
        const threshold = Math.max(0, Math.min(255, Number(options.threshold) || 0));
        const zoom = Math.max(0.01, Number(options.zoom) || 1);
        for (let cy = 0; cy < grid.h; cy++) {
            for (let cx = 0; cx < grid.w; cx++) {
                let sx = Math.floor((cx * cell + cell / 2) / zoom);
                let sy = Math.floor((cy * cell + cell / 2) / zoom);
                if (options.imageLoopX) sx = this.wrapped(sx, width);
                if (options.imageLoopY) sy = this.wrapped(sy, height);
                if (sx < 0 || sy < 0 || sx >= width || sy >= height) continue;
                if (data[(sy * width + sx) * 4 + 3] >= threshold) grid.cells[cy][cx] = 1;
            }
        }
        return grid;
    }
};
