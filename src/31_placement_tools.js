//==========================================================
// SECTION 19B: PLACEMENT TOOLS (PATHS, SCATTER, GUIDES, PREFABS, MAP LINKS)
//==========================================================
DocsDoodads.Paths = {
    // Catmull-Rom through the clicked points; the ends stay where they were clicked.
    smooth(points, steps = 8) {
        if (!points || points.length < 3) return (points || []).slice();
        const out = [];
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[Math.max(0, i - 1)], p1 = points[i], p2 = points[i + 1], p3 = points[Math.min(points.length - 1, i + 2)];
            for (let s = 0; s < steps; s++) {
                const t = s / steps, t2 = t * t, t3 = t2 * t;
                const f = (a, b, c, d) => 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
                out.push({ x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y) });
            }
        }
        out.push({ x: points[points.length - 1].x, y: points[points.length - 1].y });
        return out;
    },

    angleOf(a, b) {
        return Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
    },

    // Evenly spaced placements along the path. Sharp turns become "corner" pieces at the vertex,
    // and each straight run is spaced so its pieces meet the corners exactly.
    sample(points, spacing, options = {}) {
        const pts = (options.smooth ? this.smooth(points) : points || []).map(p => ({ x: p.x, y: p.y }));
        if (pts.length === 0) return [];
        if (pts.length === 1) return [{ x: pts[0].x, y: pts[0].y, angle: 0, kind: 'start' }];
        spacing = Math.max(4, Number(spacing) || 48);
        const cornerAngle = options.cornerAngle !== undefined ? options.cornerAngle : 35;

        // Split the polyline into runs at sharp vertices.
        const runs = [];
        let run = [pts[0]];
        for (let i = 1; i < pts.length; i++) {
            run.push(pts[i]);
            if (i < pts.length - 1 && !options.smooth) {
                let turn = Math.abs(this.angleOf(pts[i], pts[i + 1]) - this.angleOf(pts[i - 1], pts[i])) % 360;
                if (turn > 180) turn = 360 - turn;
                if (turn >= cornerAngle) {
                    runs.push(run);
                    run = [pts[i]];
                }
            }
        }
        runs.push(run);

        const out = [];
        runs.forEach((r, runIndex) => {
            const lengths = [];
            let total = 0;
            for (let i = 1; i < r.length; i++) {
                const len = Math.hypot(r[i].x - r[i - 1].x, r[i].y - r[i - 1].y);
                lengths.push(len);
                total += len;
            }
            const n = Math.max(1, Math.round(total / spacing));
            const pointAt = (dist) => {
                let seg = 0;
                while (seg < lengths.length - 1 && dist > lengths[seg]) { dist -= lengths[seg]; seg++; }
                const a = r[seg], b = r[seg + 1];
                const k = lengths[seg] > 0 ? Math.min(1, dist / lengths[seg]) : 0;
                return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, angle: this.angleOf(a, b) };
            };
            for (let i = runIndex === 0 ? 0 : 1; i <= n; i++) {
                const p = pointAt(total * i / n);
                const isFirst = runIndex === 0 && i === 0;
                const isLast = runIndex === runs.length - 1 && i === n;
                const kind = isFirst ? 'start' : isLast ? 'end' : i === n ? 'corner' : 'segment';
                out.push({ x: Math.round(p.x * 100) / 100, y: Math.round(p.y * 100) / 100, angle: Math.round(p.angle * 100) / 100, kind });
            }
        });
        return out;
    }
};

