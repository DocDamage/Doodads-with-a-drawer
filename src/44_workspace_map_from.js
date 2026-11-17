// @editor-only
//==========================================================
// SECTION 25M: PICTURE TO MAP (8.5.2) AND KINDS OF MAP (8.5.3)
//==========================================================
// Map → Picture to Map: choose what kind of map, a picture (and a grey one for heights), how thin a line to
// ignore, then agree the key: each colour group beside a class, guessed and always changeable, and the tile each
// class uses (remembered per tileset). The plan shows on the map; Apply paints tiles (autotile edges joined),
// regions, heights and biome art as one undo step. Kinds: four built in, and copies the user changes.
(function() {
    const D = DocsDoodads, W = D.Workspace, M = D.MapFrom;
    const escapeHtml = value => D.Security.escapeHtml(String(value));
    const hex = c => '#' + c.map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');

    Object.assign(W, {
        mapKinds() { return M.kinds(window.$dataDocsDoodads && window.$dataDocsDoodads.mapKinds); },

        // The tile each class uses, per tileset and kind, kept on this computer.
        mapFromTile(kindId, classId, value) {
            const tileset = (window.$dataMap && $dataMap.tilesetId) || 0, prefs = D.Ui.prefs().mapFromTiles || {};
            const key = `${tileset}:${kindId}`;
            if (value === undefined) {
                const saved = prefs[key] && prefs[key][classId];
                if (saved) return saved;
                const cls = M.kind(kindId, window.$dataDocsDoodads && window.$dataDocsDoodads.mapKinds).classes.find(c => c.id === classId);
                return cls && cls.tile ? cls.tile : null;
            }
            const next = Object.assign({}, prefs, { [key]: Object.assign({}, prefs[key] || {}, { [classId]: Number(value) > 0 ? Math.floor(Number(value)) : null }) });
            D.Ui.setPref('mapFromTiles', next);
            return next[key][classId];
        },

        copyMapKind(kindId, name) {
            const data = window.$dataDocsDoodads = window.$dataDocsDoodads || {};
            const kinds = this.mapKinds(), from = kinds.find(k => k.id === kindId);
            if (!from) return null;
            let id = 'kind_' + String(name || from.id).toLowerCase().replace(/[^\w]+/g, '_').slice(0, 30), n = 2;
            while (kinds.some(k => k.id === id)) id = id.replace(/_\d+$/, '') + '_' + n++;
            const copy = M.copyKind(from, id, name || from.name + ' (copy)');
            data.mapKinds = (Array.isArray(data.mapKinds) ? data.mapKinds : []).concat([copy]);
            D.Persistence.dirtyDoodads = true;
            return copy;
        },

        loadMapFromPicture(file) {
            return new Promise((resolve, reject) => {
                const url = typeof URL !== 'undefined' && URL.createObjectURL && file instanceof Blob ? URL.createObjectURL(file) : String(file);
                const image = new Image();
                image.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = image.naturalWidth || image.width; canvas.height = image.naturalHeight || image.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(image, 0, 0);
                    resolve({ data: ctx.getImageData(0, 0, canvas.width, canvas.height).data, width: canvas.width, height: canvas.height });
                };
                image.onerror = () => reject(new Error('That picture could not be read.'));
                image.src = url;
            });
        },

        // From the state of the card: the read picture, the key and the plan.
        mapFromPlan(state) {
            if (!state.picture || !window.$gameMap) return null;
            const kind = this.mapKinds().find(k => k.id === state.kindId) || this.mapKinds()[0];
            const tilesW = $gameMap.width(), tilesH = $gameMap.height();
            const read = M.read(state.picture.data, state.picture.width, state.picture.height, { tilesW, tilesH });
            read.cells = M.ignoreThin(read.cells, read.w, read.h, state.thin);
            if (!state.key || state.key.length !== read.groups.length || state.keyKind !== kind.id) {
                state.key = read.groups.map(g => M.guess(g.colour, kind));
                state.keyKind = kind.id;
            }
            const heights = state.heights ? M.heightsFrom(state.heights.data, state.heights.width, state.heights.height, tilesW, tilesH) : null;
            const plan = M.plan(read, state.key, kind, { heights, name: state.roomName, roughen: state.roughen, seed: state.seed || 1 });
            return { kind, read, plan, ppt: M.pixelsPerTile(state.picture.width, state.picture.height, tilesW, tilesH) };
        },

        // Apply: tiles through Tiles.paint (autotile edges join up), regions, heights and biome art, one undo step.
        applyMapFrom(plan, kind, tileFor = id => this.mapFromTile(kind.id, id)) {
            const view = this.tileMapView ? this.tileMapView() : null;
            if (!view) { this.showToast('Open a map first.', 'error'); return null; }
            const built = M.build(plan, kind, tileFor), mapId = this.currentMapId(), T = D.Tiles, tables = this.autotileTables();
            const tileChanges = new Map();
            const record = (index, after) => {
                const before = tileChanges.has(index) ? tileChanges.get(index).before : Number(view.data[index]) || 0;
                tileChanges.set(index, { before, after });
                this.setMapTile(mapId, index, after);
            };
            for (const t of built.tiles) for (const c of T.paint(view, t.x, t.y, { ids: [[t.id]], layer: 'auto' }, tables)) record(c.index, c.after);
            for (const r of built.regions) record(T.index(view.width, view.height, r.x, r.y, 5), r.id);
            const before = JSON.parse(JSON.stringify(D.Lighting.mapSettings(mapId) || {}));
            const after = JSON.parse(JSON.stringify(before));
            // The kind is kept with the map, so later tools know what it is.
            after.mapKind = kind.id;
            if (Object.keys(built.heights).length) {
                after.terrain = Object.assign({}, after.terrain || {}, { enabled: true });
                after.terrain.paint = Object.assign({}, D.Terrain.normalize(after.terrain).paint, built.heights);
            }
            // Biome art: one scatter per tile of a class with a biome, seeded so Apply twice makes the same map.
            const list = window.$dataDocsDoodads[mapId] = window.$dataDocsDoodads[mapId] || [];
            const biomes = this.biomesRaw ? this.biomesRaw() : [], placed = [], rng = D.Scatter.rng(Number(plan.options && plan.options.seed) || 1);
            const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight(), missingBiomes = new Set();
            for (const spot of built.biomes) {
                const raw = biomes.find(b => b && (b.id === spot.biome || String(b.name || '').toLowerCase() === spot.biome.toLowerCase()));
                const biome = raw ? D.Biome.normalize(raw) : null;
                if (!biome || !biome.entries.length) { missingBiomes.add(spot.biome); continue; }
                const center = { x: spot.x * tw + tw / 2, y: spot.y * th + th / 2 };
                const existing = placed.filter(d => Math.abs(d.x - center.x) < tw * 2 && Math.abs(d.y - center.y) < th * 2).map(d => ({ x: d.x, y: d.y }));
                for (const p of D.Biome.paint(biome, center, tw / 2, existing, rng)) {
                    const asset = this.assetByPath ? this.assetByPath(p.path) : null;
                    const d = asset ? this.newDoodadFromAsset(asset, p.x, p.y, false) : Object.assign(D.standardStruct(), { bit: [3, p.path], x: p.x, y: p.y });
                    d.scaleX = p.scale * (p.flipX ? -1 : 1); d.scaleY = p.scale;
                    placed.push(d);
                }
            }
            const changes = Array.from(tileChanges.entries()).filter(([, c]) => c.before !== c.after);
            const setTiles = which => { for (const [index, c] of changes) this.setMapTile(mapId, index, c[which]); if (this.afterTileEdit) this.afterTileEdit(); };
            const setSettings = value => { if (this.writeMapSettings) this.writeMapSettings(mapId, JSON.parse(JSON.stringify(value))); else D.Lighting.setMapSettings(mapId, value); };
            const setDoodads = add => {
                for (const d of placed) { const at = list.indexOf(d); if (add && at < 0) list.push(d); if (!add && at >= 0) list.splice(at, 1); }
                D.Persistence.dirtyDoodads = true;
                if (this.refreshSpriteset) this.refreshSpriteset(true);
            };
            setTiles('before');
            D.Undo.execute({
                type: 'picture_to_map',
                apply: () => { setTiles('after'); setSettings(after); setDoodads(true); },
                revert: () => { setTiles('before'); setSettings(before); setDoodads(false); }
            });
            const notes = [];
            if (built.unmapped.length) notes.push(`No tile chosen for ${built.unmapped.map(id => (kind.classes.find(c => c.id === id) || { name: id }).name).join(', ')}: left alone.`);
            if (missingBiomes.size) notes.push(`No biome with art called ${Array.from(missingBiomes).join(', ')}.`);
            this.showToast(`Picture to Map: ${changes.length} tile change(s), ${placed.length} doodad(s). ${notes.join(' ')}`.trim(), notes.length ? 'info' : 'success');
            return { changes: changes.length, doodads: placed.length, unmapped: built.unmapped, missingBiomes: Array.from(missingBiomes) };
        },

        // The plan on the map while the card is open: a colour per class.
        drawMapFromPlan(g) {
            const preview = this._mapFrom && this._mapFrom.preview;
            if (!preview || typeof $gameMap === 'undefined' || !$gameMap || (D.Perspective.liveCamera && D.Perspective.liveCamera())) return;
            const { plan, kind } = preview, tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
            const colour = id => { let h = 0; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return ((h & 0x7f) + 96) << 16 | (((h >> 7) & 0x7f) + 96) << 8 | (((h >> 14) & 0x7f) + 96); };
            plan.cells.forEach((id, i) => {
                if (!id || !kind.classes.some(c => c.id === id)) return;
                const x = $gameMap.adjustX(i % plan.w) * tw, y = $gameMap.adjustY(Math.floor(i / plan.w)) * th;
                g.beginFill(colour(id), 0.35); g.drawRect(x, y, tw, th); g.endFill();
            });
            for (const f of plan.features) {
                const x = $gameMap.adjustX(f.x) * tw, y = $gameMap.adjustY(f.y) * th;
                g.lineStyle(2, 0xffffff, 0.9); g.drawRect(x + 2, y + 2, f.w * tw - 4, f.h * th - 4); g.lineStyle(0);
            }
        },

        closeMapFrom() {
            const card = typeof document !== 'undefined' && document.getElementById ? document.getElementById('dd-map-from') : null;
            if (card && card.parentNode) card.parentNode.removeChild(card);
            this._mapFrom = null;
        },

        openMapFrom() {
            if (typeof document === 'undefined') return null;
            this.closeMapFrom();
            const state = this._mapFrom = { kindId: 'overworld', thin: 0, roughen: 0, roomName: '', picture: null, heights: null, key: null, preview: null, error: '' };
            const card = document.createElement('div');
            card.id = 'dd-map-from'; card.className = 'dd-glass';
            card.style.cssText = 'position:fixed;top:80px;right:20px;width:380px;max-height:78vh;overflow:auto;padding:12px;z-index:10040;font-size:11px;display:flex;flex-direction:column;gap:6px;';
            const render = () => {
                let made = null;
                try { made = this.mapFromPlan(state); state.error = ''; } catch (error) { state.error = error.message || String(error); }
                state.preview = made ? { plan: made.plan, kind: made.kind } : null;
                const kinds = this.mapKinds(), kind = made ? made.kind : kinds.find(k => k.id === state.kindId) || kinds[0];
                const classOptions = selected => `<option value=""${!selected ? ' selected' : ''}>Leave alone</option>` + kind.classes.map(c => `<option value="${escapeHtml(c.id)}"${c.id === selected ? ' selected' : ''}>${escapeHtml(c.name)}</option>`).join('');
                const used = made ? Array.from(new Set(made.plan.cells.filter(Boolean))) : [];
                card.innerHTML = `<div class="dd-panel-head">Picture to Map <button class="dd-btn" id="dd-mf-close" type="button">Close</button></div>
                    <label>Kind of map <select id="dd-mf-kind">${kinds.map(k => `<option value="${escapeHtml(k.id)}"${k.id === kind.id ? ' selected' : ''}>${escapeHtml(k.name)}</option>`).join('')}</select>
                    <button class="dd-btn" id="dd-mf-copy" type="button">Copy Kind</button></label>
                    <div style="color:var(--dd-muted);">${escapeHtml(kind.scale)}</div>
                    ${(kind.base || kind.id) === 'room' ? `<label>Room name (for furniture) <input id="dd-mf-room" type="text" value="${escapeHtml(state.roomName)}"></label>` : ''}
                    ${(kind.base || kind.id) === 'dungeon' ? `<label>Cave walls (rough) <input id="dd-mf-rough" type="range" min="0" max="1" step="0.1" value="${state.roughen}"></label>` : ''}
                    <label>Picture <input id="dd-mf-picture" type="file" accept="image/png,image/jpeg,image/webp"></label>
                    <label>Heights (grey: dark low, light high) <input id="dd-mf-heights" type="file" accept="image/png,image/jpeg,image/webp"></label>
                    <label>Ignore lines (labels, grid lines) up to <select id="dd-mf-thin">${[0, 1, 2, 3].map(n => `<option value="${n}"${state.thin === n ? ' selected' : ''}>${n ? n + ' tile(s) thick' : 'nothing'}</option>`).join('')}</select></label>
                    ${made ? `<div>${$gameMap.width()} × ${$gameMap.height()} tiles; about ${Math.round(made.ppt * 10) / 10} picture pixels a tile.${made.ppt < 2 ? ' <b>Under two pixels a tile: draw it bigger or make the map smaller.</b>' : ''}</div>` : ''}
                    ${state.error ? `<div style="color:#f87171;">${escapeHtml(state.error)}</div>` : ''}
                    ${made ? made.read.groups.map((g, i) => `<label style="display:flex;gap:6px;align-items:center;"><span style="display:inline-block;width:18px;height:18px;border-radius:4px;background:${hex(g.colour)};"></span>${g.count} tile(s)
                        <select id="dd-mf-key-${i}">${classOptions(state.key[i])}</select></label>`).join('') : ''}
                    ${used.length ? `<div class="dd-panel-head" style="margin-top:4px;">Tiles</div>` + used.map(id => `<label>${escapeHtml((kind.classes.find(c => c.id === id) || { name: id }).name)}
                        <input id="dd-mf-tile-${escapeHtml(id)}" type="number" min="0" value="${this.mapFromTile(kind.id, id) || ''}" placeholder="tile id"></label>`).join('') +
                        `<div style="color:var(--dd-muted);">Alt+click a tile with the Tiles tool to see its id. Classes with no tile are left alone.</div>` : ''}
                    <button class="dd-btn dd-btn-primary" id="dd-mf-apply" type="button"${made ? '' : ' disabled'}>Apply</button>`;
                const node = id => document.getElementById(id);
                node('dd-mf-close').onclick = () => this.closeMapFrom();
                node('dd-mf-kind').onchange = event => { state.kindId = event.target.value; state.key = null; render(); };
                node('dd-mf-copy').onclick = async () => {
                    const name = await D.Ui.prompt('A name for the copy', kind.name + ' (mine)', { title: 'Copy Kind' });
                    const copy = name ? this.copyMapKind(kind.id, name) : null;
                    if (copy) { state.kindId = copy.id; render(); }
                };
                const room = node('dd-mf-room'); if (room) room.onchange = () => { state.roomName = room.value; render(); };
                const rough = node('dd-mf-rough'); if (rough) rough.onchange = () => { state.roughen = Number(rough.value) || 0; render(); };
                node('dd-mf-thin').onchange = event => { state.thin = Number(event.target.value) || 0; render(); };
                const pick = (id, field) => {
                    node(id).onchange = async event => {
                        const file = event.target.files && event.target.files[0];
                        if (!file) return;
                        try { state[field] = await this.loadMapFromPicture(file); if (field === 'picture') state.key = null; } catch (error) { state.error = error.message; }
                        render();
                    };
                };
                pick('dd-mf-picture', 'picture'); pick('dd-mf-heights', 'heights');
                if (made) made.read.groups.forEach((g, i) => { node(`dd-mf-key-${i}`).onchange = event => { state.key[i] = event.target.value || null; render(); }; });
                for (const id of used) { const input = node(`dd-mf-tile-${id}`); if (input) input.onchange = () => this.mapFromTile(kind.id, id, input.value); }
                node('dd-mf-apply').onclick = () => { if (made) { this.applyMapFrom(made.plan, made.kind); this.closeMapFrom(); } };
            };
            document.body.appendChild(card);
            render();
            return card;
        }
    });

    W.toolHooks.mapFrom = { overlay(g) { this.drawMapFromPlan(g); } };
    const menus = W.menus;
    W.menus = function() {
        const all = menus.call(this), map = all.find(menu => menu.id === 'map');
        if (map) map.items.push({ id: 'dd-map-from-btn', icon: 'picture', label: 'Picture to Map', title: 'Turn a drawing into tiles, hills and doodads, after agreeing a colour key' });
        return all;
    };
    const bind = W.bindEvents;
    W.bindEvents = function() {
        const result = bind.apply(this, arguments), button = typeof document !== 'undefined' ? document.getElementById('dd-map-from-btn') : null;
        if (button) button.onclick = () => { this.showMoreMenu(false); this.openMapFrom(); };
        return result;
    };
})();
