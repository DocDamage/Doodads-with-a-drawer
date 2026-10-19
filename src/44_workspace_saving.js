//==========================================================
// SECTION 25n: TEMPLATES, MAP SETTINGS, PICKING MANY IN THE BAG, CHECKPOINTS, SAVING
//==========================================================
// Event templates (More > Templates): rename, change the category of and delete your own. Map settings
// (More > Map Settings): copy some or all of another map's settings to this one, and keep settings as presets
// for new maps. The Item Bag picks several items with Ctrl and Shift for tags, favourites, a collection, a move
// to another folder or deleting the unused ones. Steps keeps named checkpoints (33_persistence_saving.js), and
// Save can write this map only; More > Autosave saves every few minutes.
DocsDoodads.Ui.css += `
#dd-templates-card, #dd-mapset-card { position: fixed; top: 80px; left: 50%; transform: translateX(-50%); z-index: 10045; width: 400px; max-width: calc(100vw - 32px); max-height: calc(100vh - 110px); padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; overflow-y: auto; font-size: 11px; }
#dd-templates-card .dd-tpl-row, #dd-mapset-card .dd-ms-row { display: flex; align-items: center; gap: 6px; padding: 4px 8px; border-radius: 10px; background: var(--dd-panel-2); }
#dd-templates-card .dd-tpl-name, #dd-mapset-card .dd-ms-name { flex: 1; min-width: 0; font-weight: 700; color: var(--dd-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#dd-templates-card .dd-btn, #dd-mapset-card .dd-btn { padding: 3px 8px; font-size: 11px; }
#dd-templates-card .dd-tpl-group, #dd-mapset-card .dd-ms-group { font-weight: 900; color: var(--dd-muted); margin-top: 4px; }
#dd-mapset-card label { display: flex; align-items: center; gap: 6px; }
.dd-card.dd-bag-picked { outline: 3px solid var(--dd-accent); outline-offset: -3px; }
#dd-bag-batch { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; padding: 6px; border-radius: 10px; background: var(--dd-primary-soft); font-size: 11px; font-weight: 800; }
#dd-bag-batch .dd-btn { padding: 2px 7px; font-size: 11px; }
#dd-undo-history .dd-cp-row { display: flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 10px; background: var(--dd-panel-2); margin-bottom: 3px; }
#dd-undo-history .dd-cp-row .dd-btn { padding: 2px 6px; font-size: 10px; }
`;

// Which map settings travel together when copied. Settings tied to one map's tiles are not copied unless asked.
DocsDoodads.MapSettingsCopy = {
    parts: [
        { id: 'light', label: 'Light, shadows and reflections', keys: ['ambient', 'dayNight', 'characterShadows', 'reflections'] },
        { id: 'look', label: 'Screen look', keys: ['postfx', 'lookBlends'] },
        { id: 'layers', label: 'Layers', keys: ['layers', 'mainLayer'] },
        { id: 'camera', label: 'Camera, 3D and minimap', keys: ['cameraBounds', 'perspective', 'minimap'] },
        { id: 'sound', label: 'Echo and region sounds', keys: ['echo', 'regionSounds'] },
        { id: 'tiles', label: 'This map\'s ground (heights, surfaces, neighbours, where it leads)', keys: ['terrain', 'surfaceMap', 'neighbors', 'destination'], off: true },
        { id: 'other', label: 'Everything else', keys: [] }
    ],

    partOf(key) {
        const part = this.parts.find(p => p.keys.includes(key));
        return part ? part.id : 'other';
    },

    // The parts a map's settings have, for the copy dialog.
    partsIn(settings) {
        const ids = new Set(Object.keys(settings || {}).map(k => this.partOf(k)));
        return this.parts.filter(p => ids.has(p.id));
    },

    // The target's settings with the chosen parts taken from the source (a part the source lacks is cleared).
    apply(target, source, partIds) {
        const out = JSON.parse(JSON.stringify(target || {}));
        const chosen = new Set(partIds || []);
        for (const key of Object.keys(out)) if (chosen.has(this.partOf(key))) delete out[key];
        for (const key of Object.keys(source || {})) if (chosen.has(this.partOf(key))) out[key] = JSON.parse(JSON.stringify(source[key]));
        return out;
    }
};

