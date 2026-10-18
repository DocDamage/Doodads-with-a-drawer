//==========================================================
// SECTION 11B: ASSET MANAGEMENT (USAGE, FINGERPRINTS, LIVE RELOAD, PACKING)
//==========================================================
// Where every file is used. RPG Maker refers to most files by name inside a fixed folder
// ("name" references); doodads and prefabs store a full path ("path" references).
DocsDoodads.Usage = {
    lastIndex: null,

    keyOf(filePath) {
        return String(filePath || '').replace(/\\/g, '/').replace(/^\.\//, '').replace(/\.[^/.]+$/, '').toLowerCase();
    },

    folderOf(key) {
        const i = key.lastIndexOf('/');
        return i >= 0 ? key.slice(0, i) : '';
    },

    isEngineReserved(asset) {
        return /^img\/system\//i.test(String(asset && asset.path || '').replace(/\\/g, '/'));
    },

    // Calls fn(ref) for every reference; ref.set(value) rewrites it (a bare name or a full path).
    visitSources(sources, fn) {
        const named = (folder, holder, field, source, label, display) => {
            const name = holder ? holder[field] : null;
            if (!name || typeof name !== 'string') return;
            fn({ key: `${folder}/${name}`.toLowerCase(), kind: 'name', folder, source, label, display: Boolean(display),
                set: value => { holder[field] = value; } });
        };
        const audio = (folder, holder, source, label, display) => named(folder, holder, 'name', source, label, display);
        const routeCommand = (cmd, source, label, display) => {
            if (!cmd || !cmd.parameters) return;
            if (cmd.code === 41) named('img/characters', cmd.parameters, 0, source, label + ' (move route image)', display);
            if (cmd.code === 44) audio('audio/se', cmd.parameters[0], source, label + ' (move route SE)', display);
        };
        const visitList = (list, source, label) => {
            for (const cmd of list || []) {
                if (!cmd || !cmd.parameters) continue;
                const p = cmd.parameters;
                switch (cmd.code) {
                    case 101: named('img/faces', p, 0, source, label + ' (Show Text face)'); break;
                    case 231: named('img/pictures', p, 1, source, label + ' (Show Picture)'); break;
                    case 241: case 132: audio('audio/bgm', p[0], source, label + ' (BGM)'); break;
                    case 140: audio('audio/bgm', p[1], source, label + ' (vehicle BGM)'); break;
                    case 245: audio('audio/bgs', p[0], source, label + ' (BGS)'); break;
                    case 249: case 133: case 139: audio('audio/me', p[0], source, label + ' (ME)'); break;
                    case 250: audio('audio/se', p[0], source, label + ' (SE)'); break;
                    case 322:
                        named('img/characters', p, 1, source, label + ' (actor image)');
                        named('img/faces', p, 3, source, label + ' (actor face)');
                        named('img/sv_actors', p, 5, source, label + ' (actor battler)');
                        break;
                    case 323: named('img/characters', p, 1, source, label + ' (vehicle image)'); break;
                    case 283:
                        named('img/battlebacks1', p, 0, source, label + ' (battleback)');
                        named('img/battlebacks2', p, 1, source, label + ' (battleback)');
                        break;
                    case 284: named('img/parallaxes', p, 0, source, label + ' (parallax)'); break;
                    case 205: for (const step of (p[1] && p[1].list) || []) routeCommand(step, source, label); break;
                    // 505 lines repeat a move route for the MZ editor's display: rewritten, not counted.
                    case 505: routeCommand(p[0], source, label, true); break;
                }
            }
        };
        const mapInfos = sources.mapInfos || [];
        const mapLabel = id => {
            const info = mapInfos[id];
            return `Map ${String(id).padStart(3, '0')}${info && info.name ? ` "${info.name}"` : ''}`;
        };

        for (const [id, map] of Object.entries(sources.maps || {})) {
            if (!map) continue;
            const source = `map:${id}`, base = mapLabel(id);
            named('img/parallaxes', map, 'parallaxName', source, base + ' (parallax)');
            named('img/battlebacks1', map, 'battleback1Name', source, base + ' (battleback)');
            named('img/battlebacks2', map, 'battleback2Name', source, base + ' (battleback)');
            audio('audio/bgm', map.bgm, source, base + ' (autoplay BGM)');
            audio('audio/bgs', map.bgs, source, base + ' (autoplay BGS)');
            for (const ev of map.events || []) {
                if (!ev) continue;
                const label = `${base} · EV${String(ev.id).padStart(3, '0')} "${ev.name || ''}"`;
                (ev.pages || []).forEach((page, i) => {
                    if (page.image) named('img/characters', page.image, 'characterName', source, `${label} page ${i + 1} image`);
                    visitList(page.list, source, `${label} page ${i + 1}`);
                });
            }
        }

        const db = sources.database || {};
        for (const actor of db.Actors || []) {
            if (!actor) continue;
            const label = `Actor ${actor.id} "${actor.name || ''}"`;
            named('img/characters', actor, 'characterName', 'database:Actors', label);
            named('img/faces', actor, 'faceName', 'database:Actors', label);
            named('img/sv_actors', actor, 'battlerName', 'database:Actors', label);
        }
        for (const enemy of db.Enemies || []) {
            if (!enemy) continue;
            const label = `Enemy ${enemy.id} "${enemy.name || ''}"`;
            named('img/enemies', enemy, 'battlerName', 'database:Enemies', label);
            named('img/sv_enemies', enemy, 'battlerName', 'database:Enemies', label);
        }
        for (const tileset of db.Tilesets || []) {
            if (!tileset || !tileset.tilesetNames) continue;
            tileset.tilesetNames.forEach((n, i) => named('img/tilesets', tileset.tilesetNames, i, 'database:Tilesets', `Tileset ${tileset.id} "${tileset.name || ''}"`));
        }
        const sys = db.System;
        if (sys) {
            named('img/titles1', sys, 'title1Name', 'database:System', 'System (title)');
            named('img/titles2', sys, 'title2Name', 'database:System', 'System (title frame)');
            named('img/battlebacks1', sys, 'battleback1Name', 'database:System', 'System (test battleback)');
            named('img/battlebacks2', sys, 'battleback2Name', 'database:System', 'System (test battleback)');
            for (const field of ['titleBgm', 'battleBgm']) audio('audio/bgm', sys[field], 'database:System', `System (${field})`);
            for (const field of ['victoryMe', 'defeatMe', 'gameoverMe']) audio('audio/me', sys[field], 'database:System', `System (${field})`);
            (sys.sounds || []).forEach((s, i) => audio('audio/se', s, 'database:System', `System (sound ${i})`));
            for (const vehicle of ['boat', 'ship', 'airship']) {
                if (!sys[vehicle]) continue;
                named('img/characters', sys[vehicle], 'characterName', 'database:System', `System (${vehicle})`);
                audio('audio/bgm', sys[vehicle].bgm, 'database:System', `System (${vehicle} BGM)`);
            }
        }
        for (const ce of db.CommonEvents || []) {
            if (ce) visitList(ce.list, 'database:CommonEvents', `Common Event ${ce.id} "${ce.name || ''}"`);
        }
        for (const troop of db.Troops || []) {
            if (!troop) continue;
            (troop.pages || []).forEach((page, i) => visitList(page.list, 'database:Troops', `Troop ${troop.id} "${troop.name || ''}" page ${i + 1}`));
        }

        const pathRef = (holder, field, source, label, display) => {
            const value = holder[field];
            if (!value || typeof value !== 'string') return;
            fn({ key: this.keyOf(value), kind: 'path', source, label, display: Boolean(display), set: v => { holder[field] = v; } });
        };
        for (const [id, list] of Object.entries(sources.doodads || {})) {
            if (!Array.isArray(list)) continue;
            list.forEach((d, i) => {
                if (d && d.bit && d.bit[0] === 3) pathRef(d.bit, 1, 'doodads', `${mapLabel(id)} · doodad #${i + 1}`);
            });
        }
        // Seasonal variants may only be reachable through the season table.
        const world = sources.doodads && sources.doodads.world;
        const seasonSets = world && world.seasons && Array.isArray(world.seasons.sets) ? world.seasons.sets : [];
        seasonSets.forEach((set, row) => {
            for (const season of Object.keys(set || {})) pathRef(set, season, 'doodads', `Season table row ${row + 1}`);
        });
        for (const prefab of sources.prefabs || []) {
            const label = `Prefab "${prefab.name}"`;
            (prefab.doodads || []).forEach(d => { if (d && d.bit && d.bit[0] === 3) pathRef(d.bit, 1, 'prefabs', label); });
            pathRef(prefab, 'thumbnail', 'prefabs', label + ' thumbnail', true);
        }
    },

    buildIndex(sources) {
        const index = new Map();
        this.visitSources(sources, ref => {
            if (ref.display) return;
            if (!index.has(ref.key)) index.set(ref.key, []);
            index.get(ref.key).push({ source: ref.source, label: ref.label, kind: ref.kind });
        });
        return index;
    },

    isUsed(asset, index = this.lastIndex) {
        return Boolean(index && index.has(this.keyOf(asset.path)));
    },

    unusedAssets(assets, index) {
        return (assets || []).filter(a => !this.isEngineReserved(a) && !index.has(this.keyOf(a.path)));
    },

    // Rewrites every reference from oldPath to newPath. Name references can only follow a rename
    // inside the same folder; a move to another folder is refused while any exist.
    rewrite(sources, oldPath, newPath) {
        const oldKey = this.keyOf(oldPath), newKey = this.keyOf(newPath);
        const newName = String(newPath).replace(/\\/g, '/').split('/').pop().replace(/\.[^/.]+$/, '');
        const matches = [];
        this.visitSources(sources, ref => { if (ref.key === oldKey) matches.push(ref); });
        const blocked = matches.filter(r => r.kind === 'name' && r.folder.toLowerCase() !== this.folderOf(newKey));
        if (blocked.length > 0) return { ok: false, blocked, changed: [], count: 0 };
        const changed = new Set();
        for (const ref of matches) {
            ref.set(ref.kind === 'name' ? newName : String(newPath).replace(/\\/g, '/'));
            changed.add(ref.source);
        }
        return { ok: true, blocked: [], changed: [...changed], count: matches.filter(r => !r.display).length };
    }
};

// 64-bit difference hashes (9x8 greyscale, left-vs-right) for duplicates and look-alikes.
DocsDoodads.Similarity = {
    grey(data, i) {
        const a = data[i + 3] / 255;
        const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        return lum * a + 128 * (1 - a);
    },

    hashPixels(data, width, height, frame) {
        const f = frame || { x: 0, y: 0, w: width, h: height };
        const sums = new Float64Array(72), counts = new Float64Array(72);
        for (let y = 0; y < f.h; y++) {
            const cy = Math.min(7, Math.floor(y * 8 / f.h));
            for (let x = 0; x < f.w; x++) {
                const cx = Math.min(8, Math.floor(x * 9 / f.w));
                const cell = cy * 9 + cx;
                sums[cell] += this.grey(data, ((f.y + y) * width + f.x + x) * 4);
                counts[cell]++;
            }
        }
        let hex = '';
        for (let row = 0; row < 8; row++) {
            let byte = 0;
            for (let col = 0; col < 8; col++) {
                const left = sums[row * 9 + col] / Math.max(1, counts[row * 9 + col]);
                const right = sums[row * 9 + col + 1] / Math.max(1, counts[row * 9 + col + 1]);
                byte = (byte << 1) | (left < right - 0.5 ? 1 : 0);
            }
            hex += byte.toString(16).padStart(2, '0');
        }
        return hex;
    },

    popcount(n) {
        n = n - ((n >>> 1) & 0x55555555);
        n = (n & 0x33333333) + ((n >>> 2) & 0x33333333);
        return (((n + (n >>> 4)) & 0x0F0F0F0F) * 0x01010101) >>> 24;
    },

    hamming(a, b) {
        if (!a || !b) return 64;
        return this.popcount((parseInt(a.slice(0, 8), 16) ^ parseInt(b.slice(0, 8), 16)) >>> 0) +
            this.popcount((parseInt(a.slice(8, 16), 16) ^ parseInt(b.slice(8, 16), 16)) >>> 0);
    },

    bitsOf(hex) {
        let bits = '';
        for (const ch of hex) bits += parseInt(ch, 16).toString(2).padStart(4, '0');
        return bits;
    },

    // Groups entries within maxDistance bits. Splitting the hash into maxDistance + 1 bands means
    // any close pair shares at least one band exactly, so only same-band buckets are compared.
    findDuplicates(entries, maxDistance = 4) {
        const items = (entries || []).filter(e => e && e.hash);
        const parent = items.map((_, i) => i);
        const find = i => (parent[i] === i ? i : (parent[i] = find(parent[i])));
        const bandCount = Math.min(16, maxDistance + 1);
        const bandSize = Math.ceil(64 / bandCount);
        const bits = items.map(e => this.bitsOf(e.hash));
        const compared = new Set();
        for (let band = 0; band < bandCount; band++) {
            const buckets = new Map();
            items.forEach((e, i) => {
                const key = bits[i].slice(band * bandSize, (band + 1) * bandSize);
                if (!buckets.has(key)) buckets.set(key, []);
                buckets.get(key).push(i);
            });
            for (const bucket of buckets.values()) {
                for (let x = 0; x < bucket.length; x++) {
                    for (let y = x + 1; y < bucket.length; y++) {
                        const i = bucket[x], j = bucket[y];
                        const pairKey = i < j ? i * 1e6 + j : j * 1e6 + i;
                        if (compared.has(pairKey)) continue;
                        compared.add(pairKey);
                        if (this.hamming(items[i].hash, items[j].hash) <= maxDistance) parent[find(i)] = find(j);
                    }
                }
            }
        }
        const groups = new Map();
        items.forEach((e, i) => {
            const root = find(i);
            if (!groups.has(root)) groups.set(root, []);
            groups.get(root).push(e);
        });
        return [...groups.values()].filter(g => g.length > 1);
    },

    similarTo(hash, entries, limit = 50) {
        return (entries || []).filter(e => e && e.hash)
            .map(entry => ({ entry, distance: this.hamming(hash, entry.hash) }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, limit);
    }
};

// Watches img/ and audio/ while the workspace is open, so saving in Aseprite or Photoshop
// updates the drawer and the placed doodads without restarting. Models (glTF) are watched in the
// folders they and their files are in, so exporting again from Blender shows on the map.
DocsDoodads.LiveReload = {
    watchers: [],
    running: false,
    modelWatchers: new Map(),
    pendingModels: new Set(),
    modelTimer: null,
    pending: new Set(),
    timer: null,
    delay: 300,
    versions: {},

    classify(root, filename) {
        if (!filename) return null;
        const rel = String(filename).replace(/\\/g, '/').replace(/^\/+/, '');
        if (rel.split('/').some(part => part === '_packed' || part.startsWith('.'))) return null;
        if (/\.(tmp|bak)$|\.(dd|qj)(import|txn)-|~$/i.test(rel)) return null;
        if (!DocsDoodads.AssetIndex.isSupportedAssetFile(rel)) return null;
        return `${root}/${rel}`;
    },

    bump(assetPath) {
        this.versions[assetPath] = (this.versions[assetPath] || 0) + 1;
    },

    urlFor(assetPath) {
        const version = this.versions[assetPath];
        return version ? `${assetPath}?v=${version}` : assetPath;
    },

    process(paths, handlers) {
        const unique = [...new Set(paths)];
        const summary = { updated: [], removed: [] };
        for (const p of unique) {
            if (handlers.exists(p)) {
                handlers.index(p);
                summary.updated.push(p);
            } else {
                handlers.remove(p);
                summary.removed.push(p);
            }
            handlers.invalidate(p);
        }
        if (unique.length > 0) handlers.reloadSprites();
        return summary;
    },

    defaultHandlers() {
        const FS = DocsDoodads.FS;
        return {
            exists: p => FS.existsSync(p),
            index: p => {
                const stat = FS.fs.statSync(p);
                DocsDoodads.AssetIndex.indexFile(p, FS.path.basename(p), FS.path.extname(p).toLowerCase(), p, stat);
            },
            remove: p => { delete DocsDoodads.AssetIndex.data.assets[p.toLowerCase()]; },
            invalidate: p => {
                this.bump(p);
                DocsDoodads.Thumbnail.invalidate(p.toLowerCase());
                if (typeof ImageManager !== 'undefined' && ImageManager._cache) {
                    const encoded = typeof Utils !== 'undefined' && Utils.encodeURI ? Utils.encodeURI(p) : p;
                    for (const key of Object.keys(ImageManager._cache)) {
                        if (key === p || key === encoded || key.startsWith(p + '?')) delete ImageManager._cache[key];
                    }
                }
            },
            reloadSprites: () => DocsDoodads.Workspace.refreshSpriteset()
        };
    },

    queue(assetPath) {
        if (!assetPath) return;
        this.pending.add(assetPath);
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.flush(), this.delay);
    },

    flush() {
        const paths = [...this.pending];
        this.pending.clear();
        if (paths.length === 0) return null;
        const summary = this.process(paths, this.defaultHandlers());
        DocsDoodads.AssetIndex.rebuildList();
        DocsDoodads.AssetIndex.save();
        DocsDoodads.Usage.lastIndex = null;
        const ws = DocsDoodads.Workspace;
        if (ws.mounted) {
            if (ws.selectedAsset && ws.selectedAsset.path) {
                const id = String(ws.selectedAsset.path).toLowerCase();
                if (summary.updated.some(p => p.toLowerCase() === id) || summary.removed.some(p => p.toLowerCase() === id)) {
                    ws.selectedAsset = DocsDoodads.AssetIndex.data.assets[id] || null;
                    ws.refreshInspector();
                }
            }
            ws.refreshDrawerCards();
            ws.updateIndexStatus();
            const names = summary.updated.concat(summary.removed).map(p => p.split('/').pop());
            ws.showToast(`Reloaded ${names.slice(0, 3).join(', ')}${names.length > 3 ? ` and ${names.length - 3} more` : ''}.`);
        }
        return summary;
    },

    // Watches each folder holding a model's files (once each); called whenever a model is loaded.
    watchModels() {
        const FS = DocsDoodads.FS;
        if (!this.running || !FS.fs || typeof FS.fs.watch !== 'function' || !DocsDoodads.Models) return;
        for (const dir of DocsDoodads.Models.directories()) {
            if (this.modelWatchers.has(dir) || !FS.fs.existsSync(dir)) continue;
            try {
                this.modelWatchers.set(dir, this.quietOnError(FS.fs.watch(dir, (event, file) => { if (file) this.queueModel(FS.path.join(dir, String(file))); })));
            } catch (error) {
                DocsDoodads.Core.log(`Live reload unavailable for models in ${dir}`, error);
            }
        }
    },

    // A watched folder deleted or renamed (EPERM on Windows) stops that watcher instead of throwing.
    quietOnError(watcher) {
        if (watcher && typeof watcher.on === 'function') {
            watcher.on('error', error => {
                DocsDoodads.Core.log('Live reload stopped watching a folder', error);
                try { watcher.close(); } catch (e) {}
            });
        }
        return watcher;
    },

    queueModel(file) {
        if (/\.(tmp|bak)$|~$/i.test(file)) return;
        this.pendingModels.add(file);
        clearTimeout(this.modelTimer);
        this.modelTimer = setTimeout(() => this.flushModels(), this.delay);
    },

    flushModels() {
        const files = [...this.pendingModels];
        this.pendingModels.clear();
        if (!files.length || !DocsDoodads.Models) return [];
        const reloaded = DocsDoodads.Models.reloadFiles(files);
        const ws = DocsDoodads.Workspace;
        if (reloaded.length && ws && ws.mounted) {
            const names = reloaded.map(p => p.split('/').pop());
            ws.showToast(`Reloaded ${names.slice(0, 3).join(', ')}${names.length > 3 ? ` and ${names.length - 3} more` : ''}.`);
        }
        return reloaded;
    },

    start() {
        this.stop();
        const fs = DocsDoodads.FS.fs;
        if (!fs || typeof fs.watch !== 'function') return false;
        this.running = true;
        this.watchModels();
        for (const root of ['img', 'audio']) {
            if (!fs.existsSync(root)) continue;
            try {
                this.watchers.push(this.quietOnError(fs.watch(root, { recursive: true }, (event, file) => this.queue(this.classify(root, file)))));
            } catch (error) {
                DocsDoodads.Core.log(`Live reload unavailable for ${root}`, error);
            }
        }
        return this.watchers.length > 0 || this.modelWatchers.size > 0;
    },

    stop() {
        for (const watcher of this.watchers) {
            try { watcher.close(); } catch (error) {}
        }
        this.watchers = [];
        clearTimeout(this.timer);
        this.pending.clear();
        for (const watcher of this.modelWatchers.values()) {
            try { watcher.close(); } catch (error) {}
        }
        this.modelWatchers.clear();
        clearTimeout(this.modelTimer);
        this.pendingModels.clear();
        this.running = false;
    }
};

// Optional per-map texture packing: every image region a map's doodads use is copied into a few
// sheets so the deployed game loads and draws fewer textures. Playtests keep using the originals.
DocsDoodads.Packer = {
    manifestPath: 'data/DocsDoodadsPacked.json',
    sheetDirectory: 'img/doodads/_packed',
    data: { version: 1, maps: {} },
    previewInTest: false,

    shouldUse() {
        return !DocsDoodads.Compat.isTest() || this.previewInTest;
    },

    regionOf(d) {
        const xf = Math.max(1, d.xFrame || 1), yf = Math.max(1, d.yFrame || 1);
        return { x: d.frameX || 0, y: d.frameY || 0, w: (d.frameW || 48) * xf, h: (d.frameH || 48) * yf };
    },

    keyFor(d) {
        const r = this.regionOf(d);
        return `${String(d.bit[1]).replace(/\\/g, '/')}|${r.x}|${r.y}|${r.w}|${r.h}`;
    },

    regionsFor(doodads) {
        const seen = new Map();
        for (const d of doodads || []) {
            if (!d || !d.bit || d.bit[0] !== 3) continue;
            const key = this.keyFor(d);
            if (!seen.has(key)) seen.set(key, { key, path: String(d.bit[1]).replace(/\\/g, '/'), rect: this.regionOf(d) });
        }
        return [...seen.values()];
    },

    // Shelf packing, tallest first; anything larger than a sheet is left out (and keeps its original image).
    pack(rects, options = {}) {
        const maxSize = options.maxSize || 2048;
        const padding = options.padding !== undefined ? options.padding : 2;
        const sheets = [];
        const skipped = [];
        const order = rects.slice().sort((a, b) => (b.h - a.h) || (b.w - a.w) || String(a.key).localeCompare(String(b.key)));
        for (const rect of order) {
            if (rect.w > maxSize || rect.h > maxSize) { skipped.push(rect); continue; }
            let placed = false;
            for (const sheet of sheets) {
                for (const shelf of sheet.shelves) {
                    if (rect.h <= shelf.h && shelf.x + rect.w <= maxSize) {
                        sheet.items.push({ key: rect.key, x: shelf.x, y: shelf.y, w: rect.w, h: rect.h });
                        shelf.x += rect.w + padding;
                        placed = true;
                        break;
                    }
                }
                if (!placed && sheet.nextY + rect.h <= maxSize) {
                    const shelf = { y: sheet.nextY, h: rect.h, x: rect.w + padding };
                    sheet.shelves.push(shelf);
                    sheet.items.push({ key: rect.key, x: 0, y: shelf.y, w: rect.w, h: rect.h });
                    sheet.nextY += rect.h + padding;
                    placed = true;
                }
                if (placed) break;
            }
            if (!placed) {
                sheets.push({ shelves: [{ y: 0, h: rect.h, x: rect.w + padding }], nextY: rect.h + padding, items: [{ key: rect.key, x: 0, y: 0, w: rect.w, h: rect.h }] });
            }
        }
        return {
            sheets: sheets.map(s => ({
                w: Math.max(...s.items.map(i => i.x + i.w)),
                h: Math.max(...s.items.map(i => i.y + i.h)),
                items: s.items
            })),
            skipped
        };
    },

    buildManifest(mapId, regions, packed, mtimes) {
        const name = i => `${this.sheetDirectory}/Map${String(mapId).padStart(3, '0')}_${i}.png`;
        const frames = {};
        packed.sheets.forEach((sheet, i) => sheet.items.forEach(item => { frames[item.key] = { sheet: i, x: item.x, y: item.y, w: item.w, h: item.h }; }));
        const sources = {};
        for (const r of regions) if (frames[r.key]) sources[r.path] = mtimes[r.path] || 0;
        return { mapId: Number(mapId), builtAt: Date.now(), sheets: packed.sheets.map((s, i) => name(i)), sizes: packed.sheets.map(s => ({ w: s.w, h: s.h })), frames, sources };
    },

    forMap(mapId) {
        return this.data && this.data.maps ? this.data.maps[mapId] || null : null;
    },

    resolve(manifest, d) {
        if (!manifest || !d || !d.bit || d.bit[0] !== 3) return null;
        const entry = manifest.frames[this.keyFor(d)];
        return entry ? { sheet: manifest.sheets[entry.sheet], x: entry.x, y: entry.y, w: entry.w, h: entry.h } : null;
    },

    staleSources(manifest, mtimeOf) {
        if (!manifest) return [];
        return Object.keys(manifest.sources || {}).filter(p => mtimeOf(p) !== manifest.sources[p]);
    },

    manifestExists() {
        return Boolean(DocsDoodads.FS.fs && DocsDoodads.FS.existsSync(this.manifestPath));
    },

    // Desktop builds check the file directly; browser builds only ask when the doodads file says packing is used.
    shouldRequestManifest() {
        if (DocsDoodads.FS.fs) return this.manifestExists();
        return Boolean(typeof window !== 'undefined' && window.$dataDocsDoodads && window.$dataDocsDoodads.usesPacking);
    },

    clampRegions(regions, sizeOf) {
        return regions.map(r => {
            const size = sizeOf(r.path);
            return size ? Object.assign({}, r, { rect: DocsDoodads.safeFrame(r.rect, size.w, size.h) }) : r;
        });
    }
};

