DocsDoodads.Haze = {
    presets: {
        campfire: { radius: 96, strength: 3, speed: 1, shape: 'circle' },
        lava: { radius: 160, strength: 6, speed: 0.7, shape: 'circle' },
        desert: { radius: 90, strength: 4, speed: 0.5, shape: 'band' },
        underwater: { radius: 300, strength: 2, speed: 0.4, shape: 'screen' }
    },
    normalize(value) {
        if (!value || value.preset === 'none') return null;
        const raw = Object.assign({}, this.presets[value.preset] || this.presets.campfire, value);
        const number = (v, fallback, min, max) => Number.isFinite(Number(v)) ? Math.max(min, Math.min(max, Number(v))) : fallback;
        return { radius: number(raw.radius, 96, 1, 1200), strength: number(raw.strength, 3, 0, 20), speed: number(raw.speed, 1, 0, 5),
            shape: ['circle', 'band', 'screen'].includes(raw.shape) ? raw.shape : 'circle' };
    },
    collect(doodads, display = {}, max = 8) {
        const width = Number(display.width) || 816, height = Number(display.height) || 624;
        const scale = Number(display.scale) || 1, out = [];
        for (const item of doodads || []) {
            const settings = this.normalize(item && item.haze);
            if (!settings || !settings.strength || item.visible === false) continue;
            const point = display.project ? display.project(Number(item.x) || 0, Number(item.y) || 0) : { x: (Number(item.x) || 0) - (Number(display.x) || 0), y: (Number(item.y) || 0) - (Number(display.y) || 0) };
            const radius = settings.radius * scale;
            if (settings.shape === 'band') point.x = width / 2;
            if (settings.shape === 'screen') { point.x = width / 2; point.y = height / 2; }
            if (settings.shape !== 'screen' && (point.y + radius < 0 || point.y - radius > height
                || settings.shape !== 'band' && (point.x + radius < 0 || point.x - radius > width))) continue;
            out.push(Object.assign({}, settings, point, { radius, distance: Math.hypot(point.x - width / 2, point.y - height / 2) }));
        }
        out.sort((a, b) => a.distance - b.distance);
        return out.slice(0, Math.max(0, Math.min(8, Math.floor(Number(max) || 0))));
    },
    uniforms(sources, time, lessMotion, into = {}) {
        const circles = into.uHaze || new Array(32).fill(0), speeds = into.uHazeSpeed || new Array(8).fill(0), shapes = into.uHazeShape || new Array(8).fill(0);
        circles.fill(0); speeds.fill(0); shapes.fill(0);
        sources.slice(0, 8).forEach((source, index) => {
            circles[index * 4] = source.x; circles[index * 4 + 1] = source.y; circles[index * 4 + 2] = source.radius;
            circles[index * 4 + 3] = source.strength * (lessMotion ? 0.5 : 1);
            speeds[index] = source.speed; shapes[index] = source.shape === 'screen' ? 2 : source.shape === 'band' ? 1 : 0;
        });
        return Object.assign(into, { uHaze: circles, uHazeSpeed: speeds, uHazeShape: shapes, uHazeCount: Math.min(8, sources.length), uTime: Number(time) || 0 });
    },
    spriteCentre(sprite, global = true) {
        const frame = sprite.texture && sprite.texture.frame || { width: 0, height: 0 };
        const anchor = sprite.anchor || { x: 0, y: 0 }, scale = sprite.scale || { x: 1, y: 1 }, skew = sprite.skew || { x: 0, y: 0 };
        const angle = Number(sprite.rotation) || 0, dx = (0.5 - anchor.x) * frame.width, dy = (0.5 - anchor.y) * frame.height;
        const x = sprite.x + Math.cos(angle + skew.y) * scale.x * dx - Math.sin(angle - skew.x) * scale.y * dy;
        const y = sprite.y + Math.sin(angle + skew.y) * scale.x * dx + Math.cos(angle - skew.x) * scale.y * dy;
        const parent = global && sprite.parent && sprite.parent.worldTransform;
        return parent ? { x: parent.a * x + parent.c * y + parent.tx, y: parent.b * x + parent.d * y + parent.ty } : { x, y };
    },
    usedInProject() {
        const data = typeof window !== 'undefined' && window.$dataDocsDoodads || {};
        return Object.keys(data).some(key => /^\d+$/.test(key) && Array.isArray(data[key]) && data[key].some(item => item && item.haze && item.haze.preset !== 'none'));
    },
    fragment: fragmentPrecision + `
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec4 inputSize;
uniform vec4 inputClamp;
uniform vec4 outputFrame;
uniform vec4 uHaze[8];
uniform float uHazeSpeed[8];
uniform float uHazeShape[8];
uniform float uHazeCount;
uniform float uTime;
void main(void) {
    vec2 point = outputFrame.xy + vTextureCoord * inputSize.xy;
    vec2 bend = vec2(0.0);
    for (int i = 0; i < 8; i++) {
        if (float(i) < uHazeCount) {
            float distanceToSource = length(point - uHaze[i].xy);
            if (uHazeShape[i] > 0.5) distanceToSource = abs(point.y - uHaze[i].y);
            float weight = 1.0 - smoothstep(0.0, max(1.0, uHaze[i].z), distanceToSource);
            if (uHazeShape[i] > 1.5) weight = 1.0;
            float phase = point.y * 0.12 + uTime * uHazeSpeed[i] * 3.0;
            bend.x += sin(phase + sin(point.x * 0.045 + phase * 0.3)) * uHaze[i].w * weight;
            bend.y += sin(point.x * 0.08 - phase * 0.6) * uHaze[i].w * weight * 0.18;
        }
    }
    gl_FragColor = texture2D(uSampler, clamp(vTextureCoord + bend * inputSize.zw, inputClamp.xy, inputClamp.zw));
}`
};
