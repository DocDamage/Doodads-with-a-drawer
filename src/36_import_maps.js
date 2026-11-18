// @editor-only
//==========================================================
// SECTION 24M: BRINGING IN TILED AND LDTK MAPS (7.1.6)
//==========================================================
// Tiled and LDtk tilesets are not MZ tilesets, so tiles are not turned into MZ tile ids: every tile layer is
// drawn into one picture shown as a picture layer, objects with a tile become doodads (their pictures cut
// from the tilesets), and collision becomes painted collision (DocsDoodads.Walls). Both readers return one
// plain model; `plan` says what will be written before anything is. Pure: files are read through `readFile`.
DocsDoodads.MapImport = {
    flips: { h: 0x80000000, v: 0x40000000, d: 0x20000000, hex: 0x10000000 },
    maxPixels: 8192 * 8192,

    fail(message) { throw new Error(message); },

    // A path beside the file that names it ("../tiles/a.png" from "maps/one.tmj" is "tiles/a.png").
    join(base, rel) {
        const parts = String(base || '').replace(/\\/g, '/').split('/').slice(0, -1);
        for (const part of String(rel || '').replace(/\\/g, '/').split('/')) {
            if (!part || part === '.') continue;
            if (part === '..') { if (parts.length && parts[parts.length - 1] !== '..') parts.pop(); else parts.push('..'); } else parts.push(part);
        }
        return parts.join('/');
    },

    slug(text) {
        return String(text || '').normalize ? String(text || '').normalize('NFKD').replace(/[^\w-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'Layer'
            : String(text || 'Layer').replace(/[^\w-]+/g, '_').slice(0, 40);
    },

    // ---- Tiled JSON (.tmj / .json) ----
    // readFile(path) → parsed JSON (for an external tileset, .tsj); inflate(bytes, kind) → bytes for
    // base64 data compressed with zlib or gzip. `file` is the map's own path, for relative names.
    readTiled(json, readFile, options = {}) {
        if (!json || typeof json !== 'object') this.fail('This is not a Tiled map.');
        if (json.infinite) this.fail('Infinite Tiled maps cannot be brought in; save the map at a fixed size (Map → Map Properties → Infinite off).');
        if (json.orientation && json.orientation !== 'orthogonal') this.fail(`Only orthogonal Tiled maps can be brought in (this one is ${json.orientation}).`);
        const width = Math.floor(Number(json.width)), height = Math.floor(Number(json.height));
        const tw = Math.floor(Number(json.tilewidth)), th = Math.floor(Number(json.tileheight));
        if (!(width > 0 && height > 0 && tw > 0 && th > 0)) this.fail('The Tiled map has no size.');
        if (tw !== th) this.fail(`Tiles must be square (this map's are ${tw} × ${th}).`);
        if (width * tw * height * th > this.maxPixels) this.fail('The map is too large to bring in as pictures.');
        const file = options.file || '';
        const tilesets = (json.tilesets || []).map(ts => {
            let set = ts, base = file;
            if (ts && ts.source) {
                base = this.join(file, ts.source);
                set = Object.assign({}, readFile(base), { firstgid: ts.firstgid });
            }
            if (!set || !(Number(set.firstgid) > 0)) this.fail('A Tiled tileset is missing its first id.');
            const tiles = {};
            for (const tile of set.tiles || []) if (tile && tile.image) tiles[tile.id] = { image: this.join(base, tile.image), w: Number(tile.imagewidth) || tw, h: Number(tile.imageheight) || th };
            return {
                firstgid: Number(set.firstgid), name: set.name || 'tiles', image: set.image ? this.join(base, set.image) : '', tiles,
                columns: Math.max(1, Number(set.columns) || 1), tw: Number(set.tilewidth) || tw, th: Number(set.tileheight) || th,
                margin: Number(set.margin) || 0, spacing: Number(set.spacing) || 0
            };
        }).sort((a, b) => a.firstgid - b.firstgid);
        const tileOf = raw => {
            const gid = Number(raw) >>> 0, flags = this.flips, id = gid & ~(flags.h | flags.v | flags.d | flags.hex);
            if (!id) return null;
            let set = null;
            for (const ts of tilesets) if (ts.firstgid <= id) set = ts;
            if (!set) this.fail(`Tile ${id} belongs to no tileset.`);
            const local = id - set.firstgid, own = set.tiles[local];
            const where = own ? { image: own.image, sx: 0, sy: 0, w: own.w, h: own.h }
                : { image: set.image, sx: set.margin + (local % set.columns) * (set.tw + set.spacing), sy: set.margin + Math.floor(local / set.columns) * (set.th + set.spacing), w: set.tw, h: set.th };
            if (!where.image) this.fail(`Tile ${id} has no picture.`);
            return Object.assign(where, { flipX: Boolean(gid & flags.h), flipY: Boolean(gid & flags.v), diagonal: Boolean(gid & flags.d) });
        };
        const layers = [];
        const decode = layer => {
            if (Array.isArray(layer.data)) return layer.data;
            if (typeof layer.data !== 'string' || layer.encoding !== 'base64') this.fail(`Layer "${layer.name}" uses data this importer cannot read.`);
            let bytes = typeof Buffer !== 'undefined' ? Buffer.from(layer.data, 'base64') : Uint8Array.from(atob(layer.data), c => c.charCodeAt(0));
            if (layer.compression === 'zlib' || layer.compression === 'gzip') {
                if (!options.inflate) this.fail(`Layer "${layer.name}" is compressed and cannot be read here.`);
                bytes = options.inflate(bytes, layer.compression);
            } else if (layer.compression) this.fail(`Layer "${layer.name}" uses ${layer.compression} compression; save it as CSV or zlib in Tiled.`);
            const out = [];
            for (let i = 0; i + 3 < bytes.length; i += 4) out.push((bytes[i] | (bytes[i + 1] << 8) | (bytes[i + 2] << 16) | (bytes[i + 3] << 24)) >>> 0);
            return out;
        };
        const walk = (list, prefix, ox, oy, opacity) => {
            for (const layer of list || []) {
                if (!layer || layer.visible === false) continue;
                const name = (prefix ? prefix + ' / ' : '') + (layer.name || 'Layer');
                const dx = ox + (Number(layer.offsetx) || 0), dy = oy + (Number(layer.offsety) || 0), alpha = opacity * (layer.opacity === undefined ? 1 : Number(layer.opacity));
                if (layer.type === 'group') { walk(layer.layers, name, dx, dy, alpha); continue; }
                const collision = /collision|collide|solid|wall/i.test(layer.name || '');
                if (layer.type === 'tilelayer') {
                    const data = decode(layer), lw = Number(layer.width) || width;
                    if (collision) {
                        const rects = [];
                        data.forEach((gid, i) => { if (gid >>> 0) rects.push({ x: dx + (i % lw) * tw, y: dy + Math.floor(i / lw) * th, w: tw, h: th }); });
                        layers.push({ kind: 'collision', name, rects });
                        continue;
                    }
                    const tiles = [];
                    data.forEach((gid, i) => {
                        const tile = tileOf(gid);
                        if (tile) tiles.push(Object.assign(tile, { x: dx + (i % lw) * tw, y: dy + Math.floor(i / lw) * th + th - tile.h, dw: tile.w, dh: tile.h }));
                    });
                    layers.push({ kind: 'tiles', name, opacity: alpha, tiles });
                } else if (layer.type === 'objectgroup') {
                    if (collision) {
                        layers.push({ kind: 'collision', name, rects: (layer.objects || []).filter(o => o && o.visible !== false && !o.gid && Number(o.width) > 0 && Number(o.height) > 0)
                            .map(o => ({ x: dx + Number(o.x), y: dy + Number(o.y), w: Number(o.width), h: Number(o.height) })) });
                        continue;
                    }
                    const objects = [];
                    for (const o of layer.objects || []) {
                        if (!o || o.visible === false) continue;
                        const tile = o.gid ? tileOf(o.gid) : null;
                        // A tile object's y is its bottom edge; a shape's is its top.
                        const w = Number(o.width) || (tile ? tile.w : 0), h = Number(o.height) || (tile ? tile.h : 0);
                        const top = tile ? Number(o.y) - h : Number(o.y);
                        objects.push({ name: String(o.name || ''), type: String(o.type || o.class || ''), x: dx + Number(o.x), y: dy + top, w, h, tile });
                    }
                    layers.push({ kind: 'objects', name, objects });
                }
                // Image layers are left out: a picture layer of their own can be added after.
            }
        };
        walk(json.layers, '', 0, 0, 1);
        return { source: 'tiled', width: width * tw, height: height * th, tile: tw, layers };
    },

    // ---- LDtk (.ldtk) ----
    // One level (by index); a level saved in its own file is read through readFile.
    readLdtk(json, readFile, levelIndex = 0, options = {}) {
        if (!json || !Array.isArray(json.levels)) this.fail('This is not an LDtk project.');
        const file = options.file || '';
        let level = json.levels[Math.max(0, Math.floor(Number(levelIndex) || 0))];
        if (!level) this.fail('The LDtk project has no such level.');
        if (!level.layerInstances && level.externalRelPath) level = readFile(this.join(file, level.externalRelPath));
        const width = Math.floor(Number(level.pxWid)), height = Math.floor(Number(level.pxHei));
        if (!(width > 0 && height > 0)) this.fail('The LDtk level has no size.');
        if (width * height > this.maxPixels) this.fail('The level is too large to bring in as pictures.');
        const tilesets = {};
        for (const ts of (json.defs && json.defs.tilesets) || []) if (ts && ts.relPath) tilesets[ts.uid] = this.join(file, ts.relPath);
        const instances = (level.layerInstances || []).slice().reverse();
        const grid = instances.reduce((size, l) => size || Number(l && l.__gridSize) || 0, 0) || Number(json.defaultGridSize) || 16;
        const layers = [];
        for (const layer of instances) {
            if (!layer || layer.visible === false) continue;
            const name = layer.__identifier || 'Layer', ox = Number(layer.__pxTotalOffsetX) || 0, oy = Number(layer.__pxTotalOffsetY) || 0;
            const size = Number(layer.__gridSize) || grid, alpha = layer.__opacity === undefined ? 1 : Number(layer.__opacity);
            if (layer.__type === 'IntGrid') {
                const rects = [], cols = Number(layer.__cWid) || 0;
                (layer.intGridCsv || []).forEach((value, i) => { if (value) rects.push({ x: ox + (i % cols) * size, y: oy + Math.floor(i / cols) * size, w: size, h: size }); });
                layers.push({ kind: 'collision', name, rects });
            }
            const placed = layer.__type === 'Tiles' ? layer.gridTiles : layer.autoLayerTiles;
            if ((layer.__type === 'Tiles' || layer.__type === 'AutoLayer' || (layer.__type === 'IntGrid' && placed && placed.length)) && placed && placed.length) {
                const image = layer.__tilesetRelPath ? this.join(file, layer.__tilesetRelPath) : tilesets[layer.__tilesetDefUid];
                if (!image) this.fail(`Layer "${name}" has no tileset picture.`);
                layers.push({ kind: 'tiles', name, opacity: alpha, tiles: placed.map(t => ({
                    image, sx: t.src[0], sy: t.src[1], w: size, h: size, x: ox + t.px[0], y: oy + t.px[1], dw: size, dh: size,
                    flipX: Boolean(t.f & 1), flipY: Boolean(t.f & 2), diagonal: false
                })) });
            }
            if (layer.__type === 'Entities') {
                layers.push({ kind: 'objects', name, objects: (layer.entityInstances || []).map(e => {
                    const w = Number(e.width) || 0, h = Number(e.height) || 0, pivot = e.__pivot || [0, 0];
                    const tile = e.__tile && tilesets[e.__tile.tilesetUid] ? { image: tilesets[e.__tile.tilesetUid], sx: e.__tile.x, sy: e.__tile.y, w: e.__tile.w, h: e.__tile.h, flipX: false, flipY: false, diagonal: false } : null;
                    return { name: String(e.__identifier || ''), type: String(e.__identifier || ''), x: ox + e.px[0] - pivot[0] * w, y: oy + e.px[1] - pivot[1] * h, w, h, tile };
                }) });
            }
        }
        return { source: 'ldtk', width, height, tile: grid, level: level.identifier || '', layers };
    },

    levels(json) {
        return Array.isArray(json && json.levels) ? json.levels.map((l, i) => ({ index: i, name: (l && l.identifier) || `Level ${i + 1}` })) : [];
    },

    // ---- What will be made ----
    // options: { projectTile, mapId, baseName, mapName, tilesetId, cell, scale ('auto'|'refuse') }.
    plan(model, options = {}) {
        const projectTile = Math.max(1, Number(options.projectTile) || 48), source = Math.max(1, Number(model.tile) || projectTile);
        let scale = 1;
        const notices = [];
        if (source !== projectTile) {
            if (options.scale === 'refuse') this.fail(`The map's tiles are ${source} pixels and this project's are ${projectTile}.`);
            scale = projectTile / source;
            notices.push(`The map's ${source}-pixel tiles are scaled ×${Math.round(scale * 100) / 100} to this project's ${projectTile}-pixel tiles.`);
        }
        const width = Math.ceil(model.width * scale / projectTile), height = Math.ceil(model.height * scale / projectTile);
        if (width > 256 || height > 256) this.fail(`The map would be ${width} × ${height} tiles; MZ allows at most 256 × 256.`);
        const base = this.slug(options.baseName || 'Imported'), mapId = Math.max(1, Math.floor(Number(options.mapId) || 1));
        const pictureW = Math.round(model.width * scale), pictureH = Math.round(model.height * scale);
        const objectIndex = model.layers.findIndex(l => l.kind === 'objects' && /^player$/i.test(l.name));
        const split = objectIndex >= 0 ? objectIndex : model.layers.findIndex(l => l.kind === 'objects');
        const files = [], layers2d = [], doodads = [], pieces = new Map(), skipped = [];
        const names = new Set();
        model.layers.forEach((layer, index) => {
            if (layer.kind === 'tiles') {
                if (!layer.tiles.length) return;
                let name = `${base}_${mapId}_${this.slug(layer.name)}`;
                for (let n = 2; names.has(name.toLowerCase()); n++) name = `${base}_${mapId}_${this.slug(layer.name)}_${n}`;
                names.add(name.toLowerCase());
                // Drawn at full strength: the layer's opacity is set once, on the picture layer below (drawing it
                // into the picture as well made a half-transparent roof show at a quarter).
                files.push({ path: `img/parallaxes/${name}.png`, kind: 'layer', width: pictureW, height: pictureH, opacity: 1, draws: layer.tiles.map(t => Object.assign({}, t, {
                    x: t.x * scale, y: t.y * scale, dw: t.dw * scale, dh: t.dh * scale })) });
                layers2d.push({ image: name, place: split >= 0 && index > split ? 'front' : 'back', follow: 1, scrollX: 0, scrollY: 0, zoom: 1,
                    opacity: Math.max(0, Math.min(1, Number(layer.opacity) || 0)), blend: 'normal', loopX: false, loopY: false, wind: false });
            } else if (layer.kind === 'objects') {
                for (const o of layer.objects) {
                    if (!o.tile) { skipped.push(`${layer.name}: "${o.name || o.type || 'object'}" has no picture`); continue; }
                    const t = o.tile, key = `${t.image}|${t.sx}|${t.sy}|${t.w}|${t.h}|${t.flipX ? 1 : 0}${t.flipY ? 1 : 0}${t.diagonal ? 1 : 0}`;
                    if (!pieces.has(key)) {
                        const file = `img/doodads/${base}/${this.slug(String(t.image).split('/').pop().replace(/\.[^.]+$/, ''))}_${t.sx}_${t.sy}_${t.w}x${t.h}${t.flipX ? 'h' : ''}${t.flipY ? 'v' : ''}${t.diagonal ? 'd' : ''}.png`;
                        pieces.set(key, file);
                        files.push({ path: file, kind: 'piece', width: t.w, height: t.h, opacity: 1, draws: [Object.assign({}, t, { x: 0, y: 0, dw: t.w, dh: t.h })] });
                    }
                    const w = (o.w || t.w) * scale, h = (o.h || t.h) * scale;
                    doodads.push({ path: pieces.get(key), x: Math.round((o.x + (o.w || t.w) / 2) * scale), y: Math.round((o.y + (o.h || t.h)) * scale),
                        frameW: t.w, frameH: t.h, scaleX: Math.round(w / t.w * 1000) / 1000, scaleY: Math.round(h / t.h * 1000) / 1000, name: o.name });
                }
            }
        });
        // Collision rectangles become painted cells: a cell is blocked when its middle is inside a rectangle.
        const cell = Math.max(1, Math.floor(Number(options.cell) || Math.max(1, Math.round(projectTile / 4))));
        const rects = model.layers.filter(l => l.kind === 'collision').flatMap(l => l.rects).map(r => ({ x: r.x * scale, y: r.y * scale, w: r.w * scale, h: r.h * scale }));
        let walls = null;
        if (rects.length) {
            const cw = Math.ceil(width * projectTile / cell), ch = Math.ceil(height * projectTile / cell);
            walls = { cell, w: cw, h: ch, cells: Array.from({ length: ch }, () => new Uint8Array(cw)) };
            for (const r of rects) {
                const x0 = Math.max(0, Math.floor(r.x / cell)), x1 = Math.min(cw - 1, Math.ceil((r.x + r.w) / cell));
                const y0 = Math.max(0, Math.floor(r.y / cell)), y1 = Math.min(ch - 1, Math.ceil((r.y + r.h) / cell));
                for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
                    const mx = (cx + 0.5) * cell, my = (cy + 0.5) * cell;
                    if (mx >= r.x && mx < r.x + r.w && my >= r.y && my < r.y + r.h) walls.cells[cy][cx] = 1;
                }
            }
        }
        if (skipped.length) notices.push(`${skipped.length} object(s) without a picture are left out.`);
        return {
            mapId, width, height, scale, notices, skipped, files, layers2d, doodads, walls,
            mapInfo: { id: mapId, expanded: false, name: String(options.mapName || base).slice(0, 60), order: mapId, parentId: 0, scrollX: 0, scrollY: 0 },
            map: this.emptyMap(width, height, Number(options.tilesetId) || 1)
        };
    },

    // A new MZ map with no tiles: the picture layers are its look, and "empty tiles are floor" makes it walkable.
    emptyMap(width, height, tilesetId) {
        const audio = { name: '', pan: 0, pitch: 100, volume: 90 };
        return {
            autoplayBgm: false, autoplayBgs: false, battleback1Name: '', battleback2Name: '', bgm: Object.assign({}, audio), bgs: Object.assign({}, audio),
            disableDashing: false, displayName: '', encounterList: [], encounterStep: 30, height, note: '', parallaxLoopX: false, parallaxLoopY: false,
            parallaxName: '', parallaxShow: true, parallaxSx: 0, parallaxSy: 0, scrollType: 0, specifyBattleback: false, tilesetId, width,
            data: new Array(width * height * 6).fill(0), events: [null]
        };
    },

    nextMapId(mapInfos) {
        let id = 1;
        for (const info of mapInfos || []) if (info && Number(info.id) >= id) id = Number(info.id) + 1;
        return id;
    }
};
