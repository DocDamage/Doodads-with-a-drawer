//==========================================================
// SECTION 5B: RENDER EFFECTS (DEPTH, APPEARANCE, MOTION, SHADOWS, LIGHTS)
//==========================================================
// Doodads live in the tilemap beside the characters (as in QJ-Doodads), so the tilemap's
// z-then-y sort puts a "sorted" doodad in front of or behind the player by its base line.
DocsDoodads.Depth = {
    modes: ['below', 'sorted', 'above'],
    labels: { below: 'Below characters (floor decal)', sorted: 'Sorted with characters', above: 'Above characters (overhang)' },
    // Ground tiles are z 0, below/same/above-priority characters 1/3/5, upper tiles 4.
    bands: { below: 0.5, sorted: 3, above: 4.5 },
    shadowZ: 0.59,
    bandSpread: 0.08,

    // QJ-Doodads used z directly as the tilemap layer.
    fromLegacyZ(z) {
        z = Number(z) || 0;
        if (z < 3) return 'below';
        if (z === 3) return 'sorted';
        return 'above';
    },

    resolve(d) {
        return d && this.modes.includes(d.depth) ? d.depth : this.fromLegacyZ(d && d.z);
    },

    spriteZ(d) {
        const mode = this.resolve(d);
        if (mode === 'sorted') return this.bands.sorted;
        const order = Math.max(-this.bandSpread, Math.min(this.bandSpread, (Number(d.z) || 0) * 1e-4));
        return this.bands[mode] + order;
    },

    // Bottom edge of the image (map or screen space, same as d.y) plus the user's base-line offset.
    baseY(d) {
        const h = (d.frameH || 48) * Math.abs(d.scaleY !== undefined ? d.scaleY : 1);
        const ay = d.anchorY !== undefined ? d.anchorY : 1;
        return d.y + h * (1 - ay) + (Number(d.sortOffsetY) || 0);
    },

    compareChildren(a, b) {
        if (a.z !== b.z) return a.z - b.z;
        const ay = a._docsSortY !== undefined ? a._docsSortY : a.y;
        const by = b._docsSortY !== undefined ? b._docsSortY : b.y;
        if (ay !== by) return ay - by;
        return (a.spriteId || 0) - (b.spriteId || 0);
    },

    // Flat things (rugs, puddles, paths) belong under the player; everything else stands up.
    suggestFor(asset) {
        const words = [String(asset && asset.fileName || '')].concat((asset && asset.tags) || [], (asset && asset.autoTags) || []).join(' ').toLowerCase();
        return /(^|[^a-z])(rugs?|carpets?|mats?|floor|decals?|puddles?|paths?|roads?|shadows?|stains?|cracks?|ground)([^a-z]|$)/.test(words) ? 'below' : 'sorted';
    }
};