DocsDoodads.Scatter = {
    // Small seeded generator so a stroke can be reproduced in tests.
    rng(seed) {
        let a = (Number(seed) || 1) >>> 0;
        return () => {
            a = (a + 0x6D2B79F5) >>> 0;
            let t = a;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    },

    // Poisson-disk style dart throwing: no two props closer than minDistance, existing props included.
    candidates(center, radius, minDistance, existing, count, rng, maxAttempts) {
        const accepted = [];
        const others = (existing || []).slice();
        const attempts = maxAttempts || Math.max(30, count * 30);
        for (let i = 0; i < attempts && accepted.length < count; i++) {
            const angle = rng() * Math.PI * 2;
            const dist = radius * Math.sqrt(rng());
            const p = { x: center.x + Math.cos(angle) * dist, y: center.y + Math.sin(angle) * dist };
            if (minDistance > 0 && others.some(o => Math.hypot(o.x - p.x, o.y - p.y) < minDistance)) continue;
            accepted.push(p);
            others.push(p);
        }
        return accepted;
    },

    parseIdList(text) {
        return String(text || '').split(/[^0-9]+/).filter(Boolean).map(n => parseInt(n, 10)).filter(n => n > 0);
    },

    allowed(point, rules, query) {
        const tw = query.tileWidth || 48, th = query.tileHeight || 48;
        const tx = Math.floor(point.x / tw), ty = Math.floor(point.y / th);
        if (point.x < 0 || point.y < 0 || tx >= query.width || ty >= query.height) return false;
        rules = rules || {};
        if (rules.regions && rules.regions.length > 0 && !rules.regions.includes(query.regionId(tx, ty))) return false;
        if (rules.terrainTags && rules.terrainTags.length > 0 && !rules.terrainTags.includes(query.terrainTag(tx, ty))) return false;
        if (rules.avoidBlocked && !query.isPassable(tx, ty)) return false;
        return true;
    },

    variation(settings, rng) {
        const jitter = (amount) => (rng() * 2 - 1) * (Number(amount) || 0);
        return {
            scale: Math.round((1 + jitter(settings.scaleJitter)) * 100) / 100,
            rotation: Math.round(jitter(settings.rotateJitter)),
            flipX: rng() < (Number(settings.flipChance) || 0),
            hue: Math.round(jitter(settings.hueJitter))
        };
    }
};

DocsDoodads.Guides = {
    rectOf(d) {
        const w = (d.frameW || 48) * Math.abs(d.scaleX !== undefined ? d.scaleX : 1);
        const h = (d.frameH || 48) * Math.abs(d.scaleY !== undefined ? d.scaleY : 1);
        const left = d.x - w * (d.anchorX !== undefined ? d.anchorX : 0.5);
        const top = d.y - h * (d.anchorY !== undefined ? d.anchorY : 1);
        return { left, right: left + w, top, bottom: top + h, cx: left + w / 2, cy: top + h / 2 };
    },

    unionRect(rects) {
        const r = { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity };
        for (const x of rects) {
            r.left = Math.min(r.left, x.left); r.right = Math.max(r.right, x.right);
            r.top = Math.min(r.top, x.top); r.bottom = Math.max(r.bottom, x.bottom);
        }
        r.cx = (r.left + r.right) / 2;
        r.cy = (r.top + r.bottom) / 2;
        return r;
    },

    // Edge/centre alignment first; otherwise equal spacing between the nearest neighbours.
    snap(moving, others, threshold = 6) {
        const result = { dx: 0, dy: 0, lines: [] };
        const m = Object.assign({}, moving);
        if (m.cx === undefined) m.cx = (m.left + m.right) / 2;
        if (m.cy === undefined) m.cy = (m.top + m.bottom) / 2;
        const rects = (others || []).map(o => Object.assign({ cx: (o.left + o.right) / 2, cy: (o.top + o.bottom) / 2 }, o));

        const axis = (keys, crossFrom, crossTo, name) => {
            let best = null;
            for (const o of rects) {
                for (const mk of keys) {
                    for (const ok of keys) {
                        const diff = o[ok] - m[mk];
                        if (Math.abs(diff) <= threshold && (best === null || Math.abs(diff) < Math.abs(best))) best = diff;
                    }
                }
            }
            if (best === null) return null;
            const lines = [];
            for (const o of rects) {
                for (const mk of keys) {
                    for (const ok of keys) {
                        if (Math.abs(o[ok] - (m[mk] + best)) < 0.01) {
                            lines.push({ axis: name, at: o[ok], from: Math.min(o[crossFrom], m[crossFrom]), to: Math.max(o[crossTo], m[crossTo]) });
                        }
                    }
                }
            }
            return { delta: best, lines };
        };

        const spacing = (lo, hi, crossLo, crossHi, name) => {
            const overlapping = rects.filter(o => o[crossLo] < m[crossHi] && o[crossHi] > m[crossLo]);
            const before = overlapping.filter(o => o[hi] <= m[lo]).sort((a, b) => b[hi] - a[hi])[0];
            const after = overlapping.filter(o => o[lo] >= m[hi]).sort((a, b) => a[lo] - b[lo])[0];
            if (!before || !after) return null;
            const gap1 = m[lo] - before[hi], gap2 = after[lo] - m[hi];
            if (Math.abs(gap1 - gap2) > threshold * 2) return null;
            const delta = (gap2 - gap1) / 2;
            const mid = (m[crossLo] + m[crossHi]) / 2;
            return { delta, lines: [
                { axis: name, kind: 'spacing', at: mid, from: before[hi], to: m[lo] + delta },
                { axis: name, kind: 'spacing', at: mid, from: m[hi] + delta, to: after[lo] }
            ] };
        };

        const x = axis(['left', 'cx', 'right'], 'top', 'bottom', 'x') || spacing('left', 'right', 'top', 'bottom', 'x-gap');
        const y = axis(['top', 'cy', 'bottom'], 'left', 'right', 'y') || spacing('top', 'bottom', 'left', 'right', 'y-gap');
        if (x) { result.dx = x.delta; result.lines.push(...x.lines); }
        if (y) { result.dy = y.delta; result.lines.push(...y.lines); }
        return result;
    }
};

DocsDoodads.Prefabs = {
    filePath: 'data/DocsDoodadsPrefabs.json',
    list: [],
    loaded: false,

    load() {
        const data = DocsDoodads.FS.readJson(this.filePath);
        this.list = data && Array.isArray(data.prefabs) ? data.prefabs : [];
        this.loaded = true;
        return this.list;
    },

    ensureLoaded() {
        if (!this.loaded) this.load();
        return this.list;
    },

    save() {
        return DocsDoodads.FS.atomicWriteJson(this.filePath, { version: 1, prefabs: this.list });
    },

    get(id) {
        return this.ensureLoaded().find(p => p.id === id) || null;
    },

    add(prefab) {
        this.ensureLoaded().push(prefab);
        return prefab;
    },

    remove(id) {
        const index = this.ensureLoaded().findIndex(p => p.id === id);
        if (index >= 0) this.list.splice(index, 1);
        return index >= 0;
    },

    newId(prefix) {
        return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    },

    cleanDoodad(d) {
        const copy = JSON.parse(JSON.stringify(d));
        for (const key of ['groupId', 'prefabRef', 'locked', 'uid', 'mirrorOf', 'editorHidden']) delete copy[key];
        return copy;
    },

    // The origin is the bottom-centre of the doodads' anchor points; events keep tile offsets from it.
    originFor(doodads, events, tw, th) {
        if (doodads.length > 0) {
            const xs = doodads.map(d => d.x), ys = doodads.map(d => d.y);
            return { x: Math.round((Math.min(...xs) + Math.max(...xs)) / 2), y: Math.max(...ys) };
        }
        if (events.length > 0) {
            const xs = events.map(e => e.x), ys = events.map(e => e.y);
            return { x: Math.round((Math.min(...xs) + Math.max(...xs)) / 2 * tw + tw / 2), y: (Math.max(...ys) + 1) * th };
        }
        return { x: 0, y: 0 };
    },

    capture(name, doodads, events, options = {}) {
        const tw = options.tileWidth || 48, th = options.tileHeight || 48;
        doodads = (doodads || []).filter(Boolean);
        events = (events || []).filter(Boolean);
        const origin = this.originFor(doodads, events, tw, th);
        const originTile = { x: Math.floor(origin.x / tw), y: Math.floor((origin.y - 1) / th) };
        const first = doodads.find(d => d.bit && d.bit[0] === 3);
        return {
            id: this.newId('pf_'),
            name: String(name || 'Prefab').trim() || 'Prefab',
            createdAt: Date.now(),
            origin,
            thumbnail: first ? first.bit[1] : '',
            doodads: doodads.map(d => Object.assign(this.cleanDoodad(d), { x: d.x - origin.x, y: d.y - origin.y })),
            events: events.map(e => Object.assign(JSON.parse(JSON.stringify(e)), { dx: e.x - originTile.x, dy: e.y - originTile.y }))
        };
    },

    instantiate(prefab, at, options = {}) {
        const tw = options.tileWidth || 48, th = options.tileHeight || 48;
        const instance = options.instance || this.newId('pi_');
        const groupId = options.groupId || ('grp_' + instance);
        const atTile = { x: Math.floor(at.x / tw), y: Math.floor((at.y - 1) / th) };
        const doodads = (prefab.doodads || []).map(src => {
            const d = JSON.parse(JSON.stringify(src));
            d.x = Math.round(at.x + src.x);
            d.y = Math.round(at.y + src.y);
            d.groupId = groupId;
            d.prefabRef = { id: prefab.id, instance, ox: at.x, oy: at.y };
            return d;
        });
        const events = (prefab.events || []).map(src => {
            const e = JSON.parse(JSON.stringify(src));
            e.x = atTile.x + src.dx;
            e.y = atTile.y + src.dy;
            delete e.dx;
            delete e.dy;
            e.id = options.allocateEventId ? options.allocateEventId(e) : null;
            return e;
        });
        return { instance, groupId, doodads, events };
    },

    // Recaptures the master's doodads from one placed copy (its events are left as they were).
    updateFromInstance(prefab, instanceDoodads) {
        if (!prefab || !instanceDoodads || instanceDoodads.length === 0) return null;
        const ref = instanceDoodads[0].prefabRef;
        prefab.doodads = instanceDoodads.map(d => Object.assign(this.cleanDoodad(d), { x: d.x - ref.ox, y: d.y - ref.oy }));
        const first = instanceDoodads.find(d => d.bit && d.bit[0] === 3);
        if (first) prefab.thumbnail = first.bit[1];
        prefab.updatedAt = Date.now();
        return prefab;
    }
};

DocsDoodads.MapLinks = {
    sides: ['east', 'west', 'north', 'south'],

    ensureUid(d) {
        if (!d.uid) d.uid = 'dd_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        return d;
    },

    // World positions (pixels) of the current map and its linked neighbours, up to depth links away.
    layout(mapId, neighborsOf, sizeOf, depth = 2) {
        const start = sizeOf(mapId);
        if (!start) return [];
        const placed = [{ mapId, x: 0, y: 0, w: start.w, h: start.h, distance: 0 }];
        const seen = new Set([mapId]);
        for (let i = 0; i < placed.length; i++) {
            const m = placed[i];
            if (m.distance >= depth) continue;
            const links = neighborsOf(m.mapId) || {};
            for (const side of this.sides) {
                const id = Number(links[side]);
                if (!id || seen.has(id)) continue;
                const size = sizeOf(id);
                if (!size) continue;
                seen.add(id);
                const x = side === 'east' ? m.x + m.w : side === 'west' ? m.x - size.w : m.x;
                const y = side === 'south' ? m.y + m.h : side === 'north' ? m.y - size.h : m.y;
                placed.push({ mapId: id, x, y, w: size.w, h: size.h, distance: m.distance + 1 });
            }
        }
        return placed;
    },

    bounds(layout) {
        return {
            left: Math.min(...layout.map(m => m.x)), top: Math.min(...layout.map(m => m.y)),
            right: Math.max(...layout.map(m => m.x + m.w)), bottom: Math.max(...layout.map(m => m.y + m.h))
        };
    },

    // Copies of doodads that hang over this map's edges, shifted into each neighbouring map.
    edgeCopies(mapId, doodads, neighbors, sizeOf) {
        const out = [];
        const size = sizeOf(mapId);
        if (!size || !neighbors) return out;
        for (const d of doodads || []) {
            if (!d || d.mirrorOf || d.posMode === 0) continue;
            const r = DocsDoodads.Guides.rectOf(d);
            const shifts = [];
            if (neighbors.east && r.right > size.w) shifts.push({ mapId: neighbors.east, dx: -size.w, dy: 0 });
            if (neighbors.west && r.left < 0) { const s = sizeOf(neighbors.west); if (s) shifts.push({ mapId: neighbors.west, dx: s.w, dy: 0 }); }
            if (neighbors.south && r.bottom > size.h) shifts.push({ mapId: neighbors.south, dx: 0, dy: -size.h });
            if (neighbors.north && r.top < 0) { const s = sizeOf(neighbors.north); if (s) shifts.push({ mapId: neighbors.north, dx: 0, dy: s.h }); }
            for (const shift of shifts) {
                const copy = DocsDoodads.Prefabs.cleanDoodad(d);
                copy.x = d.x + shift.dx;
                copy.y = d.y + shift.dy;
                copy.mirrorOf = { mapId, uid: d.uid };
                out.push({ mapId: Number(shift.mapId), doodad: copy });
            }
        }
        return out;
    }
};

