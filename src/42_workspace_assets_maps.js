    // ---- Collision traced from the art ----
    loadPixels(path) {
        return new Promise((resolve, reject) => {
            if (typeof Image === 'undefined' || typeof document === 'undefined') return reject(new Error('Images cannot be read here.'));
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth || img.width;
                canvas.height = img.naturalHeight || img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                resolve({ data: ctx.getImageData(0, 0, canvas.width, canvas.height).data, width: canvas.width, height: canvas.height });
            };
            img.onerror = () => reject(new Error(`Could not load ${path}`));
            img.src = path;
        });
    },

    async traceCollision(items, loader = (path) => this.loadPixels(path)) {
        const targets = (items || []).filter(d => d && d.bit && d.bit[0] === 3 && !d.locked);
        if (targets.length === 0) return 0;
        const before = this.snapshotDoodads(targets);
        const cache = {};
        let traced = 0;
        for (const d of targets) {
            try {
                const path = d.bit[1];
                const px = cache[path] || (cache[path] = await loader(path));
                const shape = DocsDoodads.Collision.footprintFromAlpha(px.data, px.width, px.height, {
                    frame: { x: d.frameX || 0, y: d.frameY || 0, w: d.frameW || px.width, h: d.frameH || px.height }
                });
                if (shape) {
                    d.collision = { preset: 'custom', shape };
                    traced++;
                }
            } catch (error) {
                DocsDoodads.Core.log('Collision tracing failed', error);
            }
        }
        if (traced > 0) this.recordDoodadEdit(targets, before, 'trace_collision');
        this.showToast(traced > 0 ? `Traced collision for ${traced} doodad(s) from their art.` : 'No solid footprint found in the art; collision unchanged.');
        if (traced > 0) this.refreshInspector();
        return traced;
    },

    // Saves the traced footprint on the library asset so every new placement starts with it.
    async traceAssetCollision(asset, loader = (path) => this.loadPixels(path)) {
        try {
            const px = await loader(asset.path);
            const shape = DocsDoodads.Collision.footprintFromAlpha(px.data, px.width, px.height);
            if (!shape) {
                this.showToast('No solid footprint found in the art.');
                return null;
            }
            asset.collision = { preset: 'custom', shape };
            DocsDoodads.AssetIndex.save();
            this.showToast(`Collision traced for ${asset.fileName}; new placements will use it.`);
            this.refreshInspector();
            return shape;
        } catch (error) {
            this.showToast(`Could not trace collision: ${error.message || error}`);
            return null;
        }
    },

    // A new doodad for an asset (library entry or drag payload) at a map position.
    newDoodadFromAsset(asset, x, y) {
        const d = DocsDoodads.standardStruct();
        d.bit = [3, asset.path];
        d.x = x;
        d.y = y;
        // Drag payloads carry frameW/frameH; library assets carry width/height.
        d.frameW = asset.frameW || asset.width || 48;
        d.frameH = asset.frameH || asset.height || 48;
        const preferredDepth = (asset.placement && asset.placement.depth) || asset.depth;
        d.depth = DocsDoodads.Depth.modes.includes(preferredDepth) ? preferredDepth : DocsDoodads.Depth.suggestFor(asset);
        const collision = asset.collision || {};
        d.collision = { preset: collision.preset || "none", shape: collision.shape ? JSON.parse(JSON.stringify(collision.shape)) : null };
        DocsDoodads.MapLinks.ensureUid(d);
        if (this.activeLayer && this.activeLayer !== 'main') d.layer = this.activeLayer;
        return d;
    },

    // ---- Prefab drawer entries and panels ----
    prefabAssets() {
        return DocsDoodads.Prefabs.ensureLoaded().map(p => ({
            id: `prefab:${p.id}:${p.updatedAt || p.createdAt || 0}`,
            prefabId: p.id,
            path: p.thumbnail || '',
            fileName: p.name,
            category: 'Prefabs',
            type: 'prefab',
            width: 0, height: 0,
            tags: [], autoTags: ['prefab'],
            favorite: false,
            placement: { defaultMode: 'doodad' },
            collision: { preset: 'none' },
            slice: null
        }));
    },

    async renamePrefab(prefabId) {
        const prefab = DocsDoodads.Prefabs.get(prefabId);
        if (!prefab) return;
        const name = await DocsDoodads.Ui.prompt('A new name for this prefab:', prefab.name, { title: 'Rename prefab', ok: 'Rename', icon: 'box' });
        if (!name || !name.trim() || DocsDoodads.Prefabs.get(prefabId) !== prefab) return;
        prefab.name = name.trim();
        prefab.updatedAt = Date.now();
        DocsDoodads.Prefabs.save();
        this.selectedAsset = null;
        this.refreshDrawerCards();
        this.refreshInspector();
    },

    async deletePrefab(prefabId) {
        const prefab = DocsDoodads.Prefabs.get(prefabId);
        if (!prefab) return;
        const holders = DocsDoodads.Prefabs.containers(prefabId).filter(id => (DocsDoodads.Prefabs.get(id).children || []).some(c => c.id === prefabId));
        const inside = holders.length ? ` The ${holders.length} prefab${holders.length === 1 ? '' : 's'} holding it keep its doodads as their own.` : '';
        if (!(await DocsDoodads.Ui.confirm(`The prefab "${prefab.name}" will be deleted from the Item Bag. Copies already placed stay on their maps as plain doodads.${inside}`,
            { title: 'Delete prefab?', ok: 'Delete Prefab', danger: true }))) return;
        if (DocsDoodads.Prefabs.get(prefabId) !== prefab) return;
        const tw = window.$gameMap && $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
        const th = window.$gameMap && $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
        DocsDoodads.Prefabs.bakeChild(prefabId, { tileWidth: tw, tileHeight: th, applyProperty: (d, k, v) => this.applyDoodadProperty(d, k, v) });
        DocsDoodads.Prefabs.remove(prefabId);
        DocsDoodads.Prefabs.save();
        this.selectedAsset = null;
        this.refreshDrawerCards();
        this.refreshInspector();
    },

    placePrefabAtPlayer(prefabId) {
        if (!window.$gamePlayer || !window.$gameMap) return;
        this.placePrefab(DocsDoodads.Prefabs.get(prefabId), this.snapToTile({ tileX: $gamePlayer.x, tileY: $gamePlayer.y }));
    },

    prefabMenuItems(asset) {
        return [
            { label: 'Place at Player', icon: '📌', onClick: () => this.placePrefabAtPlayer(asset.prefabId) },
            { label: 'Rename...', icon: '✏️', onClick: () => this.renamePrefab(asset.prefabId) },
            { separator: true },
            { label: 'Delete Prefab', icon: '🗑️', danger: true, onClick: () => this.deletePrefab(asset.prefabId) }
        ];
    },

    renderPrefabInspector(content, a) {
        const prefab = DocsDoodads.Prefabs.get(a.prefabId);
        if (!prefab) {
            content.innerHTML = 'This prefab no longer exists.';
            return;
        }
        const P = DocsDoodads.Prefabs;
        const copiesOf = ids => Object.keys(window.$dataDocsDoodads || {}).reduce((n, key) => {
            const list = window.$dataDocsDoodads[key];
            if (!Array.isArray(list)) return n;
            return n + new Set(list.filter(d => d && d.prefabRef && ids.includes(d.prefabRef.id)).map(d => d.prefabRef.instance)).size;
        }, 0);
        const holders = P.containers(prefab.id);
        const copies = copiesOf([prefab.id]);
        const syncs = copiesOf([prefab.id].concat(holders));
        const names = ids => ids.map(id => P.get(id)).filter(Boolean).map(p => escapeHtml(p.name)).join(', ');
        const held = (prefab.children || []).map(c => c.id).filter((id, i, all) => all.indexOf(id) === i);
        content.innerHTML = `
            <div style="font-weight: bold; color: var(--dd-text); margin-bottom: 4px;">${escapeHtml(prefab.name)}</div>
            <div style="font-size: 11px; margin-bottom: 4px;">Prefab &middot; ${prefab.doodads.length} doodad(s), ${prefab.events.length} event(s)</div>
            ${held.length ? `<div style="font-size: 11px; margin-bottom: 4px;">Holds: ${names(held)}</div>` : ''}
            ${holders.length ? `<div style="font-size: 11px; margin-bottom: 4px;">Inside: ${names(holders)}</div>` : ''}
            <div style="font-size: 11px; margin-bottom: 8px;">Placed copies: <span style="color: var(--dd-accent);">${copies}</span>${syncs > copies ? ` (and ${syncs - copies} inside other prefabs)` : ''}</div>
            <div style="font-size: 11px; color: var(--dd-muted); line-height: 1.5; margin-bottom: 8px;">Drag onto the map, or use Stamp and click. Copies are grouped; select one and use "Update Prefab" to change the master, then "Sync All Copies". Settings you change on one copy stay its own. Save a selection holding a whole copy and the prefab goes inside the new one.</div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
                <button class="dd-btn dd-btn-primary" id="dd-prefab-place">Place at Player</button>
                <button class="dd-btn" id="dd-prefab-sync">Sync All Copies (${syncs})</button>
                <button class="dd-btn" id="dd-prefab-rename">Rename</button>
                <button class="dd-btn" id="dd-prefab-delete" style="background: var(--dd-danger-soft);">Delete Prefab</button>
            </div>`;
        document.getElementById('dd-prefab-place').onclick = () => this.placePrefabAtPlayer(prefab.id);
        document.getElementById('dd-prefab-sync').onclick = () => { this.syncPrefabInstances(prefab.id); this.refreshInspector(); };
        document.getElementById('dd-prefab-rename').onclick = () => this.renamePrefab(prefab.id);
        document.getElementById('dd-prefab-delete').onclick = () => this.deletePrefab(prefab.id);
    },

    // Prefab, copy/move-to-map and prefab-instance actions shown above the effect sections.
    renderSelectionTools(items) {
        const instance = items.length > 0 && items[0].prefabRef ? items[0] : null;
        const prefab = instance ? DocsDoodads.Prefabs.get(instance.prefabRef.id) : null;
        const mirror = items.find(d => d.mirrorOf);
        return `
            <div style="border-top: 1px solid var(--dd-line-soft); padding-top: 8px; margin-top: 8px;">
                ${mirror ? `<div style="font-size: 10px; color: var(--dd-warn); margin-bottom: 6px;">Mirrored from map ${escapeHtml(String(mirror.mirrorOf.mapId))}; it is replaced when that map mirrors its edges again.</div>` : ''}
                ${prefab ? `
                <div style="font-size: 10px; color: var(--dd-purple); margin-bottom: 4px;">Prefab copy: ${escapeHtml(prefab.name)}</div>
                ${this.ownSettingsHtml(items)}
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px; margin-bottom: 6px;">
                    <button class="dd-btn" id="dd-sel-prefab-update" title="Make the master prefab match this copy" style="padding: 4px;">Update Prefab</button>
                    <button class="dd-btn" id="dd-sel-prefab-sync" title="Rebuild every copy from the master" style="padding: 4px;">Sync Copies</button>
                    <button class="dd-btn" id="dd-sel-prefab-detach" title="Stop linking this copy to the prefab" style="padding: 4px;">Detach</button>
                </div>` : ''}
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px;">
                    <button class="dd-btn" id="dd-sel-save-prefab" style="padding: 4px;" title="Save the selection (and events under it) as a reusable prefab">Save Prefab</button>
                    <button class="dd-btn" id="dd-sel-copy-map" style="padding: 4px;">Copy to Map</button>
                    <button class="dd-btn" id="dd-sel-move-map" style="padding: 4px;">Move to Map</button>
                </div>
            </div>`;
    },

    bindSelectionTools(items) {
        const on = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };
        on('dd-sel-save-prefab', async () => {
            const events = this.eventsWithin(items);
            const values = await DocsDoodads.Ui.form({
                title: 'Save as prefab', text: 'The picked doodads become one item in the Item Bag that you can place again.', ok: 'Save Prefab', icon: 'box',
                fields: [{ key: 'name', label: 'Name', value: 'Prefab ' + (DocsDoodads.Prefabs.ensureLoaded().length + 1) }]
                    .concat(events.length ? [{ key: 'events', type: 'checkbox', value: true, label: `Also keep the ${events.length} event(s) under them` }] : [])
            });
            if (!values || !values.name.trim() || !this.mounted) return;
            this.savePrefabFromSelection(values.name.trim(), events.length === 0 || values.events);
        });
        on('dd-sel-copy-map', () => this.showMapPicker('Copy selection to map', mapId => this.sendDoodadsToMap(items, mapId, 'copy')));
        on('dd-sel-move-map', () => this.showMapPicker('Move selection to map', mapId => { this.sendDoodadsToMap(items, mapId, 'move'); this.refreshInspector(); }));
        on('dd-sel-prefab-update', () => this.updatePrefabFromInstance(items[0]));
        on('dd-sel-prefab-sync', () => { if (items[0].prefabRef) this.syncPrefabInstances(items[0].prefabRef.id); this.refreshInspector(); });
        on('dd-sel-prefab-detach', () => { this.detachPrefabInstance(items[0]); this.refreshInspector(); });
        this.ownSettingKeys(items).forEach((key, i) => on('dd-sel-own-' + i, () => { this.useMasterSetting(items, key); this.refreshInspector(); }));
    },

    // A prefab copy's own settings (changed in Details, kept when copies sync), each with a way back.
    ownSettingKeys(items) {
        const keys = [];
        for (const d of items || []) for (const k of (d && d.prefabRef && Array.isArray(d.prefabRef.own) ? d.prefabRef.own : [])) if (!keys.includes(k)) keys.push(k);
        return keys;
    },

    ownSettingsHtml(items) {
        const keys = this.ownSettingKeys(items);
        if (!keys.length) {
            return `<div style="font-size: 10px; color: var(--dd-faint); line-height: 1.4; margin-bottom: 6px;">Change a setting below and it becomes this copy's own (marked ●): Sync Copies keeps it.</div>`;
        }
        return `<div style="font-size: 10px; color: var(--dd-muted); margin-bottom: 3px;">This copy's own settings (kept when copies sync):</div>
            <div style="display: flex; flex-direction: column; gap: 2px; margin-bottom: 6px;">${keys.map((k, i) => `
                <div style="display: flex; align-items: center; gap: 6px; font-size: 11px;"><span style="flex: 1; min-width: 0;">● ${escapeHtml(this.settingLabel(k))}</span>
                <button class="dd-btn" id="dd-sel-own-${i}" type="button" style="padding: 2px 6px; font-size: 10px;" title="Go back to the prefab's value">Use Prefab's</button></div>`).join('')}</div>`;
    },

    // ---- Maps: switching, neighbours, picker ----
    mapEntries() {
        const infos = typeof window !== 'undefined' && window.$dataMapInfos ? window.$dataMapInfos : [];
        return infos.filter(Boolean).map(info => ({ id: info.id, name: info.name || `Map ${info.id}` }));
    },

    mapOptions(selected, includeNone) {
        const options = includeNone ? [`<option value="0">(none)</option>`] : [];
        for (const map of this.mapEntries()) {
            options.push(`<option value="${map.id}" ${Number(selected) === map.id ? 'selected' : ''}>${String(map.id).padStart(3, '0')}: ${escapeHtml(map.name)}</option>`);
        }
        return options.join('');
    },

    showMapPicker(title, onPick) {
        const existing = document.getElementById('dd-map-picker');
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
        const modal = document.createElement('div');
        modal.id = 'dd-map-picker';
        modal.className = 'dd-glass';
        modal.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 340px; padding: 18px; z-index: 10030;';
        modal.innerHTML = `
            <div style="font-weight: bold; color: var(--dd-accent); font-size: 13px; margin-bottom: 10px;">${escapeHtml(title)}</div>
            <select id="dd-map-picker-select" style="width: 100%; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line); padding: 4px; margin-bottom: 12px;">${this.mapOptions(0, false)}</select>
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
                <button class="dd-btn" id="dd-map-picker-cancel">Cancel</button>
                <button class="dd-btn dd-btn-primary" id="dd-map-picker-ok">OK</button>
            </div>`;
        document.body.appendChild(modal);
        const close = () => modal.parentNode && modal.parentNode.removeChild(modal);
        document.getElementById('dd-map-picker-cancel').onclick = close;
        document.getElementById('dd-map-picker-ok').onclick = () => {
            const mapId = parseInt(document.getElementById('dd-map-picker-select').value, 10);
            close();
            if (mapId) onPick(mapId);
        };
    },

    renderMapNavigation() {
        const neighbors = this.mapNeighbors();
        const side = (name, label) => `<div>${label}<select id="dd-map-nb-${name}" style="width: 100%; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line); padding: 2px;">${this.mapOptions(neighbors[name] || 0, true)}</select></div>`;
        return `
            <details style="border-top: 1px solid var(--dd-line-soft); padding-top: 6px; margin-top: 6px;">
                <summary style="cursor: pointer; font-size: 11px; font-weight: bold; color: var(--dd-muted);">Maps</summary>
                <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 6px; font-size: 10px; color: var(--dd-muted);">
                    <div>Go to map (keeps the editor open):
                        <select id="dd-map-goto" style="width: 100%; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line); padding: 2px;">${this.mapOptions(this.currentMapId(), false)}</select>
                        <button class="dd-btn" id="dd-map-goto-btn" style="width: 100%; margin-top: 4px;">Go to Map</button></div>
                    <div style="margin-top: 4px; color: var(--dd-text);">Neighbouring maps (for doodads that cross the edge):</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">${side('north', 'North')}${side('south', 'South')}${side('west', 'West')}${side('east', 'East')}</div>
                    <button class="dd-btn" id="dd-map-mirror" title="Copy doodads hanging over an edge onto the neighbouring map">Mirror Edge Doodads</button>
                    <button class="dd-btn" id="dd-map-world" title="See this map and its linked neighbours together">World View</button>
                </div>
            </details>`;
    },

    bindMapNavigation() {
        const go = document.getElementById('dd-map-goto-btn');
        if (go) go.onclick = () => this.goToMap(parseInt(document.getElementById('dd-map-goto').value, 10));
        for (const name of DocsDoodads.MapLinks.sides) {
            const select = document.getElementById(`dd-map-nb-${name}`);
            if (!select) continue;
            select.onchange = () => {
                const next = {};
                for (const s of DocsDoodads.MapLinks.sides) {
                    const el = document.getElementById(`dd-map-nb-${s}`);
                    next[s] = el ? parseInt(el.value, 10) || 0 : 0;
                }
                this.setMapNeighbors(next);
            };
        }
        const mirror = document.getElementById('dd-map-mirror');
        if (mirror) mirror.onclick = () => this.mirrorEdgeDoodads();
        const world = document.getElementById('dd-map-world');
        if (world) world.onclick = () => this.showWorldView();
    },

    // A scaled overview of this map and its linked neighbours with their doodads; click a map to go there.
    showWorldView() {
        const existing = document.getElementById('dd-world-view');
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
        const current = this.currentMapId();
        const layout = DocsDoodads.MapLinks.layout(current, id => this.mapNeighbors(id), id => this.mapSizeLookup(id), 2);
        if (layout.length === 0) return;
        const names = {};
        for (const m of this.mapEntries()) names[m.id] = m.name;
        const b = DocsDoodads.MapLinks.bounds(layout);
        const width = 720, height = 480;
        const scale = Math.min((width - 20) / (b.right - b.left), (height - 20) / (b.bottom - b.top));
        const toX = x => 10 + (x - b.left) * scale, toY = y => 10 + (y - b.top) * scale;

        const modal = document.createElement('div');
        modal.id = 'dd-world-view';
        modal.className = 'dd-glass';
        modal.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); padding: 16px; z-index: 10030;';
        modal.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div class="dd-pop-title" style="margin-bottom: 0;">${DocsDoodads.Ui.icon('map', 1)} World View</div>
                <button class="dd-btn" id="dd-world-close">Close</button>
            </div>
            <canvas id="dd-world-canvas" width="${width}" height="${height}" style="background: var(--dd-field); border: 1px solid var(--dd-line); border-radius: 4px; cursor: pointer;"></canvas>
            <div style="font-size: 10px; color: var(--dd-muted); margin-top: 6px;">${layout.length === 1 ? 'No neighbouring maps are linked yet; set them in Maps.' : 'Click a map to go there. Orange doodads cross an edge.'}</div>`;
        document.body.appendChild(modal);
        const canvas = document.getElementById('dd-world-canvas');
        const ctx = canvas.getContext('2d');
        for (const m of layout) {
            ctx.fillStyle = m.mapId === current ? '#1e3a5f' : '#16213a';
            ctx.fillRect(toX(m.x), toY(m.y), m.w * scale, m.h * scale);
            ctx.strokeStyle = m.mapId === current ? '#38bdf8' : '#475569';
            ctx.lineWidth = m.mapId === current ? 2 : 1;
            ctx.strokeRect(toX(m.x), toY(m.y), m.w * scale, m.h * scale);
            for (const d of DocsDoodads.doodads(m.mapId)) {
                if (!d || d.posMode === 0) continue;
                const r = DocsDoodads.Guides.rectOf(d);
                const crosses = r.left < 0 || r.top < 0 || r.right > m.w || r.bottom > m.h;
                ctx.fillStyle = d.mirrorOf ? 'rgba(148,163,184,0.6)' : crosses ? '#f59e0b' : '#22c55e';
                ctx.fillRect(toX(m.x + r.left), toY(m.y + r.top), Math.max(1.5, (r.right - r.left) * scale), Math.max(1.5, (r.bottom - r.top) * scale));
            }
            ctx.fillStyle = '#e2e8f0';
            ctx.font = '11px sans-serif';
            ctx.fillText(`${String(m.mapId).padStart(3, '0')} ${names[m.mapId] || ''}`, toX(m.x) + 4, toY(m.y) + 13);
        }
        const close = () => modal.parentNode && modal.parentNode.removeChild(modal);
        document.getElementById('dd-world-close').onclick = close;
        canvas.onclick = (e) => {
            const rect = canvas.getBoundingClientRect();
            const wx = (e.clientX - rect.left - 10) / scale + b.left, wy = (e.clientY - rect.top - 10) / scale + b.top;
            const hit = layout.find(m => wx >= m.x && wx <= m.x + m.w && wy >= m.y && wy <= m.y + m.h);
            if (hit && hit.mapId !== current) {
                close();
                this.goToMap(hit.mapId);
            }
        };
    },

    // Transfers the player; the workspace stays open and picks the new map up in onMapLoaded.
    goToMap(mapId) {
        if (!mapId || !window.$gamePlayer || !window.$gameMap || mapId === this.currentMapId()) return;
        const size = this.mapSizeLookup(mapId);
        const tw = $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
        const th = $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
        const cols = size ? Math.max(1, Math.floor(size.w / tw)) : 1;
        const rows = size ? Math.max(1, Math.floor(size.h / th)) : 1;
        const x = Math.min(cols - 1, Math.max(0, $gamePlayer.x));
        const y = Math.min(rows - 1, Math.max(0, $gamePlayer.y));
        this.selectedDoodad = null;
        this.selectedDoodads = [];
        this.selectedEvent = null;
        $gamePlayer.reserveTransfer(mapId, x, y, $gamePlayer.direction(), 2);
        this.showToast(`Going to map ${mapId}...`);
    },

    // After a map change: this map's steps are back (or were let go because MZ changed the map).
    reportStepsBack() {
        const back = DocsDoodads.Persistence._stepsBack;
        DocsDoodads.Persistence._stepsBack = null;
        this.updateUndoButtons();
        if (this._undoHistoryOpen) this.renderUndoHistory();
        if (!back) return;
        if (back.dropped) this.showToast('This map changed in MZ, so its earlier steps can no longer be undone.', 'info');
        else if (back.steps > 0) this.showToast(`${back.steps} step${back.steps === 1 ? '' : 's'} on this map can be undone again.`, 'info');
    },

    onMapLoaded() {
        if (!this.mounted) return;
        this.updateCollisionLegend();
        this.applyStagedRegions();
        this.reportStepsBack();
        this.rememberMap(this.currentMapId());
        this.finishPendingGoTo();
        if (this._problemsOpen) this.renderProblems();
        const persistence = DocsDoodads.Persistence;
        if (!persistence.sessionSnapshots[persistence.mapFilePath(this.currentMapId())]) persistence.captureSession();
        this.pathPoints = [];
        // The save-history panel compares against the map it was opened on.
        this._historyDiff = null;
        if (this._historyPanel && this._historyPanel.parentNode) this._historyPanel.parentNode.removeChild(this._historyPanel);
        this._historyPanel = null;
        this.refreshInspector();
        DocsDoodads.Ui.setHint(DocsDoodads.Ui.hints[this.placementTool || 'none'] || DocsDoodads.Ui.hints.none);
    },

    // ---- Where-used, unused report, safe rename/move ----
    databaseFiles: ['Actors', 'Enemies', 'Tilesets', 'System', 'CommonEvents', 'Troops'],

    // Fresh copies of everything that can reference a file: map and database files from disk,
    // doodads and prefabs from memory (cloned, so planning a rename never touches live data).
    loadUsageSources() {
        const FS = DocsDoodads.FS;
        const mapInfos = FS.readJson('data/MapInfos.json') || (window.$dataMapInfos || []);
        const maps = {};
        for (const info of mapInfos) {
            if (!info) continue;
            const map = FS.readJson(DocsDoodads.Persistence.mapFilePath(info.id));
            if (map) maps[info.id] = map;
        }
        const database = {};
        for (const name of this.databaseFiles) database[name] = FS.readJson(`data/${name}.json`);
        return {
            mapInfos,
            maps,
            database,
            doodads: JSON.parse(JSON.stringify(window.$dataDocsDoodads || {})),
            prefabs: JSON.parse(JSON.stringify(DocsDoodads.Prefabs.ensureLoaded()))
        };
    },

    refreshUsageIndex() {
        DocsDoodads.Usage.lastIndex = DocsDoodads.Usage.buildIndex(this.loadUsageSources());
        return DocsDoodads.Usage.lastIndex;
    },

    assetUsage(asset) {
        const index = DocsDoodads.Usage.lastIndex || this.refreshUsageIndex();
        return index.get(DocsDoodads.Usage.keyOf(asset.path)) || [];
    },

    // Files that move with an image or sound: atlas metadata, and the other audio format.
    companionFiles(oldPath, newPath) {
        const FS = DocsDoodads.FS;
        const out = [];
        const oldBase = oldPath.replace(/\.[^/.]+$/, ''), newBase = newPath.replace(/\.[^/.]+$/, '');
        const ext = (FS.path.extname(oldPath) || '').toLowerCase();
        const extras = ext === '.ogg' ? ['.m4a'] : ext === '.m4a' ? ['.ogg'] : ['.json'];
        for (const extra of extras) {
            if (FS.existsSync(oldBase + extra)) out.push({ from: oldBase + extra, to: newBase + extra });
        }
        return out;
    },

    // Renames or moves a file and rewrites every reference to it in one transaction. Name
    // references (events, database) only allow renames inside the same folder.
    renameAsset(asset, newPath) {
        const FS = DocsDoodads.FS;
        const persistence = DocsDoodads.Persistence;
        const fail = error => ({ ok: false, error });
        if (!FS.fs || !asset) return fail('Files cannot be renamed here.');
        if (persistence.dirtyDoodads || persistence.dirtyMap || Object.keys(persistence.stagedMaps).length > 0) {
            return fail('Save your changes first, then rename.');
        }
        const oldPath = String(asset.path).replace(/\\/g, '/');
        newPath = String(newPath || '').trim().replace(/\\/g, '/').replace(/^\.\//, '');
        if (!newPath || newPath === oldPath) return fail('Enter a new name or folder.');
        if (!/^(img|audio)\//i.test(newPath) || newPath.split('/').includes('..') || /[<>:"|?*\x00-\x1f]/.test(newPath)) {
            return fail('The new path must stay inside img/ or audio/ and use normal file name characters.');
        }
        if (FS.path.extname(newPath).toLowerCase() !== FS.path.extname(oldPath).toLowerCase()) return fail('Keep the same file extension.');
        if (FS.existsSync(newPath) && newPath.toLowerCase() !== oldPath.toLowerCase()) return fail(`${newPath} already exists.`);

        const sources = this.loadUsageSources();
        const plan = DocsDoodads.Usage.rewrite(sources, oldPath, newPath);
        if (!plan.ok) {
            const where = plan.blocked.slice(0, 3).map(r => r.label).join('; ');
            return fail(`It is referenced by name in ${plan.blocked.length} place(s) (${where}), so it can only be renamed inside ${plan.blocked[0].folder}/.`);
        }

        const entries = [];
        for (const source of plan.changed) {
            if (source.startsWith('map:')) {
                const id = source.slice(4);
                entries.push({ path: persistence.mapFilePath(id), data: sources.maps[id], indent: 2 });
            } else if (source.startsWith('database:')) {
                const name = source.slice(9);
                entries.push({ path: `data/${name}.json`, data: sources.database[name], indent: 0 });
            } else if (source === 'doodads') {
                entries.push(...DocsDoodads.DataFiles.entriesFor(sources.doodads));
            } else if (source === 'prefabs') {
                entries.push({ path: DocsDoodads.Prefabs.filePath, data: { version: 1, prefabs: sources.prefabs }, indent: 2 });
            }
        }
        // The library entry keeps its tags, favourite, slices and collision under the new id.
        const library = JSON.parse(JSON.stringify(DocsDoodads.AssetIndex.data));
        const oldId = oldPath.toLowerCase(), newId = newPath.toLowerCase();
        const entry = library.assets[oldId] || JSON.parse(JSON.stringify(asset));
        delete library.assets[oldId];
        entry.id = newId;
        entry.path = newPath;
        entry.fileName = newPath.split('/').pop();
        entry.category = DocsDoodads.AssetIndex.detectCategory(newPath);
        library.assets[newId] = entry;
        for (const members of Object.values(library.collections || {})) {
            if (Array.isArray(members)) members.forEach((id, i) => { if (id === oldId) members[i] = newId; });
        }
        entries.push({ path: DocsDoodads.AssetIndex.libraryPath, data: library, indent: 2 });

        // Move the files first: undoing a rename is easy, undoing half-written data is not.
        const moves = [{ from: oldPath, to: newPath }].concat(this.companionFiles(oldPath, newPath));
        const done = [];
        const undoMoves = () => { for (const m of done.reverse()) { try { FS.fs.renameSync(m.to, m.from); } catch (e) {} } };
        try {
            for (const m of moves) {
                FS.mkdirp(FS.path.dirname(m.to));
                FS.fs.renameSync(m.from, m.to);
                done.push(m);
            }
        } catch (error) {
            undoMoves();
            return fail(`Could not move the file: ${error.message || error}`);
        }
        try {
            for (const e of entries) FS.createTimestampedBackup(e.path);
        } catch (error) {
            undoMoves();
            return fail(`Backup failed, nothing was changed: ${error.message || error}`);
        }
        const written = FS.atomicWriteManyJson(entries);
        if (!written.ok) {
            undoMoves();
            return fail(`Could not update the project files (${written.error}); the file was moved back.`);
        }

        // Bring the live game data in line with what is now on disk.
        DocsDoodads.Usage.rewrite({ doodads: window.$dataDocsDoodads || {}, prefabs: DocsDoodads.Prefabs.ensureLoaded() }, oldPath, newPath);
        const mapId = this.currentMapId();
        if (window.$dataMap && plan.changed.includes(`map:${mapId}`)) {
            DocsDoodads.Usage.rewrite({ maps: { [mapId]: window.$dataMap } }, oldPath, newPath);
        }
        for (const name of this.databaseFiles) {
            const live = window['$data' + name];
            if (live && plan.changed.includes(`database:${name}`)) DocsDoodads.Usage.rewrite({ database: { [name]: live } }, oldPath, newPath);
        }
        for (const e of entries) if (/data\/Map\d+\.json$/.test(e.path)) persistence.sessionSnapshots[e.path] = FS.stat(e.path);
        DocsDoodads.AssetIndex.data = library;
        DocsDoodads.AssetIndex.rebuildList();
        DocsDoodads.Thumbnail.invalidate(oldId);
        DocsDoodads.Usage.lastIndex = null;
        if (this.selectedAsset === asset) this.selectedAsset = library.assets[newId];
        this.refreshSpriteset();
        this.refreshDrawerCards();
        this.refreshInspector();
        const changedFiles = entries.map(e => e.path);
        this.showToast(`Renamed to ${entry.fileName}; updated ${plan.count} reference(s) in ${changedFiles.length - 1} file(s).`, 3500);
        return { ok: true, changedFiles, references: plan.count };
    },

    // ---- Fingerprints: duplicates and "more like this" ----
    async computeFingerprints(options = {}) {
        const assets = DocsDoodads.AssetIndex.list.filter(a => a.category !== 'Audio' && /\.(png|jpe?g|webp)$/i.test(a.path || ''));
        const todo = assets.filter(a => !a.fingerprint || a.fingerprint.mtimeMs !== a.mtimeMs);
        const crypto = typeof require !== 'undefined' ? require('crypto') : null;
        let done = 0;
        for (const asset of todo) {
            if (options.token && options.token.cancelled) break;
            try {
                const px = await this.loadPixels(DocsDoodads.LiveReload.urlFor(asset.path));
                const sha1 = crypto && DocsDoodads.FS.fs ? crypto.createHash('sha1').update(DocsDoodads.FS.fs.readFileSync(asset.path)).digest('hex') : null;
                asset.fingerprint = { hash: DocsDoodads.Similarity.hashPixels(px.data, px.width, px.height), sha1, mtimeMs: asset.mtimeMs };
            } catch (error) {
                asset.fingerprint = { hash: null, sha1: null, mtimeMs: asset.mtimeMs };
            }
            done++;
            if (options.onProgress && (done % 10 === 0 || done === todo.length)) options.onProgress(done, todo.length);
            if (done % 20 === 0) await new Promise(resolve => setTimeout(resolve, 0));
        }
        if (todo.length > 0) DocsDoodads.AssetIndex.save();
        return assets;
    },

    fingerprintEntries() {
        return DocsDoodads.AssetIndex.list.filter(a => a.fingerprint && a.fingerprint.hash)
            .map(a => ({ id: a.id, hash: a.fingerprint.hash, sha1: a.fingerprint.sha1, asset: a }));
    },

    async showSimilarTo(asset) {
        const status = document.getElementById('dd-status-right');
        await this.computeFingerprints({ onProgress: (n, total) => { if (status) status.textContent = `Fingerprinting ${n}/${total}`; } });
        this.updateIndexStatus();
        const target = DocsDoodads.AssetIndex.data.assets[asset.id];
        if (!target || !target.fingerprint || !target.fingerprint.hash) {
            this.showToast('This image could not be read.');
            return;
        }
        const results = DocsDoodads.Similarity.similarTo(target.fingerprint.hash, this.fingerprintEntries(), 60);
        this.similarResults = results.map(r => r.entry.asset);
        this.similarSource = asset.fileName;
        this.setCategory('Similar');
        this.showToast(`Showing images most like ${asset.fileName}.`);
    },

    setCategory(category) {
        this.currentCategory = category;
        if (category === 'Similar') {
            this.searchQuery = '';
            const input = document.getElementById('dd-search-input');
            if (input) input.value = '';
        }
        const tabs = document.getElementById('dd-category-tabs');
        if (tabs && tabs.querySelectorAll) tabs.querySelectorAll('button').forEach(b => { b.className = 'dd-btn' + (b.dataset && b.dataset.cat === category ? ' dd-btn-primary' : ''); });
        if (this.isFolded && this.isFolded('drawer')) this.foldPanel('drawer', false);
        this.refreshDrawerCards();
    },

    // ---- Per-map art packing ----
    async packCurrentMap() {
        const FS = DocsDoodads.FS;
        const Packer = DocsDoodads.Packer;
        const mapId = this.currentMapId();
        const regions = Packer.regionsFor(DocsDoodads.doodads(mapId));
        if (regions.length === 0) {
            this.showToast('This map has no image doodads to pack.');
            return null;
        }
        const packed = Packer.pack(regions.map(r => ({ key: r.key, w: r.rect.w, h: r.rect.h })), { maxSize: 2048, padding: 2 });
        const images = {};
        const paths = [...new Set(regions.map(r => r.path))];
        // Loading the pictures is the slow part: a pill counts them, and Cancel stops before anything is written.
        const pill = DocsDoodads.Ui.progress('Packing map art', { delay: 300, onCancel: () => {} });
        try {
            for (const p of paths) {
                if (pill.cancelled) break;
                pill.update(Object.keys(images).length, paths.length);
                images[p] = await new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => resolve(img);
                    img.onerror = () => reject(new Error(`Could not load ${p}`));
                    img.src = DocsDoodads.LiveReload.urlFor(p);
                });
            }
        } finally {
            pill.finish();
        }
        if (pill.cancelled) {
            this.showToast('Packing cancelled; nothing was written.', 'info');
            return null;
        }
        const clipped = Packer.clampRegions(regions, p => (images[p] ? { w: images[p].naturalWidth, h: images[p].naturalHeight } : null));
        regions.splice(0, regions.length, ...clipped);
        packed.sheets.length = 0;
        Object.assign(packed, Packer.pack(regions.map(r => ({ key: r.key, w: r.rect.w, h: r.rect.h })), { maxSize: 2048, padding: 2 }));
        this.removePack(mapId, true);
        FS.mkdirp(Packer.sheetDirectory);
        const byKey = new Map(regions.map(r => [r.key, r]));
        const mtimes = {};
        for (const r of regions) { const st = FS.stat(r.path); mtimes[r.path] = st ? st.mtimeMs : 0; }
        const manifest = Packer.buildManifest(mapId, regions, packed, mtimes);
        packed.sheets.forEach((sheet, i) => {
            const canvas = document.createElement('canvas');
            canvas.width = sheet.w;
            canvas.height = sheet.h;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            for (const item of sheet.items) {
                const r = byKey.get(item.key);
                ctx.drawImage(images[r.path], r.rect.x, r.rect.y, r.rect.w, r.rect.h, item.x, item.y, item.w, item.h);
            }
            const base64 = canvas.toDataURL('image/png').split(',')[1];
            FS.fs.writeFileSync(manifest.sheets[i], Buffer.from(base64, 'base64'));
        });
        Packer.data.maps[mapId] = manifest;
        FS.atomicWriteJson(Packer.manifestPath, Packer.data);
        // Browser builds can't check for the manifest file, so the doodads file records that packing is in use.
        if (!window.$dataDocsDoodads.usesPacking) {
            window.$dataDocsDoodads.usesPacking = true;
            DocsDoodads.Persistence.dirtyDoodads = true;
        }
        const skipped = packed.skipped.length ? `; ${packed.skipped.length} image(s) too large stay separate` : '';
        this.showToast(`Packed ${Object.keys(manifest.frames).length} image region(s) into ${manifest.sheets.length} sheet(s)${skipped}.`, 3500);
        this.refreshInspector();
        return manifest;
    },

    removePack(mapId = this.currentMapId(), quiet = false) {
        const FS = DocsDoodads.FS;
        const manifest = DocsDoodads.Packer.forMap(mapId);
        if (!manifest) return false;
        for (const sheet of manifest.sheets) { try { if (FS.existsSync(sheet)) FS.fs.unlinkSync(sheet); } catch (e) {} }
        delete DocsDoodads.Packer.data.maps[mapId];
        FS.atomicWriteJson(DocsDoodads.Packer.manifestPath, DocsDoodads.Packer.data);
        if (!quiet) {
            this.showToast('Removed packed art for this map.');
            this.refreshInspector();
        }
        return true;
    },

    renderPackingPanel() {
        const manifest = DocsDoodads.Packer.forMap(this.currentMapId());
        const stale = manifest ? DocsDoodads.Packer.staleSources(manifest, p => { const st = DocsDoodads.FS.stat(p); return st ? st.mtimeMs : 0; }) : [];
        const status = manifest
            ? `${Object.keys(manifest.frames).length} region(s) in ${manifest.sheets.length} sheet(s), built ${new Date(manifest.builtAt).toLocaleString()}.`
            : 'Not packed. Deployed games load each image separately.';
        return `
            <details style="border-top: 1px solid var(--dd-line-soft); padding-top: 6px; margin-top: 6px;">
                <summary style="cursor: pointer; font-size: 11px; font-weight: bold; color: var(--dd-muted);">Performance</summary>
                <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 6px; font-size: 10px; color: var(--dd-muted);">
                    <div>${escapeHtml(status)}</div>
                    ${stale.length ? `<div style="color: var(--dd-warn);">Out of date: ${escapeHtml(stale.slice(0, 3).join(', '))} changed. Pack again.</div>` : ''}
                    <div style="color: var(--dd-faint); line-height: 1.4;">Packing copies the art this map's doodads use into a few sheets in img/doodads/_packed for the deployed game. Playtests keep using the original files.</div>
                    <button class="dd-btn" id="dd-pack-map">${manifest ? 'Pack Again' : 'Pack Map Art'}</button>
                    ${manifest ? '<button class="dd-btn" id="dd-pack-remove">Remove Packed Art</button>' : ''}
                    <label style="display: flex; align-items: center; gap: 6px; color: var(--dd-text);"><input type="checkbox" id="dd-pack-preview" ${DocsDoodads.Packer.previewInTest ? 'checked' : ''} /> Use packed art in this playtest</label>
                </div>
            </details>`;
    },

    bindPackingPanel() {
        const pack = document.getElementById('dd-pack-map');
        if (pack) pack.onclick = () => this.packCurrentMap().catch(error => this.showToast(`Packing failed: ${error.message || error}`));
        const remove = document.getElementById('dd-pack-remove');
        if (remove) remove.onclick = () => this.removePack();
        const preview = document.getElementById('dd-pack-preview');
        if (preview) preview.onchange = (e) => { DocsDoodads.Packer.previewInTest = Boolean(e.target.checked); this.refreshSpriteset(); };
    },

    // ---- Asset Tools: duplicates and unused files ----
    showAssetTools() {
        const existing = document.getElementById('dd-asset-tools');
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
        const modal = document.createElement('div');
        modal.id = 'dd-asset-tools';
        modal.className = 'dd-glass';
        modal.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 560px; max-height: 80vh; padding: 18px; z-index: 10030; display: flex; flex-direction: column; gap: 10px;';
        modal.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div class="dd-pop-title" style="margin-bottom: 0;">${DocsDoodads.Ui.icon('wrench', 1)} File Check</div>
                <button class="dd-btn" id="dd-tools-close">Close</button>
            </div>
            <div style="display: flex; gap: 8px;">
                <button class="dd-btn dd-btn-primary" id="dd-tools-dupes" style="flex: 1;">Find Duplicates</button>
                <button class="dd-btn dd-btn-primary" id="dd-tools-unused" style="flex: 1;">Find Unused Files</button>
            </div>
            <div id="dd-tools-status" style="font-size: 11px; color: var(--dd-muted);">Duplicates compares every image's fingerprint (computed once, then cached). Unused checks maps, events, the database, doodads and prefabs.</div>
            <div id="dd-tools-results" style="overflow-y: auto; font-size: 11px; color: var(--dd-text); display: flex; flex-direction: column; gap: 8px;"></div>`;
        document.body.appendChild(modal);
        const statusEl = document.getElementById('dd-tools-status');
        const resultsEl = document.getElementById('dd-tools-results');
        const row = a => `<div style="display: flex; justify-content: space-between; gap: 8px;"><span>${escapeHtml(a.path)}</span><button class="dd-btn dd-tools-show" data-id="${escapeHtml(a.id)}" style="padding: 1px 6px; font-size: 10px;">Show</button></div>`;
        const bindShow = () => {
            resultsEl.querySelectorAll('.dd-tools-show').forEach(btn => {
                btn.onclick = () => {
                    const asset = DocsDoodads.AssetIndex.data.assets[btn.dataset.id];
                    if (asset) this.selectAsset(asset);
                };
            });
        };
        document.getElementById('dd-tools-close').onclick = () => modal.parentNode && modal.parentNode.removeChild(modal);
        document.getElementById('dd-tools-dupes').onclick = async () => {
            resultsEl.innerHTML = '';
            await this.computeFingerprints({ onProgress: (n, total) => { statusEl.textContent = `Fingerprinting images ${n}/${total}...`; } });
            const entries = this.fingerprintEntries();
            const exact = new Map();
            for (const e of entries) if (e.sha1) { if (!exact.has(e.sha1)) exact.set(e.sha1, []); exact.get(e.sha1).push(e); }
            const exactGroups = [...exact.values()].filter(g => g.length > 1);
            const exactIds = new Set(exactGroups.flat().map(e => e.id));
            const nearGroups = DocsDoodads.Similarity.findDuplicates(entries.filter(e => !exactIds.has(e.id)), 1);
            statusEl.textContent = `${exactGroups.length} group(s) of identical files, ${nearGroups.length} group(s) of near-identical images (from ${entries.length} images).`;
            resultsEl.innerHTML = exactGroups.map(g => `<div style="border: 1px solid var(--dd-line); border-radius: 4px; padding: 6px;"><div style="color: var(--dd-danger-dark); margin-bottom: 4px;">Identical files</div>${g.map(e => row(e.asset)).join('')}</div>`).join('') +
                nearGroups.map(g => `<div style="border: 1px solid var(--dd-line); border-radius: 4px; padding: 6px;"><div style="color: var(--dd-warn); margin-bottom: 4px;">Near-identical (resized or re-saved)</div>${g.map(e => row(e.asset)).join('')}</div>`).join('');
            bindShow();
        };
        document.getElementById('dd-tools-unused').onclick = () => {
            statusEl.textContent = 'Checking maps, events, database, doodads and prefabs...';
            const index = this.refreshUsageIndex();
            const unused = DocsDoodads.Usage.unusedAssets(DocsDoodads.AssetIndex.list, index);
            statusEl.textContent = `${unused.length} file(s) are not referenced anywhere the editor can see. Plugins and scripts can also load files by name, so check before deleting. Search "used:no" lists them in the Item Bag.`;
            resultsEl.innerHTML = unused.slice(0, 500).map(row).join('') + (unused.length > 500 ? `<div>...and ${unused.length - 500} more.</div>` : '');
            bindShow();
        };
    },

    renderUsagePanel(a) {
        return `
            <div style="border-top: 1px solid var(--dd-line-soft); padding-top: 8px; margin-top: 8px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px;">
                    <button class="dd-btn" id="dd-asset-usage" style="padding: 4px;" title="List every map, event, database entry, doodad and prefab using this file">Where Used</button>
                    <button class="dd-btn" id="dd-asset-rename" style="padding: 4px;" title="Rename or move the file and update every reference">Rename/Move</button>
                    <button class="dd-btn" id="dd-asset-similar" style="padding: 4px;" title="Show the images that look most like this one">More Like This</button>
                </div>
                <div id="dd-asset-usage-list" style="font-size: 10px; color: var(--dd-muted); margin-top: 6px; line-height: 1.5;"></div>
            </div>`;
    },

    bindUsagePanel(a) {
        const list = document.getElementById('dd-asset-usage-list');
        document.getElementById('dd-asset-usage').onclick = () => {
            const refs = this.assetUsage(a);
            list.innerHTML = refs.length === 0
                ? 'Not used by any map, event, database entry, doodad or prefab.'
                : `<div style="color: var(--dd-text);">Used in ${refs.length} place(s):</div>` + refs.slice(0, 40).map(r => `<div>• ${escapeHtml(r.label)}</div>`).join('') + (refs.length > 40 ? `<div>...and ${refs.length - 40} more</div>` : '');
        };
        document.getElementById('dd-asset-rename').onclick = async () => {
            const U = DocsDoodads.Ui;
            const target = await U.prompt('A new name or folder for this file. Pictures the engine uses (characters, tilesets...) must stay in their folder.', a.path,
                { title: 'Rename or move', ok: 'Next', icon: 'folder' });
            if (!target || target.trim() === a.path) return;
            const refs = this.assetUsage(a);
            if (!(await U.confirm(`${a.path} becomes ${target.trim()}, and ${refs.length} place(s) that use it are updated. Changed files are backed up first. If this project is open in RPG Maker MZ, reload it there afterwards.`,
                { title: 'Rename this file?', ok: 'Rename' }))) return;
            const result = this.renameAsset(a, target.trim());
            if (!result.ok) this.showToast(result.error, 'error');
        };
        document.getElementById('dd-asset-similar').onclick = () => this.showSimilarTo(a);
    },

    updateIndexStatus(removed) {
        const status = document.getElementById('dd-status-right');
        if (!status) return;
        const count = DocsDoodads.AssetIndex.list.length;
        status.textContent = removed ? `Indexed ${count} assets | ${removed} stale removed` : `Indexed ${count} assets`;
    },

    renderAudioInspector(content, a) {
        const channel = /\/bgm\//i.test(a.path) ? 'BGM' : /\/bgs\//i.test(a.path) ? 'BGS' : /\/me\//i.test(a.path) ? 'ME' : 'SE';
        content.innerHTML = `
            <div style="font-weight: bold; color: var(--dd-text); margin-bottom: 4px;">${escapeHtml(a.fileName)}</div>
            <div style="font-size: 11px; margin-bottom: 4px;">Category: <span style="color: var(--dd-accent);">Audio</span> &middot; Channel: <span style="color: var(--dd-accent);">${channel}</span></div>
            <div style="display: flex; gap: 6px; margin: 8px 0;">
                <button class="dd-btn dd-btn-primary" id="dd-audio-preview-btn" style="flex: 1;">&#9654; Preview</button>
                <button class="dd-btn" id="dd-audio-stop-btn" style="flex: 1;">&#9632; Stop</button>
            </div>
            <div style="display: flex; gap: 6px; margin: 8px 0;">
                <button class="dd-btn" id="dd-fav-toggle" style="flex: 1;">${a.favorite ? '★ Favorited' : '☆ Favorite'}</button>
            </div>
            <div style="margin-bottom: 8px;">
                <label style="display: block; font-size: 11px; margin-bottom: 3px;">Tags (comma separated):</label>
                <input type="text" id="dd-asset-tags" value="${escapeHtml((a.tags || []).join(', '))}" placeholder="e.g. ambient, door" style="width: 100%; box-sizing: border-box; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line); padding: 4px; border-radius: 4px;" />
                <div style="font-size: 10px; color: var(--dd-faint); margin-top: 3px;">Auto: ${escapeHtml((a.autoTags || []).join(', '))}</div>
            </div>
            <div style="font-size: 11px; color: var(--dd-muted); line-height: 1.5;">
                Drag onto an empty tile to create a sound event, or onto an existing event to add a play command to it.
            </div>
            ${this.renderUsagePanel(a)}
        `;
        this.bindUsagePanel(a);
        document.getElementById('dd-asset-similar').style.display = 'none';
        document.getElementById('dd-audio-preview-btn').onclick = () => {
            DocsDoodads.Audio.playPreview(a);
            const stopAll = document.getElementById('dd-stop-audio-btn');
            if (stopAll) stopAll.style.display = '';
        };
        document.getElementById('dd-audio-stop-btn').onclick = () => {
            DocsDoodads.Audio.stopPreview();
            const stopAll = document.getElementById('dd-stop-audio-btn');
            if (stopAll) stopAll.style.display = 'none';
        };
        document.getElementById('dd-fav-toggle').onclick = () => {
            DocsDoodads.AssetIndex.toggleFavorite(a.id);
            this.refreshInspector();
            this.refreshDrawerCards();
        };
        const tagInput = document.getElementById('dd-asset-tags');
        tagInput.onchange = (e) => {
            DocsDoodads.AssetIndex.setTags(a.id, e.target.value);
            tagInput.value = (a.tags || []).join(', ');
        };
    },

    placeAssetOnMapCenter(asset) {
        if (!window.$gameMap || !window.$gamePlayer) return;
        const tw = $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
        const th = $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
        const mapX = $gamePlayer.x * tw + tw / 2;
        const mapY = $gamePlayer.y * th + th;
        this.commitPlacement(asset, { x: mapX, y: mapY, tileX: $gamePlayer.x, tileY: $gamePlayer.y });
    },

    // templateKey: the event template for an event (else the one picked in the panel, else NPC).
    commitPlacement(asset, coords, modeOverride, templateKey) {
        if (asset && asset.type === 'prefab') {
            this.placePrefab(DocsDoodads.Prefabs.get(asset.prefabId), coords);
            return;
        }
        const mode = modeOverride || asset.placement.defaultMode || "doodad";

        if (mode === "event" || asset.type === "character_sheet" || asset.type === "single_character") {
            const picked = document.getElementById('dd-event-template');
            const template = DocsDoodads.EventTemplates.get(templateKey || (picked ? picked.value : 'npc'));
            const mapId = $gameMap.mapId();
            DocsDoodads.Persistence.stagedFor(mapId);
            const newId = DocsDoodads.Events.allocateSafeId($gameMap._stagedMapData);

            const ev = DocsDoodads.Events.createEventObject(newId, coords.tileX, coords.tileY, {
                characterName: asset.fileName,
                characterIndex: asset.type === 'character_sheet'
                    ? (asset.characterIndex !== undefined ? asset.characterIndex : ((asset.placement && asset.placement.characterIndex) || 0))
                    : 0,
                list: template.list,
                trigger: template.trigger,
                priorityType: template.priorityType,
                // The template's movement options too (a chest keeps facing one way, a door doesn't walk).
                directionFix: template.directionFix,
                stepAnime: template.stepAnime,
                walkAnime: template.walkAnime,
                through: template.through,
                after: template.after,
                pages: template.pages
            });

            const cmd = {
                apply: () => {
                    $gameMap._stagedMapData.events[newId] = ev;
                    DocsDoodads.Persistence.dirtyMap = true;
                },
                revert: () => {
                    delete $gameMap._stagedMapData.events[newId];
                    DocsDoodads.Persistence.dirtyMap = true;
                }
            };
            cmd.type = cmd.type || 'create_event';
            DocsDoodads.Undo.execute(cmd);
            this.showToast(`Created ${template.name} Event EV${String(newId).padStart(3, '0')}`);
        } else {
            const placed = this.withMirrors(this.newDoodadFromAsset(asset, coords.x, coords.y));
            if (placed.length === 0) {
                this.showToast(this.levelGroundMessage, 'info');
                return;
            }

            const cmd = {
                apply: () => {
                    window.$dataDocsDoodads[$gameMap.mapId()] = window.$dataDocsDoodads[$gameMap.mapId()] || [];
                    placed.forEach(d => window.$dataDocsDoodads[$gameMap.mapId()].push(d));
                    DocsDoodads.Persistence.dirtyDoodads = true;
                    this.refreshSpriteset();
                },
                revert: () => {
                    const list = window.$dataDocsDoodads[$gameMap.mapId()] || [];
                    placed.forEach(d => {
                        const idx = list.indexOf(d);
                        if (idx > -1) list.splice(idx, 1);
                    });
                    this.refreshSpriteset();
                }
            };
            cmd.type = cmd.type || 'place_doodad';
            DocsDoodads.Undo.execute(cmd);
            this.showToast("Placed Doodad on Map!");
        }
        DocsDoodads.AssetIndex.recordUsage(asset.id);
    },

    // The selected doodads, or the one selected doodad.
    selectionItems() {
        return this.selectedDoodads && this.selectedDoodads.length > 0 ? this.selectedDoodads : (this.selectedDoodad ? [this.selectedDoodad] : []);
    },

    alignSelected(mode) {
        const items = (this.selectedDoodads || []).filter(d => !d.locked);
        if (items.length < 2) return;
        const xs = items.map(d => d.x), ys = items.map(d => d.y);
        const avg = list => Math.round(list.reduce((sum, v) => sum + v, 0) / list.length);
        const target = { left: ['x', Math.min(...xs)], right: ['x', Math.max(...xs)], centerX: ['x', avg(xs)],
            top: ['y', Math.min(...ys)], bottom: ['y', Math.max(...ys)], centerY: ['y', avg(ys)] }[mode];
        if (!target) return;
        this.editDoodads(items, d => { d[target[0]] = target[1]; }, 'align_doodads');
        this.refreshInspector();
        this.showToast(`Aligned ${items.length} doodads (${mode}).`);
    },

    distributeSelected(mode) {
        const items = (this.selectedDoodads || []).filter(d => !d.locked);
        if (items.length < 3) {
            this.showToast("Select at least 3 doodads to distribute.");
            return;
        }
        const axis = mode === 'vertical' ? 'y' : 'x';
        const order = items.slice().sort((a, b) => a[axis] - b[axis]);
        const min = order[0][axis], step = (order[order.length - 1][axis] - min) / (order.length - 1);
        const spot = new Map(order.map((d, idx) => [d, Math.round(min + idx * step)]));
        this.editDoodads(items, d => { d[axis] = spot.get(d); }, 'distribute_doodads');
        this.refreshInspector();
        this.showToast(`Distributed ${items.length} doodads (${mode}).`);
    },

    groupSelected() {
        const items = this.selectedDoodads || [];
        if (items.length < 2) return;
        const grpId = 'grp_' + Date.now();
        this.editDoodads(items, d => { d.groupId = grpId; }, 'group_doodads');
        this.refreshInspector();
        this.showToast(`Grouped ${items.length} doodads.`);
    },

    ungroupSelected() {
        const items = this.selectedDoodads || [];
        if (items.length === 0) return;
        this.editDoodads(items, d => { delete d.groupId; }, 'ungroup_doodads');
        this.refreshInspector();
        this.showToast(`Ungrouped ${items.length} doodads.`);
    },

    lockSelected(locked) {
        const items = this.selectionItems();
        if (items.length === 0) return;
        this.editDoodads(items, d => { d.locked = !!locked; }, 'lock_doodads');
        this.refreshInspector();
        this.showToast(locked ? `Locked ${items.length} doodads.` : `Unlocked ${items.length} doodads.`);
    },

    hideSelected(hidden) {
        const items = this.selectionItems();
        if (items.length === 0) return;
        this.editDoodads(items, d => { d.editorHidden = !!hidden; }, 'hide_doodads');
        this.refreshInspector();
        this.showToast(hidden ? `Hidden ${items.length} doodads in editor.` : `Showing ${items.length} doodads.`);
    },

