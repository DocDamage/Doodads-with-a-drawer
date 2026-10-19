//==========================================================
// SECTION 5D: POST-PROCESSING (LOOKS, PRESETS, PASSES, SCREEN EFFECTS, MAP IMAGE EXPORT)
//==========================================================
// A "look" is one setting per effect. The map layer (or the whole spriteset with pictures) is drawn
// through up to three passes: bloom, tilt-shift (two blur directions), then one "grade" pass that does
// colour, vignette, grain, aberration, lens, CRT, pixelate, sharpen, impact zoom and shockwaves at once.
DocsDoodads.PostFX = {
    // neutral: the value at which a parameter does nothing (used when blending an effect in or out).
    effects: [
        { id: 'bloom', label: 'Bloom', params: [
            { key: 'threshold', label: 'Threshold', min: 0, max: 1, step: 0.05, def: 0.7, neutral: 1 },
            { key: 'intensity', label: 'Intensity', min: 0, max: 3, step: 0.05, def: 0.8, neutral: 0 },
            { key: 'radius', label: 'Radius', min: 1, max: 30, step: 1, def: 8, neutral: 8 }
        ] },
        { id: 'color', label: 'Colour Grading', params: [
            { key: 'exposure', label: 'Exposure (stops)', min: -2, max: 2, step: 0.05, def: 0, neutral: 0 },
            { key: 'contrast', label: 'Contrast', min: 0.5, max: 2, step: 0.05, def: 1, neutral: 1 },
            { key: 'saturation', label: 'Saturation', min: 0, max: 2, step: 0.05, def: 1, neutral: 1 },
            { key: 'temperature', label: 'Temperature (cool - warm)', min: -1, max: 1, step: 0.05, def: 0, neutral: 0 },
            { key: 'tint', label: 'Tint (magenta - green)', min: -1, max: 1, step: 0.05, def: 0, neutral: 0 },
            { key: 'shadows', label: 'Shadow colour', type: 'color', def: '#808080', neutral: '#808080' },
            { key: 'highlights', label: 'Highlight colour', type: 'color', def: '#808080', neutral: '#808080' },
            { key: 'split', label: 'Split toning', min: 0, max: 1, step: 0.05, def: 0, neutral: 0 }
        ] },
        { id: 'vignette', label: 'Vignette', screenSpace: true, params: [
            { key: 'amount', label: 'Amount', min: 0, max: 1, step: 0.05, def: 0.4, neutral: 0 },
            { key: 'softness', label: 'Softness', min: 0.05, max: 1, step: 0.05, def: 0.45, neutral: 0.45 },
            { key: 'color', label: 'Colour', type: 'color', def: '#000000' }
        ] },
        { id: 'grain', label: 'Film Grain', screenSpace: true, params: [
            { key: 'amount', label: 'Amount', min: 0, max: 1, step: 0.05, def: 0.15, neutral: 0 },
            { key: 'size', label: 'Size', min: 1, max: 4, step: 0.5, def: 1.5, neutral: 1.5 },
            { key: 'animated', label: 'Animated', type: 'checkbox', def: true }
        ] },
        { id: 'aberration', label: 'Chromatic Aberration', screenSpace: true, params: [
            { key: 'amount', label: 'Amount', min: 0, max: 3, step: 0.05, def: 0.5, neutral: 0 }
        ] },
        { id: 'lens', label: 'Lens Distortion', screenSpace: true, params: [
            { key: 'distortion', label: 'Barrel (+) / pincushion (-)', min: -0.5, max: 0.5, step: 0.01, def: 0.15, neutral: 0 }
        ] },
        { id: 'crt', label: 'CRT', screenSpace: true, params: [
            { key: 'scanlines', label: 'Scanlines', min: 0, max: 1, step: 0.05, def: 0.5, neutral: 0 },
            { key: 'curvature', label: 'Curvature', min: 0, max: 0.5, step: 0.01, def: 0.12, neutral: 0 },
            { key: 'mask', label: 'RGB mask', min: 0, max: 1, step: 0.05, def: 0.3, neutral: 0 }
        ] },
        { id: 'pixelate', label: 'Pixelate', params: [
            { key: 'size', label: 'Pixel size', min: 1, max: 12, step: 1, def: 3, neutral: 1 }
        ] },
        { id: 'sharpen', label: 'Sharpen', params: [
            { key: 'amount', label: 'Amount', min: 0, max: 2, step: 0.05, def: 0.4, neutral: 0 }
        ] },
        { id: 'tiltShift', label: 'Tilt-Shift (miniature)', screenSpace: true, params: [
            { key: 'blur', label: 'Blur', min: 0, max: 12, step: 0.5, def: 6, neutral: 0 },
            { key: 'focus', label: 'Focus line (0 top - 1 bottom)', min: 0, max: 1, step: 0.01, def: 0.55, neutral: 0.55 },
            { key: 'band', label: 'Sharp band', min: 0, max: 0.5, step: 0.01, def: 0.12, neutral: 0.12 }
        ] }
    ],

    presets: [
        { id: 'cinematic', label: 'Cinematic', look: {
            color: { enabled: true, contrast: 1.12, saturation: 0.92, shadows: '#1f6f8b', highlights: '#f0a35e', split: 0.35 },
            vignette: { enabled: true, amount: 0.35, softness: 0.5 }, grain: { enabled: true, amount: 0.06 } } },
        { id: 'golden', label: 'Golden Hour', look: {
            bloom: { enabled: true, threshold: 0.72, intensity: 0.7, radius: 10 },
            color: { enabled: true, temperature: 0.55, exposure: 0.15, saturation: 1.1 },
            vignette: { enabled: true, amount: 0.3, color: '#2a1200' } } },
        { id: 'dreamy', label: 'Dreamy', look: {
            bloom: { enabled: true, threshold: 0.6, intensity: 1, radius: 16 },
            color: { enabled: true, saturation: 1.15, contrast: 0.92, exposure: 0.1 },
            vignette: { enabled: true, amount: 0.25, softness: 0.7, color: '#fff0f8' } } },
        { id: 'retro', label: 'Retro CRT', look: {
            crt: { enabled: true, scanlines: 0.55, curvature: 0.12, mask: 0.35 }, aberration: { enabled: true, amount: 0.6 },
            grain: { enabled: true, amount: 0.12 }, vignette: { enabled: true, amount: 0.3 } } },
        { id: 'noir', label: 'Noir', look: {
            color: { enabled: true, saturation: 0, contrast: 1.35 }, grain: { enabled: true, amount: 0.2 },
            vignette: { enabled: true, amount: 0.55 } } },
        { id: 'horror', label: 'Horror', look: {
            color: { enabled: true, saturation: 0.45, tint: -0.35, contrast: 1.15, exposure: -0.25 },
            vignette: { enabled: true, amount: 0.7, color: '#200000' }, grain: { enabled: true, amount: 0.18 },
            aberration: { enabled: true, amount: 0.4 } } },
        { id: 'underwater', label: 'Underwater', look: {
            color: { enabled: true, temperature: -0.6, tint: 0.15, saturation: 0.9 }, lens: { enabled: true, distortion: 0.08 },
            aberration: { enabled: true, amount: 0.3 }, vignette: { enabled: true, amount: 0.4, color: '#001830' } } },
        { id: 'miniature', label: 'Miniature', look: {
            tiltShift: { enabled: true, blur: 7, focus: 0.55, band: 0.1 }, color: { enabled: true, saturation: 1.35, contrast: 1.1 },
            sharpen: { enabled: true, amount: 0.3 } } },
        { id: 'pixel', label: 'Pixel Art', look: {
            pixelate: { enabled: true, size: 3 }, color: { enabled: true, saturation: 1.1 } } }
    ],

    qualities: [
        { value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low (no tilt-shift)' }, { value: 'off', label: 'Off' }
    ],

    normalizeParam(p, value) {
        if (p.type === 'color') return /^#[0-9a-f]{6}$/i.test(String(value || '')) ? String(value).toLowerCase() : p.def;
        if (p.type === 'checkbox') return typeof value === 'boolean' ? value : p.def;
        const n = Number(value);
        if (value === undefined || value === null || value === '' || !isFinite(n)) return p.def;
        return Math.max(p.min, Math.min(p.max, n));
    },

    normalizeLook(look) {
        const out = {};
        for (const effect of this.effects) {
            const src = look && look[effect.id] && typeof look[effect.id] === 'object' ? look[effect.id] : {};
            const e = { enabled: src.enabled === true };
            for (const p of effect.params) e[p.key] = this.normalizeParam(p, src[p.key]);
            out[effect.id] = e;
        }
        return out;
    },

    defaultLook() {
        return this.normalizeLook(null);
    },

    isActive(look) {
        return Boolean(look) && this.effects.some(e => look[e.id] && look[e.id].enabled);
    },

    presetLook(id) {
        const preset = this.presets.find(p => p.id === id);
        return preset ? this.normalizeLook(cloneJson(preset.look)) : null;
    },

    // An effect missing on one side blends from/to its neutral value; it stays on until the blend ends.
    lerpLook(a, b, t) {
        a = this.normalizeLook(a);
        b = this.normalizeLook(b);
        t = clamp01(t);
        const out = {};
        for (const effect of this.effects) {
            const ea = a[effect.id], eb = b[effect.id];
            if (!ea.enabled && !eb.enabled) {
                out[effect.id] = eb;
                continue;
            }
            const e = { enabled: t >= 1 ? eb.enabled : t <= 0 ? ea.enabled : true };
            for (const p of effect.params) {
                // Parameters without a neutral value (a vignette's colour) borrow the enabled side's value.
                const side = (src, other) => (src.enabled ? src[p.key] : p.neutral !== undefined ? p.neutral : other[p.key]);
                const va = side(ea, eb), vb = side(eb, ea);
                if (p.type === 'color') e[p.key] = DocsDoodads.Lighting.mixColor(va, vb, t);
                else if (p.type === 'checkbox') e[p.key] = t < 0.5 ? va : vb;
                else e[p.key] = t >= 1 ? vb : va + (vb - va) * t;
            }
            out[effect.id] = e;
        }
        return out;
    },

    fadeStart(from, to, frames) {
        const total = Math.max(0, Math.round(Number(frames) || 0));
        const fade = { from: this.normalizeLook(from), to: this.normalizeLook(to), framesTotal: total, framesLeft: total };
        fade.current = total ? cloneJson(fade.from) : cloneJson(fade.to);
        return fade;
    },

    fadeStep(fade) {
        if (!fade || fade.framesLeft <= 0) return fade;
        fade.framesLeft--;
        fade.current = this.lerpLook(fade.from, fade.to, 1 - fade.framesLeft / fade.framesTotal);
        return fade;
    },

    // runtime (plugin command) > the map's choice (off / its own look) > the game-wide look; then the looks
    // by time (when minutes is given) and by region (regionWeights) are mixed in (Blends, below).
    resolveLook({ world, mapSettings, runtime, minutes, regionWeights } = {}) {
        if (runtime) {
            const look = this.normalizeLook(runtime);
            return this.isActive(look) ? look : null;
        }
        const pf = world && world.postfx;
        if (!pf || pf.enabled === false) return null;
        const mine = mapSettings && mapSettings.postfx;
        if (mine && mine.mode === 'off') return null;
        let look = this.normalizeLook(mine && mine.mode === 'custom' ? mine.look : pf.look);
        if (this.Blends) look = this.Blends.apply(look, { world, mapSettings, minutes, regionWeights });
        return this.isActive(look) ? look : null;
    },

    // resolveLook for the map each frame: kept while its inputs stay (the world's and map's settings, a
    // Set Look fade, the clock to a quarter minute, the region weights), so a still scene resolves once.
    // The editor changes looks in place, so it resolves afresh there. The result is shared: never change it.
    resolveLookCached(inputs = {}) {
        const editing = Boolean(DocsDoodads.Workspace && DocsDoodads.Workspace.mounted);
        const { world, mapSettings, runtime, minutes, regionWeights } = inputs;
        const quarter = minutes === undefined || minutes === null ? minutes : Math.round(Number(minutes) * 4) / 4;
        const c = this._resolved;
        const sameWeights = (a, b) => {
            if (a === b) return true;
            if (!a || !b) return false;
            const ka = Object.keys(a), kb = Object.keys(b);
            return ka.length === kb.length && ka.every(k => a[k] === b[k]);
        };
        if (!editing && c && c.world === world && c.mapSettings === mapSettings && c.runtime === runtime && c.minutes === quarter
            && sameWeights(c.weights, regionWeights)) return c.look;
        const look = this.resolveLook(inputs);
        this._resolved = editing ? null : { world, mapSettings, runtime, minutes: quarter, weights: regionWeights ? Object.assign({}, regionWeights) : regionWeights, look };
        return look;
    },

    // The player's Options choice (0 high .. 3 off) can lower the project's quality, never raise it.
    effectiveQuality(project, playerOption) {
        const levels = ['high', 'medium', 'low', 'off'];
        const index = Math.max(Math.max(0, levels.indexOf(project)), Math.max(0, Math.min(3, Number(playerOption) || 0)));
        return levels[index];
    },

    bloomBlurQuality(quality) {
        return quality === 'low' ? 2 : quality === 'medium' ? 3 : 4;
    },

    gradeIds: ['color', 'vignette', 'grain', 'aberration', 'lens', 'crt', 'pixelate', 'sharpen'],

    passes(look, quality, anim) {
        if (quality === 'off') return [];
        const out = [];
        if ((look && look.bloom.enabled) || (anim && anim.bloom > 0)) out.push('bloom');
        if (look && look.tiltShift.enabled && quality !== 'low') out.push('tiltShift');
        const animated = anim && ((anim.zoom !== undefined && anim.zoom !== 1) || (anim.shock && anim.shock[3] > 0) || anim.aberration > 0);
        if ((look && this.gradeIds.some(id => look[id].enabled)) || animated) out.push('grade');
        return out;
    },

    // Grade-pass uniforms; disabled effects use their neutral values.
    uniforms(look, anim, time) {
        look = look || this.defaultLook();
        // The params by effect and key, indexed once (this ran ~25 linear finds a frame).
        if (!this._paramIndex) {
            this._paramIndex = new Map();
            for (const effect of this.effects) for (const p of effect.params) this._paramIndex.set(effect.id + '.' + p.key, p);
        }
        const v = (id, key) => {
            const p = this._paramIndex.get(id + '.' + key);
            return look[id].enabled || p.neutral === undefined ? look[id][key] : p.neutral;
        };
        const ch = c => DocsDoodads.Lighting.channels(c);
        return {
            uExposure: Math.pow(2, v('color', 'exposure')),
            uContrast: v('color', 'contrast'),
            uSaturation: v('color', 'saturation'),
            uTemperature: v('color', 'temperature'),
            uTint: v('color', 'tint'),
            uShadowColor: ch(v('color', 'shadows')),
            uHighlightColor: ch(v('color', 'highlights')),
            uSplit: v('color', 'split'),
            uVignette: v('vignette', 'amount'),
            uVignetteSoft: v('vignette', 'softness'),
            uVignetteColor: ch(look.vignette.color),
            uGrain: v('grain', 'amount'),
            uGrainSize: v('grain', 'size'),
            uTime: look.grain.animated ? (Number(time) || 0) : 0,
            uAberration: v('aberration', 'amount') + (anim && anim.aberration ? anim.aberration : 0),
            uDistortion: v('lens', 'distortion'),
            uScanlines: v('crt', 'scanlines'),
            uCurvature: v('crt', 'curvature'),
            uMask: v('crt', 'mask'),
            uPixel: v('pixelate', 'size'),
            uSharpen: v('sharpen', 'amount'),
            uZoom: anim && anim.zoom ? anim.zoom : 1,
            uZoomCenter: anim && anim.zoomCenter ? anim.zoomCenter : [0.5, 0.5],
            uShock: anim && anim.shock ? anim.shock : [0.5, 0.5, 0, 0]
        };
    },

    // Effects shaped by the screen would repeat on every screen-sized piece of an exported map image.
    exportLook(look) {
        const out = this.normalizeLook(look);
        for (const effect of this.effects) if (effect.screenSpace) out[effect.id].enabled = false;
        return out;
    },

    // Screen effects started by the "Play Screen Effect" command; positions are 0-1 across the screen.
    Animations: {
        types: [
            { value: 'zoomPunch', label: 'Impact Zoom' },
            { value: 'shockwave', label: 'Shockwave' },
            { value: 'chromaticPunch', label: 'Chromatic Punch' },
            { value: 'bloomFlash', label: 'Bloom Flash' }
        ],

        start(list, spec, frame) {
            if (!spec || !this.types.some(t => t.value === spec.type)) return null;
            const anim = {
                type: spec.type,
                strength: spec.strength !== undefined && isFinite(Number(spec.strength)) ? Number(spec.strength) : 1,
                duration: Math.max(1, Math.round(Number(spec.duration) || 30)),
                center: Array.isArray(spec.center) ? spec.center.slice(0, 2) : [0.5, 0.5],
                start: Number(frame) || 0
            };
            list.push(anim);
            return anim;
        },

        sample(list, frame) {
            const out = { zoom: 1, zoomCenter: [0.5, 0.5], shock: [0.5, 0.5, 0, 0], aberration: 0, bloom: 0 };
            for (let i = list.length - 1; i >= 0; i--) {
                const a = list[i];
                const t = (frame - a.start) / a.duration;
                if (t >= 1) {
                    list.splice(i, 1);
                    continue;
                }
                if (t < 0) continue;
                const fall = (1 - t) * (1 - t);
                if (a.type === 'zoomPunch') {
                    const env = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85;
                    out.zoom *= 1 + a.strength * env * env * (3 - 2 * env);
                    out.zoomCenter = a.center;
                } else if (a.type === 'shockwave') {
                    out.shock = [a.center[0], a.center[1], t * 0.9, a.strength * 0.06 * (1 - t)];
                } else if (a.type === 'chromaticPunch') {
                    out.aberration += a.strength * 3 * fall;
                } else if (a.type === 'bloomFlash') {
                    out.bloom += a.strength * 2 * fall;
                }
            }
            return out;
        }
    },

    gradeFragment: [
        fragmentPrecision,
        'varying vec2 vTextureCoord;',
        'uniform sampler2D uSampler;',
        'uniform vec4 inputSize;',
        'uniform vec4 outputFrame;',
        'uniform vec4 inputClamp;',
        'uniform float uTime;',
        'uniform float uExposure; uniform float uContrast; uniform float uSaturation; uniform float uTemperature; uniform float uTint;',
        'uniform vec3 uShadowColor; uniform vec3 uHighlightColor; uniform float uSplit;',
        'uniform float uVignette; uniform float uVignetteSoft; uniform vec3 uVignetteColor;',
        'uniform float uGrain; uniform float uGrainSize;',
        'uniform float uAberration; uniform float uDistortion;',
        'uniform float uScanlines; uniform float uCurvature; uniform float uMask;',
        'uniform float uPixel; uniform float uSharpen;',
        'uniform float uZoom; uniform vec2 uZoomCenter; uniform vec4 uShock;',
        'float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }',
        'vec2 toUv(vec2 n) { return clamp(n * outputFrame.zw * inputSize.zw, inputClamp.xy, inputClamp.zw); }',
        'vec4 tex(vec2 n) { return texture2D(uSampler, toUv(n)); }',
        'void main(void) {',
        '    vec2 screen = vTextureCoord * inputSize.xy / outputFrame.zw;',
        '    vec2 n = screen;',
        '    float aspect = outputFrame.z / outputFrame.w;',
        '    n = uZoomCenter + (n - uZoomCenter) / uZoom;',
        '    if (uShock.w > 0.0) {',
        '        vec2 d = (n - uShock.xy) * vec2(aspect, 1.0);',
        '        float dist = length(d);',
        '        float ring = 1.0 - smoothstep(0.0, 0.08, abs(dist - uShock.z));',
        '        if (dist > 0.0001) n -= normalize(d) / vec2(aspect, 1.0) * ring * uShock.w;',
        '    }',
        '    vec2 c = n - 0.5;',
        '    float r2 = dot(c, c);',
        '    n = 0.5 + c * (1.0 + (uDistortion + uCurvature) * r2 * 2.0);',
        '    bool outside = uCurvature > 0.0 && (n.x < 0.0 || n.x > 1.0 || n.y < 0.0 || n.y > 1.0);',
        '    if (uPixel > 1.0) { vec2 cells = outputFrame.zw / uPixel; n = (floor(n * cells) + 0.5) / cells; }',
        '    vec4 color = tex(n);',
        '    if (uAberration > 0.0) {',
        '        vec2 off = (n - 0.5) * uAberration * 0.012;',
        '        color.r = tex(n + off).r;',
        '        color.b = tex(n - off).b;',
        '    }',
        '    if (uSharpen > 0.0) {',
        '        vec2 px = 1.0 / outputFrame.zw;',
        '        vec4 around = (tex(n + vec2(px.x, 0.0)) + tex(n - vec2(px.x, 0.0)) + tex(n + vec2(0.0, px.y)) + tex(n - vec2(0.0, px.y))) * 0.25;',
        '        color.rgb += (color.rgb - around.rgb) * uSharpen;',
        '    }',
        '    float a = color.a;',
        '    vec3 rgb = a > 0.0 ? color.rgb / a : color.rgb;',
        '    rgb *= uExposure;',
        '    rgb *= vec3(1.0 + uTemperature * 0.2, 1.0 + uTint * 0.2, 1.0 - uTemperature * 0.2);',
        '    rgb = (rgb - 0.5) * uContrast + 0.5;',
        '    float luma = dot(rgb, vec3(0.299, 0.587, 0.114));',
        '    rgb = mix(vec3(luma), rgb, uSaturation);',
        '    rgb += ((uShadowColor - 0.5) * (1.0 - luma) + (uHighlightColor - 0.5) * luma) * uSplit;',
        '    vec2 vc = (screen - 0.5) * vec2(aspect, 1.0) / sqrt(aspect * aspect * 0.25 + 0.25);',
        '    float vig = 1.0 - smoothstep(max(0.0, 1.0 - uVignetteSoft * 1.2), 1.05, length(vc));',
        '    rgb = mix(uVignetteColor, rgb, mix(1.0, vig, uVignette));',
        '    vec2 pix = screen * outputFrame.zw;',
        '    if (uScanlines > 0.0) rgb *= 1.0 - uScanlines * 0.4 * mod(floor(pix.y), 2.0);',
        '    if (uMask > 0.0) {',
        '        float m = mod(floor(pix.x), 3.0);',
        '        vec3 mask = m < 1.0 ? vec3(1.0, 0.7, 0.7) : (m < 2.0 ? vec3(0.7, 1.0, 0.7) : vec3(0.7, 0.7, 1.0));',
        '        rgb *= mix(vec3(1.0), mask, uMask);',
        '    }',
        '    if (uGrain > 0.0) rgb += (hash(floor(pix / uGrainSize) + fract(uTime * 7.31) * 113.0) - 0.5) * uGrain * 0.35;',
        '    if (outside) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }',
        '    gl_FragColor = vec4(clamp(rgb, 0.0, 1.0) * a, a);',
        '}'
    ].join('\n'),

    bloomExtractFragment: [
        fragmentPrecision,
        'varying vec2 vTextureCoord;',
        'uniform sampler2D uSampler;',
        'uniform float uThreshold;',
        'void main(void) {',
        '    vec4 c = texture2D(uSampler, vTextureCoord);',
        '    float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));',
        // Only the light above the threshold glows, so mid-tones (grass, paving) stay as they are.
        '    float excess = max(l - uThreshold, 0.0) / max(1.0 - uThreshold, 0.0001);',
        '    gl_FragColor = c * clamp(excess, 0.0, 1.0);',
        '}'
    ].join('\n'),

    bloomCombineFragment: [
        fragmentPrecision,
        'varying vec2 vTextureCoord;',
        'uniform sampler2D uSampler;',
        'uniform sampler2D uBloom;',
        'uniform float uIntensity;',
        'void main(void) {',
        '    vec4 base = texture2D(uSampler, vTextureCoord);',
        '    vec4 glow = texture2D(uBloom, vTextureCoord);',
        // Screen blend: the glow brightens without clipping everything to white.
        '    vec3 g = clamp(glow.rgb * uIntensity, 0.0, 1.0) * base.a;',
        '    gl_FragColor = vec4(base.rgb + g - base.rgb * g / max(base.a, 0.0001), base.a);',
        '}'
    ].join('\n'),

    // One blur direction per pass; the radius grows away from the sharp band.
    tiltFragment: [
        fragmentPrecision,
        'varying vec2 vTextureCoord;',
        'uniform sampler2D uSampler;',
        'uniform vec4 inputSize;',
        'uniform vec4 outputFrame;',
        'uniform vec4 inputClamp;',
        'uniform vec2 uDir;',
        'uniform float uBlur;',
        'uniform float uFocus;',
        'uniform float uBand;',
        'void main(void) {',
        '    vec2 screen = vTextureCoord * inputSize.xy / outputFrame.zw;',
        '    float d = max(0.0, abs(screen.y - uFocus) - uBand);',
        '    float r = clamp(d / 0.25, 0.0, 1.0) * uBlur;',
        '    vec4 sum = vec4(0.0);',
        '    float total = 0.0;',
        '    for (int i = -4; i <= 4; i++) {',
        '        float w = 1.0 - abs(float(i)) / 5.0;',
        '        vec2 uv = clamp(vTextureCoord + uDir * float(i) * r * 0.25 * inputSize.zw, inputClamp.xy, inputClamp.zw);',
        '        sum += texture2D(uSampler, uv) * w;',
        '        total += w;',
        '    }',
        '    gl_FragColor = sum / total;',
        '}'
    ].join('\n'),

    // Runtime: the plugin-command look fades once per frame.
    _anims: [],
    _runtimeFrame: -1,

    runtimeLook() {
        const system = typeof $gameSystem !== 'undefined' ? $gameSystem : null;
        const fade = system ? system._docsLook : null;
        if (!fade) return null;
        const frame = DocsDoodads.frameCount();
        if (frame !== this._runtimeFrame) {
            this._runtimeFrame = frame;
            this.fadeStep(fade);
            if (fade.framesLeft <= 0 && fade.clearWhenDone) {
                system._docsLook = null;
                return null;
            }
            // A finished fade only needs where it ended (it is kept in save files).
            if (fade.framesLeft <= 0 && (fade.from || fade.to)) {
                delete fade.from;
                delete fade.to;
            }
        }
        return fade.current;
    }
};

// Full-map image: the camera visits screen-sized pieces of the map and each is copied into one picture.
DocsDoodads.MapExport = {
    maxSide: 16384,

    plan(mapW, mapH, tileW, tileH, screenW, screenH, scale) {
        scale = Number(scale) || 1;
        const W = mapW * tileW, H = mapH * tileH;
        const width = Math.round(W * scale), height = Math.round(H * scale);
        if (width > this.maxSide || height > this.maxSide) {
            const fit = Math.floor(this.maxSide / Math.max(W, H) * 100) / 100;
            return { width, height, chunks: [], error: `The image would be ${width} x ${height} pixels; the limit is ${this.maxSide}. Choose a scale of ${fit} or less.` };
        }
        const axis = (total, view) => {
            const out = [];
            for (let at = 0; at < total; at += view) {
                const camera = Math.min(at, Math.max(0, total - view));
                const offset = at - camera;
                out.push({ camera, offset, size: Math.min(view - offset, total - at), at });
            }
            return out;
        };
        const chunks = [];
        for (const y of axis(H, screenH)) {
            for (const x of axis(W, screenW)) {
                chunks.push({ displayX: x.camera / tileW, displayY: y.camera / tileH, sx: x.offset, sy: y.offset, w: x.size, h: y.size, dx: x.at, dy: y.at });
            }
        }
        return { width, height, scale, chunks };
    },

    fileName(mapId, date) {
        const d = date || new Date();
        const p = (v, n = 2) => String(v).padStart(n, '0');
        return `Map${p(mapId, 3)}_${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.png`;
    }
};

