// @editor-only
// Conservative defaults for new pictures. Shape alone never identifies an object.
DocsDoodads.Guess = {
    words: {
        lamp: ['lamp', 'lamps', 'lantern', 'lanterns', 'torch', 'torches', 'streetlight'],
        tree: ['tree', 'trees', 'oak', 'pine', 'fir', 'spruce', 'palm'],
        bush: ['bush', 'bushes', 'shrub', 'shrubs', 'hedge'],
        rock: ['rock', 'rocks', 'boulder', 'boulders', 'stone', 'stones'],
        building: ['house', 'houses', 'building', 'buildings', 'hut', 'cottage', 'tower'],
        fence: ['fence', 'fences', 'railing', 'palisade'],
        water: ['water', 'pond', 'puddle', 'river', 'lake'],
        fire: ['fire', 'campfire', 'flame', 'bonfire'],
        sign: ['sign', 'signs', 'signpost']
    },
    fields: ['depth', 'light', 'motion', 'shadow', 'seeThrough', 'collision', 'particles'],
    descriptions: {
        lamp: 'lit after dark', tree: 'gentle sway, see-through and trunk collision',
        bush: 'gentle sway and a solid base', rock: 'a solid base', building: 'a solid base',
        fence: 'a thin wall', water: 'below characters', fire: 'warm light and embers', sign: 'a solid base'
    },
    tokens(text) {
        return String(text || '').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().match(/[\p{L}]+/gu) || [];
    },
    kindOf(asset, extra = {}) {
        const a = asset || {};
        const tokens = new Set(this.tokens([a.name || a.fileName || '', a.folder || '', ...(Array.isArray(a.tags) ? a.tags : [])].join(' ')));
        const matches = Object.keys(this.words).filter(kind => this.words[kind].concat(Array.isArray(extra[kind]) ? extra[kind].slice(0, 100).filter(w => typeof w === 'string' && w.length < 80) : [])
            .some(word => { const parts = this.tokens(word); return parts.length === 1 && tokens.has(parts[0]); }));
        return matches.length === 1 ? matches[0] : null;
    },
    settingsFor(kind) {
        const sway = { type: 'sway', amount: 0.15, speed: 0.7 };
        const collision = preset => ({ preset, shape: null });
        if (kind === 'lamp' || kind === 'fire') return {
            light: Object.assign({}, DocsDoodads.LightPresets.apply({}, kind === 'lamp' ? 'lantern' : 'campfire'), { enabled: true, when: kind === 'lamp' ? 'dark' : 'always' }),
            ...(kind === 'fire' ? { particles: { enabled: true, preset: 'embers' } } : {})
        };
        if (kind === 'tree') return { motion: sway, seeThrough: 'on', collision: collision('trunk') };
        if (kind === 'bush') return { motion: sway, collision: collision('bottomThird') };
        if (['rock', 'building', 'sign'].includes(kind)) return { collision: collision('bottomThird') };
        if (kind === 'fence') return { collision: collision('thinWall') };
        if (kind === 'water') return { depth: 'below' };
        return {};
    },
    kind(asset, extra) {
        if (!asset || (asset.type && asset.type !== 'doodad')) return null;
        if (asset.guess && Object.prototype.hasOwnProperty.call(asset.guess, 'kind')) return Object.prototype.hasOwnProperty.call(this.words, asset.guess.kind) ? asset.guess.kind : null;
        const folder = String(asset.path || '').replace(/\\/g, '/').split('/').slice(0, -1).join('/');
        return this.kindOf(Object.assign({}, asset, { folder: asset.folder || folder }), extra);
    },
    merge(base, own) {
        const out = JSON.parse(JSON.stringify(base));
        for (const key of Object.keys(own || {})) {
            if (['__proto__', 'prototype', 'constructor'].includes(key) || own[key] === undefined) continue;
            const value = own[key];
            out[key] = value && typeof value === 'object' && !Array.isArray(value)
                ? this.merge(out[key] && typeof out[key] === 'object' ? out[key] : {}, value)
                : JSON.parse(JSON.stringify(value));
        }
        return out;
    },
    apply(base, asset, enabled, extra) {
        const guessed = enabled ? this.settingsFor(this.kind(asset, extra)) : {};
        let out = this.merge(base, guessed);
        const p = asset.placement || {}, defaults = p.defaults || {};
        const own = {};
        for (const key of this.fields) if (Object.prototype.hasOwnProperty.call(defaults, key)) own[key] = defaults[key];
        if (DocsDoodads.Depth.modes.includes(p.depth || asset.depth)) own.depth = p.depth || asset.depth;
        // Legacy collision metadata is authored. New entries explicitly mark their initial None.
        if (asset.collision && (asset.collisionUserSet !== false || asset.collision.shape || asset.collision.preset !== 'none')) own.collision = asset.collision;
        out = this.merge(out, own);
        return out;
    }
};
