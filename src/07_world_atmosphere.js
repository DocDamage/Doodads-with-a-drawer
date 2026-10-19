//==========================================================
// SECTION 5C: WORLD ATMOSPHERE (DAY/NIGHT, SUN, CHARACTER FX, SEE-THROUGH, SEASONS, WATER)
//==========================================================
const cloneJson = value => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)));
const clamp01 = value => Math.max(0, Math.min(1, Number(value) || 0));

// Project-wide settings, stored as $dataDocsDoodads.world beside the maps and the per-map settings.
DocsDoodads.World = {
    defaults: {
        time: {
            source: 'off', variableId: 0, minuteVariableId: 0, minutesPerSecond: 1, startHour: 8, lampThreshold: 0.3,
            keyframes: [
                { hour: 4, darkness: 0.65, color: '#0c1030' },
                { hour: 6, darkness: 0.3, color: '#ff8a50' },
                { hour: 8, darkness: 0, color: '#ffffff' },
                { hour: 17, darkness: 0, color: '#ffffff' },
                { hour: 19, darkness: 0.3, color: '#ff6a3a' },
                { hour: 21, darkness: 0.65, color: '#0c1030' }
            ]
        },
        sun: { source: 'time', angle: 30, variableId: 0 },
        characterShadows: { enabled: false, mode: 'all', includePlayer: true, opacity: 0.35, length: 0.6, blur: 1, offsetX: 0, offsetY: 0, occlusionRegions: [] },
        motionBlur: { enabled: false, mode: 'all', strength: 1 },
        seeThrough: { enabled: true, mode: 'fade', opacity: 0.4, speed: 0.1, silhouetteColor: '#7dd3fc' },
        reflections: { enabled: false, opacity: 0.4, ripple: 0.5, regionId: 0, shoreInset: 12 },
        seasons: { source: 'off', variableId: 0, names: ['Spring', 'Summer', 'Autumn', 'Winter'], sets: [] },
        postfx: { enabled: true, quality: 'high', includePictures: false, look: {}, times: [], regions: [] },
        vfx: { library: [] },
        characterAnim: { diagonal: false, sets: [] },
        sound: { mode: 'auto', near: 2, far: 14, panWidth: 8, pitchVariance: 5, volumeVariance: 8 },
        // Zooming in on the player (mouse wheel, + and - keys, Set Zoom) and what it does to the sound.
        zoom: { enabled: false, wheel: true, keys: true, max: 2.5, step: 0.25, ease: 0.15 },
        focus: { enabled: true, music: 0.6, reach: 0.5, boost: 1.5 },
        ambience: { layers: [] },
        footsteps: { enabled: false, volume: 70, quiet: 0.35, dash: 1.2, followers: false, rows: [] },
        // Getting around (each can need a switch; Set Traversal changes them during the game).
        traversal: {
            jump: { enabled: false, distance: 2, up: 1, sound: 'Jump1', switchId: 0, noRegion: 0 },
            glide: { enabled: false, perHeight: 1.5, max: 6, switchId: 0 },
            swim: { enabled: false, speed: -1, sink: 20, suffix: '_swim', sound: '', switchId: 0, noRegion: 0 },
            dive: { enabled: false, sound: 'Dive', switchId: 0 },
            fly: { enabled: false, altitude: 48, speed: 1, sound: 'Up1', landSound: 'Down1', encounters: false, switchId: 0, noRegion: 0 },
            climb: { enabled: false, regions: '', tags: '', speed: -1, switchId: 0 },
            ice: { enabled: false, regions: '', tags: '', speed: 1, switchId: 0 },
            // Gamepad buttons (-1 = none) and on-screen buttons ('touch': on touch screens, 'always', 'never').
            controls: { padJump: 7, padFly: 6, buttons: 'touch', size: 72 }
        },
        biomes: { list: [] },
        dress: { rules: [] },
        visualEquip: { enabled: true, followers: true, events: true, battlers: true, menus: true, equipPreview: true },
        destination: {},
        // The corner minimap: on flat maps too, its fog of war (12_explored_map.js), how far the player sees.
        minimap: { flat: false, fog: false, radius: 6, size: 140 },
        // The flat-map camera (07_camera_2d.js): easing after the player (0 = MZ's own), looking ahead (tiles).
        camera2d: { smooth: 0, lookAhead: 0 },
        // Flat-map lighting (06_render_lights_directional.js): walls that stop light, and the player's flashlight.
        lighting2d: { occlusion: false, wallRegions: '', rays: 160,
            flashlight: { enabled: false, switchId: 0, radius: 280, spread: 50, color: '#fff2cc', intensity: 0.9, occlude: true } },
        // Flat-map weather extras: wind (07_map_layers_weather.js) and lightning in storms.
        weather2d: {
            wind: { strength: 0, direction: 1, gusts: 0.5, fromWeather: true, leaves: false, leafColor: '#c27c2c' },
            lightning: { enabled: false, every: 12, flash: 170, sound: 'Thunder9', volume: 90, delay: 2 }
        }
    },

    _cache: null,
    _version: 0,

    data() {
        return typeof window !== 'undefined' ? window.$dataDocsDoodads : null;
    },

    // Merged with the defaults (objects inside a group too, so traversal.jump keeps the jump defaults it
    // doesn't set; lists are taken whole). The result is shared and cached: read it, never change it.
    settings() {
        const data = this.data();
        const stored = data && data.world && typeof data.world === 'object' ? data.world : null;
        const c = this._cache;
        if (c && c.data === data && c.stored === stored && c.version === this._version) return c.value;
        const value = {};
        for (const group of Object.keys(this.defaults)) {
            value[group] = this.merge(cloneJson(this.defaults[group]), stored && stored[group] ? cloneJson(stored[group]) : {});
        }
        this._cache = { data, stored, version: this._version, value };
        return value;
    },

    merge(base, over) {
        const plain = v => v !== null && typeof v === 'object' && !Array.isArray(v);
        for (const key of Object.keys(over || {})) {
            base[key] = plain(base[key]) && plain(over[key]) ? this.merge(base[key], over[key]) : over[key];
        }
        return base;
    },

    get(path) {
        return String(path).split('.').reduce((node, key) => (node === undefined || node === null ? undefined : node[key]), this.settings());
    },

    // The value saved in the project, or undefined when the default applies.
    raw(path) {
        const data = this.data();
        return String(path).split('.').reduce((node, key) => (node === undefined || node === null ? undefined : node[key]), data && data.world);
    },

    // undefined removes the field (and empty groups) so the default applies again.
    // Any depth (traversal.jump.enabled); undefined removes the field and any groups it leaves empty.
    set(path, value) {
        const data = this.data();
        if (!data) return;
        const keys = String(path).split('.');
        const last = keys.pop();
        if (value === undefined) {
            const chain = [];
            let node = data.world;
            for (const key of keys) {
                if (!node || typeof node[key] !== 'object') { node = null; break; }
                chain.push([node, key]);
                node = node[key];
            }
            if (node) {
                delete node[last];
                for (let i = chain.length - 1; i >= 0; i--) {
                    const [parent, key] = chain[i];
                    if (Object.keys(parent[key]).length === 0) delete parent[key];
                }
                if (data.world && Object.keys(data.world).length === 0) delete data.world;
            }
        } else {
            data.world = data.world || {};
            let node = data.world;
            for (const key of keys) {
                if (!node[key] || typeof node[key] !== 'object' || Array.isArray(node[key])) node[key] = {};
                node = node[key];
            }
            node[last] = value;
        }
        this._version++;
    },

    invalidate() {
        this._version++;
    }
};

