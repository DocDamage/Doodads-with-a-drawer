// @editor-only
//==========================================================
// SECTION 25z: GENERATED MAP CARD AND PREVIEW
//==========================================================
DocsDoodads.Ui.css += `
#dd-generate-card { position: fixed; top: 88px; right: 286px; z-index: 10045; width: 330px; max-width: calc(100vw - 30px); padding: 12px; display: grid; gap: 8px; }
#dd-generate-card .dd-gen-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
#dd-generate-card label { display: grid; gap: 2px; font-size: 10px; color: var(--dd-muted); }
#dd-generate-card input, #dd-generate-card select { width: 100%; box-sizing: border-box; }
`;

DocsDoodads.Ui.hints.generate = 'Generated map preview: change the recipe or Reroll, then Apply once. Escape leaves the map unchanged.';

Object.assign(DocsDoodads.Workspace, {
    generateOptions: { kind: 'dungeon', seed: '1', w: 30, h: 24, count: 6, roomIds: [], biomes: [], floorTile: 2816, wallTile: 4352, pathTile: 0 },

    generatedRooms() {
        const rooms = DocsDoodads.Rooms.ensureLoaded ? DocsDoodads.Rooms.ensureLoaded() : DocsDoodads.GenerateRuntime.rooms;
        DocsDoodads.GenerateRuntime.setRooms(rooms);
        return rooms;
    },

    readGenerateCard() {
        if (typeof document === 'undefined' || !document.getElementById('dd-generate-card')) return this.generateOptions;
        const value = id => { const element = document.getElementById(id); return element ? element.value : ''; };
        const checked = id => { const element = document.getElementById(id); return Boolean(element && element.checked); };
        const rooms = this.generatedRooms();
        this.generateOptions = {
            kind: value('dd-gen-kind') || 'dungeon', seed: value('dd-gen-seed'), w: Number(value('dd-gen-w')), h: Number(value('dd-gen-h')),
            count: Number(value('dd-gen-count')), floorTile: Number(value('dd-gen-floor')), wallTile: Number(value('dd-gen-wall')),
            pathTile: Number(value('dd-gen-path')), roomIds: rooms.filter((room, index) => checked(`dd-gen-room-${index}`)).map(room => room.id),
            biomes: (DocsDoodads.World.get('biomes.list') || []).map((biome, index) => checked(`dd-gen-biome-${index}`)
                ? { id: biome.id, weight: 1, tile: Number(value(`dd-gen-biome-tile-${index}`)) || 0 } : null).filter(Boolean)
        };
        return this.generateOptions;
    },

    previewGeneratedMap(reroll) {
        const map = this.liveMapData(), mapId = this.currentMapId();
        if (!map) return null;
        const raw = this.readGenerateCard();
        if (reroll) {
            raw.seed = String((DocsDoodads.Generate.seed(raw.seed) + 1) >>> 0);
            const input = typeof document !== 'undefined' ? document.getElementById('dd-gen-seed') : null;
            if (input) input.value = raw.seed;
        }
        try {
            const recipe = DocsDoodads.Generate.recipe(raw, map);
            if (recipe.w > map.width || recipe.h > map.height) throw new Error(`Preview must fit this ${map.width} x ${map.height} MZ map.`);
            const rooms = this.generatedRooms(), missing = recipe.roomIds.filter(id => !rooms.some(room => String(room.id) === id));
            if (missing.length) throw new Error(`Room stamp not found: ${missing.join(', ')}`);
            const seed = DocsDoodads.Generate.seed(raw.seed), layout = DocsDoodads.Generate.layout(recipe, seed, rooms);
            this._generatedPreview = { mapId, map, seed, recipe, layout,
                pathKeys: new Set((layout.paths || []).map(tile => `${tile.x},${tile.y}`)) };
            this.setPlacementTool('generate');
            if (this.redrawOverlay) this.redrawOverlay();
            return this._generatedPreview;
        } catch (error) {
            this._generatedPreview = null;
            if (this.showToast) this.showToast(error.message, 'error');
            return null;
        }
    },

    generatedDecorations(preview, existing, events) {
        return DocsDoodads.GenerateRuntime.decorations(preview.layout, preview.recipe, preview.mapId, preview.seed, existing, events);
    },

    applyGeneratedMap() {
        const preview = this._generatedPreview, map = this.liveMapData(), mapId = this.currentMapId();
        if (!preview || !map || preview.mapId !== mapId || preview.map !== map) return false;
        const staged = DocsDoodads.Persistence.stagedFor() || map, events = staged.events || map.events || [null];
        const list = window.$dataDocsDoodads[mapId] = window.$dataDocsDoodads[mapId] || [];
        const rooms = this.generatedRooms(), missing = preview.recipe.roomIds.filter(id => !rooms.some(room => String(room.id) === id));
        if (missing.length) { if (this.showToast) this.showToast(`Room stamp not found: ${missing.join(', ')}`, 'error'); return false; }
        const planMap = Object.assign({}, map, { events });
        const tile = this.tileSize();
        const plan = DocsDoodads.Generate.plan(preview.layout, preview.recipe, planMap, rooms, {
            mapId, tileWidth: tile.tw, tileHeight: tile.th
        });
        plan.doodads.push(...this.generatedDecorations(preview, list.concat(plan.doodads), plan.events));
        for (const doodad of plan.doodads) doodad._docsGeneratedMap = mapId;
        for (const event of plan.events) event._docsGeneratedMap = mapId;
        const beforeEvents = JSON.parse(JSON.stringify(events));
        const beforeMapEvents = map.events && map.events !== events ? JSON.parse(JSON.stringify(map.events)) : null;
        DocsDoodads.Undo.execute({
            type: 'generate_map', label: `Generate ${preview.recipe.kind} map`,
            apply: () => {
                plan.changes.forEach(change => this.setMapTile(mapId, change.index, change.after));
                plan.doodads.forEach(doodad => { if (!list.includes(doodad)) list.push(doodad); });
                plan.events.forEach(event => { events[event.id] = event; if (map.events && map.events !== events) map.events[event.id] = event; });
                DocsDoodads.Persistence.dirtyDoodads = true; DocsDoodads.Persistence.dirtyMap = true;
                this.afterTileEdit(); this.refreshSpriteset();
            },
            revert: () => {
                plan.changes.forEach(change => this.setMapTile(mapId, change.index, change.before));
                plan.doodads.forEach(doodad => { const index = list.indexOf(doodad); if (index >= 0) list.splice(index, 1); });
                events.splice(0, events.length, ...JSON.parse(JSON.stringify(beforeEvents)));
                if (beforeMapEvents) map.events.splice(0, map.events.length, ...JSON.parse(JSON.stringify(beforeMapEvents)));
                this.afterTileEdit(); this.refreshSpriteset();
            }
        });
        this._generatedPreview = null;
        this.setPlacementTool(null);
        if (this.showToast) this.showToast(`Generated ${preview.recipe.kind} from seed ${preview.seed}. Undo restores the whole map.`, 'success');
        return true;
    },

    closeGenerateCard() {
        this._generatedPreview = null;
        const card = typeof document !== 'undefined' ? document.getElementById('dd-generate-card') : null;
        if (card && card.parentNode) card.parentNode.removeChild(card);
        if (this.placementTool === 'generate') this.setPlacementTool(null);
    },

    // The size starts no bigger than the map, so the first Preview fits it.
    fitGenerateSize() {
        const o = this.generateOptions, map = this.liveMapData ? this.liveMapData() : null;
        if (map && map.width > 0 && map.height > 0) {
            o.w = Math.min(Number(o.w) || map.width, map.width);
            o.h = Math.min(Number(o.h) || map.height, map.height);
        }
        // A floor or wall tile whose sheet this map's tileset doesn't have draws nothing, so a default
        // (never one the user typed) moves to a sheet it has: walls A3, A4, then A2; floors A2, A5, then A1.
        const ts = map && typeof $dataTilesets !== 'undefined' && $dataTilesets ? $dataTilesets[map.tilesetId] : null;
        const names = ts && Array.isArray(ts.tilesetNames) ? ts.tilesetNames : null;
        if (names) {
            const T = DocsDoodads.Tiles, sheets = [[T.A5, 4], [T.A1, 0], [T.A2, 1], [T.A3, 2], [T.A4, 3]];
            const has = id => { const sheet = sheets.filter(([start]) => id >= start).pop(); return !!names[sheet ? sheet[1] : 5 + Math.floor(id / 256)]; };
            // Each autotile kind of a sheet the tileset has, blocked (wall) or walkable (floor) by its own flags.
            const flags = Array.isArray(ts.flags) ? ts.flags : [];
            const kinds = (start, end) => { const out = []; for (let id = start; id < end; id += 48) if (has(id)) out.push(id); return out; };
            const blocked = id => ((flags[id] || 0) & 0x0f) === 0x0f;
            const pick = (ranges, wanted) => {
                const all = [].concat(...ranges.map(([a, b]) => kinds(a, b)));
                return all.find(id => blocked(id) === wanted) || null;
            };
            if (!this._generateTilesTyped && !has(o.floorTile)) o.floorTile = pick([[T.A2, T.A3], [T.A1, T.A2]], false) || o.floorTile;
            if (!this._generateTilesTyped && (!has(o.wallTile) || o.wallTile === o.floorTile)) {
                o.wallTile = pick([[T.A3, T.A4], [T.A4, T.MAX], [T.A2, T.A3]], true)
                    || [].concat(kinds(T.A3, T.A4), kinds(T.A4, T.MAX), kinds(T.A2, T.A3)).find(id => id !== o.floorTile) || o.wallTile;
            }
        }
        return o;
    },

    showGenerateCard() {
        if (typeof document === 'undefined') return null;
        this.fitGenerateSize();
        const U = DocsDoodads.Ui, rooms = this.generatedRooms(), biomes = DocsDoodads.World.get('biomes.list') || [], o = this.generateOptions;
        let card = document.getElementById('dd-generate-card');
        if (!card) { card = document.createElement('div'); card.id = 'dd-generate-card'; card.className = 'dd-glass'; document.body.appendChild(card); }
        const input = (id, label, value, type = 'number') => `<label>${label}<input id="${id}" type="${type}" value="${escapeHtml(String(value))}" /></label>`;
        card.innerHTML = `<div class="dd-panel-head"><span class="dd-grow">${U.icon('map', 1)} Generate Map</span><button class="dd-btn" id="dd-gen-close">${U.icon('close', 1)}</button></div>
            <div class="dd-gen-grid"><label>Kind<select id="dd-gen-kind"><option value="dungeon" ${o.kind === 'dungeon' ? 'selected' : ''}>Dungeon</option><option value="wilderness" ${o.kind === 'wilderness' ? 'selected' : ''}>Wilderness</option></select></label>
            ${input('dd-gen-seed', 'Seed', o.seed, 'text')}${input('dd-gen-w', 'Width', o.w)}${input('dd-gen-h', 'Height', o.h)}${input('dd-gen-count', 'Rooms', o.count)}
            ${input('dd-gen-floor', 'Floor tile ID', o.floorTile)}${input('dd-gen-wall', 'Wall tile ID', o.wallTile)}${input('dd-gen-path', 'Path tile ID', o.pathTile)}</div>
            <div><b>Room stamps</b> ${rooms.map((room, index) => `<label><input type="checkbox" id="dd-gen-room-${index}" ${(o.roomIds || []).includes(room.id) ? 'checked' : ''}/> ${escapeHtml(room.name)}</label>`).join('') || '<small>No saved rooms; plain rooms will be used.</small>'}</div>
            <div><b>Wilderness biomes</b> ${biomes.map((biome, index) => { const picked = (o.biomes || []).find(item => item.id === biome.id); return `<label style="grid-template-columns:auto 1fr 70px;align-items:center"><input type="checkbox" id="dd-gen-biome-${index}" ${picked ? 'checked' : ''}/> ${escapeHtml(biome.name)} <input type="number" id="dd-gen-biome-tile-${index}" value="${picked && picked.tile || o.floorTile}" title="MZ tile ID for this biome"/></label>`; }).join('') || '<small>Make a biome in Map Details first.</small>'}</div>
            <div style="display:flex;gap:6px"><button class="dd-btn" id="dd-gen-preview">Preview</button><button class="dd-btn" id="dd-gen-reroll">Reroll</button><button class="dd-btn dd-btn-primary" id="dd-gen-apply">Apply</button></div>
            <small>Preview changes nothing. Apply writes tiles, room events and doodads as one undo step.</small>`;
        const on = (id, fn) => { const element = document.getElementById(id); if (element) element.onclick = fn; };
        on('dd-gen-close', () => this.closeGenerateCard()); on('dd-gen-preview', () => this.previewGeneratedMap(false));
        on('dd-gen-reroll', () => this.previewGeneratedMap(true)); on('dd-gen-apply', () => this.applyGeneratedMap());
        for (const id of ['dd-gen-floor', 'dd-gen-wall']) { const field = document.getElementById(id); if (field) field.addEventListener('change', () => { this._generateTilesTyped = true; }); }
        return card;
    }
});

