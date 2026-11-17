//==========================================================
// SECTION 4I: SEEDED BIOME AND DRESSING PLANS (GAME-SAFE CORE)
//==========================================================
// The editor's full placement tools replace these same objects later in a full build. The game-only build
// keeps the pure candidates used when a generated map is materialized from its seed.
DocsDoodads.Scatter = DocsDoodads.Scatter || {
    rng(seed) { return DocsDoodads.Generate.rng(seed); },
    candidates(center, radius, minDistance, existing, count, rng, maxAttempts) {
        const accepted = [], others = (existing || []).slice(), attempts = maxAttempts || Math.max(30, count * 30);
        for (let i = 0; i < attempts && accepted.length < count; i++) {
            const angle = rng() * Math.PI * 2, distance = radius * Math.sqrt(rng());
            const point = { x: center.x + Math.cos(angle) * distance, y: center.y + Math.sin(angle) * distance };
            if (minDistance > 0 && others.some(other => Math.hypot(other.x - point.x, other.y - point.y) < minDistance)) continue;
            accepted.push(point); others.push(point);
        }
        return accepted;
    }
};

const generatedValueNoise = (x, y) => {
    const hash = (i, j) => { const value = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return value - Math.floor(value); };
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const top = hash(ix, iy) * (1 - sx) + hash(ix + 1, iy) * sx;
    const bottom = hash(ix, iy + 1) * (1 - sx) + hash(ix + 1, iy + 1) * sx;
    return top * (1 - sy) + bottom * sy;
};

DocsDoodads.Biome = {
    normalizeEntry(entry) {
        if (!entry || !entry.path) return null;
        const number = (value, fallback, min, max) => { const n = Number(value); return value === undefined || value === null || value === '' || !isFinite(n) ? fallback : Math.max(min, Math.min(max, n)); };
        const scaleMin = number(entry.scaleMin, 1, 0.1, 5);
        return { path: String(entry.path), weight: number(entry.weight, 1, 0, 100), scaleMin,
            scaleMax: Math.max(scaleMin, number(entry.scaleMax, scaleMin, 0.1, 5)) };
    },
    normalize(biome) {
        biome = biome || {};
        const number = (value, fallback, min, max) => { const n = Number(value); return value === undefined || value === null || value === '' || !isFinite(n) ? fallback : Math.max(min, Math.min(max, n)); };
        return { id: String(biome.id || ''), name: String(biome.name || 'Biome'),
            entries: (Array.isArray(biome.entries) ? biome.entries : []).map(entry => this.normalizeEntry(entry)).filter(Boolean),
            spacing: number(biome.spacing, 40, 4, 500), density: Math.round(number(biome.density, 6, 1, 60)),
            edgeThin: number(biome.edgeThin, 0.5, 0, 1), cluster: number(biome.cluster, 0.3, 0, 1), flip: biome.flip !== false };
    },
    find(id, list) { return (list || []).find(biome => biome && biome.id === id) || null; },
    pickEntry(entries, rng) {
        const total = (entries || []).reduce((sum, entry) => sum + entry.weight, 0);
        if (!(total > 0)) return null;
        let value = rng() * total;
        for (const entry of entries) { value -= entry.weight; if (value < 0) return entry; }
        return entries[entries.length - 1];
    },
    keep(point, center, radius, biome, rng) {
        const distance = Math.min(1, Math.hypot(point.x - center.x, point.y - center.y) / Math.max(1, radius));
        if (biome.cluster > 0 && generatedValueNoise(point.x / 96, point.y / 96) < biome.cluster * 0.6) return false;
        return !(biome.edgeThin > 0 && rng() > 1 - biome.edgeThin * distance * distance);
    },
    paint(biome, center, radius, existing, rng) {
        const points = DocsDoodads.Scatter.candidates(center, radius, biome.spacing, existing, biome.density, rng), out = [];
        for (const point of points) {
            if (!this.keep(point, center, radius, biome, rng)) continue;
            const entry = this.pickEntry(biome.entries, rng);
            if (!entry) continue;
            out.push({ path: entry.path, x: Math.round(point.x), y: Math.round(point.y),
                scale: entry.scaleMin + (entry.scaleMax - entry.scaleMin) * rng(), flipX: biome.flip && rng() < 0.5 });
        }
        return out;
    }
};

DocsDoodads.Dress = {
    places: [{ value: 'waterEdge' }, { value: 'wallBase' }, { value: 'nearRegion' }, { value: 'region' }, { value: 'terrain' }, { value: 'open' }],
    normalize(rule) {
        rule = rule || {};
        const number = (value, fallback, min, max) => { const n = Number(value); return value === undefined || value === null || value === '' || !isFinite(n) ? fallback : Math.max(min, Math.min(max, n)); };
        const spacing = number(rule.spacing, 0, 0, 500);
        return { name: String(rule.name || 'Rule'), where: this.places.some(place => place.value === rule.where) ? rule.where : 'open',
            param: Math.round(number(rule.param, 0, 0, 255)), chance: number(rule.chance, 0.35, 0, 1), spacing,
            minGap: Math.max(spacing, 40), entries: (Array.isArray(rule.entries) ? rule.entries : []).map(entry => DocsDoodads.Biome.normalizeEntry(entry)).filter(Boolean) };
    },
    tilesFor(rule, query) {
        const out = [], inside = (x, y) => x >= 0 && y >= 0 && x < query.width && y < query.height;
        const near4 = (x, y, test) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => inside(x + dx, y + dy) && test(x + dx, y + dy));
        for (let y = 0; y < query.height; y++) for (let x = 0; x < query.width; x++) {
            if (!query.isPassable(x, y) || query.isWater(x, y) || query.hasEvent(x, y) || query.hasGround && !query.hasGround(x, y)) continue;
            let keep = false;
            switch (rule.where) {
                case 'waterEdge': keep = near4(x, y, query.isWater); break;
                case 'wallBase': keep = inside(x, y - 1) && !query.isPassable(x, y - 1) && !query.isWater(x, y - 1); break;
                case 'nearRegion': keep = query.regionId(x, y) !== rule.param && near4(x, y, (a, b) => query.regionId(a, b) === rule.param); break;
                case 'region': keep = query.regionId(x, y) === rule.param; break;
                case 'terrain': keep = query.terrainTag(x, y) === rule.param; break;
                default: keep = query.regionId(x, y) === 0;
            }
            if (keep) out.push({ x, y });
        }
        return out;
    },
    plan(rules, query, existing, tileW, tileH, rng) {
        const out = [], taken = (existing || []).map(point => ({ x: point.x, y: point.y, old: true }));
        for (const source of rules || []) {
            const rule = this.normalize(source);
            if (!rule.entries.length || rule.chance <= 0) continue;
            for (const tile of this.tilesFor(rule, query)) {
                if (rng() >= rule.chance) continue;
                const point = { x: (tile.x + 0.25 + 0.5 * rng()) * tileW, y: (tile.y + 0.6 + 0.35 * rng()) * tileH };
                if (taken.some(other => Math.hypot(other.x - point.x, other.y - point.y) < (other.old ? rule.minGap : rule.spacing))) continue;
                const entry = DocsDoodads.Biome.pickEntry(rule.entries, rng);
                const placement = { path: entry.path, x: Math.round(point.x), y: Math.round(point.y),
                    scale: entry.scaleMin + (entry.scaleMax - entry.scaleMin) * rng(), flipX: rng() < 0.5, rule: rule.name };
                out.push(placement); taken.push({ x: placement.x, y: placement.y, old: false });
            }
        }
        return out;
    }
};
