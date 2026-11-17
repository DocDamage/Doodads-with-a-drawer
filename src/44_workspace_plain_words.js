// @editor-only
// All phrase plans resolve through the same closed set as explicitly typed palette values.
(() => {
    const W = DocsDoodads.Workspace, values = W.paletteValueCommands;
    Object.assign(W, {
        previewPaletteWeather(type) {
            if (!this.mounted || typeof $gameScreen === 'undefined' || !$gameScreen) return;
            this.endMoodPreview();
            const weather = {};
            for (const key of ['_weatherType', '_weatherPower', '_weatherPowerTarget', '_weatherDuration']) weather[key] = $gameScreen[key];
            const M = DocsDoodads.Moods;
            this._moodPreview = { mapId: this.currentMapId(), settings: M.clone(DocsDoodads.Lighting.mapSettings(this.currentMapId()) || {}),
                time: this.previewMinutes, weather, wind: typeof $gameSystem !== 'undefined' && $gameSystem ? M.clone($gameSystem._docsWind) : undefined };
            $gameScreen.changeWeather(type, type === 'none' ? 0 : 5, 0);
            this.refreshMoodPreview();
        },
        plainValueCommands(query) {
            const q = String(query || '').trim().toLowerCase();
            const command = (label, run) => [{ label, group: 'Map / Look', run: () => { if (this.mounted) run(); } }];
            const weather = /^weather (none|rain|snow|storm)$/.exec(q);
            if (weather) return command(`Preview weather: ${weather[1]}`, () => this.previewPaletteWeather(weather[1]));
            const size = /^size (bigger|smaller)$/.exec(q);
            if (size) {
                const scales = DocsDoodads.Ui.scales, current = Number(DocsDoodads.Ui.prefs().uiScale) || 1;
                const available = scales.filter(value => size[1] === 'bigger' ? value > current : value < current);
                const next = size[1] === 'bigger' ? available[0] : available[available.length - 1];
                return next ? command(`Editor size ${Math.round(next * 100)}%`, () => this.setLook('uiScale', next)) : [];
            }
            const darkness = /^darkness (darker|brighter)$/.exec(q);
            if (darkness) {
                const ambient = Object.assign({ switchId: 0 }, DocsDoodads.currentAmbient(id => $gameSwitches.value(id)));
                ambient.darkness = Math.max(0, Math.min(1, Number(ambient.darkness || 0) + (darkness[1] === 'darker' ? 0.15 : -0.15)));
                return command(`Set map darkness to ${Math.round(ambient.darkness * 100)}%`, () => {
                    this.endMoodPreview();
                    const mapId = this.currentMapId(), M = DocsDoodads.Moods;
                    const before = M.clone(DocsDoodads.Lighting.mapSettings(mapId));
                    const after = Object.assign({}, before || {}, { ambient: M.clone(ambient), dayNight: 'off' });
                    const write = value => { this.writeMapSettings(mapId, value); this.afterMapSettings(); };
                    DocsDoodads.Undo.execute({ type: 'map_setting', label: 'Map darkness', apply: () => write(after), revert: () => write(before) });
                });
            }
            const fog = /^fog (on|off)$/.exec(q);
            if (fog) return command(fog[1] === 'on' ? 'Add fog to this map' : 'Remove fog layers from this map', () => {
                this.endMoodPreview();
                const own = DocsDoodads.Lighting.mapSettings(this.currentMapId()) || {};
                const layers = (own.layers2d || []).filter(layer => layer && (fog[1] === 'on' ? !layer.plainWords : layer.image !== '#fog'));
                if (fog[1] === 'on') layers.push({ image: '#fog', place: 'front', opacity: 0.3, zoom: 2, follow: 1,
                    scrollX: 0.2, scrollY: 0, blend: 'screen', wind: true, plainWords: true });
                this.setMapSetting('layers2d', layers.length ? layers : undefined); this.afterMapSettings();
            });
            return [];
        }
    });
    W.paletteValueCommands = function(query) {
        const direct = values.call(this, query).concat(this.plainValueCommands(query));
        if (direct.length) return direct;
        const plan = DocsDoodads.PlainWords.parse(String(query || ''), text => DocsDoodads.I18n.t(text));
        if (!plan.length) return [];
        const steps = plan.map(step => values.call(this, step.command).concat(this.plainValueCommands(step.command))[0]);
        if (steps.some(step => !step)) return [];
        return [{ label: steps.map(step => step.label).join(' → '), group: 'These commands · Enter to run',
            run: () => {
                if (!this.mounted) return;
                this.endMoodPreview();
                for (const step of steps) step.run();
            } }];
    };
    // Existing map-navigation and close hooks call closeMoods; end the weather preview before transfer.
    const goToMap = W.goToMap;
    W.goToMap = function(mapId) {
        if (mapId && Number(mapId) !== this.currentMapId() && this._moodPreview) this.endMoodPreview();
        return goToMap.apply(this, arguments);
    };
})();
