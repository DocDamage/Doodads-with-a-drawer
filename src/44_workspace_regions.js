//==========================================================
// SECTION 25l: WORKSPACE REGION BRUSH
//==========================================================
// The Regions tool paints MZ region numbers onto the map's tiles (saved into the map file with the
// other map edits), with a legend of the regions on this map and what uses each. Terrain tags belong to
// the tileset (MZ's database), so they can be shown here but not painted.
DocsDoodads.Ui.css += `
#dd-region-legend { display: flex; flex-direction: column; gap: 2px; max-height: 180px; overflow-y: auto; }
#dd-region-legend .dd-region-row { display: grid; grid-template-columns: 14px 26px 1fr; gap: 6px; align-items: start; padding: 2px 4px; border-radius: 6px; cursor: pointer; }
#dd-region-legend .dd-region-row:hover, #dd-region-legend .dd-region-row.dd-active { background: var(--dd-primary-soft); }
#dd-region-legend .dd-swatch { width: 12px; height: 12px; border-radius: 3px; margin-top: 2px; }
#dd-region-legend .dd-region-uses { color: var(--dd-faint); font-size: 10px; line-height: 1.3; overflow-wrap: anywhere; }
`;

DocsDoodads.Ui.hints.region = 'Regions: drag on the map to paint the region number (0 rubs it out). Alt+click picks up a tile\'s region; [ and ] change the size.';

DocsDoodads.Regions = {
    // MZ keeps regions in the sixth layer of the map data.
    layerIndex(w, h, x, y) {
        return (5 * h + y) * w + x;
    },

    get(data, w, h, x, y) {
        if (!data || x < 0 || y < 0 || x >= w || y >= h) return 0;
        return Number(data[this.layerIndex(w, h, x, y)]) || 0;
    },

    // The tiles a square brush of radius r covers, inside the map.
    footprint(x, y, radius, w, h) {
        const r = Math.max(0, Math.min(6, Math.round(Number(radius) || 0)));
        const out = [];
        for (let ty = y - r; ty <= y + r; ty++) {
            for (let tx = x - r; tx <= x + r; tx++) {
                if (tx >= 0 && ty >= 0 && tx < w && ty < h) out.push({ x: tx, y: ty });
            }
        }
        return out;
    },

    // A colour per region number, far apart for neighbouring numbers.
    color(id) {
        const hue = ((Number(id) || 0) * 137.508) % 360;
        const s = 0.75, l = 0.55;
        const k = n => (n + hue / 30) % 12;
        const a = s * Math.min(l, 1 - l);
        const f = n => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))));
        return (f(0) << 16) | (f(8) << 8) | f(4);
    },

    // How many tiles each region covers: { id: count }.
    counts(data, w, h) {
        const out = {};
        if (!data) return out;
        const start = 5 * w * h;
        for (let i = 0; i < w * h; i++) {
            const id = Number(data[start + i]) || 0;
            if (id > 0) out[id] = (out[id] || 0) + 1;
        }
        return out;
    },

    // What the project does with each region: { id: ['Climbing', ...] }.
    uses(world, mapSettings) {
        const out = {};
        const add = (id, label) => {
            const n = Number(id) || 0;
            if (n <= 0) return;
            (out[n] = out[n] || []).includes(label) || out[n].push(label);
        };
        const ids = text => String(text || '').split(/[\s,;]+/).map(n => parseInt(n, 10)).filter(n => n > 0);
        const t = (world && world.traversal) || {};
        ids(t.climb && t.climb.regions).forEach(id => add(id, 'climbing'));
        ids(t.ice && t.ice.regions).forEach(id => add(id, 'ice'));
        add(t.jump && t.jump.noRegion, 'no jumping');
        add(t.swim && t.swim.noRegion, 'no swimming');
        add(t.fly && t.fly.noRegion, 'no flying');
        add(world && world.reflections && world.reflections.regionId, 'water reflections');
        ((world && world.characterShadows && world.characterShadows.occlusionRegions) || []).forEach(id => add(id, 'stops character shadows'));
        ((world && world.ambience && world.ambience.layers) || []).filter(l => l && l.kind === 'region').forEach(l => add(l.id, 'ambience: ' + (l.sound || l.name || 'sound')));
        ((world && world.footsteps && world.footsteps.rows) || []).filter(r => r && r.kind === 'region').forEach(r => add(r.id, 'footsteps: ' + (r.sound || '')));
        ((mapSettings && mapSettings.regionSounds) || []).forEach(r => add(r && r.regionId, 'background sound: ' + ((r && r.name) || '')));
        return out;
    }
};