DocsDoodads.Appearance = {
    // PIXI.BLEND_MODES values: NORMAL 0, ADD 1, MULTIPLY 2, SCREEN 3.
    blendModes: [
        { value: 0, label: 'Normal' }, { value: 1, label: 'Add (glow)' },
        { value: 2, label: 'Multiply (shade)' }, { value: 3, label: 'Screen (light)' }
    ],

    blendMode(d) {
        const value = Number(d && d.blend) || 0;
        return this.blendModes.some(mode => mode.value === value) ? value : 0;
    },

    // QJ stored "5|true~6|false"; newer data stores [[5, true]] or [{ id, value }].
    parseSwitches(input) {
        if (!input) return [];
        const out = [];
        const push = (id, value) => {
            id = parseInt(id, 10);
            if (id > 0) out.push([id, value]);
        };
        const truthy = value => value === true || /^(true|on|1)$/i.test(String(value).trim());
        if (typeof input === 'string') {
            for (const part of input.split('~')) {
                if (!part.trim()) continue;
                const [id, value] = part.split('|');
                push(id, value === undefined ? true : truthy(value));
            }
        } else if (Array.isArray(input)) {
            for (const item of input) {
                if (Array.isArray(item)) push(item[0], item[1] === undefined ? true : truthy(item[1]));
                else if (item && typeof item === 'object') push(item.id, item.value === undefined ? true : truthy(item.value));
                else push(item, true);
            }
        }
        return out;
    },

    // Inspector text such as "5:on, 6 off, 7".
    parseSwitchText(text) {
        const out = [];
        for (const part of String(text || '').split(/[,;]+/)) {
            const match = part.trim().match(/^(\d+)\s*[:=|\s]?\s*(on|off|true|false|1|0)?$/i);
            if (!match) continue;
            const id = parseInt(match[1], 10);
            if (id > 0) out.push([id, match[2] === undefined ? true : /^(on|true|1)$/i.test(match[2])]);
        }
        return out;
    },

    formatSwitches(list) {
        return this.parseSwitches(list).map(([id, value]) => `${id}:${value ? 'on' : 'off'}`).join(', ');
    },

    _conditionCache: {},

    // Conditions are JavaScript from the project's own data file, like QJ-Doodads; errors never hide a doodad.
    conditionPasses(condition) {
        const source = String(condition || '').trim();
        if (!source) return true;
        let fn = this._conditionCache[source];
        if (fn === undefined) {
            try { fn = new Function(`return (${source});`); } catch (error) { fn = null; }
            // Typing a condition in the inspector compiles every partial version; keep the cache small.
            if (Object.keys(this._conditionCache).length >= 500) this._conditionCache = {};
            this._conditionCache[source] = fn;
        }
        if (!fn) return true;
        try { return Boolean(fn()); } catch (error) { return true; }
    },

    isVisible(d, ctx = {}) {
        if (ctx.editing) return true;
        const switchValue = ctx.switchValue || (id => (typeof $gameSwitches !== 'undefined' && $gameSwitches ? $gameSwitches.value(id) : false));
        for (const [id, value] of this.parseSwitches(d.switch)) {
            if (Boolean(switchValue(id)) !== value) return false;
        }
        if (Array.isArray(d.seasons) && d.seasons.length > 0) {
            const season = ctx.season !== undefined ? ctx.season : DocsDoodads.Atmosphere.season();
            if (!DocsDoodads.Seasons.visibleIn(d, season)) return false;
        }
        return this.conditionPasses(d.condition);
    },

    // Only conditional doodads need a per-frame visibility check.
    isConditional(d) {
        return this.parseSwitches(d.switch).length > 0 || Boolean(String(d.condition || '').trim())
            || (Array.isArray(d.seasons) && d.seasons.length > 0);
    },

    needsColorFilter(d) {
        return Boolean(Number(d.r) || Number(d.g) || Number(d.b) || Number(d.grey) || Number(d.hue));
    },

    // Fields that change the filter stack; position and scale are excluded so moving stays cheap.
    signature(d) {
        const m = d.motion && d.motion.type === 'shimmer' ? 'shimmer' + (d.motion.amount || 0) : '';
        return [d.r, d.g, d.b, d.grey, d.hue, d.blur, d.contrast, d.sepia, d.bright, d.blend, m].join('|');
    }
};

// PIXI's vertex shader declares inputSize as highp; a fragment shader reading it must match or WebGL refuses to link.
const fragmentPrecision = '#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif';

