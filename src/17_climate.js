//==========================================================
// SECTION 7C: CLIMATE WEATHER OWNERSHIP AND FORECAST COMMANDS
//==========================================================
Object.assign(DocsDoodads.Climate, {
    reset() { this._key = null; this._plan = null; this._fog = null; this._fogComposite = null; },
    suppressed() {
        return this.enabled() && !(DocsDoodads.Workspace && DocsDoodads.Workspace.mounted)
            && typeof $gameMap !== 'undefined' && $gameMap && (DocsDoodads.Lighting.mapSettings($gameMap.mapId()) || {}).climate === 'none';
    },
    hold() {
        const state = this.state(true);
        if (state) state.held = true;
        this.reset();
        if (this._ownsWind) DocsDoodads.Wind.set('world');
        this._ownsWind = false;
    },
    resume() {
        const state = this.state(this.enabled());
        if (!state) return false;
        state.held = false; this.reset(); return true;
    },
    fogActive() { const state = this.state(); return this.enabled() && this._fog && !(state && state.held) && !this.suppressed() && !(DocsDoodads.Workspace && DocsDoodads.Workspace.mounted); },
    mapLayers(settings) {
        if (!this.fogActive()) return settings;
        const old = this._fogComposite;
        if (old && old.settings === settings && old.fog === this._fog) return old.value;
        const raw = settings && Array.isArray(settings.layers2d) ? settings.layers2d : [];
        const value = Object.assign({}, settings || {}, { layers2d: raw.concat([this._fog]) });
        this._fogComposite = { settings, fog: this._fog, value };
        return value;
    },
    perspective(settings) {
        if (!settings || !this.fogActive()) return settings;
        return Object.assign({}, settings, { fogStart: Math.min(settings.fogStart, 1), fogEnd: Math.min(settings.fogEnd, Math.max(4, 24 - this._fogPower * 2)) });
    },
    update(sceneActive) {
        if (sceneActive === false || (DocsDoodads.Workspace && DocsDoodads.Workspace.mounted)
            || typeof Scene_Map === 'undefined' || typeof SceneManager === 'undefined' || !(SceneManager._scene instanceof Scene_Map)) return;
        if (!this.enabled()) {
            if (this._ownsWind) DocsDoodads.Wind.set('world');
            this._ownsWind = false; this.reset(); return;
        }
        const state = this.state(true);
        if (this.suppressed()) {
            if (this._key !== 'indoors') {
                if (!state.held || this._ownsWind) DocsDoodads.Wind.set(0, 30);
                this._fog = null; this._key = 'indoors';
            }
            return;
        }
        if (state.held) return;
        const day = Math.max(1, DocsDoodads.Calendar.day()), season = this.season(), table = this.settings().seasons, seed = state.seed;
        let plan = this._plan;
        if (!plan || plan.day !== day || plan.season !== season || plan.table !== table || plan.seed !== seed) this._plan = plan = { day, season, table, seed, spans: this.day(day, season, table, seed) };
        const minutes = ((DocsDoodads.Atmosphere.minutes() % 1440) + 1440) % 1440;
        const index = plan.spans.findIndex(span => minutes >= span.start && minutes < span.end), span = plan.spans[Math.max(0, index)];
        const key = `${$gameMap.mapId()}:${day}:${season}:${seed}:${index}:${span.type}:${span.power}:${DocsDoodads.World._version}`;
        if (this._key === key) return;
        this._writing = true;
        try { $gameScreen.changeWeather(['rain', 'storm', 'snow'].includes(span.type) ? span.type : 'none', span.power, 180); }
        finally { this._writing = false; }
        if (span.type === 'windy') { DocsDoodads.Wind.set(span.power / 9, 180, 'right'); this._ownsWind = true; }
        else { DocsDoodads.Wind.set('world'); this._ownsWind = false; }
        this._fogPower = span.power;
        this._fog = span.type === 'fog' ? { image: '#fog', place: 'front', opacity: span.power / 12, follow: 0.5, scrollX: 0.2, scrollY: 0, zoom: 1, blend: 'normal', loopX: true, loopY: true, wind: true } : null;
        this._key = key;
    }
});
if (typeof Game_Screen !== 'undefined' && Game_Screen.prototype.changeWeather) {
    const weather = Game_Screen.prototype.changeWeather, type = Game_Screen.prototype.weatherType, power = Game_Screen.prototype.weatherPower;
    Game_Screen.prototype.changeWeather = function() {
        const C = DocsDoodads.Climate;
        if (!C._writing && C.enabled() && !(DocsDoodads.Workspace && DocsDoodads.Workspace.mounted)) C.hold();
        return weather.apply(this, arguments);
    };
    Game_Screen.prototype.weatherType = function() { return DocsDoodads.Climate.suppressed() ? 'none' : type.call(this); };
    Game_Screen.prototype.weatherPower = function() { return DocsDoodads.Climate.suppressed() ? 0 : power.call(this); };
}
if (typeof Game_Map !== 'undefined') {
    DocsDoodads.mapSteps.push('updateDocsClimate');
    Game_Map.prototype.updateDocsClimate = function(active) { DocsDoodads.Climate.update(active); };
    const setup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(id) { DocsDoodads.Climate.reset(); return setup.call(this, id); };
}
if (typeof DataManager !== 'undefined' && DataManager.extractSaveContents) {
    const extract = DataManager.extractSaveContents;
    DataManager.extractSaveContents = function() {
        const result = extract.apply(this, arguments);
        DocsDoodads.Climate._ownsWind = false; DocsDoodads.Climate.reset(); return result;
    };
}
if (typeof DataManager !== 'undefined' && DataManager.createGameObjects) {
    const create = DataManager.createGameObjects;
    DataManager.createGameObjects = function() {
        const result = create.apply(this, arguments);
        DocsDoodads.Climate._ownsWind = false; DocsDoodads.Climate.reset(); return result;
    };
}
if (typeof PluginManager !== 'undefined' && PluginManager.registerCommand) {
    PluginManager.registerCommand(pluginName, 'resumeClimate', () => DocsDoodads.Climate.resume());
    PluginManager.registerCommand(pluginName, 'storeForecast', args => {
        const id = Number(args.variableId) || 0;
        if (id > 0 && typeof $gameVariables !== 'undefined' && $gameVariables) $gameVariables.setValue(id, DocsDoodads.Climate.describe(DocsDoodads.Climate.forecast(Number(args.days) || 7)));
    });
}
