//==========================================================
// SECTION 7N: ISOLATED LIVE MAP TITLE
//==========================================================
(function() {
    const T = DocsDoodads.TitleMap;
    const globals = ['$dataMap', '$gameTemp', '$gameSystem', '$gameScreen', '$gameTimer', '$gameMessage',
        '$gameSwitches', '$gameVariables', '$gameSelfSwitches', '$gameActors', '$gameParty', '$gameTroop', '$gameMap', '$gamePlayer'];
    const root = typeof window !== 'undefined' ? window : globalThis;
    // These caches are renderer state rather than game data, but they are mutable and map-specific. A title
    // spriteset must not reset the live game's climate, advance its lamp fades or consume its screen effects.
    const transients = [
        { id: 'climate', object: () => DocsDoodads.Climate,
            keys: ['_key', '_plan', '_fog', '_fogComposite', '_fogPower', '_ownsWind', '_writing'],
            fresh: { _key: null, _plan: null, _fog: null, _fogComposite: null, _fogPower: 0, _ownsWind: false, _writing: false } },
        { id: 'lighting', object: () => DocsDoodads.Lighting, keys: ['_lampLevels'],
            fresh: { _lampLevels: () => typeof WeakMap !== 'undefined' ? new WeakMap() : null } },
        { id: 'postfx', object: () => DocsDoodads.PostFX, keys: ['_anims', '_resolved', '_runtimeFrame'],
            fresh: { _anims: () => [], _resolved: null, _runtimeFrame: -1 } }
    ];

    T.captureGlobals = function() {
        const out = {};
        for (const key of globals) out[key] = root[key];
        return out;
    };
    T.applyGlobals = function(values) { for (const key of globals) root[key] = values[key]; };
    T.captureTransients = function() {
        const state = {};
        for (const spec of transients) {
            const object = spec.object();
            if (!object) continue;
            state[spec.id] = {};
            for (const key of spec.keys) state[spec.id][key] = {
                own: Object.prototype.hasOwnProperty.call(object, key), value: object[key]
            };
        }
        return state;
    };
    T.applyTransients = function(state) {
        for (const spec of transients) {
            const object = spec.object(), values = state && state[spec.id];
            if (!object || !values) continue;
            for (const key of spec.keys) {
                const entry = values[key];
                if (entry && entry.own) object[key] = entry.value;
                else delete object[key];
            }
        }
    };
    T.freshTransients = function() {
        const state = {};
        for (const spec of transients) {
            state[spec.id] = {};
            for (const key of spec.keys) {
                const value = spec.fresh[key];
                state[spec.id][key] = { own: true, value: typeof value === 'function' ? value() : value };
            }
        }
        return state;
    };
    T.withContext = function(context, fn) {
        if (!context || typeof fn !== 'function') return undefined;
        if (this._activeContext === context) return fn();
        const before = this.captureGlobals(), beforeTransients = this.captureTransients(), previous = this._activeContext;
        this.applyGlobals(context); this.applyTransients(context._docsTitleTransients); this._activeContext = context;
        try { return fn(); }
        finally {
            for (const key of globals) context[key] = root[key];
            context._docsTitleTransients = this.captureTransients();
            this.applyGlobals(before); this.applyTransients(beforeTransients); this._activeContext = previous;
        }
    };

    T.makeContext = function(dataMap, settings) {
        const context = {
            $dataMap: dataMap,
            $gameTemp: new Game_Temp(), $gameSystem: new Game_System(), $gameScreen: new Game_Screen(),
            $gameTimer: new Game_Timer(), $gameMessage: new Game_Message(), $gameSwitches: new Game_Switches(),
            $gameVariables: new Game_Variables(), $gameSelfSwitches: new Game_SelfSwitches(), $gameActors: new Game_Actors(),
            $gameParty: new Game_Party(), $gameTroop: new Game_Troop(), $gameMap: new Game_Map(), $gamePlayer: new Game_Player(),
            settings
        };
        context._docsTitleTransients = this.freshTransients();
        return context;
    };

    const minutes = DocsDoodads.Atmosphere.minutes, season = DocsDoodads.Atmosphere.season;
    DocsDoodads.Atmosphere.minutes = function() {
        return T._activeContext ? T._activeContext.settings.time : minutes.apply(this, arguments);
    };
    DocsDoodads.Atmosphere.season = function() {
        return T._activeContext ? T._activeContext.settings.season : season.apply(this, arguments);
    };
    if (DocsDoodads.Climate && DocsDoodads.Climate.suppressed) {
        const climateSuppressed = DocsDoodads.Climate.suppressed;
        DocsDoodads.Climate.suppressed = function() {
            return T._activeContext ? false : climateSuppressed.apply(this, arguments);
        };
    }

    T.setupScene = function(scene, dataMap) {
        const settings = scene._docsTitleSettings, context = this.makeContext(dataMap, settings);
        scene._docsTitleContext = context;
        this.withContext(context, () => {
            $gameMap.setup(settings.mapId);
            // The first release is deliberately flat; a map's saved 3D setting must not silently opt the title in.
            $gameMap._docsCamera = { enabled: false };
            $gamePlayer.locate(settings.x, settings.y);
            if ($gamePlayer.setTransparent) $gamePlayer.setTransparent(true);
            else $gamePlayer._transparent = true;
            $gameSystem._docsSeason = settings.season;
            if (settings.look !== null) $gameSystem._docsLook = { current: JSON.parse(JSON.stringify(settings.look)), framesLeft: 0 };
            const climateWriting = DocsDoodads.Climate ? DocsDoodads.Climate._writing : undefined;
            if (DocsDoodads.Climate) DocsDoodads.Climate._writing = true;
            try { if ($gameScreen.changeWeather) $gameScreen.changeWeather(settings.weather.type, settings.weather.power, 0); }
            finally { if (DocsDoodads.Climate) DocsDoodads.Climate._writing = climateWriting; }
            const display = this.displayFor(this.frame(settings, 0), $gameMap);
            $gameMap.setDisplayPos(display.x, display.y);
            const spriteset = scene._docsTitleSpriteset = new Spriteset_Map();
            const update = spriteset.update;
            spriteset.update = function() {
                if (T._updatingSpriteset === this) return update.apply(this, arguments);
            };
            const render = spriteset.render;
            spriteset.render = function(renderer) { return T.withContext(context, () => render.call(this, renderer)); };
        });
        scene.addChildAt(scene._docsTitleSpriteset, 0);
        if (settings.pictures === 'hide') {
            if (scene._backSprite1) scene._backSprite1.visible = false;
            if (scene._backSprite2) scene._backSprite2.visible = false;
        }
        scene._docsTitleFrame = 0;
        return context;
    };

    T.updateScene = function(scene) {
        const context = scene._docsTitleContext, spriteset = scene._docsTitleSpriteset;
        if (!context || !spriteset) return;
        this.withContext(context, () => {
            if ($gameMap.refreshIfNeeded) $gameMap.refreshIfNeeded();
            if ($gameMap.updateParallax) $gameMap.updateParallax();
            for (const event of $gameMap.events ? $gameMap.events() : []) if (event && event.updateAnimation) event.updateAnimation();
            if ($gameScreen.update) $gameScreen.update();
            const display = this.displayFor(this.frame(context.settings, ++scene._docsTitleFrame), $gameMap);
            $gameMap.setDisplayPos(display.x, display.y);
            this._updatingSpriteset = spriteset;
            try { spriteset.update(); } finally { this._updatingSpriteset = null; }
        });
    };

    if (typeof Scene_Title === 'undefined') return;
    const create = Scene_Title.prototype.create, ready = Scene_Title.prototype.isReady;
    const update = Scene_Title.prototype.update, terminate = Scene_Title.prototype.terminate;
    Scene_Title.prototype.create = function() {
        const result = create.apply(this, arguments), settings = T.settings();
        if (settings.mapId > 0) {
            this._docsTitleSettings = settings;
            this._docsTitlePreviousDataMap = root.$dataMap;
            DataManager.loadMapData(settings.mapId);
        }
        return result;
    };
    Scene_Title.prototype.isReady = function() {
        if (!ready.apply(this, arguments)) return false;
        if (!this._docsTitleSettings || this._docsTitleContext) return true;
        if (!DataManager.isMapLoaded()) return false;
        const loaded = root.$dataMap;
        root.$dataMap = this._docsTitlePreviousDataMap;
        T.setupScene(this, loaded);
        return true;
    };
    Scene_Title.prototype.update = function() {
        T.updateScene(this);
        return update.apply(this, arguments);
    };
    Scene_Title.prototype.terminate = function() {
        const context = this._docsTitleContext, spriteset = this._docsTitleSpriteset;
        try { return context ? T.withContext(context, () => terminate.apply(this, arguments)) : terminate.apply(this, arguments); }
        finally {
            if (context && spriteset) T.withContext(context, () => spriteset.destroy({ children: true }));
            this._docsTitleSpriteset = null; this._docsTitleContext = null;
        }
    };
})();
