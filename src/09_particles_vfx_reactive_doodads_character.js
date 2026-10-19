//==========================================================
// SECTION 5E: PARTICLES, VFX, REACTIVE DOODADS & CHARACTER ANIMATION
//==========================================================
// Particles are simulated in pixels relative to their emitter, with a seeded random source so previews
// and tests repeat exactly. Rendering (pooled sprites) lives in Section 7.
DocsDoodads.Particles = {
    shapes: ['soft', 'circle', 'square', 'spark', 'leaf', 'star'],
    blends: ['normal', 'add', 'screen'],
    layers: [{ value: 'above', label: 'Above characters' }, { value: 'below', label: 'Below characters (ground)' }],
    defaults: {
        rate: 10, burst: 0, max: 120, lifetime: [1, 2], speed: [10, 30], angle: -90, spread: 30,
        gravity: 0, wind: 0, drag: 0, size: [6, 2], alpha: [1, 0], colorStart: '#ffffff', colorEnd: '#ffffff',
        blend: 'normal', shape: 'soft', area: [0, 0], spin: [0, 0], flutter: 0, twinkle: 0, stretch: 0
    },
    presets: [
        { id: 'smoke', label: 'Smoke', config: { rate: 6, lifetime: [2.5, 4], speed: [10, 22], spread: 20, gravity: -4, wind: 6, size: [8, 28], alpha: [0.45, 0], colorStart: '#9a9a9a', colorEnd: '#5a5a5a', area: [8, 4] } },
        { id: 'embers', label: 'Embers', config: { rate: 10, lifetime: [1, 2], speed: [25, 60], spread: 35, gravity: -10, size: [4, 1.5], stretch: 1.5, alpha: [1, 0], colorStart: '#ffd060', colorEnd: '#ff4010', blend: 'add', flutter: 6, area: [12, 4] } },
        { id: 'fire', label: 'Fire', config: { rate: 28, lifetime: [0.5, 0.9], speed: [35, 70], spread: 12, size: [12, 2], alpha: [0.55, 0], colorStart: '#ffb040', colorEnd: '#ff2000', blend: 'add', area: [16, 4], stretch: 1.2 } },
        { id: 'fireflies', label: 'Fireflies', config: { rate: 1.2, max: 20, lifetime: [4, 7], speed: [3, 10], spread: 360, size: [4, 4], alpha: [0.9, 0.9], colorStart: '#d8ff70', colorEnd: '#a0ff40', blend: 'add', area: [96, 64], flutter: 10, twinkle: 0.8 } },
        { id: 'leaves', label: 'Falling Leaves', config: { rate: 1.5, max: 30, lifetime: [4, 6], speed: [10, 25], angle: 100, spread: 30, gravity: 6, wind: 8, size: [7, 7], alpha: [1, 0], colorStart: '#d08a2a', colorEnd: '#a05010', shape: 'leaf', spin: [-120, 120], flutter: 14, area: [80, 10] } },
        { id: 'mist', label: 'Mist', config: { rate: 2, max: 40, lifetime: [5, 8], speed: [3, 8], angle: 0, spread: 30, size: [60, 90], alpha: [0.18, 0], area: [140, 30] } },
        { id: 'dust', label: 'Dust Motes', config: { rate: 3, max: 40, lifetime: [3, 5], speed: [2, 6], spread: 360, size: [2, 2], alpha: [0.6, 0], colorStart: '#fff4d0', colorEnd: '#fff4d0', blend: 'add', area: [80, 80], twinkle: 0.5 } },
        { id: 'sparkles', label: 'Sparkles', config: { rate: 8, lifetime: [0.4, 0.9], speed: [5, 20], spread: 360, size: [5, 0], alpha: [1, 0], colorStart: '#ffffff', colorEnd: '#a0e0ff', blend: 'add', shape: 'star', area: [24, 24], spin: [-180, 180] } },
        { id: 'snow', label: 'Snow', config: { rate: 6, max: 80, lifetime: [5, 8], speed: [15, 30], angle: 95, spread: 10, size: [3, 3], alpha: [0.9, 0], flutter: 10, area: [400, 0] } },
        { id: 'bubbles', label: 'Bubbles', config: { rate: 3, lifetime: [1.5, 3], speed: [12, 24], spread: 10, size: [3, 5], alpha: [0.8, 0], colorStart: '#c0f0ff', colorEnd: '#c0f0ff', shape: 'circle', flutter: 4, area: [20, 4] } },
        { id: 'magic', label: 'Magic', config: { rate: 14, lifetime: [0.8, 1.5], speed: [10, 30], spread: 360, gravity: -15, size: [6, 0], alpha: [1, 0], colorStart: '#c080ff', colorEnd: '#4060ff', blend: 'add', shape: 'star', spin: [-200, 200], area: [16, 16] } }
    ],

    normalize(config) {
        const src = config && typeof config === 'object' ? config : {};
        const preset = src.preset ? this.presets.find(p => p.id === src.preset) : null;
        const merged = Object.assign({}, this.defaults, preset ? preset.config : {}, src);
        const d = this.defaults;
        const num = (v, def, min, max) => { const n = Number(v); return v === '' || v === null || v === undefined || !isFinite(n) ? def : Math.max(min, Math.min(max, n)); };
        const pair = (v, def, min, max) => {
            if (typeof v === 'number') v = [v, v];
            if (!Array.isArray(v) || v.length === 0) return def.slice();
            const a = num(v[0], def[0], min, max);
            return [a, v.length > 1 ? num(v[1], a, min, max) : a];
        };
        const color = (v, def) => (/^#[0-9a-f]{6}$/i.test(String(v || '')) ? String(v).toLowerCase() : def);
        return {
            preset: preset ? preset.id : null,
            rate: num(merged.rate, d.rate, 0, 500),
            burst: Math.round(num(merged.burst, 0, 0, 1000)),
            max: Math.round(num(merged.max, d.max, 1, 1000)),
            lifetime: pair(merged.lifetime, d.lifetime, 0.05, 60),
            speed: pair(merged.speed, d.speed, 0, 2000),
            angle: num(merged.angle, d.angle, -360, 360),
            spread: num(merged.spread, d.spread, 0, 360),
            gravity: num(merged.gravity, 0, -2000, 2000),
            wind: num(merged.wind, 0, -2000, 2000),
            drag: num(merged.drag, 0, 0, 10),
            size: pair(merged.size, d.size, 0, 512),
            alpha: pair(merged.alpha, d.alpha, 0, 1),
            colorStart: color(merged.colorStart, d.colorStart),
            colorEnd: color(merged.colorEnd, color(merged.colorStart, d.colorEnd)),
            blend: this.blends.includes(merged.blend) ? merged.blend : d.blend,
            shape: this.shapes.includes(merged.shape) ? merged.shape : d.shape,
            area: pair(merged.area, d.area, 0, 4000),
            spin: pair(merged.spin, d.spin, -3600, 3600),
            flutter: num(merged.flutter, 0, 0, 200),
            twinkle: num(merged.twinkle, 0, 0, 1),
            // Elongates particles along their motion: flame tongues, spark streaks, rain.
            stretch: num(merged.stretch, 0, 0, 5)
        };
    },

    createState(config, seed) {
        return { config, particles: [], acc: 0, time: 0, rng: DocsDoodads.Scatter.rng(Number(seed) || 1) };
    },

    spawn(state) {
        const c = state.config, r = state.rng;
        if (state.particles.length >= c.max) return null;
        const between = range => range[0] + (range[1] - range[0]) * r();
        const angle = (c.angle + (r() - 0.5) * c.spread) * Math.PI / 180;
        const speed = between(c.speed);
        const p = {
            x: (r() - 0.5) * c.area[0], y: (r() - 0.5) * c.area[1],
            vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
            age: 0, life: between(c.lifetime),
            rotation: r() * Math.PI * 2, spin: between(c.spin) * Math.PI / 180,
            phase: r() * Math.PI * 2
        };
        state.particles.push(p);
        return p;
    },

    burst(state, count) {
        for (let i = 0; i < count; i++) if (!this.spawn(state)) break;
        return state;
    },

    step(state, dt, emitting) {
        const c = state.config;
        state.time += dt;
        // The world's wind pushes every emitter (pixels a second, a second); the same for every particle.
        const push = (c.wind + DocsDoodads.Wind.current().x * 40) * dt;
        for (let i = state.particles.length - 1; i >= 0; i--) {
            const p = state.particles[i];
            p.age += dt;
            if (p.age >= p.life) {
                state.particles.splice(i, 1);
                continue;
            }
            p.vx += push;
            p.vy += c.gravity * dt;
            if (c.drag > 0) {
                const k = Math.max(0, 1 - c.drag * dt);
                p.vx *= k;
                p.vy *= k;
            }
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.rotation += p.spin * dt;
        }
        if (emitting && c.rate > 0) {
            state.acc += c.rate * dt;
            while (state.acc >= 1) {
                state.acc -= 1;
                if (!this.spawn(state)) {
                    state.acc = 0;
                    break;
                }
            }
        }
        return state;
    },

    // What each particle looks like now: size, alpha and colour blend over its life.
    view(state) {
        const c = state.config;
        const start = DocsDoodads.Lighting.parseColor(c.colorStart), end = DocsDoodads.Lighting.parseColor(c.colorEnd);
        const mix = (t) => {
            if (start === end) return start;
            const ch = (shift) => Math.round(((start >> shift) & 255) + ((((end >> shift) & 255) - ((start >> shift) & 255)) * t));
            return (ch(16) << 16) | (ch(8) << 8) | ch(0);
        };
        return state.particles.map(p => {
            const t = Math.min(1, p.age / p.life);
            let alpha = c.alpha[0] + (c.alpha[1] - c.alpha[0]) * t;
            if (c.twinkle > 0) alpha *= 1 - c.twinkle * (0.5 + 0.5 * Math.sin(p.age * 5 + p.phase));
            return {
                x: p.x + (c.flutter ? Math.sin(p.age * 3.8 + p.phase) * c.flutter : 0),
                y: p.y,
                size: c.size[0] + (c.size[1] - c.size[0]) * t,
                alpha: Math.max(0, Math.min(1, alpha)),
                rotation: c.stretch > 0 ? Math.atan2(p.vy, p.vx) + Math.PI / 2 : p.rotation,
                stretch: c.stretch,
                color: mix(t)
            };
        });
    }
};

// A VFX is a list of layers (particle emitters and sprite-sheet animations) with a shared clock.
DocsDoodads.Vfx = {
    layerTypes: [{ value: 'particles', label: 'Particles' }, { value: 'sheet', label: 'Sprite sheet' }],

    normalizeLayer(layer) {
        if (!layer || !this.layerTypes.some(t => t.value === layer.type)) return null;
        const num = (v, def, min, max) => { const n = Number(v); return v === undefined || v === null || v === '' || !isFinite(n) ? def : Math.max(min, Math.min(max, n)); };
        const common = { type: layer.type, start: num(layer.start, 0, 0, 60), offsetX: num(layer.offsetX, 0, -2000, 2000), offsetY: num(layer.offsetY, 0, -2000, 2000) };
        if (layer.type === 'particles') {
            const emitter = Object.assign({}, layer.emitter || {});
            return Object.assign(common, { emitter: Object.assign({}, emitter, { burst: Math.round(num(emitter.burst, 0, 0, 1000)) }) });
        }
        const cols = Math.round(num(layer.cols, 5, 1, 64)), rows = Math.round(num(layer.rows, 1, 1, 64));
        return Object.assign(common, {
            image: String(layer.image || ''), cols, rows,
            frames: Math.round(num(layer.frames, cols * rows, 1, cols * rows)),
            fps: num(layer.fps, 15, 1, 120), loop: layer.loop === true,
            scale: num(layer.scale, 1, 0.05, 10), rotation: num(layer.rotation, 0, -360, 360),
            blend: DocsDoodads.Particles.blends.includes(layer.blend) ? layer.blend : 'normal',
            tint: /^#[0-9a-f]{6}$/i.test(String(layer.tint || '')) ? String(layer.tint).toLowerCase() : '#ffffff',
            alpha: num(layer.alpha, 1, 0, 1)
        });
    },

    normalize(def) {
        def = def || {};
        const num = Number(def.duration);
        return {
            id: String(def.id || ''),
            name: String(def.name || def.id || 'Effect'),
            duration: isFinite(num) && num > 0 ? Math.min(60, num) : 1,
            loop: def.loop === true,
            layers: (Array.isArray(def.layers) ? def.layers : []).map(l => this.normalizeLayer(l)).filter(Boolean)
        };
    },

    sheetLength(layer) {
        return layer.frames / layer.fps;
    },

    // Frame index at time t (seconds since the layer started), or -1 once a one-shot sheet has ended.
    sheetFrame(layer, t) {
        const index = Math.floor(Math.max(0, t) * layer.fps + 1e-9);
        if (index >= layer.frames) return layer.loop ? index % layer.frames : -1;
        return index;
    },

    emitting(def, layer, t) {
        if (t < layer.start) return false;
        return def.loop || t < def.duration;
    },

    isFinished(def, t, particlesAlive) {
        if (def.loop) return false;
        if (t < def.duration || particlesAlive > 0) return false;
        return def.layers.every(l => l.type !== 'sheet' || l.loop || t >= l.start + this.sheetLength(l));
    },

    builtIns: [],

    // The project's library first, then built-ins; matched by id, or by name ignoring case.
    find(key, library) {
        if (!key) return null;
        const k = String(key).toLowerCase();
        const all = (library || []).concat(this.builtIns);
        return all.find(d => d.id === key) || all.find(d => d.id.toLowerCase() === k || d.name.toLowerCase() === k) || null;
    },

    library() {
        return (DocsDoodads.World.get('vfx.library') || []).map(d => this.normalize(d));
    },

    _playing: [],
    _uid: 0,

    // spec: { id, x, y (map pixels), follow (character), loop }. Rendering picks these up each frame.
    play(spec) {
        const def = this.find(spec && spec.id, this.library());
        if (!def) return null;
        const instance = { def: spec.loop ? Object.assign({}, def, { loop: true }) : def, x: Number(spec.x) || 0, y: Number(spec.y) || 0,
            follow: spec.follow || null, time: 0, seed: Math.floor(Math.random() * 1e9), done: false, uid: ++this._uid };
        this._playing.push(instance);
        return instance;
    }
};

DocsDoodads.Vfx.builtIns = [
    { id: 'explosion', name: 'Explosion', duration: 0.3, layers: [
        { type: 'particles', emitter: { preset: 'fire', rate: 0, burst: 40, speed: [60, 160], spread: 360, lifetime: [0.4, 0.9], size: [18, 2] } },
        { type: 'particles', emitter: { preset: 'smoke', rate: 0, burst: 14, speed: [20, 60], spread: 360, lifetime: [0.8, 1.6], size: [12, 36] } },
        { type: 'particles', emitter: { preset: 'embers', rate: 0, burst: 20, speed: [80, 200], spread: 360, gravity: 120 } }
    ] },
    { id: 'heal', name: 'Heal', duration: 0.8, layers: [
        { type: 'particles', emitter: { preset: 'sparkles', rate: 40, angle: -90, spread: 30, speed: [30, 60], colorStart: '#d0ffd0', colorEnd: '#40ff80', area: [40, 10], lifetime: [0.6, 1.2] } },
        { type: 'particles', emitter: { rate: 0, burst: 16, shape: 'soft', size: [10, 20], alpha: [0.6, 0], speed: [10, 30], spread: 360, colorStart: '#80ff90', blend: 'add', lifetime: [0.5, 0.9] } }
    ] },
    { id: 'levelup', name: 'Level Up', duration: 1, layers: [
        { type: 'particles', emitter: { preset: 'sparkles', rate: 50, angle: -90, spread: 20, speed: [60, 120], colorStart: '#fff3a0', colorEnd: '#ffb000', area: [36, 6], lifetime: [0.6, 1.1], size: [7, 0] } },
        { type: 'particles', emitter: { rate: 0, burst: 30, shape: 'star', speed: [80, 120], spread: 360, size: [6, 0], alpha: [1, 0], colorStart: '#ffffff', colorEnd: '#ffd040', blend: 'add', lifetime: [0.5, 0.8] } }
    ] },
    { id: 'smokepuff', name: 'Smoke Puff', duration: 0.2, layers: [
        { type: 'particles', emitter: { preset: 'smoke', rate: 0, burst: 12, speed: [15, 40], spread: 360, lifetime: [0.8, 1.4], size: [10, 30], alpha: [0.6, 0] } }
    ] },
    { id: 'magic', name: 'Magic Burst', duration: 0.6, layers: [
        { type: 'particles', emitter: { preset: 'magic', rate: 30, area: [30, 30] } },
        { type: 'particles', emitter: { preset: 'magic', rate: 0, burst: 24, speed: [60, 110], gravity: 0 } }
    ] },
    { id: 'splash', name: 'Water Splash', duration: 0.2, layers: [
        { type: 'particles', emitter: { rate: 0, burst: 26, shape: 'circle', angle: -90, spread: 120, speed: [60, 140], gravity: 320, size: [4, 2], alpha: [0.9, 0], colorStart: '#e0f8ff', colorEnd: '#80c8ff', lifetime: [0.4, 0.8] } }
    ] }
].map(def => DocsDoodads.Vfx.normalize(def));

// Grass and bushes that bend away from whoever walks through them, then spring back.
DocsDoodads.React = {
    defaults: { enabled: false, amount: 0.5, leaves: false },
    maxBend: 0.6,

    touching(d, charX, charBaseY, tileH) {
        const halfW = (d.frameW || 48) * Math.abs(d.scaleX !== undefined ? d.scaleX : 1) * 0.5;
        const ax = d.anchorX !== undefined ? d.anchorX : 0.5;
        const centerX = d.x + (0.5 - ax) * halfW * 2;
        return Math.abs(charX - centerX) < halfW && Math.abs(charBaseY - DocsDoodads.Depth.baseY(d)) < (tileH || 48) * 0.6;
    },

    // Bend impulse (skew) pushing away from the walker; faster walkers push harder.
    push(d, charX, speedPx) {
        const amount = d.react && d.react.amount !== undefined ? Number(d.react.amount) || 0 : this.defaults.amount;
        const away = d.x >= charX ? 1 : -1;
        return away * amount * (0.03 + Math.abs(Number(speedPx) || 0) * 0.012);
    },

    step(state, impulse, stiffness = 0.12, damping = 0.18) {
        let vel = state.vel + (Number(impulse) || 0);
        vel += -stiffness * state.bend - damping * vel;
        const bend = Math.max(-this.maxBend, Math.min(this.maxBend, state.bend + vel));
        if (Math.abs(bend) < 1e-4 && Math.abs(vel) < 1e-4) return { bend: 0, vel: 0 };
        return { bend, vel };
    }
};

// Character sheets beyond MZ's 3 frames x 4 directions, idle/run cycles and one-shot actions.
DocsDoodads.CharacterAnim = {
    _parsed: {},

    // Cached: called several times per character per frame. Callers must not change the result.
    parseName(name) {
        name = String(name || '');
        if (this._parsed[name]) return this._parsed[name];
        const parsed = this.parseNameUncached(name);
        if (Object.keys(this._parsed).length > 2000) this._parsed = {};
        this._parsed[name] = parsed;
        return parsed;
    },

    // [w2]: frame 0 stands and the others walk, one cycle every 2 tiles (LPC walkers), whatever the speed.
    // [b64]: each frame has 64 pixels of art below the feet (a spear thrust down); the character still stands
    // on its feet.
    parseNameUncached(name) {
        let frames = 3, dirs = 4, tagged = false, walkTiles = 0, below = 0;
        const f = name.match(/\[f(\d+)\]|%\((\d+)\)/i);
        if (f) {
            const n = parseInt(f[1] || f[2], 10);
            frames = n > 0 ? Math.min(64, n) : 3;
            tagged = true;
        }
        const d = name.match(/\[d([148])\]/i);
        if (d) {
            dirs = parseInt(d[1], 10);
            tagged = true;
        }
        const w = name.match(/\[w(\d+(?:\.\d+)?)\]/i);
        if (w && parseFloat(w[1]) > 0) {
            walkTiles = Math.min(16, parseFloat(w[1]));
            tagged = true;
        }
        const b = name.match(/\[b(\d+)\]/i);
        if (b) {
            below = parseInt(b[1], 10);
            tagged = true;
        }
        const base = name.replace(/\[f\d+\]|%\(\d+\)|\[d[148]\]|\[w\d+(?:\.\d+)?\]|\[b\d+\]/gi, '');
        // Only with more than MZ's 3 frames: a 3-frame sheet stands in its middle frame.
        return { base, frames, dirs, tagged, walkTiles: frames > 3 ? walkTiles : 0, below };
    },

    // Pixels of a sheet's frames below the feet: its [bN] tag, or the project's table (characterAnim.feet,
    // written by the Character Creator so its sheet names stay the same).
    belowFor(sheet, table) {
        const tag = this.parseName(sheet).below;
        if (tag) return tag;
        const n = table ? Number(table[String(sheet || '')]) : 0;
        return n > 0 ? n : 0;
    },

    // How tall the figure is in a side-view battler's cells, when they are bigger than it (0 otherwise): the
    // battler's [hN] tag, or the project's table (characterAnim.svBody, written by the Character Creator for
    // a battler grown to fit a big weapon). Battle animations aim at the figure.
    svBodyFor(battlerName, table) {
        const tag = String(battlerName || '').match(/\[h(\d+)\]/i);
        if (tag) return parseInt(tag[1], 10);
        const n = table ? Number(table[String(battlerName || '')]) : 0;
        return n > 0 ? n : 0;
    },

    // The anchor that stands a frame of height h with `below` pixels under the feet on its feet.
    footAnchor(h, below) {
        return below > 0 && h > below ? 1 - below / h : 1;
    },

    // Row in the sheet for a direction (1-9 numpad layout), and whether to mirror (single-row sheets face right).
    rowFor(dir, dirs) {
        const horizontalOf = { 1: 4, 7: 4, 3: 6, 9: 6 };
        if (dirs === 1) return { row: 0, mirror: [1, 4, 7].includes(dir) };
        if (dirs === 8) {
            const diag = { 1: 4, 3: 5, 7: 6, 9: 7 };
            if (diag[dir] !== undefined) return { row: diag[dir], mirror: false };
        }
        const d = horizontalOf[dir] || dir;
        return { row: Math.max(0, Math.min(3, (d - 2) / 2)), mirror: false };
    },

    walkFrame(pattern, frames) {
        if (frames === 3) return [0, 1, 2, 1][((pattern % 4) + 4) % 4];
        return ((pattern % frames) + frames) % frames;
    },

    // The pattern after this one on a [wN] sheet: 1 to frames-1 round and round (0 is standing).
    walkStep(pattern, frames) {
        return frames > 1 ? (Math.max(0, pattern) % (frames - 1)) + 1 : 0;
    },

    // Game frames between walking patterns so one cycle covers walkTiles tiles: MZ counts 1.5 a frame
    // while moving, and a character moves distancePerFrame tiles a frame.
    paceWait(frames, walkTiles, distancePerFrame) {
        if (!walkTiles || frames < 2 || !(distancePerFrame > 0)) return 0;
        return Math.max(1, 1.5 * walkTiles / (frames - 1) / distancePerFrame);
    },

    standingFrame(frames) {
        return frames === 3 ? 1 : 0;
    },

    cycleFrame(elapsedFrames, fps, frames) {
        return Math.floor(Math.max(0, elapsedFrames) / 60 * fps + 1e-9) % Math.max(1, frames);
    },

    setFor(characterName, sets) {
        if (!characterName || !Array.isArray(sets)) return null;
        return sets.find(s => s && s.character === characterName) || null;
    },

    // info: { moving, dashing, stillFrames, action }
    stateFor(info, set) {
        if (info.action) return 'action';
        if (info.moving) return info.dashing && set && set.run ? 'run' : 'walk';
        if (set && set.idle && info.stillFrames >= (set.idleDelay !== undefined ? set.idleDelay : 90)) return 'idle';
        return 'stand';
    },

    sheetFor(state, characterName, set) {
        if (set && state === 'idle' && set.idle) return set.idle;
        if (set && state === 'run' && set.run) return set.run;
        return characterName;
    },

    // Finds "<base>_idle" and "<base>_run" sheets among the character files.
    autoDetect(characterName, fileNames) {
        const base = this.parseName(characterName).base;
        const pick = suffix => (fileNames || []).find(n => this.parseName(n).base.toLowerCase() === (base + suffix).toLowerCase()) || '';
        return { character: characterName, idle: pick('_idle'), run: pick('_run') };
    },

    newAction(spec) {
        const sheet = String(spec.sheet || '');
        const loops = Math.max(0, Math.round(Number(spec.loops !== undefined ? spec.loops : 1)));
        return { sheet, frames: this.parseName(sheet).frames, fps: Math.max(1, Number(spec.fps) || 8), loops, hold: spec.hold === true, elapsed: 0 };
    },

    // done: the action has finished (never for held or endlessly looping actions).
    actionFrame(action, elapsedFrames) {
        const index = Math.floor(Math.max(0, elapsedFrames) / 60 * action.fps + 1e-9);
        const total = action.frames * action.loops;
        if (action.loops === 0 || index < total) return { frame: index % action.frames, done: false };
        return { frame: action.frames - 1, done: !action.hold };
    },

    dir8(horz, vert) {
        return (vert === 2 ? 0 : 6) + (horz === 4 ? 1 : 3);
    },

    split8(dir) {
        const map = { 1: [4, 2], 3: [6, 2], 7: [4, 8], 9: [6, 8] };
        return map[dir] ? { horz: map[dir][0], vert: map[dir][1] } : null;
    }
};

