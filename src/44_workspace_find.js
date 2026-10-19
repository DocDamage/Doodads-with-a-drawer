//==========================================================
// SECTION 25m: FIND DOODADS, THE MAP OUTLINER, PICKING AND PLACING MANY
//==========================================================
// Find (More, Ctrl+K "find doodads"): doodads on this map or every map by words and filters, with Go To,
// Pick All for editing them together in Details, and Hide, Show, Lock and Unlock for all at once. The
// outliner lists this map's doodads by layer, with hide, lock and pick per doodad and Solo per layer.
// Picking: inside a region, by a box that touches (Ctrl+drag) or a lasso (Alt+drag; 44_workspace_canvas_input_1_mouse.js).
// Placing: snap to the grid, space by so many pixels, nudge by a tile (Ctrl+arrows) where the terrain lets it.
DocsDoodads.Ui.css += `
#dd-find, #dd-outliner { position: fixed; z-index: 10033; width: 380px; max-width: calc(100vw - 32px); max-height: 72vh; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; font-size: 11px; }
#dd-find .dd-find-list, #dd-outliner .dd-ol-list { overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
#dd-find .dd-find-row, #dd-outliner .dd-ol-row { display: flex; align-items: center; gap: 6px; padding: 4px 8px; border-radius: 10px; background: var(--dd-panel-2); }
#dd-find .dd-find-text, #dd-outliner .dd-ol-text { flex: 1; min-width: 0; color: var(--dd-text); font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#dd-find .dd-btn, #dd-outliner .dd-btn { padding: 3px 8px; font-size: 11px; }
#dd-find .dd-find-tools, #dd-outliner .dd-ol-tools { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
#dd-find input[type=text] { flex: 1; min-width: 120px; }
#dd-outliner .dd-ol-layer { font-weight: 900; color: var(--dd-text); font-size: 12px; margin-top: 4px; display: flex; gap: 6px; align-items: center; }
#dd-outliner .dd-ol-row.dd-ol-picked { outline: 2px solid var(--dd-primary); }
#dd-outliner .dd-ol-row.dd-ol-hidden .dd-ol-text { opacity: 0.5; }
`;

// What a search asks for: words (in the picture's name, the doodad's Name or its tags) and filters:
// tag:, name:, layer:, has:light, has:sound, has:collision, has:states, has:touch, is:locked, is:hidden,
// and a leading - to leave out (-tag:dead).
DocsDoodads.FindDoodads = {
    parse(query) {
        const out = { words: [], not: [], tags: [], notTags: [], names: [], notNames: [], layers: [], notLayers: [], has: [], hasNot: [], is: [], isNot: [] };
        for (const raw of String(query || '').trim().split(/\s+/).filter(Boolean)) {
            const neg = raw.length > 1 && raw[0] === '-';
            const token = (neg ? raw.slice(1) : raw).toLowerCase();
            const m = /^(tag|name|layer|has|is):(.+)$/.exec(token);
            if (!m) { (neg ? out.not : out.words).push(token); continue; }
            const [, key, value] = m;
            if (key === 'tag') (neg ? out.notTags : out.tags).push(value);
            else if (key === 'name') (neg ? out.notNames : out.names).push(value);
            else if (key === 'layer') (neg ? out.notLayers : out.layers).push(value);
            else if (key === 'has') (neg ? out.hasNot : out.has).push(value);
            else (neg ? out.isNot : out.is).push(value);
        }
        return out;
    },

    has(d, what) {
        if (what === 'light') return Boolean(d.light && d.light.enabled);
        if (what === 'sound') return Boolean(d.sound && d.sound.file);
        if (what === 'collision') return Boolean(d.collision && d.collision.preset && d.collision.preset !== 'none');
        if (what === 'states') return DocsDoodads.States.has(d);
        if (what === 'touch') return DocsDoodads.Touch.isTouchable(d);
        if (what === 'particles') return Boolean(d.particles && d.particles.preset && d.particles.preset !== 'none');
        return false;
    },

    is(d, what) {
        if (what === 'locked') return Boolean(d.locked);
        if (what === 'hidden') return Boolean(d.editorHidden);
        if (what === 'conditional') return DocsDoodads.Appearance.isConditional(d);
        return false;
    },

    // ctx: { tagsOf(path) -> [tags], layerName(id) -> name }.
    matches(d, q, ctx = {}) {
        if (!d) return false;
        const art = d.bit && d.bit[0] === 3 ? String(d.bit[1]).toLowerCase() : '';
        const file = art.split('/').pop();
        const name = String(d.name || '').toLowerCase();
        const tags = (ctx.tagsOf ? ctx.tagsOf(art) : []).map(t => String(t).toLowerCase());
        const layerId = DocsDoodads.Layers.of(d).toLowerCase();
        const layerName = String(ctx.layerName ? ctx.layerName(DocsDoodads.Layers.of(d)) : layerId).toLowerCase();
        const text = [file, name].concat(tags).join(' ');
        if (!q.words.every(w => text.includes(w))) return false;
        if (q.not.some(w => text.includes(w))) return false;
        if (!q.tags.every(t => tags.includes(t))) return false;
        if (q.notTags.some(t => tags.includes(t))) return false;
        if (!q.names.every(n => name.includes(n)) || q.notNames.some(n => name.includes(n))) return false;
        const inLayer = l => layerId === l || layerName.includes(l);
        if ((q.layers.length && !q.layers.some(inLayer)) || q.notLayers.some(inLayer)) return false;
        if (!q.has.every(h => this.has(d, h)) || q.hasNot.some(h => this.has(d, h))) return false;
        return q.is.every(i => this.is(d, i)) && !q.isNot.some(i => this.is(d, i));
    }
};