DocsDoodads.TimeOfDay = {
    sources: [
        { value: 'off', label: 'Off' },
        { value: 'clock', label: 'Running clock (saved with the game)' },
        { value: 'variable', label: 'Read from variables' }
    ],

    wrap(minutes) {
        return ((Number(minutes) % 1440) + 1440) % 1440;
    },

    format(minutes) {
        const m = Math.floor(this.wrap(minutes));
        return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
    },

    parse(text) {
        const match = String(text || '').trim().match(/^(\d+)(?::(\d+))?$/);
        if (!match) return null;
        return this.wrap(parseInt(match[1], 10) * 60 + (match[2] ? parseInt(match[2], 10) : 0));
    },

    // Ambient darkness and colour between the two keyframes around the time, wrapping through midnight.
    ambientAt(minutes, keyframes) {
        const keys = (keyframes || [])
            .filter(k => k && isFinite(Number(k.hour)))
            .map(k => ({ m: this.wrap(Number(k.hour) * 60), darkness: clamp01(k.darkness), color: k.color || '#000000' }))
            .sort((a, b) => a.m - b.m);
        if (keys.length === 0) return { darkness: 0, color: '#ffffff' };
        if (keys.length === 1) return { darkness: keys[0].darkness, color: keys[0].color };
        const t = this.wrap(minutes);
        let prev = keys[keys.length - 1], next = keys[0];
        for (let i = 0; i < keys.length; i++) {
            if (keys[i].m <= t) {
                prev = keys[i];
                next = keys[(i + 1) % keys.length];
            }
        }
        const span = this.wrap(next.m - prev.m) || 1440;
        const p = this.wrap(t - prev.m) / span;
        return {
            darkness: prev.darkness + (next.darkness - prev.darkness) * p,
            color: DocsDoodads.Lighting.mixColor(prev.color, next.color, p)
        };
    },

    newClock(minutes) {
        return { minutes: this.wrap(minutes || 0), day: 0, paused: false, speed: null };
    },

    advance(clock, frames, minutesPerSecond) {
        if (!clock || clock.paused) return clock;
        clock.minutes += (Number(frames) || 0) * (Number(minutesPerSecond) || 0) / 60;
        while (clock.minutes >= 1440) {
            clock.minutes -= 1440;
            clock.day = (clock.day || 0) + 1;
        }
        while (clock.minutes < 0) {
            clock.minutes += 1440;
            clock.day = Math.max(0, (clock.day || 0) - 1);
        }
        return clock;
    },

    // env: { variable(id), clock }. null means day/night is off.
    minutesNow(settings, env = {}) {
        const time = settings && settings.time;
        if (!time) return null;
        if (time.source === 'clock') return env.clock ? this.wrap(env.clock.minutes) : null;
        if (time.source === 'variable') {
            const read = id => (Number(id) > 0 && env.variable ? Number(env.variable(Number(id))) || 0 : 0);
            return this.wrap(read(time.variableId) * 60 + read(time.minuteVariableId));
        }
        return null;
    },

    // The running clock writes the hour (and minute) for events to read.
    syncVariables(settings, minutes, setVariable) {
        const time = settings && settings.time;
        if (!time || time.source !== 'clock' || !setVariable) return;
        const m = Math.floor(this.wrap(minutes));
        if (Number(time.variableId) > 0) setVariable(Number(time.variableId), Math.floor(m / 60));
        if (Number(time.minuteVariableId) > 0) setVariable(Number(time.minuteVariableId), m % 60);
    },

    mapModes: [
        { value: 'auto', label: 'Auto (unless the map sets its own darkness)' },
        { value: 'on', label: 'Follow the clock' },
        { value: 'off', label: 'Ignore (indoors)' }
    ],

    appliesToMap(mapSettings) {
        const mode = mapSettings && mapSettings.dayNight;
        if (mode === 'on') return true;
        if (mode === 'off') return false;
        return !(mapSettings && mapSettings.ambient && Number(mapSettings.ambient.darkness) > 0);
    }
};

