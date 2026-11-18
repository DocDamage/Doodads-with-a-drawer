// @editor-only
//==========================================================
// SECTION 5M: MAPS FROM A PICTURE (8.5.2) AND WHAT KIND OF MAP (8.5.3)
//==========================================================
// A picture becomes a plan (plain data), the plan is shown, and only Apply changes the map, as one undo step.
// The plan: { w, h, kind, cells: [class id or null per tile], heights: [0..1 per tile] | null, features:
// [{ type, x, y, w, h, name }] }. Reading samples the commonest colour in each tile (edges stay sharp) and groups
// the colours by median cut; the user agrees a key (colour group → class); the kind's finish step shapes the
// plan (coasts, buildings, rooms); build turns it into tiles, regions, heights and biome spots. Pure.
DocsDoodads.MapFrom = {
    maxColours: 12,

    // ---- Kinds of map (8.5.3) ----
    builtIn: [
        { id: 'overworld', name: 'Overworld', scale: 'A tile is a long way: coast, mountains, forests, rivers, a marker for each place.', rules: { mountainAt: 0.7 },
            classes: [
                { id: 'water', name: 'Sea and rivers', passable: false }, { id: 'grass', name: 'Grassland' }, { id: 'forest', name: 'Forest', biome: 'forest' },
                { id: 'mountain', name: 'Mountains', height: 2, passable: false }, { id: 'road', name: 'Road' }, { id: 'desert', name: 'Desert' },
                { id: 'snow', name: 'Snow' }, { id: 'place', name: 'Town or dungeon marker' }] },
        { id: 'town', name: 'Town or castle', scale: 'Streets, walls, gates, buildings with roofs and doors, yards and water.', rules: {},
            classes: [
                { id: 'ground', name: 'Ground' }, { id: 'road', name: 'Street' }, { id: 'building', name: 'Building outline', passable: false },
                { id: 'roof', name: 'Roof', passable: false }, { id: 'door', name: 'Door' }, { id: 'wall', name: 'Town wall', passable: false },
                { id: 'grass', name: 'Yard' }, { id: 'water', name: 'Water', passable: false }, { id: 'tree', name: 'Trees', biome: 'forest' }] },
        { id: 'dungeon', name: 'Dungeon or cave', scale: 'A floor plan: lines are walls, what they close in is floor, a gap is a door.', rules: { roughen: 0 },
            classes: [
                { id: 'wall', name: 'Wall', passable: false }, { id: 'floor', name: 'Floor' }, { id: 'door', name: 'Door' },
                { id: 'stairs', name: 'Stairs' }, { id: 'water', name: 'Water', passable: false }] },
        { id: 'room', name: 'Room', scale: 'One room: walls, floor, doors and windows, then furniture by its name.', rules: {},
            classes: [
                { id: 'wall', name: 'Wall', passable: false }, { id: 'floor', name: 'Floor' }, { id: 'door', name: 'Door' }, { id: 'window', name: 'Window', passable: false }] }
    ],

    cleanKind(kind) {
        if (!kind || typeof kind !== 'object') return null;
        const id = String(kind.id || '').replace(/[^\w-]/g, '').slice(0, 40);
        if (!id) return null;
        const classes = (Array.isArray(kind.classes) ? kind.classes : []).map(c => c && {
            id: String(c.id || '').replace(/[^\w-]/g, '').slice(0, 40), name: String(c.name || c.id || '').slice(0, 60),
            tile: Number.isInteger(c.tile) && c.tile > 0 ? c.tile : null, region: Math.max(0, Math.min(255, Math.floor(Number(c.region) || 0))),
            biome: String(c.biome || ''), height: Math.max(0, Math.min(16, Number(c.height) || 0)), passable: c.passable !== false
        }).filter(c => c && c.id);
        return { id, name: String(kind.name || id).slice(0, 60), scale: String(kind.scale || ''), base: kind.base || (this.builtIn.some(b => b.id === id) ? id : 'overworld'),
            rules: Object.assign({}, kind.rules || {}), classes };
    },

    kinds(userKinds) {
        const own = (Array.isArray(userKinds) ? userKinds : []).map(k => this.cleanKind(k)).filter(Boolean);
        return this.builtIn.map(k => this.cleanKind(k)).concat(own.filter(k => !this.builtIn.some(b => b.id === k.id)));
    },

    kind(id, userKinds) { return this.kinds(userKinds).find(k => k.id === id) || this.cleanKind(this.builtIn[0]); },

    // A user's copy of a kind: the same classes and rules, its own id, finished as the kind it came from.
    copyKind(kind, id, name) {
        const k = this.cleanKind(kind);
        return Object.assign(k, { id: String(id).replace(/[^\w-]/g, '') || k.id + '_copy', name: name || k.name + ' (copy)', base: k.base || k.id });
    },

    // ---- Editing a user's kind: its classes (8.5.3) ----
    // Each returns a new, cleaned kind; built-in kinds are copied first (copyKind), never changed.
    classId(kind, name) {
        const base = String(name || 'class').toLowerCase().replace(/[^\w]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 30) || 'class';
        let id = base, n = 2;
        while ((kind.classes || []).some(c => c.id === id)) id = base + '_' + n++;
        return id;
    },

    addClass(kind, cls) {
        const k = this.cleanKind(kind);
        if (!k) return null;
        const c = Object.assign({ name: 'New class', passable: true }, cls || {});
        c.id = c.id && !k.classes.some(x => x.id === c.id) ? c.id : this.classId(k, c.name);
        k.classes.push(c);
        return this.cleanKind(k);
    },

    updateClass(kind, classId, change) {
        const k = this.cleanKind(kind);
        if (!k) return null;
        k.classes = k.classes.map(c => (c.id === classId ? Object.assign({}, c, change || {}, { id: c.id }) : c));
        return this.cleanKind(k);
    },

    removeClass(kind, classId) {
        const k = this.cleanKind(kind);
        if (!k) return null;
        k.classes = k.classes.filter(c => c.id !== classId);
        return k;
    },

    isBuiltIn(id) { return this.builtIn.some(b => b.id === id); },

    // ---- Reading a picture (8.5.2) ----
    // pixels: RGBA bytes of a w × h picture; returns { w, h, cells: [group or -1], groups: [{ colour, count }] }.
    read(pixels, width, height, options = {}) {
        const w = Math.max(1, Math.floor(Number(options.tilesW) || 1)), h = Math.max(1, Math.floor(Number(options.tilesH) || 1));
        if (!pixels || pixels.length < width * height * 4) throw new Error('The picture could not be read.');
        const samples = new Array(w * h).fill(null);
        for (let ty = 0; ty < h; ty++) for (let tx = 0; tx < w; tx++) {
            const x0 = Math.floor(tx * width / w), x1 = Math.max(x0 + 1, Math.floor((tx + 1) * width / w));
            const y0 = Math.floor(ty * height / h), y1 = Math.max(y0 + 1, Math.floor((ty + 1) * height / h));
            const counts = new Map();
            let best = null, bestCount = 0;
            for (let y = y0; y < y1 && y < height; y++) for (let x = x0; x < x1 && x < width; x++) {
                const at = (y * width + x) * 4;
                if (pixels[at + 3] < 128) continue;
                const key = ((pixels[at] >> 3) << 10) | ((pixels[at + 1] >> 3) << 5) | (pixels[at + 2] >> 3);
                const n = (counts.get(key) || 0) + 1;
                counts.set(key, n);
                if (n > bestCount || (n === bestCount && key < best)) { best = key; bestCount = n; }
            }
            if (best !== null) samples[ty * w + tx] = [((best >> 10) & 31) * 8 + 4, ((best >> 5) & 31) * 8 + 4, (best & 31) * 8 + 4];
        }
        const groups = this.medianCut(samples.filter(Boolean), Math.max(1, Math.min(this.maxColours, Number(options.maxColours) || this.maxColours)));
        const cells = samples.map(c => c ? this.nearest(c, groups) : -1);
        const counted = groups.map((colour, i) => ({ colour, count: cells.filter(c => c === i).length }));
        return { w, h, cells, groups: counted };
    },

    // Median cut: split the box with the widest channel at its median until there are `max` boxes.
    medianCut(colours, max) {
        if (!colours.length) return [];
        let boxes = [colours.slice()];
        const range = box => [0, 1, 2].map(c => Math.max(...box.map(p => p[c])) - Math.min(...box.map(p => p[c])));
        while (boxes.length < max) {
            let pick = -1, widest = 0, channel = 0;
            boxes.forEach((box, i) => { const r = range(box), c = r.indexOf(Math.max(...r)); if (box.length > 1 && r[c] > widest) { widest = r[c]; pick = i; channel = c; } });
            if (pick < 0 || widest < 24) break;
            const box = boxes[pick].slice().sort((a, b) => a[channel] - b[channel] || a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
            const mid = Math.floor(box.length / 2);
            // Cut where the channel's value changes, nearest the median: a run of one colour is never split in two
            // (that made empty copies of the commonest colour and merged the rare ones). The box's range on the
            // channel is wide, so such a place always exists.
            const changes = i => i > 0 && i < box.length && box[i][channel] !== box[i - 1][channel];
            let cut = -1;
            for (let step = 0; step < box.length && cut < 0; step++) {
                if (changes(mid + step)) cut = mid + step;
                else if (changes(mid - step)) cut = mid - step;
            }
            if (cut <= 0 || cut >= box.length) break;
            boxes.splice(pick, 1, box.slice(0, cut), box.slice(cut));
        }
        const out = boxes.map(box => [0, 1, 2].map(c => Math.round(box.reduce((s, p) => s + p[c], 0) / box.length)));
        return out.sort((a, b) => (a[0] * 65536 + a[1] * 256 + a[2]) - (b[0] * 65536 + b[1] * 256 + b[2]));
    },

    nearest(colour, groups) {
        let best = 0, distance = Infinity;
        groups.forEach((g, i) => { const d = (g[0] - colour[0]) ** 2 + (g[1] - colour[1]) ** 2 + (g[2] - colour[2]) ** 2; if (d < distance) { distance = d; best = i; } });
        return best;
    },

    // A first guess at a colour's class: blues to water, greens to grass or forest, greys to stone or road...
    guess(colour, kind) {
        const has = id => kind.classes.some(c => c.id === id);
        const pick = (...ids) => ids.find(has) || null;
        const [r, g, b] = colour.map(v => v / 255), max = Math.max(r, g, b), min = Math.min(r, g, b), v = max, s = max ? (max - min) / max : 0;
        let hue = 0;
        if (max !== min) hue = max === r ? 60 * (((g - b) / (max - min)) % 6) : max === g ? 60 * ((b - r) / (max - min) + 2) : 60 * ((r - g) / (max - min) + 4);
        if (hue < 0) hue += 360;
        if (s < 0.15) {
            if (v > 0.9) return pick('snow', 'floor', 'ground', 'road');
            if (v < 0.35) return pick('wall', 'mountain', 'building');
            return pick('road', 'floor', 'mountain', 'wall');
        }
        if (hue >= 180 && hue < 260) return pick('water');
        if (hue >= 70 && hue < 180) return v < 0.45 ? pick('forest', 'tree', 'grass') : pick('grass', 'ground', 'floor');
        if (hue >= 45 && hue < 70) return pick('desert', 'road', 'floor', 'ground');
        if (hue >= 18 && hue < 45) return pick('road', 'desert', 'ground', 'floor', 'door');
        return pick('place', 'building', 'door', 'roof');
    },

    // ---- Cleaning ----
    // Lines n tiles thin or thinner (labels, grid lines) give way to what is around them: an opening with an
    // (n + 1)-tile square removes exactly what a square that size cannot fit in.
    ignoreThin(cells, w, h, n) {
        n = Math.max(0, Math.floor(Number(n) || 0));
        if (!n) return cells.slice();
        const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? undefined : cells[y * w + x]);
        const erode = (mask, value) => mask.map((on, i) => {
            if (!on) return false;
            const x = i % w, y = Math.floor(i / w);
            for (let dy = 0; dy <= n; dy++) for (let dx = 0; dx <= n; dx++) { if (at(x + dx, y + dy) !== value) return false; }
            return true;
        });
        const dilate = mask => mask.map((_, i) => {
            const x = i % w, y = Math.floor(i / w);
            for (let dy = 0; dy <= n; dy++) for (let dx = 0; dx <= n; dx++) { const xx = x - dx, yy = y - dy; if (xx >= 0 && yy >= 0 && mask[yy * w + xx]) return true; }
            return false;
        });
        const thin = new Array(cells.length).fill(false);
        for (const value of new Set(cells)) {
            const mask = cells.map(c => c === value), opened = dilate(erode(mask, value));
            mask.forEach((on, i) => { if (on && !opened[i]) thin[i] = true; });
        }
        const out = cells.slice();
        for (let pass = 0; pass < w + h && thin.some(Boolean); pass++) {
            const next = thin.slice();
            thin.forEach((isThin, i) => {
                if (!isThin) return;
                const x = i % w, y = Math.floor(i / w), votes = new Map();
                for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                    const xx = x + dx, yy = y + dy;
                    if ((dx || dy) && xx >= 0 && yy >= 0 && xx < w && yy < h && !thin[yy * w + xx]) votes.set(out[yy * w + xx], (votes.get(out[yy * w + xx]) || 0) + 1);
                }
                if (!votes.size) return;
                out[i] = Array.from(votes.entries()).sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))[0][0];
                next[i] = false;
            });
            thin.splice(0, thin.length, ...next);
        }
        return out;
    },

    // Grey to height: dark low, light high, one value 0-1 per tile.
    heightsFrom(pixels, width, height, w, h) {
        const out = new Array(w * h).fill(0);
        for (let ty = 0; ty < h; ty++) for (let tx = 0; tx < w; tx++) {
            let sum = 0, n = 0;
            for (let y = Math.floor(ty * height / h); y < Math.max(Math.floor(ty * height / h) + 1, Math.floor((ty + 1) * height / h)); y++) {
                for (let x = Math.floor(tx * width / w); x < Math.max(Math.floor(tx * width / w) + 1, Math.floor((tx + 1) * width / w)); x++) {
                    const at = (y * width + x) * 4;
                    sum += (pixels[at] * 0.2126 + pixels[at + 1] * 0.7152 + pixels[at + 2] * 0.0722) / 255; n++;
                }
            }
            out[ty * w + tx] = n ? Math.round(sum / n * 100) / 100 : 0;
        }
        return out;
    },

    // ---- The plan ----
    // key: [class id or null per colour group]. options: { heights, name, seed }.
    plan(read, key, kind, options = {}) {
        const cells = read.cells.map(g => (g >= 0 && key[g] && kind.classes.some(c => c.id === key[g]) ? key[g] : null));
        const plan = { w: read.w, h: read.h, kind: kind.id, cells, heights: options.heights || null, features: [], options: Object.assign({}, options, { heights: undefined }) };
        return this.finish(plan, kind);
    },

    finish(plan, kind) {
        const base = kind.base || kind.id;
        const step = { overworld: 'finishOverworld', town: 'finishTown', dungeon: 'finishDungeon', room: 'finishRoom' }[base];
        return step ? this[step](plan, kind) : plan;
    },

    neighbours(w, h, i, diagonal) {
        const x = i % w, y = Math.floor(i / w), out = [];
        for (const [dx, dy] of diagonal ? [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]] : [[0, -1], [-1, 0], [1, 0], [0, 1]]) {
            const xx = x + dx, yy = y + dy;
            if (xx >= 0 && yy >= 0 && xx < w && yy < h) out.push(yy * w + xx);
        }
        return out;
    },

    components(cells, w, h, test) {
        const seen = new Uint8Array(cells.length), out = [];
        cells.forEach((c, i) => {
            if (seen[i] || !test(c)) return;
            const list = [], queue = [i];
            seen[i] = 1;
            while (queue.length) {
                const k = queue.pop();
                list.push(k);
                for (const n of this.neighbours(w, h, k, false)) if (!seen[n] && test(cells[n])) { seen[n] = 1; queue.push(n); }
            }
            out.push(list.sort((a, b) => a - b));
        });
        return out;
    },

    bounds(list, w) {
        const xs = list.map(i => i % w), ys = list.map(i => Math.floor(i / w));
        const x = Math.min(...xs), y = Math.min(...ys);
        return { x, y, w: Math.max(...xs) - x + 1, h: Math.max(...ys) - y + 1 };
    },

    // Overworld: smooth the coast, raise mountains from height, and turn each "place" mark into a marker.
    finishOverworld(plan) {
        const { w, h } = plan, cells = plan.cells.slice();
        plan.cells.forEach((c, i) => {
            const around = this.neighbours(w, h, i, true).map(n => plan.cells[n]);
            const water = around.filter(a => a === 'water').length;
            if (c !== 'water' && c !== null && water >= 6) cells[i] = 'water';
            if (c === 'water' && around.length - water >= 7) {
                const land = around.filter(a => a && a !== 'water');
                if (land.length) cells[i] = land.sort((a, b) => land.filter(x => x === b).length - land.filter(x => x === a).length || a.localeCompare(b))[0];
            }
        });
        const at = Number(plan.options && plan.options.mountainAt) || 0.7;
        if (plan.heights) cells.forEach((c, i) => { if (c && c !== 'water' && plan.heights[i] >= at) cells[i] = 'mountain'; });
        for (const list of this.components(cells, w, h, c => c === 'place')) {
            plan.features.push(Object.assign({ type: 'place', name: '' }, this.bounds(list, w)));
            for (const i of list) {
                const near = this.neighbours(w, h, i, true).map(n => cells[n]).filter(c => c && c !== 'place' && c !== 'water');
                cells[i] = near[0] || 'grass';
            }
        }
        plan.cells = cells;
        return plan;
    },

    // Town: each building outline becomes walls round a roof with a door on the side facing the nearest street;
    // a street crossing a town wall becomes a gate.
    finishTown(plan) {
        const { w, h } = plan, cells = plan.cells.slice();
        const roads = [];
        cells.forEach((c, i) => { if (c === 'road') roads.push(i); });
        for (const list of this.components(cells, w, h, c => c === 'building')) {
            const box = this.bounds(list, w), own = new Set(list);
            // Outside the building: reached from just outside its box without crossing it.
            const outside = new Set(), queue = [];
            const inBox = (x, y) => x >= box.x - 1 && y >= box.y - 1 && x <= box.x + box.w && y <= box.y + box.h;
            for (let y = box.y - 1; y <= box.y + box.h; y++) for (let x = box.x - 1; x <= box.x + box.w; x++) {
                if (x === box.x - 1 || y === box.y - 1 || x === box.x + box.w || y === box.y + box.h) { const k = y * w + x; outside.add(k); queue.push([x, y]); }
            }
            while (queue.length) {
                const [x, y] = queue.pop();
                for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                    const xx = x + dx, yy = y + dy, k = yy * w + xx;
                    if (inBox(xx, yy) && !outside.has(k) && !own.has(k)) { outside.add(k); queue.push([xx, yy]); }
                }
            }
            const isOut = (x, y) => x < 0 || y < 0 || x >= w || y >= h || outside.has(y * w + x);
            // Walls are the outline cells that face outside; everything closed in is roof.
            const edge = [];
            for (let y = box.y; y < box.y + box.h; y++) for (let x = box.x; x < box.x + box.w; x++) {
                const k = y * w + x;
                if (outside.has(k)) continue;
                const facesOut = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => isOut(x + dx, y + dy));
                if (own.has(k) && facesOut) edge.push(k); else cells[k] = 'roof';
            }
            let door = null, best = Infinity;
            for (const i of edge) {
                const x = i % w, y = Math.floor(i / w);
                const straight = (isOut(x - 1, y) && !isOut(x + 1, y) || isOut(x + 1, y) && !isOut(x - 1, y)) !== (isOut(x, y - 1) && !isOut(x, y + 1) || isOut(x, y + 1) && !isOut(x, y - 1));
                if (!straight) continue;
                const target = roads.length ? roads : [];
                for (const r of target) { const d = Math.hypot((r % w) - x, Math.floor(r / w) - y); if (d < best || (d === best && i < door)) { best = d; door = i; } }
                if (!target.length && isOut(x, y + 1) && (door === null || i > door)) door = i;
            }
            if (door !== null) { cells[door] = 'door'; plan.features.push({ type: 'door', x: door % w, y: Math.floor(door / w), w: 1, h: 1, name: '' }); }
            plan.features.push(Object.assign({ type: 'building', name: '' }, box));
        }
        cells.forEach((c, i) => {
            if (c !== 'road') return;
            const x = i % w, y = Math.floor(i / w), is = (xx, yy) => xx >= 0 && yy >= 0 && xx < w && yy < h && cells[yy * w + xx] === 'wall';
            if ((is(x - 1, y) && is(x + 1, y)) || (is(x, y - 1) && is(x, y + 1))) plan.features.push({ type: 'gate', x, y, w: 1, h: 1, name: '' });
        });
        plan.cells = cells;
        return plan;
    },

    // Dungeon or cave: lines are walls; a one-tile gap in a wall is a door; what the walls close in is floor;
    // a stairs mark is a feature. Caves roughen the walls with seeded noise.
    finishDungeon(plan, kind) {
        const { w, h } = plan, cells = plan.cells.slice();
        const wall = i => cells[i] === 'wall';
        const doors = [];
        cells.forEach((c, i) => {
            if (c === 'wall' || c === 'water') return;
            const x = i % w, y = Math.floor(i / w), isWall = (xx, yy) => xx >= 0 && yy >= 0 && xx < w && yy < h && wall(yy * w + xx);
            const lr = isWall(x - 1, y) && isWall(x + 1, y) && !isWall(x, y - 1) && !isWall(x, y + 1);
            const ud = isWall(x, y - 1) && isWall(x, y + 1) && !isWall(x - 1, y) && !isWall(x + 1, y);
            if (lr || ud) doors.push(i);
        });
        // The outside: reached from the picture's edge without crossing a wall or a door.
        const outside = new Uint8Array(cells.length), queue = [];
        const blocked = i => wall(i) || doors.includes(i);
        for (let i = 0; i < cells.length; i++) {
            const x = i % w, y = Math.floor(i / w);
            if ((x === 0 || y === 0 || x === w - 1 || y === h - 1) && !blocked(i)) { outside[i] = 1; queue.push(i); }
        }
        while (queue.length) { const k = queue.pop(); for (const n of this.neighbours(w, h, k, false)) if (!outside[n] && !blocked(n)) { outside[n] = 1; queue.push(n); } }
        cells.forEach((c, i) => {
            if (wall(i) || doors.includes(i)) return;
            if (outside[i]) { cells[i] = null; return; }
            if (c === 'stairs') plan.features.push({ type: 'stairs', x: i % w, y: Math.floor(i / w), w: 1, h: 1, name: '' });
            if (c !== 'water') cells[i] = 'floor';
        });
        for (const i of doors) {
            const inside = this.neighbours(w, h, i, false).some(n => cells[n] === 'floor');
            if (!inside) { cells[i] = null; continue; }
            cells[i] = 'door';
            plan.features.push({ type: 'door', x: i % w, y: Math.floor(i / w), w: 1, h: 1, name: '' });
        }
        const roughen = Math.max(0, Math.min(1, Number((plan.options && plan.options.roughen) !== undefined ? plan.options.roughen : (kind.rules || {}).roughen) || 0));
        if (roughen > 0) {
            const rng = DocsDoodads.Scatter.rng(Number(plan.options && plan.options.seed) || 1);
            const next = cells.slice();
            cells.forEach((c, i) => {
                if (c !== 'floor') return;
                const touching = this.neighbours(w, h, i, false).filter(n => cells[n] === 'wall').length;
                const nextToDoor = this.neighbours(w, h, i, true).some(n => cells[n] === 'door' || cells[n] === 'stairs');
                if (touching && !nextToDoor && rng() < roughen * 0.35) next[i] = 'wall';
            });
            plan.cells = next;
        } else plan.cells = cells;
        return plan;
    },

    // Room: one outline; doors and windows on its edges; furniture named by the room.
    finishRoom(plan) {
        const w = plan.w, cells = plan.cells.slice();
        const used = []; cells.forEach((c, i) => { if (c) used.push(i); });
        if (!used.length) return plan;
        const box = this.bounds(used, w);
        for (let y = box.y; y < box.y + box.h; y++) for (let x = box.x; x < box.x + box.w; x++) {
            const i = y * w + x, edge = x === box.x || y === box.y || x === box.x + box.w - 1 || y === box.y + box.h - 1;
            if (edge) {
                if (cells[i] === 'door' || cells[i] === 'window') plan.features.push({ type: cells[i], x, y, w: 1, h: 1, name: '' });
                else cells[i] = 'wall';
            } else cells[i] = 'floor';
        }
        const name = String((plan.options && plan.options.name) || '').trim();
        if (name) plan.features.push({ type: 'furniture', x: box.x + 1, y: box.y + 1, w: Math.max(1, box.w - 2), h: Math.max(1, box.h - 2), name });
        plan.cells = cells;
        return plan;
    },

    // ---- Building ----
    // tileFor(classId) → an MZ tile id or null. Returns what Apply writes, and the classes with no tile.
    build(plan, kind, tileFor) {
        const out = { tiles: [], regions: [], heights: {}, biomes: [], unmapped: [] };
        const unmapped = new Set();
        const byId = new Map(kind.classes.map(c => [c.id, c]));
        plan.cells.forEach((id, i) => {
            if (!id) return;
            const x = i % plan.w, y = Math.floor(i / plan.w), cls = byId.get(id);
            if (!cls) return;
            const tile = tileFor ? tileFor(id) : cls.tile;
            if (tile) out.tiles.push({ x, y, id: tile }); else unmapped.add(id);
            if (cls.region) out.regions.push({ x, y, id: cls.region });
            const height = cls.height || (plan.heights && id !== 'water' ? Math.round(plan.heights[i] * 4 * 4) / 4 : 0);
            if (height) out.heights[x + ',' + y] = height;
            if (cls.biome) out.biomes.push({ x, y, biome: cls.biome });
        });
        out.unmapped = Array.from(unmapped);
        return out;
    },

    // What fraction of a tile each picture pixel covers: under two pixels a tile the drawing is too small.
    pixelsPerTile(width, height, tilesW, tilesH) {
        return Math.min(width / Math.max(1, tilesW), height / Math.max(1, tilesH));
    }
};
