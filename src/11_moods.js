// @editor-only
//==========================================================
// SECTION 5G5: MOODS
//==========================================================
// A mood sets a map's light, screen look, fog and echo together, and shows a time of day, weather and wind
// while editing (Map > Moods, 44_workspace_moods.js). The built-in ones ship with the plugin and can't be
// deleted; your own are map presets (MapPresets, 44_workspace_saving.js) kept with mood: true.
//
// A mood: { id, label, note, builtIn, look, settings, time, weather, wind }
//   look      a Screen Look preset id (PostFX.presets), or null to take settings.postfx as it is
//   settings  the map settings it owns (only the keys in Moods.keys are used)
//   time      minutes past midnight to show on the editor's clock, or null to leave the clock alone
//   weather   { type: 'none' | 'rain' | 'storm' | 'snow', power: 1-9 }; MZ starts weather by event command
//             (Set Weather Effect), so a mood shows it while editing and never writes it to the map
//   wind      0-1 shown while editing (the Set Wind plugin command in the game), or null
// Nothing here writes: merge and apply return the map settings to write.
DocsDoodads.Moods = {
    // The map settings a mood owns: applying one replaces these and leaves every other setting alone.
    keys: ['ambient', 'dayNight', 'postfx', 'echo', 'layers2d'],
    weatherTypes: ['none', 'rain', 'storm', 'snow'],

    builtIns: [
        { id: 'sunny-day', label: 'Sunny Day', note: 'Bright and clear', look: 'cinematic', time: 12 * 60,
            settings: { ambient: { darkness: 0, color: '#101830' }, dayNight: 'off' }, weather: { type: 'none', power: 0 }, wind: 0.1 },
        { id: 'golden-evening', label: 'Golden Evening', note: 'Warm, low sun', look: 'golden', time: 18 * 60 + 30,
            settings: { ambient: { darkness: 0.2, color: '#3a1c08' }, dayNight: 'off' }, weather: { type: 'none', power: 0 }, wind: 0.05 },
        { id: 'cosy-night-village', label: 'Cosy Night Village', note: 'Dark blue night, lamps glowing', look: 'dreamy', time: 22 * 60,
            settings: { ambient: { darkness: 0.62, color: '#101830' }, dayNight: 'off' }, weather: { type: 'none', power: 0 }, wind: 0.05 },
        { id: 'rainy-forest', label: 'Rainy Forest', note: 'Grey light, rain and mist', look: 'cinematic', time: 14 * 60,
            settings: { ambient: { darkness: 0.35, color: '#1c2a2a' }, dayNight: 'off', layers2d: [{ image: '#fog', place: 'front', follow: 1, scrollX: 0.3, scrollY: 0, zoom: 2, opacity: 0.3, blend: 'screen', wind: true }] },
            weather: { type: 'rain', power: 6 }, wind: 0.35 },
        { id: 'thunderstorm', label: 'Thunderstorm', note: 'Dark, stormy, no colour', look: 'noir', time: 16 * 60,
            settings: { ambient: { darkness: 0.5, color: '#101828' }, dayNight: 'off' }, weather: { type: 'storm', power: 8 }, wind: 0.8 },
        { id: 'snowy-morning', label: 'Snowy Morning', note: 'Soft cold light, snow falling', look: 'dreamy', time: 9 * 60,
            settings: { ambient: { darkness: 0.12, color: '#2a3a5a' }, dayNight: 'off' }, weather: { type: 'snow', power: 5 }, wind: 0.15 },
        { id: 'misty-moor', label: 'Misty Moor', note: 'Early light through thick fog', look: 'cinematic', time: 7 * 60,
            settings: { ambient: { darkness: 0.25, color: '#303840' }, dayNight: 'off', layers2d: [{ image: '#fog', place: 'front', follow: 1, scrollX: 0.2, scrollY: 0, zoom: 2.5, opacity: 0.6, blend: 'screen', wind: true }] },
            weather: { type: 'none', power: 0 }, wind: 0.2 },
        { id: 'cave', label: 'Cave', note: 'Very dark, with an echo', look: 'cinematic', time: null,
            settings: { ambient: { darkness: 0.78, color: '#08080f' }, dayNight: 'off', echo: { enabled: true, delay: 0.22, feedback: 0.4, mix: 0.35 } },
            weather: { type: 'none', power: 0 }, wind: 0 },
        { id: 'haunted', label: 'Haunted', note: 'Red gloom and creeping fog', look: 'horror', time: 0,
            settings: { ambient: { darkness: 0.55, color: '#1a0814' }, dayNight: 'off', layers2d: [{ image: '#fog', place: 'front', follow: 1, scrollX: 0.15, scrollY: 0.05, zoom: 2, opacity: 0.4, blend: 'normal', wind: false }] },
            weather: { type: 'none', power: 0 }, wind: 0 },
        { id: 'underwater', label: 'Underwater', note: 'Blue, wavy and quiet', look: 'underwater', time: null,
            settings: { ambient: { darkness: 0.3, color: '#002848' }, dayNight: 'off', echo: { enabled: true, delay: 0.3, feedback: 0.3, mix: 0.25 } },
            weather: { type: 'none', power: 0 }, wind: 0 }
    ],

    clone(value) {
        return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
    },

    normalizeWeather(w) {
        const type = w && this.weatherTypes.includes(w.type) ? w.type : 'none';
        const power = type === 'none' ? 0 : Math.max(1, Math.min(9, Math.round(Number(w.power) || 5)));
        return { type, power };
    },

    // A user mood from a map preset saved with mood: true.
    fromPreset(p) {
        const time = p.time === null || p.time === undefined || !isFinite(Number(p.time)) ? null : ((Math.round(Number(p.time)) % 1440) + 1440) % 1440;
        const wind = p.wind === null || p.wind === undefined || !isFinite(Number(p.wind)) ? null : Math.max(0, Math.min(1, Number(p.wind)));
        return { id: 'user:' + p.name, label: p.name, note: 'Your own', builtIn: false, look: null, settings: this.clone(p.settings || {}),
            time, weather: this.normalizeWeather(p.weather), wind };
    },

    // Every mood: the built-in ones, then your own (by name).
    list() {
        const out = this.builtIns.map(m => Object.assign(this.clone(m), { builtIn: true }));
        let presets = [];
        try { presets = DocsDoodads.MapPresets ? DocsDoodads.MapPresets.list() : []; } catch (e) { presets = []; }
        for (const p of presets) if (p && p.mood && p.name) out.push(this.fromPreset(p));
        return out;
    },

    get(id) {
        return this.list().find(m => m.id === id) || null;
    },

    isBuiltIn(id) {
        return this.builtIns.some(m => m.id === id);
    },

    // The map settings a mood writes (only its own keys). Its fog layers are marked mood: true so the next
    // mood can take them away again without touching layers of your own.
    settingsFor(mood) {
        const src = (mood && mood.settings) || {};
        const out = {};
        for (const key of this.keys) if (src[key] !== undefined) out[key] = this.clone(src[key]);
        if (mood && mood.look) {
            const look = DocsDoodads.PostFX.presetLook(mood.look);
            if (look) out.postfx = { mode: 'custom', look };
        }
        if (Array.isArray(out.layers2d)) out.layers2d = out.layers2d.map(l => Object.assign({}, l, { mood: true }));
        return out;
    },

    // A map's settings with a mood in them: the mood's keys replaced (a key it lacks is cleared, so moods
    // don't pile up), the last mood's fog layers gone, everything else as it was.
    merge(current, mood) {
        const out = this.clone(current || {}) || {};
        if (!mood) return out;
        const own = this.settingsFor(mood);
        const kept = Array.isArray(out.layers2d) ? out.layers2d.filter(l => !(l && l.mood)) : [];
        for (const key of this.keys) delete out[key];
        for (const key of Object.keys(own)) if (key !== 'layers2d') out[key] = own[key];
        const layers = kept.concat(own.layers2d || []);
        if (layers.length) out.layers2d = layers;
        out.mood = mood.id;
        return out;
    },

    // The settings to write for a mood on a map (a mood or its id). Writes nothing.
    apply(mapId, mood) {
        if (typeof mood === 'string') mood = this.get(mood);
        if (!mood) return null;
        return this.merge(DocsDoodads.Lighting.mapSettings(mapId), mood);
    }
};