// Solo: while a layer is soloed, the editor shows only that layer's doodads (nothing is saved).
DocsDoodads.Layers.solo = null;
$.Layers_visibleInEditor_solo = DocsDoodads.Layers.visibleInEditor;
DocsDoodads.Layers.visibleInEditor = function(d, mapSettings) {
    if (this.solo && this.of(d) !== this.solo) return false;
    return $.Layers_visibleInEditor_solo.call(this, d, mapSettings);
};

Object.assign(DocsDoodads.Workspace, {
    // ---- Find ----
    findContext() {
        const AI = DocsDoodads.AssetIndex;
        const settings = DocsDoodads.Lighting.mapSettings(this.currentMapId());
        const layers = DocsDoodads.Layers.list(settings);
        return {
            tagsOf: path => { const a = AI && AI.data && AI.data.assets ? AI.data.assets[String(path).toLowerCase()] : null; return a ? (a.tags || []).concat(a.autoTags || []) : []; },
            layerName: id => { const l = layers.find(x => x.id === id); return l ? l.name || id : id; }
        };
    },

    // [{ mapId, doodad, x, y (tiles), label }] for a search on this map or every map.
    findDoodads(query, scope = 'map') {
        const F = DocsDoodads.FindDoodads, q = F.parse(query), ctx = this.findContext();
        const data = window.$dataDocsDoodads || {};
        const here = this.currentMapId();
        const ids = scope === 'all' ? Object.keys(data).filter(k => /^\d+$/.test(k) && Array.isArray(data[k])).map(Number) : [here];
        const tw = window.$gameMap && $gameMap.tileWidth ? $gameMap.tileWidth() : 48, th = window.$gameMap && $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
        const out = [];
        for (const mapId of ids.sort((a, b) => (a === here ? -1 : b === here ? 1 : a - b))) {
            (data[mapId] || []).forEach((d, i) => {
                if (!F.matches(d, q, ctx)) return;
                const art = d.bit && d.bit[0] === 3 ? String(d.bit[1]).split('/').pop() : `doodad #${i + 1}`;
                const x = Math.floor(d.x / tw), y = Math.floor((d.y - 1) / th);
                out.push({ mapId, doodad: d, x, y, label: `${d.name ? d.name + ' · ' : ''}${art}${mapId !== here ? ` (map ${mapId})` : ''} at ${x}, ${y}` });
            });
        }
        return out;
    },

    showFind(query) {
        if (typeof document === 'undefined') return null;
        this._findOpen = true;
        if (query !== undefined) this._findQuery = String(query);
        this._findScope = this._findScope || 'map';
        return this.renderFind();
    },

    closeFind() {
        this._findOpen = false;
        const el = typeof document !== 'undefined' ? document.getElementById('dd-find') : null;
        if (el && el.parentNode) el.parentNode.removeChild(el);
    },

    // Hide, show, lock or unlock every result on this map at once (one undo step).
    findBulk(action) {
        const here = this.currentMapId();
        const items = (this._findResults || []).filter(r => r.mapId === here).map(r => r.doodad);
        if (!items.length) return 0;
        const set = { hide: ['editorHidden', true], show: ['editorHidden', false], lock: ['locked', true], unlock: ['locked', false] }[action];
        if (!set) return 0;
        this.editDoodads(items, d => { if (set[1]) d[set[0]] = true; else delete d[set[0]]; }, 'find_' + action);
        this.refreshSpriteset(true);
        this.showToast(`${action[0].toUpperCase() + action.slice(1)}: ${items.length} doodad(s).`);
        if (this._findOpen) this.renderFind();
        return items.length;
    },

    renderFind() {
        if (typeof document === 'undefined' || !this._findOpen) return null;
        const U = DocsDoodads.Ui;
        let panel = document.getElementById('dd-find');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'dd-find';
            panel.className = 'dd-glass';
            document.body.appendChild(panel);
        }
        const results = this._findResults = this.findDoodads(this._findQuery || '', this._findScope);
        const here = results.filter(r => r.mapId === this.currentMapId()).length;
        panel.innerHTML = `
            <div class="dd-panel-head"><span class="dd-grow">${U.icon('search', 1)} Find Doodads (${results.length})</span>
                <button class="dd-btn dd-fold" id="dd-find-close" type="button" title="Close">${U.icon('close', 1)}</button></div>
            <div class="dd-find-tools">
                <input type="text" id="dd-find-query" value="${escapeHtml(this._findQuery || '')}" placeholder="tree tag:forest has:light -is:hidden" aria-label="Find doodads" />
                <select id="dd-find-scope"><option value="map"${this._findScope === 'map' ? ' selected' : ''}>This map</option><option value="all"${this._findScope === 'all' ? ' selected' : ''}>Every map</option></select>
            </div>
            <div class="dd-find-tools">
                <button class="dd-btn dd-btn-primary" id="dd-find-pick" type="button" title="Pick every result on this map, to change them together in Details"${here ? '' : ' disabled'}>Pick All (${here})</button>
                <button class="dd-btn" id="dd-find-hide" type="button"${here ? '' : ' disabled'}>Hide</button>
                <button class="dd-btn" id="dd-find-show" type="button"${here ? '' : ' disabled'}>Show</button>
                <button class="dd-btn" id="dd-find-lock" type="button"${here ? '' : ' disabled'}>Lock</button>
                <button class="dd-btn" id="dd-find-unlock" type="button"${here ? '' : ' disabled'}>Unlock</button>
            </div>
            <div style="color: var(--dd-faint); line-height: 1.4;">Words find the picture, the Name or a tag. Also tag:, name:, layer:, has:light, has:sound, has:collision, has:states, has:touch, is:locked, is:hidden; a - leaves out.</div>
            <div class="dd-find-list" id="dd-find-list"></div>`;
        const list = document.getElementById('dd-find-list');
        if (list) {
            if (!results.length) {
                const empty = document.createElement('div');
                empty.className = 'dd-empty';
                empty.textContent = 'Nothing found.';
                list.appendChild(empty);
            }
            for (const r of results.slice(0, 300)) {
                const row = document.createElement('div');
                row.className = 'dd-find-row';
                const text = document.createElement('span');
                text.className = 'dd-find-text';
                text.textContent = r.label;
                row.appendChild(text);
                const go = document.createElement('button');
                go.className = 'dd-btn';
                go.type = 'button';
                go.textContent = 'Go To';
                go.onclick = () => this.goToProblem({ mapId: r.mapId, x: r.x, y: r.y, doodad: r.doodad });
                row.appendChild(go);
                list.appendChild(row);
            }
            if (results.length > 300) {
                const more = document.createElement('div');
                more.className = 'dd-empty';
                more.textContent = `…and ${results.length - 300} more: narrow the search.`;
                list.appendChild(more);
            }
        }
        const on = (id, run) => { const el = document.getElementById(id); if (el) el.onclick = run; };
        on('dd-find-close', () => this.closeFind());
        on('dd-find-pick', () => {
            const items = this._findResults.filter(r => r.mapId === this.currentMapId()).map(r => r.doodad);
            this.selectDoodads(items);
            this.showToast(`Picked ${items.length} doodad(s): change them together in Details.`);
        });
        for (const a of ['hide', 'show', 'lock', 'unlock']) on('dd-find-' + a, () => this.findBulk(a));
        const input = document.getElementById('dd-find-query');
        if (input) input.onchange = () => { this._findQuery = input.value; this.renderFind(); };
        const scope = document.getElementById('dd-find-scope');
        if (scope) scope.onchange = () => { this._findScope = scope.value === 'all' ? 'all' : 'map'; this.renderFind(); };
        if (this.placeReadouts) this.placeReadouts();
        return panel;
    },

    // ---- The outliner ----
    showOutliner() {
        if (typeof document === 'undefined') return null;
        this._outlinerOpen = true;
        return this.renderOutliner();
    },

    closeOutliner() {
        this._outlinerOpen = false;
        DocsDoodads.Layers.solo = null;
        const el = typeof document !== 'undefined' ? document.getElementById('dd-outliner') : null;
        if (el && el.parentNode) el.parentNode.removeChild(el);
        this.refreshSpriteset(true);
    },

    // Shows only one layer's doodads in the editor (null: all again).
    soloLayer(id) {
        DocsDoodads.Layers.solo = id && DocsDoodads.Layers.solo !== id ? id : null;
        this.refreshSpriteset(true);
        if (this._outlinerOpen) this.renderOutliner();
        return DocsDoodads.Layers.solo;
    },

    outlinerToggle(d, field) {
        this.editDoodads([d], x => { if (x[field]) delete x[field]; else x[field] = true; }, field === 'locked' ? 'lock_doodads' : 'hide_doodads');
        this.refreshSpriteset(true);
        if (this._outlinerOpen) this.renderOutliner();
    },

    renderOutliner() {
        if (typeof document === 'undefined' || !this._outlinerOpen) return null;
        const U = DocsDoodads.Ui, L = DocsDoodads.Layers;
        let panel = document.getElementById('dd-outliner');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'dd-outliner';
            panel.className = 'dd-glass';
            document.body.appendChild(panel);
        }
        const settings = DocsDoodads.Lighting.mapSettings(this.currentMapId());
        const doodads = (DocsDoodads.doodads(this.currentMapId()) || []).filter(Boolean);
        const picked = new Set(this.selectionItems());
        const open = this._outlinerOpenLayers = this._outlinerOpenLayers || {};
        panel.innerHTML = `
            <div class="dd-panel-head"><span class="dd-grow">${U.icon('grid', 1)} This Map's Doodads (${doodads.length})</span>
                <button class="dd-btn dd-fold" id="dd-ol-close" type="button" title="Close">${U.icon('close', 1)}</button></div>
            <div class="dd-ol-tools">
                <button class="dd-btn" id="dd-ol-showhidden" type="button" title="Show every doodad hidden in the editor">Show Hidden (${doodads.filter(d => d.editorHidden).length})</button>
                ${L.solo ? '<button class="dd-btn" id="dd-ol-unsolo" type="button">Show All Layers</button>' : ''}
            </div>
            <div class="dd-ol-list" id="dd-ol-list"></div>`;
        const list = document.getElementById('dd-ol-list');
        for (const layer of L.list(settings)) {
            const mine = doodads.filter(d => L.of(d) === layer.id);
            const head = document.createElement('div');
            head.className = 'dd-ol-layer';
            const name = document.createElement('span');
            name.className = 'dd-grow';
            name.textContent = `${open[layer.id] ? '▾' : '▸'} ${layer.name || layer.id} (${mine.length})`;
            name.style.cursor = 'pointer';
            name.onclick = () => { open[layer.id] = !open[layer.id]; this.renderOutliner(); };
            head.appendChild(name);
            const solo = document.createElement('button');
            solo.className = 'dd-btn' + (L.solo === layer.id ? ' dd-btn-primary' : '');
            solo.type = 'button';
            solo.textContent = 'Solo';
            solo.title = 'Show only this layer while editing';
            solo.onclick = () => this.soloLayer(layer.id);
            head.appendChild(solo);
            list.appendChild(head);
            if (!open[layer.id]) continue;
            for (const d of mine.slice(0, 200)) {
                const row = document.createElement('div');
                row.className = 'dd-ol-row' + (picked.has(d) ? ' dd-ol-picked' : '') + (d.editorHidden ? ' dd-ol-hidden' : '');
                const text = document.createElement('span');
                text.className = 'dd-ol-text';
                text.textContent = (d.name ? d.name + ' · ' : '') + (d.bit && d.bit[0] === 3 ? String(d.bit[1]).split('/').pop() : 'doodad');
                text.style.cursor = 'pointer';
                text.title = 'Pick it';
                text.onclick = () => { if (d.editorHidden) this.outlinerToggle(d, 'editorHidden'); this.selectDoodads([d]); this.renderOutliner(); };
                row.appendChild(text);
                for (const [field, on, off] of [['editorHidden', 'Show', 'Hide'], ['locked', 'Unlock', 'Lock']]) {
                    const b = document.createElement('button');
                    b.className = 'dd-btn';
                    b.type = 'button';
                    b.textContent = d[field] ? on : off;
                    b.onclick = () => this.outlinerToggle(d, field);
                    row.appendChild(b);
                }
                list.appendChild(row);
            }
            if (mine.length > 200) {
                const more = document.createElement('div');
                more.className = 'dd-empty';
                more.textContent = `…and ${mine.length - 200} more: use Find (layer:${layer.id}) to narrow them.`;
                list.appendChild(more);
            }
        }
        const on = (id, run) => { const el = document.getElementById(id); if (el) el.onclick = run; };
        on('dd-ol-close', () => this.closeOutliner());
        on('dd-ol-unsolo', () => this.soloLayer(null));
        on('dd-ol-showhidden', () => { if (this.showHiddenDoodads) this.showHiddenDoodads(); this.renderOutliner(); });
        if (this.placeReadouts) this.placeReadouts();
        return panel;
    },

    // ---- Picking many ----
    // The doodads standing in a region (their foot's tile), that can be edited.
    selectInRegion(region) {
        const r = Number(region) || 0;
        if (r <= 0 || !window.$gameMap) return 0;
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const items = this.pickableDoodads().filter(d => $gameMap.regionId(Math.floor(d.x / tw), Math.floor((d.y - 1) / th)) === r);
        this.selectDoodads(items);
        this.showToast(`Picked ${items.length} doodad(s) in region ${r}.`);
        return items.length;
    },

    // ---- Placing many ----
    // Each picked doodad's foot to the middle bottom of its grid cell (the placement grid).
    snapSelectionToGrid() {
        const items = this.selectionItems().filter(d => !d.locked && d.posMode !== 0);
        if (!items.length) return 0;
        this.editDoodads(items, d => { const s = this.snapToTile({ x: d.x, y: d.y - 1 }); d.x = s.x; d.y = s.y; }, 'snap_doodads');
        this.refreshInspector();
        this.showToast(`Snapped ${items.length} doodad(s) to the grid.`);
        return items.length;
    },

    // In a row ('horizontal') or a column ('vertical'), each `px` pixels after the one before, from the first.
    spaceSelection(axis, px) {
        const items = this.selectionItems().filter(d => !d.locked);
        const gap = Math.round(Number(px) || 0);
        if (items.length < 2 || !gap) return 0;
        const key = axis === 'vertical' ? 'y' : 'x';
        const order = items.slice().sort((a, b) => a[key] - b[key]);
        const at = new Map(order.map((d, i) => [d, order[0][key] + i * gap]));
        this.editDoodads(items, d => { d[key] = at.get(d); }, 'space_doodads');
        this.refreshInspector();
        this.showToast(`Spaced ${items.length} doodads ${gap} px apart.`);
        return items.length;
    },

    // A tile at a time (Ctrl+arrows), only where the terrain lets every picked doodad stand.
    nudgeByTile(dx, dy) {
        const items = this.selectionItems().filter(d => !d.locked);
        if (!items.length || !window.$gameMap) return false;
        const g = this.snapGrid ? this.snapGrid() : { tw: $gameMap.tileWidth(), th: $gameMap.tileHeight() };
        const mx = dx * g.tw, my = dy * g.th;
        const ok = items.every(d => DocsDoodads.Terrain.allowsDoodad(Object.assign({}, d, { x: d.x + mx, y: d.y + my }), this.currentMapId()));
        if (!ok) {
            this.showToast('The ground there is too steep for a doodad.', 'info');
            return false;
        }
        return this.nudgeSelection(mx, my);
    }
});
