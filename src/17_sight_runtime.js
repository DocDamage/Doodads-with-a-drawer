//==========================================================
// SECTION 7M: LIGHT QUERIES AND EVENT SIGHT RUNTIME
//==========================================================
DocsDoodads.SightRuntime = {
    cadence: 12,
    budget: 24,
    _cursor: 0,
    _lastFrame: -1,
    _lastSeen: typeof WeakMap !== 'undefined' ? new WeakMap() : null,
    _info: null,
    _mapScan: null,
    _darkSwitchId: 0,

    reset() {
        this._cursor = 0; this._lastFrame = -1; this._info = null; this._mapScan = null;
        this._lastSeen = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
    },

    mapHas(dataMap) {
        if (!dataMap) return false;
        if (this._mapScan && this._mapScan.data === dataMap) return this._mapScan.has;
        const tag = /<\s*docs\s+sight\s*:/i;
        const has = (dataMap.events || []).some(event => event && (tag.test(String(event.note || '')) ||
            (event.pages || []).some(page => (page.list || []).some(command => command && (command.code === 108 || command.code === 408)
                && tag.test(String((command.parameters || [])[0] || ''))))));
        this._mapScan = { data: dataMap, has };
        return has;
    },

    infoFor(event) {
        if (!event || event._erased || !event.page || !event.page()) return null;
        const source = event.event ? event.event() : null;
        const pageText = DocsDoodads.Sight.pageText(source, event._pageIndex);
        const noteText = String(source && source.note || '');
        const text = event._pageIndex + '|' + pageText + '|' + noteText;
        const cache = this._eventInfo = this._eventInfo || (typeof WeakMap !== 'undefined' ? new WeakMap() : null);
        const hit = cache && cache.get(event);
        if (hit && hit.text === text) return hit.info;
        const info = DocsDoodads.Sight.parse(pageText) || DocsDoodads.Sight.parse(noteText);
        if (cache) cache.set(event, { text, info });
        return info;
    },

    lightInfo() {
        if (typeof $gameMap === 'undefined' || !$gameMap) return { base: [1, 1, 1], lights: [] };
        const L = DocsDoodads.Lighting, world = DocsDoodads.World.settings(), mapSettings = L.mapSettings($gameMap.mapId());
        const fade = typeof $gameSystem !== 'undefined' && $gameSystem ? $gameSystem._docsAmbientFade : null;
        const ambient = L.resolveAmbient({ world, minutes: DocsDoodads.Atmosphere.minutes(), mapSettings,
            override: fade ? fade.current : null, switchValue: id => $gameSwitches && $gameSwitches.value(id) });
        const doodads = (DocsDoodads.doodads() || []).filter(d => d && d.posMode !== 0 && d.light && d.light.enabled && !d._docsLeaving
            && DocsDoodads.Layers.visibleInGame(d, mapSettings) && DocsDoodads.Appearance.isVisible(d, { editing: false }));
        const lights = L.collect(doodads, (x, y) => ({ x, y }), {
            darkness: ambient.darkness, threshold: world.time.lampThreshold, step: 1, freeze: true, gameplay: true
        });
        if (typeof $gamePlayer !== 'undefined' && DocsDoodads.Flashlight) {
            const scene = typeof SceneManager !== 'undefined' ? SceneManager._scene : null;
            const spriteset = scene && scene._spriteset;
            const flashlight = DocsDoodads.Flashlight.descriptor($gamePlayer, $gameMap, spriteset && spriteset._docsFlashAngle);
            if (flashlight) lights.push(flashlight);
        }
        return { base: L.lightmapBase(ambient), lights };
    },

    context() {
        const map = $gameMap, tw = map.tileWidth(), th = map.tileHeight();
        return { mapCoordinates: true, tileWidth: tw, tileHeight: th, shapes: true,
            isWall: DocsDoodads.Occlusion.wallQuery(map), occlusion: DocsDoodads.Occlusion.settings(),
            deltaX: (x, lightX) => map.deltaX(x / tw, lightX / tw) * tw,
            deltaY: (y, lightY) => map.deltaY(y / th, lightY / th) * th };
    },

    levelAtTile(tileX, tileY, info) {
        if (typeof $gameMap === 'undefined' || !$gameMap) return 0;
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        return DocsDoodads.Lighting.levelAt(($gameMap.roundX(Number(tileX) || 0) + 0.5) * tw,
            ($gameMap.roundY(Number(tileY) || 0) + 0.5) * th, info || this.lightInfo(), this.context());
    },

    wallAt(x, y) { return DocsDoodads.Occlusion.wallQuery($gameMap)(x, y); },

    seesEvent(event, info, level) {
        info = info || this.infoFor(event);
        if (!info || typeof $gamePlayer === 'undefined' || !$gamePlayer) return false;
        const dx = $gameMap.deltaX($gamePlayer._realX, event._realX), dy = $gameMap.deltaY($gamePlayer._realY, event._realY);
        const wall = (x, y) => this.wallAt($gameMap.roundX(event.x + x), $gameMap.roundY(event.y + y));
        return DocsDoodads.Sight.sees({ x: 0.5, y: 0.5 }, event.direction(), { x: dx + 0.5, y: dy + 0.5 }, {
            range: info.range, spread: info.spread, minLevel: info.minLevel,
            level: level === undefined ? this.levelAtTile($gamePlayer._realX, $gamePlayer._realY) : level, isWall: wall
        });
    },

    act(event, info) {
        if (info.commonEvent > 0) {
            if ($gameTemp.isCommonEventReserved && $gameTemp.isCommonEventReserved()) return false;
            if (!$gameTemp.reserveCommonEvent) return false;
            $gameTemp.reserveCommonEvent(info.commonEvent);
            return true;
        } else if (info.selfSwitch && typeof $gameSelfSwitches !== 'undefined' && $gameSelfSwitches) {
            $gameSelfSwitches.setValue([$gameMap.mapId(), event.eventId(), info.selfSwitch], true);
            return true;
        }
        return false;
    },

    update(force, sceneActive = true) {
        if (typeof $gameMap === 'undefined' || !$gameMap || typeof $dataMap === 'undefined' || !$dataMap) return false;
        if (!force && (sceneActive === false || DocsDoodads.Workspace && DocsDoodads.Workspace.mounted)) return false;
        const frame = DocsDoodads.frameCount();
        if (!force && (frame === this._lastFrame || frame % this.cadence !== 0)) return false;
        this._lastFrame = frame;
        const settings = DocsDoodads.Occlusion.settings(), hasSight = this.mapHas($dataMap);
        const darkSwitch = Math.max(0, Math.floor(Number(settings.darkSwitchId) || 0));
        if (this._darkSwitchId && this._darkSwitchId !== darkSwitch && typeof $gameSwitches !== 'undefined' && $gameSwitches) {
            $gameSwitches.setValue(this._darkSwitchId, false);
        }
        this._darkSwitchId = darkSwitch;
        if (!hasSight && !darkSwitch) return true;
        this._info = this.lightInfo();
        const playerLevel = typeof $gamePlayer !== 'undefined' && $gamePlayer
            ? this.levelAtTile($gamePlayer._realX, $gamePlayer._realY, this._info) : 0;
        const rawDarkLevel = Number(settings.darkLevel);
        const darkLevel = Number.isFinite(rawDarkLevel) ? Math.max(0, Math.min(1, rawDarkLevel)) : 0.3;
        if (darkSwitch && typeof $gameSwitches !== 'undefined' && $gameSwitches) $gameSwitches.setValue(darkSwitch, playerLevel < darkLevel);
        if (!hasSight) return true;
        const events = $gameMap.events().filter(event => this.infoFor(event));
        if (!events.length) return true;
        const count = Math.min(this.budget, events.length);
        for (let i = 0; i < count; i++) {
            const event = events[(this._cursor + i) % events.length], info = this.infoFor(event);
            const near = !event.isNearTheScreen || event.isNearTheScreen();
            const seen = near && this.seesEvent(event, info, playerLevel);
            const before = this._lastSeen && this._lastSeen.get(event) === true;
            const acted = seen && !before ? this.act(event, info) : true;
            if (this._lastSeen) this._lastSeen.set(event, seen && acted);
        }
        this._cursor = (this._cursor + count) % events.length;
        return true;
    }
};

