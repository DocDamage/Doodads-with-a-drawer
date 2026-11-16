// @editor-only
// Moods preview without changing the save state. Weather and wind are editor previews only.
Object.assign(DocsDoodads.Workspace, {
    refreshMoodPreview() {
        if (DocsDoodads.World) DocsDoodads.World.invalidate();
        this.refreshSpriteset(true);
    },

    previewMood(id) {
        const M = DocsDoodads.Moods, mood = M.get(id);
        if (!mood || !this.mounted) return false;
        this.endMoodPreview();
        const screen = window.$gameScreen, system = window.$gameSystem;
        const weather = {};
        for (const key of ['_weatherType', '_weatherPower', '_weatherPowerTarget', '_weatherDuration']) {
            weather[key] = screen ? screen[key] : undefined;
        }
        const mapId = this.currentMapId();
        const settings = M.apply(mapId, mood);
        this._moodPreview = { mapId, settings,
            time: this.previewMinutes, weather, wind: system ? M.clone(system._docsWind) : undefined };
        this.refreshMoodPreview();
        if (mood.time !== null) this.previewMinutes = mood.time;
        if (screen && typeof screen.changeWeather === 'function') screen.changeWeather(mood.weather.type, mood.weather.power, 0);
        if (system && mood.wind !== null) DocsDoodads.Wind.set(mood.wind, 0);
        return true;
    },

    endMoodPreview() {
        const before = this._moodPreview;
        if (!before) return false;
        this._moodPreview = null;
        this.refreshMoodPreview();
        this.previewMinutes = before.time;
        const screen = window.$gameScreen, system = window.$gameSystem;
        if (screen) for (const key of Object.keys(before.weather)) {
            if (before.weather[key] === undefined) delete screen[key];
            else screen[key] = before.weather[key];
        }
        if (system) {
            if (before.wind === undefined) delete system._docsWind;
            else system._docsWind = before.wind;
        }
        return true;
    },

    applyMood(id) {
        this.endMoodPreview();
        const M = DocsDoodads.Moods, mood = M.get(id), mapId = this.currentMapId();
        if (!mood) return null;
        const before = M.clone(DocsDoodads.Lighting.mapSettings(mapId));
        const next = M.apply(mapId, mood);
        DocsDoodads.Undo.execute({ type: 'map_setting', label: 'Mood: ' + mood.label,
            apply: () => { this.writeMapSettings(mapId, next); this.afterMapSettings(); },
            revert: () => { this.writeMapSettings(mapId, before); this.afterMapSettings(); } });
        return next;
    },

    async saveMood(name) {
        this.endMoodPreview();
        if (name === undefined) name = await DocsDoodads.Ui.prompt('A name for this mood.', '', { title: 'Save a mood', ok: 'Save' });
        if (!name || !String(name).trim()) return null;
        const existing = DocsDoodads.MapPresets.get(String(name).trim());
        if (existing && !(await DocsDoodads.Ui.confirm('Replace the saved mood or preset called ' + existing.name + '?', { title: 'Replace preset?', ok: 'Replace' }))) return null;
        const s = window.$gameScreen, wind = DocsDoodads.Wind.now(0, null);
        return DocsDoodads.MapPresets.save(name, DocsDoodads.Lighting.mapSettings(this.currentMapId()) || {},
            { mood: true, time: this.previewMinutes == null ? null : this.previewMinutes,
                weather: { type: s && s._weatherType, power: s && s._weatherPower }, wind: wind.strength });
    },

    showMoods() {
        this.closeMoods();
        if (typeof document === 'undefined') return null;
        const card = document.createElement('div');
        card.id = 'dd-moods-card';
        card.className = 'dd-glass';
        card.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);z-index:10045;padding:14px;width:360px;max-height:75vh;overflow:auto;display:flex;flex-wrap:wrap;gap:8px;';
        const heading = document.createElement('div');
        heading.className = 'dd-panel-head';
        heading.textContent = 'Moods — point to try; click to keep. Weather and wind are previews only.';
        card.appendChild(heading);
        for (const mood of DocsDoodads.Moods.list()) {
            const button = document.createElement('button');
            button.type = 'button'; button.className = 'dd-btn';
            button.textContent = mood.label; button.title = mood.note;
            button.onmouseenter = button.onfocus = () => this.previewMood(mood.id);
            button.onmouseleave = button.onblur = () => this.endMoodPreview();
            button.onclick = () => this.applyMood(mood.id);
            card.appendChild(button);
        }
        for (const [label, run] of [['Save Current as a Mood', () => this.saveMood().then(p => { if (p) this.showMoods(); })], ['Close', () => this.closeMoods()]]) {
            const button = document.createElement('button');
            button.type = 'button'; button.className = 'dd-btn'; button.textContent = label; button.onclick = run;
            card.appendChild(button);
        }
        document.body.appendChild(card);
        return card;
    },

    closeMoods() {
        this.endMoodPreview();
        const card = typeof document !== 'undefined' ? document.getElementById('dd-moods-card') : null;
        if (card && card.parentNode) card.parentNode.removeChild(card);
    }
});

// Keep hover settings out of project data, including autosaves while a tile is focused.
(function() {
    const read = DocsDoodads.Lighting.mapSettings;
    DocsDoodads.Lighting.mapSettings = function(mapId) {
        const W = DocsDoodads.Workspace, preview = W._moodPreview;
        if (W.mounted && preview && Number(mapId) === preview.mapId && W.currentMapId() === preview.mapId) return preview.settings;
        return read.call(this, mapId);
    };
})();
