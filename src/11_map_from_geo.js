// @editor-only
//==========================================================
// SECTION 5H2: A REAL PLACE (8.5.5)
//==========================================================
// MapFrom.fromGeo turns map features (lines and shapes with a type, in longitude and latitude) and a grid of heights
// into a plan for Picture to Map's building step: roads and rivers as lines of tiles with a width by type, water,
// forests and buildings filled, heights scaled to the hill range, a bridge where a road crosses water. It reads
// OpenStreetMap extracts (.osm) and GeoJSON that the user downloaded themselves: no connection is ever made.
// OpenStreetMap data is under the ODbL: "© OpenStreetMap contributors" must be shown in the game; Apply writes it
// into CREDITS_MAPS.txt.
Object.assign(DocsDoodads.MapFrom, {
    geoCredit: 'Map data © OpenStreetMap contributors, available under the Open Database License (ODbL): https://www.openstreetmap.org/copyright',

    // A feature's type from its tags (OpenStreetMap's keys), or null for what is left out.
    geoType(tags) {
        const t = tags || {};
        if (t.highway) return ['motorway', 'trunk', 'primary'].includes(t.highway) ? 'roadWide' : ['footway', 'path', 'track', 'cycleway', 'steps'].includes(t.highway) ? 'path' : 'road';
        if (t.waterway) return ['river', 'canal'].includes(t.waterway) ? 'river' : 'stream';
        if (t.natural === 'water' || t.landuse === 'reservoir' || t.water || t.natural === 'bay') return 'water';
        if (t.landuse === 'forest' || t.natural === 'wood') return 'forest';
        if (t.building) return 'building';
        if (t.natural === 'sand' || t.natural === 'beach' || t.natural === 'desert') return 'sand';
        if (t.natural === 'peak' || t.natural === 'ridge') return 'mountain';
        if (t.landuse === 'meadow' || t.landuse === 'grass' || t.leisure === 'park') return 'grass';
        if (t.place && ['city', 'town', 'village', 'hamlet'].includes(t.place)) return 'place';
        return null;
    },

    // The class each type becomes for a kind of map.
    geoClasses: {
        overworld: { road: 'road', roadWide: 'road', path: null, river: 'water', stream: 'water', water: 'water', forest: 'forest', building: null, sand: 'desert', mountain: 'mountain', grass: 'grass', place: 'place' },
        town: { road: 'road', roadWide: 'road', path: 'road', river: 'water', stream: 'water', water: 'water', forest: 'tree', building: 'building', sand: 'ground', mountain: null, grass: 'grass', place: null },
        dungeon: {}, room: {}
    },
    geoWidth: { roadWide: 3, road: 2, path: 1, river: 3, stream: 1 },
    geoOrder: ['grass', 'sand', 'forest', 'water', 'mountain', 'building', 'stream', 'river', 'path', 'road', 'roadWide', 'place'],

    // ---- Reading files ----
    // GeoJSON: [{ type, kind: 'line' | 'shape' | 'point', coords: [[lon, lat], ...] }].
    readGeoJson(json) {
        const data = typeof json === 'string' ? JSON.parse(json) : json, out = [];
        const add = (tags, kind, coords) => { const type = this.geoType(tags); if (type && coords && coords.length) out.push({ type, kind, coords, name: tags && tags.name ? String(tags.name) : '' }); };
        for (const f of (data && data.features) || []) {
            const g = f && f.geometry, tags = (f && f.properties) || {};
            if (!g) continue;
            if (g.type === 'LineString') add(tags, 'line', g.coordinates);
            else if (g.type === 'MultiLineString') for (const c of g.coordinates) add(tags, 'line', c);
            else if (g.type === 'Polygon') add(tags, 'shape', g.coordinates[0]);
            else if (g.type === 'MultiPolygon') for (const p of g.coordinates) add(tags, 'shape', p[0]);
            else if (g.type === 'Point') add(tags, 'point', [g.coordinates]);
        }
        return out;
    },

    // An OpenStreetMap extract (.osm XML): nodes and ways with their tags; a closed way of an area type is a shape.
    readOsm(text) {
        const nodes = new Map(), out = [];
        const attrs = s => { const o = {}; for (const m of String(s).matchAll(/(\w+)="([^"]*)"/g)) o[m[1]] = m[2]; return o; };
        const tagsOf = body => { const t = {}; for (const m of String(body || '').matchAll(/<tag\s+([^>]*?)\/?>/g)) { const a = attrs(m[1]); if (a.k) t[a.k] = a.v; } return t; };
        for (const m of String(text).matchAll(/<node\s+([^>]*?)(\/>|>([\s\S]*?)<\/node>)/g)) {
            const a = attrs(m[1]);
            nodes.set(a.id, [Number(a.lon), Number(a.lat)]);
            const tags = tagsOf(m[3]), type = this.geoType(tags);
            if (type) out.push({ type, kind: 'point', coords: [[Number(a.lon), Number(a.lat)]], name: tags.name || '' });
        }
        for (const m of String(text).matchAll(/<way\s+([^>]*?)>([\s\S]*?)<\/way>/g)) {
            const refs = Array.from(m[2].matchAll(/<nd\s+ref="([^"]+)"/g)).map(r => nodes.get(r[1])).filter(Boolean);
            const tags = tagsOf(m[2]), type = this.geoType(tags);
            if (!type || refs.length < 2) continue;
            const closed = refs.length > 3 && refs[0][0] === refs[refs.length - 1][0] && refs[0][1] === refs[refs.length - 1][1];
            const area = closed && !['road', 'roadWide', 'path', 'river', 'stream'].includes(type);
            out.push({ type, kind: area ? 'shape' : 'line', coords: refs, name: tags.name || '' });
        }
        return out;
    },

    // The box round every feature: { west, south, east, north }.
    geoBox(features) {
        let west = Infinity, south = Infinity, east = -Infinity, north = -Infinity;
        for (const f of features) for (const [lon, lat] of f.coords) { west = Math.min(west, lon); east = Math.max(east, lon); south = Math.min(south, lat); north = Math.max(north, lat); }
        return Number.isFinite(west) ? { west, south, east, north } : null;
    },

    // The real size of a box in metres: { w, h }.
    geoMetres(box) {
        const R = 6371000, rad = Math.PI / 180, mid = (box.north + box.south) / 2 * rad;
        return { w: Math.abs(box.east - box.west) * rad * R * Math.cos(mid), h: Math.abs(box.north - box.south) * rad * R };
    },

    // features → a plan of w × h tiles for a kind. heights: { w, h, values (0-1) } or null.
    fromGeo(features, heights, box, kind, size) {
        const w = Math.max(1, Math.floor(size.w)), h = Math.max(1, Math.floor(size.h));
        const base = kind.base || kind.id, classes = this.geoClasses[base] || {};
        const cells = new Array(w * h).fill(null), types = new Array(w * h).fill(null), out = { w, h, kind: kind.id, cells, heights: null, features: [], options: { geo: true } };
        if (!box || !features.length) return out;
        const spanX = (box.east - box.west) || 1e-9, spanY = (box.north - box.south) || 1e-9;
        const toTile = ([lon, lat]) => ({ x: (lon - box.west) / spanX * w, y: (box.north - lat) / spanY * h });
        const has = id => id && kind.classes.some(c => c.id === id);
        const put = (x, y, type) => {
            x = Math.floor(x); y = Math.floor(y);
            if (x < 0 || y < 0 || x >= w || y >= h) return;
            const i = y * w + x, before = types[i];
            if ((before === 'water' || before === 'river' || before === 'stream') && /^road|^path/.test(type)) out.features.push({ type: 'bridge', x, y, w: 1, h: 1, name: '' });
            types[i] = type;
        };
        const order = t => this.geoOrder.indexOf(t);
        for (const f of features.slice().sort((a, b) => order(a.type) - order(b.type))) {
            const pts = f.coords.map(toTile);
            if (f.kind === 'point') { if (f.type === 'place') out.features.push({ type: 'place', x: Math.floor(pts[0].x), y: Math.floor(pts[0].y), w: 1, h: 1, name: f.name }); else put(pts[0].x, pts[0].y, f.type); continue; }
            if (f.kind === 'shape') {
                let y0 = Infinity, y1 = -Infinity, x0 = Infinity, x1 = -Infinity;
                for (const p of pts) { y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); }
                for (let ty = Math.max(0, Math.floor(y0)); ty <= Math.min(h - 1, Math.floor(y1)); ty++) for (let tx = Math.max(0, Math.floor(x0)); tx <= Math.min(w - 1, Math.floor(x1)); tx++) {
                    const cx = tx + 0.5, cy = ty + 0.5;
                    let inside = false;
                    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
                        const a = pts[i], b = pts[j];
                        if ((a.y > cy) !== (b.y > cy) && cx < (b.x - a.x) * (cy - a.y) / (b.y - a.y) + a.x) inside = !inside;
                    }
                    if (inside) put(tx, ty, f.type);
                }
                continue;
            }
            // A line: stepped finely, as wide as its type.
            const width = this.geoWidth[f.type] || 1, r = (width - 1) / 2;
            for (let i = 1; i < pts.length; i++) {
                const a = pts[i - 1], b = pts[i], n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) * 2));
                for (let k = 0; k <= n; k++) {
                    const x = a.x + (b.x - a.x) * k / n, y = a.y + (b.y - a.y) * k / n;
                    for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) if (Math.hypot(dx, dy) <= r + 0.01) put(x + dx, y + dy, f.type);
                }
            }
        }
        for (let i = 0; i < cells.length; i++) { const c = types[i] && classes[types[i]]; cells[i] = has(c) ? c : null; }
        // Heights: the grey picture scaled to the hill range (0 to 8).
        if (heights && heights.values) {
            const hv = new Array(w * h);
            for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
                const sx = Math.min(heights.w - 1, Math.floor(x / w * heights.w)), sy = Math.min(heights.h - 1, Math.floor(y / h * heights.h));
                hv[y * w + x] = Math.round(Math.max(0, Math.min(1, heights.values[sy * heights.w + sx])) * 8);
            }
            out.heights = hv;
        }
        // Dedupe bridges.
        const seen = new Set();
        out.features = out.features.filter(f => { const k = f.type + f.x + ',' + f.y; if (seen.has(k)) return false; seen.add(k); return true; });
        return out;
    }
});
