//==========================================================
// SECTION 5G: EDITOR TOOLS (LAYERS, SYMMETRY, BIOMES, DRESSING, HISTORY, PALETTE, THUMBNAILS)
//==========================================================
// Layers are per map (map settings). A doodad's "layer" names one; no layer means Main.
DocsDoodads.Layers = {
    main: { id: 'main', name: 'Main', hidden: false, locked: false, gameHidden: false },

    list(mapSettings) {
        const own = mapSettings && Array.isArray(mapSettings.layers) ? mapSettings.layers.filter(l => l && l.id && l.id !== 'main') : [];
        return [Object.assign({}, this.main, mapSettings && mapSettings.mainLayer)].concat(own);
    },

    of(d) {
        return d && d.layer ? d.layer : 'main';
    },

    find(d, mapSettings) {
        const id = this.of(d);
        return this.list(mapSettings).find(l => l.id === id) || this.list(mapSettings)[0];
    },

    visibleInEditor(d, mapSettings) {
        return !this.find(d, mapSettings).hidden;
    },

    visibleInGame(d, mapSettings) {
        return !this.find(d, mapSettings).gameHidden;
    },

    isLocked(d, mapSettings) {
        return Boolean(this.find(d, mapSettings).locked);
    }
};

// Mirrored copies of a doodad across a vertical (x), horizontal (y) or both axes, in map pixels.
DocsDoodads.Symmetry = {
    modes: [
        { value: 'off', label: 'Off' }, { value: 'x', label: 'Mirror left/right' },
        { value: 'y', label: 'Mirror top/bottom' }, { value: 'xy', label: 'Mirror four ways' }
    ],

    defaultAxes(mapW, mapH, tileW, tileH) {
        return { axisX: mapW * tileW / 2, axisY: mapH * tileH / 2 };
    },

    mirrors(d, sym) {
        if (!sym || !sym.mode || sym.mode === 'off') return [];
        const out = [];
        const copy = (x, y, flip) => {
            const c = JSON.parse(JSON.stringify(d));
            delete c.uid;
            c.x = x;
            c.y = y;
            if (flip) c.scaleX = -(d.scaleX !== undefined ? d.scaleX : 1);
            out.push(c);
        };
        const mx = 2 * sym.axisX - d.x, my = 2 * sym.axisY - d.y;
        const onX = Math.abs(mx - d.x) < 1, onY = Math.abs(my - d.y) < 1;
        if ((sym.mode === 'x' || sym.mode === 'xy') && !onX) copy(mx, d.y, true);
        if ((sym.mode === 'y' || sym.mode === 'xy') && !onY) copy(d.x, my, false);
        if (sym.mode === 'xy' && !onX && !onY) copy(mx, my, true);
        return out;
    }
};

// 2D value noise in [0, 1], for patchy clusters.
const valueNoise2 = (x, y) => {
    const hash = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); };
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const top = hash(ix, iy) * (1 - sx) + hash(ix + 1, iy) * sx;
    const bottom = hash(ix, iy + 1) * (1 - sx) + hash(ix + 1, iy + 1) * sx;
    return top * (1 - sy) + bottom * sy;
};

// Biomes: a weighted mix of art painted with spacing, thinner at the brush edge, in natural patches.
DocsDoodads.Biome = {
    normalizeEntry(e) {
        if (!e || !e.path) return null;
        const num = (v, def, min, max) => { const n = Number(v); return v === undefined || v === null || v === '' || !isFinite(n) ? def : Math.max(min, Math.min(max, n)); };
        const scaleMin = num(e.scaleMin, 1, 0.1, 5);
        return { path: String(e.path), weight: num(e.weight, 1, 0, 100), scaleMin, scaleMax: Math.max(scaleMin, num(e.scaleMax, scaleMin, 0.1, 5)) };
    },

    normalize(b) {
        b = b || {};
        const num = (v, def, min, max) => { const n = Number(v); return v === undefined || v === null || v === '' || !isFinite(n) ? def : Math.max(min, Math.min(max, n)); };
        return {
            id: String(b.id || ''), name: String(b.name || 'Biome'),
            entries: (Array.isArray(b.entries) ? b.entries : []).map(e => this.normalizeEntry(e)).filter(Boolean),
            spacing: num(b.spacing, 40, 4, 500), density: Math.round(num(b.density, 6, 1, 60)),
            edgeThin: num(b.edgeThin, 0.5, 0, 1), cluster: num(b.cluster, 0.3, 0, 1),
            flip: b.flip !== false
        };
    },

    find(id, list) {
        return (list || []).find(b => b && b.id === id) || null;
    },

    pickEntry(entries, rng) {
        const total = (entries || []).reduce((n, e) => n + e.weight, 0);
        if (!(total > 0)) return null;
        let r = rng() * total;
        for (const e of entries) {
            r -= e.weight;
            if (r < 0) return e;
        }
        return entries[entries.length - 1];
    },

    keep(point, center, radius, biome, rng) {
        const d = Math.min(1, Math.hypot(point.x - center.x, point.y - center.y) / Math.max(1, radius));
        if (biome.cluster > 0 && valueNoise2(point.x / 96, point.y / 96) < biome.cluster * 0.6) return false;
        if (biome.edgeThin > 0 && rng() > 1 - biome.edgeThin * d * d) return false;
        return true;
    },

    // One dab of the brush: placements { path, x, y, scale, flipX }.
    paint(biome, center, radius, existing, rng) {
        const points = DocsDoodads.Scatter.candidates(center, radius, biome.spacing, existing, biome.density, rng);
        const out = [];
        for (const p of points) {
            if (!this.keep(p, center, radius, biome, rng)) continue;
            const entry = this.pickEntry(biome.entries, rng);
            if (!entry) continue;
            out.push({ path: entry.path, x: Math.round(p.x), y: Math.round(p.y),
                scale: entry.scaleMin + (entry.scaleMax - entry.scaleMin) * rng(), flipX: biome.flip && rng() < 0.5 });
        }
        return out;
    }
};

