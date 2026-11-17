//==========================================================
// SECTION 4E: NORMAL-MAP LIGHTING FOR FLAT MAPS
//==========================================================
// Pure rules shared by the runtime and editor. The runtime reads a manifest instead of trying `_n`
// URLs: absent companions therefore never become failed MZ image-cache requests.
DocsDoodads.NormalLight = {
    maxLights: 8,
    manifestPath: 'data/DocsDoodadsNormals.json',
    manifest: { version: 1, normals: {} },
    _generatedSources: new Set(),

    cleanPath(value) {
        const path = String(value || '').replace(/\\/g, '/').replace(/^\.\//, '');
        if (!path || path.startsWith('/') || /^[a-z]:/i.test(path) || path.split('/').includes('..')) return null;
        return path;
    },

    normalPath(value) {
        const path = this.cleanPath(value);
        if (!path || /_n\.png$/i.test(path) || !/\.(png|jpe?g|webp)$/i.test(path)) return null;
        return path.replace(/\.(png|jpe?g|webp)$/i, '_n.png');
    },

    // Normal maps made for a picture (8.3.1) live here, under img/ so MZ's deployment encrypts them with the
    // rest of the art; the asset index ignores the folder as it ignores _packed.
    generatedDir: 'img/doodads/_normals',
    shadeModes: ['made', 'file', 'off'],
    shadeDefaults: { mode: 'made', strength: 1, shape: 'round' },

    // A doodad's Shading: Made for me (a hand-made _n file still wins), From file only, or Off.
    shade(value) {
        const d = this.shadeDefaults, v = value && typeof value === 'object' ? value : {};
        const mode = this.shadeModes.includes(v.mode) ? v.mode : d.mode;
        const strength = Math.round(Math.max(0.25, Math.min(4, Number(v.strength) || d.strength)) * 100) / 100;
        return { mode, strength, shape: v.shape === 'flat' ? 'flat' : 'round' };
    },

    // The frame grid a sprite shows: cell size and where its cells start, so every frame of a strip shares a key.
    gridOf(frame) {
        const w = Math.max(1, Math.round(Number(frame && frame.width) || 1));
        const h = Math.max(1, Math.round(Number(frame && frame.height) || 1));
        const x = Math.round(Number(frame && frame.x) || 0), y = Math.round(Number(frame && frame.y) || 0);
        return { w, h, x: ((x % w) + w) % w, y: ((y % h) + h) % h };
    },

    generatedKey(source, shade, frame) {
        const path = this.cleanPath(source);
        if (!path) return null;
        const s = this.shade(shade), g = this.gridOf(frame);
        return `${path.toLowerCase()}|${s.shape}|${s.strength.toFixed(2)}|${g.w}x${g.h}+${g.x},${g.y}`;
    },

    sourceOfKey(key) {
        const bar = String(key || '').indexOf('|');
        return bar > 0 ? String(key).slice(0, bar) : null;
    },

    cleanGenerated(rows) {
        const clean = {};
        if (!rows || typeof rows !== 'object') return clean;
        const prefix = this.generatedDir.toLowerCase() + '/';
        for (const [key, value] of Object.entries(rows)) {
            const path = this.cleanPath(value), source = this.cleanPath(this.sourceOfKey(key));
            if (!source || String(key).length > 1024 || !path || !/_n\.png$/i.test(path) || !path.toLowerCase().startsWith(prefix)) continue;
            clean[String(key)] = path;
        }
        return clean;
    },

    // The base path for each picture with a made map, for the packed-art check in the game.
    generatedSources(generated) {
        const out = new Set();
        for (const key of Object.keys(generated || {})) out.add(this.sourceOfKey(key));
        return out;
    },

    // Rename/Move keeps a picture's made maps: the file itself does not move, only its key.
    renameGenerated(generated, from, to) {
        const oldPath = this.cleanPath(from), newPath = this.cleanPath(to), out = {};
        for (const [key, value] of Object.entries(generated || {})) {
            if (oldPath && newPath && this.sourceOfKey(key) === oldPath.toLowerCase()) out[newPath.toLowerCase() + key.slice(oldPath.length)] = value;
            else out[key] = value;
        }
        return out;
    },

    // Which normal map a sprite draws with, and the key of a made one that is still missing.
    resolve(source, shade, frame, manifest = this.manifest) {
        const s = this.shade(shade);
        if (s.mode === 'off' || !this.cleanPath(source)) return { path: null, kind: null, key: null };
        const file = this.pathFor(source, manifest);
        if (file || s.mode === 'file') return { path: file, kind: file ? 'file' : null, key: null };
        const key = this.generatedKey(source, s, frame);
        const rows = manifest && manifest.generated;
        const made = key && rows && typeof rows === 'object' ? rows[key] || null : null;
        return { path: made, kind: made ? 'made' : null, key, missing: !made };
    },

    // True when a doodad's picture is drawn with a normal map, so the game keeps it off packed sheets.
    mapsSource(path, data, manifest = this.manifest) {
        const s = this.shade(data && data.shade);
        if (s.mode === 'off') return false;
        if (this.pathFor(path, manifest)) return true;
        if (s.mode === 'file') return false;
        const clean = this.cleanPath(path);
        const sources = manifest === this.manifest && this._generatedSources ? this._generatedSources : this.generatedSources(manifest && manifest.generated);
        return Boolean(clean && sources.has(clean.toLowerCase()));
    },

    manifestFromAssets(assets, generated = this.manifest && this.manifest.generated) {
        const byPath = new Map();
        for (const asset of Object.values(assets || {})) {
            const path = asset && this.cleanPath(asset.path);
            if (path && /\.(png|jpe?g|webp)$/i.test(path)) byPath.set(path.toLowerCase(), asset);
        }
        const normals = {};
        const companions = Array.from(byPath.values()).filter(asset => /_n\.png$/i.test(asset.path || ''));
        companions.sort((a, b) => String(a.path).localeCompare(String(b.path)));
        for (const normal of companions) {
            const stem = String(normal.path).replace(/_n\.png$/i, '');
            let base = null;
            for (const ext of ['.png', '.webp', '.jpg', '.jpeg']) {
                base = byPath.get((stem + ext).toLowerCase());
                if (base) break;
            }
            if (base) normals[String(base.path).toLowerCase()] = String(normal.path);
        }
        const made = this.cleanGenerated(generated);
        return Object.keys(made).length ? { version: 1, normals, generated: made } : { version: 1, normals };
    },

    setManifest(value) {
        const clean = {};
        const rows = value && value.normals && typeof value.normals === 'object' ? value.normals : {};
        for (const [base, normal] of Object.entries(rows)) {
            const b = this.cleanPath(base), n = this.cleanPath(normal);
            if (b && n && /_n\.png$/i.test(n)) clean[b.toLowerCase()] = n;
        }
        const made = this.cleanGenerated(value && value.generated);
        this.manifest = Object.keys(made).length ? { version: 1, normals: clean, generated: made } : { version: 1, normals: clean };
        this._generatedSources = this.generatedSources(made);
        return this.manifest;
    },

    pathFor(value, manifest = this.manifest) {
        const path = this.cleanPath(value);
        const rows = manifest && manifest.normals;
        return path && rows && typeof rows === 'object' ? (rows[path.toLowerCase()] || null) : null;
    },

    effectiveMax(settings, quality = 0) {
        if (!settings || settings.enabled !== true) return 0;
        const wanted = Math.max(1, Math.min(this.maxLights, Math.floor(Number(settings.maxLights) || this.maxLights)));
        const caps = [this.maxLights, 4, 2, 0];
        const cap = caps[Math.max(0, Math.min(3, Math.floor(Number(quality) || 0)))];
        return Math.min(wanted, cap);
    },

    contribution(light, x, y) {
        const radius = Math.max(0, Number(light && light.radius) || 0);
        const intensity = Math.max(0, Number(light && light.intensity) || 0);
        if (!radius || !intensity) return null;
        const dx = (Number(light.x) || 0) - x, dy = (Number(light.y) || 0) - y;
        const distance = Math.hypot(dx, dy);
        if (distance >= radius) return null;
        return { light, distance, score: intensity * (1 - distance / radius) };
    },

    // Highest actual contribution first; distance and original order make ties deterministic.
    pick(lights, x, y, max = this.maxLights) {
        max = Math.max(0, Math.min(this.maxLights, Math.floor(Number(max) || 0)));
        if (!max) return [];
        const candidates = [];
        (lights || []).forEach((light, index) => {
            const row = this.contribution(light, Number(x) || 0, Number(y) || 0);
            if (row) { row.index = index; candidates.push(row); }
        });
        candidates.sort((a, b) => b.score - a.score || a.distance - b.distance || a.index - b.index);
        return candidates.slice(0, max).map(row => row.light);
    },

    channels(color) {
        color = Number(color) || 0;
        return [((color >> 16) & 255) / 255, ((color >> 8) & 255) / 255, (color & 255) / 255];
    },

    // Reuses an existing object/arrays when supplied: normal-mapped scenes do not allocate 200 uniform
    // blocks every frame.
    uniforms(lights, ambient, into = null, intensityFor = null) {
        const out = into || {};
        const pos = out.uLightPosRadius || new Array(this.maxLights * 4).fill(0);
        const color = out.uLightColorIntensity || new Array(this.maxLights * 4).fill(0);
        const cone = out.uLightCone || new Array(this.maxLights * 4).fill(0);
        pos.fill(0); color.fill(0); cone.fill(0);
        const selected = (lights || []).slice(0, this.maxLights);
        selected.forEach((light, i) => {
            const at = i * 4, rgb = this.channels(light.color);
            pos[at] = Number(light.x) || 0; pos[at + 1] = Number(light.y) || 0; pos[at + 2] = Math.max(1, Number(light.radius) || 1);
            color[at] = rgb[0]; color[at + 1] = rgb[1]; color[at + 2] = rgb[2];
            color[at + 3] = Math.max(0, Number(intensityFor ? intensityFor(light) : light.intensity) || 0);
            const angle = (Number(light.angle) || 0) * Math.PI / 180;
            cone[at] = Math.cos(angle); cone[at + 1] = Math.sin(angle);
            cone[at + 2] = Math.cos(Math.max(1, Math.min(359, Number(light.spread) || 60)) * Math.PI / 360);
            cone[at + 3] = light.shape === 'cone' ? 1 : 0;
        });
        out.uLightCount = selected.length;
        out.uLightPosRadius = pos;
        out.uLightColorIntensity = color;
        out.uLightCone = cone;
        out.uAmbient = Array.isArray(out.uAmbient) ? out.uAmbient : [1, 1, 1];
        for (let i = 0; i < 3; i++) out.uAmbient[i] = Math.max(0, Math.min(1, Number(ambient && ambient[i]) || 0));
        return out;
    },

    frameUv(frame, width, height) {
        width = Math.max(1, Number(width) || 1); height = Math.max(1, Number(height) || 1);
        const x = Math.max(0, Math.min(width, Number(frame && frame.x) || 0));
        const y = Math.max(0, Math.min(height, Number(frame && frame.y) || 0));
        const right = Math.max(x, Math.min(width, (Number(frame && frame.x) || 0) + Math.max(0, Number(frame && frame.width) || 0)));
        const bottom = Math.max(y, Math.min(height, (Number(frame && frame.y) || 0) + Math.max(0, Number(frame && frame.height) || 0)));
        return [x / width, y / height, (right - x) / width, (bottom - y) / height];
    },

    // PIXI's NORMAL blend is premultiplied (ONE, ONE_MINUS_SRC_ALPHA).
    alphaWhite(alpha) {
        alpha = Math.max(0, Math.min(1, Number(alpha) || 0));
        return [alpha, alpha, alpha, alpha];
    },

    // One-channel ownership compositing: white means a normal-lit top pixel, black an ordinary one.
    coverageOver(previous, alpha, normal) {
        previous = Math.max(0, Math.min(1, Number(previous) || 0));
        alpha = Math.max(0, Math.min(1, Number(alpha) || 0));
        return (normal ? alpha : 0) + previous * (1 - alpha);
    },

    // The ordinary lightmap already contains each wall mask. Reapply that reachable fraction only to
    // the normal-directed lamp contribution, never to ambient darkness.
    occludedLight(ambient, directional, flat, lightmap) {
        return [0, 1, 2].map(i => {
            const base = Number(ambient && ambient[i]) || 0;
            const possible = Math.max(0.00001, (Number(flat && flat[i]) || 0) - base);
            const reached = Math.max(0, (Number(lightmap && lightmap[i]) || 0) - base);
            const ratio = Math.max(0, Math.min(1, reached / possible));
            return base + ((Number(directional && directional[i]) || 0) - base) * ratio;
        });
    },

    transformUniforms(matrix, frame, anchor, into = {}, lightMatrix = null) {
        matrix = matrix || { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
        const a = Number(matrix.a) || 0, b = Number(matrix.b) || 0, c = Number(matrix.c) || 0, d = Number(matrix.d) || 0;
        const det = a * d - b * c;
        const inv = Math.abs(det) > 0.0000001 ? [d / det, -b / det, -c / det, a / det] : [1, 0, 0, 1];
        const light = lightMatrix || { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
        const la = Number(light.a) || 0, lb = Number(light.b) || 0, lc = Number(light.c) || 0, ld = Number(light.d) || 0;
        const lightDet = la * ld - lb * lc;
        const lightInv = Math.abs(lightDet) > 0.0000001 ? [ld / lightDet, -lb / lightDet, -lc / lightDet, la / lightDet] : [1, 0, 0, 1];
        const ra = lightInv[0] * a + lightInv[2] * b, rb = lightInv[1] * a + lightInv[3] * b;
        const rc = lightInv[0] * c + lightInv[2] * d, rd = lightInv[1] * c + lightInv[3] * d;
        const ax = Math.hypot(ra, rb) || 1, ay = Math.hypot(rc, rd) || 1;
        into.uScreenToLocal = inv;
        into.uSpriteOrigin = [Number(matrix.tx) || 0, Number(matrix.ty) || 0];
        into.uSpriteSize = [Math.max(1, Number(frame && frame.width) || 1), Math.max(1, Number(frame && frame.height) || 1)];
        into.uAnchor = [Number(anchor && anchor.x) || 0, Number(anchor && anchor.y) || 0];
        into.uScreenToLight = lightInv;
        into.uLightOrigin = [Number(light.tx) || 0, Number(light.ty) || 0];
        into.uNormalBasis = [ra / ax, rb / ax, rc / ay, rd / ay];
        return into;
    },

    // Testable counterpart of the fragment's screen-to-sprite mapping.
    localUv(point, uniforms) {
        const deltaX = (Number(point && point.x) || 0) - uniforms.uSpriteOrigin[0];
        const deltaY = (Number(point && point.y) || 0) - uniforms.uSpriteOrigin[1];
        const inverse = uniforms.uScreenToLocal;
        const x = inverse[0] * deltaX + inverse[2] * deltaY;
        const y = inverse[1] * deltaX + inverse[3] * deltaY;
        return [x / uniforms.uSpriteSize[0] + uniforms.uAnchor[0], y / uniforms.uSpriteSize[1] + uniforms.uAnchor[1]];
    },

    lightPoint(point, uniforms) {
        const deltaX = (Number(point && point.x) || 0) - uniforms.uLightOrigin[0];
        const deltaY = (Number(point && point.y) || 0) - uniforms.uLightOrigin[1];
        const inverse = uniforms.uScreenToLight;
        return [inverse[0] * deltaX + inverse[2] * deltaY, inverse[1] * deltaX + inverse[3] * deltaY];
    },

    // A simple height map from alpha and luminance, then Sobel X/Y into a tangent-space normal.
    make(pixels, width, height, strength = 2) {
        width = Number(width); height = Number(height);
        if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width * height > 16777216) {
            throw new Error('Normal-map image size is invalid or too large.');
        }
        if (!pixels || pixels.length < width * height * 4) throw new Error('Normal-map source pixels are incomplete.');
        strength = Math.max(0.05, Math.min(20, Number(strength) || 2));
        const heights = new Float32Array(width * height), out = new Uint8ClampedArray(width * height * 4);
        for (let i = 0; i < heights.length; i++) {
            const at = i * 4, a = pixels[at + 3] / 255;
            heights[i] = a * (0.25 + 0.75 * (pixels[at] * 0.2126 + pixels[at + 1] * 0.7152 + pixels[at + 2] * 0.0722) / 255);
        }
        const sample = (x, y) => heights[Math.max(0, Math.min(height - 1, y)) * width + Math.max(0, Math.min(width - 1, x))];
        for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
            const gx = -sample(x - 1, y - 1) + sample(x + 1, y - 1) - 2 * sample(x - 1, y) + 2 * sample(x + 1, y) - sample(x - 1, y + 1) + sample(x + 1, y + 1);
            const gy = -sample(x - 1, y - 1) - 2 * sample(x, y - 1) - sample(x + 1, y - 1) + sample(x - 1, y + 1) + 2 * sample(x, y + 1) + sample(x + 1, y + 1);
            // The shader flips an OpenGL-style green-up normal into screen-down coordinates. A height
            // that increases down the source therefore encodes +Y, which the shader turns uphill (-Y).
            const nx0 = -gx * strength, ny0 = gy * strength, length = Math.hypot(nx0, ny0, 1);
            const at = (y * width + x) * 4;
            out[at] = Math.round((nx0 / length * 0.5 + 0.5) * 255);
            out[at + 1] = Math.round((ny0 / length * 0.5 + 0.5) * 255);
            out[at + 2] = Math.round((1 / length * 0.5 + 0.5) * 255);
            out[at + 3] = pixels[at + 3];
        }
        return out;
    },

    fragment: `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform sampler2D uNormalMap;
uniform vec4 inputSize;
uniform vec4 outputFrame;
uniform vec4 uNormalUv;
uniform vec4 uNormalBasis;
uniform vec4 uScreenToLocal;
uniform vec2 uSpriteOrigin;
uniform vec2 uSpriteSize;
uniform vec2 uAnchor;
uniform vec4 uScreenToLight;
uniform vec2 uLightOrigin;
uniform sampler2D uLightMap;
uniform vec2 uLightMapSize;
uniform float uUseOcclusion;
uniform vec3 uAmbient;
uniform float uLightCount;
uniform vec4 uLightPosRadius[8];
uniform vec4 uLightColorIntensity[8];
uniform vec4 uLightCone[8];
void main(void) {
    vec4 base = texture2D(uSampler, vTextureCoord);
    vec2 fragmentPixel = outputFrame.xy + vTextureCoord * inputSize.xy;
    vec2 lightDelta = fragmentPixel - uLightOrigin;
    vec2 lightPixel = vec2(uScreenToLight.x * lightDelta.x + uScreenToLight.z * lightDelta.y,
        uScreenToLight.y * lightDelta.x + uScreenToLight.w * lightDelta.y);
    vec2 delta = fragmentPixel - uSpriteOrigin;
    vec2 localUv = vec2(uScreenToLocal.x * delta.x + uScreenToLocal.z * delta.y,
        uScreenToLocal.y * delta.x + uScreenToLocal.w * delta.y) / uSpriteSize + uAnchor;
    localUv = clamp(localUv, 0.0, 1.0);
    vec3 raw = texture2D(uNormalMap, uNormalUv.xy + localUv * uNormalUv.zw).rgb * 2.0 - 1.0;
    vec2 tangent = vec2(raw.x, -raw.y);
    vec2 screenNormal = tangent.x * uNormalBasis.xy + tangent.y * uNormalBasis.zw;
    vec3 normal = normalize(vec3(screenNormal, max(0.001, raw.z)));
    vec3 lightValue = uAmbient;
    vec3 flatLightValue = uAmbient;
    for (int i = 0; i < 8; i++) {
        if (float(i) < uLightCount) {
            vec2 fromLight = lightPixel - uLightPosRadius[i].xy;
            float distanceToLight = length(fromLight);
            float falloff = max(0.0, 1.0 - distanceToLight / uLightPosRadius[i].z);
            float cone = 1.0;
            if (uLightCone[i].w > 0.5 && distanceToLight > 0.001) cone = step(uLightCone[i].z, dot(normalize(fromLight), uLightCone[i].xy));
            vec3 direction = normalize(vec3(-fromLight, uLightPosRadius[i].z * 0.35));
            float diffuse = max(dot(normal, direction), 0.0);
            vec3 energy = uLightColorIntensity[i].rgb * uLightColorIntensity[i].a * falloff * cone;
            flatLightValue += energy;
            lightValue += energy * diffuse;
        }
    }
    lightValue = clamp(lightValue, 0.0, 1.0);
    if (uUseOcclusion > 0.5) {
        vec3 reached = max(texture2D(uLightMap, lightPixel / uLightMapSize).rgb - uAmbient, vec3(0.0));
        vec3 possible = max(flatLightValue - uAmbient, vec3(0.00001));
        vec3 reachRatio = clamp(reached / possible, 0.0, 1.0);
        lightValue = uAmbient + (lightValue - uAmbient) * reachRatio;
    }
    gl_FragColor = vec4(base.rgb * lightValue, base.a);
}`,

    // Draws source alpha as white into the ordinary lightmap: multiplying that result over the map leaves
    // the normal filter's pixels untouched instead of lighting them a second time.
    alphaFragment: `
precision mediump float;
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
void main(void) {
    float alpha = texture2D(uSampler, vTextureCoord).a;
    gl_FragColor = vec4(vec3(alpha), alpha);
}`,

    blackAlphaFragment: `
precision mediump float;
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
void main(void) {
    float alpha = texture2D(uSampler, vTextureCoord).a;
    gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
}`,

    ownershipFragment: `
precision mediump float;
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform sampler2D uCoverage;
void main(void) {
    vec4 light = texture2D(uSampler, vTextureCoord);
    float owned = texture2D(uCoverage, vTextureCoord).r;
    gl_FragColor = vec4(mix(light.rgb, vec3(1.0), owned), light.a);
}`
};
