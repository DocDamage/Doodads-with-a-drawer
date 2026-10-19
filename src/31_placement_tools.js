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
        // base: the line the doodad stands on (its anchor), which is not always its bottom edge.
        return { left, right: left + w, top, bottom: top + h, cx: left + w / 2, cy: top + h / 2, base: d.y };
    },

    unionRect(rects) {
        const r = { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity };
        for (const x of rects) {
            r.left = Math.min(r.left, x.left); r.right = Math.max(r.right, x.right);
            r.top = Math.min(r.top, x.top); r.bottom = Math.max(r.bottom, x.bottom);
        }
        r.cx = (r.left + r.right) / 2;
        r.cy = (r.top + r.bottom) / 2;
        // Several doodads move as one: the lowest base line is theirs.
        if (rects.length && rects.every(x => x.base !== undefined)) r.base = Math.max(...rects.map(x => x.base));
        return r;
    },

    // Edge/centre/base alignment first; otherwise equal spacing between the nearest neighbours; otherwise
    // (opts.tile: { w, h }) an edge or the base line on a tile line.
    snap(moving, others, threshold = 6, opts = {}) {
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

        const onTiles = (keys, size, crossFrom, crossTo, name) => {
            if (!(size > 0)) return null;
            let best = null;
            for (const mk of keys) {
                if (!Number.isFinite(m[mk])) continue;
                const diff = Math.round(m[mk] / size) * size - m[mk];
                if (Math.abs(diff) <= threshold && (best === null || Math.abs(diff) < Math.abs(best.delta))) best = { delta: diff, at: m[mk] + diff };
            }
            return best ? { delta: best.delta, lines: [{ axis: name, kind: 'tile', at: best.at, from: m[crossFrom] - size / 2, to: m[crossTo] + size / 2 }] } : null;
        };
        const tile = opts.tile || null;
        const x = axis(['left', 'cx', 'right'], 'top', 'bottom', 'x') || spacing('left', 'right', 'top', 'bottom', 'x-gap') ||
            (tile ? onTiles(['left', 'right'], tile.w, 'top', 'bottom', 'x') : null);
        const y = axis(['top', 'cy', 'bottom', 'base'], 'left', 'right', 'y') || spacing('top', 'bottom', 'left', 'right', 'y-gap') ||
            (tile ? onTiles(['base', 'top', 'bottom'], tile.h, 'left', 'right', 'y') : null);
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

    // Each doodad in a master has a key (pk) that its placed copies keep in prefabRef.pk, so settings a
    // copy keeps as its own (prefabRef.own, a list of Details keys) find their doodad again when copies are
    // rebuilt. A master can hold other prefabs: children [{ key, id, x, y, own }], placed from their own
    // master each time, so changing the inner prefab changes every prefab that holds it. A child's own
    // settings are { innerPk: { key: value } }. Keys of a child's doodads are child.key + '/' + inner key.
    pkOf(src, index) {
        return src && src.pk ? String(src.pk) : 'k' + index;
    },

    // Sets a Details key on a doodad when no editor is there to do it (dot keys set inside the group).
    setProperty(d, key, value) {
        const dot = key.indexOf('.');
        if (dot > 0) {
            const group = key.slice(0, dot);
            d[group] = Object.assign({}, d[group] || {}, { [key.slice(dot + 1)]: value });
        } else {
            d[key] = value;
        }
    },

    // Every doodad the prefab places, positions relative to its origin, and its events with the pixel
    // offset of the origin their tile offsets count from. A prefab inside itself is skipped.
    expand(prefab, options = {}, seen = new Set()) {
        const out = { doodads: [], events: [] };
        if (!prefab || seen.has(prefab.id) || seen.size > 16) return out;
        const inner = new Set(seen).add(prefab.id);
        const apply = options.applyProperty || ((d, key, value) => this.setProperty(d, key, value));
        (prefab.doodads || []).forEach((src, i) => {
            const d = JSON.parse(JSON.stringify(src));
            delete d.pk;
            out.doodads.push({ d, pk: this.pkOf(src, i) });
        });
        (prefab.events || []).forEach(e => out.events.push({ e, ox: 0, oy: 0 }));
        (prefab.children || []).forEach((child, ci) => {
            const master = this.get(child.id);
            if (!master) return;
            const key = child.key || 'c' + ci;
            const placed = this.expand(master, options, inner);
            for (const item of placed.doodads) {
                item.d.x += Number(child.x) || 0;
                item.d.y += Number(child.y) || 0;
                const own = child.own && child.own[item.pk];
                if (own) for (const k of Object.keys(own)) apply(item.d, k, own[k]);
                out.doodads.push({ d: item.d, pk: key + '/' + item.pk });
            }
            for (const ev of placed.events) out.events.push({ e: ev.e, ox: ev.ox + (Number(child.x) || 0), oy: ev.oy + (Number(child.y) || 0) });
        });
        return out;
    },

    // The prefabs that hold this one, however deep.
    containers(prefabId) {
        const found = new Set();
        let frontier = [prefabId];
        while (frontier.length) {
            const next = [];
            for (const p of this.ensureLoaded()) {
                if (found.has(p.id) || p.id === prefabId) continue;
                if ((p.children || []).some(c => frontier.includes(c.id))) { found.add(p.id); next.push(p.id); }
            }
            frontier = next;
        }
        return Array.from(found);
    },

    // Before a prefab is deleted: the prefabs holding it keep what it placed as their own doodads and
    // events (same keys, so placed copies keep their own settings).
    bakeChild(prefabId, options = {}) {
        const tw = options.tileWidth || 48, th = options.tileHeight || 48;
        let count = 0;
        for (const p of this.ensureLoaded()) {
            if (p.id === prefabId || !(p.children || []).some(c => c.id === prefabId)) continue;
            p.children = p.children.filter((child, ci) => {
                if (child.id !== prefabId) return true;
                const key = child.key || 'c' + ci;
                const placed = this.expand({ id: p.id + '/bake', children: [Object.assign({}, child, { key })] }, options);
                for (const item of placed.doodads) p.doodads = (p.doodads || []).concat([Object.assign(item.d, { pk: item.pk })]);
                for (const ev of placed.events) {
                    p.events = (p.events || []).concat([Object.assign(JSON.parse(JSON.stringify(ev.e)), {
                        dx: ev.e.dx + Math.round(ev.ox / tw), dy: ev.e.dy + Math.round(ev.oy / th)
                    })]);
                }
                count++;
                return false;
            });
            if (!p.children.length) delete p.children;
            p.updatedAt = Date.now();
        }
        return count;
    },

    thumbnailFor(prefab) {
        const first = this.expand(prefab).doodads.find(item => item.d.bit && item.d.bit[0] === 3);
        return first ? first.d.bit[1] : '';
    },

    // options: { tileWidth, tileHeight, whole(instance) (every doodad of that placed copy is in the list:
    // it becomes a child prefab), ownValues(d) ({ key: value } for the doodad's own settings) }.
    capture(name, doodads, events, options = {}) {
        const tw = options.tileWidth || 48, th = options.tileHeight || 48;
        doodads = (doodads || []).filter(Boolean);
        events = (events || []).filter(Boolean);
        const origin = this.originFor(doodads, events, tw, th);
        const originTile = { x: Math.floor(origin.x / tw), y: Math.floor((origin.y - 1) / th) };
        // options.onLink(d, pk) hears the key each picked doodad has in the new prefab.
        const children = [], own = [], childOf = new Map(), seenIn = new Map();
        for (const d of doodads) {
            const ref = d.prefabRef;
            if (ref && this.get(ref.id) && options.whole && options.whole(ref.instance)) {
                let child = childOf.get(ref.instance);
                if (!child) {
                    child = { key: 'c' + children.length, id: ref.id, x: Math.round((Number(ref.ox) || 0) - origin.x), y: Math.round((Number(ref.oy) || 0) - origin.y) };
                    childOf.set(ref.instance, child);
                    children.push(child);
                }
                const n = seenIn.get(ref.instance) || 0;
                seenIn.set(ref.instance, n + 1);
                const inner = this.pkOf(ref, n);
                const values = Array.isArray(ref.own) && ref.own.length && options.ownValues ? options.ownValues(d) : null;
                if (values && Object.keys(values).length) (child.own = child.own || {})[inner] = values;
                if (options.onLink) options.onLink(d, child.key + '/' + inner);
            } else {
                if (options.onLink) options.onLink(d, 'k' + own.length);
                own.push(d);
            }
        }
        const prefab = {
            id: this.newId('pf_'),
            name: String(name || 'Prefab').trim() || 'Prefab',
            createdAt: Date.now(),
            origin,
            thumbnail: '',
            doodads: own.map((d, i) => Object.assign(this.cleanDoodad(d), { x: d.x - origin.x, y: d.y - origin.y, pk: 'k' + i })),
            events: events.map(e => Object.assign(JSON.parse(JSON.stringify(e)), { dx: e.x - originTile.x, dy: e.y - originTile.y }))
        };
        if (children.length) prefab.children = children;
        prefab.thumbnail = this.thumbnailFor(prefab);
        return prefab;
    },

    // options: { tileWidth, tileHeight, instance, groupId, allocateEventId, keep ({ pk: { key: value } }: a
    // copy's own settings put back), applyProperty }.
    instantiate(prefab, at, options = {}) {
        const tw = options.tileWidth || 48, th = options.tileHeight || 48;
        const instance = options.instance || this.newId('pi_');
        const groupId = options.groupId || ('grp_' + instance);
        const apply = options.applyProperty || ((d, key, value) => this.setProperty(d, key, value));
        const placed = this.expand(prefab, options);
        const doodads = placed.doodads.map(({ d, pk }) => {
            d.x = Math.round(at.x + d.x);
            d.y = Math.round(at.y + d.y);
            d.groupId = groupId;
            d.prefabRef = { id: prefab.id, instance, ox: at.x, oy: at.y, pk };
            const keep = options.keep && options.keep[pk];
            if (keep && Object.keys(keep).length) {
                for (const key of Object.keys(keep)) apply(d, key, keep[key]);
                d.prefabRef.own = Object.keys(keep);
            }
            return d;
        });
        const events = placed.events.map(({ e: src, ox, oy }) => {
            const e = JSON.parse(JSON.stringify(src));
            e.x = Math.floor((at.x + ox) / tw) + src.dx;
            e.y = Math.floor((at.y + oy - 1) / th) + src.dy;
            delete e.dx;
            delete e.dy;
            e.id = options.allocateEventId ? options.allocateEventId(e) : null;
            return e;
        });
        return { instance, groupId, doodads, events };
    },

    // Recaptures the master from one placed copy (its events are left as they were). The copy's own
    // doodads replace the master's; a child prefab moves with its doodads and keeps the copy's own settings
    // for them. options: { ownValues(d) }.
    updateFromInstance(prefab, instanceDoodads, options = {}) {
        if (!prefab || !instanceDoodads || instanceDoodads.length === 0) return null;
        const ref = instanceDoodads[0].prefabRef;
        const inChild = d => Boolean(d.prefabRef && String(d.prefabRef.pk || '').indexOf('/') > 0);
        const expected = this.expand(prefab).doodads;
        prefab.doodads = instanceDoodads.filter(d => !inChild(d)).map((d, i) =>
            Object.assign(this.cleanDoodad(d), { x: d.x - ref.ox, y: d.y - ref.oy, pk: (d.prefabRef && d.prefabRef.pk) || 'k' + i }));
        (prefab.children || []).forEach((child, ci) => {
            const key = child.key || 'c' + ci;
            const mine = instanceDoodads.filter(d => inChild(d) && String(d.prefabRef.pk).indexOf(key + '/') === 0);
            if (!mine.length) return;
            const was = expected.find(item => item.pk === mine[0].prefabRef.pk);
            if (was) {
                child.x = (Number(child.x) || 0) + Math.round(mine[0].x - ref.ox - was.d.x);
                child.y = (Number(child.y) || 0) + Math.round(mine[0].y - ref.oy - was.d.y);
            }
            // What the child already changed stays; the copy's own settings are added on top.
            const own = JSON.parse(JSON.stringify(child.own || {}));
            for (const d of mine) {
                const values = Array.isArray(d.prefabRef.own) && d.prefabRef.own.length && options.ownValues ? options.ownValues(d) : null;
                const inner = String(d.prefabRef.pk).slice(key.length + 1);
                if (values && Object.keys(values).length) own[inner] = Object.assign(own[inner] || {}, values);
            }
            if (Object.keys(own).length) child.own = own; else delete child.own;
        });
        prefab.thumbnail = this.thumbnailFor(prefab) || prefab.thumbnail;
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