if (typeof Game_Map !== 'undefined') {
    const setup = Game_Map.prototype.setup, update = Game_Map.prototype.update;
    Game_Map.prototype.setup = function(mapId) { const result = setup.call(this, mapId); DocsDoodads.SightRuntime.reset(); return result; };
    Game_Map.prototype.update = function(sceneActive) { update.call(this, sceneActive); DocsDoodads.SightRuntime.update(false, sceneActive); };
}

if (typeof DataManager !== 'undefined') {
    if (typeof DataManager.extractSaveContents === 'function') {
        const extract = DataManager.extractSaveContents;
        DataManager.extractSaveContents = function(contents) { const result = extract.call(this, contents); DocsDoodads.SightRuntime.reset(); DocsDoodads.SightRuntime._darkSwitchId = 0; return result; };
    }
    if (typeof DataManager.createGameObjects === 'function') {
        const create = DataManager.createGameObjects;
        DataManager.createGameObjects = function() { const result = create.call(this); DocsDoodads.SightRuntime.reset(); DocsDoodads.SightRuntime._darkSwitchId = 0; return result; };
    }
}

if (typeof PluginManager !== 'undefined' && PluginManager.registerCommand) {
    PluginManager.registerCommand(pluginName, 'storeLightLevel', args => {
        const id = Math.max(0, Math.floor(Number(args.variableId) || 0));
        if (id && typeof $gameVariables !== 'undefined' && $gameVariables) $gameVariables.setValue(id,
            DocsDoodads.SightRuntime.levelAtTile(Number(args.tileX) || 0, Number(args.tileY) || 0));
    });
}