DocsDoodads.Workspace.toolHooks.generate = {
    overlay(g) {
        const preview = this._generatedPreview;
        if (!preview || preview.mapId !== this.currentMapId() || !g || typeof $gameMap === 'undefined') return;
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight(), color = DocsDoodads.Ui.mapColor('selection');
        if (preview.layout.kind === 'dungeon') {
            g.lineStyle(1, color, 0.7); g.beginFill(color, 0.12);
            for (const room of preview.layout.rooms) g.drawRect($gameMap.adjustX(room.x) * tw, $gameMap.adjustY(room.y) * th, room.w * tw, room.h * th);
            g.endFill(); g.lineStyle(0);
            return;
        }
        // A 256x256 recipe is still only a screenful of work each frame. The screen-cell coordinates keep
        // loop-map seams covered without walking every generated cell or rebuilding a path lookup.
        const layout = preview.layout, width = layout.w, height = layout.h;
        const displayX = $gameMap.displayX(), displayY = $gameMap.displayY();
        const across = Math.ceil($gameMap.screenTileX()) + 2, down = Math.ceil($gameMap.screenTileY()) + 2;
        const startX = Math.floor(displayX) - 1, startY = Math.floor(displayY) - 1;
        const loopX = $gameMap.isLoopHorizontal(), loopY = $gameMap.isLoopVertical();
        const ids = (preview.recipe.biomes || []).map(biome => biome.id);
        const colors = ['selection', 'brushPaint', 'guideSpacing', 'guideTile', 'mirror', 'added', 'changed', 'warning'];
        const pathKeys = preview.pathKeys || new Set();
        g.lineStyle(0);
        for (let sy = startY; sy < startY + down; sy++) for (let sx = startX; sx < startX + across; sx++) {
            if ((!loopX && (sx < 0 || sx >= width)) || (!loopY && (sy < 0 || sy >= height))) continue;
            const x = loopX ? ((sx % width) + width) % width : sx, y = loopY ? ((sy % height) + height) % height : sy;
            if (x < 0 || y < 0 || x >= width || y >= height) continue;
            const biomeId = layout.biomeIds[y * width + x];
            if (biomeId !== undefined && biomeId !== null) {
                const index = Math.max(0, ids.indexOf(biomeId));
                g.beginFill(DocsDoodads.Ui.mapColor(colors[index % colors.length]), 0.14);
                g.drawRect((sx - displayX) * tw, (sy - displayY) * th, tw, th); g.endFill();
            }
            if (pathKeys.has(`${x},${y}`)) {
                g.beginFill(DocsDoodads.Ui.mapColor('path'), 0.3);
                g.drawRect((sx - displayX) * tw, (sy - displayY) * th, tw, th); g.endFill();
            }
        }
    }
};

const generateMapLoaded = DocsDoodads.Workspace.onMapLoaded;
DocsDoodads.Workspace.onMapLoaded = function() {
    this.closeGenerateCard();
    return generateMapLoaded.call(this);
};