DocsDoodads.Motion = {
    types: [
        { value: 'none', label: 'None' }, { value: 'sway', label: 'Sway (wind)' }, { value: 'bob', label: 'Bob (float)' },
        { value: 'pulse', label: 'Pulse (breathe)' }, { value: 'flicker', label: 'Flicker (flame)' }, { value: 'shimmer', label: 'Shimmer (water/heat)' }
    ],

    normalize(m) {
        const type = m && this.types.some(t => t.value === m.type) ? m.type : 'none';
        const amount = m && m.amount !== undefined ? Math.max(0, Math.min(1, Number(m.amount) || 0)) : 0.5;
        const speed = m && m.speed !== undefined ? Math.max(0.05, Math.min(5, Number(m.speed) || 1)) : 1;
        return { type, amount, speed, phase: m && m.phase !== undefined ? Number(m.phase) || 0 : null };
    },

    // Smooth 1D value noise in [0, 1].
    noise(x) {
        const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
        const i = Math.floor(x), f = x - i;
        const t = f * f * (3 - 2 * f);
        return hash(i) * (1 - t) + hash(i + 1) * t;
    },

    // seed (usually the doodad's x + y) staggers the phase so neighbouring props don't move in lockstep.
    // wind (-1 to 1, DocsDoodads.Wind) leans swaying props with it and makes them sway harder.
    sample(m, time, seed, wind) {
        const out = { skewX: 0, offsetY: 0, alphaMul: 1, scaleMul: 1 };
        if (!m || m.type === 'none' || !m.type) return out;
        const phase = m.phase !== null && m.phase !== undefined ? m.phase : (Number(seed) || 0) * 0.013;
        const wave = Math.sin(Math.PI * 2 * m.speed * 0.5 * time + phase);
        const w = Number(wind) || 0;
        if (m.type === 'sway') out.skewX = wave * m.amount * 0.12 * (1 + 0.8 * Math.abs(w)) + w * m.amount * 0.1;
        else if (m.type === 'bob') out.offsetY = wave * m.amount * 6;
        else if (m.type === 'pulse') out.scaleMul = 1 + wave * m.amount * 0.06;
        else if (m.type === 'flicker') out.alphaMul = 1 - m.amount * 0.35 * this.noise(time * m.speed * 8 + phase * 10);
        return out;
    },

    // Horizontal ripple for "shimmer"; inputSize is supplied by PIXI v5 filters.
    shimmerFragment: [
        fragmentPrecision,
        'varying vec2 vTextureCoord;',
        'uniform sampler2D uSampler;',
        'uniform vec4 inputSize;',
        'uniform float time;',
        'uniform float amount;',
        'void main(void) {',
        '    vec2 uv = vTextureCoord;',
        '    uv.x += sin(uv.y * inputSize.y / 7.0 + time * 3.0) * amount * 2.0 * inputSize.z;',
        '    gl_FragColor = texture2D(uSampler, uv);',
        '}'
    ].join('\n')
};

DocsDoodads.Shadow = {
    defaults: { enabled: false, opacity: 0.35, length: 0.45, angle: -35, blur: 2, offsetX: 0, offsetY: 0, followSun: false },

    normalize(s) {
        return Object.assign({}, this.defaults, s || {});
    },

    // A black silhouette of the same frame, squashed and leaning away from the camera, or, when it
    // follows the sun ({ angle, lengthMul, strength } from DocsDoodads.Sun), lying on the ground away from it.
    transform(d, sun) {
        if (!d || !d.shadow || !d.shadow.enabled) return null;
        const s = this.normalize(d.shadow);
        const sx = d.scaleX !== undefined ? d.scaleX : 1;
        const sy = d.scaleY !== undefined ? d.scaleY : 1;
        const opacity = d.opacity !== undefined ? d.opacity : 1;
        if (s.followSun && sun) {
            const t = DocsDoodads.Sun.transform(sun, s);
            return { scaleX: sx, scaleY: Math.abs(sy) * t.scaleY, skewX: 0, rotation: t.rotation, alpha: t.alpha * opacity,
                offsetX: t.offsetX, offsetY: t.offsetY, blur: t.blur, followsSun: true };
        }
        return {
            rotation: 0,
            scaleX: sx,
            scaleY: sy * Math.max(0.05, Math.min(1.5, Number(s.length) || 0)),
            skewX: (Number(s.angle) || 0) * Math.PI / 180,
            alpha: Math.max(0, Math.min(1, Number(s.opacity) || 0)) * opacity,
            offsetX: Number(s.offsetX) || 0,
            offsetY: Number(s.offsetY) || 0,
            blur: Math.max(0, Number(s.blur) || 0)
        };
    }
};

