//==========================================================
// SECTION 4A: LIGHT IN THE AIR, SOFT SHADOWS AND GLOW OFF WALLS (7.3.7, 8.3.2)
//==========================================================
// Light shafts are one more Screen Looks effect (`rays`): what stops light (wall tiles and doodads marked "Stops
// light shafts") is drawn black on white into a quarter-size picture, and each pixel looks back along the line
// to the light (the sun, off screen in its direction, or the brightest lamp near the player), adding light where
// the way is clear. Strongest at a low sun, none at night, more in fog. Effects Quality: 12 samples at Medium,
// none at Low.
// Soft shadows and Glow off walls are one map's setting `softLight: { shadows, bounce }`: a lamp's wall mask is
// blurred at its edges, and faint lights are added where its light meets a wall so it comes a little way round
// corners. Quality: none at Low, shadows at Medium, both at High. These are not global illumination.
DocsDoodads.Rays = {
    maxSamples: 24,

    samples(quality) {
        return quality === 'high' ? 24 : quality === 'medium' ? 12 : 0;
    },

    // The sun's place on screen (0-1, beyond the edge): opposite the way shadows fall (Sun.angle, 0 = north).
    sunPosition(angle) {
        const a = (Number(angle) || 0) * Math.PI / 180;
        return [0.5 - Math.sin(a) * 1.2, 0.5 + Math.cos(a) * 1.2];
    },

    // How strong the shafts are now: the look's strength, by a low sun (none at night), raised by fog.
    strength(rays, opts = {}) {
        if (!rays || !rays.enabled || !(this.samples(opts.quality) > 0)) return 0;
        let k = Math.max(0, Number(rays.strength) || 0);
        if (!rays.fromLamps) {
            const minutes = opts.minutes;
            if (minutes !== null && minutes !== undefined) {
                const h = DocsDoodads.TimeOfDay.wrap(minutes) / 60;
                if (h < 6 || h >= 18) return 0;
                const elevation = Math.sin(Math.PI * (h - 6) / 12);
                k *= 0.35 + 0.65 * (1 - elevation);
            }
        }
        if (opts.foggy) k *= 1.35;
        return Math.min(2, k);
    },

    foggy(mapSettings) {
        return ((mapSettings && mapSettings.layers) || []).some(l => l && /fog|mist|haze/i.test(String(l.preset || l.name || l.path || '')));
    },

    // The lamp the shafts come from: the strongest on screen, nearest the player first. lights: as drawn
    // (screen x, y, radius, intensity). null when none is on screen.
    pickLamp(lights, w, h, player) {
        let best = null, score = 0;
        for (const l of lights || []) {
            if (!l || l.bounce || l.x < -l.radius || l.y < -l.radius || l.x > w + l.radius || l.y > h + l.radius) continue;
            const near = player ? 1 / (1 + Math.hypot(l.x - player.x, l.y - player.y) / 200) : 1;
            const s = (Number(l.intensity) || 0) * (Number(l.radius) || 0) * near;
            if (s > score) { score = s; best = l; }
        }
        return best;
    },

    // A doodad that throws shafts' shadows: marked, or a wall (collision) when the map's walls stop light.
    shades(d) {
        return Boolean(d && d.shade);
    },

    fragment: [
        'precision mediump float;',
        'varying vec2 vTextureCoord;',
        'uniform sampler2D uSampler;',
        'uniform sampler2D uMask;',
        'uniform vec4 inputSize;',
        'uniform vec4 outputFrame;',
        'uniform vec2 uLight;',
        'uniform vec3 uColor;',
        'uniform float uStrength;',
        'uniform float uLength;',
        'uniform float uSamples;',
        'uniform float uRadius;',
        'uniform float uAspect;',
        'void main(void) {',
        '    vec4 base = texture2D(uSampler, vTextureCoord);',
        '    vec2 screen = vTextureCoord * inputSize.xy / outputFrame.zw;',
        '    vec2 delta = (uLight - screen) * uLength / uSamples;',
        '    vec2 p = screen;',
        '    float sum = 0.0;',
        '    float total = 0.0;',
        '    float w = 1.0;',
        '    for (int i = 0; i < 24; i++) {',
        '        if (float(i) >= uSamples) break;',
        '        p += delta;',
        '        sum += texture2D(uMask, clamp(p, 0.0, 1.0)).r * w;',
        '        total += w;',
        '        w *= 0.94;',
        '    }',
        '    float lit = sum / max(total, 0.0001);',
        '    float fall = 1.0;',
        '    if (uRadius > 0.0) {',
        '        vec2 d = (screen - uLight) * vec2(uAspect, 1.0);',
        '        fall = clamp(1.0 - length(d) / uRadius, 0.0, 1.0);',
        '    }',
        '    gl_FragColor = vec4(base.rgb + uColor * lit * uStrength * fall * 0.35 * base.a, base.a);',
        '}'
    ].join('\n')
};

DocsDoodads.SoftLight = {
    normalize(s) {
        return { shadows: Boolean(s && s.shadows), bounce: Boolean(s && s.bounce) };
    },

    // What runs at an Effects Quality.
    levels(settings, quality) {
        const s = this.normalize(settings);
        if (quality === 'low' || quality === 'off') return { shadows: false, bounce: false };
        return { shadows: s.shadows, bounce: s.bounce && quality === 'high' };
    },

    // How far a soft edge spreads, in pixels, for a light's radius.
    blur(radius) {
        return Math.max(2, Math.min(16, (Number(radius) || 0) * 0.06));
    },

    // Where a light's outline (map pixels, flat [x, y, ...]) stops short of its reach, it met a wall: up to `max`
    // faint lights there, spread round the outline, pulled a little back toward the light so they glow off it.
    bounces(light, pts, max = 6) {
        if (!light || !pts || pts.length < 6) return [];
        const r = Number(light.radius) || 0, cx = Number(light.mapX) || 0, cy = Number(light.mapY) || 0;
        const hits = [];
        for (let i = 0; i < pts.length; i += 2) {
            const dx = pts[i] - cx, dy = pts[i + 1] - cy, d = Math.hypot(dx, dy);
            if (d > 4 && d < r * 0.92) hits.push({ x: pts[i] - dx / d * 6, y: pts[i + 1] - dy / d * 6, d });
        }
        if (!hits.length) return [];
        const out = [], step = Math.max(1, Math.floor(hits.length / max));
        for (let i = 0; i < hits.length && out.length < max; i += step) {
            const h = hits[i], near = 1 - h.d / r;
            out.push({ mapX: h.x, mapY: h.y, radius: Math.max(16, r * 0.35), intensity: (Number(light.intensity) || 1) * 0.22 * (0.5 + near * 0.5) });
        }
        return out;
    }
};