// The sun crosses the sky from east to west: morning shadows point west, noon shadows point north
// (up the screen) and are shortest, evening shadows point east. A faint moon does the same at night.
DocsDoodads.Sun = {
    sources: [
        { value: 'time', label: 'Time of day' },
        { value: 'fixed', label: 'Fixed direction' },
        { value: 'variable', label: 'A variable (degrees)' }
    ],

    at(minutes) {
        const h = DocsDoodads.TimeOfDay.wrap(minutes) / 60;
        const day = h >= 6 && h < 18;
        const t = day ? (h - 6) / 12 : ((h + 6) % 24) / 12;
        const elevation = Math.sin(Math.PI * t);
        return {
            angle: (270 + 180 * t) % 360,
            lengthMul: 0.5 + 1.1 * (1 - elevation),
            strength: (day ? 1 : 0.3) * Math.min(1, elevation * 4)
        };
    },

    current(world, minutes, variable) {
        const s = Object.assign({ source: 'time', angle: 30, variableId: 0 }, world && world.sun);
        const wrap360 = a => ((Number(a) || 0) % 360 + 360) % 360;
        if (s.source === 'variable' && Number(s.variableId) > 0 && variable) {
            return { angle: wrap360(variable(Number(s.variableId))), lengthMul: 1, strength: 1 };
        }
        if (s.source === 'time' && minutes !== null && minutes !== undefined) return this.at(minutes);
        return { angle: wrap360(s.angle), lengthMul: 1, strength: 1 };
    },

    // A silhouette anchored at its base (feet) and rotated to lie along the shadow direction.
    transform(sun, style) {
        style = style || {};
        const length = Math.max(0.05, Math.min(2, (Number(style.length) || 0) * (Number(sun.lengthMul) || 1)));
        return {
            rotation: (Number(sun.angle) || 0) * Math.PI / 180,
            scaleY: length,
            alpha: clamp01(style.opacity) * clamp01(sun.strength),
            offsetX: Number(style.offsetX) || 0,
            offsetY: Number(style.offsetY) || 0,
            blur: Math.max(0, Number(style.blur) || 0)
        };
    }
};

