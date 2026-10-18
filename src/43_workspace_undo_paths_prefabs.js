    // ---- Undo history panel ----
    toggleUndoHistory() {
        const existing = document.getElementById('dd-undo-history');
        if (existing) { existing.remove(); this._undoHistoryOpen = false; return; }
        this._undoHistoryOpen = true;
        const panel = document.createElement('div');
        panel.id = 'dd-undo-history';
        panel.className = 'dd-glass dd-pop';
        const bar = document.getElementById('dd-toolbar');
        const top = bar && bar.getBoundingClientRect ? Math.round(bar.getBoundingClientRect().bottom + 8) : 78;
        panel.style.cssText = `position: fixed; left: 50%; transform: translateX(-50%); top: ${top}px; width: 260px; max-height: 60vh; overflow-y: auto; z-index: 10017;`;
        document.body.appendChild(panel);
        this.renderUndoHistory();
    },

    renderUndoHistory() {
        const panel = document.getElementById('dd-undo-history');
        if (!panel || !panel.querySelectorAll) { this._undoHistoryOpen = false; return; }
        const steps = DocsDoodads.Undo.history();
        const applied = DocsDoodads.Undo.undoStack.length;
        const row = (count, label, state) => `<div class="dd-undo-step${state === 'current' ? ' dd-undo-current' : ''}" data-count="${count}" style="padding: 4px 8px; border-radius: 10px; cursor: pointer; font-weight: 700; ${state === 'current' ? 'background: var(--dd-primary-soft); color: var(--dd-text); box-shadow: inset 0 0 0 2px var(--dd-primary);' : state === 'undone' ? 'color: var(--dd-faint); font-style: italic;' : ''}">${escapeHtml(label)}</div>`;
        panel.innerHTML = `
            <div class="dd-pop-title">${DocsDoodads.Ui.icon('history', 1)}<span style="flex: 1;">Steps</span>
                <button class="dd-btn dd-fold" id="dd-undo-history-close" title="Close">${DocsDoodads.Ui.icon('close', 1)}</button>
            </div>
            <div style="color: var(--dd-faint); margin-bottom: 4px;">Click a step to go back (or forward) to just after it.</div>
            ${row(0, '(Start)', applied === 0 ? 'current' : 'done')}
            ${steps.map(st => row(st.index + 1, (st.index + 1) + '. ' + st.label, st.index + 1 === applied ? 'current' : st.done ? 'done' : 'undone')).join('')}`;
        document.getElementById('dd-undo-history-close').onclick = () => { panel.remove(); this._undoHistoryOpen = false; };
        for (const el of panel.querySelectorAll('.dd-undo-step')) {
            el.onclick = () => {
                DocsDoodads.Undo.goTo(Number(el.getAttribute('data-count')));
                this.renderUndoHistory();
            };
        }
        const current = panel.querySelector('.dd-undo-current');
        if (current && current.scrollIntoView) current.scrollIntoView({ block: 'nearest' });
    },

    // z(d) gives each doodad's new Z; one undo step.
    setZOrder(items, z, type) {
        items = items || this.selectionItems();
        if (!items || items.length === 0) return false;
        this.editDoodads(items, d => { d.z = z(d); }, type);
        this.refreshInspector();
        return true;
    },

    bringForward(items) {
        if (this.setZOrder(items, d => (d.z || 0) + 1, 'z_order_fwd')) this.showToast(`Brought ${(items || this.selectionItems()).length} doodad(s) forward (+1 Z)`);
    },

    sendBackward(items) {
        if (this.setZOrder(items, d => (d.z || 0) - 1, 'z_order_back')) this.showToast(`Sent ${(items || this.selectionItems()).length} doodad(s) backward (-1 Z)`);
    },

    bringToFront(items) {
        const targetZ = Math.max(0, ...(DocsDoodads.doodads() || []).map(d => d.z || 0)) + 1;
        if (this.setZOrder(items, () => targetZ, 'z_order_front')) this.showToast(`Brought ${(items || this.selectionItems()).length} doodad(s) to front (Z: ${targetZ})`);
    },

    sendToBack(items) {
        const targetZ = Math.min(0, ...(DocsDoodads.doodads() || []).map(d => d.z || 0)) - 1;
        if (this.setZOrder(items, () => targetZ, 'z_order_bottom')) this.showToast(`Sent ${(items || this.selectionItems()).length} doodad(s) to back (Z: ${targetZ})`);
    },

    // Copies are unlocked and get fresh ids; each copied group becomes one new, independent group, and
    // each copied prefab copy a new placed copy (its own instance, at the moved origin).
    cloneDoodadsForCopy(items, offset = 16) {
        const groupIds = new Map();
        const instances = new Map();
        return items.map(orig => {
            const dup = JSON.parse(JSON.stringify(orig));
            dup.x += offset;
            dup.y += offset;
            dup.locked = false;
            delete dup.uid;
            delete dup.mirrorOf;
            if (orig.prefabRef) {
                if (!instances.has(orig.prefabRef.instance)) instances.set(orig.prefabRef.instance, DocsDoodads.Prefabs.newId('pi_'));
                dup.prefabRef.instance = instances.get(orig.prefabRef.instance);
                dup.prefabRef.ox = (Number(orig.prefabRef.ox) || 0) + offset;
                dup.prefabRef.oy = (Number(orig.prefabRef.oy) || 0) + offset;
            }
            if (orig.groupId) {
                if (!groupIds.has(orig.groupId)) groupIds.set(orig.groupId, 'grp_' + Date.now() + '_' + groupIds.size + '_' + Math.random().toString(36).slice(2, 6));
                dup.groupId = groupIds.get(orig.groupId);
            } else {
                delete dup.groupId;
            }
            return dup;
        });
    },

    clipboardPath: 'data/docs_doodads_cache/clipboard.json',

    // The clipboard is also written to disk so it survives map changes and Playtest restarts.
    copySelected() {
        const items = this.selectedDoodads && this.selectedDoodads.length > 0 ? this.selectedDoodads : (this.selectedDoodad ? [this.selectedDoodad] : []);
        if (items.length === 0) return;
        this._clipboardDoodads = items.map(d => JSON.parse(JSON.stringify(d)));
        this._clipboardSourceMapId = this.currentMapId();
        DocsDoodads.FS.atomicWriteJson(this.clipboardPath, { sourceMapId: this._clipboardSourceMapId, doodads: this._clipboardDoodads });
        this.showToast(`Copied ${items.length} doodad(s) to clipboard`);
    },

    loadClipboard() {
        if (this._clipboardDoodads && this._clipboardDoodads.length > 0) return true;
        const saved = DocsDoodads.FS.existsSync(this.clipboardPath) ? DocsDoodads.FS.readJson(this.clipboardPath) : null;
        if (!saved || !Array.isArray(saved.doodads) || saved.doodads.length === 0) return false;
        this._clipboardDoodads = saved.doodads;
        this._clipboardSourceMapId = saved.sourceMapId;
        return true;
    },

    // Same map: the copy is offset so it is visible. Another map, or inPlace (Paste in Place,
    // Ctrl+Shift+V): it lands at the copied position.
    pasteCopied(inPlace) {
        if (!this.loadClipboard()) return;
        const mapId = this.currentMapId();
        const list = window.$dataDocsDoodads[mapId] = window.$dataDocsDoodads[mapId] || [];
        const sameMap = this._clipboardSourceMapId === undefined || this._clipboardSourceMapId === mapId;
        const duplicates = this.cloneDoodadsForCopy(this._clipboardDoodads, sameMap && !inPlace ? 16 : 0);

        const cmd = {
            type: 'paste_doodads',
            apply: () => {
                duplicates.forEach(d => list.push(d));
                DocsDoodads.Persistence.dirtyDoodads = true;
                this.refreshSpriteset();
            },
            revert: () => {
                duplicates.forEach(d => {
                    const i = list.indexOf(d);
                    if (i > -1) list.splice(i, 1);
                });
                this.refreshSpriteset();
            }
        };
        cmd.type = cmd.type || 'paste_doodads';
        DocsDoodads.Undo.execute(cmd);
        this.selectDoodads(duplicates);
        this.showToast(`Pasted ${duplicates.length} doodad(s)${inPlace ? ' in place' : ''}${sameMap ? '' : ` from map ${this._clipboardSourceMapId}`}`);
    },

    // ---- Picking many at once ----
    // The doodads Select can reach on this map: not hidden in the editor, on a shown, unlocked layer.
    pickableDoodads() {
        return (DocsDoodads.doodads(this.currentMapId()) || []).filter(d => d && !d.editorHidden && this.layerAllowsEditing(d));
    },

    // What a doodad shows: its picture (by path) for picture doodads, else its whole source.
    artKey(d) {
        if (!d || !d.bit) return '';
        if (d.bit[0] === 3) return 'img:' + String(d.bit[1] || '').replace(/\\/g, '/').toLowerCase();
        return JSON.stringify(d.bit);
    },

    pickDoodads(items, what) {
        this.selectDoodads(items);
        this.showToast(items.length ? `Picked ${items.length} ${what}.` : `Nothing picked: no ${what}.`, 'info');
        return items.length;
    },

    selectAllDoodads() {
        return this.pickDoodads(this.pickableDoodads(), 'doodad(s)');
    },

    selectSameArt(d) {
        d = d || this.selectedDoodad;
        if (!d) return 0;
        const key = this.artKey(d);
        return this.pickDoodads(this.pickableDoodads().filter(x => this.artKey(x) === key), 'doodad(s) with the same art');
    },

    selectLayer(layerId) {
        const layer = DocsDoodads.Layers.list(DocsDoodads.Lighting.mapSettings(this.currentMapId())).find(l => l.id === layerId);
        return this.pickDoodads(this.pickableDoodads().filter(d => DocsDoodads.Layers.of(d) === layerId), `doodad(s) on ${layer ? layer.name : 'that layer'}`);
    },

    invertSelection() {
        const picked = new Set(this.selectionItems());
        return this.pickDoodads(this.pickableDoodads().filter(d => !picked.has(d)), 'doodad(s)');
    },

    // ---- Replace Art: a new picture for doodads; position, depth, motion, lights and the rest stay ----
    // The picture doodads showing `path`: on this map ('map') or on every map ('all'). Locked ones stay.
    doodadsShowing(path, scope) {
        const key = this.artKey({ bit: [3, path] });
        const data = window.$dataDocsDoodads || {};
        const lists = scope === 'all'
            ? Object.keys(data).filter(id => /^\d+$/.test(id) && Array.isArray(data[id])).map(id => data[id])
            : [DocsDoodads.doodads(this.currentMapId())];
        return [].concat(...lists).filter(d => d && !d.locked && d.bit && d.bit[0] === 3 && this.artKey(d) === key);
    },

    // The pictures Replace Art can use: library images in img/.
    replaceArtChoices() {
        const list = DocsDoodads.AssetIndex && DocsDoodads.AssetIndex.list ? DocsDoodads.AssetIndex.list : [];
        return list.filter(a => a && a.path && a.type !== 'prefab' && a.category !== 'Audio' && /^img\//i.test(String(a.path).replace(/\\/g, '/')));
    },

    imageAssetAt(path) {
        const want = String(path || '').trim().replace(/\\/g, '/').toLowerCase();
        return want ? this.replaceArtChoices().find(a => String(a.path).replace(/\\/g, '/').toLowerCase() === want) || null : null;
    },

    // One undo step. The frame size follows the new picture (split by the doodad's frame count when it
    // is animated); the frame offset starts again at the top left.
    replaceArt(items, asset) {
        items = (items || []).filter(d => d && !d.locked && d.bit && d.bit[0] === 3);
        if (!asset || !asset.path || items.length === 0) return 0;
        const w = Number(asset.frameW || asset.width) || 0, h = Number(asset.frameH || asset.height) || 0;
        this.editDoodads(items, d => {
            d.bit = [3, asset.path];
            if (w > 0 && h > 0) {
                d.frameW = Math.max(1, Math.round(w / Math.max(1, Number(d.xFrame) || 1)));
                d.frameH = Math.max(1, Math.round(h / Math.max(1, Number(d.yFrame) || 1)));
            }
            d.frameX = 0;
            d.frameY = 0;
        }, 'replace_art');
        if (asset.id) DocsDoodads.AssetIndex.recordUsage(asset.id);
        return items.length;
    },

    // Asks for the new picture and which doodads change: the picked ones, or every doodad showing the
    // same picture on this map or on every map. fromPath: start from a picture instead of the selection.
    async showReplaceArt(fromPath) {
        const picked = fromPath ? [] : this.selectionItems().filter(d => d.bit && d.bit[0] === 3);
        const source = fromPath || (picked[0] ? picked[0].bit[1] : '');
        if (!source) {
            this.showToast('Pick a picture doodad on the map first.', 'info');
            return 0;
        }
        const name = String(source).split('/').pop();
        const scopes = [];
        if (picked.length) scopes.push({ value: 'selected', label: `The ${picked.length} picked doodad(s)` });
        scopes.push({ value: 'map', label: `Every ${name} on this map (${this.doodadsShowing(source, 'map').length})` });
        scopes.push({ value: 'all', label: `Every ${name} on every map (${this.doodadsShowing(source, 'all').length})` });
        const suggestion = this.lastAsset && this.lastAsset.path && this.lastAsset.path !== source ? this.lastAsset.path : '';
        const values = await DocsDoodads.Ui.form({
            title: 'Replace art', icon: 'picture', ok: 'Replace',
            text: `Show a different picture instead of ${name}. Position, size, depth, motion, lights and collision stay.`,
            fields: [
                { key: 'path', label: 'New picture', value: suggestion, choices: this.replaceArtChoices().map(a => a.path), placeholder: 'img/doodads/...' },
                { key: 'scope', type: 'select', label: 'Change', value: scopes[0].value, options: scopes }
            ]
        });
        if (!values || !this.mounted) return 0;
        const asset = this.imageAssetAt(values.path);
        if (!asset) {
            this.showToast(`No picture at "${values.path}" in the Item Bag.`, 'error');
            return 0;
        }
        const items = values.scope === 'selected' ? picked : this.doodadsShowing(source, values.scope);
        const n = this.replaceArt(items, asset);
        this.refreshInspector();
        this.showToast(n ? `Now showing ${asset.fileName} on ${n} doodad(s).` : 'Nothing to change (locked doodads stay as they are).', n ? 'success' : 'info');
        return n;
    },

    // ---- Shared undo for whole per-map arrays (prefab sync, mirroring, send to map) ----
    recordMapListsEdit(beforeLists, type) {
        const data = window.$dataDocsDoodads;
        const afterLists = {};
        for (const mapId of Object.keys(beforeLists)) afterLists[mapId] = (data[mapId] || []).slice();
        const write = (lists) => {
            for (const [mapId, items] of Object.entries(lists)) {
                if (!items) { delete data[mapId]; continue; }
                const target = data[mapId] = data[mapId] || [];
                target.length = 0;
                items.forEach(d => target.push(d));
            }
            DocsDoodads.Persistence.dirtyDoodads = true;
            this.refreshSpriteset();
        };
        DocsDoodads.Undo.execute({ type, apply: () => write(afterLists), revert: () => write(beforeLists) });
    },

    snapshotMapLists(mapIds) {
        const data = window.$dataDocsDoodads;
        const out = {};
        for (const mapId of mapIds) out[mapId] = data[mapId] ? data[mapId].slice() : null;
        return out;
    },

    sendDoodadsToMap(items, targetMapId, mode = 'copy') {
        items = (items || []).filter(d => d && (mode === 'copy' || !d.locked));
        const sourceMapId = this.currentMapId();
        targetMapId = Number(targetMapId);
        if (items.length === 0 || !targetMapId || targetMapId === sourceMapId) return 0;
        const data = window.$dataDocsDoodads;
        const before = this.snapshotMapLists([sourceMapId, targetMapId]);
        const target = data[targetMapId] = data[targetMapId] || [];
        if (mode === 'move') {
            const source = data[sourceMapId] || [];
            for (const d of items) {
                const i = source.indexOf(d);
                if (i > -1) source.splice(i, 1);
                target.push(d);
            }
            this.selectedDoodad = null;
            this.selectedDoodads = [];
        } else {
            this.cloneDoodadsForCopy(items, 0).forEach(d => target.push(d));
        }
        this.recordMapListsEdit(before, mode === 'move' ? 'move_to_map' : 'copy_to_map');
        this.showToast(`${mode === 'move' ? 'Moved' : 'Copied'} ${items.length} doodad(s) to map ${targetMapId}`);
        return items.length;
    },

    // Map pixel size; neighbouring maps are read from disk (overridable in tests).
    mapSizeLookup(mapId) {
        const tw = window.$gameMap && $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
        const th = window.$gameMap && $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
        if (window.$gameMap && $gameMap.mapId() === mapId && $gameMap.width) return { w: $gameMap.width() * tw, h: $gameMap.height() * th };
        const map = DocsDoodads.FS.readJson(DocsDoodads.Persistence.mapFilePath(mapId));
        return map && map.width ? { w: map.width * tw, h: map.height * th } : null;
    },

    mapNeighbors(mapId = this.currentMapId()) {
        const settings = DocsDoodads.Lighting.mapSettings(mapId);
        return (settings && settings.neighbors) || {};
    },

    setMapNeighbors(neighbors) {
        const mapId = this.currentMapId();
        const data = window.$dataDocsDoodads;
        const before = data.mapSettings && data.mapSettings[mapId] ? JSON.parse(JSON.stringify(data.mapSettings[mapId])) : null;
        const clean = {};
        for (const side of DocsDoodads.MapLinks.sides) if (Number(neighbors[side]) > 0) clean[side] = Number(neighbors[side]);
        const next = Object.assign({}, before || {}, { neighbors: clean });
        const write = (value) => {
            if (value) {
                data.mapSettings = data.mapSettings || {};
                data.mapSettings[mapId] = JSON.parse(JSON.stringify(value));
            } else if (data.mapSettings) {
                delete data.mapSettings[mapId];
            }
            DocsDoodads.Persistence.dirtyDoodads = true;
        };
        DocsDoodads.Undo.execute({ type: 'map_neighbors', apply: () => write(next), revert: () => write(before) });
    },

    // Doodads hanging over this map's edges get read-only copies on the neighbouring maps.
    mirrorEdgeDoodads() {
        const mapId = this.currentMapId();
        const neighbors = this.mapNeighbors(mapId);
        const data = window.$dataDocsDoodads;
        const own = data[mapId] || [];
        own.forEach(d => { if (!d.mirrorOf) DocsDoodads.MapLinks.ensureUid(d); });
        const copies = DocsDoodads.MapLinks.edgeCopies(mapId, own, neighbors, id => this.mapSizeLookup(id));
        const targets = new Set(Object.values(neighbors).map(Number).filter(Boolean));
        copies.forEach(c => targets.add(c.mapId));
        if (targets.size === 0) {
            this.showToast('Set neighbouring maps first.');
            return 0;
        }
        const before = this.snapshotMapLists([...targets]);
        for (const target of targets) {
            const list = data[target] = (data[target] || []).filter(d => !(d.mirrorOf && d.mirrorOf.mapId === mapId));
            copies.filter(c => c.mapId === target).forEach(c => list.push(Object.assign(c.doodad, { locked: true })));
        }
        this.recordMapListsEdit(before, 'mirror_edges');
        this.showToast(`Mirrored ${copies.length} edge doodad(s) to ${targets.size} neighbouring map(s).`);
        return copies.length;
    },

    // ---- Path tool ----
    pathSettings: { spacing: 48, alignToPath: false, smooth: false, jitter: 0, endAsset: null, cornerAsset: null },
    pathPoints: [],

    placePath(points, asset, settings = this.pathSettings) {
        if (!asset || !points || points.length === 0) return [];
        const samples = DocsDoodads.Paths.sample(points, settings.spacing, { smooth: settings.smooth });
        const rng = DocsDoodads.Scatter.rng(Date.now());
        const placed = samples.map(p => {
            const special = (p.kind === 'start' || p.kind === 'end') ? settings.endAsset : p.kind === 'corner' ? settings.cornerAsset : null;
            const jitter = Number(settings.jitter) || 0;
            const x = Math.round(p.x + (jitter ? (rng() * 2 - 1) * jitter : 0));
            const y = Math.round(p.y + (jitter ? (rng() * 2 - 1) * jitter : 0));
            const d = this.newDoodadFromAsset(special || asset, x, y);
            if (settings.alignToPath) d.rotation = Math.round(p.angle);
            return d;
        }).filter(d => DocsDoodads.Terrain.allowsDoodad(d, this.currentMapId()));
        const mapId = this.currentMapId();
        const list = window.$dataDocsDoodads[mapId] = window.$dataDocsDoodads[mapId] || [];
        DocsDoodads.Undo.execute({
            type: 'place_path',
            apply: () => { placed.forEach(d => list.push(d)); DocsDoodads.Persistence.dirtyDoodads = true; this.refreshSpriteset(); },
            revert: () => { placed.forEach(d => { const i = list.indexOf(d); if (i > -1) list.splice(i, 1); }); this.refreshSpriteset(); }
        });
        DocsDoodads.AssetIndex.recordUsage(asset.id);
        this.showToast(`Placed ${placed.length} piece(s) along the path.`);
        return placed;
    },

    finishPath() {
        const points = this.pathPoints || [];
        this.pathPoints = [];
        if (points.length > 0 && this.selectedAsset && this.selectedAsset.category !== 'Audio') this.placePath(points, this.selectedAsset);
    },

    // ---- Prefabs ----
    prefabInstanceDoodads(d) {
        if (!d || !d.prefabRef) return [];
        return (DocsDoodads.doodads() || []).filter(x => x.prefabRef && x.prefabRef.instance === d.prefabRef.instance);
    },

    // Events inside the selection's tile bounds go into the prefab with the doodads.
    eventsWithin(items) {
        if (!items.length || !window.$gameMap) return [];
        const tw = $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
        const th = $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
        const r = DocsDoodads.Guides.unionRect(items.map(d => DocsDoodads.Guides.rectOf(d)));
        const staged = DocsDoodads.Persistence.stagedFor();
        return ((staged && staged.events) || []).filter(e => e &&
            (e.x + 0.5) * tw >= r.left && (e.x + 0.5) * tw <= r.right && (e.y + 0.5) * th >= r.top && (e.y + 0.5) * th <= r.bottom);
    },

    savePrefabFromSelection(name, includeEvents = true) {
        const items = this.selectedDoodads && this.selectedDoodads.length > 0 ? this.selectedDoodads : (this.selectedDoodad ? [this.selectedDoodad] : []);
        if (items.length === 0) return null;
        const tw = window.$gameMap && $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
        const th = window.$gameMap && $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
        const events = includeEvents ? this.eventsWithin(items) : [];
        const prefab = DocsDoodads.Prefabs.capture(name, items, events, { tileWidth: tw, tileHeight: th });
        DocsDoodads.Prefabs.add(prefab);
        DocsDoodads.Prefabs.save();
        // The selection itself becomes the prefab's first linked copy.
        const instance = DocsDoodads.Prefabs.newId('pi_');
        this.editDoodads(items, d => {
            d.prefabRef = { id: prefab.id, instance, ox: prefab.origin.x, oy: prefab.origin.y };
            d.groupId = 'grp_' + instance;
        }, 'link_prefab');
        this.showToast(`Saved prefab "${prefab.name}" (${prefab.doodads.length} doodads, ${prefab.events.length} events).`);
        if (this.currentCategory === 'Prefabs') this.refreshDrawerCards();
        return prefab;
    },

    placePrefab(prefab, at) {
        if (!prefab) return null;
        const tw = window.$gameMap && $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
        const th = window.$gameMap && $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
        const staged = prefab.events && prefab.events.length > 0 ? DocsDoodads.Persistence.stagedFor() : null;
        const reserved = [];
        const inst = DocsDoodads.Prefabs.instantiate(prefab, at, {
            tileWidth: tw, tileHeight: th,
            allocateEventId: () => {
                const id = DocsDoodads.Events.allocateSafeId(staged);
                staged.events[id] = { id, reserved: true };
                reserved.push(id);
                return id;
            }
        });
        reserved.forEach(id => { delete staged.events[id]; });
        const mapId = this.currentMapId();
        const list = window.$dataDocsDoodads[mapId] = window.$dataDocsDoodads[mapId] || [];
        DocsDoodads.Undo.execute({
            type: 'place_prefab',
            apply: () => {
                inst.doodads.forEach(d => list.push(d));
                inst.events.forEach(e => { staged.events[e.id] = e; });
                DocsDoodads.Persistence.dirtyDoodads = true;
                if (inst.events.length) DocsDoodads.Persistence.dirtyMap = true;
                this.refreshSpriteset();
            },
            revert: () => {
                inst.doodads.forEach(d => { const i = list.indexOf(d); if (i > -1) list.splice(i, 1); });
                inst.events.forEach(e => { if (staged.events[e.id] === e) staged.events[e.id] = null; });
                this.refreshSpriteset();
            }
        });
        this.showToast(`Placed prefab "${prefab.name}"${inst.events.length ? ` with ${inst.events.length} event(s)` : ''}.`);
        if (this.selectedAsset && this.selectedAsset.type === 'prefab') this.refreshInspector();
        return inst;
    },

    updatePrefabFromInstance(d) {
        const prefab = d && d.prefabRef ? DocsDoodads.Prefabs.get(d.prefabRef.id) : null;
        if (!prefab) return null;
        DocsDoodads.Prefabs.updateFromInstance(prefab, this.prefabInstanceDoodads(d));
        DocsDoodads.Prefabs.save();
        this.showToast(`Updated prefab "${prefab.name}" from this copy.`);
        return prefab;
    },

    // Rebuilds every placed copy (on every map) from the master, keeping each copy's position and group.
    syncPrefabInstances(prefabId) {
        const prefab = DocsDoodads.Prefabs.get(prefabId);
        if (!prefab) return 0;
        const data = window.$dataDocsDoodads;
        const tw = window.$gameMap && $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
        const th = window.$gameMap && $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
        const mapIds = Object.keys(data).filter(k => Array.isArray(data[k]) && data[k].some(d => d && d.prefabRef && d.prefabRef.id === prefabId));
        const before = this.snapshotMapLists(mapIds);
        let count = 0;
        for (const mapId of mapIds) {
            const next = [];
            const done = new Set();
            for (const d of data[mapId]) {
                if (!d || !d.prefabRef || d.prefabRef.id !== prefabId) { next.push(d); continue; }
                if (done.has(d.prefabRef.instance)) continue;
                done.add(d.prefabRef.instance);
                const rebuilt = DocsDoodads.Prefabs.instantiate(prefab, { x: d.prefabRef.ox, y: d.prefabRef.oy },
                    { tileWidth: tw, tileHeight: th, instance: d.prefabRef.instance, groupId: d.groupId });
                rebuilt.doodads.forEach(x => next.push(x));
                count++;
            }
            data[mapId].length = 0;
            next.forEach(d => data[mapId].push(d));
        }
        this.recordMapListsEdit(before, 'sync_prefab');
        this.selectedDoodad = null;
        this.selectedDoodads = [];
        this.showToast(`Synced ${count} cop${count === 1 ? 'y' : 'ies'} of "${prefab.name}".`);
        return count;
    },

    detachPrefabInstance(d) {
        const items = this.prefabInstanceDoodads(d);
        this.editDoodads(items, x => { delete x.prefabRef; }, 'detach_prefab');
    },

