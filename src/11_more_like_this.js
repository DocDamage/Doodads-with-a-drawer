// @editor-only
//==========================================================
// SECTION 4G2: MORE LIKE THIS (8.3.3)
//==========================================================
// Generate.learn reads a sample of the map: which ground kinds (an autotile's kind, not its shape; any other tile
// as itself) sit beside which in each of the four directions, how often each appears, and, for doodads, how many of
// each picture stand on each ground kind and how far apart. Generate.fill fills a region the same way by wave
// function collapse over the kinds (MZ's autotile shapes are picked afterwards by Tiles.paint), restarting a small
// area round a dead end, within a step limit; then scatters the doodads by what was learned. Seeded.
Object.assign(DocsDoodads.Generate, {
    dirs: [[1, 0], [0, 1], [-1, 0], [0, -1]],
    minSample: 4,

    kindOf(id) {
        const T = DocsDoodads.Tiles;
        id = Number(id) || 0;
        return T.isAutotile(id) ? 'a' + T.kind(id) : 't' + id;
    },

    idOfKind(kind) {
        return kind[0] === 'a' ? DocsDoodads.Tiles.make(Number(kind.slice(1)), 0) : Number(kind.slice(1)) || 0;
    },

    // sample: { w, h, tiles: [ids, row by row], doodads: [{ path, x, y (tile), frameW, frameH, scale }] }.
    learn(sample) {
        const w = Math.floor(Number(sample && sample.w) || 0), h = Math.floor(Number(sample && sample.h) || 0);
        if (w * h < this.minSample || w < 2 || h < 2) return { error: 'The sample is too small: lasso at least 2 × 2 tiles.' };
        const kinds = sample.tiles.map(id => this.kindOf(id));
        const weights = {}, rules = {};
        for (const k of kinds) weights[k] = (weights[k] || 0) + 1;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
            const a = kinds[y * w + x];
            rules[a] = rules[a] || [{}, {}, {}, {}];
            this.dirs.forEach(([dx, dy], d) => {
                const nx = x + dx, ny = y + dy;
                if (nx < 0 || ny < 0 || nx >= w || ny >= h) return;
                const b = kinds[ny * w + nx];
                rules[a][d][b] = (rules[a][d][b] || 0) + 1;
            });
        }
        // Doodads as a biome: per ground kind, each picture's count per tile and the closest spacing seen.
        const biome = {};
        const pts = (sample.doodads || []).filter(d => d && d.path && d.x >= 0 && d.y >= 0 && d.x < w && d.y < h);
        for (const d of pts) {
            const k = kinds[d.y * w + d.x];
            const entry = ((biome[k] = biome[k] || {})[d.path] = biome[k][d.path] || { count: 0, spacing: Infinity, frameW: d.frameW, frameH: d.frameH, scale: d.scale || 1 });
            entry.count++;
            for (const o of pts) if (o !== d && o.path === d.path) entry.spacing = Math.min(entry.spacing, Math.hypot(o.x - d.x, o.y - d.y));
        }
        for (const k of Object.keys(biome)) for (const p of Object.keys(biome[k])) {
            const e = biome[k][p];
            e.density = e.count / weights[k];
            e.spacing = Number.isFinite(e.spacing) ? Math.max(0.5, e.spacing) : 1;
        }
        return { kinds: Object.keys(weights), weights, rules, biome };
    },

    allowed(model, a, d, b) {
        const r = model.rules[a];
        return Boolean(r && r[d][b]);
    },

    // region: { w, h, fixed: (x, y) → kind or null (tiles round the region stay as they are) }. → { cells: [kind],
    // steps, restarts } or { error }.
    fill(region, model, rng, opts = {}) {
        if (!model || model.error) return { error: (model && model.error) || 'Nothing learned yet.' };
        const w = region.w, h = region.h, n = w * h, all = model.kinds;
        const maxSteps = opts.maxSteps || n * 40, maxRestarts = opts.maxRestarts || 200;
        const domain = new Array(n);
        const reset = i => { domain[i] = new Set(all); };
        for (let i = 0; i < n; i++) reset(i);
        const fixedAt = (x, y) => (region.fixed ? region.fixed(x, y) : null);
        // Narrows a cell by its four neighbours (in the region, or fixed outside it). Returns false on a dead end.
        const narrow = i => {
            const x = i % w, y = Math.floor(i / w);
            const keep = new Set();
            for (const a of domain[i]) {
                let ok = true;
                for (let d = 0; d < 4 && ok; d++) {
                    const nx = x + this.dirs[d][0], ny = y + this.dirs[d][1];
                    let options;
                    if (nx < 0 || ny < 0 || nx >= w || ny >= h) { const f = fixedAt(nx, ny); options = f && model.rules[f] ? [f] : null; }
                    else options = Array.from(domain[ny * w + nx]);
                    if (options && !options.some(b => this.allowed(model, a, d, b))) ok = false;
                }
                if (ok) keep.add(a);
            }
            const changed = keep.size !== domain[i].size;
            domain[i] = keep;
            return { ok: keep.size > 0, changed };
        };
        const propagate = start => {
            const queue = start.slice(), seen = new Set(), first = new Set(start);
            while (queue.length) {
                const i = queue.shift();
                seen.delete(i);
                const r = narrow(i);
                if (!r.ok) return i;
                const wasFirst = first.delete(i);
                if (!r.changed && !wasFirst) continue;
                const x = i % w, y = Math.floor(i / w);
                for (const [dx, dy] of this.dirs) {
                    const nx = x + dx, ny = y + dy;
                    if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
                    const j = ny * w + nx;
                    if (domain[j].size > 1 && !seen.has(j)) { seen.add(j); queue.push(j); }
                }
            }
            return -1;
        };
        let steps = 0, restarts = 0;
        const border = [];
        for (let i = 0; i < n; i++) border.push(i);
        let dead = propagate(border);
        const restartAround = i => {
            restarts++;
            const x = i % w, y = Math.floor(i / w), r = 2 + Math.min(4, Math.floor(restarts / 10));
            const cleared = [];
            for (let yy = Math.max(0, y - r); yy <= Math.min(h - 1, y + r); yy++) for (let xx = Math.max(0, x - r); xx <= Math.min(w - 1, x + r); xx++) { reset(yy * w + xx); cleared.push(yy * w + xx); }
            return propagate(cleared);
        };
        while (dead >= 0 && restarts < maxRestarts) dead = restartAround(dead);
        while (steps < maxSteps) {
            if (dead >= 0) { if (restarts >= maxRestarts) return { error: 'No fill fits this sample here; try a bigger sample or another region.' }; dead = restartAround(dead); continue; }
            // The open cell with the fewest choices (ties by the seed).
            let best = -1, fewest = Infinity;
            for (let i = 0; i < n; i++) {
                const s = domain[i].size;
                if (s > 1 && (s < fewest || (s === fewest && rng() < 0.5))) { fewest = s; best = i; }
            }
            if (best < 0) break;
            steps++;
            const options = Array.from(domain[best]).sort();
            let total = options.reduce((a, k) => a + (model.weights[k] || 1), 0), pick = rng() * total, choice = options[0];
            for (const k of options) { pick -= model.weights[k] || 1; if (pick <= 0) { choice = k; break; } }
            domain[best] = new Set([choice]);
            dead = propagate([best]);
        }
        if (steps >= maxSteps) return { error: 'The fill took too many steps; try a smaller region.' };
        return { cells: domain.map(s => Array.from(s)[0]), steps, restarts };
    },

    // Doodads for a filled region by the learned biome: [{ path, x, y (tile), frameW, frameH, scale }].
    scatterLearned(cells, w, h, model, rng) {
        const out = [];
        for (let i = 0; i < cells.length; i++) {
            const entries = model.biome[cells[i]];
            if (!entries) continue;
            const x = i % w, y = Math.floor(i / w);
            for (const [path, e] of Object.entries(entries)) {
                if (rng() >= e.density) continue;
                if (out.some(o => o.path === path && Math.hypot(o.x - x, o.y - y) < e.spacing)) continue;
                out.push({ path, x, y, frameW: e.frameW, frameH: e.frameH, scale: e.scale });
            }
        }
        return out;
    }
});