// <shadow>, <shadow: length 0.8, opacity 0.4>, <no shadow>, <motion blur>, <no motion blur>, <no reflection>
// in an event's note or in comments on its active page.
DocsDoodads.CharacterTags = {
    _cache: typeof WeakMap !== 'undefined' ? new WeakMap() : null,

    parse(text) {
        const out = {};
        const re = /<\s*(no\s+)?(shadow|motion\s*blur|reflection|spatial)\s*(?::([^>]*))?>/gi;
        let match;
        while ((match = re.exec(String(text || '')))) {
            const on = !match[1];
            const kind = match[2].toLowerCase().replace(/\s+/g, '');
            if (kind === 'shadow') {
                out.shadow = on;
                if (on && match[3]) {
                    const length = /length\s*[:=]?\s*([\d.]+)/i.exec(match[3]);
                    const opacity = /opacity\s*[:=]?\s*([\d.]+)/i.exec(match[3]);
                    if (length) out.shadowLength = parseFloat(length[1]);
                    if (opacity) out.shadowOpacity = parseFloat(opacity[1]);
                }
            } else if (kind === 'motionblur') {
                out.motionBlur = on;
            } else if (kind === 'reflection') {
                out.reflect = on;
            } else if (kind === 'spatial') {
                out.spatial = on;
            }
        }
        const sound = /<\s*sound\s*:\s*([^>]+)>/i.exec(String(text || ''));
        if (sound) {
            const [name, volume, radius, every] = sound[1].split(',').map(p => p.trim());
            if (name) {
                out.sound = { file: /\//.test(name) ? name : 'bgs/' + name };
                if (volume) out.sound.volume = Number(volume);
                if (radius) out.sound.radius = Number(radius);
                if (every) out.sound.every = Number(every);
            }
        }
        return out;
    },

    forCharacter(character) {
        if (!character || typeof character.eventId !== 'function' || typeof character.event !== 'function') return {};
        const cache = this._cache;
        const page = character._pageIndex;
        const hit = cache ? cache.get(character) : null;
        if (hit && hit.page === page) return hit.tags;
        const data = character.event() || {};
        const lines = [data.note || ''];
        const list = typeof character.page === 'function' && character.page() ? character.page().list : null;
        for (const cmd of list || []) {
            if (cmd && (cmd.code === 108 || cmd.code === 408) && cmd.parameters) lines.push(String(cmd.parameters[0] || ''));
        }
        const tags = this.parse(lines.join('\n'));
        if (cache) cache.set(character, { page, tags });
        return tags;
    }
};

DocsDoodads.CharacterShadow = {
    modes: [{ value: 'all', label: 'Every event that stands up' }, { value: 'tagged', label: 'Only events tagged <shadow>' }],

    // info: { playerLike, priorityType, hasImage }
    enabledFor(settings, tags, info) {
        if (!settings || !settings.enabled || !info || !info.hasImage) return false;
        tags = tags || {};
        if (tags.shadow === false) return false;
        if (tags.shadow === true) return true;
        if (info.playerLike) return settings.includePlayer !== false;
        if (settings.mode === 'tagged') return false;
        return info.priorityType === 1;
    },

    styleFor(settings, tags) {
        tags = tags || {};
        return {
            opacity: tags.shadowOpacity !== undefined ? tags.shadowOpacity : settings.opacity,
            length: tags.shadowLength !== undefined ? tags.shadowLength : settings.length,
            blur: settings.blur,
            offsetX: settings.offsetX,
            offsetY: settings.offsetY
        };
    },

    // The character's whole frame. In tall grass MZ splits it into two half sprites and gives the main
    // sprite a zero-width frame, which would otherwise show the entire sheet.
    frameFor(sprite) {
        const f = sprite && sprite._frame;
        if (!f) return null;
        if (sprite._bushDepth > 0 && sprite._upperBody && sprite._upperBody._frame) {
            const u = sprite._upperBody._frame;
            const l = sprite._lowerBody && sprite._lowerBody._frame;
            if (u.width > 0) return { x: u.x, y: u.y, w: u.width, h: u.height + (l ? l.height : 0) };
        }
        if (!(f.width > 0) || !(f.height > 0)) return null;
        return { x: f.x, y: f.y, w: f.width, h: f.height };
    },

    // The shadow stops before it would run into a blocked point (roof regions), so it is never sliced by upper tiles.
    clipLength(footX, footY, angleDeg, lengthPx, isBlocked, step = 4) {
        if (!isBlocked || !(lengthPx > 0)) return Math.max(0, lengthPx || 0);
        if (isBlocked(footX, footY)) return 0;
        const rad = (Number(angleDeg) || 0) * Math.PI / 180;
        const dx = Math.sin(rad), dy = -Math.cos(rad);
        for (let d = step; d < lengthPx + step; d += step) {
            const dist = Math.min(d, lengthPx);
            if (isBlocked(footX + dx * dist, footY + dy * dist)) return Math.max(0, dist - step);
        }
        return lengthPx;
    }
};

DocsDoodads.MotionBlur = {
    maxLength: 24,
    modes: [{ value: 'all', label: 'Everyone who moves' }, { value: 'tagged', label: 'Only events tagged <motion blur>' }],

    // Blur vector (screen pixels) from one frame's movement in tiles.
    target(dxTiles, dyTiles, tileW, tileH, strength) {
        if (Math.abs(dxTiles) > 1 || Math.abs(dyTiles) > 1) return { x: 0, y: 0 };
        const vx = dxTiles * tileW, vy = dyTiles * tileH;
        const speed = Math.hypot(vx, vy);
        if (speed < 0.5) return { x: 0, y: 0 };
        const length = Math.min(this.maxLength, speed * 2 * Math.max(0, Number(strength) || 0));
        return { x: vx / speed * length, y: vy / speed * length };
    },

    step(current, target, rate = 0.5) {
        const x = current.x + (target.x - current.x) * rate;
        const y = current.y + (target.y - current.y) * rate;
        if (Math.abs(x) < 0.25 && Math.abs(y) < 0.25) return { x: 0, y: 0 };
        return { x, y };
    },

    enabledFor(settings, tags, playerLike, optionOn) {
        if (!settings || !settings.enabled || optionOn === false) return false;
        tags = tags || {};
        if (tags.motionBlur === false) return false;
        if (tags.motionBlur === true) return true;
        return settings.mode !== 'tagged';
    },

    // Samples trail behind the sprite along the movement; uVelocity is in pixels.
    fragment: [
        fragmentPrecision,
        'varying vec2 vTextureCoord;',
        'uniform sampler2D uSampler;',
        'uniform vec4 inputSize;',
        'uniform vec2 uVelocity;',
        'void main(void) {',
        '    vec2 stepUv = uVelocity * inputSize.zw / 8.0;',
        '    vec4 color = texture2D(uSampler, vTextureCoord) * 0.24;',
        '    float total = 0.24;',
        '    for (int i = 1; i <= 8; i++) {',
        '        float w = 0.2 * (1.0 - float(i) / 9.0);',
        '        color += texture2D(uSampler, vTextureCoord + stepUv * float(i)) * w;',
        '        total += w;',
        '    }',
        '    gl_FragColor = color / total;',
        '}'
    ].join('\n')
};

DocsDoodads.SeeThrough = {
    modes: [
        { value: 'fade', label: 'Fade the doodad' },
        { value: 'silhouette', label: 'Show the player as an outline' },
        { value: 'both', label: 'Both' }
    ],
    options: [
        { value: 'auto', label: 'Auto (tall standing doodads)' },
        { value: 'on', label: 'Always' },
        { value: 'off', label: 'Never' }
    ],

    appliesTo(d, settings, tileH) {
        if (!settings || !settings.enabled || !d) return false;
        if (d.seeThrough === 'off') return false;
        if (d.seeThrough === 'on') return true;
        if (DocsDoodads.Depth.resolve(d) === 'below') return false;
        return (d.frameH || 0) * Math.abs(d.scaleY !== undefined ? d.scaleY : 1) >= 1.5 * (tileH || 48);
    },

    // Hidden when at least a quarter of the player overlaps and the doodad draws over them.
    occludes(rect, baseY, depth, player, playerBaseY) {
        if (!rect || !player) return false;
        const ox = Math.min(rect.x + rect.w, player.x + player.w) - Math.max(rect.x, player.x);
        const oy = Math.min(rect.y + rect.h, player.y + player.h) - Math.max(rect.y, player.y);
        if (ox <= 0 || oy <= 0 || ox * oy < 0.25 * player.w * player.h) return false;
        if (depth === 'above') return true;
        return playerBaseY < baseY;
    },

    step(current, target, speed) {
        speed = Math.max(0.001, Number(speed) || 0.1);
        if (Math.abs(target - current) <= speed) return target;
        return current + (target > current ? speed : -speed);
    },

    silhouetteFragment: [
        'varying vec2 vTextureCoord;',
        'uniform sampler2D uSampler;',
        'uniform vec3 uColor;',
        'uniform float uAlpha;',
        'void main(void) {',
        '    float a = texture2D(uSampler, vTextureCoord).a;',
        '    gl_FragColor = vec4(uColor, 1.0) * a * uAlpha;',
        '}'
    ].join('\n')
};

// Animated show/hide for doodads controlled by switches, conditions or seasons. p runs 0 (hidden) to 1 (shown).
DocsDoodads.Transition = {
    types: [
        { value: 'none', label: 'Instant' }, { value: 'fade', label: 'Fade' }, { value: 'pop', label: 'Pop' },
        { value: 'rise', label: 'Rise' }, { value: 'dissolve', label: 'Dissolve' }, { value: 'crumble', label: 'Crumble' }
    ],
    defaults: { type: 'none', frames: 30 },

    sample(type, p) {
        p = clamp01(p);
        const out = { alphaMul: 1, scaleMul: 1, offsetY: 0, dissolve: 0 };
        switch (type) {
            case 'fade':
                out.alphaMul = p;
                break;
            case 'pop': {
                const c1 = 1.70158, c3 = c1 + 1;
                out.scaleMul = p <= 0 ? 0 : 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
                out.alphaMul = Math.min(1, p * 2);
                break;
            }
            case 'rise':
                out.offsetY = 16 * (1 - p);
                out.alphaMul = p;
                break;
            case 'dissolve':
                out.dissolve = 1 - p;
                break;
            case 'crumble':
                out.dissolve = 1 - p;
                out.offsetY = 10 * (1 - p);
                break;
            default:
                out.alphaMul = p >= 1 ? 1 : 0;
        }
        return out;
    },

    advance(progress, visible, frames) {
        const total = Math.round(Number(frames) || 0);
        if (total <= 0) return visible ? 1 : 0;
        const step = 1 / total;
        return visible ? Math.min(1, progress + step) : Math.max(0, progress - step);
    },

    // Pixels vanish in noisy order (blocks for crumble, which also drop as they go).
    dissolveFragment: [
        fragmentPrecision,
        'varying vec2 vTextureCoord;',
        'uniform sampler2D uSampler;',
        'uniform vec4 inputSize;',
        'uniform float uAmount;',
        'uniform float uBlock;',
        'uniform float uFall;',
        'float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }',
        'void main(void) {',
        '    vec2 cell = floor(vTextureCoord * inputSize.xy / uBlock);',
        '    float n = hash(cell);',
        '    vec2 uv = vTextureCoord;',
        '    uv.y -= uAmount * uFall * (0.5 + n) * inputSize.w;',
        '    vec4 color = texture2D(uSampler, uv);',
        '    gl_FragColor = n < uAmount ? vec4(0.0) : color;',
        '}'
    ].join('\n')
};

// One table swaps art for every season across the whole game: each row lists the same prop per season.
DocsDoodads.Seasons = {
    sources: [
        { value: 'off', label: 'Off' },
        { value: 'variable', label: 'A variable (0 = first season)' },
        { value: 'system', label: 'Plugin command "Set Season"' }
    ],

    normalize(path) {
        return String(path || '').replace(/\\/g, '/');
    },

    resolve(path, season, sets) {
        if (!(season >= 0) || !Array.isArray(sets) || !path) return path;
        const key = this.normalize(path);
        for (const set of sets) {
            if (!set) continue;
            const members = Object.keys(set).map(k => this.normalize(set[k]));
            if (!members.includes(key)) continue;
            return set[season] ? this.normalize(set[season]) : key;
        }
        return path;
    },

    visibleIn(d, season) {
        if (!(season >= 0)) return true;
        const list = d && d.seasons;
        if (!Array.isArray(list) || list.length === 0) return true;
        return list.includes(season);
    },

    // env: { variable(id), system }
    current(settings, env = {}) {
        if (!settings) return -1;
        const count = Array.isArray(settings.names) && settings.names.length > 0 ? settings.names.length : 4;
        const wrap = v => ((Math.floor(Number(v) || 0) % count) + count) % count;
        if (settings.source === 'variable' && Number(settings.variableId) > 0 && env.variable) return wrap(env.variable(Number(settings.variableId)));
        if (settings.source === 'system') return wrap(env.system);
        return -1;
    }
};

DocsDoodads.Reflection = {
    options: [
        { value: 'auto', label: 'Auto (standing doodads)' },
        { value: 'on', label: 'Always' },
        { value: 'off', label: 'Never' }
    ],

    // layers: tile ids for z 0-3. Water on the ground layers with nothing else drawn over it, or the chosen region.
    // Coastlines put the sand/grass edge on layer 1 over the sea on layer 0; those tiles are shore, not water.
    isWaterAt(layers, regionId, settings, isWaterTile) {
        const region = Number(settings && settings.regionId) || 0;
        if (region > 0 && regionId === region) return true;
        if (!layers || !isWaterTile) return false;
        if (layers[2] || layers[3]) return false;
        if (layers[1]) return Boolean(isWaterTile(layers[1]));
        return Boolean(isWaterTile(layers[0]));
    },

    // Mask rectangles (pixels, relative to tile 0,0) for the water tiles on screen. Each side next to dry
    // land is pulled in by `inset`, because water autotiles draw their shore border inside the water tile.
    // isWaterAt is also asked about the tiles just outside the area. Neighbours with matching edges merge.
    maskRects(cols, rows, isWaterAt, tw, th, inset) {
        inset = Math.max(0, Math.min(Math.floor(Math.min(tw, th) / 2), Number(inset) || 0));
        const rects = [];
        for (let r = 0; r < rows; r++) {
            let open = null;
            for (let c = 0; c < cols; c++) {
                if (!isWaterAt(c, r)) {
                    open = null;
                    continue;
                }
                const top = isWaterAt(c, r - 1) ? 0 : inset;
                const bottom = isWaterAt(c, r + 1) ? 0 : inset;
                const left = isWaterAt(c - 1, r) ? 0 : inset;
                const right = isWaterAt(c + 1, r) ? 0 : inset;
                if (open && left === 0 && open.top === top && open.bottom === bottom) {
                    open.rect.w += tw - right;
                } else {
                    open = { top, bottom, rect: { x: c * tw + left, y: r * th + top, w: tw - left - right, h: th - top - bottom } };
                    rects.push(open.rect);
                }
                if (right > 0) open = null;
            }
        }
        return rects;
    },

    appliesTo(d, settings) {
        if (!settings || !settings.enabled || !d) return false;
        if (d.reflect === 'off') return false;
        if (d.reflect === 'on') return true;
        return DocsDoodads.Depth.resolve(d) !== 'below';
    },

    mapEnabled(settings, mapSettings) {
        return Boolean(settings && settings.enabled) && !(mapSettings && mapSettings.reflections === false);
    }
};

// Runtime state shared by sprites each frame: time, season, sun, and where the player is.
DocsDoodads.Atmosphere = {
    _playerRect: null,
    _playerHidden: false,

    env() {
        const vars = typeof $gameVariables !== 'undefined' ? $gameVariables : null;
        const system = typeof $gameSystem !== 'undefined' ? $gameSystem : null;
        return {
            variable: id => (vars && id > 0 ? vars.value(id) : 0),
            clock: this.clock(),
            system: system ? system._docsSeason || 0 : 0
        };
    },

    clock() {
        const system = typeof $gameSystem !== 'undefined' ? $gameSystem : null;
        if (!system) return null;
        if (!system._docsClock) {
            system._docsClock = DocsDoodads.TimeOfDay.newClock((Number(DocsDoodads.World.settings().time.startHour) || 0) * 60);
        }
        return system._docsClock;
    },

    editorPreview(field) {
        const ws = DocsDoodads.Workspace;
        return ws && ws.mounted && ws[field] !== null && ws[field] !== undefined ? ws[field] : null;
    },

    minutes() {
        const preview = this.editorPreview('previewMinutes');
        if (preview !== null) return preview;
        return DocsDoodads.TimeOfDay.minutesNow(DocsDoodads.World.settings(), this.env());
    },

    season() {
        const preview = this.editorPreview('previewSeason');
        if (preview !== null) return preview;
        return DocsDoodads.Seasons.current(DocsDoodads.World.settings().seasons, this.env());
    },

    sun() {
        return DocsDoodads.Sun.current(DocsDoodads.World.settings(), this.minutes(), this.env().variable);
    },

    // "Set Feature" plugin command switches effects off for this save without touching the project.
    featureOn(name) {
        const system = typeof $gameSystem !== 'undefined' ? $gameSystem : null;
        return !(system && system._docsFeatureOff && system._docsFeatureOff[name]);
    },

    // Runs with $gameMap.update: the clock only moves on the map, never while the editor is open.
    update(sceneActive) {
        const world = DocsDoodads.World.settings();
        if (world.time.source !== 'clock' || sceneActive === false) return;
        if (DocsDoodads.Workspace && DocsDoodads.Workspace.mounted) return;
        const clock = this.clock();
        if (!clock) return;
        const speed = clock.speed !== null && clock.speed !== undefined ? clock.speed : world.time.minutesPerSecond;
        DocsDoodads.TimeOfDay.advance(clock, 1, speed);
        const vars = typeof $gameVariables !== 'undefined' ? $gameVariables : null;
        if (vars) {
            DocsDoodads.TimeOfDay.syncVariables(world, clock.minutes, (id, value) => {
                if (vars.value(id) !== value) vars.setValue(id, value);
            });
        }
    }
};

