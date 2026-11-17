//==========================================================
// SECTION 17D: GENERATED MAP RUNTIME
//==========================================================
DocsDoodads.GenerateRuntime = {
    rooms: [],
    setRooms(rooms) { this.rooms = Array.isArray(rooms) ? rooms.filter(Boolean) : []; return this.rooms; },
    requestRooms() {
        if (typeof DataManager === 'undefined' || typeof DataManager.docsRequest !== 'function') return;
        DataManager.docsRequest('data/DocsDoodadsRooms.json', xhr => {
            if (xhr.status >= 400 || !xhr.responseText) return this.setRooms([]);
            try { this.setRooms((JSON.parse(xhr.responseText) || {}).rooms); }
            catch (error) { this.setRooms([]); console.warn('[DocsDoodads] Room stamps could not be read:', error); }
        });
    },
    records() {
        if (typeof $gameSystem === 'undefined' || !$gameSystem) return null;
        return $gameSystem._docsGeneratedMaps = $gameSystem._docsGeneratedMaps || {};
    },
    isMaterialized(mapId) {
        const entry = this._materialized && this._materialized[Number(mapId) || 0];
        return Boolean(entry && typeof $dataMap !== 'undefined' && entry.map === $dataMap);
    },
    queue(raw = {}) {
        const records = this.records();
        if (!records) return null;
        const mapId = Math.max(1, Math.floor(Number(raw.mapId) || (typeof $gameMap !== 'undefined' && $gameMap ? $gameMap.mapId() : 1)));
        const recipe = DocsDoodads.Generate.recipe(raw);
        const seed = DocsDoodads.Generate.seed(raw.seed);
        if (this._materialized) delete this._materialized[mapId];
        return records[mapId] = { seed, recipe };
    },
    command(args = {}) {
        const variableId = Math.max(0, Math.floor(Number(args.seedVariable) || 0));
        const value = variableId && typeof $gameVariables !== 'undefined' && $gameVariables ? $gameVariables.value(variableId) : args.seed;
        return this.queue(Object.assign({}, args, { seed: value === '' || value === undefined ? Date.now() : value }));
    },
    sourceFor(map) {
        if (!this._sources) this._sources = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
        if (!this._sources) return { data: (map.data || []).slice(), events: JSON.parse(JSON.stringify(map.events || [])) };
        let source = this._sources.get(map);
        if (!source) {
            source = { data: (map.data || []).slice(), events: JSON.parse(JSON.stringify(map.events || [])) };
            this._sources.set(map, source);
        }
        return source;
    },
    makeDoodad(placement, mapId, seed, index) {
        const doodad = DocsDoodads.standardStruct();
        doodad.bit = [3, placement.path]; doodad.x = Math.round(placement.x); doodad.y = Math.round(placement.y);
        doodad.scaleX = placement.scale * (placement.flipX ? -1 : 1); doodad.scaleY = placement.scale;
        doodad.frameW = 48; doodad.frameH = 48; doodad.dressed = true;
        doodad.uid = `dd_gen_${mapId}_${seed}_${index}`; doodad._docsGeneratedMap = mapId;
        return doodad;
    },
    decorations(layout, recipe, mapId, seed, existing, events) {
        const tw = typeof $gameMap !== 'undefined' && $gameMap && $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
        const th = typeof $gameMap !== 'undefined' && $gameMap && $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
        const definitions = DocsDoodads.World.get('biomes.list') || [], rng = DocsDoodads.Generate.rng(seed ^ 0x6c8e9cf5), placements = [];
        if (layout.kind === 'wilderness') for (const chosen of recipe.biomes) {
            const raw = DocsDoodads.Biome.find(chosen.id, definitions), biome = raw && DocsDoodads.Biome.normalize(raw);
            if (!biome || !biome.entries.length) continue;
            const tiles = [];
            for (let i = 0; i < layout.biomeIds.length; i++) if (layout.biomeIds[i] === chosen.id) tiles.push({ x: i % layout.w, y: Math.floor(i / layout.w) });
            if (!tiles.length) continue;
            const center = { x: (tiles.reduce((sum, tile) => sum + tile.x, 0) / tiles.length + 0.5) * tw,
                y: (tiles.reduce((sum, tile) => sum + tile.y, 0) / tiles.length + 0.5) * th };
            const radius = Math.max(tw, th) * Math.sqrt(tiles.length / Math.PI);
            for (const placement of DocsDoodads.Biome.paint(biome, center, radius, existing.concat(placements), rng)) {
                const tx = Math.floor(placement.x / tw), ty = Math.floor(placement.y / th);
                if (layout.biomeIds[ty * layout.w + tx] === chosen.id) placements.push(placement);
            }
        }
        if (recipe.dress) {
            const floor = new Set((layout.floor || []).map(tile => `${tile.x},${tile.y}`));
            const eventTiles = new Set((events || []).map(event => `${event.x},${event.y}`));
            const query = { width: layout.w, height: layout.h, isWater: () => false,
                isPassable: (x, y) => layout.kind === 'wilderness' || floor.has(`${x},${y}`),
                regionId: () => 0, terrainTag: () => 0, hasEvent: (x, y) => eventTiles.has(`${x},${y}`), hasGround: () => true };
            placements.push(...DocsDoodads.Dress.plan(DocsDoodads.World.get('dress.rules') || [], query,
                existing.concat(placements), tw, th, rng));
        }
        return placements.map((placement, index) => this.makeDoodad(placement, mapId, seed, index));
    },
    prepare(mapId, map, record) {
        if (record.recipe.w > map.width || record.recipe.h > map.height) {
            throw new Error(`Generated map is ${record.recipe.w}x${record.recipe.h}, larger than its MZ map ${map.width}x${map.height}.`);
        }
        const missing = record.recipe.roomIds.filter(id => !this.rooms.some(room => String(room.id) === id));
        if (missing.length) throw new Error(`Room stamp${missing.length === 1 ? '' : 's'} not loaded: ${missing.join(', ')}`);
        const source = this.sourceFor(map), base = Object.assign({}, map, {
            data: source.data.slice(), events: JSON.parse(JSON.stringify(source.events))
        });
        const layout = DocsDoodads.Generate.layout(record.recipe, record.seed, this.rooms);
        const plan = DocsDoodads.Generate.plan(layout, record.recipe, base, this.rooms);
        const current = typeof $dataDocsDoodads !== 'undefined' && $dataDocsDoodads && Array.isArray($dataDocsDoodads[mapId]) ? $dataDocsDoodads[mapId] : [];
        const authored = current.filter(doodad => !doodad || doodad._docsGeneratedMap !== mapId);
        plan.doodads.push(...this.decorations(layout, record.recipe, mapId, record.seed, authored.concat(plan.doodads), plan.events));
        return { source, layout, plan, authored };
    },
    apply(mapId, map) {
        const records = this.records(), record = records && records[mapId];
        this._materialized = this._materialized || {};
        delete this._materialized[mapId];
        if (!record || !map || !Array.isArray(map.data)) return null;
        let ready;
        try { ready = this.prepare(mapId, map, record); }
        catch (error) {
            console.warn(`[DocsDoodads] Map ${mapId} was not generated:`, error);
            return null;
        }
        const { source, layout, plan, authored } = ready;
        map.data = source.data.slice(); map.events = JSON.parse(JSON.stringify(source.events));
        for (const change of plan.changes) map.data[change.index] = change.after;
        map.events = map.events || [null];
        for (const event of plan.events) { event._docsGeneratedMap = mapId; map.events[event.id] = event; }
        if (typeof $dataDocsDoodads !== 'undefined' && $dataDocsDoodads) {
            const list = $dataDocsDoodads[mapId] = authored;
            for (const doodad of plan.doodads) { doodad._docsGeneratedMap = mapId; list.push(doodad); }
        }
        this._materialized[mapId] = { map, seed: record.seed };
        return { layout, plan };
    },
    afterExtract() { this._materialized = {}; this._afterSaveLoad = true; },
    beforeLoadedScene() {
        if (!this._afterSaveLoad) return null;
        this._afterSaveLoad = false;
        const mapId = typeof $gameMap !== 'undefined' && $gameMap ? $gameMap.mapId() : 0;
        const generated = this.apply(mapId, typeof $dataMap !== 'undefined' ? $dataMap : null);
        if (generated && DocsDoodads.Shipped && DocsDoodads.Shipped.migrateSaved) DocsDoodads.Shipped.migrateSaved(mapId);
        return generated;
    }
};

