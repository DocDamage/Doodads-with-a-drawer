    // ---- Map settings (lighting) ----
    currentMapId() {
        return window.$gameMap && typeof window.$gameMap.mapId === 'function' ? window.$gameMap.mapId() : 0;
    },

    writeMapSettings(mapId, value) {
        const data = window.$dataDocsDoodads = window.$dataDocsDoodads || {};
        if (value && Object.keys(value).length > 0) {
            data.mapSettings = data.mapSettings || {};
            data.mapSettings[mapId] = JSON.parse(JSON.stringify(value));
        } else if (data.mapSettings) {
            delete data.mapSettings[mapId];
            if (Object.keys(data.mapSettings).length === 0) delete data.mapSettings;
        }
        DocsDoodads.Persistence.dirtyDoodads = true;
    },

    setMapAmbient(ambient, before) {
        const mapId = this.currentMapId();
        const data = window.$dataDocsDoodads = window.$dataDocsDoodads || {};
        const previous = before !== undefined ? before
            : (data.mapSettings && data.mapSettings[mapId] ? JSON.parse(JSON.stringify(data.mapSettings[mapId])) : null);
        const next = Object.assign({}, previous || {}, { ambient: Object.assign({}, ambient) });
        DocsDoodads.Undo.execute({ type: 'map_ambient', apply: () => this.writeMapSettings(mapId, next), revert: () => this.writeMapSettings(mapId, previous) });
    },

    // One per-map option (undefined restores the default). previousSettings: the map's settings before a live preview.
    setMapSetting(key, value, previousSettings) {
        const mapId = this.currentMapId();
        const data = window.$dataDocsDoodads = window.$dataDocsDoodads || {};
        const previous = previousSettings !== undefined ? previousSettings
            : (data.mapSettings && data.mapSettings[mapId] ? JSON.parse(JSON.stringify(data.mapSettings[mapId])) : null);
        const next = Object.assign({}, previous || {});
        if (value === undefined) delete next[key];
        else next[key] = value;
        DocsDoodads.Undo.execute({ type: 'map_setting', label: key === 'terrain' ? 'Terrain height' : 'Map setting: ' + key, apply: () => this.writeMapSettings(mapId, next), revert: () => this.writeMapSettings(mapId, previous) });
    },

    // ---- World (project-wide) settings ----
    // previous: { value } when a live preview already changed the setting.
    setWorldSetting(key, value, previous) {
        const World = DocsDoodads.World;
        const copy = v => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
        const before = previous ? copy(previous.value) : copy(World.raw(key));
        const after = copy(value);
        const write = v => {
            World.set(key, copy(v));
            DocsDoodads.Persistence.dirtyDoodads = true;
        };
        DocsDoodads.Undo.execute({ type: 'world_setting', label: 'Project setting: ' + key, apply: () => write(after), revert: () => write(before) });
    },

    // ---- Layers (per map) ----
    activeLayer: 'main',

    mapSettingsCopy() {
        const settings = DocsDoodads.Lighting.mapSettings(this.currentMapId());
        return settings ? JSON.parse(JSON.stringify(settings)) : null;
    },

    layersRaw() {
        const settings = DocsDoodads.Lighting.mapSettings(this.currentMapId()) || {};
        return JSON.parse(JSON.stringify(Array.isArray(settings.layers) ? settings.layers : []));
    },

    addLayer(name) {
        const layers = this.layersRaw();
        const id = DocsDoodads.Prefabs.newId('layer_');
        layers.push({ id, name: String(name || 'Layer ' + (layers.length + 2)) });
        this.setMapSetting('layers', layers);
        return id;
    },

    renameLayer(id, name) {
        if (id === 'main' || !String(name || '').trim()) return false;
        const layers = this.layersRaw();
        const layer = layers.find(l => l.id === id);
        if (!layer) return false;
        layer.name = String(name).trim();
        this.setMapSetting('layers', layers);
        return true;
    },

    // hidden (editor only), locked, gameHidden. Main keeps its flags under mainLayer.
    setLayerFlag(id, flag, value) {
        if (id === 'main') {
            const settings = DocsDoodads.Lighting.mapSettings(this.currentMapId()) || {};
            this.setMapSetting('mainLayer', Object.assign({}, settings.mainLayer || {}, { [flag]: Boolean(value) }));
            return;
        }
        const layers = this.layersRaw();
        const layer = layers.find(l => l.id === id);
        if (!layer) return;
        layer[flag] = Boolean(value);
        this.setMapSetting('layers', layers);
    },

    // One step: the layer goes and its doodads move to Main.
    deleteLayer(id) {
        if (id === 'main') return false;
        const mapId = this.currentMapId();
        const previous = this.mapSettingsCopy();
        const next = Object.assign({}, previous || {}, { layers: this.layersRaw().filter(l => l.id !== id) });
        const moved = DocsDoodads.doodads(mapId).filter(d => d && d.layer === id);
        DocsDoodads.Undo.execute({
            type: 'delete_layer',
            apply: () => {
                this.writeMapSettings(mapId, next);
                moved.forEach(d => { delete d.layer; });
                if (this.activeLayer === id) this.activeLayer = 'main';
                this.afterDoodadEdit();
            },
            revert: () => {
                this.writeMapSettings(mapId, previous);
                moved.forEach(d => { d.layer = id; });
                this.afterDoodadEdit();
            }
        });
        return true;
    },

    moveSelectionToLayer(id) {
        this.setDoodadProperty(this.selectionItems(), 'layer', id);
        this.refreshInspector();
    },

    layerAllowsEditing(d) {
        const settings = DocsDoodads.Lighting.mapSettings(this.currentMapId());
        return DocsDoodads.Layers.visibleInEditor(d, settings) && !DocsDoodads.Layers.isLocked(d, settings);
    },

    renderLayersPanel(mapSettings) {
        const layers = DocsDoodads.Layers.list(mapSettings);
        const counts = {}, hidden = {};
        for (const d of DocsDoodads.doodads(this.currentMapId())) {
            if (!d) continue;
            const id = DocsDoodads.Layers.of(d);
            counts[id] = (counts[id] || 0) + 1;
            if (d.editorHidden) hidden[id] = (hidden[id] || 0) + 1;
        }
        const hiddenTotal = Object.values(hidden).reduce((a, b) => a + b, 0);
        const active = layers.some(l => l.id === this.activeLayer) ? this.activeLayer : 'main';
        const inputStyle = 'width: 100%; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line); padding: 1px 3px; border-radius: 3px; font-size: 10px;';
        // The count says how many are hidden in the editor, in brackets: those can't be clicked until shown.
        const count = l => hidden[l.id]
            ? `<span style="color: var(--dd-faint);" title="${counts[l.id]} doodad(s) on this layer, ${hidden[l.id]} hidden in the editor">${counts[l.id]} <b style="color: var(--dd-warn);">(${hidden[l.id]})</b></span>`
            : `<span style="color: var(--dd-faint);" title="Doodads on this layer">${counts[l.id] || 0}</span>`;
        const rows = layers.map((l, i) => `
            <div style="display: grid; grid-template-columns: 16px 1fr 40px 18px 18px 18px 20px; gap: 3px; align-items: center; font-size: 10px; color: var(--dd-text);">
                <input type="radio" name="dd-layer-active" id="dd-layer-active-${i}" ${l.id === active ? 'checked' : ''} title="New doodads go on this layer" />
                ${l.id === 'main' ? `<span>${escapeHtml(l.name)}</span>` : `<input type="text" id="dd-layer-name-${i}" value="${escapeHtml(l.name)}" style="${inputStyle}" />`}
                ${count(l)}
                <input type="checkbox" id="dd-layer-show-${i}" ${l.hidden ? '' : 'checked'} title="Show in the editor" />
                <input type="checkbox" id="dd-layer-lock-${i}" ${l.locked ? 'checked' : ''} title="Locked (can't be selected)" />
                <input type="checkbox" id="dd-layer-game-${i}" ${l.gameHidden ? '' : 'checked'} title="Show in the game" />
                ${l.id === 'main' ? '<span></span>' : `<button class="dd-btn" id="dd-layer-del-${i}" title="Delete (doodads move to Main)" style="padding: 0 4px;">&times;</button>`}
            </div>`).join('');
        return `
            <details style="border-top: 1px solid var(--dd-line-soft); padding-top: 6px; margin-top: 6px;" ${this._openLayers ? 'open' : ''} id="dd-layers-sec">
                <summary style="cursor: pointer; font-size: 11px; font-weight: bold; color: var(--dd-muted);">Layers</summary>
                <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 6px;">
                    <div style="display: grid; grid-template-columns: 16px 1fr 40px 18px 18px 18px 20px; gap: 3px; font-size: 9px; color: var(--dd-faint);"><span></span><span>Name</span><span>#</span><span>Ed</span><span>Lk</span><span>Gm</span><span></span></div>
                    ${rows}
                    ${hiddenTotal ? `<button class="dd-btn" id="dd-layer-show-hidden" title="Hidden doodads can't be clicked or selected">Show Hidden Doodads (${hiddenTotal})</button>` : ''}
                    <button class="dd-btn" id="dd-layer-add">Add Layer</button>
                    <div style="font-size: 10px; color: var(--dd-faint); line-height: 1.4;">The selected layer receives new doodads. Ed = shown while editing, Lk = locked, Gm = shown in the game. Move doodads with the Layer field in their details, or right-click one: Move to Layer.</div>
                </div>
            </details>`;
    },

    bindLayersPanel(mapSettings) {
        const byId = id => document.getElementById(id);
        const sec = byId('dd-layers-sec');
        if (sec) sec.ontoggle = () => { this._openLayers = sec.open; };
        DocsDoodads.Layers.list(mapSettings).forEach((l, i) => {
            const on = (id, handler) => { const node = byId(id); if (node) node.onchange = handler; };
            on(`dd-layer-active-${i}`, () => { this.activeLayer = l.id; this.showToast(`New doodads go on ${l.name}.`); });
            on(`dd-layer-name-${i}`, e => this.renameLayer(l.id, e.target.value));
            on(`dd-layer-show-${i}`, e => { this.setLayerFlag(l.id, 'hidden', !e.target.checked); this.refreshSpriteset(true); });
            on(`dd-layer-lock-${i}`, e => this.setLayerFlag(l.id, 'locked', e.target.checked));
            on(`dd-layer-game-${i}`, e => this.setLayerFlag(l.id, 'gameHidden', !e.target.checked));
            const del = byId(`dd-layer-del-${i}`);
            if (del) del.onclick = async () => {
                const count = DocsDoodads.doodads(this.currentMapId()).filter(d => d && d.layer === l.id).length;
                if (count && !(await DocsDoodads.Ui.confirm(`The layer "${l.name}" will be deleted. Its ${count} doodad(s) stay on the map and move to Main.`,
                    { title: 'Delete layer?', ok: 'Delete Layer', danger: true }))) return;
                this.deleteLayer(l.id);
                this.refreshInspector();
                this.toastUndo(`Deleted the layer "${l.name}".`);
            };
        });
        const add = byId('dd-layer-add');
        if (add) add.onclick = () => { this.activeLayer = this.addLayer(); this._openLayers = true; this.refreshInspector(); };
        const showHidden = byId('dd-layer-show-hidden');
        if (showHidden) showHidden.onclick = () => this.showHiddenDoodads();
    },

    // ---- Symmetry ----
    symmetry: { mode: 'off', axisX: null, axisY: null },

    symmetryFor() {
        const s = this.symmetry || { mode: 'off' };
        if (!s.mode || s.mode === 'off') return { mode: 'off' };
        const gm = window.$gameMap;
        const axes = gm && gm.width ? DocsDoodads.Symmetry.defaultAxes(gm.width(), gm.height(), gm.tileWidth(), gm.tileHeight()) : { axisX: 0, axisY: 0 };
        return { mode: s.mode, axisX: s.axisX !== null && s.axisX !== undefined ? s.axisX : axes.axisX, axisY: s.axisY !== null && s.axisY !== undefined ? s.axisY : axes.axisY };
    },

    setSymmetry(mode) {
        this.symmetry = Object.assign({}, this.symmetry, { mode });
        const btn = document.getElementById('dd-sym-btn');
        if (btn && btn.classList) btn.classList.toggle('dd-btn-active', mode !== 'off');
        this.showToast(mode === 'off' ? 'Symmetry off.' : `Symmetry: ${DocsDoodads.Symmetry.modes.find(m => m.value === mode).label.toLowerCase()}.`);
    },

    // Copies of a new doodad for symmetry, each with its own uid.
    // The doodad and its symmetry copies, leaving out any that would land on a mountain or slope.
    withMirrors(d) {
        const copies = DocsDoodads.Symmetry.mirrors(d, this.symmetryFor());
        copies.forEach(c => DocsDoodads.MapLinks.ensureUid(c));
        return [d].concat(copies).filter(x => DocsDoodads.Terrain.allowsDoodad(x, this.currentMapId()));
    },

    levelGroundMessage: 'Doodads stand on level ground only: that spot is on a mountain or slope.',

    // ---- Biomes ----
    biomeSettings: { biomeId: '', radius: 96, avoidBlocked: true },

    biomesRaw() {
        return JSON.parse(JSON.stringify(DocsDoodads.World.get('biomes.list') || []));
    },

    newBiome(name) {
        const list = this.biomesRaw();
        const id = DocsDoodads.Prefabs.newId('biome_');
        list.push({ id, name: String(name || 'Biome ' + (list.length + 1)), entries: [], spacing: 40, density: 6, edgeThin: 0.5, cluster: 0.3 });
        this.setWorldSetting('biomes.list', list);
        if (!this.biomeSettings.biomeId) this.biomeSettings.biomeId = id;
        return id;
    },

    editBiome(id, mutate) {
        const list = this.biomesRaw();
        const biome = list.find(b => b.id === id);
        if (!biome) return false;
        mutate(biome, list);
        this.setWorldSetting('biomes.list', list);
        return true;
    },

    setBiomeField(id, field, value) {
        return this.editBiome(id, b => { b[field] = value; });
    },

    addBiomeEntry(id, path) {
        if (!path) return false;
        return this.editBiome(id, b => { b.entries = b.entries || []; b.entries.push({ path: String(path), weight: 1, scaleMin: 1, scaleMax: 1 }); });
    },

    setBiomeEntryField(id, index, field, value) {
        return this.editBiome(id, b => { if (b.entries && b.entries[index]) b.entries[index][field] = value; });
    },

    removeBiomeEntry(id, index) {
        return this.editBiome(id, b => { (b.entries || []).splice(index, 1); });
    },

    deleteBiome(id) {
        const list = this.biomesRaw().filter(b => b.id !== id);
        this.setWorldSetting('biomes.list', list);
    },

    assetByPath(path) {
        const assets = DocsDoodads.AssetIndex && DocsDoodads.AssetIndex.data ? DocsDoodads.AssetIndex.data.assets || {} : {};
        return assets[path] || Object.values(assets).find(a => a && a.path === path) || { id: path, path, fileName: String(path).split('/').pop(), width: 48, height: 48, tags: [], autoTags: [], placement: {}, collision: {} };
    },

    // Tile rules shared by the scatter and biome brushes.
    scatterQuery() {
        const gameMap = window.$gameMap;
        return {
            tileWidth: gameMap && gameMap.tileWidth ? gameMap.tileWidth() : 48,
            tileHeight: gameMap && gameMap.tileHeight ? gameMap.tileHeight() : 48,
            width: gameMap && gameMap.width ? gameMap.width() : Infinity,
            height: gameMap && gameMap.height ? gameMap.height() : Infinity,
            regionId: (x, y) => (gameMap && gameMap.regionId ? gameMap.regionId(x, y) : 0),
            terrainTag: (x, y) => (gameMap && gameMap.terrainTag ? gameMap.terrainTag(x, y) : 0),
            isPassable: (x, y) => (gameMap && gameMap.isPassable ? [2, 4, 6, 8].some(d => gameMap.isPassable(x, y, d)) : true)
        };
    },

    biomePaintAt(clientX, clientY) {
        const coords = this.clientToMapCoords(clientX, clientY);
        const s = this.biomeSettings;
        if (this._lastDab && Math.hypot(this._lastDab.x - coords.x, this._lastDab.y - coords.y) < s.radius * 0.4) return;
        this._lastDab = { x: coords.x, y: coords.y };
        const list = this.biomesRaw();
        const raw = DocsDoodads.Biome.find(s.biomeId, list) || list[0];
        const biome = raw ? DocsDoodads.Biome.normalize(raw) : null;
        if (!biome || biome.entries.length === 0) {
            if (!this._biomeWarned) this.showToast('Make a biome first (map panel > Biomes), then add art to it.', 'error');
            this._biomeWarned = true;
            return;
        }
        const mapId = this.currentMapId();
        const doodads = window.$dataDocsDoodads[mapId] = window.$dataDocsDoodads[mapId] || [];
        const reach = s.radius + biome.spacing;
        const existing = doodads.filter(d => Math.abs(d.x - coords.x) <= reach && Math.abs(d.y - coords.y) <= reach).map(d => ({ x: d.x, y: d.y }));
        this._biomeRng = this._biomeRng || DocsDoodads.Scatter.rng(Date.now());
        const rules = { regions: [], terrainTags: [], avoidBlocked: Boolean(s.avoidBlocked) };
        const query = this.scatterQuery();
        const placed = [];
        for (const p of DocsDoodads.Biome.paint(biome, coords, s.radius, existing, this._biomeRng)) {
            if (!DocsDoodads.Scatter.allowed(p, rules, query)) continue;
            const d = this.newDoodadFromAsset(this.assetByPath(p.path), p.x, p.y);
            d.scaleX = p.scale * (p.flipX ? -1 : 1);
            d.scaleY = p.scale;
            for (const item of this.withMirrors(d)) {
                doodads.push(item);
                this.currentBrushBatch.push(item);
                placed.push(item);
            }
        }
        this.addDoodadSprites(placed);
    },

    // ---- Map dressing ----
    dressRulesRaw() {
        return JSON.parse(JSON.stringify(DocsDoodads.World.get('dress.rules') || []));
    },

    addDressRule(where) {
        const rules = this.dressRulesRaw();
        rules.push({ name: 'Rule ' + (rules.length + 1), where: where || 'waterEdge', param: 0, chance: 0.35, spacing: 0, entries: [] });
        this.setWorldSetting('dress.rules', rules);
        return rules.length - 1;
    },

    setDressRuleField(index, field, value) {
        const rules = this.dressRulesRaw();
        if (!rules[index]) return;
        rules[index][field] = value;
        this.setWorldSetting('dress.rules', rules);
    },

    addDressEntry(index, path) {
        const rules = this.dressRulesRaw();
        if (!rules[index] || !path) return;
        rules[index].entries = rules[index].entries || [];
        rules[index].entries.push({ path: String(path), weight: 1, scaleMin: 1, scaleMax: 1 });
        this.setWorldSetting('dress.rules', rules);
    },

    removeDressEntry(index, entry) {
        const rules = this.dressRulesRaw();
        if (!rules[index]) return;
        (rules[index].entries || []).splice(entry, 1);
        this.setWorldSetting('dress.rules', rules);
    },

    removeDressRule(index) {
        const rules = this.dressRulesRaw();
        rules.splice(index, 1);
        this.setWorldSetting('dress.rules', rules);
    },

    // The current map's tiles, as the dressing rules see them.
    dressQuery() {
        const gm = window.$gameMap;
        const isWaterTile = id => (typeof Tilemap !== 'undefined' && Tilemap.isWaterTile ? Tilemap.isWaterTile(id) : false);
        return {
            width: gm.width(), height: gm.height(),
            isWater: (x, y) => DocsDoodads.Reflection.isWaterAt([0, 1, 2, 3].map(z => gm.tileId(x, y, z)), 0, { regionId: 0 }, isWaterTile),
            isPassable: (x, y) => [2, 4, 6, 8].some(d => gm.isPassable(x, y, d)),
            regionId: (x, y) => gm.regionId(x, y),
            terrainTag: (x, y) => gm.terrainTag(x, y),
            hasEvent: (x, y) => gm.eventsXy(x, y).length > 0,
            // Blank tiles around a map are passable in MZ but have nothing to stand on.
            hasGround: (x, y) => gm.tileId(x, y, 0) > 0 || gm.tileId(x, y, 1) > 0
        };
    },

    // Places every rule's props in one undo step; returns how many.
    dressMap(seed) {
        const mapId = this.currentMapId();
        const gm = window.$gameMap;
        const tw = gm && gm.tileWidth ? gm.tileWidth() : 48, th = gm && gm.tileHeight ? gm.tileHeight() : 48;
        const list = window.$dataDocsDoodads[mapId] = window.$dataDocsDoodads[mapId] || [];
        const plan = DocsDoodads.Dress.plan(this.dressRulesRaw(), this.dressQuery(), list.map(d => ({ x: d.x, y: d.y })), tw, th,
            DocsDoodads.Scatter.rng(seed || Date.now()));
        const added = plan.map(p => {
            const d = this.newDoodadFromAsset(this.assetByPath(p.path), p.x, p.y);
            d.scaleX = p.scale * (p.flipX ? -1 : 1);
            d.scaleY = p.scale;
            d.dressed = true;
            return d;
        }).filter(d => DocsDoodads.Terrain.allowsDoodad(d, mapId));
        if (added.length === 0) return 0;
        DocsDoodads.Undo.execute({
            type: 'dress_map',
            apply: () => { const l = window.$dataDocsDoodads[mapId]; added.forEach(d => { if (!l.includes(d)) l.push(d); }); this.afterDoodadEdit(); },
            revert: () => { const l = window.$dataDocsDoodads[mapId]; added.forEach(d => { const i = l.indexOf(d); if (i >= 0) l.splice(i, 1); }); this.afterDoodadEdit(); }
        });
        return added.length;
    },

    clearDressing() {
        const mapId = this.currentMapId();
        const list = window.$dataDocsDoodads[mapId] || [];
        const removed = list.filter(d => d && d.dressed);
        if (removed.length === 0) return 0;
        const before = list.slice();
        DocsDoodads.Undo.execute({
            type: 'clear_dressing',
            apply: () => { const l = window.$dataDocsDoodads[mapId]; for (const d of removed) { const i = l.indexOf(d); if (i >= 0) l.splice(i, 1); } this.afterDoodadEdit(); },
            revert: () => { window.$dataDocsDoodads[mapId].splice(0, Infinity, ...before); this.afterDoodadEdit(); }
        });
        return removed.length;
    },

    renderBiomeEditor() {
        const list = DocsDoodads.World.get('biomes.list') || [];
        const sel = DocsDoodads.Biome.find(this.biomeSettings.biomeId, list) || list[0] || null;
        const inputStyle = 'width: 100%; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line); padding: 1px 3px; border-radius: 3px; font-size: 10px;';
        const options = list.map(b => `<option value="${escapeHtml(b.id)}" ${sel && b.id === sel.id ? 'selected' : ''}>${escapeHtml(b.name)}</option>`).join('');
        const b = sel ? DocsDoodads.Biome.normalize(sel) : null;
        const entries = sel ? (sel.entries || []).map((e, i) => `
            <div style="display: grid; grid-template-columns: 1fr 34px 34px 34px 20px; gap: 3px; align-items: center;">
                <input type="text" list="dd-doodad-files" id="dd-biome-e${i}-path" value="${escapeHtml(e.path || '')}" title="${escapeHtml(e.path || '')}" style="${inputStyle}" />
                <input type="number" min="0" step="0.5" id="dd-biome-e${i}-weight" value="${escapeHtml(String(e.weight === undefined ? 1 : e.weight))}" title="Weight" style="${inputStyle}" />
                <input type="number" min="0.1" step="0.05" id="dd-biome-e${i}-scaleMin" value="${escapeHtml(String(e.scaleMin === undefined ? 1 : e.scaleMin))}" title="Smallest scale" style="${inputStyle}" />
                <input type="number" min="0.1" step="0.05" id="dd-biome-e${i}-scaleMax" value="${escapeHtml(String(e.scaleMax === undefined ? 1 : e.scaleMax))}" title="Largest scale" style="${inputStyle}" />
                <button class="dd-btn" id="dd-biome-e${i}-del" title="Remove" style="padding: 0 4px;">&times;</button>
            </div>`).join('') : '';
        return `
            <div style="font-size: 10px; color: var(--dd-muted); line-height: 1.4;">A biome is a mix of props painted with the Biome brush. Add art here or with "Add to Biome" on an asset.</div>
            <div style="display: grid; grid-template-columns: 1fr auto auto; gap: 4px;">
                <select id="dd-biome-pick" style="${inputStyle}">${options || '<option value="">(no biomes yet)</option>'}</select>
                <button class="dd-btn" id="dd-biome-new">New</button>
                <button class="dd-btn" id="dd-biome-del" ${sel ? '' : 'disabled'}>Delete</button>
            </div>
            ${b ? `
            <input type="text" id="dd-biome-name" value="${escapeHtml(b.name)}" style="${inputStyle}" />
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 10px; color: var(--dd-muted);">
                <label>Spacing (px)<input type="number" id="dd-biome-spacing" value="${b.spacing}" style="${inputStyle}" /></label>
                <label>Per dab<input type="number" id="dd-biome-density" value="${b.density}" style="${inputStyle}" /></label>
                <label>Thin at edge<input type="range" id="dd-biome-edgeThin" min="0" max="1" step="0.05" value="${b.edgeThin}" style="width: 100%;" /></label>
                <label>Patchiness<input type="range" id="dd-biome-cluster" min="0" max="1" step="0.05" value="${b.cluster}" style="width: 100%;" /></label>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 34px 34px 34px 20px; gap: 3px; font-size: 9px; color: var(--dd-faint);"><span>Art</span><span>Weight</span><span>Min</span><span>Max</span><span></span></div>
            ${entries}
            <div style="display: grid; grid-template-columns: 1fr auto; gap: 4px;">
                <input type="text" list="dd-doodad-files" id="dd-biome-add-path" placeholder="img/doodads/..." style="${inputStyle}" />
                <button class="dd-btn" id="dd-biome-add">Add</button>
            </div>` : ''}`;
    },

    // The doodad pictures offered by the biome and dress fields: the list is empty until one of them is
    // focused, and its options are built once per change of the library (the panel redraws often).
    doodadFilesDatalist() {
        return '<datalist id="dd-doodad-files"></datalist>';
    },

    doodadFilesOptions() {
        const AI = DocsDoodads.AssetIndex;
        const data = AI && AI.data ? AI.data : null;
        const key = data ? (data.generatedAt || 0) + '|' + (AI.list || []).length : '';
        const c = this._doodadFilesOptions;
        if (c && c.data === data && c.key === key) return c.html;
        const assets = data ? Object.values(data.assets || {}) : [];
        const paths = assets.filter(a => a && /\.png$/i.test(a.path || '') && !/^img\/(characters|faces|system|titles|battlebacks|sv_|enemies)/i.test(a.path)).map(a => a.path).slice(0, 3000);
        const html = paths.map(p => `<option value="${escapeHtml(p)}"></option>`).join('');
        this._doodadFilesOptions = { data, key, html };
        return html;
    },

    bindDoodadFilesDatalist(root) {
        if (!root || !root.querySelectorAll) return;
        const fill = () => {
            const list = document.getElementById('dd-doodad-files');
            if (list && !list.firstChild) list.innerHTML = this.doodadFilesOptions();
        };
        for (const input of root.querySelectorAll('input[list="dd-doodad-files"]')) input.addEventListener('focus', fill);
    },

    bindBiomeEditor() {
        const byId = id => document.getElementById(id);
        const list = DocsDoodads.World.get('biomes.list') || [];
        const sel = DocsDoodads.Biome.find(this.biomeSettings.biomeId, list) || list[0] || null;
        const on = (id, event, handler) => { const node = byId(id); if (node) node[event] = handler; };
        on('dd-biome-pick', 'onchange', e => { this.biomeSettings.biomeId = e.target.value; this.refreshInspector(); });
        on('dd-biome-new', 'onclick', () => { this.biomeSettings.biomeId = this.newBiome(); this.refreshInspector(); });
        if (!sel) return;
        this.biomeSettings.biomeId = sel.id;
        on('dd-biome-del', 'onclick', () => { this.deleteBiome(sel.id); this.biomeSettings.biomeId = ''; this.refreshInspector(); });
        on('dd-biome-name', 'onchange', e => { this.setBiomeField(sel.id, 'name', e.target.value.trim() || sel.name); this.refreshInspector(); });
        for (const field of ['spacing', 'density', 'edgeThin', 'cluster']) on(`dd-biome-${field}`, 'onchange', e => this.setBiomeField(sel.id, field, parseFloat(e.target.value) || 0));
        (sel.entries || []).forEach((entry, i) => {
            on(`dd-biome-e${i}-path`, 'onchange', e => this.setBiomeEntryField(sel.id, i, 'path', e.target.value.trim()));
            for (const field of ['weight', 'scaleMin', 'scaleMax']) on(`dd-biome-e${i}-${field}`, 'onchange', e => this.setBiomeEntryField(sel.id, i, field, parseFloat(e.target.value) || 0));
            on(`dd-biome-e${i}-del`, 'onclick', () => { this.removeBiomeEntry(sel.id, i); this.refreshInspector(); });
        });
        on('dd-biome-add', 'onclick', () => { this.addBiomeEntry(sel.id, byId('dd-biome-add-path').value.trim()); this.refreshInspector(); });
    },

    renderDressEditor() {
        const rules = DocsDoodads.World.get('dress.rules') || [];
        const inputStyle = 'width: 100%; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line); padding: 1px 3px; border-radius: 3px; font-size: 10px;';
        const rows = rules.map((rule, r) => {
            const n = DocsDoodads.Dress.normalize(rule);
            const entries = (rule.entries || []).map((e, i) => `
                <div style="display: grid; grid-template-columns: 1fr 20px; gap: 3px;">
                    <span style="font-size: 10px; color: var(--dd-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(e.path)}">${escapeHtml(String(e.path).split('/').pop())}</span>
                    <button class="dd-btn" id="dd-dress-${r}-e${i}-del" style="padding: 0 4px;">&times;</button>
                </div>`).join('');
            return `
                <div style="border: 1px solid var(--dd-line); border-radius: 4px; padding: 5px; display: flex; flex-direction: column; gap: 4px;">
                    <div style="display: grid; grid-template-columns: 1fr 20px; gap: 3px;">
                        <input type="text" id="dd-dress-${r}-name" value="${escapeHtml(n.name)}" style="${inputStyle}" />
                        <button class="dd-btn" id="dd-dress-${r}-del" title="Remove rule" style="padding: 0 4px;">&times;</button>
                    </div>
                    <select id="dd-dress-${r}-where" style="${inputStyle}">${DocsDoodads.Dress.places.map(p => `<option value="${p.value}" ${p.value === n.where ? 'selected' : ''}>${escapeHtml(p.label)}</option>`).join('')}</select>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px; font-size: 9px; color: var(--dd-muted);">
                        <label>Region/tag<input type="number" id="dd-dress-${r}-param" value="${n.param}" style="${inputStyle}" /></label>
                        <label>Chance<input type="number" min="0" max="1" step="0.05" id="dd-dress-${r}-chance" value="${n.chance}" style="${inputStyle}" /></label>
                        <label>Spacing<input type="number" min="0" id="dd-dress-${r}-spacing" value="${n.spacing}" style="${inputStyle}" /></label>
                    </div>
                    ${entries}
                    <div style="display: grid; grid-template-columns: 1fr auto; gap: 4px;">
                        <input type="text" list="dd-doodad-files" id="dd-dress-${r}-add-path" placeholder="img/doodads/..." style="${inputStyle}" />
                        <button class="dd-btn" id="dd-dress-${r}-add">Add</button>
                    </div>
                </div>`;
        }).join('');
        return `
            <div style="font-size: 10px; color: var(--dd-muted); line-height: 1.4;">Rules read the map's tiles: reeds along water, barrels at wall bases, flowers beside a path region. Dressing is one undo step and dressed props can be cleared together.</div>
            ${rows}
            <button class="dd-btn" id="dd-dress-add-rule">Add Rule</button>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px;">
                <button class="dd-btn dd-btn-primary" id="dd-dress-run">Dress Map</button>
                <button class="dd-btn" id="dd-dress-reroll" title="Clear this map's dressing and dress it again">Re-roll</button>
                <button class="dd-btn" id="dd-dress-clear">Clear</button>
            </div>`;
    },

    bindDressEditor() {
        const byId = id => document.getElementById(id);
        const on = (id, event, handler) => { const node = byId(id); if (node) node[event] = handler; };
        const rules = DocsDoodads.World.get('dress.rules') || [];
        rules.forEach((rule, r) => {
            on(`dd-dress-${r}-name`, 'onchange', e => this.setDressRuleField(r, 'name', e.target.value.trim() || rule.name));
            on(`dd-dress-${r}-where`, 'onchange', e => this.setDressRuleField(r, 'where', e.target.value));
            for (const field of ['param', 'chance', 'spacing']) on(`dd-dress-${r}-${field}`, 'onchange', e => this.setDressRuleField(r, field, parseFloat(e.target.value) || 0));
            on(`dd-dress-${r}-del`, 'onclick', () => { this.removeDressRule(r); this.refreshInspector(); });
            (rule.entries || []).forEach((entry, i) => on(`dd-dress-${r}-e${i}-del`, 'onclick', () => { this.removeDressEntry(r, i); this.refreshInspector(); }));
            on(`dd-dress-${r}-add`, 'onclick', () => { this.addDressEntry(r, byId(`dd-dress-${r}-add-path`).value.trim()); this.refreshInspector(); });
        });
        on('dd-dress-add-rule', 'onclick', () => { this.addDressRule(); this.refreshInspector(); });
        on('dd-dress-run', 'onclick', () => { const n = this.dressMap(); this.showToast(n ? `Dressed the map with ${n} prop(s).` : 'Nothing to add: check the rules have art and matching tiles.', n ? 'success' : 'info'); });
        on('dd-dress-reroll', 'onclick', () => { this.clearDressing(); const n = this.dressMap(); this.showToast(`Re-rolled: ${n} prop(s).`, 'success'); });
        on('dd-dress-clear', 'onclick', () => { const n = this.clearDressing(); if (n) this.toastUndo(`Removed ${n} dressed prop(s).`, 'info'); else this.showToast('No dressed props to remove.', 'info'); });
    },

    // Asset inspector: add the selected art to a biome or a dressing rule.
    renderAssetPlacementTools(a) {
        if (!a || !a.path || !/\.png$/i.test(a.path)) return '';
        const biomes = DocsDoodads.World.get('biomes.list') || [];
        const rules = DocsDoodads.World.get('dress.rules') || [];
        const selectStyle = 'flex: 1; min-width: 0; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line); padding: 3px; border-radius: 4px; font-size: 11px;';
        return `
            <div style="margin-top: 8px; display: flex; flex-direction: column; gap: 4px;">
                <label style="font-size: 11px;">Add to Biome / Dressing Rule:</label>
                <div style="display: flex; gap: 4px;">
                    <select id="dd-asset-biome" style="${selectStyle}"><option value="new">New biome</option>${biomes.map(b => `<option value="${escapeHtml(b.id)}">${escapeHtml(b.name)}</option>`).join('')}</select>
                    <button class="dd-btn" id="dd-asset-biome-add">Add</button>
                </div>
                <div style="display: flex; gap: 4px;">
                    <select id="dd-asset-dress" style="${selectStyle}"><option value="new">New rule</option>${rules.map((r, i) => `<option value="${i}">${escapeHtml(r.name || 'Rule ' + (i + 1))}</option>`).join('')}</select>
                    <button class="dd-btn" id="dd-asset-dress-add">Add</button>
                </div>
            </div>`;
    },

    bindAssetPlacementTools(a) {
        const byId = id => document.getElementById(id);
        const biomeBtn = byId('dd-asset-biome-add');
        if (biomeBtn) biomeBtn.onclick = () => {
            let id = byId('dd-asset-biome').value;
            if (id === 'new') id = this.newBiome(String(a.fileName || 'Biome').replace(/\.[^.]+$/, '') + ' biome');
            this.addBiomeEntry(id, a.path);
            this.biomeSettings.biomeId = id;
            this.showToast('Added to the biome. Paint it with the Biome brush.', 'success');
        };
        const dressBtn = byId('dd-asset-dress-add');
        if (dressBtn) dressBtn.onclick = () => {
            let index = byId('dd-asset-dress').value;
            index = index === 'new' ? this.addDressRule() : parseInt(index, 10);
            this.addDressEntry(index, a.path);
            this.showToast('Added to the dressing rule. Run Dress Map from the map panel.', 'success');
        };
    },

    // ---- Visual save history ----
    historyBackups() {
        const FS = DocsDoodads.FS;
        const mapFile = DocsDoodads.Persistence.mapFilePath ? DocsDoodads.Persistence.mapFilePath(this.currentMapId()) : null;
        const doodadFile = DocsDoodads.DataFiles.pathForMap(this.currentMapId());
        const tag = (list, kind) => list.map(b => Object.assign({}, b, { kind }));
        return tag(FS.listBackups(doodadFile), 'doodads').concat(mapFile ? tag(FS.listBackups(mapFile), 'map') : [])
            .sort((a, b) => b.mtimeMs - a.mtimeMs);
    },

    loadHistoryDiff(backup) {
        const data = DocsDoodads.FS.readJson(backup.path);
        if (!data) return null;
        const mapId = this.currentMapId();
        if (backup.kind === 'map') {
            const staged = DocsDoodads.Persistence.stagedFor(mapId);
            const current = staged ? staged.events : (window.$dataMap ? window.$dataMap.events : []);
            return { kind: 'map', mapId, backup, events: DocsDoodads.History.diffEvents(current, data.events || []) };
        }
        // A map's own doodad file is the list itself.
        const saved = Array.isArray(data) ? data : Array.isArray(data[mapId]) ? data[mapId] : [];
        return { kind: 'doodads', mapId, backup, doodads: DocsDoodads.History.diffDoodads(DocsDoodads.doodads(mapId), saved) };
    },

    // item.kind: added / removed / changed (doodads), addedEvent / removedEvent / changedEvent.
    restoreHistoryItem(item) {
        const mapId = this.currentMapId();
        // A comparison made on another map never writes into this one.
        if (this._historyDiff && this._historyDiff.mapId && this._historyDiff.mapId !== mapId) return false;
        const list = window.$dataDocsDoodads[mapId] = window.$dataDocsDoodads[mapId] || [];
        const exec = (apply, revert) => DocsDoodads.Undo.execute({ type: 'restore_history', apply: () => { apply(); this.afterDoodadEdit(); }, revert: () => { revert(); this.afterDoodadEdit(); } });
        if (item.kind === 'removed') {
            const copy = JSON.parse(JSON.stringify(item.backup));
            exec(() => list.push(copy), () => { const i = list.indexOf(copy); if (i >= 0) list.splice(i, 1); });
        } else if (item.kind === 'changed') {
            const now = JSON.parse(JSON.stringify(item.current)), then = JSON.parse(JSON.stringify(item.backup));
            exec(() => this.restoreDoodad(item.current, then), () => this.restoreDoodad(item.current, now));
        } else if (item.kind === 'added') {
            const at = list.indexOf(item.current);
            exec(() => { const i = list.indexOf(item.current); if (i >= 0) list.splice(i, 1); }, () => { if (!list.includes(item.current)) list.splice(Math.max(0, at), 0, item.current); });
        } else {
            const staged = DocsDoodads.Persistence.stagedFor(mapId);
            if (!staged) return;
            const ev = item.kind === 'addedEvent' ? item.current : item.backup;
            const before = staged.events[ev.id] ? JSON.parse(JSON.stringify(staged.events[ev.id])) : undefined;
            const after = item.kind === 'addedEvent' ? undefined : JSON.parse(JSON.stringify(item.backup));
            const write = value => {
                if (value) staged.events[ev.id] = JSON.parse(JSON.stringify(value));
                else delete staged.events[ev.id];
                DocsDoodads.Persistence.dirtyMap = true;
            };
            DocsDoodads.Undo.execute({ type: 'restore_event', apply: () => write(after), revert: () => write(before) });
        }
    },

    showHistoryPanel() {
        const existing = document.getElementById('dd-history');
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
        const panel = document.createElement('div');
        panel.id = 'dd-history';
        panel.className = 'dd-glass';
        panel.style.cssText = 'position: fixed; top: 64px; right: 12px; width: 340px; max-height: calc(100vh - 90px); padding: 14px; z-index: 10030; display: flex; flex-direction: column; gap: 8px; overflow-y: auto;';
        document.body.appendChild(panel);
        this._historyPanel = panel;
        this.refreshHistoryPanel();
    },

    refreshHistoryPanel() {
        const panel = this._historyPanel;
        if (!panel) return;
        const backups = this.historyBackups();
        const diff = this._historyDiff;
        const item = (kind, label, color, i) => `
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px; font-size: 11px;">
                <span style="color: ${color}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(label)}</span>
                <button class="dd-btn dd-hist-restore" data-kind="${kind}" data-index="${i}" style="padding: 1px 6px; font-size: 10px;">Restore</button>
            </div>`;
        const name = d => String(d.bit ? d.bit[1] : '').split('/').pop() + ` @ ${Math.round(d.x)},${Math.round(d.y)}`;
        let body = '<div style="font-size: 11px; color: var(--dd-muted);">Pick a backup to see what changed on this map since then. Changes are outlined on the map: green new, amber changed, red deleted.</div>';
        if (diff && diff.doodads) {
            const d = diff.doodads;
            body = `<div style="font-size: 11px; color: var(--dd-text);">Doodads on this map: ${d.added.length} new, ${d.changed.length} changed, ${d.removed.length} deleted, ${d.unchanged} the same.</div>` +
                d.removed.map((x, i) => item('removed', 'Deleted: ' + name(x), 'var(--dd-danger-dark)', i)).join('') +
                d.changed.map((x, i) => item('changed', 'Changed: ' + name(x.current), 'var(--dd-warn)', i)).join('') +
                d.added.map((x, i) => item('added', 'New: ' + name(x), 'var(--dd-good-dark)', i)).join('');
        } else if (diff && diff.events) {
            const e = diff.events;
            const ev = x => `EV${String(x.id).padStart(3, '0')} "${x.name || ''}"`;
            body = `<div style="font-size: 11px; color: var(--dd-text);">Events on this map: ${e.added.length} new, ${e.changed.length} changed, ${e.removed.length} deleted, ${e.unchanged} the same.</div>` +
                e.removed.map((x, i) => item('removedEvent', 'Deleted: ' + ev(x), 'var(--dd-danger-dark)', i)).join('') +
                e.changed.map((x, i) => item('changedEvent', 'Changed: ' + ev(x.current), 'var(--dd-warn)', i)).join('') +
                e.added.map((x, i) => item('addedEvent', 'New: ' + ev(x), 'var(--dd-good-dark)', i)).join('');
        }
        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div class="dd-pop-title" style="margin-bottom: 0;">${DocsDoodads.Ui.icon('folder', 1)} Old Saves</div>
                <button class="dd-btn" id="dd-hist-close">Close</button>
            </div>
            <select id="dd-hist-pick" style="width: 100%; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line); padding: 3px; border-radius: 4px; font-size: 11px;">
                <option value="">Choose a backup...</option>
                ${backups.map((b, i) => `<option value="${i}" ${diff && diff.backup.path === b.path ? 'selected' : ''}>${escapeHtml(DocsDoodads.History.backupLabel(b))} - ${b.kind === 'map' ? 'events' : 'doodads'}</option>`).join('')}
            </select>
            ${backups.length ? '' : '<div style="font-size: 11px; color: var(--dd-muted);">No backups yet. Each save keeps one.</div>'}
            <div style="display: flex; flex-direction: column; gap: 4px;">${body}</div>
            <div style="font-size: 10px; color: var(--dd-faint);">Restores are undoable. Event restores are saved when you press Save.</div>`;
        const byId = id => document.getElementById(id);
        byId('dd-hist-close').onclick = () => { this._historyDiff = null; if (panel.parentNode) panel.parentNode.removeChild(panel); this._historyPanel = null; };
        byId('dd-hist-pick').onchange = e => {
            const b = backups[parseInt(e.target.value, 10)];
            this._historyDiff = b ? this.loadHistoryDiff(b) : null;
            this.refreshHistoryPanel();
        };
        panel.querySelectorAll('.dd-hist-restore').forEach(btn => {
            btn.onclick = () => {
                const kind = btn.dataset.kind, i = parseInt(btn.dataset.index, 10);
                const source = diff.doodads || diff.events;
                const group = kind.replace('Event', '');
                const entry = source[group][i];
                const payload = group === 'changed' ? { kind, current: entry.current, backup: entry.backup } : group === 'added' ? { kind, current: entry } : { kind, backup: entry };
                this.restoreHistoryItem(payload);
                this._historyDiff = this.loadHistoryDiff(diff.backup);
                this.refreshHistoryPanel();
            };
        });
    },

    // Outlines for the history overlay, in screen pixels.
    historyOverlayRects() {
        const diff = this._historyDiff;
        if (!diff || !diff.doodads) return [];
        const rect = d => {
            const w = (d.frameW || 48) * Math.abs(d.scaleX !== undefined ? d.scaleX : 1), h = (d.frameH || 48) * Math.abs(d.scaleY !== undefined ? d.scaleY : 1);
            const at = DocsDoodads.mapToScreen(d.x, d.y);
            return { x: at.x - (d.anchorX !== undefined ? d.anchorX : 0.5) * w, y: at.y - (d.anchorY !== undefined ? d.anchorY : 1) * h, w, h };
        };
        const U = DocsDoodads.Ui;
        return diff.doodads.added.map(d => Object.assign(rect(d), { color: U.mapColor('added') }))
            .concat(diff.doodads.changed.map(c => Object.assign(rect(c.backup), { color: U.mapColor('changed') })))
            .concat(diff.doodads.removed.map(d => Object.assign(rect(d), { color: U.mapColor('removed') })));
    },

    // ---- Ctrl+K command palette ----
    paletteCommands() {
        const D = DocsDoodads;
        const out = [];
        const add = (label, run, group, keys) => out.push({ label, run, group: group || 'Command', keys });
        const K = id => D.Shortcuts.label(id) || undefined;
        add('Save', () => D.Persistence.saveAll(), null, K('save'));
        add('Undo', () => D.Undo.undo(), null, K('undo'));
        add('Redo', () => D.Undo.redo(), null, K('redo'));
        add('Keyboard Shortcuts (see and change keys)', () => this.showShortcutsCard(), null, K('shortcuts'));
        add('Toggle Grid', () => this.toggleGrid(), null, K('grid'));
        add('Show / Hide Collision', () => this.toggleCollisionOverlay(), null, K('collision'));
        for (const s of this.bagSorts) add('Sort Item Bag: ' + s.label, () => this.setBagSort(s.value), 'Item Bag');
        add('Save This Search', () => this.saveCurrentSearch(), 'Item Bag');
        for (const s of D.AssetIndex.savedSearches()) add('Saved search: ' + s.name, () => this.setSearchQuery(s.query), 'Item Bag');
        add('Screen Looks (post-processing)', () => this.showPostFxBuilder());
        add('Effects Maker (VFX)', () => this.showVfxBuilder());
        add('File Check (duplicates, unused files)', () => this.showAssetTools());
        add('Old Saves (history)', () => this.showHistoryPanel());
        add('World View', () => this.showWorldView());
        add('Export Map Image', () => this.exportMapImage({ scale: 1, includeCharacters: true, includeEffects: true }));
        add('Dress This Map', () => {
            const n = this.dressMap();
            this.showToast(n ? `Dressed the map with ${n} prop(s).` : 'Nothing to add: check the rules have art and matching tiles.', n ? 'success' : 'info');
        });
        add('Clear Map Dressing', () => { const n = this.clearDressing(); if (n) this.toastUndo(`Removed ${n} dressed prop(s).`, 'info'); else this.showToast('No dressed props to remove.', 'info'); });
        add('Messages (read them again)', () => this.showToastHistory());
        add('Look: size, theme, map colours', () => this.showLookCard());
        add('How to Use (welcome card)', () => this.showWelcome());
        add('Replay Tool Tours', () => this.replayTours());
        add('Add Sample Items (pictures, prefabs, a biome)', () => this.addSampleContent());
        add("What's New", () => this.showWhatsNew());
        add('Capture: picture of the view (PNG)', () => this.capturePicture());
        add('Problems (check the map)', () => this.showProblems());
        add('Find doodads (by picture, name, tag, layer...)', () => this.showFind());
        add('Outliner: this map\'s doodads by layer', () => this.showOutliner());
        add('Pick doodads in a region...', async () => {
            const r = await DocsDoodads.Ui.prompt('Which region? (1-255)', '1', { title: 'Pick in a region', ok: 'Pick' });
            if (r) this.selectInRegion(Number(r));
        });
        add('Snap picked doodads to the grid', () => this.snapSelectionToGrid());
        add('Rooms (room stamps)', () => this.showRoomsCard());
        add('Doodad Packs (make or bring in)', () => this.showPacksCard());
        add('Characters (MZ, LPC and Memao libraries)', () => this.showLpcCard());
        add('Character Creator...', () => this.openCreator(null, this.lastCreatorKit()));
        add('Write CREDITS_LPC.txt (LPC artists)', () => this.writeLpcCreditsText());
        add('Save a Room from the Map', () => { this.showRoomsCard(); this.startRoomCapture(); });
        for (const r of D.Rooms.ensureLoaded()) add('Place Room: ' + r.name, () => { this.showRoomsCard(); this.pickRoom(r.id); }, 'Room');
        add('Check Reach from the player', () => this.checkReach());
        add('Check Reach from a tile...', () => this.setPlacementTool('reach'));
        add('Capture: orbit GIF (3D)', () => this.captureOrbitGif());
        add('Clock: run the day fast', () => this.playClock(), 'Clock');
        add('Clock: back to the game\'s time', () => { this.stopClock(); this.previewMinutes = null; this.previewSeason = null; this.updateClockBar(true); }, 'Clock');
        add('Show / Hide Sounds', () => this.toggleSoundOverlay(), null, K('sounds'));
        add('Listen Here (click a tile)', () => this.setPlacementTool('listen'));
        add('Show / Hide Speed (performance)', () => this.togglePerfOverlay(), null, K('speed'));
        for (const s of D.Ui.scales) add(`Editor size ${Math.round(s * 100)}%`, () => this.setLook('uiScale', s), 'Look');
        for (const t of D.Ui.themes) add('Theme: ' + t.label, () => this.setLook('theme', t.value), 'Look');
        add('Map colours: colour-blind safe', () => this.setLook('mapColors', 'safe'), 'Look');
        add('Map colours: standard', () => this.setLook('mapColors', 'standard'), 'Look');
        add('Tool: Grab (eyedropper)', () => this.setPlacementTool('eyedropper'), null, K('toolGrab'));
        add('Tool: Stamp', () => this.setPlacementTool('stamp'), null, K('toolStamp'));
        add('Tool: Scatter', () => this.setPlacementTool('brush'), null, K('toolScatter'));
        add('Tool: Paint (biomes)', () => this.setPlacementTool('biome'), null, K('toolPaint'));
        add('Tool: Path', () => this.setPlacementTool('path'), null, K('toolPath'));
        add('Tool: Hills (terrain)', () => this.setPlacementTool('terrain'), null, K('toolHills'));
        add('Tool: Regions (paint region numbers)', () => this.setPlacementTool('region'), null, K('toolRegions'));
        add('Tool: Tiles (paint MZ tiles)', () => this.setPlacementTool('tiles'), null, K('toolTiles'));
        add('Tool: Select', () => this.setPlacementTool(null), null, K('toolSelect'));
        add('Select All', () => this.selectAllDoodads(), null, K('selectAll'));
        add('Invert Selection', () => this.invertSelection());
        add('Show Hidden Doodads', () => this.showHiddenDoodads());
        add('Select Same Art as Picked', () => this.selectSameArt());
        add('Paste in Place', () => this.pasteCopied(true), null, K('pasteInPlace'));
        add('Replace Art of Picked Doodads', () => this.showReplaceArt());
        for (const m of D.Symmetry.modes) add(m.value === 'off' ? 'Mirror: Off' : 'Mirror: ' + m.label.replace('Mirror left/right', 'Mirror Left/Right').replace('Mirror top/bottom', 'Mirror Top/Bottom').replace('Mirror four ways', 'Mirror Four Ways'), () => this.setSymmetry(m.value));
        for (const p of D.PostFX.presets) add('Screen Look: ' + p.label, () => this.applyPreset('world', p.id), 'Look');
        for (const v of D.Vfx.library().concat(D.Vfx.builtIns)) add('Play Effect: ' + v.name, () => this.previewVfx(v.id), 'VFX');
        for (const l of D.Layers.list(D.Lighting.mapSettings(this.currentMapId()))) {
            add('Layer: ' + l.name, () => { this.activeLayer = l.id; this.showToast(`New doodads go on ${l.name}.`); }, 'Layer');
            add('Select Layer: ' + l.name, () => this.selectLayer(l.id), 'Layer');
        }
        for (const m of this.mapEntries()) add(`Go to map: ${m.name}`, () => this.goToMap(m.id), 'Map');
        const assets = D.AssetIndex && D.AssetIndex.list ? D.AssetIndex.list : [];
        for (const a of assets) add('Item: ' + a.fileName, () => this.selectAsset(a), 'Asset');
        return out;
    },

    showCommandPalette() {
        const existing = document.getElementById('dd-palette');
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
        const commands = this.paletteCommands();
        const panel = document.createElement('div');
        panel.id = 'dd-palette';
        panel.className = 'dd-glass';
        panel.style.cssText = 'position: fixed; top: 90px; left: 50%; transform: translateX(-50%); width: 520px; max-width: calc(100vw - 32px); padding: 10px; z-index: 10050; display: flex; flex-direction: column; gap: 6px;';
        panel.innerHTML = `
            <input type="text" id="dd-palette-input" placeholder="Type a command, map or asset... (or: time 18:30, go to map 3)" style="width: 100%; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-primary); padding: 8px; border-radius: 6px; font-size: 13px;" />
            <div id="dd-palette-list" style="max-height: 50vh; overflow-y: auto; display: flex; flex-direction: column; gap: 1px;"></div>`;
        document.body.appendChild(panel);
        const input = document.getElementById('dd-palette-input');
        const listEl = document.getElementById('dd-palette-list');
        let results = [], index = 0;
        const close = () => { if (panel.parentNode) panel.parentNode.removeChild(panel); };
        const draw = () => {
            results = this.paletteResults(input.value, commands, 50);
            index = Math.min(index, Math.max(0, results.length - 1));
            listEl.innerHTML = results.map((c, i) => {
                const parts = this.paletteRowParts(c);
                return `
                <div class="dd-palette-row" data-i="${i}" style="display: flex; align-items: center; gap: 6px; padding: 5px 8px; border-radius: 4px; cursor: pointer; font-size: 12px; ${i === index ? 'background: var(--dd-field); color: var(--dd-text);' : 'color: var(--dd-text);'}">
                    <span style="flex: 1; min-width: 0;">${escapeHtml(parts.name)}</span>${parts.keys ? `<kbd>${escapeHtml(parts.keys)}</kbd>` : ''}
                    <span style="color: var(--dd-faint); font-size: 10px;">${c.recent ? 'Recent · ' : ''}${escapeHtml(c.group)}</span>
                </div>`;
            }).join('') || '<div style="font-size: 12px; color: var(--dd-faint); padding: 6px;">No matches</div>';
            listEl.querySelectorAll('.dd-palette-row').forEach(row => {
                row.onmousedown = e => { e.preventDefault(); run(parseInt(row.dataset.i, 10)); };
            });
        };
        const run = i => {
            const c = results[i];
            close();
            if (c) {
                // Typed values (a time, a map) are made fresh each time; named commands are remembered.
                if (commands.some(x => x.label === c.label)) this.rememberCommand(c.label);
                try { c.run(); } catch (error) { this.showToast(error.message || String(error), 'error'); }
            }
        };
        input.oninput = () => { index = 0; draw(); };
        input.onkeydown = e => {
            if (e.key === 'ArrowDown') { index = Math.min(results.length - 1, index + 1); draw(); e.preventDefault(); }
            else if (e.key === 'ArrowUp') { index = Math.max(0, index - 1); draw(); e.preventDefault(); }
            else if (e.key === 'Enter') { run(index); e.preventDefault(); }
            else if (e.key === 'Escape') { close(); e.preventDefault(); }
            e.stopPropagation();
        };
        input.onblur = () => setTimeout(close, 150);
        draw();
        input.focus();
    },

    // ---- Animated drawer thumbnails ----
    attachThumbAnimation(card, imgEl, asset) {
        const frames = DocsDoodads.AnimatedThumb.framesFor(asset);
        if (!frames || typeof Image === 'undefined') return;
        // The drawer rebuilds its cards while scrolling, and a removed card gets no mouseleave: the
        // animation stops itself once its card is gone. hover counts visits, so a late image is ignored.
        let timer = null, canvas = null, hover = 0;
        const stop = () => {
            if (timer) clearInterval(timer);
            timer = null;
            if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
            canvas = null;
        };
        card.onmouseenter = () => {
            const visit = ++hover;
            stop();
            const img = new Image();
            img.onload = () => {
                if (visit !== hover || !card.isConnected || !card.matches || !card.matches(':hover')) return;
                const box = imgEl.getBoundingClientRect ? imgEl.getBoundingClientRect() : { width: 64, height: 64 };
                const f0 = frames[0];
                const scale = Math.min((box.width || 64) / f0.w, (box.height || 64) / f0.h, 4);
                canvas = document.createElement('canvas');
                canvas.width = Math.max(1, Math.round(f0.w * scale));
                canvas.height = Math.max(1, Math.round(f0.h * scale));
                canvas.style.cssText = 'image-rendering: pixelated; max-width: 85%; max-height: 70%;';
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = false;
                let i = 0;
                const step = () => {
                    if (!card.isConnected) { stop(); return; }
                    const f = frames[i % frames.length];
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, f.x, f.y, f.w, f.h, 0, 0, canvas.width, canvas.height);
                    i++;
                };
                step();
                timer = setInterval(step, 140);
                imgEl.style.display = 'none';
                card.insertBefore(canvas, imgEl);
            };
            img.src = DocsDoodads.LiveReload.urlFor(asset.path);
        };
        card.onmouseleave = () => {
            hover++;
            stop();
            imgEl.style.display = '';
        };
    },

    // The biome brush's list, filled whenever the tool turns on (toolbar or command palette).
    refreshBiomeToolPicker() {
        const pick = document.getElementById('dd-biome-tool-pick');
        const list = DocsDoodads.World.get('biomes.list') || [];
        if (!this.biomeSettings.biomeId && list[0]) this.biomeSettings.biomeId = list[0].id;
        if (pick) pick.innerHTML = list.length
            ? list.map(b => `<option value="${escapeHtml(b.id)}" ${b.id === this.biomeSettings.biomeId ? 'selected' : ''}>${escapeHtml(b.name)}</option>`).join('')
            : '<option value="">(no biomes yet)</option>';
    },

    bindToolbarExtras() {
        const byId = id => document.getElementById(id);
        const biomeBtn = byId('dd-biome-btn');
        if (biomeBtn) biomeBtn.onclick = () => {
            this.setPlacementTool(this.placementTool === 'biome' ? null : 'biome');
            this.showToast(this.placementTool ? 'Biome brush: drag on the map' : 'Biome brush off');
        };
        const on = (id, event, handler) => { const node = byId(id); if (node) node[event] = handler; };
        on('dd-biome-tool-pick', 'onchange', e => { this.biomeSettings.biomeId = e.target.value; });
        on('dd-biome-rad', 'oninput', e => { this.biomeSettings.radius = parseFloat(e.target.value) || 96; const v = byId('dd-biome-rad-val'); if (v) v.textContent = e.target.value + 'px'; });
        on('dd-biome-avoid', 'onchange', e => { this.biomeSettings.avoidBlocked = Boolean(e.target.checked); });
        on('dd-terrain-btn', 'onclick', () => {
            this.setPlacementTool(this.placementTool === 'terrain' ? null : 'terrain');
            const mode = byId('dd-terrain-mode');
            if (mode) mode.innerHTML = DocsDoodads.Terrain.brushModes.map(m => `<option value="${m.value}" ${m.value === this.terrainBrush.mode ? 'selected' : ''}>${escapeHtml(m.label)}</option>`).join('');
            const falloff = byId('dd-terrain-falloff');
            if (falloff) falloff.innerHTML = DocsDoodads.Terrain.brushFalloffs.map(f => `<option value="${f.value}" ${f.value === this.terrainBrush.falloff ? 'selected' : ''}>${escapeHtml(f.label)}</option>`).join('');
            if (!this.placementTool) this.showToast('Terrain brush off');
            else this.showToast(DocsDoodads.Perspective.active() ? 'Terrain brush: drag on the map' : 'Terrain brush: turn on 3D View (map panel) to see heights', 'info');
        });
        on('dd-terrain-mode', 'onchange', e => { this.terrainBrush.mode = e.target.value; });
        on('dd-terrain-falloff', 'onchange', e => { this.terrainBrush.falloff = e.target.value === 'hard' ? 'hard' : 'soft'; });
        on('dd-terrain-amount', 'oninput', e => { this.terrainBrush.amount = parseFloat(e.target.value) || 0.5; const v = byId('dd-terrain-amount-val'); if (v) v.textContent = e.target.value; });
        on('dd-terrain-radius', 'oninput', e => { this.terrainBrush.radius = parseInt(e.target.value, 10) || 0; const v = byId('dd-terrain-radius-val'); if (v) v.textContent = e.target.value; });
        on('dd-terrain-value', 'onchange', e => { this.terrainBrush.value = parseFloat(e.target.value) || 0; });
        this.bindRegionTool();
        if (this.bindTilesTool) this.bindTilesTool();
        const symPop = byId('dd-sym-popover');
        on('dd-sym-btn', 'onclick', () => {
            if (!symPop) return;
            const open = symPop.style.display !== 'block';
            symPop.style.display = open ? 'block' : 'none';
            DocsDoodads.Ui.sound('cursor');
            if (!open) return;
            this.placePopover(symPop, 'dd-sym-btn');
            const s = this.symmetryFor();
            const gm = window.$gameMap;
            const tw = gm ? gm.tileWidth() : 48, th = gm ? gm.tileHeight() : 48;
            const axes = s.mode === 'off' ? Object.assign({}, s, gm ? DocsDoodads.Symmetry.defaultAxes(gm.width(), gm.height(), tw, th) : {}) : s;
            byId('dd-sym-mode').innerHTML = DocsDoodads.Symmetry.modes.map(m => `<option value="${m.value}" ${m.value === (this.symmetry.mode || 'off') ? 'selected' : ''}>${escapeHtml(m.label)}</option>`).join('');
            byId('dd-sym-x').value = axes.axisX / tw;
            byId('dd-sym-y').value = axes.axisY / th;
        });
        on('dd-sym-mode', 'onchange', e => this.setSymmetry(e.target.value));
        const axisInput = (id, key, size) => on(id, 'onchange', e => {
            const gm = window.$gameMap;
            this.symmetry = Object.assign({}, this.symmetry, { [key]: (parseFloat(e.target.value) || 0) * (gm ? gm[size]() : 48) });
        });
        axisInput('dd-sym-x', 'axisX', 'tileWidth');
        axisInput('dd-sym-y', 'axisY', 'tileHeight');
        on('dd-sym-center', 'onclick', () => {
            this.symmetry = Object.assign({}, this.symmetry, { axisX: null, axisY: null });
            const s = this.symmetryFor();
            const gm = window.$gameMap;
            if (gm) {
                const axes = DocsDoodads.Symmetry.defaultAxes(gm.width(), gm.height(), gm.tileWidth(), gm.tileHeight());
                byId('dd-sym-x').value = axes.axisX / gm.tileWidth();
                byId('dd-sym-y').value = axes.axisY / gm.tileHeight();
            }
            return s;
        });
    },

    // ---- VFX library (stored in the project's world settings) ----
    vfxLibraryRaw() {
        return JSON.parse(JSON.stringify(DocsDoodads.World.get('vfx.library') || []));
    },

    newVfx(name) {
        const list = this.vfxLibraryRaw();
        const id = DocsDoodads.Prefabs.newId('vfx_');
        list.push({ id, name: String(name || 'New Effect'), duration: 1, loop: false, layers: [{ type: 'particles', emitter: { preset: 'sparkles' } }] });
        this.setWorldSetting('vfx.library', list);
        return id;
    },

    duplicateVfx(id) {
        const source = DocsDoodads.Vfx.find(id, this.vfxLibraryRaw());
        if (!source) return null;
        const list = this.vfxLibraryRaw();
        const copy = JSON.parse(JSON.stringify(source));
        copy.id = DocsDoodads.Prefabs.newId('vfx_');
        copy.name = source.name + ' copy';
        list.push(copy);
        this.setWorldSetting('vfx.library', list);
        return copy.id;
    },

    renameVfx(id, name) {
        this.editVfx(id, def => { def.name = String(name || def.name); });
    },

    deleteVfx(id) {
        const list = this.vfxLibraryRaw();
        const index = list.findIndex(d => d.id === id);
        if (index < 0) return false;
        list.splice(index, 1);
        this.setWorldSetting('vfx.library', list);
        return true;
    },

    editVfx(id, mutate) {
        const list = this.vfxLibraryRaw();
        const def = list.find(d => d.id === id);
        if (!def) return false;
        mutate(def);
        this.setWorldSetting('vfx.library', list);
        return true;
    },

    addVfxLayer(id, type) {
        this.editVfx(id, def => {
            def.layers = def.layers || [];
            def.layers.push(type === 'sheet' ? { type: 'sheet', image: '', cols: 5, rows: 1, fps: 15 } : { type: 'particles', emitter: { preset: 'sparkles' } });
        });
    },

    removeVfxLayer(id, index) {
        this.editVfx(id, def => { (def.layers || []).splice(index, 1); });
    },

    // The effect with every layer's emitter filled in, for showing current values.
    vfxView(def) {
        const view = DocsDoodads.Vfx.normalize(def);
        view.layers = view.layers.map(l => (l.type === 'particles' ? Object.assign({}, l, { emitter: DocsDoodads.Particles.normalize(l.emitter) }) : l));
        return view;
    },

    getVfxValue(id, path) {
        const def = DocsDoodads.Vfx.find(id, this.vfxLibraryRaw());
        if (!def) return undefined;
        return String(path).split('.').reduce((node, key) => (node === undefined || node === null ? undefined : node[key]), this.vfxView(def));
    },

    // path like "layers.0.emitter.rate" or "layers.0.emitter.size.1"; missing parts are filled from current values.
    setVfxField(id, path, value) {
        return this.editVfx(id, def => {
            const view = this.vfxView(def);
            const keys = String(path).split('.');
            let node = def, shown = view;
            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i];
                if (node[key] === undefined || node[key] === null) node[key] = JSON.parse(JSON.stringify(shown ? shown[key] : {}));
                node = node[key];
                shown = shown ? shown[key] : undefined;
            }
            node[keys[keys.length - 1]] = value;
        });
    },

    // One preview at a time: a new one (every edit replays it) ends the last, looping or not.
    previewVfx(id) {
        let x = 0, y = 0;
        if (typeof $gamePlayer !== 'undefined' && $gamePlayer && window.$gameMap) {
            x = ($gamePlayer._realX + 0.5) * $gameMap.tileWidth();
            y = ($gamePlayer._realY + 0.5) * $gameMap.tileHeight();
        }
        this.stopVfxPreview();
        this._vfxPreview = DocsDoodads.Vfx.play({ id, x, y });
        return this._vfxPreview;
    },

    stopVfxPreview() {
        if (this._vfxPreview) this._vfxPreview.done = true;
        this._vfxPreview = null;
    },

    vfxLayerFields(layer) {
        const range = (key, label, min, max, step) => ({ key, label, type: 'range', min, max, step });
        const number = (key, label, step = 1) => ({ key, label, type: 'number', step });
        const select = (key, label, options) => ({ key, label, type: 'select', options });
        const P = DocsDoodads.Particles;
        const common = [number('start', 'Starts after (s)', 0.1), number('offsetX', 'Offset X'), number('offsetY', 'Offset Y')];
        if (layer.type === 'sheet') {
            return [
                { key: 'image', label: 'Image (e.g. img/animations/Fire1.png)', type: 'text' },
                number('cols', 'Columns'), number('rows', 'Rows'), number('frames', 'Frames used'),
                range('fps', 'Frames per second', 1, 60, 1), { key: 'loop', label: 'Loop', type: 'checkbox' },
                range('scale', 'Scale', 0.1, 4, 0.05), range('rotation', 'Rotation', -180, 180, 1),
                select('blend', 'Blend', P.blends.map(b => ({ value: b, label: b }))), { key: 'tint', label: 'Tint', type: 'color' },
                range('alpha', 'Opacity', 0, 1, 0.05)
            ].concat(common);
        }
        const e = key => 'emitter.' + key;
        return [
            select(e('preset'), 'Based on preset', P.presets.map(p => ({ value: p.id, label: p.label }))),
            range(e('rate'), 'Rate (per second)', 0, 200, 1), number(e('burst'), 'Burst at start'),
            number(e('lifetime.0'), 'Life min (s)', 0.1), number(e('lifetime.1'), 'Life max (s)', 0.1),
            number(e('speed.0'), 'Speed min'), number(e('speed.1'), 'Speed max'),
            range(e('angle'), 'Direction (degrees, -90 = up)', -180, 180, 1), range(e('spread'), 'Spread', 0, 360, 1),
            number(e('gravity'), 'Gravity'), number(e('wind'), 'Wind'),
            number(e('size.0'), 'Size start'), number(e('size.1'), 'Size end'),
            range(e('alpha.0'), 'Opacity start', 0, 1, 0.05), range(e('alpha.1'), 'Opacity end', 0, 1, 0.05),
            { key: e('colorStart'), label: 'Colour start', type: 'color' }, { key: e('colorEnd'), label: 'Colour end', type: 'color' },
            select(e('blend'), 'Blend', P.blends.map(b => ({ value: b, label: b }))),
            select(e('shape'), 'Shape', P.shapes.map(s => ({ value: s, label: s }))),
            number(e('area.0'), 'Spawn area width'), number(e('area.1'), 'Spawn area height'),
            range(e('flutter'), 'Flutter', 0, 60, 1), range(e('twinkle'), 'Twinkle', 0, 1, 0.05),
            range(e('stretch'), 'Stretch along motion', 0, 4, 0.1)
        ].concat(common);
    },

    renderVfxBuilder() {
        const V = DocsDoodads.Vfx;
        const library = V.library();
        const all = library.concat(V.builtIns);
        if (!this.vfxSelected || !V.find(this.vfxSelected, this.vfxLibraryRaw())) this.vfxSelected = all.length ? all[0].id : '';
        const isBuiltIn = !library.some(d => d.id === this.vfxSelected);
        const def = V.find(this.vfxSelected, this.vfxLibraryRaw());
        const selectStyle = 'width: 100%; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line); padding: 3px; border-radius: 4px; font-size: 11px;';
        const option = d => `<option value="${escapeHtml(d.id)}" ${d.id === this.vfxSelected ? 'selected' : ''}>${escapeHtml(d.name)}</option>`;
        const view = def ? this.vfxView(def) : null;
        const layers = view ? view.layers.map((layer, i) => {
            const fields = this.vfxLayerFields(layer).map((f, j) => {
                const value = String(f.key).split('.').reduce((n, k) => (n === undefined ? undefined : n[k]), layer);
                return this.fieldHtml(`dd-vfx-l${i}-${j}`, f, value);
            }).join('');
            const title = layer.type === 'sheet' ? `Sprite sheet ${escapeHtml(String(layer.image || '').split('/').pop() || '(no image)')}` : `Particles (${escapeHtml(layer.emitter.preset || 'custom')})`;
            return `
                <details ${this._openVfxLayer === i ? 'open' : ''} id="dd-vfx-sec-${i}" style="border-top: 1px solid var(--dd-line-soft); padding-top: 5px;">
                    <summary style="cursor: pointer; font-size: 11px; font-weight: bold; color: var(--dd-muted);">${i + 1}. ${title}</summary>
                    <fieldset ${isBuiltIn ? 'disabled' : ''} style="border: none; padding: 0; margin: 5px 0 0; display: flex; flex-direction: column; gap: 5px;">
                        ${fields}
                        <button class="dd-btn" id="dd-vfx-remove-${i}">Remove Layer</button>
                    </fieldset>
                </details>`;
        }).join('') : '';
        return `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div class="dd-pop-title" style="margin-bottom: 0;">${DocsDoodads.Ui.icon('sparkle', 1)} Effects Maker</div>
                <button class="dd-btn" id="dd-vfx-close">Close</button>
            </div>
            <select id="dd-vfx-pick" style="${selectStyle}">
                <optgroup label="Project">${library.map(option).join('')}</optgroup>
                <optgroup label="Built-in">${V.builtIns.map(option).join('')}</optgroup>
            </select>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px;">
                <button class="dd-btn" id="dd-vfx-new">New</button>
                <button class="dd-btn" id="dd-vfx-dup">Duplicate</button>
                <button class="dd-btn" id="dd-vfx-rename" ${isBuiltIn ? 'disabled' : ''}>Rename</button>
                <button class="dd-btn" id="dd-vfx-delete" ${isBuiltIn ? 'disabled' : ''}>Delete</button>
            </div>
            ${isBuiltIn ? '<div style="font-size: 11px; color: var(--dd-muted);">Built-in effects are read-only. Duplicate one to change it.</div>' : ''}
            ${view ? `
            <fieldset ${isBuiltIn ? 'disabled' : ''} style="border: none; padding: 0; margin: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; align-items: end;">
                ${this.fieldHtml('dd-vfx-duration', { label: 'Emits for (s)', type: 'number', step: 0.1 }, view.duration)}
                ${this.fieldHtml('dd-vfx-loop', { label: 'Loop', type: 'checkbox' }, view.loop)}
            </fieldset>
            <div style="overflow-y: auto; display: flex; flex-direction: column; gap: 4px;">${layers}</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                <button class="dd-btn" id="dd-vfx-add-particles" ${isBuiltIn ? 'disabled' : ''}>+ Particles</button>
                <button class="dd-btn" id="dd-vfx-add-sheet" ${isBuiltIn ? 'disabled' : ''}>+ Sprite Sheet</button>
            </div>` : ''}
            <div style="display: flex; gap: 8px; align-items: center;">
                <button class="dd-btn dd-btn-primary" id="dd-vfx-preview">Preview at Player</button>
                <label style="font-size: 11px; color: var(--dd-text); display: flex; gap: 5px; align-items: center;"><input type="checkbox" id="dd-vfx-autoplay" ${this.vfxAutoPlay !== false ? 'checked' : ''} /> Replay on change</label>
            </div>
            <div style="font-size: 10px; color: var(--dd-faint); line-height: 1.4;">Play effects with the "Play VFX" plugin command (by name), or attach one to a doodad in its Particles section.</div>`;
    },

    showVfxBuilder() {
        const existing = document.getElementById('dd-vfx');
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
        const panel = document.createElement('div');
        panel.id = 'dd-vfx';
        panel.className = 'dd-glass';
        panel.style.cssText = 'position: fixed; top: 64px; right: 12px; width: 330px; max-height: calc(100vh - 90px); padding: 14px; z-index: 10030; display: flex; flex-direction: column; gap: 8px; overflow-y: auto;';
        panel.innerHTML = this.renderVfxBuilder();
        document.body.appendChild(panel);
        this._vfxPanel = panel;
        this.bindVfxBuilder();
    },

    refreshVfxBuilder() {
        if (!this._vfxPanel || !this._vfxPanel.parentNode) return;
        this._vfxPanel.innerHTML = this.renderVfxBuilder();
        this.bindVfxBuilder();
    },

    bindVfxBuilder() {
        const byId = id => document.getElementById(id);
        const on = (id, event, handler) => { const node = byId(id); if (node) node[event] = handler; };
        const id = this.vfxSelected;
        const changed = () => {
            this.refreshVfxBuilder();
            if (this.vfxAutoPlay !== false) this.previewVfx(id);
        };
        on('dd-vfx-close', 'onclick', () => {
            this.stopVfxPreview();
            if (this._vfxPanel && this._vfxPanel.parentNode) this._vfxPanel.parentNode.removeChild(this._vfxPanel);
            this._vfxPanel = null;
        });
        on('dd-vfx-pick', 'onchange', e => { this.vfxSelected = e.target.value; this._openVfxLayer = null; this.refreshVfxBuilder(); });
        on('dd-vfx-new', 'onclick', () => { this.vfxSelected = this.newVfx('New Effect'); this.refreshVfxBuilder(); });
        on('dd-vfx-dup', 'onclick', () => { const copy = this.duplicateVfx(id); if (copy) this.vfxSelected = copy; this.refreshVfxBuilder(); });
        on('dd-vfx-rename', 'onclick', async () => {
            const current = DocsDoodads.Vfx.find(id, this.vfxLibraryRaw());
            const name = await DocsDoodads.Ui.prompt('A new name for this effect:', current ? current.name : '', { title: 'Rename effect', ok: 'Rename', icon: 'sparkle' });
            if (name && name.trim()) { this.renameVfx(id, name.trim()); this.refreshVfxBuilder(); }
        });
        on('dd-vfx-delete', 'onclick', () => { if (this.deleteVfx(id)) { this.vfxSelected = ''; this.refreshVfxBuilder(); } });
        on('dd-vfx-duration', 'onchange', e => { this.setVfxField(id, 'duration', parseFloat(e.target.value) || 1); changed(); });
        on('dd-vfx-loop', 'onchange', e => { this.setVfxField(id, 'loop', Boolean(e.target.checked)); changed(); });
        on('dd-vfx-add-particles', 'onclick', () => { this.addVfxLayer(id, 'particles'); this._openVfxLayer = (this.getVfxValue(id, 'layers') || []).length - 1; changed(); });
        on('dd-vfx-add-sheet', 'onclick', () => { this.addVfxLayer(id, 'sheet'); this._openVfxLayer = (this.getVfxValue(id, 'layers') || []).length - 1; changed(); });
        on('dd-vfx-preview', 'onclick', () => this.previewVfx(id));
        on('dd-vfx-autoplay', 'onchange', e => { this.vfxAutoPlay = Boolean(e.target.checked); });
        const layers = this.getVfxValue(id, 'layers') || [];
        layers.forEach((layer, i) => {
            const details = byId(`dd-vfx-sec-${i}`);
            if (details) details.ontoggle = () => { if (details.open) this._openVfxLayer = i; };
            on(`dd-vfx-remove-${i}`, 'onclick', () => { this.removeVfxLayer(id, i); this._openVfxLayer = null; changed(); });
            this.vfxLayerFields(layer).forEach((f, j) => {
                const input = byId(`dd-vfx-l${i}-${j}`);
                if (!input) return;
                input.onchange = () => {
                    const value = f.type === 'checkbox' ? Boolean(input.checked) : (f.type === 'range' || f.type === 'number') ? (parseFloat(input.value) || 0) : input.value;
                    this._openVfxLayer = i;
                    this.setVfxField(id, `layers.${i}.${f.key}`, value);
                    changed();
                };
            });
        });
    },

    // Background sounds and sound effects in the asset index, as "bgs/Name" and "se/Name".
    audioFileOptions() {
        const assets = DocsDoodads.AssetIndex && DocsDoodads.AssetIndex.data ? Object.values(DocsDoodads.AssetIndex.data.assets || {}) : [];
        const pick = folder => assets
            .filter(a => a && new RegExp('^audio/' + folder + '/', 'i').test(a.path || ''))
            .map(a => folder + '/' + a.path.replace(new RegExp('^audio/' + folder + '/', 'i'), '').replace(/\.[^/.]+$/, ''))
            .filter((v, i, all) => all.indexOf(v) === i)
            .sort();
        return pick('bgs').concat(pick('se')).map(v => ({ value: v, label: v }));
    },