// Map dressing rules: where props belong, read from the tiles.
DocsDoodads.Dress = {
    places: [
        { value: 'waterEdge', label: 'Along water edges' },
        { value: 'wallBase', label: 'At the foot of walls and cliffs' },
        { value: 'nearRegion', label: 'Beside a region (paths, roads)' },
        { value: 'region', label: 'Inside a region' },
        { value: 'terrain', label: 'On a terrain tag' },
        { value: 'open', label: 'Open ground' }
    ],

    normalize(rule) {
        rule = rule || {};
        const num = (v, def, min, max) => { const n = Number(v); return v === undefined || v === null || v === '' || !isFinite(n) ? def : Math.max(min, Math.min(max, n)); };
        const spacing = num(rule.spacing, 0, 0, 500);
        return {
            name: String(rule.name || 'Rule'),
            where: this.places.some(p => p.value === rule.where) ? rule.where : 'open',
            param: Math.round(num(rule.param, 0, 0, 255)),
            chance: num(rule.chance, 0.35, 0, 1),
            spacing,
            // Keeps clear of props already on the map, so dressing twice never stacks.
            minGap: Math.max(spacing, 40),
            entries: (Array.isArray(rule.entries) ? rule.entries : []).map(e => DocsDoodads.Biome.normalizeEntry(e)).filter(Boolean)
        };
    },

    // query: { width, height, isWater(x,y), isPassable(x,y), regionId(x,y), terrainTag(x,y), hasEvent(x,y), hasGround(x,y)? }
    tilesFor(rule, q) {
        const out = [];
        const inside = (x, y) => x >= 0 && y >= 0 && x < q.width && y < q.height;
        const near4 = (x, y, test) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => inside(x + dx, y + dy) && test(x + dx, y + dy));
        for (let y = 0; y < q.height; y++) {
            for (let x = 0; x < q.width; x++) {
                if (!q.isPassable(x, y) || q.isWater(x, y) || q.hasEvent(x, y)) continue;
                if (q.hasGround && !q.hasGround(x, y)) continue;
                let ok = false;
                switch (rule.where) {
                    case 'waterEdge': ok = near4(x, y, q.isWater); break;
                    case 'wallBase': ok = inside(x, y - 1) && !q.isPassable(x, y - 1) && !q.isWater(x, y - 1); break;
                    case 'nearRegion': ok = q.regionId(x, y) !== rule.param && near4(x, y, (a, b) => q.regionId(a, b) === rule.param); break;
                    case 'region': ok = q.regionId(x, y) === rule.param; break;
                    case 'terrain': ok = q.terrainTag(x, y) === rule.param; break;
                    default: ok = q.regionId(x, y) === 0;
                }
                if (ok) out.push({ x, y });
            }
        }
        return out;
    },

    // Placements for every rule: { path, x, y, scale, flipX, rule }.
    plan(rules, q, existing, tileW, tileH, rng) {
        const out = [];
        const taken = (existing || []).map(p => ({ x: p.x, y: p.y, old: true }));
        for (const raw of rules || []) {
            const rule = this.normalize(raw);
            if (!rule.entries.length || rule.chance <= 0) continue;
            for (const t of this.tilesFor(rule, q)) {
                if (rng() >= rule.chance) continue;
                const p = { x: (t.x + 0.25 + 0.5 * rng()) * tileW, y: (t.y + 0.6 + 0.35 * rng()) * tileH };
                const crowded = taken.some(o => Math.hypot(o.x - p.x, o.y - p.y) < (o.old ? rule.minGap : rule.spacing));
                if (crowded) continue;
                const entry = DocsDoodads.Biome.pickEntry(rule.entries, rng);
                const placement = { path: entry.path, x: Math.round(p.x), y: Math.round(p.y),
                    scale: entry.scaleMin + (entry.scaleMax - entry.scaleMin) * rng(), flipX: rng() < 0.5, rule: rule.name };
                out.push(placement);
                taken.push({ x: placement.x, y: placement.y, old: false });
            }
        }
        return out;
    }
};