DocsDoodads.Lighting = {
    lightDefaults: { enabled: false, color: '#ffd27f', radius: 144, intensity: 0.85, flicker: 0, glow: 0.25, offsetX: 0, offsetY: -24, when: 'always' },
    whenOptions: [{ value: 'always', label: 'Always on' }, { value: 'dark', label: 'After dark (lamps, windows)' }],
    ambientDefaults: { darkness: 0, color: '#101830', switchId: 0 },

    parseColor(value, fallback = 0xffffff) {
        if (typeof value === 'number' && isFinite(value)) return value & 0xffffff;
        const match = String(value || '').trim().match(/^#?([0-9a-f]{6})$/i);
        return match ? parseInt(match[1], 16) : fallback;
    },

    channels(color) {
        const c = this.parseColor(color, 0);
        return [((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255];
    },

    // Per-map settings sit beside the numeric map keys in $dataDocsDoodads.
    mapSettings(mapId) {
        const data = typeof window !== 'undefined' ? window.$dataDocsDoodads : null;
        if (!data || !data.mapSettings) return null;
        return data.mapSettings[mapId] || null;
    },

    setMapSettings(mapId, settings) {
        if (typeof window === 'undefined' || !window.$dataDocsDoodads) return null;
        const all = window.$dataDocsDoodads.mapSettings = window.$dataDocsDoodads.mapSettings || {};
        all[mapId] = Object.assign({}, all[mapId] || {}, settings);
        return all[mapId];
    },

    // runtimeOverride comes from the "Set Ambient Light" plugin command and wins over the map setting.
    ambientFor(settings, runtimeOverride, switchValue) {
        if (runtimeOverride) {
            return { darkness: Math.max(0, Math.min(1, Number(runtimeOverride.darkness) || 0)), color: runtimeOverride.color || this.ambientDefaults.color };
        }
        const ambient = Object.assign({}, this.ambientDefaults, settings && settings.ambient);
        const gated = Number(ambient.switchId) > 0 && !(switchValue && switchValue(Number(ambient.switchId)));
        return { darkness: gated ? 0 : Math.max(0, Math.min(1, Number(ambient.darkness) || 0)), color: ambient.color };
    },

    // Plugin command fade > day/night clock (on maps that follow it) > the map's own ambient.
    resolveAmbient({ world, minutes, mapSettings, override, switchValue } = {}) {
        if (override) return this.ambientFor(null, override);
        const time = world && world.time;
        if (time && time.source && time.source !== 'off' && minutes !== null && minutes !== undefined
            && DocsDoodads.TimeOfDay.appliesToMap(mapSettings)) {
            const a = DocsDoodads.TimeOfDay.ambientAt(minutes, time.keyframes);
            return { darkness: Math.max(0, Math.min(1, a.darkness)), color: a.color };
        }
        return this.ambientFor(mapSettings, null, switchValue);
    },

    lampTarget(light, darkness, threshold) {
        if (!light || light.when !== 'dark') return 1;
        return (Number(darkness) || 0) >= (threshold === undefined ? 0.3 : Number(threshold)) ? 1 : 0;
    },

    // Fade levels for "after dark" lamps, kept outside the doodad so they are never saved.
    _lampLevels: typeof WeakMap !== 'undefined' ? new WeakMap() : null,

    // The lightmap multiplies the scene: white where lit, the ambient colour where fully dark.
    lightmapBase(ambient) {
        const k = Math.max(0, Math.min(1, Number(ambient && ambient.darkness) || 0));
        return this.channels(ambient && ambient.color).map(c => (1 - k) + k * c);
    },

    flicker(time, seed, amount) {
        amount = Math.max(0, Math.min(1, Number(amount) || 0));
        if (!amount) return 1;
        return 1 - amount * DocsDoodads.Motion.noise(time * 6 + (Number(seed) || 0) * 3.7);
    },

    // display: the map's scroll in pixels ({ x, y }) or a map-to-screen function, so lights land in screen space.
    // ctx ({ darkness, threshold, step }) switches "after dark" lamps; without it every light shows (editor previews).
    collect(doodads, display = { x: 0, y: 0 }, ctx) {
        const toScreen = typeof display === 'function' ? display : (x, y) => ({ x: x - display.x, y: y - display.y });
        const out = [];
        for (const d of doodads || []) {
            if (!d || !d.light || !d.light.enabled) continue;
            const l = Object.assign({}, this.lightDefaults, d.light);
            // A state or an event can put the light out (it fades like an "after dark" lamp in game).
            const on = DocsDoodads.WorldState ? DocsDoodads.WorldState.lightOn(d) : true;
            if (!on && !ctx) continue;
            let level = 1;
            if (ctx) {
                const target = on ? this.lampTarget(l, ctx.darkness, ctx.threshold) : 0;
                const levels = this._lampLevels;
                level = levels && levels.has(d) ? levels.get(d) : target;
                const step = ctx.step > 0 ? ctx.step : 1;
                level = level < target ? Math.min(target, level + step) : Math.max(target, level - step);
                if (levels) levels.set(d, level);
                if (level <= 0) continue;
            }
            const at = d.posMode !== 0 ? toScreen(d.x, d.y) : { x: d.x, y: d.y };
            out.push({
                doodad: d,
                x: at.x + (Number(l.offsetX) || 0),
                y: at.y + (Number(l.offsetY) || 0),
                radius: Math.max(8, Number(l.radius) || 144),
                color: this.parseColor(l.color, 0xffd27f),
                intensity: Math.max(0, Math.min(1, Number(l.intensity) || 0)) * level,
                flicker: Number(l.flicker) || 0,
                glow: Math.max(0, Math.min(1, Number(l.glow) || 0)),
                seed: (d.x || 0) + (d.y || 0)
            });
        }
        return out;
    },

    mixColor(from, to, p) {
        const a = this.channels(from), b = this.channels(to);
        const mixed = a.map((c, i) => Math.round((c + (b[i] - c) * p) * 255));
        return '#' + mixed.map(c => c.toString(16).padStart(2, '0')).join('');
    },

    startFade(from, to, frames) {
        const total = Math.max(0, Math.round(Number(frames) || 0));
        const fade = { from: Object.assign({}, from), to: Object.assign({}, to), framesTotal: total, framesLeft: total, current: Object.assign({}, total ? from : to) };
        if (!total) fade.current = Object.assign({}, to);
        return fade;
    },

    stepFade(fade) {
        if (!fade || fade.framesLeft <= 0) return fade;
        fade.framesLeft--;
        const p = 1 - fade.framesLeft / fade.framesTotal;
        const a = Number(fade.from.darkness) || 0, b = Number(fade.to.darkness) || 0;
        fade.current = { darkness: fade.framesLeft === 0 ? b : a + (b - a) * p, color: this.mixColor(fade.from.color, fade.to.color, p) };
        return fade;
    }
};


// Picture-strip animation on a doodad: which frame shows after a number of steps (one step every
// frameUpdate game frames). anim: { mode: 'loop' | 'pingpong' | 'once' | 'still', offset, frame, switchId }.
DocsDoodads.FrameAnim = {
    modes: [
        { value: 'loop', label: 'Loop' },
        { value: 'pingpong', label: 'Back and forth' },
        { value: 'once', label: 'Once (when its switch turns on)' },
        { value: 'still', label: 'Hold one frame' }
    ],

    mode(d) {
        const m = d && d.anim && d.anim.mode;
        return this.modes.some(x => x.value === m) ? m : 'loop';
    },

    // Whether the steps should advance now: 'still' never does; 'once' waits for its switch (if any).
    moving(d, switchOn) {
        const mode = this.mode(d);
        if (mode === 'still') return false;
        if (mode === 'once' && Number(d.anim && d.anim.switchId) > 0) return Boolean(switchOn);
        return true;
    },

    index(d, steps, total) {
        total = Math.max(1, Math.round(Number(total) || 1));
        const a = (d && d.anim) || {};
        const clamp = v => Math.max(0, Math.min(total - 1, Math.round(Number(v) || 0)));
        const offset = clamp(a.offset);
        steps = Math.max(0, Math.round(Number(steps) || 0));
        switch (this.mode(d)) {
            case 'still': return clamp(a.frame);
            case 'once': return Math.min(total - 1, offset + steps);
            case 'pingpong': {
                if (total < 2) return 0;
                const period = 2 * total - 2;
                const p = (offset + steps) % period;
                return p < total ? p : period - p;
            }
            default: return (offset + steps) % total;
        }
    }
};