if (typeof DataManager !== 'undefined' && typeof DataManager.loadDatabase === 'function') {
    $.DataManager_loadDatabase_generate = DataManager.loadDatabase;
    DataManager.loadDatabase = function() {
        $.DataManager_loadDatabase_generate.call(this);
        DocsDoodads.GenerateRuntime.requestRooms();
    };
    if (typeof DataManager.extractSaveContents === 'function') {
        $.DataManager_extractSaveContents_generate = DataManager.extractSaveContents;
        DataManager.extractSaveContents = function(contents) {
            $.DataManager_extractSaveContents_generate.call(this, contents);
            DocsDoodads.GenerateRuntime.afterExtract();
        };
    }
}

if (typeof Game_Map !== 'undefined') {
    $.Game_Map_setup_generate = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        const generated = DocsDoodads.GenerateRuntime.apply(Number(mapId) || 0, typeof $dataMap !== 'undefined' ? $dataMap : null);
        const result = $.Game_Map_setup_generate.call(this, mapId);
        if (generated && DocsDoodads.Shipped && DocsDoodads.Shipped.migrateSaved) DocsDoodads.Shipped.migrateSaved(mapId);
        return result;
    };
}

if (typeof Scene_Map !== 'undefined' && typeof Scene_Map.prototype.onMapLoaded === 'function') {
    $.Scene_Map_onMapLoaded_generate = Scene_Map.prototype.onMapLoaded;
    Scene_Map.prototype.onMapLoaded = function() {
        DocsDoodads.GenerateRuntime.beforeLoadedScene();
        return $.Scene_Map_onMapLoaded_generate.call(this);
    };
}

if (typeof PluginManager !== 'undefined' && typeof PluginManager.registerCommand === 'function') {
    PluginManager.registerCommand(pluginName, 'generateMap', args => DocsDoodads.GenerateRuntime.command(args));
}