Object.assign(DocsDoodads.Workspace, {
    regionBrush: { id: 1, radius: 0, showTags: false },

    // The map's data while editing: what the game reads now ($dataMap) and what Save writes (staged).
    regionTargets(mapId) {
        const live = typeof $gameMap !== 'undefined' && $gameMap && $gameMap.mapId() === mapId && window.$dataMap ? window.$dataMap : null;
        const staged = DocsDoodads.Persistence.stagedFor(mapId);
        return { live, staged };
    },

    setRegionValue(mapId, index, value) {
        const { live, staged } = this.regionTargets(mapId);
        if (live && Array.isArray(live.data)) live.data[index] = value;
        if (staged && Array.isArray(staged.data)) staged.data[index] = value;
        DocsDoodads.Persistence.dirtyMap = true;
    },

    regionMapSize() {
        const m = window.$dataMap;
        return m ? { w: Number(m.width) || 0, h: Number(m.height) || 0, data: m.data } : null;
    },

    // A map loaded from disk while it has unsaved region painting (the editor came back to it): the
    // game's copy takes the painted regions again.
    applyStagedRegions() {
        const gameMap = typeof $gameMap !== 'undefined' ? $gameMap : null;
        const live = window.$dataMap;
        if (!gameMap || !live || !Array.isArray(live.data) || !gameMap._stagedMapData) return 0;
        const owner = gameMap._stagedMapDataId !== undefined ? gameMap._stagedMapDataId : gameMap.mapId();
        const staged = gameMap._stagedMapData;
        if (owner !== gameMap.mapId() || !Array.isArray(staged.data) || staged.width !== live.width || staged.height !== live.height) return 0;
        const start = 5 * live.width * live.height, end = start + live.width * live.height;
        let changed = 0;
        for (let i = start; i < end; i++) {
            const v = Number(staged.data[i]) || 0;
            if ((Number(live.data[i]) || 0) !== v) { live.data[i] = v; changed++; }
        }
        return changed;
    },

    beginRegionStroke(clientX, clientY) {
        const size = this.regionMapSize();
        if (!size || !Array.isArray(size.data)) return false;
        this._regionStroke = { mapId: this.currentMapId(), changes: new Map(), last: null };
        this.regionPaintAt(clientX, clientY);
        return true;
    },

    regionPaintAt(clientX, clientY) {
        const stroke = this._regionStroke;
        const size = this.regionMapSize();
        if (!stroke || !size) return;
        const at = this.clientToMapCoords(clientX, clientY);
        const key = at.tileX + ',' + at.tileY;
        if (stroke.last === key) return;
        stroke.last = key;
        const R = DocsDoodads.Regions;
        const value = Math.max(0, Math.min(255, Math.round(Number(this.regionBrush.id) || 0)));
        for (const t of R.footprint(at.tileX, at.tileY, this.regionBrush.radius, size.w, size.h)) {
            const index = R.layerIndex(size.w, size.h, t.x, t.y);
            const before = Number(size.data[index]) || 0;
            if (!stroke.changes.has(index)) stroke.changes.set(index, { before, after: value });
            else stroke.changes.get(index).after = value;
            if (before !== value) this.setRegionValue(stroke.mapId, index, value);
        }
    },

    // One undo step per stroke (nothing when no tile changed).
    endRegionStroke() {
        const stroke = this._regionStroke;
        this._regionStroke = null;
        if (!stroke) return false;
        const changes = Array.from(stroke.changes.entries()).filter(([, c]) => c.before !== c.after);
        if (changes.length === 0) return false;
        const set = which => { for (const [index, c] of changes) this.setRegionValue(stroke.mapId, index, c[which]); this.renderRegionLegend(); };
        DocsDoodads.Undo.execute({ type: 'region_paint', apply: () => set('after'), revert: () => set('before') });
        this.renderRegionLegend();
        return true;
    },

    // Alt+click: the brush takes the tile's region.
    pickRegionAt(clientX, clientY) {
        const size = this.regionMapSize();
        if (!size) return 0;
        const at = this.clientToMapCoords(clientX, clientY);
        this.setRegionBrushId(DocsDoodads.Regions.get(size.data, size.w, size.h, at.tileX, at.tileY));
        this.showToast(this.regionBrush.id ? `Region ${this.regionBrush.id}` : 'Region 0: rubs regions out', 'info');
        return this.regionBrush.id;
    },

    setRegionBrushId(id) {
        this.regionBrush.id = Math.max(0, Math.min(255, Math.round(Number(id) || 0)));
        const input = typeof document !== 'undefined' ? document.getElementById('dd-region-id') : null;
        if (input) input.value = String(this.regionBrush.id);
        this.renderRegionLegend();
    },

    trackRegionHover(e) {
        const at = this.clientToMapCoords(e.clientX, e.clientY);
        this._regionHover = { tileX: at.tileX, tileY: at.tileY };
    },

    // The legend: each region on this map, its colour, how many tiles and what uses it.
    renderRegionLegend() {
        const box = typeof document !== 'undefined' ? document.getElementById('dd-region-legend') : null;
        if (!box) return;
        const size = this.regionMapSize();
        const R = DocsDoodads.Regions;
        const counts = size ? R.counts(size.data, size.w, size.h) : {};
        const uses = R.uses(DocsDoodads.World.settings(), DocsDoodads.Lighting.mapSettings(this.currentMapId()));
        const ids = Array.from(new Set(Object.keys(counts).concat(Object.keys(uses)).map(Number))).sort((a, b) => a - b);
        const hex = n => '#' + n.toString(16).padStart(6, '0');
        box.innerHTML = ids.length === 0
            ? '<div style="color: var(--dd-faint);">No regions on this map yet.</div>'
            : ids.map(id => `<div class="dd-region-row${id === this.regionBrush.id ? ' dd-active' : ''}" data-region="${id}" title="Paint region ${id}">
                <span class="dd-swatch" style="background: ${hex(R.color(id))};"></span>
                <b>${id}</b>
                <span>${counts[id] || 0} tile${counts[id] === 1 ? '' : 's'}${uses[id] ? `<div class="dd-region-uses">${escapeHtml(uses[id].join(', '))}</div>` : ''}</span>
            </div>`).join('');
        if (box.querySelectorAll) for (const row of box.querySelectorAll('.dd-region-row')) row.onclick = () => this.setRegionBrushId(row.getAttribute('data-region'));
    },

    bindRegionTool() {
        const byId = id => document.getElementById(id);
        const btn = byId('dd-region-btn');
        if (btn) btn.onclick = () => {
            this.setPlacementTool(this.placementTool === 'region' ? null : 'region');
            if (this.placementTool !== 'region') this.showToast('Region brush off');
        };
        const id = byId('dd-region-id');
        if (id) id.onchange = e => this.setRegionBrushId(e.target.value);
        const rad = byId('dd-region-rad');
        if (rad) rad.oninput = e => {
            this.regionBrush.radius = Math.max(0, Math.min(6, parseInt(e.target.value, 10) || 0));
            const v = byId('dd-region-rad-val');
            if (v) v.textContent = String(this.regionBrush.radius * 2 + 1);
        };
        const tags = byId('dd-region-tags');
        if (tags) tags.onchange = e => { this.regionBrush.showTags = Boolean(e.target.checked); };
    },

    // Regions (and terrain tags, when asked) on the tiles in view, while the tool is out.
    drawRegionOverlay(g) {
        const pool = g && g._ddRegionLabels;
        const hideLabels = from => { if (pool) for (let i = from; i < pool.length; i++) pool[i].visible = false; };
        if (this.placementTool !== 'region' || typeof $gameMap === 'undefined' || !$gameMap || !g) return hideLabels(0);
        const size = this.regionMapSize();
        if (!size) return hideLabels(0);
        const R = DocsDoodads.Regions;
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const x0 = Math.max(0, Math.floor($gameMap.displayX())), y0 = Math.max(0, Math.floor($gameMap.displayY()));
        const cols = Math.ceil((typeof Graphics !== 'undefined' ? Graphics.width : 816) / tw) + 1;
        const rows = Math.ceil((typeof Graphics !== 'undefined' ? Graphics.height : 624) / th) + 1;
        const labels = [];
        for (let y = y0; y < Math.min(size.h, y0 + rows); y++) {
            for (let x = x0; x < Math.min(size.w, x0 + cols); x++) {
                const id = R.get(size.data, size.w, size.h, x, y);
                const sx = $gameMap.adjustX(x) * tw, sy = $gameMap.adjustY(y) * th;
                if (id > 0) {
                    g.beginFill(R.color(id), 0.38);
                    g.drawRect(sx, sy, tw, th);
                    g.endFill();
                    labels.push({ text: String(id), x: sx + tw / 2, y: sy + th / 2, tag: false });
                }
                if (this.regionBrush.showTags) {
                    const tag = $gameMap.terrainTag ? $gameMap.terrainTag(x, y) : 0;
                    if (tag > 0) labels.push({ text: 'T' + tag, x: sx + tw - 10, y: sy + 9, tag: true });
                }
            }
        }
        if (this._regionHover) {
            g.lineStyle(2, R.color(this.regionBrush.id || 0) || 0xffffff, 0.95);
            for (const t of R.footprint(this._regionHover.tileX, this._regionHover.tileY, this.regionBrush.radius, size.w, size.h)) {
                g.drawRect($gameMap.adjustX(t.x) * tw + 2, $gameMap.adjustY(t.y) * th + 2, tw - 4, th - 4);
            }
            g.lineStyle(0);
        }
        if (typeof g.addChild !== 'function' || typeof PIXI === 'undefined' || !PIXI.Text) return;
        const list = g._ddRegionLabels = g._ddRegionLabels || [];
        labels.forEach((l, i) => {
            let label = list[i];
            if (!label) {
                label = new PIXI.Text('', { fontFamily: 'sans-serif', fontSize: 13, fontWeight: 'bold', fill: '#ffffff', stroke: '#2f2a43', strokeThickness: 4 });
                if (label.anchor && label.anchor.set) label.anchor.set(0.5);
                list.push(label);
                g.addChild(label);
            }
            if (label.text !== l.text) label.text = l.text;
            if (label.style) label.style.fill = l.tag ? '#facc15' : '#ffffff';
            label.x = l.x;
            label.y = l.y;
            label.visible = true;
        });
        hideLabels(labels.length);
    }
});

DocsDoodads.Workspace.toolButtons.region = 'dd-region-btn';
DocsDoodads.Workspace.toolPopovers.region = 'dd-region-popover';
DocsDoodads.Workspace.brushSizeSteps.region = ['dd-region-rad', 1, 0, 6];
