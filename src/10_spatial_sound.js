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
        const gain = this.gainAt(Math.hypot(dx, dy), s) * (Number(s.boost) || 1);
        const volume = Math.min(100, Math.round((Number(se.volume) || 0) * gain));
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
            // Zoomed in, an emitter carries less far (reach) and sounds louder close by (boost).
            const far = item.emitter.radius * (Number(s.reachScale) || 1);
            const near = Math.min(Number(s.near) || 0, far * 0.25);
            out[item.key] = {
                gain: Math.min(1.5, this.gainAt(Math.hypot(item.dx, item.dy), { near, far }) * (Number(s.boost) || 1)),
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

    // ---- Zoom and sound focus ----
    // How far in the player has zoomed: 0 at normal size, 1 at the most.
    focusOf(level, max) {
        const top = Math.max(1.0001, Number(max) || 2.5);
        return Math.max(0, Math.min(1, ((Number(level) || 1) - 1) / (top - 1)));
    },

    // The spatial sound settings heard at focus f: sounds carry less far (reach) and are louder up close
    // (boost); f 0 changes nothing.
    focused(s, f, focus) {
        if (!s || !(f > 0) || !focus || focus.enabled === false) return s;
        const reachScale = 1 - Math.max(0, Math.min(0.9, Number(focus.reach) || 0)) * f;
        const near = Number(s.near) || 0;
        return Object.assign({}, s, {
            far: Math.max(near + 1, (Number(s.far) || 14) * reachScale),
            reachScale,
            boost: 1 + (Math.max(1, Number(focus.boost) || 1) - 1) * f
        });
    },

    // Music volume at focus f (music: how much it drops at the closest zoom).
    musicScale(f, focus) {
        if (!focus || focus.enabled === false) return 1;
        return 1 - Math.max(0, Math.min(1, Number(focus.music) || 0)) * Math.max(0, Math.min(1, f || 0));
    },

    // How loud a sound heard "quiet" at normal zoom is at focus f (1 at the closest zoom).
    closeness(quiet, f) {
        const q = Math.max(0, Math.min(1, Number(quiet)));
        return q + (1 - q) * Math.max(0, Math.min(1, f || 0));
    },

    ambienceKinds: [
        { value: 'water', label: 'Near water (rivers, sea)' },
        { value: 'trees', label: 'Near trees (forests, ☆ tree tops)' },
        { value: 'open', label: 'Out in the open (wind; louder up high)' },
        { value: 'doodads', label: 'Near doodads whose picture name contains…' },
        { value: 'region', label: 'Near a region' },
        { value: 'tag', label: 'Near a terrain tag' }
    ],

    footstepKinds: [
        { value: 'region', label: 'Region' },
        { value: 'tag', label: 'Terrain tag' },
        { value: 'water', label: 'Shallow water' },
        { value: 'bush', label: 'Bushes and tall grass' },
        { value: 'forest', label: 'Forest' },
        { value: 'default', label: 'Anywhere else' }
    ],

    // How much of a layer's kind is around the player: { coverage 0-1, pan -100..100 }. q answers about a
    // tile: q.match(layer, x, y) -> true/false (or a number 0-1), and q.doodads (map pixels and paths).
    coverage(layer, px, py, q, tw, th) {
        const r = Math.max(1, Math.min(20, Number(layer.radius) || 6));
        if (layer.kind === 'doodads') {
            const text = String(layer.id || '').toLowerCase();
            let n = 0, sx = 0;
            for (const d of q.doodads || []) {
                const dx = d.x / tw - (px + 0.5), dy = d.y / th - (py + 1);
                if (dx * dx + dy * dy > r * r || (text && !String(d.path || '').toLowerCase().includes(text))) continue;
                n++; sx += dx;
            }
            return { coverage: Math.min(1, n / 3), pan: n ? Math.round(Math.max(-1, Math.min(1, sx / n / r)) * 100) : 0 };
        }
        let total = 0, hit = 0, sx = 0;
        for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
                if (dx * dx + dy * dy > r * r) continue;
                total++;
                const v = Number(q.match(layer, px + dx, py + dy)) || 0;
                if (v > 0) { hit += v; sx += dx * v; }
            }
        }
        // A few tiles are already heard: the square root lifts small amounts.
        return { coverage: total ? Math.sqrt(hit / total) : 0, pan: layer.kind === 'open' || !hit ? 0 : Math.round(Math.max(-1, Math.min(1, sx / hit / r)) * 100) };
    },

    // The footstep row for the ground under the player: regions first, then terrain tags, then the kind of
    // ground (water, bushes, forest), then the default; null for none. g: { region, tag, water, bush, forest }.
    footstepFor(rows, g) {
        const list = (rows || []).filter(r => r && r.sound);
        const find = kind => list.find(r => r.kind === kind && (kind === 'region' ? Number(r.id) === g.region : kind === 'tag' ? Number(r.id) === g.tag : true));
        if (g.region > 0 && find('region')) return find('region');
        if (g.tag > 0 && find('tag')) return find('tag');
        for (const kind of ['water', 'bush', 'forest']) if (g[kind] && find(kind)) return find(kind);
        return find('default') || null;
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