// What changed since a backup: doodads matched by uid (or art and position for older data), events by id.
DocsDoodads.History = {
    doodadKey(d) {
        return d.uid ? 'uid:' + d.uid : 'at:' + (d.bit ? d.bit[1] : '') + '@' + Math.round(d.x) + ',' + Math.round(d.y);
    },

    diffDoodads(current, backup) {
        const out = { added: [], removed: [], changed: [], unchanged: 0 };
        const before = new Map();
        for (const d of backup || []) if (d) before.set(this.doodadKey(d), d);
        const seen = new Set();
        for (const d of current || []) {
            if (!d) continue;
            const key = this.doodadKey(d);
            const old = before.get(key);
            if (!old) {
                out.added.push(d);
                continue;
            }
            seen.add(key);
            if (JSON.stringify(old) === JSON.stringify(d)) out.unchanged++;
            else out.changed.push({ current: d, backup: old });
        }
        for (const [key, d] of before) if (!seen.has(key)) out.removed.push(d);
        return out;
    },

    diffEvents(current, backup) {
        const out = { added: [], removed: [], changed: [], unchanged: 0 };
        const byId = list => new Map((list || []).filter(Boolean).map(e => [e.id, e]));
        const now = byId(current), then = byId(backup);
        for (const [id, e] of now) {
            const old = then.get(id);
            if (!old) out.added.push(e);
            else if (JSON.stringify(old) === JSON.stringify(e)) out.unchanged++;
            else out.changed.push({ current: e, backup: old });
        }
        for (const [id, e] of then) if (!now.has(id)) out.removed.push(e);
        return out;
    },

    backupLabel(backup) {
        const date = new Date(backup.mtimeMs || 0);
        const pad = n => String(n).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    }
};

// Ctrl+K: letters in order match; word starts and unbroken runs score higher.
DocsDoodads.CommandPalette = {
    score(query, label) {
        const q = String(query || '').toLowerCase().replace(/\s+/g, ' ').trim();
        const text = String(label || '').toLowerCase();
        if (!q) return 0;
        let score = 0, ti = 0, run = 0;
        for (const ch of q) {
            if (ch === ' ') { run = 0; continue; }
            const found = text.indexOf(ch, ti);
            if (found < 0) return -1;
            const wordStart = found === 0 || /[^a-z0-9]/.test(text[found - 1]);
            run = found === ti && ti > 0 ? run + 1 : 0;
            score += 1 + (wordStart ? 6 : 0) + run * 3 - Math.min(5, found - ti) * 0.2;
            ti = found + 1;
        }
        if (text.indexOf(q) >= 0) score += 15;
        return score - text.length * 0.01;
    },

    rank(query, items, limit) {
        return (items || [])
            .map(item => ({ item, score: this.score(query, item.label) }))
            .filter(r => r.score >= 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit || 50)
            .map(r => r.item);
    }
};

// Drawer thumbnails that play on hover: character walk cycles and equal-sized slice strips.
DocsDoodads.AnimatedThumb = {
    framesFor(asset) {
        if (!asset || !asset.width || !asset.height) return null;
        const path = String(asset.path || '').toLowerCase();
        const name = String(asset.fileName || '').replace(/\.[^.]+$/, '');
        const walk = [0, 1, 2, 1];
        if (path.indexOf('img/characters/') === 0) {
            const parsed = DocsDoodads.CharacterAnim.parseName(name);
            if (parsed.tagged) {
                const w = asset.width / parsed.frames, h = asset.height / parsed.dirs;
                return Array.from({ length: parsed.frames }, (_, i) => ({ x: i * w, y: 0, w, h }));
            }
            const big = asset.type === 'single_character' || name.startsWith('$') || name.startsWith('!$');
            const blockW = big ? asset.width : asset.width / 4, blockH = big ? asset.height : asset.height / 2;
            const w = blockW / 3, h = blockH / 4;
            return walk.map(i => ({ x: i * w, y: 0, w, h }));
        }
        const regions = asset.slice && Array.isArray(asset.slice.regions) ? asset.slice.regions : [];
        if (regions.length < 2) return null;
        const w = regions[0].w, h = regions[0].h;
        if (!regions.every(r => r.w === w && r.h === h)) return null;
        return regions.slice(0, 64).map(r => ({ x: r.x, y: r.y, w, h }));
    }
};

