//==========================================================
// SECTION 5F: SPATIAL SOUND (DISTANCE, PAN, VARIATION, EMITTERS, ECHO, REGION SOUNDS)
//==========================================================
// Distances are in tiles from the player. MZ pans with -100 (left) .. 100 (right).
DocsDoodads.SpatialSound = {
    modes: [
        { value: 'auto', label: 'Every event sound (not the party)' },
        { value: 'tagged', label: 'Only events tagged <spatial>' },
        { value: 'off', label: 'Off' }
    ],
    emitterDefaults: { file: '', volume: 80, pitch: 100, radius: 8, every: 4 },
    echoDefaults: { enabled: false, delay: 0.18, feedback: 0.35, mix: 0.3 },

    get defaults() {
        return DocsDoodads.World.defaults.sound;
    },

    gainAt(distance, s) {
        const near = Math.max(0, Number(s.near) || 0);
        const far = Math.max(near + 0.001, Number(s.far) || 14);
        if (distance <= near) return 1;
        if (distance >= far) return 0;
        const t = (distance - near) / (far - near);
        return (1 - t) * (1 - t);
    },

    panFor(dx, s) {
        const width = Math.max(0.5, Number(s.panWidth) || 8);
        return Math.round(Math.max(-1, Math.min(1, dx / width)) * 100);
    },

    // A copy of the sound as heard from dx, dy tiles away, or null when out of earshot.
    apply(se, dx, dy, s) {
        if (!se || !s || s.mode === 'off') return se;
        const gain = this.gainAt(Math.hypot(dx, dy), s);
        const volume = Math.round((Number(se.volume) || 0) * gain);
        if (gain <= 0 || volume <= 0) return null;
        const pan = Math.max(-100, Math.min(100, (Number(se.pan) || 0) + this.panFor(dx, s)));
        return { name: se.name, volume, pitch: se.pitch, pan };
    },

    // Pitch drifts both ways; volume only dips, so nothing gets louder than authored.
    vary(se, s, rng) {
        const pv = Math.max(0, Number(s && s.pitchVariance) || 0), vv = Math.max(0, Number(s && s.volumeVariance) || 0);
        if (!se || (!pv && !vv)) return se;
        const r = rng || Math.random;
        return Object.assign({}, se, {
            pitch: Math.round((Number(se.pitch) || 100) * (1 + (r() * 2 - 1) * pv / 100)),
            volume: Math.round((Number(se.volume) || 0) * (1 - r() * vv / 100))
        });
    },

    shouldSpatialize(s, tags, isPlayerLike) {
        if (!s || s.mode === 'off') return false;
        tags = tags || {};
        if (tags.spatial === false) return false;
        if (tags.spatial === true) return true;
        if (isPlayerLike) return false;
        return s.mode !== 'tagged';
    },

    // "bgs/River" or "se/Bird1"; a bare name is a background sound.
    splitFile(file) {
        const text = String(file || '').trim();
        if (!text) return null;
        const match = text.match(/^(bgs|se)\/(.+)$/i);
        return match ? { folder: match[1].toLowerCase(), name: match[2] } : { folder: 'bgs', name: text };
    },

    normalizeEmitter(src) {
        if (!src) return null;
        const file = this.splitFile(src.file);
        if (!file) return null;
        const d = this.emitterDefaults;
        const num = (v, def, min, max) => { const n = Number(v); return v === undefined || v === null || v === '' || !isFinite(n) ? def : Math.max(min, Math.min(max, n)); };
        return {
            file: file.folder + '/' + file.name, folder: file.folder, name: file.name,
            volume: num(src.volume, d.volume, 0, 100), pitch: num(src.pitch, d.pitch, 50, 150),
            radius: num(src.radius, d.radius, 1, 60), every: num(src.every, d.every, 0.5, 120),
            loop: file.folder === 'bgs'
        };
    },

    // Gain and pan for each emitter; an emitter is silent beyond its own radius.
    planEmitters(list, s) {
        const out = {};
        for (const item of list || []) {
            if (!item || !item.emitter) continue;
            const near = Math.min(Number(s.near) || 0, item.emitter.radius * 0.25);
            out[item.key] = {
                gain: this.gainAt(Math.hypot(item.dx, item.dy), { near, far: item.emitter.radius }),
                pan: this.panFor(item.dx, s)
            };
        }
        return out;
    },

    // Repeating sound effects (birds, drips) wander around their interval.
    nextDelay(every, rng) {
        return Math.max(0.1, (Number(every) || 4) * (0.5 + (rng || Math.random)()));
    },

    echoFor(mapSettings) {
        const echo = mapSettings && mapSettings.echo;
        if (!echo || !echo.enabled) return null;
        const d = this.echoDefaults;
        const num = (v, def, min, max) => { const n = Number(v); return v === undefined || v === null || v === '' || !isFinite(n) ? def : Math.max(min, Math.min(max, n)); };
        return { delay: num(echo.delay, d.delay, 0.02, 1), feedback: num(echo.feedback, d.feedback, 0, 0.9), mix: num(echo.mix, d.mix, 0, 1) };
    },

    regionSoundFor(list, regionId) {
        if (!(regionId > 0) || !Array.isArray(list)) return null;
        return list.find(e => e && Number(e.regionId) === regionId && e.name) || null;
    },

    regionStart() {
        return { key: null, saved: false, fade: 1 };
    },

    // What to do as the player's region changes: play a region's sound (remembering the map's own
    // first), or restore the map's sound on leaving.
    regionStep(state, list, regionId) {
        const entry = this.regionSoundFor(list, regionId);
        const key = entry ? entry.regionId + ':' + entry.name : null;
        if (key === state.key) return { state, action: null };
        if (entry) {
            return { state: { key, saved: true, fade: Number(entry.fade) || 1 }, action: { type: 'play', entry, save: !state.saved } };
        }
        return { state: this.regionStart(), action: state.key ? { type: 'restore', fade: state.fade } : null };
    }
};