// Map settings kept under a name, for new maps (project-wide, in data/).
DocsDoodads.MapPresets = {
    path: 'data/DocsDoodadsMapPresets.json',
    data: null,

    list() {
        if (!this.data) {
            const read = DocsDoodads.FS.readJson(this.path);
            this.data = read && Array.isArray(read.presets) ? read : { version: 1, presets: [] };
        }
        return this.data.presets;
    },

    get(name) {
        return this.list().find(p => p.name === name) || null;
    },

    // Keeps the settings without the parts tied to one map's tiles. Replaces a preset of the same name.
    save(name, settings) {
        name = String(name || '').trim();
        if (!name) return null;
        const C = DocsDoodads.MapSettingsCopy;
        const keep = C.apply({}, settings, C.parts.filter(p => !p.off).map(p => p.id));
        const presets = this.list().filter(p => p.name !== name);
        const preset = { name, settings: keep };
        presets.push(preset);
        presets.sort((a, b) => a.name.localeCompare(b.name));
        this.data.presets = presets;
        DocsDoodads.FS.atomicWriteJson(this.path, this.data);
        return preset;
    },

    remove(name) {
        const before = this.list().length;
        this.data.presets = this.list().filter(p => p.name !== name);
        if (this.data.presets.length === before) return false;
        DocsDoodads.FS.atomicWriteJson(this.path, this.data);
        return true;
    }
};

