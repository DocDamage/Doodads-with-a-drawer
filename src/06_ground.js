//==========================================================
// SECTION 4G: THE GROUND BRUSH (8.3.4), THE PURE PART
//==========================================================
// Dirt, grass and stone painted with soft edges, off the grid. A map's painting is one mask picture,
// img/doodads/ground/Map###_ground.png, at a quarter of the map's pixel size, with a channel per texture:
// red, green and blue mix up to three repeating textures (the map's settings name them). Alpha stays opaque:
// browsers premultiply a picture's alpha when it is uploaded, which would spoil the other three channels.
DocsDoodads.Ground = {
    maskScale: 4,
    channels: 3,
    folder: 'img/doodads/ground',

    maskPath(mapId) { return `${this.folder}/Map${String(Math.max(0, Math.floor(Number(mapId) || 0))).padStart(3, '0')}_ground.png`; },

    settings(mapSettings) {
        const g = mapSettings && mapSettings.ground && typeof mapSettings.ground === 'object' ? mapSettings.ground : null;
        if (!g) return null;
        const clean = p => (typeof p === 'string' && /^img\/[^\0]*\.(png|jpe?g|webp)$/i.test(p) && !p.split('/').includes('..') ? p : '');
        const textures = [0, 1, 2].map(i => clean((g.textures || [])[i]));
        return { textures, mask: clean(g.mask), scale: Math.max(0.25, Math.min(8, Number(g.scale) || 1)) };
    },

    maskSize(tilesW, tilesH, tw, th) {
        return { w: Math.max(1, Math.ceil(tilesW * tw / this.maskScale)), h: Math.max(1, Math.ceil(tilesH * th / this.maskScale)) };
    },

    blank(w, h) {
        const data = new Uint8ClampedArray(w * h * 4);
        for (let i = 3; i < data.length; i += 4) data[i] = 255;
        return data;
    },

    // 1 inside the hard part of the brush, easing to 0 at its edge (softness 0 is a hard edge).
    weight(distance, radius, softness = 0.5) {
        if (!(radius > 0) || distance >= radius) return 0;
        const hard = radius * (1 - Math.max(0, Math.min(1, Number(softness) || 0)));
        if (distance <= hard) return 1;
        const t = (distance - hard) / Math.max(1e-6, radius - hard);
        return 1 - t * t * (3 - 2 * t);
    },

    // One dab at (cx, cy) in mask pixels. Painting a channel raises it and lowers the others, so a texture
    // painted over another replaces it; erasing lowers all three. Returns the changed rectangle, or null.
    dab(mask, w, h, cx, cy, radius, options = {}) {
        const channel = Math.max(0, Math.min(this.channels - 1, Math.floor(Number(options.channel) || 0)));
        const strength = Math.max(0, Math.min(1, options.strength === undefined ? 1 : Number(options.strength)));
        const x0 = Math.max(0, Math.floor(cx - radius)), x1 = Math.min(w - 1, Math.ceil(cx + radius));
        const y0 = Math.max(0, Math.floor(cy - radius)), y1 = Math.min(h - 1, Math.ceil(cy + radius));
        if (x0 > x1 || y0 > y1 || !strength) return null;
        let changed = false;
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
            const k = this.weight(Math.hypot(x + 0.5 - cx, y + 0.5 - cy), radius, options.softness) * strength;
            if (!k) continue;
            const at = (y * w + x) * 4;
            for (let c = 0; c < this.channels; c++) {
                const old = mask[at + c];
                const next = options.erase ? old * (1 - k) : c === channel ? old + (255 - old) * k : old * (1 - k);
                mask[at + c] = Math.round(next);
                if (mask[at + c] !== old) changed = true;
            }
            mask[at + 3] = 255;
        }
        return changed ? { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 } : null;
    },

    union(a, b) {
        if (!a) return b ? Object.assign({}, b) : null;
        if (!b) return Object.assign({}, a);
        const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
        return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
    },

    // Undo keeps only the rectangle a stroke changed.
    copyRect(mask, w, rect) {
        const out = new Uint8ClampedArray(rect.w * rect.h * 4);
        for (let y = 0; y < rect.h; y++) out.set(mask.subarray(((rect.y + y) * w + rect.x) * 4, ((rect.y + y) * w + rect.x + rect.w) * 4), y * rect.w * 4);
        return out;
    },

    putRect(mask, w, rect, pixels) {
        for (let y = 0; y < rect.h; y++) mask.set(pixels.subarray(y * rect.w * 4, (y + 1) * rect.w * 4), ((rect.y + y) * w + rect.x) * 4);
        return mask;
    },

    isEmpty(mask) {
        for (let i = 0; i < mask.length; i += 4) if (mask[i] || mask[i + 1] || mask[i + 2]) return false;
        return true;
    },

    vertex: [
        'precision highp float;',
        'attribute vec2 aVertexPosition;',
        'uniform mat3 projectionMatrix;',
        'uniform mat3 translationMatrix;',
        'varying vec2 vMap;',
        'void main() {',
        '    vMap = aVertexPosition;',
        '    gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);',
        '}'
    ].join('\n'),

    // The mask weights three repeating textures; where nothing is painted the tiles show through.
    fragment: [
        'precision mediump float;',
        'varying vec2 vMap;',
        'uniform sampler2D uMask;',
        'uniform vec2 uMapSize;',
        'uniform sampler2D uTex0;',
        'uniform sampler2D uTex1;',
        'uniform sampler2D uTex2;',
        'uniform vec2 uTexSize0;',
        'uniform vec2 uTexSize1;',
        'uniform vec2 uTexSize2;',
        'uniform float uAlpha;',
        'void main() {',
        '    vec3 m = texture2D(uMask, vMap / uMapSize).rgb;',
        '    float total = m.r + m.g + m.b;',
        '    if (total < 0.004) discard;',
        // Textures arrive premultiplied, so a see-through part adds no colour and no cover: the tiles show there.
        '    vec4 c = texture2D(uTex0, fract(vMap / uTexSize0)) * m.r + texture2D(uTex1, fract(vMap / uTexSize1)) * m.g +',
        '        texture2D(uTex2, fract(vMap / uTexSize2)) * m.b;',
        '    float a = min(1.0, total) * uAlpha;',
        '    gl_FragColor = c / total * a;',
        '}'
    ].join('\n')
};
