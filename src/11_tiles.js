//==========================================================
// SECTION 19D: TILE PAINTING (MZ TILES AND AUTOTILES)
//==========================================================
// Painting MZ's own tiles in a playtest, autotiles included. Tile ids follow MZ: B-E sheets 0-1023, A5
// 1536+, autotiles from 2048 as kind * 48 + shape. An autotile's shape comes from its neighbours: each
// quarter of the tile takes a piece from the autotile's block, chosen by whether the tiles beside and
// diagonal to that corner are the same kind; the shape is the entry of MZ's own table (Tilemap's floor,
// wall or waterfall table, passed in) with those four pieces. The map edge counts as the same kind.
DocsDoodads.Tiles = {
    B: 0, C: 256, D: 512, E: 768, A5: 1536, A1: 2048, A2: 2816, A3: 4352, A4: 5888, MAX: 8192,
    sheets: ['A1', 'A2', 'A3', 'A4', 'A5', 'B', 'C', 'D', 'E'],

    isAutotile(id) { return id >= this.A1 && id < this.MAX; },
    kind(id) { return Math.floor((id - this.A1) / 48); },
    shape(id) { return (id - this.A1) % 48; },
    make(kind, shape) { return this.A1 + kind * 48 + shape; },
    isA1(id) { return id >= this.A1 && id < this.A2; },
    isA2(id) { return id >= this.A2 && id < this.A3; },
    isA3(id) { return id >= this.A3 && id < this.A4; },
    isA4(id) { return id >= this.A4 && id < this.MAX; },
    isWaterfall(id) { return this.isA1(id) && id >= this.A1 + 192 && this.kind(id) % 2 === 1; },
    isRoof(id) { return this.isA3(id) && this.kind(id) % 16 < 8; },
    isWallTop(id) { return this.isA4(id) && this.kind(id) % 16 < 8; },
    isWallSide(id) { return (this.isA3(id) || this.isA4(id)) && this.kind(id) % 16 >= 8; },
    // 'floor', 'wall', 'waterfall' or null (not an autotile).
    type(id) {
        if (!this.isAutotile(id)) return null;
        if (this.isWaterfall(id)) return 'waterfall';
        if (this.isRoof(id) || this.isWallSide(id)) return 'wall';
        return 'floor';
    },

    // The four pieces [TL, TR, BL, BR] as [x, y] half-tiles in the autotile's block, from its neighbours.
    // n: { l, r, u, d, ul, ur, dl, dr } (true = the same kind there).
    pieces(type, n) {
        if (type === 'waterfall') return [[n.l ? 2 : 0, 0], [n.r ? 1 : 3, 0], [n.l ? 2 : 0, 1], [n.r ? 1 : 3, 1]];
        if (type === 'wall') return [[n.l ? 2 : 0, n.u ? 2 : 0], [n.r ? 1 : 3, n.u ? 2 : 0], [n.l ? 2 : 0, n.d ? 1 : 3], [n.r ? 1 : 3, n.d ? 1 : 3]];
        const corner = (h, v, diag, cx, cy, inner) => (h && v && !diag ? inner : [h ? cx[0] : cx[1], v ? cy[0] : cy[1]]);
        return [
            corner(n.l, n.u, n.ul, [2, 0], [4, 2], [2, 0]),
            corner(n.r, n.u, n.ur, [1, 3], [4, 2], [3, 0]),
            corner(n.l, n.d, n.dl, [2, 0], [3, 5], [2, 1]),
            corner(n.r, n.d, n.dr, [1, 3], [3, 5], [3, 1])
        ];
    },

    // The shape in a table ([[x, y] x 4] per shape) with these pieces; the closest one if none matches.
    shapeFor(pieces, table) {
        if (!Array.isArray(table) || !table.length) return 0;
        let best = 0, bestScore = -1;
        for (let s = 0; s < table.length; s++) {
            const row = table[s];
            let score = 0;
            for (let i = 0; i < 4; i++) if (row[i] && row[i][0] === pieces[i][0] && row[i][1] === pieces[i][1]) score++;
            if (score === 4) return s;
            if (score > bestScore) { bestScore = score; best = s; }
        }
        return best;
    },

    index(w, h, x, y, z) { return (z * h + y) * w + x; },

    // The autotile at (x, y, z) with its shape worked out again from the tiles around it.
    // map: { width, height, data, loopX, loopY }; tables: { floor, wall, waterfall }.
    reshape(map, x, y, z, tables) {
        const W = map.width, H = map.height;
        const id = Number(map.data[this.index(W, H, x, y, z)]) || 0;
        const type = this.type(id);
        if (!type) return id;
        const k = this.kind(id);
        const same = (dx, dy) => {
            let tx = x + dx, ty = y + dy;
            if (map.loopX) tx = (tx % W + W) % W;
            if (map.loopY) ty = (ty % H + H) % H;
            if (tx < 0 || ty < 0 || tx >= W || ty >= H) return true;
            const other = Number(map.data[this.index(W, H, tx, ty, z)]) || 0;
            return this.isAutotile(other) && this.kind(other) === k;
        };
        const n = { l: same(-1, 0), r: same(1, 0), u: same(0, -1), d: same(0, 1), ul: same(-1, -1), ur: same(1, -1), dl: same(-1, 1), dr: same(1, 1) };
        const table = tables && tables[type];
        return this.make(k, this.shapeFor(this.pieces(type, n), table));
    },

    // Which layer a picked tile goes on when the layer is 'auto': ground autotiles and A5 on 0 (A1's
    // rocks and A2's overlays on 1), B-E on the upper layers (2, or 3 over a tile already on 2).
    autoLayer(id, upperBusy) {
        if (this.isAutotile(id)) {
            const k = this.kind(id);
            if (this.isA1(id) && (k === 2 || k === 3)) return 1;
            return 0;
        }
        if (id >= this.A5) return 0;
        return upperBusy ? 3 : 2;
    },

    // What painting does: [{ index, before, after }] for a brush of tiles (ids: rows of tile ids, a
    // rectangle picked from the palette) with its top-left at (x, y). layer: 0-3 or 'auto'; erase clears.
    paint(map, x, y, brush, tables) {
        const W = map.width, H = map.height;
        const changes = new Map();
        const get = i => (changes.has(i) ? changes.get(i).after : Number(map.data[i]) || 0);
        const set = (i, v) => {
            const before = changes.has(i) ? changes.get(i).before : Number(map.data[i]) || 0;
            changes.set(i, { index: i, before, after: v });
        };
        const view = { width: W, height: H, loopX: map.loopX, loopY: map.loopY, data: { length: W * H * 6 } };
        view.data = new Proxy({}, { get: (t, k) => (k === 'length' ? W * H * 6 : get(Number(k))) });
        const touched = [];
        const rows = brush.erase ? [[0]] : brush.ids;
        for (let r = 0; r < rows.length; r++) {
            for (let c = 0; c < rows[r].length; c++) {
                const tx = x + c, ty = y + r;
                if (tx < 0 || ty < 0 || tx >= W || ty >= H) continue;
                const id = brush.erase ? 0 : Number(rows[r][c]) || 0;
                if (brush.erase) {
                    // The eraser takes the top tile off (the layer picked, or the highest one used).
                    const layers = brush.layer === 'auto' || brush.layer === undefined ? [3, 2, 1, 0] : [Number(brush.layer)];
                    const z = layers.find(l => get(this.index(W, H, tx, ty, l)) !== 0);
                    if (z === undefined) continue;
                    set(this.index(W, H, tx, ty, z), 0);
                    touched.push([tx, ty, z]);
                    continue;
                }
                let z = brush.layer === 'auto' || brush.layer === undefined ? null : Number(brush.layer);
                if (z === null) {
                    const upper2 = get(this.index(W, H, tx, ty, 2));
                    z = this.autoLayer(id, upper2 !== 0 && upper2 !== id);
                    // A third upper tile: the one on 3 moves down to 2 and the new one goes on top.
                    if (z === 3) {
                        const on3 = get(this.index(W, H, tx, ty, 3));
                        if (on3 && on3 !== id) set(this.index(W, H, tx, ty, 2), on3);
                    }
                }
                set(this.index(W, H, tx, ty, z), id);
                touched.push([tx, ty, z]);
            }
        }
        // Autotiles painted and the ones around them take their shapes from their new neighbours.
        const again = new Set();
        for (const [tx, ty, z] of touched) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    let nx = tx + dx, ny = ty + dy;
                    if (map.loopX) nx = (nx % W + W) % W;
                    if (map.loopY) ny = (ny % H + H) % H;
                    if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
                    again.add(nx + ',' + ny + ',' + z);
                }
            }
        }
        for (const key of again) {
            const [nx, ny, z] = key.split(',').map(Number);
            const i = this.index(W, H, nx, ny, z);
            const id = get(i);
            if (!this.isAutotile(id)) continue;
            const next = this.reshape(view, nx, ny, z, tables);
            if (next !== id) set(i, next);
        }
        return Array.from(changes.values()).filter(c => c.before !== c.after);
    },

    // The top tile at a spot, for picking it up: { id, layer } (null when the spot is empty).
    topAt(map, x, y) {
        for (const z of [3, 2, 1, 0]) {
            const id = Number(map.data[this.index(map.width, map.height, x, y, z)]) || 0;
            if (id) return { id: this.isAutotile(id) ? this.make(this.kind(id), 0) : id, layer: z };
        }
        return null;
    },

    // ---- The palette: tiles on the tileset pictures ----
    // Where an autotile kind's sample sits on its sheet (tiles), as MZ draws it (first animation frame).
    kindPosition(kind) {
        const tx = kind % 8, ty = Math.floor(kind / 8);
        if (kind < 16) {
            if (kind === 0) return { sheet: 0, x: 0, y: 0 };
            if (kind === 1) return { sheet: 0, x: 0, y: 3 };
            if (kind === 2) return { sheet: 0, x: 6, y: 0 };
            if (kind === 3) return { sheet: 0, x: 6, y: 3 };
            let bx = Math.floor(tx / 4) * 8;
            const by = ty * 6 + (Math.floor(tx / 2) % 2) * 3;
            bx += kind % 2 === 0 ? 0 : 6;
            return { sheet: 0, x: bx, y: by };
        }
        if (kind < 48) return { sheet: 1, x: tx * 2, y: (ty - 2) * 3 };
        if (kind < 80) return { sheet: 2, x: tx * 2, y: (ty - 6) * 2 };
        return { sheet: 3, x: tx * 2, y: Math.floor((ty - 10) * 2.5 + (ty % 2 === 1 ? 0.5 : 0)) };
    },

    // The tile id under a tile position on a sheet (0 A1 ... 8 E), or 0.
    idAt(sheet, x, y) {
        if (x < 0 || y < 0) return 0;
        if (sheet >= 5) return (sheet - 5) * 256 + (x >= 8 ? 128 : 0) + y * 8 + (x % 8);
        if (sheet === 4) return x < 8 && y < 16 ? this.A5 + y * 8 + x : 0;
        // Autotiles: the block the position falls in.
        const kinds = sheet === 0 ? 16 : sheet === 1 ? 32 : 48;
        const first = sheet === 0 ? 0 : sheet === 1 ? 16 : sheet === 2 ? 48 : 80;
        for (let k = first; k < first + kinds; k++) {
            const p = this.kindPosition(k);
            if (p.sheet !== sheet) continue;
            const wide = sheet === 0 && k >= 4 && k % 2 === 1 ? 2 : 2;
            const tall = sheet === 2 || (sheet === 3 && Math.floor(k / 8) % 2 === 1) ? 2 : 3;
            if (x >= p.x && x < p.x + wide && y >= p.y && y < p.y + tall) return this.make(k, 0);
        }
        return 0;
    },

    // The sheet a tile id is on (0 A1 ... 8 E).
    sheetOf(id) {
        if (id >= this.A4) return 3;
        if (id >= this.A3) return 2;
        if (id >= this.A2) return 1;
        if (id >= this.A1) return 0;
        if (id >= this.A5) return 4;
        return 5 + Math.floor(id / 256);
    }
};