Object.assign(DocsDoodads.Workspace, {
    // ---- Event templates ----
    showTemplatesCard() {
        if (typeof document === 'undefined') return null;
        const U = DocsDoodads.Ui, T = DocsDoodads.EventTemplates;
        let card = document.getElementById('dd-templates-card');
        if (!card) {
            card = document.createElement('div');
            card.id = 'dd-templates-card';
            card.className = 'dd-glass';
            document.body.appendChild(card);
        }
        const mine = T.custom();
        card.innerHTML = `
            <div class="dd-panel-head"><span class="dd-grow">${U.icon('person', 1)} Event Templates</span>
                <button class="dd-btn dd-fold" id="dd-tpl-close" type="button" title="Close">${U.icon('close', 1)}</button></div>
            <div style="color: var(--dd-faint); line-height: 1.4;">Your own templates (right-click an event: Save as Template). The ${T.builtInKeys ? T.builtInKeys.size : 0} that come with the plugin can't be changed. Packs can carry yours to another project.</div>
            <div id="dd-tpl-list" style="display: flex; flex-direction: column; gap: 4px;"></div>`;
        const list = document.getElementById('dd-tpl-list');
        if (list) {
            if (!mine.length) {
                const empty = document.createElement('div');
                empty.className = 'dd-empty';
                empty.textContent = 'No templates of your own yet.';
                list.appendChild(empty);
            }
            let category = null;
            for (const t of mine) {
                if (t.category !== category) {
                    category = t.category;
                    const head = document.createElement('div');
                    head.className = 'dd-tpl-group';
                    head.textContent = category;
                    list.appendChild(head);
                }
                const row = document.createElement('div');
                row.className = 'dd-tpl-row';
                const name = document.createElement('span');
                name.className = 'dd-tpl-name';
                name.textContent = t.name;
                row.appendChild(name);
                for (const [label, run] of [['Rename', () => this.renameTemplate(t.key)], ['Category', () => this.recategorizeTemplate(t.key)], ['Delete', () => this.deleteTemplate(t.key)]]) {
                    const b = document.createElement('button');
                    b.className = 'dd-btn';
                    b.type = 'button';
                    b.textContent = label;
                    b.onclick = run;
                    row.appendChild(b);
                }
                list.appendChild(row);
            }
        }
        const close = document.getElementById('dd-tpl-close');
        if (close) close.onclick = () => this.closeTemplatesCard();
        return card;
    },

    refreshTemplatesCard() {
        if (typeof document !== 'undefined' && document.getElementById('dd-templates-card')) this.showTemplatesCard();
        if (this.selectedAsset && this.refreshInspector) this.refreshInspector();
    },

    closeTemplatesCard() {
        const card = typeof document !== 'undefined' ? document.getElementById('dd-templates-card') : null;
        if (card && card.parentNode) card.parentNode.removeChild(card);
    },

    async renameTemplate(key, name) {
        const T = DocsDoodads.EventTemplates;
        if (name === undefined) name = await DocsDoodads.Ui.prompt('A new name for this template.', (T.get(key) || {}).name || '', { title: 'Rename template', ok: 'Rename', icon: 'person' });
        if (name === null || name === undefined) return null;
        const result = T.rename(key, name);
        if (result.error) { this.showToast(result.error, 'error'); return null; }
        this.refreshTemplatesCard();
        return result.key;
    },

    async recategorizeTemplate(key, category) {
        const T = DocsDoodads.EventTemplates;
        if (category === undefined) category = await DocsDoodads.Ui.prompt('Which category? Pick one or type a new one.', (T.get(key) || {}).category || 'Custom',
            { title: 'Template category', ok: 'Move', icon: 'folder', choices: T.categories() });
        if (category === null || category === undefined) return false;
        const ok = T.setCategory(key, category);
        this.refreshTemplatesCard();
        return ok;
    },

    async deleteTemplate(key, sure) {
        const T = DocsDoodads.EventTemplates;
        const t = T.get(key);
        if (!t || !T.isCustom(key)) return false;
        if (!sure && !(await DocsDoodads.Ui.confirm(`Delete the template "${t.name}"? Events made from it stay as they are.`, { title: 'Delete template?', ok: 'Delete', danger: true }))) return false;
        T.remove(key);
        this.refreshTemplatesCard();
        this.showToast(`Deleted the template "${t.name}".`);
        return true;
    },

    // ---- Map settings: copy and presets ----
    // One undo step: this map's settings take the chosen parts from another map's (or a preset's).
    copyMapSettings(source, partIds, label = 'Copy map settings') {
        const mapId = this.currentMapId();
        const before = DocsDoodads.Lighting.mapSettings(mapId);
        const previous = before ? JSON.parse(JSON.stringify(before)) : null;
        const next = DocsDoodads.MapSettingsCopy.apply(previous, source, partIds);
        DocsDoodads.Undo.execute({ type: 'map_setting', label,
            apply: () => { this.writeMapSettings(mapId, next); this.afterMapSettings(); },
            revert: () => { this.writeMapSettings(mapId, previous); this.afterMapSettings(); } });
        return next;
    },

    afterMapSettings() {
        if (DocsDoodads.World && DocsDoodads.World.invalidate) DocsDoodads.World.invalidate();
        this.refreshSpriteset(true);
        if (this.refreshInspector) this.refreshInspector();
    },

    mapName(id) {
        const info = (window.$dataMapInfos || [])[id];
        return info && info.name ? `${id}: ${info.name}` : `Map ${id}`;
    },

    // Maps with settings of their own, other than this one.
    mapsWithSettings() {
        const all = (window.$dataDocsDoodads && window.$dataDocsDoodads.mapSettings) || {};
        const here = String(this.currentMapId());
        return Object.keys(all).filter(id => id !== here && all[id] && Object.keys(all[id]).length).map(Number).sort((a, b) => a - b);
    },

    async askCopyMapSettings(fromId) {
        const U = DocsDoodads.Ui, C = DocsDoodads.MapSettingsCopy;
        const maps = this.mapsWithSettings();
        if (!maps.length) { this.showToast('No other map has settings of its own yet.', 'info'); return null; }
        if (fromId === undefined) {
            const pick = await U.form({ title: 'Copy map settings', text: 'Copy settings from which map?', ok: 'Next', icon: 'map',
                fields: [{ key: 'map', type: 'select', label: 'From', value: String(maps[0]), options: maps.map(id => ({ value: String(id), label: this.mapName(id) })) }] });
            if (!pick) return null;
            fromId = Number(pick.map);
        }
        const source = DocsDoodads.Lighting.mapSettings(fromId) || {};
        const parts = C.partsIn(source);
        const values = await U.form({ title: 'Copy map settings', text: `What to take from ${this.mapName(fromId)}? This map's own settings of those kinds are replaced (one undo step).`,
            ok: 'Copy', icon: 'map', fields: parts.map(p => ({ key: p.id, type: 'checkbox', label: p.label, value: !p.off })) });
        if (!values) return null;
        const chosen = parts.map(p => p.id).filter(id => values[id]);
        if (!chosen.length) return null;
        this.copyMapSettings(source, chosen, `Copy settings from map ${fromId}`);
        this.showToast(`Copied ${chosen.length} kind(s) of setting from ${this.mapName(fromId)}.`);
        this.refreshMapSettingsCard();
        return chosen;
    },

    applyMapPreset(name) {
        const preset = DocsDoodads.MapPresets.get(name);
        if (!preset) return null;
        const C = DocsDoodads.MapSettingsCopy;
        const parts = C.partsIn(preset.settings).map(p => p.id);
        const next = this.copyMapSettings(preset.settings, parts, `Map preset: ${name}`);
        this.showToast(`This map now uses the preset "${name}".`);
        return next;
    },

    saveMapPreset(name) {
        const preset = DocsDoodads.MapPresets.save(name, DocsDoodads.Lighting.mapSettings(this.currentMapId()) || {});
        if (preset) this.showToast(`Saved this map's settings as the preset "${preset.name}".`);
        this.refreshMapSettingsCard();
        return preset;
    },

    showMapSettingsCard() {
        if (typeof document === 'undefined') return null;
        const U = DocsDoodads.Ui, P = DocsDoodads.MapPresets;
        let card = document.getElementById('dd-mapset-card');
        if (!card) {
            card = document.createElement('div');
            card.id = 'dd-mapset-card';
            card.className = 'dd-glass';
            document.body.appendChild(card);
        }
        const mine = DocsDoodads.Lighting.mapSettings(this.currentMapId()) || {};
        card.innerHTML = `
            <div class="dd-panel-head"><span class="dd-grow">${U.icon('map', 1)} Map Settings</span>
                <button class="dd-btn dd-fold" id="dd-ms-close" type="button" title="Close">${U.icon('close', 1)}</button></div>
            <div style="color: var(--dd-faint); line-height: 1.4;">This map has ${Object.keys(mine).length} setting(s) of its own: ${escapeHtml(DocsDoodads.MapSettingsCopy.partsIn(mine).map(p => p.label).join(', ') || 'none')}.</div>
            <button class="dd-btn dd-btn-primary" id="dd-ms-copy" type="button"${this.mapsWithSettings().length ? '' : ' disabled'}>Copy from Another Map...</button>
            <div class="dd-ms-group">Presets</div>
            <div id="dd-ms-list" style="display: flex; flex-direction: column; gap: 4px;"></div>
            <div style="display: flex; gap: 6px;"><input type="text" id="dd-ms-name" placeholder="Night forest" style="flex: 1; min-width: 0;" aria-label="Preset name" />
                <button class="dd-btn" id="dd-ms-save" type="button" title="Keep this map's settings (not its ground) under this name">Save as Preset</button></div>`;
        const list = document.getElementById('dd-ms-list');
        if (list) {
            const presets = P.list();
            if (!presets.length) {
                const empty = document.createElement('div');
                empty.className = 'dd-empty';
                empty.textContent = 'No presets yet.';
                list.appendChild(empty);
            }
            for (const p of presets) {
                const row = document.createElement('div');
                row.className = 'dd-ms-row';
                const name = document.createElement('span');
                name.className = 'dd-ms-name';
                name.textContent = p.name;
                row.appendChild(name);
                for (const [label, run] of [['Use Here', () => this.applyMapPreset(p.name)], ['Delete', () => { P.remove(p.name); this.refreshMapSettingsCard(); }]]) {
                    const b = document.createElement('button');
                    b.className = 'dd-btn';
                    b.type = 'button';
                    b.textContent = label;
                    b.onclick = run;
                    row.appendChild(b);
                }
                list.appendChild(row);
            }
        }
        const on = (id, run) => { const el = document.getElementById(id); if (el) el.onclick = run; };
        on('dd-ms-close', () => this.closeMapSettingsCard());
        on('dd-ms-copy', () => this.askCopyMapSettings());
        on('dd-ms-save', () => { const input = document.getElementById('dd-ms-name'); if (input && input.value.trim()) this.saveMapPreset(input.value); });
        return card;
    },

    refreshMapSettingsCard() {
        if (typeof document !== 'undefined' && document.getElementById('dd-mapset-card')) this.showMapSettingsCard();
    },

    closeMapSettingsCard() {
        const card = typeof document !== 'undefined' ? document.getElementById('dd-mapset-card') : null;
        if (card && card.parentNode) card.parentNode.removeChild(card);
    },

    // ---- Picking several items in the Item Bag ----
    // mode: 'toggle' (Ctrl) or 'range' (Shift: from the last one picked to this one, in the bag's order).
    bagPick(asset, mode = 'toggle') {
        const picked = this.bagPicked = this.bagPicked || new Set();
        const list = this.filteredAssets || [];
        if (mode === 'range' && this._bagAnchor) {
            const a = list.findIndex(x => x.id === this._bagAnchor), b = list.findIndex(x => x.id === asset.id);
            if (a >= 0 && b >= 0) {
                for (let i = Math.min(a, b); i <= Math.max(a, b); i++) if (list[i].type !== 'prefab') picked.add(list[i].id);
            }
        } else if (picked.has(asset.id)) {
            picked.delete(asset.id);
        } else if (asset.type !== 'prefab') {
            // The item shown in Details counts as the first one picked.
            if (!picked.size && this.selectedAsset && this.selectedAsset.id !== asset.id && this.selectedAsset.type !== 'prefab') picked.add(this.selectedAsset.id);
            picked.add(asset.id);
        }
        this._bagAnchor = asset.id;
        this.renderBagBatch();
        return picked.size;
    },

    clearBagPicks() {
        if (this.bagPicked) this.bagPicked.clear();
        this._bagAnchor = null;
        this.renderBagBatch();
    },

    bagPickedAssets() {
        const assets = (DocsDoodads.AssetIndex.data && DocsDoodads.AssetIndex.data.assets) || {};
        return Array.from(this.bagPicked || []).map(id => assets[id]).filter(Boolean);
    },

    renderBagBatch() {
        if (typeof document === 'undefined') return;
        const container = document.getElementById('dd-cards-container');
        if (container && container.querySelectorAll) {
            container.querySelectorAll('.dd-card').forEach(c => c.classList.toggle('dd-bag-picked', Boolean(c._ddAssetId && this.bagPicked && this.bagPicked.has(c._ddAssetId))));
        }
        let bar = document.getElementById('dd-bag-batch');
        const count = this.bagPicked ? this.bagPicked.size : 0;
        if (!count) { if (bar && bar.parentNode) bar.parentNode.removeChild(bar); return; }
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'dd-bag-batch';
            if (container && container.parentNode && container.parentNode.insertBefore) container.parentNode.insertBefore(bar, container);
            else document.body.appendChild(bar);
        }
        bar.innerHTML = `<span style="flex-basis: 100%;">${count} picked (Ctrl or Shift + click)</span>
            <button class="dd-btn" type="button" id="dd-bb-tag">Tag</button><button class="dd-btn" type="button" id="dd-bb-fav">★</button>
            <button class="dd-btn" type="button" id="dd-bb-col">Collection</button><button class="dd-btn" type="button" id="dd-bb-move">Move</button>
            <button class="dd-btn" type="button" id="dd-bb-del">Delete</button><button class="dd-btn" type="button" id="dd-bb-clear" title="Pick none">✕</button>`;
        const on = (id, run) => { const el = document.getElementById(id); if (el) el.onclick = run; };
        on('dd-bb-tag', () => this.bagBatch('tag'));
        on('dd-bb-fav', () => this.bagBatch('favorite'));
        on('dd-bb-col', () => this.bagBatch('collection'));
        on('dd-bb-move', () => this.bagBatch('move'));
        on('dd-bb-del', () => this.bagBatch('delete'));
        on('dd-bb-clear', () => this.clearBagPicks());
    },

    // One action on every picked item. value: the tags, collection or folder (asked when not given).
    async bagBatch(action, value) {
        const D = DocsDoodads, AI = D.AssetIndex, U = D.Ui;
        const items = this.bagPickedAssets();
        if (!items.length) return null;
        const ask = async (text, fallback, opts) => (value !== undefined ? value : U.prompt(text, fallback, opts));
        let done = 0;
        if (action === 'tag') {
            const input = await ask(`Tags to add to ${items.length} item(s), with commas.`, '', { title: 'Tag them', ok: 'Add Tags', icon: 'search', placeholder: 'forest, prop' });
            const add = String(input || '').split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
            if (!add.length) return null;
            for (const a of items) {
                const tags = Array.from(new Set((a.tags || []).concat(add)));
                AI.setTags(a.id, tags.join(', '));
                done++;
            }
            this.showToast(`Tagged ${done} item(s): ${add.join(', ')}.`);
        } else if (action === 'favorite') {
            const all = items.every(a => a.favorite);
            for (const a of items) if (Boolean(a.favorite) === all) { AI.toggleFavorite(a.id); done++; }
            this.showToast(all ? `${items.length} item(s) are no longer favourites.` : `${items.length} item(s) are favourites.`);
        } else if (action === 'collection') {
            const existing = AI.getCollections();
            const answer = await ask(`Which collection should the ${items.length} item(s) go in? Type a new name or pick one.`, existing[0] || 'Custom Collection',
                { title: 'Add to collection', ok: 'Add', icon: 'folder', choices: existing });
            const name = String(answer || '').replace(/["']/g, '').trim();
            if (!name) return null;
            for (const a of items) { AI.addAssetToCollection(a.id, name); done++; }
            if (this.refreshCollectionPicker) this.refreshCollectionPicker();
            this.showToast(`Added ${done} item(s) to "${name}".`);
        } else if (action === 'move') {
            done = await this.moveBagItems(items, value);
        } else if (action === 'delete') {
            done = await this.deleteBagItems(items, value);
        }
        if (this.refreshDrawerCards) this.refreshDrawerCards();
        this.renderBagBatch();
        return done;
    },

    // Moves each picked file to a folder (and updates what uses it; 42_workspace_assets_maps.js renameAsset).
    async moveBagItems(items, folder) {
        const U = DocsDoodads.Ui;
        if (folder === undefined) {
            const first = String(items[0].path).replace(/\\/g, '/');
            folder = await U.prompt(`Move ${items.length} file(s) to which folder? Everything that uses them is updated, and changed files are backed up first.`,
                first.slice(0, first.lastIndexOf('/')), { title: 'Move files', ok: 'Move', icon: 'folder' });
            if (!folder) return 0;
        }
        folder = String(folder).trim().replace(/\\/g, '/').replace(/\/+$/, '');
        const failed = [];
        let moved = 0;
        for (const a of items) {
            const target = folder + '/' + String(a.path).replace(/\\/g, '/').split('/').pop();
            if (target.toLowerCase() === String(a.path).replace(/\\/g, '/').toLowerCase()) continue;
            const result = this.renameAsset(a, target, { quiet: true });
            if (result.ok) { moved++; if (this.bagPicked) { this.bagPicked.delete(a.id); this.bagPicked.add(target.toLowerCase()); } }
            else failed.push(`${a.fileName}: ${result.error}`);
        }
        this.showToast(`Moved ${moved} file(s) to ${folder}.${failed.length ? ` ${failed.length} not moved (${failed[0]}${failed.length > 1 ? '...' : ''}).` : ''}`, failed.length ? 'warning' : 'success');
        return moved;
    },

    // Deletes the picked files nothing uses: they go to data/docs_doodads_cache/deleted/<time>/ (put them back
    // from there by hand), and their Item Bag entries go. Files in use are kept and counted.
    async deleteBagItems(items, sure) {
        const D = DocsDoodads, FS = D.FS, AI = D.AssetIndex;
        const index = this.refreshUsageIndex();
        const unused = items.filter(a => !D.Usage.isEngineReserved(a) && !D.Usage.isUsed(a, index));
        const kept = items.length - unused.length;
        if (!unused.length) { this.showToast(`All ${items.length} picked file(s) are used somewhere, so none were deleted.`, 'warning'); return 0; }
        if (!sure && !(await D.Ui.confirm(`Delete ${unused.length} file(s) nothing uses?${kept ? ` ${kept} that are used stay.` : ''} They are moved to data/docs_doodads_cache/deleted/, so they can be put back by hand.`,
            { title: 'Delete files?', ok: 'Delete', danger: true }))) return 0;
        const bin = `data/docs_doodads_cache/deleted/${new Date().toISOString().replace(/[:.]/g, '-')}`;
        let deleted = 0;
        for (const a of unused) {
            const from = String(a.path).replace(/\\/g, '/');
            const moves = [{ from, to: bin + '/' + from }].concat(this.companionFiles(from, bin + '/' + from));
            try {
                for (const m of moves) { FS.mkdirp(FS.path.dirname(m.to)); FS.fs.renameSync(m.from, m.to); }
            } catch (e) {
                this.showToast(`Could not delete ${a.fileName}: ${e.message || e}`, 'error');
                continue;
            }
            delete AI.data.assets[a.id];
            for (const members of Object.values(AI.data.collections || {})) {
                if (Array.isArray(members)) for (let i = members.length - 1; i >= 0; i--) if (members[i] === a.id) members.splice(i, 1);
            }
            if (D.Thumbnail && D.Thumbnail.invalidate) D.Thumbnail.invalidate(a.id);
            if (this.bagPicked) this.bagPicked.delete(a.id);
            if (this.selectedAsset === a) this.selectedAsset = null;
            deleted++;
        }
        AI.rebuildList();
        AI.save();
        D.Usage.lastIndex = null;
        if (this.refreshInspector) this.refreshInspector();
        this.showToast(`Deleted ${deleted} file(s) (in ${bin}/)${kept ? `; ${kept} in use kept` : ''}.`);
        return deleted;
    },

    // ---- Checkpoints ----
    async addCheckpoint(name) {
        if (name === undefined) name = await DocsDoodads.Ui.prompt('Name this checkpoint. It keeps this map\'s doodads and settings as they are now, through Save and closing.',
            'Before ' + (DocsDoodads.Undo.history().slice(-1).map(s => s.label.toLowerCase())[0] || 'changes'), { title: 'Checkpoint', ok: 'Keep', icon: 'history' });
        if (name === null || name === undefined) return null;
        const mapId = this.currentMapId();
        const entry = DocsDoodads.Checkpoints.create(mapId, name, DocsDoodads.doodads(mapId), DocsDoodads.Lighting.mapSettings(mapId));
        this.showToast(`Checkpoint "${entry.name}" kept.`);
        if (this.renderUndoHistory && this._undoHistoryOpen) this.renderUndoHistory();
        return entry;
    },

    // This map goes back to the checkpoint's doodads and settings, as one undo step.
    restoreCheckpoint(id) {
        const mapId = this.currentMapId();
        const cp = DocsDoodads.Checkpoints.get(mapId, id);
        if (!cp) return false;
        const data = window.$dataDocsDoodads = window.$dataDocsDoodads || {};
        const beforeList = data[mapId] || [];
        const beforeSettings = DocsDoodads.Lighting.mapSettings(mapId);
        const prevSettings = beforeSettings ? JSON.parse(JSON.stringify(beforeSettings)) : null;
        const list = JSON.parse(JSON.stringify(cp.doodads || []));
        // Doodads the API placed for this play stay.
        const temps = beforeList.filter(d => d && d.temp);
        const set = (doodads, settings) => {
            data[mapId] = doodads;
            this.writeMapSettings(mapId, settings);
            this.selectDoodads([]);
            this.afterDoodadEdit();
            this.afterMapSettings();
        };
        DocsDoodads.Undo.execute({ type: 'restore_checkpoint', label: `Checkpoint: ${cp.name}`,
            apply: () => set(list.concat(temps), cp.settings), revert: () => set(beforeList, prevSettings) });
        this.showToast(`Back to "${cp.name}" (Undo to go back again).`);
        return true;
    },

    deleteCheckpoint(id) {
        const ok = DocsDoodads.Checkpoints.remove(this.currentMapId(), id);
        if (this.renderUndoHistory && this._undoHistoryOpen) this.renderUndoHistory();
        return ok;
    },

    // The checkpoints part of Steps.
    checkpointsHtml() {
        const list = DocsDoodads.Checkpoints.list(this.currentMapId());
        const when = at => { const d = new Date(at); return `${d.toLocaleDateString()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
        return `<div style="display: flex; align-items: center; gap: 6px; margin: 4px 0;"><b style="flex: 1;">Checkpoints</b>
                <button class="dd-btn" id="dd-cp-add" type="button" style="padding: 2px 8px; font-size: 11px;" title="Keep this map as it is now, under a name">+ Checkpoint</button></div>
            ${list.map(c => `<div class="dd-cp-row"><span style="flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 700;" title="${escapeHtml(when(c.at))}, ${c.count} doodad(s)">${escapeHtml(c.name)}</span>
                <button class="dd-btn" type="button" data-cp-restore="${escapeHtml(c.id)}">Restore</button><button class="dd-btn" type="button" data-cp-delete="${escapeHtml(c.id)}" title="Delete">✕</button></div>`).join('')}
            <div style="border-top: 1px solid var(--dd-line-soft); margin: 6px 0 4px;"></div>`;
    },

    bindCheckpoints(panel) {
        const add = document.getElementById('dd-cp-add');
        if (add) add.onclick = () => this.addCheckpoint();
        for (const el of panel.querySelectorAll('[data-cp-restore]')) el.onclick = () => { this.restoreCheckpoint(el.getAttribute('data-cp-restore')); this.renderUndoHistory(); };
        for (const el of panel.querySelectorAll('[data-cp-delete]')) el.onclick = () => this.deleteCheckpoint(el.getAttribute('data-cp-delete'));
    },

    // ---- Saving ----
    saveThisMap() {
        return DocsDoodads.Persistence.saveMapOnly(this.currentMapId());
    },

    // Off, then every 5, 10 or 20 minutes.
    cycleAutosave() {
        const steps = [0, 5, 10, 20];
        const now = DocsDoodads.Persistence.autosaveMinutes();
        const next = steps[(steps.indexOf(now) + 1) % steps.length] || 0;
        this.setAutosave(next);
        return next;
    },

    setAutosave(minutes) {
        minutes = Math.max(0, Math.round(Number(minutes) || 0));
        DocsDoodads.Ui.setPref('autosaveMinutes', minutes);
        DocsDoodads.Persistence._unsavedSince = null;
        const label = typeof document !== 'undefined' ? document.getElementById('dd-autosave-label') : null;
        if (label) label.textContent = this.autosaveLabel();
        this.showToast(minutes ? `Autosave: every ${minutes} minutes of unsaved work.` : 'Autosave is off.');
        return minutes;
    },

    autosaveLabel() {
        const m = DocsDoodads.Persistence.autosaveMinutes();
        return m ? `Autosave: ${m} min` : 'Autosave: Off';
    }
});
