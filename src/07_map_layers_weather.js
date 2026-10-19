//==========================================================
// SECTION 5B2: MAP LAYERS (2D), WIND, LIGHTNING
//==========================================================
// Flat maps can have several picture layers behind the tiles (backgrounds) or over them (fog, clouds,
// light shafts), each scrolling on its own: mapSettings.layers2d = [{ image, place, follow, scrollX,
// scrollY, zoom, opacity, blend, loopX, loopY, wind }]. image is a file in img/parallaxes (no extension), or
// '#fog' for soft fog banks drawn by the game. Wind (World > Weather) leans swaying doodads, pushes
// particles and fog, and blows leaves across the screen; storms can flash lightning with thunder after.
DocsDoodads.MapLayers = {
    blends: [{ value: 'normal', label: 'Normal' }, { value: 'add', label: 'Add (glow)' }, { value: 'multiply', label: 'Multiply (shade)' }, { value: 'screen', label: 'Screen (light)' }],
    places: [{ value: 'back', label: 'Behind the tiles' }, { value: 'front', label: 'Over the map' }],
    defaults: { image: '', place: 'back', follow: 0.5, scrollX: 0, scrollY: 0, zoom: 1, opacity: 1, blend: 'normal', loopX: true, loopY: true, wind: false },

    normalize(layer) {
        const l = Object.assign({}, this.defaults, layer || {});
        const num = (v, min, max, def) => { const n = Number(v); return isFinite(n) ? Math.max(min, Math.min(max, n)) : def; };
        return {
            image: String(l.image || '').replace(/\\/g, '/').replace(/^img\/parallaxes\//i, '').replace(/\.(png|webp)$/i, ''),
            place: l.place === 'front' ? 'front' : 'back',
            follow: num(l.follow, -2, 2, 0.5),
            scrollX: num(l.scrollX, -64, 64, 0),
            scrollY: num(l.scrollY, -64, 64, 0),
            zoom: num(l.zoom, 0.1, 8, 1),
            opacity: num(l.opacity, 0, 1, 1),
            blend: this.blends.some(b => b.value === l.blend) ? l.blend : 'normal',
            loopX: l.loopX !== false,
            loopY: l.loopY !== false,
            wind: Boolean(l.wind)
        };
    },

    list(mapSettings) {
        const raw = mapSettings && Array.isArray(mapSettings.layers2d) ? mapSettings.layers2d : [];
        return raw.map(l => this.normalize(l)).filter(l => l.image);
    },

    // Where a layer's picture starts (in its own pixels, before zoom), for a TilingSprite's origin or a
    // plain sprite's position. display: the map's display position in pixels; drift: pixels scrolled so far.
    origin(layer, displayPx, drift) {
        const z = layer.zoom || 1;
        return { x: (displayPx.x * layer.follow + drift.x) / z, y: (displayPx.y * layer.follow + drift.y) / z };
    },

    // MZ's blend modes (PIXI): normal 0, add 1, multiply 2, screen 3.
    blendMode(name) {
        return { normal: 0, add: 1, multiply: 2, screen: 3 }[name] || 0;
    },

    // A soft, tileable fog texture: blobs drawn wrapping round the edges, so it repeats without seams.
    fogBlobs(size, count, seed) {
        let s = (Number(seed) || 1) >>> 0;
        const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
        const out = [];
        for (let i = 0; i < count; i++) {
            out.push({ x: rand() * size, y: rand() * size, r: size * (0.08 + rand() * 0.18), a: 0.25 + rand() * 0.35 });
        }
        return out;
    }
};

DocsDoodads.Wind = {
    defaults: { strength: 0, direction: 1, gusts: 0.5, fromWeather: true, leaves: false, leafColor: '#c27c2c' },

    settings() {
        const w = (DocsDoodads.World.settings().weather2d || {}).wind || {};
        return Object.assign({}, this.defaults, w);
    },

    // The wind now, -1 (hard left) to 1 (hard right), with gusts: the world setting, raised by rain and
    // storms (fromWeather), or what Set Wind changed it to. time in seconds.
    now(time, weather) {
        const s = this.settings();
        const sys = typeof $gameSystem !== 'undefined' && $gameSystem ? $gameSystem._docsWind : null;
        let strength = Math.max(0, Math.min(1, Number(s.strength) || 0));
        let dir = Number(s.direction) < 0 ? -1 : 1;
        if (sys) {
            const t = sys.frames > 0 ? Math.min(1, sys.elapsed / sys.frames) : 1;
            strength = sys.from + (sys.to - sys.from) * t;
            if (sys.direction) dir = sys.direction;
        }
        if (s.fromWeather && weather && weather.type && weather.type !== 'none') {
            const power = Math.max(0, Math.min(9, Number(weather.power) || 0)) / 9;
            const add = weather.type === 'storm' ? 0.6 : weather.type === 'rain' ? 0.25 : 0.15;
            strength = Math.min(1, strength + add * power);
        }
        const gust = strength > 0 ? 1 + (Number(s.gusts) || 0) * (DocsDoodads.Motion.noise((Number(time) || 0) * 0.35) - 0.5) * 1.6 : 1;
        return { x: dir * strength * Math.max(0, gust), strength };
    },

    // Set Wind: to a strength over some frames (and maybe a new direction); 'world' goes back.
    set(strength, frames, direction) {
        if (typeof $gameSystem === 'undefined' || !$gameSystem) return null;
        if (strength === 'world') { $gameSystem._docsWind = null; return null; }
        const current = this.now(0, null).strength;
        $gameSystem._docsWind = { from: current, to: Math.max(0, Math.min(1, Number(strength) || 0)), frames: Math.max(0, Number(frames) || 0), elapsed: 0,
            direction: direction === 'left' ? -1 : direction === 'right' ? 1 : 0 };
        return $gameSystem._docsWind;
    },

    // The wind this frame (worked out once a frame for every sprite and emitter).
    current() {
        const frame = typeof DocsDoodads.frameCount === 'function' ? DocsDoodads.frameCount() : 0;
        if (this._frame === frame && this._value) return this._value;
        const screen = typeof $gameScreen !== 'undefined' && $gameScreen ? $gameScreen : null;
        let weather = null;
        try { weather = screen && screen.weatherType ? { type: screen.weatherType(), power: screen.weatherPower() } : null; } catch (e) {}
        try { this._value = this.now(frame / 60, weather); } catch (e) { this._value = { x: 0, strength: 0 }; }
        this._frame = frame;
        return this._value;
    },

    tick() {
        const sys = typeof $gameSystem !== 'undefined' && $gameSystem ? $gameSystem._docsWind : null;
        if (sys && sys.elapsed < sys.frames) sys.elapsed++;
    }
};

DocsDoodads.Lightning = {
    defaults: { enabled: false, every: 12, flash: 170, sound: 'Thunder9', volume: 90, delay: 2 },

    settings() {
        return Object.assign({}, this.defaults, (DocsDoodads.World.settings().weather2d || {}).lightning || {});
    },

    // The frames until the next strike: around "every" seconds, rarer in weaker storms. rand: 0-1.
    nextIn(s, power, rand) {
        const p = Math.max(1, Math.min(9, Number(power) || 1)) / 9;
        const mean = Math.max(1, Number(s.every) || 12) * 60 / (0.4 + p);
        return Math.round(mean * (0.4 + (Number(rand) || 0) * 1.2));
    },

    // A strike: how bright, and when the thunder is heard (frames; nearer strikes are brighter and sooner).
    strike(s, rand) {
        const near = Number(rand) || 0;
        return {
            flash: Math.round(Math.max(0, Math.min(255, Number(s.flash) || 0)) * (0.55 + 0.45 * near)),
            thunderIn: Math.round((1 - near) * Math.max(0, Number(s.delay) || 0) * 60),
            volume: Math.round(Math.max(0, Math.min(100, Number(s.volume) || 0)) * (0.6 + 0.4 * near)),
            pan: Math.round(((Number(rand) * 7919) % 1 - 0.5) * 80)
        };
    }
};
