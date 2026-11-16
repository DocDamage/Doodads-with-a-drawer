//==========================================================
// SECTION 4E: NORMAL-MAP LIGHTING FOR FLAT MAPS
//==========================================================
// Pure rules shared by the runtime and editor. The runtime reads a manifest instead of trying `_n`
// URLs: absent companions therefore never become failed MZ image-cache requests.
DocsDoodads.NormalLight = {
    maxLights: 8,
    manifestPath: 'data/DocsDoodadsNormals.json',
    manifest: { version: 1, normals: {} },

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

    manifestFromAssets(assets) {
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
        return { version: 1, normals };
    },

    setManifest(value) {
        const clean = {};
        const rows = value && value.normals && typeof value.normals === 'object' ? value.normals : {};
        for (const [base, normal] of Object.entries(rows)) {
            const b = this.cleanPath(base), n = this.cleanPath(normal);
            if (b && n && /_n\.png$/i.test(n)) clean[b.toLowerCase()] = n;
        }
        this.manifest = { version: 1, normals: clean };
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
            const nx0 = -gx * strength, ny0 = -gy * strength, length = Math.hypot(nx0, ny0, 1);
            const at = (y * width + x) * 4;
            out[at] = Math.round((nx0 / length * 0.5 + 0.5) * 255);
            out[at + 1] = Math.round((ny0 / length * 0.5 + 0.5) * 255);
            out[at + 2] = Math.round((1 / length * 0.5 + 0.5) * 255);
            out[at + 3] = pixels[at + 3];
        }
        return out;
    },

    fragment: `
precision mediump float;
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform sampler2D uNormalMap;
uniform vec4 inputSize;
uniform vec4 outputFrame;
uniform vec4 uNormalUv;
uniform vec4 uNormalBasis;
uniform vec3 uAmbient;
uniform float uLightCount;
uniform vec4 uLightPosRadius[8];
uniform vec4 uLightColorIntensity[8];
uniform vec4 uLightCone[8];
void main(void) {
    vec4 base = texture2D(uSampler, vTextureCoord);
    vec2 localUv = clamp(vTextureCoord * inputSize.xy / max(outputFrame.zw, vec2(1.0)), 0.0, 1.0);
    vec3 raw = texture2D(uNormalMap, uNormalUv.xy + localUv * uNormalUv.zw).rgb * 2.0 - 1.0;
    vec2 tangent = vec2(raw.x, -raw.y);
    vec2 screenNormal = tangent.x * uNormalBasis.xy + tangent.y * uNormalBasis.zw;
    vec3 normal = normalize(vec3(screenNormal, max(0.001, raw.z)));
    vec2 fragmentPixel = outputFrame.xy + localUv * outputFrame.zw;
    vec3 lightValue = uAmbient;
    for (int i = 0; i < 8; i++) {
        if (float(i) < uLightCount) {
            vec2 fromLight = fragmentPixel - uLightPosRadius[i].xy;
            float distanceToLight = length(fromLight);
            float falloff = max(0.0, 1.0 - distanceToLight / uLightPosRadius[i].z);
            float cone = 1.0;
            if (uLightCone[i].w > 0.5 && distanceToLight > 0.001) cone = step(uLightCone[i].z, dot(normalize(fromLight), uLightCone[i].xy));
            vec3 direction = normalize(vec3(-fromLight, uLightPosRadius[i].z * 0.35));
            float diffuse = max(dot(normal, direction), 0.0);
            lightValue += uLightColorIntensity[i].rgb * uLightColorIntensity[i].a * diffuse * falloff * cone;
        }
    }
    gl_FragColor = vec4(base.rgb * clamp(lightValue, 0.0, 1.0), base.a);
}`,

    // Draws source alpha as white into the ordinary lightmap: multiplying that result over the map leaves
    // the normal filter's pixels untouched instead of lighting them a second time.
    alphaFragment: `
precision mediump float;
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
void main(void) {
    float alpha = texture2D(uSampler, vTextureCoord).a;
    gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
}`
};
